// OLYMPUS tests: a small bay of turners for the take-in's suites (react, contact, react-save, ident): the real game in node on the 25 m bay, the player on a 7 m or 10 m point with a test sheet, six turners edge-on before the frames.
//
// bayGame(opts) stands in for the scene role's test-pairs (the build sheet 0.0.8 §1: a small local fixture where
// another role's output is needed, said): it starts test-handling on a seed (the 25 m bay of X3, its course
// running, the R-7 issued), writes the test sheet of a tier on the player (templates.js testSheet), puts the
// player on lane LANE's 7 m or 10 m point (x 1117.0 or 1114.0, the build sheet's §2.3 PAIRS lines) facing
// downrange at low ready, and hangs a turner record on the session in front of each of the six frames (x 1124.0,
// the lane's z, edge-on: turners.js's shape, what the scene's fill writes). The detector reads only those; the
// course's own commands carry on beside it (the brief, the coach's words), harmless to the take-in. The point is
// off the 25 m line's box, so range safety warns at once and would stop the line after OUT_GRACE_S 8 s: each
// test turns its turners within a second of the move and is over in a few. turn(g, lanes, atMs) turns turners;
// runTo(g, pred, input, max) steps until pred(state).
import { createGame } from './game.mjs';
import { testSheet } from '../src/sim/skills/templates.js';
import { KD_RANGE } from '../src/data/places/range.js';
import { turnTo, turnerKey } from '../src/sim/arms/turners.js';

/** The lane the fixture's player stands on, the lines' x (the build sheet's §2.3), the turners' x. */
export const LANE = 4, LINE_X = Object.freeze({ 7: 1117.0, 10: 1114.0 }), TURNER_X = 1124.0;
/** A lane's z on the bay. */
export const laneZ = (lane) => KD_RANGE.bay.lanes.find(l => l.lane === lane).fp.z;

/** The fixture (see the header): { g, state, pid, me, R, t0 }. opts: seed, tier, line (7 or 10), lane, faces ({ lane: face }), holds ({ lane: holds }), posture, settle (ticks first). */
export function bayGame({ seed = 48213, tier = 'private', line = 7, lane = LANE, faces = {}, holds = {}, posture = 'lowReady', settle = 4 } = {}) {
  const g = createGame({ scenario: 'test-handling', seed });
  const s = g.state, pid = s.player.id, me = g.me(), R = s.armoury.range;
  s.people[pid].skills = testSheet(tier);
  me.x = LINE_X[line]; me.z = laneZ(lane); me.face = 'right';
  s.people[pid].kit.carry.posture = posture;
  R.turners = KD_RANGE.bay.lanes.map(l => ({ key: turnerKey(l.lane), lane: l.lane, x: TURNER_X, z: l.fp.z, y: 1.35, face: faces[l.lane] ?? 'threat',
    holds: holds[l.lane] ?? ((faces[l.lane] ?? 'threat') === 'noshoot' ? 'hands' : 'rifle'), turnAtMs: null, awayAtMs: null, hits: [], stoppedAtMs: null }));
  g.step(settle);
  return { g, state: s, pid, me, R, t0: s.clock.ms };
}

/** Turn the given lanes' turners to face at atMs (the scene's turnTo). */
export function turn(g, lanes, atMs = g.state.clock.ms) {
  for (const l of lanes) turnTo(g.state.armoury.range.turners.find(T => T.lane === l), atMs);
}

/** Step until pred(state) (checked after each tick), at most max ticks. Returns the ticks stepped. */
export function runTo(g, pred, input = {}, max = 400) {
  let n = 0;
  while (n < max && !pred(g.state)) { g.step(1, typeof input === 'function' ? input(g.state, n) : input); n++; }
  return n;
}
