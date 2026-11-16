// OLYMPUS scenarios: the shoot house's debrief, the plan view's model (the build sheet v0.0.20 §1 item 26; COMBAT §25.10.4; card C2).
//
// "Where it happened": the run sheet says "CORNER MISSED · DOORWAY 0.30 S", and this module gives each of its marks a place and a
// time on the house seen from above. debriefOf(state) is pure over the state and its runtime trace (shoothouse.js traceTick writes
// R.house.$trace every TRACE_MS from GO: both men's place, facing, movement stance and carry as codes, each lane door's leaf; never
// saved, so a lane loaded mid-way is traced from its load and the plan says so: `from`). Nothing else in src/sim reads $trace
// (tests/syntax.test.mjs holds it). The model:
//   walls   the house's rooms as rects (the Wheel's sector 4 inside HOUSE1's rect), north up as the stage draws them;
//   doors   every door of those rooms, its hinge side and swing (PLACES §1.6), and for a lane door its leaf open fraction at each
//           sample (`k`, the trace's), so the scrubber draws the leaf where it was;
//   stands  each stand as the paper has it (its face, what it held, down or turned away and when, its hits with zone and shooter);
//   tracks  { ms, me, two, live }: the trace's samples (ms from the game clock; me and two five numbers a sample: x, z, facing in
//           degrees, stance and carry codes, shoothouse.js TRACE_STANCES and TRACE_CARRY);
//   events  [{ kind, atMs, x, z, by, ... }] in time order: 'go', 'sighting' and 'pause' (each contact of the run sheet), 'round'
//           (every round of yours, R.shots, and of your number two's, H.two.shots, its zone from the stand's hits, a miss null),
//           'fault' (each leg's faults, its paper word), 'corner' (each hot spot covered, at the hot spot, by whom), 'clear' (each
//           "Clear!" called), 'door' (each lane door's opening); each placed by the trace at its time (the man who did it, or the
//           thing it is at), so the counts are the run sheet's own (tests/house-debrief.test.mjs);
//   legs    a row a leg: its word, room, door, from, clear, par and state (the scrubber's segments);
//   from    the trace's first sample (ms), null with no trace.
// Pure: no DOM, no clock but the game's; called by the end card only (main.js openHouseEnd calls it directly).
import { WHEEL_S4, HOUSE1 } from '../../data/places/wheel.js';
import { lanePlanOf } from '../combat/room.js';
import { rangeOf } from './handling.js';
import { playerId } from '../../core/ids.js';

/** The legs' words on the plan's scrubber. */
const LEG_WORD = Object.freeze(['ROOM 1', 'ROOM 2', 'ROOM 3', 'THE HALL']);
/** A fault's word on the plan (the run sheet's paper words where it has one). */
const FAULT_WORD = Object.freeze({ funnel: 'DOORWAY', muzzle: 'MUZZLE', corner: 'CORNER MISSED', noshoot: 'NO-SHOOT HIT', hostage: 'HOSTAGE HIT', standing: 'LEFT STANDING', door: 'DOOR LEFT', time: 'TIME', relaxed: 'RELAXED', cold: 'COLD', masked: 'MASKED' });

// (a rect inside another: the house's rooms out of the sector's)
const inside = (r, R) => r[0] >= R[0] - 1e-6 && r[1] >= R[1] - 1e-6 && r[2] <= R[2] + 1e-6 && r[3] <= R[3] + 1e-6;
// (the sample at or before ms: its index, or -1 before the trace)
function sampleAt(tr, ms) {
  if (!tr?.ms?.length || ms < tr.ms[0]) return -1;
  let lo = 0, hi = tr.ms.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (tr.ms[mid] <= ms) lo = mid; else hi = mid - 1; }
  return lo;
}
/** A man's place on the trace at ms: { x, z, faceDeg, stance, carry } (the nearest sample at or before it; the first one before the trace), or null. */
export function placeAt(tr, who, ms) {
  const arr = tr?.[who];
  if (!arr?.length) return null;
  const i = Math.max(0, sampleAt(tr, ms)), o = i * 5;
  return arr[o] === null ? null : { x: arr[o], z: arr[o + 1], faceDeg: arr[o + 2], stance: arr[o + 3], carry: arr[o + 4] };
}

