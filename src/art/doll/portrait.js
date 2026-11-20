// OLYMPUS art: the portrait, a person drawn as you see them, from the Seen record (VIEWS §4.2 to §4.4, §7.7; the build sheet v0.0.23 §3.3, items 1 to 5).
//
// The user's note of 2026-11-17 (scoring "Stack and clear" on seed 4028068471): "the portrait of the NPC holding a gun does not
// display the gun they are holding, the portraits need to be more dynamic and show us what we would be seeing, including what they
// are holding". With their ask of 2026-11-15: "the I and C menu preview of the character should show the currently worn gear ...
// when we start fighting real NPCs, they will have to be rendered in the target preview as we see them, meaning with their gear".
//
// One record, src/sim/people/seen.js seenOf's (what you see of a person now: the gear worn, what each hand holds and how, the pose,
// the facing from your eye, the range, what your take-in read), is handed here as plain data (art reads no sim module: the names of
// the holds, poses and facings are src/data/portrait.js's). paintPortrait(rec, person, opts) is the dressed doll (./dress.js) of that
// record at the card's scale: his gear, his hold on the gear's places (./worn.js holdGear: the rifle at the low or high ready, aimed
// at you end on or away across the body, slung; the pistol at the low or high ready, aimed, in the press check, the hand on the
// holster; a device, a phone, a magazine; the hands up or empty), his pose (./doll.js POSE_BENDS: standing, kneeling, sitting,
// cowering, prone) and his facing (from behind, A's ./back.js; side on, the head turned: F3). A board's record (seen.js standSeen)
// is the painted man of the stand (boardGear: written here, art reads no sim), his gun where the stage paints it (W1).
// What the hands hold is its own part set on the doll (pm.held), so the hit card tones exactly those pixels: PORTRAIT_HOLD, the
// board's dark ink (G1), where the khaki's two tones lost every gun before (P§1: 79 changed pixels on the near band, none read).
// The picks (PORTRAIT_PICKS: the defaults of samples/portrait-gun, portrait-pose, portrait-facing and portrait-light until the user
// scores them; the Esc menu's To score page swaps some in live through opts.picks, never saved) and the ship switches
// (PORTRAIT_POSES, PORTRAIT_FACING: false draws every card standing, or front on, as v0.0.22) are read at the paint.
// v0.0.24 (the build sheet v0.0.24 items 14 to 19; the overhaul's second round): the picks of v0.0.23's sets applied, none of them
// scored yet, so each at its default (PORTRAIT_PICKS: the back F1 and the side F3, the card's body R1, the light L1, the jamb J1, the
// suit's backdrop D-a, the truth cards T-a, the boots B-b, the anchor H-a): a pick is the one line here. drawnRec turns a side card
// into the profile only on F2 and a back card into the front only if the back is ever unpicked. The card in his light and behind
// the jamb is the hit card's paint (./hitcard.js, from the record's light and cover, never the doll's key): lightK (src/data/
// portrait.js: the level over LIGHT_FULL_K, never below LIGHT_FLOOR_K, the sample's L1) darkens the figure, JAMB_C draws the jamb
// over the hidden share (J1, the house's wall with its lit edge toward you), the marks on top. cardBackdrop is the I and C cards'
// ground by the place (D-a, the doll's own wall, v0.0.24's; D-b the place's tones, the game's from v0.0.28, the user's star of
// 2026-11-20; D-c with a rim of the place's light on the suit: samples/portrait-suit's, lifted). The user's standing rule of 2026-11-19 holds over each: "keep things simple,
// it's a game. I love the attention do detail, but only if it won't impact gameplay or performance (or introduce so much
// complexity it creates bugs)".
// v0.0.25 (the build sheet item 12, §3.4; PC§5): a man or a board upside down to you is drawn as you see him (R-a, samples/portrait-
// faces' default until scored): the record's roll (src/sim/people/seen.js: the quarter turns between his up and yours) turns the
// card's figure, its marks and their numbers with him, about the figure's box (turnFigure, the sample's own rule: whole pixels, no
// resampling, the ground's wash left upright, a quarter turn halved where it would not fit), the words and the frame upright; R-b
// draws him upright and names his face in the words (ROLL_FACE_WORDS). Your own I and C cards are the mirror's, never turned.
// v0.0.28 (the user's stars of 2026-11-20, R-a and R-b both): R-a's card names his face in its words too (ROLL_NAMED).
// v0.0.28 (the user's picks of 2026-11-20: "I need you to be serious about this ... please, make an effort for quality"): the
// defaults redrawn, the old kept drawable for the samples: aimed at you through the sights (A3, P3: ./held.js), a man side on a
// true profile (F4: ./side.js, the facing 'sideR' or 'sideL'), his hands not read veiled from the collar down (V3: hitcard.js
// UNREAD_ROW), sitting drawn whole (D3), the hostage card's hostile (H1 rebuilt, H0 v0.0.27's), every gun in its own colours (G2).
// Pure but the caches (./dress.js's LRU, the masks by doll).
import { word } from '../paint.js';
import { backdropAt } from './doll.js';
import { dressedDoll, dressedReady, dollKey } from './dress.js';
import { INK, mix } from './grid.js';
import { LIGHT_FULL_K, LIGHT_FLOOR_K, lightK } from '../../data/portrait.js';

