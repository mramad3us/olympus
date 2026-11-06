// OLYMPUS art: the kit of the KD range's 25 m bay. Its tower, the frames and their cards, the mats, the berm, the fence and the rope, the boards.
//
// PLACES §4.12 and the build sheet 0.0.5 §2.3 (src/data/places/range.js holds where each stands). The
// camera looks north and 45° down, so a piece reads by its top and its south face (kit.js); the range
// fires east, so what faces the shooter faces west, edge-on to the camera. Two conventions follow:
//   - a target is drawn facing you, as tradecraft drew its paper (src/art/sprites.js paperFrame: the
//     picture shows a card's face whichever way it stands; the range's own rule), so its frame is built
//     facing 'down' and the card's rings and holes read on the stage;
//   - the berm is built in steps rising away from the line, so its slope reads as tops, and its south
//     end shows the earth's section.
// Makes (at least two of each, the kit's rule):
//   kdTower     'open' (the range officer's deck at 6.0 m, a rail on three sides and the ladder's gap, a
//               sunshade over the deck's north half with the PA horns on its edge, so the RO stands in
//               sight: a roof over the whole deck would hide him from a camera 45° up), 'cab' (the same
//               legs under a glazed cab); both 4 × 4 m and 9 m tall, legs braced on the face we see, a
//               ladder up the south face, the red flag's pole at the corner `look.flag` gives (the flag
//               itself is the stage's, flown while hot: src/render/range.js);
//   kdFrame     'card25' (a 1.0 × 1.2 m backer on two posts, the 25 m card on it, its rings and its black,
//               drawn CARD_K times life size as the kit draws small things bigger than life, so it fills
//               most of the backer: the lane's number is the board's on the line; the holes are the
//               stage's ink on it), 'chest' (a chest silhouette for the KD lines to come, its lane's
//               number on the backer's top edge);
//   kdMat       'canvas' (a shooting mat of olive canvas, its binding and grommets), 'rubber';
//   berm        'earth' (four steps of rammed regolith, 0.75 m each), 'sandbag' (its foot faced with bags);
//   rangeFence  'mesh' (2.4 m chain link on posts every 3 m, seen through), 'rope' (stakes every 2 m and a
//               red-and-white rope at 0.85 m); a run as long as its w;
//   rangeSign   'lane' (a lane's number on a red board atop a post), 'distance' ("25 M"), 'notice'
//               ("LIVE FIRE" in the Corps' red), 'flagpole' (a white pole 3.6 m tall with its cap: the
//               line's red flag flies from it while hot, the stage's).
// Pure.
import { tex } from './kit.js';
import { C, U, P, bevel, cloth, tone, hash3 } from './common.js';
import { paintedSteel, concrete, regolith } from '../materials/index.js';
import { fontFor } from './type.js';

/** The card is drawn this many times life size (the kit's small things are drawn bigger than life: a 30 cm card is 14 px at 16 px/m, its black 5 px across, so a string's holes read apart on it). */
export const CARD_K = 3;
/** The 25 m card's rings (WEAPONS §11.1's KD rings, by ring widths of 2.5 cm): the black's edge (the 4 ring), the 3 and 2 rings, centimetres. */
export const CARD_RINGS_CM = Object.freeze({ v: 1.25, five: 2.5, black: 5, three: 7.5, two: 10, side: 30 });
/** The card's centre on its frame: across from the frame's middle, and up from the ground, metres. */
export const CARD_AT_M = Object.freeze({ x: 0, y: 0.6 });

const STEEL = 0x6e7582, STEEL_D = 0x49403e, BOARD = 0xb28a59, BOARD_D = 0x8c6d59, EARTH = 0xa65e4b, MAT = 0x5d6346;

// ---------- the tower ----------

