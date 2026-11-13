// OLYMPUS tests: fluid movement through the no-stop zones (the rework's R8b, 2026-11-13; the user: "soldiers clearing rooms know not to stop in a doorway. The solution to this is the same as in real life, soldiers need to stay fluidly moving").
//
// What each test pins, each failing without its part:
//   - (1) the zones are the place's data: every room plan entered by a door declares its funnel (src/sim/places/zones.js
//     zonesOf), the scene's inFunnel reads that one shape, and a zone's way out lies clear of it (exitOf); a rect zone, the
//     shape a hatch or a stairhead will declare, the same;
//   - (1) no move the game makes ends in one: every bundle planned at every door, slot and rung, and the carry a moving body is
//     given where its brake would leave it in a doorway (places/move.js throughOf), which follows the man's lane on to his
//     point of domination from rung 2 and just clear of the doorway below it, never shorter than the brake;
//   - (2) the interrupt in a doorway is a hands beat while the feet carry the body out: the private by the keys on 48213, whose
//     take-in's brake stood him in room 1's doorway 3.25 s (R5's F21 note: his #2 blocked behind him), stands there 0 s, and
//     at the pause his feet are still carrying him through; a step that stands still by the player's own choice (a shot's
//     "stop here") leaves him at rest where he stands, the only way left to stand in a door;
//   - (3) the #2 never waits in a doorway: blocked by you standing in it he holds outside (crossingClear), you on the move
//     are no block, and his own brake in a doorway carries him through (bundle.js freeBody: 2.10 s still in room 3's doorway
//     on 48213 before);
//   - a save made inside a carry, yours or your #2's, carries on byte for byte (heavy);
//   - (4) on every sheet (heavy): the game's doorway stops 0, the #2's 0, no move ending in a doorway.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot, houseKeysBot } from './bots/house.mjs';
import { flawlessLane, SHEETS } from './flawless.mjs';
import { zonesOf, zoneAt, inZone, exitOf, EXIT_M, FUNNEL_M, standsStill } from '../src/sim/places/zones.js';
import { throughOf, THROUGH_POINT_RUNG } from '../src/sim/places/move.js';
import { lanePlanOf, inFunnel } from '../src/sim/combat/room.js';
import { planBundle, crossingClear } from '../src/sim/combat/bundle.js';
import { openNavOf, clearLine } from '../src/sim/places/nav.js';
import { pathLen } from '../src/sim/combat/stepper.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { stepAct } from './bots/lib.mjs';
import { setOpening, areaOf } from '../src/sim/places/model.js';

const AREA = 'melas.wheel.s4';
const meOf = (s) => s.actors.list.find(a => a.who === s.player.id);
const end = (p) => p[p.length - 1];
// (a fresh lane at GO, its door plans)
const house = (tier = 'private', seed = 48213) => { const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }); return { g, s: g.state, lane: lanePlanOf(g.state) }; };
// (room 1's door standing open, its leaf at its stop: a closed door is no doorway (zones.js liveZoneAt))
const openDoor = (s, id = 'o:w4:r1') => setOpening(s, id, 'open', { atMs: s.clock.ms - 5000 });

