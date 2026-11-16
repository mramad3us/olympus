// OLYMPUS tests: the R-7's ballistic breach (src/sim/combat/ballistic.js; kit2 §2.6, §6 tests 20 to 25; the build sheet 0.0.19 §0 items 16, 22, §6): 45 degrees down and in at a pass, a flat round on into the room, the rounds from the magazine, never a miss on the paper, the hand-back after four, where it is offered.
//
// The closet cases are the private inside room 2 by the closet (setup 'room:2', as house-breach's halligan case), on a breaching
// loadout; the seeds are pinned by a scratch search on this tree (the dummy at the third round on 9; four rounds not giving on
// 7; the flat round through room 2's top hinge on shot id sh1 of seed 48213).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { shootPlanOf, pitchOf, defeatOf, strikeLine, BALLISTIC_MAX_ROUNDS, DEFEAT_P } from '../src/sim/combat/ballistic.js';
import { planOf, HANDBACK_WORDS } from '../src/sim/combat/bundle.js';
import { houseShot, runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { stream } from '../src/core/rng.js';
import { playerActor } from '../src/core/ids.js';
import { openingState } from '../src/sim/places/model.js';
import { NOT_LOCKED } from '../src/sim/combat/breach.js';
import { turnAway } from '../src/sim/arms/turners.js';

const D2R = Math.PI / 180;
/** The seeds the cases stand on (see the header). */
export const DUMMY_SEED = 9, WONT_SEED = 7, FLAT_SHOT = 'sh1';
const choose = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex;
// (the private by the closet in room 2, his shot row pressed, the clock run until the panel is his again)
// (room 2's men put down first, as a room cleared before its closet is: the rounds go one a tick at their own times (bundle.js
// shootDoor), so a man of the room left up would turn between them and hand the press back at a contact)
function atCloset(seed, loadout = 'breach') {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'private', setup: 'room:2', loadout }), s = g.state, me = playerActor(s);
  for (const T of s.armoury.range.turners.filter(t => t.room === 'w4.r2')) { T.stoppedAtMs = s.clock.ms; turnAway(T, s.clock.ms); }
  me.x = 24.6; me.z = 16.6; g.step(1);
  return g;
}
function shoot(g) {
  const s = g.state, row = stepsOf(s).find(x => x.id === 'door:shoot>o:w4:closet');
  g.step(1, { act: [stepAct(row.id)] });
  for (let i = 0; i < 400; i++) { if (choose(s) && i > 2) break; g.step(1); }
  return row;
}
// (a door's points and its line's yaw from its stack side)
function lineOf(s, door, from = null) {
  const P = planOf(s, door) ?? { ...planOf(s, 'o:w4:r2'), door }, me = playerActor(s);
  if (!from) { me.x = P.stack[0][0]; me.z = P.stack[0][1]; } else { me.x = 24.6; me.z = 16.6; }
  const sp = shootPlanOf(s, s.player.id, { ...P, door }, { from });
  const yaw0 = Math.atan2(sp.into[1], sp.into[0]), inb = Math.atan2(sp.inward[1], sp.inward[0]);
  return { sp, yaw: yaw0 + Math.sign(Math.sin(inb - yaw0)) * 45 * D2R };
}

