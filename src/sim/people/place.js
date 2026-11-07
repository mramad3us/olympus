// OLYMPUS people: where the placed people are, how they get up and lie down in sight, and the actors layer that puts them there without anyone popping in view (PEOPLE §4.6, TIME §5.9; the 0.0.3 build sheet §2.2, the 0.0.4 sheet §2.2.7).
//
// No AI yet: the people the player can meet are placed, not walked. placed(state) is the player's
// squad (its twelve and the player), the fire watch and nobody else; everyone else exists in state
// and is `away` (the 0.0.3 sheet §8, item 10). whereIs(state, personId, ms) is PEOPLE §4.6's lookup cut
// to what exists: for the player, their actor (the truth on the map: its posture, height, spot and
// outfit), else their berth's foot; for a placed person, in this order:
//   a drill     from the klaxon (time.drills, src/sim/time/pod.js) they rise at its time plus their
//               call delay, dress from PT kit into utilities and stand at their rack's foot (the
//               muster: the 0.0.4 sheet §8, item 4) until the stand-down; then, after their delay,
//               they undress to PT kit and lie down again, back in the night's pose once it is done;
//   lights out  lying in their berth (posture 'lie', y and head the seat's, PT kit), the rack's
//               curtain drawn where the rack has curtains (its own `curtains`, else every rack of a
//               squad bay: PLACES §4.4) by hash01('curtain', id, the night's sol) < CURTAIN_FRAC (one
//               draw a night, the night's sol counted from 8 hours before), the lamps' state from
//               places' lightingOf (taps 22:00, reveille 05:30 on weekdays, 07:00 at the weekend);
//   reveille    from reveille (the lights on: the first whole second, as the reveille event) for
//               REVEILLE_STAND_MS 10 minutes, to the muster at 05:40: risen at their delay, standing at
//               their rack's foot in PT kit;
//   otherwise   at their rack by hashInt(3, 'pose', id, floor(ms / POSE_PERIOD_MS)), two hours a pose
//               (my call): 0 or 1 sitting, 2 standing at their locker. The lower berth sits on the
//               rack's edge on the side its lockers stand (facing them), the upper on the rack's
//               footlocker (facing the aisle), so no two share a spot; utilities, no cover indoors.
// The staff (0.0.5: the range officer and the coach, src/sim/people/staff.js) are placed where they are
// posted: placed() adds those whose person.post is on the live area, and whereIs gives a posted
// person their post's pose (its area, place, height, facing, posture and outfit) whatever the hour.
// The fire watch (fireWatchOf: one Pvt to LCpl of 2nd Platoon's 2nd or 3rd Squad, drawn once a world
// on stream('roster', seed, '2/4-E-2', 'fire-watch'), the 0.0.3 sheet §8, item 9) sits at the post's
// seat in bay-2-1 from taps to reveille, facing down the bay, stands at the post through a drill and
// sits again after it, and by day is at their own berth as above.
// A transition (the 0.0.4 sheet §2.2.7, §8 item 18) is a lived change shown in sight, never a pop: the
// pose whereIs returns holds the end state, and its `trans` { kind: 'rise' | 'down' | 'sit' | 'stand' |
// 'step', fromMs, ms, from: { posture, x, z, y, face, head }, via (the berth's edge), climb (an upper
// berth's foot of the climb) } and `dress` { fromMs, ms, from, to }
// say where it came from and when, so poseAt(actor, ms) draws it frame by frame: the rise lying (0),
// sitting up (to 0.35, the body drawn from the berth's middle toward its edge), sitting on the rack's
// edge (to 0.55: SIT_ACROSS_M toward its lockers), the climb down from an upper berth (0.55 to 0.8, y
// from 1.35 to 0), standing up (0.8, the half metre to the foot) and standing at the foot (1)
// (RISE_KEYS); from a lower berth (LOWER_KEYS) sitting up (to 0.35), on the edge (to 0.5), standing
// up off it in place (to 0.62) and the steps out to the rack's foot at a walk, the gait's frames by
// the distance walked ('walk', walkM: my call; the foot is 1.55 m from the edge, and v0.0.4 slid it in
// the half-risen frame over its last 20%, 3.1 m/s); lying down is the same backwards. Every position
// moves continuously through it (no keyframe jumps a cell). The lengths
// (the user, 2026-11-06, of v0.0.4's: "slightly slower animations on getting in and out of rack":
// 1.6 times v0.0.4's 2.5 s and 3.4 s, an upper berth's shares kept): at the alarm's tempo, the klaxon and
// a training sol's reveille, RISE_MS 4.0 s (an upper berth RISE_UPPER_MS 5.5 s, the climb), DOWN_MS
// 4.0 s (5.5 s), SIT_MS 1.8 s; when nothing hurries (the weekend's reveille, the stand-down, going to
// bed, getting up after a nap) UNHURRIED_K 1.2 times those, to the tick: 4.8 s, 6.6 s and 2.15 s
// (my call); STEP_IN_MS 0.4 s either way. transMs(kind, upper, hurried) gives them. Each person's call
// delay is callDelay(pid, cause, atMs, seed): CALL_DELAY_MS[cause] by hash of the world's seed, the
// person, the call and its moment, so each night and each career has its own order (v0.0.4 hashed the
// person and the call alone, and the same marine rose first every night of every career); the klaxon's
// 1 to 10 s, so the bay is seen scrambling while you get up yourself (v0.0.4's 2 to 20 s left eleven of
// the twelve still in their racks when a quick player's dressing splash began, and their rises went by
// in its time-lapse), reveille's and the stand-down's 2 to 20 s (cosmetic: it moves no dice).
// squadCall(state, cause, atMs) is the call itself (reveille, the
// klaxon, the stand-down: pod.js's handlers): every placed live actor whose whereIs is a transition
// from the pose it holds takes it at once, trans and dress with it, in sight or not, since what it
// shows is lived; any other change waits for the player to look away, as always.
// The layer (TECH §3.1 layer 3, actorsStep): when the live area is not the one the actors were made
// for (state.actors.area, saved so a load carries on with the same actors), syncActors makes them
// again behind the view's cut: the player's actor kept, every placed person whose whereIs is on the
// live area made at once with a new a<n> id, in person order. Otherwise each placed actor is looked at
// on its second's bucket (phase mod 20 = hash(personId) mod 20: CONTRACTS §5): an expired trans or
// dress is dropped, and it takes its whereIs if that is a transition from the pose it holds (seen or
// not), else only if the player can see neither where it is nor where it would go (perception's
// visibility, the fog's own function: the 0.0.3 sheet §8, item 11; stricter than its canSee, my call:
// any visibility above 0 holds a change, so nothing moves in the fog's soft edge either, and a rack's
// curtain counts as seen with its rack): nobody changes posture, appears or vanishes in sight but by
// a transition. A change held back is counted ($people.stats.deferred). In a skip (TIME §5.9) the
// slow contributor 'people:place' puts every actor at its whereIs at each step's end by the same rule
// (an asleep player sees nothing, so a night's sleep moves everyone), and the screen after a skip shows
// the people you could not see where the time has put them.
// The hair (0.0.6; the build sheet 0.0.6 §2.2): whereIs gives a placed person their hair's drawn step
// (`hair`, 0 to 3: src/sim/body/hair.js hairStepOf, the squad's barber in closed form), and an actor
// takes it only where the player can see neither where it is nor where it would go (lookAt's rule;
// a transition played in sight keeps the step the actor had), so a squadmate's cut never changes in
// view: actor.hair is saved, and an actor without it (a v0.0.5 save's) is drawn at the closed form's
// step until it takes one.
// The player's own transitions (stepOnto, layPlayer, lieActor, backActor, riseActor) are here too, so
// one poseAt draws everyone: stepping onto an activity's spot, lying in the rack (behind the splash, or
// in sight before it: lieActor, the page's R at the rack's foot; taken back by a move key while it
// plays: backActor, the same frames backwards from the one shown), getting up from it, each at the
// tempo of the moment (hurriedAt: a drill open, a training sol's reveille stand; else UNHURRIED_K slower).
import { hash, hash01, hashInt } from '../../core/hash.js';
import { stream, pick } from '../../core/rng.js';
import { SEC_MS, TICK_MS, HOUR_MS } from '../../core/clock.js';
import { localSol, solStartMs } from '../../core/calendar.js';
import { nextId, playerActor, playerId, cmpId } from '../../core/ids.js';
import { areaOf, lonOf } from '../places/model.js';
import { seatOf, postOf, spotsOf } from '../places/fixtures.js';
import { lightingOf } from '../places/light.js';
import { weekdayOf } from '../time/dates.js';
import { dressMs } from '../time/doing.js';
import { DRESS_HURRY_K } from '../../data/activities.js';
import { REVEILLE_H, REVEILLE_HOLIDAY_H, REVEILLE_STAND_MS } from '../../data/pod.js';
import { eyeOf, visibility } from './perception.js';
import { hairStepOf } from '../body/hair.js';

