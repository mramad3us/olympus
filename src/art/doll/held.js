// OLYMPUS art: the holds the portrait cards draw whole, as an illustrator would (v0.0.28, the picks of 2026-11-20).
//
// The user, 2026-11-20, of the portrait cards: "Those are terrible, more efforts on the gun wielding cards"; "For the cards with
// gun pointed, we need the gun held to be like soldiers hold a gun, aiming through ironsights"; of the man down, "Needs way more
// polish"; and over all of them, "I need you to be serious about this ... please, make an effort for quality." Until v0.0.27 a hold
// was the standing doll with its forearms bent at the elbow (doll.js bentArm: the upper arm always down the side, the elbow at row
// 52) and the gun stamped over it, so no arm could rise to a shoulder and an aimed rifle was a ring at the chest (A1). Here a hold
// is drawn as a figure is drawn, and redrawn on the art director's pass of the same day (.run/v028/picks/judge-1.md: "the arms read as
// camouflage logs ... no hand shows anywhere ... two fists, one ring, one lens"):
//   - An arm is two limbs from the shoulder through an elbow, always bent, tapering ARM_TAPER from the deltoid to the wrist, each limb
//     flat across in three tones (its lit edge, its base, its shaded edge: limb), the upper arm a step into the shade and the forearm
//     a step toward the light (shiftRamp), so a fold seen end on stays two; in the camouflage each limb is one colour of the pattern
//     (never its pink, which reads as a bare arm) with at most one blot, chosen unlike the hand where the hand would sink into it.
//   - A fist is a block of its own (fist), a step lighter than the hand's ramp, its knuckles lit, the fingers' creases across it round
//     a grip; the seams give it its dark rim; gloves too dark to read are lifted toward a grey (GLOVE_LIFT).
//   - A gun seen side on is its weapon card's drawing (weaponcard.js gunLayer) resampled to the card's density at its angle (gunCells,
//     memoised), its upper-left edge lit toward the steel.
//   - A gun pointed at you is built end on, nearest last, in the card's polymer, metal and steel: A3 the stock from the raised firing
//     shoulder to the cheek, the receiver short under the SO-4's box over the right eye with its lens, the grip into the firing fist,
//     the magazine down, the support fist under the handguard, the muzzle's ring and bore before the chin a third over its size; P3
//     the slide end on before the right eye over one double fist, the arms a narrow V.
//   - A board (the gear painted) has its hands printed (printHands): every forearm and fist a light fill in the print's line, over the
//     gun, so the gun reads whole; its pistol at the low ready drawn side on in both fists (boardPistol).
// The holds (worn.js places): 'aimSights' (A3; P3), 'high' (C6: the P-12's high ready, the slide tipped toward you over a double fist
// at the upper chest, the elbows down), the hostage card's hostile (HOSTAGE_WHOLE: H1's P-12 at her temple, his rifle up or H2's gun
// down on his free side, his left arm across her chest to her far shoulder, drawn as the card's over layer: hitcard.js dollFor), the
// rifle slung while the pistol is up (slungRifle), prone's elbows on the deck (PRONE_ELBOW_Y),
// and the man sitting down (D3: seated, after slumpHead drops and tilts the head: the knees up, the shins to the boots in a V, the
// R-7 across the thighs, one hand open on it and one slid off to the floor). Each is a function of the doll's grid (grid.js) in its
// reference coordinates (64 × 140, MID 32), so it is drawn finer at each band, never blown up.
// The third pass (the art director's verdicts of the same day, .run/v028/picks/judge-2.md: "a photographer with a camera", "hands to
// the mouth", "praying hands", "the arms are planks of another material"): A3, P3 and the P-12's high ready standing are hand-placed
// near-band templates (./near.js stamp, ./near-holds.js NEAR), drawn in depth, nearest last; the chains above stay for prone (Y-p,
// which passed) and the hostage's arm; every arm limb joins the camouflage's parts, so the sleeve wears the shoulder's pattern (the
// kneel, K1, starred, keeps v0.0.23's bend: the review of the picks); the hostage's P-12 level at her temple and his rifle across
// her; board 1A's rifle a stroked print silhouette (boardRifle); the slumped head on a neck (slumpNeck). Pure but the memo of the
// guns' cells.
import { cloth, flesh, mix, lum, INK } from './grid.js';
import { valles, VALLES } from '../figures/outfits.js';
import { gunLayer } from '../weaponcard.js';
import { stamp } from './near.js';
import { NEAR } from './near-holds.js';

/** The doll's light (the figure's: from the upper left, a little toward you), a unit vector [x, y, z] (y down, z toward you). */
export const LIGHT = Object.freeze((() => { const v = [-0.5, -0.62, 0.6], n = Math.hypot(...v); return v.map(a => a / n); })());
/** The brightness a tube's tone steps at (lit, half lit, base, shade; below the last, deep). */
const STEPS = Object.freeze([0.9, 0.68, 0.3, -0.04]);
/** The gun's own colours end on (the weapon card's: its lit polymer, its metal, its polymer, its dark; the steel of a muzzle; the SO-4's glass). */
export const GUN_C = Object.freeze({ light: 0x6e7582, soft: 0x565b67, base: 0x3e424d, shade: 0x282b34, deep: 0x1c1d24, steel: 0x9aa1ae, steelD: 0x6e7582, glass: 0x24324a, glassL: 0x3c5d84, glint: 0xb8d8ec });
const GUN_RAMP = Object.freeze({ light: GUN_C.light, soft: GUN_C.soft, base: GUN_C.base, shade: GUN_C.shade, deep: GUN_C.deep });
/** A gun side on: the share of its sprite's edge pixels lit toward the steel where nothing of the gun is above or left of them. */
export const GUN_RIM_K = 0.55;
/** A pistol drawn a fifth over its size on the cards (my call: the P-12 is 19.5 cm, 19 card px at the near band, and a hand round it hides half; the user's "more efforts on the gun wielding cards"). */
export const PISTOL_DRAW_K = 1.2;

const toneOf = (T, b) => (b > STEPS[0] ? T.light : b > STEPS[1] ? T.soft : b > STEPS[2] ? T.base : b > STEPS[3] ? T.shade : T.deep);

/**
 * A tube from a to b (reference [x, y]) of radius ra to rb, shaded as a cylinder (its ends as spheres) in the ramp T, a new part
 * (or `id`'s), its pixels the grid's at its scale. Returns the part's id.
 */
