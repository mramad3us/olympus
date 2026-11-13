// OLYMPUS tests: the shoot house's number two as doctrine has him (COMBAT §25.19.5, §25.19.3.4, §25.19.6; the rework's R5): the tower's commands done by him and drawn, Condition 4 at the fill, his entry behind you by distance, the body gap, going to the next stack with you, his own top up and his calls, his cover of your sector while your rifle is down.
//
// What each test pins, each failing without its fix (2026-11-12, the rework's R5):
//   - the fill issues him in Condition 4 (his magazines in his pouches, the chamber empty, on safe): v0.0.12 loaded him there;
//   - LOAD and MAKE READY are his own Corps macros (drills.js MACROS through stepper.js advanceList), begun at the command plus
//     his react.js goMs, each sub-step drawn as yours is (shoothouse.js handsOf, look.js gunLook's action frame), and the tower
//     waits on him (houseWant names his want: "Number two, a round up.");
//   - UNLOAD, SHOW CLEAR is his too: the instructor says "Number two, clear." and the hot wash waits for it;
//   - his entry is cued by distance (bundle.js entryGo, entryAhead): he crosses his own threshold waypoint only once you are
//     ENTRY_GAP_M past yours (v0.0.12 cued him on your first step into the doorway, a shared waypoint: through you 1.8 s a lane);
//   - the body gap (BODY_GAP_M) is never broken by T, and the guard never has to hold him (the cue and the departure are right);
//   - he goes to the next stack with you (bundle.js leadGone, giveWay): never before your own move starts (v0.0.12 left on a
//     poll the moment the room was clear and stood on your way to your stack);
//   - his own top up on the way, half or less of his load believed and a fuller magazine at hand: "Reloading!", then "Up.";
//   - with your rifle down (the reflex card, IMMEDIATE ACTION) he says "Covering!", and "Up." once it is back;
//   - his own rifle stopped on his man (2026-11-13): "Gun down!", his drill on his hands (IMMEDIATE ACTION, REMEDIAL for a
//     double feed, a speed reload on an empty), "Gun up!", back on the man, and the room's "Clear!" waits on him (v0.0.13's #2
//     pressed a jammed rifle six times and the room was called clear over his man: seed 2073, the tier one, room 3);
//   - you never walk through him (move.js useBodies, BODY_GAP_M; 2026-11-13): your keys into his body stop at the gap, the
//     way back always open (the fuzz bot's lanes in v0.0.13's tree: 0.00 m, 10.6 s a lane under the gap).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot, houseKeysBot } from './bots/house.mjs';
import { flawlessLane, flawlessSeeds, BODY_GAP_M } from './flawless.mjs';
import { houseWant, handsOf, twoLacks, twoDrillOf, TWO_CMDS } from '../src/sim/scenarios/shoothouse.js';
import { ENTRY_GAP_M, pastWaypointM, TWO_SAY, TWO_SLOT_M } from '../src/sim/combat/bundle.js';
import { lanePlanOf, pastThreshold } from '../src/sim/combat/room.js';
import { sparesOf } from '../src/sim/arms/kit.js';
import { gunField, beliefOf } from '../src/sim/arms/firearms.js';
import { subsOf } from '../src/sim/arms/drills.js';
import { gunLook } from '../src/sim/arms/look.js';

const twoOf = (s) => s.armoury.range.house.two;
const twoActor = (s) => s.actors.list.find(a => a.who === twoOf(s).pid);
const meOf = (s) => s.actors.list.find(a => a.who === s.player.id);
const twoRifle = (s) => s.items[s.people[twoOf(s).pid].kit.worn.sling];

