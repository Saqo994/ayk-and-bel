// Проверка проходимости уровней: можно ли при параметрах из src/config.js допрыгать от старта до выхода.
// Запуск: npm run check
// Считает с запасом (герой использует не больше 85% дальности и высоты прыжка), ветер уровня 2 не учитывает
// (порыв можно переждать на земле).
import { PLAYER, WORLD } from '../src/config.js';
import { LEVELS } from '../src/levels/index.js';

const MARGIN = 0.85;
const v = PLAYER.jumpVelocity;
const g = WORLD.gravity;
const maxUp = ((v * v) / (2 * g)) * MARGIN;

// на сколько можно улететь по горизонтали, если цель выше на dy (dy < 0 — цель ниже)
function reach(dy) {
  if (dy > maxUp) return -1;
  const disc = v * v - 2 * g * Math.max(dy, -2000);
  const t = (v + Math.sqrt(disc)) / g; // время до момента, когда герой опустится на высоту цели
  return PLAYER.runSpeed * t * MARGIN;
}

let failed = false;
for (const [id, L] of Object.entries(LEVELS)) {
  const surf = [
    ...L.ground.map((s) => ({ x1: s.x, x2: s.x + s.w, y: s.y, name: `земля x=${s.x}` })),
    ...(L.platforms || []).map((p) => ({ x1: p.x, x2: p.x + p.w, y: p.y, name: `платформа x=${p.x}` })),
  ];
  const at = (x, y) => surf.findIndex((s) => x >= s.x1 && x <= s.x2 && Math.abs(s.y - y) < 12);
  const start = at(L.start.x, L.start.y);
  const goalX = L.boss ? L.boss.x : L.exitX;
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length) {
    const a = surf[queue.shift()];
    surf.forEach((b, j) => {
      if (seen.has(j)) return;
      const gap = Math.max(0, b.x1 - a.x2, a.x1 - b.x2);
      if (gap <= reach(a.y - b.y)) {
        seen.add(j);
        queue.push(j);
      }
    });
  }
  const goal = surf.findIndex((s) => goalX >= s.x1 && goalX <= s.x2 && seen.has(surf.indexOf(s)));
  const problems = [];
  if (start < 0) problems.push('старт не стоит на поверхности');
  if (goal < 0) problems.push(`до выхода (x=${goalX}) не добраться`);
  surf.forEach((s, j) => {
    if (!seen.has(j)) problems.push(`недостижима: ${s.name}`);
  });
  for (const c of L.checkpoints || []) if (at(c.x, c.y) < 0) problems.push(`чекпоинт x=${c.x} висит в воздухе`);
  for (const e of L.enemies || []) if (at(e.x, e.y) < 0) problems.push(`враг ${e.type} x=${e.x} висит в воздухе`);
  for (const h of L.hazards || []) if (at(h.x, h.y) < 0) problems.push(`ловушка x=${h.x} висит в воздухе`);

  // самый трудный прыжок на пути — для сведения
  if (problems.length) {
    failed = true;
    console.log(`Уровень ${id} «${L.name}»: ПРОБЛЕМЫ`);
    problems.forEach((p) => console.log('   - ' + p));
  } else {
    console.log(`Уровень ${id} «${L.name}»: проходим (${surf.length} поверхностей, все достижимы)`);
  }
}
console.log(`\nПрыжок: высота до ${Math.round(maxUp / MARGIN)} px, длина по ровному до ${Math.round((PLAYER.runSpeed * 2 * v) / g)} px (в расчёте взято ${MARGIN * 100}%).`);
process.exit(failed ? 1 : 0);
