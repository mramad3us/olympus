// OLYMPUS tests: the lost flow (the build sheet v0.0.28 §6 A, item 14; WEAPONS §10.6; F182): a magazine left on the line counted short at the turn-in and reported with its place; the rifle's rule on scripted states.
//
// src/sim/arms/armoury.js magsOf counts the drawn magazines back (held on the person, or missing), reportLost writes the loss with
// its place (armoury.lost, the log's record, the rounds it held); lostOf is WEAPONS §10.6's rule: an item held by nobody whose signer
// stands more than LOST_M 10 m from it and cannot see it (perception.js visibility from his eye). On the 25 m bay by day
// (tests/arms-world.mjs), a rifle signed out to the private and laid on the regolith: held, at 9 m, at 11 m facing it, at 11 m with
// his back to it: lost only the last. Reported, its record reads 'lost' and its log says so; the lockdown, the search and the bill
// are the career's (0.0.15).
import { assert } from './helpers.mjs';
import { armsWorld } from './arms-world.mjs';
import { magsOf, lostOf, reportLost, bookGun, signOut, LOST_M } from '../src/sim/arms/armoury.js';
import { move } from '../src/sim/arms/kit.js';

export default [
  {
    name: 'F182: a magazine left on the line is counted short at the turn-in ("Two magazines. You drew three.": magsOf) and reported lost with its place and its rounds, in the log; the other two counted back',
    fn() {
      const w = armsWorld(), s = w.state, left = w.magIds[1];
      s.items[left].n = 3;
      move(s, left, { ground: { area: 'melas.ground', x: w.actor.x + 0.5, z: w.actor.z } });
      w.actor.x += 60;
      const count = magsOf(s, w.pid, w.magIds), rule = lostOf(s, left, { by: w.pid });
      const e = reportLost(s, w.bus, left, { by: w.pid, where: 'the 25 m line, lane 4' }), log = s.log.at(-1);
      console.log(`      drawn ${w.magIds.length}: held ${count.held.length}, missing ${count.missing.join(', ')}; the rule ${JSON.stringify(rule)}`);
      console.log(`      reported: ${JSON.stringify(e)}; the log "${log.text}" (${log.kind}, ${log.what})`);
      assert(count.held.length === 2 && count.missing.length === 1 && count.missing[0] === left && rule.lost, JSON.stringify({ count, rule }));
      assert(e.kind === 'mag' && e.rounds === 3 && e.where === 'the 25 m line, lane 4' && s.armoury.lost.length === 1 && log.kind === 'armoury' && log.what === 'lost' && log.text === 'A magazine lost: the 25 m line, lane 4.', JSON.stringify({ e, log }));
    },
  },
  {
    name: 'F182: the rifle\'s rule (WEAPONS §10.6) on scripted states: held, not lost; on the ground 9 m from its signer, not; 11 m with him facing it, not (in sight); 11 m with his back to it, lost; reported, its record reads \'lost\' and its log says so',
    fn() {
      const w = armsWorld(), s = w.state, a = w.actor;
      bookGun(s, w.gunId, { assignedId: w.pid }); signOut(s, w.gunId, w.pid, w.coachId);
      const held = lostOf(s, w.gunId);
      // (the coach stood out of the way: his body would not hide it, but the rule reads the signer's eye alone)
      const at = (dx, face) => { move(s, w.gunId, { ground: { area: 'melas.ground', x: a.x + dx, z: a.z } }); a.face = face; return lostOf(s, w.gunId); };
      const nine = at(9, 'left'), facing = at(11, 'right'), away = at(11, 'left');
      const e = reportLost(s, w.bus, w.gunId, { by: w.pid }), rec = s.armoury.guns[w.gunId];
      console.log(`      held: ${JSON.stringify(held)}; 9 m, his back to it: ${nine.why}; 11 m facing it: ${facing.why}; 11 m, his back to it: ${away.why} (lost ${away.lost}); LOST_M ${LOST_M} m`);
      console.log(`      reported: ${JSON.stringify(e)}; the record ${rec.loc}, its log ${rec.log.map(l => l.what).join(', ')}`);
      assert(!held.lost && held.why === 'held' && !nine.lost && nine.why === 'near' && !facing.lost && facing.why === 'in sight' && away.lost && away.why === 'gone', JSON.stringify({ held, nine, facing, away }));
      assert(e.kind === 'gun' && rec.loc === 'lost' && rec.log.at(-1).what === 'lost' && e.where === 'Base Melas', JSON.stringify({ e, rec }));
    },
  },
];
