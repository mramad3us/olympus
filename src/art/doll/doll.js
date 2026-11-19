// OLYMPUS art: the close figure ("the doll"). tradecraft's, ported, a marine's kit on it, and its wounds.
//
// The figure on the inventory, the character sheet, first aid's card and the splash vignettes (DESIGN.md:
// "a close figure at double density (tradecraft's doll) shows your body and kit (inventory, wounds, suit)").
// It is tradecraft's src/art/doll.js, the figure the user had redrawn on 2026-10-31 ("improve the character
// outline, it's not as good as it should be"): a real proportion (six and a half heads, 175 cm over 126
// rows of its reference 64 × 140), standing easy with its weight on the viewer's left leg so it isn't a
// mirror image, drawn in shapes and clusters (grid.js), five tones a colour, a dark seam where a part lies
// over an earlier one, ink round the lot, on a flat wall and floor. OLYMPUS draws it at DOLL_SCALE (the
// stage's density over tradecraft's 16 px/m: 64 × 140 at 16 px/m, 96 × 210 at 24), so it keeps its size
// against the picture, its pixels half the stage's.
//
// What OLYMPUS dresses it in (SETTING.md 5.7, the same looks as the sprites: src/art/figures/outfits.js):
//   - UTILITIES: a closed blouse worn out over the trousers in the Valles pattern (the camouflage painted
//     in the doll's own pixels, each cloth tone of the garment turned into that tone of the pattern's
//     colour, so folds and light survive it), two chest pockets with flaps, the collar's points with rank
//     pins (black metal, SETTING 5.5), name tapes over the pockets; trousers with a cargo pocket on each
//     thigh, bloused into tan rough-out boots; the soft utility cover or the combat helmet;
//   - THE PLATE CARRIER over them, its load-bearing gear as SLOTS (the inventory's containers, VIEWS.md's
//     "inventory by load-bearing gear"): three rifle magazine pouches across the front, a radio pouch with
//     its antenna on the left shoulder, the IFAK and a dump pouch at the belt;
//   - THE LIGHT VAC SUIT (HAD Mk 7): the counter-pressure skin dark on the limbs, the hard shell on the
//     torso with its chest display lit, the Corps' red on the shoulders, seal rings at the neck, wrists,
//     waist and ankles, the pack's straps; sealed, the helmet on with its visor down (a glint, no face);
//     open, the bare head over the neck ring.
// Every slot is marked as tradecraft marked a pocket ({ carrier: [three magazines], radio: [one], belt:
// [IFAK, dump], trousers: [left, right] }, each 'free', 'used' or 'shows'): free, only its seam in the
// cloth's own tones; with something in it, a gold bag under its lip; where it shows, rust.
//
// Wounds are tradecraft's, unchanged in what they draw (the user, 2026-11-03: "graphical representations
// (high quality based on inventory screen)"): blood in four tones of its own, soaked stains ragged at the
// edge, fresh bleeding in drips, a bullet's entry a dark hole with a wet rim and a glint, one a vest stopped
// grey lead in frayed cover, cuts and gashes, an artery spurting, a bruise, a break's jag; dressings (a
// taped pad, or turns round a limb), a tourniquet's strap and buckle high on the limb, a splint's staves,
// bleeding inside as a dashed ring. rows.spots says where each numbered one is, for its plaque.
//
// The body (0.0.4, VIEWS §4.2's first cut: "what the doll shows of the body", graphics over words), from
// BODY's cues (cuesOf: each 0 to 1), as the character sees themselves in the mirror:
//   - wet (wetK): the hair darker, its sheen in the lens' blue along the crown, drops at the temple and
//     on the shoulder; grime (grimeK): dust specks on the hands, the face and the cloth, thickest low on
//     the legs where the dust settles; sweat (sweatK): the cloth darker at the collar, the armpits and the
//     chest (tradecraft's stain in the cloth's own tones); stubble (stubbleK): the jaw and the lip dotted
//     in the hair's colour;
//   - tired (tiredK ≥ 0.5): heavy eyelids over half the eye, dark under it, the shoulders dropped;
//   - the bladder (bladderK ≥ 0.6): the knees in and the right hand at the belt; hunger (hungerK ≥ 0.6):
//     the left hand on the stomach (both arms bent from the shoulder, the forearm across the body, the
//     hand a fist of skin);
//   - and the outfits the body is in for them: PT kit (the oxblood tee, its short sleeves, the grey
//     shorts, running shoes and socks), the towel (at the waist, bare chested, or at the chest for a
//     woman; shower shoes).
// The hair and the hands (0.0.6; the build sheet 0.0.6 §2.2; the user, 2026-11-06: "we should have to
// groom our hair the same way we will have to groom our beards"): the regulation cuts as the figures
// draw them, at the look's drawn step (hair.step): a man's top a patch on the crown (high and tight the
// smallest, medium regulation the fullest, the shaved head none), the scalp round it skin when fresh,
// then a shadow, a dark and the hair's colour as it grows out (outfits.js SIDES_K), the top a pixel
// taller out of regulation; a woman's short cut a row longer at the locks a step, a bun or a braid
// pinned up with stray pixels out of regulation. The hands (handsK, handsWhy: cuesOf's) dirty a share of
// the hands' pixels by their band (used, dirty, grimy: HANDS_SHARE), in the cause's colour: grey for the
// slow rate, the head, a stall and food, black-grey gun oil for the rifle, rust for regolith.
// The helmet samples' candidates (look.helm on the combat EVA suit; samples/helmets): the suit black on the doll, the candidate
// on its head (./helmets.js), the faction's trim on its seams and plate; no look of the game carries one.
// 0.0.18 (the build sheet 0.0.18 §2.2; the user, 2026-11-15: "the I and C menu preview of the character should show the currently
// worn gear"): THE COMBAT EVA SUIT is drawn whenever it is worn (outfit 'combatSuit'; v0.0.17 drew the utilities under it, 8960 of
// 8960 pixels the same): black as the figures wear it (outfits.js COMBAT_SUIT), its sealed helmet's visor down whatever the roof.
// And doll({ gear }) draws what is worn and carried from the gear record (./dress.js dressOf of src/sim/arms/gear.js gearOf): the
// pieces are ./worn.js's, in their order (the rifle on the back before the torso; the belt, the carrier's pouches by the kit's list
// with a baseplate for each magazine in them, the dump pouch, the holster and the pistol pouch; the rifle slung front or at the
// ready, the pistol in the hands; the arms bent onto them; the ear defenders; what the free hand holds). Without gear the doll is
// drawn as before, to the pixel (doll-gear's digests of v0.0.17's), the rifle in the hand from worn.js's memoised stamp.
// Pure: it returns a Pixmap (src/art/paint.js words), opaque, the backdrop round the figure.
import { PX_PER_M } from '../../render/scale.js';
import { word } from '../paint.js';
import { SKIN, HAIR, valles, TOWEL, SHOWER_SHOE, cutOf, SIDES_K, COMBAT_SUIT } from '../figures/outfits.js';
import { helmOf, helmFor } from '../figures/helmets.js';
import { dollHelm, trimDollPlate } from './helmets.js';
import { rifleAt, gearBends, suitBelt, carrierPouches, dumpPouch, holster, earCups, pistolAt, heldItem, backDevices, sideDevices, handDevice, holdGear, anchorParts, RIFLE_IN_HANDS, PISTOL_IN_HANDS, ANCHOR_LOOKS } from './worn.js';
import { backParts } from './back.js';
import { REF, INK, mix, lum, cloth, flesh, smooth, ribbon, edgeOf, grid, halo, TONES } from './grid.js';

/** The close figure's scale: the stage's density over tradecraft's 16 px/m (my call: the same size against the picture). */
export const DOLL_SCALE = PX_PER_M / 16;
export const DROP = 2;                                                 // (drawn from row 0, then set down: air over the head, room for the ink)
const MID = REF.W / 2;
/** Doll pixels a centimetre at scale 1 (tradecraft's: 175 cm over 126 rows): what's held is drawn to its length. */
export const PX_PER_CM = 0.72;
const GOLD = 0xe7b84a, RUST = 0xe8896a;
/** The PT kit's colours (the sprites' own: outfits.js), the wet sheen, the dust of the grime. */
const OXBLOOD = 0x6e2a2e, PT_GREY = 0x8f96a6, RUNNER = 0xc4c8d0, SOCK = 0xe8e6e0, SHEEN = 0xb8d8ec, DUST = 0x7a5a44;
/** Where a cue starts to show on the doll's posture (VIEWS §4.2, the build sheet §2.3 (d)). */
export const TIRED_SHOWS_K = 0.5, BLADDER_SHOWS_K = 0.6, HUNGER_SHOWS_K = 0.6;
/** The hands' dirt (0.0.6): the share of the hands' pixels marked by band ([handsK from, share]: used from 0.2, dirty from 0.4, grimy from 0.7, HANDS_BANDS' dirt over 100), and the colours by cause. */
export const HANDS_SHARE = Object.freeze([[0.2, 0.18], [0.4, 0.4], [0.7, 0.65]]);
export const HANDS_DIRT = Object.freeze({ slow: 0x6e6862, head: 0x6e6862, stall: 0x5f5a54, food: 0x7a6650, rifle: 0x2b2d33, regolith: 0xa04a2c });
const WAIST_Y = 52, BELT_Y = 58, CROTCH_Y = 72, KNEE_Y = 101, ANKLE_Y = 124, FLOOR_Y = 132;
/** The body's rows a part drawn from outside this module takes (./back.js backParts: the waist and the belt, reference rows). */
export const DOLL_ROWS = Object.freeze({ WAIST_Y, BELT_Y });
const lf = (pts) => pts.map(([d, y]) => [MID - d, y]);
const rt = (pts) => pts.map(([d, y]) => [MID + d, y]);
const both = (pts) => [...lf(pts), ...rt(pts).reverse()];
const folds = (g, id, list, c) => { for (const [path, w] of list) g.on(id, g.scan(ribbon(path, w)), c); };

/** The body's measures by sex (reference columns from the middle, and rows): ./back.js draws from them too. */
export const BODY = {
  m: { neck: 4.6, shoulder: 20.4, chest: 16.2, waist: 13.6, hip: 14.6, knee: 13.2, hem: 12.6, gap: 3, ankle: [4.4, 10],
    armOut: [[12, 29.4], [17, 30.6], [19.8, 33], [21, 38], [21.6, 46], [22.4, 53], [22.6, 60], [22, 70]], armIn: [[16.2, 70], [16.4, 60], [15.8, 53], [15.2, 47], [15, 41], [13, 36]], hand: 19.2 },
  f: { neck: 3.5, shoulder: 17.6, chest: 14.4, waist: 10.4, hip: 14.6, knee: 11.6, hem: 10.8, gap: 2.2, ankle: [4, 9.4], small: true,
    armOut: [[10, 29.6], [14.5, 30.6], [17, 33], [18.4, 38], [19.4, 46], [20.6, 53], [21, 60], [20.4, 71]], armIn: [[15.8, 71], [16, 60], [15, 53], [14.2, 46], [13.4, 41], [11.5, 36]], hand: 18 },
};

// The Valles pattern on a garment: its parts (ids) recoloured, each pixel's cloth tone (TONES) turned into
// the same tone of the pattern's colour there. Blocks of two doll pixels a side at scale 1.
function camo(g, ids, T, seed) {
  const tones = TONES.map(k => T[k]), k = 2 * g.S;
  const tone = (c) => { const i = tones.indexOf(c); if (i >= 0) return i; let b = 2, d = Infinity; tones.forEach((t, j) => { const e = Math.abs(lum(t) - lum(c)); if (e < d) { d = e; b = j; } }); return b; };
  const memo = new Map(), ramp = (c) => { let r = memo.get(c); if (!r) { r = cloth(c); memo.set(c, r); } return r; };
  for (let y = 0; y < g.ROWS; y++) for (let x = 0; x < g.W; x++) {
    if (!ids.has(g.part[y][x]) || g.col[y][x] === null) continue;
    const p = valles(x / k, y / k, 16, seed);
    g.col[y][x] = ramp(p)[TONES[tone(g.col[y][x])]];
  }
}

// ---------- the body ----------

