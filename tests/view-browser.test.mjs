// OLYMPUS tests: the game view in the browser, the sandbox's free walk (heavy).
//
// The build sheet 0.0.2 §5.4: ?play=sandbox&seed=1&perf=1&nostore=1 at 16 and 24 px/m. From the spawn
// in the bay (24.9, 4.4), 3 s of D held (KeyD, east, by physical code as the game reads it) then 2 s of
// Z (KeyW, north) takes the player through the bay's doorway (x 27.8 to 29.2 at z 2.4) into the
// hallway: east 2.5 to 4.5 m (1.14 m/s, BODY §16.1's walk), north at least 1.5 m to z under 2.4, and
// the camera's x along with them by 2 m or more (VIEWS §2.4: the test rooms are wider than the frame).
// While walking, every frame's draw calls, triangles, uploads and times are sampled in the page:
// draw calls at most 160 (TECH §9.2; 600 is VIEWS §14's hard failure), no program linked after the
// first area frame (warm.js), no frame sending over 1 MB (uploads.js), frame times median at most
// 20 ms and p95 at most 33 ms (the bench's 16.7 and 18 ms are 0.1's), and no error on the page.
// Then ?prop=soldier at 24 px/m walks 1 s without error. Runs on OLYMPUS_TEST_PORT (8223 by default).
//
// The frame clock is the browser's, and a headless Chrome may keep a slow one: on the Mac this round
// (2026-11-05) every page that draws ran its requestAnimationFrame at 10 Hz or so under the test
// harness (v0.0.1's 2D stub as much as the stage; free with --disable-gpu-vsync, so it is the clock,
// not the work). So the test measures the clock on a page that draws a 2D canvas every frame, first
// on its own and again on the game's page after each walk. On a clock near 60 Hz both times it holds
// the sheet's 20 and 33 ms. On a slower one it holds the main thread's work a frame (the ticks and
// the view) to TECH §9.11's view budget, 4 ms at the median, and prints the frames beside the
// clocks: 0.0.2 held them to the clock read once at the start, but the pacing moves between 60, 30,
// 15 and 10 Hz from page to page and within one (a walk at 83 ms on a clock read at 50 ms failed,
// then passed), so that comparison measured the harness, not the game. The GPU's passes are printed,
// not judged (its timer runs at the GPU's idle clock between frames that far apart). And, whatever
// the clock, a limit it cannot hide (after the 0.0.2 review: the 60 fps target was held by no
// number): 40 frames driven back to back in the page, each finished on the GPU with gl.finish(), at
// most 16.7 ms at the median, the frame's main-thread work and its GPU work together.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';

const H = '__olympus';
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : NaN; };
/** The browser's own frame clock: rAF intervals on a page that draws a 2D canvas every frame (median, p95, ms). */
async function frameClock(page) {
  return page.evaluate(() => new Promise(res => {
    const c = Object.assign(document.createElement('canvas'), { width: 640, height: 360 }), g = c.getContext('2d');
    document.body.append(c);
    const ts = [];
    const f = (t) => {
      g.fillStyle = `hsl(${ts.length * 7 % 360} 40% 40%)`; g.fillRect(0, 0, 640, 360);
      ts.push(t);
      if (ts.length < 61) requestAnimationFrame(f); else { c.remove(); const d = ts.slice(1).map((t1, k) => t1 - ts[k]).sort((a, b) => a - b); res({ medianMs: d[d.length >> 1], p95Ms: d[Math.floor(d.length * 0.95)] }); }
    };
    requestAnimationFrame(f);
  }));
}

