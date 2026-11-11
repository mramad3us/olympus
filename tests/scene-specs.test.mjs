// The scene specs (ROADMAP "anywhere", step 4; PLACES §9.9; CONTRACTS §21): every start is a spec in src/data/scenes.js
// with its host and its environment named, newGame starts from it (src/sim/game.js specOf), SCENARIO_SITES is gone,
// and (0.0.12) the shoot house's spec is built: house 1 of the Wheel's sector 4 (PLACES §4.15), the site's own environment,
// the area carrying its 1 G of spin.
//   - the menu's scenes start where v0.0.10 started them: the same game time, the same live area, the player at the
//     same point facing the same way, and the same bytes (each start's digest, made by v0.0.10's own code in a scratch
//     worktree of its tag, 2026-11-08), on two seeds, by the spec's id and by the old way (scenario, hour, setup);
//   - the specs: every scenario has one, scenes sharing a scenario share its host and env, each shipped scene stands
//     on its host's site in the site's own environment (no live override written), the Tests menu lists the built ones;
//   - the shoot house (0.0.12, the build sheet 0.0.12 §5.3): its spec built on the house course, in the menu after "Bang",
//     starting on the Wheel's area at 1 G of spin (the area's own, no live override) in the Martian indoor standard on
//     Melas's sol, the player on the start mark facing west; the other starts unchanged (the first test, v0.0.10's bytes);
//   - a spec's environment is live before the fill: test-pairs under the Wheel's preset is set once (rev 1) on its host
//     and kept through the fill's moves; an unknown scene, scenario or preset throws.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { newGame, specOf, SCENARIOS } from '../src/sim/game.js';
import { SCENES, SCENE_IDS, STARTS } from '../src/data/scenes.js';
import { toJSON } from '../src/core/state.js';
import { digest } from '../src/core/hash.js';
import { playerActor } from '../src/core/ids.js';
import { presetEnv, gravityAt, localTime } from '../src/sim/places/env.js';
import { siteOf } from '../src/sim/places/model.js';
import { ENV_PRESETS } from '../src/data/places/env.js';

// (v0.0.10's starts, by its own code: { ms (the clock and meta.createdMs), area, x, z, face, digest } per scene and seed)
const V0010 = Object.freeze({
  'test-shower|48213': [23505025700, 'melas.echo.1', 52.075, 3.3, 'up', '07fa6cfc006c28'],
  'test-shower|7': [23505025700, 'melas.echo.1', 52.075, 3.3, 'up', '0ab1b71956b942'],
  'test-night|48213': [23513725700, 'melas.echo.1', 52.075, 3.3, 'up', '0c6a6be16dbe5d'],
  'test-night|7': [23513725700, 'melas.echo.1', 52.075, 3.3, 'up', '15e6c9a56307aa'],
  'test-handling|48213': [23556000950, 'melas.ground', 1100, 295.5, 'right', '0790b19670316a'],
  'test-handling|7': [23556000950, 'melas.ground', 1100, 286.5, 'right', '0199e4bbbaa56e'],
  'test-handling-mixed|48213': [23556000950, 'melas.ground', 1100, 295.5, 'right', '0f122ecc2d5b0a'],
  'test-handling-mixed|7': [23556000950, 'melas.ground', 1100, 286.5, 'right', '099c4f95d15a89'],
  'test-range|48213': [23559600950, 'melas.ground', 1100, 286.5, 'right', '04438ae5a61474'],
  'test-range|7': [23559600950, 'melas.ground', 1100, 286.5, 'right', '0121c35fa767bd'],
  'test-pairs|48213': [23563200950, 'melas.ground', 1117, 286.5, 'right', '15fb8e8d73f3fa'],
  'test-pairs|7': [23563200950, 'melas.ground', 1117, 292.5, 'right', '02dcb54bb7236f'],
  'test-pairs-bangs|48213': [23563200950, 'melas.ground', 1117, 286.5, 'right', '14650fb5df26f1'],
  'test-pairs-bangs|7': [23563200950, 'melas.ground', 1117, 292.5, 'right', '17eaeb95acd379'],
  'test-stress|48213': [23563200950, 'melas.ground', 1117, 286.5, 'right', '001d4f1b4c5f8d'],
  'test-stress|7': [23563200950, 'melas.ground', 1117, 289.5, 'right', '16c7f657a558a1'],
  'sandbox|48213': [23480400000, 'test.rooms', 24.9, 4.4, 'right', '13270604d2b6c8'],
  'barracks|48213': [23480400000, 'melas.echo.1', 52.075, 3.3, 'down', '09eaa02234bb43'],
});
const startOf = (s) => { const a = playerActor(s); return [s.clock.ms === s.meta.createdMs ? s.clock.ms : `${s.clock.ms}≠${s.meta.createdMs}`, s.places.live.area, a.x, a.z, a.face, digest(toJSON(s))]; };
const throws = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };

