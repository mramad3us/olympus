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
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { BENCH_SCENES } from '../src/data/bench.js';
import { frameClock, startSampling, stopSampling, burst, framesLine, pct } from './stage-drive.mjs';

const SCENE = BENCH_SCENES['squadbay-night'];
const queryOf = (ppm) => `play=${SCENE.play}&seed=${SCENE.seed}&hour=${SCENE.hour}&area=${SCENE.at.area}&at=${SCENE.at.x},${SCENE.at.z}&face=${SCENE.at.face}&nostore=1&perf=1&ppm=${ppm}`;

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
];
