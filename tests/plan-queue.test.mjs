// OLYMPUS tests: Carry on planned again from the belief now (shooting.js carryOnOf; the build sheet 0.0.18 §5.1 test 6).
//
// v0.0.17's Carry on ran the rest of a halted macro as it was cut: a seat fumbled with its magazine dropped left "Carry on: Bolt
// release", a bolt release on no magazine, and a reach that felt the magazine empty left "Carry on: Magazine in, Bolt release",
// seating the empty. A planned purpose's halt is named now (stop.queueOf, by queueAfter), and its rest is the plan from the belief
// at the halt; the tower's templates and a v0.0.17 save (no queueOf) run their queue as built.
import { assert } from './helpers.mjs';
import { drillWorld } from './drill-world.mjs';
import { doAction, beliefOf } from '../src/sim/arms/firearms.js';
import { stepsOf, chooseStep } from '../src/sim/arms/shooting.js';
import { handMagOf, pouchesOf } from '../src/sim/arms/kit.js';

function run(g, s, step) {
  const r = chooseStep(s, g.bus, { step });
  for (let i = 0; i < 400 && s.stop?.mode === 'stop' && s.stop.phase !== 'choose'; i++) g.step(1);
  return r;
}
// (the rifle locked back on an empty magazine, believed so: RELOAD's own state)
function lockedEmpty(w) {
  const { s, gunId } = w, gun = s.items[gunId];
  s.items[gun.mag].n = 0; delete gun.chamber; gun.locked = true;
  gun.belief = { chamber: 'empty', locked: true, count: 0 };
  return w;
}
const carryOn = (s) => stepsOf(s).find(r => r.id === 'queue') ?? null;

export default [
  {
    name: 'a seat fumbled with the magazine dropped: Carry on is the plan from now (reach, seat, bolt), not the queue as cut (v0.0.17: "Carry on: Bolt release")',
    fn() {
      const w = lockedEmpty(drillWorld({ tier: 'private' })), { g, s, pid, gunId } = w;
      for (const a of ['magOut:drop', 'reach']) doAction(s, g.bus, { pid, gunId, action: a, force: { [a]: 'pass' } });
      const r = doAction(s, g.bus, { pid, gunId, action: 'seat', force: { seat: 'disaster' } });
      assert(r.mishap === 'dropMag' && !handMagOf(s, pid) && beliefOf(s, gunId).mag === 'out', JSON.stringify({ mishap: r.mishap, text: r.text }));
      // (the stepper's halt as queueAfter leaves it: the rest of RELOAD, named)
      s.stop.queue = ['release']; s.stop.queueOf = 'macro:reload:speed';
      const c = carryOn(s);
      assert(c && JSON.stringify(c.queue) === JSON.stringify(['reach', 'seat', 'release']), JSON.stringify({ carryOn: c?.label }));
      // (a v0.0.17 save: no queueOf, the queue as saved)
      delete s.stop.queueOf;
      const old = carryOn(s);
      assert(old && JSON.stringify(old.queue) === JSON.stringify(['release']), JSON.stringify({ old: old?.label }));
      s.stop.queueOf = 'macro:reload:speed';
      run(g, s, 'queue');
      const gun = s.items[gunId];
      assert(gun.mag && gun.chamber === 'live' && !gun.locked, JSON.stringify({ gun }));
      console.log(`      ${c.label} (${(c.ms / 1000).toFixed(2)} s), where v0.0.17 offered "${old.label}"; then a magazine in and one chambered`);
    },
  },
  {
    name: 'a second fumble inside the replanned Carry on keeps its purpose: the next Carry on still starts with a reach when the magazine went to the floor again, never "Carry on: Bolt release" on no magazine (the review of v0.0.18)',
    fn() {
      // (the boot recruit's dice: the first seed whose replanned Carry on halts again with the magazine out of the gun)
      let hit = null, tried = 0;
      for (let seed = 1; seed <= 400 && !hit; seed++) {
        const w = lockedEmpty(drillWorld({ tier: 'recruit', seed })), { g, s, pid, gunId } = w;
        for (const a of ['magOut:drop', 'reach']) doAction(s, g.bus, { pid, gunId, action: a, force: { [a]: 'pass' } });
        if (doAction(s, g.bus, { pid, gunId, action: 'seat', force: { seat: 'disaster' } }).mishap !== 'dropMag') continue;
        s.stop.queue = ['release']; s.stop.queueOf = 'macro:reload:speed';
        const first = carryOn(s);
        tried++;
        run(g, s, 'queue');
        const b = beliefOf(s, gunId);
        if (s.stop.queue?.length && b.mag === 'out' && !handMagOf(s, pid)) hit = { seed, first, queueOf: s.stop.queueOf ?? null, again: carryOn(s), queue: [...s.stop.queue] };
      }
      assert(hit, JSON.stringify({ tried }));
      console.log(`      recruit seed ${hit.seed}: "${hit.first.label}", halted inside it with the magazine out (the queue as cut ${hit.queue.join(', ')}); the next "${hit.again?.label}"`);
      assert(hit.queueOf === 'macro:reload:speed' && hit.again && hit.again.queue[0] === 'reach' && hit.again.queue.includes('seat'), JSON.stringify({ hit }));
    },
  },
  {
    name: 'a reach that feels the magazine empty halts RELOAD, named for its purpose (stop.queueOf), and Carry on drops the empty and reaches again, never seating it',
    fn() {
      const w = lockedEmpty(drillWorld({ tier: 'private' })), { g, s, pid, gunId } = w;
      // (the magazine a reach by rule takes believed five and holding none: "It feels empty. You thought five.")
      const front = pouchesOf(s, pid).find(p => p.mags.length).mags[0];
      s.items[front].n = 0;
      run(g, s, 'macro:reload:speed');
      assert(s.stop.queueOf === 'macro:reload:speed' && s.stop.queue.join(',') === 'seat,release' && handMagOf(s, pid)?.id === front, JSON.stringify({ queueOf: s.stop.queueOf, queue: s.stop.queue, hand: handMagOf(s, pid) }));
      const c = carryOn(s);
      assert(c && c.queue[0] === 'dropMag' && c.queue.includes('reach') && c.queue.indexOf('seat') > c.queue.indexOf('reach'), JSON.stringify({ carryOn: c?.label }));
      console.log(`      ${c.label}, where the queue as cut was "${s.stop.queue.join(', ')}"`);
    },
  },
];