function legs(g, B, kit) {
  const T = kit.bareLegs ? flesh(kit.skin) : cloth(kit.legs), kin = kit.knees ?? 0;
  const firm = [[0, BELT_Y], [B.hip, BELT_Y], [B.hip + 0.4, 66], [B.hip - 0.2, 82], [B.knee - kin, KNEE_Y], [B.hem, ANKLE_Y + 1], [B.gap, ANKLE_Y + 1], [B.gap - 1 - kin, KNEE_Y], [0.5, 80], [0, CROTCH_Y]];
  const easy = [[0, BELT_Y], [B.hip, BELT_Y], [B.hip + 0.6, 66], [B.hip + 0.4, 82], [B.knee + 1 - kin, KNEE_Y], [B.hem + 1.8, ANKLE_Y + 1], [B.gap + 1, ANKLE_Y + 1], [B.gap - kin, KNEE_Y], [0.5, 80], [0, CROTCH_Y]];
  const a = g.add(g.scan(lf(firm)), T.base), b = g.add(g.scan(rt(easy)), T.base);
  g.on(a, g.scan(lf([[B.hip + 1, 70], [B.hip - 4.4, 74], [B.knee - 4.2, 94], [B.knee - 2, 99], [B.knee + 1, 99]])), T.soft);
  g.on(a, g.scan(lf([[B.knee + 1, 104], [B.knee - 3.6, 106], [B.hem - 3.6, 118], [B.hem - 1.6, 121], [B.hem + 1, 121]])), T.soft);
  g.on(a, g.scan(lf([[5.4, 74], [5, 88], [5.2, 100], [6, 112], [6, ANKLE_Y + 1], [0, ANKLE_Y + 1], [0, 74]])), T.shade);
  g.on(b, g.scan(rt([[0, 70], [B.gap + 0.4, 74], [B.gap + 2.4, 96], [B.gap, 99], [0, 96]])), T.soft);
  g.on(b, g.scan(rt([[B.gap + 1, 104], [B.gap + 3.4, 106], [B.gap + 3.6, 120], [B.gap + 1, 120]])), T.soft);
  g.on(b, g.scan(rt([[B.hip - 5, 64], [B.hip - 5, 84], [B.knee - 4, 100], [B.hem - 3, 112], [B.hem - 2.4, ANKLE_Y + 1], [B.hem + 4, ANKLE_Y + 1], [B.hip + 3, 64]])), T.shade);
  g.on(a, g.scan(lf([[0, CROTCH_Y - 1], [3.4, CROTCH_Y + 1], [1, 86], [0, 86]])), T.deep); g.on(b, g.scan(rt([[0, CROTCH_Y - 1], [3.4, CROTCH_Y + 1], [1, 86], [0, 86]])), T.deep);
  folds(g, a, [[lf([[B.knee, 100], [B.knee - 3, 101.6], [B.knee - 6, 102.4]]), 1.5], [lf([[B.hem, 121.4], [B.hem - 4, 122.6], [B.hem - 8, 122]]), 1.5]], T.shade);
  folds(g, b, [[rt([[3, 100], [6, 101.6], [9, 101]]), 1.5], [rt([[5, 122], [9, 122.8], [13, 121.4]]), 1.5]], mix(T.shade, T.deep, 0.5));
  if (kit.suit) {
    // (the counter-pressure skin: its seams down the leg, a ring at the knee's joint and the ankle)
    for (const [id, side] of [[a, lf], [b, rt]]) { g.on(id, g.rows(KNEE_Y, 0, REF.W), T.light); g.on(id, g.rows(KNEE_Y + 1, 0, REF.W), T.deep); }
  }
  return { a, b, T };
}
function boots(g, B, kit) {
  if (kit.towel) return showerFeet(g, B, kit);
  const T = cloth(kit.boots), [x0, x1] = [B.gap, B.hem];
  // (rough-out boots, the trousers bloused over their tops: a turned-over roll of cloth at the ankle)
  const top = kit.suit ? ANKLE_Y - 3 : ANKLE_Y - 1;
  const firm = smooth([[x1 - 0.2, top], [x1 + 0.6, 126.6], [x1 + 2, 129.6], [x1 + 1.6, FLOOR_Y], [x0 + 0.2, FLOOR_Y], [x0 - 0.4, 129], [x0 - 0.2, top]]);
  const easy = smooth([[x0 + 0.6, top], [x0 + 0.4, 129], [x0 + 0.8, FLOOR_Y], [x1 + 3.4, FLOOR_Y], [x1 + 4.2, 129.6], [x1 + 2.6, 126.6], [x1 + 1.8, top]]);
  for (const pts of [lf(firm), rt(easy)]) {
    const id = g.add(g.scan(pts), T.base), xs = pts.map(p => p[0]), a = Math.min(...xs), b = Math.max(...xs), mid = (a + b) / 2;
    g.on(id, g.scan([[mid + 1, top], [b + 1, top], [b + 1, FLOOR_Y], [mid + 2, FLOOR_Y]]), T.shade);
    g.on(id, g.scan(smooth([[a + 1.6, 128], [a + 3.4, 126.8], [mid + 0.4, 127.4], [mid, 129.4], [a + 2.4, 129.8]], 3)), T.soft);
    g.on(id, g.rows(FLOOR_Y - 1, 0, REF.W), cloth(kit.suit ? 0x23252f : 0x47302a).base);   // (the sole)
    if (!kit.suit) for (const y of [top + 2, top + 4]) g.on(id, g.rows(y, Math.round(mid) - 1, Math.round(mid) + 1), T.deep);   // (laces)
    // (mag boots (the gear's boots, A's), mag-boots' B-b: the magnet's sole a row deeper under the boot, and its housing
    // round the ankle, the boot's top rows, in the cuff's grey; samples/mag-boots, the default until scored)
    if (kit.gear?.boots === 'mag') {
      g.add(g.scan([[a + 0.2, FLOOR_Y], [b + 0.6, FLOOR_Y], [b + 0.6, FLOOR_Y + MAG_SOLE_ROWS], [a + 0.2, FLOOR_Y + MAG_SOLE_ROWS]]), MAG_BOOT_C.sole);
      g.on(id, g.rows(top, 0, REF.W, top + MAG_CUFF_ROWS - 1), MAG_BOOT_C.cuff);
    }
  }
  if (kit.pt) {
    // (white socks over the running shoes' tops)
    const W2 = cloth(SOCK);
    for (const [side, w0, w1] of [[lf, B.gap - 0.4, B.hem + 0.4], [rt, B.gap + 0.6, B.hem + 2]]) { const r = g.add(g.scan(side([[w0, ANKLE_Y - 4], [w1, ANKLE_Y - 4], [w1 + 0.2, ANKLE_Y - 1], [w0 - 0.2, ANKLE_Y - 1]])), W2.base); g.on(r, g.rows(ANKLE_Y - 2, 0, REF.W), W2.shade); }
  }
  if (!kit.suit && kit.bloused) {
    const C = cloth(kit.legs);
    for (const [side, w0, w1] of [[lf, B.gap - 0.6, B.hem + 0.6], [rt, B.gap + 0.4, B.hem + 2.2]]) {
      const r = g.add(g.scan(side([[w0, ANKLE_Y - 3], [w1, ANKLE_Y - 3], [w1 + 0.3, ANKLE_Y], [w0 - 0.3, ANKLE_Y]])), C.base);
      g.on(r, g.rows(ANKLE_Y - 3, 0, REF.W), C.soft); g.on(r, g.rows(ANKLE_Y - 1, 0, REF.W), C.deep);
      kit.camoParts?.add(r);
    }
  }
}

/** Mag boots on the doll (B-b, samples/mag-boots: the sole and a grey cuff), their colours and their rows (reference rows). */
export const MAG_BOOT_C = Object.freeze({ sole: 0x24262c, cuff: 0x8a9099 }), MAG_SOLE_ROWS = 1, MAG_CUFF_ROWS = 1.3;
/** Bare feet in shower shoes: the feet in skin, a dark sole under them and a strap across the instep. */
function showerFeet(g, B, kit) {
  const S = flesh(kit.skin), sole = cloth(SHOWER_SHOE), [x0, x1] = [B.gap, B.hem], top = ANKLE_Y - 1;
  for (const [side, a, b] of [[lf, x0 + 0.2, x1 + 1.6], [rt, x0 + 0.8, x1 + 3.4]]) {
    const foot = g.add(g.scan(side(smooth([[b - 1.8, top], [b, 127], [b + 0.4, FLOOR_Y - 2], [a, FLOOR_Y - 2], [a - 0.4, 127], [a, top]], 3))), S.base);
    g.on(foot, g.scan(side([[(a + b) / 2 + 1, top], [b + 1, top], [b + 1, FLOOR_Y], [(a + b) / 2 + 1, FLOOR_Y]])), S.shade);
    const sl = g.add(g.scan(side([[a - 0.8, FLOOR_Y - 2], [b + 1, FLOOR_Y - 2], [b + 1, FLOOR_Y], [a - 0.8, FLOOR_Y]])), sole.base);
    g.on(sl, g.rows(FLOOR_Y - 1, 0, REF.W), sole.deep);
    g.over(g.scan(side([[a, 127.2], [b, 126.4], [b, 127.6], [a, 128.4]])), sole.shade);   // (the strap)
  }
}
/** The PT shorts, or the towel at the waist, over bare legs: one part across both thighs to its hem (shorts split at the crotch, a towel not). */
function overLegs(g, B, kit) {
  const T = cloth(kit.towel ? TOWEL : PT_GREY), hem = kit.towel ? 97 : 80;
  const pts = kit.towel
    ? both([[0, BELT_Y - 1], [B.hip + 1.2, BELT_Y - 1], [B.hip + 2, 68], [B.hip + 2.2, 84], [B.hip + 1.6, hem], [0, hem + 0.6]])
    : both([[0, BELT_Y], [B.hip + 0.6, BELT_Y], [B.hip + 1.2, 66], [B.hip + 1.2, hem], [B.gap - 0.6, hem], [0.8, CROTCH_Y + 3]]);
  const id = g.add(g.scan(pts), T.base);
  g.on(id, g.scan(lf([[0, BELT_Y], [B.hip + 2, BELT_Y], [B.hip + 2, hem + 1], [B.hip - 3, hem + 1], [B.hip - 3, 64], [0, 62]])), T.soft);
  g.on(id, g.scan(rt([[B.hip - 4, 60], [B.hip + 3, 60], [B.hip + 3, hem + 1], [B.hip - 4, hem + 1]])), T.shade);
  g.on(id, g.rows(hem - 1, 0, REF.W), T.deep);
  if (kit.towel) {
    // (the towel's rolled top, its tuck at the wearer's left hip, its fold lines falling from it)
    g.on(id, g.rows(BELT_Y - 1, 0, REF.W), T.light); g.on(id, g.rows(BELT_Y, 0, REF.W), T.shade);
    g.on(id, g.rows(BELT_Y + 1, MID + 6, MID + 9, BELT_Y + 3), T.deep);
    folds(g, id, [[[[MID + 7, BELT_Y + 3], [MID + 5, 76], [MID + 3, 94]], 1.4], [[[MID - 8, 64], [MID - 9, 80], [MID - 10, 94]], 1.2]], T.shade);
  } else {
    g.on(id, g.rows(BELT_Y, 0, REF.W), T.deep);                   // (the waistband)
    g.on(id, g.scan(rt([[0, CROTCH_Y + 2], [B.gap, hem - 2], [B.gap + 1, hem], [0, hem]])), T.deep);
  }
  kit.bottomId = id;
}

// ---------- the utility blouse, and the suit's shell ----------

