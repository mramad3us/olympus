// OLYMPUS art: the rifles' drawings. Each design side on twice, on the weapon card and as the figure's template, for the user to score.
//
// The user, 2026-11-08: "Martian standard issue would look more like [the first reference], but we would have
// varyiety in the guns marines carry like [the second]": the Corps trains on the ground with atmospheric arms close
// to the 2020s' (it trains to fight the UN on Earth), so its rifles look like them. This module holds the
// candidate drawings, each a design that both pictures of a rifle can take:
//   - card(c): the body of the rifle at the weapon card's density (weaponcard.js CARD_PX_PER_M, 144 px/m), drawn
//     with c.px (paint.js px), c.at (metres from the butt to the card's x) and c.Y0 (the bore's row); it returns
//     its stations: where the card's state parts go (the magazine's well, the selector, the ejection port, the
//     port's mark, the count's words, the optic's turrets), so the card draws what the holder believes (the
//     magazine, its rounds, the lever, the port, a stoppage) on any design in the same places as on the R-7;
//   - fig: the figure's template in reference pixels at 16 px/m (templates.js GUNS.rifle's form: 16 along, the
//     grip, the support hand, the muzzle and the well at the R-7's stations, so every rig and hand of compose.js
//     holds it unchanged), written as art: one string a row from across `top` down, '.' empty, n gun metal, u black
//     polymer, v steel, t the furniture, l its lit edge, d its dark, o a lens' glint, and an upper-case letter the
//     magazine (drawn only with the magazine in: U black polymer, N gun metal, C the clear one), whose letter a magazine
//     out of the well in the hand takes too (compose.js looseMag). Black parts are drawn in gun metal (n), not black
//     polymer: at 16 px/m a pixel of u is lost in the ink outline beside it; a sight is gun metal with a glint at its
//     front, so it reads over the furniture in every side view; the furniture runs to the muzzle device, two pixels;
//   - colours: the figure's furniture letters (FURN, FURN_L, FURN_D, CLEAR), held at their base tone by shade.js as
//     v, n and u are (a two-pixel rifle shaded by the edge rule would be all shadow). Each is a colour of the Mars
//     palette (src/art/palette.js), so the stage's snap leaves it as drawn: the light, base and dark of one family a step
//     apart, the standard issue's base a step under the variety's (the two told apart by value as well as shape), and the
//     card's tones the same ramp;
//   - mag: the card's magazine as drawn (its body, edge, window, baseplate, width, curve and shown length; clear:
//     a translucent body with the believed rounds seen through it, not a window strip).
// The designs: g0, the R-7 as v0.0.9 draws it (weaponcard.js's own rifle() and templates.js GUNS.rifle, unchanged:
// the comparison); g1 and g2, the standard issue after the first reference (in its flat dark earth, and all black, the
// Corps' colour: the user, 2026-11-08, the factions' colours, the MCRN and the Corps red and black, armour black); v1, the second reference's carbine; m1, the standard issue's squad marksman's rifle (my call: the look the
// R-7M of WEAPONS §3.2 could take, drawn to its row: 101 cm, the HAD-30, a 3 to 12× scope, a bipod, no suppressor). The
// first round's simplified takes (g3, v2) were folded back in (the judge, 2026-11-08: the card has room for the
// references' details at 144 px/m, and what reads at 16 px/m is the figure's, now g1's and v1's). No design changes a
// gun's data: the R-7 stays the R-7, and DRAWN_AS says which drawing each model takes (r7: g0 until the user scores the
// samples, samples/guns). No maker's names: the shapes only.
// Pure: no DOM, no three.js.

/** The figure's letters these drawings add: the furniture, its lit edge, its dark, a clear magazine (shade.js holds them at base tone). */
export const FURN = 'ŧ', FURN_L = 'ț', FURN_D = 'ď', CLEAR = 'ů';
export const HELD_LETTERS = Object.freeze([FURN, FURN_L, FURN_D, CLEAR]);
const ART = Object.freeze({ n: 'n', u: 'u', v: 'v', t: FURN, l: FURN_L, d: FURN_D, o: 'l', c: CLEAR, g: 'g' });

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

