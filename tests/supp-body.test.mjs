// The chaos in the body's stress, and the body's toll back on hardening (BODY §9.3; COMBAT §5.3; the build sheet 0.0.10 §2.1, §5.1, §8 item 20).
//
// stressGainOf (0.3 a second suppressed, 0.6 pinned, by felt's band, in closed form over the pool's linear pieces: the
// grace, the plain decay, Breathe's window) against a 1 ms reference for several pools, hardenings and windows; nothing
// under felt 45. Over "Three bangs" (no ear defenders) by sheet, played by the pairs bot through the banged string and the
// pool's emptying: the recruit about +14, the tier one and the Raider 0, never 50 (on edge), so no roll moves. Over
// test-stress (ear defenders on) by sheet and string, played by the stress bot: the tier one 0 everywhere. And the toll:
// a body forced to stress 80 (frayed) takes HARD_TOLL.frayed off hardening, the same pool reaching the hands harder.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { pairsBot } from './bots/pairs.mjs';
import { SCENARIOS } from '../src/sim/game.js';
import { bodyOf, bodySync } from '../src/sim/body/body.js';
import { addStress } from '../src/sim/body/stress.js';
import { stressGainOf, feltFrom, suppAt, hardOf, hardParts, bandOf, SUPP_STRESS_PER_S, SUPP_DECAY, HARD_TOLL } from '../src/sim/combat/supp.js';

// (the reference: felt's band read every ms, its rate summed)
function reference(rec, H, a, b) {
  let sum = 0;
  for (let t = a; t < b; t++) sum += SUPP_STRESS_PER_S[bandOf(feltFrom(suppAt(rec, t + 0.5), H))] ?? 0;
  return sum / 1000;
}
const play = (g, bot, n) => {
  let gain = 0, folds = 0, peak = 0;
  for (let i = 0; i < n; i++) {
    g.step(1, bot);
    for (const [t, d] of g.bus.events) if (t === 'body-event' && d.kind === 'stress' && d.who === g.state.player.id) { gain += d.amount; folds++; }
    g.clearFacts();
    peak = Math.max(peak, g.state.people[g.state.player.id].body?.stress?.v ?? 0);
  }
  return { gain, folds, peak };
};

