// Настройки атмосферы каждого уровня: картинки, слои фона, свет, частицы, цветокоррекция.
// Уровень без записи здесь рисуется серыми коробками.
//
// assets  — какие картинки загрузить (имя: путь внутри public/assets)
// sky     — небо: картинка (key) или градиент кодом (gradient), strip — полоса облаков сверху
// layers  — слои параллакса от дальнего к ближнему: factor — скорость сдвига (0 — стоит, 1 — как земля),
//           bottom — где нижний край слоя на экране, scale — увеличение, tint — подкраска
// front   — рамка переднего плана поверх игрока
// grade   — цветовое наложение на весь кадр, vignette — затемнение краёв (0…1)
// art     — чем рисовать землю (ground) и платформы (plats); top — доля высоты картинки, где кромка для ходьбы

function numbered(prefix, dir, n, name = 'platform') {
  const out = {};
  for (let i = 1; i <= n; i++) {
    const nn = String(i).padStart(2, '0');
    out[`${prefix}${nn}`] = `${dir}/${name}-${nn}.png`;
  }
  return out;
}

// скальные уступы, плиты и помосты Айоц-Дзора (на уровне 2 они же — с синим оттенком и снегом)
const HAYOTS_PLATS = {
  h1: { tex: 'h-plat-01', top: 0.05 },
  h2: { tex: 'h-plat-02', top: 0.2, inset: 0.06 },
  h3: { tex: 'h-plat-03', top: 0.34, noSnow: true, surface: 'wood' },
  h5: { tex: 'h-plat-05', top: 0.2, inset: 0.05 },
  h6: { tex: 'h-plat-06', top: 0.2, inset: 0.05 },
  h7: { tex: 'h-plat-07', top: 0.05 },
  h9: { tex: 'h-plat-09', top: 0.05, noSnow: true, surface: 'wood' },
};

const ARARAT_PROPS = [
  'tree-1', 'tree-2', 'tree-3', 'tree-4', 'cypress-1', 'cypress-2', 'bush-1', 'bush-4', 'bush-6',
  'grass-1', 'grass-3', 'grass-4', 'rocks-4', 'rocks-5', 'ruin-column', 'ruin-stones', 'stele',
  'stone-pillar', 'amphora-2', 'banner-1', 'banner-2', 'cart-2',
];

