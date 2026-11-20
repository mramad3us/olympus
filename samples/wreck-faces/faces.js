// OLYMPUS sample: a room with no floor, read from above (pure; main.js shows the pictures). v0.0.25's stage 0, its build sheet §10
// (the place lens's §3 and §6): the Wreck's two decks at micro-g, where a man stands on the deckhead and a board stands out of any
// face, drawn by the stage's camera before any of it is built, so the look is scored first.
//
// The stage draws from 45° above: a point at plan (x, z) and height y is drawn at (x, z − y) on the picture (VIEWS §2.1), 16 px a
// metre, north up. A 2.2 m deckhead is 35 px up the screen from its plan point, so a man standing on the deckhead of a compartment
// is drawn over the floor north of him. Every figure here is the game's own (the shoot house's marine in the black combat EVA suit,
// src/art/figures through ../portrait-lib/figure.js), turned by the face it stands on as the place lens's table has it: the deck
// upright, the deckhead and the dorsal (north) bulkhead flipped top to bottom, the ventral (south) bulkhead upright, starboard and
// port a quarter turn, feet to the face. The boards are the game's own turner faces (src/render/range-items.js turnerFace, the
// khaki board with a rifle, twice life size as the range draws them). The deck is void-look's plate (P-a) and its bulkhead colours,
// every colour snapped to the Mars palette as the stage snaps it. Each view's id is its candidate:
//   K, a thing on the deckhead read from above (?k=): the hold (9.2 × 7.2 m, deck 6) with the marine on all six faces, the trunk's
//      two scuttles at one plan point (the deck's dogged under the deckhead's open), two cargo stacks and two lamps; beside it a
//      slice of the brig (deck 5) with a board on the deckhead of a ventral cell by its cut wall, drawn over the passage (the case
//      that reads wrong), your #2 in the passage and a man half out of the deck's scuttle; the hold's corner three times larger.
//      K-a the projection alone (the turn, the height, the float pick's shadow on the deck under each body off the deck);
//      K-b K-a and the overhead's footprint dashed on the deck below everything on the deckhead (v0.0.25's default; K-a the user's star of 2026-11-20 and the game's);
//      K-c K-b and the deckhead's edge of your compartment (the hold) as a 1 px line; K-d everything on the deckhead drawn at its
//      plan spot, flipped, not raised, its outline dotted (VIEWS §3.5's sentence as written: it would also draw a floating body's
//      height that way, a change to v0.0.24's float rule).
//   T, a target on a face (?t=): the hold with a board on each of the six faces, and the six boards three times larger. T-a each
//      turned out of its face by the same table as a man (the default); T-b the boards standing out of a bulkhead foreshortened by
//      their tilt to the eye (the dorsal and ventral ones lie level: × 0.71 along their length; port and starboard turn their
//      face from the camera: × 0.5 across), the deck's and the deckhead's whole.
//   P, the pop-up (?p=): a pop-up on the deckhead and one on the starboard bulkhead rising, at 0, 25, 50, 75 and 100% of its 400 ms,
//      three times larger. P-a hinged out from flat on its face (v0.0.25's default); P-b sliding out of a slot in the face (the user's star of 2026-11-20, the game's).
//   H, the deck hatch (?h=): the scuttle in a deck dogged, in a deck open (the leaf folded back, the shaft and its rungs) and in a
//      deckhead open (raised 2.2 m, the leaf hanging), Ø 0.8 m, three times larger. H-a square, four dogs, a yellow coaming (v0.0.25's
//      default); H-b round, a hand wheel (the user's star of 2026-11-20, the game's).
//   B, the bulkhead hatch (?b=): 0.8 m wide, a 0.3 m coaming, in the dorsal bulkhead seen face on, shut and open, and in a cut
//      wall from above, shut and open, three times larger. B-a oval with four dogs (the default, starred 2026-11-20); B-b square with a lever.
//   X, through the trunk (?x=): seven frames across the deck change, you head first down the trunk from deck 5's passage into deck
//      6's hold. X-a the stair's wipe (the default: the deck you leave dissolves outward from the trunk over 0.4 s, the camera
//      held, you in both pictures); X-b the camera held on you at the cut, then gliding back over 0.6 s (TRUNK_GLIDE_S). v0.0.28
//      (the user's note of 2026-11-20: "I don't know what I'm looking at"): the trunk drawn side on at the left (the two decks, the
//      trunk and its two scuttles, you head first, the camera's eye 45° over the deck it shows), each frame captioned (DECK 5, THE
//      WIPE or THE CUT and THE GLIDE, DECK 6), the two looks said in words under them, and deck 6 drawn on the new defaults (the
//      round hatch, H-b; the scuttle overhead as its own rim, K-a); the review of the picks: the side section's scuttles and the last line
//      name that grey ring as drawn (X_LAST_WORDS; the yellow square was H-a's, no longer drawn).
// Shown still; each picture's legend under it says which body is on which face.
import { pic, GAP } from '../portrait-lib/card.js';
import { frameOf, snap, marine } from '../portrait-lib/figure.js';
import { DECK_C, WALL_C, YELLOW_C, BAR_C, LABEL } from '../void-look/deck.js';
import { turnerFace } from '../../src/render/range-items.js';
import { tone, hash3 } from '../../src/art/tone.js';
import { mix } from '../../src/art/doll/grid.js';

export const GROUPS = Object.freeze({
  k: Object.freeze(['K-a', 'K-b', 'K-c', 'K-d']), t: Object.freeze(['T-a', 'T-b']), p: Object.freeze(['P-a', 'P-b']),
  h: Object.freeze(['H-a', 'H-b']), b: Object.freeze(['B-a', 'B-b']), x: Object.freeze(['X-a', 'X-b']),
});
/** Each group's default: the user's stars of 2026-11-20 where scored (K-a, T-a, P-b, H-b, B-a), X-a until X is. */
export const DEFAULTS = Object.freeze({ k: 'K-a', t: 'T-a', p: 'P-b', h: 'H-b', b: 'B-a', x: 'X-a' });
/** The density, the Wreck's compartment (m), its deckhead, the plate's panel and the trunk's scuttle (the sheet's §5). */
export const PPM = 16, HOLD_M = Object.freeze([9.2, 7.2]), CEIL_M = 2.2, PLATE_M = 1.5, TRUNK = Object.freeze({ at: Object.freeze([4.6, 3.6]), diaM: 0.8 });
/** The cut walls' height, the float pick's shadow (float-look's F-b), a pop-up's rise and the trunk's glide (X-b). */
export const CUT_H_M = 1.0, SHADOW_M = Object.freeze([0.55, 0.3]), POPUP_MS = 400, TRUNK_GLIDE_S = 0.6, WIPE_S = 0.4;
const BG = 0x0e0f14, CUT_C = 0x3c4046, SHAFT = 0x16181c, LAMP = 0xf2e6b8, CRATE = 0x6b6a5e, INK = 0x0b0c10, HEAD = 0xd8dce4, LABEL_H = 9;
const BAYER = Object.freeze([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5]);

