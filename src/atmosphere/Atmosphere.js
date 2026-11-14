import Phaser from 'phaser';
import { GAME_W, GAME_H, WIND } from '../config.js';
import { addNormalMap } from '../normals.js';
import { SHEETS } from '../sprites.js';

// Полоса облаков с плавно исчезающим нижним краем (и без мусора у верхней кромки картинки).
export function fadedStrip(scene, key) {
  const out = key + '-fade';
  if (scene.textures.exists(out)) return out;
  const img = scene.textures.get(key).getSourceImage();
  const cut = 16;
  const t = scene.textures.createCanvas(out, img.width, img.height - cut);
  const g = t.getContext();
  g.drawImage(img, 0, -cut);
  g.globalCompositeOperation = 'destination-out';
  const grd = g.createLinearGradient(0, 0, 0, img.height - cut);
  grd.addColorStop(0.35, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = grd;
  g.fillRect(0, 0, img.width, img.height - cut);
  t.refresh();
  return out;
}

// Строит по настройкам уровня фон (параллакс), частицы, свет, цветокоррекцию и виньетку.
export default class Atmosphere {
  constructor(scene, cfg, level) {
    this.scene = scene;
    this.cfg = cfg;
    this.tiles = [];
    this.glows = [];
    this.wind = { state: 'calm', until: 0 };

    this.buildSky();
    let depth = -90;
    for (const l of cfg.layers || []) this.addLayer(l, depth++);
    if (cfg.haze) this.addHaze(cfg.haze, depth++);
    if (cfg.front) {
      // рамка увеличена (zoom), чтобы закрывать только края экрана и не мешать игре
      const z = cfg.front.zoom ?? 1;
      scene.add.image(GAME_W / 2, GAME_H / 2 + (cfg.front.dy ?? 0), cfg.front.key).setDisplaySize(GAME_W * z, GAME_H * z).setScrollFactor(0)
        .setDepth(80).setTint(cfg.front.tint ?? 0x404040).setAlpha(cfg.front.alpha ?? 1);
    }
    if (cfg.grade) {
      scene.add.rectangle(0, 0, GAME_W, GAME_H, cfg.grade.color, cfg.grade.alpha).setOrigin(0).setScrollFactor(0)
        .setDepth(90).setBlendMode(Phaser.BlendModes[cfg.grade.blend || 'NORMAL']);
    }
    this.flash = scene.add.rectangle(0, 0, GAME_W, GAME_H, 0xdfe8ff, 0).setOrigin(0).setScrollFactor(0).setDepth(89).setBlendMode(Phaser.BlendModes.ADD);
    scene.add.image(0, 0, 'vignette').setOrigin(0).setDisplaySize(GAME_W, GAME_H).setScrollFactor(0).setDepth(91).setAlpha(cfg.vignette ?? 0.5);
    if (cfg.saturation && scene.cameras.main.postFX) scene.cameras.main.postFX.addColorMatrix().saturate(cfg.saturation);

    // свет: общий (ambient) затемняет мир, факелы и свет возле героя освещают его рядом
    this.light = cfg.light || null;
    if (this.light) scene.lights.enable().setAmbientColor(this.light.ambient);
    for (const p of cfg.particles || []) this.addParticles(p);
    for (const t of level.torches || []) this.addTorch(t.x, t.y);
    if (cfg.lightning) this.nextBolt = scene.time.now + 2500;
  }

  buildSky() {
    const { scene, cfg } = this;
    const sky = cfg.sky || {};
    if (sky.gradient) {
      const key = 'sky-grad-' + sky.gradient.join('');
      if (!scene.textures.exists(key)) {
        const t = scene.textures.createCanvas(key, 16, 512);
        const g = t.getContext();
        const grd = g.createLinearGradient(0, 0, 0, 512);
        sky.gradient.forEach((c, i) => grd.addColorStop(i / (sky.gradient.length - 1), c));
        g.fillStyle = grd;
        g.fillRect(0, 0, 16, 512);
        t.refresh();
      }
      scene.add.image(0, 0, key).setOrigin(0).setDisplaySize(GAME_W, GAME_H).setScrollFactor(0).setDepth(-100);
    } else if (sky.key) {
      scene.add.image(0, 0, sky.key).setOrigin(0).setDisplaySize(GAME_W, GAME_H).setScrollFactor(0).setDepth(-100).setTint(sky.tint ?? 0xffffff);
    }
    if (sky.strip) {
      // полоса облаков у верхнего края, медленно плывёт
      const key = fadedStrip(scene, sky.strip.key);
      const tex = scene.textures.get(key).getSourceImage();
      const s = sky.strip.scale ?? 1.6;
      const ts = scene.add.tileSprite(0, 0, GAME_W, tex.height * s, key).setOrigin(0).setScrollFactor(0).setDepth(-99).setAlpha(sky.strip.alpha ?? 0.9);
      ts.setTileScale(s, s);
      this.tiles.push({ ts, factor: 0.01, scale: s, drift: 6 });
    }
  }

  addLayer(l, depth) {
    const scene = this.scene;
    if (l.band !== undefined) {
      // простая цветная полоса от высоты top до низа экрана (например, зелёные предгорья)
      scene.add.rectangle(0, l.top, GAME_W, GAME_H - l.top, l.band, l.alpha ?? 1).setOrigin(0).setScrollFactor(0).setDepth(depth);
      return;
    }
    const tex = scene.textures.get(l.key).getSourceImage();
    const s = l.scale ?? 1;
    if (l.single) {
      scene.add.image(l.x ?? 0, l.bottom, l.key).setOrigin(0, 1).setScale(s).setScrollFactor(l.factor, 0).setDepth(depth)
        .setTint(l.tint ?? 0xffffff).setAlpha(l.alpha ?? 1);
      return;
    }
    const ts = scene.add.tileSprite(0, l.bottom, GAME_W, tex.height * s, l.key).setOrigin(0, 1).setScrollFactor(0).setDepth(depth)
      .setTint(l.tint ?? 0xffffff).setAlpha(l.alpha ?? 1);
    ts.setTileScale(s, s);
    this.tiles.push({ ts, factor: l.factor, scale: s, drift: l.drift || 0 });
    if (l.fill !== undefined) {
      // заливка под слоем, чтобы снизу не просвечивало небо
      scene.add.rectangle(0, l.bottom - 1, GAME_W, GAME_H - l.bottom + 1, l.fill).setOrigin(0).setScrollFactor(0).setDepth(depth);
    }
  }

  // Дымка между фоном и местом, где идёт игра: внизу гуще, кверху исчезает.
  // Фон за ней кажется дальше, а герой и платформы — ближе (воздушная перспектива).
  addHaze(h, depth) {
    const scene = this.scene;
    if (!scene.textures.exists('haze')) {
      // размер нарочно не степень двойки: иначе видеокарта «заворачивает» низ картинки наверх и видна полоса
      const t = scene.textures.createCanvas('haze', 10, 250);
      const g = t.getContext();
      const grd = g.createLinearGradient(0, 0, 0, 250);
      grd.addColorStop(0, 'rgba(255,255,255,0)');
      grd.addColorStop(0.08, 'rgba(255,255,255,0)');
      grd.addColorStop(0.3, 'rgba(255,255,255,0.08)');
      grd.addColorStop(0.65, 'rgba(255,255,255,0.5)');
      grd.addColorStop(1, 'rgba(255,255,255,1)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 10, 250);
      t.refresh();
    }
    scene.add.image(0, h.top, 'haze').setOrigin(0).setDisplaySize(GAME_W, GAME_H - h.top).setScrollFactor(0).setDepth(depth)
      .setTint(h.color).setAlpha(h.alpha);
  }

  addParticles(p) {
    const scene = this.scene;
    const full = { x: { min: 0, max: GAME_W }, y: { min: 0, max: GAME_H } };
    let e;
    if (p.type === 'dust') {
      e = scene.add.particles(0, 0, 'dot', {
        ...full, lifespan: 6000, speedX: { min: -70, max: -20 }, speedY: { min: -14, max: 14 },
        scale: { min: 0.12, max: 0.45 }, alpha: { start: p.alpha ?? 0.35, end: 0 }, tint: p.tint ?? 0xffd9a0, frequency: 90, blendMode: 'ADD',
      });
    } else if (p.type === 'pollen') {
      e = scene.add.particles(0, 0, 'dot', {
        ...full, lifespan: 7000, speedX: { min: 10, max: 50 }, speedY: { min: -30, max: 5 },
        scale: { min: 0.1, max: 0.28 }, alpha: { start: 0.55, end: 0 }, tint: p.tint ?? 0xfff6c8, frequency: 140,
      });
    } else if (p.type === 'snow') {
      e = scene.add.particles(0, 0, 'dot', {
        x: { min: -100, max: GAME_W + 900 }, y: -20, lifespan: 5200, speedX: { min: -90, max: -20 }, speedY: { min: 170, max: 330 },
        scale: { min: 0.14, max: 0.42 }, alpha: { start: 0.9, end: 0.5 }, frequency: 28, quantity: 2,
      });
      this.snow = e;
    } else if (p.type === 'rain') {
      e = scene.add.particles(0, 0, 'streak', {
        x: { min: 0, max: GAME_W + 500 }, y: -30, lifespan: 800, speedX: -420, speedY: { min: 1500, max: 1800 },
        rotate: 15, alpha: 0.28, tint: 0xbfd0e8, frequency: 16, quantity: 4,
      });
    }
    if (e) e.setScrollFactor(0).setDepth(p.depth ?? 70);
  }

  // факел: стойка, пламя-свечение и искры
  addTorch(x, y) {
    const scene = this.scene;
    scene.add.rectangle(x, y, 10, 120, 0x2a1a10).setOrigin(0.5, 1).setDepth(15);
    scene.add.rectangle(x, y - 120, 30, 14, 0x3a2414).setOrigin(0.5, 1).setDepth(15);
    const flame = scene.add.image(x, y - 150, 'glow').setScale(0.3, 0.45).setTint(0xffc060).setBlendMode('ADD').setDepth(16);
    const halo = scene.add.image(x, y - 150, 'glow').setScale(2.4).setTint(0xff7a20).setBlendMode('ADD').setDepth(56).setAlpha(0.3);
    const L = this.light && this.light.torch;
    const lamp = L ? scene.lights.addLight(x, y - 150, L.radius, L.color, L.intensity) : null;
    this.glows.push({ flame, halo, lamp, x, seed: x * 0.37 });
    scene.add.particles(x, y - 150, 'dot', {
      lifespan: 1100, speedY: { min: -160, max: -70 }, speedX: { min: -30, max: 30 }, scale: { start: 0.22, end: 0 },
      tint: 0xffa040, blendMode: 'ADD', frequency: 180,
    }).setDepth(16);
  }

  // Включает освещение у объектов мира (земля, платформы, опоры, декорации, герой, враги).
  // Фон и рамка переднего плана не освещаются — они далеко. Вызывается, когда уровень построен.
  applyLights(player) {
    const L = this.light;
    if (!L) return;
    const scene = this.scene;
    const t0 = performance.now();
    const C = Phaser.Display.Color;
    const amb = C.IntegerToColor(L.ambient);
    for (const o of scene.children.list) {
      if (o.scrollFactorX !== 1 || o.blendMode !== Phaser.BlendModes.NORMAL) continue;
      if (o.type === 'Image' || o.type === 'Sprite' || o.type === 'TileSprite') {
        o.setPipeline('Light2D');
        addNormalMap(scene, o.texture.key);
      } else if (o.type === 'Graphics') o.setPipeline('Light2D');
      else if (o.type === 'Rectangle' && o.isFilled) {
        // простые прямоугольники (заливка под землёй) свет не принимают — затемняем их цвет вручную
        const c = C.IntegerToColor(o.fillColor);
        o.fillColor = C.GetColor((c.red * amb.red) / 255, (c.green * amb.green) / 255, (c.blue * amb.blue) / 255);
      }
    }
    // враги и Бел меняют листы анимации на ходу — рельеф нужен и для тех листов, что сейчас не показаны
    for (const key of Object.keys(SHEETS)) if (scene.textures.exists(key)) addNormalMap(scene, key);
    this.lightSetupMs = Math.round(performance.now() - t0); // для проверки: сколько заняла подготовка света
    if (L.sun) this.sun = scene.lights.addLight(L.sun.x, L.sun.y, L.sun.radius, L.sun.color, L.sun.intensity);
    if (L.player) {
      this.player = player;
      this.playerLamp = scene.lights.addLight(player.x, player.y - 150, L.player.radius, L.player.color, L.player.intensity);
    }
  }

  lightning() {
    const scene = this.scene;
    this.flash.setAlpha(0.55);
    if (this.light) {
      // молния на миг заливает мир светом
      const C = Phaser.Display.Color;
      const from = C.IntegerToColor(0xffffff);
      const to = C.IntegerToColor(this.light.ambient);
      const a = { v: 0 };
      scene.lights.setAmbientColor(0xffffff);
      scene.tweens.add({
        targets: a, v: 100, duration: 700, ease: 'Quad.easeOut',
        onUpdate: () => {
          const c = C.Interpolate.ColorWithColor(from, to, 100, a.v);
          scene.lights.setAmbientColor(C.GetColor(c.r, c.g, c.b));
        },
      });
    }
    scene.tweens.add({ targets: this.flash, alpha: 0, duration: 420, ease: 'Quad.easeOut' });
    scene.time.delayedCall(90, () => this.flash.setAlpha(0.4));
    if (scene.game.sfx) scene.time.delayedCall(350, () => scene.game.sfx.play('thunder'));
  }

  update(time) {
    const scene = this.scene;
    const sx = scene.cameras.main.scrollX;
    for (let i = 0; i < this.tiles.length; i++) {
      const t = this.tiles[i];
      t.ts.tilePositionX = (sx * t.factor + (t.drift ? (time / 1000) * t.drift : 0)) / t.scale;
    }
    for (let i = 0; i < this.glows.length; i++) {
      const g = this.glows[i];
      if (Math.abs(g.x - sx - GAME_W / 2) > GAME_W) continue;
      const f = 0.85 + 0.15 * Math.sin(time * 0.021 + g.seed) * Math.sin(time * 0.013 + g.seed * 2);
      g.flame.setScale(0.3 * f, 0.45 * f);
      g.halo.setAlpha(0.3 * f);
      if (g.lamp) g.lamp.intensity = this.light.torch.intensity * f;
    }
    if (this.cfg.lightning && time > this.nextBolt) {
      this.nextBolt = time + Phaser.Math.Between(5000, 11000);
      this.lightning();
    }
    if (this.cfg.wind) this.updateWind(time);
    if (this.playerLamp) this.playerLamp.setPosition(this.player.x, this.player.y - 150);
    if (this.sun) this.sun.setPosition(sx + this.light.sun.x, this.light.sun.y);
  }

  // ветер: затишье → предупреждение (снег ускоряется) → порыв
  updateWind(time) {
    const w = this.wind;
    const scene = this.scene;
    if (time < w.until) return;
    if (w.state === 'calm') {
      w.state = 'warn';
      w.until = time + WIND.warnMs;
      if (this.snow) this.snow.gravityX = -1400;
      if (scene.game.sfx) scene.game.sfx.play('gust');
      scene.events.emit('wind-warn');
    } else if (w.state === 'warn') {
      w.state = 'gust';
      w.until = time + WIND.gustMs;
      if (this.snow) this.snow.gravityX = -3600;
      scene.windSpeed = -WIND.push;
    } else {
      w.state = 'calm';
      w.until = time + WIND.calmMs;
      if (this.snow) this.snow.gravityX = 0;
      scene.windSpeed = 0;
    }
  }
}
