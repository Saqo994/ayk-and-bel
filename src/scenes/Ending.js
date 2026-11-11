import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { FONT } from './UI.js';

// Финальный экран и титры (источники ассетов — из CREDITS.md).
const CREDITS = [
  ['Айк и Бел', 120, '#f3e3b0'],
  ['Род Айка обрёл свою землю у подножия Арарата.', 48, '#e8dcc0'],
  ['', 60],
  ['По мотивам «Истории Армении» Мовсеса Хоренаци', 44, '#d8c9a0'],
  ['', 40],
  ['Графика', 40, '#b08a3c'],
  ['сгенерирована автором в Gemini и других генераторах изображений', 40, '#e8dcc0'],
  ['', 30],
  ['Музыка главного меню', 40, '#b08a3c'],
  ['предоставлена автором', 40, '#e8dcc0'],
  ['', 30],
  ['Звуки уровней', 40, '#b08a3c'],
  ['временные, собраны кодом', 40, '#e8dcc0'],
  ['', 30],
  ['Сделано на Phaser 3', 40, '#d8c9a0'],
  ['', 80],
  ['Спасибо за игру', 64, '#f3e3b0'],
];

export default class Ending extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0806');
    this.cameras.main.fadeIn(1200);
    if (this.game.sfx) this.game.sfx.ambient('meadow');
    const box = this.add.container(0, 0);
    let y = 0;
    for (const [line, size, color] of CREDITS) {
      if (line) box.add(this.add.text(GAME_W / 2, y, line, { fontFamily: FONT, fontSize: size, color: color || '#fff' }).setOrigin(0.5, 0));
      y += size + 26;
    }
    box.y = 260;
    // титры медленно поднимаются и останавливаются, когда последняя строка в центре экрана
    this.tweens.add({ targets: box, y: Math.min(260, GAME_H / 2 - y), duration: 16000, delay: 2500, ease: 'Sine.easeInOut' });
    this.add.image(0, 0, 'vignette').setOrigin(0).setDisplaySize(GAME_W, GAME_H).setAlpha(0.8);
    const hint = this.add.text(GAME_W / 2, GAME_H - 60, 'Enter — в главное меню', { fontFamily: FONT, fontSize: 32, color: '#8f8468' }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 1, duration: 800, delay: 3000 });
    this.time.delayedCall(1500, () => {
      this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Menu'));
    });
    this.events.once('shutdown', () => {
      window.__sceneReady = null;
    });
    window.__sceneReady = 'Ending';
  }
}
