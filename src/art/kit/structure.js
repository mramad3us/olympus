// OLYMPUS art: the building's own pieces. Wall clocks, stairs and their wells, lamp posts, door leaves.
//
// The 0.0.3 kinds (the build sheet's §2.1 and §2.3; PLACES §4.4 Echo Company's barracks, §4.1 the
// company streets), each built in its own frame (src/art/kit/kit.js: x across, z toward its front, y up,
// the origin on the floor at its middle, or a wall piece's foot on the wall's face):
//   wallClock   0.30 × 0.05 × 0.30 in life, drawn DIAL_PX_MIN 9 px square at least (0.56 m at the user's
//               16 px/m, bigger than life as VIEWS §2.2 allows where a thing must read: a 5 px dial's
//               hands were a smudge, v0.0.3's review), hung on a wall at its y or standing on a desk: a case, a cream dial
//               with its twelve marks, and no hands. The hands are the stage's (src/render/clocks.js), drawn
//               from places' wallClockAt each game minute over the dial the maker reports (place()'s dials:
//               each face's box as the builder snapped it, and which way it faces), so the
//               face and the watch never disagree and nothing in the area's atlas is repainted. Makes
//               'school' (the round wall clock of every room) and 'station' (the duty desk's two-faced
//               clock on its stand, MELAS on the front, UTC on the back: look.faces);
//   stairs      1.2 × 4.8: a flight drawn in plan, as the floor it stands on sees it (the sim walks it at the
//               floor's height, so a flight drawn rising would sink the figure into its treads): treads with
//               their nosings, darker the higher they go, a handrail each side; its front (+z) is the foot of
//               the flight and its back the top (places' fixtures.js states the same rule). dir 'up' (floor 1:
//               the flight going up) or 'down'; makes 'concrete' (a cast flight, steel nosings) and 'steel';
//   stairsWell  1.2 × 4.8 × 1.0: the floor above's view of the same stair: its landing at the back, the top
//               STAIR_TOP_M of the flight one walks onto from this floor (lit treads, the floor's level at
//               the back edge), the well open down to the floor below from the landing's edge to the front
//               (treads falling away into the dark), and a guard rail on its two long sides and its far end;
//               makes 'rail' and 'wall' (a solid parapet).
//   Each stair carries a mark on the end one steps on from its floor (stairEnd: a flight that climbs at
//   its foot, a well at its landing, so the landing and the mark lie exactly where places' blockRectOf
//   leaves the well open and the portal's band takes one down): a solid triangle over its word, "▲ UP"
//   or "▼ DOWN" in the kit's pixel font, amber paint, the word on a dark plate, painted upright on the
//   screen whatever way the flight runs (its painting turned back by the piece's turn), so up and down
//   read at a glance (the user, 2026-11-06, upstairs at the east well: "cannot cross the space to head
//   downstairs again, is it intentional ?": v0.0.4 drew the well's landing and its arrow at its north
//   end, the sim's open top is its south). A maker leaves what it drew in k.stair ({ dir, mark, and a
//   well's landing, open and guard: the world rects and boxes }), which the stairs test reads;
//   lampPost    0.25 × 0.25 × 4.0: a pole on a cast base, an arm, the lamp's head with its lens under it
//               (glow class NIGHT: lit when the sky's glow says, VIEWS §2.7); makes 'sodium' (a street's)
//               and 'flood' (the fence's, its head tilted out). Its pool is places' (lampsOf), not the kit's;
//   doorLeaf    a door's leaf as the stage swings it (src/render/props.js): a slab `w` across, 0.045 thick,
//               `h` tall, its hinge at the origin, the leaf running +x from it; its face painted on both
//               sides (a door, its kick plate, its handle, a vision panel where the make has one): makes
//               'interior' (PLACES §1.6's hinged door, grey), 'ext' (the weather door, steel, a wired
//               window), 'office' (wood).
// Pure.
import { tex, rotPainter } from './kit.js';
import { C, U, P, bevel, sunk, tone, hash3 } from './common.js';
import { paintedSteel, concrete, grimeFoot } from '../materials/index.js';
import { fontFor } from './type.js';
import { GLOW } from '../paint.js';

