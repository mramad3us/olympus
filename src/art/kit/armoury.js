// OLYMPUS art: the armoury's pieces, the issue window, the clearing barrel, the cleaning table, the solvent tank and the air hose's reel (the build sheet v0.0.28 §1 C, item 19).
//
// (The kit's armoury.js. The place is src/data/places/armoury.js, the rifle's records src/sim/arms/armoury.js, T's lines
// src/sim/skills/instinct/armoury.js.) "The window and the canopy" draws your R-7 at the armoury's south front and cleans it under the
// canopy. Each piece is its catalogue's size (src/sim/places/fixtures.js, pinned equal to FOOTPRINTS by places-validate); the camera
// looks north and 45° down, so each reads by its top and its south face (kit.js):
//   issueWindow     the window in the armoury's south face, its middle on the wall line (the place's FRONT): the counter, 1.1 m high
//                   and 0.6 m deep, straddling the line, its top worn; the wall over the opening from WINDOW_HEAD_M 2.1 m up to the
//                   building's height (look.headM, which ground.js passes), in the façade's own world-anchored painting (base.js
//                   facadeTile's, so its bricks run on from the building's face), over the bay the place takes out of
//                   the building (look.bayM deep); the bay's back dark behind the armourer, so through the opening (1.1 to 2.1 m) the
//                   camera sees him from the hip to the chest (samples/armoury-day W-a, the default until scored). Makes 'counter'
//                   (W-a: the upper half open) and 'grille' (W-b: bars over the opening's upper half, seen through);
//   clearingBarrel  the porch's sand drum, olive with its rolled hoops, its tube at 45° into the sand: the tube's dark mouth on
//                   its north rim, the side the marine stands at, the tube's run toward the canopy painted on the drum's top as the
//                   sand round it; makes 'drum' and 'squat' (lower, wider hoops: the built-in other look);
//   cleanTable      a cleaning table under the canopy, 2.4 × 0.9 m and 0.9 m high: its steel top with oil stains by the piece's seed,
//                   an apron under its edge and four legs with a shelf low between them (rags and a can on it, by seed); makes
//                   'steel' (the samples' grey green) and 'board' (a timber top on steel legs);
//   solventTank     a parts washer: a red drum-tank with its lid, a sink on its top with the brush's hose, a hazard band; makes
//                   'red' and 'grey';
//   airHose         a reel on its post, 1.6 m: the post, the reel at 1.1 to 1.4 m with the yellow hose coiled on it and its nozzle
//                   hung on a hook; makes 'reel' and 'coil' (the hose hung in loops from a bracket).
// Not sampled (the build sheet §10: built at these, listed in the set's "about"): the barrel, the tables, the tanks and the hoses;
// the window's two looks are W's. The colours are the samples' where the sample draws the piece (the counter, the table) and the
// kit's (common.js C) elsewhere. Pure.
import { tex } from './kit.js';
import { C, bevel } from './common.js';
import { tone, hash3, mixHex } from '../tone.js';
import { paint, GLOW } from '../paint.js';
import { sinteredBrick } from '../materials/index.js';
import { GROUND } from '../terrain/ground.js';

/** The window's look until the user scores samples/armoury-day W (W-a's colours: the counter's face and top, the bay's inside, the grille's bars); the wall is the façade's (src/art/terrain/base.js FACADE, its roof ROOF). */
export const WINDOW_LOOK = Object.freeze({ counter: 0x6a5a44, top: 0x8a7658, inside: 0x3a3630, bar: 0x4a4c50, wall: 0xa78c77, roof: 0x7c736b });
/** The window's opening, metres off the ground (the place's WINDOW_SILL_M and WINDOW_HEAD_M: the counter's top and the opening's head). */
export const SILL_M = 1.1, HEAD_M = 2.1;
/** The table's look (the sample's F crop: its top, its face, its legs). */
export const TABLE_LOOK = Object.freeze({ top: 0x6a6e62, face: 0x55584e, leg: 0x3e403a, board: 0x8c6d59 });

// ---------- the issue window ----------

