// OLYMPUS tests: the close-quarters gauges as a library, the watchers any scene where a team meets a room plan runs (the build sheet v0.0.21 §1 item 23, D8; COMBAT §25.19.8).
//
// Until v0.0.21 the watchers lived inside tests/flawless.mjs flawlessLane, which read the shoot house's record by name, so no
// other scene could run them (the hand-off: 0.0.7e's Wreck, 0.5's decks, the drill off the range, tests/cqb-world.mjs). They
// are moved here, not rewritten: flawlessLane composes them at the places it ran them, so 'house-flawless-quick ›' and
// 'house-flawless-keys ›' print the same lines before and after (tests/cqb-gauges.test.mjs holds the numbers equal), and its
// ENFORCED and every threshold are untouched (the thresholds the watchers read moved with them, the same values, and
// flawless.mjs re-exports each under its name).
//
// Each watcher is `name(game, { team, plans, area }) → { tick(game, ctx), result() }`: team { me, two } (the pids; two null when
// alone), plans (the area's room plans: room.js lanePlanOf), area (the live area by default, read each tick: a drawn house's own).
// tick runs once a tick after the game's step with ctx { now, dt (the clock's step: 0 while time stands still), on (the ticks
// judged: the house's lane from GO to its end, or an operation open), facts (that tick's facts by type, read once by the
// caller) }; result() is the watcher's live record (the same object every call, so a caller may keep it and print it at the end).
// The record the team reads is the operation's (src/sim/combat/op.js opOf: the house's on its lane, state.cqb off the range), so
// the same watcher runs on the lane and off it.
//
//   walls    F1   each body's circle at the walker's C0 against the area's blockers and the leaves closed now: the worst
//                overlap, who, where, in what, from which doing; the body-ticks over WALL_TOL_M; the ticks off the floor
//   bodies   F2   #1 to #2 centre to centre: the least, and the ms under BODY_GAP_M
//   swings   F26  a body in a door's swing still to come (zones.js arcLiveAt) while its leaf moves: ms each, the leaves swung
//   entry    F25  the #2's entry on his cue, room by room: the cue's ms (bundle.js entryGo), his threshold's, out (never in
//                before you left the door), your body standing across his way in
//   corners  F7   the corner faults, and at each room's "Clear!" every hot spot covered and by whom (L.covered: the house's
//                faults and clears by its 'house' facts, an operation's clears by its 'op' facts)
//   pins     F45  your longest walk held by a body (places/move.js PIN_END_MS), as flawless-bodies.mjs bodiesLane reads it
//   lines    F47  a round of either of you whose line passes within MASK_R_M of the other's body (carry.js lineMasked)
import { openNavOf } from '../src/sim/places/nav.js';
import { areaOf, leafClosed } from '../src/sim/places/model.js';
import { planOf, leafRect } from '../src/sim/places/plan.js';
import { pastThreshold } from '../src/sim/combat/room.js';
import { doorNow, entryGo } from '../src/sim/combat/bundle.js';
import { keepClearOf, restClear, arcsOf, arcLiveAt } from '../src/sim/places/zones.js';
import { openingDelta } from '../src/sim/places/model.js';
import { onFloor } from '../src/sim/places/collide.js';
import { opOf } from '../src/sim/combat/op.js';
import { moveNow } from '../src/sim/combat/stepper.js';
import { lineMasked, lineFromOf, MASK_R_M } from '../src/sim/arms/carry.js';
import { turnersOf } from '../src/sim/arms/turners.js';

/** F1's tolerance into a wall (m), F2's least body gap (m), a body under this is still (m/s): flawless.mjs's, moved with their watchers (values unchanged). */
export const WALL_TOL_M = 0.005, BODY_GAP_M = 0.50, STILL_MS = 0.3;

const r3 = (v) => (Number.isFinite(v) ? Math.round(v * 1000) / 1000 : v);
const d2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const actorOf = (st, pid) => (pid ? st.actors.list.find(a => a.who === pid) ?? null : null);
const areaNow = (st, area) => area ?? st.places?.live?.area ?? null;

