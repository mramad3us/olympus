// OLYMPUS tests: the live lane for the role-players' suites (opfor-brain, opfor-fire): test-shoothouse with stands 2a and 3a made role-players by src/sim/scenarios/opfor.js, run by the house's own hooks once they exist, else by this fixture's (the build sheet v0.0.19 §1: "test against your own stub of another role's module until that role merges").
//
// liveGame(opts) makes the real headless game of test-shoothouse on a seed, a sheet and a setup ('room:2' by default: room 1
// cleared, you and your #2 stacked on room 2's pull door, GO given) with &opfor= (opts.opfor, 'live' by default). Where the house
// already fills and ticks the role-players (shoothouse.js's live hooks, the house role's: R.house.live there at the fill) the game
// is returned as it is (hooked: true). Until then (hooked: false) it is made with the weapons domain's actors layer wrapped, so
// that after the house's own actors (the #2, the instructor) each lived tick on the house course, GO given and the lane not over:
//   1. every hit on a role-player's record (T.hits, which shoothouse.js houseShot writes as for any stand) is handed to opfor.js
//      opforHit, with the shot as its record names it ({ id: shotId, fired, who: you or your #2, atMs }), each tick (opforHit
//      counts a round once, by the shots its record has taken, so a save made between two ticks carries on exactly);
//   2. opfor.js opforTick runs, as the house's actors layer will run it after twoTick (the build sheet §3.3's tick order).
// and fillOpfor is called on the filled game, its people, kits and items the last of the fill as the house's will be. What the
// house role adds and this fixture does not (the 'casualty' lane end, the clear gate's live reasons, houseShot's live branch
// keeping him from the turn-away): the suites that read them say so in a printed note when hooked is false.
// runTo(g, pred, input, max) steps until pred(state); liveOf(g) the house's R.house.live; rp(g, stand) a role-player's record.
//
// spotCheck(state, stand, [x, z], opts) is the role-players' spot rule (v0.0.19's, written in tests/opfor-spots.test.mjs; moved here
// and widened by v0.0.22's stage 0, its build sheet §0 item 17, so opfor-spots and the drawn posts' tests share it): the cell lies in
// the leg's own rect (the plan's first), 0.4 m or more off every wall face (room.js wallClearanceM: a C0 body and a margin), BODY_GAP_M
// + C0 (0.77 m) or more from every path, point and stack point of the plan (the far leg's walk too) and from every other stand, out
// of every hinged leaf's swing (zones.js arcsOf, the body's C0 round it), and seen from the point of a slot within that slot's
// sector (SECTOR_HALF_DEG) with a clear line at the stand's layer and the crouch's (perception.js clearLine: room.js coverageOf's
// rule), the slot that holds it by room.js sectorOf (slot0, when given, the one it must be). Its options: spot (the stand's spot,
// opfor.js spotOf by default: the set's OPFOR_SPOTS[stand]), plan (the room's plan, by default the lane's for the spot's door),
// stands (the other stands, { stand, x, z }, by default the lane's, shoothouse.js standsOf: on the set HOUSE1's). On the set, with
// none given, it is v0.0.19's rule to the line (opfor-spots prints the same).
import { fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { weaponsDomain } from '../src/sim/arms/domain.js';
import { fillOpfor, opforTick, opforHit, spotOf } from '../src/sim/scenarios/opfor.js';
import { standsOf } from '../src/sim/scenarios/shoothouse.js';
import { lanePlanOf, wallClearanceM, sectorOf, SECTOR_HALF_DEG } from '../src/sim/combat/room.js';
import { sightGridOf } from '../src/sim/places/sight.js';
import { clearLine } from '../src/sim/people/perception.js';
import { CLASSES } from '../src/sim/places/nav.js';
import { arcsOf, inZone } from '../src/sim/places/zones.js';
import { BODY_GAP_M } from '../src/sim/combat/bundle.js';

const houseOfS = (s) => (s.armoury?.range?.course === 'house' ? s.armoury.range.house ?? null : null);

// (the weapons domain with the role-players' two hooks after the house's actors (see the header))
function hookedWeapons() {
  const actors = (s, i, b, c) => {
    weaponsDomain.fast.actors(s, i, b, c);
    const R = s.armoury?.range, H = houseOfS(s);
    if (!H?.live || R.end || s.skip || H.goAtMs === null) return;
    // (opforHit counts a round once, by its record's shots taken, so every hit is handed every tick and a save carries on exactly)
    for (const T of R.turners) if (T.live) for (const h of T.hits) opforHit(s, b, T, { id: h.shotId, fired: true, who: h.by === 'two' ? H.twoPid : s.player.id, atMs: h.atMs });
    opforTick(s, b, R, H, s.clock.ms);
  };
  return Object.freeze({ ...weaponsDomain, fast: Object.freeze({ ...weaponsDomain.fast, actors }) });
}

let HOOKED = null;
/** Whether the house fills the role-players itself (its live hooks merged): asked once a process, of a game made with &opfor=live. */
export function houseHooked() { return (HOOKED ??= !!houseOfS(createGame({ scenario: 'test-shoothouse', seed: 1, opfor: 'live' }).state)?.live); }

/**
 * The fixture (see the header): { g, s, R, H, hooked, fill, again } (again: a game made as this one, for a save to be loaded into). opts:
 * { seed, tier, setup, opfor, loadout, strict }, and (v0.0.22 G5) the house's: draw, house, rooms, layout, passed to createGame only when
 * given (tests/game.mjs houseOpts' rules: rooms 'all' or a code alone is drawn), so a fixture made without them is the set's as before.
 */
export function liveGame({ seed = 48213, tier = 'sgt', setup = 'room:2', opfor = 'live', loadout = null, strict = true, draw = null, house = null, rooms = null, layout = null } = {}) {
  const base = { scenario: 'test-shoothouse', seed, tier, setup, strict, ...(loadout ? { loadout } : {}), ...(draw ? { draw } : {}), ...(house ? { house } : {}), ...(rooms ? { rooms } : {}), ...(layout ? { layout } : {}) };
  if (houseHooked()) { const g0 = createGame({ ...base, opfor }), s = g0.state; return { g: g0, s, R: s.armoury.range, H: houseOfS(s), hooked: true, fill: null, again: () => createGame({ ...base, opfor }) }; }
  const domains = { weapons: hookedWeapons() }, g = createGame({ ...base, domains }), s = g.state, H = houseOfS(s);
  const fill = fillOpfor(s, H, opfor);
  return { g, s, R: s.armoury.range, H, hooked: false, fill, again: () => createGame({ ...base, domains }) };
}

/** Step until pred(state) (checked after each tick), at most max ticks; the input a snapshot or a bot. Returns the ticks stepped. */
export function runTo(g, pred, input = {}, max = 2000) {
  let n = 0;
  while (n < max && !pred(g.state)) { g.step(1, input); n++; }
  return n;
}
/** The house's live record. */
export const liveOf = (g) => houseOfS(g.state)?.live ?? null;
/** A role-player's turner record by his stand ('2a' or '3a'). */
export const rp = (g, stand) => g.state.armoury.range.turners.find(T => T.stand === stand && T.live) ?? null;
/** A role-player's actor. */
export const rpActor = (g, stand) => { const T = rp(g, stand); return T ? g.state.actors.list.find(a => a.who === T.live.who) ?? null : null; };

// ---- the spot rule (see the header; v0.0.22: moved from tests/opfor-spots.test.mjs and widened) ----

/** A C0 body's radius, and the gap a spot keeps from every way and stand (BODY_GAP_M + C0). */
export const C0 = CLASSES.C0, GAP = BODY_GAP_M + C0;
const RAD = Math.PI / 180, WALL_M = 0.4;
/** The distance from p to the segment a to b. */
export const segD = (p, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / l2)) : 0; return Math.hypot(p[0] - a[0] - vx * t, p[1] - a[1] - vz * t); };
const ang = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const inRect = (r, x, z) => x >= r[0] && x <= r[2] && z >= r[1] && z <= r[3];

