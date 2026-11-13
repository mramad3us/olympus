// OLYMPUS tests: the bundles, what T does at each rung and where it hands the decision back (src/sim/combat/bundle.js, drills/enter-and-clear.js; COMBAT §25.7, §25.8; the build sheet 0.0.12 §2.2, §5.2).
//
// Held: each rung's rows at room 1's door (their labels, times, beats by channel); a bundle never fires, picks, reloads,
// spends or crosses a door the plan does not take, and stops at the contact; it is offered only at its rung and once lived
// by hand (struck "by hand first" otherwise); **T never does the walk in at rungs 0 and 1** (the user, 2026-11-07: "then
// would move in using movement keys (game unpaused with X)"): no row below rung 2 holds a beat that crosses the door's
// plane; the hand-backs: the closet's lock ("Locked. Kick it, or hold it."), the inner door ("Door, east wall. Hold it or
// clear it?"), the #2 not with you after 3 s ("Your number two's not with you."); the #2's slot through the same plan.
import { assert, fmt } from './helpers.mjs';
import { drillWorld, HOUSE1 } from './drill-world.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { planBundle, runSlot, startBundle, HANDBACK_WORDS, TWO_WAIT_MS, kickOdds } from '../src/sim/combat/bundle.js';
import { offered, drillsRecord } from '../src/sim/skills/templates.js';
import { bundleDef, livedAt } from '../src/sim/combat/drills/enter-and-clear.js';
import { pastThreshold } from '../src/sim/combat/room.js';
import { openingState } from '../src/sim/places/model.js';
import { setPost } from '../src/sim/people/staff.js';
// (a #2 posted in the house where the people domain keeps him (the scene's way: staff.js setPost), his actor)
function postTwo(g, s, pid, x, z) {
  const twoPid = s.actors.list.find(a => a.who !== pid).who;
  setPost(s, twoPid, { key: 'house-two', area: HOUSE1.area, x, z, face: 'left', outfit: 'combatSuit' });
  g.step(1);
  return { twoPid, actor: () => s.actors.list.find(a => a.who === twoPid) };
}

const TIERS = ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'];
const pick = (g, id) => g.step(1, { act: [{ act: 'stop', args: { step: id } }] });
const settle = (g, s, max = 4000) => { let n = 0; while (n++ < max && !(s.stop?.mode === 'stop' && s.stop.phase === 'choose')) g.step(1); return n; };
// (whether a beat's move crosses room 1's door plane into the room: an entry's path, or any move past the threshold)
const crosses = (plan, b) => b.k === 'move' && (b.path ?? []).some(p => pastThreshold(plan, p[0], p[1]));

