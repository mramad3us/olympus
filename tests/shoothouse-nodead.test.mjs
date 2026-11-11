// OLYMPUS tests: test-shoothouse never dead-ends (the user, 2026-11-07: "a scene never dead-ends"; the build sheet 0.0.12 §5.3, §8 item 29).
//   - the fuzz shooter (tests/bots/house.mjs houseFuzzBot: rows at random, X and the keys through windows, T's bundles and
//     Backspace at random, never a round fired, the dummy never cleared, "Clear!" never called, the inner door left, a
//     doorway stood in) reaches the card on 30 runs, five a sheet, within 30 game minutes;
//   - a marine who stands still after X: each leg's "Move on." at STALL_MS, then the leg passed with the fault 'time'
//     STALL_MORE_MS later, the lane over, the instructor's move-on clearing his rifle, the card;
//   - the safety stop: an aim at your number two is the range's 'person' stop, "Cease fire! Cease fire!", the card.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseFuzzBot, runHouse } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { houseNow, STALL_MS, STALL_MORE_MS } from '../src/sim/scenarios/shoothouse.js';

const SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);

export default [
  {
    name: 'the fuzz shooter reaches the card on 30 runs, five a sheet, within 30 game minutes: never firing, never clearing the dummy, never calling "Clear!", the stalls moving the lane on',
    heavy: true,   // (30 whole lanes: out of the quick suite, held to 60 s; in the full suite and every release)
    timeoutMs: 300_000,
    fn() {
      const bad = [];
      for (const [k, tier] of SHEETS.entries()) for (let i = 0; i < 5; i++) {
        const seed = 500 + k * 100 + i, g = createGame({ scenario: 'test-shoothouse', seed, tier });
        const r = runHouse(g, houseFuzzBot({ seed }), { maxMs: 30 * 60_000 });
        const N = houseNow(g.state), kinds = {};
        for (const f of N.faults) kinds[f.kind] = (kinds[f.kind] ?? 0) + 1;
        const top = Object.entries(r.mem.steps ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id, n]) => `${id} ${n}`).join(', ');
        console.log(`      ${tier.padEnd(8)} ${seed}: ${r.done ? 'card' : 'NO CARD'} in ${fmt(r.ms / 60_000, 1)} min (${N.rangeEnd?.phase}${N.end ? `, the lane ${N.end.why}` : ''}); legs ${N.legs.map(V => V.state).join(' ')}; faults ${JSON.stringify(kinds)}; most pressed ${top}`);
        if (!r.done || r.ms > 30 * 60_000) bad.push(`${tier} ${seed}`);
      }
      assert(!bad.length, `no card: ${bad.join(', ')}`);
    },
  },
  {
    name: 'a marine who stands still after X: "Move on." at 60 s in each leg, the leg passed with \'time\' 30 s later, the lane over and the card',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), stalls = [];
      let pressed = false;
      const still = (state) => { if (!pressed && state.stop?.mode === 'stop' && state.stop.phase === 'choose') { pressed = true; return { act: [stepAct('leave')] }; } return {}; };
      const r = runHouse(g, still, { maxMs: 20 * 60_000, each: (game) => { for (const f of game.facts('house')) if (f.phase === 'stall') stalls.push(f.atMs); } });
      const N = houseNow(g.state), go = g.state.armoury.range.house.goAtMs;
      console.log(`      stalls at ${stalls.map(t => `${fmt((t - go) / 1000, 0)} s`).join(', ')}; legs ${N.legs.map(V => `${V.state} ${fmt(V.ms / 1000, 1)} s`).join(', ')}; faults ${N.faults.map(f => f.kind).join(', ')}; the card at ${fmt(r.ms / 60_000, 1)} min (${N.rangeEnd?.phase}, the lane ${N.end?.why})`);
      assert(r.done && N.legs.every(V => V.state === 'passed') && N.faults.filter(f => f.kind === 'time').length === 4, JSON.stringify({ legs: N.legs.map(V => V.state), faults: N.faults.map(f => f.kind) }));
      assert(stalls.length === 4 && N.legs.every(V => Math.abs(V.ms - STALL_MS - STALL_MORE_MS) <= 50), JSON.stringify({ stalls, ms: N.legs.map(V => V.ms) }));
    },
  },
  {
    name: 'the safety stop: an aim at your number two is the range\'s \'person\' stop, "Cease fire! Cease fire!", and the card',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), H = g.state.armoury.range.house;
      const two = g.state.actors.list.find(a => a.who === H.twoPid);
      let said = null;
      const r = runHouse(g, (state) => (state.stop?.mode === 'stop' && state.stop.phase === 'choose' && !state.stop.aim ? { act: [stepAct('aim', 'normal', two.id)] } : {}), {
        maxMs: 60_000, each: (game) => { for (const f of game.facts('say')) if (/Cease fire/.test(f.text)) said = f.text; },
      });
      const R = g.state.armoury.range;
      console.log(`      the stop: ${JSON.stringify(R.end)}; the instructor: "${said}"; ${houseNow(g.state).summary}`);
      assert(r.done && R.end?.phase === 'stopped' && R.end.why === 'person' && said, JSON.stringify(R.end));
    },
  },
];
