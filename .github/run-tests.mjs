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

// Every file index.html loads must be in the type check (jsconfig.json), so a new screen file can't slip past it.
{ const tags = [...(await readFile(join(root, 'index.html'), 'utf8')).matchAll(/src="(\w+\.js)\?v=/g)].map(m => m[1]);
  const checked = JSON.parse(await readFile(join(root, 'jsconfig.json'), 'utf8')).files;
  const missing = tags.filter(f => !checked.includes(f));
  if (missing.length) { console.error(`FAIL  not in jsconfig.json (so not type checked): ${missing.join(', ')}`); process.exit(1); } }

// Libraries load from vendor/, never a CDN (v3.9): only Google's sign-in script may come from outside, and every
// vendor file the app names (script tags and the pdf.js worker) must be there.
{ const html = await readFile(join(root, 'index.html'), 'utf8'), imp = await readFile(join(root, 'importers.js'), 'utf8');
  const outside = [...html.matchAll(/<script[^>]+src="(https?:[^"]+)"/g)].map(m => m[1]).filter(u => !/^https:\/\/accounts\.google\.com\//.test(u));
  const named = [...html.matchAll(/src="(vendor\/[^"]+)"/g), ...imp.matchAll(/'(vendor\/[^']+)'/g)].map(m => m[1]);
  const gone = []; for (const f of named) { try { await readFile(join(root, f)); } catch { gone.push(f); } }
  if (outside.length || gone.length || named.length < 5) { console.error(`FAIL  libraries: loaded from outside: ${outside.join(', ') || 'none'} · missing from vendor/: ${gone.join(', ') || 'none'} · vendor files named: ${named.length} (expected 5)`); process.exit(1); } }

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
  // The data file report shows on the Dashboard when it's due, and Got it notes it and hides it until the next (v3.9).
  const size = await app.evaluate(() => {
    data.sizeLog = []; render(); const shown = !document.querySelector('#size-card').hidden, text = document.querySelector('#size-body').textContent;
    document.querySelector('#size-ok').click();
    return { shown, mb: /is \d+\.\d MB, with \d+ days? in it/.test(text), first: /first report/.test(text), logged: data.sizeLog.length, hidden: document.querySelector('#size-card').hidden };
  });
  const sizeOk = size.shown && size.mb && size.first && size.logged === 1 && size.hidden;
  if (!sizeOk) console.error(`FAIL  app start-up: data file report ${JSON.stringify(size)}`);
  // On a phone, the header chips sit on their own line: they don't cover the status dot or Sync, and nothing runs off the edge (3.8.3).
  await app.setViewport({ width: 360, height: 800 });
  const hdr = await app.evaluate(() => {
    const hc = document.querySelector('#hc'); hc.hidden = false; hc.textContent = '⚠ 2 data issues';
    const r = s => document.querySelector(s).getBoundingClientRect(), over = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
    const sync = r('#btn-sync'), st = r('.status'), chips = [r('#pc'), r('#hc')];
    return { off: sync.right > innerWidth || document.querySelector('.hdr').scrollWidth > document.querySelector('.hdr').clientWidth, covered: chips.some(c => over(c, sync) || over(c, st)) };
  });
  await app.setViewport({ width: 800, height: 600 });   // puppeteer's default, which the checks below were written against
  const hdrOk = !hdr.off && !hdr.covered;
  if (!hdrOk) console.error(`FAIL  app start-up: phone header ${JSON.stringify(hdr)}: the chips cover the status dot or Sync, or the header runs off the edge`);
  // A gauge arc 80% of the way round still bends the short way (the 3.5 gauge swung round the wrong side past halfway).
  const arc = await app.evaluate(() => arcPath(110, 112, 92, 0, 0.8));
  const arcOk = / A92 92 0 0 1 /.test(arc);
  if (!arcOk) console.error(`FAIL  app start-up: gauge arc past halfway is drawn the long way round: ${arc}`);
  // The private marks on Log today save, and reach the Coach (dayDigest is what Claude is sent about a day).
  const pv = await app.evaluate(async () => {
    logDate = todayKey(); renderLog();
    document.querySelector('#f-pv [data-pv="i"] button[data-v="me"]').click();
    document.querySelector('#f-pv [data-pv="c"] button[data-v="0"]').click();
    await saveLogDay();
    return [JSON.stringify(data.days[todayKey()].pv), JSON.stringify(dayDigest(todayKey()).intimacy)];
  });
  const pvOk = pv[0] === '{"i":"me","c":false}' && pv[1] === '{"initiated_by":"user","happened":false}';
  if (!pvOk) console.error(`FAIL  app start-up: private marks ${JSON.stringify(pv)}, expected saved {"i":"me","c":false} and sent to the Coach as initiated_by user, happened false`);
  // A window left open picks up new files by itself: with a stand-in Drive, coming back to it after 5 minutes
  // reloads other devices' saves and checks the Inbox; mid-edit it waits; with Google's sign-in expired it says to click Sync.
  const bg = await app.evaluate(async () => {
    let inbox = 0, remote = { ...normalize({}), days: { '2026-11-05': { steps: 4242 } } };
    const realValid = Drive.valid, realLoad = Drive.load, realSave = Drive.save, realInbox = checkInbox, realHealth = loadHealth;
    Drive.valid = () => true; Drive.load = async () => normalize(structuredClone(remote)); Drive.save = async o => { remote = structuredClone(o); };
    checkInbox = async () => { inbox++; return 0; }; loadHealth = () => {};
    store = Drive;
    const out = {};
    logDirty = true; lastSyncAt = 0; await backgroundSync(); out.waitsMidEdit = inbox === 0; logDirty = false;
    lastSyncAt = 0; await backgroundSync(); out.synced = inbox === 1 && data.days['2026-11-05']?.steps === 4242;
    await backgroundSync(); out.notTwiceIn5Min = inbox === 1;
    Drive.valid = () => false; lastSyncAt = 0; await backgroundSync(); out.expired = inbox === 1 && /click Sync/.test(document.querySelector('#st-lbl').textContent);
    Object.assign(Drive, { valid: realValid, load: realLoad, save: realSave }); checkInbox = realInbox; loadHealth = realHealth; store = LocalStore;
    return out;
  });
  const bgOk = Object.values(bg).every(Boolean);
  if (!bgOk) console.error(`FAIL  app start-up: background sync ${JSON.stringify(bg)}`);
  // v3.7 screens: with Withings body composition, a waist and 4 weeks of food and weigh-ins, the Weight page shows
  // Body composition, Waist and Your burn, and the Dashboard shows the Today card.
  const v37 = await app.evaluate(() => {
    const t = todayKey();
    for (let i = 40; i >= 1; i--) { const k = addDays(t, -i), d = day(k); d.weight = Math.round((260 + i * 0.25) * 10) / 10; d.weightUnit = 'lb'; d.weightSource = 'withings';
      d.comp = { fatKg: 38 + i * 0.08, leanKg: 84 + i * 0.03, fatPct: 31, muscleKg: 79, boneKg: 4.2, waterKg: 60, visceral: 14, bmr: 2400, source: 'withings' };
      d.food = [{ name: 'x', meal: 'Lunch', calories: 1900, source: 'loseit' }]; d.loseItGen = d.loseItAt = new Date(keyToDate(addDays(k, 1)).getTime() + 8 * 36e5).toISOString(); }
    day(addDays(t, -3)).waist = { v: 44, unit: 'in' };
    data.weightCfg = { ...(data.weightCfg || {}), goal: 200, heightIn: 72 };
    dashDate = t; render(); openMetric('weight');
    const w = document.querySelector('#m-weight').textContent;
    return { comp: /Body composition/.test(w) && /Muscle mass/.test(w), waist: /Waist/.test(w) && /waist ÷ height/.test(w), burn: /Your burn/.test(w) && /cal a day you burn/.test(w), today: !document.querySelector('#ts-card').hidden };
  });
  const v37Ok = Object.values(v37).every(Boolean);
  if (!v37Ok) console.error(`FAIL  app start-up: v3.7 screens ${JSON.stringify(v37)}`);
  // v3.10 layout: on a 375 px phone nothing scrolls sideways, the chosen tab scrolls into view and the tab bar shows it
  // scrolls; the Save day bar stays on screen while Log has unsaved changes; on desktop the 1–5 buttons sit on one line;
  // a new tab opens at its top.
  await app.setViewport({ width: 375, height: 812 });
  const v310p = await app.evaluate(async () => {
    const tick = () => new Promise(r => setTimeout(r, 50));
    goTab('dash'); await tick();
    const wide = document.documentElement.scrollWidth <= innerWidth;
    goTab('log'); await tick();
    const n = document.querySelector('#tabs'), on = n.querySelector('.on').getBoundingClientRect(), nr = n.getBoundingClientRect();
    const tabInView = on.left >= nr.left - 1 && on.right <= nr.right + 1, faded = /more-[lr]/.test(n.className);
    document.querySelector('#tab-log .scale button').click(); window.scrollTo(0, 0); await tick();
    const bar = document.querySelector('#l-savebar'), barShown = bar.classList.contains('dirty') && bar.getBoundingClientRect().bottom <= innerHeight;
    renderLog(); const barGone = !bar.classList.contains('dirty');
    return { wide, tabInView, faded, barShown, barGone };
  });
  await app.setViewport({ width: 1280, height: 900 });
  const v310d = await app.evaluate(async () => {
    const tick = () => new Promise(r => setTimeout(r, 50));
    goTab('log'); await tick();
    const oneLine = [...document.querySelectorAll('#tab-log .scale:not(.pv .scale)')].every(sc => new Set([...sc.children].map(b => Math.round(b.getBoundingClientRect().top))).size === 1);
    window.scrollTo(0, 1500); goTab('train'); await tick();
    return { oneLine, top: window.scrollY === 0 };
  });
  await app.setViewport({ width: 800, height: 600 });
  const v310Ok = Object.values(v310p).every(Boolean) && Object.values(v310d).every(Boolean);
  if (!v310Ok) console.error(`FAIL  app start-up: v3.10 layout phone ${JSON.stringify(v310p)} desktop ${JSON.stringify(v310d)}`);
  if (process.env.SHOTS) { await app.setViewport({ width: 1280, height: 2400 }); await app.screenshot({ path: process.env.SHOTS + '/weight.png', fullPage: true });
    await app.evaluate(() => { closeMetric?.(); goTab('dash'); }); await app.screenshot({ path: process.env.SHOTS + '/dash.png' }); }
  const appOk = saved === 9 && half === '½' && paceOk && hdrOk && sizeOk && arcOk && pvOk && bgOk && v37Ok && v310Ok && !errors.length;
  for (const e of errors) console.error('FAIL  app start-up: page error:', e);
  if (saved !== 9) console.error(`FAIL  app start-up: saved steps ${saved}, expected 9`);
  console.log(`app start-up check ${appOk ? 'passed' : 'failed'}`);
  if (!appOk) code = 1;
} catch (e) { console.error('Could not run the tests:', e.message); code = 1; }
await browser.close();
server.close();
process.exit(code);
