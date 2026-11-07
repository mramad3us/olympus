// OLYMPUS tests: the bench scene squadbay-night in headless Chrome, its frame times, draw calls and triangles at 16 and 24 px/m (heavy).
//
// TECH §16.7 and ROADMAP §4.4's acceptance moment 2: "60 fps with p95 at or under 18 ms
// (`squadbay-night`)". The scene is src/data/bench.js's BENCH_SCENES['squadbay-night'] (one definition
// the page's bench card and this test both read: the build sheet's §8, item 22): a barracks at seed
// 48213 at 23:00, the player in bay-2-1's aisle at (54.8, 3.95) facing east, then its keys held for
// their times (the aisle walked east, west and back, then still), after warmS of settling. At each
// density this prints the frame median, p95 and p99, the frames over 25 ms, the draw calls (the most
// in a frame), the triangles, the programs, the uploads (the most bytes in a frame), the view's CPU
// (median, p95), the headless clock's rate (a page drawing a 2D canvas every frame), and holds: draw
// calls at most 160 (TECH §9.2), no program linked after the first frame, no frame sending over 1 MB,
// 40 frames driven back to back and each finished on the GPU at a median of 16.7 ms or less (the 60 fps
// target, whatever the frame clock), and, when the headless clock runs at 60 Hz on the scene itself
// (its frames' median and a 2D canvas on the game's page), the paced p95 at most 18 ms (printed
// otherwise, as view-browser does: headless Chrome on this Mac paces its frames at 10 to 60 Hz from
// page to page). Runs on OLYMPUS_TEST_PORT.
// 0.0.4 (the build sheet §2.3 (e), §5.3): the bench's splash-sleep scene, R at your rack's foot at 21:57
// and the night's full splash (the zoom, the iris, the night going by), at 16 px/m: the splash's own
// frames timed in the page ({ frames, medianMs, p95Ms, over25 }, the bench card's splash row), its draw
// calls and uploads, no program linked, and the paced p95 at most 18 ms on a 60 Hz clock.
// 0.0.5 (the build sheet 0.0.5 §2.3 (g), §4 stage, §5.3): the bench's range-line scene, test-handling's
// 'bench' setup on the 25 m line (prone, hot, aimed, a magazine of 15) and Digit1 tapped fifteen times
// through the step panel: a string at 25 m with its flashes, kicks, cases and holes, at 16 px/m; prints the
// frames, the draw calls, the uploads, the shots on the card and the brass, and holds the same budgets
// (p95 at most 18 ms on a 60 Hz clock, at most 160 draw calls, no frame over 1 MB, no program linked).
// 0.0.7 (the build sheet 0.0.7 §2.4 (e), §5.4): the bench's range-far scene, test-range's 'far' setup (the 300 m line,
// prone, 4×, aimed at your face with the far window open on it, the relay firing beside you) and Digit1 tapped five
// times: prints the frames, the draw calls (the window's own among them), the uploads, the window's state and its GPU
// pass, the KD's faces, flags and fires drawn, and holds the same budgets (p95 at most 18 ms on a 60 Hz clock, at most
// 160 draw calls, no frame over 1 MB, no program linked) with the window open through the scene.
// 0.0.8 (the user's report of 2026-11-07, "when at 300m, with the scope at 1x, the view still shows the target zoomed
// in"): range-far again with the lever thrown to 1 first (the window at 4 px/m, its scene pass a 632 px square and the
// 4 × 4 mean into its 158), the same budgets held.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { BENCH_SCENES } from '../src/data/bench.js';
const SLEEP = BENCH_SCENES['splash-sleep'];
const sleepQuery = `play=${SLEEP.play}&seed=${SLEEP.seed}&hour=${SLEEP.hour}&area=${SLEEP.at.area}&at=${SLEEP.at.x},${SLEEP.at.z}&face=${SLEEP.at.face}&nostore=1&perf=1&ppm=16`;
import { frameClock, startSampling, stopSampling, burst, framesLine, pct } from './stage-drive.mjs';

const SCENE = BENCH_SCENES['squadbay-night'];
const LINE = BENCH_SCENES['range-line'];
const FAR = BENCH_SCENES['range-far'];
const farQuery = `play=${FAR.play}&seed=${FAR.seed}&hour=${FAR.hour}&setup=${FAR.setup}&nostore=1&perf=1&ppm=16`;
const lineQuery = (ppm) => `play=${LINE.play}&seed=${LINE.seed}&hour=${LINE.hour}&setup=${LINE.setup}&nostore=1&perf=1&ppm=${ppm}`;
const queryOf = (ppm) => `play=${SCENE.play}&seed=${SCENE.seed}&hour=${SCENE.hour}&area=${SCENE.at.area}&at=${SCENE.at.x},${SCENE.at.z}&face=${SCENE.at.face}&nostore=1&perf=1&ppm=${ppm}`;

