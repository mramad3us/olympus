// The DI's words in the house now that every sheet carries the P-12 (the play review of 2026-11-15): a threat's pistol is said as
// his ("His pistol. On him."), never the bare "Pistol." the transition says ("Pistol. On him." read as "draw your pistol"); and
// while an answer to the click runs, the line is that answer's ("Rifle down. Pistol up."), never "It quit. Tap, rack." over a
// transition you chose.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseKeysBot, runHouse } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { instinctNow, RULES } from '../src/sim/skills/instinct.js';
import { endLane } from './flawless-end.mjs';
import { HOUSE_CHIEF } from '../src/data/courses.js';
import { SCENE_LINES } from '../src/ui/cards/pairs.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { spokenWords } from '../src/core/speech.js';
import { hotPurposeOf, HOT_PURPOSE, HOT_PURPOSE_WORDS } from '../src/ui/hud/steps.js';

// (a Watch or Look row's label at most this many characters: the tile's two lines in panel C at 1280 × 720, "Watch: near right corner" 24 (the review of 2026-11-18))
const HOT_LABEL_MAX = 26;

const TRANSITION_WORDS = new Set(RULES.find(r => r.id === 'cqb-stoppage').text.transition);

export default [
  {
    name: 'a threat\'s pistol is "His pistol." in the DI\'s contact lines, and during Transition the stoppage line is the transition\'s words (the private by the keys on 1074, whose room holds a pistol, answering Transition)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1074, tier: 'private', setup: 'go' }), base = houseKeysBot();
      const contact = new Set(), during = new Set();
      const bot = (state, me, mem) => {
        const S = state.stop, L = instinctNow(state).line;
        if (L?.id === 'cqb-contact') contact.add(L.text);
        if (L?.id === 'cqb-stoppage' && S?.doing?.step === 'weapon:transition') during.add(L.text);
        if (S?.reflex && S.reflex.options.some(o => o.key === 'transition' && !o.off)) return { act: [stepAct('reflex:transition')] };
        return base(state, me, mem);
      };
      const r = runHouse(g, bot, { maxMs: 12 * 60_000 });
      const pistol = [...contact].filter(t => /pistol/i.test(t)), bare = [...contact].filter(t => /^Pistol\b/.test(t));
      console.log(`      the card ${r.done}; contact lines naming a pistol: ${pistol.map(t => `"${t}"`).join(', ') || 'none'}; during Transition: ${[...during].map(t => `"${t}"`).join(', ') || 'none'}`);
      assert(r.done && pistol.length > 0 && !bare.length, JSON.stringify({ done: r.done, pistol, bare }));
      assert(during.size > 0 && [...during].every(t => TRANSITION_WORDS.has(t)), JSON.stringify([...during]));
    },
  },
  // (B's three cases: the shorthand, the held offer, the toast)
  // (B's cases are in tests/house-shorthand.test.mjs and tests/house-twin-words.test.mjs: here they took house-words over its quick
  // budget, QUICK_FILE_CPU_S 3 s, 3.7 to 4.5 s of CPU against 1.3 s without them (the B and C review of 2026-11-16); the held offer's
  // gate was dropped, no case pins it)
  // (C's case: the ruling's words)
  {
    name: 'the umpire\'s ruling is said to the man: "You, out. Sit down where you are." or "Out of play. Sit down." at a room\'s "Clear!" over a role-player down and covered, never "He\'s out." (the tier one by T on 48213 live at GO; the build sheet v0.0.22 FL22-6, question 3\'s default; before: "He\'s out." 99 times on 96 live lanes)',
    fn() {
      const r = endLane({ tier: 'tierone', seed: 48213, bot: 'T', opfor: 'live', setup: 'go' });
      const said = r.words.filter(w => w.who === 'chief' && (HOUSE_CHIEF.out.includes(w.text) || /^(He's out\.|That one is out\.)$/.test(w.text)));
      console.log(`      ${r.cell}: ${r.done ? r.end : 'NOT to the card'}; the rulings ${said.map(w => `"${w.text}"`).join(', ') || 'none'}`);
      assert(r.done && said.length > 0 && said.every(w => HOUSE_CHIEF.out.includes(w.text)) && HOUSE_CHIEF.out.every(t => !/He's out|That one is out/.test(t)), JSON.stringify(said));
    },
  },
  {
    name: 'the house\'s picker note says in plain words what T and the keys do at each sheet: below the corporal "T names every step and does it, but your keys walk you through each door", from the corporal T takes you through (v0.0.23, carried FH-7; before: "a step at a time, X and the keys to go in; from the Corporal T bundles it")',
    fn() {
      const note = SCENE_LINES['test-shoothouse'];
      console.log(`      "${note}"`);
      assert(/Boot recruit and Private: T names every step and does it, but your keys walk you through each door/.test(note) && /From the Corporal, T takes you through the door too/.test(note) && !/a step at a time|T bundles it/.test(note), note);
    },
  },
  {
    name: 'every Watch and Look row names its action and its spot, short enough for the tile ("Watch: near right corner", "Look: far left corner", the push door\'s dead corner "Look: behind the door"), and says what it does on the row (its meta "aim in" or "check", steps.js HOT_PURPOSE) and whole on the hover (v0.0.23, DW; the user, 2026-11-17, "i don\'t know what the "look behind the door" option does"; the review of 2026-11-18: D\'s first labels, 33 to 52 characters, were cut at two lines; the private by the keys on 48213, every stop)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), base = houseKeysBot(), seen = new Map();
      const lp = lanePlanOf(g.state), behind = new Set(Object.values(lp.plans).flatMap(P => (P?.hot ?? []).filter(h => h.why === 'behind the door').map(h => h.id)));
      const bot = (state, me, mem) => {
        const S = state.stop;
        if (S?.mode === 'stop' && S.phase === 'choose') for (const r of stepsOf(state)) if (/^(watch|look):/.test(r.id)) seen.set(r.id, r.label);
        return base(state, me, mem);
      };
      // (played to where every dead corner has had both its rows offered, so the case stays light: the quick budget)
      const all = () => [...behind].every(h => seen.has(`watch:${h}`) && seen.has(`look:${h}`));
      let n = 0;
      while (!g.state.armoury.range.end && !all() && n++ < 12 * 60 * 20) { g.step(1, bot); g.clearFacts?.(); }
      const r = { done: all() };
      // (the label: its action and its spot in HOT_LABEL_MAX characters at most (the tile's two lines in panel C at 1280 × 720 hold
      // "Watch: near right corner", 24); the purpose on the row's meta (hotPurposeOf), whole on the hover (HOT_PURPOSE_WORDS))
      const rows = [...seen], bad = rows.filter(([id, l]) => l.length > HOT_LABEL_MAX || (/^watch:/.test(id) ? !/^Watch: \S/.test(l) : !/^Look: \S/.test(l)) || (behind.has(id.slice(id.indexOf(':') + 1)) && !/: behind the door$/.test(l)) || hotPurposeOf({ id }) !== HOT_PURPOSE[id.slice(0, id.indexOf(':'))] || !HOT_PURPOSE_WORDS[id.slice(0, id.indexOf(':'))]);
      const dead = rows.filter(([id]) => behind.has(id.slice(id.indexOf(':') + 1)));
      console.log(`      every dead corner's rows offered ${r.done} (${n} ticks); ${rows.length} rows seen, ${bad.length} wrong, the longest ${Math.max(...rows.map(([, l]) => l.length))} characters (at most ${HOT_LABEL_MAX}); the dead corner's: ${dead.map(([id, l]) => `"${l}" (${hotPurposeOf({ id })})`).join(', ') || 'none'}; e.g. ${rows.slice(0, 3).map(([id, l]) => `"${l}" (${hotPurposeOf({ id })})`).join(', ')}`);
      assert(r.done && rows.length >= 6 && !bad.length && dead.some(([id]) => /^look:/.test(id)) && dead.some(([id]) => /^watch:/.test(id)), JSON.stringify({ bad, dead }));
    },
  },
  {
    name: 'the instructor agrees with the drill: his brief and his muzzle lesson never tell the #2 or a man crossing him "high ready" or "muzzle up", never name the #2\'s corner "far" or "near", each phrasing as long as v0.0.22\'s (17, 16, 12 and 14 spoken words, so no lane\'s tick moves; v0.0.23, DC2: "Muzzles up in the stack." and "High ready in the stack, always." before)',
    fn() {
      const lines = [...HOUSE_CHIEF.brief, ...HOUSE_CHIEF.one.muzzle], n = lines.map(t => spokenWords(t).length);
      const bad = lines.filter(t => /high ready|muzzles? up|\b(far|near) corner/i.test(t));
      console.log(`      ${lines.map((t, i) => `"${t}" ${n[i]}`).join('; ')}`);
      assert(!bad.length && n.join(',') === '17,16,12,14', JSON.stringify({ bad, n }));
    },
  },
];
