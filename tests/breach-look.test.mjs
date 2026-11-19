// OLYMPUS tests: breach-look, F143's sim half (the build sheet v0.0.26 items 6 and 8, §3.3, §6 C, §8 F143): seen, never told.
//
// A role-player the bang startles, stuns or blinds is DAZED, one whose nerve fails COWERING (COMBAT §7.11), and the player reads it
// three ways: the stage's frame (render/view.js through look.js gunLook and poses.js rifleFrame: the shock band's daze or cower), the
// target card's pose (seen.js seenOf: 'daze' or 'cower', what art/doll draws) and the plaque's word (an identification's, men.js
// liveStateOf through STATE_WORDS), with A's opfor.js opforLook beside them. tests/breach-look.mjs reads each side by its own reader
// and the sim's own class by a fifth (the man's live record and supp.js's shock, not liveStateOf), and at every tick of each lane every
// side agrees with item 6's one map (agree: the daze and the cower across all five, down across the four that draw it). The daze is
// drawn exactly while his block says so: a hand-set flash-blindness on a bare live state read a millisecond before its end and at it.
// The lanes: the live lane with the G-11 issued (the sergeant by T with the kit bot's bang at each door, 48213: room 2's man flashed
// into the daze) and without it (the live lane's quick cell); a hand-set freeze and shock on room 2's man (the cower in every stance,
// the shock over the freeze, down over the shock, the give over the shock); the daze's sway (1.5 Hz on the game's clock, still under
// "reduce flashes"). Prints the ticks a class, the frames drawn and the disagreements. Quick. Fails without the shock band's frames,
// gunLook's shock, the record's daze and cower, or STATE_WORDS.dazed. The review of B and C (2026-11-19) adds the warm set: every
// frame whose card record fixes its pose and hold (the daze standing and kneeling, the cower, the hands) is in target.js WARM_HOLDS,
// every pose a role-player takes is warmed, and the dolls warm() paints for the scene's two men and your #2 fit DOLL_LRU (red with the
// daze holds left out, or the cache at its old 48: until then only the heavy ui-breach saw either).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseTBot } from './bots/house.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { liveGame, rp, rpActor, rpScript } from './opfor-world.mjs';
import { mapOf, agree } from './breach-look.mjs';
import { breachBot } from './breach-lanes.mjs';
import { dazeSway, DAZE_SWAY_HZ } from '../src/art/figures/poses.js';
import { opforLook } from '../src/sim/scenarios/opfor.js';
import { WARM_HOLDS, WARM_NEAR, WARM_TWO } from '../src/ui/hud/target.js';
import { DOLL_LRU } from '../src/art/doll/dress.js';
import { HIT_BANDS } from '../src/art/doll/hitcard.js';
import { FRAME_SEEN, POSES } from '../src/data/portrait.js';

// (a lane's every tick: each live man's map, tallied; the first disagreements kept)
function laneLook(name, g, bot) {
  const tally = {}, frames = {}, off = [];
  let n = 0;
  runHouse(g, bot, { maxMs: 12 * 60_000, each: (gm) => {
    const s = gm.state, ms = s.clock.ms, looks = opforLook(s, ms);
    for (const T of s.armoury.range.turners) {
      if (!T.live || !s.actors.list.some(a => a.who === T.live.who)) continue;
      const m = mapOf(s, T, ms, { looks });
      n++; tally[m.oracle] = (tally[m.oracle] ?? 0) + 1;
      if (m.oracle === 'dazed' || m.oracle === 'cowering') frames[m.frames.stage] = (frames[m.frames.stage] ?? 0) + 1;
      if (!agree(m) && off.length < 6) off.push({ tick: s.clock.tick, ...m });
    }
  } });
  return { name, done: !!g.state.armoury.range.end, n, tally, frames, off };
}
const line = (r) => `${r.name}: ${r.done ? 'to the card' : 'NOT to the card'}, ${r.n} man-ticks (${Object.entries(r.tally).map(([k, v]) => `${k} ${v}`).join(', ')}); drawn in the shock ${Object.entries(r.frames).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}; ${r.off.length} disagreeing`;