export function tube(g, a, b, ra, rb, T, id = null) {
  const S = g.S, pid = id ?? g.add([], 0), dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-9;
  const x0 = Math.floor((Math.min(a[0] - ra, b[0] - rb)) * S), x1 = Math.ceil((Math.max(a[0] + ra, b[0] + rb)) * S);
  const y0 = Math.floor((Math.min(a[1] - ra, b[1] - rb)) * S), y1 = Math.ceil((Math.max(a[1] + ra, b[1] + rb)) * S);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const X = (x + 0.5) / S, Y = (y + 0.5) / S, t = Math.max(0, Math.min(1, ((X - a[0]) * dx + (Y - a[1]) * dy) / L2));
    const cx = a[0] + dx * t, cy = a[1] + dy * t, r = ra + (rb - ra) * t, nx = (X - cx) / r, ny = (Y - cy) / r, n2 = nx * nx + ny * ny;
    if (n2 > 1) continue;
    g.px(x, y, toneOf(T, nx * LIGHT[0] + ny * LIGHT[1] + Math.sqrt(1 - n2) * LIGHT[2]), pid);
  }
  return pid;
}
/** A ball at c (reference) of radius r in the ramp T (a fist, a knee): a tube of no length. */
export const ball = (g, c, r, T, id = null) => tube(g, c, c, r, r, T, id);
/** A box from [x0, y0] to [x1, y1] (reference), its top row lit, its bottom and right in shade: the end-on gun's slabs. */
export function box(g, x0, y0, x1, y1, T, id = null) {
  const S = g.S, pid = id ?? g.add([], 0), X0 = Math.round(x0 * S), X1 = Math.round(x1 * S) - 1, Y0 = Math.round(y0 * S), Y1 = Math.round(y1 * S) - 1;
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) g.px(x, y, y === Y0 ? T.light : x === X0 ? T.soft : y === Y1 || x === X1 ? T.shade : T.base, pid);
  return pid;
}

// ---------- a gun side on, its card's drawing resampled ----------

const CELLS = new Map(), CELLS_MAX = 96, LAYERS = new Map();
const hexOf = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);
const layerOf = (model) => { let L = LAYERS.get(model); if (!L) { L = gunLayer(model); LAYERS.set(model, L); } return L; };
/**
 * A gun side on at the doll's scale S (72 × S px a metre), turned th radians (0 muzzle to the right, y down), mirrored across its
 * length when flip (the gun's top kept up as it points left: a man facing left), its anchor ('grip', where the firing fist closes,
 * or 'butt') at the origin: { cells: [[dx, dy, colour]] (target px), muzzle [dx, dy], grip [dx, dy] }, memoised.
 */
export function gunCells(model = 'r7', S = 1, th = 0, { flip = false, anchor = 'grip', rim = true } = {}) {
  const key = `${model}|${S}|${th.toFixed(4)}|${flip ? 1 : 0}|${anchor}|${rim ? 1 : 0}`, hit = CELLS.get(key);
  if (hit) return hit;
  const L = layerOf(model), k = 72 * S / L.pxPerM * (L.kind === 'pistol' ? PISTOL_DRAW_K : 1), c = Math.cos(th), s = Math.sin(th), N = 4;
  const fy = (y) => (flip ? L.h - 1 - y : y), A = anchor === 'butt' ? L.butt : L.grip, ax = A[0], ay = fy(A[1]);
  // (a source point's place relative to the anchor, turned and scaled: what the bounds and the stations need)
  const place = ([x, y]) => { const u = (x - ax) * k, v = (fy(y) - ay) * k; return [u * c - v * s, u * s + v * c]; };
  const corners = [[0, 0], [L.w, 0], [0, L.h], [L.w, L.h]].map(place);
  const bx0 = Math.floor(Math.min(...corners.map(p => p[0]))) - 1, bx1 = Math.ceil(Math.max(...corners.map(p => p[0]))) + 1;
  const by0 = Math.floor(Math.min(...corners.map(p => p[1]))) - 1, by1 = Math.ceil(Math.max(...corners.map(p => p[1]))) + 1;
  const got = new Map();
  for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) {
    const n = new Map();
    let op = 0;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const tx = x + (i + 0.5) / N, ty = y + (j + 0.5) / N, u = (tx * c + ty * s) / k + ax, v = (-tx * s + ty * c) / k + ay;
      const sx = Math.floor(u), sy = fy(Math.floor(v));
      if (sx < 0 || sy < 0 || sx >= L.w || sy >= L.h) continue;
      const w = L.data[sy * L.w + sx];
      if (!w) continue;
      op++; n.set(w, (n.get(w) ?? 0) + 1);
    }
    // (a pixel is the gun's where a third of it is: its thin parts, the stock's skeleton and the sights, kept at the far band)
    if (op * 3 < N * N) continue;
    let best = 0, bw = 0;
    for (const [w, m] of n) if (m > best || (m === best && w > bw)) { best = m; bw = w; }
    got.set(`${x},${y}`, hexOf(bw));
  }
  const cells = [];
  for (const [p, col] of got) {
    const [x, y] = p.split(',').map(Number);
    const lit = rim && (!got.has(`${x},${y - 1}`) || !got.has(`${x - 1},${y}`)) && got.has(`${x},${y + 1}`);
    cells.push([x, y, lit ? mix(col, GUN_C.steel, GUN_RIM_K) : col]);
  }
  const out = { cells, muzzle: place(L.muzzle), grip: place(L.grip), butt: place(L.butt) };
  if (CELLS.size >= CELLS_MAX) CELLS.clear();
  CELLS.set(key, out);
  return out;
}
/** The gun side on drawn at a reference point (its anchor there), a new part among what the hands hold. Returns { id, muzzle, grip } (reference). */
export function gunAt(g, model, at, th, opts = {}) {
  const G = gunCells(model, g.S, th, opts), id = g.add([], 0), ox = Math.round(at[0] * g.S), oy = Math.round(at[1] * g.S);
  for (const [x, y, c] of G.cells) g.px(ox + x, oy + y, c, id);
  g.held?.add(id);
  const ref = ([x, y]) => [(ox + x) / g.S, (oy + y) / g.S];
  return { id, muzzle: ref(G.muzzle), grip: ref(G.grip), butt: ref(G.butt) };
}

// ---------- the arms ----------

/** A limb's tones across it (the judge's pass of 2026-11-20: a tube shaded round as a cylinder, in the camouflage's blocks, read as a
 * log): the light's side lit past LIMB_LIT, the far side in shade past LIMB_SHADE (the share of the half width), the rest the base. */
export const LIMB_LIT = 0.45, LIMB_SHADE = -0.4;
/** The deltoid's half width over the wrist's (the arm tapers: the judge's 1.4 at the least). */
export const ARM_TAPER = 1.55;
const L2 = (() => { const n = Math.hypot(LIGHT[0], LIGHT[1]); return [LIGHT[0] / n, LIGHT[1] / n]; })();
/**
 * A limb from a to b (reference), half width ra to rb, flat in three tones across (lit edge, base, shaded edge) as a sleeve over an
 * arm is drawn, not a polished cylinder; its pixels the ramp T's, or `T2`'s inside the blot (one patch of the cloth's pattern a
 * segment, at `blot` [x, y, r]). A new part, or id's. Returns the id.
 */
