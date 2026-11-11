// OLYMPUS art: the rifles' drawings. Each design side on twice, on the weapon card and as the figure's template, in any finish.
//
// The user, 2026-11-08: "Martian standard issue would look more like [the first reference], but we would have
// varyiety in the guns marines carry like [the second]": the Corps trains on the ground with atmospheric arms close
// to the 2020s' (it trains to fight the UN on Earth), so its rifles look like them. Their scores of the samples the
// same day (DESIGN.md's log, the user's gallery picks) made the designs here:
//   - r7, the R-7: G2 ★ 95, "make this the standard issue. Just get rid of the green arch it serves no purpose ... I
//     would prefer this gun with the scope of the V1, for short and mid range engagements": the standard issue's body
//     (g1's, the skeleton stock, the receivers, the slim slotted handguard with its rail, the angled foregrip, the light
//     and the brake) with v1's carry handle, its rail and the boxed red dot in place of g1's low-power scope. A red dot
//     alone is a 1× sight, and the SO-4 has always had a 4× lever (WEAPONS §3.5: OPTIC_S, the far window's numbers), so
//     the SO-4 is drawn as the dot with a 4× flip magnifier behind it on the handle's rail (my call): in line with the box
//     when the holder believes the lever at 4×, swung MAGNIFIER_DROP_PX down beside its mount at 1× (the card reads the
//     believed lever: weaponcard.js cardParts' optic). At distance its turrets sit on the box, the elevation's on its hood
//     and the windage's at its front, clear of the magnifier;
//   - g1, the standard issue as first drawn, its low-power scope on a cantilever mount (★ 90, "keep it as alternate
//     weapons assets ... not R-7 replacement"): drawn as no issued gun;
//   - v1, the variety carbine (★ 95, "keep it also"; "This in black would be a serious contender for standard issue"):
//     one polymer body, the carry handle with the boxed sight, the vertical grip, the clear smoked magazine;
//   - m1, the squad marksman's rifle (★ 95, "Long gun standard for marksmanship for sure. Scope is perfect for this"):
//     the R-7M's drawing (DRAWN_AS), to its row in WEAPONS §3.2: 101 cm, the HAD-30, a 3 to 12× scope, a bipod.
// G0, the R-7 as v0.0.9 drew it, is purged ("Purge it from used assets it's too low quality"), and no card draws a
// sling: the green arch is gone from every design (the figure keeps its strap, compose.js).
// Each design is drawn in any finish (src/data/finishes.js: the Corps' black, the issue's, and the deployments'
// camouflage), a colour scheme and never a shape: drawingOf(key, finish) gives the design in the finish's tones.
// A drawing has:
//   - card(c): the body of the rifle at the weapon card's density (weaponcard.js CARD_PX_PER_M, 144 px/m), drawn
//     with c.px (paint.js px), c.at (metres from the butt to the card's x), c.Y0 (the bore's row) and c.optic (the
//     believed lever, 1 or 4); it returns its stations: where the card's state parts go (the magazine's well, the
//     selector, the ejection port, the port's mark, the count's words, the optic's turrets), the same on every design
//     so the words under the card stay where they were scored;
//   - fig: the figure's template in reference pixels at 16 px/m (templates.js GUNS.rifle's stations: 16 along, the
//     grip, the support hand, the muzzle and the well, so every rig and hand of compose.js holds it unchanged), written
//     as art: one string a row from across `top` down, '.' empty, n gun metal, u black polymer, v steel, t the
//     furniture, l its lit edge, d its dark, o a lens' glint, and an upper-case letter the magazine (drawn only with
//     the magazine in: U black polymer, N gun metal, C the clear one), whose letter a magazine out of the well in the
//     hand takes too (compose.js looseMag). Black parts are drawn in gun metal (n), not black polymer: at 16 px/m a
//     pixel of u is lost in the ink outline beside it; a sight is gun metal with a glint at its front, so it reads
//     over the furniture in every side view; the furniture runs to the muzzle device, two pixels;
//   - colours: the figure's furniture letters (FURN, FURN_L, FURN_D, CLEAR) in the finish's ramp, held at their base
//     tone by shade.js as v, n and u are (a two-pixel rifle shaded by the edge rule would be all shadow);
//   - mag: the card's magazine as drawn (its colours, width, curve and shown length; clear: a translucent body with
//     the believed rounds seen through it, not a window strip). The HAD-30 is MAG_W_PX 9 wide, curving MAG_CURVE_PX
//     5, as the user scored it with G2 (7 and 8 from v0.0.6 to v0.0.11, after their "if they could be a bit slicker"
//     of 2026-11-07: the later pick wins, my call; MAG_W_PX 7 undoes it).
// No design changes a gun's data: the R-7 stays the R-7. No maker's names: the shapes only.
// Pure: no DOM, no three.js.
import { FINISHES, finishId, ISSUE_FINISH } from '../data/finishes.js';

