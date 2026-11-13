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
// The 0.0.5 round's (the build sheet §2.3 (g), §5.4): ?bench=range-line, test-handling's 'bench' setup (the
// mode entered, prone, aimed at your card, one magazine of 15), its keys Digit6 (Fire, the core's shot in layout C) tapped 15 times, 1.3 s
// apart, each a Fire at the normal tempo through the step panel as a player's tap sends it: 15 shots, the
// card's row and the range's holes.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { BENCH_SCENES, BENCH_DEFAULT, BENCH_S, BENCH_WARM_S } from '../src/data/bench.js';
import { benchResult, benchText, splashOf, bangOf } from '../src/ui/cards/bench.js';

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
  {
    name: '?bench=range-line: test-handling\'s bench setup, Digit6 tapped 15 times through the step panel, each a Fire: 15 shots on the card, the frame times and draw calls of the line',
    heavy: true,
    timeoutMs: 150000,
    async fn() {
      const sc = BENCH_SCENES['range-line'];
      assert(sc && sc.play === 'test-handling' && sc.setup === 'bench', `the bench scene range-line (the stage's src/data/bench.js): ${JSON.stringify(sc ?? null)}`);
      const keysMs = sc.keys.reduce((a, [, ms]) => a + ms, 0), taps = sc.keys.filter(([k]) => k === 'Digit6').length;
      await withGame(async (page) => {
        await page.waitForFunction(() => window.__bench && document.querySelector('.glass.bench'), null, { timeout: 90000 });
        const r = await page.evaluate(() => window.__bench);
        const range = await page.evaluate((h) => ({ summary: window[h].range()?.summary ?? null, paper: document.querySelector('.paper')?.dataset.text ?? null, scenario: window[h].state.meta.scenario }), '__olympus');
        console.log(`      range-line: ${taps} taps of Digit6 over ${keysMs / 1000} s; ${r.frames} frames, median ${r.medianMs} ms, p95 ${r.p95Ms} ms, max ${r.maxMs} ms, over 25 ms ${r.over25}, draw calls ${r.drawCallsMax}, uploads ${r.uploadsMaxBytes} B; the range: ${JSON.stringify(range.summary)}`);
        assert(r.scene === 'range-line' && range.scenario === 'test-handling' && r.frames >= 100, JSON.stringify(r));
        assert(range.summary?.shots === taps, `the taps fired ${range.summary?.shots} of ${taps}: ${JSON.stringify(range.summary)}`);
      }, { query: 'bench=range-line', timeoutMs: 90000 });
    },
  },
  {
    name: '?bench=pairs-bangs (0.0.9; ROADMAP\'s bang-room, on the bay): the Boot recruit\'s banged standby on 48213, 20 s: the three bangs drawn, the startle, the turn; 60 fps at the median, p95 at most 18 ms, no frame over 25 ms at a bang (the card\'s bang row)',
    heavy: true,
    timeoutMs: 150000,
    async fn() {
      const sc = BENCH_SCENES['pairs-bangs'];
      assert(sc && sc.play === 'test-pairs' && sc.setup === 'bangs:standby' && sc.tier === 'recruit', JSON.stringify(sc ?? null));
      await withGame(async (page) => {
        await page.waitForFunction(() => window.__bench && document.querySelector('.glass.bench'), null, { timeout: 90000 });
        const r = await page.evaluate(() => window.__bench), text = await page.evaluate(() => document.querySelector('.glass.bench .benchtext').value);
        const scene = await page.evaluate((h) => ({ bangs: (window[h].state.armoury.range.bangs?.plan ?? []).filter(b => b.done).length, sheet: window[h].pairs()?.sheet, froze: window[h].supp()?.now?.froze ?? null }), '__olympus');
        console.log(`      pairs-bangs: ${r.frames} frames, median ${r.medianMs} ms, p95 ${r.p95Ms} ms, max ${r.maxMs} ms, over 25 ms ${r.over25}; at a bang ${JSON.stringify(r.bang)}; ${scene.bangs} bangs on the ${scene.sheet}, froze ${scene.froze?.ms} ms`);
        for (const line of text.split('\n')) console.log(`        ${line}`);
        // (a CPU or frame ceiling under load: the machine's band is the runner's, said at its start; rerun alone before believing it)
        assert(r.scene === 'pairs-bangs' && scene.bangs === 3 && r.bang && r.bang.frames >= 3 && /bang frames/.test(text), JSON.stringify({ r, scene }));
        assert(r.medianMs <= 17.5 && r.p95Ms <= 18 && r.bang.over25 === 0, JSON.stringify({ median: r.medianMs, p95: r.p95Ms, bang: r.bang }));
      }, { query: 'bench=pairs-bangs', timeoutMs: 90000 });
    },
  },
  {
    name: '?bench=stress-din (0.0.10; the build sheet 0.0.10 §2.3, §8 item 22): the Boot recruit in the din\'s standby on 48213, 20 s: the air horn, the thirty blanks\' flashes at the coach\'s muzzle, the turn; 60 fps at the median, p95 at most 18 ms, no frame over 25 ms at a blank (the card\'s "at a bang" row counts the blanks\' frames)',
    heavy: true,
    timeoutMs: 150000,
    async fn() {
      const sc = BENCH_SCENES['stress-din'];
      assert(sc && sc.play === 'test-stress' && sc.setup === 'standby:1' && sc.tier === 'recruit' && sc.seed === 48213, JSON.stringify(sc ?? null));
      await withGame(async (page) => {
        await page.waitForFunction(() => window.__bench && document.querySelector('.glass.bench'), null, { timeout: 90000 });
        const r = await page.evaluate(() => window.__bench), text = await page.evaluate(() => document.querySelector('.glass.bench .benchtext').value);
        const scene = await page.evaluate((h) => { const p = window[h].state.armoury.range.stress?.plan ?? []; return { blanks: p.filter(e => e.kind === 'blank' && e.done).length, horns: p.filter(e => e.kind === 'horn' && e.done).length, sheet: window[h].pairs()?.sheet, din: window[h].stress()?.din ?? null }; }, '__olympus');
        console.log(`      stress-din: ${r.frames} frames, median ${r.medianMs} ms, p95 ${r.p95Ms} ms, max ${r.maxMs} ms, over 25 ms ${r.over25}, draw calls ${r.drawCallsMax}, uploads ${r.uploadsMaxBytes} B; at a blank ${JSON.stringify(r.bang)}; ${scene.blanks} blanks and ${scene.horns} horns on the ${scene.sheet}; the din layer ${JSON.stringify(scene.din)}`);
        for (const line of text.split('\n')) console.log(`        ${line}`);
        // (a CPU or frame ceiling under load: rerun alone before believing it)
        assert(r.scene === 'stress-din' && scene.blanks >= 10 && r.bang && r.bang.frames >= 10, JSON.stringify({ r, scene }));
        assert(r.medianMs <= 17.5 && r.p95Ms <= 18 && r.bang.over25 === 0, JSON.stringify({ median: r.medianMs, p95: r.p95Ms, bang: r.bang }));
      }, { query: 'bench=stress-din', timeoutMs: 90000 });
    },
  },
  {
    name: '?bench=shoothouse (0.0.12; the build sheet 0.0.12 §5.4): the Tier one at GO on 48213, "Open, clear the room" by T (one room a press from the rework\'s R4), then the shot row and T in turn every 2 s for 20 s: the lane\'s rooms at his pace, the doors swinging, the #2, the shots in the hall; 60 fps at the median, p95 at most 18 ms, no frame over 50 ms and at most three over 25 (a pause\'s own frames)',
    heavy: true,
    timeoutMs: 150000,
    async fn() {
      const sc = BENCH_SCENES.shoothouse;
      assert(sc && sc.play === 'test-shoothouse' && sc.setup === 'go' && sc.tier === 'tierone' && sc.seed === 48213 && sc.keys.reduce((a, k) => a + k[1], 0) === 20000, JSON.stringify(sc ?? null));
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
      await withGame(async (page) => {
        await page.waitForFunction(() => window.__bench && document.querySelector('.glass.bench'), null, { timeout: 90000 });
        const r = await page.evaluate(() => window.__bench), text = await page.evaluate(() => document.querySelector('.glass.bench .benchtext').value);
        const lane = await page.evaluate((h) => { const H = window[h].house(); return { timer: H?.timer ?? null, legs: (H?.now?.legs ?? []).map(L => `${L.word} ${L.state}`), shots: H?.now?.aspects?.shots?.rounds ?? null, sound: H?.sound ? { cues: H.sound.cues, hall: H.sound.hall } : null }; }, '__olympus');
        console.log(`      shoothouse: ${r.frames} frames, median ${r.medianMs} ms, p95 ${r.p95Ms} ms, max ${r.maxMs} ms, over 25 ms ${r.over25}, draw calls ${r.drawCallsMax}, uploads ${r.uploadsMaxBytes} B; the lane ${JSON.stringify(lane)}`);
        for (const line of text.split('\n')) console.log(`        ${line}`);
        // (a frame ceiling under load: rerun alone before believing it)
        assert(r.scene === 'shoothouse' && lane.legs.some(l => !/ahead$/.test(l)), JSON.stringify({ r, lane }));
        // (the tier one pauses at each man in these 20 s, and a pause's own frame, where time stops and the panel, the plates and
        // the weapon card are drawn afresh, takes 28 to 37 ms on the Mac, as Pairs' shipped pause does (the fixer's of 0.0.12,
        // measured): the motion is held to 60 fps, a frame at most PAUSE_FRAME_MS 50, never more than one a pause)
        assert(r.medianMs <= 17.5 && r.p95Ms <= 18 && r.maxMs <= 50 && r.over25 <= 3, JSON.stringify({ median: r.medianMs, p95: r.p95Ms, max: r.maxMs, over25: r.over25 }));
      }, { query: 'bench=shoothouse', timeoutMs: 90000, port });
    },
  },
  {
    name: 'a scene with bangs adds its row: the frames at a bang alone, { frames, medianMs, maxMs, over25 }, and a line of its own',
    fn() {
      const frames = Array.from({ length: 300 }, (_, i) => ({ dt: i === 120 ? 26 : 16.7, bang: i >= 100 && i < 130 }));
      const b = bangOf(frames), r = benchResult({ frames, walkedM: 0 }, { name: 'pairs-bangs', version: 'test', ppm: 16 }), lines = benchText(r).split('\n');
      console.log(`      ${JSON.stringify(b)}; '${lines.at(-1)}'`);
      assert(b.frames === 30 && b.over25 === 1 && b.maxMs === 26 && /^bang frames 30/.test(lines.at(-1)) && bangOf([{ dt: 16 }]) === null, JSON.stringify({ b, lines }));
    },
  },
];
