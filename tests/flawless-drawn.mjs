// OLYMPUS tests: the gauges of every lane holding on a drawn house, and of the net and the router (the build sheet v0.0.21 §8 F63 to F68; house lens H8; done lens D2; perf lens P2).
//
// F1 to F59 run on drawn lanes as written, but F15, F21 and F22, whose absolute figures belong to layout A (LANE_MEAN_S 46 and
// KEYS_REF 78.3 on 48213, COMBAT §25.5.1's reference room), and stay the set's, never re-baselined (v0.0.20 §8). Their drawn
// twins hold a drawn lane against the set's own on the same seeds:
//   F63  the tier one's drawn mean at most DRAWN_LANE_K 1.10 × his set mean on the same seeds (the house lens measured 1.03); every
//        drawn lane at most LANE_MAX_S 60 s
//   F64  the keys private's drawn mean within KEYS_TOL 10% of his set mean on the same seeds (69.7 to 73.3 s against 72.5 to 73.0)
//   F65  the stops a lane at p95 at most the lane's own budget, 1 + legs + contacts + closed inner doors + 3 (stopBudgetOf: contacts
//        the lane's stands in #1's sector by where they stand, team.js ownerOf; 14 on layout A: 1 + 4 + 5 + 1 + 3, F13's STOPS_P95)
//   F66  the tier one's room 1 time spread at least ROOM1_SPREAD_MIN_S 1.0 s over the drawn seeds (0.00 on the set, every seed
//        6.70 s; 6.7 to 12.55 s over the house lens's seven drawn layouts)
// And the round's own two:
//   F67  the fumble net's lists empty (tests/house-fumble.test.mjs KNOWN, OPEN, UNCOVERED) and its sweep's lanes meeting 0 cases
//   F68  no tick spending more than ROUTE_NODES_TICK synchronous route nodes (combat/route.js), the fuzz's worst lane under
//        LANE_NODES_MAX 200,000
// And F3 judged on each drawn lane's own area (f3Drawn: flawless.mjs flawlessPaths builds the set's lane for its grid, so a drawn
// lane's paths read the set's walls there, A's finding 4), as flawlessPaths judges the set's. Each row { id, name, met, value,
// target } as flawless.mjs gaugeOf's; DRAWN_ENFORCED names those that fail a suite.
import { flawlessLane, gaugeOf, mean, quantile, s1, s2, LANE_MAX_S, KEYS_TOL } from './flawless.mjs';
import { ownerOf } from '../src/sim/combat/team.js';
import { planSetOf, assembleHouse } from '../src/sim/scenes/assemble.js';
import { leafClosed, openingOf } from '../src/sim/places/model.js';
import { ROUTE_NODES_TICK, ROUTE_CLS } from '../src/sim/combat/route.js';
import { openNavOf, clearLine } from '../src/sim/places/nav.js';
import { standOk } from '../src/sim/places/collide.js';

/** The gauges this file holds, every one enforced (the build sheet §8: F63, F64 and F66 on the heavy sweep, F65, F67 and F68 at once). */
export const DRAWN_ENFORCED = Object.freeze(new Set(['F63', 'F64', 'F65', 'F66', 'F67', 'F68']));
/** F63's bound on the tier one's drawn mean against his set mean on the same seeds; the drawn seeds of the sweep; F66's least spread (s). */
export const DRAWN_LANE_K = 1.10, DRAWN_SEEDS = 100, ROOM1_SPREAD_MIN_S = 1.0;
/** F65's slack over the lane's own stops (the 3 of F13's 14 on layout A). */
export const STOP_SLACK = 3;
/** F68's bound on the fuzz's worst lane (route nodes). */
export const LANE_NODES_MAX = 200_000;
/**
 * F1 to F26 on drawn lanes, v0.0.21 (B's sweeps: drawn seeds 1 to 20, then house-drawn's 1 to 100, by the honest tier one and
 * sergeant and the keys private and recruit, every lane to its card): the rows met on every lane of the 80-lane sweep, enforced by
 * house-drawn-quick (F13, F15, F22 the set's: their twins F65, F63, none; F8 and F11 since the review of A and B: the act-less
 * "That one's his" over the closet's question (cqb.js) was both, 41 no-shoot faults and 1 dead end in 200 lanes, 0 and 0 after),
 * and the rows still open on drawn lanes (the hundred seeds' figures), each a
 * finding of the handoff (.run/v021/b.md), enforced by the heavy house-drawn as on the set: it is the default's gate (the build
 * sheet's ship rule), never loosened.
 */
