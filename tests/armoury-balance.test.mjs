// OLYMPUS tests: "The window and the canopy"'s balance, printed, F178 (the build sheet v0.0.28 §8, §13 questions 4, 5 and 7; the user's to judge).
//
// By sheet (the picker's five) at each tempo (rushed, normal, careful: tests/bots/armoury.mjs armouryBot's tempo) and at the DI's, over 40
// seeds by the honest marine: the first-time passes, the turn-backs, 'late' (signed in after ten-thirty), the real minutes. Red is a
// question for the user with these figures, never a constant tuned (§11 risk 4): the private by the keys at the DI's tempo 2.5 to 6 real
// minutes, the recruit at most 8.
import { assert } from './helpers.mjs';
import { laneOf } from './flawless-armoury.mjs';
import { armouryBot } from './bots/armoury.mjs';

const SHEETS = Object.freeze(['recruit', 'private', 'sgt', 'raider', 'tierone']), TEMPOS = Object.freeze(['rushed', 'normal', 'careful', 'di']);
const N = 40;

export default [
  {
    name: 'F178 (heavy): by sheet and tempo over 40 seeds, first-time passes, turn-backs and late, the DI\'s tempo, the real minutes (the private 2.5 to 6, the recruit at most 8)',
    heavy: true,
    timeoutMs: 3_600_000,
    fn() {
      const real = {};
      for (const tier of SHEETS) {
        const cells = [];
        for (const tempo of TEMPOS) {
          const L = [];
          for (let k = 0; k < N; k++) L.push(laneOf({ seed: 1 + k, tier, bot: armouryBot({ tempo }) }));
          const first = L.filter(l => l.passed && !l.turnBacks).length, late = L.filter(l => l.late).length, tb = L.reduce((t, l) => t + l.turnBacks, 0) / N;
          const m = L.map(l => l.realMin).sort((a, b) => a - b), tempos = [...new Set(L.map(l => l.tempo))].join('/');
          cells.push(`${tempo === 'di' ? `DI (${tempos})` : tempo} first ${Math.round(first / N * 100)}%, ${tb.toFixed(2)} turn-backs, late ${Math.round(late / N * 100)}%, ${m[N >> 1].toFixed(1)} min`);
          if (tempo === 'di') real[tier] = m;
        }
        console.log(`      ${tier}: ${cells.join(' | ')}`);
      }
      const p = real.private, r = real.recruit;
      console.log(`      the private by the keys at the DI's: median ${p[N >> 1].toFixed(2)}, ${p[0].toFixed(2)} to ${p.at(-1).toFixed(2)} real min; the recruit's max ${r.at(-1).toFixed(2)}`);
      assert(p[N >> 1] >= 2.5 && p[N >> 1] <= 6 && r.at(-1) <= 8, 'a question for the user, with the figures above (never a constant tuned)');
    },
  },
];
