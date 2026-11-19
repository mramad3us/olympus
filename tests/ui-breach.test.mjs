// OLYMPUS tests: ui-breach, "Bang, then go" in the page (the build sheet v0.0.26 §6 C ui-breach; F143, F146, F148 and F149's page
// halves; item 11, K4). Heavy, a browser file.
//
// In the page at 16 px/m on test-breach, seed 48213, the private, the bang and the door held (&breach=bang,held), from the fill (the
// scene's load, the brief's cut: breach-pin's lane) to the lane's card, played a tick a frame by the private's honest player (tests/bots/kit.mjs houseKitBot,
// the G-11 thrown by its row and the keys' walk: breach-pin's lane, both men searched after the room's "Clear!"):
//   - F143: at every frame each role-player drawn (render/view.js's figures, view.stats.figures, not a memory) is drawn as the one
//     map says (tests/breach-look.mjs mapOf, read in the page from the sim's state): dazed exactly while shocked, in the shock band's
//     daze0 or daze1 (dazeKneel on his knee), cowering in cower, and the frame the figures drew is that frame, never a stand-in;
//   - F148: no figure band sent from GO + 1 s (view.stats.bands' list, each frame) and no doll painted after the load but a back or
//     side variant of one warm() painted (art/doll/dress.js dollKeys, the F91 reading of portrait-perf), none of them a daze, a
//     kneeling daze or a cower front on: those are warmed;
//   - F146: a man searched (T.live.searched) shown on the target card in truth with "SEARCHED" and his verdict, and before his
//     search's end never in truth;
//   - no page error, console error or failed request; the frame times printed.
// And F149's page half at 1024 × 768 and 1600 × 900: every bubble of a speaker on the stage over his head as ui/plaque.js markPlace
// places it (the head 1.8 m over where he stands, the catwalk's for the instructor: main.js headHeightOf, whose standing height is
// c-outside.patch's; the head within a bubble's width of its middle, its foot within BUBBLE_ABOVE_PX over it), no two bubbles over each
// other, sampled over the lane.
// Until "Bang, then go" is in data/scenes.js (B's) it prints a note and runs nothing. Fails without the shock band's frames drawn,
// the band prepared behind the cut, the warm set's daze and cower, or the searched card.
import { assert, machineK } from './helpers.mjs';
import { withGame, frameMs } from './browser.mjs';
import { SCENES } from '../src/data/scenes.js';
import { UPLOAD_MID_KB } from '../src/data/bench.js';

const PORT = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
// (breach-pin's private on the bang and the held door from the fill, by B's honest player for his sheet: the G-11 thrown by its row, the
// keys' walk, the room clear and both men searched by the keys after its "Clear!")
const LANE = 'play=test-breach&seed=48213&tier=private&breach=bang,held&nostore=1&perf=1';
const fmt = (o) => JSON.stringify(o);

