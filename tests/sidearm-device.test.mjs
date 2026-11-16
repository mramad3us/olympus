// OLYMPUS tests: no draw into a hand that holds a device (sidearm.js weaponList's guard; the team's review of v0.0.19, finding 7).
//
// The fixture tests/topup-crash.json.gz is the review's own save: the boot recruit on the 'full' loadout, seed 48006, the team's
// fuzz seed 6, his armed G-11 (i24) in hand 0 on the lane. Before the guard the P-12's "Top up" (weapon:other:topup: hang, the
// thigh's draw, the magazine to the pouch, reach, seat, holster, up) was offered there, and its press threw in kit.move ("hand 1
// holds i19"). With the guard the row is not offered and a press of it is refused: the hands hold the G-11 and nothing else.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { weaponList } from '../src/sim/arms/sidearm.js';

export default [
  {
    name: 'with an armed G-11 in the hand the P-12\'s Top up and Transition are not offered, and a press of Top up is refused with no throw: the hands still hold the grenade alone (the team\'s review of v0.0.19, finding 7: the press threw in kit.move)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48006, tier: 'recruit', loadout: 'full' });
      g.load(gunzipSync(readFileSync(path.join(root, 'tests', 'topup-crash.json.gz'))).toString());
      const s = g.state, pid = s.player.id, hands0 = [...s.people[pid].kit.hands];
      const top = stepsOf(s).find(r => r.id === 'weapon:other:topup'), lists = { topup: weaponList(s, pid, 'other:topup'), transition: weaponList(s, pid, 'transition') };
      let threw = null;
      try { g.step(1, { act: [stepAct('weapon:other:topup')] }); for (let k = 0; k < 400; k++) g.step(1, {}); } catch (e) { threw = e.message; }
      const hands = s.people[pid].kit.hands, held = hands.filter(Boolean).map(id => s.items[id]?.type ?? s.items[id]?.kind ?? '?');
      console.log(`      hands before ${JSON.stringify(hands0)} (${s.items[hands0[0]]?.model} ${s.items[hands0[0]]?.st}); Top up offered ${!!top}; the lists ${JSON.stringify(lists)}; the press: ${threw ? `threw "${threw}"` : 'no throw'}; hands after ${JSON.stringify(hands)} (${held.join(', ')})`);
      assert(!top && lists.topup === null && lists.transition === null && !threw && hands[0] === hands0[0] && !hands[1], JSON.stringify({ top: !!top, lists, threw, hands }));
    },
  },
];
