// OLYMPUS art: the pistols' drawings. The P-12 side on, on the weapon card and as the figure's template, in any finish.
//
// The P-12 (WEAPONS §3.2's #1, as built in v0.0.14: COMBAT §25.19.6) is the sidearm issued in close quarters from the
// Sergeant up: a striker pistol, 19.5 cm, with an oversized ambidextrous frame safety (up safe, down fire), irons (the
// RD-1P red dot waits), a HAD-17 holding the house's ten frangible rounds, carried on the right thigh. Until v0.0.14 the
// weapon card drew the R-7 whatever was in hand (WEAPONS §3.2's note, VIEWS §4.4); this module is the machinery the card
// needs for a pistol, and four designs of the P-12 for the user to score in the gallery (samples/p12-card, samples/p12-draw),
// as the rifles were chosen (src/art/rifles.js). The game draws none of them yet: PISTOL_DRAWN_AS is empty, so the card
// keeps drawing what it drew, and only a sample's explicit `drawing` (weaponcard.js paintWeaponCard) reaches a design here.
// A design is a set of shape choices, never a gun's data (the P-12 stays the P-12), drawn in any finish
// (src/data/finishes.js, the rifles' own: the frame in the furniture ramp, the slide in the metal ramp, so the Corps'
// black is a dark slide over a black polymer frame, and flat dark earth the usual tan frame under a black slide):
//   - p12a, "the service pistol": a squared slide with rear and front serrations, the frame's accessory rail under its
//     dust cover, a rounded undercut guard, a short beavertail, a stippled grip, a flush baseplate, low irons;
//   - p12b, "the slab": a flat-sided slide with a chamfered nose and angled serrations, the RD-1P's cut on the slide
//     closed by its cover plate (the dot waits: the plate is drawn, not the sight), a ledge rear sight that racks the
//     slide off a belt or a boot one-handed, a squared guard with a hook, a flared magwell, a pad on the baseplate;
//   - p12c, "the monolith": slide and frame in one tone, the slide's top sloping from a tall rear to the nose, a full
//     dust cover to the muzzle, a straight-backed grip in finger grooves, a long beavertail;
//   - p12d, "the lanyard": a rounded slide (the classic's), fish-scale serrations, a lightening window over the barrel's
//     front, a round guard, a wrapped grip, and a lanyard loop at the heel (a marine's pistol is tied on: in free fall a
//     dropped one leaves, WEAPONS' gravity table).
// A drawing has:
//   - card(c): the pistol at PISTOL_CARD_PX_PER_M, three times the rifle's card density (a 19.5 cm pistol at the rifle's
//     144 px/m would be 28 px on a 180 px card: at 432 it is 84 px and reads), muzzle to the right, its state as the
//     holder believes it drawn on it (c.P: weaponcard.js cardParts, read from the belief alone): the slide locked back
//     (P.locked) the barrel standing out of its nose; the port's hood with a sliver of brass at its rear when a round is
//     believed chambered (the P-12's loaded chamber witness, my call), a dummy's orange, a stovepipe standing out of the
//     port or a double feed in it once looked at; the HAD-17 in the grip, its believed rounds seen through a witness slot
//     in the grip's back (the HAD-17 has its witness holes, models.js FAMILIES.had17.window; the slot is the P-12's, my
//     call) from the top, an approximate count's top dithered, a count unknown the slot blind and "?" on the baseplate;
//     the magazine out, the well's mouth open and dark; the safety's paddle up (safe) or down; a magazine in the hand
//     right of the muzzle, its witness holes to its believed count and its top round's nose by the believed kind. It
//     returns the card's stations for weaponcard.js's words: the safety's pivot and its two marks, the "?" or "!" over
//     the port, where the mode's word, the count and the hand's words go. c gives px (paint.js), P, say (the card's words);
//   - fig: the figure's template at 16 px/m in templates.js GUNS.pistol's form (the same stations scaled to its length, so
//     every hand of compose.js holds it unchanged), written as art like the rifles': '.' empty, n gun metal, u black
//     polymer, v steel, t the furniture (the frame), l its lit edge, d its dark, o a glint. compose.js draws GUNS.pistol
//     for every pistol until a pick wires a design through (the samples swap the template in for their own pictures).
// No maker's names: the shapes only. Pure: no DOM, no three.js.
import { FINISHES, finishId, ISSUE_FINISH } from '../data/finishes.js';
import { tone } from './tone.js';
import { GUNS } from './figures/templates.js';
import { FURN, FURN_L, FURN_D, CLEAR } from './rifles.js';

