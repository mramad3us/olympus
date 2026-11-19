// OLYMPUS places: an area's floor plan, and the one wall rule the sim and the cutaway share.
//
// Ported from tradecraft v0.2.0-rc3 `src/sim/interiors/plan.js` (75 lines; the user, tradecraft
// 2026-10-27: "a lot of multiroom interiors"), by way of OLYMPUS v0.0.1's `src/render/walls.js`,
// whose wall rule this module now owns (build sheet 0.0.2 §8, item 4: `walls.js` re-exports it, so
// what blocks a walker and what the camera draws are one computation).
//
// A plan is rooms (axis-aligned rectangles, x east, z south, metres in the area frame) and the
// openings in the walls between them. Its walls are the rooms' edges, merged along each line and
// cut where an opening is. The camera looks north, so the north boundary stands to the ceiling
// (WALL_H_M 2.8 m), the west and east boundaries too (seen edge on), and every other wall (the south
// boundary, the walls between rooms) is cut to CUT_H_M 1.0 m so no wall hides the room behind it.
// A boundary wall's thickness (OUTER_T_M 0.3 m) lies outside the plan, its inner face on the line;
// an inner wall (WALL_T_M 0.16 m) stands astride its line.
//
// planOf(area) reads PLACES's area record (PLACES §1.3, §1.4, §1.6: rooms with `rect: [x0, z0, x1,
// z1]`, openings with `{ axis, at, a, b, kind, state }`) into that plain plan. Opening kinds are
// PLACES's (doorway, door, extDoor, pressureDoor, gate, curtain…); the plan's `kind` is the
// cutaway's: 'gap' for what never shuts a wall (a doorway, a gate, a curtain), 'door' for anything
// with a leaf. A closed leaf blocks as a strip WALL_T_M thick across its opening (leafRect); where a
// door is open or a gap, the wall is simply cut. STEP_M 0.4 m is tradecraft's step past a doorway
// that counts as out (the user, tradecraft 2026-10-28: "The door to exit the embassy is finicky, we
// have to really try to get out"); a portal fires within PORTAL_DEPTH_M 0.6 m past it, and a floor
// keeps PORCH_M of floor past an outside door so a walker can take that step (0.0.3). What changed
// from tradecraft: the rooms come from an area record with ids; `walls()` is `wallsOf()`, `WALL_H` is
// `WALL_H_M` (units in names); the inset variant of wallRect and mirror() wait for the templates that
// need them.
// v0.0.25 (the Wreck at Phobos, src/data/places/wreck.js): an area may hold several decks side by side in its plan (`decks`, each
// its own box: the boundary sides are each deck's) and stand its walls to its rooms' own deckhead (`look.wallsToCeiling`: a ship's
// 2.2 m, not WALL_H_M), planOf carrying both into the plan; every other area's plan and walls are what they were.
// Pure.

export const WALL_H_M = 2.8, CUT_H_M = 1.0, WALL_T_M = 0.16, OUTER_T_M = 0.3;
/** Past a doorway out, the step that still counts as through it (tradecraft's exitHere()). */
export const STEP_M = 0.4;
/**
 * How deep past STEP_M a portal's band still fires, metres (my call: a walker who comes round a
 * flight's side into the zone beyond its band is on the stair; one farther off is not), and the porch
 * a floor keeps past an outside door so a walker can step out through it: STEP_M and this, 1.0 m.
 */
export const PORTAL_DEPTH_M = 0.6, PORCH_M = STEP_M + PORTAL_DEPTH_M;
/** PLACES's opening kinds that leave the wall open whatever their state (the cutaway's 'gap'). */
export const GAP_KINDS = Object.freeze(['doorway', 'gate', 'curtain']);

const r2 = (v) => Math.round(v * 100) / 100;
let plans = new WeakMap();                                         // (frozen area records → their plan: a memo of a pure function)

/** Forget the memo (TECH §2.3: every module with a cache exports this). */
export function resetCaches() { plans = new WeakMap(); }

