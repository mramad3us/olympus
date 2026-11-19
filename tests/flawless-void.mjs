// OLYMPUS tests: role A's gauges of v0.0.24, the footing, the anchors and the boots (the build sheet v0.0.24 §1 A, §8; the sheet's
// F98 to F102 and F113 read three higher: tests/void-done.mjs F_SHIFT).
//
// A_GAUGES is role A's rows of tests/void-done.mjs VOID_GAUGES (never a second list: a filter by owner), each with the suite that
// enforces it. The lanes F105 reads are here, so void-house's two cases and any later reader (E's acceptance list, the lead's
// quiet run) run the same:
//   coastLane({ tier, seed, mode })   the shoot house's lane under &env=ship-coast (tests/void-world.mjs coastHouse: the house's
//                                     own concrete, no boots) by the house's T player or its keys player (tests/bots/house.mjs
//                                     houseBot), to the card: the metres walked, the pauses, the drill's walking rows offered live
//                                     (each would not move) and struck (by reason), and the ticks of the live lane in which
//                                     neither the panel (a walking row struck with a footing reason) nor the DI's line (the
//                                     instinct's 'anchor' rule) says why the body stands: "silent". AW measured 4.0 m walked and
//                                     every room "passed" at 500 s with nothing said.
//   steelLane({ tier, seed, steel })  house 1 off the range (tests/void-world.mjs voidWorld: every floor the void's plate, 0 G,
//                                     the team in mag boots, locked), played by T as the page sends it (tests/flawless-op.mjs
//                                     opTBot), each turner turned at its own trigger as the house turns it, to every leg clear
//                                     or STEEL_MAX_MS, with the close-quarters watchers (tests/cqb-gauges.mjs: F1 walls, F2
//                                     bodies, F7 corners, F26 swings); steel false is the same operation at the Wheel's 1 G, the
//                                     time the steel lane is printed against.
//   f105(coast, steel, one, { half }) the gauge's row: met when every coast lane has no live walking row that cannot move and no
//                                     silent tick, and every steel lane clears every leg with F1, F2, F7 and F26 held; half
//                                     'coast' or 'steel' judges and prints one half (void-house's two cases), null both.
import { coastHouse, voidWorld } from './void-world.mjs';
import { cqbWorld } from './cqb-world.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { opTBot } from './flawless-op.mjs';
import { watch } from './cqb-gauges.mjs';
import { BODY_GAP_M, s2 } from './flawless.mjs';
import { VOID_GAUGES } from './void-done.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { opOf, opLive, laneLive } from '../src/sim/combat/op.js';
import { turnTo } from '../src/sim/arms/turners.js';

/** Role A's gauges (see the header): VOID_GAUGES' rows whose owner names A. */
export const A_GAUGES = Object.freeze(VOID_GAUGES.filter(r => /(^|, )A(,|$)/.test(r.owner)));
/** The steel lane's longest run (ms): the 1 G operation's 47.9 s on 48213 at the boots' 0.5 m/s walk is well inside it. */
export const STEEL_MAX_MS = 600_000;
/** A struck reason of the footing's (footing.js noFootingWhy). */
export const FOOTING_WHY = /^no footing: /;

// (a row that walks: bundle.js moveStruck's reading)
const walks = (r) => r.kind === 'move' || !!r.walk || (r.kind === 'bundle' && (r.beats ?? []).some(b => b.k === 'move'));