/** A stair's walkable top in the well above (PLACES's STAIR_TOP_M), metres. */
export const STAIR_TOP_M = 1.0;
/** A wall clock's height on a wall when the fixture gives none, metres (my call: over a door's head). */
export const CLOCK_Y_M = 2.15;
/** The fewest pixels a clock's dial is drawn across: an hour hand and a minute hand told apart (see the header). */
export const DIAL_PX_MIN = 9;
/** A dial's side in pixels at a density: odd, so the hands have a middle pixel (9 at 16 px/m and at 24). */
export const dialPx = (ppm) => Math.max(DIAL_PX_MIN, Math.round(0.3 * ppm) | 1);
/** A door leaf's thickness, metres. */
export const LEAF_T_M = 0.045;

// ---------- wall clocks ----------

const CASES = { school: 0x31292a, station: 0x3e424d };
/** The dial: cream, a dark rim, twelve marks (the quarters longer); w × h px, its middle the hands' axis. */
const dialFace = (make, rim) => tex(`clockdial:${make}:${rim}`, (px, w, h) => {
  const cx = (w - 1) / 2, cy = (h - 1) / 2, R = Math.min(w, h) / 2;
  // (a round school clock's corners are its wall's case; a station clock's square face is all dial)
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const d = Math.hypot(i - cx, j - cy);
    px(i, j, 1, 1, d > R - 0.5 ? rim : C.paper);
  }
  if (make === 'station') { px(0, 0, w, 1, rim); px(0, h - 1, w, 1, rim); px(0, 0, 1, h, rim); px(w - 1, 0, 1, h, rim); }
  // (the quarters' marks, where the dial has the pixels for them: 7 px and up)
  if (w >= 7) for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) px(Math.round(cx + dx * (R - 1.5)), Math.round(cy + dy * (R - 1.5)), 1, 1, tone(C.paper, -0.25));
});

/** A wall clock (see the header): its y the dial's foot on the wall, or a desk's top for the station make. */
export function wallClock(k, o) {
  const make = o.make ?? 'school', rim = CASES[make] ?? CASES.school, look = o.look ?? {}, two = (look.faces ?? o.faces ?? ['melas']).length > 1;
  k.comp();
  // (the case an odd number of pixels square, so the hands have a middle pixel: dialPx, 9 at 16 px/m and at 24)
  const ppm = o.ppm, S = dialPx(ppm) / ppm, D = 0.05, px1 = 1 / ppm;
  if (make === 'station') {
    // (a stand on the desk: a foot and a stem, the case over them)
    k.box({ x: 0, z: 0, w: 0.16, d: 0.08, h: 0.03, faces: { sides: tone(rim, -0.05), top: rim } });
    k.box({ x: 0, z: 0, y: 0.03, w: 0.03, d: 0.03, h: 0.03, faces: { sides: rim } });
  }
  // (on a wall the bigger dial keeps the life-size one's middle, in whole pixels, so it clears the wall's
  // top and the door frames as the authored y says; on the desk's stand it stands on the stand)
  const y0 = make === 'station' ? 0.06 : Math.round((0.3 * ppm - dialPx(ppm)) / 2) / ppm;
  const face = dialFace(make, rim), edge = tex(`clockedge:${rim}`, (px, w, h) => { px(0, 0, w, h, rim); px(0, 0, w, 1, tone(rim, 0.1)); });
  // (the case behind the dial; the dial its whole front, the rim painted in it, sized by its centre so it is
  // square in pixels at both densities: 9 × 9)
  k.box({ x: 0, z: 0, y: y0, w: S, d: D - 0.02, h: S, faces: { front: rim, back: rim, top: edge, sides: rim } });
  k.dials = [{ which: 'front', box: k.box({ x: 0, z: D / 2 - 0.005, y: y0, w: S, d: 0.01, h: S, faces: { front: face, top: edge, sides: rim }, only: ['front', 'top'] }) }];
  if (two) k.dials.push({ which: 'back', box: k.box({ x: 0, z: -D / 2 + 0.005, y: y0, w: S, d: 0.01, h: S, faces: { back: face, sides: rim }, only: ['back'] }) });
  void px1; void ppm;
}

