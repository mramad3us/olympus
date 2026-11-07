// The round in flight (src/sim/arms/ballistics.js; WEAPONS §2.1, §2.4, §2.5, §2.7): every environment class, the bore-line tables against direct integration, the lookup's cost.
// WEAPONS's [computed] numbers (its scratch model, §2.4's tables) are printed beside the module's, and the
// build sheet 0.0.7 §5.1's checks held: the valley at 300 m 657 m/s, 1,682 J, 0.42 s, drift 3.7 cm per m/s; an
// MCRN hull 667 m/s; Earth 607 m/s; Europa 790 m/s at every range; supersonic on the valley floor to 1,250 m.
import { assert, near, fmt, machine } from './helpers.mjs';
import { stream, range } from '../src/core/rng.js';
import { ENV_CLASSES as E, airOf, flight, zeroOf, boreTable, integrate, supersonicToM, BZO, OPTIC_H_M, envOfPlace, soundMsOf, woundFactor, v0Of } from '../src/sim/arms/ballistics.js';
import { CALIBRES } from '../src/sim/arms/calibres.js';

const R7 = ['6.5x40r', 'ball', 460];
const RANGES = [100, 200, 300, 400, 500, 600];
// (WEAPONS §2.4's table, zeroed at 300 m in each class: v, E, t, path, 5 m/s drift)
const W24 = {
  'mars-valley': [[744, 2159, 0.13, 3, 2], [700, 1909, 0.27, 5, 8], [657, 1682, 0.42, 0, 18], [615, 1477, 0.57, -14, 34], [576, 1292, 0.74, -37, 54], [537, 1126, 0.92, -72, 81]],
  earth: [[726, 2055, 0.13, 16, 3], [665, 1723, 0.28, 19, 11], [607, 1436, 0.43, 0, 27], [552, 1186, 0.61, -46, 50], [499, 970, 0.80, -124, 82], [448, 783, 1.01, -241, 125]],
  'ship-thrust': [[748, 2180, 0.13, 14, 2], [707, 1948, 0.27, 17, 7], [667, 1735, 0.41, 0, 17], [629, 1541, 0.57, -39, 31], [592, 1365, 0.73, -103, 49], [556, 1204, 0.91, -194, 73]],
  europa: [[790, 2434, 0.13, -2, 0], [790, 2434, 0.25, 0, 0], [790, 2434, 0.38, 0, 0], [790, 2434, 0.51, -2, 0], [790, 2434, 0.63, -6, 0], [790, 2434, 0.76, -12, 0]],
};

