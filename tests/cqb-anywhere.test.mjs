// OLYMPUS tests: the drill and the breach off the range session (the build sheet v0.0.21 §1 item 21, §6 D; the done lens's J1 and J2; F72).
//
// tests/cqb-world.mjs takes the shoot house at GO and hands it off the range: no range session, an operation open on house 1's
// area (src/sim/combat/op.js openOp: state.cqb). Before v0.0.21 nothing could open one, and a record put there by hand threw
// in the instinct's read of the house's record (skills/instinct/cqb.js know: "Cannot read properties of undefined (reading
// 'house')") on the first tick T was asked; the done lens's "0.00 m in 400 ticks" was its probe's own misreading (it measured
// the player's actor against itself; with the session merely gone the player's walk ran, 6.60 m, and the #2 stood, nobody
// driving him). A breach off the range had nowhere to write: the burst's door (burst.js) and the kick's lock (bundle.js
// lockedOf) read and wrote the house's R.house.broken only. Each case fails without its fix: the imports alone (openOp,
// opActors, opRules, opShot) are v0.0.21's.
// v0.0.25's stage 0 (its build sheet §2 step 3, C5): F72's barracks lines leave out the void's two rules, 'anchor' and 'aft', which
// an operation at 0 G or under a burn says (the last case; it fails on v0.0.24's set, which held 'anchor').
import { assert } from './helpers.mjs';
import { cqbWorld } from './cqb-world.mjs';
import { opLane, rowsRun, opGauge, OP_ENFORCED, BARRACKS_LINES, VOID_LINES } from './flawless-op.mjs';
import { BASE_RULES } from '../src/sim/skills/instinct/base.js';
import { GROOM_RULES } from '../src/sim/skills/instinct/groom.js';
import { createGame } from './game.mjs';
import { stepsOf, chooseStep } from '../src/sim/arms/shooting.js';
import { moveTo } from '../src/sim/places/portals.js';
import { lockedOf } from '../src/sim/combat/bundle.js';
import { openingDelta, openingState, setOpening } from '../src/sim/places/model.js';
import { openOp, closeOp, opOf, brokenOf, hostOf, sessionOf } from '../src/sim/combat/op.js';
import { OP_STOP_TORSO, OP_STOP_HEAD, OP_SENSOR_MS } from '../src/sim/combat/two.js';
import { STOP_TORSO, STOP_HEAD, SENSOR_MS } from '../src/sim/scenarios/shoothouse.js';
import { opTBot } from './flawless-op.mjs';

const CLOSET = 'o:w4:closet';

