// OLYMPUS places: Base Melas's ground, the site plan laid out as an area (melas.ground; the build sheet 0.0.3 §2.1).
//
// MELAS_PLAN (src/sim/places/siteplan.js, melas@1) holds the base as v0.0.2 built and compacted it:
// the buildings with their doors, the zones, the roads and walks, the gates. This module lays it out
// as the ground's area record, at load and the same in every career (nothing reads a seed of the
// world; the look seed is the data's authored constant):
//   massing   every building that stands within the drawn ground (Main Side's fence and GROUND_APRON_M
//             of valley floor past it) as rects with a height, STOREY_M 3.4 m a storey and PARAPET_M
//             0.6 m (a two-storey block 7.4 m), an open structure (the cleaning canopy) at 3.6 m and not
//             blocking; its doors on its edges, and Echo's three outside doors naming the opening of
//             the floor they lead into (`opening`: the leaf's one state, read on both sides);
//   surfaces  the paved zones (the company streets, the aprons, the parade deck, the field, the track,
//             the parking) as rects, the roads as paved strips, the walks and every door's spur as
//             paths; regolith elsewhere (PLACES §4.1's ground);
//   fence     Main Side's 3 m mesh on its line, and the four gates on it, closed this release (the
//             sheet's §8 item 19: the walk ends at the fences; the gate posts open them at 0.0.12);
//   fixtures  the street lamps by the data's rule of the plan's lines (a lamp post every 20 m, 40 along
//             Valley Road, left out where it would stand in a building, on a road or a path, or within
//             3 m of a door), the fence's floods every 40 m, Echo's street's guidon post and bins, and
//             the company's plate by each of Echo's outside doors (the exit signs are the floors');
//   portals   Echo's front, east and west exits, into the building: a band on the building's face at
//             the door (out 'n', into it), arriving 0.7 m inside the floor from its own band;
//   look      the palette, the authored look seed, the formation marks (decor) and the lamps: 'street'
//             at every lamp post, 'flood' on the fence.
// And for the nav and the sight grids (src/sim/places/nav.js, sight.js), the rects that block: each
// mass's rects with a reveal DOOR_REVEAL_M 0.8 m deep cut out at every door that has an opening (the
// reveal is a leaf of its own, blocked while the opening is closed), the fence's runs cut at the
// gates, and each gate as a leaf (closed). Blocking fixtures are the nav's to add (it reads the
// catalogue, which this module may not import: fixtures.js reads every area). Frozen.
import { MELAS_PLAN } from './siteplan.js';
import { GROUND, LAMP_LINES, FLOODS, STREET, DOOR_SIGNS } from '../../data/places/ground.js';
import { SEEDS } from '../../data/places/echo.js';
import { LAMP_KINDS } from '../../data/places/sky.js';
import { ECHO_1, ECHO_ENTRIES } from './echo.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };
const r4 = (v) => { const r = Math.round(v * 10000) / 10000; return r === 0 ? 0 : r; };

/** Valley floor drawn past the fence, metres (the sheet's §4). */
export const GROUND_APRON_M = GROUND.apronM;
/** A storey and a roof's parapet, metres (PLACES §1.1; my call: a two-storey block 7.4 m). */
export const STOREY_M = 3.4, PARAPET_M = 0.6;
/** An open structure's height (the cleaning canopy on its posts), metres (my call). */
export const CANOPY_M = 3.6;
/** How deep a door's reveal is cut into its mass on the ground, metres (the sheet's §4). */
export const DOOR_REVEAL_M = 0.8;
/** The fence's half thickness on its line, metres (nav.js fenceRects's 0.05). */
export const FENCE_HALF_M = 0.05;
/** No street lamp within this of a door, metres (my call). */
export const LAMP_DOOR_M = 3;

const rectOf = (r) => (Array.isArray(r) ? { x0: r[0], z0: r[1], x1: r[2], z1: r[3] } : r);
const overlaps = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
const B = { x0: GROUND.walkM.x0 - GROUND.apronM, z0: GROUND.walkM.z0 - GROUND.apronM, x1: GROUND.walkM.x1 + GROUND.apronM, z1: GROUND.walkM.z1 + GROUND.apronM };
const ox = ECHO_1.originM[0], oz = ECHO_1.originM[2];