export default [
  {
    name: 'supp-body: stressGainOf against a 1 ms reference (pools 105, 79 and 60; hardening 7, 17, 45 and 95; with and without a Breathe window, in and past the grace) to 0.001; nothing at felt under 45, 0.3 a second suppressed, 0.6 pinned',
    fn() {
      const T = 1_000_000, rows = [];
      let worst = 0;
      for (const supp of [105, 79, 60]) for (const H of [7, 17, 45, 95]) for (const win of [null, [3000, 7000], [500, 4500], [20_000, 24_000]]) {
        const rec = { supp, suppAtMs: T, suppRate: SUPP_DECAY.exposed, ...(win ? { breatheFromMs: T + win[0], breatheUntilMs: T + win[1] } : {}) };
        for (const [a, b] of [[0, 70_000], [2_000, 13_000], [12_345, 31_789]]) {
          const got = stressGainOf(rec, H, T + a, T + b), ref = reference(rec, H, T + a, T + b);
          worst = Math.max(worst, Math.abs(got - ref));
          if (a === 0 && (!win || win[0] === 3000)) rows.push(`pool ${supp}, H ${H}${win ? ', Breathe at 3 s' : ''}: ${fmt(got, 3)}`);
        }
      }
      console.log(`      the gain over 70 s from the input: ${rows.join(' · ')}`);
      console.log(`      against the 1 ms reference over ${3 * 4 * 4 * 3} intervals: worst ${worst.toExponential(2)} points`);
      const under = stressGainOf({ supp: 44.4 + 7, suppAtMs: T, suppRate: 2 }, 7, T, T + 60_000), at45 = stressGainOf({ supp: 44.5 + 7, suppAtMs: T, suppRate: 2 }, 7, T, T + 60_000);
      const pinned = stressGainOf({ supp: 120, suppAtMs: T, suppRate: 2 }, 0, T, T + 1000), supp = stressGainOf({ supp: 60, suppAtMs: T, suppRate: 2 }, 0, T, T + 1000);
      console.log(`      felt 44 at its peak: ${under}; felt 45: ${fmt(at45, 4)} (its 1.5 s grace at 0.3 and the instant it falls under); pinned a second ${pinned}, suppressed a second ${supp}`);
      assert(worst < 0.001 && under === 0 && Math.abs(at45 - 0.45) < 1e-9 && Math.abs(pinned - 0.6) < 1e-12 && Math.abs(supp - 0.3) < 1e-12, JSON.stringify({ worst, under, at45, pinned, supp }));
    },
  },
  {
    name: 'supp-body: "Three bangs" (no ear defenders) by sheet, the pairs bot through the banged string and the pool\'s emptying: the recruit about +14, the private about +11, the tier one and the Raider 0; nobody at 50 (on edge), so no roll moves (the build sheet 0.0.10 §3.3: the digest moves, the rolls do not)',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    fn() {
      const rows = [];
      for (const tier of ['recruit', 'private', 'sgt', 'raider', 'tierone']) {
        const g = createGame({ scenario: 'test-pairs', seed: 48213, tier, setup: 'bangs:standby' }), s = g.state, pid = s.player.id, bot = pairsBot();
        const v0 = bodyOf(s, pid).stress.v, r = play(g, bot, 20 * 90);
        rows.push({ tier, H: hardOf(s, pid), v0, ...r, errors: g.errors.length });
      }
      for (const r of rows) console.log(`      ${r.tier} (H ${r.H}): stress ${fmt(r.v0, 2)} at the start, +${fmt(r.gain, 2)} from the chaos in ${r.folds} folds over 90 s, its peak ${fmt(r.peak, 2)}`);
      const by = Object.fromEntries(rows.map(r => [r.tier, r]));
      assert(by.recruit.gain > 10 && by.recruit.gain < 18 && by.private.gain > 7 && by.private.gain < by.recruit.gain && by.raider.gain === 0 && by.tierone.gain === 0 && by.tierone.folds === 0, JSON.stringify(rows));
      assert(rows.every(r => r.peak < 50 && !r.errors) && rows.every((r, i) => !i || r.gain <= rows[i - 1].gain), JSON.stringify(rows));
    },
  },
  {
    name: 'supp-body: test-stress (ear defenders on) by sheet and string, the stress bot to the card: the recruit\'s stress from the bangs of strings 4 and 5, the tier one\'s never moving',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    async fn() {
      if (!SCENARIOS['test-stress']) { console.log('      test-stress is not in this build yet (the scene role\'s): not run'); return; }
      const mod = await import('./bots/stress.mjs'), mk = mod.stressBot ?? Object.values(mod).find(f => typeof f === 'function');
      if (!mk) { console.log('      the stress bot is not in this build yet: not run'); return; }
      const rows = [];
      for (const tier of ['recruit', 'private', 'sgt', 'tierone']) {
        const g = createGame({ scenario: 'test-stress', seed: 48213, tier }), s = g.state, pid = s.player.id, bot = mk(), by = {};
        let k = null, peak = 0, n = 0;
        for (; n < 20 * 60 * 30 && !s.armoury.range.end; n++) {
          g.step(1, bot);
          for (const [t, d] of g.bus.events) {
            if (t === 'range' && Number.isFinite(d.string)) k = d.string;
            if (t === 'body-event' && d.kind === 'stress' && d.who === pid) by[k ?? '-'] = (by[k ?? '-'] ?? 0) + d.amount;
          }
          g.clearFacts();
          peak = Math.max(peak, s.people[pid].body?.stress?.v ?? 0);
        }
        const total = Object.values(by).reduce((a, b) => a + b, 0);
        rows.push({ tier, H: hardOf(s, pid), total, by, peak, ended: !!s.armoury.range.end, errors: g.errors.length });
      }
      for (const r of rows) console.log(`      ${r.tier} (H ${r.H}): +${fmt(r.total, 2)} over the course (${Object.entries(r.by).map(([k, v]) => `string ${k === '-' ? '-' : Number(k) + 1} +${fmt(v, 2)}`).join(', ') || 'none'}), its peak ${fmt(r.peak, 2)}; ${r.ended ? 'to the card' : 'NOT ENDED'}`);
      const t1 = rows.at(-1), rec = rows[0];
      assert(t1.total === 0 && rows.every(r => !r.errors && r.ended && r.peak < 50) && rec.total > 0 && rows.every((r, i) => !i || r.total <= rows[i - 1].total + 1e-9), JSON.stringify(rows));
    },
  },
  {
    name: 'supp-body: the toll (BODY §9.3; COMBAT §5.6): a body forced to stress 80 (frayed, 75 up) takes HARD_TOLL.frayed 5 off hardening, so the same pool reaches the hands 5 harder; at 74 nothing',
    fn() {
      const rows = [];
      for (const v of [0, 74, 80]) {
        const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), s = g.state, pid = s.player.id;
        g.step(2);
        bodySync(s, pid, s.clock.ms);
        if (v) addStress(s, pid, v - bodyOf(s, pid).stress.v, s.clock.ms, g.bus);
        const P = hardParts(s, pid);
        rows.push({ v, stress: bodyOf(s, pid).stress.v, H: P.H, toll: P.toll.map(t => `${t.why} −${t.v}`).join(', ') || 'none', felt: feltFrom(79, P.H), facts: g.facts('body-event').filter(f => f.kind === 'stress').map(f => f.amount) });
      }
      for (const r of rows) console.log(`      stress ${fmt(r.stress, 2)}: hardening ${r.H} (the toll: ${r.toll}); three bangs in ear defenders (79) reach him at felt ${r.felt}; the facts ${r.facts.join(', ') || 'none'}`);
      const [calm, edge, frayed] = rows;
      assert(edge.H === calm.H && frayed.H === calm.H - HARD_TOLL.frayed && frayed.felt === calm.felt + HARD_TOLL.frayed && /frayed/.test(frayed.toll), JSON.stringify(rows));
    },
  },
];
