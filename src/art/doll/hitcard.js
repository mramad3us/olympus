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
// 0.0.18 (the build sheet 0.0.18 §2.2, §3; the user, 2026-11-15: the target view "for every time we're engaging something or
// someone", people "rendered ... as we see them, meaning with their gear"): the card's subject, m.subject, else the board of
// m.face and m.holds as before (so every model built before paints the same). A board ({ kind: 'board', face, holds }) is the
// doll of ./dress.js dressOf(standGear) in the khaki's two tones, the rifle's and the armoured faces to the pixel as before;
// a pistol threat now holds the P-12 (an armoured face's too, v0.0.20: the house draws its hand as any threat's) (it was drawn empty-handed; a painted pistol has no holster), a no-shoot with a phone the
// phone, an unseen hand nothing, the armoured face's too (the words say "HANDS NOT SEEN"); the hostage card is two painted men,
// the hostile the man-target (centred, the head's circle on his head) and the hostage in front of him (light skin, empty hands)
// HOSTAGE_DX_PX to the side, so his head and his gun hand show beside the hostage's: he is drawn mirrored when she stands at the
// viewer's left, so his gun hand is always on the side away from her, and what he holds (a pistol, a rifle, or nothing when his
// hands were not seen) reads as on a threat's board, the card cut at mid-thigh (sample H). A man ({ kind: 'man',
// gear, person, key }) is the dressed doll (src/sim/arms/gear.js gearOf, dress.js) in its own colours on the card's dark,
// no stakes and no zones (VIEWS §7.7's option A). A mark of your #2's ({ kind: 'two' }, truth only) is drawn unnumbered, its
// hole in the board's ink at TWO_K: the house's truth phase, which the HUD's view does not show (it closes at the lane's end) and
// the end card's truth cards (the build sheet's C4, not built) will.
// v0.0.19 (the build sheet 0.0.19 §1 L-look; opfor §2.6): THE PAINT. A marking round leaves paint, so a mark with `paint`
// ('team': a round of the stack on a role-player, in the cadre's pink; 'rp': a role-player's on a marine, in blue: PAINT_C) is
// drawn as paint, by the look the user scores (samples/opfor-look, PAINT_LOOKS): P1 (the default) a splat, a round blob of the
// colour PAINT_PX across with a darker rim at its foot and two drops thrown off it by the mark's number; P2 the ring as for paper,
// filled with the paint where it was seen. In belief a round seen to strike is painted at its called point (paint can be seen to
// land: the man wears it), one not seen is the amber ring as before; in truth at its hole. A mark without `paint` is drawn as it
// always was, so every board's card, the four B goldens and "Bang" are unchanged.
// v0.0.24 (the build sheet v0.0.24 items 14 to 16; P§3.3): THE CARD AS YOU WOULD SEE HIM. A subject's record carries his light and
// the jamb's share (src/sim/people/seen.js: light from lightLevel at his feet, cover from the page's rays): below LIGHT_FULL_K the
// figure's pixels are darkened by lightK (portrait.js litPixel, L1: never below LIGHT_FLOOR_K), so room 3's dim (0.40) draws him
// at 0.53 and the lit rooms (0.75) and "Bang" (1.0) byte for byte as before (a board's gun keeps the board's ink, so it reads in
// any light: F89); the share a jamb hides from a side is drawn as the
// wall over him (J1, portrait.js jambOver), the marks on top (they are the sim's); hidden whole, he is drawn whole, as last seen. Side on, the marks on the man-target's plane
// are drawn at the cosine of his yaw from the figure's middle (a man seen at 67.5° has the board's width at 0.38); from behind,
// as on the front (P's call: a man-target has no back). A man's card's ground is target-view's L pick (MAN_GROUND_PICKS, L-a the
// dark until scored: the user's "use what makes sense again depending on distance" of 2026-11-19 was held-devices' T group, the
// throw, F's to build, not the target view, whose groups are F, L and H; a model's own ground wins). None of it enters the doll's
// key: a man walking through a lamp's pool repaints the card, never the doll.
import { word } from '../paint.js';
import { glyphOf } from '../font.js';
import { GLOWS } from '../palette.js';
import { doll } from './doll.js';
import { dressOf, dressedReady } from './dress.js';
import { INK, mix, lum } from './grid.js';
import { paintPortrait, portraitReady, maskOf, boardGear, boardLook, PORTRAIT_HOLD, PORTRAIT_PICKS, BANG_BOARD_HOLD, BOARD_PLACES, HOSTAGE_PLACES, jambOver, litPixel, lightK as litK, turnFigure, rollDrawn } from './portrait.js';

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
/** Your #2's holes in truth: the board's ink at this share (VIEWS §7.7: the team's hits as seen, apart from yours). */
export const TWO_K = 0.6;
/** The hostage card: the hostile behind the hostage, this far to the side at the near band (card px; sample H picks the side). */
export const HOSTAGE_DX_PX = 14;
/** The marking rounds' paint (v0.0.19, see the header): the cadre's pink on a role-player, blue on a marine; their rims in shade. */
export const PAINT_C = Object.freeze({ team: 0xe8489a, rp: 0x3f86e8 });
/** The paint's looks to score (samples/opfor-look): P1 a splat (the default), P2 the paper's ring filled with the paint. */
export const PAINT_LOOKS = Object.freeze({ P1: 'splat', P2: 'ring' }), PAINT_LOOK = 'P1';
/** A splat's blob across (card px, odd), and its drops' offsets by the mark's number (two of these four, card px from its centre). */
export const PAINT_PX = 5;
const DROPS = Object.freeze([[4, -3], [-4, 2], [3, 4], [-3, -4]]);
const r = Math.round;
const DOLLS = new Map();
// (a man's card's mask by his dressed doll (the build sheet §1 item 15; the perf lens's P9): dress.js keeps the dolls,
// DOLL_LRU of them, and the mask goes with its doll when the LRU lets it go (portrait.js maskOf keeps it by its doll))
// (the board's painted man and his look are portrait.js boardGear and boardLook, shared with the portrait)
/**
 * The doll for a turner's face at a doll scale: { pm, mask, held } (cached by face, holds, scale and the place of his gun): see the
 * header. place: 'hand' ("Bang"'s, BANG_BOARD_HOLD) or 'ready' (the house's, W1); hostage: the H pick's places for the hostile.
 */
