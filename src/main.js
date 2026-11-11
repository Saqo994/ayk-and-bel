import Phaser from 'phaser';
import { GAME_W, GAME_H, WORLD } from './config.js';
import { PARAMS } from './params.js';
import Boot from './scenes/Boot.js';
import Game from './scenes/Game.js';
import UI from './scenes/UI.js';
import GameOver from './scenes/GameOver.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#000000',
  pixelArt: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: WORLD.gravity }, debug: PARAMS.debug },
  },
  scene: [Boot, Game, UI, GameOver],
});

window.__game = game;