/** The house's lane on a coasting deck (see the header). */
export function coastLane({ tier = 'sgt', seed = 48213, mode = 'T' } = {}) {
  const { g, pid } = coastHouse({ tier, seed });
  const me = () => g.state.actors.list.find(a => a.who === pid);
  let px = me().x, pz = me().z, walkedM = 0, pauses = 0, live = 0, said = 0, silent = 0, liveTicks = 0, movedLast = false, moving = 0;
  const struck = {}, lines = {}, silentAt = [];
  let err = null, R = null;
  try {
    R = runHouse(g, houseBot({ mode }), { maxMs: 700_000, each: (gm) => {
      const st = gm.state, a = me(), on = laneLive(st.armoury?.range), d = Math.hypot(a.x - px, a.z - pz);
      walkedM += d; px = a.x; pz = a.z;
      // (v0.0.24 B: the sheet's criterion, "either moves or strikes every move with its footing reason": a body that moved this
      // tick (free fall's push-off and drift, body/freefall.js) is not standing, nor in the tick after its move ended (it met a
      // face): the DI's line answers the next tick, decisions acting the tick after they are made (TECH's tick order))
      const moved = d > 1e-9 || !!a.push, justMoved = movedLast;
      movedLast = moved;
      if (!on) return;
      liveTicks++;
      if (moved) moving++;
      const ln = instinctNow(st).line;
      if (ln) lines[ln.id] = (lines[ln.id] ?? 0) + 1;
      let says = ln?.id === 'anchor' || moved || justMoved;
      if (st.stop?.mode === 'stop' && st.stop.phase === 'choose') {
        pauses++;
        for (const r of stepsOf(st)) if (walks(r)) { if (r.off) { struck[r.off] = (struck[r.off] ?? 0) + 1; if (FOOTING_WHY.test(r.off)) says = true; } else live++; }
      }
      if (says) said++; else { silent++; if (silentAt.length < 5) silentAt.push(`${Math.round((st.clock.ms - (st.armoury.range.house?.goAtMs ?? 0)) / 100) / 10} s ${ln?.id ?? 'no line'}`); }
    } });
  } catch (e) { err = String(e?.message ?? e).slice(0, 300); }
  const H = g.state.armoury?.range?.house;
  return { tier, seed, mode, done: !!R?.done && !err, ms: R?.ms ?? null, walkedM, pauses, live, struck, said, silent, silentAt, liveTicks, moving, lines, legs: H ? [...(H.rooms ?? []), H.hall].map(L => L?.state ?? null) : [], err };
}

// (each turner turned at its own trigger, as the house turns it: tests/flawless-op.mjs's turnDue, which it does not export)
const legOfStand = (stand) => (stand === 'H' ? 3 : Number(stand?.[0]) - 1);
function turnDue(state) {
  const H = opOf(state), legs = H ? [...H.rooms, H.hall] : [];
  for (const T of H?.turners ?? []) {
    if (T.turnAtMs !== null || T.stoppedAtMs !== null) continue;
    const L = legs[legOfStand(T.stand)], k = T.trigger?.kind, gap = T.trigger?.gapMs ?? 0;
    const from = k === 'door' ? L?.openAtMs ?? null : k === 'zone' ? L?.enteredAtMs ?? null : k === 'go' ? H.goAtMs : null;
    if (Number.isFinite(from)) turnTo(T, from + gap);
  }
}

/** House 1 off the range on the void's steel, or at 1 G with steel false (see the header). */
export function steelLane({ tier = 'sgt', seed = 48213, steel = true, maxMs = STEEL_MAX_MS } = {}) {
  const w = steel ? voidWorld({ tier, seed }) : cqbWorld({ tier, seed, rooms: null }), g = w.g, t0 = g.state.clock.ms;
  const team = { me: w.pid, two: w.twoPid }, W = watch(g, { team, plans: w.plans }, ['walls', 'bodies', 'swings', 'corners']), bot = opTBot({});
  let prev = t0, doneAt = null, err = null;
  g.clearFacts?.();
  try {
    while (g.state.clock.ms - t0 < maxMs) {
      turnDue(g.state);
      g.step(1, bot);
      const st = g.state, now = st.clock.ms;
      W.tick(g, { now, dt: now - prev, on: opLive(st), facts: { house: g.facts('house'), op: g.facts('op'), shot: g.facts('shot') } });
      prev = now;
      g.clearFacts?.();
      const H = opOf(st);
      if (H && [...H.rooms, H.hall].every(L => L.state === 'clear') && doneAt === null) doneAt = now;
      if (doneAt !== null && (!st.stop || now - doneAt >= 2000)) break;
    }
  } catch (e) { err = String(e?.message ?? e).slice(0, 300); }
  const H = opOf(g.state), me = g.state.actors.list.find(a => a.who === w.pid);
  return { tier, seed, steel, boots: w.boots ?? null, done: doneAt !== null && !err, ms: (doneAt ?? g.state.clock.ms) - t0, legs: H ? [...H.rooms, H.hall].map(L => L.state) : [], watch: W.result(), dead: me?.bot?.dead ?? {}, err };
}