/** The light's numbers (src/data/portrait.js's: one home, read by the record and the card). */
export { LIGHT_FULL_K, LIGHT_FLOOR_K, lightK };

/** The gun's tones on a board (G1, the board's dark ink, as the stage paints a turner's hold: its lit pixels a step lighter). */
export const PORTRAIT_HOLD = Object.freeze({ ink: 0x2a2216, lit: 0x3d3220 });
/** The looks drawn until the user scores them (the build sheet v0.0.23 §5: the samples' defaults). */
export const PORTRAIT_PICKS = Object.freeze({ gun: 'G2', where: 'W1', hostage: 'H1', aim: 'A3', pistol: 'P3', kneel: 'K1', down: 'D3', cower: 'C1', prone: 'Y-p', back: 'F1', side: 'F4', unread: 'V3',
  // (the rest of v0.0.23's sets, each at its default until scored (the build sheet v0.0.24 item 14): the card's body
  // (portrait-facing R), his light and the jamb (portrait-light L, J), the I and C cards' ground (portrait-suit D), the truth
  // cards' layout (truth-cards T), the boots and the anchor (mag-boots B, H), the hostage card's side and a man's card's ground
  // (target-view H, L))
  // (the user's stars of 2026-11-20: the place's backdrop behind you on the I and C cards (portrait-suit D-b), the heavier
  // sole (mag-boots B-a: templates.js MAG_BOOT_LOOK draws it, this the record), the lanyard starred (mag-boots H-b: drawn when you
  // clip in; a hand on a hold and the wedge, other anchors in the sim, keep their own drawings, worn.js ANCHOR_LOOKS, my call))
  body: 'R1', light: 'L1', jamb: 'J1', suit: 'D-b', truth: 'T-a', boots: 'B-a', anchor: 'H-b', hostageSide: 'H-a', ground: 'L-a',
  // (a man upside down to you (portrait-faces R): R-a turned as you see him, R-b upright with his face named)
  roll: 'R-a' });
/** The words R-b puts before a turned subject's, by the roll (v0.0.25): his face as you see it. */
export const ROLL_FACE_WORDS = Object.freeze({ 1: 'ON HIS SIDE', 2: 'UPSIDE DOWN', 3: 'ON HIS SIDE' });
/**
 * The roll picks whose card names his face in its words (v0.0.28: the user starred both R-a and R-b on 2026-11-20, joined, my call:
 * the card turned as you see him, R-a, and its words naming his face as R-b's do, so a glance at the words alone still says it).
 */