/** The pistol's density on the card: three times the rifle's (weaponcard.js CARD_PX_PER_M 144; see the header). */
export const PISTOL_CARD_PX_PER_M = 432;
/** The P-12's length (WEAPONS §3.2: 19.5 cm), how far its slide locks back, and the HAD-17's length and capacity (WEAPONS §3.3). */
export const P12_LEN_M = 0.195, SLIDE_BACK_M = 0.022, HAD17_LEN_M = 0.12, HAD17_N = 17;

// The card's frame of reference: the slide's rear (forward) at X0, the bore's row Y0; the HAD-17 in the hand at HAND_X, its
// feed lips at HAND_Y. (the grip's foot about Y0 + 47, clear of the floor's line at 102 and the words at 112)
const X0 = 44, Y0 = 46, HAND_X = 150, HAND_Y = 44;
const M = (m) => Math.round(m * PISTOL_CARD_PX_PER_M);
const at = (m) => X0 + M(m);

// ---------- the card's fixed colours (weaponcard.js's, repeated: that module imports this one) ----------

const INK = 0x14151c, STEEL = 0x6e7582, STEEL_L = 0x9aa1ae, STEEL_D = 0x49403e;
const BRASS = 0xd0ac5e, BRASS_L = 0xf0d48a, DUMMY = 0xe08a3a, AMBER = 0xe7b84a, MARK = 0xdad0bc;
const COPPER = 0xb8643a, TRACER_TIP = 0xc23b2e, SKIN = 0xb0806a, SKIN_D = 0x8a5e4c;

// ---------- the designs' shapes (see the header) ----------

/**
 * A design's shape choices: the slide (its top's rows above the bore at the rear and the front, its nose, its serrations,
 * a cut, its tone), the sights, the frame (how far its dust cover runs, a rail, the guard, the beavertail), the grip (its
 * slant in px a row, its texture, the baseplate, a magwell flare, finger grooves, a lanyard loop).
 */
const SHAPES = Object.freeze({
  p12a: Object.freeze({ top: [8, 8], nose: 'square', ser: 'line', front: [0.145, 0.168], cut: null, tone: 'metal', sights: 'low',
    dust: 0.168, rail: true, guard: 'round', beaver: 'short', slant: 0.3, texture: 'stipple', plate: 'flush', flare: false, grooves: false, lanyard: false }),
  p12b: Object.freeze({ top: [8, 8], nose: 'chamfer', ser: 'angled', front: [0.14, 0.165], cut: 'plate', tone: 'metal', sights: 'ledge',
    dust: 0.175, rail: true, guard: 'hook', beaver: 'short', slant: 0.3, texture: 'stipple', plate: 'pad', flare: true, grooves: false, lanyard: false }),
  p12c: Object.freeze({ top: [9, 7], nose: 'slope', ser: 'line', front: null, cut: null, tone: 'frame', sights: 'low',
    dust: 0.19, rail: false, guard: 'square', beaver: 'long', slant: 0.18, texture: 'grooves', plate: 'flush', flare: false, grooves: true, lanyard: false }),
  p12d: Object.freeze({ top: [8, 8], nose: 'round', ser: 'fish', front: null, cut: 'window', tone: 'metal', sights: 'low',
    dust: 0.16, rail: false, guard: 'round', beaver: 'short', slant: 0.32, texture: 'wrap', plate: 'flush', flare: false, grooves: false, lanyard: true }),
});

/** The grip's rows and its top edge's places (the frame's): rows down from Y0 + GRIP_TOP, back and front at the top. */
const GRIP_TOP = 10, GRIP_ROWS = 36, GRIP_BACK_M = 0.012, GRIP_FRONT_M = 0.062;
/** The slide's lowest row below the bore, the frame's dust cover's rows (Y0 + 4 to + 9), the port's span (metres from the rear). */
const SLIDE_BOT = 3, PORT_M = Object.freeze([0.07, 0.112]);

// (the slide's rows: its top row at metre m along it, from `top` at the rear to the front's)
const slideTop = (D, m) => Y0 - Math.round(D.top[0] + (D.top[1] - D.top[0]) * Math.min(1, Math.max(0, m / P12_LEN_M)));