export default [
  {
    name: 'each rung\'s rows at room 1\'s door (COMBAT §25.19.2): the catalogue at every rung, a row above the rung greyed with its rung and paged last, never hidden (the user, 2026-11-11: "even if grayed out"), the explosive breach greyed "no charge issued"; the lead the rung\'s (Stack up at 0, Stack up, take point at 1 and 2, Open, clear the room at 3 and 4); no row names a lane or a house; below rung 2 no live row holds a beat that crosses the door into the room (T never does the walk in)',
    fn() {
      const bad = [];
      for (const tier of TIERS) {
        const w = drillWorld({ tier }), { s, pid } = w, plan = w.lane.plans['o:w4:r1'];
        const all = stepsOf(s), rows = all.filter(r => r.kind === 'bundle' || ['door', 'watch', 'gait'].includes(r.kind));
        const words = rows.filter(r => r.kind === 'bundle').map(r => `${r.label}${Number.isFinite(r.ms) ? ` · ${fmt(r.ms / 1000, 2)} s` : ''}${r.lanes && Object.keys(r.lanes).length ? ` [${Object.entries(r.lanes).map(([k, n]) => `${k} ${n}`).join(', ')}]` : ''}${r.off ? ` (${r.off})` : ''}`);
        console.log(`      ${tier.padEnd(8)} ${words.join(' | ')} | ${rows.filter(r => r.kind === 'watch').length} Watch rows, the stances ${rows.filter(r => r.kind === 'gait').map(r => r.label).join(', ')}`);
        const rung = s.people[pid].skills.drills.room.rung, last = all.findIndex(r => r.id === 'leave');
        for (const r of rows.filter(x => x.kind === 'bundle')) {
          const B = bundleDef(r.bundle), i = all.indexOf(r);
          if (/\b(house|lane)\b/i.test(r.label)) bad.push(`${tier}: ${r.id} names a lane or a house`);
          if (B?.rung > rung && !(r.off === `rung ${B.rung}` && r.later && i > last)) bad.push(`${tier}: ${r.id} above the rung not greyed last (${r.off})`);
          if (B?.id === 'door:breach' && r.off !== 'no charge issued') bad.push(`${tier}: the breach ${r.off}`);
          if (r.off) continue;
          const p = planBundle(s, pid, r.bundle, { door: 'o:w4:r1', rung });
          if (rung < 2 && p?.beats.some(b => crosses(plan, b))) bad.push(`${tier}: ${r.id} walks in`);
        }
        const lead = rows.find(r => r.kind === 'bundle' && !r.off);
        const want = { recruit: 'Stack up', private: 'Stack up, take point', cpl: 'Stack up, take point', sgt: 'Open, clear the room', raider: 'Open, clear the room', tierone: 'Open, clear the room' }[tier];
        if (lead?.label !== want) bad.push(`${tier}: the lead ${lead?.label} not ${want}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'a row never fires, picks, reloads or spends, and never crosses a door the plan does not take; one press reaches one room, to "Room clear!", never the next door (the user, 2026-11-11: "the option to clear the whole house should not exist"): the tier one room by room through the empty lane (no threat turned), the closet asked once ("Door, east wall. Hold it or clear it?") and left shut',
    timeoutMs: 120_000,
    fn() {
      const w = drillWorld({ tier: 'tierone' }), { g, s, gunId } = w, t0 = s.clock.ms;
      const shots = [], halts = [], calls = [];
      g.bus.on?.('shot', () => shots.push(s.clock.ms));
      g.bus.on?.('bundle', (f) => { if (f.phase === 'halt' && f.why) halts.push(`${f.why} at ${fmt((f.atMs - t0) / 1000, 2)} s`); });
      // (the scene's room records, cleared at "Room clear!" as the house's are at "Clear!", so the lane's next door is the next press's)
      s.armoury.range.house = { goAtMs: null, rooms: w.lane.order.filter(d => d !== 'hall').map(d => ({ id: d, door: d, state: 'ahead', covered: {} })), hall: { id: 'hall', state: 'ahead', covered: {} } };
      g.bus.on?.('say', (f) => { if (f.call === 'roomclear') { calls.push(f.room); const H = s.armoury.range.house, R = f.room === 'hall' ? H.hall : H.rooms.find(x => x.door === f.room); if (R) R.state = 'clear'; } });
      const gun = s.items[gunId], mag0 = gun.mag ? s.items[gun.mag].n : null, chamber0 = gun.chamber;
      let presses = 0;
      const doors = [];
      for (let k = 0; k < 12; k++) {
        const rows = stepsOf(s), c = rows.find(r => r.carry), room = rows.find(r => r.bundle === 'room:clear' && !r.off);
        const r = c ?? room;
        if (!r) break;
        if (!c) doors.push(r.door);
        pick(g, r.id); presses++;
        settle(g, s);
        // (the press ended at its room's "Room clear!" or a hand-back: never on the next door's stack)
        const d = s.stop?.doing;
        assert(!d || d.door === r.door, `still running into ${d?.door}`);
      }
      const end = (s.clock.ms - t0) / 1000, mag1 = gun.mag ? s.items[gun.mag].n : null;
      console.log(`      the lane in ${fmt(end, 2)} s and ${presses} presses (${doors.join(', ')}); "Room clear!" for ${calls.join(', ')}; hand-backs: ${halts.join(', ') || 'none'}; shots ${shots.length}; the magazine ${mag0} → ${mag1}, the chamber ${chamber0} → ${gun.chamber}; the pick ${s.stop?.pick}; the closet ${openingState(s, 'o:w4:closet')}; at (${w.me().x}, ${w.me().z})`);
      assert(!shots.length && mag0 === mag1 && chamber0 === gun.chamber && !s.stop.pick, 'nothing fired, spent or picked');
      assert(openingState(s, 'o:w4:closet') !== 'open', 'the closet crossed');
      assert(halts.some(h => h.startsWith('door-unplanned')), `the inner door's hand-back: ${halts.join()}`);
      assert(doors.length === 4 && new Set(doors).size === 4 && calls.length === 4, JSON.stringify({ doors, calls }));
      assert(Math.hypot(w.me().x - w.lane.plans.hall.points[0][0], w.me().z - w.lane.plans.hall.points[0][1]) < 0.3, 'at the hall\'s end');
    },
  },
  {
    name: 'offered only at its rung and once lived by hand: a sheet whose record lists nothing lived sees the rung\'s bundles struck "by hand first", and T cannot start one; a test sheet counts every bundle of its rung as lived (COMBAT §25.3.2)',
    fn() {
      const w = drillWorld({ tier: 'sgt' }), { g, s, pid } = w;
      const before = stepsOf(s).filter(r => r.kind === 'bundle' && !r.single && !r.later).map(r => `${r.label}${r.off ? ` (${r.off})` : ''}`);
      s.people[pid].skills.drills.room = drillsRecord('sgt', livedAt(0));
      const after = stepsOf(s).filter(r => r.kind === 'bundle' && !r.single && !r.later);
      const r = startBundle(s, g.bus, pid, after.find(x => x.bundle === 'room:clear').id);
      console.log(`      the test sheet: ${before.join(', ')}; nothing lived: ${after.map(x => `${x.label} (${x.off})`).join(', ')}; T on Clear the room: ${JSON.stringify(r)}`);
      assert(after.length && after.every(x => x.off === 'by hand first' && x.struck) && !r.ok && r.why === 'by hand first', JSON.stringify(after.map(x => x.off)));
      assert(!bundleDef('house:clear') && !offered(s, pid, bundleDef('room:dominate')) && offered(s, pid, bundleDef('stack:up')), 'the rung and the singles');
    },
  },
  {
    name: 'the closet\'s lock: Push and Pull struck "locked", a kick at DC 14 that fails hands back "Locked. Kick it again, or hold it." at ×1.6 its time, and Hold it is always there',
    fn() {
      const w = drillWorld({ tier: 'private' }), { g, s, pid } = w;
      // (the private in room 2 by its point, the lane's room 2)
      const p2 = w.lane.plans['o:w4:r2'];
      w.me().x = p2.points[0][0]; w.me().z = p2.points[0][1];
      s.armoury.range.house = { rooms: [{ id: 'w4.r1', door: 'o:w4:r1', state: 'clear' }, { id: 'w4.r2', door: 'o:w4:r2', state: 'entered', covered: {} }, { id: 'w4.r3', door: 'o:w4:r3', state: 'ahead' }], hall: { id: 'w4.hall', state: 'ahead' } };
      const rows = stepsOf(s).filter(r => r.kind === 'door');
      console.log(`      in room 2: ${rows.map(r => `${r.label}${r.off ? ` (${r.off})` : ''}${r.odds ? ` · ${Math.round(r.odds * 100)}%` : ''}`).join(' | ')}`);
      assert(rows.some(r => r.id === 'door:hold>o:w4:closet') && rows.find(r => /^door:(push|pull)>o:w4:closet/.test(r.id))?.off === 'locked', 'the rows');
      // (a weak kicker, Fitness 2, so the seed's kicks show a failure: odds 45% against DC 14)
      s.people[pid].skills.skills.fitness = [2, 0];
      const kicks = [];
      for (let k = 0; k < 6 && openingState(s, 'o:w4:closet') !== 'open'; k++) {
        const t0 = s.clock.ms;
        pick(g, 'door:kick>o:w4:closet');
        settle(g, s);
        kicks.push({ ms: s.clock.ms - t0, open: openingState(s, 'o:w4:closet') === 'open', why: s.stop.carry?.why ?? null });
      }
      console.log(`      the kicks (odds ${Math.round(kickOdds(s, pid, 'o:w4:closet') * 100)}%): ${kicks.map(k => `${k.ms} ms ${k.open ? 'open' : k.why}`).join(', ')}`);
      const failed = kicks.find(k => !k.open);
      assert(!failed || (failed.why === 'refused' && failed.ms >= 1.6 * 1200), JSON.stringify(kicks));
      assert(HANDBACK_WORDS['refused-kick'] === 'Locked. Kick it again, or hold it.', 'the words');
    },
  },
  {
    name: 'the #2 not with you: the hand on the door waits 3 s, then hands back "Your number two\'s not with you." with the door still to open; his slot through the same plan stacks him 0.65 m behind and takes him to his point after you cross',
    timeoutMs: 60_000,
    fn() {
      const w = drillWorld({ tier: 'cpl' }), { g, s, pid } = w;
      // (the #2 posted far down the hall)
      const P = postTwo(g, s, pid, 12, 13.2), twoPid = P.twoPid, two = P.actor();
      s.armoury.range.house = { two: { pid: twoPid, aid: two.id, rung: 2, doing: null } };
      const t0 = s.clock.ms;
      // (rung 2's groups: Stack up, take point, then "Open, in: your corner", whose door waits on him)
      pick(g, stepsOf(s).find(r => r.id.startsWith('drill:stack:point>')).id);
      settle(g, s);
      pick(g, stepsOf(s).find(r => r.id.startsWith('drill:room:in>')).id);
      const d = s.stop.doing;
      settle(g, s);
      const door = d.beats.find(b => b.key === 'door'), waited = s.clock.ms - door.twoFromMs;
      console.log(`      the #2 at (12, 13.2): the hand on the door from ${fmt((door.twoFromMs - t0) / 1000, 2)} s, the bundle halted '${s.stop.carry?.why}' at ${fmt((s.clock.ms - t0) / 1000, 2)} s (${waited} ms on the door), the door ${openingState(s, 'o:w4:r1')}, the rest ${s.stop.carry?.beats?.join(', ')}`);
      assert(s.stop.carry?.why === 'two' && waited >= TWO_WAIT_MS && waited < TWO_WAIT_MS + 600 && openingState(s, 'o:w4:r1') !== 'open' && s.stop.carry.beats.includes('door'), JSON.stringify({ carry: s.stop.carry, waited }));
      // (his slot: from HOUSE1.two, the same plan for slot 2, you by T on Stack and open then Enter)
      const w2 = drillWorld({ tier: 'sgt' }), g2 = w2.g, s2 = w2.s, P2 = postTwo(g2, s2, w2.pid, HOUSE1.two.x, HOUSE1.two.z), two2 = P2.twoPid, t2 = P2.actor();
      const rec = { pid: two2, aid: t2.id, rung: 3, doing: null };
      s2.armoury.range.house = { two: rec };
      const log = [];
      const t1 = s2.clock.ms;
      g2.bus.on?.('bundle', (f) => { if (f.who === two2 && f.phase === 'start') log.push(`${f.id.split('>')[0].slice(6)} at ${fmt((f.atMs - t1) / 1000, 2)} s`); });
      pick(g2, stepsOf(s2).find(r => r.id.startsWith('drill:room:clear>')).id);
      for (let n = 0; n < 400; n++) { g2.step(1); runSlot(s2, g2.bus, rec, s2.clock.ms); }
      const a2 = P2.actor(), pt = w2.lane.plans['o:w4:r1'].points[1];
      console.log(`      the #2 (rung 3): ${log.join(', ')}; at (${a2.x}, ${a2.z}), ${fmt(Math.hypot(a2.x - pt[0], a2.z - pt[1]), 2)} m from his point`);
      assert(Math.hypot(a2.x - pt[0], a2.z - pt[1]) < 0.3, 'the #2 on his point');
    },
  },
];
