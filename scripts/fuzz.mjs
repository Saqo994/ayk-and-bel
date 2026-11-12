// «Хаотичный» прогон: бот случайно бегает, прыгает и стреляет, чтобы поймать ошибки, которые
// не видны при обычной проверке. Падает, если в игре случилась ошибка или картинка застыла.
// Запуск: npm run fuzz                 — бой с Белом, 3 минуты
//         npm run fuzz -- "?level=1" 120  — другой адрес и длительность в секундах
import { createServer } from 'vite';
import { chromium } from 'playwright';

const query = process.argv[2] || '?level=4&cp=3';
const seconds = Number(process.argv[3] || 180);
const server = await createServer({ logLevel: 'error', server: { port: 5187 } });
await server.listen();
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 6).join('\n')));
await page.goto(server.resolvedUrls.local[0] + query);
await page.waitForFunction(() => window.__sceneReady, null, { timeout: 20000 });

const keys = ['ArrowLeft', 'ArrowRight', 'Space', 'KeyX'];
const down = new Set();
const t0 = Date.now();
let lastFrame = -1;
let frozenAt = null;
let restarts = 0;
let wins = 0;
while ((Date.now() - t0) / 1000 < seconds && !errors.length) {
  const state = await page.evaluate(() => ({ scene: window.__sceneReady, frame: window.__game.loop.frame }));
  if (state.frame === lastFrame) {
    frozenAt = Math.round((Date.now() - t0) / 1000);
    break;
  }
  lastFrame = state.frame;
  if (state.scene === 'GameOver' || state.scene === 'Story' || state.scene === 'Ending' || state.scene === 'Menu') {
    for (const k of down) await page.keyboard.up(k);
    down.clear();
    if (state.scene === 'GameOver') restarts++;
    else wins++;
    await page.waitForTimeout(700);
    if (state.scene === 'Ending' || state.scene === 'Menu') await page.goto(server.resolvedUrls.local[0] + query);
    else await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    continue;
  }
  // случайное действие: нажать или отпустить одну из клавиш; вправо жмём чаще, чтобы дойти до босса
  const k = Math.random() < 0.3 ? 'ArrowRight' : keys[Math.floor(Math.random() * keys.length)];
  if (down.has(k) && Math.random() < 0.6) {
    await page.keyboard.up(k);
    down.delete(k);
  } else if (!down.has(k)) {
    await page.keyboard.down(k);
    down.add(k);
  }
  await page.waitForTimeout(60 + Math.random() * 500);
}
const info = await page.evaluate(() => {
  const g = window.__game.scene.getScene('Game');
  return g && g.boss ? { bossState: g.boss.state, bossHp: g.boss.hp, playerHp: g.player && g.player.hp } : {};
}).catch(() => ({}));
await browser.close();
await server.close();
console.log(`Прошло ${Math.round((Date.now() - t0) / 1000)} с, проигрышей: ${restarts}, побед: ${wins}`, JSON.stringify(info));
if (frozenAt !== null) console.log(`КАРТИНКА ЗАСТЫЛА на ${frozenAt}-й секунде`);
if (errors.length) console.log('ОШИБКИ:\n' + errors.join('\n'));
process.exit(errors.length || frozenAt !== null ? 1 : 0);
