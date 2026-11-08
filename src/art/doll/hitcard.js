// OLYMPUS art: the hit card, a person or a turner hit drawn as a range target is (VIEWS §7.7; the build sheet 0.0.10 §2.3).
//
// The user's words of 2026-11-07 (DESIGN.md's log): "Targets in game should be represented with the same logic we represent the
// shooting range targets, drawn with impact points drawn as well, using similar to inventory and character menu drawings of
// people." Their answer A: the doll in colour. This module paints the card, CARD_W × CARD_H card pixels (200 × 200, the HUD's
// HITCARD at --ui 1), as a Pixmap (paint.js words), pure: the hud (src/ui/hud/hitcard.js) puts it on a canvas, the gallery's
// samples (samples/hitcard/) shoot it, the tests read its pixels.
//
// THE FIGURE. The doll of PERSONNEL and the inventory (doll.js), front view, at HIT_PX_PER_M 96 card pixels a metre (doll scale
// HIT_SCALE, 96 over the doll's 72 at scale 1), cropped from the head to mid-thigh (FIG_ROWS: 110 rows of figure, its shoulders
// 48), what the turner's painted man holds in his hands (a rifle: the doll's hand 'rifle'; an armoured face the plate carrier
// and the helmet). The man-target's 46 × 76 cm silhouette (paper.js PAPERS.man: the A zone's centre at [0, 0], the head's at
// [0, −30], y down, cm) is laid over the doll life size (0.96 px a cm) with its head on the doll's head: manToCard(). Its zones
// (the A box, the torso, the head's circle) are drawn over the figure at ZONES_K 25%, so it reads as the range's board.
//
// THE THREE LOOKS (the samples the user scores, VIEWS §18 question 21): 'A' the doll in colour on the doll's own wall and floor
// (the default); 'B' the khaki man-target board, the doll's outline and kit in the board's two tones (light and shade by the
// doll's own light), its zones printed, the holes in ink; 'C' the casualty card (COMBAT §12.3's TCCC card): the front and the
// back outlines in ink on the card's cream, the marks on the front (a turner has no exits: the back stays clean).
//
// THE MARKS (marks.js hitMarks, the sim's: belief, then truth; the user's answer to VIEWS question 22). Belief (the string
// running): every round a hollow ring RING_PX 5 × 5 at its called point, filled when it was seen to strike (a puff at 7 m),
// numbered in order; truth (from the string's end, the coach reading his timer): the holes HOLE_PX 3 × 3 at the sim's points,
// coloured by zone (A, C, the head, the plate's ring) inside an ink rim, numbered, the calls under them at CALLS_K 30%; a miss
// is never on the figure in truth (the words say it). Each mark's number stands at its upper right on a dark plate.
//
// THE WORDS (WORDS_H 40 px under the figure): hitMarks' words ("PAIR · 2 SEEN", "PAIR · A · C") at twice the 3 × 5 alphabet,
// and in truth its line ("Two in the chest. He went down.") once; tabs ("L3", "L1") under the figure when two turners were hit
// in the string, the one shown lit, newest first.
// paintHitcard() returns the Pixmap with .marks (each drawn mark's n and its centre, card px) and .zones (the zones' boxes):
// the ui-hitcard test holds them equal to hitMarks'.
import { word } from '../paint.js';
import { glyphOf } from '../font.js';
import { GLOWS } from '../palette.js';
import { doll, backdropAt } from './doll.js';
import { INK, mix, lum } from './grid.js';