// (what is cut from a rect by a hole: up to four rects round it)
function subtract(r, h) {
  if (!overlaps(r, h)) return [r];
  const out = [];
  if (h.z0 > r.z0) out.push({ x0: r.x0, z0: r.z0, x1: r.x1, z1: h.z0 });
  if (h.z1 < r.z1) out.push({ x0: r.x0, z0: h.z1, x1: r.x1, z1: r.z1 });
  const z0 = Math.max(r.z0, h.z0), z1 = Math.min(r.z1, h.z1);
  if (h.x0 > r.x0) out.push({ x0: r.x0, z0, x1: h.x0, z1 });
  if (h.x1 < r.x1) out.push({ x0: h.x1, z0, x1: r.x1, z1 });
  return out.filter(q => q.x1 - q.x0 > 1e-6 && q.z1 - q.z0 > 1e-6);
}
// (a door's reveal on its mass: widthM wide, DOOR_REVEAL_M into the building from its edge)
function revealOf(d, a, b) {
  const D = DOOR_REVEAL_M;
  if (d.side === 's') return { x0: a, x1: b, z0: d.z - D, z1: d.z };
  if (d.side === 'n') return { x0: a, x1: b, z0: d.z, z1: d.z + D };
  if (d.side === 'w') return { x0: d.x, x1: d.x + D, z0: a, z1: b };
  return { x0: d.x - D, x1: d.x, z0: a, z1: b };
}

// ---- the massing ----
const entryOf = (doorId) => ECHO_ENTRIES.find(e => e.ground === doorId) ?? null;
const openingRec = (id) => ECHO_1.openings.find(o => o.id === id);
const massing = MELAS_PLAN.buildings.filter(b => b.rects.some(r => overlaps(rectOf(r), B))).map(b => ({
  id: b.id, name: b.name, rects: b.rects.map(r => [...r]),
  heightM: b.open ? CANOPY_M : r4(b.storeys * STOREY_M + PARAPET_M), open: !!b.open,
  doors: b.doors.map(d => {
    const e = entryOf(d.id), o = e && openingRec(e.opening);
    const rec = { id: d.id, x: d.x, z: d.z, side: d.side, kind: d.kind, widthM: o ? r4(o.b - o.a) : d.widthM };
    if (o) Object.assign(rec, { opening: o.id, a: r4(o.a + ox), b: r4(o.b + ox) });
    return rec;
  }),
}));

// ---- the rects that block, and the leaves ----
const blockers = [], leaves = [];
for (const m of massing) {
  if (m.open) continue;
  const holes = m.doors.filter(d => d.opening).map(d => ({ d, rect: revealOf(d, d.a, d.b) }));
  for (const r0 of m.rects) {
    let parts = [rectOf(r0)];
    for (const h of holes) parts = parts.flatMap(p => subtract(p, h.rect));
    for (const p of parts) blockers.push({ x0: r4(p.x0), z0: r4(p.z0), x1: r4(p.x1), z1: r4(p.z1), tag: m.id, h: m.heightM });
  }
  for (const h of holes) leaves.push({ id: h.d.opening, door: h.d.id, kind: 'reveal', rect: { x0: r4(h.rect.x0), z0: r4(h.rect.z0), x1: r4(h.rect.x1), z1: r4(h.rect.z1) } });
}
const fenceR = rectOf(MELAS_PLAN.fence.rect), gates = MELAS_PLAN.gates.map(g => {
  const onX = Math.abs(g.z - fenceR.z0) < 0.01 || Math.abs(g.z - fenceR.z1) < 0.01;            // (on the north or south run: the gate spans x)
  return { id: g.id, name: g.name, x: g.x, z: g.z, axis: onX ? 'x' : 'z', widthM: g.widthM, kind: 'gate', state: 'closed' };
});
{
  const t = FENCE_HALF_M, sides = [['x', fenceR.z0, fenceR.x0, fenceR.x1], ['x', fenceR.z1, fenceR.x0, fenceR.x1], ['z', fenceR.x0, fenceR.z0, fenceR.z1], ['z', fenceR.x1, fenceR.z0, fenceR.z1]];
  for (const [axis, at, a, b] of sides) {
    let runs = [[a, b]];
    for (const g of gates) {
      if (g.axis !== axis || Math.abs((axis === 'x' ? g.z : g.x) - at) > 0.01) continue;
      const c = axis === 'x' ? g.x : g.z, ga = c - g.widthM / 2, gb = c + g.widthM / 2;
      runs = runs.flatMap(([p, q]) => (gb <= p || ga >= q ? [[p, q]] : [[p, ga], [gb, q]].filter(([u, v]) => v - u > 0.01)));
      leaves.push({ id: g.id, kind: 'gate', rect: axis === 'x' ? { x0: ga, z0: at - t, x1: gb, z1: at + t } : { x0: at - t, z0: ga, x1: at + t, z1: gb } });
    }
    for (const [p, q] of runs) blockers.push(axis === 'x' ? { x0: p, z0: at - t, x1: q, z1: at + t, tag: 'fence', h: 3, see: true } : { x0: at - t, z0: p, x1: at + t, z1: q, tag: 'fence', h: 3, see: true });
  }
}

