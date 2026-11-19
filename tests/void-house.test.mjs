// OLYMPUS tests: void-house, F105 (the build sheet v0.0.24 §6 A, §8's F102 read three higher; AW§4.1 item 5, AW§6's V5): the drill
// never stalls at 0 G without saying why.
//
// AW measured "Stack and clear" on &env=ship-coast at v0.0.20: the tier one by T walked 4.0 m, pressed T once, and every room was
// "passed" by the stall's move-on at 500 s, nothing said, because the legs' push is min(μ g, …), 0 at 0 G. From v0.0.24 a drill
// row that would walk where the legs have nothing to push on is struck with the footing's reason (src/sim/combat/bundle.js
// moveStruck, src/sim/body/footing.js noFootingWhy) and, out of the mode, the DI's 'anchor' line says it (instinct/base.js).
// Two cases, each a lane set of tests/flawless-void.mjs:
//   - on ship-coast (the house's concrete, no boots issued), the sergeant by T and the private by the keys to the card: no walking
//     row ever offered live (each would not move), every live tick said by the panel or the line, the metres and the card printed;
//   - on the steel copy of house 1 (tests/void-world.mjs voidWorld: the void's plate, 0 G, the team in mag boots, locked), the
//     sergeant's T clears every leg with F1, F2, F7 and F26 held (tests/cqb-gauges.mjs), its time printed against the same
//     operation at the Wheel's 1 G (AW's 183.1 s was the house lane's at v0.0.20; the operation off the range is shorter).
// Both fail without v0.0.24's step 5: with no strike the drill's rows on ship-coast are live and stand still (the silent stall),
// and with no boots' grip (motion.js legsAt) the steel lane never leaves room 1's stack.
import { assert } from './helpers.mjs';
import { coastLane, steelLane, f105 } from './flawless-void.mjs';
import { printGauge } from './flawless.mjs';

export default [
  {
    name: 'void-house (F105): on ship-coast the house by T (the sergeant) and by the keys (the private) never stands silent: no walking row is offered live that cannot move, and every tick of the live lane the panel\'s struck rows or the DI\'s line says why (AW: 4.0 m and every room "passed" at 500 s, nothing said)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const coast = [coastLane({ tier: 'sgt', mode: 'T' }), coastLane({ tier: 'private', mode: 'keys' })];
      const row = f105(coast, [], [], { half: 'coast' });
      printGauge('F105, its ship-coast half:', [row]);
      assert(row.met, row.value);
      for (const l of coast) {
        assert(!l.err && l.done, `${l.mode} ${l.tier}: ${l.err ?? 'no card'}`);
        assert(l.live === 0, `${l.mode} ${l.tier}: ${l.live} walking rows live where the legs cannot push`);
        assert(l.silent === 0, `${l.mode} ${l.tier}: ${l.silent} silent ticks (${l.silentAt.join('; ')})`);
        assert(l.said > 0 && l.liveTicks > 0, JSON.stringify(l));
      }
    },
  },
  {
    name: 'void-house (F105): on the steel copy of house 1 (the void\'s plate, 0 G, the team in mag boots, locked) the sergeant\'s T clears every leg, F1, F2, F7 and F26 held, its time printed against the same operation at 1 G',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const steel = [steelLane({ tier: 'sgt', seed: 48213 })], one = [steelLane({ tier: 'sgt', seed: 48213, steel: false })];
      const row = f105([], steel, one, { half: 'steel' });
      printGauge('F105, its steel half:', [row]);
      const l = steel[0];
      assert(l.boots && Object.values(l.boots).every(Boolean), `the team locked: ${JSON.stringify(l.boots)}`);
      assert(l.done, `every leg clear: [${l.legs.join(',')}] ${l.err ?? ''} dead ends ${JSON.stringify(l.dead)}`);
      assert(row.met, row.value);
      const W = l.watch;
      assert(W.walls.over === 0 && W.bodies.underMs === 0 && W.bodies.minM >= 0.5 && W.corners.uncovered === 0 && W.corners.clears > 0 && W.swings.me + W.swings.two === 0, JSON.stringify({ walls: W.walls.over, minM: W.bodies.minM, under: W.bodies.underMs, unc: W.corners.uncovered, clears: W.corners.clears, swing: W.swings }));
      assert(one[0].done && l.ms > one[0].ms, `the 1 G operation ${one[0].ms} ms against ${l.ms} ms`);
    },
  },
];