/** The grip's edges at row j (0 at the top): [back x, front x), slanting back as it goes down; finger grooves bite the front. */
function gripRow(D, j) {
  const shift = Math.round(j * D.slant), back = at(GRIP_BACK_M) - shift;
  let front = at(GRIP_FRONT_M) - shift;
  if (D.grooves && j > 9 && j < GRIP_ROWS - 3) { const k = (j - 10) % 8; if (k === 0 || k === 7) front -= 1; }
  if (D.flare && j >= GRIP_ROWS - 4) return [back - (j - GRIP_ROWS + 5), front + (j - GRIP_ROWS + 5)];
  return [back, front];
}

// ---------- the card: the body ----------

// The frame in the furniture ramp (F, FL, FD, FDD) and the slide in the metal's (B, BL, a step darker for its seams), or,
// a 'frame' tone, in the furniture's too (p12c, one piece to the eye).
const slideRamp = (C, D) => (D.tone === 'frame' ? { L: C.FL, M: C.F, D: C.FD, DD: C.FDD } : { L: C.BL, M: C.B, D: tone(C.B, -0.04), DD: INK });

// The barrel under the slide (seen only where the slide is back, or through the port), then the frame (the grip, its
// texture, the beavertail, the dust cover and its rail, the guard, the trigger, the slide stop), then the slide over them.
function bodyCard(C, D, c) {
  const { px } = c, back = c.P.locked ? M(SLIDE_BACK_M) : c.P.seen === 'double' ? 4 : 0, sl = (m) => at(m) - back, S = slideRamp(C, D);
  // The barrel: its tube from the chamber to the crown, lit along its top, a pixel proud of the slide's nose.
  px(at(0.06), Y0 - 3, at(P12_LEN_M) + 1 - at(0.06), 5, STEEL_D); px(at(0.06), Y0 - 3, at(P12_LEN_M) + 1 - at(0.06), 1, STEEL);
  px(at(P12_LEN_M), Y0 - 1, 1, 2, INK);
  // The grip: each row from its back to its front, lit on its back edge, dark on its front; its texture inside.
  for (let j = 0; j < GRIP_ROWS; j++) {
    const [b, f] = gripRow(D, j), y = Y0 + GRIP_TOP + j;
    px(b, y, f - b, 1, C.F); px(b, y, 1, 1, C.FL); px(f - 1, y, 1, 1, C.FD);
    if (j < 3 || j > GRIP_ROWS - 4) continue;
    for (let x = b + 3; x < f - 3; x++) {
      const on = D.texture === 'stipple' ? (x + y) % 2 === 0 : D.texture === 'grooves' ? y % 3 === 0 : (x - b + j) % 4 === 0;
      if (on) px(x, y, 1, 1, C.FD);
    }
  }
  if (D.texture === 'wrap') { const [b, f] = gripRow(D, 2); px(b + 1, Y0 + GRIP_TOP + 2, f - b - 2, 1, C.FDD); const [b2, f2] = gripRow(D, GRIP_ROWS - 3); px(b2 + 1, Y0 + GRIP_TOP + GRIP_ROWS - 3, f2 - b2 - 2, 1, C.FDD); }
  // The frame over the grip: its rear and the dust cover, lit along the slide's seam, its belly dark; the rail's slots.
  px(at(0.0), Y0 + 4, at(D.dust) - at(0.0), 6, C.F); px(at(0.0), Y0 + 4, at(D.dust) - at(0.0), 1, C.FL); px(at(0.10), Y0 + 9, at(D.dust) - at(0.10), 1, C.FD);
  if (D.rail) for (let x = at(0.125); x < at(D.dust) - 1; x += 3) px(x, Y0 + 8, 2, 1, C.FDD);
  if (D.dust >= 0.185) px(at(D.dust) - 1, Y0 + 4, 1, 6, C.FD);
  // The beavertail over the web of the hand: short, or long and swept.
  const tail = D.beaver === 'long' ? 0.022 : 0.012;
  for (let k = 0; k < 4; k++) px(at(-tail) + k, Y0 + 5 + Math.floor(k / 2), at(0) - at(-tail) - k + 1, 1, k ? C.F : C.FL);
  px(at(-tail), Y0 + 6, 1, 1, C.FD);
  // The guard: from the grip's front, its bottom bar and its front; round, square, or hooked at its front's foot.
  const gb = Y0 + 19, gx = at(0.125), [, gf] = gripRow(D, 8);
  px(gf - 1, gb - 1, gx - gf + 1, 2, C.F); px(gf - 1, gb, gx - gf + 1, 1, C.FD);
  px(gx - 1, Y0 + 9, 2, gb - Y0 - 9, C.F); px(gx, Y0 + 9, 1, gb - Y0 - 9, C.FD);
  if (D.guard === 'round') { px(gx, gb, 1, 1, null); px(gx - 1, gb - 1, 1, 1, C.F); }
  if (D.guard === 'hook') { px(gx + 1, gb - 2, 2, 2, C.F); px(gx + 2, gb - 3, 1, 1, C.FD); }
  // The trigger, its face curving back toward its foot, the safety blade's line down its middle.
  for (let k = 0; k < 7; k++) { const x = at(0.088) - Math.round(k * k / 14); px(x, Y0 + 10 + k, 2, 1, STEEL_D); px(x + 1, Y0 + 10 + k, 1, 1, k > 1 && k < 6 ? STEEL_L : STEEL); }
  // The slide stop above the trigger, at the seam.
  px(at(0.078), Y0 + 3, M(0.02), 2, STEEL_D); px(at(0.078), Y0 + 3, M(0.02), 1, STEEL);
  // The lanyard loop at the heel (p12d).
  if (D.lanyard) { const [b] = gripRow(D, GRIP_ROWS - 1), y = Y0 + GRIP_TOP + GRIP_ROWS; px(b - 3, y - 2, 3, 1, STEEL); px(b - 4, y - 1, 1, 3, STEEL_D); px(b - 3, y + 2, 3, 1, STEEL_D); }
  // The slide: its rows from its top (sloping on p12c) to its belly, lit along the top, its belly dark; the nose.
  for (let x = sl(0); x < sl(P12_LEN_M); x++) {
    const m = (x - sl(0)) / PISTOL_CARD_PX_PER_M, top = slideTop(D, m), fromNose = sl(P12_LEN_M) - 1 - x;
    let t = top, b = Y0 + SLIDE_BOT;
    if (D.nose === 'chamfer' && fromNose < 4) t = top + (4 - fromNose);
    if (D.nose === 'round') { if (fromNose === 0) { t = top + 2; b -= 1; } else if (fromNose === 1) t = top + 1; }
    if (D.nose === 'slope' && fromNose < 3) t = top + (3 - fromNose);
    px(x, t, 1, b - t + 1, S.M); px(x, t, 1, 1, S.L); px(x, b, 1, 1, S.D);
  }
  px(sl(0), slideTop(D, 0), 1, Y0 + SLIDE_BOT - slideTop(D, 0) + 1, S.L);
  // (the serrations: lines, slanted lines or fish scales at the rear, and at the front where the design has them)
  const serrate = (m0, m1) => {
    for (let x = sl(m0); x < sl(m1); x += 3) {
      const t = slideTop(D, (x - sl(0)) / PISTOL_CARD_PX_PER_M) + 2;
      for (let y = t; y < Y0 + SLIDE_BOT - 1; y++) {
        const dx = D.ser === 'angled' ? Math.floor((y - t) / 3) : D.ser === 'fish' ? ((y - t) % 4 === 1 || (y - t) % 4 === 2 ? 1 : 0) : 0;
        px(x - dx, y, 1, 1, S.DD);
      }
    }
  };
  serrate(0.008, 0.042);
  if (D.front) serrate(D.front[0], D.front[1]);
  // (a cut: the lightening window over the barrel's front (the steel seen in it), or the RD-1P's plate, its two screws)
  if (D.cut === 'window') { const t = slideTop(D, 0.15); px(sl(0.14), t, M(0.03), 3, INK); px(sl(0.14), t + 2, M(0.03), 1, STEEL); }
  if (D.cut === 'plate') { const t = slideTop(D, 0.05); px(sl(0.032), t - 1, M(0.04), 2, S.M); px(sl(0.032), t - 1, M(0.04), 1, S.L); px(sl(0.037), t, 1, 1, STEEL_D); px(sl(0.065), t, 1, 1, STEEL_D); }
  // (the sights: the rear's block, or its ledge (a square face forward, for racking off a belt); the front's post)
  const rt = slideTop(D, 0.01);
  if (D.sights === 'ledge') { px(sl(0.004), rt - 4, M(0.022), 4, S.M); px(sl(0.004), rt - 4, M(0.022), 1, S.L); px(sl(0.004) + M(0.022) - 1, rt - 4, 1, 4, S.D); }
  else { px(sl(0.006), rt - 3, M(0.018), 3, S.M); px(sl(0.006), rt - 3, M(0.018), 1, S.L); }
  const ft = slideTop(D, 0.18);
  px(sl(0.176), ft - 2, M(0.01), 2, S.M); px(sl(0.176), ft - 2, M(0.01), 1, MARK);
  return { back, sl, top: slideTop(D, PORT_M[0]) };
}

