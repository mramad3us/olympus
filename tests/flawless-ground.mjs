// OLYMPUS tests: F187 and F188, "The window and the canopy"'s ground and its look (the build sheet v0.0.28 §1 C, items 19 and 20, §8).
//
// F187, the ground (groundGauge): the armoury's five kinds stand on Base Melas's ground where src/data/places/armoury.js puts them, each
// the kit's size (the catalogue's footprint equal to FOOTPRINTS); every spot of the scene is a free cell of the 0.25 m grid and reached:
// the windows' customer spots, the barrels' spots, the thirteen rank places and the canopy's 32 table spots from the door's waypoint
// (w:armoury:window, 0.5 m out of the front door) by a flood over the ground's chunk grids, for C0 (utilities) and C1 (a fighting
// load); each window's staff spot free in its bay, reached from nowhere on the apron (the counter closes the bay: you never walk into
// the armoury through its window); the door's path (r:armoury-front, x 459 to 461 from the door to the lines walk) free on every row;
// the rank clear of every window's customer spot by RANK_CLEAR_M[0] 1.2 m and of every barrel's spot by RANK_CLEAR_M[1] 1.5 m; the data,
// the catalogue's spotsOf and armouryPlaceOf agree on every place. F188, the look's node half (lookGauge): over a clean's length the
// vignette stands the mat at the table's top before you with its picture by CLEAN_PARTS (0 strip, 1 and 2 the clean's halves, 3 oil,
// together the strip's), the puff only in the clean part's first fifth, at most two cards; the game's mat and puff are samples/armoury-day M's
// pixel for pixel at 16 px/m and its weapon card D-a's at every band, "fine" the card as before. The page half (nothing uploaded after
// the brief's cut) is ui-armoury's, B's. Enforced from C's merge.
import { GROUND_AREA } from '../src/sim/places/ground.js';
import { CATALOGUE, spotsOf, footprintOf, armouryPlaceOf, ARMOURY_PLACE_IDS } from '../src/sim/places/fixtures.js';
import { chunkGrid, cellOf, CHUNK_M, CELL_M } from '../src/sim/places/nav.js';
import { FOOTPRINTS } from '../src/art/kit/index.js';
import { FRONT, PORCH, ARM_RANK, CANOPY } from '../src/data/places/armoury.js';
import { vignetteItems, cleanFrameOf, CLEAN_PARTS, PUFF_SHARE, MAT_FRAME_OF } from '../src/render/vignette-items.js';

/** The gauges this file enforces (from C's merge: the build sheet v0.0.28 §8). */
export const GROUND_ENFORCED = Object.freeze(new Set(['F187', 'F188']));
/** The five kinds, the rank's clearances from the customer spots and the barrels' spots (metres: the sheet's §0 item 12). */
export const ARMOURY_KINDS = Object.freeze(['issueWindow', 'clearingBarrel', 'cleanTable', 'solventTank', 'airHose']), RANK_CLEAR_M = Object.freeze([1.2, 1.5]);
/** Where the flood starts (the door's waypoint) and the door's path's strip (x0, x1, from z to z). */
export const FROM = Object.freeze({ x: 460.125, z: 212.625 }), DOOR_PATH = Object.freeze({ x0: 459.125, x1: 460.875, z0: 212.625, z1: 217.875 });

