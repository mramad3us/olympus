// The bench card in a real browser (heavy): ?bench=squadbay-night boots, runs its scene for its 20 s
// (src/data/bench.js: the barracks at 23:00, seed 48213, the aisle walked east, west and back, then
// still), and shows the card with every field (frame median, p95, p99, max and those over 25 ms,
// draw calls, triangles, programs, uploads, view CPU, the sim's ms a tick, the metres walked, the renderer,
// the screen), window.__bench holding the same numbers; Copy results puts benchText()'s lines on the
// clipboard. ?bench=1 is the same scene. Nothing is written to the saves. The build sheet 0.0.3 §5.4.
// Prints the result as the card's text gives it (the headless clock's pacing is the harness's, not
// the game's: render-bench and view-browser judge the frame times). On OLYMPUS_TEST_PORT.
// The 0.0.4 round's (the build sheet §5.4): ?bench=splash-sleep, R at your rack and the night's full
// splash, gives the card its splash row, { frames, medianMs, p95Ms, over25 } of the frames the splash
// showed, and a seventh line in the copied text.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { BENCH_SCENES, BENCH_DEFAULT, BENCH_S, BENCH_WARM_S } from '../src/data/bench.js';
import { benchResult, benchText, splashOf } from '../src/ui/cards/bench.js';

const FIELDS = ['scene', 'version', 'ppm', 'seconds', 'frames', 'medianMs', 'p95Ms', 'p99Ms', 'maxMs', 'over25', 'drawCallsMax', 'trianglesMax', 'programs', 'uploadsMaxBytes', 'viewMedianMs', 'viewP95Ms', 'ticks', 'simMsPerTick', 'walkedM', 'renderer', 'dpr', 'window', 'picture', 'threads'];