/** The legs' bracing seen on the south face: an X between the legs each 1.5 m, the open between seen through. */
const braceFace = tex('kdbrace', (px, w, h, ppm) => {
  px(0, 0, w, h, null);
  const bay = Math.max(8, Math.round(1.5 * ppm)), t = Math.max(1, Math.round(U(ppm)));
  for (let y0 = 0; y0 < h; y0 += bay) {
    const hh = Math.min(bay, h - y0);
    for (let x = 0; x < w; x++) {
      const a = Math.round(y0 + (x / (w - 1)) * (hh - 1)), b = Math.round(y0 + (1 - x / (w - 1)) * (hh - 1));
      for (let k = 0; k < t; k++) { px(x, a + k, 1, 1, STEEL); px(x, b + k, 1, 1, tone(STEEL, -0.08)); }
    }
    px(0, y0, w, t, tone(STEEL, 0.06));
  }
});
/** A ladder: two rails and a rung every 0.3 m, the open between seen through. */
const ladderFace = tex('kdladder', (px, w, h, ppm) => {
  px(0, 0, w, h, null);
  const t = Math.max(1, Math.round(U(ppm))), step = Math.max(3, Math.round(0.3 * ppm));
  px(0, 0, t, h, STEEL); px(w - t, 0, t, h, tone(STEEL, -0.1));
  for (let y = step - 1; y < h; y += step) px(t, y, w - 2 * t, t, tone(STEEL, 0.05));
});
/** A deck's rail: a top rail, a mid rail and a kick plate, the open between seen through; a gap where `gap` (0..1 of its width) is. */
const railFace = (gap) => tex(`kdrail:${gap}`, (px, w, h, ppm) => {
  px(0, 0, w, h, null);
  const t = Math.max(1, Math.round(U(ppm))), kick = Math.max(2, Math.round(0.15 * ppm)), g0 = gap ? Math.round(gap[0] * w) : -1, g1 = gap ? Math.round(gap[1] * w) : -1;
  const on = (x) => x < g0 || x >= g1;
  for (let x = 0; x < w; x++) {
    if (!on(x)) continue;
    px(x, 0, 1, t, 0xd0ac5e); px(x, Math.round(h * 0.5), 1, t, tone(0xd0ac5e, -0.15));
    px(x, h - kick, 1, kick, STEEL_D);
  }
  for (let x = 0; x < w; x += Math.max(4, Math.round(1.0 * ppm))) if (on(x)) px(x, 0, t, h, tone(0xd0ac5e, -0.08));
  if (gap) { px(Math.max(0, g0 - t), 0, t, h, 0xd0ac5e); if (g1 < w) px(g1, 0, t, h, 0xd0ac5e); }
});
/** The deck's edge and its grating seen from above. */
const deckTop = tex('kddeck', (px, w, h, ppm) => {
  const c = 0x7c7f86; px(0, 0, w, h, c);
  const g = Math.max(2, Math.round(0.12 * ppm));
  for (let j = 0; j < h; j += g) px(0, j, w, 1, tone(c, -0.12));
  for (let i = 0; i < w; i += g * 3) px(i, 0, 1, h, tone(c, -0.08));
  bevel(px, 0, 0, w, h, c, 1.0);
});
const fasciaFace = (text) => tex(`kdfascia:${text}`, (px, w, h, ppm) => {
  paintedSteel(px, 0, 0, w, h, { c: 0xdad0bc, ppm, seed: 5 });
  px(0, h - 1, w, 1, tone(0xdad0bc, -0.25));
  const f = fontFor(ppm), tw = f.width(text);
  if (tw < w - 2 && f.h < h) f.stencil(px, Math.floor((w - tw) / 2), Math.floor((h - f.h) / 2), text, C.mcrnD);
});
const hornFace = tex('kdhorn', (px, w, h) => { px(0, 0, w, h, 0x31292a); px(1, 1, w - 2, h - 2, 0x14151c); px(0, 0, w, 1, tone(0x31292a, 0.1)); });
const glassFace = tex('kdcabglass', (px, w, h, ppm) => {
  px(0, 0, w, h, 0x2b3a44);
  px(0, 0, w, Math.max(1, Math.round(h * 0.3)), 0x3c5d84);
  for (let x = 0; x < w; x += Math.max(4, Math.round(1.0 * ppm))) px(x, 0, Math.max(1, Math.round(U(ppm))), h, STEEL_D);
  px(Math.round(w * 0.2), 1, 1, Math.round(h * 0.5), 0x86bdbc);
});

