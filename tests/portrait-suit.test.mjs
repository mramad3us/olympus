// OLYMPUS tests: you in the black suit on the I and C cards (the build sheet v0.0.24 item 17; the overhaul's O-16; samples/portrait-suit).
//
// The I and C cards draw you as the doll in the gear you wear, and in the combat EVA suit the doll is black on its own dark wall.
// portrait-suit's three grounds are built (art/doll/portrait.js cardBackdrop, by the place: the shoot house, the bay, the street):
// D-a, the doll's own wall, is the default until the user scores the set, and is the very doll v0.0.23 drew (the same Pixmap, so the
// bay's cards are byte for byte as before); D-b the place's tones, D-c with a rim of the place's light on the suit, each the sample's
// own picture pixel for pixel, so a score is the one pick (PORTRAIT_PICKS.suit). Without the change no ground but the doll's could
// be drawn. Prints the pixels each ground changes and the rim's count.
import { assert } from './helpers.mjs';
import { dressedDoll } from '../src/art/doll/dress.js';
import { DOLL_SCALE } from '../src/art/doll/doll.js';
import { cardBackdrop, PORTRAIT_PICKS, SUIT_PLACES } from '../src/art/doll/portrait.js';
import { FIGS, dollIn } from '../samples/portrait-suit/suit.js';

const PERSON = { look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' }, head: null }, sex: 'm' };
const hexOf = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);

export default [
  {
    name: 'the I and C cards\' ground by the place as portrait-suit draws it: D-a (the default) the very doll v0.0.23 drew, D-b and D-c the sample\'s pictures pixel for pixel in the shoot house, the bay and the street',
    fn() {
      const out = [], bad = [];
      assert(PORTRAIT_PICKS.suit === 'D-a', PORTRAIT_PICKS.suit);
      for (const [label, gear] of FIGS) for (const place of Object.keys(SUIT_PLACES)) {
        const pm = dressedDoll(gear, PERSON, DOLL_SCALE);
        if (cardBackdrop(pm, DOLL_SCALE, place) !== pm) bad.push(`${label} ${place}: D-a is not the doll itself`);
        for (const look of ['D-b', 'D-c']) {
          const mine = cardBackdrop(pm, DOLL_SCALE, place, look), { P, rim } = dollIn(gear, place, look);
          let differ = 0, changed = 0;
          for (let i = 0; i < mine.data.length; i++) { if (hexOf(mine.data[i]) !== P.col[i]) differ++; if (mine.data[i] !== pm.data[i]) changed++; }
          out.push(`${label} ${place} ${look}: ${changed} px off the doll, rim ${rim}, ${differ} off the sample`);
          if (differ || !changed) bad.push(`${label} ${place} ${look}: ${differ} px off the sample, ${changed} changed`);
        }
      }
      for (const o of out) console.log(`      ${o}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
