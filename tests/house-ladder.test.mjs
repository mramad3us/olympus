// OLYMPUS tests: GO at your standard and not at the next, the ladder held (the build sheet v0.0.21 §1 item 10, F69, F70; done lens D4).
//
// Every sheet of "Stack and clear" should read as a rung up from the one below: its take-in, its first round and its lane faster by a
// real step (F69), and the instructor's verdict should mean something: a GO at your own standard, a NO-GO when the same run is judged
// by the next class up (F70, shoothouse.js houseVerdict(state, { standard })). The quick case is the thinnest pair on one seed (the
// Raider and the tier one on 48213: their lanes 2.1% apart, the take-in 70 ms, the first round 53 ms) and the private judged at the
// advanced class (fails without the standard option: the verdict judged every run at its own class only). The heavy case is the
// sweep: the six sheets on 40 seeds by their own bots, F69 and F70 enforced (tests/flawless-done.mjs), each sheet's numbers and the
// NO-GOs' reasons printed.
import { assert } from './helpers.mjs';
import { ladderLane, ladderLanes, ladderRow, standardsRow, sheetMeans, printDone, doneFailing, LADDER_SEEDS } from './flawless-done.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { sheetBot } from './flawless-card.mjs';
import { houseVerdict } from '../src/sim/scenarios/shoothouse.js';

export default [
  {
    name: 'the ladder\'s thinnest pair on one seed (the Raider and the tier one on 48213): the tier one\'s take-in, first round and lane under the Raider\'s by the floors; and the private\'s lane, a GO at his own basic class, a NO-GO judged at the advanced (fails without houseVerdict\'s standard)',
    fn() {
      const recs = ['raider', 'tierone'].map(t => ladderLane(t, 48213)), row = ladderRow(recs, ['raider', 'tierone']);
      printDone('the pair on 48213 (F69 on two sheets)', [row]);
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' });
      assert(runHouse(g, sheetBot('private')).done, 'the private\'s lane to its card');
      const s = g.state, own = houseVerdict(s), same = houseVerdict(s, { standard: 'basic' }), adv = houseVerdict(s, { standard: 'advanced' }), op = houseVerdict(s, { standard: 'operator' });
      console.log(`      the private on 48213 (his class ${s.armoury.range.house.par}): own ${own.go ? 'GO' : 'NO-GO'} (missed ${own.missed}${own.why.length ? `, ${own.why.join(', ')}` : ''}); at basic the same to the key ${JSON.stringify(same) === JSON.stringify(own)}; at advanced ${adv.go ? 'GO' : 'NO-GO'} (missed ${adv.missed}, ${adv.why.join(', ')}); at operator ${op.go ? 'GO' : 'NO-GO'} (missed ${op.missed})`);
      assert(row.met && recs.every(r => r.done), JSON.stringify(row.steps));
      assert(own.go === true && JSON.stringify(same) === JSON.stringify(own) && adv.go === false && adv.standard === 'advanced' && adv.why.includes('pars') && op.missed >= adv.missed, JSON.stringify({ own, adv, op }));
    },
  },
  {
    name: 'the ladder and the standards over 40 seeds (heavy): the six sheets by their own bots, take-in, first round and lane strictly ordered by the floors (F69), each a GO at its own standard on 90% and the private and the sergeant a NO-GO at the next class up on 80% (F70)',
    heavy: true,
    timeoutMs: 30 * 60_000,
    fn() {
      const t0 = performance.now(), recs = ladderLanes(), m = sheetMeans(recs);
      for (const x of m) console.log(`      ${x.tier.padEnd(8)} ${x.n} lanes: take-in ${x.takeInMs.toFixed(0)} ms, first round ${x.firstMs.toFixed(0)} ms, lane ${(x.laneMs / 1000).toFixed(2)} s; GO at its own ${Math.round(100 * x.goOwn)}%${x.nogoUp !== null ? `, NO-GO at ${x.next} ${Math.round(100 * x.nogoUp)}%` : ''}; NO-GO by ${Object.entries(x.whyOwn).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`);
      const rows = [ladderRow(recs), standardsRow(recs)];
      printDone(`the ladder on ${LADDER_SEEDS.length} seeds (${recs.length} lanes, ${((performance.now() - t0) / 1000).toFixed(0)} s)`, rows);
      const bad = doneFailing(rows);
      assert(recs.every(r => r.done) && !bad.length, bad.join(' | ') || 'a lane short of its card');
    },
  },
];