// ---- surfaces and zones ----
const lineBox = (l) => { const xs = l.pts.map(p => p[0]), zs = l.pts.map(p => p[1]), h = l.widthM / 2; return { x0: Math.min(...xs) - h, z0: Math.min(...zs) - h, x1: Math.max(...xs) + h, z1: Math.max(...zs) + h }; };
const surfaces = [
  ...MELAS_PLAN.zones.filter(z => z.surface === 'paving' && overlaps(rectOf(z.rect), B)).map(z => ({ kind: 'paving', id: z.id, rect: [...z.rect] })),
  ...MELAS_PLAN.roads.filter(r => overlaps(lineBox(r), B)).map(r => ({ kind: 'paving', id: r.id, pts: r.pts.map(p => [...p]), widthM: r.widthM })),
  ...MELAS_PLAN.paths.filter(r => overlaps(lineBox(r), B)).map(r => ({ kind: 'path', id: r.id, pts: r.pts.map(p => [...p]), widthM: r.widthM })),
];
const zones = MELAS_PLAN.zones.filter(z => z.name && overlaps(rectOf(z.rect), B)).map(z => ({ id: z.id, kind: z.kind, name: z.name, rect: [...z.rect] }));

// ---- fixtures and lamps ----
const seedOf = (() => { const n = {}; return (kind) => { const k = (n[kind] = (n[kind] ?? -1) + 1); return SEEDS[k % SEEDS.length]; }; })();
const fixtures = [], lamps = [];
const strips = [...MELAS_PLAN.roads, ...MELAS_PLAN.paths];
const segDist = (p, a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz; let t = L ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / L : 0; t = Math.max(0, Math.min(1, t)); const ex = a[0] + t * dx - p[0], ez = a[1] + t * dz - p[1]; return Math.sqrt(ex * ex + ez * ez); };
const onStrip = (p) => strips.some(l => l.pts.some((q, k) => k + 1 < l.pts.length && segDist(p, q, l.pts[k + 1]) < l.widthM / 2 + 0.3));
const inMass = (p) => massing.some(m => m.rects.some(r0 => { const r = rectOf(r0); return p[0] > r.x0 - 0.4 && p[0] < r.x1 + 0.4 && p[1] > r.z0 - 0.4 && p[1] < r.z1 + 0.4; }));
const nearDoor = (p) => massing.some(m => m.doors.some(d => Math.sqrt((d.x - p[0]) ** 2 + (d.z - p[1]) ** 2) < LAMP_DOOR_M));
// (the point at arc length s along a polyline, and its direction there)
function along(pts, s) {
  for (let k = 0; k + 1 < pts.length; k++) {
    const [ax, az] = pts[k], [bx, bz] = pts[k + 1], L = Math.sqrt((bx - ax) ** 2 + (bz - az) ** 2);
    if (s <= L || k + 2 === pts.length) { const t = L ? s / L : 0; return { p: [ax + t * (bx - ax), az + t * (bz - az)], d: L ? [(bx - ax) / L, (bz - az) / L] : [1, 0] }; }
    s -= L;
  }
  return null;
}
let nLamp = 0;
for (const rule of LAMP_LINES) {
  const line = strips.find(l => l.id === rule.line);
  if (!line) throw new Error(`ground: no line '${rule.line}' for its lamps`);
  for (let s = rule.from; s <= rule.to + 1e-9; s += rule.everyM) {
    const at = along(line.pts, s), [dx, dz] = at.d, n = rule.side === 'left' ? [dz, -dx] : [-dz, dx];
    const p = [r4(at.p[0] + n[0] * rule.offsetM), r4(at.p[1] + n[1] * rule.offsetM)];
    if (onStrip(p) || inMass(p) || nearDoor(p)) continue;
    nLamp++;
    fixtures.push({ id: `f:melas:lamp-${nLamp}`, kind: 'lampPost', make: 'sodium', x: p[0], z: p[1], face: 'down', seed: seedOf('lampPost') });
    lamps.push({ kind: 'street', x: p[0], z: p[1], y: 4.0, r: LAMP_KINDS.street.r });
  }
}
{
  let n = 0;
  const { everyM, insetM, firstM } = FLOODS, I = insetM;
  const runs = [[(t) => [t, fenceR.z0 + I], fenceR.x1 - fenceR.x0], [(t) => [t, fenceR.z1 - I], fenceR.x1 - fenceR.x0], [(t) => [fenceR.x0 + I, t], fenceR.z1 - fenceR.z0], [(t) => [fenceR.x1 - I, t], fenceR.z1 - fenceR.z0]];
  for (const [at, len] of runs) for (let s = firstM; s < len; s += everyM) {
    const p = at(s).map(r4);
    n++;
    fixtures.push({ id: `f:melas:flood-${n}`, kind: 'lampPost', make: 'flood', x: p[0], z: p[1], face: 'down', seed: seedOf('lampPost') });
    lamps.push({ kind: 'flood', x: p[0], z: p[1], y: 3.5, r: LAMP_KINDS.flood.r });
  }
}
for (const f of STREET.fixtures) fixtures.push({ id: `f:melas:echo-street:${f.name}`, kind: f.kind, make: f.make, x: f.x, z: f.z, face: f.face, seed: seedOf(f.kind), ...(f.look ? { look: { ...f.look } } : {}) });
for (const s of DOOR_SIGNS) fixtures.push({ id: `f:melas:echo:${s.name}`, kind: 'sign', make: 'plaque', x: s.x, z: s.z, face: s.face, y: s.y, seed: seedOf('sign'), look: { ...s.look } });

// ---- the portals: into Echo by its outside doors ----
const portals = [];
for (const m of massing) for (const d of m.doors) {
  if (!d.opening) continue;
  const e = entryOf(d.id);
  portals.push({ id: d.id, kind: 'door', via: d.opening, band: { axis: 'x', at: d.z, a: d.a, b: d.b, out: 'n' }, to: { ...e.to } });
}

/** Base Melas's ground (melas.ground), the site plan laid out (see the header). */
export const GROUND_AREA = deepFreeze({
  id: GROUND.id, site: GROUND.site, kind: 'ground', name: GROUND.name, short: GROUND.name, originM: [0, 0, 0],
  boundsM: { ...B }, walkM: { ...GROUND.walkM }, plan: GROUND.plan, spawn: { ...GROUND.spawn },
  massing, surfaces, zones,
  fence: { rect: [fenceR.x0, fenceR.z0, fenceR.x1, fenceR.z1], heightM: 3, postM: 3 }, gates,
  rooms: [], openings: [], fixtures, portals,
  look: { palette: 'mars', seed: GROUND.lookSeed, decor: STREET.marks.map(m => ({ ...m })), lamps },
  nav: { blockers, leaves },
});
