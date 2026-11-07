// OLYMPUS sim: the turning targets of the 25 m bay, their record and their facing as a closed form (COMBAT §25.10.2, §25.10.3; the build sheet 0.0.8 §2.1, §3.1, §8 items 2, 4, 14).
//
// A turner is a man-target on a stand in front of a bay frame (PLACES §4.12: x 1124.0 on each lane's axis), its
// face hung by the scene: a threat with a painted rifle or pistol, a no-shoot with its hands or a phone, or the
// armoured silhouette whose plates ring (the scene's draw). It faces the line in TURN_MS 0.3 s on the scene's
// seeded timer and turns away again when its hit sensor says it is down or the string ends. The record is the
// session's (state.armoury.range.turners, written by the scene through turnTo and turnAway, read by the
// detector, the shot, the stage and the scene alike: this module is their contract):
//     { key: 'turner:<lane>', lane, x, z, y (the face's centre), face: 'threat' | 'noshoot' | 'armoured' |
//       'unknown', holds: 'rifle' | 'pistol' | 'hands' | 'phone', turnAtMs, awayAtMs, hits: [...], stoppedAtMs }
// Times are absolute game ms on whole ticks; positions to 0.01 m.
//
// facingOf(T, ms) is the facing as a closed form, so the picture and the sim read the same number at any
// moment and a save carries nothing of it: edge-on 0 before turnAtMs, then sin(π/2 × k) over TURN_MS to 1
// (facing); from awayAtMs back to 0 as 1 − sin(π/2 × k_away), the lesser of the two taken (a turn away begun
// mid-turn never jumps up). Rounded to 1e-6 (TECH §8.1 rule 11: sin may differ in its last bit between
// engines), so the detector's SEEN 0.5 is crossed on the same tick everywhere: 100 ms after the turn begins
// (sin(π/6) is 0.5), the turner's first 0.1 s being the motor's, not the marine's (the build sheet's §8 item 2).
// edgeOnMs(T) is when a turn away falls below SEEN (awayAtMs + 100). turnerTargets(state, ms) is the bay's
// turners as targets ({ key, kind: 'turner', lane, name, x, y, z, face, holds, facingK, down }), the list
// shooting.js targetsOf and the detector read.
// Pure but turnTo and turnAway, which write the record's times.
import { onTick } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { SEEN } from '../people/perception.js';

/** A turn's length, either way (COMBAT §25.10.2: "turners that face in 0.3 s"). */
export const TURN_MS = 300;
/** The target key of a lane's turner. */
export function turnerKey(lane) { return `turner:${lane}`; }
/** The lane of a turner's key, or null. */
export function laneOfKey(key) { const m = /^turner:(\d+)$/.exec(key ?? ''); return m ? Number(m[1]) : null; }

/** The session's turners (the scene's record), or none. */
export function turnersOf(state) { return state?.armoury?.range?.turners ?? []; }
/** A turner by its key, or null. */
export function turnerOf(state, key) { return turnersOf(state).find(T => T.key === key) ?? null; }

/** The facing of a turner at ms, 0 edge-on to 1 facing (see the header). */
export function facingOf(T, ms) {
  if (!T || T.turnAtMs === null || T.turnAtMs === undefined || ms < T.turnAtMs) return 0;
  const kIn = Math.min(1, (ms - T.turnAtMs) / TURN_MS);
  let f = Math.sin(Math.PI / 2 * kIn);
  if (T.awayAtMs !== null && T.awayAtMs !== undefined && ms >= T.awayAtMs) {
    const kOut = Math.min(1, (ms - T.awayAtMs) / TURN_MS);
    f = Math.min(f, 1 - Math.sin(Math.PI / 2 * kOut));
  }
  return q(Math.max(0, Math.min(1, f)), 1e-6);
}

/** When a turner's turn away falls below SEEN (a closed form of facingOf's away half), or null when it is not turning away. */
export function edgeOnMs(T) {
  if (!T || T.awayAtMs === null || T.awayAtMs === undefined) return null;
  return T.awayAtMs + Math.round(TURN_MS * (2 / Math.PI) * Math.asin(1 - SEEN));
}
/** When a turner first faces at SEEN (turnAtMs + 100), or null. */
export function seenAtMs(T) {
  if (!T || T.turnAtMs === null || T.turnAtMs === undefined) return null;
  return T.turnAtMs + Math.round(TURN_MS * (2 / Math.PI) * Math.asin(SEEN));
}

/** The turn to face the line begun at atMs (whole ticks), any turn away forgotten. Returns T. */
export function turnTo(T, atMs) {
  T.turnAtMs = onTick(atMs);
  T.awayAtMs = null;
  return T;
}
/** The turn away begun at atMs (whole ticks). Returns T. */
export function turnAway(T, atMs) {
  if (T.turnAtMs === null || T.turnAtMs === undefined) return T;
  T.awayAtMs = Math.max(T.turnAtMs, onTick(atMs));
  return T;
}

/** The bay's turners as targets at ms (see the header). */
export function turnerTargets(state, ms = state.clock.ms) {
  return turnersOf(state).map(T => ({
    key: T.key, kind: 'turner', lane: T.lane, name: `the target, lane ${T.lane}`, x: T.x, y: T.y ?? 1.35, z: T.z, face: T.face, holds: T.holds,
    facingK: facingOf(T, ms), down: T.stoppedAtMs !== null && T.stoppedAtMs !== undefined,
  }));
}
