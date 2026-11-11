import { coins, coinArc } from './helpers.js';

// Уровень 1 — Вавилон. Начало: простые прыжки. Середина: копейщики и ямы. Конец: лучники на башнях.
// y — высота поверхности, по которой ходят. k — вид платформы (см. src/atmosphere/index.js).
const G = 900;
const TOWER = 681; // высота верха башни (низ башни стоит на земле)

// башня с лучником и ступенью перед ней
function tower(x) {
  return {
    platforms: [
      { x: x - 250, y: 820, w: 190, k: 'b3', solid: true },
      { x, y: TOWER, w: 230, k: 'b5', solid: true },
    ],
    enemies: [{ type: 'archer', x: x + 115, y: TOWER }],
  };
}
const towers = [11500, 13900, 16300, 17250].map(tower);

export default {
  id: 1,
  name: 'Вавилон',
  width: 18300,
  start: { x: 220, y: G },
  exitX: 18150,
  ground: [
    { x: 0, w: 2000, y: G },
    { x: 2260, w: 1140, y: G },
    { x: 3700, w: 1000, y: G },
    { x: 5000, w: 1400, y: G },
    { x: 7100, w: 1500, y: G },
    { x: 8900, w: 1500, y: G },
    { x: 10700, w: 1900, y: G },
    { x: 12900, w: 1700, y: G },
    { x: 15300, w: 3000, y: G },
  ],
  platforms: [
    // начало: простые прыжки
    { x: 700, y: 750, w: 330, k: 'b6' },
    { x: 1120, y: 610, w: 330, k: 'b6' },
    { x: 1560, y: 750, w: 300, k: 'b1' },
    { x: 2700, y: 740, w: 420, k: 'b1' },
    { x: 3430, y: 800, w: 220, k: 'b7' },
    { x: 4000, y: 730, w: 330, k: 'b6' },
    // середина: ямы
    { x: 5300, y: 720, w: 420, k: 'b1' },
    { x: 6620, y: 820, w: 280, k: 'b4' }, // стоит там, куда приземляется полный прыжок с края
    { x: 7500, y: 720, w: 420, k: 'b1' },
    { x: 8080, y: 560, w: 330, k: 'b6' },
    { x: 9500, y: 720, w: 420, k: 'b1' },
    { x: 10440, y: 800, w: 220, k: 'b7' },
    // конец: башни
    { x: 12080, y: 730, w: 330, k: 'b6' },
    { x: 12640, y: 800, w: 220, k: 'b7' },
    { x: 14800, y: 800, w: 280, k: 'b4' },
    { x: 15700, y: 720, w: 420, k: 'b1' },
    ...towers.flatMap((t) => t.platforms),
  ],
  checkpoints: [{ x: 4350, y: G }, { x: 9050, y: G }, { x: 13050, y: G }],
  enemies: [
    { type: 'spearman', x: 5800, y: G },
    { type: 'spearman', x: 7900, y: G },
    { type: 'spearman', x: 9600, y: G, roam: 250 },
    { type: 'spearman', x: 10000, y: G },
    { type: 'spearman', x: 11000, y: G },
    { type: 'spearman', x: 13600, y: G, roam: 250 },
    { type: 'spearman', x: 15900, y: G },
    { type: 'spearman', x: 16800, y: G },
    { type: 'spearman', x: 5500, y: 720, roam: 150 },
    ...towers.flatMap((t) => t.enemies),
  ],
  hazards: [
    { type: 'wooden-stakes', x: 7350, y: G },
    { type: 'wooden-stakes', x: 8500, y: G },
    { type: 'palisade', x: 12300, y: G },
    { type: 'wooden-stakes', x: 14300, y: G },
    { type: 'palisade', x: 15500, y: G },
  ],
  pickups: [
    ...coins(800, 680, 3), ...coins(1210, 540, 3), ...coins(1640, 680, 3),
    ...coinArc(1990, 780, 4, 90), ...coins(2800, 670, 4), ...coinArc(3420, 720, 4, 90),
    ...coins(4080, 660, 3), ...coinArc(4720, 780, 4, 90), ...coins(5400, 650, 3),
    ...coins(6680, 750, 3), ...coins(7600, 650, 3), ...coins(8170, 490, 3),
    ...coinArc(8620, 780, 4, 90), ...coins(9600, 650, 3), ...coinArc(10420, 730, 4, 90),
    ...coins(12170, 660, 3), ...coinArc(12620, 730, 4, 90), ...coins(14860, 730, 3),
    ...coins(15800, 650, 3), ...coins(17700, 820, 4),
    { type: 'heart', x: 8245, y: 480 },
    { type: 'heart', x: 12245, y: 600 },
    { type: 'heart', x: 15910, y: 600 },
  ],
  torches: [600, 1900, 2500, 3900, 5100, 6300, 7200, 8500, 9000, 10300, 10800, 12500, 13000, 14500, 15400, 16700, 18000].map((x) => ({ x, y: G })),
  props: [
    { k: 'b-prop-01', x: 1300, y: 905, s: 2.0, d: 5 },
    { k: 'b-prop-04', x: 2900, y: 905, s: 1.6, d: 5 },
    { k: 'b-prop-02', x: 4350, y: 905, s: 1.8, d: 5 },
    { k: 'b-prop-06', x: 6000, y: 905, s: 1.7, d: 5 },
    { k: 'b-prop-03', x: 7800, y: 905, s: 1.8, d: 5 },
    { k: 'b-prop-08', x: 9700, y: 905, s: 1.7, d: 5 },
    { k: 'b-prop-01', x: 11900, y: 905, s: 2.2, d: 5, flip: true },
    { k: 'b-prop-05', x: 13600, y: 905, s: 1.8, d: 5 },
    { k: 'b-prop-04', x: 14200, y: 905, s: 1.6, d: 5 },
    { k: 'b-prop-02', x: 16000, y: 905, s: 1.9, d: 5, flip: true },
    { k: 'b-prop-03', x: 17800, y: 905, s: 2.0, d: 5 },
  ],
};