// ---------- the card's palette (weaponcard.js's, repeated: that module imports this one) ----------

const INK = 0x14151c, POLY = 0x282b34, POLY_L = 0x3e424d, STEEL = 0x6e7582, STEEL_L = 0x9aa1ae, STEEL_D = 0x49403e;
const GLASS = 0x3c5d84, GLASS_L = 0xb8d8ec, SLING = 0x4c633d, RUBBER = 0x1c1d24;
/**
 * The furniture's ramps (0xrrggbb): light, base, dark and the slots' dark, each a colour of the Mars palette (palette.js
 * PALETTES.mars), one family's steps (OKLCH L 0.66, 0.56, 0.47, 0.38 for the standard issue in flat dark earth; a step higher for the
 * variety), so the snap keeps them apart and in order (the first round's tone() steps had snapped together: the judge,
 * 2026-11-08). FDE: the first reference's flat dark earth (butterscotch dust, hue 68); BLACK: the Corps' black (the user,
 * 2026-11-08: the Corps red and black, armour black), the steel greys' lower steps (hue 265, L 0.47 down to 0.20), the base a
 * step over the black polymer of the stock and the scope (POLY) so the receivers and the handguard read against them and
 * against the card's ground, the slots the darkest (on the figure the stage snaps gun metal, n, to the same base, so the rifle is
 * one black there, a step clear of the ink, its top lit); SAND: the second reference's sand (sand grey, a step lighter).
 */
export const FDE = Object.freeze({ FL: 0xcdab7d, F: 0xb28a59, FD: 0x976a36, FDD: 0x7f4c2c });
export const BLACK = Object.freeze({ FL: 0x565b67, F: 0x3e424d, FD: 0x282b34, FDD: 0x14161d });
export const SAND = Object.freeze({ FL: 0xdad0bc, F: 0xbbb09a, FD: 0x9c917a, FDD: 0x7f735a });
/** The clear magazine's smoke, its edge and its seen-through dark (v1): the sand grey family's lower steps. */
const SMOKE = 0x695745, SMOKE_L = 0x7f735a, SMOKE_D = 0x523d33;
/** The card's tones of a ramp: the furniture's four and the black polymer's two. */
const furniture = (R) => Object.freeze({ ...R, B: POLY, BL: POLY_L });

// (the figure's furniture letters for a ramp; the clear magazine's smoke where a design has one)
const figColours = (R, clear = SMOKE) => Object.freeze({ [FURN]: R.F, [FURN_L]: R.FL, [FURN_D]: R.FD, [CLEAR]: clear });

// ---------- the card's drawing helpers ----------

// (the sling under the rifle, from the stock to the handguard, slack: the R-7's)
function sling(c, m0, m1, sagPx = 9) {
  const { px, at, Y0 } = c;
  for (let x = at(m0); x < at(m1); x++) { const t = (x - at(m0)) / (at(m1) - at(m0)), y = Y0 + 14 + Math.round(Math.sin(t * Math.PI) * sagPx); px(x, y, 1, 2, SLING); }
}
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
// (a scope: its eyepiece bell, tube and objective bell, black, lit along the top, its glass at both ends)
function scope(c, { eye, tube, obj, tubeTop, tubeH, bellTop, bellH, objTop = bellTop, objH = bellH }) {
  const { px, at } = c;
  px(at(tube[0]), tubeTop, at(tube[1]) - at(tube[0]), tubeH, POLY); px(at(tube[0]), tubeTop, at(tube[1]) - at(tube[0]), 1, POLY_L);
  px(at(eye[0]), bellTop, at(eye[1]) - at(eye[0]), bellH, POLY); px(at(eye[0]), bellTop, at(eye[1]) - at(eye[0]), 1, POLY_L);
  px(at(obj[0]), objTop, at(obj[1]) - at(obj[0]), objH, POLY); px(at(obj[0]), objTop, at(obj[1]) - at(obj[0]), 1, POLY_L);
  px(at(eye[0]) - 1, bellTop + 1, 1, bellH - 2, GLASS);
  px(at(obj[1]), objTop + 1, 1, objH - 2, GLASS);
  px(at(obj[1]), objTop + 2, 1, 1, GLASS_L);
}
// (a rail's notches along a run of furniture or black)
function notches(c, m0, m1, y, col, step = 3) { for (let x = c.at(m0) + 1; x < c.at(m1); x += step) c.px(x, y, 1, 1, col); }

