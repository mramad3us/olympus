// OLYMPUS combat: a round that strikes nobody meets a face, and the boarding's record of it: your frangible turns to dust, their ball holes walls and the hull (WEAPONS §8.5, §8.6; COMBAT §14.5; v0.0.27, "Away the boarding party": its build sheet §0 items 6 and 7, item 12, FT§8).
//
// **Every miss meets one face, once** (missFace(state, shot, bus), the scene's houseShot calls it for each fired round that strikes
// no body, the marines' and the defenders' alike, on the boarding only: R.house.boarding). The round's line: from the shot's muzzle
// toward where it was laid (the target's middle, a turner's x, y, z or a marine's body, else level along the shot's dirRad), turned by
// the miss itself, MISS_OFF_M U(0.3, 0.9) m to one side of the man at his range and MISS_RISE_M ±0.4 m up or down (the round missed him,
// so it passed him), both drawn on stream(seed, 'hole', shotId). In plan it runs to the first rect a walker collides with (the
// area's walls and its standing fixtures, the routing grid's own list, and every hatch's leaf closed now: arms/throw.js faceAlong, the
// grenade's own), a rect the muzzle stands in left out (a muzzle poked past a jamb); in height to the deck (y 0) or the
// deckhead (the room's ceiling, 2.4 m aboard), whichever it meets first. That point is the face, and its kind:
//   hull       the deck and the deckhead plates, and a wall on the area's outer edge (WALL_KINDS: penetrate.js WALLS.pressureDoor, mild
//              steel 6 mm, the hauler's own row: src/data/places/hauler.js HAULER_WALL_ROWS);
//   bulkhead   a wall of the lock, or with no room behind it inside the hull (the voids): aluminium 8 mm;
//   cabin      a wall with a compartment either side: honeycomb 25 mm;
//   partition  the head's stalls (toiletStall, showerStall): aluminium 2 mm;
//   locker     a locker (wallLocker): WALLS.locker, mild steel 1.5 mm; a berth box is a cabin wall (honeycomb); any other fitting
//              a bulkhead's (FIXTURE_KINDS, my calls);
//   hatch      a hatch's leaf closed across the line: mild steel 6 mm, as the hull.
// The contest is penetrate.js throughMaterial at the round's speed there (ballistics.js flightOf over the line's length in the place's
// air; penOf for its pen), on the same stream: a frangible round on a hard face is half its pen and, through, only fragments: **dust**
// either way ('dust', `through` true when the fragments went on); a ball round through is a **hole** ('hole'), stopped it is a dent
// ('dust', `through` false). **No onward round**: a face ends every round, holed or not, and it strikes nobody behind it (§0 item 6:
// rounds end at the first wall, a departure from WEAPONS §8.5 said on the card). Each miss writes one record { shotId, by, side,
// face, row, kind, through, material, x, y, z, rangeM, atMs } into R.house.boarding.holes (the last HOLES_KEPT 64 kept) and its
// count into R.house.boarding.counts (never trimmed): ours { rounds, dust, through, bulkhead } (bulkhead: through a bulkhead, the
// hull or a hatch, which frangible never is), theirs { rounds, holes, hull } (hull: holed in the hull); and the 'fx' fact 'dust' for
// the stage's puff (0.3 s, E's). A round's side is ours when its shooter is you or of the fire team (team.js fireTeamOf: the holders
// from C's fill), else theirs. A round handed again while its record is kept is read back, not counted twice. No leak and no sound
// (SH§7: 32 minutes to lose 10% of the deck's air through an R-7's hole): the hull's line is the leader's bubble, the scene's (D's).
// holesOf(state) is the card's counts; holeOf(state, shotId) a round's record if kept; faceOf(state, shot) the face a miss would
// meet, writing nothing. Pure but missFace, which writes the record.
import { q } from '../../core/num.js';
import { stream, range, chance } from '../../core/rng.js';
import { playerId } from '../../core/ids.js';
import { areaOf } from '../places/model.js';
import { faceAlong } from '../arms/throw.js';
import { WALLS, throughMaterial, penOf } from '../arms/penetrate.js';
import { flightOf, envOfPlace } from '../arms/ballistics.js';
import { MODELS } from '../arms/models.js';
import { loadOf } from '../arms/calibres.js';
import { turnerOf } from '../arms/turners.js';
import { fireTeamOf } from './team.js';
import { opOf } from './op.js';
import { HAULER_WALL_ROWS } from '../../data/places/hauler.js';

