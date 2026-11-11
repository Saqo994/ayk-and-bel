import Phaser from 'phaser';
import { GAME_W, GAME_H, PLAYER } from '../config.js';
import { t } from '../i18n.js';

export const FONT = 'Georgia, "Times New Roman", serif';

// Интерфейс поверх игры: сердца, счёт монет, название уровня, полоса босса, пауза.
export default class UI extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create(data) {
    this.gameScene = this.scene.get('Game');
    this.hearts = [];
    for (let i = 0; i < PLAYER.maxHp; i++) {
      this.hearts.push(this.add.image(70 + i * 84, 70, 'heart').setScale(1.7));
    }
    // четвёртое, «запасное» сердце — награда за монеты
    this.bonus = this.add.image(70 + PLAYER.maxHp * 84, 70, 'heart').setScale(1.7).setTint(0xffd75e).setVisible(false);
    this.add.image(GAME_W - 300, 70, 'coin').setScale(1.2);
    this.coinText = this.add.text(GAME_W - 260, 70, '0', { fontFamily: FONT, fontSize: 48, color: '#f3e3b0', stroke: '#000', strokeThickness: 6 }).setOrigin(0, 0.5);
    this.shownHp = -1;
    this.shownCoins = -1;

    // название уровня при входе
    if (data.intro && data.name) {
      const t = this.add.text(GAME_W / 2, 300, data.name, { fontFamily: FONT, fontSize: 96, color: '#f3e3b0', stroke: '#000', strokeThickness: 8 }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 800, hold: 1800, yoyo: true, onComplete: () => t.destroy() });
    }

    // полоса здоровья босса
    this.bossBox = this.add.container(GAME_W / 2, 150).setVisible(false);
    this.bossBox.add(this.add.rectangle(0, 0, 908, 34, 0x000000, 0.7).setStrokeStyle(3, 0xb08a3c));
    this.bossFill = this.add.rectangle(-450, 0, 900, 26, 0xa3271c).setOrigin(0, 0.5);
    this.bossBox.add(this.bossFill);
    this.bossBox.add(this.add.text(0, -44, t('boss'), { fontFamily: FONT, fontSize: 40, color: '#e9c46a', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5));

    // пауза
    this.pauseBox = this.add.container(0, 0).setVisible(false).setDepth(10);
    this.pauseBox.add(this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.65).setOrigin(0));
    this.pauseBox.add(this.add.text(GAME_W / 2, 430, t('pause'), { fontFamily: FONT, fontSize: 110, color: '#f3e3b0' }).setOrigin(0.5));
    this.pauseBox.add(this.add.text(GAME_W / 2, 580, t('pauseHint'), { fontFamily: FONT, fontSize: 40, color: '#d8c9a0' }).setOrigin(0.5));
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-M', () => {
      if (!this.pauseBox.visible || !this.scene.get('Menu')) return;
      this.scene.stop('Game');
      this.scene.start('Menu');
    });
  }

  togglePause() {
    const g = this.gameScene;
    if (g.over || g.finished) return;
    if (this.scene.isPaused('Game')) {
      this.scene.resume('Game');
      this.pauseBox.setVisible(false);
    } else {
      this.scene.pause('Game');
      this.pauseBox.setVisible(true);
    }
  }

  update() {
    const g = this.gameScene;
    if (!g.player) return;
    if (g.player.hp !== this.shownHp) {
      this.shownHp = g.player.hp;
      this.hearts.forEach((h, i) => h.setAlpha(i < this.shownHp ? 1 : 0.22).setTint(i < this.shownHp ? 0xffffff : 0x000000));
      this.bonus.setVisible(this.shownHp > PLAYER.maxHp);
    }
    if (g.coins !== this.shownCoins) {
      this.shownCoins = g.coins;
      this.coinText.setText(`${g.coins % PLAYER.coinsPerHeart} / ${PLAYER.coinsPerHeart}`);
    }
    const b = g.boss;
    const show = !!(b && b.active && b.awake);
    if (show !== this.bossBox.visible) this.bossBox.setVisible(show);
    if (show) this.bossFill.width = 900 * Math.max(0, b.hp / b.maxHp);
  }
}
