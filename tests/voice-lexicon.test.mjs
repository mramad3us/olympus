// OLYMPUS tests: every word the house can say is spelt (src/data/voices.js; the build sheet v0.0.20 item 7, §0 item 20).
//
// The voice (src/ui/audio/voice.js) reads a word from LEXICON, else from an entry by its endings (MORPH), a number by
// core/speech.js's rule, a lone capital by its letter; letter by letter is the game's last resort only, and a word read so is
// a hole in the table. The lines are every line the house can say, from the tables they are drawn from: the tower's
// (courses.js SEQ_HOUSE, its say and short), the instructor's (HOUSE_CHIEF, HOUSE_NUDGE, handling.js NUDGE, PAIRS_COACH.slow,
// the opfor's lines), the team's (team.js TEAM_WORDS, every call yours and his), the challenge and the role-players'. A
// placeholder ({room}, {s}) is dropped, its values (numbers, room words) read by the rule. Every TEAM_WORDS id has a register
// (voices.js REGISTER: never a field on team.js), so A's and B's new words fail here until they are given one. Prints the
// vocabulary's size, how each word is read, and the longest line's spoken time.
import { assert, fmt } from './helpers.mjs';
import { LEXICON, REGISTER, PHONES, LETTERS } from '../src/data/voices.js';
import { spell, spellToken, linePlan } from '../src/ui/audio/voice.js';
import { spokenWords, spokenMs, numberWords } from '../src/core/speech.js';
import { SEQ_HOUSE, HOUSE_CHIEF, HOUSE_NUDGE, PAIRS_COACH, COURSES } from '../src/data/courses.js';
import { TEAM_WORDS } from '../src/sim/combat/team.js';
import { CHALLENGE_SAY } from '../src/sim/combat/contact.js';
import { RP_SAY } from '../src/sim/scenarios/opfor.js';
import { NUDGE } from '../src/sim/scenarios/handling.js';

/** Every line the house can say (see the header), placeholders dropped. */
export function houseLines() {
  const out = new Set(), walk = (x) => { if (typeof x === 'string') out.add(x); else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') Object.values(x).forEach(walk); };
  walk(SEQ_HOUSE.map(c => [c.say, c.short ?? []])); walk(HOUSE_CHIEF); walk(HOUSE_NUDGE); walk(NUDGE); walk(PAIRS_COACH.slow); walk(COURSES.house?.opfor ?? {});
  walk(Object.values(TEAM_WORDS).map(w => w?.words ?? [])); walk(CHALLENGE_SAY); walk(RP_SAY);
  walk(['Ready.', 'Clear!', 'Hold that door.', 'Left!', 'Right!', 'Shooter, back on your mark.', 'Number two, a round up.']);
  return [...out].map(t => t.replace(/\{[a-zA-Z]+\}('s)?/g, ' ').replace(/\s+/g, ' ').trim()).filter(t => /[A-Za-z]/.test(t));
}

export default [
  {
    name: 'every word of every line the house can say is spelt by the lexicon, its endings, the numbers\' rule or a letter\'s name, never letter by letter; every phoneme known; every TEAM_WORDS id has a register (voices.js REGISTER)',
    fn() {
      const lines = houseLines(), how = {}, holes = new Map(), unknownPh = new Set();
      for (const t of lines) for (const tok of spokenWords(t)) for (const w of spellToken(tok)) {
        how[w.how] = (how[w.how] ?? 0) + 1;
        if (w.how === 'rule') holes.set(w.word.toLowerCase(), (holes.get(w.word.toLowerCase()) ?? 0) + 1);
        for (const ph of w.ph) if (!PHONES[ph.replace(/\d$/, '')]) unknownPh.add(ph);
      }
      const noReg = Object.keys(TEAM_WORDS).filter(id => !REGISTER[id]);
      const longest = lines.reduce((a, t) => (spokenMs(t) > spokenMs(a) ? t : a), '');
      const vocab = new Set(lines.flatMap(t => spokenWords(t).flatMap(tok => spellToken(tok).map(w => w.word.toLowerCase()))));
      console.log(`      ${lines.length} lines, ${vocab.size} words, the lexicon ${Object.keys(LEXICON).length} entries; read by ${Object.entries(how).map(([k, n]) => `${k} ${n}`).join(', ')}; letter by letter: ${[...holes.keys()].join(', ') || 'none'}`);
      console.log(`      the longest line ${fmt(spokenMs(longest) / 1000, 2)} s spoken (${spokenWords(longest).length} words): "${longest.slice(0, 90)}…"; TEAM_WORDS ids ${Object.keys(TEAM_WORDS).length}, with no register: ${noReg.join(', ') || 'none'}`);
      assert(!holes.size, `letter by letter: ${[...holes.keys()].join(', ')}`);
      assert(!unknownPh.size, `unknown phonemes ${[...unknownPh].join(', ')}`);
      assert(!noReg.length, `no register: ${noReg.join(', ')}`);
    },
  },
  {
    name: 'numbers 0 to 999 are read (core/speech.js numberWords, read by the voice and the tower\'s wait alike): every word of every number in the lexicon, "300" three words of time, "0.38" four; a lone capital its letter\'s name ("Lane A")',
    fn() {
      const miss = new Set();
      for (let n = 0; n < 1000; n++) for (const w of numberWords(n)) if (!LEXICON[w]) miss.add(w);
      const samples = ['300', '0.38', '2a', '17', '105'].map(t => `${t} → ${spokenWords(t).join(' ')} (${spokenMs(t)} ms)`);
      const a = spell('A'), lane = linePlan('Lane A. Standby.');
      console.log(`      ${samples.join('; ')}; "A" read as ${a.how} ${a.ph.join(' ')}; "Lane A. Standby." ${lane.words.map(w => `${w.tok} ${w.how}`).join(', ')}, ${lane.ms} ms`);
      assert(!miss.size, `numbers' words not in the lexicon: ${[...miss].join(', ')}`);
      assert(spokenWords('300').length === 2 && spokenWords('0.38').length === 4 && a.how === 'letter' && LETTERS.A && lane.ms === 1150, JSON.stringify({ a }));
    },
  },
];
