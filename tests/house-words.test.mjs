// The DI's words in the house now that every sheet carries the P-12 (the play review of 2026-11-15): a threat's pistol is said as
// his ("His pistol. On him."), never the bare "Pistol." the transition says ("Pistol. On him." read as "draw your pistol"); and
// while an answer to the click runs, the line is that answer's ("Rifle down. Pistol up."), never "It quit. Tap, rack." over a
// transition you chose.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseKeysBot, runHouse } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { instinctNow, RULES } from '../src/sim/skills/instinct.js';

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
];
