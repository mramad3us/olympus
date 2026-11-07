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
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { frameClock, startSampling, stopSampling, burst, framesLine, pct } from './stage-drive.mjs';
import { KD_RANGE } from '../src/data/places/range.js';

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
];
