// OLYMPUS places: the validator, PLACES §9.6's rules for an area and for a site plan, as data in, problems out.
//
// "Pathfinding that works 100% of the time" (the user, tradecraft, 2026-10-26) is a test, not a hope,
// and so is every other rule a template must keep. validateArea(area) and validatePlan(plan) return
// { ok, problems: [{ rule, id, msg }], warnings, counts }, so a test prints what each rule checked and
// fails on any problem; each rule is named, and places-validate breaks a sample for every one.
//
// An area (a floor: rooms, openings, fixtures, zones):
//   ids          every id in its kind's grammar (core/ids.js: places, openings, fixtures)
//   unique       no id twice
//   opening      every opening joins two rooms (or a room and 'outside') across an edge they share,
//                within both rooms' extents
//   room-opening every room has at least one opening
//   door-clear   nothing that blocks stands within DOOR_CLEAR_M 0.9 m before an opening, on either side
//   zone         every room lies in exactly one zone, and names it
//   kind         every fixture's kind is in the catalogue
//   overlap      no fixture overlaps another or a wall, at the 1/16 m grid the art draws on (pieces hung
//                on a wall are checked by their centre only)
//   in-room      every fixture lies inside the room it names
//   spawn        the spawn's cell is free for C0
// A site plan (buildings, roads, paths, gates, zones, waypoints, edges):
//   ids, unique  as above (buildings b:, waypoints w:, roads r:, doors and gates o:, zones as places)
//   ring         every building inside its ring (lines, or Main Side's fence, or outside it)
//   apart        buildings MIN_GAP_M 4 m apart or more (my call; a building's own rects may touch)
//   door         every door on its footprint's edge, on its side, with its waypoint 0.5 m outside
//   road         no building (but open structures) on a road's strip
//   gate         every gate on the fence's line
//   edge         every edge between waypoints the graph holds
//   joined       the waypoint graph joined: every waypoint reached from the daily places' origin
//   daily        each daily place (the mess, the armoury window, the aid station, the gym, the field)
//                reached by route from Echo's door; over its warnM (PLACES §4.1's 120 m) a warning
// And from 0.0.3 (the build sheet 0.0.3 §2.1, PLACES §9.6), for a floor:
//   no-seed      no area or room record carries a seed of its own (a fixture's and a floor's look may
//                carry their authored constant: PLACES §9.2), the handcrafted rule of 2026-11-05
//   portal       every portal's band lies on one of its area's openings (a door) or across a link's
//                flight; its arrival stands free for C0 in the other area, PORTAL_CLEAR_M 0.6 m or more
//                inside that area's band back (the hysteresis: a walker never bounces)
//   arrive-face  every portal's arrival faces the way its band is crossed (out 'n' arrives facing up,
//                's' down, 'e' right, 'w' left): one arrives walking on, never turned back to the way
//                one came (from 0.0.5; floors and grounds alike)
//   stair-top    every stairsWell has a link's portal across it, and the portal's firing zone (STEP_M to
//                STEP_M + PORTAL_DEPTH_M past its band) lies wholly on the well's open top (fixtures.js
//                openTopOf, the landing the kit draws): one who steps onto the drawn landing goes down,
//                and nowhere else does (the user, 2026-11-06: "cannot cross the space to head downstairs
//                again, is it intentional ?", from a landing drawn at the well's other end; from 0.0.5)
//   stair-foot   every flight has a link's portal across it, and is entered only at its foot (the user,
//                2026-11-07, of v0.0.5's flights: "we can get on the upwards staircase from the wrong
//                end"; from 0.0.6): its portal's firing zone meets the flight only in its top STAIR_TOP_M
//                (fixtures.js flightFarOf); wherever a walker of any class may stand in that zone, it
//                stands in the flight's lane (flightLaneOf: between its rails, short of its closed end);
//                and a C0 walker stepping on within FLIGHT_FOOT_M of the foot walks the lane's middle
//                straight up into the zone (each class's grid with every door open)
//   link         a link's stops have the same x and z on both floors, a flight on the floor below and a
//                well on the floor above at them, the same face (the stair keeps its place on screen)
//   decor        every decor piece sits on a full-height wall: a run of the north boundary
//   exit-sign    every portal has an exit sign (a sign of make 'exit') within EXIT_SIGN_M 1.5 m of its band
//   seeds        at most SEEDS_PER_KIND 6 authored look seeds per kind in an area (the sheet's §4)
//   heads        a head that names whom it serves meets PLACES §9.6's barracks standard: a toilet (a
//                stall or a urinal), a shower and a basin (three a sink row) per 8
//   berths       a squad bay a unit owns holds BAY_BERTHS 15 berths, each with a locker of its own in the bay, its
//                billets a squad's (each once) and the rest spare
// and for a ground (validateGround): ids, unique; a mass's doors on its edges (door); a door that
// names an opening a reveal DOOR_REVEAL_M deep in its mass, blocked while the opening is closed and
// open while it is open (reveal); portals as a floor's, and a sign of any make within EXIT_SIGN_M of
// each (door-sign: a building's plate on the street side, its exit sign inside); fixtures inside the walked
// ground, out of the masses and out of a door's clear zone (fixture); gates on the fence (gate); at
// most LAMPS_MAX 256 lamps (TECH §9.6's table); seeds as a floor's.
import { isId } from '../../core/ids.js';
import { planOf, wallsOf, wallRect, roomAt, WALL_H_M } from './plan.js';
import { CATALOGUE, footprintOf, blocks, mountOf, openTopOf, flightLaneOf, flightFarOf, FLIGHT_FOOT_M } from './fixtures.js';
import { buildGrid, cellOf, chunkGrid, CHUNK_M, CLASSES } from './nav.js';
import { standOk } from './collide.js';
import { areaOf } from './model.js';
import { pastBand } from './portals.js';
import { STEP_M, PORTAL_DEPTH_M } from './plan.js';
import { DOOR_REVEAL_M } from './ground.js';
import { siteGraph, route, reachable } from './graph.js';
import { DOOR_WAYPOINT_M } from '../../data/places/melas.js';
import { BERTH_ORDER } from '../../data/places/echo.js';

