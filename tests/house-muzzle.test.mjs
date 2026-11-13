// OLYMPUS tests: the muzzle over the #2 in the shoot house: low ready and high ready pass over him, the aim flags him; and T's carry on brings the rifle up before it walks (the user, 2026-11-11: "tier one operator automatically goes low ready when sweeping their partner (which is good) but we still get flagged a fault for muzzle").
//
// One rule, carry.js flagsAt, read by the house's fault (shoothouse.js, "Muzzle!" after FLAG_MS 300 ms on a #2 standing
// still) and by the DI's cqb-flag: the rifle in the hands and in neither SWEEP_SAFE posture (high ready, low ready), the
// muzzle's 3-D line out FLAG_REACH_M 5 m passing within FLAG_BODY_R_M 0.3 m of the #2's body, floor to head (COMBAT
// §25.19.3.5: from 2026-11-12; in plan only before, so a level aim over a kneeling #2 flagged him). Before 2026-11-11 only high ready passed,
// and the tier one by T walked out of room 2 still aimed (bundle.js carryPlan asked for the muzzle up only where the rest
// held no posture beat, and a lane's rest holds the next room's own high ready, at 60% of the approach): drawn at low
// ready (poses.js draws an aimed walk so), held aimed by the sim, the fault 350 ms before the rifle came up (the bugs
// auditor: 6 of 20 T and house-bot lanes, the Raider on 4 of 5 seeds, the tier one on the user's seed 1489397426).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseTBot, runHouse } from './bots/house.mjs';
import { houseNow, FLAG_MS, FLAG_BODY_R_M, FLAG_REACH_M } from '../src/sim/scenarios/shoothouse.js';
import { chooseStep } from '../src/sim/arms/shooting.js';
import { CQB_RULES } from '../src/sim/skills/instinct/cqb.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { SWEEP_SAFE, flagsAt, muzzleOf, SPAN_M } from '../src/sim/arms/carry.js';
import { TICK_MS } from '../src/core/clock.js';

const muzzleFaults = (state) => houseNow(state).legs.flatMap(L => L.faults.filter(f => f.kind === 'muzzle').map(f => ({ room: L.word, atMs: f.atMs })));

/** The tier one 1.5 m behind his #2 on room 1's stack, the muzzle's line through him, held in a posture for 2 s: { faults, diTicks }. */
function sweep(posture, { tier = 'tierone', seed = 48213, stance = 'stand' } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), s = g.state, pid = s.player.id, H = s.armoury.range.house;
  const P = lanePlanOf(s).plans['o:w4:r1'], me = s.actors.list.find(a => a.who === pid), two = s.actors.list.find(a => a.who === H.two.pid);
  chooseStep(s, g.bus, { step: 'leave' });
  // (the #2 on his stack, standing still: his slot starts nothing there with you outside the room; you behind him, facing him)
  const place = (a, x, z) => { a.x = x; a.z = z; const post = s.people[a.who]?.post; if (post) { post.x = x; post.z = z; } };
  place(two, P.stack[1][0], P.stack[1][1]);
  place(me, P.stack[1][0] - 1.5, P.stack[1][1]);
  const flag = CQB_RULES.find(r => r.id === 'cqb-flag');
  let diTicks = 0;
  for (let i = 0; i < 2000 / TICK_MS; i++) {
    s.people[pid].kit.carry.posture = posture; me.headRad = 0; me.face = 'right'; two.stance = stance;
    g.step(1, {});
    if (flag.when(s, s.actors.list.find(a => a.who === pid), s.clock.ms)) diTicks++;
  }
  return { faults: muzzleFaults(s).length, diTicks, two: [two.x, two.z] };
}

