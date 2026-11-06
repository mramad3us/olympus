// What goes wrong at a pull, by the gun's state (src/sim/arms/firearms.js misfireP, jamP, pull; WEAPONS §4.3; the build sheet 0.0.5 §5.1): each of §4.3's states over 200,000 pulls (1,000,000 for a fresh rifle, whose rates are rare) beside the closed form and §4.3's own figures, stoppages per 1,000 rounds, and tradecraft's own rates at its conditions beside OLYMPUS's.
import { assert, fmt } from './helpers.mjs';
import { stream } from '../src/core/rng.js';
import { misfireP, jamP, pull } from '../src/sim/arms/firearms.js';
import { MODELS } from '../src/sim/arms/models.js';

// WEAPONS §4.3's rates [computed]: misfire and stoppage a pull, %
const STATES = [
  ['fresh (cond 0.95, clean)', { cond: 0.95 }, {}, 0.015, 0.06, 1_000_000],
  ['after a range day', { cond: 0.95, foul: 0.15, dust: 0.15 }, { dust: 0.05 }, 0.045, 0.16],
  ['a week in the field uncleaned', { cond: 0.94, foul: 0.3, dust: 0.4 }, { dust: 0.2 }, 0.1, 0.56],
  ['a dust storm, the port open', { cond: 0.95, foul: 0.1, dust: 0.8 }, { dust: 0.4 }, 0.18, 1.2],
  ['a magazine dropped twice (0.87)', { cond: 0.95 }, { cond: 0.87 }, 0.015, 0.96],
  ['due for its service (0.85)', { cond: 0.85 }, {}, 0.4, 0.13],
  ['worn (0.6), cleaned', { cond: 0.6 }, {}, 2.3, 2.6],
  ['nearly broken (0.35)', { cond: 0.35 }, {}, 4.2, 8.7],
  ['the TMW-6 (0.85) in that storm', { cond: 0.85, foul: 0.1, dust: 0.8, model: 'tmw6' }, { dust: 0.4 }, 0.45, 0.68],
];
// (the Belt's rifle, for its one row: WEAPONS §3.2's dustK 0.5 and unreliable 0.8, a fixture until it is built)
const TMW6 = { ...MODELS.r7, short: 'TMW-6', kind: 'carbine', holdOpen: false, unreliable: 0.8, dustK: 0.5 };
// tradecraft v0.2.0-rc3's own rates (its firearms test's fourth, a Makarov at value 7, 400 guns of nine pulls each, stream('fa', 4)), run from a scratch script against its modules: dud % of pulls, stoppage % of shots
const TRADECRAFT = [[0.95, 0.60, 0.26], [0.6, 2.97, 3.49], [0.35, 4.93, 10.08]];

function rates(gunState, magState, n, seed, M) {
  const rng = stream('firearms-rates', seed);
  let pulls = 0, shots = 0, duds = 0, stops = 0, doubles = 0;
  const gun = { type: 'gun', model: 'r7' }, mag = { type: 'mag', fam: 'had30', n: 29 };
  for (let i = 0; i < n; i++) {
    Object.assign(gun, { chamber: 'live', mode: 'semi', ...gunState }); delete gun.jam; delete gun.cocked; delete gun.locked; delete gun.set; delete gun.rounds;
    Object.assign(mag, { n: 29, ...magState });
    const r = pull(rng, gun, mag, { model: M });
    pulls++;
    if (r.fired) shots++;
    if (r.why === 'dud') duds++;
    if (r.stoppage) { stops++; if (r.stoppage === 'double') doubles++; }
  }
  return { mis: duds / pulls, stop: stops / shots, doubles, stops, pulls };
}

