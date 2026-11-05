// Opens tests.html in a headless browser and fails (exit 1) if any check fails. Used by .github/workflows/tests.yml.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer';

const root = process.cwd();
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try { const body = await readFile(join(root, path === '/' ? 'tests.html' : path)); res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end('not found'); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const { port } = server.address();

const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
let code = 1;
try {
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(`http://127.0.0.1:${port}/tests.html`, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction('window.TEST_RESULTS', { timeout: 60000 });
  const r = await page.evaluate(() => window.TEST_RESULTS);
  for (const t of r.results.filter(x => !x.ok)) console.error(`FAIL  ${t.group} › ${t.name}\n      ${t.error}`);
  console.log(`${r.pass} of ${r.total} checks passed`);
  code = r.fail ? 1 : 0;

  // The real app starts, in this-computer-only mode with a made-up day, saves an edit, and shows no errors.
  const app = await browser.newPage(), errors = [];
  app.on('pageerror', e => errors.push(e.message));
  await app.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load', timeout: 60000 });
  await app.evaluate(() => localStorage.setItem('hs-local-data', JSON.stringify({ days: { '2026-10-01': { steps: 5 } } })));
  const saved = await app.evaluate(async () => {
    await startApp('local'); day('2026-10-01').steps = 9; touch('2026-10-01'); await persist();
    return JSON.parse(localStorage.getItem('hs-local-data')).days['2026-10-01'].steps;
  });
  // Half credit shows on the real screen: 6,000 steps today draws a ½ box in Log today.
  const half = await app.evaluate(() => { logDate = todayKey(); day(logDate).steps = 6000; render(); return document.querySelector('#an-boxes .anchor.half .ck')?.textContent; });
  if (half !== '½') console.error(`FAIL  app start-up: no ½ box for 6,000 steps (got ${JSON.stringify(half)})`);
  // Losing 3 lb a week for 5 weeks shows the red ♥ health chip, and it isn't counted as a data issue.
  const pace = await app.evaluate(() => {
    for (let i = 35; i >= 0; i--) { const d = day(addDays(todayKey(), -i)); d.weightUnit = 'lb'; d.weight = Math.round((200 - 3 / 7 * (35 - i)) * 10) / 10; }
    render(); const pc = document.querySelector('#pc'), hc = document.querySelector('#hc');
    return [!pc.hidden && pc.textContent, healthRows().some(r => /pace/i.test(r[1])), hc.hidden || !/data issue/.test(hc.textContent) || hc.className];
  });
  const paceOk = pace[0] === '♥ Losing too fast' && pace[1] === false;
  if (!paceOk) console.error(`FAIL  app start-up: pace chip ${JSON.stringify(pace)}, expected "♥ Losing too fast" and no pace row in Data health`);
  const appOk = saved === 9 && half === '½' && paceOk && !errors.length;
  for (const e of errors) console.error('FAIL  app start-up: page error:', e);
  if (saved !== 9) console.error(`FAIL  app start-up: saved steps ${saved}, expected 9`);
  console.log(`app start-up check ${appOk ? 'passed' : 'failed'}`);
  if (!appOk) code = 1;
} catch (e) { console.error('Could not run the tests:', e.message); code = 1; }
await browser.close();
server.close();
process.exit(code);
