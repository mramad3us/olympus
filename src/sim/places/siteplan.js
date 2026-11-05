// OLYMPUS places: a site plan built from its tables, Base Melas's two plans (PLACES §1.9, §4.1, §4.2).
//
// src/data/places/melas.js holds Base Melas as PLACES §4.2 writes it, frozen literals (TECH §2.4):
// the buildings with their doors, the zones, the roads and walks, the gates, the muster marks, the
// links across paved ground and Echo's interior route. buildSitePlan(tables, moves) derives the rest,
// the way 0.0.2's builder did inside the data module (moved here after the review, TECH §2.4: data
// holds no logic; the MELAS_PLAN golden unchanged):
//   - each building moved by moves ([{ id, from, to }], MELAS_COMPACTION) shifted with its doors, its
//     zones (a zone's `of`) and the marks on them;
//   - a waypoint DOOR_WAYPOINT_M 0.5 m outside every door, the canopy's point, the muster marks and
//     the gates;
//   - from each, a spur of slab path (SPUR_W_M 2 m) straight out of its side to the first road or walk
//     it meets (rayHit), or to the junction its door names, and a junction there;
//   - a node at every gate on a road, every line's corners and ends, and where two lines cross
//     (crossAt), so each road and walk is cut into straight edges between consecutive nodes (a closed
//     line, the perimeter road, joined back to its start), with the links and Echo's interior;
//   - junction ids from their coordinates, w:j:<x>-<z> ('m' for minus, 'p' for a decimal point);
//     coordinates rounded to the centimetre (r2), never a length authored.
// MELAS_PLAN_AS_WRITTEN (melas@0, read only by the walk test) and MELAS_PLAN (melas@1, the game's:
// MELAS_COMPACTION applied) are built once, at load, and frozen. Pure.
import { MELAS_TABLES, MELAS_COMPACTION } from '../../data/places/melas.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
const r2 = (v) => { const r = Math.round(v * 100) / 100; return r === 0 ? 0 : r; };

const NORMAL = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const coord = (v) => { const a = Math.abs(r2(v)); return (v < 0 && a ? 'm' : '') + String(a).replace('.', 'p'); };
const junctionId = (x, z) => `w:j:${coord(x)}-${coord(z)}`;
const shiftRect = (r, dx, dz) => [r2(r[0] + dx), r2(r[1] + dz), r2(r[2] + dx), r2(r[3] + dz)];
const short = (id) => id.slice(2);
const same = (a, b) => Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;

// (where a ray from p along d first crosses a segment a–b not parallel to it: the distance, or Infinity)
function rayHit(p, d, a, b) {
  const ex = b[0] - a[0], ez = b[1] - a[1], den = d[0] * ez - d[1] * ex;
  if (Math.abs(den) < 1e-12) return Infinity;
  const wx = a[0] - p[0], wz = a[1] - p[1];
  const t = (wx * ez - wz * ex) / den, u = (wx * d[1] - wz * d[0]) / den;
  return t > 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 ? t : Infinity;
}
// (where two segments cross, or null; a touch at an end counts)
function crossAt(a, b, c, d) {
  const rx = b[0] - a[0], rz = b[1] - a[1], sx = d[0] - c[0], sz = d[1] - c[1], den = rx * sz - rz * sx;
  if (Math.abs(den) < 1e-12) return null;
  const t = ((c[0] - a[0]) * sz - (c[1] - a[1]) * sx) / den, u = ((c[0] - a[0]) * rz - (c[1] - a[1]) * rx) / den;
  return t >= -1e-9 && t <= 1 + 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 ? [r2(a[0] + t * rx), r2(a[1] + t * rz)] : null;
}
// (the arc position of a point along a polyline, if it lies on it within 1 cm, else null)
function along(pts, p) {
  let s = 0;
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], dx = bx - ax, dz = bz - az, L = Math.sqrt(dx * dx + dz * dz);
    const t = L ? ((p[0] - ax) * dx + (p[1] - az) * dz) / (L * L) : 0;
    if (t >= -1e-9 && t <= 1 + 1e-9) { const ex = ax + t * dx - p[0], ez = az + t * dz - p[1]; if (ex * ex + ez * ez < 1e-4) return s + t * L; }
    s += L;
  }
  return null;
}

/**
 * A site plan from its tables (src/data/places/melas.js MELAS_TABLES) with buildings moved (moves:
 * [{ id, from, to }]): the plan PLACES §1.9 reads, its door waypoints, spurs, junctions and edges
 * derived (see the header). Pure: the tables are read, a new plan returned.
 */