// (the lane in the page, a tick a frame, to the card (see the header); each frame's reads)
async function playLane(page) {
  return page.evaluate(async () => {
    const O = window.__olympus, { houseKitBot } = await import('/tests/bots/kit.mjs'), { mapOf } = await import('/tests/breach-look.mjs');
    const { dollPaints, dollKeys } = await import('/src/art/doll/dress.js');
    const bot = houseKitBot({ use: 'flash', base: 'keys' }), frame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const frontOf = (key) => key.replace(/,"facing":"(back|left|right)"/, '');
    const s0 = O.state, goOf = () => O.state.armoury.range.house.goAtMs ?? Infinity, warm = new Set(dollKeys()), all = new Set(warm), paints0 = dollPaints();
    const out = { frames: 0, men: 0, shock: {}, off: [], standIn: [], bands: [], late: [], stray: [], afterLoad: 0, searched: [], early: [], cards: 0, dt: [], t: 0, splashes: [] };
    O.pause(true);
    let last = performance.now();
    for (let n = 0; n < 12000 && !O.state.armoury.range.end; n++) {
      const s = O.state, me = s.actors.list.find(a => a.who === s.player.id);
      // (a skip's splash after it ends, the search's among them: played out as the page plays it, the loop let go (the debug pause
      // freezes a splash) and the splash's own pause holding the sim, so the hud comes back as a player sees it; ticks lived meanwhile counted)
      if (!s.skip && window.__report?.view?.splash) { const t0 = s.clock.tick; O.pause(false); let w = 0; while (window.__report?.view?.splash && !O.state.skip && w++ < 900) await frame(); O.pause(true); out.splashes.push({ frames: w, ticks: O.state.clock.tick - t0 }); continue; }
      if (s.skip?.engine === 'ff') { O.step(1); O.sim.ffCheck(s); } else O.step(1, bot(s, me, (me.bot ??= {})));
      await frame();
      const now = performance.now(); out.dt.push(now - last); last = now; out.frames++;
      const st = O.state, V = window.__report.view, R = st.armoury.range;
      // (F143: each live man drawn, as the map says)
      for (const T of (R.turners ?? []).filter(t => t.live?.who)) {
        const a = st.actors.list.find(x => x.who === T.live.who), f = (V.figures ?? []).find(x => x.id === a?.id);
        if (!a || !f || f.remembered) continue;
        out.men++;
        const m = mapOf(st, T, st.clock.ms), drawn = f.drawn ?? f.frame, cls = /^daze(Kneel)?[01]$/.test(drawn ?? '') ? 'dazed' : drawn === 'cower' ? 'cowering' : 'other';
        const want = m.oracle === 'dazed' || m.oracle === 'cowering' ? m.oracle : 'other';
        if (cls === 'dazed' || cls === 'cowering') out.shock[drawn] = (out.shock[drawn] ?? 0) + 1;
        if (cls !== want && out.off.length < 6) out.off.push({ tick: st.clock.tick, key: T.key, want, frame: f.frame, drawn, card: m.frames.pose, word: m.frames.word });
        if (f.frame !== drawn && /^(daze|cower)/.test(f.frame ?? '') && out.standIn.length < 6) out.standIn.push({ tick: st.clock.tick, key: T.key, frame: f.frame, drawn });
        if (T.live.searched) { if (!out.searched.some(x => x.key === T.key)) out.searched.push({ key: T.key, atMs: T.live.searched.atMs - goOf() }); }
      }
      // (F148: no figure band sent after GO + 1 s, no doll painted but a facing of a warm one)
      const bands = V.bands?.list ?? [];
      if (st.clock.ms - goOf() > 1000 && bands.length) out.late.push({ t: st.clock.ms - goOf(), bands });
      for (const key of dollKeys()) if (!all.has(key)) { all.add(key); out.afterLoad++; if (!warm.has(frontOf(key)) || /"pose":"(daze|dazeKneel|cower)"/.test(key) && !/"facing"/.test(key)) out.stray.push(key.slice(0, 160)); }
      // (F146: the card on a searched man in truth with SEARCHED; never in truth before his search's end)
      const hc = document.querySelector('.hitcard');
      if (hc && !hc.hidden) {
        const T = (R.turners ?? []).find(t => t.key === hc.dataset.key && t.live);
        if (T) {
          out.cards++;
          if (T.live.searched && hc.dataset.phase === 'truth' && /SEARCHED/.test(hc.dataset.text ?? '') && !out.searched.find(x => x.key === T.key)?.card) out.searched.find(x => x.key === T.key).card = hc.dataset.text;
          if (!T.live.searched && !R.end && hc.dataset.phase === 'truth' && out.early.length < 4) out.early.push({ tick: st.clock.tick, key: T.key, text: hc.dataset.text });
        }
      }
    }
    out.t = O.state.clock.ms - goOf();
    out.done = !!O.state.armoury.range.end;
    out.painted = dollPaints() - paints0;
    out.dt = out.dt.slice(30).sort((a, b) => a - b);
    return { ...out, p95: out.dt[Math.floor(out.dt.length * 0.95)] ?? 0, med: out.dt[out.dt.length >> 1] ?? 0, dt: null };
  });
}

