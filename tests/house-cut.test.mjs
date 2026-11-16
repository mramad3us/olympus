// OLYMPUS tests: the BC-1 hinge-side cutting charge on room 2's pull door (kit2 §2.5, §6 test 30; the build sheet 0.0.19 §0 items 1, 9, "What the user must feel"): placed on the hinges, the stack 3.18 m down the latch-side wall, "Breaching!", the leaf blown in, under 27.6 kPa, the lane to its card; a misfire primed again.
//
// The sergeant by the honest kit bot (use 'cut': the BC-1 where its hinges are, the other doors T's) on seed 48213; the misfire
// on seed 17 from room 2's stack (setup 'room:2'), found by a scratch search on this tree (the FD-1's 1 in 100).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { stepAct } from './bots/lib.mjs';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';
import { planOf, HANDBACK_WORDS } from '../src/sim/combat/bundle.js';
import { safePointsOf } from '../src/sim/combat/breach.js';
import { BREACH_SAFE_KPA } from '../src/sim/arms/blast.js';
import { openingState } from '../src/sim/places/model.js';
import { stepsOf } from '../src/sim/arms/shooting.js';

/** The seed whose BC-1 misfires from room 2's stack (see the header). */
export const CUT_MISFIRE_SEED = 17;

export default [
  {
    name: 'the BC-1 at room 2\'s hinges: placed on the hinge edge, the stack back 3.18 m down the latch-side wall, primed, "Breaching!", the leaf blown in, the stack under 27.6 kPa, "CUT" on the record, then on to the card',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', loadout: 'cut' }), s = g.state, H = s.armoury.range.house, said = [];
      g.bus.on?.('say', (f) => { if (['placing', 'breaching'].includes(f.call)) said.push(f.text); });
      const sp = safePointsOf(s, planOf(s, 'o:w4:r2'), 'bc1');
      let atSafe = null;
      const bot = houseKitBot({ use: 'cut' });
      const r = runHouse(g, (state, me, mem) => { const c = Object.values(state.items).find(x => x.model === 'bc1' && x.st === 'primed'); if (c && !atSafe) { const a = state.actors.list.find(x => x.who === state.player.id); atSafe = [a.x, a.z]; } return bot(state, me, mem); }, { maxMs: 10 * 60_000 });
      const B = H.bursts.find(b => b.model === 'bc1'), me = s.player.id, row = runSheetOf(s).rows.find(x => x.room === 'w4.r2')?.words ?? '';
      const dSafe = atSafe ? Math.hypot(atSafe[0] - sp.charge[0], atSafe[1] - sp.charge[1]) : null;
      console.log(`      the charge's point ${sp.charge.join(', ')} (its ${sp.edge} edge), the safe points ${sp.one.join(', ')} and ${sp.two.join(', ')} at ${sp.standoffM} m; you primed it from ${atSafe?.map(x => fmt(x, 2)).join(', ')} (${fmt(dSafe, 2)} m); the burst: you ${B?.kPa[me]} kPa, your #2 ${B?.kPa[H.twoPid]} kPa; ${said.join(' / ')}; ${JSON.stringify(H.breach)}`);
      console.log(`      ${row}; the end ${H.end?.why}`);
      assert(r.done && H.end?.why === 'clear' && B?.door === 'o:w4:r2' && H.breach?.['o:w4:r2']?.how === 'cut' && openingState(s, 'o:w4:r2') === 'open', JSON.stringify({ end: H.end, B, breach: H.breach }));
      assert(B.kPa[me] < BREACH_SAFE_KPA && B.kPa[H.twoPid] < BREACH_SAFE_KPA && dSafe >= sp.standoffM - 0.05 && said.includes('Breaching!') && /DOOR BLOWN/.test(row), JSON.stringify({ kPa: B.kPa, dSafe, said, row }));
    },
  },
  {
    name: `a BC-1 misfire (seed ${CUT_MISFIRE_SEED}, from room 2's stack) hands back "Misfire. Prime it again.", the charge a believed misfire (its st 'misfire', misAtMs) whose door any other way in waits "wait 30 s" (MISFIRE_WAIT_MS, counting), Carry on primes it again from the safe point, and it fires: the leaf blown in (the review of v0.0.19's K: put back to 'placed', the wait never reached)`,
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: CUT_MISFIRE_SEED, tier: 'sgt', setup: 'room:2', loadout: 'cut' }), s = g.state, H = s.armoury.range.house, bot = houseKitBot({ use: 'cut' });
      let handed = null, carried = false;
      for (let i = 0; i < 4000 && !H.bursts?.some(b => b.model === 'bc1'); i++) {
        if (!handed && s.stop?.carry?.words === HANDBACK_WORDS.misfire) {
          const c = Object.values(s.items).find(x => x.model === 'bc1');
          handed = { words: s.stop.carry.words, st: c?.st, misAtMs: Number.isFinite(c?.misAtMs) };
          // (the way in set to another than the charge's own: the room's row walks up to the misfire, struck "wait N s" (devplan.js
          // D3, MISFIRE_WAIT_MS); then back round to the cut, and Carry on)
          g.step(1, { act: [stepAct('drill:variant:breach')] });
          handed.other = stepsOf(s).find(r => /^drill:room:clear@/.test(r.id) && !/@cut>/.test(r.id))?.off ?? null;
          for (let k = 0; k < 4 && !stepsOf(s).some(r => /^drill:room:clear@cut>/.test(r.id)); k++) g.step(1, { act: [stepAct('drill:variant:breach')] });
          g.step(1, { act: [stepAct('drill:carry')] }); carried = true; continue;
        }
        g.step(1, bot);
      }
      const B = H.bursts?.find(b => b.model === 'bc1');
      console.log(`      handed back ${JSON.stringify(handed)}; Carry on ${carried}; then the burst on ${B?.door}, you ${B?.kPa?.[s.player.id]} kPa; the door ${openingState(s, 'o:w4:r2')}`);
      assert(handed?.words === HANDBACK_WORDS.misfire && handed.st === 'misfire' && handed.misAtMs && /^wait (30|29) s$/.test(handed.other ?? '') && B?.door === 'o:w4:r2' && openingState(s, 'o:w4:r2') === 'open', JSON.stringify({ handed, B }));
    },
  },
  {
    name: 'the review of v0.0.19: below the corporal "Breach (explosive)" is the BC-1 where only it fits the door: on the cut loadout at room 2\'s pull door the recruit\'s row is live and cuts the hinges (it was struck "opens toward you", with no row for the BC-1), and on the mixed loadout (a BC-1, no SC-1) room 1\'s push door is cut on its latch (it was struck "no charge issued")',
    fn() {
      return Promise.all([import('../src/sim/arms/shooting.js'), import('../src/sim/combat/room.js'), import('./bots/lib.mjs')]).then(([{ stepsOf }, { lanePlanOf }, { stepAct }]) => {
        const out = [];
        for (const [loadout, setup, door] of [['cut', 'room:2', 'o:w4:r2'], ['mixed', 'go', 'o:w4:r1']]) {
          const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'recruit', setup, loadout }), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans[door];
          const act = (who) => s.actors.list.find(x => x.who === who), me = act(s.player.id), two = act(H.two.pid);
          me.x = P.stack[0][0]; me.z = P.stack[0][1]; two.x = P.stack[1][0]; two.z = P.stack[1][1];
          for (let i = 0; i < 400 && !(s.stop?.mode === 'stop' && s.stop.phase === 'choose'); i++) g.step(1, {});
          const row = stepsOf(s).find(r => r.id === `drill:door:breach>${door}`);
          if (row && !row.off) { g.step(1, { act: [stepAct(row.id)] }); for (let i = 0; i < 400 && !H.breach?.[door]; i++) g.step(1, {}); }
          const B = (H.bursts ?? []).find(b => b.door === door || b.model === 'bc1');
          out.push({ loadout, door, off: row?.off ?? null, how: H.breach?.[door]?.how ?? null, model: B?.model ?? null, me: B?.kPa?.[s.player.id] ?? null });
        }
        for (const o of out) console.log(`      ${o.loadout} at ${o.door}: the row ${o.off ? `struck "${o.off}"` : 'live'}; the door ${o.how ?? 'not breached'} by the ${o.model ?? '-'}, you at ${o.me ?? '-'} kPa`);
        assert(out.every(o => !o.off && o.how === 'cut' && o.model === 'bc1' && o.me < 27.6), JSON.stringify(out));
      });
    },
  },
];
