// OLYMPUS tests: the startle suspends the flow (the build sheet v0.0.19 §3.3, §6 "L"; COMBAT §5.7, §25.18's reach review: "suspends for incoming fire and for a hit"): a startled marine's bundle starts nothing new and brakes where it stands, and goes on by itself at the startle's end; a window open across it pauses as ever.
//
// The lanes are "Stack and clear" (test-shoothouse) at the corporal on 48213 from GO, run by the honest bot (tests/flawless.mjs
// botOf('honest')); the startle is written into the marine's pool as any input is (supp.js addSupp: a hit of 80 points,
// unprepared, felt 44 over the corporal's hardening of 36, a jump of 44 and a 1.20 s freeze), on the tick his bundle walks at
// full speed (or, the second case, with a take-in's window open on room 1's man). The role-players' fire (combat/men.js
// incoming) writes the same input, so this is the live lane's interrupt without the live men, whose brain is
// src/sim/scenarios/opfor.js's. Before v0.0.19 supp.js's "stop after the running beat" let the move run on to its end
// through the freeze (1.47 m walked in the 1.20 s, and the #2 0.92 m in his 0.75 s: v0.0.18's code, run on this file), and the
// bundle then ended 'stop', its "stop after the beat" left in a flow a window suspended meanwhile.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { botOf } from './flawless.mjs';
import { runHouse } from './bots/house.mjs';
import { isHeld, TICK_MS } from '../src/core/clock.js';
import { addSupp, startled, blockOf } from '../src/sim/combat/supp.js';

const SEED = 48213, TIER = 'cpl';
const STARTLE = Object.freeze({ id: 'test-startle', kind: 'hit', pts: 80, why: 'the test' });
/** The most a body may travel through a startle begun at walking speed: the tick it lands on and the legs' brake (m; 1.2 m/s, BODY §16.2's brake about 5 m/s², with room). */
const BRAKE_M = 0.35;

// (a lane at GO, stepped by the honest bot until pred(game) holds; then the game, its bot and the ticks it took)
function laneTo(pred, maxTicks = 4000) {
  const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: TIER, setup: 'go' }), bot = botOf('honest', { seed: SEED });
  let n = 0;
  while (n < maxTicks && !pred(g)) { g.step(1, bot); g.clearFacts(); n++; }
  return { g, bot, n };
}
const speedOf = (a) => Math.hypot(a?.v?.[0] ?? 0, a?.v?.[1] ?? 0);
const runningMove = (d) => d?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof) ?? null;
// (a startle's run, watched tick by tick: the travel, the beats begun, the doing kept and the time held)
function watchStartle(g, bot, pid, actor, doing) {
  const s = g.state, d0 = doing(), out = { ticks: 0, travelM: 0, beats: 0, same: true, held: 0, why: null };
  let last = [actor().x, actor().z];
  while (startled(s, pid, s.clock.ms) && out.ticks < 400) {
    g.step(1, bot); out.ticks++;
    const a = actor();
    out.travelM += Math.hypot(a.x - last[0], a.z - last[1]); last = [a.x, a.z];
    out.beats += g.facts('bundle').filter(f => f.phase === 'beat' && f.who === pid).length;
    if (doing() !== d0) out.same = false;
    if (isHeld(s)) out.held++;
    out.why = doing()?.suspended?.why ?? doing()?.suspendAsk?.why ?? null;
    g.clearFacts();
  }
  return out;
}

