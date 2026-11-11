import Phaser from 'phaser';
import { GAME_W, GAME_H, WORLD, CAMERA, PLAYER, CRUMBLE } from '../config.js';
import { PARAMS } from '../params.js';
import { LEVELS, LAST_LEVEL } from '../levels/index.js';
import { ATMOSPHERE } from '../atmosphere/index.js';
import Atmosphere from '../atmosphere/Atmosphere.js';
import Player from '../entities/Player.js';
import Arrows from '../entities/Arrows.js';
import Enemy from '../entities/Enemy.js';
import Boss from '../entities/Boss.js';
import { writeSave, loadSave } from '../save.js';

const BOTTOM = GAME_H + 400;

// Главная сцена: строит уровень из данных и ведёт игру.
export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.levelId = LEVELS[data.level] ? data.level : 1;
    this.cpIndex = data.cp ?? -1;
    this.coins = data.coins ?? 0;
  }

  preload() {
    const atm = ATMOSPHERE[this.levelId];
    if (!atm) return;
    const text = this.add.text(GAME_W / 2, GAME_H / 2, 'Загрузка…', { fontFamily: 'Georgia, serif', fontSize: 44, color: '#d8c9a0' }).setOrigin(0.5);
    for (const [key, path] of Object.entries(atm.assets)) {
      if (!this.textures.exists(key)) this.load.image(key, 'assets/' + path);
    }
    this.load.once('complete', () => text.destroy());
  }

  create() {
    const level = (this.level = LEVELS[this.levelId]);
    const atm = (this.atm = ATMOSPHERE[this.levelId] || null);
    this.art = atm ? atm.art : null;
    this.surface = atm ? atm.surface : 'stone';
    this.god = false;
    this.windSpeed = 0;
    this.over = false;
    this.finished = false;
    this.cpCoins = this.coins;
    this.lookX = 0;

    this.physics.world.setBounds(0, -600, level.width, BOTTOM + 900);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.cameras.main.setBounds(0, 0, level.width, GAME_H);
    if (atm) this.atmo = new Atmosphere(this, atm, level);
    else this.cameras.main.setBackgroundColor('#3b4654');

    this.solids = this.physics.add.staticGroup();
    for (const g of level.ground) this.addGround(g);
    for (const p of level.platforms || []) this.addPlatform(p);
    for (const p of level.props || []) {
      this.add.image(p.x, p.y, p.k).setOrigin(0.5, 1).setScale(p.s ?? 1).setDepth(p.d ?? 10).setFlipX(!!p.flip)
        .setTint(p.tint ?? (this.art && this.art.propTint) ?? 0xffffff).setAlpha(p.a ?? 1);
    }

    for (const w of level.water || []) {
      this.add.rectangle(w.x, w.y ?? 960, w.w, BOTTOM, 0x3f7fa8, 0.85).setOrigin(0).setDepth(18);
      this.add.rectangle(w.x, w.y ?? 960, w.w, 10, 0xcfeaf5, 0.7).setOrigin(0).setDepth(18);
    }

    this.buildCheckpoints();
    this.buildPickups();
    this.buildHazards();

    const sp = this.spawnPoint();
    this.player = new Player(this, sp.x, sp.y);
    this.player.setCollideWorldBounds(true);
    this.arrows = new Arrows(this);
    this.enemyArrows = new Arrows(this, 16, 0xff9080);
    // обязательно физическая группа: с обычной группой столкновения стрел и героя с врагами не проверяются
    this.enemies = this.physics.add.group();
    for (const e of level.enemies || []) {
      if (this.cpIndex >= 0 && e.x < sp.x - 300) continue; // пройденных врагов не возвращаем
      this.enemies.add(new Enemy(this, e, this.surfaceRange(e)));
    }
    this.buildBoss();

    this.physics.add.collider(this.player, this.solids, (pl, s) => {
      if (pl.body.bottom <= s.body.top + 10) {
        pl.groundObj = s;
        if (s.crumble && !s.crumbling) this.startCrumble(s);
      }
    });
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.arrows.group, this.solids, (a) => this.arrows.stick(a));
    this.physics.add.collider(this.enemyArrows.group, this.solids, (a) => this.enemyArrows.stick(a));
    this.physics.add.overlap(this.arrows.group, this.enemies, (a, e) => {
      if (a.stuck || a.spent || e.dead || !e.harmful) return;
      e.hit(a);
      this.arrows.kill(a);
    });
    this.physics.add.overlap(this.player, this.enemyArrows.group, (pl, a) => {
      if (a.stuck) return;
      if (pl.hurt(1, a.x - a.body.velocity.x)) this.enemyArrows.kill(a);
    });
    this.physics.add.overlap(this.player, this.enemies, (pl, e) => {
      if (e.harmful) pl.hurt(1, e.x);
    });
    this.physics.add.overlap(this.player, this.hazards, (pl, h) => pl.hurt(1, h.x));
    this.physics.add.overlap(this.player, this.pickups, (pl, p) => this.collect(p));

    const cam = this.cameras.main;
    cam.startFollow(this.player, false, CAMERA.lerp, 1);
    cam.centerOn(this.player.x, GAME_H / 2);
    cam.fadeIn(500);

    this.scene.launch('UI', { name: level.name, intro: this.cpIndex < 0 });
    if (this.game.sfx) this.game.sfx.ambient(atm ? atm.ambient : null);
    if (this.levelId >= 1 && this.levelId > loadSave().level) writeSave({ level: this.levelId });

    if (PARAMS.debug) this.setupDebug();
    this.events.once('shutdown', () => {
      window.__sceneReady = null;
    });
    window.__sceneReady = 'Game';
  }

  // ---------- постройка уровня ----------

  addSolid(x, y, w, h, opts) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(z, true);
    Object.assign(z, opts);
    this.solids.add(z);
    return z;
  }

  addGround(g) {
    this.addSolid(g.x, g.y, g.w, BOTTOM - g.y, { ice: g.ice, surface: g.ice ? 'ice' : g.surface });
    const art = this.art;
    if (!art) {
      this.add.rectangle(g.x, g.y, g.w, BOTTOM - g.y, g.ice ? 0x9fc6d8 : 0x6f7782).setOrigin(0).setDepth(20).setStrokeStyle(4, 0x2a2f36);
      return;
    }
    const t = art.ground;
    const src = this.textures.get(t.tex).getSourceImage();
    const s = t.scale;
    const step = src.width * s * (1 - (t.overlap ?? 0));
    for (let x = g.x; x < g.x + g.w; x += step) {
      const im = this.add.image(x, g.y, t.tex).setOrigin(0, t.top).setScale(s).setDepth(20).setTint(g.ice ? 0xcfe6ff : art.tint ?? 0xffffff);
      const over = x + src.width * s - (g.x + g.w);
      if (over > 0) im.setCrop(0, 0, src.width - over / s, src.height);
    }
    const bodyH = src.height * s * (1 - t.top);
    this.add.rectangle(g.x, g.y + bodyH * 0.45, g.w, BOTTOM - g.y, t.fill).setOrigin(0).setDepth(19);
    if (art.snow) this.addSnow(g.x, g.y, g.w, 21);
    if (g.ice) this.add.rectangle(g.x, g.y - 3, g.w, 14, 0xd8f0ff, 0.75).setOrigin(0).setDepth(21);
  }

  addPlatform(p) {
    const art = this.art;
    const a = art ? art.plats[p.k] : null;
    const inset = a ? p.w * (a.inset ?? 0.03) : 0;
    // сплошной блок (solid) твёрдый на всю высоту картинки, обычная платформа — только сверху
    let bodyH = 34;
    if (p.solid && a) {
      const im = this.textures.get(a.tex).getSourceImage();
      bodyH = im.height * (p.w / im.width) * (1 - a.top);
    }
    const z = this.addSolid(p.x + inset, p.y, p.w - inset * 2, bodyH, { ice: p.ice, crumble: p.crumble, surface: p.ice ? 'ice' : (a && a.surface) || p.surface });
    if (!p.solid) z.body.checkCollision.down = z.body.checkCollision.left = z.body.checkCollision.right = false;
    const vis = [];
    if (!a) {
      const col = p.ice ? 0x9fc6d8 : p.crumble ? 0x8a7a5a : 0x8a929c;
      vis.push(this.add.rectangle(p.x, p.y, p.w, 40, col).setOrigin(0).setDepth(20).setStrokeStyle(4, 0x2a2f36));
    } else {
      const src = this.textures.get(a.tex).getSourceImage();
      const im = this.add.image(p.x, p.y, a.tex).setOrigin(0, a.top).setScale(p.w / src.width).setDepth(p.d ?? 22)
        .setTint(p.ice ? 0xcfe6ff : p.crumble ? art.crumbleTint ?? 0xc9b89a : art.tint ?? 0xffffff).setFlipX(!!p.flip);
      vis.push(im);
      if (art.snow && !a.noSnow) vis.push(this.addSnow(p.x + inset, p.y, p.w - inset * 2, 23));
      if (p.ice) vis.push(this.add.rectangle(p.x + inset, p.y - 3, p.w - inset * 2, 12, 0xd8f0ff, 0.8).setOrigin(0).setDepth(23));
    }
    if (p.crumble) vis.push(this.addCracks(p.x + inset, p.y, p.w - inset * 2));
    z.vis = vis;
    for (const v of vis) v.homeY = v.y;
  }

  // трещины на плите, которая обвалится, — чтобы игрок видел её заранее
  addCracks(x, y, w) {
    const g = this.add.graphics().setDepth(24);
    for (let i = 0; i < 3; i++) {
      let cx = x + w * (0.2 + i * 0.3);
      let cy = y - 4;
      g.lineStyle(4, 0x050505, 0.85).beginPath().moveTo(cx, cy);
      for (let k = 0; k < 4; k++) {
        cx += ((i + k) % 2 ? 1 : -1) * (7 + ((i * 5 + k * 3) % 6));
        cy += 9;
        g.lineTo(cx, cy);
      }
      g.strokePath();
      g.lineStyle(2, 0x050505, 0.7).lineBetween(cx, cy - 18, cx + (i % 2 ? 14 : -14), cy - 8);
    }
    return g;
  }

  // снежная шапка, нарисованная кодом
  addSnow(x, y, w, depth) {
    const g = this.add.graphics().setDepth(depth);
    g.fillStyle(0xeef4fb, 1).fillRoundedRect(x, y - 9, w, 20, 9);
    g.fillStyle(0xcfdcec, 1).fillRoundedRect(x + 6, y + 5, w - 12, 8, 4);
    return g;
  }

  startCrumble(s) {
    s.crumbling = true;
    if (this.game.sfx) this.game.sfx.play('crumble');
    // пыль и крошка сыплются из-под плиты
    if (!this.crumbleDust) {
      this.crumbleDust = this.add.particles(0, 0, 'dot', {
        emitting: false, lifespan: 700, speedY: { min: 60, max: 260 }, speedX: { min: -50, max: 50 },
        scale: { start: 0.4, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: 0xc8b89c,
      }).setDepth(25);
    }
    for (let i = 0; i < 6; i++) this.crumbleDust.emitParticleAt(s.body.left + (s.body.width * (i + 0.5)) / 6, s.body.top + 30, 3);
    this.tweens.add({ targets: s.vis, x: '+=5', duration: 45, yoyo: true, repeat: Math.floor(CRUMBLE.delayMs / 90) });
    this.time.delayedCall(CRUMBLE.delayMs, () => {
      s.body.enable = false;
      this.tweens.add({ targets: s.vis, y: '+=500', alpha: 0, duration: 700, ease: 'Quad.easeIn' });
    });
    this.time.delayedCall(CRUMBLE.delayMs + CRUMBLE.respawnMs, () => {
      s.body.enable = true;
      s.crumbling = false;
      for (const v of s.vis) v.y = v.homeY;
      this.tweens.add({ targets: s.vis, alpha: 1, duration: 300 });
    });
  }

  // по какому отрезку может ходить враг: его платформа, не дальше roam от места появления
  surfaceRange(e) {
    const roam = e.roam ?? (e.type === 'deer' ? 1400 : 450);
    let x1 = e.x - roam;
    let x2 = e.x + roam;
    const all = this.level.ground.concat(this.level.platforms || []);
    for (const s of all) {
      if (Math.abs(s.y - e.y) < 8 && e.x >= s.x && e.x <= s.x + s.w) {
        x1 = Math.max(x1, s.x + 55);
        x2 = Math.min(x2, s.x + s.w - 55);
      }
    }
    return [x1, x2];
  }

  buildCheckpoints() {
    this.cps = (this.level.checkpoints || []).map((c, i) => {
      this.add.rectangle(c.x, c.y, 9, 190, 0x3d2a18).setOrigin(0.5, 1).setDepth(24);
      const flag = this.add.rectangle(c.x + 5, c.y - 186, 74, 84, 0x6b6b6b).setOrigin(0, 0).setDepth(24);
      const cp = { ...c, flag, on: false };
      if (i <= this.cpIndex) this.lightCheckpoint(cp, true);
      return cp;
    });
  }

  lightCheckpoint(cp, silent) {
    cp.on = true;
    cp.flag.setFillStyle(0xa3271c);
    if (silent) return;
    this.tweens.add({ targets: cp.flag, scaleX: 0.7, duration: 160, yoyo: true, repeat: 2 });
    if (this.game.sfx) this.game.sfx.play('checkpoint');
  }

  buildPickups() {
    this.pickups = this.physics.add.staticGroup();
    for (const p of this.level.pickups || []) {
      const im = this.pickups.create(p.x, p.y, p.type).setDepth(40).setScale(p.type === 'heart' ? 1.5 : 1.15);
      im.kind = p.type;
      im.refreshBody();
      this.tweens.add({ targets: im, y: p.y - 10, duration: 900 + (p.x % 300), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  buildHazards() {
    this.hazards = this.physics.add.staticGroup();
    for (const h of this.level.hazards || []) {
      const im = this.hazards.create(h.x, h.y + 6, h.type).setOrigin(0.5, 1).setScale(h.s ?? 1.2).setDepth(30);
      if (this.art && this.art.propTint) im.setTint(this.art.propTint);
      im.refreshBody();
      im.body.setSize(im.displayWidth * 0.6, im.displayHeight * 0.6);
      im.body.position.set(im.x - im.displayWidth * 0.3, im.y - im.displayHeight * 0.62);
    }
  }

  buildBoss() {
    this.boss = null;
    const d = this.level.boss;
    if (!d) return;
    const boss = (this.boss = new Boss(this, d));
    this.physics.add.collider(boss, this.solids);
    this.physics.add.overlap(this.arrows.group, boss, (a, b) => boss.onArrow(a.onArrow ? b : a));
    this.physics.add.overlap(this.player, boss, (pl) => {
      if (!boss.dead) pl.hurt(1, boss.x);
    });
    this.physics.add.overlap(this.player, boss.waves, (pl, w) => pl.hurt(1, w.x));
  }

  // вход на арену: стена сзади и камера останавливается на арене
  lockArena(d) {
    this.addSolid(d.arenaX - 60, -600, 60, BOTTOM + 600, {});
    const cam = this.cameras.main;
    const box = { x: Math.min(cam.scrollX, d.arenaX) };
    this.tweens.add({
      targets: box, x: d.arenaX, duration: 900, ease: 'Sine.easeInOut',
      onUpdate: () => cam.setBounds(box.x, 0, d.arenaX + d.arenaW - box.x, GAME_H),
    });
  }

  onBossDefeated() {
    this.finished = false;
    this.bossDown = true;
    this.player.invulnUntil = this.time.now + 60000;
    const list = this.enemies.getChildren().slice();
    for (const e of list) if (!e.dead) e.die();
    for (const a of this.enemyArrows.group.getChildren()) if (a.active) this.enemyArrows.kill(a);
  }

  collect(p) {
    if (p.kind === 'heart') {
      if (this.player.hp >= PLAYER.maxHp) return;
      this.player.hp++;
    } else {
      this.coins++;
      if (this.coins % PLAYER.coinsPerHeart === 0) this.coinReward();
    }
    if (this.game.sfx) this.game.sfx.play(p.kind === 'heart' ? 'heart' : 'coin');
    this.tweens.killTweensOf(p);
    p.destroy();
  }

  // награда за каждые 50 монет: сердце (одно можно носить сверх трёх)
  coinReward() {
    const pl = this.player;
    if (pl.hp < PLAYER.maxHp + 1) pl.hp++;
    if (this.game.sfx) this.game.sfx.play('heart');
    const t = this.add.text(pl.x, pl.y - 240, '+1 сердце', { fontFamily: 'Georgia, serif', fontSize: 44, color: '#ffd75e', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(95);
    this.tweens.add({ targets: t, y: t.y - 90, alpha: 0, duration: 1400, onComplete: () => t.destroy() });
  }

  // ---------- жизнь, смерть, переходы ----------

  spawnPoint() {
    const c = this.level.checkpoints || [];
    return this.cpIndex >= 0 && c[this.cpIndex] ? c[this.cpIndex] : this.level.start;
  }

  onPlayerHp() {
    if (this.player.hp <= 0) this.gameOver();
  }

  gameOver() {
    if (this.over || this.finished || this.bossDown) return;
    this.over = true;
    this.player.frozen = true;
    this.player.setTint(0x884444);
    this.cameras.main.fadeOut(700, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UI');
      this.scene.start('GameOver', { level: this.levelId, cp: this.cpIndex, coins: this.cpCoins });
    });
  }

  fellInPit() {
    const pl = this.player;
    if (!this.god) pl.hp--;
    if (pl.hp <= 0) {
      this.gameOver();
      return;
    }
    const sp = this.spawnPoint();
    pl.place(sp.x, sp.y - 4);
    pl.invulnUntil = this.time.now + 1500;
    if (this.game.sfx) this.game.sfx.play('hurt');
    this.cameras.main.centerOn(sp.x, GAME_H / 2);
    this.cameras.main.flash(300, 0, 0, 0);
    if (this.boss && this.boss.onPlayerRespawn) this.boss.onPlayerRespawn();
  }

  finish() {
    if (this.finished || this.over) return;
    this.finished = true;
    this.player.frozen = true;
    if (this.levelId >= 1 && this.levelId < LAST_LEVEL) writeSave({ level: Math.max(loadSave().level, this.levelId + 1) });
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('UI');
      if (this.scene.get('Story') && this.levelId >= 1) this.scene.start('Story', { i: this.levelId, coins: this.coins });
      else this.scene.start('Game', { level: LEVELS[this.levelId + 1] ? this.levelId + 1 : this.levelId });
    });
  }

  setupDebug() {
    const kb = this.input.keyboard;
    ['ONE', 'TWO', 'THREE', 'FOUR'].forEach((k, i) => {
      kb.on('keydown-' + k, () => {
        if (!LEVELS[i + 1]) return;
        this.scene.stop('UI');
        this.scene.start('Game', { level: i + 1 });
      });
    });
    kb.on('keydown-G', () => {
      this.god = !this.god;
      this.dbg.setText(this.dbgText());
    });
    this.dbg = this.add.text(20, GAME_H - 44, this.dbgText(), { fontSize: 24, color: '#ffffff', backgroundColor: '#000000aa' }).setScrollFactor(0).setDepth(200);
  }

  dbgText() {
    return `ОТЛАДКА  1–4: уровень   G: неуязвимость ${this.god ? 'ВКЛ' : 'выкл'}`;
  }

  update(time, delta) {
    const pl = this.player;
    pl.update(time, delta);
    this.arrows.update(time);
    this.enemyArrows.update(time);

    const list = this.enemies.getChildren();
    const camX = this.cameras.main.scrollX;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      // далёкие враги стоят и ждут
      if (e.x > camX - 500 && e.x < camX + GAME_W + 500) e.update(time, pl);
      else if (e.body.enable) e.body.setVelocityX(0);
    }
    if (this.boss) this.boss.update(time, delta);

    // камера смотрит немного вперёд
    this.lookX += (-pl.facing * CAMERA.lookAhead - this.lookX) * 0.03;
    this.cameras.main.setFollowOffset(this.lookX, 0);

    // чекпоинты
    for (let i = this.cpIndex + 1; i < this.cps.length; i++) {
      const c = this.cps[i];
      if (!c.on && Math.abs(pl.x - c.x) < 70 && Math.abs(pl.y - c.y) < 200) {
        this.cpIndex = i;
        this.cpCoins = this.coins;
        for (let j = 0; j <= i; j++) if (!this.cps[j].on) this.lightCheckpoint(this.cps[j], j < i);
      }
    }

    if (pl.y > WORLD.killY && !this.over) this.fellInPit();
    if (!this.level.boss && pl.x >= this.level.exitX) this.finish();
    if (this.atmo) this.atmo.update(time);
  }
}
