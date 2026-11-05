// OLYMPUS render: a floor plan's walls, as the cutaway stands them.
//
// tradecraft's rule (src/sim/interiors/plan.js, DESIGN.md Look: "cutaways so interiors read from
// above"): a plan is rooms (axis-aligned rectangles) and openings; its walls are the rooms' edges,
// merged along each line and cut where an opening is. The camera looks north, so:
//   - the north boundary stands to the ceiling (WALL_H_M, 2.8 m), painted room by room;
//   - the west and east boundaries stand to the ceiling too, seen edge on (their tops show);
//   - every other wall (the south boundary, the walls between rooms) is cut to CUT_H_M (1.0 m), its
//     top dark, so no wall hides the room behind it.
// A boundary wall's thickness (OUTER_T_M) lies outside the plan, its inner face on the line; an inner
// wall (WALL_T_M) stands astride its line.
// Pure (the same rule a ship's deck uses: src/render/cutaway.js, deck mode).

export const WALL_H_M = 2.8, CUT_H_M = 1.0, WALL_T_M = 0.16, OUTER_T_M = 0.3;
const r2 = (v) => Math.round(v * 100) / 100;

/** A plan's wall runs: [{ axis: 'x' (running east–west) | 'z', at, a, b, side: 'n'|'s'|'w'|'e'|null, outer, h }]. */
export function wallsOf(plan) {
  const lines = new Map();
  const add = (axis, at, a, b) => { const k = `${axis}${r2(at)}`; (lines.get(k) ?? lines.set(k, { axis, at: r2(at), runs: [] }).get(k)).runs.push([r2(a), r2(b)]); };
  for (const r of plan.rooms) { add('x', r.z0, r.x0, r.x1); add('x', r.z1, r.x0, r.x1); add('z', r.x0, r.z0, r.z1); add('z', r.x1, r.z0, r.z1); }
  const out = [];
  for (const L of lines.values()) {
    // (the runs on one line merged, then the openings on it cut out)
    let runs = L.runs.sort((p, q) => p[0] - q[0]).reduce((acc, [a, b]) => { const l = acc[acc.length - 1]; if (l && a <= l[1] + 0.01) l[1] = Math.max(l[1], b); else acc.push([a, b]); return acc; }, []);
    for (const o of (plan.openings ?? []).filter(o => o.axis === L.axis && Math.abs(o.at - L.at) < 0.01)) runs = runs.flatMap(([a, b]) => (o.b <= a || o.a >= b ? [[a, b]] : [[a, o.a], [o.b, b]].filter(([p, q]) => q - p > 0.05)));
    const side = L.axis === 'x' ? (Math.abs(L.at - plan.z0) < 0.01 ? 'n' : Math.abs(L.at - plan.z1) < 0.01 ? 's' : null) : (Math.abs(L.at - plan.x0) < 0.01 ? 'w' : Math.abs(L.at - plan.x1) < 0.01 ? 'e' : null);
    for (const [a, b] of runs) out.push({ axis: L.axis, at: L.at, a, b, side, outer: !!side, h: side && side !== 's' ? WALL_H_M : CUT_H_M });
  }
  return out;
}

/** A wall run as the rectangle it stands on { x0, x1, z0, z1 } (a boundary's thickness outside the plan; an inner one astride its line). */
export function wallRect(w) {
  const t = w.outer ? OUTER_T_M : WALL_T_M / 2, o = w.outer ? 0 : WALL_T_M / 2;
  const lo = w.side === 'n' || w.side === 'w' ? w.at - t : w.at - o, hi = w.side === 'n' || w.side === 'w' ? w.at : w.side ? w.at + t : w.at + o;
  return w.axis === 'x' ? { x0: w.a - (w.outer ? OUTER_T_M : 0), x1: w.b + (w.outer ? OUTER_T_M : 0), z0: lo, z1: hi } : { x0: lo, x1: hi, z0: w.a, z1: w.b };
}

/** The room a point is in, or null. */
export const roomAt = (plan, x, z) => plan.rooms.find(r => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) ?? null;