/** An exit sign hangs within this of its portal's band, metres (the sheet's §2.1). */
export const EXIT_SIGN_M = 1.5;
/** Look seeds an area may use per kind (the sheet's §4: SEEDS_PER_KIND). */
export const SEEDS_PER_KIND = 6;
/** A barracks head: one toilet, shower and basin per this many (PLACES §9.6). */
export const HEAD_PER = 8;
/** A squad bay's berths: a squad of 13 and two spare (PLACES §4.4). */
export const BAY_BERTHS = 15;
/** The most lamps an area's table holds (TECH §9.6). */
export const LAMPS_MAX = 256;
/** A portal's arrival lies this far inside the other area from its band back (the sheet's §4; portals.js's). */
export const PORTAL_CLEAR_M = 0.6;

/** No blocking fixture within this of a door, either side (PLACES §9.6). */
export const DOOR_CLEAR_M = 0.9;
/** Buildings of a site plan stand at least this far apart (my call). */
export const MIN_GAP_M = 4;
/** The grid fixtures and walls are compared on (the art's 1/16 m). */
export const ART_GRID_M = 1 / 16;

const snap = (v) => Math.round(v / ART_GRID_M) * ART_GRID_M;
const snapRect = (r) => ({ x0: snap(r.x0), z0: snap(r.z0), x1: snap(r.x1), z1: snap(r.z1) });
const overlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
const inside = (a, b, e = 1e-9) => a.x0 >= b.x0 - e && a.x1 <= b.x1 + e && a.z0 >= b.z0 - e && a.z1 <= b.z1 + e;
const rectOf = (r) => (Array.isArray(r) ? { x0: r[0], z0: r[1], x1: r[2], z1: r[3] } : r);
const near = (a, b, e = 0.01) => Math.abs(a - b) < e;

function collector() {
  const problems = [], warnings = [], counts = {};
  return {
    problems, warnings, counts,
    check(rule, n = 1) { counts[rule] = (counts[rule] ?? 0) + n; },
    fail(rule, id, msg) { problems.push({ rule, id, msg }); },
    warn(rule, id, msg) { warnings.push({ rule, id, msg }); },
    result(extra = {}) { return { ok: problems.length === 0, problems, warnings, counts, ...extra }; },
  };
}
function idCheck(c, kind, id, what) {
  c.check('ids');
  if (!isId(kind, id)) c.fail('ids', id, `${what} '${id}' is not a ${kind} id`);
}
function uniqueCheck(c, list) {
  const seen = new Set();
  for (const id of list) { c.check('unique'); if (seen.has(id)) c.fail('unique', id, `'${id}' is used twice`); seen.add(id); }
}

