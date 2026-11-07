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
//               their nosings, lighter the higher they go, from dark at the foot to near white at the top
//               (the slope read as light, as a well's treads darken into it: a fresh pair of eyes found
//               0.0.6's first ramp flat on the screen), its front (+z) the foot of the flight and its back
//               the top (places' fixtures.js states the same rule). From 0.0.6 it is entered only at its
//               foot (the user, 2026-11-07, of v0.0.5: "we can get on the upwards staircase from the wrong
//               end"): flightGuard, the rule places' flightGuardOf keeps, gives its closed high end, drawn
//               as a cut wall END_H_M 1.0 m high across its back (the cutaway's height: on the screen it
//               stands over the last metre of treads and reads as an end, where a curb read as treads
//               running on), with a shadow on the floor past it; a rail along each long side from the top
//               down to the foot, drawn as a handrail on posts over its stringer, but on the side the
//               fixture names `open`, where it stops FLIGHT_FOOT_M short of the foot at a low newel and
//               the handrail rises from it at the camera's own 45°, so its picture starts where the
//               opening ends and the opening shows; and, where a side is named, a rail across the foot.
//               The opening's edge is painted as a step's (hazard stripes), and the floor beside the open
//               side carries the flight's shadow, widening toward the high end. dir 'up' (floor 1: the
//               flight going up) or 'down' (the same turned end for end, stepped onto at its top); makes
//               'concrete' (a cast flight, steel nosings) and 'steel';
//   stairsWell  1.2 × 4.8 × 1.0: the floor above's view of the same stair: its landing at the back, the top
//               STAIR_TOP_M of the flight one walks onto from this floor (lit treads, the floor's level at
//               the back edge), the well open down to the floor below from the landing's edge to the front
//               (treads falling away into the dark), and a guard rail on its two long sides, carried on
//               along the landing's to the floor's edge (from 0.0.6, places' landingRailsOf: the landing is
//               walked onto across its far edge only), and its far end; makes 'rail' and 'wall' (a solid
//               parapet), WELL_RAIL_M wide.
//   Each stair's word names the end it leads to (the user, 2026-11-07, of v0.0.5's "▲ UP" at a flight's
//   foot: "the UP indicator is on the entry of the staircase which I interpreted as the top of the
//   staircase and not the bottom"; my call): "UP" at a flight's top, "DOWN" at a well's bottom, its far end
//   from the landing (stairWordEnd: a flight's WORD_IN_M 1.5 m in from its top, so neither its own closed
//   end nor a cut wall standing beyond the top hides it on the screen), in the kit's pixel font, amber on
//   a dark plate, painted upright on the screen whatever way the stair runs (its painting turned back by
//   the piece's turn); and a walking arrow, a shaft and a solid head, painted along the treads from the
//   end one steps onto (stairEnd: a flight's foot, a well's landing, where places' blockRectOf leaves the
//   well open and the band takes one down) toward the word, turned with the piece; on a flight with an
//   open side its shaft comes in through the opening and turns up the flight (the arrow says where to step
//   on as well as which way). Nothing is painted at the foot that reads as its label. The well's landing
//   and its guard lie exactly where places' blockRectOf leaves it open and blocks it (the user, 2026-11-06:
//   "cannot cross the space to head downstairs again, is it intentional ?"). A maker leaves what it drew in
//   k.stair ({ dir, mark (the word), arrow, guard, and a flight's blocks (the stringers, flightGuard's
//   order) or a well's landing, open and rails: the world rects and boxes }), which the stairs test reads;
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