// ("Bang, then go"'s lane: B's honest player (tests/breach-lanes.mjs breachBot 'auto': the bang thrown at the door where drawn), from GO)
const sceneLane = (tier, code, seed = 48213) => laneLook(`"Bang, then go", the ${tier}, ${code}, ${seed}`, createGame({ scenario: 'test-shoothouse', seed, tier, breach: code, setup: 'go' }), breachBot('auto', { tier, seed, code }));
/** The scene's lanes (the pins' four: breach-pin's), quick the first and the last, heavy all four. */
const SCENE_LANES = Object.freeze([['sgt', 'bang,held'], ['private', 'bang,held'], ['sgt', 'quiet,loose'], ['private', 'quiet,loose']]);

export default [
  {
    name: 'F143 (sim): on "Bang, then go" (the sergeant on the bang and the held door, the private on the quiet loose door, 48213, by B\'s honest player), at every tick each role-player\'s stage frame, opforLook\'s, the card\'s pose and the plaque\'s word agree with the sim\'s one map, and the daze is drawn on the bang\'s lane',
    timeoutMs: 120_000,
    fn() {
      const rows = [SCENE_LANES[0], SCENE_LANES[3]].map(([tier, code]) => sceneLane(tier, code));
      for (const r of rows) console.log(`      ${line(r)}`);
      assert(rows.every(r => r.done && !r.off.length), JSON.stringify(rows.map(r => r.off.slice(0, 2))));
      assert((rows[0].tally.dazed ?? 0) > 0 && Object.keys(rows[0].frames).some(f => f.startsWith('daze')), 'nobody dazed on the bang\'s lane');
    },
  },
  {
    name: 'F143 (sim, heavy): the same map at every tick of "Bang, then go"\'s four pinned lanes (the private and the sergeant, the bang and the held door, the quiet loose door, 48213) and its other two draws by the sergeant',
    heavy: true,
    timeoutMs: 300_000,
    fn() {
      const rows = [...SCENE_LANES, ['sgt', 'bang,loose'], ['sgt', 'quiet,held']].map(([tier, code]) => sceneLane(tier, code));
      for (const r of rows) console.log(`      ${line(r)}`);
      assert(rows.every(r => r.done && !r.off.length), JSON.stringify(rows.map(r => r.off.slice(0, 2))));
    },
  },
  {
    name: 'F143 (sim): in A\'s scripted room 1 (rpScript: six rooms, the bang or none, held or loose, a friend down, the room pressed, so the men daze, freeze and cover by the table), at every tick each man\'s stage frame, opforLook\'s, the card\'s pose and the plaque\'s word agree with the one map, the cower drawn',
    fn() {
      const tally = {}, frames = {}, off = [];
      const CASES = [{ seed: 48213, held: 'loose', bang: true, p: [30, 40] }, { seed: 48213, held: 'held', bang: true, p: [45, 20] }, { seed: 7, held: 'loose', bang: true, p: [20, 50] },
        { seed: 7, held: 'held', bang: false, p: [60, 30] }, { seed: 11, held: 'loose', bang: true, p: [35, 35] }, { seed: 19, held: 'loose', bang: false, p: [70, 10] }];
      let n = 0;
      for (const c of CASES) {
        const h = rpScript({ seed: c.seed, held: c.held }), s = h.s;
        const watch = () => {
          const ms = s.clock.ms, looks = opforLook(s, ms);
          for (const st of ['1a', '1b']) {
            const T = h.man(st), m = mapOf(s, T, ms, { looks });
            n++; tally[m.oracle] = (tally[m.oracle] ?? 0) + 1;
            if (m.oracle === 'dazed' || m.oracle === 'cowering') frames[m.frames.stage] = (frames[m.frames.stage] ?? 0) + 1;
            if (!agree(m) && off.length < 6) off.push({ c, st, ...m });
          }
        };
        const run = (ms) => { const t0 = s.clock.ms; while (s.clock.ms < t0 + ms) { h.g.step(1, h.LEAVE); watch(); } };
        h.open(); run(2500);
        if (c.bang) h.bang();
        run(1500);
        h.down('1a'); watch();
        h.press('1b', c.p[0]); run(5000);
        h.press('1b', c.p[1]); run(5000);
      }
      console.log(`      ${CASES.length} scripted rooms, ${n} man-ticks (${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(', ')}); drawn in the shock ${Object.entries(frames).map(([k, v]) => `${k} ${v}`).join(', ')}; ${off.length} disagreeing`);
      assert(!off.length, JSON.stringify(off.slice(0, 3)));
      assert((tally.dazed ?? 0) > 0 && (tally.cowering ?? 0) > 0 && frames.cower > 0, JSON.stringify({ tally, frames }));
    },
  },
  {
    name: 'F143 (sim, heavy): on the live lane with the bang, every tick a role-player is in, the stage\'s frame, opforLook\'s, the card\'s pose and the plaque\'s word agree with the sim\'s one map (the daze while shocked, down, the cower), and the daze is drawn',
    heavy: true,
    timeoutMs: 120_000,
    fn() {
      const r = laneLook('the live lane, the sergeant by T, the G-11 at each door, 48213', createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,hide', loadout: 'flash' }), houseKitBot({ use: 'flash', base: 'T' }));
      console.log(`      ${line(r)}`);
      assert(r.done && !r.off.length, JSON.stringify(r.off.slice(0, 3)));
      assert((r.tally.dazed ?? 0) > 0 && Object.keys(r.frames).some(f => f.startsWith('daze')), 'nobody dazed on the lane: the bang\'s window is not drawn');
    },
  },
  {
    name: 'F143 (sim, heavy): on the live lane\'s quick cell (no bang) the same map holds at every tick, so the live lane draws a startled man dazed and nothing else changes',
    heavy: true,
    timeoutMs: 120_000,
    fn() {
      const r = laneLook('the live lane\'s quick cell, the sergeant by T, live:fight,hide, 48213', createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,hide' }), houseTBot());
      console.log(`      ${line(r)}`);
      assert(r.done && !r.off.length, JSON.stringify(r.off.slice(0, 3)));
    },
  },
  {
    name: 'the warm set (target.js warm at the load): every frame whose card record fixes its pose and hold (FRAME_SEEN: daze, dazeKneel, cower, hands, kneel) is in WARM_HOLDS, every pose a role-player takes is warmed, and the dolls painted for the scene\'s two men and your #2 fit dress.js DOLL_LRU, so none is painted when a man first dazes or cowers (the review of B and C, 2026-11-19: only the heavy ui-breach held either)',
    fn() {
      const has = (how, pose) => WARM_HOLDS.some(([h, p]) => h === how && p === pose);
      const fixed = Object.entries(FRAME_SEEN).filter(([, F]) => F.pose && F.how), missing = fixed.filter(([, F]) => !has(F.how, F.pose)).map(([f, F]) => `${f} (${F.how}, ${F.pose})`);
      // (a role-player's poses: every pose of the record but the line's prone)
      const poses = POSES.filter(p => p !== 'prone'), unwarmed = poses.filter(p => !WARM_HOLDS.some(([, q]) => q === p));
      const bands = HIT_BANDS.filter(b => b.maxM <= 25).length, men = 2, dolls = WARM_HOLDS.length * bands * men + WARM_NEAR.length * men + WARM_TWO.length * bands;
      console.log(`      the fixed frames: ${fixed.map(([f, F]) => `${f} ${F.how}/${F.pose}`).join(', ')}; missing ${missing.length}; the poses warmed: ${poses.join(', ')} (unwarmed ${unwarmed.length}); dolls at the load ${WARM_HOLDS.length} holds × ${bands} bands × ${men} men + ${WARM_NEAR.length} × ${men} aimed away + ${WARM_TWO.length} × ${bands} your #2 = ${dolls}, DOLL_LRU ${DOLL_LRU}`);
      assert(!missing.length && !unwarmed.length && ['daze', 'dazeKneel', 'cower'].every(f => fixed.some(([g]) => g === f)), JSON.stringify({ missing, unwarmed }));
      assert(dolls <= DOLL_LRU, `the warm set ${dolls} dolls over DOLL_LRU ${DOLL_LRU}: the first evicted before the lane`);
    },
  },
  {
    name: 'the daze exactly while his block says so, and the precedence: flash-blind to a millisecond before its end DAZED on every side, at its end not; frozen COWERING kneeling or standing; the shock over the freeze; down and the give over the shock',
    fn() {
      const { g, s } = liveGame({ setup: 'room:2' }), T = rp(g, '2a'), a = rpActor(g, '2a'), now = s.clock.ms, rows = [];
      assert(T && a, 'room 2\'s role-player');
      const at = (label, ms, want) => { const m = mapOf(s, T, ms); rows.push(`${label}: ${m.frames.stage} / ${m.frames.look} / ${m.frames.pose} ${m.frames.how} / ${m.frames.word}`); assert(m.oracle === want && agree(m), JSON.stringify({ label, want, ...m })); };
      at('at the fill', now, 'other');
      const end = now + 1500;
      a.combat = { ...(a.combat ?? {}), blindUntilMs: end };
      at('flash-blind', now, 'dazed');
      at('a millisecond before its end', end - 1, 'dazed');
      at('at its end', end, 'other');
      const st0 = T.live.st, stance0 = a.stance;
      T.live.st = 'freeze'; a.stance = 'kneel';
      at('frozen on his knee, blind', now, 'dazed');
      at('frozen on his knee', end, 'cowering');
      delete a.stance;
      at('frozen standing', end, 'cowering');
      a.stance = 'kneel'; T.live.st = st0;
      at('blind on his knee', now, 'dazed');
      if (stance0 === undefined) delete a.stance; else a.stance = stance0;
      T.live.give = { atMs: now, dropAtMs: now + 600 };
      at('giving, blind', now, 'hands');
      delete T.live.give;
      T.live.st = 'down'; a.posture = 'sit';
      at('down, blind', now, 'down');
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'the daze\'s sway: a pixel down for half of each cycle at DAZE_SWAY_HZ on the game\'s clock (so stop motion holds it), held on daze0 under "reduce flashes", never on another frame',
    fn() {
      const seen = {}, cycleMs = 1000 / DAZE_SWAY_HZ;
      let flips = 0, last = null;
      for (let ms = 0; ms < 2000; ms += 10) { const f = dazeSway('daze0', ms); seen[f] = (seen[f] ?? 0) + 1; if (last && f !== last) flips++; last = f; }
      console.log(`      over 2 s: ${Object.entries(seen).map(([k, v]) => `${k} ${v * 10} ms`).join(', ')}, ${flips} changes (a cycle ${cycleMs.toFixed(1)} ms); still: ${dazeSway('daze0', 400, true)}; kneeling ${dazeSway('dazeKneel0', 400)}; the cower ${dazeSway('cower', 400)}`);
      assert(seen.daze0 > 0 && seen.daze1 > 0 && Math.abs(seen.daze0 - seen.daze1) <= 2 && flips === 5, JSON.stringify({ seen, flips }));
      assert(dazeSway('daze0', 400, true) === 'daze0' && dazeSway('dazeKneel0', 400) === 'dazeKneel1' && dazeSway('cower', 400) === 'cower' && dazeSway('lowReady', 400) === 'lowReady', 'the sway\'s frames');
    },
  },
];