// ---------- the card: the state as believed ----------

// The port (the hood and the witness, or the open action, or a stoppage), the HAD-17 in the grip (its witness slot) or
// the well's open mouth, the safety's paddle, the magazine in the hand. Returns the stations.
function stateCard(C, D, c, body) {
  const { px, P, say } = c, { sl, top } = body, mag = C.mag;
  // The port: its cut on the slide's side from the top, the barrel's hood in it (steel, lit), its rear edge the chamber's.
  const pX = sl(PORT_M[0]), pW = M(PORT_M[1] - PORT_M[0]), pH = 5;
  if (P.locked) {
    // (the slide locked back: the action open between the breech face and the hood, the magazine's top round or the
    // follower seen in it)
    px(pX, top, at(PORT_M[1]) - pX, pH, INK);
    if (P.mag === 'in' && P.count !== 0) px(pX + 2, top + 3, M(0.026), 2, P.count === null ? STEEL_D : BRASS);
    else if (P.mag === 'in') px(pX + 2, top + 4, M(0.026), 1, STEEL_D);
  } else {
    px(pX, top, pW, pH, STEEL); px(pX, top, pW, 1, STEEL_L); px(pX, top + pH - 1, pW, 1, STEEL_D);
    // (the loaded chamber witness: a sliver of the case's brass at the hood's rear, a dummy's orange)
    if (P.chamber === 'live' || P.chamber === 'dud') px(pX, top + 1, 2, 3, P.chamber === 'dud' ? DUMMY : BRASS_L);
  }
  if (P.seen === 'case') {
    // (a stovepipe: the spent case caught by the slide, standing up out of the port, its mouth up)
    px(pX + pW - 8, top - 8, 4, 10, BRASS); px(pX + pW - 8, top - 8, 4, 1, BRASS_L); px(pX + pW - 5, top - 8, 1, 10, tone(BRASS, -0.2));
  } else if (P.seen === 'double') {
    // (a double feed: the slide held a little back on two rounds in the port, one over the other)
    px(pX, top, pW, pH, INK);
    px(pX + 1, top, pW - 2, 2, BRASS); px(pX + pW - 3, top, 2, 2, COPPER);
    px(pX + 3, top + 2, pW - 4, 2, BRASS_L); px(pX + pW - 2, top + 2, 2, 2, COPPER);
  }
  // The HAD-17 in the grip: its believed rounds in the witness slot at the grip's back, from the top; a count unknown the
  // slot blind; the baseplate (flush, or a pad) under the grip. Out: the well's mouth open, the slot dark.
  const s0 = 4, sN = GRIP_ROWS - 9, [bb, bf] = gripRow(D, GRIP_ROWS - 1), foot = Y0 + GRIP_TOP + GRIP_ROWS;
  const fill = P.mag === 'in' && P.count !== null ? (P.count > 0 ? Math.max(1, Math.round(sN * Math.min(P.count, HAD17_N) / HAD17_N)) : 0) : 0;
  for (let j = 0; j < sN; j++) {
    const [b] = gripRow(D, s0 + j), y = Y0 + GRIP_TOP + s0 + j, x = b + 3;
    let col = P.mag === 'in' ? mag.win : INK;
    if (j < fill && !(P.approx && j >= fill - 2 && (x + y) % 2)) col = j % 2 ? BRASS : BRASS_L;
    px(x, y, 2, 1, col);
  }
  let plateY = foot;
  if (P.mag === 'in') {
    const pad = D.plate === 'pad' ? 3 : 2;
    px(bb - 1, foot, bf - bb + 2, pad, mag.plate); px(bb - 1, foot + pad - 1, bf - bb + 2, 1, mag.body);
    if (D.plate === 'pad') px(bb - 2, foot + 1, 1, 1, mag.plate);
    plateY = foot + pad;
    // (clear of the grip's front strap and its shadow, which the card throws right: at bf + 3 it sat on the strap)
    if (P.count === null) say(px, bf + 7, foot - 5, '?', AMBER);
  } else {
    // (the mouth of the well, open: the grip's foot dark inside its walls)
    px(bb + 2, foot - 2, bf - bb - 4, 2, INK);
  }
  // The safety's paddle on the frame, pivoting at its rear: up safe, down fire (the P-12's ring has no auto).
  const sx = at(0.024), sy = Y0 + 7, up = P.mode === 'safe';
  px(sx - 1, sy - 1, 3, 3, STEEL_D); px(sx - 1, sy - 1, 3, 1, STEEL);
  for (let i = 1; i <= 6; i++) { const y = sy + (up ? -Math.round(i * 0.4) : Math.round(i * 0.4)); px(sx + i, y, 1, 2, i === 6 ? MARK : STEEL_L); }
  // The magazine in the hand, right of the muzzle (see handMag).
  if (P.hand) handMag(px, P.hand, mag, say);
  return {
    sel: [sx, sy], dots: { safe: [sx + 9, sy - 4], semi: [sx + 9, sy + 4] }, port: [pX, top, pW, pH], mark: [pX + 2, top - 14],
    well: [bb, foot], plate: plateY, label: bf + 6, wordX: 6, handX: HAND_X - 12, turrets: null,
  };
}

