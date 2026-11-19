// OLYMPUS art: a sleeper in a rack, as the berth shows them. The blanket over the body, the head on the pillow.
//
// VIEWS §3.4's "sleep in a rack": lying under a blanket, the rack draws the blanket over the body and the
// sprite shows head and shoulder. In this projection a body lying head north is, in outline, a body
// standing (VIEWS §3.5), and the look round's sleepers read so (L5's couches, the build sheet's L5): an
// upright card cannot lie down. So a sleeper in a rack is drawn the way the rack's own bedding is
// (src/art/kit/quarters.js asleep()): flat on the mattress, its top seen from above and foreshortened as
// the floor is, which no eye reads as standing: the blanket drawn up to the shoulders with the body's
// ridge down it, the knees and the feet's hump at the foot, the sheet's collar turned over its edge, the
// pillow, and on it the head seen from above in the person's own hair and skin (0.0.6: the regulation
// cuts at their drawn step, hair.step: a man's top a patch on the crown, high and tight the smallest,
// medium regulation the largest, the scalp round it skin when fresh and then a shadow, a dark and the
// hair's colour as it grows out, the shaved head all scalp; a woman's short cut over the crown, longer a
// row a step; a bun's knob or a braid's band, with stray pixels out of regulation; a face turned aside),
// the shoulder of the arm on top. A drawn rack curtain (PLACES's
// "behind rack curtains") covers the berth: its fabric hangs from the rail in folds and the sleeper is
// not shown (perception sees them only within a metre, people's sightOf).
//
// paintSleeper(px, w, h, o) paints the berth top w × h pixels with the head at row 0 (the stage turns the
// quad for a head south, east or west): o { blanket, skin, hair: { style, color }, curtain (a colour, or
// null), seed, ppm }. sleeperKey(o) names the painting, so a squad of thirteen is thirteen small cells.
// 0.0.4 adds (VIEWS §3.4, §5.2's rack vignette):
//   - breath (0 or 1): the blanket's two-frame rise, the chest's ridge a pixel fuller and lit at 1; the
//     view alternates them at BREATH_HZ, so a sleeper breathes;
//   - up: the sleeper sat up (the time role's poseAt frame 'sitUp'): the blanket thrown back to the
//     waist, its sheet turned over, the pillow empty with the head's dent in it; the body's upper half is
//     then a figure's card standing on the mattress at the head end (src/render/view.js);
//   - curtainK (0..1): the curtain part drawn, from the aisle side (CURTAIN_MS: a curtain closing after a
//     sleeper lies down is seen closing), in CURTAIN_STEPS steps so a berth is a few cells, not one a frame.
// v0.0.25's burn polish (the user's score of test-burn, 2026-11-19: "No straped in animation, we just linger next to the bunk"):
//   - straps: a marine strapped into his rack (o.straps; test-burn's Strap in, actor.strapped) lies on top of the made rack in his
//     utilities (the Valles pattern at pixel scale, outfits.js valles), his arms at his sides, boots at the foot, with the rack's
//     three straps across him, at the chest, the hips and the knees: dark webbing over the body and the blanket from rail to rail,
//     a lit buckle at the middle of each, a ring at each rail (STRAP_C; my calls: no source draws a transport's rack harness).
// Pure.
import { tone, hash3, mixHex } from '../tone.js';
import { SKIN, HAIR, cutOf, SIDES_K, valles } from './outfits.js';

/** The racks' blankets (the kit's: src/art/kit/quarters.js), and the curtains' fabric. */
export const BLANKETS = Object.freeze({ olive: 0x4c633d, grey: 0x625854, tan: 0x96694f, red: 0x6e272f });
export const CURTAINS = Object.freeze({ olive: 0x5b6a44, grey: 0x6f735e, tan: 0x9c917a, navy: 0x3c4a64 });
const SHEET = 0xe1ccc0, PILLOW = 0xf4efe6, LINEN = 0xd6d0c9, PT = 0x8f96a6;
/** A berth's top as a sleeper lies on it, metres: across and along (inside the rack's frame, over its mattress). */
export const BERTH_M = Object.freeze([0.84, 1.92]);
/** A sleeper's breaths a second (VIEWS §3.4: the blanket's 2-frame rise at 0.2 Hz), and the curtain's steps. */
export const BREATH_HZ = 0.2, CURTAIN_STEPS = 4;