export function limb(g, a, b, ra, rb, T, { id = null, blot = null, T2 = null } = {}) {
  const S = g.S, pid = id ?? g.add([], 0), dx = b[0] - a[0], dy = b[1] - a[1], L2n = dx * dx + dy * dy || 1e-9;
  const x0 = Math.floor((Math.min(a[0] - ra, b[0] - rb)) * S), x1 = Math.ceil((Math.max(a[0] + ra, b[0] + rb)) * S);
  const y0 = Math.floor((Math.min(a[1] - ra, b[1] - rb)) * S), y1 = Math.ceil((Math.max(a[1] + ra, b[1] + rb)) * S);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const X = (x + 0.5) / S, Y = (y + 0.5) / S, t = Math.max(0, Math.min(1, ((X - a[0]) * dx + (Y - a[1]) * dy) / L2n));
    const cx = a[0] + dx * t, cy = a[1] + dy * t, r = ra + (rb - ra) * t, nx = (X - cx) / r, ny = (Y - cy) / r;
    if (nx * nx + ny * ny > 1) continue;
    const s = nx * L2[0] + ny * L2[1], R = blot && T2 && Math.hypot(X - blot[0], Y - blot[1]) <= blot[2] ? T2 : T;
    g.px(x, y, s > LIMB_LIT ? R.soft : s < LIMB_SHADE ? R.shade : R.base, pid);
  }
  return pid;
}

/**
 * The ramps an arm is drawn in: the sleeve's (or the skin's, bare) and the hand's. A glove that would sink into a dark sleeve or a
 * dark gun (the combat suit's) is drawn a clear grey (the judge's fault 2: "on the black suit the gloves take a lighter grey").
 */
export const GLOVE_LIFT = Object.freeze({ to: 0xaab0ba, k: 0.5, below: 96 });
export function armRamps(kit) {
  const skin = flesh(kit.skin), sleeve = kit.bareArms ? skin : cloth(kit.sleeve);
  let hand = skin;
  if (kit.gloves) hand = cloth(lum(kit.gloves) < GLOVE_LIFT.below ? mix(kit.gloves, GLOVE_LIFT.to, GLOVE_LIFT.k) : kit.gloves);
  return { sleeve, hand };
}
/** The cloth's pattern at a point (the camouflage's, as doll.js camo() lays it), a ramp; the sleeve's own off the pattern. */
/** The least step in value (lum, of 255) between a sleeve beside a hand and the hand: below it the pattern's colour farthest from the hand's. */
export const HAND_STEP = 40;
function patternRamp(g, kit, at, hand = null) {
  if (kit.suit || kit.bareArms || kit.plain || kit.pt || kit.towel) return null;
  // (the pattern's pink never alone on a sleeve: it reads as a bare arm; the basalt as the umber)
  const k = 2, c0 = valles(at[0] / k, at[1] / k, 16, kit.seed), c = c0 === VALLES.basalt ? VALLES.umber : c0 === VALLES.pink ? VALLES.ochre : c0;
  if (!hand || Math.abs(lum(c) - lum(hand.base)) >= HAND_STEP) return cloth(c);
  // (a sleeve the hand would sink into: the pattern's colour the most unlike the hand, so the fist reads on it; never the pink, which
  // reads as a bare arm)
  const best = [VALLES.rust, VALLES.umber, VALLES.ochre].reduce((a, b) => (Math.abs(lum(b) - lum(hand.base)) > Math.abs(lum(a) - lum(hand.base)) ? b : a));
  return cloth(best);
}
/**
 * An arm from the shoulder through the elbow to the wrist (reference points): the upper arm then the forearm, each a flat limb
 * tapering (ARM_TAPER from the deltoid to the wrist), the elbow always an angle; in the camouflage each segment one colour of the
 * pattern with at most one patch of another (the pattern's blocks are the cloth's size, not the arm's); on the suit the wrist's
 * seal ring. Not added to the camouflage's parts. Returns { upper, fore }.
 */
export function arm(g, kit, shoulder, elbow, wrist, { rs = 3.8, re = 3.0, rw = rs / ARM_TAPER, upperOnly = false, foreOnly = false, shade = 0 } = {}) {
  const { sleeve } = armRamps(kit), out = {}, camoOn = !kit.suit && !kit.bareArms && !kit.plain && !kit.pt && !kit.towel;
  // (the upper arm a step into the shade, the forearm a step toward the light: nearer you and the lamp, so where the two fold over
  // each other, seen end on, they stay two. v0.0.28, the art director's pass 3, "the arms are planks of another material": in the
  // camouflage each limb joins the camouflage's parts, so the sleeve wears the pattern the shoulder it hangs from wears, its form
  // carried by its outline and its shaded edge)
  const seg = (a, b, ra, rb, step) => { const id = limb(g, a, b, ra, rb, shade ? shiftRamp(shiftRamp(sleeve, step), shade) : shiftRamp(sleeve, step)); if (camoOn) kit.camoParts?.add(id); return id; };
  if (!foreOnly) { out.upper = seg(shoulder, elbow, rs, re, -1); kit.foreIds?.push(out.upper); }
  if (!upperOnly) {
    out.fore = seg(elbow, wrist, re * 0.92, rw, 1);
    kit.foreIds?.push(out.fore);
    // (the suit's seal ring at the wrist: a band across the forearm by the hand)
    if (kit.suit) { const t = 0.84, c = [elbow[0] + (wrist[0] - elbow[0]) * t, elbow[1] + (wrist[1] - elbow[1]) * t], c2 = [elbow[0] + (wrist[0] - elbow[0]) * 0.93, elbow[1] + (wrist[1] - elbow[1]) * 0.93]; limb(g, c, c2, rw + 0.3, rw + 0.25, cloth(kit.rings), { id: out.fore }); }
  }
  return out;
}
/** A ramp a step toward the light (step 1) or the shade (-1), 0 as it is. */
export const shiftRamp = (T, step) => (step > 0 ? { light: T.light, soft: T.light, base: T.soft, shade: T.base, deep: T.shade } : step < 0 ? { light: T.soft, soft: T.base, base: T.shade, shade: mix(T.shade, T.deep, 0.6), deep: T.deep } : T);
/**
 * A fist (the judge's fault 2: W1's, a shape of its own a value step off the sleeve and the gun): a rounded block w × h half sizes
 * (reference) at c, its top the knuckles' row lit toward the light, its lower and far side in shade, the fingers' creases across its
 * face; the seams give it its dark rim where it lies over the sleeve or the gun. `wide`: two fists one over the other (a two-handed
 * grip), the crease between them. Returns its id.
 */
