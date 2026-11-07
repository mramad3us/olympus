// OLYMPUS tests: the splash on the stage in headless Chrome at 16 px/m, the shower's and the night's, and a shot of every vignette (heavy).
//
// The build sheet 0.0.4 §5.3: "view-splash (heavy, 16 px/m). The shower and test-night's night with its
// klaxon. Prints each phase's real seconds, the frame median and p95, draw calls, uploads. Holds the
// shower 4.29 s within 2 frames; p95 ≤ 18 ms at 60 Hz; nothing beyond the iris once inked. Shots of every
// vignette, the beat, looked at." Acceptance moments 3 and 4 (ROADMAP §4.4).
//   - The shower (?play=test-shower&seed=48213): at Head A's second stall (a debug move to its spot), the
//     shower begun by the debug handle (time's activity action, as R's offer sends it), every frame
//     sampled in the page (the view's splash: phase, zoom, the iris; the frame's time, draw calls,
//     uploads), until the zoom out ends. Holds: the phases in order (in, lapse, strip, out), the full splash
//     4.29 s (TIME §6.2: 0.4 + 2.59 + 0.8 + 0.5) within two frames of the page's own clock, the zoom 3 and
//     the iris 3.5 m through the lapse, the vignette's parts in order (in, water, dress), no program linked,
//     and while the iris is shut the picture beyond it all ink (a screenshot's outer columns, the middle
//     rows clear of the HUD: at zoom 3 the picture is 13.3 m wide, the iris's edge ends 5 m from its
//     centre). The paced p95 is held at 18 ms when the headless clock runs at 60 Hz (printed otherwise, as
//     render-bench does).
//   - The night (?play=test-night&seed=48213): R's sleep until reveille from the rack's foot; the drill
//     forced to 02:30 stops it: the phases (in, lapse, decel, beat, out), the beat an alert's (the red), the
//     landing on 02:30:00.091 (23,532,601,000 ms) exactly, the beacon in the hall lit after.
//   - Every vignette (VIEWS §5.2): shower, sink, head, stall, rack, locker, standby, each begun at its
//     fixture's spot and shot at the middle of its lapse, and the beat, into OLYMPUS_SHOTS (the system's
//     temp folder by default), printed to be looked at.
// Runs on OLYMPUS_TEST_PORT.
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { frameClock, pct, framesLine } from './stage-drive.mjs';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SHOTS = process.env.OLYMPUS_SHOTS ?? path.join(os.tmpdir(), 'olympus-shots');
/** TIME §6.2's full splash of a 10-minute shower, real seconds (the build sheet §4: 4.29 s). */
const SHOWER_S = 0.4 + (1.4 + 0.95 * Math.log(1 + 10 / 4)) + 0.8 + 0.5;
const KLAXON_MS = 23532601000;
const INK = [0x1a, 0x12, 0x14];

/**
 * In the page: every frame's splash and numbers until ms pass or the splash has been over for 20
 * frames; the samples. act ([id, spotId, args], or 'offer' for R's offer's) begins the activity from
 * the sampler's first frame, so no round trip to the page falls between the splash's start and the
 * first sample (in macOS's background band a round trip took 0.18 s of the zoom in's 0.4).
 */
