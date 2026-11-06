// OLYMPUS sim: what the player is doing now, read from the activity record by the body, the stage, the hud and the feet (TIME §8; the build sheet 0.0.4 §2.2.1).
//
// An activity under way is state.time.doing (src/sim/time/activities.js writes it when it starts and
// closes it when it ends):
//     { activity, spotId, mode: 'live' | 'ff' | 'outcome', fromMs, toMs,
//       parts: [{ part, toMs }], from: { outfit, x, z, face }, args }
// each part spanning from the one before's end (fromMs for the first) to its own toMs, every end but
// the last on its first whole second (the activity-part events sit there, and an outcome step ends on
// them), the last at toMs. activityNow(state, ms) reads which part runs at ms and what it asks of the
// body, from src/data/activities.js: { id, part, met, kind, posture, sleepIntent, wet, inside,
// fixtureId, spotId, fromMs, toMs, k } (k the share of the part done), the same whether the time is
// lived, fast-forwarded or skipped, so the body's load (BODY's segOf), the stage's vignette and the
// hud's strip agree. feetHeld(state) is whether the player's feet stay put this tick (places'
// move.js asks it each tick): while an activity runs (lived, a fast-forward or a skip), while the
// player lies or sits, and while one of their transitions plays (rising, lying down, stepping onto a
// spot, dressing: their actor's trans and dress, src/sim/people/place.js).
// It imports data and core only, so the body and the feet read it without an import cycle.
// Pure.
import { playerActor } from '../../core/ids.js';
import { MIN_MS } from '../../core/clock.js';
import { ACTIVITIES, DRESS_MIN, UNDRESS_K, DRESS_HURRY_K } from '../../data/activities.js';

/** Dressing from one outfit to another, ms (TIME §8.2: UNDRESS_K 0.6 × the one taken off + the one put on: PT kit to utilities 5.2 min), × k (the emergency tempo's DRESS_HURRY_K). */
export const dressMs = (from, to, k = 1) => (from === to ? 0 : Math.round(k * (UNDRESS_K * (DRESS_MIN[from] ?? 0) + (DRESS_MIN[to] ?? 0)) * MIN_MS));
/** The tempo dressing into an outfit takes at ms: DRESS_HURRY_K into utilities while a drill is open (the alarm says "now", TIME §8.2's emergency tempo), else 1. */
export const dressTempo = (state, to, ms = state?.clock?.ms) => {
  const d = state?.time?.drills?.open;
  return d && to === 'utilities' && ms >= d.atMs && ms < d.endMs ? DRESS_HURRY_K : 1;
};

const fixtureOfSpot = (spotId) => (typeof spotId === 'string' && spotId.includes('#') ? spotId.slice(0, spotId.lastIndexOf('#')) : null);

/** The activity record of an id (src/data/activities.js), or null. */
export const activityOf = (id) => ACTIVITIES[id] ?? null;

/** The part of the activity under way at ms and its load, or null (see the header). */
export function activityNow(state, ms = state?.clock?.ms) {
  const d = state?.time?.doing;
  if (!d) return null;
  const rec = ACTIVITIES[d.activity];
  const parts = d.parts ?? [];
  let i = 0;
  while (i < parts.length - 1 && ms >= parts[i].toMs) i++;
  const p = parts[i], from = i === 0 ? d.fromMs : parts[i - 1].toMs, to = p?.toMs ?? d.toMs;
  const def = rec?.parts?.find(x => x.part === p?.part) ?? rec?.parts?.[0] ?? {};
  const k = to > from ? Math.max(0, Math.min(1, (ms - from) / (to - from))) : 1;
  return {
    id: d.activity, part: p?.part ?? null, met: def.met ?? 1.5, kind: def.kind ?? 'still', posture: def.posture ?? 'stand',
    sleepIntent: !!def.lie, wet: !!def.wet, inside: !!def.inside, fixtureId: fixtureOfSpot(d.spotId), spotId: d.spotId ?? null,
    fromMs: from, toMs: to, k, index: i, mode: d.mode,
  };
}

/** Whether one of an actor's transitions (trans, dress) plays at ms. */
export const transPlaying = (a, ms) => !!a && ((a.trans && ms < a.trans.fromMs + a.trans.ms) || (a.dress && ms < a.dress.fromMs + a.dress.ms));

/** Whether the player's feet are held this tick (see the header). */
export function feetHeld(state) {
  if (!state) return false;
  if (state.skip || state.time?.doing) return true;
  const me = playerActor(state);
  if (!me) return false;
  const posture = me.posture ?? 'stand';
  return posture === 'lie' || posture === 'sit' || transPlaying(me, state.clock.ms);
}