function dollFor(face = 'threat', holds = 'rifle', scale = HIT_SCALE, side = 'right', place = 'hand', hostage = 'H1') {
  const key = `${face}|${holds}|${scale}${face === 'hostage' && side === 'left' ? '|left' : ''}${place === 'hand' ? '' : `|${place}`}${face === 'hostage' && place !== 'hand' && hostage !== 'H1' ? `|${hostage}` : ''}`;
  if (DOLLS.has(key)) return DOLLS.get(key);
  let pm, held, cover = null;
  if (face === 'hostage') {
    // (the hostile is the man-target, centred, its head circle on his head; the hostage in front of him, HOSTAGE_DX_PX to the side
    // and a little lower, so his head and his gun hand show beside the hostage's: side 'right' puts the hostile at the viewer's right)
    // (on the house's card his gun as portrait-gun's H decides, H1 his pistol raised at her head, a rifle up at the high ready)
    const places = place === 'hand' ? null : HOSTAGE_PLACES[hostage] ?? HOSTAGE_PLACES.H1;
    const back = doll({ ...dressOf(boardGear('threat', holds === 'rifle' || holds === 'unseen' ? holds : 'pistol', place, places), { look: boardLook('threat'), sex: 'm' }), scale }), front = doll({ ...dressOf(boardGear('hostage', 'hands'), { look: boardLook('hostage'), sex: 'm' }), scale });
    // (his gun hand is his right, at the viewer's left: with the hostage at the viewer's left he is drawn mirrored, so what he holds
    // is on the side away from her and shows)
    const dx = (side === 'left' ? 1 : -1) * r(HOSTAGE_DX_PX * scale / HIT_SCALE), dy = r(3 * scale / HIT_SCALE), fm = maskOf(front, scale), data = new Uint32Array(back.data);
    const bh = back.held ?? new Uint8Array(back.w * back.h);
    held = new Uint8Array(bh);
    // (the user's report of 2026-11-19: the pixels that are hers, so his zones are printed only on him (paintHitcard))
    cover = new Uint8Array(back.w * back.h);
    if (side !== 'left') for (let y = 0; y < back.h; y++) for (let x = 0; x < back.w; x++) { data[y * back.w + x] = back.data[y * back.w + back.w - 1 - x]; held[y * back.w + x] = bh[y * back.w + back.w - 1 - x]; }
    for (let y = 0; y < back.h; y++) for (let x = 0; x < back.w; x++) {
      const i = y * back.w + x, sx = x - dx, sy = y - dy, j = sy * front.w + sx;
      if (sx < 0 || sy < 0 || sx >= front.w || sy >= front.h || !fm[j]) continue;
      data[i] = front.data[j]; held[i] = 0; cover[i] = 1;
    }
    pm = { ...back, data };
  } else {
    // (the board's painted man: v0.0.17's arguments exactly where the gear adds nothing (a rifle in the hand, empty hands))
    pm = doll({ ...dressOf(boardGear(face, holds, place), { look: boardLook(face), sex: 'm' }), scale });
    held = pm.held;
  }
  const out = { pm, mask: maskOf(pm, scale), held: held ?? new Uint8Array(pm.w * pm.h), ...(cover ? { cover } : {}) };
  DOLLS.set(key, out);
  return out;
}
/** A card's subject's doll at a scale: { pm, mask, held, colour } (a board's in khaki, a man's in his own colours): see the header. */
function subjectDoll(subject, scale, { place = 'hand', picks = null } = {}) {
  if (subject?.kind === 'man') {
    // (the man as the record has him, portrait.js's; a model with a gear and no record (v0.0.22's) is the record standing)
    const rec = subject.rec ?? { kind: 'man', gear: subject.gear, hold: null, pose: 'stand', facing: 'front' };
    const P = paintPortrait(rec, subject.person ?? {}, { scale, picks });
    return { pm: P.pm, mask: P.mask, held: P.held, colour: true };
  }
  const P = { ...PORTRAIT_PICKS, ...(picks ?? {}) };
  return dollFor(subject?.face ?? 'threat', subject?.holds ?? 'rifle', scale, subject?.side ?? (P.hostageSide === 'H-b' ? 'left' : 'right'), place, P.hostage);
}
/** A man's card's ground (sample L): 'dark', the board's bay dark (L-a, the default), or 'lifted' toward the board's khaki so amber rings read (L-b). */
export const MAN_GROUNDS = Object.freeze({ dark: 0, lifted: 0.35 });
/**
 * v0.0.25 (the user's word of 2026-11-19 on the picks, "just pick what you will, I'll revise what I find weird in game, use what makes
 * sense again depending on distance"; my call, overrulable): a man's card's ground by the range to him, by the card's band (HIT_BANDS:
 * near to 10 m, mid to 25 m, far beyond): the dark (L-a) near and mid, the lifted ground (L-b) far, where the man is drawn at 64 px a
 * metre and the amber rings on a black suit are smallest. A pick on the To score page (picks.ground) or a subject's own ground wins.
 */
