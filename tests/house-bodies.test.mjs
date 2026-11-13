// OLYMPUS tests: the bodies fed to the view (the shoot house rework's stage R2; BODY §16.8, VIEWS §3.10.1, COMBAT §25.19.8 F19).
//
// The user, scoring v0.0.12 (2026-11-11): "saying that the walking about is goofy is an understatement, the animation is
// really not there yet." The audit found the #2 never animated (idle on all 496 of his moving ticks, his drawn place a 20 Hz
// sawtooth), the stops cut (0.8 m/s to 0 in a tick, 8 times for you and 9 for the #2 in a lane) and the aim walked at the
// low ready. These hold the sim's side of the cure, each failing without it:
//   - the gait phase's steps (src/sim/body/loco.js stepMOf on src/data/body/gait.js's table, cycle B until the user's
//     score): VIEWS §3.10.4's numbers, the cadence by gravity walked by the keys at 1 G, on Mars and on Europa, the phase
//     kept across a band change;
//   - every mover's record over a lane by T (the player, the #2, the instructor): drawn walking on every tick it moves,
//     the tween's start where it stood at the tick's start, its stride and its gait phase advanced, its yaw written;
//   - the brake, never the cut: no mover's speed falls more than 1.5 m/s in a tick (BODY §16.8), its speed record never
//     faster than the floor's grip allows, and no body keeps a speed it does not move at; a halted #2 brakes to a stop
//     over v² / 2a;
//   - the aim drawn as an aim: no tick walked aimed is painted at the low ready (v0.0.12: 333 a lane);
//   - the stance pool: the frames a gait carry never changes paint the same from every carry's sheet (the view draws
//     them from a sibling's: render/figures.js sibs), the gait's do not (each carry's sheet is painted before GO).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseTBot, houseHonestBot, houseKeysBot, runHouse } from './bots/house.mjs';
import { stepMOf, locoStep, turnSOf } from '../src/sim/body/loco.js';
import { STEP_PX, STEP_PPM, CYCLE, GP_WRAP } from '../src/data/body/gait.js';
import { gaitSpeeds } from '../src/sim/body/motion.js';
import { gravityAt } from '../src/sim/places/env.js';
import { figureOf } from '../src/sim/people/figure.js';
import { gunLook } from '../src/sim/arms/look.js';
import { gaitCarryOf, GAIT_CARRIES, CARRY_FREE_BANDS, BANDS } from '../src/art/figures/poses.js';
import { paintBand } from '../src/art/figures/atlas.js';
import { halt as haltDoing } from '../src/sim/combat/stepper.js';
import { legsOf } from '../src/sim/combat/bundle.js';
import { createHash } from 'node:crypto';

const G0 = 9.80665, TICK_S = 0.05;
/** The steepest a speed record may fall in a tick: the floor's grip at 1 G (μ 0.6, BODY §16.2) and a rounding's room (m/s). */
export const GRIP_DROP_MS = 0.6 * G0 * TICK_S + 0.03;
/** BODY §16.8's test: no speed drop over this in one tick (m/s), a hit or a fall excepted. */
export const DROP_MAX_MS = 1.5;

