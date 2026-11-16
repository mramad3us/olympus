// OLYMPUS tests: a run exported and replayed exactly in node (the build sheet v0.0.20 §1 item 25; card C7; F58's other half).
//
// tests/replay-run.mjs recordRun makes the page's log in node (the save at GO, each non-empty input against n, the count of the
// loop's calls into the sim since GO, as main.js runLog keys it, stop motion's presses included), replayRun loads the save and
// steps the inputs; the lane must end on the same run sheet and the same save digest. A log keyed on the clock would lose the presses
// made while time stands still: the test also shows that (keyed by the clock's ms, the replay differs).
//
// The second case is the page's own path: the real loop driven frame by frame (src/core/loop.js frame: one tick a live frame, up to
// FF_TICKS_FRAME on a fast-forward's frame, the hot wash's between the lane's end and the range's), the log the page's
// (src/ui/runlog.js, the loop's first fast layer), the poll the bot's and, once the wash runs, a skip command pressed on a frame's
// first tick, as a player skipping the wash would. A log counted on the polls replayed short and to a different save (the C and D
// review of 2026-11-16: 84 inputs over 1,141 calls for 1,896 ticks); the test prints what that log would have counted.
import { assert } from './helpers.mjs';
import { createGame, fullInput, NO_INPUT } from './game.mjs';
import { houseHonestBot } from './bots/house.mjs';
import { recordRun, replayRun } from './replay-run.mjs';
import { createLoop, FF_TICKS_FRAME } from '../src/core/loop.js';
import { createSim, newGame } from '../src/sim/game.js';
import { recordingBus } from '../src/core/bus.js';
import { playerActor } from '../src/core/ids.js';
import { engineOf } from '../src/sim/time/skip.js';
import { createRunLog, saveDigestOf, sheetHashOf } from '../src/ui/runlog.js';
import { houseCodeOf } from '../src/sim/scenes/assemble.js';
import { TICK_MS } from '../src/core/clock.js';

/** The page's loop and log in node: frames at 20 Hz of real time, the poll the bot's (its memory off the state), a constant clock for the ff's budget (so each ff frame runs its FF_TICKS_FRAME ticks). */
function pageRun({ seed = 48213, tier = 'tierone', stopWash = true } = {}) {
  const bus = recordingBus(), errors = [], bot = houseHonestBot(), mem = {};
  let polls = 0, ffFrames = 0, stopSent = null, washTicks = 0;
  const loop = createLoop({ bus, now: () => 0, onError: (e, where) => errors.push(`${where}: ${String(e?.message ?? e).split('\n')[0]}`),
    poll: () => {
      polls++;
      const s = loop.state, ff = s.skip && engineOf(s.skip) === 'ff';
      if (ff) ffFrames++;
      // (a player skipping the hot wash on its third ff frame: the skip command reaches the frame's first tick only)
      if (ff && stopWash && ffFrames === 3 && s.armoury.range.house?.end) { stopSent = s.clock.ms; return fullInput({ act: ['skip:stop'] }); }
      // (the page's snapshot always carries the mouse, an object, though nothing in the sim reads it: src/core/input.js)
      return { ...fullInput(bot(s, playerActor(s), mem)), mouse: { x: 640, y: 360, inside: true, buttons: 0, clicks: [], wheel: 0 } };
    } });
  const log = createRunLog(loop, { onError: (e, where) => errors.push(`${where}: ${e.message}`) });
  createSim({ loop, bus });
  loop.setState(newGame({ seed, scenario: 'test-shoothouse', setup: 'go', tier, version: 'test' }));
  let t = 0, frames = 0, ticks = 0, pollAtGo = null;
  for (; frames < 40_000; frames++) {
    const s = loop.state, before = loop.stats.ticks;
    if (pollAtGo === null && s.armoury.range.house?.goAtMs !== null && s.armoury.range.house?.goAtMs !== undefined) pollAtGo = polls;
    if (s.armoury.range.end) break;                                  // (the page's card pauses the loop at once: no tick after the end)
    loop.frame(t); t += TICK_MS;
    ticks += loop.stats.ticks - before;
    if (s.armoury.range.house?.end && !s.armoury.range.end) washTicks += loop.stats.ticks - before;
  }
  return { loop, log, errors, polls: polls - (pollAtGo ?? 0), ffFrames, stopSent, washTicks, frames };
}

