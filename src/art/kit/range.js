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
// 0.0.7 (the build sheet 0.0.7 §2.3, §2.4 (b); PLACES §4.12, WEAPONS §11.5): the rest of the KD ground. The
// long north-south pieces (the parapet, the pits, the berm) stand as the range role lays them, facing 'left'
// (their front to the line, west) with w their run along it and d their depth from it, stretched by the
// piece's own w and d; in the piece's frame x runs along them and +z toward the line:
//   kdCarrier   'frame', 'timber': a target carrier's frame on its rails in the pits, low (its uprights to
//               the parapet's top, 0.5 m, so nothing stands up from the pits but the face it carries): the
//               face itself rides it and is the stage's (src/render/range.js: it moves, so it is drawn each
//               frame at the sim's height, FACE_K times life size);
//   kdParapet   'concrete', 'earth': the pits' front wall, 0.5 m over the ground, its top a coping in 5 m
//               bays, its ends the wall's section (the range role lays its back wall and ends with it too);
//   kdPits      'trench', 'timber': the trench's mouth as the camera sees it from above at 45° (the ground
//               is one quad a chunk at y 0, so the trench is painted, not cut: a dark floor with the shadow of
//               the parapet's lip, a duckboard walk, a drain); the faces sink into it as they go down;
//   kdBerm      'earth', 'terraced': the impact berm, four steps of 2 m rising east away from the line (8 m),
//               each step's lip pocked where rounds have gone in, its ends the section;
//   kdFlag      'sleeve', 'timber': a range flag's pole, 4.5 m, dark steel, its swivel at the top (the sleeve is the
//               stage's, blowing by the sim's wind: src/render/range-items.js sleevePixels);
//   kdPoint     'stake', 'post': a firing point's numbered stake, the lane's number (look.text) on a plate
//               bigger than life, the kit's way with small things;
//   kdLineBoard 'distance', 'frame': the line's distance board ("200", "300", "500": look.text) on two posts;
//   kdCanopy    'open', 'tarp': the ammunition point, an open canopy 6 × 4 m on four posts over its bench
//               and its ammunition boxes;
//   rangeShack  'shut', 'store': the range's shack, 12 × 8 m, shut this round (its door closed, its windows
//               shuttered), its sign over the door.
// The faces' paintings (paintKdFace: the A and B targets, KD_FACES' rings) are here too, as the 25 m card's
// are: the stage draws the faces from them.
// Pure.
import { tex, rotPainter } from './kit.js';
import { C, U, P, bevel, cloth, tone, hash3 } from './common.js';
import { paintedSteel, concrete, regolith, tile } from '../materials/index.js';
import { paint } from '../paint.js';
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