export default [
  {
    name: 'the no-stop zones are the place\'s data: every room plan entered by a door declares its funnel, the scene\'s inFunnel is that zone, every other leafed door of the area has one from its own line (room 2\'s closet, the booth: the reach review of 2026-11-13), and the way out of a funnel or a rect lies EXIT_M clear of it',
    fn() {
      const { lane } = house(), Z = zonesOf(AREA), bad = [];
      const doors = lane.order.map(k => lane.plans[k]).filter(P => P.door);
      for (const P of doors) {
        const z = Z.find(x => x.door === P.door);
        if (!z || P.funnel?.id !== z.id) { bad.push(`${P.door}: no zone`); continue; }
        // (the scene's inFunnel against the zone on a 5 cm grid round the door)
        for (let dx = -1.2; dx <= 1.2; dx += 0.05) for (let dz = -1.2; dz <= 1.2; dz += 0.05) {
          const x = P.threshold[0] + dx, zz = P.threshold[1] + dz;
          if (inFunnel(P, x, zz) !== inZone(z, x, zz)) bad.push(`${P.door} at ${fmt(x, 2)},${fmt(zz, 2)}`);
        }
        // (the way out from the threshold, into the room and back out, each EXIT_M past the zone's depth)
        for (const [dir, side] of [[null, 1], [null, -1]]) {
          const e = exitOf(z, P.threshold, dir, side), d = z.into * ((z.axis === 'x' ? e[1] : e[0]) - z.at);
          if (inZone(z, e[0], e[1]) || Math.abs(Math.abs(d) - (FUNNEL_M + EXIT_M)) > 1e-9) bad.push(`${P.door} exit ${side}: ${JSON.stringify(e)}`);
        }
      }
      const rect = { id: 'hatch', kind: 'rect', rect: [0, 0, 1, 1] }, e1 = exitOf(rect, [0.5, 0.4], [1, 0]), e2 = exitOf(rect, [0.5, 0.2]);
      if (inZone(rect, ...e1) || Math.abs(e1[0] - 1 - EXIT_M) > 1e-9 || inZone(rect, ...e2) || Math.abs(e2[1] + EXIT_M) > 1e-9) bad.push(`rect ${JSON.stringify([e1, e2])}`);
      console.log(`      ${Z.length} zones on ${AREA}: ${Z.map(z => `${z.id} (${z.axis} ${z.at}, ${z.a} to ${z.b}, into ${z.into})`).join('; ')}; the standing steps ${['shot:pair@stop', 'contact:hold', 'weapon:gun-down', 'aim', 'macro:ia'].map(id => `${id} ${standsStill(id)}`).join(', ')}`);
      // (every leafed door of the area a funnel, the three with plans and the rest from their own lines)
      const leafed = (areaOf(AREA)?.openings ?? []).filter(o => o.kind === 'door').map(o => o.id), missing = leafed.filter(id => !Z.some(z => z.door === id));
      assert(doors.length === 3 && Z.length === leafed.length && leafed.length === 5 && !missing.length && !bad.length, [...bad.slice(0, 6), ...missing].join('; '));
      assert(zoneAt(AREA, ...doors[0].threshold)?.door === doors[0].door && !zoneAt(AREA, ...doors[0].points[0]), 'the threshold in, the point out');
    },
  },
  {
    name: 'no move the game plans ends in a doorway: every bundle at every door, slot and rung from the stacks and the points, and the carry a body walking in is given where its brake would leave it in one, routed clear of the walls, never shorter than the brake, to his point of domination from rung 2 and just clear below',
    fn() {
      const { s, lane } = house('tierone'), me = meOf(s), pid = s.player.id, bad = [];
      let n = 0;
      for (const k of lane.order) {
        const P = lane.plans[k];
        if (!P.door) continue;
        for (const slot of [1, 2]) for (let rung = 0; rung <= 4; rung++) for (const b of ['stack:up', 'stack:point', 'room:in', 'room:dominate', 'room:clear']) for (const from of [P.stack[slot - 1], P.points[slot - 1]]) {
          let p = null;
          try { p = planBundle(s, pid, b, { door: k, slot, rung, from }); } catch { p = null; }
          for (const beat of p?.beats ?? []) {
            if (!beat.path?.length) continue;
            n++;
            const e = end(beat.path);
            if (zoneAt(AREA, e[0], e[1])) bad.push(`${k} #${slot} r${rung} ${b} ${beat.key} → ${JSON.stringify(e)}`);
          }
        }
      }
      // (the carry: #1 walking in on room 1's lane at the Combat walk, his brake ending in the doorway; none while the door is shut)
      const P = lane.plans['o:w4:r1'], G = openNavOf(AREA, 'C0'), rows = [];
      Object.assign(me, { x: 28.88, z: 12.25, v: [0, -1.23], moveStance: 'combat', locoMs: s.clock.ms });
      if (throughOf(s, pid, me, s.clock.ms)) bad.push('a carry through a shut door');
      openDoor(s);
      for (const rung of [0, 1, 2, 4]) {
        s.people[pid].skills.drills.room.rung = rung;
        Object.assign(me, { x: 28.88, z: 12.25, v: [0, -1.23], moveStance: 'combat', locoMs: s.clock.ms });
        const t = throughOf(s, pid, me, s.clock.ms), e = t ? end(t.path) : null, stopM = 1.23 * 1.23 / (2 * 5.07);
        const clear = t ? t.path.slice(1).every((q, i) => clearLine(G, t.path[i][0], t.path[i][1], q[0], q[1])) : false;
        const toPoint = e ? Math.hypot(e[0] - P.points[0][0], e[1] - P.points[0][1]) : null;
        rows.push(`rung ${rung}: ${t ? `${fmt(pathLen(t.path), 2)} m in ${fmt((t.untilMs - t.fromMs) / 1000, 2)} s to ${JSON.stringify(e)}, ${fmt(toPoint, 2)} m off his point` : 'none'}`);
        if (!t || zoneAt(AREA, e[0], e[1]) || !clear || pathLen(t.path) < stopM || (rung >= THROUGH_POINT_RUNG ? toPoint > 1e-6 : toPoint < 0.3)) bad.push(`carry at rung ${rung}: ${JSON.stringify(t?.path)}`);
      }
      // (a body at rest is given none of its own accord, nor one walking clear of every doorway)
      Object.assign(me, { x: 28.88, z: 12.25 }); delete me.v;
      if (throughOf(s, pid, me)) bad.push('a carry from rest unasked');
      Object.assign(me, { x: 27.5, z: 10.5, v: [0, -1.23] });
      if (throughOf(s, pid, me)) bad.push('a carry clear of the doorways');
      console.log(`      ${n} planned moves, none ending in a doorway: ${!bad.some(b => !b.startsWith('carry') && !b.startsWith('a carry'))}; the carry from (28.88, 12.25) at 1.23 m/s: ${rows.join('; ')}`);
      assert(n > 100 && !bad.length, bad.slice(0, 5).join('; '));
    },
  },
  {
    name: 'the take-in in a doorway is a hands beat while the feet carry the body out: the private by the keys on 48213 stands 0 s in a doorway by the game (3.25 s in room 1 before), his feet still carrying him at the pause, and his #2 never held behind him in one',
    fn() {
      const { g, s, lane } = house('private'), pid = s.player.id, P = lane.plans['o:w4:r1'], twoPid = s.armoury.range.house.twoPid;
      let prev = null, prevTwo = null, still = 0, twoStill = 0, pauses = 0, carried = 0, pm = s.clock.ms;
      runHouse(g, houseKeysBot(), { maxMs: 10 * 60_000, each(game) {
        const st = game.state, H = st.armoury.range.house, now = st.clock.ms, dt = now - pm; pm = now;
        if (H.goAtMs === null || H.end) return;
        const me = meOf(st), two = st.actors.list.find(a => a.who === twoPid);
        if (dt > 0 && prev) {
          const v = Math.hypot(me.x - prev[0], me.z - prev[1]) / (dt / 1000), vt = Math.hypot(two.x - prevTwo[0], two.z - prevTwo[1]) / (dt / 1000);
          if (v < 0.3 && zoneAt(AREA, me.x, me.z)) still += dt;
          if (vt < 0.3 && zoneAt(AREA, two.x, two.z)) twoStill += dt;
        }
        if (dt > 0) { prev = [me.x, me.z]; prevTwo = [two.x, two.z]; }
        // (a contact's pause in or at room 1's doorway: the carry under way)
        if (st.stop?.via === 'contact' && st.stop.phase === 'choose' && dt === 0 && H.cur === 0 && (inFunnel(P, me.x, me.z) || me.through)) { pauses++; if (me.through) carried++; }
      } });
      const H = s.armoury.range.house;
      console.log(`      the lane to the card ${!!H.end}; #1 still in a doorway ${fmt(still / 1000, 2)} s, the #2 ${fmt(twoStill / 1000, 2)} s; room 1's pauses in the doorway ${pauses}, the feet carrying at ${carried}`);
      assert(H.end && still === 0 && twoStill === 0 && pauses > 0 && carried === pauses, JSON.stringify({ still, twoStill, pauses, carried }));
    },
  },
  {
    name: 'a step that stands still by the player\'s choice keeps him where he stands: the tier one by T on 48213 at his first pause in a doorway, his shot\'s feet set to "stop here", rests in the doorway with no carry; the next step that does not stand (Wait) carries him out',
    fn() {
      const { g, s } = house('tierone'), pid = s.player.id, bot = houseHonestBot();
      let found = false;
      runHouse(g, (state, me, mem) => {
        if (found) return {};
        const S = state.stop;
        if (S?.via === 'contact' && S.phase === 'choose' && S.flow?.suspended && zoneAt(AREA, me.x, me.z)) { found = true; return {}; }
        return bot(state, me, mem);
      }, { maxMs: 60_000, maxTicks: 4000 });
      assert(found, 'no pause in a doorway with the flow suspended');
      const S = s.stop, me = meOf(s);
      // (the feet's variant row turned to "stop here": Moving on, At your point, Stop here in turn)
      for (let k = 0; k < 3 && !stepsOf(s).some(r => r.kind === 'shot' && !r.off && r.way === 'stop'); k++) g.step(1, { act: [stepAct('drill:variant:feet')] });
      const row = stepsOf(s).find(r => r.kind === 'shot' && !r.off && r.way === 'stop');
      assert(row, `no "stop here" row: ${stepsOf(s).filter(r => r.kind === 'shot').map(r => `${r.id}/${r.way}`).join(', ')}`);
      g.step(1, { act: [stepAct(row.id, 'normal', row.target)] });
      for (let i = 0; i < 80 && !(s.stop?.phase === 'choose'); i++) g.step(1);
      const v = Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0), here = !!zoneAt(AREA, me.x, me.z), rested = { x: me.x, z: me.z, v, here, through: !!me.through };
      // (then a Wait: a step that does not stand, the body at rest in the doorway carried out)
      g.step(1, { act: [stepAct('wait')] });
      for (let i = 0; i < 40; i++) g.step(1);
      const out = !zoneAt(AREA, me.x, me.z);
      console.log(`      after "stop here": at (${fmt(rested.x, 2)}, ${fmt(rested.z, 2)}), ${fmt(rested.v, 2)} m/s, in the doorway ${rested.here}, a carry ${rested.through}; after a Wait out of it ${out} at (${fmt(me.x, 2)}, ${fmt(me.z, 2)})`);
      assert(rested.here && rested.v < 0.3 && !rested.through && out, JSON.stringify({ rested, out }));
    },
  },
  {
    name: 'your number two never queues in a doorway: you standing in it (or within the body gap of his way through) hold him outside at his stack, you on the move through it do not; his own brake in a doorway carries him through',
    fn() {
      const { s, lane } = house('private'), me = meOf(s), P = lane.plans['o:w4:r1'], path = P.paths[2], rows = [];
      openDoor(s);
      const at = (x, z, v = null) => { Object.assign(me, { x, z }); if (v) me.v = v; else delete me.v; return crossingClear(s, path, path[0]); };
      const cases = [['in the doorway, still', at(28.88, 11.7), false], ['on his lane past the door, still', at(29.42, 11.4), false], ['in the doorway, walking in', at(28.88, 11.7, [0, -1.23]), true], ['at your point', at(27.5, 11.5), true], ['on your stack (his way to the door passes it: you go first)', at(29.95, 12.45), false]];
      for (const [k, got, want] of cases) rows.push(`${k}: clear ${got} (want ${want})`);
      // (his own brake in the doorway: given his carry through, to his point from rung 2's lane, clear of it)
      const two = s.actors.list.find(a => a.who === s.armoury.range.house.twoPid);
      Object.assign(two, { x: 29.12, z: 12.1, v: [0, -1.23], moveStance: 'combat', locoMs: s.clock.ms });
      Object.assign(me, { x: 27.5, z: 11.5 }); delete me.v;
      const t = throughOf(s, two.who, two, s.clock.ms), e = t ? end(t.path) : null;
      rows.push(`his carry from (29.12, 12.1): ${t ? `to ${JSON.stringify(e)}` : 'none'}`);
      console.log(`      ${rows.join('; ')}`);
      assert(cases.every(([, got, want]) => got === want) && t && !zoneAt(AREA, e[0], e[1]), rows.join('; '));
    },
  },
  {
    name: 'a save made while the feet carry a body through a doorway (yours by the keys on 48213, the private; your #2\'s) loads and carries on to the card byte for byte (actor.through is plain data on the actor)',
    heavy: true,
    timeoutMs: 120_000,
    fn() {
      const { g, s } = house('private'), bot = houseKeysBot(), twoPid = s.armoury.range.house.twoPid, saves = [], digests = [];
      let tick = 0;
      while (!s.armoury.range.end && tick < 20_000) {
        const me = meOf(s), two = s.actors.list.find(a => a.who === twoPid);
        if (me.through && saves.filter(x => x.who === 'me').length < 2) saves.push({ who: 'me', tick, json: g.save() });
        if (two?.through && saves.filter(x => x.who === 'two').length < 2) saves.push({ who: 'two', tick, json: g.save() });
        g.step(1, bot); g.clearFacts(); tick++;
        if (tick % 20 === 0) digests[tick] = g.digest();
      }
      const last = g.digest(), bad = [];
      for (const sv of saves) {
        const twin = createGame({ scenario: 'test-shoothouse', seed: 48213 });
        twin.load(sv.json);
        const b = houseKeysBot();
        let k = sv.tick;
        while (k < tick) { twin.step(1, b); twin.clearFacts(); k++; if (k % 20 === 0 && digests[k] !== undefined && twin.digest() !== digests[k]) { bad.push(`${sv.who} at ${sv.tick} parted at ${k}`); break; } }
        if (!bad.length && twin.digest() !== last) bad.push(`${sv.who} at ${sv.tick} parted at the end`);
      }
      console.log(`      ${saves.length} saves inside a carry (${saves.map(x => `${x.who} at tick ${x.tick}`).join(', ')}), ${tick} ticks to the card: ${bad.length ? bad.join('; ') : 'every one byte for byte'}`);
      assert(saves.some(x => x.who === 'me') && saves.some(x => x.who === 'two') && !bad.length, JSON.stringify({ saves: saves.map(x => [x.who, x.tick]), bad }));
    },
  },
  {
    name: 'on every sheet, the boot recruit to the tier one (the recruit and the private by the keys, the corporal up by T), the game never stands #1 or his #2 in a doorway and gives no move that ends in one (the rework\'s R8b: 100 seeds a sheet in house-flawless and house-flawless-keys)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const rows = [], bad = [];
      for (const tier of SHEETS) for (const seed of [48213, 1489397426, 2295]) {
        const r = flawlessLane({ tier, seed, bot: tier === 'recruit' || tier === 'private' ? 'keys' : 'honest' });
        const ms = r.door.stopMs.reduce((a, b) => a + b, 0);
        rows.push(`${tier} ${seed} ${r.bot}: ${fmt(r.laneS, 1)} s, the game's ${ms} ms, the #2's ${r.door.twoMs} ms, moves into one ${r.door.endsIn}, chosen ${r.door.chosenMs} ms, funnel faults ${r.door.faults}`);
        if (ms || r.door.twoMs || r.door.endsIn || r.door.faults || !r.done) bad.push(rows.at(-1));
      }
      for (const x of rows) console.log(`      ${x}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
];