/** An area's problems by PLACES §9.6's rules (see the header). */
export function validateArea(area) {
  const c = collector(), plan = planOf(area), rooms = new Map(area.rooms.map(r => [r.id, r]));
  // ids
  idCheck(c, 'place', area.id, 'area');
  idCheck(c, 'place', area.site, 'site');
  for (const r of area.rooms) idCheck(c, 'place', r.id, 'room');
  for (const z of area.zones ?? []) idCheck(c, 'place', z.id, 'zone');
  for (const o of area.openings ?? []) idCheck(c, 'opening', o.id, 'opening');
  for (const f of area.fixtures ?? []) idCheck(c, 'fixture', f.id, 'fixture');
  uniqueCheck(c, [area.id, ...area.rooms.map(r => r.id), ...(area.zones ?? []).map(z => z.id), ...(area.openings ?? []).map(o => o.id), ...(area.fixtures ?? []).map(f => f.id)]);
  // openings join two rooms across an edge they share
  for (const o of area.openings ?? []) {
    c.check('opening');
    const rs = o.rooms ?? [];
    if (rs.length !== 2) { c.fail('opening', o.id, `joins ${rs.length} rooms, not two`); continue; }
    const recs = rs.map(id => (id === 'outside' ? 'outside' : rooms.get(id)));
    if (recs.some(r => !r)) { c.fail('opening', o.id, `names a room the area lacks: ${rs.join(', ')}`); continue; }
    // (on axis x: one room's z1 and the other's z0 on the line, the gap within both rooms' x; axis z likewise)
    const lo = (r) => (o.axis === 'x' ? r.rect[1] : r.rect[0]), hi = (r) => (o.axis === 'x' ? r.rect[3] : r.rect[2]);
    const span = (r) => (o.axis === 'x' ? [r.rect[0], r.rect[2]] : [r.rect[1], r.rect[3]]);
    const along = (r) => { const [p, q] = span(r); return o.a >= p - 0.01 && o.b <= q + 0.01; };
    const real = recs.filter(r => r !== 'outside');
    const sides = real.length === 2
      ? (near(hi(real[0]), o.at) && near(lo(real[1]), o.at)) || (near(lo(real[0]), o.at) && near(hi(real[1]), o.at))
      : real.length === 1 && (near(lo(real[0]), o.at) || near(hi(real[0]), o.at));
    const on = (r) => r === 'outside' || along(r);
    if (!recs.every(on) || !sides || !(o.b > o.a)) c.fail('opening', o.id, `is not on an edge ${rs.join(' and ')} share`);
  }
  for (const r of area.rooms) {
    c.check('room-opening');
    if (!(area.openings ?? []).some(o => (o.rooms ?? []).includes(r.id))) c.fail('room-opening', r.id, 'has no opening');
  }
  // fixtures: kinds, then their footprints
  const fx = (area.fixtures ?? []).filter(f => { c.check('kind'); if (!CATALOGUE[f.kind]) { c.fail('kind', f.id, `kind '${f.kind}' is not in the catalogue`); return false; } return true; });
  const floor = fx.filter(f => CATALOGUE[f.kind].mount !== 'wall');
  // nothing blocking within 0.9 m before a door, on either side
  for (const o of area.openings ?? []) {
    const zones = o.axis === 'x' ? [{ x0: o.a, z0: o.at - DOOR_CLEAR_M, x1: o.b, z1: o.at }, { x0: o.a, z0: o.at, x1: o.b, z1: o.at + DOOR_CLEAR_M }]
      : [{ x0: o.at - DOOR_CLEAR_M, z0: o.a, x1: o.at, z1: o.b }, { x0: o.at, z0: o.a, x1: o.at + DOOR_CLEAR_M, z1: o.b }];
    for (const f of floor.filter(blocks)) { c.check('door-clear'); const fp = footprintOf(f); if (zones.some(z => overlap(fp, z))) c.fail('door-clear', f.id, `stands within ${DOOR_CLEAR_M} m of ${o.id}`); }
  }
  // one zone a room
  for (const r of area.rooms) {
    c.check('zone');
    const holders = (area.zones ?? []).filter(z => z.rooms.includes(r.id));
    if (holders.length !== 1) c.fail('zone', r.id, `lies in ${holders.length} zones`);
    else if (r.zone && r.zone !== holders[0].id) c.fail('zone', r.id, `names zone ${r.zone} but lies in ${holders[0].id}`);
  }
  // no overlaps (fixtures with fixtures, fixtures with walls), at the art's grid
  const walls = wallsOf(plan).map(w => snapRect(wallRect(w)));
  const fps = floor.map(f => ({ f, r: snapRect(footprintOf(f)) }));
  for (let i = 0; i < fps.length; i++) {
    for (let k = i + 1; k < fps.length; k++) { c.check('overlap'); if (overlap(fps[i].r, fps[k].r)) c.fail('overlap', fps[i].f.id, `overlaps ${fps[k].f.id}`); }
    for (const w of walls) { c.check('overlap'); if (overlap(fps[i].r, w)) { c.fail('overlap', fps[i].f.id, `overlaps a wall at ${JSON.stringify(w)}`); break; } }
  }
  // fixtures in their rooms
  for (const f of fx) {
    c.check('in-room');
    const room = rooms.get(f.room);
    if (!room) { c.fail('in-room', f.id, `names room '${f.room}', which the area lacks`); continue; }
    const rr = rectOf(room.rect), at = roomAt(plan, f.x, f.z);
    if (CATALOGUE[f.kind].mount === 'wall') { if (!(f.x >= rr.x0 && f.x <= rr.x1 && f.z >= rr.z0 - 0.01 && f.z <= rr.z1 + 0.01)) c.fail('in-room', f.id, `hangs outside ${f.room}`); }
    else if (!inside(snapRect(footprintOf(f)), snapRect(rr)) || at?.id !== f.room) c.fail('in-room', f.id, `is not inside ${f.room}`);
  }
  // the spawn free for the player's class
  c.check('spawn');
  if (area.spawn) {
    const grid = buildGrid(fx.length === (area.fixtures ?? []).length ? area : { ...area, fixtures: fx }, 'C0'), cell = cellOf(grid, area.spawn.x, area.spawn.z);
    if (cell < 0 || grid.cost[cell] === 255) c.fail('spawn', area.id, `the spawn (${area.spawn.x}, ${area.spawn.z}) is not free for C0`);
  }
  // no seed in a place
  for (const rec of [area, ...area.rooms]) { c.check('no-seed'); for (const k of ['seed', 'siteSeed', 'dressSeed']) if (k in rec) c.fail('no-seed', rec.id, `carries a '${k}' (the world is handcrafted: a place holds no seed)`); }
  // portals on their openings and links, arriving clear of the other area's band back
  for (const p of area.portals ?? []) portalRule(c, area, p, fx);
  // a well's open top is where its portal fires
  for (const f of fx.filter(x => x.kind === 'stairsWell')) {
    c.check('stair-top');
    const top = openTopOf(f), across = (area.portals ?? []).filter(p => (area.links ?? []).some(l => l.id === p.via) && bandAcross(p.band, f));
    if (!across.length) { c.fail('stair-top', f.id, 'has no link\'s portal across it'); continue; }
    for (const p of across) { const z = zoneRectOf(p.band); if (!inside(z, top, 0.01)) c.fail('stair-top', f.id, `${p.id} fires at ${JSON.stringify(z)}, not on the well's open top ${JSON.stringify(top)}`); }
  }
  // a flight entered only at its foot
  const known = fx.length === (area.fixtures ?? []).length ? area : { ...area, fixtures: fx };
  const grids = {}, gridOf = (cls) => (grids[cls] ??= buildGrid(known, cls, { closed: () => false }));
  for (const f of fx.filter(x => x.kind === 'stairs')) {
    c.check('stair-foot');
    const across = (area.portals ?? []).filter(p => (area.links ?? []).some(l => l.id === p.via) && bandAcross(p.band, f));
    if (!across.length) { c.fail('stair-foot', f.id, 'has no link\'s portal across it'); continue; }
    for (const p of across) { const why = stairFootProblem(f, zoneRectOf(p.band), gridOf); if (why) c.fail('stair-foot', f.id, `${p.id}: ${why}`); }
  }
  // links aligned through the floors
  for (const l of area.links ?? []) {
    c.check('link');
    const st = l.stops ?? [], [s0, s1] = st;
    if (st.length !== 2 || !near(s0.x, s1.x, 0.001) || !near(s0.z, s1.z, 0.001)) { c.fail('link', l.id, `its stops are not at one x and z: ${JSON.stringify(st)}`); continue; }
    const floorOf = (id) => (id === area.id ? area : areaOf(id)), below = floorOf(s0.area), above = floorOf(s1.area);
    const fl = below?.fixtures?.find(f => f.kind === 'stairs' && near(f.x, s0.x, 0.001) && near(f.z, s0.z, 0.001));
    const wl = above?.fixtures?.find(f => f.kind === 'stairsWell' && near(f.x, s1.x, 0.001) && near(f.z, s1.z, 0.001));
    if (!fl || !wl || fl.face !== wl.face) c.fail('link', l.id, `no flight below and well above at (${s0.x}, ${s0.z}) with one face`);
  }
  // decor on full-height walls (the north boundary)
  const north = wallsOf(plan).filter(w => w.side === 'n' && w.h >= WALL_H_M);
  for (const d of area.look?.decor ?? []) {
    c.check('decor');
    if (!north.some(w => d.x >= w.a - 0.01 && d.x <= w.b + 0.01)) c.fail('decor', d.text ?? d.kind, `at x ${d.x} is on no full-height wall`);
  }
  // an exit sign at every portal
  const signs = fx.filter(f => f.kind === 'sign' && f.make === 'exit');
  for (const p of area.portals ?? []) { c.check('exit-sign'); if (!signs.some(sg => bandDist(p.band, sg.x, sg.z) <= EXIT_SIGN_M)) c.fail('exit-sign', p.id, `has no exit sign within ${EXIT_SIGN_M} m of its band`); }
  seedRule(c, fx);
  // the heads' standard
  for (const r of area.rooms.filter(r => r.kind === 'head' && r.serves)) {
    c.check('heads');
    const inR = fx.filter(f => f.room === r.id), n = (k) => inR.filter(f => f.kind === k).length, need = Math.ceil(r.serves / HEAD_PER);
    const toilets = n('toiletStall') + n('urinal'), showers = n('showerStall'), basins = 3 * n('sinkRow');
    if (toilets < need || showers < need || basins < need) c.fail('heads', r.id, `serves ${r.serves}: ${toilets} toilets, ${showers} showers, ${basins} basins (each at least ${need})`);
  }
  // a squad bay's berths
  const squad = new Set(BERTH_ORDER.filter(Boolean));
  for (const r of area.rooms.filter(r => r.kind === 'squadBay' && r.owner?.unitId)) {
    c.check('berths');
    const racks = fx.filter(f => f.room === r.id && f.berths), berths = racks.flatMap(f => f.berths.map((b, i) => ({ b, locker: f.lockerIds?.[i] ?? null })));
    const billets = berths.map(x => x.b).filter(Boolean), lockers = berths.map(x => x.locker);
    const inRoom = new Set(fx.filter(f => f.room === r.id && f.kind === 'wallLocker').map(f => f.id));
    const bad = [];
    if (berths.length !== BAY_BERTHS) bad.push(`${berths.length} berths, not ${BAY_BERTHS}`);
    if (lockers.some(l => !l || !inRoom.has(l)) || new Set(lockers).size !== lockers.length) bad.push('a berth without a locker of its own in the bay');
    if (new Set(billets).size !== billets.length || billets.some(b => !squad.has(b)) || (billets.length && billets.length !== squad.size)) bad.push(`billets ${billets.join(', ')}`);
    if (bad.length) c.fail('berths', r.id, bad.join('; '));
  }
  return c.result({ counts: { ...c.counts, rooms: area.rooms.length, openings: (area.openings ?? []).length, fixtures: fx.length, zones: (area.zones ?? []).length, portals: (area.portals ?? []).length, links: (area.links ?? []).length, lamps: (area.look?.lamps ?? []).length } });
}