// (a fence's and a rope's faces are short repeats along their run, never a painting the run's length: the KD's rope is
// 541 m, past an atlas page; the 0.0.7 review's, my call)
const fencePm = new Map();
const meshFace = (ppm, H) => { const key = `mesh:${ppm}:${H}`; let p = fencePm.get(key); if (!p) fencePm.set(key, (p = paint(Math.max(3, Math.round(0.12 * ppm)), Math.max(2, Math.round(H * ppm)), (px, w, h) => {
  px(0, 0, w, h, null);
  const d = w;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j) % d === 0 || (i - j + 1000 * d) % d === 0) px(i, j, 1, 1, 0x7c7f86);
  px(0, 0, w, Math.max(1, Math.round(0.05 * ppm)), 0x565b67); px(0, h - 1, w, 1, 0x565b67);
}))); return p; };
const ropeFace = (ppm) => { const key = `rope:${ppm}`; let p = fencePm.get(key); if (!p) fencePm.set(key, (p = paint(2 * Math.max(3, Math.round(0.25 * ppm)), 1, (px, w) => { px(0, 0, w / 2, 1, C.red); px(w / 2, 0, w / 2, 1, 0xdad0bc); }))); return p; };
export function rangeFence(k, o) {
  const { W, ppm } = o, make = o.make ?? 'mesh';
  k.comp();
  if (make === 'rope') {
    const H = 0.85;
    for (let x = -W / 2; x <= W / 2 + 1e-6; x += Math.max(1, W / Math.max(1, Math.round(W / 2)))) k.box({ x: Math.max(-W / 2 + 0.03, Math.min(W / 2 - 0.03, x)), z: 0, w: 0.05, d: 0.05, h: H + 0.1, faces: { front: tex('kdstake', (px, w, h) => { px(0, 0, w, h, 0xd0ac5e); px(0, 0, w, 2, 0x302a2a); }), sides: 0xb28a59, top: 0x302a2a } });
    k.box({ x0: -W / 2, x1: W / 2, z0: -0.01, z1: 0.01, y0: H - 0.04, y1: H, faces: { front: ropeFace(ppm), top: C.red }, only: ['front', 'top'] });
    return;
  }
  const H = o.H ?? 2.4, P3 = 3;
  k.box({ x0: -W / 2, x1: W / 2, z0: -0.02, z1: 0.02, y0: 0, y1: H, faces: { front: meshFace(ppm, H), back: meshFace(ppm, H) }, only: ['front', 'back'] });
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


// ---------- the KD ground (0.0.7) ----------

/** The KD faces drawn this many times life size (the build sheet 0.0.7 §2.4: a 1.0 m A face 32 px at 16 px/m, its black 10 px, a hole 1 px). */
export const FACE_K = 2;
/**
 * The KD faces as drawn (WEAPONS §11.1; the ballistics role's paper.js PAPERS kdA and kdB, their numbers, the
 * picture's copy as CARD_RINGS_CM is the card's): the paper's side, a ring's width and the black's radius, cm.
 * The rings: V within half a ring width, 5 within one, 4 within two (the black), 3 within three, 2 within four.
 */
export const KD_FACES = Object.freeze({
  kdA: Object.freeze({ sideCm: 100, ringCm: 7.5, blackCm: 15 }),
  kdB: Object.freeze({ sideCm: 120, ringCm: 11.25, blackCm: 22.5 }),
});
/** A KD face's side in pixels as drawn at the density (32 px for the A face at 16 px/m). */
export const facePx = (paper, ppm) => Math.max(8, Math.round((KD_FACES[paper] ?? KD_FACES.kdA).sideCm / 100 * FACE_K * ppm));
/** Pixels a centimetre on a KD face as drawn (0.32 at 16 px/m). */
export const facePxPerCm = (ppm) => FACE_K * ppm / 100;
/**
 * A KD face's painting at (x0, y0), n × n pixels (facePx): white paper, the black to the 4 ring with the 5 and
 * the V rings' lines in it in grey where the density parts them, the 3 and 2 rings' lines on the white, a
 * timber edge (the frame the paper is stapled to).
 */
export function paintKdFace(px, x0, y0, ppm, paper = 'kdA') {
  const F = KD_FACES[paper] ?? KD_FACES.kdA, n = facePx(paper, ppm), k = facePxPerCm(ppm), c = n / 2, w = F.ringCm;
  px(x0, y0, n, n, C.paper);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const r = Math.hypot(i + 0.5 - c, j + 0.5 - c) / k, edge = 0.55 / k;
    if (r <= F.blackCm) px(x0 + i, y0 + j, 1, 1, ppm >= 20 && (Math.abs(r - w) < edge || Math.abs(r - w / 2) < edge) ? 0x49403e : 0x1a1214);
    else if (Math.abs(r - 3 * w) < edge || Math.abs(r - 4 * w) < edge) px(x0 + i, y0 + j, 1, 1, 0x7c736b);
  }
  px(x0, y0, n, 1, BOARD_D); px(x0, y0 + n - 1, n, 1, BOARD_D); px(x0, y0, 1, n, BOARD_D); px(x0 + n - 1, y0, 1, n, tone(BOARD_D, -0.1));
}

const CONCRETE = 0x9c917a, PIT = 0x49403e, POLE_D = 0x3b3f47;
const steelFace = (c) => tex(`kdsteel:${c}`, (px, w, h) => { px(0, 0, w, h, c); px(0, 0, 1, h, tone(c, 0.1)); px(w - 1, 0, 1, h, tone(c, -0.15)); });
const timberFace = tex('kdtimber', (px, w, h) => { px(0, 0, w, h, BOARD_D); for (let j = 2; j < h; j += 3) px(0, j, w, 1, tone(BOARD_D, -0.06)); px(0, 0, 1, h, tone(BOARD_D, 0.08)); });

