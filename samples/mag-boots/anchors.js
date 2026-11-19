// OLYMPUS sample: a body anchored on a steel deck, on the doll and the figure (pure; main.js shows the pictures). The second half
// of mag-boots (H), the anywhere round's look set (AW§5; the build sheet v0.0.23 §0 items 26 and 28): drawn on the portraits
// round's pose engine (src/art/doll/doll.js's bends, C's), its candidates C's table (samples/portrait-pose/poses.js ANCHORS).
//
// In free fall a marine who fires unanchored is pushed off by his own shots; the void range (v0.0.24, "Anchor before you fire")
// teaches the anchors, and a viewer must see that he is anchored (the user's note of 2026-11-17, "show us what we would be
// seeing"). Nothing in the game holds a rail yet, so each candidate draws its anchor here over the game's own doll and figure:
//   ?h=H-a  the hand on a hold (the default until scored): the left arm up to a rail over the head (the doll's bend of the left
//           fist, C's; on the figure the free hand put on the rail by the figure's own reach, compose.js), the right on the rifle;
//   ?h=H-b  the lanyard: a tether from the belt's left to an anchor plate on the deck, in the strap's tone;
//   ?h=H-c  the wedge: a boot under a rail on the deck, that knee bent (C's bend on the doll), the rail drawn over the toes on the
//           figure.
// Each picture: the doll (the I and C cards' figure, you in the black combat EVA suit with the carrier and the R-7) today and
// with the candidate, twice its size; then the figure at 16 px/m in four facings, three times its size, today's above.
import { pic, GAP } from '../portrait-lib/card.js';
import { frameOf, drawFrame, snap, marine } from '../portrait-lib/figure.js';
import { ME, ME_PERSON, recOf, dollOf } from '../portrait-lib/posed.js';
import { beatPose } from '../../src/art/figures/walk.js';
import { DOLL_SCALE } from '../../src/art/doll/doll.js';
import { INK } from '../../src/art/doll/grid.js';
import { ANCHORS } from '../portrait-pose/poses.js';

export const LOOKS = Object.freeze(ANCHORS.map(a => a.id)), DEFAULT = 'H-a';
/** The anchors' colours: the rail's steel and its lit edge, the lanyard's strap, the deck's plate. */
export const RAIL_C = Object.freeze({ base: 0x8a909c, lit: 0xc8ccd4 }), PLATE_C = 0x6a7080;
/**
 * The figure's reach to a hold, [forward, left, up] m from the shoulders' middle (compose.js pose.reach): a handhold on a
 * bulkhead at his left, a little below the shoulder (the chibi's helmet hides a hand raised over the head, so the doll's rail
 * overhead is the figure's handhold at the side, the same anchor seen from above).
 */
export const HOLD_REACH = Object.freeze([0.12, 0.42, -0.02]);
const DIRS = Object.freeze(['down', 'right', 'up', 'left']), K = 3, CW = 34 * K, CH = 44 * K, DK = 2, LABEL_H = 9, LABEL = 0x9aa0ab, HEAD = 0xd8dce4, FLOOR = 0x585d66, DOLL = Object.freeze([64, 140]);
const DROP = 2;
export const SIZE = Object.freeze([GAP + 4 * (CW + GAP), GAP + LABEL_H + LABEL_H + DOLL[1] * DK + GAP + 2 * (LABEL_H + CH + GAP)]);

/** A straight bar of steel from (x0, y) to (x1, y), t thick, inked round (on a Pic). */
function rail(P, x0, x1, y, t) {
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let j = -1; j <= t; j++) P.put(x, y + j, INK);
  for (let x = x0; x <= x1; x++) for (let j = 0; j < t; j++) P.put(x, y + j, j === 0 ? RAIL_C.lit : RAIL_C.base);
}
/** A line of pixels t wide from a to b (on a Pic). */
function line(P, a, b, c, t = 1) {
  const n = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]))) || 1;
  for (let i = 0; i <= n; i++) for (let j = 0; j < t; j++) for (let k = 0; k < t; k++) P.put(Math.round(a[0] + (b[0] - a[0]) * i / n) + j, Math.round(a[1] + (b[1] - a[1]) * i / n) + k, c);
}

/** The candidate's doll (the record standing with the rifle at the low ready, the bend C's table gives). */
function candDoll(cand) {
  const rec = recOf(ME, { ...cand.rec });
  // (a bend that moves the arms only keeps the legs straight: a bend with no legs would leave them out, as prone's does)
  const bend = cand.bend ?? (cand.arms ? { drop: 0, arms: cand.arms, legs: { r: [1, 1], l: [1, 1] } } : null);
  return dollOf(ME, ME_PERSON, DOLL_SCALE, rec, bend);
}