export default [
  {
    name: 'WEAPONS §4.3\'s rates by the gun\'s state, each over 200,000 pulls beside the closed form: a fresh R-7 misfires 0.015% and stops 0.06% (±30%), a dust storm stops 1.2% (±0.2), a worn one (0.6) 2.3% and 2.6% (±0.3)',
    heavy: true,
    fn() {
      const lines = [], got = {};
      lines.push(`${'state'.padEnd(34)} ${'misfire %: sim / closed / §4.3'.padEnd(32)} ${'stoppage %: sim / closed / §4.3'.padEnd(34)} per 1,000 rounds, doubles`);
      STATES.forEach(([what, g, m, misW, stopW, n = 200_000], i) => {
        const M = g.model === 'tmw6' ? TMW6 : MODELS.r7, gs = { ...g }; delete gs.model;
        const r = rates(gs, m, n, i, M);
        const closedMis = misfireP(gs, m, M), closedJam = jamP(gs, { n: 29, ...m }, { M });
        got[what] = r;
        lines.push(`${what.padEnd(34)} ${`${fmt(r.mis * 100, 3)} / ${fmt(closedMis * 100, 3)} / ${misW}`.padEnd(32)} ${`${fmt(r.stop * 100, 3)} / ${fmt(closedJam * 100, 3)} / ${stopW}`.padEnd(34)} ${fmt(r.stop * 1000, 2)}, ${fmt(r.stops ? r.doubles / r.stops * 100 : 0, 0)}% doubles (${n.toLocaleString('en-GB')} pulls)`);
        assert(Math.abs(closedMis * 100 - misW) <= Math.max(0.006, misW * 0.05) && Math.abs(closedJam * 100 - stopW) <= Math.max(0.006, stopW * 0.05), `${what}: the closed form is §4.3's (${closedMis * 100}, ${closedJam * 100})`);
      });
      console.log(`      ${lines.join('\n      ')}`);
      const f = got['fresh (cond 0.95, clean)'], d = got['a dust storm, the port open'], w = got['worn (0.6), cleaned'];
      assert(Math.abs(f.mis * 100 - 0.015) <= 0.015 * 0.3 && Math.abs(f.stop * 100 - 0.06) <= 0.06 * 0.3, `fresh: ${f.mis * 100}%, ${f.stop * 100}% (±30%)`);
      assert(Math.abs(d.stop * 100 - 1.2) <= 0.2, `the dust storm's stoppages: ${d.stop * 100}% (±0.2)`);
      assert(Math.abs(w.mis * 100 - 2.3) <= 0.3 && Math.abs(w.stop * 100 - 2.6) <= 0.3, `worn: ${w.mis * 100}%, ${w.stop * 100}% (±0.3)`);
      const dd = got['a dust storm, the port open'];
      assert(Math.abs(dd.doubles / dd.stops - 0.3) <= 0.05, `a double feed 30% of stoppages: ${dd.doubles / dd.stops}`);
    },
  },
  {
    name: 'tradecraft\'s own rates at its conditions (a pistol at value 7) beside OLYMPUS\'s service-grade ones: its fresh gun failed one pull in 120, a fresh R-7 one in 1,300',
    heavy: true,
    fn() {
      const PISTOL = { kind: 'pistol', short: 'Makarov', holdOpen: true };
      const lines = TRADECRAFT.map(([cond, tcDud, tcStop], i) => {
        const r = rates({ cond }, {}, 200_000, 100 + i, PISTOL);
        return `condition ${cond}: tradecraft ${fmt(tcDud, 2)}% duds of pulls, ${fmt(tcStop, 2)}% stoppages of shots; OLYMPUS ${fmt(r.mis * 100, 3)}%, ${fmt(r.stop * 100, 3)}%`;
      });
      console.log(`      ${lines.join('\n      ')}`);
      const fresh = rates({ cond: 0.95 }, {}, 200_000, 200, PISTOL);
      assert(fresh.mis < 0.006 / 10 && fresh.stop < 0.0026, 'a fresh gun is service grade: far under tradecraft\'s');
      const worn = rates({ cond: 0.6 }, {}, 200_000, 201, PISTOL);
      assert(Math.abs(worn.mis * 100 - 2.3) <= 0.3, 'worn, the slope is tradecraft\'s again');
    },
  },
];
