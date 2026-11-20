// OLYMPUS art: the near band's hand-placed holds, pixel templates written as string grids (v0.0.28, the art director's pass 3).
//
// The user, 2026-11-20, of the portrait cards: "I need you to be serious about this ... please, make an effort for quality." Two
// passes drew the holds aimed at you as chains of tubes and boxes (./held.js), and the art director's verdict on the second
// (.run/v028/picks/judge-2.md) was that procedure had not got there: "a photographer with a camera", "hands to the mouth", "praying
// hands", because depth was not drawn (the nearest things, the muzzle and the support hand, larger and a little lower; the forearms
// foreshortened toward you) and the arms were planks of another material. Its recommendation, taken here: the holds that carry the
// card's reading are painted by hand, one pixel at a time, as a pixel artist would, at the near band (the card's 96 px a metre,
// the doll's scale TPL_S), and written in the module as rows of letters (code, no image file). A letter is a role, not a colour, so
// one template dresses every man:
//   - the sleeve's five tones (A light, B half lit, C base, D shade, E deep: cloth(kit.sleeve), or the skin's on bare arms), added to
//     the camouflage's parts so the arm wears the same pattern as the shoulder it hangs from (the judge's fault 1: "one garment, one
//     treatment"); the form is carried by the outline and the shade edge, not by a third flat strip;
//   - the hand's (h light, i half lit, j base, k shade, l deep: the glove's, lifted to a clear grey on the black suit, or the skin's);
//   - the gun's polymer (1 to 5, the weapon card's lit to dark), the muzzle's steel (s glint, t steel, u dark steel), the bore (x), the
//     sight's glass (g lit, G deep, * glint), the P-12's slide in lit steel (6 to 9);
//   - o the outline: drawn only where something lies under it (on the empty ground the figure's own ink falls on the same pixel), so a
//     hold never doubles the silhouette's line; '.' leaves what is under it.
// A template's grid is the near band's target pixels; at another scale each target pixel takes the letter that covers most of its
// box in the template, the outline, the bore and the glints weighted up (WEIGHT) so the thin dark lines and the ring's hole survive at
// 14 m and 30 m (the bands are taken from the one drawing, never drawn three times). Every template's parts are out of the doll's
// seams (their lines are the template's own). Pure but the memo of the resampled grids.
import { cloth, flesh, mix, lum, INK } from './grid.js';
import { GUN_C } from './held.js';

/** The template's own scale (the near band's: 96 card px a metre over the doll's 72 at scale 1). */
export const TPL_S = 96 / 72;
/** A letter's weight when a smaller scale chooses between the letters under one target pixel (thin lines and holes kept). */
export const WEIGHT = Object.freeze({ o: 1.7, x: 2.2, '*': 2.2, s: 1.6, h: 1.2, '.': 0.8 });
/** The roles: which part a letter is drawn in (sleeve, hand, gun) and its tone. */
const ROLE = (() => {
  const r = {};
  [...'ABCDE'].forEach((c, i) => { r[c] = ['sleeve', i]; });
  [...'hijkl'].forEach((c, i) => { r[c] = ['hand', i]; });
  [...'12345'].forEach((c, i) => { r[c] = ['gun', i]; });
  [...'6789'].forEach((c, i) => { r[c] = ['slide', i]; });
  [...'pqrvw'].forEach((c, i) => { r[c] = ['skin', i]; });
  [...'HIJK'].forEach((c, i) => { r[c] = ['hair', i]; });
  Object.assign(r, { m: ['mask', 0], n: ['mask', 1], M: ['mask', 2], N: ['mask', 3], z: ['mask', 4], S: ['mask', 5], L: ['mask', 6], y: ['mask', 7], Y: ['mask', 8] });
  Object.assign(r, { s: ['steel', 0], t: ['steel', 1], u: ['steel', 2], x: ['bore', 0], g: ['glass', 0], G: ['glass', 1], '*': ['glass', 2], o: ['ink', 0] });
  return Object.freeze(r);
})();
const TONE_KEYS = ['light', 'soft', 'base', 'shade', 'deep'];
/** The slide's lit steel (the P-12's on a card: lighter than anything on the chest, so the pistol carries the high ready's card). */
export const SLIDE_C = Object.freeze([0xc4cad4, 0x969ea9, 0x6c737e, 0x454a54]);
/** The glove's lift on a dark suit (the judge's C7: a fist reads at a mean lum of 140 and over on the black suit). */
export const GLOVE_TO = 0xb4bac4;

/** The force-on-force mask's colours side on (side.js maskSide's): its frame, its lower shell lit, base and in shade, a vent, the
 * strap (a step lighter than black hair, so it reads as a strap, not a blindfold), the lens and the lens over the eye, the eye. */