/** The card in card pixels (the HUD's HITCARD at --ui 1), the words' strip under the figure. */
export const CARD_W = 200, CARD_H = 200, WORDS_H = 40;
/** The figure's density (card px a metre: VIEWS §7.7) and the doll's scale for it (the doll draws 72 px a metre at scale 1: doll.js PX_PER_CM 0.72). */
export const HIT_PX_PER_M = 96, HIT_SCALE = HIT_PX_PER_M / 72, HIT_PX_PER_CM = HIT_PX_PER_M / 100;
/** The doll's rows drawn (from its top to mid-thigh, at HIT_SCALE) and where its head's centre and the man-target's A centre fall in them (measured on the doll at HIT_SCALE: the head's centre 24 rows down, the A centre 28.8 under it, 30 cm). */
export const FIG_ROWS = Object.freeze([4, 118]), HEAD_ROW = 24, A_ROW = HEAD_ROW + 30 * HIT_PX_PER_CM;
/** The zones over the figure, the calls under the holes in truth (their share). */
export const ZONES_K = 0.25, CALLS_K = 0.3;
/** A called mark's ring and a hole's mark (card px; the hole inside its ink rim). */
export const RING_PX = 5, HOLE_PX = 3;
/** The looks (VIEWS §7.7's samples): A the doll in colour, B the khaki board, C the casualty card. */
export const LOOKS = Object.freeze(['A', 'B', 'C']);
/** The card's sizes (card px, square): CARD_W at --ui 1 and over, down to CARD_MIN at 1024 × 768's --ui 0.85, drawn at whole pixels in between (the runtime review of 0.0.10: the 200 px card resampled smooth to 170 smeared its marks and its words). */
export const CARD_MIN = 170;
/** The card's size for a --ui: CARD_W from 1, else its box's whole pixels, never under CARD_MIN (smaller boxes take CARD_MIN scaled). */
export const cardSize = (ui = 1) => (ui >= 1 ? CARD_W : Math.max(CARD_MIN, Math.min(CARD_W, Math.floor(CARD_W * ui + 1e-6))));
/** The figure's top (card px) at a card size: 14 at CARD_W, 6 at CARD_MIN, so the man-target's torso clears the words at both. */
export const figTop = (size = CARD_W) => Math.round(6 + Math.min(1, Math.max(0, (size - CARD_MIN) / (CARD_W - CARD_MIN))) * 8);
/** Where the figure stands in each look at a card size (its top-left, card px; C's back view at backX): centred across, figTop down. */
export function figAt(look = 'A', size = CARD_W, w = null) {
  const dw = w ?? dollFor().pm.w, y = figTop(size);
  // (C: under the card's name and FRONT and BACK over the figures, whatever the size)
  if (look === 'C') return { x: Math.max(2, Math.round(size / 2 - dw - 2)), y: Math.max(y + 6, 20), backX: size - 2 - dw };
  return { x: Math.round((size - dw) / 2), y };
}
/** Where the figure stands at CARD_W (FIG_AT[look]: figAt's, kept for the tests and the samples). */
export const FIG_AT = Object.freeze({ A: Object.freeze({ x: 58, y: 14 }), B: Object.freeze({ x: 58, y: 14 }), C: Object.freeze({ x: 13, y: 20, backX: 113 }) });
/** The words: the 3 × 5 alphabet at WORDS_K pixels a font pixel, a row WORDS_ROW_PX apart; the headline in up to two rows, the coach's line in up to three. */
export const WORDS_K = 2, WORDS_ROW_PX = 12;
/** The colours: the glass, the paper, the ink, the amber of what you could tell, the zones' holes. */
export const HIT_C = Object.freeze({
  glass: 0x15161d, edge: 0x3a3f4e, paper: 0xefe9dc, faint: 0x9aa0ad, amber: GLOWS[0], plate: 0x14151c,
  zone: 0xf2efe6, khaki: 0xc9b48a, khakiShade: 0xa8925f, khakiInk: 0x5a4a2c, board: 0x2a2b31, stake: 0x6b5a40,
  cream: 0xebe3cc, creamInk: 0x2a2620, cross: 0xb33a32,
});
/** A hole's colour by its zone (truth): A red, C orange, the head crimson, the plate's ring steel. */
export const ZONE_C = Object.freeze({ A: 0xe0412f, C: 0xf09a2e, head: 0xc8327e, headDown: 0xc8327e, ring: 0xc8d4de });

