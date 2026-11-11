// Делает скриншоты всех сцен и уровней в docs/screenshots/ и падает, если в консоли браузера есть ошибки.
// Запуск: npm run shots            — все снимки
//         npm run shots -- level1  — только те, в названии которых есть «level1»
import { createServer } from 'vite';
import { chromium } from 'playwright';
import fs from 'fs';

const SHOTS = [
  { name: 'menu', q: '' },
  { name: 'story', q: '?scene=Story&i=0' },
  { name: 'level0-test', q: '?level=0&debug=1' },
  { name: 'level1-start', q: '?level=1' },
  { name: 'level1-cp1', q: '?level=1&cp=1' },
  { name: 'level1-cp2', q: '?level=1&cp=2' },
  { name: 'level1-cp3', q: '?level=1&cp=3' },
  { name: 'level2-start', q: '?level=2' },
  { name: 'level2-cp1', q: '?level=2&cp=1' },
  { name: 'level2-cp2', q: '?level=2&cp=2' },
  { name: 'level2-cp3', q: '?level=2&cp=3' },
  { name: 'level3-start', q: '?level=3' },
  { name: 'level3-cp1', q: '?level=3&cp=1' },
  { name: 'level3-cp2', q: '?level=3&cp=2' },
  { name: 'level3-cp3', q: '?level=3&cp=3' },
  { name: 'level4-start', q: '?level=4' },
  { name: 'level4-cp1', q: '?level=4&cp=1' },
  { name: 'level4-cp2', q: '?level=4&cp=2' },
  { name: 'level4-boss', q: '?level=4&cp=3', hold: ['ArrowRight', 1400], wait: 3500 },
  { name: 'gameover', q: '?scene=GameOver' },
  { name: 'ending', q: '?scene=Ending' },
];

const filter = process.argv[2];
const outDir = 'docs/screenshots';
fs.mkdirSync(outDir, { recursive: true });

const server = await createServer({ logLevel: 'error', server: { port: 5188 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const errors = [];

for (const s of SHOTS) {
  if (filter && !s.name.includes(filter)) continue;
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[${s.name}] ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[${s.name}] ${e.message}`));
  await page.goto(base + s.q);
  try {
    await page.waitForFunction(() => window.__sceneReady, null, { timeout: 20000 });
  } catch (e) {
    errors.push(`[${s.name}] сцена не запустилась за 20 секунд`);
  }
  if (s.hold) {
    // подержать клавишу (например, чтобы войти на арену босса)
    await page.keyboard.down(s.hold[0]);
    await page.waitForTimeout(s.hold[1]);
    await page.keyboard.up(s.hold[0]);
  }
  await page.waitForTimeout(s.wait ?? 2200);
  await page.screenshot({ path: `${outDir}/${s.name}.jpg`, type: 'jpeg', quality: 80 });
  console.log('снимок:', s.name);
  await page.close();
}

await browser.close();
await server.close();
if (errors.length) {
  console.error('\nОШИБКИ В КОНСОЛИ БРАУЗЕРА:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('Ошибок в консоли нет.');
