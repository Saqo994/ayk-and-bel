import { LIGHTING } from './config.js';

// «Карта рельефа» (normal map) для картинки, вычисленная кодом.
// Светлые места картинки считаются выпуклыми, тёмные — впадинами. По этому рельефу свет понимает,
// какая сторона камня или фигуры повёрнута к факелу, — и плоская картинка выглядит объёмной.
// Карта считается один раз для каждой картинки и запоминается (при «Заново» не пересчитывается).
export function addNormalMap(scene, key) {
  const tex = scene.textures.get(key);
  if (!tex || tex.key === '__MISSING' || tex.__normal) return;
  tex.__normal = true;
  const src = tex.getSourceImage();
  const w = src.width;
  const h = src.height;
  if (!w || !h) return;

  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;

  // высота точки = яркость (прозрачные точки — «низ»), затем лёгкое размытие, чтобы рельеф был мягче
  const hgt = new Float32Array(w * h);
  for (let i = 0, p = 0; i < hgt.length; i++, p += 4) {
    hgt[i] = ((d[p] * 0.3 + d[p + 1] * 0.55 + d[p + 2] * 0.15) / 255) * (d[p + 3] / 255);
  }
  const blur = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = x > 0 ? x - 1 : x;
      const x1 = x < w - 1 ? x + 1 : x;
      const r = y * w;
      blur[r + x] = (hgt[r + x0] + hgt[r + x] + hgt[r + x1]) / 3;
    }
  }
  for (let y = 0; y < h; y++) {
    const r0 = (y > 0 ? y - 1 : y) * w;
    const r1 = (y < h - 1 ? y + 1 : y) * w;
    const r = y * w;
    for (let x = 0; x < w; x++) hgt[r + x] = (blur[r0 + x] + blur[r + x] + blur[r1 + x]) / 3;
  }

  // наклон поверхности по соседним точкам → направление «куда смотрит» поверхность
  const k = LIGHTING.relief;
  for (let y = 0; y < h; y++) {
    const r = y * w;
    const ru = (y > 0 ? y - 1 : y) * w;
    const rd = (y < h - 1 ? y + 1 : y) * w;
    for (let x = 0; x < w; x++) {
      const xl = x > 0 ? x - 1 : x;
      const xr = x < w - 1 ? x + 1 : x;
      const dx = (hgt[r + xr] - hgt[r + xl]) * k;
      const dy = (hgt[rd + x] - hgt[ru + x]) * k;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const p = (r + x) * 4;
      d[p] = ((-dx / len) * 0.5 + 0.5) * 255;
      d[p + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      d[p + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      d[p + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  tex.setDataSource(c);
}
