// OLYMPUS scenes: the shoot house's one record and its readers' seam, as set or drawn from the seed (the build sheet v0.0.21 §1 items 1 to 4, §3 step 5, §4.0, §4.1; PLACES §9.9; house lens H1, H2, H4, H5, H6).
//
// Until v0.0.21 every reader of the house took house 1's authored records straight from the data: wheel.js HOUSE1 (the
// lane's start, the #2's, the stands' places, the booth, the catwalk, the zones) and x4-plans.js X4_PLANS (each room's plan),
// so a house laid out any other way had twenty places to change. This module is their one reader (tests/house-spec.test.mjs:
// no module of src but wheel.js, x4-plans.js, this one and room.js imports HOUSE1, X4_PLANS, LAYOUT_A or X4_CHUNKS):
//   houseSpecOf(state)   the house's spec: HOUSE1 itself on the set (the same object, so every set lane is v0.0.20's to the
//                        byte); a drawn house's own (assembleHouse(code).spec).
//   planSetOf(state, layout)  the lane's authored layout { lane, area, order, plans }: X4_PLANS[layout] on the set (A, the
//                        session's layout as room.js layoutOf reads it: the house record's lane, else 'A'); a drawn house's plans.
//   plansOfArea(areaId)  every authored layout standing in an area (zones.js's no-stop zones by area): X4_PLANS' on the set; a
//                        drawn area's own.
//   houseCodeOf(state)   the house's code: 'A' (HOUSE_CODE_SET) on the set, R.house.draw.code on a drawn lane (C's run record).
// "As set" is the absence of R.house.draw (absent means default: nothing is written on the set).
//
// **The drawn house**. The hub's rule holds ("game world is handcrafted", the user, 2026-11-05): the house is
// Base Melas's, its footprint fixed (HOUSE1_RECT, the hall, the apron, the catwalk and the booth never move), and a drawn
// house is an exercise's arrangement of its authored rooms (PLACES §4.12: "three authored wall layouts set by moving panels ...
// procedural, as the instructors would choose it"; §9.9: "layouts B and C are then assemblies rather than new maps"), drawn
// per lane from the lane's seed, never per career. Its pieces are src/data/chunks/x4.js's three rooms (the centre, the corner,
// the ell), each with its plans by swing family, its stands' roles and their candidate places, all in the chunk's own frame.
//
// The code names a house: three rooms east to west, each `<chunk><side><mirror?><door x, dm><swing><state>` (C centre, K
// corner, E ell; n or s of the hall; m mirrored, stage 2's, refused while MIRROR_ROOMS is false; the door's middle in
// decimetres; p push or l pull; c closed, o open, k locked), joined by '.', the layout part; then, written by the fill, the
// cast `|f` (a face a stand in role order: t threat, n no-shoot, a armoured, h hostage) and the places `|p` (a candidate's index,
// 0 to 3, a stand in role order). Layout A as drawn is 'Cn290pc.Ks206lc.En175pc'; the set itself is the literal 'A'. The area
// of a drawn house is `melas.wheel.s4~<v>`, v the layout part's rooms numbered one to one in VARIANT_HEX 13 hex digits (each
// room's chunk, side, mirror, door x in decimetres, swing and state a digit of a mixed radix, ROOM_RADIX 72,000 a room), so one
// layout is one area whatever its cast and two layouts never share one (a hash of 7 hex digits did: 27 pairs in the draws of
// seeds 1 to 150,000, the second game of a session played on the first's rooms, the code review of 2026-11-16); every id in it
// carries the mark ('w4~<v>.r1', 'o:w4~<v>:r1', 'w4~<v>.z.hall-west'), so an opening id stays unique across the areas and
// every cache keyed by an area or an opening is right for nothing.
//
// assembleHouse(code) → { area, spec, plans } (null for a code that is no house):
//   - each room placed: translated so its door's middle stands at the code's x on the hall's wall, and flipped across the hall
//     (its z mirrored about its depth) when it stands on the other side from the one it was authored on: rects, inner
//     openings (an inner door's hinge end swapped with its ends), the socket, every point of its plan, its yaws (to −yaw), its
//     dead circles; its door hinged at its downrange (west) end, so the latch and the stack face the team as it comes (the
//     house lens §0 item 5: a hinge on the approach's side stalls every lane, 361.5 s); into the room for a push, into the
//     hall for a pull; a locked door the closet's lock and KICK_DC.locked 14;
//   - each plan the chunk's family for the swing (chunks/x4.js family[how]), its ids the lane's (room k's), a push door's hinge-side
//     near corner 'behind the door' and none on a pull (its leaf stands in the hall); each path and the far walk then routed
//     (route.js routed, the lane's doors open): the walker's rule and the grid's cells hold on a flipped room as on A's (the C0
//     grid's 14.4 m south wall made 5 to 11 legs cut a flipped layout unrouted), within PATH_TOL_M 0.15 of the transform
//     (tests/house-cases.test.mjs);
//   - the hall's leg derived from the last door: its gate HALL_GATE_OFF_M 0.15 west of the last door's west jamb (A: 16.9 for
//     17.05), the threshold and the stack with it, the points A's; #2's hall stack, behind #1's on the hall's south side, set
//     clear of a south door's funnel by FUNNEL_SIDE_M 0.3 and a body's C0 0.27 (house lens H7 (b): the fuzz's 1,266 moves
//     ended in that doorway at (15.89, 13.97));
//   - the spec: HOUSE1's start, #2's start, booth, catwalk, face and stand piece (the house's fixed parts), the hall's west zone
//     its own id, and the seven stands: each room's two by their chunk's roles at the cast's places (H, the hall's, as set).
// The area is registered in model.js's registry (registerArea) as it is assembled; the assembled houses are kept by layout,
// HOUSE_REG_KEEP 2 of them (the last two used: a read of a held layout makes it the newest), the third evicted: its area dropped from the registry (nav's,
// route.js's, plan.js's, collide.js's and graph.js's WeakMaps by record go with it) and the id-keyed memos (zones.js, light.js,
// graph.js) emptied by their own resetCaches(). A layout once assembled in this session is remembered by its area id
// (a short string), so a reader of an evicted area (areaOf of its id) assembles it again, the same record field for field.
//
// **The draw** (drawHouse(seed), the fill's when &draw=drawn and no &house):
//   - SHAPES: every (order of the three rooms, each one's side) that has at least one placement under the layout rules,
//     enumerated once (a runtime cache, pinned by tests/house-shapes.test.mjs's golden): 36 of 48 without mirrors;
//   - a shape drawn uniformly (stream(seed, 'house:shape')), then the doors' places by a depth-first search over DOOR_STEP_M
//     0.5 m in an order shuffled by stream(seed, 'house:at'): room 1's door's middle in FIRST_DOOR_X_M [24.0, 31.0] (the start
//     mark's walk to its stack at least 2 m), each next one DOOR_GAP_M [3.0, 9.0] west, the last at or east of LAST_DOOR_MIN_X_M
//     16.0 (the hall's leg at least 3.9 m). The first full fit is the layout; it cannot fail, the shape having been enumerated
//     as fitting. The layout rules (layoutOk): every rect inside HOUSE1_RECT, none over another or the booth; no stack point
//     within STACK_CLEAR_M 0.52 (C0 0.27 + swing.js ARC_PAD_M 0.25) of another lane door's leaf arc, taken as a pull's (in the
//     hall), whatever it is drawn, nor in another door's funnel;
//   - each door's swing (stream(seed, 'house:swing', k), SWING_W push 50, pull 50; &doors=fixed: the chunk's authored swing)
//     and its state (stream(seed, 'house:state', k), DOOR_STATE_W closed 60, open 25, locked 15; a pull never locked: a dead
//     end on the standard loadout, room.js doorPlanOf refuses it; the draw never reads the loadout; &doors=fixed: closed);
//   - the cast (castOf(seed, layout)): each room's two stands by role, a face (stream(seed, 'house:cast'), COURSES.house.draws
//     .cast's tables by role) and a place (stream(seed, 'house:place')) from its room's PLACES_PER_ROOM 4 candidates, distinct,
//     redrawn on the same streams at most DRAW_TRIES 8 times until the lane is fair, then the chunks' set cast (A's faces and
//     places, never a throw). Fair (castFair): a threat (THREAT_FACES) in every room; at most one hostage, at most one armoured,
//     at least one no-shoot a lane; at most one stand in the #2's sector a room (room.js sectorOf on the room's plan, after the
//     swing); every stand STAND_PATH_CLEAR_M 0.57 off every path, the far walk, every point and every leaf arc of its room, and
//     STAND_GAP_M 1.0 from the other; seen from its owner's point (route.js lineClear: the walls and closed leaves, exactly), or
//     from the far walk's end for a stand in dead space; a hostage in #1's sector, HOSTAGE_RANGE_M [2.5, 5.0] from his point
//     (or the far walk's end). The rules are geometry of a room alone, so each room case (chunk, side, swing) is measured once on
//     a reference lane and the draw reads its table.
// The faces are those the house already plays (threat, no-shoot, armoured, hostage): the lens's tables also named an 'unknown'
// face and an empty stand, which no rule of the house yet scores (THREAT_FACES, the pars, the paper; STANDS' seven ids), so they
// wait (my call). Pure but for the runtime caches and the registry.
import { HOUSE1, WHEEL_S4, HOUSE1_RECT } from '../../data/places/wheel.js';
import { X4_PLANS } from '../../data/places/x4-plans.js';
import { X4_CHUNKS, X4_LANE_CHUNKS, KICK_DC, LEAF, PLACES_PER_ROOM } from '../../data/chunks/x4.js';
import { COURSES } from '../../data/courses.js';
import { opOf } from '../combat/op.js';
import { registerArea, dropArea, areaOf, openingOf, useGenerated, GEN_MARK } from '../places/model.js';
import { routed, lineClear, ROUTE_CLS } from '../combat/route.js';
import { openNavOf, clearLine as navClear } from '../places/nav.js';
import { standOk } from '../places/collide.js';
import { arcOf, stackPointsOf } from '../places/swing.js';
import { sightGridOf, STAND } from '../places/sight.js';
import { FUNNEL_M, FUNNEL_SIDE_M, resetCaches as resetZones } from '../places/zones.js';
import { resetCaches as resetLight } from '../places/light.js';
import { resetCaches as resetGraph } from '../places/graph.js';
import { sectorOf } from '../combat/room.js';
import { stream, weighted, int, shuffle } from '../../core/rng.js';

