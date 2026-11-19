// OLYMPUS tests: the void's beats run by hand on the Wreck, for B's suites (zerocqb-hatch, zerocqb-two, zerocqb-middle; the build sheet v0.0.25 §1 B, §6 B).
//
// The lane on the Wreck is C's scenario (test-zerocqb); B's suites hold the body and the beats under it on A's bare Wreck
// (tests/wreck-world.mjs wreckWorld and atTrunk: the team booted round deck 5's scuttle, the trunk open), with an operation opened on
// the area (combat/op.js openOp: your #2 its team, so his record, state.cqb.two, is the drill's as on the lane) and each beat doing
// run as the drill's engine runs it (combat/stepper.js advanceBeats, a tick at a time after the world's), your #2's own doing as his
// slot's runner advances it, his 0 G tick
// (combat/two.js voidTick) and his boots (twoBoots) called each tick as his tick calls them. voidDoing(s, pid, keys) is a doing of the
// void's beats by their ids (drills/void.js through bundle.js beatDefOf), timed as bundle.js planBundle times them; holdPlan(s) the
// hold's plan as the lane's plan set has it (src/data/places/wreck-plans.js) with its rooms' rects (room.js derive's `rects`), which
// bundle.js entryGo and inPlanRooms read. Plain data on the actors and the state, so a save carries every piece.
import { wreckWorld, atTrunk, actorOfPid } from './wreck-world.mjs';
import { openOp } from '../src/sim/combat/op.js';
import { advanceBeats } from '../src/sim/combat/stepper.js';
import { beatDefOf, throughMsOf } from '../src/sim/combat/bundle.js';
import { voidTick, twoBoots } from '../src/sim/combat/two.js';
import { UNDOG_MS, OPEN_HATCH_MS, COAMING_MS, faceMsOf } from '../src/sim/combat/drills/void.js';
import { bootsLocked } from '../src/sim/body/footing.js';
import { areaOf } from '../src/sim/places/model.js';
import { WRECK, WRECK_TRUNK } from '../src/data/places/wreck.js';
import { WRECK_PLANS } from '../src/data/places/wreck-plans.js';
import { openingOf } from '../src/sim/places/model.js';
import { releaseTime } from '../src/core/clock.js';

export const TRUNK = WRECK_TRUNK.id;
/** A plan of the lane's set with what room.js derive adds that the drill reads (its rects and its plane, the side `into`; see the header). */
export function planData(key) {
  const P = WRECK_PLANS.plans[key], A = areaOf(WRECK.id), o = P.door ? openingOf(P.door) : null;
  const line = o ? { axis: o.axis, at: o.at, a: o.a, b: o.b } : P.gate, t = line.axis === 'x' ? P.threshold[1] : P.threshold[0];
  return { ...P, id: key, rects: P.parts.map(id => A.rooms.find(r => r.id === id).rect), plane: { ...line, into: t >= line.at ? 1 : -1 } };
}
/** The hold's plan (see planData). */
export const holdPlan = () => planData(TRUNK);
/** The Wreck with the pair at the trunk and an operation open on it (see the header): wreckWorld's record and { H } (state.cqb). */
export function wreckOp({ seed = 48213, tier = 'sgt', two = true, open = true } = {}) {
  const w = atTrunk(wreckWorld({ seed, tier, two }), { open });
  // (the house's GO left you in stop motion with time held: out of it, the clock running, as the lane's own flow runs it)
  w.s.stop = null; releaseTime(w.s, 'stop');
  const H = openOp(w.s, { area: WRECK.id, team: two ? { two: w.twoPid } : null });
  // (his post where he stands, as the drill's own placing keeps it (bundle.js placeAt): the people layer never walks him off)
  const keep = () => { const a = w.two(), p = w.twoPid ? w.s.people[w.twoPid]?.post : null; if (a && p) { p.x = a.x; p.z = a.z; } };
  keep();
  return { ...w, H, keep };
}
/** A doing of the void's beats by id for pid (see the header). */
export function voidDoing(s, pid, keys, { slot = 1, rung = 0 } = {}) {
  const ms = { undog: UNDOG_MS, lift: OPEN_HATCH_MS, brace: 0, hatch: throughMsOf(s, pid), plant: faceMsOf(false), let: 800, onface: faceMsOf(bootsLocked(s, pid)), coaming: COAMING_MS };
  const more = { undog: { how: 'undog' }, lift: { how: 'hatch' }, plant: { to: 'deckhead' }, onface: { to: 'deck' } };
  const beats = keys.map(key => {
    const D = beatDefOf(key);
    return { key, k: D.k, ch: D.ch, after: (D.after ?? []).filter(x => keys.includes(x.split('@')[0])), cut: !!D.cut, hatch: TRUNK, plan: TRUNK, slot, ms: ms[key], ...(more[key] ?? {}), st: 'wait', fromMs: null, untilMs: null };
  });
  return { who: pid, step: `test:${keys.join('+')}`, kind: 'bundle', rung, slot, beats, lanes: {}, subs: [], fromMs: s.clock.ms, atMs: s.clock.ms, untilMs: s.clock.ms };
}
/** The doings advanced at the clock (their first beats started), then n ticks of the world, each followed by the doings, your #2's 0 G tick and boots, and each(i). */
export function runFor(w, doings, n, each = null) {
  const s = w.s, adv = () => { for (const d of doings) if (d && !d.over) { const r = advanceBeats(s, w.g.bus, d, s.clock.ms); if (r !== 'running') d.over = r; } };
  adv();
  for (let i = 0; i < n; i++) {
    w.g.step(1);
    adv();
    // (his own doing advanced as his slot's runner advances it (bundle.js runSlot), then his 0 G tick and his boots, as his tick calls them)
    const W = w.H?.two;
    if (W?.doing?.beats) { const r = advanceBeats(s, w.g.bus, W.doing, s.clock.ms); if (r !== 'running') W.doing = null; }
    if (W?.pid) { voidTick(s, w.g.bus, w.H, s.clock.ms); twoBoots(s, w.g.bus, w.H, s.clock.ms); }
    w.keep?.();
    each?.(i);
  }
}
export { actorOfPid };
