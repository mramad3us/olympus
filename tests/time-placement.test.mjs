// Persistent people after a skip and through a call (TIME §5.9, PEOPLE §4.6; the build sheet 0.0.4
// §2.2.7, §8 item 18; TIME's test 12): a night slept from 23:00 to 05:25 puts every squadmate at their
// whereIs (a sleeping player sees nothing); the klaxon at 02:30 lived for thirty minutes facing the
// squad: each squadmate's call delay, rise, dressing and count, every change in sight a transition
// from the pose before (never a jump of a cell between ticks, never a posture without its frames),
// all at their racks in utilities by the count, all lying again five minutes after the stand-down.
// Reveille's rise likewise, in sight.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { cancel } from '../src/core/queue.js';
import { NIGHT_SRC } from '../src/sim/time/pod.js';
import { whereIs, poseAt, callDelay, placed, fireWatchOf, RISE_MS, RISE_UPPER_MS } from '../src/sim/people/place.js';
import { figureOf } from '../src/sim/people/figure.js';
import { eyeOf } from '../src/sim/people/perception.js';
import { inSight } from '../src/sim/people/place.js';
import { startActivity } from '../src/sim/time/activities.js';
import { atLocal } from '../src/sim/time/pod.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { TICK_MS, MIN_MS } from '../src/core/clock.js';