export function buildSitePlan(tables, moves, { id = 'melas', template = 'melas@1', name = 'Base Melas, the site plan' } = {}) {
  const { BUILDINGS, ZONES, ROADS, WALKS, GATES, MARKS, LINKS, ECHO_INTERIOR, MELAS_RINGS, DOOR_WAYPOINT_M, SPUR_W_M } = tables;
  const move = (bid) => moves.find(m => m.id === bid);
  const offset = (bid) => { const m = move(bid); return m ? [m.to[0] - m.from[0], m.to[1] - m.from[1]] : [0, 0]; };
  const buildings = BUILDINGS.map(b => {
    const [dx, dz] = offset(b.id);
    const doors = b.doors.map(d => ({ id: `o:melas:${short(b.id)}-${d.name}`, name: d.name, x: r2(d.x + dx), z: r2(d.z + dz), side: d.side, kind: d.kind, widthM: d.widthM, waypoint: `w:${short(b.id)}:${d.wp}`, spur: d.spur }));
    return { ...b, rects: b.rects.map(r => shiftRect(r, dx, dz)), doors };
  });
  const zones = ZONES.map(z => { const [dx, dz] = z.of ? offset(z.of) : [0, 0]; return { id: z.id, kind: z.kind, name: z.name, rect: shiftRect(z.rect, dx, dz), surface: z.surface }; });
  const lines = [...ROADS, ...WALKS];
  const waypoints = [], edges = [], spurPaths = [];
  const wp = (w) => { waypoints.push({ id: w.id, x: r2(w.x), z: r2(w.z), kind: w.kind, ...(w.of ? { of: w.of } : {}), ...(w.name ? { name: w.name } : {}) }); return w.id; };
  // (things that join the road network: door waypoints, the canopy's point, muster marks; each with a spur)
  const joins = [];
  for (const b of buildings) {
    for (const d of b.doors) {
      const [nx, nz] = NORMAL[d.side];
      joins.push({ id: wp({ id: d.waypoint, x: d.x + nx * DOOR_WAYPOINT_M, z: d.z + nz * DOOR_WAYPOINT_M, kind: 'door', of: d.id }), from: [d.x, d.z], side: d.side, spur: d.spur, path: `r:${short(b.id)}-${d.name}` });
    }
    if (b.point) {
      const r = b.rects[0], x = (r[0] + r[2]) / 2, z = (r[1] + r[3]) / 2;
      joins.push({ id: wp({ id: b.point.wp, x, z, kind: 'point', of: b.id }), from: [x, z], side: b.point.side, path: `r:${short(b.id)}` });
    }
  }
  for (const m of MARKS) {
    const z0 = ZONES.find(z => z.id === m.of), [dx, dz] = z0?.of ? offset(z0.of) : [0, 0];
    joins.push({ id: wp({ ...m, x: m.x + dx, z: m.z + dz }), from: [m.x + dx, m.z + dz], side: m.side, path: `r:${m.id.slice(2).replace(/:/g, '-')}` });
  }
  for (const g of GATES) wp({ id: g.waypoint, x: g.x, z: g.z, kind: 'gate', of: g.id });
  // (each join's spur: straight out of its side to the first road or walk it meets, or to its given point)
  const nodesOn = new Map(lines.map(l => [l.id, []]));               // line id → [{ s, id, x, z }]
  const named = () => waypoints.map(w => [w.id, [w.x, w.z]]);
  const addNode = (lineId, p, nid = null) => {
    const L = lines.find(l => l.id === lineId), s = along(L.pts, p);
    if (s === null) throw new Error(`melas: ${nid ?? p} is not on ${lineId}`);
    const list = nodesOn.get(lineId), got = list.find(n => Math.abs(n.s - s) < 0.01);
    if (got) return got.id;
    const id = nid ?? (named().find(([, q]) => same(q, p))?.[0] ?? junctionId(p[0], p[1]));
    list.push({ s, id, x: r2(p[0]), z: r2(p[1]) });
    return id;
  };
  for (const j of joins) {
    const p = waypoints.find(w => w.id === j.id), at = [p.x, p.z];
    let hit = null, hitLine = null;
    if (j.spur) {
      hit = j.spur; hitLine = lines.find(l => along(l.pts, hit) !== null)?.id;
      if (!hitLine) throw new Error(`melas: ${j.id}'s spur point ${hit} is on no road`);
    } else {
      const d = NORMAL[j.side];
      let best = Infinity;
      for (const l of lines) for (let k = 0; k + 1 < l.pts.length; k++) { const t = rayHit(at, d, l.pts[k], l.pts[k + 1]); if (t < best) { best = t; hitLine = l.id; } }
      if (!(best < 400)) throw new Error(`melas: ${j.id}'s spur meets no road within 400 m`);
      hit = [r2(at[0] + d[0] * best), r2(at[1] + d[1] * best)];
    }
    const nid = addNode(hitLine, hit);
    if (nid !== j.id) edges.push({ a: j.id, b: nid, via: [], role: 'spur' });
    spurPaths.push({ id: j.path, name: null, kind: 'path', widthM: SPUR_W_M, pts: [j.from, hit], surface: 'paving' });
  }
  // (gates on the roads, every line's corners and ends, and where lines meet)
  for (const g of GATES) { const l = lines.find(L => along(L.pts, [g.x, g.z]) !== null); if (l) addNode(l.id, [g.x, g.z], g.waypoint); }
  for (const l of lines) for (const p of l.pts) addNode(l.id, p);
  for (let i = 0; i < lines.length; i++) for (let k = i + 1; k < lines.length; k++) {
    const A = lines[i], C = lines[k];
    for (let a = 0; a + 1 < A.pts.length; a++) for (let c = 0; c + 1 < C.pts.length; c++) {
      const x = crossAt(A.pts[a], A.pts[a + 1], C.pts[c], C.pts[c + 1]);
      if (x) { const id1 = addNode(A.id, x), id2 = addNode(C.id, x); if (id1 !== id2) edges.push({ a: id1, b: id2, via: [], role: 'same' }); }
    }
  }
  // (the junctions as waypoints, then each line cut into straight edges between consecutive nodes)
  for (const [, list] of nodesOn) for (const n of list) if (!waypoints.some(w => w.id === n.id)) wp({ id: n.id, x: n.x, z: n.z, kind: 'junction' });
  for (const l of lines) {
    const list = nodesOn.get(l.id).sort((p, q) => p.s - q.s);
    for (let k = 0; k + 1 < list.length; k++) if (list[k].id !== list[k + 1].id) edges.push({ a: list[k].id, b: list[k + 1].id, via: [], role: 'road', on: l.id });
    // (a closed line, the perimeter road, joins its last node back to its first)
    if (same(l.pts[0], l.pts[l.pts.length - 1]) && list.length > 2) edges.push({ a: list[list.length - 1].id, b: list[0].id, via: [], role: 'road', on: l.id });
  }
  for (const [a, b] of LINKS) edges.push({ a, b, via: [], role: 'link' });
  // (Echo's interior, moved with Echo)
  const echo = buildings.find(b => b.id === 'b:echo'), [ox, oz] = [echo.rects[0][0], echo.rects[0][1]];
  const interiors = {
    'b:echo': {
      area: ECHO_INTERIOR.area,
      waypoints: ECHO_INTERIOR.waypoints.map(([wid, x, z, kind]) => ({ id: wid, x: r2(ox + x), z: r2(oz + z), kind, of: 'b:echo' })),
      edges: ECHO_INTERIOR.edges.map(([a, b, via = []]) => ({ a, b, via: via.map(([x, z]) => [r2(ox + x), r2(oz + z)]) })),
    },
  };
  return {
    id, template, name, geo: 'melas', area: 'melas.ground',
    boundsM: { x0: -3000, z0: -2600, x1: 3000, z1: 9400 },
    fence: { rect: [...MELAS_RINGS.main], heightM: 3, clearM: 15 },
    rings: { lines: [...MELAS_RINGS.lines], main: [...MELAS_RINGS.main] },
    buildings: buildings.map(({ doors, ...b }) => ({ ...b, doors: doors.map(({ spur, name, ...d }) => d) })),
    roads: ROADS.map(r => ({ ...r })), paths: [...WALKS.map(r => ({ ...r })), ...spurPaths],
    gates: GATES.map(g => ({ ...g })), zones, waypoints, edges,
    interiors,
    daily: { from: 'w:echo:front', warnM: 120, places: { mess: 'w:mess:north', armoury: 'w:armoury:window', aid: 'w:aid:east', gym: 'w:gym:west', field: 'w:field:muster' } },
    moved: moves.map(m => m.id),
  };
}

/** PLACES §4.2's plan as written (melas-as-written): read only by the walk test. */
export const MELAS_PLAN_AS_WRITTEN = deepFreeze(buildSitePlan(MELAS_TABLES, [], { id: 'melas-as-written', template: 'melas@0', name: 'Base Melas, the site plan as PLACES §4.2 writes it' }));
/** The site plan the game uses (melas@1): PLACES §4.2 with the battalion area compacted (MELAS_COMPACTION). */
export const MELAS_PLAN = deepFreeze(buildSitePlan(MELAS_TABLES, MELAS_COMPACTION));
