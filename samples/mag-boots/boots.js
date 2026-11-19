// OLYMPUS sample: mag boots on the figure and the doll (pure; main.js shows the pictures). The anywhere round's look set (AW§5).
//
// The void range (v0.0.24, "Anchor before you fire") issues magnetic boots: a body locked to a steel deck holds his gun as on the
// ground, one floating does not, and a viewer must see which (the user's note of 2026-11-17, "show us what we would be seeing").
// The boots do not exist in the game yet (the gear record's `boots` field is v0.0.24's), so each candidate is drawn here over
// the game's own figure (src/art/figures: the shoot house's marine, the black combat EVA suit, the carrier, the R-7, standing)
// and the game's own doll (src/art/doll: the I and C cards' figure in the same kit), redrawing only the boots' pixels:
//   ?b=B-b  the sole and a grey cuff (the default until scored, AW's my call): a sole a pixel deeper than the boot's, in
//           SOLE_C, and the boot's top row in the cuff's grey CUFF_C (the magnet's housing round the ankle);
//   ?b=B-a  a heavier sole: two pixels of sole, no cuff;
//   ?b=B-c  the cuff with the magnet's plate: B-b and a plate of light steel (PLATE_C) on the cuff's outer side.
// The H group (a hand on a hold, the lanyard, the wedge) is drawn on the pose engine of the portraits round, by ./anchors.js
// (E2). Each picture: the figure today and with the candidate, four facings at 16 px/m; the lower legs of both
// three times larger facing you and side on; the doll's lower legs today and with the candidate, twice its size.
import { pic, GAP, hexOf, figureMask } from '../portrait-lib/card.js';
import { frameOf, drawFrame, snap, marine } from '../portrait-lib/figure.js';
import { dressedDoll } from '../../src/art/doll/dress.js';
import { DOLL_SCALE } from '../../src/art/doll/doll.js';
import { INK } from '../../src/art/doll/grid.js';

