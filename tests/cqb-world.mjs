// OLYMPUS tests: a team meeting a room off the range session, for the hand-off's suites (cqb-anywhere, two-anywhere, cqb-gauges; the build sheet v0.0.21 §1 item 21, §6 D).
//
// cqbWorld(opts) is the shoot house at GO as test-shoothouse's fill makes it (the real headless game: your sheet, your #2 on
// his, both issued and made ready, stacked on room 1 in stop motion), then handed off the range: the range session is taken
// away whole (no tower, no instructor's command, no par, no run sheet, no lane), and an operation is opened on house 1's area
// (src/sim/combat/op.js openOp: state.cqb, with your #2 as its team and the rooms' targets as its turners). The scenario's
// layers sleep without a session, so the world's weapons domain adds the operation's own (src/sim/combat/two.js opInputBefore and
// opInput, the doing seen before the stop layer moves it and your "Clear!" read after, time standing or not; opActors, the #2's slot and eyes; opRules, the devices' bursts, the legs and
// their stall clock, his walks held by a body), as a scene that opens an operation would.
// The turners are the lane's records for the rooms asked (room 1's two by default; null: every room's), facing away: off the
// range nothing turns them by itself (their trigger is the house's to read, and the house sleeps), so the drill meets an empty
// room until a test turns one (turn, or tests/flawless-op.mjs opLane, which turns each at its own trigger as the house would). Nothing here is the lane's:
// what moves is the drill, the team and the breach on a room plan, as the hand-off asks ("this mission is our pilot for
// everything else that matters", the user, 2026-11-11).
import { createGame } from './game.mjs';
import { weaponsDomain } from '../src/sim/arms/domain.js';
import { openOp } from '../src/sim/combat/op.js';
import { opActors, opRules, opInputBefore, opInput } from '../src/sim/combat/two.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { turnTo } from '../src/sim/arms/turners.js';

/** The weapons domain with the operation's layers added to its own (they do nothing on a range session or with no operation open): opInputBefore and opInput round its input, opActors and opRules after its actors and rules. */
export const OP_WEAPONS = Object.freeze({ ...weaponsDomain, fast: Object.freeze({ ...weaponsDomain.fast,
  input: (s, i, b, c) => { opInputBefore(s); weaponsDomain.fast.input(s, i, b, c); opInput(s, i, b); },
  actors: (s, i, b, c) => { weaponsDomain.fast.actors(s, i, b, c); opActors(s, i, b); },
  rules: (s, i, b, c) => { weaponsDomain.fast.rules(s, i, b, c); opRules(s, i, b); } }) });

/**
 * The fixture (see the header). opts: { seed (48213), tier ('sgt'), two (true: your #2 in the team; false: alone, his body
 * left where he stands), rooms (the lane's room ids whose turners the operation sets up: ['w4.r1']; null every room's), loadout
 * (test-shoothouse's), draw (test-shoothouse's: 'drawn' hands off the house drawn from the seed, its area and its men) }.
 * Returns { g, s, pid, twoPid, op (state.cqb), plans (the area's room plans), T(stand) (a turner of the operation), turn(stand, atMs) }.
 */
export function cqbWorld({ seed = 48213, tier = 'sgt', two = true, rooms = ['w4.r1'], loadout = null, draw = null } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', domains: { weapons: OP_WEAPONS }, ...(loadout ? { loadout } : {}), ...(draw ? { draw } : {}) });
  const s = g.state, R = s.armoury.range, H = R.house, area = R.area;
  const turners = R.turners.filter(T => !rooms || rooms.includes(T.room)).map(T => ({ ...structuredClone(T), turnAtMs: null, awayAtMs: null }));
  const twoPid = two ? H.twoPid : null;
  // (the hand-off: the range session gone whole, the house's events with it; the place, the people and their kit stay)
  delete s.armoury.range;
  s.events = (s.events ?? []).filter(e => !String(e.kind ?? '').startsWith('range') && !String(e.kind ?? '').startsWith('house'));
  const op = openOp(s, { area, team: two ? { two: twoPid } : null, turners });
  return { g, s, pid: s.player.id, twoPid, op, plans: lanePlanOf(s), T: (stand) => s.cqb.turners.find(t => t.stand === stand) ?? null, turn: (stand, atMs = s.clock.ms) => turnTo(s.cqb.turners.find(t => t.stand === stand), atMs) };
}
