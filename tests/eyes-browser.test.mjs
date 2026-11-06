// OLYMPUS tests: the adapted eye on the screen (heavy; src/render/post.js setEye, src/render/view.js's eye, BODY's
// eyes through people's eyeViewOf; the user's ask of 2026-11-06: "eye adapting to darkness making things
// less dark after a while in the dark compared to when entering dark from a lit place"). In the page, at
// 16 px/m: twenty minutes in the lit Head A (the debug skip), into bay-2-1 at rack n1's foot facing east
// along the aisle (debug go) at 22:58, shots at 0 s and after debug skips at 1, 5 and 20 minutes, each
// once its splash is done; then test-night's sleep to the klaxon, its landing, and risen with T among the
// squad getting up, with the same instant shown through v0.0.4's eye (the record put at the eyes'
// reference) beside it. Holds that the view shows the sim's own number (view.stats.eye against
// eyeViewOf in the page), that the picture round you grows lighter with the minutes (its mean luma, read
// from the shots), that five minutes in is v0.0.4's picture (gain 1), and that the woken eye shows the
// squad lighter than v0.0.4's eye did (1.3 times the mean luma of the bay in sight or more: 2.48 times
// the linear light is about 1.5 after the picture's gamma, less the outlines' fixed ink and the rods'
// darker reds). Then the review of v0.0.5's eyes: the fire watch's red lamp through a fully dark-adapted
// eye keeps about v0.0.4's brightness (its pool's red pixels, their median value in HSV), while the dim
// surfaces round it lighten (the cones' gain for what the rods hardly see: post.js's two gains; one gain
// took the pool to 1.6 times); and the night's splash holds the picture as it began through its lapse,
// where the eyes, open in the berth until the lids close, would pulse it (0.88, 1.13, 1.0 within a
// second), easing to the woken eye over its zoom out. Shots into OLYMPUS_SHOTS (eyes-*.png); runs on OLYMPUS_TEST_PORT.
import { mkdirSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assert, fmt } from './helpers.mjs';
import { withGame } from './browser.mjs';
import { PNG } from './png-read.mjs';

const SHOTS = process.env.OLYMPUS_SHOTS ?? path.join(os.tmpdir(), 'olympus-shots');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
// (the mean luma of a rectangle of a shot, 0 to 255: the picture round you, the HUD's corners left out)
function lumaOf(file, [x0, y0, x1, y1]) {
  const { w, data } = PNG.read(readFileSync(file));
  let s = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * w + x) * 4; s += 0.30 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]; n++; }
  return s / n;
}
// (the page's eye: the view's numbers and the sim's own, eyeViewOf through the game's own module)
const eyeNow = (page) => page.evaluate(async () => {
  const o = window.__olympus, P = await import('/src/sim/people/perception.js');
  const me = o.state.actors.list.find(a => a.id === o.state.player.actor), sim = P.eyeViewOf(o.state, me);
  return { t: o.hud?.watch?.time ?? null, view: o.view?.eye ?? null, sim, me: { x: me.x, z: me.z, face: me.face, posture: me.posture ?? 'stand' } };
});
const settle = async (page) => { await page.waitForFunction(() => !window.__olympus.splash() && !window.__report?.view?.splash, null, { timeout: 60000 }); await sleep(800); };
const ROUND_YOU = [440, 120, 840, 420];
// (a shot's red pixels' median value, 0 to 1, and the mean luma of the rest that is not black, in a rectangle: the red lamp's pool and the surfaces round it)
function redOf(file, [x0, y0, x1, y1]) {
  const { w, data } = PNG.read(readFileSync(file)), red = [];
  let s = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * w + x) * 4, r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const sat = mx > 0 ? (mx - mn) / mx : 0, hue = mx === mn ? 0 : mx === r ? ((g - b) / (mx - mn) * 60 + 360) % 360 : -1;
    if (sat > 0.25 && mx > 0.25 && hue >= 0 && (hue < 29 || hue > 342)) red.push(mx);
    else if (mx > 0.08) { s += 0.30 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]; n++; }
  }
  red.sort((a, b) => a - b);
  return { n: red.length, value: red.length ? red[red.length >> 1] : 0, rest: n ? s / n : 0 };
}
const POST = [560, 300, 960, 520];
// (the part of the bay the woken player sees, risen at rack n1's foot: the squad's racks west of the aisle's end; the fogged memory round it keeps v0.0.4's light)
const IN_SIGHT = [550, 130, 735, 330];

