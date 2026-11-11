import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import { writeSave } from '../save.js';
import { FONT } from './UI.js';
import { LANGS, LANG_NAMES, getLang, setLang } from '../i18n.js';

// Выбор языка при первом запуске игры. Потом язык меняется в «Настройках» меню.
export default class Lang extends Phaser.Scene {
  constructor() {
    super('Lang');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0806');
    this.cameras.main.fadeIn(500);
    this.add.image(0, 0, 'vignette').setOrigin(0).setDisplaySize(GAME_W, GAME_H).setAlpha(0.8);
    this.add.text(GAME_W / 2, 250, 'Язык  ·  Language  ·  Լեզու', { fontFamily: FONT, fontSize: 60, color: '#d8c9a0' }).setOrigin(0.5);
    this.sel = Math.max(0, LANGS.indexOf(getLang()));
    this.texts = LANGS.map((l, i) => this.add.text(GAME_W / 2, 440 + i * 120, '', { fontFamily: FONT, fontSize: 84, color: '#f3e3b0' }).setOrigin(0.5));
    this.add.text(GAME_W / 2, GAME_H - 130, '↑ ↓      Enter', { fontFamily: FONT, fontSize: 40, color: '#8f8468' }).setOrigin(0.5);
    this.redraw();

    const kb = this.input.keyboard;
    const move = (d) => {
      this.sel = (this.sel + d + LANGS.length) % LANGS.length;
      if (this.game.sfx) this.game.sfx.play('ui');
      this.redraw();
    };
    kb.on('keydown-UP', () => move(-1));
    kb.on('keydown-W', () => move(-1));
    kb.on('keydown-DOWN', () => move(1));
    kb.on('keydown-S', () => move(1));
    const choose = () => {
      if (this.done) return;
      this.done = true;
      setLang(LANGS[this.sel]);
      writeSave({ langChosen: true });
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Menu'));
    };
    kb.on('keydown-ENTER', choose);
    kb.on('keydown-SPACE', choose);

    this.events.once('shutdown', () => {
      window.__sceneReady = null;
    });
    window.__sceneReady = 'Lang';
  }

  redraw() {
    this.texts.forEach((tx, i) => {
      tx.setText((i === this.sel ? '▸ ' : '') + LANG_NAMES[LANGS[i]]);
      tx.setColor(i === this.sel ? '#ffd75e' : '#f3e3b0');
    });
  }
}
