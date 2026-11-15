// OLYMPUS tests: the free arms and the flight in gravity, v0.0.16's hotfix (the user, 2026-11-15: "urgent : the walking animation ???
// What is going on with the arms flopping around like that", "running also... wth", "the running being long slow leaps is
// intentional ?"). The arms swing opposite their own legs, by the stride, within ARM_SWING_RAD; the take-off speed scales with
// sqrt(g), so the apex is one height in every gravity and only the flight's time grows.
import { assert, fmt } from './helpers.mjs';
import { cyclePose, bandSpec, ARM_SWING_RAD, flightLiftM } from '../src/art/figures/walk.js';
import { RUN_VZ_MS, LOPE_VZ_MS } from '../src/data/body/gait.js';
import { stepMOf } from '../src/sim/body/loco.js';
import { takeoffVzMs } from '../src/core/phys.js';

export default [
  {
    name: 'the free arms swing opposite each other within ARM_SWING_RAD in every cycle and band, never both back (they reached 1.41 rad walking and 2.30 running)',
    fn() {
      const rows = [];
      for (const c of ['A', 'B', 'C']) for (const band of ['walk', 'run']) {
        const n = 2 * bandSpec(c, band).fps, cap = ARM_SWING_RAD[band] + 1e-9;
        let most = 0;
        for (let k = 0; k < n; k++) {
          const p = cyclePose(c, band, k, {});
          const r = p.arms.r[0], l = p.arms.l[0];
          most = Math.max(most, Math.abs(r), Math.abs(l));
          assert(Math.abs(r) <= cap && Math.abs(l) <= cap, JSON.stringify({ c, band, k, r, l, cap }));
          assert(Math.abs(r + l) < 1e-9, JSON.stringify({ c, band, k, r, l, why: 'the arms swing opposite' }));
        }
        rows.push(`${c} ${band}: most ${fmt(most, 2)} rad`);
      }
      console.log(`      ${rows.join(' · ')}`);
    },
  },
  {
    name: 'a held rifle keeps the arms on the rifle: no free swing in a carry',
    fn() {
      for (const band of ['walk', 'run']) for (const carry of ['low', 'high', 'aim']) {
        const p = cyclePose('B', band, 1, { weapon: 'rifle', carry });
        assert(!p.arms, JSON.stringify({ band, carry, arms: p.arms }));
      }
    },
  },
  {
    name: 'the run\'s apex is the same height in every gravity and its flight grows as 1 / sqrt(g) (Mars 0.49 s and 10.9 cm before)',
    fn() {
      const rows = [];
      const base = flightLiftM(0.5, takeoffVzMs(RUN_VZ_MS, 9.80665), 9.80665);
      for (const [place, g] of [['1 G', 9.80665], ['Mars', 3.7265], ['Europa', 1.315]]) {
        const lift = flightLiftM(0.5, takeoffVzMs(RUN_VZ_MS, g), g), s = stepMOf({ gait: 'run', vMs: 4, gMs2: g });
        assert(Math.abs(lift - base) < 1e-9, JSON.stringify({ place, lift, base }));
        assert(Math.abs(s.flight - 2 * RUN_VZ_MS / Math.sqrt(9.80665 * g)) < 1e-9, JSON.stringify({ place, flight: s.flight }));
        rows.push(`${place}: flight ${fmt(s.flight * 1000, 0)} ms, apex ${fmt(lift * 100, 1)} cm, step ${fmt(s.stepM, 2)} m`);
      }
      assert(stepMOf({ gait: 'run', vMs: 4, gMs2: 3.7265 }).flight < 0.31, 'Mars flies about 0.30 s');
      assert(takeoffVzMs(LOPE_VZ_MS, 9.80665) === LOPE_VZ_MS, 'at 1 G the take-off speed is the figure itself');
      console.log(`      ${rows.join(' · ')}`);
    },
  },
];