// (the distance from a point to a band's segment)
function bandDist(b, x, z) {
  const [ax, az, bx, bz] = b.axis === 'x' ? [b.a, b.at, b.b, b.at] : [b.at, b.a, b.at, b.b];
  const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)) : 0;
  return Math.sqrt((ax + t * dx - x) ** 2 + (az + t * dz - z) ** 2);
}
// (whether a band runs across a flight or a well: its middle on the flight's line, its line within the flight's length)
function bandAcross(b, f) {
  const fp = footprintOf(f);
  return b.axis === 'x' ? near(f.x, (b.a + b.b) / 2) && b.at >= fp.z0 - 0.01 && b.at <= fp.z1 + 0.01
    : near(f.z, (b.a + b.b) / 2) && b.at >= fp.x0 - 0.01 && b.at <= fp.x1 + 0.01;
}
// (where a band fires: a..b across, STEP_M to STEP_M + PORTAL_DEPTH_M past it on its out side)
function zoneRectOf(b) {
  const s = b.out === 's' || b.out === 'e' ? 1 : -1, p = b.at + s * STEP_M, q = b.at + s * (STEP_M + PORTAL_DEPTH_M);
  const lo = Math.min(p, q), hi = Math.max(p, q);
  return b.axis === 'x' ? { x0: b.a, x1: b.b, z0: lo, z1: hi } : { x0: lo, x1: hi, z0: b.a, z1: b.b };
}
/** The step the stair-foot rule samples a zone and a lane at, metres. */
const STAIR_SAMPLE_M = 0.02;
// (why a flight with this firing zone is entered other than at its foot, or null: see stair-foot in the header)
function stairFootProblem(f, zone, gridOf) {
  const fp = footprintOf(f), top = flightFarOf(f), lane = flightLaneOf(f);
  const on = { x0: Math.max(zone.x0, fp.x0), z0: Math.max(zone.z0, fp.z0), x1: Math.min(zone.x1, fp.x1), z1: Math.min(zone.z1, fp.z1) };
  if (!(on.x1 > on.x0 && on.z1 > on.z0) || !inside(on, top, 0.01)) return `fires at ${JSON.stringify(zone)}, not on the flight's top ${JSON.stringify(top)}`;
  // (no class stands in the zone off the lane)
  const n = (a, b) => Math.max(1, Math.round((b - a) / STAIR_SAMPLE_M));
  for (const cls of Object.keys(CLASSES)) {
    const g = gridOf(cls), nx = n(zone.x0, zone.x1), nz = n(zone.z0, zone.z1);
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = zone.x0 + (zone.x1 - zone.x0) * i / nx, z = zone.z0 + (zone.z1 - zone.z0) * j / nz;
      if (standOk(g, x, z) && !inside({ x0: x, z0: z, x1: x, z1: z }, lane)) return `a ${cls} walker stands in its zone off the lane, at (${x.toFixed(2)}, ${z.toFixed(2)})`;
    }
  }
  // (C0 up the lane's middle, from the first point it stands on near the foot to as deep as it goes toward the top)
  const g = gridOf('C0'), r = CLASSES.C0, alongZ = lane.z1 - lane.z0 >= lane.x1 - lane.x0;
  const lo = alongZ ? lane.z0 : lane.x0, hi = alongZ ? lane.z1 : lane.x1, m = alongZ ? (lane.x0 + lane.x1) / 2 : (lane.z0 + lane.z1) / 2;
  const topHi = alongZ ? top.z1 >= hi - 0.01 : top.x1 >= hi - 0.01, foot = topHi ? lo : hi, end = topHi ? hi - r : lo + r, s = topHi ? 1 : -1;
  const at = (u) => (alongZ ? [m, u] : [u, m]), steps = n(Math.min(foot, end), Math.max(foot, end));
  let first = null;
  for (let k = 0; k <= steps; k++) {
    const u = foot + s * Math.abs(end - foot) * k / steps, [x, z] = at(u), ok = standOk(g, x, z);
    if (first === null) { if (ok) first = u; continue; }
    if (!ok) return `a C0 walker up the lane is stopped at (${x.toFixed(2)}, ${z.toFixed(2)})`;
  }
  if (first === null || Math.abs(first - foot) > FLIGHT_FOOT_M + 1e-9) return `a C0 walker steps onto the lane only ${first === null ? 'nowhere' : `${Math.abs(first - foot).toFixed(2)} m from its foot`}`;
  const [ex, ez] = at(end);
  if (!(ex >= zone.x0 - 1e-9 && ex <= zone.x1 + 1e-9 && ez >= zone.z0 - 1e-9 && ez <= zone.z1 + 1e-9)) return `a C0 walker up the lane stops at (${ex.toFixed(2)}, ${ez.toFixed(2)}), short of its zone ${JSON.stringify(zone)}`;
  return null;
}

