// OLYMPUS people: where the placed people are, and the actors layer that puts them there without anyone popping in view (PEOPLE §4.6; the 0.0.3 build sheet §2.2).
//
// No AI yet: this round the people the player can meet are placed, not walked. placed(state) is the
// player's squad (its twelve and the player), the fire watch and nobody else; everyone else exists in
// state and is `away` (the sheet §8, item 10). whereIs(state, personId, ms) is PEOPLE §4.6's lookup
// cut to what exists: for the player, their actor (the truth on the map), else their berth's foot; for
// a placed person, by the lighting of their berth's room (places' lightingOf: the people sleep when
// the bay's lights are out, so the poses and the lamps flip together at taps, 22:00, and reveille,
// 05:30 on weekdays and 07:00 at the weekend):
//   lights out   lying in their berth (posture 'lie', y and head the seat's, PT kit), the rack's
//                curtain drawn where the rack has curtains (its own `curtains`, else every rack of a
//                squad bay: PLACES §4.4) by hash01('curtain', id, the night's sol) < CURTAIN_FRAC (one
//                draw a night, the night's sol counted from 8 hours before);
//   otherwise    at their rack by hashInt(3, 'pose', id, floor(ms / POSE_PERIOD_MS)), two hours a pose
//                (my call): 0 or 1 sitting, 2 standing at their locker. The lower berth sits on the
//                rack's edge on the side its lockers stand (facing them), the upper on the rack's
//                footlocker (facing the aisle), so no two share a spot; utilities, no cover indoors.
// The fire watch (fireWatchOf: one Pvt to LCpl of 2nd Platoon's 2nd or 3rd Squad, drawn once a world
// on stream('roster', seed, '2/4-E-2', 'fire-watch'), the sheet §8, item 9) sits at the post's seat
// in bay-2-1 from taps to reveille, facing down the bay, and by day is at their own berth as above
// (in their own squad's bay: the sheet's "bay-2-2" read as theirs, since the draw may give 3rd Squad).
//
// The layer (TECH §3.1 layer 3, actorsStep): when the live area is not the one the actors were made
// for (state.actors.area, saved so a load carries on with the same actors), syncActors makes them
// again behind the view's cut: the player's actor kept, every placed person whose whereIs is on the
// live area made at once with a new a<n> id, in person order. Otherwise each placed actor is looked at
// on its second's bucket (phase mod 20 = hash(personId) mod 20: CONTRACTS §5), and takes its whereIs
// only if the player can see neither where it is nor where it would go (perception's visibility, the
// fog's own function: the sheet §8, item 11; stricter than its canSee, my call: any visibility above
// 0 holds a change, so nothing moves in the fog's soft edge either, and a rack's curtain counts as
// seen with its rack): nobody changes posture, appears or vanishes in sight.
// A change held back is counted ($people.stats.deferred). In a skip (TIME §5.9) the slow contributor
// 'people:place' puts every actor at its whereIs at each step's end by the same rule: those the
// player cannot see, where they are or where they would go, take it; those in sight keep their pose
// until the live layer finds them unseen (an asleep player sees nothing, so a night's sleep moves
// everyone). So R's wait across reveille, facing the squad, leaves the squad as it was until you look
// away (the sheet's acceptance item 6; v0.0.3's review: nine changed in one frame, seven in sight),
// and the screen after a skip shows the people you could not see where the time has put them.
import { hash, hash01, hashInt } from '../../core/hash.js';
import { stream, pick } from '../../core/rng.js';
import { TICK_MS, HOUR_MS } from '../../core/clock.js';
import { localSol } from '../../core/calendar.js';
import { nextId, playerActor, playerId, cmpId } from '../../core/ids.js';
import { areaOf, lonOf } from '../places/model.js';
import { seatOf, postOf, spotsOf } from '../places/fixtures.js';
import { lightingOf } from '../places/light.js';
import { eyeOf, visibility } from './perception.js';

/** The fire watch's post in bay-2-1 (the sheet §2.1's posts). */
export const FIRE_WATCH_POST = 'fire-watch:2/4-E-2';
/** How long a daytime pose lasts before the hash may pick another (my call). */
export const POSE_PERIOD_MS = 7_200_000;
/** The share of nights a rack's curtain is drawn, where it has one (my call). */
export const CURTAIN_FRAC = 0.5;
/** The night's sol is counted from this long before (so 22:00 to 07:00 is one night). */
export const NIGHT_BACK_MS = 8 * HOUR_MS;
/** Seconds-bucket count: a person is looked at once a game second (CONTRACTS §5). */
export const BUCKETS = 1000 / TICK_MS;
/** How far the lower berth's sitter sits from the rack's centre: across, toward its lockers, and along, toward its foot (my calls). */
export const SIT_ACROSS_M = 0.3, SIT_ALONG_M = 0.45;

