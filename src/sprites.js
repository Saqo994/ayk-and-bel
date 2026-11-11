// Листы анимаций, нарисованные на ровном одноцветном фоне (пурпурном, сиреневом — любом, не похожем на персонажа).
// При запуске игры код сам:
//   1) определяет цвет фона по углам картинки и делает его прозрачным;
//   2) находит на листе отдельные фигуры (сетка не нужна — фигуры могут стоять неровно);
//   3) выравнивает кадры по линии ног и по центру фигуры, чтобы персонаж не «прыгал» между кадрами.
//
// file   — путь внутри public/assets
// rows   — сколько рядов фигур на листе (кадры нумеруются слева направо, ряд за рядом, с нуля)
// frames — сколько фигур на листе
// faces  — куда смотрит персонаж на листе (1 — вправо, -1 — влево)
// tol    — насколько цвет может отличаться от фона, чтобы считаться фоном (больше — вырезает смелее;
//          если в фигуре появляются дыры — уменьшить, если вокруг остаётся кайма фона — увеличить)
// anims  — анимации: имя → { frames: номера кадров, fps: скорость }
export const SHEETS = {
  'spearman-walk': {
    file: 'enemies/spearman-walk.webp', rows: 2, frames: 8, faces: 1, tol: 150,
    anims: { 'spearman-walk': { frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 10 } },
  },
  'wolf-run': {
    file: 'enemies/wolf-run.webp', rows: 4, frames: 12, faces: 1, tol: 24,
    anims: { 'wolf-run': { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], fps: 12 } },
  },
  'bear-walk': {
    file: 'enemies/bear-walk.webp', rows: 4, frames: 8, faces: 1, tol: 30,
    anims: { 'bear-walk': { frames: [0, 1, 2, 3, 4, 5, 6, 7], fps: 7 } },
  },
  'deer-run': {
    file: 'enemies/deer-run.webp', rows: 3, frames: 7, faces: 1, tol: 30,
    anims: { 'deer-run': { frames: [0, 1, 2, 3, 4, 5, 6], fps: 8 } },
  },
  'bel-sheet': {
    file: 'enemies/bel-sheet.webp', rows: 2, frames: 6, faces: 1, tol: 34,
    anims: { 'bel-walk': { frames: [0, 1, 4, 5], fps: 5 } },
  },
};

// сюда записываются размеры готовых кадров: figH — рост фигуры, W/H — размер кадра, baseline — линия ног, cx — центр фигуры
export const SHEET_INFO = {};

export function loadSheets(scene) {
  for (const [key, s] of Object.entries(SHEETS)) scene.load.image('raw-' + key, 'assets/' + s.file);
}

export function buildSheets(scene) {
  for (const [key, s] of Object.entries(SHEETS)) {
    if (!scene.textures.exists('raw-' + key)) continue;
    const frames = cutFrames(scene.textures.get('raw-' + key).getSourceImage(), s);
    scene.textures.remove('raw-' + key);
    if (!frames.length) continue;

    // общий размер кадра: чтобы влезла самая широкая и самая высокая фигура
    let left = 0, right = 0, figH = 0;
    for (const f of frames) {
      left = Math.max(left, f.anchor);
      right = Math.max(right, f.w - f.anchor);
      figH = Math.max(figH, f.h);
    }
    const pad = 4;
    const W = Math.ceil(left + right) + pad * 2;
    const H = figH + pad * 2;
    const baseline = H - pad;
    const out = document.createElement('canvas');
    out.width = W * frames.length;
    out.height = H;
    const og = out.getContext('2d');
    frames.forEach((f, i) => og.drawImage(f.canvas, Math.round(i * W + pad + left - f.anchor), baseline - f.h));

    scene.textures.addSpriteSheet(key, out, { frameWidth: W, frameHeight: H });
    for (const [name, a] of Object.entries(s.anims || {})) {
      scene.anims.create({ key: name, frames: scene.anims.generateFrameNumbers(key, { frames: a.frames.filter((n) => n < frames.length) }), frameRate: a.fps, repeat: -1 });
    }
    SHEET_INFO[key] = { figH, W, H, baseline, cx: pad + left, faces: s.faces, count: frames.length };
  }
}

