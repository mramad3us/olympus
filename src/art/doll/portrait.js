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
// Pure but the caches (./dress.js's LRU, the masks by doll).
import { word } from '../paint.js';
import { backdropAt } from './doll.js';
import { dressedDoll, dressedReady, dollKey } from './dress.js';

/** The gun's tones on a board (G1, the board's dark ink, as the stage paints a turner's hold: its lit pixels a step lighter). */
export const PORTRAIT_HOLD = Object.freeze({ ink: 0x2a2216, lit: 0x3d3220 });
/** The looks drawn until the user scores them (the build sheet v0.0.23 §5: the samples' defaults). */
export const PORTRAIT_PICKS = Object.freeze({ gun: 'G1', where: 'W1', hostage: 'H1', aim: 'A1', pistol: 'P1', kneel: 'K1', down: 'D1', cower: 'C1', prone: 'Y-p', back: 'F1', side: 'F3', unread: 'V1' });
/** The ship switches (the build sheet's ship rules): the poses and the facing drawn, or every card standing and front on. */
export const PORTRAIT_POSES = true, PORTRAIT_FACING = true;
/** "Bang"'s boards keep the hold the user starred (question 1's default: 'hand', the gun hanging); 'ready' on their yes. */
export const BANG_BOARD_HOLD = 'hand';
/** Where a board's painted man holds his gun by the W pick: W1 at the ready as the stage paints it, W2 hanging (today's, the crop lowered). */
export const BOARD_PLACES = Object.freeze({ W1: 'ready', W2: 'hand' });
/** The hostage card's hostile by the H pick: H1 his pistol raised at her head (a rifle up at the high ready), H2 his gun at the ready beside her. */
export const HOSTAGE_PLACES = Object.freeze({ H1: Object.freeze({ pistol: 'hostage', rifle: 'high' }), H2: Object.freeze({ pistol: 'ready', rifle: 'ready' }) });
/** The candidates' holds by pick (portrait-pose): A2 the rifle canted across the chest (aimed away's line), P2 the pistol cupped at the chest. */
export const AIM_PLACES = Object.freeze({ A1: null, A2: 'away' }), PISTOL_AIM_PLACES = Object.freeze({ P1: null, P2: 'cupped' });

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
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) mask[y * pm.w + x] = pm.data[y * pm.w + x] !== word(backdropAt(x, y, scale)) ? 1 : 0;
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