/** The face one arrives with through a band crossed toward its out side. */
const FACE_OF_OUT = Object.freeze({ n: 'up', s: 'down', e: 'right', w: 'left' });
// (a scratch state for the grids a check builds: every opening as its template has it)
const scratchState = () => ({ clock: { ms: 0 }, places: { sites: {} } });
// (whether a point stands free for C0 in an area: a floor's grid, a ground's chunk)
function freeIn(area, x, z) {
  if (area.kind === 'ground') { const g = chunkGrid(scratchState(), area, Math.floor(x / CHUNK_M), Math.floor(z / CHUNK_M), 'C0'); return standOk(g, x, z); }
  return standOk(buildGrid(area, 'C0', { closed: () => false }), x, z);
}
function portalRule(c, area, p, fx) {
  c.check('portal');
  const b = p.band, other = areaOf(p.to?.area);
  if (!other) { c.fail('portal', p.id, `leads to '${p.to?.area}', which is no area`); return; }
  // (its band on an opening of its own area, or across a flight of the link it names)
  let on = false;
  if (area.kind === 'ground') on = (area.massing ?? []).some(m => m.doors.some(d => d.opening === p.via && near(d.z, b.at) && near(d.a, b.a) && near(d.b, b.b)));
  else if ((area.openings ?? []).some(o => o.id === p.via)) { const o = area.openings.find(x => x.id === p.via); on = o.axis === b.axis && near(o.at, b.at) && near(o.a, b.a) && near(o.b, b.b); }
  else if ((area.links ?? []).some(l => l.id === p.via)) on = fx.some(f => (f.kind === 'stairs' || f.kind === 'stairsWell') && b.axis === 'x' && near(f.x, (b.a + b.b) / 2, 0.01) && b.at >= footprintOf(f).z0 - 0.01 && b.at <= footprintOf(f).z1 + 0.01);
  if (!on) { c.fail('portal', p.id, `its band ${JSON.stringify(b)} is on none of ${area.id}'s openings or flights`); return; }
  // (its arrival facing on, the way the band is crossed)
  c.check('arrive-face');
  if (p.to.face !== FACE_OF_OUT[b.out]) c.fail('arrive-face', p.id, `arrives facing ${p.to.face}, crossed toward '${b.out}' (facing ${FACE_OF_OUT[b.out]} walks on)`);
  // (its arrival free, and clear of the band back)
  if (!freeIn(other, p.to.x, p.to.z)) c.fail('portal', p.id, `arrives at (${p.to.x}, ${p.to.z}) in ${other.id}, which is not free for C0`);
  const back = (other.portals ?? []).find(q => q.to?.area === area.id && q.via === p.via);
  if (!back) { c.fail('portal', p.id, `has no way back from ${other.id}`); return; }
  const { past } = pastBand(back.band, p.to.x, p.to.z);
  if (!(past <= -PORTAL_CLEAR_M + 1e-9)) c.fail('portal', p.id, `arrives ${(-past).toFixed(2)} m inside ${other.id}'s band back, under ${PORTAL_CLEAR_M} m`);
}
function seedRule(c, fx) {
  const byKind = new Map();
  for (const f of fx) if (f.seed !== undefined) (byKind.get(f.kind) ?? byKind.set(f.kind, new Set()).get(f.kind)).add(f.seed);
  for (const [k, set] of byKind) { c.check('seeds'); if (set.size > SEEDS_PER_KIND) c.fail('seeds', k, `${set.size} look seeds, over ${SEEDS_PER_KIND}`); }
}

