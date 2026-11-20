// OLYMPUS tests: the G-11 at 0 G lands in the compartment it is thrown into (F161): straight on to the first face, back off it 1.5 m at most, never back over the hatch's plane; 60 points in it, 20 through the open hatch only; at FREE_G_MS2 and above v0.0.26's landings to the byte (v0.0.27's build sheet §6 B, item 13, FT§9; src/sim/arms/throw.js).
//
// Aboard tests/boarding-world.mjs (the hauler coasting, 0 G), 200 throws through each compartment's hatch from the hand past its line (as
// bundle.js throws through a door): passes and fails, the aim the compartment's middle. The bang's room is burst.js burstRoom's, its
// points supp.js inputPts' (FLASH_PTS in it, FLASH_NEXT_PTS through an open doorway). Then 50 throws through room 1's door in the Wheel,
// their landings' digest the one v0.0.26's throw.js gave (recorded on the snapshot before the change). Fails without the fix: v0.0.26's
// roll at 0 G carried a grenade 7 to 28 m, through the far wall's clip into the passage or back out of the hatch.
import { createHash } from 'node:crypto';
import { assert, fmt } from './helpers.mjs';
import { boardingWorld } from './boarding-world.mjs';
import { createGame } from './game.mjs';
import { throwSolve, throwLand, throwVMax, FREE_G_MS2, FREE_ROLL_MAX_M, BEYOND_M } from '../src/sim/arms/throw.js';
import { burstRoom } from '../src/sim/combat/burst.js';
import { inputPts, FLASH_PTS, FLASH_NEXT_PTS } from '../src/sim/combat/supp.js';
import { gravityAt } from '../src/sim/places/env.js';
import { openingOf, setOpening, roomOf, areaOf } from '../src/sim/places/model.js';
import { spinOf } from '../src/sim/places/spin.js';
import { G0_MS2 } from '../src/core/phys.js';

/** The Wheel's 50 landings through room 1's door, digested on v0.0.26's throw.js (the snapshot a49eac55, before this round's change). */
const WHEEL_DIGEST = '487a39fcb345c5';
const HATCHES = Object.freeze(['cabin-1', 'bunks', 'cabin-2']);
/** The landing's rounding (throw.js r3: to the millimetre, each coordinate), the most it moves a distance read from it (m). */
const MM = 0.0015;