// (a HAD-17 in the hand: straight, held at the grip's slant as it comes to the well, its witness holes down its back (the
// believed rounds brass in them, from the top), its feed lips and the top round's nose by the believed kind, its plate; a
// count unknown, "?" on the plate; the knuckles round its middle)
function handMag(px, H, mag, say) {
  const len = M(HAD17_LEN_M), w = 8, holes = [];
  for (let j = 0; j < len; j++) {
    const x = HAND_X - Math.round(j * 0.28), y = HAND_Y + j, lip = j < 2;
    px(x + (lip ? 1 : 0), y, w - (lip ? 2 : 0), 1, mag.body); px(x + (lip ? 1 : 0), y, 1, 1, mag.edge);
    if (j > 4 && j < len - 5 && j % 3 === 0) holes.push([x + 2, y]);
  }
  const bx = HAND_X - Math.round((len - 1) * 0.28), by = HAND_Y + len;
  px(bx - 1, by, w + 2, 2, mag.plate);
  const n = holes.length, fill = H.count === null ? 0 : H.count > 0 ? Math.max(1, Math.round(n * Math.min(H.count, HAD17_N) / HAD17_N)) : 0;
  holes.forEach(([x, y], i) => px(x, y, 2, 1, i < fill && !(H.approx && i >= fill - 1) ? (i % 2 ? BRASS : BRASS_L) : mag.win));
  if (H.count !== 0 && H.count !== null || H.load) {
    // (the top round at the feed lips, its nose forward: a tracer's red, ball's copper, a kind unknown dull)
    px(HAND_X + 1, HAND_Y - 1, w - 3, 1, BRASS); px(HAND_X + w - 2, HAND_Y - 1, 2, 1, H.load === 'tracer' ? TRACER_TIP : H.load ? COPPER : tone(BRASS, -0.25));
  }
  if (H.count === null) say(px, bx + 2, by - 7, '?', AMBER);
  const my = HAND_Y + Math.round(len * 0.55), mx = HAND_X - Math.round(len * 0.55 * 0.28);
  px(mx - 2, my, w + 4, 5, SKIN); px(mx - 2, my + 4, w + 4, 1, SKIN_D); px(mx - 2, my, 1, 5, SKIN_D);
  for (let k = 1; k < 4; k++) px(mx - 2 + k * 3, my + 1, 1, 3, SKIN_D);
}