export const LOOKS = Object.freeze(['B-a', 'B-b', 'B-c']), DEFAULT = 'B-b';
/** The candidates' colours: the sole, the cuff's grey, the magnet's plate. */
export const SOLE_C = 0x24262c, CUFF_C = 0x8a9099, PLATE_C = 0xc8ccd4;
const SPEC = Object.freeze({ 'B-a': { sole: 2, cuff: false, plate: false }, 'B-b': { sole: 1, cuff: true, plate: false }, 'B-c': { sole: 1, cuff: true, plate: true } });
const DIRS = Object.freeze([['down', 'AT YOU'], ['up', 'AWAY'], ['right', 'RIGHT'], ['left', 'LEFT']]);
const BOOT = new Set(['f', 'F']), CW = 34, CH = 40, LABEL = 0x9aa0ab, FLOOR = 0x585d66, LABEL_H = 9;
/** The doll's boots: its rows from the boot's top to the floor (doll.js boots(): ANKLE_Y − 3 to FLOOR_Y, reference rows, set down DROP 2). */
const DOLL_BOOT_ROWS = Object.freeze([124 - 3 + 2, 132 + 2]);
const ME = { outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 2 }, { key: 'p2', holds: 2, mags: 2 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: null, thigh: null, held: null, devices: [], painted: false, mask: null, hands: null, device: null };
const PERSON = { look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' }, head: null }, sex: 'm' };
const DS = DOLL_SCALE, DW = Math.round(64 * DS), DCROP = [Math.round(96 * DS), Math.round(142 * DS)];
export const SIZE = Object.freeze([GAP + 8 * (CW + 2) + 6, GAP + LABEL_H + CH + GAP + LABEL_H + 3 * 18 + GAP + LABEL_H + 2 * (DCROP[1] - DCROP[0]) + GAP]);

/**
 * A boot candidate on a grid of pixels: each column's boot pixels (isBoot), the sole under its lowest (the ink there and below
 * taken), the cuff on its top row, the plate on the outer columns' cuff. px: [[x, y, colour, ch]] (a figure's) → a new list.
 */
export function booted(px, spec, isBoot, { cuffRows = 1, soleRows = spec.sole, plateW = 1, mid = null } = {}) {
  const at = new Map(px.map(p => [`${p[0]},${p[1]}`, p])), cols = new Map();
  for (const p of px) if (isBoot(p)) { const c = cols.get(p[0]) ?? { top: Infinity, bot: -Infinity }; c.top = Math.min(c.top, p[1]); c.bot = Math.max(c.bot, p[1]); cols.set(p[0], c); }
  const out = new Map(at), xs = [...cols.keys()].sort((a, b) => a - b), m = mid ?? (xs[0] + xs.at(-1)) / 2;
  const set = (x, y, c, ch) => out.set(`${x},${y}`, [x, y, c, ch]);
  let n = 0;
  for (const [x, c] of cols) {
    for (let k = 1; k <= soleRows; k++) { set(x, c.bot + k, SOLE_C, 'sole'); n++; }
    if (!at.has(`${x},${c.bot + soleRows + 1}`) || at.get(`${x},${c.bot + soleRows + 1}`)[3] === null) set(x, c.bot + soleRows + 1, INK, null);
    if (spec.cuff) for (let k = 0; k < cuffRows; k++) { const p = at.get(`${x},${c.top + k}`); if (p && isBoot(p)) { set(x, c.top + k, CUFF_C, 'cuff'); n++; } }
  }
  if (spec.plate) {
    // (the plate on each boot's outer side: the columns farthest from the figure's middle)
    const left = xs.filter(x => x < m), right = xs.filter(x => x >= m);
    for (const side of [left.slice(0, plateW), right.slice(-plateW)]) for (const x of side) { const c = cols.get(x); for (let k = 0; k < cuffRows; k++) { set(x, c.top + k, PLATE_C, 'plate'); n++; } }
  }
  return { px: [...out.values()], n };
}

/** The picture for a query: a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const look = LOOKS.includes(q.get('b')) ? q.get('b') : DEFAULT, spec = SPEC[look], [W, H] = SIZE, P = pic(W, H), report = { frame: [W, H], look, figure: {}, doll: null };
  const L = marine(), floor = (x, y, w, h) => P.fill(x, y, w, h, snap(FLOOR));
  P.write(GAP + 1, GAP + 1, `TODAY, FOUR FACINGS AT 16 PX/M · ${look}`, LABEL);
  DIRS.forEach(([dir], i) => {
    const f = frameOf(L, dir, 'idle0', { ppm: 16 }), b = booted(f.px, spec, (p) => BOOT.has(p[3]));
    for (const [j, frame] of [[i, f], [i + 4, { ...f, px: b.px }]]) {
      const x = GAP + j * (CW + 2) + (j >= 4 ? 6 : 0), y = GAP + LABEL_H;
      floor(x, y, CW, CH); drawFrame(P, frame, x + Math.floor(CW / 2), y + CH - 4, { clip: [x, y, CW, CH] });
    }
    report.figure[dir] = b.n;
  });
  // (the lower legs three times larger, facing you and side on, today and the candidate)
  let y = GAP + LABEL_H + CH + GAP;
  P.write(GAP + 1, y + 1, 'THE FEET X3: TODAY, THEN THE CANDIDATE', LABEL);
  y += LABEL_H;
  [['down', 0], ['right', 1]].forEach(([dir, i]) => {
    const f = frameOf(L, dir, 'idle0', { ppm: 16 }), b = booted(f.px, spec, (p) => BOOT.has(p[3]));
    [f, { ...f, px: b.px }].forEach((frame, j) => {
      const x = GAP + (i * 2 + j) * (3 * 22 + GAP), w = 3 * 22, h = 3 * 18;
      floor(x, y, w, h); drawFrame(P, frame, x + Math.floor(w / 2), y + h - 3 * 3, { k: 3, clip: [x, y, w, h] });
    });
  });
  // (the doll: its lower legs, twice its size, today and the candidate)
  y += 3 * 18 + GAP;
  P.write(GAP + 1, y + 1, 'THE DOLL (I AND C CARDS) X2: TODAY, THEN THE CANDIDATE', LABEL);
  y += LABEL_H;
  const pm = dressedDoll(ME, PERSON, DS), mask = figureMask(pm, DS), dpx = [];
  for (let yy = 0; yy < pm.h; yy++) for (let xx = 0; xx < pm.w; xx++) { const i = yy * pm.w + xx, c = hexOf(pm.data[i]); dpx.push([xx, yy, c, mask[i] && c !== INK && yy >= Math.round(DOLL_BOOT_ROWS[0] * DS) && yy < Math.round(DOLL_BOOT_ROWS[1] * DS) ? 'f' : null]); }
  const db = booted(dpx, spec, (p) => p[3] === 'f', { cuffRows: Math.max(2, Math.round(2 * DS)), soleRows: spec.sole * Math.max(1, Math.round(DS)), plateW: 2, mid: DW / 2 });
  [dpx, db.px].forEach((list, j) => {
    const x0 = GAP + j * (DW * 2 + GAP);
    for (const [xx, yy, c] of list) if (yy >= DCROP[0] && yy < DCROP[1]) P.fill(x0 + xx * 2, y + (yy - DCROP[0]) * 2, 2, 2, c);
  });
  report.doll = db.n;
  P.report = report;
  return P;
}
