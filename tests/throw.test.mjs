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
import { aimOf, fuseLeftMs, AIM_OFF_WALL_M } from '../src/sim/arms/throw.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { DEEP_BEYOND_M, SLIP_KEEP_M } from '../src/sim/arms/throw.js';
import { setSt } from '../src/sim/arms/devices.js';
import { move as kitMove } from '../src/sim/arms/kit.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { stepAct } from './bots/lib.mjs';
import { playerActor } from '../src/core/ids.js';
import { kitLane } from './flawless-kit.mjs';
import { BREACH_SAFE_KPA } from '../src/sim/arms/blast.js';

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
  // (v0.0.19, D2 (kit2 §6 tests 15, 16; the build sheet 0.0.19 §0 item 1: throwSolve already takes the fuse, D2 passes the fuse believed left))
  {
    name: 'a cooked G-9P in Mars\'s 0.38 G is thrown low when the lob outlasts the fuse believed left (throw.js fuseLeftMs: the nominal less the count, never the drawn fuse); uncooked it is lobbed',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'frag' }), s = g.state;
      const id = Object.keys(s.items).find(k => s.items[k].model === 'g9p'), rec = s.items[id], now = s.clock.ms;
      rec.st = 'live'; rec.leverAtMs = now - 2000;
      const left = fuseLeftMs(s, id, now), drawn = rec.fuseMs;
      // (down the hall, 5 m: the lob there flies 1.85 s at 0.38 G, past the fuse left less FUSE_KEEP_MS)
      const from = [17, 1.4, 13.2], aim = [12, 13.2], gMs2 = 0.38 * G0_MS2;
      const cooked = throwSolve(s, s.player.id, { from, aim, gMs2, ceilingM: 2.8, fuseMs: left, vMaxMs: throwVMax(12, true) });
      const lobbed = throwSolve(s, s.player.id, { from, aim, gMs2, ceilingM: 2.8, fuseMs: 4000, vMaxMs: throwVMax(12, true) });
      console.log(`      the fuse believed left after a 2 s cook ${left} ms (drawn ${drawn}, unread); at 0.38 G over ${fmt(cooked.dM, 2)} m: cooked ${cooked.angleDeg}° in ${cooked.flightMs} ms (low ${cooked.low}), uncooked ${lobbed.angleDeg}° in ${lobbed.flightMs} ms (low ${lobbed.low}), top ${fmt(lobbed.apexM, 2)} m under 2.8`);
      assert(left === 2000 && cooked.flightMs <= left - 400 && lobbed.flightMs > cooked.flightMs && cooked.angleDeg < lobbed.angleDeg, JSON.stringify({ left, cooked: [cooked.angleDeg, cooked.flightMs], lobbed: [lobbed.angleDeg, lobbed.flightMs] }));
    },
  },
  {
    name: 'the rows aim a frag or a concussion deep: room 1\'s aim is (29.0, 8.8), 0.8 m off its far wall, across the room\'s middle; a G-11 at the room\'s middle as built',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), P = lanePlanOf(g.state).plans;
      const out = Object.fromEntries(['o:w4:r1', 'o:w4:r2', 'o:w4:r3'].map(d => [d, { deep: aimOf(g.state, P[d], 'deep'), centre: aimOf(g.state, P[d], 'centre') }]));
      console.log(`      ${Object.entries(out).map(([d, a]) => `${d} deep ${a.deep.join(', ')}, centre ${a.centre.join(', ')}`).join('; ')} (AIM_OFF_WALL_M ${AIM_OFF_WALL_M})`);
      assert(out['o:w4:r1'].deep.join() === '29,8.8' && out['o:w4:r1'].centre.join() === '29,10', JSON.stringify(out));
    },
  },
  // (the review of v0.0.19's K, finding 1: a thrower already past the door's plane had the room's side taken from where he stood,
  // so the throw was mirrored into the hall and the deep floor carried it 2 m onto the stack: (29.218, 14.000) by "Throw it",
  // (29.218, 13.599) by "Throw it clear", the #2 140 fragments)
  {
    name: 'a G-9P thrown from past room 1\'s door plane, kneeling at (28.88, 11.825), by "Throw it" (armed) and "Throw it clear" (live) lands in room 1, DEEP_BEYOND_M past the line, never in the hall on the stack (the review of v0.0.19\'s K: z 14.000 and 13.599); a slip there stays at his feet on the room\'s side',
    fn() {
      const out = {};
      for (const [row, st] of [['dev:throw', 'armed'], ['dev:gren:clear', 'live']]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'frag' }), s = g.state;
        setOpening(s, 'o:w4:r1', 'open', { atMs: s.clock.ms - 1000 });
        const P = playerActor(s); P.x = 28.88; P.z = 11.825;
        const id = Object.keys(s.items).find(k => s.items[k].model === 'g9p');
        kitMove(s, id, { pid: s.player.id, hand: 0 }); setSt(s, id, st);
        if (st === 'live') Object.assign(s.items[id], { leverAtMs: s.clock.ms, fuseAtMs: s.clock.ms + s.items[id].fuseMs });
        g.step(1);
        const offered = stepsOf(s).some(r => r.id === row && !r.off);
        g.step(1, { act: [stepAct(row)] });
        for (let i = 0; i < 200 && !s.items[id].flight; i++) g.step(1);
        const f = s.items[id].flight, room = f ? roomOf(areaOf(s.places.live.area), f.x1, f.z1)?.id ?? 'none' : null;
        out[row] = { offered, from: f && [f.x0, f.z0], at: f && [f.x1, f.z1], room };
      }
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'frag' }), s = g.state, area = s.places.live.area;
      const o = openingOf('o:w4:r1'), door = { axis: o.axis, at: o.at, side: -1 }, feet = [28.88, 11.825];
      const solve = throwSolve(s, s.player.id, { from: [28.88, 1.4, 11.85], aim: [29, 8.8], gMs2: G0_MS2, ceilingM: 2.8, fuseMs: 4000, vMaxMs: throwVMax(10, true) });
      const slip = throwLand(s, s.player.id, solve, { itemId: 'slip', ok: false, margin: -9, nat: 1, wh: 4, area, feet, door });
      console.log(`      from (28.88, 11.825), the door's plane z ${o.at}: ${Object.entries(out).map(([k, v]) => `${k} (offered ${v.offered}) from (${v.from}) to (${v.at}), ${v.room}`).join('; ')}; a slip at (${slip.x}, ${slip.z}), ${fmt(Math.hypot(slip.x - feet[0], slip.z - feet[1]), 2)} m from him`);
      assert(Object.values(out).every(v => v.offered && v.room === 'w4.r1' && v.at[1] <= o.at - DEEP_BEYOND_M + 1e-9 && v.from[1] < o.at), JSON.stringify(out));
      assert(slip.atFeet && slip.z <= o.at - SLIP_KEEP_M + 1e-9 && Math.hypot(slip.x - feet[0], slip.z - feet[1]) < 0.6, JSON.stringify(slip));
    },
  },
  // (the review of v0.0.19's K, finding 9: the deep throw's floor was pinned by the heavy F30 alone; without it the corporal's and
  // the sergeant's failed throw on seed 1222 landed 0.48 m inside room 1's door, 112.2 kPa on #1 round the jamb, a cease fire)
  {
    name: 'a practice frag\'s deep throw never lands nearer room 1\'s door than DEEP_BEYOND_M: the corporal and the sergeant on seed 1222 (a failed throw) reach the card clear, the stack under BREACH_SAFE_KPA in the read (the review of v0.0.19\'s K: 112.2 kPa and the cease fire without the floor)',
    timeoutMs: 120_000,
    fn() {
      const out = ['cpl', 'sgt'].map(tier => { const r = kitLane({ tier, seed: 1222, use: 'frag' }); return { tier, end: r.end, reads: r.reads.map(x => ({ room: x.room, me: x.me?.kPa ?? null, two: x.two?.kPa ?? null, n: (x.me?.n ?? 0) + (x.two?.n ?? 0) })) }; });
      console.log(`      ${out.map(o => `${o.tier}: ${o.end}; reads ${o.reads.map(x => `${x.room} you ${x.me} kPa, #2 ${x.two} kPa, ${x.n} balls`).join('; ')}`).join(' | ')} (BREACH_SAFE_KPA ${BREACH_SAFE_KPA}, DEEP_BEYOND_M ${DEEP_BEYOND_M})`);
      assert(out.every(o => o.end === 'clear' && o.reads.length && o.reads.every(x => x.me < BREACH_SAFE_KPA && x.two < BREACH_SAFE_KPA && x.n === 0)), JSON.stringify(out));
    },
  },
];
