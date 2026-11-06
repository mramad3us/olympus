// OLYMPUS art: a sleeper in a rack, as the berth shows them. The blanket over the body, the head on the pillow.
//
// VIEWS §3.4's "sleep in a rack": lying under a blanket, the rack draws the blanket over the body and the
// sprite shows head and shoulder. In this projection a body lying head north is, in outline, a body
// standing (VIEWS §3.5), and the look round's sleepers read so (L5's couches, the build sheet's L5): an
// upright card cannot lie down. So a sleeper in a rack is drawn the way the rack's own bedding is
// (src/art/kit/quarters.js asleep()): flat on the mattress, its top seen from above and foreshortened as
// the floor is, which no eye reads as standing: the blanket drawn up to the shoulders with the body's
// ridge down it, the knees and the feet's hump at the foot, the sheet's collar turned over its edge, the
// pillow, and on it the head seen from above in the person's own hair and skin (crew, short and bun
// cuts, bald; a face turned aside), the shoulder of the arm on top. A drawn rack curtain (PLACES's
// "behind rack curtains") covers the berth: its fabric hangs from the rail in folds and the sleeper is
// not shown (perception sees them only within a metre, people's sightOf).
//
// paintSleeper(px, w, h, o) paints the berth top w × h pixels with the head at row 0 (the stage turns the
// quad for a head south, east or west): o { blanket, skin, hair: { style, color }, curtain (a colour, or
// null), seed, ppm }. sleeperKey(o) names the painting, so a squad of thirteen is thirteen small cells.
// Pure.
import { tone, hash3 } from '../tone.js';
import { SKIN, HAIR } from './outfits.js';

/** The racks' blankets (the kit's: src/art/kit/quarters.js), and the curtains' fabric. */
export const BLANKETS = Object.freeze({ olive: 0x4c633d, grey: 0x625854, tan: 0x96694f, red: 0x6e272f });
export const CURTAINS = Object.freeze({ olive: 0x5b6a44, grey: 0x6f735e, tan: 0x9c917a, navy: 0x3c4a64 });
const SHEET = 0xe1ccc0, PILLOW = 0xf4efe6, LINEN = 0xd6d0c9, PT = 0x8f96a6;
/** A berth's top as a sleeper lies on it, metres: across and along (inside the rack's frame, over its mattress). */
export const BERTH_M = Object.freeze([0.84, 1.92]);

const colourOf = (v, table, dflt) => (typeof v === 'number' ? v : table[v] ?? dflt);
/** The name of a sleeper's painting (what the cells are cached by). */
export const sleeperKey = (o) => `sleeper:${o.blanket ?? 'olive'}:${o.skin ?? 'tan'}:${o.hair?.style ?? 'crew'}:${o.hair?.color ?? 'dark'}:${o.curtain ?? '-'}:${(o.seed ?? 0) % 4}`;

/** Paint a berth's top with its sleeper (see the header), the head at row 0. */
export function paintSleeper(px, w, h, o = {}) {
  const ppm = o.ppm ?? 16, k = ppm / 16, seed = o.seed ?? 0;
  if (o.curtain) { curtainTop(px, w, h, colourOf(o.curtain, CURTAINS, CURTAINS.olive), seed, k); return; }
  const b = colourOf(o.blanket, BLANKETS, BLANKETS.olive), skin = colourOf(o.skin, SKIN, SKIN.tan);
  const hair = colourOf(o.hair?.color, HAIR, HAIR.dark), style = o.hair?.style ?? 'crew';
  const pillow = Math.max(4, Math.round(0.34 * ppm)), collar = pillow + Math.max(2, Math.round(0.16 * ppm));
  const lean = ((seed % 3) - 1) * w * 0.07, cx = w / 2 + lean;
  // (the pillow at the head of the berth, its seam)
  px(0, 0, w, pillow + 1, PILLOW); px(0, pillow, w, 1, tone(LINEN, -0.05)); px(1, Math.floor(pillow / 2), w - 2, 1, tone(PILLOW, -0.04));
  // (the blanket from the collar down: wool woven a pixel a row; the body's ridge, the knees, the feet's hump)
  for (let j = collar; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, (i + 2 * j) % 5 === 0 ? tone(b, -0.03) : b);
  for (let j = collar; j < h - 1; j++) {
    const t = (j - collar) / Math.max(1, h - collar), half = w * (t < 0.15 ? 0.38 : t < 0.55 ? 0.33 - t * 0.12 : 0.24 - (t - 0.55) * 0.18);
    const l = Math.round(cx - half), r = Math.round(cx + half);
    px(l, j, 1, 1, tone(b, 0.08)); px(l + 1, j, Math.max(1, Math.round(half * 0.5)), 1, tone(b, 0.035));
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
  const bald = style === 'bald', crew = style === 'crew', hairLine = hcy - ry * (crew ? 0.2 : style === 'bun' ? -0.05 : 0.1);
  for (let j = Math.floor(hcy - ry) - 1; j <= Math.ceil(hcy + ry) + 1; j++) for (let i = Math.floor(hcx - rx) - 1; i <= Math.ceil(hcx + rx) + 1; i++) {
    const a = (i + 0.5 - hcx) / rx, c = (j + 0.5 - hcy) / ry, d = a * a + c * c;
    if (d > 1) { const a2 = (i + 0.5 - hcx) / (rx + 1), c2 = (j + 0.5 - hcy) / (ry + 1); if (a2 * a2 + c2 * c2 <= 1) px(i, j, 1, 1, 0x1a1214); continue; }
    const top = j + 0.5 < hairLine || (!bald && Math.abs(a) > 0.82 && c < 0.3);
    let col = top && !bald ? (crew && (i + j) % 2 ? tone(hair, 0.05) : hair) : (c > 0.62 ? tone(skin, -0.08) : skin);
    if (top && !bald && c < -0.7) col = tone(hair, -0.08);
    px(i, j, 1, 1, col);
  }
  const ey = Math.round(hcy + ry * 0.2), ex = Math.max(1, Math.round(rx * 0.42));
  px(Math.round(hcx) - ex, ey, Math.max(1, Math.round(k)), 1, tone(skin, -0.3)); px(Math.round(hcx) + ex - Math.max(1, Math.round(k)) + 1, ey, Math.max(1, Math.round(k)), 1, tone(skin, -0.3));
  if (style === 'bun') { const bx = Math.round(hcx), by = Math.round(hcy - ry) - 1; px(bx - 1, by - 1, 3, 2, hair); px(bx - 1, by - 1, 3, 1, tone(hair, 0.08)); }
  px(Math.round(hcx - rx), Math.round(hcy + ry) + 2, Math.round(rx * 2), 1, tone(PILLOW, -0.07));   // (the pillow's dent under the head)
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
