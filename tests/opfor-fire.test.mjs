// OLYMPUS tests: opfor-fire, the role-players' fire and the live lane's kit (src/sim/scenarios/opfor.js, src/sim/arms/calibres.js marking, src/sim/arms/kit.js 'opfor-fof', 'house-fof', the mask; the build sheet v0.0.19 §1 L-opfor, §5, §6; opfor.md §1, §2.4, §5).
//
// The fixture is tests/opfor-world.mjs liveGame (room 2's door opened, you put in its doorway, X at every pause), as opfor-brain's.
// A role-player's round at a marine is shot.js resolveShot on combat/men.js marineTarget, then men.js incoming, the one writer of
// a strike (R.house.live.struck, HIT_PTS on the marine's pool, the casualty at 2 torso or 1 head). Until men.js and the house's
// live hooks merge, those cases run on L-opfor's stub of men.js (the build sheet §1: a role's own stub of another role's module),
// and what only the house writes (the lane's 'casualty' end, the card) is said in a printed note, the casualty's record checked
// in its place. The marking round's spin bias is spin.js's closed form at the load's own flight (ballistics.js flight).
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { liveGame, rp, liveOf } from './opfor-world.mjs';
import { setOpening } from '../src/sim/places/model.js';
import { leaveStop } from '../src/sim/arms/shooting.js';
import { LIVE_LOADS, loadOf } from '../src/sim/arms/calibres.js';
import { flight, envOfPlace } from '../src/sim/arms/ballistics.js';
import { spinOf, spinBiasCm } from '../src/sim/places/spin.js';
import { materialise, move, kitMassKg, kitView, SLOTS, WORN_SLOTS, KIT_TEMPLATES, CONTAINERS, FOF_SIDEARM, issueSidearm } from '../src/sim/arms/kit.js';
import { nextId, put } from '../src/core/ids.js';
import { suppAt, blockOf, HIT_PTS, SUBSONIC_PTS, inputPts } from '../src/sim/combat/supp.js';
import { hasWounds } from '../src/sim/body/wounds.js';
import { CASUALTY_MS } from '../src/sim/combat/men.js';
import { TICK_MS } from '../src/core/clock.js';

const LEAVE = (st) => (st.stop?.mode === 'stop' && st.stop.phase === 'choose' ? { act: [{ act: 'stop', args: { step: 'leave', tempo: 'normal' } }] } : {});
const MAN_ZONES = new Set(['A', 'C', 'head']);
function underFire({ seed = 48213, tier = 'private' } = {}) {
  const w = liveGame({ seed, tier, opfor: 'live:fight,fight', setup: 'room:2' }), s = w.s;
  if (s.stop) leaveStop(s, w.g.bus, 'scene');
  w.g.step(4, LEAVE);
  setOpening(s, 'o:w4:r2', 'open', { atMs: s.clock.ms });
  w.g.step(30, LEAVE);
  const me = w.g.me();
  me.x = 20.6; me.z = 14.9; me.$px = me.x; me.$pz = me.z; me.headRad = Math.PI / 2; me.face = 'down';
  return w;
}