/** The fire watch's post in bay-2-1 (the 0.0.3 sheet §2.1's posts). */
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
/** The transitions' lengths at the alarm's tempo (the klaxon, a training sol's reveille), ms: 1.6 times v0.0.4's 2,500 and 3,400 (the user, 2026-11-06: "slightly slower animations on getting in and out of rack"); SIT_MS 1.5 times its 1,200. */
export const RISE_MS = 4_000, RISE_UPPER_MS = 5_500, DOWN_MS = 4_000, DOWN_UPPER_MS = 5_500, SIT_MS = 1_800, STEP_IN_MS = 400;
/** When nothing hurries (the weekend's reveille, the stand-down, going to bed, up after a nap), the rack's transitions take this many times as long (my call). */
export const UNHURRIED_K = 1.2;
/** A call's delay before each person moves, by the call, ms: [least, most] (see the header). */
export const CALL_DELAY_MS = Object.freeze({
  alert: Object.freeze([1_000, 10_000]), reveille: Object.freeze([2_000, 20_000]), 'stand-down': Object.freeze([2_000, 20_000]),
});
/** The rise's keyframes from an upper berth (shares of its length): sitting up ends, sitting on the edge ends, the climb ends; then standing up to the foot. */
export const RISE_KEYS = Object.freeze({ sitUp: 0.35, sit: 0.55, climb: 0.8 });
/** A lower berth's: sitting up ends, sitting on the edge ends, standing up off it ends; then the steps out to the rack's foot, at a walk (my call: see the header). */
export const LOWER_KEYS = Object.freeze({ sitUp: 0.35, sit: 0.5, stand: 0.62 });
/** An upper berth's height and above: it is climbed down from, metres. */
export const UPPER_Y_M = 1.0;
/** An upper berth's marine stands this far beside the rack's foot spot, toward its lockers (my call), metres. */
export const UPPER_FOOT_M = 0.6;
/** A drill's people are back in their night pose within this of its stand-down, ms (the delay, the undressing, the lying down). */
export const STAND_DOWN_SETTLE_MS = 300_000;