/** The R-7's stations on the card (weaponcard.js's, as built): every design here keeps its receiver's to them. */
const stations = (c, more = {}) => ({
  well: [c.at(0.40), c.Y0 + 8], sel: [c.at(0.30), c.Y0 + 4], port: [c.at(0.40), c.Y0 - 3, c.M(0.08), 4], mark: [c.at(0.43), c.Y0 - 13],
  label: c.at(0.40) + 12, turrets: null, ...more,
});

// ---------- the standard issue (the first reference): g1 in its flat dark earth, g2 in the Corps' black ----------

// g1 and g2: the side-folding skeleton stock (black), the receivers and the slim slotted rail handguard in the
// furniture's colour with a rail along the top, the low-power scope on a cantilever mount with its throw lever and an
// offset dot at its front, the angled foregrip, a light on the rail's front, the short brake, the flared well.
function standardCard(C) {
  return (c) => {
    const { px, at, M, Y0 } = c;
    sling(c, 0.08, 0.62);
    // The stock: the butt's rubber pad, a skeleton of a cheek bar and a strut, its hinge at the receiver.
    px(at(0) - 2, Y0 - 8, 3, 19, RUBBER);
    px(at(0) + 1, Y0 - 8, 4, 19, POLY); px(at(0) + 1, Y0 - 8, 4, 1, POLY_L);
    for (let x = at(0) + 5; x < at(0.18); x++) {
      const t = (x - at(0) - 5) / (at(0.18) - at(0) - 5), top = Y0 - 8 + Math.round(t * 2);
      px(x, top, 1, 3, POLY); px(x, top, 1, 1, POLY_L);
      px(x, Math.round(Y0 + 8 - t * 6), 1, 2, POLY);
    }
    px(at(0.17), Y0 - 7, M(0.04), 12, POLY); px(at(0.17), Y0 - 7, M(0.04), 1, POLY_L); px(at(0.185), Y0 - 2, 2, 2, POLY_L);
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
    px(at(0.655), Y0 + 4, M(0.10), 1, POLY);
    for (let k = 0; k < 6; k++) {
      const x0 = at(0.665) + Math.round(k * 1.7), x1 = at(0.75) - Math.round(k * 0.4);
      px(x0, Y0 + 5 + k, x1 - x0, 1, k === 5 ? C.FD : C.F); px(x0, Y0 + 5 + k, 1, 1, C.FL); px(x1 - 1, Y0 + 5 + k, 1, 1, C.FD);
    }
    // The light on the rail's front, the barrel, the brake with its ports.
    px(at(0.72), Y0 - 12, M(0.10), 4, POLY); px(at(0.72), Y0 - 12, M(0.10), 1, POLY_L); px(at(0.82) - 1, Y0 - 11, 1, 2, GLASS_L); px(at(0.74), Y0 - 13, 3, 1, POLY_L);
    px(at(0.84), Y0 - 1, M(0.03), 3, STEEL_D); px(at(0.84), Y0 - 1, M(0.03), 1, STEEL);
    px(at(0.86), Y0 - 3, M(0.06), 6, POLY); px(at(0.86), Y0 - 3, M(0.06), 1, POLY_L);
    px(at(0.875), Y0 - 2, 2, 3, INK); px(at(0.895), Y0 - 2, 2, 3, INK); px(at(0.92) - 1, Y0 - 2, 1, 4, POLY_L);
    // The low-power scope on its cantilever mount: the rings, the throw lever a nub on the mount, the eyepiece's bell a
    // pixel taller than the objective's, a narrow turret between them; the offset dot at its front.
    px(at(0.31), Y0 - 11, M(0.17), 3, POLY); px(at(0.31), Y0 - 9, M(0.17), 1, INK); px(at(0.31) + 2, Y0 - 10, 2, 1, POLY_L);
    scope(c, { eye: [0.25, 0.30], tube: [0.30, 0.455], obj: [0.455, 0.515], tubeTop: Y0 - 17, tubeH: 5, bellTop: Y0 - 20, bellH: 10, objTop: Y0 - 19, objH: 9 });
    px(at(0.33), Y0 - 17, 3, 7, POLY_L); px(at(0.43), Y0 - 17, 3, 7, POLY_L);
    px(at(0.385), Y0 - 19, 2, 2, POLY_L); px(at(0.41), Y0 - 15, 4, 4, POLY_L);
    px(at(0.525), Y0 - 12, M(0.035), 4, POLY); px(at(0.525), Y0 - 12, M(0.035), 1, POLY_L); px(at(0.525) + M(0.035), Y0 - 11, 1, 2, GLASS);
    return stations(c, { turrets: { e: [at(0.37), Y0 - 23], w: [at(0.41), Y0 - 16] } });
  };
}

