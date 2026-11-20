// OLYMPUS places: hatches, a bulkhead's and a deck's, and the one writer of a deck change (the build sheet v0.0.25 §0 item 2, §3.1, F135; PLACES §1.6, §5.4).
//
// A ship's compartments join two ways. A bulkhead hatch is an opening of the area (a door whose leaf is a hatch: 0.8 m, its coaming,
// its dogs, src/data/places/wreck.js WRECK_HATCHES): it opens and shuts as every door does (src/sim/places/doors.js, model.js
// setOpening), and while dogged it is a locked door (`lock`, which combat/bundle.js lockedOf reads), undogged by combat/op.js
// breakOpening. A deck hatch is no line in the plane: the trunk (WRECK_TRUNK) runs through deck 5's deck and deck 6's deckhead at one
// point of each deck's frame, and the Wreck's two decks lie 60 m apart in one area's plan (wreck.js's header: more than the stage's
// widest window, so neither is ever in the other's picture). Going through it is a cut, not a walk.
//
//   hatchOf(state, id, fromDeck?)  a hatch as the lane reads it: { id, kind: 'deck' | 'bulkhead', at, onFace, deck, state, far:
//                       { at, onFace, deck } }. The trunk's `at` is its end on fromDeck (deck 5's by default), `far` the other's; its
//                       state 'dogged' | 'shut' | 'open' (the template's 'dogged', then the save's: hatchState). A bulkhead hatch's `at`
//                       is its middle, `onFace` the compartment's bulkhead it stands in (the hatch's own room, its rooms[1]) and far's
//                       the side it is worked from; its state 'dogged' (locked and not undogged), 'closed' or 'open'. null for any id
//                       that is neither.
//   hatchState(state, id)  the trunk's state ('dogged' | 'shut' | 'open'): the save's delta, else the template's.
//   setHatch(state, id, s, { atMs })  the trunk's state written (the lane's beats: undog, open; never by a walker): the delta
//                       places.sites[site].hatches[id] = { state, atMs }, dropped when it is the template's again, so a save holds
//                       only what changed (PLACES §1.10). Returns { ok, why }.
//   crossHatch(state, bus, id, pids)  the only writer of a deck change: every pid's actor moved through the open trunk by the
//                       offset from its deck's end to the other's (the decks' origins: (60, 0) going down), x, z, $px and $pz together
//                       (the view never glides 60 m), its own anchor point with it (actor.anchorAt: where a hold or the brace was taken
//                       stays where it was relative to the body, so the footing's "still" reads through the cut; the brace across the
//                       trunk is the body's module's, footing.js heldBy through actor.anchorVia), its walked path dropped; the fact
//                       'hatch' { phase: 'cross', id, who, from, to, dx, dz, atMs } (the view's cut, the wipe of VIEWS §2.9). One tick,
//                       one area: no area changes, so no 'area-enter', no resync of the actors list, the actors' ids and their records
//                       untouched but for those fields. It writes no `onFace` (the plant's, footing.js setOnFace: one writer). It
//                       refuses whole, moving nobody: an unknown hatch, the trunk not open, the live area not the hatch's, a pid with no
//                       actor on the live area, an actor not within HATCH_REACH_M of the trunk's end on his deck, or one with a path
//                       request in flight (asked on the old deck, it would be answered there). Returns { ok, why, moved }.
//   deckAt(area, x, z)  the deck a point of a decked area lies on (its `decks`' rect, the walls' thickness round it counted), else null.
// Pure but for the state it is given and the bus.
import { areaOf, openingOf, openingState, openingArea, openingDelta } from './model.js';
import { SHIPS } from '../../data/places/ships.js';
import { brokenOf } from '../combat/op.js';

/** A body takes the trunk within this of its end's centre on his deck, metres (the scuttle's 0.4 m and a stack's reach at its coaming; my call). */
export const HATCH_REACH_M = 1.2;
/** The trunk's states, and its template's. */
export const TRUNK_STATES = Object.freeze(['dogged', 'shut', 'open']);
/** The deck hatches by id: every ship's trunks (src/data/places/ships.js SHIPS, the registry's `trunks`: the Wreck's one; v0.0.27's stage 0). */
export const DECK_HATCHES = Object.freeze(Object.fromEntries(Object.values(SHIPS).flatMap(S => S.trunks).map(T => [T.id, T])));
// (the faces of a compartment's bulkheads by which edge of its rect a line lies on: the area's frame is the deck's, x starboard, z ventral)
const FACE_OF_EDGE = Object.freeze({ x0: 'port', x1: 'starboard', z0: 'dorsal', z1: 'ventral' });
/** The walls' thickness round a deck counted on it (plan.js OUTER_T_M 0.3 and a margin), metres. */
const DECK_MARGIN_M = 0.5;

/** The deck a point of a decked area lies on (see the header), or null (off every deck, or an area with none). */
export function deckAt(area, x, z) {
  const A = typeof area === 'string' ? areaOf(area) : area;
  for (const d of A?.decks ?? []) {
    const [x0, z0, x1, z1] = d.rect;
    if (x >= x0 - DECK_MARGIN_M && x <= x1 + DECK_MARGIN_M && z >= z0 - DECK_MARGIN_M && z <= z1 + DECK_MARGIN_M) return d.n;
  }
  return null;
}
// (a deck hatch's site: its area's, the one area that holds both its ends)
const siteOfHatch = (id) => areaOf(DECK_HATCHES[id]?.area)?.site ?? null;

