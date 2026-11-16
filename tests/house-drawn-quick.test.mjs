// OLYMPUS tests: the gauges on drawn lanes, the quick cut (the build sheet v0.0.21 §1 item 17, §6 B; house lens H8): two drawn seeds by the honest tier one and one by the keys private, F1 to F26 watched as on the set.
//
// Each lane is the house drawn from its seed (createGame's `draw: 'drawn'`), watched by tests/flawless.mjs flawlessLane and summed
// by flawless-drawn.mjs drawnGaugeOf (F3 judged on each lane's own house; F13, F15 and F22 the set's, their drawn twins F65 and F63).
// Enforced here: DRAWN_HOLD, the rows every lane of B's 80-lane drawn sweep met, and F65 (the stops against the lane's own budget)
// for the tier one; printed: the rest, DRAWN_OPEN's findings among them, which the heavy house-drawn enforces as on the set. The
// seeds are the first two drawn seeds and the first, not chosen.
import { assert } from './helpers.mjs';
import { drawnLane, drawnGaugeOf, f65, DRAWN_HOLD, DRAWN_OPEN } from './flawless-drawn.mjs';
import { createGame, withHouse } from './game.mjs';
import { houseBot } from './bots/house.mjs';

export default [
  {
    name: 'drawn seeds 1 and 2 by the honest tier one and 1 by the keys private, every lane to its card: the rows every drawn lane holds (F1, F3 on its own house, F5, F7, F8, F9, F11, F14, F16, F17, F19, F24, F26) met, F65 met; the drawn findings printed',
    timeoutMs: 120_000,
    fn() {
      const recs = [drawnLane({ tier: 'tierone', seed: 1, bot: 'honest', setup: 'go', fill: { draw: 'drawn' } }), drawnLane({ tier: 'tierone', seed: 2, bot: 'honest', setup: 'go', fill: { draw: 'drawn' } }),
        drawnLane({ tier: 'private', seed: 1, bot: 'keys', setup: 'go', fill: { draw: 'drawn' } })];
      console.log(`      ${recs.map(r => `${r.tier} ${r.seed} ${r.code.split('|')[0]}: ${r.end}, ${r.laneS} s`).join(' · ')}`);
      const rows = [...drawnGaugeOf(recs), f65(recs)];
      for (const r of rows) console.log(`      ${r.id.padEnd(3)} ${r.met ? 'MET ' : 'OPEN'} ${r.name}: ${String(r.value).slice(0, 260)}${DRAWN_OPEN[r.id] ? ' [a drawn finding: house-drawn]' : ''}`);
      const bad = rows.filter(r => (DRAWN_HOLD.includes(r.id) || r.id === 'F65') && !r.met);
      assert(recs.every(r => r.done) && !bad.length, bad.map(r => `${r.id}: ${r.value}`).join(' | ') || JSON.stringify(recs.map(r => [r.tier, r.seed, r.done])));
    },
  },
  {
    name: 'withHouse draws only the games that name no house: a createGame inside it with `draw: \'set\'` plays the set, one naming nothing the drawn house (the review of v0.0.21: seed 5\'s explicit set was drawn)',
    fn() {
      const codeOf = (o) => createGame({ scenario: 'test-shoothouse', seed: 5, tier: 'sgt', ...o }).state.armoury.range.house.draw?.code ?? 'A';
      const [set, none, named] = withHouse({ draw: 'drawn' }, () => [codeOf({ draw: 'set' }), codeOf({}), codeOf({ house: 'Cn290pc.Ks206lc.En175pc' })]);
      const outside = codeOf({});
      console.log(`      inside withHouse({ draw: 'drawn' }): draw 'set' ${set}, none named ${none}, a house named ${named}; outside, none named ${outside}`);
      assert(set === 'A' && none !== 'A' && named.startsWith('Cn290pc.Ks206lc.En175pc|') && outside === 'A', JSON.stringify({ set, none, named, outside }));
    },
  },
  {
    name: 'the tower\'s words on a drawn house never name lane A: the brief and the standby on the PA (courses.js SEQ_HOUSE_DRAWN by handling.js seqOf); the set\'s are v0.0.20\'s (the review of v0.0.21: "Lane A" over a drawn house)',
    timeoutMs: 60_000,
    fn() {
      // (the lane from the brief to GO by the calm bot, every PA line the tower said kept)
      const pa = (o) => {
        const g = createGame({ scenario: 'test-shoothouse', seed: 17, tier: 'sgt', ...o }), bot = houseBot({ mode: 'keys' }), said = [];
        for (let n = 0; n < 6000 && g.state.armoury.range.house.goAtMs === null; n++) { g.step(1, bot); for (const [t, f] of g.facts()) if (t === 'say' && f.kind === 'pa') said.push(f.text); g.clearFacts?.(); }
        return said;
      };
      const set = pa({}), drawn = pa({ draw: 'drawn' }), lane = (xs) => xs.filter(x => /\blane A\b/i.test(x));
      console.log(`      set: ${set.length} PA lines, naming lane A ${lane(set).length} ("${lane(set)[0] ?? ''}"); drawn: ${drawn.length}, naming lane A ${lane(drawn).length}; the drawn brief "${(drawn[0] ?? '').slice(0, 60)}…"`);
      assert(set.length >= 3 && lane(set).length >= 1 && drawn.length >= 3 && !lane(drawn).length, JSON.stringify({ set, drawn }));
    },
  },
];
