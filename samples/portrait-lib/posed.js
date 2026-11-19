// OLYMPUS samples: the posed portrait sets' shared drawing (the build sheet v0.0.23 §0 item 26, E2; the portraits round's pose
// engine, C's), pure.
//
// The sets drawn on the pose engine (samples/portrait-pose, portrait-facing, pistol-stances, and mag-boots' H) draw every candidate
// with the game's own code: the doll of a record (src/art/doll/dress.js dressOf's arguments for the record's pose, hold, facing and
// hang, then doll.js doll(), with a candidate's bend outright where the candidate is a new drawing, samples/portrait-pose/poses.js),
// and the target card of a record (src/art/doll/hitcard.js paintHitcard with the man as its subject). A candidate whose bend is not
// the game's yet (D2, the wedge) has no record the game can paint, so its card is composed here from its doll by paintHitcard's
// own geometry for a man (manCardOf: the card's dark, the figure in his own colours from the band's rows, set down by the pose's
// drop, the words' strip, the frame): for a record the game can paint, manCardOf of its doll is paintHitcard's card pixel for
// pixel (tests/samples-portrait.test.mjs holds it), so the candidates of a group are judged on one card.
//   - RP, RP_PERSON: the live lane's role-player (utilities, the plate carrier, the force-on-force mask, the R-7), as
//     samples/portrait-light draws him; ME, ME_PERSON: you in the black combat EVA suit with the carrier, the R-7 and the P-12.
//   - recOf(gear, over): a man's record (seen.js seenOf's shape: kind, gear, pose, facing, hold, aimAt) with the fields given.
//   - dollOf(gear, person, scale, rec, bend): the record's doll (the game's dressedDoll, or doll() with the bend given).
//   - cardOf({ gear, person, rec, bend, rangeM, words, size }): the record's target card (paintHitcard's, or manCardOf's).
//   - STAGE_RP, STAGE_ME: the stage's looks for the same two (src/art/figures/outfits.js wear), for the strips of the stage's frames.
import { doll } from '../../src/art/doll/doll.js';
import { dressOf, dressedDoll } from '../../src/art/doll/dress.js';
import { maskOf } from '../../src/art/doll/portrait.js';
import { paintHitcard, figGeom, figAt, bandOf, wordsRows, WORDS_K, WORDS_ROW_PX, CARD_W, HIT_C, MAN_GROUNDS } from '../../src/art/doll/hitcard.js';
import { mix } from '../../src/art/doll/grid.js';
import { word } from '../../src/art/paint.js';
import { glyphOf } from '../../src/art/font.js';
import { RP_GEAR, RP_PERSON } from '../portrait-light/light.js';
import { marine } from './figure.js';
import { wear } from '../../src/art/figures/outfits.js';