const r = Math.round;
const DOLLS = new Map();
/** The doll for a turner's face: { pm, mask } (cached by face and holds): 'armoured' in the plate carrier and helmet, a threat bare-headed with what he holds. */
function dollFor(face = 'threat', holds = 'rifle') {
  const key = `${face}|${holds}`;
  if (DOLLS.has(key)) return DOLLS.get(key);
  const look = face === 'armoured' ? { outfit: 'carrier', skin: 'tan', hair: { style: 'highTight', color: 'dark' } } : { outfit: 'utilities', skin: face === 'noshoot' ? 'light' : 'tan', head: null, hair: { style: 'medium', color: 'dark' } };
  const pm = doll({ look, sex: 'm', hand: holds === 'rifle' || face === 'armoured' ? 'rifle' : null, scale: HIT_SCALE });
  // (the figure's pixels, its ink round it included: those that are not the doll's wall and floor)
  const mask = new Uint8Array(pm.w * pm.h);
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) mask[y * pm.w + x] = pm.data[y * pm.w + x] !== word(backdropAt(x, y, HIT_SCALE)) ? 1 : 0;
  const out = { pm, mask };
  DOLLS.set(key, out);
  return out;
}
/** The dolls a turner's card may need made ahead (the scene's load), so the first card of a string is painted in one frame (the runtime review of 0.0.10: the first paint dropped a frame). */
export function warmHitcard(faces = [['threat', 'rifle'], ['threat', 'pistol']]) { for (const [f, h] of faces) dollFor(f, h); return DOLLS.size; }
const hexOf = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);

/** A man-target point (cm from the A zone's centre, y down) on the card in a look (card px, fractional): life size, its head on the doll's head; size the card's. */
export function manToCard(xCm, yCm, look = 'A', { w = null, size = CARD_W } = {}) {
  const dw = w ?? dollFor().pm.w, at = figAt(look, size, dw);
  return [at.x + dw / 2 + xCm * HIT_PX_PER_CM, at.y - FIG_ROWS[0] + A_ROW + yCm * HIT_PX_PER_CM];
}
/** The man-target's zones on the card: { A: { x, y, w, h }, torso, head: { cx, cy, r } } (card px); man: paper.js PAPERS.man (null: none). */
export function zonesOnCard(look = 'A', man = null, { size = CARD_W } = {}) {
  if (!man?.zones) return null;
  const P = man, Z = P.zones, box = (c, s) => { const [x0, y0] = manToCard(c[0] - s[0] / 2, c[1] - s[1] / 2, look, { size }), [x1, y1] = manToCard(c[0] + s[0] / 2, c[1] + s[1] / 2, look, { size }); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; };
  const [hx, hy] = manToCard(Z.head.at[0], Z.head.at[1], look, { size });
  return { A: box(P.centres.A, Z.A), torso: box(P.centres.torso, Z.torso), head: { cx: hx, cy: hy, r: Z.head.r * HIT_PX_PER_CM } };
}

// (a writer in the 3 × 5 alphabet at k pixels a font pixel; '·' a centred dot, which the alphabet lacks)
const DOT = Object.freeze(['0', '0', '1', '0', '0']);
const glyph = (ch) => (ch === '·' ? DOT : glyphOf(ch));
/** The width of a string at k (px). */
export const wordsW = (str, k = 1) => Math.max(0, [...String(str).toUpperCase()].reduce((a, ch) => a + (glyph(ch)[0].length + 1) * k, -k));

/**
 * The card (see the header): a Pixmap { w, h, data } with .marks [{ n, x, y, kind: 'ring' | 'seen' | 'hole', zone }] (each drawn
 * mark's centre, card px), .zones (zonesOnCard) and .look. m: { look ('A'), face ('threat'), holds ('rifle'), phase ('belief' |
 * 'truth'), marks (hitMarks' marks), words, line, tabs: [{ label, on }], man (paper.js PAPERS.man: its zones drawn) }.
 */