export function fist(g, kit, c, r = 2.6, { w = r, h = r * 0.9, knuckles = true, wide = false, grip = false } = {}) {
  const { hand } = armRamps(kit), S = g.S, id = g.add([], 0);
  kit.handIds?.push(id);
  const X0 = Math.round((c[0] - w) * S), X1 = Math.round((c[0] + w) * S) - 1, Y0 = Math.round((c[1] - h) * S), Y1 = Math.round((c[1] + h) * S) - 1;
  // (the hand a step lighter than its ramp's base: nearer and lit, it stands off the sleeve and the gun)
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
    const corner = (x === X0 || x === X1) && (y === Y0 || y === Y1);
    if (corner) continue;
    g.px(x, y, y === Y0 ? hand.light : x === X0 && L2[0] < 0 ? hand.light : (y === Y1 || x === X1) ? hand.shade : hand.soft, id);
  }
  // (the fingers' creases: round a grip seen end on, the fingers lie across it one over the other, so the creases run across the fist,
  // every other row from the thumb's down; else one row of knuckles; a wide grip's crease down the middle, the two hands)
  if (grip && Y1 - Y0 >= 4) { for (let y = Y0 + 2; y < Y1; y += 2) for (let x = X0 + 1; x < X1; x++) g.px(x, y, hand.base, id); }
  else if (knuckles && Y1 - Y0 >= 3) { const yk = Y0 + Math.max(2, Math.round((Y1 - Y0) * 0.45)); for (let x = X0 + 1; x < X1; x += 2) g.px(x, yk, hand.shade, id); }
  if (wide) { const xm = Math.round((X0 + X1) / 2); for (let y = Y0 + 1; y < Y1; y++) g.px(xm, y, hand.shade, id); }
  return id;
}
/** An open hand lying palm down (reference centre, half width w, half depth h), its four fingers toward you, the thumb in. */
export function openHand(g, kit, c, w = 2.8, h = 2.0, side = 1) {
  const { hand } = armRamps(kit), S = g.S, id = g.add([], 0);
  kit.handIds?.push(id);
  const X0 = Math.round((c[0] - w) * S), X1 = Math.round((c[0] + w) * S) - 1, Y0 = Math.round((c[1] - h) * S), Y1 = Math.round((c[1] + h) * S) - 1;
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
    const u = (x - X0) / Math.max(1, X1 - X0), v = (y - Y0) / Math.max(1, Y1 - Y0);
    if ((u < 0.12 || u > 0.88) && v > 0.75) continue;
    g.px(x, y, v < 0.25 ? hand.light : v > 0.8 ? hand.shade : hand.base, id);
  }
  // (the fingers' gaps, lines from the knuckles down; the thumb's side a step darker)
  for (let f = 1; f <= 3; f++) { const x = Math.round((c[0] - w + f * w / 2) * S); for (let y = Math.round((c[1] + h * 0.1) * S); y <= Y1; y++) if (g.part[y]?.[x] === id) g.col[y][x] = hand.shade; }
  const tx = side > 0 ? X0 : X1;
  for (let y = Y0; y <= Y1; y++) if (g.part[y]?.[tx] === id) g.col[y][tx] = hand.shade;
  return id;
}

// ---------- the holds ----------

/** The shoulders' joints a hold's arms hang from (reference, the man's right first: the viewer's left), dropped `slump` rows. */
const shoulders = (MID, slump = 0) => [[MID - 16.4, 31.6 + slump], [MID + 16.4, 31.6 + slump]];
/** The end-on gun's ramps: its polymer, the muzzle's steel ring, the bore, the SO-4's glass. */
const STEEL_RAMP = Object.freeze({ light: GUN_C.glint, soft: GUN_C.steel, base: GUN_C.steelD, shade: GUN_C.base, deep: GUN_C.shade });
const BORE = Object.freeze({ light: INK, soft: INK, base: INK, shade: INK, deep: INK });
const GLASS = Object.freeze({ light: GUN_C.glint, soft: GUN_C.glassL, base: GUN_C.glassL, shade: GUN_C.glass, deep: GUN_C.glass });
/** A muzzle end on: a steel ring of radius r round its black bore (rb), the nearest thing on the gun. */
function muzzle(g, c, r, rb) { const id = ball(g, c, r, STEEL_RAMP); ball(g, c, rb, BORE, id); g.held?.add(id); return id; }

/**
 * A3, the rifle aimed at you through its sights (the judge's picture of 2026-11-20: "Two fists, one ring, one lens"). Built in depth,
 * the nearest last: the stock in his right shoulder's pocket (the shoulder raised into it) up to his cheek; the receiver short under
 * the SO-4's box, the box over his right eye with its lens toward you; the magazine down; the firing arm's elbow out at his chest's
 * height, the forearm in to the fist on the grip under the receiver; the support arm's elbow down and in under the rifle, the forearm
 * up to the second fist under the handguard; last the muzzle's steel ring and black bore before his chin, directly under the sight,
 * drawn a third over its true size for the perspective (RIFLE_MUZZLE_R), canted a few degrees (A2's star was for the cant). Returns
 * the stations (reference): { eye, sight, muzzle, fists }.
 */