// (an area's blockers at C0 (doors open) and its doors' leaves, once an area: flawless.mjs geoOf's, moved)
const geos = new Map();
function geoOf(area) {
  let geo = geos.get(area);
  if (geo) return geo;
  const G = openNavOf(area, 'C0'), plan = planOf(areaOf(area));
  geo = { G, R: G.radiusM, rects: G.blockers, doors: plan.openings.filter(o => o.kind === 'door').map(o => ({ o, r: leafRect(o) })) };
  geos.set(area, geo);
  return geo;
}
// (how far a body's circle at (x, z) runs into a rect: radius less the distance, + when overlapping)
function into(r, x, z, R) {
  const dx = x < r.x0 ? r.x0 - x : x > r.x1 ? x - r.x1 : 0, dz = z < r.z0 ? r.z0 - z : z > r.z1 ? z - r.z1 : 0;
  let d = Math.hypot(dx, dz);
  if (d === 0) d = -Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z);
  return R - d;
}
/** A body's deepest overlap in an area with its walls, fixtures and the leaves closed at ms (m, 0 when clear), what it is in, and the area's C0 grid (G): flawless.mjs overlapOf's, moved. */
export function overlapOfArea(state, area, x, z, ms = state.clock.ms) {
  const { G, R, rects, doors } = geoOf(area);
  let worst = 0, what = null;
  for (const r of rects) { const k = into(r, x, z, R); if (k > worst) { worst = k; what = 'wall'; } }
  for (const D of doors) { if (!leafClosed(state, D.o, ms)) continue; const k = into(D.r, x, z, R); if (k > worst) { worst = k; what = `leaf ${D.o.id}`; } }
  return { m: worst, what, G };
}

/** F1: the bodies against the walls and the closed leaves (see the header). */
export function walls(game, { team, area = null } = {}) {
  const rec = { worstM: 0, who: null, at: null, src: null, what: null, over: 0, offFloor: 0 };
  return {
    tick(g, { now, on }) {
      if (!on) return;
      const st = g.state, A = areaNow(st, area), S = st.stop, W = opOf(st)?.two;
      for (const [who, a, d] of [['#1', actorOf(st, team.me), S?.doing], ['#2', actorOf(st, team.two), W?.doing]]) {
        if (!a) continue;
        const o = overlapOfArea(st, A, a.x, a.z, now);
        if (o.m > WALL_TOL_M) rec.over++;
        if (!onFloor(o.G, a.x, a.z)) rec.offFloor++;
        if (o.m > rec.worstM) {
          const mv = d?.beats?.find(b => b.st === 'run' && b.k === 'move');
          Object.assign(rec, { worstM: r3(o.m), who, at: [r3(a.x), r3(a.z)], what: o.what, src: d ? `${d.step}${mv ? `/${mv.key}` : ''}` : who === '#1' ? 'keys' : 'idle' });
        }
      }
    },
    result: () => rec,
  };
}

/** F2: #1 to #2, the least and the ms under BODY_GAP_M (see the header). */
export function bodies(game, { team } = {}) {
  const rec = { minM: Infinity, underMs: 0 };
  return {
    tick(g, { dt, on }) {
      if (!on) return;
      const st = g.state, me = actorOf(st, team.me), two = actorOf(st, team.two);
      if (!me || !two) return;
      const m = d2(me.x, me.z, two.x, two.z);
      if (m < rec.minM) rec.minM = m;
      if (m < BODY_GAP_M) rec.underMs += Math.max(dt, 0);
    },
    result: () => rec,
  };
}

/** F26: nobody in a door's swing while its leaf moves (see the header). */
export function swings(game, { team, area = null } = {}) {
  const rec = { me: 0, two: 0, what: [], swings: 0 };
  return {
    tick(g, { now, dt, on }) {
      if (!on || !(dt > 0)) return;
      const st = g.state, arcs = arcsOf(areaNow(st, area)), go = opOf(st)?.goAtMs ?? 0;
      for (const Z of arcs) { const d = openingDelta(st, Z.door); if (d?.atMs !== undefined && d.atMs > now && !(rec.seen ??= {})[`${Z.door}@${d.atMs}`]) { rec.seen[`${Z.door}@${d.atMs}`] = true; rec.swings++; } }
      for (const [who, a] of [['me', actorOf(st, team.me)], ['two', actorOf(st, team.two)]]) {
        if (!a) continue;
        const Z = arcs.find(A => arcLiveAt(st, A, a.x, a.z, now));
        if (!Z) continue;
        rec[who] += dt;
        if (rec.what.length < 4) rec.what.push(`${who} in ${Z.door}'s swing at (${r3(a.x)}, ${r3(a.z)}), ${now - (go ?? 0)} ms`);
      }
    },
    result: () => rec,
  };
}

