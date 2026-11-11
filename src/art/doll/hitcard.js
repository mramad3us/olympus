// OLYMPUS art: the hit card, a person or a turner hit drawn as a range target is (VIEWS §7.7; the build sheet 0.0.10 §2.3).
//
// The user's words of 2026-11-07 (DESIGN.md's log): "Targets in game should be represented with the same logic we represent the
// shooting range targets, drawn with impact points drawn as well, using similar to inventory and character menu drawings of
// people." Their scores of 2026-11-08 picked B, the khaki board (below). This module paints the card, CARD_W × CARD_H card pixels (200 × 200, the HUD's
// HITCARD at --ui 1), as a Pixmap (paint.js words), pure: the hud (src/ui/hud/hitcard.js) puts it on a canvas, the gallery's
// samples (samples/hitcard/) shoot it, the tests read its pixels.
//
// THE FIGURE. The doll of PERSONNEL and the inventory (doll.js), front view, at its range band's density (HIT_BANDS: the near
// band's HIT_PX_PER_M 96 card pixels a metre, doll scale HIT_SCALE, 96 over the doll's 72 at scale 1), cropped from the head to
// mid-thigh (FIG_ROWS at 96 px/m: 110 rows of figure, its shoulders 48), what the turner's painted man holds in his hands (a
// rifle: the doll's hand 'rifle', the R-7 as the Corps draws it; an armoured face the plate carrier and the helmet). The
// man-target's 46 × 76 cm silhouette (paper.js PAPERS.man: the A zone's centre at [0, 0], the head's at [0, −30], y down, cm)
// is laid over the doll life size at the band's density with its head on the doll's head: manToCard(). Its zones (the A box,
// the torso, the head's circle) are printed over the figure in the board's ink.
//
// THE LOOK (the user's scores of 2026-11-08: A 10, B ★ 99, C 0, "Second set is perfect, keep all three to represent varying
// ranges"): B, the khaki man-target board on its stakes over the bay's dark, the doll's outline and kit in the board's two tones
// (light and shade by the doll's own light), its zones printed, the holes in ink, the calls in amber. A (the doll in colour)
// and C (the casualty card) are gone. "Keep all three" is read as B's three shots (1920, 1600 and 1024 wide), one board seen at
// three ranges (my reading, for the user to confirm): HIT_BANDS draws the board's figure at 96 px/m up to 10 m (the 1920 shot as
// scored, unchanged to the pixel), 80 up to 25 m and 64 beyond, in the same card with the marks at their own sizes; a farther
// board stands lower on longer stakes. A card with no range (the hud's model without rangeM) is the near band's.
//
// THE MARKS (marks.js hitMarks, the sim's: belief, then truth; the user's answer to VIEWS question 22). Belief (the string
// running): every round a hollow amber ring RING_PX 5 × 5 at its called point, filled when it was seen to strike (a puff at 7 m),
// numbered in order; truth (from the string's end, the coach reading his timer): the holes HOLE_PX 3 × 3 in ink at the sim's
// points inside the board's ink rim, numbered, the calls under them at CALLS_K 30%; a miss is never on the figure in truth (the
// words say it). Each mark's number stands at its upper right on a dark plate. The marks keep their sizes in every band.
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
/** The near band's figure density (card px a metre: VIEWS §7.7) and the doll's scale for it (the doll draws 72 px a metre at scale 1: doll.js PX_PER_CM 0.72). */
export const HIT_PX_PER_M = 96, HIT_SCALE = HIT_PX_PER_M / 72, HIT_PX_PER_CM = HIT_PX_PER_M / 100;
/** The range bands (see the header): up to maxM metres the board's figure at pxPerM card pixels a metre; the near band the card as scored. */
export const HIT_BANDS = Object.freeze([
  Object.freeze({ id: 'near', maxM: 10, pxPerM: 96 }), Object.freeze({ id: 'mid', maxM: 25, pxPerM: 80 }), Object.freeze({ id: 'far', maxM: Infinity, pxPerM: 64 }),
]);
/** A range's band (metres; none or not a number, the near band's). */
export const bandOf = (rangeM) => (Number.isFinite(rangeM) ? HIT_BANDS.find(b => rangeM <= b.maxM) : HIT_BANDS[0]);
/** The doll's rows drawn at the near band (from its top to mid-thigh, at HIT_SCALE) and where its head's centre and the man-target's A centre fall in them (measured on the doll at HIT_SCALE: the head's centre 24 rows down, the A centre 28.8 under it, 30 cm). */
export const FIG_ROWS = Object.freeze([4, 118]), HEAD_ROW = 24, A_ROW = HEAD_ROW + 30 * HIT_PX_PER_CM;
/** The board's stakes: their offset in from the figure's sides at the near band, and their width (card px). */
export const STAKE_IN_PX = 24, STAKE_W_PX = 3;
/** The figure's geometry at a density (card px a metre): the doll's scale, px a cm, its rows drawn, its head's and A centre's rows, the stakes' offset; the near band's exactly the numbers above. */
export function figGeom(pxPerM = HIT_PX_PER_M) {
  if (pxPerM === HIT_PX_PER_M) return { pxPerM, scale: HIT_SCALE, pxPerCm: HIT_PX_PER_CM, rows: FIG_ROWS, headRow: HEAD_ROW, aRow: A_ROW, stakeIn: STAKE_IN_PX };
  const k = pxPerM / HIT_PX_PER_M, pxPerCm = pxPerM / 100, headRow = HEAD_ROW * k;
  return { pxPerM, scale: pxPerM / 72, pxPerCm, rows: [Math.round(FIG_ROWS[0] * k), Math.round(FIG_ROWS[1] * k)], headRow, aRow: headRow + 30 * pxPerCm, stakeIn: Math.round(STAKE_IN_PX * k) };
}
/** The calls under the holes in truth (their share). */
export const CALLS_K = 0.3;
/** A called mark's ring and a hole's mark (card px; the hole inside its ink rim). */
export const RING_PX = 5, HOLE_PX = 3;
/** The card's sizes (card px, square): CARD_W at --ui 1 and over, down to CARD_MIN at 1024 × 768's --ui 0.85, drawn at whole pixels in between (the runtime review of 0.0.10: the 200 px card resampled smooth to 170 smeared its marks and its words). */
export const CARD_MIN = 170;
/** The card's size for a --ui: CARD_W from 1, else its box's whole pixels, never under CARD_MIN (smaller boxes take CARD_MIN scaled). */
export const cardSize = (ui = 1) => (ui >= 1 ? CARD_W : Math.max(CARD_MIN, Math.min(CARD_W, Math.floor(CARD_W * ui + 1e-6))));
/** The figure's top (card px) at a card size: 14 at CARD_W, 6 at CARD_MIN, so the man-target's torso clears the words at both. */
export const figTop = (size = CARD_W) => Math.round(6 + Math.min(1, Math.max(0, (size - CARD_MIN) / (CARD_W - CARD_MIN))) * 8);
/**
 * Where the figure stands at a density and a card size (its top-left, card px): centred across, figTop down at the near band;
 * a farther band's smaller figure lower by half the rows it lacks, so the board stands on longer stakes.
 */
