// OLYMPUS tests: "Flash it" in "Stack and clear" (COMBAT §25.18.2, §25.20; the build sheet 0.0.18 §5.3): the G-11 thrown through the door and the entry on the bang, every sheet.
//
// The user, 2026-11-15: "grenades (bangs, frags, concussion etc)". From the picker "Kit: Flash" puts two G-11s on the left of
// the carrier; at room 1 "Flash it" is a row (below rung 2) or "Flash, clear the room" the room's own row with its variant
// (rung 2 up, T running it). The entry on the bang is held by COMBAT §25.18.2's window, BANG_LATE_MS 2 s. Each test fails
// without the kit's beats (bundle.js arm, throw, burst) and the scene's marks.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { stepAct } from './bots/lib.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { BANG_LATE_MS } from '../src/sim/combat/burst.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { flawlessLane } from './flawless.mjs';

const SEED = 48213;
function lane(tier, bot) {
  const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier, setup: 'go', loadout: 'flash' }), beats = [], said = [], flow = { both: 0 };
  g.bus.on?.('bundle', (f) => { if (f.who === g.state.player.id && (f.phase === 'beat' || f.phase === 'start')) beats.push({ phase: f.phase, beat: f.beat, id: f.id, atMs: f.atMs }); });
  g.bus.on?.('say', (f) => { if (f.call === 'bangout') said.push(f.atMs); });
  // (the pin on the approach: the arm beat running while the feet still walk to the stack)
  const each = (game) => { const d = game.state.stop?.doing; if (d?.beats?.some(b => b.key === 'arm' && b.st === 'run') && d.beats.some(b => b.key === 'approach' && b.st === 'run')) flow.both++; };
  const r = runHouse(g, bot, { maxMs: 8 * 60_000, each });
  const H = g.state.armoury.range.house, legs = [...H.rooms, H.hall];
  return { g, r, H, legs, beats, said, flow, laneS: ((H.end?.atMs ?? g.state.clock.ms) - H.goAtMs) / 1000 };
}

