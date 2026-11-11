import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { FONT } from './UI.js';

// Короткие заставки между уровнями: легенда об Айке и Беле своими словами (по Мовсесу Хоренаци).
// Заставка i показывается перед уровнем i + 1; последняя — после победы над Белом.
export const STORY = [
  'В Вавилоне воцарился исполин Бел и велел всем народам поклоняться ему как богу.\nАйк, могучий лучник из рода Торгома, не склонил перед ним головы.',
  'Айк собрал сыновей, внуков и весь свой род — около трёхсот мужей — и увёл их из Вавилона на север, в холодные горы.',
  'За перевалами открылась страна у подножия Арарата, и Айк поселил в ней свой род.\nНо гонцы Бела нашли его и здесь: «Покорись — и живи в мире».',
  'Айк ответил отказом. Тогда Бел повёл на север несметное войско.\nУ берега солёного озера, в горной долине, сошлись два исполина.',
  'Стрела из широкого лука Айка пробила бронзовый доспех Бела, и тиран пал, а войско его бежало.\nДолину с тех пор зовут Айоц-Дзор, а страну по имени Айка — Айк.',
];

export default class Story extends Phaser.Scene {
  constructor() {
    super('Story');
  }

  create(data) {
    const i = Phaser.Math.Clamp(data.i ?? 0, 0, STORY.length - 1);
    this.cameras.main.setBackgroundColor('#000000');
    if (this.game.sfx) this.game.sfx.ambient(null);
    const text = this.add.text(GAME_W / 2, GAME_H / 2 - 40, STORY[i], {
      fontFamily: FONT, fontSize: 54, color: '#e8dcc0', align: 'center', lineSpacing: 22, wordWrap: { width: 1400 },
    }).setOrigin(0.5).setAlpha(0);
    const hint = this.add.text(GAME_W / 2, GAME_H - 130, 'Нажмите любую клавишу', { fontFamily: FONT, fontSize: 34, color: '#8f8468' }).setOrigin(0.5).setAlpha(0);
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