// ---------- the turn by face ----------
/** How a card is turned on the picture by the face it stands on: a card offset (dx right, dy down from the feet) to the picture's. */
export const TURN = Object.freeze({
  deck: (dx, dy) => [dx, dy], ventral: (dx, dy) => [dx, dy],
  deckhead: (dx, dy) => [dx, -dy], dorsal: (dx, dy) => [dx, -dy],
  starboard: (dx, dy) => [dy, -dx], port: (dx, dy) => [-dy, dx],
});
/** A body's or a board's anchor (its feet, or its base) on the picture in metres, (x, z − y), and its centre's plan point and height. */
export function placeOn(face, x, z, y = 1.1, lenM = 1.75) {
  const half = lenM / 2;
  switch (face) {
    case 'deck': return { ax: x, ay: z, cx: x, cz: z, cy: half };
    case 'deckhead': return { ax: x, ay: z - CEIL_M, cx: x, cz: z, cy: CEIL_M - half };
    case 'dorsal': return { ax: x, ay: z - y, cx: x, cz: z + half, cy: y };
    case 'ventral': return { ax: x, ay: z - y, cx: x, cz: z - half, cy: y };
    case 'starboard': return { ax: x, ay: z - y, cx: x - half, cz: z, cy: y };
    case 'port': return { ax: x, ay: z - y, cx: x + half, cz: z, cy: y };
    default: throw new Error(`no face '${face}'`);
  }
}

// ---------- a canvas in metres ----------
/** A view of a patch of the stage: plan x0..x0+w, picture rows r0..r0+h (m), at ppm, k times larger, drawn at (X, Y) on P. */
function stage(P, X, Y, { x0, r0, w, h, k = 1, ppm = PPM }) {
  const W = Math.round(w * ppm), H = Math.round(h * ppm);
  const col = new Int32Array(W * H).fill(BG), lay = new Float32Array(W * H).fill(-Infinity);
  const px = (xm) => Math.floor((xm - x0) * ppm), py = (rm) => Math.floor((rm - r0) * ppm);
  const S = {
    W, H, col, ppm, px, py,
    /** A pixel at (i, j), drawn over what is there if its layer (the depth: higher in front) is at least what is there. */
    put(i, j, c, layer = 0) { if (i < 0 || j < 0 || i >= W || j >= H) return; const n = j * W + i; if (layer >= lay[n]) { col[n] = c; lay[n] = layer; } },
    get(i, j) { return i < 0 || j < 0 || i >= W || j >= H ? null : col[j * W + i]; },
    shade(i, j, c, t) { if (i < 0 || j < 0 || i >= W || j >= H) return; const n = j * W + i; col[n] = mix(col[n], c, t); },
    rect(xm, rm, wm, hm, c, layer = 0) { for (let j = py(rm); j < py(rm + hm); j++) for (let i = px(xm); i < px(xm + wm); i++) S.put(i, j, c, layer); },
    out() { for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) P.fill(X + i * k, Y + j * k, k, k, snap(col[j * W + i])); },
  };
  return S;
}

// (the deck's plate, void-look's P-a: panels of PLATE_M with their weld seams and bolts, a speck of wear now and then)
function plate(S, xa, za, xb, zb) {
  const g = PLATE_M * S.ppm, seam = tone(DECK_C, -0.16), lit = tone(DECK_C, 0.035), lo = tone(DECK_C, -0.04);
  for (let j = S.py(za); j < S.py(zb); j++) for (let i = S.px(xa); i < S.px(xb); i++) {
    const a = ((i - S.px(xa)) % g + g) % g, b = ((j - S.py(za)) % g + g) % g, r = hash3(i, j, 7) % 131;
    S.put(i, j, a === 0 || b === 0 ? seam : a === 1 || b === 1 ? lit : r < 3 ? lo : DECK_C, -10);
  }
}
// (a standing bulkhead along z = zw from xa to xb, its face to the south seen whole to height hM; layer by its plan z)
function wallNorth(S, xa, xb, zw, hM) {
  for (let j = S.py(zw - hM); j < S.py(zw); j++) for (let i = S.px(xa); i < S.px(xb); i++) {
    const top = j === S.py(zw - hM), c = top ? tone(WALL_C, 0.08) : j === S.py(zw) - 1 ? tone(WALL_C, -0.08) : WALL_C;
    S.put(i, j, c, zw - 0.5);
  }
}
// (a cut wall along z = zw: its top at CUT_H_M, 0.15 m thick, in the cut colour; drawn in front of what is north of it)
function wallCut(S, xa, xb, zw, hM = CUT_H_M, gaps = []) {
  for (let j = S.py(zw - hM); j < S.py(zw + 0.15 - hM) + Math.round(hM * S.ppm); j++) for (let i = S.px(xa); i < S.px(xb); i++) {
    const xm = (i + 0.5) / S.ppm + (xa - S.px(xa) / S.ppm);
    if (gaps.some(([g0, g1]) => xm >= g0 && xm < g1)) continue;
    const top = j < S.py(zw + 0.15 - hM);
    S.put(i, j, top ? tone(CUT_C, 0.1) : tone(CUT_C, -0.06), zw + 0.05);
  }
}
// (a side bulkhead along x = xw, seen edge on: its top from z0 to z1 at hM, a band 0.15 m wide)
function wallSide(S, xw, z0, z1, hM) {
  for (let j = S.py(z0 - hM); j < S.py(z1); j++) for (let i = S.px(xw - 0.075); i < S.px(xw + 0.075) + 1; i++) S.put(i, j, j < S.py(z1 - hM) ? tone(WALL_C, 0.04) : tone(WALL_C, -0.1), 50);
}

// ---------- a body, a board ----------
const FRAMES = new Map();
const frame = (name, dir = 'down', carry = 'low') => { const k = `${name}|${dir}|${carry}`; if (!FRAMES.has(k)) FRAMES.set(k, frameOf(marine({ carry }), dir, name, { ppm: PPM })); return FRAMES.get(k); };
/**
 * The pixels of a turned card on S: f a frame (its px with an anchor, the feet), at the picture's metres (ax, ay), turned by face,
 * scaled by [kAlong, kAcross] of the card (a whole card 1, 1), on layer; opts.dotted draws a dotted outline round it, opts.below(i, j, h)
 * the height test that hides or darkens a pixel. Returns the pixels drawn ([i, j]).
 */