const counterFace = tex('arm:counter', (px, w, h, ppm) => {
  const L = WINDOW_LOOK.counter, kick = Math.max(2, Math.round(0.15 * ppm));
  px(0, 0, w, h, L);
  for (let x = Math.max(2, Math.round(0.3 * ppm)); x < w - 1; x += Math.max(3, Math.round(0.3 * ppm))) px(x, 2, 1, h - kick - 3, tone(L, -0.1));
  px(0, h - kick, w, kick, tone(L, -0.22));                                     // (the kick plate, scuffed)
  for (let x = 0; x < w; x++) if (hash3(x, 7) % 4 === 0) px(x, h - kick, 1, 1, tone(L, -0.05));
  bevel(px, 0, 0, w, h, L, 1.0);
});
const counterTop = tex('arm:countertop', (px, w, h) => {
  const T = WINDOW_LOOK.top;
  px(0, 0, w, h, T);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (hash3(i, j, 3) % 23 === 0) px(i, j, 1, 1, tone(T, -0.08));   // (worn by a thousand rifles)
  px(0, h - 1, w, 1, tone(T, 0.1));                                              // (its front edge, lit)
});
// (the wall over the opening: the façade's own painting (src/art/terrain/base.js facadeTile, the same moves on the same seed: a 3 m bay of
// sintered block, a window a storey, the coping, the plinth), world-anchored as it is, so the bricks run on from the building's face
// unbroken; kept by the building's height, the one thing it depends on)
const FACADE_BAY_M = 3.0, STOREY_M = 3.4;
const facades = new Map();
function wallFace(H, ppm) {
  const key = `arm:facade:${H}:${ppm}`, c = WINDOW_LOOK.wall;
  let pm = facades.get(key);
  if (pm) return pm;
  const w = Math.round(FACADE_BAY_M * ppm), h = Math.max(4, Math.round(H * ppm));
  pm = paint(w, h, (px) => {
    sinteredBrick(px, 0, 0, w, h, { c, ppm, seed: 21 });
    const storeys = Math.max(1, Math.round(H / STOREY_M));
    for (let s = 0; s < storeys; s++) {
      const floorY = h - Math.round(s * STOREY_M * ppm), ww = Math.round(0.9 * ppm), wh = Math.round(1.0 * ppm), wx = Math.round((w - ww) / 2), wy = floorY - Math.round(2.1 * ppm);
      if (wy < 2) continue;
      px(wx - 1, wy - 1, ww + 2, wh + 2, tone(c, -0.25));
      px(wx, wy, ww, wh, 0x2b3a44, GLOW.NIGHT);
      px(wx, wy, ww, Math.max(1, Math.round(wh * 0.3)), 0x3c5d84, GLOW.NIGHT);
      px(wx + Math.floor(ww / 2), wy, 1, wh, tone(c, -0.12));
      px(wx - 1, wy + wh, ww + 2, Math.max(1, Math.round(0.06 * ppm)), tone(c, 0.12));
      if (s > 0) px(0, floorY, w, 1, tone(c, -0.08));
    }
    px(0, 0, w, Math.max(2, Math.round(0.15 * ppm)), tone(c, 0.08)); px(0, Math.max(2, Math.round(0.15 * ppm)), w, 1, tone(c, -0.15));
    const pl = Math.max(2, Math.round(0.3 * ppm)); px(0, h - pl, w, pl, tone(c, -0.1));
    for (let i = 0; i < w; i++) if (hash3(i, 3) % 3 === 0) px(i, h - pl - 1, 1, 1, mixHex(c, GROUND.dust, 0.5));
  }, { repeat: true, key });
  facades.set(key, pm);
  return pm;
}
const grilleFace = tex('arm:grille', (px, w, h) => {
  px(0, 0, w, h, null);
  for (let i = 0; i < w; i += 3) px(i, 0, 1, h, WINDOW_LOOK.bar);
  px(0, h - 1, w, 1, WINDOW_LOOK.bar);
});
/** The issue window (see the header): the counter on the wall line, the wall over the opening, the bay's dark back. */
export function issueWindow(k, o) {
  const { W, D, H } = o, make = o.make ?? 'counter', bay = o.look?.bayM ?? 1.2, top = o.look?.headM ?? 4.0;
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: H, faces: { front: counterFace, top: counterTop, sides: tone(WINDOW_LOOK.counter, -0.15) } });
  // (the wall over the opening, flush with the façade's line (the piece's z 0), from the head to the roof, over the whole bay)
  k.comp();
  k.box({ x0: -W / 2, x1: W / 2, z0: -bay, z1: 0, y0: HEAD_M, y1: top, faces: { front: wallFace(top, o.ppm), top: WINDOW_LOOK.roof, sides: tone(WINDOW_LOOK.wall, -0.12), back: tone(WINDOW_LOOK.wall, -0.2) } });
  // (the bay's back, dark, behind the armourer: the inside as the opening shows it)
  k.box({ x0: -W / 2, x1: W / 2, z0: -bay, z1: -bay + 0.05, y0: 0, y1: HEAD_M, faces: { front: WINDOW_LOOK.inside, sides: WINDOW_LOOK.inside, top: WINDOW_LOOK.inside } });
  if (make === 'grille') {
    // (W-b: bars over the opening's upper half, on the wall line, seen through)
    k.comp();
    k.box({ x0: -W / 2, x1: W / 2, z0: -0.02, z1: 0, y0: (SILL_M + HEAD_M) / 2, y1: HEAD_M, faces: { front: grilleFace, back: grilleFace, sides: WINDOW_LOOK.bar, top: WINDOW_LOOK.bar } });
  }
}

