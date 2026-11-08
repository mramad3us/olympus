// OLYMPUS tests: "Three bangs" (test-pairs&setup=bangs) as v0.0.9 played it (the user's rule, standing since 0.0.8: "test-pairs and
// 'Three bangs' as built must not get worse"; the build sheet 0.0.10 §3.3). Every sheet on seeds 48213, 7 and 99, the pairs bot
// from the brief to the card: the last tick and a hash of every string's paper, the course's summary and the bangs' card line
// are v0.0.9's, printed by v0.0.9's own code (a worktree at the tag, the integrator's run of 2026-11-08). Only the save's digest
// moves in 0.0.10, on purpose: BODY §9.3's stress fold raises the body's stress by felt's band (the recruit about +14, the tier
// one 0) and stamps the block's stressAtMs; it never reaches 50, so no roll moves. A change here is a change to "Three bangs":
// re-set the pins only on purpose, and say so in CHANGELOG.md.
import { createHash } from 'node:crypto';
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { pairsBot } from './bots/pairs.mjs';
import { pairsNow } from '../src/sim/scenarios/pairs.js';

/** [sheet seed, last tick, the hash of { papers, summary, bangs }]: v0.0.9's own code. */
const V009 = Object.freeze([
  ['recruit 48213', 2422, 'be4635b0628f7a'],
  ['recruit 7', 2583, '9c939886c38339'],
  ['recruit 99', 2522, '0c6cb12c2344b2'],
  ['private 48213', 2042, 'f429913309b17b'],
  ['private 7', 2003, 'f748a831c28026'],
  ['private 99', 1962, '72249de8cdb68c'],
  ['sgt 48213', 1622, '55fe6fc132ca35'],
  ['sgt 7', 1563, '4c815d0861e2c9'],
  ['sgt 99', 1522, 'dc802c0b5ae682'],
  ['raider 48213', 1442, '9776957990fde8'],
  ['raider 7', 1323, '4944293a362392'],
  ['raider 99', 1302, '85ff9b3afeb465'],
  ['tierone 48213', 1302, '0f15a80aed9476'],
  ['tierone 7', 1243, '0c2f07c5f7a94d'],
  ['tierone 99', 1182, '9ef72b65763a8c'],
]);

const paperOf = (p) => (typeof p === 'string' ? p : p?.text ?? null);

export default [
  {
    name: '"Three bangs" plays as v0.0.9 did: every sheet on 48213, 7 and 99, the pairs bot to the card on v0.0.9\'s last tick, with v0.0.9\'s papers, summary and bangs line (the user\'s rule: "Three bangs" as built must not get worse; only the digest moves, by the stress fold)',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    timeoutMs: 300_000,
    fn() {
      const bad = [];
      for (const [key, tick, hash] of V009) {
        const [tier, seed] = key.split(' ');
        const g = createGame({ scenario: 'test-pairs', seed: Number(seed), tier, setup: 'bangs', version: '0.0.0' }), b = pairsBot();
        for (let t = 0; t < 40_000 && !pairsNow(g.state)?.end; t++) { g.step(1, b); g.clearFacts(); }
        const p = pairsNow(g.state);
        const got = createHash('sha1').update(JSON.stringify({ papers: (p?.strs ?? []).map(s => paperOf(s.paper)), summary: p?.summary ?? null, bangs: p?.bangs?.summary ?? null })).digest('hex').slice(0, 14);
        const same = got === hash && g.state.clock.tick === tick;
        console.log(`      ${key}: tick ${g.state.clock.tick} (v0.0.9 ${tick}), papers ${got === hash ? 'as v0.0.9' : `DIFFER ${got}`}; ${p?.bangs?.summary ?? '-'}`);
        if (!same) bad.push({ key, tick: g.state.clock.tick, want: tick, got, hash });
      }
      assert(!bad.length, JSON.stringify(bad));
    },
  },
];
