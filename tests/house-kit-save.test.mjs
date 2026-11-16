// OLYMPUS tests: a save in the middle of the kit's work loads and carries on byte for byte (TECH §13.1; the build sheet 0.0.18 §3.1, §5.3).
//
// The devices are items with one holder each (kit.js): a grenade thrown is held { ground } at once with its flight and its fuse
// as plain data, a charge placed lies at the door's latch with `door` (never `doorId`: the id walk reads every …Id as an entity)
// and its FD-1's `tubeId`. Each test fails if a device's record or the house's bursts are runtime or dangling.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { checkIds } from './ids-check.mjs';
import { handDeviceOf, liveDevices } from '../src/sim/arms/devices.js';

const AFTER = 400;
const POINTS = {
  'armed in the hand': (s) => handDeviceOf(s, s.player.id)?.st === 'armed',
  'a grenade in flight': (s) => liveDevices(s).some(d => d.kind === 'grenade' && s.clock.ms < (s.items[d.id].flight?.landMs ?? 0)),
  'a charge placed': (s) => liveDevices(s).some(d => d.kind === 'charge' && d.st === 'placed'),
  'a charge primed': (s) => liveDevices(s).some(d => d.kind === 'charge' && d.st === 'primed'),
};

export default [
  {
    name: 'a save made with a grenade in flight, one armed in the hand, a charge placed and one primed (the tier one\'s "Charge, flash, clear the room") loads and carries on byte for byte, every item held exactly once and no id dangling',
    timeoutMs: 120_000,
    fn() {
      const opts = { scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', loadout: 'full' }, rows = [], bad = [];
      for (const [name, at] of Object.entries(POINTS)) {
        const g = createGame(opts), bot = houseKitBot({ use: 'both' });
        let n = 0;
        while (n++ < 4000 && !at(g.state)) { g.step(1, bot); g.clearFacts?.(); }
        if (!at(g.state)) { bad.push(`${name}: never reached`); continue; }
        const json = g.save(), ms = g.state.clock.ms - g.state.armoury.range.house.goAtMs, ids = checkIds(JSON.parse(json), g.sim.domains);
        for (let i = 0; i < AFTER; i++) { g.step(1, bot); g.clearFacts?.(); }
        const g2 = createGame(opts), bot2 = houseKitBot({ use: 'both' });
        g2.load(json);
        for (let i = 0; i < AFTER; i++) { g2.step(1, bot2); g2.clearFacts?.(); }
        const same = g.digest() === g2.digest(), devs = liveDevices(JSON.parse(json)).map(d => `${d.model} ${d.st}`).join(', ') || 'none lying';
        rows.push(`${name} at +${(ms / 1000).toFixed(2)} s (${devs}): ${ids.checked} ids, ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; ${AFTER} ticks on ${same ? 'the same' : 'APART'}`);
        if (!same || ids.invalid.length || ids.dangling.length || g.errors.length || g2.errors.length) bad.push(`${name}: ${same ? '' : 'apart '}${[...ids.invalid, ...ids.dangling].slice(0, 3).join('; ')} ${[...g.errors, ...g2.errors].slice(0, 2).join('; ')}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
];