// ---------- the clearing barrel ----------

const SAND = 0xb89a68, DRUM = 0x4c633d;
const drumFace = (make) => tex(`arm:drum:${make}`, (px, w, h, ppm) => {
  px(0, 0, w, h, DRUM);
  px(0, 0, Math.max(1, Math.round(w * 0.2)), h, tone(DRUM, 0.07));               // (the drum's round, lit on its left)
  px(w - Math.max(1, Math.round(w * 0.2)), 0, Math.max(1, Math.round(w * 0.2)), h, tone(DRUM, -0.1));
  const hoops = make === 'squat' ? [0.3, 0.7] : [0.2, 0.5, 0.8];
  for (const t of hoops) px(0, Math.round(h * t), w, Math.max(1, Math.round(0.03 * ppm)), tone(DRUM, -0.2));
  px(0, 0, w, 1, tone(DRUM, 0.12));
  // (a stencilled band: the clearing drum's yellow)
  px(Math.round(w * 0.25), Math.round(h * 0.32), Math.round(w * 0.5), Math.max(1, Math.round(0.05 * ppm)), C.hazard);
});
const drumTop = tex('arm:drumtop', (px, w, h, ppm) => {
  px(0, 0, w, h, null);
  const cx = w / 2, cy = h / 2, r = w / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy);
    if (d > r) continue;
    px(i, j, 1, 1, d > r - 1 ? tone(DRUM, -0.15) : hash3(i, j, 5) % 5 ? SAND : tone(SAND, -0.1));
  }
  // (the tube at 45°: its run down into the sand toward the canopy (+z, south), its mouth at the north rim)
  const tw = Math.max(2, Math.round(0.1 * ppm));
  for (let j = Math.round(h * 0.2); j < Math.round(h * 0.75); j++) px(Math.round(cx - tw / 2), j, tw, 1, tone(SAND, -0.18));
  px(Math.round(cx - tw / 2), Math.round(h * 0.12), tw, Math.max(1, Math.round(tw * 0.8)), C.ink);
});
/** The clearing barrel (see the header): the drum, its sand and the tube's mouth on its north rim. */
export function clearingBarrel(k, o) {
  const { W, D } = o, make = o.make ?? 'drum', H = make === 'squat' ? o.H * 0.85 : o.H;
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: H, faces: { front: drumFace(make), top: drumTop, sides: tone(DRUM, -0.12) } });
  // (the tube's lip standing a little proud of the sand, at the north rim)
  k.box({ x: 0, z: -D * 0.3, y: H, w: 0.12, d: 0.1, h: 0.08, faces: { front: tone(C.steelD, -0.1), top: C.ink, sides: C.steelDD } });
}

// ---------- the cleaning table ----------

