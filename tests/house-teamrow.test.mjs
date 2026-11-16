// OLYMPUS tests: the run sheet's TEAM row (the build sheet v0.0.20 §1 item 19; its §6 C "house-pair's case 3", here in C's own file since
// house-pair.test.mjs is A's): "TEAM · LINE CLEAN · #2 IN 1.60 S · HELD OUT 0 · CALLS 15 OF 15 · MARKED 3 OF 3".
//
// shoothouse.js teamRowOf reads the legs' fields of the stack, A's (L.masked, L.heelsMs, L.twoHeldMs) and B's (the calls { [word]: {
// due, said } }, L.marked), absent reading zero or none, as an old save or a tree without them gives; and v0.0.19's sides swapped.
// Their fields are stubs written here on a finished lane, as the sheet's §4 shapes give them, after every field of theirs the lane
// wrote is taken off (so the test reads the same before and after A and B merge); the row with none is "TEAM · LINE CLEAN · HELD OUT 0". The one thing may name "Stay out of his line." (a 'masked' fault) or "Let him in
// with you." (his entry over 2 s behind you in a room).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { runSheetOf, houseOf, hotWashOf } from '../src/sim/scenarios/shoothouse.js';

export default [
  {
    name: 'the TEAM row carries the line, the #2\'s entry, the held-out time, the calls and the marks from the legs\' fields (stubs of A\'s and B\'s shapes), absent reading zero or none',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' });
      runHouse(g, houseHonestBot());
      // (the lane's own row as the tree builds it: with A's and B's records merged it carries their numbers; the bare row is the one
      // with every field of theirs taken off the legs, so this test reads the same before and after their merge: the C and D review)
      const s = g.state, H = houseOf(s), legs = [...H.rooms, H.hall], own = runSheetOf(s).team.words;
      for (const L of legs) for (const k of ['masked', 'heelsMs', 'twoHeldMs', 'pins', 'teamCalls', 'marked']) delete L[k];
      const bare = runSheetOf(s).team.words;
      legs.forEach((L, k) => { L.heelsMs = [1600, 1450, 1550, null][k] ?? undefined; L.teamCalls = { out: { due: 1, said: 1 }, last: { due: 1, said: k < 2 ? 1 : 0 } }; if (k < 3) L.marked = k < 2 ? { by: H.twoPid, atMs: L.clearAtMs } : undefined; });
      const full = runSheetOf(s).team.words;
      H.rooms[1].masked = [{ atMs: H.rooms[1].clearAtMs - 3000, by: H.twoPid, ms: 400 }]; H.rooms[1].twoHeldMs = 3200;
      const masked = runSheetOf(s).team, wash = hotWashOf(s).lines;
      console.log(`      the lane's own: ${own}; with no field of A's or B's: ${bare}`);
      console.log(`      with the stubs: ${full}`);
      console.log(`      masked and held: ${masked.words}; the hot wash says it: ${wash.includes(masked.words)}`);
      assert(bare === 'TEAM · LINE CLEAN · HELD OUT 0', bare);
      assert(full === 'TEAM · LINE CLEAN · #2 IN 1.60 S · HELD OUT 0 · CALLS 6 OF 8 · MARKED 2 OF 3', full);
      assert(masked.words === 'TEAM · LINE MASKED 1 · #2 IN 1.60 S · HELD OUT 3.20 S · CALLS 6 OF 8 · MARKED 2 OF 3' && wash.includes(masked.words), masked.words);
    },
  },
];