export function figAt(pxPerM = HIT_PX_PER_M, size = CARD_W, w = null) {
  const G = figGeom(pxPerM), dw = w ?? dollFor('threat', 'rifle', G.scale).pm.w, near = FIG_ROWS[1] - FIG_ROWS[0];
  return { x: Math.round((size - dw) / 2), y: figTop(size) + Math.round((near - (G.rows[1] - G.rows[0])) / 2) };
}
/** Where the figure stands at CARD_W at the near band (figAt's, kept for the tests and the samples). */
export const FIG_AT = Object.freeze({ x: 58, y: 14 });
/** The words: the 3 × 5 alphabet at WORDS_K pixels a font pixel, a row WORDS_ROW_PX apart; the headline in up to two rows, the coach's line in up to three. */
export const WORDS_K = 2, WORDS_ROW_PX = 12;
/** The colours: the glass, the paper, the amber of what you could tell, the board, its khaki, its ink, its stakes, the coach's words. */
export const HIT_C = Object.freeze({
  glass: 0x15161d, edge: 0x3a3f4e, paper: 0xefe9dc, faint: 0x9aa0ad, amber: GLOWS[0], plate: 0x14151c,
  khaki: 0xc9b48a, khakiShade: 0xa8925f, khakiInk: 0x5a4a2c, board: 0x2a2b31, stake: 0x6b5a40, said: 0xc9ced8,
});
/** The zones' print over the figure (their share of the board's ink). */
export const ZONES_K = 0.55;
const r = Math.round;
const DOLLS = new Map();
/** The doll for a turner's face at a doll scale: { pm, mask } (cached by face, holds and scale): 'armoured' in the plate carrier and helmet, a threat bare-headed with what he holds. */
function dollFor(face = 'threat', holds = 'rifle', scale = HIT_SCALE) {
  const key = `${face}|${holds}|${scale}`;
  if (DOLLS.has(key)) return DOLLS.get(key);
  const look = face === 'armoured' ? { outfit: 'carrier', skin: 'tan', hair: { style: 'highTight', color: 'dark' } } : { outfit: 'utilities', skin: face === 'noshoot' ? 'light' : 'tan', head: null, hair: { style: 'medium', color: 'dark' } };
  const pm = doll({ look, sex: 'm', hand: holds === 'rifle' || face === 'armoured' ? 'rifle' : null, scale });
  // (the figure's pixels, its ink round it included: those that are not the doll's wall and floor)
  const mask = new Uint8Array(pm.w * pm.h);
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) mask[y * pm.w + x] = pm.data[y * pm.w + x] !== word(backdropAt(x, y, scale)) ? 1 : 0;
  const out = { pm, mask };
  DOLLS.set(key, out);
  return out;
}
/** The dolls a turner's card may need made ahead (the scene's load), so the first card of a string is painted in one frame (the runtime review of 0.0.10: the first paint dropped a frame); at the near band unless a density is given. */
export function warmHitcard(faces = [['threat', 'rifle'], ['threat', 'pistol']], pxPerM = HIT_PX_PER_M) { for (const [f, h] of faces) dollFor(f, h, figGeom(pxPerM).scale); return DOLLS.size; }
const hexOf = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);

