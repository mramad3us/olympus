// OLYMPUS tests: the card never shows a man as he is behind a wall (the code review of v0.0.23, its first and second findings; F90's
// sight clause, tests/flawless-portrait.mjs cardSeen).
//
// seen.js seenOf reads a man's true hold, pose and facing wherever he is, and the target view fed it to the card for any engaged or
// held man: in stop motion, with the bracket on a role-player who had stepped out of your sight, the card showed him sitting, his
// hands up or running from behind the wall (the review: 84 ticks on live:hide,hide 48213 by the tier one's honest bot, 109 on
// live:fight,hide), while the stage drew him as last seen or not at all. From v0.0.23's fixer the view keeps each man's record as
// your eye last had it (target.js seenHeld, readers.lastSeen): out of sight the card draws that record, never one he took there.
// Each live man's card model is taken at every tick of two live lanes with the view's memory and checked by the oracle (cardSeen:
// perception's visibility from your eye, the stage's own test); the count of ticks out of sight with a card shown is printed and
// must be above zero (the case is met). Fails without seenHeld (the card's record is the truth out of sight).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { seenOf } from '../src/sim/people/seen.js';
import { targetModel, lastSeenMemory } from '../src/ui/hud/target.js';
import { stageSees, cardSeen, PORTRAIT_ENFORCED } from './flawless-portrait.mjs';

const LANES = ['live:hide,hide', 'live:fight,hide'];

export default [
  {
    name: `F90's sight clause: on the live lanes (${LANES.join(', ')}; the tier one, the honest bot, 48213) every role-player's card out of your sight is the record he had when last in it, and none before he was ever seen (the code review of v0.0.23: the card showed "sit|front" and the hands up from behind a wall)`,
    fn() {
      const bad = [];
      let shownHidden = 0;
      for (const opfor of LANES) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', opfor });
        const readers = { lastSeen: lastSeenMemory() }, watch = new Map();
        const r = runHouse(g, houseHonestBot(), { each(game) {
          const s = game.state, H = s.armoury.range.house;
          if (H.goAtMs === null || H.goAtMs === undefined || H.end) return;
          for (const T of s.armoury.range.turners.filter(t => t.live?.who)) {
            const who = T.live.who, w = watch.get(who) ?? watch.set(who, cardSeen()).get(who);
            const m = targetModel(s, { key: T.key, kind: 'person', who, readers });
            const v = w.each(m, stageSees(s, who), seenOf(s, who)?.key ?? null);
            if (!v.ok && bad.length < 40) bad.push(`${opfor} ${T.stand} at ${s.clock.ms - H.goAtMs} ms: ${v.why}`);
          }
        } });
        assert(r.done, `${opfor} reaches its card`);
        for (const [who, w] of watch) { shownHidden += w.out.hiddenShown; console.log(`      ${opfor} ${who}: ${w.out.ticks} ticks, out of your sight ${w.out.hidden}, a card shown then ${w.out.hiddenShown} (as last seen)`); }
      }
      for (const b of bad.slice(0, 8)) console.log(`      ${b}`);
      assert(!bad.length && shownHidden > 0 && PORTRAIT_ENFORCED.has('F90'), `${bad.length} disagreements; ${shownHidden} ticks out of sight with a card`);
    },
  },
];