/** The assembler's version, written on a drawn lane's places.live.gen (PLACES §9.9: rebuilt on load). */
export const ASSEMBLE_V = 'assemble@1';
/** The set's code: house 1 as authored, layout A. */
export const HOUSE_CODE_SET = 'A';
/** The hex digits of a drawn area's id (melas.wheel.s4~<v>): three rooms of ROOM_RADIX each, 72,000³ under 16¹³. */
export const VARIANT_HEX = 13;
/** One room's count of values in the id (see the header): 3 chunks × 2 sides × 2 mirrors × 1,000 door places (dm) × 2 swings × 3 states. */
export const ROOM_RADIX = 72000;
/** Room 1's door's middle (m, x), each next door's gap west of the one before, the grid they are drawn on, the last door's least x (house lens H2). */
export const FIRST_DOOR_X_M = Object.freeze([24.0, 31.0]), DOOR_GAP_M = Object.freeze([3.0, 9.0]), DOOR_STEP_M = 0.5, LAST_DOOR_MIN_X_M = 16.0;
/** The hall's gate this far west of the last door's west jamb; a stack point this far clear of another door's leaf arc; a routed path within this of its transform (m; house lens H2). */
export const HALL_GATE_OFF_M = 0.15, STACK_CLEAR_M = 0.52, PATH_TOL_M = 0.15;
/** A body's half-width on the routing grid (nav.js C0), m: the hall's #2 stack clear of a south door's funnel by FUNNEL_SIDE_M and this. */
export const BODY_C0_M = 0.27;
/** The fair lane's rules (house lens H6): redraws, a stand's clearance off the paths, points and arcs, the stands' gap, a hostage's range from #1's point (m). */
export const DRAW_TRIES = 8, STAND_PATH_CLEAR_M = 0.57, STAND_GAP_M = 1.0, HOSTAGE_RANGE_M = Object.freeze([2.5, 5.0]);
/** Mirrored rooms (stage 2, house lens H11): off; a code with 'm' is refused while it is. */
export const MIRROR_ROOMS = false;
/** The drawn houses kept assembled and registered at once: the current and the one before (§0 item 49, my call). */
export const HOUSE_REG_KEEP = 2;
/** The faces a drawn cast writes, by their code letters. */
export const FACE_LETTERS = Object.freeze({ t: 'threat', n: 'noshoot', a: 'armoured', h: 'hostage' });
const LETTER_OF_FACE = Object.freeze(Object.fromEntries(Object.entries(FACE_LETTERS).map(([k, v]) => [v, k])));
const THREATS = new Set(['threat', 'armoured', 'hostage']);
/** A door's swing and state weights (COURSES.house.draws.doors: SWING_W push 50, pull 50; DOOR_STATE_W closed 60, open 25, locked 15). */
export const SWING_W = Object.freeze({ ...COURSES.house.draws.doors.swing }), DOOR_STATE_W = Object.freeze({ ...COURSES.house.draws.doors.state });

const BASE = WHEEL_S4.id, BASE_CODE = WHEEL_S4.code;
const HALL_N = HOUSE1.hall.rect[1], HALL_S = HOUSE1.hall.rect[3];
const BOOTH = (() => { const r = WHEEL_S4.rooms.find(x => x.id === 'w4.booth').rect; return Object.freeze([...r]); })();
const r2 = (v) => Math.round(v * 100) / 100, r4 = (v) => Math.round(v * 1e4) / 1e4;
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v); return Object.freeze(o); };
const HOW = Object.freeze({ p: 'push', l: 'pull' }), STATE = Object.freeze({ c: 'closed', o: 'open', k: 'locked' });
const HOW_L = Object.freeze({ push: 'p', pull: 'l' }), STATE_L = Object.freeze({ closed: 'c', open: 'o', locked: 'k' });
const LETTER_OF_CHUNK = Object.freeze(Object.fromEntries(Object.entries(X4_LANE_CHUNKS).map(([k, v]) => [v, k])));

// ---- the seam (stage 0's readers) ----

// (the drawn house's record, R.house.draw = { mode: 'drawn', v, code }, or null on the set)
function drawOf(state) { const d = opOf(state)?.draw; return d?.mode === 'drawn' ? d : null; }

/** The house's code (see the header): 'A' as set. */
export function houseCodeOf(state) { return drawOf(state)?.code ?? HOUSE_CODE_SET; }

