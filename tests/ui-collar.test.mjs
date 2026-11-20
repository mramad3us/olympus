// OLYMPUS tests: ui-collar, "Away the boarding party" in the page (the build sheet v0.0.27 §6 E ui-collar; F165's, F166's and F168's
// page halves). Heavy, a browser file.
//
// In the page at 16 px/m on test-collar, seed 48213, the smugglers drawn (their P-12s alone, two or three of the hauler's crew), the
// private by the keys from GO (tests/bots/collar.mjs collarBot, D's) to the card, a tick a frame:
//   - F168: at every frame each man drawn (render/view.js's figures, window.__report.view.figures, not a memory) is drawn as the one
//     map says, read in the page from the sim's state: an armed man in the shock band's frame poses.js shockFrameOf names (his daze
//     with its sway, the cower, blind fire, the 0 G down: look.js gunLook's action), never a stand-in; an unarmed man down at 0 G in
//     the float band's float0, on his knee showing his empty hands (handsKneel); nobody at 0 G in the casualty's lying card or the seat;
//   - F165: no figure band sent from GO + 1 s (view.stats.bands' list each frame), no rifle sheet given to another look after GO (the
//     pool's evictions), the dolls painted after the load printed; the rifle pool's sheets in use and F73's reading (the largest upload
//     after GO + 1 s) printed;
//   - no page error, console error or failed request; the frame times printed.
// And F166's page half at 1024 × 768 and 1600 × 900 on the 'cabin2' setup (the pirates, the deckhead man) and the smugglers': every
// bubble of a man on the stage over his head as ui/plaque.js markPlace places it (the intercom's at its speaker, skipped), none over
// another. And ?bench=collar's card read back: the draw calls and the links after the warm held, its verdict printed (F73's eased fog
// mask fails the upload row on every house bench: OPEN, printed, not held here).
// Until test-collar is in data/scenes.js (D's) it prints a note and runs nothing. Fails without the shock band's blind and downFree
// frames drawn, the band prepared behind the cut for every armed man aboard, the crew drawn as they are, or the bubbles over their men.
import { assert, machineK } from './helpers.mjs';
import { withGame, frameMs } from './browser.mjs';
import { SCENES } from '../src/data/scenes.js';

const PORT = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
const LANE = 'play=test-collar&seed=48213&tier=private&holdouts=smugglers&setup=go&nostore=1&perf=1';
const fmt = (o) => JSON.stringify(o);