export const MASK_C = Object.freeze([0x24262d, 0x5e6370, 0x3a3d46, 0x26282f, 0x121318, 0x5a5e68, 0x7fa6c2, 0x4d6f92, 0x1a1414]);
/** A sleeve darker than this (lum of 255) is drawn a step toward the light. */
export const SLEEVE_LIFT_BELOW = 70;
/** The ramps a template is drawn in for a man (kit: doll.js kitOf's). */
export function rampsOf(kit) {
  const skin = flesh(kit.skin), sleeve = kit.bareArms ? skin : cloth(kit.sleeve);
  // (a dark sleeve (the combat suit's) a step toward the light, or the arms are lines on a black chest: the judge's PS-c)
  const S5 = TONE_KEYS.map(k => sleeve[k]), sl = lum(sleeve.base) < SLEEVE_LIFT_BELOW ? [S5[0], mix(S5[0], S5[1], 0.5), S5[1], S5[2], S5[3]] : S5;
  let hand = skin;
  if (kit.gloves) hand = cloth(lum(kit.gloves) < 110 ? mix(kit.gloves, GLOVE_TO, 0.62) : kit.gloves);
  return {
    sleeve: sl, hand: TONE_KEYS.map(k => hand[k]), skin: TONE_KEYS.map(k => skin[k]), hair: hairOf(kit, skin), mask: MASK_C,
    gun: [GUN_C.light, GUN_C.soft, GUN_C.base, GUN_C.shade, GUN_C.deep], slide: SLIDE_C,
    steel: [GUN_C.glint, GUN_C.steel, GUN_C.steelD], bore: [INK], glass: [GUN_C.glassL, GUN_C.glass, GUN_C.glint], ink: [INK],
  };
}

/** The hair's tones (its lit edge, its base, its shade) and the cut's short sides: the hair over the skin, a stubble's tone. */
function hairOf(kit, skin) {
  const H = cloth(kit.hair?.color ?? 0x2a2420);
  return [H.soft, H.base, H.shade, mix(H.shade, skin.shade, 0.3)];
}
/** A template: { rows: [string] (the near band's pixels), at: [x, y] (reference: its top-left from the doll's middle and row 0) }. */
const GRIDS = new Map();
/** The template's letters at scale S: an array of rows of letters, the top-left's target pixel. Memoised. */
export function gridAt(T, S) {
  const key = `${T.id}|${S}`, hit = GRIDS.get(key);
  if (hit) return hit;
  const H = T.rows.length, W = Math.max(...T.rows.map(r => r.length)), at = (x, y) => (y >= 0 && y < H && x >= 0 && x < T.rows[y].length ? T.rows[y][x] : '.');
  let out;
  if (Math.abs(S - TPL_S) < 1e-9) out = T.rows.map(r => r.padEnd(W, '.'));
  else {
    // (each target pixel's box in the template's pixels; the letter covering the most of it, by weight)
    const k = TPL_S / S, w = Math.ceil(W / k), h = Math.ceil(H / k);
    out = [];
    for (let y = 0; y < h; y++) {
      let row = '';
      for (let x = 0; x < w; x++) {
        const n = new Map(), x0 = x * k, x1 = (x + 1) * k, y0 = y * k, y1 = (y + 1) * k;
        for (let ty = Math.floor(y0); ty < Math.ceil(y1); ty++) for (let tx = Math.floor(x0); tx < Math.ceil(x1); tx++) {
          const cov = (Math.min(x1, tx + 1) - Math.max(x0, tx)) * (Math.min(y1, ty + 1) - Math.max(y0, ty));
          if (cov <= 0) continue;
          const c = at(tx, ty);
          n.set(c, (n.get(c) ?? 0) + cov * (WEIGHT[c] ?? 1));
        }
        let best = '.', bw = -1;
        for (const [c, v] of n) if (v > bw) { bw = v; best = c; }
        row += best;
      }
      out.push(row);
    }
  }
  if (GRIDS.size > 96) GRIDS.clear();
  GRIDS.set(key, out);
  return out;
}

/**
 * A template drawn on the doll's grid (grid.js) at its scale, flipped across when flip (about the doll's middle), its parts new: the
 * sleeve's in the camouflage's parts and the forearms', the hand's in the hands', the gun's among what the hands hold. Returns
 * { sleeve, hand, gun } (the part ids) and the drawn pixels' count.
 */
export function stamp(g, kit, T, { flip = false, dx = 0, dy = 0 } = {}) {
  const S = g.S, rows = gridAt(T, S), R = rampsOf(kit), ids = {}, MIDp = g.MID * S;
  const idOf = (role) => {
    const key = role === 'slide' || role === 'steel' || role === 'bore' || role === 'glass' ? 'gun' : role === 'skin' || role === 'hair' || role === 'mask' ? 'head' : role;
    if (!ids[key]) {
      ids[key] = g.add([], 0);
      g.edgeFrom[ids[key]] = 1e9;
      if (key === 'sleeve') { if (!kit.suit && !kit.bareArms && !kit.plain) kit.camoParts?.add(ids[key]); kit.foreIds?.push(ids[key]); }
      if (key === 'hand') kit.handIds?.push(ids[key]);
      if (key === 'gun') g.held?.add(ids[key]);
    }
    return ids[key];
  };
  // (the outline last: it belongs to whatever it lies on, the template's part under it or the body's)
  const x0 = Math.round((g.MID + T.at[0] + dx) * S), y0 = Math.round((T.at[1] + dy) * S), inks = [];
  let n = 0;
  rows.forEach((row, y) => {
    for (let i = 0; i < row.length; i++) {
      const c = row[i], r = ROLE[c];
      if (!r) continue;
      const x = flip ? Math.round(2 * MIDp - 1 - (x0 + i)) : x0 + i, yy = y0 + y;
      if (r[0] === 'ink') { inks.push([x, yy]); continue; }
      g.px(x, yy, R[r[0]][r[1]], idOf(r[0]));
      n++;
    }
  });
  for (const [x, y] of inks) if (g.col[y]?.[x] !== null && g.col[y]?.[x] !== undefined) { g.col[y][x] = INK; n++; }
  return { ...ids, n };
}
