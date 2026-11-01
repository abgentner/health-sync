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
} catch (e) { console.error('Could not run the tests:', e.message); }
await browser.close();
server.close();
process.exit(code);
