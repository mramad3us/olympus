// The environment matrix (ROADMAP "anywhere", step 4; the audit's plan §4; TECH §1.4; PLACES §3.11, §3.16; CONTRACTS §21):
// one small scene, test-handling's 25 m line on seed 48213, played under six environments with the same actions:
// Melas's own (no live override, v0.0.10's), the Wheel (`wheel`, 1 G of spin under Base Melas: PLACES §4.15, the
// shoot house's), Europa's surface (0.134 G in vacuum), free fall in vacuum and a coasting deck in air (ship off
// thrust), and Earth at sea level (the plan's row, added by the fixer's pass). Each row is read from the game, never from a table: the gravity (src/sim/places/env.js gravityAt), the
// air (airAt: its pressure, density and speed of sound), the player's gaits (motion.js gaitsOf) and 20 ticks walked,
// the stance times the player's rows offer (shooting.js stanceMsOf at the player's Fitness and the place's gravity),
// a standing case (look.js ejectCase at caseGMs2, the port at 1.4 m) and the range bot's first fired case (prone, the
// port at 0.25 m), the round's fall at 25 and 300 m and its time of flight (ballistics.js flight on envOfPlace, the
// shot's own reading), the crosswind the shooter reads, the sky's class, the clock's face and the step's recipe.
// The asserted numbers are the plan's matrix (its §4, probed from the shipped modules) and v0.0.10's at Melas.
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { rangeBot } from './bots/range.mjs';
import { G0_MS2 } from '../src/core/phys.js';
import { TICK_MS } from '../src/core/clock.js';
import { gravityAt, airAt, soundMsAt, skyOf, localTime, surfaceAt } from '../src/sim/places/env.js';
import { gaitsOf } from '../src/sim/body/motion.js';
import { stanceMs } from '../src/sim/combat/steps.js';
import { stanceMsOf, gunOn } from '../src/sim/arms/shooting.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { ejectCase, caseGMs2 } from '../src/sim/arms/look.js';
import { readWind } from '../src/sim/arms/wind.js';
import { flight, envOfPlace } from '../src/sim/arms/ballistics.js';
import { MODELS } from '../src/sim/arms/models.js';
import { stepVoice } from '../src/ui/audio/steps.js';

/** The rows: a name, the preset (null: the site's own environment, Melas's valley floor). */
const ROWS = Object.freeze([['mars', null], ['wheel', 'wheel'], ['europa', 'europa-surface'], ['vacuum', 'freefall-vacuum'], ['coast', 'ship-coast'], ['earth', 'earth-temperate']]);
const SEED = 48213, WALK_TICKS = 20;
const r1 = (v) => Math.round(v * 10) / 10, r2 = (v) => Math.round(v * 100) / 100, r3 = (v) => Math.round(v * 1000) / 1000;

// (one row: the scene under a preset, its numbers read from the game)
function rowOf(name, env) {
  const g = createGame({ scenario: 'test-handling', seed: SEED, env }), s = g.state, pid = s.player.id;
  const me = () => s.actors.list.find(a => a.id === s.player.actor);
  const grav = gravityAt(s), air = airAt(s), gaits = gaitsOf(s, pid), fit = rollerOf(s, pid).value('fitness'), at0 = me();
  const stand = ejectCase({ model: 'r7' }, { x: at0.x, z: at0.z, yawRad: 0, stance: 'stand' }, { atMs: s.clock.ms, key: 'matrix', gMs2: caseGMs2(s) });
  const M = MODELS[s.items[gunOn(s, pid)]?.model ?? 'r7'], E = envOfPlace(s);
  const f25 = flight(M.cal, 'ball', M.barrelMm, E, 25), f300 = flight(M.cal, 'ball', M.barrelMm, E, 300);
  const wind = readWind(s, pid, { bearingRad: -Math.PI / 2, rangeM: 25 });
  const sky = skyOf(s, s.places.live.site, s.places.live.area), face = localTime(s.places.live.site, s.clock.ms).face, ground = surfaceAt(s, null, at0.x, at0.z);
  const step = stepVoice(ground.step, 'walk', { gG: grav.gG, pKpa: air.pKpa });
  // (20 ticks walked back off the line, the same keys in every row)
  const p0 = [at0.x, at0.z];
  g.step(WALK_TICKS, { mx: -1 });
  const walked = Math.hypot(me().x - p0[0], me().z - p0[1]) / (WALK_TICKS * TICK_MS / 1000), drawn = me().gait;
  // (the range bot from a fresh start of the same scene: its first case, fired prone)
  const h = createGame({ scenario: 'test-handling', seed: SEED, env }), bot = rangeBot();
  let fired = null, ticks = 0;
  for (; ticks < 20 * 60 * 2 && !fired; ticks += 20) { h.step(20, bot); fired = (h.state.armoury?.range?.brass ?? []).find(b => b.kind === 'case') ?? null; }
  return {
    name, preset: s.places.live.env?.preset ?? null, regime: grav.regime, gG: grav.gG, gMs2: r3(grav.gMs2), air: air.air, pKpa: air.pKpa, rho: r3(air.rhoKgM3), c: r1(soundMsAt(s)), open: air.open,
    mode: gaits.mode, stroll: gaits.strollMs, walk: gaits.walkMs, run: gaits.runMs, sprint: gaits.sprintMs, walked: r2(walked), drawn,
    fit, prone: stanceMsOf('stand', 'prone', fit, grav.gG), prone10: stanceMs('stand', 'prone', { gG: grav.gG }), kneel: stanceMsOf('stand', 'kneel', fit, grav.gG), up: stanceMsOf('prone', 'stand', fit, grav.gG),
    caseG: caseGMs2(s), standMs: stand.landMs - stand.atMs, standFree: stand.restY !== undefined, proneMs: fired ? fired.landMs - fired.atMs : null, proneFree: fired ? fired.restY !== undefined : null, botTicks: ticks,
    drop25: r2(f25.dropCm), drop300: r1(f300.dropCm), path25: r2(f25.pathCm), tof300: r3(f300.tofS), v300: Math.round(f300.vMs), mach300: f300.mach === null ? null : r2(f300.mach),
    crossMs: wind.crossMs, sky: sky.cls, face, ground: ground.id, step: step.kind, stepDb: step.gainDb,
  };
}

