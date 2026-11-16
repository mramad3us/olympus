// OLYMPUS tests: the practice frag in "Stack and clear" (kit2 §2.4, §6 tests 26 to 28; the build sheet 0.0.19 §0 items 2, 19, "What the user must feel"): "Frag out!", the stack on the wall, the burst, room 1's men turned away by the instructor's hand, the entry on the bang; in the room at the burst a cease fire; a frag into room 3 the hostage fragged.
//
// The lanes are the honest kit bot's (tests/bots/kit.mjs, use 'frag': a practice frag only where the brief said hostiles only)
// on seed 48213, where room 1 is hostiles only, and the frag loadout (two G-9Ps); each fails without the read, its application
// or the fault it names.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { stepAct } from './bots/lib.mjs';
import { runSheetOf, legWords } from '../src/sim/scenarios/shoothouse.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { HOUSE_CHIEF } from '../src/data/courses.js';
import { BANG_LATE_MS } from '../src/sim/combat/burst.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { playerActor } from '../src/core/ids.js';
import { intelWords } from '../src/sim/scenarios/house-kit.js';
import { houseKeysBot } from './bots/house.mjs';
import { SLIP_WORDS } from '../src/sim/combat/bundle.js';
import { setSt } from '../src/sim/arms/devices.js';
import { move as kitMove } from '../src/sim/arms/kit.js';
import { setOpening } from '../src/sim/places/model.js';

const lane = (tier, o = {}) => createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go', loadout: 'frag', ...o });
const choose = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex;

