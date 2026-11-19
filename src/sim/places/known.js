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
//   familiarOf(state, areaId)  whether the place is known before it is seen. A scene says when it is not (src/data/scenes.js
//                        `familiar`): 'set' on the shoot house's two scenes, so the house as set (lane A, briefed on its plan)
//                        is familiar and the house drawn from the seed is not, on its own lane area only (my calls, the build
//                        sheet's question 8). A named house (&layout=B or C, R.house.draw's `layout`: the instructors' other
//                        panel settings, as fixed as lane A) is briefed as lane A is, so familiar (my call). Every other place,
//                        and every scene without the field, is familiar: today's picture, untouched.
//                        v0.0.25 (the build sheet v0.0.25 item 9, §3.1; the user, 2026-11-19, of H2: "we shouldn't know what's
//                        behind closed doors or walls without looking"): 'walls', the Wreck's, a ship's plan briefed: false on the
//                        scene's host area, whatever the house's record (the Wreck is no drawn house), so its compartments are black
//                        until seen and its walls known (footprintOf's `walls`).
//   footprintOf(state)   the drawn house's known parts, which never move (scenes/assemble.js's header: "its footprint fixed
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
import { planOf, wallsOf, wallRect } from './plan.js';
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
 * The familiarity a state's scene names (see the header): { familiar: 'set' | 'walls', area } or null. A test may pass its own rule
 * to familiarOf and footprintOf in place of this (the scene that names 'walls' is the lane's, not this module's).
 */
export const sceneFamiliar = (state) => familiarRule(state);
// (the house's drawn record, R.house.draw = { mode: 'drawn', … }, or null as set)
const drawnOf = (state) => { const d = opOf(state)?.draw; return d?.mode === 'drawn' ? d : null; };

/** Whether an area is known before it is seen (see the header). rule: the scene's (sceneFamiliar), or a test's own. */
export function familiarOf(state, areaId, rule = familiarRule(state)) {
  if (!state || !areaId) return true;
  // ('walls', the Wreck's: its plan briefed, every compartment unknown until seen, on the scene's host area only)
  if (rule?.familiar === 'walls') return rule.area !== areaId;
  const d = drawnOf(state);
  if (rule?.familiar !== 'set' || !d || d.layout) return true;
  return houseSpecOf(state)?.area !== areaId;
}

// (an area's wall runs as rects [x0, z0, x1, z1], the very walls the nav grid blocks and the cutaway draws: plan.js wallsOf)
const WALLS = new WeakMap();
function wallRectsOf(A) {
  let w = WALLS.get(A);
  if (!w) { w = Object.freeze(wallsOf(planOf(A)).map(q => { const r = wallRect(q); return Object.freeze([r.x0, r.z0, r.x1, r.z1]); })); WALLS.set(A, w); }
  return w;
}

/**
 * The known parts (see the header), or null where there is none. Under 'walls' (v0.0.25, the Wreck: its plan briefed) the scene's
 * host area's: { rect: its bounds (outside them nothing to hide), fixed: [], walls: every wall run's rect, known from the start with
 * its ring (render/known.js marks them with WALL_CELLS), the compartments' floors not }. Else the drawn house's, as before.
 */
export function footprintOf(state, rule = familiarRule(state)) {
  if (rule?.familiar === 'walls') {
    const A = areaOf(rule.area);
    if (!A?.boundsM) return null;
    const b = A.boundsM;
    return { rect: [b.x0, b.z0, b.x1, b.z1], fixed: [], walls: wallRectsOf(A).map(r => [...r]) };
  }
  const H = opOf(state);
  if (!H) return null;
  const S = houseSpecOf(state), A = areaOf(S.area);
  if (!S?.rect) return null;
  const fixed = [];
  const cw = S.catwalk?.path ?? [];
  for (let i = 1; i < cw.length; i++) {
    const [ax, az] = cw[i - 1], [bx, bz] = cw[i];
    fixed.push([Math.min(ax, bx) - CATWALK_HALF_M, Math.min(az, bz) - CATWALK_HALF_M, Math.max(ax, bx) + CATWALK_HALF_M, Math.max(az, bz) + CATWALK_HALF_M]);
  }
  const booth = S.booth?.room ? A?.rooms?.find(r => r.id === S.booth.room) : null;
  if (booth) fixed.push([...booth.rect]);
  return { rect: [...S.rect], fixed };
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