/** The house's spec (see the header): HOUSE1 as set. */
export function houseSpecOf(state) {
  const d = drawOf(state);
  return (d && assembleHouse(d.code)?.spec) || HOUSE1;
}

/** The lane's authored layout (see the header): X4_PLANS[layout] as set, null for a layout there is none of. */
export function planSetOf(state, layout = opOf(state)?.lane ?? HOUSE_CODE_SET) {
  const d = drawOf(state);
  return (d && assembleHouse(d.code)?.plans) || (X4_PLANS[layout] ?? null);
}

/** Every authored layout of an area (see the header): X4_PLANS' for the set's area, a drawn area's own plans. */
export function plansOfArea(areaId) {
  if (typeof areaId === 'string' && areaId.includes(GEN_MARK)) { const L = byArea(areaId); return L ? [L.plans] : []; }
  return Object.values(X4_PLANS).filter(L => L.area === areaId);
}

// ---- the code ----

const ROOM_RE = /^([CKE])([ns])(m?)(\d{2,3})([pl])([cok])$/;
/**
 * A house's code read (see the header): { layout, rooms: [{ letter, chunk, side, mirror, doorX, how, state }] (east to west),
 * faces: [6] | null, places: [6] | null }, or null for a code that is not one ('A', the set, is not a drawn code).
 */
export function parseHouse(code) {
  if (typeof code !== 'string' || !code) return null;
  const [layout, ...rest] = code.split('|');
  const parts = layout.split('.');
  if (parts.length !== 3) return null;
  const rooms = [];
  for (const p of parts) {
    const m = ROOM_RE.exec(p);
    if (!m) return null;
    const room = { letter: m[1], chunk: X4_LANE_CHUNKS[m[1]], side: m[2], mirror: m[3] === 'm', doorX: Number(m[4]) / 10, how: HOW[m[5]], state: STATE[m[6]] };
    if (room.mirror && !MIRROR_ROOMS) return null;
    if (room.how === 'pull' && room.state === 'locked') return null;
    rooms.push(room);
  }
  if (new Set(rooms.map(r => r.letter)).size !== 3) return null;
  let faces = null, places = null;
  for (const r of rest) {
    if (/^f[tnah]{6}$/.test(r)) faces = [...r.slice(1)].map(c => FACE_LETTERS[c]);
    else if (/^p[0-3]{6}$/.test(r)) places = [...r.slice(1)].map(Number);
    else return null;
  }
  return { layout, rooms, faces, places };
}
/** A code's layout part (the three rooms), or null. */
export const layoutPartOf = (code) => (typeof code === 'string' ? code.split('|')[0] : null);
// (a room's number in the id, 0 to ROOM_RADIX − 1: its chunk letter, side, mirror, door x (dm), swing and state, a mixed radix)
const roomNumber = (R) => (((('CKE'.indexOf(R.letter) * 2 + (R.side === 's' ? 1 : 0)) * 2 + (R.mirror ? 1 : 0)) * 1000 + Math.round(R.doorX * 10)) * 2 + (R.how === 'pull' ? 1 : 0)) * 3 + ['closed', 'open', 'locked'].indexOf(R.state);
/** A drawn house's area id from its code (see the header): its base's, the mark, the layout's rooms numbered one to one (null for no layout). */
export const areaIdOf = (code) => {
  const H = parseHouse(layoutPartOf(code));
  if (!H) return null;
  const v = H.rooms.reduce((n, R) => n * ROOM_RADIX + roomNumber(R), 0);
  return `${BASE}${GEN_MARK}${v.toString(16).padStart(VARIANT_HEX, '0')}`;
};
// (the ids' prefix inside a drawn area: 'w4~<v>')
const idCodeOf = (areaId) => `${BASE_CODE}${GEN_MARK}${areaId.split(GEN_MARK)[1]}`;
const roomCode = (R) => `${R.letter}${R.side}${R.mirror ? 'm' : ''}${Math.round(R.doorX * 10)}${HOW_L[R.how]}${STATE_L[R.state]}`;
/** A layout part from its rooms (see parseHouse). */
export const layoutCodeOf = (rooms) => rooms.map(roomCode).join('.');

// ---- placing a room ----

// (a lane room's placement: its chunk in the area's frame, flipped across the hall or not (see the header))
function placement(R) {
  const C = X4_CHUNKS[R.chunk], S = C.sockets[0], D = Math.max(...C.rooms.map(r => r.rect[3])), mid = (S.a + S.b) / 2;
  const flip = R.side !== C.side, x0 = r2(R.doorX - mid), z0 = R.side === 'n' ? r2(HALL_N - D) : HALL_S;
  const lz = (z) => (flip ? D - z : z);
  const P = ([x, z]) => [r2(x0 + x), r2(z0 + lz(z))];
  const rect = (r) => { const za = z0 + lz(r[1]), zb = z0 + lz(r[3]); return [r2(x0 + r[0]), r2(Math.min(za, zb)), r2(x0 + r[2]), r2(Math.max(za, zb))]; };
  return { C, S, D, flip, x0, z0, P, rect, yaw: (y) => (flip ? r4(-y) : y) };
}
const over = (a, b) => a[0] < b[2] - 1e-9 && b[0] < a[2] - 1e-9 && a[1] < b[3] - 1e-9 && b[1] < a[3] - 1e-9;
// (a placed room's rects, for the layout rules)
const rectsOf = (R) => { const Q = placement(R); return Q.C.rooms.map(r => Q.rect(r.rect)); };
// (a placed room's door as an opening record, for the rules' arcs, funnels and stacks: its swing as given (a pull's for the arc rule))
function doorOf(R, how = R.how) {
  const Q = placement(R), S = Q.S, roomRect = Q.rect(Q.C.rooms.find(r => r.key === S.room).rect);
  const at = R.side === 'n' ? HALL_N : HALL_S;
  return { id: `door:${R.letter}`, kind: 'door', axis: 'x', at, a: r2(Q.x0 + S.a), b: r2(Q.x0 + S.b), rooms: ['hall', 'room'], swing: { hinge: 'a', into: how === 'pull' ? 0 : 1 }, $rects: { hall: HOUSE1.hall.rect, room: roomRect } };
}
// (the least distance from a point to a leaf's quarter disc of its own width (swing.js arcOf's, the pad left out))
function arcDist(A, x, z) {
  const dx = x - A.hinge[0], dz = z - A.hinge[1], a = dx * A.u[0] + dz * A.u[1], b = dx * A.n[0] + dz * A.n[1], R = A.widthM;
  if (a >= 0 && b >= 0) return Math.max(0, Math.sqrt(a * a + b * b) - R);
  if (a < 0 && b < 0) return Math.sqrt(a * a + b * b);
  if (a < 0) return Math.sqrt(a * a + Math.max(0, b - R) ** 2);
  return Math.sqrt(b * b + Math.max(0, a - R) ** 2);
}
// (whether a point lies in a door's funnel: zones.js funnelZone's shape)
const inFunnelOf = (o, x, z) => Math.abs(z - o.at) <= FUNNEL_M && x >= o.a - FUNNEL_SIDE_M && x <= o.b + FUNNEL_SIDE_M;
// (a placed room's stack points on its door's latch side, the hall's side: swing.js stackPointsOf)
const stackOf = (o) => stackPointsOf(o, o.at === HALL_N ? 1 : -1, o.$rects, 2);
/**
 * The layout rules (see the header) over rooms placed so far, east to west: every rect inside HOUSE1_RECT and none over another
 * or the booth; room 1's door in FIRST_DOOR_X_M, each next DOOR_GAP_M west, the last at or east of LAST_DOOR_MIN_X_M (when all
 * three are placed); no stack point within STACK_CLEAR_M of another door's leaf arc (as a pull) nor in its funnel.
 */