export default [
  {
    name: 'off the range session the sergeant\'s T clears the house to every leg clear, F1, F2, F7, F26 and F47 held through the gauges\' library (before v0.0.21 an operation open off the range threw on T\'s first read)',
    fn() {
      const l = opLane({ tier: 'sgt', seed: 48213 }), W = l.watch;
      console.log(`      the sergeant on 48213 off the range: ${l.done ? 'every leg clear' : 'NOT DONE'} in ${(l.ms / 1000).toFixed(2)} s [${l.legs.join(', ')}]; T ${l.mem.T}, shots named ${l.mem.shots}, waits ${l.mem.waits}, dead ends ${JSON.stringify(l.mem.dead)}`);
      console.log(`      F1 worst ${(W.walls.worstM * 100).toFixed(2)} cm, ${W.walls.over} body-ticks over; F2 least ${W.bodies.minM.toFixed(3)} m, ${W.bodies.underMs} ms under; F7 ${W.corners.clears} clears, ${W.corners.uncovered} uncovered (by ${JSON.stringify(W.corners.by)}); F26 you ${W.swings.me} ms, him ${W.swings.two} ms (${W.swings.swings} leaves swung); F47 ${W.lines.shots} rounds, ${W.lines.masked.length} through the other`);
      assert(l.done && !l.err, JSON.stringify({ legs: l.legs, err: l.err, ms: l.ms }));
      assert(W.walls.over === 0 && W.bodies.minM >= 0.5 && W.bodies.underMs === 0 && W.corners.clears === 4 && W.corners.uncovered === 0 && W.swings.me === 0 && W.swings.two === 0 && W.lines.shots > 0 && !W.lines.masked.length, JSON.stringify(W));
      assert(!Object.keys(l.mem.dead).length, JSON.stringify(l.mem.dead));
    },
  },
  {
    name: 'a kick on the locked closet off the range breaks its lock on the opening\'s own delta: lockedOf false, and still false with the closet shut again (DC 14; the house wrote R.house.broken only)',
    fn() {
      const w = cqbWorld({ tier: 'sgt' }), s = w.s;
      // (room 1 behind you, room 2's door open, you inside room 2 by the closet's east wall)
      s.cqb.rooms[0].state = 'clear'; s.cqb.cur = 1; setOpening(s, 'o:w4:r2', 'open');
      moveTo(s, w.g.me().id, { area: s.cqb.area, x: 24.6, z: 16.9, face: 'right' }, null, { why: 'test' });
      w.g.me().headRad = 0;
      const was = lockedOf(s, CLOSET);
      let tries = 0, atMs = null;
      while (openingState(s, CLOSET) !== 'open' && tries < 12) {
        const r = stepsOf(s).find(x => x.id === `door:kick>${CLOSET}`);
        assert(r && !r.off, JSON.stringify({ kick: r ?? null, rows: stepsOf(s).map(x => x.id) }));
        atMs = s.clock.ms; tries++;
        w.g.step(1, { act: [{ act: 'stop', args: { step: r.id } }] });
        for (let i = 0; i < 80 && s.stop?.phase !== 'choose'; i++) w.g.step(1, {});
      }
      const d = openingDelta(s, CLOSET), broken = brokenOf(s, CLOSET);
      setOpening(s, CLOSET, 'closed');
      const shut = openingDelta(s, CLOSET);
      console.log(`      the closet: locked ${was} before; kicked in ${tries} tr${tries === 1 ? 'y' : 'ies'}; its delta ${JSON.stringify(d)}; brokenOf ${broken}; shut again ${JSON.stringify(shut)}, locked ${lockedOf(s, CLOSET)}; a range session made: ${!!s.armoury.range}`);
      assert(was === true, 'the closet locked at the start');
      assert(d?.state === 'open' && Number.isFinite(d.broken) && broken === d.broken && broken >= atMs - 1, JSON.stringify({ d, broken, atMs }));
      assert(shut?.state === 'closed' && shut.broken === broken && lockedOf(s, CLOSET) === false, JSON.stringify(shut));
      assert(!s.armoury.range, 'no range session made by the kick');
    },
  },
  {
    name: 'an SC-1 on room 1\'s door (a push) off the range runs to its burst: the door blown, its lock broken on the delta, the burst on the operation\'s record, no range session made (burst.js read the house only)',
    fn() {
      const w = cqbWorld({ tier: 'sgt', loadout: 'breach' }), s = w.s, g = w.g;
      for (let i = 0; i < 4 && !stepsOf(s).some(r => r.id.startsWith('drill:room:clear@charge')); i++) chooseStep(s, g.bus, { step: 'drill:variant:breach' });
      const row = stepsOf(s).find(r => r.id.startsWith('drill:room:clear@charge'));
      assert(row && !row.off, JSON.stringify(row ?? stepsOf(s).map(r => r.id)));
      g.step(1, { act: [{ act: 'stop', args: { step: row.id } }] });
      const bot = opTBot(), t0 = s.clock.ms;
      let burstAt = null;
      for (let i = 0; i < 2000 && burstAt === null; i++) { g.step(1, bot); if (s.cqb.bursts.length) burstAt = s.clock.ms; }
      const B = s.cqb.bursts[0], d = openingDelta(s, 'o:w4:r1');
      console.log(`      ${row.id}: the burst ${burstAt === null ? 'never' : `${((burstAt - t0) / 1000).toFixed(2)} s after the press`} (${B?.model}, door ${B?.door ?? '-'}, room ${B?.room ?? '-'}); the door ${openingState(s, 'o:w4:r1')}, its delta ${JSON.stringify(d)}; said ${g.facts('say').filter(f => f.who === w.pid).map(f => f.text).slice(0, 4).join(' | ')}`);
      assert(B?.model === 'sc1' && B.door === 'o:w4:r1' && openingState(s, 'o:w4:r1') === 'open' && Number.isFinite(d?.broken) && brokenOf(s, 'o:w4:r1') === d.broken, JSON.stringify({ B, d }));
      assert(!s.armoury.range, 'no range session made by the burst');
    },
  },
  {
    name: 'every drill row offered at the stack off the range, pressed, moves a beat within 1 s (or its variant): none offered that does nothing',
    fn() {
      const r = rowsRun(cqbWorld({ tier: 'sgt' })), a = rowsRun(cqbWorld({ tier: 'private', seed: 1489397426 }));
      for (const [who, x] of [['the sergeant', r], ['the private', a]]) console.log(`      ${who}: ${x.rows.length} rows pressed (${x.rows.map(y => `${y.id}${y.ran ? '' : ' DEAD'}`).join(', ')})`);
      assert(r.rows.length >= 5 && a.rows.length >= 3 && !r.dead.length && !a.dead.length, JSON.stringify({ r: r.dead, a: a.dead }));
    },
  },
  {
    name: 'the operation off the range: openOp refused on a range session (the lane\'s record is the house\'s), state.cqb read by opOf and sessionOf, closeOp removes it, the turners\' sensor the house\'s',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state;
      const refused = openOp(s, { area: s.places.live.area });
      const w = cqbWorld({ tier: 'sgt' });
      const rec = opOf(w.s), view = sessionOf(w.s), host = hostOf(w.s);
      console.log(`      on the lane openOp ${refused === null ? 'refused' : 'MADE'}, state.cqb ${'cqb' in s ? 'WRITTEN' : 'absent'}; off it opOf is state.cqb ${rec === w.s.cqb}, sessionOf's turners ${view.turners.length}, the host's houseOf the record ${host.houseOf(w.s) === w.s.cqb}; the sensor ${OP_STOP_TORSO}/${OP_STOP_HEAD}/${OP_SENSOR_MS} against the house's ${STOP_TORSO}/${STOP_HEAD}/${SENSOR_MS}`);
      assert(refused === null && !('cqb' in s), 'no operation on a range session');
      assert(rec === w.s.cqb && view.house === w.s.cqb && host.houseOf(w.s) === w.s.cqb, 'off the range the operation is state.cqb');
      assert(OP_STOP_TORSO === STOP_TORSO && OP_STOP_HEAD === STOP_HEAD && OP_SENSOR_MS === SENSOR_MS, 'the sensor is the house\'s');
      closeOp(w.s);
      assert(!('cqb' in w.s) && opOf(w.s) === null, 'closeOp removes the record');
    },
  },
  {
    name: 'F72: the drill, the team and the breach off the range on six operations (three by T on the set, the sergeant by T on the house drawn from 48213; the private and the boot recruit by T and the keys the DI\'s walk line names) and two stacks\' rows, no barracks\' line and none without words (enforced; the review of 2026-11-16: the private by T stood at room 1 for good under "Nothing on fire.", and an operation on a drawn house went by the set\'s plans, every leg ahead)',
    fn() {
      const lanes = [['sgt', 48213], ['tierone', 48213], ['cpl', 1489397426], ['sgt', 48213, false, 'drawn'], ['private', 48213, true], ['recruit', 48213, true]].map(([tier, seed, keys, draw]) => opLane({ tier, seed, keys, draw }));
      for (const l of lanes.filter(x => x.draw)) console.log(`      ${l.tier} ${l.seed} by T on the drawn house (${l.area}): ${l.done ? 'every leg clear' : 'NOT DONE'} in ${(l.ms / 1000).toFixed(2)} s [${l.legs.join(', ')}]; T ${l.mem.T}, dead ends ${JSON.stringify(l.mem.dead)}`);
      for (const l of lanes.filter(x => x.keys)) console.log(`      ${l.tier} ${l.seed} by T and the keys: ${l.done ? 'every leg clear' : 'NOT DONE'} in ${(l.ms / 1000).toFixed(2)} s [${l.legs.join(', ')}]; T ${l.mem.T}, walked ${l.mem.walked ?? 0} ticks, waits ${l.mem.waits}, dead ends ${JSON.stringify(l.mem.dead)}`);
      const row = opGauge(lanes, [rowsRun(cqbWorld({ tier: 'sgt' }))]);
      console.log(`      ${row.id} ${row.met ? 'MET ' : 'OPEN'} ${row.name}: ${row.value} (target ${row.target})${OP_ENFORCED.has(row.id) ? ' [enforced]' : ''}`);
      assert(!OP_ENFORCED.has(row.id) || row.met, row.value);
    },
  },
  {
    name: 'F72\'s barracks lines (v0.0.25\'s stage 0, C5): every BASE_RULES and GROOM_RULES id but the void\'s, \'anchor\' (v0.0.24 A\'s "Anchor before you fire.") and \'aft\' (the Wreck\'s "Feet aft", reserved before its rule exists), so an operation at 0 G or under a burn counts neither as a barracks line',
    fn() {
      const ids = [...BASE_RULES, ...GROOM_RULES].map(r => r.id), kept = ids.filter(id => !VOID_LINES.has(id));
      console.log(`      ${BARRACKS_LINES.size} barracks lines of ${ids.length} rule ids; left out: ${ids.filter(id => VOID_LINES.has(id)).join(', ') || 'none'} (reserved: ${[...VOID_LINES].filter(id => !ids.includes(id)).join(', ') || 'none'})`);
      assert(!BARRACKS_LINES.has('anchor') && !BARRACKS_LINES.has('aft') && ids.includes('anchor'), JSON.stringify({ anchor: BARRACKS_LINES.has('anchor'), aft: BARRACKS_LINES.has('aft') }));
      assert(kept.length === BARRACKS_LINES.size && kept.every(id => BARRACKS_LINES.has(id)), JSON.stringify({ kept: kept.length, size: BARRACKS_LINES.size }));
    },
  },
];
