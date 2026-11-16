// OLYMPUS tests: your #2 on your heels below rung 3 (the build sheet v0.0.20 item 8; drill.md item 2; FM 3-06.11 §3-22c(6): the second man in "almost simultaneously").
//
// Below rung 3, you leaving your stack toward the open door (bundle.js heelsGo: HEELS_FROM_M along your lane at CROSS_STILL_MS or
// more), your #2 closes up onto your vacated stack point (his `heels` beat, HEELS_M behind where you stood, the body gap holding);
// cued ENTRY_WAIT_MS 400 after you stop inside (was 1,000), he flows in from there at Fast. Before it the private by the keys had
// him past his threshold 2.84 to 2.97 s after you in rooms 1 and 3 (drill.md §1.2). The leg's L.heelsMs (you past the threshold to
// him past it) is written only where his heels beat ran. Quick: the private by the keys on 48213; heavy: the boot recruit and the
// private on ten seeds each (3a's first sighting printed: drill.md's projection that he would see his own man first did not hold).
import { assert, fmt } from './helpers.mjs';
import { flawlessLane, flawlessSeeds, TWO_CUE_MS } from './flawless.mjs';
import { ENTRY_WAIT_MS, HEELS_FROM_M, HEELS_M } from '../src/sim/combat/bundle.js';
import { TWO_HEELS_MS } from './flawless-bodies.mjs';

// (a keys lane from GO: each room's L.heelsMs and his entry from his cue (F25's), his heels beats, 3a's first sighting by whom)
function lane(tier, seed) {
  let H = null, first3a = null;
  const heels = new Set();
  const rec = flawlessLane({ tier, seed, bot: 'keys', more: (game) => {
    H = game.state.armoury.range.house;
    if (H.two.heels) heels.add(`${H.two.heels.door}@${H.two.heels.atMs}`);
  } });
  // (3a's first sighting, by whom (shoothouse.js noteSighting's record on room 3's leg))
  const c3 = (H?.rooms?.[2]?.contacts ?? []).filter(k => k.stand === '3a').sort((x, y) => x.seenMs - y.seenMs)[0] ?? null;
  first3a = c3?.by ?? null;
  return { tier, seed, done: rec.done, laneS: rec.laneS, heelsMs: H.rooms.map(L => L.heelsMs ?? null), cue: Object.fromEntries(Object.entries(rec.entry).map(([d, E]) => [d.slice(-2), E.cueMs !== null && E.inMs !== null ? E.inMs - E.cueMs : null])), heels: heels.size, first3a, gap: rec.gap.minM };
}

export default [
  {
    name: 'below rung 3 your #2 is past his threshold within TWO_HEELS_MS 2 s of you in every room on his heels: the private by the keys on 48213 (drill.md: 2.84 to 2.97 s before, his walk from his own stack cued ENTRY_WAIT_MS 1 s after you stopped inside)',
    fn() {
      const r = lane('private', 48213);
      console.log(`      HEELS_FROM_M ${HEELS_FROM_M} m, HEELS_M ${HEELS_M} m, ENTRY_WAIT_MS ${ENTRY_WAIT_MS}: heels beats ${r.heels}; you in to him in, rooms 1 to 3: ${r.heelsMs.map(ms => (ms === null ? '-' : `${fmt(ms / 1000, 2)} s`)).join(', ')}; his cue to his threshold (F25) ${JSON.stringify(r.cue)}; the least gap ${fmt(r.gap, 2)} m; the lane ${fmt(r.laneS, 1)} s`);
      assert(r.done && r.heels === 3 && r.heelsMs.every(ms => ms !== null && ms <= TWO_HEELS_MS) && Object.values(r.cue).every(ms => ms !== null && ms <= TWO_CUE_MS) && r.gap >= 0.5, JSON.stringify(r));
    },
  },
  {
    name: 'on his heels, every room within TWO_HEELS_MS, the boot recruit and the private by the keys, ten seeds each, every lane to its card; 3a\'s first sighting printed (drill.md projected 8 of 10 by him on his heels: it stays yours, 10 of 10, as before, since you are through the door 1.5 s ahead of him and 3a is in view from it)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const rows = [];
      for (const tier of ['recruit', 'private']) for (const seed of flawlessSeeds(10)) rows.push(lane(tier, seed));
      const all = rows.flatMap(r => r.heelsMs.filter(x => x !== null)).sort((a, b) => a - b), his = rows.filter(r => r.tier === 'private' && r.first3a === 'two').length;
      console.log(`      ${rows.length} lanes: you in to him in p50 ${fmt(all[all.length >> 1] / 1000, 2)} s, max ${fmt(all.at(-1) / 1000, 2)} s, over ${TWO_HEELS_MS / 1000} s ${all.filter(x => x > TWO_HEELS_MS).length} of ${all.length}; 3a first seen by him (private) ${his} of 10; the least gap ${fmt(Math.min(...rows.map(r => r.gap)), 2)} m; to the card ${rows.filter(r => r.done).length}`);
      assert(rows.every(r => r.done) && all.length === 3 * rows.length && all.every(x => x <= TWO_HEELS_MS), JSON.stringify(rows.filter(r => r.heelsMs.some(x => x === null || x > TWO_HEELS_MS) || !r.done)));
    },
  },
];
