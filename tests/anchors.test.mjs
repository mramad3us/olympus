// The user's anchors from the code (COMBAT §5.8, T4 and T14; the build sheet 0.0.9 §4, §5.1, §8 item 8): three bangs beside the tier one and the boot recruit.
//
// The user (2026-11-07): "Tier one operator would have such hardening, that having three flashbangs go off right next to
// him would barely affect his ability to operate his weapon, where a recruit would likely be so supressed that they would
// be even likely to fail simple actions like thumbing safety off or reloading". Each sheet on test-pairs' test sheet
// (templates.js testSheet, its inoculation fixed), three training bangs 1.5 m behind him 1 s apart in the open, ears
// unprotected, his back to them (supp.js bang() on the real state: the pool, felt, its band and modifier, the startle);
// the startle in all over 4,000 draws of its stream (tests/race-model.mjs bangsOn on supp.js's startleMsOf); the take-in
// at 7 m in his sector calm and at felt's band (react.js takeInOf); Off safe (selector:semi, DC 6) and RELOAD (reload:speed:
// the drop DC 5, the reach unrolled, the seat DC 9, the release DC 6) through firearms.js act() on the real roller,
// 4,000 trials a cell at 'danger' (COMBAT §5.8's column: nothing routine) and at the range's 'evaluated' (§8 item 8: a
// trained hand's routine roll fails only on a natural 1, which slows it); and T14's turn to the first round from the
// race model, 20,000 runs. "Fails" is any grade under pass; "drops" the ladder's (the rifle onto its sling, or a negligent
// discharge, for Off safe; the fresh magazine falling, for the seat).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { seedRng } from '../src/core/rng.js';
import { act } from '../src/sim/arms/firearms.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { takeInOf } from '../src/sim/combat/react.js';
import { bang, blockOf, feltOf, bandOf, bandN, suppMod, suppTimeK, hardOf } from '../src/sim/combat/supp.js';
import { SHEETS, bangsOn, turnTable } from './race-model.mjs';

const N = 4000;
const pc = (x) => `${Math.round(100 * x)}%`;
const passed = (g) => g === 'pass' || g === 'good' || g === 'superb';

// (a sheet's player on test-pairs, ears off (the user's case), three bangs behind him 1 s apart on the real state: { g, pid, felt, pool, startleMs })
function banged(tier, { n = 3 } = {}) {
  const g = createGame({ scenario: 'test-pairs', seed: 48213, tier }), s = g.state, pid = s.player.id, me = g.me();
  const w = s.people[pid].kit.worn;
  for (const [slot, id] of Object.entries(w)) if (s.items[id]?.type === 'ears') delete w[slot];
  const t0 = s.clock.ms;
  for (let i = 0; i < n; i++) {
    bang(s, g.bus, { id: `anchor:${i}`, x: me.x - 1.5, z: me.z, atMs: t0 + i * 1000 });
    if (i < n - 1) g.step(20);
  }
  const B = blockOf(s, pid);
  return { g, s, pid, pool: B?.supp ?? 0, felt: feltOf(s, pid), startleMs: B?.startleMs ?? 0 };
}

// (Off safe and RELOAD by act() on a roller, n trials a cell: { off: { fail, drop }, reload: { fail, drop } })
function hands(roller, pressure) {
  const r = seedRng(77_001), off = { fail: 0, drop: 0 }, rel = { fail: 0, drop: 0 };
  for (let i = 0; i < N; i++) {
    const gun = { type: 'gun', model: 'r7', chamber: 'live', mode: 'safe', cocked: true, mag: 'm1' }, mag = { type: 'mag', fam: 'had30', n: 9 };
    const a = act(r, roller, gun, mag, 'selector:semi', { pressure, posture: 'lowReady', finger: 'off' });
    if (!passed(a.grade)) off.fail++;
    if (a.mishap) off.drop++;
    // (the RELOAD's three rolls, each from its own fixture: the drop, the seat, the release)
    const empty = { type: 'gun', model: 'r7', mag: 'm1', locked: true, cocked: true }, m0 = { type: 'mag', fam: 'had30', n: 0 };
    const d = act(r, roller, empty, m0, 'magOut:drop', { pressure, posture: 'lowReady' });
    const fresh = { type: 'mag', fam: 'had30', n: 10 }, open = { type: 'gun', model: 'r7', locked: true, cocked: true };
    const st = act(r, roller, open, null, 'seat', { pressure, posture: 'lowReady', held: { id: 'm2', mag: fresh, hand: 1 } });
    const shut = { type: 'gun', model: 'r7', mag: 'm2', locked: true, cocked: true };
    const rl = act(r, roller, shut, { type: 'mag', fam: 'had30', n: 10 }, 'release', { pressure, posture: 'lowReady' });
    if (![d, st, rl].every(x => passed(x.grade))) rel.fail++;
    if (st.mishap) rel.drop++;
  }
  return { off: { fail: off.fail / N, drop: off.drop / N }, reload: { fail: rel.fail / N, drop: rel.drop / N } };
}

