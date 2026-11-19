// OLYMPUS tests: the blast's line, one model for every burst (the build sheet v0.0.22 item 7, R1 a; WEAPONS §12.4; COMBAT §11.3).
//
// Before v0.0.22 burst.js gave every person the free field's peak at his distance whatever stood between, while the instructor's
// read of a practice grenade (practice.js readBurst) took CORNER_SHADOW_K 0.5 of it for a body with no line of sight: one quantity,
// two models. practice.js blastLine is now the one reader of fragLine's walls and closed leaves for a blast, read by both, so the
// stack on the wall beside the door, as drilled, takes half of its own G-11's peak. The cases: the hunt's lane (the boot recruit's
// short flash on 1489397426: 29.8 kPa and a 2.4 s stun before, 14.9 now); burst.js's peak equal to the practice read's at twelve
// places round room 1's door; the instructor on the catwalk over the walls, unchanged; a drawn house's corner room first, its stack
// round the jamb shielded. The heavy case is F78 over the kit lanes (tests/flawless-blast.mjs).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { burst, burstRoom } from '../src/sim/combat/burst.js';
import { readBurst, blastLine, fragLine } from '../src/sim/combat/practice.js';
import { peakKPa, STUN_KPA, CORNER_SHADOW_K } from '../src/sim/arms/blast.js';
import { DEVICES } from '../src/sim/arms/devices.js';
import { airAt } from '../src/sim/places/env.js';
import { houseCodeOf } from '../src/sim/scenes/assemble.js';
import { blastLanes, blastRows, blastFailing } from './flawless-blast.mjs';

const r1 = (x) => Math.round(x * 10) / 10, r2 = (x) => Math.round(x * 100) / 100;
const actorOf = (s, pid) => s.actors.list.find(a => a.who === pid);
/** The hunt's burst in room 1 on 1489397426 (the recruit's short flash: (29.257, 11.584)), and room 1's door's middle. */
const AT = Object.freeze([29.257, 11.584]), DOOR_MID = Object.freeze([29, 12]);