/** The picture for a query (?h=<id>): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const id = LOOKS.includes(q.get('h')) ? q.get('h') : DEFAULT, cand = ANCHORS.find(a => a.id === id), [W, H] = SIZE, P = pic(W, H);
  const report = { frame: [W, H], look: id, doll: 0, figure: {} };
  P.write(GAP + 1, GAP + 1, `${id}: ${cand.name}`, HEAD);
  let y = GAP + LABEL_H;
  P.write(GAP + 1, y + 1, 'THE DOLL (I AND C CARDS) X2: TODAY, THEN THE CANDIDATE', LABEL);
  y += LABEL_H;
  const S = DOLL_SCALE, ref = (x, yy) => [Math.round(x * S), Math.round((yy + DROP) * S)];
  [dollOf(ME, ME_PERSON, S, recOf(ME, { hold: { how: 'rifle-low' } })), candDoll(cand)].forEach((pm, j) => {
    const x0 = GAP + j * (DOLL[0] * DK + GAP), D = pic(pm.w, pm.h);
    D.blit(pm, 0, 0);
    if (j === 1) {
      if (cand.rail) { const [a, ry] = ref(cand.rail.x0, cand.rail.y), [b] = ref(cand.rail.x1, cand.rail.y); rail(D, a, b, ry, Math.max(2, Math.round(2 * S))); }
      if (cand.line) { line(D, ref(...cand.line.from), ref(...cand.line.to), cand.line.colour, Math.max(1, Math.round(S))); const [ax, ay] = ref(...cand.line.to); D.fill(ax - 2, ay, 6, 2, PLATE_C); }
      for (let i = 0; i < pm.data.length; i++) { const v = pm.data[i], c = ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff); if (D.col[i] !== c) report.doll++; }
    }
    for (let yy = 0; yy < D.h; yy++) for (let xx = 0; xx < D.w; xx++) P.fill(x0 + xx * DK, y + yy * DK, DK, DK, D.col[yy * D.w + xx]);
  });
  y += DOLL[1] * DK + GAP;
  // (the figure: today's row, then the candidate's)
  const L = marine({ carry: 'low' }), base = beatPose('plant', { weapon: 'rifle', carry: 'low' }), one = beatPose('stackTap', { weapon: 'rifle', carry: 'low' });
  for (const row of ['today', 'cand']) {
    P.write(GAP + 1, y + 1, row === 'today' ? 'THE FIGURE AT 16 PX/M (X3) TODAY: FACING YOU, RIGHT, AWAY, LEFT' : `THE FIGURE WITH ${id}`, LABEL);
    y += LABEL_H;
    DIRS.forEach((dir, i) => {
      const x = GAP + i * (CW + GAP), reach = row === 'cand' && id === 'H-a';
      const pose = reach ? { ...one, arms: undefined, reach: { l: [...HOLD_REACH] } } : id === 'H-c' && row === 'cand' ? { ...base, lean: 0.04 } : base;
      const f = frameOf(L, dir, 'idle0', { ppm: 16, pose });
      P.fill(x, y, CW, CH, snap(FLOOR));
      const fx = x + Math.floor(CW / 2), fy = y + CH - 4 * K;
      drawFrame(P, f, fx, fy, { k: K, clip: [x, y, CW, CH] });
      if (row === 'cand') {
        const top = Math.min(...f.px.map(p => p[1])), ys = (py) => fy + (py - f.ay) * K;
        if (id === 'H-a') {
          // (a handhold upright through the reaching fist: the pixel the reach moved farthest from the figure's middle; none
          // where the reach is hidden behind him)
          const was = new Map(frameOf(L, dir, 'idle0', { ppm: 16, pose: { ...one, arms: undefined } }).px.map(p => [`${p[0]},${p[1]}`, p[2]]));
          const moved = f.px.filter(p => was.get(`${p[0]},${p[1]}`) !== p[2]).sort((a, b) => Math.abs(b[0] - f.ax) - Math.abs(a[0] - f.ax));
          if (moved.length) {
            const hx = fx + (moved[0][0] - f.ax) * K + (moved[0][0] >= f.ax ? K : -2 * K), hy = ys(moved[0][1]);
            for (let j = -6 * K; j <= 6 * K; j++) { P.put(hx - 1, hy + j, INK); P.put(hx + K, hy + j, INK); for (let i = 0; i < K; i++) P.put(hx + i, hy + j, i === 0 ? RAIL_C.lit : RAIL_C.base); }
          }
          void top;
        } else if (id === 'H-b') {
          const belt = [fx + (dir === 'left' ? 1 : -1) * 4 * K, ys(f.ay - 13)];
          line(P, belt, [fx + (dir === 'left' ? 1 : -1) * 12 * K, fy + 2 * K], 0x2c2e38, K);
          P.fill(fx + (dir === 'left' ? 1 : -1) * 12 * K - 2 * K, fy + 2 * K, 5 * K, K, PLATE_C);
        } else rail(P, x + 8, x + CW - 9, fy - 2 * K, K);
        report.figure[dir] = f.px.length;
      }
    });
    y += CH + GAP;
  }
  P.report = report;
  return P;
}