/** The figure's letters these drawings add: the furniture, its lit edge, its dark, a clear magazine (shade.js holds them at base tone). */
export const FURN = 'ŧ', FURN_L = 'ț', FURN_D = 'ď', CLEAR = 'ů';
export const HELD_LETTERS = Object.freeze([FURN, FURN_L, FURN_D, CLEAR]);
const ART = Object.freeze({ n: 'n', u: 'u', v: 'v', t: FURN, l: FURN_L, d: FURN_D, o: 'l', c: CLEAR, g: 'g' });

/** The HAD-30 on the card (see the header): metres shown below the well, metres hidden in it, its width and its forward curve in card pixels. */
export const MAG_SHOWN_M = 0.165, MAG_HIDDEN_M = 0.045, MAG_W_PX = 9, MAG_CURVE_PX = 5;
/** The SO-4's flip magnifier on the R-7's card: its span along the rifle (metres from the butt) and how far it swings down at 1× (card px). */
export const MAGNIFIER_AT_M = Object.freeze([0.27, 0.335]), MAGNIFIER_DROP_PX = 4;

/** A figure template from its art (see the header): GUNS.rifle's form, the R-7's stations unless `anchors` says. */
function template(art, top, anchors = {}) {
  const parts = [], mag = [];
  art.forEach((row, j) => [...row].forEach((ch, a) => {
    if (ch === '.') return;
    const letter = ART[ch.toLowerCase()];
    if (!letter) throw new Error(`rifles: no letter for "${ch}"`);
    (ch !== ch.toLowerCase() ? mag : parts).push([a, a, top + j, top + j, letter]);
  }));
  // (furn: the furniture's letter when the drawing has furniture, which compose.js shows behind the muzzle seen end on)
  const furn = parts.some(p => p[4] === FURN) ? FURN : null;
  return Object.freeze({ len: 16, grip: 4.5, fore: 10.5, muzzle: 16, magwell: 8, ...anchors, parts: Object.freeze(parts), mag: Object.freeze(mag), loose: mag[0]?.[4] ?? 'u', furn });
}

// ---------- the card's fixed colours (weaponcard.js's, repeated: that module imports this one) ----------

const INK = 0x14151c, STEEL = 0x6e7582, STEEL_L = 0x9aa1ae, STEEL_D = 0x49403e;
const GLASS = 0x3c5d84, GLASS_L = 0xb8d8ec, GLASS_D = 0x24324a, RUBBER = 0x1c1d24;
/** The clear magazine's smoke, its edge and its seen-through dark (v1, in every finish): the sand grey family's lower steps. */
const SMOKE = 0x695745, SMOKE_L = 0x7f735a, SMOKE_D = 0x523d33;

// (the figure's furniture letters for a finish, its own `fig` ramp where it has one (a step off the card's, so two pale
// finishes part at 16 px/m), else the card's; the clear magazine's smoke)
const figColours = (C) => { const R = C.fig ?? C; return Object.freeze({ [FURN]: R.F, [FURN_L]: R.FL, [FURN_D]: R.FD, [CLEAR]: SMOKE }); };

// ---------- the card's drawing helpers ----------

