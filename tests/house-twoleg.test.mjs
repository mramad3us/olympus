// OLYMPUS tests: your #2's walks once they have nothing left to do (v0.0.20, the close of F17 and F46 on the hunt's merge).
//
// Two fuzz lanes the hunt of v0.0.18's merge reshuffled into the gauges' failures. The private on 1037 (house-flawless-bodies F46,
// 556 ticks): at room 1's stack your Stack up and his heels beat held each other 0.51 m apart; his way round waited for you to stand,
// which a held walk of yours was not counted as, so it came only the tick after yours ended at PIN_END_MS, 1.85 s into his hold, and
// his walk ended there left his hold's record (rec.gap.runMs) at 1.85 s for the 27.6 s he then stood (bundle.js heldStill and
// gapSettle). The boot recruit on 1489397426 (house-flawless-keys F17, 3.41 m): the stall passed room 2 with his Stack up for it
// running, and he walked back to its stack and stood its ready and squeeze before he set off for room 3 (bundle.js twoLegOver, from
// shoothouse.js endLeg). Each case fails without its fix (said in its name), printed with its numbers.
import { assert } from './helpers.mjs';
import { flawlessLane } from './flawless.mjs';
import { bodiesLane } from './flawless-bodies.mjs';
import { TWO_PIN_MS, TWO_SLOT_M } from '../src/sim/combat/bundle.js';

export default [
  {
    name: 'his walk held by your held walk is routed (or ended) at TWO_PIN_MS, and a hold with nothing of his walks left to hold is closed on his record: the private on 1037 by the fuzz, room 1\'s stack (on the integrated tree, neither fix: F46 556 ticks, his record at 1.85 s for 27.6 s; without bundle.js heldStill: 1 tick, his hold 1.80 s; without gapSettle: his record left running at 1.50 s with no walk of his)',
    heavy: true, // (the v0.0.22 integration: the file over its quick CPU budget, 3 s (QUICK_FILE_CPU_S), on v0.0.21's runner; its whole lanes moved to the heavy suite as TECH §13.7 says, the case unchanged)
    timeoutMs: 120_000,
    fn() {
      let stale = 0, staleMax = 0;
      const R = bodiesLane({ tier: 'private', seed: 1037, bot: 'fuzz' });
      // (the same lane again, watched for his hold's record with no walk of his running: no move beat of his doing, no carry)
      flawlessLane({ tier: 'private', seed: 1037, bot: 'fuzz', more: (game) => {
        const s = game.state, W = s.armoury.range.house.two, a = s.actors.list.find(x => x.who === W?.pid);
        if (!W?.gap?.runMs || !a || a.through || W.doing?.beats?.some(b => b.st === 'run' && b.k === 'move' && b.prof)) return;
        stale++; staleMax = Math.max(staleMax, W.gap.runMs);
      } });
      console.log(`      held past TWO_PIN_MS ${TWO_PIN_MS} ms with you standing outside a doorway: ${R.gapRuns} ticks (his longest hold ${R.gapMaxMs} ms, routed ${R.rounds}); his hold's record running with no walk of his: ${stale} ticks (at ${staleMax} ms); to the card ${R.done}`);
      assert(!R.gapRuns && R.gapMaxMs <= TWO_PIN_MS && !stale && R.done, JSON.stringify({ gapRuns: R.gapRuns, gapMaxMs: R.gapMaxMs, stale, staleMax, done: R.done }));
    },
  },
  {
    name: 'a leg the stall passes halts your #2\'s walk to its stack where he stands, and he sets off for the next from there: the boot recruit on 1489397426 by the fuzz, room 2 passed under his Stack up (F17: 3.41 m off his slot at room 3 without bundle.js twoLegOver)',
    timeoutMs: 120_000,
    fn() {
      const seen = [];
      let cur = null;
      const r = flawlessLane({ tier: 'recruit', seed: 1489397426, bot: 'fuzz', more: (game) => {
        const H = game.state.armoury.range.house;
        if (H.goAtMs === null || H.cur === cur) return;
        cur = H.cur;
        // (the tick a leg begins: his doing, whose door it is for)
        const L = [...H.rooms, H.hall][H.cur], d = H.two?.doing;
        seen.push({ cur, door: L?.door ?? null, his: d?.step ?? null, stale: !!d && !!L && d.door !== L.door && /^drill:(stack:|heels>)/.test(d.step) });
      } });
      const st = r.two.stackM;
      console.log(`      his distance to his stack as you stand on yours: ${st.map(m => m.toFixed(3)).join(', ')} m (at most ${TWO_SLOT_M}); at each leg's first tick his doing ${seen.map(x => `${x.cur}: ${x.his ?? '-'}`).join('; ')}; the lane ${r.end} at ${r.laneS} s`);
      assert(st.length >= 3 && st.every(m => m <= TWO_SLOT_M) && !seen.some(x => x.stale) && r.done, JSON.stringify({ st, seen, end: r.end }));
    },
  },
];