export const MAN_GROUND_BY_BAND = Object.freeze({ near: 'L-a', mid: 'L-a', far: 'L-b' });
/** A man's card's ground by target-view's L pick (PORTRAIT_PICKS.ground: L-a, the dark, until the user scores the set). */
export const MAN_GROUND_PICKS = Object.freeze({ 'L-a': 'dark', 'L-b': 'lifted' });
/** The dolls a turner's card may need made ahead (the scene's load), so the first card of a string is painted in one frame (the runtime review of 0.0.10: the first paint dropped a frame); at the near band unless a density is given. */
export function warmHitcard(faces = [['threat', 'rifle'], ['threat', 'pistol']], pxPerM = HIT_PX_PER_M, { place = BANG_BOARD_HOLD } = {}) { for (const [f, h] of faces) dollFor(f, h, figGeom(pxPerM).scale, 'right', place); return DOLLS.size; }
/** The board dolls painted so far (the target view's test: no frame paints more than one new doll; a man's is dress.js's, dollCount). */
export const hitDollCount = () => DOLLS.size;
/** Whether a subject's doll is painted already at a density (the target view paints at most one new doll a frame). */
export function hitDollReady(subject, pxPerM = HIT_PX_PER_M, { picks = null } = {}) {
  const scale = figGeom(pxPerM).scale;
  if (subject?.kind === 'man') return subject.rec ? portraitReady(subject.rec, subject.person ?? {}, scale, picks) : dressedReady(subject.gear, subject.person ?? {}, scale);
  return DOLLS.has(`${subject?.face ?? 'threat'}|${subject?.holds ?? 'rifle'}|${scale}`) || DOLLS.has(`${subject?.face ?? 'threat'}|${subject?.holds ?? 'rifle'}|${scale}|${BOARD_PLACES[(picks ?? PORTRAIT_PICKS).where ?? 'W1'] ?? 'ready'}`);
}
const hexOf = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);