function blouse(g, B, kit) {
  const T = cloth(kit.top), hem = 68, ease = 1.2, d = kit.drop ?? 0;
  const shoulders = [[B.neck + 0.5, 25.6 + d * 0.5], [B.neck + 4.5, 28.5 + d], [B.shoulder - 4, 30.6 + d], [B.shoulder - 1, 33 + d]];
  const id = g.add(g.scan(both([...shoulders, [B.chest + ease, 41], [B.waist + ease + 0.6, WAIST_Y], [B.hip + ease + 0.6, BELT_Y + 2], [B.hip + ease + 0.8, hem]])), T.base);
  g.on(id, g.scan(lf([[B.chest + 2, 41], [B.chest - 2, 31], [B.neck + 3, 28], [B.neck + 5, 31], [B.chest - 4, 34], [B.chest - 2, 42], [B.waist + 1, 50]])), T.soft);
  g.on(id, g.scan(smooth(rt([[B.neck + 3, 27], [B.chest - 5, 36], [B.chest - 3.4, 43], [B.waist - 3.6, WAIST_Y], [B.waist - 2, 58], [B.hip - 2.4, hem + 2], [B.hip + 9, hem + 2], [B.hip + 9, 27]]), 3)), T.shade);
  g.on(id, g.scan(rt([[B.chest + 3, 40], [B.chest - 0.6, 42], [B.waist - 0.4, WAIST_Y], [B.hip + 1, 58], [B.hip + 3, 60]])), T.deep);
  folds(g, id, [[lf([[B.chest - 1, 43], [9, 49], [5, 52]]), 1.8], [lf([[B.waist, 58], [8, 61], [4, 61]]), 1.6]], T.shade);
  g.on(id, g.rows(hem - 1, 0, REF.W), T.deep);
  // (the placket down the middle, its buttons; two chest pockets with flaps)
  for (let y = 33; y < hem - 1; y++) g.on(id, g.rows(y, MID, MID), T.shade);
  for (let y = 38; y < hem - 3; y += 7) g.on(id, g.rows(y, MID - 1, MID - 1), T.deep);
  kit.camoParts.add(id);
  kit.topId = id;
  flap(g, MID - 12, 36, 8, kit.marks.chest?.[0] ?? 'free', T, kit);
  flap(g, MID + 4, 36, 8, kit.marks.chest?.[1] ?? 'free', T, kit);
  // (the name tapes over the pockets: plain tapes, a few stitched letters)
  const tape = cloth(0x5a4636);
  for (const x0 of [MID - 12, MID + 4]) { const t = g.add(g.rows(34, x0, x0 + 7, 35), tape.base); g.on(t, g.rows(35, x0, x0 + 7), tape.shade); for (let k = 1; k < 7; k += 2) g.put(x0 + k, 34, tape.light, t); }
  // (the collar: its points over the neckline, rank pins on them; the neckline's V of skin)
  const S = flesh(kit.skin);
  const n = g.add(g.scan(both([[B.neck - 0.4, 24], [B.neck, 27.4], [2.6, 31.8], [0, 32.4]])), S.base, REF.H);
  g.on(n, g.scan(both([[6, 24], [6, 27.6], [0, 27.6]])), S.shade);
  g.on(n, g.scan(rt([[1, 24], [1, 33], [8, 33], [8, 24]])), S.deep);
  for (const [side, lit] of [[lf, T.light], [rt, T.base]]) {
    const k = g.add(g.scan(side([[0.6, 31.6], [B.neck - 0.6, 25], [B.neck + 2.4, 27], [B.neck + 2, 30], [3.8, 35]])), lit, 0);
    kit.camoParts.add(k);
    if (kit.rank) { const x = side === lf ? MID - 6 : MID + 5; kit.late.push(() => { g.put(x, 30, 0x23252f); g.put(x, 31, 0x23252f); g.put(x, 29, 0x9aa1ae); }); }
  }
  return { id, T, hem };
}
/** The PT tee: oxblood, a crew neck, the Corps' emblem on the left chest, worn out over the shorts. */
function tee(g, B, kit) {
  const T = cloth(OXBLOOD), hem = 64, d = kit.drop ?? 0;
  const id = g.add(g.scan(both([[B.neck + 0.5, 25.6 + d * 0.5], [B.neck + 4.5, 28.5 + d], [B.shoulder - 4, 30.6 + d], [B.shoulder - 1, 33 + d], [B.chest + 0.6, 41], [B.waist + 1, WAIST_Y], [B.hip + 0.8, BELT_Y + 2], [B.hip + 1, hem]])), T.base);
  g.on(id, g.scan(lf([[B.chest + 2, 41], [B.chest - 2, 31], [B.neck + 3, 28], [B.neck + 5, 31], [B.chest - 4, 34], [B.chest - 2, 42], [B.waist + 1, 50]])), T.soft);
  g.on(id, g.scan(smooth(rt([[B.neck + 3, 27], [B.chest - 5, 36], [B.chest - 3.4, 43], [B.waist - 3.6, WAIST_Y], [B.waist - 2, 58], [B.hip - 2.4, hem + 2], [B.hip + 9, hem + 2], [B.hip + 9, 27]]), 3)), T.shade);
  folds(g, id, [[lf([[B.chest - 1, 43], [9, 49], [5, 52]]), 1.6], [lf([[B.waist, 58], [8, 61], [4, 61]]), 1.4]], T.shade);
  g.on(id, g.rows(hem - 1, 0, REF.W), T.deep);
  const S = flesh(kit.skin);
  const n = g.add(g.scan(both([[B.neck - 0.4, 24], [B.neck, 26.6], [2.4, 28.4], [0, 28.8]])), S.base, REF.H);
  g.on(n, g.scan(rt([[1, 24], [1, 30], [8, 30], [8, 24]])), S.deep);
  g.over(g.scan(both([[B.neck + 0.2, 26.6], [B.neck + 0.6, 27.8], [2.4, 29.6], [0, 29.8], [0, 28.8], [2.4, 28.4]])), T.deep);   // (the crew neck's band)
  // (the emblem: an eagle, globe and anchor at stage size a gold blot with a lit pixel)
  g.span(38, MID + 5, MID + 7, GOLD); g.span(39, MID + 5, MID + 7, mix(GOLD, 0x6b3a1c, 0.35)); g.put(MID + 6, 37, mix(GOLD, 0xfff4d0, 0.4));
  kit.topId = id;
  return { id, T, hem };
}
/** Bare chested (the towel at the waist): the torso in skin, the chest's and the belly's shapes in its shades. */
function bareTorso(g, B, kit) {
  const S = flesh(kit.skin), d = kit.drop ?? 0;
  const id = g.add(g.scan(both([[B.neck, 24], [B.neck + 4, 28 + d], [B.shoulder - 4.4, 30.2 + d], [B.shoulder - 1.4, 32.6 + d], [B.chest - 0.4, 41], [B.waist, WAIST_Y], [B.hip, BELT_Y + 1]])), S.base, REF.H);
  g.on(id, g.scan(lf([[B.chest - 1, 41], [B.chest - 3, 31], [B.neck + 3, 28], [B.neck + 5, 31], [B.chest - 5, 34], [B.chest - 3, 42], [B.waist, 50]])), S.soft);
  g.on(id, g.scan(smooth(rt([[B.neck + 3, 27], [B.chest - 5, 36], [B.chest - 4, 43], [B.waist - 4, WAIST_Y], [B.waist - 2, BELT_Y + 2], [B.hip + 9, BELT_Y + 2], [B.hip + 9, 27]]), 3)), S.shade);
  // (the chest's lower line, the sternum, the navel)
  for (const side of [lf, rt]) g.on(id, g.scan(side(ribbon([[2, 41.4], [6, 42.2], [10, 41]], 1.2))), S.shade);
  for (let y = 33; y < 44; y++) g.on(id, g.rows(y, MID, MID), S.soft);
  g.put(MID, 52, S.deep);
  kit.topId = null;
  return { id, T: S, hem: BELT_Y };
}
/** A towel at the chest (a woman's): a tube of towel from under the arms to the knees, its tucked top rolled; the shoulders bare. */
function towelChest(g, B, kit) {
  const S = flesh(kit.skin), T = cloth(TOWEL), d = kit.drop ?? 0;
  const sk = g.add(g.scan(both([[B.neck, 24], [B.neck + 4, 28 + d], [B.shoulder - 4.4, 30.2 + d], [B.shoulder - 1.4, 32.6 + d], [B.chest - 0.4, 38], [0, 38]])), S.base, REF.H);
  g.on(sk, g.scan(rt([[B.neck + 3, 27], [B.shoulder, 30], [B.shoulder, 38], [B.neck + 3, 38]])), S.shade);
  const id = g.add(g.scan(both([[0, 36], [B.chest + 0.4, 36], [B.chest + 1, 41], [B.waist + 1.4, WAIST_Y], [B.hip + 1.6, BELT_Y + 2], [B.hip + 2, 84], [B.hip + 1.6, 97], [0, 97.6]])), T.base);
  g.on(id, g.rows(36, 0, REF.W), T.light); g.on(id, g.rows(37, 0, REF.W), T.shade);
  g.on(id, g.scan(rt([[B.waist - 3, 44], [B.hip + 3, 44], [B.hip + 3, 98], [B.waist - 3, 98]])), T.shade);
  g.on(id, g.rows(96, 0, REF.W), T.deep);
  folds(g, id, [[[[MID + 6, 38], [MID + 5, 60], [MID + 3, 92]], 1.4], [[[MID - 7, 50], [MID - 8, 70], [MID - 9, 92]], 1.2]], T.shade);
  kit.topId = null;
  return { id, T, hem: 97 };
}
function shell(g, B, kit) {
  // (the vac suit's hard torso: a shell over the skin from the collar to the waist ring, the Corps' red at the shoulders)
  const T = cloth(kit.shell), hem = BELT_Y + 2;
  const id = g.add(g.scan(both([[B.neck + 1.4, 25], [B.neck + 5, 27.6], [B.shoulder - 3, 29.6], [B.shoulder, 32.6], [B.chest + 1.6, 41], [B.waist + 1.6, WAIST_Y], [B.waist + 2, hem]])), T.base);
  g.on(id, g.scan(lf([[B.chest + 2, 41], [B.chest - 2, 30], [B.neck + 4, 27], [B.neck + 6, 31], [B.chest - 4, 34], [B.chest - 2, 42], [B.waist + 1, 50]])), T.soft);
  g.on(id, g.scan(smooth(rt([[B.neck + 3, 27], [B.chest - 5, 36], [B.chest - 3.4, 43], [B.waist - 3.6, WAIST_Y], [B.waist - 2, hem + 1], [B.hip + 9, hem + 1], [B.hip + 9, 27]]), 3)), T.shade);
  // (its plates' seams: across the chest, down the sides)
  g.on(id, g.rows(44, MID - 12, MID + 11), T.shade); g.on(id, g.rows(45, MID - 12, MID + 11), T.light);
  for (let y = 33; y < 44; y++) g.on(id, g.rows(y, MID, MID), T.shade);
  const red = cloth(kit.band ?? 0x9e3c36);
  for (const side of [lf, rt]) g.on(id, g.scan(side([[B.shoulder - 1, 29.6], [B.shoulder + 0.6, 33], [B.chest - 2, 33.4], [B.neck + 5, 28.4]])), side === lf ? red.soft : red.base);
  // (the chest display, the wearer's left: a dark bezel, two lit rows; the waist ring)
  const bz = g.add(g.rows(36, MID + 4, MID + 10, 41), 0x23252f);
  g.on(bz, g.rows(37, MID + 5, MID + 9), 0x9fe0b0); g.on(bz, g.rows(39, MID + 5, MID + 7), 0xffa23a); g.on(bz, g.rows(39, MID + 8, MID + 9), 0x9fe0b0);
  kit.glow.add(bz);
  const R = cloth(kit.rings);
  const w = g.add(g.scan(both([[B.waist + 2.4, hem - 1], [B.waist + 2.4, hem + 2]])), R.base);
  g.on(w, g.rows(hem - 1, 0, REF.W), R.light); g.on(w, g.rows(hem + 1, 0, REF.W), R.deep);
  // (the pack's straps over the shoulders, to the shell's top)
  const P = cloth(kit.pack);
  for (const side of [lf, rt]) { const s = g.add(g.scan(side([[B.neck + 4, 26.8], [B.neck + 7.4, 27.6], [10.6, 36], [8, 36]])), side === lf ? P.soft : P.shade, 0); g.on(s, g.rows(27, 0, REF.W), side === lf ? P.light : P.base); }
  return { id, T, hem };
}

// ---------- arms and hands ----------

function arms(g, B, kit) {
  const c = kit.sleeve, S = flesh(kit.skin), bare = kit.bareArms, T = bare ? S : cloth(c), loose = kit.suit || bare ? 0.1 : 0.4, drop = kit.drop ?? 0;
  const armpit = 40, cuffY = B.armIn[0][1];
  const out = B.armOut.map(([d, y], i) => [d + (i ? loose : 0), y + (i < 3 ? drop * (1 - i * 0.3) : 0)]), inn = B.armIn.map(([d, y], i) => [d - (i < 4 ? loose * 0.5 : 0), y]);
  const across = (y) => [edgeOf(out, y), edgeOf([...inn].reverse(), y)];
  for (const [flat, far] of [[lf, 0], [rt, 1]]) {
    // (an arm the body's cues bend: the hand at the belt (the bladder), or on the stomach (hunger))
    const bend = far ? kit.bendL : kit.bendR;
    if (bend) { bentArm(g, B, kit, flat, far, bend, out, inn); continue; }
    const side = (pts) => flat(pts).map(([x, y]) => [x, y - far]);
    const id = g.add(g.scan(side(smooth([...out, ...inn], 3))), T.base, armpit), lit = far ? T.base : T.soft, dark = far ? T.deep : T.shade;
    const inner = (y, k = 0) => across(y)[1] + k, outer = (y, k = 0) => across(y)[0] + k;
    if (far) g.on(id, g.scan(side([[outer(36) - 2.4, 33], [outer(46) - 2.4, 46], [outer(53) - 2.4, 53], [outer(60) - 2.4, 60], [outer(68) - 2.2, cuffY + 1], [outer(68) + 3, cuffY + 1], [outer(46) + 3, 46], [outer(36) + 3, 33]])), T.shade);
    else {
      g.on(id, g.scan(side([[inner(44, 2.4), 41], [inner(53, 2.4), 53], [inner(60, 2.4), 60], [inner(68, 2.2), cuffY + 1], [inner(68, -3), cuffY + 1], [inner(44, -3), 40]])), T.shade);
      g.on(id, g.scan(side([[outer(34) + 2, 31], [outer(36) - 1.4, 33], [outer(44) - 1.6, 46], [outer(49) - 1.4, 49.6], [outer(49) + 2, 50]])), lit);
      g.on(id, g.scan(side([[outer(57) + 2, 57], [outer(58) - 1.4, 58], [outer(64) - 1.4, 64], [outer(66) + 2, 67]])), lit);
    }
    const e = (outer(52) + inner(52)) / 2;
    if (!bare) folds(g, id, [[side([[e + 3.4, 49.6], [e, 52], [e - 3.4, 51]]), 1.5], [side([[e + 3.4, 54], [e + 0.4, 56.4], [e - 3.4, 55]]), 1.5]], dark);
    if (kit.pt) sleeveCap(g, id, side, out, inn, far);
    if (!kit.suit && !bare) kit.camoParts.add(id);
    kit.handIds.push(hands(g, B, flat, kit.gloves ? cloth(kit.gloves) : S, far, !!kit.gloves));
    if (kit.suit) {
      // (the shell's shoulder cap; the wrist's seal ring)
      const sh = cloth(kit.shell), red = cloth(kit.band ?? 0x9e3c36);
      const cap = g.add(g.scan(side(smooth([[out[0][0] - 1, 28.6], [out[2][0] + 0.8, 32], [out[3][0] + 0.8, 38], [inn.at(-1)[0] - 0.5, 38], [inn.at(-1)[0] - 1.5, 33]], 3))), far ? sh.base : sh.soft, armpit);
      g.on(cap, g.rows(36, 0, REF.W), far ? red.shade : red.base); g.on(cap, g.rows(37, 0, REF.W), red.deep);
      const R = cloth(kit.rings), [a, b] = across(cuffY - 1);
      g.over(g.scan(side([[a + 0.4, cuffY - 2 - far], [b - 0.4, cuffY - 2 - far], [b - 0.4, cuffY - far], [a + 0.4, cuffY - far]])), far ? R.base : R.light);
    } else g.on(id, g.rows(cuffY - 3 - far, 0, REF.W), T.deep);
  }
}
/** The PT tee's short sleeve over a bare arm: its cloth from the shoulder to above the elbow, its hem darker. */
function sleeveCap(g, id, side, out, inn, far) {
  const T = cloth(OXBLOOD), y1 = 42.6, pts = [[out[0][0] - 1, out[0][1]], [out[1][0] + 0.6, out[1][1]], [out[2][0] + 0.8, out[2][1]], [out[3][0] + 0.8, y1], [edgeOf([...inn].reverse(), y1) - 0.6, y1], [inn.at(-1)[0] - 0.6, 36]];
  g.on(id, g.scan(side(smooth(pts, 3)).map(([x, y]) => [x, y - far])), far ? T.base : T.soft);
  g.on(id, g.scan(side([[out[3][0] + 1, y1 - 1.2], [inn.at(-2)[0] - 2, y1 - 1.2], [inn.at(-2)[0] - 2, y1], [out[3][0] + 1, y1]]).map(([x, y]) => [x, y - far])), T.deep);
}
/**
 * An arm bent by a cue: the upper arm from the shoulder down the side to the elbow, the forearm across the
 * body to its hand at `to` ([d, y]: reference columns from the middle on its side, a row), the hand a fist.
 */
function bentArm(g, B, kit, side, far, to, out, inn) {
  const S = flesh(kit.skin), bare = kit.bareArms, T = bare ? S : cloth(kit.sleeve);
  const elbow = [out[5][0] - 1.2, 52], elbowIn = [inn[2][0] - 0.4, 52];
  const upper = [...out.slice(0, 5), [out[5][0], 51], elbow, elbowIn, ...inn.slice(3)];
  const id = g.add(g.scan(side(smooth(upper, 3)).map(([x, y]) => [x, y - far])), far ? T.base : T.soft, 40);
  g.on(id, g.scan(side([[elbowIn[0], 40], [elbowIn[0] + 2.6, 40], [elbowIn[0] + 2.6, 53], [elbowIn[0], 53]]).map(([x, y]) => [x, y - far])), T.shade);
  if (kit.pt) sleeveCap(g, id, side, out, inn, far);
  if (!kit.suit && !bare) kit.camoParts.add(id);
  // (the forearm: a band from the elbow to the hand, its lower edge in shade)
  const a = [(elbow[0] + elbowIn[0]) / 2, 51], h = 3.1, dx = to[0] - a[0], dy = to[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * h, ny = dx / L * h;
  const fore = [[a[0] + nx, a[1] + ny], [to[0] + nx, to[1] + ny], [to[0] - nx, to[1] - ny], [a[0] - nx, a[1] - ny]];
  const fid = g.add(g.scan(side(fore).map(([x, y]) => [x, y - far])), bare ? S.base : T.base);
  g.on(fid, g.scan(side([[a[0] - nx * 0.2, a[1] - ny * 0.2], [to[0] - nx * 0.2, to[1] - ny * 0.2], [to[0] - nx, to[1] - ny], [a[0] - nx, a[1] - ny]]).map(([x, y]) => [x, y - far])), bare ? S.shade : T.shade);
  if (!kit.suit && !bare) kit.camoParts.add(fid);
  // (the fist at the end, skin, lit on its top)
  const hand = g.add(g.scan(side(smooth([[to[0] - 3, to[1] - 2.6], [to[0] + 2.4, to[1] - 2.8], [to[0] + 3, to[1] + 1.6], [to[0] - 2.6, to[1] + 2.2]], 3)).map(([x, y]) => [x, y - far])), kit.gloves ? cloth(kit.gloves).base : S.base);
  kit.handIds.push(hand);
  g.on(hand, g.scan(side([[to[0] - 3, to[1] - 3], [to[0] + 3, to[1] - 3], [to[0] + 3, to[1] - 1.6], [to[0] - 3, to[1] - 1.6]]).map(([x, y]) => [x, y - far])), kit.gloves ? cloth(kit.gloves).light : S.light);
}
const HAND = ['.bbbbbs..', '.lbbbbbs.', 'lbbbbbbbs', 'lbbbbbsbs', 'lbbbbbsbs', 'lbbbbsbbs', 'lbbbbsbs.', 'lbsbbsss.', 'bbsbsbs..', 'bbsbsb...', '.bbbb....'];
function hands(g, B, side, S, far, gloved) {
  const y0 = B.armIn[0][1] - 1 - far, x0 = Math.round(MID - B.hand) - 4, rows = gloved ? HAND.map(r => r.replace(/s/g, 'b')) : HAND;
  const id = g.add([], 0);
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
    const ch = rows[y][x];
    if (ch === '.') continue;
    const c = { l: far ? S.base : S.light, b: S.base, s: far ? S.deep : S.shade }[ch];
    g.put(side === lf ? x0 + x : REF.W - 1 - x0 - x, y0 + y, c, id);
  }
  return id;
}

