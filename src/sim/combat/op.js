// OLYMPUS combat: the operation record, the one reader of "the room-clearing operation this marine is in" (the build sheet v0.0.21 §1 item 21, §4.0; COMBAT §25.19).
//
// Until v0.0.21 the drill, the team and the breach read the shoot house's record wherever they stood: state.armoury.range.house,
// and `course === 'house'` for "on the lane". That tied every room clearing to the range session, so "Clear the room" anywhere
// else (a MOUT day, a mission scene) had nothing to read. This module is the seam: every such read of combat/, the CQB
// instinct, sidearm.js and shooting.js's drill gates goes through it (tests/syntax.test.mjs OP_HOME holds that no other file of
// theirs names the house's record or its course), so the off-lane operation is one branch here, not a hundred sites.
//
//   opOf(state)        the operation's record: the house's (state.armoury.range.house, the same object, so the lane is
//                      byte for byte what it was) wherever it stands, else state.cqb (written only by openOp, off the lane: the
//                      hand-off's role, D), else null. "Absent means default": state.cqb is never written as null, so no save
//                      of the lane gains a key (the build sheet §0 item 36).
//   opLive(state)      whether the drill's rules run: on a range session, the house's lane live (its GO given, its end not come;
//                      any other course always) with the live area the lane plan's (shooting.js inHouse's reading); off it, an operation open
//                      in the area you stand in.
//   onHouse(state)     whether the range session is the house's course (the lane's own rules: the tower, the pars, the paper).
//   laneRec(state)     the house's record on its course, else null (the reads that were `course === 'house' ? R.house : null`).
//   opRec(state)       the record to write into: the house's (made where absent, as every writer did), else state.cqb.
//   sessionOf(state)   the range session, or off it the open operation seen as one ({ house, turners, area }), for the
//                      readers of a session's turners and record (the instinct's context, the targets): read only.
//   registerHost(course, host), hostOf(state)
//                      the lane's functions the #2's brain calls (two.js: the sighting's book, the shot's record, the
//                      instructor's words, the leg and its plan), registered by the scenario at its load, so that no file of
//                      combat/ imports a scenario (tests/syntax.test.mjs); off the lane NULL_HOST: no faults, no pars, no
//                      instructor.
//   brokenOf(state, id), breakOpening(state, id, atMs)
//                      a door's lock broken (the burst, a kick through it): on a range session R.house.broken[id], the
//                      burst's ms, byte for byte; off it the opening's own delta in the place (places/model.js setOpening's
//                      `broken`), which a door closed again keeps, since a broken lock stays broken (the hand-off's, D).
//   openOp(state, { area, team, turners, atMs }), closeOp(state)
//                      an operation off the range session (the hand-off's, D: the build sheet §1 item 21): state.cqb,
//                      the record the drill, the team and the breach read where the house's lane is not. Its fields are
//                      the drill's own names on the house's record, so every reader reads one shape: `asked`, `read`,
//                      `order` (the engage order), `bursts`, `breach`, `team` ({ two } as given), `twoPid` and `two` (the
//                      #2's drill record, the fill's fields: his doing, hold, contact, engagement, what he knows), the legs
//                      `rooms`, `hall` and `cur` from the area's own room plans (scenes/assemble.js plansOfArea: a drawn
//                      area's, never the set's; v0.0.21's review), `goAtMs` (the operation's start: the #2's eyes and the
//                      drill run from it), `stallAtMs` (the last progress: a leg's step, a hot spot covered, your round;
//                      what cqb-walk reads), `turners` (the targets set up in the rooms for a drill, arms/turners.js's
//                      records; the instructor's stands of the range are its lane's alone), `area`, and on a drawn area
//                      `draw` ({ mode, v, code }, the lane's R.house.draw's shape) and `lane` where not the set's, so the
//                      seams read the drawn house. Nothing of the lane is in it: no tower, no par, no instructor, no run sheet.
//                      closeOp removes the key, so "absent means default" holds before and after (§0 item 36).
//
// Every export is a function declaration, so a module of the house's cycles may read them at any time (no TDZ whichever loads
// first: tests/import-order.test.mjs loads this one first); it imports scenes/assemble.js (planSetOf, itself a leaf over the
// data), places/model.js (the door's delta: the places' graph, which imports no combat) and skills/templates.js (rungOf), so it
// stays a leaf of the house's import graph (importing shooting.js here pulled the arms graph ahead of loadout.js's data: a TDZ). Pure: reads the state, writes only where its name says.
import { planSetOf, plansOfArea } from '../scenes/assemble.js';
// (the place's door record for a lock broken off the range, and a #2's rung; both leaves of the house's graph)
import { setOpening, openingDelta, openingState, areaOf, GEN_MARK } from '../places/model.js';
import { rungOf } from '../skills/templates.js';