// (the lane in the page, a tick a frame, to the card (see the header); each frame's reads)
async function playLane(page, { mode = 'keys' } = {}) {
  return page.evaluate(async (mode) => {
    const O = window.__olympus, { collarBot } = await import('/tests/bots/collar.mjs');
    const { gunLook, downFreeOf } = await import('/src/sim/arms/look.js'), { shockFrameOf } = await import('/src/art/figures/poses.js');
    const { dollPaints, dollKeys } = await import('/src/art/doll/dress.js');
    const bot = collarBot({ mode }), frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const goOf = () => O.state.armoury.range.house.goAtMs ?? Infinity, warm = new Set(dollKeys()), paints0 = dollPaints();
    const ev0 = window.__report.view.bands?.evicted ?? 0;
    const out = { frames: 0, men: 0, drawn: {}, off: [], lying: [], late: [], afterLoad: 0, evicted: 0, rifle: null, uploadKb: 0, dt: [], t: 0, splashes: [] };
    O.pause(true);
    let last = performance.now(), ev = ev0;
    for (let n = 0; n < 12000 && !O.state.armoury.range.end; n++) {
      const s = O.state, me = s.actors.list.find(a => a.who === s.player.id);
      if (!s.skip && window.__report?.view?.splash) { const t0 = s.clock.tick; O.pause(false); let w = 0; while (window.__report?.view?.splash && !O.state.skip && w++ < 900) await frame(); O.pause(true); out.splashes.push({ frames: w, ticks: O.state.clock.tick - t0 }); continue; }
      if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {})));
      await frame();
      const now = performance.now(); out.dt.push(now - last); last = now; out.frames++;
      const st = O.state, V = window.__report.view, R = st.armoury.range, live = new Set((R.turners ?? []).filter(t => t.live?.who).map(t => t.live.who));
      // (F168: each man drawn as the map says)
      for (const a of st.actors.list) {
        const f = (V.figures ?? []).find(x => x.id === a.id);
        if (!f || f.remembered) continue;
        const gl = st.people[a.who]?.kit ? gunLook(st, a, st.clock.ms) : null, sf = gl ? shockFrameOf(gl) : null, drawn = f.drawn ?? f.frame;
        let want = null;
        if (sf) want = sf.startsWith('daze') ? /^daze(Kneel)?[01]$/ : new RegExp(`^${sf}$`);
        else if (!gl && live.has(a.who) && downFreeOf(st, a)) want = /^float0$/;
        else if (!gl && live.has(a.who) && a.stance === 'kneel') want = /^handsKneel$/;
        if (want) { out.men++; out.drawn[drawn] = (out.drawn[drawn] ?? 0) + 1; if (!want.test(drawn ?? '') && out.off.length < 6) out.off.push({ tick: st.clock.tick, who: a.who, want: String(want), frame: f.frame, drawn }); }
        if ((drawn === 'hurt' || drawn === 'sit') && out.lying.length < 6) out.lying.push({ tick: st.clock.tick, who: a.who, drawn });
      }
      // (F165: no figure band sent after GO + 1 s; no rifle sheet given to another look after GO; F73's reading)
      const bands = V.bands?.list ?? [], after = st.clock.ms - goOf();
      if (after > 1000 && bands.length) out.late.push({ t: after, bands });
      if (after > 1000) out.uploadKb = Math.max(out.uploadKb, (V.bands?.bytes ?? 0) / 1024);
      if (after > 0 && (V.bands?.evicted ?? 0) > ev) out.evicted += (V.bands.evicted - ev);
      ev = V.bands?.evicted ?? ev;
      out.rifle = V.bands?.rifle ?? out.rifle;
      for (const key of dollKeys()) if (!warm.has(key)) { warm.add(key); out.afterLoad++; }
    }
    out.t = O.state.clock.ms - goOf();
    out.done = !!O.state.armoury.range.end;
    out.end = O.state.armoury.range.house?.boarding?.end?.why ?? null;
    out.painted = dollPaints() - paints0;
    out.dt = out.dt.slice(30).sort((a, b) => a - b);
    return { ...out, p95: out.dt[Math.floor(out.dt.length * 0.95)] ?? 0, med: out.dt[out.dt.length >> 1] ?? 0, dt: null };
  }, mode);
}

