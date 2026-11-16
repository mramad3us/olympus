// OLYMPUS tests: a burst on people, on the shoot house's stands and on doors (COMBAT §11.3, §11.4, §25.18.2, §25.20; the build sheet 0.0.18 §5.3; src/sim/combat/burst.js, supp.js bang()'s room).
//
// supp.js bang() bounded an indoor bang by FLASH_REACH_M 10 "until PLACES gives the bang its room"; burst.js gives it the room
// (its rect, the rooms joined through a doorway as one, those through an open door next). A stand is a man in utilities to a
// burst (the instructor's brief: "treat every target as an unsuited man"). Each test fails without burst.js and the room change.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { burst, burstRoom, TARGET_H, PEAK_RECORD_KPA } from '../src/sim/combat/burst.js';
import { startleMsOf, feltOf, FLASH_PTS, FLASH_NEXT_PTS } from '../src/sim/combat/supp.js';
import { setOpening } from '../src/sim/places/model.js';
import { playerActor } from '../src/core/ids.js';
import { put, nextId } from '../src/core/ids.js';
import { move } from '../src/sim/arms/kit.js';
import { stepAct } from './bots/lib.mjs';

const house = (o = {}) => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go', ...o });
// (a G-11 lying at a point, live)
function grenade(s, x, z) {
  const id = nextId(s, 'i');
  put(s, s.items, id, { type: 'grenade', model: 'g11', fuseMs: 1500, st: 'live' });
  move(s, id, { ground: { area: s.places.live.area, x, z } });
  return id;
}