/** A man-target point (cm from the A zone's centre, y down) on the card at a density (card px, fractional): life size at that density, its head on the doll's head; size the card's. */
export function manToCard(xCm, yCm, pxPerM = HIT_PX_PER_M, { w = null, size = CARD_W } = {}) {
  const G = figGeom(pxPerM), dw = w ?? dollFor('threat', 'rifle', G.scale).pm.w, at = figAt(pxPerM, size, dw);
  return [at.x + dw / 2 + xCm * G.pxPerCm, at.y - G.rows[0] + G.aRow + yCm * G.pxPerCm];
}
/** The man-target's zones on the card at a density: { A: { x, y, w, h }, torso, head: { cx, cy, r } } (card px); man: paper.js PAPERS.man (null: none). */
export function zonesOnCard(pxPerM = HIT_PX_PER_M, man = null, { size = CARD_W } = {}) {
  if (!man?.zones) return null;
  const P = man, Z = P.zones, G = figGeom(pxPerM), box = (c, s) => { const [x0, y0] = manToCard(c[0] - s[0] / 2, c[1] - s[1] / 2, pxPerM, { size }), [x1, y1] = manToCard(c[0] + s[0] / 2, c[1] + s[1] / 2, pxPerM, { size }); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; };
  const [hx, hy] = manToCard(Z.head.at[0], Z.head.at[1], pxPerM, { size });
  return { A: box(P.centres.A, Z.A), torso: box(P.centres.torso, Z.torso), head: { cx: hx, cy: hy, r: Z.head.r * G.pxPerCm } };
}

// (a writer in the 3 × 5 alphabet at k pixels a font pixel; '·' a centred dot, which the alphabet lacks)
const DOT = Object.freeze(['0', '0', '1', '0', '0']);
const glyph = (ch) => (ch === '·' ? DOT : glyphOf(ch));
/** The width of a string at k (px). */
export const wordsW = (str, k = 1) => Math.max(0, [...String(str).toUpperCase()].reduce((a, ch) => a + (glyph(ch)[0].length + 1) * k, -k));

