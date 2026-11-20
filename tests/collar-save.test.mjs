// OLYMPUS tests: the boarding's saves, F153's save half (the build sheet v0.0.27 §1 D, §6 D, §8; FT§14; TECH §13.1).
//
// A save made anywhere in "Away the boarding party" loads and carries on byte for byte: at each of tests/collar-saves.mjs' ten points
// (the passage's first contact, a man firing blind, a push-off in flight, you down, mid-tourniquet, a man rising, the side's roll
// pending, the give-up's tick, the fall back's splash, the card) the game saved, played on 600 ticks, and its save loaded into a fresh
// game and played the same 600 ticks by the same bot (its memory on your actor, in the save) end on the same digest. The quick case holds
// one point (the contact), the heavy twin the other nine (the card moved there for the round's quick CPU: the review of D); a point no lane reaches is printed, never passed silently, and
// fails the heavy case unless COLLAR_SAVE_OPEN names it with its cause (measured on D's tree after B, A and C).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { COLLAR_SAVE_POINTS, COLLAR_SAVE_QUICK, reachPoint, carryOn } from './collar-saves.mjs';
import { collarBotOf } from './bots/collar.mjs';
import { leafClosed } from '../src/sim/places/model.js';

/**
 * Points no lane of this tree reaches, each with its cause, measured (printed every run; the heavy case holds every other; a point leaves
 * this list when a lane meets it, never by a lane scripted into it). On D's tree after B, A and C, 48 lanes (six seeds × four sheets × both
 * types, each sheet's honest bot) met none of these: the boarding's men are down before they choose (collar-nodead's F157, the same
 * finding: in 40 honest seeds cover and give never met, fight on 3 lanes), so the irregular table's blind fire, its flight and its push-off,
 * and a man's rise after a knock, are not seen in play; collar-blind, carried-v027 and collar-choice (A's) hold each on scripted worlds.
 */
export const COLLAR_SAVE_OPEN = Object.freeze({
  blind: 'no lane of 48 has a man fire blind (A\'s table: the men are down before they choose; F157)',
  pushoff: 'no lane of 48 has a man push off (the dash and the flight are choices: F157)',
  rising: 'no lane of 48 has a man rise after his knock (a real round puts him down for good: FT§2\'s 89% for a pair)',
  giveup: 'the side\'s roll pending on lanes of the 48 (the recruit\'s smugglers on 48213 the first), its 50% never won before the last armed man went down',
});

function hold(ids, n) {
  const rows = [], bad = [], missing = [];
  for (const id of ids) {
    const P = COLLAR_SAVE_POINTS.find(p => p.id === id), r = reachPoint(createGame, P);
    if (!r.lane) { missing.push(id); rows.push(`${id} (${P.what}): no lane reaches it${COLLAR_SAVE_OPEN[id] ? ` (open: ${COLLAR_SAVE_OPEN[id]})` : ''}`); continue; }
    const c = carryOn(createGame, r, n), same = c.a === c.b;
    rows.push(`${id} (${P.what}): ${r.lane.tier} ${r.lane.bot} ${r.lane.holdouts} ${r.lane.seed}${r.lane.setup ? ` ${r.lane.setup}` : ''} at tick ${r.tick}, on to ${c.tick}: ${c.a}${same ? '' : ` against ${c.b} MOVED`}`);
    if (!same) bad.push(id);
  }
  for (const r of rows) console.log(`      ${r}`);
  return { bad, missing };
}

export default [
  {
    name: 'F153: a save at the passage\'s first contact loads and carries on byte for byte for 600 ticks',
    fn() {
      const { bad, missing } = hold(COLLAR_SAVE_QUICK, 600);
      assert(!bad.length && !missing.length, JSON.stringify({ bad, missing }));
    },
  },
  {
    name: 'F153 (heavy): a save at a man firing blind, a push-off in flight, you down, mid-tourniquet, a man rising, the side\'s roll pending, the give-up\'s tick, the fall back\'s splash and the card loads and carries on byte for byte for 600 ticks',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const ids = COLLAR_SAVE_POINTS.map(p => p.id).filter(id => !COLLAR_SAVE_QUICK.includes(id));
      const { bad, missing } = hold(ids, 600);
      assert(!bad.length, `moved: ${bad.join(', ')}`);
      assert(missing.every(id => COLLAR_SAVE_OPEN[id]), `no lane reaches: ${missing.filter(id => !COLLAR_SAVE_OPEN[id]).join(', ')}`);
    },
  },
  {
    name: 'F153 (heavy): the lock\'s inner hatch, opened by the leader at GO, is open on the sight grid once its leaf has swung, so a save on the sergeant\'s smugglers lane on 48213 at ticks 560, 700 and 900 carries on with no input byte for byte for 600 ticks (the review of D: holders.js lockTick never registered the swing, the cached sight leaf read shut to the card, and the loaded game, which finds its moving leaves from the deltas, took in another man at +8 ticks)',
    heavy: true,
    fn() {
      const lane = { scenario: 'test-collar', seed: 48213, tier: 'sgt', holdouts: 'smugglers' }, rows = [], bad = [];
      for (const at of [560, 700, 900]) {
        const g = createGame(lane), bot = collarBotOf('honest', lane.tier, lane.seed);
        while (g.state.clock.tick < at && !g.state.armoury.range.end) g.step(1, bot);
        const s = g.state, stale = Object.values(s.$places?.sight ?? {}).flatMap(G => G.leaves.filter(l => l.closed !== leafClosed(s, l.id, s.clock.ms)).map(l => l.id));
        const saved = g.save(), g2 = createGame(lane);
        g2.load(saved);
        let first = null;
        for (let k = 1; k <= 600; k++) { g.step(1, {}); g2.step(1, {}); if (first === null && g.digest() !== g2.digest()) first = k; }
        rows.push(`tick ${at}: stale sight leaves ${stale.length ? stale.join(',') : 'none'}, carried on ${first === null ? `the same, ${g.digest()}` : `apart from +${first}`}`);
        if (stale.length || first !== null) bad.push(at);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify(rows));
    },
  },
];