/** A ground area's problems (see the header). */
export function validateGround(area) {
  const c = collector(), fx = area.fixtures ?? [];
  idCheck(c, 'place', area.id, 'area');
  for (const m of area.massing) { idCheck(c, 'building', m.id, 'mass'); for (const d of m.doors) idCheck(c, 'opening', d.id, 'door'); }
  for (const f of fx) idCheck(c, 'fixture', f.id, 'fixture');
  for (const g of area.gates) idCheck(c, 'opening', g.id, 'gate');
  uniqueCheck(c, [...area.massing.map(m => m.id), ...area.massing.flatMap(m => m.doors.map(d => d.id)), ...fx.map(f => f.id), ...area.gates.map(g => g.id)]);
  c.check('no-seed');
  for (const k of ['seed', 'siteSeed', 'dressSeed']) if (k in area) c.fail('no-seed', area.id, `carries a '${k}'`);
  // doors on their masses' edges; reveals blocked while closed, open while open
  for (const m of area.massing) for (const d of m.doors) {
    c.check('door');
    const onEdge = m.rects.map(rectOf).some(r => (d.side === 's' ? near(d.z, r.z1) && d.x >= r.x0 && d.x <= r.x1 : d.side === 'n' ? near(d.z, r.z0) && d.x >= r.x0 && d.x <= r.x1
      : d.side === 'w' ? near(d.x, r.x0) && d.z >= r.z0 && d.z <= r.z1 : near(d.x, r.x1) && d.z >= r.z0 && d.z <= r.z1));
    if (!onEdge) c.fail('door', d.id, `is not on ${m.id}'s ${d.side} edge`);
    if (!d.opening) continue;
    c.check('reveal');
    const leaf = area.nav.leaves.find(l => l.id === d.opening && l.kind === 'reveal'), mid = [(d.a + d.b) / 2, d.side === 's' ? d.z - DOOR_REVEAL_M / 2 : d.z + DOOR_REVEAL_M / 2];
    const deep = leaf && near(leaf.rect.z1 - leaf.rect.z0, DOOR_REVEAL_M, 0.001);
    const at = (state) => { const g = chunkGrid(state, area, Math.floor(mid[0] / CHUNK_M), Math.floor(mid[1] / CHUNK_M), 'C0'); const k = cellOf(g, mid[0], mid[1]); return g.cost[k] !== 255; };
    const shut = scratchState(), open = scratchState();
    open.places.sites[area.site] = { template: 'x', openings: { [d.opening]: { state: 'open', atMs: 0 } } };
    if (!deep || at(shut) || !at(open)) c.fail('reveal', d.id, `its reveal is not ${DOOR_REVEAL_M} m deep, blocked shut and free open`);
  }
  for (const p of area.portals ?? []) portalRule(c, area, p, fx);
  // (a ground's portal leads into a building: its sign there is the building's plate, the exit sign hangs inside)
  const plates = fx.filter(f => f.kind === 'sign');
  for (const p of area.portals ?? []) { c.check('door-sign'); if (!plates.some(sg => bandDist(p.band, sg.x, sg.z) <= EXIT_SIGN_M)) c.fail('door-sign', p.id, `has no sign within ${EXIT_SIGN_M} m of its band`); }
  // fixtures: inside the walked ground, out of the masses, clear of the doors
  const W = area.walkM;
  for (const f of fx) {
    c.check('fixture');
    if (mountOf(f)) continue;
    const r = footprintOf(f), inside = r.x0 >= W.x0 && r.x1 <= W.x1 && r.z0 >= W.z0 && r.z1 <= W.z1;
    const inMass = area.massing.some(m => m.rects.some(q => overlap(r, rectOf(q))));
    const atDoor = area.massing.some(m => m.doors.some(d => { const z = d.side === 's' ? { x0: d.x - 0.6, x1: d.x + 0.6, z0: d.z, z1: d.z + DOOR_CLEAR_M } : d.side === 'n' ? { x0: d.x - 0.6, x1: d.x + 0.6, z0: d.z - DOOR_CLEAR_M, z1: d.z } : d.side === 'w' ? { x0: d.x - DOOR_CLEAR_M, x1: d.x, z0: d.z - 0.6, z1: d.z + 0.6 } : { x0: d.x, x1: d.x + DOOR_CLEAR_M, z0: d.z - 0.6, z1: d.z + 0.6 }; return blocks(f) && overlap(r, z); }));
    if (!inside || inMass || atDoor) c.fail('fixture', f.id, !inside ? 'stands outside the walked ground' : inMass ? 'stands in a building' : 'stands in a door\'s clear zone');
  }
  const fr = rectOf(area.fence.rect);
  for (const g of area.gates) { c.check('gate'); const on = ((near(g.x, fr.x0) || near(g.x, fr.x1)) && g.z >= fr.z0 && g.z <= fr.z1) || ((near(g.z, fr.z0) || near(g.z, fr.z1)) && g.x >= fr.x0 && g.x <= fr.x1); if (!on) c.fail('gate', g.id, 'is not on the fence'); }
  c.check('lamps');
  if ((area.look?.lamps ?? []).length > LAMPS_MAX) c.fail('lamps', area.id, `${area.look.lamps.length} lamps, over the table's ${LAMPS_MAX}`);
  seedRule(c, fx);
  return c.result({ counts: { ...c.counts, masses: area.massing.length, doors: area.massing.reduce((n, m) => n + m.doors.length, 0), fixtures: fx.length, lamps: (area.look?.lamps ?? []).length, surfaces: area.surfaces.length, portals: (area.portals ?? []).length, gates: area.gates.length } });
}

