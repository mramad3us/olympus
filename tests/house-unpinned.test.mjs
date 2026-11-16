// OLYMPUS tests: nobody is ever pinned by a body (the build sheet v0.0.20 item 1; user.md U-1; the user, 2026-11-13: "soldiers need to stay fluidly moving").
//
// A walk of yours held by a body (places/move.js: the body gap, useBodies) slid its time a tick at a time with no end before
// v0.0.19's dead-end hunt (the sergeant on 7091: "Clear the room" ran 88.8 s behind your #2 on his stack). From v0.0.20 it never
// stays held: your #2, idle, steps off its path at PIN_GIVE_MS (bundle.js stepOffPath, v0.0.19's); a body that does not (a #2 on
// a task of yours, a stand) is walked round (move.js roundAbout, route.js routed's bodies); held PIN_END_MS in all, the walk ends
// where it stands and hands back ('blocked', the DI's cqb-blocked, T Carry on); Backspace cuts a held walk at once (stepper.js
// halt); a leg the stall passes hands back what still runs on it ('stall', "Move on."); a startle's frozen ticks are no hold.
// Each case below fails without its fix (said in its name), printed with its numbers.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { houseHonestBot } from './bots/house.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { lanePlanOf, pastThreshold } from '../src/sim/combat/room.js';
import { moveNow } from '../src/sim/combat/stepper.js';
import { PIN_GIVE_MS, PIN_END_MS, PIN_WORDS, pinOf } from '../src/sim/places/move.js';
import { OFF_PATH_AFTER_MS, HANDBACK_WORDS } from '../src/sim/combat/bundle.js';
import { startled } from '../src/sim/combat/supp.js';
import { STALL_MS, STALL_MORE_MS } from '../src/sim/scenarios/shoothouse.js';
import { flawlessLane, FUZZ_DOOR_MS } from './flawless.mjs';
import { bodiesLane } from './flawless-bodies.mjs';
import { stepAside } from '../src/sim/places/move.js';
import { TWO_PIN_MS, BODY_GAP_M, GAP_GUARD_M, TWO_SLOT_M } from '../src/sim/combat/bundle.js';

const ROOM3 = 'o:w4:r3', STACK3 = [18.45, 12.45];
const meOf = (s) => s.actors.list.find(a => a.who === s.player.id);
const instinct = (s) => { const l = instinctNow(s).line; return l?.act ? { act: [{ act: 'instinct', args: { id: l.id, act: l.act } }] } : {}; };
// (the boot recruit on 48213 at room 3's stack (setup room:3), walked round his #2 by the keys to 1.8 m east of him in the hall, the
// turners left edge-on: the hunt's second repro's place. task: his #2 on a task of yours (never asked to give way, §0 item 25);
// stand: a stand put on your stack point, a body nothing moves)
function hall({ task = false, stand = false } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'recruit', setup: 'room:3' }), s = g.state, H = s.armoury.range.house;
  if (task) H.two.task = { st: 'working', kind: 'bang', door: 'o:w4:r1', done: {} };
  g.step(1, { act: [stepAct('leave')] });
  for (const [mx, mz, n] of [[0, 1, 8], [1, 0, 40], [0, -1, 6]]) g.step(n, { mx, mz });
  g.step(20, {});
  for (const T of s.armoury.range.turners) T.trigger = { kind: 'never', on: null, gapMs: 0 };
  if (stand) Object.assign(s.armoury.range.turners[0], { x: STACK3[0], z: STACK3[1] });
  g.step(1, { act: ['ready'] }); g.step(2, {});
  const row = stepsOf(s).find(r => r.id.startsWith('drill:stack:up>') && !r.off);
  return { g, s, H, me: meOf(s), two: s.actors.list.find(a => a.who === H.twoPid), row };
}

