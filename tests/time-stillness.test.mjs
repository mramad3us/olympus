// Time standing still (TIME §4, §5.3 check 1; the build sheet 0.0.4 §5.2; TIME's test 17 as far as this
// round has stop motion): with G held (a choice the game waits on), R offers nothing and does nothing,
// no activity starts (R, T, the activity action, a debug skip), the instinct says only urgent lines (the
// klaxon's, in a drill), the clock does not move; let go, all of it comes back.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { handOffer } from '../src/sim/places/hand.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { feetHeld } from '../src/sim/time/doing.js';

const SEED = 48213;

export default [
  {
    name: 'test 17: with G held no offer, no activity (R, T, the activity action, a debug skip), only urgent lines and no skip; the clock still; let go, the offer and the line come back',
    fn() {
      const g = createGame({ scenario: 'test-night', seed: SEED });
      const s = g.state;
      g.step(20);
      const offerBefore = handOffer(s), lineBefore = instinctNow(s).line;
      g.step(1, { act: ['ready'] });
      const t0 = s.clock.ms;
      g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      g.step(1, { act: [{ act: 'activity', args: { id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { until: 'reveille' } } }] });
      g.step(1, { act: lineBefore?.act ? [{ act: 'instinct', args: { id: lineBefore.id, act: lineBefore.act } }] : [] });
      g.step(1, { act: ['debug:skip:3600000'] });
      g.step(40);
      const held = { offer: handOffer(s), line: instinctNow(s).line, skip: !!s.skip, doing: !!s.time.doing, clock: s.clock.ms - t0, starts: g.facts('skip-start').length };
      g.step(1, { act: ['digit:1'] });
      g.step(20);
      const after = { offer: handOffer(s), line: instinctNow(s).line };
      console.log(`      before: R "${offerBefore?.label}", the line ${lineBefore ? `${lineBefore.tone} ${lineBefore.id}` : 'none'}`);
      console.log(`      held: R ${held.offer}, the line ${held.line ? held.line.id : 'none'}, a skip ${held.skip}, an activity ${held.doing}, the clock +${held.clock} ms, skips started ${held.starts}`);
      console.log(`      let go: R "${after.offer?.label}", the line ${after.line ? `${after.line.tone} ${after.line.id}` : 'none'}`);
      assert(offerBefore && held.offer === null && !held.skip && !held.doing && held.clock === 0 && held.starts === 0, JSON.stringify(held));
      assert(!held.line || held.line.tone === 'urgent', `a ${held.line?.tone} line while still`);
      assert(after.offer?.verb === offerBefore.verb, 'the offer came back');
    },
  },
  {
    name: 'in a drill, with time held, the klaxon\'s urgent line stays and its T still acts; a lying player\'s feet are held, and so are they through a rise',
    fn() {
      const g = createGame({ scenario: 'test-night', seed: SEED });
      const s = g.state;
      g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      g.step(2);
      const lying = feetHeld(s);
      g.step(1, { act: ['ready'] });
      g.step(25);
      const line = instinctNow(s).line;
      const t0 = s.clock.ms;
      g.step(1, { act: [{ act: 'instinct', args: { id: line.id, act: line.act } }] });
      const rose = !!g.me().trans;
      g.step(1, { act: ['digit:1'] });
      const held = feetHeld(s);
      console.log(`      lying at the klaxon, feet held ${lying}; held: the ${line.tone} line '${line.id}' [T ${line.act}], T rose you ${rose} with the clock at +${s.clock.ms - t0 - 50} ms; through the rise, feet held ${held}`);
      assert(lying && line.id === 'alarm' && line.tone === 'urgent' && rose && held, JSON.stringify({ lying, line, rose, held }));
    },
  },
];
