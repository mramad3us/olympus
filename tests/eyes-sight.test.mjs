// OLYMPUS tests: perception's reach read through the adapted eye (src/sim/people/perception.js, BODY's eyes:
// src/sim/body/eyes.js; the user's ask of 2026-11-06: "eye adapting to darkness making things less dark
// after a while in the dark compared to when entering dark from a lit place"). In the real Echo barracks
// at 23:00: twenty minutes in the lit Head A (debug skips, as the game's own outcome skips), then into
// bay-2-1 at rack n1's foot facing east along the aisle (debug:go), then debug skips to 1, 5, 10, 20 and
// 40 minutes; and test-night's sleeper woken by the klaxon. Prints, at each, the eye (adapted level,
// lightK, the dark's floor) and the reach in the bay's dark (lightLevel 0.04), measured: the farthest
// point east along the aisle the eye sees, and the share of the bay's cells sightMask (the fog's own
// function) has in sight. The reach rises with the minutes; at five minutes it is v0.0.4's (10 + 42 ×
// 0.04 = 11.7 m: the eyes' reference); just in from the light it is short, fully adapted long.
// Then the review of v0.0.5's eyes and rack: the eye on the tick a wake lands on, as the actors layer
// reads it (before bodyFast anchors the record again: never blind), and the eye through the player's
// own transitions (the pose shown, not its end: the fog never closes on the berth while you still stand
// at its foot, nor opens the standing view while you sit up in it; your own berth always in sight).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { eyeOf, eyeViewOf, visibility, sightMask, SIGHT_M, LIGHT_M, REACH_SOFT_M } from '../src/sim/people/perception.js';
import { peopleDomain } from '../src/sim/people/domain.js';
import { poseAt } from '../src/sim/people/place.js';
import { lightLevel } from '../src/sim/places/light.js';
import { areaOf } from '../src/sim/places/model.js';
import { playerActor } from '../src/core/ids.js';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';