const FIRE_WATCH_RANKS = new Set(['Pvt', 'PFC', 'LCpl']);
const FACE_OF = (dx, dz) => (Math.abs(dx) > Math.abs(dz) ? (dx < 0 ? 'left' : 'right') : (dz < 0 ? 'up' : 'down'));
const FOOT = Object.freeze({ down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] });

// (the people runtime: the fire watch's draw per state, the layer's counters)
const peopleRt = (state) => (state.$people ??= {});
/** The actors layer's counters (runtime): { deferred, changed, synced, checks }. */
export function placeStats(state) { return (peopleRt(state).stats ??= { deferred: 0, changed: 0, synced: 0, checks: 0 }); }

// (places' data is frozen and the same in every career: an area's fixtures by id, and a seat's record, kept once found)
const fixtureIndex = new WeakMap(), seatMemo = new Map(), spotMemo = new Map();
function fixtureOf(areaId, fixtureId) {
  const area = areaOf(areaId);
  if (!area) return null;
  let m = fixtureIndex.get(area);
  if (!m) fixtureIndex.set(area, (m = new Map((area.fixtures ?? []).map(f => [f.id, f]))));
  return m.get(fixtureId) ?? null;
}
// (places' lightingOf for a room at an instant, kept for the rest of that instant: the squad shares one bay)
let litMemo = { state: null, ms: NaN, rooms: new Map() };
function lit(state, areaId, roomId, ms) {
  if (litMemo.state !== state || litMemo.ms !== ms) litMemo = { state, ms, rooms: new Map() };
  const key = `${areaId}|${roomId}`;
  let v = litMemo.rooms.get(key);
  if (v === undefined) litMemo.rooms.set(key, (v = lightingOf(state, areaId, roomId, ms)));
  return v;
}
const seatFor = (seatId) => { if (!seatMemo.has(seatId)) seatMemo.set(seatId, seatOf(seatId)); return seatMemo.get(seatId); };
const firstSpot = (fx) => { if (!spotMemo.has(fx.id)) spotMemo.set(fx.id, spotsOf(fx)[0] ?? null); return spotMemo.get(fx.id); };
/** Whether a berth's rack has a curtain: the rack's own word, else every rack of a squad bay (PLACES §4.4: "berthing is mixed by squad behind rack curtains"). */
export function hasCurtains(seat, rack) {
  if (rack?.curtains !== undefined) return !!rack.curtains;
  return areaOf(seat.area)?.rooms?.find(r => r.id === seat.room)?.kind === 'squadBay';
}

/** The fire watch's person id: drawn once a world from 2nd Platoon's 2nd and 3rd Squads' Pvt to LCpl (see the header), or null. */
export function fireWatchOf(state) {
  const rt = peopleRt(state);
  if (rt.fireWatch !== undefined && rt.fireWatchSeed === state.meta.seed) return rt.fireWatch;
  const ids = [];
  for (const unit of ['2/4-E-2-2', '2/4-E-2-3']) for (const id of Object.values(state.units?.[unit]?.billets ?? {})) {
    if (FIRE_WATCH_RANKS.has(state.people?.[id]?.service?.rank)) ids.push(id);
  }
  ids.sort(cmpId);
  rt.fireWatch = ids.length ? pick(stream('roster', state.meta.seed, '2/4-E-2', 'fire-watch'), ids) : null;
  rt.fireWatchSeed = state.meta.seed;
  return rt.fireWatch;
}

/** The people placed this round, in id order: the player's squad (the player among them) and the fire watch. */
export function placed(state) {
  const me = playerId(state), unit = state.people?.[me]?.service?.unitId;
  if (!unit || !state.units?.[unit]) return [];
  // (kept until the player, their unit, the fire watch or the people counter moves: billets change only as people are made this round)
  const billets = state.units[unit].billets, fw = fireWatchOf(state), rt = peopleRt(state);
  const key = `${me}|${unit}|${fw}|${state.meta?.next?.p ?? 0}`;
  if (rt.placedKey !== key) {
    const out = new Set(Object.values(billets));
    if (fw) out.add(fw);
    rt.placed = Object.freeze([...out].sort(cmpId));
    rt.placedSet = new Set(rt.placed);
    rt.placedKey = key;
  }
  return rt.placed;
}
const placedSet = (state) => { placed(state); return peopleRt(state).placedSet ?? new Set(); };