export const DRAWN_HOLD = Object.freeze(['F1', 'F3', 'F5', 'F7', 'F8', 'F9', 'F11', 'F14', 'F16', 'F17', 'F19', 'F24', 'F26']);
export const DRAWN_OPEN = Object.freeze({
  F2: 'the #2\'s guard held past 0.3 s at once: 146 holds in 112 of 400 lanes, the longest 1.55 s (the sergeant on 10: 1.50 s)',
  F4: 'a game stop in a doorway: 3.15 s in 31 of 400 lanes, the #2 2.50 s, 0.05 to 0.10 s each; #1 at a corner room last north of the hall (seed 3)',
  F6: 'the feet held at the stack by your #2\'s body on a door found open: 161 of 600 rooms, 0.51 s each',
  F10: 'two threats of your sector up together in one room (seed 7), a drawn place\'s swing a few ms over the par (seed 9): 44 in 400 lanes',
  F12: '"Carry on" after a shot row with nobody up: 9 in 200 lanes',
  F25: 'the keys recruit\'s #2 3.05 s from his cue: 4 of 1,200 rooms (seeds 6, 12, 66, 67)',
  F65: 'stops over the lane\'s own budget at p95 by 1 (the worst 15 of 13, seed 9)',
});

/**
 * A lane's own budget of stops (F65): 1 + its legs + its contacts (the stands in #1's sector, by where they stand: team.js ownerOf on
 * each turner) + its inner doors closed at the fill + STOP_SLACK. Read from the state at the fill (before any leg is run).
 */
export function stopBudgetOf(state) {
  const R = state.armoury?.range, H = R?.house, set = planSetOf(state);
  if (!H || !set) return null;
  const legs = set.order?.length ?? H.legs?.length ?? 0, contacts = (R.turners ?? []).filter(T => ownerOf(state, T) === 1).length;
  const inner = Object.values(set.plans ?? {}).flatMap(p => p.inner ?? []).filter(id => { const o = openingOf(id); return !o || leafClosed(state, o); }).length;
  return { legs, contacts, inner, budget: 1 + legs + contacts + inner + STOP_SLACK };
}

/** A lane watched as flawless.mjs flawlessLane's, with its stop budget (stopBudgetOf at its first tick) and its house's code: the record, `.budget` and `.code` ('A' on the set). */
export function drawnLane(o) {
  let budget = null, code = null;
  const more = (game, ctx) => { if (budget === null) { budget = stopBudgetOf(game.state); code = game.state.armoury?.range?.house?.draw?.code ?? 'A'; } o.more?.(game, ctx); };
  const rec = flawlessLane({ ...o, more });
  return { ...rec, budget, code };
}

// (a blocked cell's cost on the nav grid: nav.js's BLOCKED, flawless.mjs's NAV_BLOCKED)
const NAV_BLOCKED = 255;
/**
 * F3 over drawn lanes (drawnLane's records), each on its own house: every authored path and far walk of its plans and every move
 * path the lane saw, leg by leg clear on its area's C0 grid with the doors open; a seen first leg from a body against a wall judged
 * by the walker's own rule and counted apart; as flawless.mjs flawlessPaths does on the set.
 */
