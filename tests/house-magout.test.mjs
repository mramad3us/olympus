// OLYMPUS tests: the rifle with its magazine out in a fight (the user, 2026-11-15, playing the shoot house: "fumbled magazine
// when topping up, no option to load", then "fired the last bullet and still no option to reload"). A top-up whose magazine
// falls leaves the rifle with no magazine and a round chambered; that round fired, the chamber is dry. Before the fix the
// panel offered nothing that put a magazine in (drills.js macrosFor offered LOAD only on a chamber not live, the tower's, with
// no charge, and the reloads only with a magazine in): Fix read "Nothing to fix", then a struck eye.
import { assert } from './helpers.mjs';
import { drillWorld } from './drill-world.mjs';
import { doAction, beliefOf } from '../src/sim/arms/firearms.js';
import { macrosFor, runMacro } from '../src/sim/arms/drills.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { modelOf } from '../src/sim/arms/groups.js';

function fumbled({ dry }) {
  const w = drillWorld({ tier: 'private' }), { g, s, pid, gunId } = w;
  const r = doAction(s, g.bus, { pid, gunId, action: 'magOut:pouch', force: { 'magOut:pouch': 'disaster' } });
  assert(r.mishap === 'dropMag', JSON.stringify({ mishap: r.mishap, text: r.text }));
  if (dry) { const gun = s.items[gunId]; delete gun.chamber; gun.belief = { ...(gun.belief ?? {}), chamber: 'empty' }; }
  return w;
}

export default [
  ...[[false, 'reload:tactical', 'Magazine in', ['reach', 'seat']], [true, 'reload:speed', 'RELOAD', ['reach', 'seat', 'charge']]].map(([dry, macro, label, subs]) => ({
    name: `a top-up's magazine fumbled out, the chamber ${dry ? 'then fired dry' : 'still live'}: Fix and the reload slot offer ${label} (${subs.join(', ')}), and it leaves a magazine in and a round chambered`,
    fn() {
      const { g, s, pid, gunId } = fumbled({ dry });
      const b = beliefOf(s, gunId);
      assert(b.mag === 'out' && b.chamber === (dry ? 'empty' : 'live'), JSON.stringify({ mag: b.mag, chamber: b.chamber }));
      const m = macrosFor(s, pid, gunId).find(x => x.id === macro);
      assert(m && JSON.stringify(m.subs) === JSON.stringify(subs), JSON.stringify({ offered: macrosFor(s, pid, gunId).map(x => [x.id, x.subs]) }));
      const mo = modelOf(stepsOf(s));
      assert(mo.core.fix.row?.id === `macro:${macro}` && mo.core.fix.row.label === label && !mo.core.fix.row.off, JSON.stringify({ fix: mo.core.fix.row }));
      assert(mo.groups.GUN.slots[1]?.row?.id === `macro:${macro}`, JSON.stringify({ slot: mo.groups.GUN.slots[1]?.row }));
      const run = runMacro(s, g.bus, { macro, pid, gunId });
      const a = beliefOf(s, gunId);
      assert(!run.halted && a.mag === 'in' && s.items[gunId].chamber === 'live', JSON.stringify({ subs: run.subs.map(x => [x.action, x.ok]), halted: run.halted, mag: a.mag, chamber: s.items[gunId].chamber }));
      console.log(`      ${label}: ${run.subs.map(x => x.action).join(', ')} in ${(run.ms / 1000).toFixed(1)} s`);
    },
  })),
];
