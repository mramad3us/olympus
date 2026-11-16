// OLYMPUS tests: the drawn house's pin (the build sheet v0.0.21 §1 item 18, §3 step 11, §6; house lens H9): "Stack and clear" drawn from the seed, played whole from the fill to the card, held to the tick, the run sheet and the save.
//
// As tests/house-pin.test.mjs's cells, on three drawn seeds (the user's 1489397426, 48213 and 1037: each its own house) by the honest
// tier one and the keys private: the lane's last tick, the digest of its run sheet (runSheetOf) and of its save. The cells are the
// sheet's "recorded at B's merge": first recorded on A's tree (the drawn house without B's fixes, B's merge moves them: the #2's held
// holds, the route budget, the dry pick), each to be re-recorded by the lead with PRINT_HASH=1 at B's merge, every moved cell said
// with the item that moved it (.run/v021/lead.md), and held byte for byte after. A cell that moves anywhere else is a bug. Heavy.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { goldenDigest, PRINT_HASH } from './golden.mjs';
import { botOf } from './flawless.mjs';
import { runHouse } from './bots/house.mjs';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';

/** The drawn seeds and the bots pinned on them (bot/sheet). */
export const PIN_DRAWN_SEEDS = Object.freeze([1489397426, 48213, 1037]);
export const PIN_DRAWN_BOTS = Object.freeze([['honest', 'tierone'], ['keys', 'private']]);

// (the pinned cells: 'bot/sheet/seed/code' → [last tick, run sheet digest, save digest]; PRINT_HASH=1 prints them to paste)
const PIN = Object.freeze({
  // (recorded on A's tree, 2026-11-16, before B's fixes; the keys private on 1489397426 passes room 3 and the hall by the stall: its
  // last door is found open and the keys bot walks from room 2's point without stacking first, B's to answer)
  // (re-pinned on A's tree, 2026-11-16, by the review of A and B's fixes: the run sheet's card names a drawn house 'NEW LAYOUT', not
  // 'LANE A' (shoothouse.js runSheetOf, laneNameOf): every cell's sheet moved, every tick and save the same)
  // (re-recorded at B's merge by v0.0.21's integration, 2026-11-16, every cell moved, each cause checked by its role's reviewer by
  // taking its fix out (a.md "Review fixes"): the PA's drawn brief and standby (handling.js seqOf reading courses.js SEQ_HOUSE_DRAWN:
  // its spoken length chains the tower's next command) moves every cell's tick; the keys private's walk by B's keys bot (a door
  // found open stacked first, the P-12 answered at MAKE READY) moves both keys cells on 1489397426 (8842 → 4722: room 3 and the
  // hall no longer passed by the stall) and 48213; B's cqb-contact 'his' quiet while a question stands moves the tier one on
  // 1489397426 (an act-less "That one's his" from tick 1165 before). The ticks are a.md's predicted ones on B's tree with every fix
  // in, to the tick (3822, 4722, 3862, 4762, 3963, 4643), so v0.0.20's closers, in this tree and not in A's or B's, move no tick)
  // (re-recorded by v0.0.21's fixer, 2026-11-16, every cell moved, each cause found by taking each fix out on the integration's
  // snapshot (.run/v021/fix.md): a drawn area's id now numbers its layout one to one (scenes/assemble.js areaIdOf, 13 hex digits:
  // two layouts shared a 7-digit hash), so every id in the run sheet and the save moved, and the tier one's kick on 1037's locked
  // room 1, rolled on the door's id, lands at once (3963 → 3923); a drawn lane door's lock is known only once read or tried
  // (bundle.js lockUnknownOf: his T at GO plans the push, the read finds the lock, the push is refused, the kick follows), which on
  // its own also gives 3923 on 1037; and the stands' books gain the turn off the sector at a drawn place (shoothouse.js turnOffMs,
  // H.books saved) and a man seen with another times his par from the first man's row (parFrom): saves only, no tick moved.
  // Was: [3822, '0fc2f05cedda42', '1694e5a3b8ad7f'], [4722, '11b02450a10ba3', '0af2a0f8f493ea'], [3862, '19f76885002750',
  // '0a184009e2ab2e'], [4782, '01b9b5c5de63e1', '0335bd1e3d486a'], [3963, '1ff89f2c46c9ce', '1d098f3a408365'], [4643,
  // '0ebbd69e9993ee', '1d554d9f137048'])
  'honest/tierone/1489397426/Cn260pc.Ks230lo.Es165po|fnttnth|p022112': [3822, '02a00763f022a5', '0bb339b400d9c9'],
  'keys/private/1489397426/Cn260pc.Ks230lo.Es165po|fnttnth|p022112': [4722, '1ce899349a83b9', '127be13888972a'],
  'honest/tierone/48213/Kn240lc.Es195pc.Cn160lc|ftnnant|p303101': [3862, '16f78b36bf02e9', '0c87b8a1bfe671'],
  'keys/private/48213/Kn240lc.Es195pc.Cn160lc|ftnnant|p303101': [4782, '1bc6da00d25760', '1f1a8cd4fe2d9a'],
  'honest/tierone/1037/Ks270pk.En210lc.Cs170lc|fhntttt|p032020': [3923, '1062a74a277186', '1e9adbce1a2332'],
  'keys/private/1037/Ks270pk.En210lc.Cs170lc|fhntttt|p032020': [4643, '1e80677131f09c', '1ba5bf770a53b8'],
});

function laneOf({ bot, tier, seed }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, draw: 'drawn' });
  const r = runHouse(g, botOf(bot, { seed }), { maxMs: 30 * 60_000 });
  const s = g.state, H = s.armoury.range.house;
  return { done: r.done, end: H?.end?.why ?? null, code: H.draw.code, tick: s.clock.tick, sheet: goldenDigest(runSheetOf(s)), save: g.digest() };
}

export default [
  {
    name: 'the drawn pin: the honest tier one and the keys private on three drawn seeds, from the fill to the card, held to the tick, the run sheet and the save (recorded on A\'s tree; re-recorded at B\'s merge)',
    heavy: true,
    timeoutMs: 15 * 60_000,
    fn() {
      const moved = [];
      for (const seed of PIN_DRAWN_SEEDS) for (const [bot, tier] of PIN_DRAWN_BOTS) {
        const got = laneOf({ bot, tier, seed }), k = `${bot}/${tier}/${seed}/${got.code}`, want = PIN[k] ?? null;
        if (PRINT_HASH) { console.log(`      '${k}': [${got.tick}, '${got.sheet}', '${got.save}'],${want && (want[0] !== got.tick || want[1] !== got.sheet || want[2] !== got.save) ? `  // (was [${want[0]}, '${want[1]}', '${want[2]}'])` : ''}`); continue; }
        const same = !!want && want[0] === got.tick && want[1] === got.sheet && want[2] === got.save;
        console.log(`      ${k}: ${got.done ? `to the card (${got.end})` : 'NOT to the card'}, tick ${got.tick}, sheet ${got.sheet}, save ${got.save}${same ? '' : want ? `  MOVED from tick ${want[0]}, sheet ${want[1]}, save ${want[2]}` : '  (no pin yet)'}`);
        if (!same || !got.done) moved.push(k);
      }
      if (!PRINT_HASH) assert(!moved.length, `${moved.length} cells moved or not pinned (re-record with PRINT_HASH=1 only at a merge that moves them, each moved cell said): ${moved.join(', ')}`);
    },
  },
];
