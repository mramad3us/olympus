// OLYMPUS render: the moving pieces of the live area. Door leaves swung by places' leafAt.
//
// TECH §9.2's props: a door's leaf is built with its area (src/art/jobs.js layArea: the leaf a small
// mesh of its own on the area's atlas page, cut with the wall it stands in, in a group at its hinge),
// and each frame turned to places' open fraction (src/sim/places/doors.js leafAt(state, id, ms): 0 shut
// to 1 open over the door's openS), a quarter turn into the first room the opening names. So a door
// swings over its second as the sim times it, and its cells free when the leaf has moved (places'
// rule), never a frame before. A door with no leafAt yet (0.0.2's places) stands as its saved state
// says: open or shut.
// Pure of DOM; the groups are three.js objects the area owns.
import * as DOORS from '../sim/places/doors.js';

const QUARTER = Math.PI / 2;

// (a door's open fraction: places' leafAt, else its saved state, else its template's)
function openOf(state, area, p, ms) {
  if (typeof DOORS.leafAt === 'function') return DOORS.leafAt(state, p.opening, ms) ?? 0;
  const saved = state?.places?.sites?.[area?.site]?.openings?.[p.opening]?.state;
  const o = (area?.openings ?? []).find(x => x.id === p.opening);
  return (saved ?? o?.state ?? 'open') === 'open' ? 1 : 0;
}

/** Turn the live area's leaves (built.props) to places' open fractions now. Returns how many are not shut. */
export function swingProps(built, state, area, ms = state?.clock?.ms ?? 0) {
  let open = 0;
  for (const p of built?.props ?? []) {
    if (p.kind !== 'leaf') continue;
    const t = Math.max(0, Math.min(1, openOf(state, area, p, ms)));
    const y = (p.base ?? 0) + (p.swing ?? 1) * QUARTER * t;
    if (p.group.rotation.y !== y) { p.group.rotation.y = y; p.group.updateMatrixWorld(true); }
    if (t > 0) open++;
  }
  return open;
}
