// The environment foundation (ROADMAP "anywhere", step 1; TECH §1.4; PLACES §1.2, §1.3, §3.11, §3.16; CONTRACTS §21):
// the one record every quantity of a place is read from, with no behaviour change at Mars.
//   - env-noregress: Melas's ground and floors resolve to v0.0.10's own numbers (0.38 G; 65.9 kPa and −10 °C out,
//     66.0 kPa and 20 °C in; Martian air's 29.62 g/mol), the ballistic classes WEAPONS §2.1 prints are the presets'
//     view and equal v0.0.10's table to the bit (Europa's 1.314 m/s² now 0.134 G × G0, PLACES §3.11), the range's
//     envOfPlace is 'mars-valley' exactly, a case falls at 3.727 m/s² as since v0.0.5, the body's environment is the
//     place's, and the stance and gait times on Mars are v0.0.10's (1,033 ms to prone; 1.14, 2.69 m/s);
//   - the presets' table (printed): gravity, density, the speed of sound, the walk and stance times each implies;
//   - env-fallback: an unknown site, area, preset, air or surface throws, and so does a read with no place live, a
//     gait or a stance with no gravity, a body environment with no air: no quiet Melas (TECH §1.4, rule 2);
//   - the live layer: a scene's override (setLiveEnv) wins over the site's, bumps its rev, goes with the player from
//     area to area of its site and stays behind at another; a save made under it carries on byte for byte; the upgrade
//     'places:env' writes a null as its absence, so a save that never set one is the same bytes.
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { toJSON } from '../src/core/state.js';
import { G0_MS2, gasOf } from '../src/core/phys.js';
import { BODIES, AIRS, SURFACES, ENV_PRESETS } from '../src/data/places/env.js';
import { SITE_LIST } from '../src/data/places/sites.js';
import { envAt, gravityAt, airAt, soundMsAt, surfaceAt, presetEnv, bodyPlaceOf, setLiveEnv, upgradeEnv, liveEnvOf } from '../src/sim/places/env.js';
import { enterSite } from '../src/sim/places/model.js';
import { ENV_CLASSES, envOfPlace, airOf } from '../src/sim/arms/ballistics.js';
import { caseGMs2 } from '../src/sim/arms/look.js';
import { envAt as bodyEnvAt, envOf } from '../src/sim/body/body.js';
import { gaitSpeeds, gaitsOf } from '../src/sim/body/motion.js';
import { MARS_GAITS } from './mars-gaits.mjs';
import { stanceMs, tFallMs } from '../src/sim/combat/steps.js';
import { settleTo } from '../src/sim/body/thermal.js';

const live = (area, site = area.split('.')[0] === 'test' ? 'test' : 'melas') => ({ places: { live: { site, area } } });
const throws = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };

// v0.0.10's numbers, as its needs.js, ballistics.js and look.js held them (the baseline worktree at the tag)
const V10 = Object.freeze({ gG: 0.38, groundKpa: 65.9, floorKpa: 66.0, outdoorC: -10, roomC: 20, marsKgMol: 0.02962, caseG: 3.727 });
const V10_CLASSES = Object.freeze({
  earth: [9.80665, 101.325, 15, 0.02896, false], 'mars-valley': [0.38 * 9.80665, 65.9, -10, 0.02962, false], 'mars-datum': [0.38 * 9.80665, 52, -25, 0.02962, false],
  'ship-thrust': [9.80665, 66, 20, 0.02962, false], 'ship-light': [0.3 * 9.80665, 66, 20, 0.02962, false], 'freefall-air': [0, 66, 20, 0.02962, false],
  'earth-ship': [9.80665, 101.3, 21, 0.02896, false], europa: [1.314, 0, -170, 0, true], 'freefall-vacuum': [0, 0, 0, 0, true],
});

