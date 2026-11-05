// OLYMPUS art: the figures' bodies. Two proportion candidates, measured in metres, drawn at PX_PER_M.
//
// A figure is life-size in height (DESIGN.md, Space and scales: "figures likewise come down to chibi
// (tradecraft's pick) or taller proportions, by sample"), so it fits the doors, racks and benches the
// kit draws to scale. What the two candidates change is how that height is shared out:
//   - CHIBI (A, about 2.4 heads): tradecraft's people (src/art/sprites.js), the user's pick there on
//     2026-10-26 ("I like the smaller figures, but the new environment"). Its numbers are tradecraft's
//     template rows divided by its 16 px/m: a head 15 px wide and 12 tall sat straight on a torso of
//     8 rows, legs of 4 and boots of 2, so at 16 px/m this draws tradecraft's figure pixel for pixel,
//     and at 24 px/m the same figure half as fine again.
//   - SOLDIER (B, about 3.75 heads, my call on every number): a stylised soldier whose kit reads, a
//     head of 0.48 m (VIEWS.md 2.2's "B-tall": 12 px at 24 px/m, 8 at 16), a neck, broad shoulders,
//     a torso long enough for a plate carrier with three pouches, legs with knees.
// Everything here is metres; bodyOf() turns a candidate into pixels at a density (lengths stay
// fractional, thicknesses are whole pixels, at least 2), and the composer (compose.js) works in those.
// A figure stands on a CELL (VIEWS.md 2.2: 2.0 × 2.25 m, 32 × 36 px at 16 px/m, 48 × 54 at 24, room
// for a muzzle or an arm held out); lying and floating frames take a long cell (3.0 × 1.75 m) or, seen
// end on, the long cell stood up (1.75 × 3.0 m), and tumbling ones a square (2.25 m). Every cell's
// anchor is the ground under the body's middle: the column ax (its pixel centre) and the row line ay
// (the boundary under the soles), with CELL_FOOT_M of room below it for a toe nearer the camera.
// Pure: no DOM, no three.js.
import { PX_PER_M } from '../../render/scale.js';

/** The two candidates (see the header), metres. Vertical marks are heights above the ground. */
export const PROPORTIONS = Object.freeze({
  chibi: Object.freeze({
    label: 'A: chibi, about 2.4 heads (tradecraft\'s)',
    heads: 2.4,
    headW: 15 / 16, headSideW: 14 / 16, headH: 12 / 16,          // (tradecraft's 15 × 12 head, 14 wide side on)
    chin: 14 / 16, neck: 0,                                       // (the head sits on the torso: no neck)
    shoulderTop: 14 / 16, shoulderJoint: 13.2 / 16,
    shoulderHalf: 4.5 / 16, chestHalf: 4.5 / 16, waistHalf: 4.5 / 16, hipHalf: 4.0 / 16,
    chestDepth: 3 / 16, waistDepth: 2.8 / 16,                     // (side on, tradecraft's torso is 6 deep)
    crotch: 6 / 16, hipJoint: 6 / 16, hipSpread: 2 / 16,          // (legs 3 wide either side of a 1-px gap)
    thigh: 2.2 / 16, shin: 1.8 / 16,
    footH: 2 / 16, footLen: 5 / 16, footW: 4 / 16, heel: 1.2 / 16,
    upperArm: 3.2 / 16, foreArm: 3.0 / 16, hand: 2 / 16,
    armThick: 2 / 16, foreThick: 2 / 16, thighThick: 3 / 16, shinThick: 3 / 16, handThick: 2 / 16,
    armOut: 5.5 / 16,                                             // (the arm's line from the middle: tradecraft's arms hang beside the torso)
    rifleM: 1.0, pistolM: 0.42, magM: 0.2,                        // (drawn bigger than life, as tradecraft's 16-px rifle and 7-px pistol: a chibi's guns must read)
    seatM: 4 / 16,                                                // (the pelvis over the ground when sitting with the feet down)
  }),
  soldier: Object.freeze({
    label: 'B: soldier, about 3.75 heads',
    heads: 3.75,
    headW: 0.42, headSideW: 0.44, headH: 0.48,
    chin: 1.32, neck: 0.04,
    shoulderTop: 1.27, shoulderJoint: 1.2,
    shoulderHalf: 0.24, chestHalf: 0.22, waistHalf: 0.18, hipHalf: 0.2,
    chestDepth: 0.17, waistDepth: 0.15,                           // (a sprite's chest is deeper than life: side on, an arm hangs over it)
    crotch: 0.8, hipJoint: 0.82, hipSpread: 0.1,
    thigh: 0.38, shin: 0.36,
    footH: 0.08, footLen: 0.27, footW: 0.13, heel: 0.07,
    upperArm: 0.3, foreArm: 0.27, hand: 0.1,
    armThick: 0.11, foreThick: 0.1, thighThick: 0.16, shinThick: 0.13, handThick: 0.1,
    armOut: 0.29,
    rifleM: 0.92, pistolM: 0.26, magM: 0.2,
    seatM: 0.44,
  }),
});
export const PROPORTION_KEYS = Object.freeze(Object.keys(PROPORTIONS));

