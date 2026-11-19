// OLYMPUS sample: a floating body's height, read from above (pure; main.js shows the pictures). The anywhere round's look set (AW§5).
//
// In free fall a body drifts off the deck, and the stage (a camera from above, (x, z − y) on the picture: VIEWS §2) shows a
// body 1 m up as a body 1 m further north: its height cannot be read (VIEWS's zero-g frames, "height by shadow and scale", the
// 0.0.7e round's risk). The anywhere round (v0.0.24) draws it by the look you score here. Every figure is the game's own (the
// shoot house's marine in the black combat EVA suit, the carrier, the R-7, in the float frames as the stage has them today:
// float0, float1 and the tumble's turns 45° apart, src/art/figures/poses.js), on a steel deck of the void range's plates, at
// the stage's two densities (16 and 24 px/m) and 16 three times larger, snapped to the Mars palette. Each cell is one body at
// a height over its point on the deck, raised on the picture by the height, as the stage's camera puts it:
//   ?f=F-a   the shadow offset alone: a soft dark ellipse on the deck under him (SHADOW_M across), the body raised over it;
//   ?f=F-b   the shadow and one scale step (the default until scored, AW's my call): off the deck by more than SCALE_FROM_M,
//            the body drawn at the next step of density (× SCALE_STEP_K, nearer the camera);
//   ?f=F-c   the shadow and a thin line from the body down to the point under him (dotted, the deck's light);
//   ?f=F-d   an outline ring on the deck under him in place of the shadow.
// Shown still: a row a density, its bodies at 0.3, 1.0 and 1.8 m and tumbling at 1.0 m (the tumble's 90° and 225° turns,
// marked T), each cell's height written in its corner, the deck's plate seams (1.5 m) for scale.
import { pic, GAP } from '../portrait-lib/card.js';
import { frameOf, drawFrame, snap, marine } from '../portrait-lib/figure.js';
import { mix } from '../../src/art/doll/grid.js';

export const LOOKS = Object.freeze(['F-a', 'F-b', 'F-c', 'F-d']), DEFAULT = 'F-b';
/** The shadow's size (m across, along), the scale step and the height it starts at (m). */
export const SHADOW_M = Object.freeze([0.55, 0.3]), SCALE_STEP_K = 1.25, SCALE_FROM_M = 0.5;
/** The bodies of a row: [height m, frame]. */
export const BODIES = Object.freeze([[0.3, 'float0'], [1.0, 'float1'], [1.8, 'float0'], [1.0, 'tumble2'], [1.0, 'tumble5']]);
export const ROWS = Object.freeze([[16, 1], [24, 1], [16, 3]]);
const DECK = 0x585d66, SEAM = 0x3e424a, RIVET = 0x767c86, LINE = 0xb8bdc8, LABEL = 0x9aa0ab, PLATE_M = 1.5, LABEL_H = 9;
const CELL_M = Object.freeze([2.4, 4.4]);
const cellPx = (ppm, k) => [Math.round(CELL_M[0] * ppm * k), Math.round(CELL_M[1] * ppm * k)];
/** The picture's size: each row's cells side by side (the ×3 row three of its bodies). */
export const SIZE = (() => {
  const w = Math.max(...ROWS.map(([p, k]) => GAP + (k > 1 ? 3 : BODIES.length) * (cellPx(p, k)[0] + GAP)));
  return Object.freeze([w, GAP + ROWS.reduce((a, [p, k]) => a + LABEL_H + cellPx(p, k)[1] + GAP, 0)]);
})();

/** One cell: the deck, then the body at its height in the look (x, y its top-left; ppm, k; the look's id). */
function cell(P, x, y, ppm, k, h, frame, look) {
  const [w, hh] = cellPx(ppm, k), m = ppm * k, clip = [x, y, w, hh];
  for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) {
    const u = (i / m) % PLATE_M, v = (j / m) % PLATE_M, seam = u < 1 / m || v < 1 / m, rivet = Math.abs(u - 0.15) < 1.5 / m && Math.abs(v - 0.15) < 1.5 / m;
    P.put(x + i, y + j, snap(seam ? SEAM : rivet ? RIVET : DECK));
  }
  // (the point under him on the deck: a third of the way up from the cell's foot; the body raised by its height)
  const gx = x + Math.round(w / 2), gy = y + hh - Math.round(0.45 * m), bodyY = gy - Math.round(h * m);
  const rx = SHADOW_M[0] / 2 * m, rz = SHADOW_M[1] / 2 * m;
  if (look === 'F-d') {
    for (let t = 0; t < 96; t++) { const a = t / 96 * 2 * Math.PI; P.put(Math.round(gx + Math.cos(a) * rx), Math.round(gy + Math.sin(a) * rz), snap(LINE)); }
  } else {
    // (a soft shadow: darker in the middle, fainter the higher he is)
    const fade = Math.max(0.35, 1 - h / 3);
    for (let j = -Math.ceil(rz); j <= Math.ceil(rz); j++) for (let i = -Math.ceil(rx); i <= Math.ceil(rx); i++) {
      const d = (i / rx) ** 2 + (j / rz) ** 2;
      if (d > 1) continue;
      const X = gx + i, Y = gy + j, c = P.get(X, Y);
      if (c !== null) P.put(X, Y, snap(mix(c, 0x0b0c10, (d < 0.45 ? 0.55 : 0.35) * fade)));
    }
  }
  if (look === 'F-c') for (let Y = bodyY; Y < gy; Y += 2) P.put(gx, Y, snap(LINE));
  const stepped = look === 'F-b' && h > SCALE_FROM_M, fppm = stepped ? Math.round(ppm * SCALE_STEP_K) : ppm;
  const f = frameOf(marine({ carry: 'slung' }), 'down', frame, { ppm: fppm });
  drawFrame(P, f, gx, bodyY, { k, clip });
  return { h, frame, stepped, ppm: fppm };
}

/** The picture for a query: a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const look = LOOKS.includes(q.get('f')) ? q.get('f') : DEFAULT, [W, H] = SIZE, P = pic(W, H), cells = [];
  let y = GAP;
  ROWS.forEach(([ppm, k]) => {
    const [w, hh] = cellPx(ppm, k), list = k > 1 ? BODIES.slice(0, 3) : BODIES;
    P.write(GAP + 1, y + 1, `${look} · ${ppm} PX/M${k > 1 ? ` X${k}` : ''}`, LABEL);
    list.forEach(([h, frame], i) => {
      const x = GAP + i * (w + GAP);
      cells.push({ row: `${ppm}x${k}`, ...cell(P, x, y + LABEL_H, ppm, k, h, frame, look) });
      P.write(x + 2, y + LABEL_H + 2, `${h.toFixed(1)} M${frame.startsWith('tumble') ? ' T' : ''}`, 0xd8dce4);
    });
    y += LABEL_H + hh + GAP;
  });
  P.report = { frame: [W, H], look, cells };
  return P;
}