// ---------- stairs ----------

const STAIR_C = { concrete: 0x9c917a, steel: 0x7c7f86 };
/** A flight seen from above, its foot at the bottom row: treads every 0.28 m, nosings, darker toward the top. */
const flightTop = (make, dir) => tex(`flight:${make}:${dir}`, (px, w, h, p) => {
  const c = STAIR_C[make] ?? STAIR_C.concrete, u = U(p), tread = Math.max(4, Math.round(0.28 * p)), n = Math.floor(h / tread);
  for (let k = 0; k < n + 1; k++) {
    const y = h - (k + 1) * tread, t = k / Math.max(1, n), cc = tone(c, dir === 'up' ? -0.16 * t : -0.05 - 0.2 * t);
    px(0, y, w, tread, cc);
    px(0, y, w, 1, make === 'steel' ? tone(C.steel, 0.04 - 0.1 * t) : tone(0xb7b0a8, -0.1 * t));   // (the nosing)
    px(0, y + tread - 1, w, 1, tone(cc, -0.12));                       // (the riser's shadow under the next)
    if (make === 'steel') for (let i = 2; i < w - 2; i += Math.max(3, Math.round(3 * u))) px(i, y + 2, 1, tread - 4, tone(cc, -0.05));
  }
});
/** A well's landing seen from above: the flight's top treads, the floor's level at the top row (the piece's back), each a step down toward the well. */
const landingTop = tex('stairlanding', (px, w, h, p) => {
  const c = STAIR_C.concrete, tread = Math.max(4, Math.round(0.28 * p)), n = Math.ceil(h / tread);
  for (let k = 0; k < n; k++) {
    const y = k * tread, t = k / Math.max(1, n), cc = tone(c, -0.02 - 0.14 * t);
    px(0, y, w, tread, cc);
    px(0, y + tread - 2, w, 1, tone(0xb7b0a8, -0.1 * t));             // (the nosing, where the tread drops to the next)
    px(0, y + tread - 1, w, 1, tone(cc, -0.3));                         // (the drop's shadow)
  }
});

/**
 * Where a stair is stepped on from the floor it is drawn on, and what its mark says: { dir, z0, z1 }
 * in the piece's own frame (z toward its front). A flight's front is its foot and its back its top
 * (the header; places' fixtures.js states the same rule), so a flight that climbs from this floor
 * ('up') is stepped on at its front, the last STAIR_TOP_M of it, and a well (or a flight that goes
 * down from this floor) at its back: the open top places' blockRectOf leaves a well, its landing.
 * The maker draws the landing, the mark and the guard from this one answer, and the stairs test
 * holds it equal to the walkable part of every well's footprint in every area.
 */
export function stairEnd(kind, dir, D) {
  const down = kind === 'stairsWell' || dir === 'down';
  return down ? { dir: 'down', z0: -D / 2, z1: -D / 2 + STAIR_TOP_M } : { dir: 'up', z0: D / 2 - STAIR_TOP_M, z1: D / 2 };
}