export default [
  {
    name: 'one figure for the give-way: bundle.js OFF_PATH_AFTER_MS (a literal, the module and move.js in one import cycle) is places/move.js PIN_GIVE_MS; the hand-back at PIN_END_MS 2 s says PIN_WORDS',
    fn() {
      console.log(`      PIN_GIVE_MS ${PIN_GIVE_MS}, OFF_PATH_AFTER_MS ${OFF_PATH_AFTER_MS}, PIN_END_MS ${PIN_END_MS}; "${PIN_WORDS}"; the stall's "${HANDBACK_WORDS.stall}"`);
      assert(OFF_PATH_AFTER_MS === PIN_GIVE_MS && PIN_END_MS === 2000 && HANDBACK_WORDS.stall === 'Move on.', JSON.stringify({ OFF_PATH_AFTER_MS, PIN_GIVE_MS }));
    },
  },
  {
    name: 'the hunt\'s repro (the sergeant on 7091: X at GO, a step aside, G, T on "Clear the room" with your #2 on his stack in your way): past room 1\'s threshold within 10 s of T, he steps off your path as your walk closes on him, before it is held PIN_GIVE_MS (the review of 2026-11-16: held 0.8 s, then noted \'aside\'); before v0.0.19\'s give-way the walk was held 88.8 s and the room passed',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 7091, tier: 'sgt', setup: 'go' }), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans['o:w4:r1'];
      g.step(1, { act: [stepAct('leave')] }); g.step(47, { mz: -1 }); g.step(1, { act: ['ready'] }); g.step(1, {});
      const line = instinctNow(s).line;
      g.step(1, instinct(s));
      const t0 = s.clock.ms, bot = houseHonestBot();
      let inMs = null, held = 0;
      for (let i = 0; i < 400 && inMs === null; i++) { g.step(1, bot); held = Math.max(held, moveNow(s, s.player.id)?.held ?? 0); if (pastThreshold(P, meOf(s).x, meOf(s).z)) inMs = s.clock.ms - t0; }
      console.log(`      T on ${line?.id} (${line?.act}): past room 1's threshold ${inMs === null ? 'NEVER in 20 s' : `${(inMs / 1000).toFixed(2)} s`} after; the walk held ${held} ms at most; his steps aside ${H.two.gave?.n ?? 0}; the leg's pins ${JSON.stringify(H.rooms[0].pins ?? [])}`);
      assert(inMs !== null && inMs <= 10_000 && held < PIN_GIVE_MS && (H.two.gave?.n ?? 0) >= 1, JSON.stringify({ inMs, held, gave: H.two.gave, pins: H.rooms[0].pins }));
    },
  },
  {
    name: 'Stack up from behind your #2 on his stack (the boot recruit, 48213, room:3, the hunt\'s second repro): stacked within 6 s, he steps aside; on a task of yours he is never asked to give way and you are walked round him instead (§0 item 25; v0.0.19 stepped him off his task, and before it the walk was held 87.8 s)',
    fn() {
      const out = [];
      for (const task of [false, true]) {
        const { g, s, H, me, two, row } = hall({ task });
        const t0 = s.clock.ms, twoAt = [two.x, two.z];
        g.step(1, { act: [stepAct(row.id)] });
        let stacked = null, held = 0;
        for (let i = 0; i < 200 && stacked === null; i++) { g.step(1, {}); held = Math.max(held, moveNow(s, s.player.id)?.held ?? 0); if (Math.hypot(me.x - STACK3[0], me.z - STACK3[1]) <= 0.3) stacked = s.clock.ms - t0; }
        out.push({ task, stacked, held, gave: H.two.gave?.n ?? 0, moved: +Math.hypot(two.x - twoAt[0], two.z - twoAt[1]).toFixed(3), pins: (H.rooms[2].pins ?? []).map(p => `${p.how} ${p.ms}`) });
      }
      for (const o of out) console.log(`      his #2 ${o.task ? 'on a task' : 'idle'}: stacked ${o.stacked === null ? 'NEVER in 10 s' : `${(o.stacked / 1000).toFixed(2)} s`} after Stack up; held ${o.held} ms at most; his steps aside ${o.gave}, moved ${o.moved} m; pins ${o.pins.join(', ') || 'none'}`);
      const [idle, task] = out;
      assert(idle.stacked !== null && idle.stacked <= 6000 && idle.gave === 1, JSON.stringify(idle));
      assert(task.stacked !== null && task.stacked <= 6000 && task.gave === 0 && task.moved === 0 && task.pins.some(p => p.startsWith('round')), JSON.stringify(task));
    },
  },
  {
    name: 'a walk with no way round (a stand on your stack point, your #2 on a task beside it) is held PIN_END_MS and no more: it ends where it stands and hands back (\'blocked\'), the DI\'s cqb-blocked names the keys round him and T is Carry on; Backspace 1 s into the hold ends it within a tick and the feet are yours (before: held for ever, Backspace waiting on a beat that never ended)',
    fn() {
      const out = {};
      for (const back of [false, true]) {
        const { g, s, H, me, row } = hall({ task: true, stand: true });
        g.step(1, { act: [stepAct(row.id)] });
        let first = null, end = null;
        for (let i = 0; i < 120 && !end; i++) {
          if (moveNow(s, s.player.id)?.held && first === null) first = s.clock.ms;
          if (back && first !== null && s.clock.ms - first >= 1000) {
            const pinned = pinOf(s);
            g.step(1, { act: ['drill:stop'] });
            const was = [me.x, me.z];
            end = { pressedMs: s.clock.ms - first, pinnedMs: pinned?.heldMs ?? null, moving: !!moveNow(s, s.player.id), phase: s.stop?.phase, carry: s.stop?.carry?.why ?? null };
            g.step(1, { act: [stepAct('leave')] }); g.step(6, { mx: 1, mz: 0 });
            end.feetM = +Math.hypot(me.x - was[0], me.z - was[1]).toFixed(3);
            break;
          }
          g.step(1, {});
          if (!back && s.stop?.carry?.why) { const l = instinctNow(s).line; end = { atMs: s.clock.ms - first, why: s.stop.carry.why, words: s.stop.carry.words, line: l?.id, act: l?.act, text: l?.text, pins: H.rooms[2].pins }; }
        }
        out[back ? 'back' : 'held'] = end;
      }
      console.log(`      held: handed back ${JSON.stringify(out.held)}`);
      console.log(`      Backspace: ${JSON.stringify(out.back)}`);
      const H1 = out.held, B = out.back;
      assert(H1 && H1.why === 'blocked' && H1.atMs <= PIN_END_MS && H1.line === 'cqb-blocked' && H1.act === 'stop:drill:carry' && H1.pins?.some(p => p.how === 'back'), JSON.stringify(H1));
      assert(B && B.pinnedMs >= 1000 && !B.moving && B.phase === 'choose' && B.carry === 'stop' && B.feetM > 0.05, JSON.stringify(B));
    },
  },
  {
    name: 'a startle\'s frozen ticks are never counted as held (§0 item 26): a held walk startled 1.5 s after 0.5 s of hold hands back 2 s of hold later, 3.5 s from its first, no hold counted while frozen',
    fn() {
      const { g, s, me, row } = hall({ task: true, stand: true });
      g.step(1, { act: [stepAct(row.id)] });
      let first = null, end = null, frozen = 0;
      for (let i = 0; i < 200 && !end; i++) {
        g.step(1, {});
        const mv = moveNow(s, s.player.id);
        if (mv?.held && first === null) first = s.clock.ms;
        if (first !== null && s.clock.ms - first === 500) me.combat = { ...(me.combat ?? {}), startleUntilMs: s.clock.ms + 1500 };
        if (startled(s, s.player.id, s.clock.ms) && mv?.heldAtMs === s.clock.ms) frozen += 50;
        if (s.stop?.carry?.why) end = { why: s.stop.carry.why, sinceFirstMs: s.clock.ms - first };
      }
      console.log(`      handed back ${JSON.stringify(end)}; held ticks while frozen ${frozen} ms`);
      assert(end?.why === 'blocked' && end.sinceFirstMs >= 3400 && frozen === 0, JSON.stringify({ end, frozen }));
    },
  },
  {
    name: 'a leg the instructor\'s stall passes hands back what still runs on it (\'stall\', "Move on."): your Stack up running when room 3 is passed ends there, no doing left on the next leg (before: the walk ran on into the hall\'s leg)',
    fn() {
      const { g, s, H, row } = hall({ task: true, stand: true });
      g.step(1, { act: [stepAct(row.id)] }); g.step(4, {});
      const was = s.stop?.doing?.step ?? null;
      H.stallAtMs = s.clock.ms - STALL_MS - STALL_MORE_MS;
      const lines = [];
      g.clearFacts?.();
      g.step(2, {});
      for (const f of g.facts('line')) lines.push(f.text);
      const now = { leg: H.rooms[2].state, doing: s.stop?.doing?.step ?? null, carry: s.stop?.carry?.why ?? null, cur: H.cur };
      console.log(`      running before: ${was}; room 3 ${now.leg}, the leg now ${now.cur}; the doing ${now.doing ?? 'none'}, its hand-back ${now.carry}; said: ${lines.join(' | ')}`);
      assert(was && now.leg === 'passed' && !now.doing && now.carry === 'stall' && lines.includes('Move on.'), JSON.stringify({ was, now, lines }));
    },
  },
  {
    name: 'the review of 2026-11-16 (F4, "the fuzz none over 0.3 s at once"): no still run in a doorway over FUZZ_DOOR_MS for you or your #2 on the fuzz\'s lanes that held both of you there, each on the other: the sergeant on 1148 (his walk to room 3\'s point held 0.85 s by you on the private\'s heels) and the tier one on 1037 (his step out of room 1\'s doorway onto your walk\'s path, you held 2 s and pressed again); and F17\'s on 1074 and 1296 (he turned back into room 2 as you led out, then a step aside routed through its doorway): his stack within TWO_SLOT_M of his slot as you reach yours',
    timeoutMs: 120_000,
    fn() {
      const rows = [];
      for (const [tier, seed] of [['sgt', 1148], ['tierone', 1037], ['tierone', 1074], ['private', 1296]]) {
        const r = flawlessLane({ tier, seed, bot: 'fuzz' }), st = r.two.stackM;
        rows.push({ tier, seed, me: r.door.longestMs, two: r.door.twoLongestMs, slot: st.length ? Math.max(...st) : 0, done: r.done });
      }
      for (const r of rows) console.log(`      ${r.tier} on ${r.seed} by the fuzz: your longest still run in a doorway ${r.me} ms, his ${r.two} ms (at most ${FUZZ_DOOR_MS}); his worst stack ${r.slot.toFixed(3)} m (at most ${TWO_SLOT_M}); to the card ${r.done}`);
      assert(rows.every(r => r.me <= FUZZ_DOOR_MS && r.two <= FUZZ_DOOR_MS && r.slot <= TWO_SLOT_M && r.done), JSON.stringify(rows));
    },
  },
  {
    name: 'a body at rest has no speed of its own (the review of 2026-11-16, F4: a walk cut at 2.03 m/s, then a stance row (Relaxed), kept its speed while you lay in room 1\'s doorway, and your #2, reading you on the move (bundle.js crossingClear), walked in onto you and stood 0.9 s): Relaxed with the feet held, the speed is gone by the next tick',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, me = meOf(s);
      // (a Wait running in stop motion: the clock moving and the feet held, as the fuzz's stance row was)
      g.step(1, { act: ['ready'] }); g.step(2, {}); g.step(1, { act: [stepAct('wait')] }); g.step(1, {});
      me.v = [0, -2.03]; me.moveStance = 'relaxed';
      const ms0 = s.clock.ms;
      g.step(1, {});
      console.log(`      a Wait running (the stop ${s.stop?.phase}, ${s.stop?.doing?.step ?? '-'}), Relaxed, a speed of [0, -2.03] m/s put on you: ${s.clock.ms - ms0} ms on, ${JSON.stringify(me.v ?? null)}`);
      assert(s.stop?.mode === 'stop' && s.clock.ms > ms0 && me.v === undefined, JSON.stringify({ v: me.v, stop: s.stop?.phase, ms: s.clock.ms - ms0 }));
    },
  },
  {
    name: 'his own carry out of your way is held by the body gap alone (BODY_GAP_M, the bound places/move.js bodyClear plans it to), not its guard: a step aside passing 0.51 m from you, closing then opening, goes on (the review of 2026-11-16, F4: the guard\'s 2 cm held a carry 0.516 m from you for good on the tier one\'s 1037, and your walk, held by his body, with it)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go' }), s = g.state, H = s.armoury.range.house, me = meOf(s), two = s.actors.list.find(a => a.who === H.twoPid);
      g.step(1, { act: ['ready'] }); g.step(2, {});
      for (const T of s.armoury.range.turners) T.trigger = { kind: 'never', on: null, gapMs: 0 };
      // (him 0.51 m off your line to one side, a step aside past you along it: its nearest 0.51 m, between the gap and its guard)
      const off = 0.51, at = [me.x + off, me.z - 0.15], to = [me.x + off, me.z + 0.45];
      Object.assign(two, { x: at[0], z: at[1] }); delete two.v; delete H.two.doing;
      const t = stepAside(s, H.twoPid, two, to, s.clock.ms);
      assert(t && t.path.length === 2, `no straight step: ${JSON.stringify(t?.path)}`);
      two.through = t;
      const z0 = two.z;
      // (out of stop motion, the clock running, you standing)
      g.step(1, { act: [stepAct('leave')] }); g.step(11, {});
      const went = +(two.z - z0).toFixed(3), held = H.two.gap?.ms ?? 0;
      console.log(`      you at (${me.x.toFixed(2)}, ${me.z.toFixed(2)}), his step aside (way ${t.way}) from 0.53 m to 0.51 m and out (the guard ${BODY_GAP_M + GAP_GUARD_M} m): ${went} m along it in 0.6 s, held ${held} ms`);
      assert(went > 0.2 && held === 0, JSON.stringify({ went, held }));
    },
  },
  {
    name: 'F46 as the build sheet words it ("outside a funnel, at most TWO_PIN_MS + his routed walk"; in one, the calls and the DI): his walk held by you standing outside a doorway never past TWO_PIN_MS and a tick, a way round tried or not, and in a doorway "Coming in!" on its cadence with the DI\'s cqb-two-out: the fuzz\'s lanes of the review of 2026-11-16 (the private on 1074, 43.5 s behind you outside any doorway, a route tried every 1.5 s and passed by the gauge; the tier one on 1074, 41 s in room 2 behind you in its doorway, not a word)',
    timeoutMs: 120_000,
    fn() {
      const rows = [['private', 1074], ['tierone', 1074]].map(([tier, seed]) => ({ tier, seed, R: bodiesLane({ tier, seed, bot: 'fuzz' }) }));
      for (const { tier, seed, R } of rows) console.log(`      ${tier} on ${seed}: held past TWO_PIN_MS ${TWO_PIN_MS} ms outside a doorway ${R.gapRuns} ticks (his longest hold ${R.gapMaxMs} ms, routed ${R.rounds}); in a doorway with no call ${R.silent ?? 0} ticks; held out ${R.blocks.n} times, "Coming in!" ${R.blocks.calls}, off its cadence ${R.blocks.bad.length}; cqb-two-out silent ${R.twoOut} ticks; to the card ${R.done}`);
      assert(rows.every(({ R }) => !R.gapRuns && !(R.silent ?? 0) && !R.blocks.bad.length && !R.twoOut && R.done), JSON.stringify(rows.map(({ tier, seed, R }) => ({ tier, seed, gapRuns: R.gapRuns, silent: R.silent, bad: R.blocks.bad, twoOut: R.twoOut }))));
    },
  },
];