export function kdTower(k, o) {
  const { W, D, ppm } = o, make = o.make ?? 'open', look = o.look ?? {};
  const deck = 6.0, top = o.H ?? 9.0, L = 0.16, hw = W / 2 - L / 2, hd = D / 2 - L / 2;
  // (the legs, to the deck, braced on the face the camera sees; the ladder on it at the west leg)
  k.comp();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * hw, z: sz * hd, w: L, d: L, h: deck - 0.2, faces: { front: tex('kdleg', (px, w, h) => { px(0, 0, w, h, STEEL); px(0, 0, 1, h, tone(STEEL, 0.1)); px(w - 1, 0, 1, h, tone(STEEL, -0.15)); }), sides: tone(STEEL, -0.1), top: STEEL } });
  k.box({ x0: -hw + L / 2, x1: hw - L / 2, z0: D / 2 - L, z1: D / 2 - L + 0.02, y0: 0.4, y1: deck - 0.3, faces: { front: braceFace }, only: ['front'] });
  k.box({ x0: -hw + L / 2, x1: hw - L / 2, z0: -D / 2 + L - 0.02, z1: -D / 2 + L, y0: 0.4, y1: deck - 0.3, faces: { front: braceFace }, only: ['front'] });
  k.comp();
  k.box({ x0: -1.45, x1: -0.95, z0: D / 2, z1: D / 2 + 0.04, y0: 0, y1: deck + 0.9, faces: { front: ladderFace }, only: ['front', 'top'] });
  // (the deck: a steel slab, its grating on top, its edge in hazard paint)
  k.comp();
  k.box({ x: 0, z: 0, y: deck - 0.2, w: W, d: D, h: 0.2, faces: { top: deckTop, front: tex('kddeckedge', (px, w, h) => { px(0, 0, w, h, 0xd0ac5e); for (let x = 0; x < w; x += 4) px(x, 0, 2, h, 0x302a2a); }), sides: STEEL_D } });
  if (make === 'cab') {
    // (a glazed cab on the deck: its lower wall, the glass all round at eye height, its roof)
    k.comp();
    k.box({ x: 0, z: 0, y: deck, w: W, d: D, h: 1.0, faces: { front: tex('kdcabwall', (px, w, h, p) => paintedSteel(px, 0, 0, w, h, { c: 0xdad0bc, ppm: p, seed: 9 })), sides: tone(0xdad0bc, -0.1), top: 0x7c7f86 } });
    k.box({ x: 0, z: 0, y: deck + 1.0, w: W - 0.1, d: D - 0.1, h: top - deck - 1.4, faces: { front: glassFace, sides: 0x2b3a44, top: 0x31292a } });
    k.box({ x: 0, z: 0, y: top - 0.4, w: W, d: D, h: 0.4, faces: { front: fasciaFace('RANGE CONTROL'), top: tex('kdroof', (px, w, h) => { px(0, 0, w, h, 0x7c736b); bevel(px, 0, 0, w, h, 0x7c736b, 1); }), sides: tone(0xdad0bc, -0.15) } });
  } else {
    // (the rail on the south, east and west edges, its gap at the ladder; posts at the corners up to the shade)
    k.comp();
    const gx = [(-1.45 + W / 2) / W, (-0.95 + W / 2) / W];
    k.box({ x0: -W / 2, x1: W / 2, z0: D / 2 - 0.05, z1: D / 2, y0: deck, y1: deck + 1.05, faces: { front: railFace(gx), back: railFace(gx) }, only: ['front', 'back'] });
    for (const sx of [-1, 1]) k.box({ x0: sx * W / 2 - (sx > 0 ? 0.05 : 0), x1: sx * W / 2 + (sx < 0 ? 0.05 : 0), z0: -D / 2, z1: D / 2, y0: deck, y1: deck + 1.05, faces: { top: 0xd0ac5e, sides: 0xd0ac5e } });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * hw, z: sz * hd, y: deck, w: 0.1, d: 0.1, h: (sz < 0 ? top - 0.3 : deck + 1.05) - deck, faces: { sides: STEEL, front: tex('kdpost', (px, w, h) => { px(0, 0, w, h, STEEL); px(0, 0, 1, h, tone(STEEL, 0.1)); }) } });
    // (the sunshade over the deck's north half, sloping, with the PA horns and a fascia on its front edge)
    k.comp();
    k.box({ x: 0, z: -D / 4, y: top - 0.3, w: W, d: D / 2, h: 0.3, faces: { front: fasciaFace('RANGE'), top: tex('kdshade', (px, w, h) => { px(0, 0, w, h, 0x7c736b); for (let j = 1; j < h; j += 3) px(0, j, w, 1, tone(0x7c736b, -0.08)); bevel(px, 0, 0, w, h, 0x7c736b, 1); }), sides: tone(0x7c736b, -0.15) } });
    for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.35), z: 0.05, y: top - 0.45, w: 0.32, d: 0.2, h: 0.24, faces: { front: hornFace, sides: 0x31292a, top: 0x31292a } });
  }
  // (the flag's pole at its corner, from the deck to 11.5 m; the flag is the stage's)
  if (look.flag) {
    k.comp();
    const [fx, fz] = look.flag;
    k.box({ x: fx, z: fz, y: deck, w: 0.07, d: 0.07, h: 11.5 - deck, faces: { front: tex('kdpole', (px, w, h) => { px(0, 0, w, h, 0xd6d0c9); px(w - 1, 0, 1, h, tone(0xd6d0c9, -0.2)); }), sides: 0xb7b0a8, top: 0xd0ac5e } });
  }
  void ppm;
}

