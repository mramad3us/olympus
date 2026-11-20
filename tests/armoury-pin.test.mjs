// OLYMPUS tests: "The window and the canopy"'s pin (the build sheet v0.0.28 §6 B's heavy armoury-pin): its lanes played whole, from the fill to the card, held to the tick, the card's line and the save.
//
// collar-pin's way on the armoury: each cell a lane from the fill (no setup: the window, the rank, the bus, the ammunition point, the relay
// behind its splash, the lane, the declaration, the canopy, the barrel, the window), run by tests/bots/armoury.mjs to the range's end,
// compared on the lane's last tick, the digest of its card (armouryNow's card, canonical JSON) and the digest of its save (game.digest()).
// The cells: the private by the keys and the sergeant by T, on 48213 and on the first seed with both the slip and the short count. Recorded
// at B's merge (PRINT_HASH=1) on the tree after E, D, A and C (.run/v028/after-EDAC.tree with B's patch): a cell that moves says why, in this
// header and in CHANGELOG.md, and is re-recorded; anywhere else it is a bug.
import { assert } from './helpers.mjs';
import { goldenDigest, PRINT_HASH } from './golden.mjs';
import { armGame, seedWith } from './armoury-world.mjs';
import { armouryBot, armouryTBot, runArmoury } from './bots/armoury.mjs';

// (the pinned cells: 'bot/sheet/seed' → [last tick, card digest, save digest]; PRINT_HASH=1 prints them to paste)
// (recorded at B's merge, 2026-11-20, on .run/v028/after-EDAC.tree with b.patch; seed 53 the first with the slip and the short count. Recorded
// first on the tree before A's and D's review re-cut (b0416f73), then on a9389d5b: A's fixes (firedOutcome's endMs, the relay's barrel and a
// re-clean's carbon) moved seed 53's two saves, no tick and no card (was 'keys/private/53' save 0e7adb2bfc6a4a, 'T/sgt/53' 12216d87324d4c);
// then B's far cases kept on the walk's ground (armoury-day.js relayOutcome: seed 53's lane 5 had thrown three over the south rope, so the
// honest lane waited out the police and took the working party) moved both seed-53 cells: was [5009, '1a6c0128b94a57', '131e86f4c2826d']
// and [4048, '125046db333513', '07b69d47fd9b38']). Then the fixer of the review of C and B: the squad placed at the canopy off your own
// table's four places (armoury-day.js squadAt, a marine had stood at t3#3, his head on your ring) moved the four saves, no tick (was
// 'keys/private/48213' save 06b529f669ff9b, 'T/sgt/48213' 09dc817c25e6fe, 'keys/private/53' 11fff41d791c89, 'T/sgt/53' 0773d313f55da8);
// and the card's bench the decision at the table, not the re-clean (cleans[0]), moved 'keys/private/53''s card, its one turn-back's lane
// (was '1459eacf452c06': "normal, 10 min", now "normal, 36 min"))
// (then the fixer of v0.0.28's play and code reviews (.run/v028/fix.md) moved all four cells, every one for these causes: the rank's
// calls one at a time, each the serial's last three digits (armoury-day.js CHECK_GAP_MS, ARM_SAY.checkTail: the check 3 s longer on
// both seeds, so every later tick); T's Draw reading the right rifle back after the slip (the T cells, whose seeds draw the slip: 20
// ticks more than the keys' cells on both); the card in words (the faults by the range's words in its summary and its line, the armourer's verdict
// "passed it" with no number, the far cases "along the line"); and the saves with them (R.arm's clean record keeps the gun's cleans
// count). Was 'keys/private/48213' [3067, '18ca15aa1d72c5', '0bdb0959f9918d'], 'T/sgt/48213' [2947, '1537157e030b4f', '06e07c28c9588d'],
// 'keys/private/53' [3928, '0e3d775b3e4163', '06d97c6ef6527a'], 'T/sgt/53' [2987, '1daec496956672', '14504a95bb0f9a'])
const PIN = {
  'keys/private/48213': [3127, '0ab585022bd24b', '1d938b2f35ebff'],
  'T/sgt/48213': [3027, '1e647050bd257c', '03abfc61691283'],
  'keys/private/53': [3988, '009a81d956d498', '06149d0bbc8d23'],
  'T/sgt/53': [3067, '0539f0e1cdcbae', '0c12b087b67444'],
};
const both = seedWith(d => d.slip && d.short);
const CELLS = [['keys', 'private', 48213], ['T', 'sgt', 48213], ['keys', 'private', both], ['T', 'sgt', both]];

export default [
  {
    name: 'the armoury\'s pin: four lanes from the fill to the card (the private by the keys and the sergeant by T, on 48213 and on a seed with the slip and the short count) held to the tick, the card and the save',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const moved = [];
      for (const [bot, tier, seed] of CELLS) {
        const k = `${bot}/${tier}/${seed}`, g = armGame({ seed, tier }), r = runArmoury(g, bot === 'T' ? armouryTBot() : armouryBot()), s = g.state;
        const got = { tick: s.clock.tick, card: goldenDigest(r.N.card), save: g.digest() }, want = PIN[k];
        const same = want && want[0] === got.tick && want[1] === got.card && want[2] === got.save;
        if (PRINT_HASH) console.log(`      '${k}': [${got.tick}, '${got.card}', '${got.save}'],${want && !same ? `  // (was [${want[0]}, '${want[1]}', '${want[2]}'])` : ''}`);
        else console.log(`      ${k.padEnd(20)} ${r.end?.phase} at tick ${got.tick}, card ${got.card}, save ${got.save}${same ? '' : `  MOVED (was ${want ? want.join(', ') : 'none'})`}`);
        if (!r.done) moved.push(`${k}: no card`);
        else if (!same) moved.push(k);
      }
      assert(PRINT_HASH || !moved.length, moved.join(', '));
    },
  },
];
