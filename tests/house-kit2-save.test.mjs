// OLYMPUS tests: the second slice's saves (kit2 §6 test 35; the build sheet 0.0.19 §9 item 4): a G-9P cooking in the hand, one on the floor burning, a BC-1 primed, a believed misfire and a breach round's record, each saved, loaded and carried on byte for byte, every item held exactly once and no id dangling (ids-check: `burst`, `door`, `tubeId`).
//
// Each save point is reached by the honest kit bot on its own lane (the misfire from room 2's stack on house-cut's seed, saved the
// tick after its hand-back is answered, the charge on the door primed again by Carry on), the game saved there, run on AFTER ticks,
// and a second game loaded from the save run the same: their digests equal.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { checkIds } from './ids-check.mjs';
import { handDeviceOf, liveDevices } from '../src/sim/arms/devices.js';
import { HANDBACK_WORDS } from '../src/sim/combat/bundle.js';
import { CUT_MISFIRE_SEED } from './house-cut.test.mjs';

const AFTER = 400;
const POINTS = [
  ['a G-9P cooking in the hand', { seed: 48213, loadout: 'frag', use: 'frag' }, (s) => handDeviceOf(s, s.player.id)?.st === 'live'],
  ['a G-9P burning on the floor', { seed: 48213, loadout: 'frag', use: 'frag' }, (s) => liveDevices(s).some(d => d.model === 'g9p' && s.clock.ms >= (s.items[d.id].flight?.landMs ?? Infinity))],
  ['a BC-1 primed', { seed: 48213, loadout: 'cut', use: 'cut' }, (s) => liveDevices(s).some(d => d.model === 'bc1' && d.st === 'primed')],
  // (the misfire saved the tick after its hand-back is answered: at the hand-back itself the clock stands, and the DI's line memory
  // is runtime only (instinct.js), so a game loaded at that pause says its line again before T presses: no record of the misfire's)
  ['a believed misfire', { seed: CUT_MISFIRE_SEED, loadout: 'cut', use: 'cut', setup: 'room:2' }, (s) => { const m = s.$misSeen ?? (s.stop?.carry?.words === HANDBACK_WORDS.misfire ? (s.$misSeen = s.clock.tick) : null); return m !== null && s.clock.tick > m && Object.values(s.items).some(x => x.model === 'bc1' && x.st !== 'gone'); }],
  ['a breach round on the record', { seed: 48213, loadout: 'breach', use: 'shoot' }, (s) => (s.armoury.range.house.breach?.['o:w4:closet']?.rounds ?? 0) > 0],
  ['a practice read applied', { seed: 48213, loadout: 'frag', use: 'frag' }, (s) => (s.armoury.range.house.bursts ?? []).some(b => b.read?.applied)],
];

export default [
  {
    name: 'a save with a G-9P cooking in the hand, one burning on the floor, a BC-1 primed, a believed misfire, a breach round and a practice read loads and carries on byte for byte, every item held exactly once and no id dangling',
    timeoutMs: 180_000,
    fn() {
      const rows = [], bad = [];
      for (const [name, o, at] of POINTS) {
        const opts = { scenario: 'test-shoothouse', seed: o.seed, tier: 'sgt', setup: o.setup ?? 'go', loadout: o.loadout };
        const g = createGame(opts), bot = houseKitBot({ use: o.use });
        let n = 0;
        while (n++ < 8000 && !at(g.state)) { g.step(1, bot); g.clearFacts?.(); }
        if (!at(g.state)) { bad.push(`${name}: never reached`); continue; }
        const json = g.save(), ids = checkIds(JSON.parse(json), g.sim.domains), again = (() => { const g3 = createGame(opts); g3.load(json); return g3.save() === json; })();
        for (let i = 0; i < AFTER; i++) { g.step(1, bot); g.clearFacts?.(); }
        const g2 = createGame(opts), bot2 = houseKitBot({ use: o.use });
        g2.load(json);
        for (let i = 0; i < AFTER; i++) { g2.step(1, bot2); g2.clearFacts?.(); }
        const same = g.digest() === g2.digest(), devs = liveDevices(JSON.parse(json)).map(d => `${d.model} ${d.st}`).join(', ') || 'none lying';
        rows.push(`${name} at tick ${JSON.parse(json).clock?.tick ?? '?'} (${devs}): ${ids.checked} ids, ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; saved again ${again ? 'the same' : 'APART'}; ${AFTER} ticks on ${same ? 'the same' : 'APART'}`);
        if (!same || !again || ids.invalid.length || ids.dangling.length || g.errors.length || g2.errors.length) bad.push(`${name}: ${same ? '' : 'apart '}${again ? '' : 'resave '}${[...ids.invalid, ...ids.dangling].slice(0, 3).join('; ')} ${[...g.errors, ...g2.errors].slice(0, 2).join('; ')}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
];
