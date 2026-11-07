// The splash's controller, fed frames (quick): src/ui/hud/splash.js createSplashControl over TIME's timing
// (src/sim/time/splash.js), the build sheet 0.0.4 §5.4's ui-splash. A model of the loop and the outcome
// engine runs beside it as main.js wires them: each frame the engine steps whole game minutes up to the
// target the controller set last frame (a step ends on the minute grid, or at an event's second), and
// the controller hears skip-start, skip-interrupt and skip-end from it as the bus would say them, then
// gets the frame's real seconds, nothing while the pause 'splash' it asks for holds the sim. Frames of
// 4, 16.7 and 33 ms. Held: the 10-minute shower's full splash lasts 4.29 s (TIME §6.2: 0.4 + 2.59 +
// 0.8 + 0.5) within two frames, at every frame length; test-night's 21:55 to 05:30 lasts 7.68 s; the
// shown clock never runs ahead of the sim's and never goes back, and it reaches toMs; the sim's target
// sits on the minute grid and is fromMs through the zoom in; no game time passes from the landing to
// the end of the zoom out; the klaxon at 02:30 in the night stops the lapse, the clock decelerates to
// its exact second and holds through the beat, the plaque says ALARM, the zoom out takes 0.5 s and no
// strip shows; Space (toEnd) snaps the clock to the end over 0.25 s; Backspace (stop) lands through the
// strip with the partial outcome; T on a chunked strip takes another chunk and the splash goes on
// zoomed; the outcome strip's items from an outcome (each need that moved, the look). Prints each
// phase's real seconds, the totals and the clock's ticks.
// The 0.0.6 round's chain (the build sheet 0.0.6 §2.3; the user, 2026-11-06: "the ability to select several
// actions"): brush teeth, shave and wash face behind ONE splash over their 7 minutes; each step's part joins the
// splash's as it begins (the vignette's part follows the chain); Backspace during the shave, the sim's chainStop
// moving the end to the shave's end, decelerates the shown clock to it over DECEL_S (never past the sim, never
// back), and the strip lists the steps in order, the dropped wash face named.
import { assert, near, fmt } from './helpers.mjs';
import * as T from '../src/sim/time/splash.js';
import { createSplashControl, outcomeItems, partAt, plaqueOf, PHASES, chainSteps, STEP_MARKS } from '../src/ui/hud/splash.js';
import { MIN_MS } from '../src/core/clock.js';

const SHOWER_FROM = 23_505_105_700, SHOWER_TO = SHOWER_FROM + 600_000;
// (test-night: taps 21:55 to reveille 05:30, 494.6 game minutes; the klaxon at 02:30:00.091 = 23,532,601,000: the sheet §3)
const NIGHT_FROM = 23_513_725_700, NIGHT_TO = 23_543_401_000, KLAXON = 23_532_601_000;

/**
 * One splash run: the controller and a model of the outcome engine (whole minutes, an event's second
 * ends a step). opts: { fromMs, toMs, frameMs, interruptAt, prio, keyAt: { t, key }, chunkMs }. Returns
 * the timeline: phases' real seconds, the shown clock samples, targets, game time passed while paused.
 */