/** The plan view's model (see the header), or null off the house course. */
export function debriefOf(state) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return null;
  const tr = H.$trace ?? null, rect = HOUSE1.rect ?? [5, 4, 35, 24];
  const rooms = (WHEEL_S4.rooms ?? []).filter(r => inside(r.rect, rect) || (r.id ?? '').startsWith('w4.r') || r.id === 'w4.hall');
  const ids = new Set(rooms.map(r => r.id));
  const walls = rooms.map(r => ({ id: r.id, name: r.name, rect: [...r.rect] }));
  const plan = lanePlanOf(state), lane = new Set(plan.order);
  const doors = (WHEEL_S4.openings ?? []).filter(o => (o.rooms ?? []).some(x => ids.has(x))).map(o => ({
    id: o.id, axis: o.axis, at: o.at, a: o.a, b: o.b, kind: o.kind, swing: o.swing ? { ...o.swing } : null, lane: lane.has(o.id), k: tr?.doors?.[o.id] ? [...tr.doors[o.id]] : null,
  }));
  const zoneOf = (T, key) => (T?.hits ?? []).find(h => h.shotId === key) ?? null;
  const stands = R.turners.map(T => ({ key: T.key, stand: T.stand, room: T.room, x: T.x, z: T.z, face: T.face, holds: T.holds, down: T.stoppedAtMs !== null, downAtMs: T.stoppedAtMs,
    awayAtMs: T.awayAtMs, turnAtMs: T.turnAtMs, hits: (T.hits ?? []).map(h => ({ zone: h.zone, part: h.part, by: h.by, atMs: h.atMs, shotId: h.shotId })) }));
  const legs = [...H.rooms, H.hall];
  const events = [];
  const put = (e, who) => { const p = who ? placeAt(tr, who, e.atMs) : null; events.push({ ...e, x: e.x ?? p?.x ?? null, z: e.z ?? p?.z ?? null }); };
  const whoOf = (by) => (by === 'two' ? 'two' : 'me');
  if (H.goAtMs !== null) put({ kind: 'go', atMs: H.goAtMs, by: 'me' }, 'me');
  legs.forEach((L, k) => {
    for (const c of L.contacts) {
      put({ kind: 'sighting', atMs: c.seenMs, by: c.by, key: c.key, stand: c.stand, leg: k, takeInMs: c.takeInMs ?? null }, whoOf(c.by));
      if (Number.isFinite(c.pauseAtMs)) put({ kind: 'pause', atMs: c.pauseAtMs, by: c.by, key: c.key, stand: c.stand, leg: k, takeInMs: c.takeInMs }, whoOf(c.by));
    }
    for (const f of L.faults) put({ kind: 'fault', atMs: f.atMs ?? L.clearAtMs ?? H.end?.atMs ?? null, fault: f.kind, word: FAULT_WORD[f.kind] ?? String(f.kind).toUpperCase(), leg: k, by: 'me' }, 'me');
    const P = plan.plans[L.door], hot = new Map((P?.hot ?? []).map(h => [h.id, h]));
    for (const [id, c] of Object.entries(L.covered ?? {})) put({ kind: 'corner', atMs: c.atMs, by: c.by, hot: id, leg: k, x: hot.get(id)?.x ?? null, z: hot.get(id)?.z ?? null });
    for (const c of L.calls ?? []) if (c.say === 'clear') put({ kind: 'clear', atMs: c.atMs, by: c.by, how: c.how, leg: k }, whoOf(c.by));
  });
  for (const [door, atMs] of Object.entries(H.doors ?? {})) { const o = doors.find(d => d.id === door); put({ kind: 'door', atMs, door, x: o ? (o.axis === 'x' ? (o.a + o.b) / 2 : o.at) : null, z: o ? (o.axis === 'x' ? o.at : (o.a + o.b) / 2) : null }); }
  const T0 = new Map(R.turners.map(T => [T.key, T]));
  for (const s of R.shots ?? []) { const h = zoneOf(T0.get(s.key), s.id); put({ kind: 'round', atMs: s.atMs, by: 'me', key: s.key, row: s.row ?? null, zone: h?.zone ?? null, part: h?.part ?? s.part ?? null, id: s.id }, 'me'); }
  for (const s of H.two?.shots ?? []) { const h = zoneOf(T0.get(s.key), s.id); put({ kind: 'round', atMs: s.atMs, by: 'two', key: s.key, zone: h?.zone ?? null, part: h?.part ?? null, id: s.id }, 'two'); }
  events.sort((a, b) => (a.atMs ?? Infinity) - (b.atMs ?? Infinity));
  const tracks = tr ? { ms: [...tr.ms], me: [...tr.me], two: [...tr.two], live: Object.fromEntries(Object.entries(tr.live ?? {}).map(([k, v]) => [k, [...v]])) } : { ms: [], me: [], two: [], live: {} };
  return {
    walls, doors, stands, tracks, events, from: tr?.ms?.[0] ?? null, goAtMs: H.goAtMs, endAtMs: H.end?.atMs ?? null, me: playerId(state), tier: H.tier,
    legs: legs.map((L, k) => ({ k, word: LEG_WORD[k] ?? `LEG ${k + 1}`, room: L.room, door: L.door, fromMs: L.fromMs, clearAtMs: L.clearAtMs, parMs: L.parMs ?? null, state: L.state })),
    hot: legs.flatMap((L, k) => (plan.plans[L.door]?.hot ?? []).map(h => ({ leg: k, id: h.id, x: h.x, z: h.z, covered: !!L.covered?.[h.id] }))),
  };
}
