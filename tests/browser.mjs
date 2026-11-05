// OLYMPUS: the game in a real browser, for tests (and for an agent's smoke run).
//
//   await withGame(async (page, errors, game) => { ... }, { port: 8223, query: 'play=walk&seed=4' })
//
// One call is one fresh world: it starts tools/serve.py on a port of its own (by default the
// browser tests' 8223, so its own browser origin and its own saves: never the play copy's :8200,
// whose origin holds the user's saves, nor the dev tree's :8201), waits until /VERSION answers,
// launches the system Chrome headless through playwright-core with the GPU on ANGLE's Metal backend
// (WebGL then renders as it does for the player, not in software), opens /?<query> and waits for
// window.__ready (the game sets it once its third frame is drawn). Then fn gets the page, the list
// of what went wrong (page errors, console errors, HTTP >= 400; the favicon excepted) and a few
// handles (game.open(query) to go elsewhere, game.origin). When fn is done the browser is closed
// and the server killed, whatever happened.
//
// Strict by default: anything in errors when fn returns fails the test, so no test can forget to
// look, and an error while the page is getting ready ends the wait at once (with the errors, not a
// bare timeout). A test that provokes an error on purpose reads it and empties the list
// (errors.length = 0), or passes strict: false if the error comes before the page is ready.
// A port that already answers is refused rather than shared: whatever serves there is not this
// tree. playwright-core is imported only when a browser is wanted, so a checkout without
// node_modules still runs the quick tests. CHROME in the environment names another Chrome.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { root as ROOT } from './helpers.mjs';

export const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const CHROME_ARGS = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
// OLYMPUS_TEST_PORT moves the default, so parallel agents (8230 to 8239) each run the heavy tests on their own.
export const BROWSER_TEST_PORT = Number(process.env.OLYMPUS_TEST_PORT) || 8223;
// The user's play copy and dev tree, and the sibling projects' ports (longhaul, tradecraft).
const NOT_OURS = new Set([8200, 8201, 8090, 8100, 8101, 8112, 8123]);
const SERVER_WAIT_MS = 5000, STEP_MS = 100, ERROR_GRACE_MS = 500;

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function answers(port, file = '') {
  try { await fetch(`http://127.0.0.1:${port}/${file}`, { signal: AbortSignal.timeout(1000) }); return true; } catch { return false; }
}

export async function withGame(fn, {
  port = BROWSER_TEST_PORT, query = '', at = '/', root = ROOT, viewport = { width: 1280, height: 720 },
  ready = 'window.__ready === true', timeoutMs = 30000, init = null, initArg = undefined, navigate = true, strict = true,
} = {}) {
  if (NOT_OURS.has(port)) throw new Error(`port ${port} is not for tests (8200 and 8201 are the user's; 8090, 8100, 8101, 8112 and 8123 the other projects')`);
  if (await answers(port)) throw new Error(`port ${port} already answers: some other server is there (lsof -nP -iTCP:${port} -sTCP:LISTEN)`);

  const server = spawn('python3', [path.join(ROOT, 'tools', 'serve.py'), String(port), root], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '', exited = false;
  server.stderr.on('data', d => { stderr += d; });
  const gone = new Promise(r => server.once('exit', () => { exited = true; r(); }));
  let browser = null;
  try {
    for (let waited = 0; !(await answers(port, 'VERSION')); waited += STEP_MS) {
      if (exited || waited >= SERVER_WAIT_MS) throw new Error(`tools/serve.py on ${port} did not come up${stderr ? `: ${stderr.trim().split('\n').pop()}` : ''}`);
      await sleep(STEP_MS);
    }
    const { chromium } = await import('playwright-core');
    browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_ARGS });
    const page = await browser.newPage({ viewport });
    const errors = [];
    // (Chrome's own "Failed to load resource" console line is left out: the response or the failed
    // request says the same with its URL. The favicon Chrome asks for by itself is nobody's error;
    // a request cut off by going to another page isn't either.)
    const favicon = u => u.endsWith('/favicon.ico');
    let onError = () => {};
    const note = (e) => { errors.push(e); onError(); };
    page.on('pageerror', e => note(`pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) note(`console: ${m.text()}`); });
    page.on('response', r => { if (r.status() >= 400 && !favicon(r.url())) note(`http ${r.status()}: ${r.url()}`); });
    page.on('requestfailed', r => { const why = r.failure()?.errorText ?? ''; if (!favicon(r.url()) && !/ERR_ABORTED/.test(why)) note(`request failed: ${r.url()} (${why})`); });
    if (init) await page.addInitScript(init, initArg);

    const origin = `http://localhost:${port}`;
    const url = (q = query) => {
      const qs = typeof q === 'string' ? q.replace(/^\?/, '') : new URLSearchParams(q).toString();
      return `${origin}${at}${qs ? `?${qs}` : ''}`;
    };
    // Go to a query and wait until the page says it's ready; a page that never does fails with
    // what went wrong on it (a module that didn't load, an error at start), not a bare timeout. When
    // strict, the first error while waiting ends the wait (a moment later, for the ones it brings):
    // the test would fail on it anyway, and a broken start shouldn't cost the whole timeout.
    const open = async (q = query, until = ready) => {
      const res = await page.goto(url(q), { waitUntil: 'load', timeout: timeoutMs });
      if (res && res.status() >= 400) throw new Error(`${url(q)}: HTTP ${res.status()}`);
      if ((await page.title()).startsWith('Directory listing for')) throw new Error(`${url(q)}: no page there (the server lists the folder: no index.html in ${root}?)`);
      const failed = new Promise(r => { onError = () => strict && r(); if (strict && errors.length) r(); }).then(() => sleep(ERROR_GRACE_MS)).then(() => 'error');
      try {
        const how = await Promise.race([page.waitForFunction(until, null, { timeout: timeoutMs }), failed]);
        if (how === 'error') throw new Error('an error');
      } catch (e) {
        const why = errors.length ? `:\n${errors.join('\n')}` : ` after ${timeoutMs} ms`;
        throw new Error(`${url(q)}: not ready (${until})${why}`);
      } finally { onError = () => {}; }
    };
    if (navigate) await open();
    await fn(page, errors, { origin, url, open, browser, port });
    if (strict && errors.length) throw new Error(`errors on the page:\n${errors.join('\n')}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (!exited) {
      server.kill();
      await Promise.race([gone, sleep(2000)]);
      if (!exited) { server.kill('SIGKILL'); await gone; }
    }
  }
}

// The median and the 95th percentile of the time between frames over n frames, in ms, measured
// in the page (requestAnimationFrame): the numbers a performance test prints.
export async function frameMs(page, frames = 120) {
  return page.evaluate(n => new Promise(res => {
    const ts = [];
    const f = t => {
      ts.push(t);
      if (ts.length <= n) return requestAnimationFrame(f);
      const d = ts.slice(1).map((t1, k) => t1 - ts[k]).sort((a, b) => a - b);
      res({ medianMs: d[d.length >> 1], p95Ms: d[Math.floor(d.length * 0.95)], frames: d.length });
    };
    requestAnimationFrame(f);
  }), frames);
}
