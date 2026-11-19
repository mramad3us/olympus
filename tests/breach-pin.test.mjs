// OLYMPUS tests: the scene's pin (v0.0.26, "Bang, then go"; its build sheet §6 B): four lanes played whole, from the fill to the card, held to the tick, the run sheet and the save.
//
// Each cell is a lane of the house's scenario with &breach= (room 1, the two role-players there, the draw forced) from the fill (no setup:
// the brief, the sterile check, LOAD, MAKE READY, Standby, GO, room 1, "Clear!", the search's offer, Stop, UNLOAD, SHOW CLEAR, the hot
// wash), by tests/breach-lanes.mjs breachBot 'auto' (the private by the keys, the sergeant by T; the bang thrown by its row where issued),
// to the range's end with runHouse, compared on three things as house-pin's are: the lane's last tick (state.clock.tick), the digest of
// its run sheet (runSheetOf, canonical JSON) and the digest of its save (game.digest()). The cells: the private by the keys and the
// sergeant by T on 48213, each with the bang on the held door and on the quiet loose door. Recorded once by this file run with
// PRINT_HASH=1 on B's tree after A's merge (.run/v026/after-A.tree with B's work); a cell that moves later must say why on its line.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { goldenDigest, PRINT_HASH } from './golden.mjs';
import { runHouse } from './bots/house.mjs';
import { breachBot } from './breach-lanes.mjs';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';

// (the pinned cells: 'tier/seed/code' → [last tick, run sheet digest, save digest]; PRINT_HASH=1 prints them to paste)
// (re-recorded by the fix of the review of B and C, 2026-11-19, every cell moved for named causes: A's fix of its review (11:01, after
// B's recording) walks T and the keys to each man down and searches him ('move:search'), so the sergeant's lanes gain both searches,
// 3582 → 4382 and 3562 → 4282 ticks, and the private's quiet loose door, his aim timed from the facing he turned from (A's fix 3),
// ends 40 ticks later, 3502 → 3542; the run sheets with them. The search behind the house's skip moves the saves only (its activity's
// record; the ticks lived are the same), and the re-aim after the shock moves none of the four (the men are down before it ends):
// checked by each change undone in turn)
export const BREACH_PIN = Object.freeze({
  // (C's look, at C's merge: 1a struck first while dazed, his record at his first strike (T.atFirst.pose) 'daze', not 'stand': the two bang
  // lanes' saves only, 0890a6a82b06fa → 0c0c324659a4e7 and 08c459a47c82c7 → 1e2a2b71529e3e; the ticks and run sheets unmoved)
  // (v0.0.26's fixer (.run/v026/fix.md), three cells moved for four named causes, each checked by its fix undone alone: bundle.js doorNow
  // offers no door past room 1 on this lane, so after the searches the bots no longer stack on room 2 and the lanes end 100 ticks sooner,
  // 4542 → 4442, 4382 → 4282, 4282 → 4182, with their run sheets; room 1's par planned with the flash on a bang draw (roomBookOf), the two
  // bang cells' run sheets and saves; the card's STARTLED TO for DAZED TO, the two bang cells' run sheets; the men named at "Clear!"
  // ("1A and 1B, you are out."), the three cells' saves (the words said). The private's quiet loose door, never searched past and with no
  // bang, does not move)
  'private/48213/bang,held': [4442, '1ec77755f9633d', '066aaddf7aa97d'],
  'sgt/48213/bang,held': [4282, '19993ddd286e9b', '0412ef6c1a0521'],
  'private/48213/quiet,loose': [3542, '00279905df0d88', '0976be67296a69'],
  'sgt/48213/quiet,loose': [4182, '0597ebbff6e7de', '1b28d798ca2836'],
});
export const BREACH_CELLS = Object.freeze([
  { tier: 'private', seed: 48213, code: 'bang,held' }, { tier: 'sgt', seed: 48213, code: 'bang,held' },
  { tier: 'private', seed: 48213, code: 'quiet,loose' }, { tier: 'sgt', seed: 48213, code: 'quiet,loose' },
]);
const keyOf = (c) => `${c.tier}/${c.seed}/${c.code}`;

// (one cell: the lane from the fill to the range's end; its numbers)
function laneOf(c) {
  const g = createGame({ scenario: 'test-shoothouse', seed: c.seed, tier: c.tier, breach: c.code });
  const r = runHouse(g, breachBot('auto', c), { maxMs: 30 * 60_000 });
  const s = g.state;
  return { done: r.done, end: s.armoury?.range?.house?.end?.why ?? null, tick: s.clock.tick, sheet: goldenDigest(runSheetOf(s)), save: g.digest() };
}

export default [
  {
    name: 'the scene\'s pin: the private by the keys and the sergeant by T on 48213, the bang on the held door and the quiet loose door, from the fill to the card, to the tick, the run sheet and the save',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const moved = [];
      for (const c of BREACH_CELLS) {
        const got = laneOf(c), want = BREACH_PIN[keyOf(c)] ?? null, now = [got.tick, got.sheet, got.save];
        const same = !!want && JSON.stringify(want) === JSON.stringify(now);
        console.log(`      ${keyOf(c).padEnd(26)} ${got.done ? got.end : 'NOT DONE'}: tick ${got.tick}, sheet ${got.sheet}, save ${got.save}${same ? '' : `  ${want ? `MOVED (pinned ${JSON.stringify(want)})` : 'NOT PINNED'}`}`);
        if (PRINT_HASH) console.log(`  '${keyOf(c)}': [${got.tick}, '${got.sheet}', '${got.save}'],`);
        if (!got.done || !same) moved.push(keyOf(c));
      }
      if (PRINT_HASH) return;
      assert(!moved.length, `cells moved or not pinned: ${moved.join(', ')}`);
    },
  },
];