// ---------- the head ----------

function head(g, B, kit, look) {
  const S = flesh(kit.skin);
  const neck = g.add(g.scan(both([[B.neck, 20], [B.neck + 0.4, 25], [B.neck + 1, 28]])), S.base, REF.H);
  g.quiet.add(neck);
  g.on(neck, g.scan(both([[B.neck + 1, 20], [B.neck + 1, 27], [2, 27.6], [0, 27.8]])), S.shade);
  g.on(neck, g.scan(rt([[1, 20], [1, 29], [10, 29], [10, 20]])), S.deep);
  for (const [side, c] of [[lf, S.base], [rt, S.shade]]) { const e = g.add(g.scan(side([[7.4, 12.6], [9.8, 13], [10, 16], [9, 18.8], [7.2, 19]])), c); g.on(e, g.scan(side([[8, 14.4], [9, 14.4], [9, 17], [8, 17]])), side === lf ? S.shade : S.deep); }
  const half = [[0, 5.4], [3.4, 5.8], [6, 7.2], [7.8, 10], [8.2, 13.5], [8, 17.5], [7.2, 20.5], [5.6, 23.4], [3, 25.2], [0, 25.6]];
  const face = g.add(g.scan(smooth([...lf(half.slice(0, -1)), ...rt(half.slice(1)).reverse()], 4)), S.base);
  kit.faceId = face;
  g.on(face, g.scan(smooth([[MID + 5, 6], [MID + 6, 11], [MID + 5, 17], [MID + 3.4, 21], [MID, 25], [MID + 3, 27], [MID + 10, 22], [MID + 10, 8]], 3)), S.shade);
  g.on(face, g.scan(smooth([[MID - 6.4, 8.6], [MID - 2, 6.6], [MID + 1, 7], [MID - 3, 9], [MID - 6, 11.6]], 3)), S.light);
  g.on(face, g.scan(smooth([[MID - 6.8, 17], [MID - 5.4, 16.8], [MID - 5, 18.4], [MID - 6.4, 19]], 2)), S.soft);
  g.on(face, g.rows(25, MID - 3, MID + 2), S.shade); g.on(face, g.rows(24, MID + 1, MID + 3), S.shade);
  const hairC = kit.hair.color, brow = mix(hairC, S.deep, 0.15), lid = mix(0x2a1c18, S.deep, 0.25), white = mix(0xf6f4ee, kit.skin, 0.15), iris = 0x2a1c18;
  // (F3: a man side on drawn front on with his head turned, the features slid toward the side he faces, the far eye
  // narrowed to a lid, the far ear hidden under the cheek's shade; kit.turn the reference columns, 0 front on: the pixels as before)
  const t = kit.turn ?? 0, M = MID + t;
  if (t) g.on(face, g.scan(smooth(t > 0 ? [[MID - 8, 9], [MID - 7, 18], [MID - 5, 23], [MID - 3, 23], [MID - 5, 14]] : [[MID + 8, 9], [MID + 7, 18], [MID + 5, 23], [MID + 3, 23], [MID + 5, 14]], 3)), S.shade);
  for (const [a, b] of [[M - 6, M - 3], [M + 2, M + 5]]) g.span(12, a, b, brow);
  g.put(M - 6, 13, brow); g.put(M + 5, 13, brow);
  for (const x0 of [M - 6, M + 3]) {
    const far = (t > 0 && x0 < M) || (t < 0 && x0 > M);
    g.span(14, x0, x0 + 2, lid);
    if (far) { g.span(15, x0, x0 + 2, lid); continue; }
    g.put(x0, 15, white); g.put(x0 + 1, 15, iris); g.put(x0 + 2, 15, white);
  }
  g.put(M, 16, S.shade); g.put(M, 17, S.shade); g.put(M, 18, S.shade); g.put(M - 1, 19, S.shade); g.put(M, 19, S.deep); g.put(M + 1, 19, S.shade); g.put(M - 1, 18, S.light);
  if (t) g.put(M + Math.sign(t) * 2, 18, S.shade);                    // (the nose's side toward him, shaded)
  g.span(22, M - 2, M + 1, S.deep); g.put(M - 3, 22, S.shade); g.put(M + 2, 22, S.shade); g.span(23, M - 1, M, S.shade);
  void look;
}
// (hair: the regulation cuts (0.0.6) at their step, drawn in clumps, its lit top, a dark where it turns; see the header)
// (a man's top on the crown, by cut: [x, y] in reference pixels, the hairline at its foot; the shaved head has none)
const CAPS = Object.freeze({
  highTight: [[26.4, 8.2], [26.6, 6.4], [28.4, 4.8], [31, 4.2], [34.4, 4.4], [36.6, 5.4], [37.6, 7], [37.4, 8.2], [35.6, 7.6], [32, 7.4], [28.2, 7.8]],
  lowReg: [[24.8, 10.6], [24.6, 8.4], [25.8, 6.2], [28, 4.6], [31, 4], [35.8, 4.2], [38.4, 5.6], [39.4, 8], [39.2, 10.6], [38.4, 9.4], [36.4, 8.4], [32, 8.2], [27.6, 8.6], [25.6, 9.6]],
  medReg: [[24.2, 12], [24, 9.4], [25.2, 6.6], [27.6, 4.4], [31, 3.6], [36, 3.8], [38.6, 5.2], [39.8, 8.2], [39.8, 12], [39.2, 12], [38.6, 9.6], [36.6, 8.6], [32, 8.4], [27.4, 8.8], [25.4, 9.8], [24.8, 12]],
});
const SHORT_CAP = [[23.6, 15], [23.2, 11], [24, 7.6], [26.6, 4.8], [31, 3.4], [36, 3.8], [39, 5.6], [40.6, 8.6], [40.8, 12], [40.2, 15], [39.2, 15], [38.8, 11.6], [36.6, 10.4], [33, 10.6], [29, 9.2], [26.8, 10.4], [25.6, 11.6], [24.8, 15]];
const PINNED_CAP = [[24.2, 12.6], [23.8, 9.4], [25, 6.4], [27.8, 4.4], [31, 3.8], [35.6, 4], [38.6, 5.6], [40, 8.8], [39.8, 12.6], [39, 12.6], [38.4, 10], [36.4, 8.8], [32, 8.6], [27.6, 9], [25.6, 10], [25, 12.6]];
// (the scalp a man's cut leaves short, painted on the face's own skin by the step: the crown above the hairline, the temples
// down to the brows; skin when fresh, then toward the hair's colour, SIDES_K)
function scalp(g, kit, cut, step) {
  if (!step || kit.faceId === undefined) return;
  const S = flesh(kit.skin), k = SIDES_K[step], skinTones = new Map([[S.base, 'base'], [S.light, 'light'], [S.soft, 'soft'], [S.shade, 'shade'], [S.deep, 'deep']]);
  const crownY = cut === 'shaved' ? 9.6 : 9, templeY = 12.2, templeD = cut === 'highTight' ? 5.4 : 6.2;
  for (let y = 0; y < g.T(templeY); y++) for (let x = 0; x < g.W; x++) {
    if (g.part[y]?.[x] !== kit.faceId) continue;
    const t = skinTones.get(g.col[y][x]);
    if (!t) continue;
    const ry = y / g.S, dx = Math.abs(x / g.S - MID);
    if (!(ry < crownY || dx >= templeD)) continue;
    g.col[y][x] = mix(S[t], t === 'shade' || t === 'deep' ? cloth(kit.hair.color).shade : kit.hair.color, k);
  }
}
function hair(g, kit) {
  const cut = cutOf(kit.hair.style), step = kit.hair.step ?? 0, T = cloth(kit.hair.color);
  if (CAPS[cut] !== undefined || cut === 'shaved') scalp(g, kit, cut, step);
  if (cut === 'shaved') return;
  // (out of regulation the top stands a pixel taller: the cap's upper points lifted)
  const lift = (pts) => (step >= 3 ? pts.map(([x, y]) => [x, y < 7 ? y - 1 : y]) : pts);
  // (a woman's short cut grows at the locks: the cap's foot a row lower a step)
  const grow = (pts) => pts.map(([x, y]) => [x, y >= 14 ? y + 1.2 * step : y]);
  const cap = CAPS[cut] ?? (cut === 'short' ? grow(SHORT_CAP) : PINNED_CAP);
  const id = g.add(g.scan(smooth(lift(cap), 2)), T.base);
  g.on(id, g.scan(smooth([[26, 6.6], [30, 4.6], [34.6, 4.8], [31, 6.4], [27.6, 8.4]], 3)), T.light);
  g.on(id, g.scan(rt([[3.6, 2], [5.6, 8], [6, 14], [6.4, 24], [12, 24], [12, 2]])), T.shade);
  if (cut === 'bun') {
    // (the bun on the crown, behind it: a knot of hair, lit on top)
    const b = g.add(g.scan(smooth([[MID - 3.4, 4.2], [MID - 3, 1.4], [MID, 0.4], [MID + 3, 1.4], [MID + 3.4, 4.2]], 3)), T.base);
    g.on(b, g.rows(1, MID - 2, MID + 1), T.light); g.on(b, g.rows(3, MID + 1, MID + 3), T.shade);
  }
  if (cut === 'braid') {
    // (the braid pinned across the crown: a band of crossings, light and dark)
    for (let x = MID - 6; x <= MID + 5; x++) g.put(x, x % 2 ? 4 : 5, x % 2 ? T.light : T.shade, id);
    for (let x = MID - 6; x <= MID + 5; x++) g.put(x, x % 2 ? 5 : 4, T.base, id);
  }
  if ((cut === 'bun' || cut === 'braid') && step >= 3) {
    // (out of regulation, pinned-up hair works loose: strays at the temples)
    g.put(MID - 9, 11, T.base); g.put(MID - 9, 13, T.shade); g.put(MID + 8, 12, T.base); g.put(MID + 9, 14, T.shade);
  }
}
const dim = (g, y, a, b, k) => { for (const [yy, x0, x1] of g.rows(y, a, b)) for (let x = x0; x <= x1; x++) if (g.col[yy]?.[x] !== null && g.col[yy]?.[x] !== undefined) g.col[yy][x] = mix(g.col[yy][x], INK, k); };
function hat(g, kit) {
  const h = kit.head;
  if (!h) return;
  const add = (pts, c) => g.add(g.scan(pts), c);
  if (h.kind === 'helmet') {
    const T = cloth(h.color);
    const shell = add(smooth([[MID - 10.6, 13.6], [MID - 11.2, 8], [MID - 9.2, 3.2], [MID - 4, 1.2], [MID + 4, 1.2], [MID + 9.2, 3.2], [MID + 11.2, 8], [MID + 10.6, 13.6], [MID + 8.2, 13.6], [MID + 8.4, 9.6], [MID - 8.4, 9.6], [MID - 8.2, 13.6]], 4), T.base);
    g.on(shell, g.scan(smooth([[MID - 8.6, 6.4], [MID - 5, 3], [MID + 1, 2.6], [MID - 4, 5.4]], 3)), T.light);
    g.on(shell, g.scan(rt([[3, 1], [5, 14], [11, 14], [11, 1]])), T.shade);
    g.on(shell, g.rows(8, 0, REF.W, 9), T.deep);
    // (the night-vision mount on the brow, the rank stencilled under it)
    const m = g.add(g.rows(5, MID - 2, MID + 1, 7), 0x353947); g.on(m, g.rows(5, MID - 2, MID + 1), 0x4c5262);
    dim(g, 10, MID - 8, MID + 7, 0.25);
  } else if (h.kind === 'cover') {
    // (the soft utility cover: a flat crown a size over the head, its short stiff brim)
    const T = cloth(0x9a6a4a);
    const top = add(smooth([[MID - 9.6, 9.6], [MID - 10.4, 6], [MID - 9, 2.8], [MID + 9, 2.8], [MID + 10.4, 6], [MID + 9.6, 9.6]], 4), T.base);
    g.on(top, g.rows(3, MID - 8, MID + 6), T.light); g.on(top, g.scan(rt([[4, 2], [5, 10], [13, 10], [13, 2]])), T.shade);
    kit.camoParts.add(top);
    const brim = add(smooth([[MID - 9.4, 9.2], [MID + 9.4, 9.2], [MID + 7.6, 12.2], [MID - 7.6, 12.2]], 3), 0x5a4030);
    g.on(brim, g.rows(11, 0, REF.W), 0x3a281e);
    dim(g, 12, MID - 8, MID + 7, 0.3);
  } else if (h.kind === 'vac') {
    // (the vac helmet, sealed: a shell a size up from the head, its visor's dark glass from the brow to the chin with a glint)
    const T = cloth(h.color), V = h.visor ?? 0x1b2541;
    const shellId = add(smooth([[MID - 12.4, 16], [MID - 13, 8], [MID - 10, 1.4], [MID, -0.6], [MID + 10, 1.4], [MID + 13, 8], [MID + 12.4, 16], [MID + 11, 24], [MID + 7, 28.6], [MID - 7, 28.6], [MID - 11, 24]], 4), T.base);
    g.on(shellId, g.scan(smooth([[MID - 10, 6], [MID - 6, 1.8], [MID + 2, 1.2], [MID - 5, 4.4]], 3)), T.light);
    g.on(shellId, g.scan(rt([[6, -1], [9, 28], [14, 28], [14, -1]])), T.shade);
    const visor = add(smooth([[MID - 9.6, 9.6], [MID, 8.6], [MID + 9.6, 9.6], [MID + 9.8, 17], [MID + 7, 23.4], [MID - 7, 23.4], [MID - 9.8, 17]], 4), V);
    g.on(visor, g.scan(smooth([[MID - 7.6, 11], [MID - 4, 10.2], [MID - 6.4, 13.4], [MID - 8.2, 15]], 2)), 0xb8d8ec);
    g.on(visor, g.scan(smooth([[MID + 3, 18], [MID + 8.6, 14], [MID + 8.4, 19], [MID + 5, 22.4]], 2)), 0x283f6b);
    const R = cloth(kit.rings), ring = add(both([[11, 27.4], [12, 30.4]]), R.base);
    g.on(ring, g.rows(27, 0, REF.W), R.light); g.on(ring, g.rows(29, 0, REF.W), R.deep);
    // (the rank stencilled on the brow, the lamp on the side)
    g.span(5, MID - 2, MID + 1, 0x23252f);
    const lamp = g.add(g.rows(10, MID - 13, MID - 12, 12), 0xf8e08a); kit.glow.add(lamp);
  } else if (h.kind === 'ring') {
    const R = cloth(kit.rings), ring = add(both([[9.4, 26.2], [10.4, 29.4]]), R.base);
    g.on(ring, g.rows(26, 0, REF.W), R.light); g.on(ring, g.rows(28, 0, REF.W), R.deep);
  }
}