export default [
  {
    name: 'a G-11 in room 1 gives everyone in the room 60 points and the hall through the open door 20, nothing in the booth, read from the rooms (fails without the bang() room change: within FLASH_REACH_M 10 the hall took 60)',
    fn() {
      const g = house(), s = g.state, me = playerActor(s), H = s.armoury.range.house;
      setOpening(s, 'o:w4:r1', 'open', { atMs: s.clock.ms - 1000 });
      const two = s.actors.list.find(a => a.who === H.twoPid), chief = s.actors.list.find(a => a.who === H.chiefPid);
      // (your #2 in room 1, you in the hall 3 m off the door, the instructor where he stands)
      two.x = 29.5; two.z = 10.5; me.x = 31.5; me.z = 13.0;
      const R = burstRoom(s, s.places.live.area, 29, 10);
      const out = burst(s, g.bus, { id: grenade(s, 29, 10), model: 'g11', x: 29, z: 10, byId: null, called: false });
      const by = Object.fromEntries(out.people.map(p => [p.who, p.pts]));
      console.log(`      the room ${R.id} (${R.volM3} m³), in ${R.in.join(', ')}, next ${R.next.join(', ')}; points: your #2 in room 1 ${by[two.who]}, you in the hall ${by[me.who]} at ${fmt(Math.hypot(me.x - 29, me.z - 10), 1)} m, the instructor ${by[chief?.who] ?? 'none'} at (${fmt(chief?.x ?? 0, 1)}, ${fmt(chief?.z ?? 0, 1)})`);
      assert(by[two.who] === FLASH_PTS && by[me.who] === FLASH_NEXT_PTS && R.in.includes('w4.r1') && R.next.includes('w4.hall'), JSON.stringify(by));
    },
  },
  {
    name: 'your own team\'s bang is prepared: in the combat EVA suit the private\'s felt stays under 10 at the burst, his #2\'s too, and neither is startled or flash-blind',
    fn() {
      const g = house({ loadout: 'flash' }), s = g.state, me = playerActor(s), H = s.armoury.range.house, two = s.actors.list.find(a => a.who === H.twoPid);
      setOpening(s, 'o:w4:r1', 'open', { atMs: s.clock.ms - 1000 });
      me.x = 29.95; me.z = 12.45; two.x = 30.6; two.z = 12.45;
      const startles = [];
      g.bus.on?.('startle', (f) => startles.push(f.who));
      const out = burst(s, g.bus, { id: grenade(s, 29, 10.5), model: 'g11', x: 29, z: 10.5, byId: me.who, called: true });
      const felt = [feltOf(s, me.who), feltOf(s, two.who)];
      console.log(`      at the stack: points ${out.people.filter(p => [me.who, two.who].includes(p.who)).map(p => `${p.who} ${p.pts}`).join(', ')}; felt you ${felt[0]}, your #2 ${felt[1]}; startled ${startles.join(',') || 'nobody'}; blind ${[me, two].filter(a => a.combat?.blindUntilMs).length}`);
      assert(felt.every(f => f < 10) && !startles.includes(me.who) && !startles.includes(two.who) && !me.combat?.blindUntilMs && !two.combat?.blindUntilMs, JSON.stringify({ felt, startles }));
    },
  },
  {
    name: 'a stand in a bang\'s room is dazed as a man in utilities (COMBAT §25.18.2\'s cell member, H 8): blind 5 s facing it, else startled 1.27 to 2.54 s; a door-triggered stand turns only once its daze is over',
    fn() {
      const us = [0, 0.5, 0.999].map(u => startleMsOf({ u, H: TARGET_H }));
      const g = house(), s = g.state, R = s.armoury.range, H = R.house;
      // (room 2's armoured man turns on its door: the door open, a G-11 in the room at the same ms)
      const T = R.turners.find(t => t.stand === '2a'), now = s.clock.ms;
      setOpening(s, 'o:w4:r2', 'open', { atMs: now });
      const out = burst(s, g.bus, { id: grenade(s, 22.7, 17.3), model: 'g11', x: 22.7, z: 17.3, byId: null, called: false, atMs: now });
      const d = out.daze[T.key];
      // (out of stop motion, so time runs: X)
      g.step(1, { act: [stepAct('leave')] });
      for (let i = 0; i < 200 && T.turnAtMs === null; i++) g.step(1);
      console.log(`      the startle of a man at H 8: ${us.join(', ')} ms at u 0, 0.5, 1; room 2: ${Object.entries(out.daze).map(([k, v]) => `${k} ${v.kind} ${v.ms} ms`).join(', ')}; 2a's trigger gap ${T.trigger.gapMs} ms, its daze to +${T.dazeUntilMs - now} ms, it turned at +${T.turnAtMs - now} ms`);
      assert(us[0] >= 1250 && us[0] <= 1300 && us[2] >= 2500 && us[2] <= 2560, JSON.stringify(us));
      assert(d && d.ms >= 1250 && T.turnAtMs >= T.dazeUntilMs && T.turnAtMs >= now + T.trigger.gapMs, JSON.stringify({ d, turn: T.turnAtMs - now }));
    },
  },  {
    name: 'a burst in vacuum records a finite peak inside the fireball (PEAK_RECORD_KPA, not Infinity, which a save writes as null), and the save loads and carries on byte for byte (the review of 2026-11-16)',
    fn() {
      const mk = () => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'flash', env: 'freefall-vacuum' });
      const g = mk(), s = g.state;
      g.step(2);
      const me = playerActor(s), gid = Object.keys(s.items).find(k => s.items[k].model === 'g11');
      burst(s, g.bus, { id: gid, model: 'g11', x: me.x + 0.3, z: me.z, byId: s.player.id, called: true });
      const kPa = s.armoury.range.house.bursts.at(-1).kPa[s.player.id], json = g.save(), g2 = mk();
      g2.load(json); g.step(100); g2.step(100);
      const saved = g2.state.armoury.range.house.bursts.at(-1).kPa[s.player.id];
      console.log(`      0.3 m from you in vacuum: ${kPa} kPa recorded (cap ${PEAK_RECORD_KPA}), after a load ${saved}; byte for byte ${g.save() === g2.save()}`);
      assert(Number.isFinite(kPa) && kPa === PEAK_RECORD_KPA && saved === kPa && g.save() === g2.save(), JSON.stringify({ kPa, saved }));
    },
  },
  // (v0.0.19, D2 (the build sheet 0.0.19 §0 item 2, §6))
  {
    name: 'a practice grenade\'s stands are dazed by the instructor\'s read alone: no startle from the spotting charge (fails without the build sheet 0.0.19 §0 item 2: burst.js step 3 dazed every stand of the room by a startle)',
    fn() {
      const g = house({ loadout: 'frag', tier: 'sgt' }), s = g.state, H = s.armoury.range.house, T1 = s.armoury.range.turners.find(t => t.stand === '1a');
      setOpening(s, 'o:w4:r1', 'open', { atMs: s.clock.ms - 1000 });
      const id = nextId(s, 'i');
      put(s, s.items, id, { type: 'grenade', model: 'g9p', fuseMs: 4000, st: 'live' });
      move(s, id, { ground: { area: s.places.live.area, x: 31.0, z: 11.5 } });
      const before = T1.dazeUntilMs ?? null, out = burst(s, null, { id, model: 'g9p', x: 31.0, z: 11.5, atMs: s.clock.ms, byId: s.player.id });
      const rec = H.bursts.at(-1), after = T1.dazeUntilMs ?? null, read = rec.read?.stands?.[T1.key];
      console.log(`      the spotting charge's daze: ${JSON.stringify(rec.daze)}; 1a's dazeUntilMs before ${before}, after the burst ${after}; the read on 1a ${JSON.stringify(read)} (applied by house-kit.js readsTick, not here)`);
      assert(Object.keys(rec.daze).length === 0 && after === before && !!rec.read && read && out.read === rec.read, JSON.stringify({ daze: rec.daze, before, after }));
    },
  },
];