export default [
  {
    name: 'ui-breach: "Bang, then go" in the page from the fill to the card by the private\'s honest player (48213, the bang, the door held, both men searched): every role-player drawn as the one map says, the daze and the cower from the shock band and never a stand-in (F143); no figure band sent after GO + 1 s and no doll painted but a facing of the warm set (F148); a searched man\'s card in truth with SEARCHED (F146); no page error',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      if (!SCENES['test-breach']) { console.log('      (no test-breach in data/scenes.js yet: "Bang, then go" lands with B; nothing run)'); return; }
      const k = machineK();
      await withGame(async (page, errors) => {
        await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.house?.bangGo, null, { timeout: 90_000 });
        await page.evaluate(() => window.__olympus.pause(true));
        await page.evaluate((n) => new Promise(r => { let i = 0; const f = () => (++i < n ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); }), 30);
        const r = await playLane(page);
        const f = await frameMs(page);
        console.log(`      to the card: ${r.done ? 'reached' : 'NOT reached'} at GO + ${(r.t / 1000).toFixed(1)} s in ${r.frames} frames (median ${r.med.toFixed(1)} ms, p95 ${r.p95.toFixed(1)}; frameMs ${fmt(f)}, k ${k.toFixed(2)})`);
        console.log(`      the role-players drawn ${r.men} man-frames; in the shock ${Object.entries(r.shock).map(([a, b]) => `${a} ${b}`).join(', ') || 'none'}; off the map ${r.off.length}, a shock frame drawn by a stand-in ${r.standIn.length}`);
        console.log(`      after GO + 1 s: ${r.late.length} frames sent a figure band${r.late.length ? ` (${fmt(r.late.slice(0, 3))})` : ''}; dolls after the load ${r.afterLoad} (painted ${r.painted}), outside warm()'s set and its facings ${r.stray.length}`);
        console.log(`      the splashes played out after a skip: ${r.splashes.map(x => `${x.frames} frames, ${x.ticks} ticks lived`).join('; ') || 'none'}`);
        console.log(`      searched: ${r.searched.map(x => `${x.key} at GO + ${(x.atMs / 1000).toFixed(1)} s, the card '${x.card ?? 'NOT SEEN'}'`).join('; ') || 'none'}; a man's card in truth before his search ${r.early.length}; a live man's card on ${r.cards} frames`);
        assert(r.done, 'the lane did not reach its card');
        assert(Object.keys(r.shock).some(x => x.startsWith('daze')), 'no man drawn dazed: the bang\'s window not drawn');
        assert(!r.off.length && !r.standIn.length, fmt({ off: r.off, standIn: r.standIn }));
        assert(!r.late.length && !r.stray.length, fmt({ late: r.late.slice(0, 3), stray: r.stray.slice(0, 3) }));
        assert(r.searched.length > 0 && r.searched.every(x => x.card) && !r.early.length, fmt({ searched: r.searched, early: r.early }));
        assert(!errors.length, errors.join('\n'));
      }, { port: PORT, query: LANE, viewport: { width: 1280, height: 720 }, timeoutMs: 120_000 });
    },
  },
  {
    name: 'ui-breach: every line a bubble at its speaker (F149, the page\'s half): each bubble of a man on the stage over his head, none over another, at 1024 × 768 and 1600 × 900 over the lane',
    heavy: true,
    timeoutMs: 600_000,
    async fn() {
      if (!SCENES['test-breach']) { console.log('      (no test-breach in data/scenes.js yet: nothing run)'); return; }
      for (const viewport of [{ width: 1024, height: 768 }, { width: 1600, height: 900 }]) {
        await withGame(async (page, errors) => {
          await page.waitForFunction(() => window.__ready && !!window.__olympus.state?.armoury?.range?.house?.bangGo, null, { timeout: 90_000 });
          await page.evaluate(() => window.__olympus.pause(true));
          const seen = await page.evaluate(async () => {
            const O = window.__olympus, { houseKitBot } = await import('/tests/bots/kit.mjs'), { figureOf } = await import('/src/sim/people/figure.js'), { BUBBLE_ABOVE_PX: above } = await import('/src/ui/plaque.js'), bot = houseKitBot({ use: 'flash', base: 'keys' });
            const out = { bubbles: 0, overHead: 0, offHead: [], overlaps: 0, words: new Set(), frames: 0 };
            const cv = [...document.querySelectorAll('canvas')].reduce((b, c) => (c.width * c.height > b.width * b.height ? c : b));
            O.pause(true);
            for (let n = 0; n < 12000 && !O.state.armoury.range.end; n++) {
              const s = O.state, me = s.actors.list.find(a => a.who === s.player.id);
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
                // (the bubble's speaker: main.js speakerHud's data-who, 'me', 'two', 'chief' or his pid)
                const H = O.state.armoury.range.house, who = { me: O.state.player.id, two: H?.twoPid, chief: H?.chiefPid }[x.who] ?? x.who;
                const a = O.state.actors.list.find(q => q.who === who);
                if (!a) continue;
                // (over his head as plaque.js markPlace places a bubble: the head's picture (1.8 m over where he stands: the catwalk for the
                // instructor) at most a bubble's width from its middle (its five offsets, 0, ± half and ± a whole width), its foot above
                // the head within BUBBLE_ABOVE_PX, two picture px of slack each way)
                const f = figureOf(O.state, a), h = css(O.project(a.x, ((f.posture ?? 'stand') === 'stand' && (f.y ?? 0) > 0.05 ? f.y : 0) + 1.8, a.z)), mid = (x.r.left + x.r.right) / 2;
                const ok = Math.abs(h.x - mid) <= x.r.width + 2 * h.k && x.r.bottom <= h.y + 2 * h.k && h.y - x.r.bottom <= (above + 2) * h.k;
                if (ok) out.overHead++; else if (out.offHead.length < 4) out.offHead.push({ who: x.who, words: x.words, r: [x.r.left, x.r.top, x.r.right, x.r.bottom].map(Math.round), head: [Math.round(h.x), Math.round(h.y)] });
              }
            }
            return { ...out, words: [...out.words].slice(0, 12), done: !!O.state.armoury.range.end };
          });
          console.log(`      ${viewport.width} × ${viewport.height}: ${seen.frames} frames to the card (${seen.done ? 'reached' : 'NOT reached'}), ${seen.bubbles} bubble-samples, over the speaker's head ${seen.overHead}, off it ${seen.offHead.length}, overlaps ${seen.overlaps}; said: ${seen.words.join(' | ')}`);
          assert(seen.done && seen.bubbles > 0 && seen.overHead > 0 && !seen.offHead.length && seen.overlaps === 0, fmt(seen));
          assert(!errors.length, errors.join('\n'));
        }, { port: PORT, query: LANE, viewport, timeoutMs: 120_000 });
      }
    },
  },
];