/** The mark's paint: amber, a dark edge under the triangle, the word amber on a dark plate (hazard paint, as a warning's yellow on black). */
const MARK_INK = C.amber, MARK_SHADOW = C.ink, MARK_PLATE = C.hazardD;
/** A stair's mark: a solid triangle (▲ up, ▼ down) over its word on a plate, centred, painted upright (the caller turns it back from the piece's turn); the word left out where it will not fit. */
export const stairMark = (dir) => tex(`stairmark:${dir}`, (px, w, h, p) => {
  const f = fontFor(p), word = dir === 'up' ? 'UP' : 'DOWN', up = dir === 'up';
  const th = Math.max(4, Math.round(0.38 * p));                            // (the triangle's rows: 6 at 16 px/m (11 px across), 9 at 24 (17 across))
  const gap = Math.max(1, Math.round(0.06 * p)), fits = f.width(word) <= w;
  const tall = th + 1 + (fits ? gap + f.h + 2 : 0), y0 = Math.max(0, Math.floor((h - tall) / 2)), cx = Math.floor((w - 1) / 2);
  const tri = (dx, dy, c) => { for (let r = 0; r < th; r++) { const half = up ? r : th - 1 - r; px(cx - half + dx, y0 + r + dy, 2 * half + 1, 1, c); } };
  tri(1, 1, MARK_SHADOW); tri(0, 0, MARK_INK);
  if (!fits) return;
  // (the plate a pixel round the word where the end has the pixels: 20 across for DOWN at 16 px/m, all of Echo's 1.2 m landings snapped)
  const pw = Math.min(w, f.width(word) + 2), x = Math.floor((w - pw) / 2), y = y0 + th + 1 + gap;
  px(x, y, pw, f.h + 2, MARK_PLATE);
  f.text(px, x + Math.floor((pw - f.width(word)) / 2), y + 1, word, MARK_INK);
});
// (the mark on the end one steps on, upright on the screen whatever way the piece faces: its painting
// turned back by the piece's quarter turns, which the builder turns forward again)
function markEnd(k, W, end) {
  return k.ground({ x0: -W / 2, z0: end.z0, x1: W / 2, z1: end.z1, top: rotPainter(stairMark(end.dir), (4 - k.q) & 3), lift: 0.004 });
}
const railC = (c) => tex(`stairrail:${c}`, (px, w, h) => { px(0, 0, w, h, c); px(0, 0, w, 1, tone(c, 0.1)); });

/** A flight of stairs in plan (see the header): its treads, its handrails, and its mark at the end one steps on (stairEnd). */
export function stairs(k, o) {
  const { W, D } = o, make = o.make ?? 'concrete', dir = o.look?.dir ?? o.dir ?? 'up', end = stairEnd('stairs', dir, D);
  k.comp();
  k.ground({ x0: -W / 2, z0: -D / 2, x1: W / 2, z1: D / 2, top: flightTop(make, dir), lift: 0.003 });
  const mark = markEnd(k, W, end);
  // (a handrail each side on its posts: 0.9 m, thin, one part with the stringers)
  const rc = make === 'steel' ? 0x565b67 : 0x7c736b;
  k.comp();
  for (const sx of [-1, 1]) {
    k.box({ x: sx * (W / 2 - 0.03), z: 0, w: 0.06, d: D, h: 0.1, faces: { sides: tone(rc, -0.08), top: railC(rc) } });
    k.box({ x: sx * (W / 2 - 0.03), z: 0, y: 0.86, w: 0.05, d: D, h: 0.04, faces: { sides: rc, top: railC(rc) } });
    for (const pz of [-D / 2 + 0.1, 0, D / 2 - 0.1]) k.box({ x: sx * (W / 2 - 0.03), z: pz, y: 0.1, w: 0.03, d: 0.03, h: 0.76, faces: { sides: rc } });
  }
  k.stair = { dir: end.dir, mark };
}