export function layoutOk(rooms) {
  const placed = [];
  for (let i = 0; i < rooms.length; i++) {
    const R = rooms[i];
    if (i === 0 && (R.doorX < FIRST_DOOR_X_M[0] - 1e-9 || R.doorX > FIRST_DOOR_X_M[1] + 1e-9)) return false;
    if (i > 0) { const g = rooms[i - 1].doorX - R.doorX; if (g < DOOR_GAP_M[0] - 1e-9 || g > DOOR_GAP_M[1] + 1e-9) return false; }
    if (i === 2 && R.doorX < LAST_DOOR_MIN_X_M - 1e-9) return false;
    const Pd = placedOf(R);
    if (!Pd.inside) return false;
    for (const p of placed) {
      if (p.rs.some(a => Pd.rs.some(b => over(a, b)))) return false;
      if (Pd.st.some(([x, z]) => arcDist(p.arc, x, z) < STACK_CLEAR_M || inFunnelOf(p.o, x, z))) return false;
      if (p.st.some(([x, z]) => arcDist(Pd.arc, x, z) < STACK_CLEAR_M || inFunnelOf(Pd.o, x, z))) return false;
    }
    placed.push(Pd);
  }
  return true;
}
// (a room placed at a door's x, what the layout rules read, kept by (chunk, side, mirror, x): its rects inside the house and clear
// of the booth, its door as a pull, its stack, its leaf's arc)
const PLACED = new Map();
function placedOf(R) {
  const key = `${R.letter}${R.side}${R.mirror ? 'm' : ''}${R.doorX}`;
  let Pd = PLACED.get(key);
  if (Pd) return Pd;
  const H = HOUSE1_RECT, rs = rectsOf(R), o = doorOf(R, 'pull');
  Pd = { rs, o, st: stackOf(o), arc: arcOf(o, o.$rects), inside: !rs.some(r => r[0] < H[0] - 1e-9 || r[2] > H[2] + 1e-9 || r[1] < H[1] - 1e-9 || r[3] > H[3] + 1e-9 || over(r, BOOTH)) };
  PLACED.set(key, Pd);
  return Pd;
}

// ---- SHAPES and the draw ----

const gridOf = (lo, hi) => { const o = []; for (let k = 0; lo + k * DOOR_STEP_M <= hi + 1e-9; k++) o.push(r2(lo + k * DOOR_STEP_M)); return o; };
// (the doors' places by a depth-first search (see the header): the first full fit (r an rng: shuffled), or the count of fits (r null))
function search(shape, r, i = 0, rooms = [], count = null) {
  if (i === 3) { if (count) { count.n++; return null; } return rooms; }
  const xs = i === 0 ? gridOf(...FIRST_DOOR_X_M) : gridOf(...DOOR_GAP_M).map(g => r2(rooms[i - 1].doorX - g));
  for (const x of r ? shuffle(r, xs) : xs) {
    const R = { ...shape[i], doorX: x, how: 'push', state: 'closed' }, next = [...rooms, R];
    if (!layoutOk(next)) continue;
    const out = search(shape, r, i + 1, next, count);
    if (out) return out;
  }
  return null;
}
let SHAPES_ = null;
/** Every shape that fits (see the header): [{ rooms: [{ letter, chunk, side, mirror }] × 3, n (its placements) }], enumerated once. */
export function shapesOf() {
  if (SHAPES_) return SHAPES_;
  const out = [], L = ['C', 'K', 'E'];
  for (const a of L) for (const b of L) for (const c of L) {
    if (new Set([a, b, c]).size !== 3) continue;
    for (let s = 0; s < 8; s++) for (let m = 0; m < (MIRROR_ROOMS ? 8 : 1); m++) {
      const shape = [a, b, c].map((letter, i) => ({ letter, chunk: X4_LANE_CHUNKS[letter], side: (s >> i) & 1 ? 's' : 'n', mirror: !!((m >> i) & 1) }));
      const count = { n: 0 };
      search(shape, null, 0, [], count);
      if (count.n) out.push(Object.freeze({ rooms: Object.freeze(shape.map(x => Object.freeze(x))), n: count.n }));
    }
  }
  return (SHAPES_ = Object.freeze(out));
}
/** A shape's name: 'Cn.Ks.En'. */
export const shapeName = (S) => S.rooms.map(x => `${x.letter}${x.side}${x.mirror ? 'm' : ''}`).join('.');

/**
 * A drawn house's layout part from the seed alone (see the header): the shape, the doors' places, each door's swing and state.
 * doors 'fixed': the chunks' authored swings, every door closed (&doors=fixed). Never reads the loadout or the sheet.
 */
export function drawHouse(seed, { doors = 'drawn', mirror = MIRROR_ROOMS } = {}) {
  const S = shapesOf().filter(x => mirror || !x.rooms.some(r => r.mirror)), shape = S[int(stream(seed, 'house:shape'), S.length)];
  const rooms = search(shape.rooms, stream(seed, 'house:at'));
  return layoutCodeOf(rooms.map((R, k) => {
    if (doors === 'fixed') return { ...R, how: X4_CHUNKS[R.chunk].sockets[0].swing.into === 'out' ? 'pull' : 'push', state: 'closed' };
    const how = weighted(stream(seed, 'house:swing', k), Object.entries(SWING_W));
    const state = weighted(stream(seed, 'house:state', k), Object.entries(DOOR_STATE_W).filter(([s]) => !(how === 'pull' && s === 'locked')));
    return { ...R, how, state };
  }));
}

// ---- the room cases and the fair lane ----

