// OLYMPUS tests: a door moves as it was opened (quick; the build sheet v0.0.20 item 15, the feel lens's FL-6).
//
// "The picture and the sound do not tell a kick from a push" (feel.md FL-6). The delta keeps the verb (model.js setOpening's `how`),
// the stage draws doors.js leafShownAt (leafCurve over leafAt's span and atMs: a push eases out, a pull is drawn by a hand, a kick
// slams to its stop at t 0.55, rebounds to 0.88 at t 0.75 and settles), and the house's door facts carry leafAtMs and stopAtMs for
// the knock. leafAt, the sim's linear fraction, the nav and bundle.js's leafAt(…) >= 1 are unchanged (house-doors' 10 and F26 hold
// as they are). Each case fails without the fix: there was no leafCurve, no `how` on the delta and no stopAtMs on the fact.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { leafCurve, leafShownAt, leafAt, KICK_STOP_T, KICK_BACK_K } from '../src/sim/places/doors.js';
import { setOpening, openingDelta } from '../src/sim/places/model.js';

const T = Array.from({ length: 11 }, (_, i) => i / 10);
const f3 = (x) => x.toFixed(3);

export default [
  {
    name: 'the three curves at t steps of 0.1 (printed): a push and a pull rise and never fall; a kick stands at its stop (at least 0.95) by t 0.55, back off it to at most 0.90 at t 0.75, at 1 at the end; every verb starts at 0 and ends at 1, as the linear swing does',
    fn() {
      const rows = Object.fromEntries(['push', 'pull', 'kick', null].map(h => [h ?? 'linear', T.map(t => leafCurve(h, t))]));
      for (const [h, v] of Object.entries(rows)) console.log(`      ${h.padEnd(6)} ${v.map(f3).join(' ')}`);
      const mono = (v) => v.every((x, i) => i === 0 || x >= v[i - 1] - 1e-12);
      assert(mono(rows.push) && mono(rows.pull) && Object.values(rows).every(v => v[0] === 0 && Math.abs(v[10] - 1) < 1e-12), JSON.stringify(rows));
      assert(leafCurve('kick', KICK_STOP_T) >= 0.95 && leafCurve('kick', 0.75) <= 0.90 && Math.abs(leafCurve('kick', 0.75) - KICK_BACK_K) < 1e-9 && leafCurve('kick', 1) === 1, JSON.stringify(rows.kick));
      assert(rows.push[3] > rows.linear[3] && rows.pull[3] < rows.linear[3], 'the push leads the linear swing, the pull lags it');
    },
  },
  {
    name: 'the delta keeps the verb, the span is the same: a kicked, a pushed and a pulled door each finish at the atMs given, leafAt (the sim\'s) linear as before and leafShownAt the curve; a save made mid-kick loads and draws the same fraction',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'go' }), s = g.state, t0 = s.clock.ms, rows = [];
      for (const [how, id] of [['kick', 'o:w4:r1'], ['pull', 'o:w4:r2'], ['push', 'o:w4:r3']]) {
        setOpening(s, id, 'open', { atMs: t0 + 400, how });
        const d = openingDelta(s, id);
        rows.push({ how, id, atMs: d.atMs - t0, kept: d.how, mid: [leafAt(s, id, t0 + 300), leafShownAt(s, id, t0 + 300)].map(f3).join(' / ') });
      }
      for (const r of rows) console.log(`      ${r.how} ${r.id}: ends at +${r.atMs} ms, delta.how ${r.kept}; at t 0.75 leafAt / leafShownAt ${r.mid}`);
      assert(rows.every(r => r.atMs === 400 && r.kept === r.how), JSON.stringify(rows));
      assert(rows.find(r => r.how === 'kick').mid === '0.750 / 0.880', JSON.stringify(rows));
      // (mid-kick: the leaf three quarters through its swing now (the setup stands in stop motion, the clock still), saved, loaded in a new game)
      setOpening(s, 'o:w4:r1', 'open', { atMs: t0 + 100, how: 'kick' });
      const at = s.clock.ms, before = leafShownAt(s, 'o:w4:r1', at), json = g.save();
      const h = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup: 'go' });
      h.load(json);
      const after = leafShownAt(h.state, 'o:w4:r1', h.state.clock.ms);
      console.log(`      mid-kick at +${at - t0} ms: ${f3(before)} before the save, ${f3(after)} after the load`);
      assert(before > 0 && before < 1.0001 && Math.abs(before - after) < 1e-12 && h.state.clock.ms === at, JSON.stringify({ before, after }));
    },
  },
  {
    name: 'in the lane the house\'s door facts carry the leaf\'s start and its stop (the tier one by T on 48213): room 1\'s push and room 2\'s pull stop at the swing\'s end, leafAtMs the hand\'s end, the delta\'s atMs the stop; the delta keeps the verb',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), doors = [];
      runHouse(g, houseHonestBot(), { maxMs: 4 * 60_000, each(game) { for (const f of game.facts('door')) if (f.leafAtMs !== undefined || f.how) doors.push({ ...f, delta: openingDelta(game.state, f.id) }); } });
      for (const f of doors) console.log(`      ${f.id} ${f.how}: leaf ${f.leafAtMs ?? '-'}, stop ${f.stopAtMs ?? '-'} (+${(f.stopAtMs ?? 0) - (f.leafAtMs ?? 0)} ms), delta ${f.delta?.how ?? '-'} at ${f.delta?.atMs ?? '-'}`);
      assert(doors.length >= 2 && doors.every(f => Number.isFinite(f.leafAtMs) && Number.isFinite(f.stopAtMs) && f.stopAtMs > f.leafAtMs), JSON.stringify(doors));
      const ours = doors.filter(f => ['push', 'pull', 'kick'].includes(f.how));
      assert(ours.length >= 2 && ours.every(f => f.delta?.how === f.how && (f.how === 'kick' ? f.stopAtMs === f.leafAtMs + 220 : f.stopAtMs === f.delta.atMs)), JSON.stringify(ours));
    },
  },
];