// (a berth's pose by day, from its seat: the lower on the rack's edge or at their locker, the upper on the footlocker or at their locker)
function dayPose(state, id, seat, ms) {
  const n = Number(seat.id.slice(seat.id.lastIndexOf('#') + 1));
  const rack = fixtureOf(seat.area, seat.fixture);
  const sit = hashInt(3, 'pose', id, Math.floor(ms / POSE_PERIOD_MS)) < 2;
  const base = { area: seat.area, outfit: 'utilities', curtain: false };
  const locker = seat.lockerId ? fixtureOf(seat.area, seat.lockerId) : null;
  if (!sit && locker) {
    const spot = firstSpot(locker);
    return { ...base, x: spot.x, z: spot.z, y: 0, face: spot.face, posture: 'stand', spotId: spot.id };
  }
  const face = rack?.face ?? 'down';
  if (n >= 3 && seat.footlockerId) {
    const fl = fixtureOf(seat.area, seat.footlockerId);
    if (fl) return { ...base, x: fl.x, z: fl.z, y: 0.4, face, posture: 'sit', spotId: `${fl.id}#2` };
  }
  if (n >= 3 && locker) {                                            // (no footlocker: the upper stands at their locker)
    const spot = firstSpot(locker);
    return { ...base, x: spot.x, z: spot.z, y: 0, face: spot.face, posture: 'stand', spotId: spot.id };
  }
  // (the lower on the rack's edge, toward its lockers and its foot, facing the lockers)
  const [fx, fz] = FOOT[face];
  const side = locker ? Math.sign((face === 'down' || face === 'up') ? locker.x - rack.x : locker.z - rack.z) || 1 : 1;
  const ax = face === 'down' || face === 'up' ? side : 0, az = face === 'down' || face === 'up' ? 0 : side;
  const x = Math.round(((rack?.x ?? seat.x) + ax * SIT_ACROSS_M + fx * SIT_ALONG_M) * 10000) / 10000;
  const z = Math.round(((rack?.z ?? seat.z) + az * SIT_ACROSS_M + fz * SIT_ALONG_M) * 10000) / 10000;
  return { ...base, x, z, y: seat.y, face: FACE_OF(ax, az), posture: 'sit', spotId: seat.id };
}

// (a berth at night: lying in it, the curtain by the night's draw where the rack has one)
function nightPose(state, id, seat, ms) {
  const rack = fixtureOf(seat.area, seat.fixture);
  const night = localSol(ms - NIGHT_BACK_MS, lonOf(state)).sol;
  const curtain = hasCurtains(seat, rack) && hash01('curtain', id, night) < CURTAIN_FRAC;
  return { area: seat.area, x: seat.x, z: seat.z, y: seat.y, face: rack?.face ?? 'down', posture: 'lie', spotId: seat.id, outfit: 'pt', curtain };
}

/**
 * Where a person is at game time ms (see the header): { area, x, z, y, face, posture, spotId,
 * outfit, curtain }, or { away: true } for anyone not placed (they exist, off the map).
 */
export function whereIs(state, personId, ms = state.clock.ms) {
  const p = state.people?.[personId];
  if (!p) return { away: true };
  if (personId === playerId(state)) {
    const me = playerActor(state);
    if (me) return { area: state.places?.live?.area ?? null, x: me.x, z: me.z, y: me.y ?? 0, face: me.face ?? 'down', posture: 'stand', spotId: null, outfit: 'utilities', curtain: false };
    const seat = p.berthId ? seatFor(p.berthId) : null, rack = seat ? fixtureOf(seat.area, seat.fixture) : null;
    const foot = rack ? firstSpot(rack) : null;
    return foot ? { area: seat.area, x: foot.x, z: foot.z, y: 0, face: 'down', posture: 'stand', spotId: foot.id, outfit: 'utilities', curtain: false } : { away: true };
  }
  if (!placedSet(state).has(personId)) return { away: true };
  const seat = p.berthId ? seatFor(p.berthId) : null;
  if (personId === fireWatchOf(state)) {
    const post = postOf(FIRE_WATCH_POST), ps = post ? seatFor(post.seatId) : null;
    if (ps && lit(state, ps.area, ps.room, ms) === 'lightsOut') {
      const room = areaOf(ps.area)?.rooms?.find(r => r.id === ps.room);
      const face = room ? FACE_OF((room.rect[0] + room.rect[2]) / 2 - ps.x, (room.rect[1] + room.rect[3]) / 2 - ps.z) : 'up';
      return { area: ps.area, x: ps.x, z: ps.z, y: ps.y, face, posture: 'sit', spotId: ps.id, outfit: 'utilities', curtain: false };
    }
    return seat ? dayPose(state, personId, seat, ms) : { away: true };
  }
  if (!seat) return { away: true };
  return lit(state, seat.area, seat.room, ms) === 'lightsOut' ? nightPose(state, personId, seat, ms) : dayPose(state, personId, seat, ms);
}

// ---- the actors ----

