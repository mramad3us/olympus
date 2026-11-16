// OLYMPUS tests: a door's ways in by its swing and the kit, and the stack's safe points for a charge (COMBAT §25.5.6, §25.20; PLACES §1.6; the build sheet 0.0.18 §5.3; src/sim/combat/breach.js).
//
// The user, 2026-11-15: "doors should have a direction they open (pull or push) and it should affect our options for entry".
// Room 1, room 3 and the booth open away from the hall (push), room 2 toward it (pull), the closet is a push door from room 2,
// locked. Each test fails without breach.js.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { entryOptions, safePointsOf, chargePointOf, kitHas, NOT_ISSUED } from '../src/sim/combat/breach.js';
import { planOf, doorSwing } from '../src/sim/combat/bundle.js';
import { openingOf, areaOf, roomOf } from '../src/sim/places/model.js';
import { KICK_PULL_WHY, STACK_OFF_WALL_M } from '../src/sim/places/swing.js';
import { chargeFor, breachHowOf } from '../src/sim/combat/breach.js';
import { standoffM } from '../src/sim/arms/blast.js';
import { DEVICES } from '../src/sim/arms/devices.js';
import { HOUSE_CHIEF } from '../src/data/courses.js';

const house = (loadout = null) => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go', ...(loadout ? { loadout } : {}) });
const fmtO = (opts) => opts.map(o => `${o.id}${o.live ? '' : ` (${o.off})`}`).join(', ');