// ---------- pockets and slots (tradecraft's marks: free a seam, used a gold bag, shows rust) ----------

const fillOf = (m) => { const c = m === 'shows' ? RUST : GOLD; return { light: mix(c, 0xfff4d0, 0.3), base: c, shade: mix(c, 0x6b3a1c, 0.4), edge: mix(c, INK, 0.78) }; };
function pouch(g, x, y, w, h, m, id) {
  const F = fillOf(m), rows = [];
  for (let r = 0; r < h; r++) { const i = r === h - 1 ? 1 : 0; rows.push(...g.rows(y + r, x + i, x + w - 1 - i)); }
  const paint = id === undefined ? (sp, c) => g.over(sp, c) : (sp, c) => g.on(id, sp, c);
  paint(halo(rows).filter(([yy]) => yy >= g.T(y)), F.edge); paint(rows, F.base);
  paint(g.rows(y, x + w - 1, x + w - 1, y + h - 1), F.shade);
  paint(g.rows(y + h - 1, x + 1, x + w - 2), F.shade);
}
/** A flap pocket: x, y its top left, w across, on the garment's part (on). */
function flap(g, x, y, w, m, T, kit) {
  if (m === 'free') {
    for (let yy = y + 3; yy < y + 7; yy++) { g.put(x, yy, T.shade); g.put(x + w - 1, yy, T.deep); }
    g.span(y + 6, x + 1, x + w - 2, T.deep);
  } else kit.late.push(() => { pouch(g, x, y + 2, w, 6, m); g.span(y + 2, x, x + w - 1, mix(T.deep, INK, 0.4)); });   // (the gold after the camouflage and the seams)
  g.span(y, x, x + w - 1, T.light); g.span(y + 1, x, x + w - 1, T.base); g.span(y + 2, x, x + w - 1, T.deep);
}
/** The trousers' cargo pockets, on the outside of each thigh. */
function cargo(g, B, kit, L) {
  for (const [id, side, k] of [[L.a, lf, 0], [L.b, rt, 1]]) {
    const m = kit.marks.trousers?.[k] ?? 'free', d0 = B.hip - 6.6 + k, d1 = B.hip + 0.2 + k * 0.6, y = 80;
    const [x0, x1] = side === lf ? [MID - d1, MID - d0] : [MID + d0, MID + d1];
    const pk = g.add(g.scan([[x0, y], [x1, y], [x1, y + 11], [x0, y + 11]]), L.T.base);
    kit.camoParts.add(pk);
    g.on(pk, g.rows(y + 10, 0, REF.W), L.T.deep); g.on(pk, g.scan([[x1 - 1, y], [x1, y], [x1, y + 11], [x1 - 1, y + 11]]), L.T.shade);
    if (m !== 'free') kit.late.push(() => pouch(g, Math.round(x0) + 1, y + 3, Math.round(x1 - x0) - 2, 7, m, pk));
    g.on(pk, g.rows(y, 0, REF.W), L.T.light); g.on(pk, g.rows(y + 2, 0, REF.W), L.T.deep);
  }
}
function rigBelt(g, B, kit) {
  // (the rigger's belt; the IFAK on the wearer's right hip, the dump pouch on the left: belt slots)
  const T = cloth(0x5c4a36), id = g.add(g.scan(both([[B.hip + 2.4, BELT_Y], [B.hip + 2.4, BELT_Y + 3]])), T.base);
  g.on(id, g.rows(BELT_Y, 0, REF.W), T.light); g.on(id, g.rows(BELT_Y + 2, 0, REF.W), T.shade);
  g.span(BELT_Y, MID - 2, MID + 1, 0x8a8f9a); g.span(BELT_Y + 2, MID - 2, MID + 1, 0x6a7182); g.put(MID - 2, BELT_Y + 1, 0x8a8f9a); g.put(MID + 1, BELT_Y + 1, 0x8a8f9a);
  if (!kit.armour) return;
  // (0.0.18: drawn from the gear, the belt's slots are the gear's own: worn.js dumpPouch; no IFAK is issued)
  if (kit.gear) return;
  const D = cloth(kit.armour.pouch);
  const slots = [['IFAK', MID - B.hip - 3.2, kit.marks.belt?.[0] ?? 'free'], ['dump', MID + B.hip - 4.2, kit.marks.belt?.[1] ?? 'free']];
  for (const [name, x, m] of slots) {
    const p = g.add(g.rows(BELT_Y - 1, x, x + 7, BELT_Y + 7), D.base);
    g.on(p, g.rows(BELT_Y - 1, x, x + 7), D.light); g.on(p, g.rows(BELT_Y + 7, x, x + 7), D.deep); g.on(p, g.rows(BELT_Y - 1, x + 7, x + 7, BELT_Y + 7), D.shade);
    if (name === 'IFAK') { g.put(x + 3, BELT_Y + 2, 0x9e3c36, p); g.put(x + 4, BELT_Y + 2, 0x9e3c36, p); g.put(x + 3, BELT_Y + 1, 0x9e3c36, p); g.put(x + 3, BELT_Y + 3, 0x9e3c36, p); }   // (its red cross)
    if (m !== 'free') pouch(g, x + 1, BELT_Y + 1, 6, 5, m);
    g.span(BELT_Y + 1, x, x + 7, m === 'free' ? D.deep : mix(D.deep, INK, 0.4));
  }
}

// ---------- the plate carrier, its load-bearing slots ----------

function carrier(g, B, kit) {
  const A = kit.armour, T = cloth(A.color), D = cloth(A.pouch), top = 31, foot = WAIST_Y + 1;
  const band = g.add(g.scan(both([[11, 40], [B.chest + 0.6, 41], [B.waist + 1.8, WAIST_Y - 1], [B.waist + 1.4, foot + 1], [11, foot + 1]])), T.shade);
  g.on(band, g.scan(rt([[11, 40], [20, 40], [20, foot + 2], [11, foot + 2]])), T.deep);
  for (const side of [lf, rt]) { const s = g.add(g.scan(side([[6.2, top + 1], [B.neck + 1.4, 26.6], [B.neck + 4.6, 27.6], [10.4, top + 1]])), side === lf ? T.soft : T.shade, 0); g.on(s, g.rows(27, 0, REF.W), side === lf ? T.light : T.base); }
  const plate = g.add(g.scan(both([[6.4, top], [9.4, top], [12.2, top + 4], [12.4, foot], [0, foot]])), T.base);
  if (kit.trim) kit.late.push(() => trimDollPlate(g, plate, kit.trim));
  g.on(plate, g.scan(lf([[0, top], [9.4, top], [12.2, top + 4], [12.4, foot], [10.6, foot], [10.6, top + 5], [8.4, top + 1.6], [0, top + 1.6]])), T.soft);
  g.on(plate, g.rows(top, 0, REF.W), T.light);
  g.on(plate, g.scan(rt([[2, top + 2], [8.4, top + 2], [11, top + 5], [11, foot], [2, foot]])), T.shade);
  g.on(plate, g.rows(foot - 1, 0, REF.W), T.deep);
  for (const y of [top + 9, top + 11]) for (let x = MID - 10; x <= MID + 9; x += 2) for (const [yy, x0] of g.rows(y, x, x)) if (g.part[yy]?.[x0] === plate) g.col[yy][x0] = T.deep;
  // (0.0.18: drawn from the gear, the pouches are the kit's list with their magazines' baseplates, and no radio is issued: worn.js)
  if (kit.gear) { carrierPouches(g, kit, foot); return; }
  // (three rifle magazine pouches across the belly, each a slot: flap lit, seated on the plate by a dark line)
  [[MID - 11, 6], [MID - 3, 6], [MID + 5, 6]].forEach(([x0, w], k) => {
    const m = kit.marks.carrier?.[k] ?? 'free', right = x0 > MID;
    const id = g.add(g.rows(foot - 9, x0, x0 + w - 1, foot - 2), right ? D.shade : D.base);
    g.on(id, g.rows(foot - 9, x0, x0 + w - 1), right ? D.base : D.light); g.on(id, g.rows(foot - 8, x0, x0 + w - 1), right ? D.base : D.soft);
    if (m !== 'free') pouch(g, x0 + 1, foot - 6, w - 2, 4, m, id);
    g.on(id, g.rows(foot - 7, x0, x0 + w - 1), D.deep);
    g.on(id, g.rows(foot - 6, x0 + w - 1, x0 + w - 1, foot - 3), D.deep);
  });
  // (the radio pouch high on the wearer's left chest, its antenna up past the shoulder; a slot of its own)
  const rm = kit.marks.radio?.[0] ?? 'used';
  const r = g.add(g.rows(top + 1, MID + 6, MID + 10, top + 7), D.base);
  g.on(r, g.rows(top + 1, MID + 6, MID + 10), D.light); g.on(r, g.rows(top + 1, MID + 10, MID + 10, top + 7), D.shade); g.on(r, g.rows(top + 7, MID + 6, MID + 10), D.deep);
  if (rm !== 'free') pouch(g, MID + 7, top + 3, 3, 4, rm, r);
  for (let y = top - 9; y <= top; y++) g.put(MID + 8 + (y < top - 5 ? 1 : 0), y, 0x23252f);
  g.put(MID + 9, top - 10, 0x4c5262);
}

// ---------- what's in the hand ----------

/** A rifle hanging from the right hand (the viewer's left), muzzle down, drawn to its length (0.0.18: its pixels worn.js rifleStamp's, memoised, the same pixels in the same order). */
function rifleIn(g, B, kit) { rifleAt(g, B, kit, 'hand', MID); }

// ---------- wounds (tradecraft's, unchanged in what they draw) ----------

