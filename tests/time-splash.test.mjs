// The splash's timing (TIME §6.2, §6.5; the build sheet 0.0.4 §2.2.5, §4; TIME's test 11): the
// time-lapse's real seconds by the gap, every phase of a full and a brief splash, the ease of the
// shown clock and the sim's targets under it. Prints S(m) at TIME §6.2's gaps, the sheet's §4 table of
// splash seconds, the ease at its joints; holds the shower's 4.29 s and the night's 7.67 s, targets
// on whole minutes and toMs at the end, and no strip that waits for a key without a failed roll.
import { assert, near, fmt } from './helpers.mjs';
import { lapseS, splashPlan, ease, targetAt, interruptTimes, stripWaits, EASE_R, FULL_FROM_MS, SHORT_LAPSE_S } from '../src/sim/time/splash.js';
import { MIN_MS } from '../src/core/clock.js';

const plan = (gapMs, engine = gapMs < 120_000 ? 'ff' : 'outcome', opts = {}) => splashPlan({ id: 'k1', fromMs: 0, toMs: gapMs, engine }, opts);

export default [
  {
    name: 'S(m) = clamp(1.4 + 0.95 ln(1 + m/4), 1.6, 8.0) at TIME §6.2\'s gaps, and the full splash adds 0.4 + 0.8 + 0.5 s: the 10-minute shower 4.29 s, a night from 22:00 to 05:30 7.67 s (the brief\'s "Ten minutes under the shower" and its night)',
    fn() {
      const gaps = [2, 5, 10, 20, 30, 60, 120, 240, 480, 1440];
      const table = { 2: 1.8, 5: 2.2, 10: 2.6, 20: 3.1, 30: 3.4, 60: 4.0, 120: 4.7, 240: 5.3, 480: 6.0, 1440: 7.0 };
      const rows = gaps.map(m => { const L = lapseS(m), full = plan(m * MIN_MS).totalS; near(L, table[m], 0.051, `S(${m})`); return `${m} min ${fmt(L, 2)} s (full ${fmt(full, 2)})`; });
      console.log(`      TIME §6.2's gaps: ${rows.join(', ')}`);
      const shower = plan(10 * MIN_MS), night = plan(489.6 * MIN_MS), testNight = plan((494 + 35 / 60) * MIN_MS);
      near(shower.totalS, 4.29, 0.01, 'the shower');
      near(night.totalS, 7.67, 0.01, 'a night 22:00 to 05:30');
      assert(shower.form === 'full' && night.form === 'full' && shower.inS === 0.4 && shower.holdS === 0.8 && shower.outS === 0.5, JSON.stringify(shower));
      const sheet = [['a 10-minute shower', 10], ['a night 22:00 to 05:30', 489.6], ['test-night 21:55 to 05:30', 494 + 35 / 60], ['bowel 6 min', 6], ['basin 3 min', 3], ['basin 7 min', 7], ['dress 5.2 min', 5.2], ['dress 4.4 min', 4.4], ['nap 45 min', 45], ['wait 15 min', 15]];
      for (const [what, m] of sheet) { const p = plan(m * MIN_MS); console.log(`      ${what}: the lapse ${fmt(p.lapseS, 2)} s, ${p.form} ${fmt(p.totalS, 2)} s (in ${p.inS}, strip ${p.holdS}, out ${p.outS})`); }
      const urinate = plan(75_000, 'ff');
      assert(urinate.form === 'brief' && urinate.inS === 0 && urinate.outS === 0 && urinate.holdS === 0.4, JSON.stringify(urinate));
      near(urinate.lapseS, 1500 / 40 / 60, 1e-9, 'a 75 s fast-forward at 40 ticks a frame');
      console.log(`      urinate 75 s: a brief fast-forward at the engine's pace, 1,500 ticks at 40 a frame: ${fmt(urinate.lapseS, 3)} s, then a ${urinate.holdS} s strip (total ${fmt(urinate.totalS, 2)} s); test-night planned ${fmt(testNight.totalS, 2)} s`);
      assert(lapseS(0.5) === 1.6 && lapseS(100_000) === 8.0 && lapseS(10, { short: true }) === SHORT_LAPSE_S, 'the clamp and short splashes');
      const brief2 = plan(150_000, 'outcome');
      assert(brief2.form === 'brief' && FULL_FROM_MS === 180_000 && plan(180_000).form === 'full', JSON.stringify(brief2));
      console.log(`      a 2.5-minute outcome skip: brief, lapse ${fmt(brief2.lapseS, 2)} s; full from ${FULL_FROM_MS / 60_000} min; short splashes ${SHORT_LAPSE_S} s`);
    },
  },
  {
    name: 'the shown clock\'s ease runs its first 15% and last 20% at 40% of the middle\'s rate; the sim\'s target sits on whole minutes, never past toMs, and is toMs once the lapse is over',
    fn() {
      const at = [0, 0.15, 0.5, 0.8, 1].map(t => [t, ease(t)]);
      console.log(`      ease: ${at.map(([t, p]) => `${t} → ${fmt(p, 4)}`).join(', ')} (R = ${fmt(EASE_R, 4)} = 1 / 0.79)`);
      near(ease(0), 0, 1e-12); near(ease(1), 1, 1e-12); near(ease(0.15), 0.4 * EASE_R * 0.15, 1e-12); near(EASE_R, 1 / 0.79, 1e-12);
      // (slopes: the ends at 0.4 R, the middle at R)
      const slope = (a, b) => (ease(b) - ease(a)) / (b - a);
      near(slope(0.01, 0.1), 0.4 * EASE_R, 1e-9, 'start'); near(slope(0.2, 0.7), EASE_R, 1e-9, 'middle'); near(slope(0.85, 0.95), 0.4 * EASE_R, 1e-9, 'end');
      for (let t = 0; t < 1; t += 0.001) assert(ease(t + 0.001) >= ease(t), `the ease goes back at ${t}`);
      const p = plan(10 * MIN_MS), from = 23_505_040_750, to = from + 10 * MIN_MS;
      let last = from, frames = 0, offMinute = 0;
      for (let t = 0; t <= p.lapseS + 0.05; t += 1 / 60, frames++) {
        const x = targetAt(p, from, to, t);
        assert(x >= last && x <= to, `target ${x} at ${t}`);
        if (x !== to && x !== from && x % MIN_MS !== 0) offMinute++;
        last = x;
      }
      assert(last === to && offMinute === 0 && targetAt(p, from, to, p.lapseS) === to, `the last target ${last}, ${offMinute} off the minute`);
      const it = interruptTimes(1), d = interruptTimes(0);
      assert(it.decelS === 0.35 && it.beatS === 0.6 && it.outS === 0.5 && d.outS === 0.25, JSON.stringify({ it, d }));
      assert(!stripWaits({ failedRoll: false }) && stripWaits({ failedRoll: true }) && !stripWaits(null), 'the strip waits only on a failed roll');
      console.log(`      the shower's targets over ${frames} frames at 60 Hz: every one on a whole minute until toMs, the last toMs itself; an interrupt: decel ${it.decelS} s, beat ${it.beatS} s, out ${it.outS} s (a danger ${d.outS} s); the strip waits only on a failed roll (none this round)`);
    },
  },
];