const FIRE_WATCH_RANKS = new Set(['Pvt', 'PFC', 'LCpl']);
const HOLIDAY = new Set([5, 6]);
const FACE_OF = (dx, dz) => (Math.abs(dx) > Math.abs(dz) ? (dx < 0 ? 'left' : 'right') : (dz < 0 ? 'up' : 'down'));
const FOOT = Object.freeze({ down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] });
const BACK = Object.freeze({ down: 'up', up: 'down', left: 'right', right: 'left' });
const lerp = (a, b, k) => a + (b - a) * k;
const r4 = (v) => Math.round(v * 10000) / 10000;

// (the people runtime: the fire watch's draw per state, the layer's counters)
const peopleRt = (state) => (state.$people ??= {});
/** The actors layer's counters (runtime): { deferred, changed, synced, checks, transitions, expired }. */
export function placeStats(state) { return (peopleRt(state).stats ??= { deferred: 0, changed: 0, synced: 0, checks: 0, transitions: 0, expired: 0 }); }

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

/** The people placed this round, in id order: the player's squad (the player among them), the fire watch, and the staff posted on the live area (0.0.5). */
export function placed(state) {
  const me = playerId(state), unit = state.people?.[me]?.service?.unitId;
  if (!unit || !state.units?.[unit]) return [];
  // (kept until the player, their unit, the fire watch, the people counter, the live area or a post moves: billets change only as people are made this round)
  const billets = state.units[unit].billets, fw = fireWatchOf(state), rt = peopleRt(state), live = state.places?.live?.area ?? null;
  const key = `${me}|${unit}|${fw}|${state.meta?.next?.p ?? 0}|${live}`;
  if (rt.placedKey !== key) {
    const out = new Set(Object.values(billets));
    if (fw) out.add(fw);
    for (const id of postedOn(state, live)) out.add(id);
    rt.placed = Object.freeze([...out].sort(cmpId));
    rt.placedSet = new Set(rt.placed);
    rt.placedKey = key;
  }
  return rt.placed;
}
const placedSet = (state) => { placed(state); return peopleRt(state).placedSet ?? new Set(); };

/** The staff posted on an area (person.post: src/sim/people/staff.js), in id order. */
export function postedOn(state, area) {
  if (!area) return [];
  const out = [];
  for (const id of Object.keys(state.people ?? {})) { const post = state.people[id]?.post; if (post && post.area === area) out.push(id); }
  return out.sort(cmpId);
}
/** A post set or cleared (staff.js setPost): the placed list is drawn again. */
export function notePosts(state) { delete peopleRt(state).placedKey; }
// (a posted person's pose: at their post, as authored, never away while posted)
const postPose = (post) => ({ area: post.area, x: post.x, z: post.z, y: post.y ?? 0, face: post.face ?? 'down', posture: post.posture ?? 'stand', spotId: null, outfit: post.outfit ?? 'utilities', curtain: false });

/** A call's delay for a person (see the header): least + hashInt(most − least + 1, 'call', seed, pid, cause, atMs) ms, on CALL_DELAY_MS[cause]. */
export function callDelay(pid, cause, atMs = 0, seed = 0) {
  const [lo, hi] = CALL_DELAY_MS[cause] ?? CALL_DELAY_MS.reveille;
  return lo + hashInt(hi - lo + 1, 'call', seed, pid, cause, atMs);
}

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
  const e = edgeOf(seat, rack);
  return { ...base, x: e.x, z: e.z, y: seat.y, face: e.face, posture: 'sit', spotId: seat.id };
}

// (where the lower berth's sitter sits on the rack's edge: toward its lockers and its foot, facing the lockers)
function edgeOf(seat, rack) {
  const face = rack?.face ?? 'down';
  const [fx, fz] = FOOT[face];
  const locker = seat.lockerId ? fixtureOf(seat.area, seat.lockerId) : null;
  const side = locker && rack ? Math.sign((face === 'down' || face === 'up') ? locker.x - rack.x : locker.z - rack.z) || 1 : 1;
  const ax = face === 'down' || face === 'up' ? side : 0, az = face === 'down' || face === 'up' ? 0 : side;
  return { x: r4((rack?.x ?? seat.x) + ax * SIT_ACROSS_M + fx * SIT_ALONG_M), z: r4((rack?.z ?? seat.z) + az * SIT_ACROSS_M + fz * SIT_ALONG_M), face: FACE_OF(ax, az), ax, az };
}

// (a berth at night: lying in it, the curtain by the night's draw where the rack has one)
function nightPose(state, id, seat, ms) {
  const rack = fixtureOf(seat.area, seat.fixture);
  const night = localSol(ms - NIGHT_BACK_MS, lonOf(state)).sol;
  const curtain = hasCurtains(seat, rack) && hash01('curtain', id, night) < CURTAIN_FRAC;
  return { area: seat.area, x: seat.x, z: seat.z, y: seat.y, face: rack?.face ?? 'down', posture: 'lie', spotId: seat.id, outfit: 'pt', curtain };
}

// (standing at one's rack's foot, facing out into the aisle: the lower berth on the foot's spot, an
// upper one UPPER_FOOT_M beside it toward the rack's lockers, so two never stand on one spot)
function footPose(seat, outfit) {
  const rack = fixtureOf(seat.area, seat.fixture), foot = rack ? firstSpot(rack) : null;
  let x = foot?.x ?? seat.x, z = foot?.z ?? seat.z;
  if ((seat.y ?? 0) >= UPPER_Y_M && rack) {
    const e = edgeOf(seat, rack);
    x = r4(x + (e.ax ?? 0) * UPPER_FOOT_M); z = r4(z + (e.az ?? 0) * UPPER_FOOT_M);
  }
  return { area: seat.area, x, z, y: 0, face: BACK[foot?.face] ?? 'down', posture: 'stand', spotId: foot?.id ?? null, outfit, curtain: false };
}