const SEED = 48213, LON = SITES.melas.lonEDeg;
const ctxOf = (g) => ({ held: false, tickMs: TICK_MS, sim: g.sim });
const hm = (ms) => { const c = marsClock(ms, LON); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / MIN_MS)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`; };
const mates = (s) => s.actors.list.filter(a => a.who && a.who !== s.player.id);
const sameAsWhere = (a, w) => a.x === w.x && a.z === w.z && (a.posture ?? 'stand') === w.posture && (a.outfit ?? 'utilities') === w.outfit && (a.y ?? 0) === w.y;
const name = (s, a) => s.people[a.who].name.family;

// (watch the squad tick by tick: the drawn pose of each, its jumps and its changes in sight)
function watch(g, ticks, input = {}) {
  const s = g.state, prev = new Map();
  const out = { ticks: 0, changesSeen: 0, popsSeen: [], outfitPops: [], berthPops: [], maxStepM: 0, frames: new Map() };
  for (let i = 0; i < ticks; i++) {
    g.step(1, input);
    const me = g.me(), eye = eyeOf(s, me), ms = s.clock.ms;
    for (const a of mates(s)) {
      const f = figureOf(s, a, ms), p = prev.get(a.id);
      const key = `${f.posture}|${f.frame}|${f.outfit}`;
      (out.frames.get(a.who) ?? out.frames.set(a.who, new Set()).get(a.who)).add(f.frame);
      if (p) {
        const step = Math.hypot(f.x - p.x, f.z - p.z) + Math.abs(f.y - p.y);
        const seen = inSight(s, eye, p.x, p.z, ms) || inSight(s, eye, f.x, f.z, ms);
        if (seen && p.key !== key) out.changesSeen++;
        if (seen) out.maxStepM = Math.max(out.maxStepM, step);
        // (a pop: a jump of a cell, 0.25 m, between two ticks, or a posture change with no transition frame either side)
        const framed = (x) => !['stand', 'sit', 'lie'].includes(x);
        if (seen && (step > 0.25 || (p.posture !== f.posture && !framed(f.frame) && !framed(p.frame)))) out.popsSeen.push({ who: name(s, a), at: hm(ms), from: p.key, to: key, step: fmt(step, 3) });
        // (an outfit changed in sight but in a dress frame: the stand-down's undressing, the review of v0.0.4)
        if (seen && p.outfit !== f.outfit && f.frame !== 'dress' && p.frame !== 'dress') out.outfitPops.push({ who: name(s, a), at: hm(ms), from: p.key, to: key });
      }
      // (a body on its berth is drawn in the berth of the pose shown, never the end state's: the view's berthOf reads figureOf's spotId)
      if (['lie', 'sitUp', 'lieDown'].includes(f.frame) && !/#[23]$/.test(f.spotId ?? '')) out.berthPops.push({ who: name(s, a), at: hm(ms), frame: f.frame, spotId: f.spotId ?? null, y: f.y });
      prev.set(a.id, { x: f.x, z: f.z, y: f.y, posture: f.posture, frame: f.frame, outfit: f.outfit, key });
    }
    out.ticks++;
  }
  return out;
}

export default [
  {
    name: 'test 12: a night slept from 23:00 to 05:25 ends with every squadmate at their whereIs (a sleeping player sees nothing), the fire watch at the post',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 23 });
      // (a quiet night: the career's first drill, drawn onto its first two nights, taken out of this one's queue)
      cancel(g.state, NIGHT_SRC, ev => ev.kind === 'alert');
      const s = g.state;
      const to = atLocal(169_905, 5 + 25 / 60, LON);
      const r = startActivity(s, g.bus, ctxOf(g), { id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { until: to } });
      assert(r.ok, JSON.stringify(r));
      g.step(1);
      const end = g.facts('skip-end').at(-1);
      const rows = [], off = [];
      for (const a of mates(s)) {
        const w = whereIs(s, a.who, s.clock.ms);
        if (!sameAsWhere(a, w)) off.push(`${name(s, a)}: ${JSON.stringify({ a: [a.posture, a.x, a.z, a.outfit], w: [w.posture, w.x, w.z, w.outfit] })}`);
        rows.push(`${name(s, a)} ${a.posture ?? 'stand'} ${a.spotId?.replace('f:e1:bay-2-1:', '').replace('f:e1:', '')}${a.curtain ? ' (curtain)' : ''}`);
      }
      console.log(`      the sleep ${hm(end.fromMs)} to ${hm(end.toMs)} (${end.minutes} min${end.interrupted ? `, stopped by ${end.by}` : ''}): ${rows.join(', ')}`);
      assert(!off.length && Math.abs(s.clock.ms - to) < 1000, `not at whereIs: ${off.join('; ')}`);
      const fw = mates(s).find(a => a.who === fireWatchOf(s));
      assert(fw?.posture === 'sit', `the fire watch: ${JSON.stringify(fw)}`);
    },
  },
  {
    name: 'test 12: the klaxon at 02:30 lived thirty minutes facing the squad: each rises after their call delay, dresses and stands at their rack; every change in sight is a transition, never a jump, an outfit changing only in a dress frame (the stand-down\'s undressing too) and a body on its berth drawn in its own berth; all at their racks in utilities by the count, lying again five minutes after the stand-down',
    timeoutMs: 240_000,
    fn() {
      const g = createGame({ scenario: 'test-night', seed: SEED });
      const s = g.state;
      g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      const klaxon = s.clock.ms, d = s.time.drills.open;
      assert(klaxon === 23_532_601_000 && d, `landed at ${klaxon}`);
      // (up, and facing down the aisle from the rack's foot, the squad in view)
      g.step(1, { act: [{ act: 'hand', args: { want: 'rise' } }] });
      g.step(Math.ceil(RISE_MS / TICK_MS) + 1);
      const me = g.me();
      Object.assign(me, { x: 50.6, z: 3.95, face: 'right', $px: 50.6, $pz: 3.95 });
      const times = mates(s).filter(a => a.who !== fireWatchOf(s)).map(a => {
        const dl = callDelay(a.who, 'alert'), t = a.trans, dr = a.dress;
        return { who: name(s, a), delayS: dl / 1000, riseS: t ? t.ms / 1000 : 0, dressedAt: dr ? dr.fromMs + dr.ms : t ? t.fromMs + t.ms : klaxon, kind: t?.kind ?? 'none' };
      });
      const seenAtStart = mates(s).filter(a => inSight(s, eyeOf(s, me), a.x, a.z)).length;
      const w1 = watch(g, Math.round((d.dueMs - s.clock.ms) / TICK_MS) + 1);
      const atCount = mates(s).filter(a => a.who !== fireWatchOf(s));
      const ready = atCount.filter(a => (a.posture ?? 'stand') === 'stand' && (a.outfit ?? 'utilities') === 'utilities' && poseAt(a, s.clock.ms).outfit === 'utilities' && /rack/.test(a.spotId ?? ''));
      const w2 = watch(g, Math.round((d.endMs + 5 * MIN_MS - s.clock.ms) / TICK_MS) + 1);
      const lying = mates(s).filter(a => a.who !== fireWatchOf(s) && a.posture === 'lie' && poseAt(a, s.clock.ms).frame === 'lie');
      for (const t of times) console.log(`      ${t.who.padEnd(10)} called +${fmt(t.delayS, 1)} s, a ${t.kind} of ${t.riseS} s, in utilities at ${hm(t.dressedAt)}`);
      const frames = [...new Set([...w1.frames.values(), ...w2.frames.values()].flatMap(x => [...x]))].sort();
      console.log(`      watched from (50.6, 3.95) facing the squad, ${seenAtStart} of ${mates(s).length} in sight: ${w1.ticks + w2.ticks} ticks, ${w1.changesSeen + w2.changesSeen} pose changes seen, the largest step between two ticks ${fmt(Math.max(w1.maxStepM, w2.maxStepM), 3)} m, ${w1.popsSeen.length + w2.popsSeen.length} pops; frames drawn: ${frames.join(', ')}`);
      console.log(`      at the count ${hm(d.dueMs)}: ${ready.length} of ${atCount.length} standing at their racks in utilities; five minutes after the stand-down ${hm(s.clock.ms)}: ${lying.length} lying (the count's line: "${s.log.filter(e => /counts the bay/.test(e.text ?? '')).at(-1)?.text}")`);
      assert(seenAtStart >= 6, `facing the squad: ${seenAtStart} in sight`);
      console.log(`      outfits changed in sight outside a dress frame: ${w1.outfitPops.length + w2.outfitPops.length}; berth frames drawn off their berth: ${w1.berthPops.length + w2.berthPops.length}`);
      assert(!w1.popsSeen.length && !w2.popsSeen.length, `pops in sight: ${JSON.stringify([...w1.popsSeen, ...w2.popsSeen].slice(0, 3))}`);
      assert(!w1.outfitPops.length && !w2.outfitPops.length, `outfits changed in sight without a dress frame: ${JSON.stringify([...w1.outfitPops, ...w2.outfitPops].slice(0, 3))}`);
      assert(!w1.berthPops.length && !w2.berthPops.length, `berth frames off their berth: ${JSON.stringify([...w1.berthPops, ...w2.berthPops].slice(0, 3))}`);
      assert(w1.changesSeen > 20 && frames.includes('sitUp') && frames.includes('climb') && frames.includes('dress') && frames.includes('lieDown'), `the transitions seen: ${w1.changesSeen}, frames ${frames}`);
      assert(ready.length === atCount.length && times.every(t => t.dressedAt <= d.dueMs), `at the count: ${ready.length} of ${atCount.length}`);
      assert(lying.length === atCount.length, `five minutes after the stand-down: ${lying.length} lying`);
    },
  },
  {
    name: 'reveille at 05:30 lived facing the squad: they sit up and climb down in sight after their delays, standing at their racks\' feet in PT kit; nothing pops',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 5 + 29 / 60, at: { area: 'melas.echo.1', x: 50.6, z: 3.95, face: 'right' } });
      const s = g.state;
      const w = watch(g, 20 * 90);
      const up = mates(s).filter(a => a.who !== fireWatchOf(s) && (a.posture ?? 'stand') === 'stand' && a.outfit === 'pt');
      console.log(`      05:29 to ${hm(s.clock.ms)} facing the squad: ${w.changesSeen} pose changes seen, the largest step ${fmt(w.maxStepM, 3)} m, ${w.popsSeen.length} pops, ${w.berthPops.length} berth frames off their berth; ${up.length} standing at their racks in PT kit`);
      assert(!w.popsSeen.length && !w.berthPops.length && up.length === 12, JSON.stringify({ pops: w.popsSeen.slice(0, 3), berth: w.berthPops.slice(0, 3), up: up.length }));
    },
  },
];