export { RP_PERSON };
/** The role-player with his P-12 in its holster (the live lane's issue), the R-7 at the low ready. */
export const RP = Object.freeze({ ...RP_GEAR, pistol: Object.freeze({ model: 'p12', place: 'holster', mag: true }) });
/** The role-player with the P-12 out and the R-7 slung in front (what he wears when his pistol is up). */
export const RP_PISTOL = Object.freeze({ ...RP_GEAR, rifle: Object.freeze({ ...RP_GEAR.rifle, place: 'front' }), pistol: Object.freeze({ model: 'p12', place: 'ready', mag: true }) });
/** You in the shoot house: the black combat EVA suit, the carrier, the R-7, the P-12 on the thigh (pistol-stances' T's kit). */
export const ME = Object.freeze({ outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: { model: 'p12', place: 'holster', mag: true }, thigh: { holds: 2, mags: 1 }, held: null, devices: [], painted: false, mask: null, hands: null, device: null });
/** You with the P-12 out, the R-7 hanging on its sling (the sergeant after Transition). */
export const ME_PISTOL = Object.freeze({ ...ME, rifle: { ...ME.rifle, place: 'front' }, pistol: { model: 'p12', place: 'ready', mag: true } });
export const ME_PERSON = Object.freeze({ look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' }, head: null }, sex: 'm' });
/** The stage's looks: the role-player (opfor-look's, the mask on) and you (the marine of the shoot house), in a carry. */
export const STAGE_RP = (over = {}) => wear({ outfit: 'utilities', skin: 0xb98a64, head: null, hair: { style: 'medium', color: 0x3a2a20 }, seed: 7, carrier: true, mask: true, weapon: 'rifle', carry: 'low', model: 'r7', ...over });
export const STAGE_ME = (over = {}) => marine(over);

/** A man's record (seen.js seenOf's shape) with the fields given over the standing, front-on one. */
export const recOf = (gear, over = {}) => ({ kind: 'man', gear, pose: 'stand', facing: 'front', hold: null, aimAt: null, ...over });
/** The record's doll at a scale: the game's (dress.js, cached) or, with a candidate's bend, doll() drawn with it. */
export function dollOf(gear, person, scale, rec, bend = null) {
  if (!bend) return dressedDoll(gear, person, scale, rec);
  return doll({ ...dressOf(gear, person, { rec }), scale, bend });
}

const DOT = Object.freeze(['0', '0', '1', '0', '0']);
/**
 * A man's target card composed from a doll (paintHitcard's geometry for a man in his own colours, written here; see the header):
 * a Pixmap { w, h, data }. pm: the doll at the band's scale (figGeom(band.pxPerM).scale); ground: MAN_GROUNDS' key.
 */
export function manCardOf(pm, { rangeM = 4, words = '', size = CARD_W, ground = 'dark' } = {}) {
  const band = bandOf(rangeM), G = figGeom(band.pxPerM), S = size, W = S, H = S, col = new Int32Array(W * H), data = new Uint32Array(W * H);
  const r = Math.round, put = (x, y, c) => { x = r(x); y = r(y); if (x >= 0 && y >= 0 && x < W && y < H) col[y * W + x] = c; };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
  const write = (x, y, str, c, k = 1) => { for (const ch of String(str).toUpperCase()) { const g = ch === '·' ? DOT : glyphOf(ch); g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') rect(x + i * k, y + j * k, k, k, c); })); x += (g[0].length + 1) * k; } return x; };
  const rows = wordsRows({ words }, S), figH = H - rows.h, mask = maskOf(pm, G.scale);
  const shift = r(pm.anchors?.drop ?? 0), at = figAt(band.pxPerM, S, pm.w), r0 = G.rows[0] + shift, r1 = Math.max(r0 + 1, Math.min(G.rows[1] + shift, r0 + figH - at.y));
  const lift = MAN_GROUNDS[ground] ?? 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) col[y * W + x] = y >= figH ? HIT_C.glass : mix(mix(HIT_C.board, 0x3a3c45, y / figH * 0.6), HIT_C.khakiShade, lift);
  for (let y = r0; y < Math.min(r1, pm.h); y++) for (let x = 0; x < pm.w; x++) {
    const i = y * pm.w + x;
    if (!mask[i]) continue;
    const v = pm.data[i];
    put(at.x + x, at.y + y - r0, ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff));
  }
  rect(0, figH, W, 1, HIT_C.edge);
  let wy = figH + 6;
  for (const t of rows.head) { write(6, wy, t, HIT_C.paper, WORDS_K); wy += WORDS_ROW_PX; }
  for (let x = 0; x < W; x++) { col[x] = HIT_C.edge; col[(H - 1) * W + x] = HIT_C.edge; }
  for (let y = 0; y < H; y++) { col[y * W] = HIT_C.edge; col[y * W + W - 1] = HIT_C.edge; }
  for (let i = 0; i < W * H; i++) data[i] = word(col[i]);
  return { w: W, h: H, data, band: band.id };
}

/** A record's target card (see the header): paintHitcard's with the man as its subject, or manCardOf's for a bend. */
export function cardOf({ gear, person, rec, bend = null, rangeM = 4, words = '', size = CARD_W, ground = 'dark' }) {
  if (!bend) return paintHitcard({ subject: { kind: 'man', rec, person, ground }, rangeM, words, size });
  const scale = figGeom(bandOf(rangeM).pxPerM).scale;
  return manCardOf(dollOf(gear, person, scale, rec, bend), { rangeM, words, size, ground });
}