export default [
  {
    name: 'env-noregress: Melas resolves to v0.0.10\'s numbers (0.38 G; 65.9 kPa, −10 °C out; 66.0 kPa, 20 °C in), the ballistic classes are v0.0.10\'s to the bit but Europa\'s 0.134 G, the range\'s envOfPlace is mars-valley, a case falls at 3.727 m/s²',
    fn() {
      const ground = envAt(null, 'melas.ground'), floor = envAt(null, 'melas.echo.1'), test = envAt(null, 'test.rooms');
      console.log(`      melas.ground: ${ground.gravity.regime} ${ground.gravity.gG} G (${ground.gravity.gMs2} m/s²), ${ground.air.air} ${ground.air.pKpa} kPa at ${ground.air.airC} °C, ρ ${fmt(ground.air.rhoKgM3, 4)} kg/m³, c ${fmt(ground.air.soundMs, 2)} m/s, open ${ground.air.open}, sky ${ground.sky}`);
      console.log(`      melas.echo.1: ${floor.air.air} ${floor.air.pKpa} kPa at ${floor.air.airC} °C, ρ ${fmt(floor.air.rhoKgM3, 4)} kg/m³, c ${fmt(floor.air.soundMs, 2)} m/s, open ${floor.air.open}, sky ${floor.sky}; test.rooms the same: ${test.air.pKpa} kPa, ${test.gravity.gG} G`);
      for (const E of [ground, floor, test]) assert(E.gravity.gG === V10.gG && E.gravity.gMs2 === V10.gG * 9.80665 && E.gravity.regime === 'surface' && E.air.molarKgMol === V10.marsKgMol, JSON.stringify(E));
      assert(ground.air.pKpa === V10.groundKpa && ground.air.airC === V10.outdoorC && ground.outdoors && ground.air.open, JSON.stringify(ground.air));
      assert(floor.air.pKpa === V10.floorKpa && floor.air.airC === V10.roomC && !floor.outdoors && !floor.air.open, JSON.stringify(floor.air));
      assert(test.air.pKpa === V10.floorKpa && test.air.airC === V10.roomC, JSON.stringify(test.air));
      // (the classes: every field as v0.0.10's table, Europa's gravity apart)
      const off = [];
      for (const [cls, [g, p, t, m, vac]] of Object.entries(V10_CLASSES)) {
        const E = ENV_CLASSES[cls];
        if (!E) { off.push(`${cls} missing`); continue; }
        if ((cls !== 'europa' && E.gMs2 !== g) || E.pKpa !== p || E.airC !== t || E.molarKgMol !== m || E.vacuum !== vac) off.push(`${cls}: ${JSON.stringify(E)}`);
      }
      console.log(`      ENV_CLASSES: ${Object.keys(ENV_CLASSES).length} classes, all as v0.0.10's but Europa's ${V10_CLASSES.europa[0]} → ${fmt(ENV_CLASSES.europa.gMs2, 5)} m/s² (0.134 G); off: ${off.join('; ') || 'none'}`);
      assert(!off.length && Object.keys(ENV_CLASSES).length === Object.keys(V10_CLASSES).length, off.join('\n'));
      near(ENV_CLASSES.europa.gMs2, 1.314, 0.001, 'Europa');
      // (the range as the round sees it, and the case's gravity)
      const range = envOfPlace(live('melas.ground'), 'melas.ground', 1300, 350), valley = ENV_CLASSES['mars-valley'];
      assert(['gMs2', 'pKpa', 'airC', 'molarKgMol', 'vacuum'].every(k => range[k] === valley[k]), JSON.stringify({ range, valley }));
      const inside = envOfPlace(live('melas.echo.1'), 'melas.echo.1');
      assert(inside.pKpa === V10.floorKpa && inside.airC === V10.roomC && inside.gMs2 === valley.gMs2, JSON.stringify(inside));
      const a = airOf(range), g = gasOf(range.pKpa, range.airC, range.molarKgMol);
      assert(a.rhoKgM3 === g.rhoKgM3 && a.soundMs === g.soundMs && a.soundMs === ground.air.soundMs, 'one gas law');
      const cg = caseGMs2(live('melas.ground'));
      console.log(`      the range: ${range.pKpa} kPa, ${range.airC} °C, ${range.gMs2} m/s² (mars-valley exactly); indoors ${inside.pKpa} kPa, ${inside.airC} °C; a case falls at ${cg} m/s²`);
      assert(cg === V10.caseG, `the case's gravity ${cg}`);
    },
  },
  {
    name: 'env-noregress: the body\'s environment, the stance and the gait times on Mars are v0.0.10\'s (stand to prone 1,033 ms, kneel to prone 819; walk 1.14, run 2.69, stroll 0.75 m/s); the reference sol\'s place is Melas\'s',
    fn() {
      const out = bodyEnvAt(live('melas.ground'), 'nobody'), inn = bodyEnvAt(live('melas.echo.1'), 'nobody'), P = bodyPlaceOf('melas');
      console.log(`      the body out of doors: ${out.gG} G, ${out.pKpa} kPa, ${out.airC} °C (key ${out.key}); indoors ${inn.pKpa} kPa, ${inn.airC} °C (key ${inn.key}); the reference sol's place ${JSON.stringify(P)}`);
      assert(out.gG === V10.gG && out.pKpa === V10.groundKpa && out.airC === V10.outdoorC && out.outdoors, JSON.stringify(out));
      assert(inn.gG === V10.gG && inn.pKpa === V10.floorKpa && inn.airC === V10.roomC && !inn.outdoors, JSON.stringify(inn));
      assert(P.gG === V10.gG && P.out.pKpa === V10.groundKpa && P.out.airC === V10.outdoorC && P.in.pKpa === V10.floorKpa && P.in.airC === V10.roomC, JSON.stringify(P));
      const gG = gravityAt(null, 'melas.ground').gG, toProne = stanceMs('stand', 'prone', { gG }), kneelProne = stanceMs('kneel', 'prone', { gG });
      const gaits = gaitSpeeds({ gG });
      console.log(`      at ${gG} G: stand to prone ${toProne} ms, kneel to prone ${kneelProne} ms (a 1 m fall ${fmt(tFallMs(1, gG), 0)} ms); gaits walk ${gaits.walkMs}, run ${gaits.runMs}, stroll ${gaits.strollMs}, sprint ${gaits.sprintMs} m/s; MARS_GAITS the same: ${JSON.stringify(MARS_GAITS) === JSON.stringify(Object.freeze(gaits))}`);
      assert(toProne === 1033 && kneelProne === 819, `${toProne}, ${kneelProne}`);
      assert(gaits.walkMs === 1.14 && gaits.runMs === 2.69 && gaits.strollMs === 0.75 && MARS_GAITS.walkMs === gaits.walkMs && MARS_GAITS.runMs === gaits.runMs, JSON.stringify(gaits));
      // (the core outdoors settles on the place's air: the valley's −10 °C)
      const st = settleTo({ outdoors: true, airC: out.airC, outfit: 'utilities' }), st0 = settleTo({ outdoors: false, outfit: 'utilities' });
      console.log(`      the core settles toward ${fmt(st.target, 2)} °C (τ ${st.tauMin} min) out of doors in utilities; indoors ${st0.target} °C`);
      assert(Number.isFinite(st.target) && st0.target === 37, JSON.stringify({ st, st0 }));
    },
  },
  {
    name: 'the presets (CONTRACTS §21): every one resolves, and its gravity, air, sound, walk and stance time print; 1 G is 9.807 m/s² and the 1.45 m/s walk, vacuum carries no sound, free fall has no down',
    fn() {
      const rows = [];
      for (const id of Object.keys(ENV_PRESETS)) {
        const E = presetEnv(id), g = E.gravity, a = E.air;
        const walk = g.gG > 0 ? gaitSpeeds({ gG: g.gG }).walkMs : null, prone = g.gG > 0 ? stanceMs('stand', 'prone', { gG: g.gG }) : null;
        rows.push(`${id.padEnd(16)} ${g.regime.padEnd(7)} ${fmt(g.gMs2, 3).padStart(6)} m/s²  ${a.air.padEnd(15)} ${String(a.pKpa).padStart(7)} kPa ${fmt(a.rhoKgM3, 3)} kg/m³ c ${fmt(a.soundMs, 1).padStart(5)} m/s  walk ${walk ?? '-'} m/s  to prone ${prone ?? '-'} ms  sky ${E.sky}, open ${a.open}`);
        assert(Number.isFinite(g.gMs2) && Number.isFinite(a.soundMs) && a.vacuum === !(a.pKpa > 0), `${id}: ${JSON.stringify(E)}`);
        if (a.vacuum) assert(a.soundMs === 0 && a.rhoKgM3 === 0 && !a.open, `${id}: vacuum carries no sound`);
        if (g.gG === 0) assert(g.down.every(v => v === 0), `${id}: free fall has no down`);
      }
      for (const r of rows) console.log(`      ${r}`);
      const ship = presetEnv('ship-1g');
      near(ship.gravity.gMs2, G0_MS2, 1e-12, 'ship-1g'); near(ship.air.soundMs, 339.4, 0.1, 'ship-1g c');
      assert(gaitSpeeds({ gG: ship.gravity.gG }).walkMs === 1.45 && stanceMs('stand', 'prone', { gG: 1 }) === 901, 'the 1 G row (the plan\'s matrix)');
      assert(Object.keys(BODIES).every(b => BODIES[b].ground === null || SURFACES[BODIES[b].ground]), 'every body\'s ground is a surface');
      assert(SITE_LIST.every(s => BODIES[s.body] && AIRS[s.outside.air] && AIRS[s.inside.air]), 'every site names a known body and airs');
    },
  },
  {
    name: 'env-fallback: an unknown site, area, preset, air or surface throws, and so does a read with no place live, a gait or a stance with no gravity, a body environment with no air (TECH §1.4: no quiet Melas)',
    fn() {
      const cases = {
        'an unknown area': () => envAt(null, 'nowhere.at.all'),
        'no place live': () => gravityAt({ places: { live: null } }),
        'no state at all': () => airAt(null),
        'an unknown preset': () => presetEnv('mars-but-nicer'),
        'an unknown site': () => bodyPlaceOf('olympus-mons'),
        'a live override naming an unknown air': () => setLiveEnv(live('melas.ground'), { air: 'nitrous' }),
        'a live override naming an unknown preset': () => setLiveEnv(live('melas.ground'), { preset: 'nowhere' }),
        'a gait with no gravity': () => gaitSpeeds({}),
        'a stance with no gravity': () => stanceMs('stand', 'prone', {}),
        'a fall with no gravity': () => tFallMs(1),
        'a body environment with no air': () => envOf({ gG: 0.38 }),
        'settling out of doors with no air temperature': () => settleTo({ outdoors: true }),
        'a surface off every area': () => surfaceAt(null, 'nowhere', 0, 0),
        'a gas with pressure and no molar mass': () => gasOf(66, 20, 0),
      };
      const got = Object.entries(cases).map(([what, fn]) => [what, throws(fn)]);
      for (const [what, msg] of got) console.log(`      ${what}: ${msg ? `throws (${msg.slice(0, 90)})` : 'NO THROW'}`);
      assert(got.every(([, m]) => m), got.filter(([, m]) => !m).map(([w]) => w).join(', '));
      // (and what is not an error: a read at a real place, a surface where the feet are)
      const s = surfaceAt(live('melas.ground'), null, 1300, 350);
      assert(s.id === 'paving' || s.id === 'regolith', JSON.stringify(s));
      assert(soundMsAt(live('melas.ground')) === airAt(null, 'melas.ground').soundMs, 'soundMsAt is airAt\'s');
    },
  },
  {
    name: 'the live layer: a scene\'s override wins over the site\'s and bumps its rev, goes with the player from area to area of its site and stays behind at another; a save made under it carries on byte for byte; \'places:env\' writes a null as its absence',
    fn() {
      const st = { places: { live: { site: 'melas', area: 'melas.ground' }, sites: {} }, clock: { ms: 0 } };
      const before = gravityAt(st).gG;
      const r1 = setLiveEnv(st, { preset: 'ship-1g' }), at1 = envAt(st);
      const r2 = setLiveEnv(st, { preset: 'ship-1g', gravity: { regime: 'thrust', gG: 2.5 } }), at2 = envAt(st);
      console.log(`      Melas's ground ${before} G; under ship-1g ${at1.gravity.gG} G, ${at1.air.air} ${at1.air.pKpa} kPa (rev ${r1.rev}, open ${at1.air.open}); a 2.5 G burn over it ${at2.gravity.gG} G (rev ${r2.rev})`);
      assert(before === 0.38 && at1.gravity.gG === 1 && at1.air.air === 'martian-indoor' && !at1.air.open && at2.gravity.gG === 2.5 && r2.rev === r1.rev + 1, JSON.stringify({ at1, at2 }));
      enterSite(st, 'melas', 'melas.echo.1');
      assert(liveEnvOf(st)?.rev === r2.rev && gravityAt(st).gG === 2.5, 'kept within its site');
      enterSite(st, 'test', 'test.rooms');
      assert(liveEnvOf(st) === null && gravityAt(st).gG === 0.38, 'left behind at another site');
      setLiveEnv(st, { preset: 'ship-coast' });
      assert(gravityAt(st).gG === 0 && setLiveEnv(st, null) === null && !('env' in st.places.live) && gravityAt(st).gG === 0.38, 'cleared: the site\'s again');
      // ('places:env': a null is the site's own, written as its absence; an absent one is left alone)
      const nul = { places: { live: { site: 'melas', area: 'melas.ground', env: null } } }, none = { places: { live: { site: 'melas', area: 'melas.ground' } } };
      const n1 = upgradeEnv(nul), n2 = upgradeEnv(none);
      assert(n1 === 1 && !('env' in nul.places.live) && n2 === 0 && JSON.stringify(none) === '{"places":{"live":{"site":"melas","area":"melas.ground"}}}', JSON.stringify({ nul, none }));
      // (a game: the sandbox under ship-1g, saved mid-way, carries on byte for byte; its walk is the 1 G walk)
      const g = createGame({ scenario: 'sandbox', seed: 7 });
      const plain = toJSON(g.state).includes('"env"');
      setLiveEnv(g.state, { preset: 'ship-1g' });
      const walk = gaitsOf(g.state, g.state.player.id).walkMs;
      g.step(40, { mx: 1 });
      const json = g.save();
      g.step(60, { mx: -1, mz: 1 });
      const a = g.digest();
      g.load(json); g.step(60, { mx: -1, mz: 1 });
      const b = g.digest();
      console.log(`      the sandbox: no env in its save before (${!plain}); under ship-1g the player walks at ${walk} m/s; saved at tick 40 and carried on 60: ${a} → ${b}`);
      assert(!plain && walk === 1.45 && a === b, JSON.stringify({ plain, walk, a, b }));
    },
  },
];