export default [
  {
    name: 'the boot recruit\'s own short flash at room 1 (seed 1489397426, the kit bot by the keys) puts 14.9 kPa on him round the jamb, no stun, no \'blast\' fault and no mark (the build sheet v0.0.22 item 7, R1 a: 29.8 kPa without the blast\'s line, a 2.4 s stun, the hunt of v0.0.18\'s kit-9)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier: 'recruit', setup: 'go', loadout: 'flash' }), pid = g.state.player.id, H = g.state.armoury.range.house;
      let line = null;
      runHouse(g, houseKitBot({ use: 'flash', base: 'keys' }), { maxMs: 20_000, each: (game) => { const st = game.state, b = (H.bursts ?? [])[0], me = actorOf(st, pid); if (b && !line) line = { ...blastLine(st, st.places.live.area, [b.x, b.z], [me.x, me.z]), rM: r2(Math.hypot(me.x - b.x, me.z - b.z)) }; } });
      const B = H.bursts?.[0], L0 = H.rooms[0], me = actorOf(g.state, pid), stun = me.combat?.stunUntilMs ?? null;
      console.log(`      the burst ${B?.model} at (${B?.x}, ${B?.z}), ${B?.kPa?.[pid]} kPa on you at ${line?.rM} m, the line ${line?.clear ? 'clear' : `round the jamb (k ${line?.k})`}; stunned ${stun !== null && stun > B?.atMs}; room 1 faults ${JSON.stringify(L0.faults.map(f => f.kind))}, marks ${JSON.stringify((L0.kit ?? []).filter(m => /^STACK /.test(m)))}`);
      assert(B?.model === 'g11' && B.x === AT[0] && B.z === AT[1] && B.kPa[pid] === 14.9 && line && !line.clear && line.k === CORNER_SHADOW_K, JSON.stringify({ B, line }));
      assert(!(stun > B.atMs) && !L0.faults.some(f => f.kind === 'blast') && !(L0.kit ?? []).some(m => /^STACK /.test(m)), JSON.stringify({ stun, faults: L0.faults, kit: L0.kit }));
    },
  },
  {
    name: 'one model: at twelve places round room 1\'s door, a G-11 bursting at the hunt\'s (29.257, 11.584) puts on a body by burst.js exactly what the instructor\'s read (practice.js readBurst) puts on him, half the free field\'s peak where a wall stands between (the build sheet v0.0.22 item 7, R1 a: burst.js gave the free field\'s at every one)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier: 'recruit', setup: 'go', loadout: 'flash' });
      g.step(2, {});
      const s = g.state, pid = s.player.id, me = actorOf(s, pid), area = s.places.live.area, room = burstRoom(s, area, AT[0], AT[1]);
      const W = DEVICES.g11.tntKg, air = airAt(s, area, AT[0], AT[1]), Pa = air?.vacuum ? 0 : air.pKpa;
      const rows = [];
      let k = 0;
      for (const rM of [1.0, 1.6]) for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3, p = [DOOR_MID[0] + rM * Math.cos(a), DOOR_MID[1] + rM * Math.sin(a)];
        me.x = p[0]; me.z = p[1];
        const out = burst(s, null, { id: `blast-line-${k}`, model: 'g11', x: AT[0], z: AT[1], byId: null, called: false });
        const read = readBurst(s, { burst: `blast-line-${k++}`, model: 'g11', x: AT[0], z: AT[1], room });
        const free = r1(peakKPa(W, Math.hypot(p[0] - AT[0], p[1] - AT[1]), Pa)), line = blastLine(s, area, AT, p);
        rows.push({ at: p.map(r2), clear: line.clear, burst: out.kPa[pid], read: read.stack.me.kPa, free });
      }
      console.log(`      ${rows.map(r => `(${r.at.join(', ')}) ${r.clear ? 'clear' : 'walled'}: burst ${r.burst}, read ${r.read}, free field ${r.free}`).join('; ')}`);
      const walled = rows.filter(r => !r.clear);
      assert(rows.every(r => r.burst === r.read) && walled.length >= 3 && rows.some(r => r.clear) && walled.every(r => r.burst < r.free), JSON.stringify(rows));
    },
  },
  {
    name: 'the instructor on the catwalk, over the walls\' 2.8 m, takes the free field\'s peak at his distance (the height apart counted): the blast\'s line leaves him clear where a wall stands between him and the burst on the plan (the build sheet v0.0.22 item 7, R1 a)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier: 'recruit', setup: 'go', loadout: 'flash' }), H = g.state.armoury.range.house;
      // (up on the catwalk: shoothouse.js chiefWalk lifts him there on his first walked tick, the lane's clock running)
      runHouse(g, houseKitBot({ use: 'flash', base: 'keys' }), { maxMs: 4_000 });
      const s = g.state, c = actorOf(s, H.chiefPid), area = s.places.live.area;
      // (a burst near him on the plan with a wall between: the first of a ring round where he stands, 1.5 to 3 m out, whose line to him meets one)
      let at = null;
      for (const rM of [1.5, 2, 2.5, 3]) for (let i = 0; i < 16 && !at; i++) { const p = [c.x + rM * Math.cos(i * Math.PI / 8), c.z + rM * Math.sin(i * Math.PI / 8)], f = fragLine(s, area, p, [c.x, c.z]); if (f.wall && burstRoom(s, area, p[0], p[1])) at = p.map(r2); }
      const W = DEVICES.g11.tntKg, air = airAt(s, area, at[0], at[1]), Pa = air?.vacuum ? 0 : air.pKpa;
      const out = burst(s, null, { id: 'blast-line-chief', model: 'g11', x: at[0], z: at[1], byId: null, called: false });
      const plan = fragLine(s, area, at, [c.x, c.z]), free = r1(peakKPa(W, Math.hypot(c.x - at[0], c.z - at[1], c.y ?? 0), Pa));
      console.log(`      the instructor at (${c.x}, ${c.z}), y ${c.y}; the burst at (${at.join(', ')}); the plan's line ${plan.wall ? 'through a wall' : plan.through.length ? 'through a leaf' : 'clear'}; ${out.kPa[H.chiefPid]} kPa on him, the free field ${free}`);
      assert(c.y >= 2.8 && (plan.wall || plan.through.length) && out.kPa[H.chiefPid] === free, JSON.stringify({ c: [c.x, c.z, c.y], plan, kPa: out.kPa[H.chiefPid], free }));
    },
  },
  {
    name: 'a drawn house, its corner room first (seed 4, "Cn275lc.Es245lc.Ks160pc"), and a house drawn from the eight rooms (seed 4, "Wn270lc.Qn205lc.Dn170pc": the long room, then the small room): the boot recruit\'s flashes put on him half the free field\'s peak where the jamb stands between, never a stun round it (the build sheet v0.0.22 §0 item 27: the blast\'s line reads the area it is given, never layout A\'s ids)',
    fn() {
      const out = [];
      for (const house of [{ draw: 'drawn' }, { rooms: 'all' }]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 4, tier: 'recruit', setup: 'go', loadout: 'flash', ...house }), pid = g.state.player.id, H = g.state.armoury.range.house;
        const code = houseCodeOf(g.state), rows = [];
        let nb = 0;
        runHouse(g, houseKitBot({ use: 'flash', base: 'keys' }), { maxMs: 60_000, each: (game) => {
          const st = game.state, area = st.places.live.area, bs = H.bursts ?? [];
          while (nb < bs.length) {
            const b = bs[nb++], me = actorOf(st, pid), line = blastLine(st, area, [b.x, b.z], [me.x, me.z]);
            const air = airAt(st, area, b.x, b.z), free = r1(peakKPa(DEVICES[b.model].tntKg, Math.hypot(me.x - b.x, me.z - b.z), air?.vacuum ? 0 : air.pKpa));
            rows.push({ room: b.room, rM: r2(Math.hypot(me.x - b.x, me.z - b.z)), clear: line.clear, kPa: b.kPa[pid], free });
          }
        } });
        out.push({ house: Object.keys(house)[0], code: String(code), rows });
      }
      for (const o of out) console.log(`      ${o.code}: ${o.rows.map(r => `${r.room} ${r.kPa} kPa at ${r.rM} m (${r.clear ? 'clear' : 'round the jamb'}, the free field ${r.free})`).join('; ')}`);
      const [drawn, eight] = out, shielded = (o) => o.rows.filter(r => !r.clear);
      assert(/^C/.test(drawn.code) && /^W[ns]\d+\w\w\.Q/.test(eight.code), JSON.stringify(out.map(o => o.code)));
      for (const o of out) assert(shielded(o).length > 0 && shielded(o).every(r => Math.abs(r.kPa - r1(r.free * CORNER_SHADOW_K)) <= 0.15) && o.rows.every(r => r.clear || r.kPa < STUN_KPA), JSON.stringify(o));
    },
  },
  {
    name: 'F78 (heavy): the stack\'s own grenade, over the kit lanes (the kit bot and T, every sheet, twelve seeds, the flash and full loadouts): none of yours over BREACH_SAFE_KPA on you or your #2 but a hand-back declined (the build sheet v0.0.22 §8)',
    heavy: true,
    timeoutMs: 1_200_000,
    fn() {
      const lanes = [...blastLanes(), ...blastLanes({ bots: ['fuzz'], seeds: [48214, 48216, 48218, 48220, 48224], loadouts: ['flash'] })];
      const rows = blastRows(lanes), f78 = rows.find(r => r.id === 'F78');
      console.log(`      F78 ${f78.met ? 'MET' : 'NOT MET'}: ${f78.value}`);
      console.log(`      lanes not to the card: ${lanes.filter(l => !l.done).map(l => l.lane).join(', ') || 'none'}`);
      assert(!blastFailing([f78]).length, blastFailing([f78]).join('; '));
    },
  },
];