/** The cells, metres: [w, h]. */
// (the long cell 1.75 m tall, not VIEWS.md's 1.5: a prone chibi holds its big head up to look along the sights; my call)
export const CELLS_M = Object.freeze({ stand: [2.0, 2.25], long: [3.0, 1.75], tall: [1.75, 3.0], float: [2.25, 2.25] });
/** Room below the anchor's row for what is nearer the camera than the body's middle (a toe, a muzzle at you). */
export const CELL_FOOT_M = 0.125;

const evenUp = (v) => 2 * Math.ceil(v / 2);
/**
 * A cell's size and anchor in pixels at ppm: { w, h, ax, ay } (w even, so the figure's middle column
 * ax = w / 2 has as many columns either side but one; ay the row under the soles).
 */
export function cellOf(kind, ppm = PX_PER_M) {
  const [wm, hm] = CELLS_M[kind];
  const w = evenUp(wm * ppm), h = Math.round(hm * ppm), foot = Math.max(2, Math.round(CELL_FOOT_M * ppm));
  if (kind === 'float') return { kind, w, h: w, ax: w / 2, ay: Math.round(w / 2) };
  if (kind === 'tall') return { kind, w, h, ax: w / 2, ay: h - foot };
  return { kind, w, h, ax: w / 2, ay: h - foot };
}

const thick = (m, ppm) => Math.max(2, Math.round(m * ppm));
/** Head sizes in whole pixels, odd widths (a middle column for the nose). */
const odd = (v) => Math.max(3, 2 * Math.round((v - 1) / 2) + 1);

/**
 * A candidate at ppm: the metres of PROPORTIONS, plus `px` (metres to pixels), whole-pixel thicknesses
 * (thick.*) and head sizes (head: { w, sideW, h }), and the cells (cell.stand, .long, .tall, .float).
 */
export function bodyOf(prop = 'chibi', ppm = PX_PER_M) {
  const P = PROPORTIONS[prop] ?? PROPORTIONS.chibi;
  const out = {
    ...P, prop: PROPORTIONS[prop] ? prop : 'chibi', ppm, px: (m) => m * ppm,
    head: { w: odd(P.headW * ppm), sideW: Math.round(P.headSideW * ppm), h: Math.round(P.headH * ppm) },
    thick: {
      arm: thick(P.armThick, ppm), fore: thick(P.foreThick, ppm), thigh: thick(P.thighThick, ppm), shin: thick(P.shinThick, ppm),
      hand: thick(P.handThick, ppm), foot: Math.max(2, Math.round(P.footH * ppm)),
    },
    cell: { stand: cellOf('stand', ppm), long: cellOf('long', ppm), tall: cellOf('tall', ppm), float: cellOf('float', ppm) },
  };
  // (tradecraft's chibi has odd leg widths about a one-pixel gap; keep the legs odd at every density)
  if (out.prop === 'chibi') out.thick.thigh = out.thick.shin = odd(P.thighThick * ppm);
  return out;
}