// ---------- the frames and their cards ----------

/** A card's painting at the density: its side in pixels and its rings (see CARD_K, CARD_RINGS_CM). */
export function cardPx(ppm) { return Math.max(5, Math.round(CARD_RINGS_CM.side / 100 * CARD_K * ppm)); }
/** Pixels a centimetre on the card as drawn (the stage's holes use the same). */
export const cardPxPerCm = (ppm) => CARD_K * ppm / 100;
/** The 25 m card's face: white paper, the black to the 4 ring (the 5 within it in grey at 24 px/m), the 2 ring's line (and the 3's at 24 px/m). */
export function paintCard(px, x0, y0, ppm) {
  const n = cardPx(ppm), k = cardPxPerCm(ppm), c = (n - 1) / 2 + 0.5;
  px(x0, y0, n, n, C.paper);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const r = Math.hypot(i + 0.5 - c, j + 0.5 - c) / k;
    if (r <= CARD_RINGS_CM.black) px(x0 + i, y0 + j, 1, 1, r <= CARD_RINGS_CM.five && ppm >= 20 ? 0x31292a : 0x1a1214);
    // (the scoring rings' lines on the white: the 2 ring's edge, and the 3 ring's where the density parts them)
    else if (Math.abs(r - CARD_RINGS_CM.two) < 0.5 / k || (ppm >= 20 && Math.abs(r - CARD_RINGS_CM.three) < 0.5 / k)) px(x0 + i, y0 + j, 1, 1, 0x7c736b);
  }
  px(x0 + n - 1, y0, 1, n, tone(C.paper, -0.12)); px(x0, y0 + n - 1, n, 1, tone(C.paper, -0.12));
}
/** The backer's face: cardboard on its frame, the card at CARD_AT_M, the lane's number at the top edge. */
const backerFace = (make, lane) => tex(`kdbacker:${make}:${lane}`, (px, w, h, ppm) => {
  px(0, 0, w, h, BOARD_D);
  px(1, 1, w - 2, h - 2, 0xc4ac97);
  for (let j = 2; j < h - 1; j += Math.max(3, Math.round(0.2 * ppm))) px(1, j, w - 2, 1, tone(0xc4ac97, -0.04));
  bevel(px, 0, 0, w, h, BOARD_D, 1.0);
  if (make === 'chest') {
    const cx = w / 2, s = 0x264c35;
    for (let j = Math.round(h * 0.12); j < h - 2; j++) { const t = j / h, half = t < 0.35 ? w * 0.12 : w * 0.34; px(Math.round(cx - half), j, Math.round(2 * half), 1, s); }
  } else {
    const n = cardPx(ppm), cx = Math.round(w / 2 - n / 2), cy = Math.round(h - CARD_AT_M.y * ppm - n / 2);   // (the backer stands on the ground: its bottom row is y 0)
    paintCard(px, cx, cy, ppm);
  }
  if (lane && make === 'chest') { const f = fontFor(ppm), s = String(lane); f.stencil(px, Math.floor((w - f.width(s)) / 2), 2, s, C.ink); }
});