function card(S, px, ax, ay, face, layer, { kLen = 1, kW = 1, dotted = false, clipRows = null, reveal = 1, slot = false } = {}) {
  const T = TURN[face], drawn = [], i0 = S.px(ax), j0 = S.py(ay), set = new Set();
  const minDy = Math.min(...px.map(p => p.dy));
  for (const p of px) {
    // (a pop-up sliding out of its slot: the whole board moved toward the face by what is still in the slot, the head out first;
    // only what is out of the face drawn)
    const dy = slot ? p.dy + Math.round(-minDy * (1 - reveal)) : p.dy * kLen, dx = p.dx * kW;
    if (slot && dy >= 0) continue;
    const [u, v] = T(Math.round(dx), Math.round(dy)), i = i0 + u, j = j0 + v;
    if (clipRows && (j < clipRows[0] || j >= clipRows[1])) continue;
    const key = j * 4096 + i;
    if (set.has(key)) continue;
    set.add(key); S.put(i, j, p.c, layer); drawn.push([i, j]);
  }
  if (dotted) for (const [i, j] of drawn) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = (j + b) * 4096 + i + a; if (!set.has(q) && ((i + a + j + b) & 1)) S.put(i + a, j + b, HEAD, layer + 0.01); }
  return drawn;
}
// (a frame's pixels as card offsets from its feet, snapped)
const manPx = (f) => f.px.map(([a, b, c]) => ({ dx: a - f.ax, dy: b - f.ay, c: snap(c) }));
// (a board's pixels as card offsets from its base, its centre 0.9 m out from the face as a man's would be: the board's foot at
// 0.45 m from the face, its head beyond (turnerFace: twice life size, a stake under it))
function boardPx(holds = 'rifle') {
  const B = turnerFace('threat', holds, PPM), out = [], baseDy = Math.round(0.45 * PPM);
  for (let j = 0; j < B.h; j++) for (let i = 0; i < B.w; i++) { const c = B.cells[j * B.w + i]; if (c !== null) out.push({ dx: i - Math.floor(B.w / 2), dy: j - B.h - baseDy, c: snap(c) }); }
  for (let d = -baseDy; d < 0; d++) out.push({ dx: 0, dy: d, c: snap(0x4a4636) });
  return out;
}
// (the float pick's shadow on the deck under a body's centre: a soft dark ellipse, fainter the higher; K-b's dashed ring in place
// of it for a thing on the deckhead)
function shadow(S, cx, cz, h, dashed = false) {
  const rx = SHADOW_M[0] / 2 * S.ppm, rz = SHADOW_M[1] / 2 * S.ppm, gx = S.px(cx), gy = S.py(cz);
  if (dashed) {
    const n = 40;
    for (let t = 0; t < n; t++) if ((t >> 1) % 2 === 0) { const a = t / n * 2 * Math.PI; S.shade(Math.round(gx + Math.cos(a) * rx), Math.round(gy + Math.sin(a) * rz), INK, 0.4); }
    return;
  }
  const fade = Math.max(0.35, 1 - h / 3);
  for (let j = -Math.ceil(rz); j <= Math.ceil(rz); j++) for (let i = -Math.ceil(rx); i <= Math.ceil(rx); i++) {
    const d = (i / rx) ** 2 + (j / rz) ** 2;
    if (d <= 1) S.shade(gx + i, gy + j, INK, (d < 0.45 ? 0.55 : 0.35) * fade);
  }
}
// (a dashed circle on the deck: K-b's footprint of a round thing on the deckhead)
function dashedRing(S, cx, cz, rM) {
  const n = Math.max(24, Math.round(rM * S.ppm * 6)), gx = S.px(cx), gy = S.py(cz);
  for (let t = 0; t < n; t++) if ((t >> 1) % 2 === 0) { const a = t / n * 2 * Math.PI; S.shade(Math.round(gx + Math.cos(a) * rM * S.ppm), Math.round(gy + Math.sin(a) * rM * S.ppm), INK, 0.4); }
}

// ---------- the hatches ----------
/** A deck scuttle (H-a square, four dogs, a yellow coaming; H-b round, a hand wheel) at (x, z), at height y (0 the deck, 2.2 the deckhead), open or dogged. */
function scuttle(S, look, x, z, y, open, layer) {
  const r = TRUNK.diaM / 2, ppm = S.ppm, cx = S.px(x), cy = S.py(z - y), R = r * ppm;
  const inside = (i, j) => (look === 'H-a' ? Math.abs(i) <= R && Math.abs(j) <= R : Math.hypot(i, j) <= R);
  const rim = (i, j) => inside(i, j) && !(look === 'H-a' ? Math.abs(i) <= R - 1.5 && Math.abs(j) <= R - 1.5 : Math.hypot(i, j) <= R - 1.5);
  const span = Math.ceil(R) + 1;
  for (let j = -span; j <= span; j++) for (let i = -span; i <= span; i++) {
    if (!inside(i, j)) continue;
    let c = rim(i, j) ? (look === 'H-a' ? YELLOW_C : tone(BAR_C, -0.1)) : open ? SHAFT : tone(DECK_C, -0.08);
    // (open: the shaft's rungs across it, a darker ring of its walls)
    if (open && !rim(i, j) && (j + span) % 5 === 0 && Math.abs(i) < R - 2) c = tone(BAR_C, -0.35);
    S.put(cx + i, cy + j, c, layer);
  }
  if (!open) {
    if (look === 'H-a') for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const di = Math.round(a * (R - 2)), dj = Math.round(b * (R - 2)); S.put(cx + di, cy + dj, BAR_C, layer + 0.01); S.put(cx + di - a, cy + dj, tone(BAR_C, -0.3), layer + 0.01); }
    else { const w = Math.round(R * 0.45); for (let t = 0; t < 32; t++) { const a = t / 32 * 2 * Math.PI; S.put(Math.round(cx + Math.cos(a) * w), Math.round(cy + Math.sin(a) * w), BAR_C, layer + 0.01); } for (let d = -w; d <= w; d++) { S.put(cx + d, cy, BAR_C, layer + 0.01); S.put(cx, cy + d, BAR_C, layer + 0.01); } }
  } else {
    // (the leaf folded back: on a deck it lies on the deck north of the hole; on a deckhead it hangs down, drawn below the rim)
    const hang = y > 0, L = Math.round(TRUNK.diaM * ppm), off = Math.ceil(R) + 1;
    for (let d = 0; d < L; d++) for (let i = -Math.round(R); i <= Math.round(R); i++) {
      if (look === 'H-b' && Math.hypot(i, d - L / 2) > R) continue;
      const j = hang ? off + d : -off - d, edge = d === 0 || d === L - 1 || Math.abs(i) === Math.round(R);
      S.put(cx + i, cy + j, edge ? tone(BAR_C, -0.25) : hang ? tone(WALL_C, 0.12) : tone(DECK_C, -0.02), layer + (hang ? 0.02 : 0));
    }
  }
}
/** A bulkhead hatch seen face on (in a wall's face drawn from (fx, top row fr)): B-a oval with four dogs, B-b square with a lever. */
function hatchFace(S, look, x, zw, open) {
  const ppm = S.ppm, w = 0.8 * ppm, hgt = 1.5 * ppm, sill = 0.3, i0 = S.px(x - 0.4), jBot = S.py(zw - sill), jTop = jBot - hgt;
  for (let j = Math.floor(jTop) - 1; j <= jBot; j++) for (let i = i0 - 1; i <= i0 + w; i++) {
    const u = (i - i0 + 0.5) / w - 0.5, v = (j - jTop + 0.5) / hgt - 0.5;
    const inOval = look === 'B-a' ? (u / 0.5) ** 2 + (v / 0.5) ** 2 <= 1 : Math.abs(u) <= 0.5 && Math.abs(v) <= 0.5;
    const inIn = look === 'B-a' ? (u / 0.44) ** 2 + (v / 0.46) ** 2 <= 1 : Math.abs(u) <= 0.44 && Math.abs(v) <= 0.46;
    if (!inOval) continue;
    S.put(i, j, !inIn ? tone(WALL_C, -0.3) : open ? SHAFT : tone(WALL_C, 0.1), 60);
  }
  // (the coaming: the sill under the opening, the cut colour)
  for (let i = i0 - 1; i <= i0 + w; i++) for (let j = jBot; j < S.py(zw); j++) S.put(i, j, tone(CUT_C, 0.12), 60);
  if (!open) {
    if (look === 'B-a') for (const [a, b] of [[-0.42, -0.25], [0.42, -0.25], [-0.42, 0.25], [0.42, 0.25]]) { const i = Math.round(i0 + (a + 0.5) * w), j = Math.round(jTop + (b + 0.5) * hgt); S.put(i, j, BAR_C, 61); S.put(i + Math.sign(a), j, BAR_C, 61); }
    else { const j = Math.round(jTop + hgt * 0.5); for (let d = 0; d < Math.round(w * 0.35); d++) S.put(Math.round(i0 + w * 0.82) - d, j, BAR_C, 61); S.put(Math.round(i0 + w * 0.82), j - 1, tone(BAR_C, -0.3), 61); }
  } else {
    // (the leaf swung open against the bulkhead to its right, seen on edge: a narrow band)
    for (let j = Math.round(jTop); j < jBot; j++) for (let d = 0; d < 3; d++) S.put(i0 + w + 1 + d, j, tone(WALL_C, 0.16 - d * 0.08), 61);
  }
}
/** A bulkhead hatch in a cut wall from above (its leaf the house's door, dressed): the coaming in the gap, the leaf shut in it or swung north. */
function hatchPlan(S, look, x, zw, open) {
  const ppm = S.ppm, i0 = S.px(x - 0.4), w = Math.round(0.8 * ppm), jTop = S.py(zw - CUT_H_M), jBot = S.py(zw), jSill = S.py(zw - 0.3);
  // (the coaming: a sill 0.3 m high across the gap, its top lit)
  for (let i = i0; i < i0 + w; i++) for (let j = jSill; j < jBot; j++) S.put(i, j, j === jSill ? tone(CUT_C, 0.2) : tone(CUT_C, 0.02), zw + 0.06);
  if (!open) {
    // (shut: the leaf fills the gap to the cut's height, B-a its corners rounded and four dogs, B-b square with a lever)
    for (let j = jTop; j < jSill; j++) for (let i = i0; i < i0 + w; i++) {
      const u = (i - i0 + 0.5) / w - 0.5, v = (j - jTop + 0.5) / (jSill - jTop) - 0.5;
      if (look === 'B-a' && (u / 0.5) ** 2 + (v / 0.62) ** 2 > 1) continue;
      S.put(i, j, j === jTop ? tone(BAR_C, -0.05) : tone(WALL_C, 0.1), zw + 0.07);
    }
    if (look === 'B-a') for (const [a, b] of [[0.12, 0.3], [0.88, 0.3], [0.12, 0.75], [0.88, 0.75]]) S.put(i0 + Math.round(w * a), jTop + Math.round((jSill - jTop) * b), BAR_C, zw + 0.08);
    else for (let d = 0; d < 4; d++) S.put(i0 + Math.round(w * 0.8) - d, jTop + Math.round((jSill - jTop) * 0.5), BAR_C, zw + 0.08);
  } else {
    // (open: the leaf swung north on its hinge, seen on its top edge at the cut's height, its length running up the picture)
    for (let d = 0; d < w; d++) { S.put(i0 + w - 1, jTop - d, tone(BAR_C, -0.1), zw + 0.07); S.put(i0 + w, jTop - d, tone(BAR_C, -0.3), zw + 0.07); }
  }
}

