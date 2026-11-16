// OLYMPUS tests: how long a line takes to say aloud (src/core/speech.js; the build sheet v0.0.20 §3 step 1, item 7, §0 item 32).
//
// spokenMs is the one quantity the tower's wait on the PA, the voice's queue and the speaker's mark read, so it is pinned
// here on its own: SPOKEN_LEAD_MS 250 plus SPOKEN_WORD_MS 300 a word, nothing for a line with no words, and the house's own
// lines timed as the sheet times them (the PA's brief, 35 words, 10.75 s; the instructor's own after it, 27 words, 8.35 s).
import { assert } from './helpers.mjs';
import { spokenMs, spokenWords, SPOKEN_WORD_MS, SPOKEN_LEAD_MS } from '../src/core/speech.js';
import { SEQ_HOUSE, HOUSE_CHIEF } from '../src/data/courses.js';
import { SAY_MS, SAY_WORD_MS } from '../src/sim/scenarios/handling.js';

export default [
  {
    name: 'a line takes SPOKEN_LEAD_MS 250 plus SPOKEN_WORD_MS 300 a word to say, and no time with no words: 35 words are 10.75 s and 27 words 8.35 s, as the build sheet v0.0.20 times the brief (§0 item 32)',
    fn() {
      const words = (n) => Array.from({ length: n }, (_, i) => `w${i}`).join(' ');
      const got = { 0: spokenMs(''), 1: spokenMs('GO!'), 27: spokenMs(words(27)), 35: spokenMs(words(35)), spaces: spokenMs('  Lane   A.\tStandby.\n'), nul: spokenMs(null) };
      console.log(`      SPOKEN_LEAD_MS ${SPOKEN_LEAD_MS}, SPOKEN_WORD_MS ${SPOKEN_WORD_MS}; empty ${got[0]} ms, "GO!" ${got[1]} ms, 27 words ${got[27]} ms, 35 words ${got[35]} ms, "Lane A. Standby." with odd spaces ${got.spaces} ms, null ${got.nul} ms`);
      assert(SPOKEN_LEAD_MS === 250 && SPOKEN_WORD_MS === 300, JSON.stringify({ SPOKEN_LEAD_MS, SPOKEN_WORD_MS }));
      assert(got[0] === 0 && got.nul === 0, JSON.stringify(got));
      assert(got[1] === 550 && got[27] === 8350 && got[35] === 10750 && got.spaces === 1150, JSON.stringify(got));
      assert(spokenWords('  Lane   A.\tStandby.\n').join('|') === 'Lane|A.|Standby.', JSON.stringify(spokenWords('  Lane   A.\tStandby.\n')));
    },
  },
  {
    name: 'the shoot house\'s tower lines and the instructor\'s brief, timed spoken against their text hold: every line shorter spoken than shown (handling.js durOf: 3.5 s plus 0.33 s a word)',
    fn() {
      const durOf = (t) => SAY_MS + SAY_WORD_MS * spokenWords(t).length;
      const rows = [];
      for (const def of SEQ_HOUSE) for (const [i, t] of def.say.entries()) rows.push({ id: `${def.id}#${i}`, n: spokenWords(t).length, ms: spokenMs(t), hold: durOf(t) });
      for (const [i, t] of HOUSE_CHIEF.brief.entries()) rows.push({ id: `chief.brief#${i}`, n: spokenWords(t).length, ms: spokenMs(t), hold: durOf(t) });
      console.log(`      ${rows.map(r => `${r.id} ${r.n} words ${(r.ms / 1000).toFixed(2)} s (shown ${(r.hold / 1000).toFixed(2)} s)`).join('; ')}`);
      const over = rows.filter(r => !(r.ms > 0 && r.ms < r.hold));
      assert(!over.length, JSON.stringify(over));
    },
  },
];