/** Whether the range session is the shoot house's course. */
export function onHouse(state) { return state?.armoury?.range?.course === 'house'; }

/** The house's record wherever the range session stands (its course or not), else null. */
export function houseRec(state) { return state?.armoury?.range?.house ?? null; }

/**
 * The range session; off it, an operation open seen as one ({ house: state.cqb, turners, area }), else null: for
 * the readers of a session's turners and record (the instinct's context, the targets), never written through.
 */
export function sessionOf(state) {
  const R = state?.armoury?.range;
  if (R) return R;
  const C = state?.cqb;
  return C ? { house: C, turners: C.turners ?? [], area: C.area } : null;
}

/** The house's record on the house's course, else null. */
export function laneRec(state) { return onHouse(state) ? state.armoury.range.house ?? null : null; }

/** The operation's record (see the header): the house's, else state.cqb, else null. */
export function opOf(state) { return houseRec(state) ?? state?.cqb ?? null; }

/** The record a writer writes into: the house's (made on the range session where absent), else state.cqb. */
export function opRec(state) { return houseRec(state) ?? state?.cqb ?? (state.armoury.range.house = {}); }

// (shooting.js inHouse, read here so this module stays near a leaf of the import graph: the live area is the lane's layout's;
// a layout with none is no lane, as bundle.js laneOf's try has it)
function inLane(state) {
  const L = planSetOf(state);
  return !!L && !!L.area && state.places?.live?.area === L.area;
}

/** Whether the house's lane is live on a range session: its GO given and its end not come; any other course always. */
export function laneLive(R) { return R?.course !== 'house' || (R.house?.goAtMs !== null && R.house?.goAtMs !== undefined && !R.house?.end); }

/** Whether the drill's rules run now (see the header). */
export function opLive(state) {
  const R = state?.armoury?.range;
  if (R) return !R.end && laneLive(R) && inLane(state);
  const C = state?.cqb;
  return !!C && !!C.area && state.places?.live?.area === C.area && !C.end;
}

// ---- the lane's host (two.js's calls into the scenario) ----

/** Off the lane: no sighting's book, no shot recorded, no instructor, no leg. */
export const NULL_HOST = Object.freeze({
  houseOf: () => null, curLeg: () => null, planOf: () => null, noteSighting: () => null, houseShot: () => null,
  chiefSays: () => false, sayOn: () => false, pistolLacks: () => null, houseFault: () => null,
});
// (off the range session, an operation open: the #2's brain reads its record and its legs' plans; the lane's own
// calls (the sighting's book, the instructor, the faults) stay null: nothing is scored where nobody keeps score. A round on a
// turner is the target's sensor, not a score: combat/two.js registers 'cqb' at its load with its opShot and the legs' plans,
// room.js lanePlanOf's, which this leaf cannot import)
export const OP_HOST = Object.freeze({ ...NULL_HOST,
  houseOf: (state) => state?.cqb ?? null,
  curLeg: (H) => (H ? [...(H.rooms ?? []), ...(H.hall ? [H.hall] : [])][H.cur ?? 0] ?? null : null),
});
const HOSTS = new Map();

/** A scenario's functions for the #2's brain on its course (shoothouse.js registers 'house' at its load). */
export function registerHost(course, host) { HOSTS.set(course, Object.freeze({ ...NULL_HOST, ...host })); }

/** The host of the range session's course, else NULL_HOST. */
export function hostOf(state) { return HOSTS.get(state?.armoury?.range?.course) ?? (!state?.armoury?.range && state?.cqb ? HOSTS.get('cqb') ?? OP_HOST : NULL_HOST); }

// ---- broken locks ----

