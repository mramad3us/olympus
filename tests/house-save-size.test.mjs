// OLYMPUS tests: the shoot house's save held small, clean and quick (the build sheet v0.0.21 §1 item 25, §0 item 23; perf lens P11).
//
// The house's save is small and quick today: 146 KB at the card on the tier one from the brief (the people 96 KB, the barracks'
// roster the house carries; the log 24 KB, capped at LOG_MAX; the armoury 14 KB), save 0.77 to 0.92 ms and load 0.71 ms (perf.md
// §11). Nothing needs fixing; this guard keeps it so while the runtime keys grow: v0.0.20's trace and the export held by the page
// ($trace), v0.0.21's read scope ($reads) and route budget ($route) are runtime and must never reach the save (core/state.js toJSON
// strips every key starting with $). The save at the card on the tier one 48213 by T from the brief is at most SAVE_HOUSE_KB 200,
// carries no $ key at any depth, and saves and loads each within SAVE_MS 3 × the machine's factor (the least of five runs, read
// with the machine's factor around them: helpers.mjs machineNow). Fails if a runtime key leaks (a $trace in the save is about 60 KB
// a lane and its key is named), or the save doubles.
import { assert, fmt, machineNow } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot } from './bots/house.mjs';
import { toJSON, fromJSON } from '../src/core/state.js';

/** The save's ceiling at the card (KB) and its save's and load's (ms, × the machine's factor): perf lens P11's guard. */
export const SAVE_HOUSE_KB = 200, SAVE_MS = 3;

// (every key starting with $ at any depth, with its path)
function dollarKeys(o, at = '', out = []) {
  if (!o || typeof o !== 'object') return out;
  for (const [k, v] of Object.entries(o)) { if (k.startsWith('$')) out.push(`${at}.${k}`); dollarKeys(v, `${at}.${k}`, out); }
  return out;
}
// (the least of n runs of fn, ms)
function least(fn, n = 5) { let best = Infinity; for (let i = 0; i < n; i++) { const t = performance.now(); fn(); best = Math.min(best, performance.now() - t); } return best; }

export default [
  {
    name: 'the house\'s save at the card (the tier one 48213 by T from the brief) is at most SAVE_HOUSE_KB 200, carries no runtime ($) key at any depth, and saves and loads each within 3 ms × the machine\'s factor (perf lens P11: a guard, so v0.0.20\'s trace and v0.0.21\'s read scope and route budget never reach the save)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone' }), run = runHouse(g, houseHonestBot(), { maxMs: 10 * 60_000 });
      assert(run.done, JSON.stringify({ done: run.done, ms: run.ms }));
      const s = g.state, json = g.save(), kb = json.length / 1024, parsed = JSON.parse(json);
      const parts = Object.fromEntries(Object.keys(parsed).map(k => [k, JSON.stringify(parsed[k]).length / 1024])), big = Object.entries(parts).sort((a, b) => b[1] - a[1]).slice(0, 4);
      const runtime = Object.keys(s.armoury.range.house).filter(k => k.startsWith('$')).concat(Object.keys(s).filter(k => k.startsWith('$')));
      const leaked = dollarKeys(parsed);
      const k0 = machineNow().k, saveMs = least(() => toJSON(s)), loadMs = least(() => fromJSON(json)), k = Math.max(k0, machineNow().k);
      console.log(`      the card at ${fmt(run.ms / 1000, 1)} s from the brief: ${fmt(kb, 1)} KB (ceiling ${SAVE_HOUSE_KB}); the largest: ${big.map(([n, v]) => `${n} ${fmt(v, 1)}`).join(', ')} KB`);
      console.log(`      runtime keys on the state: ${runtime.join(', ') || 'none'}; in the save: ${leaked.length ? leaked.slice(0, 5).join(', ') : 'none'}`);
      console.log(`      save ${fmt(saveMs, 2)} ms, load ${fmt(loadMs, 2)} ms (the least of five; ceiling ${SAVE_MS} ms × k ${fmt(k, 2)} = ${fmt(SAVE_MS * k, 2)})`);
      assert(kb <= SAVE_HOUSE_KB && !leaked.length, JSON.stringify({ kb, leaked: leaked.slice(0, 5) }));
      assert(saveMs <= SAVE_MS * k && loadMs <= SAVE_MS * k, JSON.stringify({ saveMs, loadMs, k }));
    },
  },
];
