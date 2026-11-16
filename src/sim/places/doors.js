// OLYMPUS places: doors, opened and closed by a hand, their leaves swinging in game time (PLACES §1.6; the build sheet 0.0.3 §2.1).
//
// A door's leaf takes its kind's time to move (PLACES §1.6: an interior door 0.4 s, a weather door
// 0.6 s, the opening's openS and closeS; from 1.0 and 1.2 s in v0.0.6, the user, 2026-11-07: "doors
// open and close much too slow"). toggleDoor(state, id, bus, { who }) turns a door the other way: opening, the leaf keeps blocking until it has swung clear (the delta's atMs, now plus what is
// left of its openS), then its cells are re-marked free; closing, it blocks at once (a walker in its
// cells is settled out by the player layer, as built) while its picture swings shut over closeS. A
// toggle in mid-swing turns from where the leaf is, so leafAt never jumps: leafAt(state, id, ms) is
// the open fraction the stage swings the leaf by (TECH §9.2's props), 0 shut to 1 open, linear in
// game time. Doorways, gates and curtains have no leaf to turn (null). Every toggle tells the bus
// 'door' { id, area, x, z, state, kind, who } (PLACES; the audio plays it), x and z the door's middle
// in the frame of the side it was turned from: the live area's, where the live area holds the door
// (the opening's floor, or a ground whose mass has a door naming it), else the opening's own floor.
// The opening twinned on the ground (a mass's door naming it: Echo's outside doors) is the same
// state, read on both sides; turned from the street it sounds on the street (v0.0.3's review: the
// fact named the floor, which the audio, hearing only the live area, dropped).
//
// doorsStep(state) frees a leaf once it has swung open: each tick (at the start of the player layer,
// before anyone moves) the openings still moving whose atMs has come are re-marked on every cached
// grid (nav.js remarkLeaf, sight.js remarkSight), and a delta that matches its template and has
// finished is dropped (PLACES §1.10: the save holds only what changed). Which leaves are moving is
// runtime ($places.moving), found again from the saved deltas after a load, so a game saved while a
// door swings frees it on the tick the unsaved run would.
//
// v0.0.20 (the build sheet's item 15, the feel lens's FL-6: "the picture and the sound do not tell a kick from a push"): **a
// door moves as it was opened**. The delta keeps the verb that opened it, `how` ('push' | 'pull' | 'kick', model.js setOpening's
// option; absent for a toggle by hand, a pry, a ram or a blown door: the linear swing as built). leafAt stays the linear fraction
// the sim reads (the nav, bundle.js's leafAt(…) >= 1, the arcs' no-stop zone: nothing of the sim moves with the picture), and
// leafShownAt is what the stage draws, leafCurve(how, leafAt) over the same span and the same atMs: a push eases out
// (1 − (1 − t)³), a pull is drawn by a hand (t²(3 − 2t)), a kick slams to its stop at KICK_STOP_T 0.55, rebounds to KICK_BACK_K
// 0.88 at t 0.75 and settles at 1 at the span's end. stopAtOf(how, leafAtMs, openMs) is the moment the curve first reaches 1,
// which the house's door facts carry for the knock (bundle.js's door and force kinds; the audio's). Pure but for the state it is given.
import { openingOf, openingArea, openingState, openingDelta, setOpening, liveArea } from './model.js';
import { remarkLeaf } from './nav.js';
import { remarkSight } from './sight.js';

/** Leaves that turn (PLACES §1.6's kinds with a leaf); a doorway, a gate or a curtain does not. */
export const LEAF_KINDS = Object.freeze(['door', 'extDoor', 'fireDoor', 'pressureDoor', 'bulkheadDoor', 'airlockDoor', 'vehicleDoor', 'blastDoor', 'hatch']);
/** A leaf's open and close seconds where the opening gives none (PLACES §1.6's interior door). */
export const DOOR_S = 0.4;

const middleOf = (o) => (o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2]);
// (where a door is heard: the live area's side when the live area holds it, else the opening's floor)
function doorSide(state, o) {
  let live = null;
  try { live = liveArea(state); } catch { live = null; }
  if (live?.kind === 'ground') {
    for (const m of live.massing ?? []) for (const d of m.doors ?? []) if (d.opening === o.id) return { area: live.id, x: (d.a + d.b) / 2, z: d.z };
  }
  const [x, z] = middleOf(o);
  return { area: openingArea(o.id).id, x, z };
}
/** Whether an opening has a leaf a hand can turn. */
export const turns = (o) => !!o && LEAF_KINDS.includes(o.kind);