// Вырезает фон и возвращает отдельные фигуры: [{ canvas, w, h, anchor }]
function cutFrames(img, s) {
  const w = img.width;
  const h = img.height;
  const n = w * h;
  const src = document.createElement('canvas');
  src.width = w;
  src.height = h;
  const sg = src.getContext('2d', { willReadFrequently: true });
  sg.drawImage(img, 0, 0);
  const d = sg.getImageData(0, 0, w, h).data;

  // цвет фона — среднее по четырём углам
  let br = 0, bg = 0, bb = 0, cnt = 0;
  for (const [ox, oy] of [[2, 2], [w - 10, 2], [2, h - 10], [w - 10, h - 10]]) {
    for (let y = oy; y < oy + 8; y++) {
      for (let x = ox; x < ox + 8; x++) {
        const i = (y * w + x) * 4;
        br += d[i]; bg += d[i + 1]; bb += d[i + 2]; cnt++;
      }
    }
  }
  br /= cnt; bg /= cnt; bb /= cnt;

  // расстояние каждого пикселя до цвета фона
  const T = s.tol ?? 40;
  const T2 = T;
  const dist = new Float32Array(n);
  const isBg = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    const dr = d[i] - br, dg = d[i + 1] - bg, db = d[i + 2] - bb;
    // отличие по оттенку важнее отличия по яркости: серый волк на серо-сиреневом фоне отличается именно оттенком
    const dl = ((dr + dg + db) / 3) * 0.6;
    const c1 = dr - db;
    const c2 = dg - (dr + db) / 2;
    const v = Math.sqrt(dl * dl + c1 * c1 + c2 * c2);
    dist[p] = v;
    // внутри фигуры (в «карманах» между рукой и телом) убираем только почти точный цвет фона
    if (v < T * 0.4) isBg[p] = 1;
  }
  // от краёв картинки фон «заливается» смелее: так убираются полутона на границе фигур,
  // но похожие на фон места внутри фигуры (например, блик на мече) остаются
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  const seen = new Uint8Array(n);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p] || dist[p] >= T2) continue;
    seen[p] = 1;
    isBg[p] = 1;
    const x = p % w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (p >= w) stack.push(p - w);
    if (p < n - w) stack.push(p + w);
  }

  // ищем связные «пятна» не-фона — это фигуры и мелкие детали
  const label = new Int32Array(n);
  const comps = [null];
  for (let p0 = 0; p0 < n; p0++) {
    if (isBg[p0] || label[p0]) continue;
    const id = comps.length;
    const c = { id, area: 0, x0: w, x1: 0, y0: h, y1: 0 };
    stack.push(p0);
    label[p0] = id;
    while (stack.length) {
      const p = stack.pop();
      const x = p % w;
      const y = (p - x) / w;
      c.area++;
      if (x < c.x0) c.x0 = x;
      if (x > c.x1) c.x1 = x;
      if (y < c.y0) c.y0 = y;
      if (y > c.y1) c.y1 = y;
      if (x > 0 && !isBg[p - 1] && !label[p - 1]) { label[p - 1] = id; stack.push(p - 1); }
      if (x < w - 1 && !isBg[p + 1] && !label[p + 1]) { label[p + 1] = id; stack.push(p + 1); }
      if (y > 0 && !isBg[p - w] && !label[p - w]) { label[p - w] = id; stack.push(p - w); }
      if (y < h - 1 && !isBg[p + w] && !label[p + w]) { label[p + w] = id; stack.push(p + w); }
    }
    comps.push(c);
  }

  // линии сетки (тонкие и через весь лист) и мусор отбрасываем; крупные пятна — фигуры
  const real = comps.filter((c) => c && c.area >= 12 && c.x1 - c.x0 < w * 0.6 && c.y1 - c.y0 < h * 0.75);
  const maxArea = real.reduce((m, c) => Math.max(m, c.area), 0);
  const rowOf = (c) => Math.min(s.rows - 1, Math.floor(((c.y0 + c.y1) / 2 / h) * s.rows));
  const figs = real.filter((c) => c.area >= maxArea * 0.25)
    .sort((a, b) => rowOf(a) - rowOf(b) || a.x0 + a.x1 - b.x0 - b.x1)
    .slice(0, s.frames);
  const owner = new Int32Array(comps.length).fill(-1);
  figs.forEach((c, i) => { owner[c.id] = i; });
  // мелкие детали рядом с фигурой (отлетевший кончик меча, брызги) приписываем ближайшей фигуре
  for (const c of real) {
    if (owner[c.id] >= 0) continue;
    let best = -1, bestGap = 26;
    figs.forEach((f, i) => {
      const gx = Math.max(0, f.x0 - c.x1, c.x0 - f.x1);
      const gy = Math.max(0, f.y0 - c.y1, c.y0 - f.y1);
      if (Math.max(gx, gy) < bestGap) { bestGap = Math.max(gx, gy); best = i; }
    });
    if (best >= 0) {
      owner[c.id] = best;
      const f = figs[best];
      f.x0 = Math.min(f.x0, c.x0); f.x1 = Math.max(f.x1, c.x1); f.y0 = Math.min(f.y0, c.y0); f.y1 = Math.max(f.y1, c.y1);
    }
  }

  // переносим каждую фигуру на свой холст
  return figs.map((f, fi) => {
    const fw = f.x1 - f.x0 + 1;
    const fh = f.y1 - f.y0 + 1;
    const canvas = document.createElement('canvas');
    canvas.width = fw;
    canvas.height = fh;
    const g = canvas.getContext('2d');
    const out = g.createImageData(fw, fh);
    const o = out.data;
    let feetSum = 0, feetN = 0;
    const feetY = f.y0; // центр считаем по всей фигуре — так кадры бега дрожат меньше всего
    for (let y = f.y0; y <= f.y1; y++) {
      for (let x = f.x0; x <= f.x1; x++) {
        const p = y * w + x;
        if (owner[label[p]] !== fi) continue;
        const i = p * 4;
        const j = ((y - f.y0) * fw + (x - f.x0)) * 4;
        let a = 1;
        // пиксель на самой границе с фоном делаем полупрозрачным и убираем с него цвет фона
        const edge = (x > 0 && isBg[p - 1]) || (x < w - 1 && isBg[p + 1]) || (y > 0 && isBg[p - w]) || (y < h - 1 && isBg[p + w]);
        if (edge) a = Math.min(1, Math.max(0.35, (dist[p] - T) / T + 0.35));
        const k = (1 - a) * 0.7;
        o[j] = Math.max(0, Math.min(255, d[i] + (d[i] - br) * k));
        o[j + 1] = Math.max(0, Math.min(255, d[i + 1] + (d[i + 1] - bg) * k));
        o[j + 2] = Math.max(0, Math.min(255, d[i + 2] + (d[i + 2] - bb) * k));
        o[j + 3] = Math.round(a * 255);
        if (y >= feetY) { feetSum += x - f.x0; feetN++; }
      }
    }
    g.putImageData(out, 0, 0);
    return { canvas, w: fw, h: fh, anchor: feetN ? feetSum / feetN : fw / 2 };
  });
}
