// OLYMPUS art: a man side on, a true profile (v0.0.28, F4: the picks of 2026-11-20, samples/portrait-facing F).
//
// The user, 2026-11-20: "The head turned right or profile cards are low effort and terrible, I need you to be serious about this,
// the rest is very good, but please, make an effort for quality." F3 drew the front doll with its features slid two pixels; F2
// squeezed the front doll narrower about its middle (doll.js squeeze, PROFILE_K): neither was a man seen side on. This is: drawn
// fresh in the doll's reference coordinates (64 × 140 at scale 1, 175 cm over 126 rows) on a wider grid (SIDE_W, so a rifle held
// level, 61 reference pixels of it, fits before his face), each part shaped as a man is from the side and shaded in the doll's one
// light (./held.js LIGHT: from the upper left), so a man facing left is drawn, not mirrored: his geometry mirrored, his light the
// same (his front lit, his back in shade; facing right, his back lit).
//   - The head in profile: the skull's round, the brow, the eye under it looking ahead, the nose standing off the face, the lips,
//     the chin and the jaw's line back to the ear, the ear itself with its hollow, the neck set back under the skull; the hair one
//     dark mass over the crown as the cut has it (the front card's); over it what he wears: the force-on-force mask's lens in a clear
//     frame at the eye and its lower shell hugging the face a pixel off it, its strap back over the hair; the combat helmet's shell and rim; the soft cover and its brim; the sealed helmet's shell with its
//     visor's glass at the front and its neck ring.
//   - The body: the torso's depth (the chest ahead, the back behind, the seat), the belt; the plate carrier's front and back plates
//     standing off him, the cummerbund round his side between them, the magazine pouches standing off the front plate with the
//     baseplates of what they hold; the legs one before the other at his stance, the far a step darker, the boots side on.
//   - The arms (./held.js arm, fist; the art director's pass of 2026-11-20): the near arm over the body, bent at its elbow, its fist on
//     the handguard; the far arm behind, a step darker, its fist on the grip.
//   - The gun side on, its weapon card's drawing (./held.js gunAt) placed by its own stations (SIDE_R7: the sight's eyepiece, the
//     grip, the handguard) at the hold the record names: the low ready (the butt in his shoulder's pocket, the muzzle down ahead of
//     him), the high ready (the butt at his belly, the muzzle up before his face), aimed (his eye behind the sight, the butt in his far
//     shoulder under his cheek, that shoulder raised into it), slung (behind his legs, muzzle down), on the back; the pistol at the
//     low and the high ready and aimed, both hands on it.
// The third pass (judge-2.md: "a thumb shape ... a blindfold bar ... the neck as deep as the head ... the forearm a long stick"): the
// role-player's masked head is the near band's hand-placed profile (./near.js HEAD_FOF: the mask's beak, the one-pixel strap, the
// clipped sides, the neck set back); the near forearm the upper arm's length, the elbow under the magazine well aimed and forward of
// the vertical at the low ready; aimed, the cheek down onto the comb (AIM_DROP); the high ready's stock under his arm and the firing
// fist on the grip; the P-12's far hand under the grip. The near arm's joints are returned (arm) for the tests.
// The anchors (the head's and the A zone's centres) stand on his middle, so the card's marks fall on him as on the front. Pure.
import { cloth, flesh, mix, INK, smooth } from './grid.js';
import { tube, gunAt, LIGHT, armRamps, fist, arm, shiftRamp } from './held.js';
import { stamp } from './near.js';
import { NEAR } from './near-holds.js';

/** The R-7's stations on the weapon card's drawing side on (weaponcard.js gunLayer, reference px from its butt along the bore, and
 * across it, down positive): the SO-4's eyepiece less the eye's relief, the grip, the handguard where the support hand holds it. */
export const SIDE_R7 = Object.freeze({ eye: Object.freeze([15.4, -11]), grip: Object.freeze([22.5, 7]), fore: Object.freeze([41, 3.2]) });
/** The P-12 side on: the sight's height over the grip's anchor (the grip's row to the eye's: the bore 4.7 over it, the sight 1.5 more). */
export const SIDE_P12 = Object.freeze({ sightDrop: 6.0 });
/** Aimed, the rifle a little under the eye's line (reference rows): the butt meets the shoulder's top, the cheek on the comb. */
export const AIM_DROP = 1.2;
/** The far fist's share toward the ink (a step into the shade, still a hand: the high ready's firing fist reads on the grip). */
export const FAR_FIST_K = 0.08;
/** The profile's grid width (reference columns): room for a rifle held level before his face (my call). */
export const SIDE_W = 140;
const STEPS = Object.freeze([0.9, 0.68, 0.3, -0.04]);
const toneOf = (T, b) => (b > STEPS[0] ? T.light : b > STEPS[1] ? T.soft : b > STEPS[2] ? T.base : b > STEPS[3] ? T.shade : T.deep);
/** A ramp a step into the shade (the far limbs). */
const far = (T) => ({ light: T.soft, soft: T.base, base: T.shade, shade: mix(T.shade, T.deep, 0.5), deep: T.deep });
/** A part's pixels a share toward the ink (a far limb). */
const darken = (g, id, k) => { for (let y = 0; y < g.ROWS; y++) for (let x = 0; x < g.W; x++) if (g.part[y][x] === id && g.col[y][x] !== null) g.col[y][x] = mix(g.col[y][x], INK, k); };