const tableTop = (make, seed) => tex(`arm:tabletop:${make}:${seed % 4}`, (px, w, h, ppm) => {
  const T = make === 'board' ? TABLE_LOOK.board : TABLE_LOOK.top;
  px(0, 0, w, h, T);
  if (make === 'board') for (let j = 0; j < h; j += Math.max(2, Math.round(0.15 * ppm))) px(0, j, w, 1, tone(T, -0.1));
  // (oil and solvent stains, a few, by the piece's seed)
  for (let n = 0; n < 4; n++) {
    const hx = hash3(seed, n, 13) % w, hy = hash3(seed, n, 17) % h, r = 1 + (hash3(seed, n, 19) % 2);
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r && hash3(hx + i, hy + j, n) % 3) px(hx + i, hy + j, 1, 1, tone(T, -0.12));
  }
  px(0, 0, w, 1, tone(T, 0.08)); px(0, h - 1, w, 1, tone(T, -0.15));
});
const tableApron = (make) => tex(`arm:tableapron:${make}`, (px, w, h) => { const F = make === 'board' ? tone(TABLE_LOOK.board, -0.15) : TABLE_LOOK.face; px(0, 0, w, h, F); px(0, 0, w, 1, tone(F, 0.1)); px(0, h - 1, w, 1, tone(F, -0.2)); });
/** The cleaning table (see the header): the top and its apron, four legs, a shelf low between them with what lies on it. */
export function cleanTable(k, o) {
  const { W, D, H, seed } = o, make = o.make ?? 'steel', t = 0.06, apron = 0.1, leg = 0.06;
  k.comp();
  k.box({ x: 0, z: 0, y: H - t, w: W, d: D, h: t, faces: { front: tableApron(make), top: tableTop(make, seed), sides: TABLE_LOOK.face } });
  k.box({ x: 0, z: D / 2 - 0.04, y: H - t - apron, w: W - 0.1, d: 0.03, h: apron, faces: { front: tableApron(make), sides: TABLE_LOOK.face, top: TABLE_LOOK.face } });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * (W / 2 - 0.08), z: sz * (D / 2 - 0.08), w: leg, d: leg, h: H - t, faces: { sides: TABLE_LOOK.leg, top: TABLE_LOOK.leg } });
  k.box({ x: 0, z: 0, y: 0.15, w: W - 0.2, d: D - 0.2, h: 0.03, faces: { front: TABLE_LOOK.leg, top: tone(TABLE_LOOK.leg, 0.1), sides: TABLE_LOOK.leg } });
  // (on the shelf, by seed: a rag, and an oil can at one end)
  if (seed % 2) k.box({ x: -W * 0.25, z: 0, y: 0.18, w: 0.25, d: 0.2, h: 0.03, faces: { front: C.linen, top: C.linen, sides: tone(C.linen, -0.1) } });
  k.box({ x: W * (seed % 3 ? 0.35 : -0.35), z: 0.05, y: 0.18, w: 0.08, d: 0.08, h: 0.14, faces: { front: C.red, top: C.steelD, sides: tone(C.red, -0.15) } });
}

// ---------- the solvent tank ----------

const tankFace = (make) => tex(`arm:tank:${make}`, (px, w, h, ppm) => {
  const B = make === 'grey' ? C.greyEnamel : C.red;
  px(0, 0, w, h, B);
  bevel(px, 0, 0, w, h, B, 1.0);
  px(0, Math.round(h * 0.18), w, Math.max(1, Math.round(0.06 * ppm)), C.hazard);  // (the hazard band under the lid)
  px(Math.round(w * 0.3), Math.round(h * 0.45), Math.round(w * 0.4), Math.max(2, Math.round(0.12 * ppm)), C.paper);   // (the label)
});
const tankTop = tex('arm:tanktop', (px, w, h, ppm) => {
  px(0, 0, w, h, C.steelD);
  const m = Math.max(1, Math.round(0.06 * ppm));
  px(m, m, w - 2 * m, h - 2 * m, 0x5a4a2a);                                        // (the solvent in the sink)
  px(m, m, w - 2 * m, 1, tone(0x5a4a2a, 0.15));
});
/** The solvent tank (see the header): the tank, its sink and the brush's hose. */
export function solventTank(k, o) {
  const { W, D, H } = o, make = o.make ?? 'red';
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: H, faces: { front: tankFace(make), top: tankTop, sides: tone(make === 'grey' ? C.greyEnamel : C.red, -0.15) } });
  k.box({ x: W / 2 - 0.08, z: -D / 2 + 0.06, y: H, w: 0.04, d: 0.04, h: 0.15, faces: { sides: C.steelD, top: C.steelD } });   // (the brush's hose, its neck over the sink)
}

// ---------- the air hose ----------

const HOSE = 0xd0ac5e;
const reelFace = (make) => tex(`arm:reel:${make}`, (px, w, h) => {
  px(0, 0, w, h, null);
  if (make === 'coil') { for (let j = 0; j < h; j++) { const x = Math.round(w / 2 + Math.sin(j / 2) * (w / 3)); px(x, j, 1, 1, HOSE); } return; }
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy); if (d <= r) px(i, j, 1, 1, d > r - 1 ? C.steelDD : d < r * 0.35 ? C.steelD : (i + j) % 2 ? HOSE : tone(HOSE, -0.15)); }
});
/** The air hose's reel on its post (see the header). */
export function airHose(k, o) {
  const { H } = o, make = o.make ?? 'reel';
  k.comp();
  k.box({ x: 0, z: 0, w: 0.08, d: 0.08, h: H, faces: { sides: C.greyD, top: C.greyD } });
  k.box({ x: 0, z: 0.06, y: 1.1, w: 0.3, d: 0.08, h: 0.3, faces: { front: reelFace(make), back: reelFace(make), sides: C.steelDD, top: C.steelDD } });
  k.box({ x: 0.1, z: 0.1, y: 0.75, w: 0.04, d: 0.04, h: 0.25, faces: { sides: C.ink, top: C.ink } });     // (the nozzle on its hook)
}