function run({ fromMs, toMs, frameMs, interruptAt = null, prio = 1, kind = 'alert', keys = [], chunkMs = 0, outcome = { body: null, look: { outfit: 'utilities', wet: true } } }) {
  const ctl = createSplashControl({ timing: T });
  let clock = fromMs, skip = { id: 'k1', fromMs, toMs, engine: 'outcome', chunkMs }, target = fromMs, paused = false, t = 0;
  const start = { id: 'k1', activity: 'shower', kind: 'outcome', engine: 'outcome', fromMs, toMs, spotId: 'f:e1:head-2a:shower-2#1', vignette: 'shower', stoppable: true, chunkMs };
  ctl.start(start, { centre: { x: 58.9, z: 16.6 }, parts: { fromMs, list: [{ part: 'in', toMs: fromMs + 60_000 }, { part: 'water', toMs: fromMs + 240_000 }, { part: 'dress', toMs }] } });
  const phases = {}, shown = [], targets = [];
  let lastPhase = null, pausedGame = 0, stop = false, chunks = 0, maxAhead = 0, back = 0, prevShown = -Infinity;
  for (let n = 0; n < 100_000; n++) {
    // (the loop's frame: the engine's whole steps up to the target, unless the splash holds the pause)
    if (skip && !paused) {
      while (clock < skip.toMs) {
        let t1 = Math.min(skip.toMs, Math.floor(clock / MIN_MS) * MIN_MS + MIN_MS);
        if (interruptAt !== null && interruptAt > clock && interruptAt <= t1) t1 = interruptAt;
        if (stop) { ctl.end({ id: 'k1', toMs: clock, planned: skip.toMs, interrupted: true, by: 'player', outcome }); skip = null; break; }
        if (t1 > target) break;
        clock = t1;
        if (interruptAt !== null && clock === interruptAt) {
          ctl.interrupt({ id: 'k1', atMs: clock, by: 'e7', prio, letter: prio === 1 ? 'A' : prio === 0 ? 'D' : 'O', kind, line: kind === 'reveille' ? 'Reveille. Lights.' : 'Klaxon. 02:30.' });
          ctl.end({ id: 'k1', toMs: clock, planned: skip.toMs, interrupted: true, by: 'e7', outcome });
          skip = null; break;
        }
        if (clock >= skip.toMs) {
          const take = chunkMs > 0 && chunks === 0 && skip.wantChunk;
          if (take) { skip.toMs += chunkMs; chunks++; continue; }
          ctl.end({ id: 'k1', toMs: clock, planned: skip.toMs, interrupted: false, by: null, outcome: { ...outcome, chunk: chunkMs ? { offerMs: 1200 } : null } });
          skip = null; break;
        }
      }
    } else if (paused && skip === null) { /* (no ticks under the splash's pause) */ }
    const before = clock;
    for (const k of keys) if (!k.done && t >= k.t) {
      k.done = true;
      if (k.key === 'Space') ctl.toEnd();
      if (k.key === 'Backspace' && ctl.stop()) stop = true;
      if (k.key === 'T' && ctl.chunkable() && skip) skip.wantChunk = true;
    }
    const f = ctl.frame(frameMs / 1000, { clockMs: clock, skipToMs: skip?.toMs ?? null });
    if (!f) break;
    t += frameMs / 1000;
    if (f.view.phase !== lastPhase) { lastPhase = f.view.phase; phases[lastPhase] = phases[lastPhase] ?? 0; }
    phases[f.view.phase] += frameMs / 1000;
    if (f.target !== null) { target = f.target; targets.push(f.target); }
    if (f.pause && clock !== before) pausedGame += clock - before;
    paused = f.pause;
    maxAhead = Math.max(maxAhead, f.view.shownMs - clock);
    if (f.view.shownMs < prevShown) back++;
    prevShown = f.view.shownMs;
    shown.push({ t, ms: f.view.shownMs, phase: f.view.phase, zoom: f.view.zoom, inkK: f.view.inkK, part: f.view.part, plaque: f.view.interrupt?.plaque ?? null, strip: f.view.outcome ? outcomeItems(f.view.outcome, { chunkOffer: f.view.chunkOffer }).length : 0, chunkOffer: f.view.chunkOffer });
    if (f.done) break;
  }
  return { totalS: t, phases, shown, targets, endClock: clock, pausedGame, maxAhead, back };
}

const fmtPh = (p) => PHASES.filter(k => p[k]).map(k => `${k} ${fmt(p[k], 2)}`).join(', ');