export function kdCarrier(k, o) {
  const { W, D } = o, make = o.make ?? 'steel', post = make === 'timber' ? timberFace : steelFace(STEEL), top = make === 'timber' ? BOARD : STEEL;
  // (the rails along the pit's floor under it, then two uprights to the parapet's top and the cross-head the face's frame drops into;
  // all of it behind the face's plane, local z < 0, so the face drawn over it covers its middle)
  k.comp();
  for (const sx of [-1, 1]) k.box({ x: sx * (W / 2 - 0.06), z: -D / 2 + 0.08, w: 0.1, d: 0.1, h: 0.5, faces: { front: post, sides: tone(top, -0.12), top } });
  k.box({ x0: -W / 2, x1: W / 2, z0: -D / 2, z1: -D / 2 + 0.06, y0: 0.42, y1: 0.5, faces: { front: tex('kdcrosshead', (px, w, h) => { px(0, 0, w, h, top); px(0, h - 1, w, 1, tone(top, -0.2)); }), sides: tone(top, -0.1), top } });
  k.comp();
  for (const sz of [-1, 1]) k.box({ x0: -W / 2, x1: W / 2, z0: sz * D / 2 - (sz > 0 ? 0.05 : 0), z1: sz * D / 2 + (sz < 0 ? 0.05 : 0), y0: 0, y1: 0.06, faces: { front: STEEL_D, sides: STEEL_D, top: tone(STEEL, -0.05) } });
}

// (the long pieces' tops are tiles, a pattern of a few metres repeated along the 100 m from the piece's own corner, never a
// painting 1,600 px long: a chunk's page stays small, the kit's rule for floors)
const pms = new Map();
const keepPm = (key, w, h, draw) => { let p = pms.get(key); if (!p) pms.set(key, (p = paint(w, h, draw))); return p; };
// (a top's tile in the piece's frame: columns along its run (x), rows across it, row 0 its back (east), the last its front (west))
const copingTile = (ppm, D) => keepPm(`kdcoping:${ppm}:${D}`, Math.round(5 * ppm), Math.max(2, Math.round(D * ppm)), (px, w, h) => {
  concrete(px, 0, 0, w, h, { c: tone(CONCRETE, 0.04), ppm, seed: 21 });
  px(w - 1, 0, 1, h, tone(CONCRETE, -0.1));                         // (a joint every 5 m)
  px(0, h - 1, w, 1, tone(CONCRETE, 0.12)); px(0, 0, w, 1, tone(CONCRETE, -0.2));
});
const parapetEnd = tex('kdparapetend', (px, w, h, ppm) => { concrete(px, 0, 0, w, h, { c: tone(CONCRETE, -0.08), ppm, seed: 23 }); px(0, 0, w, 1, tone(CONCRETE, 0.08)); });
const bankTile = (ppm, D) => keepPm(`kdbank:${ppm}:${D}`, Math.round(4 * ppm), Math.max(2, Math.round(D * ppm)), (px, w, h) => regolith(px, 0, 0, w, h, { c: EARTH, ppm, seed: 25, dust: 0.3 }));
export function kdParapet(k, o) {
  const { W, D, ppm } = o, H = o.H ?? 0.5, make = o.make ?? 'concrete';
  k.comp();
  if (make === 'earth') {
    // (a bank of rammed regolith faced with sandbags, its top at the parapet's height)
    k.box({ x0: -W / 2, x1: W / 2, z0: -D / 2, z1: D / 2, y0: 0, y1: H, faces: { top: bankTile(ppm, D), front: bagFace, back: bagFace, sides: parapetEnd } });
    return;
  }
  k.box({ x0: -W / 2, x1: W / 2, z0: -D / 2, z1: D / 2, y0: 0, y1: H, faces: { top: copingTile(ppm, D), sides: parapetEnd } });
}

const pitFloor = (make, ppm, D) => keepPm(`kdpitfloor:${make}:${ppm}:${D}`, Math.round(2 * ppm), Math.max(4, Math.round(D * ppm)), (px, w, h) => {
  // (the trench seen from above, rows from its back (east) to its front (west): a drain at the back, a duckboard
  // walk along it, the floor dark in the parapet's shadow toward the front)
  if (make === 'timber') { px(0, 0, w, h, PIT); for (let j = 0; j < h; j += Math.max(3, Math.round(0.25 * ppm))) px(0, j, w, 1, tone(PIT, -0.12)); }
  else concrete(px, 0, 0, w, h, { c: tone(PIT, 0.04), ppm, seed: 31 });
  const shade = Math.max(2, Math.round(1.2 * ppm));
  for (let j = 0; j < shade && j < h; j++) px(0, h - 1 - j, w, 1, tone(PIT, -0.24 + 0.2 * j / shade));
  const walk0 = Math.round(h * 0.3), walkW = Math.max(3, Math.round(0.8 * ppm));
  for (let i = 0; i < w; i++) px(i, walk0, 1, walkW, i % Math.max(2, Math.round(0.15 * ppm)) ? BOARD_D : tone(BOARD_D, -0.25));
  px(0, Math.max(1, Math.round(0.3 * ppm)), w, 1, 0x14151c);
});
export function kdPits(k, o) {
  const { W, D, ppm } = o, make = o.make ?? 'trench';
  k.comp();
  k.ground({ x0: -W / 2, z0: -D / 2, x1: W / 2, z1: D / 2, top: pitFloor(make, ppm, D), lift: 0.004 });
}