export function paintHitcard(m = {}) {
  const look = LOOKS.includes(m.look) ? m.look : 'A', truth = m.phase === 'truth';
  const S = Number.isFinite(m.size) ? Math.max(CARD_MIN, Math.min(CARD_W, Math.round(m.size))) : CARD_W, W = S, H = S, data = new Uint32Array(W * H);
  const col = new Int32Array(W * H);                                 // (the colours as 0xrrggbb while painting, words at the end)
  const put = (x, y, c) => { x = r(x); y = r(y); if (x >= 0 && y >= 0 && x < W && y < H) col[y * W + x] = c; };
  const blend = (x, y, c, k) => { x = r(x); y = r(y); if (x >= 0 && y >= 0 && x < W && y < H) col[y * W + x] = mix(col[y * W + x], c, k); };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
  const write = (x, y, str, c, k = 1) => {
    for (const ch of String(str).toUpperCase()) { const g = glyph(ch); g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') rect(x + i * k, y + j * k, k, k, c); })); x += (g[0].length + 1) * k; }
    return x;
  };
  // (the words' strip at the foot, as tall as its rows (wordsRows); the figure from figTop, cut where the strip begins)
  const rows = wordsRows(m, S), figH = H - rows.h;
  // ---- the ground: the doll's wall and floor (A), the bay's dark under the board (B), the card's cream (C) ----
  const { pm, mask } = dollFor(m.face, m.holds);
  const at = figAt(look, S, pm.w), r0 = FIG_ROWS[0], r1 = Math.max(r0 + 1, Math.min(FIG_ROWS[1], r0 + figH - at.y));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let c;
    if (y >= figH) c = look === 'C' ? HIT_C.cream : HIT_C.glass;
    else if (look === 'A') c = backdropAt(x - at.x, y - at.y + r0, HIT_SCALE);
    else if (look === 'B') c = mix(HIT_C.board, 0x3a3c45, y / figH * 0.6);
    else c = HIT_C.cream;
    col[y * W + x] = c;
  }
  // ---- the figure (and C's back view, the front mirrored) ----
  const figure = (x0, mirror = false, ink = null) => {
    for (let y = r0; y < Math.min(r1, pm.h); y++) for (let x = 0; x < pm.w; x++) {
      const sx = mirror ? pm.w - 1 - x : x, i = y * pm.w + sx;
      if (!mask[i]) continue;
      const c = hexOf(pm.data[i]), X = x0 + x, Y = at.y + y - r0;
      if (look === 'A') put(X, Y, c);
      else if (look === 'B') put(X, Y, c === INK ? HIT_C.khakiInk : lum(c) > 92 ? HIT_C.khaki : HIT_C.khakiShade);
      else {
        // (C: the outline only, in the card's ink: a figure pixel with a ground pixel beside it)
        const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const xx = x + dx, yy = y + dy; if (xx < 0 || xx >= pm.w || yy < r0 || yy >= Math.min(r1, pm.h)) return true; return !mask[yy * pm.w + (mirror ? pm.w - 1 - xx : xx)]; });
        if (edge) put(X, Y, ink ?? HIT_C.creamInk);
      }
    }
    // (cut at mid-thigh: a clean line across the legs, the card's ground under it)
    if (look === 'C') for (let x = 0; x < pm.w; x++) if (mask[(r1 - 1) * pm.w + (mirror ? pm.w - 1 - x : x)]) put(x0 + x, at.y + r1 - 1 - r0, HIT_C.creamInk);
  };
  figure(at.x);
  if (look === 'B') { const top = at.y + r1 - r0; if (top < figH) { rect(at.x + 24, top, 3, figH - top, HIT_C.stake); rect(at.x + pm.w - 27, top, 3, figH - top, HIT_C.stake); } }
  if (look === 'C') {
    figure(at.backX, true);
    // (the card's head: a red cross and its name; FRONT and BACK over the figures)
    rect(8, 4, 9, 3, HIT_C.cross); rect(11, 1, 3, 9, HIT_C.cross);
    write(22, 3, 'CASUALTY CARD', HIT_C.creamInk);
    write(at.x + r(pm.w / 2) - r(wordsW('FRONT') / 2), at.y - 7, 'FRONT', HIT_C.creamInk);
    write(at.backX + r(pm.w / 2) - r(wordsW('BACK') / 2), at.y - 7, 'BACK', HIT_C.creamInk);
  }
  // ---- the man-target's zones over the figure (A and B; the casualty card has none) ----
  const zones = zonesOnCard(look, m.man, { size: S });
  if (look !== 'C' && zones) {
    const zc = look === 'A' ? HIT_C.zone : HIT_C.khakiInk, zk = look === 'A' ? ZONES_K : 0.55;
    const outline = (b) => { for (let i = 0; i <= r(b.w); i++) { blend(b.x + i, b.y, zc, zk); if (b.y + b.h < figH) blend(b.x + i, b.y + b.h, zc, zk); } for (let j = 1; j < r(b.h) && b.y + j < figH; j++) { blend(b.x, b.y + j, zc, zk); blend(b.x + b.w, b.y + j, zc, zk); } };
    outline(zones.A); outline(zones.torso);
    const h = zones.head, n = Math.max(16, r(h.r * 8));
    const seen = new Set();
    for (let t = 0; t < n; t++) { const x = r(h.cx + Math.cos(t / n * 2 * Math.PI) * h.r), y = r(h.cy + Math.sin(t / n * 2 * Math.PI) * h.r), k = `${x},${y}`; if (!seen.has(k)) { seen.add(k); blend(x, y, zc, zk); } }
  }
  // ---- the tabs (two turners hit in the string: newest first, the one shown lit) ----
  const tabs = Array.isArray(m.tabs) ? m.tabs : [];
  if (tabs.length > 1) {
    let x = 6;
    const y = figH - 10;
    for (const t of tabs) {
      const w = wordsW(t.label) + 6;
      rect(x, y, w, 9, t.on ? HIT_C.amber : look === 'C' ? HIT_C.creamInk : HIT_C.edge);
      write(x + 3, y + 2, t.label, t.on ? HIT_C.plate : look === 'C' ? HIT_C.cream : HIT_C.paper);
      x += w + 3;
    }
  }
  // ---- the words: the headline and the coach's line at WORDS_K, the size the card's headline always had (the runtime review of
  // 0.0.10: the line at one font pixel was 4 to 5 px on the screen, unreadable) ----
  const ink = look === 'C' ? HIT_C.creamInk : HIT_C.paper, said = look === 'C' ? HIT_C.creamInk : 0xc9ced8;
  rect(0, figH, W, 1, look === 'C' ? HIT_C.creamInk : HIT_C.edge);
  let wy = figH + 6;
  for (const t of rows.head) { write(6, wy, t, ink, WORDS_K); wy += WORDS_ROW_PX; }
  if (rows.line.length) { wy += 4; for (const t of rows.line) { write(6, wy, t, said, WORDS_K); wy += WORDS_ROW_PX; } }
  // ---- the marks, over everything but the frame ----
  const drawn = [];
  // (a called mark: a RING_PX ring in its colour inside a rim of the plate's dark, so it reads on camouflage and on the board;
  // a seen one filled; at k under 1, the colour alone blended in, the truth's call under its hole)
  const ring = (cx, cy, c, k = 1, fill = false) => {
    const h = (RING_PX - 1) / 2, o = h + 1, rimC = look === 'C' ? HIT_C.cream : HIT_C.plate;
    if (k >= 1) for (let j = -o; j <= o; j++) for (let i = -o; i <= o; i++) { const edge = Math.abs(i) === o || Math.abs(j) === o, corner = Math.abs(i) >= h && Math.abs(j) >= h && (Math.abs(i) === o || Math.abs(j) === o); if (edge && !corner) put(cx + i, cy + j, rimC); }
    for (let j = -h; j <= h; j++) for (let i = -h; i <= h; i++) {
      const corner = Math.abs(i) === h && Math.abs(j) === h, rim = Math.abs(i) === h || Math.abs(j) === h;
      if (corner) { if (k >= 1) put(cx + i, cy + j, rimC); continue; }
      if (rim || fill) { if (k >= 1) put(cx + i, cy + j, c); else blend(cx + i, cy + j, c, k); }
      else if (k >= 1) put(cx + i, cy + j, rimC);
    }
  };
  const hole = (cx, cy, c) => {
    const h = (HOLE_PX - 1) / 2 + 1;
    for (let j = -h; j <= h; j++) for (let i = -h; i <= h; i++) { if (Math.abs(i) === h && Math.abs(j) === h) continue; put(cx + i, cy + j, Math.abs(i) === h || Math.abs(j) === h ? (look === 'B' ? HIT_C.khakiInk : INK) : c); }
  };
  const list = Array.isArray(m.marks) ? m.marks : [];
  const where = (p) => manToCard(p[0], p[1], look, { w: pm.w, size: S });
  // (truth: the calls under the holes first, at CALLS_K; then the holes; belief: the rings, a seen one filled)
  if (truth) for (const mk of list) if (mk.hole && mk.called) { const [x, y] = where(mk.called); ring(r(x), r(y), HIT_C.amber, CALLS_K); }
  for (const mk of list) {
    if (truth) {
      if (!mk.hole) continue;
      const [x, y] = where(mk.hole), cx = r(x), cy = r(y);
      hole(cx, cy, look === 'B' ? INK : look === 'C' ? HIT_C.cross : ZONE_C[mk.zone] ?? ZONE_C.C);
      drawn.push({ n: mk.n, x: cx, y: cy, kind: 'hole', zone: mk.zone ?? null });
    } else {
      if (!mk.called) continue;
      const [x, y] = where(mk.called), cx = r(x), cy = r(y);
      ring(cx, cy, look === 'B' ? HIT_C.amber : look === 'C' ? HIT_C.cross : HIT_C.amber, 1, !!mk.seen);
      drawn.push({ n: mk.n, x: cx, y: cy, kind: mk.seen ? 'seen' : 'ring', zone: null });
    }
  }
  // (each mark's number on its plate, placed where it meets no other number and no other mark: upper right first, then the
  // other corners and the sides, further out where the near ones are taken (the runtime review of 0.0.10: a Pair's numbers
  // sat on each other, '2' hidden under '1' and '4'))
  const plates = tagPlaces(drawn, { W, H: figH, wordsW });
  for (const [i, d] of drawn.entries()) {
    const p = plates[i], onCard = look === 'C';
    rect(p.x - 1, p.y - 1, p.w + 2, 7, onCard ? HIT_C.cream : HIT_C.plate);
    write(p.x, p.y, String(d.n), onCard ? HIT_C.creamInk : HIT_C.paper);
    d.tag = { x: p.x - 1, y: p.y - 1, w: p.w + 2, h: 7 };
  }
  // ---- the frame ----
  for (let x = 0; x < W; x++) { col[x] = HIT_C.edge; col[(H - 1) * W + x] = HIT_C.edge; }
  for (let y = 0; y < H; y++) { col[y * W] = HIT_C.edge; col[y * W + W - 1] = HIT_C.edge; }
  for (let i = 0; i < W * H; i++) data[i] = word(col[i]);
  return { w: W, h: H, data, repeat: false, key: null, glows: false, look, size: S, marks: drawn, zones, words: rows };
}