export function f3Drawn(recs) {
  const out = { legs: 0, cut: [], wallStart: 0 }, done = new Set();
  for (const r of recs) {
    const A = r.code && r.code !== 'A' ? assembleHouse(r.code) : null;
    if (!A) continue;
    const G = openNavOf(A.area.id, ROUTE_CLS);
    const blocked = (x, z) => { const i = Math.floor((x - G.x0) / G.cellM), j = Math.floor((z - G.z0) / G.cellM); return i < 0 || j < 0 || i >= G.nx || j >= G.nz || G.cost[j * G.nx + i] === NAV_BLOCKED; };
    const check = (what, path, seen) => {
      for (let i = 1; i < path.length; i++) {
        out.legs++;
        const a = path[i - 1], b = path[i];
        if (clearLine(G, a[0], a[1], b[0], b[1])) continue;
        const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.01));
        let walker = false;
        for (let k = 0; k <= n && !walker; k++) walker = !standOk(G, a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n);
        if (seen && i === 1 && blocked(a[0], a[1]) && standOk(G, a[0], a[1]) && !walker) { out.wallStart++; continue; }
        out.cut.push(`${r.code.split('|')[0]} ${what} ${JSON.stringify(a)}→${JSON.stringify(b)}${walker ? ' (the walker too)' : ''}`);
      }
    };
    if (!done.has(A.area.id)) {
      done.add(A.area.id);
      for (const k of A.plans.order) { const P = A.plans.plans[k]; for (const [slot, path] of Object.entries(P.paths ?? {})) check(`${k} paths[${slot}]`, path, false); if (P.far?.path) check(`${k} far`, P.far.path, false); }
    }
    for (const v of r.paths?.values() ?? []) check(`${v.who} ${String(v.step).replace(/>.*$/, '')}`, v.path, true);
  }
  return { id: 'F3', name: 'paths walkable (each drawn lane on its own house)', met: out.legs > 0 && !out.cut.length,
    value: `${out.cut.length} of ${out.legs} legs not clear on their own house's C0 grid (${out.cut.slice(0, 3).join('; ') || 'none'}); first legs from a body against a wall, by the walker ${out.wallStart}`, target: '0' };
}
/** F1 to F26 over drawn lanes: flawless.mjs gaugeOf's rows with F3 judged on each lane's own house, and F13, F15 and F22 left to the set (their drawn twins F65, F63). */
export function drawnGaugeOf(recs) {
  return gaugeOf(recs).filter(r => !['F13', 'F15', 'F22'].includes(r.id)).map(r => (r.id === 'F3' ? f3Drawn(recs) : r));
}

const byKey = (recs) => new Map(recs.map(r => [`${r.tier}|${r.seed}|${r.bot}`, r]));
const laneS = (r) => (Number.isFinite(r?.laneS) ? r.laneS : null);

