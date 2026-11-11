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
      ground: { tex: 'b-plat-02', top: 0.06, scale: 1.7, fill: 0x8a5a36 },
      plats: {
        b1: { tex: 'b-plat-01', top: 0.08 },
        b3: { tex: 'b-plat-03', top: 0.12 },
        b4: { tex: 'b-plat-04', top: 0.12 },
        b5: { tex: 'b-plat-05', top: 0.08 },
        b6: { tex: 'b-plat-06', top: 0.42 },
        b7: { tex: 'b-plat-07', top: 0.4 },
        b8: { tex: 'b-plat-08', top: 0.25 },
      },
    },
  },
};