/** F25: the #2's entry on his cue, room by room (see the header): { [door]: { cueMs, inMs, out, blockMs } }. */
export function entry(game, { team } = {}) {
  const rec = {};
  return {
    tick(g, { now, dt, on }) {
      const st = g.state, me = actorOf(st, team.me), two = actorOf(st, team.two);
      if (!on || !me || !two) return;
      const here = doorNow(st, team.me), P = here?.plan;
      if (P?.door && here.door !== 'hall') {
        const E = (rec[here.door] ??= { cueMs: null, inMs: null, out: false, blockMs: 0 });
        if (E.cueMs === null && entryGo(st, P, me, now, here.rec)) E.cueMs = now;
        if (E.inMs === null && pastThreshold(P, two.x, two.z)) E.inMs = now;
        // (#1 standing across the #2's way in while he is cued and not in: the player's own choice, printed for the fuzz)
        if (E.cueMs !== null && E.inMs === null && dt > 0 && Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) < STILL_MS && !restClear(keepClearOf(st, team.me), me.x, me.z)) E.blockMs += dt;
      }
      for (const [door, E] of Object.entries(rec)) if (door !== here?.door && E.cueMs !== null && E.inMs === null) E.out = true;
    },
    result: () => rec,
  };
}

/** F7: the corner faults, the clears and the hot spots covered at each (see the header). */
export function corners(game, { plans } = {}) {
  const rec = { faults: 0, clears: 0, uncovered: 0, by: {} };
  const clear = (st, room) => {
    const H = opOf(st), legs = H ? [...(H.rooms ?? []), ...(H.hall ? [H.hall] : [])] : [], L = legs.find(V => V.room === room), P = L ? plans.plans[L.door] : null;
    rec.clears++;
    for (const h of P?.hot ?? []) { const by = L.covered?.[h.id]?.by ?? 'none'; rec.by[by] = (rec.by[by] ?? 0) + 1; if (by === 'none') rec.uncovered++; }
  };
  return {
    tick(g, { facts }) {
      const st = g.state;
      for (const f of facts.house ?? []) {
        if (f.phase === 'fault' && f.kind === 'corner') rec.faults++;
        if (f.phase === 'clear') clear(st, f.room);
      }
      for (const f of facts.op ?? []) if (f.phase === 'clear') clear(st, f.room);
    },
    result: () => rec,
  };
}

/** F45: your longest walk held by a body (ms; bodiesLane's measure). */
export function pins(game, { team } = {}) {
  const rec = { held: 0, holds: 0 };
  let last = null;
  return {
    tick(g, { on }) {
      if (!on) return;
      const mv = moveNow(g.state, team.me);
      if (mv?.held) { rec.held = Math.max(rec.held, mv.held); if (last !== mv) { rec.holds++; last = mv; } }
    },
    result: () => rec,
  };
}

/** F47: a round of either of you through the other (bodiesLane's measure): { shots, masked: [what] }. */
export function lines(game, { team } = {}) {
  const rec = { shots: 0, masked: [] };
  return {
    tick(g, { now, facts }) {
      const st = g.state;
      for (const f of facts.shot ?? []) {
        if (!f.fired || !f.target || (f.who !== team.me && f.who !== team.two)) continue;
        const T = turnersOf(st).find(t => t.key === f.target), shooter = actorOf(st, f.who), other = actorOf(st, f.who === team.me ? team.two : team.me);
        if (!T || !shooter || !other) continue;
        rec.shots++;
        const to = { x: T.x, y: T.y ?? 1.35, z: T.z };
        if (lineMasked(lineFromOf(st, f.who, shooter, to), to, [{ x: other.x, z: other.z, stance: other.stance ?? 'stand' }])) rec.masked.push(`${f.who === team.me ? 'you' : 'he'} on ${T.stand} at ${now - (opOf(st)?.goAtMs ?? 0)} ms`);
      }
    },
    result: () => rec,
  };
}

/** The watchers by name. */
export const WATCHERS = Object.freeze({ walls, bodies, swings, entry, corners, pins, lines });
/** The fact types the watchers read (a caller reads them once a tick). */
export const FACT_TYPES = Object.freeze(['house', 'op', 'shot']);

/**
 * The watchers named (all by default) on one game: { tick(game, ctx), result() → { [name]: record } }; ctx as each watcher's,
 * its facts read here once a tick where the caller gives none.
 */
export function watch(game, opts, names = Object.keys(WATCHERS)) {
  const ws = Object.fromEntries(names.map(n => [n, WATCHERS[n](game, opts)]));
  return {
    tick(g, ctx) { const facts = ctx.facts ?? Object.fromEntries(FACT_TYPES.map(t => [t, g.facts(t)])); for (const w of Object.values(ws)) w.tick(g, { ...ctx, facts }); },
    result: () => Object.fromEntries(Object.entries(ws).map(([n, w]) => [n, w.result()])),
  };
}
