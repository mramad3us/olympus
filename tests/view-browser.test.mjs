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
// Runs on OLYMPUS_TEST_PORT (8223 by default).
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
//
// 0.0.3 (the build sheet's §5.3): the barracks at 23:00, ?play=barracks&hour=23&seed=48213&nostore=1
// &perf=1 at 16 and 24 px/m, the aisle walked 3 s east and 3 s west: 14 figures drawn every frame, 12
// of them lying in their berths (the berth's quad, flat on the mattress: the look round's L5), draw
// calls at most 160, no program linked after the first area frame, no frame sending over 1 MB, the
// bay's wall clock showing the watch's time (places' wallClockAt, dates.js marsClock: one helper), the
// fire watch under the red lamp tinted redder and brighter than a sleeper in the dark, no error; shots
// of the bay at 23:00 and 12:40 and the street at dawn and at noon, both densities, into OLYMPUS_SHOTS
// (the system's temp folder by default), printed to be looked at.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { startSampling, stopSampling, burst, framesLine, pct as pctOf } from './stage-drive.mjs';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Where the shots go: outside the repository (the session's own temp), printed. */
const SHOTS = process.env.OLYMPUS_SHOTS ?? path.join(os.tmpdir(), 'olympus-shots');

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
    name: 'the barracks at 23:00: fourteen figures, twelve lying in their racks, the clock agreeing with the watch, the red lamp on the fire watch, in budget at 16 and 24 px/m (the build sheet 0.0.3 §5.3)',
    heavy: true,
    timeoutMs: 300000,
    async fn() {
      mkdirSync(SHOTS, { recursive: true });
      await withGame(async (page, errors, game) => {
        for (const ppm of [16, 24]) {
          await game.open(`play=barracks&hour=23&seed=48213&nostore=1&perf=1&ppm=${ppm}`);
          await page.waitForTimeout(800);
          const boot = await page.evaluate(() => ({ links: window.__report.gl?.total.links ?? 0, programs: window.__report.view.programs, area: window.__report.view.area }));
          await startSampling(page);
          await page.keyboard.down('KeyD'); await page.waitForTimeout(3000); await page.keyboard.up('KeyD');
          await page.keyboard.down('KeyA'); await page.waitForTimeout(3000); await page.keyboard.up('KeyA');
          await page.waitForTimeout(300);
          const frames = await stopSampling(page);
          const look = await page.evaluate(async () => {
            const { marsClock } = await import('/src/sim/time/dates.js');
            const { lonOf } = await import('/src/sim/places/model.js');
            const s = window.__olympus.state, v = window.__report.view, c = marsClock(s.clock.ms, lonOf(s));
            const lamps = (await import('/src/sim/places/light.js')).lampsOf(s, s.places.live.area, s.clock.ms).filter(l => l.kind === 'red' && l.on);
            return { watch: { hour: c.hour, minute: c.minute }, clocks: v.clocks, figures: v.figures, red: lamps.map(l => ({ x: l.x, z: l.z, r: l.r })), after: { links: window.__report.gl.total.links, programs: v.programs, maxBytes: window.__report.gl.max.bytes } };
          });
          const b = await burst(page);
          const drawn = frames.map(f => f.drawn), lying = frames.map(f => f.lying), calls = Math.max(...frames.map(f => f.calls)), tris = Math.max(...frames.map(f => f.tris));
          const bytes = Math.max(...frames.map(f => f.bytes)), links = frames.reduce((n, f) => n + f.links, 0), viewMs = pctOf(frames.map(f => f.viewMs), 0.5);
          const bay = look.clocks.find(c => c.id.includes('bay-2-1')), face = bay?.faces?.[0];
          const red = look.red[0], near = (f) => red && Math.hypot(f.x - red.x, f.z - red.z) < red.r;
          const lum = (t) => 0.3 * t[0] + 0.59 * t[1] + 0.11 * t[2];
          const lit = look.figures.find(f => !f.own && near(f)), dark = look.figures.filter(f => f.lie && !near(f)).sort((p, q) => lum(p.tint) - lum(q.tint))[0];
          console.log(`      ${ppm} px/m: ${boot.area?.id} (built ${fmt(boot.area?.buildMs ?? 0, 0)} ms, the cut ${fmt(boot.area?.cutMs ?? 0, 0)} ms); figures drawn ${Math.min(...drawn)} to ${Math.max(...drawn)}, lying ${Math.min(...lying)} to ${Math.max(...lying)}; draw calls ${calls} at most, triangles ${tris}; programs ${boot.programs} → ${look.after.programs} (${links} linked while walking); uploads ${fmt(bytes / 1024, 1)} KB a frame at most; view ${fmt(viewMs, 2)} ms`);
          console.log(`      frames ${framesLine(frames.map(f => f.dt))}; 40 back to back, each finished on the GPU: median ${fmt(b.medianMs, 2)} ms, p95 ${fmt(b.p95Ms, 2)} ms`);
          console.log(`      the watch ${String(look.watch.hour).padStart(2, '0')}:${String(look.watch.minute).padStart(2, '0')}, bay-2-1's clock ${face ? `${face.hour}:${String(face.minute).padStart(2, '0')}${face.slip ? ' (slip)' : ''}` : 'none'}; ${look.clocks.length} clocks on the floor`);
          console.log(`      tints: under the red lamp ${lit ? `${lit.id} ${lit.tint.map(v => fmt(v, 3)).join(', ')}` : 'nobody'}; a sleeper in the dark ${dark ? `${dark.id} ${dark.tint.map(v => fmt(v, 3)).join(', ')}` : 'none'}`);
          await page.screenshot({ path: path.join(SHOTS, `bay-23-${ppm}.png`) });
          assert(Math.min(...drawn) === 14 && Math.max(...drawn) === 14 && Math.min(...lying) === 12 && Math.max(...lying) === 12, `drawn ${[...new Set(drawn)]}, lying ${[...new Set(lying)]}`);
          assert(calls <= 160, `${calls} draw calls`);
          assert(links === 0 && look.after.programs === boot.programs, `programs linked after the first area frame: ${links} (${boot.programs} → ${look.after.programs})`);
          assert(bytes <= 1024 * 1024, `a frame sent ${bytes} bytes`);
          assert(face && face.hour % 12 === look.watch.hour % 12 && face.minute === look.watch.minute, `the clock ${JSON.stringify(face)} and the watch ${JSON.stringify(look.watch)}`);
          assert(lit && dark && lit.tint[0] > lit.tint[1] * 1.3 && lum(lit.tint) > lum(dark.tint), `under the red lamp ${JSON.stringify(lit)}, in the dark ${JSON.stringify(dark)}`);
          assert(!errors.length, errors.join('\n'));
          // (the shots, looked at: the bay at 12:40, the street at dawn and at noon)
          for (const [name, q] of [['bay-1240', 'play=barracks&hour=12.67&seed=48213'], ['street-0545', 'play=barracks&hour=5.75&seed=48213&area=melas.ground&at=522,224&face=up'], ['street-1200', 'play=barracks&hour=12&seed=48213&area=melas.ground&at=522,224&face=up']]) {
            await game.open(`${q}&nostore=1&ppm=${ppm}`);
            await page.waitForTimeout(600);
            await page.screenshot({ path: path.join(SHOTS, `${name}-${ppm}.png`) });
          }
          assert(!errors.length, errors.join('\n'));
        }
        console.log(`      shots in ${SHOTS}: bay-23, bay-1240, street-0545, street-1200 at 16 and 24 px/m`);
      }, { query: 'play=barracks&hour=23&seed=48213&nostore=1&perf=1&ppm=16', viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
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
      }, { query: 'play=sandbox&seed=1&nostore=1', timeoutMs: 60000 });
    },
  },
];
