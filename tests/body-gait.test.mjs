// body-gait: the gaits in every gravity, by load, and stamina (BODY §8, §16.1, §16.3; the build sheet
// 0.0.4 §5.1, §8 item 11). BODY §16.1's six rows from gaitSpeeds (Ceres's surface, 0.029 G, is under the
// float band's 0.05 G since ROADMAP "anywhere" step 2: BODY §16.6's push-off speeds, the law's printed beside
// them); Mars's 0.75, 1.14 and 2.69 m/s exactly, the bots' and the walk tests' row (tests/mars-gaits.mjs);
// a load's bands on Mars and on a 1 G deck; stamina over 60 s of running at Fitness 0, 10 and 20; and in
// the game, Shift runs while the body can, a blown marine walks, and the feet stay put while an
// activity holds them.
import { STAGE_TEST } from './bots/sol.mjs';
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { gaitSpeeds, staminaTick, capMetOf, loadBandOf, gaitsOf } from '../src/sim/body/motion.js';
import { speedOf } from '../src/sim/places/move.js';
import { MARS_GAITS, WALK_MS, RUN_MS, STROLL_MS } from './mars-gaits.mjs';
import { metGOf } from '../src/sim/body/energy.js';
import { playerId } from '../src/core/ids.js';
import { TICK_MS } from '../src/core/clock.js';

const ROWS = [['Earth, a 1 G deck', 1.0, [0.95, 1.45, 3.60, 6.00]], ['a 0.3 G deck', 0.3, [0.70, 1.07, 2.51, 3.94]], ['Mars', 0.38, [0.75, 1.14, 2.69, 4.28]],
  ['Ganymede', 0.146, [0.59, 0.90, 2.02, 3.06]], ['Europa', 0.134, [0.57, 0.88, 1.97, 2.97]], ['Ceres', 0.029, [0.39, 0.60, 1.24, 1.73], [0.30, 0.60, 1.20, 2.00]]];

