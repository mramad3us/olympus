// OLYMPUS tests: the instructor's read of a practice grenade (src/sim/combat/practice.js; kit2 §2.4, §6 tests 8 to 14; the build sheet 0.0.19 §0 item 5, §6): WEAPONS §12.3's balls, the house's panels and leaves, the G-9's and the G-13's reads in the house's rooms, the noncombatants' rule, the stack's own, the throw's exposure.
//
// Each case reads a burst placed by hand on the shoot house of seed 48213 (room 1 hostiles only there: 1a and 1b both threats),
// you and your #2 on room 1's stack points unless the case moves you, and fails without the rule it names. The figures are D1's
// own blast.js's, re-run (the build sheet's §0 item 5): #1 17.4 kPa free field at a deep G-9, 8.7 shadowed; a G-13 at room 2's
// centre 35.8 kPa on 2b (the margin over EARDRUM_KPA printed); the hostage at 9.3 kPa from room 3's centre.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { readBurst, fragLine, ballVMs, ballPenMm, throwExposure, readMarks, FRAG_DOWN_N, EARDRUM_KPA, EARDRUM50_KPA, BALL } from '../src/sim/combat/practice.js';
import { burstRoom } from '../src/sim/combat/burst.js';
import { peakKPa, fragLambda, CORNER_SHADOW_K, BREACH_SAFE_KPA, STUN_KPA, standoffM } from '../src/sim/arms/blast.js';
import { pStop, pOfMaterial } from '../src/sim/arms/penetrate.js';
import { airAt } from '../src/sim/places/env.js';
import { setOpening } from '../src/sim/places/model.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { playerActor, put, nextId } from '../src/core/ids.js';
import { move } from '../src/sim/arms/kit.js';

const house = (o = {}) => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'mixed', ...o });
// (you and your #2 on a door's stack points)
function stackOn(s, door) {
  const P = lanePlanOf(s).plans[door], me = playerActor(s), H = s.armoury.range.house, two = s.actors.list.find(a => a.who === H.twoPid);
  me.x = P.stack[0][0]; me.z = P.stack[0][1]; two.x = P.stack[1][0]; two.z = P.stack[1][1];
  return P;
}
// (a practice grenade lying at a point, its record and its room: the read as burst.js makes it)
function read(s, model, x, z, { byId = null, flight = null } = {}) {
  const id = nextId(s, 'i');
  put(s, s.items, id, { type: 'grenade', model, fuseMs: 4000, st: 'live', ...(flight ? { flight } : {}) });
  move(s, id, { ground: { area: s.places.live.area, x, z } });
  return readBurst(s, { burst: id, model, x, z, atMs: s.clock.ms, room: burstRoom(s, s.places.live.area, x, z), byId });
}
const st = (R, stand) => Object.values(R.stands).find(v => v.stand === stand);