export default [
  {
    name: 'the bay at 23:00 entered from the lit head, on the screen (the user, 2026-11-06: "eye adapting to darkness making things less dark after a while in the dark compared to when entering dark from a lit place"): darker just in, v0.0.4\'s picture at five minutes, lighter at twenty; the view shows the sim\'s own number',
    heavy: true,
    timeoutMs: 240_000,
    async fn() {
      mkdirSync(SHOTS, { recursive: true });
      await withGame(async (page) => {
        await page.evaluate(() => window.__olympus.skip(20 * 60_000));
        await settle(page);
        await page.evaluate(() => window.__olympus.go('melas.echo.1', 52.075, 3.3, 'right'));
        await sleep(1500);
        const rows = [];
        let at = 0;
        for (const m of [0, 1, 5, 20]) {
          if (m > at) { await page.evaluate((ms) => window.__olympus.skip(ms), (m - at) * 60_000); await settle(page); at = m; }
          const e = await eyeNow(page), file = path.join(SHOTS, `eyes-bay-${m}min.png`);
          await page.screenshot({ path: file });
          rows.push({ m, file, luma: lumaOf(file, ROUND_YOU), ...e });
        }
        for (const r of rows) console.log(`      ${String(r.m).padStart(2)} min (${r.t}): the view's gain ${fmt(r.view.gain, 3)} (shown ${fmt(r.view.shown.gain, 3)}, rods' share ${fmt(r.view.rod, 2)}), the sim's ${fmt(r.sim.gain, 3)}; the picture round you at mean luma ${fmt(r.luma, 1)}; ${path.basename(r.file)}`);
        assert(rows.every(r => Math.abs(r.view.gain - r.sim.gain) <= 0.01 && Math.abs(r.view.shown.gain - r.sim.gain) <= 0.05), 'the view shows another number than the sim\'s');
        assert(rows.every((r, i) => i === 0 || r.luma > rows[i - 1].luma), `the picture does not lighten with the minutes: ${rows.map(r => fmt(r.luma, 1)).join(', ')}`);
        const five = rows.find(r => r.m === 5);
        assert(Math.abs(five.sim.gain - 1) <= 0.01 && rows[0].sim.gain <= 0.55 && rows.at(-1).sim.gain >= 1.8, JSON.stringify(rows.map(r => [r.m, r.sim.gain])));
      }, { query: 'play=barracks&seed=48213&hour=22.62&nostore=1&area=melas.echo.1&at=60.8,13&face=up', timeoutMs: 60_000 });
    },
  },
  {
    name: 'the klaxon\'s landing shows the bay as a dark-adapted eye sees it: risen among the squad getting up, the picture round you lighter than v0.0.4\'s eye showed the same instant (the squad read as people, not dark shapes)',
    heavy: true,
    timeoutMs: 240_000,
    async fn() {
      mkdirSync(SHOTS, { recursive: true });
      await withGame(async (page) => {
        await page.evaluate(() => window.__olympus.activity('sleep', window.__olympus.offer()?.spotId ?? null, { until: 'reveille' }));
        await page.waitForFunction(() => !window.__report.view.splash && window.__report.view.beacon, null, { timeout: 60000 });
        await sleep(600);
        const landing = await eyeNow(page);
        await page.screenshot({ path: path.join(SHOTS, 'eyes-klaxon-landing.png') });
        await page.keyboard.press('KeyT');
        await sleep(6000);
        await page.evaluate(() => window.__olympus.pause(true));
        await sleep(600);
        const risen = await eyeNow(page), file = path.join(SHOTS, 'eyes-klaxon-risen.png');
        await page.screenshot({ path: file });
        // (the same instant through v0.0.4's eye: the record put at the eyes' reference, five minutes into the dark)
        await page.evaluate(async () => { const o = window.__olympus, E = await import('/src/sim/body/eyes.js'), b = o.state.people[o.state.player.id].body; b.eyes = { ...b.eyes, atMs: o.state.clock.ms, c: E.REF_LOG, rn: E.REF_LOG, rb: E.REF_LOG }; });
        await sleep(800);
        const ref = await eyeNow(page), refFile = path.join(SHOTS, 'eyes-klaxon-risen-v004.png');
        await page.screenshot({ path: refFile });
        const lAd = lumaOf(file, IN_SIGHT), lRef = lumaOf(refFile, IN_SIGHT);
        console.log(`      the landing (${landing.t}): the view's gain ${fmt(landing.view.gain, 2)} (${landing.me.posture}); risen (${risen.me.posture} at ${risen.me.x}, ${risen.me.z}): gain ${fmt(risen.view.gain, 2)}, rods' share ${fmt(risen.view.rod, 2)}, the bay in sight at mean luma ${fmt(lAd, 1)}; through v0.0.4's eye (gain ${fmt(ref.view.gain, 2)}) ${fmt(lRef, 1)}: ${fmt(lAd / lRef, 2)} times`);
        assert(risen.sim.gain >= 2.3 && Math.abs(risen.view.gain - risen.sim.gain) <= 0.01 && Math.abs(ref.view.gain - 1) <= 0.01 && lAd >= 1.3 * lRef, JSON.stringify({ risen: risen.view, ref: ref.view, lAd, lRef }));
      }, { query: 'play=test-night&seed=48213&nostore=1', timeoutMs: 60_000 });
    },
  },
  {
    name: 'the fire watch\'s red lamp through a fully dark-adapted eye keeps about v0.0.4\'s brightness while the dim surfaces round it lighten (the review of v0.0.5\'s eyes: one gain took its pool to 1.6 times, toward salmon)',
    heavy: true,
    timeoutMs: 240_000,
    async fn() {
      mkdirSync(SHOTS, { recursive: true });
      await withGame(async (page) => {
        await sleep(1500);
        await page.evaluate(() => window.__olympus.pause(true));
        const rows = [];
        for (const [name, st] of [['v0.0.4', 'ref'], ['adapted', [0, -2.1, -2.1]]]) {
          await page.evaluate(async (st) => { const o = window.__olympus, E = await import('/src/sim/body/eyes.js'), b = o.state.people[o.state.player.id].body, [c, rn, rb] = st === 'ref' ? [E.REF_LOG, E.REF_LOG, E.REF_LOG] : st; b.eyes = { ...b.eyes, atMs: o.state.clock.ms, c, rn, rb }; o.step(1); }, st);
          await sleep(900);
          const e = await eyeNow(page), file = path.join(SHOTS, `eyes-red-${name}.png`);
          await page.screenshot({ path: file });
          rows.push({ name, e, ...redOf(file, POST) });
        }
        for (const r of rows) console.log(`      ${r.name.padEnd(8)}: gain ${fmt(r.e.view.gain, 2)}, the cones' ${fmt(r.e.view.coneGain, 2)}, rods' share ${fmt(r.e.view.rod, 2)}; the red pool's ${r.n} pixels at median value ${fmt(r.value, 3)}, the surfaces round it at mean luma ${fmt(r.rest, 1)}; eyes-red-${r.name}.png`);
        const [ref, ad] = rows;
        console.log(`      the pool ${fmt(ad.value / ref.value, 2)} times v0.0.4's (one gain: 1.61), the surfaces ${fmt(ad.rest / ref.rest, 2)} times`);
        assert(ad.e.view.gain >= 1.8 && ad.e.view.coneGain <= 1.2 && ad.value <= 1.35 * ref.value && ad.rest >= 1.1 * ref.rest, JSON.stringify(rows.map(r => [r.name, r.e.view, r.value, r.rest])));
      }, { query: 'play=barracks&seed=48213&hour=23.3&nostore=1&area=melas.echo.1&at=56.4,6.2&face=right', viewport: { width: 1600, height: 900 }, timeoutMs: 60_000 });
    },
  },
  {
    name: 'the night\'s splash holds the picture as it began through its lapse, never pulsing with the eyes open in the berth before the lids close (the review of v0.0.5\'s eyes), and eases to the woken eye over its zoom out',
    heavy: true,
    timeoutMs: 240_000,
    async fn() {
      await withGame(async (page) => {
        await sleep(800);
        await page.keyboard.press('KeyR');
        await page.waitForFunction(() => !!window.__olympus.splash(), null, { timeout: 15000 });
        const rows = await page.evaluate(() => new Promise(res => {
          const out = [];
          const f = () => { const v = window.__report.view.eye, sp = window.__olympus.splash(); out.push({ phase: sp?.phase ?? null, g: v?.gain ?? null, shown: v?.shown?.gain ?? null }); if (sp || out.length < 3) requestAnimationFrame(f); else setTimeout(() => { const w = window.__report.view.eye; out.push({ phase: 'after', g: w.gain, shown: w.shown.gain }); res(out); }, 600); };
          requestAnimationFrame(f);
        }));
        const lapse = rows.filter(r => r.phase === 'lapse'), span = (a) => [Math.min(...a), Math.max(...a)];
        const [g0, g1] = span(lapse.map(r => r.g)), [s0, s1] = span(lapse.map(r => r.shown)), outs = rows.filter(r => r.phase === 'out').map(r => r.shown), after = rows.at(-1);
        console.log(`      ${rows.length} frames; through the lapse the eye's own gain ${fmt(g0, 2)} to ${fmt(g1, 2)}, the picture's ${fmt(s0, 3)} to ${fmt(s1, 3)}; over the zoom out ${outs.map(v => fmt(v, 2)).join(', ')}; after, ${fmt(after.shown, 2)} (the eye ${fmt(after.g, 2)})`);
        assert(lapse.length > 10 && g1 - g0 > 0.2 && s1 - s0 <= 0.01, JSON.stringify({ g0, g1, s0, s1 }));
        assert(outs.length >= 2 && Math.abs(after.shown - after.g) <= 0.1 && after.g >= 2, JSON.stringify({ outs, after }));
      }, { query: 'play=test-night&seed=48213&nostore=1', timeoutMs: 60_000 });
    },
  },
];
