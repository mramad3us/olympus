// OLYMPUS tests: the G-11s aboard the Patient Mule (v0.0.27's carried stage: the lead's call on F167, "if a cause in d.md finding 5 is a plain bug (not balance), fix it").
//
// The fight lens issued "two G-11 for #3 and #4" (its kit, FT§5.1) and the acceptance walk's 1:40 is "Flash it" in the bunk room, but the
// build issued none aboard: testShoothouse nulls the loadout on a ship and the 'boarding-cqb' issue carries no grenade, so every pirates
// lane by T walked into the man laid on a hatch with no bang, and you were down for good on 7 to 11 lanes of 20 from the corporal up. Now
// you and Four each carry BOARDING_BANGS (three G-11s, one a compartment past the passage), and each compartment's hatch, shut and current,
// starts with its bang at flash once, as "Bang, then go"'s room 1 does (shoothouse.js bangAtHatch: bundle.js variantHere keeps it for that
// hatch alone; "No bang" is one press of its variant row and kept for that hatch). The lock's hatch is never banged (the passage is the
// holders'). The house's lanes carry none (their kit is the picker's). Each case prints its numbers six spaces in.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { devicesOf } from '../src/sim/arms/devices.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { BOARDING_BANGS } from '../src/sim/scenarios/shoothouse.js';

const g11s = (s, pid, st = null) => devicesOf(s, pid).filter(d => d.model === 'g11' && (!st || d.st === st)).length;
const roomRows = (s) => stepsOf(s).filter(x => !x.off && /^drill:void:(in|clear)/.test(x.id)).map(x => x.id);

export default [
  {
    name: 'aboard you and Four each carry three G-11s (BOARDING_BANGS), the house\'s lane none; stacked on a compartment\'s hatch its room rows carry the flash and T\'s press throws one; "No bang" pressed is kept for that hatch through X and stop motion again; the lock\'s hatch is never preset (v0.0.27\'s carried stage: the build issued none aboard, so no hatch was ever banged)',
    fn() {
      const g = createGame({ scenario: 'test-collar', seed: 48213, tier: 'sgt', setup: 'cabin2' }), s = g.state, H = s.armoury.range.house, me = s.player.id;
      const house = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }).state;
      for (let i = 0; i < 3; i++) g.step(1, {});
      const at = { you: g11s(s, me), four: g11s(s, H.twoPid), house: g11s(house, house.player.id) + g11s(house, house.armoury.range.house.twoPid) };
      const variant = { ...(s.stop?.variant ?? {}) }, rows = roomRows(s), line = instinctNow(s).line;
      g.step(1, { act: [{ act: 'instinct', args: { id: line.id, act: line.act } }] });
      for (let i = 0; i < 120; i++) g.step(1, {});
      const thrown = at.you - g11s(s, me, 'pouched');
      // (the same hatch again: "No bang" pressed at its pause, then time run on: the bang stays off for that hatch)
      const g2 = createGame({ scenario: 'test-collar', seed: 48213, tier: 'sgt', setup: 'cabin2' }), s2 = g2.state;
      for (let i = 0; i < 3; i++) g2.step(1, {});
      const off = stepsOf(s2).find(x => x.id === 'drill:variant:bang' && !x.off);
      g2.step(1, { act: [{ act: 'stop', args: { step: off.id, tempo: 'normal' } }] });
      g2.step(1, { act: [{ act: 'stop', args: { step: 'leave', tempo: 'normal' } }] });
      for (let i = 0; i < 20; i++) g2.step(1, {});
      g2.step(1, { act: ['ready'] });
      for (let i = 0; i < 3; i++) g2.step(1, {});
      // (a lived second in the new stop motion (its Wait), the boarding's tick run under it)
      g2.step(1, { act: [{ act: 'stop', args: { step: 'wait', tempo: 'normal' } }] });
      for (let i = 0; i < 20; i++) g2.step(1, {});
      const kept = { mode: s2.stop?.mode ?? null, ...(s2.stop?.variant ?? {}) }, rows2 = roomRows(s2);
      // (at GO, the lock's hatch: no preset)
      const g3 = createGame({ scenario: 'test-collar', seed: 48213, tier: 'sgt', setup: 'go' }), s3 = g3.state;
      for (let i = 0; i < 3; i++) g3.step(1, {});
      const lock = s3.stop?.variant?.bang ?? null;
      console.log(`      BOARDING_BANGS ${BOARDING_BANGS}: G-11s you ${at.you}, Four ${at.four}, the house's sergeant and his #2 ${at.house}`);
      console.log(`      cabin 2's hatch: the variant ${JSON.stringify(variant)}, the room rows ${rows.join(', ')}; T "${line.text}" (${line.act}); thrown ${thrown}, left ${g11s(s, me, 'pouched')}`);
      console.log(`      "No bang" pressed, X, 20 ticks lived, stop motion again and a lived second: the variant ${JSON.stringify(kept)}, the rows ${rows2.join(', ') || 'none (in the room)'}; at GO the lock's hatch's bang ${lock}`);
      assert(at.you === 3 && at.four === 3 && at.house === 0, JSON.stringify(at));
      assert(variant.bang === 'flash' && variant.at === 'o:mu:d2:cabin-2' && rows.length && rows.every(r => r.includes('@flash')) && /@flash/.test(line.act ?? '') && thrown === 1, JSON.stringify({ variant, rows, line, thrown }));
      assert(off && kept.mode === 'stop' && kept.bang !== 'flash' && rows2.length && rows2.every(r => !r.includes('@flash')), JSON.stringify({ off: off?.id, kept, rows2 }));
      assert(lock === null, JSON.stringify({ lock }));
    },
  },
];
