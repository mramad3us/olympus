// ROADMAP §4.4's moment 4, "The klaxon at 02:30" (the build sheet 0.0.4 §6, check 4), its node part
// (ROADMAP §2.3): the test-night scene, at the rack's foot in PT kit at 21:55; R: sleep until reveille;
// the alert drill (the scene forces its night's draw to 02:30) stops the night's skip at its exact
// second; the squad rises with their call delays; T gets the player up, T dresses them at the rack,
// standing at its foot before the count at 02:35 (five minutes after the klaxon, the dress at the
// alarm's tempo: the review of v0.0.4): on time. And again, dawdling: up, to the showers, R at a stall
// at 02:30 offers a late shower (the late card), "do it anyway", back and dressed: late.
// Prints the timeline (game time, the splash's real seconds, the interrupt, the body's bands, the
// squad's rises, the lateness) and saves each beat into .run/moments/.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runBot } from './bots/lib.mjs';
import { nightRoutine, dawdleRoutine, STALL } from './bots/routine.mjs';
import { splashPlan, interruptTimes } from '../src/sim/time/splash.js';
import { handOffer } from '../src/sim/places/hand.js';
import { bodyOf } from '../src/sim/body/body.js';
import { stagesOf } from '../src/sim/body/cues.js';
import { callDelay, fireWatchOf } from '../src/sim/people/place.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { TICK_MS } from '../src/core/clock.js';

const SEED = 48213, LON = SITES.melas.lonEDeg, DIR = path.join(root, '.run', 'moments'), KLAXON = 23_532_601_000;
const hm = (ms) => { const c = marsClock(ms, LON); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / 60_000)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}.${String(c.civilMs % 1000).padStart(3, '0')}`; };
const bands = (st, keys) => keys.map(k => `${k} ${st?.[k]?.band}`).join(', ');

// (the night slept to the klaxon, with a probe of the steps' clocks)
function toKlaxon() {
  const g = createGame({ scenario: 'test-night', seed: SEED });
  const steps = { n: 0, slip: 0 };
  g.sim.registerSlow({ name: 'probe', step: (s, bus, from, to) => { steps.n++; if (marsClock(to, LON).timeslip) steps.slip++; } });
  return { g, steps };
}

export default [
  {
    name: 'moment 4, "The klaxon at 02:30": the night\'s skip from 21:55 stops at 23,532,601,000 exactly, through the slip; the squad up after their delays; T, T: up and in utilities at the rack before the count, on time',
    heavy: true,
    timeoutMs: 240_000,
    fn() {
      mkdirSync(DIR, { recursive: true });
      const { g, steps } = toKlaxon(), s = g.state, pid = s.player.id;
      const save = (beat) => writeFileSync(path.join(DIR, `night-${beat}.json`), g.save());
      save('0-start');
      const offer = handOffer(s), st0 = stagesOf(bodyOf(s, pid), s.clock.ms, LON);
      const r = runBot(g, nightRoutine(), { maxTicks: 20 * 60 * 45 });
      const sk = g.facts('skip-start').find(f => f.activity === 'sleep'), end = g.facts('skip-end').find(f => f.activity === 'sleep');
      const intr = g.facts('skip-interrupt').find(f => f.id === sk.id), plan = splashPlan(sk), it = interruptTimes(intr?.prio);
      const att = s.time.attend.at(-1), count = s.log.find(e => /counts the bay/.test(e.text ?? ''));
      save('1-after');
      const rises = s.actors.list.filter(a => a.who !== pid && a.who !== fireWatchOf(s)).map(a => `${s.people[a.who].name.family} +${fmt(callDelay(a.who, 'alert') / 1000, 1)} s`);
      const lapsed = plan.lapseS * (end.toMs - end.fromMs) / (end.planned - end.fromMs);
      console.log(`      ${hm(sk.fromMs)}: R "${offer.label}"; bands ${bands(st0, ['bladder', 'fatigue', 'thirst', 'hunger'])}`);
      console.log(`      the sleep ${hm(sk.fromMs)} to ${hm(end.toMs)} = ${end.toMs} (${end.minutes} game min, ${steps.n} steps, ${steps.slip} of them in the slip at 24:00), stopped by ${intr?.letter} '${intr?.kind}': "${intr?.line}"`);
      console.log(`      the splash: in ${plan.inS} s, the lapse cut at about ${fmt(lapsed, 2)} s of its ${fmt(plan.lapseS, 2)} s, decel ${it.decelS} s, the beat ${it.beatS} s, out ${it.outS} s`);
      console.log(`      the squad up after their delays: ${rises.join(', ')}`);
      console.log(`      the player: ${r.log.map(x => `${x.name}${x.fail ? ` (${x.fail})` : ''} at tick ${x.at}`).join('; ')}`);
      console.log(`      at the rack in utilities ${hm(att.arrivedMs)}, the count due ${hm(att.dueMs)}: ${att.class} (${fmt(att.lateMs / 1000, 0)} s); "${count?.text}"; the stand-down ${hm(s.time.drills.last.endMs)}`);
      assert(end.toMs === KLAXON && s.time.drills.last.atMs === KLAXON && KLAXON % TICK_MS === 0 && end.interrupted && intr.letter === 'A', `the landing: ${end.toMs}`);
      assert(steps.slip > 30, `the night's steps in the slip: ${steps.slip}`);
      assert(r.done && att.class === 'on-time' && att.arrivedMs < att.dueMs, `the routine: ${r.reason}; ${JSON.stringify(att)}`);
    },
  },
  {
    name: 'moment 4 dawdling: up at the klaxon, to the showers, R at a stall at 02:30 is late (the late card), "do it anyway", back and dressed: late, about 02:43',
    heavy: true,
    timeoutMs: 240_000,
    fn() {
      const { g } = toKlaxon(), s = g.state;
      const save = (beat) => writeFileSync(path.join(DIR, `night-dawdle-${beat}.json`), g.save());
      let late = null;
      const routine = dawdleRoutine();
      const bot = (state, me, mem) => { const o = handOffer(state); if (o?.spotId === STALL && o.late) late ??= { ...o, at: state.clock.ms }; return routine(state, me, mem); };
      const r = runBot(g, bot, { maxTicks: 20 * 60 * 40 });
      save('1-after');
      const att = s.time.attend.at(-1), shower = g.facts('skip-end').find(f => f.activity === 'shower');
      console.log(`      at the stall ${late ? hm(late.at) : '?'}: R "${late?.label}" with the late card: ${JSON.stringify(late?.late ? { block: late.late.block, due: hm(late.late.dueMs), walkS: late.late.walkMs / 1000, dressS: late.late.dressMs / 1000, fitS: late.late.fitMs / 1000, label: late.late.label } : null)}`);
      console.log(`      "do it anyway": the shower ${hm(shower.fromMs)} to ${hm(shower.toMs)}; back at the rack, dressed: ${hm(att.arrivedMs)}, ${att.class} by ${fmt(att.lateMs / 60_000, 1)} min (the steps: ${r.log.map(x => x.name).join(', ')})`);
      assert(r.done && late?.late?.block === 'drill' && shower && att.class === 'late', `the dawdle: ${r.reason}; ${JSON.stringify({ late: late?.late, att })}`);
      const c = marsClock(att.arrivedMs, LON);
      assert(c.hour === 2 && c.minute >= 42 && c.minute <= 47, `arrived ${hm(att.arrivedMs)}`);
    },
  },
];
