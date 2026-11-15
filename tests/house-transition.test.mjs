// The boot recruit and the private who answer the click with Transition: pistol, now that every sheet carries the P-12 (the
// play review of 2026-11-15): below rung 2 the DI's answer at the card is Tap, rack, what training teaches first ("He's close.
// Pistol." led them into a loop of P-12 head shots at Marksmanship 10); a dry gun's line is RELOAD with its row, Rifle up where
// the pistol has nothing left (the shot lines named a head row the panel lacked: "Plate. Go to the head.", act and row null);
// with the chamber a question after Rifle up the line is the press check; every stop's line names a row the panel has (F24), and
// every lane reaches its card (F20's "the lanes ended live").
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseKeysBot, runHouse } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { flawlessSeeds } from './flawless.mjs';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { houseNow } from '../src/sim/scenarios/shoothouse.js';
import { gunOn } from '../src/sim/arms/shooting.js';
import { beliefOf } from '../src/sim/arms/firearms.js';

// (one lane by the keys, the card answered with Transition where it is offered: the DI's answer at each card, the stops whose
// line names no row, the stops at a shot line on a dry gun)
function transitionLane(tier, seed) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), base = houseKeysBot();
  const out = { tier, seed, cards: 0, diIa: 0, transitions: 0, mute: [], dryShot: 0, reloadRow: 0 };
  let lastMs = null;
  const bot = (state, me, mem) => {
    const S = state.stop, L = instinctNow(state).line;
    if (S?.reflex && S.reflex.atMs !== lastMs) {
      lastMs = S.reflex.atMs; out.cards++;
      if (L?.act === 'stop:reflex:ia') out.diIa++;
      if (S.reflex.options.some(o => o.key === 'transition' && !o.off)) { out.transitions++; return { act: [stepAct('reflex:transition')] }; }
    }
    if (S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && state.clock.ms !== lastMs) {
      lastMs = state.clock.ms;
      const b = beliefOf(state, gunOn(state, state.player.id));
      if (L && !L.act && !L.row) out.mute.push(`${L.id} "${L.text}"`);
      if (L && /^cqb-(still-up|hostage|contact)$/.test(L.id) && b?.locked) out.dryShot++;
      if (L?.id === 'cqb-reload' && L.row) out.reloadRow++;
    }
    return base(state, me, mem);
  };
  const r = runHouse(g, bot, { maxMs: 12 * 60_000 });
  return { ...out, done: r.done, why: houseNow(g.state)?.end?.why ?? null, s: r.ms / 1000 };
}

export default [
  {
    name: 'the boot recruit and the private answering Transition at the click (the play review of 2026-11-15): the DI\'s own answer is Tap, rack below rung 2; no stop\'s line names no row (F24), none names a shot on a dry gun, RELOAD and Rifle up named with their rows, and every lane reaches its card (F20)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const runs = [];
      for (const tier of ['recruit', 'private']) for (const seed of flawlessSeeds(4)) runs.push(transitionLane(tier, seed));
      for (const r of runs) console.log(`      ${r.tier} ${r.seed}: ${r.done ? `the card (${r.why}) at +${fmt(r.s, 1)} s` : 'NO CARD'}; cards ${r.cards}, the DI's answer Tap, rack at ${r.diIa}, Transition pressed ${r.transitions}; lines naming no row ${r.mute.length}${r.mute.length ? ` (${r.mute.slice(0, 2).join('; ')})` : ''}; a shot line on a dry gun ${r.dryShot}; RELOAD's line with its row ${r.reloadRow}`);
      assert(runs.some(r => r.transitions > 0), 'no lane reached a card with Transition: the check covers nothing');
      for (const r of runs) {
        assert(r.done, JSON.stringify({ tier: r.tier, seed: r.seed, why: r.why, s: r.s }));
        assert(r.diIa === r.cards, JSON.stringify({ tier: r.tier, seed: r.seed, cards: r.cards, diIa: r.diIa }));
        assert(!r.mute.length && !r.dryShot, JSON.stringify({ tier: r.tier, seed: r.seed, mute: r.mute.slice(0, 4), dryShot: r.dryShot }));
      }
    },
  },
];
