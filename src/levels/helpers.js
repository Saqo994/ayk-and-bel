// Маленькие помощники, чтобы короче записывать данные уровней.

// ряд из n монет, начиная с точки (x, y), с шагом dx
export function coins(x, y, n = 3, dx = 80) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ type: 'coin', x: x + i * dx, y });
  return out;
}

// дуга из монет над ямой или прыжком
export function coinArc(x, y, n = 5, dx = 80, h = 90) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n > 1 ? i / (n - 1) : 0.5;
    out.push({ type: 'coin', x: x + i * dx, y: y - Math.sin(t * Math.PI) * h });
  }
  return out;
}

// факелы через равные промежутки на высоте земли
export function torches(from, to, step, y) {
  const out = [];
  for (let x = from; x <= to; x += step) out.push({ x, y });
  return out;
}
