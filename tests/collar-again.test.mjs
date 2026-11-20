// OLYMPUS tests: the boarding's end card's three ways on (the build sheet v0.0.27 §1 D, item 1, §6 D's heavy collar-again; §14 item 23).
//
// "Again" is the same seed and the same holdouts (main.js's Again passes R.house.boarding.type as &holdouts=, shoothouse.js againAsHouse
// keeps it for "Again as …"), "Again as …" each of the six sheets on that seed and those holdouts to its card, and "Another hauler" (the
// scene's newSeed: the end card's second line, ui/cards/end.js) a new seed drawing anew. Heavy: seven lanes to the card.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { againAsHouse, HOUSE_SHEETS } from '../src/sim/scenarios/shoothouse.js';
import { SCENES } from '../src/data/scenes.js';
import { collarLane } from './bots/collar.mjs';

export default [
  {
    name: '"Again" the same holdouts, "Again as …" each of six sheets to the card on them, "Another hauler" a new draw',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const first = collarLane(createGame, { tier: 'private', seed: 48213, bot: 'keys' }), B0 = first.game.state.armoury.range.house.boarding;
      const rows = [`the first: ${first.type} (${B0.code}), ${first.end}`];
      const again = createGame({ scenario: 'test-collar', seed: 48213, tier: 'private', holdouts: B0.code });
      assert(again.state.armoury.range.house.boarding.code === B0.code, 'Again: the same holdouts');
      for (const tier of HOUSE_SHEETS) {
        const a = againAsHouse(first.game.state, tier);
        assert(a.scenario === 'test-collar' && a.seed === 48213 && a.holdouts === B0.code, JSON.stringify(a));
        const r = collarLane(createGame, { tier: a.tier, seed: a.seed, bot: tier === 'recruit' || tier === 'private' ? 'keys' : 'T', holdouts: a.holdouts });
        rows.push(`again as ${tier}: ${r.game.state.armoury.range.house.boarding.code}, ${r.end} ${r.laneS} s`);
        assert(r.done && r.game.state.armoury.range.house.boarding.code === B0.code, rows.at(-1));
      }
      const codes = new Set([B0.code]);
      for (const seed of [48214, 48215, 48216, 48217]) codes.add(createGame({ scenario: 'test-collar', seed, tier: 'private' }).state.armoury.range.house.boarding.code);
      rows.push(`"${SCENES['test-collar'].newSeed[0]}" on four new seeds: ${codes.size - 1} new draws (${[...codes].join(' | ')})`);
      for (const r of rows) console.log(`      ${r}`);
      assert(codes.size > 1 && SCENES['test-collar'].newSeed[0] === 'Another hauler', 'a new draw');
    },
  },
];