/** The records kept (the counts never trimmed; my call). */
export const HOLES_KEPT = 64;
/** A miss passes the man this far to one side (m, a uniform draw) and this far up or down (m, ±; my calls). */
export const MISS_OFF_M = Object.freeze([0.3, 0.9]), MISS_RISE_M = 0.4;
/** The line's reach in plan where nothing stops it sooner (m: beyond any deck). */
export const MISS_REACH_M = 40;
/** The face kinds' rows of penetrate.js WALLS (see the header): the hauler's four, a locker's and a closed hatch's leaf. */
export const WALL_KINDS = Object.freeze({ ...HAULER_WALL_ROWS, locker: 'locker', hatch: 'pressureDoor' });
/** The standing fittings' face kinds (see the header); any other a bulkhead's. */
export const FIXTURE_KINDS = Object.freeze({ toiletStall: 'partition', showerStall: 'partition', wallLocker: 'locker', berthBox: 'cabin' });
/** The kinds a marine's round must never go through (F160): the hull, a bulkhead and a hatch's leaf. */
export const SEALED_KINDS = Object.freeze(new Set(['hull', 'bulkhead', 'hatch']));
/** A deck's clear height where a room names none (m). */
const CEILING_M = 2.4;
/** The man's middle on his face where a target gives none (m; a board's, hauler.js's DECK_Y_M). */
const MAN_Y_M = 1.35;

const boardingOf = (state) => opOf(state)?.boarding ?? null;
const freshCounts = () => ({ ours: { rounds: 0, dust: 0, through: 0, bulkhead: 0 }, theirs: { rounds: 0, holes: 0, hull: 0 } });

/** A shooter's side (see the header): 'ours' or 'theirs'. */
export function sideOfShooter(state, pid) {
  return !!pid && (pid === playerId(state) || fireTeamOf(state).some(m => m.pid === pid)) ? 'ours' : 'theirs';
}

// (where the round was laid: the target's middle, or null for a shot with no target)
function aimedAt(state, shot) {
  const key = shot.target ?? null;
  if (!key) return null;
  const T = turnerOf(state, key);
  if (T) return [T.x, Number.isFinite(T.y) ? T.y : MAN_Y_M, T.z];
  const who = key.startsWith('m:') ? key.slice(2) : key, a = (state.actors?.list ?? []).find(x => x.who === who) ?? (who === playerId(state) ? (state.actors?.list ?? []).find(x => x.id === state.player?.actor) : null);
  return a ? [a.x, a.onFace === 'deckhead' ? CEILING_M - MAN_Y_M : MAN_Y_M, a.z] : null;
}
// (the room a point stands in, by the area's rects, strictly inside)
const roomIn = (A, x, z) => (A?.rooms ?? []).find(r => x > r.rect[0] && x < r.rect[2] && z > r.rect[1] && z < r.rect[3]) ?? null;
// (a wall rect's kind at the point the line met it: the rooms either side of it there, the area's edge the hull)
function wallKind(A, r, x, z) {
  const b = A.boundsM ?? {}, e = 0.05, thinX = r.x1 - r.x0 < r.z1 - r.z0;
  if (x <= (b.x0 ?? -Infinity) + e || x >= (b.x1 ?? Infinity) - e || z <= (b.z0 ?? -Infinity) + e || z >= (b.z1 ?? Infinity) - e) return 'hull';
  const mx = (r.x0 + r.x1) / 2, mz = (r.z0 + r.z1) / 2, k = 0.2;
  const a = thinX ? roomIn(A, mx - k, z) : roomIn(A, x, mz - k), c = thinX ? roomIn(A, mx + k, z) : roomIn(A, x, mz + k);
  if (!a || !c) return 'bulkhead';
  return a.kind === 'lock' || c.kind === 'lock' ? 'bulkhead' : 'cabin';
}

/**
 * The face a missed round meets (see the header), without writing anything: { face, row, x, y, z, rangeM } or null where the line
 * leaves the area unmet (never aboard: the hull bounds it).
 */