// ---------- the hold and the brig ----------
const HOLD_BODIES = Object.freeze([
  Object.freeze({ face: 'deck', x: 2.0, z: 5.6, frame: 'aim', name: 'DECK' }),
  Object.freeze({ face: 'deckhead', x: 6.6, z: 3.6, frame: 'aim', name: 'DECKHEAD' }),
  Object.freeze({ face: 'dorsal', x: 5.4, z: 0, y: 1.1, frame: 'idle0', name: 'DORSAL AT 1.1 M' }),
  Object.freeze({ face: 'starboard', x: 9.2, z: 2.2, y: 1.2, frame: 'idle0', name: 'STARBOARD' }),
  Object.freeze({ face: 'port', x: 0, z: 4.6, y: 1.2, frame: 'idle0', name: 'PORT' }),
  Object.freeze({ face: 'ventral', x: 7.6, z: 7.2, y: 1.4, frame: 'idle0', name: 'VENTRAL AT 1.4 M' }),
]);
const HOLD_BOARDS = Object.freeze([
  Object.freeze({ face: 'deck', x: 1.0, z: 2.6, name: 'DECK' }), Object.freeze({ face: 'deckhead', x: 3.4, z: 5.4, name: 'DECKHEAD' }),
  Object.freeze({ face: 'dorsal', x: 6.0, z: 0, y: 1.2, name: 'DORSAL' }), Object.freeze({ face: 'ventral', x: 4.6, z: 7.2, y: 1.2, name: 'VENTRAL' }),
  Object.freeze({ face: 'starboard', x: 9.2, z: 5.0, y: 1.2, name: 'STARBOARD' }), Object.freeze({ face: 'port', x: 0, z: 1.4, y: 1.2, name: 'PORT' }),
]);
/** The hold's view (deck 6): plan 0..9.2 by 0..7.2 m, the picture's rows from −2.4 m (the dorsal bulkhead's top) to 7.4 m. */
export const HOLD_VIEW = Object.freeze({ x0: -0.3, r0: -2.5, w: 9.8, h: 10.0 });
/** The brig's slice (deck 5): x 0..6, the north cell (z 0..3), the passage (3.0..4.2), the south cell (4.2..7.2). */
export const BRIG_VIEW = Object.freeze({ x0: -0.3, r0: -2.5, w: 6.6, h: 10.0 });