/** The ms a door's lock was broken (a burst, a kick through it), else null: on a range session the house's R.house.broken, off it the opening's delta (see the header). */
export function brokenOf(state, id) {
  if (state?.armoury?.range) return houseRec(state)?.broken?.[id] ?? null;
  return openingDelta(state, id)?.broken ?? null;
}

/** Writes a door's lock broken at atMs: on a range session R.house.broken[id] (made where absent, as every writer did); off it the opening's own delta, its state and swing kept (see the header). */
export function breakOpening(state, id, atMs) {
  if (state?.armoury?.range) { (opRec(state).broken ??= {})[id] = atMs; return; }
  const d = openingDelta(state, id);
  if (d) { if (d.broken === undefined) d.broken = atMs; return; }
  setOpening(state, id, openingState(state, id), { atMs: Math.min(atMs, state.clock?.ms ?? atMs), broken: atMs });
}

// ---- an operation off the range session (see the header) ----

const LEG = (door, room) => ({ room, door, state: 'ahead', fromMs: null, stackAtMs: null, openAtMs: null, enteredAtMs: null, clearAtMs: null, funnelMs: 0, funnelRunMs: 0, covered: {},
  contacts: [], rounds: 0, zones: {}, twoZones: {}, faults: [], calls: [], presses: 0, pressAbout: { person: 0, door: 0 }, inner: null, how: { keys: 0, bundle: 0 } });

/**
 * Opens an operation off the range session (see the header): area (the live area by default), team ({ two: pid } or null:
 * alone), turners (the rooms' targets, arms/turners.js records), atMs (its start: now). Refused (null) on a range session,
 * whose lane is the house's record. Returns state.cqb.
 */
export function openOp(state, { area = state.places?.live?.area ?? null, team = null, turners = [], atMs = state.clock?.ms ?? 0 } = {}) {
  if (state?.armoury?.range) return null;
  const twoPid = team?.two ?? null, aid = twoPid ? state.actors?.list?.find(a => a.who === twoPid)?.id ?? null : null;
  // (the legs from the area given, its own authored plans (scenes/assemble.js plansOfArea: X4_PLANS' for the set's area, a drawn
  // area's own), never the set's when the area is drawn (the review of 2026-11-16: an operation on a drawn house went by X4_PLANS.A,
  // every leg 'ahead' for 118 s); a drawn area's house kept as the lane keeps it (draw: { mode, v, code }, absent on the set), so
  // every seam that reads the house's plans or spec (planSetOf, houseSpecOf, room.js lanePlanOf) reads the drawn one off the range too)
  const draw = drawOfArea(state, area);
  const L = (area ? plansOfArea(area)[0] : null) ?? planSetOf(state), legs = (L?.order ?? []).map(door => LEG(door, L.plans?.[door]?.room ?? null));
  state.cqb = { area, ...(L?.lane && L.lane !== 'A' ? { lane: L.lane } : {}), ...(draw ? { draw } : {}), asked: {}, read: {}, order: { engage: 'off' }, bursts: [], team: { two: twoPid }, goAtMs: atMs, stallAtMs: atMs, end: null, twoPid,
    two: { pid: twoPid, aid, rung: twoPid ? rungOf(state, twoPid, 'room') : 0, doing: null, hold: null, contact: null, eng: null, known: {}, ident: {}, fired: 0, hits: 0 },
    rooms: legs.slice(0, -1), hall: legs.at(-1) ?? null, cur: 0, turners };
  return state.cqb;
}

// (a drawn area's house record, as the lane's R.house.draw: its whole code where the live place was generated from it (its cast
// with it), else its layout's, which the registry reads with the set's cast; null for an area that is not generated)
function drawOfArea(state, area) {
  if (typeof area !== 'string' || !area.includes(GEN_MARK)) return null;
  const live = state.places?.live, A = areaOf(area), layout = A?.gen?.layout ?? null;
  const code = live?.area === area && typeof live.gen?.code === 'string' && (!layout || live.gen.code.split('|')[0] === layout) ? live.gen.code : layout;
  return code ? { mode: 'drawn', v: 1, code } : null;
}

/** Closes the operation off the range session: state.cqb removed (the place's doors, broken or not, stay as they are). */
export function closeOp(state) { if (state && 'cqb' in state) delete state.cqb; }
