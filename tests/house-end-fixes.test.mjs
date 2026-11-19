// OLYMPUS tests: the B and C review's findings on the lane's end and the live lane (v0.0.22, 2026-11-16), each failing without its fix.
//
//   (4) a lane whose last leg the due passed ends 'passed', a leg nobody cleared: the wash says "Weapons clear." or "Guns are clear.",
//       never "The lane is clear." (shoothouse.js houseCmdSay; before, "The lane is clear." after "Time on that room. Next door.");
//   (5) the paint held while the man who struck still has rounds to fire at that marine (shoothouse.js liveTick, paintRoundsLeft): one
//       call PAINT_CALL_MS after his last round, none if his next round makes the casualty (before, "Keep working." at the first
//       strike's 600 ms with his next pair already planned: the fuzz private on 7 live, 1,950 ms before the cease fire);
//   (6) two strikes on one marine inside PAINT_CALL_MS called as one: "Paint, chest, two." on one part, "Paint, chest and left arm." on
//       two (no test failed with the merge taken out);
//   (7) the house bot after a save loaded in the SHOW CLEAR tail carries on as the unbroken run (tests/bots/house.mjs: the first tick
//       after a load, where the instinct's runtime line is absent, and the Wait read as the DI's lines that say so; before, 35 of 400
//       tail saves of the tier one by T on 48213 were apart one step on, in the bot's gAtMs and presses).
// The paint cases drive liveTick alone on a live lane at room 2 (tests/opfor-world.mjs liveGame), the strikes and the man's rounds
// written by hand and his rounds marked fired as the clock passes them; the chief's words read off the bus.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseBot } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { endWatch } from './flawless-end.mjs';
import { liveGame } from './opfor-world.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { liveTick, PAINT_CALL_MS } from '../src/sim/scenarios/shoothouse.js';
import { SEQ_HOUSE, HOUSE_CHIEF } from '../src/data/courses.js';
import { TICK_MS } from '../src/core/clock.js';

const WASH = SEQ_HOUSE.find(c => c.id === 'wash');

// (a marine who presses nothing: out of stop motion at each choice, Wait where X is not offered; tests/house-due.test.mjs's)
const idle = (state) => {
  if (!(state.stop?.mode === 'stop' && state.stop.phase === 'choose')) return {};
  const rows = stepsOf(state), on = (id) => rows.some(r => r.id === id && !r.off);
  return on('leave') ? { act: [stepAct('leave')] } : on('wait') ? { act: [stepAct('wait')] } : {};
};

// (strikes on you at their ms from now, { at, where? }, and the man's rounds still to fire at you (ms from now), liveTick run each
// tick for ms: the instructor's words, { t, text }, t in ms from the first strike)
function paintScene(strikes, { rounds = null, ms = 2500 } = {}) {
  const { s, R, H } = liveGame({ seed: 48213, tier: 'sgt', setup: 'room:2', opfor: 'live:fight,hide' });
  const pid = s.player.id, T = R.turners.find(t => t.live), LV = H.live, t0 = s.clock.ms, said = [];
  (LV.said ??= {}).paint = LV.struck.length;
  if (rounds) T.live.eng = { key: `p:${pid}`, row: 'pair', rounds: rounds.map((at, i) => ({ atMs: t0 + at, part: 'torso', follow: 0, climbK: 1, i, n: rounds.length })) };
  const bus = { emit(type, e) { if (type === 'say' && e.who === R.coachId) said.push({ t: s.clock.ms - t0, text: e.text }); }, on() {}, off() {} };
  for (let t = 0; t <= ms; t += TICK_MS) {
    s.clock.ms = t0 + t;
    for (const k of strikes) {
      if (k.at !== t) continue;
      LV.struck.push({ who: pid, by: T.key, shotId: `end-fixes-${k.at}`, part: 'torso', zone: 'chest', at: [0, 0, 0], atMs: s.clock.ms });
      if (k.where) (LV.would.log ??= []).push({ shotId: `end-fixes-${k.at}`, on: pid, where: k.where });
    }
    for (const r of T.live.eng?.rounds ?? []) if (r.atMs <= s.clock.ms) r.done = true;
    if (k0(strikes, t)?.fatal) LV.casualty = { who: pid, atMs: s.clock.ms };
    liveTick(s, bus, R, H, s.clock.ms);
  }
  return said.filter(x => /Keep working\.$/.test(x.text));
}
const k0 = (strikes, t) => strikes.find(k => k.at === t) ?? null;
const words = (said) => said.map(x => `"${x.text}" at ${x.t} ms`).join(', ') || 'none';

