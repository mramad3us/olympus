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
// Pure: it returns a Pixmap (src/art/paint.js words), opaque, the backdrop round the figure.
import { PX_PER_M } from '../../render/scale.js';
import { word } from '../paint.js';
import { SKIN, HAIR, valles } from '../figures/outfits.js';
import { shapeAt, turned } from '../figures/templates.js';
import { REF, INK, mix, lum, cloth, flesh, smooth, ribbon, edgeOf, grid, halo, TONES } from './grid.js';

/** The close figure's scale: the stage's density over tradecraft's 16 px/m (my call: the same size against the picture). */
export const DOLL_SCALE = PX_PER_M / 16;
const DROP = 2;                                                    // (drawn from row 0, then set down: air over the head, room for the ink)
const MID = REF.W / 2;
/** Doll pixels a centimetre at scale 1 (tradecraft's: 175 cm over 126 rows): what's held is drawn to its length. */
export const PX_PER_CM = 0.72;
const GOLD = 0xe7b84a, RUST = 0xe8896a;
const WAIST_Y = 52, BELT_Y = 58, CROTCH_Y = 72, KNEE_Y = 101, ANKLE_Y = 124, FLOOR_Y = 132;
const lf = (pts) => pts.map(([d, y]) => [MID - d, y]);
const rt = (pts) => pts.map(([d, y]) => [MID + d, y]);
const both = (pts) => [...lf(pts), ...rt(pts).reverse()];
const folds = (g, id, list, c) => { for (const [path, w] of list) g.on(id, g.scan(ribbon(path, w)), c); };