// ---------- the variety (the second reference): v1 ----------

// v1: one polymer body in sand, the receiver and the handguard together, a carry handle with a rail on it and a
// boxed holographic sight on the rail, the skeleton folding stock, a short rail on the handguard's side, the
// vertical grip, the pronged flash hider, the clear magazine.
function carbineCard(C) {
  return (c) => {
    const { px, at, M, Y0 } = c;
    sling(c, 0.08, 0.60);
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
    px(at(0.645), Y0, M(0.13), 3, POLY); notches(c, 0.645, 0.775, Y0, POLY_L, 3);
    px(at(0.685), Y0 + 5, M(0.05), 2, POLY_L);
    px(at(0.69), Y0 + 7, M(0.04), 14, POLY);
    for (let y = Y0 + 9; y < Y0 + 20; y += 3) px(at(0.69), y, M(0.04), 1, POLY_L);
    px(at(0.69) - 1, Y0 + 20, M(0.04) + 2, 2, POLY_L);
    // The carry handle, its rail, the boxed sight on the rail (its window's glass), the charging handle under it.
    px(at(0.25), Y0 - 14, M(0.04), 8, C.F); px(at(0.25), Y0 - 14, 1, 8, C.FL);
    px(at(0.53), Y0 - 14, M(0.05), 8, C.F); px(at(0.58) - 1, Y0 - 14, 1, 8, C.FD);
    slab(c, 0.25, 0.58, Y0 - 16, Y0 - 13, C);
    px(at(0.545), Y0 - 12, 3, 3, C.FDD);
    px(at(0.26), Y0 - 18, at(0.57) - at(0.26), 2, POLY); notches(c, 0.26, 0.57, Y0 - 18, POLY_L);
    px(at(0.35), Y0 - 20, M(0.14), 2, POLY);
    px(at(0.35), Y0 - 28, M(0.14), 2, POLY); px(at(0.35), Y0 - 28, M(0.14), 1, POLY_L);
    px(at(0.35), Y0 - 28, 2, 8, POLY); px(at(0.49) - 2, Y0 - 28, 2, 8, POLY);
    px(at(0.35) + 2, Y0 - 26, M(0.14) - 4, 6, 0x24324a); px(at(0.35) + 3, Y0 - 25, 1, 4, GLASS);
    px(at(0.40), Y0 - 20, 2, 1, POLY_L); px(at(0.43), Y0 - 20, 2, 1, POLY_L);
    px(at(0.50), Y0 - 9, 4, 2, C.FD);
    // The barrel and the pronged flash hider.
    px(at(0.80), Y0 - 1, M(0.04), 3, STEEL_D); px(at(0.80), Y0 - 1, M(0.04), 1, STEEL);
    px(at(0.84), Y0 - 2, M(0.06), 5, POLY); px(at(0.84), Y0 - 2, M(0.06), 1, POLY_L);
    px(at(0.86), Y0 - 1, M(0.04), 1, INK); px(at(0.86), Y0 + 1, M(0.04), 1, INK);
    return stations(c);
  };
}

// ---------- m1: the squad marksman's rifle of the standard issue's family (my call: a look for the R-7M) ----------

