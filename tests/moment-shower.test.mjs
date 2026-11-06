// ROADMAP §4.4's moment 3, "Ten minutes under the shower" (the brief: "taking a shower will take a chunk
// of time forward on the clock"; the build sheet 0.0.4 §6, check 3), its node part (ROADMAP §2.3): the
// test-shower scene, filthy after PT; out of the bay and across the hall to Head A's free stall
// (tests/bots/routine.mjs), R there: the shower skipped behind its full splash. Prints the timeline
// (game time, the splash's real seconds by TIME §6.2's model, the parts' ends, the body's bands
// before and after, every ledger's move through the gap) and saves each beat into .run/moments/.
// Holds: it begins at a free stall about 19:31 and ends ten minutes later exactly, grime from 58 to
// about 2 and the hair wet, every need run through the gap (the user, 2026-10-28: "when sleeping, the
// hunger meter is frozen that's a bug"), the splash 4.29 s; lived and skipped the same body
// (time-parity and body-skip hold the tolerances).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt, near, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runBot } from './bots/lib.mjs';
import { showerRoutine, STALL } from './bots/routine.mjs';
import { splashPlan } from '../src/sim/time/splash.js';
import { handOffer } from '../src/sim/places/hand.js';
import { bodyOf } from '../src/sim/body/body.js';
import { stagesOf, cuesOf } from '../src/sim/body/cues.js';
import { figureOf } from '../src/sim/people/figure.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { SCENES } from '../src/data/scenes.js';

const SEED = 48213, LON = SITES.melas.lonEDeg, DIR = path.join(root, '.run', 'moments');
const hm = (ms) => { const c = marsClock(ms, LON); return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`; };
const bands = (st) => Object.entries(st ?? {}).filter(([, v]) => v?.band).map(([k, v]) => `${k} ${v.band}`).join(', ');
const ledgers = (b) => ({ gutKcal: b.energy.gutKcal, reserveKcal: b.energy.reserveKcal, balanceL: b.water.balanceL, gutL: b.water.gutL, bladderMl: b.bladder.ml, bowelG: b.bowel.g, grime: b.hygiene.grime, stubbleH: b.hygiene.stubbleH, pressureH: b.sleep.pressureH, stamina: b.stamina });

export default [
  {
    name: 'moment 3, "Ten minutes under the shower": from the rack to a free stall in Head A, R: ten minutes skipped behind a 4.29 s splash, grime from 58 to about 2, hair wet, every need run through the gap',
    heavy: true,
    timeoutMs: 180_000,
    fn() {
      mkdirSync(DIR, { recursive: true });
      const save = (g, beat) => writeFileSync(path.join(DIR, `shower-${beat}.json`), g.save());
      const g = createGame({ scenario: 'test-shower', seed: SEED });
      const s = g.state, pid = s.player.id, scene = SCENES['test-shower'];
      save(g, '0-start');
      const t0 = s.clock.ms, b0 = bodyOf(s, pid);
      const before = ledgers(b0), st0 = stagesOf(b0, s.clock.ms, LON);
      // (the walk, then R at the stall)
      const routine = showerRoutine();
      let offer = null;
      const watcher = (state, me, mem) => { const o = handOffer(state); if (o?.verb === 'activity' && o.spotId === STALL) offer ??= o; return routine(state, me, mem); };
      const r = runBot(g, watcher, { maxTicks: 20 * 120 });
      assert(r.done, `the routine: ${r.reason} ${JSON.stringify(r.log.at(-1))}`);
      const start = g.facts('activity').find(f => f.phase === 'start' && f.activity === 'shower');
      const sk = g.facts('skip-start').find(f => f.activity === 'shower'), end = g.facts('skip-end').find(f => f.activity === 'shower');
      save(g, '1-landed');
      const b1 = bodyOf(s, pid), after = ledgers(b1), st1 = stagesOf(b1, s.clock.ms, LON), cues = cuesOf(b1, s.clock.ms), fig = figureOf(s, g.me(), s.clock.ms);
      const plan = splashPlan(sk);
      const parts = g.facts('body-event').filter(e => e.atMs >= sk.fromMs && e.atMs <= end.toMs).map(e => `${e.kind} ${hm(e.atMs)}`);
      console.log(`      ${hm(t0)} at the rack's foot (${scene.goal}); walked ${fmt(r.log[0]?.lengthM ?? 0, 1)} m in ${r.ticks} ticks to ${STALL}; R offered "${offer?.label}"`);
      console.log(`      the shower ${hm(sk.fromMs)} to ${hm(end.toMs)}: ${end.minutes} game min, ${sk.engine}, the splash ${plan.form}: in ${plan.inS} s, the lapse ${fmt(plan.lapseS, 2)} s, the strip ${plan.holdS} s, out ${plan.outS} s = ${fmt(plan.totalS, 2)} s; the ticker ${JSON.stringify(end.outcome.lines)}`);
      console.log(`      the body's events in it: ${parts.join(', ')}; landed in ${end.outcome.look.outfit}${end.outcome.look.wet ? ', hair wet' : ''} (the figure's wetK ${fmt(cues.wetK ?? fig.cues.wetK, 2)})`);
      console.log(`      bands before: ${bands(st0)}`);
      console.log(`      bands after:  ${bands(st1)}`);
      for (const k of Object.keys(before)) console.log(`        ${k.padEnd(12)} ${fmt(before[k], 3).padStart(10)} → ${fmt(after[k], 3).padStart(10)} (${after[k] - before[k] >= 0 ? '+' : ''}${fmt(after[k] - before[k], 3)})`);
      // (check 3)
      const c = marsClock(sk.fromMs, LON);
      assert(c.hour === 19 && c.minute >= 30 && c.minute <= 32, `the shower began at ${hm(sk.fromMs)}`);
      assert(end.toMs - sk.fromMs === 600_000 && !end.interrupted && end.activity === 'shower', `ten minutes: ${end.toMs - sk.fromMs} ms, interrupted ${end.interrupted}`);
      near(after.grime, 2.1, 0.6, 'grime after');
      assert(before.grime === 58 && end.outcome.look.wet && end.outcome.look.outfit === 'utilities', JSON.stringify(end.outcome.look));
      near(plan.totalS, 4.29, 0.01, 'the splash');
      // (every need ran through the gap: none frozen)
      const moved = ['reserveKcal', 'balanceL', 'bladderMl', 'pressureH', 'stubbleH'].filter(k => Math.abs(after[k] - before[k]) > 1e-6);
      assert(moved.length === 5 && after.pressureH > before.pressureH && after.bladderMl > before.bladderMl && after.reserveKcal + after.gutKcal < before.reserveKcal + before.gutKcal, `frozen ledgers: ${JSON.stringify({ before, after })}`);
      near(after.pressureH - before.pressureH, 10 / 60, 0.05, 'sleep pressure over the shower and the walk');
      console.log(`      held: ten minutes exactly (${hm(sk.fromMs)} to ${hm(end.toMs)}), grime ${before.grime} → ${fmt(after.grime, 2)}, every ledger moved (${moved.join(', ')}), the splash ${fmt(plan.totalS, 2)} s; saves in .run/moments/shower-*.json`);
    },
  },
];