export default [
  {
    name: 'a startled marine\'s bundle starts nothing new and brakes where he stands, and goes on by itself at the startle\'s end, no stop and no "Carry on", to its end and the card (fails without the startle suspension: the feet walk on while he is frozen, and the bundle hands back)',
    fn() {
      const { g, bot, n } = laneTo((game) => !!runningMove(game.state.stop?.doing) && speedOf(game.me()) > 1.0);
      const s = g.state, pid = s.player.id, d0 = s.stop.doing, v0 = speedOf(g.me());
      addSupp(s, g.bus, pid, { ...STARTLE, atMs: s.clock.ms });
      const B = blockOf(s, pid), freezeMs = B.startleUntilMs - s.clock.ms;
      const w = watchStartle(g, bot, pid, () => g.me(), () => s.stop?.doing);
      // (after: the doing goes on by itself, with no hold, no carry; then its end, and the lane to its card)
      let resumedAt = null;
      for (let k = 0; k < 4 && resumedAt === null; k++) { g.step(1, bot); if (s.stop?.doing === d0 && !d0.suspended && runningMove(d0)) resumedAt = k + 1; }
      const held = isHeld(s), carry = !!s.stop?.carry;
      let end = null;
      const r = runHouse(g, bot, { each: (game) => { if (!end) end = game.facts('bundle').find(f => f.phase === 'end' && f.id === d0.step) ?? null; } });
      console.log(`      at ${fmt(n * TICK_MS / 1000, 2)} s from GO, ${d0.step} walking at ${fmt(v0, 2)} m/s: startled ${fmt(freezeMs / 1000, 2)} s (${w.ticks} ticks); walked ${fmt(w.travelM, 3)} m in it (the brake ${BRAKE_M} m at most), beats begun ${w.beats}, the doing kept ${w.same}, suspended '${w.why}', time held ${w.held} ticks`);
      console.log(`      after: the move running again ${resumedAt} tick(s) after the startle, time held ${held}, "Carry on" ${carry}; the bundle's end ${end ? `why ${end.why ?? 'none (it ran to its end)'}` : 'not seen'}; the lane ${r.done ? 'to the card' : 'NOT to the card'} in ${fmt(r.ms / 1000, 1)} s more`);
      assert(freezeMs >= 500 && w.ticks * TICK_MS >= freezeMs && w.travelM <= BRAKE_M && w.beats === 0 && w.same && w.why === 'startle' && w.held === 0
        && resumedAt !== null && resumedAt <= 2 && !held && !carry && end && !end.why && r.done, JSON.stringify({ freezeMs, w, resumedAt, held, carry, end, done: r.done }));
    },
  },
  {
    name: 'a window open when the startle comes pauses as ever once it is over: stop motion on the contact, the flow suspended on him, and no "stop after the beat" left in it',
    fn() {
      const { g, bot, n } = laneTo((game) => !!game.state.mind?.contact?.pending && !!game.state.stop?.doing?.beats);
      const s = g.state, pid = s.player.id, P = s.mind.contact.pending, d0 = s.stop.doing;
      addSupp(s, g.bus, pid, { ...STARTLE, atMs: s.clock.ms });
      const freezeMs = blockOf(s, pid).startleUntilMs - s.clock.ms, windowLeftMs = P.untilMs - s.clock.ms;
      const w = watchStartle(g, bot, pid, () => g.me(), () => s.stop?.doing ?? s.stop?.flow);
      let t = 0;
      while (t < 40 && !isHeld(s)) { g.step(1, bot); t++; }
      const S = s.stop, F = S?.flow;
      console.log(`      at ${fmt(n * TICK_MS / 1000, 2)} s from GO, ${d0.step} with a window on ${P.ids.join(', ')} (${fmt(windowLeftMs / 1000, 2)} s left): startled ${fmt(freezeMs / 1000, 2)} s, beats begun in it ${w.beats}, walked ${fmt(w.travelM, 3)} m; the pause ${t} tick(s) after: held ${isHeld(s)} [${s.clock.holds}], via ${S?.via}, the flow ${JSON.stringify(F?.suspended ?? null)}, stopAfter ${!!F?.stopAfter}, the last contact ${s.mind.contact.last?.id}`);
      assert(isHeld(s) && t <= 2 && S.via === 'contact' && F === d0 && F.suspended?.why === 'contact' && !F.stopAfter && !s.mind.contact.pending && s.mind.contact.last?.id === P.id && w.beats === 0 && w.travelM <= BRAKE_M,
        JSON.stringify({ t, held: isHeld(s), via: S?.via, flow: F?.suspended ?? null, stopAfter: F?.stopAfter ?? null, w }));
    },
  },
  {
    name: 'your #2 startled on his walk holds it where he stands, his body braking, and goes on at the startle\'s end (runSlot\'s head; fails without it: his walk runs on through the freeze)',
    fn() {
      const two = (game) => { const H = game.state.armoury.range.house; return H?.two?.pid ? game.state.actors.list.find(a => a.who === H.two.pid) : null; };
      const { g, bot, n } = laneTo((game) => !!runningMove(game.state.armoury.range.house?.two?.doing) && speedOf(two(game)) > 1.0);
      const s = g.state, W = s.armoury.range.house.two, d0 = W.doing, mv0 = runningMove(d0).key, v0 = speedOf(two(g));
      addSupp(s, g.bus, W.pid, { ...STARTLE, atMs: s.clock.ms });
      const freezeMs = blockOf(s, W.pid).startleUntilMs - s.clock.ms;
      const w = watchStartle(g, bot, W.pid, () => two(g), () => s.armoury.range.house.two.doing);
      let resumedAt = null;
      for (let k = 0; k < 4 && resumedAt === null; k++) { g.step(1, bot); if (W.doing === d0 && !d0.suspendAsk && !d0.suspended && runningMove(d0)) resumedAt = k + 1; }
      const r = runHouse(g, bot);
      console.log(`      at ${fmt(n * TICK_MS / 1000, 2)} s from GO, his ${d0.step} (${mv0}) at ${fmt(v0, 2)} m/s: startled ${fmt(freezeMs / 1000, 2)} s; walked ${fmt(w.travelM, 3)} m in it, beats begun ${w.beats}, his doing kept ${w.same}, held '${w.why}'; his move running again ${resumedAt} tick(s) after; the lane ${r.done ? 'to the card' : 'NOT to the card'}`);
      assert(freezeMs >= 500 && w.travelM <= BRAKE_M && w.beats === 0 && w.same && w.why === 'startle' && resumedAt !== null && resumedAt <= 2 && r.done, JSON.stringify({ freezeMs, w, resumedAt, done: r.done }));
    },
  },
];