export default [
  {
    name: 'a door\'s entry options follow its swing and the kit (the user, 2026-11-15): room 1 and room 3 push (Open, Kick, Pry, Charge), room 2 pull (Open, Pry; Kick, Ram and Charge struck "opens toward you"), the closet locked (Open struck "locked", a charge not on an inner door), anything not carried struck "not issued"',
    fn() {
      const bad = [];
      for (const lo of ['standard', 'full', 'v1~front:mag2,mag2,dump~back:ram']) {
        const g = house(lo), s = g.state, pid = s.player.id, line = [];
        for (const d of ['o:w4:r1', 'o:w4:r2', 'o:w4:r3']) {
          const P = planOf(s, d), O = entryOptions(s, pid, P), get = (id) => O.find(o => o.id === id);
          line.push(`${d.slice(5)} ${doorSwing(s, P).how}: ${fmtO(O)}`);
          const pull = doorSwing(s, P).how === 'pull';
          if (!get('open').live) bad.push(`${lo} ${d} open`);
          if (pull && (get('kick').live || get('kick').off !== KICK_PULL_WHY)) bad.push(`${lo} ${d} kick`);
          if (!pull && !get('kick').live) bad.push(`${lo} ${d} kick on a push`);
          if (lo === 'standard' && (get('pry').off !== NOT_ISSUED || get('charge').off !== 'no charge issued' || get('flash').off !== NOT_ISSUED)) bad.push(`${lo} ${d} the kit`);
          if (lo === 'full' && (!get('pry').live || get('charge').live === pull || (pull && get('charge').off !== KICK_PULL_WHY) || !get('flash').live)) bad.push(`${lo} ${d} full`);
          if (lo.includes('ram') && (get('ram').live === pull || (pull && get('ram').off !== KICK_PULL_WHY))) bad.push(`${lo} ${d} ram`);
        }
        const P2 = planOf(s, 'o:w4:r2'), C = entryOptions(s, pid, { ...P2, door: 'o:w4:closet' }, { from: P2.room });
        line.push(`closet ${doorSwing(s, { ...P2, door: 'o:w4:closet' }, P2.room).how}: ${fmtO(C)}`);
        if (C.find(o => o.id === 'open').off !== 'locked' || (lo === 'full' && (!C.find(o => o.id === 'pry').live || C.find(o => o.id === 'charge').live))) bad.push(`${lo} the closet`);
        console.log(`      ${lo}: ${line.join(' | ')}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'the stack\'s safe points for a charge stand on the latch-side wall at least the stand-off from it, never across the hall from the door nor in line with it, inside the hall, for every lane door',
    fn() {
      const g = house('breach'), s = g.state, A = areaOf(s.places.live.area), bad = [], rows = [];
      for (const d of ['o:w4:r1', 'o:w4:r3']) {
        const P = planOf(s, d), sp = safePointsOf(s, P, 'sc1'), o = openingOf(d), sw = doorSwing(s, P), c = chargePointOf(s, P);
        const along = (p) => (o.axis === 'x' ? p[0] : p[1]), across = (p) => (o.axis === 'x' ? p[1] : p[0]);
        const latchDir = Math.sign(along(sw.latchXZ) - along(sw.hingeXZ)), side = Math.sign(across(P.stack[0]) - o.at);
        for (const [who, p] of [['#1', sp.one], ['#2', sp.two]]) {
          const dM = Math.hypot(p[0] - c[0], p[1] - c[1]), inLine = along(p) >= Math.min(o.a, o.b) && along(p) <= Math.max(o.a, o.b);
          const latchSide = Math.sign(along(p) - along(sw.latchXZ)) === latchDir, ourSide = Math.sign(across(p) - o.at) === side, wall = Math.abs(across(p) - o.at);
          const room = roomOf(A, p[0], p[1])?.id;
          rows.push(`${d.slice(5)} ${who} (${p.join(', ')}) ${fmt(dM, 2)} m from the charge, ${fmt(wall, 2)} m off the wall, ${sp.kPa[who === '#1' ? 'one' : 'two']} kPa`);
          if (dM < sp.standoffM - 0.001 || inLine || !latchSide || !ourSide || room !== 'w4.hall' || Math.abs(wall - STACK_OFF_WALL_M) > 0.01) bad.push(`${d} ${who}`);
        }
        if (sp.short) bad.push(`${d} short`);
      }
      console.log(`      stand-off ${fmt(safePointsOf(s, planOf(s, 'o:w4:r1')).standoffM, 2)} m: ${rows.join(' | ')}`);
      assert(!bad.length, bad.join('; '));
      assert(kitHas(s, s.player.id, 'charge') && kitHas(s, s.player.id, 'halligan') && !kitHas(s, s.player.id, 'flashbang') && !kitHas(s, s.player.id, 'ram'), 'the breach kit');
    },
  },
  // (v0.0.19, D2 (kit2 §6 tests 17 to 19; the build sheet 0.0.19 §0 items 1, 8, 9, §6))
  {
    name: 'room 2 opens toward you: with a BC-1 the cut is live on its hinge side, and the stack\'s safe points stand 3.18 m from the hinge edge down the latch-side wall, never across from the door nor in its line',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'cut' }), s = g.state, pid = s.player.id, P = planOf(s, 'o:w4:r2');
      const c = chargeFor(s, pid, P), sp = safePointsOf(s, P, c.model, { edge: c.side }), sw = doorSwing(s, P), opts = entryOptions(s, pid, P);
      const dOne = Math.hypot(sp.one[0] - sp.charge[0], sp.one[1] - sp.charge[1]);
      console.log(`      the charge ${c.model} on its ${c.side} side at ${sp.charge.join(', ')} (hinge ${sw.hingeXZ.join(', ')}); the stand-off ${sp.standoffM} m; #1 at ${sp.one.join(', ')} (${fmt(dOne, 2)} m, ${sp.kPa.one} kPa), the #2 at ${sp.two.join(', ')} (${sp.kPa.two} kPa); the ways ${opts.map(o => `${o.id}${o.off ? ` (${o.off})` : ''}`).join(', ')}`);
      assert(c.model === 'bc1' && c.side === 'hinge' && Math.abs(sp.standoffM - 3.18) < 0.005 && dOne >= sp.standoffM && sp.kPa.one < 27.6 && sp.kPa.two < 27.6, JSON.stringify({ c, sp }));
      assert(sp.one[1] === sp.two[1] && sp.one[0] > sw.latchXZ[0] && sp.two[0] > sp.one[0] && !sp.short, JSON.stringify(sp));
      assert(opts.find(o => o.id === 'cut')?.live && opts.find(o => o.id === 'charge')?.off === KICK_PULL_WHY, JSON.stringify(opts));
    },
  },
  {
    name: 'the SC-1 stays struck "opens toward you" on a pull door, carried beside a BC-1; on a push door the SC-1 is the charge (D1\'s), and the BC-1 only where no SC-1 is carried',
    fn() {
      const cut = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'cut' }), mixed = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'mixed' });
      const r = (g, d) => chargeFor(g.state, g.state.player.id, planOf(g.state, d));
      const o2 = entryOptions(cut.state, cut.state.player.id, planOf(cut.state, 'o:w4:r2')).find(o => o.id === 'charge');
      console.log(`      cut: room 1 ${JSON.stringify(r(cut, 'o:w4:r1'))}, room 2 ${JSON.stringify(r(cut, 'o:w4:r2'))} (its SC-1 row: ${o2.off}); mixed (no SC-1): room 1 ${JSON.stringify(r(mixed, 'o:w4:r1'))}`);
      assert(o2.off === KICK_PULL_WHY && r(cut, 'o:w4:r1').model === 'sc1' && r(cut, 'o:w4:r2').model === 'bc1' && r(mixed, 'o:w4:r1').model === 'bc1' && r(mixed, 'o:w4:r1').side === 'latch', 'chargeFor');
    },
  },
  {
    name: 'the BC-1\'s stand-off is 3.18 m in the Wheel\'s 66 kPa and 3.46 in a UN hull\'s 101.3 (blast.js standoffM at BREACH_SAFE_KPA 27.6), the env\'s own air read: less at the Mars datum\'s 52 kPa, the fireball\'s edge in vacuum',
    fn() {
      const at = (env) => { const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'cut', ...(env ? { env } : {}) }), s = g.state; return safePointsOf(s, planOf(s, 'o:w4:r2'), 'bc1').standoffM; };
      const v = { wheel: at(null), hull: at('earth-ship'), datum: at('mars-datum'), vacuum: at('freefall-vacuum') };
      console.log(`      the BC-1's stand-off: ${JSON.stringify(v)} m (the SC-1's in the Wheel ${standoffM(DEVICES.sc1.tntKg, 66)} m)`);
      assert(Math.abs(v.wheel - 3.178) < 0.002 && Math.abs(v.hull - 3.455) < 0.002 && v.datum < v.wheel && v.vacuum === 0.5, JSON.stringify(v));
    },
  },
  {
    name: 'a door\'s method: R.house.broken[door] is a ms on every way in, and D2\'s method is on R.house.breach[door].how ("cut" for the BC-1, "lock" or "hinge" for a shot breach); D1\'s charge and tools write nothing new (breachHowOf reads them "broken")',
    async fn() {
      const { runHouse } = await import('./bots/house.mjs'), { houseKitBot } = await import('./bots/kit.mjs');
      const out = {};
      for (const [use, lo] of [['cut', 'cut'], ['shoot', 'breach'], ['breach', 'breach']]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: lo });
        runHouse(g, houseKitBot({ use }), { maxMs: 10 * 60_000 });
        const H = g.state.armoury.range.house;
        out[use] = { broken: { ...(H.broken ?? {}) }, breach: Object.fromEntries(Object.entries(H.breach ?? {}).map(([d, b]) => [d, b.how])), how: Object.fromEntries(Object.keys(H.broken ?? {}).map(d => [d, breachHowOf(g.state, d)])) };
      }
      console.log(`      ${Object.entries(out).map(([u, o]) => `${u}: broken ${Object.entries(o.broken).map(([d, ms]) => `${d} ${typeof ms}`).join(', ')}; breach ${JSON.stringify(o.breach)}; how ${JSON.stringify(o.how)}`).join(' | ')}`);
      assert(Object.values(out).every(o => Object.values(o.broken).every(Number.isFinite)), JSON.stringify(out));
      assert(out.cut.breach['o:w4:r2'] === 'cut' && out.shoot.breach['o:w4:closet'] === 'lock' && !Object.keys(out.breach.breach).length && Object.values(out.breach.how).every(h => h === 'broken'), JSON.stringify(out));
    },
  },
  // (the review of v0.0.19's K, finding 3: chargeFor ignored the way chosen, so on a push door with both charges carried "Cut, clear
  // the room" placed and fired the SC-1, and Charge and Cut were one act under two names)
  {
    name: '"Cut, clear the room" at room 1 (a push door) on the cut loadout places and fires the BC-1 on its latch edge (R.house.breach how "cut") (the review of v0.0.19\'s K: it fired the SC-1); chargeFor by the way: "cut" the BC-1, "charge" the SC-1',
    timeoutMs: 120_000,
    async fn() {
      const { runHouse, houseHonestBot } = await import('./bots/house.mjs'), { stepAct } = await import('./bots/lib.mjs'), { stepsOf } = await import('../src/sim/arms/shooting.js'), { doorNow } = await import('../src/sim/combat/bundle.js');
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'cut' }), s = g.state, pid = s.player.id, said = [];
      g.bus.on?.('say', (f) => said.push(f.text));
      const ways = { cut: chargeFor(s, pid, planOf(s, 'o:w4:r1'), 'cut'), charge: chargeFor(s, pid, planOf(s, 'o:w4:r1'), 'charge') };
      const inner = houseHonestBot(), seen = [];
      let pressed = null, n = 0;
      const bot = (st, me, mem) => {
        const S = st.stop;
        if (!pressed && S?.mode === 'stop' && S.phase === 'choose' && !S.reflex && doorNow(st, pid)?.door === 'o:w4:r1') {
          const rows = stepsOf(st), r = rows.find(x => /^drill:room:clear@cut>o:w4:r1$/.test(x.id) && !x.off);
          if (r) { pressed = r.label; return { act: [stepAct(r.id)] }; }
          const v = rows.find(x => x.id === 'drill:variant:breach');
          if (v && n++ < 8) { seen.push(v.label); return { act: [stepAct(v.id)] }; }
        }
        return inner(st, me, mem);
      };
      runHouse(g, bot, { maxMs: 10 * 60_000 });
      const H = s.armoury.range.house, B1 = (H.bursts ?? []).filter(b => b.door === 'o:w4:r1').map(b => b.model);
      const cutSaid = said.filter(t => [...HOUSE_CHIEF.cut, ...HOUSE_CHIEF.cutLatch].includes(t));
      console.log(`      chargeFor at room 1 by the way: ${JSON.stringify(ways)}; the variant ${seen.join(' → ')}; pressed "${pressed}"; room 1's bursts ${B1.join(', ')}, its breach ${JSON.stringify(H.breach?.['o:w4:r1'] ?? null)}; the instructor ${cutSaid.join(' / ')}; the lane ${H.end?.why}`);
      assert(ways.cut?.model === 'bc1' && ways.cut.side === 'latch' && ways.charge?.model === 'sc1', JSON.stringify(ways));
      assert(pressed && B1.join() === 'bc1' && H.breach?.['o:w4:r1']?.how === 'cut' && HOUSE_CHIEF.cutLatch.includes(cutSaid[0]) && cutSaid.slice(1).every(t => HOUSE_CHIEF.cut.includes(t)), JSON.stringify({ pressed, B1, breach: H.breach, cutSaid }));
    },
  },
];
