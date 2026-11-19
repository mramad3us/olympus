// OLYMPUS tests: a save anywhere in the Wreck loads and carries on byte for byte (TECH §13.1; v0.0.25 "Hold to hold", its build sheet §1 item 1, §8 F125's third part).
//
// The Wreck's lane is plain data: the operation record (R.house with `ship`, the tug's moments H.tug, the floating rounds), the
// footing on the actor (anchor, onFace, faceTo, floatY, v), the hatches' states on the area's openings and the gravity's profile on the
// live environment, none of it runtime. Nine points of the lane, each the first tick a bot's lane meets it (a list of lanes tried in
// turn): GO, cell 2's contact, the brace (you in your #2's grip, or on the coaming's hold where he has no hand out), the tick after the deck change, on the hold's deckhead, mid face
// change, the tug's warning, under the tug, and SHOW CLEAR. Cell 2's contact is its window (the take-in under way, time running), not
// its pause: the instinct's line is runtime (instinct.js state.$instinct, made by a tick), so a T player's first tick after a load at
// a pause reads no line where the saved game's read one (the house's own, found here: the handoff's). At each the save is checked by the id walk (tests/ids-check.mjs) and both
// games, the one that saved and one loaded from it, run AFTER ticks on by the same bot and must end on the same digest.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { checkIds } from './ids-check.mjs';
import { wreckBot } from './flawless-wreck.mjs';
import { onFaceOf, footingOf } from '../src/sim/body/footing.js';
import { contactNow } from '../src/sim/combat/contact.js';
import { wreckDeckAt } from '../src/sim/scenes/assemble.js';

const AFTER = 120, MAX_TICKS = 6000;
const H_ = (s) => s.armoury?.range?.house;
const lane = (s) => H_(s)?.goAtMs !== null && H_(s)?.goAtMs !== undefined && !H_(s).end;
const meOf = (s) => s.actors.list.find(a => a.who === s.player.id);
/** The nine points: a predicate on the state (and the last tick's deck, for the deck change), and the lanes tried for it in turn. */
export const POINTS = Object.freeze({
  'GO': { at: (s) => lane(s) && s.clock.ms - H_(s).goAtMs <= 100 },
  'cell 2\'s contact': { at: (s) => lane(s) && H_(s).cur === 0 && !!contactNow(s)?.pending },
  // (the brace where a lane has it, else the transit's other hold, the coaming's: the sergeant's lane has it since the review of C and D
  // (your #2 stacks again at a deck hatch where his hand was never out), the keys' private, who goes through without waiting on him, not)
  'the brace': { at: (s) => lane(s) && H_(s).cur === 2 && wreckDeckAt(meOf(s).x) === 6 && ['braced', 'handhold'].includes(footingOf(s, s.player.id).anchor) },
  'the tick after the deck change': { at: (s, was) => lane(s) && was === 5 && wreckDeckAt(meOf(s).x) === 6 },
  // (a tick whose line has no act to press: the instinct's line is runtime (state.$instinct), as at cell 2's contact; the review of C and
  // D's fix put the sergeant's "Feet aft" on the tick he planted, and his save there parted on the T the loaded game's first tick had no
  // line for, the bot's, never the game's)
  'on the hold\'s deckhead': { at: (s) => lane(s) && H_(s).cur === 2 && onFaceOf(s, s.player.id) === 'deckhead' && footingOf(s, s.player.id).anchor === 'magBoots' && !s.$instinct?.line?.act },
  'mid face change': { at: (s) => lane(s) && /^(anchor:)?face:/.test(s.stop?.doing?.step ?? '') && s.clock.ms > (s.stop.doing.fromMs ?? s.clock.ms) },
  'the tug\'s warning': { at: (s) => lane(s) && !!H_(s).tug?.warnAtMs && !H_(s).tug.onsetAtMs },
  'under the tug': { at: (s) => lane(s) && !!H_(s).tug?.onsetAtMs && !H_(s).tug.endAtMs },
  'SHOW CLEAR': { at: (s) => !!H_(s)?.end && !!H_(s).show && !s.armoury.range.end },
});
const LANES = [{ tier: 'sgt', bot: 'honest' }, { tier: 'private', bot: 'keys' }];

export default [
  {
    name: 'F125: a save at nine points of the Wreck (GO, cell 2\'s contact, the brace, the tick after the deck change, the hold\'s deckhead, mid face change, the tug\'s warning, under the tug, SHOW CLEAR) loads and carries on byte for byte, every id held once',
    timeoutMs: 180_000,
    fn() {
      const rows = {}, bad = [], left = new Set(Object.keys(POINTS));
      for (const L of LANES) {
        if (!left.size) break;
        const opts = { scenario: 'test-zerocqb', seed: 48213, tier: L.tier, setup: 'go' }, g = createGame(opts), bot = wreckBot(L.bot, L.tier, 48213);
        let n = 0, was = null;
        while (n++ < MAX_TICKS && left.size && !g.state.armoury.range.end) {
          const hits = [...left].filter(x => POINTS[x].at(g.state, was));
          if (hits.length) {
            for (const h of hits) left.delete(h);
            const json = g.save(), ms = g.state.clock.ms - H_(g.state).goAtMs, ids = checkIds(JSON.parse(json), g.sim.domains);
            const g2 = createGame(opts), bot2 = wreckBot(L.bot, L.tier, 48213);
            g2.load(json);
            for (let i = 0; i < AFTER; i++) { g.step(1, bot); g.clearFacts?.(); g2.step(1, bot2); g2.clearFacts?.(); }
            const same = g.digest() === g2.digest(), me = meOf(JSON.parse(json));
            for (const hit of hits) rows[hit] = `${hit.padEnd(32)} ${L.tier} (${L.bot}) at +${(ms / 1000).toFixed(2)} s (${me.anchor ?? '-'} on the ${me.onFace ?? 'deck'}, deck ${wreckDeckAt(me.x)}): ${ids.checked} ids, ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; ${same ? 'same' : 'APART'} after ${AFTER} ticks`;
            if (!same || ids.invalid.length || ids.dangling.length || g.errors.length || g2.errors.length) bad.push(`${hits.join(', ')}: ${same ? '' : 'apart '}${[...ids.invalid, ...ids.dangling].slice(0, 3).join('; ')} ${[...g.errors, ...g2.errors].slice(0, 2).join('; ')}`);
          }
          was = wreckDeckAt(meOf(g.state).x);
          g.step(1, bot); g.clearFacts?.();
        }
      }
      for (const name of left) { rows[name] = `${name.padEnd(32)} NEVER REACHED`; bad.push(`${name}: never reached`); }
      for (const name of Object.keys(POINTS)) console.log(`      ${rows[name]}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
];