export const ROLL_NAMED = Object.freeze(['R-a', 'R-b']);
/** The roll a card is drawn turned by under the picks: the record's on R-a, none on R-b (v0.0.25). */
export const rollDrawn = (roll, picks = null) => ((picks?.roll ?? PORTRAIT_PICKS.roll) === 'R-b' ? 0 : ((Number(roll) || 0) % 4 + 4) % 4);

/**
 * A card's figure turned by roll quarter turns counter-clockwise, in place (v0.0.25, R-a; samples/portrait-faces turnCard, the scored
 * candidate's own rule): col the card's colours W wide, figH the words' strip's first row. The figure is every pixel inside the frame
 * and above the strip that differs from its row's ground (the ground a vertical wash: its colour at column 1); its box is turned
 * about itself and centred in the figure's part of the card, the ground under it as it was row by row (so the wash stays upright),
 * his marks, their numbers and anything drawn on him turned with him; a quarter turn that would not fit is halved (every other
 * pixel). Returns { halved, map(x, y) } (map: a card point of the figure to where the turn put it), or null where nothing turned.
 */
export function turnFigure(col, W, figH, roll) {
  const r = ((roll % 4) + 4) % 4;
  if (!r) return null;
  const ground = (y) => col[y * W + 1], src = col.slice(), on = (x, y) => src[y * W + x] !== src[y * W + 1];
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 1; y < figH; y++) for (let x = 1; x < W - 1; x++) if (on(x, y)) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  for (let y = 1; y < figH; y++) { const g = ground(y); for (let x = 1; x < W - 1; x++) col[y * W + x] = g; }
  if (x1 < 0) return { halved: false, map: (x, y) => [x, y] };
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, quarter = r % 2 === 1, tw = quarter ? bh : bw, th = quarter ? bw : bh;
  const halve = tw > W - 2 || th > figH - 1, s = halve ? 2 : 1, ox = 1 + Math.floor((W - 2 - Math.ceil(tw / s)) / 2), oy = 1 + Math.floor((figH - 1 - Math.ceil(th / s)) / 2);
  // (r 2: half a turn; r 1: a quarter turn, his head to your left; r 3: to your right)
  const to = (u, v) => (r === 2 ? [bw - 1 - u, bh - 1 - v] : r === 1 ? [v, bw - 1 - u] : [bh - 1 - v, u]);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    if (!on(x, y) || (halve && ((x - x0) % 2 || (y - y0) % 2))) continue;
    const [a, b] = to(x - x0, y - y0), px = ox + Math.floor(a / s), py = oy + Math.floor(b / s);
    if (px >= 1 && px < W - 1 && py >= 1 && py < figH) col[py * W + px] = src[y * W + x];
  }
  return { halved: halve, map: (x, y) => { const [a, b] = to(x - x0, y - y0); return [ox + Math.floor(a / s), oy + Math.floor(b / s)]; } };
}
/** A side card's facing by the side pick (F3 the head turned, the record's own 'left' or 'right'; F2 the profile) and the back's (F1 drawn from behind). */
export const SIDE_FACINGS = Object.freeze({ F3: null, F2: 'profile', F4: 'side' }), BACK_FACINGS = Object.freeze({ F1: 'back' });
/** The ship switches (the build sheet's ship rules): the poses and the facing drawn, or every card standing and front on. */
export const PORTRAIT_POSES = true, PORTRAIT_FACING = true;
/** "Bang"'s boards keep the hold the user starred (question 1's default: 'hand', the gun hanging); 'ready' on their yes. */
export const BANG_BOARD_HOLD = 'hand';
/** Where a board's painted man holds his gun by the W pick: W1 at the ready as the stage paints it, W2 hanging (today's, the crop lowered). */
export const BOARD_PLACES = Object.freeze({ W1: 'ready', W2: 'hand' });
/** The hostage card's hostile by the H pick: H1 his pistol raised at her head (a rifle up at the high ready), H2 his gun at the ready beside her. */
// (the judge's pass of 2026-11-20 on H1 and H2, "no hand on it": every gun of the hostile's in his fist, drawn whole by
// ./held.js hostageHold: H1's P-12 at her temple, its rifle up at the high ready on his free side; H2's gun down at the ready there;
// H0 is v0.0.27's, for the sample)
export const HOSTAGE_PLACES = Object.freeze({ H1: Object.freeze({ pistol: 'hostage', rifle: 'hostageHigh' }), H2: Object.freeze({ pistol: 'hostageReady', rifle: 'hostageReady' }), H0: Object.freeze({ pistol: 'hostageOld', rifle: 'high' }) });

