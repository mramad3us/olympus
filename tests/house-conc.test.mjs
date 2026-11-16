// OLYMPUS tests: the practice concussion in "Stack and clear" (kit2 §2.4, §6 test 29; the build sheet 0.0.19 §0 item 5, §6): room 3 concussed, its man stunned, the hostage card's 9.3 kPa (from room 3's centre) under the eardrum's 34.5, no fault; room 2's no-shoot injured by one thrown at its centre.
//
// The sergeant by the honest kit bot (use 'conc'), told room 3 is hostiles only (a concussion is fair where the brief allows a
// grenade); each fails without the read's blast or the 'concussed' rule.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { EARDRUM_KPA, fragLine } from '../src/sim/combat/practice.js';
import { STUN_KPA, peakKPa } from '../src/sim/arms/blast.js';

export default [
  {
    name: '"Concuss, clear the room" in room 3: 3a stunned (the read\'s stun its daze, the turn waiting on it), the hostage card under the eardrum\'s 34.5 kPa and untouched, never a fragment, no fault, the lane to its card',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'conc' }), s = g.state, H = s.armoury.range.house, said = [];
      H.intel = { 'o:w4:r1': 'unknown', 'o:w4:r2': 'unknown', 'o:w4:r3': 'hostiles' };
      g.bus.on?.('say', (f) => said.push(f.text));
      const r = runHouse(g, houseKitBot({ use: 'conc' }), { maxMs: 10 * 60_000 });
      const B = H.bursts.find(b => b.model === 'g13p'), st = (k) => Object.values(B?.read?.stands ?? {}).find(v => v.stand === k), a3 = s.armoury.range.turners.find(t => t.stand === '3a');
      const row = runSheetOf(s).rows.find(x => x.room === 'w4.r3')?.words ?? '';
      // (from room 3's centre, the sheet's figure: the hostage card at 9.3 kPa, the line clear through the bend's doorway)
      const hc = Math.hypot(22.5 - 17.5, 6.4 - 8.6), line = fragLine(s, s.places.live.area, [17.5, 8.6], [22.5, 6.4]), centre = peakKPa(0.23, hc, 66) * (line.wall || line.through.length ? 0.5 : 1);
      console.log(`      the burst at ${B?.x}, ${B?.z} (${B?.thrown}); 3a ${JSON.stringify(st('3a'))}, its daze to +${fmt(((a3.dazeUntilMs ?? 0) - B.atMs) / 1000, 2)} s; the hostage card ${JSON.stringify(st('3b'))} (from the room's centre ${fmt(centre, 1)} kPa through the bend's doorway, the room ${B.read.kPaRoom}); "${said.find(t => t === 'Concussion out!')}"`);
      console.log(`      ${row}; the end ${H.end?.why}`);
      assert(r.done && H.end?.why === 'clear' && B?.thrown === 'o:w4:r3' && st('3a').stunMs > 0 && st('3a').kPa >= STUN_KPA && a3.dazeUntilMs >= B.atMs + st('3a').stunMs, JSON.stringify({ end: H.end, a: st('3a'), daze: a3.dazeUntilMs }));
      assert(st('3b').kPa < EARDRUM_KPA && !B.read.concussed.length && Object.values(B.read.stands).every(x => x.n === 0) && !H.rooms[2].faults.length && said.includes('Concussion out!'), JSON.stringify({ b: st('3b'), f: H.rooms[2].faults }));
      assert(Math.abs(centre - 9.3) < 0.2, `the hostage from room 3's centre ${centre}`);
    },
  },
];
