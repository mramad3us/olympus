// The wind on the range (src/sim/arms/wind.js; WEAPONS §7.4, §11.1; the build sheet 0.0.7 §2.1, §8 items 5 and 6): the truth a closed form, the flags, the drift it gives, the read by Marksmanship and the coach's call.
import { assert, near, fmt } from './helpers.mjs';
import { windAt, crossOf, pathWind, flagOf, windCorrOf, readWind, steadyCross, WIND_MEAN_MS, GUST_K, FLAG_FULL_MS } from '../src/sim/arms/wind.js';
import { flight, ENV_CLASSES as E } from '../src/sim/arms/ballistics.js';
import { SOL_MS } from '../src/core/clock.js';
import { armsWorld } from './arms-world.mjs';

const SEED = 48213, AT10 = 3 * SOL_MS + 10 * 3_600_000;           // (a sol's 10:00 by the clock's hours: the scene's hour)
const LINE = { x: 1300, z: 347.5 }, FACE = { x: 1600, z: 347.5 };

export default [
  {
    name: 'the wind at the 300 m line over an hour (seed 48213): the day\'s mean 2 to 6 m/s, drifting, veering and gusting; the flags lift with it, one after another down the range',
    fn() {
      const sp = [], cr = [], lifts = [];
      for (let s = 0; s < 3600; s += 5) {
        const ms = AT10 + s * 1000, w = windAt(SEED, ms, LINE.x, LINE.z);
        sp.push(w.speedMs); cr.push(crossOf(w, 0)); lifts.push(flagOf(SEED, ms, 1300, 299).liftK);
      }
      const mean = (a) => a.reduce((t, x) => t + x, 0) / a.length;
      console.log(`      speed: mean ${fmt(mean(sp), 2)}, min ${fmt(Math.min(...sp), 2)}, max ${fmt(Math.max(...sp), 2)} m/s; across the line ${fmt(Math.min(...cr), 2)} to ${fmt(Math.max(...cr), 2)} m/s (+ from the left)`);
      console.log(`      the 1300 m flag's lift: mean ${fmt(mean(lifts), 2)}, ${fmt(Math.min(...lifts), 2)} to ${fmt(Math.max(...lifts), 2)} (straight out at ${FLAG_FULL_MS} m/s)`);
      const flags = [1100, 1200, 1300, 1400, 1500, 1600].map(x => flagOf(SEED, AT10, x, 299));
      console.log(`      the north row at 10:00: ${flags.map((f, i) => `${1100 + 100 * i} ${fmt(f.liftK, 2)}`).join(', ')}`);
      assert(mean(sp) > WIND_MEAN_MS[0] * 0.6 && mean(sp) < WIND_MEAN_MS[1] * 1.3, 'the day\'s wind');
      assert(Math.max(...sp) / Math.min(...sp) > 1.3, 'it gusts and drifts');
      const seeds = Array.from({ length: 40 }, (_, i) => windAt(i + 1, AT10, 0, 0, { gust: false }).speedMs);
      console.log(`      40 worlds' steady wind at 10:00: ${fmt(Math.min(...seeds), 2)} to ${fmt(Math.max(...seeds), 2)} m/s (WIND_MEAN_MS ${WIND_MEAN_MS.join(' to ')}, ± the drift 25%)`);
      assert(Math.min(...seeds) >= WIND_MEAN_MS[0] * 0.75 - 1e-9 && Math.max(...seeds) <= WIND_MEAN_MS[1] * 1.25 + 1e-9, 'the steady wind within the day\'s mean and its drift');
    },
  },
  {
    name: 'the wind is pure: the same arguments give the same wind, and nothing is written (a lived and a skipped string feel one wind)',
    fn() {
      const a = windAt(SEED, AT10 + 123_456, 1350, 340), b = windAt(SEED, AT10 + 123_456, 1350, 340);
      assert(JSON.stringify(a) === JSON.stringify(b), 'the same');
      const W = armsWorld({ mrk: 10 }), before = JSON.stringify(W.state);
      pathWind(SEED, AT10, LINE, FACE); flagOf(SEED, AT10, 1300, 299); steadyCross(SEED, AT10, LINE, FACE);
      assert(JSON.stringify(W.state) === before, 'no state');
      const p = pathWind(SEED, AT10, LINE, FACE);
      console.log(`      ${JSON.stringify(a)}; along the 300 m path at 10:00: across ${fmt(p.crossMs, 2)}, head ${fmt(p.headMs, 2)} m/s; the gust's depth ±${GUST_K * 100}%`);
    },
  },
  {
    name: 'the drift a crosswind gives by speed and range (Didion\'s lag rule): linear in the speed within 1%',
    fn() {
      const rows = [200, 300, 500].map(d => `${d} m: ${[1, 2, 4, 6, 8].map(w => fmt(flight('6.5x40r', 'ball', 460, E['mars-valley'], d, { crossMs: w }).driftCm, 1)).join(', ')} cm`);
      console.log(`      drift at 1, 2, 4, 6 and 8 m/s: ${rows.join(' · ')}`);
      for (const d of [200, 300, 500]) {
        const one = flight('6.5x40r', 'ball', 460, E['mars-valley'], d, { crossMs: 1 }).driftCm;
        for (const w of [2, 4, 6, 8]) near(flight('6.5x40r', 'ball', 460, E['mars-valley'], d, { crossMs: w }).driftCm / (one * w), 1, 0.01, `${d} m at ${w} m/s`);
      }
    },
  },
  {
    name: 'the read by Marksmanship 6, 10, 14, 18 and with the coach: its error within ±(1 − windCorr) every draw, the coach\'s call tighter than a Marksmanship 10 read; never the truth\'s gusts',
    fn() {
      const out = [];
      const errOf = (mrk, coach) => {
        const W = armsWorld({ mrk }), s = W.state, me = s.actors.list.find(a => a.who === W.pid) ?? { x: LINE.x, z: LINE.z };
        let sum = 0, n = 0, worst = 0;
        const corr = windCorrOf(mrk, { coach });
        for (let i = 0; i < 400; i++) {
          const atMs = AT10 + i * 7_000, rd = readWind(s, W.pid, { atMs, bearingRad: 0, coach, rangeM: 300, from: me });
          const truth = steadyCross(s.meta.seed, atMs, me, { x: me.x + 300, z: me.z });
          if (Math.abs(truth) < 0.5) continue;
          const e = rd.crossMs / truth - 1, tol = 1 - corr + 0.05 / Math.abs(truth);
          worst = Math.max(worst, Math.abs(e) - tol);
          sum += Math.abs(rd.crossMs - truth) / Math.abs(truth); n++;
        }
        return { mean: sum / n, n, corr, worst };
      };
      for (const [mrk, coach] of [[6, false], [10, false], [14, false], [18, false], [10, true], [14, true]]) {
        const e = errOf(mrk, coach);
        out.push({ mrk, coach, ...e });
        console.log(`      MRK ${mrk}${coach ? ' with the coach' : ''}: windCorr ${fmt(e.corr, 3)}, mean |error| / truth ${fmt(e.mean, 3)} over ${e.n} reads (uniform within ±${fmt(1 - e.corr, 2)}: ${fmt((1 - e.corr) / 2, 3)} expected)`);
        assert(e.worst <= 1e-9, `a read outside ±(1 − windCorr): ${e.worst}`);
      }
      const m10 = out.find(o => o.mrk === 10 && !o.coach), c10 = out.find(o => o.mrk === 10 && o.coach);
      assert(c10.mean < m10.mean, 'the coach\'s call is tighter');
      assert(out[0].mean > out[3].mean, 'a recruit reads worse than a sergeant');
      const W = armsWorld({ mrk: 10 }), rd = readWind(W.state, W.pid, { atMs: AT10, bearingRad: 0 });
      console.log(`      a read: ${JSON.stringify(rd)}`);
      assert(Array.isArray(rd.band) && rd.band[0] <= rd.crossMs + 1e-9 && rd.crossMs <= rd.band[1] + 1e-9 && typeof rd.fromWord === 'string', 'the read\'s shape');
    },
  },
];