/**
 * The plain plan of an area record: { id, x0, z0, x1, z1, rooms: [{ id, kind, name, x0, z0, x1, z1 }],
 * openings: [{ id, axis, at, a, b, kind ('gap' | 'door'), type (PLACES's kind), state, rooms }] }.
 */
export function planOf(area) {
  let p = plans.get(area);
  if (p) return p;
  const b = area.boundsM, toCeil = !!area.look?.wallsToCeiling;
  p = Object.freeze({
    id: area.id, x0: b.x0, z0: b.z0, x1: b.x1, z1: b.z1,
    // (the Wreck: an area of several decks names each one's box, and an area whose bulkheads stand to the deckhead carries
    // the flag and its rooms' ceilings; both absent on every other area, so every shipped plan is the object it was)
    ...(area.decks?.length ? { boxes: Object.freeze(area.decks.map(d => Object.freeze([...d.rect]))) } : {}),
    ...(toCeil ? { wallsToCeiling: true } : {}),
    rooms: Object.freeze(area.rooms.map(r => Object.freeze({ id: r.id, kind: r.kind, name: r.name ?? null, x0: r.rect[0], z0: r.rect[1], x1: r.rect[2], z1: r.rect[3], ...(toCeil ? { ceilingM: r.ceilingM ?? WALL_H_M } : {}) }))),
    openings: Object.freeze((area.openings ?? []).map(o => Object.freeze({
      id: o.id, axis: o.axis, at: o.at, a: o.a, b: o.b,
      kind: GAP_KINDS.includes(o.kind) ? 'gap' : 'door', type: o.kind, state: GAP_KINDS.includes(o.kind) ? 'open' : (o.state ?? 'open'), rooms: o.rooms ?? [],
    }))),
  });
  if (Object.isFrozen(area)) plans.set(area, p);
  return p;
}

// (a line's boundary side: the plan's bounds' n, s, w or e; on a plan of several decks (its `boxes`) any deck's own, so each deck
// stands its dorsal, port and starboard bulkheads as an area of its own would; else null, an inner wall)
const near = (a, b) => Math.abs(a - b) < 0.01;
function sideOf(plan, L) {
  for (const [x0, z0, x1, z1] of plan.boxes ?? [[plan.x0, plan.z0, plan.x1, plan.z1]]) {
    if (L.axis === 'x' ? near(L.at, z0) : near(L.at, x0)) return L.axis === 'x' ? 'n' : 'w';
    if (L.axis === 'x' ? near(L.at, z1) : near(L.at, x1)) return L.axis === 'x' ? 's' : 'e';
  }
  return null;
}
/**
 * A standing wall's height on a line ({ axis, at }) over a..b (see wallsOf): WALL_H_M, or under the area's wallsToCeiling the
 * ceiling of the rooms whose edge it is (the tallest that meets it: the Wreck's every one 2.2 m), WALL_H_M where none does. The
 * cutaway's runs and a door's leaf in a standing wall (src/art/jobs.js) read this one rule.
 */
export const standingH = (plan, { axis, at }, a, b) => standH(plan, { axis, at }, { a, b });
function standH(plan, L, r) {
  if (!plan.wallsToCeiling) return WALL_H_M;
  let h = 0;
  for (const q of plan.rooms) {
    const edge = L.axis === 'x' ? (near(q.z0, L.at) || near(q.z1, L.at)) && q.x0 < r.b - 0.01 && q.x1 > r.a + 0.01 : (near(q.x0, L.at) || near(q.x1, L.at)) && q.z0 < r.b - 0.01 && q.z1 > r.a + 0.01;
    if (edge) h = Math.max(h, q.ceilingM ?? WALL_H_M);
  }
  return h || WALL_H_M;
}