export default [
  {
    name: 'the menu\'s scenes start where v0.0.10 started them: the same ms, area, point, facing and bytes, on two seeds, by the spec\'s id and by the scenario, hour and setup as before; the career\'s and the sandbox\'s starts too',
    fn() {
      const bad = [];
      for (const [key, want] of Object.entries(V0010)) {
        const [id, seed] = key.split('|'), rec = SCENES[id] ?? STARTS[id];
        if (!rec) continue;
        const bySpec = startOf(newGame({ seed: Number(seed), scene: id, version: 'test' }));
        const byOld = startOf(newGame({ seed: Number(seed), scenario: rec.scenario, hour: rec.hour ?? null, setup: rec.setup ?? null, version: 'test' }));
        const ok = JSON.stringify(bySpec) === JSON.stringify(want) && JSON.stringify(byOld) === JSON.stringify(want);
        console.log(`      ${key.padEnd(26)} ${bySpec[0]} ms ${bySpec[1].padEnd(13)} (${bySpec[2]}, ${bySpec[3]}) ${String(bySpec[4]).padEnd(5)} ${bySpec[5]}${ok ? '' : `  DIFFERENT (v0.0.10 ${JSON.stringify(want)}; the old way ${JSON.stringify(byOld)})`}`);
        if (!ok) bad.push(key);
      }
      // (every scene v0.0.10 had: the shoot house, new in 0.0.12, is the fourth test's)
      const listed = SCENE_IDS.filter(id => SCENES[id].scenario && id !== 'test-shoothouse').length * 2 + 2;
      assert(Object.keys(V0010).length === listed, `every built scene on two seeds and the two starts: ${Object.keys(V0010).length} of ${listed}`);
      assert(!bad.length, `starts that moved: ${bad.join(', ')}`);
    },
  },
  {
    name: 'the specs: every scenario has one, scenes sharing a scenario share its host and environment, every shipped scene stands on Melas in the site\'s own environment with no live override written, and the Tests menu lists the built scenes in order',
    fn() {
      const rows = [];
      for (const scenario of Object.keys(SCENARIOS)) {
        const spec = specOf({ scenario }), s = newGame({ seed: 48213, scenario, version: 'test' });
        rows.push(`${scenario.padEnd(14)} ${spec.id.padEnd(14)} host ${JSON.stringify(spec.host)} env ${spec.env.preset}; live ${s.places.live.site}/${s.places.live.area}, env ${JSON.stringify(s.places.live.env ?? null)}, ${gravityAt(s).gG} G`);
        assert(s.places.live.site === spec.host.site && !('env' in s.places.live) && siteOf(spec.host.site), `${scenario}: ${JSON.stringify(s.places.live)}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      const built = Object.values(SCENES).filter(x => x.built !== false);
      assert(built.every(x => x.env.preset === 'site' && x.host.site === 'melas' && SCENARIOS[x.scenario]), 'every shipped scene: Melas, the site\'s own environment, a fill');
      assert(JSON.stringify(SCENE_IDS) === JSON.stringify(built.map(x => x.id)) && SCENE_IDS.at(-1) === 'test-shoothouse', SCENE_IDS.join());
      assert(Object.values(STARTS).every(x => x.env.preset === 'site') && STARTS.sandbox.host.site === 'test' && STARTS.barracks.host.site === 'melas', JSON.stringify(STARTS));
      console.log(`      the Tests menu: ${SCENE_IDS.join(', ')}; stubs: ${Object.values(SCENES).filter(x => x.built === false).map(x => x.id).join(', ')}`);
    },
  },
  {
    name: 'the shoot house\'s spec, built (0.0.12): the house course on house 1 of the Wheel\'s sector 4, the site\'s own environment with the area\'s 1 G of spin, in the Martian indoor standard on Melas\'s sol; the player on the start mark facing west; in the menu after "Bang"',
    fn() {
      const spec = SCENES['test-shoothouse'], s = newGame({ seed: 48213, scene: 'test-shoothouse', version: 'test' }), g = gravityAt(s), a = playerActor(s);
      const face = localTime(spec.host.site, 0).face, air = s.places.live.area;
      console.log(`      ${spec.id} "${spec.title}": host ${JSON.stringify(spec.host)}, env ${spec.env.preset}, course ${spec.course}, outfit ${spec.outfit}, sheets ${spec.sheets.join(' ')} (${spec.sheet}), pars ${spec.pars.join(' ')}; live ${s.places.live.site}/${air} ${JSON.stringify(s.places.live.env ?? null)}: ${g.regime} ${g.gG} G = ${g.gMs2} m/s², spin ${JSON.stringify(g.spin)}; the player at (${a.x}, ${a.z}) facing ${a.face}; clock ${face}; hour ${spec.hour}; the menu: ${SCENE_IDS.slice(-2).join(', ')}`);
      assert(spec.built !== false && spec.scenario === 'test-shoothouse' && spec.host.site === 'melas' && spec.host.area === 'melas.wheel.s4' && spec.env.preset === 'site' && spec.course === 'house' && spec.stances === true, JSON.stringify(spec));
      assert(air === 'melas.wheel.s4' && !('env' in s.places.live) && g.regime === 'spin' && g.gG === 1 && face === 'mars-local', JSON.stringify({ live: s.places.live, g }));
      assert(a.face === 'left' && s.armoury.range?.course === 'house' && SCENE_IDS.indexOf('test-shoothouse') === SCENE_IDS.indexOf('test-stress') + 1, JSON.stringify({ face: a.face, menu: SCENE_IDS }));
    },
  },
  {
    name: 'a spec\'s environment is live before the fill and kept through it: test-pairs under the Wheel\'s preset is set once on its host and plays its first tick at 1 G; an unknown scene, scenario or preset throws',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, env: 'wheel' }), live = g.state.places.live;
      g.step(1);
      const gG = gravityAt(g.state).gG;
      const errs = { scene: throws(() => newGame({ seed: 1, scene: 'test-nowhere' })), scenario: throws(() => newGame({ seed: 1, scenario: 'nowhere' })), preset: throws(() => newGame({ seed: 1, scenario: 'test-pairs', env: 'mars-but-nicer' })) };
      console.log(`      test-pairs under wheel: live ${JSON.stringify(live)}, ${gG} G after a tick; refused: ${Object.entries(errs).map(([k, v]) => `${k}: ${v?.slice(0, 60)}`).join('; ')}`);
      assert(live.site === 'melas' && live.env?.preset === 'wheel' && live.env.rev === 1 && gG === 1, JSON.stringify(live));
      assert(Object.values(errs).every(Boolean), JSON.stringify(errs));
    },
  },
];
