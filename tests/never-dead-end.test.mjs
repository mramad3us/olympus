// Never a dead end on test-range (the user, 2026-11-07, DESIGN.md's log: "A scene never dead-ends"; the build sheet 0.0.7 §5.3): the fuzz shooter presses random legal keys and range actions, and every run reaches the score card.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { kdFuzzBot } from './bots/kd.mjs';
import { kdNow } from '../src/sim/scenarios/range.js';
import { COURSES, KD_STRINGS, SEQ_KD } from '../src/data/courses.js';

// (the longest a command may wait, lived: the move-on, then the RO's gap before the next command, and a step the shooter
// is in when the move-on comes, which it lets finish: UNLOAD, SHOW CLEAR begun again at 59 s took 6.1 s on fuzz seed 31
// (the integrator's, 0.0.7: 67 s, the card reached); STEP_MAX_S 8 holds the longest Corps command at Weapon handling 5)
const STEP_MAX_S = 8;
const WAIT_MAX_S = (COURSES.kd.moveOnMs + COURSES.kd.roGapMs[1]) / 1000 + STEP_MAX_S;
// (0.0.7's tower fixer: the move-on waits on R.onYouMs, the line's wait on you alone (range.js kdWaitOnYou), and a timed
// string runs to its own limit, the confirm's five minutes (it was cut at 60 s lived with a 'slow' fault): so the wait
// measured is onYouMs, and a string's lived length is held to its limit and the tower's gap after it)
const LIMIT_MAX_S = Math.max(...Object.values(KD_STRINGS).map(x => x.limitS ?? 0)) + 1 + COURSES.kd.roGapMs[1] / 1000;

/** A fuzz run to the card: { card, gameMin, ticks, faults, longestLivedS, longestAt, summary }. */
export function fuzzRun(k, setup = null) {
  const g = createGame({ scenario: 'test-range', seed: 1000 + k, setup }), s = g.state, bot = kdFuzzBot({ seed: k }), t0 = s.clock.ms;
  let ticks = 0, longest = 0, longestAt = null, lived = 0;
  for (; s.clock.ms - t0 < 60 * 60_000 && ticks < 20 * 60 * 60; ticks++) {
    g.step(1, bot);
    const R = s.armoury.range, w = R.cmd && SEQ_KD[R.cmd.i]?.ready === 'arrived' ? R.livedMs : R.onYouMs ?? 0;
    if (w > longest) { longest = w; longestAt = R.cmd?.id ?? null; }
    if (R.livedMs > lived) lived = R.livedMs;
    if (kdNow(s).end) break;
    if (ticks % 2000 === 0) g.clearFacts();
  }
  const K = kdNow(s), R = s.armoury.range;
  return { card: !!K.end, end: K.end?.phase, gameMin: (s.clock.ms - t0) / 60000, ticks, faults: R.faults.map(f => f.rule), longestLivedS: longest / 1000, longestAt, livedS: lived / 1000, summary: K.summary, steps: s.actors.list.find(a => a.id === s.player.actor)?.bot?.steps ?? {} };
}
const report = (rows) => {
  const worst = rows.reduce((a, b) => (b.gameMin > a.gameMin ? b : a));
  const wait = rows.reduce((a, b) => (b.longestLivedS > a.longestLivedS ? b : a));
  console.log(`      ${rows.length} runs: ${rows.filter(r => r.card).length} reached the card (${rows.filter(r => r.end === 'stopped').length} by a stop); the longest ${fmt(worst.gameMin, 1)} game minutes (${worst.ticks} ticks, ${worst.faults.length} faults: ${[...new Set(worst.faults)].join(', ')})`);
  console.log(`      the longest a command waited on the shooter alone, lived: ${fmt(wait.longestLivedS, 0)} s at ${wait.longestAt} (the move-on at 60 s, a step it lets finish and the tower's gap: at most ${WAIT_MAX_S} s); the longest command lived ${fmt(Math.max(...rows.map(r => r.livedS)), 0)} s (a timed string to its limit and the gap: at most ${LIMIT_MAX_S} s); faults by kind: ${Object.entries(rows.flatMap(r => r.faults).reduce((m, f) => ((m[f] = (m[f] ?? 0) + 1), m), {})).map(([k, n]) => `${k} ${n}`).join(', ')}`);
};

export default [
  {
    name: 'the fuzz shooter on four seeds from the brief reaches the card every time within 60 game minutes, no command waited on past the move-on (the user\'s "A scene never dead-ends", 2026-11-07)',
    fn() {
      const rows = [1, 2, 3, 4].map(k => fuzzRun(k));
      report(rows);
      for (const r of rows) assert(r.card && r.gameMin <= 60, JSON.stringify(r));
      assert(rows.every(r => r.longestLivedS <= WAIT_MAX_S), `a wait past the move-on and its gap (${WAIT_MAX_S} s): ${JSON.stringify(rows.map(r => [r.longestLivedS, r.longestAt]))}`);
      assert(rows.every(r => r.livedS <= LIMIT_MAX_S), `a command lived past the longest string's limit and its gap (${LIMIT_MAX_S} s): ${JSON.stringify(rows.map(r => r.livedS))}`);
    },
  },
  {
    name: 'the fuzz shooter on 30 seeds from the brief and 10 from the 200 m line reaches the card every time within 60 game minutes',
    heavy: true, timeoutMs: 600_000,
    fn() {
      const rows = [...Array.from({ length: 30 }, (_, i) => fuzzRun(10 + i)), ...Array.from({ length: 10 }, (_, i) => fuzzRun(100 + i, 's200'))];
      report(rows);
      for (const r of rows) assert(r.card && r.gameMin <= 60, JSON.stringify(r));
      assert(rows.every(r => r.longestLivedS <= WAIT_MAX_S), `a wait past the move-on and its gap (${WAIT_MAX_S} s): ${JSON.stringify(rows.map(r => [r.longestLivedS, r.longestAt]))}`);
      assert(rows.every(r => r.livedS <= LIMIT_MAX_S), `a command lived past the longest string's limit and its gap (${LIMIT_MAX_S} s): ${JSON.stringify(rows.map(r => r.livedS))}`);
    },
  },
];