export const RIFLE_MUZZLE_R = 3.0;
/** Prone (Y-p): the elbows' row on the deck (reference rows of the standing figure; doll.js POSE_BENDS.prone cuts the body just under it). */
export const PRONE_ELBOW_Y = 34.4;
export function rifleAimed(g, B, kit, MID, { prone = false } = {}) {
  const R = GUN_RAMP, held = (id) => { g.held?.add(id); return id; };
  if (!prone) { stamp(g, kit, NEAR.A3); return NEAR.A3.stations; }
  // (the firing arm seen from the front folds on itself: the upper arm out from the raised shoulder nearly level to the elbow's
  // point, the forearm back in under it, nearer and lighter, to the fist; the support arm a V, its elbow down under the rifle)
  const rS = [MID - 15.4, 29.6], lS = [MID + 16.4, 31.8], rElbow = [MID - 26.8, 35.0], rElbowF = [MID - 26.0, 36.4], lElbow = [MID + 12.4, 42.8];
  const rFist = [MID - 11.2, 27.8], lFist = [MID - 1.6, 27.8], mz = [MID - 4.6, 22.8];
  // (prone, Y-p: both elbows out wide on the deck, the arms a flat triangle under the gun (PRONE_ELBOW_Y: the bend's line is the deck))
  if (prone) { rElbow[0] = MID - 27.6; rElbow[1] = PRONE_ELBOW_Y; rElbowF[0] = MID - 27; rElbowF[1] = PRONE_ELBOW_Y + 0.8; lElbow[0] = MID + 23.6; lElbow[1] = PRONE_ELBOW_Y + 0.4; }
  // (the upper arms behind the gun; the firing shoulder's round raised under the stock)
  arm(g, kit, rS, rElbow, rFist, { upperOnly: true, rs: 4.1, re: 3.0 });
  arm(g, kit, lS, lElbow, lFist, { upperOnly: true });
  // (the stock from the shoulder's pocket up to the cheek; the receiver short and square under the sight; the magazine down)
  held(limb(g, [MID - 13.4, 30.2], [MID - 9.6, 23.2], 2.0, 1.7, R));
  held(box(g, MID - 9.4, 18.2, MID - 2.2, 22.8, R));
  if (kit.gear?.rifle?.mag !== false) held(limb(g, [MID - 5.6, 23.2], [MID - 5.0, 29.8], 1.5, 1.4, { ...R, soft: GUN_C.soft, light: GUN_C.soft }));
  // (the pistol grip down from the receiver into the firing fist, behind it)
  held(limb(g, [MID - 8.4, 22.4], [MID - 9.8, 27.2], 1.4, 1.3, R));
  // (the SO-4: its box over his right eye, the lens toward you with its glint)
  const optic = held(box(g, MID - 9.4, 11.8, MID - 2.4, 18.4, R));
  ball(g, [MID - 5.8, 15.0], 2.0, GLASS, optic);
  g.put(MID - 7, 13.8, GUN_C.glint, optic);
  // (the forearms over the gun's body, the fists on the grip and under the handguard)
  arm(g, kit, rS, rElbowF, [rFist[0] - 2.2, rFist[1] + 1.2], { foreOnly: true, re: 3.0, rw: 2.9 });
  arm(g, kit, lS, lElbow, [lFist[0] + 1, lFist[1] + 1.6], { foreOnly: true, re: 3.2, rw: 2.8 });
  fist(g, kit, rFist, 2.5, { h: 3.0, grip: true });
  fist(g, kit, lFist, 2.7, { h: 2.8, grip: true });
  // (the handguard end on, a stub from the receiver out to the muzzle; the muzzle's ring, its bore)
  held(limb(g, [MID - 5.8, 21.6], [mz[0], mz[1]], 2.2, 2.5, R));
  muzzle(g, mz, RIFLE_MUZZLE_R, 1.25);
  return { eye: [MID - 5, 15], sight: [MID - 5.8, 15.0], muzzle: mz, fists: [rFist, lFist] };
}

/**
 * P3, the P-12 aimed at you, the isosceles seen from the front (the judge's pass of 2026-11-20: "a narrow V, the elbows below the
 * shoulders"): each arm from its shoulder down to the elbow and in, the forearm up toward you to the two fists, one double grip in
 * front of his chin; the slide end on over them, its rear sight's top at his eye line so it covers the lower half of his right eye,
 * the muzzle's ring and bore the middle of it. Returns the stations: { eye, sight, muzzle, fists }.
 */
export function pistolAimed(g, B, kit, MID, { prone = false } = {}) {
  const [rS, lS] = shoulders(MID), R = GUN_RAMP, held = (id) => { g.held?.add(id); return id; };
  if (!prone) { stamp(g, kit, NEAR.P3); return NEAR.P3.stations; }
  const cx = MID - 2.6, rElbow = prone ? [MID - 21, PRONE_ELBOW_Y] : [MID - 11.6, 39.6], lElbow = prone ? [MID + 19, PRONE_ELBOW_Y] : [MID + 9.6, 40.2], grip = [cx, 26.6];
  arm(g, kit, rS, rElbow, [cx - 2.2, 27.6], { re: 3.1 });
  arm(g, kit, lS, lElbow, [cx + 2.2, 27.8], { re: 3.1 });
  // (the slide end on: a squarish block in the gun's lit polymer with a steel rim (it must stand off a dark face and the suit's visor),
  // the front sight a steel pixel on its top; the frame under it into the fists; the muzzle's ring the middle of it)
  const sl = held(box(g, cx - 2.8, 15.8, cx + 2.6, 22.6, { light: GUN_C.steel, soft: GUN_C.steelD, base: GUN_C.light, shade: GUN_C.soft, deep: GUN_C.base }));
  held(box(g, cx - 1.6, 22.4, cx + 1.4, 24.6, R));
  g.put(cx - 0.4, 15.0, GUN_C.steel, sl);
  fist(g, kit, grip, 3.6, { h: 2.7, wide: true, grip: true });
  const mz = [cx - 0.1, 19.4];
  muzzle(g, mz, 2.0, 1.0);
  // (the fists' stations at their knuckles' row, where they close under the frame)
  return { eye: [MID - 5, 15], sight: [cx - 0.4, 15.6], muzzle: mz, fists: [[cx - 1.8, grip[1] - 1.6], [cx + 1.8, grip[1] - 1.6]] };
}

/**
 * The boards' guns (the judge's pass of 2026-11-20: "1A ... the rifle cut into shards by the masks of hands that are not drawn"; "2A
 * and PISTOL ... a 3 × 5 px L at the belt"). A board is a printed target: its hands are printed over the gun they hold, each forearm
 * and fist a light fill inside the print's thin line (INK, which the card prints in the board's ink), so the gun reads whole under
 * two hands at every band. printHands works on the drawn grid after the seams; boardPistol draws the low ready's P-12 side on in both
 * fists before the arms, its grip at BOARD_PISTOL.grip, muzzle forward and down.
 */
export const PRINT_FILL = 0xd9c7a2;
export function printHands(g, kit) {
  const ids = new Set([...(kit.handIds ?? []), ...(kit.foreIds ?? [])]), out = [];
  for (let y = 0; y < g.ROWS; y++) for (let x = 0; x < g.W; x++) {
    if (!ids.has(g.part[y][x]) || g.col[y][x] === null) continue;
    // (each part in its own line: a fist's line also where it meets its forearm, so the two knots read on the gun)
    const p = g.part[y][x], edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const q = g.part[y + dy]?.[x + dx]; return g.col[y + dy]?.[x + dx] === null || !ids.has(q) || (q !== p && q > p); });
    out.push([x, y, edge ? INK : PRINT_FILL]);
  }
  for (const [x, y, c] of out) g.col[y][x] = c;
  return out.length;
}
export const BOARD_PISTOL = Object.freeze({ grip: Object.freeze([0.4, 57.4]), th: 1.95 });
export function boardPistol(g, kit, MID, model = 'p12') {
  return gunAt(g, model, [MID + BOARD_PISTOL.grip[0], BOARD_PISTOL.grip[1]], BOARD_PISTOL.th, { flip: true });
}

/**
 * Board 1A's rifle (the art director's pass 3 of 2026-11-20: "the resampled stamp reads as a crow or broken gun"): on a printed board
 * the R-7 at the low ready is drawn as a print silhouette, straight strokes along one line at BOARD_RIFLE.th (about 35 degrees, down to
 * the viewer's right): the stock, the receiver with the optic on it, the pistol grip and the magazine below, the handguard, the barrel;
 * each a flat stroke in the gun's three tones, so no edge steps. Its stations place the fists (doll.js: the grip and the handguard).
 */