export default [
  {
    name: 'the environment matrix: test-handling\'s line under Melas, the Wheel (1 G), Europa, vacuum, a coasting deck and Earth prints and holds each place\'s gravity, air, sound, gaits, stance and brass times and the round\'s fall at 25 m, and Melas\'s row is v0.0.10\'s',
    timeoutMs: 120_000,
    fn() {
      const rows = Object.fromEntries(ROWS.map(([name, env]) => [name, rowOf(name, env)]));
      for (const r of Object.values(rows)) {
        console.log(`      ${r.name.padEnd(6)} ${String(r.preset ?? 'site').padEnd(15)} ${r.regime.padEnd(7)} ${fmt(r.gMs2, 3).padStart(6)} m/s²  ${r.air.padEnd(14)} ${String(r.pKpa).padStart(5)} kPa ρ ${fmt(r.rho, 3)} c ${fmt(r.c, 1).padStart(5)} m/s  ${r.open ? 'open air' : 'no weather'}; sky ${r.sky}, clock ${r.face}, ${r.ground} (${r.step} ${fmt(r.stepDb, 1)} dB)`);
        console.log(`             ${r.mode.padEnd(5)} stroll ${r.stroll} walk ${r.walk} run ${r.run} sprint ${r.sprint} m/s, walked ${r.walked} m/s drawn ${r.drawn}; Fitness ${r.fit}: stand to prone ${r.prone} ms (${r.prone10} at 10), to kneel ${r.kneel}, prone to stand ${r.up}`);
        console.log(`             a case at ${r.caseG} m/s²: standing lands in ${r.standMs} ms${r.standFree ? ' (free: held at the port)' : ''}, the bot's first prone in ${r.proneMs} ms${r.proneFree ? ' (free)' : ''} after ${r.botTicks} ticks; the round falls ${r.drop25} cm at 25 m (path ${r.path25}), ${r.drop300} cm at 300 m, ${r.tof300} s, ${r.v300} m/s${r.mach300 === null ? ', no Mach' : `, Mach ${r.mach300}`}; crosswind read ${r.crossMs} m/s`);
      }
      const { mars: M, wheel: W, europa: E, vacuum: V, coast: C, earth: H } = rows;
      // (Melas: v0.0.10's numbers, the site's own environment, no live override)
      assert(M.preset === null && M.regime === 'surface' && M.gG === 0.38 && M.gMs2 === 3.727 && M.air === 'mars-melas' && M.pKpa === 65.9 && M.c === 321.6 && M.open, JSON.stringify(M));
      assert(M.walk === 1.14 && M.run === 2.69 && M.sprint === 4.28 && M.mode === 'walk' && M.walked === 1.14 && M.prone10 === 1033 && M.caseG === 3.727 && M.standMs === 867 && M.proneMs === 366, JSON.stringify(M));
      near(M.rho, 0.892, 0.001, 'Melas ρ:'); near(M.drop25, 0.19, 0.01, 'Melas 25 m:'); near(M.drop300, 30.4, 0.1, 'Melas 300 m:'); near(M.tof300, 0.417, 0.001, 'Melas time of flight:');
      assert(M.crossMs !== 0 && M.sky === 'mars-air' && M.face === 'mars-local', `Melas's wind blows and its sky and sol: ${M.crossMs}, ${M.sky}, ${M.face}`);
      // (the Wheel: 1 G of spin in the Martian indoor standard, Melas's sol over it)
      assert(W.preset === 'wheel' && W.regime === 'spin' && W.gG === 1 && W.air === 'martian-indoor' && W.pKpa === 66 && !W.open && W.crossMs === 0, JSON.stringify(W));
      near(W.gMs2, G0_MS2, 0.001, 'the Wheel\'s g:'); near(W.c, 339.4, 0.1, 'the Wheel\'s sound:'); near(W.rho, 0.802, 0.001, 'the Wheel\'s ρ:');
      assert(W.walk === 1.45 && W.run === 3.6 && W.sprint === 6 && W.mode === 'walk' && W.walked === 1.45 && W.prone10 === 901 && W.prone < M.prone, JSON.stringify(W));
      near(W.standMs, 534, 2, 'a standing case at 1 G (ms):'); near(W.proneMs, Math.round(Math.sqrt(2 * 0.25 / W.caseG) * 1000), 0, 'the prone case at 1 G (ms):');
      near(W.drop25, 0.50, 0.01, 'the Wheel at 25 m:'); near(W.drop300, 79.2, 0.2, 'the Wheel at 300 m:'); assert(W.face === 'mars-local', `the Wheel keeps the sol: ${W.face}`);
      // (the sky is the host's under every preset (env.js: a preset changes the gravity and the air, never the sun), so the
      // sim's sky and the light's skyAt agree: test-handling's range stands on Melas's open ground in every row; a scene under
      // no sky stands on an area or a site that has none (the fixer's pass, 2026-11-08))
      for (const R of Object.values(rows)) assert(R.sky === 'mars-air' && R.face === 'mars-local', `${R.name}: the host's sky and sol, ${R.sky}, ${R.face}`);
      // (Europa: 0.134 G in vacuum, the bound)
      assert(E.regime === 'surface' && E.gG === 0.134 && E.pKpa === 0 && E.rho === 0 && E.c === 0 && !E.open && E.crossMs === 0 && E.mach300 === null, JSON.stringify(E));
      near(E.gMs2, 1.314, 0.001, 'Europa\'s g:'); assert(E.mode === 'bound' && E.walk === 0.88 && E.run === 1.97 && E.sprint === 2.97 && E.prone10 === 1535, JSON.stringify(E));
      near(E.standMs, 1460, 10, 'a standing case on Europa (ms):'); near(E.drop25, 0.07, 0.01, 'Europa at 25 m:'); near(E.drop300, 9.5, 0.1, 'Europa at 300 m:'); near(E.tof300, 0.380, 0.001, 'Europa\'s time of flight:');
      // (free fall in vacuum and the coasting deck: no down, the push-off's speeds, no fall, finite stances, cases held)
      for (const R of [V, C]) {
        assert(R.regime === 'free' && R.gG === 0 && R.gMs2 === 0 && R.mode === 'float' && R.drawn === 'float' && R.walk === 0.6 && R.run === 1.2 && R.sprint === 2, JSON.stringify(R));
        assert(Number.isFinite(R.prone) && R.prone > 0 && R.prone10 === 2321 && R.standFree && R.proneFree && R.drop25 === 0 && R.drop300 === 0 && R.crossMs === 0, JSON.stringify(R));
        near(R.walked, 0.6, 0.02, `${R.name}: the push-off walk:`);
      }
      assert(V.pKpa === 0 && V.c === 0 && V.mach300 === null && V.tof300 === E.tof300, `vacuum: no sound, the time of flight Europa's (${V.tof300} against ${E.tof300})`);
      near(C.c, 339.4, 0.1, 'the coasting deck\'s sound:'); near(C.rho, 0.802, 0.001, 'the coasting deck\'s ρ:'); near(C.tof300, W.tof300, 0.0005, 'the deck\'s time of flight is the Wheel\'s air\'s:');
      assert(W.stepDb > M.stepDb && !Number.isFinite(E.stepDb) && !Number.isFinite(V.stepDb), `a step is heavier at 1 G (${W.stepDb} dB against ${M.stepDb}) and carries no air in vacuum (${E.stepDb}, ${V.stepDb})`);
      assert(C.tof300 > V.tof300 && W.tof300 < M.tof300, `air slows the round: deck ${C.tof300} s, vacuum ${V.tof300}, Melas ${M.tof300}, the Wheel ${W.tof300}`);
      // (Earth at sea level: 1 G on its surface, 101.325 kPa at 15 °C, open air. The plan's matrix had 79.6 cm at 300 m "to
      // print", the Wheel's 79.2 with a guess: printed, Earth's denser air (ρ 1.225 against 0.802) slows the round to 0.434 s
      // and it falls 84.6 cm)
      assert(H.preset === 'earth-temperate' && H.regime === 'surface' && H.gG === 1 && H.air === 'earth-sea-level' && H.pKpa === 101.325 && H.open && H.walk === W.walk && H.prone10 === W.prone10, JSON.stringify(H));
      near(H.rho, 1.225, 0.001, 'Earth\'s ρ at sea level:'); near(H.c, 340.3, 0.1, 'Earth\'s sound at 15 °C:'); near(H.drop300, 84.6, 0.2, 'Earth at 300 m:'); near(H.tof300, 0.434, 0.001, 'Earth\'s time of flight:');
      assert(H.tof300 > W.tof300, `Earth's thicker air slows the round more than the Wheel's: ${H.tof300} s against ${W.tof300}`);
    },
  },
];
