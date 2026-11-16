// OLYMPUS tests: the live lane's words (COMBAT §25.18; the build sheet v0.0.19 §1 L-house): the instructor's new lines, the team's, the DI's four, the run sheet's and the card's, none naming a lane or a house (F16's rule, tests/flawless.mjs LANE_WORDS).
//
// The words are data: data/courses.js HOUSE_CHIEF's out, paint, casualty, twoDown, surrendered, reopened and uncovered (and the
// hot wash's one thing for the casualty, surrendered, uncovered and reopened), COURSES.house.opfor's got, hit and manDown, the
// DI's cqb-rp-* texts, shoothouse.js FAULT_WORDS' and FAULT_PAPER's four, and ui/cards/house.js FAULT_MARKS' red marks for them.
// Each has two phrasings at least where it is said, its slots filled, and the paper's words of a live lane run to its card read
// "LIVE: … · PAINT ON YOU …" on the legs with a role-player and "2 ROLE-PLAYERS · … · PAINT ON YOU: …" on the card.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot, runHouse } from './bots/house.mjs';
import { HOUSE_CHIEF, COURSES } from '../src/data/courses.js';
import { CQB_RULES } from '../src/sim/skills/instinct/cqb.js';
import { FAULT_WORDS, runSheetOf, LIVE_NAMES } from '../src/sim/scenarios/shoothouse.js';
import { FAULT_MARKS, isFault, rowParts } from '../src/ui/cards/house.js';
import { LANE_WORDS } from './flawless.mjs';

const CHIEF = ['out', 'paint', 'casualty', 'twoDown', 'surrendered', 'reopened', 'uncovered'], ONE = ['casualty', 'surrendered', 'uncovered', 'reopened'], TEAM = ['got', 'hit', 'manDown'];
const KINDS = ['surrendered', 'uncovered', 'reopened', 'casualty'];

export default [
  {
    name: 'v0.0.19: the live lane\'s words, the instructor\'s, the team\'s, the DI\'s and the paper\'s, each with two phrasings at least, its slots named, and none naming a lane or a house',
    fn() {
      const all = [], bad = [];
      const take = (where, list, n = 2) => { if (!Array.isArray(list) || list.length < n) bad.push(`${where}: ${JSON.stringify(list)}`); for (const t of list ?? []) all.push([where, t]); };
      for (const k of CHIEF) take(`HOUSE_CHIEF.${k}`, HOUSE_CHIEF[k]);
      for (const k of ONE) take(`HOUSE_CHIEF.one.${k}`, HOUSE_CHIEF.one[k]);
      for (const k of TEAM) take(`COURSES.house.opfor.${k}`, COURSES.house.opfor[k]);
      for (const r of CQB_RULES.filter(x => x.id.startsWith('cqb-rp-'))) for (const [k, v] of Object.entries(r.text)) take(`${r.id}.${k}`, v, 4);
      for (const k of KINDS) take(`FAULT_WORDS.${k}`, [FAULT_WORDS[k]], 1);
      for (const s of Object.values(LIVE_NAMES)) take('LIVE_NAMES', [s], 1);
      for (const [where, t] of all) {
        if (LANE_WORDS.test(t)) bad.push(`${where} names a lane or a house: "${t}"`);
        const slots = [...String(t).matchAll(/\{(\w+)\}/g)].map(m => m[1]).filter(s => !['part', 'Room'].includes(s));
        if (slots.length) bad.push(`${where} has an unfilled slot: "${t}"`);
      }
      // (the paper's red marks: each of the four faults' paper words is a fault mark)
      const marks = ['HANDS UP SHOT', 'UNCOVERED', 'REOPENED', 'CASUALTY', 'HIS FIRST ROUND 0.40 S BEFORE YOURS'];
      for (const m of marks) if (!isFault(m)) bad.push(`the mark '${m}' is not red`);
      if (isFault('PAINT ON YOU 0') || isFault('LIVE: 1 DOWN')) bad.push('a neutral live mark drawn red');
      console.log(`      ${all.length} phrasings in ${new Set(all.map(([w]) => w.replace(/\.\w+$/, ''))).size} tables; FAULT_MARKS ${FAULT_MARKS.length}; e.g. "${HOUSE_CHIEF.paint[0]}", "${HOUSE_CHIEF.reopened[0]}", "${COURSES.house.opfor.got[0]}"; ${bad.length} wrong`);
      assert(!bad.length, bad.slice(0, 6).join(' | '));
    },
  },
  {
    name: 'v0.0.19: a live lane\'s paper: the legs with a role-player read "LIVE: n DOWN · PAINT ON YOU n" and the card "2 ROLE-PLAYERS · n DOWN · PAINT ON YOU: …"; a casualty\'s card leads "CASUALTY · PAINT: …, ROOM n, BY THE MAN …"; the turner lane\'s paper has none of it',
    fn() {
      const run = (tier, opfor, bot) => { const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go', ...(opfor ? { opfor } : {}) }); runHouse(g, bot, { maxMs: 8 * 60_000 }); return { g, rs: runSheetOf(g.state) }; };
      const A = run('tierone', 'live:fight,fight', houseHonestBot()), B = run('recruit', 'live:fight,fight', houseKeysBot()), C = run('tierone', null, houseHonestBot());
      for (const [w, X] of [['tier one, live', A], ['recruit, live', B], ['tier one, the turner lane', C]]) {
        console.log(`      ${w} (${X.g.state.armoury.range.house.end?.why}): ${X.rs.card}`);
        for (const r of X.rs.rows) console.log(`        ${r.words}`);
      }
      const words = [A.rs.card, ...A.rs.rows.map(r => r.words), B.rs.card, ...B.rs.rows.map(r => r.words)].join(' | ');
      assert(/2 ROLE-PLAYERS · \d DOWN/.test(A.rs.card) && /PAINT ON YOU: /.test(A.rs.card) && A.rs.rows.filter(r => /LIVE: \d DOWN · PAINT ON YOU \d/.test(r.words)).length === 2, JSON.stringify(A.rs));
      assert(!/ROLE-PLAYER|LIVE:|PAINT/.test([C.rs.card, ...C.rs.rows.map(r => r.words)].join(' ')), JSON.stringify(C.rs));
      if (B.g.state.armoury.range.house.end?.why === 'casualty') assert(/^CASUALTY · PAINT( ON YOUR #2)?: [^·]+, (ROOM \d|THE HALL), BY THE MAN /.test(B.rs.card), B.rs.card);
      assert(!/\bhouse\b/i.test(words.replace(/LANE A/g, '')), words);
      for (const r of A.rs.rows) rowParts(r.words);
    },
  },
];
