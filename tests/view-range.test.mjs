// OLYMPUS tests: the 25 m line on the stage in headless Chrome at 16 px/m, through a string (the build sheet 0.0.5 §5.3; heavy).
//
// test-handling's 'hot' setup (prone on lane 5, the line hot, the mode entered and aimed at your card),
// the rifle put on semi and five shots fired by the debug handle's acts (the step panel's own: the hud's
// keys are its tests'), every frame sampled in the page. It prints the frame median and p95, the draw calls,
// the uploads, the view's CPU; the camera's centre against the weapon mode's lead (lead.js aimLead: 0.55 of
// the way to the bracketed card, you 2.5 m inside the frame); where the card falls in the picture; the
// holes, the cases and the flags the range layer drew; who was drawn frame by frame. It holds: p95 at most
// 18 ms on a 60 Hz clock, at most 160 draw calls, no frame over 1 MB, no program linked; the camera on the
// lead within a pixel; the card in the frame while bracketed; a hole drawn on the card for every shot on
// it; a case for every shot; the same people drawn in every frame (none appearing or vanishing); no error.
// Then the postures and stances the scene uses, each a step by the handle (G's raise, the high ready,
// kneeling, the low ready kneeling, a magazine in, the charging handle, a press check, a magazine dropped)
// and the frame the view drew for it (view.arms.frame) against poses.js rifleFrame's. With OLYMPUS_SHOTS
// set to a folder, each beat's picture is written there (the shots the sheet asks to be looked at).
// 0.0.7 (the build sheet 0.0.7 §5.4): the KD's line at 300 m (test-range's 'far' setup: prone, 4×, aimed at your face):
// the far window opens on your face once its ground is up and stays open; a shot fired, then the aim held, the pits'
// carrier going down and up again, its drawn top sampled every frame: continuous (no frame's step over a pixel), the
// face wholly under the ground while marked; the KD's twenty faces drawn, the window's chunks built (the parapet's and
// the pits' with them), the draw calls with the window open, no error.
// 0.0.8 (the build sheet 0.0.8 §5.4 view-range): the pairs pad (test-pairs, the private on 48213): the six stands and the
// painted lines in the ground's pieces; a turner's drawn width sampled every frame through its turn, following the closed
// form (the face's 15 px × facingK at the moment drawn, at least its edge's pixel) and never stepping more than the turn's
// own slope over the frame's time; holes on the face after the Pair; the armoured face's spark drawn while a ringing
// round's SPARK_MS lasts; no error.
// 0.0.8 (the user's report of 2026-11-07, "when at 300m, with the scope at 1x, the view still shows the target zoomed
// in, just without the haircross"): the same line, the window's picture read at 4× and again with the lever thrown to 1:
// the face's width in picture pixels from its outline ring (32 at 4×, 8 at 1×: 4 to 1), the reticle at 4× and none at 1×,
// the window's density (16 and 4 px/m) and its ground (12 chunks, none built for the lever); the shots written as
// kd-03-4x and kd-04-1x.
// 0.0.8 (the sock verifier's: the plates, the step panel and the far window covered the one middle flag for every lane you
// can draw): in the user's own framing (test-range 'far', prone on the 300 m line, the far window open) at 1280 x 720,
// 1470 x 860 and 1600 x 900 on lanes 8 to 11, and on the 200 m line with E held (the window walking), the wind flag the
// HUD keeps (window.__olympus.far.flag) is the one on your lane's side 18 m downrange, its box in the picture and clear
// of every HUD rectangle, the far window's disc and its plates, its sleeve's white bands in the screenshot; the shots
// flag-<size>-lane<n>.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { frameClock, startSampling, stopSampling, burst, framesLine, pct } from './stage-drive.mjs';
import { KD_RANGE } from '../src/data/places/range.js';
import * as PLACES_RANGE from '../src/data/places/range.js';
import { turnerPx } from '../src/render/range-items.js';
import { PNG } from './png-read.mjs';

