// OLYMPUS tests: brass in free fall (WEAPONS §2.8; ROADMAP "anywhere" step 7; the build sheet v0.0.24 §6 B; F111): look.js ejectCase
// and caseAt under the float band, with brass.js caseFacesOf's ray, in the steel bay at 0 G (tests/float-world.mjs) and in the shoot
// house under ship-coast.
//   - two segments: the case flies straight at its port's height to the first face, bounces once at CASE_BOUNCE 0.3 of its speed
//     off it (the speed into the face reversed) and drifts to the next, where it rests; no point of its path is in a wall or off
//     the floor, and it never goes under the deck;
//   - caseAt is a closed form: the same at any ms whatever ticks passed, before and after a save's load;
//   - at Mars, in the Wheel and on Europa the record is v0.0.10's bytes (no path, no restY), faces given or not; under the float
//     band a case with no faces is an error, never a quiet 2 m.
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { floatRoom, BAY } from './float-world.mjs';
import { ejectCase, caseAt, caseGMs2, CASE_BOUNCE, CASE_FLOAT_MS2 } from '../src/sim/arms/look.js';
import { caseFacesOf, CASE_R_M } from '../src/sim/arms/brass.js';
import { navOf } from '../src/sim/places/nav.js';
import { overlaps, onFloor } from '../src/sim/places/collide.js';
import { resolveShot } from '../src/sim/arms/shot.js';
import { gunOn } from '../src/sim/arms/shooting.js';

const GUN = { model: 'r7' };
const throws = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
/** v0.0.10's records (the stage-0 tree's own ejectCase, run once): Mars standing, prone, 1 G kneeling, Europa standing. */
const GOLDEN = Object.freeze([
  [3.727, 'stand', 'a', '{"kind":"case","atMs":1000000,"x0":1100.2511,"y0":1.4,"z0":292.7033,"v":[1.5586,0,3.4957],"landMs":1000867,"at":[1101.6024,295.7341]}'],
  [3.727, 'prone', 'b', '{"kind":"case","atMs":1000000,"x0":1100.2511,"y0":0.25,"z0":292.7033,"v":[0.8875,0,3.905],"landMs":1000366,"at":[1100.5759,294.1325]}'],
  [9.807, 'kneel', 'c', '{"kind":"case","atMs":1000000,"x0":1100.2511,"y0":0.95,"z0":292.7033,"v":[1.1159,0,3.78],"landMs":1000440,"at":[1100.7421,294.3665]}'],
  [1.314, 'stand', 'd', '{"kind":"case","atMs":1000000,"x0":1100.2511,"y0":1.4,"z0":292.7033,"v":[0.3746,0,4.101],"landMs":1001460,"at":[1100.798,298.6908]}'],
]);