// (a lane watched tick by tick, every mover: { me, two, chief } each { moving, idle, figIdle, tween, gp, yaw, stride, drop, worstDrop, grip, worstGrip, stale }, aimed walks)
function watchLane(tier, seed, bot, { record = true } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' }), H0 = g.state.armoury.range.house;
  const who = { me: g.state.player.id, two: H0.twoPid, chief: H0.chiefPid };
  const W = Object.fromEntries(Object.keys(who).map(k => [k, { moving: 0, idle: 0, figIdle: 0, tween: 0, gp: 0, yaw: 0, stride: 0, drop: 0, worstDrop: 0, grip: 0, worstGrip: 0, stale: 0, prev: null, v: null, rec: null, still: 0 }]));
  const aim = { walked: 0, low: 0 };
  let prevMs = g.state.clock.ms;
  runHouse(g, bot, { maxMs: 12 * 60_000, each: (game) => {
    // (a fast-forward's ticks are lived, but the scene's layer sits them out (the #2 and the instructor stand): not watched)
    const st = game.state, now = st.clock.ms, live = now !== prevMs && !st.skip;
    prevMs = now;
    for (const [k, pid] of Object.entries(who)) {
      const a = st.actors.list.find(x => x.who === pid), w = W[k];
      if (!a) continue;
      if (live && w.prev) {
        const d = Math.hypot(a.x - w.prev.x, a.z - w.prev.z), v = d / TICK_S, rec = Math.hypot(a.v?.[0] ?? 0, a.v?.[1] ?? 0);
        // (a jump of more than the view's JUMP_M 1.5 m is a placement, drawn as one: the instructor onto his catwalk)
        if (d > 1e-6 && d < 1.5) {
          w.moving++;
          if ((a.gait ?? 'idle') === 'idle') w.idle++;
          const f = figureOf(st, a, now);
          if (f.gait === 'idle') w.figIdle++;
          if (Math.hypot((a.$px ?? a.x) - w.prev.x, (a.$pz ?? a.z) - w.prev.z) > 1e-6) w.tween++;
          if (Math.abs((((a.gp ?? 0) - (w.prev.gp ?? 0)) % GP_WRAP + GP_WRAP) % GP_WRAP) < 1e-9) w.gp++;
          if (!Number.isFinite(a.bodyRad)) w.yaw++;
          if (Math.abs((((a.strideM ?? 0) - (w.prev.strideM ?? 0)) + 201.6) % 201.6) < 1e-9) w.stride++;
        }
        if (w.v !== null && d < 1.5) {
          const drop = w.v - v;
          if (drop > DROP_MAX_MS) w.drop++;
          w.worstDrop = Math.max(w.worstDrop, drop);
        }
        if (w.rec !== null && record) {
          const fall = w.rec - rec;
          if (fall > GRIP_DROP_MS) w.grip++;
          w.worstGrip = Math.max(w.worstGrip, fall);
        }
        // (a body that keeps a speed it does not move at: two live ticks still with a speed record over 0.05 m/s)
        w.still = d < 1e-6 && rec > 0.05 ? w.still + 1 : 0;
        if (w.still === 2) w.stale++;
        w.v = d < 1.5 ? v : null; w.rec = rec;
      }
      if (live || !w.prev) w.prev = { x: a.x, z: a.z, gp: a.gp, strideM: a.strideM };
      if (st.skip) { w.prev = null; w.v = null; w.rec = null; w.still = 0; }
      // (the aim walked: the carry the view paints the gait with is the posture held)
      if (live && k !== 'chief' && (a.gait ?? 'idle') !== 'idle') {
        const gl = gunLook(st, a, now);
        if (gl?.carry === 'aim') { aim.walked++; if (gaitCarryOf(gl.carry) === 'low') aim.low++; }
      }
    }
  } });
  for (const w of Object.values(W)) { delete w.prev; delete w.v; delete w.rec; delete w.still; }
  return { W, aim, end: g.state.armoury.range.house.end?.why ?? null };
}

