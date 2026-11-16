// OLYMPUS tests: the P-12 drawn, handled from its own state (the user, 2026-11-15: the P-12 sequenced like the rifle; the build sheet 0.0.18 §5.1 test 9).
//
// v0.0.17 with the P-12 drawn: canDo pushed Sling it for every gun (it left stop motion with the pistol still in the hand) and
// Port cover once a round had fired (the P-12 has none, models.js portCover false), and its magazine out went to a rifle's chest
// pouch (kit.js pouchFor skipped every pouch with families). Now its RELOAD and Top up come from the planner and reach the thigh's
// pistol pouch, its magazine out goes back there, and neither Sling it nor Port cover is offered.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { canDo, beliefOf, doAction } from '../src/sim/arms/firearms.js';
import { macrosFor } from '../src/sim/arms/drills.js';
import { stepsOf, chooseStep } from '../src/sim/arms/shooting.js';
import { modelOf } from '../src/sim/arms/groups.js';
import { holderOf, pouchesOf } from '../src/sim/arms/kit.js';

function run(g, s, step) {
  const r = chooseStep(s, g.bus, { step });
  for (let i = 0; i < 400 && s.stop?.mode === 'stop' && s.stop.phase !== 'choose'; i++) g.step(1);
  return r;
}
// (the sergeant at GO, the P-12 drawn by Transition)
export function drawnHouse({ tier = 'sgt', seed = 48213 } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), s = g.state, pid = s.player.id;
  run(g, s, 'weapon:transition');
  const p = s.stop.gun;
  assert(s.items[p]?.model === 'p12' && s.people[pid].kit.hands.includes(p), JSON.stringify({ gun: s.stop.gun, hands: s.people[pid].kit.hands }));
  return { g, s, pid, p };
}

export default [
  {
    name: 'the P-12 drawn offers its own RELOAD and Top up from the thigh pouch, its magazine out goes to the thigh pouch, and it never offers Sling it or Port cover',
    fn() {
      const { g, s, pid, p } = drawnHouse(), gun = s.items[p];
      // (a round fired: the port open, which offered Port cover in v0.0.17)
      gun.portOpen = true;
      const singles = canDo(s, pid, p);
      assert(!singles.includes('stow') && !singles.includes('port'), JSON.stringify({ singles }));
      const rows = stepsOf(s);
      assert(!rows.some(r => r.id === 'stow' || r.id === 'port'), JSON.stringify(rows.map(r => r.id)));
      // (Top up at three left, the thigh's spare of ten to hand)
      s.items[gun.mag].n = 3; gun.belief = { ...gun.belief, count: 3 };
      const top = macrosFor(s, pid, p).find(m => m.id === 'reload:tactical');
      assert(top && top.subs.join(',') === 'magOut:pouch,reach,seat', JSON.stringify(macrosFor(s, pid, p).map(m => [m.id, m.subs])));
      const tRow = stepsOf(s).find(r => r.id === 'macro:reload:tactical');
      assert(tRow?.subs.map(x => x.label).join(', ') === 'Magazine to the thigh pouch, Reach for a magazine, Magazine in', JSON.stringify(tRow?.subs));
      const was = gun.mag, thigh = pouchesOf(s, pid).find(q => q.key === 'pp');
      doAction(s, g.bus, { pid, gunId: p, action: 'magOut:pouch', force: { 'magOut:pouch': 'pass' } });
      assert(holderOf(s, was)?.container === thigh.id, JSON.stringify({ to: holderOf(s, was), thigh: thigh.id }));
      // (the slide locked back on an empty: RELOAD by the planner, the reach from the thigh)
      const g2 = drawnHouse(), s2 = g2.s, gun2 = s2.items[g2.p];
      s2.items[gun2.mag].n = 0; delete gun2.chamber; gun2.locked = true; gun2.belief = { chamber: 'empty', locked: true, count: 0 };
      const rl = macrosFor(s2, g2.pid, g2.p).find(m => m.id === 'reload:speed');
      assert(rl && rl.subs.join(',') === 'magOut:drop,reach,seat,release', JSON.stringify(macrosFor(s2, g2.pid, g2.p).map(m => [m.id, m.subs])));
      const fix = modelOf(stepsOf(s2)).core.fix.row;
      assert(fix?.id === 'macro:reload:speed' && fix.subs.at(-1).label === 'Slide release', JSON.stringify({ fix }));
      const reach = stepsOf(s2).find(r => r.id === 'reach@pp');
      assert(reach && /^Reach: the pistol pouch/.test(reach.label), JSON.stringify({ reach: reach?.label }));
      console.log(`      drawn: no Sling it, no Port cover; Top up ${tRow.subs.map(x => x.label).join(', ')} (${(tRow.ms / 1000).toFixed(2)} s), its magazine to the thigh; RELOAD ${fix.subs.map(x => x.label).join(', ')} (${(fix.ms / 1000).toFixed(2)} s); "${reach.label}"`);
    },
  },
];