const colourOf = (v, table, dflt) => (typeof v === 'number' ? v : table[v] ?? dflt);
/** The name of a sleeper's painting (what the cells are cached by). */
export const sleeperKey = (o) => `sleeper:${o.blanket ?? 'olive'}:${o.skin ?? 'tan'}:${cutOf(o.hair?.style)}${o.hair?.step || ''}:${o.hair?.color ?? 'dark'}:${o.curtain ?? '-'}:${(o.seed ?? 0) % 4}:${o.breath ? 1 : 0}:${o.up ? 'u' : ''}:${curtainStep(o)}${o.straps ? ':s' : ''}`;
/** The rack's straps' webbing, its lit edge, the buckle and the rings at the rails (see the header). */
export const STRAP_C = Object.freeze({ web: 0x23252b, lit: 0x3d4049, buckle: 0xb9bcc4, ring: 0x8a909c });
/** Where the three straps cross a berth, as shares of its length from the head: the chest, the hips and the knees. */
export const STRAP_AT = Object.freeze([0.3, 0.52, 0.74]);
/** A man's top on the pillow, its radius as a share of the head's (0.0.6: high and tight the smallest patch; the shaved head none). */
export const CAP_K = Object.freeze({ highTight: 0.42, lowReg: 0.58, medReg: 0.74, shaved: 0 });
/** The curtain's step (0..CURTAIN_STEPS) for a berth: CURTAIN_STEPS when drawn and no curtainK is given. */
export const curtainStep = (o) => (!o.curtain ? 0 : o.curtainK === undefined || o.curtainK === null ? CURTAIN_STEPS : Math.max(0, Math.min(CURTAIN_STEPS, Math.round(o.curtainK * CURTAIN_STEPS))));

/** Paint a berth's top with its sleeper (see the header), the head at row 0. */
export function paintSleeper(px, w, h, o = {}) {
  const ppm = o.ppm ?? 16, k = ppm / 16, seed = o.seed ?? 0, cs = curtainStep(o);
  if (cs >= CURTAIN_STEPS) { curtainTop(px, w, h, colourOf(o.curtain, CURTAINS, CURTAINS.olive), seed, k); return; }
  if (o.straps) { strappedIn(px, w, h, o, ppm, k, seed); return; }
  if (o.up) { sleeperUp(px, w, h, o, ppm, k, seed); }
  else sleeperDown(px, w, h, o, ppm, k, seed);
  // (a curtain part drawn: its fabric over the berth from the aisle side, the rest still open)
  if (cs > 0) { const cw = Math.round(w * cs / CURTAIN_STEPS), c = colourOf(o.curtain, CURTAINS, CURTAINS.olive); curtainTop((x, y, ww, hh, col) => { if (x < cw) px(x, y, Math.min(ww, cw - x), hh, col); }, cw, h, c, seed, k); px(cw, 0, 1, h, tone(c, -0.16)); }
}

/** The sleeper sat up: the blanket thrown back to the waist and its sheet turned over, the pillow empty, dented. */
function sleeperUp(px, w, h, o, ppm, k, seed) {
  const b = colourOf(o.blanket, BLANKETS, BLANKETS.olive);
  const pillow = Math.max(4, Math.round(0.34 * ppm)), waist = Math.round(h * 0.42);
  px(0, 0, w, waist, SHEET); px(0, pillow, w, 1, tone(LINEN, -0.05));
  px(0, 0, w, pillow + 1, PILLOW); px(1, Math.floor(pillow / 2), w - 2, 1, tone(PILLOW, -0.04));
  const cx = w / 2 + ((seed % 3) - 1) * w * 0.07;
  px(Math.round(cx - 0.12 * ppm), Math.round(pillow * 0.35), Math.round(0.24 * ppm), Math.max(1, Math.round(pillow * 0.4)), tone(PILLOW, -0.07));   // (the head's dent)
  for (let j = pillow + 2; j < waist; j += Math.max(2, Math.round(3 * k))) px(1, j, w - 2, 1, tone(SHEET, -0.04));   // (the sheet's creases where the body lay)
  for (let j = waist; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, (i + 2 * j) % 5 === 0 ? tone(b, -0.03) : b);
  // (the blanket's thrown-back fold: a doubled roll across the waist, lit on its top, the legs' ridge below)
  px(0, waist, w, Math.max(2, Math.round(2 * k)), tone(b, 0.08)); px(0, waist + Math.max(2, Math.round(2 * k)), w, 1, tone(b, -0.14));
  for (let j = waist + 3; j < h - 1; j++) { const half = w * 0.22; px(Math.round(cx - half), j, 1, 1, tone(b, 0.07)); px(Math.round(cx + half), j, 1, 1, tone(b, -0.1)); }
  px(Math.round(cx - w * 0.2), h - Math.max(3, Math.round(0.2 * ppm)), Math.round(w * 0.4), Math.max(1, Math.round(k)), tone(b, 0.06));
}