// ---------- the figure's templates (see the header's art letters) ----------

const ART = Object.freeze({ n: 'n', u: 'u', v: 'v', t: FURN, l: FURN_L, d: FURN_D, o: 'l', c: CLEAR });
/** A figure template from its art: GUNS.pistol's form, its stations scaled from GUNS.pistol's to the art's length. */
function template(art, top) {
  const parts = [], len = art[0].length, k = len / GUNS.pistol.len;
  art.forEach((row, j) => [...row].forEach((ch, a) => {
    if (ch === '.') return;
    const letter = ART[ch];
    if (!letter) throw new Error(`pistols: no letter for "${ch}"`);
    parts.push([a, a, top + j, top + j, letter]);
  }));
  const G = GUNS.pistol;
  return Object.freeze({ len, grip: G.grip * k, fore: G.fore * k, muzzle: G.muzzle * k, magwell: G.magwell * k, parts: Object.freeze(parts), mag: Object.freeze([]), loose: 'u', furn: FURN });
}
// (seven pixels along at 16 px/m, the 0.42 m a chibi's pistol is drawn (body.js pistolM): the slide in gun metal over the frame
// in the furniture, the grip two pixels under the hand; each design's one or two telling pixels: a's port glint, b's plate on
// top and its hooked guard, c's tall rear in one tone, d's lanyard loop under the heel)
const FIG = Object.freeze({
  p12a: template(['nnnnvnn', 'tttttt.', 'tt.....'], -1),
  p12b: template(['.nn....', 'nnnnnnn', 'tttttt.', 'tt..t..'], -2),
  p12c: template(['tt.....', 'ttttvtt', 'ttttttt', 'tt.....'], -2),
  p12d: template(['nnnnnnv', 'ttttt..', 'tt.....', 'v......'], -1),
});