// (a room's case: its chunk, its side and its swing, the geometry the fair rules read, measured once on a reference lane (see the
// header): each candidate place as offsets from its door's middle, its owner's slot, its clearances, its sight, its hostage range)
const CASES = new Map();
function caseOf(letter, side, how) {
  const key = `${letter}${side}${how}`;
  let K = CASES.get(key);
  if (K) return K;
  const S = shapesOf().find(x => x.rooms.some(r => r.letter === letter && r.side === side && !r.mirror));
  const at = S.rooms.findIndex(r => r.letter === letter && r.side === side);
  const fit = search(S.rooms, null), rooms = fit.map((R, i) => ({ ...R, how: i === at ? how : 'push', state: 'closed' }));
  const code = layoutCodeOf(rooms), areaId = areaIdOf(code), held = LANES.get(areaId) ?? null;
  const L = held ?? buildLayout(parseHouse(code));
  const R = rooms[at], P = L.plans.plans[L.plans.order[at]], C = X4_CHUNKS[R.chunk], Q = placement(R);
  const ways = [P.paths[1], P.paths[2], ...(P.far ? [P.far.path] : [])], arcs = L.area.openings.filter(o => o.swing && (o.id === P.door || P.inner.includes(o.id))).map(o => arcOf(o, L.rects));
  const segD = (x, z, path) => { let d = Infinity; for (let i = 0; i < path.length; i++) { const a = path[i], b = path[i + 1] ?? a, vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / l2)) : 0; d = Math.min(d, Math.hypot(a[0] + vx * t - x, a[1] + vz * t - z)); } return d; };
  const farEnd = P.far ? P.far.path.at(-1) : null, scratch = {}, G = sightGridOf(scratch, areaId);
  // (seen: the line clear of the walls and closed leaves exactly (route.js lineClear) and on the sight grid's standing layer, the one
  // the marines' eyes read (sight.js; sampled every 2 cm, the far cell left out, as perception.js's walk leaves it))
  const gridSeen = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / 0.02), ce = (x, z) => [Math.floor((x - G.x0) / G.cellM), Math.floor((z - G.z0) / G.cellM)], [ie, je] = ce(b[0], b[1]);
    for (let k = 0; k <= n; k++) { const [i, j] = ce(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n); if (i === ie && j === je) continue; if (i >= 0 && j >= 0 && i < G.nx && j < G.nz && (G.bits[j * G.nx + i] & STAND)) return false; } return true; };
  const sees = (a, b) => lineClear(scratch, a, b, { area: areaId }) && gridSeen(a, b);
  const places = C.places.map((pl, i) => {
    const [x, z] = Q.P([pl.x, pl.z]), slot = sectorOf(P, x, z) ?? 1, own = P.points[slot - 1];
    const clear = Math.min(...ways.map(w => segD(x, z, w)), ...P.points.map(p => Math.hypot(p[0] - x, p[1] - z)), ...arcs.map(A => arcDist(A, x, z)));
    const dead = P.dead.some(([dx, dz, rM]) => Math.hypot(x - dx, z - dz) <= rM);
    const seen = sees(own, [x, z]) || (dead && !!farEnd && sees(farEnd, [x, z]));
    const from = slot === 1 ? (dead && farEnd ? farEnd : P.points[0]) : null, range = from ? Math.hypot(from[0] - x, from[1] - z) : null;
    const offered = !(pl.why === 'behind the door' && how === 'pull');
    return Object.freeze({ i, dx: r2(x - R.doorX), z, slot, clear: r2(clear), dead, seen, range: range === null ? null : r2(range), offered,
      ok: offered && clear >= STAND_PATH_CLEAR_M - 1e-9 && seen, hostageOk: slot === 1 && range !== null && range >= HOSTAGE_RANGE_M[0] - 1e-9 && range <= HOSTAGE_RANGE_M[1] + 1e-9 });
  });
  K = Object.freeze({ key, code, places: Object.freeze(places) });
  CASES.set(key, K);
  // (the reference lane is the case's measure only: dropped again unless it is a lane held (its memos by area id with it))
  if (!held) { dropArea(areaId); resetZones(); resetLight(); resetGraph(); }
  return K;
}
/** A room case's table (the tests print it): { key, code (its reference lane), places: [{ i, dx, z, slot, clear, dead, seen, range, offered, ok, hostageOk }] }. */
export const roomCaseOf = (letter, side, how) => caseOf(letter, side, how);

const ROLE_ORDER = (rooms) => rooms.flatMap(R => X4_CHUNKS[R.chunk].stands.map(s => ({ R, s })));
/**
 * Whether a cast is fair on a layout (see the header): { ok, why }, faces and places a stand in role order. The geometry is each
 * room case's (caseOf), so the check costs a table's reads.
 */
export function castFair(rooms, faces, places) {
  const n = (f) => faces.filter(x => x === f).length;
  if (n('hostage') > 1) return { ok: false, why: 'two hostages' };
  if (n('armoured') > 1) return { ok: false, why: 'two armoured' };
  if (!n('noshoot')) return { ok: false, why: 'no no-shoot' };
  for (let k = 0; k < 3; k++) {
    const R = rooms[k], K = caseOf(R.letter, R.side, R.how), ia = places[2 * k], ib = places[2 * k + 1];
    if (!faces.slice(2 * k, 2 * k + 2).some(f => THREATS.has(f))) return { ok: false, why: `no threat in room ${k + 1}` };
    if (ia === ib) return { ok: false, why: `one place twice in room ${k + 1}` };
    const A = K.places[ia], B = K.places[ib];
    if (!A.ok || !B.ok) return { ok: false, why: `a place not clear or not seen in room ${k + 1}` };
    if (Math.hypot(A.dx - B.dx, A.z - B.z) < STAND_GAP_M - 1e-9) return { ok: false, why: `stands too close in room ${k + 1}` };
    if (A.slot === 2 && B.slot === 2) return { ok: false, why: `two in the #2's sector in room ${k + 1}` };
    for (const [f, P] of [[faces[2 * k], A], [faces[2 * k + 1], B]]) if (f === 'hostage' && !P.hostageOk) return { ok: false, why: `the hostage out of #1's sector or range in room ${k + 1}` };
  }
  return { ok: true, why: null };
}
/** The chunks' set cast on a layout (see the header): A's faces and places by role. */
export function setCastOf(rooms) {
  const roles = ROLE_ORDER(rooms);
  return { faces: roles.map(({ s }) => COURSES.house.draws.cast[s.role].set), places: roles.map(({ s }) => s.place) };
}
/** A cast drawn from the seed for a layout (see the header): { faces, places, tries, fell } (fell: the set cast after DRAW_TRIES). */
export function drawCast(seed, layout) {
  const H = parseHouse(layout), roles = ROLE_ORDER(H.rooms), rf = stream(seed, 'house:cast'), rp = stream(seed, 'house:place');
  for (let t = 1; t <= DRAW_TRIES; t++) {
    const faces = roles.map(({ s }) => weighted(rf, COURSES.house.draws.cast[s.role].faces));
    const places = [];
    for (let k = 0; k < 3; k++) {
      const K = caseOf(H.rooms[k].letter, H.rooms[k].side, H.rooms[k].how), offer = K.places.filter(p => p.offered).map(p => p.i);
      const a = offer[int(rp, offer.length)], rest = offer.filter(i => i !== a);
      places.push(a, rest[int(rp, rest.length)]);
    }
    if (castFair(H.rooms, faces, places).ok) return { faces, places, tries: t, fell: false };
  }
  return { ...setCastOf(H.rooms), tries: DRAW_TRIES, fell: true };
}
/** A cast's part of the code: '|f…|p…'. */
export const castCodeOf = ({ faces, places }) => `|f${faces.map(f => LETTER_OF_FACE[f]).join('')}|p${places.join('')}`;
/** A whole drawn code for a seed (the fill's when no &house is given): the layout drawn, its cast drawn. */
export function drawnCodeOf(seed, opts = {}) { const L = drawHouse(seed, opts); return `${L}${castCodeOf(drawCast(seed, L))}`; }
/**
 * A code made whole for a seed: a layout part alone gains the cast drawn from the seed; a whole code is kept where its cast is fair
 * (castFair: a threat a room, a no-shoot, one hostage and one armoured at most, two places a room, never one twice nor behind a
 * pull's door, ...), else its layout kept and the cast drawn from the seed (the review of v0.0.21's A: a hand-typed
 * '…|ftttttt|p000000' was played with no no-shoot and both stands of each room on one spot); null for no code.
 */
export function wholeCodeOf(code, seed) {
  const H = parseHouse(code);
  if (!H) return null;
  if (H.faces && H.places && castFair(H.rooms, H.faces, H.places).ok) return code;
  const c = drawCast(seed, H.layout), mixed = { faces: H.faces ?? c.faces, places: H.places ?? c.places };
  return `${H.layout}${castCodeOf((H.faces || H.places) && castFair(H.rooms, mixed.faces, mixed.places).ok ? mixed : c)}`;
}
/**
 * Why a code typed for a lane (&house=) is not played as written on a seed, for the page's toast: null where it is (a layout part
 * alone, whose cast is the seed's by design, or a cast that is fair), 'no house' where it is none (unread, or off the layout rules:
 * the fill then draws from the seed or plays the set), else castFair's why for the cast
 * as given or completed from the seed (its layout kept, the cast drawn from the seed: wholeCodeOf).
 */