// (a slab of furniture from m0 to m1, rows top to bot exclusive: its top lit, its bottom row dark)
function slab(c, m0, m1, top, bot, C, lit = true) {
  const { px, at } = c, x = at(m0), w = at(m1) - x;
  px(x, top, w, bot - top, C.F);
  if (lit) px(x, top, w, 1, C.FL);
  px(x, bot - 1, w, 1, C.FD);
}
// (the pistol grip angled back below the receiver, from (x0, y0), rows of w: the R-7's slant, its texture every 4 rows)
function grip(c, x0, y0, rows, w, C, col = 'F') {
  const { px } = c;
  for (let j = 0; j < rows; j++) {
    const x = x0 - Math.round(j * 0.35);
    px(x, y0 + j, w, 1, j % 4 === 3 ? C.FD : C[col]);
    px(x, y0 + j, 1, 1, C.FL);
    px(x + w - 1, y0 + j, 1, 1, C.FD);
  }
}
// (a scope: its eyepiece bell, tube and objective bell in the finish's metal, lit along the top, its glass at both ends)
function scope(c, C, { eye, tube, obj, tubeTop, tubeH, bellTop, bellH, objTop = bellTop, objH = bellH }) {
  const { px, at } = c;
  px(at(tube[0]), tubeTop, at(tube[1]) - at(tube[0]), tubeH, C.B); px(at(tube[0]), tubeTop, at(tube[1]) - at(tube[0]), 1, C.BL);
  px(at(eye[0]), bellTop, at(eye[1]) - at(eye[0]), bellH, C.B); px(at(eye[0]), bellTop, at(eye[1]) - at(eye[0]), 1, C.BL);
  px(at(obj[0]), objTop, at(obj[1]) - at(obj[0]), objH, C.B); px(at(obj[0]), objTop, at(obj[1]) - at(obj[0]), 1, C.BL);
  px(at(eye[0]) - 1, bellTop + 1, 1, bellH - 2, GLASS);
  px(at(obj[1]), objTop + 1, 1, objH - 2, GLASS);
  px(at(obj[1]), objTop + 2, 1, 1, GLASS_L);
}
// (a rail's notches along a run of furniture or metal)
function notches(c, m0, m1, y, col, step = 3) { for (let x = c.at(m0) + 1; x < c.at(m1); x += step) c.px(x, y, 1, 1, col); }

/** The stations on the card (weaponcard.js's): every design keeps its receiver's to them. */
const stations = (c, more = {}) => ({
  well: [c.at(0.40), c.Y0 + 8], sel: [c.at(0.30), c.Y0 + 4], port: [c.at(0.40), c.Y0 - 3, c.M(0.08), 4], mark: [c.at(0.43), c.Y0 - 13],
  label: c.at(0.40) + 12, turrets: null, ...more,
});

// ---------- the standard issue's body (the first reference): r7 and g1 ----------

// The side-folding skeleton stock, the receivers and the slim slotted rail handguard in the furniture with a rail along
// the top, the angled foregrip, a light on the rail's front, the short brake, the flared well. Everything under the
// sight: r7 and g1 are the same rifle from the bore down.
function standardBody(c, C) {
  const { px, at, M, Y0 } = c;
  // The stock: the butt's rubber pad, a skeleton of a cheek bar and a strut, its hinge at the receiver.
  px(at(0) - 2, Y0 - 8, 3, 19, RUBBER);
  px(at(0) + 1, Y0 - 8, 4, 19, C.B); px(at(0) + 1, Y0 - 8, 4, 1, C.BL);
  for (let x = at(0) + 5; x < at(0.18); x++) {
    const t = (x - at(0) - 5) / (at(0.18) - at(0) - 5), top = Y0 - 8 + Math.round(t * 2);
    px(x, top, 1, 3, C.B); px(x, top, 1, 1, C.BL);
    px(x, Math.round(Y0 + 8 - t * 6), 1, 2, C.B);
  }
  px(at(0.17), Y0 - 7, M(0.04), 12, C.B); px(at(0.17), Y0 - 7, M(0.04), 1, C.BL); px(at(0.185), Y0 - 2, 2, 2, C.BL);
  // The receivers: the lower (the grip, the integral guard, the flared well), the upper with its charging handle.
  slab(c, 0.21, 0.47, Y0 + 2, Y0 + 9, C, false);
  grip(c, at(0.28), Y0 + 8, M(0.11), 7, C);
  px(at(0.32), Y0 + 10, M(0.075), 1, C.FD); px(at(0.39), Y0 + 8, 1, 3, C.FD); px(at(0.32), Y0 + 8, 1, 3, C.FD);
  px(at(0.345), Y0 + 7, 1, 3, STEEL_L);
  px(at(0.40) - 2, Y0 + 7, 13, 3, C.F); px(at(0.40) - 2, Y0 + 9, 13, 1, C.FD);
  slab(c, 0.21, 0.50, Y0 - 6, Y0 + 2, C);
  px(at(0.21) - 3, Y0 - 6, 4, 2, C.FD);
  // The rail along the top, the handguard, slim and slotted: slanted slots along it and short ones under them.
  px(at(0.21), Y0 - 8, at(0.84) - at(0.21), 2, C.FD); notches(c, 0.21, 0.84, Y0 - 8, C.FDD);
  slab(c, 0.50, 0.84, Y0 - 6, Y0 + 4, C);
  for (let x = at(0.53); x < at(0.81); x += 6) for (let r = 0; r < 5; r++) px(x + Math.floor((4 - r) / 2), Y0 - 4 + r, 2, 1, C.FDD);
  for (let x = at(0.535) + 3; x < at(0.81); x += 6) px(x, Y0 + 2, 2, 1, C.FDD);
  // The angled foregrip under the handguard's front, on its clamp: its long face sloping back, lit.
  px(at(0.655), Y0 + 4, M(0.10), 1, C.B);
  for (let k = 0; k < 6; k++) {
    const x0 = at(0.665) + Math.round(k * 1.7), x1 = at(0.75) - Math.round(k * 0.4);
    px(x0, Y0 + 5 + k, x1 - x0, 1, k === 5 ? C.FD : C.F); px(x0, Y0 + 5 + k, 1, 1, C.FL); px(x1 - 1, Y0 + 5 + k, 1, 1, C.FD);
  }
  // The light on the rail's front, the barrel, the brake with its ports.
  px(at(0.72), Y0 - 12, M(0.10), 4, C.B); px(at(0.72), Y0 - 12, M(0.10), 1, C.BL); px(at(0.82) - 1, Y0 - 11, 1, 2, GLASS_L); px(at(0.74), Y0 - 13, 3, 1, C.BL);
  px(at(0.84), Y0 - 1, M(0.03), 3, STEEL_D); px(at(0.84), Y0 - 1, M(0.03), 1, STEEL);
  px(at(0.86), Y0 - 3, M(0.06), 6, C.B); px(at(0.86), Y0 - 3, M(0.06), 1, C.BL);
  px(at(0.875), Y0 - 2, 2, 3, INK); px(at(0.895), Y0 - 2, 2, 3, INK); px(at(0.92) - 1, Y0 - 2, 1, 4, C.BL);
}

