// OLYMPUS tests: the boarding's balance, F167 (the build sheet v0.0.27 §8 F167, §11 risk 6; FT§17 risk 3: stated before any build, red is a question for the user with the figures, never a constant tuned).
//
// Heavy. From the corporal up by T (the honest player: tests/bots/collar.mjs collarBot 'T'), BALANCE_SEEDS seeds a sheet against the
// holdouts the seed draws (pirates or smugglers 1 : 1), each lane from the fill to the card: the deck secured on BALANCE_SECURED or more of
// them and your body down for good on BALANCE_DOWN or fewer; the recruit's and the private's by the keys printed beside them, held to
// nothing. The lead's gauge, D's build: a red line goes to the user with its figures (the sheet's question 3 to 5), never into a constant.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { collarLane } from './bots/collar.mjs';

/** Seeds a sheet, the secured lanes at least and the lanes with your body down for good at most (F167). */
export const BALANCE_SEEDS = 20, BALANCE_SECURED = 17, BALANCE_DOWN = 1;
const seeds = Array.from({ length: BALANCE_SEEDS }, (_, i) => (i === 0 ? 48213 : 5000 + 41 * i));

export default [
  {
    name: 'F167 (heavy): from the corporal up by T, 20 seeds a sheet, the deck secured on 17 or more and your body down for good on 1 or fewer; the recruit\'s and the private\'s printed',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const bad = [];
      for (const [tier, bot] of [['recruit', 'keys'], ['private', 'keys'], ['cpl', 'T'], ['sgt', 'T'], ['raider', 'T'], ['tierone', 'T']]) {
        const c = { clear: 0, down: 0, fellBack: 0, other: 0, s: [], types: {} };
        for (const seed of seeds) {
          const r = collarLane(createGame, { tier, seed, bot });
          c[r.end === 'clear' || r.end === 'down' || r.end === 'fellBack' ? r.end : 'other']++;
          c.types[r.type] = (c.types[r.type] ?? 0) + 1;
          if (r.laneS !== null) c.s.push(r.laneS);
        }
        const mean = c.s.length ? (c.s.reduce((a, b) => a + b, 0) / c.s.length).toFixed(1) : '-';
        const held = tier !== 'recruit' && tier !== 'private';
        console.log(`      ${tier} by ${bot}: secured ${c.clear}, fell back ${c.fellBack}, down ${c.down}, other ${c.other} of ${seeds.length} (${Object.entries(c.types).map(([k, v]) => `${k} ${v}`).join(', ')}); the lane ${mean} s mean${held ? ` (held: ${BALANCE_SECURED}+ secured, ${BALANCE_DOWN}- down)` : ' (printed)'}`);
        if (held && (c.clear < BALANCE_SECURED || c.down > BALANCE_DOWN)) bad.push(`${tier}: secured ${c.clear}, down ${c.down}`);
      }
      assert(!bad.length, `F167, a question for the user with these figures: ${bad.join('; ')}`);
    },
  },
];
