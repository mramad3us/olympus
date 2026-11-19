// OLYMPUS tests: one "Clear!" a man a room (the build sheet v0.0.22 item 4, FL22-4): your #2 echoes your "Clear!" only in a leg where he has called none of his own.
//
// shoothouse.js endLeg said his "Clear!" after yours unless his own came within ECHO_MS 1 s of the leg's end; on the feel lens's 40
// turner lanes 84 of your 169 calls were followed by his second "Clear!", his first 0.25 to 16.35 s before yours, in room 3 and the
// hall above all. Now the echo is said only where he has none of his own in the leg (twoCalledIn: his Dominate swept to its end on the
// leg's door, its call beat said, or his last call since you entered the leg). Each lane is tests/flawless-end.mjs endLane (from the
// fill to the card), his "Clear!" counted by the leg current when its tick began. Fails without the rule (two in room 3 and the hall).
import { assert } from './helpers.mjs';
import { endLane } from './flawless-end.mjs';

// (a lane's line, and whether his calls hold: at most one a leg, room 1 his own)
const holds = (r) => r.done && !Object.values(r.twoClears).some(n => n > 1) && r.twoClears[0] >= 1;
const show = (out) => { for (const r of out) console.log(`      ${r.cell}: ${r.done ? r.end : 'NOT to the card'}; his "Clear!" by leg ${JSON.stringify(r.twoClears)}`); };

export default [
  {
    name: 'your #2 calls "Clear!" once a leg: the private by T and the tier one by the keys on 48213 at GO, at most one of his a leg in every leg, room 1 still his own call (before: two in room 3 and the hall, his own then the echo of yours)',
    fn() {
      const out = [endLane({ tier: 'private', seed: 48213, bot: 'T', setup: 'go' }), endLane({ tier: 'tierone', seed: 48213, bot: 'keys', setup: 'go' })];
      show(out);
      assert(out.every(holds), JSON.stringify(out.map(r => [r.cell, r.twoClears])));
    },
  },
  {
    name: 'your #2 calls "Clear!" once a leg (heavy): the private and the tier one on 48213, 1 and 1037, by the keys and by T, from the fill to the card',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const out = [];
      for (const tier of ['private', 'tierone']) for (const bot of ['keys', 'T']) for (const seed of [48213, 1, 1037]) out.push(endLane({ tier, seed, bot }));
      show(out);
      assert(out.every(holds), JSON.stringify(out.filter(r => !holds(r)).map(r => [r.cell, r.twoClears])));
    },
  },
];
