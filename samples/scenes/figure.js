// OLYMPUS scenes sample: placeholder figures for scale. Chibi marines on cards, dressed for where they stand.
//
// The real people (sprites, frames, the crowd's one instanced draw) are another agent's work; these are
// stand-ins so a scene has someone in it at the right size, built the way the stage sample's marine is
// (samples/stage/kit.js marine(): rectangles and ovals in parts, shaded by rule as tradecraft's sprites
// are: a lit top edge, shaded right and bottom edges, an inner line where parts overlap, an ink outline).
// 1.75 m tall at the density: 28 px at 16 px/m, 42 at 24. Dress (VIEWS §3.3): 'utilities' (the Corps'
// field uniform in its red-tan pattern, VIEWS §2.6's corps family; an eight-point cover), 'pt' (grey tee,
// black shorts, running shoes), 'towel' (the head: a towel at the waist, shower shoes), 'navy' (a ship's
// blue-grey coveralls), 'suit' (a vac suit, helmet on, visor down), 'cook' (whites and a cap), 'watch'
// (utilities and a red-lens torch: the fire watch). facing 'down' (toward the camera) or 'up' (away).
import { paint } from '../../src/art/paint.js';
import { tone, hash3 } from '../../src/art/tone.js';

const INK = 0x14151c;
const SKINS = [0xc48a62, 0x8f5a3c, 0xe0a882, 0x6b4630, 0xb07a52];
const DRESS = {
  utilities: { top: 0x96694f, legs: 0x8f6a52, camo: [0x7b4d41, 0xb1896d], head: 'cover', headC: 0x8a6450, boots: 0x96694f },
  watch: { top: 0x96694f, legs: 0x8f6a52, camo: [0x7b4d41, 0xb1896d], head: 'cover', headC: 0x8a6450, boots: 0x96694f, torch: true },
  pt: { top: 0x87959d, legs: 0x31292a, head: 'hair', boots: 0xd6d0c9, bareLegs: true },
  towel: { top: null, legs: 0xd6d0c9, head: 'hair', boots: 0x3c5d84, bareLegs: true, towel: true },
  navy: { top: 0x52587a, legs: 0x52587a, head: 'hair', boots: 0x31292a, belt: 0x31292a },
  suit: { top: 0x9c917a, legs: 0x9c917a, head: 'helmet', headC: 0x9c917a, boots: 0x31292a, trim: 0x8f3f31 },
  cook: { top: 0xd6d0c9, legs: 0x565b67, head: 'cap', headC: 0xd6d0c9, boots: 0x31292a, apron: 0xc7d5d0 },
};