// In the page: start sampling every frame (rAF), returning a stop() that gives the samples.
function sampleFrames() {
  const out = [];
  let last = null, on = true;
  const f = (t) => {
    if (!on) return;
    const r = window.__report, v = r.view, gl = r.gl?.last;
    if (last !== null) out.push({ dt: t - last, calls: v.calls, tris: v.triangles, viewMs: v.viewMs, cpuMs: v.cpuMs, workMs: (r.frame?.tickMs ?? 0) + (r.frame?.viewMs ?? 0), bytes: gl?.bytes ?? 0, uploads: gl?.uploads ?? 0, links: gl?.links ?? 0, gpu: v.gpu });
    last = t;
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
  window.__sampling = { stop: () => { on = false; return out; } };
}
const me = (h) => { const s = window[h].state, a = s.actors.list.find(x => x.id === s.player.actor); return { x: a.x, z: a.z, face: a.face, gait: a.gait, camX: window.__report.view.camera.x, camZ: window.__report.view.camera.z }; };

async function walk(page, legs) {
  await page.evaluate(sampleFrames);
  const at = [await page.evaluate(me, H)];
  for (const [code, ms] of legs) {
    await page.keyboard.down(code); await page.waitForTimeout(ms); await page.keyboard.up(code);
    await page.waitForTimeout(150);                                  // (the last tick of the leg lands)
    at.push(await page.evaluate(me, H));
  }
  const frames = await page.evaluate(() => window.__sampling.stop());
  return { at, frames };
}

export default [
  {
    name: 'the sandbox walks: 3 s east and 2 s north by key codes, through the bay\'s doorway into the hallway, the camera following, in budget at 16 and 24 px/m',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame(async (page, errors, game) => {
        await page.goto(`${game.origin}/VERSION`);
        const clock = await frameClock(page);
        const capped = clock.medianMs > 20;
        console.log(`      the browser's frame clock (a 2D canvas drawn every frame): median ${fmt(clock.medianMs, 1)} ms, p95 ${fmt(clock.p95Ms, 1)} ms${capped ? ' (slower than 60 Hz here: the main thread\'s work is held to 4 ms, and every frame finished on the GPU to 16.7 ms)' : ''}`);
        for (const ppm of [16, 24]) {
          await game.open(`play=sandbox&seed=1&perf=1&nostore=1&ppm=${ppm}`);
          const boot = await page.evaluate(() => ({ r: window.__report, pending: window.__report.pending, linksAtReady: window.__report.gl?.total.links ?? null, programs: window.__report.view.programs, paused: window.__olympus.loop.paused }));
          assert(boot.r.ppm === ppm && !boot.paused && boot.pending.length === 0, JSON.stringify({ ppm: boot.r.ppm, pending: boot.pending, paused: boot.paused }));
          const { at, frames } = await walk(page, [['KeyD', 3000], ['KeyW', 2000]]);
          const clockHere = await frameClock(page), slow = Math.max(clock.medianMs, clockHere.medianMs) > 20;
          // (a limit the slow clock cannot hide: 40 frames driven back to back, each finished on the GPU
          // with gl.finish(), so the GPU stays clocked up; a frame and its GPU work within 16.7 ms)
          const burst = await page.evaluate(() => {
            const L = window.__olympus.loop, gl = document.querySelector('#frame canvas').getContext('webgl2'), out = [], views = [];
            let t = performance.now();
            for (let k = 0; k < 40; k++) { const a = performance.now(); t += 1000 / 60; L.frame(t); gl.finish(); out.push(performance.now() - a); views.push(window.__report.view.viewMs); }
            const mid = (xs) => [...xs].sort((x, y) => x - y)[xs.length >> 1];
            out.sort((x, y) => x - y);
            return { medianMs: out[out.length >> 1], p95Ms: out[Math.floor(out.length * 0.95)], viewMs: mid(views), frames: window.__report.view.frames };
          });
          const after = await page.evaluate(() => ({ links: window.__report.gl.total.links, programs: window.__report.view.programs, maxBytes: window.__report.gl.max.bytes, view: window.__report.view, painter: window.__report.painter, uploads: window.__report.uploads, timer: window.__report.view.gpu }));
          const east = at[1].x - at[0].x, north = at[1].z - at[2].z, cam = at[2].camX - at[0].camX;
          const dts = frames.map(f => f.dt), calls = Math.max(...frames.map(f => f.calls)), tris = Math.max(...frames.map(f => f.tris));
          const bytes = Math.max(...frames.map(f => f.bytes)), linksWalking = frames.reduce((s, f) => s + f.links, 0);
          const med = pct(dts, 0.5), p95 = pct(dts, 0.95), viewMs = pct(frames.map(f => f.viewMs), 0.5), cpuMs = pct(frames.map(f => f.cpuMs), 0.5);
          const gpu = frames.map(f => f.gpu).filter(Boolean).pop();
          const work = frames.map(f => f.workMs), workMed = pct(work, 0.5), workP95 = pct(work, 0.95);
          const B = boot.r.view.build;
          console.log(`      ${ppm} px/m (${boot.r.view.res.join('×')}): the cut ${boot.r.cutMs} ms; the area ${fmt(B.buildMs, 0)} ms (the ${B.where}'s job ${fmt(B.jobMs, 0)} ms, painting ${fmt(B.paintMs, 0)} ms, the meshes and upload here ${fmt(B.mainMs, 0)} ms; ${fmt(B.waitMs, 0)} ms waiting for the worker first, ${fmt(B.wallMs, 0)} ms in all; ${B.boxes} boxes, ${B.quads} quads, ${B.fixtures} fixtures, ${B.atlasKB} KB atlas, ${B.drawCalls} batch)`);
          console.log(`      east ${fmt(east, 2)} m (${fmt(at[0].x, 2)} → ${fmt(at[1].x, 2)}), north ${fmt(north, 2)} m to z ${fmt(at[2].z, 2)}, camera x ${fmt(at[0].camX, 2)} → ${fmt(at[2].camX, 2)} (z held at ${fmt(at[2].camZ, 2)})`);
          console.log(`      frames ${frames.length}: median ${fmt(med, 1)} ms, p95 ${fmt(p95, 1)} ms (the clock on this page after the walk: median ${fmt(clockHere.medianMs, 1)} ms); the main thread's work a frame (ticks, view) median ${fmt(workMed, 2)} ms, p95 ${fmt(workP95, 2)} ms; view ${fmt(viewMs, 2)} ms (stage ${fmt(cpuMs, 2)} ms); draw calls ${calls} at most, triangles ${tris}`);
          console.log(`      programs ${boot.programs} at ready, ${after.programs} after (${linksWalking} linked while walking, ${after.links} linked in all); uploads at most ${fmt(bytes / 1024, 1)} KB a frame (${fmt(after.maxBytes / 1024, 0)} KB in the page's worst frame, the cut's included)`);
          console.log(`      GPU by pass: ${gpu ? `shadow ${fmt(gpu.shadowMs, 2)}, scene ${fmt(gpu.sceneMs, 2)}, post ${fmt(gpu.postMs, 2)}, blit ${fmt(gpu.blitMs, 2)} ms` : 'no timer query'}; painter ${JSON.stringify(Object.fromEntries(Object.entries(after.painter.byJob).map(([k, v]) => [k, `${v.n} jobs, ${fmt(v.ms / v.n, 0)} ms each${v.main ? `, ${v.main} on the main thread` : ''}`])))}`);
          assert(east >= 2.5 && east <= 4.5, `walked ${fmt(east, 2)} m east in 3 s`);
          assert(north >= 1.5 && at[2].z < 2.4, `walked ${fmt(north, 2)} m north, to z ${fmt(at[2].z, 2)}`);
          assert(cam >= 2, `the camera moved ${fmt(cam, 2)} m east`);
          assert(calls <= 160, `${calls} draw calls`);
          assert(linksWalking === 0 && after.programs === boot.programs, `programs linked after the first area frame: ${linksWalking} (${boot.programs} → ${after.programs})`);
          console.log(`      40 frames back to back, each finished on the GPU (gl.finish): median ${fmt(burst.medianMs, 2)} ms, p95 ${fmt(burst.p95Ms, 2)} ms, the view's share ${fmt(burst.viewMs, 2)} ms (limit 16.7 ms at the median, the 60 fps target, whatever the frame clock; performance.now() reads to 0.1 ms here)`);
          assert(bytes <= 1024 * 1024, `a frame sent ${bytes} bytes`);
          assert(burst.medianMs <= 1000 / 60, `a frame and its GPU work: median ${fmt(burst.medianMs, 2)} ms`);
          if (!slow) assert(med <= 20 && p95 <= 33, `frames: median ${fmt(med, 1)} ms, p95 ${fmt(p95, 1)} ms`);
          else assert(workMed <= 4, `the main thread's work a frame: median ${fmt(workMed, 2)} ms`);
          assert(!errors.length, errors.join('\n'));
        }
      }, { query: 'play=sandbox&seed=1&perf=1&nostore=1&ppm=16', timeoutMs: 60000 });
    },
  },
  {
    name: 'the soldier figure (?prop=soldier) at 24 px/m walks a second without error',
    heavy: true,
    timeoutMs: 90000,
    async fn() {
      await withGame(async (page) => {
        const { at } = await walk(page, [['KeyD', 1000]]);
        const r = await page.evaluate(() => ({ prop: window.__report.prop, people: window.__report.view.people, deferred: window.__report.view.deferred }));
        console.log(`      ${r.prop}: walked ${fmt(at[1].x - at[0].x, 2)} m east in 1 s; ${r.people} drawn, ${r.deferred} put off`);
        assert(r.prop === 'soldier' && r.people === 1 && at[1].x - at[0].x > 0.7, JSON.stringify({ r, at }));
      }, { query: 'play=sandbox&seed=1&perf=1&nostore=1&ppm=24&prop=soldier', timeoutMs: 60000 });
    },
  },
  {
    name: 'time standing still (G pressed mid-run) stands still on screen: the figure, its stride and the camera hold frame to frame (0.0.2: the figure sawtoothed a step at 20 Hz)',
    heavy: true,
    timeoutMs: 90000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.keyboard.down('ShiftLeft'); await page.keyboard.down('KeyD');
        await page.waitForTimeout(1200);
        await page.keyboard.press('KeyG');                             // (time stands still, D and Shift still held)
        await page.keyboard.up('KeyD'); await page.keyboard.up('ShiftLeft');
        await page.waitForTimeout(800);                                // (the camera's lead settles: LEAD_S 0.35 s)
        // (frames driven by hand 25 ms apart, so the loop's alpha cycles as it does on a 40 Hz screen:
        // headless Chrome's own frames come at about 10 Hz here, two whole ticks each, alpha near 0)
        const seen = await page.evaluate(() => {
          const L = window.__olympus.loop, t0 = performance.now() + 5, out = [];
          for (let k = 0; k < 12; k++) {
            L.frame(t0 + k * 25);
            const v = window.__report.view;
            out.push({ x: v.you?.x, z: v.you?.z, stride: v.you?.stride, camX: v.camera.x, camZ: v.camera.z, held: L.held, alpha: L.alpha, ms: window.__olympus.state.clock.ms });
          }
          return out;
        });
        const xs = new Set(seen.map(f => f.x)), cams = new Set(seen.map(f => f.camX)), strides = new Set(seen.map(f => f.stride)), alphas = new Set(seen.map(f => f.alpha.toFixed(2)));
        console.log(`      held ${seen.every(f => f.held)}; ${seen.length} frames 25 ms apart: the figure at x ${[...xs].map(x => fmt(x, 4)).join(', ')}; stride ${[...strides].map(x => fmt(x, 3)).join(', ')}; camera x ${[...cams].map(x => fmt(x, 4)).join(', ')}; the loop's alpha took ${alphas.size} values; the clock ${seen[0].ms === seen.at(-1).ms ? 'still' : 'moved'}`);
        assert(seen.every(f => f.held) && seen[0].ms === seen.at(-1).ms, JSON.stringify(seen[0]));
        assert(xs.size === 1 && strides.size === 1 && cams.size === 1 && new Set(seen.map(f => f.camZ)).size === 1, JSON.stringify(seen.map(f => [f.x, f.stride, f.camX])));
        await page.keyboard.press('Digit1');                           // (time runs again)
        await page.waitForTimeout(200);
        assert(!(await page.evaluate(() => window.__olympus.loop.held)) && !errors.length, errors.join('\n'));
      }, { query: 'play=sandbox&seed=1&nostore=1&ppm=24&prop=soldier', timeoutMs: 60000 });
    },
  },
];
