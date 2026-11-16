// OLYMPUS tests: a shot lights the room for its flash (the build sheet v0.0.20 item 16; feel.md FL-5; quick, pure).
//
// In v0.0.19 a muzzle's flash lit only the figures within FLASH_LIT_M (render/figures.js), never the floor or the walls: in a dark
// room a shot was a star on a black floor. Now moods.js muzzleLamps gives a moving lamp at each shot's drawn muzzle for
// MUZZLE_LAMP_MS of game time and none after, none under "reduce flashes"; it is marked first, so moods.js pickLamps puts it in the
// stage's ten lamp slots (lights.js LAMP_SLOTS) ahead of every static lamp, even ten nearer ones (before, nearest first, it was
// the one dropped); it is lit in the interior rig (lighting.js MOVING_LAMPS.muzzle), its colour the figures' flash's.
import { assert, fmt } from './helpers.mjs';
import { muzzleLamps, pickLamps, MUZZLE_LAMP_MS, MUZZLE_POOL_M, MUZZLE_LAMP, moodOf, lightAt } from '../src/render/moods.js';
import { linear } from '../src/art/tone.js';

// (the interior rig's mood as lighting.js makes it: its lamps' levels the moving ones', MOVING_LAMPS, read off its source: the module imports three)
const MOVING = { beacon: 1, bang: 1, muzzle: 1 };
const interior = () => moodOf({ ...moodOf('day'), name: 'interior', tint: [1, 1, 1], lamps: MOVING, lampColour: {} });

export default [
  {
    name: 'a shot is a lamp at its muzzle for MUZZLE_LAMP_MS (50 ms of game time) and none after, none with reduced flashes; it takes a slot ahead of ten static lamps nearer the camera (v0.0.19\'s nearest-first dropped it); in the flash\'s colour, its pool 2.5 m',
    fn() {
      const shots = [{ x: 30, z: 12, shotMs: 1000 }, { x: 27, z: 11, shotMs: 1030 }];
      const at = (ms, o) => muzzleLamps(shots, ms, o).length;
      const times = [990, 1000, 1025, 1049, 1050, 1079, 1080, 1200].map(ms => `${ms}: ${at(ms)}`);
      console.log(`      lamps by game ms (shots at 1000 and 1030): ${times.join(', ')}; reduced at 1010: ${at(1010, { reduced: true })}`);
      assert(at(990) === 0 && at(1000) === 1 && at(1049) === 2 && at(1050) === 1 && at(1080) === 0 && at(1010, { reduced: true }) === 0, JSON.stringify(times));
      // (ten static lamps round the camera, nearer than the muzzle: the muzzle still takes a slot, the first)
      const statics = Array.from({ length: 10 }, (_, i) => ({ x: 20 + (i % 5) * 0.4, z: 10 + Math.floor(i / 5) * 0.4, r: 2, core: 0.5, ring: 0.2, kind: 'bang' }));
      const lamps = [...statics, ...muzzleLamps(shots, 1010)], mood = interior();
      const now = pickLamps(lamps, 20, 10, mood, 10), was = [...lamps].map(l => ({ l, d2: (l.x - 20) ** 2 + (l.z - 10) ** 2 })).sort((a, b) => a.d2 - b.d2).slice(0, 10);
      console.log(`      ten static lamps within 2 m of the camera, the muzzle ${fmt(Math.hypot(30 - 20, 12 - 10), 1)} m off: slot 1 ${now[0].lamp.kind}, the muzzle in the ten ${now.some(p => p.lamp.kind === 'muzzle')} (by distance alone ${was.some(p => p.l.kind === 'muzzle')})`);
      assert(now[0].lamp.kind === 'muzzle' && now.length === 10 && !was.some(p => p.l.kind === 'muzzle'), JSON.stringify(now.map(p => p.lamp.kind)));
      // (its light on the floor 1.5 m ahead: the pool's core plus ring, in the flash's colour)
      const dark = { ...mood, tint: [0.05, 0.05, 0.06] }, ahead = lightAt(dark, muzzleLamps(shots.slice(0, 1), 1010), 31.5, 12), off = lightAt(dark, [], 31.5, 12);
      const c = linear(MUZZLE_LAMP.color), luma = (v) => 0.3 * v[0] + 0.59 * v[1] + 0.11 * v[2];
      console.log(`      the floor 1.5 m ahead in a dark room: luma ${fmt(luma(off), 3)} → ${fmt(luma(ahead), 3)} on the shot's frame (×${fmt(luma(ahead) / luma(off), 1)}); its colour linear [${c.map(v => fmt(v, 2)).join(', ')}] (FLASH_LIGHT [1.00, 0.85, 0.55]); MUZZLE_LAMP_MS ${MUZZLE_LAMP_MS}, MUZZLE_POOL_M ${MUZZLE_POOL_M}`);
      assert(luma(ahead) >= 1.25 * luma(off) && Math.abs(c[0] - 1) < 0.02 && Math.abs(c[1] - 0.85) < 0.03 && Math.abs(c[2] - 0.55) < 0.03 && MUZZLE_POOL_M === 2.5 && MUZZLE_LAMP_MS === 50, JSON.stringify({ ahead, off, c }));
    },
  },
];
