// OLYMPUS tests: V with the P-12 out (the play review of v0.0.23, its eighth finding; COMBAT §25.19.6, the build sheet v0.0.23 item 3).
//
// In the house V cycles the movement stances, Relaxed, Combat, Assault, the posture following (shooting.js gaitAction). With the
// P-12 in the hand, Relaxed set its posture 'slungFront' while it stayed drawn: one press in three with nothing seen; and each
// change of the pistol's posture drew its 'raise' frames as the holster's (poses.js PISTOL_ACTION), a dip to the thigh at every
// press. Now Relaxed is passed over with the P-12 out (V goes Combat, Assault: the low and the high ready, as carryAction's V does),
// and a raise with the pistol out is drawn as the posture it goes to. From the sergeant's save after Transition (v0.0.17's own code,
// tests/saves/v0.0.17-house-pistol.json.gz), four presses of V, each with its frames: the pistol never 'slungFront', every press a
// change of posture, no 'pistolHolster' frame. Fails without either fix.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { gunLook } from '../src/sim/arms/look.js';
import { pistolFrameOf } from '../src/art/figures/poses.js';

export default [
  {
    name: 'V with the P-12 out goes between the low and the high ready, never "slungFront" with the pistol drawn, every press a change, no holster frame on the way (the play review of v0.0.23: one dead press in three, each through pistolHolster)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213 });
      const st = g.load(gunzipSync(readFileSync(path.join(root, 'tests', 'saves', 'v0.0.17-house-pistol.json.gz'))).toString('utf8'));
      const pid = st.player.id, me = () => g.state.actors.list.find(a => a.who === pid), look = () => gunLook(g.state, me(), g.state.clock.ms);
      assert(look()?.pistol, 'the save has the P-12 out');
      const rows = [], frames = new Set();
      let prev = look().pistol.posture, dead = 0, slung = 0;
      for (let p = 0; p < 4; p++) {
        g.step(1, { act: ['gait'] });
        for (let i = 0; i < 40; i++) { const gl = look(); if (gl?.pistol) frames.add(pistolFrameOf(gl.pistol, gl.action)); g.step(1, {}); }
        const now = look()?.pistol?.posture ?? null;
        rows.push(`${me().moveStance} ${now}`);
        if (now === prev) dead++;
        if (now === 'slungFront') slung++;
        prev = now;
      }
      console.log(`      from ${look() ? '' : ''}the save: ${rows.join(' → ')}; the frames drawn ${[...frames].join(', ')}`);
      assert(!dead && !slung && !frames.has('pistolHolster') && frames.has('pistolLow') && frames.has('pistolHigh'), JSON.stringify({ rows, dead, slung, frames: [...frames] }));
    },
  },
];