const scratch = () => ({ clock: { ms: 0 }, places: { sites: {} } });
// (a window of the ground's chunk grids round the armoury for a class: free(x, z) and a flood from a point within a box)
function gridsOf(cls, box = { x0: 430, z0: 180, x1: 490, z1: 250 }) {
  const st = scratch(), grids = new Map();
  for (let j = Math.floor(box.z0 / CHUNK_M); j <= Math.floor(box.z1 / CHUNK_M); j++) for (let i = Math.floor(box.x0 / CHUNK_M); i <= Math.floor(box.x1 / CHUNK_M); i++) grids.set(`${i},${j}`, chunkGrid(st, GROUND_AREA, i, j, cls));
  const free = (x, z) => { const g = grids.get(`${Math.floor(x / CHUNK_M)},${Math.floor(z / CHUNK_M)}`); if (!g) return false; const c = cellOf(g, x, z); return c >= 0 && g.cost[c] !== 255; };
  const snap = (v) => (Math.floor(v / CELL_M) + 0.5) * CELL_M, key = (x, z) => `${Math.round((x - CELL_M / 2) / CELL_M)},${Math.round((z - CELL_M / 2) / CELL_M)}`;
  function flood(x, z) {
    const s = [snap(x), snap(z)], seen = new Set();
    if (!free(...s)) return seen;
    const todo = [s]; seen.add(key(...s));
    while (todo.length) {
      const [cx, cz] = todo.pop();
      for (const [dx, dz] of [[CELL_M, 0], [-CELL_M, 0], [0, CELL_M], [0, -CELL_M]]) {
        const nx = cx + dx, nz = cz + dz, k = key(nx, nz);
        if (seen.has(k) || nx < box.x0 || nx > box.x1 || nz < box.z0 || nz > box.z1 || !free(nx, nz)) continue;
        seen.add(k); todo.push([nx, nz]);
      }
    }
    return seen;
  }
  return { free, flood, has: (set, x, z) => set.has(key(snap(x), snap(z))) };
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/** F187 (see the header): { F187: { ok, …figures } }. */
export function groundGauge() {
  const out = { kinds: [], placed: {}, misplaced: [], spots: 0, unreached: [], staff: [], bayOpen: [], doorPath: { cells: 0, blocked: [] }, rank: { minCustomer: Infinity, minBarrel: Infinity }, disagree: [], classes: {} };
  const byId = new Map(GROUND_AREA.fixtures.map(f => [f.id, f]));
  // (the kinds: the catalogue's footprints the kit's)
  for (const k of ARMOURY_KINDS) { const c = CATALOGUE[k], f = FOOTPRINTS[k]; out.kinds.push({ k, ok: !!c && !!f && c.w === f.w && c.d === f.d && c.h === f.h }); }
  // (the fixtures where the data puts them)
  const want = [
    ...FRONT.windows.map(w => ({ id: w.id, kind: 'issueWindow', x: w.x, z: w.z })), ...PORCH.barrels.map(b => ({ id: b.id, kind: 'clearingBarrel', x: b.x, z: b.z })),
    ...CANOPY.tables.map(t => ({ id: t.id, kind: 'cleanTable', x: CANOPY.origin[0] + t.x, z: CANOPY.origin[1] + t.z })),
    ...CANOPY.tanks.map(t => ({ id: t.id, kind: 'solventTank', x: CANOPY.origin[0] + t.x, z: CANOPY.origin[1] + t.z })),
    ...CANOPY.hoses.map(t => ({ id: t.id, kind: 'airHose', x: CANOPY.origin[0] + t.x, z: CANOPY.origin[1] + t.z })),
  ];
  for (const w of want) { const f = byId.get(w.id); out.placed[w.kind] = (out.placed[w.kind] ?? 0) + 1; if (!f || f.kind !== w.kind || Math.abs(f.x - w.x) > 1e-9 || Math.abs(f.z - w.z) > 1e-9) out.misplaced.push(w.id); }
  // (the data, spotsOf and armouryPlaceOf agree)
  for (const w of FRONT.windows) { const s = spotsOf(byId.get(w.id)); for (const [n, p] of [[1, w.customer], [2, w.staff]]) { const q = s.find(x => x.id === `${w.id}#${n}`), r = armouryPlaceOf(`${w.id}#${n}`); if (!q || q.x !== p.x || q.z !== p.z || q.face !== p.face || r.x !== p.x || r.z !== p.z || r.face !== p.face) out.disagree.push(`${w.id}#${n}`); } }
  for (const b of PORCH.barrels) { const q = spotsOf(byId.get(b.id))[0], r = armouryPlaceOf(`${b.id}#1`); if (q.x !== b.spot.x || q.z !== b.spot.z || q.face !== b.spot.face || r.x !== q.x || r.z !== q.z) out.disagree.push(`${b.id}#1`); }
  for (const p of ARM_RANK) { const r = armouryPlaceOf(p.id); if (r.x !== p.x || r.z !== p.z || r.face !== p.face) out.disagree.push(p.id); }
  // (every place reached from the door's waypoint, by class; the staff spots free and closed off; the door's path free)
  const staffIds = new Set(FRONT.windows.map(w => `${w.id}#2`));
  for (const cls of ['C0', 'C1']) {
    const G = gridsOf(cls), reach = G.flood(FROM.x, FROM.z), miss = [];
    for (const id of ARMOURY_PLACE_IDS) {
      if (staffIds.has(id)) continue;
      const p = armouryPlaceOf(id);
      if (!G.free(p.x, p.z) || !G.has(reach, p.x, p.z)) miss.push(id);
    }
    out.classes[cls] = { reached: reach.size, places: ARMOURY_PLACE_IDS.length - staffIds.size, missed: miss.length };
    out.unreached.push(...miss.map(id => `${cls} ${id}`));
    if (cls === 'C0') {
      for (const w of FRONT.windows) {
        const bay = G.flood(w.staff.x, w.staff.z), free = G.free(w.staff.x, w.staff.z), open = G.has(bay, w.customer.x, w.customer.z) || G.has(bay, FROM.x, FROM.z);
        out.staff.push({ id: `${w.id}#2`, free, cells: bay.size, open });
        if (!free || open) out.bayOpen.push(`${w.id}#2`);
      }
      for (let z = DOOR_PATH.z0; z <= DOOR_PATH.z1 + 1e-9; z += CELL_M) for (let x = DOOR_PATH.x0; x <= DOOR_PATH.x1 + 1e-9; x += CELL_M) { out.doorPath.cells++; if (!G.free(x, z) || !G.has(reach, x, z)) out.doorPath.blocked.push([x, z]); }
    }
    out.spots = ARMOURY_PLACE_IDS.length;
  }
  // (the rank clear of the customer spots and the barrels' spots)
  for (const p of ARM_RANK) {
    for (const w of FRONT.windows) out.rank.minCustomer = Math.min(out.rank.minCustomer, dist(p, w.customer));
    for (const b of PORCH.barrels) out.rank.minBarrel = Math.min(out.rank.minBarrel, dist(p, b.spot));
  }
  const you = ARM_RANK.at(-1), rear = ARM_RANK.filter(p => p.rank === 'rear');
  out.rank.youAtRearEast = you.id === 'arm:rank:you' && rear.every(p => p.x <= you.x) && ARM_RANK.length === 13;
  // (the bays out of the building: the counters stand in no mass)
  const arm = GROUND_AREA.massing.find(m => m.id === FRONT.building), inMass = FRONT.windows.filter(w => { const r = footprintOf(byId.get(w.id)); return arm.rects.some(q => r.x0 < q[2] && q[0] < r.x1 && r.z0 < q[3] && q[1] < r.z1); });
  out.counterInMass = inMass.map(w => w.id);
  const ok = out.kinds.every(k => k.ok) && !out.misplaced.length && !out.disagree.length && !out.unreached.length && !out.bayOpen.length && !out.doorPath.blocked.length
    && out.rank.minCustomer >= RANK_CLEAR_M[0] && out.rank.minBarrel >= RANK_CLEAR_M[1] && out.rank.youAtRearEast && !out.counterInMass.length;
  return { F187: { ok, ...out } };
}
/** F187's line, as the runners print it. */
export const f187Line = (r) => `F187 ${r.ok ? 'MET' : 'OPEN'}: ${r.kinds.filter(k => k.ok).length} of ${r.kinds.length} kinds the kit's size; placed ${Object.entries(r.placed).map(([k, n]) => `${k} ${n}`).join(', ')} (${r.misplaced.length} misplaced); ${r.spots} places, ${r.unreached.length} unreached (${Object.entries(r.classes).map(([c, v]) => `${c} ${v.places - v.missed} of ${v.places} from ${v.reached} cells`).join(', ')}); staff ${r.staff.map(s => `${s.id} ${s.free ? 'free' : 'BLOCKED'} in ${s.cells} cells${s.open ? ' OPEN to the apron' : ', closed'}`).join(', ')}; the door's path ${r.doorPath.cells - r.doorPath.blocked.length} of ${r.doorPath.cells} cells; the rank ${r.rank.minCustomer.toFixed(2)} m from a customer spot, ${r.rank.minBarrel.toFixed(2)} m from a barrel's, yours at the rear's east end ${r.rank.youAtRearEast}; ${r.disagree.length} places the data, spotsOf and armouryPlaceOf disagree on`;

/** F188's node half (see the header): the vignette over a clean's length at a north spot of every table. { F188: { ok, …figures } }. */
export function lookGauge({ steps = 200 } = {}) {
  const out = { tables: 0, frames: [0, 0, 0, 0, 0], wrong: [], maxCards: 0, puffs: 0, puffOut: [], matOff: [] };
  const [a, b] = [CLEAN_PARTS[0], CLEAN_PARTS[0] + CLEAN_PARTS[1]];
  for (const t of CANOPY.tables) {
    const f = GROUND_AREA.fixtures.find(x => x.id === t.id), you = { ...armouryPlaceOf(`${t.id}#1`), look: { skin: 'tan' } };
    out.tables++;
    for (let i = 0; i <= steps; i++) {
      const vk = i / steps, items = vignetteItems({ sp: { vignette: 'clean', vk, form: 'full', inkK: 1 }, fixture: f, you, tS: i * 0.05 }), mat = items.find(x => x.name === 'cleanMat'), puff = items.find(x => x.name === 'airPuff');
      out.maxCards = Math.max(out.maxCards, items.length);
      // (the frame by the part: the strip, the clean's halves, the oil, together)
      const want = vk < a ? 0 : vk < b ? ((vk - a) / CLEAN_PARTS[1] < 0.5 ? 1 : 2) : vk < a + CLEAN_PARTS[1] + CLEAN_PARTS[2] ? 3 : 4;
      if (!mat || mat.opts.frame !== MAT_FRAME_OF[want] || cleanFrameOf(vk).stage !== want) out.wrong.push({ id: t.id, vk, frame: mat?.opts.frame, want });
      else out.frames[want]++;
      // (on the table's top, its north half, before you)
      if (mat && (Math.abs(mat.y - FOOTPRINTS.cleanTable.h) > 1e-9 || mat.z < f.z - FOOTPRINTS.cleanTable.d / 2 || mat.z > f.z + 0.2 || Math.abs(mat.x - you.x) > 1e-6)) out.matOff.push({ id: t.id, vk, at: [mat.x, mat.y, mat.z] });
      if (puff) { out.puffs++; if (vk < a || vk >= a + PUFF_SHARE * CLEAN_PARTS[1]) out.puffOut.push({ id: t.id, vk }); }
      if (!cleanFrameOf(vk).puff !== !puff) out.puffOut.push({ id: t.id, vk, puff: !!puff });
    }
  }
  const ok = !out.wrong.length && out.maxCards <= 2 && !out.puffOut.length && !out.matOff.length && out.puffs > 0 && out.frames.every(n => n > 0);
  return { F188: { ok, ...out } };
}
/** F188's line (the node half), as the runners print it. */
export const f188Line = (r) => `F188 ${r.ok ? 'MET' : 'OPEN'} (node half): ${r.tables} tables, the mat's frames ${r.frames.join('/')} (strip, dirty, cleaned, oiled, together), ${r.wrong.length} wrong; at most ${r.maxCards} cards; the puff on ${r.puffs} steps, ${r.puffOut.length} outside the clean's first fifth; ${r.matOff.length} mats off the table's top`;
