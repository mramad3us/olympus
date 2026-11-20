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
/** v0.0.24's two void scenes ("Anchor before you fire", "Secure for burn") and v0.0.25's Wreck ("Hold to hold"): off Mars, with no v0.0.10 start. */
const VOID_SCENES = Object.freeze(['test-anchors', 'test-burn', 'test-zerocqb', 'test-collar']);
/** v0.0.28's "The window and the canopy": on Melas, but new since, so with no v0.0.10 start either. */
const NEW_SCENES = Object.freeze(['test-armoury']);
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
      // (v0.0.19's "Stack and clear, live" plays the shoot house's scenario: neither had a v0.0.10 start)
      // (v0.0.24's two void scenes, new since, have no v0.0.10 start either)
      // (v0.0.28's armoury, new since, none either)
      const listed = SCENE_IDS.filter(id => SCENES[id].scenario && SCENES[id].scenario !== 'test-shoothouse' && !VOID_SCENES.includes(id) && !NEW_SCENES.includes(id)).length * 2 + 2;
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
        // (v0.0.24: "Secure for burn" stands in a coasting deck's preset with the ship's profile written live: its own environment)
        assert(s.places.live.site === spec.host.site && (!('env' in s.places.live) || spec.env.preset !== 'site') && siteOf(spec.host.site), `${scenario}: ${JSON.stringify(s.places.live)}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      const built = Object.values(SCENES).filter(x => x.built !== false);
      // (v0.0.24: the void's two scenes stand off Mars, Well A at Phobos in its site's own environment and the berth aboard Testudo on a
      // coasting deck's preset; listed after "Stack and clear, live", the anchors then the burn)
      assert(built.filter(x => !VOID_SCENES.includes(x.id)).every(x => x.env.preset === 'site' && x.host.site === 'melas' && SCENARIOS[x.scenario]), 'every shipped scene but the void\'s: Melas, the site\'s own environment, a fill');
      assert(SCENES['test-anchors'].host.site === 'phobos-void' && SCENES['test-anchors'].env.preset === 'site' && SCENES['test-burn'].host.site === 'mcrn-testudo' && SCENES['test-burn'].env.preset === 'ship-coast', 'the void\'s two scenes');
      // (v0.0.26: "Bang, then go", the house's scenario at its stand, host and hour, after "Stack and clear, live" in the menu's order, the
      // house's family together (its build sheet §0 item 20); on the Tests menu since v0.0.26's integration met its ship rule, tests/scene-breach)
      assert(SCENES['test-breach'].scenario === 'test-shoothouse' && JSON.stringify(SCENES['test-breach'].host) === JSON.stringify(SCENES['test-shoothouse'].host) && SCENES['test-breach'].hour === SCENES['test-shoothouse'].hour, 'the scene of room 1');
      // (v0.0.25: "Hold to hold", the Wreck at Phobos in its site's own environment, its own scenario, after "Secure for burn" in the menu's order)
      assert(SCENES['test-zerocqb'].host.site === 'phobos-void' && SCENES['test-zerocqb'].host.area === 'phobos.void.wreck' && SCENES['test-zerocqb'].env.preset === 'site' && SCENES['test-zerocqb'].scenario === 'test-zerocqb', 'the Wreck\'s scene');
      // (v0.0.27: "Away the boarding party", the Patient Mule coasting at 0 G in its site's own environment, its own scenario, last, after "Hold
      // to hold" (the ships together: its build sheet §14 item 22, question 18); on the Tests menu since v0.0.27's integration met its ship
      // rule (F150, F153, F155 and F165 green))
      assert(SCENES['test-collar'].host.site === 'belt-mule' && SCENES['test-collar'].host.area === 'mule.crew' && SCENES['test-collar'].env.preset === 'site' && SCENES['test-collar'].scenario === 'test-collar' && SCENES['test-collar'].ship === 'hauler' && SCENES['test-collar'].menu !== false, 'the hauler\'s scene');
      // (v0.0.28: "The window and the canopy" appended last, after "Away the boarding party" (its build sheet §0 item 19, §14 item 4): SCENE_IDS
      // lists the built scenes, menu or not, so it is last there from its merge, by its URL only (menu false) until its ship rule; the
      // scenes before it in their places, each one along)
      assert(SCENES['test-armoury'].host.site === 'melas' && SCENES['test-armoury'].scenario === 'test-armoury' && SCENES['test-armoury'].course === 'armoury' && SCENES['test-armoury'].menu === false, JSON.stringify(SCENES['test-armoury']));
      assert(JSON.stringify(SCENE_IDS) === JSON.stringify(built.map(x => x.id)) && SCENE_IDS.at(-1) === 'test-armoury' && SCENE_IDS.at(-2) === 'test-collar' && SCENE_IDS.at(-3) === 'test-zerocqb' && SCENE_IDS.at(-4) === 'test-burn' && SCENE_IDS.at(-5) === 'test-anchors' && SCENE_IDS.at(-6) === 'test-breach' && SCENE_IDS.at(-7) === 'test-shoothouse-live' && SCENE_IDS.at(-8) === 'test-shoothouse', SCENE_IDS.join());
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
    name: 'v0.0.19: "Stack and clear, live" is the shoot house\'s scenario with opfor \'live\', on its stand, host and hour, after "Stack and clear" in the menu; its fill puts the role-players on stands 2a and 3a and test-shoothouse\'s own fill none',
    fn() {
      const spec = SCENES['test-shoothouse-live'], base = SCENES['test-shoothouse'];
      const live = newGame({ seed: 48213, scene: 'test-shoothouse-live', version: 'test' }), plain = newGame({ seed: 48213, scene: 'test-shoothouse', version: 'test' });
      const men = (s) => (s.armoury.range.turners ?? []).filter(T => T.live).map(T => `${T.stand}:${T.live.card}`);
      console.log(`      ${spec.id} "${spec.title}": scenario ${spec.scenario}, opfor ${spec.opfor}, host ${JSON.stringify(spec.host)}, hour ${spec.hour}; the men ${men(live).join(' ') || 'none'}; test-shoothouse's ${men(plain).join(' ') || 'none'}, its house.live ${JSON.stringify(plain.armoury.range.house.live ?? null)}; the menu ${SCENE_IDS.slice(-3).join(', ')}`);
      assert(spec.built !== false && spec.scenario === 'test-shoothouse' && spec.opfor === 'live' && JSON.stringify(spec.host) === JSON.stringify(base.host) && spec.hour === base.hour && spec.course === 'house' && spec.title === 'Stack and clear, live', JSON.stringify(spec));
      assert(specOf({ scenario: 'test-shoothouse' }).id === 'test-shoothouse' && SCENE_IDS.indexOf('test-shoothouse-live') === SCENE_IDS.indexOf('test-shoothouse') + 1, SCENE_IDS.join());
      assert(JSON.stringify(men(live).map(x => x.split(':')[0])) === JSON.stringify(['2a', '3a']) && !men(plain).length && plain.armoury.range.house.live === undefined && live.armoury.range.house.opfor === 'live', JSON.stringify({ live: men(live), plain: men(plain) }));
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
