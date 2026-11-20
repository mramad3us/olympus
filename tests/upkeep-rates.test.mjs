// OLYMPUS tests: the stoppages read the rifle's dirt (the build sheet v0.0.28 §6 A, item 18; WEAPONS §4.3, §9.3; F186): misfireP and jamP over the scene's states beside WEAPONS §4.3's closed form, and a lost firing pin retaining pin refused as 'broken' with ready() saying no.
//
// The formulas are as built in v0.0.5 (src/sim/arms/firearms.js), read over the states upkeep now makes (tests/flawless-books.mjs
// rateStates: fresh from the rack, after the breezy relay, after the gusty relay, cleaned at margin 5, the pin lost). Quick: the
// game's numbers equal to the closed form written out from firearms.js' constants, to the bit, and the pin's refusal; heavy: 200,000
// pulls a state through pull() itself, the misfires and the stoppages within 3 standard errors of the closed form.
import { assert } from './helpers.mjs';
import { rateStates, closedRates, gameRates, mcRates } from './flawless-books.mjs';
import { pull, ready, feel, REFUSALS } from '../src/sim/arms/firearms.js';
import { stream } from '../src/core/rng.js';

const per = (p) => (p > 0 ? `1 in ${Math.round(1 / p).toLocaleString('en-GB')}` : 'never');

export default [
  {
    name: 'F186: the stoppages read the dirt: misfireP and jamP over fresh, the breezy relay, the gusty relay and a clean\'s residual equal WEAPONS §4.3\'s closed form to the bit (printed a pull); a lost pin fires nothing, refused as \'broken\' ("Nothing: it wants the armourer."), felt dead, and ready() says no',
    fn() {
      const rows = rateStates().map(st => ({ st, closed: closedRates(st), game: gameRates(st) }));
      for (const r of rows) console.log(`      ${r.st.name}: misfire ${per(r.closed.fires ? r.closed.misfire : 0)}, stoppage ${per(r.closed.fires ? r.closed.jam : 0)}${r.closed.fires ? '' : ' (it does not fire)'}`);
      for (const r of rows) if (r.closed.fires) assert(r.game.misfire === r.closed.misfire && r.game.jam === r.closed.jam, JSON.stringify(r));
      const pin = rateStates().find(st => st.gun.fault), g = { ...pin.gun }, r = pull(stream(1, 'pin'), g, { ...pin.mag });
      const felt = feel({ chamber: 'live' }, r), rd = ready(g), rdFixed = ready({ ...g, fault: undefined });
      console.log(`      the pin lost: ${JSON.stringify(r)}, "${REFUSALS[r.why]}", felt ${felt.stoppage}; ready ${rd} (with a pin fitted ${rdFixed})`);
      assert(!r.fired && r.why === 'broken' && felt.stoppage === 'dead' && rd === false && rdFixed === true && g.rounds === undefined, JSON.stringify({ r, g }));
    },
  },
  {
    name: 'F186 (heavy): 200,000 pulls of each state through pull(): the misfires a pull and the stoppages a round fired within 3 standard errors of WEAPONS §4.3\'s closed form; the pin\'s never fire',
    heavy: true,
    fn() {
      const off = [];
      for (const st of rateStates()) {
        const N = 200_000, mc = mcRates(st, N), c = closedRates(st);
        if (!c.fires) { console.log(`      ${st.name}: ${mc.fired} fired, refused ${(mc.broken * 100).toFixed(1)}%`); if (mc.fired || mc.broken !== 1) off.push({ st: st.name, mc }); continue; }
        const seM = Math.sqrt(c.misfire * (1 - c.misfire) / N), seJ = Math.sqrt(c.jam * (1 - c.jam) / mc.fired);
        const zM = (mc.misfire - c.misfire) / seM, zJ = (mc.jam - c.jam) / seJ;
        console.log(`      ${st.name}: misfires ${(mc.misfire * 1e4).toFixed(2)} in 10,000 (closed ${(c.misfire * 1e4).toFixed(2)}, z ${zM.toFixed(2)}); stoppages ${(mc.jam * 1e4).toFixed(2)} in 10,000 rounds (closed ${(c.jam * 1e4).toFixed(2)}, z ${zJ.toFixed(2)})`);
        if (Math.abs(zM) > 3 || Math.abs(zJ) > 3) off.push({ st: st.name, mc, c, zM, zJ });
      }
      assert(!off.length, JSON.stringify(off));
    },
  },
];