const bermTop = (step, ppm) => tile('regolith', { metres: 4, ppm, c: tone(EARTH, -0.06 + step * 0.03), seed: 41 + step, dust: 0.25 });
// (a step's lip to the line pocked where rounds go in: a strip a metre deep, repeated along it)
const pocks = (step, ppm) => keepPm(`kdpocks:${step}:${ppm}`, Math.round(3 * ppm), Math.round(1.2 * ppm), (px, w, h) => {
  px(0, 0, w, h, null);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (hash3(i, j, 77 + step) % 19 === 0) px(i, j, 1, 1, tone(EARTH, -0.3));
});
export function kdBerm(k, o) {
  const { W, D, ppm } = o, H = o.H ?? 8, make = o.make ?? 'earth', steps = 4, run = D / steps;
  // (each step set back from the line by a quarter of the depth and H / 4 higher; the terraced make's risers faced with sandbags)
  for (let s = 0; s < steps; s++) {
    k.comp();
    const z1 = D / 2 - s * run, y0 = s ? H * s / steps : 0, y1 = H * (s + 1) / steps, x0 = -W / 2 + s * 0.2, x1 = W / 2 - s * 0.2;
    k.box({ x0, x1, z0: -D / 2, z1, y0, y1, faces: { top: bermTop(s, ppm), front: make === 'terraced' ? bagFace : tone(EARTH, -0.1), back: tone(EARTH, -0.14), left: earthEnd(s), right: earthEnd(s) } });
    k.ground({ x0, z0: z1 - 1.2, x1, z1, y: y1, top: pocks(s, ppm), lift: 0.004 });
  }
}

export function kdFlag(k, o) {
  // (the steel pole dark and plain, a pixel wide at 16 px/m: the sleeve's red and white is the sleeve's alone, so the
  // sleeve hanging along its pole never reads as the pole (it was white banded red every 6 px: the user's report of
  // v0.0.7, 2026-11-07, read pole and sleeve as one))
  const H = o.H ?? 4.5, make = o.make ?? 'steel', pole = make === 'timber' ? timberFace : tex('kdflagpole', (px, w, h) => { px(0, 0, w, h, POLE_D); px(w - 1, 0, 1, h, tone(POLE_D, -0.25)); });
  k.comp();
  k.box({ x: 0, z: 0, w: 0.1, d: 0.1, h: 0.2, faces: { front: tex('kdflagbase', (px, w, h, p) => concrete(px, 0, 0, w, h, { c: CONCRETE, ppm: p, seed: 7 })), sides: tone(CONCRETE, -0.15), top: CONCRETE } });
  k.box({ x: 0, z: 0, y: 0.2, w: 0.06, d: 0.06, h: H - 0.3, faces: { front: pole, sides: tone(POLE_D, -0.25), top: POLE_D } });
  k.box({ x: 0, z: 0, y: H - 0.12, w: 0.1, d: 0.1, h: 0.12, faces: { front: STEEL_D, sides: STEEL_D, top: STEEL } });
}

export function kdPoint(k, o) {
  const { ppm } = o, H = o.H ?? 0.6, make = o.make ?? 'stake', text = String(o.look?.text ?? '');
  const f = fontFor(ppm), pw = Math.max(0.3, (f.width(text || '0') + 3) / ppm), ph = Math.max(0.25, (f.h + 3) / ppm);
  k.comp();
  k.box({ x: 0, z: 0, w: 0.08, d: 0.08, h: H - ph * 0.5, faces: { front: make === 'post' ? steelFace(0x565b67) : tex('kdstakeface', (px, w, h) => { px(0, 0, w, h, 0xd0ac5e); px(0, h - 3, w, 3, 0x302a2a); }), sides: 0xb28a59, top: 0x302a2a } });
  // (the plate: bigger than life, the lane's number white on the Corps' red, so it reads from the line at 16 px/m)
  k.comp();
  k.box({ x: 0, z: 0.05, y: H - ph, w: pw, d: 0.02, h: ph, faces: { front: tex(`kdpointplate:${text}`, (px, w, h, p) => { const g = fontFor(p); px(0, 0, w, h, C.mcrnD); bevel(px, 0, 0, w, h, C.mcrnD, 1.0); if (g.width(text) <= w - 2) g.stencil(px, Math.floor((w - g.width(text)) / 2), Math.floor((h - g.h) / 2), text, C.paper); }), sides: C.ink, top: C.ink } });
}

