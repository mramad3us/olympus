// The dice (src/core/rng.js) and the hashes (src/core/hash.js): the same seed gives the same rolls
// (and tradecraft's, bit for bit, so a ported seed recipe gives the same world), streams don't move
// each other, the saved streams travel in the save, and the distributions are fair.
import { assert, near, fmt } from './helpers.mjs';
import { seedRng, stream, rngOf, next, int, intIn, range, pick, chance, d20, weighted, shuffle, normal } from '../src/core/rng.js';
import { hash, hash01, hashInt, hashPick, digest } from '../src/core/hash.js';
import { newState, toJSON, fromJSON } from '../src/core/state.js';

const draws = (r, n) => Array.from({ length: n }, () => next(r));

export default [
  {
    name: 'determinism: a seed gives the same sequence every time, and tradecraft\'s sequence bit for bit',
    fn() {
      const a = draws(seedRng(42), 1000), b = draws(seedRng(42), 1000), c = draws(seedRng(43), 1000);
      assert(a.every((x, i) => x === b[i]), 'seed 42 twice gave two sequences');
      assert(a.filter((x, i) => x === c[i]).length === 0, 'seeds 42 and 43 share draws');
      // (pinned from tradecraft's src/sim/rng.js, read-only, 2026-11-05)
      const TRADECRAFT_42 = [0.23955312534235418, 0.5859209857881069, 0.09323416277766228, 0.19866962218657136, 0.44710162095725536];
      assert(TRADECRAFT_42.every((x, i) => x === a[i]), `seed 42 differs from tradecraft's: ${a.slice(0, 5)}`);
      const r = seedRng(42); draws(r, 5);
      assert(JSON.stringify(r) === JSON.stringify([439289942, 4127154364, 2919221138, 3317318734]), `the words after five draws: ${r}`);
      const d = seedRng(1);
      assert(Array.from({ length: 8 }, () => d20(d)).join(' ') === '9 16 14 11 20 19 16 18', 'seed 1\'s first eight d20 differ from tradecraft\'s');
      assert(hash('passerby', 7, 'x') === 3592857916 && hash(4294967297) === 1796632504, 'hash differs from tradecraft\'s');
      console.log(`      seed 42: ${a.slice(0, 3).map(x => fmt(x, 6)).join(', ')} … (tradecraft's, bit for bit); seed 1's d20: 9 16 14 11 20 19 16 18`);
    },
  },
  {
    name: 'determinism: a state\'s dice resume exactly after a save and a load',
    fn() {
      const s = newState(7);
      draws(rngOf(s), 123); draws(rngOf(s, 'people'), 45);
      const t = fromJSON(toJSON(s));
      const a = draws(rngOf(s), 50).concat(draws(rngOf(s, 'people'), 50));
      const b = draws(rngOf(t), 50).concat(draws(rngOf(t, 'people'), 50));
      assert(a.every((x, i) => x === b[i]), 'the loaded dice rolled differently');
      console.log(`      after 123 + 45 draws, saved and loaded: the next 100 equal (main ${fmt(a[0], 6)}, people ${fmt(a[50], 6)})`);
    },
  },
  {
    name: 'streams: a stream of its own is the same whatever was rolled before, and named saved streams don\'t move each other',
    fn() {
      const first = draws(stream('room', 3, 12), 5);
      const main = seedRng(9); draws(main, 777);
      const again = draws(stream('room', 3, 12), 5);
      assert(first.every((x, i) => x === again[i]), 'a stream changed with the main dice');
      assert(next(stream('room', 3, 12)) !== next(stream('room', 3, 13)) && next(stream('room', 3)) !== next(stream('room', 3, '')), 'neighbouring streams coincide');

      // Two games of one seed: in the second, the 'people' system draws three times as often. The
      // 'world' stream and the main dice must not notice.
      const g1 = newState(2026), g2 = newState(2026);
      const w1 = [], w2 = [], m1 = [], m2 = [];
      for (let k = 0; k < 100; k++) {
        draws(rngOf(g1, 'people'), 1); draws(rngOf(g2, 'people'), 3);
        w1.push(next(rngOf(g1, 'world'))); w2.push(next(rngOf(g2, 'world')));
        m1.push(next(rngOf(g1))); m2.push(next(rngOf(g2)));
      }
      assert(w1.every((x, i) => x === w2[i]) && m1.every((x, i) => x === m2[i]), 'one system\'s draws moved another\'s');
      assert(w1[0] !== m1[0] && next(rngOf(newState(2027), 'world')) !== w1[0], 'streams of different names or seeds coincide');
      assert(Object.keys(g1.rng).sort().join() === 'main,people,world', `saved streams: ${Object.keys(g1.rng)}`);
      console.log(`      'people' drawing 100 or 300 times: 'world' and 'main' unmoved; saved streams ${Object.keys(g1.rng).sort().join(', ')}`);
    },
  },
  {
    name: 'fairness: uniform [0, 1), a fair d20, ints in range, weights by weight',
    fn() {
      const r = seedRng(5), N = 200000;
      let sum = 0, lo = 1, hi = 0;
      for (let i = 0; i < N; i++) { const x = next(r); sum += x; lo = Math.min(lo, x); hi = Math.max(hi, x); }
      near(sum / N, 0.5, 0.004, 'mean of next()');
      assert(lo >= 0 && hi < 1, `next() outside [0, 1): ${lo} ${hi}`);
      const faces = new Array(21).fill(0);
      for (let i = 0; i < N; i++) faces[d20(r)]++;
      assert(faces[0] === 0, 'a d20 rolled 0');
      const exp = N / 20, chi2 = faces.slice(1).reduce((s, o) => s + (o - exp) ** 2 / exp, 0);
      assert(chi2 < 43.8, `d20 chi-square ${fmt(chi2)} over 19 degrees of freedom (p < 0.001 at 43.8)`);
      for (let i = 0; i < 1000; i++) { const k = intIn(r, -3, 3); assert(k >= -3 && k <= 3 && Number.isInteger(k), `intIn gave ${k}`); }
      for (let i = 0; i < 1000; i++) { const k = int(r, 7), x = range(r, 2, 5); assert(k >= 0 && k < 7 && x >= 2 && x < 5, `int/range gave ${k} ${x}`); }
      const counts = { a: 0, b: 0, c: 0 };
      for (let i = 0; i < 60000; i++) counts[weighted(r, [['a', 1], ['b', 2], ['c', 3]])]++;
      near(counts.c / 60000, 0.5, 0.01, 'weight 3 of 6');
      let yes = 0; for (let i = 0; i < 50000; i++) yes += chance(r, 0.3) ? 1 : 0;
      near(yes / 50000, 0.3, 0.01, 'chance(0.3)');
      const list = ['x', 'y', 'z']; const seen = new Set(); for (let i = 0; i < 300; i++) seen.add(pick(r, list));
      assert(seen.size === 3, 'pick missed an item');
      console.log(`      mean ${fmt(sum / N, 4)} over ${N}; d20 faces ${Math.min(...faces.slice(1))}-${Math.max(...faces.slice(1))} (expected ${exp}), chi-square ${fmt(chi2, 1)}; weights 1:2:3 → c ${fmt(counts.c / 600, 1)}%; chance(0.3) → ${fmt(yes / 500, 1)}%`);
    },
  },
  {
    name: 'shuffle and normal: a permutation, and a bell of the asked mean and spread',
    fn() {
      const r = seedRng(11);
      const s = shuffle(r, Array.from({ length: 50 }, (_, i) => i));
      assert(s.slice().sort((a, b) => a - b).every((x, i) => x === i), 'shuffle lost or doubled an item');
      assert(s.some((x, i) => x !== i), 'shuffle left 50 items in order');
      const N = 100000; let m = 0, m2 = 0;
      for (let i = 0; i < N; i++) { const x = normal(r, 10, 2); m += x; m2 += x * x; }
      const mean = m / N, sd = Math.sqrt(m2 / N - mean * mean);
      near(mean, 10, 0.03, 'normal mean'); near(sd, 2, 0.03, 'normal sd');
      console.log(`      normal(10, 2) over ${N}: mean ${fmt(mean, 3)}, sd ${fmt(sd, 3)}`);
    },
  },
  {
    name: 'hashes: cosmetic choices without dice, order matters, golden digest',
    fn() {
      assert(hash('a', 'b') !== hash('b', 'a') && hash('ab', 'c') !== hash('a', 'bc'), 'hash ignores order or the parts\' edges');
      assert(hash(1) !== hash(4294967297), 'hash folds high words');
      let lo = 1, hi = 0; const picks = { a: 0, b: 0, c: 0 };
      for (let i = 0; i < 30000; i++) { const x = hash01('line', i); lo = Math.min(lo, x); hi = Math.max(hi, x); picks[hashPick(['a', 'b', 'c'], 'poster', i)]++; }
      assert(lo >= 0 && hi < 1, 'hash01 outside [0, 1)');
      for (const k of 'abc') near(picks[k] / 30000, 1 / 3, 0.02, `hashPick ${k}`);
      assert(hashInt(10, 'x', 1) === hashInt(10, 'x', 1), 'hashInt not stable');
      assert(digest('OLYMPUS') === digest('OLYMPUS') && digest('OLYMPUS') !== digest('OLYMPUs'), 'digest not stable or not sensitive');
      assert(/^[0-9a-f]{14}$/.test(digest('')), 'digest is not 14 hex digits');
      assert(digest('OLYMPUS') === '0edbb5d6db40b3', `digest('OLYMPUS') is ${digest('OLYMPUS')} (pinned: a change here moves every golden hash)`);
      console.log(`      hashPick over 30000: a ${picks.a}, b ${picks.b}, c ${picks.c}; digest('OLYMPUS') ${digest('OLYMPUS')}`);
    },
  },
];