const headOfPose = (p) => (p.posture === 'lie' && p.spotId ? seatFor(p.spotId)?.head ?? null : null);
const fromOf = (p) => ({ posture: p.posture ?? 'stand', x: p.x, z: p.z, y: p.y ?? 0, face: p.face ?? 'down', head: headOfPose(p), spotId: p.spotId ?? null });

/** A transition's length, ms (see the header): kind 'rise' | 'down' | 'sit' | 'stand' | 'step', from or to an upper berth, at the alarm's tempo or not (UNHURRIED_K, to the tick). */
export function transMs(kind, upper = false, hurried = true) {
  if (kind === 'step') return STEP_IN_MS;
  const ms = kind === 'rise' ? (upper ? RISE_UPPER_MS : RISE_MS) : kind === 'down' ? (upper ? DOWN_UPPER_MS : DOWN_MS) : SIT_MS;
  return hurried ? ms : Math.round(ms * UNHURRIED_K / TICK_MS) * TICK_MS;
}
/** The rise's length from a berth at height y (an upper berth's climb is longer), at the alarm's tempo or not. */
export const riseMsOf = (y, hurried = true) => transMs('rise', (y ?? 0) >= UPPER_Y_M, hurried);

// (the transition from one pose to another starting at fromMs: a rise or a lying down by the berth's
// edge, a sit or a stand, a step; hurried: at the alarm's tempo, else UNHURRIED_K slower)
function transBetween(a, b, fromMs, seat = null, hurried = true) {
  const pa = a.posture ?? 'stand', pb = b.posture ?? 'stand';
  if (pa === 'lie' && pb === 'stand') {
    const s = seat ?? seatFor(a.spotId), rack = s ? fixtureOf(s.area, s.fixture) : null, e = s ? edgeOf(s, rack) : { x: a.x, z: a.z };
    const upper = (a.y ?? 0) >= UPPER_Y_M;
    const t = { kind: 'rise', fromMs, ms: transMs('rise', upper, hurried), from: fromOf(a), via: { x: e.x, z: e.z, y: a.y ?? 0 } };
    if (upper) t.climb = climbOf(b, rack);
    return t;
  }
  if (pa === 'stand' && pb === 'lie') {
    const s = seat ?? seatFor(b.spotId), rack = s ? fixtureOf(s.area, s.fixture) : null, e = s ? edgeOf(s, rack) : { x: b.x, z: b.z };
    const upper = (b.y ?? 0) >= UPPER_Y_M;
    const t = { kind: 'down', fromMs, ms: transMs('down', upper, hurried), from: fromOf(a), via: { x: e.x, z: e.z, y: b.y ?? 0 } };
    if (upper) t.climb = climbOf(a, rack);
    return t;
  }
  if (pa === 'sit' && pb === 'stand') return { kind: 'stand', fromMs, ms: transMs('stand', false, hurried), from: fromOf(a) };
  if (pa === 'stand' && pb === 'sit') return { kind: 'sit', fromMs, ms: transMs('sit', false, hurried), from: fromOf(a) };
  return { kind: 'step', fromMs, ms: STEP_IN_MS, from: fromOf(a) };
}
const playing = (t, ms) => !!t && ms < t.fromMs + t.ms;
// (where an upper berth's sleeper reaches the deck: beside the rack, half a metre in from where they stand at its foot)
function climbOf(stand, rack) {
  const [fx, fz] = FOOT[rack?.face ?? 'down'];
  return { x: r4(stand.x - fx * 0.5), z: r4(stand.z - fz * 0.5) };
}

// (reveille's time on the morning of a local sol: its first whole second, as the event's)
function reveilleOfSol(ms, lon) {
  const h = holidayAt(ms, lon) ? REVEILLE_HOLIDAY_H : REVEILLE_H;
  return Math.ceil((solStartMs(ms, lon) + Math.round(h * HOUR_MS)) / SEC_MS) * SEC_MS;
}
// (the local sol of ms is a Saturday or a Sunday: the holiday routine's reveille, which nothing hurries)
const holidayAt = (ms, lon) => HOLIDAY.has(weekdayOf(localSol(ms, lon).sol));

/**
 * Whether the player's own rack transitions go at the alarm's tempo at ms: while a drill is open, and
 * in a training sol's reveille stand (reveille to the 05:40 muster); else, nothing hurrying, UNHURRIED_K
 * slower (the weekend's reveille, a nap's end, going to bed).
 */
export function hurriedAt(state, ms = state.clock.ms) {
  const d = state.time?.drills?.open;
  if (d && ms >= d.atMs && ms < d.endMs) return true;
  const lon = lonOf(state), R = reveilleOfSol(ms, lon);
  return ms >= R && ms < R + REVEILLE_STAND_MS && !holidayAt(ms, lon);
}

// (the drill record covering ms, if one: the open drill, or the last one while its people settle)
function drillAt(state, ms) {
  const dr = state.time?.drills;
  for (const d of [dr?.open, dr?.last]) if (d && ms >= d.atMs && ms < d.endMs + STAND_DOWN_SETTLE_MS) return d;
  return null;
}

