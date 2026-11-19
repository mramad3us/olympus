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
];
