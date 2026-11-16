// OLYMPUS tests: the session's sheets side by side on one seed, room by room (the build sheet v0.0.20 §1 item 21; card C6).
//
// cards/house.js houseGrid is "Bang"'s gridTable form for the house: a row a leg, a column a sheet played on this seed this session,
// each cell the leg's time against its par in the run sheet's own words ("6.70 / 9.0", then FIRED FIRST and its faults), from
// houseNow's legs a sheet; houseGridEl draws it from two sheets. Two lanes from GO on 48213, the honest bot.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { houseNow, runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { houseGrid } from '../src/ui/cards/house.js';

export default [
  {
    name: 'two sheets on one seed give a grid of 4 legs by 2 sheets, each cell the leg\'s time against its par as the run sheet says it, the sheet just played marked',
    fn() {
      const runs = ['raider', 'tierone'].map((tier, i) => {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go' });
        runHouse(g, houseHonestBot());
        const hn = houseNow(g.state);
        return { label: hn.label, legs: hn.legs, now: i === 1, rows: runSheetOf(g.state).rows.map(r => r.words) };
      });
      const G = houseGrid(runs);
      for (const r of G.rows) console.log(`      ${r.word.padEnd(9)} ${r.cells.map(c => (c?.text ?? '–').padEnd(18)).join(' | ')}`);
      const timeOf = (words) => words.split(' · ')[1].replace(' S', '');
      const same = G.rows.every((r, k) => r.cells.every((c, j) => c.text.split(' · ')[0] === timeOf(runs[j].rows[k])));
      assert(G.rows.length === 4 && G.cols.length === 2 && G.now === 1 && same, JSON.stringify({ G, rows: runs.map(r => r.rows) }));
    },
  },
];