/** A man-target point (cm from the A zone's centre, y down) on the card at a density (card px, fractional): life size at that density, its head on the doll's head; size the card's. */
export function manToCard(xCm, yCm, pxPerM = HIT_PX_PER_M, { w = null, size = CARD_W } = {}) {
  const G = figGeom(pxPerM), dw = w ?? dollFor('threat', 'rifle', G.scale).pm.w, at = figAt(pxPerM, size, dw);
  return [at.x + dw / 2 + xCm * G.pxPerCm, at.y - G.rows[0] + G.aRow + yCm * G.pxPerCm];
}
/**
 * Whether a man-target point (cm, as manToCard's) is on the hostage as the hostage card draws her (v0.0.25, the user's report of
 * 2026-11-19): her pixels in front of the hostile at a density, a side ('right': she at the viewer's left, H-a) and his gun's place.
 */
export function onHostage(xCm, yCm, { side = 'right', pxPerM = HIT_PX_PER_M, holds = 'pistol', place = BOARD_PLACES[PORTRAIT_PICKS.where] ?? 'ready', hostage = PORTRAIT_PICKS.hostage, size = CARD_W } = {}) {
  const G = figGeom(pxPerM), D = dollFor('hostage', holds, G.scale, side, place, hostage), pm = D.pm;
  const shift = pm.anchors ? r(pm.anchors.aZone[1] - G.aRow) : 0, at = figAt(pxPerM, size, pm.w), r0 = G.rows[0] + shift;
  const [cx, cy] = manToCard(xCm, yCm, pxPerM, { size }), dx = r(cx) - at.x, dy = r(cy) - at.y + r0;
  return dx >= 0 && dy >= 0 && dx < pm.w && dy < pm.h && !!D.cover?.[dy * pm.w + dx];
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
  // (a board with no subject is "Bang"'s, its painted man as starred (BANG_BOARD_HOLD); the house's boards hold the gun at
  // the ready, W1 (portrait.js); the picks are the defaults or the To score page's live ones (m.picks, never saved))
  const picks = { ...PORTRAIT_PICKS, ...(m.picks ?? {}) }, place = m.subject ? BOARD_PLACES[picks.where] ?? 'ready' : BANG_BOARD_HOLD;
  const subject = m.subject ?? { kind: 'board', face: m.face, holds: m.holds }, { pm, mask, colour, held, cover } = subjectDoll(subject, G.scale, { place, picks });
  // (a posed doll's body set down by its pose (or drawn from behind, its anchors back.js's): the crop follows the doll's own A zone,
  // so the man-target's zones and marks stay where the sim put them on him; standing front on, no shift, the card as before)
  const shift = pm.anchors ? r(pm.anchors.aZone[1] - G.aRow) : 0;
  const at = figAt(band.pxPerM, S, pm.w), r0 = G.rows[0] + shift, r1 = Math.max(r0 + 1, Math.min(G.rows[1] + shift, r0 + figH - at.y));
  const ground = subject.ground ?? MAN_GROUND_PICKS[m.picks?.ground ?? MAN_GROUND_BY_BAND[band.id] ?? picks.ground] ?? 'dark', lift = colour ? MAN_GROUNDS[ground] ?? 0 : 0;
  // (his light, the jamb's share and the yaw side on, from the record (see the header))
  const rec = subject.rec ?? null, level = Number.isFinite(rec?.light?.level) ? rec.light.level : null, hid = rec?.cover ?? null;
  const yawK = rec && (rec.facing === 'left' || rec.facing === 'right') && Number.isFinite(rec.yawQ) ? Math.abs(Math.cos(rec.yawQ)) : 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) col[y * W + x] = y >= figH ? HIT_C.glass : mix(mix(HIT_C.board, 0x3a3c45, y / figH * 0.6), HIT_C.khakiShade, lift);
  // ---- the figure: the doll's outline and kit in the board's two tones; v0.0.23, what the hands hold in the board's dark ink
  // (PORTRAIT_HOLD, G1; G2 its own colours; G3 the ink with a rim of khaki where it meets the figure); V2 veils a man's held pixels
  // while your take-in has not read his hands ----
  // ("Bang"'s board as starred keeps its two tones, the gun with them, until question 1's yes)
  const inked = !!m.subject || BANG_BOARD_HOLD !== 'hand';
  const tone = picks.gun === 'G2' ? null : PORTRAIT_HOLD, rim = picks.gun === 'G3', veil = colour && picks.unread === 'V2' && m.live?.holds === 'unseen';
  const isHeld = (x, y) => x >= 0 && y >= 0 && x < pm.w && y < pm.h && !!held?.[y * pm.w + x];
  let gunIn = 0, gunAll = 0, fx0 = Infinity, fx1 = -Infinity;
  // (the tests' read of the hostage's pixels on the card (m.herMask), v0.0.25)
  const her = cover && m.herMask ? new Uint8Array(W * H) : null;
  if (held && inked) for (let i = 0; i < held.length; i++) if (held[i]) gunAll++;
  for (let y = r0; y < Math.min(r1, pm.h); y++) for (let x = 0; x < pm.w; x++) {
    const i = y * pm.w + x;
    if (!mask[i]) continue;
    const c = hexOf(pm.data[i]), hd = inked && !!held?.[i];
    let out = colour ? c : c === INK ? HIT_C.khakiInk : lum(c) > 92 ? HIT_C.khaki : HIT_C.khakiShade;
    if (hd && !colour && tone) out = rim && !(isHeld(x - 1, y) && isHeld(x + 1, y) && isHeld(x, y - 1) && isHeld(x, y + 1)) ? HIT_C.khaki : lum(c) > 120 ? tone.lit : tone.ink;
    if (hd && !colour && !tone) out = c;
    if (hd && veil) out = (x + y) % 2 ? mix(HIT_C.board, 0x3a3c45, 0.3) : c;
    if (hd) gunIn++;
    // (his light on the figure; a board's gun keeps its ink, so it reads in any light (F89's tones))
    put(at.x + x, at.y + y - r0, level === null || (hd && !colour && tone) ? out : litPixel(out, level));
    if (her && cover[i]) { const cx = r(at.x + x), cy = r(at.y + y - r0); if (cx >= 0 && cy >= 0 && cx < W && cy < H) her[cy * W + cx] = 1; }
    if (x < fx0) fx0 = x;
    if (x > fx1) fx1 = x;
  }
  // (the board's stakes, from its foot to the words' strip; a man stands on none)
  const foot = at.y + r1 - r0;
  if (foot < figH && !colour) { rect(at.x + G.stakeIn, foot, STAKE_W_PX, figH - foot, HIT_C.stake); rect(at.x + pm.w - G.stakeIn - STAKE_W_PX, foot, STAKE_W_PX, figH - foot, HIT_C.stake); }
  // ---- v0.0.24: the jamb over the share of him it hides (J1), before the zones and the marks ----
  // (a man the walls hide whole is drawn whole, as last seen: the card held after you engaged him, never a card of wall (my call))
  const jamb = hid && (hid.left > 0 || hid.right > 0) && (hid.left ?? 0) + (hid.right ?? 0) < 1 && fx1 >= fx0 ? jambOver(col, W, { fx0: at.x + fx0, fx1: at.x + fx1, y0: 1, y1: figH, left: hid.left, right: hid.right }) : 0;
  // ---- the man-target's zones printed over the figure ----
  const zones = colour ? null : zonesOnCard(band.pxPerM, m.man, { size: S });
  // (the user's report of 2026-11-19 on the hostage card, "kind of looks like the hit zone partly covers the hostage's head": on
  // it his zones are printed only on his own visible pixels, never on hers nor on the board round them, the jamb's way: a card pixel
  // is his where the doll's mask is set and the hostage's (cover) is not)
  const hisOnly = cover ? (x, y) => { const dx = r(x) - at.x, dy = r(y) - at.y + r0; if (dx < 0 || dy < r0 || dx >= pm.w || dy >= Math.min(r1, pm.h)) return false; const i = dy * pm.w + dx; return !!mask[i] && !cover[i]; } : null;
  let zonesOnHer = 0;
  if (zones) {
    const zc = HIT_C.khakiInk, zk = ZONES_K;
    const zblend = hisOnly ? (x, y, c, k) => { if (hisOnly(x, y)) blend(x, y, c, k); else zonesOnHer++; } : blend;
    const outline = (b) => { for (let i = 0; i <= r(b.w); i++) { zblend(b.x + i, b.y, zc, zk); if (b.y + b.h < figH) zblend(b.x + i, b.y + b.h, zc, zk); } for (let j = 1; j < r(b.h) && b.y + j < figH; j++) { zblend(b.x, b.y + j, zc, zk); zblend(b.x + b.w, b.y + j, zc, zk); } };
    outline(zones.A); outline(zones.torso);
    const h = zones.head, n = Math.max(16, r(h.r * 8));
    const seen = new Set();
    for (let t = 0; t < n; t++) { const x = r(h.cx + Math.cos(t / n * 2 * Math.PI) * h.r), y = r(h.cy + Math.sin(t / n * 2 * Math.PI) * h.r), k = `${x},${y}`; if (!seen.has(k)) { seen.add(k); zblend(x, y, zc, zk); } }
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
  // (side on, the board's plane foreshortened about the figure's middle by the cosine of his yaw (v0.0.24))
  // (the hostage card drawn H-b, she at the viewer's right, is the sim's card mirrored (paper.js hostageHead puts her at x < 0),
  // so its marks are mirrored with it: a head hole scored on him stays on him)
  const flipX = subject.face === 'hostage' && (subject.side ?? (picks.hostageSide === 'H-b' ? 'left' : 'right')) === 'left' ? -1 : 1;
  const midX = at.x + pm.w / 2, where = (p) => { const [x, y] = manToCard(flipX * p[0], p[1], band.pxPerM, { w: pm.w, size: S }); return [midX + (x - midX) * yawK, y]; };
  // (truth: the calls under the holes first, at CALLS_K; then the holes; belief: the rings, a seen one filled)
  if (truth) for (const mk of list) if (mk.hole && mk.called) { const [x, y] = where(mk.called); ring(r(x), r(y), HIT_C.amber, CALLS_K); }
  // (0.0.18: your #2's holes in truth, under yours, unnumbered, in the board's ink at TWO_K)
  if (truth) for (const mk of list) if (mk.kind === 'two' && mk.hole) {
    const [x, y] = where(mk.hole), cx = r(x), cy = r(y), h = (HOLE_PX - 1) / 2 + 1;
    // (v0.0.19: your #2's paint on a role-player, his colour at TWO_K, unnumbered)
    if (mk.paint) { for (let j = -h; j <= h; j++) for (let i = -h; i <= h; i++) if (!(Math.abs(i) === h && Math.abs(j) === h)) blend(cx + i, cy + j, PAINT_C[mk.paint] ?? PAINT_C.team, TWO_K); continue; }
    for (let j = -h; j <= h; j++) for (let i = -h; i <= h; i++) if (!(Math.abs(i) === h && Math.abs(j) === h)) blend(cx + i, cy + j, Math.abs(i) === h || Math.abs(j) === h ? HIT_C.khakiInk : INK, TWO_K);
  }
  // (v0.0.19: paint, by the look scored (PAINT_LOOKS): the splat, or the ring filled with the paint)
  const paintLook = PAINT_LOOKS[m.paintLook] ?? PAINT_LOOKS[PAINT_LOOK];
  const splat = (cx, cy, c, n) => {
    const h = (PAINT_PX - 1) / 2, rim = mix(c, INK, 0.45), lit = mix(c, 0xffffff, 0.3);
    for (let j = -h; j <= h; j++) for (let i = -h; i <= h; i++) {
      if (Math.abs(i) === h && Math.abs(j) === h) continue;
      put(cx + i, cy + j, j === h || (i === h && j > 0) ? rim : i <= 0 && j < 0 ? lit : c);
    }
    const k = ((Number(n) || 0) * 3) % DROPS.length;
    for (const [dx, dy] of [DROPS[k], DROPS[(k + 1) % DROPS.length]]) { put(cx + dx, cy + dy, c); put(cx + dx + 1, cy + dy, rim); }
  };
  for (const mk of list) {
    if (mk.kind === 'two') continue;
    const pc = mk.paint ? PAINT_C[mk.paint] ?? PAINT_C.team : null;
    if (pc !== null) {
      const at = truth ? mk.hole : mk.seen ? mk.called : null, ring0 = !truth && !mk.seen ? mk.called : null;
      if (at) {
        const [x, y] = where(at), cx = r(x), cy = r(y);
        if (paintLook === 'ring') ring(cx, cy, pc, 1, true); else splat(cx, cy, pc, mk.n);
        drawn.push({ n: mk.n, x: cx, y: cy, kind: 'paint', zone: truth ? mk.zone ?? null : null, paint: mk.paint });
      } else if (ring0) {
        const [x, y] = where(ring0), cx = r(x), cy = r(y);
        ring(cx, cy, HIT_C.amber, 1, false);
        drawn.push({ n: mk.n, x: cx, y: cy, kind: 'ring', zone: null });
      }
      continue;
    }
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
  // ---- v0.0.25 (R-a, portrait.js turnFigure): a subject upside down or on his side to you, the figure and all on him (his marks,
  // their numbers, the zones) turned by the record's roll in the figure's part of the card, the words and the frame upright; roll 0
  // or R-b: nothing here, the card as before to the pixel ----
  const roll = rollDrawn(subject.rec?.roll ?? 0, picks), turned = roll ? turnFigure(col, W, figH, roll) : null;
  if (turned) for (const d of drawn) { [d.x, d.y] = turned.map(d.x, d.y); if (d.tag) { const [tx, ty] = turned.map(d.tag.x, d.tag.y); d.tag = { ...d.tag, x: Math.min(tx, tx - d.tag.w + 1), y: Math.min(ty, ty - d.tag.h + 1) }; } }
  // ---- the frame ----
  for (let x = 0; x < W; x++) { col[x] = HIT_C.edge; col[(H - 1) * W + x] = HIT_C.edge; }
  for (let y = 0; y < H; y++) { col[y * W] = HIT_C.edge; col[y * W + W - 1] = HIT_C.edge; }
  for (let i = 0; i < W * H; i++) data[i] = word(col[i]);
  return { w: W, h: H, data, repeat: false, key: null, glows: false, look: 'B', band: band.id, pxPerM: band.pxPerM, size: S, marks: drawn, zones, ...(cover ? { zonesOffHim: zonesOnHer } : {}), ...(her ? { her } : {}), words: rows, subject: subject.kind ?? 'board', gun: { inCrop: gunIn, all: gunAll }, place,
    lit: level === null ? 1 : litK(level), jamb, yawK, ground: colour ? ground : null, roll, halved: !!turned?.halved,
    anchors: pm.anchors ? { head: [at.x + pm.anchors.head[0], at.y + pm.anchors.head[1] - r0], aZone: [at.x + pm.anchors.aZone[0], at.y + pm.anchors.aZone[1] - r0] } : null };
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
