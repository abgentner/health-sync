// Screenshot comparison: draws the key screens with made-up data at a frozen date and time, and compares them pixel
// by pixel with the saved pictures in .github/screens/. A change that moves or breaks a screen (like the 3.5 gauge
// drawn the wrong way round) fails here even when no check looks at that screen.
//   node .github/screens.mjs                      compare (GitHub's test run). A screen with no saved picture yet passes,
//                                                 and its new picture goes to screens-new/ in the run's artifacts.
//   UPDATE_SCREENS=1 node .github/screens.mjs     save new pictures (the "Update screenshots" workflow does this)
//   SCREENS_OUT=dir node .github/screens.mjs      just draw them into dir, to look at (fonts differ between computers,
//                                                 so pictures from a Mac never match GitHub's)
// Differences show in screens-diff/ (red = changed pixels). If a change is intended, run "Update screenshots".
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer';

const root = process.cwd(), saved = join(root, '.github/screens');
const UPDATE = process.env.UPDATE_SCREENS === '1', OUT = process.env.SCREENS_OUT || null;
const T0 = Date.parse('2026-11-04T10:30:00-08:00');   // a Wednesday morning, Pacific time
const MAX_CHANGED = 0.001;                            // more than 0.1% of the pixels changed = a real change
const SHOTS = [
  { name: 'dashboard', width: 1280, tab: 'dash' },
  { name: 'weight', width: 1280, metric: 'weight' },
  { name: 'log', width: 1280, tab: 'log' },
  { name: 'training', width: 1280, tab: 'train' },
  { name: 'dashboard-phone', width: 390, tab: 'dash' },
  { name: 'weight-phone', width: 390, metric: 'weight' },
];

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = http.createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try { const body = await readFile(join(root, path)); res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end('not found'); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));