export const BOARD_RIFLE = Object.freeze({ butt: Object.freeze([-15.0, 45.0]), th: 0.61, grip: 15, fore: 33 });
const boardAxis = (MID) => { const B = BOARD_RIFLE, c = Math.cos(B.th), s = Math.sin(B.th); return (u, v = 0) => [MID + B.butt[0] + c * u - s * v, B.butt[1] + s * u + c * v]; };
/** The fists' bends for the board's rifle (doll.js bentArm's: bendR from the middle toward the viewer's left, bendL toward the right). */
export function boardRifleBends(MID = 32) {
  const at = boardAxis(MID), g0 = at(BOARD_RIFLE.grip, 4.6), f0 = at(BOARD_RIFLE.fore, 2.4);
  return { bendR: [MID - g0[0], g0[1]], bendL: [f0[0] - MID, f0[1]] };
}
export function boardRifle(g, kit, MID, mag = true) {
  const at = boardAxis(MID), R = GUN_RAMP, ids = [], st = (a, b, r0, r1 = r0) => { const id = limb(g, a, b, r0, r1, R); ids.push(id); g.held?.add(id); return id; };
  st(at(0, 0.4), at(11.5, 0), 1.9, 1.5);                       // (the stock, its butt a little deeper)
  st(at(15, 4.8), at(13.2, 0.6), 1.2);                         // (the pistol grip, raked back)
  if (mag) st(at(22.4, 7.4), at(21.4, 0.8), 1.5);              // (the magazine)
  st(at(11, 0), at(27.5, 0), 2.1);                             // (the receiver)
  st(at(14.6, -3.0), at(22.6, -3.0), 1.4);                     // (the optic on its rail)
  st(at(27, 0.2), at(40.5, 0.2), 1.6, 1.4);                    // (the handguard)
  st(at(40, 0), at(46.5, 0), 0.75);                            // (the barrel and its muzzle)
  void kit;
  return ids;
}

/**
 * RH1, the rifle hanging on its two-point sling while the pistol is up: the butt at his chest's middle, the muzzle down by his left
 * knee, the weapon card's drawing at that angle a step into the shade (it hangs behind his arms), its magazine as the gear says.
 */
export const SLUNG_LINE = Object.freeze({ butt: Object.freeze([9, 34]), muzzle: Object.freeze([15, 102]) });
export function slungRifle(g, kit, MID) {
  const th = Math.atan2(SLUNG_LINE.muzzle[1] - SLUNG_LINE.butt[1], SLUNG_LINE.muzzle[0] - SLUNG_LINE.butt[0]);
  const gun = gunAt(g, kit.model ?? 'r7', [MID + SLUNG_LINE.butt[0], SLUNG_LINE.butt[1]], th, { anchor: 'butt' });
  for (let y = 0; y < g.ROWS; y++) for (let x = 0; x < g.W; x++) if (g.part[y][x] === gun.id && g.col[y][x] !== null) g.col[y][x] = mix(g.col[y][x], INK, 0.15);
  return gun;
}

/**
 * C6, the P-12 at the high ready (the judge's pass of 2026-11-20: "praying hands"): the elbows tucked down at his sides, the forearms
 * up to one double fist at the upper chest, the pistol over it tipped forward toward you, so its slide is seen from the muzzle's end
 * foreshortened (a short block, its top lit, the muzzle's ring and bore at its top) rather than standing its full height.
 */
/** The slide's steel on a card (the weapon card's metal, lit: it stands off the carrier's drab and the suit's black). */
const SLIDE_RAMP = Object.freeze({ light: 0xb4bbc6, soft: 0x8a919c, base: 0x6a717c, shade: 0x4a505a, deep: 0x30343c });
export const HIGH_GRIP = Object.freeze([-1.2, 38.6]);
export function pistolHigh(g, B, kit, MID, model = 'p12') {
  if (model === 'p12') { stamp(g, kit, NEAR.PSB); return NEAR.PSB.stations; }
  const [rS, lS] = shoulders(MID), rElbow = [MID - 14.6, 50.4], lElbow = [MID + 14.6, 50.8], grip = [MID + HIGH_GRIP[0], HIGH_GRIP[1]];
  arm(g, kit, rS, rElbow, [grip[0] - 2.6, grip[1] + 1.4], { re: 3.1 });
  arm(g, kit, lS, lElbow, [grip[0] + 2.6, grip[1] + 1.6], { re: 3.1 });
  // (the slide tipped toward you: a short block from the fists up, lit steel, its rear sight's notch; the muzzle at its top)
  const slide = box(g, grip[0] - 2.2, grip[1] - 8.6, grip[0] + 2.2, grip[1] - 2.2, SLIDE_RAMP);
  g.held?.add(slide);
  const m = [grip[0], grip[1] - 7.0];
  muzzle(g, m, 1.7, 0.85);
  fist(g, kit, grip, 3.6, { h: 2.7, wide: true, grip: true });
  void model; void B;
  return { muzzle: m, grip, fists: [[grip[0] - 1.8, grip[1]], [grip[0] + 1.8, grip[1]]] };
}

/**
 * H1 rebuilt again (the judge's pass of 2026-11-20: "reads as a man behind her looking through binoculars": the P-12 lay across his own
 * eye, the arm across her chest was a bolster with no hand). Drawn in his own frame, the hostage at the viewer's right of him
 * (hitcard.js mirrors the lot for H-a); her place and outline are paper.js's, untouched. His head up and out, away from her
 * (HOSTAGE_HEAD, so his eye and the side of his face show past her head, clearly over the gun); the P-12 side on and level at her
 * temple, its muzzle on her head's outline (HOSTAGE_MUZZLE), his fist under the slide on its grip, the forearm down and back to the
 * elbow tucked by his side; his left forearm low across her chest along her collarbone to a fist gripping her far shoulder. The parts
 * in g.overIds are drawn again over her (hitcard.js dollFor). On a board every limb and fist is printed in its thin line (printHands).
 */
export const HOSTAGE_HEAD = Object.freeze({ dx: -2.2, dy: -2.2 }), HOSTAGE_MUZZLE = Object.freeze([3.0, 20.6]), HOSTAGE_TH = 0;
/** His eye and brow on a board (reference, from MID, before his head moves): the brow's three pixels and the eye's two. */
export const HOSTAGE_EYE = Object.freeze([[-7, 12.6], [-6, 12.2], [-5, 12.6], [-6.6, 14.6], [-5.6, 14.6]]);
/** His forearm across her chest (reference, from MID): from under her near arm to the wrist at her far shoulder, tapering; the fist there. */
export const HOSTAGE_ARM = Object.freeze({ from: Object.freeze([-3.4, 38.6]), wrist: Object.freeze([21.0, 36.0]), fist: Object.freeze([23.4, 35.2]), r: Object.freeze([3.0, 2.0]) });
/**
 * The hostile's guns by the H pick (portrait.js HOSTAGE_PLACES): 'temple' (H1's P-12, above), 'high' (H1's rifle: up at the high
 * ready on his free side, away from her, its grip in his right fist, muzzle up past his shoulder), 'ready' (H2's: the gun down at the
 * ready on his free side, in his right fist). Each with his left forearm across her chest to her far shoulder. [grip x, y, th].
 */