/** A flight's guard, metres (places' FLIGHT_*): its rails' width, its foot left open on its open side, its closed end's depth. */
export const FLIGHT_RAIL_M = 0.06, FLIGHT_FOOT_M = 1.2, FLIGHT_END_M = 0.06;
/** A well's guard rail's width by make, metres (places' WELL_RAIL_M). */
export const WELL_RAIL_M = Object.freeze({ rail: 0.05, wall: 0.12 });
/** A flight's closed end's height, metres (the cutaway's cut height: drawn as a cut wall). */
export const END_H_M = 1.0;
/** How far in from a flight's top its word is centred, metres (stairWordEnd: past the END_H_M its own end, and a cut wall beyond the top, hide on the screen). */
export const WORD_IN_M = 1.5;
/** How far the open side's handrail takes to rise from its newel to its height, metres (the camera's 45°: its picture begins where the opening ends). */
const NEWEL_H_M = 0.2, RAIL_H_M = 0.9, RAMP_M = RAIL_H_M - NEWEL_H_M;
/** How far a flight going up shadows the floor beside it at its high end, metres (half as far past the end). */
const SHADOW_M = 0.3;
const STAIR_C = { concrete: 0x9c917a, steel: 0x7c7f86 };
/** A flight seen from above, its foot at the bottom row and its top at the top: treads every 0.28 m, nosings, from dark at the foot to light at the top. */
const flightTop = (make) => tex(`flight:${make}`, (px, w, h, p) => {
  const c = STAIR_C[make] ?? STAIR_C.concrete, u = U(p), tread = Math.max(4, Math.round(0.28 * p)), n = Math.floor(h / tread);
  for (let k = 0; k < n + 1; k++) {
    const y = h - (k + 1) * tread, t = k / Math.max(1, n), cc = tone(c, -0.4 + 0.54 * t);
    px(0, y, w, tread, cc);
    px(0, y, w, 1, make === 'steel' ? tone(C.steel, -0.3 + 0.46 * t) : tone(0xb7b0a8, -0.34 + 0.46 * t));   // (the nosing)
    px(0, y + tread - 1, w, 1, tone(cc, -0.14));                       // (the riser's shadow under the next)
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

// (a stair that goes down from its floor: a well, or a flight drawn on its upper floor)
const goesDown = (kind, dir) => kind === 'stairsWell' || dir === 'down';
/**
 * Where a stair is stepped onto from the floor it is drawn on: { dir, z0, z1 } in the piece's own frame
 * (z toward its front). A flight's front is its foot and its back its top (the header; places'
 * fixtures.js states the same rule), so a flight that climbs from this floor ('up') is stepped onto at
 * its front, the last STAIR_TOP_M of it, and a well (or a flight that goes down from this floor) at its
 * back: the open top places' blockRectOf leaves a well, its landing. The maker draws the landing, the
 * arrow's start and the guard from this one answer, and the stairs test holds it equal to the walkable
 * part of every well's footprint in every area.
 */
export function stairEnd(kind, dir, D) {
  return goesDown(kind, dir) ? { dir: 'down', z0: -D / 2, z1: -D / 2 + STAIR_TOP_M } : { dir: 'up', z0: D / 2 - STAIR_TOP_M, z1: D / 2 };
}
/**
 * Where a stair's word is painted, at the end it leads to (a flight's top, a well's bottom): { dir, word,
 * z0, z1 } in the piece's own frame, STAIR_TOP_M long. A flight's word is centred WORD_IN_M in from its
 * top, its plate clear of what its own closed end (END_H_M) and a cut wall beyond the top (a cut wall's
 * 1.0 m: Echo's vestibule walls hide the east and west flights' last 0.7 m) hide on the screen; a well's,
 * half its STAIR_TOP_M in from its far end, under no wall.
 */
export function stairWordEnd(kind, dir, D) {
  const down = goesDown(kind, dir), inM = kind === 'stairs' ? WORD_IN_M : STAIR_TOP_M / 2, c = D / 2 - inM;
  // (the far end: a flight's back going up, its front going down, a well's front)
  const far = down ? 1 : -1;
  return { dir: down ? 'down' : 'up', word: down ? 'DOWN' : 'UP', z0: far * c - STAIR_TOP_M / 2, z1: far * c + STAIR_TOP_M / 2 };
}
/**
 * A flight's guard in its own frame (see the header): [its closed far end, its −x rail, its +x rail, and
 * where a side is named open, the rail across its foot] as rects { x0, z0, x1, z1 }, the open side's
 * rail ('left' its −x, 'right' its +x, both when none is named) FLIGHT_FOOT_M short of the end one steps
 * onto. places' fixtures.js flightGuardOf keeps the same rule.
 */
export function flightGuard(W, D, dir = 'up', open = null) {
  const far = -D / 2 + FLIGHT_END_M, short = D / 2 - FLIGHT_FOOT_M, flip = (r) => (dir === 'down' ? { ...r, z0: -r.z1, z1: -r.z0 } : r);
  return [
    { x0: -W / 2, z0: -D / 2, x1: W / 2, z1: far },
    { x0: -W / 2, z0: far, x1: -W / 2 + FLIGHT_RAIL_M, z1: open === 'right' ? D / 2 : short },
    { x0: W / 2 - FLIGHT_RAIL_M, z0: far, x1: W / 2, z1: open === 'left' ? D / 2 : short },
    ...(open ? [{ x0: open === 'right' ? -W / 2 + FLIGHT_RAIL_M : -W / 2, z0: D / 2 - FLIGHT_RAIL_M, x1: open === 'right' ? W / 2 : W / 2 - FLIGHT_RAIL_M, z1: D / 2 }] : []),
  ].map(flip);
}

/** The marks' paint: amber, a dark edge, the word amber on a dark plate (hazard paint, as a warning's yellow on black). */
const MARK_INK = C.amber, MARK_SHADOW = C.ink, MARK_PLATE = C.hazardD;
// (the 3 × 5 alphabet's W is five pixels across; where a word would fill its plate edge to edge, a narrow one, so DOWN keeps a pixel's margin at 16 px/m)
const NARROW_W = ['101', '101', '111', '111', '101'];
/** A stair's word on its plate, centred, painted upright (the caller turns it back from the piece's turn); the plate's sides narrowed to fit, the word left out where it will not. */
export const stairWord = (word) => tex(`stairword:${word}`, (px, w, h, p) => {
  const f = fontFor(p), padY = Math.max(1, Math.round(0.06 * p));
  const narrow = f.name === '3x5' && f.width(word) + 2 > w && word.includes('W');
  const glyphs = [...word].map(ch => (narrow && ch === 'W' ? NARROW_W : f.glyph(ch))), tw = glyphs.reduce((a, g) => a + g[0].length + 1, -1);
  const padX = Math.max(0, Math.min(Math.max(2, Math.round(0.1 * p)), Math.floor((w - tw) / 2))), pw = tw + 2 * padX, ph = f.h + 2 * padY;
  if (tw > w || ph > h) return;
  const x = Math.floor((w - pw) / 2), y = Math.floor((h - ph) / 2);
  px(x + 1, y + 1, pw, ph, MARK_SHADOW);                                  // (the plate's shadow)
  px(x, y, pw, ph, MARK_PLATE);
  px(x, y, pw, 1, tone(MARK_PLATE, 0.18));                                // (its lit top edge)
  let gx = x + padX;
  for (const g of glyphs) { g.forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') px(gx + i, y + padY + j, 1, 1, MARK_INK); })); gx += g[0].length + 1; }
});
/**
 * A stair's arrow: a walking arrow down the middle of a painting, its solid head at the row `toward`
 * names ('top' or 'bottom'), its shaft from the other end; with `side` ('left', 'right') its shaft comes
 * in from that edge at legM metres from the other end and turns along (a flight stepped onto from its
 * open side). Amber with a dark edge, painted in the piece's own frame, so it turns with the piece.
 */
export const stairArrow = (toward, side = null, legM = 0) => tex(`stairarrow:${toward}:${side}:${legM}`, (px, w, h, p) => {
  const t = Math.max(2, Math.round(0.12 * p)), a = Math.max(3, Math.min(Math.floor((w - 3) / 2), Math.round(0.34 * p))), cx = Math.floor((w - t) / 2);
  const top = toward === 'top', m = Math.max(1, Math.round(0.08 * p));
  // (rows counted from the head's tip: r 0 the tip; the painting's row for r)
  const row = (r) => (top ? m + r : h - 1 - m - r);
  const tail = h - 2 * m, leg = side ? Math.min(tail - t, Math.max(a + 2, Math.round(h - legM * p - t / 2))) : tail;
  const draw = (dx, dy, c) => {
    for (let r = 0; r <= a; r++) { const half = Math.min(a, r); px(cx + Math.floor(t / 2) - half + dx, row(r) + dy, 2 * half + (t % 2 ? 1 : 2), 1, c); }   // (the head)
    const r0 = a + 1, r1 = side ? leg + t : tail;
    for (let r = r0; r < r1; r++) px(cx + dx, row(r) + dy, t, 1, c);                                   // (the shaft)
    if (side) { const x0 = side === 'left' ? 0 : cx, x1 = side === 'left' ? cx + t : w; for (let r = leg; r < leg + t; r++) px(x0 + dx, row(r) + dy, x1 - x0, 1, c); }   // (the leg in from the opening)
  };
  draw(1, top ? 1 : -1, MARK_SHADOW); draw(0, 0, MARK_INK);
});
/** A step's edge, where a flight's rail leaves its foot open: a bright nosing strip along the opening (a stair's anti-slip nosing, amber), nothing dark that reads as a rail. */
const stepEdge = tex('stairstepedge', (px, w, h) => { px(0, 0, w, h, tone(MARK_INK, 0.08)); });
/** A shadow on the floor, a dither (holes between), its density growing toward the painting's top row (`toward` 'top') or bottom, or even (none); `wedge` narrows it to nothing at the far row, toward the side it names. */
const floorShadow = (toward = null, wedge = null) => tex(`stairshadow:${toward}:${wedge}`, (px, w, h) => {
  for (let j = 0; j < h; j++) {
    const k = toward === 'top' ? 1 - j / Math.max(1, h - 1) : toward === 'bottom' ? j / Math.max(1, h - 1) : 1, n = wedge ? Math.round(w * k) : w;
    for (let i = 0; i < w; i++) {
      const inWedge = wedge === 'left' ? i < n : wedge === 'right' ? i >= w - n : true;
      px(i, j, 1, 1, inWedge && (i + j) % 2 === 0 ? MARK_SHADOW : null);
    }
  }
});
// (the word on the end a stair leads to, across x0..x1 inside its guard, upright on the screen whatever way
// the piece faces: its painting turned back by the piece's quarter turns, which the builder turns forward again)
function wordAt(k, x0, x1, kind, dir, D) {
  const e = stairWordEnd(kind, dir, D);
  return k.ground({ x0, z0: e.z0, x1, z1: e.z1, top: rotPainter(stairWord(e.word), (4 - k.q) & 3), lift: 0.004 });
}
// (the arrow from the end one steps onto to the word, across x0..x1, in the piece's frame: an up flight's
// from its front (short of the rail across its foot, footM) up to the word at its back; a well's and a down
// flight's from its back to the word at its front; side, the open side its shaft comes in by)
function arrowAt(k, x0, x1, kind, dir, D, side = null, footM = 0) {
  const e = stairWordEnd(kind, dir, D), up = !goesDown(kind, dir);
  const r = up ? { z0: e.z1, z1: D / 2 - footM } : { z0: -D / 2 + footM, z1: e.z0 };
  return k.ground({ x0, z0: r.z0, x1, z1: r.z1, top: stairArrow(up ? 'top' : 'bottom', side, (FLIGHT_FOOT_M - footM) / 2), lift: 0.0035 });
}
const railC = (c) => tex(`stairrail:${c}`, (px, w, h) => { px(0, 0, w, h, c); px(0, 0, w, 1, tone(c, 0.1)); });
/** A flight's closed high end drawn as the cutaway draws a cut wall (src/render/cutaway.js: its section's dark top CUT, the block finish's wainscot below 1 m): the colours copied, the kit importing no render module. */
const END_CUT = 0x3a3f4b, END_WAINSCOT = 0x6f735e;
const endFace = tex('stairend', (px, w, h) => {
  px(0, 0, w, h, END_WAINSCOT);
  px(0, 0, w, 1, tone(END_WAINSCOT, 0.12)); px(0, h - 1, w, 1, tone(END_WAINSCOT, -0.2));
});

/** A flight of stairs in plan (see the header): its treads, its guard (flightGuard), its arrow and its word at its top. */
export function stairs(k, o) {
  const { W, D } = o, make = o.make ?? 'concrete', dir = o.look?.dir ?? o.dir ?? 'up', open = o.look?.open ?? o.open ?? null;
  const flip = (r) => (dir === 'down' ? { ...r, z0: -r.z1, z1: -r.z0 } : r), R = FLIGHT_RAIL_M, footM = open ? R : 0;
  k.comp();
  // (its top at its back either way: a down flight is stepped onto there)
  k.ground({ x0: -W / 2, z0: -D / 2, x1: W / 2, z1: D / 2, top: flightTop(make), lift: 0.003 });
  const arrow = arrowAt(k, -W / 2 + R, W / 2 - R, 'stairs', dir, D, open, footM), mark = wordAt(k, -W / 2 + R, W / 2 - R, 'stairs', dir, D);
  // (the opening's edge on each open side; a flight going up casts its shadow on the floor past its high end
  // and beside each open side, widening toward the high end)
  const sides = open ? [open] : ['left', 'right'];
  for (const sd of sides) {
    const x0 = sd === 'left' ? -W / 2 : W / 2 - R, sw = SHADOW_M, sx0 = sd === 'left' ? -W / 2 - sw : W / 2;
    k.ground({ x0, x1: x0 + R, ...flip({ z0: D / 2 - FLIGHT_FOOT_M, z1: D / 2 - footM }), top: stepEdge, lift: 0.004 });
    if (dir !== 'down') k.ground({ x0: sx0, x1: sx0 + sw, z0: -D / 2, z1: D / 2 - FLIGHT_FOOT_M, top: floorShadow('top', sd === 'left' ? 'right' : 'left'), lift: 0.0025 });
  }
  if (dir !== 'down') k.ground({ x0: -W / 2, x1: W / 2, z0: -D / 2 - SHADOW_M / 2, z1: -D / 2, top: floorShadow('bottom'), lift: 0.0025 });
  // (the guard: the high end a cut wall; a stringer over each other rect, a handrail on posts over it; the open side's handrail rising from a low newel)
  const rc = make === 'steel' ? 0x565b67 : 0x7c736b, [end, ...rails] = flightGuard(W, D, dir, open), guard = [], blocks = [];
  k.comp();
  blocks.push(k.box({ x0: end.x0, x1: end.x1, z0: end.z0, z1: end.z1, y0: 0, y1: END_H_M, faces: { sides: endFace, top: END_CUT } }));
  const footRail = open ? rails[2] : null;
  for (const r of rails) {
    const across = r === footRail, short = !across && (dir === 'down' ? r.z0 > -D / 2 + 1e-9 : r.z1 < D / 2 - 1e-9);
    blocks.push(k.box({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y0: 0, y1: 0.1, faces: { sides: tone(rc, -0.08), top: railC(rc) } }));
    // (the bar and its posts as wide as the stringer, so all three snap to its pixels)
    const bar = (b) => guard.push(k.box({ ...b, faces: { sides: rc, top: railC(rc) } }));
    const post = (b, newel) => guard.push(k.box({ ...b, faces: { sides: newel ? tone(rc, 0.06) : rc, top: tone(rc, 0.12) } }));
    if (across) {
      bar({ x0: r.x0, x1: r.x1, z0: r.z0, z1: r.z1, y0: RAIL_H_M - 0.04, y1: RAIL_H_M });
      for (const px0 of [r.x0, (r.x0 + r.x1) / 2 - 0.02, r.x1 - 0.04]) post({ x0: Math.max(r.x0, px0), x1: Math.min(r.x1, px0 + 0.04), z0: r.z0, z1: r.z1, y0: 0.1, y1: RAIL_H_M - 0.04 }, false);
      continue;
    }
    // (along the rail from the end one steps onto (or the newel) to the closed end)
    const step = dir === 'down' ? r.z0 : r.z1, s = dir === 'down' ? 1 : -1, farZ = dir === 'down' ? r.z1 : r.z0;
    const at = (d) => step + s * d, span = (d0, d1) => ({ z0: Math.min(at(d0), at(d1)), z1: Math.max(at(d0), at(d1)) });
    let d = 0;
    if (short) {
      // (a low newel, and the handrail rising from it at 45°: its picture stays where the opening ends)
      post({ x0: r.x0, x1: r.x1, ...span(0, 0.08), y0: 0.1, y1: NEWEL_H_M }, true);
      const n = Math.max(2, Math.round(RAMP_M * k.ppm / 3));
      // (each piece at the height of its nearer end: its picture's near edge then lies where the newel's does)
      for (let i = 0; i < n; i++) { const y = NEWEL_H_M + RAMP_M * i / n; bar({ x0: r.x0, x1: r.x1, ...span(RAMP_M * i / n, RAMP_M * (i + 1) / n), y0: y - 0.04, y1: y }); }
      d = RAMP_M;
    }
    const L = Math.abs(farZ - at(d));
    bar({ x0: r.x0, x1: r.x1, ...span(d, d + L), y0: RAIL_H_M - 0.04, y1: RAIL_H_M });
    const n = Math.max(1, Math.round(L / 1.6));
    for (let i = 0; i <= n; i++) {
      const pd = i === 0 && !short ? 0.08 : 0.04, c = Math.max(d + pd / 2, Math.min(d + L - pd / 2, d + L * i / n));
      post({ x0: r.x0, x1: r.x1, ...span(c - pd / 2, c + pd / 2), y0: 0.1, y1: i === 0 && !short ? 0.95 : RAIL_H_M - 0.04 }, i === 0 && !short);
    }
  }
  k.stair = { dir: dir === 'down' ? 'down' : 'up', mark, arrow, blocks, guard: [...blocks, ...guard] };
}

/** The well a stair comes up through, seen from the floor above (see the header), its landing and guard where stairEnd says, its word at its bottom. */
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
  const gc = make === 'wall' ? 0xb8b2a4 : 0x565b67, H = 1.0, t = WELL_RAIL_M[make] ?? WELL_RAIL_M.rail;
  const arrow = arrowAt(k, -W / 2 + t, W / 2 - t, 'stairsWell', 'down', D), mark = wordAt(k, -W / 2 + t, W / 2 - t, 'stairsWell', 'down', D);
  // (the guard round the opening: its two long sides, on along the landing's to the floor's edge, and its far end at the front, 1.0 m)
  k.comp();
  const sideFace = make === 'wall' ? tex(`parapet:${gc}`, (px, w, h) => { px(0, 0, w, h, gc); px(0, 0, w, 1, tone(gc, 0.08)); px(0, h - 1, w, 1, tone(gc, -0.2)); }) : railC(gc);
  const guard = [], rails = [];
  for (const x of [-W / 2 + t / 2, W / 2 - t / 2]) {
    const z0 = end.z0, z1 = D / 2 - (make === 'wall' ? t : 0.05);
    // (the landing's stretch and the well's, each a box, so the landing's rails are the sim's landingRailsOf)
    for (const [a, b, onLanding] of [[z0, end.z1, true], [end.z1, z1, false]]) {
      const box = make === 'wall'
        ? k.box({ x, z: (a + b) / 2, w: t, d: b - a, h: H, faces: { sides: sideFace, top: tone(gc, 0.06) } })
        : k.box({ x, z: (a + b) / 2, y: H - 0.05, w: t, d: b - a, h: 0.05, faces: { sides: gc, top: railC(gc) } });
      (onLanding ? rails : guard).push(box);
    }
    // (its posts as wide as the rail they carry, so they snap to its pixels and never stand on the well's word or the landing's lane)
    if (make !== 'wall') for (let z = z0 + 0.05; z <= z1 - 0.02; z += 0.6) (z < end.z1 ? rails : guard).push(k.box({ x, z, w: t, d: 0.03, h: H - 0.05, faces: { sides: gc } }));
  }
  if (make === 'wall') guard.push(k.box({ x: 0, z: D / 2 - t / 2, w: W, d: t, h: H, faces: { sides: sideFace, top: tone(gc, 0.06) } }));
  else guard.push(k.box({ x: 0, z: D / 2 - 0.025, y: H - 0.05, w: W, d: 0.05, h: 0.05, faces: { sides: gc, top: railC(gc) } }));
  k.stair = { dir: end.dir, landing, open, mark, arrow, guard, rails };
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
