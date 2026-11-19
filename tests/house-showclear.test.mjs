// OLYMPUS tests: SHOW CLEAR to the instructor's eye and no standing about for your #2 (the build sheet v0.0.22 items 1 and 18, FL22-1, FL22-8).
//
// After the lane the instructor walks the catwalk to the marine he inspects (shoothouse.js inspectNext: you, then your #2) and calls a
// gun clear only once his eye has been within SHOW_CLEAR_M 2.5 m of that marine's chest for SHOW_LOOK_MS 600 ms (chiefSees); your #2's
// "Number two, clear." waits on that look (two.js W.showOwed, said by twoAdminTick on the tick the house's host says he has looked);
// his clear, the look at it and the wash's wait pass behind the brief splash ('house-showclear', houseSecond), and "The lane is clear."
// comes WASH_AFTER_MS after the last "Clear." at the tower's whole second. Before v0.0.22 (the feel lens): at "Number two, clear." the
// instructor stood 6.2 m from your #2 on every turner lane and 11 to 17 m on a live lane ended in room 2 or 3; your "Clear." to the
// hot wash 5.3 to 16.1 s by sheet, lived at 1×, with a stop-motion pause opening inside it. The lanes are tests/flawless-end.mjs
// endLane's (from the fill to the card), the tail in modelled real time (a lived tick 50 ms, a skip one frame).
import { assert } from './helpers.mjs';
import { endLane, endGaugeOf, TAIL_REAL_MAX_MS } from './flawless-end.mjs';
import { SHOW_CLEAR_M, SHOW_LOOK_MS } from '../src/sim/scenarios/shoothouse.js';

const r2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '-');
const line = (r) => `${r.cell}: ${r.done ? r.end : 'NOT to the card'}; clears ${r.clears.map(c => `${c.who} ${r2(c.dM)} m`).join(', ')}; tail ${r.tail?.realMs ?? '-'} ms real (${r.tail?.gameMs ?? '-'} ms of game time), ${r.tail?.pauses ?? '-'} pauses`;
const bad = (r) => !r.done || !r.tail?.washed || r.tail.realMs > TAIL_REAL_MAX_MS || r.tail.pauses > 0 || r.clears.length < 2 || r.clears.some(c => !(c.dM <= SHOW_CLEAR_M));
// (the boot recruit by the keys on 1, live, from the fill: a casualty in room 2, his rifle swung onto the sling in UNLOAD, SHOW CLEAR)
let RECRUIT = null;
const recruit = () => (RECRUIT ??= endLane({ tier: 'recruit', seed: 1, bot: 'keys', opfor: 'live' }));

export default [
  {
    name: 'SHOW CLEAR to the eye: the tier one by T on 48213 at GO and the boot recruit by the keys on 1 live from the fill (a casualty in room 2), every "Clear." and "Number two, clear." with the instructor\'s eye within SHOW_CLEAR_M 2.5 m; from your guns passed to "The lane is clear." at most 1.5 s of modelled real time with no stop-motion pause in it (before: 6.2 m and 13 m; 5.3 to 16.1 s at 1×)',
    fn() {
      const recs = [endLane({ tier: 'tierone', seed: 48213, bot: 'T', setup: 'go' }), recruit()], g = endGaugeOf(recs);
      for (const r of recs) console.log(`      ${line(r)}`);
      console.log(`      F82: ${g.met ? 'MET' : 'OPEN'}: ${g.value}`);
      assert(!recs.some(bad) && g.met, JSON.stringify({ bad: recs.filter(bad).map(r => [r.cell, r.tail, r.clears]), g: g.bad }));
    },
  },
  {
    name: 'your #2\'s "Number two, clear." waits on the instructor\'s look: the sergeant by T on 48213 live (live:fight,hide) at GO, a casualty in room 2, his macro over deep in the room where no point of the catwalk reaches him, his walk out under it, the line said with the eye within reach (before: said in his macro\'s last tick, the instructor 13 m off)',
    fn() {
      const r = endLane({ tier: 'sgt', seed: 48213, bot: 'T', opfor: 'live:fight,hide', setup: 'go' }), s = r.$state, H = s.armoury.range.house, W = H.two;
      const two = r.clears.find(c => c.who === 'two'), ended = W.last?.step === 'cmd:clear' ? W.last.untilMs : null;
      console.log(`      ${line(r)}; his SHOW CLEAR over ${r2((ended - r.goAtMs) / 1000)} s, his line ${r2((two?.atMs - r.goAtMs) / 1000)} s (${two ? two.atMs - ended : '-'} ms after, his walk out and the look), the look done ${r2((H.show?.done?.[H.twoPid] - r.goAtMs) / 1000)} s`);
      assert(r.done && two && ended !== null && two.atMs - ended >= SHOW_LOOK_MS && two.dM <= SHOW_CLEAR_M && H.show.done[H.twoPid] <= two.atMs, JSON.stringify({ ended, two, show: H.show }));
    },
  },
  {
    name: 'the house bot answers "Rifle up" after Stop: the boot recruit by the keys on 1 live, his rifle swung onto the sling in UNLOAD, SHOW CLEAR, brings it up and shows it himself, the lane to its card with no take by the instructor (before: Wait pressed until the take at the move-on, 60 s after the command)',
    fn() {
      const r = recruit(), take = r.words.filter(w => w.who === 'chief' && /Give it here|I will clear it/.test(w.text));
      console.log(`      ${r.cell}: ${r.done ? r.end : 'NOT to the card'}, tick ${r.tick}; the instructor's take ${take.length ? take.map(t => `"${t.text}"`).join(', ') : 'none'}; your "Clear." ${r.clears.filter(c => c.who === 'me').length} times (a show again after each swing)`);
      assert(r.done && !take.length && r.clears.filter(c => c.who === 'me').length >= 2, JSON.stringify({ done: r.done, take, clears: r.clears }));
    },
  },
  {
    name: 'SHOW CLEAR to the eye (heavy): the private, the sergeant and the tier one on 48213 and 1037 by the keys and by T from the fill, every clear in reach and every tail under 1.5 s real with no pause (F82\'s own lanes)',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const recs = [];
      for (const tier of ['private', 'sgt', 'tierone']) for (const bot of ['keys', 'T']) for (const seed of [48213, 1037]) recs.push(endLane({ tier, seed, bot }));
      const g = endGaugeOf(recs);
      for (const r of recs) console.log(`      ${line(r)}`);
      console.log(`      F82: ${g.met ? 'MET' : 'OPEN'}: ${g.value}`);
      assert(!recs.some(bad) && g.met, JSON.stringify(g.bad));
    },
  },
];
