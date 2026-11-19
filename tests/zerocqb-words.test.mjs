// OLYMPUS tests: every line of the Wreck a text bubble at its speaker, none voiced (v0.0.25, "Hold to hold"; its build sheet §1 items 11 and 13, §8 F136's sim half; §0 item 5).
//
// The user, 2026-11-19: "forget voice synthesis, no voices." The cadre is in the Shed's gallery (no actor of his until Stop, posted
// off the Wreck's area), his lines from the brief to Stop said as his ('say' facts with his person: main.js puts their bubble at the 1MC
// speaker of your compartment, D's); the 1MC's own (the tug's warning and its end) with the speaker '1MC'; your #2's and yours at you; a
// deck's last compartment "Deck five clear!", "Deck six clear!". At Stop the cadre comes aboard through the lock (wreckCadre), walks to
// each of you on the floor and looks into your guns (the house's SHOW CLEAR look, H.show). F136's sim half: every 'say' has a speaker (a
// person or the 1MC), none is heard by the house's ear or asked of the engine (no-voices' rule), and every line of the cadre's said while
// he has no actor is said in a compartment with a 1MC speaker to place its bubble at.
import { assert } from './helpers.mjs';
import { wreckLane, laneLine } from './flawless-wreck.mjs';
import { createHouse } from '../src/ui/audio/house.js';
import { WRECK } from '../src/data/places/wreck.js';

export default [
  {
    name: 'F136 (the sim\'s half): the private\'s Wreck by the keys on 48213 from the fill (the brief, LOAD, MAKE READY), every line a \'say\' with a speaker, none heard or asked of an engine; the cadre\'s lines with no actor of his each in a compartment with a 1MC speaker; "Deck five clear!" and "Deck six clear!"; the cadre aboard at Stop and his look into both your guns',
    fn() {
      const cues = [], asked = [], texts = [];
      const ear = createHouse({ house: (kind) => { cues.push(kind); return true; }, hall: () => {}, voice: (text) => { asked.push(text); return true; } });
      let heard = 0;
      const each = (game) => { for (const f of game.facts('say')) { texts.push(f.text); if (ear.fact('say', f, game.state)) heard++; } };
      const { g, rec } = wreckLane({ tier: 'private', bot: 'keys', setup: null, each });
      const H = g.state.armoury.range.house, cadre = g.state.actors.list.find(a => a.who === H.chiefPid);
      const noSpeaker = rec.says.filter(x => !x.who && !x.speaker), pa = rec.says.filter(x => x.speaker === '1MC');
      const decks = texts.filter(t => /^Deck (five|six)/.test(t));
      console.log(`      ${laneLine(rec)}`);
      console.log(`      ${rec.says.length} lines: the 1MC's ${pa.length}, the cadre's with no actor of his ${rec.cadreNoActor} (unplaced ${rec.cadreUnplaced}), with no speaker ${noSpeaker.length}; heard ${heard}, asked of the engine ${asked.length}; the decks: ${decks.join(' | ')}`);
      console.log(`      the 1MC: ${texts.filter(t => /burn|Burn|Coasting/.test(t)).join(' | ')}; the speakers of the Wreck ${WRECK.speakers.length}; the cadre aboard at (${cadre?.x}, ${cadre?.z}), his looks ${JSON.stringify(H.show?.done ?? null)}`);
      assert(rec.done && rec.says.length > 20 && !noSpeaker.length && heard === 0 && asked.length === 0, JSON.stringify({ says: rec.says.length, noSpeaker: noSpeaker.length, heard, asked: asked.length }));
      assert(rec.cadreNoActor > 5 && rec.cadreUnplaced === 0 && pa.length >= 2, JSON.stringify({ cadreNoActor: rec.cadreNoActor, unplaced: rec.cadreUnplaced, pa: pa.length }));
      assert(decks.length === 2 && /five/.test(decks[0]) && /six/.test(decks[1]), decks.join(' | '));
      assert(cadre && Object.keys(H.show?.done ?? {}).length === 2, JSON.stringify({ cadre: !!cadre, show: H.show }));
    },
  },
];
