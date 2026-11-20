// OLYMPUS sim: what the stage may draw of a place and its people before you have seen them (the build sheet v0.0.23 items 6 and 7, §0 items 15, 20, 34 and 35; VIEWS §2.11; DESIGN.md's entry of 2026-11-17).
//
// The user, 2026-11-17: "we see what is in the rooms before entering them, this should not be the case when we start
// generating procedurally". The rule (DESIGN.md's log, the same day): a place you know keeps the fog's dimmed picture; in a
// place you do not know, a cell never seen is not drawn at all, then revealed by sight and remembered as last seen; and a person
// is drawn only where he is seen now, or as last seen, never before he has been seen. This module is the sim's half of that
// rule, the reads the stage needs and may not make itself (render reads no scenario: it imports this module, one of
// tests/syntax.test.mjs's SIM_FOR_VIEW); the view's half (the known cells, the hidden men) is src/render/known.js and
// src/render/memory.js.
//
//   familiarOf(state, areaId)  whether the place is known before it is seen. A scene says how much its brief told you (src/data/
//                        scenes.js `familiar`, the intel), on its host area and on the drawn house's area (the lane's), every
//                        other place familiar. v0.0.28 (the user's note of 2026-11-20 on house-unknown U: "special forces would
//                        have the layout when they were briefed ... although we can't know what is inside the rooms, the layout
//                        would be known most of the time, unless the scenario justifies the lack of intel"), one field:
//                        'walls', every combat scene's (the house as set, drawn or a named layout, the live lane, the breach, the
//                        Wreck, the hauler): the plan briefed, every wall, door and hatch known from the start (footprintOf's
//                        `walls`), every room's inside, its floor and whatever stands on it, unknown until seen (the instructors
//                        move the stands between runs, so the house as set is no longer drawn dimmed through the fog: my call,
//                        overrulable); 'none', a scene whose brief says why there is no intel (no shipped scene yet, my call):
//                        only the outside known, the footprint and its fixed parts (v0.0.23's drawn-house rule). No field, a
//                        place you live in (the base, the ranges): familiar, today's picture. v0.0.23 to v0.0.27's 'set' (the
//                        set house familiar, the drawn one not) is gone.
//   footprintOf(state)   the house's known parts (drawn or as set), which never move (scenes/assemble.js's header: "its footprint fixed
//                        (HOUSE1_RECT, the hall, the apron, the catwalk and the booth never move)"): the footprint's rect (its
//                        outer walls known, the apron outside it), the catwalk's band over the hall and the booth (the
//                        instructors', never a room of the exercise); { rect, fixed: [[x0, z0, x1, z1]] }, or null off the house.
//   knownRoomsOf(state)  the rebuild's rooms (a load, a scene's restart, a skip under the splash's iris: the view's memory is
//                        new, so its known cells are made again from the legs): a room whose leg reached 'entered' (entered,
//                        cleared, or entered and passed) is known whole, with the far part of an ell; the hall as walked, from
//                        its east end (the start) to the west jamb of the last door a leg of yours reached (stacked or
//                        beyond), the whole hall once its own leg is under way. [{ id, rect, known: 'whole' | 'walked' }].
//   hostKind(state)      'house' on the range's house course, 'op' on an operation off the range (op.js hostOf against
//                        NULL_HOST), null elsewhere: the combat scenes, where a man is hidden until seen (overhaul question
//                        2's default: the base's people keep PEOPLE's no-pop box).
//   alwaysDrawn(state, actor)  you, your #2 and the instructor: drawn by v0.0.22's rule in every scene (never hidden).
//   seenEver(state, actor, { rooms })  whether a person may be drawn: you, your #2 and the instructor always; anyone else when
//                        he is on your contact.seenAt now (combat/men.js keeps the last tick you saw each live man there;
//                        forget() drops a man who gave up), or in your sight this frame (perception's visibility above 0 at
//                        his spot, the fog's own function), or, with rooms (the view passes it on the first frame of a new
//                        state only), standing in a room knownRoomsOf gives: the sim keeps no durable "ever seen" record and a
//                        new saved one would move every pin's saves (§0 item 34), so a man glimpsed and then forgotten waits
//                        for his next sighting after a load, and one seen before it in a room you entered is drawn.
// Pure: reads the state, writes nothing; nothing here is saved.
import { SCENES } from '../../data/scenes.js';
import { houseSpecOf } from '../scenes/assemble.js';
import { areaOf } from './model.js';
import { planOf, wallsOf, wallRect, leafRect } from './plan.js';
import { opOf, hostOf, NULL_HOST } from '../combat/op.js';
import { turnersOf } from '../arms/turners.js';
import { contactOf } from '../people/mind.js';
import { eyeOf, visibility } from '../people/perception.js';
import { playerActor } from '../../core/ids.js';

