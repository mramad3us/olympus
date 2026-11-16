// OLYMPUS tests: the race at the door against men who fire back (COMBAT §25.18, the build sheet v0.0.19 §10's balance risk; F44's numbers), heavy: by sheet, the share of live lanes with paint on you or your #2, the share where a role-player fired first, and the gap between his first round and yours.
//
// Printed before anything is tuned (the build sheet's §10: the recruit may often end a casualty in room 3, the role-player there
// seeing #1 first). Each sheet plays ten seeds with their drawn cards by the honest bot (the keys' below rung 2), and for each
// role-player who fired the gap is his first round less the stack's first round on him (over 0: he fired first). Held: every
// lane reaches its card; the tier one's share with paint is at most the recruit's (the contrast the scene is for).
import { assert } from './helpers.mjs';
import { liveLane } from './flawless-live.mjs';
import { SHEETS, mean, quantile, s2 } from './flawless.mjs';

export default [
  {
    name: 'v0.0.19: by sheet over ten seeds of the live lane: lanes with paint on the stack, lanes where he fired first, the first-round gap (printed); every lane to its card, the tier one painted no more often than the recruit',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const by = {};
      for (const tier of SHEETS) for (let i = 0; i < 10; i++) {
        const r = liveLane({ tier, seed: 7000 + 41 * i }), o = by[tier] ??= { n: 0, done: 0, paint: 0, first: 0, gaps: [], cas: 0 };
        o.n++; if (r.done) o.done++; if (r.live.paint > 0) o.paint++; if (r.end === 'casualty') o.cas++;
        for (const V of r.liveGaps ?? []) { o.gaps.push(V); if (V > 0) o.first++; }
      }
      for (const [t, o] of Object.entries(by)) console.log(`      ${t.padEnd(8)} ${o.done}/${o.n} to the card; paint on the stack ${o.paint} (${Math.round(o.paint / o.n * 100)}%), casualties ${o.cas}; he fired first ${o.first} of ${o.gaps.length} men who fired; the gap p50 ${s2((quantile(o.gaps, 0.5) ?? 0) / 1000)} s, mean ${s2((mean(o.gaps) ?? 0) / 1000)} s`);
      assert(Object.values(by).every(o => o.done === o.n), JSON.stringify(by));
      assert(by.tierone.paint <= by.recruit.paint, JSON.stringify({ tierone: by.tierone, recruit: by.recruit }));
    },
  },
];
