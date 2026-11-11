import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { PARAMS } from '../params.js';
import { FONT } from './UI.js';
import { t } from '../i18n.js';

// Экран проигрыша: «Заново» возвращает к последнему чекпоинту с полными сердцами.
export default class GameOver extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data) {
    const level = data.level ?? PARAMS.level ?? 1;
    this.cameras.main.setBackgroundColor('#0b0706');
    this.cameras.main.fadeIn(500);
    this.add.text(GAME_W / 2, 380, t('over.title'), { fontFamily: FONT, fontSize: 130, color: '#b9382c' }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 520, t('over.sub'), { fontFamily: FONT, fontSize: 44, color: '#d8c9a0' }).setOrigin(0.5);
    const again = this.add.text(GAME_W / 2, 700, t('over.again'), { fontFamily: FONT, fontSize: 56, color: '#f3e3b0' }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 790, t('over.menu'), { fontFamily: FONT, fontSize: 38, color: '#8f8468' }).setOrigin(0.5);
    this.tweens.add({ targets: again, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
    if (this.game.sfx) this.game.sfx.ambient(null);

    const restart = () => this.scene.start('Game', { level, cp: data.cp ?? -1, coins: data.coins ?? 0 });
    this.time.delayedCall(400, () => {
      this.input.keyboard.once('keydown-ENTER', restart);
      this.input.keyboard.once('keydown-SPACE', restart);
      this.input.keyboard.once('keydown-M', () => this.scene.start(this.scene.get('Menu') ? 'Menu' : 'Game', { level }));
    });
    this.events.once('shutdown', () => {
      window.__sceneReady = null;
    });
    window.__sceneReady = 'GameOver';
  }
}