const DEFAULTS = Object.freeze({ y: 0, posture: 'stand', outfit: 'utilities', curtain: false, spotId: null });
// (an actor put at a pose: the defaults left out, no glide)
function setPose(a, w) {
  a.x = w.x; a.z = w.z; a.face = w.face;
  for (const k of Object.keys(DEFAULTS)) { if (w[k] === undefined || w[k] === DEFAULTS[k]) delete a[k]; else a[k] = w[k]; }
  a.$px = w.x; a.$pz = w.z;
  return a;
}
const samePose = (a, w) => a.x === w.x && a.z === w.z && a.face === w.face && (a.y ?? 0) === w.y && (a.posture ?? 'stand') === w.posture
  && (a.outfit ?? 'utilities') === w.outfit && !!a.curtain === !!w.curtain && (a.spotId ?? null) === (w.spotId ?? null);

/** Whether the roster exists: a state the people layers act on (the sandbox has none). */
export const hasRoster = (state) => !!state.units && Object.keys(state.units).length > 0 && !!state.people?.[playerId(state)]?.service;

/** Make the live area's actors again (see the header): the player's kept, the placed made at whereIs. Returns the list. */
export function syncActors(state, ms = state.clock.ms) {
  const live = state.places?.live?.area ?? null;
  state.actors ??= { list: [] };
  const me = playerActor(state);
  const list = me ? [me] : [];
  if (hasRoster(state)) for (const pid of placed(state)) {
    if (pid === playerId(state)) continue;
    const w = whereIs(state, pid, ms);
    if (w.away || w.area !== live) continue;
    list.push(setPose({ id: nextId(state, 'a'), who: pid, x: 0, z: 0, face: 'down', gait: 'idle' }, w));
  }
  state.actors.list = list;
  if (live) state.actors.area = live; else delete state.actors.area;
  placeStats(state).synced++;
  return list;
}

/** Every placed actor at its whereIs now, seen or not (a test's, or a cut's, word). */
export function placeAll(state, ms = state.clock.ms) {
  for (const a of state.actors?.list ?? []) {
    if (!a.who || a.id === state.player?.actor) continue;
    const w = whereIs(state, a.who, ms);
    if (!w.away && !samePose(a, w)) setPose(a, w);
  }
}

/** Every placed actor the player cannot see at its whereIs now, where it is or where it would go (a skip's step: see the header). */
export function placeUnseen(state, ms = state.clock.ms) {
  const me = playerActor(state), st = placeStats(state), live = state.places?.live?.area ?? null;
  let eye = null;
  for (const a of state.actors?.list ?? []) {
    if (!a.who || a === me) continue;
    const w = whereIs(state, a.who, ms);
    if (w.away || w.area !== live || samePose(a, w)) continue;
    eye ??= me ? eyeOf(state, me) : null;
    if (eye && (inSight(state, eye, a.x, a.z, ms) || inSight(state, eye, w.x, w.z, ms))) { st.deferred++; continue; }
    setPose(a, w);
    st.changed++;
  }
}

/** TECH §3.1 layer 3 (see the header). */
export function actorsStep(state, input, bus, ctx) {
  if (!hasRoster(state)) return;
  const live = state.places?.live?.area ?? null;
  if ((state.actors?.area ?? null) !== live) { syncActors(state); return; }
  const ms = state.clock.ms, phase = Math.floor(ms / TICK_MS) % BUCKETS;
  const me = playerActor(state), st = placeStats(state);
  let eye = null;
  for (const a of state.actors.list) {
    if (!a.who || a === me || hash(a.who) % BUCKETS !== phase) continue;
    st.checks++;
    const w = whereIs(state, a.who, ms);
    if (w.away || w.area !== live || samePose(a, w)) continue;
    eye ??= me ? eyeOf(state, me) : null;
    if (eye && (inSight(state, eye, a.x, a.z, ms) || inSight(state, eye, w.x, w.z, ms))) { st.deferred++; continue; }
    setPose(a, w);
    st.changed++;
  }
}

/**
 * Whether a spot is anywhere in the player's sight, however dim (visibility above 0), curtains not
 * counted: where a pose may not change (stricter than canSee's SEEN, my call: the view draws everyone
 * and dims the unseen, so nothing may move even in the fog's soft edge, and a drawn curtain, which
 * goes with its sleeper, must not vanish where the rack is in view).
 */
export const inSight = (state, eye, x, z, ms = state.clock.ms) => visibility(state, eye, x, z, ms) > 0;

/** The slow contributor 'people:place' (TIME §5.9): in a skip, every actor out of the player's sight at its whereIs at the step's end. */
export function placeSlowStep(state, bus, fromMs, toMs, sctx = {}) {
  if (!sctx.skipping || !hasRoster(state)) return;
  if ((state.actors?.area ?? null) !== (state.places?.live?.area ?? null)) syncActors(state, toMs);
  else placeUnseen(state, toMs);
}