export default [
  {
    name: '200 throws through each compartment\'s hatch at 0 G (F161): every one inside the compartment, at most 1.5 m back off the face it met, never back over the hatch\'s plane; the bang 60 points in it, 20 in the passage through the open hatch, none in the other compartments',
    fn() {
      const w = boardingWorld({ room: 'cabin-2', men: 1 }), s = w.s, area = s.places.live.area, A = areaOf(area), bad = [], lines = [];
      for (const key of HATCHES) {
        const id = `o:mu:d2:${key}`, o = openingOf(id), room = A.rooms.find(r => r.id === `mu.d2.${key}`), [x0, z0, x1, z1] = room.rect;
        for (const h of HATCHES) setOpening(s, `o:mu:d2:${h}`, h === key ? 'open' : 'closed', { atMs: s.clock.ms - 1000 });
        const mid = (o.a + o.b) / 2, centre = o.axis === 'x' ? (z0 + z1) / 2 : (x0 + x1) / 2, side = Math.sign(centre - o.at);
        // (the hand round the near jamb, 0.15 m into the opening and past the hatch's line)
        const from = o.axis === 'x' ? [o.b - 0.15, 1.4, o.at + side * 0.15] : [o.at + side * 0.15, 1.4, o.b - 0.15], door = { axis: o.axis, at: o.at, side };
        const gMs2 = gravityAt(s, null, from[0], from[2]).gG * G0_MS2, aim = [(x0 + x1) / 2, (z0 + z1) / 2];
        const solve = throwSolve(s, w.pid, { from, aim, gMs2, ceilingM: 2.4, fuseMs: 1500, vMaxMs: throwVMax(14, true) });
        const across = (p) => (o.axis === 'x' ? p[1] : p[0]) - o.at;
        let worstBack = 0, nearest = Infinity, inRoom = 0, pts = { in: 0, next: 0, other: 0 };
        for (let i = 0; i < 200; i++) {
          const ok = i % 3 !== 0, L = throwLand(s, w.pid, solve, { itemId: `${key}${i}`, ok, margin: ok ? 2 : -2 - (i % 6), wh: 10, area, door });
          const r = roomOf(area, L.x, L.z)?.id ?? 'none', back = L.faceAt ? Math.hypot(L.x - L.faceAt[0], L.z - L.faceAt[1]) : Infinity, beyond = across([L.x, L.z]) * side;
          worstBack = Math.max(worstBack, back); nearest = Math.min(nearest, beyond);
          if (r === room.id) inRoom++; else bad.push(`${key} ${i}: in ${r} at ${L.x}, ${L.z}`);
          if (!L.free || back > FREE_ROLL_MAX_M + MM || beyond < BEYOND_M - MM) bad.push(`${key} ${i}: back ${fmt(back, 2)} beyond ${fmt(beyond, 2)} free ${L.free}`);
          // (the bang where it lay: its room's, the passage through the open hatch the next, the other compartments shut off)
          const B = burstRoom(s, area, L.x, L.z);
          if (i === 0) {
            pts = { in: B.in.includes(room.id) ? inputPts('flash', { indoor: true }) : 0, next: B.next.includes('mu.d2.passage') ? inputPts('flash', { indoor: true, next: true }) : 0,
              other: HATCHES.filter(h => h !== key).some(h => B.in.includes(`mu.d2.${h}`) || B.next.includes(`mu.d2.${h}`)) ? 1 : 0 };
          }
        }
        lines.push(`${key}: g ${fmt(gMs2, 3)} m/s², thrown ${fmt(solve.vMs, 1)} m/s; ${inRoom}/200 inside, back off the face at most ${fmt(worstBack, 2)} m, nearest the hatch's plane ${fmt(nearest, 2)} m; the bang ${pts.in} in it, ${pts.next} in the passage, others ${pts.other ? 'reached' : 'none'}`);
        if (pts.in !== FLASH_PTS || pts.next !== FLASH_NEXT_PTS || pts.other) bad.push(`${key}: points ${JSON.stringify(pts)}`);
      }
      console.log(`      ${lines.join('; ')}`);
      assert(!bad.length, bad.slice(0, 6).join('; '));
    },
  },
  {
    name: 'at FREE_G_MS2 and above the throw is v0.0.26\'s to the byte (F161): 50 throws through room 1\'s door in the Wheel, passes, fails, slips and doors, their landings\' digest v0.0.26\'s',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go', loadout: 'flash' }), s = g.state, area = s.places.live.area;
      setOpening(s, 'o:w4:r1', 'open', { atMs: s.clock.ms - 1000 });
      const o = openingOf('o:w4:r1'), from = [o.b - 0.15, 1.4, o.at - 0.15], door = { axis: o.axis, at: o.at, side: -1 };
      const gMs2 = gravityAt(s, null, from[0], from[2]).gG * G0_MS2, spin = spinOf(s, area), out = [];
      for (let i = 0; i < 50; i++) {
        const aim = [27 + (i % 5) * 0.8, 9 + (i % 3) * 0.7];
        const solve = throwSolve(s, s.player.id, { from, aim, gMs2, spin, ceilingM: 2.8, fuseMs: 1500, vMaxMs: throwVMax(12, true) });
        const ok = i % 3 !== 0, nat = i % 17 === 0 ? 1 : 0;
        out.push(throwLand(s, s.player.id, solve, { itemId: `w${i}`, ok, margin: ok ? 2 : -3 - (i % 4), nat, wh: 8 + (i % 4), area, feet: [29.95, 12.45], door: i % 2 ? door : null }));
      }
      const d = createHash('sha1').update(JSON.stringify(out)).digest('hex').slice(0, 14);
      console.log(`      the Wheel at ${fmt(gMs2, 3)} m/s² (over FREE_G_MS2 ${FREE_G_MS2}): 50 landings, digest ${d} (v0.0.26's ${WHEEL_DIGEST}); none free ${out.every(L => !L.free)}`);
      assert(d === WHEEL_DIGEST && out.every(L => !L.free), JSON.stringify({ d }));
    },
  },
];