/** The well a stair comes up through, seen from the floor above (see the header), its landing, mark and guard where stairEnd says. */
export function stairsWell(k, o) {
  const { W, D } = o, make = o.make ?? 'rail', end = stairEnd('stairsWell', 'down', D);
  const well = tex(`well:${make}`, (px, w, h, p) => {
    const tread = Math.max(4, Math.round(0.28 * p)), n = Math.ceil(h / tread);
    px(0, 0, w, h, 0x14151c);
    // (the flight falling away from the landing (the top row) into the dark, a tread a step darker)
    for (let kk = 0; kk < n; kk++) { const y = kk * tread, t = 1 - kk / n; px(1, y, w - 2, tread - 1, tone(0x6e6658, -0.45 + 0.32 * t)); px(1, y + tread - 1, w - 2, 1, tone(0x14151c, 0.02)); }
    px(0, 0, 1, h, 0x14151c); px(w - 1, 0, 1, h, 0x14151c);
  });
  k.comp();
  // (the landing, the top treads one walks onto, lit, at the back; the well's floor from its edge to the front, the foot)
  const landing = k.ground({ x0: -W / 2, z0: end.z0, x1: W / 2, z1: end.z1, top: landingTop, lift: 0.003 });
  const open = k.ground({ x0: -W / 2, z0: end.z1, x1: W / 2, z1: D / 2, top: well, lift: 0.002 });
  const mark = markEnd(k, W, end);
  // (the guard round the opening: its two long sides from the landing's edge, and its far end at the front, 1.0 m)
  k.comp();
  const gc = make === 'wall' ? 0xb8b2a4 : 0x565b67, H = 1.0, t = make === 'wall' ? 0.12 : 0.05;
  const sideFace = make === 'wall' ? tex(`parapet:${gc}`, (px, w, h) => { px(0, 0, w, h, gc); px(0, 0, w, 1, tone(gc, 0.08)); px(0, h - 1, w, 1, tone(gc, -0.2)); }) : railC(gc);
  const guard = [];
  for (const x of [-W / 2 + t / 2, W / 2 - t / 2]) {
    const z0 = end.z1, z1 = D / 2;
    if (make === 'wall') guard.push(k.box({ x, z: (z0 + z1) / 2, w: t, d: z1 - z0, h: H, faces: { sides: sideFace, top: tone(gc, 0.06) } }));
    else {
      guard.push(k.box({ x, z: (z0 + z1) / 2, y: H - 0.05, w: t, d: z1 - z0, h: 0.05, faces: { sides: gc, top: railC(gc) } }));
      for (let z = z0 + 0.05; z <= z1 - 0.02; z += 0.6) guard.push(k.box({ x, z, w: 0.03, d: 0.03, h: H - 0.05, faces: { sides: gc } }));
    }
  }
  if (make === 'wall') guard.push(k.box({ x: 0, z: D / 2 - t / 2, w: W, d: t, h: H, faces: { sides: sideFace, top: tone(gc, 0.06) } }));
  else guard.push(k.box({ x: 0, z: D / 2 - 0.025, y: H - 0.05, w: W, d: 0.05, h: 0.05, faces: { sides: gc, top: railC(gc) } }));
  k.stair = { dir: end.dir, landing, open, mark, guard };
}

// ---------- lamp posts ----------

const POLE = 0x565b67;
const poleFace = tex('lamppole', (px, w, h, p) => { px(0, 0, w, h, POLE); px(0, 0, 1, h, tone(POLE, 0.08)); px(w - 1, 0, 1, h, tone(POLE, -0.12)); grimeFoot(px, 0, 0, w, h, POLE, { ppm: p, upM: 0.4, k: 0.6 }); });
const lens = (c) => tex(`lamplens:${c}`, (px, w, h) => { px(0, 0, w, h, c, GLOW.NIGHT); px(0, 0, w, 1, tone(c, 0.1), GLOW.NIGHT); });

/** A lamp post (see the header): the pole at the origin, the head on an arm toward its front. */
export function lampPost(k, o) {
  const make = o.make ?? 'sodium', H = o.H ?? 4.0, ppm = o.ppm;
  k.comp();
  k.box({ x: 0, z: 0, w: 0.25, d: 0.25, h: 0.3, faces: { front: tex('lampbase', (px, w, h, p) => concrete(px, 0, 0, w, h, { c: 0x9c917a, ppm: p, seed: 4 })), top: tone(0x9c917a, 0.04), sides: tone(0x9c917a, -0.06) } });
  k.box({ x: 0, z: 0, y: 0.3, w: 0.1, d: 0.1, h: H - 0.3, faces: { front: poleFace, sides: tone(POLE, -0.06), top: POLE } });
  if (make === 'flood') {
    // (a flood's head: a box angled out from the pole's top, its face a broad lens)
    k.box({ x: 0, z: 0.1, y: H - 0.05, w: 0.36, d: 0.22, h: 0.14, faces: { front: lens(0xf8e8c0), top: tone(POLE, -0.1), sides: POLE, bottom: lens(0xf8e8c0) } });
    return;
  }
  // (a sodium lamp: a short arm toward the front, the head over the walk, its lens under it and on its front)
  k.box({ x: 0, z: 0.06, y: H - 0.08, w: 0.05, d: 0.12, h: 0.05, faces: { sides: POLE } });
  k.box({ x: 0, z: 0.06, y: H - 0.12, w: 0.24, d: 0.12, h: 0.1, faces: { front: tex('sodiumhead', (px, w, h) => { px(0, 0, w, h, POLE); px(1, h - 2, w - 2, 2, 0xf0b050, GLOW.NIGHT); }), top: tone(POLE, 0.06), sides: POLE, bottom: lens(0xf0b050) } });
  void ppm;
}

