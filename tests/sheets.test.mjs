// The test sheets and the new tiers (src/sim/skills/templates.js; SKILLS §11.1; COMBAT §25.3.2, §25.10.3; the build sheet 0.0.8 §4, §5.1, §8 item 23).
//
// Each TEST_SHEETS sheet's values through value() and its rung, against the build sheet's §4 table exactly (the
// picker's boot recruit, private, sergeant, Raider and tier one; the corporal by URL only); the other skills at their
// tier's middle; RUNG_OF_TIER and rungOf by sheet and by rank; 100 seeds of rollSheet on the new tiers (recruit, recon,
// raider, tierone) within the envelope SKILLS §11.1's ranges give under v0.0.5's rule (a Raider's Marksmanship 25 to 38
// against the table's 28 to 35: the base and Warfighting drawn apart, plus the background points); the existing tiers'
// draws unmoved.
import { assert } from './helpers.mjs';
import { value, SKILL_KEYS } from '../src/sim/skills/skills.js';
import { TIERS, TEST_SHEETS, PICKER_TIERS, RUNG_OF_TIER, testSheet, rungOf, rollSheet, solveOwn } from '../src/sim/skills/templates.js';
import { createGame } from './game.mjs';
import { digest } from '../src/core/hash.js';

// (the digest of rollSheet(seed, 'p<seed>', tier) for seeds 1 to 50 of the seven v0.0.7 tiers, by v0.0.7's own code)
const V007_DRAWS = '0955b6fee56b13';

// (the build sheet's §4: label, WF, MRK, WH, AWR, FIT, rung, on the picker)
const WANT = {
  recruit: ['Boot recruit', 6, 4, 4, 2, 8, 0, true], private: ['Private', 15, 10, 10, 6, 12, 1, true], cpl: ['Corporal', 34, 15, 15, 11, 13, 2, false],
  sgt: ['Sergeant', 44, 19, 19, 14, 14, 3, true], raider: ['Raider, five years', 70, 31, 31, 31, 19, 4, true], tierone: ['Tier one', 93, 42, 42, 41, 21, 4, true],
};
// (SKILLS §11.1's rows for the new tiers: WF and the values of the four named skills)
const TABLE = {
  recruit: { wf: [4, 8], marksmanship: [3, 5], weapons: [3, 5], awareness: [1, 3], fitness: [7, 10] },
  recon: { wf: [48, 65], marksmanship: [21, 26], weapons: [21, 26], awareness: [21, 26], fitness: [16, 19] },
  raider: { wf: [66, 85], marksmanship: [28, 35], weapons: [28, 35], awareness: [27, 33], fitness: [18, 21] },
  tierone: { wf: [86, 100], marksmanship: [37, 46], weapons: [37, 46], awareness: [35, 44], fitness: [20, 23] },
};