export default [
  STAGE_TEST,
  {
    name: 'BODY §16.1\'s six rows come out of gaitSpeeds (Ceres\'s surface in the float band: the push-off\'s), and Mars\'s stroll, walk and run are exactly 0.75, 1.14 and 2.69 m/s',
    fn() {
      for (const [where, g, law, float] of ROWS) {
        const s = gaitSpeeds({ gG: g }), got = [s.strollMs, s.walkMs, s.runMs, s.sprintMs], want = float ?? law;
        console.log(`      ${where.padEnd(18)} ${g} G: stroll ${got[0]}, walk ${got[1]}, run ${got[2]}, sprint ${got[3]} m/s, ${s.mode} (BODY ${law.join(', ')}${float ? `; the float band's push-off ${float.join(', ')}` : ''})`);
        for (let i = 0; i < 4; i++) near(got[i], want[i], 0.0101, `${where}:`);
      }
      console.log(`      the walk tests' Mars row: STROLL_MS ${STROLL_MS}, WALK_MS ${WALK_MS}, RUN_MS ${RUN_MS}; the run at Fitness 0, 10, 20 on Mars: ${[0, 10, 20].map(f => gaitSpeeds({ gG: 0.38, effFitness: f }).runMs).join(', ')} m/s`);
      assert(MARS_GAITS.strollMs === 0.75 && MARS_GAITS.walkMs === 1.14 && MARS_GAITS.runMs === 2.69 && MARS_GAITS.mode === 'walk', JSON.stringify(MARS_GAITS));
      assert(STROLL_MS === MARS_GAITS.strollMs && WALK_MS === MARS_GAITS.walkMs && RUN_MS === MARS_GAITS.runMs, 'the Mars row reads the helper');
    },
  },
  {
    name: 'a load\'s bands by weight against strength: 45 kg is nothing on Mars and heavy on a 1 G deck (BODY §16.3)',
    fn() {
      const rows = [];
      for (const kg of [0, 20, 45, 60, 90, 120]) for (const g of [0.38, 1]) {
        const L = loadBandOf(kg, g, 75), s = gaitSpeeds({ gG: g, loadKg: kg, massKg: 75 });
        rows.push(`${kg} kg at ${g} G: ${fmt(L.ratio, 2)} ${L.id}, walk ${s.walkMs}${s.runOk ? '' : ', no run'}${s.sprintOk ? '' : ', no sprint'}`);
      }
      for (let i = 0; i < rows.length; i += 4) console.log(`      ${rows.slice(i, i + 4).join('; ')}`);
      assert(loadBandOf(45, 0.38, 75).id === 'unladen' && loadBandOf(45, 1, 75).id === 'heavy', 'BODY §16.3\'s 45 kg');
      assert(!gaitSpeeds({ gG: 1, loadKg: 60, massKg: 75 }).runOk, 'very heavy: no run');
    },
  },
  {
    name: 'stamina over 60 s of running: a run on Mars drains no one (4.3 MET under every threshold); at 1 G Fitness 0 drains, 10 and 20 hold; a sprint empties in about 32 s',
    fn() {
      const rows = [];
      for (const g of [0.38, 1]) for (const f of [0, 10, 20]) {
        const run = metGOf(8.0, 'run', g, 0, 75);
        let st = { stamina: 100, blown: false };
        for (let t = 0; t < 60 * 20; t++) st = staminaTick(st.stamina, st.blown, run, TICK_MS / 1000, f);
        rows.push(`${g} G, Fitness ${f}: run ${fmt(run, 2)} MET against a threshold of ${fmt(0.85 * capMetOf(f), 2)}: ${fmt(st.stamina, 1)} after 60 s`);
      }
      let sp = { stamina: 100, blown: false }, n = 0;
      while (sp.stamina > 0 && n < 2000) { sp = staminaTick(sp.stamina, sp.blown, 1.3 * capMetOf(10), TICK_MS / 1000, 10); n++; }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      a sprint at Fitness 10 (1.3 × ${fmt(capMetOf(10), 1)} MET): blown after ${fmt(n * TICK_MS / 1000, 1)} s (BODY §8: 32 s)`);
      const at = (g, f) => { let st = { stamina: 100, blown: false }; const run = metGOf(8.0, 'run', g, 0, 75); for (let t = 0; t < 1200; t++) st = staminaTick(st.stamina, st.blown, run, 0.05, f); return st.stamina; };
      assert(at(0.38, 0) === 100 && at(1, 10) === 100 && at(1, 0) < 50, JSON.stringify({ mars0: at(0.38, 0), earth10: at(1, 10), earth0: at(1, 0) }));
      near(n * TICK_MS / 1000, 31.7, 1, 'the sprint:');
    },
  },
  {
    name: 'in the game: Shift runs at 2.69 m/s while the body can; a blown marine walks at 1.14; the feet stay put while an activity holds them',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: 1 }), pid = playerId(g.state);
      const x0 = g.me().x;
      g.step(20, { mx: 1, run: true });
      const ran = (g.me().x - x0), gait = g.me().gait;
      g.state.people[pid].body.blown = true; g.state.people[pid].body.stamina = 10;
      const gs = gaitsOf(g.state, pid), x1 = g.me().x;
      g.step(20, { mx: -1, run: true });
      const walked = x1 - g.me().x, gait2 = g.me().gait;
      console.log(`      1 s of Shift: ${fmt(ran, 3)} m (${gait}); blown: runOk ${gs.runOk}, speedOf(Shift) ${speedOf({ mx: 1, run: true }, gs)} m/s, 1 s of Shift ${fmt(walked, 3)} m (${gait2})`);
      near(ran, RUN_MS, 0.01, 'the run:'); near(walked, WALK_MS, 0.06, 'blown, the walk:');
      assert(gait === 'run' && gait2 === 'walk', JSON.stringify({ gait, gait2 }));
      // (an activity under way holds the feet: the keys only turn you)
      g.state.time.doing = { activity: 'wait', spotId: null, mode: 'outcome', fromMs: g.state.clock.ms, toMs: g.state.clock.ms + 60_000, parts: [{ part: 'wait', toMs: g.state.clock.ms + 60_000 }] };
      const x2 = g.me().x;
      g.step(1, { mz: 1 });
      console.log(`      with an activity under way: moved ${fmt(Math.abs(g.me().x - x2), 4)} m, facing ${g.me().face}, gait ${g.me().gait}`);
      assert(g.me().x === x2 && g.me().face === 'down' && g.me().gait === 'idle', 'the feet held');
      g.state.time.doing = null;
    },
  },
];