// (a placed squadmate through a drill: risen and dressed at their rack's foot until the stand-down, then undressed and lying down)
function drillPose(state, id, seat, ms, d) {
  const before = basePose(state, id, seat, d.atMs - TICK_MS);
  const stand = footPose(seat, 'utilities');
  const seed = state.meta?.seed ?? 0;
  if (ms < d.endMs) {
    const at = d.atMs + callDelay(id, 'alert', d.atMs, seed);
    const t = transBetween(before, stand, at, seat, true);
    const dm = dressMs(before.outfit ?? 'utilities', 'utilities', DRESS_HURRY_K);   // (the alarm's tempo, as the player's: TIME §8.2's emergency one)
    const out = { ...stand };
    if (playing(t, ms) || ms < t.fromMs) out.trans = t;
    if (dm > 0 && ms < t.fromMs + t.ms + dm) out.dress = { fromMs: t.fromMs + t.ms, ms: dm, from: before.outfit, to: 'utilities' };
    return out;
  }
  const after = basePose(state, id, seat, ms);
  const at = d.endMs + callDelay(id, 'stand-down', d.endMs, seed);
  const dm = dressMs('utilities', after.outfit ?? 'utilities');
  const t = transBetween({ ...stand, outfit: after.outfit }, after, at + dm, seat, false);   // (back to bed: nothing hurries)
  if (ms >= t.fromMs + t.ms) return null;                            // (settled: the night's pose, nothing playing)
  const out = { ...after };
  out.trans = t;
  if (dm > 0) out.dress = { fromMs: at, ms: dm, from: 'utilities', to: after.outfit };
  return out;
}

// (the fire watch through a drill: standing at the post, sitting again after)
function postDrillPose(sitting, id, ms, d, seed) {
  const stand = { ...sitting, posture: 'stand', y: 0, spotId: sitting.spotId };
  if (ms < d.endMs) {
    const t = transBetween(sitting, stand, d.atMs + callDelay(id, 'alert', d.atMs, seed), null, true);
    return playing(t, ms) || ms < t.fromMs ? { ...stand, trans: t } : stand;
  }
  const t = transBetween(stand, sitting, d.endMs + callDelay(id, 'stand-down', d.endMs, seed), null, false);
  return playing(t, ms) || ms < t.fromMs ? { ...sitting, trans: t } : null;
}

// (a placed person's pose but for a drill: lights out, reveille's stand, the day's)
function basePose(state, id, seat, ms) {
  const lights = lit(state, seat.area, seat.room, ms);
  const lon = lonOf(state), R = reveilleOfSol(ms, lon);
  if (lights === 'lightsOut' || (ms < R && ms > R - HOUR_MS)) return nightPose(state, id, seat, ms);
  if (ms >= R && ms < R + REVEILLE_STAND_MS) {
    // (a training sol's reveille is an order with a muster ten minutes on; the weekend's, nothing hurries)
    const before = nightPose(state, id, seat, R - TICK_MS), stand = footPose(seat, 'pt');
    const t = transBetween(before, stand, R + callDelay(id, 'reveille', R, state.meta?.seed ?? 0), seat, !holidayAt(ms, lon));
    return playing(t, ms) || ms < t.fromMs ? { ...stand, trans: t } : stand;
  }
  return dayPose(state, id, seat, ms);
}

/**
 * Where a person is at game time ms (see the header): { area, x, z, y, face, posture, spotId,
 * outfit, curtain, trans?, dress?, hair }, or { away: true } for anyone not placed (they exist, off the
 * map); hair the step of a placed person's cut (the player's is the body's: none here).
 */
export function whereIs(state, personId, ms = state.clock.ms) {
  const w = poseOfPerson(state, personId, ms);
  if (w.away || personId === playerId(state) || !state.people?.[personId]?.service) return w;
  return { ...w, hair: hairStepOf(state, personId, ms) };
}
// (where a person is, but their hair: see whereIs)
function poseOfPerson(state, personId, ms) {
  const p = state.people?.[personId];
  if (!p) return { away: true };
  if (personId === playerId(state)) {
    const me = playerActor(state);
    if (me) return { area: state.places?.live?.area ?? null, x: me.x, z: me.z, y: me.y ?? 0, face: me.face ?? 'down', posture: me.posture ?? 'stand', spotId: me.spotId ?? null, outfit: me.outfit ?? 'utilities', curtain: false };
    const seat = p.berthId ? seatFor(p.berthId) : null;
    return seat ? footPose(seat, 'utilities') : { away: true };
  }
  if (p.post) return postPose(p.post);
  if (!placedSet(state).has(personId)) return { away: true };
  const seat = p.berthId ? seatFor(p.berthId) : null;
  const d = drillAt(state, ms);
  if (personId === fireWatchOf(state)) {
    const post = postOf(FIRE_WATCH_POST), ps = post ? seatFor(post.seatId) : null;
    if (ps && lit(state, ps.area, ps.room, ms) === 'lightsOut') {
      const room = areaOf(ps.area)?.rooms?.find(r => r.id === ps.room);
      const face = room ? FACE_OF((room.rect[0] + room.rect[2]) / 2 - ps.x, (room.rect[1] + room.rect[3]) / 2 - ps.z) : 'up';
      const sitting = { area: ps.area, x: ps.x, z: ps.z, y: ps.y, face, posture: 'sit', spotId: ps.id, outfit: 'utilities', curtain: false };
      return (d && postDrillPose(sitting, personId, ms, d, state.meta?.seed ?? 0)) || sitting;
    }
    return seat ? dayPose(state, personId, seat, ms) : { away: true };
  }
  if (!seat) return { away: true };
  return (d && drillPose(state, personId, seat, ms, d)) || basePose(state, personId, seat, ms);
}

// ---- poses frame by frame ----

