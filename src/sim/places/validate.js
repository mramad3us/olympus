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
import { isId } from '../../core/ids.js';
import { planOf, wallsOf, wallRect, roomAt } from './plan.js';
import { CATALOGUE, footprintOf, blocks } from './fixtures.js';
import { buildGrid, cellOf } from './nav.js';
import { siteGraph, route, reachable } from './graph.js';
import { DOOR_WAYPOINT_M } from '../../data/places/melas.js';

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
  return c.result({ counts: { ...c.counts, rooms: area.rooms.length, openings: (area.openings ?? []).length, fixtures: fx.length, zones: (area.zones ?? []).length } });
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