/** The catwalk's band over the hall, either side of its path (metres): its walkway's half width and its rail (my call: the catwalk drawn whole). */
export const CATWALK_HALF_M = 0.6;
/** The leg states at or past a room's entry (shoothouse.js progress's order, and 'passed' when the room was entered first). */
const ENTERED = new Set(['entered', 'clear']);

// (the scene of the game's scenario that names a familiarity: the scenes sharing a scenario share their host, so they share this;
// the rule { familiar, area (the scene's host area) }, or null)
function familiarRule(state) {
  const sc = state?.meta?.scenario;
  if (!sc) return null;
  for (const s of Object.values(SCENES)) if (s.scenario === sc && s.familiar) return { familiar: s.familiar, area: s.host?.area ?? null };
  return null;
}
/**
 * The intel a state's scene names (see the header): { familiar: 'walls' | 'none', area } or null. A test may pass its own rule to
 * familiarOf and footprintOf in place of this.
 */
export const sceneFamiliar = (state) => familiarRule(state);
// (the house's drawn record, R.house.draw = { mode: 'drawn', … }, or null as set)
const drawnOf = (state) => { const d = opOf(state)?.draw; return d?.mode === 'drawn' ? d : null; };
/** The intels a scene may name (see the header): the walls briefed, or nothing past the outside. */
export const INTELS = Object.freeze(['walls', 'none']);
// (the area a rule's brief covers: the scene's host, or the drawn house's own area, a variant of the host's ('melas.wheel.s4~<v>'))
const briefed = (state, rule, areaId) => areaId === rule.area || (!!drawnOf(state) && houseSpecOf(state)?.area === areaId);

/** Whether an area is known before it is seen (see the header). rule: the scene's (sceneFamiliar), or a test's own. */
export function familiarOf(state, areaId, rule = familiarRule(state)) {
  if (!state || !areaId || !INTELS.includes(rule?.familiar)) return true;
  return !briefed(state, rule, areaId);
}

// (an area's wall runs as rects [x0, z0, x1, z1], the very walls the nav grid blocks and the cutaway draws: plan.js wallsOf)
const WALLS = new WeakMap();
function wallRectsOf(A) {
  let w = WALLS.get(A);
  if (!w) { w = Object.freeze(wallsOf(planOf(A)).map(q => { const r = wallRect(q); return Object.freeze([r.x0, r.z0, r.x1, r.z1]); })); WALLS.set(A, w); }
  return w;
}
// (the review of the picks: "every wall, door and hatch drawn from GO" held for the walls alone, a door's gap was its jambs' cells and
// no more (on the house 1 to 4 of a door's 9 points known, the Wreck's 3 of 8), so a shut door could read as an open gap. An area's
// doors and bulkhead hatches, every opening with a leaf (the plan's kind 'door'), as the rects their leaves block (plan.js leafRect:
// WALL_T_M astride the line, across the gap), briefed with the walls. A doorway (the plan's 'gap') shuts nothing: its threshold is
// a room's floor, unknown until seen, the gap between its two known jambs saying what it is; a deck's scuttle lies in a
// compartment's floor and is seen with it)
const DOORS = new WeakMap();
function doorRectsOf(A) {
  let d = DOORS.get(A);
  if (!d) { d = Object.freeze((planOf(A).openings ?? []).filter(o => o.kind === 'door').map(o => { const r = leafRect(o); return Object.freeze([r.x0, r.z0, r.x1, r.z1]); })); DOORS.set(A, d); }
  return d;
}

/**
 * The known parts (see the header), or null where there is none: { rect (outside it nothing to hide), fixed: [[x0, z0, x1, z1]]
 * (known from the start with their ring), walls? and doors? (under 'walls': every wall run's rect, and every door's and bulkhead
 * hatch's leaf (doorRectsOf), the plan briefed; render/known.js marks the cells they touch, and every cell in no room) }. On the house (as set, drawn or named, the rule's area its own) the footprint's rect,
 * the catwalk's band and the booth; on a ship or another area the area's bounds and nothing fixed (v0.0.25's, the Wreck's). With no
 * rule, the house's footprint as v0.0.23 drew a drawn house (the view reads it only where a place is unfamiliar).
 */
