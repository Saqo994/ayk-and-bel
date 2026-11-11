import { coins, coinArc } from './helpers.js';

// Уровень 4 — Айоц-Дзор. Первая половина — прорыв через войско Бела, вторая — арена с Белом.
const G = 900;
const ARENA_X = 9700; // левый край арены
const ARENA_W = 2200;

export default {
  id: 4,
  name: 'Айоц-Дзор',
  width: ARENA_X + ARENA_W,
  start: { x: 220, y: G },
  exitX: 99999, // уровень заканчивается победой над Белом
  ground: [
    { x: 0, w: 1700, y: G },
    { x: 1980, w: 1500, y: G },
    { x: 4100, w: 1800, y: G },
    { x: 6200, w: 1500, y: G },
    { x: 8300, w: 3600, y: G },
  ],
  platforms: [
    { x: 700, y: 740, w: 360, k: 'h5' },
    { x: 1250, y: 690, w: 330, k: 'h9' },
    { x: 2700, y: 700, w: 330, k: 'h3' },
    { x: 3560, y: 780, w: 300, k: 'h9' },
    { x: 3850, y: 700, w: 240, k: 'h2' },
    { x: 4700, y: 730, w: 380, k: 'h1' },
    { x: 5250, y: 690, w: 330, k: 'h3' },
    { x: 6800, y: 700, w: 330, k: 'h9' },
    { x: 7780, y: 820, w: 240, k: 'h2' },
    { x: 8050, y: 760, w: 240, k: 'h2' },
    { x: 8800, y: 730, w: 360, k: 'h6' },
    // уступы арены: нижние по краям, верхние обваливаются — долго стоять нельзя
    { x: ARENA_X + 80, y: 720, w: 230, k: 'h2' },
    { x: ARENA_X + 370, y: 560, w: 300, k: 'h5', crumble: true },
    { x: ARENA_X + 800, y: 560, w: 260, k: 'h5', crumble: true },
    { x: ARENA_X + 1180, y: 560, w: 260, k: 'h5', crumble: true },
    { x: ARENA_X + 1560, y: 560, w: 300, k: 'h5', crumble: true },
    { x: ARENA_X + 1920, y: 720, w: 230, k: 'h2' },
  ],
  checkpoints: [{ x: 2150, y: G }, { x: 6350, y: G }, { x: ARENA_X - 250, y: G }],
  enemies: [
    { type: 'spearman', x: 1000, y: G },
    { type: 'archer', x: 1415, y: 690 },
    { type: 'spearman', x: 2700, y: G, roam: 250 },
    { type: 'archer', x: 2865, y: 700 },
    { type: 'spearman', x: 3200, y: G, roam: 200 },
    { type: 'spearman', x: 4500, y: G },
    { type: 'spearman', x: 5100, y: G },
    { type: 'archer', x: 5415, y: 690 },
    { type: 'spearman', x: 5600, y: G, roam: 200 },
    { type: 'spearman', x: 6800, y: G, roam: 250 },
    { type: 'archer', x: 6965, y: 700 },
    { type: 'spearman', x: 7300, y: G, roam: 250 },
    { type: 'spearman', x: 8700, y: G, roam: 250 },
    { type: 'archer', x: 8980, y: 730 },
    { type: 'spearman', x: 9150, y: G, roam: 150 },
  ],
  hazards: [
    { type: 'palisade', x: 1600, y: G },
    { type: 'wooden-stakes', x: 3350, y: G },
    { type: 'palisade', x: 4300, y: G },
    { type: 'wooden-stakes', x: 5800, y: G },
    { type: 'wooden-stakes', x: 7550, y: G },
  ],
  pickups: [
    ...coins(790, 670, 3), ...coinArc(1700, 790, 4, 90), ...coins(2300, 830, 3), ...coins(3640, 710, 2),
    ...coins(3920, 630, 2), ...coins(4800, 660, 3), ...coinArc(5890, 790, 4, 100), ...coins(6500, 830, 3),
    ...coins(7850, 750, 2), ...coins(8120, 690, 2),
    { type: 'heart', x: 3970, y: 600 },
    { type: 'heart', x: 6965, y: 540 },
    { type: 'heart', x: 9330, y: 800 },
  ],
  props: [
    { k: 'h-plat-11', x: 2350, y: G + 12, s: 1.5, d: 9 },
    { k: 'h-plat-11', x: 6450, y: G + 12, s: 1.5, d: 9, flip: true },
    { k: 'h-plat-11', x: 9500, y: G + 12, s: 1.5, d: 9 },
  ],
  boss: { x: ARENA_X + 1650, y: G, arenaX: ARENA_X, arenaW: ARENA_W },
};