/**
 * Where each mark's number stands (pure): [{ x, y, w }] (its text's top-left, card px), in the marks' order. Each takes the
 * first of its places (upper right, upper left, lower right, lower left, right, left, then each further out) whose plate
 * meets no plate placed before it, no other mark's ring and stays on the figure's part of the card; failing all, the one
 * that overlaps least.
 */
export function tagPlaces(marks = [], { W = CARD_W, H = CARD_H - WORDS_H, wordsW: ww = wordsW } = {}) {
  const placed = [], half = (RING_PX - 1) / 2 + 1;
  const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const boxes = marks.map(d => ({ x: d.x - half, y: d.y - half, w: half * 2 + 1, h: half * 2 + 1 }));
  return marks.map((d, i) => {
    const w = ww(String(d.n)), spots = [];
    for (const far of [0, 3, 6]) spots.push([4 + far, -8 - far], [-4 - w - far, -8 - far], [4 + far, 3 + far], [-4 - w - far, 3 + far], [5 + far, -3], [-5 - w - far, -3]);
    let best = null, bestN = Infinity;
    for (const [dx, dy] of spots) {
      const p = { x: d.x + dx, y: d.y + dy, w }, plate = { x: p.x - 1, y: p.y - 1, w: w + 2, h: 7 };
      if (plate.x < 1 || plate.y < 1 || plate.x + plate.w > W - 1 || plate.y + plate.h > H) continue;
      // (two plates side by side read as one number ('1' by '5' as 15): a plate keeps 2 px clear of the others)
      const clear = { x: plate.x - 2, y: plate.y - 1, w: plate.w + 4, h: plate.h + 2 };
      const n = placed.filter(q => hit(clear, q)).length * 2 + boxes.filter((b, j) => j !== i && hit(plate, b)).length;
      if (n < bestN) { best = p; bestN = n; }
      if (!n) break;
    }
    best ??= { x: Math.max(1, Math.min(W - w - 2, d.x + 4)), y: Math.max(1, d.y - 8), w };
    placed.push({ x: best.x - 1, y: best.y - 1, w: best.w + 2, h: 7 });
    return best;
  });
}

