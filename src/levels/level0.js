// Тестовый уровень на серых коробках (открывается через ?level=0).
// y у земли и платформ — это высота поверхности, по которой ходит герой.
export default {
  id: 0,
  name: 'Проверка движения',
  width: 5200,
  start: { x: 200, y: 900 },
  exitX: 5050,
  ground: [
    { x: 0, w: 1300, y: 900 },
    { x: 1600, w: 900, y: 900 },
    { x: 2500, w: 500, y: 760 },
    { x: 3350, w: 1850, y: 900 },
  ],
  platforms: [
    { x: 500, y: 720, w: 260 },
    { x: 860, y: 560, w: 260 },
    { x: 1820, y: 720, w: 300 },
    { x: 3050, y: 640, w: 240 },
    { x: 3700, y: 720, w: 300, ice: true },
    { x: 4150, y: 600, w: 260, crumble: true },
  ],
  checkpoints: [{ x: 1750, y: 900 }, { x: 3500, y: 900 }],
  pickups: [
    { type: 'coin', x: 630, y: 650 }, { type: 'coin', x: 990, y: 490 }, { type: 'coin', x: 1450, y: 700 },
    { type: 'heart', x: 3170, y: 570 },
  ],
  enemies: [
    { type: 'spearman', x: 2280, y: 900, roam: 100 },
    { type: 'archer', x: 5050, y: 900 },
    { type: 'wolf', x: 4750, y: 900, roam: 250 },
  ],
  hazards: [{ type: 'wooden-stakes', x: 4400, y: 900 }],
};