export default [
  {
    name: '"Frag, clear the room" at room 1 on a hostiles-only seed, from the corporal up: the brief\'s intelligence, "Frag out!", the stack on the wall, the burst, 1a and 1b turned away by the instructor ("Good frag."), the entry within 2 s of the burst, no fault',
    timeoutMs: 120_000,
    fn() {
      const out = [];
      for (const tier of ['cpl', 'sgt', 'tierone']) {
        const g = lane(tier), said = [];
        g.bus.on?.('say', (f) => said.push(f.text));
        const r = runHouse(g, houseKitBot({ use: 'frag' }), { maxMs: 10 * 60_000 }), s = g.state, H = s.armoury.range.house;
        const B = H.bursts.find(b => b.model === 'g9p'), L = H.rooms[0], T = s.armoury.range.turners.filter(t => t.room === 'w4.r1');
        out.push({ tier, done: r.done, end: H.end?.why, intel: H.intel?.['o:w4:r1'], call: said.includes('Frag out!'), good: said.some(t => /^(Good frag|That frag did its work)/.test(t)), brief: intelWords(s),
          stack: B?.read?.stack, down: T.map(t => `${t.stand} ${t.downBy ?? '-'} ${t.stoppedAtMs === B?.atMs}`), entryMs: L.enteredAtMs - (B?.atMs ?? 0), faults: L.faults.map(f => f.kind), row: runSheetOf(s).rows[0].words });
      }
      for (const o of out) console.log(`      ${o.tier}: ${o.done ? 'to the card' : 'NOT done'} (${o.end}); room 1 ${o.intel}; "Frag out!" ${o.call}, "Good frag." ${o.good}, the brief's words "${o.brief.trim()}"; the stack ${JSON.stringify(o.stack)}; ${o.down.join(', ')}; in ${fmt(o.entryMs / 1000, 2)} s after the burst; faults ${o.faults.join() || 'none'}\n        ${o.row}`);
      assert(out.every(o => o.done && o.end === 'clear' && o.intel === 'hostiles' && o.call && o.good && /room 1/.test(o.brief) && /hostiles only/i.test(o.brief) && o.down.every(d => / g9 true$/.test(d)) && o.entryMs >= 0 && o.entryMs <= BANG_LATE_MS && !o.faults.length), JSON.stringify(out));
      assert(out.every(o => o.stack.me.n === 0 && o.stack.two.n === 0 && o.stack.me.kPa < 27.6 && o.stack.two.kPa < 27.6), JSON.stringify(out.map(o => o.stack)));
    },
  },
  {
    name: 'entering before the burst is a cease fire: "In the room at the burst", the lane\'s end and its card (fails without the stack\'s read)',
    timeoutMs: 60_000,
    fn() {
      // (the sergeant throws by "Frag it" at room 1's door, then walks straight in by the keys while it burns)
      const g = lane('sgt'), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans['o:w4:r1'];
      let phase = 0;
      for (let i = 0; i < 6000 && !H.end; i++) {
        g.step(1, (state) => {
          if (phase === 0 && choose(state)) { const r = stepsOf(state).find(x => /^drill:stack:/.test(x.id)); if (r) { phase = 1; return { act: [stepAct(r.id)] }; } }
          if (phase === 1 && choose(state)) { const r = stepsOf(state).find(x => /^drill:door:frag/.test(x.id) && !x.off); if (r) { phase = 2; return { act: [stepAct(r.id)] }; } }
          // (the grenade on the floor: you step in, past the door, before it goes)
          if (phase === 2 && Object.values(state.items).some(x => x.model === 'g9p' && x.st === 'live' && x.flight)) { phase = 3; const me = playerActor(state); me.x = me.$px = 29.0; me.z = me.$pz = 10.4; }
          // (and out of stop motion, the clock running to the burst)
          if (phase === 3 && choose(state)) return { act: [stepAct('leave')] };
          return {};
        });
      }
      const B = H.bursts.find(b => b.model === 'g9p'), sheet = runSheetOf(s);
      console.log(`      the burst at ${B?.x}, ${B?.z}; you ${JSON.stringify(B?.read?.stack?.me)}; the lane's end ${JSON.stringify(H.end)}; the card: ${sheet.card}; one thing: ${sheet.one.text}`);
      assert(H.end?.why === 'burst' && /^CEASE FIRE: IN THE ROOM AT THE BURST/.test(sheet.card) && H.rooms[0].faults.some(f => f.kind === 'burst') && sheet.one.key === 'burst', JSON.stringify({ end: H.end, card: sheet.card, one: sheet.one }));
    },
  },
  {
    name: 'a frag in room 3 writes "FRAGGED THE HOSTAGE", the instructor\'s "You never frag a family.", the hot wash\'s one thing and the hostage hit on the card, never "NO-SHOOTS UNTOUCHED" (fails without the noncombatant rule: room 3 holds the hostage card on every seed)',
    timeoutMs: 120_000,
    fn() {
      // (the sergeant by the kit bot told room 3 was hostiles only: it holds the hostage card on every seed)
      const g = lane('sgt'), said = [], s = g.state, H = s.armoury.range.house;
      H.intel = { 'o:w4:r1': 'unknown', 'o:w4:r2': 'unknown', 'o:w4:r3': 'hostiles' };
      g.bus.on?.('say', (f) => said.push(f.text));
      runHouse(g, houseKitBot({ use: 'frag' }), { maxMs: 10 * 60_000 });
      const L3 = H.rooms[2], sheet = runSheetOf(s), row3 = sheet.rows.find(r => r.room === 'w4.r3')?.words ?? '';
      const hostage = s.armoury.range.turners.find(T => T.face === 'hostage' && T.room === 'w4.r3'), balls = (hostage?.hits ?? []).filter(h => h.by === 'frag').reduce((a, h) => a + h.n, 0);
      console.log(`      bursts ${H.bursts.map(b => `${b.model} ${b.thrown}`).join(', ')}; room 3: ${row3}; said ${said.filter(t => /frag/i.test(t)).join(' / ')}; one thing ${sheet.one.key}: ${sheet.one.text}`);
      console.log(`      the hostage ${hostage?.stand}: ${balls} balls; the card: ${sheet.card}`);
      // (the review of v0.0.19: the card said "NO-SHOOTS UNTOUCHED" beside "FRAGGED THE HOSTAGE", counting a hostage hit by bullet zones only)
      assert(balls > 0 && /\b[1-9] OF \d NO-SHOOTS HIT/.test(sheet.card) && !/UNTOUCHED/.test(sheet.card), JSON.stringify({ balls, card: sheet.card }));
      assert(/FRAGGED THE HOSTAGE/.test(row3) && row3.split(' · ').filter(b => /FRAGGED/.test(b)).length === 1 && L3.faults.some(f => f.kind === 'fragged') && said.some(t => HOUSE_CHIEF.fragged.some(l => t.toLowerCase() === l.replace('{who}', 'hostage').toLowerCase())) && sheet.one.key === 'fragged', JSON.stringify({ row3, f: L3.faults, one: sheet.one }));
    },
  },
  // (the review of v0.0.19's K, finding 2: each D2 fault was printed twice on its row ("FRAGGED · FRAGGED THE HOSTAGE"), the bare
  // "EXPOSED" beside "EXPOSED IN THE THROW 1.1 S", and the breach round's fault was "THROUGH THE DOOR", which the card never reds)
  {
    name: 'a leg\'s row names each D2 fault once: the read\'s faults by their kit mark alone ("FRAGGED THE HOSTAGE", "IN THE BURST: …", "NO-SHOOT IN THE BLAST …", "EXPOSED IN THE THROW 1.1 S"), a breach round run on into the room "ROUND THROUGH THE DOOR" (the review of v0.0.19\'s K: "FRAGGED · FRAGGED THE HOSTAGE", "EXPOSED · …", "THROUGH THE DOOR")',
    fn() {
      const cases = [['through', [], /^ROUND THROUGH THE DOOR$/], ['exposed', ['EXPOSED IN THE THROW 1.1 S'], /EXPOSED/], ['fragged', ['FRAGGED THE HOSTAGE'], /FRAGGED/], ['burst', ['IN THE BURST: YOUR #2, 140 FRAGMENTS'], /IN THE BURST/], ['concussed', ['NO-SHOOT IN THE BLAST 36 KPA'], /IN THE BLAST/]];
      const out = cases.map(([kind, kit, re]) => {
        const w = legWords({ word: 'ROOM 2', ms: 10, faults: [{ kind }], takeIns: [], firsts: [], corners: {}, kit, zones: [], twoZones: [] }, { par: 'basic' });
        return { kind, w, n: w.split(' · ').filter(b => re.test(b)).length };
      });
      for (const o of out) console.log(`      ${o.kind.padEnd(9)} ${o.w} (${o.n})`);
      assert(out.every(o => o.n === 1) && out[0].w.endsWith('ROUND THROUGH THE DOOR'), JSON.stringify(out));
    },
  },
  // (the review of v0.0.19's K, finding 4: "Frag it" stopped in its cook handed back a live grenade with every bundle row still
  // offered; "Clear the room" walked in and the G-9P burst in the hand, 635 fragments)
  {
    name: '"Frag, clear the room" stopped in its cook hands back a live grenade with only its ways out: every bundle and single row struck "live grenade" (Clear the room refused), Throw it and Throw it clear live; thrown, it bursts in room 1, never in the hand (the review of v0.0.19\'s K: Clear the room walked in, 635 fragments)',
    timeoutMs: 60_000,
    fn() {
      const g = lane('sgt'), s = g.state, H = s.armoury.range.house, inner = houseKitBot({ use: 'frag' });
      let pressed = false, stopped = null, rows = null, refused = null, threw = false, id = null;
      runHouse(g, (st, me, mem) => {
        const S = st.stop;
        const frag = !pressed && choose(st) ? stepsOf(st).find(r => /^drill:room:clear@[^>]*frag[^>]*>o:w4:r1$/.test(r.id) && !r.off) : null;
        if (frag) { pressed = frag.id; return { act: [stepAct(frag.id)] }; }
        if (pressed && stopped === null && S?.phase === 'act') {
          id ??= Object.keys(st.items).find(k => st.items[k].model === 'g9p' && st.items[k].st === 'live');
          if (id) { stopped = st.clock.ms; return { act: [stepAct('drill:stop')] }; }
        }
        if (stopped !== null && rows === null && choose(st)) {
          rows = stepsOf(st);
          const before = st.clock.ms;
          g.step(1, { act: [stepAct('drill:room:clear>o:w4:r1')] });
          refused = !st.stop?.doing && st.items[id].st === 'live' && !st.items[id].flight;
          return { act: [stepAct('dev:throw')] };
        }
        if (rows && !threw) threw = !!st.items[id]?.flight;
        return inner(st, me, mem);
      }, { maxMs: 10 * 60_000 });
      const B = H.bursts.find(b => b.item === id || b.id === id) ?? H.bursts.find(b => b.model === 'g9p');
      const live = (rows ?? []).filter(r => !r.off).map(r => r.id), struck = (rows ?? []).filter(r => r.off === 'live grenade').map(r => r.id);
      const drill = (rows ?? []).filter(r => /^(drill:(room|door|stack)|door:|watch:|move:)/.test(r.id));
      console.log(`      "${pressed}" stopped in the cook ${stopped !== null}; at the hand-back live: ${live.filter(x => /^(drill|dev|door|watch)/.test(x)).join(' ')}; struck "live grenade": ${struck.length} (${struck.slice(0, 6).join(' ')} …); Clear the room refused ${refused}; thrown ${threw}; the burst at (${B?.x}, ${B?.z}) in ${B?.read?.room}, the stack ${JSON.stringify(B?.read?.stack)}; the lane ${H.end?.why}`);
      assert(stopped !== null && rows && live.includes('dev:throw') && live.includes('dev:gren:clear') && drill.length && drill.every(r => r.off) && refused, JSON.stringify({ stopped, live, drill: drill.map(r => [r.id, r.off]), refused }));
      assert(threw && B?.read?.room === 'w4.r1' && B.read.stack.me.n === 0 && H.end?.why !== 'burst', JSON.stringify({ threw, B: B && { x: B.x, z: B.z, room: B.read?.room, stack: B.read?.stack }, end: H.end }));
    },
  },
  // (the review of v0.0.19's K, finding 8: the boot recruit's "Frag it" at room 1 on seed 5000 slips on a natural 1 at his own
  // feet, 4,698 ms of fuse left; no pause came till the burst, and the cease fire said "In the room at the burst" with the stack in the hall)
  {
    name: 'a practice frag slipped at the thrower\'s feet hands back at once with "Get clear of the grenade" (the boot recruit, seed 5000); taken, he is clear of it at the burst; not taken, the cease fire says "AT YOUR FEET", never "in the room" (the review of v0.0.19\'s K: no pause for 4.7 s, "IN THE ROOM AT THE BURST")',
    timeoutMs: 120_000,
    fn() {
      const out = {};
      for (const take of [true, false]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 5000, tier: 'recruit', setup: 'go', loadout: 'frag' }), s = g.state, H = s.armoury.range.house, inner = houseKeysBot();
        let pressed = false, slipAt = null, pause = null, said = [];
        g.bus.on?.('say', (f) => said.push(f.text));
        runHouse(g, (st, me, mem) => {
          const S = st.stop, it = Object.values(st.items).find(x => x.model === 'g9p' && x.flight);
          if (it && slipAt === null) slipAt = { ms: st.clock.ms, atFeet: !!it.flight.atFeet, fuseMs: it.fuseAtMs - st.clock.ms };
          if (slipAt && !pause && choose(st)) {
            const row = stepsOf(st).find(r => r.id === 'move:clear' && !r.off);
            pause = { afterMs: st.clock.ms - slipAt.ms, words: S.carry?.words ?? null, row: row?.label ?? null };
            if (row && take) return { act: [stepAct(row.id)] };
          }
          if (!pressed && choose(st)) { const r = stepsOf(st).find(x => /^drill:door:frag>o:w4:r1$/.test(x.id) && !x.off); if (r) { pressed = true; return { act: [stepAct(r.id)] }; } }
          return inner(st, me, mem);
        }, { maxMs: 10 * 60_000 });
        const B = H.bursts.find(b => b.model === 'g9p'), sheet = runSheetOf(s);
        out[take ? 'taken' : 'not'] = { slipAt, pause, me: B?.read?.stack?.me, end: H.end?.why, cease: B?.read?.cease ?? null, card: sheet.card, one: sheet.one?.text, chief: said.filter(t => /CEASE FIRE|Cease fire/.test(t)) };
      }
      for (const [k, o] of Object.entries(out)) console.log(`      ${k}: the slip ${JSON.stringify(o.slipAt)}; the pause ${JSON.stringify(o.pause)}; you at the burst ${JSON.stringify(o.me)}; the lane ${o.end} (${o.cease}); "${o.chief.join(' / ')}"\n        ${o.card}\n        one thing: ${o.one}`);
      assert(Object.values(out).every(o => o.slipAt?.atFeet && o.pause && o.pause.afterMs <= 1000 && o.pause.words === SLIP_WORDS && o.pause.row), JSON.stringify(out));
      assert(out.taken.me.rM >= 3 && out.taken.me.n < out.not.me.n / 10, JSON.stringify({ taken: out.taken.me, not: out.not.me }));
      assert(out.not.end === 'burst' && /^CEASE FIRE: AT YOUR FEET/.test(out.not.card) && !/IN THE ROOM/.test(out.not.card) && !out.not.chief.some(t => /in the room/i.test(t)), JSON.stringify(out.not));
    },
  },
  // (the review of v0.0.19's K, finding 6: HANDS FULL's Cook 2 named a row the sim never made; an armed grenade handed back now has it)
  {
    name: 'an armed G-9P in the hand at room 1\'s stack, the door open, offers Throw it, Pin back in and Cook 2 (dev:gren:cook:2): Cook 2 counts two and hands back a live grenade with only its throws; thrown, it bursts in room 1 under 2.8 s after the throw (the fuse U(4.0, 4.8) s less the count; v0.0.20: the door opened first, a throw and a cook at a shut door being struck "door shut", the hunt of v0.0.18\'s kit-4)',
    timeoutMs: 60_000,
    fn() {
      const g = lane('sgt'), s = g.state, H = s.armoury.range.house, inner = houseKitBot({ use: 'frag' });
      let id = null, armed = null, cooked = null, said = [], thrownAt = null;
      g.bus.on?.('say', (f) => said.push(f.text));
      runHouse(g, (st, me, mem) => {
        if (!id && choose(st) && stepsOf(st).some(r => /^drill:room:clear@[^>]*frag[^>]*>o:w4:r1$/.test(r.id) && !r.off)) {
          id = Object.keys(st.items).find(k => st.items[k].model === 'g9p');
          kitMove(st, id, { pid: st.player.id, hand: 0 }); setSt(st, id, 'armed'); setOpening(st, 'o:w4:r1', 'open');
          armed = stepsOf(st).filter(r => /^dev:/.test(r.id)).map(r => `${r.id}${r.off ? `(${r.off})` : ''}`);
          return { act: [stepAct('dev:gren:cook:2')] };
        }
        if (id && armed && !cooked && choose(st)) {
          cooked = { st: st.items[id].st, live: stepsOf(st).filter(r => /^dev:/.test(r.id) && !r.off).map(r => r.id), leftMs: st.items[id].fuseAtMs - st.clock.ms };
          thrownAt = st.clock.ms;
          return { act: [stepAct('dev:throw')] };
        }
        return inner(st, me, mem);
      }, { maxMs: 10 * 60_000 });
      const B = H.bursts.find(b => b.model === 'g9p');
      console.log(`      armed: ${armed?.join(' ')}; after Cook 2: ${JSON.stringify(cooked)}, said ${said.filter(t => /Cooked|Frag out/.test(t)).join(' / ') || 'nothing'}; the burst in ${B?.read?.room} ${B ? B.atMs - thrownAt : '-'} ms after the press, the stack ${JSON.stringify(B?.read?.stack)}`);
      assert(armed && ['dev:throw', 'dev:repin', 'dev:gren:cook:2'].every(x => armed.includes(x)), JSON.stringify(armed));
      assert(cooked?.st === 'live' && cooked.live.join() === 'dev:throw,dev:gren:clear' && B?.read?.room === 'w4.r1' && B.atMs - thrownAt <= 2800 && B.atMs - thrownAt === cooked.leftMs, JSON.stringify({ cooked, B: B && { room: B.read?.room, at: B.atMs - thrownAt } }));
    },
  },
];