/**
 * The words' rows at a card size (card px across, at WORDS_K): the headline split at its ' · ' into up to two rows, the coach's
 * line (truth only) wrapped at a word into up to three, the last cut with '..' where it runs over. { head: [rows], line: [rows], h }.
 */
export function wordsRows(m = {}, size = CARD_W) {
  const room = size - 12, fits = (t) => wordsW(t, WORDS_K) <= room;
  const wrap = (tokens, sep, most) => {
    const rows = [''];
    for (const t of tokens) { const n = rows.at(-1) ? `${rows.at(-1)}${sep}${t}` : t; if (!fits(n) && rows.at(-1)) rows.push(t); else rows[rows.length - 1] = n; }
    if (rows.length > most) { rows.length = most; let last = `${rows[most - 1]}..`; while (!fits(last) && last.length > 3) last = `${last.slice(0, -3).trimEnd()}..`; rows[most - 1] = last; }
    return rows.filter(Boolean);
  };
  const head = m.words ? wrap(String(m.words).split(' · '), ' · ', 2) : [];
  const line = m.phase === 'truth' && m.line ? wrap(String(m.line).split(/\s+/), ' ', 3) : [];
  const h = 6 + head.length * WORDS_ROW_PX + (line.length ? 4 + line.length * WORDS_ROW_PX : 0) + 2;
  return { head, line, h: Math.max(WORDS_H - 12, h) };
}

/** A digest of a card's pixels (FNV-1a over its words, hex): the ui-hitcard test's golden. */
export function cardDigest(pm) {
  let h = 0x811c9dc5;
  for (const v of pm.data) { h ^= v & 0xffff; h = Math.imul(h, 0x01000193) >>> 0; h ^= v >>> 16; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