// (the distance from a segment to a rect, 0 when they meet)
function segRectDist(a, b, r) {
  const inR = (p) => p[0] >= r.x0 && p[0] <= r.x1 && p[1] >= r.z0 && p[1] <= r.z1;
  if (inR(a) || inR(b)) return 0;
  const corners = [[r.x0, r.z0], [r.x1, r.z0], [r.x1, r.z1], [r.x0, r.z1]];
  const cross = (p, q, s, t) => { const d = (q[0] - p[0]) * (t[1] - s[1]) - (q[1] - p[1]) * (t[0] - s[0]); if (!d) return false; const u = ((s[0] - p[0]) * (t[1] - s[1]) - (s[1] - p[1]) * (t[0] - s[0])) / d, v = ((s[0] - p[0]) * (q[1] - p[1]) - (s[1] - p[1]) * (q[0] - p[0])) / d; return u >= 0 && u <= 1 && v >= 0 && v <= 1; };
  for (let k = 0; k < 4; k++) if (cross(a, b, corners[k], corners[(k + 1) % 4])) return 0;
  const ptSeg = (p, s, t) => { const dx = t[0] - s[0], dz = t[1] - s[1], L = dx * dx + dz * dz, u = L ? Math.max(0, Math.min(1, ((p[0] - s[0]) * dx + (p[1] - s[1]) * dz) / L)) : 0; const ex = s[0] + u * dx - p[0], ez = s[1] + u * dz - p[1]; return Math.sqrt(ex * ex + ez * ez); };
  const ptRect = (p) => { const dx = Math.max(r.x0 - p[0], 0, p[0] - r.x1), dz = Math.max(r.z0 - p[1], 0, p[1] - r.z1); return Math.sqrt(dx * dx + dz * dz); };
  return Math.min(ptRect(a), ptRect(b), ...corners.map(p => ptSeg(p, a, b)));
}
const OUT = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };

