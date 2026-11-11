import Phaser from 'phaser';
import { PARAMS } from '../params.js';
import Sfx from '../audio/Sfx.js';
import { STYLE } from '../config.js';

// Загружает общие ассеты (герой, враги, предметы) и рисует кодом служебные текстуры.
export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const A = 'assets/';
    this.load.spritesheet('hayk', A + 'hayk/hayk-sheet.png', { frameWidth: 200, frameHeight: 196 });
    this.load.image('arrow', A + 'hayk/arrow.png');
    for (const k of ['coin', 'heart']) this.load.image(k, A + `pickups/${k}.png`);
    for (const k of ['spearman', 'bel', 'wolf-1', 'wolf-2', 'boar', 'bear', 'deer']) this.load.image(k, A + `enemies/${k}.png`);
    for (const k of ['wooden-stakes', 'iron-spikes', 'palisade']) this.load.image(k, A + `hazards/${k}.png`);
  }

  create() {
    this.makeTextures();
    this.muteColors();
    this.game.sfx = new Sfx(this.game);
    this.anims.create({ key: 'hayk-run', frames: this.anims.generateFrameNumbers('hayk', { frames: [1, 2, 3, 4, 5, 6, 7, 9, 10] }), frameRate: 14, repeat: -1 });

    if (PARAMS.scene && this.scene.get(PARAMS.scene)) this.scene.start(PARAMS.scene, { i: PARAMS.i });
    else if (PARAMS.level !== null) this.scene.start('Game', { level: PARAMS.level, cp: PARAMS.cp ? PARAMS.cp - 1 : -1 });
    else this.scene.start('Menu');
  }

  // Перерисовывает яркие спрайты приглушёнными (один раз при запуске, на скорость игры не влияет).
  muteColors() {
    const keys = ['hayk', 'coin', 'heart', 'wolf-1', 'wolf-2', 'boar', 'bear', 'deer', 'wooden-stakes', 'palisade'];
    for (const key of keys) {
      const img = this.textures.get(key).getSourceImage();
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext('2d');
      g.filter = `saturate(${STYLE.saturation}) brightness(${STYLE.brightness})`;
      g.drawImage(img, 0, 0);
      this.textures.remove(key);
      if (key === 'hayk') this.textures.addSpriteSheet(key, c, { frameWidth: 200, frameHeight: 196 });
      else this.textures.addCanvas(key, c);
    }
  }

  radial(key, size, stops) {
    const t = this.textures.createCanvas(key, size, size);
    const g = t.getContext();
    const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [p, c] of stops) grd.addColorStop(p, c);
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    t.refresh();
  }

  makeTextures() {
    // белый квадратик
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff).fillRect(0, 0, 8, 8).generateTexture('px', 8, 8);
    g.clear().fillStyle(0xffffff).fillRect(0, 0, 3, 28).generateTexture('streak', 3, 28);
    g.destroy();
    // мягкая точка для частиц, свечение, тень
    this.radial('dot', 32, [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
    this.radial('glow', 256, [[0, 'rgba(255,255,255,0.9)'], [0.35, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
    this.radial('shadow', 128, [[0, 'rgba(0,0,0,0.75)'], [0.6, 'rgba(0,0,0,0.4)'], [1, 'rgba(0,0,0,0)']]);
    // виньетка: прозрачный центр, тёмные края
    const v = this.textures.createCanvas('vignette', 480, 270);
    const c = v.getContext();
    c.save();
    c.scale(1, 270 / 480);
    const grd = c.createRadialGradient(240, 240, 130, 240, 240, 345);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = grd;
    c.fillRect(0, 0, 480, 480);
    c.restore();
    v.refresh();
  }
}