export default [
  {
    name: 'the fill issues your number two in Condition 4, as you are: his magazines in his pouches, the chamber empty, on safe (COMBAT §25.19.5: "not loaded at the fill"; v0.0.12 loaded him there)',
    fn() {
      for (const tier of ['recruit', 'tierone']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier }), s = g.state, gun = twoRifle(s), pid = twoOf(s).pid;
        const mags = sparesOf(s, pid, null).filter(id => (s.items[id]?.n ?? 0) > 0);
        console.log(`      ${tier}: his rifle ${gun.mag ? 'a magazine in' : 'no magazine'}, chamber ${gunField(gun, 'chamber') ?? 'empty'}, ${gunField(gun, 'mode')}; ${mags.length} magazines in his pouches (${mags.map(id => s.items[id].n).join(', ')} rounds)`);
        assert(!gun.mag && !gunField(gun, 'chamber') && gunField(gun, 'mode') === 'safe' && mags.length === 3, JSON.stringify({ tier, mag: gun.mag, chamber: gunField(gun, 'chamber'), mode: gunField(gun, 'mode'), mags: mags.length }));
      }
    },
  },
  {
    name: 'LOAD and MAKE READY are his own macros at the command plus his start, each sub-step the macro\'s and drawn as yours (handsOf, gunLook\'s frame); the tower waits on him ("Number two, …") and GO finds him in Condition 1, low ready (COMBAT §25.19.5\'s table)',
    fn() {
      for (const tier of ['private', 'tierone']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier }), s = g.state, pid = twoOf(s).pid;
        const seen = {}, wants = new Set(), frames = new Set();
        let atGo = null;
        runHouse(g, houseHonestBot(), { maxMs: 60_000, each: (game) => {
          const st = game.state, R = st.armoury.range, W = twoOf(st), d = W.doing;
          if (d && !d.beats) {
            const c = seen[d.cmd] ??= { cmdAtMs: R.cmd?.atMs ?? null, fromMs: d.fromMs, list: [...d.list], macro: subsOf(TWO_CMDS[d.cmd], beliefOf(st, st.people[pid].kit.worn.sling)) };
            c.lived = d.subs.reduce((t, x) => t + x.ms, 0);
            const h = handsOf(st, pid), L = gunLook(st, twoActor(st));
            if (h?.action && L?.action?.frame) frames.add(`${h.action}:${L.action.frame}`);
          }
          if (R.cmd?.id === 'ready' && st.armoury.range.house.goAtMs === null) { const w = houseWant(st); if (w?.startsWith('two')) wants.add(w); }
          if (atGo === null && st.armoury.range.house.goAtMs !== null) { const gun = twoRifle(st); atGo = { mag: !!gun.mag, chamber: gunField(gun, 'chamber'), mode: gunField(gun, 'mode'), posture: st.people[pid].kit.carry.posture, lacks: twoLacks(st, 'ready') }; }
        } });
        const L = seen.load, M = seen.ready;
        console.log(`      ${tier}: LOAD from +${fmt((L.fromMs - L.cmdAtMs) / 1000, 2)} s, ${L.list.join(' ')} (${fmt(L.lived / 1000, 2)} s lived); MAKE READY from +${fmt((M.fromMs - M.cmdAtMs) / 1000, 2)} s, ${M.list.join(' ')}; drawn ${[...frames].join(', ')}; the tower's wants of him ${[...wants].join(', ') || 'none'}; at GO ${JSON.stringify(atGo)}`);
        assert(L && M && L.fromMs > L.cmdAtMs && L.fromMs - L.cmdAtMs <= 300 && L.list.join() === L.macro.join() && M.list.slice(0, M.macro.length).join() === M.macro.join(), JSON.stringify({ L, M }));
        assert(frames.size >= 2 && [...frames].some(f => f.startsWith('seat') || f.startsWith('reach')) && [...frames].some(f => f.startsWith('charge')), JSON.stringify([...frames]));
        // (the tier one carries the P-12 from the rework's R6, and his MAKE READY racks it too (COMBAT §25.19.6): his own is then the
        // longer, so the tower need not wait on his #2; the private's still does)
        assert((wants.size > 0 || tier === 'tierone') && atGo && atGo.mag && atGo.chamber === 'live' && atGo.mode === 'safe' && atGo.posture === 'lowReady' && atGo.lacks === null, JSON.stringify({ wants: [...wants], atGo }));
      }
    },
  },
  {
    name: 'Stop and UNLOAD, SHOW CLEAR go to both marines: his rifle made safe, then shown clear to the instructor ("Number two, clear."), Condition 4, before the hot wash (COMBAT §25.19.5: "SHOW CLEAR ends when both are shown")',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'hall' }), s = g.state;
      let saidAt = null, washAt = null, clearList = null;
      runHouse(g, houseHonestBot(), { maxMs: 6 * 60_000, each: (game) => {
        const st = game.state, R = st.armoury.range, W = twoOf(st);
        if (W.doing?.cmd === 'clear') clearList = [...W.doing.list];
        for (const f of game.facts('say')) if (/^Number two[,:] clear\.$/.test(f.text ?? '') && saidAt === null) saidAt = st.clock.ms;
        if (R.cmd?.id === 'wash' && washAt === null) washAt = st.clock.ms;
      } });
      const gun = twoRifle(s);
      console.log(`      his SHOW CLEAR: ${clearList?.join(' ')}; "Number two, clear." at ${saidAt === null ? 'never' : 'the show'}, the hot wash ${washAt === null ? 'never' : `${fmt((washAt - saidAt) / 1000, 2)} s after`}; his rifle ${gun.mag ? 'a magazine in' : 'no magazine'}, chamber ${gunField(gun, 'chamber') ?? 'empty'}, ${gunField(gun, 'mode')}`);
      assert(clearList?.includes('show') && saidAt !== null && washAt !== null && washAt >= saidAt && !gun.mag && !gunField(gun, 'chamber') && gunField(gun, 'mode') === 'safe', JSON.stringify({ clearList, saidAt, washAt }));
    },
  },
  {
    name: 'his entry is cued by distance: by T he crosses his threshold only once you are ENTRY_GAP_M past your own waypoint, every door, on the sergeant and the tier one; behind a recruit or a private who stops in the doorway by the keys he waits, never through you (COMBAT §25.19.3.4; v0.0.12 cued him on your first step into the doorway: 0.30 m beside a private standing in it)',
    timeoutMs: 120_000,
    fn() {
      const rows = [];
      for (const [tier, bot] of [['sgt', 'honest'], ['tierone', 'honest'], ['recruit', 'keys'], ['private', 'keys']]) for (const seed of flawlessSeeds(bot === 'keys' ? 2 : 3)) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), lane = lanePlanOf(g.state), crossed = {};
        runHouse(g, bot === 'keys' ? houseKeysBot() : houseHonestBot(), { maxMs: 4 * 60_000, each: (game) => {
          const st = game.state, H = st.armoury.range.house, a = twoActor(st), me = meOf(st);
          for (const door of lane.order) {
            const P = lane.plans[door];
            if (crossed[door] || !P.door || !pastThreshold(P, a.x, a.z)) continue;
            crossed[door] = { m: pastWaypointM(P, me.x, me.z), gap: Math.hypot(a.x - me.x, a.z - me.z), leg: H.cur };
          }
        } });
        for (const [door, c] of Object.entries(crossed)) rows.push({ tier, bot, seed, door, m: c.m, gap: c.gap });
      }
      const t = rows.filter(r => r.bot === 'honest'), k = rows.filter(r => r.bot === 'keys'), least = Math.min(...t.map(r => r.m ?? -Infinity)), close = Math.min(...k.map(r => r.gap));
      console.log(`      by T, ${t.length} entries: at his threshold you were ${t.map(r => fmt(r.m, 2)).join(', ')} m past yours (least ${fmt(least, 2)}; ENTRY_GAP_M ${ENTRY_GAP_M}, a tick's walk at the lope less allowed)`);
      console.log(`      by the keys, ${k.length} entries: at his threshold he was ${k.map(r => fmt(r.gap, 2)).join(', ')} m from you (least ${fmt(close, 2)}; BODY_GAP_M ${BODY_GAP_M})`);
      assert(t.length >= 15 && least >= ENTRY_GAP_M - 0.15, JSON.stringify(t.filter(r => !(r.m >= ENTRY_GAP_M - 0.15))));
      assert(k.length >= 8 && close >= BODY_GAP_M, JSON.stringify(k.filter(r => !(r.gap >= BODY_GAP_M))));
    },
  },
  {
    name: 'the body gap by T: you and your number two never closer than BODY_GAP_M centre to centre on the corporal, the sergeant, the Raider and the tier one, and the guard never has to hold him (COMBAT §25.19.8 F2: v0.0.12 0.00 m, 3.46 s a lane under 0.5 m)',
    timeoutMs: 180_000,
    fn() {
      const out = [];
      for (const tier of ['cpl', 'sgt', 'raider', 'tierone']) for (const seed of flawlessSeeds(2)) { const r = flawlessLane({ tier, seed }); out.push({ tier, seed, min: r.gap.minM, under: r.gap.underMs, guard: r.gap.guard }); }
      console.log(`      ${out.map(o => `${o.tier} ${o.seed} ${fmt(o.min, 2)} m${o.guard.holds ? ` (held ${o.guard.holds}, ${o.guard.ms} ms)` : ''}`).join(' · ')}`);
      assert(out.every(o => o.min >= BODY_GAP_M && o.under === 0 && o.guard.holds === 0), JSON.stringify(out.filter(o => !(o.min >= BODY_GAP_M && o.under === 0 && o.guard.holds === 0))));
    },
  },
  {
    name: 'he goes to the next stack with you: his walk there never starts before your own, and he stands within TWO_SLOT_M of his slot when you are stacked (COMBAT §25.19.5: "the tick yours starts"; v0.0.12 left the moment the room was clear)',
    timeoutMs: 120_000,
    fn() {
      const rows = [];
      for (const tier of ['private', 'tierone']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go' }), pid = g.state.player.id, two = twoOf(g.state).pid, mine = {}, his = {}, lane = lanePlanOf(g.state), slot = {};
        runHouse(g, tier === 'private' ? houseKeysBot() : houseHonestBot(), { maxMs: 4 * 60_000, each: (game) => {
          const st = game.state, H = st.armoury.range.house, P = lane.plans[lane.order[H.cur]], me = meOf(st), a = twoActor(st);
          // (where he stands from his slot the first tick you stand on your stack (F17's STACK_AT_M 0.4))
          if (P?.door && slot[H.cur] === undefined && Math.hypot(me.x - P.stack[0][0], me.z - P.stack[0][1]) <= 0.4) slot[H.cur] = Math.hypot(a.x - P.stack[1][0], a.z - P.stack[1][1]);
          for (const f of game.facts('bundle')) {
            if (f.phase !== 'beat' || f.beat !== 'approach') continue;
            const door = String(f.id).split('>')[1];
            if (f.who === pid) mine[door] ??= f.atMs; else if (f.who === two) his[door] ??= f.atMs;
          }
        } });
        for (const door of Object.keys(his)) rows.push({ tier, door, mine: mine[door] ?? null, his: his[door], lead: mine[door] === undefined ? null : his[door] - mine[door], slotM: slot[lane.order.indexOf(door)] ?? null });
      }
      console.log(`      his walk to each stack after yours: ${rows.map(r => `${r.tier} ${r.door.replace('o:w4:', '')} ${r.lead === null ? 'you by the keys' : `+${fmt(r.lead / 1000, 2)} s`}${r.slotM === null ? '' : `, ${fmt(r.slotM, 2)} m off his slot as you stack`}`).join(' · ')}`);
      assert(rows.length >= 4 && rows.filter(r => r.lead !== null).every(r => r.lead >= 0) && rows.every(r => r.slotM === null || r.slotM <= TWO_SLOT_M), JSON.stringify(rows));
    },
  },
  {
    name: 'his own top up: half or less of his load believed in, a fuller magazine at hand, he tops up on his way to the stack ("Reloading!", then "Up."), Condition 1 with the fuller one (COMBAT §25.19.5, FM 3-06.11 §3-22c(11))',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), s = g.state, gun = twoRifle(s), mag = s.items[gun.mag];
      // (four left of his ten, as after two pairs, believed so)
      mag.n = 4; gun.belief = { ...gun.belief, count: 4, fullN: 10 };
      const before = gun.mag;
      const says = [];
      runHouse(g, houseHonestBot(), { maxMs: 8000, each: (game) => { for (const f of game.facts('say')) if (f.who === twoOf(game.state).pid) says.push(f.text); } });
      const after = twoRifle(s).mag;
      console.log(`      his calls ${says.join(' ')}; his magazine ${before} (4) then ${after} (${s.items[after]?.n}), chamber ${gunField(twoRifle(s), 'chamber')}`);
      assert(says.includes(TWO_SAY.reloading) && says.indexOf(TWO_SAY.up) > says.indexOf(TWO_SAY.reloading) && after !== before && s.items[after].n > 4 && gunField(twoRifle(s), 'chamber') === 'live', JSON.stringify({ says, before, after }));
    },
  },
  {
    name: 'your rifle down (the dummy\'s click, its IMMEDIATE ACTION): your number two says "Covering!" and "Up." once it is back, on every T sheet; a man of yours he takes then is his by the rule (COMBAT §25.19.6)',
    timeoutMs: 120_000,
    fn() {
      const rows = [];
      for (const tier of ['cpl', 'sgt', 'raider', 'tierone']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier, setup: 'go' }), says = [];
        let click = null;
        runHouse(g, houseHonestBot(), { maxMs: 4 * 60_000, each: (game) => {
          const st = game.state, H = st.armoury.range.house;
          if (click === null && H.dummy.clickAtMs !== null) click = H.dummy.clickAtMs;
          for (const f of game.facts('say')) if (f.who === H.two.pid && (f.text === TWO_SAY.covering || f.text === TWO_SAY.up)) says.push({ text: f.text, atMs: st.clock.ms });
        } });
        const cov = says.find(x => x.text === TWO_SAY.covering), up = says.find(x => x.text === TWO_SAY.up && cov && x.atMs > cov.atMs);
        rows.push({ tier, click, cov: cov ? cov.atMs - click : null, up: up ? up.atMs - click : null, covered: twoOf(g.state).covered ?? [] });
      }
      console.log(`      from the click: ${rows.map(r => `${r.tier} "Covering!" +${fmt(r.cov / 1000, 2)} s, "Up." +${fmt(r.up / 1000, 2)} s${r.covered.length ? `, took ${r.covered.join(', ')}` : ''}`).join(' · ')}`);
      assert(rows.every(r => r.click !== null && r.cov !== null && r.cov >= 0 && r.cov <= 1000 && r.up !== null && r.up > r.cov), JSON.stringify(rows));
    },
  },
  {
    name: 'his own rifle stopped on his man: "Gun down!", his drill on his hands (a stovepipe IMMEDIATE ACTION, a double feed REMEDIAL ACTION, an empty a speed reload), "Gun up!", back on the man and him down, the room\'s "Clear!" after (COMBAT §25.19.5; v0.0.13 pressed a jammed rifle six times and called the room clear over his man)',
    timeoutMs: 60_000,
    fn() {
      const rows = [];
      for (const [kind, put] of [['stovepipe', (gun) => { gun.chamber = 'case'; }], ['double', (gun) => { gun.chamber = 'case'; gun.jam = 'double'; }], ['empty', (gun, s) => { s.items[gun.mag].n = 0; delete gun.chamber; }]]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'room:3' }), s = g.state, gun = twoRifle(s), pid = twoOf(s).pid;
        put(gun, s);
        const drill = twoDrillOf(s, gun), says = [], lists = new Set(), drawn = new Set();
        let man = null, clearAt = null, downAt = null;
        runHouse(g, houseHonestBot(), { maxMs: 40_000, each: (game) => {
          const st = game.state, H = st.armoury.range.house, W = H.two;
          for (const f of game.facts('say')) if (f.who === pid) says.push(f.text);
          for (const f of game.facts('house')) if (f.phase === 'clear' && f.room === 'w4.r3' && clearAt === null) clearAt = st.clock.ms;
          if (W.down && downAt === null) { downAt = st.clock.ms; man = W.down.key; }
          if (W.doing?.cmd === 'down') { lists.add(W.doing.macro); const h = handsOf(st, pid); if (h?.action) drawn.add(h.action); }
        } });
        const H = s.armoury.range.house, T = s.armoury.range.turners.find(x => x.key === man), faults = H.rooms[2]?.faults?.map(f => f.kind) ?? [];
        rows.push({ kind, drill, lists: [...lists], drawn: [...drawn], says: says.filter(t => /Gun|Reload|Up/.test(t)), man, down: T?.stoppedAtMs ?? null, clearAt, faults, gun: { chamber: gunField(twoRifle(s), 'chamber'), jam: gunField(twoRifle(s), 'jam') ?? null } });
      }
      for (const r of rows) console.log(`      ${r.kind}: his drill ${r.lists.join(' then ')} (${r.drawn.join(' ')}); he said ${r.says.join(' ')}; his man ${r.man} ${r.down !== null ? `down ${fmt((r.clearAt - r.down) / 1000, 2)} s before "Clear!"` : 'up'}; room 3's faults ${r.faults.join(', ') || 'none'}`);
      assert(rows.every(r => r.man && r.lists[0] === r.drill && r.down !== null && r.clearAt !== null && r.clearAt >= r.down && !r.faults.includes('standing') && r.says.some(t => t === TWO_SAY.gunUp || t === TWO_SAY.up)), JSON.stringify(rows));
      assert(rows.find(r => r.kind === 'stovepipe').drill === 'ia' && rows.find(r => r.kind === 'double').drill === 'remedial' && rows.find(r => r.kind === 'empty').drill === 'reload:speed', JSON.stringify(rows.map(r => [r.kind, r.drill])));
      assert(rows.filter(r => r.kind !== 'empty').every(r => r.says.includes(TWO_SAY.gunDown)) && rows.find(r => r.kind === 'empty').says.includes(TWO_SAY.reloading), JSON.stringify(rows.map(r => r.says)));
    },
  },
  {
    name: 'you never walk through him: the keys into your number two\'s body stop at BODY_GAP_M, in Relaxed and in Combat, and the step away is always taken (COMBAT §25.19.8 F2 on every bot; the fuzz bot walked through him: 0.00 m)',
    fn() {
      const rows = [];
      for (const stance of ['relaxed', 'combat']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone' }), s = g.state, me = meOf(s), two = twoActor(s);
        me.moveStance = stance;
        const toward = Math.sign(two.x - me.x) || 1, d0 = Math.hypot(two.x - me.x, two.z - me.z);
        let least = Infinity;
        for (let i = 0; i < 40; i++) { g.step(1, { mx: toward, mz: 0 }); least = Math.min(least, Math.hypot(two.x - me.x, two.z - me.z)); }
        const at = Math.hypot(two.x - me.x, two.z - me.z);
        for (let i = 0; i < 20; i++) g.step(1, { mx: -toward, mz: 0 });
        rows.push({ stance, d0, least, at, back: Math.hypot(two.x - me.x, two.z - me.z) });
      }
      console.log(`      ${rows.map(r => `${r.stance}: from ${fmt(r.d0, 2)} m, the least ${fmt(r.least, 3)} m, then ${fmt(r.back, 2)} m after 1 s of the keys away`).join(' · ')}`);
      assert(rows.every(r => r.least >= BODY_GAP_M - 1e-9 && r.least <= BODY_GAP_M + 0.15 && r.back > r.at + 0.3), JSON.stringify(rows));
    },
  },
];