/** A door's open fraction at game time ms, 0 shut to 1 open (the stage swings the leaf by it). */
export function leafAt(state, openingId, ms = state?.clock?.ms ?? 0) {
  const o = openingOf(openingId);
  if (!o) return 1;
  if (!turns(o)) return 1;
  const d = openingDelta(state, openingId), s = d?.state ?? o.state ?? 'open';
  if (!d || d.atMs === undefined || d.atMs <= ms) return s === 'open' ? 1 : 0;
  const left = d.atMs - ms;
  return s === 'open' ? Math.max(0, Math.min(1, 1 - left / ((o.openS ?? DOOR_S) * 1000))) : Math.max(0, Math.min(1, left / ((o.closeS ?? DOOR_S) * 1000)));
}

/** The verbs a leaf's curve knows (see the header); any other, or none, is the linear swing. */
export const LEAF_HOWS = Object.freeze(['push', 'pull', 'kick']);
/** A kick's leaf at its stop at this share of the span, back off it to KICK_BACK_K at KICK_BACK_T, settled at 1 at the end (FL-6). */
export const KICK_STOP_T = 0.55, KICK_BACK_T = 0.75, KICK_BACK_K = 0.88;
/**
 * The leaf's drawn open fraction for the verb that opened it (see the header), t the linear fraction 0 to 1: push 1 − (1 − t)³,
 * pull t²(3 − 2t), kick an ease-out square to 1 at KICK_STOP_T, a rebound to KICK_BACK_K at KICK_BACK_T and back to 1 at t 1
 * (each leg a smooth step); else t.
 */
export function leafCurve(how, t) {
  const x = Math.max(0, Math.min(1, t));
  if (how === 'push') return 1 - (1 - x) ** 3;
  if (how === 'pull') return x * x * (3 - 2 * x);
  if (how !== 'kick') return x;
  if (x <= KICK_STOP_T) { const u = x / KICK_STOP_T; return 1 - (1 - u) ** 2; }
  const ss = (u) => u * u * (3 - 2 * u);
  if (x <= KICK_BACK_T) return 1 - (1 - KICK_BACK_K) * ss((x - KICK_STOP_T) / (KICK_BACK_T - KICK_STOP_T));
  return KICK_BACK_K + (1 - KICK_BACK_K) * ss((x - KICK_BACK_T) / (1 - KICK_BACK_T));
}
/** A door's open fraction as the stage draws it at ms (see the header): leafCurve(the delta's how, leafAt); a closing leaf, or a delta with no verb, as leafAt. */
export function leafShownAt(state, openingId, ms = state?.clock?.ms ?? 0) {
  const k = leafAt(state, openingId, ms), d = openingDelta(state, openingId);
  return d?.how && d.state === 'open' && k > 0 && k < 1 ? leafCurve(d.how, k) : k;
}
/** When a leaf opened by `how` first stands at its stop (see the header): a kick KICK_STOP_T of the way through its swing, any other at the swing's end (ms). */
export const stopAtOf = (how, leafAtMs, openMs) => leafAtMs + Math.round((how === 'kick' ? KICK_STOP_T : 1) * openMs);

/** Turn a door the other way (see the header): 'open' | 'closed', or null for a doorway, a gate or no such door. */
export function toggleDoor(state, openingId, bus, { who = null, to = null } = {}) {
  const o = openingOf(openingId);
  if (!turns(o)) return null;
  const now = state.clock.ms, cur = openingState(state, o), want = to ?? (cur === 'open' ? 'closed' : 'open');
  if (want === cur) return cur;
  const f = leafAt(state, openingId, now);
  const atMs = now + Math.round((want === 'open' ? (1 - f) * (o.openS ?? DOOR_S) : f * (o.closeS ?? DOOR_S)) * 1000);
  setOpening(state, openingId, want, { atMs });
  const P = (state.$places ??= {});
  (P.moving ??= new Set()).add(openingId);
  bus?.emit('door', { id: openingId, ...doorSide(state, o), state: want, kind: o.kind, who });
  return want;
}

/** Free the leaves that have swung open, drop the finished deltas that match their template (see the header). */
export function doorsStep(state) {
  const P = (state.$places ??= {}), now = state.clock.ms;
  if (!P.movingFound) {                                            // (after a load: the leaves still moving, from the saved deltas)
    P.movingFound = true;
    P.moving ??= new Set();
    for (const site of Object.values(state.places?.sites ?? {})) for (const [id, d] of Object.entries(site.openings ?? {})) if (d.atMs !== undefined) P.moving.add(id);
  }
  if (!P.moving?.size) return;
  for (const id of [...P.moving]) {
    const d = openingDelta(state, id);
    if (d && d.atMs !== undefined && d.atMs > now) continue;
    P.moving.delete(id);
    const o = openingOf(id);
    if (d && d.state === (o?.state ?? 'open')) setOpening(state, id, d.state, { atMs: now });   // (back to the template, finished: the delta goes)
    else { remarkLeaf(state, id); remarkSight(state, id); }
  }
}