export default [
  {
    name: 'a muzzle at low ready or high ready over the #2 standing still is no fault and no "Muzzle!" from the DI; aimed through him it is both, after FLAG_MS (the user, 2026-11-11: "goes low ready when sweeping their partner (which is good) but we still get flagged a fault for muzzle")',
    fn() {
      const out = {};
      for (const posture of ['lowReady', 'highReady', 'aimed']) out[posture] = sweep(posture);
      console.log(`      2 s with the line through him 1.5 m ahead: ${Object.entries(out).map(([k, v]) => `${k} ${v.faults} fault(s), the DI's line ${v.diTicks} of 40 ticks`).join('; ')}; the postures that pass over him: ${[...SWEEP_SAFE].join(', ')}; the fault after ${FLAG_MS} ms`);
      assert(!out.lowReady.faults && !out.lowReady.diTicks && !out.highReady.faults && !out.highReady.diTicks && out.aimed.faults === 1 && out.aimed.diTicks === 40, JSON.stringify(out));
    },
  },
  {
    name: 'the flag is the muzzle\'s 3-D line against the #2\'s body as a capsule (COMBAT §25.19.3.5): aimed level 1.5 m behind a #2 kneeling or prone is no fault and no "Muzzle!" (the line passes over his head), standing it is both; the one helper read by the fault and the DI',
    fn() {
      const out = {};
      for (const stance of ['stand', 'kneel', 'prone']) out[stance] = sweep('aimed', { stance });
      console.log(`      aimed level for 2 s, the #2 1.5 m ahead: ${Object.entries(out).map(([k, v]) => `${k} (his head at ${SPAN_M[k][1]} m) ${v.faults} fault(s), the DI's line ${v.diTicks} of 40 ticks`).join('; ')}; the capsule ${FLAG_BODY_R_M} m, the line ${FLAG_REACH_M} m, held ${FLAG_MS} ms`);
      assert(out.stand.faults === 1 && out.stand.diTicks === 40 && !out.kneel.faults && !out.kneel.diTicks && !out.prone.faults && !out.prone.diTicks, JSON.stringify(out));
    },
  },
  {
    name: 'flagsAt in three dimensions: the line through the body\'s height flags, past FLAG_BODY_R_M beside it or over the head it does not, nor behind the holder or past FLAG_REACH_M; a kneeling holder\'s aim meets a standing man\'s chest; high ready, low ready and a slung rifle never flag',
    fn() {
      const m = (over = {}) => ({ inHand: true, posture: 'aimed', ox: 0, oz: 0, oy: 1.4, yawRad: 0, pitchRad: 0, ...over });
      const cases = [
        ['through the chest 1.5 m ahead', flagsAt(m(), 1.5, 0), true],
        ['0.29 m beside him', flagsAt(m(), 1.5, 0.29), true],
        ['0.31 m beside him', flagsAt(m(), 1.5, 0.31), false],
        ['over a kneeling man (head 1.0 m)', flagsAt(m(), 1.5, 0, 'kneel'), false],
        ['a kneeling holder (0.95 m) at a standing man', flagsAt(m({ oy: 0.95 }), 1.5, 0), true],
        ['behind the holder', flagsAt(m(), -1.5, 0), false],
        ['4.9 m ahead', flagsAt(m(), 4.9, 0), true],
        ['5.4 m ahead', flagsAt(m(), 5.4, 0), false],
        ['pitched 30° up, 1.5 m ahead (the line at 2.27 m)', flagsAt(m({ pitchRad: Math.PI / 6 }), 1.5, 0), false],
        ['pitched 30° down, 2.0 m ahead (the line at 0.25 m)', flagsAt(m({ pitchRad: -Math.PI / 6 }), 2.0, 0), true],
        ['high ready through him', flagsAt(m({ posture: 'highReady' }), 1.5, 0), false],
        ['low ready through him', flagsAt(m({ posture: 'lowReady' }), 1.5, 0), false],
        ['slung', flagsAt(m({ inHand: false, posture: 'slungFront' }), 1.5, 0), false],
      ];
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), real = muzzleOf(g.state, g.state.player.id);
      console.log(`      ${cases.map(([w, got]) => `${w} ${got}`).join('; ')}; the player's muzzle at GO: ${real.posture}, its line at ${real.oy} m`);
      const bad = cases.filter(([, got, want]) => got !== want).map(([w, got]) => `${w}: ${got}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'by T alone, the carry on that starts at the aim brings the muzzle up before it walks: the tier one on the user\'s seed 1489397426 and the Raider on 48213, 7 and 5 take no muzzle fault on their #2 and reach the card (each faulted in room 3 before 2026-11-11)',
    timeoutMs: 180_000,
    fn() {
      const out = [];
      for (const [tier, seed] of [['tierone', 1489397426], ['raider', 48213], ['raider', 7], ['raider', 5]]) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), pid = g.state.player.id, firsts = [];
        // (the posture the tick before: the carry's own first beat raises the rifle as it starts)
        let was = null;
        const r = runHouse(g, houseTBot(), { maxMs: 12 * 60_000, each: (game) => {
          const s = game.state;
          // (2026-11-12, R3: the flow taken up by itself after a shot row ('resume') counts as a carry: the rifle up first)
          for (const f of game.facts('bundle')) if (((f.phase === 'start' && f.id === 'drill:carry') || f.phase === 'resume') && f.who === pid && was === 'aimed') firsts.push(s.stop?.doing?.beats?.[0]?.key ?? null);
          was = s.people[pid].kit.carry.posture;
        } });
        const N = houseNow(g.state);
        out.push({ tier, seed, done: r.done && N.end?.why === 'clear', muzzle: muzzleFaults(g.state), aimedCarries: firsts.length, upFirst: firsts.every(k => /(^|:)up(\.\d+)?$/.test(k ?? '')), card: N.summary });
      }
      for (const o of out) console.log(`      ${o.tier} ${o.seed}: muzzle faults ${o.muzzle.length}; carries begun aimed ${o.aimedCarries}, each with the muzzle up first ${o.upFirst}; ${o.card}`);
      assert(out.every(o => o.done && !o.muzzle.length && o.upFirst) && out.some(o => o.aimedCarries), JSON.stringify(out.map(o => ({ tier: o.tier, seed: o.seed, done: o.done, muzzle: o.muzzle, upFirst: o.upFirst }))));
    },
  },
];
