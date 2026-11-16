// OLYMPUS tests: the room's gauges F50 to F54 over the sheets (heavy; the build sheet v0.0.20 §8, role B; tests/flawless-room.mjs).
//
// The honest bot from the corporal to the tier one and the keys bot on the boot recruit and the private, on three seeds and two, each
// lane to its card; the fuzz bot's lanes on two sheets for F51 (the cold line's Fix, enforced on every bot). F50 to F54 enforced, the
// lines printed as house-flawless-quick prints its own.
import { assert } from './helpers.mjs';
import { houseHonestBot, houseKeysBot, houseFuzzBot } from './bots/house.mjs';
import { roomLane, roomGauges, gaugeLine } from './flawless-room.mjs';

const SEEDS = [48213, 1489397426, 1037];
export default [
  {
    name: 'F50 to F54 over the honest lanes (the corporal to the tier one, three seeds) and the keys lanes (the boot recruit and the private, two seeds), the fuzz\'s cold line on two sheets: every gauge MET',
    heavy: true, timeoutMs: 20 * 60_000,
    fn() {
      const lanes = [
        ...['cpl', 'sgt', 'raider', 'tierone'].flatMap(tier => SEEDS.map(seed => roomLane({ tier, seed, bot: houseHonestBot() }))),
        ...['recruit', 'private'].flatMap(tier => SEEDS.slice(0, 2).map(seed => roomLane({ tier, seed, bot: houseKeysBot() }))),
      ];
      const fuzz = ['private', 'sgt'].flatMap(tier => [1222, 1333].map(seed => roomLane({ tier, seed, bot: houseFuzzBot({ seed }) })));
      const G = roomGauges(lanes, { fuzz });
      for (const g of G) console.log(`      ${gaugeLine(g)}`);
      console.log(`      ${lanes.length} lanes to the card ${lanes.filter(R => R.done).length}, the fuzz ${fuzz.filter(R => R.done).length} of ${fuzz.length}`);
      assert(lanes.every(R => R.done) && fuzz.every(R => R.done) && G.every(g => g.met), JSON.stringify(G.filter(g => !g.met).map(g => g.got)));
    },
  },
];