// (the things on the deckhead: drawn raised, at their plan spot under K-d; their footprints dashed under K-b and K-c)
function overhead(S, k, items) {
  for (const it of items) {
    const raised = k !== 'K-d';
    if (it.kind === 'body') {
      const f = frame(it.frame), P = placeOn('deckhead', it.x, it.z);
      card(S, manPx(f), it.x, raised ? P.ay : it.z, 'deckhead', it.z + 0.3, { dotted: k === 'K-d' });
      if (k === 'K-a') shadow(S, P.cx, P.cz, P.cy); else if (k !== 'K-d') shadow(S, P.cx, P.cz, P.cy, true);
    } else if (it.kind === 'board') {
      card(S, boardPx(), it.x, raised ? it.z - CEIL_M : it.z, 'deckhead', it.z + 0.3, { dotted: k === 'K-d' });
      if (k === 'K-b' || k === 'K-c') shadow(S, it.x, it.z, 1.2, true); else if (k === 'K-a') shadow(S, it.x, it.z, 1.2);
    } else if (it.kind === 'scuttle') {
      scuttle(S, 'H-a', it.x, it.z, raised ? CEIL_M : 0, true, it.z + 0.2);
      if (k === 'K-b' || k === 'K-c') dashedRing(S, it.x, it.z, TRUNK.diaM / 2 + 0.1);
    } else if (it.kind === 'lamp') {
      const y = raised ? CEIL_M : 0;
      for (let j = -1; j <= 0; j++) for (let i = -1; i <= 1; i++) S.put(S.px(it.x) + i, S.py(it.z - y) + j, LAMP, it.z + 0.2);
      if (k === 'K-b' || k === 'K-c') dashedRing(S, it.x, it.z, 0.15);
    }
  }
}
// (a cargo stack, lashed deck to deckhead: its top at the deckhead, its south face down to the deck)
function crate(S, x, z, wM, dM) {
  for (let j = S.py(z - CEIL_M); j < S.py(z + dM); j++) for (let i = S.px(x); i < S.px(x + wM); i++) {
    const top = j < S.py(z + dM - CEIL_M), band = !top && ((j - S.py(z + dM - CEIL_M)) % 9 === 0);
    S.put(i, j, top ? tone(CRATE, 0.08) : band ? tone(CRATE, -0.2) : tone(CRATE, -0.06), z + dM);
  }
}
/** The hold drawn on S (deck 6) by the K candidate; returns the legend's words. */
function hold(S, k, { bodies = true, boards = null, boardLook = 'T-a' } = {}) {
  plate(S, 0, 0, HOLD_M[0], HOLD_M[1]);
  // (the trunk's two scuttles at one plan point: the deck's to the stripped deck 7 dogged, the deckhead's open)
  scuttle(S, 'H-a', TRUNK.at[0], TRUNK.at[1], 0, false, -5);
  wallNorth(S, 0, HOLD_M[0], 0, CEIL_M);
  crate(S, 1.2, 0.3, 1.5, 1.2); crate(S, 7.2, 4.8, 1.5, 1.5);
  const items = [{ kind: 'scuttle', x: TRUNK.at[0], z: TRUNK.at[1] }, { kind: 'lamp', x: 2.3, z: 3.6 }, { kind: 'lamp', x: 7.0, z: 2.0 }];
  const legend = [];
  if (bodies) {
    for (const b of HOLD_BODIES) {
      if (b.face === 'deckhead') { items.push({ kind: 'body', ...b }); legend.push(`${b.name} ${b.x}, ${b.z}`); continue; }
      const f = frame(b.frame), P = placeOn(b.face, b.x, b.z, b.y);
      card(S, manPx(f), P.ax, P.ay, b.face, P.cz);
      if (b.face !== 'deck') shadow(S, P.cx, P.cz, P.cy);
      legend.push(`${b.name} ${b.x}, ${b.z}`);
    }
  }
  if (boards) {
    for (const b of boards) {
      const T = boardLook === 'T-b' ? { dorsal: [0.71, 1], ventral: [0.71, 1], starboard: [1, 0.5], port: [1, 0.5] }[b.face] ?? [1, 1] : [1, 1];
      if (b.face === 'deckhead') { items.push({ kind: 'board', ...b }); legend.push(`${b.name} ${b.x}, ${b.z}`); continue; }
      const P = placeOn(b.face, b.x, b.z, b.y ?? 1.2);
      card(S, boardPx(), P.ax, P.ay, b.face, P.cz, { kLen: T[0], kW: T[1] });
      legend.push(`${b.name} ${b.x}, ${b.z}`);
    }
  }
  overhead(S, k, items);
  wallSide(S, 0, 0, HOLD_M[1], CEIL_M); wallSide(S, HOLD_M[0], 0, HOLD_M[1], CEIL_M);
  wallCut(S, 0, HOLD_M[0], HOLD_M[1]);
  // (K-c: the deckhead's edge of your compartment, a 1 px line round its rectangle at 2.2 m)
  if (k === 'K-c') {
    const a = S.px(0), b = S.px(HOLD_M[0]) - 1, t = S.py(-CEIL_M), u = S.py(HOLD_M[1] - CEIL_M);
    for (let i = a; i <= b; i++) { S.put(i, t, tone(CUT_C, 0.3), 99); S.put(i, u, tone(CUT_C, 0.3), 99); }
    for (let j = t; j <= u; j++) { S.put(a, j, tone(CUT_C, 0.3), 99); S.put(b, j, tone(CUT_C, 0.3), 99); }
  }
  return legend;
}
/** The brig's slice drawn on S (deck 5), the overlap case: a board on the deckhead of a south cell by its cut wall. */
function brig(S, k) {
  plate(S, 0, 0, 6, HOLD_M[1]);
  wallNorth(S, 0, 6, 0, CEIL_M);
  // (the passage's bulkheads cut, the cells' hatches in them; the trunk's scuttle open in the passage's deck)
  scuttle(S, 'H-a', 4.6, 3.6, 0, true, -5);
  const items = [{ kind: 'board', x: 1.6, z: 4.6 }, { kind: 'lamp', x: 1.5, z: 1.5 }, { kind: 'lamp', x: 1.5, z: 5.7 }];
  // (your #2 in the passage, and a man half out of the deck's scuttle: his feet in the shaft below the deck, his chest above it)
  const two = frame('idle0', 'left'), P2 = placeOn('deck', 3.0, 3.8);
  card(S, manPx(two), P2.ax, P2.ay, 'deck', 3.8);
  const up = frame('idle0', 'down'), Pu = placeOn('deck', 4.6, 3.6), sink = Math.round(0.9 * S.ppm);
  card(S, manPx(up).map(p => ({ ...p, dy: p.dy + sink })).filter(p => p.dy < 0), Pu.ax, Pu.ay, 'deck', 3.7);
  overhead(S, k, items);
  wallCut(S, 0, 6, 3.0, CUT_H_M, [[1.1, 1.9]]); wallCut(S, 0, 6, 4.2, CUT_H_M, [[1.1, 1.9]]);
  wallSide(S, 0, 0, HOLD_M[1], CEIL_M); wallSide(S, 3.4, 0, 3.0, CUT_H_M); wallSide(S, 3.4, 4.2, 7.2, CUT_H_M);
  wallCut(S, 0, 6, HOLD_M[1]);
  return ['A BOARD ON THE DECKHEAD OF A SOUTH CELL AT 1.6, 4.6 BY ITS CUT WALL', 'YOUR #2 ON THE DECK OF THE PASSAGE', 'A MAN HALF OUT OF THE DECK SCUTTLE'];
}

