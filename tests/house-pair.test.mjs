// OLYMPUS tests: the pair in the hall (the build sheet v0.0.20 item 19; drill.md item 6): the two men move together, staggered on opposite walls, the lead man first.
//
// bundle.js runSlot's hall branch: your #2's place along the hall's axis is held at or behind yours plus HALL_LEAD_M (hallHold);
// your lead over him past HALL_PAIR_M brings him at Fast from rung 2 (hallHurry) and the DI's cqb-pair note, "Wait for your two.",
// T Wait (out of the mode, G first). Before it the honest bot's #2 was ahead of you for 28 to 32% of the hall by up to 2.0 to 2.2 m,
// and by the keys you led him by 4.8 to 5.0 m (the 90th percentile) with no word. The run sheet's TEAM row (case 3) is C's.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot, runHouse } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { HALL_LEAD_M, HALL_PAIR_M, hallLead } from '../src/sim/combat/bundle.js';
import { lanePlanOf, pastThreshold } from '../src/sim/combat/room.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { T_SHEETS } from './flawless.mjs';

export default [
  {
    name: 'in the hall your #2 is never more than HALL_LEAD_M ahead of you along its axis: the honest bot by T on every T sheet (setup hall, 48213), and with you standing still mid-hall he holds level with you, never on to his point (before: 3.4 m ahead; drill.md\'s 2.0 to 2.2 m on the T sheets was him at room 3\'s point, x 16.5, as the hall\'s leg began, you at yours, x 18.5: in the hall itself the honest bot\'s #2 was never ahead)',
    fn() {
      const out = [];
      for (const tier of T_SHEETS) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'hall' }), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans.hall;
        let ahead = -Infinity, held = 0;
        const r = runHouse(g, houseHonestBot(), { maxMs: 3 * 60_000, each: () => {
          const two = s.actors.list.find(a => a.who === H.twoPid), lead = hallLead(s);
          if (lead !== null && two && pastThreshold(P, two.x, two.z)) ahead = Math.max(ahead, -lead);
          held = H.two.hall?.ms ?? held;
        } });
        out.push({ tier, done: r.done, ahead: +ahead.toFixed(3), heldMs: held, hurried: H.two.hall?.hurried ?? 0, hall: H.hall.clearAtMs - H.hall.fromMs });
      }
      console.log(`      ${out.map(o => `${o.tier}: his greatest lead ${fmt(o.ahead, 2)} m, held ${o.heldMs} ms, hurried ${o.hurried}, the hall ${fmt(o.hall / 1000, 2)} s`).join('; ')}`);
      // (you standing still mid-hall by your own choice (X at (15.6, 12.7), your wall), his walk down his own wall: held level with you
      // plus HALL_LEAD_M, never on past you to his point; before, he walked on to it, 3.4 m ahead of you)
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'hall' }), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans.hall;
      for (const T of s.armoury.range.turners) T.trigger = { kind: 'never', on: null, gapMs: 0 };
      const me = s.actors.list.find(a => a.who === s.player.id), two = s.actors.list.find(a => a.who === H.twoPid);
      me.x = 15.6; me.z = 12.7; delete me.v;
      g.step(1, { act: [stepAct('leave')] });
      let ahead = -Infinity;
      for (let t = 0; t < 200; t++) { g.step(1, s.stop ? { act: [stepAct('leave')] } : {}); g.clearFacts(); const lead = hallLead(s); if (lead !== null && pastThreshold(P, two.x, two.z)) ahead = Math.max(ahead, -lead); }
      console.log(`      you still at (15.60, 12.70): his greatest lead along the hall ${fmt(ahead, 2)} m, standing at (${fmt(two.x, 2)}, ${fmt(two.z, 2)}), held ${H.two.hall?.ms ?? 0} ms (HALL_LEAD_M ${HALL_LEAD_M})`);
      assert(out.every(o => o.done && o.ahead <= HALL_LEAD_M + 1e-6) && ahead <= HALL_LEAD_M + 1e-6 && ahead >= 0, JSON.stringify({ out, ahead }));
    },
  },
  {
    name: 'by the keys, leading your #2 by more than HALL_PAIR_M along the hall brings the DI\'s "Wait for your two." (cqb-pair, a note): the line within the instinct\'s settle, T G then Wait (the private, setup hall, 48213; before: no line)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'hall' }), s = g.state, H = s.armoury.range.house;
      for (const T of s.armoury.range.turners) T.trigger = { kind: 'never', on: null, gapMs: 0 };
      // (X, then west along the hall by the keys while he is slow to start: G stands him at his stack a second first)
      g.step(1, { act: [stepAct('leave')] });
      let over = null, line = null;
      for (let t = 0; t < 140 && !line; t++) {
        g.step(1, { mx: -1, mz: 0 });
        const lead = hallLead(s);
        if (over === null && lead !== null && lead > HALL_PAIR_M) over = s.clock.ms;
        const l = instinctNow(s).line;
        if (over !== null && l?.id === 'cqb-pair') line = { afterMs: s.clock.ms - over, lead: +hallLead(s).toFixed(2), text: l.text, act: l.act };
      }
      let acts = [];
      if (line) { g.step(1, { act: [{ act: 'instinct', args: { id: line ? 'cqb-pair' : null, act: line.act } }] }); const l2 = instinctNow(s).line; acts = [line.act, l2?.id === 'cqb-pair' ? l2.act : l2?.id]; }
      console.log(`      your lead past ${HALL_PAIR_M} m at ${over === null ? 'NEVER' : 'a walk west'}; cqb-pair ${line ? `${line.afterMs} ms after, at a lead of ${line.lead} m: "${line.text}"` : 'NEVER'}; T: ${acts.join(', ')}`);
      assert(over !== null && line && line.afterMs <= 1050 && acts[0] === 'stop:enter' && acts[1] === 'stop:wait', JSON.stringify({ over, line, acts }));
    },
  },
];