export function faceOf(state, shot, area = state.places?.live?.area ?? null) {
  const F = meet(state, shot, area);
  return F ? { face: F.face, row: F.row, x: F.x, y: F.y, z: F.z, rangeM: F.rangeM } : null;
}
// (the face met, with the round's stream as the miss left it: the contest draws on from there)
function meet(state, shot, area) {
  const A = area ? areaOf(area) : null, m = shot?.muzzle;
  if (!A || !m) return null;
  const r = stream(state.meta?.seed ?? 0, 'hole', shot.id ?? shot.atMs ?? 0), to = aimedAt(state, shot);
  let dx, dy, dz;
  if (to) {
    // (the miss: the line turned to pass the man MISS_OFF_M to a side and MISS_RISE_M up or down, at his range)
    const ax = to[0] - m.x, az = to[2] - m.z, d = Math.sqrt(ax * ax + az * az) || 1e-6, off = range(r, MISS_OFF_M[0], MISS_OFF_M[1]) * (chance(r, 0.5) ? 1 : -1), rise = range(r, -MISS_RISE_M, MISS_RISE_M);
    dx = ax / d - az / d * off / d; dz = az / d + ax / d * off / d; dy = (to[1] + rise - (m.y ?? MAN_Y_M)) / d;
  } else { dx = Math.cos(shot.dirRad ?? 0); dz = Math.sin(shot.dirRad ?? 0); dy = 0; }
  const n = Math.sqrt(dx * dx + dz * dz) || 1;
  dx /= n; dz /= n; dy /= n;
  // (the first rect in plan: the walls and the standing fittings, and every hatch's leaf closed now, a rect round the muzzle left out:
  // arms/throw.js faceAlong, the grenade's own)
  const best = faceAlong(state, area, [m.x, m.z], dx, dz, MISS_REACH_M);
  // (in height: the deck or the deckhead, the room's ceiling where the muzzle stands)
  const ceil = roomIn(A, m.x, m.z)?.ceilingM ?? CEILING_M, y0 = m.y ?? MAN_Y_M;
  const tY = dy > 1e-9 ? (ceil - y0) / dy : dy < -1e-9 ? -y0 / dy : Infinity;
  if (!best && !Number.isFinite(tY)) return null;
  const t = Math.min(best?.t ?? Infinity, tY), px = m.x + dx * t, pz = m.z + dz * t, py = y0 + dy * t;
  let face;
  if (tY <= (best?.t ?? Infinity)) face = 'hull';
  else if (best.tag.startsWith('leaf:')) face = 'hatch';
  else if (best.tag === 'wall') face = wallKind(A, best.rect, px, pz);
  else face = FIXTURE_KINDS[(A.fixtures ?? []).find(f => f.id === best.tag)?.kind] ?? 'bulkhead';
  return { face, row: WALL_KINDS[face] ?? 'bulkhead', x: q(px, 0.01), y: q(Math.max(0, Math.min(ceil, py)), 0.01), z: q(pz, 0.01), rangeM: q(t * Math.sqrt(1 + dy * dy), 0.01), r };
}

/**
 * A round that struck nobody, met by its face (w; see the header): the record written (R.house.boarding.holes, .counts) and the 'fx'
 * fact 'dust'; returns { face, kind: 'dust' | 'hole', through, material, atMs, … } or null (no boarding, no shot fired, no face met).
 */
export function missFace(state, shot, bus = null) {
  const B = boardingOf(state);
  if (!B || !shot?.fired) return null;
  if ((B.holes ?? []).some(h => h.shotId === shot.id)) return B.holes.find(h => h.shotId === shot.id);
  const F = meet(state, shot, state.places?.live?.area ?? null);
  if (!F) return null;
  const gun = state.items?.[shot.gun], model = MODELS[gun?.model] ? gun.model : 'r7', cal = MODELS[model].cal, load = shot.load ?? 'ball';
  const W = WALLS[F.row] ?? WALLS.bulkhead, frangible = !!loadOf(cal, load)?.frangible;
  const v = flightOf(model, load, envOfPlace(state), Math.max(0, F.rangeM)).vMs;
  const c = throughMaterial(F.r, { penMm: penOf(cal, load, v), material: W.material, mm: W.mm, frangible });
  const through = !c.stopped, kind = through && !c.fragments ? 'hole' : 'dust', by = shot.who ?? null, side = sideOfShooter(state, by), atMs = shot.atMs ?? state.clock.ms;
  const rec = { shotId: shot.id ?? null, by, side, face: F.face, row: F.row, kind, through, material: W.material, x: F.x, y: F.y, z: F.z, rangeM: F.rangeM, atMs };
  (B.holes ??= []).push(rec);
  if (B.holes.length > HOLES_KEPT) B.holes.splice(0, B.holes.length - HOLES_KEPT);
  const f = freshCounts(), C = (B.counts = { ours: { ...f.ours, ...B.counts?.ours }, theirs: { ...f.theirs, ...B.counts?.theirs } });
  if (side === 'ours') { C.ours.rounds++; if (through) C.ours.through++; else C.ours.dust++; if (through && SEALED_KINDS.has(F.face)) C.ours.bulkhead++; }
  else { C.theirs.rounds++; if (kind === 'hole') { C.theirs.holes++; if (F.face === 'hull') C.theirs.hull++; } }
  bus?.emit('fx', { kind: 'dust', x: F.x, y: F.y, z: F.z, atMs, face: F.face, hole: kind === 'hole', size: 0.3 });
  return rec;
}

/** The card's counts (see the header): { ours: { rounds, dust, through, bulkhead }, theirs: { rounds, holes, hull } }, zeros before any. */
export function holesOf(state) {
  const C = boardingOf(state)?.counts ?? {}, f = freshCounts();
  return { ours: { ...f.ours, ...(C.ours ?? {}) }, theirs: { ...f.theirs, ...(C.theirs ?? {}) } };
}

/** A round's record if it is still kept (the last HOLES_KEPT), else null. */
export const holeOf = (state, shotId) => (boardingOf(state)?.holes ?? []).find(h => h.shotId === shotId) ?? null;