/**
 * A slab: a polygon (reference, final coordinates) shaded as a body seen side on, round across each row (its left and right edges
 * the cylinder's limbs) and lit along its top, in the ramp T; a new part (or id's). Returns the id.
 */
export function slab(g, pts, T, { id = null, round = 1, top = 0.3 } = {}) {
  const pid = id ?? g.add([], 0), spans = g.scan(pts), rows = new Map();
  for (const [y, a, b] of spans) { const r = rows.get(y); if (r) { r[0] = Math.min(r[0], a); r[1] = Math.max(r[1], b); } else rows.set(y, [a, b]); }
  const inside = (x, y) => { const r = rows.get(y); return !!r && x >= r[0] && x <= r[1]; };
  for (const [y, a, b] of spans) for (let x = a; x <= b; x++) {
    const [L0, L1] = rows.get(y), u = L1 > L0 ? (x + 0.5 - L0) / (L1 + 1 - L0) : 0.5, nx = (2 * u - 1) * round;
    const lit = !inside(x, y - 1) || !inside(x, y - Math.max(1, Math.round(g.S))) ? top : 0;
    g.px(x, y, toneOf(T, nx * LIGHT[0] + Math.sqrt(Math.max(0, 1 - nx * nx)) * LIGHT[2] + lit), pid);
  }
  return pid;
}

/**
 * The figure side on, facing `dir` (1 his front toward the viewer's right, -1 toward the left), on the grid g (SIDE_W wide), the
 * doll's kit (doll.js kitOf and dressKit) and body measures B. hold: the gear's places (kit.gear.rifle.place, .pistol.place).
 * Returns { anchors: { head, aZone } (reference), eye, gun (the drawn gun's stations, reference) }.
 */
/** The poses side on: the body set down `drop` rows and the legs drawn for it (kneel on the far knee, the near foot planted; sitting,
 * the knees up before him; crouched, cowering): doll.js POSE_BENDS' names, the rest standing. */