export function kdFrame(k, o) {
  const { W, ppm } = o, make = o.make ?? 'card25', look = o.look ?? {};
  const H = 1.2, post = 0.06;
  k.comp();
  for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - post / 2), z: -0.04, w: post, d: post, h: o.H ?? 1.35, faces: { front: tex('kdframepost', (px, w, h) => { px(0, 0, w, h, BOARD_D); px(0, 0, 1, h, tone(BOARD_D, 0.1)); }), sides: tone(BOARD_D, -0.1), top: BOARD } });
  k.comp();
  k.box({ x: 0, z: 0, y: 0, w: W, d: 0.03, h: H, faces: { front: backerFace(make, look.lane ?? 0), back: BOARD_D, sides: BOARD_D, top: BOARD } });
  // (a sandbag at each foot, on the face we see)
  k.comp();
  for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.12), z: 0.06, w: 0.22, d: 0.08, h: 0.1, faces: { front: tex('kdbag', (px, w, h, p) => { cloth(px, 0, 0, w, h, 0x9c917a, { u: U(p) }); px(0, 0, w, 1, tone(0x9c917a, 0.06)); px(0, h - 1, w, 1, tone(0x9c917a, -0.12)); }), sides: 0x7f735a, top: 0x9c917a } });
  void ppm;
}

// ---------- the mats ----------

const matTop = (make, lane) => tex(`kdmat:${make}:${lane}`, (px, w, h, ppm) => {
  const c = make === 'rubber' ? 0x31292a : MAT;
  if (make === 'rubber') { px(0, 0, w, h, c); for (let j = 1; j < h; j += 3) for (let i = (j % 2) + 1; i < w; i += 3) px(i, j, 1, 1, tone(c, 0.06)); }
  else cloth(px, 0, 0, w, h, c, { u: U(ppm), seed: 9 + lane });
  // (the binding round its edge, a grommet in each corner, a worn patch where the elbows go)
  const b = Math.max(1, Math.round(U(ppm)));
  px(0, 0, w, b, tone(c, -0.15)); px(0, h - b, w, b, tone(c, -0.15)); px(0, 0, b, h, tone(c, -0.12)); px(w - b, 0, b, h, tone(c, -0.18));
  for (const [x, y] of [[b + 1, b + 1], [w - b - 2, b + 1], [b + 1, h - b - 2], [w - b - 2, h - b - 2]]) px(x, y, 1, 1, 0xb7b0a8);
  if (make !== 'rubber') px(Math.round(w * 0.2), Math.round(h * 0.15), Math.max(2, Math.round(w * 0.6)), Math.max(2, Math.round(h * 0.12)), tone(c, 0.05));
});
export function kdMat(k, o) {
  const { W, D } = o, make = o.make ?? 'canvas', lane = o.look?.lane ?? 0;
  k.comp();
  k.ground({ x0: -W / 2, z0: -D / 2, x1: W / 2, z1: D / 2, top: matTop(make, lane), lift: 0.008 });
}

