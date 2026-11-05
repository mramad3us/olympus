// The event queue (src/core/queue.js; TECH §4) and recurring jobs (src/sim/jobs.js; TECH §4.3):
// the heap's order, a fuzz against a sorted reference with saves and loads, cancelling and
// compaction, pre-drawn hazards, the every grammar on the Melas clock and in UTC, and one live
// occurrence per recurring job after a new game and after two sols skipped.
import { assert, fmt } from './helpers.mjs';
import { newState, toJSON, fromJSON, resetDomains } from '../src/core/state.js';
import { post, cancel, nextAt, popDue, popNext, hazard, size, live, sorted, rebuildIndex, COMPACT_DEAD_FRAC, QUEUE_LIVE_MAX } from '../src/core/queue.js';
import { stream, int } from '../src/core/rng.js';
import { SEC_MS, MIN_MS, HOUR_MS, DAY_MS, SOL_MS } from '../src/core/clock.js';
import { marsClock, utc, utcText, localSol } from '../src/core/calendar.js';
import { solText } from '../src/sim/time/dates.js';
import { nextOccurrence, parseEvery } from '../src/sim/jobs.js';
import { START_MS, SITES } from '../src/data/setting/calendar.js';
import { createGame } from './game.mjs';
import { dummyWorld } from './game-dummy.mjs';

const MELAS_E = SITES.melas.lonEDeg;
const order = (a, b) => a.atMs - b.atMs || a.prio - b.prio || a.seq - b.seq;