function sampleSplash(page, ms, act = null) {
  return page.evaluate(([MS, ACT]) => new Promise(res => {
    const out = [], t0 = performance.now();
    let last = null, ended = 0;
    const f = (t) => {
      if (ACT && last === null) {
        const h = window.__olympus, a = ACT === 'offer' ? ['sleep', h.offer()?.spotId ?? null, { until: 'reveille' }] : ACT;
        h.activity(...a);
      }
      const r = window.__report, v = r.view, sp = v.splash;
      if (last !== null) out.push({ t: t - t0, dt: t - last, phase: sp?.phase ?? null, k: sp?.k ?? null, zoom: sp?.zoom ?? 1, iris: sp?.iris ?? null, beat: sp?.beat ?? null, part: v.vignette?.part ?? null, items: v.vignette?.items ?? 0,
        calls: v.calls, bytes: r.gl?.last?.bytes ?? 0, links: r.gl?.last?.links ?? 0, ms: window.__olympus.state.clock.ms, beacon: v.beacon ? { ...v.beacon } : null });
      last = t;
      if (out.length > 2 && !sp && out.some(s => s.phase)) ended++;
      if (ended > 20 || t - t0 > MS) { res(out); return; }
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }), [ms, act]);
}
const phasesOf = (fr) => { const seq = []; for (const f of fr) if (f.phase && seq.at(-1)?.phase !== f.phase) seq.push({ phase: f.phase, from: f.t, to: f.t }); else if (f.phase) seq.at(-1).to = f.t; return seq; };
const spanS = (fr) => { const on = fr.filter(f => f.phase); return on.length ? (on.at(-1).t - on[0].t + fr[1].dt) / 1000 : 0; };
// (a screenshot's share of exact ink in its outer columns, the rows between the HUD's)
async function inkBeyond(page) {
  const png = await page.screenshot({ type: 'png' });
  const { PNG } = await import('./png-read.mjs');
  const img = PNG.read(png), W = img.w, H = img.h, cols = Math.round(W * 0.09);
  let n = 0, ink = 0;
  for (let y = Math.round(H * 0.3); y < Math.round(H * 0.7); y += 2) for (const x0 of [0, W - cols]) for (let x = x0; x < x0 + cols; x += 2) {
    const o = (y * W + x) * 4; n++;
    if (Math.abs(img.data[o] - INK[0]) <= 2 && Math.abs(img.data[o + 1] - INK[1]) <= 2 && Math.abs(img.data[o + 2] - INK[2]) <= 2) ink++;
  }
  return { share: ink / n, n };
}
const me = (page) => page.evaluate(() => { const s = window.__olympus.state, a = s.actors.list.find(x => x.id === s.player.actor); return { x: a.x, z: a.z, face: a.face, posture: a.posture ?? 'stand', outfit: a.outfit ?? 'utilities', ms: s.clock.ms, area: s.places.live.area }; });

export default [
  {
    name: 'the shower\'s full splash on the stage: in, lapse, strip, out in 4.29 s within two frames, zoom 3 and the iris at 3.5 m, the vignette\'s parts in order, nothing beyond the iris but ink, no program linked (TIME §6.2; ROADMAP §4.4, moment 3)',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      mkdirSync(SHOTS, { recursive: true });
      await withGame(async (page, errors) => {
        const clock = await frameClock(page);
        await page.evaluate(() => window.__olympus.go('melas.echo.1', 58.95, 16.27, 'down'));
        await page.waitForTimeout(1500);
        const before = await me(page), progs = await page.evaluate(() => window.__report.view.programs);
        const sampling = sampleSplash(page, 12000, ['shower', 'f:e1:head-2a:shower-2#1']);
        // (the iris shut: shoot the lapse's middle and read its outer columns)
        await page.waitForFunction(() => window.__report.view.splash?.phase === 'lapse' && window.__report.view.splash.k > 0.3, null, { timeout: 8000 });
        const ink = await inkBeyond(page);
        await page.screenshot({ path: path.join(SHOTS, 'splash-shower-lapse.png') });
        const fr = await sampling, after = await me(page), progs2 = await page.evaluate(() => window.__report.view.programs);
        const seq = phasesOf(fr), total = spanS(fr), dts = fr.map(f => f.dt), med = pct(dts, 0.5);
        const lapse = fr.filter(f => f.phase === 'lapse'), parts = [...new Set(fr.map(f => f.part).filter(Boolean))];
        console.log(`      the headless clock ${fmt(clock.medianMs, 1)} ms; ${fr.length} frames: ${framesLine(dts)}`);
        console.log(`      phases: ${seq.map(p => `${p.phase} ${fmt((p.to - p.from) / 1000 + med / 1000, 2)} s`).join(', ')}; the splash ${fmt(total, 2)} s (TIME §6.2: ${fmt(SHOWER_S, 2)} s); parts ${parts.join(' → ')}; zoom ${fmt(Math.min(...lapse.map(f => f.zoom)), 2)}..${fmt(Math.max(...lapse.map(f => f.zoom)), 2)} and the iris ${fmt(Math.min(...lapse.map(f => f.iris)), 2)} m through the lapse`);
        console.log(`      draw calls ${Math.max(...fr.map(f => f.calls))} at most, uploads ${fmt(Math.max(...fr.map(f => f.bytes)) / 1024, 1)} KB a frame at most, ${fr.reduce((n, f) => n + f.links, 0)} programs linked (${progs} → ${progs2}); beyond the shut iris ${fmt(ink.share * 100, 1)}% ink of ${ink.n} samples`);
        console.log(`      from ${before.outfit} at (${fmt(before.x, 2)}, ${fmt(before.z, 2)}) at ${new Date(before.ms % 86400000).toISOString().slice(11, 19)} to ${after.outfit} at (${fmt(after.x, 2)}, ${fmt(after.z, 2)}), ${fmt((after.ms - before.ms) / 60000, 2)} game minutes`);
        assert(seq.map(p => p.phase).join() === 'in,lapse,strip,out', `the phases: ${seq.map(p => p.phase)}`);
        assert(Math.abs(total - SHOWER_S) <= 2 * med / 1000 + 0.02, `the splash took ${fmt(total, 3)} s, not ${fmt(SHOWER_S, 3)} within two frames of ${fmt(med, 1)} ms`);
        assert(lapse.every(f => Math.abs(f.zoom - 3) < 1e-6 && Math.abs(f.iris - 3.5) < 1e-6), 'zoom 3 and the iris at 3.5 m through the lapse');
        assert(parts.join() === 'in,water,dress', `the vignette's parts: ${parts}`);
        assert(ink.share > 0.99, `beyond the iris ${fmt(ink.share * 100, 2)}% ink`);
        assert(progs2 === progs && fr.every(f => !f.links), 'no program linked in the splash');
        if (med <= 17.5 && clock.medianMs <= 17.5) assert(pct(dts, 0.95) <= 18, `paced frames: p95 ${fmt(pct(dts, 0.95), 1)} ms`);
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-shower&seed=48213&nostore=1&perf=1', viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'the night\'s splash stopped by the klaxon at 02:30: in, lapse, decel, beat (the alert\'s red), out, landing at 23,532,601,000 exactly, the beacon in the hall after (TIME §6.5; ROADMAP §4.4, moment 4)',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      mkdirSync(SHOTS, { recursive: true });
      await withGame(async (page, errors) => {
        const start = await me(page);
        const sampling = sampleSplash(page, 20000, 'offer');
        await page.waitForFunction(() => window.__report.view.splash?.phase === 'lapse' && window.__report.view.splash.k > 0.2, null, { timeout: 8000 });
        await page.screenshot({ path: path.join(SHOTS, 'splash-rack-lapse.png') });
        await page.waitForFunction(() => window.__report.view.splash?.phase === 'beat', null, { timeout: 15000 });
        await page.screenshot({ path: path.join(SHOTS, 'splash-beat-alert.png') });
        const fr = await sampling, landed = await me(page);
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(SHOTS, 'splash-night-landed.png') });
        const seq = phasesOf(fr), beat = fr.filter(f => f.phase === 'beat'), landMs = fr.find(f => f.phase === 'out')?.ms ?? null, beacon = fr.filter(f => f.beacon).map(f => f.beacon.on);
        console.log(`      from (${fmt(start.x, 3)}, ${fmt(start.z, 3)}) ${start.outfit} at ${start.ms}; phases: ${seq.map(p => `${p.phase} ${fmt((p.to - p.from) / 1000, 2)} s`).join(', ')}; the splash ${fmt(spanS(fr), 2)} s`);
        console.log(`      the beat: ${beat.length} frames, ${[...new Set(beat.map(f => f.beat))].join()}; landed at ${landMs} (the klaxon ${KLAXON_MS}), ${landed.posture} in ${landed.outfit}; the beacon after: ${beacon.filter(Boolean).length} lit of ${beacon.length} frames`);
        console.log(`      draw calls ${Math.max(...fr.map(f => f.calls))} at most, uploads ${fmt(Math.max(...fr.map(f => f.bytes)) / 1024, 1)} KB a frame at most; ${framesLine(fr.map(f => f.dt))}`);
        assert(seq.map(p => p.phase).join() === 'in,lapse,decel,beat,out', `the phases: ${seq.map(p => p.phase)}`);
        assert(beat.length && beat.every(f => f.beat === 'alert'), 'the beat is the alert\'s');
        assert(landMs === KLAXON_MS, `landed at ${landMs}`);
        assert(beacon.some(Boolean), 'the beacon lit');
        assert(!errors.length, errors.join('\n'));
      }, { query: 'play=test-night&seed=48213&nostore=1&perf=1', viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'every vignette (VIEWS §5.2) at its fixture in Echo: shower, sink, head, stall, rack, locker, standby, each shot at the middle of its lapse at 16 px/m, its pieces standing',
    heavy: true,
    timeoutMs: 300000,
    async fn() {
      mkdirSync(SHOTS, { recursive: true });
      // (each: where to stand and what to begin; the rack and the locker are the player's own, found by R's offer there)
      const cases = [
        ['shower', 'test-shower', ['melas.echo.1', 58.95, 16.27, 'down'], 'shower', 'f:e1:head-2a:shower-2#1', {}],
        // (0.0.6: the sink's vignette by a single action, the shave (4 min; v0.0.5's basin bundle is legacy, never begun), and the
        // head where the bladder has something to give: the barracks at 20:00 holds 103 mL, test-shower's 19:3x under URINATE_MIN_ML)
        ['sink', 'test-shower', ['melas.echo.1', 58.08, 12.3, 'left'], 'shave', 'f:e1:head-2a:sinks-1#2', {}],
        ['head', 'barracks&hour=20', ['melas.echo.1', 60.6, 10.88, 'up'], 'urinate', 'f:e1:head-2a:urinal-1#1', {}],
        ['stall', 'test-shower', ['melas.echo.1', 62.67, 11.5, 'right'], 'bowel', 'f:e1:head-2a:stall-1#1', {}],
        ['rack', 'test-night', null, 'sleep', null, { until: 'reveille' }],
        ['locker', 'test-night', null, 'dress', null, { to: 'utilities' }],
        ['standby', 'test-shower', ['melas.echo.1', 56.0, 12.9, 'down'], 'wait', null, {}],
      ];
      const rows = [];
      await withGame(async (page, errors, game) => {
        for (const [v, scene, at, id, spot, args] of cases) {
          await game.open(`play=${scene}&seed=48213&nostore=1`);
          if (at) { await page.evaluate((a) => window.__olympus.go(...a), at); await page.waitForTimeout(900); }
          let spotId = spot;
          // (the player's own locker, from their berth's seat: places' seatOf, as time's activities read it; the rack's foot by R's offer there)
          if (v === 'locker') {
            const locker = await page.evaluate(async () => { const F = await import('/src/sim/places/fixtures.js'), s = window.__olympus.state, a = s.actors.list.find(x => x.id === s.player.actor); return F.seatOf(s.people[a.who].berthId)?.lockerId ?? null; });
            const sp = locker ? await page.evaluate(async (id) => { const M = await import('/src/sim/places/model.js'), F = await import('/src/sim/places/fixtures.js'); const f = M.areaOf('melas.echo.1').fixtures.find(x => x.id === id); return F.spotsOf(f)[0]; }, locker) : null;
            if (sp) { await page.evaluate((p) => window.__olympus.go('melas.echo.1', p.x, p.z, p.face), sp); await page.waitForTimeout(900); spotId = sp.id; }
          }
          if (!spotId) spotId = await page.evaluate(() => window.__olympus.offer()?.spotId ?? null);
          await page.evaluate(([i, sId, a]) => window.__olympus.activity(i, sId, a), [id, spotId, args]);
          let got = null;
          try {
            await page.waitForFunction(() => { const sp = window.__report.view.splash; return sp && (sp.phase === 'lapse' && sp.k > 0.45 || sp.phase === 'strip'); }, null, { timeout: 8000 });
            got = await page.evaluate(() => ({ sp: window.__report.view.splash, vig: window.__report.view.vignette }));
            await page.screenshot({ path: path.join(SHOTS, `vignette-${v}.png`) });
          } catch { got = null; }
          rows.push(`${v}: ${got ? `${got.vig?.name ?? '-'} at ${got.vig?.fixture ?? '-'}, part ${got.vig?.part ?? '-'}, ${got.vig?.items ?? 0} pieces, zoom ${fmt(got.sp.zoom, 1)}` : `no splash (${id} at ${spotId})`}`);
          errors.length = 0;
        }
      }, { query: 'play=test-shower&seed=48213&nostore=1', viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
      console.log(`      ${rows.join('\n      ')}`);
      console.log(`      shots in ${SHOTS}: vignette-*.png, splash-*.png (look at them)`);
      const shot = rows.filter(r => !r.includes('no splash'));
      // (0.0.6: every vignette has a single action that splashes; v0.0.5 let one pass without)
      assert(shot.length === rows.length, `${shot.length} of ${rows.length} vignettes splashed`);
    },
  },
];