export const SIDE_POSES = Object.freeze({ kneel: 'kneel', blind: 'kneel', dazeKneel: 'kneel', sit: 'sit', sitD1: 'sit', cower: 'crouch' });
export const SIDE_DROPS = Object.freeze({ kneel: 31, sit: 62, crouch: 28 });
export function sideFigure(g, B, kit, dir = 1, pose = 'stand') {
  const posture = SIDE_POSES[pose] ?? 'stand', D = SIDE_DROPS[posture] ?? 0;
  // (the body's points are the standing figure's set down D rows; the legs' (Q) are where the pose puts them on the floor)
  const M = g.MID, X = (d) => M + dir * d, P = (d, y) => [X(d), y + D], Q = (d, y) => [X(d), y], pts = (list) => list.map(([d, y]) => P(d, y));
  const G = kit.gear ?? null, skin = flesh(kit.skin), legsT = kit.bareLegs ? skin : cloth(kit.legs), topT = kit.suit ? cloth(kit.shell) : cloth(kit.top), bootT = cloth(kit.boots);
  const camo = (id) => { if (!kit.suit && !kit.plain && !kit.pt && !kit.towel) kit.camoParts.add(id); return id; };
  const R = G?.rifle ?? null, Pi = G?.pistol ?? null, out = { eye: P(6.2, 14.6), gun: null };
  const rPlace = R?.place ?? null, pPlace = Pi?.place ?? null;
  const pistolUp = Pi && ['ready', 'high', 'aim', 'aimAway', 'aimSights', 'cupped', 'check', 'hostage', 'hand', 'highOld', 'hostageOld'].includes(pPlace);
  const rifleHeld = R && ['ready', 'high', 'aimYou', 'aimAway', 'aimAwayL', 'aimSights', 'hand'].includes(rPlace) && !pistolUp;
  const aiming = (rifleHeld && /^aim/.test(rPlace)) || (pistolUp && /^aim|cupped/.test(pPlace));
  // (aiming, the head forward and down onto the stock or behind the sights: a pixel and a half ahead, two down)
  // (the art director's pass 3: the cheek down onto the comb, so the butt meets the shoulder's top, not the jaw)
  const hx = aiming ? 2.0 : 0, hy = aiming ? 2.8 : 0;

  // ---- the rifle on his back, behind everything ----
  if (R && rPlace === 'back') gunAt(g, R.model ?? 'r7', P(-8.6, 66), dir > 0 ? -1.66 : Math.PI + 1.66, { anchor: 'butt', flip: dir < 0 });

  // ---- the hold (the judge's pass of 2026-11-20 on F4: "no firing hand ... the support arm is one straight tube ... the butt floats"):
  // the gun placed by its own stations (weaponcard.js gunLayer, held.js SIDE_R7: the R-7's eyepiece 19 ref px ahead of its butt and
  // 11 over its bore, the grip 22.5 ahead and 7 under), so aimed his eye is behind the sight and the butt sits in his shoulder's
  // pocket under the cheek; the near hand on the handguard, the far hand's fist on the grip; both arms bent at the elbow ----
  let gun = null, nearHand = null, farHand = null, nearElbow = null, farElbow = null;
  const sitting = posture === 'sit', eyeAt = [6.4 + hx, 14.6 + hy];
  const SHO = [0.6, 31.4], FSHO = [-0.6, 31];
  const along = (g0, k, down = 0) => { const c = Math.cos(g0.th), s2 = Math.sin(g0.th); return [g0.at[0] + c * k - s2 * down, g0.at[1] + s2 * k + c * down]; };
  if (rifleHeld && sitting) gun = { at: [-8.4, 56.2], th: -0.28, anchor: 'butt', lap: true };
  else if (rifleHeld) {
    // (the high ready: the stock tucked under his arm, the muzzle up before his face, the grip at his upper chest)
    if (rPlace === 'high') gun = { at: [-1.5, 47.0], th: -0.72, anchor: 'butt' };
    else if (aiming) gun = { at: [eyeAt[0] - SIDE_R7.eye[0], eyeAt[1] - SIDE_R7.eye[1] + AIM_DROP], th: 0, anchor: 'butt' };
    else gun = { at: [5.2, 30.6], th: 0.72, anchor: 'butt' };
  } else if (pistolUp) {
    if (pPlace === 'high' || pPlace === 'highOld' || pPlace === 'check') gun = { at: [11.8, 37.6], th: -1.1, anchor: 'grip', pistol: true };
    else if (aiming) gun = { at: [24.2, eyeAt[1] + SIDE_P12.sightDrop], th: 0, anchor: 'grip', pistol: true };
    else gun = { at: [14.6, 50.2], th: 0.86, anchor: 'grip', pistol: true };
  }
  const slung = R && !rifleHeld && rPlace !== 'back' && R ? true : false;
  if (gun && !gun.pistol) {
    // (the far fist on the grip, the near hand on the handguard: by the rifle's stations along its line)
    farHand = along(gun, SIDE_R7.grip[0], SIDE_R7.grip[1] - 0.6); nearHand = along(gun, SIDE_R7.fore[0], SIDE_R7.fore[1]);
    // (the art director's pass 3: the forearm about the upper arm's length, the near elbow forward under the magazine well; at the low ready
    // the upper arm forward of the vertical, the support hand back along the handguard; at the high ready the firing fist on the grip)
    if (aiming) { farElbow = [farHand[0] - 9.6, farHand[1] + 8.6]; nearElbow = [19.4, 44.2]; }
    else if (rPlace === 'high') { farElbow = [5.0, 46.0]; nearElbow = [16.0, 44.0]; nearHand = along(gun, SIDE_R7.fore[0] - 8, SIDE_R7.fore[1] + 0.2); }
    else { farElbow = [2.0, 46.8]; nearElbow = [11.0, 46.5]; nearHand = along(gun, SIDE_R7.fore[0] - 7, SIDE_R7.fore[1]); }
    if (gun.lap) { farHand = null; nearElbow = [0.6, 49.2]; nearHand = along(gun, 34, -2.2); }
  } else if (gun) {
    // (both hands on the pistol: the near fist on its grip, the far hand cupped under it)
    nearHand = [gun.at[0] + 0.2, gun.at[1] + 0.6]; farHand = [gun.at[0] - 0.4, gun.at[1] + 2.6];
    // (aimed, the far hand under and before the grip, its arm's top edge over the near arm's: the two-handed grip side on)
    if (aiming) { nearElbow = [12.6, 29.4]; farElbow = [11.6, 27.0]; farHand = [gun.at[0] + 1.6, gun.at[1] + 2.4]; }
    else if (gun.th < 0) { nearElbow = [3.2, 47.6]; farElbow = [1.4, 46.6]; }
    else { nearElbow = [1.8, 47.6]; farElbow = [-0.6, 46.2]; }
  }
  const up = G?.hands === 'up';

  // ---- the far arm (his arm on the far side), behind the body, a step into the shade ----
  const sleeve = armRamps(kit).sleeve, hand = armRamps(kit).hand;
  const farArm = (sh, el, wr, r = [3.4, 2.9, 2.2]) => { const a = camo(tube(g, sh, el, r[0], r[1], far(sleeve))), b = camo(tube(g, el, wr, r[1] * 0.95, r[2], far(sleeve))); return [a, b]; };
  const nearArm = (sh, el, wr, r = [3.7, 3.1, 2.4]) => { const a = camo(tube(g, sh, el, r[0], r[1], sleeve)), b = camo(tube(g, el, wr, r[1] * 0.95, r[2], sleeve)); return [a, b]; };
  const limbArm = (sh, el, wr, farSide) => { const o = arm(g, kit, sh, el, wr, { rs: farSide ? 3.4 : 3.7, re: farSide ? 2.8 : 3.0 }); if (farSide) for (const id of [o.upper, o.fore]) darken(g, id, 0.22); return o; };

  // (the gun's stations once known: drawn before the body where it is behind him, else after)
  let G1 = null;
  const placeGun = () => {
    if (!gun) return null;
    const model = gun.pistol ? Pi.model ?? 'p12' : R.model ?? 'r7';
    const th = dir > 0 ? gun.th : Math.PI - gun.th;
    return gunAt(g, model, P(gun.at[0], gun.at[1]), th, { anchor: gun.anchor, flip: dir < 0 });
  };
  if (up) farArm(P(-0.6, 31), P(-4, 22), P(-2.6, 12.4));
  else if (farHand && farElbow) limbArm(P(FSHO[0], FSHO[1]), P(farElbow[0], farElbow[1]), P(farHand[0], farHand[1]), true);
  else if (posture === 'crouch') farArm(P(-0.4, 31), P(4.6, 40), P(4.4, 18.6));
  else farArm(P(-1.2, 31), P(-2.6, 50.6), P(-2.4, 67.6));

  // (the slung rifle hanging on its sling, muzzle down, on his far side: drawn behind the legs and the body, a step into the shade, so
  // it reads as one clean shape where it shows past him, not a tangle of parts over his hips (the judge's pass of 2026-11-20))
  if (slung && !up) {
    const sl = gunAt(g, R.model ?? 'r7', P(4.6, 36.6), dir > 0 ? 1.46 : Math.PI - 1.46, { anchor: 'butt', flip: dir < 0 });
    darken(g, sl.id, 0.3);
  }

  // ---- the legs: the far one back a step, the near one ahead, each to its boot ----
  const leg = (hip, knee, ankle, T, near) => camo(near ? tube(g, hip, knee, 6.2, 4.7, T) : tube(g, hip, knee, 5.8, 4.5, T));
  const shin = (knee, ankle, T) => camo(tube(g, knee, ankle, 4.5, 3.3, T));
  const boot = (ankle, T) => {
    const [ax, ay] = ankle, d = (v) => ax + dir * v;
    const id = slab(g, [[d(-3.6), ay - 6], [d(3.2), ay - 6], [d(3.6), ay + 2.4], [d(9.4), ay + 4.6], [d(12.6), ay + 6.2], [d(12.8), ay + 8.6], [d(-4.4), ay + 8.6], [d(-4.6), ay + 2]], T, { round: 0.6 });
    // (the sole a dark band, the lace line lit)
    for (const [yy, x0, x1] of g.rows(ay + 7.6, Math.min(d(-4.4), d(12.8)), Math.max(d(-4.4), d(12.8)), ay + 8.4)) for (let x = x0; x <= x1; x++) if (g.part[yy]?.[x] === id) g.col[yy][x] = mix(T.deep, INK, 0.45);
    return id;
  };
  const farLeg = far(legsT), farBoot = far(bootT);
  if (posture === 'kneel') {
    // (down on his far knee, its shin back along the floor and the boot's toes tucked; the near foot planted ahead, the shin upright)
    leg(Q(-1.6, 89.6), Q(-1.4, 127.6), null, farLeg, false); shin(Q(-1.4, 127.6), Q(-24, 128.6), farLeg);
    slab(g, [Q(-24.4, 123.2), Q(-29.6, 124.4), Q(-30.2, 133.4), Q(-24.8, 133.4)], farBoot, { round: 0.6 });
    leg(Q(1.2, 90.4), Q(27.4, 96.6), null, legsT, true); shin(Q(27.4, 96.6), Q(26.4, 124.6), legsT); boot(Q(26.4, 124.6), bootT);
  } else if (posture === 'sit') {
    // (sitting on the floor, the knees up before him, the boots flat)
    leg(Q(-1.6, 118.6), Q(18.6, 99.6), null, farLeg, false); shin(Q(18.6, 99.6), Q(25.4, 124.6), farLeg); boot(Q(25.4, 124.6), farBoot);
    leg(Q(1.2, 119.4), Q(21.8, 100.8), null, legsT, true); shin(Q(21.8, 100.8), Q(30.4, 124.8), legsT); boot(Q(30.4, 124.8), bootT);
  } else if (posture === 'crouch') {
    // (crouched on his heels: the knees up and ahead, the shins back to the boots under him)
    leg(Q(-1.6, 86.6), Q(14.6, 95.6), null, farLeg, false); shin(Q(14.6, 95.6), Q(-1.4, 124.2), farLeg); boot(Q(-2.4, 124.2), farBoot);
    leg(Q(1.2, 87.4), Q(17.6, 97.6), null, legsT, true); shin(Q(17.6, 97.6), Q(2.6, 124.6), legsT); boot(Q(1.6, 124.6), bootT);
  } else {
    leg(P(-1.6, 58.6), P(-4.4, 98.4), null, farLeg, false); shin(P(-4.4, 98.4), P(-8.2, 124.2), farLeg); boot(P(-8.2, 124.2), farBoot);
    leg(P(1.2, 59.2), P(4.6, 98.6), null, legsT, true); shin(P(4.6, 98.6), P(3.8, 124.6), legsT); boot(P(3.8, 124.6), bootT);
  }
  // (the cargo pocket on the near thigh: its flap and its seam)
  if (posture === 'stand' && !kit.suit && !kit.pt && !kit.towel) { const cp = slab(g, pts([[-2.6, 74], [4.2, 74.4], [4.6, 86], [-2.2, 86.4]]), legsT, { round: 0.8 }); camo(cp); for (const [yy, x0, x1] of g.rows(76, Math.min(X(-2.6), X(4.2)), Math.max(X(-2.6), X(4.2)))) for (let x = x0; x <= x1; x++) if (g.part[yy]?.[x] === cp) g.col[yy][x] = legsT.deep; }
  // (the holster on his right thigh when it is the near one: facing left)
  if (Pi && dir < 0 && !G?.painted && posture === 'stand') { const T = cloth(kit.armour?.color ?? 0x2a2c34), h = slab(g, pts([[-2.4, 60], [3.4, 60], [3.8, 82], [-2, 82]]), T, { round: 0.7 }); void h; if (!pistolUp) slab(g, pts([[-1.6, 58], [3.2, 58], [3.2, 62], [-1.6, 62]]), cloth(0x2a2c34)); }

  // ---- the torso: the chest ahead, the back behind, the seat; the belt ----
  const torso = camo(slab(g, pts(smooth([[3.6, 26.6], [6.6, 29.2], [8.6, 33.6], [9, 40], [8.2, 46], [7.2, 52], [7, 58], [7.6, 63.4], [-1, 65], [-7.6, 63.2], [-7.4, 56], [-6.2, 50], [-6.8, 43], [-7.8, 36], [-7.4, 30.4], [-4.6, 26.6]], 3)), topT, { round: 0.95 }));
  void torso;
  if (!kit.suit) { const belt = slab(g, pts([[-7.6, 56.6], [7.4, 56.6], [7.6, 59.4], [-7.6, 59.4]]), cloth(0x3a3328), { round: 0.9, top: 0.2 }); const [bx, by] = P(6.4, 57.6); g.put(bx, by, 0x9aa1ae, belt); }
  else { const belt = slab(g, pts([[-7.6, 56.6], [7.4, 56.6], [7.6, 59], [-7.6, 59]]), cloth(kit.rings), { round: 0.9 }); void belt; }
  // ---- the plate carrier: the back plate, the cummerbund round his side, the front plate, the pouches standing off it ----
  if (kit.armour) {
    const A = cloth(kit.armour.color), Pp = cloth(kit.armour.pouch ?? kit.armour.color);
    slab(g, pts([[-7.2, 30], [-10.8, 31], [-11.6, 38], [-11.6, 52], [-7.4, 53]]), A, { round: 0.8 });
    slab(g, pts([[-8.4, 41.6], [8.6, 41.6], [8.8, 53.6], [-8.6, 53.6]]), A, { round: 0.6, top: 0.15 });
    // (the shoulder strap over the top, front to back)
    slab(g, pts([[-6.6, 27.6], [4.4, 26.8], [8, 30.6], [-7.6, 31.4]]), A, { round: 0.7 });
    slab(g, pts([[7.2, 29.6], [11.2, 30.4], [12, 37], [11.8, 53.6], [7.6, 54.4]]), A, { round: 0.8 });
    // (the magazine pouches: one standing off the plate side on, the baseplates of what it holds over its lip)
    const pid = slab(g, pts([[11.4, 43.4], [15.4, 43.4], [15.8, 53.6], [11.6, 54]]), Pp, { round: 0.7 });
    const pouches = G?.carrier?.pouches ?? null, mags = pouches ? pouches.filter(p => p.key !== 'dump').reduce((a, p) => a + (p.mags ?? 0), 0) : 2;
    for (const [yy, x0, x1] of g.rows(45 + D, Math.min(X(11.6), X(15.6)), Math.max(X(11.6), X(15.6)))) for (let x = x0; x <= x1; x++) if (g.part[yy]?.[x] === pid) g.col[yy][x] = Pp.deep;
    if (mags > 0) { const b = g.add(g.rows(41.4 + D, Math.min(X(12.2), X(14.8)), Math.max(X(12.2), X(14.8)), 42.8 + D), 0x23252f); g.on(b, g.rows(41.4 + D, Math.min(X(12.2), X(14.8)), Math.max(X(12.2), X(14.8))), 0x4c5262); }
    // (the dump pouch at the hip behind)
    if (G?.carrier?.pouches?.some(p => p.key === 'dump')) slab(g, pts([[-6.4, 58.4], [-11.4, 58.8], [-12, 66.6], [-6.8, 67.2]]), Pp, { round: 0.7 });
  }

  // ---- the rifle aimed: behind his head and his near shoulder (its stock on his far cheek, the butt in his far shoulder's pocket) ----
  if (gun && aiming && !gun.pistol) G1 = placeGun();
  // (aimed, the far shoulder raised into the butt: its round under the stock, a step into the shade)
  if (gun && aiming && !gun.pistol) tube(g, P(gun.at[0] + 4.4, gun.at[1] + 2.8), P(gun.at[0] + 6.4, gun.at[1] + 4.2), 3.6, 3.4, far(kit.suit ? cloth(kit.shell) : topT));

  // ---- the neck (narrower, set back under the skull) and the head ----
  // (the art director's pass 3: the masked head (the live role-player's) is the near band's hand-placed profile, neck and
  // all (./near.js HEAD_FOF): the mask's beak, the 1 px strap, the neck set back; the other heads are drawn here)
  const fofHead = !!kit.gear?.mask && !kit.head;
  if (fofHead) {
    const st = stamp(g, kit, NEAR.HEAD_FOF, { flip: dir < 0, dx: hx, dy: hy + D });
    kit.faceId = st.head;
    out.eye = P(NEAR.HEAD_FOF.stations.eye[0] + hx, NEAR.HEAD_FOF.stations.eye[1] + hy);
  } else {
    const neck = tube(g, P(-0.8 + hx * 0.5, 20.6 + hy), P(-0.2, 29.4), 3.3, 3.9, skin);
    g.quiet.add(neck);
  }
  if (fofHead) { /* (drawn above) */ }
  else if (kit.head?.kind !== 'vac') headSide(g, kit, X, P, dir, hx, hy, skin, out);
  else vacSide(g, kit, X, P, dir, hx, hy, out);

  // ---- the gun before him, the far fist on its grip, then the near arm and its hand ----
  if (gun && !(aiming && !gun.pistol)) G1 = placeGun();
  if (G1) out.gun = G1;
  if (farHand && !gun?.lap) { const id = fist(g, kit, P(farHand[0], farHand[1]), 2.4, { h: 2.2, grip: true }); darken(g, id, FAR_FIST_K); }
  // (the shoulder's round over the carrier's strap, the arm from it)
  if (!kit.suit && !kit.bareArms) camo(tube(g, P(0.2, 31.6), P(0.6, 33.2), 4.3, 4.0, sleeve)); else tube(g, P(0.2, 31.6), P(0.6, 33.2), 4.3, 4.0, kit.suit ? cloth(kit.shell) : sleeve);
  if (up) { nearArm(P(0.6, 31.4), P(3.6, 21.4), P(3, 12.2)); openPalm(g, kit, P(3, 9.6), dir); }
  else if (posture === 'crouch' && !nearHand) { nearArm(P(0.6, 31.4), P(8.6, 40.4), P(6.4, 17.6)); fist(g, kit, P(6.6, 16.8), 2.5); }
  else if (nearHand) {
    limbArm(P(SHO[0], SHO[1]), P(nearElbow[0], nearElbow[1]), P(nearHand[0] - 1.2, nearHand[1] + 0.8), false);
    out.arm = { shoulder: P(SHO[0], SHO[1]), elbow: P(nearElbow[0], nearElbow[1]), hand: P(nearHand[0] - 1.2, nearHand[1] + 0.8) };
    if (gun?.lap) openHandSide(g, kit, P(nearHand[0], nearHand[1] + 1.4), dir); else fist(g, kit, P(nearHand[0], nearHand[1]), 2.5, { h: 2.3, grip: !!gun?.pistol });
  } else {
    nearArm(P(0.8, 31.4), P(1.8, 50.6), P(3, 67.2));
    fist(g, kit, P(3.2, 69.4), 2.5);
  }
  void hand;
  return { anchors: { head: [M, 16 + hy + D], aZone: [M, 37.6 + D] }, eye: out.eye, gun: out.gun, drop: D, arm: out.arm ?? null };
}