export function kdLineBoard(k, o) {
  const { W, ppm } = o, H = o.H ?? 2.0, make = o.make ?? 'board', text = String(o.look?.text ?? '').toUpperCase();
  const f = fontFor(ppm), bh = Math.max(0.5, (f.h * 2 + 6) / ppm), bw = Math.min(W, Math.max(1.0, (f.width(text) * 2 + 8) / ppm));
  k.comp();
  for (const sx of [-1, 1]) k.box({ x: sx * (bw / 2 - 0.05), z: 0, w: 0.08, d: 0.08, h: H - 0.05, faces: { front: make === 'frame' ? steelFace(0x565b67) : tex('kdboardpost', (px, w, h) => { px(0, 0, w, h, BOARD_D); px(0, 0, 1, h, tone(BOARD_D, 0.1)); }), sides: 0x573a37, top: BOARD } });
  k.comp();
  // (the distance in doubled letters, black on white: read across the range from the next line)
  k.box({ x: 0, z: 0.05, y: H - bh, w: bw, d: 0.03, h: bh, faces: { front: tex(`kdlineboard:${make}:${text}`, (px, w, h, p) => {
    const g = fontFor(p), bg = make === 'frame' ? 0xdad0bc : C.paper;
    px(0, 0, w, h, bg); bevel(px, 0, 0, w, h, bg, 1.0); px(0, 0, w, 1, C.red); px(0, h - 1, w, 1, C.red);
    // (doubled where the board is wide enough, else at the alphabet's own size)
    const tw = g.width(text) * 2 + 1, x0 = Math.floor((w - tw) / 2), y0 = Math.floor((h - g.h * 2) / 2);
    if (tw <= w - 2) g.stencil((x, y, ww, hh, c) => px(x0 + (x - x0) * 2, y0 + (y - y0) * 2, ww * 2, hh * 2, c), x0, y0, text, C.ink);
    else if (g.width(text) <= w - 2) g.stencil(px, Math.floor((w - g.width(text)) / 2), Math.floor((h - g.h) / 2), text, C.ink);
  }), sides: C.ink, top: C.ink } });
}

const tarpTop = (make) => tex(`kdtarp:${make}`, (px, w, h, ppm) => {
  const c = make === 'tarp' ? 0x96694f : 0x737949;
  cloth(px, 0, 0, w, h, c, { u: U(ppm), seed: 5 });
  for (let i = Math.round(1.5 * ppm); i < w; i += Math.round(1.5 * ppm)) px(i, 0, 1, h, tone(c, -0.12));
  px(0, h - 1, w, 1, tone(c, -0.25));
});
const crateFace = tex('kdammocrate', (px, w, h, p) => { px(0, 0, w, h, 0x4c633d); px(0, 0, w, 1, tone(0x4c633d, 0.1)); px(0, h - 1, w, 1, tone(0x4c633d, -0.2)); const g = fontFor(p); if (g.width('AMMO') <= w - 2 && g.h <= h - 2) g.stencil(px, Math.floor((w - g.width('AMMO')) / 2), Math.floor((h - g.h) / 2), 'AMMO', 0xd0ac5e); });
export function kdCanopy(k, o) {
  const { W, D } = o, H = o.H ?? 3.0, make = o.make ?? 'open', post = steelFace(0x565b67);
  // (four posts, the roof sloping down to the south, open on every side: the camera sees under its front edge)
  k.comp();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * (W / 2 - 0.08), z: sz * (D / 2 - 0.08), w: 0.1, d: 0.1, h: (sz < 0 ? H : H - 0.4) - 0.1, faces: { front: post, sides: 0x565b67, top: 0x565b67 } });
  k.comp();
  k.box({ x0: -W / 2, x1: W / 2, z0: -D / 2, z1: D / 2, y0: H - 0.5, y1: H - 0.4, faces: { top: tarpTop(make), front: tone(make === 'tarp' ? 0x96694f : 0x737949, -0.2), sides: tone(make === 'tarp' ? 0x96694f : 0x737949, -0.25) } });
  // (the issuing bench under it, and the ammunition boxes on it and beside it)
  k.comp();
  k.box({ x: 0, z: -0.6, w: W * 0.6, d: 0.7, h: 0.8, faces: { front: tex('kdbench', (px, w, h) => { px(0, 0, w, h, BOARD); px(0, 0, w, 2, tone(BOARD, 0.08)); px(0, h - 1, w, 1, tone(BOARD, -0.3)); for (let i = 2; i < w; i += 9) px(i, 2, 1, h - 3, tone(BOARD, -0.15)); }), top: BOARD, sides: BOARD_D } });
  for (let i = 0; i < 3; i++) { k.comp(); k.box({ x: -W * 0.22 + i * 0.6, z: -0.6, y: 0.8, w: 0.45, d: 0.25, h: 0.2, faces: { front: crateFace, top: tone(0x4c633d, 0.06), sides: tone(0x4c633d, -0.1) } }); }
  k.comp();
  k.box({ x: W / 2 - 0.7, z: 0.6, w: 0.9, d: 0.5, h: 0.4, faces: { front: crateFace, top: tone(0x4c633d, 0.06), sides: tone(0x4c633d, -0.1) } });
}