const BL = { light: 0xe0574a, base: 0xb3282c, shade: 0x6b1a20, deep: 0x3a0c12 };
const HOLE = 0x1a0508;
const BANDAGE = cloth(0xeeeae0), RAG = cloth(0xb9b2a0), STRAP = cloth(0x2c2e38), WOOD = cloth(0xd2a468), BUCKLE = 0xd9a83a;
const BRUISE = [0x6a4a7a, 0x4a2a5a];
const SLOTS = { head: [[-3, 8], [4, 10], [-5, 18], [5, 19]], torso: [[-6, 39], [5, 42], [-2, 48], [7, 50], [-8, 45], [2, 35]], arm: [44, 58, 51, 38], leg: [80, 111, 94, 70] };
const OWN = { graze: [2, 5], split: [-4, 11], lip: [1, 22], nose: [0, 20], bruise: [-5, 17] };
const BREAK_Y = { arm: 58, leg: 111 };
const SIDE_OF = { armR: lf, armL: rt, legR: lf, legL: rt };
const TEMPLE = [[6, 9], [6, 10], [6, 11], [7, 12], [7, 13], [7, 14], [7, 15], [6, 16], [6, 17], [6, 18], [5, 19], [5, 20], [4, 21], [4, 22], [3, 23]];
const TOURNIQUET_Y = { arm: 37, leg: 65 }, SPLINT_Y = { arm: [45, 67], leg: [82, 121] };
function legAt(B, k, y) {
  const easy = k === 'legL', outer = easy ? [[B.hip, BELT_Y], [B.hip + 0.6, 66], [B.hip + 0.4, 82], [B.knee + 1, KNEE_Y], [B.hem + 1.8, ANKLE_Y + 1]] : [[B.hip, BELT_Y], [B.hip + 0.4, 66], [B.hip - 0.2, 82], [B.knee, KNEE_Y], [B.hem, ANKLE_Y + 1]];
  const inner = easy ? [[0.5, BELT_Y], [0.5, 80], [B.gap, KNEE_Y], [B.gap + 1, ANKLE_Y + 1]] : [[0.5, BELT_Y], [0.5, 80], [B.gap - 1, KNEE_Y], [B.gap, ANKLE_Y + 1]];
  return [edgeOf(inner, y), edgeOf(outer, y)];
}
/** A limb's span at reference row y, in reference columns [left, right]. */
function spanAt(B, k, y) {
  if (k.startsWith('arm')) { const a = edgeOf([...B.armIn].reverse(), y), b = edgeOf(B.armOut, y); return SIDE_OF[k] === lf ? [Math.round(MID - b), Math.round(MID - a) - 1] : [Math.round(MID + a), Math.round(MID + b) - 1]; }
  const [a, b] = legAt(B, k, y);
  return SIDE_OF[k] === lf ? [Math.round(MID - b), Math.round(MID - a) - 1] : [Math.round(MID + a), Math.round(MID + b) - 1];
}
/** Where on the figure a part's nth wound goes (reference x, y before the drop), a kind's own place first. */
export function woundSpot(sex, part, n, kind = null) {
  const B = BODY[sex] ?? BODY.m;
  if (part === 'head' || part === 'torso') { const [d, y] = (part === 'head' && OWN[kind]) || SLOTS[part][n % SLOTS[part].length]; return [Math.round(MID + d), y]; }
  const limb = part.startsWith('arm') ? 'arm' : 'leg', ys = SLOTS[limb], y = (kind === 'break' || kind === 'crack' ? BREAK_Y[limb] : ys[n % ys.length]) - (part === 'armL' ? 1 : 0);
  const d = part.startsWith('arm') ? (edgeOf([...B.armIn].reverse(), y) + edgeOf(B.armOut, y)) / 2 : legAt(B, part, y).reduce((a, b) => a + b) / 2;
  return [Math.round(SIDE_OF[part] === lf ? MID - d - 0.5 : MID + d - 0.5), y];
}
function marksOn(g) {
  const has = (x, y) => g.col[y]?.[x] !== null && g.col[y]?.[x] !== undefined;
  const block = (x, y, f) => { for (let yy = g.T(y); yy < g.T(y + 1); yy++) for (let xx = g.T(x); xx < g.T(x + 1); xx++) if (has(xx, yy)) f(xx, yy); };
  return {
    tint: (x, y, c, t) => block(x, y, (xx, yy) => { g.col[yy][xx] = mix(g.col[yy][xx], c, t); }),
    dab: (x, y, c) => block(x, y, (xx, yy) => { g.col[yy][xx] = c; }),
  };
}
function stain(g, M, x, y, r, t = 0.7) {
  for (let dy = -r; dy <= r + 2; dy++) for (let dx = -r; dx <= r; dx++) {
    const e = Math.hypot(dx / (r + 0.4), (dy > 0 ? dy / (r + 1.6) : dy / (r + 0.2)));
    if (e > 1) continue;
    if (e > 0.7 && ((x + dx) * 7 + (y + dy) * 13) % 3 === 0) continue;
    M.tint(x + dx, y + dy, e < 0.45 ? BL.deep : BL.shade, e < 0.45 ? t : e < 0.75 ? t * 0.8 : t * 0.55);
  }
}
function drips(M, x, y, level) {
  const L = [0, 2, 5, 9][level] ?? 0, one = (x0, y0, n) => { for (let k = 0; k < n; k++) M.dab(x0, y0 + k, k === n - 1 ? BL.shade : k === 0 && n > 2 ? BL.light : BL.base); };
  one(x, y, L);
  if (level >= 2) one(x + 1, y + 1, Math.ceil(L / 2));
  if (level >= 3) one(x - 1, y + 2, L - 3);
}
function pad(M, x, y, kind, wet, wide = 6) {
  const T = kind === 'rag' ? RAG : BANDAGE, x0 = x - Math.floor(wide / 2) + 1, x1 = x0 + wide - 1;
  for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x0; xx <= x1; xx++) M.dab(xx, yy, yy === y - 2 ? T.light : yy === y + 2 || xx === x1 ? T.shade : xx === x0 ? T.soft : T.base);
  for (const yy of [y - 1, y + 1]) { M.dab(x0 - 1, yy, T.soft); M.dab(x1 + 1, yy, T.shade); }
  if (kind === 'rag') { M.dab(x0 + 1, y, T.shade); M.dab(x1 - 1, y - 1, T.shade); }
  if (wet) soak(M, x, y, wet);
}
function soak(M, x, y, wet) { M.dab(x, y, BL.base); M.dab(x + 1, y, BL.shade); M.dab(x, y + 1, BL.shade); if (wet >= 2) { M.dab(x - 1, y, BL.base); M.dab(x + 1, y + 1, BL.base); M.dab(x, y - 1, BL.shade); } }
function band(g, B, k, y, T, rows = 2) {
  const [l, h] = spanAt(B, k, y), x0 = l - 1, x1 = h + 1;
  for (let r = 0; r < rows; r++) for (let x = x0; x <= x1; x++) g.put(x, y + r, r === 0 ? (x === x0 ? T.soft : T.light) : r === rows - 1 && rows > 1 ? (x === x1 ? T.deep : T.shade) : x === x1 ? T.shade : T.base);
  if (rows > 3) for (let r = 1; r < rows - 1; r++) for (let x = x0 + 1; x < x1; x++) if ((x + r * 2) % 4 === 0) g.put(x, y + r, T.shade);
  return [x0, x1];
}
function wounds(g, B, sex, W) {
  const spots = [], count = {}, M = marksOn(g);
  if (W.bloody?.clothes && !W.wounds.some(w => w.part === 'torso' && w.kind !== 'inside')) { stain(g, M, MID - 7, 45, 2, 0.5); stain(g, M, MID + 4, 53, 1, 0.45); }
  if (W.bloody?.face && !W.wounds.some(w => w.part === 'head' && ['nose', 'split', 'graze', 'hole'].includes(w.kind))) { M.dab(MID - 1, 20, BL.shade); M.dab(MID - 1, 21, BL.base); M.tint(MID - 4, 21, BL.shade, 0.4); M.tint(MID + 2, 24, BL.shade, 0.4); }
  for (const w of W.wounds) {
    const n = (OWN[w.kind] && w.part === 'head') || w.kind === 'inside' || ((w.kind === 'break' || w.kind === 'crack') && w.part in SIDE_OF) ? 0 : (count[w.part] = (count[w.part] ?? -1) + 1);
    const [x, y] = w.kind === 'inside' ? [MID, 50] : woundSpot(sex, w.part, n, w.kind);
    spots.push({ n: w.n, tone: w.tone, x, y, part: w.part });
    const lv = w.bleed ?? 0, limb = w.part in SIDE_OF;
    if (w.kind === 'inside') {
      const ring = new Set();
      for (let k = 0; k < 96; k++) { const t = (k / 96) * Math.PI * 2; ring.add(`${Math.round(MID - 0.5 + Math.cos(t) * 7.5)},${Math.round(52 + Math.sin(t) * 4.5)}`); }
      [...ring].map(c => c.split(',').map(Number)).sort((a, b) => Math.atan2(a[1] - 52, a[0] - MID) - Math.atan2(b[1] - 52, b[0] - MID)).forEach(([xx, yy], k) => { if (k % 3 < 2) M.dab(xx, yy, yy < 52 ? RUST : mix(RUST, BL.shade, 0.35)); });
    } else if (w.kind === 'hole') {
      if (w.dressed) { if (limb) { band(g, B, w.part, y - 2, w.dressed === 'rag' ? RAG : BANDAGE, 4); if (lv) soak(M, x, y, lv); } else pad(M, x, y, w.dressed, lv); if (lv > 1) drips(M, x, y + 3, lv - 1); continue; }
      stain(g, M, x, y + 1, lv >= 3 ? 4 : lv >= 2 ? 3 : 2);
      M.dab(x, y, HOLE); M.dab(x + 1, y, HOLE); M.dab(x, y + 1, HOLE); M.dab(x + 1, y + 1, BL.deep);
      M.dab(x - 1, y, BL.shade); M.dab(x, y - 1, BL.shade); M.dab(x + 1, y - 1, BL.shade); M.dab(x - 1, y + 1, BL.base); M.dab(x + 2, y + 1, BL.base); M.dab(x + 2, y, BL.shade);
      if (lv) { M.dab(x - 1, y - 1, BL.light); drips(M, x, y + 2, lv); }
    } else if (w.kind === 'stopped') {
      const fray = w.plate ? [[-1, 0], [2, 0], [0, -1], [1, -1], [0, 2], [1, 2], [-1, 1], [2, 1]] : [[-1, 0], [2, 1], [0, -1]];
      for (const [dx, dy] of fray) M.tint(x + dx, y + dy, 0xdfe2e8, w.plate ? 0.4 : 0.3);
      M.dab(x, y, 0x2a2c36); M.dab(x + 1, y, 0x1f2029); M.dab(x, y + 1, 0x1f2029); M.dab(x + 1, y + 1, 0x9aa1ae);
    } else if (w.kind === 'graze') {
      for (let k = -2; k <= 2; k++) M.dab(x + k, y + (k > 0 ? 1 : 0), Math.abs(k) < 2 ? BL.deep : BL.shade);
      M.dab(x - 1, y - 1, BL.base);
      if (w.dressed) for (let k = -5; k <= 5; k++) { M.dab(MID + k, 9, BANDAGE.light); M.dab(MID + k, 10, BANDAGE.base); M.dab(MID + k, 11, k > 3 ? BANDAGE.deep : BANDAGE.shade); }
      if (lv) TEMPLE.slice(0, 3 + 3 * lv).forEach(([dx, yy], k) => { M.dab(MID + dx, yy, k % 5 === 4 ? BL.shade : BL.base); if (k < 3) M.dab(MID + dx - 1, yy, BL.shade); });
    } else if (w.kind === 'cut' || w.kind === 'gash') {
      const long = w.kind === 'gash' ? 3 : 2;
      if (w.dressed) { if (limb) { band(g, B, w.part, y - 2, w.dressed === 'rag' ? RAG : BANDAGE, 4); if (lv) soak(M, x, y, lv); } else pad(M, x, y, w.dressed, lv); if (lv > 1) drips(M, x, y + 3, lv - 1); continue; }
      if (lv || w.kind === 'gash') stain(g, M, x, y + 1, w.kind === 'gash' ? 2 + Math.min(2, lv) : 1, 0.55);
      for (let k = -long; k <= long; k++) { M.dab(x + k, y + Math.round(k * 0.6), w.kind === 'gash' && Math.abs(k) < long ? HOLE : BL.shade); if (w.kind === 'gash') M.dab(x + k, y + Math.round(k * 0.6) + 1, BL.base); }
      if (w.stitched) for (let k = -long + 1; k < long; k += 2) { M.dab(x + k, y + Math.round(k * 0.6) - 1, INK); M.dab(x + k, y + Math.round(k * 0.6) + 1, INK); }
      if (lv) drips(M, x + 1, y + 2, lv);
      if (w.spurt) for (const [dx, dy] of [[3, -2], [5, -1], [6, 1], [4, -3]]) M.dab(x + (SIDE_OF[w.part] === rt ? dx : -dx), y + dy, dy < -1 ? BL.light : BL.base);
    } else if (w.kind === 'split' || w.kind === 'lip') {
      M.dab(x, y, BL.deep); M.dab(x + 1, y, BL.shade); M.dab(x, y + 1, BL.base);
      if (lv) drips(M, x, y + 2, Math.min(2, lv));
    } else if (w.kind === 'nose') {
      if (lv || W.bloody?.face) { M.dab(MID - 1, 20, BL.shade); M.dab(MID, 20, BL.shade); M.dab(MID - 1, 21, BL.base); if (lv) { M.dab(MID - 1, 22, BL.base); M.dab(MID, 21, BL.base); } }
    } else if (w.kind === 'bruise' && w.part === 'head') {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -3; dx <= 2; dx++) { const e = Math.hypot(dx / 3, dy / 2.2); if (e < 1) M.tint(x + dx, y + dy, e < 0.5 ? BRUISE[1] : BRUISE[0], e < 0.5 ? 0.5 : 0.32); }
    } else if (w.kind === 'crack' || w.kind === 'break') {
      const [l, h] = limb ? spanAt(B, w.part, y) : [x - (w.kind === 'crack' ? 2 : 3), x + (w.kind === 'crack' ? 2 : 3)];
      for (let xx = l; xx <= h; xx++) { const yy = y + ((xx - l) % 2), c = g.col[g.T(yy)]?.[g.T(xx)]; if (c !== null && c !== undefined) M.tint(xx, yy, lum(c) < 100 ? 0xf6f4ee : INK, lum(c) < 100 ? 0.5 : w.kind === 'break' ? 0.75 : 0.6); }
    }
  }
  for (const k of W.tourniquets ?? []) {
    if (!(k in SIDE_OF)) continue;
    const y = TOURNIQUET_Y[k.startsWith('arm') ? 'arm' : 'leg'] - (k === 'armL' ? 1 : 0), [l, h] = band(g, B, k, y, STRAP), x = SIDE_OF[k] === lf ? l : h;
    g.put(x, y, BUCKLE); g.put(x, y + 1, mix(BUCKLE, INK, 0.45));
  }
  for (const k of W.splints ?? []) {
    if (!(k in SIDE_OF)) continue;
    const [y0, y1] = SPLINT_Y[k.startsWith('arm') ? 'arm' : 'leg'].map(y => y - (k === 'armL' ? 1 : 0));
    for (let y = y0; y <= y1; y++) { const [l, h] = spanAt(B, k, y); g.put(l - 1, y, y === y0 ? WOOD.light : WOOD.soft); g.put(h + 1, y, y === y0 ? WOOD.base : WOOD.shade); }
    for (const t of [0.15, 0.5, 0.85]) band(g, B, k, Math.round(y0 + (y1 - y0) * t), BANDAGE, 1);
  }
  return spots;
}

// ---------- the body's marks (0.0.4: BODY's cues, see the header) ----------