export default [
  {
    name: 'opfor-fire: a marking round on a marine lands by manHole\'s zones, is on R.house.live.struck with its part and hole, adds HIT_PTS and never wounds; his rounds are his record\'s, never yours',
    fn() {
      const w = underFire(), s = w.s, pid = s.player.id, T = rp(w.g, '2a'), Lv = liveOf(w.g);
      const pools = [];
      for (let i = 0; i < 200 && Lv.struck.length < 2 && !Lv.casualty; i++) {
        const before = suppAt(blockOf(s, pid), s.clock.ms);
        w.g.step(1, LEAVE);
        if (Lv.struck.length > pools.length) pools.push({ before, after: suppAt(blockOf(s, pid), Lv.struck.at(-1).atMs) });
      }
      const st = Lv.struck, mine = new Set((s.armoury.range.shots ?? []).map(x => x.id));
      console.log(`      ${T.live.fired} rounds by ${T.name}: ${st.map(x => `${x.shotId} ${x.part}/${x.zone} at ${JSON.stringify(x.at)} by ${x.by}`).join('; ')}; your pool ${pools.map(p => `${fmt(p.before, 1)} → ${fmt(p.after, 1)}`).join(', ')} (HIT_PTS ${HIT_PTS}); wounded ${hasWounds(s.people[pid].body)}; his rounds on R.house.live.shots ${Lv.shots.length}, on yours ${Lv.shots.filter(x => mine.has(x.id)).length}`);
      if (!st.some(x => Array.isArray(x.at))) console.log('      (note: no hole on the strike: shot.js\'s man branch for a \'marine\' target is L-men\'s hunk, and men.js here is L-opfor\'s stub)');
      assert(st.length >= 1 && st.every(x => x.who === pid && x.by === T.key && MAN_ZONES.has(x.zone) && (x.part === 'torso' || x.part === 'head') && 'at' in x), JSON.stringify(st));
      assert(pools.length >= 1 && pools.every(p => p.after - p.before >= HIT_PTS * 0.5 - 1e-6), JSON.stringify(pools));
      assert(!hasWounds(s.people[pid].body) && loadOf('6.5x40r', 'marking').woundK === 0 && loadOf('6.5x40r', 'marking').pen0Mm === 0, 'never wounds');
      assert(Lv.shots.length === T.live.fired && !Lv.shots.some(x => mine.has(x.id)), 'his rounds his');
    },
  },
  {
    name: 'opfor-fire: the spin\'s offset at 5 m is 2.8 cm at 120 m/s (COMBAT §25.10.4, PLACES §4.15); the marking round subsonic, no penetration, no wound, never a range\'s load',
    fn() {
      const s = createGame({ scenario: 'test-shoothouse', seed: 48213 }).state, sp = spinOf(s), env = envOfPlace(s, s.places.live.area, 29, 12);
      const L = loadOf('6.5x40r', 'marking'), P = loadOf('9x21r', 'marking'), rows = [];
      for (const d of [3, 5, 7, 10]) {
        const f = flight('6.5x40r', 'marking', 460, env, d), b = spinBiasCm(sp, { rangeM: d, vMs: f.vMs, bearingRad: 0 }), c = spinBiasCm(sp, { rangeM: d, vMs: 120, bearingRad: 0 });
        rows.push(`${d} m: ${fmt(f.vMs, 1)} m/s, ${b.cm} cm (at 120 m/s ${c.cm}), supersonic ${f.supersonic}`);
      }
      const f5 = flight('6.5x40r', 'marking', 460, env, 5), b5 = spinBiasCm(sp, { rangeM: 5, vMs: f5.vMs, bearingRad: 0 }), c5 = spinBiasCm(sp, { rangeM: 5, vMs: 120, bearingRad: 0 });
      const p5 = flight('9x21r', 'marking', 110, env, 5);
      console.log(`      the R-7's marking: ${rows.join('; ')}; the P-12's at 5 m ${fmt(p5.vMs, 1)} m/s, ${spinBiasCm(sp, { rangeM: 5, vMs: p5.vMs, bearingRad: 0 }).cm} cm; LIVE_LOADS ${JSON.stringify(LIVE_LOADS)}`);
      near(c5.cm, 2.8, 0.05, 'the closed form at 120 m/s');
      near(b5.cm, 2.8, 0.05, 'at the flown speed');
      assert(!f5.supersonic && L.pen0Mm === 0 && L.woundK === 0 && L.marking && L.range === false && P.vRefMs === 110 && !LIVE_LOADS['6.5x40r'].includes('marking') && !LIVE_LOADS['9x21r'].includes('marking'), JSON.stringify({ L, P }));
      near(inputPts('subsonic', { rM: 0.5 }), SUBSONIC_PTS, 1e-9, 'a near miss of marking');
    },
  },
  {
    name: 'opfor-fire: a strike the one rule rates fatal on you, or on your #2 (v0.0.20, combat/would.js), ends the lane \'casualty\' with the card within CASUALTY_MS plus a tick, never \'time\'; every strike before it a wound or a stop, and none after it (he ceases fire)',
    fn() {
      const w = underFire(), s = w.s, Lv = liveOf(w.g), pid = s.player.id;
      let downAt = null;
      for (let i = 0; i < 300 && !(Lv.casualty && (w.H.end || s.clock.ms > Lv.casualty.endAtMs + 2 * TICK_MS)); i++) { w.g.step(1, LEAVE); if (Lv.casualty && downAt === null) downAt = Lv.casualty.atMs; }
      const c = Lv.casualty, torso = Lv.struck.filter(x => x.who === c?.who && (x.zone === 'A' || x.zone === 'C')).length, head = Lv.struck.filter(x => x.who === c?.who && x.zone === 'head').length;
      const log = Lv.would.log.filter(x => x.on === c?.who), f = log.findIndex(x => x.fatal);
      console.log(`      the strikes on ${c?.who === pid ? 'you' : 'your #2'}: ${log.map(x => `${x.part}/${x.zone} ${x.layer} ${x.fatal ? `FATAL (${x.why})` : x.why ?? 'wound'}`).join(', ')}`);
      console.log(`      the casualty ${c ? `${c.who === pid ? 'you' : 'your #2'} by ${c.by}, ${torso} torso, ${head} head, why ${c.why}, at +0, its end at +${c.endAtMs - c.atMs} ms (CASUALTY_MS ${CASUALTY_MS})` : 'none'}; the lane's end ${w.H.end ? `${w.H.end.why} at +${w.H.end.atMs - c.atMs} ms` : 'none yet'}${w.hooked ? '' : ' (note: the lane\'s \'casualty\' end and its card are the house\'s hook, not merged here: the casualty\'s record is checked)'}`);
      assert(c && f >= 0 && f === log.length - 1 && c.shotId === log[f].shotId && c.why === log[f].why && c.endAtMs - c.atMs === CASUALTY_MS, JSON.stringify({ c, log }));
      // (after it he fires no more: the lane ceases fire)
      const fired = rp(w.g, '2a').live.fired;
      w.g.step(40, LEAVE);
      assert(rp(w.g, '2a').live.fired === fired, 'he ceased fire');
      if (w.hooked) assert(w.H.end?.why === 'casualty' && w.H.end.atMs - c.atMs <= CASUALTY_MS + TICK_MS, JSON.stringify(w.H.end));
    },
  },
  {
    name: 'opfor-fire: the live lane\'s kit: \'opfor-fof\' (the mask in its own slot, two magazines of ten marking) and \'house-fof\' (\'house-cqb\' with marking), the P-12\'s FOF_SIDEARM; a mask goes only in the mask slot; SLOTS stands, so every other kit\'s ids stand',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213 }), s = g.state, pid = s.player.id;
      const rpPid = 'p-test-rp';
      put(s, s.people, rpPid, { id: rpPid, name: { given: 'Test', family: 'Rp' } });
      const k = materialise(s, rpPid, 'opfor-fof'), kit = s.people[rpPid].kit, mask = s.items[kit.worn.mask];
      const view = kitView(s, rpPid), mags = k.magIds.map(id => s.items[id]);
      let refused = null, refused2 = null;
      try { move(s, kit.worn.mask, { pid: rpPid, slot: 'head' }); } catch (e) { refused = e.message; }
      try { move(s, k.containerIds[0], { pid: rpPid, slot: 'mask' }); } catch (e) { refused2 = e.message; }
      console.log(`      opfor-fof: worn ${JSON.stringify(kit.worn)}, the mask ${mask.model} (${CONTAINERS['fof-mask'].word}, ${CONTAINERS['fof-mask'].massKg} kg), magazines ${mags.map(m => `${m.n} ${m.load}`).join(', ')}, carried ${kitMassKg(s, rpPid)} kg, the I card's worn ${view.groups[0].items.map(x => x.word).join(', ')}; refused: "${refused}", "${refused2}"`);
      assert(mask?.type === 'mask' && mags.length === 2 && mags.every(m => m.n === 10 && m.load === 'marking') && view.groups[0].items.some(x => x.kind === 'mask'), JSON.stringify(kit.worn));
      assert(refused && refused2, 'the mask slot');
      // (the mask counted in what he carries: off and on the floor, 0.6 kg less)
      const m0 = kitMassKg(s, rpPid), maskId = kit.worn.mask;
      move(s, maskId, { ground: { area: s.places.live.area, x: 29, z: 13 } });
      const m1 = kitMassKg(s, rpPid);
      move(s, maskId, { pid: rpPid, slot: 'mask' });
      console.log(`      carried with the mask ${m0} kg, without ${m1} kg`);
      near(m0 - m1, CONTAINERS['fof-mask'].massKg, 0.011, 'the mask counted');
      const m2 = nextId(s, 'p');
      put(s, s.people, m2, { id: m2 });
      const h = materialise(s, m2, 'house-fof'), P = issueSidearm(s, m2, FOF_SIDEARM);
      const hm = h.magIds.map(id => s.items[id]), pm = P.magIds.map(id => s.items[id]);
      console.log(`      house-fof: ${hm.map(m => `${m.n} ${m.load}`).join(', ')}, worn ${Object.keys(s.people[m2].kit.worn).join(', ')}; the P-12 ${pm.map(m => `${m.n} ${m.load}`).join(', ')}; SLOTS ${SLOTS.join(', ')}; WORN_SLOTS ${WORN_SLOTS.join(', ')}`);
      assert(hm.length === 3 && hm.every(m => m.n === 10 && m.load === 'marking') && JSON.stringify(Object.keys(KIT_TEMPLATES['house-fof'].worn)) === JSON.stringify(Object.keys(KIT_TEMPLATES['house-cqb'].worn)), 'house-fof');
      assert(pm.every(m => m.n === 10 && m.load === 'marking'), 'the P-12\'s');
      // (v0.0.24 A: the mag boots' slot after the mask, so SLOTS and every kit's ids stand)
      assert(SLOTS.join() === 'carrier,head,sling,suit,ears,holster,thigh' && WORN_SLOTS.slice(SLOTS.length).join() === 'mask,boots', SLOTS.join());
      // (the standard issue walked in its order as before: the house's worn things carrier, sling, suit; its ids the pin's, tests/house-pin)
      const order = Object.keys(createGame({ scenario: 'test-shoothouse', seed: 48213 }).state.people[pid].kit.worn).join();
      console.log(`      house-cqb's worn, in the issue's order: ${order}`);
      assert(order === 'carrier,sling,suit,holster,thigh' || order === 'carrier,sling,suit', order);
    },
  },
];