export const ATMOSPHERE = {
  // 1. Вавилон — закат, зной, пыль, факелы
  1: {
    assets: {
      'b-sky': 'babylon/babylon-sky.png',
      'b-far': 'babylon/babylon-far.png',
      'b-mid': 'babylon/babylon-mid.png',
      'b-front': 'babylon/babylon-front.png',
      ...numbered('b-plat-', 'babylon/platforms', 8),
      ...numbered('b-prop-', 'babylon/props', 10, 'prop'),
    },
    surface: 'stone',
    ambient: 'city',
    sky: { key: 'b-sky', tint: 0xffc49a },
    layers: [
      { key: 'b-far', factor: 0.06, scale: 1.7, bottom: 760, tint: 0xa86a48 },
      { key: 'b-mid', factor: 0.22, scale: 1.9, bottom: 960, tint: 0xb07a52 },
    ],
    front: { key: 'b-front', tint: 0x2a1206, zoom: 1.55, dy: 150 },
    grade: { color: 0xff9a5c, alpha: 0.38, blend: 'MULTIPLY' },
    vignette: 0.62,
    particles: [{ type: 'dust', tint: 0xffc890, alpha: 0.4 }],
    art: {
      tint: 0xffe2c4,
      propTint: 0x8f6446,
      // под каждой платформой — кирпичная стена или столбы до земли (legs: true — два столба по краям)
      support: { tex: 'b-plat-02', tint: 0xb08a6c },
      ground: { tex: 'b-plat-02', top: 0.06, scale: 1.7, fill: 0x8a5a36 },
      plats: {
        b1: { tex: 'b-plat-01', top: 0.08, legs: true },
        b3: { tex: 'b-plat-03', top: 0.12 },
        b4: { tex: 'b-plat-04', top: 0.12 },
        b5: { tex: 'b-plat-05', top: 0.08 },
        b6: { tex: 'b-plat-06', top: 0.42 },
        b7: { tex: 'b-plat-07', top: 0.4 },
        b8: { tex: 'b-plat-08', top: 0.25 },
      },
    },
  },

  // 2. Путь на север — предрассветная синева, снег, ветер
  2: {
    assets: {
      'n-sky': 'north/north-sky.png',
      'n-far': 'north/north-far.png',
      'n-front': 'north/north-front.png',
      ...numbered('h-plat-', 'hayots-dzor/platforms', 12),
    },
    surface: 'snow',
    ambient: 'wind',
    wind: true,
    sky: { key: 'n-sky', tint: 0xc8d4ff },
    layers: [
      { key: 'n-far', factor: 0.04, scale: 1.5, bottom: 760, fill: 0x0f1a36 },
      { key: 'n-far', factor: 0.14, scale: 2.3, bottom: 1120, tint: 0x55648f, fill: 0x0a1226 },
    ],
    front: { key: 'n-front', tint: 0x8a9cc4, zoom: 1.5, dy: 120 },
    grade: { color: 0x9ab4ff, alpha: 0.3, blend: 'MULTIPLY' },
    vignette: 0.6,
    particles: [{ type: 'snow' }],
    art: {
      tint: 0xb4c8f0,
      crumbleTint: 0xd8c8b8,
      snow: true,
      ground: { tex: 'h-plat-12', top: 0.06, scale: 1.5, fill: 0x161d2c, overlap: 0.03 },
      plats: HAYOTS_PLATS,
    },
  },

  // 3. Страна Арарат — ясное утро, зелень, простор
  3: {
    assets: {
      'a-far': 'ararat/ararat-far.png',
      'a-mid': 'ararat/ararat-mid.png',
      'a-strip': 'ararat/ararat-sky-strip.png',
      ...numbered('a-pt-', 'ararat/platforms', 12, 'painted'),
      'a-arch': 'ararat/platforms/platform-05.png',
      'a-bridge': 'ararat/platforms/rope-bridge.png',
      ...Object.fromEntries(ARARAT_PROPS.map((n) => ['a-' + n, 'ararat/props/' + n + '.png'])),
    },
    surface: 'grass',
    ambient: 'meadow',
    sky: { gradient: ['#3f86cf', '#8fbde6', '#dfe9e2'], strip: { key: 'a-strip', scale: 2.2, alpha: 1 } },
    layers: [
      { key: 'a-far', single: true, factor: 0.035, scale: 1.55, bottom: 800, x: 250 },
      { band: 0x7f9a5e, top: 780 },
      { band: 0x6d8a4e, top: 860, alpha: 0.9 },
      { key: 'a-mid', factor: 0.25, scale: 1.7, bottom: 915 },
    ],
    grade: { color: 0xfff2c8, alpha: 0.07, blend: 'ADD' },
    vignette: 0.3,
    saturation: -0.15,
    particles: [{ type: 'pollen' }],
    art: {
      propTint: 0xd4d2be,
      ground: { tex: 'a-pt-01', top: 0.13, scale: 1.5, fill: 0x5b3722, overlap: 0.08 },
      plats: {
        p4: { tex: 'a-pt-04', top: 0.13 },
        p5: { tex: 'a-pt-05', top: 0.13 },
        p8: { tex: 'a-pt-08', top: 0.13 },
        p12: { tex: 'a-pt-12', top: 0.13 },
        s11: { tex: 'a-pt-11', top: 0.1, surface: 'stone' },
        r2: { tex: 'a-pt-02', top: 0.08, surface: 'stone' },
        arch: { tex: 'a-arch', top: 0.16, surface: 'stone' },
        bridge: { tex: 'a-bridge', top: 0.5, inset: 0.06, surface: 'stone' },
      },
    },
  },

  // 4. Айоц-Дзор — гроза, дождь, войско
  4: {
    assets: {
      'h-sky': 'hayots-dzor/hayots-sky.png',
      'h-far': 'hayots-dzor/hayots-far.png',
      'h-mid': 'hayots-dzor/hayots-mid.png',
      'h-front': 'hayots-dzor/hayots-front.png',
      ...numbered('h-plat-', 'hayots-dzor/platforms', 12),
    },
    surface: 'stone',
    ambient: 'battle',
    lightning: true,
    sky: { key: 'h-sky', tint: 0xb8c0cc },
    layers: [
      { key: 'h-far', factor: 0.05, scale: 1.45, bottom: 860, tint: 0xa8b0bc },
      { key: 'h-mid', factor: 0.2, scale: 1.45, bottom: 1010, tint: 0x8a8f98 },
    ],
    front: { key: 'h-front', tint: 0x30343c, zoom: 1.5, dy: 130 },
    grade: { color: 0xa8b4c8, alpha: 0.32, blend: 'MULTIPLY' },
    vignette: 0.72,
    particles: [{ type: 'rain' }, { type: 'dust', tint: 0xb8a890, alpha: 0.18 }],
    art: {
      tint: 0xdfe4ee,
      propTint: 0xb8bcc4,
      ground: { tex: 'h-plat-12', top: 0.06, scale: 1.5, fill: 0x161a22, overlap: 0.03 },
      plats: HAYOTS_PLATS,
    },
  },
};
