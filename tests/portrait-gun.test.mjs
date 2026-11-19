// OLYMPUS tests: the gun in his hands on the target card (the build sheet v0.0.23 item 1, F89; the user's note of 2026-11-17).
//
// "the portrait of the NPC holding a gun does not display the gun they are holding" (the user, scoring "Stack and clear" on seed
// 4028068471: room 2's 2a, armoured with a pistol, drawn with empty hands). On v0.0.22 the board's painted man hung his gun from the
// hand at the crop's foot (the rifle half below it) in the khaki's two tones, the gun as dark as every fold: 0 pixels in a hold
// tone. Now the house's boards hold it at the ready where the stage paints it (W1) in the board's dark ink (G1, portrait.js
// PORTRAIT_HOLD), the hostage card's hostile his pistol raised at her head (H1), and a man in his own colours his gun in his hands:
// each at the three bands at least GUN_PX_MIN pixels (by the band's px a metre) and GUN_IN_CROP_K of it inside the figure's rows.
// "Bang"'s boards (no subject: the stress course's, starred) keep their figure until the user's yes (BANG_BOARD_HOLD).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { paintHitcard, cardDigest } from '../src/art/doll/hitcard.js';
import { PAPERS } from '../src/sim/arms/paper.js';
import { seenOf } from '../src/sim/people/seen.js';
import { gunReads, holdTonePx, PORTRAIT_ENFORCED } from './flawless-portrait.mjs';

const BANDS_M = [5, 15, 30];
// (the user's stands on seed 4028068471: 2a armoured with a pistol, 3b the hostage's hostile with a rifle, 1a a threat with a rifle; and a threat with a pistol)
const STANDS = [['2a', 'armoured', 'pistol'], ['3b', 'hostage', 'rifle'], ['1a', 'threat', 'rifle'], ['--', 'threat', 'pistol'], ['--', 'hostage', 'pistol']];
const board = (face, holds, rangeM, subject = true) => paintHitcard({ face, holds, phase: 'belief', marks: [], words: `${face} ${holds}`, rangeM, man: PAPERS.man, ...(subject ? { subject: { kind: 'board', face, holds } } : {}) });

export default [
  {
    name: 'F89 the gun reads on the house\'s board (the user\'s note of 2026-11-17, seed 4028068471\'s 2a, 3b and 1a, and a threat with a pistol): at the near, mid and far bands at least GUN_PX_MIN pixels in the board\'s ink and 90% of the gun inside the figure\'s rows (v0.0.22: 0 in a hold tone, the rifle half below the crop)',
    fn() {
      const rows = [], bad = [];
      for (const [stand, face, holds] of STANDS) for (const m of BANDS_M) {
        const r = gunReads(board(face, holds, m));
        rows.push(`${stand} ${face}/${holds} @${m} m ${r.px} px (min ${r.min}), ${Math.round(r.k * 100)}% in`);
        if (!r.ok) bad.push({ stand, face, holds, m, ...r });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length && PORTRAIT_ENFORCED.has('F89'), JSON.stringify(bad));
    },
  },
  {
    name: '"Bang"\'s boards are as the user starred them (no subject: BANG_BOARD_HOLD \'hand\', no ink), the house\'s differ from them, and a no-shoot\'s phone reads in the ink too',
    fn() {
      const out = [];
      for (const [face, holds] of [['threat', 'rifle'], ['threat', 'pistol'], ['armoured', 'rifle']]) {
        const bang = board(face, holds, 5, false), house = board(face, holds, 5);
        out.push(`${face}/${holds}: Bang ${cardDigest(bang)} ${holdTonePx(bang)} ink px, house ${cardDigest(house)} ${holdTonePx(house)}`);
        assert(holdTonePx(bang) === 0 && bang.place === 'hand' && house.place === 'ready' && cardDigest(bang) !== cardDigest(house), out.at(-1));
      }
      const phone = board('noshoot', 'phone', 5);
      out.push(`noshoot/phone: ${holdTonePx(phone)} ink px`);
      for (const o of out) console.log(`      ${o}`);
      assert(holdTonePx(phone) > 0, out.at(-1));
    },
  },
  {
    name: 'F89 a man\'s card: your #2 on the lane holds his R-7 in his hands at the low ready, and his card shows it in its own colours inside the figure\'s rows at every band',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, two = s.armoury.range.house.two.pid;
      const rec = seenOf(s, two, { by: s.player.id });
      const rows = [];
      for (const m of BANDS_M) {
        const card = paintHitcard({ phase: 'belief', marks: [], words: 'TWO', rangeM: m, subject: { kind: 'man', rec: { ...rec, hold: { ...rec.hold, how: 'rifle-low' } }, gear: rec.gear, person: { look: {}, sex: 'm' } } });
        const r = gunReads(card, { board: false });
        rows.push(`@${m} m ${r.px} px of ${r.all} in the crop (min ${r.min})`);
        assert(r.ok, JSON.stringify(r));
      }
      console.log(`      your #2 (${rec.hold.how} on the record): ${rows.join('; ')}`);
    },
  },
];
