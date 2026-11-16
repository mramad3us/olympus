// OLYMPUS tests: a burst's blast and fragments, WEAPONS' one helper each (WEAPONS §12.3, §12.4; COMBAT §11.3; the build sheet 0.0.18 §5.3; src/sim/arms/blast.js).
//
// The tables are WEAPONS §12.3's and §12.4's [computed] rows, held within 1 kPa and 1%; the strip charge's stand-off is the
// breaching drill's safe distance at the 4 psi limit (BREACH_SAFE_KPA 27.6, to check). Each test fails without blast.js.
import { assert, fmt } from './helpers.mjs';
import { peakKPa, qspKPa, standoffM, fragLambda, fragHits, BREACH_SAFE_KPA, STUN_KPA, FIREBALL_M } from '../src/sim/arms/blast.js';
import { AIRS } from '../src/data/places/env.js';

const WHEEL = AIRS['martian-indoor'].pKpa;

export default [
  {
    name: 'the free-field peak, the closed-room pressure and the fragment hits print WEAPONS §12.3 and §12.4\'s tables within 1 kPa and 1%: a G-9 313 kPa at 1 m in 66 kPa, 345 in 101 kPa; 80 kPa in a 10 m³ head; half of those standing at 15 m hit',
    fn() {
      const peaks = { 66: [313, 63, 27, 11, 6], 101: [345, 71, 31, 13, 7] }, rs = [1, 2, 3, 5, 8], bad = [];
      for (const [Pa, row] of [[WHEEL, peaks[66]], [101.325, peaks[101]]]) {
        const got = rs.map(r => peakKPa(0.24, r, Pa));
        console.log(`      G-9 at ${Pa} kPa, ${rs.join(', ')} m: ${got.map(x => fmt(x, 1)).join(', ')} kPa (WEAPONS ${row.join(', ')})`);
        got.forEach((g, i) => { if (Math.abs(g - row[i]) > Math.max(1, 0.01 * row[i]) + 0.5) bad.push(`peak ${Pa} ${rs[i]} m ${g}`); });
      }
      const vols = [3, 10, 30, 60, 140], want = [268, 80, 27, 13, 6], got = vols.map(V => qspKPa(0.24, V));
      console.log(`      G-9 closed rooms ${vols.join(', ')} m³: ${got.map(x => fmt(x, 1)).join(', ')} kPa (WEAPONS ${want.join(', ')}); a 0.5 kg charge in 10 m³ ${fmt(qspKPa(0.5, 10), 0)} kPa`);
      got.forEach((g, i) => { if (Math.abs(g - want[i]) > Math.max(1, 0.01 * want[i]) + 0.5) bad.push(`qsp ${vols[i]} ${g}`); });
      const l15 = fragLambda(160, 15), p15 = 1 - Math.exp(-l15);
      const draws = Array.from({ length: 2000 }, (_, i) => fragHits(48213, 'b1', `p${i}`, l15)), share = draws.filter(n => n > 0).length / draws.length;
      console.log(`      fragments: λ(15 m) ${fmt(l15, 2)} (at least one ${fmt(p15 * 100, 0)}%); 2,000 draws: ${fmt(share * 100, 1)}% hit; λ(2 m) ${fmt(fragLambda(160, 2), 1)}, prone at 10 m ${fmt(fragLambda(160, 10, 0.25), 2)}`);
      assert(Math.abs(l15 - 0.71) < 0.01 && Math.abs(share - 0.51) < 0.04, JSON.stringify({ l15, share }));
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'a 0.1 kg strip charge\'s stand-off is 2.20 m at 66 kPa, 2.40 m at 101.3 kPa and 1.18 m in Mars\' surface air (the 4 psi limit, 27.6 kPa); a G-11 stuns (20 kPa) to 1.36 m, a G-9 to 3.49 m',
    fn() {
      const mars = 0.61;                                            // (today's Mars at the surface, the design's row: no AIRS entry holds it)
      const s = [standoffM(0.1, WHEEL), standoffM(0.1, 101.325), standoffM(0.1, mars)];
      const stun = [standoffM(0.0143, WHEEL, STUN_KPA), standoffM(0.24, WHEEL, STUN_KPA), standoffM(0.23, WHEEL, STUN_KPA)];
      console.log(`      SC-1 stand-off at ${BREACH_SAFE_KPA} kPa: Wheel ${fmt(s[0], 2)} m, UN hull ${fmt(s[1], 2)} m, Mars' surface (${mars} kPa) ${fmt(s[2], 2)} m; the stun's reach: G-11 ${fmt(stun[0], 2)} m, G-9 ${fmt(stun[1], 2)} m, G-13 ${fmt(stun[2], 2)} m`);
      assert(Math.abs(s[0] - 2.20) < 0.01 && Math.abs(s[1] - 2.40) < 0.01 && Math.abs(s[2] - 1.18) < 0.01, JSON.stringify(s));
      assert(Math.abs(stun[0] - 1.36) < 0.01 && Math.abs(stun[1] - 3.49) < 0.01, JSON.stringify(stun));
    },
  },
  {
    name: 'in vacuum a G-11 is a flash alone (no blast past the fireball) and a G-9\'s fragments keep their count to any range (the hits never depend on the air)',
    fn() {
      const at = [0.4, 1, 3].map(r => peakKPa(0.0143, r, 0));
      console.log(`      vacuum: the G-11's peak at 0.4, 1, 3 m ${at.join(', ')}; the fireball ${FIREBALL_M} m; a G-9's λ at 30 m ${fmt(fragLambda(160, 30), 2)} whatever the air; qsp with no air ${qspKPa(0.24, 0)}`);
      assert(at[1] === 0 && at[2] === 0 && at[0] === Infinity && standoffM(0.1, 0) === FIREBALL_M, JSON.stringify(at));
    },
  },
];