/** The hostile's places drawn whole (portrait.js HOSTAGE_PLACES), each to its way of holding. */
export const HOSTAGE_WHOLE = Object.freeze({ hostage: 'temple', hostageHigh: 'high', hostageReady: 'ready' });
// (the art director's pass 3: H1's rifle 'high' no longer up past his shoulder, where "the threat to her no longer reads":
// held at the ready across her, the muzzle down past her far hip)
export const HOSTAGE_GUNS = Object.freeze({ high: Object.freeze([-13.6, 47.0, 0.62]), ready: Object.freeze([-16.6, 46.4, 2.3]), readyRifle: Object.freeze([-15.0, 46.4, 2.05]) });
export function hostageHold(g, B, kit, MID, model = 'p12', how = 'temple') {
  const [rS] = shoulders(MID), over = g.overIds ?? (g.overIds = new Set()), long = model !== 'p12' && model !== 'p9';
  // (his head up and out: every pixel over the neck's row moved, as slumpHead turns it)
  slumpHead(g, MID, { deg: 0, down: HOSTAGE_HEAD.dy, dx: HOSTAGE_HEAD.dx, neckY: 25.2 });
  let fistAt, rElbow, th, flip = false;
  if (how === 'temple') {
    // (the gun tipped up a little from his fist under his jaw to its muzzle on her head's edge at her temple: where its grip falls is
    // the gun's own length back from there)
    const L0 = gunCells(model, g.S, HOSTAGE_TH), muzzleAt = [MID + HOSTAGE_MUZZLE[0], HOSTAGE_MUZZLE[1]];
    fistAt = [muzzleAt[0] - (L0.muzzle[0] - L0.grip[0]) / g.S, muzzleAt[1] - (L0.muzzle[1] - L0.grip[1]) / g.S];
    rElbow = [MID - 21.0, 40.4]; th = HOSTAGE_TH;
  } else {
    const H = HOSTAGE_GUNS[how === 'ready' && long ? 'readyRifle' : how] ?? HOSTAGE_GUNS.ready;
    fistAt = [MID + H[0], H[1]]; rElbow = [MID - 22.4, 40.6]; th = H[2]; flip = Math.cos(th) < 0;
  }
  // (his right arm, then the gun over the forearm, then the fist over the gun's grip)
  const up = arm(g, kit, rS, rElbow, [fistAt[0] - 0.6, fistAt[1] + 2.2], { re: 3.1, rw: 2.5 });
  const gun = gunAt(g, model, fistAt, th, { flip });
  const f = fist(g, kit, [fistAt[0] + 0.2, fistAt[1] + 1.4], 2.5, { h: 2.4, grip: true });
  // (his left forearm low across her chest, along her collarbone, from her near shoulder to his fist on her far shoulder)
  // (the art director's pass 3: "a segmented bar ... a rolled mat": one limb tapering to the wrist, its fist's knuckles on her
  // far shoulder)
  const A = HOSTAGE_ARM, lArm = { fore: limb(g, [MID + A.from[0], A.from[1]], [MID + A.wrist[0], A.wrist[1]], A.r[0], A.r[1], shiftRamp(armRamps(kit).sleeve, 1)) };
  kit.foreIds?.push(lArm.fore);
  const lf = fist(g, kit, [MID + A.fist[0], A.fist[1]], 2.3, { h: 2.3 });
  // (his eye and brow on a board, in the print's line, looking out past her: his face was a blank disc)
  if (kit.gear?.painted) for (const [x, y] of HOSTAGE_EYE) g.put(MID + x + HOSTAGE_HEAD.dx, y + HOSTAGE_HEAD.dy, INK, kit.faceId ?? undefined);
  for (const id of how === 'temple' || how === 'high' ? [up.fore, gun.id, f, lArm.fore, lf] : [lArm.fore, lf]) over.add(id);
  return { muzzle: gun.muzzle, grip: gun.grip, fists: [fistAt, [MID + A.fist[0], A.fist[1]]] };
}

/**
 * D3: sitting where he is, down and ruled out (the judge's pass of 2026-11-20: "Needs way more polish" still held: "upright head ...
 * the rifle presented ... the legs two tan blobs"). Drawn after the body is set down `drop` rows (reference rows of the seated figure),
 * his head already dropped and tilted (doll.js slumpHead): the knees up toward you as two round trouser masses lit on their tops, wide
 * apart, the shins down from them to the boots set wide in a V, their soles dark on the floor, the shadow between the legs; the R-7
 * lying nearly level across his thighs (SEAT.th, under ten degrees), lower than the hands would hold it; the arms from slumped
 * shoulders, his right hand open on the rifle, his left slid off it to the floor by his boot, palm up. Returns { knees, hands, gun, legs,
 * handsAt, onGun (the hand on the rifle), offGun (the hand off it), grip }.
 */