// ---------- the pictures ----------
const words = {
  'K-a': 'THE PROJECTION ALONE', 'K-b': 'AND THE OVERHEAD\'S FOOTPRINT DASHED ON THE DECK', 'K-c': 'K-B AND YOUR COMPARTMENT\'S DECKHEAD EDGE', 'K-d': 'AT ITS PLAN SPOT, FLIPPED, DOTTED',
  'T-a': 'TURNED OUT OF ITS FACE', 'T-b': 'FORESHORTENED BY ITS TILT', 'P-a': 'HINGED OUT', 'P-b': 'SLIDING FROM A SLOT',
  'H-a': 'SQUARE, FOUR DOGS, A YELLOW COAMING', 'H-b': 'ROUND, A WHEEL', 'B-a': 'OVAL WITH DOGS', 'B-b': 'SQUARE WITH A LEVER',
  'X-a': 'THE STAIR\'S WIPE', 'X-b': 'THE CAMERA HOLDS YOU, THEN GLIDES',
};
const vw = (V) => Math.round(V.w * PPM), vh = (V) => Math.round(V.h * PPM);
const ZOOM = 3, ZOOM_SRC = Object.freeze([64, 56]);
// (X's side section's width, at the left of its frames (v0.0.28))
const X_SEC_W = 108;
const LEGEND_ROWS = 4, T_PX = 38;
/** Each group's picture size (sample.json's pixel). */
export const SIZE = Object.freeze({
  k: Object.freeze([GAP + vw(HOLD_VIEW) + GAP + vw(BRIG_VIEW) + GAP + ZOOM_SRC[0] * ZOOM + GAP, GAP + LABEL_H + Math.max(vh(HOLD_VIEW), ZOOM_SRC[1] * ZOOM) + GAP + LEGEND_ROWS * 7 + GAP]),
  t: Object.freeze([GAP + vw(HOLD_VIEW) + GAP + 3 * (T_PX * ZOOM + GAP), GAP + LABEL_H + Math.max(vh(HOLD_VIEW), 2 * (T_PX * ZOOM + LABEL_H)) + GAP + 2 * 7 + GAP]),
  p: Object.freeze([GAP + 5 * (30 * ZOOM + GAP), GAP + LABEL_H + 2 * (LABEL_H + 30 * ZOOM + GAP)]),
  h: Object.freeze([GAP + 3 * (24 * ZOOM + GAP), GAP + LABEL_H + LABEL_H + 52 * ZOOM + GAP]),
  b: Object.freeze([GAP + 4 * (24 * ZOOM + GAP), GAP + LABEL_H + LABEL_H + 44 * ZOOM + GAP]),
  x: Object.freeze([GAP + X_SEC_W + GAP + 7 * (80 + GAP), GAP + LABEL_H + LABEL_H + 72 + LABEL_H + GAP + 2 * 7 + GAP]),
});
// (a crop of S, k times larger, on P at (X, Y))
function zoom(P, S, X, Y, i0, j0, w, h, k = ZOOM) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = S.get(i0 + i, j0 + j); P.fill(X + i * k, Y + j * k, k, k, snap(c ?? BG)); } }
const legendLines = (items, perLine = 3) => { const out = []; for (let i = 0; i < items.length; i += perLine) out.push(items.slice(i, i + perLine).join(' · ')); return out; };