/**
 * F105's row (see the header): coast the coastLane records, steel the steelLane records on the void's steel, one the same
 * operations at 1 G (printed against). { id, name, met, value, target }.
 */
export function f105(coast, steel, one = [], { half = null } = {}) {
  const liveMoves = coast.reduce((a, l) => a + l.live, 0), silent = coast.reduce((a, l) => a + l.silent, 0), coastErr = coast.filter(l => l.err);
  const notDone = steel.filter(l => !l.done), wall = steel.reduce((a, l) => a + l.watch.walls.over, 0);
  const gapMin = Math.min(Infinity, ...steel.map(l => l.watch.bodies.minM)), gapUnder = steel.reduce((a, l) => a + l.watch.bodies.underMs, 0);
  const unc = steel.reduce((a, l) => a + l.watch.corners.uncovered, 0), clears = steel.reduce((a, l) => a + l.watch.corners.clears, 0);
  const swing = steel.reduce((a, l) => a + l.watch.swings.me + l.watch.swings.two, 0);
  const byOne = (l) => one.find(o => o.tier === l.tier && o.seed === l.seed) ?? null;
  const coastMet = coast.length > 0 && !coastErr.length && liveMoves === 0 && silent === 0 && coast.every(l => l.done);
  const steelMet = steel.length > 0 && !notDone.length && wall === 0 && gapMin >= BODY_GAP_M && gapUnder === 0 && unc === 0 && clears > 0 && swing === 0;
  const met = half === 'coast' ? coastMet : half === 'steel' ? steelMet : coastMet && steelMet;
  const coastWords = `on ship-coast ${coast.map(l => `${l.mode} ${l.tier} ${l.seed}: ${s2(l.walkedM)} m walked, ${l.pauses} pauses, walking rows live ${l.live}, struck ${JSON.stringify(l.struck)}, ${l.said} of ${l.liveTicks} live ticks said (${l.moving ?? 0} of them moving), ${l.silent} silent${l.silentAt.length ? ` (${l.silentAt.join('; ')})` : ''}, the card at ${s2((l.ms ?? 0) / 1000)} s [${l.legs.join(',')}]${l.err ? ` THREW ${l.err.slice(0, 80)}` : ''}`).join('; ')}`;
  const steelWords = `on the steel copy ${steel.map(l => `${l.tier} ${l.seed}: ${l.done ? 'every leg clear' : `not [${l.legs.join(',')}]`} in ${s2(l.ms / 1000)} s${byOne(l) ? ` against ${s2(byOne(l).ms / 1000)} s at 1 G` : ''}${l.err ? ` THREW ${l.err.slice(0, 80)}` : ''}`).join('; ')}; F1 ${wall} body-ticks over; F2 least ${s2(gapMin)} m, ${s2(gapUnder / 1000)} s under; F7 ${clears} clears, ${unc} hot spots uncovered; F26 ${s2(swing / 1000)} s in a swing`;
  const value = half === 'coast' ? coastWords : half === 'steel' ? steelWords : `${coastWords}; ${steelWords}`;
  return { id: 'F105', name: 'never a silent stall at 0 G; the steel copy cleared by T', met, value, target: 'on ship-coast no walking row live that cannot move and no live tick unsaid; on the steel copy every leg clear by T, F1, F2, F7, F26 held' };
}