// (an open hand lying on the rifle side on: the back of the hand lit, the fingers down over it)
function openHandSide(g, kit, c, dir) {
  const { hand } = armRamps(kit), x = c[0], y = c[1];
  const id = slab(g, [[x - 2.6 * dir, y - 1.6], [x + 2.8 * dir, y - 1.8], [x + 3.4 * dir, y + 1.8], [x - 2.2 * dir, y + 1.4]].map(([a, b]) => [a, b]), hand, { round: 0.5, top: 0.4 });
  kit.handIds?.push(id);
  return id;
}

// (an open palm up by the head: the hands up, the fingers to the sky)
function openPalm(g, kit, c, dir) {
  const { hand } = armRamps(kit);
  const id = slab(g, [[c[0] - 2.4, c[1] - 4.2], [c[0] + 2.4, c[1] - 4.6], [c[0] + 2.6, c[1] + 2], [c[0] - 2.2, c[1] + 2.4]], hand, { round: 0.8 });
  kit.handIds?.push(id);
  void dir;
  return id;
}

// ---------- the head side on ----------

function headSide(g, kit, X, P, dir, hx, hy, S, out) {
  const p = (d, y) => P(d + hx, y + hy), pts = (list) => list.map(([d, y]) => p(d, y));
  // (the skull and the face as one profile: the back of the head, the crown, the brow, the nose, the lips, the chin, the jaw to the ear)
  const head = slab(g, pts(smooth([[-7.8, 14], [-8.1, 9.4], [-6.4, 4.8], [-2.2, 2.6], [3, 2.8], [6.6, 5.4], [7.8, 9.4], [8, 12.2], [7.6, 13.4],
    [8.6, 15.2], [10.2, 17.6], [8.8, 18.6], [8.6, 19.6], [8.1, 20.4], [8.4, 21.4], [7.8, 22.6], [7.6, 24], [5.8, 25.2], [2.6, 24.8], [0, 22.6], [-2.6, 22], [-6.4, 19.8]], 2)), S, { round: 0.9, top: 0.2 });
  kit.faceId = head;
  const on = (d, y, c) => { const [x, yy] = p(d, y); g.put(x, yy, c, head); };
  const hairC = kit.hair.color, brow = mix(hairC, S.deep, 0.15), white = mix(0xf6f4ee, kit.skin, 0.15), iris = 0x2a1c18;
  // (the jaw's underside: a line of shade from the chin back and up to under the ear, the neck set back under it; the cheek's shade
  // under the cheekbone; the nostril; the lips' parting)
  for (let t = 0; t <= 1.0001; t += 0.08) on(6.6 - t * 7.2, 24.6 - t * 3.4, S.shade);
  for (let d = 0.4; d <= 4.6; d += 0.7) on(d, 18.6 + d * 0.1, S.soft);
  on(8.4, 17.6, S.deep); on(7.6, 20.2, S.deep); on(7.1, 20.2, S.shade); on(6.4, 24.4, S.deep);
  // (the eye: its white and its iris looking ahead under the brow; the brow's hair; the eye's socket in shade)
  on(5.4, 12.6, brow); on(6.4, 12.4, brow); on(7.2, 12.6, brow);
  on(5.6, 14.6, white); on(6.4, 14.6, iris); on(5.6, 13.8, S.shade); on(6.4, 13.8, mix(S.shade, S.deep, 0.5));
  out.eye = p(6.4, 14.6);
  // (the ear at the jaw's back: its rim, one fold of shade in its hollow; a shape, not a glyph)
  // (drawn as the head's own part, so no seam rings it)
  slab(g, pts(smooth([[-2.0, 12.2], [0.6, 11.8], [1.2, 14.4], [0.8, 17.6], [-0.6, 18.8], [-2.0, 17.2]], 2)), { ...S, light: S.soft }, { id: head, round: 0.5, top: 0 });
  for (const [d, y] of [[-0.6, 14.4], [-0.6, 15.4], [0.4, 18.0]]) { const [x, yy] = p(d, y); g.put(x, yy, S.shade, head); }
  // (the hair: one dark mass over the crown and down the back of the head to the ear's top and the nape, as the front card's hair is
  // the same tone and edge (the judge's pass of 2026-11-20: "a skin-coloured egg ... he reads bald"); its lit top; the sideburn)
  const H = cloth(hairC), cut = kit.hair.style, step = kit.hair.step ?? 0;
  if (cut !== 'shaved' && !kit.head) {
    const hi = cut === 'highTight';
    const mass = hi ? [[6.6, 6.0], [5.8, 3.8], [2.6, 2.0], [-2.4, 1.8], [-6.4, 3.8], [-8.3, 7.8], [-8.1, 10.2], [-6.0, 8.8], [-2.6, 6.8], [1.6, 5.6], [4.6, 5.8]]
      : [[7.2, 7.6], [6.6, 4.6], [3.0, 1.8], [-2.4, 1.6], [-6.8, 3.8], [-8.4, 8.4], [-8.3, 13.6], [-6.8, 17.0], [-5.0, 16.6], [-3.8, 12.8], [-2.2, 10.8], [0.8, 9.8], [3.8, 8.4]];
    const hid = slab(g, pts(smooth(mass.map(([d, y]) => [d, step >= 3 && y < 6 ? y - 1 : y]), 2)), H, { round: 0.8, top: 0.35 });
    { const [x, y] = p(2.6, 9.4); g.put(x, y, H.base, hid); const [x2, y2] = p(2.6, 10.4); g.put(x2, y2, H.shade, hid); }
    if (cut === 'bun') slab(g, pts([[-9.8, 6], [-7, 4.6], [-6.6, 9], [-9.6, 9.4]]), H, { round: 0.8 });
  }
  // (what he wears on his head)
  if (kit.gear?.mask) maskSide(g, kit, p, pts);
  if (kit.head?.kind === 'helmet') {
    const T = cloth(kit.head.color);
    const sh = slab(g, pts(smooth([[-10, 15.6], [-10.6, 9], [-8, 3.4], [-2.6, 0.6], [3.6, 0.8], [8.2, 3.6], [10, 8.4], [9.4, 10.6], [6.6, 10.2], [1.6, 10.6], [1.4, 13.6], [-3, 14.4], [-6.6, 16.6]], 3)), T, { round: 0.85, top: 0.25 });
    for (const [yy, x0, x1] of g.rows(9.8 + hy + P(0, 0)[1], Math.min(X(-10 + hx), X(9.6 + hx)), Math.max(X(-10 + hx), X(9.6 + hx)))) for (let x = x0; x <= x1; x++) if (g.part[yy]?.[x] === sh) g.col[yy][x] = T.deep;
    // (the night-vision mount at the brow, the chin strap down past the ear)
    slab(g, pts([[6.2, 4.4], [9, 5.2], [9.2, 8], [6.4, 7.8]]), cloth(0x353947), { round: 0.6 });
    for (let y = 14; y <= 24; y += 0.6) { const [x, yy] = p(1.2 + (y - 14) * 0.36, y); g.put(x, yy, 0x2c2e38); }
  } else if (kit.head?.kind === 'cover') {
    const T = cloth(0x9a6a4a);
    const top = slab(g, pts(smooth([[-9.4, 9.6], [-9.8, 5.4], [-7, 2], [3, 1.6], [7.6, 3.2], [8.4, 7.6], [8, 9.8]], 3)), T, { round: 0.8 });
    kit.camoParts.add(top);
    slab(g, pts([[6.6, 8], [13, 8.8], [13, 10.2], [6.6, 10.4]]), cloth(0x5a4030), { round: 0.4 });
  }
}