// ---------- the berm ----------

const earthTop = (step) => tex(`kdbermtop:${step}`, (px, w, h, ppm) => regolith(px, 0, 0, w, h, { c: tone(EARTH, -0.04 + step * 0.025), ppm, seed: 13 + step, dust: 0.3 + step * 0.1 }));
const earthEnd = (step) => tex(`kdbermend:${step}`, (px, w, h, ppm) => {
  regolith(px, 0, 0, w, h, { c: tone(EARTH, -0.12), ppm, seed: 17 + step, dust: 0.1 });
  for (let j = 2; j < h; j += Math.max(3, Math.round(0.25 * ppm))) for (let i = 0; i < w; i++) if (hash3(i, j, step) % 5 === 0) px(i, j, 1, 1, tone(EARTH, -0.2));
  px(0, 0, w, 1, tone(EARTH, 0.05));
});
const bagFace = tex('kdbermbags', (px, w, h, ppm) => {
  const bw = Math.max(4, Math.round(0.5 * ppm)), bh = Math.max(2, Math.round(0.17 * ppm));
  for (let j = 0, row = 0; j < h; j += bh, row++) for (let i = -(row % 2) * Math.round(bw / 2); i < w; i += bw) {
    cloth(px, Math.max(0, i), j, Math.min(bw, w - Math.max(0, i)), Math.min(bh, h - j), 0x9c917a, { u: U(ppm), seed: row });
    px(Math.max(0, i), j + bh - 1, Math.min(bw, w - Math.max(0, i)), 1, tone(0x9c917a, -0.14));
    if (i + bw - 1 < w && i + bw - 1 >= 0) px(i + bw - 1, j, 1, bh, tone(0x9c917a, -0.1));
  }
});
export function berm(k, o) {
  const { W, D } = o, H = o.H ?? 3.0, make = o.make ?? 'earth', steps = 4, run = D / steps;
  // (local +z is its face to the line; each step set back by a quarter of its depth and 0.75 m higher)
  for (let s = 0; s < steps; s++) {
    k.comp();
    const z1 = D / 2 - s * run, y1 = H * (s + 1) / steps, front = s === 0 && make === 'sandbag' ? bagFace : earthEnd(s);
    k.box({ x0: -W / 2 + s * 0.15, x1: W / 2 - s * 0.15, z0: -D / 2 + (s === steps - 1 ? 0.4 : 0), z1, y0: s ? H * s / steps : 0, y1, faces: { top: earthTop(s), front, left: earthEnd(s), right: earthEnd(s), back: earthEnd(s) } });
  }
}

// ---------- the fence and the rope ----------