function pictureK(cand) {
  const [W, H] = SIZE.k, P = pic(W, H), y = GAP + LABEL_H;
  P.write(GAP + 1, GAP + 1, `${cand}: ${words[cand]} · THE HOLD, DECK 6 · THE BRIG, DECK 5 · THE HOLD'S DECKHEAD MAN X3 · 16 PX/M`, HEAD);
  const A = stage(P, GAP, y, HOLD_VIEW), legend = hold(A, cand); A.out();
  const B = stage(P, GAP + vw(HOLD_VIEW) + GAP, y, BRIG_VIEW), legB = brig(B, cand); B.out();
  const deckhead = HOLD_BODIES.find(b => b.face === 'deckhead');
  zoom(P, A, GAP + vw(HOLD_VIEW) + GAP + vw(BRIG_VIEW) + GAP, y, A.px(deckhead.x) - ZOOM_SRC[0] / 2, A.py(deckhead.z - CEIL_M) - 12, ZOOM_SRC[0], ZOOM_SRC[1]);
  const ly = y + Math.max(vh(HOLD_VIEW), ZOOM_SRC[1] * ZOOM) + GAP;
  const lines = [`THE HOLD: ${legend.slice(0, 3).join(' · ')}`, `  ${legend.slice(3).join(' · ')} · THE SCUTTLES AT 4.6, 3.6`, `THE BRIG: ${legB[0]}`, `  ${legB.slice(1).join(' · ')}`];
  lines.forEach((t, i) => P.write(GAP + 1, ly + i * 7, t, LABEL));
  P.report = { frame: [W, H], group: 'K', view: cand, bodies: HOLD_BODIES.map(b => b.face), legend };
  return P;
}
function pictureT(cand) {
  const [W, H] = SIZE.t, P = pic(W, H), y = GAP + LABEL_H;
  P.write(GAP + 1, GAP + 1, `${cand}: ${words[cand]} · A BOARD ON EACH OF THE SIX FACES OF THE HOLD, K-B · EACH X3`, HEAD);
  const A = stage(P, GAP, y, HOLD_VIEW), legend = hold(A, 'K-b', { bodies: false, boards: HOLD_BOARDS, boardLook: cand }); A.out();
  // (the six boards alone, each three times larger, on a dark ground, turned as in the hold)
  HOLD_BOARDS.forEach((b, n) => {
    const S = stage(P, 0, 0, { x0: -1.2, r0: -1.2, w: T_PX / PPM, h: T_PX / PPM }), X = GAP + vw(HOLD_VIEW) + GAP + (n % 3) * (T_PX * ZOOM + GAP), Y = y + Math.floor(n / 3) * (T_PX * ZOOM + LABEL_H);
    const T = cand === 'T-b' ? { dorsal: [0.71, 1], ventral: [0.71, 1], starboard: [1, 0.5], port: [1, 0.5] }[b.face] ?? [1, 1] : [1, 1];
    const at = { deck: [0, 1.1], deckhead: [0, -1.1], dorsal: [0, -1.1], ventral: [0, 1.1], starboard: [1.1, 0], port: [-1.1, 0] }[b.face];
    card(S, boardPx(), at[0], at[1], b.face, 1, { kLen: T[0], kW: T[1] });
    P.write(X + 1, Y + 1, b.name, LABEL);
    zoom(P, S, X, Y + LABEL_H, 0, 0, T_PX, T_PX);
  });
  const ly = y + Math.max(vh(HOLD_VIEW), 2 * (T_PX * ZOOM + LABEL_H)) + GAP;
  legendLines(legend).forEach((t, i) => P.write(GAP + 1, ly + i * 7, t, LABEL));
  P.report = { frame: [W, H], group: 'T', view: cand, boards: HOLD_BOARDS.map(b => b.face) };
  return P;
}
function pictureP(cand) {
  const [W, H] = SIZE.p, P = pic(W, H);
  P.write(GAP + 1, GAP + 1, `${cand}: ${words[cand]} · A POP-UP RISING OVER ${POPUP_MS} MS: 0, 25, 50, 75, 100% · X3`, HEAD);
  const rows = [['deckhead', 'ON THE DECKHEAD, HEAD DOWN', [0, -0.95]], ['starboard', 'ON THE STARBOARD BULKHEAD', [0.9, 0]]];
  const out = [];
  rows.forEach(([face, name, at], r) => {
    const Y = GAP + LABEL_H + r * (LABEL_H + 30 * ZOOM + GAP);
    P.write(GAP + 1, Y + 1, name, LABEL);
    [0, 0.25, 0.5, 0.75, 1].forEach((k, n) => {
      const S = stage(P, 0, 0, { x0: -0.95, r0: -0.95, w: 1.9, h: 1.9 }), X = GAP + n * (30 * ZOOM + GAP);
      // (the face itself: a band of plate along the side the board stands on)
      const wall = { deckhead: [-0.95, -0.95, 1.9, 0.12], starboard: [0.85, -0.95, 0.12, 1.9] }[face];
      S.rect(wall[0], wall[1], wall[2], wall[3], tone(WALL_C, 0.04), -1);
      const a = cand === 'P-a' ? { kLen: Math.sin(k * Math.PI / 2) } : { reveal: k, slot: true };
      if (k === 0 && cand === 'P-a') { const n = Math.round(0.46 * 2 * PPM / 2); for (let d = -n; d <= n; d++) for (let e = 0; e < 2; e++) { const [u, v] = face === 'deckhead' ? [d, e] : [-e, d]; S.put(S.px(at[0] - (face === 'starboard' ? 0.06 : 0)) + u, S.py(at[1] + (face === 'deckhead' ? 0.06 : 0)) + v, tone(0x9c9474, -0.35), 2); } }
      if (k > 0) card(S, boardPx().filter(p => p.dy < -Math.round(0.45 * PPM)).map(p => ({ ...p, dy: p.dy + Math.round(0.45 * PPM) })), at[0] - (face === 'starboard' ? 0.06 : 0), at[1] - (face === 'deckhead' ? -0.06 : 0) + (face === 'deckhead' ? -0.0 : 0), face, 1, a);
      if (cand === 'P-b') { const s = face === 'deckhead' ? [S.px(-0.25), S.py(-0.83), Math.round(0.5 * PPM), 1] : [S.px(0.83), S.py(-0.25), 1, Math.round(0.5 * PPM)]; for (let j = 0; j < s[3]; j++) for (let i = 0; i < s[2]; i++) S.put(s[0] + i, s[1] + j, SHAFT, 2); }
      zoom(P, S, X, Y + LABEL_H, 0, 0, 30, 30);
      out.push({ face, riseK: k });
    });
  });
  P.report = { frame: [W, H], group: 'P', view: cand, frames: out.length };
  return P;
}
function pictureH(cand) {
  const [W, H] = SIZE.h, P = pic(W, H), Y = GAP + LABEL_H;
  P.write(GAP + 1, GAP + 1, `${cand}: ${words[cand]} · 0.8 M · X3`, HEAD);
  [['IN A DECK, DOGGED', 0, false], ['IN A DECK, OPEN', 0, true], ['IN A DECKHEAD, OPEN', CEIL_M, true]].forEach(([name, y, open], n) => {
    const S = stage(P, 0, 0, { x0: -0.75, r0: -2.6, w: 1.5, h: 3.25 }), X = GAP + n * (24 * ZOOM + GAP);
    plate(S, -0.75, -0.75, 0.75, 0.65);
    scuttle(S, cand, 0, 0, y, open, 1);
    if (y > 0) dashedRing(S, 0, 0, TRUNK.diaM / 2 + 0.1);
    P.write(X + 1, Y + 1, name, LABEL);
    zoom(P, S, X, Y + LABEL_H, 0, 0, 24, 52);
  });
  P.report = { frame: [W, H], group: 'H', view: cand };
  return P;
}
function pictureB(cand) {
  const [W, H] = SIZE.b, P = pic(W, H), Y = GAP + LABEL_H;
  P.write(GAP + 1, GAP + 1, `${cand}: ${words[cand]} · 0.8 M, A 0.3 M COAMING · X3`, HEAD);
  [['FACE ON, SHUT', 'face', false], ['FACE ON, OPEN', 'face', true], ['FROM ABOVE, SHUT', 'plan', false], ['FROM ABOVE, OPEN', 'plan', true]].forEach(([name, how, open], n) => {
    const S = stage(P, 0, 0, { x0: -0.75, r0: -2.4, w: 1.5, h: 2.75 }), X = GAP + n * (24 * ZOOM + GAP);
    plate(S, -0.75, -1.4, 0.75, 0.35);
    if (how === 'face') { wallNorth(S, -0.75, 0.75, 0, CEIL_M); hatchFace(S, cand, 0, 0, open); }
    else { wallCut(S, -0.75, 0.75, 0, CUT_H_M, [[-0.4, 0.4]]); hatchPlan(S, cand, 0, 0, open); }
    P.write(X + 1, Y + 1, name, LABEL);
    zoom(P, S, X, Y + LABEL_H, 0, 0, 24, 44);
  });
  P.report = { frame: [W, H], group: 'B', view: cand };
  return P;
}
// (X: one deck's picture around the trunk, you head first through it: on deck 5 your head in the deck's scuttle, on deck 6 hanging
// under the deckhead's; a picture of 5 × 4.5 m around the trunk)
const X_VIEW = Object.freeze({ x0: 2.1, r0: 0.6, w: 5, h: 4.5 });
/** Your feet's height (m) on each deck at the band: deck 5 head first into the deck (feet 1.45 m up), deck 6 under the deckhead (feet 2.6 m, in the trunk). */
export const X_FEET_M = Object.freeze({ 5: 1.45, 6: 2.6 });
function deckPicture(deck, dRows = 0) {
  const P0 = pic(80, 72), V = { ...X_VIEW, r0: X_VIEW.r0 + dRows / PPM }, S = stage(P0, 0, 0, V);
  plate(S, 2.1, 0, 7.1, 7.2);
  // (v0.0.28: on the user's stars of 2026-11-20, the round hatch with its wheel (H-b) and the projection alone (K-a): the scuttle
  // overhead drawn as its own rim, where it shows from 45° above, no footprint dashed on the deck)
  if (deck === 5) { scuttle(S, 'H-b', 4.6, 3.6, 0, true, 0); wallCut(S, 2.1, 7.1, 3.0, CUT_H_M, [[2.6, 3.4]]); wallCut(S, 2.1, 7.1, 4.2, CUT_H_M, [[5.6, 6.4]]); }
  else { scuttle(S, 'H-b', 4.6, 3.6, 0, false, -5); crate(S, 6.2, 1.6, 1.0, 1.0); scuttle(S, 'H-b', 4.6, 3.6, CEIL_M, true, 3.8); }
  // (you, head first: the card flipped, feet up; on deck 5 the pixels below the deck's plane drawn in the shaft's dark)
  const f = frame('aim', 'down'), feet = X_FEET_M[deck], px = manPx(f);
  const drawnPx = px.map(p => ({ ...p, c: deck === 5 && feet + p.dy / PPM < 0 ? mix(p.c, SHAFT, 0.6) : p.c }));
  card(S, drawnPx, 4.6, 3.6 - feet, 'deckhead', 10);
  S.out();
  return P0;
}
// (v0.0.28, the user's note of 2026-11-20 on X: "I don't know what I'm looking at, make an effort to explain what I'm looking at
// please."): the trunk side on, at the left of the frames, so a player who has never floated sees what the frames show: the two
// decks as two floors (deck 5 above, deck 6, the hold, below, the hull between), the trunk joining them with a scuttle at each end,
// you in it head first, an arrow down, and the camera's eye 45° over the deck it shows)
function sideSection(P, X, Y) {
  const W = X_SEC_W, x0 = X + 2, x1 = X + W - 3, t0 = X + 50, t1 = X + 58, d5 = Y + 24, d6top = Y + 38, d6 = Y + 66;
  const line = (xa, xb, y, c) => { for (let x = xa; x <= xb; x++) if (x < t0 || x > t1) P.put(x, y, c); };
  // (the hull between the decks, the trunk's shaft through it)
  for (let y = d5 + 1; y < d6top; y++) for (let x = x0; x <= x1; x++) P.put(x, y, x > t0 && x < t1 ? SHAFT : tone(WALL_C, -0.25));
  for (let y = d5; y <= d6top; y++) { P.put(t0, y, WALL_C); P.put(t1, y, WALL_C); }
  // (the hold's air a shade lighter than the page, so deck 6 reads as a room under the hull)
  for (let y = d6top + 1; y < d6; y++) for (let x = x0; x <= x1; x++) P.put(x, y, 0x15171d);
  line(x0, x1, d5, DECK_C); line(x0, x1, d6top, tone(WALL_C, 0.2)); for (let x = x0; x <= x1; x++) P.put(x, d6, DECK_C);
  // (the two scuttles, the trunk's ends: deck 5's in its deck, deck 6's in its deckhead)
  // (in the game's grey rim, H-b's, as the frames draw them: the user's star of 2026-11-20; v0.0.25's H-a was the yellow coaming)
  for (const y of [d5, d6top]) for (const x of [t0 - 2, t0 - 1, t1 + 1, t1 + 2]) P.put(x, y, tone(BAR_C, -0.1));
  P.write(x0, d5 - 7, 'DECK 5', LABEL); P.write(x0, d6top + 3, 'DECK 6, THE HOLD', LABEL);
  P.write(t1 + 4, d5 + 4, 'TRUNK', LABEL);
  // (you, head first down it: boots up in deck 5, your head through the deckhead's scuttle into the hold)
  for (let y = d5 - 6; y < d6top - 3; y++) for (let x = t0 + 2; x <= t1 - 2; x++) P.put(x, y, y < d5 - 3 ? 0x3a3e47 : 0x5a606c);
  for (let y = d6top - 3; y <= d6top + 1; y++) for (let x = t0 + 3; x <= t1 - 3; x++) P.put(x, y, HEAD);
  P.write(t0 - 14, d5 - 8, 'YOU', HEAD);
  // (the arrow down, beside the trunk's word)
  const ax = t1 + 28;
  for (let y = d5 + 2; y <= d6top - 2; y++) P.put(ax, y, HEAD);
  for (let k = 1; k <= 2; k++) { P.put(ax - k, d6top - 2 - k, HEAD); P.put(ax + k, d6top - 2 - k, HEAD); }
  // (the camera's eye, 45° over the deck it shows, its line of sight dotted down to the floor)
  const ex = X + W - 9, ey = Y + 3;
  for (const [i, j] of [[0, -2], [-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2]]) P.put(ex + i, ey + j, LABEL);
  P.put(ex, ey, HEAD);
  for (let k = 3; ex - k >= t1 + 4 && ey + k < d5; k += 2) P.put(ex - k, ey + k, LABEL);
  P.write(X + 32, Y + 1, 'THE CAMERA', LABEL);
}
/** The frames' last line (the deck 6 frame's scuttle overhead is H-b's grey ring with its wheel, drawn where it shows from above: just below you in the picture). */
export const X_LAST_WORDS = 'FIRST: YOU AT THE SCUTTLE IN DECK 5\'S FLOOR, GOING IN HEAD FIRST. LAST: DECK 6 FROM ABOVE, YOU HEAD DOWN; THE GREY RING JUST BELOW YOU IN THE PICTURE IS THE SCUTTLE OVERHEAD';
function pictureX(cand) {
  const [W, H] = SIZE.x, P = pic(W, H), Y = GAP + LABEL_H + LABEL_H, X0 = GAP + X_SEC_W + GAP;
  P.write(GAP + 1, GAP + 1, `${cand}: ${words[cand]} · GOING DOWN A DECK: DECK 5'S PASSAGE TO DECK 6'S HOLD, HEAD FIRST DOWN THE TRUNK · 16 PX/M`, HEAD);
  sideSection(P, GAP, Y);
  P.write(GAP + 1, Y - LABEL_H + 1, 'SIDE ON', LABEL);
  const offPx = Math.round((X_FEET_M[6] - X_FEET_M[5]) * PPM), D5 = deckPicture(5), cx = Math.floor((4.6 - X_VIEW.x0) * PPM), cy = Math.floor((3.6 - X_VIEW.r0) * PPM);
  const times = cand === 'X-a' ? [0, 1, 2, 3, 4, 5, 6].map(n => n * WIPE_S / 6) : [0, 0, 0.1, 0.2, 0.3, 0.45, 0.6];
  // (each frame's caption under it: what the picture is at that moment)
  const caption = (n) => (n === 0 ? 'DECK 5' : n === 6 ? 'DECK 6' : cand === 'X-a' ? 'THE WIPE' : n === 1 ? 'THE CUT' : 'THE GLIDE');
  const frames = [];
  times.forEach((t, n) => {
    const X = X0 + n * (80 + GAP);
    let F;
    if (cand === 'X-a') {
      // (the stair's wipe: deck 6 grows outward from the trunk's point as deck 5 dissolves, through a 4 × 4 Bayer threshold)
      const D6 = deckPicture(6), k = t / WIPE_S, R = Math.hypot(80, 72);
      F = pic(80, 72);
      for (let j = 0; j < 72; j++) for (let i = 0; i < 80; i++) { const d = Math.hypot(i - cx, j - cy) / R, keep = (BAYER[(j % 4) * 4 + (i % 4)] + 0.5) / 16; F.put(i, j, d < k * 1.15 - keep * 0.15 ? D6.get(i, j) : D5.get(i, j)); }
    } else {
      // (the cut at the band, the camera held on you: deck 6 drawn offset so your pixels stay, then gliding back over TRUNK_GLIDE_S)
      const g = n === 0 ? null : Math.max(0, 1 - t / TRUNK_GLIDE_S);
      F = n === 0 ? D5 : deckPicture(6, -Math.round(offPx * g));
    }
    P.blit(F, X, Y);
    P.write(X + 1, Y - LABEL_H + 1, `${(t * 1000).toFixed(0)} MS`, LABEL);
    P.write(X + 1, Y + 72 + 2, caption(n), HEAD);
    frames.push({ ms: Math.round(t * 1000), caption: caption(n) });
  });
  const ly = Y + 72 + LABEL_H + GAP;
  P.write(GAP + 1, ly, cand === 'X-a' ? `X-A: DECK 5 DISSOLVES INTO DECK 6 IN A PIXEL WIPE OVER ${WIPE_S * 1000} MS, THE STAIR'S WIPE, THE CAMERA HELD: YOU STAY ON THE SAME SPOT OF THE SCREEN` : `X-B: THE PICTURE CUTS TO DECK 6 AT ONCE, SHIFTED ${offPx} PX SO YOU STAY WHERE YOU WERE, THEN THE CAMERA GLIDES BACK OVER ${TRUNK_GLIDE_S * 1000} MS`, LABEL);
  P.write(GAP + 1, ly + 7, X_LAST_WORDS, LABEL);
  P.report = { frame: [W, H], group: 'X', view: cand, frames, offPx };
  return P;
}

/** The picture for a query (?k=, ?t=, ?p=, ?h=, ?b= or ?x=): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const g = Object.keys(GROUPS).find(k => q.has(k)) ?? 'k', cand = GROUPS[g].includes(q.get(g)) ? q.get(g) : DEFAULTS[g];
  return { k: pictureK, t: pictureT, p: pictureP, h: pictureH, b: pictureB, x: pictureX }[g](cand);
}