export function houseCodeWhy(code, seed) {
  const H = parseHouse(code);
  if (!H || !layoutOk(H.rooms)) return 'no house';
  if (!H.faces && !H.places) return null;
  const c = H.faces && H.places ? null : drawCast(seed, H.layout);
  return castFair(H.rooms, H.faces ?? c.faces, H.places ?? c.places).why;
}

/**
 * The page's note on a &house= code (null when it is played as asked): asked the URL's text, played the code the scene plays
 * (houseCodeOf of its state; HOUSE_CODE_SET or null where it plays the set or no house), seed the lane's. A code that is no
 * house, a house the scene does not play (&draw=set, "Stack and clear, live", a scene with no house) and a cast redrawn as
 * unfair each say so (the code review of 2026-11-16: the note was read from the URL alone, and said "Its rooms as given" where
 * the set was played).
 */
export function houseUrlNote(asked, played, seed) {
  if (!asked) return null;
  const drawn = played && played !== HOUSE_CODE_SET ? played : null, H = parseHouse(asked);
  if (!H || !layoutOk(H.rooms)) return played ? `No house '${asked}': ${drawn ? 'drawn from the seed' : 'the house as set'} instead.` : `No house '${asked}'.`;
  if (!drawn) return played ? `House '${asked}' not played here: the house as set.` : `House '${asked}' not played here: no shoot house in this scene.`;
  if (layoutPartOf(drawn) !== H.layout) return `House '${asked}' not played here: ${drawn} instead.`;
  const why = houseCodeWhy(asked, seed);
  return why && drawn !== asked ? `House '${asked}': ${why}. Its rooms as given, its targets drawn from the seed.` : null;
}

// ---- assembling ----

// (the set's own records, renamed into a drawn area's ids)
const renameId = (id, ic) => (typeof id === 'string' ? id.replace(/^w4\./, `${ic}.`).replace(/^o:w4:/, `o:${ic}:`).replace(/^f:w4:/, `f:${ic}:`) : id);
const setRoom = (id) => WHEEL_S4.rooms.find(r => r.id === id);
const setOpening = (id) => WHEEL_S4.openings.find(o => o.id === id);
const FLOOR = setRoom('w4.hall').floor;

// (a lane room's rooms and openings in the area (see the header), as wheel.js place() makes the set's: inner openings first, then
// the door; its rooms' ids the lane's)
function placeRoom(R, k, ic) {
  const Q = placement(R), C = Q.C, S = Q.S, roomId = (key) => (key === 'closet' ? `${ic}.closet` : key === 'far' ? `${ic}.r${k}-far` : `${ic}.r${k}`);
  const name = (r) => (r.key === 'closet' ? r.name : r.key === 'far' ? `Room ${k}, the far leg` : `Room ${k}`);
  const rooms = C.rooms.map(r => ({ id: roomId(r.key), kind: r.kind, name: name(r), rect: Q.rect(r.rect), ceilingM: 2.8, zone: `${ic}.z.house`, floor: { ...FLOOR }, ...(r.lighting ? { lighting: r.lighting } : {}) }));
  const openings = C.openings.map(o => {
    const id = o.key === 'closet' ? `o:${ic}:closet` : `o:${ic}:r${k}-${o.key}`, rest = { ...o };
    delete rest.key;
    if (o.axis === 'z') {
      const za = Q.z0 + (Q.flip ? Q.D - o.b : o.a), zb = Q.z0 + (Q.flip ? Q.D - o.a : o.b);
      const swing = o.swing ? { swing: { ...o.swing, hinge: Q.flip ? (o.swing.hinge === 'a' ? 'b' : 'a') : o.swing.hinge } } : {};
      return { id, ...rest, at: r2(Q.x0 + o.at), a: r2(za), b: r2(zb), rooms: o.rooms.map(roomId), ...swing };
    }
    return { id, ...rest, at: r2(Q.z0 + (Q.flip ? Q.D - o.at : o.at)), a: r2(Q.x0 + o.a), b: r2(Q.x0 + o.b), rooms: o.rooms.map(roomId) };
  });
  const at = R.side === 'n' ? HALL_N : HALL_S, locked = R.state === 'locked';
  openings.push({ id: `o:${ic}:r${k}`, axis: 'x', at, a: r2(Q.x0 + S.a), b: r2(Q.x0 + S.b), rooms: [`${ic}.hall`, roomId(S.room)], ...LEAF, state: 'closed',
    swing: { hinge: 'a', into: R.how === 'pull' ? 0 : 1 }, ...(locked ? { lock: { kind: 'key', holder: 'house', log: false } } : {}), kickDc: locked ? KICK_DC.locked : S.kickDc });
  return { rooms, openings };
}
// (a chunk plan placed in the lane (see the header): every point moved, its ids the lane's, its paths routed after (route))
function placePlan(R, k, ic) {
  const Q = placement(R), C = Q.C, P = C.plans[C.family[R.how]], pt = (p) => Q.P(p), door = `o:${ic}:r${k}`;
  const roomId = (key) => (key === 'closet' ? `${ic}.closet` : key === 'far' ? `${ic}.r${k}-far` : `${ic}.r${k}`);
  const innerId = (key) => (key === 'closet' ? `o:${ic}:closet` : `o:${ic}:r${k}-${key}`);
  const why = (w) => (w === 'behind the door' && R.how === 'pull' ? 'corner' : w);
  return {
    room: roomId(P.parts[0]), parts: P.parts.map(roomId), door, threshold: pt(P.threshold), entry: P.entry,
    stack: P.stack.map(pt), points: P.points.map(pt),
    corners: P.corners.map(c => { const [x, z] = pt([c.x, c.z]); return { id: c.id, x, z }; }),
    hot: P.hot.map(h => { const [x, z] = pt([h.x, h.z]); return { id: `r${k}:${h.id}`, x, z, why: why(h.why) }; }),
    sectors: P.sectors.map(s => ({ slot: s.slot, yawRad: Q.yaw(s.yawRad), halfDeg: 20 })),
    dead: P.dead.map(([x, z, rM]) => [...pt([x, z]), rM]),
    paths: { 1: P.paths[1].map(pt), 2: P.paths[2].map(pt) },
    ...(P.far ? { far: { path: P.far.path.map(pt), hot: `r${k}:${P.far.hot}` } } : {}),
    inner: P.inner.map(innerId), light: P.light,
  };
}
// (the hall's leg from the last door (see the header))
function hallPlan(last, ic) {
  const A = X4_PLANS.A.plans.hall, west = r2(last.doorX - 0.45), gx = r2(west - HALL_GATE_OFF_M), dx = r2(gx - A.gate.at);
  const s1 = [r2(A.stack[0][0] + dx), A.stack[0][1]];
  let s2 = [r2(A.stack[1][0] + dx), A.stack[1][1]];
  if (last.side === 's') s2 = [r2(Math.max(s2[0], last.doorX + 0.45 + FUNNEL_SIDE_M + BODY_C0_M)), s2[1]];
  return {
    room: `${ic}.hall`, parts: [`${ic}.hall`], door: null, gate: { ...A.gate, at: gx }, threshold: [r2(A.threshold[0] + dx), A.threshold[1]], entry: null,
    stack: [s1, s2], points: A.points.map(p => [...p]), corners: A.corners.map(c => ({ ...c })),
    hot: A.hot.map(h => ({ ...h })), sectors: A.sectors.map(s => ({ ...s })), dead: [],
    paths: { 1: [s1, [...A.points[0]]], 2: [s2, [...A.points[1]]] }, inner: [], light: A.light,
  };
}
// (a stand placed (see the header): the spec's record, HOUSE1's shape)
const toward = (x, z, tx, tz) => Math.round(Math.atan2(tz - z, tx - x) * 1e4) / 1e4;
function standOf(n, R, k, s, place, face, plan, ic) {
  const Q = placement(R), C = Q.C, pl = C.places[place], [x, z] = Q.P([pl.x, pl.z]);
  const facing = pl.face ? Q.P(pl.face) : plan.threshold, gap = COURSES.house.draws.cast[s.role].gapMs ?? null;
  const flipName = (w) => (Q.flip ? w.replace(/\bleft\b/, '\u0000').replace(/\bright\b/, 'left').replace('\u0000', 'right') : w);
  const name = face === 'hostage' ? 'the hostage card' : face === 'armoured' ? 'the armoured target' : flipName(pl.name);
  const trigger = s.trigger === 'door' ? { kind: 'door', id: plan.door, gapMs: [...gap] } : { kind: 'go' };
  return { key: `turner:${n}`, lane: n, stand: `${k}${s.letter}`, room: plan.room, door: plan.door, x, z, name, faces: [face],
    trigger, y: HOUSE1.face.centreY, faceRad: toward(x, z, facing[0], facing[1]), role: s.role, place, why: Q.flip ? flipName(pl.why) : pl.why };
}