/** A site plan's problems by PLACES §9.6's rules (see the header); counts, and the daily places' metres in `daily`. */
export function validatePlan(plan) {
  const c = collector();
  // ids
  idCheck(c, 'place', plan.area, 'ground area');
  for (const b of plan.buildings) { idCheck(c, 'building', b.id, 'building'); for (const d of b.doors) idCheck(c, 'opening', d.id, 'door'); }
  for (const r of [...plan.roads, ...plan.paths]) idCheck(c, 'road', r.id, r.kind);
  for (const g of plan.gates) idCheck(c, 'opening', g.id, 'gate');
  for (const z of plan.zones) idCheck(c, 'place', z.id, 'zone');
  const wpAll = [...plan.waypoints, ...Object.values(plan.interiors ?? {}).flatMap(i => i.waypoints)];
  for (const w of wpAll) idCheck(c, 'waypoint', w.id, 'waypoint');
  uniqueCheck(c, [...plan.buildings.map(b => b.id), ...plan.buildings.flatMap(b => b.doors.map(d => d.id)), ...plan.gates.map(g => g.id),
    ...[...plan.roads, ...plan.paths].map(r => r.id), ...plan.zones.map(z => z.id), ...wpAll.map(w => w.id)]);
  // rings
  const ring = { lines: rectOf(plan.rings.lines), main: rectOf(plan.rings.main) };
  for (const b of plan.buildings) for (const r0 of b.rects) {
    c.check('ring');
    const r = rectOf(r0);
    const ok = b.ring === 'lines' ? inside(r, ring.lines) : b.ring === 'main' ? inside(r, ring.main) && !overlap(r, ring.lines) : b.ring === 'outside' ? !overlap(r, ring.main) : false;
    if (!ok) c.fail('ring', b.id, `does not lie in its ring '${b.ring}'`);
  }
  // apart
  for (let i = 0; i < plan.buildings.length; i++) for (let k = i + 1; k < plan.buildings.length; k++) {
    const A = plan.buildings[i], B = plan.buildings[k];
    for (const a0 of A.rects) for (const b0 of B.rects) {
      c.check('apart');
      const a = rectOf(a0), b = rectOf(b0), gap = Math.max(a.x0 - b.x1, b.x0 - a.x1, a.z0 - b.z1, b.z0 - a.z1);
      if (gap < MIN_GAP_M - 1e-9) c.fail('apart', A.id, `${gap < 0 ? 'overlaps' : `stands ${gap.toFixed(2)} m from`} ${B.id}`);
    }
  }
  // doors on their footprints' edges, each with its waypoint
  const wps = new Map(wpAll.map(w => [w.id, w]));
  for (const b of plan.buildings) for (const d of b.doors) {
    c.check('door');
    const onEdge = b.rects.map(rectOf).some(r => (d.side === 'n' ? near(d.z, r.z0) && d.x >= r.x0 && d.x <= r.x1 : d.side === 's' ? near(d.z, r.z1) && d.x >= r.x0 && d.x <= r.x1
      : d.side === 'w' ? near(d.x, r.x0) && d.z >= r.z0 && d.z <= r.z1 : d.side === 'e' ? near(d.x, r.x1) && d.z >= r.z0 && d.z <= r.z1 : false));
    const w = wps.get(d.waypoint), [nx, nz] = OUT[d.side] ?? [0, 0];
    if (!onEdge) c.fail('door', d.id, `is not on ${b.id}'s ${d.side} edge`);
    else if (!w || w.of !== d.id || !near(w.x, d.x + nx * DOOR_WAYPOINT_M) || !near(w.z, d.z + nz * DOOR_WAYPOINT_M)) c.fail('door', d.id, `has no waypoint ${DOOR_WAYPOINT_M} m outside it`);
  }
  // no building on a road
  for (const rd of plan.roads) for (const b of plan.buildings) {
    if (b.open) continue;
    for (const r0 of b.rects) for (let s = 0; s + 1 < rd.pts.length; s++) {
      c.check('road');
      if (segRectDist(rd.pts[s], rd.pts[s + 1], rectOf(r0)) < rd.widthM / 2 - 1e-9) { c.fail('road', b.id, `stands on ${rd.id}`); break; }
    }
  }
  // gates on the fence
  const f = rectOf(plan.fence.rect);
  for (const g of plan.gates) {
    c.check('gate');
    const on = ((near(g.x, f.x0) || near(g.x, f.x1)) && g.z >= f.z0 && g.z <= f.z1) || ((near(g.z, f.z0) || near(g.z, f.z1)) && g.x >= f.x0 && g.x <= f.x1);
    if (!on) c.fail('gate', g.id, 'is not on the fence');
  }
  // edges between waypoints the graph holds; the graph joined
  for (const e of [...plan.edges, ...Object.values(plan.interiors ?? {}).flatMap(i => i.edges)]) { c.check('edge'); if (!wps.has(e.a) || !wps.has(e.b)) c.fail('edge', `${e.a}>${e.b}`, 'names a waypoint the plan lacks'); }
  let graph = null;
  try { graph = siteGraph(plan); } catch (e) { c.fail('edge', plan.id, e.message); }
  const daily = {};
  if (graph) {
    const from = plan.daily?.from ?? wpAll[0]?.id, seen = reachable(graph, from);
    for (const w of wpAll) { c.check('joined'); if (!seen.has(w.id)) c.fail('joined', w.id, `is not reached from ${from}`); }
    for (const [name, id] of Object.entries(plan.daily?.places ?? {})) {
      c.check('daily');
      const r = route(graph, from, id);
      if (!r) { c.fail('daily', id, `${name} is not reached from ${from}`); continue; }
      daily[name] = { id, lengthM: Math.round(r.lengthM * 10) / 10 };
      if (r.lengthM > plan.daily.warnM) c.warn('daily', id, `${name} is ${r.lengthM.toFixed(1)} m from ${from}, over ${plan.daily.warnM} m`);
    }
  }
  return c.result({ daily, counts: { ...c.counts, buildings: plan.buildings.length, doors: plan.buildings.reduce((n, b) => n + b.doors.length, 0), waypoints: wpAll.length, edges: plan.edges.length + Object.values(plan.interiors ?? {}).reduce((n, i) => n + i.edges.length, 0), roads: plan.roads.length, paths: plan.paths.length, gates: plan.gates.length, zones: plan.zones.length } });
}