// ---------- the designs ----------

/** The designs by id (see the header): { id, name, short, lenM, shape, fig }. */
export const PISTOL_DESIGNS = Object.freeze({
  p12a: Object.freeze({ id: 'p12a', short: 'A', name: 'the service pistol: squared slide, rail, stippled grip, flush plate', lenM: P12_LEN_M, shape: SHAPES.p12a, fig: FIG.p12a }),
  p12b: Object.freeze({ id: 'p12b', short: 'B', name: "the slab: chamfered slide, the RD-1P's cover plate, ledge sight, hooked guard, flared well", lenM: P12_LEN_M, shape: SHAPES.p12b, fig: FIG.p12b }),
  p12c: Object.freeze({ id: 'p12c', short: 'C', name: 'the monolith: one tone, sloping slide, full dust cover, finger grooves', lenM: P12_LEN_M, shape: SHAPES.p12c, fig: FIG.p12c }),
  p12d: Object.freeze({ id: 'p12d', short: 'D', name: 'the lanyard: rounded slide, fish scales, window over the barrel, lanyard loop', lenM: P12_LEN_M, shape: SHAPES.p12d, fig: FIG.p12d }),
});
/** The designs' ids. */
export const PISTOL_DESIGN_IDS = Object.freeze(Object.keys(PISTOL_DESIGNS));
/** Which design each pistol model takes: none yet (the game draws what it drew until the user's pick: see the header). */
export const PISTOL_DRAWN_AS = Object.freeze({});
/** Whether an id names a pistol design. */
export const isPistolDesign = (id) => typeof id === 'string' && Object.hasOwn(PISTOL_DESIGNS, id);

const DRAWN = new Map();
/**
 * A pistol design by its id or a model's name through PISTOL_DRAWN_AS (else null: the caller draws what it drew), in a finish
 * (src/data/finishes.js; none or unknown, the issue's black): { kind: 'pistol', id, name, lenM, finish, card(c), fig }.
 */
export function pistolDrawingOf(key, finish = ISSUE_FINISH) {
  const D = PISTOL_DESIGNS[key] ?? PISTOL_DESIGNS[PISTOL_DRAWN_AS[key]];
  if (!D) return null;
  const f = finishId(finish), k = `${D.id}|${f}`;
  let out = DRAWN.get(k);
  if (!out) {
    const C = FINISHES[f];
    out = Object.freeze({ kind: 'pistol', id: D.id, name: D.name, short: D.short, lenM: D.lenM, finish: f, fig: D.fig,
      card: (c) => stateCard(C, D.shape, c, bodyCard(C, D.shape, c)) });
    DRAWN.set(k, out);
  }
  return out;
}
