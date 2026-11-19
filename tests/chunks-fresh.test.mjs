// OLYMPUS tests: X4's other five rooms' committed plans are what the deriver gives today (the build sheet v0.0.22 item 13, §6 A, F75; house lens G2).
//
// The five rooms' plans are derived by tools/derive-plans.mjs and committed into src/data/chunks/x4.js as `derived@1` (the hub's
// "game world is handcrafted": a tool proposes, the author commits). When the router, the sight grid, the corner rule or the deriver
// changes, a committed plan would drift from what its rule now gives, silently: this test fails then, field for field, and the tool is
// rerun and the change said in CHANGELOG.md with the chunks' golden reprinted (tests/house-shapes.test.mjs X4_CHUNK_PLANS8). The
// second case changes a rule (the reach cap 1.0 m in place of POINT_REACH_M 1.55) and shows the families it moves go stale.
import { assert } from './helpers.mjs';
import { chunksFresh } from './flawless-rooms.mjs';

export default [
  {
    name: 'every committed derived@1 family of the five rooms (9: push and pull for the long, narrow, twin and small rooms, the offset room\'s fed-hinge) equals what the deriver gives today, field for field',
    fn() {
      const F = chunksFresh();
      for (const l of F.lines) console.log(`      ${l}`);
      console.log(`      ${F.n} families, ${F.stale.length} stale`);
      assert(F.n === 9 && !F.stale.length, JSON.stringify(F.stale));
    },
  },
  {
    name: 'a rule changed goes stale: with the reach cap at 1.0 m in place of POINT_REACH_M 1.55, the families whose turning man reaches past 1.0 m are no longer the deriver\'s',
    fn() {
      const F = chunksFresh({ reachM: 1.0 }), fams = [...new Set(F.stale.map(x => x.split(' ').slice(0, 2).join(' ')))];
      console.log(`      reach 1.0 m: ${fams.length} of ${F.n} families stale (${fams.join(', ')}); the fields ${[...new Set(F.stale.map(x => x.split(' ')[2]))].join(', ')}`);
      assert(fams.length > 0, 'no family moved: the test proves nothing');
    },
  },
];