/** The candidates' holds by pick (portrait-pose): A2 the rifle canted across the chest (aimed away's line), P2 the pistol cupped at the chest. */
export const AIM_PLACES = Object.freeze({ A1: null, A2: 'away', A3: 'sights' }), PISTOL_AIM_PLACES = Object.freeze({ P1: null, P2: 'cupped', P3: 'sights' });

const picksOf = (o) => ({ ...PORTRAIT_PICKS, ...(o ?? {}) });

/**
 * The record as the doll draws it under the switches and the picks: standing when PORTRAIT_POSES is off, front on when
 * PORTRAIT_FACING is off, the aimed holds by A and P. A board's record and null pass through.
 */
export function drawnRec(rec, picks = null) {
  if (!rec || rec.kind !== 'man') return rec;
  const P = picksOf(picks), out = { ...rec, hold: rec.hold ? { ...rec.hold } : rec.hold };
  if (!PORTRAIT_POSES) out.pose = 'stand';
  if (!PORTRAIT_FACING) out.facing = 'front';
  // (the facing as scored: a side card the profile on F2, F3 the record's own side (the head turned); the back F1's)
  // (F4, v0.0.28: a true profile, facing the record's side: 'sideR' his front toward the viewer's right)
  if ((out.facing === 'left' || out.facing === 'right') && SIDE_FACINGS[P.side]) out.facing = SIDE_FACINGS[P.side] === 'side' ? (out.facing === 'left' ? 'sideL' : 'sideR') : SIDE_FACINGS[P.side];
  if (out.facing === 'back') out.facing = BACK_FACINGS[P.back] ?? 'front';
  // (prone, side on: drawn as the prone card is, end on behind the gun (Y-p): the profile has no prone of its own)
  if (out.pose === 'prone' && (out.facing === 'sideR' || out.facing === 'sideL')) out.facing = 'front';
  // (sitting: D3 drawn whole (doll.js POSE_BENDS.sit), D1 v0.0.23's bend)
  if (out.pose === 'sit' && P.down === 'D1') out.pose = 'sitD1';
  // (prone, Y-p: the head and shoulders low behind the gun, end on, whatever its carry: the bend keeps only what is over the line)
  if (out.pose === 'prone' && out.hold && /^(rifle|pistol)-(low|high|aim|ready)$/.test(out.hold.how ?? '')) { out.hold.how = out.hold.how.startsWith('rifle') ? 'rifle-aim' : 'pistol-aim'; out.aimAt = 'you'; }
  const how = out.hold?.how;
  if (how === 'rifle-aim' && out.aimAt !== 'away' && AIM_PLACES[P.aim]) out.aimAt = AIM_PLACES[P.aim];
  if (how === 'pistol-aim' && out.aimAt !== 'away' && PISTOL_AIM_PLACES[P.pistol]) out.aimAt = PISTOL_AIM_PLACES[P.pistol];
  return out;
}

/** The painted man's look on a board by its face: 'armoured' in the plate carrier and helmet, the rest bare-headed in utilities (a no-shoot light-skinned). */
export const boardLook = (face) => (face === 'armoured' ? { outfit: 'carrier', skin: 'tan', hair: { style: 'highTight', color: 'dark' } } : { outfit: 'utilities', skin: face === 'noshoot' || face === 'hostage' ? 'light' : 'tan', head: null, hair: { style: 'medium', color: 'dark' } });
/**
 * The board's painted man (src/sim/arms/gear.js standGear's, written here: art reads no sim module): what his face holds, at the
 * place given ('hand' hanging, as "Bang"'s; 'ready' where the stage paints it, W1; a hostage card's hostile by HOSTAGE_PLACES).
 */