export default [
  {
    name: 'a lane re-run from its export ends on the same run sheet and save digest (the tier one by T on 48213, from GO), the presses keyed on the loop\'s calls (a log keyed on the clock loses those made while it stands, printed)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' });
      const run = recordRun(g, houseHonestBot()), r = replayRun(run);
      // (keyed by the clock's ms instead, the presses made while time stood still collapse onto one: what a clock-keyed log would lose)
      const byMs = new Map(); for (const x of run.inputs) byMs.set(x.atMs, (byMs.get(x.atMs) ?? 0) + 1);
      const lost = [...byMs.values()].reduce((a, c) => a + c - 1, 0), ticks = byMs.size;
      console.log(`      ${run.steps} calls from GO, ${run.inputs.length} inputs logged (${JSON.stringify(run.inputs.slice(0, 2).map(x => x.input.act))} first), ${(JSON.stringify(run).length / 1024).toFixed(1)} KB; replayed: the run sheet ${r.same.sheet ? 'the same' : 'DIFFERENT'} (${r.sheetHash}), the save ${r.same.save ? 'the same' : 'DIFFERENT'} (${r.digest}), the end ${JSON.stringify(r.end)}; ${ticks} clock ms carried them: a log keyed on the clock would lose ${lost}`);
      assert(r.same.sheet && r.same.save && r.end?.why === 'clear' && run.inputs.length > 0 && run.inputs.every((x, i) => i === 0 || x.n > run.inputs[i - 1].n), JSON.stringify({ same: r.same, steps: run.steps, end: r.end }));
    },
  },
  {
    name: 'a lane played through the page\'s own loop (one tick a live frame, up to 40 on the hot wash\'s fast-forward frames, the wash skipped by a press) replays from its export to the same run sheet and save: the log counts ticks, never polls, an input that is only the mouse is not logged, and the saves are taken as the last tick left them, the export made at the card with no tick after the end (fails with the log kept on the polls, with the mouse taken for an input, or with the save at GO one seq ahead: the C and D review, 2026-11-16)',
    fn() {
      const P = pageRun(), r0 = P.log.rec, s = P.loop.state;
      // (the export as main.js exportRun makes it at the card: no tick after the lane's end, so the digests are the state's as it stands;
      // then one more frame, and the log's own end digest (a tick that found the range ended) must be the same)
      const atCard = { digest: r0?.endDigest ?? saveDigestOf(s), sheet: r0?.endSheet ?? sheetHashOf(s) };
      P.loop.frame(1e9);
      assert(r0?.atGo && r0.endDigest && !P.errors.length, JSON.stringify({ rec: !!r0, end: !!r0?.endDigest, errors: P.errors.slice(0, 3) }));
      const run = { kind: 'house-run', seed: s.meta.seed, sheet: s.armoury.range.house.tier, atGo: r0.atGo, inputs: r0.inputs, steps: r0.endN, runtime: r0.runtime, sheetHash: atCard.sheet, digest: atCard.digest };
      const r = replayRun(run), ffLogged = r0.inputs.filter(x => (x.input.act ?? []).some(a => String(a).startsWith('skip:')));
      console.log(`      the page's loop: ${r0.endN} ticks from GO over ${P.polls} polls (${P.ffFrames} fast-forward frames of up to ${FF_TICKS_FRAME} ticks, the wash ${P.washTicks} ticks, skipped by a press at ${P.stopSent} ms); ${r0.inputs.length} inputs logged, ${ffLogged.length} of them a skip command inside the fast-forward`);
      console.log(`      replayed in node: ${r.steps} ticks, the run sheet ${r.same.sheet ? 'the same' : 'DIFFERENT'}, the save ${r.same.save ? 'the same' : 'DIFFERENT'}, the range ended ${!!r.game.state.armoury.range.end}; a log counted on the polls would have replayed ${P.polls} steps of ${r0.endN}`);
      // (with the mouse taken for an input, every live poll was logged: the log filled RUN_INPUTS_MAX in 20 minutes of stop motion)
      console.log(`      inputs logged ${r0.inputs.length} of ${P.polls} polls, each carrying the mouse; ${r0.inputs.some(x => 'mouse' in x.input) ? 'a MOUSE logged' : 'no mouse logged'}`);
      console.log(`      the save at the card ${atCard.digest}, the log's at the next tick ${r0.endDigest}, the replay's ${r.digest}`);
      assert(r0.endDigest === atCard.digest && r.same.sheet && r.same.save && r.game.state.armoury.range.end && P.ffFrames > 0 && P.polls < r0.endN && P.stopSent !== null && ffLogged.length === 1
        && r0.inputs.length < P.polls / 10 && !r0.inputs.some(x => 'mouse' in x.input),
        JSON.stringify({ same: r.same, steps: r0.endN, polls: P.polls, ffFrames: P.ffFrames, stopSent: P.stopSent, ffLogged: ffLogged.length, inputs: r0.inputs.length }));
    },
  },
  {
    name: 'v0.0.21 (its build sheet §1 item 16, §0 item 22): a lane on a drawn house (the tier one by T on 48213, &draw=drawn) exported and replayed in node rebuilds its house from the save at GO and ends on the same code, run sheet and save digest; the export names the code (\'A\' on the house as set) (heavy: a third lane would take the file over its 3 s of CPU)',
    heavy: true,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', draw: 'drawn' }), run = recordRun(g, houseHonestBot());
      const area = g.state.places?.live?.area ?? null, gen = JSON.parse(run.atGo).places?.live?.gen ?? null, r = replayRun(run);
      // (the set's code, as the export names it: the fill's, the lane itself the first case's)
      const set = houseCodeOf(createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }).state);
      console.log(`      the drawn lane: house ${run.code} (area ${area}; the save at GO's gen ${JSON.stringify(gen)}); ${run.steps} calls, ${run.inputs.length} inputs; replayed: the house ${r.code}, the run sheet ${r.same.sheet ? 'the same' : 'DIFFERENT'}, the save ${r.same.save ? 'the same' : 'DIFFERENT'}, the end ${JSON.stringify(r.end)}; the set's export names ${set}`);
      assert(run.code && run.code !== 'A' && gen?.code === run.code && r.same.code && r.same.sheet && r.same.save && r.end && set === 'A', JSON.stringify({ code: run.code, gen, same: r.same }));
    },
  },
];
