// OLYMPUS tests: a save anywhere in an operation off the range loads and carries on byte for byte (TECH §13.1; the build sheet v0.0.21 §1 item 21; the review of 2026-11-16).
//
// The review found 5 of 45 save points apart off the range (the lane 0 of 30): the barracks' DI ("Nothing on fire. Enjoy it
// while it lasts.") spoke through the operation, since the base rules read only the range session as the range, and its line
// stood where the drill's rules were silent. The saved game and the loaded one then differed by what the T player read: the
// original kept the line it showed (runtime), the loaded one recomputed the barracks' line, and T's memory (on the actor, so
// saved) went apart. Fixed in instinct/base.js know() (an operation, combat/op.js opLive, is read as the range). Every
// SAVE_EVERY ticks of an operation (tests/flawless-op.mjs opSaves: moved on while the T player's next press reads the line on the
// page, a runtime record a load forgets on the lane as off it) the game is saved, loaded into a second game, and both run
// SAVE_AFTER ticks on by the same bot, then their saves compared: none apart. It fails without the fix: the corporal on
// 1489397426 apart at ticks 100, 200, 600, 1100 and 1300, the tier one on 48213 at 100.
import { assert } from './helpers.mjs';
import { opSaves } from './flawless-op.mjs';

const SAVE_EVERY = 100, SAVE_AFTER = 60;

export default [
  {
    name: 'a save every 100 ticks of an operation off the range (corporal 1489397426, tier one 48213, by T) loads and carries on byte for byte for 60 ticks (the review of 2026-11-16: 5 of 45 points apart, the barracks\' line through the operation)',
    fn() {
      const runs = [['cpl', 1489397426], ['tierone', 48213]].map(([tier, seed]) => opSaves({ tier, seed, every: SAVE_EVERY, after: SAVE_AFTER }));
      for (const r of runs) console.log(`      ${r.tier} ${r.seed}: ${r.points.length} points (ticks ${r.points.map(p => p.tick).join(', ')}), apart ${r.apart.length}${r.apart.length ? ` at ${r.apart.join(', ')}` : ''}`);
      const bad = runs.filter(r => r.apart.length || !r.points.length);
      assert(!bad.length, JSON.stringify(bad.map(r => ({ tier: r.tier, seed: r.seed, apart: r.apart }))));
    },
  },
];