let PNG = null, pixelmatch = null;
if (!UPDATE && !OUT) { ({ PNG } = await import('pngjs')); pixelmatch = (await import('pixelmatch')).default; }

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--font-render-hinting=none'] });
let failed = 0;
try {
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Freeze the clock: "today", greetings and "synced at" times are the same on every run.
  await page.evaluateOnNewDocument(t0 => {
    const R = Date;
    function D(...a) { return a.length ? new R(...a) : new R(t0); }
    D.prototype = R.prototype; D.now = () => t0; D.parse = R.parse; D.UTC = R.UTC;
    window.Date = D;
  }, T0);
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html`, { waitUntil: 'load', timeout: 60000 });
  await page.addStyleTag({ content: '*{caret-color:transparent!important;transition:none!important;animation:none!important;scroll-behavior:auto!important}' });
  // Made-up data shaped like real use: 8 weeks losing about 1.5 lb a week, food, steps, sleep, walks and lifting.
  await page.evaluate(() => {
    const t = todayKey(), days = {}, w = i => Math.round((262 + i * 0.21 + Math.sin(i * 1.7) * 0.8) * 10) / 10;
    for (let i = 56; i >= 1; i--) {
      const k = addDays(t, -i), wd = keyToDate(k).getDay(), d = days[k] = {};
      d.weight = w(i); d.weightUnit = 'lb'; d.weightSource = 'health'; d.health = { bodyFat: Math.round((30 + i * 0.03) * 10) / 10, restingHR: 58 + (i % 4), hrv: 42 + (i % 7) };
      d.steps = 6000 + ((i * 1373) % 5200); d.stepsSource = 'health';
      d.sleep = { hours: Math.round((6.4 + ((i * 7) % 12) / 10) * 10) / 10, score: 70 + (i % 15), source: 'garmin', start: '22:' + String(10 + (i % 40)).padStart(2, '0') };
      d.food = [{ id: 'b' + i, name: 'Kate Farms shake', meal: 'Breakfast', calories: 325, protein: 16, carbs: 38, fat: 12, fiber: 6, sodium: 260, source: 'loseit' },
        { id: 'l' + i, name: 'Chicken salad', meal: 'Lunch', calories: 520 + (i % 5) * 40, protein: 45, carbs: 30, fat: 22, fiber: 8, sodium: 900, source: 'loseit' },
        { id: 'd' + i, name: 'Salmon and vegetables', meal: 'Dinner', calories: 640 + (i % 3) * 90, protein: 48, carbs: 40, fat: 26, fiber: 9, sodium: 700, source: 'loseit' }];
      d.loseItGen = d.loseItAt = new Date(keyToDate(addDays(k, 1)).getTime() + 8 * 36e5).toISOString();
      d.workouts = wd === 1 || wd === 4 ? [{ id: 's' + i, title: 'Strength', type: 'strength_training', start: k + 'T07:00', durationMin: 40, calories: 210, source: 'garmin' }]
        : i % 2 ? [{ id: 'w' + i, title: 'Walk', type: 'walking', start: k + 'T12:10', durationMin: 35, calories: 160, source: 'strava' }] : [];
      d.feel = { mood: 3 + (i % 3 === 0 ? 1 : 0), energy: 3 + (i % 2), stress: 2 + (i % 3 === 1 ? 1 : 0), tags: i % 5 ? [] : ['tired'] };
      if (wd === 1) d.waist = { v: Math.round((44 - (56 - i) * 0.05) * 4) / 4, unit: 'in' };
      if (i % 9 === 0) d.drinks = 2;
    }
    days[addDays(t, -14)].pushups = 22;
    localStorage.setItem('hs-local-data', JSON.stringify({ days, weightCfg: { goal: 200, heightIn: 72, start: 274.8, startDate: addDays(t, -56), step: 5, rate: 2 } }));
    localStorage.setItem('hs-settings', JSON.stringify({ units: 'imperial', theme: 'light', span: 7 }));
  });
  await page.evaluate(async () => { if (window.Chart) Chart.defaults.animation = false; await startApp('local'); });
  for (const s of SHOTS) {
    await page.setViewport({ width: s.width, height: 900, deviceScaleFactor: 1 });
    await page.evaluate(sh => { if (typeof closeMetric === 'function' && metricKey) closeMetric(); dashDate = todayKey(); goTab(sh.metric ? 'dash' : sh.tab); if (sh.metric) openMetric(sh.metric); else render(); window.scrollTo(0, 0); }, s);
    await new Promise(r => setTimeout(r, 400));
    const shot = await page.screenshot({ fullPage: true });
    if (OUT || UPDATE) { const dir = OUT || saved; await mkdir(dir, { recursive: true }); await writeFile(join(dir, s.name + '.png'), shot); console.log(`saved ${s.name}.png`); continue; }
    const file = join(saved, s.name + '.png');
    if (!existsSync(file)) { await mkdir('screens-new', { recursive: true }); await writeFile(join('screens-new', s.name + '.png'), shot); console.log(`NEW   ${s.name}: no saved picture yet (see screens-new/; run "Update screenshots" to keep it)`); continue; }
    const a = PNG.sync.read(await readFile(file)), b = PNG.sync.read(shot);
    if (a.width !== b.width || a.height !== b.height) {
      failed++; await mkdir('screens-diff', { recursive: true }); await writeFile(join('screens-diff', s.name + '.png'), shot);
      console.error(`FAIL  ${s.name}: the page changed size (${a.width}×${a.height} → ${b.width}×${b.height})`); continue;
    }
    const diff = new PNG({ width: a.width, height: a.height });
    const n = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 }), share = n / (a.width * a.height);
    if (share > MAX_CHANGED) {
      failed++; await mkdir('screens-diff', { recursive: true });
      await writeFile(join('screens-diff', s.name + '-diff.png'), PNG.sync.write(diff)); await writeFile(join('screens-diff', s.name + '-now.png'), shot);
      console.error(`FAIL  ${s.name}: ${(share * 100).toFixed(2)}% of the pixels changed (see screens-diff/)`);
    } else console.log(`same  ${s.name}`);
  }
  if (errors.length) { failed++; for (const e of errors) console.error('FAIL  page error:', e); }
} catch (e) { failed++; console.error('Could not draw the screens:', e.message); }
await browser.close();
server.close();
console.log(failed ? `screens: ${failed} changed` : 'screens: all match (or new)');
process.exit(failed ? 1 : 0);
