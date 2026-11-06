// Lived against skipped (TIME §5.5's parity contract; the build sheet 0.0.4 §5.2; TIME's test 8): a
// shower, a night's sleep to the klaxon and R's fifteen-minute wait, each run from one state twice,
// as a fast-forward of lived ticks (force 'ff': the real sim, every layer, the body's per-tick mix)
// and as an outcome skip (force 'outcome': minute steps, the activity's constant load). Prints both
// bodies and their differences, the seconds of every scheduled event and the body's events, and the
// compute of each (a fast-forward stopped by an event lands at that tick and lives the rest of it, so its
// clock reads one tick on). Holds BODY §25's tolerances (energy 1% or 5 kcal, water 0.01 L, the bladder 5 mL,
// the bowel 1 g, grime 0.5, sleep pressure 0.05 h, stamina 0.5), and, both bodies synced to their
// clocks, the engines' own agreement (ENGINE_TOL: 0.01 kcal, 0.1 mL of water, 0.01 mL, 0.01 g, 0.01
// grime, 0.001 h, 0.01 stamina), and every event at the same second.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { bodyOf, bodySync } from '../src/sim/body/body.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';

const SEED = 48213, LON = SITES.melas.lonEDeg;
const hm = (ms) => { const c = marsClock(ms, LON); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / 60_000)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`; };
/** BODY §25's tolerances, lived against skipped. */
const TOL = Object.freeze({ energyK: 0.01, energyKcal: 5, waterL: 0.01, bladderMl: 5, bowelG: 1, grime: 0.5, pressureH: 0.05, stamina: 0.5 });
/** What the two engines really differ by, both bodies synced to their clocks (the review of v0.0.4: unsynced, the fast-forward's last minute in body.held read as a 1 kcal, 1 mL drift): a drift under BODY's tolerances still fails. */
const ENGINE_TOL = Object.freeze({ energy: 0.01, water: 0.0001, bladder: 0.01, bowel: 0.01, grime: 0.01, pressure: 0.001, stamina: 0.01 });
const ledgers = (b) => ({ energy: b.energy.gutKcal + b.energy.reserveKcal, water: b.water.balanceL + (b.water.gutL ?? 0), bladder: b.bladder.ml, bowel: b.bowel.g, grime: b.hygiene.grime, pressure: b.sleep.pressureH, stamina: b.stamina });
const SCHEDULED = ['taps', 'reveille', 'alert', 'activity', 'body-event', 'body-interrupt'];

function runOne(setup, force) {
  const g = setup();
  const s = g.state;
  const a = g.state.$parityAct;
  g.clearFacts();
  const t0 = performance.now();
  g.step(1, { act: [{ act: 'activity', args: { ...a, force } }] });
  for (let n = 0; s.skip && n < 1_000_000; n++) g.step(1);
  const ms = performance.now() - t0;
  // (both bodies brought to their clocks first: a fast-forward's last live minute is still in body.held,
  // not yet folded into the record, so read unsynced it differs by that minute, not by the engines)
  bodySync(s, s.player.id, s.clock.ms);
  const end = g.facts('skip-end').at(-1);
  const evs = g.facts().filter(([k]) => SCHEDULED.includes(k)).map(([k, d]) => `${k}:${d.kind ?? d.phase ?? ''}:${d.activity ?? d.ledger ?? ''}@${d.atMs ?? (d.phase === 'end' ? d.toMs : d.fromMs)}`);
  return { g, end, ms, body: ledgers(bodyOf(s, s.player.id)), evs, clock: s.clock.ms };
}

const SCENES = {
  shower: () => { const g = createGame({ scenario: 'test-shower', seed: SEED, at: { area: 'melas.echo.1', x: 58.95, z: 16.27, face: 'down' } }); g.state.$parityAct = { id: 'shower', spotId: 'f:e1:head-2a:shower-2#1' }; return g; },
  night: () => { const g = createGame({ scenario: 'test-night', seed: SEED }); g.state.$parityAct = { id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { until: 'reveille' } }; return g; },
  wait: () => { const g = createGame({ scenario: 'barracks', seed: SEED, hour: 19.5, at: { area: 'melas.echo.1', x: 55.75, z: 3.95, face: 'down' } }); g.state.$parityAct = { id: 'wait' }; return g; },
};

export default [
  {
    name: 'test 8: a shower, a night to the klaxon and a 15-minute wait, each fast-forwarded tick by tick against skipped by the minute from one state: BODY §25\'s tolerances, every event at the same second',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const fails = [];
      for (const [name, setup] of Object.entries(SCENES)) {
        const ff = runOne(setup, 'ff'), out = runOne(setup, 'outcome');
        const d = {}, bad = [];
        for (const k of Object.keys(ff.body)) d[k] = ff.body[k] - out.body[k];
        const tolE = Math.max(TOL.energyKcal, TOL.energyK * Math.abs(out.body.energy));
        if (Math.abs(d.energy) > tolE) bad.push(`energy ${fmt(d.energy, 2)} kcal (±${fmt(tolE, 1)})`);
        if (Math.abs(d.water) > TOL.waterL) bad.push(`water ${fmt(d.water, 4)} L`);
        if (Math.abs(d.bladder) > TOL.bladderMl) bad.push(`bladder ${fmt(d.bladder, 2)} mL`);
        if (Math.abs(d.bowel) > TOL.bowelG) bad.push(`bowel ${fmt(d.bowel, 3)} g`);
        if (Math.abs(d.grime) > TOL.grime) bad.push(`grime ${fmt(d.grime, 3)}`);
        if (Math.abs(d.pressure) > TOL.pressureH) bad.push(`pressure ${fmt(d.pressure, 4)} h`);
        if (Math.abs(d.stamina) > TOL.stamina) bad.push(`stamina ${fmt(d.stamina, 3)}`);
        for (const k of Object.keys(ENGINE_TOL)) if (Math.abs(d[k]) > ENGINE_TOL[k]) bad.push(`${k} ${fmt(d[k], 5)} past the engines' own ${ENGINE_TOL[k]}`);
        const evA = ff.evs.join(' '), evB = out.evs.join(' ');
        // (the fast-forward lands at the event's tick and lives the rest of it: its clock is one tick on, the next live tick's start)
        if (evA !== evB || Math.abs(ff.clock - out.clock) > 50) bad.push(`events: ff ${ff.evs.length} [${ff.evs.filter(e => !out.evs.includes(e)).slice(0, 4).join(', ')}], outcome ${out.evs.length} [${out.evs.filter(e => !ff.evs.includes(e)).slice(0, 4).join(', ')}]; clocks ${ff.clock} ${out.clock}`);
        console.log(`      ${name}: ${hm(out.end.fromMs)} to ${hm(out.end.toMs)} (${out.end.minutes} min${out.end.interrupted ? `, stopped by ${out.end.by}` : ''}); ff ${fmt(ff.ms, 0)} ms of compute, outcome ${fmt(out.ms, 1)} ms`);
        for (const k of Object.keys(ff.body)) console.log(`        ${k.padEnd(9)} ff ${fmt(ff.body[k], 4).padStart(11)}  outcome ${fmt(out.body[k], 4).padStart(11)}  diff ${d[k] >= 0 ? '+' : ''}${fmt(d[k], 4)}`);
        console.log(`        events (${out.evs.length}): ${out.evs.slice(0, 8).map(e => e.replace(/@(\d+)/, (m, t) => `@${hm(Number(t))}`)).join(', ')}${out.evs.length > 8 ? ', …' : ''}${bad.length ? `\n        OUT OF TOLERANCE: ${bad.join('; ')}` : ''}`);
        if (bad.length) fails.push(`${name}: ${bad.join('; ')}`);
      }
      assert(!fails.length, fails.join(' | '));
    },
  },
];
