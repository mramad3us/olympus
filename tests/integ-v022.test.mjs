// OLYMPUS tests: the v0.0.22 integration's own findings, each a merge of the round's roles with v0.0.21's tag and the hunt of v0.0.20's fixes that broke a gauge, each failing without its fix.
//
// SHOW CLEAR's skip (FL22-1, shoothouse.js houseSecond's house-showclear: lived ticks behind the brief splash) froze your number
// two's tower admin, since the house's actors layer sat out every skip: his P-12's clear, its halted part planned again (v0.0.21's
// pistol fix) after your guns had passed, outlived the skip twoLeftMs had timed for it, and a stop-motion pause opened on its last
// tick before "Number two: clear." (F82: no pause in the tail). The keys recruit on 4, live, is the lane the full suite met it on.
import { assert } from './helpers.mjs';
import { endLane } from './flawless-end.mjs';

export default [
  {
    name: 'your #2\'s admin goes on through SHOW CLEAR\'s skip: the keys recruit on 4, live, his P-12\'s clear outlasting your guns\' pass, reaches the wash with no pause in the tail (F82; fails with houseActors sitting the skip out: one pause, the #2\'s pistol:clear held 3.7 s past its time)',
    fn() {
      const r = endLane({ tier: 'recruit', seed: 4, bot: 'keys', opfor: 'live' });
      console.log(`      ${r.cell}: ${r.done ? `to the card (${r.end})` : 'NOT to the card'}; the tail ${r.tail?.realMs} ms real (${r.tail?.gameMs} ms of game time), ${r.tail?.pauses} pauses, washed ${r.tail?.washed}; the wash "${r.wash}"`);
      assert(r.done && r.tail && r.tail.washed && r.tail.pauses === 0 && r.tail.realMs <= 1500, JSON.stringify({ cell: r.cell, done: r.done, tail: r.tail }));
    },
  },
];