export function boardGear(face, holds, place = 'hand', places = null) {
  const base = { outfit: face === 'armoured' ? 'carrier' : 'utilities', suit: null, carrier: null, ears: null, rifle: null, pistol: null, thigh: null, held: null, painted: true };
  // (an unseen hand holds nothing, the armoured face's too: the card draws only what the take-in saw)
  if (holds === 'unseen' || face === 'unknown' || face === 'hostage') return base;
  // (a pistol before the armoured face's rifle: the house draws the armoured stand's hand as any threat's, and the hunt of
  // v0.0.18 found the card drawing the rifle where the stage's board held a pistol)
  if (holds === 'pistol') return { ...base, pistol: { model: 'p12', place: places?.pistol ?? place, mag: true } };
  if (face === 'armoured' || holds === 'rifle') return { ...base, rifle: { model: 'r7', finish: null, place: places?.rifle ?? place, mag: true } };
  if (holds === 'phone') return { ...base, held: 'phone' };
  return base;
}

// (the figure's pixels, its ink round it included: those that are not the doll's wall and floor)
const MASKS = new WeakMap();
/** A doll's figure mask (1 where the figure or its ink is, 0 on the wall and floor), kept with its doll. */
export function maskOf(pm, scale) {
  const hit = MASKS.get(pm);
  if (hit) return hit;
  const mask = new Uint8Array(pm.w * pm.h);
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) mask[y * pm.w + x] = pm.data[y * pm.w + x] !== word(backdropAt(x, y, scale, pm.backOff ?? 0)) ? 1 : 0;
  MASKS.set(pm, mask);
  return mask;
}

/** The scale a portrait is painted at for a density (card px a metre over the doll's 72 at scale 1). */
const scaleFor = (o) => o?.scale ?? (o?.pxPerM ?? 96) / 72;

/**
 * The portrait of a man's record (see the header): { pm (the dressed doll at the card's scale), mask (its figure), held (what the
 * hands hold: a Uint8Array over pm, 1 on the gun's or the device's pixels), anchors (the head's and the A zone's centres, pm px) }.
 * person: { look, sex, body, wounds }; opts: { pxPerM (96), scale, picks }.
 */
export function paintPortrait(rec, person = {}, opts = {}) {
  const scale = scaleFor(opts), r = drawnRec(rec, opts.picks);
  const pm = dressedDoll(r?.gear ?? null, person ?? {}, scale, r);
  return { pm, mask: maskOf(pm, scale), held: pm.held ?? new Uint8Array(pm.w * pm.h), anchors: pm.anchors ?? null };
}
/** The doll cache's key for a record (the record's drawn fields without the band, the person's look, the scale). */
export function portraitKey(rec, person = {}, scale = 96 / 72, picks = null) { const r = drawnRec(rec, picks); return dollKey(r?.gear ?? null, person ?? {}, scale, r); }
/** Whether a record's portrait is painted already at a scale (the target view paints at most one new doll a frame). */
export function portraitReady(rec, person = {}, scale = 96 / 72, picks = null) { const r = drawnRec(rec, picks); return dressedReady(r?.gear ?? null, person ?? {}, scale, r); }

/** The jamb's tones (J1; samples/portrait-light's: the house's wall, its lit edge toward you, its ink). */
export const JAMB_C = Object.freeze({ face: 0x4b4540, lit: 0x6e665c, ink: 0x14151c });
/**
 * The jamb over a card's figure (J1): the share of his width a side hides (cover's left and right, from the viewer's), from his
 * figure's columns fx0..fx1, drawn as the wall in its tones down every row of the figure's part of the card (rows y0..y1), its
 * lit edge toward the rest of him and its ink. col: the card's colours (0xrrggbb, W wide). Returns the pixels drawn.
 */
