// OLYMPUS arms: the pits' carriers as everyone reads them, the face's height from the session's pit record at a moment (WEAPONS §11.5; the build sheet 0.0.7 §2.3).
//
// The scene (src/sim/scenarios/range.js onPitEvent) keeps each lane's record on the session, R.pits[lane] =
// { phase: 'up' | 'down' | 'marking' | 'rising', atMs, holes, spotter, disk, flagUntilMs, … }; the height of the
// carrier is never stored: it is the record's phase and the time since atMs, moving over CARRIER_S (never a pop).
// pitView(R, lane, ms) is that view, { up 0..1, phase, spotter, disk, flagUntilMs, holes }, and faceUpAt(R, lane, ms)
// its height alone, so the shot (shooting.js targetsOf, gunner.js gunnerTarget, penetrate.js traceRound) and the
// stage read one number: a face under FACE_DOWN_UP is behind the parapet and a round at it goes into the berm
// (shot.js resolveShot; the reviewers' of v0.0.7: `up` had been read off the record, where it never was, so every
// face counted as up). A face is ready for the next slow-fire shot (markedFor) once its carrier is up again with
// the disk or the flag shown for the shooter's last shot, or nothing is pending on it. Pure.

/** The carrier's travel down or up (s). */
export const CARRIER_S = 2.0;
/** A face whose carrier is under this height is down: the parapet covers it, a round at it goes over into the berm. */
export const FACE_DOWN_UP = 0.5;

/** The pits' view of a lane at ms (see the header): { up, phase, spotter, disk, flagUntilMs, holes }. */
export function pitView(R, lane, ms) {
  const p = R?.pits?.[lane];
  if (!p) return { up: 1, phase: 'up', spotter: null, disk: null, flagUntilMs: null, holes: [] };
  const k = Math.max(0, Math.min(1, (ms - p.atMs) / (CARRIER_S * 1000)));
  const up = p.phase === 'up' ? 1 : p.phase === 'down' ? 1 - k : p.phase === 'marking' ? 0 : k;
  return { up: Math.round(up * 1000) / 1000, phase: p.phase, spotter: p.spotter ?? null, disk: p.disk && p.disk.untilMs > ms ? { ...p.disk } : null, flagUntilMs: p.flagUntilMs ?? null, holes: p.holes ?? [] };
}

/** A face's carrier height at ms, 0 (down in the pits) to 1 (up): pitView's, 1 off the KD course. */
export const faceUpAt = (R, lane, ms) => pitView(R, lane, ms).up;

/** Whether a lane's face is down (under FACE_DOWN_UP) at ms. */
export const faceDownAt = (R, lane, ms) => faceUpAt(R, lane, ms) < FACE_DOWN_UP;

/**
 * Whether a slow-fire shooter's face is ready for their next shot at ms: the carrier up, and no shot of
 * theirs waiting in the pits (posted but not yet marked: R.shots' `marked` unset for a shot fired at the face
 * in this string). shotIds are the shooter's shots at the face so far this string.
 */
export function markedFor(R, lane, ms, shotIds = []) {
  const v = pitView(R, lane, ms);
  if (v.phase !== 'up') return false;
  const p = R?.pits?.[lane];
  if (p?.pending?.length || p?.next?.length) return false;
  if (!shotIds.length) return true;
  const last = R?.shots?.find(s => s.id === shotIds.at(-1));
  return !last || !!last.marked;
}