const shackWall = (make) => tex(`kdshackwall:${make}`, (px, w, h, ppm) => {
  paintedSteel(px, 0, 0, w, h, { c: 0xc4ac97, ppm, seed: 3 });
  // (a door in the middle, shut, and a window either side, its shutter down; the store has a roller door instead)
  const dw = Math.round((make === 'store' ? 2.4 : 1.0) * ppm), dh = Math.round(2.1 * ppm), dx = Math.floor((w - dw) / 2);
  px(dx, h - dh, dw, dh, make === 'store' ? 0x7c7f86 : 0x6e272f);
  if (make === 'store') for (let j = h - dh + 1; j < h; j += 2) px(dx, j, dw, 1, tone(0x7c7f86, -0.12));
  else { px(dx + dw - 3, h - Math.round(1.05 * ppm), 2, 1, 0xd0ac5e); bevel(px, dx, h - dh, dw, dh, 0x6e272f, 1.0); }
  for (const s of [-1, 1]) {
    const ww = Math.round(1.4 * ppm), wh = Math.round(0.9 * ppm), wx = Math.floor(w / 2 + s * w * 0.3 - ww / 2), wy = Math.round(0.9 * ppm);
    px(wx, wy, ww, wh, 0x7c736b);
    for (let j = wy + 1; j < wy + wh; j += 2) px(wx, j, ww, 1, tone(0x7c736b, -0.15));
  }
  px(0, h - 2, w, 2, tone(0xc4ac97, -0.25));
});
export function rangeShack(k, o) {
  const { W, D } = o, H = o.H ?? 3.4, make = o.make ?? 'shut';
  k.comp();
  k.box({ x0: -W / 2, x1: W / 2, z0: -D / 2, z1: D / 2, y0: 0, y1: H - 0.3, faces: { front: shackWall(make), sides: tone(0xc4ac97, -0.12), top: 0x7c736b } });
  k.comp();
  k.box({ x0: -W / 2, x1: W / 2, z0: -D / 2, z1: D / 2, y0: H - 0.3, y1: H, faces: { front: fasciaFace(make === 'store' ? 'RANGE STORE' : 'RANGE'), top: tex('kdshackroof', (px, w, h) => { px(0, 0, w, h, 0x7c736b); for (let j = 3; j < h; j += 4) px(0, j, w, 1, tone(0x7c736b, -0.08)); bevel(px, 0, 0, w, h, 0x7c736b, 1); }), sides: tone(0x7c736b, -0.15) } });
}
void P;