/** The trunk's state (see the header): the save's delta, else the template's; null for an id that is no deck hatch. */
export function hatchState(state, id) {
  const T = DECK_HATCHES[id];
  if (!T) return null;
  return state?.places?.sites?.[siteOfHatch(id)]?.hatches?.[id]?.state ?? T.state;
}

/** Write the trunk's state (see the header): { ok, why }. */
export function setHatch(state, id, s, { atMs = state?.clock?.ms ?? 0 } = {}) {
  const T = DECK_HATCHES[id];
  if (!T) return { ok: false, why: 'no such hatch' };
  if (!TRUNK_STATES.includes(s)) return { ok: false, why: `a deck hatch is ${TRUNK_STATES.join(', ')}, not '${s}'` };
  const site = siteOfHatch(id), P = (state.places ??= {}), sites = (P.sites ??= {});
  const rec = (sites[site] ??= { template: `${site}@1` });
  if (s === T.state) { if (rec.hatches) { delete rec.hatches[id]; if (!Object.keys(rec.hatches).length) delete rec.hatches; } }
  else (rec.hatches ??= {})[id] = { state: s, atMs };
  return { ok: true, why: null };
}

// (a bulkhead hatch's face: the edge of its own room (rooms[1]) its line lies on, and the worked side's (rooms[0]))
function faceIn(area, roomId, o) {
  const r = area?.rooms?.find(q => q.id === roomId);
  if (!r) return null;
  const [x0, z0, x1, z1] = r.rect, near = (a, b) => Math.abs(a - b) < 0.01;
  if (o.axis === 'x') return near(o.at, z0) ? FACE_OF_EDGE.z0 : near(o.at, z1) ? FACE_OF_EDGE.z1 : null;
  return near(o.at, x0) ? FACE_OF_EDGE.x0 : near(o.at, x1) ? FACE_OF_EDGE.x1 : null;
}

/** A hatch as the lane reads it (see the header), or null. */
export function hatchOf(state, id, fromDeck = null) {
  const T = DECK_HATCHES[id];
  if (T) {
    const i = fromDeck !== null && T.ends[1].deck === fromDeck ? 1 : 0, near = T.ends[i], far = T.ends[1 - i];
    return { id, kind: 'deck', at: [...near.at], onFace: near.face, deck: near.deck, state: hatchState(state, id), far: { at: [...far.at], onFace: far.face, deck: far.deck } };
  }
  const o = openingOf(id);
  if (!o || o.leaf !== 'hatch') return null;
  const area = openingArea(id), mid = o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2];
  const open = openingState(state, o) === 'open', broken = (state?.armoury?.range ? brokenOf(state, id) : openingDelta(state, id)?.broken) ?? null;
  const st = open ? 'open' : o.lock && broken === null ? 'dogged' : 'closed', deck = deckAt(area, mid[0], mid[1]);
  return { id, kind: 'bulkhead', at: mid, onFace: faceIn(area, o.rooms?.[1], o), deck, state: st, far: { at: [...mid], onFace: faceIn(area, o.rooms?.[0], o), deck } };
}

/** The only writer of a deck change (see the header): { ok, why, moved: [actor ids] }. */
export function crossHatch(state, bus, id, pids) {
  const T = DECK_HATCHES[id];
  if (!T) return { ok: false, why: 'no such hatch', moved: [] };
  if (hatchState(state, id) !== 'open') return { ok: false, why: `the scuttle is ${hatchState(state, id)}`, moved: [] };
  const areaId = T.area;
  if (state?.places?.live?.area !== areaId) return { ok: false, why: 'not on the hatch\'s area', moved: [] };
  const area = areaOf(areaId), list = state.actors?.list ?? [], asked = new Set([...(state.places?.nav?.queue ?? []), ...(state.places?.nav?.pending ?? [])].map(r => r.who));
  const moves = [];
  for (const pid of pids ?? []) {
    const a = list.find(x => x.who === pid) ?? list.find(x => x.id === pid);
    if (!a) return { ok: false, why: `no actor for ${pid}`, moved: [] };
    const d = deckAt(area, a.x, a.z), from = T.ends.find(e => e.deck === d), to = T.ends.find(e => e.deck !== d);
    if (!from || !to) return { ok: false, why: `${pid} is on no deck of the trunk`, moved: [] };
    if (Math.hypot(a.x - from.at[0], a.z - from.at[1]) > HATCH_REACH_M + 1e-9) return { ok: false, why: `${pid} is not at the trunk`, moved: [] };
    if (asked.has(a.id)) return { ok: false, why: `${pid} has a path asked in flight`, moved: [] };
    // (the offset to the micrometre: the ends' points are written to the centimetre, so the difference is the decks' origins' exactly)
    moves.push({ a, pid, from: from.deck, to: to.deck, dx: Math.round((to.at[0] - from.at[0]) * 1e6) / 1e6, dz: Math.round((to.at[1] - from.at[1]) * 1e6) / 1e6 });
  }
  if (!moves.length) return { ok: false, why: 'nobody to move', moved: [] };
  const atMs = state.clock?.ms ?? 0;
  for (const m of moves) {
    const a = m.a;
    a.x += m.dx; a.z += m.dz;
    a.$px = a.x; a.$pz = a.z;
    if (Array.isArray(a.anchorAt)) a.anchorAt = [a.anchorAt[0] + m.dx, a.anchorAt[1] + m.dz];
    delete a.path;
  }
  const f = moves[0];
  bus?.emit('hatch', { phase: 'cross', id, who: moves.map(m => m.pid), from: f.from, to: f.to, dx: f.dx, dz: f.dz, atMs });
  return { ok: true, why: null, moved: moves.map(m => m.a.id) };
}