// g1's sight: the low-power scope on its cantilever mount, the rings, the throw lever a nub on the mount, the eyepiece's
// bell a pixel taller than the objective's, a narrow turret between them; the offset dot at its front.
function g1Card(C, c) {
  const { px, at, M, Y0 } = c;
  standardBody(c, C);
  px(at(0.31), Y0 - 11, M(0.17), 3, C.B); px(at(0.31), Y0 - 9, M(0.17), 1, INK); px(at(0.31) + 2, Y0 - 10, 2, 1, C.BL);
  scope(c, C, { eye: [0.25, 0.30], tube: [0.30, 0.455], obj: [0.455, 0.515], tubeTop: Y0 - 17, tubeH: 5, bellTop: Y0 - 20, bellH: 10, objTop: Y0 - 19, objH: 9 });
  px(at(0.33), Y0 - 17, 3, 7, C.BL); px(at(0.43), Y0 - 17, 3, 7, C.BL);
  px(at(0.385), Y0 - 19, 2, 2, C.BL); px(at(0.41), Y0 - 15, 4, 4, C.BL);
  px(at(0.525), Y0 - 12, M(0.035), 4, C.B); px(at(0.525), Y0 - 12, M(0.035), 1, C.BL); px(at(0.525) + M(0.035), Y0 - 11, 1, 2, GLASS);
  return stations(c, { turrets: { e: [at(0.37), Y0 - 23], w: [at(0.41), Y0 - 16] } });
}

// ---------- the carry handle and the boxed sight (the second reference's): v1 and r7 ----------

// The carry handle (its two posts and its top in the furniture), its rail, the boxed sight on the rail (its hood, its
// window's glass), the charging handle under it. Returns the turrets' places on the box: the elevation's on its hood,
// the windage's at its front (behind it is the magnifier's room on the R-7).
function carrySight(c, C) {
  const { px, at, M, Y0 } = c;
  px(at(0.25), Y0 - 14, M(0.04), 8, C.F); px(at(0.25), Y0 - 14, 1, 8, C.FL);
  px(at(0.53), Y0 - 14, M(0.05), 8, C.F); px(at(0.58) - 1, Y0 - 14, 1, 8, C.FD);
  slab(c, 0.25, 0.58, Y0 - 16, Y0 - 13, C);
  px(at(0.545), Y0 - 12, 3, 3, C.FDD);
  px(at(0.26), Y0 - 18, at(0.57) - at(0.26), 2, C.B); notches(c, 0.26, 0.57, Y0 - 18, C.BL);
  px(at(0.35), Y0 - 20, M(0.14), 2, C.B);
  px(at(0.35), Y0 - 28, M(0.14), 2, C.B); px(at(0.35), Y0 - 28, M(0.14), 1, C.BL);
  px(at(0.35), Y0 - 28, 2, 8, C.B); px(at(0.49) - 2, Y0 - 28, 2, 8, C.B);
  px(at(0.35) + 2, Y0 - 26, M(0.14) - 4, 6, GLASS_D); px(at(0.35) + 3, Y0 - 25, 1, 4, GLASS);
  px(at(0.40), Y0 - 20, 2, 1, C.BL); px(at(0.43), Y0 - 20, 2, 1, C.BL);
  px(at(0.50), Y0 - 9, 4, 2, C.FD);
  return { e: [at(0.40), Y0 - 31], w: [at(0.49), Y0 - 26] };
}