// Drawn to the R-7M's row in WEAPONS §3.2: 101 cm; a 510 mm heavy, free-floated barrel and a brake (no suppressor: that
// is the S-9's SP-9); the HAD-30, the standard issue's magazine; the SO-12, a 3 to 12× scope with a rangefinder; a bipod.
// The standard issue's receivers in flat dark earth with a fixed precision stock (an adjustable cheek riser, a butt
// with its spacers, a monopod's knob), a longer slotted handguard with the bipod folded forward under it (its hinge
// block at the rear, its feet at the front), the heavy barrel standing out of it, the bigger scope (a wider objective,
// tall turrets, a rangefinder's box on its side).
function marksmanCard(C) {
  return (c) => {
    const { px, at, M, Y0 } = c;
    sling(c, 0.10, 0.70, 10);
    // The stock: the butt with its spacers, the body tapering forward, the cheek riser over it, the monopod's knob.
    px(at(0) - 2, Y0 - 10, 3, 21, RUBBER);
    px(at(0) + 1, Y0 - 10, 2, 21, POLY_L); px(at(0) + 3, Y0 - 10, 2, 21, POLY);
    for (let x = at(0) + 5; x < at(0.22); x++) {
      const t = (x - at(0) - 5) / (at(0.22) - at(0) - 5), top = Math.round(Y0 - 7 + t * 1), bot = Math.round(Y0 + 11 - t * 8);
      px(x, top, 1, bot - top, C.F); px(x, top, 1, 1, C.FL); px(x, bot - 1, 1, 1, C.FD);
    }
    px(at(0.05), Y0 - 12, M(0.12), 5, C.F); px(at(0.05), Y0 - 12, M(0.12), 1, C.FL); px(at(0.08), Y0 - 7, 2, 2, STEEL_D); px(at(0.14), Y0 - 7, 2, 2, STEEL_D);
    px(at(0.06), Y0 + 9, 4, 4, POLY); px(at(0.06), Y0 + 12, 4, 1, POLY_L);
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
    px(at(0.56), Y0 + 4, 5, 5, POLY_L); px(at(0.56), Y0 + 4, 5, 1, STEEL); px(at(0.56) + 2, Y0 + 6, 1, 1, STEEL_L);
    px(legX, Y0 + 5, legW, 2, STEEL_D); px(legX, Y0 + 5, legW, 1, STEEL);
    px(at(0.80), Y0 + 4, 3, 6, POLY_L); px(at(0.80), Y0 + 4, 3, 1, STEEL); px(at(0.80) - 1, Y0 + 9, 5, 1, RUBBER);
    // The heavy barrel and the brake with its ports.
    px(at(0.84), Y0 - 2, M(0.09), 4, STEEL_D); px(at(0.84), Y0 - 2, M(0.09), 1, STEEL);
    px(at(0.93), Y0 - 3, at(1.01) - at(0.93), 6, POLY); px(at(0.93), Y0 - 3, at(1.01) - at(0.93), 1, POLY_L);
    for (const m of [0.945, 0.965, 0.985]) px(at(m), Y0 - 2, 2, 3, INK);
    px(at(1.01) - 1, Y0 - 2, 1, 4, POLY_L);
    // The scope: a wider objective, its mount's two rings, the rangefinder's box on its side, the throw lever, the caps.
    px(at(0.33), Y0 - 12, 3, 4, POLY_L); px(at(0.47), Y0 - 12, 3, 4, POLY_L);
    scope(c, { eye: [0.25, 0.31], tube: [0.31, 0.49], obj: [0.49, 0.60], tubeTop: Y0 - 19, tubeH: 6, bellTop: Y0 - 22, bellH: 11, objTop: Y0 - 23, objH: 13 });
    px(at(0.33), Y0 - 19, 3, 6, POLY_L); px(at(0.46), Y0 - 19, 3, 6, POLY_L);
    px(at(0.44), Y0 - 14, M(0.05), 3, POLY); px(at(0.44) + 1, Y0 - 13, 2, 1, GLASS);
    px(at(0.33) + 2, Y0 - 12, 2, 1, POLY_L);
    px(at(0.375), Y0 - 23, 6, 4, POLY_L); px(at(0.41), Y0 - 17, 5, 5, POLY_L);
    return stations(c, { turrets: { e: [at(0.37), Y0 - 25], w: [at(0.41), Y0 - 18] } });
  };
}

