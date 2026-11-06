// OLYMPUS sim: the alert drill as the view, the hud and the instinct read it: whether one is open, its phase, the horn, and where the player musters (TIME §9.5; the build sheet 0.0.4 §2.2.4).
//
// A drill is open from its klaxon (the 'alert' event, src/sim/time/pod.js) to its stand-down
// ('alert-end'), as time.drills.open = { drill, atMs, dueMs, endMs, counted }. alertNow(state, ms) is
// what the moment looks like: null outside a drill, else { drill, kind: 'drill', atMs, dueMs, endMs,
// phase, hornOn, horn }, the phase 'klaxon' while the horn sounds (ALERT_DRILL.klaxonMs, 45 s, from
// the klaxon), 'muster' until the count is due, 'counted' after it; hornOn alternates every
// KLAXON_CYCLE_MS (1.5 s: the audio's whoop, the stage's red beacon in hall-2) while it sounds. The
// bay's lights stay out (CAREER §5.2: "dressing in night lighting").
// musterOf(state, pid) is where a marine musters this round, the foot of their own rack in utilities
// (the sheet §8, item 4); mustered(state, pid, ms) whether the player stands there now: within
// MUSTER_M 0.6 m of that spot, in utilities, standing (no transition playing) and doing nothing else
// (no activity, no skip) but standing fast (the stand-by at your rack: activities.js 'standfast'). The
// time domain checks it on whole seconds while a drill is open and writes the arrival into
// time.attend (pod.js); the count and the stand-down ask it again at their second.
// Pure.
import { playerActor, playerId } from '../../core/ids.js';
import { seatOf, spotsOf } from '../places/fixtures.js';
import { areaOf } from '../places/model.js';
import { ALERT_DRILL, KLAXON_CYCLE_MS, MUSTER_M } from '../../data/pod.js';

export { MUSTER_M, KLAXON_CYCLE_MS };

/** The drill as the moment shows it, or null (see the header). */
export function alertNow(state, ms = state?.clock?.ms) {
  const d = state?.time?.drills?.open;
  if (!d || !(ms >= d.atMs) || ms >= d.endMs) return null;
  const into = ms - d.atMs;
  const phase = into < ALERT_DRILL.klaxonMs ? 'klaxon' : ms < d.dueMs ? 'muster' : 'counted';
  return { drill: d.drill, kind: 'drill', atMs: d.atMs, dueMs: d.dueMs, endMs: d.endMs, phase,
    hornOn: phase === 'klaxon' && Math.floor(into / KLAXON_CYCLE_MS) % 2 === 0, horn: ALERT_DRILL.horn };
}

// (a rack's foot spot by its berth's seat id, kept: places' data is frozen)
const footMemo = new Map();
/** The foot of the rack a berth (a seat id) is in: its #1 spot { id, x, z, face, area }, or null. */
export function rackFootOf(berthId) {
  if (!berthId) return null;
  if (footMemo.has(berthId)) return footMemo.get(berthId);
  const seat = seatOf(berthId), rack = seat ? areaOf(seat.area)?.fixtures?.find(f => f.id === seat.fixture) : null;
  const sp = rack ? spotsOf(rack)[0] ?? null : null;
  const out = sp ? Object.freeze({ id: sp.id, x: sp.x, z: sp.z, face: sp.face, area: seat.area }) : null;
  footMemo.set(berthId, out);
  return out;
}

/** Where a marine musters for the drill this round: { spotId, x, z, area, outfit: 'utilities' } at their rack's foot, or null. */
export function musterOf(state, pid) {
  const foot = rackFootOf(state?.people?.[pid]?.berthId);
  return foot ? { spotId: foot.id, x: foot.x, z: foot.z, area: foot.area, outfit: 'utilities' } : null;
}

/** Whether the player stands mustered now (see the header). */
export function mustered(state, pid = playerId(state), ms = state?.clock?.ms) {
  if (!state || pid !== playerId(state)) return false;
  const doing = state.time?.doing ?? null;
  if ((state.skip || doing) && doing?.activity !== 'standfast') return false;
  const me = playerActor(state), m = musterOf(state, pid);
  if (!me || !m || state.places?.live?.area !== m.area) return false;
  if ((me.posture ?? 'stand') !== 'stand' || (me.outfit ?? 'utilities') !== 'utilities') return false;
  if (me.trans && ms < me.trans.fromMs + me.trans.ms) return false;
  if (me.dress && ms < me.dress.fromMs + me.dress.ms) return false;
  return Math.hypot(me.x - m.x, me.z - m.z) <= MUSTER_M;
}