export default [
  {
    name: 'the test sheets\' values and rungs through value(), exactly the build sheet\'s §4 (the boot recruit WF 6, MRK 4, WH 4, AWR 2; the private 15, 10, 10, 6; … the tier one 93, 42, 42, 41), a background point only past the base\'s 20; the picker\'s five, the private its default',
    fn() {
      const bad = [];
      console.log('      tier     label                WF  MRK  WH  AWR  FIT  rung  picker  bases (MRK, WH, AWR, FIT)          the rest at the tier\'s middle');
      for (const [tier, w] of Object.entries(WANT)) {
        const s = testSheet(tier), v = (k) => value(s, k), t = TEST_SHEETS[tier];
        const got = [t.label, s.os, v('marksmanship'), v('weapons'), v('awareness'), v('fitness'), s.drills.room.rung, t.picker];
        const bases = ['marksmanship', 'weapons', 'awareness', 'fitness'].map(k => JSON.stringify(s.skills[k])).join(' ');
        const rest = ['cqc', 'fieldcraft', 'tactics', 'medicine'].map(k => `${k} ${v(k)}`).join(', ');
        console.log(`      ${tier.padEnd(8)} ${t.label.padEnd(20)} ${got.slice(1, 7).map((x, i) => String(x).padStart([3, 5, 4, 5, 5, 6][i])).join('')}  ${String(t.picker).padEnd(6)}  ${bases.padEnd(34)} ${rest}`);
        if (JSON.stringify(got) !== JSON.stringify(w)) bad.push(`${tier}: ${JSON.stringify(got)} against ${JSON.stringify(w)}`);
        for (const k of SKILL_KEYS) {
          const [base, bg] = s.skills[k];
          if (base > 20 || bg > 4 || (bg > 0 && base < 20) || v(k) !== t.values[k]) bad.push(`${tier} ${k}: [${base}, ${bg}] = ${v(k)} (${t.values[k]})`);
        }
        if (s.drills.passage.rung !== w[6]) bad.push(`${tier}: passage ${s.drills.passage.rung}`);
      }
      console.log(`      the picker: ${PICKER_TIERS.join(', ')}; an unknown tier is the private's (${testSheet('nobody').os}); solveOwn(marksmanship, 42, 93) ${JSON.stringify(solveOwn('marksmanship', 42, 93))}`);
      assert(!bad.length, bad.join('\n'));
      assert(PICKER_TIERS.join() === 'recruit,private,sgt,raider,tierone' && testSheet('nobody').os === 15, PICKER_TIERS.join());
    },
  },
  {
    name: 'RUNG_OF_TIER is COMBAT §25.3.2\'s (recruit 0, private 1, lcpl and cpl 2, sgt to gysgt 3, lt 1, recon 3, Raider and tier one 4); rungOf reads a test sheet\'s rung where written, else the rank\'s tier\'s, writing nothing',
    fn() {
      const want = { recruit: 0, private: 1, lcpl: 2, cpl: 2, sgt: 3, ssgt: 3, gysgt: 3, lt: 1, recon: 3, raider: 4, tierone: 4 };
      assert(JSON.stringify(RUNG_OF_TIER) === JSON.stringify(want), JSON.stringify(RUNG_OF_TIER));
      const g = createGame({ scenario: 'test-handling', seed: 48213 }), s = g.state, pid = s.player.id;
      const byRank = Object.keys(s.people).filter(id => id !== pid).slice(0, 400).reduce((m, id) => { const r = s.people[id].service?.rank ?? '?'; m[r] ??= rungOf(s, id); return m; }, {});
      const before = JSON.stringify(s.people[pid].skills), mine = rungOf(s, pid);
      s.people[pid].skills = testSheet('tierone');
      const t1 = rungOf(s, pid), t1p = rungOf(s, pid, 'passage'), t1h = rungOf(s, pid, 'hatch');
      console.log(`      by rank: ${Object.entries(byRank).map(([r, n]) => `${r} ${n}`).join(', ')}; the player's drawn sheet (${s.people[pid].service.rank}) ${mine}; on the tier one's test sheet room ${t1}, passage ${t1p}, hatch (none written) ${t1h}`);
      assert(mine === 1 && t1 === 4 && t1p === 4 && t1h === 1 && !before.includes('drills') && byRank.Sgt === 3 && byRank.Pvt === 1, JSON.stringify({ mine, t1, t1p, t1h, byRank }));
    },
  },
  {
    name: '100 seeds of rollSheet on the new tiers (boot recruit, recon, Raider, tier one) land within the envelope of SKILLS §11.1\'s ranges as v0.0.5 built the tiers (the bases from the value range at the far end of Warfighting\'s, drawn apart, plus the background points), the table\'s lows inside it (its tops said where a base of 20 and two background points cannot reach them); the existing tiers\' draws unmoved',
    fn() {
      const bad = [];
      for (const [tier, row] of Object.entries(TABLE)) {
        const seen = { wf: [Infinity, -Infinity] }, keys = ['marksmanship', 'weapons', 'awareness', 'fitness'];
        for (const k of keys) seen[k] = [Infinity, -Infinity];
        for (let seed = 1; seed <= 100; seed++) {
          const s = rollSheet(seed, 'p145', tier);
          seen.wf = [Math.min(seen.wf[0], s.os), Math.max(seen.wf[1], s.os)];
          for (const k of keys) { const v = value(s, k); seen[k] = [Math.min(seen[k][0], v), Math.max(seen[k][1], v)]; }
        }
        // (the envelope v0.0.5's rule gives (SKILLS §11.1 as built: the base range from the value range at the far end of
        // the Warfighting range, drawn apart from Warfighting): the least base at the least Warfighting, the most base
        // with two background points at the most; the table's own range must lie inside it)
        const env = (k) => { const b = TIERS[tier].base[k], m = k === 'fitness' ? [1, 1] : [1 + row.wf[0] / 100, 1 + row.wf[1] / 100]; return [Math.round(b[0] * m[0]), Math.round(Math.min(23, b[1] + 2) * m[1])]; };
        // (the table's top is out of reach where it needs more own points than a base of 20 and two background points:
        // the tier one's 46 needs 23 at Warfighting 100; said, not failed: a finding for SKILLS §11.1)
        const out = keys.filter(k => seen[k][0] < env(k)[0] || seen[k][1] > env(k)[1] || row[k][0] < env(k)[0]);
        const short = keys.filter(k => row[k][1] > env(k)[1]).map(k => `${k} ${row[k][1]} past ${env(k)[1]}`);
        if (seen.wf[0] < row.wf[0] || seen.wf[1] > row.wf[1]) out.push('wf');
        console.log(`      ${tier.padEnd(8)} WF ${seen.wf.join('–')} (${row.wf.join('–')}); ${keys.map(k => `${k} ${seen[k].join('–')} (the table ${row[k].join('–')}, the envelope ${env(k).join('–')})`).join(', ')}; bases MRK ${TIERS[tier].base.marksmanship.join('–')}${short.length ? `; the table's top out of a draw's reach: ${short.join(', ')}` : ''}${out.length ? `; OUTSIDE: ${out.join(', ')}` : ''}`);
        if (out.length) bad.push(`${tier}: ${out.join(', ')}`);
      }
      // (the existing tiers' draws as v0.0.7 drew them: seeds 1 to 50 of each, digested by v0.0.7's own code, 2026-11-07)
      const old = [];
      for (const t of ['private', 'lcpl', 'cpl', 'sgt', 'ssgt', 'gysgt', 'lt']) for (let seed = 1; seed <= 50; seed++) old.push(rollSheet(seed, `p${seed}`, t));
      const dig = digest(JSON.stringify(old)), p = rollSheet(48213, 'p145', 'private');
      console.log(`      the existing tiers' 350 draws: digest ${dig} (v0.0.7's ${V007_DRAWS}); the private at 48213, p145: os ${p.os}, ${['marksmanship', 'weapons', 'awareness'].map(k => `${k} ${JSON.stringify(p.skills[k])}`).join(', ')}`);
      assert(!bad.length, bad.join('\n'));
      assert(dig === V007_DRAWS, `the existing tiers' draws moved: ${dig}`);
      assert(TIERS.private.base.marksmanship.join() === '8,10' && TIERS.sgt.wf.join() === '38,50', 'the existing tiers');
    },
  },
];
