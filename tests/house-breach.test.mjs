// OLYMPUS tests: breaching in "Stack and clear" (COMBAT §25.5.6, §25.20; the build sheet 0.0.18 §5.3): the strip charge on a push door, the halligan on either swing, the closet's lock and a misfire.
//
// The user, 2026-11-15: "breaching options and equipment (explosives etc)", and "doors should have a direction they open (pull or
// push) and it should affect our options for entry". From the picker "Kit: Breach" puts two SC-1s with their FD-1s on the right
// of the carrier and the halligan on the back. Each test fails without the kit's beats (bundle.js place, back, prime, breach,
// force) and breach.js.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { houseKitBot, kitFuzzBot } from './bots/kit.mjs';
import { stepAct } from './bots/lib.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { BREACH_SAFE_KPA } from '../src/sim/arms/blast.js';
import { openingState } from '../src/sim/places/model.js';
import { KICK_PULL_WHY } from '../src/sim/places/swing.js';
import { playerActor } from '../src/core/ids.js';
import { HANDBACK_WORDS, FAIL_K, STACK_FIRST_WHY } from '../src/sim/combat/bundle.js';
import { devicesOf, liveDevices } from '../src/sim/arms/devices.js';

/** A seed whose first charge misfires (found by search on v0.0.18's tree, FD-1 misfireP 0.01: seeds 52, 172, 203 in the first 800). */
export const MISFIRE_SEED = 52;
const choose = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex;

