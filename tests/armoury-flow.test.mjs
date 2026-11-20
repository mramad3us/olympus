// OLYMPUS tests: "The window and the canopy" played to its card by the honest marine, F171's and F174's quick half (the build sheet v0.0.28 items 1 to 16, §6 B, §8).
//
// The private by the keys on 48213 (tests/bots/armoury.mjs armouryBot: the habits kept, the DI's tempo, the far cases walked to): the card,
// the real and the game minutes, the records (both rifles, out and in, the log), the issue's sums (issued, handed, fired, back), the brass
// (policed equals fired: F174's honest lane), the faults (none). Fails without the scene: its fill, its course on the engine, its bot's rows.
import { assert } from './helpers.mjs';
import { armGame, laneMemo } from './armoury-world.mjs';
import { armouryOf } from '../src/sim/scenarios/armoury-day.js';
import { checkIds } from './ids-check.mjs';

export default [
  {
    name: 'F171, F174 (quick): the private by the keys on 48213 to the card, the slip met (caught at the window), no fault, brass policed equal to fired, the rifle signed out and in',
    fn() {
      // (the lane armoury-world plays once a process, which arm-words and arm-save read too)
      const L = laneMemo(), g = L.game, out = L.out, t0 = armGame({ seed: 48213, tier: 'private' }).state.clock.ms;
      const s = g.state, R = armouryOf(s), A = R.arm, line = s.armoury.ammoIssues.find(a => a.id === R.issueId), rec = s.armoury.guns[A.gunId], slipRec = s.armoury.guns[A.slipId];
      const ids = checkIds(JSON.parse(g.save()), g.sim.domains);
      console.log(`      ${out.card?.summary}`);
      console.log(`      ${out.ticks} ticks, ${(out.ticks / 1200).toFixed(2)} real min, ${((s.clock.ms - t0) / 60000).toFixed(1)} game min; the slip ${A.slip} (caught ${!!A.slipCaught}, found ${A.slipFound}), the short count ${A.short}; the relay ${JSON.stringify(A.relay)}`);
      console.log(`      the issue: ${JSON.stringify(line)}; brass policed ${R.policed} of ${line?.fired} fired, left ${Object.values(R.brassTiles ?? {}).reduce((t, x) => t + x.mine, 0)}`);
      console.log(`      your rifle ${A.gunId}: ${rec.loc}, log ${rec.log.map(l => l.what).join(' ')}; the slip's ${A.slipId}: ${slipRec.loc}, log ${slipRec.log.map(l => l.what).join(' ') || 'none'}; ids ${ids.invalid.length + ids.dangling.length ? 'BAD' : 'clean'}; faults ${JSON.stringify(out.faults)}`);
      assert(out.done && out.end?.phase === 'clear' && !out.stuck, JSON.stringify(out.stuck ?? out.end));
      assert(!out.faults.length, JSON.stringify(out.faults));
      assert(line.fired > 0 && R.policed === line.fired, JSON.stringify({ policed: R.policed, fired: line.fired }));
      assert(rec.loc === 'rack' && rec.log.some(l => l.what === 'out') && rec.log.at(-1).what === 'in', JSON.stringify(rec));
      assert(A.signedIn && A.passed && !A.late, JSON.stringify({ signedIn: A.signedIn, passed: A.passed, late: A.late }));
      assert(!ids.invalid.length && !ids.dangling.length, JSON.stringify({ invalid: ids.invalid.slice(0, 3), dangling: ids.dangling.slice(0, 3) }));
      assert(g.errors.length === 0, g.errors.join('; '));
    },
  },
];