export default [
  {
    name: 'every environment class\'s air (WEAPONS §2.1\'s table): density and sound from P M / (R T) and √(1.4 R T / M); the range\'s place is the valley floor, 322 m/s',
    fn() {
      const rows = Object.entries(E).map(([k, env]) => { const a = airOf(env); return `${k} ${fmt(env.gMs2, 3)} m/s², ${fmt(a.rhoKgM3, 3)} kg/m³, ${fmt(a.soundMs, 0)} m/s`; });
      for (const r of rows) console.log(`      ${r}`);
      const want = { earth: [1.225, 340], 'mars-valley': [0.894, 322], 'mars-datum': [0.747, 312], 'ship-thrust': [0.802, 339], 'earth-ship': [1.200, 344] };
      for (const [k, [rho, c]] of Object.entries(want)) { const a = airOf(E[k]); near(a.rhoKgM3, rho, 0.004, `${k} density`); near(a.soundMs, c, 1, `${k} sound`); }
      assert(airOf(E.europa).rhoKgM3 === 0 && soundMsOf(E['freefall-vacuum']) === 0, 'vacuum: no air, no sound');
      const range = envOfPlace({ places: { live: { area: 'melas.ground' } } }, 'melas.ground', 1300, 350), a = airOf(range);
      console.log(`      the KD range (envOfPlace): ${range.pKpa} kPa, ${range.airC} °C, ${fmt(range.gMs2, 3)} m/s²: ${fmt(a.rhoKgM3, 3)} kg/m³, ${fmt(a.soundMs, 1)} m/s`);
      near(a.soundMs, 322, 1, 'the range\'s sound');
      assert(range.pKpa === E['mars-valley'].pKpa && range.airC === E['mars-valley'].airC, 'the range is the valley floor');
    },
  },
  {
    name: 'WEAPONS §2.4\'s table: the R-7\'s ball zeroed at 300 m in the valley, on Earth, in an MCRN hull and on Europa, beside WEAPONS\'s numbers; the valley at 300 m 657 m/s, 1,682 J, 0.42 s, drift 3.7 cm per m/s; MCRN 667; Earth 607; Europa 790 at every range',
    fn() {
      for (const cls of Object.keys(W24)) {
        const z = zeroOf(...R7, E[cls], 300);
        const cells = RANGES.map((d, i) => {
          const f = flight(...R7, E[cls], d, { zero: z, crossMs: 5 }), w = W24[cls][i];
          return `${d} m ${fmt(f.vMs, 0)}/${fmt(f.eJ, 0)} J/${fmt(f.tofS, 2)} s/${fmt(f.pathCm, 0)}/${fmt(f.driftCm, 0)} (W ${w.join('/')})`;
        });
        console.log(`      ${cls}: ${cells.join(' · ')}`);
        for (let i = 0; i < RANGES.length; i++) {
          const f = flight(...R7, E[cls], RANGES[i], { zero: z, crossMs: 5 }), w = W24[cls][i];
          near(f.vMs, w[0], w[0] * 0.02, `${cls} ${RANGES[i]} m v`);
          near(f.pathCm, w[3], Math.max(2, Math.abs(w[3]) * 0.03), `${cls} ${RANGES[i]} m path`);
        }
      }
      const v = flight(...R7, E['mars-valley'], 300, { crossMs: 1 });
      near(v.vMs, 657, 657 * 0.02, 'valley 300 m v'); near(v.eJ, 1682, 1682 * 0.02, 'valley 300 m energy'); near(v.tofS, 0.42, 0.01, 'valley 300 m time'); near(v.driftCm, 3.7, 0.2, 'valley 300 m drift per m/s');
      near(flight(...R7, E['ship-thrust'], 300).vMs, 667, 667 * 0.02, 'MCRN 300 m'); near(flight(...R7, E.earth, 300).vMs, 607, 607 * 0.02, 'Earth 300 m');
      for (const d of [0, 25, 300, 600, 1000]) near(flight(...R7, E.europa, d).vMs, 790, 0.01, `Europa ${d} m`);
      const ship = flight(...R7, E['earth-ship'], 300).vMs, earth = flight(...R7, E.earth, 300).vMs;
      console.log(`      a UN hull at Earth standard: 300 m ${fmt(ship, 0)} m/s against Earth's ${fmt(earth, 0)} (${fmt((ship / earth - 1) * 100, 1)}%: WEAPONS "within 1%")`);
      near(ship / earth, 1, 0.01, 'earth-ship within 1% of Earth');
    },
  },
  {
    name: 'the other loads on the valley floor (WEAPONS §2.4) and drift per m/s of crosswind, linear in the wind; Mars cuts the drift by a third against Earth',
    fn() {
      const rows = [['9x21r', 'ball', 110, [[304, 346], [251, 236], [195, 143]]], ['6.5x40r', 'ball', 300, [[691, 1862], [607, 1438], [493, 947]]],
        ['6.5x40r', 'frangible', 460, [[720, 1556], [591, 1049], [422, 535]]], ['6.5x40r', 'ap', 460, [[772, 2116], [690, 1689], [576, 1178]]]];
      for (const [cal, load, bar, w] of rows) {
        const cells = [100, 300, 600].map((d, i) => { const f = flight(cal, load, bar, E['mars-valley'], d); return `${d} m ${fmt(f.vMs, 0)} m/s ${fmt(f.eJ, 0)} J (W ${w[i][0]}, ${w[i][1]})`; });
        console.log(`      ${cal} ${load} (${bar} mm): ${cells.join(' · ')}`);
        [100, 300, 600].forEach((d, i) => near(flight(cal, load, bar, E['mars-valley'], d).vMs, w[i][0], w[i][0] * 0.03, `${cal} ${load} ${d} m`));
      }
      const W = { 'mars-valley': [0.4, 1.6, 3.7, 6.8, 10.9, 16.2], earth: [0.5, 2.3, 5.4, 10.0, 16.4, 24.9] };
      for (const [cls, w] of Object.entries(W)) {
        const per = RANGES.map(d => flight(...R7, E[cls], d, { crossMs: 1 }).driftCm);
        console.log(`      drift per m/s, ${cls}: ${per.map((x, i) => `${RANGES[i]} m ${fmt(x, 1)} (W ${w[i]})`).join(', ')}`);
        per.forEach((x, i) => near(x, w[i], Math.max(0.15, w[i] * 0.03), `${cls} drift ${RANGES[i]} m`));
      }
      const d1 = flight(...R7, E['mars-valley'], 500, { crossMs: 1 }).driftCm, d7 = flight(...R7, E['mars-valley'], 500, { crossMs: 7 }).driftCm;
      near(d7 / d1, 7, 7e-9, 'linear in the wind');
    },
  },
  {
    name: 'WEAPONS §2.7\'s supersonic ranges: the R-7 on the valley floor to 1,250 m (±5%), on Earth 840, in MCRN air 1,290; in vacuum it never cracks',
    fn() {
      const cases = [['mars-valley', 1250], ['earth', 840], ['ship-thrust', 1290]];
      const got = cases.map(([cls, w]) => [cls, supersonicToM(...R7, E[cls]), w]);
      console.log(`      ${got.map(([c, g, w]) => `${c} ${g} m (W ${w})`).join(', ')}; C-7 (300 mm) valley ${supersonicToM('6.5x40r', 'ball', 300, E['mars-valley'])} m (W 1,130)`);
      for (const [c, g, w] of got) near(g, w, w * 0.05, `${c} supersonic`);
      assert(supersonicToM(...R7, E.europa) === 0 && !flight(...R7, E.europa, 100).supersonic, 'vacuum: no crack');
    },
  },
  {
    name: 'the bore-line lookup against direct 2-D integration in five random places and zeroes (WEAPONS §2.1): the worst path error at 500 m under 1 cm',
    fn() {
      const r = stream('ballistics-test', 1);
      let worstPath = 0, worstDrift = 0;
      for (let i = 0; i < 5; i++) {
        const env = { gMs2: range(r, 0, 1.1) * 9.80665, pKpa: 0, airC: 0, molarKgMol: 0.02962, vacuum: false };
        // (a density 0 to 1.2 and a sound 310 to 345: the air's P and T that give them)
        const rho = range(r, 0, 1.2), c = range(r, 310, 345), T = c * c * 0.02962 / (1.4 * 8.314462618);
        Object.assign(env, { airC: T - 273.15, pKpa: rho * 8.314462618 * T / 0.02962 / 1000, vacuum: rho === 0 });
        const zenv = { gMs2: range(r, 0, 1.1) * 9.80665, pKpa: range(r, 40, 101), airC: range(r, -40, 30), molarKgMol: 0.02962, vacuum: false };
        const v0K = range(r, 0.92, 1.08), zero = zeroOf(...R7, zenv, range(r, 100, 500));
        const f = flight(...R7, env, 500, { zero, v0K, crossMs: 1 });
        const d = integrate(...R7, env, 500, { angleRad: zero.angleMrad / 1000, v0K });
        const ep = Math.abs(f.pathCm - d.pathCm), ed = Math.abs((f.tofS - d.tofS) * 100);
        worstPath = Math.max(worstPath, ep); worstDrift = Math.max(worstDrift, ed);
        console.log(`      ${i + 1}: ρ ${fmt(rho, 2)}, c ${fmt(c, 0)}, ${fmt(env.gMs2 / 9.80665, 2)} G, v0 ×${fmt(v0K, 3)}, zero at ${zero.rangeM | 0} m: path ${fmt(f.pathCm, 2)} cm against ${fmt(d.pathCm, 2)} (Δ ${fmt(ep, 2)}), t ${fmt(f.tofS, 4)} against ${fmt(d.tofS, 4)} s`);
      }
      console.log(`      worst at 500 m: path ${fmt(worstPath, 2)} cm, drift ${fmt(worstDrift, 2)} cm per m/s (WEAPONS: 0.5 and 0.1)`);
      assert(worstPath < 1, `path error ${worstPath}`);
      assert(worstDrift < 0.2, `drift error ${worstDrift}`);
    },
  },
  {
    name: 'a lookup costs under 2 µs × k and allocates nothing after the first (its answer the table\'s own object); the tables build once per calibre, load and barrel',
    fn() {
      const t0 = performance.now(), T = boreTable(...R7), built = performance.now() - t0;
      const a = T.at(0.89, 322, 1, 300), b = T.at(0.5, 330, 0.95, 123.4);
      assert(a === b, 'the same answer object every call');
      const N = 200_000, t1 = performance.now();
      let s = 0;
      for (let i = 0; i < N; i++) s += T.at(0.89, 322, 1, (i % 1200) + 0.5).tofS;
      const us = (performance.now() - t1) * 1000 / N, k = machine().k;
      console.log(`      ${fmt(us, 3)} µs a lookup over ${N} (ceiling ${fmt(2 * k, 2)} µs, machine k ${fmt(k, 2)}); the table already built (${fmt(built, 2)} ms to fetch), ${s > 0 ? 'summed' : ''}`);
      assert(us < 2 * k, `${us} µs`);
      assert(boreTable(...R7) === T, 'cached');
    },
  },
  {
    name: 'the battle-sight zero and the wound factor: BZO 400 m on the valley floor (its record), the optic 6.5 cm over the bore; w 1.61 at 10 m and 1.42 at 300 m (WEAPONS §8.1)',
    fn() {
      console.log(`      BZO ${JSON.stringify(BZO)}; OPTIC_H_M ${OPTIC_H_M}; v0 ${fmt(v0Of(...R7), 1)} m/s (C-7 ${fmt(v0Of('6.5x40r', 'ball', 300), 1)})`);
      const L = CALIBRES['6.5x40r'], w = [1, 10, 100, 300].map(d => woundFactor({ eJ: flight(...R7, E['mars-valley'], d).eJ, diaMm: L.diaMm, woundK: 1 }));
      console.log(`      w: 1 m ${fmt(w[0], 2)}, 10 m ${fmt(w[1], 2)}, 100 m ${fmt(w[2], 2)}, 300 m ${fmt(w[3], 2)} (W 1.61, 1.55, 1.42)`);
      near(w[1], 1.61, 0.03, 'w at 10 m'); near(w[3], 1.42, 0.03, 'w at 300 m');
      assert(BZO.rangeM === 400 && Math.abs(BZO.gMs2 - 3.7265) < 0.001 && BZO.v0Ms === 790, JSON.stringify(BZO));
      near(flight(...R7, E['mars-valley'], 400).pathCm, 0, 0.05, 'the BZO crosses the line at 400 m');
    },
  },
];