export function footprintOf(state, rule = familiarRule(state)) {
  const intel = INTELS.includes(rule?.familiar) ? rule.familiar : null, H = opOf(state);
  const S = H ? houseSpecOf(state) : null;
  const onHouse = !!S?.rect && (!intel || briefed(state, rule, S.area));
  if (intel && !onHouse) {
    const A = areaOf(rule.area);
    if (!A?.boundsM) return null;
    const b = A.boundsM;
    return { rect: [b.x0, b.z0, b.x1, b.z1], fixed: [], ...(intel === 'walls' ? { walls: wallRectsOf(A).map(r => [...r]), doors: doorRectsOf(A).map(r => [...r]) } : {}) };
  }
  if (!H || !S?.rect) return null;
  const A = areaOf(S.area), fixed = [];
  const cw = S.catwalk?.path ?? [];
  for (let i = 1; i < cw.length; i++) {
    const [ax, az] = cw[i - 1], [bx, bz] = cw[i];
    fixed.push([Math.min(ax, bx) - CATWALK_HALF_M, Math.min(az, bz) - CATWALK_HALF_M, Math.max(ax, bx) + CATWALK_HALF_M, Math.max(az, bz) + CATWALK_HALF_M]);
  }
  const booth = S.booth?.room ? A?.rooms?.find(r => r.id === S.booth.room) : null;
  if (booth) fixed.push([...booth.rect]);
  return { rect: [...S.rect], fixed, ...(intel === 'walls' && A ? { walls: wallRectsOf(A).map(r => [...r]), doors: doorRectsOf(A).map(r => [...r]) } : {}) };
}

// (a leg's rooms: its own and an ell's far part, the room id with '-far')
const legRooms = (A, id) => (A?.rooms ?? []).filter(r => r.id === id || r.id === `${id}-far`);
const reached = (L) => !!L && (ENTERED.has(L.state) || (L.state === 'passed' && L.enteredAtMs !== null && L.enteredAtMs !== undefined));

/** The rebuild's rooms (see the header): [{ id, rect, known }]. */
export function knownRoomsOf(state) {
  const H = opOf(state);
  if (!H) return [];
  const S = houseSpecOf(state), A = areaOf(S.area), out = [];
  if (!A) return out;
  let west = Infinity;
  for (const L of H.rooms ?? []) {
    if (reached(L)) for (const r of legRooms(A, L.room)) out.push({ id: r.id, rect: [...r.rect], known: 'whole' });
    if (L.state && L.state !== 'ahead') {
      const o = A.openings?.find(x => x.id === L.door);
      if (o) west = Math.min(west, o.axis === 'x' ? Math.min(o.a, o.b) : o.at);
    }
  }
  const hall = S.hall?.rect ?? null, HL = H.hall ?? null;
  if (hall) {
    const whole = !!HL && HL.state && HL.state !== 'ahead';
    const from = whole ? hall[0] : Math.max(hall[0], Math.min(west, S.start?.x ?? hall[2]));
    out.push({ id: S.hall.room ?? 'hall', rect: [from, hall[1], hall[2], hall[3]], known: whole ? 'whole' : 'walked' });
  }
  return out;
}

/** The combat scene's kind (see the header): 'house', 'op' or null. */
export function hostKind(state) {
  if (!state || hostOf(state) === NULL_HOST) return null;
  return state.armoury?.range ? 'house' : 'op';
}

/**
 * Whether a person is drawn by v0.0.22's rule even in a combat scene (see the header): you, your #2 and the instructor, the team
 * and the staff you always know are there. The view passes no combat to memory.js recall for them, so out of sight they keep
 * PEOPLE's no-pop box (drawn as they are where their remembered spot is in sight), never hidden.
 */
export function alwaysDrawn(state, actor) {
  if (!state || !actor) return false;
  const me = playerActor(state), H = opOf(state);
  return actor === me || actor.id === me?.id || actor.who === state.player?.id || actor.who === H?.twoPid || actor.who === H?.chiefPid || actor.who === H?.team?.two;
}

// (a role-player's turner record by his actor's person id: the live man's T.live.who)
const turnerOfWho = (state, who) => turnersOf(state).find(T => T.live?.who === who) ?? null;

/**
 * Whether a person may be drawn (see the header). actor: the actor record (or its id); rooms: let the rebuild's rooms count (the
 * view's first frame of a new state); sight: the caller's own in-sight test (x, z) → bool, else perception's visibility above 0.
 */
export function seenEver(state, actor, { rooms = false, sight = null } = {}) {
  if (!state) return true;
  const a = typeof actor === 'string' ? state.actors?.list?.find(x => x.id === actor) ?? null : actor;
  if (!a) return false;
  if (alwaysDrawn(state, a)) return true;
  const me = playerActor(state);
  const T = turnerOfWho(state, a.who), seenAt = contactOf(state)?.seenAt;
  if (T && seenAt && seenAt[T.key] !== undefined) return true;
  if (sight ? sight(a.x, a.z) : (me && visibility(state, eyeOf(state, me), a.x, a.z) > 0)) return true;
  if (rooms) for (const r of knownRoomsOf(state)) { const [x0, z0, x1, z1] = r.rect; if (a.x >= x0 && a.x <= x1 && a.z >= z0 && a.z <= z1) return true; }
  return false;
}