const SHOTS = process.env.OLYMPUS_SHOTS ?? null;
const save = async (page, name) => { if (!SHOTS) return; mkdirSync(SHOTS, { recursive: true }); writeFileSync(path.join(SHOTS, `${name}.png`), await page.screenshot()); };
const act = (page, step) => page.evaluate((s) => window.__olympus.act({ act: 'stop', args: { step: s } }), step);
// (a step chosen, then the clock left to run until stop motion is back in its choose phase)
async function stepTo(page, step, maxMs = 8000) {
  await act(page, step);
  for (let t = 0; t < maxMs; t += 100) {
    await page.waitForTimeout(100);
    const ph = await page.evaluate(() => window.__olympus.stop?.()?.phase ?? null);
    if (ph === 'choose' && t >= 200) return true;
  }
  return false;
}
const peek = (page) => page.evaluate(() => {
  const v = window.__report.view;
  return { cam: v.camera, you: v.you, arms: v.arms, range: v.range, lying: v.lying, res: v.res, people: v.people, session: window.__olympus.range?.() ?? null };
});

export default [
  {
    name: 'the 25 m line through a string of five at 16 px/m: 60 fps (p95 at most 18 ms on a 60 Hz clock), the camera on the weapon mode\'s lead, the card in the frame, a hole for every shot on the card and a case for every shot, nobody appearing or vanishing (the build sheet 0.0.5 §5.3)',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForTimeout(1500);
        const b0 = await peek(page), boot = await page.evaluate(() => window.__report.view.programs);
        await save(page, 'range-00-hot');
        const lane = KD_RANGE.bay.lanes.find(l => l.lane === b0.session?.lane) ?? KD_RANGE.bay.lanes[0];
        const half = [b0.res[0] / 16 / 2, b0.res[1] / 16 / 2];
        // (the lead: 0.55 of the way to your card, you 2.5 m inside the frame)
        const wantX = Math.min(b0.you.x + 0.55 * (lane.target.x - b0.you.x), b0.you.x + half[0] - 2.5), offPx = Math.abs(b0.cam.x - wantX) * 16;
        const card = { x: (lane.target.x - b0.cam.x) * 16 + b0.res[0] / 2, y: (lane.target.z - lane.target.centreY - b0.cam.z) * 16 + b0.res[1] / 2 };
        console.log(`      lane ${lane.lane}: you at (${b0.you.x}, ${b0.you.z}), ${b0.arms?.stance} ${b0.arms?.frame}; the camera at (${fmt(b0.cam.x, 3)}, ${fmt(b0.cam.z, 3)}), the lead's ${fmt(wantX, 3)} (${fmt(offPx, 2)} px off); your card at picture pixel (${fmt(card.x, 0)}, ${fmt(card.y, 0)}) of ${b0.res[0]} × ${b0.res[1]}`);
        assert(offPx <= 1, `the camera ${fmt(offPx, 2)} px off the lead`);
        assert(card.x > 8 && card.x < b0.res[0] - 8 && card.y > 8 && card.y < b0.res[1] - 8, 'the card in the frame');
        // (off safe, then five shots, every frame sampled; who is drawn recorded every frame)
        await stepTo(page, 'selector:semi');
        await page.evaluate(() => { window.__who = []; const f = () => { if (!window.__who) return; window.__who.push((window.__report.view.figures ?? []).map(p => p.id).sort().join()); requestAnimationFrame(f); }; requestAnimationFrame(f); });
        await startSampling(page);
        for (let i = 0; i < 5; i++) { await stepTo(page, 'fire'); if (i === 0) await save(page, 'range-01-first-shot'); }
        const frames = await stopSampling(page), who = await page.evaluate(() => { const w = window.__who; window.__who = null; return w; });
        const here = await frameClock(page), b = await burst(page), after = await peek(page), programs = await page.evaluate(() => window.__report.view.programs);
        await save(page, 'range-02-string');
        const dts = frames.map(f => f.dt), calls = Math.max(...frames.map(f => f.calls)), bytes = Math.max(...frames.map(f => f.bytes)), links = frames.reduce((n, f) => n + f.links, 0);
        const sixty = pct(dts, 0.5) <= 17.5 && here.medianMs <= 17.5, shots = after.session?.summary?.shots ?? 0, hits = after.session?.summary?.hits ?? 0;
        const casts = new Set(who.filter(Boolean));
        console.log(`      the string: ${frames.length} frames, ${framesLine(dts)}; draw calls ${calls} at most, uploads ${fmt(bytes / 1024, 1)} KB a frame at most, ${links} programs linked (${boot} → ${programs}); the view's CPU median ${fmt(pct(frames.map(f => f.viewMs), 0.5), 2)} ms`);
        console.log(`      ${shots} shots, ${hits} on the card (${after.session?.summary?.score ?? 0} of ${after.session?.summary?.of ?? 0}): ${after.range?.holes ?? 0} holes drawn, ${after.range?.brass ?? 0} cases (${after.range?.flying ?? 0} flying), the flags ${after.range?.flag ?? 0} px; who was drawn: ${casts.size} cast${casts.size === 1 ? '' : 's'} over ${who.length} frames (${[...casts].join(' / ')})`);
        console.log(`      40 frames back to back, each finished on the GPU: median ${fmt(b.medianMs, 2)} ms, p95 ${fmt(b.p95Ms, 2)} ms; the clock ${fmt(here.medianMs, 1)} ms${sixty ? '' : ' (not 60 Hz: the paced p95 is printed, not held)'}`);
        assert(shots === 5, `${shots} shots fired`);
        assert((after.range?.holes ?? 0) === hits && (after.range?.brass ?? 0) === shots, `holes ${after.range?.holes} for ${hits} hits, cases ${after.range?.brass} for ${shots} shots`);
        assert((after.range?.flag ?? 0) > 0, 'the red flags flown while hot');
        assert(casts.size === 1, `people appeared or vanished: ${[...casts].join(' / ')}`);
        assert(calls <= 160 && bytes <= 1024 * 1024 && links === 0, `calls ${calls}, bytes ${bytes}, links ${links}`);
        assert(b.medianMs <= 1000 / 60, `a frame and its GPU work: median ${fmt(b.medianMs, 2)} ms`);
        if (sixty) assert(pct(dts, 0.95) <= 18, `paced frames: p95 ${fmt(pct(dts, 0.95), 1)} ms`);
        assert(!errors.length, errors.join('\n'));
      }, { port: Number(process.env.OLYMPUS_TEST_PORT) || 8223, query: 'play=test-handling&seed=48213&setup=hot&nostore=1&perf=1&ppm=16', viewport: { width: 1280, height: 720 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'the postures, stances and handling the scene uses are drawn in their frames (G\'s raise, the high ready, kneeling high and low, a magazine in, the charging handle, a press check, a magazine dropped and lying), as the arms role\'s gunLook says',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForTimeout(1200);
        const rows = [], seen = (await peek(page)).arms;
        rows.push(`on the line: ${seen?.carry} ${seen?.stance} → ${seen?.frame}`);
        await save(page, 'range-10-on-the-line');
        assert(seen?.frame === 'slungFront', `on the line the rifle slung front: ${seen?.frame}`);
        await page.keyboard.press('KeyG');
        for (let t = 0; t < 4000; t += 100) { await page.waitForTimeout(100); if ((await page.evaluate(() => window.__olympus.stop?.()?.phase)) === 'choose') break; }
        const plan = [['posture:highReady', 'highReady'], ['stance:kneel', 'kneelHigh'], ['posture:lowReady', 'kneelLow'], ['reach@p1', 'kneelLow'], ['seat', 'kneelLow'], ['charge', 'kneelLow'], ['pressCheck', 'kneelLow'], ['magOut:drop', 'kneelLow'], ['stance:prone', 'proneLow']];
        let n = 11;
        const g = await peek(page);
        rows.push(`G: ${g.arms?.carry} ${g.arms?.stance} → ${g.arms?.frame}`);
        assert(g.arms?.frame === 'lowReady', `G raised the rifle to the low ready: ${g.arms?.frame}`);
        for (const [step, rest] of plan) {
          await act(page, step);
          await page.waitForTimeout(150);
          const mid = await peek(page);
          await save(page, `range-${n++}-${step.replace(':', '-')}`);
          for (let t = 0; t < 8000; t += 100) { await page.waitForTimeout(100); if ((await page.evaluate(() => window.__olympus.stop?.()?.phase)) === 'choose') break; }
          const end = await peek(page);
          rows.push(`${step}: during ${mid.arms?.frame}, after ${end.arms?.stance} ${end.arms?.carry} → ${end.arms?.frame}${end.lying?.items ? `; ${end.lying.items} lying (${end.lying.pixels} px)` : ''}`);
          assert(end.arms?.frame === rest, `${step}: after it ${end.arms?.frame}, not ${rest}`);
        }
        for (const r of rows) console.log(`      ${r}`);
        const last = await peek(page);
        assert((last.lying?.items ?? 0) >= 1, 'the dropped magazine lies on the ground');
        assert(!errors.length, errors.join('\n'));
      }, { port: Number(process.env.OLYMPUS_TEST_PORT) || 8223, query: 'play=test-handling&seed=48213&nostore=1&perf=1&ppm=16', viewport: { width: 1280, height: 720 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'the KD at 300 m: the far window open on your face, a shot fired and the aim held while the pits mark it, the carrier going down and up continuously (no frame\'s step over a pixel), the twenty faces drawn (the build sheet 0.0.7 §5.4)',
    heavy: true,
    timeoutMs: 240000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForTimeout(3000);
        const b0 = await page.evaluate(() => ({ far: window.__report.view.far, kd: window.__report.view.range?.kd ?? null, stop: window.__olympus.state.stop?.pick ?? null, slots: (window.__olympus.steps?.()?.slots ?? []).map(x => `${x.id}${x.off ? '×' : ''}`).slice(0, 6) }));
        const lane = Number(String(b0.stop ?? '').split(':')[1]) || null;
        console.log(`      the window at the start: ${JSON.stringify({ open: b0.far?.open, ready: b0.far?.ready, chunks: b0.far?.chunks, key: b0.far?.key })}; the panel ${b0.slots.join(', ')}; your face lane ${lane}`);
        await save(page, 'kd-00-far');
        // (every frame: your lane's carrier as drawn, the window's state, the draw calls)
        await page.evaluate((lane) => { window.__kd = []; const f = () => { if (!window.__kd) return; const v = window.__report.view, c = (v.range?.kd?.carriers ?? []).find(x => x.lane === lane); window.__kd.push({ y: c?.yTop ?? null, up: c?.up ?? null, open: !!v.far?.open, calls: v.calls }); requestAnimationFrame(f); }; requestAnimationFrame(f); }, lane);
        // (the shot, then out of stop motion so the game's time runs, E held: the window on your own face while the pits mark it)
        await page.keyboard.press('Digit1');
        await page.waitForTimeout(1200);
        await page.keyboard.press('KeyX');
        await page.waitForTimeout(200);
        await page.keyboard.down('KeyE');
        for (let i = 0; i < 14; i++) { await page.waitForTimeout(1000); if (i === 3) await save(page, 'kd-01-marking'); }
        await page.keyboard.up('KeyE');
        await page.waitForTimeout(300);
        const kd = await page.evaluate(() => { const w = window.__kd; window.__kd = null; return w; });
        const after = await page.evaluate(() => ({ far: window.__report.view.far, kd: window.__report.view.range?.kd ?? null }));
        await save(page, 'kd-02-after');
        const ys = kd.filter(f => f.y !== null).map(f => f.y);
        let worst = 0;
        for (let i = 1; i < ys.length; i++) worst = Math.max(worst, Math.abs(ys[i] - ys[i - 1]) * 16);
        const lowest = Math.min(...ys), openShare = kd.filter(f => f.open).length / Math.max(1, kd.length), calls = Math.max(...kd.map(f => f.calls));
        console.log(`      ${kd.length} frames: your carrier's top from ${fmt(Math.max(...ys), 3)} to ${fmt(lowest, 3)} m, the largest step a frame ${fmt(worst, 2)} px; the window open ${fmt(openShare * 100, 0)}% of frames (out of stop motion, E held); draw calls ${calls} at most`);
        console.log(`      at the end: the window ${JSON.stringify({ open: after.far?.open, chunks: after.far?.chunks, calls: after.far?.calls })}; the KD drawn ${JSON.stringify({ ...after.kd, carriers: after.kd?.carriers?.length })}`);
        assert(b0.far?.open && b0.far?.ready, 'the far window open on your face');
        assert((after.kd?.faces ?? 0) === 20 && (after.far?.chunks ?? 0) >= 2, 'the faces and the window\'s ground');
        assert(worst <= 1.0 + 1e-9, `a carrier's step of ${fmt(worst, 2)} px in one frame`);
        assert(lowest < 0, `the face went down under the ground (lowest top ${lowest})`);
        assert(calls <= 160, `${calls} draw calls`);
        assert(!errors.length, errors.join('\n'));
      }, { port: Number(process.env.OLYMPUS_TEST_PORT) || 8223, query: 'play=test-range&seed=48213&setup=far&nostore=1&perf=1&ppm=16', viewport: { width: 1280, height: 720 }, timeoutMs: 90000 });
    },
  },
  {
    name: 'the pairs pad at 16 px/m: the stands and the lines among the ground\'s pieces; a turner\'s drawn width through its turn following its facing, no frame\'s step over the turn\'s own slope; the holes on the face after a Pair; the steel\'s spark while a ringing round\'s lasts (the build sheet 0.0.8 §5.4)',
    heavy: true,
    timeoutMs: 300000,
    async fn() {
      const pieces = (PLACES_RANGE.RANGE_PIECES ?? []).filter(p => p.kind === 'kdTurner' || p.kind === 'kdPaint');
      console.log(`      the ground's pieces: ${pieces.filter(p => p.kind === 'kdTurner').length} turner stands, ${pieces.filter(p => p.kind === 'kdPaint').map(p => p.look?.text).join(' and ')} painted`);
      assert(pieces.filter(p => p.kind === 'kdTurner').length === 6 && pieces.filter(p => p.kind === 'kdPaint').length === 2, JSON.stringify(pieces.map(p => p.id)));
      await withGame(async (page, errors) => {
        const bot = (until, maxTicks = 60000) => page.evaluate(async ([until, maxTicks]) => {
          const { pairsBot } = await import('/tests/bots/pairs.mjs');
          const O = window.__olympus; window.__pairsBot ??= pairsBot();
          const run = window.__pairsBot, done = new Function('O', `return (${until});`);
          O.pause(true);
          let n = 0;
          for (; n < maxTicks && !done(O); n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); O.step(1, run(s, me, (me.bot ??= {}))); }
          return { ticks: n, done: done(O) };
        }, [until, maxTicks]);
        // (to the standby's last ticks before the turn, then the clock running: every frame the turning face's width)
        await bot('(() => { const p = O.pairs(); return !!p?.str && p.str.armed && p.str.turnAtMs - O.state.clock.ms <= 200; })()');
        const W = turnerPx(16).w;
        await page.evaluate(() => { window.__tw = []; const f = (t) => { if (!window.__tw) return; const ps = window.__report.view.range?.pairs; window.__tw.push({ t, widths: ps?.widths ?? [], ms: window.__olympus.state.clock.ms }); requestAnimationFrame(f); }; requestAnimationFrame(f); });
        await page.evaluate(() => window.__olympus.pause(false));
        await page.waitForFunction(() => !!window.__olympus.contact()?.last, null, { timeout: 10000 });
        await page.waitForTimeout(300);
        const tw = await page.evaluate(() => { const w = window.__tw; window.__tw = null; return w; });
        await save(page, 'pairs-00-pause');
        const lane = Number(String((await page.evaluate(() => window.__olympus.contact().last.ids[0]))).split(':')[1]);
        const series = tw.map(f => ({ t: f.t, w: f.widths.find(x => x.lane === lane) })).filter(f => f.w);
        let worst = 0, bad = 0;
        for (let i = 1; i < series.length; i++) {
          const dw = Math.abs(series[i].w.dw - series[i - 1].w.dw), dt = series[i].t - series[i - 1].t, allow = Math.ceil(dt * (Math.PI / 2) / 300 * W) + 1;
          worst = Math.max(worst, dw);
          if (dw > allow) bad++;
          // (the drawn width is the face's at the facing the frame drew: its 15 px × facingK, at least the edge's pixel)
          const want = Math.max(1, Math.round(W * series[i].w.facingK));
          if (series[i].w.dw !== want) bad++;
        }
        const turned = series.filter(f => f.w.dw > 1 && f.w.dw < W).length;
        console.log(`      lane ${lane}'s turn over ${series.length} frames: widths ${series.map(f => f.w.dw).filter((w, i, a) => i === 0 || w !== a[i - 1]).join(' → ')} px; ${turned} frames part-way; the largest step a frame ${worst} px; out of bounds ${bad}`);
        assert(series.length >= 4 && turned >= 1 && bad === 0 && series.at(-1).w.dw === W, JSON.stringify({ n: series.length, turned, bad, last: series.at(-1) }));
        // (the bot's Pair: the holes on the face)
        await bot('(O.pairs()?.str?.shots?.length ?? 0) >= 0 && (O.state.armoury.range.turners ?? []).some(t => (t.hits ?? []).length >= 2)');
        await page.waitForTimeout(400);
        const holes = await page.evaluate(() => window.__report.view.range?.pairs);
        await save(page, 'pairs-01-holes');
        console.log(`      after the Pair: ${JSON.stringify({ turners: holes?.turners, hung: holes?.hung, holes: holes?.holes, pixels: holes?.pixels })}`);
        assert(holes?.turners === 6 && holes.holes >= 2 && holes.pixels > 0, JSON.stringify(holes));
        // (on to the armoured string's first ringing round: the spark, drawn at that tick)
        const ring = await bot('(O.state.armoury.range.turners ?? []).some(t => (t.hits ?? []).some(h => h.ring && O.state.clock.ms - (h.atMs ?? 0) < 100))', 120000);
        await page.waitForTimeout(250);
        const spark = await page.evaluate(() => ({ pairs: window.__report.view.range?.pairs, blast: window.__report.view.range?.flash }));
        await save(page, 'pairs-02-spark');
        console.log(`      ${ring.ticks} ticks on, a round rang on the armoured face: sparks drawn ${spark.pairs?.sparks}, holes ${spark.pairs?.holes}`);
        assert(ring.done && (spark.pairs?.sparks ?? 0) > 0, JSON.stringify(spark));
        await page.evaluate(() => window.__olympus.pause(false));
        assert(!errors.length, errors.join('\n'));
      }, { port: Number(process.env.OLYMPUS_TEST_PORT) || 8223, query: 'play=test-pairs&tier=private&seed=48213&nostore=1&perf=1&ppm=16', viewport: { width: 1280, height: 720 }, timeoutMs: 90000 });
    },
  },
  {
    name: 'the far window at 300 m is drawn at the lever\'s scale (the user\'s report, 2026-11-07: "when at 300m, with the scope at 1x, the view still shows the target zoomed in, just without the haircross"): your face 32 px across at 4× with the reticle, 8 px at 1× without it, 4 to 1, no chunk built for the lever',
    heavy: true,
    timeoutMs: 180000,
    async fn() {
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__report.view.far?.open && window.__report.view.far?.alpha >= 1, null, { timeout: 20000 });
        await page.waitForTimeout(500);
        // (the face's width in the picture: along a row through the window's centre (6 px off it at 4×, clear of the
        // reticle's wire and ticks; on it at 1×, between the brackets' corners), outward from the centre past the black to the face's outline ring, either way)
        const faceWidth = async (name, rowOff) => {
          const f = await page.evaluate(() => window.__report.view.far), box = await page.evaluate(() => { const cv = [...document.querySelectorAll('canvas')].sort((a, b) => (parseFloat(b.style.width) || 0) - (parseFloat(a.style.width) || 0))[0], c = cv.style; return { ox: parseFloat(c.left) || 0, oy: parseFloat(c.top) || 0, w: parseFloat(c.width), W: window.__report.view.res[0] }; });
          const buf = await page.screenshot();
          if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); writeFileSync(path.join(SHOTS, `${name}.png`), buf); }
          const im = PNG.read(buf), k = box.w / box.W;
          const luma = (x, y) => { const X = Math.round(box.ox + (x + 0.5) * k), Y = Math.round(box.oy + (y + 0.5) * k), i = (Y * im.w + X) * 4; return 0.3 * im.data[i] + 0.59 * im.data[i + 1] + 0.11 * im.data[i + 2]; };
          const [cx, cy] = f.centre, y = cy + rowOff, ink = (x) => luma(x, y) < 36;
          const edge = (dir) => { let x = cx, n = 0; while (ink(x) && n++ < 12) x += dir; for (n = 0; n < 40 && !ink(x); n++) x += dir; return n < 40 ? x : null; };
          const l = edge(-1), r = edge(1);
          return { far: f, w: l !== null && r !== null ? r - l + 1 : null, l, r, k };
        };
        const four = await faceWidth('kd-03-4x', 6);
        const r0 = await page.evaluate(() => ({ uploads: window.__report.view.far?.chunks, building: window.__report.view.far?.building }));
        await page.evaluate(() => { window.__olympus.act({ act: 'stop', args: { step: 'optic:1' } }); return true; });
        const eased = [];
        for (let i = 0; i < 14; i++) { await page.waitForTimeout(60); eased.push(await page.evaluate(() => window.__report.view.far?.mag)); }
        await page.waitForFunction(() => window.__report.view.far?.mag === 1 && window.__report.view.far?.open, null, { timeout: 10000 });
        await page.waitForTimeout(400);
        const one = await faceWidth('kd-04-1x', 0);
        console.log(`      4×: the window at ${four.far.ppm} px/m (its pass ${four.far.spanPx} px), the reticle ${four.far.reticle ? 'on' : 'off'} (a mil ${four.far.milPx} px); your face ${four.w} px across (${four.l} to ${four.r} in the picture)`);
        console.log(`      the lever to 1: the scale every 60 ms ${eased.map(m => fmt(m, 2)).join(', ')}; 1×: ${one.far.ppm} px/m (its pass ${one.far.spanPx} px), the reticle ${one.far.reticle ? 'on' : 'off'}; your face ${one.w} px across (${one.l} to ${one.r}); ${fmt(four.w / one.w, 2)} to 1`);
        console.log(`      the window's ground: ${r0.uploads} chunks at 4× (${r0.building} building), ${one.far.chunks} at 1× (${one.far.building} building); draw calls ${four.far.calls} and ${one.far.calls}`);
        assert(four.far.ppm === 16 && one.far.ppm === 4 && four.far.reticle === 1 && one.far.reticle === 0, JSON.stringify({ four: four.far, one: one.far }));
        assert(four.w >= 30 && four.w <= 34 && one.w >= 7 && one.w <= 9 && Math.abs(four.w / one.w - 4) <= 0.6, `the face ${four.w} px at 4×, ${one.w} at 1×`);
        assert(one.far.chunks === r0.uploads && one.far.building === 0, `chunks ${r0.uploads} → ${one.far.chunks}`);
        // (eased, never a pop: some frames between the two scales)
        assert(eased.some(m => m > 1.05 && m < 3.95), `the scale on the way: ${eased}`);
        assert(!errors.length, errors.join('\n'));
      }, { port: Number(process.env.OLYMPUS_TEST_PORT) || 8223, query: 'play=test-range&seed=48213&setup=far&nostore=1&perf=1&ppm=16', viewport: { width: 1280, height: 720 }, timeoutMs: 90000 });
    },
  },
  {
    name: 'a wind flag stays readable from the firing point in the picture as played (the sock verifier\'s, 0.0.8): prone on the 300 m line with the far window open at 1280 × 720, 1470 × 860 and 1600 × 900 on lanes 8 to 11, and on the 200 m line with E held, the flag 18 m downrange beside your lane is kept clear of every HUD rectangle, the far window and its plates, its sleeve\'s white bands on the screen',
    heavy: true,
    timeoutMs: 420000,
    async fn() {
      // (seeds 2, 4, 3 and 1 draw lanes 8, 9, 10 and 11)
      const SEEDS = [[2, 8], [4, 9], [3, 10], [1, 11]], SIZES = [[1280, 720], [1470, 860], [1600, 900]];
      const rows = [];
      await withGame(async (page, errors, game) => {
        const check = async (label, lane) => {
          await page.waitForFunction(() => window.__olympus.far?.open && window.__olympus.far?.alpha >= 1, null, { timeout: 20000 });
          await page.waitForTimeout(400);
          const r = await page.evaluate(() => {
            const box = (sel) => { const e = document.querySelector(sel); if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; const b = e.getBoundingClientRect(); return b.width && b.height ? { sel, x: b.left, y: b.top, w: b.width, h: b.height } : null; };
            const o = window.__olympus, f = o.far, p = f.place;
            return { flag: f.flag, disc: { sel: 'disc', x: p.cx - p.RK, y: p.cy - p.RK, w: 2 * p.RK, h: 2 * p.RK }, label: p.label ? { sel: 'plates', ...p.label } : null, kd: o.kd()?.kdLane,
              hud: ['.toasts', '.watch', '.paper', '.instinct', '.steps', '.radio.voices', '.keyshint'].map(box).filter(Boolean) };
          });
          const buf = await page.screenshot();
          if (SHOTS) { mkdirSync(SHOTS, { recursive: true }); writeFileSync(path.join(SHOTS, `flag-${label}-lane${lane}.png`), buf); }
          const im = PNG.read(buf), F = r.flag;
          let white = 0;
          if (F) for (let y = Math.ceil(F.y); y < F.y + F.h; y++) for (let x = Math.ceil(F.x); x < F.x + F.w; x++) { const i = (y * im.w + x) * 4; if (im.data[i] > 215 && im.data[i + 1] > 200 && im.data[i + 2] > 190) white++; }
          const meets = F ? [...r.hud, r.disc, r.label].filter(b => b && overlap(F, b)).map(b => b.sel) : ['no flag'];
          rows.push(`${label} lane ${r.kd}: the flag at (${F?.fx}, ${F?.fz}), ${F ? `${fmt(F.dM, 1)} m off, its box ${[F.x, F.y, F.w, F.h].map(v => fmt(v, 0)).join(', ')}` : 'none kept'}; its sleeve's white ${white} px; meets ${meets.join(', ') || 'nothing'}`);
          assert(r.kd === lane && F && Math.abs(F.fz - (KD_RANGE.kd.lane1Z + 5 * (lane - 1))) === 2.5 && F.fx % 100 === 18 && !meets.length && white >= 12, JSON.stringify({ label, lane, r, white, meets }));
        };
        const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        for (const [w, h] of SIZES) {
          await page.setViewportSize({ width: w, height: h });
          for (const [seed, lane] of SEEDS) { await game.open(`play=test-range&seed=${seed}&setup=far&hour=10&nostore=1`); await check(`${w}x${h}`, lane); }
        }
        // (the 200 m line, standing at the dope with E held: the window walking, your own face)
        await page.setViewportSize({ width: 1280, height: 720 });
        for (const [seed, lane] of [SEEDS[0], SEEDS[3]]) {
          await game.open(`play=test-range&seed=${seed}&setup=s200&hour=10&nostore=1`);
          await page.keyboard.down('KeyE');
          await check('200m-E', lane);
          await page.keyboard.up('KeyE');
        }
        for (const r of rows) console.log(`      ${r}`);
        assert(!errors.length, errors.join('\n'));
      }, { port: Number(process.env.OLYMPUS_TEST_PORT) || 8223, query: 'play=test-range&seed=2&setup=far&hour=10&nostore=1', viewport: { width: 1280, height: 720 }, timeoutMs: 90000 });
    },
  },
];