// ---------- the figure's templates (see the header's art letters; the R-7's, GUNS.rifle, for comparison) ----------
//   R-7:   .....uuu.....n..   (top -1)
//          nnnnnvvvvnnnnnnn
//          nn..nnnnnnn.....
//          .....n..U.......
//          .........U......

const FIG = Object.freeze({
  // (the first reference: the black skeleton stock to the receiver's rear, the furniture lit along its top and run to the
  // brake, the scope in gun metal with its objective's glint, the light at the rail's front, the brake; the grip and the
  // angled foregrip in the furniture; the magazine in gun metal. The stock's last pixel, under the grip hand, keeps the
  // hand off the furniture, whose base is the skin's value)
  standard: template([
    '....nnnno..n....',
    'nnnnnlllllllllnn',
    'n..ttttttttttt..',
    '.....t..N.t.....',
    '.........N......',
  ], -1),
  // (the second reference: the boxed sight in gun metal with its glint, on the carry handle's hump, lit, the handle's
  // opening dark under it; the body in sand to the hider's two pixels; the skeleton stock's hole; the vertical grip in
  // gun metal; the clear magazine)
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

/** A card magazine's look (weaponcard.js magazine()): the HAD-30 as v0.0.9 draws it, which a design may change. */
export const MAG_LOOK = Object.freeze({ body: POLY, edge: POLY_L, win: 0x1d2b46, plate: POLY_L, w: 7, curvePx: 8, shownM: 0.165, clear: false, rib: null });
// (the standard issue's: black polymer, a straighter curve, wider than the R-7's (the reference's is bulkier than its
// grip), its window two pixels so the black body dominates, ribs lit across its lower third)
const blackMag = Object.freeze({ ...MAG_LOOK, curvePx: 5, w: 9, winW: 2, rib: POLY_L });
const clearMag = Object.freeze({ ...MAG_LOOK, body: SMOKE, edge: SMOKE_L, win: SMOKE_D, plate: POLY, curvePx: 7, clear: true });

/** The drawings by id: { id, name, lenM (on the card), card (null: weaponcard.js's own R-7), fig (null: GUNS.rifle), colours, mag }. */
export const RIFLE_DRAWINGS = Object.freeze({
  g0: Object.freeze({ id: 'g0', name: 'the R-7 as v0.0.9 draws it', lenM: 0.92, card: null, fig: null, colours: Object.freeze({}), mag: MAG_LOOK }),
  g1: Object.freeze({ id: 'g1', name: 'standard issue (flat dark earth)', lenM: 0.92, card: standardCard(furniture(FDE)), fig: FIG.standard, colours: figColours(FDE), mag: blackMag }),
  g2: Object.freeze({ id: 'g2', name: "standard issue in the Corps' black", lenM: 0.92, card: standardCard(furniture(BLACK)), fig: FIG.standard, colours: figColours(BLACK), mag: blackMag }),
  v1: Object.freeze({ id: 'v1', name: 'variety carbine (sand, clear magazine)', lenM: 0.90, card: carbineCard(furniture(SAND)), fig: FIG.carbine, colours: figColours(SAND), mag: clearMag }),
  m1: Object.freeze({ id: 'm1', name: "squad marksman's rifle (a look for the R-7M)", lenM: 1.01, card: marksmanCard(furniture(FDE)), fig: FIG.marksman, colours: figColours(FDE), mag: blackMag }),
});

/** Which drawing each model takes (the wiring point: the user's pick goes here, `r7: 'g2'` say). */
export const DRAWN_AS = Object.freeze({ r7: 'g0' });

/** A drawing by its id or by a model's name (DRAWN_AS); anything else, the R-7 as built. */
export function drawingOf(key) {
  return RIFLE_DRAWINGS[key] ?? RIFLE_DRAWINGS[DRAWN_AS[key]] ?? RIFLE_DRAWINGS.g0;
}