// The SO-4's 4× flip magnifier behind the box (see the header): its mount on the handle's rail under it, the tube with
// its eyepiece's ring a pixel taller; in line at 4× (its glass at both ends), swung MAGNIFIER_DROP_PX down beside the
// mount at 1× (end on to the side, so no glass shows, its far end in the slots' dark).
function magnifier(c, C, optic) {
  const { px, at, M, Y0 } = c, x0 = at(MAGNIFIER_AT_M[0]), x1 = at(MAGNIFIER_AT_M[1]), w = x1 - x0, up = optic === 4;
  px(at(0.29), Y0 - 21, M(0.03), 3, C.B); px(at(0.29), Y0 - 21, 1, 3, C.BL);
  const top = Y0 - 27 + (up ? 0 : MAGNIFIER_DROP_PX);
  px(x0, top, w, 6, C.B); px(x0, top, w, 1, C.BL);
  px(x0, top - 1, 3, 8, C.B); px(x0, top - 1, 3, 1, C.BL);
  if (up) { px(x0 - 1, top + 1, 1, 4, GLASS); px(x1, top + 1, 1, 4, GLASS); px(x1, top + 2, 1, 1, GLASS_L); }
  else { px(x1 - 1, top + 1, 1, 4, C.FDD); px(x0 + 4, top + 5, w - 6, 1, C.FDD); }
}

// r7: the standard issue's body, v1's carry handle and box, the magnifier behind the box.
function r7Card(C, c) {
  standardBody(c, C);
  const t = carrySight(c, C);
  magnifier(c, C, c.optic);
  return stations(c, { turrets: t });
}