const SEED = 48213, AREA = 'melas.echo.1', LON = SITES.melas.lonEDeg, MIN = 60_000;
const hm = (ms) => { const c = marsClock(ms, LON); return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`; };
const BAY = 'e1.bay-2-1', RACK_FOOT = { x: 52.075, z: 3.3 };
/** The reach in the bay's dark by the eye (PEOPLE §7.1 through the eyes: the dark's floor scaled under 1, the light × lightK). */
const reachOf = (eye, L) => eye.baseM + LIGHT_M * Math.min(1, L * eye.lightK);

// (a debug action, and the skip it starts run to its end)
function act(g, a) { g.step(1, { act: [a] }); for (let n = 0; g.state.skip && n < 200_000; n++) g.step(1); }
// (what the eye takes in: the farthest point east along the aisle seen, the bay's cells in sight)
// (the cells of bay-2-1 the player's eye has in sight now: the fog's own mask)
function seenCells(g) {
  const s = g.state, room = areaOf(AREA).rooms.find(r => r.id === BAY), [x0, z0, x1, z1] = room.rect, C = 0.25;
  const mask = sightMask(s, eyeOf(s, playerActor(s)), { x0, z0, nx: Math.round((x1 - x0) / C), nz: Math.round((z1 - z0) / C), cellM: C });
  return mask.vis.reduce((n, v) => n + (v >= 0.5 ? 1 : 0), 0);
}
function looks(g) {
  const s = g.state, me = playerActor(s), eye = eyeOf(s, me), ms = s.clock.ms, room = areaOf(AREA).rooms.find(r => r.id === BAY);
  let far = 0;
  for (let d = 0.25; me.x + d < room.rect[2] - 0.3; d += 0.25) if (visibility(s, eye, me.x + d, me.z, ms) >= 0.5) far = d;
  const [x0, z0, x1, z1] = room.rect, C = 0.25, nx = Math.round((x1 - x0) / C), nz = Math.round((z1 - z0) / C);
  const mask = sightMask(s, eye, { x0, z0, nx, nz, cellM: C });
  const seen = mask.vis.reduce((n, v) => n + (v >= 0.5 ? 1 : 0), 0);
  return { eye, v: eyeViewOf(s, me), far, seen: seen / (nx * nz), L: lightLevel(s, me.x + 6, me.z, ms, AREA) };
}

export default [
  {
    name: 'the reach in bay-2-1 at 23:00 by the eye (the user, 2026-11-06: "eye adapting to darkness making things less dark after a while in the dark compared to when entering dark from a lit place"): just in from twenty minutes in the lit head a few metres, longer each minute, v0.0.4\'s 11.7 m at five, 17 m and more at forty; the fog\'s mask follows',
    timeoutMs: 180_000,
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 22 + 38 / 60, at: { area: AREA, x: 60.8, z: 13.0, face: 'up' } });
      g.step(2);
      act(g, 'debug:skip:1200000');                                    // (twenty minutes in Head A's light)
      const lit = eyeViewOf(g.state, playerActor(g.state));
      act(g, `debug:go:${AREA}:${RACK_FOOT.x}:${RACK_FOOT.z}:right`);
      const rows = [];
      let at = 0;
      for (const m of [0, 1, 5, 10, 20, 40]) {
        if (m > at) { act(g, `debug:skip:${(m - at) * MIN}`); at = m; }
        const me = playerActor(g.state);
        assert(Math.abs(me.x - RACK_FOOT.x) < 0.01 && me.face === 'right', `the eye moved: ${JSON.stringify({ x: me.x, z: me.z, face: me.face })}`);
        const r = looks(g);
        rows.push({ m, t: hm(g.state.clock.ms), a: r.v.a, lightK: r.eye.lightK, baseM: r.eye.baseM, reach: reachOf(r.eye, 0.04), far: r.far, seen: r.seen, gain: r.v.gain, L: r.L });
      }
      console.log(`      in Head A at the evening's light after twenty minutes: adapted ${fmt(lit.a, 2)}, lightK ${fmt(lit.lightK, 2)}; then at rack n1's foot facing east (the aisle's light ${rows[0].L})`);
      for (const r of rows) console.log(`      ${String(r.m).padStart(2)} min (${r.t}): adapted ${fmt(r.a, 2).padStart(5)}, lightK ${fmt(r.lightK, 2)}, the dark's floor ${fmt(r.baseM, 1)} m; reach in the bay's dark ${fmt(r.reach, 1)} m; seen east along the aisle to ${fmt(r.far, 2)} m; ${fmt(r.seen * 100, 0)}% of the bay in sight; the picture ${fmt(r.gain, 2)}× v0.0.4's`);
      const at5 = rows.find(r => r.m === 5), at0 = rows[0], at40 = rows.at(-1);
      assert(rows.every((r, i) => i === 0 || (r.reach >= rows[i - 1].reach - 1e-9 && r.seen >= rows[i - 1].seen - 1e-9)), 'the reach and the fog grow with the minutes');
      assert(Math.abs(at5.reach - (SIGHT_M + LIGHT_M * 0.04)) <= 0.15 && at0.reach <= 4 && at40.reach >= 17, JSON.stringify({ r0: at0.reach, r5: at5.reach, r40: at40.reach }));
      assert(at0.far < at5.far && at0.seen < 0.6 * at5.seen && at40.seen >= at5.seen, JSON.stringify(rows.map(r => [r.m, r.far, fmt(r.seen, 3)])));
    },
  },
  {
    name: 'woken by the klaxon in the dark bay, the eye is fully dark-adapted: its reach in the bay\'s dark 17 m and more, against 11.7 m for v0.0.4\'s',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-night', seed: SEED }), s = g.state;
      g.step(1, { act: [{ act: 'activity', args: { id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { until: 'reveille' }, force: 'outcome' } }] });
      for (let n = 0; s.skip && n < 1_000_000; n++) g.step(1);
      g.step(20 * 5);                                                  // (five seconds awake in the berth)
      const me = playerActor(s), eye = eyeOf(s, me), v = eyeViewOf(s, me);
      console.log(`      ${hm(s.clock.ms)}, awake ${me.posture === 'lie' ? 'in the berth' : me.posture}: adapted ${fmt(v.a, 2)}, lightK ${fmt(eye.lightK, 2)}, the dark's floor ${fmt(eye.baseM, 1)} m, reach in the bay's dark ${fmt(reachOf(eye, 0.04), 1)} m (v0.0.4's ${fmt(SIGHT_M + LIGHT_M * 0.04, 1)} m, ±${REACH_SOFT_M} m soft); the picture ${fmt(v.gain, 2)}×`);
      assert(!eye.asleep && reachOf(eye, 0.04) >= 17 && v.gain >= 2.3, JSON.stringify({ v, lightK: eye.lightK }));
    },
  },
  {
    name: 'woken by the klaxon, the eye on the tick the wake lands on is open, as the actors layer reads it (the review of v0.0.5\'s eyes: the record still shut until bodyFast, lightK 0 and a blind tick in which any unseen-only change could be applied in sight); nothing in sight moves without a transition over the landing',
    timeoutMs: 120_000,
    fn() {
      const log = [], moved = [];
      let watch = false;
      const wrapped = { ...peopleDomain, fast: { ...peopleDomain.fast, actors(state, input, bus, ctx) {
        if (!watch) return peopleDomain.fast.actors(state, input, bus, ctx);
        const me = playerActor(state), e = eyeOf(state, me), rec = state.people[state.player.id].body.eyes;
        const before = new Map(state.actors.list.map(a => [a, { x: a.x, z: a.z, p: a.posture ?? 'stand', t: a.trans }]));
        log.push({ ms: state.clock.ms, asleep: e.asleep, lightK: e.lightK, baseM: e.baseM, recShut: rec?.shut ?? 0 });
        const r = peopleDomain.fast.actors(state, input, bus, ctx);
        for (const a of state.actors.list) {
          const b = before.get(a);
          if (!b || a === me || a.trans !== b.t) continue;
          if (Math.hypot(a.x - b.x, a.z - b.z) > 0.6 || (a.posture ?? 'stand') !== b.p) moved.push({ who: a.who, seen: !e.asleep && (visibility(state, e, b.x, b.z) > 0 || visibility(state, e, a.x, a.z) > 0) });
        }
        return r;
      } } };
      const g = createGame({ scenario: 'test-night', seed: SEED, domains: { people: wrapped } }), s = g.state;
      g.step(1, { act: [{ act: 'activity', args: { id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { until: 'reveille' }, force: 'outcome' } }] });
      for (let n = 0; s.skip && n < 1_000_000; n++) g.step(1);
      const landed = s.clock.ms;
      watch = true; g.step(20 * 3); watch = false;
      const first = log[0];
      console.log(`      landed at ${hm(landed)} (${landed}); the actors layer's eye on the landing tick: lightK ${first.lightK}, the dark's floor ${first.baseM} m, the record still shut ${first.recShut} (v0.0.5 before the review: lightK 0, 0 m); the next: lightK ${log[1].lightK}`);
      console.log(`      over three seconds: ${moved.length} placed actors moved or changed posture without a transition, ${moved.filter(m => m.seen).length} of them where you see`);
      assert(first.ms === landed && !first.asleep && first.lightK > 1 && first.lightK === log[1].lightK && first.baseM === SIGHT_M, JSON.stringify(log.slice(0, 3)));
      assert(!moved.some(m => m.seen), JSON.stringify(moved));
    },
  },
  {
    name: 'the fog follows the pose you show, not its end (the review of v0.0.5\'s rack): R\'s lie-down keeps the standing view while you walk in to your rack, the lying one once you lie back; T\'s rise keeps the lying view while you sit up in the berth, the standing one once you stand; your own berth always in your sight',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-night', seed: SEED }), s = g.state, me = () => playerActor(s);
      const frame = () => poseAt(me(), s.clock.ms).frame, row = (what) => ({ what, t: hm(s.clock.ms), frame: frame(), seen: seenCells(g), own: visibility(s, eyeOf(s, me()), poseAt(me(), s.clock.ms).x, poseAt(me(), s.clock.ms).z) });
      g.step(2);
      const rows = [row('standing at the rack\'s foot before R')];
      g.step(1, { act: [{ act: 'activity', args: { id: 'sleep', spotId: 'f:e1:bay-2-1:rack-n1#1', args: { until: 'reveille' }, lead: true } }] });
      g.step(9); rows.push(row('R + 0.5 s'));
      const R = me().trans;
      g.step(Math.round((R.fromMs + R.ms * 0.8 - s.clock.ms) / 50)); rows.push(row('R + 80% (lying back)'));
      for (let n = 0; (s.skip || s.time.lead || !s.time.doing) && n < 2_000_000; n++) { g.step(1); if (!s.skip && !s.time.lead && s.clock.ms > R.fromMs + R.ms + 60_000) break; }
      for (let n = 0; s.skip && n < 2_000_000; n++) g.step(1);
      g.step(20); rows.push(row('awake in the berth at the klaxon'));
      const lying = rows.at(-1).seen;
      g.step(1, { mx: 1 });
      g.step(9); rows.push(row('T + 0.5 s'));
      const T = me().trans;
      g.step(Math.round((T.fromMs + T.ms * 0.45 - s.clock.ms) / 50)); rows.push(row('T + 45% (on the edge)'));
      g.step(Math.round((T.fromMs + T.ms * 0.7 - s.clock.ms) / 50)); rows.push(row('T + 70% (standing)'));
      for (const r of rows) console.log(`      ${r.what.padEnd(36)} ${r.t} ${r.frame.padEnd(8)} ${String(r.seen).padStart(4)} cells of the bay in sight; your own spot ${fmt(r.own, 2)}`);
      const [r0, r1, r2, , t1, t2, t3] = rows;
      assert(Math.abs(r1.seen - r0.seen) <= 0.1 * r0.seen && r1.frame === 'walk', `R + 0.5 s within 10% of before R: ${JSON.stringify([r0, r1])}`);
      assert(r2.frame === 'lieDown' && r2.seen < 0.5 * r0.seen, `lying back, the lying view: ${JSON.stringify(r2)}`);
      assert(t1.frame === 'sitUp' && t1.seen === lying, `T + 0.5 s, sitting up, the lying mask: ${JSON.stringify({ t1, lying })}`);
      assert(t2.frame === 'sit' && t2.seen > lying && t2.seen < t3.seen && t3.frame !== 'sitUp', JSON.stringify([t2, t3]));
      assert(rows.every(r => r.own >= 0.5), `your own spot in your sight throughout: ${JSON.stringify(rows.map(r => [r.what, r.own]))}`);
    },
  },
];