// ---------- the 0.0.8 round: the pairs pad on the 25 m bay (the build sheet 0.0.8 §2.3, §2.4; PLACES §4.12) ----------
//
// kdTurner   'stand', 'frame': a turning target's stand, 1 m in front of its lane's frame (the scene's PAIRS): a steel
//            motor box on the regolith, sandbagged, its shaft up through a bearing to the clamp the face hangs on.
//            The face itself is the stage's (src/render/range.js: it turns, so it is drawn each frame edge-on to
//            facing over the turner's real TURN_MS, TURNER_K times life size, never a pop); with no face hung (test-
//            handling, test-range) the stand alone shows: a box at the frame's foot and a thin shaft beside it, so the
//            card and the line stay as they were scored.
//   kdPaint  'line', 'worn': a firing line painted across the pad (w its run along the lanes, 0.1 m wide), its
//            distance stencilled beside it on the piece's front (the line's side when laid facing 'left', as the KD's
//            long pieces are; look.side −1 its back) in the density's alphabet (look.text '7 M' or '10 M'), at look.at
//            (metres along the run from its start) or, by default, every 3 m about its middle; the words painted so
//            they read upright from the camera whichever way the piece is laid.
/** The turner's motor box and its shaft's clamp height (m: the face hangs on the clamp, PAIRS.face.centreY 1.35 m). */
export const TURNER_BOX = Object.freeze({ w: 0.42, d: 0.26, h: 0.28 }), TURNER_CLAMP_Y = 1.0;
/** The motor box's steel by make (grey, not the Corps' olive: in olive at 16 px/m it read as a small marine at the frame's foot). */
const TURNER_STEEL = Object.freeze({ stand: 0x6e7582, frame: 0x565b67 });
const motorFace = (make) => tex(`kdturnerbox:${make}`, (px, w, h, ppm) => {
  // (on every upright face: the piece is laid facing the line, so the camera sees its side)
  const c = TURNER_STEEL[make] ?? TURNER_STEEL.stand;
  px(0, 0, w, h, c); bevel(px, 0, 0, w, h, c, 1.0);
  // (a hazard band along its top, the vent's slots, the cable gland)
  const b = Math.max(1, Math.round(0.04 * ppm));
  for (let i = 0; i < w; i++) px(i, 0, 1, b, (Math.floor(i / Math.max(2, b * 2)) % 2) ? C.hazardD : C.hazard);
  for (let i = Math.round(w * 0.15); i < w * 0.55; i += 2) px(i, b + 2, 1, Math.max(1, h - b - 4), tone(c, -0.18));
  px(w - Math.max(2, b * 2) - 1, h - Math.max(2, b * 2) - 1, Math.max(2, b * 2), Math.max(2, b * 2), C.gunmetal);
});
export function kdTurner(k, o) {
  const make = o.make ?? 'stand', B = TURNER_BOX, H = o.H ?? 1.75;
  k.comp();
  k.box({ x: 0, z: 0, w: B.w, d: B.d, h: B.h, faces: { front: motorFace(make), back: motorFace(make), sides: motorFace(make), top: tone(TURNER_STEEL[make] ?? TURNER_STEEL.stand, 0.08) } });
  // (a sandbag over its skirt on the face we see)
  k.box({ x: -B.w / 4, z: B.d / 2 + 0.04, w: 0.2, d: 0.08, h: 0.08, faces: { front: tex('kdturnerbag', (px, w, h, p) => { cloth(px, 0, 0, w, h, 0x9c917a, { u: U(p) }); px(0, 0, w, 1, tone(0x9c917a, 0.06)); }), sides: 0x7f735a, top: 0x9c917a } });
  // (the shaft, its bearing collar, and the clamp the face hangs on: thin, so a stand with no face hides nothing)
  k.comp();
  k.box({ x: 0, z: 0, y: B.h, w: 0.04, d: 0.04, h: TURNER_CLAMP_Y - B.h, faces: { front: tex('kdturnershaft', (px, w, h) => { px(0, 0, w, h, C.steelD); px(0, 0, 1, h, tone(C.steelD, 0.12)); }), sides: C.steelDD, top: C.steel } });
  k.box({ x: 0, z: 0, y: B.h, w: 0.08, d: 0.08, h: 0.05, faces: { front: C.gunmetal, sides: C.gunmetal, top: C.steelD } });
  k.box({ x: 0, z: 0, y: TURNER_CLAMP_Y - 0.03, w: 0.3, d: 0.03, h: 0.03, faces: { front: tex('kdturnerclamp', (px, w, h) => { px(0, 0, w, h, C.steelD); px(0, 0, w, 1, tone(C.steelD, 0.15)); }), sides: C.steelDD, top: C.steel } });
  void H;
}