export default [
  {
    name: 'ui-collar: "Away the boarding party" in the page from GO to the card by the private\'s keys (48213, the smugglers): every man drawn as the one map says, the shock band\'s frames and the crew\'s never a stand-in and nobody lying or seated at 0 G (F168); no figure band sent after GO + 1 s and no rifle sheet evicted after GO (F165); no page error',
    heavy: true,
    timeoutMs: 900_000,
    async fn() {
      if (!SCENES['test-collar']) { console.log('      (no test-collar in data/scenes.js yet: the boarding lands with D; nothing run)'); return; }
      const k = machineK();
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.house?.boarding, null, { timeout: 90_000 });
        await page.evaluate(() => window.__olympus.pause(true));
        await page.evaluate((n) => new Promise(r => { let i = 0; const f = () => (++i < n ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }), 30);
        const r = await playLane(page);
        const f = await frameMs(page);
        console.log(`      to the card: ${r.done ? `reached (${r.end})` : 'NOT reached'} at GO + ${(r.t / 1000).toFixed(1)} s in ${r.frames} frames (median ${r.med.toFixed(1)} ms, p95 ${r.p95.toFixed(1)}; frameMs ${fmt(f)}, k ${k.toFixed(2)})`);
        console.log(`      the map's man-frames ${r.men}: drawn ${Object.entries(r.drawn).map(([a, b]) => `${a} ${b}`).join(', ') || 'none'}; off the map ${r.off.length}; lying or seated ${r.lying.length}`);
        console.log(`      after GO + 1 s: ${r.late.length} frames sent a figure band${r.late.length ? ` (${fmt(r.late.slice(0, 3))})` : ''}; rifle sheets evicted after GO ${r.evicted}, in use ${fmt(r.rifle)}; dolls after the load ${r.afterLoad} (painted ${r.painted}); F73's reading, the largest upload after GO + 1 s: ${r.uploadKb.toFixed(1)} KB`);
        console.log(`      the splashes played out: ${r.splashes.map(x => `${x.frames} frames, ${x.ticks} ticks lived`).join('; ') || 'none'}`);
        assert(r.done, 'the lane did not reach its card');
        assert(r.men > 0 && (r.drawn.downFree || r.drawn.float0 || r.drawn.handsKneel), fmt(r.drawn));
        assert(!r.off.length && !r.lying.length, fmt({ off: r.off, lying: r.lying }));
        assert(!r.late.length && r.evicted === 0, fmt({ late: r.late.slice(0, 3), evicted: r.evicted }));
        assert(!errors.length, errors.join('\n'));
      }, { port: PORT, query: LANE, viewport: { width: 1280, height: 720 }, timeoutMs: 120_000 });
    },
  },
  {
    name: 'ui-collar: every line a bubble at its speaker (F166, the page\'s half): each bubble of a man on the stage over his head (the intercom\'s at its speaker), none over another, at 1024 × 768 and 1600 × 900 on cabin 2\'s stack, the pirates (the deckhead man) and the smugglers',
    heavy: true,
    timeoutMs: 900_000,
    async fn() {
      if (!SCENES['test-collar']) { console.log('      (no test-collar in data/scenes.js yet: nothing run)'); return; }
      for (const [viewport, holdouts] of [[{ width: 1024, height: 768 }, 'pirates'], [{ width: 1600, height: 900 }, 'smugglers'], [{ width: 1600, height: 900 }, 'pirates']]) {
        await withGame(async (page, errors) => {
          await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.house?.boarding, null, { timeout: 90_000 });
          await page.evaluate(() => window.__olympus.pause(true));
          const seen = await page.evaluate(async () => {
            const O = window.__olympus, { collarBot } = await import('/tests/bots/collar.mjs'), { figureOf } = await import('/src/sim/people/figure.js'), { BUBBLE_ABOVE_PX: above } = await import('/src/ui/plaque.js'), bot = collarBot({ mode: 'T' });
            const out = { bubbles: 0, overHead: 0, offHead: [], overlaps: 0, pa: 0, words: new Set(), frames: 0 };
            const cv = [...document.querySelectorAll('canvas')].reduce((b, c) => (c.width * c.height > b.width * b.height ? c : b));
            O.pause(true);
            for (let n = 0; n < 6000 && !O.state.armoury.range.end; n++) {
              const s = O.state, me = s.actors.list.find(a => a.who === s.player.id);
              if (!s.skip && window.__report?.view?.splash) { O.pause(false); let w = 0; while (window.__report?.view?.splash && !O.state.skip && w++ < 900) await new Promise(r => requestAnimationFrame(r)); O.pause(true); continue; }
              if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {})));
              await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
              out.frames++;
              if (n % 4) continue;
              const V = window.__report.view, cr = cv.getBoundingClientRect(), css = (p) => ({ x: cr.left + p.x * cr.width / V.res[0], y: cr.top + p.y * cr.height / V.res[1], k: cr.width / V.res[0] });
              const rects = [...document.querySelectorAll('.plaque.speaker')].filter(e => !e.hidden).map(e => ({ who: e.dataset.who, r: e.getBoundingClientRect(), words: e.dataset.words }));
              for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
                const a = rects[i].r, b = rects[j].r;
                if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) out.overlaps++;
              }
              for (const x of rects) {
                out.bubbles++; out.words.add(String(x.words).slice(0, 30));
                const H = O.state.armoury.range.house, who = { me: O.state.player.id, two: H?.twoPid, chief: H?.chiefPid }[x.who] ?? x.who;
                const a = O.state.actors.list.find(q => q.who === who);
                if (!a) { out.pa++; continue; }
                // (over his head as plaque.js markPlace places a bubble (see ui-breach): the head 1.8 m over where he stands, on the deckhead the
                // stage's turned card's (his head toward the deck: the bubble's foot within the same slack of where the page draws him))
                const f = figureOf(O.state, a), h = css(O.project(a.x, ((f.posture ?? 'stand') === 'stand' && (f.y ?? 0) > 0.05 ? f.y : 0) + 1.8, a.z)), mid = (x.r.left + x.r.right) / 2;
                const ok = a.onFace === 'deckhead' ? Math.abs(h.x - mid) <= x.r.width + 2 * h.k : Math.abs(h.x - mid) <= x.r.width + 2 * h.k && x.r.bottom <= h.y + 2 * h.k && h.y - x.r.bottom <= (above + 2) * h.k;
                if (ok) out.overHead++; else if (out.offHead.length < 4) out.offHead.push({ who: x.who, words: x.words, r: [x.r.left, x.r.top, x.r.right, x.r.bottom].map(Math.round), head: [Math.round(h.x), Math.round(h.y)] });
              }
            }
            return { ...out, words: [...out.words].slice(0, 12), done: !!O.state.armoury.range.end };
          });
          console.log(`      ${viewport.width} × ${viewport.height}, ${holdouts}: ${seen.frames} frames to the card (${seen.done ? 'reached' : 'NOT reached'}), ${seen.bubbles} bubble-samples, over the speaker's head ${seen.overHead}, off it ${seen.offHead.length}, the intercom's ${seen.pa}, overlaps ${seen.overlaps}; said: ${seen.words.join(' | ')}`);
          assert(seen.done && seen.bubbles > 0 && seen.overHead > 0 && !seen.offHead.length && seen.overlaps === 0, fmt(seen));
          assert(!errors.length, errors.join('\n'));
        }, { port: PORT, query: `play=test-collar&seed=48213&tier=sgt&holdouts=${holdouts}&setup=cabin2&nostore=1&perf=1`, viewport, timeoutMs: 120_000 });
      }
    },
  },
  {
    name: 'ui-collar: ?bench=collar\'s card (the sergeant stacked on cabin 2\'s hatch, the pirates, 48213; T and the shot row every 2 s for 20 s): its draw calls and the links after the warm held, its verdict and F73\'s upload row printed, no page error',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      if (!SCENES['test-collar']) { console.log('      (no test-collar in data/scenes.js yet: nothing run)'); return; }
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__bench && document.querySelector('.glass.bench'), null, { timeout: 180_000 });
        const r = await page.evaluate(() => window.__bench), text = await page.evaluate(() => document.querySelector('.glass.bench .benchtext').value);
        const st = await page.evaluate(() => { const s = window.__olympus.state, H = s?.armoury?.range?.house; return { boarding: !!H?.boarding, men: (s?.armoury?.range?.turners ?? []).filter(t => t.live).length, end: H?.boarding?.end?.why ?? null, bands: window.__report.view.bands?.rifle ?? null }; });
        console.log(`      collar: ${r.frames} frames, median ${r.medianMs} ms, p95 ${r.p95Ms}, max ${r.maxMs}, over 25 ms ${r.over25}; draw calls ${r.drawCallsMax}; the sim's busiest tick ${r.tickMaxMs} ms; UI p95 ${r.uiP95Ms} ms; links after the warm ${r.linksAfterWarm}; the largest upload after GO + 1 s ${r.upload?.kb} KB (${r.upload?.key ?? '-'}, at ${r.upload?.atS ?? '-'} s); the lane ${fmt(st)}`);
        for (const line of text.split('\n').slice(-2)) console.log(`        ${line}`);
        const J = Object.fromEntries((r.judge ?? []).map(j => [j.id, j]));
        console.log(`      the verdict: ${(r.judge ?? []).map(j => `${j.id} ${j.pass ? 'PASS' : 'FAIL'}`).join(', ')} (F73's upload row OPEN: the eased fog mask, every house bench's)`);
        assert(st.boarding && st.men > 0 && J.calls?.pass && J.links?.pass, fmt({ st, judge: r.judge }));
        assert(!errors.length, errors.join('\n'));
      }, { port: PORT, query: 'bench=collar', timeoutMs: 180_000 });
    },
  },
];