// (the force-on-force mask side on: the lens standing off the eyes in its black frame, the moulded lower shell off the mouth and
// the chin with its vents, the strap back over the ear to the back of the head)
function maskSide(g, kit, p, pts) {
  const C = { frame: 0x24262d, shell: 0x3a3d46, lit: 0x5a5f6c, vent: 0x15161c, lens: 0x9fc4d8, glint: 0xe8f4fa, strap: 0x2c2e35 };
  const shell = cloth(C.shell);
  // (the strap from the lens's frame back over the hair above the ear: one row)
  for (let d = -8.6; d <= 4.4; d += 0.5) { const [x, y] = p(d, 10.6 + (d + 8.6) * 0.03); g.put(x, y, C.strap); }
  // (the lower shell hugging the face (the judge's pass of 2026-11-20: "a box glued on"): from under the lens over the nose and the
  // mouth a pixel off them, round the chin and back along the jaw to under the cheek; its vents)
  const lower = slab(g, pts(smooth([[4.8, 16.8], [9.4, 16.6], [10.9, 18.0], [10.2, 19.8], [9.8, 21.8], [9.2, 23.6], [7.6, 25.6], [4.8, 26.0], [2.0, 24.2], [1.4, 22.6], [3.2, 21.4], [4.2, 19.2]], 2)), shell, { round: 0.7, top: 0.3 });
  for (const y of [19.8, 21.6]) { const [x, yy] = p(9.0, y); g.put(x, yy, C.vent, lower); }
  // (the lens over the eye in its frame, a clear oblong: the eye seen through it, its glint)
  const frame = slab(g, pts([[4.4, 10.6], [9.4, 10.8], [9.8, 16.6], [4.4, 16.6]]), cloth(C.frame), { round: 0.3 });
  for (let y = 11.4; y <= 15.8; y += 0.5) for (let d = 5.2; d <= 9.0; d += 0.5) { const [x, yy] = p(d, y), xx = Math.round(x * g.S), yr = Math.round(yy * g.S); if (g.part[yr]?.[xx] === frame) g.col[yr][xx] = mix(C.lens, 0x283f6b, 0.35 + (d - 5) * 0.05); }
  { const [x, y] = p(6.4, 14.6); g.put(x, y, 0x2a1c18, frame); }
  { const [x, y] = p(8.4, 11.8); g.put(x, y, C.glint, frame); }
}