export function jambOver(col, W, { fx0, fx1, y0, y1, left = 0, right = 0 }) {
  let n = 0;
  const span = fx1 - fx0 + 1, put = (x, y, c) => { if (x >= 0 && x < W) { col[y * W + x] = c; n++; } };
  if (span <= 0) return 0;
  const L = Math.round(span * Math.max(0, Math.min(1, left))), R = Math.round(span * Math.max(0, Math.min(1, right)));
  // (the jamb from the card's edge to the hidden share's edge, the edge lit then inked: as the sample's J1)
  if (L > 0) { const edge = fx0 + L; for (let y = y0; y < y1; y++) for (let x = 1; x < edge; x++) put(x, y, x === edge - 1 ? JAMB_C.ink : x >= edge - 3 ? JAMB_C.lit : JAMB_C.face); }
  if (R > 0) { const edge = fx1 - R + 1; for (let y = y0; y < y1; y++) for (let x = W - 2; x >= edge; x--) put(x, y, x === edge ? JAMB_C.ink : x <= edge + 2 ? JAMB_C.lit : JAMB_C.face); }
  return n;
}
/** A figure pixel in his light (L1): darkened by lightK of the level (src/data/portrait.js), the sample's L1; a level of LIGHT_FULL_K and up leaves it as it is. */
export const litPixel = (c, level) => { const k = lightK(level); return k >= 1 ? c : mix(0x000000, c, k); };

/** The I and C cards' ground candidates (portrait-suit D) and their places' tones (samples/portrait-suit's: the wall, the floor, the shadow under the feet, the place's light for the rim). */
export const SUIT_LOOKS = Object.freeze(['D-a', 'D-b', 'D-c']);
export const SUIT_PLACES = Object.freeze({
  house: Object.freeze({ wall: 0x57534e, floor: 0x76726c, shadow: 0x4f4c48, light: 0xf2ead8 }),
  bay: Object.freeze({ wall: 0x4a5560, floor: 0x3a3f47, shadow: 0x262a30, light: 0xdfe6f0 }),
  street: Object.freeze({ wall: 0x8a5d46, floor: 0x6b4634, shadow: 0x4a2f24, light: 0xf0c49a }),
});
/** The rim's share toward the place's light (D-c). */
export const RIM_K = 0.55;
const hexOfWord = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);
/**
 * A doll on the I and C cards' ground (see the header): D-a the doll as it is, the very Pixmap; D-b (the default) the doll's wall,
 * floor and shadow in the place's tones (SUIT_PLACES: 'house', 'bay', 'street'); D-c D-b with the suit's outer pixels on the lit side
 * (the light from the upper left, as the doll's own) lifted toward the place's light by RIM_K. scale: the doll's.
 */
export function cardBackdrop(pm, scale, place = 'bay', look = PORTRAIT_PICKS.suit) {
  const Pl = SUIT_PLACES[place];
  if (!pm || look === 'D-a' || !Pl || !SUIT_LOOKS.includes(look)) return pm;
  const mask = maskOf(pm, scale), data = new Uint32Array(pm.data);
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
    const i = y * pm.w + x;
    if (mask[i]) continue;
    const b = backdropAt(x, y, scale, pm.backOff ?? 0);
    data[i] = word(b === 0x383c4a ? Pl.wall : b === 0x1f2029 ? Pl.shadow : Pl.floor);
  }
  if (look === 'D-c') {
    const isInk = (x, y) => x >= 0 && y >= 0 && x < pm.w && y < pm.h && mask[y * pm.w + x] && hexOfWord(pm.data[y * pm.w + x]) === INK;
    for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
      const i = y * pm.w + x;
      if (!mask[i] || hexOfWord(pm.data[i]) === INK) continue;
      if ((isInk(x - 1, y) && !isInk(x + 1, y)) || isInk(x, y - 1)) data[i] = word(mix(hexOfWord(pm.data[i]), Pl.light, RIM_K));
    }
  }
  return { ...pm, data };
}