// ---------- door leaves ----------

const LEAVES = { interior: 0x7c7f86, ext: 0x565b67, office: 0x8c6d59 };
/** A leaf's face: the slab, its edge lines, a kick plate, the handle at the free edge (right), a vision panel by make. */
const leafFace = (make, flip) => tex(`leaf:${make}:${flip}`, (px, w, h, ppm) => {
  const c = LEAVES[make] ?? LEAVES.interior;
  if (make === 'office') { px(0, 0, w, h, c); for (let i = 1; i < w; i += Math.max(3, Math.round(0.12 * ppm))) px(i, 0, 1, h, tone(c, (hash3(i, 7) % 3 - 1) * 0.03)); }
  else paintedSteel(px, 0, 0, w, h, { c, ppm, seed: 6 });
  bevel(px, 0, 0, w, h, c, 1.2);
  const kick = P(0.25, ppm, 2); px(1, h - kick, w - 2, kick - 1, tone(c, -0.12)); px(1, h - kick, w - 2, 1, tone(c, 0.06));
  const hx = flip ? 1 : w - 1 - P(0.1, ppm, 2), hy = h - P(1.05, ppm);
  if (hy > 1) { px(hx, hy, P(0.08, ppm, 2), 2, C.steel); px(hx, hy + 2, P(0.08, ppm, 2), 1, tone(C.steel, -0.3)); }
  if (make === 'ext' && h > P(1.2, ppm)) {
    const ww = P(0.25, ppm, 3), wh = P(0.4, ppm, 3), wx = Math.floor((w - ww) / 2), wy = P(0.35, ppm, 2);
    if (wy + wh < h) { px(wx, wy, ww, wh, 0x2b3a44); px(wx, wy, ww, 1, 0x4c6070); for (let j = wy + 2; j < wy + wh; j += 3) px(wx, j, ww, 1, tone(0x2b3a44, 0.06)); }
  }
});

/**
 * A door's leaf in its own frame (its hinge at the origin, the leaf along +x to w, its thickness about
 * z 0): o.W the clear width, o.H its height (a cut wall's 1.0, a full door's 2.1), make the finish.
 */
export function doorLeaf(k, o) {
  const make = o.make ?? 'interior', W = o.W, H = o.H ?? 2.1, c = LEAVES[make] ?? LEAVES.interior, t = LEAF_T_M;
  k.comp();
  k.box({ x0: 0.01, x1: W - 0.01, z0: -t / 2, z1: t / 2, y0: 0, y1: H, faces: { front: leafFace(make, false), back: leafFace(make, true), top: tone(c, -0.18), sides: tone(c, -0.1) } });
  void sunk;
}

// ---------- a clock's hands (the stage's: src/render/clocks.js) ----------

/** Hands' ink: the hour hand, the minute hand (a step lighter, so the two read apart on a 7 px dial). */
export const HANDS_INK = Object.freeze({ hour: 0x1a1214, minute: 0x31292a });
/**
 * Paint a dial's hands into an s × s cell at (x0, y0) (s odd: the axis its middle pixel), the hour hand
 * to about a third of the dial and the minute hand to its rim, each a line of whole pixels from the axis
 * at its angle (degrees clockwise from 12). What is not a hand stays a hole, so the dial shows round it.
 */
export function paintHands(px, x0, y0, s, hourDeg, minuteDeg) {
  const c = (s - 1) / 2, R = s / 2;
  const hand = (deg, len, col) => {
    const a = deg * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), n = Math.max(1, Math.ceil(len * 2));
    for (let t = 0; t <= n; t++) { const r = (t / n) * len; px(x0 + Math.round(c + dx * r), y0 + Math.round(c + dy * r), 1, 1, col); }
  };
  hand(minuteDeg, Math.max(1.5, R - 1.1), HANDS_INK.minute);
  hand(hourDeg, Math.max(1, R * 0.5), HANDS_INK.hour);
  px(x0 + c, y0 + c, 1, 1, HANDS_INK.hour);
}