export default [
  {
    name: 'the explosive breach at room 1 (the tier one, the sheet\'s own room row "Charge, clear the room"): placed, back to the safe points, primed, "Breaching!", the count, the blast; the leaf blown open, the stack under 27.6 kPa, the room\'s stands startled, and the lane goes on to its card',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', loadout: 'breach' }), said = [];
      g.bus.on?.('say', (f) => { if (['placing', 'breaching'].includes(f.call)) said.push(`${f.text} +${fmt((f.atMs ?? g.state.clock.ms) / 1000, 0)}`); });
      const r = runHouse(g, houseKitBot({ use: 'breach' }), { maxMs: 6 * 60_000 }), H = g.state.armoury.range.house;
      const B = H.bursts?.find(b => b.door === 'o:w4:r1'), me = g.state.player.id, two = H.twoPid;
      console.log(`      ${said.length} calls; the room 1 burst: you ${B?.kPa[me]} kPa, your #2 ${B?.kPa[two]} kPa (limit ${BREACH_SAFE_KPA}); the stands ${Object.entries(B?.daze ?? {}).map(([k, d]) => `${k} ${d.kind} ${d.ms}`).join(', ')}`);
      console.log(`      ${runSheetOf(g.state).rows.map(x => x.words).join(' | ')}`);
      assert(B && B.kPa[me] < BREACH_SAFE_KPA && B.kPa[two] < BREACH_SAFE_KPA && Object.keys(B.daze).length >= 2 && H.broken?.['o:w4:r1'] && r.done && H.end?.why === 'clear', JSON.stringify({ B, end: H.end }));
      assert(!H.rooms[0].faults.some(f => f.kind === 'blast') && /DOOR BLOWN/.test(runSheetOf(g.state).rows[0].words), 'the paper');
    },
  },
  {
    name: 'room 2 opens toward you (the user, 2026-11-15): with a charge carried its row is struck "opens toward you", the halligan\'s "Pry it" is live, and the private prying it opens it, the lane to its card',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'go', loadout: 'breach' }), seen = {};
      const each = (game) => {
        const s = game.state;
        if (!choose(s) || seen.rows || openingState(s, 'o:w4:r2') === 'open') return;
        const rows = stepsOf(s).filter(x => /^drill:door:(breach|pry|ram)/.test(x.id) && x.door === 'o:w4:r2');
        // (at the door: away from it the ways carried are struck "stack first" (v0.0.20's fixer, the play review), not the swing's yet)
        if (rows.length >= 2 && !rows.some(x => x.off === STACK_FIRST_WHY)) seen.rows = rows.map(x => ({ id: x.id, off: x.off, label: x.label, ms: x.ms }));
      };
      const r = runHouse(g, houseKitBot({ use: 'breach', base: 'keys' }), { maxMs: 6 * 60_000, each }), H = g.state.armoury.range.house;
      console.log(`      at room 2's door: ${(seen.rows ?? []).map(x => `${x.label}${x.off ? ` (${x.off})` : ` ${fmt(x.ms / 1000, 2)} s`}`).join(', ')}; room 2 ${H.broken?.['o:w4:r2'] ? 'pried' : 'not pried'}; the lane ${H.end?.why}`);
      const charge = seen.rows?.find(x => /breach/.test(x.id)), pry = seen.rows?.find(x => /pry/.test(x.id));
      assert(charge?.off === KICK_PULL_WHY && pry && !pry.off && H.broken?.['o:w4:r2'] && r.done, JSON.stringify(seen));
    },
  },
  {
    name: 'the closet pried from inside room 2: Fitness against its DC 14 less the halligan\'s 4 (10), a failure ×1.6 its time and "It won\'t give. Again, or hold it.", the row pressed again until it gives (the halligan kept in the hands)',
    timeoutMs: 60_000,
    fn() {
      const out = [];
      for (let seed = 1; seed < 40 && !out.some(o => o.fails); seed++) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'private', setup: 'room:2', loadout: 'breach' }), s = g.state, me = playerActor(s);
        // (a weak man inside room 2 by the closet: Fitness 0, so the halligan fails about half the time)
        s.people[s.player.id].skills.skills.fitness = [0, 0];
        me.x = 24.6; me.z = 16.6;
        g.step(1);
        const row = stepsOf(s).find(x => x.id === 'door:pry>o:w4:closet');
        if (!row) { out.push({ seed, row: null }); continue; }
        let fails = 0, words = null, failMs = null, n = 0;
        g.step(1, { act: [stepAct(row.id)] });
        for (let i = 0; i < 2000 && openingState(s, 'o:w4:closet') !== 'open'; i++) {
          if (choose(s)) {
            const again = stepsOf(s).find(x => x.id === row.id);
            if (s.stop.carry?.why === 'fail' || (s.stop.last?.step === row.id && again)) { fails += s.stop.carry?.why === 'fail' ? 1 : 0; words = s.stop.carry?.words ?? words; failMs ??= s.clock.ms - (s.stop.last?.atMs ?? s.clock.ms); n++; g.step(1, { act: [stepAct(row.id)] }); continue; }
          }
          g.step(1);
        }
        out.push({ seed, odds: row.odds, ms: row.ms, fails, words, failMs, open: openingState(s, 'o:w4:closet') === 'open' });
      }
      const hit = out.find(o => o.fails);
      console.log(`      ${out.length} seeds; the row at Fitness 0: odds ${fmt(out[0].odds * 100, 0)}%, ${fmt(out[0].ms / 1000, 2)} s; seed ${hit?.seed}: ${hit?.fails} failed, the first after ${fmt((hit?.failMs ?? 0) / 1000, 2)} s, "${hit?.words}", then ${hit?.open ? 'it gave' : 'still shut'}`);
      assert(hit && hit.open && hit.words === HANDBACK_WORDS.wontGive && Math.abs(out[0].odds - 0.55) < 0.06 && hit.fails < 20, JSON.stringify(out.slice(0, 4)));
    },
  },
  {
    name: 'a misfire hands back "Misfire. Prime it again." (the FD-1\'s 1 in 100, on seed 52), every way its words name a live row there (the review of 2026-11-16: "or the halligan" was said at the safe point, where no Pry row is offered): the charge stays on the door, primed again by Carry on, and it fires',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: MISFIRE_SEED, tier: 'tierone', setup: 'go', loadout: 'breach' }), s = g.state;
      let phase = 0, handed = null, rowsThen = null;
      for (let i = 0; i < 3000 && !s.armoury.range.house.bursts?.length; i++) {
        g.step(1, (state) => {
          if (!choose(state)) return {};
          const rows = stepsOf(state);
          if (phase === 0) { const r = rows.find(x => /^drill:stack:up/.test(x.id)); if (r) { phase = 1; return { act: [stepAct(r.id)] }; } }
          if (phase === 1) { const r = rows.find(x => /^drill:door:breach/.test(x.id) && !x.off); if (r) { phase = 2; return { act: [stepAct(r.id)] }; } }
          if (phase === 2 && state.stop.carry?.why === 'fail') { handed = state.stop.carry.words; rowsThen = rows.filter(x => /carry|pry/.test(x.id)).map(x => `${x.label}${x.off ? ` (${x.off})` : ''}`); phase = 3; return { act: [stepAct('drill:carry')] }; }
          return {};
        });
      }
      const H = s.armoury.range.house;
      console.log(`      handed back "${handed}"; the rows then: ${rowsThen?.join(', ')}; the burst ${H.bursts?.[0]?.model} on ${H.bursts?.[0]?.door}, the door ${openingState(s, 'o:w4:r1')}`);
      const live = (re) => (rowsThen ?? []).some(x => re.test(x) && !/\(/.test(x)), named = [/prime it again/i.test(handed ?? '') ? live(/carry/i) : true, /halligan/i.test(handed ?? '') ? live(/pry/i) : true];
      assert(handed === HANDBACK_WORDS.misfire && named.every(Boolean) && H.bursts?.[0]?.door === 'o:w4:r1' && openingState(s, 'o:w4:r1') === 'open', JSON.stringify({ handed, rowsThen, named, b: H.bursts }));
    },
  },  {
    name: 'the halligan let go at room 2 is picked up again: once the private has pried room 2, "Pick up the halligan" is a row at its door, it hangs the halligan on his back, and inside room 2 the closet\'s "Pry it" is offered (the review of 2026-11-16: dropped at the first door it forced, the closet could never be pried in a lane)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'room:2', loadout: 'breach' }), s = g.state;
      g.step(2);
      g.step(1, { act: [stepAct('drill:door:pry>o:w4:r2')] });
      for (let i = 0; i < 400 && !(openingState(s, 'o:w4:r2') === 'open' && choose(s)); i++) g.step(1);
      const kit = () => devicesOf(s, s.player.id).map(d => d.model).filter(m => m === 'hal').length;
      const row = stepsOf(s).find(x => x.id === 'dev:pickup'), before = kit();
      if (row) { g.step(1, { act: [stepAct(row.id)] }); for (let i = 0; i < 400 && (s.stop?.doing || !choose(s)); i++) g.step(1); }
      const after = kit(), me = playerActor(s);
      me.x = 24.6; me.z = 16.6; g.step(1);
      const closet = stepsOf(s).filter(x => /closet/.test(x.id)).map(x => `${x.id}${x.off ? ` (${x.off})` : ''}`);
      console.log(`      room 2 ${openingState(s, 'o:w4:r2')}; the row "${row?.label}" ${fmt((row?.ms ?? 0) / 1000, 2)} s; the halligan carried ${before} → ${after}; the closet's rows: ${closet.join(', ')}`);
      assert(row && before === 0 && after === 1 && closet.includes('door:pry>o:w4:closet'), JSON.stringify({ row, before, after, closet }));
    },
  },
  {
    name: 'a charge placed and left on its door (the kit\'s fuzz 4 on the recruit, breach, seed 48214: room 1 opened by hand past it; fuzz 1 until the fixer of v0.0.18 moved its walk) is marked "CHARGE LEFT ON THE DOOR" on room 1\'s paper with its fault, and the instructor makes it safe, nothing live at the card (the review of 2026-11-16: it stayed live on the open door, unmarked)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213 + 1, tier: 'recruit', setup: 'go', loadout: 'breach' }), s = g.state;
      const r = runHouse(g, kitFuzzBot({ seed: 4 }), { maxMs: 12 * 60_000 }), H = s.armoury.range.house, r1 = H.rooms.find(L => L.door === 'o:w4:r1');
      const live = liveDevices(s), f = r1.faults.find(x => x.kind === 'charge');
      console.log(`      ${r.done ? 'the card' : 'NOT DONE'} (${H.end?.why}); room 1: ${runSheetOf(s).rows[0].words}; "${f?.text}"; live at the end ${live.length}`);
      assert(r.done && !live.length && (r1.kit ?? []).includes('CHARGE LEFT ON THE DOOR') && f, JSON.stringify({ live, kit: r1.kit, faults: r1.faults }));
    },
  },
];
