// OLYMPUS tests: a grenade's throw in closed form, in any gravity, with the Wheel's spin (WEAPONS §12.2; COMBAT §11.1; the build sheet 0.0.18 §5.3; src/sim/arms/throw.js).
//
// Thrown through room 1's door in the shoot house (the Wheel, 1 G by spin, a 2.8 m ceiling) and out in the open on Mars and
// Europa, where a lob outlasts the fuse. Each test fails without throw.js.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { throwSolve, throwLand, throwDc, throwVMax } from '../src/sim/arms/throw.js';
import { spinOf, spinBiasCm } from '../src/sim/places/spin.js';
import { gravityAt } from '../src/sim/places/env.js';
import { openingOf, roomOf, setOpening, areaOf } from '../src/sim/places/model.js';
import { G0_MS2 } from '../src/core/phys.js';

export default [
  {
    name: 'a throw through room 1\'s door from #1\'s stack lands within 0.5 + 0.03 d m of its aim on a pass, never through a wall, and carries the Wheel\'s spin bias (24 cm at 3 m and 5 m/s; the Corps\' sheets conditioned to it, so none of it moves the landing)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go', loadout: 'flash' }), s = g.state, area = s.places.live.area;
      // (the door pushed open first, as the drill's throw waits on it: door@pass)
      setOpening(s, 'o:w4:r1', 'open', { atMs: s.clock.ms - 1000 });
      // (from the hand round the near jamb, 0.15 m into the opening and past the door's line (bundle.js throwFromOf), #1 on his stack)
      const o = openingOf('o:w4:r1'), from = [o.b - 0.15, 1.4, o.at - 0.15], aim = [29, 10], door = { axis: o.axis, at: o.at, side: -1 };
      const gMs2 = gravityAt(s, null, from[0], from[2]).gG * G0_MS2, spin = spinOf(s, area);
      const solve = throwSolve(s, s.player.id, { from, aim, gMs2, spin, ceilingM: 2.8, fuseMs: 1500, vMaxMs: throwVMax(12, true) });
      const passes = [], fails = [], rooms = {};
      for (let i = 0; i < 200; i++) {
        const ok = i % 2 === 0, L = throwLand(s, s.player.id, solve, { itemId: `t${i}`, ok, margin: ok ? 3 : -4, wh: 10, area, feet: [29.95, 12.45], door });
        (ok ? passes : fails).push(L);
        const r = roomOf(area, L.x, L.z)?.id ?? 'none';
        rooms[r] = (rooms[r] ?? 0) + 1;
      }
      const lim = 0.5 + 0.03 * solve.dM, worst = Math.max(...passes.map(p => p.offM)), b = spinBiasCm(spin, { rangeM: 3, vMs: 5 });
      console.log(`      the toss: ${fmt(solve.dM, 2)} m at ${solve.angleDeg}°, ${fmt(solve.vMs, 2)} m/s, ${solve.flightMs} ms, top ${fmt(solve.apexM, 2)} m under 2.8 (low ${solve.low}); DC ${throwDc(solve.dM, { door: true })}`);
      console.log(`      200 throws: passes off the aim at most ${fmt(worst, 2)} m (limit ${fmt(lim, 2)}), fails ${fmt(Math.min(...fails.map(f => f.offM)), 2)} to ${fmt(Math.max(...fails.map(f => f.offM)), 2)} m; walls struck ${[...passes, ...fails].filter(x => x.wall).length}; where they lay: ${JSON.stringify(rooms)}`);
      console.log(`      the spin: ${b.cm} cm at 3 m and 5 m/s (${b.upCm} up, ${b.sideCm} side); this toss ${solve.bias.cm} cm, applied ${solve.appliedCm} cm`);
      assert(worst <= lim + 1e-9, JSON.stringify({ worst, lim }));
      assert(Object.keys(rooms).every(r => r === 'w4.r1'), JSON.stringify(rooms));
      assert(Math.abs(b.cm - 24.2) < 0.3 && solve.bias.cm > 0 && solve.appliedCm === 0, JSON.stringify({ b, bias: solve.bias }));
    },
  },
  {
    name: 'the low throw is chosen where the lob outlasts the fuse (COMBAT §11.1: a 10 m lob 1.4 s at 1 G, 2.3 s on Mars, 3.9 s on Europa): a 20 m throw on Europa with a G-9\'s 4.0 s is thrown low, on Mars and at 1 G lobbed',
    fn() {
      const s = { meta: { seed: 1 } }, G = { earth: 1, mars: 0.38, europa: 0.134 };
      const lob = Object.fromEntries(Object.entries(G).map(([k, gG]) => [k, throwSolve(s, 'p1', { from: [0, 0], aim: [10, 0], gMs2: gG * G0_MS2, vMaxMs: 15 })]));
      const far = Object.fromEntries(Object.entries(G).map(([k, gG]) => [k, throwSolve(s, 'p1', { from: [0, 0], aim: [20, 0], gMs2: gG * G0_MS2, fuseMs: 4000, vMaxMs: 15 })]));
      console.log(`      a 10 m lob: ${Object.entries(lob).map(([k, x]) => `${k} ${fmt(x.flightMs / 1000, 2)} s at ${x.angleDeg}°`).join(', ')}`);
      console.log(`      20 m with a 4.0 s fuse: ${Object.entries(far).map(([k, x]) => `${k} ${x.angleDeg}° ${fmt(x.flightMs / 1000, 2)} s${x.low ? ' low' : ''}`).join(', ')}`);
      assert(lob.earth.angleDeg === 45 && lob.mars.flightMs > lob.earth.flightMs * 1.4 && lob.europa.flightMs > lob.mars.flightMs * 1.4, JSON.stringify(lob));
      assert(far.europa.low && far.europa.flightMs <= 3600 && !far.earth.low && !far.mars.low, JSON.stringify(far));
    },
  },  {
    name: 'a failed throw through room 1\'s door never comes back over the door\'s line: 2,000 throws at margins −2, −5 and −8 from the hand round the jamb all land in room 1 (the review of 2026-11-16: 44, 603 and 742 of them landed in the hall behind the stack), and a slip lands at the thrower\'s feet on the hall side, under 0.6 m from him',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go', loadout: 'flash' }), s = g.state, area = s.places.live.area;
      setOpening(s, 'o:w4:r1', 'open', { atMs: s.clock.ms - 1000 });
      const o = openingOf('o:w4:r1'), feet = [29.95, 12.45], from = [29.3, 1.4, 11.85], aim = [29, 10], door = { axis: o.axis, at: o.at, side: -1 };
      const gMs2 = gravityAt(s, null, from[0], from[2]).gG * G0_MS2;
      const solve = throwSolve(s, s.player.id, { from, aim, gMs2, spin: spinOf(s, area), ceilingM: 2.8, fuseMs: 1500, vMaxMs: throwVMax(10, true) });
      const A = s.places.live.area, rooms = {};
      for (let i = 0; i < 2000; i++) for (const margin of [-2, -5, -8]) {
        const L = throwLand(s, s.player.id, solve, { itemId: `i${i}`, ok: false, margin, nat: 5, wh: 10, area, feet, door });
        const id = roomOf(areaOf(A), L.x, L.z)?.id ?? 'none', k = `${margin} ${id}`;
        rooms[k] = (rooms[k] ?? 0) + 1;
      }
      const slip = throwLand(s, s.player.id, solve, { itemId: 'slip', ok: false, margin: -9, nat: 1, wh: 4, area, feet, door });
      const slipRoom = roomOf(areaOf(A), slip.x, slip.z)?.id, slipM = Math.hypot(slip.x - feet[0], slip.z - feet[1]);
      console.log(`      the fails by margin and room: ${JSON.stringify(rooms)}; the slip at (${fmt(slip.x, 2)}, ${fmt(slip.z, 2)}), ${slipRoom}, ${fmt(slipM, 2)} m from the thrower`);
      const out = Object.entries(rooms).filter(([k]) => !k.endsWith(' w4.r1'));
      assert(!out.length && slip.atFeet && slipRoom === 'w4.hall' && slipM < 0.6, JSON.stringify({ rooms, slip, slipRoom, slipM }));
    },
  },
];
