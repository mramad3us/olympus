// OLYMPUS tests: the Wreck's pin (v0.0.25 "Hold to hold", its build sheet §8: heavy `zerocqb-pin`): its lanes played whole, from the fill to the card, held to the tick, the run sheet and the save.
//
// house-pin's way on the Wreck: each cell a lane from the fill (no setup: the brief, LOAD, MAKE READY, Standby, GO, the four
// compartments on two decks through the trunk and the tug, Stop, the cadre aboard, UNLOAD, SHOW CLEAR, the hot wash) run by
// tests/bots/house.mjs runHouse to the range's end, compared on the lane's last tick, the digest of its run sheet (runSheetOf,
// canonical JSON) and the digest of its save (game.digest()). The cells: the honest bot (T) at the corporal to the tier one on 48213,
// the keys bot at the boot recruit and the private on 48213, and the fuzz at the sergeant on 1037. Recorded once on C's tree of v0.0.25
// (PRINT_HASH=1): a cell that moves says why, in this header and in CHANGELOG.md, and is re-recorded; anywhere else it is a bug.
import { assert } from './helpers.mjs';
import { goldenDigest, PRINT_HASH } from './golden.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { wreckBot } from './flawless-wreck.mjs';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';

// (the pinned cells: 'bot/sheet/seed' → [last tick, run sheet digest, save digest]; PRINT_HASH=1 prints them to paste)
const PIN = {
  // (every cell re-recorded by the fix of the review of C and D, the ticks moved: the hold's two corners behind the cargo struck from its
  // hot spots (no looks at them, its par 0.5 s shorter), your #2 stacking again at the trunk so the brace happens ("Got you.", the pair
  // from his grip, "Through."), T holding you on the deck at the trunk with the onset 12 s off or nearer and the Wait ended with the burn,
  // your "Clear!" waiting on his sweep at the boots' pace (12.5 s at most on a ship), the hatch's count held through the plant, feet aft
  // judged at the onset, the keys bot waiting feet aft and planting before a reload in the hatch, the brace let go after 5 s at most.
  // Was: cpl [5061, '1e3b0caa44547b', '0e9a2414dc6d12'], sgt [4741, '1f878af970605c', '1edc9099951bc6'], raider [4541, '12a89936ad4e31',
  // '154cafe769aa35'], tier one [4521, '04e247fbc9c731', '17366168c5674b'], recruit [5961, '163ed4ad9439a8', '0dc00e9a70377a'], private
  // [5281, '1d9a70d8fd59c6', '1b87e48d9c91b0'], fuzz [10662, '1273aeae460878', '05cd04cf93e623'])
  'honest/cpl/48213': [5241, '00a796447290d6', '1fdd9231a68408'], // (v0.0.25's fixer: the run sheet: "4 clean compartments" (shoothouse.js practisedOf on a ship); the save: the deck's call "Deck {n} clear! Next." for "Deck {n}: clear!" in the log; was [5241, '13589823c03ded', '1059db79034406'])
  'honest/sgt/48213': [4641, '0fe2e81248687e', '13c43d821c9e45'], // (v0.0.25's fixer: the run sheet: "4 clean compartments" (shoothouse.js practisedOf on a ship); the save: the deck's call "Deck {n} clear! Next." for "Deck {n}: clear!" in the log; the T lanes' saves: "Feet aft." no T act while your clearing acts (base.js 'aft'), so no refused T in the log; was [4641, '0450b9171e4bfa', '037f70e5895f0f'])
  'honest/raider/48213': [4401, '1965e4e5d21526', '1eb3431f73b2ed'], // (v0.0.25's fixer: the run sheet: "4 clean compartments" (shoothouse.js practisedOf on a ship); the save: the deck's call "Deck {n} clear! Next." for "Deck {n}: clear!" in the log; the T lanes' saves: "Feet aft." no T act while your clearing acts (base.js 'aft'), so no refused T in the log; was [4401, '1a92a54319219d', '01eafa1fca4166'])
  'honest/tierone/48213': [4381, '0ec5e086f502f4', '1d4da5abb0e20b'], // (v0.0.25's fixer: the run sheet: "4 clean compartments" (shoothouse.js practisedOf on a ship); the save: the deck's call "Deck {n} clear! Next." for "Deck {n}: clear!" in the log; the T lanes' saves: "Feet aft." no T act while your clearing acts (base.js 'aft'), so no refused T in the log; was [4381, '1e1a6fa8b87363', '19c8a78d58127e'])
  'keys/recruit/48213': [6001, '1d6726dca4bfad', '18ca7b0e1dda6e'], // (v0.0.25's fixer: the run sheet: "4 clean compartments" (shoothouse.js practisedOf on a ship); the save: the deck's call "Deck {n} clear! Next." for "Deck {n}: clear!" in the log; was [6001, '03f3a7ae39c957', '1841245ceb0d36'])
  'keys/private/48213': [5481, '0e8c0098f37b33', '117c337c880658'], // (v0.0.25's fixer: the run sheet: "4 clean compartments" (shoothouse.js practisedOf on a ship); the save: the deck's call "Deck {n} clear! Next." for "Deck {n}: clear!" in the log; was [5481, '166425b39fbb80', '049b1c67bdb2a5'])
  'fuzz/sgt/1037': [11382, '04b49155ed3654', '1c2370d2a2610d'], // (v0.0.25's fixer: the fuzz's own path: no kneel, prone or sit offered floating (shooting.js FLOATING_STANCE_WHY), so its random legal steps differ and it passes at tick 11382; the run sheet: "4 clean compartments" (shoothouse.js practisedOf on a ship); the save: the deck's call "Deck {n} clear! Next." for "Deck {n}: clear!" in the log; was [9222, '03bc51018f99e8', '0236c8a5776525'])
};
const CELLS = [['honest', 'cpl', 48213], ['honest', 'sgt', 48213], ['honest', 'raider', 48213], ['honest', 'tierone', 48213], ['keys', 'recruit', 48213], ['keys', 'private', 48213], ['fuzz', 'sgt', 1037]];

function cellOf(bot, tier, seed) {
  const g = createGame({ scenario: 'test-zerocqb', seed, tier }), r = runHouse(g, wreckBot(bot, tier, seed), { maxMs: 20 * 60_000 }), s = g.state;
  return { done: r.done, end: s.armoury?.range?.house?.end?.why ?? null, tick: s.clock.tick, sheet: goldenDigest(runSheetOf(s)), save: g.digest() };
}

export default [
  {
    name: 'the Wreck\'s pin: seven lanes from the fill to the card (T at the corporal to the tier one, the keys at the recruit and the private, the fuzz at the sergeant) held to the tick, the run sheet and the save',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const moved = [];
      for (const [bot, tier, seed] of CELLS) {
        const k = `${bot}/${tier}/${seed}`, got = cellOf(bot, tier, seed), want = PIN[k];
        const same = want && want[0] === got.tick && want[1] === got.sheet && want[2] === got.save;
        if (PRINT_HASH) console.log(`      '${k}': [${got.tick}, '${got.sheet}', '${got.save}'],${want && !same ? `  // (was [${want[0]}, '${want[1]}', '${want[2]}'])` : ''}`);
        else console.log(`      ${k.padEnd(22)} ${got.end} at tick ${got.tick}, sheet ${got.sheet}, save ${got.save}${same ? '' : `  MOVED (was ${want ? want.join(', ') : 'none'})`}`);
        if (!got.done) moved.push(`${k}: no card`);
        else if (!same) moved.push(k);
      }
      assert(PRINT_HASH || !moved.length, moved.join(', '));
    },
  },
];