const FRAME_OF = Object.freeze({ stand: 'stand', sit: 'sit', lie: 'lie' });
/**
 * What an actor shows at ms (pure): { posture, frame, k, x, z, y, face, head, spotId, outfit, walkM?, upK?,
 * edgeX?, edgeZ? }, frame 'lie' | 'sitUp' | 'sit' | 'climb' | 'standUp' | 'walk' | 'stand' | 'dress' |
 * 'lieDown' (walk: the steps between a lower berth's edge and its foot, walkM the metres walked so far;
 * sitUp and lieDown: upK how far sat up, 0 lying to 1 up, and edgeX, edgeZ the berth's edge, where the
 * sit frame takes over, so the view's sitter on the mattress meets it there), k the share of the
 * transition (1 when none plays), spotId the spot of the pose shown (a rise's berth until it leaves
 * it: the view draws the berth of the pose it shows, never the end's). headNow is the head's
 * direction of the pose it holds (figureOf gives it from the berth). A dress plays its frames
 * whenever the body stands still, before a transition still to come as after one (the stand-down's
 * undressing, then the lying down: the review of v0.0.4), so an outfit never changes in sight but in
 * a dress frame.
 */
export function poseAt(a, ms, headNow = null) {
  const end = { posture: a.posture ?? 'stand', x: a.x, z: a.z, y: a.y ?? 0, face: a.face ?? 'down', head: headNow, spotId: a.spotId ?? null };
  let out = { ...end, frame: FRAME_OF[end.posture] ?? 'stand', k: 1 };
  const t = a.trans;
  if (t && ms < t.fromMs + t.ms) {
    const f = t.from ?? end;
    if (ms < t.fromMs) out = { ...f, spotId: f.spotId ?? null, frame: FRAME_OF[f.posture] ?? 'stand', k: 0, pending: true };
    else out = between(t, f, end, (ms - t.fromMs) / t.ms);
  }
  let outfit = a.outfit ?? 'utilities';
  const d = a.dress;
  if (d && ms < d.fromMs + d.ms) {
    if (ms < d.fromMs) outfit = d.from;
    else {
      const k = (ms - d.fromMs) / d.ms;
      outfit = k < 0.5 ? d.from : d.to;
      if (out.posture === 'stand' && (out.k >= 1 || out.pending)) out = { ...out, frame: 'dress', k };
    }
  }
  delete out.pending;
  return { ...out, outfit };
}

// (a transition's frame at share k, from pose f to pose e)
function between(t, f, e, k) {
  const v = t.via ?? { x: (f.x + e.x) / 2, z: (f.z + e.z) / 2, y: f.y };
  const K = RISE_KEYS;
  const pos = (x, z, y) => ({ x: r4(x), z: r4(z), y: r4(y) });
  if (t.kind === 'rise' || t.kind === 'down') {
    const rise = t.kind === 'rise';
    const q = rise ? k : 1 - k;                                     // (the rise's own share: lying down plays it backwards)
    const lie = rise ? f : e, stand = rise ? e : f, upper = (lie.y ?? 0) >= UPPER_Y_M;
    const face = q < K.climb ? (rise ? f.face : e.face) : stand.face;
    const S = upper ? K.sitUp : LOWER_KEYS.sitUp;
    if (q < S) {
      // (upK: how far sat up, 0 lying to 1 up; edgeX, edgeZ: the edge's spot, where the sit frame follows on, for the view's drawing)
      const c = q / S;
      return { posture: 'lie', ...pos(lerp(lie.x, v.x, c), lerp(lie.z, v.z, c), lie.y), face: lie.face, head: lie.head, spotId: lie.spotId ?? null, frame: q <= 0 ? 'lie' : rise ? 'sitUp' : 'lieDown', k,
        ...(q > 0 ? { upK: r4(c), edgeX: r4(v.x), edgeZ: r4(v.z) } : {}) };
    }
    if (!upper) {
      // (a lower berth: on the edge until LOWER_KEYS.sit, up off it in place, then the steps out to the foot at a walk)
      const L = LOWER_KEYS;
      if (q < L.sit) return { posture: 'sit', ...pos(v.x, v.z, lie.y), face, head: null, spotId: lie.spotId ?? null, frame: 'sit', k };
      if (q < L.stand) return { posture: 'stand', ...pos(v.x, v.z, lerp(lie.y, 0, (q - L.sit) / (L.stand - L.sit))), face, head: null, spotId: lie.spotId ?? null, frame: 'standUp', k };
      if (q >= 1) return { posture: 'stand', ...pos(stand.x, stand.z, 0), face: stand.face, head: null, spotId: stand.spotId ?? null, frame: 'stand', k };
      const c = (q - L.stand) / (1 - L.stand), len = Math.hypot(stand.x - v.x, stand.z - v.z);
      const out = FACE_OF(stand.x - v.x, stand.z - v.z);
      return { posture: 'stand', ...pos(lerp(v.x, stand.x, c), lerp(v.z, stand.z, c), 0), face: rise ? out : BACK[out], head: null, spotId: stand.spotId ?? null, frame: 'walk', walkM: r4((rise ? c : 1 - c) * len), k };
    }
    if (q < K.sit) return { posture: 'sit', ...pos(v.x, v.z, lie.y), face, head: null, spotId: lie.spotId ?? null, frame: 'sit', k };
    const cl = t.climb ?? v;
    if (q < K.climb) {
      const c = (q - K.sit) / (K.climb - K.sit);
      return { posture: 'stand', ...pos(lerp(v.x, cl.x, c), lerp(v.z, cl.z, c), lerp(lie.y, 0, c)), face, head: null, spotId: lie.spotId ?? null, frame: 'climb', k };
    }
    const c = (q - K.climb) / (1 - K.climb);
    return { posture: 'stand', ...pos(lerp(cl.x, stand.x, c), lerp(cl.z, stand.z, c), 0), face: stand.face, head: null, spotId: stand.spotId ?? null, frame: q >= 1 ? 'stand' : 'standUp', k };
  }
  if (t.kind === 'sit' || t.kind === 'stand') {
    const toSit = t.kind === 'sit';
    const p = { ...pos(lerp(f.x, e.x, k), lerp(f.z, e.z, k), lerp(f.y ?? 0, e.y ?? 0, k)), face: k < 0.5 ? f.face : e.face, head: null };
    return { posture: (k < 0.5) === toSit ? 'stand' : 'sit', ...p, spotId: (k < 0.5 ? f.spotId : e.spotId) ?? null, frame: 'standUp', k };
  }
  return { posture: e.posture, ...pos(lerp(f.x, e.x, k), lerp(f.z, e.z, k), lerp(f.y ?? 0, e.y ?? 0, k)), face: e.face, head: e.head ?? null, spotId: e.spotId ?? null, frame: FRAME_OF[e.posture] ?? 'stand', k };
}

