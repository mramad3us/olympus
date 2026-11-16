// OLYMPUS tests: the lane's due (shoothouse.js stall, legDueMs; COMBAT §25.10; 2026-11-16, my call; the gauges' F14).
//
// The stall alone has no upper bound: "Move on." STALL_MS 60 s after the last progress and the leg passed STALL_MORE_MS 30 s
// after the words, so every leg is at least 90 s and each look or round before the words buys 60 s again. On v0.0.20's
// integration the fuzz private on seed 1111 ran legs of 148, 153, 227 and 72 s to the lane's 600 s ('time', F14), and the
// fuzz recruit sat at 598.1 s. The due: with n legs after the current one, the leg is due LANE_MAX_MS − LANE_KEEP_MS −
// n × LEG_LAST_MS from GO (450, 495, 540 and 585 s), "Move on." STALL_MORE_MS before it and the leg passed with 'time' at it,
// so a lane ends by 585 s by construction. Three lanes:
//   (1) the hall's leg with GO moved 560 s back, the private out of stop motion pressing nothing: "Move on." at once, the leg
//       passed at 585 s, the lane 'passed' (without the due: 'time' at 600 s and no words, the stall's 60 s not yet lived);
//   (2) room 1 at 420 s from GO, nobody pressing: each leg passed at its own due, 450, 495, 540 and 585 s (without: room 1
//       passed at 510 s, room 2 at the lane's 600 s, 'time');
//   (3) the honest boot recruit (T alone) on the user's seed 1489397426 from the fill to the card: the due never meets it, its
//       last tick the house pin's own (tests/house-pin.test.mjs PIN), the lane well inside its legs' dues.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { botOf } from './flawless.mjs';
import { PIN } from './house-pin.test.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { houseNow, legDueMs, LANE_MAX_MS, LANE_KEEP_MS, LEG_LAST_MS, STALL_MORE_MS } from '../src/sim/scenarios/shoothouse.js';

const choosing = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose';
// (a marine who presses nothing: out of stop motion at each choice, Wait where X is not offered)
const idle = (state) => {
  if (!choosing(state)) return {};
  const rows = stepsOf(state), on = (id) => rows.some(r => r.id === id && !r.off);
  return on('leave') ? { act: [stepAct('leave')] } : on('wait') ? { act: [stepAct('wait')] } : {};
};

// (a lane from setup with GO moved back by backS, played by the idle marine to the range's end: the words and the legs' ends, s from GO)
function backLane(setup, backS) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup }), H = g.state.armoury.range.house;
  H.goAtMs -= backS * 1000; H.stallAtMs = g.state.clock.ms;
  const said = [], ended = [], seen = new Set(), from = (t) => (t - H.goAtMs) / 1000;
  const r = runHouse(g, idle, { maxMs: 12 * 60_000, each: (game) => {
    for (const f of game.facts('house')) if (f.phase === 'stall') said.push(from(game.state.clock.ms));
    [...H.rooms, H.hall].forEach((L, k) => { if ((L.state === 'passed' || L.state === 'clear') && !seen.has(k)) { seen.add(k); ended.push({ k, state: L.state, s: from(L.clearAtMs), due: !!L.dueSaid }); } });
  } });
  return { r, H, said, ended, end: H.end ? { why: H.end.why, s: from(H.end.atMs) } : null };
}

export default [
  {
    name: 'the lane\'s due: the hall\'s leg 560 s from GO with nobody pressing hears "Move on." at once and is passed at 585 s, the lane \'passed\' (before: \'time\' at the lane\'s 600 s with no words)',
    timeoutMs: 120_000,
    fn() {
      const { r, said, ended, end, H } = backLane('hall', 560);
      console.log(`      dues ${[0, 1, 2, 3].map(k => fmt((legDueMs(H, k) - H.goAtMs) / 1000, 0)).join(', ')} s (LANE_MAX_MS ${LANE_MAX_MS / 1000} s, LANE_KEEP_MS ${LANE_KEEP_MS / 1000} s, LEG_LAST_MS ${LEG_LAST_MS / 1000} s); "Move on." at ${said.map(s => `${fmt(s, 2)} s`).join(', ') || 'never'}; the hall ${ended.filter(e => e.k === 3).map(e => `${e.state} at ${fmt(e.s, 2)} s${e.due ? ' (due)' : ''}`).join('') || 'not ended'}; the lane ${end?.why} at ${fmt(end?.s, 2)} s`);
      assert(r.done && end?.why === 'passed' && near(end.s, 585) && said.length === 1 && said[0] <= 560.1 && ended.at(-1)?.due, JSON.stringify({ done: r.done, end, said, ended }));
    },
  },
  {
    name: 'the lane\'s due: room 1 at 420 s from GO with nobody pressing has each leg passed at its own due, 450, 495, 540 and 585 s, "Move on." STALL_MORE_MS (30 s) before each, the lane \'passed\' by 585 s (before: room 2 passed by the lane\'s 600 s, \'time\')',
    timeoutMs: 120_000,
    fn() {
      const { r, said, ended, end } = backLane('go', 420);
      console.log(`      "Move on." at ${said.map(s => `${fmt(s, 2)} s`).join(', ')}; legs ${ended.map(e => `${e.k} ${e.state} at ${fmt(e.s, 2)} s${e.due ? ' (due)' : ''}`).join(', ')}; the lane ${end?.why} at ${fmt(end?.s, 2)} s`);
      const dues = [450, 495, 540, 585];
      assert(r.done && end?.why === 'passed' && end.s <= (LANE_MAX_MS - LANE_KEEP_MS) / 1000 + 0.05 && ended.length === 4 && ended.every((e, k) => e.state === 'passed' && e.due && near(e.s, dues[k])) && said.length === 4 && said.every((s, k) => s <= dues[k] - STALL_MORE_MS / 1000 + 0.1), JSON.stringify({ done: r.done, end, said, ended }));
    },
  },
  {
    name: 'the lane\'s due never meets an honest lane: the boot recruit by T alone on the user\'s seed 1489397426, from the fill to the card, ends on the house pin\'s own tick, no leg met by its due',
    timeoutMs: 120_000,
    fn() {
      const seed = 1489397426, g = createGame({ scenario: 'test-shoothouse', seed, tier: 'recruit' });
      const r = runHouse(g, botOf('honest', { seed }), { maxMs: 30 * 60_000 });
      const H = g.state.armoury.range.house, legs = [...H.rooms, H.hall], want = PIN[`honest/recruit/${seed}/standard`][0];
      const margin = legs.map((L, k) => (legDueMs(H, k) - L.clearAtMs) / 1000), N = houseNow(g.state);
      console.log(`      tick ${g.state.clock.tick} (the pin's ${want}); the lane ${N.end?.why} at ${fmt(N.timerMs / 1000, 2)} s; legs ${legs.map(L => L.state).join(', ')}, each ended ${margin.map(m => `${fmt(m, 1)} s`).join(', ')} before its due`);
      assert(r.done && g.state.clock.tick === want && legs.every(L => !L.dueSaid) && margin.every(m => m > 0), JSON.stringify({ done: r.done, tick: g.state.clock.tick, want, margin }));
    },
  },
];

function near(a, b, tol = 0.06) { return Number.isFinite(a) && Math.abs(a - b) <= tol; }