export default [
  {
    name: 'the bench scene is one definition: its keys last BENCH_S (20 s) after BENCH_WARM_S (2 s), and a result reads as six lines',
    fn() {
      const sc = BENCH_SCENES[BENCH_DEFAULT], keysMs = sc.keys.reduce((a, [, ms]) => a + ms, 0);
      const r = benchResult({ frames: Array.from({ length: 1200 }, (_, i) => ({ dt: i % 100 === 0 ? 30 : 16.7, calls: 40, triangles: 9000, programs: 9, viewMs: 0.8, ticks: i % 3 === 0 ? 1 : 0, tickMs: i % 3 === 0 ? 0.12 : 0, bytes: i === 5 ? 4096 : 0 })), walkedM: 15.2 },
        { name: BENCH_DEFAULT, version: 'test', ppm: 24, renderer: 'a GPU', dpr: 2, window: [1600, 1000], picture: [960, 600], threads: 10 });
      const text = benchText(r);
      console.log(`      ${BENCH_DEFAULT}: ${sc.play} at ${sc.hour}:00, seed ${sc.seed}, at ${sc.at.area} (${sc.at.x}, ${sc.at.z}) facing ${sc.at.face}; keys ${sc.keys.map(([k, ms]) => `${k ?? 'none'} ${ms / 1000} s`).join(', ')} = ${keysMs / 1000} s after ${sc.warmS} s`);
      for (const line of text.split('\n')) console.log(`        ${line}`);
      assert(keysMs === BENCH_S * 1000 && sc.warmS === BENCH_WARM_S, JSON.stringify({ keysMs, warmS: sc.warmS }));
      assert(r.frames === 1200 && r.over25 === 12 && r.medianMs === 16.7 && r.uploadsMaxBytes === 4096 && r.simMsPerTick === 0.12 && r.ticks === 400 && text.split('\n').length === 6, JSON.stringify(r));
    },
  },
  {
    name: '?bench=squadbay-night runs 20 s and shows the card with every field; window.__bench holds them; Copy results copies the text',
    heavy: true,
    timeoutMs: 150000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: game.origin });
        const t0 = Date.now();
        await page.waitForFunction(() => window.__bench && document.querySelector('.glass.bench'), null, { timeout: 60000 });
        const tookS = (Date.now() - t0) / 1000;
        const r = await page.evaluate(() => window.__bench);
        const card = await page.evaluate(() => ({ text: document.querySelector('.glass.bench').innerText, copy: !!document.querySelector('.glass.bench .copy'), saves: window.__olympus.state.meta.scenario }));
        const missing = FIELDS.filter(k => r[k] === undefined || r[k] === null || (typeof r[k] === 'number' && !Number.isFinite(r[k])));
        await page.click('.glass.bench .copy');
        await page.waitForFunction(() => /Copied|failed/.test(document.querySelector('.glass.bench .copied').textContent), null, { timeout: 5000 });
        const copied = await page.evaluate(async () => ({ said: document.querySelector('.glass.bench .copied').textContent, clip: await navigator.clipboard.readText().catch(e => `(no read: ${e.message})`), text: document.querySelector('.glass.bench .benchtext').value }));
        const dbs = await page.evaluate(async () => (await indexedDB.databases?.())?.map(d => d.name) ?? null);
        console.log(`      the card after ${fmt(tookS, 1)} s of waiting (the scene's 20 s, its 2 s to settle and the boot):`);
        for (const line of copied.text.split('\n')) console.log(`        ${line}`);
        console.log(`      Copy results: '${copied.said}'; the clipboard ${copied.clip === copied.text ? 'holds the card\'s text' : `differs: ${copied.clip.slice(0, 60)}`}; databases opened: ${JSON.stringify(dbs)}`);
        assert(!missing.length, `fields missing: ${missing.join(', ')} in ${JSON.stringify(r)}`);
        assert(r.scene === 'squadbay-night' && r.seconds >= 19 && r.seconds <= 21.5 && r.frames >= 100 && card.copy, JSON.stringify(r));
        assert(r.walkedM >= 10, `the keys walked ${r.walkedM} m (4 + 8 + 4 s at 1.14 m/s less the stops)`);
        assert(/Copied/.test(copied.said) && copied.clip === copied.text, JSON.stringify(copied));
        for (const k of ['frames', 'median', 'p95', 'p99', 'draw calls', 'triangles', 'programs', 'uploads', 'view CPU', 'renderer', 'DPR']) assert(copied.text.includes(k), `the text lacks '${k}'`);
      }, { query: 'bench=squadbay-night', timeoutMs: 60000 });
    },
  },
  {
    name: '?bench=1 is the same scene',
    heavy: true,
    timeoutMs: 150000,
    async fn() {
      await withGame(async (page) => {
        await page.waitForFunction(() => window.__bench, null, { timeout: 60000 });
        const r = await page.evaluate(() => window.__bench);
        console.log(`      ?bench=1: ${r.scene}, ${r.frames} frames, median ${r.medianMs} ms, p95 ${r.p95Ms} ms, draw calls ${r.drawCallsMax}, walked ${r.walkedM} m`);
        assert(r.scene === 'squadbay-night', JSON.stringify(r));
      }, { query: 'bench=1', timeoutMs: 60000 });
    },
  },
  {
    name: 'a scene with a splash adds its row: the splash\'s frames alone, { frames, medianMs, p95Ms, over25 }, and a seventh line',
    fn() {
      const frames = Array.from({ length: 600 }, (_, i) => ({ dt: i % 50 === 0 ? 28 : 16.7, splash: i >= 100 && i < 560 ? 'lapse' : null }));
      const s = splashOf(frames), r = benchResult({ frames, walkedM: 0 }, { name: 'splash-sleep', version: 'test', ppm: 16 }), lines = benchText(r).split('\n');
      console.log(`      ${JSON.stringify(s)}; the text's last line: '${lines.at(-1)}'`);
      assert(s.frames === 460 && s.medianMs === 16.7 && s.over25 === 10 && lines.length === 7 && /^splash frames 460/.test(lines.at(-1)) && splashOf([{ dt: 16 }]) === null, JSON.stringify({ s, lines }));
      assert(BENCH_SCENES['splash-sleep']?.keys?.[0]?.[0] === 'KeyR', 'the splash-sleep scene presses R');
    },
  },
  {
    name: '?bench=splash-sleep: R at the rack, the night\'s splash timed; the card\'s splash row',
    heavy: true,
    timeoutMs: 150000,
    async fn() {
      await withGame(async (page) => {
        await page.waitForFunction(() => window.__bench && document.querySelector('.glass.bench'), null, { timeout: 60000 });
        const r = await page.evaluate(() => window.__bench), text = await page.evaluate(() => document.querySelector('.glass.bench .benchtext').value);
        console.log(`      splash-sleep: ${r.frames} frames, median ${r.medianMs} ms, p95 ${r.p95Ms} ms; the splash: ${JSON.stringify(r.splash)}`);
        for (const line of text.split('\n')) console.log(`        ${line}`);
        assert(r.scene === 'splash-sleep' && r.splash && r.splash.frames >= 20 && /splash frames/.test(text), JSON.stringify(r));
      }, { query: 'bench=splash-sleep', timeoutMs: 60000 });
    },
  },
];