export default [
  {
    name: 'a case at 0 G flies to the first face, bounces once at 0.3 of its speed off it and drifts to the next, where it rests: two segments, no point of them in a wall, off the floor or under the deck (F111)',
    fn() {
      const w = floatRoom(), { s } = w, area = s.places.live.area, faces = caseFacesOf(s), gMs2 = caseGMs2(s);
      assert(gMs2 < CASE_FLOAT_MS2, `the bay floats: ${gMs2}`);
      let worstIn = 0, n = 0, bounceOff = 0, minY = Infinity;
      const rows = [];
      for (let k = 0; k < 48; k++) {
        const x = BAY.x0 + 0.6 + (k % 8) * 1.4, z = BAY.z0 + 0.6 + Math.floor(k / 8) * 1.2, yaw = k * 0.7, stance = ['stand', 'kneel', 'prone'][k % 3];
        const rec = ejectCase(GUN, { x, z, headRad: yaw, stance }, { atMs: 1000, kind: 'case', key: `free:${k}`, gMs2, faces });
        const b = rec.path?.[0];
        assert(b && rec.path.length === 1 && rec.restY === rec.y0 && rec.landMs > b.atMs && b.atMs > rec.atMs, JSON.stringify(rec));
        // (the bounce: the speed into the face reversed, the whole at CASE_BOUNCE)
        const v = rec.v, sp = Math.hypot(v[0], v[2]), bs = Math.hypot(b.v[0], b.v[2]);
        bounceOff = Math.max(bounceOff, Math.abs(bs - CASE_BOUNCE * sp));
        // (every 5 ms of the flight, and its rest: on the floor, clear of every wall, at the port's height)
        const grid = navOf(s, area, 'C0', x, z);
        for (let t = rec.atMs; t <= rec.landMs + 10; t += 5) {
          const c = caseAt(rec, t, gMs2);
          n++; minY = Math.min(minY, c.y);
          if (!onFloor(grid, c.x, c.z) || overlaps(grid, c.x, c.z, CASE_R_M)) worstIn++;
        }
        // (each segment ends at a face: a centimetre on along its way is in a wall or off the floor)
        const end1 = [b.x + v[0] / sp * 0.01, b.z + v[2] / sp * 0.01], end2 = [rec.at[0] + b.v[0] / bs * 0.01, rec.at[1] + b.v[2] / bs * 0.01];
        assert(!onFloor(grid, ...end1) || overlaps(grid, ...end1, CASE_R_M), `${k}: the first segment ends short of a face`);
        assert(!onFloor(grid, ...end2) || overlaps(grid, ...end2, CASE_R_M), `${k}: the second segment ends short of a face`);
        if (k < 3) rows.push(`${stance} at (${fmt(x, 1)}, ${fmt(z, 1)}) heading ${fmt(yaw, 1)} rad: ${fmt(sp, 2)} m/s to (${b.x}, ${b.z}) at ${b.atMs - rec.atMs} ms, back at ${fmt(bs, 3)} m/s to (${rec.at[0]}, ${rec.at[1]}), at rest from ${rec.landMs - rec.atMs} ms at ${rec.restY} m`);
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      48 cases, ${n} points of their flights: ${worstIn} in a wall or off the floor, the lowest ${minY} m; the bounce's speed off 0.3 × by at most ${fmt(bounceOff, 5)} m/s`);
      assert(worstIn === 0 && minY >= 0.25 && bounceOff < 0.001, JSON.stringify({ worstIn, minY, bounceOff }));
      assert(throws(() => ejectCase(GUN, { x: 25, z: 6, headRad: 0 }, { atMs: 0, gMs2: 0 })), 'under the float band a case with no faces is an error');
    },
  },
  {
    name: 'caseAt is a closed form in free fall: the house\'s fired case at 0 G read at any ms is the same whatever ticks pass, and after a save\'s load (F111)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', env: 'ship-coast', setup: 'contact' }), s = g.state, pid = s.player.id;
      const me = s.actors.list.find(x => x.id === s.player.actor), gunId = gunOn(s, pid);
      s.items[gunId].mode = 'semi';
      const { shot } = resolveShot(s, null, { pid, gunId, target: { key: 'test', kind: 'paper', paper: 'b27', x: me.x + 10, z: me.z, dM: 10 }, log: false });
      const rec = shot.brassRec, gMs2 = caseGMs2(s), at = (r) => [0, 100, 400, 900, 1500, 3000, 6000, 12000].map(t => JSON.stringify(caseAt(r, rec.atMs + t, gMs2)));
      const a0 = at(rec), json = JSON.stringify(rec);
      g.step(37);
      const a1 = at(rec), r2 = JSON.parse(json), a2 = at(r2);
      console.log(`      the case: ${json}`);
      console.log(`      at 0.9 s ${a0[3]}; at 12 s ${a0[7]}; read again after 37 ticks and from its JSON: ${a0.join() === a1.join() && a1.join() === a2.join() ? 'the same' : 'DIFFERENT'}`);
      assert(rec.path && a0.join() === a1.join() && a1.join() === a2.join(), 'caseAt moved');
    },
  },
  {
    name: 'at Mars, in the Wheel and on Europa a case\'s record is v0.0.10\'s bytes, faces given or not: no path, no restY (F111)',
    fn() {
      const w = floatRoom(), faces = caseFacesOf(w.s), out = [];
      for (const [gMs2, stance, k, want] of GOLDEN) {
        const a = JSON.stringify(ejectCase(GUN, { x: 1100, z: 292.5, headRad: 0.3, stance }, { atMs: 1_000_000, kind: 'case', key: `golden:${k}`, gMs2 }));
        const b = JSON.stringify(ejectCase(GUN, { x: 1100, z: 292.5, headRad: 0.3, stance }, { atMs: 1_000_000, kind: 'case', key: `golden:${k}`, gMs2, faces }));
        out.push(`${gMs2} m/s² ${stance}: ${a === want && b === want ? 'v0.0.10\'s bytes' : 'MOVED'}`);
        assert(a === want && b === want, `${gMs2} ${stance}: ${a} against ${want}`);
      }
      console.log(`      ${out.join('; ')}`);
    },
  },
];
