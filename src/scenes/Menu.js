import Phaser from 'phaser';
import { GAME_W, GAME_H, AUDIO } from '../config.js';
import { loadSave, writeSave } from '../save.js';
import { FONT } from './UI.js';
import { fadedStrip } from '../atmosphere/Atmosphere.js';
import { t, getLang, setLang, LANGS } from '../i18n.js';

// Главное меню. Готового menu-bg.jpg пока нет — фон собран из слоёв Арарата и портрета Айка.
export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  preload() {
    const A = 'assets/';
    const img = { 'a-far': 'ararat/ararat-far.png', 'a-strip': 'ararat/ararat-sky-strip.png', 'a-mid': 'ararat/ararat-mid.png', 'hayk-idle': 'hayk/hayk-idle.png' };
    for (const [k, p] of Object.entries(img)) if (!this.textures.exists(k)) this.load.image(k, A + p);
    if (!this.cache.audio.exists('menu-theme')) this.load.audio('menu-theme', [A + 'menu/menu-theme.ogg', A + 'menu/menu-theme.mp3']);
  }

  create() {
    this.save = loadSave();
    this.busy = false;
    if (this.game.sfx) this.game.sfx.ambient(null);

    // фон: небо градиентом, облака, Арарат, холмы, Айк
    const sky = this.textures.createCanvas('menu-sky' + Date.now(), 16, 512);
    const g = sky.getContext();
    const grd = g.createLinearGradient(0, 0, 0, 512);
    [[0, '#2b3f6b'], [0.45, '#b9824f'], [0.75, '#e8c58a'], [1, '#6a5a3a']].forEach(([p, c]) => grd.addColorStop(p, c));
    g.fillStyle = grd;
    g.fillRect(0, 0, 16, 512);
    sky.refresh();
    this.add.image(0, 0, sky.key).setOrigin(0).setDisplaySize(GAME_W, GAME_H);
    this.clouds = this.add.tileSprite(0, 0, GAME_W, 124 * 2.4, fadedStrip(this, 'a-strip')).setOrigin(0).setTileScale(2.4).setAlpha(0.7).setTint(0xffc79a);
    this.mount = this.add.image(GAME_W * 0.58, 860, 'a-far').setOrigin(0.5, 1).setScale(1.75).setTint(0xffd2b0);
    this.add.rectangle(0, 840, GAME_W, 240, 0x4a4630).setOrigin(0);
    this.hills = this.add.tileSprite(0, 1010, GAME_W, 218 * 2, 'a-mid').setOrigin(0, 1).setTileScale(2).setTint(0x8a7a5a);
    this.add.rectangle(0, 1000, GAME_W, 80, 0x2a2618).setOrigin(0);
    this.hero = this.add.image(1500, 1090, 'hayk-idle').setOrigin(0.5, 1).setScale(0.95).setFlipX(true).setTint(0xffe6cc);
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0xff9a5c, 0.22).setOrigin(0).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.add.particles(0, 0, 'dot', {
      x: { min: 0, max: GAME_W }, y: { min: 0, max: GAME_H }, lifespan: 7000, speedX: { min: 15, max: 60 }, speedY: { min: -12, max: 12 },
      scale: { min: 0.1, max: 0.4 }, alpha: { start: 0.4, end: 0 }, tint: 0xffe0b0, frequency: 110, blendMode: 'ADD',
    });
    this.add.image(0, 0, 'vignette').setOrigin(0).setDisplaySize(GAME_W, GAME_H).setAlpha(0.7);

    this.title = this.add.text(150, 170, '', { fontFamily: FONT, fontSize: 170, color: '#f3e3b0', stroke: '#1a0f08', strokeThickness: 12 });
    this.subtitle = this.add.text(160, 370, '', { fontFamily: FONT, fontSize: 46, color: '#e0c890', stroke: '#1a0f08', strokeThickness: 6 });
    this.hint = this.add.text(160, GAME_H - 90, '', { fontFamily: FONT, fontSize: 34, color: '#d8c9a0', stroke: '#000', strokeThickness: 5 });

    this.texts = [];
    for (let i = 0; i < 4; i++) {
      this.texts.push(this.add.text(170, 520 + i * 96, '', { fontFamily: FONT, fontSize: 66, color: '#f3e3b0', stroke: '#1a0f08', strokeThickness: 8 }));
    }
    this.mode = 'main';
    this.sel = 0;
    this.redraw();

    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-S', () => this.move(1));
    kb.on('keydown-LEFT', () => this.change(-1));
    kb.on('keydown-A', () => this.change(-1));
    kb.on('keydown-RIGHT', () => this.change(1));
    kb.on('keydown-D', () => this.change(1));
    kb.on('keydown-ENTER', () => this.choose());
    kb.on('keydown-SPACE', () => this.choose());
    kb.on('keydown-ESC', () => {
      if (this.mode === 'settings') this.setMode('main');
    });

    // музыка — только после первого нажатия игрока (так требуют браузеры)
    this.music = this.sound.add('menu-theme', { loop: true, volume: 0 });
    const start = () => {
      if (!this.scene.isActive() || this.busy) return;
      this.music.play();
      this.tweens.add({ targets: this.music, volume: this.save.music, duration: AUDIO.fadeMs });
    };
    if (this.sound.locked) this.sound.once('unlocked', start);
    else start();

    this.cameras.main.fadeIn(600);
    this.events.once('shutdown', () => {
      this.music.stop();
      this.music.destroy();
      window.__sceneReady = null;
    });
    window.__sceneReady = 'Menu';
  }

  items() {
    if (this.mode === 'settings') {
      const pct = (v) => `◂ ${Math.round(v * 100)}% ▸`;
      return [`${t('menu.music')}  ${pct(this.save.music)}`, `${t('menu.sfx')}  ${pct(this.save.sfx)}`, `${t('menu.lang')}  ◂ ${t('langName')} ▸`, t('menu.back')];
    }
    return [t('menu.start'), this.save.level > 1 ? t('menu.continueLevel', this.save.level) : t('menu.continue'), t('menu.settings')];
  }

  redraw() {
    const items = this.items();
    this.title.setText(t('title'));
    this.subtitle.setText(t('subtitle'));
    this.texts.forEach((tx, i) => {
      tx.setVisible(i < items.length);
      if (i >= items.length) return;
      const dim = this.mode === 'main' && i === 1 && this.save.level <= 1;
      tx.setText((i === this.sel ? '▸ ' : '   ') + items[i]);
      tx.setColor(i === this.sel ? '#ffd75e' : dim ? '#8f8468' : '#f3e3b0');
    });
    this.hint.setText(t(this.mode === 'settings' ? 'hint.settings' : 'hint.main'));
  }

  setMode(mode) {
    this.mode = mode;
    this.sel = 0;
    this.redraw();
  }

  move(d) {
    if (this.busy) return;
    const n = this.items().length;
    this.sel = (this.sel + d + n) % n;
    if (this.game.sfx) this.game.sfx.play('ui');
    this.redraw();
  }

  // влево/вправо в настройках: громкость или язык
  change(d) {
    if (this.busy || this.mode !== 'settings' || this.sel > 2) return;
    if (this.sel === 2) {
      const i = LANGS.indexOf(getLang());
      setLang(LANGS[(i + d + LANGS.length) % LANGS.length]);
      this.save = loadSave();
      if (this.game.sfx) this.game.sfx.play('ui');
      this.redraw();
      return;
    }
    const key = this.sel === 0 ? 'music' : 'sfx';
    const v = Phaser.Math.Clamp(Math.round((this.save[key] + d * 0.1) * 10) / 10, 0, 1);
    this.save = writeSave({ [key]: v });
    if (this.game.sfx) {
      this.game.sfx.setVolumes(this.save.music, this.save.sfx);
      this.game.sfx.play(key === 'sfx' ? 'coin' : 'ui');
    }
    if (this.music.isPlaying) this.music.setVolume(this.save.music);
    this.redraw();
  }

  choose() {
    if (this.busy) return;
    if (this.mode === 'settings') {
      if (this.sel === 3) this.setMode('main');
      else if (this.sel === 2) this.change(1);
      return;
    }
    if (this.sel === 2) {
      this.setMode('settings');
      return;
    }
    if (this.sel === 1 && this.save.level <= 1) return;
    this.busy = true;
    if (this.game.sfx) this.game.sfx.play('checkpoint');
    this.tweens.add({ targets: this.music, volume: 0, duration: 900 });
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (this.sel === 0) this.scene.start('Story', { i: 0 });
      else this.scene.start('Story', { i: this.save.level - 1 });
    });
  }

  update(time) {
    // лёгкое оживление: плывут облака, медленно дышит камера
    this.clouds.tilePositionX = time * 0.004;
    this.hills.tilePositionX = Math.sin(time * 0.00012) * 30;
    this.mount.x = GAME_W * 0.58 + Math.sin(time * 0.00012) * 14;
    this.hero.x = 1500 - Math.sin(time * 0.00012) * 24;
  }
}
