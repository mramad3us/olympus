// OLYMPUS tests: each T sheet meets its own par on the Wreck (v0.0.25, "Hold to hold"; its build sheet §8 F134).
//
// The Wreck's pars are the house's (shoothouse.js parOf: the class's par and a stand's book) with two parts of its own in each stand's
// book (standBookOf): 'anchor', the pair's recovery on the boots against planted feet (recoverMs × (1 − 1 / recover)), and 'plant',
// a hold's man seen from the trunk but no round anchored before the plant on the far face (drills/void.js faceMsOf from floating,
// 1.2 s, and the beat's two ticks, 1.3 s). A leg's par takes the tug's time (L.tugMs) on top. F134: the honest T player on each T sheet (the corporal to the tier one)
// meets its own par, the lane's verdict GO, on 48213 and two more seeds (1037, 1074, the flawless suites' own). The quick case holds
// 48213 on the raider and the tier one; the heavy case all four sheets on the three seeds, and prints every stand's par and its time.
import { assert } from './helpers.mjs';
import { wreckLane, laneLine, T_SHEETS, wreckSeeds } from './flawless-wreck.mjs';
import { houseVerdict, parOf, parWords } from '../src/sim/scenarios/shoothouse.js';

// (one lane's verdict and its stands: each threat's par, seen to first round, met)
function parsOf(tier, seed) {
  const { g, rec } = wreckLane({ tier, seed, bot: 'honest' }), s = g.state, R = s.armoury.range, H = R.house, v = houseVerdict(s);
  const stands = H.rooms.flatMap(L => L.contacts.filter(c => c.by === 'me' && ['threat', 'armoured', 'hostage'].includes(c.face) && c.parMet !== null && c.parMet !== undefined).map(c => {
    const T = R.turners.find(t => t.key === c.key), p = parOf(s, T, H);
    return { stand: c.stand, met: c.parMet, cause: c.cause ?? null, s: T.firstAtMs ? (T.firstAtMs - c.seenMs) / 1000 : null, par: p };
  }));
  return { rec, v, stands };
}
const line = ({ rec, v, stands }) => `${laneLine(rec)}; ${v.go ? 'GO' : `NO-GO ${v.why.join(', ')}`}, missed ${v.missed}; ${stands.map(x => `${x.stand} ${x.s?.toFixed(2) ?? '-'}/${(x.par.ms / 1000).toFixed(2)}${x.met ? '' : ` MISSED (${x.cause})`}`).join(' · ')}`;

export default [
  {
    name: 'F134 (quick): the raider and the tier one by T on 48213 each meet their own par on the Wreck (GO, no stand missed); a hold\'s man booked the plant ("through the hatch, the plant first")',
    fn() {
      const rows = ['raider', 'tierone'].map(t => parsOf(t, 48213));
      for (const r of rows) console.log(`      ${line(r)}`);
      const hold = rows[0].stands.find(x => x.stand === '3b');
      console.log(`      the raider's 3b: ${hold ? parWords(hold.par) : '-'}`);
      assert(rows.every(r => r.v.go && r.v.missed === 0), rows.map(line).join(' | '));
      assert(hold && hold.par.parts.some(p => p.why === 'plant' && p.ms === 1300), JSON.stringify(hold?.par));
    },
  },
  {
    name: 'F134: every T sheet (the corporal to the tier one) by T meets its own par on 48213, 1037 and 1074, 3 of 3 a sheet',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const bad = [];
      for (const tier of T_SHEETS) for (const seed of wreckSeeds(3)) {
        const r = parsOf(tier, seed);
        console.log(`      ${line(r)}`);
        if (!r.v.go) bad.push(`${tier} ${seed}: ${r.v.why.join(', ')} (${r.stands.filter(x => !x.met).map(x => `${x.stand} ${x.cause}`).join(', ')})`);
      }
      assert(!bad.length, bad.join(' | '));
    },
  },
];
