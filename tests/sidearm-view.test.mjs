// OLYMPUS tests: a person's guns, where each is and which is in use (src/sim/arms/guns.js; the build sheet 0.0.18 §5.1 test 16).
//
// The shoot house issues the P-12 beside the R-7 on every sheet (the user, 2026-11-15: one loadout); the ranges issue one gun.
// gunsOf reads the places from the kit (felt, never believed): at GO the rifle in the hands and the P-12 in its holster; after
// Transition the P-12 in the hands and the rifle hanging; after Rifle up as at GO. On test-handling, test-range, test-pairs and
// test-stress there is one gun and no other, so the weapon card is v0.0.17's.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { gunsOf, otherGunView, gunPlaceOf, accessOf } from '../src/sim/arms/guns.js';
import { chooseStep } from '../src/sim/arms/shooting.js';

function run(g, s, step) {
  const r = chooseStep(s, g.bus, { step });
  for (let i = 0; i < 400 && s.stop?.mode === 'stop' && s.stop.phase !== 'choose'; i++) g.step(1);
  return r;
}
const said = (s) => gunsOf(s, s.player.id).map(x => `${x.short} ${x.place}${x.inUse ? ' (in use)' : ''}`).join(', ');

export default [
  {
    name: 'gunsOf in the house: at GO the rifle in the hands and the P-12 in its holster; after Transition the P-12 in the hands and the rifle hanging; after Rifle up as at GO',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, pid = s.player.id;
      const go = gunsOf(s, pid);
      assert(go.length === 2 && go[0].model === 'r7' && go[0].place === 'hands' && go[0].inUse && go[1].model === 'p12' && go[1].place === 'holster', said(s));
      const o0 = otherGunView(s, pid);
      assert(o0?.model === 'p12' && o0.place === 'holster' && o0.belief?.model === 'p12', JSON.stringify(o0));
      const acc = accessOf(s, pid, o0.id);
      assert(acc.pre.join(',') === 'hang,draw:thigh' && acc.post.join(',') === 'holster,up', JSON.stringify(acc));
      const at = [`GO: ${said(s)}`];
      run(g, s, 'weapon:transition');
      const tr = gunsOf(s, pid);
      assert(tr[0].model === 'p12' && tr[0].place === 'hands' && tr[0].inUse && tr[1].model === 'r7' && tr[1].place === 'hanging', said(s));
      assert(accessOf(s, pid, tr[1].id).pre.join(',') === 'holster,up', JSON.stringify(accessOf(s, pid, tr[1].id)));
      at.push(`Transition: ${said(s)}`);
      run(g, s, 'weapon:rifle-up');
      const up = gunsOf(s, pid);
      assert(up[0].model === 'r7' && up[0].place === 'hands' && up[1].place === 'holster' && gunPlaceOf(s, pid, up[1].id) === 'holster', said(s));
      at.push(`Rifle up: ${said(s)}`);
      console.log(`      ${at.join('; ')}`);
    },
  },
  {
    name: 'one gun and no other on the four ranges: test-handling, test-range, test-pairs and test-stress issue no sidearm, so otherGunView is null and the card is v0.0.17\'s',
    fn() {
      const out = [];
      for (const scenario of ['test-handling', 'test-range', 'test-pairs', 'test-stress']) {
        const g = createGame({ scenario, seed: 48213 }), s = g.state, pid = s.player.id;
        const list = gunsOf(s, pid);
        assert(list.length === 1 && list[0].model === 'r7' && otherGunView(s, pid) === null, JSON.stringify({ scenario, list }));
        out.push(`${scenario}: ${said(s)}`);
      }
      console.log(`      ${out.join('; ')}`);
    },
  },
];