// v1: one polymer body, the receiver and the handguard together, a carry handle with a rail on it and a boxed
// holographic sight on the rail, the skeleton folding stock, a short rail on the handguard's side, the vertical grip,
// the pronged flash hider, the clear magazine.
function v1Card(C, c) {
  const { px, at, M, Y0 } = c;
  // The stock: a skeleton of the butt, a cheek bar and a strut (and a web between them, faithful), its hinge.
  px(at(0) - 2, Y0 - 8, 2, 19, RUBBER);
  px(at(0), Y0 - 8, M(0.03), 19, C.F); px(at(0), Y0 - 8, M(0.03), 1, C.FL); px(at(0) + M(0.03) - 1, Y0 - 7, 1, 18, C.FD);
  slab(c, 0.03, 0.20, Y0 - 8, Y0 - 4, C);
  for (let x = at(0.03); x < at(0.20); x++) { const t = (x - at(0.03)) / (at(0.20) - at(0.03)); px(x, Math.round(Y0 + 8 - t * 7), 1, 3, C.F); px(x, Math.round(Y0 + 10 - t * 7), 1, 1, C.FD); }
  for (let y = Y0 - 4; y < Y0 + 6; y++) px(at(0.11) + Math.round((y - Y0 + 4) * 0.25), y, 2, 1, C.F);
  px(at(0.195), Y0 - 7, M(0.025), 12, C.FD);
  // The body: the receiver and the handguard in one, its top-front corner rounded off in steps to the nose; the grip
  // and its big integral guard.
  slab(c, 0.21, 0.76, Y0 - 6, Y0 + 5, C);
  for (let x = at(0.76), k = 0; x < at(0.79); x++, k++) {
    const top = Y0 - 6 + Math.max(0, k - (at(0.79) - at(0.76) - 3));
    px(x, top, 1, Y0 + 5 - top, C.F); px(x, top, 1, 1, C.FL); px(x, Y0 + 4, 1, 1, C.FD);
  }
  slab(c, 0.21, 0.47, Y0 + 4, Y0 + 9, C, false);
  px(at(0.79), Y0 - 3, 2, 7, C.F); px(at(0.79), Y0 - 3, 1, 1, C.FL); px(at(0.79) + 2, Y0 - 1, 1, 3, C.FD);
  grip(c, at(0.28), Y0 + 8, M(0.11), 7, C);
  px(at(0.31), Y0 + 9, M(0.10), 2, C.F); px(at(0.31), Y0 + 13, M(0.10), 2, C.F); px(at(0.31), Y0 + 14, M(0.10), 1, C.FD);
  px(at(0.41) - 1, Y0 + 9, 2, 5, C.F);
  px(at(0.345), Y0 + 8, 1, 3, STEEL_L);
  // (the handguard's vents: thin slots in its lower half, ahead of the side rail; the seam behind them)
  for (const m of [0.53, 0.57, 0.61]) px(at(m), Y0 + 2, M(0.025), 1, C.FDD);
  px(at(0.47), Y0 - 1, M(0.05), 1, C.FD);
  // The short rail on the handguard's side, the vertical grip under it.
  px(at(0.645), Y0, M(0.13), 3, C.B); notches(c, 0.645, 0.775, Y0, C.BL, 3);
  px(at(0.685), Y0 + 5, M(0.05), 2, C.BL);
  px(at(0.69), Y0 + 7, M(0.04), 14, C.B);
  for (let y = Y0 + 9; y < Y0 + 20; y += 3) px(at(0.69), y, M(0.04), 1, C.BL);
  px(at(0.69) - 1, Y0 + 20, M(0.04) + 2, 2, C.BL);
  const t = carrySight(c, C);
  // The barrel and the pronged flash hider.
  px(at(0.80), Y0 - 1, M(0.04), 3, STEEL_D); px(at(0.80), Y0 - 1, M(0.04), 1, STEEL);
  px(at(0.84), Y0 - 2, M(0.06), 5, C.B); px(at(0.84), Y0 - 2, M(0.06), 1, C.BL);
  px(at(0.86), Y0 - 1, M(0.04), 1, INK); px(at(0.86), Y0 + 1, M(0.04), 1, INK);
  return stations(c, { turrets: t });
}

// ---------- m1: the squad marksman's rifle of the standard issue's family, the R-7M's drawing ----------