// ---- the actors ----

const DEFAULTS = Object.freeze({ y: 0, posture: 'stand', outfit: 'utilities', curtain: false, spotId: null });
// (an actor put at a pose: the defaults left out, no glide; its transitions with it; its hair's step where the pose gives one)
function setPose(a, w) {
  a.x = w.x; a.z = w.z; a.face = w.face;
  for (const k of Object.keys(DEFAULTS)) { if (w[k] === undefined || w[k] === DEFAULTS[k]) delete a[k]; else a[k] = w[k]; }
  if (w.trans) a.trans = w.trans; else delete a.trans;
  if (w.dress) a.dress = w.dress; else delete a.dress;
  if (w.hair !== undefined) a.hair = w.hair;
  a.$px = w.x; a.$pz = w.z;
  return a;
}
const samePose = (a, w) => a.x === w.x && a.z === w.z && a.face === w.face && (a.y ?? 0) === w.y && (a.posture ?? 'stand') === w.posture
  && (a.outfit ?? 'utilities') === w.outfit && !!a.curtain === !!w.curtain && (a.spotId ?? null) === (w.spotId ?? null)
  && (w.hair === undefined || a.hair === w.hair);
// (whereIs's pose is a transition from the pose the actor holds: it may play in sight)
const fromHere = (a, w) => !!w.trans && w.trans.from && Math.abs(w.trans.from.x - a.x) < 1e-6 && Math.abs(w.trans.from.z - a.z) < 1e-6
  && (w.trans.from.posture ?? 'stand') === (a.posture ?? 'stand') && Math.abs((w.trans.from.y ?? 0) - (a.y ?? 0)) < 1e-6;
// (a transition the actor holds that has played out: dropped)
function dropExpired(a, ms, st) {
  if (a.trans && ms >= a.trans.fromMs + a.trans.ms) { delete a.trans; st.expired++; }
  if (a.dress && ms >= a.dress.fromMs + a.dress.ms) { delete a.dress; st.expired++; }
}

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

/**
 * A call (reveille, the klaxon, the stand-down): every placed live actor whose whereIs at atMs is a
 * transition from the pose it holds takes it at once, in sight or not (what it shows is lived); any
 * other change keeps the layer's rule, out of sight only (the fire watch's walk back to their own bay
 * at reveille is not a transition). Returns how many took a transition.
 */
export function squadCall(state, cause, atMs = state.clock.ms) {
  if (!hasRoster(state)) return 0;
  const me = playerActor(state), live = state.places?.live?.area ?? null, st = placeStats(state), eyeRef = { eye: null };
  const t0 = st.transitions;
  for (const a of state.actors?.list ?? []) {
    if (!a.who || a === me) continue;
    const w = whereIs(state, a.who, atMs);
    if (w.away || w.area !== live) continue;
    lookAt(state, a, w, me, eyeRef, atMs, st);
  }
  return st.transitions - t0;
}

// (one actor looked at: its whereIs taken if it is a transition from here, else only unseen. A
// transition found after it began starts now, so its first frames are seen, never skipped)
function lookAt(state, a, w, me, eyeRef, ms, st) {
  if (samePose(a, w)) return;
  if (fromHere(a, w)) {
    const lag = ms - w.trans.fromMs;
    if (lag > 0) {
      w = { ...w, trans: { ...w.trans, fromMs: ms } };
      if (w.dress) w.dress = { ...w.dress, fromMs: w.dress.fromMs + lag };
    }
    // (a transition plays in sight: the hair's step stays the one drawn, the closed form's where the actor has none)
    if (w.hair !== undefined && a.hair !== undefined && a.hair !== w.hair) w = { ...w, hair: a.hair };
    setPose(a, w);
    st.transitions++;
    return;
  }
  eyeRef.eye ??= me ? eyeOf(state, me) : null;
  const eye = eyeRef.eye;
  if (eye && (inSight(state, eye, a.x, a.z, ms) || inSight(state, eye, w.x, w.z, ms))) { st.deferred++; return; }
  setPose(a, w);
  st.changed++;
}

/** Every placed actor the player cannot see at its whereIs now, where it is or where it would go (a skip's step: see the header). */
export function placeUnseen(state, ms = state.clock.ms) {
  const me = playerActor(state), st = placeStats(state), live = state.places?.live?.area ?? null, eyeRef = { eye: null };
  for (const a of state.actors?.list ?? []) {
    if (!a.who || a === me) continue;
    dropExpired(a, ms, st);
    const w = whereIs(state, a.who, ms);
    if (w.away || w.area !== live) continue;
    lookAt(state, a, w, me, eyeRef, ms, st);
  }
}