/** A placeholder marine as a Pixmap with holes round it: { dress, facing, seed }, 1.75 m tall at ppm. */
export function figure(ppm, { dress = 'utilities', facing = 'down', seed = 1 } = {}) {
  const D = DRESS[dress] ?? DRESS.utilities, skin = SKINS[hash3(seed, 7) % SKINS.length], hair = [0x31292a, 0x573a37, 0x7f4d23, 0x1a1214][hash3(seed, 3) % 4];
  const H = Math.round(1.75 * ppm), W = Math.round(H * 0.8) | 1, k = H / 28, back = facing === 'up';
  const col = new Int32Array(W * H).fill(-1), prt = new Int16Array(W * H).fill(-1);
  const cx = (W - 1) / 2;
  const put = (x, y, c, p) => { if (x >= 0 && y >= 0 && x < W && y < H) { col[y * W + x] = c; prt[y * W + x] = p; } };
  const rect = (x0, y0, w, h, c, p) => { for (let y = Math.round(y0); y < Math.round(y0 + h); y++) for (let x = Math.round(x0); x < Math.round(x0 + w); x++) put(x, y, typeof c === 'function' ? c(x, y) : c, p); };
  const oval = (ox, oy, rx, ry, c, p, cut = null) => { for (let y = Math.floor(oy - ry); y <= Math.ceil(oy + ry); y++) for (let x = Math.floor(ox - rx); x <= Math.ceil(ox + rx); x++) { const dx = (x - ox) / rx, dy = (y - oy) / ry; if (dx * dx + dy * dy <= 1 && (!cut || cut(x, y))) put(x, y, c, p); } };
  const camo = (base) => D.camo ? (x, y) => { const h = hash3(Math.floor(x / Math.max(1, 1.5 * k)), Math.floor(y / Math.max(1, 1.2 * k)), seed); return h % 5 === 0 ? D.camo[0] : h % 7 === 0 ? D.camo[1] : base; } : base;
  // legs and feet
  const legC = D.bareLegs ? skin : camo(D.legs);
  if (D.bareLegs && !D.towel) { rect(cx - 5 * k, 22.5 * k, 10 * k, 2.2 * k, D.legs, 1); }
  rect(cx - 5 * k, D.bareLegs ? 24.5 * k : 23 * k, 4 * k, D.bareLegs ? 1.5 * k : 3.5 * k, legC, 1); rect(cx + 1 * k, D.bareLegs ? 24.5 * k : 23 * k, 4 * k, D.bareLegs ? 1.5 * k : 3.5 * k, legC, 2);
  rect(cx - 5.5 * k, 26 * k, 4.5 * k, 2 * k, D.boots, 3); rect(cx + 1 * k, 26 * k, 4.5 * k, 2 * k, D.boots, 3);
  // arms and body
  const armC = D.top === null ? skin : dress === 'pt' ? skin : camo(D.top);
  rect(cx - 8 * k, 15 * k, 2.5 * k, 7 * k, armC, 4); rect(cx + 5.5 * k, 15 * k, 2.5 * k, 7 * k, armC, 5);
  if (dress === 'pt') { rect(cx - 8 * k, 15 * k, 2.5 * k, 2.5 * k, D.top, 4); rect(cx + 5.5 * k, 15 * k, 2.5 * k, 2.5 * k, D.top, 5); }
  rect(cx - 7.5 * k, 21.5 * k, 2 * k, 1.5 * k, D.top === 0x9c917a ? 0x31292a : skin, 6); rect(cx + 5.5 * k, 21.5 * k, 2 * k, 1.5 * k, D.top === 0x9c917a ? 0x31292a : skin, 6);
  rect(cx - 5.5 * k, 14 * k, 11 * k, D.towel ? 8.5 * k : 9.5 * k, D.top === null ? skin : camo(D.top), 7);
  if (D.towel) rect(cx - 6 * k, 21 * k, 12 * k, 4 * k, (x, y) => (Math.floor(x / Math.max(1, k)) % 3 ? 0xd6d0c9 : 0xc7d5d0), 8);
  if (D.apron && !back) rect(cx - 4.5 * k, 16 * k, 9 * k, 9 * k, D.apron, 8);
  if (D.trim) { rect(cx - 5.5 * k, 18 * k, 11 * k, 0.8 * k, D.trim, 9); if (!back) rect(cx - 2 * k, 15.5 * k, 3 * k, 2 * k, 0x9fe0b0, 9); else rect(cx - 4 * k, 14.5 * k, 8 * k, 6 * k, 0x565b67, 9); }
  if (!D.towel && dress !== 'pt' && D.top !== null) rect(cx - 5.5 * k, 22 * k, 11 * k, 1 * k, D.belt ?? 0x49403e, 10);
  // head
  oval(cx, 9 * k, 6.6 * k, 6 * k, back ? hair : skin, 11);
  if (D.head === 'helmet') { oval(cx, 8.6 * k, 7.6 * k, 7 * k, D.headC, 12); if (!back) oval(cx, 9.6 * k, 5.2 * k, 3.6 * k, 0x1d2b46, 13); rect(cx - 2.5 * k, 7 * k, 2 * k, 1 * k, 0x86bdbc, 13); }
  else {
    if (!back) { oval(cx, 6.6 * k, 6.8 * k, 3.6 * k, hair, 12, (x, y) => y < 7.4 * k); }
    if (D.head === 'cover') { oval(cx, 6.2 * k, 7.0 * k, 3.8 * k, D.headC, 12, (x, y) => y < 6.9 * k); rect(cx - 7.2 * k, 6.6 * k, 14.4 * k, 1.2 * k, tone(D.headC, -0.06), 12); }
    if (D.head === 'cap') { oval(cx, 5.8 * k, 6.2 * k, 3.6 * k, D.headC, 12, (x, y) => y < 6.8 * k); }
    if (!back) { for (const ex of [-2.6, 1.6]) rect(cx + ex * k, 10.6 * k, Math.max(1, k), Math.max(2, 1.6 * k), INK, 13); rect(cx - 0.5 * k, 13.4 * k, 1.5 * k, Math.max(1, 0.6 * k), tone(skin, -0.15), 13); }
  }
  if (D.torch) { rect(cx + 6 * k, 20.5 * k, 2.5 * k, 1.5 * k, 0x31292a, 14); rect(cx + 8 * k, 20.5 * k, 1 * k, 1.5 * k, 0xff4a3a, 14); }
  return paint(W, H, (px) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, c = col[i];
      if (c < 0) {
        if ((x > 0 && col[i - 1] >= 0) || (x < W - 1 && col[i + 1] >= 0) || (y > 0 && col[i - W] >= 0) || (y < H - 1 && col[i + W] >= 0)) px(x, y, 1, 1, INK);
        else px(x, y, 1, 1, null);
        continue;
      }
      const p = prt[i], other = (j, ok) => ok && prt[j] !== p;
      let d = 0;
      if (other(i - W, y > 0) || y === 0) d += 0.06;
      if (other(i + 1, x < W - 1) || other(i + W, y < H - 1)) d -= 0.08;
      if (x > cx + 2 * k && p !== 13) d -= 0.03;
      px(x, y, 1, 1, d ? tone(c, d) : c, D.torch && p === 14 && c === 0xff4a3a ? 1 : 0);
    }
  }, { key: `figure:${dress}:${facing}:${seed}:${ppm}` });
}