// Drawn to the R-7M's row in WEAPONS §3.2: 101 cm; a 510 mm heavy, free-floated barrel and a brake (no suppressor: that
// is the S-9's SP-9); the HAD-30, the standard issue's magazine; the SO-12, a 3 to 12× scope with a rangefinder; a bipod.
// The standard issue's receivers with a fixed precision stock (an adjustable cheek riser, a butt with its spacers, a
// monopod's knob), a longer slotted handguard with the bipod folded forward under it (its hinge block at the rear, its
// feet at the front), the heavy barrel standing out of it, the bigger scope (a wider objective, tall turrets, a
// rangefinder's box on its side).
function m1Card(C, c) {
  const { px, at, M, Y0 } = c;
  // The stock: the butt with its spacers, the body tapering forward, the cheek riser over it, the monopod's knob.
  px(at(0) - 2, Y0 - 10, 3, 21, RUBBER);
  px(at(0) + 1, Y0 - 10, 2, 21, C.BL); px(at(0) + 3, Y0 - 10, 2, 21, C.B);
  for (let x = at(0) + 5; x < at(0.22); x++) {
    const t = (x - at(0) - 5) / (at(0.22) - at(0) - 5), top = Math.round(Y0 - 7 + t * 1), bot = Math.round(Y0 + 11 - t * 8);
    px(x, top, 1, bot - top, C.F); px(x, top, 1, 1, C.FL); px(x, bot - 1, 1, 1, C.FD);
  }
  px(at(0.05), Y0 - 12, M(0.12), 5, C.F); px(at(0.05), Y0 - 12, M(0.12), 1, C.FL); px(at(0.08), Y0 - 7, 2, 2, STEEL_D); px(at(0.14), Y0 - 7, 2, 2, STEEL_D);
  px(at(0.06), Y0 + 9, 4, 4, C.B); px(at(0.06), Y0 + 12, 4, 1, C.BL);
  for (let x = at(0.08); x < at(0.19); x += 4) px(x, Y0 + 1, 2, 2, C.FDD);
  // The receivers, the grip, the guard, the flared well (the standard issue's).
  slab(c, 0.22, 0.47, Y0 + 2, Y0 + 9, C, false);
  grip(c, at(0.28), Y0 + 8, M(0.11), 7, C);
  px(at(0.32), Y0 + 10, M(0.075), 1, C.FD); px(at(0.39), Y0 + 8, 1, 3, C.FD); px(at(0.32), Y0 + 8, 1, 3, C.FD);
  px(at(0.345), Y0 + 7, 1, 3, STEEL_L);
  px(at(0.40) - 2, Y0 + 7, 13, 3, C.F); px(at(0.40) - 2, Y0 + 9, 13, 1, C.FD);
  slab(c, 0.22, 0.52, Y0 - 6, Y0 + 2, C);
  px(at(0.22) - 3, Y0 - 6, 4, 2, C.FD);
  // The rail, the long handguard and its slanted slots (the standard issue's, longer).
  px(at(0.22), Y0 - 8, at(0.84) - at(0.22), 2, C.FD); notches(c, 0.22, 0.84, Y0 - 8, C.FDD);
  slab(c, 0.52, 0.84, Y0 - 6, Y0 + 4, C);
  for (let x = at(0.55); x < at(0.81); x += 6) for (let r = 0; r < 5; r++) px(x + Math.floor((4 - r) / 2), Y0 - 4 + r, 2, 1, C.FDD);
  // The bipod folded forward under the handguard: the hinge block at its rear, the two legs along, the feet at the front.
  // (in steel and lit polymer: black on the card's dark wall it read as a second rail, the judge's of 2026-11-08)
  const legX = at(0.56) + 5, legW = at(0.80) - legX;
  px(at(0.56), Y0 + 4, 5, 5, C.BL); px(at(0.56), Y0 + 4, 5, 1, STEEL); px(at(0.56) + 2, Y0 + 6, 1, 1, STEEL_L);
  px(legX, Y0 + 5, legW, 2, STEEL_D); px(legX, Y0 + 5, legW, 1, STEEL);
  px(at(0.80), Y0 + 4, 3, 6, C.BL); px(at(0.80), Y0 + 4, 3, 1, STEEL); px(at(0.80) - 1, Y0 + 9, 5, 1, RUBBER);
  // The heavy barrel and the brake with its ports.
  px(at(0.84), Y0 - 2, M(0.09), 4, STEEL_D); px(at(0.84), Y0 - 2, M(0.09), 1, STEEL);
  px(at(0.93), Y0 - 3, at(1.01) - at(0.93), 6, C.B); px(at(0.93), Y0 - 3, at(1.01) - at(0.93), 1, C.BL);
  for (const m of [0.945, 0.965, 0.985]) px(at(m), Y0 - 2, 2, 3, INK);
  px(at(1.01) - 1, Y0 - 2, 1, 4, C.BL);
  // The scope: a wider objective, its mount's two rings, the rangefinder's box on its side, the throw lever, the caps.
  px(at(0.33), Y0 - 12, 3, 4, C.BL); px(at(0.47), Y0 - 12, 3, 4, C.BL);
  scope(c, C, { eye: [0.25, 0.31], tube: [0.31, 0.49], obj: [0.49, 0.60], tubeTop: Y0 - 19, tubeH: 6, bellTop: Y0 - 22, bellH: 11, objTop: Y0 - 23, objH: 13 });
  px(at(0.33), Y0 - 19, 3, 6, C.BL); px(at(0.46), Y0 - 19, 3, 6, C.BL);
  px(at(0.44), Y0 - 14, M(0.05), 3, C.B); px(at(0.44) + 1, Y0 - 13, 2, 1, GLASS);
  px(at(0.33) + 2, Y0 - 12, 2, 1, C.BL);
  px(at(0.375), Y0 - 23, 6, 4, C.BL); px(at(0.41), Y0 - 17, 5, 5, C.BL);
  return stations(c, { turrets: { e: [at(0.37), Y0 - 25], w: [at(0.41), Y0 - 18] } });
}

// ---------- the figure's templates (see the header's art letters) ----------

