// OLYMPUS tests: the lane timer's head names the house the lane is on (the A and D review of v0.0.22, 2026-11-16): "LANE B" on layout B, as the end card, the run sheet and the score line say, "NEW LAYOUT" on another drawn house, "LANE A" as set.
//
// Pure, in node: houseNow (shoothouse.js) gives a named house's letter, B or C (its record's layout, else its code's: a code of B's
// rooms pasted with &house= is B), null on another drawn house with `drawn` true; the timer's model (hud/timer.js laneModel) heads
// with it. Before the fix every drawn lane, B and C among them, read "LANE A" on the HUD while its card said "lane B".
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseNow } from '../src/sim/scenarios/shoothouse.js';
import { laneModel } from '../src/ui/hud/timer.js';
import { HOUSE_LAYOUTS } from '../src/sim/scenes/assemble.js';

export default [
  {
    name: 'the lane timer heads "LANE B" on layout B and "LANE C" on layout C (by the layout or by its code pasted), "NEW LAYOUT" on another drawn house, "LANE A" as set (fails with houseNow\'s lane null on every drawn house)',
    fn() {
      const at = (o) => { const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', ...o }), hn = houseNow(g.state); return { lane: hn.lane, drawn: hn.drawn, head: laneModel(hn, g.state.clock.ms).head }; };
      const rows = { set: at({}), B: at({ layout: 'B' }), C: at({ layout: 'C' }), Bcode: at({ draw: 'drawn', house: HOUSE_LAYOUTS.B }), drawn: at({ draw: 'drawn' }) };
      console.log(`      ${Object.entries(rows).map(([k, v]) => `${k}: "${v.head}" (lane ${v.lane}, drawn ${v.drawn})`).join('; ')}`);
      assert(rows.set.head === 'LANE A' && rows.B.head === 'LANE B' && rows.C.head === 'LANE C' && rows.Bcode.head === 'LANE B' && rows.drawn.head === 'NEW LAYOUT', JSON.stringify(rows));
      assert(rows.set.lane === 'A' && rows.B.lane === 'B' && rows.drawn.lane === null && rows.drawn.drawn && !rows.set.drawn, JSON.stringify(rows));
    },
  },
];
