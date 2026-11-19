// OLYMPUS tests: the target view's warm set holds every face the house can draw (the build sheet v0.0.23 item 1; P§1, P§4).
//
// warm() paints at a scene's load the dolls its cards may need, so no frame paints more than one new doll. v0.0.22's list had ten
// (face, holds) and lacked the armoured face with a pistol: the user's own 2a on seed 4028068471, whose card was then painted mid-lane.
// The set (target.js HOUSE_FACES) must hold every (face, holds) the fill gives on the set house and 64 drawn seeds, each as your
// take-in may identify it (a threat's or a no-shoot's face read from what is in the hands; unidentified, 'unknown'), and the hostile
// behind a hostage with each gun. Prints the pairs met and how often.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { HOUSE_FACES } from '../src/ui/hud/target.js';

const SEEDS = 64;
// (a stand as the card may draw it: engage.js seenFace's faces for an identification (its holds) or none)
const readsOf = (T) => {
  const holds = T.holds ?? 'rifle';
  const face = T.face === 'armoured' ? 'armoured' : T.face === 'hostage' ? 'hostage' : holds === 'rifle' || holds === 'pistol' ? 'threat' : holds === 'hands' || holds === 'phone' ? 'noshoot' : 'unknown';
  return [[face, holds], [T.face === 'armoured' ? 'armoured' : T.face === 'hostage' ? 'hostage' : 'unknown', 'unseen']];
};

export default [
  {
    name: `the warm set holds every (face, holds) the fill gives on the set house, the user's seed 4028068471 and ${SEEDS} drawn seeds, identified or not (v0.0.22 lacked armoured/pistol, the user's 2a)`,
    fn() {
      const have = new Set(HOUSE_FACES.map(([f, h]) => `${f}/${h}`)), met = new Map(), missing = new Set();
      const lanes = [{ seed: 4028068471 }, { seed: 48213 }, ...Array.from({ length: SEEDS }, (_, i) => ({ seed: i + 1, draw: 'drawn' }))];
      for (const L of lanes) {
        const g = createGame({ scenario: 'test-shoothouse', seed: L.seed, tier: 'private', setup: 'go', ...(L.draw ? { draw: L.draw } : {}) });
        for (const T of g.state.armoury.range.turners ?? []) for (const [f, h] of readsOf(T)) {
          const k = `${f}/${h}`;
          met.set(k, (met.get(k) ?? 0) + 1);
          if (!have.has(k)) missing.add(k);
        }
      }
      console.log(`      ${lanes.length} lanes: ${[...met].map(([k, n]) => `${k} ${n}`).join(', ')}`);
      console.log(`      the warm set's ${have.size}: ${[...have].join(', ')}; missing ${missing.size ? [...missing].join(', ') : 'none'}`);
      assert(!missing.size && have.has('armoured/pistol'), [...missing].join());
    },
  },
];
