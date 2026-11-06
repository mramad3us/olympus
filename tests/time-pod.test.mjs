// The night (TIME §9.2, §9.5; the build sheet 0.0.4 §2.2.4, §8 items 2 to 5; TIME's test 13 as far as
// this round lives the Plan of the Day): a week of taps, reveille (05:30, 07:00 at the weekend) and the
// drawn alert drill from Monday Sol 590; the drill's draw over a thousand worlds by night and
// half-hour, every one inside 00:30 to 04:30 and so the slip inside the night; one seed one draw;
// TIME §9.5's lateness classes; a new game's night posted at 12:39 and at 23:00, a v0.0.3 save's
// on load, and nothing in the sandbox.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { nightOf, drillOfWeek, weekOf, postNight, lateClass, atLocal, mondayOf, reveilleH, firstNightOf } from '../src/sim/time/pod.js';
import { weekdayName, weekdayOf } from '../src/sim/time/dates.js';
import { marsClock, localSol } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { ALERT_DRILL } from '../src/data/pod.js';
import { sorted } from '../src/core/queue.js';
import { toJSON, fromJSON } from '../src/core/state.js';
import { HOUR_MS, MIN_MS, SOL_MS } from '../src/core/clock.js';

const LON = SITES.melas.lonEDeg, SEED = 48213, MONDAY = 169_904;
const hm = (ms) => { const c = marsClock(ms, LON); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / MIN_MS)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}.${String(c.civilMs % 1000).padStart(3, '0')}`; };
const night = (kinds) => (s) => sorted(s).filter(e => kinds.includes(e.kind)).map(e => `${e.kind} ${e.atMs}`);

export default [
  {
    name: 'a week from Monday Sol 590: taps at 22:00, reveille at 05:30 on a training sol and 07:00 on Saturday and Sunday, and seed 48213\'s drill on its drawn night',
    fn() {
      const w = weekOf(MONDAY), d = drillOfWeek(SEED, w, LON);
      assert(mondayOf(w) === MONDAY && weekdayOf(MONDAY) === 0, `Monday Sol 590 is the week's Monday: ${mondayOf(w)}`);
      const rows = [];
      for (let k = 0; k < 7; k++) {
        const sol = MONDAY + k, n = nightOf({ meta: { seed: SEED }, places: { live: { site: 'melas' } } }, atLocal(sol, 12, LON));
        const drill = d.night === sol ? `, the drill ${hm(d.atMs)} on ${weekdayName(d.drill)}` : '';
        rows.push(`${weekdayName(sol).padEnd(9)} ${sol}: taps ${hm(n.tapsMs)} (${n.tapsMs}), reveille ${hm(n.reveilleMs)} on ${weekdayName(sol + 1)}${n.holiday ? ' (holiday routine)' : ''}${drill}`);
        assert(marsClock(n.tapsMs, LON).hour === 22 && n.tapsMs % 1000 === 0 && n.reveilleMs % 1000 === 0, 'whole seconds');
        const rh = marsClock(n.reveilleMs, LON);
        assert(rh.hour === ([5, 6].includes(weekdayOf(sol + 1)) ? 7 : 5) && rh.minute === ([5, 6].includes(weekdayOf(sol + 1)) ? 0 : 30), `reveille on ${weekdayName(sol + 1)}: ${hm(n.reveilleMs)}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(nightOf({ places: { live: { site: 'melas' } } }, atLocal(MONDAY, 12.65, LON)).tapsMs === 23_514_026_000, 'the sheet\'s taps on Monday Sol 590');
      assert(d.drill === d.night + 1 && d.atMs >= atLocal(d.drill, ALERT_DRILL.fromH, LON) && d.atMs <= atLocal(d.drill, ALERT_DRILL.toH, LON), JSON.stringify(d));
      console.log(`      seed ${SEED}, week ${w}: the drill on ${weekdayName(d.night)} night, ${hm(d.atMs)} on ${weekdayName(d.drill)} (a clock time lands on its first whole second: 02:30 reads ${hm(atLocal(MONDAY + 1, 2.5, LON))})`);
    },
  },
  {
    name: 'the drill\'s draw over a thousand worlds: every one inside 00:30 to 04:30 of the next sol, so the slip lies inside the night; spread over the nights and the half-hours; one seed one draw',
    fn() {
      const byNight = Array(7).fill(0), byHalf = Array(8).fill(0), w = weekOf(MONDAY);
      let outside = 0;
      for (let seed = 1; seed <= 1000; seed++) {
        const d = drillOfWeek(seed, w, LON), c = marsClock(d.atMs, LON);
        const h = c.civilMs / HOUR_MS;
        if (c.timeslip || h < ALERT_DRILL.fromH || h > ALERT_DRILL.toH + 1 / 3600 || d.drill !== d.night + 1) outside++;
        byNight[weekdayOf(d.night)]++;
        byHalf[Math.min(7, Math.floor((h - 0.5) * 2))]++;
        const again = drillOfWeek(seed, w, LON);
        assert(again.atMs === d.atMs, `seed ${seed} drew twice`);
      }
      console.log(`      by night: ${byNight.map((n, i) => `${weekdayName(MONDAY + i).slice(0, 3)} ${n}`).join(', ')}`);
      console.log(`      by half-hour from 00:30: ${byHalf.map((n, i) => `${String(Math.floor((i + 1) / 2)).padStart(2, '0')}:${i % 2 ? '00' : '30'} ${n}`).join(', ')}`);
      assert(outside === 0, `${outside} drills outside the window`);
      assert(byNight.every(n => n > 100 && n < 190) && byHalf.every(n => n > 80 && n < 170), 'the spread');
      // (the next week another draw; the same week another seed another)
      const a = drillOfWeek(SEED, w, LON), b = drillOfWeek(SEED, w + 1, LON);
      assert(b.atMs > a.atMs && b.atMs - a.atMs !== 7 * SOL_MS && weekOf(b.night) === w + 1, 'the next week is drawn afresh, not the same night a week on');
      console.log(`      seed ${SEED}: week ${w} ${weekdayName(a.night)} ${hm(a.atMs)}, week ${w + 1} ${weekdayName(b.night)} ${hm(b.atMs)}`);
    },
  },
  {
    name: 'TIME §9.5\'s lateness from the due time: on-time to 0, late-minor to 2 min, late to 10, very-late to 30, else missed; never is missed',
    fn() {
      const at = [-60_000, 0, 60_000, 300_000, 900_000, 1_500_000, 2_400_000, null];
      const out = at.map(ms => `${ms === null ? 'never' : `${ms >= 0 ? '+' : ''}${ms / MIN_MS} min`} ${lateClass(ms)}`);
      console.log(`      ${out.join(', ')}`);
      assert(at.map(lateClass).join() === 'on-time,on-time,late-minor,late,very-late,very-late,missed,missed', out.join());
    },
  },
  {
    name: 'a new game posts its night: at 12:39 tonight\'s taps, reveille and (on its night, one of the career\'s first two) the drill; at 23:00 reveille (and the career\'s first drill); a v0.0.3 save gets its night on load; the sandbox, without a roster, nothing',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED });
      const ev = night(['taps', 'reveille', 'alert'])(g.state);
      const pod = g.state.time.pod;
      // (the career's first week: its drill on one of its first two nights, here the first: the review of v0.0.4, CAREER §5.2's first-night spike)
      const first = drillOfWeek(SEED, weekOf(MONDAY), LON, firstNightOf(g.state));
      console.log(`      a career begun Monday 12:39: its first drill on ${weekdayName(first.night)} night, ${hm(first.atMs)} (the week's draw without the rule: ${weekdayName(drillOfWeek(SEED, weekOf(MONDAY), LON).night)} night)`);
      assert(first.night - firstNightOf(g.state) < 2 && first.night >= firstNightOf(g.state), JSON.stringify(first));
      assert(pod.tapsMs === 23_514_026_000 && pod.reveilleMs === 23_543_401_000 && (pod.drillMs === null) === (first.night !== MONDAY) && ev.length === (first.night === MONDAY ? 3 : 2), `12:39: ${ev.join(', ')} ${JSON.stringify(pod)}`);
      const job = g.state.events.find(e => !e.dead && e.payload?.job === 'solDirector');
      const jc = marsClock(job.atMs, LON);
      assert(jc.hour === 20 && jc.minute === 0, `the sol director at ${hm(job.atMs)}`);
      console.log(`      at ${hm(g.state.clock.ms)}: ${ev.join(', ')}; the sol director at ${hm(job.atMs)} (local@20:00)`);
      // (the director at 20:00 on Tuesday posts Tuesday's night, the drill with it)
      const g2 = createGame({ scenario: 'barracks', seed: SEED, hour: 19.9, startMs: atLocal(MONDAY + 1, 12, LON) });
      g2.skipNow({ activity: 'idle', planMs: 10 * MIN_MS, mask: 'D', kind: 'outcome' });
      const ev2 = night(['taps', 'reveille', 'alert'])(g2.state), d = drillOfWeek(SEED, weekOf(MONDAY), LON, firstNightOf(g2.state));
      assert(ev2.some(e => e === `alert ${d.atMs}`) && g2.state.time.pod.drillMs === d.atMs, `Tuesday 20:00: ${ev2.join(', ')}`);
      console.log(`      Tuesday after 20:00: ${ev2.join(', ')} (the drill ${hm(d.atMs)})`);
      const g3 = createGame({ scenario: 'barracks', seed: SEED, hour: 23 });
      const ev3 = night(['taps', 'reveille', 'alert'])(g3.state);
      assert(ev3.includes('reveille 23543401000') && ev3.length === (first.night === MONDAY ? 2 : 1), `23:00: ${ev3.join(', ')}`);
      console.log(`      at 23:00: ${ev3.join(', ')}`);
      // (a v0.0.3 save: its time without the night's records, no night events: the upgrade posts them, once)
      const old = JSON.parse(g3.save());
      for (const k of ['pod', 'drills', 'attend', 'prefs', 'doing', 'resume']) delete old.time[k];
      old.events = old.events.filter(e => !['taps', 'reveille', 'alert'].includes(e.kind) && e.payload?.job !== 'solDirector');
      delete old.flags['mig:time-pod'];
      const loaded = fromJSON(JSON.stringify(old));
      const g4 = createGame({ scenario: 'barracks', seed: SEED });
      g4.load(loaded);
      const ev4 = night(['taps', 'reveille', 'alert'])(g4.state), jobs4 = g4.state.events.filter(e => !e.dead && e.payload?.job === 'solDirector').length;
      const again = createGame({ scenario: 'barracks', seed: SEED }); again.load(g4.save());
      assert(ev4.join() === ev3.join() && g4.state.flags['mig:time-pod'] && jobs4 === 1 && again.save() === g4.save(), `the upgrade: ${ev4.join(', ')}, flag ${g4.state.flags['mig:time-pod']}, ${jobs4} directors`);
      console.log(`      a v0.0.3 save at 23:00 loaded: ${ev4.join(', ')}, flag mig:time-pod, the sol director posted; loaded again, byte for byte`);
      const sb = createGame({ scenario: 'sandbox', seed: SEED });
      const evs = night(['taps', 'reveille', 'alert'])(sb.state);
      assert(evs.length === 0 && postNight(sb.state, sb.state.clock.ms) === null, `the sandbox: ${evs.join(', ')}`);
      console.log(`      the sandbox: nothing posted (no roster), its skips not stopped by a drill`);
    },
  },
];
