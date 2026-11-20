// OLYMPUS tests: "The window and the canopy"'s gauges on played lanes, F171 to F181's scene halves (the build sheet v0.0.28 §8), shared by the heavy suites.
//
// laneOf({ seed, tier, bot }) plays one lane to its card (tests/bots/armoury.mjs runArmoury; bot 'keys', 'T', 'panel' (the keys with the
// show clears by the step panel) or 'fuzz', or a bot) and reads
// what the gauges ask of it: { done, stuck, ticks, realMin, gameMin, card, faults, slip, short, far, slipPast (the slip carried past the
// rank's check), sums (F173: issued, fired, back, held, losses, the identity's gap), brass (F174: policed, fired, left), cleans, turnBacks,
// passed, late, errors, end (the end's phase), added (the twentieth added at the count) }. lanesOf(sheets, bots, seeds) plays the grid;
// gauges(lanes) the gauges' lines: F171 stuck lanes, and an honest lane (the keys, T, the panel) that ends anywhere but 'clear' (the review of v0.0.28
// B: the panel's show clear then the walk to the far cases ended the scene 'stopped', and runArmoury counted it as the card reached); F172
// the slip past the check; F173 an identity off, or the fault 'count' on a lane whose carton was not short and signed uncounted (the review:
// a loaded magazine dropped on the lane was booked as the NCO's short count); F174 the honest lanes' brass off; the longest lane; each with
// the lanes that broke it.
import { armGame } from './armoury-world.mjs';
import { armouryBot, armouryTBot, armouryFuzzBot, runArmoury } from './bots/armoury.mjs';
import { armouryOf } from '../src/sim/scenarios/armoury-day.js';
import { reconcile } from '../src/sim/arms/armoury.js';

const botOf = (bot, seed) => (typeof bot === 'function' ? bot : bot === 'T' ? armouryTBot() : bot === 'fuzz' ? armouryFuzzBot({ seed }) : bot === 'panel' ? armouryBot({ panel: true }) : armouryBot());
/** One lane read for the gauges (see the header); setup a later start (armoury-world.mjs armGame's), the tests' own. */
export function laneOf({ seed, tier, bot = 'keys', setup = null }) {
  const g = armGame({ seed, tier, setup }), t0 = g.state.clock.ms;
  const out = runArmoury(g, botOf(bot, seed));
  const s = g.state, R = armouryOf(s), A = R.arm, pid = s.player.id, line = s.armoury.ammoIssues.find(a => a.id === R.issueId) ?? {};
  // (F173 on the books as the lane leaves them, every settlement made (the shakedown's recount, the loose rounds found, the held ones taken
  // back): reconcile at the end, its short the gap, 0 when issued = fired + back + held + losses. It read the declaration's record and took
  // the gap against that record's own short, issued - (fired + back + held + losses + short), which is 0 by construction (armoury.js
  // reconcile defines short so), and never failed (the fixer of v0.0.28's code review, finding 1). Judged on the lanes that made the
  // declaration, as F173 says ("at every declaration"): a lane stopped on the line before it leaves a round of its show clear loose there
  // for the NCO's search that never came, a true short, not a broken book)
  const rec = reconcile(s, pid);
  const issued = rec.issued ?? line.n ?? 0, gap = rec.short ?? 0;
  const left = Object.values(R.brassTiles ?? {}).reduce((t, x) => t + x.mine, 0);
  return {
    seed, tier, bot: typeof bot === 'string' ? bot : 'bot', done: out.done, stuck: out.stuck, ticks: out.ticks, realMin: out.ticks / 1200, gameMin: (s.clock.ms - t0) / 60000,
    card: out.card?.summary ?? null, faults: out.faults, slip: A.slip, short: A.short, added: !!A.added, end: out.end?.phase ?? null, far: A.relay?.far ?? 0,
    slipPast: A.slip && !A.slipCaught && !A.slipFound && !!A.issued, declared: !!A.declared, sums: { issued, fired: rec.fired ?? 0, back: rec.back ?? 0, held: rec.held ?? 0, losses: rec.losses ?? 0, short: rec.short ?? 0, gap },
    brass: { policed: R.policed ?? 0, fired: line.fired ?? 0, left }, cleans: A.cleans, turnBacks: A.turnBacks, passed: A.passed, late: A.late, tempo: A.cleans[0]?.tempo ?? null, errors: g.errors.length,
  };
}
/** The grid of lanes (see the header). */
export function lanesOf(sheets, bots, seeds) {
  const out = [];
  for (const tier of sheets) for (const bot of bots) for (const seed of seeds) out.push(laneOf({ seed, tier, bot }));
  return out;
}
/** The gauges' lines over a grid (see the header): { F171, F172, F173, F174, longest }. */
export function gauges(lanes) {
  const honest = lanes.filter(l => l.bot === 'keys' || l.bot === 'T' || l.bot === 'panel');
  return {
    F171: lanes.filter(l => !l.done || l.errors || (honest.includes(l) && l.end !== 'clear')),
    F172: lanes.filter(l => l.slipPast),
    F173: lanes.filter(l => l.done && ((l.declared && l.sums.gap !== 0) || (l.faults.includes('count') && !(l.short && !l.added)))),
    F174: honest.filter(l => l.done && (l.brass.policed !== l.brass.fired || l.brass.left)),
    longest: lanes.reduce((a, l) => (!a || l.realMin > a.realMin ? l : a), null),
  };
}
