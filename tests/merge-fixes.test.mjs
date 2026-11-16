// OLYMPUS tests: v0.0.20's integration, the merge's findings, each failing without its fix (.run/v020/integrate.md).
//
// The four roles merged on v0.0.19 (A, B, D, C) moved the lanes' clocks, and the dice keyed by absolute game ms (the #2's
// identification, the force's roll, your own look) fell elsewhere: three behaviours v0.0.19 already had, on lanes its gauges did
// not happen to meet, turned three enforced gauges red on the heavy runs. Each case below sets the state up through the game's
// own actions and prints what it measures:
//   - your #2's failed identification at a room you have entered no longer holds his entry (F25 on the hundred seeds);
//   - a failed task of his drops its tool at his feet (F37: the halligan carried to the card);
//   - a row of yours cut because you see a man's hands is your identification of him (the live lanes' F8, F14, F15: "Rifle. Pair."
//     on a man who gave up, pressed to the stall).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { botOf } from './flawless.mjs';
import { teamTaskBot } from './bots/team.mjs';
import { doorNow, entryGo } from '../src/sim/combat/bundle.js';
import { pastThreshold } from '../src/sim/combat/room.js';
import { handDeviceOf } from '../src/sim/arms/devices.js';
import { contactOf } from '../src/sim/people/mind.js';

export default [
  {
    name: 'your #2 whose identification of his man fails while you are past the room\'s threshold and he is not looks again on his way in, never halted in the doorway for it: the corporal on 1481 is in room 3 within F25\'s 3 s of his cue (3.55 s before, two failed looks of 1.2 s each)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 1481, tier: 'cpl', setup: 'go' }), s = g.state, H = s.armoury.range.house, pid = s.player.id;
      const door = 'o:w4:r3', E = { cue: null, in: null, failed: 0, moved: 0 };
      let wasUntil = null;
      runHouse(g, botOf('honest', { seed: 1481 }), { maxMs: 4 * 60_000, each: () => {
        if (E.in !== null) return;
        const now = s.clock.ms, me = s.actors.list.find(a => a.who === pid), two = s.actors.list.find(a => a.who === H.twoPid), here = doorNow(s, pid);
        if (here?.door !== door) return;
        if (E.cue === null && entryGo(s, here.plan, me, now, here.rec)) E.cue = now;
        if (pastThreshold(here.plan, two.x, two.z)) { E.in = now; return; }
        const c = H.two.contact;
        if (c && wasUntil !== null && c.untilMs > wasUntil && now >= wasUntil) { E.failed++; if (c.move) E.moved++; }
        wasUntil = c ? c.untilMs : null;
      } });
      const lag = E.cue !== null && E.in !== null ? E.in - E.cue : null;
      console.log(`      room 3: his cue at +0, in at ${lag === null ? 'never' : `+${fmt(lag / 1000, 2)} s`}; his failed looks on his way in ${E.failed}, each on the move ${E.moved}`);
      assert(lag !== null && lag <= 3000 && E.failed === E.moved, JSON.stringify({ lag, ...E }));
    },
  },
  {
    name: 'a task of your #2\'s that fails with its tool in his hand (a pry that would not give, its force halted \'fail\') leaves the tool down at his feet and his hands free, never carried into the rooms after and to the card: F37\'s sergeant on 1489397426 on the breach loadout without his P-12, room 2\'s pry failed by the dice (before the fix he carried the halligan to the card)',
    fn() {
      // (F37's own lane, his P-12 off ('~two:none'): the lane the dice failed his pry on at the merge, before his P-12 moved them)
      const g = createGame({ scenario: 'test-shoothouse', seed: 1489397426, tier: 'sgt', loadout: 'breach~two:none' }), s = g.state, H = s.armoury.range.house;
      let fail = null, after = null;
      runHouse(g, teamTaskBot({ use: 'breach' }), { maxMs: 12 * 60_000, each: () => {
        const t = H.two.task, held = handDeviceOf(s, H.twoPid);
        if (!fail && t?.st === 'failed' && t.why === 'fail') fail = { door: t.door, how: t.how, atMs: s.clock.ms };
        if (fail && after === null && s.clock.ms >= fail.atMs + 1000) after = held?.model ?? null;
      } });
      const card = handDeviceOf(s, H.twoPid)?.model ?? null;
      console.log(`      his ${fail?.how ?? '-'} at ${fail?.door ?? '-'} ${fail ? 'failed' : 'never failed'}; in his hand a second on ${after ?? 'nothing'}, at the card ${card ?? 'nothing'}`);
      assert(fail && after === null && card === null, JSON.stringify({ fail, after, card }));
    },
  },
  {
    name: 'a row of yours cut because you see the hands of a man who gave up makes his hands your identification of him: on the sergeant\'s give,give lane on 48213 the DI never names a pair on him again and room 2 is cleared (101.6 s and the stall\'s TIME before, "Rifle. Pair." at every stop)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', opfor: 'live:give,give' }), s = g.state, H = s.armoury.range.house;
      let cut = 0, wrong = 0;
      const r = runHouse(g, botOf('honest', { seed: 48213 }), { maxMs: 5 * 60_000, each: () => {
        const d = s.stop?.doing, L = contactOf(s)?.last;
        if (d?.kind === 'shot' && d.cut && d.target) { cut++; const T = s.armoury.range.turners.find(x => x.key === d.target); if (T?.live?.gaveAtMs && L?.ids?.includes(T.key) && L.ident?.[T.key] !== T.holds) wrong++; }
      } });
      const L2 = H.rooms[1];
      const faults = (L2.faults ?? []).map(f => f.kind);
      console.log(`      room 2: ${L2.state}, faults ${faults.join(', ') || 'none'}; ticks of a cut row ${cut}, with his identification not his hands ${wrong}; the lane ${r.done ? 'to the card' : 'NOT to the card'}`);
      assert(r.done && L2.state === 'clear' && !faults.includes('time') && wrong === 0, JSON.stringify({ state: L2.state, faults, cut, wrong }));
    },
  },
];
