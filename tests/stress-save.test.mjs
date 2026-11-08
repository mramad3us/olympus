// OLYMPUS tests: a save made anywhere in "Bang" (test-stress, the build sheet 0.0.10 §3, §6) carries on byte for byte. The
// stress bot plays the course from its brief to the card on seed 48213 as the boot recruit and the tier one; saves are taken
// in the din between two blanks with the horn sounding, in a running Breathe, a tick into the called bang's startle and the
// three bangs', at the pause with the pool draining, in the RELOAD of string 5, after the second turner turned, and between
// strings with the hit card's truth up. Each is loaded into a fresh game and played on by a fresh bot (its memory is plain
// data on the actor, so it loads too) to the card: every one ends on the straight run's tick and digest. The noise plan, the
// block's Breathe window and stress fold, the second turner's time and the strings' records are saved state, never a
// closure's. (The page's twin is browser.test.mjs's test-stress case.)
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stressBot } from './bots/stress.mjs';
import { pairsNow } from '../src/sim/scenarios/pairs.js';
import { STRESS_SAVES } from './stress-saves.mjs';
import { suppNow } from '../src/sim/combat/supp.js';

const MAX_TICKS = 20 * 60 * 30;

function play(g, until = () => false) {
  const bot = stressBot();
  let t = 0;
  for (; t < MAX_TICKS && !pairsNow(g.state)?.end; t++) { g.step(1, bot); g.clearFacts?.(); until(); }
  return t;
}

export default [
  {
    name: 'a save made anywhere in "Bang" (the din, a Breathe, a startle, the RELOAD, the second turner, between strings) loads and carries on byte for byte to the card, as the boot recruit and the tier one on 48213 (the build sheet 0.0.10 §6: "a save mid-string carries on byte for byte")',
    heavy: true,   // (a whole-course or many-roll run: out of the quick suite, which is held to 60 s; it runs in the full suite and every release)
    timeoutMs: 600_000,
    fn() {
      for (const tier of ['recruit', 'tierone']) {
        const start = { scenario: 'test-stress', seed: 48213, tier };
        const g = createGame(start), saves = [], left = new Map(STRESS_SAVES);
        const ticks = play(g, () => {
          const s = g.state, R = s.armoury?.range;
          if (!R?.stress || R.end) return;
          const u = suppNow(s);
          for (const [at, test] of left) if (test(s, R, u)) { left.delete(at); saves.push({ at, tick: s.clock.tick, json: g.save() }); }
        });
        const A = { tick: g.state.clock.tick, digest: g.digest(), end: !!pairsNow(g.state)?.end };
        console.log(`      ${tier}: straight ${ticks} ticks to the card, tick ${A.tick}, digest ${A.digest}`);
        const bad = [];
        for (const sv of saves) {
          const h = createGame(start);
          h.load(sv.json);
          play(h);
          const B = { tick: h.state.clock.tick, digest: h.digest() };
          console.log(`        saved ${sv.at} at tick ${sv.tick} (${fmt(sv.json.length / 1024, 0)} KB): tick ${B.tick}, ${B.digest === A.digest ? 'the same digest' : `DIGEST ${B.digest}`}`);
          if (B.tick !== A.tick || B.digest !== A.digest) bad.push({ at: sv.at, ...B });
        }
        if (left.size) console.log(`        not reached as ${tier}: ${[...left.keys()].join(', ')}`);
        assert(A.end, JSON.stringify({ tier, A }));
        assert(!bad.length, JSON.stringify({ tier, bad }));
        // (the recruit reaches every point but, on some seeds, Breathe; the tier one never startles long nor breathes)
        const must = tier === 'recruit' ? ['the din, the horn sounding', 'the din, between two blanks', 'a tick into the three bangs\' startle', 'the bangs\' pause, the pool draining', 'in the RELOAD of string 5', 'the second turner turned', 'between strings, the truth up']
          : ['the din, between two blanks', 'in the RELOAD of string 5', 'the second turner turned', 'between strings, the truth up'];
        assert(must.every(m => saves.some(x => x.at === m)), JSON.stringify({ tier, saved: saves.map(x => x.at), missed: [...left.keys()] }));
      }
    },
  },
];