/** TECH §3.1 layer 3 (see the header). */
export function actorsStep(state, input, bus, ctx) {
  if (!hasRoster(state)) return;
  const live = state.places?.live?.area ?? null;
  if ((state.actors?.area ?? null) !== live) { syncActors(state); return; }
  const ms = state.clock.ms, phase = Math.floor(ms / TICK_MS) % BUCKETS;
  const me = playerActor(state), st = placeStats(state), eyeRef = { eye: null };
  if (me && ms % SEC_MS === 0) dropExpired(me, ms, st);
  for (const a of state.actors.list) {
    if (!a.who || a === me || hash(a.who) % BUCKETS !== phase) continue;
    st.checks++;
    dropExpired(a, ms, st);
    const w = whereIs(state, a.who, ms);
    if (w.away || w.area !== live) continue;
    lookAt(state, a, w, me, eyeRef, ms, st);
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

// ---- the player's own ----

/** What an actor wears ('utilities' when unsaid). */
export const outfitOf = (a) => a?.outfit ?? 'utilities';
/** Put an actor in an outfit (the default left out). */
export function setOutfit(a, outfit) { if (!a) return; if (!outfit || outfit === 'utilities') delete a.outfit; else a.outfit = outfit; }

/** The player steps onto an activity's spot: a 'step' transition of STEP_IN_MS from where the figure is drawn now (poseAt: a transition it cuts never jumps), facing the spot's way. */
export function stepOnto(state, a, sp, ms = state.clock.ms) {
  const p = poseAt(a, ms);
  const from = { posture: p.posture, x: p.x, z: p.z, y: p.y ?? 0, face: p.face, head: p.head ?? null, spotId: p.spotId ?? null };
  a.x = sp.x; a.z = sp.z; a.face = sp.face ?? a.face; a.$px = sp.x; a.$pz = sp.z;
  a.trans = { kind: 'step', fromMs: ms, ms: STEP_IN_MS, from };
}

/** The player lies in their berth (behind the splash: no transition), its seat their spot. */
export function layPlayer(state, a, seatId, ms = state.clock.ms) {
  const seat = seatId ? seatFor(seatId) : null;
  if (!a || !seat) return;
  const rack = fixtureOf(seat.area, seat.fixture);
  a.x = seat.x; a.z = seat.z; a.y = seat.y; a.posture = 'lie'; a.spotId = seat.id; a.face = rack?.face ?? 'down';
  a.$px = a.x; a.$pz = a.z;
  delete a.trans;
}

/** The player gets up (R, T or a move key while lying or sitting): a rise to their rack's foot, or a stand where they sit, at the tempo of the moment (hurriedAt). Returns the transition, or null. */
export function riseActor(state, a, ms = state.clock.ms) {
  if (!a) return null;
  const posture = a.posture ?? 'stand';
  if (posture === 'stand' || playing(a.trans, ms)) return null;
  const here = { posture, x: a.x, z: a.z, y: a.y ?? 0, face: a.face ?? 'down', spotId: a.spotId ?? null };
  let end;
  if (posture === 'lie') {
    const seat = a.spotId ? seatFor(a.spotId) : null;
    end = seat ? footPose(seat, outfitOf(a)) : { ...here, posture: 'stand', y: 0 };
  } else end = { ...here, posture: 'stand', y: 0, spotId: null };
  const t = transBetween(here, end, ms, null, hurriedAt(state, ms));
  a.x = end.x; a.z = end.z; a.face = end.face; a.$px = end.x; a.$pz = end.z;
  delete a.posture; delete a.y; delete a.spotId;
  a.trans = t;
  return t;
}

/**
 * The player's lying down taken back while it plays (a move key during time's lead: the review of
 * v0.0.5's rack, R could not be undone): the rise from the frame shown on, the same frames backwards
 * at the same pace (the rise's share now the lying down's), back to where they stood, never a jump.
 * Returns the transition, or null (no lying down playing).
 */
export function backActor(state, a, ms = state.clock.ms) {
  const t = a?.trans;
  if (!t || t.kind !== 'down' || !t.from || ms < t.fromMs || !playing(t, ms)) return null;
  const lie = { posture: 'lie', x: a.x, z: a.z, y: a.y ?? 0, face: a.face ?? 'down', head: headOfPose(a), spotId: a.spotId ?? null };
  const rise = { kind: 'rise', fromMs: 2 * ms - t.fromMs - t.ms, ms: t.ms, from: lie, via: t.via, ...(t.climb ? { climb: t.climb } : {}) };
  const f = t.from;
  a.x = f.x; a.z = f.z; a.face = f.face ?? 'down'; a.$px = a.x; a.$pz = a.z;
  delete a.posture; delete a.y;
  if (f.spotId) a.spotId = f.spotId; else delete a.spotId;
  a.trans = rise;
  return rise;
}

/**
 * The player lies down in their berth in sight (a sleep or a nap begun standing at their rack's foot,
 * the page's R: src/sim/time/activities.js's lead), the rise played backwards from where the figure is
 * drawn now, at the tempo of the moment (hurriedAt: going to bed, nothing hurries). Returns the
 * transition, or null (no such berth, or a transition already playing).
 */
export function lieActor(state, a, seatId, ms = state.clock.ms) {
  const seat = seatId ? seatFor(seatId) : null;
  if (!a || !seat || (a.posture ?? 'stand') !== 'stand' || playing(a.trans, ms)) return null;
  const rack = fixtureOf(seat.area, seat.fixture);
  const here = { posture: 'stand', x: a.x, z: a.z, y: 0, face: a.face ?? 'down', spotId: a.spotId ?? null };
  const end = { posture: 'lie', x: seat.x, z: seat.z, y: seat.y, face: rack?.face ?? 'down', spotId: seat.id };
  const t = transBetween(here, end, ms, seat, hurriedAt(state, ms));
  a.x = end.x; a.z = end.z; a.y = end.y; a.posture = 'lie'; a.spotId = seat.id; a.face = end.face;
  a.$px = a.x; a.$pz = a.z;
  a.trans = t;
  return t;
}
