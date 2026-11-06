// OLYMPUS tests: the eyes' adaptation to the light (src/sim/body/eyes.js; BODY §2's one body and its skip
// contract; the user's ask of 2026-11-06, scoring v0.0.4's test-night: "Would be nice to have eye adapting
// to darkness making things less dark after a while in the dark compared to when entering dark from a lit
// place"). The curve out of the lit head into the bay at lights out, printed minute by minute (the
// cones' plateau, the rod-cone break, the rods at full sensitivity, the log units in all) with the
// picture's gain and perception's light factor; back into the light in seconds with a short glare; a
// red lamp sparing the rods; the closed form's exact composition; lived against skipped in the game (R's
// wait across taps quick, the night to the klaxon heavy), a sleeper waking fully dark-adapted; the
// upgrade of v0.0.3 and v0.0.4 saves; the light's S/P as places compute it; the night-vision flag.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, fmt, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import {
  eyesAt, eyeView, viewOf, anchored, restingIn, fieldFrom, logCdOf, adaptedLog, eyesAdaptedTo, eyesStep,
  CONE_FLOOR_LOG, ROD_FLOOR_LOG, REF_LOG, LID_P, LID_S, PICTURE_GAMMA, BRIGHTNESS_EXP,
} from '../src/sim/body/eyes.js';
import { eyeOf, fieldOf, eyeViewOf, SIGHT_M, LIGHT_M } from '../src/sim/people/perception.js';
import { lightLevel, lightFrame, spectrumAt, lightKeyOf } from '../src/sim/places/light.js';
import { MOODS, LAMP_KINDS, SKY_SP } from '../src/data/places/sky.js';
import { areaOf } from '../src/sim/places/model.js';
import { stepEyes } from '../src/sim/body/domain.js';
import { playerActor } from '../src/core/ids.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { stream, range } from '../src/core/rng.js';
import { stepsBudget } from '../src/sim/time/skip.js';