export default [
  {
    name: 'Flash, clear the room at room 1 (the user, 2026-11-15): "Bang out!", the burst, the entry on the bang, BANG TO ENTRY under 2 s from the corporal up (the sheet\'s own row, T running it); the pin pulled on the approach from rung 3; the stands blinded; every lane to its card',
    timeoutMs: 120_000,
    fn() {
      const bad = [];
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) {
        const keys = tier === 'recruit' || tier === 'private';
        const L = lane(tier, houseKitBot({ use: 'flash', base: keys ? 'keys' : 'honest' }));
        const r1 = L.legs[0], approach = L.beats.find(b => b.beat === 'approach' && /room:clear|stack/.test(b.id)), arm = L.beats.find(b => b.beat === 'arm');
        const armMs = arm && approach ? arm.atMs - approach.atMs : null, flow = L.beats.find(b => b.phase === 'start' && /room:clear@flash/.test(b.id));
        console.log(`      ${tier.padEnd(8)} ${fmt(L.laneS, 1)} s, ${L.H.end?.why}; "Bang out!" ${L.said.length}×; room 1 on the bang ${r1.bangMs ?? '–'} ms, room 2 ${L.legs[1].bangMs ?? '–'} ms; the pin ${armMs !== null ? `${fmt(armMs / 1000, 2)} s after the approach began` : 'never'}${flow ? `, the room's row, ${L.flow.both} ticks of it on the approach` : ''}; ${runSheetOf(L.g.state).rows[0].words.split(' · ').filter(w => /BANG|BLIND|STARTL/.test(w)).join(', ')}`);
        if (!L.r.done || L.H.end?.why !== 'clear' || L.said.length < 2 || L.g.errors.length) bad.push(`${tier} the lane`);
        if (!keys && !(r1.bangMs <= BANG_LATE_MS && L.legs[1].bangMs <= BANG_LATE_MS)) bad.push(`${tier} on the bang ${r1.bangMs}, ${L.legs[1].bangMs}`);
        if (['sgt', 'raider', 'tierone'].includes(tier) && !(flow && L.flow.both > 0)) bad.push(`${tier} the flow`);
        if (['recruit', 'private', 'cpl'].includes(tier) && L.flow.both) bad.push(`${tier} flowed below rung 3`);
        if (!Object.values(L.H.bursts?.[0]?.daze ?? {}).some(d => d.kind === 'blind')) bad.push(`${tier} no stand blinded`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'a late entry writes "BANG TO ENTRY 2.40 S" and the instructor\'s "You gave them back the bang.": the tier one\'s "Flash it" at room 1, then a Wait before going in',
    timeoutMs: 60_000,
    fn() {
      const kit = houseKitBot({ use: 'flash', base: 'honest' });
      let waited = false;
      // (stacked by hand first, then "Flash it", then a Wait; the rest T's)
      const bot = (state, me, mem) => {
        const S = state.stop, choose = S?.mode === 'stop' && S.phase === 'choose';
        mem.kitDoors ??= { 'o:w4:r1': { n: 9, done: true } };
        if (!mem.stacked && choose) { const row = stepsOf(state).find(r => /^drill:stack:up/.test(r.id) && !r.off); if (row) { mem.stacked = true; return { act: [stepAct(row.id)] }; } }
        if (mem.stacked && !mem.flashed && choose) {
          const row = stepsOf(state).find(r => /^drill:door:flash/.test(r.id) && !r.off);
          if (row) { mem.flashed = true; return { act: [stepAct(row.id)] }; }
        }
        if (mem.flashed && !waited && S?.mode === 'stop' && S.phase === 'choose' && state.armoury.range.house.bursts?.length) { waited = true; return { act: [stepAct('wait')] }; }
        return kit(state, me, mem);
      };
      const L = lane('tierone', bot), r1 = L.legs[0], f = r1.faults.find(x => x.kind === 'bang'), words = runSheetOf(L.g.state).rows[0].words;
      console.log(`      room 1: ${words}`);
      console.log(`      the fault: "${f?.text}"; the lane ${fmt(L.laneS, 1)} s, ${L.H.end?.why}`);
      assert(waited && r1.bangMs > BANG_LATE_MS && f && /gave them back the bang/.test(f.text) && /BANG TO ENTRY \d+\.\d\d S/.test(words) && L.r.done, JSON.stringify({ bangMs: r1.bangMs, f }));
    },
  },  {
    name: 'a bang is marked on the leg it was thrown for: on the recruit\'s keys (seed 1074) room 1\'s throw is on room 1\'s paper and the hall\'s carries no BANG TO ENTRY; a slip (seed 1016) bursts at #1\'s feet in the hall, under 0.6 m from his stack, dazes none of room 1\'s stands and is room 1\'s BANG AT YOUR FEET (the review of 2026-11-16: a fail burst in the hall and fined the hall 63.48 s; the slip landed in room 1 and blinded its stands)',
    fn() {
      const run = (seed) => { let st = null; flawlessLane({ tier: 'recruit', seed, bot: 'kit:flash:keys', loadout: 'flash', more: (g) => { st = g.state; } }); return st; };
      const a = run(1074), Ha = a.armoury.range.house, r1a = Ha.rooms.find(L => L.door === 'o:w4:r1');
      const hallBang = Ha.hall.faults.filter(f => f.kind === 'bang'), r1Burst = Ha.bursts.find(b => b.thrown === 'o:w4:r1');
      console.log(`      seed 1074: room 1's burst in ${r1Burst?.room}; room 1 '${(r1a.kit ?? []).join(' · ')}'; the hall '${(Ha.hall.kit ?? []).join(' · ')}', bang faults ${hallBang.length}`);
      const b = run(1016), Hb = b.armoury.range.house, r1b = Hb.rooms.find(L => L.door === 'o:w4:r1'), slip = Hb.bursts.find(x => x.atFeet && x.thrown === 'o:w4:r1');
      const stack = lanePlanOf(b).plans['o:w4:r1'].stack[0], slipM = slip ? Math.hypot(slip.x - stack[0], slip.z - stack[1]) : null;
      const r1Stands = b.armoury.range.turners.filter(T => T.room === 'w4.r1').map(T => T.key), dazedR1 = Object.keys(slip?.daze ?? {}).filter(k => r1Stands.includes(k));
      console.log(`      seed 1016: the slip in ${slip?.room} at (${fmt(slip?.x, 2)}, ${fmt(slip?.z, 2)}), ${fmt(slipM, 2)} m from #1's stack, room 1's stands dazed ${dazedR1.length}; room 1 '${(r1b.kit ?? []).join(' · ')}'; the hall's bang faults ${Hb.hall.faults.filter(f => f.kind === 'bang').length}`);
      assert(r1Burst?.room === 'w4.r1' && (r1a.kit ?? []).some(m => /ON THE BANG|BANG TO ENTRY/.test(m)) && !hallBang.length && !(Ha.hall.kit ?? []).some(m => /BANG/.test(m)), JSON.stringify({ r1Burst, r1: r1a.kit, hall: Ha.hall.kit }));
      assert(slip && slip.room === 'w4.hall' && slipM < 0.6 && !dazedR1.length && (r1b.kit ?? []).includes('BANG AT YOUR FEET') && !Hb.hall.faults.some(f => f.kind === 'bang'), JSON.stringify({ slip, slipM, dazedR1, r1: r1b.kit }));
    },
  },
];