// (the plan's ways: its paths, the far leg's walk, its points and stack points)
function wayM(P, p) {
  let d = Infinity;
  for (const path of [...Object.values(P.paths), ...(P.far ? [P.far.path] : [])]) for (let i = 1; i < path.length; i++) d = Math.min(d, segD(p, path[i - 1], path[i]));
  for (const q of [...P.points, ...P.stack]) d = Math.min(d, Math.hypot(p[0] - q[0], p[1] - q[1]));
  return d;
}
// (the slots whose point sees p within its own sector, at a layer)
function coveredBy(state, P, p, layer) {
  const grid = sightGridOf(state, P.area), out = [];
  P.points.forEach((q, k) => {
    const sec = P.sectors.find(x => x.slot === k + 1);
    if (sec && Math.abs(ang(Math.atan2(p[1] - q[1], p[0] - q[0]) - sec.yawRad)) <= SECTOR_HALF_DEG * RAD && clearLine(grid, q[0], q[1], p[0], p[1], layer)) out.push(k + 1);
  });
  return out;
}
/** The rule (see the header): { ok, why: [..], wall, way, stands, arc, stand, crouch, slot }. */
export function spotCheck(state, stand, p, { slot0 = null, spot = spotOf(state, { stand }), plan = null, stands = null } = {}) {
  const P = plan ?? lanePlanOf(state).plans[spot.door], others = stands ?? standsOf(state), why = [];
  const wall = wallClearanceM(P, p[0], p[1]), way = wayM(P, p);
  const near = Math.min(...others.filter(x => x.stand !== stand).map(x => Math.hypot(p[0] - x.x, p[1] - x.z)));
  const arc = arcsOf(P.area).some(A => [[0, 0], [C0, 0], [-C0, 0], [0, C0], [0, -C0]].some(([dx, dz]) => inZone(A, p[0] + dx, p[1] + dz)));
  const st = coveredBy(state, P, p, 'stand'), cr = coveredBy(state, P, p, 'crouch'), slot = sectorOf(P, p[0], p[1]);
  if (!inRect(P.rects[0], p[0], p[1])) why.push('outside his leg');
  if (wall < WALL_M) why.push(`${fmt(wall, 2)} m off a wall`);
  if (way < GAP) why.push(`${fmt(way, 2)} m off a way`);
  if (near < GAP) why.push(`${fmt(near, 2)} m off a stand`);
  if (arc) why.push('in a leaf\'s swing');
  if (!st.length || !cr.length) why.push('no point sees it in its sector');
  if (slot0 !== null && slot !== slot0) why.push(`its side ${slot}, not ${slot0}`);
  return { ok: !why.length, why, wall, way, stands: near, arc, stand: st, crouch: cr, slot };
}