const meshFace = tex('kdmesh', (px, w, h, ppm) => {
  px(0, 0, w, h, null);
  const d = Math.max(3, Math.round(0.12 * ppm));
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j) % d === 0 || (i - j + 1000 * d) % d === 0) px(i, j, 1, 1, 0x7c7f86);
  px(0, 0, w, Math.max(1, Math.round(0.05 * ppm)), 0x565b67); px(0, h - 1, w, 1, 0x565b67);
});
const ropeFace = tex('kdrope', (px, w, h, ppm) => {
  px(0, 0, w, h, null);
  const seg = Math.max(3, Math.round(0.25 * ppm));
  for (let x = 0; x < w; x++) px(x, 0, 1, h, Math.floor(x / seg) % 2 ? 0xdad0bc : C.red);
});
export function rangeFence(k, o) {
  const { W, ppm } = o, make = o.make ?? 'mesh';
  k.comp();
  if (make === 'rope') {
    const H = 0.85;
    for (let x = -W / 2; x <= W / 2 + 1e-6; x += Math.max(1, W / Math.max(1, Math.round(W / 2)))) k.box({ x: Math.max(-W / 2 + 0.03, Math.min(W / 2 - 0.03, x)), z: 0, w: 0.05, d: 0.05, h: H + 0.1, faces: { front: tex('kdstake', (px, w, h) => { px(0, 0, w, h, 0xd0ac5e); px(0, 0, w, 2, 0x302a2a); }), sides: 0xb28a59, top: 0x302a2a } });
    k.box({ x0: -W / 2, x1: W / 2, z0: -0.01, z1: 0.01, y0: H - 0.04, y1: H, faces: { front: ropeFace, top: C.red }, only: ['front', 'top'] });
    return;
  }
  const H = o.H ?? 2.4, P3 = 3;
  k.box({ x0: -W / 2, x1: W / 2, z0: -0.02, z1: 0.02, y0: 0, y1: H, faces: { front: meshFace, back: meshFace }, only: ['front', 'back'] });
  for (let x = -W / 2; x <= W / 2 + 1e-6; x += P3) k.box({ x: Math.max(-W / 2 + 0.04, Math.min(W / 2 - 0.04, x)), z: 0, w: 0.08, d: 0.08, h: H + 0.1, faces: { sides: 0x565b67, top: tone(0x565b67, 0.08) } });
  void ppm;
}

// ---------- the boards ----------

const boardFace = (make, text) => tex(`kdsign:${make}:${text}`, (px, w, h, ppm) => {
  const bg = make === 'lane' ? C.mcrnD : make === 'notice' ? C.red : C.paper, ink = make === 'distance' ? C.ink : C.paper;
  px(0, 0, w, h, bg); bevel(px, 0, 0, w, h, bg, 1.0);
  const f = fontFor(ppm), tw = f.width(text);
  if (tw <= w - 2) f.stencil(px, Math.floor((w - tw) / 2), Math.floor((h - f.h) / 2), text, ink);
});
export function rangeSign(k, o) {
  const { ppm } = o, make = o.make ?? 'lane', text = String(o.look?.text ?? '').toUpperCase();
  if (make === 'flagpole') {
    k.comp();
    k.box({ x: 0, z: 0, w: 0.15, d: 0.1, h: 0.25, faces: { front: tex('kdpolebase', (px, w, h, p) => concrete(px, 0, 0, w, h, { c: 0x9c917a, ppm: p, seed: 5 })), sides: 0x7f735a, top: 0x9c917a } });
    k.box({ x: 0, z: 0, y: 0.25, w: 0.06, d: 0.06, h: 3.35, faces: { front: tex('kdpole', (px, w, h) => { px(0, 0, w, h, 0xd6d0c9); px(w - 1, 0, 1, h, tone(0xd6d0c9, -0.2)); }), sides: 0xb7b0a8, top: 0xd0ac5e } });
    return;
  }
  const f = fontFor(ppm), bw = Math.max(0.3, (f.width(text) + 4) / ppm), bh = Math.max(0.25, (f.h + 4) / ppm);
  const H = o.H ?? 1.3, top = make === 'lane' ? H : H - 0.2;
  k.comp();
  for (const sx of make === 'lane' ? [0] : [-1, 1]) k.box({ x: sx * (bw / 2 - 0.03), z: 0, w: 0.05, d: 0.05, h: top - bh * 0.5, faces: { front: tex('kdsignpost', (px, w, h) => { px(0, 0, w, h, 0x8c6d59); px(0, 0, 1, h, tone(0x8c6d59, 0.1)); }), sides: 0x573a37, top: 0x8c6d59 } });
  k.comp();
  k.box({ x: 0, z: 0.03, y: top - bh, w: Math.min(bw, o.W ?? bw), d: 0.03, h: bh, faces: { front: boardFace(make, text), sides: C.ink, top: C.ink } });
}

void P;