export default [
  {
    name: 'the 10-minute shower\'s full splash lasts 4.29 s (TIME §6.2) within two frames at frames of 4, 16.7 and 33 ms; the target on the minute grid, fromMs through the zoom in; the shown clock never ahead of the sim nor going back; no game time under the strip and the zoom out',
    fn() {
      const want = T.splashPlan({ fromMs: SHOWER_FROM, toMs: SHOWER_TO, engine: 'outcome' });
      console.log(`      the plan: ${want.form}, in ${want.inS} + lapse ${fmt(want.lapseS, 2)} + strip ${want.holdS} + out ${want.outS} = ${fmt(want.totalS, 2)} s`);
      for (const frameMs of [4, 1000 / 60, 33]) {
        const r = run({ fromMs: SHOWER_FROM, toMs: SHOWER_TO, frameMs });
        const offGrid = r.targets.filter(x => x !== SHOWER_TO && x !== SHOWER_FROM && x % MIN_MS !== 0).length;
        const inTargets = r.shown.filter(s => s.phase === 'in').length;
        const minutes = new Set(r.shown.map(s => Math.floor(s.ms / MIN_MS))).size;
        console.log(`      frames of ${fmt(frameMs, 1)} ms: ${fmt(r.totalS, 3)} s (${fmtPh(r.phases)}); the clock showed ${minutes} minutes, ended at +${fmt((r.endClock - SHOWER_FROM) / MIN_MS, 2)} min; ahead of the sim at most ${r.maxAhead} ms; went back ${r.back} times; off-grid targets ${offGrid}; game time under the pause ${r.pausedGame} ms`);
        near(r.totalS, 4.29, 2 * frameMs / 1000 + 0.011, `the shower's splash at ${frameMs} ms frames`);
        assert(r.endClock === SHOWER_TO && r.maxAhead <= 0 && r.back === 0 && offGrid === 0 && r.pausedGame === 0, JSON.stringify({ end: r.endClock, ahead: r.maxAhead, back: r.back, offGrid, paused: r.pausedGame }));
        assert(r.shown.filter(s => s.phase === 'in').every(s => s.ms === SHOWER_FROM) && inTargets > 0, 'the clock moved during the zoom in');
        assert(r.shown.at(-1).zoom === 1 && Math.max(...r.shown.map(s => s.zoom)) === T.SPLASH_ZOOM, `the zoom: ${Math.max(...r.shown.map(s => s.zoom))}`);
        assert(r.shown.some(s => s.part === 'water') && r.shown.some(s => s.part === 'dress'), 'the parts shown');
      }
    },
  },
  {
    name: 'test-night\'s splash: 21:55 to reveille, 494.6 minutes, lasts 7.68 s; the klaxon at 02:30:00.091 stops it at its exact second: the clock decelerates to it and holds through the beat, the plaque ALARM, the zoom out 0.5 s, no strip; reveille on the plan\'s own end: the beat, then the strip (8.28 s)',
    fn() {
      const night = run({ fromMs: NIGHT_FROM, toMs: NIGHT_TO, frameMs: 1000 / 60 });
      const plan = T.splashPlan({ fromMs: NIGHT_FROM, toMs: NIGHT_TO, engine: 'outcome' });
      console.log(`      the night: planned ${fmt(plan.totalS, 2)} s (lapse ${fmt(plan.lapseS, 2)}), ran ${fmt(night.totalS, 3)} s (${fmtPh(night.phases)}); ended at ${night.endClock === NIGHT_TO ? 'reveille' : night.endClock}`);
      near(night.totalS, plan.totalS, 2 / 60 + 0.011, 'the night\'s splash');
      near(plan.totalS, 7.68, 0.01, 'the plan');
      const k = run({ fromMs: NIGHT_FROM, toMs: NIGHT_TO, frameMs: 1000 / 60, interruptAt: KLAXON, prio: 1 });
      const beat = k.shown.filter(s => s.phase === 'beat'), decel = k.shown.filter(s => s.phase === 'decel');
      const vkAt = (KLAXON - NIGHT_FROM) / (NIGHT_TO - NIGHT_FROM);
      console.log(`      the klaxon: ${fmt(k.totalS, 3)} s (${fmtPh(k.phases)}); the sim stopped at ${k.endClock} (${k.endClock === KLAXON ? 'the klaxon\'s second, exactly' : 'NOT the klaxon'}), ${fmt(vkAt * 100, 1)}% into the night; the beat held the clock at ${[...new Set(beat.map(s => s.ms))].join(', ')}; plaque '${beat[0]?.plaque}'; strip items shown ${k.shown.filter(s => s.phase === 'strip').length}`);
      assert(k.endClock === KLAXON && beat.length > 0 && beat.every(s => s.ms === KLAXON && s.plaque === 'ALARM'), JSON.stringify(beat.slice(0, 2)));
      assert(decel.length > 0 && decel.at(-1).ms <= KLAXON && k.back === 0 && k.maxAhead <= 0, 'the deceleration');
      near(k.phases.decel, T.DECEL_S, 2 / 60 + 0.001, 'decel');
      near(k.phases.beat, T.BEAT_S, 2 / 60 + 0.001, 'beat');
      near(k.phases.out, T.SPLASH_OUT_S, 2 / 60 + 0.001, 'out');
      assert(!k.phases.strip && k.pausedGame === 0, `a strip on an interrupt, or game time under the pause: ${JSON.stringify(k.phases)}`);
      const d = run({ fromMs: NIGHT_FROM, toMs: NIGHT_TO, frameMs: 1000 / 60, interruptAt: KLAXON, prio: 0, kind: 'danger' });
      console.log(`      the same at priority 0 (danger): out ${fmt(d.phases.out, 3)} s`);
      near(d.phases.out, T.SPLASH_OUT_D_S, 2 / 60 + 0.001, 'a danger\'s zoom out');
      // (reveille stopping "sleep until reveille" at its own end: no surprise, so the lapse runs to it, the
      // beat, then the strip and the zoom out: the night's outcome shown, the review of v0.0.4)
      const r = run({ fromMs: NIGHT_FROM, toMs: NIGHT_TO, frameMs: 1000 / 60, interruptAt: NIGHT_TO, prio: 2, kind: 'reveille' });
      const rStrip = r.shown.filter(s => s.phase === 'strip'), rBeat = r.shown.filter(s => s.phase === 'beat');
      console.log(`      reveille on the plan's end: ${fmt(r.totalS, 3)} s (${fmtPh(r.phases)}); the beat's plaque '${rBeat[0]?.plaque}', the strip's items ${rStrip[0]?.strip ?? 0}`);
      assert(!r.phases.decel && rBeat.length && rBeat.every(s => s.plaque === 'REVEILLE') && rStrip.length && rStrip.every(s => s.strip > 0) && r.endClock === NIGHT_TO, JSON.stringify(r.phases));
      near(r.totalS, plan.totalS + T.BEAT_S, 2 / 60 + 0.011, 'the night to reveille: the plan and its beat');
    },
  },
  {
    name: 'the controls: Space at 1.5 s snaps the clock to the end over 0.25 s; Backspace at minute 2 lands through the strip with the partial outcome; T near the end of a chunked wait takes another 15 minutes and the lapse runs on over it',
    fn() {
      const sp = run({ fromMs: SHOWER_FROM, toMs: SHOWER_TO, frameMs: 1000 / 60, keys: [{ t: 1.5, key: 'Space' }] });
      console.log(`      Space at 1.5 s: ${fmt(sp.totalS, 3)} s in all (${fmtPh(sp.phases)}), the sim at the end: ${sp.endClock === SHOWER_TO}`);
      assert(sp.endClock === SHOWER_TO && sp.totalS < 1.5 + T.WHIRR_S + 0.8 + 0.5 + 0.1 && sp.back === 0, JSON.stringify({ t: sp.totalS, end: sp.endClock }));
      // (Backspace once the shown clock passes minute 2)
      const plan = T.splashPlan({ fromMs: SHOWER_FROM, toMs: SHOWER_TO, engine: 'outcome' });
      let tAt2 = 0;
      for (let tt = 0; tt < 4; tt += 0.001) if (SHOWER_FROM + T.ease(tt / plan.lapseS) * 600_000 >= SHOWER_FROM + 2 * MIN_MS) { tAt2 = T.SPLASH_IN_S + tt; break; }
      const bs = run({ fromMs: SHOWER_FROM, toMs: SHOWER_TO, frameMs: 1000 / 60, keys: [{ t: tAt2, key: 'Backspace' }] });
      const strip = bs.shown.filter(s => s.phase === 'strip');
      console.log(`      Backspace at ${fmt(tAt2, 2)} s (the clock shown at minute 2): the sim stopped at +${fmt((bs.endClock - SHOWER_FROM) / MIN_MS, 2)} min (the minute the engine had reached, on the grid); ${fmt(bs.totalS, 2)} s in all (${fmtPh(bs.phases)}); the strip showed ${strip[0]?.strip ?? 0} items`);
      assert(bs.endClock > SHOWER_FROM && bs.endClock <= SHOWER_FROM + 3 * MIN_MS && strip.length > 0 && strip[0].strip > 0, JSON.stringify({ end: bs.endClock, strip: strip.length }));
      // (a chunked wait: T before the end takes another chunk)
      const wFrom = SHOWER_FROM, wTo = wFrom + 900_000;
      const w = run({ fromMs: wFrom, toMs: wTo, frameMs: 1000 / 60, chunkMs: 900_000, keys: [{ t: 2.0, key: 'T' }] });
      const offer = w.shown.filter(x => x.chunkOffer).map(x => x.chunkOffer), offerS = offer.length / 60;
      console.log(`      a 15-minute wait with T at 2 s: the sim ended at +${fmt((w.endClock - wFrom) / MIN_MS, 1)} min after ${fmt(w.totalS, 2)} s (${fmtPh(w.phases)}); "carry on (${(offer[0] ?? 0) / MIN_MS} min)" offered ${fmt(offerS, 2)} s on its strip`);
      assert(w.endClock === wTo + 900_000, `the chunk: ended at ${(w.endClock - wFrom) / MIN_MS} min`);
      assert(offer[0] === 900_000 && Math.abs(offerS - T.CHUNK_OFFER_S) < 0.05, JSON.stringify({ offer: offer[0], offerS }));
    },
  },
  {
    name: 'the outcome strip from an outcome: each need that moved before and after (the grime glyph emptying, the drop), the look (wet hair, the towel), "carry on (15 min)"; the parts and the plaques',
    fn() {
      const before = [{ need: 'water', band: 'fine', fill: 4, tone: 'fine' }, { need: 'grime', band: 'filthy', fill: 4, tone: 'warn' }, { need: 'sleep', band: 'fine', fill: 1, tone: 'fine' }];
      const after = [{ need: 'water', band: 'thirsty', fill: 3, tone: 'note' }, { need: 'grime', band: 'clean', fill: 0, tone: 'fine' }, { need: 'sleep', band: 'fine', fill: 1, tone: 'fine' }];
      const items = outcomeItems({ body: { before: { strip: before }, after: { strip: after } }, look: { outfit: 'towel', wet: true } }, { chunkOffer: 900_000 });
      console.log(`      ${items.map(i => (i.kind === 'need' ? `${i.need} ${i.before.fill}→${i.after.fill}` : i.kind === 'look' ? `look ${i.glyph}` : `carry on ${i.min} min`)).join(' · ')}`);
      assert(items.length === 5 && items[0].need === 'water' && items[1].need === 'grime' && items[1].after.fill === 0 && items[2].glyph === 'wet' && items[3].glyph === 'towel' && items[4].min === 15, JSON.stringify(items));
      const parts = { fromMs: 0, list: [{ part: 'in', toMs: 60_000 }, { part: 'water', toMs: 240_000 }, { part: 'dress', toMs: 600_000 }] };
      assert(partAt(parts, 0) === 'in' && partAt(parts, 60_000) === 'water' && partAt(parts, 239_999) === 'water' && partAt(parts, 700_000) === 'dress', 'partAt');
      const plaques = [plaqueOf({ kind: 'alert', letter: 'A' }), plaqueOf({ kind: 'reveille', letter: 'O' }), plaqueOf({ kind: 'body', letter: 'B', band: 'urgent' })];
      console.log(`      plaques: ${plaques.join(', ')}`);
      assert(plaques.join() === 'ALARM,REVEILLE,URGENT', plaques.join());
    },
  },
  {
    name: 'a chain of brush teeth, shave and wash face behind one splash (the user, 2026-11-06: "the ability to select several actions"): each step\'s part joins as it begins; Backspace in the shave decelerates the clock to the shave\'s end over DECEL_S, never past the sim nor back; the strip lists the three in order, wash face dropped',
    fn() {
      const F = SHOWER_FROM, STEPS = [['teeth', 120_000], ['shave', 360_000], ['wash-face', 420_000]], TO = F + 420_000;
      const go = ({ stopAtMin = null, frameMs = 1000 / 60 } = {}) => {
        const ctl = createSplashControl({ timing: T });
        ctl.start({ id: 'k9', activity: 'teeth', kind: 'outcome', engine: 'outcome', fromMs: F, toMs: TO, spotId: 'f:e1:head-2a:sinks-1#1', vignette: 'sink', stoppable: true, chunkMs: 0, chain: { steps: STEPS.map(x => x[0]), n: 3 } },
          { centre: { x: 0, z: 0 }, parts: { fromMs: F, list: [{ part: 'teeth', toMs: F + 120_000 }] } });
        let clock = F, toMs = TO, target = F, paused = false, t = 0, step = 0, stopped = false, prev = -Infinity, back = 0, ahead = 0, decelS = null, ended = false;
        const parts = { teeth: 'teeth', shave: 'shave', 'wash-face': 'face' }, seen = [], keycap = [];
        for (let n = 0; n < 100_000; n++) {
          if (!paused && !ended) {
            while (clock < toMs) {
              const t1 = Math.min(toMs, Math.floor(clock / MIN_MS) * MIN_MS + MIN_MS);
              if (t1 > target) break;
              clock = t1;
              // (a step's end: the next begins, its part joining the splash's: chain.js's 'chain' { phase: 'step' })
              while (step < 2 && clock >= F + STEPS[step][1] && clock < toMs) { step++; ctl.steps({ fromMs: F, list: [{ part: parts[STEPS[step][0]], toMs: F + STEPS[step][1] }] }); }
            }
            if (clock >= toMs) {
              ended = true;
              const chain = STEPS.map(([id, end], i) => (F + end <= toMs ? { id, line: `${id} done.`, fraction: 1, by: 'natural' } : { id, line: null, fraction: 0, by: 'dropped' }));
              ctl.end({ id: 'k9', toMs: clock, planned: toMs, interrupted: false, by: null, outcome: { body: null, look: null, chain } });
            }
          }
          const f = ctl.frame(frameMs / 1000, { clockMs: clock, skipToMs: ended ? null : toMs });
          if (!f) break;
          t += frameMs / 1000;
          if (f.target !== null) target = f.target;
          paused = f.pause;
          // (Backspace once the shown clock passes stopAtMin: the sim's chainStop on its next tick, the 'stop' fact to the splash)
          if (stopAtMin !== null && !stopped && f.view.shownMs >= F + stopAtMin * MIN_MS && ctl.stop()) {
            stopped = true;
            const run = STEPS.find(([, end]) => clock < F + end) ?? STEPS[2];
            toMs = F + run[1];
            ctl.chainStop({ toMs });
            decelS = { at: t, fromMs: f.view.shownMs };
          }
          if (decelS && decelS.done === undefined && f.view.shownMs >= toMs) decelS.done = t - decelS.at;
          if (f.view.shownMs < prev) back++;
          prev = f.view.shownMs; ahead = Math.max(ahead, f.view.shownMs - clock);
          seen.push({ t, ms: f.view.shownMs, part: f.view.part, phase: f.view.phase, chain: f.view.chain, strip: f.view.outcome ? outcomeItems(f.view.outcome).filter(i => i.kind === 'step') : null });
          keycap.push(f.view.chain?.stopped ? 'stops after this step' : f.view.stoppable && (f.view.phase === 'in' || f.view.phase === 'lapse') ? 'Backspace stop after this step' : '');
          if (f.done) break;
        }
        return { t, clock, seen, back, ahead, decelS, keycap };
      };
      const whole = go(), partsAt = (r, min) => r.seen.find(x => x.ms >= F + min * MIN_MS)?.part;
      const strip = whole.seen.find(x => x.strip?.length)?.strip ?? [];
      console.log(`      the whole chain: ${fmt(whole.t, 2)} s of splash, the sim at +${(whole.clock - F) / MIN_MS} min; the part at minutes 1, 4 and 6.5: ${[1, 4, 6.5].map(m => partsAt(whole, m)).join(', ')}; the strip: ${strip.map(i => `${i.mark} ${i.line}`).join(' | ')}`);
      assert(whole.clock === TO && whole.back === 0 && whole.ahead <= 0 && partsAt(whole, 1) === 'teeth' && partsAt(whole, 4) === 'shave' && partsAt(whole, 6.5) === 'face', JSON.stringify({ clock: whole.clock, back: whole.back }));
      assert(strip.length === 3 && strip.every(i => i.mark === STEP_MARKS.whole) && whole.seen[0].chain?.n === 3, JSON.stringify(strip));
      const bs = go({ stopAtMin: 3 });
      const strip2 = bs.seen.find(x => x.strip?.length)?.strip ?? [];
      console.log(`      Backspace at minute 3 (the shave): the end moved to +${(bs.clock - F) / MIN_MS} min, the clock decelerated there in ${fmt(bs.decelS?.done ?? NaN, 3)} s (DECEL_S ${T.DECEL_S}) from +${fmt((bs.decelS.fromMs - F) / MIN_MS, 2)} min; ${fmt(bs.t, 2)} s of splash; the keycap '${bs.keycap.find(Boolean)}' then '${bs.keycap.find(k => k.startsWith('stops'))}'; the strip: ${strip2.map(i => `${i.mark} ${i.line}`).join(' | ')}`);
      assert(bs.clock === F + 360_000 && bs.back === 0 && bs.ahead <= 0, JSON.stringify({ clock: bs.clock, back: bs.back, ahead: bs.ahead }));
      assert(bs.decelS.done !== undefined && bs.decelS.done <= T.DECEL_S + 2 / 60 && bs.decelS.done >= T.DECEL_S - 2 / 60, `the deceleration took ${bs.decelS.done} s`);
      assert(strip2.map(i => i.mark).join('') === `${STEP_MARKS.whole}${STEP_MARKS.whole}${STEP_MARKS.dropped}` && strip2[2].dropped && strip2[2].line === 'wash face: dropped.', JSON.stringify(strip2));
      assert(bs.keycap[0] === 'Backspace stop after this step' && bs.keycap.includes('stops after this step'), JSON.stringify(bs.keycap.slice(0, 3)));
      // (the chain's steps from skip-end's outcome.chain alone, a cut one marked as cut)
      const cs = chainSteps({ chain: [{ id: 'shower', line: 'Water off early.', fraction: 0.4, by: 'interrupt' }, { id: 'dress', line: null, fraction: 0, by: 'dropped' }] });
      assert(cs[0].mark === STEP_MARKS.cut && cs[1].dropped && cs[1].line === 'dress: dropped.', JSON.stringify(cs));
    },
  },
];
