// Persistent people after a skip and through a call (TIME §5.9, PEOPLE §4.6; the build sheet 0.0.4
// §2.2.7, §8 item 18; TIME's test 12): a night slept from 23:00 to 05:25 puts every squadmate at their
// whereIs (a sleeping player sees nothing); the klaxon at 02:30 lived for thirty minutes facing the
// squad: each squadmate's call delay, rise, dressing and count, every change in sight a transition
// from the pose before (never a jump of a cell between ticks, never a posture without its frames),
// all at their racks in utilities by the count, all lying again five minutes after the stand-down.
// Reveille's rise likewise, in sight. And the transitions' lengths, a little slower since v0.0.4 (the
// user, 2026-11-06: "slightly slower animations on getting in and out of rack"): every length printed
// beside v0.0.4's, the squad's at each call by its tempo, each phase's share, the player's own rise and
// lying down (the page's R lies you down in sight before the night's splash).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { cancel } from '../src/core/queue.js';
import { NIGHT_SRC, postNight } from '../src/sim/time/pod.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { whereIs, poseAt, callDelay, placed, fireWatchOf, transMs, RISE_MS, RISE_UPPER_MS, RISE_KEYS, LOWER_KEYS, UPPER_Y_M, UNHURRIED_K, CALL_DELAY_MS } from '../src/sim/people/place.js';
import { figureOf } from '../src/sim/people/figure.js';
import { eyeOf } from '../src/sim/people/perception.js';
import { inSight } from '../src/sim/people/place.js';
import { startActivity } from '../src/sim/time/activities.js';
import { atLocal } from '../src/sim/time/pod.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { TICK_MS, MIN_MS, SOL_MS } from '../src/core/clock.js';
import { START_MS } from '../src/data/setting/calendar.js';

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
        const dl = callDelay(a.who, 'alert', klaxon, SEED), t = a.trans, dr = a.dress;
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
  {
    name: 'getting in and out of the rack, a little slower (the user, 2026-11-06, of test-night: "the whole scene looks rushed, slightly slower animations on getting in and out of rack"): up from a lower berth in 4.0 s and an upper in 5.5 s at the klaxon and a training sol\'s reveille (v0.0.4: 2.5 and 3.4), 4.8 and 6.6 s when nothing hurries (the weekend\'s reveille, the stand-down, going to bed), lying down the same; each phase at its share, moving continuously; the player\'s own rise and lying down at the tempo of the moment, the page\'s R lying you down in sight before the night\'s splash',
    timeoutMs: 120_000,
    fn() {
      // (every length beside v0.0.4's: 1.5 to 1.7 times, the user's "slightly slower"; UNHURRIED_K more when nothing hurries)
      const V004 = { rise: [2_500, 3_400], down: [2_500, 3_400], stand: [1_200, 1_200], sit: [1_200, 1_200] };
      const table = [];
      for (const kind of ['rise', 'down', 'stand', 'sit']) for (const up of kind === 'rise' || kind === 'down' ? [false, true] : [false]) {
        const was = V004[kind][up ? 1 : 0], fast = transMs(kind, up, true), slow = transMs(kind, up, false);
        table.push({ kind: `${kind}${up ? ' (upper)' : ''}`, was, fast, slow, k: fast / was });
      }
      for (const r of table) console.log(`      ${r.kind.padEnd(13)} v0.0.4 ${fmt(r.was / 1000, 1)} s; now ${fmt(r.fast / 1000, 2)} s at the alarm's tempo (× ${fmt(r.k, 2)}), ${fmt(r.slow / 1000, 2)} s when nothing hurries`);
      console.log(`      the step onto a spot ${transMs('step')} ms either way; the call delays: the klaxon ${CALL_DELAY_MS.alert.map(v => v / 1000).join(' to ')} s (v0.0.4 2 to 20), reveille ${CALL_DELAY_MS.reveille.map(v => v / 1000).join(' to ')} s, the stand-down ${CALL_DELAY_MS['stand-down'].map(v => v / 1000).join(' to ')} s`);
      assert(transMs('rise') === 4_000 && transMs('rise', true) === 5_500 && transMs('down') === 4_000 && transMs('down', true) === 5_500, JSON.stringify(table));
      assert(transMs('rise', false, false) === 4_800 && transMs('rise', true, false) === 6_600 && transMs('down', false, false) === 4_800 && transMs('down', true, false) === 6_600, JSON.stringify(table));
      assert(table.filter(r => /rise|down/.test(r.kind)).every(r => r.k >= 1.5 && r.k <= 1.7) && UNHURRIED_K > 1 && UNHURRIED_K <= 1.25, 'slightly slower: 1.5 to 1.7 times v0.0.4\'s');
      // (the squad's at each call, by its tempo: at the klaxon and the stand-down, at a training sol's reveille and the weekend's)
      const lengths = (s, ms, kind) => mates(s).filter(a => a.who !== fireWatchOf(s)).map(a => {
        const w = whereIs(s, a.who, ms), upper = (s.people[a.who].berthId?.endsWith('#3'));
        return { who: s.people[a.who].name.family, upper, kind: w.trans?.kind ?? null, ms: w.trans?.ms ?? null, ok: w.trans?.kind === kind };
      });
      const g = createGame({ scenario: 'test-night', seed: SEED });
      const s = g.state;
      g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] });
      const d = s.time.drills.open;
      const atKlaxon = lengths(s, d.atMs, 'rise'), atStandDown = lengths(s, d.endMs, 'down');
      const mon = createGame({ scenario: 'barracks', seed: SEED, hour: 5 + 29 / 60 }), sat = createGame({ scenario: 'barracks', seed: SEED, hour: 6.9, startMs: START_MS + 5 * SOL_MS });
      const R1 = mon.state.time.pod.reveilleMs, R2 = sat.state.time.pod.reveilleMs;
      const atReveille = lengths(mon.state, R1, 'rise'), atWeekend = lengths(sat.state, R2, 'rise');
      const say = (rows) => [...new Set(rows.map(r => `${r.kind} ${fmt(r.ms / 1000, 1)} s ${r.upper ? '(upper)' : '(lower)'}`))].join(', ');
      console.log(`      the klaxon ${hm(d.atMs)}: ${say(atKlaxon)}; the stand-down ${hm(d.endMs)}: ${say(atStandDown)}; reveille ${hm(R1)} on a training sol: ${say(atReveille)}; reveille ${hm(R2)} at the weekend: ${say(atWeekend)}`);
      const want = (rows, hurried) => rows.every(r => r.ok && r.ms === transMs(r.kind, r.upper, hurried));
      assert(want(atKlaxon, true) && want(atStandDown, false) && want(atReveille, true) && want(atWeekend, false) && marsClock(R2, LON).hour === 7, JSON.stringify({ atKlaxon, atStandDown, atReveille, atWeekend, R2: hm(R2) }));
      // (each phase at its share of the rise: sitting up, on the rack's edge, the climb down an upper berth, standing up; from a lower
      // berth, up off the edge and the steps out to the foot at a walk, never v0.0.4's slide of 1.55 m in the half-risen frame; continuous)
      const phases = (who) => {
        const w = whereIs(s, who, d.atMs), t = w.trans, spans = {};
        let prev = null, maxStep = 0, walkM = 0, glideMs = 0;
        for (let ms = t.fromMs; ms <= t.fromMs + t.ms; ms += 5) {
          const p = poseAt(w, ms);
          spans[p.frame] = (spans[p.frame] ?? 0) + 5;
          if (prev) maxStep = Math.max(maxStep, Math.hypot(p.x - prev.x, p.z - prev.z) + Math.abs(p.y - prev.y));
          if (prev && p.frame === 'walk') walkM = Math.max(walkM, p.walkM);
          if (prev && p.frame !== 'walk' && Math.hypot(p.x - prev.x, p.z - prev.z) > 0) glideMs += 5;
          prev = p;
        }
        return { ms: t.ms, spans, maxStep, walkM, walkMs: spans.walk ?? 0, glideMs, upper: (w.trans.from.y ?? 0) >= UPPER_Y_M };
      };
      const lower = phases(mates(s).find(a => a.who !== fireWatchOf(s) && !s.people[a.who].berthId.endsWith('#3')).who);
      const upper = phases(mates(s).find(a => a.who !== fireWatchOf(s) && s.people[a.who].berthId.endsWith('#3')).who);
      const words = (p) => Object.entries(p.spans).filter(([f]) => !['lie', 'stand', 'dress'].includes(f)).map(([f, v]) => `${f} ${fmt(v / 1000, 2)} s`).join(', ');
      console.log(`      a lower berth's rise of ${fmt(lower.ms / 1000, 1)} s: ${words(lower)}, the steps out ${fmt(lower.walkM, 2)} m at ${fmt(lower.walkM / (lower.walkMs / 1000), 2)} m/s on the walk's frames (v0.0.4 slid them in the half-risen frame in 0.5 s, 3.1 m/s), the most moved in 5 ms ${fmt(lower.maxStep, 3)} m; an upper's of ${fmt(upper.ms / 1000, 1)} s: ${words(upper)} (${fmt(upper.maxStep, 3)} m); the shares ${JSON.stringify(LOWER_KEYS)} and ${JSON.stringify(RISE_KEYS)}`);
      const share = (p, f) => (p.spans[f] ?? 0) / p.ms;
      assert(Math.abs(share(lower, 'sitUp') - LOWER_KEYS.sitUp) < 0.01 && Math.abs(share(lower, 'sit') - (LOWER_KEYS.sit - LOWER_KEYS.sitUp)) < 0.01 && Math.abs(share(lower, 'standUp') - (LOWER_KEYS.stand - LOWER_KEYS.sit)) < 0.01 && Math.abs(share(lower, 'walk') - (1 - LOWER_KEYS.stand)) < 0.01, JSON.stringify(lower));
      assert(lower.walkM > 1 && lower.walkM / (lower.walkMs / 1000) <= 1.2, `the steps out: ${lower.walkM} m in ${lower.walkMs} ms`);
      assert(Math.abs(share(upper, 'sitUp') - RISE_KEYS.sitUp) < 0.01 && Math.abs(share(upper, 'sit') - (RISE_KEYS.sit - RISE_KEYS.sitUp)) < 0.01 && Math.abs(share(upper, 'climb') - (RISE_KEYS.climb - RISE_KEYS.sit)) < 0.01, JSON.stringify(upper));
      assert(lower.maxStep < 0.05 && upper.maxStep < 0.05, `a jump in a rise: ${lower.maxStep}, ${upper.maxStep}`);
      // (the player's own: at 21:55 R lies you down in sight, going to bed, then the night; at the klaxon R gets you up at the alarm's tempo)
      const p = createGame({ scenario: 'test-night', seed: SEED }), ps = p.state, me = p.me(), t0 = ps.clock.ms;
      p.step(1, { act: [{ act: 'hand', args: { want: 'activity', lead: true } }] });
      const down = { ...me.trans }, frames = [];
      for (let ms = down.fromMs; ms <= down.fromMs + down.ms; ms += 10) { const f = figureOf(ps, me, ms).frame; if (frames.at(-1) !== f) frames.push(f); }
      let ticks = 0;
      while (!p.facts('skip-start').length && ticks < 400) { p.step(1); ticks++; }
      const night = p.facts('skip-start')[0], landed = p.facts('skip-end')[0];
      p.step(1, { act: [{ act: 'hand', args: { want: 'rise' } }] });
      const up = { ...me.trans };
      // (a nap by day: down and up when nothing hurries)
      const n = createGame({ scenario: 'barracks', seed: SEED, hour: 14, at: { area: 'melas.echo.1', x: 52.075, z: 3.3, face: 'up' } }), nme = n.me();
      n.step(1, { act: [{ act: 'hand', args: { want: 'activity', lead: true } }] });
      const napDown = { ...nme.trans };
      for (let i = 0; i < 400 && !n.facts('skip-end').length; i++) n.step(1);
      n.step(2);
      n.step(1, { act: [{ act: 'hand', args: { want: 'rise' } }] });
      const napUp = { ...nme.trans }, nap = n.facts('skip-end')[0];
      console.log(`      you, R at 21:55: a ${down.kind} of ${fmt(down.ms / 1000, 1)} s in sight (${frames.join(' → ')}), the night's splash begun ${ticks + 1} ticks after the key, ${fmt((night.fromMs - t0) / 1000, 2)} s on, landing at ${landed.toMs}; at the klaxon R: a ${up.kind} of ${fmt(up.ms / 1000, 1)} s`);
      console.log(`      a nap at 14:00: a ${napDown.kind} of ${fmt(napDown.ms / 1000, 1)} s, the ${nap?.activity} of ${nap?.minutes} min, then up: a ${napUp.kind} of ${fmt(napUp.ms / 1000, 1)} s`);
      assert(down.kind === 'down' && down.ms === 4_800 && frames.join() === 'stand,walk,standUp,sit,lieDown,lie' && night.fromMs - t0 === 4_800 && landed.toMs === 23_532_601_000, JSON.stringify({ down, frames, from: night.fromMs - t0, to: landed.toMs }));
      assert(up.kind === 'rise' && up.ms === RISE_MS && napDown.ms === 4_800 && nap?.activity === 'nap' && napUp.kind === 'rise' && napUp.ms === 4_800, JSON.stringify({ up, napDown, napUp, nap: nap?.activity }));
      assert(RISE_UPPER_MS === 5_500, 'the upper berth\'s rise');
    },
  },
  {
    name: 'lying down in sight before the night (the page\'s R at the rack\'s foot): a save made half-way down loads and carries on byte for byte to the klaxon; the klaxon sounding while you lie down leaves you awake in the berth, the sleep not begun, the alarm\'s line saying up',
    timeoutMs: 120_000,
    fn() {
      const R = { act: [{ act: 'hand', args: { want: 'activity', lead: true } }] };
      // (straight through, saving 2.4 s into the lying down)
      const a = createGame({ scenario: 'test-night', seed: SEED });
      a.step(1, R);
      a.step(48);
      const mid = a.save(), lead = { ...a.state.time.lead }, frame = figureOf(a.state, a.me(), a.state.clock.ms).frame;
      a.step(120);
      const b = createGame({ scenario: 'test-night', seed: SEED });
      b.load(mid);
      b.step(120);
      const same = a.digest() === b.digest(), landed = [a.state.clock.ms, b.state.clock.ms];
      console.log(`      saved 2.4 s into the lying down (the frame ${frame}; time.lead ${JSON.stringify(lead)}), ${(mid.length / 1024).toFixed(0)} KB; both 120 ticks on at ${landed.join(' and ')}: ${same ? 'byte for byte' : 'DIFFERENT'}`);
      assert(same && landed[0] === 23_532_601_000 + 72 * TICK_MS && !a.state.time.lead, JSON.stringify({ same, landed }));
      // (the klaxon two seconds into the lying down: the sleep is late in a drill, so it is not begun)
      const c = createGame({ scenario: 'test-night', seed: SEED }), cs = c.state;
      cs.time.drills.forced = cs.clock.ms + 2_000;
      postNight(cs, cs.clock.ms);
      c.step(1, R);
      c.step(120);                                                       // (down at +4.8 s; the line's T comes with its next look, 0.55 s on)
      const me = c.me(), line = instinctNow(cs).line;
      console.log(`      the klaxon at +2 s of the lying down: a drill open ${!!cs.time.drills.open}, the sleep begun ${g0(c)}, lying ${me.posture}, the lead ${cs.time.lead ? 'kept' : 'dropped'}; the line "${line?.text}" (${line?.tone}, T ${line?.act})`);
      assert(cs.time.drills.open && !g0(c) && me.posture === 'lie' && !cs.time.lead && !cs.time.doing && line?.id === 'alarm' && line?.act === 'rise', JSON.stringify({ posture: me.posture, lead: cs.time.lead, line }));
    },
  },
  {
    name: 'R\'s lying down can be taken back (the review of v0.0.5\'s rack: once R started it, a move key did nothing): the DI says "Into the rack." while it plays; a move key half-way down gets you up again from the frame shown, the same frames backwards with no jump, standing where you stood, no sleep begun',
    timeoutMs: 120_000,
    fn() {
      const R = { act: [{ act: 'hand', args: { want: 'activity', lead: true } }] };
      const g = createGame({ scenario: 'test-night', seed: SEED }), s = g.state;
      g.step(2);
      const at = { x: g.me().x, z: g.me().z, face: g.me().face };
      g.step(1, R);
      g.step(30);                                                          // (1.5 s down: walking in to the edge)
      const line = instinctNow(s).line;
      const ms = s.clock.ms, before = poseAt(g.me(), ms);
      g.step(1, { mx: 1 });
      const back = g.me().trans, after = poseAt(g.me(), ms);
      // (the frames from the move key on: each a small step from the last, no jump)
      let maxStep = 0, last = poseAt(g.me(), s.clock.ms), frames = new Set();
      for (let i = 0; i < 160 && g.me().trans && s.clock.ms < back.fromMs + back.ms; i++) {
        g.step(1);
        const p = poseAt(g.me(), s.clock.ms);
        maxStep = Math.max(maxStep, Math.hypot(p.x - last.x, p.z - last.z)); frames.add(p.frame); last = p;
      }
      g.step(20);
      const me = g.me();
      console.log(`      the line while lying down: "${line?.text}" (${line?.id}, ${line?.tone}); at the move key 1.5 s in, the frame ${before.frame} at (${before.x}, ${before.z}), taken back as a ${back?.kind} of ${back?.ms} ms showing ${after.frame} at (${after.x}, ${after.z}); its frames ${[...frames].join(', ')}, the largest step between two ticks ${fmt(maxStep, 3)} m; then ${me.posture ?? 'stand'} at (${me.x}, ${me.z}) facing ${me.face} (stood at (${at.x}, ${at.z}) facing ${at.face}); the lead ${s.time.lead ? 'kept' : 'dropped'}, a sleep begun ${g0(g)}`);
      assert(line?.id === 'lead' && /rack/i.test(line.text), JSON.stringify(line));
      assert(back?.kind === 'rise' && before.frame === after.frame && Math.hypot(before.x - after.x, before.z - after.z) < 1e-3, JSON.stringify({ before, after }));
      assert(maxStep < 0.15 && (me.posture ?? 'stand') === 'stand' && me.x === at.x && me.z === at.z && !s.time.lead && !s.time.doing && !g0(g), JSON.stringify({ maxStep, me: { x: me.x, z: me.z, posture: me.posture }, lead: s.time.lead }));
    },
  },
];
// (whether a sleep has begun in a game)
const g0 = (g) => g.facts('skip-start').some(f => f.activity === 'sleep');
