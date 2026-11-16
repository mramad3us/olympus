// OLYMPUS tests: the close-quarters gauges as a library (the build sheet v0.0.21 §1 item 23, §6 D; the done lens's D8 and J4).
//
// tests/cqb-gauges.mjs holds the watchers flawless.mjs flawlessLane ran inline until v0.0.21 (F1 walls, F2 bodies, F7 corners,
// F25 entry, F26 swings) and two of flawless-bodies.mjs's measures (F45 pins, F47 lines), each `watch(game, { team, plans,
// area }) → { tick, result }`. flawlessLane composes them where it ran them; these cases hold that nothing moved: the library's
// own composition (watch()), run beside flawlessLane on the same lane, gives flawlessLane's numbers, and both give the numbers
// v0.0.21's base printed before the move (pinned below from the stage-0 tree: tests/flawless.mjs as stage 0 left it). The
// library runs off the range too (tests/cqb-world.mjs, cqb-anywhere's F72). Fails without the library: its import.
import { assert } from './helpers.mjs';
import { flawlessLane } from './flawless.mjs';
import { watch, WATCHERS } from './cqb-gauges.mjs';
import { opLive } from '../src/sim/combat/op.js';
import { opLane } from './flawless-op.mjs';

// (the numbers flawlessLane gave on the stage-0 tree, before the move (/private/tmp/claude-501/olympus-build/v021/d/p2base.json):
// [F1 worst m, F1 over, F2 least m, F2 ms under, F26 you ms, F26 him ms, leaves swung, F7 clears, F7 uncovered, F25 lags ms])
const BEFORE = Object.freeze({
  'tierone honest': [0, 0, 0.616, 0, 0, 0, 3, 4, 0, '500/50/900'],
  'private keys': [0, 0, 0.621, 0, 0, 0, 3, 4, 0, '1100/750/1250'],
});
const numbers = (wall, gap, leaf, corners, entry) => [wall.worstM, wall.over, Math.round(gap.minM * 1000) / 1000, gap.underMs, leaf.me, leaf.two, leaf.swings, corners.clears, corners.uncovered, Object.values(entry).map(E => E.inMs - E.cueMs).join('/')];

// (one lane: flawlessLane's records, and the library's own composition run beside it through its `more` hook on the same ticks)
function pair(tier, bot, seed) {
  let W = null, prev = null;
  const rec = flawlessLane({ tier, seed, bot, more: (game, ctx) => {
    const st = game.state, now = st.clock.ms;
    W ??= watch(game, { team: { me: st.player.id, two: st.armoury.range.house.twoPid }, plans: null }, ['walls', 'bodies', 'swings', 'entry']);
    W.tick(game, { now, dt: prev === null ? 0 : now - prev, on: ctx.onLane });
    prev = now;
  } });
  const L = W.result();
  return { lane: numbers(rec.wall, rec.gap, rec.leaf, rec.corners, rec.entry), lib: [L.walls.worstM, L.walls.over, Math.round(L.bodies.minM * 1000) / 1000, L.bodies.underMs, L.swings.me, L.swings.two, L.swings.swings, rec.corners.clears, rec.corners.uncovered, Object.values(L.entry).map(E => E.inMs - E.cueMs).join('/')] };
}
function check(cases) {
  const bad = [];
  for (const [tier, bot, seed] of cases) {
    const p = pair(tier, bot, seed), want = BEFORE[`${tier} ${bot}`];
    console.log(`      ${tier} by ${bot} on ${seed}: flawlessLane ${JSON.stringify(p.lane)}; the library ${JSON.stringify(p.lib)}; before the move ${JSON.stringify(want)}`);
    if (JSON.stringify(p.lane) !== JSON.stringify(p.lib) || JSON.stringify(p.lane) !== JSON.stringify(want)) bad.push({ tier, bot, seed, ...p, want });
  }
  assert(!bad.length, JSON.stringify(bad));
}

export default [
  {
    name: 'the library\'s watchers give flawlessLane\'s numbers and the numbers before the move, on the tier one by T on 48213 (F1\'s worst overlap, F2\'s least distance, F26\'s seconds in a swing, F25\'s lags, F7\'s clears; the keys lanes in the heavy case: a file\'s 3 s of CPU)',
    fn() { check([['tierone', 'honest', 48213]]); },
  },
  {
    name: '(heavy: the build sheet\'s three seeds × two sheets) the library\'s watchers give flawlessLane\'s numbers and the numbers before the move',
    heavy: true,
    fn() { check([1489397426, 48213, 1037].flatMap(seed => [['tierone', 'honest', seed], ['private', 'keys', seed]])); },
  },
  {
    name: 'every watcher of the library runs off the range (tests/cqb-world.mjs): each gives its record on the sergeant\'s operation, the ticks judged only while it is open',
    fn() {
      const l = opLane({ tier: 'sgt', seed: 48213 }), names = Object.keys(WATCHERS);
      console.log(`      the watchers ${names.join(', ')} on the sergeant's operation off the range: ${names.map(n => `${n} ${JSON.stringify(l.watch[n]).slice(0, 70)}`).join('; ')}`);
      assert(names.every(n => l.watch[n]) && l.watch.corners.clears === 4 && Object.keys(l.watch.entry).length === 3 && l.watch.lines.shots > 0 && l.watch.pins.held >= 0, JSON.stringify(l.watch));
      assert(typeof opLive === 'function', 'op.js');
    },
  },
];
