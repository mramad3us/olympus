// OLYMPUS tests: a shoot house run exported from the page, replayed exactly in node (the build sheet v0.0.20 §1 item 25; card C7).
//
// The end card's "Export the run" (main.js exportRun) gives { game, kind 'house-run', version, scene, seed, sheet, par, loadout, atGo
// (the save at GO, toJSON), inputs: [{ n, input }] (every non-empty input the loop polled for the sim from GO, n the count of the
// loop's calls into the sim since GO, stop motion's presses included), steps (the calls up to the lane's end), runtime ({ $cycle,
// $panel, $aid, $look }: the page's settings the sim reads, never saved), sheetHash (the run sheet's digest), digest (the save's) }.
// replayRun(run) loads atGo in the headless game (tests/game.mjs), puts the runtime settings back, and steps once a tick: the logged
// input where there is one, none between, so the lane ends on the same run sheet and save. The page logs every tick the loop ran
// (src/ui/runlog.js, the loop's first fast layer), a fast-forward's included: there the tick's input is the skip's own (none) and,
// on a frame's first tick, the poll's skip commands, which game.step would drop for the skip's input, so a logged tick inside a
// fast-forward is ticked on the loop with its input and then ended as the loop's ffFrame ends it (sim.ffCheck). recordRun(game, bot)
// is the page's log made in node: a bot played from GO, its memory kept off the state (the page has no bot memory on its actor), each
// input logged as runlog.js logs it (with the clock's ms beside it, for the tests' contrast only). As a script: node
// tests/replay-run.mjs <run.json> prints the run sheet and whether it matches.
import { readFileSync } from 'node:fs';
import { createGame, fullInput, NO_INPUT } from './game.mjs';
import { runSheetOf, houseNow } from '../src/sim/scenarios/shoothouse.js';
import { digest } from '../src/core/hash.js';
import { toJSON } from '../src/core/state.js';
import { playerActor } from '../src/core/ids.js';
import { engineOf } from '../src/sim/time/skip.js';
import { isEmptyInput, simInput, sheetHashOf, RUN_RUNTIME as RUNTIME } from '../src/ui/runlog.js';

// (the page's own rules for an input worth logging, what of it is logged, and the run sheet's digest: src/ui/runlog.js)
export { isEmptyInput, simInput, sheetHashOf };

/**
 * The page's log made in node: from a game at or before GO, the bot plays to the range's end (or maxSteps), its memory kept apart
 * from the state; returns the export's shape ({ atGo, inputs, steps, runtime, sheetHash, digest, … }).
 */
export function recordRun(g, bot, { scene = 'test-shoothouse', maxSteps = 40_000 } = {}) {
  const mem = {}, H = () => g.state.armoury?.range?.house ?? null;
  const input = () => fullInput(bot(g.state, playerActor(g.state), mem));
  let guard = 0;
  while ((H()?.goAtMs ?? null) === null && guard++ < maxSteps) g.step(1, input());
  const s0 = g.state, atGo = toJSON(s0), runtime = Object.fromEntries(RUNTIME.map(k => [k, s0[k] ?? null])), inputs = [];
  let n = 0;
  while (!g.state.armoury.range.end && n < maxSteps) {
    const inp = input();
    if (!isEmptyInput(inp)) inputs.push({ n, atMs: g.state.clock.ms, input: simInput(inp) });
    g.step(1, inp);
    n++;
  }
  const s = g.state, h = s.armoury.range.house;
  return { game: 'olympus', kind: 'house-run', version: 'test', scene, seed: s.meta.seed, sheet: h.tier, par: h.parSet ?? null, loadout: h.loadout ?? null,
    atGo, inputs, steps: n, runtime, sheetHash: sheetHashOf(s), digest: digest(toJSON(s)) };
}

/** A run replayed (see the header): { game, steps, sheetHash, digest, same: { sheet, save }, end }. */
export function replayRun(run) {
  if (run?.kind !== 'house-run' || !run.atGo) throw new Error('replay-run: not a house run export');
  const g = createGame({ scenario: 'test-shoothouse', seed: run.seed, tier: run.sheet });
  const s = g.load(run.atGo);
  for (const k of RUNTIME) if (run.runtime?.[k] !== null && run.runtime?.[k] !== undefined) s[k] = run.runtime[k];
  const by = new Map((run.inputs ?? []).map(x => [x.n, x.input]));
  for (let n = 0; n < run.steps; n++) {
    const inp = by.get(n), st = g.state;
    // (a logged tick inside a fast-forward: its skip commands are the tick's own, so it is ticked as the page's ffFrame ticks it)
    if (inp && st.skip && engineOf(st.skip) === 'ff') { g.loop.tick(fullInput(inp)); g.sim.ffCheck(st); }
    else g.step(1, inp ? fullInput(inp) : NO_INPUT);
  }
  const sheetHash = sheetHashOf(g.state), dg = digest(toJSON(g.state));
  return { game: g, steps: run.steps, sheetHash, digest: dg, same: { sheet: sheetHash === run.sheetHash, save: dg === run.digest }, end: houseNow(g.state)?.end ?? null };
}

// (as a script: replay a file and print its run sheet)
if (import.meta.url === `file://${process.argv[1]}`) {
  const run = JSON.parse(readFileSync(process.argv[2], 'utf8')), r = replayRun(run), rs = runSheetOf(r.game.state);
  console.log(rs.card);
  for (const row of rs.rows) console.log(`  ${row.words}`);
  console.log(`steps ${r.steps}; the run sheet ${r.same.sheet ? 'the same' : 'DIFFERENT'} (${r.sheetHash}); the save ${r.same.save ? 'the same' : 'DIFFERENT'} (${r.digest})`);
  process.exitCode = r.same.sheet && r.same.save ? 0 : 1;
}
