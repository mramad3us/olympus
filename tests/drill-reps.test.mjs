// OLYMPUS tests: a clean room counted for the career (the build sheet v0.0.21 §1 item 24; COMBAT §25.3.2; done lens D10).
//
// skills/drills.js drillRep(state, pid, family, { clean, teacher, field }) moves a sheet's drill rung by clean repetitions:
// REPS_PRACTISED 20 to rung 2, REPS_DRILLED 60 to rung 3, each teacher to its reach (the unit's 2, the cadre's 3), field
// repetitions × FIELD_REP_K 2 at most FIELD_REPS_SOL 5 a sol; a test sheet never moves. The judge of a clean room is the shoot
// house's (shoothouse.js cleanRoomOf), the one the run sheet's "clean rooms" line reads. Before v0.0.21 nothing counted (the
// paper said "a career would count them"; done.md J6): every case fails without drillRep, and the last without cleanRoomOf.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot } from './bots/house.mjs';
import { drillRep, REPS_PRACTISED, REPS_DRILLED, FIELD_REP_K, FIELD_REPS_SOL, TEACHER_UP_TO } from '../src/sim/skills/drills.js';
import { rungOf, drillsOf, testSheet } from '../src/sim/skills/templates.js';
import { cleanRoomOf, runSheetOf, houseOf } from '../src/sim/scenarios/shoothouse.js';
import { SOL_MS } from '../src/core/clock.js';

// (a career's private: the barracks' player with a sheet as a career writes it, the test private's numbers but not fixed (the
// roster rolls no sheet yet: a person with none counts nothing), rung 1 in rooms)
const career = () => { const g = createGame({ scenario: 'barracks', seed: 48213 }), pid = g.state.player.id, t = testSheet('private'); g.state.people[pid].skills = { ...t, inoc: { ...t.inoc, fixed: false } }; return { g, s: g.state, pid }; };
// (n repetitions, the rung after each that moved it: "2 at 20, 3 at 60")
function reps(s, pid, n, opts) { const moved = []; let r = rungOf(s, pid, 'room'); for (let i = 1; i <= n; i++) { const q = drillRep(s, pid, 'room', opts); if (q !== r) moved.push(`${q} at ${i}`); r = q; } return { rung: r, moved }; }

export default [
  {
    name: 'a career\'s private reaches practised (rung 2) after REPS_PRACTISED 20 clean rooms with the shoot house\'s cadre and drilled (rung 3) after REPS_DRILLED 60; the unit\'s teacher stops at 2 (COMBAT §25.3.2; fails without drillRep: nothing counted)',
    fn() {
      const a = career(), r0 = rungOf(a.s, a.pid, 'room'), cadre = reps(a.s, a.pid, 70, { clean: true, teacher: 'cadre' });
      const b = career(), unit = reps(b.s, b.pid, 70, { clean: true, teacher: 'unit' });
      console.log(`      the private at rung ${r0} (fixed ${!!a.s.people[a.pid].skills?.inoc?.fixed}): the cadre ${cadre.moved.join(', ')} (reps ${drillsOf(a.s, a.pid)?.reps}); the unit ${unit.moved.join(', ') || 'none'}, rung ${unit.rung} after 70 (its reach ${TEACHER_UP_TO.unit})`);
      assert(r0 === 1 && cadre.moved.join() === `2 at ${REPS_PRACTISED},3 at ${REPS_DRILLED}` && unit.moved.join() === `2 at ${REPS_PRACTISED}` && unit.rung === 2, JSON.stringify({ r0, cadre, unit }));
    },
  },
  {
    name: 'a room with a fault called is no repetition, field repetitions count FIELD_REP_K 2 each at most FIELD_REPS_SOL 5 a sol and teach to 3, and a rung never goes down',
    fn() {
      const a = career(), dirty = reps(a.s, a.pid, 30, { clean: false, teacher: 'cadre' });
      const b = career(), day1 = reps(b.s, b.pid, 8, { clean: true, field: true }), n1 = drillsOf(b.s, b.pid)?.reps;
      b.s.clock.ms += SOL_MS;
      const day2 = reps(b.s, b.pid, 8, { clean: true, field: true }), n2 = drillsOf(b.s, b.pid)?.reps;
      const c = career(); c.s.people[c.pid].skills.drills = { room: { rung: 3, reps: 0 }, passage: { rung: 1 } }; const kept = reps(c.s, c.pid, 5, { clean: true, teacher: 'unit' });
      console.log(`      30 faulted rooms: rung ${dirty.rung}, reps ${drillsOf(a.s, a.pid)?.reps ?? 0}; 8 field rooms a sol: ${n1} reps on the first sol, ${n2} after the second (${2 * FIELD_REPS_SOL * FIELD_REP_K} at most), rung ${day2.rung} (${[...day1.moved, ...day2.moved].join(', ') || 'unmoved'}); a drilled sergeant's 5 unit rooms: rung ${kept.rung}`);
      assert(dirty.rung === 1 && !(drillsOf(a.s, a.pid)?.reps) && n1 === FIELD_REPS_SOL * FIELD_REP_K && n2 === 2 * FIELD_REPS_SOL * FIELD_REP_K && day2.rung === 2 && kept.rung === 3, JSON.stringify({ dirty, n1, n2, day2, kept }));
    },
  },
  {
    name: 'a test sheet never moves: the shoot house\'s private on 48213, eighty clean rooms counted on his sheet with the ITC, keeps rung 1 and writes nothing (ROADMAP §2.1, scenes never write a career)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go' }), s = g.state, pid = s.player.id;
      const before = JSON.stringify(s.people[pid].skills.drills), r = reps(s, pid, 80, { clean: true, teacher: 'itc' });
      console.log(`      the private's test sheet after 80 clean rooms with the ITC: rung ${r.rung}, drills ${JSON.stringify(s.people[pid].skills.drills)} (before ${before})`);
      assert(r.rung === 1 && JSON.stringify(s.people[pid].skills.drills) === before, JSON.stringify({ r, before }));
    },
  },
  {
    name: 'the house\'s clean rooms read the same judge: the run sheet\'s "clean rooms" are the legs cleanRoomOf calls clean, and a funnel fault on a clean room takes it off the paper and off the count',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), s = g.state;
      assert(runHouse(g, houseHonestBot()).done, 'the lane to its card');
      const H = houseOf(s), legs = [...H.rooms, H.hall], judged = legs.map((L, k) => cleanRoomOf(s, k)), paper = runSheetOf(s).practised;
      const k = judged.indexOf(true);
      assert(k >= 0, JSON.stringify({ judged }));
      legs[k].faults.push({ kind: 'funnel', atMs: s.clock.ms });
      const after = runSheetOf(s).practised, a = career(), counted = drillRep(a.s, a.pid, 'room', { clean: cleanRoomOf(s, k), teacher: 'cadre' });
      console.log(`      the tier one's legs ${legs.map(L => `${L.door} ${L.state}`).join(', ')}: clean ${judged.join(', ')}; the paper ${paper.clean} of ${paper.rooms} ("${paper.words}"); room ${k + 1} with a funnel fault: the paper ${after.clean}, counted ${drillsOf(a.s, a.pid)?.reps ?? 0}`);
      assert(paper.clean === judged.filter(Boolean).length && after.clean === paper.clean - 1 && !cleanRoomOf(s, k) && !(drillsOf(a.s, a.pid)?.reps) && counted === 1 && !cleanRoomOf(s, 3), JSON.stringify({ judged, paper, after }));
    },
  },
];