// (the sealed helmet side on: the shell a size over the head, the visor's glass at the front from the brow to the chin, its glint,
// the neck ring under it)
function vacSide(g, kit, X, P, dir, hx, hy, out) {
  const p = (d, y) => P(d + hx, y + hy), pts = (list) => list.map(([d, y]) => p(d, y)), T = cloth(kit.head.color ?? kit.shell), V = kit.head.visor ?? kit.head.helm?.visor ?? 0x33465a;
  const shell = slab(g, pts(smooth([[-12, 16], [-12.6, 8], [-9.6, 1.6], [-1, -0.8], [7, 1], [11.6, 6.4], [12.6, 13], [11.6, 21], [8.6, 27], [0, 28.6], [-8, 27.4], [-11.4, 22]], 3)), kit.head.helm ? cloth(kit.head.helm.shell) : T, { round: 0.9, top: 0.25 });
  const H = kit.head.helm ?? null;
  if (H) {
    // (a helmet candidate side on (helmets.js: the figure's right view): its visor a band at the front in its glass, lit along its top,
    // the trim's line under it round to the back, the moulded jaw standing off the face below; the eye's glow at its slit)
    const VT = { light: H.lit ?? mix(H.visor, 0xb8d8ec, 0.4), soft: H.visor, base: H.visor, shade: mix(H.visor, INK, 0.3), deep: mix(H.visor, INK, 0.5) };
    const visor = slab(g, pts(smooth([[2.4, 9.2], [11.2, 8.4], [12.8, 11.6], [12.6, 15], [2.2, 15]], 2)), VT, { round: 0.25, top: 0.9 });
    { const [x, y] = p(10.6, 12.2); if (H.eye) g.put(x, y, mix(H.eye, 0xfff4e0, 0.12), visor); }
    const jaw = slab(g, pts(smooth([[4, 16.4], [10.6, 16], [12, 19.4], [10.6, 24.6], [6.6, 27.4], [2.6, 26.6]], 2)), cloth(H.jaw ?? kit.head.color), { round: 0.7, top: 0.2 });
    for (const y of [19.8, 21.6, 23.4]) { const [x, yy] = p(9.8, y); g.put(x, yy, cloth(H.jaw ?? kit.head.color).deep, jaw); }
    if (H.trim) for (let d = -12; d <= 12; d += 0.5) { const [x, y] = p(d, 15.6), xx = Math.round(x * g.S), yr = Math.round(y * g.S); if (g.part[yr]?.[xx] === shell || g.part[yr]?.[xx] === jaw || g.part[yr]?.[xx] === visor) g.put(x, y, H.trim); }
  } else {
    const visor = slab(g, pts(smooth([[4.4, 8.4], [10.8, 7.6], [12.4, 13], [11.6, 20], [8.4, 23.4], [4.6, 22.4], [3.6, 15]], 2)), { light: mix(V, 0xb8d8ec, 0.5), soft: mix(V, 0xb8d8ec, 0.25), base: V, shade: mix(V, INK, 0.3), deep: mix(V, INK, 0.5) }, { round: 0.8 });
    { const [x, y] = p(9.6, 10); g.put(x, y, 0xb8d8ec, visor); const [x2, y2] = p(10.4, 11); g.put(x2, y2, 0xb8d8ec, visor); }
    if (kit.trim || kit.band) for (let d = -11; d <= 3.6; d += 0.5) { const [x, y] = p(d, 12.6); if (g.part[Math.round(y * g.S)]?.[Math.round(x * g.S)] === shell) g.put(x, y, kit.trim ?? kit.band, shell); }
  }
  const Rg = cloth(kit.rings);
  slab(g, pts([[-9, 27], [8.6, 26.6], [8.8, 30], [-9.2, 30.2]]), Rg, { round: 0.8 });
  out.eye = p(6.4, 14.6);
}
