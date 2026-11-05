// OLYMPUS: screenshot a page in headless Chrome, and report what went wrong on it.
//
//   node tools/shot.mjs <url> <out.png> [--size 1600x1000] [--ready <js expression>] [--timeout 30000]
//
// The system Chrome (CHROME in the environment names another), driven by playwright-core (a dev
// dependency), with the GPU through ANGLE's Metal backend so WebGL renders as it does for the
// player rather than in software. The page is shot once --ready is true (default: window.__ready,
// which the game and a sample set once their third frame is drawn). Page errors, console errors
// and failed requests (by URL) are printed, and fail the run, so a broken page never passes as a
// picture. If the page sets window.__report (numbers a page publishes about what it shows), it's
// printed too, and window.__renderer (the GL renderer string) after the file's name.
//
// The URL is served by someone else (./play.sh --dev on :8201, or tools/serve.py on a port of your
// own, 8230 to 8239 for an agent): never the play copy's :8200, whose origin holds the user's saves.
import { chromium } from 'playwright-core';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : dflt; };
const [w, h] = opt('--size', '1600x1000').split('x').map(Number);
const ready = opt('--ready', 'window.__ready === true');
const timeout = Number(opt('--timeout', '30000'));
const [url, out] = args;
if (!url || !out) { console.error('usage: node tools/shot.mjs <url> <out.png> [--size WxH] [--ready expr] [--timeout ms]'); process.exit(1); }

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: w, height: h } });
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(`console: ${m.text()}`); });
page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`http ${r.status()}: ${r.url()}`); });
try {
  await page.goto(url, { waitUntil: 'load', timeout });
  await page.waitForFunction(ready, null, { timeout });
  await page.screenshot({ path: out });
  const gl = await page.evaluate(() => window.__renderer || '');
  console.log(`${out} (${w}x${h})${gl ? ` · ${gl}` : ''}`);
  const report = await page.evaluate(() => window.__report);
  if (report) console.log(JSON.stringify(report, null, 1));
} catch (e) {
  errors.push(`shot: ${e.message.split('\n')[0]}`);
} finally {
  await browser.close();
}
if (errors.length) { console.log(errors.join('\n')); process.exitCode = 1; }
