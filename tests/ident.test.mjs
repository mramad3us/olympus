// The identification at the pause: what the marine could tell, and never a weapon that is not there (src/sim/combat/contact.js identify; COMBAT §25.4.6; the build sheet 0.0.8 §5.1).
//
// "We only know what we know": an Awareness check against IDENT_DC0 6 + round(range / 5 m) on its own stream, passed
// the turner's real holding (and its armour on an armoured face), failed "can't see his hands". 2,000 identifications by
// sheet at 7 and 10 m (each its own roll, keyed by the time it is made) against the check's odds; a challenge's +4.
import { assert, fmt } from './helpers.mjs';
import { identify, IDENT_DC0, IDENT_PER_M, CHALLENGE_BONUS } from '../src/sim/combat/contact.js';
import { contactOf } from '../src/sim/people/mind.js';
import { oddsOf } from '../src/sim/skills/checks.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';
import { bayGame, turn, runTo, LANE } from './contact-world.mjs';

const N = 2000;

export default [
  {
    name: '2,000 identifications by sheet at 7 and 10 m: the share right as the check\'s odds (within 3.5 points), the rest "can\'t see his hands", never a wrong weapon, the armour only when seen; a challenge\'s +4 lifts the share',
    fn() {
      const bad = [];
      console.log(`      sheet     AWR   7 m: DC  right   odds  | challenged         10 m: DC  right   odds  | challenged`);
      for (const tier of Object.keys(TEST_SHEETS)) {
        const cells = [];
        for (const line of [7, 10]) {
          const { g } = bayGame({ tier, line, faces: { [LANE]: 'armoured' }, holds: { [LANE]: 'pistol' } });
          turn(g, [LANE], g.state.clock.ms);
          runTo(g, s => !!contactOf(s)?.last);
          const s = g.state, pid = s.player.id, L = contactOf(s).last, key = `turner:${LANE}`, awr = TEST_SHEETS[tier].values.awareness;
          for (const bonus of [0, CHALLENGE_BONUS]) {
            let right = 0, unseen = 0, wrong = 0, armour = 0, dc = null;
            for (let i = 0; i < N; i++) {
              L.ident = {}; L.armour = {};
              const r = identify(s, pid, key, { bonus, atMs: s.clock.ms + i });
              dc = r.roll.dc;
              if (r.ident === 'pistol') right++; else if (r.ident === 'unseen') unseen++; else wrong++;
              if (r.armour) { if (r.ident === 'pistol') armour++; else wrong++; }
            }
            const odds = oddsOf(awr, dc, []), share = right / N;
            cells.push(`${String(dc).padStart(2)}  ${fmt(share * 100, 1).padStart(5)}  ${fmt(odds * 100, 0).padStart(4)}`);
            if (Math.abs(share - odds) > 0.035 || wrong || armour !== right || right + unseen !== N) bad.push(JSON.stringify({ tier, line, bonus, dc, share, odds, wrong, armour, right }));
          }
        }
        console.log(`      ${tier.padEnd(8)} ${String(TEST_SHEETS[tier].values.awareness).padStart(4)}     ${cells[0]}  |   ${cells[1]}        ${cells[2]}  |   ${cells[3]}`);
      }
      console.log(`      (DC ${IDENT_DC0} + round(range / ${IDENT_PER_M} m): 7 m ${IDENT_DC0 + Math.round(7 / IDENT_PER_M)}, 10 m ${IDENT_DC0 + Math.round(10 / IDENT_PER_M)}; challenged −${CHALLENGE_BONUS}; the armour counted only with the weapon seen)`);
      assert(!bad.length, bad.join('\n'));
    },
  },
];