/** The sleeper lying under the blanket (0.0.3's), breathing: the chest's ridge a pixel fuller at breath 1. */
function sleeperDown(px, w, h, o, ppm, k, seed) {
  const b = colourOf(o.blanket, BLANKETS, BLANKETS.olive), skin = colourOf(o.skin, SKIN, SKIN.tan);
  const hair = colourOf(o.hair?.color, HAIR, HAIR.dark), style = cutOf(o.hair?.style), step = Math.max(0, Math.min(3, o.hair?.step ?? 0));
  const pillow = Math.max(4, Math.round(0.34 * ppm)), collar = pillow + Math.max(2, Math.round(0.16 * ppm));
  const lean = ((seed % 3) - 1) * w * 0.07, cx = w / 2 + lean;
  // (the pillow at the head of the berth, its seam)
  px(0, 0, w, pillow + 1, PILLOW); px(0, pillow, w, 1, tone(LINEN, -0.05)); px(1, Math.floor(pillow / 2), w - 2, 1, tone(PILLOW, -0.04));
  // (the blanket from the collar down: wool woven a pixel a row; the body's ridge, the knees, the feet's hump)
  for (let j = collar; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, (i + 2 * j) % 5 === 0 ? tone(b, -0.03) : b);
  for (let j = collar; j < h - 1; j++) {
    const t = (j - collar) / Math.max(1, h - collar), chest = o.breath && t > 0.04 && t < 0.3 ? 1 : 0;
    const half = w * (t < 0.15 ? 0.38 : t < 0.55 ? 0.33 - t * 0.12 : 0.24 - (t - 0.55) * 0.18);
    const l = Math.round(cx - half), r = Math.round(cx + half);
    // (breathing in: the chest's lit ridge a pixel wider, the blanket over it lifted into the light)
    px(l, j, 1, 1, tone(b, 0.08)); px(l + 1, j, Math.max(1, Math.round(half * 0.5)) + chest, 1, tone(b, 0.035 + chest * 0.025));
    px(r, j, 1, 1, tone(b, -0.12)); px(r - 1, j, 1, 1, tone(b, -0.05));
  }
  const knee = collar + Math.round((h - collar) * 0.62), feet = h - Math.max(3, Math.round(0.2 * ppm));
  px(Math.round(cx - w * 0.18), knee, Math.round(w * 0.36), 1, tone(b, 0.07));
  px(Math.round(cx - w * 0.2), feet, Math.round(w * 0.4), Math.max(1, Math.round(k)), tone(b, 0.06));
  px(Math.round(cx - w * 0.2), feet + Math.max(1, Math.round(k)), Math.round(w * 0.4), 1, tone(b, -0.1));
  // (the sheet's collar turned down over the blanket's edge, and the shoulder of the arm on top in the PT shirt)
  px(0, collar - Math.max(2, Math.round(0.1 * ppm)), w, Math.max(2, Math.round(0.1 * ppm)), SHEET); px(0, collar, w, 1, tone(b, 0.08));
  const sh = Math.max(2, Math.round(0.12 * ppm)), sx = Math.round(cx + (seed % 2 ? 1 : -1) * w * 0.12 - sh);
  px(sx, collar - sh, sh * 2, sh, PT); px(sx, collar - sh, sh * 2, 1, tone(PT, 0.08));
  // (the head on the pillow, the figures' own size (a chibi's head is a big one: a small realistic head
  // read as a stain on the pillow), inked round as the figures are: its hair by cut over the crown, the
  // face below with its eyes shut, an ear on the side it is turned from)
  const hcx = cx + (seed % 2 ? -1 : 1) * w * 0.03, rx = Math.max(2.6, 0.155 * ppm), ry = Math.max(2.6, 0.145 * ppm), hcy = Math.min(pillow * 0.55, ry + 1);
  // (a man's cut: the top a patch on the crown (CAP_K, a pixel wider out of regulation), the scalp round it by the step's
  // tone; a woman's: the hair over the crown to its line, a short cut's line a row lower a step)
  const men = CAP_K[style] !== undefined, side = mixHex(skin, hair, SIDES_K[step]);
  const capR = (CAP_K[style] ?? 0) * Math.min(rx, ry) + (step >= 3 && CAP_K[style] ? 1 : 0), capY = hcy - ry * 0.42;
  const hairLine = hcy - ry * (men ? 0.1 : style === 'bun' || style === 'braid' ? -0.05 : 0.1 - (style === 'short' ? 0.08 * step : 0));
  for (let j = Math.floor(hcy - ry) - 1; j <= Math.ceil(hcy + ry) + 1; j++) for (let i = Math.floor(hcx - rx) - 1; i <= Math.ceil(hcx + rx) + 1; i++) {
    const a = (i + 0.5 - hcx) / rx, c = (j + 0.5 - hcy) / ry, d = a * a + c * c;
    if (d > 1) { const a2 = (i + 0.5 - hcx) / (rx + 1), c2 = (j + 0.5 - hcy) / (ry + 1); if (a2 * a2 + c2 * c2 <= 1) px(i, j, 1, 1, 0x1a1214); continue; }
    const scalp = j + 0.5 < hairLine || (Math.abs(a) > 0.82 && c < 0.3);
    let col = c > 0.62 ? tone(skin, -0.08) : skin;
    if (scalp && men) {
      const inCap = capR > 0 && Math.hypot(i + 0.5 - hcx, j + 0.5 - capY) <= capR;
      col = inCap ? (style === 'medReg' && (i + j) % 2 ? tone(hair, 0.05) : hair) : step ? side : col;
      if (inCap && c < -0.7) col = tone(hair, -0.08);
    } else if (scalp) {
      col = style === 'braid' && Math.abs(c + 0.55) < 0.12 ? ((i + j) % 2 ? tone(hair, -0.12) : tone(hair, 0.06)) : hair;   // (a braid's band across the crown)
      if (c < -0.7) col = tone(hair, -0.08);
    }
    px(i, j, 1, 1, col);
  }
  const ey = Math.round(hcy + ry * 0.2), ex = Math.max(1, Math.round(rx * 0.42));
  px(Math.round(hcx) - ex, ey, Math.max(1, Math.round(k)), 1, tone(skin, -0.3)); px(Math.round(hcx) + ex - Math.max(1, Math.round(k)) + 1, ey, Math.max(1, Math.round(k)), 1, tone(skin, -0.3));
  if (style === 'bun') { const bx = Math.round(hcx), by = Math.round(hcy - ry) - 1; px(bx - 1, by - 1, 3, 2, hair); px(bx - 1, by - 1, 3, 1, tone(hair, 0.08)); }
  // (out of regulation, pinned-up hair works loose: stray pixels at the temples)
  if ((style === 'bun' || style === 'braid') && step >= 3) { px(Math.round(hcx - rx) - 1, Math.round(hcy - ry * 0.1), 1, 1, hair); px(Math.round(hcx + rx), Math.round(hcy), 1, 1, hair); }
  px(Math.round(hcx - rx), Math.round(hcy + ry) + 2, Math.round(rx * 2), 1, tone(PILLOW, -0.07));   // (the pillow's dent under the head)
}

