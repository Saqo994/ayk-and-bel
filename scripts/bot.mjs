// Автоматический прогон уровней: простой «бот» бежит вправо и прыгает у края и перед стеной.
// Неуязвимость включена, поэтому проверяется именно проходимость прыжков, а не бой.
// Запуск: npm run bot        — все уровни
//         npm run bot -- 2   — только уровень 2
import { createServer } from 'vite';
import { chromium } from 'playwright';

const only = process.argv[2] ? Number(process.argv[2]) : null;
const server = await createServer({ logLevel: 'error', server: { port: 5189 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
let failed = false;

for (const level of [1, 2, 3, 4]) {
  if (only && only !== level) continue;
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}?level=${level}&debug=1`);
  await page.waitForFunction(() => window.__sceneReady === 'Game', null, { timeout: 20000 });
  await page.keyboard.press('KeyG'); // неуязвимость
  const result = await page.evaluate(() => new Promise((resolve) => {
    const game = window.__game;
    const scene = game.scene.getScene('Game');
    const L = scene.level;
    const goalX = L.boss ? L.boss.arenaX + 320 : L.exitX;
    const t0 = performance.now();
    let falls = 0;
    const where = [];
    let lastX = 0;
    let still = 0;
    let maxX = 0;
    const origFall = scene.fellInPit.bind(scene);
    scene.fellInPit = () => {
      falls++;
      where.push(Math.round(scene.player.x));
      origFall();
    };
    const timer = setInterval(() => {
      const p = scene.player;
      const sec = (performance.now() - t0) / 1000;
      maxX = Math.max(maxX, p.x);
      if (scene.finished || p.x >= goalX) {
        clearInterval(timer);
        resolve({ ok: true, sec: Math.round(sec), falls, where, fps: Math.round(game.loop.actualFps) });
        return;
      }
      if (sec > 240) {
        clearInterval(timer);
        resolve({ ok: false, sec: Math.round(sec), falls, stuckAt: Math.round(maxX), fps: Math.round(game.loop.actualFps) });
        return;
      }
      p.keys.RIGHT.isDown = true;
      const feet = p.body.bottom;
      const ahead = p.x + 45;
      // есть ли опора под ногами чуть впереди
      let support = false;
      const solids = scene.solids.getChildren();
      for (let i = 0; i < solids.length; i++) {
        const b = solids[i].body;
        if (b.enable && ahead >= b.left && ahead <= b.right && Math.abs(b.top - feet) < 14) support = true;
      }
      // «застрял» — только если герой не сдвинулся несколько проверок подряд
      // (одна проверка может попасть между кадрами игры и ошибочно увидеть ту же позицию)
      still = Math.abs(p.x - lastX) < 0.5 ? still + 1 : 0;
      const stuck = still >= 8;
      lastX = p.x;
      if (p.onGround && (!support || p.body.blocked.right || stuck)) {
        p.bufferUntil = scene.time.now + 130;
        p.keys.SPACE.isDown = true;
      } else if (p.onGround) p.keys.SPACE.isDown = false;
    }, 16);
  }));
  const name = `Уровень ${level}`;
  if (result.ok && !errors.length) console.log(`${name}: пройден за ${result.sec} с, падений в ямы: ${result.falls}${result.falls ? ' (x = ' + result.where.join(', ') + ')' : ''}, FPS: ${result.fps}`);
  else {
    failed = true;
    console.log(`${name}: НЕ ПРОЙДЕН`, JSON.stringify(result), errors.join(' | '));
  }
  await page.close();
}

await browser.close();
await server.close();
process.exit(failed ? 1 : 0);
