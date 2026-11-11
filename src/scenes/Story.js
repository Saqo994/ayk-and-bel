import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { FONT } from './UI.js';
import { t } from '../i18n.js';

// Короткие заставки между уровнями: легенда об Айке и Беле своими словами (по Мовсесу Хоренаци).
// Заставка i показывается перед уровнем i + 1; последняя — после победы над Белом.
// Сами тексты лежат в src/i18n.js (на русском и английском).

export default class Story extends Phaser.Scene {
  constructor() {
    super('Story');
  }

  create(data) {
    const STORY = t('story');
    const i = Phaser.Math.Clamp(data.i ?? 0, 0, STORY.length - 1);
    this.cameras.main.setBackgroundColor('#000000');
    if (this.game.sfx) this.game.sfx.ambient(null);
    const text = this.add.text(GAME_W / 2, GAME_H / 2 - 40, STORY[i], {
      fontFamily: FONT, fontSize: 54, color: '#e8dcc0', align: 'center', lineSpacing: 22, wordWrap: { width: 1400 },
    }).setOrigin(0.5).setAlpha(0);
    const hint = this.add.text(GAME_W / 2, GAME_H - 130, t('anyKey'), { fontFamily: FONT, fontSize: 34, color: '#8f8468' }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: text, alpha: 1, duration: 1200 });
    this.tweens.add({ targets: hint, alpha: 1, duration: 600, delay: 1500 });

    this.time.delayedCall(900, () => {
      this.input.keyboard.once('keydown', () => {
        this.cameras.main.fadeOut(700, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          if (i >= STORY.length - 1) this.scene.start('Ending');
          else this.scene.start('Game', { level: i + 1, coins: data.coins ?? 0 });
        });
      });
    });
    this.events.once('shutdown', () => {
      window.__sceneReady = null;
    });
    window.__sceneReady = 'Story';
  }
}