/** A marine strapped in on the made rack in utilities, the straps across him (see the header). */
function strappedIn(px, w, h, o, ppm, k, seed) {
  const b = colourOf(o.blanket, BLANKETS, BLANKETS.olive), skin = colourOf(o.skin, SKIN, SKIN.tan), hair = colourOf(o.hair?.color, HAIR, HAIR.dark);
  const pillow = Math.max(4, Math.round(0.34 * ppm)), cx = w / 2;
  // (the made rack: the blanket flat and tucked, its fold at the head, the pillow)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, (i + 2 * j) % 5 === 0 ? tone(b, -0.03) : b);
  px(0, pillow + 1, w, Math.max(2, Math.round(0.08 * ppm)), SHEET);
  px(0, 0, w, pillow + 1, PILLOW); px(0, pillow, w, 1, tone(LINEN, -0.05));
  // (the body on top in its utilities: the shoulders and the chest, the arms at the sides, the legs, the boots at the foot)
  const top = Math.round(pillow * 0.75), foot = h - Math.max(3, Math.round(0.16 * ppm));
  const halfAt = (t) => w * (t < 0.08 ? 0.3 : t < 0.42 ? 0.36 : t < 0.55 ? 0.3 : 0.24 - (t - 0.55) * 0.12);
  for (let j = top; j < foot; j++) {
    const t = (j - top) / Math.max(1, foot - top), half = halfAt(t), l = Math.round(cx - half), r = Math.round(cx + half);
    for (let i = l; i <= r; i++) px(i, j, 1, 1, tone(valles(i, j, ppm, seed + 7), i === l ? 0.06 : i === r ? -0.12 : 0));
    if (t > 0.42) px(Math.round(cx), j, 1, 1, tone(valles(Math.round(cx), j, ppm, seed + 7), -0.16));   // (between the legs)
    if (t > 0.06 && t < 0.42) { px(l - 1, j, 1, 1, 0x1a1214); px(r + 1, j, 1, 1, 0x1a1214); }   // (the arms' outer edge, inked)
  }
  for (const sx of [-1, 1]) px(Math.round(cx + sx * w * 0.13 - (sx < 0 ? w * 0.1 : 0)), foot, Math.round(w * 0.1), Math.max(2, Math.round(0.12 * ppm)), 0x6b4a32);   // (the boots)
  // (the head on the pillow, face up: hair round the crown, the face below)
  const rx = Math.max(2.6, 0.15 * ppm), ry = Math.max(2.6, 0.14 * ppm), hcy = Math.min(pillow * 0.5, ry + 1);
  for (let j = Math.floor(hcy - ry) - 1; j <= Math.ceil(hcy + ry) + 1; j++) for (let i = Math.floor(cx - rx) - 1; i <= Math.ceil(cx + rx) + 1; i++) {
    const a = (i + 0.5 - cx) / rx, c = (j + 0.5 - hcy) / ry, d = a * a + c * c;
    if (d > 1) { const a2 = (i + 0.5 - cx) / (rx + 1), c2 = (j + 0.5 - hcy) / (ry + 1); if (a2 * a2 + c2 * c2 <= 1) px(i, j, 1, 1, 0x1a1214); continue; }
    px(i, j, 1, 1, c < -0.2 ? hair : c > 0.62 ? tone(skin, -0.08) : skin);
  }
  const ey = Math.round(hcy + ry * 0.2), ex = Math.max(1, Math.round(rx * 0.42));
  px(Math.round(cx) - ex, ey, 1, 1, 0x1a1214); px(Math.round(cx) + ex - 1, ey, 1, 1, 0x1a1214);   // (eyes open: awake, strapped in)
  // (the three straps, rail to rail across the body and the blanket, a lit buckle in the middle and a ring at each rail)
  const sw = Math.max(2, Math.round(0.08 * ppm));
  for (const at of STRAP_AT) {
    const y = Math.round(top + (foot - top) * at);
    px(0, y, w, sw, STRAP_C.web); px(0, y, w, 1, STRAP_C.lit);
    const bw = Math.max(2, Math.round(0.1 * ppm));
    px(Math.round(cx - bw / 2), y - 1, bw, sw + 2, STRAP_C.buckle); px(Math.round(cx - bw / 2) + 1, y, Math.max(1, bw - 2), sw, tone(STRAP_C.buckle, -0.3));
    px(0, y - 1, 1, sw + 2, STRAP_C.ring); px(w - 1, y - 1, 1, sw + 2, STRAP_C.ring);
  }
  void k;
}

/** A drawn curtain over a berth: the fabric hanging in folds from its rail at the head, its hem at the foot. */
function curtainTop(px, w, h, c, seed, k) {
  const fold = Math.max(3, Math.round(3 * k));
  for (let i = 0; i < w; i++) {
    const p = (i + seed) % fold, cc = p === 0 ? tone(c, -0.1) : p === 1 ? tone(c, 0.05) : c;
    px(i, 0, 1, h, cc);
  }
  px(0, 0, w, Math.max(1, Math.round(k)), 0x7c7f86); px(0, Math.max(1, Math.round(k)), w, 1, tone(c, -0.14));   // (the rail and the curtain's heading)
  for (let i = 0; i < w; i += Math.max(4, Math.round(5 * k))) px(i, 0, 1, Math.max(1, Math.round(k)), 0xb7b0a8);   // (its rings)
  px(0, h - 1, w, 1, tone(c, -0.08));
}