export default [
  {
    name: 'post floors atMs to the second and names events e<n>; pops come in (atMs, prio, seq) order, ties in posting order',
    fn() {
      const s = newState(1, { startMs: 1_000_000 });
      const ids = [
        post(s, { atMs: 5_250, kind: 'a', src: 'x' }),               // (5.25 s → 5 s)
        post(s, { atMs: 5_999, kind: 'b', src: 'x', prio: 2 }),       // (→ 5 s, prio 2: before a)
        post(s, { atMs: 4_000, kind: 'c', src: 'y', prio: 5 }),
        post(s, { atMs: 5_000, kind: 'd', src: 'y', prio: 2 }),       // (ties b: posted after it)
        post(s, { atMs: 6_000, kind: 'e', src: 'z', prio: 0, line: 'General quarters.', who: null }),
      ];
      assert(ids.join() === 'e1,e2,e3,e4,e5' && s.meta.next.e === 6, ids.join());
      assert(s.events.every(ev => ev.atMs % SEC_MS === 0) && !('who' in s.events.find(ev => ev.id === 'e5')), JSON.stringify(s.events));
      assert(nextAt(s) === 4_000, `nextAt ${nextAt(s)}`);
      const popped = popDue(s, 5_000).map(ev => `${ev.kind}@${ev.atMs / 1000}s/p${ev.prio}`);
      assert(popped.join() === 'c@4s/p5,b@5s/p2,d@5s/p2,a@5s/p5' && nextAt(s) === 6_000 && live(s) === 1, popped.join());
      const json = toJSON(s);
      assert(json.includes('"id":"e5"') && !json.includes('$events'), 'the queue saves without its index');
      console.log(`      posted ${ids.length}; popped to 5 s: ${popped.join(', ')}; then e5 at 6 s (prio 0) left, nextAt ${nextAt(s)}`);
    },
  },
  {
    name: '100,000 random posts, cancels and pops against a sorted reference, with a save and load every 10,000th: the same pops',
    fn() {
      resetDomains();                                              // (a bare queue: no game's domains fill it on load)
      let s = newState(7, { startMs: 0 });
      const r = stream('queue-fuzz');
      const ref = [];                                               // (the reference: every live event, sorted)
      const insert = (ev) => { let lo = 0, hi = ref.length; while (lo < hi) { const m = (lo + hi) >> 1; if (order(ref[m], ev) < 0) lo = m + 1; else hi = m; } ref.splice(lo, 0, ev); };
      let now = 0, posts = 0, cancels = 0, cancelled = 0, pops = 0, maxHeap = 0, loads = 0, compactions = 0;
      const popsQ = [], popsR = [];
      const t0 = performance.now();
      for (let i = 0; i < 100_000; i++) {
        const k = int(r, 100);
        if (k < 55) {
          const ev = { atMs: now + int(r, 6 * 3_600_000), prio: int(r, 6), kind: 'k', src: `src${int(r, 24)}` };
          const id = post(s, ev);
          insert({ ...ev, atMs: Math.floor(ev.atMs / 1000) * 1000, id, seq: Number(id.slice(1)) });
          posts++;
        } else if (k < 58) {
          const src = `src${int(r, 24)}`, minPrio = int(r, 7);
          const pred = minPrio === 6 ? null : (ev) => ev.prio >= minPrio;
          const before = s.$events?.compactions ?? 0;
          const n = cancel(s, src, pred);
          compactions += (s.$events?.compactions ?? 0) - before;
          const keep = ref.filter(ev => !(ev.src === src && (!pred || pred(ev))));
          assert(ref.length - keep.length === n, `op ${i}: cancel said ${n}, the reference ${ref.length - keep.length}`);
          ref.length = 0; ref.push(...keep);
          cancels++; cancelled += n;
        } else {
          now += int(r, 30_000);
          for (const ev of popDue(s, now)) popsQ.push(ev.id);
          while (ref.length && ref[0].atMs <= now) popsR.push(ref.shift().id);
          pops++;
        }
        maxHeap = Math.max(maxHeap, size(s));
        if (i % 10_000 === 9_999) {
          const json = toJSON(s);
          s = fromJSON(json);
          assert(toJSON(s) === json, `op ${i}: a load changed the save`);
          loads++;
        }
        assert(live(s) === ref.length, `op ${i}: ${live(s)} live, the reference ${ref.length}`);
      }
      const ms = performance.now() - t0;
      assert(popsQ.length === popsR.length && popsQ.every((id, k) => id === popsR[k]), `pops differ at ${popsQ.findIndex((id, k) => id !== popsR[k])}`);
      assert(compactions > 0, 'the heap was never compacted');
      const dead = s.events.filter(ev => ev.dead).length;
      assert(dead <= COMPACT_DEAD_FRAC * s.events.length + 1 && live(s) <= QUEUE_LIVE_MAX, `${dead} dead of ${s.events.length}`);
      console.log(`      ${posts} posts, ${cancels} cancels (${cancelled} events), ${pops} pops (${popsQ.length} events) in ${fmt(ms, 0)} ms: ${fmt(100_000 / ms, 0)} ops per ms`);
      console.log(`      the same ${popsQ.length} pops as the sorted reference; largest heap ${maxHeap}; ${compactions} compactions; ${loads} saves and loads, each byte for byte; ${live(s)} live at the end`);
    },
  },
  {
    name: 'cancel is lazy and saved; nextAt reads past a dead top without changing the heap; the index is rebuilt after a load',
    fn() {
      resetDomains();                                              // (a bare queue: no game's domains fill it on load)
      const s = newState(1);
      post(s, { atMs: 1000, kind: 'a', src: 'body:crossing' });
      post(s, { atMs: 2000, kind: 'b', src: 'pod' });
      for (let i = 0; i < 6; i++) post(s, { atMs: 10_000 + i * 1000, kind: 'c', src: 'pod' });
      const n1 = cancel(s, 'body:crossing');
      const before = JSON.stringify(s.events);
      assert(n1 === 1 && nextAt(s) === 2000 && JSON.stringify(s.events) === before, 'nextAt changed the heap, or missed the dead top');
      const t = fromJSON(toJSON(s));
      assert(t.events.some(ev => ev.dead) && live(t) === 7, `after a load: ${live(t)} live`);
      const n2 = cancel(t, 'pod', (ev) => ev.atMs >= 12_000);
      assert(n2 === 4 && live(t) === 3 && t.events.every(ev => !ev.dead), `cancelled ${n2}; compacted: ${t.events.length} entries`);
      assert(popNext(t, 1_000) === null && popNext(t, 2_000).kind === 'b', 'popNext');
      rebuildIndex(t);
      console.log(`      a dead top: nextAt ${nextAt(s)} with the heap untouched; after a load ${live(t) + n2} live, then 4 cancelled by predicate and the heap compacted to ${t.events.length + 1}`);
    },
  },
  {
    name: 'hazards are pre-drawn from their own stream: the same seconds in every run, a new draw per generation',
    fn() {
      const times = [];
      for (const gen of [0, 1, 2]) {
        const a = newState(48213, { startMs: START_MS }), b = newState(48213, { startMs: START_MS });
        hazard(a, { src: 'world:zones', key: 'pirates', ratePerMin: 1 / 60, gen });
        hazard(b, { src: 'world:zones', key: 'pirates', ratePerMin: 1 / 60, gen });
        assert(a.events[0].atMs === b.events[0].atMs && a.events[0].atMs % SEC_MS === 0 && a.events[0].payload.gen === gen, JSON.stringify(a.events[0]));
        times.push((a.events[0].atMs - START_MS) / MIN_MS);
      }
      assert(new Set(times).size === 3, `the generations drew the same time: ${times}`);
      // (the mean of many draws is the process's: 60 minutes, within room for chance)
      let sum = 0; const n = 4000, s = newState(9);
      for (let g = 0; g < n; g++) { hazard(s, { src: 'test', key: 'mean', ratePerMin: 1 / 60, gen: g }); }
      for (const ev of s.events) sum += ev.atMs - s.clock.ms;
      const meanMin = sum / n / MIN_MS;
      assert(Math.abs(meanMin - 60) < 4 * 60 / Math.sqrt(n), `mean ${meanMin} min`);
      console.log(`      rate 1/60 min: generations 0, 1, 2 at +${times.map(t => fmt(t, 2)).join(', +')} min; ${n} draws average ${fmt(meanMin, 2)} min (60 expected, ±${fmt(4 * 60 / Math.sqrt(n), 1)})`);
    },
  },
  {
    name: 'the every grammar: local@00:00 at 287.2° E falls on the sol\'s 00:00 after the slip; hour@, day@, week@, every@ per their grammar',
    fn() {
      const faces = (t) => `${solText(t, MELAS_E)} (${utcText(t).slice(4)})`;
      const fiveOf = (every, opts = {}) => { const out = []; let t = START_MS; for (let k = 0; k < 5; k++) { t = nextOccurrence(every, t, { lonEDeg: MELAS_E, ...opts }); out.push(t); } return out; };
      const local = fiveOf('local@00:00');
      for (const t of local) {
        const c = marsClock(t, MELAS_E), before = marsClock(t - SEC_MS, MELAS_E);
        assert(t % SEC_MS === 0 && c.hour === 0 && c.minute === 0 && !c.timeslip && before.timeslip, `local@00:00 at ${t}: ${JSON.stringify(c)}; a second before: timeslip ${before.timeslip}`);
      }
      assert(local.every((t, k) => k === 0 || Math.abs(t - local[k - 1] - SOL_MS) <= SEC_MS), 'local@00:00 is not a sol apart');
      const hourly = fiveOf('hour@:17Z');
      assert(hourly.every((t, k) => utc(t).minute === 17 && utc(t).second === 0 && (k === 0 || t - hourly[k - 1] === HOUR_MS)), hourly.map(utcText).join());
      const daily = fiveOf('day@05:00Z');
      assert(daily.every((t, k) => utc(t).hour === 5 && utc(t).minute === 0 && (k === 0 || t - daily[k - 1] === DAY_MS)), daily.map(utcText).join());
      const weekly = fiveOf('week@Sunday/20:00');
      assert(weekly.every((t, k) => marsClock(t, MELAS_E).hour === 20 && ((localSol(t, MELAS_E).sol % 7) + 7) % 7 === 6 && (k === 0 || Math.abs(t - weekly[k - 1] - 7 * SOL_MS) <= SEC_MS)), weekly.map(faces).join());
      const fitWeekMs = 7 * SOL_MS - (7 * SOL_MS) % SEC_MS;
      const periods = fiveOf(`every@${fitWeekMs}`, { originMs: START_MS });
      assert(periods.every((t, k) => t === START_MS + (k + 1) * fitWeekMs), periods.join());
      // (strictly after: a slot exactly now is the next one)
      assert(nextOccurrence('hour@:17Z', hourly[0]) === hourly[1] && nextOccurrence('local@00:00', local[0], { lonEDeg: MELAS_E }) === local[1], 'a slot exactly now was taken again');
      let bad = 0;
      for (const e of ['hour@17Z', 'hour@:60Z', 'day@25:00Z', 'local@24:40', 'week@Funday/20:00', 'every@1500', 'monthly']) { try { parseEvery(e); } catch { bad++; } }
      assert(bad === 7, `${7 - bad} bad slots accepted`);
      console.log(`      local@00:00 (Melas, 287.2° E): ${local.map(faces).join('; ')}`);
      console.log(`      hour@:17Z: ${hourly.map(t => utcText(t).slice(-9)).join(', ')}`);
      console.log(`      day@05:00Z: ${daily.map(t => utcText(t).slice(4)).join('; ')}`);
      console.log(`      week@Sunday/20:00: ${weekly.map(faces).join('; ')}`);
      console.log(`      every@${fitWeekMs} from the start: ${periods.map(t => utcText(t).slice(4)).join('; ')}; 7 malformed slots refused`);
    },
  },
  {
    name: 'each recurring job has exactly one live occurrence after newGame and after a two-sol skipNow',
    fn() {
      const out = [];
      for (const [label, domains] of [['the sandbox', {}], ['with the dummy world', { world: dummyWorld }]]) {
        const g = createGame({ seed: 3, domains });
        const names = g.sim.jobs.recurring.map(j => j.job);
        const count = () => Object.fromEntries(names.map(n => [n, sorted(g.state).filter(ev => ev.kind === 'job' && ev.payload.job === n).length]));
        const c0 = count();
        const end = g.skipNow({ activity: 'idle', planMs: 2 * SOL_MS, mask: 'D' });
        const c1 = count();
        assert(names.length >= 1 && names.every(n => c0[n] === 1 && c1[n] === 1), JSON.stringify({ c0, c1 }));
        const days = g.facts('autosave').filter(a => a.why === 'day').length;
        assert(end.minutes === Math.floor(2 * SOL_MS / MIN_MS) && days === 2, JSON.stringify({ minutes: end.minutes, days }));
        out.push(`${label}: ${names.join(', ')} one each before and after (${days} day autosaves in two sols, ${end.minutes} minutes)`);
      }
      console.log(`      ${out.join('; ')}`);
    },
  },
];