/** The painted lines' white, worn and fresh (my calls: the Corps' range paint on regolith). */
const LINE_WHITE = 0xe6ddc8;
/** The labels' places along a run of w metres: look.at, else every LABEL_EVERY_M about its middle, an odd count (symmetric, so a run laid either way puts them in the same places). */
export const LABEL_EVERY_M = 3;
export function paintLabelsAt(w, at = null) {
  if (Array.isArray(at) && at.length) return at.filter(Number.isFinite);
  const n = Math.max(1, Math.floor(w / LABEL_EVERY_M) - (Math.floor(w / LABEL_EVERY_M) % 2 === 0 ? 1 : 0)), out = [];
  for (let i = 0; i < n; i++) out.push(w / 2 + (i - (n - 1) / 2) * LABEL_EVERY_M);
  return out;
}
const lineTop = (make) => tex(`kdpaintline:${make}`, (px, w, h, ppm) => {
  // (the run's long axis is whichever of w and h is longer: a top's painting turns with the piece)
  px(0, 0, w, h, LINE_WHITE);
  const along = w >= h, n = along ? w : h;
  for (let i = 0; i < n; i++) {
    const hsh = hash3(i, make === 'worn' ? 31 : 17, 5) % 100;
    // (regolith ground into the paint: worn, a gap in three; fresh, a speck now and then)
    if (hsh < (make === 'worn' ? 30 : 6)) { if (along) px(i, hsh % h, 1, 1, tone(LINE_WHITE, -0.22)); else px(hsh % w, i, 1, 1, tone(LINE_WHITE, -0.22)); }
  }
});
/** The label's painting as seen from the camera (upright), w × h pixels: the words in the density's alphabet, painted on the regolith. */
const labelWorld = (text, make) => tex(`kdpaintlabel:${make}:${text}`, (px, w, h, ppm) => {
  const g = fontFor(ppm), c = make === 'worn' ? tone(LINE_WHITE, -0.12) : LINE_WHITE;
  if (g.width(text) <= w) g.stencil(px, Math.floor((w - g.width(text)) / 2), Math.floor((h - g.h) / 2), text, c);
});
export function kdPaint(k, o) {
  const W = o.W ?? 18.6, D = Math.max(0.05, o.D ?? 0.1), make = o.make ?? 'line', text = String(o.look?.text ?? '').toUpperCase();
  k.comp();
  k.ground({ x0: -W / 2, z0: -D / 2, x1: W / 2, z1: D / 2, top: lineTop(make), lift: 0.006 });
  if (!text) return;
  // (the words beside the line on the side look.side names: +1 the piece's front (the default), −1 its back; each
  // painted upright for the camera: a top's painting turns with the piece, so the label goes in turned back by the
  // piece's own turn, and the two turns cancel)
  const f = fontFor(o.ppm ?? 16), ppm = o.ppm ?? 16, side = o.look?.side === -1 ? -1 : 1;
  const lw = (f.width(text) + 4) / ppm, lh = (f.h + 4) / ppm;
  // (in the world the label is lw wide (x) and lh deep (z); in the piece's frame those swap on a quarter turn)
  const odd = k.q % 2 === 1, ax = odd ? lh : lw, az = odd ? lw : lh;
  const painter = rotPainter(labelWorld(text, make), (4 - k.q) & 3);
  for (const p of paintLabelsAt(W, o.look?.at)) {
    const x = p - W / 2, z = side * (D / 2 + 0.12 + az / 2);
    k.ground({ x0: x - ax / 2, z0: z - az / 2, x1: x + ax / 2, z1: z + az / 2, top: painter, lift: 0.006 });
  }
}

// ---------- the 0.0.9 round: the training bang (the build sheet 0.0.9 §2.2, §2.3; COMBAT §11.4) ----------
// kdBang: a reloadable training bang's body, a 5 × 12 cm olive canister with its pale band and black caps, lying on its
// side ('olive'), or spent and scorched ('spent'). RANGE_KINDS lists it (the scene role's, no instance placed: the
// ground's golden is unchanged); the bang thrown and lying on the pad is the stage's (src/render/bangs.js), drawn bigger
// than life as the kit draws small things.
const BANG_OLIVE = 0x4f5638, BANG_BAND = 0xc9c09a, BANG_CAP = 0x23252f, BANG_SCORCH = 0x2c2b27;
export function kdBang(k, o) {
  const make = o.make ?? 'olive', W = o.W ?? 0.05, D = o.D ?? 0.05, H = o.H ?? 0.12, body = make === 'spent' ? BANG_SCORCH : BANG_OLIVE;
  k.comp();
  // (lying along x: its length H across, its width the height; a band round its middle, the caps at its ends)
  k.box({ x: 0, z: 0, w: H, d: D, h: W, faces: { front: tex(`kdbang:${make}`, (px, w, h) => { px(0, 0, w, h, body); px(Math.floor(w / 2) - 1, 0, 2, h, make === 'spent' ? tone(BANG_BAND, -0.4) : BANG_BAND); px(0, 0, 1, h, BANG_CAP); px(w - 1, 0, 1, h, BANG_CAP); }), sides: BANG_CAP, top: tone(body, 0.08) } });
}