export default [
  {
    name: 'the read is WEAPONS §12.3\'s: λ 0.71 at 15 m standing and 40 at 2 m; the ballistic panels stop every ball; a closed leaf passes 20 to 24% within 3 m and none at 5 m; the ball at 15 m by the env\'s own air: 872 m/s in the Wheel\'s 66 kPa (kit2\'s 880 at 0.785 kg/m³), 702 in a UN hull\'s 101.3 (kit2\'s 699), slower in the Melas floor\'s colder air, 1,350 in vacuum',
    fn() {
      const lam15 = fragLambda(160, 15), lam2 = fragLambda(160, 2);
      const airs = {};
      for (const env of [null, 'earth-ship', 'melas-ground', 'mars-datum', 'freefall-vacuum']) { const g = house(env ? { env } : {}); const s = g.state, me = playerActor(s); airs[env ?? 'wheel'] = airAt(s, s.places.live.area, me.x, me.z); }
      const v = Object.fromEntries(Object.entries(airs).map(([k, a]) => [k, Math.round(ballVMs(15, a))]));
      const leaf = [1, 2, 3, 5].map(r => ({ r, pass: 1 - pStop(ballPenMm(ballVMs(r, airs.wheel)), pOfMaterial('honeycomb', 25)) }));
      // (the panels: room 1's middle to the hall through the wall west of its door, never through it)
      const g = house(), s = g.state, area = s.places.live.area;
      const wall = fragLine(s, area, [27.5, 11], [27.5, 13]), shut = fragLine(s, area, [29, 11], [29, 13]);
      setOpening(s, 'o:w4:r1', 'open', { atMs: s.clock.ms - 1000 });
      const open = fragLine(s, area, [29, 11], [29, 13]);
      console.log(`      λ ${fmt(lam15, 2)} at 15 m, ${fmt(lam2, 0)} at 2 m (K 160, standing); the ball at 15 m: ${JSON.stringify(v)} m/s (air ${Object.entries(airs).map(([k, a]) => `${k} ${a.pKpa} kPa, ${fmt(a.rhoKgM3 ?? 0, 4)} kg/m³`).join('; ')})`);
      console.log(`      a closed leaf (honeycomb 25 mm, P ${pOfMaterial('honeycomb', 25)}) passes ${leaf.map(l => `${fmt(l.pass * 100, 1)}% at ${l.r} m`).join(', ')}; the panel west of room 1's door keeps ${wall.keeps} (wall ${wall.wall}); its leaf shut ${fmt(shut.keeps, 3)} (${shut.through.join()}), open ${open.keeps}`);
      assert(Math.abs(lam15 - 0.71) < 0.01 && lam2 === 40, JSON.stringify({ lam15, lam2 }));
      // (the world's Mars is terraformed (the Melas floor 65.9 kPa at −10 °C, the datum 52 kPa): kit2's 1,345 m/s was a thin air's, which no env holds)
      assert(Math.abs(v.wheel - 872) <= 1 && Math.abs(v.wheel - 880) / 880 < 0.015 && Math.abs(v['earth-ship'] - 702) <= 1 && v['melas-ground'] < v.wheel && v['mars-datum'] > v['melas-ground'] && v['freefall-vacuum'] === BALL.v0Ms, JSON.stringify(v));
      assert(leaf.slice(0, 3).every(l => l.pass >= 0.2 && l.pass <= 0.24) && leaf[3].pass === 0, JSON.stringify(leaf));
      assert(wall.keeps === 1 && wall.wall && shut.keeps > 0.7 && shut.through[0] === 'o:w4:r1' && open.keeps === 0, JSON.stringify({ wall, shut, open }));
    },
  },
  {
    name: 'a G-9P thrown deep in room 1 puts 1a and 1b down, and the stack at its points takes no fragment and under 27.6 kPa (#1 17.4 kPa free field, 8.7 shadowed), on a hostiles-only seed',
    fn() {
      const g = house(), s = g.state;
      stackOn(s, 'o:w4:r1');
      setOpening(s, 'o:w4:r1', 'open', { atMs: s.clock.ms - 1000 });
      const R = read(s, 'g9p', 29.0, 8.8), me = playerActor(s), rM = Math.hypot(me.x - 29, me.z - 8.8), free = peakKPa(0.24, rM, 66);
      console.log(`      1a ${JSON.stringify(st(R, '1a'))}; 1b ${JSON.stringify(st(R, '1b'))}`);
      console.log(`      #1 at ${fmt(rM, 2)} m: free field ${fmt(free, 1)} kPa, shadowed (× ${CORNER_SHADOW_K}) ${fmt(free * CORNER_SHADOW_K, 1)}; the read ${JSON.stringify(R.stack.me)}; the #2 ${JSON.stringify(R.stack.two)}; the room ${R.kPaRoom} kPa; marks: ${readMarks(R).map(m => m.text).join(' · ')}`);
      assert(st(R, '1a').out === 'down' && st(R, '1b').out === 'down' && !R.fragged, JSON.stringify(R.stands));
      assert(R.stack.me.n === 0 && R.stack.two.n === 0 && R.stack.me.kPa < BREACH_SAFE_KPA && R.stack.two.kPa < BREACH_SAFE_KPA, JSON.stringify(R.stack));
      assert(Math.abs(free - 17.4) < 0.15 && Math.abs(R.stack.me.kPa - 8.7) < 0.15, JSON.stringify({ free, me: R.stack.me }));
    },
  },
  {
    name: 'a frag in room 2 or room 3 is a fault on every seed: 2b (the no-shoot) and the hostage card are in it (fails without the noncombatant rule)',
    fn() {
      const out = [];
      for (let seed = 1; seed <= 20; seed++) {
        const g = house({ seed }), s = g.state;
        const r2 = read(s, 'g9p', 22.75, 16.9), r3 = read(s, 'g9p', 17.5, 8.6), r1 = read(s, 'g9p', 29.0, 8.8);
        out.push({ seed, r1: r1.fragged, r2: r2.fragged, r3: r3.fragged, nc2: r2.noncombatants.join(), nc3: r3.noncombatants.join() });
      }
      const r1n = out.filter(o => o.r1).length;
      console.log(`      20 seeds: room 2 fragged ${out.filter(o => o.r2).length} (its noncombatants ${[...new Set(out.map(o => o.nc2))].join(' | ')}), room 3 ${out.filter(o => o.r3).length} (${[...new Set(out.map(o => o.nc3))].join(' | ')}), room 1 ${r1n} (1b a no-shoot on those)`);
      assert(out.every(o => o.r2 && o.r3), JSON.stringify(out.filter(o => !o.r2 || !o.r3)));
      assert(r1n > 0 && r1n < 20, JSON.stringify(out.map(o => o.r1)));
    },
  },
  {
    name: 'a G-13P\'s read: stunned within 3.44 m, 13.7 kPa in room 1, a no-shoot over 34.5 kPa injured (room 2\'s centre: 35.8 kPa, the margin printed), never a fragment; in vacuum it stuns nobody',
    fn() {
      let lo = 0.5, hi = 10; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (peakKPa(0.23, m, 66) > STUN_KPA) lo = m; else hi = m; }
      const g = house(), s = g.state;
      const r1 = read(s, 'g13p', 29.0, 10.0), r2 = read(s, 'g13p', 22.75, 16.9), r3 = read(s, 'g13p', 17.5, 8.6);
      const b2 = st(r2, '2b'), frags = [r1, r2, r3].flatMap(r => Object.values(r.stands)).reduce((n, x) => n + x.n, 0);
      const v = house({ env: 'freefall-vacuum' }), vs = v.state, rv = read(vs, 'g13p', 29.0, 10.0);
      console.log(`      the stun's reach ${fmt(hi, 2)} m; the closed rooms: room 1 ${r1.kPaRoom}, room 2 ${r2.kPaRoom}, room 3 ${r3.kPaRoom} kPa; 2b at room 2's centre ${b2.kPa} kPa (${b2.out}), over ${EARDRUM_KPA} by ${fmt(b2.kPa - EARDRUM_KPA, 1)}; concussed ${r2.concussed.join() || 'none'}; balls ${frags}; in vacuum the stands stunned ${Object.values(rv.stands).filter(x => x.stunMs).length}, peak at 1a ${st(rv, '1a').kPa} kPa`);
      assert(Math.abs(hi - 3.44) < 0.01 && Math.abs(r1.kPaRoom - 13.7) < 0.1, JSON.stringify({ hi, room1: r1.kPaRoom }));
      assert(b2.out === 'injured' && Math.abs(b2.kPa - 35.8) < 0.15 && r2.concussed.includes('2b'), JSON.stringify(b2));
      assert(frags === 0 && Object.values(rv.stands).every(x => !x.stunMs && !x.out), JSON.stringify({ frags, rv: rv.stands }));
    },
  },
  {
    name: 'reading a burst twice gives the same Read, and a lane saved with a practice frag on the floor carries on byte for byte',
    fn() {
      const g = house(), s = g.state, a = read(s, 'g9p', 29.0, 8.8);
      const id = Object.keys(s.items).at(-1), b = readBurst(s, { burst: id, model: 'g9p', x: 29.0, z: 8.8, atMs: s.clock.ms, room: burstRoom(s, s.places.live.area, 29.0, 8.8) });
      assert(JSON.stringify(a) === JSON.stringify(b), 'two reads differ');
      // (the honest kit bot to the first live frag on the floor, the save, then on to the card from both)
      return import('./bots/kit.mjs').then(async ({ houseKitBot }) => {
        const { runHouse } = await import('./bots/house.mjs');
        const g1 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'frag' });
        const bot = houseKitBot({ use: 'frag' });
        const onFloor = (st2) => Object.values(st2.places.sites).some(site => (site.items ?? []).some(l => st2.items[l.id]?.model === 'g9p' && st2.items[l.id].st === 'live'));
        let n = 0;
        while (!onFloor(g1.state) && n++ < 40_000) g1.step(1, bot);
        const save = g1.save(), atTick = g1.state.clock.tick;
        runHouse(g1, bot, { maxMs: 10 * 60_000 });
        const g2 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'frag' });
        g2.load(save);
        runHouse(g2, houseKitBot({ use: 'frag' }), { maxMs: 10 * 60_000 });
        console.log(`      the read: ${Object.keys(a.stands).length} stands, the same twice; the save at tick ${atTick} with the frag on the floor; to the card: tick ${g1.state.clock.tick} and ${g2.state.clock.tick}, digests ${g1.digest()} and ${g2.digest()}`);
        assert(onFloor(g2.state) === false && g1.digest() === g2.digest() && g1.errors.length === 0 && g2.errors.length === 0, JSON.stringify({ e1: g1.errors, e2: g2.errors }));
      });
    },
  },
  {
    name: 'the thrower in the doorway at the burst is a cease fire (FRAG_DOWN_N balls or EARDRUM50_KPA); on the wall he is clean (fails without the stack\'s read)',
    fn() {
      const g = house(), s = g.state;
      stackOn(s, 'o:w4:r1');
      setOpening(s, 'o:w4:r1', 'open', { atMs: s.clock.ms - 1000 });
      const clean = read(s, 'g9p', 29.0, 9.6), me = playerActor(s);
      me.x = 29.0; me.z = 11.7;
      const door = read(s, 'g9p', 29.0, 9.6);
      console.log(`      on the wall: ${JSON.stringify(clean.stack.me)}; in the doorway: ${JSON.stringify(door.stack.me)}; marks ${readMarks(door).filter(m => m.fault).map(m => `${m.text} (${m.fault})`).join(', ')}`);
      assert(clean.stack.me.n === 0 && clean.stack.me.kPa < BREACH_SAFE_KPA, JSON.stringify(clean.stack.me));
      assert(door.stack.me.n >= FRAG_DOWN_N || door.stack.me.kPa >= EARDRUM50_KPA, JSON.stringify(door.stack.me));
      assert(readMarks(door).some(m => m.fault === 'burst'), 'no burst fault');
    },
  },
  {
    name: 'the throw\'s exposure: a facing threat with a line to the thrower longer than the par is the "exposed" fault; from behind the jamb nothing',
    fn() {
      const g = house(), s = g.state, H = s.armoury.range.house;
      setOpening(s, 'o:w4:r1', 'open', { atMs: s.clock.ms - 1000 });
      for (const T of s.armoury.range.turners) if (T.room === 'w4.r1') { T.turnAtMs = 0; T.awayAtMs = null; }
      const now = s.clock.ms, inDoor = throwExposure(s, s.player.id, { fromMs: now, toMs: now + H.parMs + 500, at: [29.0, 12.0] }), behind = throwExposure(s, s.player.id, { fromMs: now, toMs: now + H.parMs + 500, at: [30.25, 12.45] });
      const marks = readMarks({ as: 'g9', room: 'w4.r1', stands: {}, stack: {}, noncombatants: [], concussed: [], exposed: inDoor, uncookedMs: null }, { parMs: H.parMs });
      console.log(`      the par ${H.parMs} ms; in the doorway ${JSON.stringify(inDoor)}; behind the jamb ${JSON.stringify(behind)}; marks ${marks.map(m => `${m.text}${m.fault ? ` (${m.fault})` : ''}`).join(' · ')}`);
      assert(inDoor?.ms > H.parMs && inDoor.by.includes('1a') && behind === null, JSON.stringify({ inDoor, behind }));
      assert(marks.some(m => m.fault === 'exposed'), JSON.stringify(marks));
    },
  },
];
