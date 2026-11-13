// OLYMPUS tests: the panel's marks under the mastery rule (VIEWS §7.4, SKILLS §5.1; built in the shoot house's rework R4, 2026-11-12): ~ a natural 1 caught, ★ a natural 20, ! a stoppage, ✗ only a failure that cost something, "sure" where a 1 would be caught.
//
// The count of 2026-11-11 found every routine 1 drawn as a red ✗ (1,254 of 1,254), no 20 drawn at all, and the instructor's
// dummy click drawn as a fumble: so "nat 1s are insanely frequent, much much more than nat 20s" (the user). Here the marks come
// from the one helper (stepper.js markOf) the panel and the bundle's lanes read, over real lanes: the tier one by T shows no ✗
// at all and his dummy's click as !, his 1s as ~ and his 20s as ★; the private by the keys keeps a ✗ only for a failure.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot, runHouse } from './bots/house.mjs';
import { markOf } from '../src/sim/combat/stepper.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { flawlessSeeds } from './flawless.mjs';

// (every sub-step's mark of the player's steps over a lane: { marks: { '✓': n, … }, bad: [a ✗ with no failure] })
function marksOf(tier, seed, bot) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), pid = g.state.player.id, marks = {}, bad = [];
  let sure = 0;
  g.bus.on?.('step', (f) => {
    if (f.who !== pid || (f.phase !== 'sub' && f.phase !== 'halt')) return;
    const m = markOf(f);
    if (!m) return;
    marks[m] = (marks[m] ?? 0) + 1;
    if (m === '✗' && f.ok !== false) bad.push(f.action);
    if (f.caught && m !== '~') bad.push(`${f.action} caught as ${m}`);
  });
  runHouse(g, bot(), { maxMs: 12 * 60_000, each: (game) => { const S = game.state.stop; if (S?.phase === 'choose' && !sure) sure = stepsOf(game.state).filter(r => r.kind === 'shot' && r.rounds?.every(x => x.odds >= 1)).length; } });
  return { marks, bad, sure };
}

export default [
  {
    name: 'the tier one by T over five lanes: no ✗ (none of his rolls fails), the dummy round\'s click a !, his natural 1s ~ and his 20s ★; his shot rows read "sure"; the private by the keys: a ✗ only on a failure, never on a caught 1',
    timeoutMs: 180_000,
    fn() {
      const T = { marks: {}, bad: [], sure: 0 }, P = { marks: {}, bad: [] };
      for (const seed of flawlessSeeds(5)) {
        const t = marksOf('tierone', seed, houseHonestBot), p = marksOf('private', seed, houseKeysBot);
        for (const [m, n] of Object.entries(t.marks)) T.marks[m] = (T.marks[m] ?? 0) + n;
        for (const [m, n] of Object.entries(p.marks)) P.marks[m] = (P.marks[m] ?? 0) + n;
        T.bad.push(...t.bad); P.bad.push(...p.bad); T.sure = Math.max(T.sure, t.sure);
      }
      const say = (o) => Object.entries(o).map(([m, n]) => `${m} ${n}`).join(', ');
      console.log(`      the tier one: ${say(T.marks)}; shot rows all "sure" at a stop: ${T.sure}; the private: ${say(P.marks)}`);
      assert(!T.marks['✗'] && T.marks['!'] >= 5 && (T.marks['~'] ?? 0) + (T.marks['★'] ?? 0) > 0 && T.sure > 0 && !T.bad.length, JSON.stringify(T));
      assert(!P.bad.length && P.marks['!'] >= 5, JSON.stringify(P));
    },
  },
];