const SEED = 48213, AREA = 'melas.echo.1', LON = SITES.melas.lonEDeg, MIN = 60_000;
const hm = (ms) => { const c = marsClock(ms, LON); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / 60_000)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`; };
const Y = (L) => 10 ** logCdOf(L);
/** The two fields of the reference step: the lit head (its warm overheads, sp 1.25) and the bay at lights out (sp 1.0). */
const HEAD = fieldFrom(Y(MOODS.evening.fill), Y(MOODS.evening.fill) * MOODS.evening.sp), BAY = fieldFrom(Y(MOODS.lightsOut.fill), Y(MOODS.lightsOut.fill) * MOODS.lightsOut.sp);
const reachIn = (v, L = MOODS.lightsOut.fill) => SIGHT_M * Math.min(1, v.lightK) + LIGHT_M * Math.min(1, L * v.lightK);
const rodsLead = (st, f) => Math.max(st.rn, st.rb) - (f.ys - f.yp) < st.c;
// (a record from the head's rest anchored into the bay at 0)
const stepIn = () => anchored(restingIn(HEAD), 0, BAY);
// (the first minute, by tenths, at which pred holds over the record)
const firstMin = (rec, pred, maxMin = 90) => { for (let m = 0; m <= maxMin; m = Math.round((m + 0.1) * 10) / 10) if (pred(eyesAt(rec, m * MIN), m)) return m; return null; };

function runActivity(setup, force) {
  const g = setup(), s = g.state, a = s.$act;
  g.step(1, { act: [{ act: 'activity', args: { ...a, force } }] });
  for (let n = 0; s.skip && n < 2_000_000; n++) g.step(1);
  return g;
}
const SAVES = Object.freeze(['v0.0.3-barracks-2130', 'v0.0.3-barracks-midwait']);
const readSave = (name) => gunzipSync(readFileSync(path.join(root, 'tests', 'saves', `${name}.json.gz`))).toString('utf8');

export default [
  {
    name: 'out of the lit head into the bay at lights out (the user, 2026-11-06: "eye adapting to darkness making things less dark after a while in the dark compared to when entering dark from a lit place"): the cones\' plateau by 7 minutes, the rod-cone break at 7 to 10, the rods at full sensitivity at 30 to 40, 3 to 4 log units in all; the picture v0.0.4\'s at five minutes, clearly darker just in, clearly lighter adapted',
    fn() {
      const rec = stepIn();
      console.log(`      the head at the evening's ${MOODS.evening.fill} (sp ${MOODS.evening.sp}): ${fmt(10 ** HEAD.yp, 1)} cd/m² (${fmt(HEAD.yp, 2)}); the bay at lights out ${MOODS.lightsOut.fill} (sp ${MOODS.lightsOut.sp}): ${fmt(10 ** BAY.yp, 4)} cd/m² (${fmt(BAY.yp, 2)}); the floors: cones ${CONE_FLOOR_LOG}, rods ${ROD_FLOOR_LOG}; REF_LOG ${REF_LOG}`);
      console.log('      min    cones  rods(n)  rods(b)  adapted  gain   lightK  rods\' share  reach in the bay');
      for (const m of [0, 0.5, 1, 2, 3, 5, 7, 8.5, 10, 15, 20, 25, 30, 35, 40, 60]) {
        const st = eyesAt(rec, m * MIN), v = eyeView(rec, m * MIN);
        console.log(`      ${String(m).padStart(4)}  ${fmt(st.c, 3).padStart(7)}  ${fmt(st.rn, 3).padStart(7)}  ${fmt(st.rb, 3).padStart(7)}  ${fmt(v.a, 3).padStart(7)}  ${fmt(v.gain, 3)}  ${fmt(v.lightK, 3).padStart(6)}  ${fmt(v.rod, 2).padStart(11)}  ${fmt(reachIn(v), 1).padStart(6)} m`);
      }
      const plateau = firstMin(rec, (st) => st.c - CONE_FLOOR_LOG <= 0.06), brk = firstMin(rec, (st) => rodsLead(st, BAY));
      const full = firstMin(rec, (st) => adaptedLog(st, BAY) <= BAY.yp + 0.01), depth = eyeView(rec, 0).a - eyeView(rec, 60 * MIN).a;
      const g0 = eyeView(rec, 0).gain, g5 = eyeView(rec, 5 * MIN).gain, g40 = eyeView(rec, 40 * MIN).gain;
      console.log(`      the cones' plateau (within 0.06 log units) at ${plateau} min, the rod-cone break at ${brk} min, the bay's own level (within 0.01) at ${full} min, ${fmt(depth, 2)} log units in all; the picture ${fmt(g0, 2)}× v0.0.4's just in, ${fmt(g5, 3)}× at five minutes, ${fmt(g40, 2)}× at forty`);
      assert(plateau >= 5 && plateau <= 8 && brk >= 7 && brk <= 10 && full >= 30 && full <= 40 && depth >= 3 && depth <= 4, JSON.stringify({ plateau, brk, full, depth }));
      assert(Math.abs(g5 - 1) <= 0.01 && g0 <= 0.55 && g40 >= 2.2, JSON.stringify({ g0, g5, g40 }));
      // (the picture's law and perception's agree: gain = lightK^0.6, one quantity)
      for (const m of [0, 1, 5, 20, 40]) { const v = eyeView(rec, m * MIN); assert(Math.abs(v.gain - v.lightK ** PICTURE_GAMMA) <= 0.002, `gain ${v.gain} against lightK ${v.lightK}^${PICTURE_GAMMA} at ${m} min`); }
    },
  },
  {
    name: 'back into the light in seconds: the overheads on over a dark-adapted eye bloom the picture (over twice v0.0.4\'s at half a second) and settle in 3 to 5 seconds; perception reads the lit room at rest throughout, never a blind second',
    fn() {
      const DAY = fieldFrom(Y(MOODS.day.fill), Y(MOODS.day.fill) * MOODS.day.sp);
      const rec = anchored(restingIn(BAY), 0, DAY), rows = [];
      for (const s of [0, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 8]) { const v = eyeView(rec, s * 1000); rows.push({ s, ...v }); }
      console.log(`      the lights on over an eye at rest in the bay's dark: ${rows.map(r => `${r.s} s ${fmt(r.gain, 2)}× (glare ${fmt(r.glare, 2)}, lightK ${fmt(r.lightK, 2)})`).join('; ')}`);
      const at = (s) => rows.find(r => r.s === s);
      assert(at(0.5).gain >= 2 && at(3).gain <= 1.15 && at(5).gain <= 1.03 && at(8).gain <= 1.005, JSON.stringify(rows.map(r => [r.s, r.gain])));
      assert(rows.every(r => r.lightK === 1), `perception in the glare: ${rows.map(r => r.lightK).join(', ')}`);
    },
  },
  {
    name: 'a red lamp spares the rods: ten minutes in the fire watch\'s red light (sp 0.04) leave the rods 1.4 log units or more darker-adapted than a white lamp as bright (sp 1.5), and the eye back at the bay\'s level sooner; the fire watch at rest at the post keeps rods 0.8 log units or more darker-adapted than were the lamp white',
    fn() {
      const L = LAMP_KINDS.red.core + MOODS.lightsOut.fill, rows = {};
      for (const [name, sp] of [['red', LAMP_KINDS.red.sp], ['white', MOODS.day.sp]]) {
        const lamp = fieldFrom(Y(L), Y(L) * sp), st = eyesAt(anchored(restingIn(BAY), 0, lamp), 10 * MIN);
        const back = anchored(st, 0, BAY), min = firstMin(back, (s) => adaptedLog(s, BAY) <= BAY.yp + 0.02);
        rows[name] = { rods: Math.max(st.rn, st.rb), cones: st.c, backMin: min };
      }
      console.log(`      ten minutes at a lamp's core of ${L} (${fmt(Y(L), 2)} cd/m²): the red's rods at ${fmt(rows.red.rods, 2)}, back to the bay in ${rows.red.backMin} min; a white lamp's at ${fmt(rows.white.rods, 2)}, back in ${rows.white.backMin} min; the red spares ${fmt(rows.white.rods - rows.red.rods, 2)} log units of the rods' adaptation`);
      assert(rows.white.rods - rows.red.rods >= 1.4 && rows.red.backMin < rows.white.backMin, JSON.stringify(rows));
      // (in the game: the fire watch's eyes at rest at the post, the red lamp in their field, against the same field white)
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 23 }), s = g.state;
      const fw = s.actors.list.find(a => a.posture === 'sit' && a.spotId?.includes('stool'));
      assert(fw, 'no fire watch at the post at 23:00');
      const eye = eyeOf(s, fw), f = fieldOf(s, eye, s.clock.ms), v = eyesAdaptedTo(f), whiteF = { yp: f.yp, ys: f.yp + Math.log10(MOODS.day.sp) };
      console.log(`      the fire watch at (${fw.x}, ${fw.z}): their field ${fmt(10 ** f.yp, 2)} cd/m², its sp ${fmt(10 ** (f.ys - f.yp), 3)}; their rods at rest ${fmt(Math.max(restingIn(f).rn, restingIn(f).rb), 2)} against ${fmt(restingIn(whiteF).rb, 2)} were the lamp white; their reach into the bay's dark ${fmt(reachIn(v), 1)} m (lightK ${fmt(v.lightK, 2)})`);
      // (their field mixes the red pool with the bay's own fill, sp 1.0, so less is spared than at the lamp's core)
      assert(restingIn(whiteF).rb - restingIn(f).rb >= 0.8, 'the post\'s red field spares the fire watch\'s rods');
    },
  },
  {
    name: 'the closed form composes: the curve advanced in one go equals the same cut at 1,000 random instants (falling, the stop at the field\'s level, and rising alike), to 1e-9 log units',
    fn() {
      const r = stream('test', SEED, 'eyes-compose');
      let worst = 0;
      for (const [name, from, to, spanMin] of [['into the dark', HEAD, BAY, 60], ['into the light', BAY, HEAD, 0.5], ['a lamp\'s pool', BAY, fieldFrom(Y(0.29), Y(0.29) * 0.04), 20]]) {
        const rec = anchored(restingIn(from), 0, to), T = spanMin * MIN;
        const cuts = Array.from({ length: 1000 }, () => Math.floor(range(r, 1, T - 1))).sort((a, b) => a - b);
        let st = { ...restingIn(from) }, at = 0;
        for (const t of cuts) { st = eyesAt({ atMs: at, ...st, yp: to.yp, ys: to.ys }, t); at = t; }
        st = eyesAt({ atMs: at, ...st, yp: to.yp, ys: to.ys }, T);
        const one = eyesAt(rec, T), d = Math.max(Math.abs(one.c - st.c), Math.abs(one.rn - st.rn), Math.abs(one.rb - st.rb));
        worst = Math.max(worst, d);
        console.log(`      ${name} over ${spanMin} min: in one go c ${fmt(one.c, 6)} rn ${fmt(one.rn, 6)} rb ${fmt(one.rb, 6)}; cut 1,000 times, ${d.toExponential(2)} apart`);
      }
      assert(worst <= 1e-9, `the cut advance parts by ${worst}`);
    },
  },
  {
    name: 'lived against skipped: R\'s fifteen-minute wait at the rack\'s foot across taps, fast-forwarded tick by tick against skipped by the minute, ends with the same eyes, anchored at taps to the millisecond',
    timeoutMs: 180_000,
    fn() {
      const setup = () => { const g = createGame({ scenario: 'barracks', seed: SEED, hour: 21 + 52 / 60, at: { area: AREA, x: 52.075, z: 3.3, face: 'right' } }); g.step(2); g.state.$act = { id: 'wait' }; return g; };
      const ff = runActivity(setup, 'ff'), out = runActivity(setup, 'outcome');
      // (a fast-forward stopped by an event lives the rest of its tick: both brought to one clock)
      while (out.state.clock.ms < ff.state.clock.ms) out.step(1);
      while (ff.state.clock.ms < out.state.clock.ms) ff.step(1);
      const a = ff.state.people[ff.state.player.id].body.eyes, b = out.state.people[out.state.player.id].body.eyes;
      const taps = ff.state.time.pod?.tapsMs ?? null;
      console.log(`      ${hm(a.atMs)} anchor (key ${a.key}); fast-forward ${JSON.stringify(a)}; skipped ${JSON.stringify(b)}; clocks ${hm(ff.state.clock.ms)} and ${hm(out.state.clock.ms)}`);
      console.log(`      the eye at the end: ${JSON.stringify(eyeView(a, ff.state.clock.ms))}`);
      assert(JSON.stringify(a) === JSON.stringify(b), 'the lived and the skipped eyes differ');
      assert(a.key.startsWith('lightsOut') && lightKeyOf('melas', a.atMs) !== lightKeyOf('melas', a.atMs - 1), `anchored at taps to the millisecond: ${a.atMs} (${hm(a.atMs)}), taps ${taps}`);
    },
  },
  {
    name: 'lived against skipped: test-night\'s night to the klaxon, fast-forwarded tick by tick against skipped by the minute: the lids closing at sleep, taps and the klaxon\'s wake at the same instants, the same eyes',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const setup = () => { const g = createGame({ scenario: 'test-night', seed: SEED }); g.state.$act = { id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { until: 'reveille' } }; return g; };
      const t0 = performance.now(), ff = runActivity(setup, 'ff'), t1 = performance.now(), out = runActivity(setup, 'outcome'), t2 = performance.now();
      while (out.state.clock.ms < ff.state.clock.ms) out.step(1);
      while (ff.state.clock.ms < out.state.clock.ms) ff.step(1);
      const a = ff.state.people[ff.state.player.id].body.eyes, b = out.state.people[out.state.player.id].body.eyes;
      console.log(`      landed ${hm(ff.state.clock.ms)}; fast-forward ${fmt(t1 - t0, 0)} ms, skipped ${fmt(t2 - t1, 0)} ms; the eyes ${JSON.stringify(a)}`);
      assert(JSON.stringify(a) === JSON.stringify(b), `lived ${JSON.stringify(a)} against skipped ${JSON.stringify(b)}`);
    },
  },
  {
    name: 'a sleeper in the dark bay wakes fully dark-adapted: test-night\'s sleep to the klaxon, the lids dimming the lit bay before taps and its dark after, lands with the rods at their floor; the eyes open on the bay at 2.5 times v0.0.4\'s picture',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-night', seed: SEED }), s = g.state, pid = s.player.id;
      g.step(1, { act: [{ act: 'activity', args: { id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { until: 'reveille' }, force: 'outcome' } }] });
      for (let n = 0; s.skip && n < 1_000_000; n++) g.step(1);
      const shut = s.people[pid].body.eyes, landed = s.clock.ms;
      g.step(2);
      const open = s.people[pid].body.eyes, v = eyeViewOf(s, playerActor(s));
      console.log(`      the lids: photopic ${LID_P}, scotopic ${LID_S}; asleep, the last anchor ${hm(shut.atMs)} (field ${fmt(shut.yp, 2)}, shut ${shut.shut ?? 0}); at the landing ${hm(landed)}: rods ${fmt(Math.max(eyesAt(shut, landed).rn, eyesAt(shut, landed).rb), 3)}`);
      console.log(`      awake, anchored ${hm(open.atMs)} on the bay (${fmt(open.yp, 2)}): adapted ${fmt(v.a, 3)}, the picture ${fmt(v.gain, 2)}× v0.0.4's, lightK ${fmt(v.lightK, 2)}, rods' share ${fmt(v.rod, 2)}`);
      assert(shut.shut === 1 && Math.max(eyesAt(shut, landed).rn, eyesAt(shut, landed).rb) <= ROD_FLOOR_LOG + 0.01, JSON.stringify(eyesAt(shut, landed)));
      assert(!open.shut && v.gain >= 2.3 && v.rod >= 0.8, JSON.stringify(v));
    },
  },
  {
    name: 'v0.0.3 saves and a v0.0.4 save (no eyes) load with the player\'s eyes adapted to the light they stand in: none written on load (a load moves no save), the first tick anchors them at rest at the save\'s clock, and a save made after carries on byte for byte',
    timeoutMs: 120_000,
    fn() {
      const fresh = createGame({ scenario: 'barracks', seed: SEED, hour: 22.5 });
      fresh.step(20);
      const v4 = JSON.parse(fresh.save());
      delete v4.people[v4.player.id].body.eyes;
      v4.meta.version = '0.0.4';
      for (const [name, json] of [...SAVES.map(n => [n, readSave(n)]), ['a v0.0.4 save at 22:30', JSON.stringify(v4)]]) {
        const g = createGame({ scenario: 'barracks', seed: SEED, version: '0.0.5' }), s = g.load(json), pid = s.player.id, loadedMs = s.clock.ms;
        const me = playerActor(s), f = fieldOf(s, eyeOf(s, me), loadedMs), rest = restingIn(f), before = s.people[pid].body.eyes ?? null, view = eyeViewOf(s, me), skipping = !!s.skip;
        g.step(1);
        const e = s.people[pid].body.eyes;
        console.log(`      ${name}: loaded at ${hm(loadedMs)}${skipping ? ' inside a skip' : ''} with ${before ? 'eyes' : 'no eyes'} (the picture ${fmt(view.gain, 3)}×, lightK ${fmt(view.lightK, 3)}: at rest); the first ${skipping ? 'step anchors them at its end' : 'tick anchors them'} ${hm(e.atMs)}: ${JSON.stringify(e)}; the field there ${fmt(f.yp, 3)}`);
        // (a lived tick anchors them at the save's clock; a skip's first step, at its end, at rest in the same light)
        const atOk = skipping ? e.atMs > loadedMs && e.atMs <= s.clock.ms : e.atMs === loadedMs;
        assert(!before && view.gain === eyesAdaptedTo(f).gain && e && atOk && e.yp === f.yp && e.c === rest.c && e.rb === rest.rb, JSON.stringify({ e, f, view }));
        g.step(600);
        const mid = g.save();
        g.step(600, { mx: 1 });
        const end = g.save(), h = createGame({ scenario: 'barracks', seed: SEED, version: '0.0.5' });
        h.load(mid); h.step(600, { mx: 1 });
        assert(h.save() === end && !g.errors.length, `${name}: a save after the load does not carry on byte for byte`);
      }
    },
  },
  {
    name: 'the light\'s colour as the eyes take it: places\' spectrumAt gives lightLevel\'s own level at 2,000 points of Echo\'s floor and the street, day and night, and an S/P weighted by each source\'s share; every lamp that makes a pool and every mood names its S/P',
    fn() {
      const r = stream('test', SEED, 'eyes-spectrum'), g = createGame({ scenario: 'barracks', seed: SEED, hour: 23 }), s = g.state;
      let worst = 0, n = 0;
      const sps = new Set();
      for (const area of [AREA, 'melas.ground']) for (const hour of [3, 12, 23]) {
        const ms = s.clock.ms + Math.round((hour - 23 + 24) % 24 * 3_600_000 * 1.0275), a = areaOf(area), b = a.boundsM, F = lightFrame(s, area, ms);
        for (let i = 0; i < 333; i++) {
          const x = range(r, b.x0, b.x1), z = range(r, b.z0, b.z1), sp = spectrumAt(F, x, z);
          worst = Math.max(worst, Math.abs(sp.level - lightLevel(s, x, z, ms, area))); n++; sps.add(sp.sp);
        }
      }
      const kinds = Object.entries(LAMP_KINDS).filter(([, k]) => k.r);
      console.log(`      ${n} points: the level ${worst} from lightLevel's at worst; ${sps.size} S/P values seen (${[...sps].sort((a, b) => a - b).slice(0, 8).join(', ')} …); the moods ${Object.entries(MOODS).map(([k, m]) => `${k} ${m.sp}`).join(', ')}; the pools ${kinds.map(([k, m]) => `${k} ${m.sp}`).join(', ')}; the open air ${SKY_SP}`);
      assert(worst === 0 && kinds.every(([, k]) => k.sp > 0) && Object.values(MOODS).every(m => m.sp > 0), 'a level or an S/P is missing');
    },
  },
  {
    name: 'night vision (not built: the flag the device will set): with nv the picture is the device\'s (gain 1, no rods\' grey) and perception v0.0.4\'s, the eyes keep adapting underneath to the light they receive, and the flag off shows the eye as it is',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 21 + 58 / 60, at: { area: AREA, x: 52.075, z: 3.3, face: 'right' } }), s = g.state, pid = s.player.id;
      g.step(2);
      s.people[pid].body.eyes.nv = true;
      g.step(20 * 60 * 12);                                           // (twelve minutes, through taps)
      const on = eyeViewOf(s, playerActor(s)), rec = s.people[pid].body.eyes;
      delete rec.nv;
      const off = eyeViewOf(s, playerActor(s));
      console.log(`      ${hm(s.clock.ms)}, the device on: gain ${on.gain}, rods' share ${on.rod}, lightK ${on.lightK}; the eyes underneath anchored ${hm(rec.atMs)} on ${fmt(rec.yp, 2)}; the device off: gain ${fmt(off.gain, 2)}, adapted ${fmt(off.a, 2)}`);
      // (ten minutes into the dark under the device: the eye underneath past its cones' plateau, the picture without it lighter than v0.0.4's)
      assert(on.nv && on.gain === 1 && on.rod === 0 && on.lightK === 1 && rec.key.startsWith('lightsOut') && off.a < CONE_FLOOR_LOG && off.gain > 1.1 && !off.nv, JSON.stringify({ on, off, rec }));
    },
  },
  {
    name: 'a day skip steps by the hour but at the minutes the open air changes (the review of v0.0.5\'s eyes: a field that read the sky cut every step to a minute, 1,440 a sol): on the street from 06:00 for twenty hours, through noon, the dusk and the night, and in bay-2-1 at lights out, the same eyes as a skip by the minute; by day the bay\'s windows never beat its fill, so its field does not read the sky',
    timeoutMs: 180_000,
    fn() {
      const run = (kind, hour, at, hours) => {
        const g = createGame({ scenario: 'barracks', seed: SEED, hour, at });
        g.step(2);
        g.beginSkip({ activity: 'wait', planMs: hours * 3_600_000, kind, mask: 'D' });
        let steps = 0;
        for (let n = 0; g.state.skip && n < 1e6; n++) steps += g.advance(Infinity, stepsBudget(1e9)).steps;
        return { steps, clock: g.state.clock.ms, eyes: JSON.stringify(g.state.people[g.state.player.id].body.eyes) };
      };
      const STREET = { area: 'melas.ground', x: 522, z: 224, face: 'up' }, RACK = { area: AREA, x: 52.075, z: 3.3, face: 'right' };
      const rows = [['the street, 06:00 + 20 h', 6, STREET, 20], ['bay-2-1 from 23:00 at lights out, to the night\'s first stop', 23, RACK, 24]].map(([what, hour, at, hours]) => ({ what, day: run('day', hour, at, hours), min: run('outcome', hour, at, hours) }));
      for (const r of rows) console.log(`      ${r.what}: a day skip in ${r.day.steps} steps, by the minute ${r.min.steps}; to ${hm(r.day.clock)}; the same eyes ${r.day.eyes === r.min.eyes}`);
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 12, at: RACK });
      g.step(2);
      const noon = g.state.people[g.state.player.id].body.eyes;
      console.log(`      bay-2-1 at noon: the eyes' record ${noon.sky === undefined ? 'does not read' : 'reads'} the sky (WINDOW_K 0.3 × the brightest sky against the day's fill ${MOODS.day.fill})`);
      assert(rows.every(r => r.day.eyes === r.min.eyes && r.day.clock === r.min.clock), JSON.stringify(rows.map(r => [r.what, r.day.eyes, r.min.eyes])));
      assert(rows[0].day.steps < 0.3 * rows[0].min.steps && rows[1].day.steps < 0.1 * rows[1].min.steps, JSON.stringify(rows.map(r => [r.day.steps, r.min.steps])));
      assert(noon.sky === undefined, JSON.stringify(noon));
    },
  },
];