export default [
  {
    name: 'the gait phase\'s steps (BODY §16.8, VIEWS §3.10.4, cycle B until the user\'s score): the planted travel and the flight from the gravity, Combat slower-legged than Assault at 1 G, the 1 G run 3.0 to 4.0 steps a second; walked by the keys on open ground at 1 G, on Mars and on Europa, each stance\'s steps a second printed; a band change keeps the phase',
    fn() {
      const legM = 0.53 * 1.75, rows = [], walked = [];
      // (the table: VIEWS §3.10.4's B column, step metres, from the speeds as built)
      const want = { '1|combat': 0.38, '1|assault': 0.44, '1|walk': 0.38, '1|run': 1.10, 'mars|combat': 0.38, 'mars|assault': 0.87, 'mars|run': 1.74, 'europa|walk': 1.05, 'europa|run': 3.14 };
      const gOf = { 1: 1, mars: 3.73 / 9.81, europa: 1.31 / 9.81 };
      for (const [key, m] of Object.entries(want)) {
        const [place, band] = key.split('|'), gG = gOf[place], sp = gaitSpeeds({ gG, gait: band === 'combat' || band === 'assault' ? band : 'relaxed' });
        const v = band === 'run' ? sp.runMs : sp.walkMs, s = stepMOf({ gait: band === 'run' ? 'run' : 'walk', stance: band === 'walk' || band === 'run' ? null : band, vMs: v, gMs2: gG * 9.81, legM });
        rows.push(`${key} ${fmt(v, 2)} m/s: step ${fmt(s.stepM, 2)} m (want ${m}), flight ${Math.round(s.flight * 1000)} ms, ${fmt(v / s.stepM, 1)} steps/s`);
        assert(Math.abs(s.stepM - m) <= 0.011, JSON.stringify({ key, s, m }));
      }
      // (the keys on Echo's street, each stance for 2 s after 1.5 s to speed, at three gravities)
      const cad = {};
      for (const env of ['earth-temperate', 'melas-ground', 'europa-surface']) for (const st of ['relaxed', 'combat', 'assault', 'run']) {
        const g = createGame({ scenario: 'barracks', seed: 48213, hour: 10, env });
        g.step(1, { act: ['debug:go:melas.ground:522:224:right'] }); g.step(5);
        const me = g.me();
        if (st === 'combat' || st === 'assault') me.moveStance = st;
        const input = st === 'run' ? { mx: 1, run: true } : { mx: 1 };
        g.step(30, input);
        let steps = 0;
        const x0 = me.x;
        for (let i = 0; i < 40; i++) { const b = me.gp ?? 0; g.step(1, input); steps += (((me.gp ?? 0) - b) % GP_WRAP + GP_WRAP) % GP_WRAP; }
        cad[`${env}|${st}`] = steps / 2;
        walked.push(`${env} (${fmt(gravityAt(g.state).gG, 2)} G) ${st}: ${fmt((me.x - x0) / 2, 2)} m/s, ${fmt(steps / 2, 2)} steps/s, ${me.gait}`);
      }
      // (the band's change keeps the phase: Combat then Assault, the same foot forward)
      const a = { x: 0, z: 0, gp: 0.6, moveStance: 'combat' };
      a.x = 0.1; locoStep(a, 0, 0, { stance: 'combat', vMs: 1.23 });
      const g1 = a.gp; a.x = 0.2; locoStep(a, 0.1, 0, { stance: 'assault', vMs: 2.03 });
      for (const r of rows) console.log(`      ${r}`);
      for (const r of walked) console.log(`      walked: ${r}`);
      console.log(`      a band change: gp 0.6 → ${fmt(g1, 4)} (Combat, 0.1 m) → ${fmt(a.gp, 4)} (Assault, 0.1 m); cycle ${CYCLE}, STEP_PX ${JSON.stringify(STEP_PX[CYCLE])} at ${STEP_PPM} px/m; the body's turn 90° in ${fmt(turnSOf(1), 2)} s at pace 1, ${fmt(turnSOf(0.45), 2)} s at the fastest`);
      assert(Math.abs(g1 - (0.6 + 0.1 / 0.375)) < 1e-5 && Math.abs(a.gp - (g1 + 0.1 / 0.4375)) < 1e-5, JSON.stringify({ g1, gp: a.gp }));
      assert(cad['earth-temperate|combat'] < cad['earth-temperate|assault'], JSON.stringify(cad));
      assert(cad['earth-temperate|run'] >= 3.0 && cad['earth-temperate|run'] <= 4.0, JSON.stringify(cad));
      assert(cad['melas-ground|run'] < cad['earth-temperate|run'] * 0.6 && cad['europa-surface|run'] < cad['melas-ground|run'], JSON.stringify(cad));
    },
  },
  {
    name: 'every mover reports the locomotion record (BODY §16.8; COMBAT §25.19.8 F19): over the tier one\'s lane by T on 48213, you, the #2 and the instructor are drawn walking on every tick they move (the sim\'s gait and figureOf\'s), the tween starts where each stood at the tick\'s start, and each tick moved advances the stride and the gait phase and writes the body\'s yaw (v0.0.12: the #2 idle on all 496 of his moving ticks)',
    timeoutMs: 120_000,
    fn() {
      const { W, end } = watchLane('tierone', 48213, houseTBot());
      for (const [k, w] of Object.entries(W)) console.log(`      ${k.padEnd(5)} ${w.moving} moving ticks: idle ${w.idle}, drawn idle ${w.figIdle}, tween start wrong ${w.tween}, gait phase still ${w.gp}, stride still ${w.stride}, no yaw ${w.yaw}`);
      console.log(`      the lane ended ${end}`);
      for (const [k, w] of Object.entries(W)) assert(w.moving > 100 && !w.idle && !w.figIdle && !w.tween && !w.gp && !w.stride && !w.yaw, JSON.stringify({ k, w }));
    },
  },
  {
    name: 'the brake, never the cut (BODY §16.2, §16.8): by T and by the honest bot for the tier one and by the keys for the private on 48213, no mover\'s speed falls more than 1.5 m/s in a tick, its speed record never faster than the floor\'s grip allows (0.6 g a tick), and no body stands keeping a speed (v0.0.13: 2.03 m/s to 0 and back at each change of row, 7 times a lane; the #2 stopped dead at every contact)',
    timeoutMs: 180_000,
    fn() {
      // (the keys' record is the body's push and brake against the keys, and a wall stops what it does not travel (move.js
      // inertStep): only the 1.5 m/s rule and the standing speed are held for them; the drill's moves are held to the grip too)
      const runs = [['tierone T', 'tierone', houseTBot(), true], ['tierone honest', 'tierone', houseHonestBot(), true], ['private keys', 'private', houseKeysBot(), false]];
      const bad = [];
      for (const [label, tier, bot, record] of runs) {
        const { W } = watchLane(tier, 48213, bot, { record });
        console.log(`      ${label}: ${Object.entries(W).map(([k, w]) => `${k} worst drop ${fmt(w.worstDrop, 2)} m/s (${w.drop} over ${DROP_MAX_MS}), record ${fmt(w.worstGrip, 3)} (${w.grip} over ${fmt(GRIP_DROP_MS, 3)}), standing with a speed ${w.stale}`).join('; ')}`);
        for (const [k, w] of Object.entries(W)) if (w.drop || w.grip || w.stale) bad.push({ label, k, drop: w.drop, grip: w.grip, stale: w.stale });
      }
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'a contact halt brakes the #2 to a stop (VIEWS §3.10.1: "the brake, not the cut"): his entry halted at speed with his rows going, he slows at his legs\' brake to a stop over about v² / 2a, never to 0 in a tick (v0.0.12 dropped him 9 times a lane)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), H = g.state.armoury.range.house;
      const two = g.state.actors.list.find(a => a.who === H.twoPid), bot = houseTBot();
      let n = 0;
      while (n++ < 2000 && !(H.two.doing?.beats?.some(b => b.st === 'run' && b.k === 'move') && Math.hypot(two.v?.[0] ?? 0, two.v?.[1] ?? 0) >= 1.5)) { g.step(1, bot); g.clearFacts?.(); }
      const v0 = Math.hypot(two.v?.[0] ?? 0, two.v?.[1] ?? 0), at0 = [two.x, two.z], brake = legsOf(g.state, H.twoPid).brakeMs2;
      assert(v0 >= 1.5, `the #2 never reached 1.5 m/s: ${v0}`);
      // (his contact: the doing halted where he stands, and his slot held a minute after it (rec.last), so nothing plans him again)
      haltDoing(g.state, g.bus, H.two.doing, 'contact', null, g.state.clock.ms);
      g.step(1, {}); g.clearFacts?.();
      H.two.last = { step: 'test', untilMs: g.state.clock.ms + 60_000, why: 'contact' };
      const speeds = [];
      let prev = [two.x, two.z];
      for (let i = 0; i < 16; i++) { g.step(1, {}); g.clearFacts?.(); speeds.push(Math.hypot(two.x - prev[0], two.z - prev[1]) / TICK_S); prev = [two.x, two.z]; }
      const L = Math.hypot(two.x - at0[0], two.z - at0[1]), want = v0 * v0 / (2 * brake);
      console.log(`      from ${fmt(v0, 2)} m/s at his brake ${fmt(brake, 2)} m/s²: ${speeds.map(v => fmt(v, 2)).join(' ')} m/s; stopped in ${fmt(L, 3)} m (v²/2a ${fmt(want, 3)} m)`);
      assert(speeds[0] > v0 - GRIP_DROP_MS - 0.2 && speeds.every((v, i) => i === 0 || speeds[i - 1] - v <= GRIP_DROP_MS) && speeds.at(-1) < 0.01, JSON.stringify(speeds));
      assert(Math.abs(L - want) <= 0.06, JSON.stringify({ L, want }));
    },
  },
  {
    name: 'the aim drawn as an aim (VIEWS §3.10.1): an aimed walk is painted at the high ready until the aimed bands exist, never the low ready; over the tier one\'s lane by T on 48213 no tick you or your #2 walk aimed is drawn low (v0.0.12: 333 a lane)',
    timeoutMs: 120_000,
    fn() {
      const { aim } = watchLane('tierone', 48213, houseTBot());
      console.log(`      ticks walked aimed ${aim.walked}, drawn at the low ready ${aim.low}; gaitCarryOf: aim → ${gaitCarryOf('aim')}, low → ${gaitCarryOf('low')}, none → ${gaitCarryOf(null)}`);
      assert(gaitCarryOf('aim') === 'high' && aim.low === 0, JSON.stringify(aim));
    },
  },
  {
    name: 'the stance pool (VIEWS §3.10.1, "every band pre-painted before GO"): the bands a gait carry never changes (the rifle\'s handling, the aim, sitting, lying) paint the same from the sheet of every carry, so the view draws them from a sibling\'s sheet (render/figures.js sibs), and the gait and move bands differ by carry, so the view paints each carry\'s before GO; the #2\'s look in the house',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' });
      const two = g.state.actors.list.find(a => a.who === g.state.armoury.range.house.twoPid), base = figureOf(g.state, two).look;
      const hash = (pm) => createHash('sha1').update(Buffer.from(pm.data.buffer)).digest('hex').slice(0, 10);
      const rows = [], same = {};
      for (const band of [...CARRY_FREE_BANDS, 'gait', 'move']) {
        const hs = GAIT_CARRIES.map(carry => hash(paintBand({ ...base, weapon: 'rifle', carry }, band).pm));
        same[band] = new Set(hs).size === 1;
        rows.push(`${band} ${same[band] ? 'the same' : 'by carry'} (${hs.join(' ')})`);
      }
      console.log(`      ${rows.join('; ')}`);
      assert(CARRY_FREE_BANDS.every(b => same[b] && BANDS[b]) && !same.gait && !same.move, JSON.stringify(same));
    },
  },
];
