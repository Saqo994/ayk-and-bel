import { coins, coinArc } from './helpers.js';

// Уровень 3 — Страна Арарат. Светлый и просторный: много монет, враги — звери, ямы — ручьи (water).
const G = 900;

// украшения (не мешают ходить): k — картинка, s — увеличение, d — глубина (больше 50 — перед героем)
function deco() {
  const out = [];
  const trees = ['a-tree-1', 'a-tree-2', 'a-tree-3', 'a-tree-4', 'a-cypress-2', 'a-cypress-1'];
  const small = ['a-bush-1', 'a-grass-4', 'a-rocks-4', 'a-bush-4', 'a-grass-1', 'a-bush-6', 'a-rocks-5', 'a-grass-3'];
  const spots = [
    [150, 1350], [1700, 3250], [3500, 5150], [5400, 7050], [7300, 9150], [9450, 11250], [11500, 13650], [13950, 15350], [15650, 18000],
  ];
  let n = 0;
  for (const [a, b] of spots) {
    for (let x = a + 120; x < b - 100; x += 330) {
      n++;
      if (n % 3 === 0) out.push({ k: trees[(n / 3) % trees.length | 0], x, y: G + 8, s: 3 + (n % 2) * 0.5, d: 8 });
      out.push({ k: small[n % small.length], x: x + 150, y: G + 10, s: 1.7, d: n % 4 === 0 ? 60 : 12 });
    }
  }
  return out;
}

export default {
  id: 3,
  name: 'Страна Арарат',
  width: 18200,
  start: { x: 220, y: G },
  exitX: 18050,
  ground: [
    { x: 0, w: 1400, y: G },
    { x: 1640, w: 1660, y: G },
    { x: 3450, w: 1750, y: G },
    { x: 5350, w: 1750, y: G },
    { x: 7250, w: 1950, y: G },
    { x: 9400, w: 1900, y: G },
    { x: 11450, w: 2250, y: G },
    { x: 13900, w: 1500, y: G },
    { x: 15600, w: 2600, y: G },
  ],
  water: [
    { x: 1400, w: 240 }, { x: 3300, w: 150 }, { x: 5200, w: 150 }, { x: 7100, w: 150 },
    { x: 9200, w: 200 }, { x: 11300, w: 150 }, { x: 13700, w: 200 }, { x: 15400, w: 200 },
  ],
  platforms: [
    { x: 600, y: 740, w: 380, k: 'p4' },
    { x: 1050, y: 620, w: 340, k: 's11' },
    { x: 2500, y: 730, w: 420, k: 'p8' },
    { x: 3900, y: 740, w: 380, k: 'p5' },
    { x: 4350, y: 600, w: 380, k: 'p4' },
    { x: 4800, y: 740, w: 340, k: 's11' },
    { x: 6000, y: 730, w: 440, k: 'p12' },
    { x: 7700, y: 740, w: 300, k: 'r2', solid: true },
    { x: 8100, y: 610, w: 400, k: 'p8' },
    { x: 8600, y: 740, w: 340, k: 's11' },
    { x: 9150, y: 800, w: 300, k: 'arch', d: 21 },
    { x: 10100, y: 730, w: 420, k: 'p5' },
    { x: 10600, y: 590, w: 380, k: 'p4' },
    { x: 12300, y: 740, w: 420, k: 'p12' },
    { x: 12800, y: 610, w: 340, k: 's11' },
    { x: 13640, y: 820, w: 330, k: 'bridge', d: 21 },
    { x: 14400, y: 730, w: 420, k: 'p8' },
    { x: 16300, y: 740, w: 380, k: 'p4' },
    { x: 16750, y: 600, w: 380, k: 'p5' },
    { x: 17200, y: 740, w: 340, k: 's11' },
  ],
  checkpoints: [{ x: 3600, y: G }, { x: 9550, y: G }, { x: 14050, y: G }],
  enemies: [
    { type: 'deer', x: 1100, y: G },
    { type: 'wolf', x: 2800, y: G },
    { type: 'boar', x: 4500, y: G },
    { type: 'deer', x: 6000, y: G },
    { type: 'wolf', x: 6500, y: G },
    { type: 'boar', x: 8300, y: G },
    { type: 'wolf', x: 8700, y: G, roam: 300 },
    { type: 'bear', x: 10850, y: G, roam: 350 },
    { type: 'wolf', x: 12200, y: G },
    { type: 'boar', x: 12900, y: G },
    { type: 'deer', x: 14900, y: G },
    { type: 'bear', x: 16400, y: G },
    { type: 'wolf', x: 17300, y: G, roam: 350 },
  ],
  hazards: [
    { type: 'wooden-stakes', x: 5700, y: G },
    { type: 'palisade', x: 11900, y: G },
    { type: 'wooden-stakes', x: 15900, y: G },
  ],
  pickups: [
    ...coins(400, 830, 3), ...coins(700, 670, 3), ...coins(1140, 550, 3), ...coinArc(1380, 780, 4, 90),
    ...coins(2200, 830, 4), ...coins(2610, 660, 3), ...coinArc(3240, 790, 4, 90), ...coins(3990, 670, 3),
    ...coins(4440, 530, 3), ...coins(4890, 670, 3), ...coinArc(5140, 790, 4, 90), ...coins(6110, 660, 3),
    ...coins(6700, 830, 4), ...coinArc(7040, 790, 4, 90), ...coins(7790, 670, 2), ...coins(8210, 540, 3),
    ...coins(8690, 670, 3), ...coins(9230, 730, 2), ...coins(9800, 830, 3), ...coins(10210, 660, 3),
    ...coins(10690, 520, 3), ...coinArc(11240, 790, 4, 90), ...coins(12410, 670, 3), ...coins(12890, 540, 3),
    ...coins(13720, 750, 3), ...coins(14510, 660, 3), ...coinArc(15360, 780, 4, 90), ...coins(16390, 670, 3),
    ...coins(16840, 530, 3), ...coins(17290, 670, 3), ...coins(17600, 830, 4),
    { type: 'heart', x: 4540, y: 500 },
    { type: 'heart', x: 10790, y: 490 },
    { type: 'heart', x: 16940, y: 500 },
  ],
  props: [
    ...deco(),
    { k: 'a-ruin-column', x: 3000, y: G + 8, s: 2.4, d: 9 },
    { k: 'a-stele', x: 3720, y: G + 6, s: 2, d: 9 },
    { k: 'a-ruin-stones', x: 6900, y: G + 8, s: 2.4, d: 9 },
    { k: 'a-stone-pillar', x: 9700, y: G + 6, s: 2, d: 9 },
    { k: 'a-cart-2', x: 11700, y: G + 8, s: 2.2, d: 9 },
    { k: 'a-amphora-2', x: 11850, y: G + 6, s: 1.8, d: 9 },
    { k: 'a-ruin-column', x: 14200, y: G + 8, s: 2.4, d: 9, flip: true },
    { k: 'a-banner-2', x: 17900, y: G + 6, s: 2.2, d: 9 },
    { k: 'a-banner-1', x: 18000, y: G + 6, s: 2.2, d: 9 },
  ],
};
