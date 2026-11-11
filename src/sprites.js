// Листы анимаций, нарисованные на сплошном пурпурном фоне (#FF00FF).
// При запуске игры код сам вырезает фон, находит фигуру в каждой ячейке и выравнивает кадры
// по линии ног и по центру тела, чтобы персонаж не «прыгал» между кадрами.
//
// file — путь внутри public/assets; cols × rows — сетка ячеек на листе; frames — сколько кадров брать;
// fps — скорость анимации; faces — куда смотрит персонаж на листе (1 — вправо, -1 — влево).
export const SHEETS = {
  'spearman-walk': { file: 'enemies/spearman-walk.webp', cols: 4, rows: 2, frames: 8, fps: 10, faces: 1 },
};

// сюда записываются размеры готовых кадров: figH — рост фигуры, W/H — размер кадра, baseline — линия ног
export const SHEET_INFO = {};

export function loadSheets(scene) {
  for (const [key, s] of Object.entries(SHEETS)) scene.load.image('raw-' + key, 'assets/' + s.file);
}

// насколько пиксель «пурпурный»: 0 — нет, 1 — чистый фон
function magenta(r, g, b) {
  const m = (Math.min(r, b) - g - 40) / 110;
  return m < 0 ? 0 : m > 1 ? 1 : m;
}

export function buildSheets(scene) {
  for (const [key, s] of Object.entries(SHEETS)) {
    if (!scene.textures.exists('raw-' + key)) continue;
    const img = scene.textures.get('raw-' + key).getSourceImage();
    const inset = 5; // отступ от края ячейки, чтобы не захватить линии сетки
    const cw = Math.floor(img.width / s.cols) - inset * 2;
    const ch = Math.floor(img.height / s.rows) - inset * 2;
    const src = document.createElement('canvas');
    src.width = img.width;
    src.height = img.height;
    const sg = src.getContext('2d', { willReadFrequently: true });
    sg.drawImage(img, 0, 0);

    const cells = [];
    for (let f = 0; f < s.frames; f++) {
      const cx0 = (f % s.cols) * Math.floor(img.width / s.cols) + inset;
      const cy0 = Math.floor(f / s.cols) * Math.floor(img.height / s.rows) + inset;
      const data = sg.getImageData(cx0, cy0, cw, ch);
      const d = data.data;
      let x0 = cw, x1 = 0, y0 = ch, y1 = 0, sum = 0, sumX = 0;
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const i = (y * cw + x) * 4;
          const k = magenta(d[i], d[i + 1], d[i + 2]);
          // тёмные линии сетки у самого края ячейки тоже убираем
          const edgeLine = (x < 4 || x > cw - 5 || y < 4 || y > ch - 5) && d[i] + d[i + 1] + d[i + 2] < 200;
          const a = edgeLine ? 0 : 1 - k;
          d[i + 3] = Math.round(a * 255);
          if (k > 0 && a > 0) {
            // убираем пурпурный отсвет по краям фигуры
            const spill = Math.min(d[i], d[i + 2]) - d[i + 1];
            if (spill > 0) {
              d[i] -= spill * k;
              d[i + 2] -= spill * k;
            }
          }
          if (a > 0.5) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
            // центр тела считаем по нижней половине кадра не нужно — берём все непрозрачные пиксели
            sum++;
            sumX += x;
          }
        }
      }
      const c = document.createElement('canvas');
      c.width = cw;
      c.height = ch;
      c.getContext('2d').putImageData(data, 0, 0);
      cells.push({ c, x0, x1, y0, y1, cx: sum ? sumX / sum : cw / 2 });
    }

    // общий размер кадра: чтобы влезла самая широкая и самая высокая фигура
    let left = 0, right = 0, figH = 0;
    for (const c of cells) {
      left = Math.max(left, c.cx - c.x0);
      right = Math.max(right, c.x1 - c.cx);
      figH = Math.max(figH, c.y1 - c.y0 + 1);
    }
    const pad = 4;
    const W = Math.ceil(left + right) + pad * 2;
    const H = figH + pad * 2;
    const baseline = H - pad;
    const out = document.createElement('canvas');
    out.width = W * cells.length;
    out.height = H;
    const og = out.getContext('2d');
    cells.forEach((c, f) => {
      og.drawImage(c.c, Math.round(f * W + pad + left - c.cx), baseline - c.y1 - 1);
    });

    scene.textures.addSpriteSheet(key, out, { frameWidth: W, frameHeight: H });
    scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(key, { start: 0, end: cells.length - 1 }), frameRate: s.fps, repeat: -1 });
    SHEET_INFO[key] = { figH, W, H, baseline, cx: pad + left, faces: s.faces };
    scene.textures.remove('raw-' + key);
  }
}