export default [
  {
    name: 'Shoot the lock at a pass holds 45 degrees down and in: rounds that pass the leaf reach the floor within 1.2 m of the lock, and no stand of the house is ever struck at a pass over 2,000 seeded rounds on every lane door and the closet',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'breach' }), s = g.state, out = [];
      for (const [door, from] of [['o:w4:r1', null], ['o:w4:r2', null], ['o:w4:r3', null], ['o:w4:closet', 'w4.r2']]) {
        const { sp, yaw } = lineOf(s, door, from);
        let struck = 0, floorMax = 0;
        for (let i = 0; i < 2000; i++) for (const pt of sp.points) {
          const p = pitchOf('pass', stream(s.meta.seed, 'house:ball', `t${i}`));
          const L = strikeLine(s, { from: [pt.x, pt.yM, pt.z], yawRad: yaw, pitchRad: p * D2R, door });
          if (L.struck) struck++;
          if (pt.key === 'lock') floorMax = Math.max(floorMax, L.floorM ?? 0);
        }
        out.push({ door, how: sp.how, points: sp.points.length, struck, floorMax });
      }
      console.log(`      ${out.map(o => `${o.door} (${o.how}, ${o.points} points): struck ${o.struck} of ${2000 * o.points}${o.how === 'lock' ? `, the floor within ${fmt(o.floorMax, 2)} m` : ''}`).join('; ')}`);
      assert(out.every(o => o.struck === 0) && out.filter(o => o.how === 'lock').every(o => o.floorMax <= 1.2), JSON.stringify(out));
    },
  },
  {
    name: 'a flat round runs on into the room and strikes what stands in its line: room 2\'s top hinge at the bad grade (shot sh1 of seed 48213, 8.33 degrees) strikes 2a, the armoured man, and not 2b',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'breach' }), s = g.state;
      const { sp, yaw } = lineOf(s, 'o:w4:r2'), h1 = sp.points.find(p => p.key === 'h1');
      const p = pitchOf('bad', stream(48213, 'house:ball', FLAT_SHOT)), L = strikeLine(s, { from: [h1.x, h1.yM, h1.z], yawRad: yaw, pitchRad: p * D2R, door: 'o:w4:r2' });
      const pass = strikeLine(s, { from: [h1.x, h1.yM, h1.z], yawRad: yaw, pitchRad: 45 * D2R, door: 'o:w4:r2' });
      console.log(`      h1 at ${h1.x}, ${h1.yM}, ${h1.z}, the line ${fmt(yaw / D2R, 1)} degrees; at ${p} degrees down: struck ${L.struck?.stand} at ${L.along} m, the floor at ${L.floorM} m; at 45: struck ${pass.struck?.stand ?? 'nobody'}, the floor at ${pass.floorM} m`);
      assert(L.struck?.stand === '2a' && !pass.struck && pass.floorM === 1.75, JSON.stringify({ L: { s: L.struck?.stand, along: L.along }, pass }));
    },
  },
  {
    name: 'the breach\'s rounds come from the magazine: the dummy at the lock is a click, the drill handed back to the gun, IMMEDIATE ACTION offered, the dummy\'s record the instructor\'s (fails if the beat bypasses shot.js resolveShot)',
    fn() {
      const g = atCloset(DUMMY_SEED), s = g.state, gun = s.items[s.people[s.player.id].kit.worn.sling], n0 = s.items[gun.mag].n;
      shoot(g);
      const H = s.armoury.range.house, rows = stepsOf(s).filter(r => !r.off).map(r => r.id);
      console.log(`      seed ${DUMMY_SEED}: the magazine ${n0} → ${s.items[gun.mag].n}; the breach ${JSON.stringify(H.breach['o:w4:closet'])}; the dummy ${JSON.stringify(H.dummy)}; the stoppage ${JSON.stringify(s.armoury.range.stoppage)}; IMMEDIATE ACTION ${rows.includes('macro:ia') ? 'offered' : 'NOT offered'}`);
      assert(H.dummy.clickAtMs !== null && s.armoury.range.stoppage?.kind === 'dud' && s.items[gun.mag].n < n0 && rows.includes('macro:ia'), JSON.stringify({ d: H.dummy, st: s.armoury.range.stoppage, rows }));
    },
  },
  {
    name: 'breach rounds are never counted as misses on the run sheet, nor as a stand\'s marks: their row is "shoot:door" (fails without shoothouse.js houseShot\'s guard: a round handed to it would be a MISS)',
    fn() {
      const g = atCloset(3), s = g.state, H = s.armoury.range.house;
      shoot(g);
      const L = H.rooms[1], rows = s.armoury.range.shots.filter(x => x.row === 'shoot:door');
      // (a breach round handed to houseShot itself, as any recorder might: routed to the breach's record)
      const before = JSON.stringify(L.zones);
      houseShot(s, null, { id: 'shX', who: s.player.id, fired: true, atMs: s.clock.ms, target: null, row: { id: 'shoot:door' }, door: 'o:w4:closet', roll: { grade: 'pass' }, breach: { pitchDeg: 45, defeated: false, through: false, struck: null } });
      const words = runSheetOf(s).rows.find(r => r.room === 'w4.r2')?.words ?? '';
      console.log(`      ${rows.length + 1} breach rounds recorded (${rows.map(x => `${x.id} ${x.grade}`).join(', ')}, and one by houseShot); room 2's zones ${before} → ${JSON.stringify(L.zones)}; its row: ${words}`);
      assert(rows.length >= 1 && !L.zones.miss && JSON.stringify(L.zones) === before && !/MISS/.test(words) && s.armoury.range.shots.at(-1).row === 'shoot:door', JSON.stringify({ zones: L.zones, words }));
    },
  },
  {
    name: `a point not defeated in ${BALLISTIC_MAX_ROUNDS} rounds hands back "It won't give." with Again (Shoot the lock), Pry it and Kick it live (seed 7), never a dead end`,
    fn() {
      const g = atCloset(WONT_SEED), s = g.state;
      shoot(g);
      const b = s.armoury.range.house.breach['o:w4:closet'], rows = stepsOf(s).filter(r => /closet/.test(r.id)).map(r => `${r.id}${r.off ? ` (${r.off})` : ''}`);
      console.log(`      seed ${WONT_SEED}: ${JSON.stringify(b)}; handed back "${s.stop?.carry?.words}" (${s.stop?.carry?.why}); the closet's rows: ${rows.join(', ')}; the odds a round (the private's pass) ${DEFEAT_P.lock.pass}`);
      assert(b.rounds === BALLISTIC_MAX_ROUNDS && b.points.lock === 0 && s.stop?.carry?.words === HANDBACK_WORDS.wontGive && ['door:shoot>o:w4:closet', 'door:pry>o:w4:closet', 'door:kick>o:w4:closet'].every(id => rows.includes(id)) && openingState(s, 'o:w4:closet') !== 'open', JSON.stringify({ b, rows }));
    },
  },
  {
    name: 'on an unlocked door Shoot the lock is struck "not locked"; on the closet it is live on a breaching lane; on the standard lane it is not offered at all (the build sheet 0.0.19 §0 item 16: BALLISTIC_LANES)',
    fn() {
      const lane = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go', loadout: 'breach' }), s = lane.state, me = playerActor(s), P = planOf(s, 'o:w4:r1');
      me.x = P.stack[0][0]; me.z = P.stack[0][1]; lane.step(1);
      const r1 = stepsOf(s).find(r => /^drill:door:shoot/.test(r.id));
      const br = atCloset(3).state, std = atCloset(3, 'standard').state;
      const cl = stepsOf(br).find(r => r.id === 'door:shoot>o:w4:closet'), cs = stepsOf(std).filter(r => /shoot/.test(r.id));
      console.log(`      room 1's door on the breach lane: ${r1?.label} (${r1?.off}); the closet on the breach lane: ${cl?.label} ${cl?.off ? `(${cl.off})` : 'live'}, ${fmt((cl?.ms ?? 0) / 1000, 2)} s; on the standard lane: ${cs.length} rows`);
      assert(r1?.off === NOT_LOCKED && cl && !cl.off && !cs.length, JSON.stringify({ r1, cl, cs }));
    },
  },
  // (the review of v0.0.19's K, finding 7: a press fired all its rounds in the tick it began, stamped −50, +283 and +616 ms
  // against that tick's clock, so the sound clamped them together and their strikes landed at future times)
  {
    name: 'a breach press fires one round a tick at its own time: seed 7\'s four rounds at the closet reach the record on four ticks, none stamped ahead of the clock, a round\'s time apart (the review of v0.0.19\'s K: three on one tick at −50, +283 and +616 ms)',
    fn() {
      const g = atCloset(WONT_SEED), s = g.state, row = stepsOf(s).find(x => x.id === 'door:shoot>o:w4:closet'), seen = new Set(), ticks = [];
      g.step(1, { act: [stepAct(row.id)] });
      for (let i = 0; i < 400; i++) {
        const now = s.clock.ms, fresh = s.armoury.range.shots.filter(x => x.row === 'shoot:door' && !seen.has(x.id));
        if (fresh.length) ticks.push({ now, at: fresh.map(x => { seen.add(x.id); return x.atMs - now; }) });
        if (choose(s) && i > 2) break;
        g.step(1);
      }
      const at = ticks.flatMap(t => t.at.map(d => t.now + d)), gaps = at.slice(1).map((x, i) => x - at[i]);
      console.log(`      ${ticks.length} ticks with a round: ${ticks.map(t => `[${t.at.join(', ')}]`).join(' ')} ms against the tick's clock; the rounds ${gaps.join(', ')} ms apart; the breach ${JSON.stringify(s.armoury.range.house.breach['o:w4:closet'])}`);
      assert(at.length === BALLISTIC_MAX_ROUNDS && ticks.every(t => t.at.length === 1 && t.at[0] <= 0) && gaps.every(x => x >= 200), JSON.stringify(ticks));
    },
  },
];