// (the range-far scene at the lever's power: 4 as the bench has it, or 1 (0.0.8: the window at 4 px/m over four times the ground), the lever thrown first)
async function farBench(page, errors, optic = 4) {
  await page.waitForTimeout((FAR.warmS ?? 3) * 1000);
  if (optic !== 4) {
    await page.evaluate((o) => window.__olympus.act({ act: 'stop', args: { step: `optic:${o}` } }), optic);
    await page.waitForFunction((o) => window.__report.view.far?.open && window.__report.view.far?.mag === o, optic, { timeout: 15000 });
    await page.waitForTimeout(500);
  }
  const relayShots = () => { const st = typeof window.__olympus.state === 'function' ? window.__olympus.state() : window.__olympus.state; return { shots: (st?.armoury?.range?.relay ?? []).reduce((t, G) => t + (G.shots ?? 0), 0), ms: st?.clock?.ms ?? 0 }; };
  const boot = await page.evaluate(() => ({ programs: window.__report.view.programs, far: window.__report.view.far, fire: (window.__olympus.steps?.()?.slots ?? []).find(s => s.id === 'fire') ?? null }));
  const r0 = await page.evaluate(relayShots);
  await startSampling(page);
  const opened = [];
  for (const [code, ms] of FAR.keys) {
    if (code) await page.keyboard.down(code);
    await page.waitForTimeout(ms);
    if (code) await page.keyboard.up(code);
    opened.push(await page.evaluate(() => window.__report.view.far?.open ?? false));
  }
  const frames = await stopSampling(page);
  const r1 = await page.evaluate(relayShots);
  const here = await frameClock(page), b = await burst(page);
  const after = await page.evaluate(() => ({ programs: window.__report.view.programs, people: window.__report.view.people, far: window.__report.view.far, kd: window.__report.view.range?.kd ?? null, gpu: window.__report.view.gpu }));
  console.log(`      the game ran ${fmt((r1.ms - r0.ms) / 1000, 1)} s of the bench's 20 (the waits for the marks); the relay fired ${r1.shots - r0.shots} rounds in it`);
  const dts = frames.map(f => f.dt), calls = Math.max(...frames.map(f => f.calls)), bytes = Math.max(...frames.map(f => f.bytes)), links = frames.reduce((n, f) => n + f.links, 0);
  const p95 = pct(dts, 0.95), sixty = pct(dts, 0.5) <= 17.5 && here.medianMs <= 17.5;
  const kd = after.kd ? { ...after.kd, carriers: after.kd.carriers?.length ?? 0 } : null;
  console.log(`      16 px/m, the window at ${after.far?.mag}× (${after.far?.ppm} px/m, its pass ${after.far?.spanPx} px square): ${frames.length} frames over ${fmt(dts.reduce((a, d) => a + d, 0) / 1000, 1)} s: ${framesLine(dts)}`);
  console.log(`      draw calls ${calls} at most (the window's own ${after.far?.calls ?? 0}); programs ${boot.programs} → ${after.programs} (${links} linked); uploads ${fmt(bytes / 1024, 1)} KB a frame at most; ${after.people.drawn} drawn`);
  console.log(`      the far window: at the start ${JSON.stringify({ open: boot.far?.open, ready: boot.far?.ready, chunks: boot.far?.chunks })}, open after each tap ${opened.filter((_, i) => i % 2 === 0).join(', ')}; at the end ${JSON.stringify({ open: after.far?.open, key: after.far?.key, rangeM: after.far?.rangeM, chunks: after.far?.chunks, ms: after.far?.ms })}; Fire ${boot.fire ? (boot.fire.off ? `struck (${boot.fire.off})` : 'offered') : 'not offered'}`);
  console.log(`      the KD drawn: ${JSON.stringify(kd)}; GPU ${after.gpu ? `scene ${fmt(after.gpu.sceneMs, 2)}, post ${fmt(after.gpu.postMs, 2)} ms (the window's pass in post)` : 'no timer'}`);
  console.log(`      40 frames back to back, each finished on the GPU: median ${fmt(b.medianMs, 2)} ms, p95 ${fmt(b.p95Ms, 2)} ms; the clock on this page ${fmt(here.medianMs, 1)} ms${sixty ? '' : ' (not 60 Hz: the paced p95 is printed, not held)'}`);
  assert(after.far?.open && after.far?.mag === optic, `the far window open on your face at ${optic}×: ${JSON.stringify(after.far)}`);
  assert(r1.ms - r0.ms >= 12_000 && r1.shots > r0.shots, `the game ran ${r1.ms - r0.ms} ms, the relay fired ${r1.shots - r0.shots}`);
  assert(calls <= 160, `${calls} draw calls`);
  assert(links === 0 && after.programs === boot.programs, `programs linked in the scene: ${links} (${boot.programs} → ${after.programs})`);
  assert(bytes <= 1024 * 1024, `a frame sent ${bytes} bytes`);
  assert(b.medianMs <= 1000 / 60, `a frame and its GPU work: median ${fmt(b.medianMs, 2)} ms`);
  if (sixty) assert(p95 <= 18, `paced frames: p95 ${fmt(p95, 1)} ms`);
  assert(!errors.length, errors.join('\n'));
}

export default [
  {
    name: 'the bench scene squadbay-night runs its 20 s in budget at 16 and 24 px/m: draw calls under 160, no link, no frame over 1 MB, a frame and its GPU work under 16.7 ms (ROADMAP §4.4, moment 2: p95 at or under 18 ms)',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.goto(`${game.origin}/VERSION`);
        const clock = await frameClock(page);
        console.log(`      the headless frame clock: median ${fmt(clock.medianMs, 1)} ms, p95 ${fmt(clock.p95Ms, 1)} ms (${fmt(1000 / clock.medianMs, 0)} Hz)`);
        for (const ppm of [16, 24]) {
          await game.open(queryOf(ppm));
          await page.waitForTimeout((SCENE.warmS ?? 2) * 1000);
          const boot = await page.evaluate(() => ({ programs: window.__report.view.programs, me: (() => { const s = window.__olympus.state; const a = s.actors.list.find(x => x.id === s.player.actor); return { x: a.x, z: a.z, face: a.face, area: s.places.live.area }; })() }));
          await startSampling(page);
          for (const [code, ms] of SCENE.keys) {
            if (code) await page.keyboard.down(code);
            await page.waitForTimeout(ms);
            if (code) await page.keyboard.up(code);
          }
          const frames = await stopSampling(page);
          const here = await frameClock(page), b = await burst(page);
          const after = await page.evaluate(() => ({ programs: window.__report.view.programs, maxBytes: window.__report.gl.max.bytes, people: window.__report.view.people, gpu: window.__report.view.gpu, renderer: window.__report.renderer }));
          const dts = frames.map(f => f.dt), calls = Math.max(...frames.map(f => f.calls)), tris = Math.max(...frames.map(f => f.tris));
          const bytes = Math.max(...frames.map(f => f.bytes)), links = frames.reduce((n, f) => n + f.links, 0);
          const viewMed = pct(frames.map(f => f.viewMs), 0.5), viewP95 = pct(frames.map(f => f.viewMs), 0.95), p95 = pct(dts, 0.95);
          // (the clock is judged on the scene's own frames and the game's page: a plain page may idle at 10 Hz)
          const sixty = pct(dts, 0.5) <= 17.5 && here.medianMs <= 17.5;
          console.log(`      ${ppm} px/m: the scene from (${fmt(boot.me.x, 2)}, ${fmt(boot.me.z, 2)}) facing ${boot.me.face} in ${boot.me.area}; ${frames.length} frames over ${fmt(dts.reduce((a, d) => a + d, 0) / 1000, 1)} s: ${framesLine(dts)}`);
          console.log(`      draw calls ${calls} at most, triangles ${tris} at most; programs ${boot.programs} → ${after.programs} (${links} linked); uploads ${fmt(bytes / 1024, 1)} KB a frame at most; the view's CPU median ${fmt(viewMed, 2)} ms, p95 ${fmt(viewP95, 2)} ms; ${after.people.drawn} drawn, ${after.people.lying} lying`);
          console.log(`      40 frames back to back, each finished on the GPU: median ${fmt(b.medianMs, 2)} ms, p95 ${fmt(b.p95Ms, 2)} ms; the clock on this page ${fmt(here.medianMs, 1)} ms${sixty ? '' : ' (not 60 Hz: the paced p95 is printed, not held)'}; GPU ${after.gpu ? `scene ${fmt(after.gpu.sceneMs, 2)}, post ${fmt(after.gpu.postMs, 2)}, blit ${fmt(after.gpu.blitMs, 2)} ms` : 'no timer'}; ${after.renderer}`);
          assert(calls <= 160, `${calls} draw calls`);
          assert(links === 0 && after.programs === boot.programs, `programs linked in the scene: ${links} (${boot.programs} → ${after.programs})`);
          assert(bytes <= 1024 * 1024, `a frame sent ${bytes} bytes`);
          assert(b.medianMs <= 1000 / 60, `a frame and its GPU work: median ${fmt(b.medianMs, 2)} ms`);
          if (sixty) assert(p95 <= 18, `paced frames: p95 ${fmt(p95, 1)} ms`);
          assert(!errors.length, errors.join('\n'));
        }
      }, { query: queryOf(16), viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'the bench scene splash-sleep: R at your rack and the night\'s full splash, its frames at 60 fps (p95 at most 18 ms on a 60 Hz clock), draw calls under 160, no program linked, no frame over 1 MB (the build sheet 0.0.4 §2.3 (e))',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame(async (page, errors) => {
        const clock = await frameClock(page);
        await page.waitForTimeout((SLEEP.warmS ?? 2) * 1000);
        const boot = await page.evaluate(() => ({ programs: window.__report.view.programs, offer: window.__olympus.offer()?.label ?? null }));
        const sampling = page.evaluate((MS) => new Promise(res => {
          const out = []; let last = null; const t0 = performance.now();
          const f = (t) => { const r = window.__report, v = r.view; if (last !== null) out.push({ dt: t - last, splash: v.splash?.phase ?? null, calls: v.calls, bytes: r.gl?.last?.bytes ?? 0, links: r.gl?.last?.links ?? 0, viewMs: v.viewMs }); last = t; if (t - t0 < MS) requestAnimationFrame(f); else res(out); };
          requestAnimationFrame(f);
        }), SLEEP.keys.reduce((a, [, ms]) => a + ms, 0));
        for (const [code, ms] of SLEEP.keys) { if (code) await page.keyboard.down(code); await page.waitForTimeout(ms); if (code) await page.keyboard.up(code); }
        const frames = await sampling, sp = frames.filter(f => f.splash), dts = sp.map(f => f.dt);
        const result = { frames: sp.length, medianMs: pct(dts, 0.5), p95Ms: pct(dts, 0.95), over25: dts.filter(d => d > 25).length };
        const phases = [...new Set(sp.map(f => f.splash))];
        const sixty = result.medianMs <= 17.5 && clock.medianMs <= 17.5;
        console.log(`      the headless clock ${fmt(clock.medianMs, 1)} ms; R at the rack's foot (${boot.offer}); the splash's ${phases.join(' → ')}: ${framesLine(dts)}`);
        console.log(`      result.splash ${JSON.stringify({ ...result, medianMs: +fmt(result.medianMs, 2), p95Ms: +fmt(result.p95Ms, 2) })}; draw calls ${Math.max(...sp.map(f => f.calls))} at most; uploads ${fmt(Math.max(...sp.map(f => f.bytes)) / 1024, 1)} KB a frame at most; the view's CPU median ${fmt(pct(sp.map(f => f.viewMs), 0.5), 2)} ms; ${sp.reduce((n, f) => n + f.links, 0)} linked${sixty ? '' : ' (not 60 Hz: the paced p95 is printed, not held)'}`);
        assert(sp.length > 20 && phases.includes('lapse'), `the splash ran: ${sp.length} frames, ${phases}`);
        assert(Math.max(...sp.map(f => f.calls)) <= 160, 'draw calls');
        assert(sp.every(f => !f.links), 'no program linked in the splash');
        assert(Math.max(...sp.map(f => f.bytes)) <= 1024 * 1024, 'no frame over 1 MB');
        if (sixty) assert(result.p95Ms <= 18, `paced splash frames: p95 ${fmt(result.p95Ms, 1)} ms`);
        assert(!errors.length, errors.join('\n'));
      }, { query: sleepQuery, viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'the bench scene range-line: a string of fifteen at 25 m by Digit1 through the step panel, its flashes, cases and holes, at 60 fps (p95 at most 18 ms on a 60 Hz clock), draw calls under 160, no program linked, no frame over 1 MB (the build sheet 0.0.5 §2.3 (g))',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.waitForTimeout((LINE.warmS ?? 2) * 1000);
        const boot = await page.evaluate(() => ({ programs: window.__report.view.programs, range: window.__olympus.range?.() ?? null, fire: (window.__olympus.steps?.()?.slots ?? []).find(s => s.id === 'fire') ?? null }));
        await startSampling(page);
        for (const [code, ms] of LINE.keys) {
          if (code) await page.keyboard.down(code);
          await page.waitForTimeout(ms);
          if (code) await page.keyboard.up(code);
        }
        const frames = await stopSampling(page);
        const here = await frameClock(page), b = await burst(page);
        const after = await page.evaluate(() => ({ programs: window.__report.view.programs, people: window.__report.view.people, range: window.__report.view.range, arms: window.__report.view.arms, session: window.__olympus.range?.() ?? null, gpu: window.__report.view.gpu }));
        const dts = frames.map(f => f.dt), calls = Math.max(...frames.map(f => f.calls)), bytes = Math.max(...frames.map(f => f.bytes)), links = frames.reduce((n, f) => n + f.links, 0);
        const viewMed = pct(frames.map(f => f.viewMs), 0.5), viewP95 = pct(frames.map(f => f.viewMs), 0.95), p95 = pct(dts, 0.95);
        const sixty = pct(dts, 0.5) <= 17.5 && here.medianMs <= 17.5, shots = after.session?.summary?.shots ?? 0;
        console.log(`      16 px/m: ${frames.length} frames over ${fmt(dts.reduce((a, d) => a + d, 0) / 1000, 1)} s: ${framesLine(dts)}`);
        console.log(`      draw calls ${calls} at most; programs ${boot.programs} → ${after.programs} (${links} linked); uploads ${fmt(bytes / 1024, 1)} KB a frame at most; the view's CPU median ${fmt(viewMed, 2)} ms, p95 ${fmt(viewP95, 2)} ms; ${after.people.drawn} drawn`);
        console.log(`      the string: ${shots} shots (${after.session?.summary?.score ?? 0} of ${after.session?.summary?.of ?? 0}); on the stage ${after.range?.holes ?? 0} holes, ${after.range?.brass ?? 0} cases, the flags ${after.range?.flag ?? 0} px; you ${after.arms ? `${after.arms.stance} ${after.arms.frame}` : 'unarmed'}`);
        console.log(`      40 frames back to back, each finished on the GPU: median ${fmt(b.medianMs, 2)} ms, p95 ${fmt(b.p95Ms, 2)} ms; the clock on this page ${fmt(here.medianMs, 1)} ms${sixty ? '' : ' (not 60 Hz: the paced p95 is printed, not held)'}`);
        // (the string is held when the setup offers Fire on Digit1: the bench setup must start off safe, the shot role's)
        if (boot.fire && !boot.fire.off) assert(shots === 15, `${shots} shots of the 15 tapped`);
        else console.log(`      Fire at the start: ${boot.fire ? `struck (${boot.fire.off})` : 'not offered'}: the 'bench' setup starts on safe, so Digit1 fires nothing and the string is not held (the shot role's setup to put on semi)`);
        assert(calls <= 160, `${calls} draw calls`);
        assert(links === 0 && after.programs === boot.programs, `programs linked in the scene: ${links} (${boot.programs} → ${after.programs})`);
        assert(bytes <= 1024 * 1024, `a frame sent ${bytes} bytes`);
        assert(b.medianMs <= 1000 / 60, `a frame and its GPU work: median ${fmt(b.medianMs, 2)} ms`);
        if (sixty) assert(p95 <= 18, `paced frames: p95 ${fmt(p95, 1)} ms`);
        assert(!errors.length, errors.join('\n'));
      }, { query: lineQuery(16), viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'the bench scene range-far: the 300 m line with the relay firing and the far window open on your face, four shots and the waits for their marks, the game running throughout (the integrator\'s of v0.0.7), at 60 fps (p95 at most 18 ms on a 60 Hz clock), draw calls under 160, no program linked, no frame over 1 MB (the build sheet 0.0.7 §2.4 (e))',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame((page, errors) => farBench(page, errors, 4), { query: farQuery, viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'the bench scene range-far with the lever on 1 (the user\'s report, 2026-11-07: the 1× window is the naked eye\'s, 4 px/m over four times the ground): the same budgets, 60 fps (p95 at most 18 ms on a 60 Hz clock), draw calls under 160, no program linked, no frame over 1 MB',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame((page, errors) => farBench(page, errors, 1), { query: farQuery, viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
    },
  },
];