const BODY = {
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
  const T = cloth(kit.legs);
  const firm = [[0, BELT_Y], [B.hip, BELT_Y], [B.hip + 0.4, 66], [B.hip - 0.2, 82], [B.knee, KNEE_Y], [B.hem, ANKLE_Y + 1], [B.gap, ANKLE_Y + 1], [B.gap - 1, KNEE_Y], [0.5, 80], [0, CROTCH_Y]];
  const easy = [[0, BELT_Y], [B.hip, BELT_Y], [B.hip + 0.6, 66], [B.hip + 0.4, 82], [B.knee + 1, KNEE_Y], [B.hem + 1.8, ANKLE_Y + 1], [B.gap + 1, ANKLE_Y + 1], [B.gap, KNEE_Y], [0.5, 80], [0, CROTCH_Y]];
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

// ---------- the utility blouse, and the suit's shell ----------

function blouse(g, B, kit) {
  const T = cloth(kit.top), hem = 68, ease = 1.2;
  const shoulders = [[B.neck + 0.5, 25.6], [B.neck + 4.5, 28.5], [B.shoulder - 4, 30.6], [B.shoulder - 1, 33]];
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
function shell(g, B, kit) {
  // (the vac suit's hard torso: a shell over the skin from the collar to the waist ring, the Corps' red at the shoulders)
  const T = cloth(kit.shell), hem = BELT_Y + 2;
  const id = g.add(g.scan(both([[B.neck + 1.4, 25], [B.neck + 5, 27.6], [B.shoulder - 3, 29.6], [B.shoulder, 32.6], [B.chest + 1.6, 41], [B.waist + 1.6, WAIST_Y], [B.waist + 2, hem]])), T.base);
  g.on(id, g.scan(lf([[B.chest + 2, 41], [B.chest - 2, 30], [B.neck + 4, 27], [B.neck + 6, 31], [B.chest - 4, 34], [B.chest - 2, 42], [B.waist + 1, 50]])), T.soft);
  g.on(id, g.scan(smooth(rt([[B.neck + 3, 27], [B.chest - 5, 36], [B.chest - 3.4, 43], [B.waist - 3.6, WAIST_Y], [B.waist - 2, hem + 1], [B.hip + 9, hem + 1], [B.hip + 9, 27]]), 3)), T.shade);
  // (its plates' seams: across the chest, down the sides)
  g.on(id, g.rows(44, MID - 12, MID + 11), T.shade); g.on(id, g.rows(45, MID - 12, MID + 11), T.light);
  for (let y = 33; y < 44; y++) g.on(id, g.rows(y, MID, MID), T.shade);
  const red = cloth(0x9e3c36);
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
  const c = kit.sleeve, S = flesh(kit.skin), T = cloth(c), loose = kit.suit ? 0.1 : 0.4;
  const armpit = 40, cuffY = B.armIn[0][1];
  const out = B.armOut.map(([d, y], i) => [d + (i ? loose : 0), y]), inn = B.armIn.map(([d, y], i) => [d - (i < 4 ? loose * 0.5 : 0), y]);
  const across = (y) => [edgeOf(out, y), edgeOf([...inn].reverse(), y)];
  for (const [flat, far] of [[lf, 0], [rt, 1]]) {
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
    folds(g, id, [[side([[e + 3.4, 49.6], [e, 52], [e - 3.4, 51]]), 1.5], [side([[e + 3.4, 54], [e + 0.4, 56.4], [e - 3.4, 55]]), 1.5]], dark);
    if (!kit.suit) kit.camoParts.add(id);
    hands(g, B, flat, kit.gloves ? cloth(kit.gloves) : S, far, !!kit.gloves);
    if (kit.suit) {
      // (the shell's shoulder cap; the wrist's seal ring)
      const sh = cloth(kit.shell), red = cloth(0x9e3c36);
      const cap = g.add(g.scan(side(smooth([[out[0][0] - 1, 28.6], [out[2][0] + 0.8, 32], [out[3][0] + 0.8, 38], [inn.at(-1)[0] - 0.5, 38], [inn.at(-1)[0] - 1.5, 33]], 3))), far ? sh.base : sh.soft, armpit);
      g.on(cap, g.rows(36, 0, REF.W), far ? red.shade : red.base); g.on(cap, g.rows(37, 0, REF.W), red.deep);
      const R = cloth(kit.rings), [a, b] = across(cuffY - 1);
      g.over(g.scan(side([[a + 0.4, cuffY - 2 - far], [b - 0.4, cuffY - 2 - far], [b - 0.4, cuffY - far], [a + 0.4, cuffY - far]])), far ? R.base : R.light);
    } else g.on(id, g.rows(cuffY - 3 - far, 0, REF.W), T.deep);
  }
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
  g.on(face, g.scan(smooth([[MID + 5, 6], [MID + 6, 11], [MID + 5, 17], [MID + 3.4, 21], [MID, 25], [MID + 3, 27], [MID + 10, 22], [MID + 10, 8]], 3)), S.shade);
  g.on(face, g.scan(smooth([[MID - 6.4, 8.6], [MID - 2, 6.6], [MID + 1, 7], [MID - 3, 9], [MID - 6, 11.6]], 3)), S.light);
  g.on(face, g.scan(smooth([[MID - 6.8, 17], [MID - 5.4, 16.8], [MID - 5, 18.4], [MID - 6.4, 19]], 2)), S.soft);
  g.on(face, g.rows(25, MID - 3, MID + 2), S.shade); g.on(face, g.rows(24, MID + 1, MID + 3), S.shade);
  const hairC = kit.hair.color, brow = mix(hairC, S.deep, 0.15), lid = mix(0x2a1c18, S.deep, 0.25), white = mix(0xf6f4ee, kit.skin, 0.15), iris = 0x2a1c18;
  for (const [a, b] of [[MID - 6, MID - 3], [MID + 2, MID + 5]]) g.span(12, a, b, brow);
  g.put(MID - 6, 13, brow); g.put(MID + 5, 13, brow);
  for (const x0 of [MID - 6, MID + 3]) { g.span(14, x0, x0 + 2, lid); g.put(x0, 15, white); g.put(x0 + 1, 15, iris); g.put(x0 + 2, 15, white); }
  g.put(MID, 16, S.shade); g.put(MID, 17, S.shade); g.put(MID, 18, S.shade); g.put(MID - 1, 19, S.shade); g.put(MID, 19, S.deep); g.put(MID + 1, 19, S.shade); g.put(MID - 1, 18, S.light);
  g.span(22, MID - 2, MID + 1, S.deep); g.put(MID - 3, 22, S.shade); g.put(MID + 2, 22, S.shade); g.span(23, MID - 1, MID, S.shade);
  void look;
}
// (hair: a high and tight, the Corps' cut, or a short cut; drawn in clumps, its lit top, a dark where it turns)
function hair(g, kit) {
  const style = kit.hair.style, T = cloth(kit.hair.color);
  if (style === 'bald') return;
  const cap = style === 'short'
    ? [[23.6, 15], [23.2, 11], [24, 7.6], [26.6, 4.8], [31, 3.4], [36, 3.8], [39, 5.6], [40.6, 8.6], [40.8, 12], [40.2, 15], [39.2, 15], [38.8, 11.6], [36.6, 10.4], [33, 10.6], [29, 9.2], [26.8, 10.4], [25.6, 11.6], [24.8, 15]]
    : [[24.2, 12], [24, 9.6], [25.2, 7], [27.6, 5], [31, 4.2], [36, 4.4], [38.6, 5.8], [39.8, 8.4], [39.8, 12], [39.2, 12], [38.6, 9.6], [36.6, 8.6], [32, 8.4], [27.4, 8.8], [25.4, 9.8], [24.8, 12]];
  const id = g.add(g.scan(smooth(cap, 2)), T.base);
  g.on(id, g.scan(smooth([[26, 6.6], [30, 4.6], [34.6, 4.8], [31, 6.4], [27.6, 8.4]], 3)), T.light);
  g.on(id, g.scan(rt([[3.6, 2], [5.6, 8], [6, 14], [6.4, 24], [12, 24], [12, 2]])), T.shade);
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
    const T = cloth(h.color), V = 0x1b2541;
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
  g.on(plate, g.scan(lf([[0, top], [9.4, top], [12.2, top + 4], [12.4, foot], [10.6, foot], [10.6, top + 5], [8.4, top + 1.6], [0, top + 1.6]])), T.soft);
  g.on(plate, g.rows(top, 0, REF.W), T.light);
  g.on(plate, g.scan(rt([[2, top + 2], [8.4, top + 2], [11, top + 5], [11, foot], [2, foot]])), T.shade);
  g.on(plate, g.rows(foot - 1, 0, REF.W), T.deep);
  for (const y of [top + 9, top + 11]) for (let x = MID - 10; x <= MID + 9; x += 2) for (const [yy, x0] of g.rows(y, x, x)) if (g.part[yy]?.[x0] === plate) g.col[yy][x0] = T.deep;
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

/** A rifle hanging from the right hand (the viewer's left), muzzle down, drawn to its length. */
function rifleIn(g, B, kit) {
  const S = g.S, lenPx = Math.round(85 * PX_PER_CM * S), hx = (MID - B.hand) * S, hy = (B.armIn[0][1] + 3) * S;
  const shape = shapeAt('rifle', lenPx, 2.4 * S);
  // (lighter than the sprites' rifle: against the doll's dark wall gun metal would vanish)
  const C = { n: cloth(0x5c6270), u: cloth(0x2e313c), v: cloth(0xa0a8b4) };
  // (the grip in the fist: the butt above it, the barrel down past the knee)
  const grip = lenPx * 4.5 / 16, id = g.add([], 0);
  for (const [x, y, ch] of turned(shape, hx - 1, hy - grip, Math.PI / 2, false)) {
    const T = C[ch] ?? C.n, c = x > hx + 1.5 * S ? T.shade : ch === 'v' ? T.light : T.base;
    g.px(Math.round(x), Math.round(y), c, id);
  }
}

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

// ---------- the backdrop ----------

const WALL = 0x383c4a, FLOOR = 0x2b2e3a, FLOOR_DARK = 0x1f2029;
function backdrop(x, y) {
  if (y < 118) return WALL;
  return Math.hypot((x - MID - 2) / 25, (y - FLOOR_Y - 0.5) / 4.2) < 1 ? FLOOR_DARK : FLOOR;
}

// ---------- the figure ----------

/** The kit a look puts on the doll (the sprites' look, src/art/figures/outfits.js, read for the doll). */
function kitOf(look = {}, marks = {}) {
  const outfit = look.outfit ?? 'utilities', suit = outfit === 'vac' || outfit === 'vacOpen';
  const skin = SKIN[look.skin] ?? look.skin ?? SKIN.tan;
  const kit = {
    outfit, suit, skin, marks, camoParts: new Set(), glow: new Set(), late: [], seed: look.seed ?? 3,
    hair: { style: look.hair?.style ?? 'crew', color: HAIR[look.hair?.color] ?? look.hair?.color ?? HAIR.dark },
    top: 0x9a6a4a, legs: 0x9a6a4a, sleeve: 0x9a6a4a, boots: 0x9a7650, bloused: !suit, rank: outfit === 'nco' || !!look.rank,
    head: look.head === null ? null : suit ? { kind: outfit === 'vac' ? 'vac' : 'ring', color: 0xc8c0ae } : outfit === 'carrier' ? { kind: 'helmet', color: 0x5f6646 } : { kind: 'cover' },
    armour: outfit === 'carrier' ? { color: 0x545e40, pouch: 0x4a5236 } : null,
    shell: 0xc8c0ae, rings: 0x4c5262, pack: 0x7d776c, gloves: suit ? 0x4c5262 : null,
  };
  if (suit) { kit.legs = 0x3b4256; kit.sleeve = 0x3b4256; kit.boots = 0x5a6070; }
  return kit;
}

/**
 * The close figure: a Pixmap (W × H at the scale, opaque: the backdrop and the figure on it, inked), with
 * .spots (each numbered wound's place, pixels) and .scale. { look (outfits.js's: outfit, skin, hair, rank,
 * head: null bare-headed), sex ('m'), marks (slots: see the header), hand ('rifle' or null), wounds
 * ({ wounds: [{ n, part, kind, bleed, dressed, stitched, spurt, plate }], tourniquets, splints, bloody }),
 * scale (DOLL_SCALE) }.
 */
export function doll({ look = {}, sex = 'm', marks = {}, hand = null, wounds: hurts = null, scale = DOLL_SCALE } = {}) {
  const g = grid(scale, DROP), B = BODY[sex] ?? BODY.m, kit = kitOf(look, marks);
  const L = legs(g, B, kit);
  if (!kit.suit) kit.camoParts.add(L.a).add(L.b);
  boots(g, B, kit);
  if (!kit.suit) cargo(g, B, kit, L);
  if (kit.suit) shell(g, B, kit); else { blouse(g, B, kit); rigBelt(g, B, kit); }
  if (kit.armour) carrier(g, B, kit);
  if (hand === 'rifle') rifleIn(g, B, kit);
  arms(g, B, kit);
  head(g, B, kit, look);
  if (kit.head?.kind !== 'vac') hair(g, kit);
  hat(g, kit);
  if (!kit.suit) camo(g, kit.camoParts, cloth(0x9a6a4a), kit.seed);
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
  const spots = hurts ? wounds(g, B, sex, hurts) : [];
  // Then the ink, round the lot, on the wall (the figure set down DROP reference rows).
  const W = g.W, drop = Math.round(DROP * scale), H = g.ROWS + drop, data = new Uint32Array(W * H);
  const at = (x, y) => (y - drop >= 0 && y - drop < g.ROWS && x >= 0 && x < W ? g.col[y - drop][x] : null);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = at(x, y);
    if (c !== null) { data[y * W + x] = word(c); continue; }
    const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) !== null);
    data[y * W + x] = word(edge ? INK : backdrop(x / scale, y / scale - DROP));
  }
  return { w: W, h: H, data, repeat: false, key: null, glows: false, scale, spots: spots.map(o => ({ ...o, x: Math.round(o.x * scale), y: Math.round((o.y + DROP) * scale) })) };
}

/** The backdrop at a pixel of the doll (for a frame round it), at a scale. */
export const backdropAt = (x, y, scale = DOLL_SCALE) => backdrop(x / scale, y / scale - DROP);