/**
 * A plan's wall runs: [{ axis: 'x' (running east–west) | 'z', at, a, b, side: 'n'|'s'|'w'|'e'|null,
 * outer, h, capA, capB }]: capA and capB say whether the run's ends are its line's own ends (where a
 * boundary meets the next and its thickness closes the corner) rather than an opening's jambs.
 * v0.0.25 (the Wreck; the build sheet v0.0.25 §3.1, §5): a plan of several decks (its `boxes`, the area's `decks`) takes each deck's
 * box for the boundary sides, and under the area's `look.wallsToCeiling` a standing run (n, w, e) is its rooms' ceiling high (the
 * Wreck's 2.2 m) instead of WALL_H_M; a cut run stays CUT_H_M. Absent both, every run as before, to the byte.
 */
export function wallsOf(plan) {
  const lines = new Map();
  const add = (axis, at, a, b) => { const k = `${axis}${r2(at)}`; (lines.get(k) ?? lines.set(k, { axis, at: r2(at), runs: [] }).get(k)).runs.push([r2(a), r2(b)]); };
  for (const r of plan.rooms) { add('x', r.z0, r.x0, r.x1); add('x', r.z1, r.x0, r.x1); add('z', r.x0, r.z0, r.z1); add('z', r.x1, r.z0, r.z1); }
  const out = [];
  for (const L of lines.values()) {
    // (the runs on one line merged, then the openings on it cut out: a cut end is a jamb, not a corner)
    let runs = L.runs.sort((p, q) => p[0] - q[0]).reduce((acc, [a, b]) => { const l = acc[acc.length - 1]; if (l && a <= l.b + 0.01) l.b = Math.max(l.b, b); else acc.push({ a, b, capA: true, capB: true }); return acc; }, []);
    for (const o of (plan.openings ?? []).filter(o => o.axis === L.axis && Math.abs(o.at - L.at) < 0.01)) runs = runs.flatMap(r => (o.b <= r.a || o.a >= r.b ? [r] : [{ a: r.a, b: o.a, capA: r.capA, capB: false }, { a: o.b, b: r.b, capA: false, capB: r.capB }].filter(q => q.b - q.a > 0.05)));
    const side = sideOf(plan, L);
    for (const r of runs) out.push({ axis: L.axis, at: L.at, a: r.a, b: r.b, side, outer: !!side, h: side && side !== 's' ? standH(plan, L, r) : CUT_H_M, capA: r.capA, capB: r.capB });
  }
  return out;
}

/**
 * A wall run as the rectangle it stands on { x0, x1, z0, z1 } (a boundary's thickness outside the
 * plan; an inner one astride its line). A boundary running east–west reaches OUTER_T_M past its own
 * ends to close the corners, never past an opening's jamb (0.0.3: Echo's outside doors).
 */
export function wallRect(w) {
  const t = w.outer ? OUTER_T_M : WALL_T_M / 2, o = w.outer ? 0 : WALL_T_M / 2;
  const lo = w.side === 'n' || w.side === 'w' ? w.at - t : w.at - o, hi = w.side === 'n' || w.side === 'w' ? w.at : w.side ? w.at + t : w.at + o;
  const ca = w.outer && w.capA !== false ? OUTER_T_M : 0, cb = w.outer && w.capB !== false ? OUTER_T_M : 0;
  return w.axis === 'x' ? { x0: w.a - ca, x1: w.b + cb, z0: lo, z1: hi } : { x0: lo, x1: hi, z0: w.a, z1: w.b };
}

/** The room a point is in, or null (edges count as in: a point on a shared wall line is in the first room listed). */
export const roomAt = (plan, x, z) => plan.rooms.find(r => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) ?? null;

/** A closed leaf, as the rectangle it blocks: WALL_T_M thick, astride its opening's line, across the gap a to b. */
export function leafRect(opening) {
  const h = WALL_T_M / 2;
  return opening.axis === 'x'
    ? { x0: opening.a, x1: opening.b, z0: opening.at - h, z1: opening.at + h }
    : { x0: opening.at - h, x1: opening.at + h, z0: opening.a, z1: opening.b };
}