const h3 = (x, y, k) => { let v = (x * 374761393 + y * 668265263 + k * 2147483647) | 0; v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
/** Wet hair's sheen along the crown, a drop at the temple and one on the shoulder. */
function wetHair(g, kit) {
  const hairC = kit.hair.color;
  for (let y = 0; y < g.ROWS; y++) for (let x = 0; x < g.W; x++) {
    const c = g.col[y][x];
    if (c !== hairC && c !== cloth(hairC).light && c !== cloth(hairC).base) continue;
    if (y / g.S < 9 && h3(x, y, 5) < 0.22 && (x / g.S < MID + 2)) g.col[y][x] = SHEEN;
  }
  g.put(MID - 9, 14, SHEEN); g.put(MID - 9, 15, mix(SHEEN, 0x5d9db1, 0.3));
  g.put(MID + 12, 31, SHEEN);
}
/** The hands' dirt (0.0.6; see the header): a share of the hands' pixels by band, in the cause's colour, cosmetic by position. */
function dirtyHands(g, kit, k, why) {
  let share = 0;
  for (const [from, sh] of HANDS_SHARE) if (k >= from - 1e-9) share = sh;
  if (!share || !kit.handIds.length) return;
  const dirt = HANDS_DIRT[why ?? 'slow'] ?? HANDS_DIRT.slow, ids = new Set(kit.handIds);
  for (let y = 0; y < g.ROWS; y++) for (let x = 0; x < g.W; x++) {
    if (!ids.has(g.part[y]?.[x]) || g.col[y][x] === null) continue;
    if (h3(x, y, 29) < share) g.col[y][x] = mix(g.col[y][x], dirt, why === 'rifle' ? 0.62 : 0.5);
  }
}
/** Stubble: the jaw, the chin and the lip dotted in the hair's colour over the skin (density by stubbleK). */
function stubble(g, kit, k) {
  const S = flesh(kit.skin), dot = mix(kit.hair.color, S.shade, 0.35);
  for (let y = g.T(19); y < g.T(26); y++) for (let x = g.T(MID - 7); x < g.T(MID + 7); x++) {
    const c = g.col[y]?.[x], ry = y / g.S;
    if (c !== S.base && c !== S.shade && c !== S.soft && c !== S.light) continue;
    if (ry < 21 && Math.abs(x / g.S - MID) > 3.2 && ry < 20.5) continue;   // (the cheeks above the jaw stay clear)
    if (h3(x, y, 9) < 0.18 + 0.5 * k) g.col[y][x] = dot;
  }
}
/** Tired: the lids down over half of each eye, dark under them. */
function tiredEyes(g, kit) {
  const S = flesh(kit.skin), lid = mix(0x2a1c18, S.deep, 0.25);
  for (const x0 of [MID - 6, MID + 3]) { g.span(14, x0 - 1, x0 + 3, mix(lid, S.shade, 0.3)); g.put(x0, 15, lid); g.put(x0 + 2, 15, lid); g.span(16, x0, x0 + 2, S.shade); }
}
/** Grime: dust specks over the figure, thickest low on the legs and on the hands (by grimeK). */
function grimeMarks(g, k) {
  for (let y = 0; y < g.ROWS; y++) for (let x = 0; x < g.W; x++) {
    const c = g.col[y][x];
    if (c === null) continue;
    const ry = y / g.S, low = ry > 100 ? 1.8 : ry > 70 ? 1.2 : 1;
    if (h3(x, y, 17) < k * 0.2 * low) g.col[y][x] = mix(c, DUST, 0.42);
  }
}
/** Sweat: the top darker at the collar, the armpits and down the chest (tradecraft's stain, in the cloth's own darker tones). */
function sweatMarks(g, kit, k) {
  if (!kit.topId) return;
  const blots = [[MID - 13, 40, 3.2, 4], [MID + 12, 40, 3.2, 4], [MID - 0.5, 30.5, 5, 1.6], [MID - 0.5, 40, 2.6, 4.6]];
  for (const [cx, cy, rx, ry] of blots) for (let y = g.T(cy - ry); y < g.T(cy + ry); y++) for (let x = g.T(cx - rx); x < g.T(cx + rx); x++) {
    if (g.part[y]?.[x] !== kit.topId) continue;
    const e = Math.hypot((x / g.S - cx) / rx, (y / g.S - cy) / ry);
    if (e < 1 && (e < 0.6 || h3(x, y, 23) < 0.6)) g.col[y][x] = mix(g.col[y][x], INK, 0.16 + 0.16 * k);
  }
}

// ---------- the poses (the build sheet §3.3, P§3.3; portrait-pose's defaults) ----------

/** Where the legs are cut from the body and bent: the belt (their top), the knee, the floor's last row + 1 (reference rows). */
const HIP_Y = BELT_Y, LEG_KNEE_Y = KNEE_Y, LEG_FOOT_Y = FLOOR_Y + 1;
/**
 * The poses as bends of the standing figure's parts (data: samples/portrait-pose's candidates are rows of the same shape): the
 * body above the legs set down `drop` reference rows (and cut at row `cut` of it: what lies behind a prone man's shoulders), each
 * leg (r the man's right, the viewer's left) its thigh's and its shin's rows drawn at a share (k; 'fit' fills to the floor), from
 * `from` (else the hip's new row), the legs drawn over the body (legsOver: knees up before a sitting man's belly) or under it;
 * `lean` shears the body toward the viewer's right (a share of a column a row); `arms` the fists' places (doll.js bentArm's),
 * over the hold's. The anchors (the head's and the A zone's centres) go down with the body. Default poses (my call, the lens's):
 * K1 kneeling on the right knee, the left foot planted; D1 sitting on the floor, knees up, the rifle across them; C1 crouched, the
 * fists at the head's sides; Y-p prone, the head and shoulders low behind the rifle, end on.
 */
export const POSE_BENDS = Object.freeze({
  stand: null,
  kneel: Object.freeze({ drop: 31, legs: Object.freeze({ r: Object.freeze([1, 0]), l: Object.freeze([0.25, 'fit']) }) }),
  sit: Object.freeze({ drop: 66, legsOver: true, lap: true, legs: Object.freeze({ r: Object.freeze([0, 0.9, 104]), l: Object.freeze([0, 0.9, 104]) }), arms: Object.freeze({ bendR: Object.freeze([14, 38]), bendL: Object.freeze([14, 38]) }) }),
  cower: Object.freeze({ drop: 28, legs: Object.freeze({ r: Object.freeze([0.35, 'fit']), l: Object.freeze([0.35, 'fit']) }), arms: Object.freeze({ bendR: Object.freeze([9.5, 13]), bendL: Object.freeze([9.5, 13]) }) }),
  prone: Object.freeze({ drop: 86, cut: 46, legs: null }),
  // ("Bang, then go": samples/breach-poses D-a's card until the user scores, hunched, the support hand to the eyes, the rifle
  // low in the firing hand; on his knee the kneel's legs under the same arms (my call): a role-player dazed, as the stage draws him)
  daze: Object.freeze({ drop: 5, legs: Object.freeze({ r: Object.freeze([0.95, 'fit']), l: Object.freeze([0.95, 'fit']) }), arms: Object.freeze({ bendL: Object.freeze([0.5, 15]) }) }),
  dazeKneel: Object.freeze({ drop: 31, legs: Object.freeze({ r: Object.freeze([1, 0]), l: Object.freeze([0.25, 'fit']) }), arms: Object.freeze({ bendL: Object.freeze([0.5, 15]) }) }),
});
/** The reference rows of the standing figure's anchors: the head's centre and the man-target's A zone's (hitcard.js HEAD_ROW, A_ROW at scale 1). */
export const HEAD_Y = 16, A_ZONE_Y = 37.6;

// (the bend (POSE_BENDS' shape) on the drawn grid: the body's parts moved rigidly, the legs' rows resampled side by side)
function bendPose(g, P, legIds) {
  const S = g.S, R = g.ROWS, W = g.W, col = g.col, part = g.part, T = (v) => Math.round(v * S), mid = Math.round(g.MID * S);
  const nc = Array.from({ length: R }, () => Array(W).fill(null)), np = Array.from({ length: R }, () => Array(W).fill(0));
  const drop = T(P.drop ?? 0), cut = Number.isFinite(P.cut) ? T(P.cut) : Infinity;
  const body = () => {
    for (let y = 0; y < Math.min(R, cut); y++) for (let x = 0; x < W; x++) {
      const c = col[y][x], p = part[y][x];
      if (c === null || legIds.has(p)) continue;
      const yd = y + drop, xd = x + (P.lean ? Math.round((T(HIP_Y) + drop - yd) * -P.lean) : 0);
      if (yd >= 0 && yd < R && xd >= 0 && xd < W) { nc[yd][xd] = c; np[yd][xd] = p; }
    }
  };
  const legs = () => {
    if (!P.legs) return;
    const thigh = LEG_KNEE_Y - HIP_Y, shin = LEG_FOOT_Y - LEG_KNEE_Y;
    for (const side of ['r', 'l']) {
      const [kt, ks0, from0] = P.legs[side], from = Number.isFinite(from0) ? from0 : HIP_Y + (P.drop ?? 0);
      const ks = ks0 === 'fit' ? Math.max(0, (LEG_FOOT_Y - from - kt * thigh) / shin) : ks0;
      const segs = [[HIP_Y, kt * thigh, kt], [LEG_KNEE_Y, ks * shin, ks]];
      let at = from;
      for (const [src0, n, k] of segs) {
        if (k > 0) for (let yd = T(at); yd < T(at + n) && yd < R; yd++) {
          const ys = Math.min(R - 1, Math.floor(T(src0) + (yd - T(at)) / k));
          for (let x = side === 'r' ? 0 : mid; x < (side === 'r' ? mid : W); x++) { const c = col[ys][x], p = part[ys][x]; if (c !== null && legIds.has(p) && yd >= 0) { nc[yd][x] = c; np[yd][x] = p; } }
        }
        at += n;
      }
    }
  };
  if (P.legsOver) { body(); legs(); } else { legs(); body(); }
  for (let y = 0; y < R; y++) { col[y] = nc[y]; part[y] = np[y]; }
}

/** The profile candidate's width against the front's (F2: a candidate the user scores; the game draws F1 and F3). */
export const PROFILE_K = 0.6;
// (the figure drawn narrower about its middle column, nearest: the profile candidate)
function squeeze(g, k) {
  const W = g.W, c = W / 2;
  for (let y = 0; y < g.ROWS; y++) {
    const row = g.col[y], prt = g.part[y], nr = Array(W).fill(null), np = Array(W).fill(0);
    for (let x = 0; x < W; x++) { const sx = Math.floor(c + (x + 0.5 - c) / k); if (sx >= 0 && sx < W) { nr[x] = row[sx]; np[x] = prt[sx]; } }
    g.col[y] = nr; g.part[y] = np;
  }
}

/**
 * The figure from behind (portrait-facing's F1; A's ./back.js): the legs and the boots as the front draws them, the cargo
 * pockets and the holster on them, then the lower body mirrored about the middle (from behind his right thigh, the holster's, is at
 * the viewer's right: my call), then backParts from the waist up in place of the front's torso, arms and head, then the camouflage
 * over the lot (back.js adds the blouse's back, the arms and the cover to kit.camoParts). What is in the hands is in front of him and
 * hidden; a rifle in the hands or hanging in front shows as its sling, one on the back whole. The body's cues (sweat, grime, the
 * face's) are the front's: not drawn. Returns the parts' bounds the pose's bend needs and the back's anchors.
 */
function fromBehind(g, B, kit, Y) {
  const G = kit.gear, bare = kit.pt || kit.towel;
  const leg0 = g.add([], 0), L = legs(g, B, kit);
  if (!kit.suit && !bare) kit.camoParts.add(L.a).add(L.b);
  boots(g, B, kit);
  if (bare) overLegs(g, B, kit);
  if (!kit.suit && !bare) cargo(g, B, kit, L);
  const leg1 = g.add([], 0), hol0 = g.add([], 0);
  if (G && !G.painted && (G.pistol || G.thigh)) holster(g, B, kit, Y);
  const hol1 = g.add([], 0);
  // (mirrored about the legs' own middle, so they stand where the front's do: the columns' sum of the knee row's outer edges)
  const kr = Math.round(KNEE_Y * g.S), row = g.col[kr];
  let x0 = -1, x1 = -1;
  for (let x = 0; x < g.W; x++) if (row[x] !== null) { if (x0 < 0) x0 = x; x1 = x; }
  const sum = x0 < 0 ? g.W - 1 : x0 + x1;
  for (let y = 0; y < g.ROWS; y++) {
    const c = g.col[y], p = g.part[y], nc = Array(g.W).fill(null), np = Array(g.W).fill(0);
    for (let x = 0; x < g.W; x++) { const sx = sum - x; if (sx >= 0 && sx < g.W) { nc[x] = c[sx]; np[x] = p[sx]; } }
    g.col[y] = nc; g.part[y] = np;
  }
  // (the rifle as back.js reads it: in the hands, the sling across the back as at the ready; at the hip or across the knees, as slung in front)
  const R = G?.rifle;
  if (R && R.place !== 'back' && R.place !== 'front') kit.gear = { ...G, rifle: { ...R, place: RIFLE_IN_HANDS.includes(R.place) ? 'ready' : 'front' } };
  const backed = backParts(g, B, kit, Y);
  kit.gear = G;
  if (!kit.suit && !bare) camo(g, kit.camoParts, cloth(0x9a6a4a), kit.seed);
  return { leg0, leg1, hol0, hol1, backed };
}

// ---------- the backdrop ----------

const WALL = 0x383c4a, FLOOR = 0x2b2e3a, FLOOR_DARK = 0x1f2029;
function backdrop(x, y) {
  if (y < 118) return WALL;
  return Math.hypot((x - MID - 2) / 25, (y - FLOOR_Y - 0.5) / 4.2) < 1 ? FLOOR_DARK : FLOOR;
}

// ---------- the figure ----------

/** The kit a look puts on the doll (the sprites' look, src/art/figures/outfits.js, read for the doll), and the body's cues it shows. */
export function kitOf(look = {}, marks = {}, body = null) {
  const outfit = look.outfit ?? 'utilities', suit = outfit === 'vac' || outfit === 'vacOpen';
  const skin = SKIN[look.skin] ?? look.skin ?? SKIN.tan;
  const kit = {
    outfit, suit, skin, marks, camoParts: new Set(), glow: new Set(), late: [], seed: look.seed ?? 3,
    hair: { style: cutOf(look.hair?.style), color: HAIR[look.hair?.color] ?? look.hair?.color ?? HAIR.dark, step: Math.max(0, Math.min(3, Math.round(look.hair?.step ?? 0))) },
    handIds: [],
    top: 0x9a6a4a, legs: 0x9a6a4a, sleeve: 0x9a6a4a, boots: 0x9a7650, bloused: !suit, rank: outfit === 'nco' || !!look.rank,
    head: look.head === null ? null : suit ? { kind: outfit === 'vac' ? 'vac' : 'ring', color: 0xc8c0ae } : outfit === 'carrier' ? { kind: 'helmet', color: 0x5f6646 } : { kind: 'cover' },
    armour: outfit === 'carrier' ? { color: 0x545e40, pouch: 0x4a5236 } : null,
    shell: 0xc8c0ae, rings: 0x4c5262, pack: 0x7d776c, gloves: suit ? 0x4c5262 : null,
  };
  if (suit) { kit.legs = 0x3b4256; kit.sleeve = 0x3b4256; kit.boots = 0x5a6070; }
  // (a helmet candidate (look.helm, the helmet samples' only: samples/helmets, ./helmets.js) on the combat EVA suit: the suit as
  // the figures wear it, black (or the OPA's own colours), its shoulders' seam and the plate's edges in the faction's trim)
  // (else the game's helmet, helmets.js HELMET_DRAWN_AS through helmFor, the one place the figure and the doll read: none
  // until the user picks, so the doll is v0.0.19's to the pixel)
  const helmSpec = look.helm ?? (outfit === 'combatSuit' && !look.mask ? helmFor({ kind: look.unit ?? 'regular', faction: look.faction ?? 'mars' }) : null);
  const helm = outfit === 'combatSuit' && helmSpec ? helmOf(helmSpec) : null;
  if (helm) {
    const K = { ...COMBAT_SUIT, ...(helm.suit ?? {}) };
    Object.assign(kit, {
      suit: true, bloused: false, shell: K.shell, legs: K.skin, sleeve: K.skin, boots: K.boot, rings: K.ring, pack: K.pack, gloves: K.glove ?? K.ring,
      band: helm.trim ?? K.ring, trim: helm.trim, head: { kind: 'vac', color: helm.shell, helm }, armour: look.carrier ? { color: K.carrier, pouch: K.pouches } : null,
    });
  } else if (outfit === 'combatSuit') {
    // (0.0.18, the fix: the combat EVA suit is drawn whenever it is worn, v0.0.17 drew the utilities under it (8960 of 8960 pixels
    // the same). Black as the figures wear it, worn unpressurised with the visor down (kit.js CONTAINERS 'ces-1' visor): the sealed
    // helmet in the suit's shell, its glass COMBAT_SUIT.visor, whatever the roof (the indoor rule is a cover's, never a sealed helmet's))
    // (the gloves grey, outfits.js COMBAT_SUIT.glove: the user's "maybe gray gloves would be better for this color suit")
    const K = COMBAT_SUIT;
    Object.assign(kit, {
      suit: true, bloused: false, shell: K.shell, legs: K.skin, sleeve: K.skin, boots: K.boot, rings: K.ring, pack: K.pack, gloves: K.glove ?? K.ring,
      band: K.ring, head: { kind: 'vac', color: K.shell, visor: K.visor }, armour: look.carrier ? { color: K.carrier, pouch: K.pouches } : null,
    });
  }
  if (outfit === 'pt') Object.assign(kit, { pt: true, top: OXBLOOD, sleeve: OXBLOOD, legs: PT_GREY, boots: RUNNER, bloused: false, rank: false, head: null, bareLegs: true, bareArms: true });
  if (outfit === 'towel') Object.assign(kit, { towel: true, top: kit.skin, sleeve: kit.skin, legs: TOWEL, boots: SHOWER_SHOE, bloused: false, rank: false, head: null, bareLegs: true, bareArms: true });
  // (the body's cues: VIEWS §4.2, see the header)
  const cue = (k) => Math.max(0, Math.min(1, body?.[k] ?? 0));
  kit.cues = { wet: cue('wetK'), grime: cue('grimeK'), sweat: cue('sweatK'), stubble: cue('stubbleK'), tired: cue('tiredK'), bladder: cue('bladderK'), hunger: cue('hungerK'), hands: cue('handsK'), handsWhy: body?.handsWhy ?? null };
  if (kit.cues.wet > 0) kit.hair = { ...kit.hair, color: mix(kit.hair.color, 0x14151c, 0.18) };
  if (kit.cues.tired >= TIRED_SHOWS_K) kit.drop = 1;
  if (kit.cues.bladder >= BLADDER_SHOWS_K) { kit.knees = 1.6; kit.bendR = [4, 60]; }
  if (kit.cues.hunger >= HUNGER_SHOWS_K) kit.bendL = [3, 49];
  if (look.model) kit.model = look.model;                          // (the rifle's drawing: rifleIn)
  if (look.finish) kit.finish = look.finish;                       // (and its finish, src/data/finishes.js)
  return kit;
}

/**
 * The gear's arguments on the kit (0.0.18; ./dress.js dressOf makes them from the gear record): what is drawn, the rifle's model
 * and finish, the carrier on any outfit (the suit's black, the drab on the utilities), and the arms' bends while the hands are
 * on a weapon (they win over the body's cues: my call).
 */
export function dressKit(kit, gear) {
  kit.gear = gear;
  if (gear.rifle?.model) kit.model = gear.rifle.model;
  if (gear.rifle?.finish) kit.finish = gear.rifle.finish;
  if (gear.carrier && !kit.armour) kit.armour = kit.suit ? { color: COMBAT_SUIT.carrier, pouch: COMBAT_SUIT.pouches } : { color: 0x545e40, pouch: 0x4a5236 };
  if (!gear.carrier && kit.outfit !== 'carrier') kit.armour = null;
  const bends = gearBends(gear);
  if (bends) { kit.bendR = bends.bendR; kit.bendL = bends.bendL; }
}

/**
 * The close figure: a Pixmap (W × H at the scale, opaque: the backdrop and the figure on it, inked), with
 * .spots (each numbered wound's place, pixels) and .scale. { look (outfits.js's: outfit, skin, hair, rank,
 * head: null bare-headed), sex ('m'), marks (slots: see the header), hand ('rifle' or null), wounds
 * ({ wounds: [{ n, part, kind, bleed, dressed, stitched, spurt, plate }], tourniquets, splints, bloody }),
 * scale (DOLL_SCALE), gear (0.0.18: ./dress.js dressOf's DollGear, the pieces worn.js draws; none, the doll as before) }.
 */
export function doll({ look = {}, sex = 'm', marks = {}, hand = null, wounds: hurts = null, scale = DOLL_SCALE, body = null, outfit = null, gear = null, pose = 'stand', hold = null, facing = 'front', hang = undefined, bend: given = null } = {}) {
  const g = grid(scale, DROP), B = BODY[sex] ?? BODY.m, kit = kitOf(outfit ? { ...look, outfit } : look, marks, body);
  // (the parts of what the hands hold (worn.js), for the card's tones; the record's hold on the gear's places; the pose's
  // bend, the facing (from behind: A's back.js over the figure, no hands; side on: the head turned, F3))
  g.held = new Set();
  // (bend: a candidate's bend outright, POSE_BENDS' shape (samples/portrait-pose/poses.js); 'profile' (F2, a candidate only) is the
  // figure side on: the head turned its most, the body drawn narrower about its middle)
  let bend = given ?? POSE_BENDS[pose] ?? null;
  const back = facing === 'back', profile = facing === 'profile';
  let gear1 = gear && hold ? holdGear(gear, hold, { facing, ...(hang ? { hang } : {}) }) : gear;
  // (wedged, a boot under a rail on the deck, that knee bent: mag-boots' H-c's bend of the standing pose)
  if (!bend && gear1?.anchor === 'wedge') bend = ANCHOR_LOOKS.wedge.bend;
  if (gear1 && bend?.lap && gear1.rifle && RIFLE_IN_HANDS.includes(gear1.rifle.place)) gear1 = { ...gear1, rifle: { ...gear1.rifle, place: 'lap' } };
  if (gear1) dressKit(kit, gear1);
  if (bend?.arms && !back) { if (bend.arms.bendR) kit.bendR = [...bend.arms.bendR]; if (bend.arms.bendL) kit.bendL = [...bend.arms.bendL]; }
  if (facing === 'left' || facing === 'right') kit.turn = facing === 'left' ? -2 : 2;
  if (profile) kit.turn = 3;
  const G = kit.gear, Y = { BELT_Y, WAIST_Y };
  const bare = kit.pt || kit.towel;
  let leg0, leg1, hol0, hol1, backed = null;
  if (back) { ({ leg0, leg1, hol0, hol1, backed } = fromBehind(g, B, kit, Y)); if (G?.anchor) anchorParts(g, kit); }
  else {
    leg0 = g.add([], 0);
    const L = legs(g, B, kit);
    if (!kit.suit && !bare) kit.camoParts.add(L.a).add(L.b);
    boots(g, B, kit);
    if (bare) overLegs(g, B, kit);
    if (!kit.suit && !bare) cargo(g, B, kit, L);
    leg1 = g.add([], 0);
    // (0.0.18, the gear's pieces in their order: worn.js; without gear the doll is drawn as before)
    if (G?.rifle?.place === 'back') rifleAt(g, B, kit, 'back', MID);
    if (G?.devices?.length) backDevices(g, B, kit);
    if (kit.suit) shell(g, B, kit);
    else if (kit.pt) tee(g, B, kit);
    else if (kit.towel) (sex === 'f' ? towelChest : bareTorso)(g, B, kit);
    else { blouse(g, B, kit); rigBelt(g, B, kit); }
    if (G && kit.suit && (G.carrier?.pouches?.some(p => p.key === 'dump') || G.pistol || G.thigh)) suitBelt(g, B, kit, Y);
    if (kit.armour) carrier(g, B, kit);
    if (G && kit.armour) dumpPouch(g, B, kit, Y);
    if (G?.devices?.length && kit.armour) sideDevices(g, B, kit);
    hol0 = g.add([], 0);
    if (G && !G.painted && (G.pistol || G.thigh)) holster(g, B, kit, Y);
    hol1 = g.add([], 0);
    // (the rifle at any place but the back's and across the knees (drawn after the pose's bend); the pistol in the hands at its place)
    if (hand === 'rifle' || G?.rifle?.place === 'hand') rifleIn(g, B, kit);
    else if (G?.rifle && G.rifle.place !== 'back' && G.rifle.place !== 'lap') rifleAt(g, B, kit, G.rifle.place, MID);
    // (the board's pistol hanging from the hand and the low ready under the fists, as before; v0.0.23, held up at a stance (the high
    // ready, aimed, the admin) over the fists, the slide and the muzzle before the hands that hold it, so it reads)
    const under = (p) => p === 'hand' || p === 'ready';
    if (G?.pistol && under(G.pistol.place)) pistolAt(g, B, kit, G.pistol.place);
    if (G?.device) handDevice(g, B, kit, 'under');
    arms(g, B, kit);
    if (G?.pistol && !under(G.pistol.place) && PISTOL_IN_HANDS.includes(G.pistol.place)) pistolAt(g, B, kit, G.pistol.place);
    if (G) heldItem(g, B, kit);
    head(g, B, kit, look);
    if (kit.head?.kind !== 'vac') hair(g, kit);
    if (kit.head?.helm) dollHelm(g, B, kit, kit.head.helm);
    else hat(g, kit);
    if (G?.ears) earCups(g, kit);
    // (the anchor the gear names: the rail overhead his left fist holds, or the lanyard to its plate)
    if (G?.anchor) anchorParts(g, kit);
    if (!kit.suit && !bare) camo(g, kit.camoParts, cloth(0x9a6a4a), kit.seed);
    // (the body's marks, over the cloth and the skin, before the seams and the ink)
    const C = kit.cues;
    if (C.sweat > 0.05) sweatMarks(g, kit, C.sweat);
    if (C.grime > 0.05) grimeMarks(g, C.grime);
    if (C.hands > 0 && !kit.gloves) dirtyHands(g, kit, C.hands, C.handsWhy);
    if (C.stubble > 0.05 && kit.head?.kind !== 'vac') stubble(g, kit, C.stubble);
    if (C.tired >= TIRED_SHOWS_K && kit.head?.kind !== 'vac') tiredEyes(g, kit);
    if (C.wet > 0 && kit.head?.kind !== 'vac' && !kit.head) wetHair(g, kit);
  }
  // Where a part lies over an earlier one, its edge goes dark (before the marks: a seam mustn't cross a pocket's gold).
  const seams = [];
  for (let y = 0; y < g.ROWS; y++) for (let x = 0; x < g.W; x++) {
    const c = g.col[y][x], p = g.part[y][x];
    if (c === null || !p || y < g.edgeFrom[p] || kit.glow.has(p)) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1]]) {
      const q = g.part[y + dy]?.[x + dx];
      if (q && q < p && !g.quiet.has(q) && g.col[y + dy][x + dx] !== null) { seams.push([x, y, mix(c, INK, 0.55)]); break; }
    }
  }
  for (const [x, y, c] of seams) g.col[y][x] = c;
  for (const f of kit.late) f();                                   // (the slots' marks and the rank pins, over the seams)
  const spots = hurts && !back ? wounds(g, B, sex, hurts) : [];
  // (the pose's bend over the finished figure, seams, marks and wounds with it: the body's parts set down, the legs by
  // their parts resampled; a rifle across a sitting man's knees after it, at the knees' row; the wounds' places go down with the body)
  if (bend) {
    const legIds = new Set();
    for (let p = leg0 + 1; p < leg1; p++) legIds.add(p);
    for (let p = hol0 + 1; p < hol1; p++) legIds.add(p);
    bendPose(g, bend, legIds);
    if (bend.lap && G?.rifle?.place === 'lap' && !back) rifleAt(g, B, kit, 'lap', MID, (bend.legs?.r?.[2] ?? 104));
    if (G?.anchor === 'wedge') anchorParts(g, kit, 'rail');
    for (const o of spots) o.y += bend.drop ?? 0;
  }
  if (profile) squeeze(g, PROFILE_K);
  // Then the ink, round the lot, on the wall (the figure set down DROP reference rows).
  const W = g.W, drop = Math.round(DROP * scale), H = g.ROWS + drop, data = new Uint32Array(W * H);
  const at = (x, y) => (y - drop >= 0 && y - drop < g.ROWS && x >= 0 && x < W ? g.col[y - drop][x] : null);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = at(x, y);
    if (c !== null) { data[y * W + x] = word(c); continue; }
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) !== null);
    data[y * W + x] = word(edge ? INK : backdrop(x / scale, y / scale - DROP));
  }
  // (the held parts' pixels (the card tones them) and the anchors, both in the Pixmap's pixels; non-enumerable extras, so
  // a doll's record and its digests are as before)
  const held = new Uint8Array(W * H);
  if (g.held.size) for (let y = 0; y < g.ROWS; y++) for (let x = 0; x < W; x++) if (g.held.has(g.part[y][x]) && g.col[y][x] !== null) held[(y + drop) * W + x] = 1;
  const dy = (bend?.drop ?? 0);
  // (from behind, back.js's anchors (within a pixel of the front's: the marks land on the back where they land on the front))
  const ah = backed?.anchors?.head ?? [MID, HEAD_Y], aa = backed?.anchors?.aZone ?? [MID, A_ZONE_Y];
  const anchors = { head: [ah[0] * scale, (ah[1] + DROP + dy) * scale], aZone: [aa[0] * scale, (aa[1] + DROP + dy) * scale], drop: dy * scale };
  const out = { w: W, h: H, data, repeat: false, key: null, glows: false, scale, spots: spots.map(o => ({ ...o, x: Math.round(o.x * scale), y: Math.round((o.y + DROP) * scale) })) };
  Object.defineProperty(out, 'held', { value: held, enumerable: false });
  Object.defineProperty(out, 'anchors', { value: anchors, enumerable: false });
  Object.defineProperty(out, 'pose', { value: { pose, facing, hold: hold?.how ?? null }, enumerable: false });
  return out;
}

/** The backdrop at a pixel of the doll (for a frame round it), at a scale. */
export const backdropAt = (x, y, scale = DOLL_SCALE) => backdrop(x / scale, y / scale - DROP);