export default [
  {
    name: 'a lane whose last leg the due passed is not called clear: the hall 560 s from GO with nobody pressing ends \'passed\' at 585 s and the wash is "Weapons clear. …" or "Guns are clear. …", never "The lane is clear." (shoothouse.js houseCmdSay; the B and C review: "The lane is clear." at 711 s after "Time on that room. Next door.")',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', setup: 'hall' }), H = g.state.armoury.range.house;
      H.goAtMs -= 560_000; H.stallAtMs = g.state.clock.ms;
      const w = endWatch(g), r = runHouse(g, idle, { maxMs: 12 * 60_000, each: w.each }), rec = w.rec();
      console.log(`      the lane ${rec.end} at ${((H.end?.atMs - H.goAtMs) / 1000).toFixed(1)} s from GO; the wash "${rec.wash}"; lane words after the end ${rec.after.map(a => a.what).join(', ') || 'none'}`);
      assert(r.done && rec.end === 'passed' && WASH.sayEnd.other.includes(rec.wash) && !rec.after.length, JSON.stringify({ end: rec.end, wash: rec.wash, after: rec.after }));
    },
  },
  {
    name: 'the paint waits while the man who struck still has rounds to fire at you: called PAINT_CALL_MS (600 ms) after his last round, "two" if it struck too, and not at all if it made the casualty (shoothouse.js liveTick; the B and C review: "Keep working." 1,950 ms before the cease fire on the fuzz private\'s 7 live, his next pair planned on the tick after his strike)',
    fn() {
      const miss = paintScene([{ at: 0 }], { rounds: [850, 1200] });
      const hit = paintScene([{ at: 0 }, { at: 850 }], { rounds: [850, 1200] });
      const fatal = paintScene([{ at: 0 }, { at: 850, fatal: true }], { rounds: [850, 1200] });
      const none = paintScene([{ at: 0 }]);
      console.log(`      his next pair at 850 and 1,200 ms, missing: ${words(miss)}; striking at 850 ms: ${words(hit)}; fatal at 850 ms: ${words(fatal)}; no rounds left: ${words(none)} (PAINT_CALL_MS ${PAINT_CALL_MS})`);
      assert(miss.length === 1 && miss[0].t === 1200 + PAINT_CALL_MS && HOUSE_CHIEF.paint.some(t => miss[0].text === t.replace('{part}', 'chest')), JSON.stringify(miss));
      assert(hit.length === 1 && hit[0].t === 1200 + PAINT_CALL_MS && HOUSE_CHIEF.paintTwice.some(t => hit[0].text === t.replace('{part}', 'chest')), JSON.stringify(hit));
      assert(!fatal.length && none.length === 1 && none[0].t === PAINT_CALL_MS, JSON.stringify({ fatal, none }));
    },
  },
  {
    name: 'two strikes on one marine inside PAINT_CALL_MS are called as one: "Paint, chest, two." (HOUSE_CHIEF.paintTwice) on one part, "Paint, chest and left arm." on two, 600 ms after the first (shoothouse.js liveTick\'s merge; the B and C review: no test failed with it taken out)',
    fn() {
      const one = paintScene([{ at: 0 }, { at: 300 }]), two = paintScene([{ at: 0 }, { at: 300, where: 'left arm' }]);
      console.log(`      chest and chest 300 ms apart: ${words(one)}; chest and left arm: ${words(two)}`);
      assert(one.length === 1 && one[0].t === PAINT_CALL_MS && HOUSE_CHIEF.paintTwice.some(t => one[0].text === t.replace('{part}', 'chest')), JSON.stringify(one));
      assert(two.length === 1 && two[0].t === PAINT_CALL_MS && HOUSE_CHIEF.paint.some(t => two[0].text === t.replace('{part}', 'chest and left arm')), JSON.stringify(two));
    },
  },
  {
    name: 'the house bot carries a save in the SHOW CLEAR tail on as the unbroken run: the tier one by T on 48213, a save every 10th step from Stop to the wash, each loaded and stepped once beside the unbroken run, the whole digests equal, the bot\'s memory with them (tests/bots/house.mjs; the B and C review: the bot pressed G on the first tick after a load)',
    fn() {
      const opts = { scenario: 'test-shoothouse', seed: 48213, tier: 'tierone' };
      const g = createGame(opts), bot = houseBot({ mode: 'T' }), H = g.state.armoury.range.house, saves = new Map(), after = new Map();
      for (let n = 0; n < 20_000 && !g.state.armoury.range.end; n++) {
        const tail = H.end && ['stop', 'clear'].includes(g.state.armoury.range.cmd?.id);
        if (tail && n % 10 === 0) saves.set(n, g.save());
        g.step(1, bot); g.clearFacts?.();
        if (saves.has(n)) after.set(n, g.digest());
      }
      const apart = [];
      for (const [n, sv] of saves) { const L = createGame(opts); L.load(sv); L.step(1, houseBot({ mode: 'T' })); if (L.digest() !== after.get(n)) apart.push(n); }
      console.log(`      ${saves.size} saves in the tail (steps ${[...saves.keys()][0]} to ${[...saves.keys()].at(-1)}), apart one step on: ${apart.length}${apart.length ? ` (steps ${apart.join(', ')})` : ''}`);
      assert(saves.size >= 20 && !apart.length, JSON.stringify({ saves: saves.size, apart }));
    },
  },
];