// (a drawn layout's area and plans, no cast (see the header); registered as it is built, since its paths are routed on it)
function buildLayout(H) {
  const areaId = areaIdOf(H.layout), ic = idCodeOf(areaId), ren = (id) => renameId(id, ic);
  const parts = H.rooms.map((R, i) => placeRoom(R, i + 1, ic));
  const hallSet = setRoom('w4.hall'), boothSet = setRoom('w4.booth');
  const hall = { ...hallSet, id: ren(hallSet.id), zone: `${ic}.z.house`, floor: { ...FLOOR } };
  const booth = { ...boothSet, id: ren(boothSet.id), zone: `${ic}.z.house`, floor: { ...FLOOR } };
  const houseRooms = [hall, ...parts[0].rooms, booth, ...parts[1].rooms, ...parts[2].rooms];
  const apron = WHEEL_S4.rooms.filter(r => r.kind === 'apron').map(r => ({ ...r, id: ren(r.id), zone: `${ic}.z.apron`, floor: { ...r.floor } }));
  const re = (o) => ({ ...o, id: ren(o.id), rooms: o.rooms.map(ren), ...(o.swing ? { swing: { ...o.swing } } : {}) });
  const joins = WHEEL_S4.openings.filter(o => o.id.startsWith('o:w4:apron-')).map(re);
  const openings = [re(setOpening('o:w4:hall-e')), ...parts[0].openings, re(setOpening('o:w4:booth')), ...parts[1].openings, ...parts[2].openings, ...joins];
  const lamps = [...houseRooms.map(r => ({ x: r2((r.rect[0] + r.rect[2]) / 2), z: r2((r.rect[1] + r.rect[3]) / 2), r: 2.0 })), ...WHEEL_S4.look.lamps.slice(WHEEL_S4.rooms.filter(r => r.kind !== 'apron').length).map(l => ({ ...l }))];
  const area = deepFreeze({
    ...WHEEL_S4, id: areaId, code: ic, gen: { base: BASE, layout: H.layout },
    boundsM: { ...WHEEL_S4.boundsM }, gravity: structuredClone(WHEEL_S4.gravity), spawn: { ...WHEEL_S4.spawn },
    rooms: [...houseRooms, ...apron], openings,
    fixtures: WHEEL_S4.fixtures.map(f => ({ ...structuredClone(f), id: ren(f.id), room: ren(f.room) })),
    zones: WHEEL_S4.zones.map(zn => zn.id === 'w4.z.house' ? { id: `${ic}.z.house`, rooms: houseRooms.map(r => r.id) } : zn.id === 'w4.z.apron' ? { id: `${ic}.z.apron`, rooms: apron.map(r => r.id) } : { ...structuredClone(zn), id: ren(zn.id) }),
    portals: [], look: { ...structuredClone(WHEEL_S4.look), lamps },
  });
  registerArea(area);
  // (the plans fitted to the area with the lane's doors open (fitPath), routed where no fit holds)
  const laneDoors = H.rooms.map((R, i) => `o:${ic}:r${i + 1}`), G = openNavOf(areaId, ROUTE_CLS);
  const route = (p) => fitPath(G, p) ?? routed({}, p, { area: areaId, open: laneDoors }).map(q => [r4(q[0]), r4(q[1])]);
  const plans = {};
  H.rooms.forEach((R, i) => {
    const P = placePlan(R, i + 1, ic), raw = { 1: P.paths[1], 2: P.paths[2], far: P.far?.path ?? null };
    plans[P.door] = { ...P, paths: { 1: route(P.paths[1]), 2: route(P.paths[2]) }, ...(P.far ? { far: { ...P.far, path: route(P.far.path) } } : {}), $raw: raw };
  });
  const hp = hallPlan(H.rooms[2], ic);
  plans.hall = { ...hp, paths: { 1: route(hp.paths[1]), 2: route(hp.paths[2]) } };
  const raws = Object.fromEntries(Object.entries(plans).map(([k, P]) => [k, P.$raw ?? null]));
  for (const P of Object.values(plans)) delete P.$raw;
  const layout = deepFreeze({ lane: 'A', area: areaId, order: [...laneDoors, 'hall'], plans });
  const rects = Object.fromEntries(area.rooms.map(r => [r.id, r.rect]));
  return { area, plans: layout, raws, rects, ic, H };
}
// (a leg walkable as drawn: clear on the routing grid (nav.js clearLine, C0, every door open) and by the walker's own circle at 1 cm
// steps (collide.js standOk), as tests/room.test.mjs holds the set's)
function legOk(G, a, b) {
  if (!navClear(G, a[0], a[1], b[0], b[1])) return false;
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.01));
  for (let k = 0; k <= n; k++) if (!standOk(G, a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n)) return false;
  return true;
}
// (the nudges a waypoint may take, nearest first: every centimetre within PATH_TOL_M)
const NUDGES = (() => { const o = []; const n = Math.round(PATH_TOL_M * 100); for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) if (i * i + j * j <= n * n) o.push([i / 100, j / 100]); return o.sort((a, b) => (a[0] ** 2 + a[1] ** 2) - (b[0] ** 2 + b[1] ** 2) || a[0] - b[0] || a[1] - b[1]); })();
/**
 * A transformed path fitted to its area (see the header): its ends kept (the stack, the point), each waypoint between moved by the
 * least nudge within PATH_TOL_M that leaves both its legs walkable (legOk), in turn from the stack; null where no nudge does, and
 * the router's way round is taken instead. A room flipped across the hall keeps its distances from the walls, but the routing
 * grid's 0.25 m cells do not flip with it (the hall's south wall at 14.4 m is off the grid), so a waypoint 0.28 m off the south
 * jamb sits in a cell the grid blocks where its twin off the north one does not: the nudge moves it 4 to 5 cm, where routing
 * spliced in the cells' centres (a zigzag the keys walk badly).
 */