/** F63 over the tier one's honest lanes, set and drawn on the same seeds. */
export function f63(setRecs, drawnRecs) {
  const S = byKey(setRecs.filter(r => r.tier === 'tierone' && r.bot === 'honest')), D = drawnRecs.filter(r => r.tier === 'tierone' && r.bot === 'honest');
  const pairs = D.map(d => [laneS(S.get(`${d.tier}|${d.seed}|${d.bot}`)), laneS(d)]).filter(([a, b]) => a !== null && b !== null);
  const ms = mean(pairs.map(p => p[0])), md = mean(pairs.map(p => p[1])), k = ms ? md / ms : null, max = Math.max(0, ...D.map(laneS).filter(x => x !== null));
  return { id: 'F63', name: 'the drawn lane time (the tier one)', met: pairs.length > 0 && k !== null && k <= DRAWN_LANE_K && max <= LANE_MAX_S && D.every(r => r.done),
    value: `${pairs.length} seeds: drawn mean ${s1(md)} s against the set's ${s1(ms)} s on the same seeds (× ${k === null ? '-' : k.toFixed(3)}); max ${s1(max)} s; ${D.filter(r => !r.done).length} not to the card`,
    target: `at most × ${DRAWN_LANE_K} the set's mean, every lane at most ${LANE_MAX_S} s` };
}
/** F64 over the keys private's lanes, set and drawn on the same seeds. */
export function f64(setRecs, drawnRecs) {
  const S = byKey(setRecs.filter(r => r.tier === 'private' && r.bot === 'keys')), D = drawnRecs.filter(r => r.tier === 'private' && r.bot === 'keys');
  const pairs = D.map(d => [laneS(S.get(`${d.tier}|${d.seed}|${d.bot}`)), laneS(d)]).filter(([a, b]) => a !== null && b !== null);
  const ms = mean(pairs.map(p => p[0])), md = mean(pairs.map(p => p[1])), dev = ms ? md / ms - 1 : null;
  return { id: 'F64', name: 'no watering down on a drawn house (the keys private)', met: pairs.length > 0 && dev !== null && Math.abs(dev) <= KEYS_TOL && D.every(r => r.done),
    value: `${pairs.length} seeds: drawn mean ${s1(md)} s against the set's ${s1(ms)} s (${dev === null ? '-' : `${dev >= 0 ? '+' : ''}${(dev * 100).toFixed(1)}%`})`, target: `within ${KEYS_TOL * 100}% of the set's on the same seeds` };
}
/** F65 over the tier one's drawn lanes (drawnLane's records, each with its budget). */
export function f65(drawnRecs) {
  const t1 = drawnRecs.filter(r => r.tier === 'tierone' && r.bot === 'honest' && r.budget), over = t1.map(r => r.stops.length - r.budget.budget);
  const p95 = quantile(over, 0.95), worst = t1.reduce((a, r) => (!a || r.stops.length - r.budget.budget > a.stops.length - a.budget.budget ? r : a), null);
  return { id: 'F65', name: 'stops a drawn lane (the tier one), against its own budget', met: t1.length > 0 && p95 !== null && p95 <= 0,
    value: `${t1.length} lanes: stops mean ${s1(mean(t1.map(r => r.stops.length)))}, budgets ${s1(mean(t1.map(r => r.budget.budget)))} (legs ${s1(mean(t1.map(r => r.budget.legs)))}, contacts ${s1(mean(t1.map(r => r.budget.contacts)))}, inner doors ${s1(mean(t1.map(r => r.budget.inner)))}); over the budget at p95 ${p95 ?? '-'}${worst ? `, the worst ${worst.stops.length} of ${worst.budget.budget} (seed ${worst.seed})` : ''}`,
    target: `p95 at most the lane's 1 + legs + contacts + closed inner doors + ${STOP_SLACK}` };
}
/** F66 over the tier one's drawn lanes: room 1's time spread. */
export function f66(drawnRecs) {
  const xs = drawnRecs.filter(r => r.tier === 'tierone' && r.bot === 'honest').map(r => r.legS?.[0]).filter(Number.isFinite);
  const spread = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;
  return { id: 'F66', name: 'room 1 not learnt by heart (the tier one)', met: xs.length > 1 && spread >= ROOM1_SPREAD_MIN_S,
    value: `${xs.length} lanes: room 1 ${s2(xs.length ? Math.min(...xs) : null)} to ${s2(xs.length ? Math.max(...xs) : null)} s (spread ${s2(spread)} s)`, target: `a spread of at least ${ROOM1_SPREAD_MIN_S} s` };
}
/** F67: the net's lists ({ KNOWN, OPEN, UNCOVERED }) and, where a sweep ran, its cases (null: the quick case's, lists only). */
export function f67(lists, sweep = null) {
  const n = (k) => lists[k]?.length ?? 0, empty = n('KNOWN') === 0 && n('OPEN') === 0 && n('UNCOVERED') === 0;
  return { id: 'F67', name: 'the fumble net emptied', met: empty && (!sweep || sweep.cases === 0),
    value: `KNOWN ${n('KNOWN')}, OPEN ${n('OPEN')}, UNCOVERED ${n('UNCOVERED')}${sweep ? `; the sweep's ${sweep.lanes} lanes, ${sweep.cases} cases` : ''}`, target: 'every list empty, 0 cases' };
}
/** F68 over route lanes ({ most, total, bot } each, house-route-budget-more's routeLane). */
export function f68(rows) {
  const most = Math.max(0, ...rows.map(r => r.most)), fuzz = rows.filter(r => (r.bot ?? 'fuzz') === 'fuzz'), worst = Math.max(0, ...fuzz.map(r => r.total));
  return { id: 'F68', name: 'no routing storm', met: rows.length > 0 && most <= ROUTE_NODES_TICK && worst < LANE_NODES_MAX,
    value: `${rows.length} lanes: the most route nodes in a tick ${most}; the fuzz's worst lane ${worst}`, target: `at most ${ROUTE_NODES_TICK} a tick, the fuzz's worst lane under ${LANE_NODES_MAX}` };
}
/** The rows of this file failing. */
export const drawnFailing = (rows) => rows.filter(r => DRAWN_ENFORCED.has(r.id) && !r.met).map(r => `${r.id} ${r.name}: ${r.value}`);