export default [
  {
    name: 'anchors: three bangs beside him, COMBAT §5.8 from the code ("having three flashbangs go off right next to him would barely affect his ability to operate his weapon", the user, 2026-11-07): the tier one at felt 10 or less, startled 0.1 s at most, his Off safe and RELOAD failing as calm; the boot recruit\'s Off safe failing over half the time and his RELOAD four times in five; the private between',
    fn() {
      const rows = {};
      console.log(`      sheet (H): pool → felt (band), mod, time × | startled in all (${N} draws: mean, range; FROZE, the first start to the last end) | take-in 7 m, sector, calm → bangs | Off safe fails / drops, calm → bangs | RELOAD fails / drops, calm → bangs (at 'danger'; at 'evaluated')`);
      for (const sh of SHEETS) {
        const b = banged(sh.id), calm = createGame({ scenario: 'test-pairs', seed: 48213, tier: sh.id });
        const r = rollerOf(b.s, b.pid), rc = rollerOf(calm.state, calm.state.player.id), mod = suppMod(b.felt, 'weapons')?.v ?? 0;
        const rng = seedRng(4000 + sh.wf), st = [], fz = [];
        for (let i = 0; i < N; i++) { const x = bangsOn(rng, sh.H); st.push(x.inAllMs); fz.push(x.frozeMs); }
        const mean = st.reduce((a, x) => a + x, 0) / N, fzMean = fz.reduce((a, x) => a + x, 0) / N;
        const ti0 = takeInOf({ wf: sh.wf, expect: 'sector' }).ms, ti1 = takeInOf({ wf: sh.wf, expect: 'sector', band: bandN(b.felt) }).ms;
        const hd = { danger: [hands(rc, 'danger'), hands(r, 'danger')], evaluated: [hands(rc, 'evaluated'), hands(r, 'evaluated')] };
        rows[sh.id] = { H: hardOf(b.s, b.pid), felt: b.felt, startle: mean, hd, ti0, ti1, realStartle: b.startleMs };
        const cell = (k) => `${pc(hd.danger[0][k].fail)}/${pc(hd.danger[0][k].drop)} → ${pc(hd.danger[1][k].fail)}/${pc(hd.danger[1][k].drop)} (${pc(hd.evaluated[0][k].fail)} → ${pc(hd.evaluated[1][k].fail)})`;
        console.log(`        ${sh.label} (${rows[sh.id].H}): ${fmt(b.pool, 0)} → ${b.felt} (${bandOf(b.felt)}), ${mod}, ×${fmt(suppTimeK(b.felt), 2)} | ${fmt(mean / 1000, 2)} s (${fmt(Math.min(...st) / 1000, 2)} to ${fmt(Math.max(...st) / 1000, 2)}; FROZE ${fmt(fzMean / 1000, 2)} s; this seed's FROZE ${fmt(b.startleMs / 1000, 2)} s) | ${ti0} → ${ti1} ms | ${cell('off')} | ${cell('reload')}`);
      }
      const t1 = rows.tierone, rc = rows.recruit, pv = rows.private;
      const within = (row, k, p) => row.hd[p][1][k].fail <= row.hd[p][0][k].fail + 0.02;
      assert(t1.felt <= 19 && t1.startle <= 100 && t1.realStartle <= 100 && ['off', 'reload'].every(k => within(t1, k, 'danger') && within(t1, k, 'evaluated')), JSON.stringify({ felt: t1.felt, startle: t1.startle, hd: t1.hd }));
      assert(rc.hd.danger[1].off.fail >= 0.5 && rc.hd.danger[1].reload.fail >= 0.8 && rc.hd.evaluated[1].off.fail >= 0.5 && rc.hd.evaluated[1].reload.fail >= 0.8, JSON.stringify(rc.hd));
      for (const p of ['danger', 'evaluated']) for (const k of ['off', 'reload'])
        assert(pv.hd[p][1][k].fail <= rc.hd[p][1][k].fail && pv.hd[p][1][k].fail >= t1.hd[p][1][k].fail, JSON.stringify({ p, k, private: pv.hd[p][1][k], recruit: rc.hd[p][1][k], tierone: t1.hd[p][1][k] }));
    },
  },
  {
    name: 'anchors: T14 from the race model, from the turn 2 s after the third bang to the first round (20,000 runs): the boot recruit 6 to 8 s on average against calm\'s, the tier one within 0.05 s of calm',
    fn() {
      const t = {};
      for (const sh of SHEETS) {
        t[sh.id] = turnTable(sh);
        const x = t[sh.id];
        console.log(`      ${sh.label} (H ${sh.H}): ${fmt(x.mean, 2)} s (p95 ${fmt(x.p95, 2)}) against ${fmt(x.calm, 2)} s calm; Off safe failed at least once ${sh.rung < 2 ? pc(x.fumbled) : '(inside the row)'}; still startled at the turn ${pc(x.still)}`);
      }
      assert(t.recruit.mean >= 6 && t.recruit.mean <= 8 && t.tierone.mean <= t.tierone.calm + 0.05, JSON.stringify({ recruit: t.recruit, tierone: t.tierone }));
      assert(t.private.mean < t.recruit.mean && t.private.mean > t.tierone.mean, JSON.stringify(t.private));
    },
  },
];