function fitPath(G, raw) {
  const p = raw.map(q => [...q]);
  for (let i = 1; i < p.length - 1; i++) {
    if (legOk(G, p[i - 1], p[i]) && legOk(G, p[i], p[i + 1])) continue;
    const at = p[i], best = NUDGES.map(([dx, dz]) => [r2(at[0] + dx), r2(at[1] + dz)]).find(q => legOk(G, p[i - 1], q) && legOk(G, q, p[i + 1]));
    if (!best) return null;
    p[i] = best;
  }
  for (let i = 1; i < p.length; i++) if (!legOk(G, p[i - 1], p[i])) return null;
  return p;
}
// (a drawn house's spec from its built layout and its cast (see the header))
function buildSpec(L, H, faces, places) {
  const roles = ROLE_ORDER(H.rooms), stands = [];
  roles.forEach(({ R, s }, i) => {
    const k = H.rooms.indexOf(R) + 1, plan = L.plans.plans[L.plans.order[k - 1]];
    stands.push(standOf(i + 1, R, k, s, places[i], faces[i], plan, L.ic));
  });
  const last = H.rooms[2], Hs = HOUSE1.stands.find(s => s.stand === 'H'), zoneId = `${L.ic}.z.hall-west`;
  const lastZ = last.side === 'n' ? HALL_N : HALL_S;
  stands.push({ key: 'turner:7', lane: 7, stand: 'H', room: `${L.ic}.hall`, door: null, x: Hs.x, z: Hs.z, name: Hs.name, faces: ['threat'],
    trigger: { kind: 'zone', id: zoneId, gapMs: [...Hs.trigger.gapMs] }, y: Hs.y, faceRad: toward(Hs.x, Hs.z, last.doorX, lastZ), role: 'hall', place: 0, why: 'hall' });
  return deepFreeze({
    area: L.area.id, lane: 'A', rect: [...HOUSE1.rect], hall: { ...HOUSE1.hall, room: `${L.ic}.hall`, rect: [...HOUSE1.hall.rect] },
    start: { ...HOUSE1.start }, two: { ...HOUSE1.two }, zones: { hallWest: { id: zoneId, rect: [...HOUSE1.zones.hallWest.rect] } },
    face: { ...HOUSE1.face }, standPiece: { ...HOUSE1.standPiece }, stands, catwalk: structuredClone(HOUSE1.catwalk), booth: { ...HOUSE1.booth, room: `${L.ic}.booth` },
    code: `${H.layout}${castCodeOf({ faces, places })}`, layout: H.layout,
  });
}

// (the assembled layouts, by area id, kept HOUSE_REG_KEEP of them in the order last used, the newest last (see the header); and every layout part
// assembled this session by its area id, so an evicted one comes back on a read)
const LANES = new Map(), KNOWN = new Map();
let lastUsed = null;
const byArea = (areaId) => { const L = LANES.get(areaId); if (L) { touch(areaId, L); return L; } const code = KNOWN.get(areaId); return code ? layoutOf(code) : null; };
// (a held layout read: made the newest, so the eviction takes the one least recently used, never the lane being played (the
// code review of 2026-11-16: the order was the order assembled, a hit never refreshed it); a Map keeps its keys in insertion order)
function touch(areaId, L) { if (lastUsed === areaId) return; LANES.delete(areaId); LANES.set(areaId, L); lastUsed = areaId; }
function forget(areaId) {
  if (!LANES.delete(areaId)) return;
  if (lastUsed === areaId) lastUsed = null;
  dropArea(areaId);
  resetZones(); resetLight(); resetGraph();
}
function layoutOf(layout) {
  const areaId = areaIdOf(layout);
  let L = LANES.get(areaId);
  if (L) { touch(areaId, L); return L; }
  const H = parseHouse(layout);
  if (!H || !layoutOk(H.rooms)) return null;
  L = buildLayout(H);
  LANES.set(areaId, L); lastUsed = areaId;
  KNOWN.set(areaId, H.layout);
  for (const id of [...LANES.keys()]) if (LANES.size > HOUSE_REG_KEEP && id !== areaId) forget(id);
  return L;
}
// (the registry asks for a generated id it does not hold: a layout assembled this session comes back, see the header)
useGenerated((id) => { const areaId = areaOfId(id); return areaId && KNOWN.has(areaId) ? layoutOf(KNOWN.get(areaId))?.area ?? null : null; });
// (the area id of any id inside a drawn area: 'melas.wheel.s4~<v>' itself, 'w4~<v>.r1', 'o:w4~<v>:r1', 'f:w4~<v>:desk:01')
function areaOfId(id) { const m = /~([0-9a-f]+)/.exec(String(id)); return m ? `${BASE}${GEN_MARK}${m[1]}` : null; }

const SPECS = new Map();
/**
 * A drawn house from its code (see the header): { area, spec, plans, code } (the code whole: a layout part alone gains the set
 * cast), or null for a code that is no house (the set's 'A' included). The area registered (model.js); the layouts kept by
 * HOUSE_REG_KEEP.
 */
export function assembleHouse(code) {
  // (the reads' fast path: a code read this session whose layout is still held, the same object; the seam is read many times a tick)
  const m = ASM.get(code);
  if (m) { const L = LANES.get(m.area.id); if (L?.area === m.area) { touch(m.area.id, L); return m; } }
  const out = assembleNow(code);
  if (out) { ASM.set(code, out); if (ASM.size > 8 * HOUSE_REG_KEEP) ASM.delete(ASM.keys().next().value); }
  return out;
}
const ASM = new Map();
function assembleNow(code) {
  const H = parseHouse(code);
  if (!H) return null;
  const L = layoutOf(H.layout);
  if (!L) return null;
  const cast = H.faces && H.places ? { faces: H.faces, places: H.places } : setCastOf(H.rooms);
  const whole = `${H.layout}${castCodeOf(cast)}`;
  let spec = SPECS.get(whole);
  if (!spec || spec.area !== L.area.id || !areaOf(L.area.id)) { spec = buildSpec(L, H, cast.faces, cast.places); SPECS.set(whole, spec); if (SPECS.size > 4 * HOUSE_REG_KEEP) SPECS.delete(SPECS.keys().next().value); }
  return { area: L.area, spec, plans: L.plans, code: whole };
}

/** A drawn house's area registered (model.js's registry) and returned, or null for a code that is no house. */
export function registerHouse(code) { return assembleHouse(code)?.area ?? null; }

/** A generated area by id (the registry's, model.js: a layout assembled this session comes back), or null. */
export const generatedArea = (id) => (typeof id === 'string' && id.includes(GEN_MARK) ? areaOf(id) : null);
/** A generated opening by id (the registry's), or null. */
export const generatedOpening = (id) => (typeof id === 'string' && id.includes(GEN_MARK) ? openingOf(id) : null);
/** The paths of a drawn layout as transformed, before routing (tests/house-cases.test.mjs: the routed within PATH_TOL_M of these): { [plan key]: { 1, 2, far } }. */
export const rawPathsOf = (code) => layoutOf(layoutPartOf(code))?.raws ?? null;
/** The layouts held assembled now, by area id, the last used last (the tests'). */
export const heldLayouts = () => [...LANES.keys()];
/** Forget every assembled house, its areas and the session's known layouts (TECH §2.3). */
export function resetCaches() { for (const id of [...LANES.keys()]) forget(id); lastUsed = null; KNOWN.clear(); SPECS.clear(); CASES.clear(); ASM.clear(); }