/**
 * The card (see the header): a Pixmap { w, h, data } with .marks [{ n, x, y, kind: 'ring' | 'seen' | 'hole', zone }] (each drawn
 * mark's centre, card px), .zones (zonesOnCard), .look ('B') and .band (HIT_BANDS' id). m: { face ('threat'), holds ('rifle'),
 * phase ('belief' | 'truth'), marks (hitMarks' marks), words, line, tabs: [{ label, on }], man (paper.js PAPERS.man: its zones
 * drawn), rangeM (the turner's range: its band; none, the near band), size }.
 */
export function paintHitcard(m = {}) {
  const truth = m.phase === 'truth', band = bandOf(m.rangeM), G = figGeom(band.pxPerM);
  const S = Number.isFinite(m.size) ? Math.max(CARD_MIN, Math.min(CARD_W, Math.round(m.size))) : CARD_W, W = S, H = S, data = new Uint32Array(W * H);
  const col = new Int32Array(W * H);                                 // (the colours as 0xrrggbb while painting, words at the end)
  const put = (x, y, c) => { x = r(x); y = r(y); if (x >= 0 && y >= 0 && x < W && y < H) col[y * W + x] = c; };
  const blend = (x, y, c, k) => { x = r(x); y = r(y); if (x >= 0 && y >= 0 && x < W && y < H) col[y * W + x] = mix(col[y * W + x], c, k); };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
  const write = (x, y, str, c, k = 1) => {
    for (const ch of String(str).toUpperCase()) { const g = glyph(ch); g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') rect(x + i * k, y + j * k, k, k, c); })); x += (g[0].length + 1) * k; }
    return x;
  };
  // (the words' strip at the foot, as tall as its rows (wordsRows); the figure from figAt, cut where the strip begins)
  const rows = wordsRows(m, S), figH = H - rows.h;
  // ---- the ground: the bay's dark under the board ----
  const { pm, mask } = dollFor(m.face, m.holds, G.scale);
  const at = figAt(band.pxPerM, S, pm.w), r0 = G.rows[0], r1 = Math.max(r0 + 1, Math.min(G.rows[1], r0 + figH - at.y));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) col[y * W + x] = y >= figH ? HIT_C.glass : mix(HIT_C.board, 0x3a3c45, y / figH * 0.6);
  // ---- the figure: the doll's outline and kit in the board's two tones ----
  for (let y = r0; y < Math.min(r1, pm.h); y++) for (let x = 0; x < pm.w; x++) {
    const i = y * pm.w + x;
    if (!mask[i]) continue;
    const c = hexOf(pm.data[i]);
    put(at.x + x, at.y + y - r0, c === INK ? HIT_C.khakiInk : lum(c) > 92 ? HIT_C.khaki : HIT_C.khakiShade);
  }
  // (the board's stakes, from its foot to the words' strip)
  const foot = at.y + r1 - r0;
  if (foot < figH) { rect(at.x + G.stakeIn, foot, STAKE_W_PX, figH - foot, HIT_C.stake); rect(at.x + pm.w - G.stakeIn - STAKE_W_PX, foot, STAKE_W_PX, figH - foot, HIT_C.stake); }
  // ---- the man-target's zones printed over the figure ----
  const zones = zonesOnCard(band.pxPerM, m.man, { size: S });
  if (zones) {
    const zc = HIT_C.khakiInk, zk = ZONES_K;
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
      rect(x, y, w, 9, t.on ? HIT_C.amber : HIT_C.edge);
      write(x + 3, y + 2, t.label, t.on ? HIT_C.plate : HIT_C.paper);
      x += w + 3;
    }
  }
  // ---- the words: the headline and the coach's line at WORDS_K, the size the card's headline always had (the runtime review of
  // 0.0.10: the line at one font pixel was 4 to 5 px on the screen, unreadable) ----
  rect(0, figH, W, 1, HIT_C.edge);
  let wy = figH + 6;
  for (const t of rows.head) { write(6, wy, t, HIT_C.paper, WORDS_K); wy += WORDS_ROW_PX; }
  if (rows.line.length) { wy += 4; for (const t of rows.line) { write(6, wy, t, HIT_C.said, WORDS_K); wy += WORDS_ROW_PX; } }
  // ---- the marks, over everything but the frame ----
  const drawn = [];
  // (a called mark: a RING_PX ring in amber inside a rim of the plate's dark, so it reads on the board; a seen one filled; at k
  // under 1, the colour alone blended in, the truth's call under its hole)
  const ring = (cx, cy, c, k = 1, fill = false) => {
    const h = (RING_PX - 1) / 2, o = h + 1, rimC = HIT_C.plate;
    if (k >= 1) for (let j = -o; j <= o; j++) for (let i = -o; i <= o; i++) { const edge = Math.abs(i) === o || Math.abs(j) === o, corner = Math.abs(i) >= h && Math.abs(j) >= h && (Math.abs(i) === o || Math.abs(j) === o); if (edge && !corner) put(cx + i, cy + j, rimC); }
    for (let j = -h; j <= h; j++) for (let i = -h; i <= h; i++) {
      const corner = Math.abs(i) === h && Math.abs(j) === h, rim = Math.abs(i) === h || Math.abs(j) === h;
      if (corner) { if (k >= 1) put(cx + i, cy + j, rimC); continue; }
      if (rim || fill) { if (k >= 1) put(cx + i, cy + j, c); else blend(cx + i, cy + j, c, k); }
      else if (k >= 1) put(cx + i, cy + j, rimC);
    }
  };
  // (a hole: ink inside the board's ink rim)
  const hole = (cx, cy) => {
    const h = (HOLE_PX - 1) / 2 + 1;
    for (let j = -h; j <= h; j++) for (let i = -h; i <= h; i++) { if (Math.abs(i) === h && Math.abs(j) === h) continue; put(cx + i, cy + j, Math.abs(i) === h || Math.abs(j) === h ? HIT_C.khakiInk : INK); }
  };
  const list = Array.isArray(m.marks) ? m.marks : [];
  const where = (p) => manToCard(p[0], p[1], band.pxPerM, { w: pm.w, size: S });
  // (truth: the calls under the holes first, at CALLS_K; then the holes; belief: the rings, a seen one filled)
  if (truth) for (const mk of list) if (mk.hole && mk.called) { const [x, y] = where(mk.called); ring(r(x), r(y), HIT_C.amber, CALLS_K); }
  for (const mk of list) {
    if (truth) {
      if (!mk.hole) continue;
      const [x, y] = where(mk.hole), cx = r(x), cy = r(y);
      hole(cx, cy);
      drawn.push({ n: mk.n, x: cx, y: cy, kind: 'hole', zone: mk.zone ?? null });
    } else {
      if (!mk.called) continue;
      const [x, y] = where(mk.called), cx = r(x), cy = r(y);
      ring(cx, cy, HIT_C.amber, 1, !!mk.seen);
      drawn.push({ n: mk.n, x: cx, y: cy, kind: mk.seen ? 'seen' : 'ring', zone: null });
    }
  }
  // (each mark's number on its plate, placed where it meets no other number and no other mark: upper right first, then the
  // other corners and the sides, further out where the near ones are taken (the runtime review of 0.0.10: a Pair's numbers
  // sat on each other, '2' hidden under '1' and '4'))
  const plates = tagPlaces(drawn, { W, H: figH, wordsW });
  for (const [i, d] of drawn.entries()) {
    const p = plates[i];
    rect(p.x - 1, p.y - 1, p.w + 2, 7, HIT_C.plate);
    write(p.x, p.y, String(d.n), HIT_C.paper);
    d.tag = { x: p.x - 1, y: p.y - 1, w: p.w + 2, h: 7 };
  }
  // ---- the frame ----
  for (let x = 0; x < W; x++) { col[x] = HIT_C.edge; col[(H - 1) * W + x] = HIT_C.edge; }
  for (let y = 0; y < H; y++) { col[y * W] = HIT_C.edge; col[y * W + W - 1] = HIT_C.edge; }
  for (let i = 0; i < W * H; i++) data[i] = word(col[i]);
  return { w: W, h: H, data, repeat: false, key: null, glows: false, look: 'B', band: band.id, pxPerM: band.pxPerM, size: S, marks: drawn, zones, words: rows };
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
