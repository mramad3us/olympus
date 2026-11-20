// OLYMPUS tests: F123's frames for the portrait sets the picks of 2026-11-20 grew (v0.0.28): the game's frame of every view of
// portrait-pose and portrait-facing equals its committed shot pixel for pixel.
//
// tests/looks-applied.test.mjs checks every other set's frames; these two sets gained four views this round (A3, P3, D3, F4: the
// cards redrawn on the user's notes of 2026-11-20, "aiming through ironsights", "Needs way more polish", "low effort and terrible"),
// and the one file went over its quick CPU (TECH §13.7), so the same check runs here for these two, nothing left out. Fails on a shot
// not reshot after a drawing changed (node tools/gallery.mjs <set>). Prints each view's differing pixels.
import { assert } from './helpers.mjs';
import { framesOf, SPLIT } from './looks-applied.test.mjs';

export default [
  {
    name: 'F123 the game\'s frame of every view of portrait-pose and portrait-facing equals the committed shot pixel for pixel (A3, P3, D3 and F4 among them, v0.0.28)',
    async fn() {
      const { rows, bad } = await framesOf([...SPLIT]);
      for (const r of rows) console.log(`      ${r}`);
      assert(rows.length === 2 && !bad.length, bad.join('; '));
    },
  },
];