export const SEAT = Object.freeze({ drop: 62, hip: 121, knee: 106, ankle: 127.4, floor: 133.4, kneeD: 12.4, hipD: 7.6, ankleD: 17.4, butt: Object.freeze([-30.2, 118.8]), th: -0.07, kneeR: 5.6 });
export function seated(g, B, kit, MID, model = 'r7', mag = true) {
  const legsT = kit.bareLegs ? flesh(kit.skin) : cloth(kit.legs), bootT = cloth(kit.boots), out = { legs: [] };
  const plain = kit.suit || kit.bareLegs || kit.plain;
  // (the art director's pass 3: "knees and arms one plain rust mass": the legs in the trousers' own pattern (the camouflage's
  // parts), the arms a step darker than the knees, a dark seam where the thighs meet the body)
  const camoOn = !plain && !kit.pt && !kit.towel, join = (id) => { if (camoOn) kit.camoParts?.add(id); return id; };
  const tone = () => legsT;
  // (between the legs, under the thighs: the shadow there, so the two knees stand apart)
  const gap = g.add(g.scan([[MID - 7, SEAT.knee + 2], [MID + 7, SEAT.knee + 2], [MID + 11, SEAT.floor - 1], [MID - 11, SEAT.floor - 1]]), mix(legsT.deep, INK, 0.45));
  out.legs.push(gap);
  for (const s of [-1, 1]) {
    const hip = [MID + s * SEAT.hipD, SEAT.hip], knee = [MID + s * SEAT.kneeD, SEAT.knee], ankle = [MID + s * SEAT.ankleD, SEAT.ankle], T = tone(knee);
    // (the shin from the knee down and out to the boot, a step into the shade; the thigh from the hip toward you up to the knee; the
    // knee's round over its end, lit on its top)
    const sh = join(limb(g, [knee[0] + s * 0.6, knee[1] + 2.4], ankle, 4.6, 3.6, shiftRamp(T, -1)));
    const th = join(limb(g, hip, knee, 6.0, SEAT.kneeR, T));
    const cap = join(ball(g, [knee[0], knee[1] - 0.6], SEAT.kneeR, { light: T.light, soft: T.light, base: T.soft, shade: T.base, deep: T.shade }));
    out.legs.push(sh, th, cap);
    // (the boot end on, its toe toward you, its sole a dark line on the floor)
    const b = limb(g, [ankle[0], ankle[1] + 1.4], [ankle[0] + s * 0.6, SEAT.floor - 2.8], 3.9, 4.1, bootT);
    const sy = Math.round((SEAT.floor - 1.4) * g.S);
    for (let y = sy; y < sy + Math.max(1, Math.round(g.S * 1.2)); y++) for (let x = Math.round((ankle[0] - 5) * g.S); x <= Math.round((ankle[0] + 5) * g.S); x++) if (g.part[y]?.[x] === b) g.col[y][x] = mix(bootT.deep, INK, 0.4);
    out.legs.push(b);
  }
  // (the arms from the slumped shoulders down his sides; the rifle across the thighs; his right forearm onto it, the hand open on the
  // stock; his left arm down his side past its muzzle end, the hand open on the floor, palm up)
  // (his left arm hangs by his side, the hand slid off the rifle to the floor by his boot, palm up)
  const [rS, lS] = shoulders(MID, SEAT.drop + 2.2), rE = [MID - 20.6, SEAT.drop + 52.6], lE = [MID + 21.4, SEAT.drop + 52.6];
  const rHand = [MID - 9.2, 114.4], lHand = [MID + 25.4, 127.4];
  // (the thighs' line under the body: a dark seam across where they meet the belly)
  const seam = g.add(g.scan([[MID - 14, SEAT.drop + 57.4], [MID + 14, SEAT.drop + 57.4], [MID + 13, SEAT.drop + 59], [MID - 13, SEAT.drop + 59]]), mix(legsT.deep, INK, 0.5));
  out.legs.push(seam);
  arm(g, kit, rS, rE, rHand, { upperOnly: true, shade: -1 });
  arm(g, kit, lS, lE, lHand, { upperOnly: true, shade: -1 });
  const gun = model ? gunAt(g, model, [MID + SEAT.butt[0], SEAT.butt[1]], SEAT.th, { anchor: 'butt' }) : null;
  arm(g, kit, rS, rE, rHand, { foreOnly: true, re: 3.1, rw: 2.5, shade: -1 });
  arm(g, kit, lS, lE, lHand, { foreOnly: true, re: 3.1, rw: 2.5, shade: -1 });
  const hands = [openHand(g, kit, [rHand[0] + 0.4, rHand[1] + 1.2], 2.7, 1.9, 1), palmUp(g, kit, [lHand[0] + 0.4, lHand[1] + 1.6], 2.6, 2.0)];
  void mag;
  return { knees: [[MID - SEAT.kneeD, SEAT.knee], [MID + SEAT.kneeD, SEAT.knee]], hands, gun, legs: out.legs, handsAt: [rHand, lHand], onGun: [rHand], offGun: [lHand], grip: gun?.grip ?? null };
}
/** An open hand palm up (reference centre, half sizes): the palm a step lighter than the back, the fingers curled at its far edge. */
export function palmUp(g, kit, c, w = 2.6, h = 2.1) {
  const { hand } = armRamps(kit), S = g.S, id = g.add([], 0);
  kit.handIds?.push(id);
  const X0 = Math.round((c[0] - w) * S), X1 = Math.round((c[0] + w) * S) - 1, Y0 = Math.round((c[1] - h) * S), Y1 = Math.round((c[1] + h) * S) - 1;
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
    if ((x === X0 || x === X1) && (y === Y0 || y === Y1)) continue;
    g.px(x, y, y === Y1 ? hand.shade : x === X1 ? hand.base : y === Y0 ? hand.soft : hand.light, id);
  }
  // (the fingers curled up at the far edge: a crease across the top)
  for (let x = X0 + 1; x < X1; x += 2) g.px(x, Y0 + 1, hand.base, id);
  return id;
}

/**
 * D3's head: the head dropped forward and tilted to one side (SLUMP: degrees, rows down), the eyes shut, on the drawn grid before the
 * pose's bend: every pixel over the neck's row (the head, the hair, the mask) turned about the neck's top. Pure on the grid.
 */
export const SLUMP = Object.freeze({ deg: 17, down: 2.2, neckY: 25.6 });
/** The slumped head's neck (the art director's pass 3: "the tilted head is offset from the collar with no neck"): a column of skin in
 * shade from under the dropped head to the collar, drawn only where nothing is (behind the head, the collar and the mask). */
export function slumpNeck(g, kit, MID, { down = SLUMP.down, neckY = SLUMP.neckY } = {}) {
  const T = flesh(kit.skin), S = g.S, id = g.add([], 0);
  for (let y = Math.round((neckY - 3) * S); y < Math.round((neckY + down + 6) * S); y++) for (let x = Math.round((MID - 4) * S); x < Math.round((MID + 4) * S); x++) {
    if (g.col[y]?.[x] !== null || y >= g.ROWS) continue;
    const u = (x + 0.5) / S - MID;
    g.px(x, y, u < -1.6 ? T.base : u > 2 ? T.deep : T.shade, id);
  }
  g.quiet.add(id);
  return id;
}
export function slumpHead(g, MID, { deg = SLUMP.deg, down = SLUMP.down, neckY = SLUMP.neckY, dx: dxRef = 0 } = {}) {
  const S = g.S, Y = Math.round(neckY * S), cx = MID * S, a = deg * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), dy = Math.round(down * S), ddx = Math.round(dxRef * S);
  const col = [], part = [];
  for (let y = 0; y < Y; y++) { col.push(g.col[y].slice()); part.push(g.part[y].slice()); for (let x = 0; x < g.W; x++) { g.col[y][x] = null; g.part[y][x] = 0; } }
  // (each target pixel over the line (and the rows the head drops into) takes the source pixel turned back to it: no holes)
  for (let y = 0; y < Math.min(g.ROWS, Y + Math.max(0, dy)); y++) for (let x = 0; x < g.W; x++) {
    const px = x + 0.5 - ddx - cx, py = y + 0.5 - dy - Y;
    const sx = Math.floor(cx + px * c + py * sn), sy = Math.floor(Y + -px * sn + py * c);
    if (sy < 0 || sy >= Y || sx < 0 || sx >= g.W || col[sy][sx] === null) continue;
    if (y >= Y && g.col[y][x] !== null && part[sy][sx] < g.part[y][x]) continue;
    g.col[y][x] = col[sy][sx]; g.part[y][x] = part[sy][sx];
  }
}