const FIG = Object.freeze({
  // (the R-7: g1's body (the black skeleton stock to the receiver's rear, the furniture lit along its top and run to the
  // brake, the light at the rail's front, the grip and the angled foregrip in the furniture, the magazine in gun metal)
  // under v1's sight: the box in gun metal with its glint, on the carry handle's hump, lit, and the SO-4's magnifier behind
  // it, one pixel of gun metal on the handle at MAGNIFIER_AT_M (4.7 to 5.8 of 16 along), drawn in line whatever the lever:
  // a pixel cannot show which way it is, the card does. The stock's last pixel, under the grip hand, keeps the hand off the
  // furniture)
  r7: template([
    '....nnno........',
    '....llllll.n....',
    'nnnnnlllllllllnn',
    'n..ttttttttttt..',
    '.....t..N.t.....',
    '.........N......',
  ], -2),
  // (g1: the scope in gun metal with its objective's glint on top instead)
  standard: template([
    '....nnnno..n....',
    'nnnnnlllllllllnn',
    'n..ttttttttttt..',
    '.....t..N.t.....',
    '.........N......',
  ], -1),
  // (the second reference: the boxed sight in gun metal with its glint, on the carry handle's hump, lit, the handle's
  // opening dark under it; the body to the hider's two pixels; the skeleton stock's hole; the vertical grip in gun
  // metal; the clear magazine)
  carbine: template([
    '.....nno........',
    '....llllll......',
    'tllltddddtllllnn',
    't.tttttttttttt..',
    'tt...t..C..n....',
    '.........C.n....',
  ], -2),
  // (the marksman's: the long scope in gun metal with its glint, the precision stock in the furniture, the stock's
  // junction dark under the grip hand, the brake; the bipod folded under the handguard's front; the magazine in gun metal)
  marksman: template([
    '...nnnnnno......',
    'tlllnlllllllllnn',
    'tttttttttttttt..',
    '.....t..N.nn....',
    '.........N......',
  ], -1),
});

// ---------- the designs ----------

// (the HAD-30 as the standard issue's family draws it, in a finish's magazine colours: a straighter curve and wider than
// v0.0.6's (the reference's is bulkier than its grip), its window two pixels so the body dominates, ribs lit across its
// lower third; v1's clear smoked one in every finish)
const hadMag = (F) => Object.freeze({ ...F.mag, w: MAG_W_PX, curvePx: MAG_CURVE_PX, shownM: MAG_SHOWN_M, winW: 2, clear: false });
const clearMag = (F) => Object.freeze({ body: SMOKE, edge: SMOKE_L, win: SMOKE_D, plate: F.B, rib: null, w: 7, curvePx: 7, shownM: MAG_SHOWN_M, clear: true });

/** The designs by id (see the header): { id, name, lenM (on the card), card(C, c), fig, mag(finish) }. */
export const RIFLE_DESIGNS = Object.freeze({
  r7: Object.freeze({ id: 'r7', name: "the R-7, the standard issue: G2's body, V1's sight, the SO-4's flip magnifier", lenM: 0.92, card: r7Card, fig: FIG.r7, mag: hadMag }),
  g1: Object.freeze({ id: 'g1', name: 'the standard issue as first drawn, its low-power scope (an alternate)', lenM: 0.92, card: g1Card, fig: FIG.standard, mag: hadMag }),
  v1: Object.freeze({ id: 'v1', name: 'the variety carbine (the clear magazine)', lenM: 0.90, card: v1Card, fig: FIG.carbine, mag: clearMag }),
  m1: Object.freeze({ id: 'm1', name: "the squad marksman's rifle (the R-7M)", lenM: 1.01, card: m1Card, fig: FIG.marksman, mag: hadMag }),
});
/** The designs' ids. */
export const DESIGN_IDS = Object.freeze(Object.keys(RIFLE_DESIGNS));

/** Which design each model takes (the user's picks of 2026-11-08: the R-7 is r7, the R-7M is m1). */
export const DRAWN_AS = Object.freeze({ r7: 'r7', r7m: 'm1' });

const DRAWN = new Map();
/**
 * A design by its id or by a model's name (DRAWN_AS; anything else, the R-7's) in a finish (src/data/finishes.js; none or an
 * unknown one, the issue's black): { id, name, lenM, finish, card(c), fig, colours, mag }, one object a design and finish.
 */
export function drawingOf(key, finish = ISSUE_FINISH) {
  const D = RIFLE_DESIGNS[key] ?? RIFLE_DESIGNS[DRAWN_AS[key]] ?? RIFLE_DESIGNS.r7, f = finishId(finish), k = `${D.id}|${f}`;
  let out = DRAWN.get(k);
  if (!out) {
    const F = FINISHES[f];
    out = Object.freeze({ id: D.id, name: D.name, lenM: D.lenM, finish: f, card: (c) => D.card(F, c), fig: D.fig, colours: figColours(F), mag: D.mag(F) });
    DRAWN.set(k, out);
  }
  return out;
}
