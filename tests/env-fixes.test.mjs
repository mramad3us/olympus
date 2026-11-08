// The audit's findings on ROADMAP "anywhere" (2026-11-08), fixed: each test pins one, and fails without its fix (TECH §1.4
// "Nothing may assume Mars"; PLACES §3.16; CONTRACTS §21). The body reads outdoors from the place's one record; the body
// clock's readers take the site's longitude, never Melas's by default; a ground's surface is its body's; sun.js and the
// sol read BODIES.mars; a round's trace throws with no gravity; a live override is checked before it is written and on
// load, and its temperature is honoured; the sky is the host's in the sim as in the light; a bang in vacuum deafens no
// one; the blast's dust and the head plate end where their fall does; the DI's grooming day is the site's Plan of the
// Day; a filtered test run claims no browser port for files it cannot run; and an unknown &env is a toast, not a dead page.
// Every number at Melas is v0.0.10's: the pins (game-walk, the scenes, tests/saves) hold that.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { assert, near, fmt, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { withGame } from './browser.mjs';
import { HOUR_MS, SOL_MS } from '../src/core/clock.js';
import { BODIES } from '../src/data/places/env.js';
import { envAt as placeEnvAt, airAt, skyOf, setLiveEnv, upgradeEnv, lonOfSite } from '../src/sim/places/env.js';
import { envAt as bodyEnvAt, bodyOf } from '../src/sim/body/body.js';
import { stagesOf, cuesOf, stripOf, wordsOf, pEffOf } from '../src/sim/body/cues.js';
import { surfaceAt, lonOf } from '../src/sim/places/model.js';
import { skyAt, NO_SKY } from '../src/sim/places/light.js';
import { MARS_OBLIQUITY_DEG, MARS_R_KM } from '../src/sim/places/sun.js';
import { traceRound } from '../src/sim/arms/penetrate.js';
import { bang, shotNoise, dinOf } from '../src/sim/combat/supp.js';
import { dustMsOf, DUST_MS, CASE_FLOAT_MS2 } from '../src/sim/arms/look.js';
import { dustPixels, turnerPixels, turnerAt, TURNER_LIFT_M, PLATE_FALL_MS } from '../src/render/range-items.js';

const SEED = 48213, PPM = 16;
const throws = (fn) => { try { fn(); return null; } catch (e) { return String(e?.message ?? e); } };
const meOf = (s) => s.actors.list.find(a => a.id === s.player.actor);
const earsOff = (s, pid) => { const w = s.people[pid].kit.worn; for (const [slot, id] of Object.entries(w)) if (s.items[id]?.type === 'ears') delete w[slot]; };

// (the head plate's pixels at ms, under gravity gMs2: the lowest pixel's height, or null when none is drawn)
function plateLow(ms, gMs2) {
  const t = { face: 'armoured', x: 0, z: 0, y: 1.35, facingK: 1, plateAtMs: 0, holes: [], key: 'fix', lane: 1 };
  const zPlate = turnerAt(t, PPM).z + TURNER_LIFT_M + 0.01;
  const px = turnerPixels(t, ms, PPM, gMs2).filter(p => Math.abs(p.z - zPlate) < 1e-9);
  return px.length ? Math.min(...px.map(p => p.y)) : null;
}

export default [
  {
    name: 'the body reads outdoors from the place\'s one record (env.js envAt): on test-handling\'s open ground under &env=ship-1g the body is indoors, as the place says, not out of doors by the area\'s kind; at Melas it is out of doors as in v0.0.10',
    fn() {
      const mars = createGame({ scenario: 'test-handling', seed: SEED }), ship = createGame({ scenario: 'test-handling', seed: SEED, env: 'ship-1g' });
      const pid = mars.state.player.id, bm = bodyEnvAt(mars.state, pid), bs = bodyEnvAt(ship.state, pid), pm = placeEnvAt(mars.state), ps = placeEnvAt(ship.state);
      console.log(`      Melas's range: the place says outdoors ${pm.outdoors}, the body ${bm.outdoors} (${bm.key}); under ship-1g: the place ${ps.outdoors}, the body ${bs.outdoors} (${bs.key}), ${bs.pKpa} kPa at ${bs.airC} °C, ${bs.gG} G`);
      assert(pm.outdoors && bm.outdoors && bm.key === `0.38|-10|1|${bm.outfit}|${bm.lonEDeg}`, JSON.stringify(bm));
      assert(!ps.outdoors && bs.outdoors === ps.outdoors && bs.airC === 20 && bs.gG === 1, `one answer under the preset: the place ${ps.outdoors}, the body ${bs.outdoors}`);
    },
  },
  {
    name: 'no quiet Melas in the body clock\'s readers (TECH §1.4): stagesOf, cuesOf, stripOf, wordsOf and pEffOf throw without the site\'s longitude, and with Melas\'s give what they gave',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED }), s = g.state, b = bodyOf(s, s.player.id), ms = s.clock.ms, lon = lonOf(s);
      const bare = { stagesOf: throws(() => stagesOf(b, ms)), cuesOf: throws(() => cuesOf(b, ms)), stripOf: throws(() => stripOf(b, ms)), wordsOf: throws(() => wordsOf(b, ms)), pEffOf: throws(() => pEffOf(b, ms)), nan: throws(() => cuesOf(b, ms, NaN)) };
      for (const [k, v] of Object.entries(bare)) console.log(`      ${k} with no longitude: ${v ? `throws (${v})` : 'DOES NOT THROW'}`);
      const fat = stagesOf(b, ms, lon).fatigue, tired = cuesOf(b, ms, lon).tiredK;
      console.log(`      with Melas's ${fmt(lon, 2)}° E: fatigue '${fat.band}', tiredK ${fmt(tired, 3)}, the strip ${stripOf(b, ms, lon).map(e => e.fill).join('')}`);
      assert(Object.values(bare).every(Boolean), JSON.stringify(bare));
      assert(lon === lonOfSite('melas') && Number.isFinite(tired), JSON.stringify({ lon, tired }));
    },
  },
  {
    name: 'one home for Mars\'s numbers: a ground\'s surface is its body\'s ground (BODIES), sun.js\'s obliquity and radius are BODIES.mars\'s, and BODIES.mars.dayH is the game clock\'s sol to the millisecond',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: SEED }), s = g.state;
      const open = surfaceAt(s, 200, 200, 'melas.ground'), src = readFileSync(path.join(root, 'src/sim/places/model.js'), 'utf8');
      const literal = /return\s+['"]regolith['"]/.test(src);
      console.log(`      the valley floor off the paths: '${open}' (BODIES.mars.ground '${BODIES.mars.ground}'); model.js ${literal ? 'STILL returns a literal regolith' : 'returns no literal regolith'}`);
      console.log(`      sun.js: obliquity ${MARS_OBLIQUITY_DEG}° and radius ${MARS_R_KM} km against BODIES.mars ${BODIES.mars.obliquityDeg}°, ${BODIES.mars.radiusKm} km; the sol ${BODIES.mars.dayH} h = ${fmt(BODIES.mars.dayH * HOUR_MS, 3)} ms against SOL_MS ${SOL_MS}`);
      assert(open === BODIES.mars.ground && !literal, JSON.stringify({ open, literal }));
      assert(MARS_OBLIQUITY_DEG === BODIES.mars.obliquityDeg && MARS_R_KM === BODIES.mars.radiusKm && Math.round(BODIES.mars.dayH * HOUR_MS) === SOL_MS, JSON.stringify(BODIES.mars));
      // (the lonOf rule's one home: model.js siteLonOf, env.js lonOfSite reading it)
      const off = { id: 'hull', body: 'none', clock: 'utc' };
      assert(/not on Mars's clock/.test(throws(() => lonOfSite(off)) ?? '') && lonOfSite('melas') === lonOf(s), 'lonOfSite and lonOf agree, and throw off Mars the same');
    },
  },
  {
    name: 'a round\'s trace with no gravity throws (penetrate.js traceRound: never a quiet 0 G), and with the place\'s it flies as before',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: SEED }), s = g.state, me = meOf(s);
      const from = { x: me.x, y: 0.3, z: me.z }, noG = { pKpa: 65.9, airC: -10, molarKgMol: 0.02962, vacuum: false };
      const err = throws(() => traceRound(s, { from, yawRad: 0, env: noG, maxM: 30 }));
      const ok = traceRound(s, { from, yawRad: 0, maxM: 30 });
      console.log(`      an env with no gMs2: ${err ? `throws (${err})` : 'FLIES AT 0 G'}; the place's: stopped by ${ok.stoppedBy.kind} after ${ok.path.length} points`);
      assert(err && ok.path.length > 0, err);
    },
  },
  {
    name: 'a live override is checked before it is written and when a save loads (env.js setLiveEnv, upgradeEnv): a bad gravity throws and leaves the state\'s override as it was; a set temperature is honoured, alone or with its air',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: SEED }), s = g.state;
      setLiveEnv(s, { preset: 'ship-1g' });
      const before = JSON.stringify(s.places.live.env);
      const bad = { noRegime: throws(() => setLiveEnv(s, { preset: 'ship-1g', gravity: { gG: 2 } })), thrustNoG: throws(() => setLiveEnv(s, { gravity: { regime: 'thrust' } })), air: throws(() => setLiveEnv(s, { air: 'vacuum-x' })), temp: throws(() => setLiveEnv(s, { airC: 'warm' })) };
      const after = JSON.stringify(s.places.live.env), still = airAt(s).pKpa;
      for (const [k, v] of Object.entries(bad)) console.log(`      ${k}: ${v ? `throws (${v})` : 'WRITTEN'}`);
      console.log(`      the override before ${before}, after ${after}; the air still reads ${still} kPa`);
      assert(Object.values(bad).every(Boolean) && before === after && still === 66, JSON.stringify({ bad, before, after }));
      // (a saved override with a bad gravity fails at the load's upgrade, not at the first tick)
      const saved = { places: { live: { site: 'test', area: 'test.rooms', env: { preset: null, gravity: { regime: 'thrust' }, rev: 1 } } } };
      const up = throws(() => upgradeEnv(saved));
      console.log(`      a save's override with a thrust and no value: ${up ? `the upgrade throws (${up})` : 'LOADS'}`);
      assert(up, 'upgradeEnv refuses a bad gravity');
      // (the temperature: a hot deck under the indoor standard, and a cold one with no air named)
      setLiveEnv(s, { air: 'martian-indoor', airC: 30 });
      const hot = airAt(s);
      setLiveEnv(s, { preset: 'ship-1g', airC: 5 });
      const cold = airAt(s);
      setLiveEnv(s, { preset: 'ship-1g' });
      const set = airAt(s);
      console.log(`      martian-indoor at 30 °C: ${hot.airC} °C, c ${fmt(hot.soundMs, 1)} m/s, ρ ${fmt(hot.rhoKgM3, 3)}; ship-1g at 5 °C: ${cold.air} ${cold.airC} °C, c ${fmt(cold.soundMs, 1)}; ship-1g alone: ${set.airC} °C, c ${fmt(set.soundMs, 1)}`);
      assert(hot.airC === 30 && cold.airC === 5 && cold.air === 'martian-indoor' && set.airC === 20 && hot.soundMs > set.soundMs && cold.soundMs < set.soundMs, JSON.stringify({ hot, cold, set }));
    },
  },
  {
    name: 'the sky is the host\'s under a preset, in the sim as in the light: test-handling\'s range under &env=ship-1g reads Mars\'s open sky in skyOf and in envAt, as skyAt lights it; the bay\'s floor is under no sky either way',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: SEED, env: 'ship-1g' }), s = g.state, L = s.places.live;
      const sim = skyOf(s, L.site, L.area), light = skyAt(L.site, s.clock.ms), E = placeEnvAt(s);
      const b = createGame({ scenario: 'barracks', seed: SEED, env: 'ship-1g' }), bay = skyOf(b.state, b.state.places.live.site, b.state.places.live.area);
      console.log(`      the range under ship-1g: skyOf ${sim.cls} (outside ${sim.outside}), envAt's sky ${E.sky}, skyAt level ${light.level} (${light === NO_SKY ? 'no sky' : 'Mars\'s rows'}); the bay's floor: ${bay.cls}`);
      assert(sim.cls === 'mars-air' && E.sky === 'open' && light !== NO_SKY && bay.cls === 'none', JSON.stringify({ sim, sky: E.sky, bay }));
    },
  },
  {
    name: 'a bang in vacuum is its flash alone (COMBAT §11.4, BODY §17.3): under freefall-vacuum the bang behind an unprotected marine pools nothing and deafens no one, a blank beside him and the din pool nothing; at Melas the same bang deafens and startles as in v0.0.10',
    fn() {
      const run = (env) => {
        const g = createGame({ scenario: 'test-pairs', seed: SEED, env }), s = g.state, pid = s.player.id, me = meOf(s);
        earsOff(s, pid);
        const out = bang(s, g.bus, { id: 'fix:vac', x: me.x - 1.5, z: me.z, atMs: s.clock.ms }).find(r => r.who === pid);
        const blank = shotNoise(s, g.bus, { id: 'fix:blank', x: me.x + 0.9, z: me.z, byId: 'nobody', blank: true }).filter(r => r.who === pid);
        const din = dinOf(s, g.bus, { id: 'fix:din', x: me.x + 3, z: me.z }).filter(r => r.who === pid);
        return { vacuum: airAt(s).vacuum, felt: out?.felt ?? 0, startleMs: out?.startleMs ?? 0, deafMs: Number.isFinite(out?.deafUntilMs) ? out.deafUntilMs - s.clock.ms : 0, supp: s.actors.list.find(a => a.who === pid)?.combat?.supp ?? 0, blank: blank.length, din: din.length };
      };
      const M = run(null), V = run('freefall-vacuum'), E = run('europa-surface');
      for (const [k, r] of Object.entries({ Melas: M, 'free fall in vacuum': V, Europa: E })) console.log(`      ${k}: vacuum ${r.vacuum}; the bang felt ${r.felt}, startle ${r.startleMs} ms, deaf ${r.deafMs} ms, the pool ${r.supp}; a blank beside him wrote ${r.blank}, the din ${r.din}`);
      assert(!M.vacuum && M.felt > 0 && M.deafMs > 0 && M.startleMs > 0, JSON.stringify(M));
      for (const r of [V, E]) assert(r.vacuum && r.felt === 0 && r.deafMs === 0 && r.startleMs === 0 && r.supp === 0 && r.blank === 0 && r.din === 0, JSON.stringify(r));
    },
  },
  {
    name: 'the blast\'s dust and the head plate end where their fall does (VIEWS: effects take their real time): on Europa a prone mote still flies at 1.3 s and the plate is still falling at 1.2 s; in free fall the plate drifts and is gone, never snapped to the ground; at Melas both are v0.0.10\'s (DUST_MS 1,200, the plate down by 1.0 s)',
    fn() {
      const EUROPA = BODIES.europa.gG * 9.80665, MARS = 3.727, fire = { atMs: 0, x: 0, z: 0, face: 'right', stance: 'prone' };
      const life = { mars: dustMsOf(MARS), europa: dustMsOf(EUROPA), free: dustMsOf(0) };
      const air = (ms, g) => dustPixels(fire, ms, PPM, g).filter(p => !p.flat).length;
      const flying = air(1300, EUROPA), marsLate = dustPixels(fire, 500, PPM, MARS).length, marsGone = dustPixels(fire, 1200, PPM, MARS).length;
      const plate = { mars1000: plateLow(1000, MARS), europa1200: plateLow(1200, EUROPA), europa1700: plateLow(1700, EUROPA), free1000: plateLow(1000, 0), free1200: plateLow(PLATE_FALL_MS + 100, 0) };
      console.log(`      the dust's life: Melas ${life.mars} ms, Europa ${life.europa} ms, free fall ${life.free} ms (DUST_MS ${DUST_MS}; the float band under ${CASE_FLOAT_MS2} m/s²); Europa at 1.3 s: ${flying} motes in the air; Melas at 500 ms ${marsLate} motes, at 1,200 ms ${marsGone}`);
      console.log(`      the plate's lowest pixel: Melas at 1.0 s ${fmt(plate.mars1000, 3)} m; Europa at 1.2 s ${fmt(plate.europa1200, 3)} m, at 1.7 s ${fmt(plate.europa1700, 3)} m; free fall at 1.0 s ${fmt(plate.free1000, 3)} m, at ${PLATE_FALL_MS + 100} ms ${plate.free1200 === null ? 'gone' : fmt(plate.free1200, 3)}`);
      assert(life.mars === DUST_MS && life.free === DUST_MS && life.europa > 1300 && flying > 0 && marsLate > 0 && marsGone === 0, JSON.stringify({ life, flying, marsLate, marsGone }));
      // (lying, the plate's lowest pixel is the flat disc's on the ground, lifted toward the camera: Melas's at 1.0 s)
      const lying = plate.mars1000;
      assert(plate.europa1700 === lying && plate.europa1200 > lying + 0.3 && plate.free1000 > lying + 1 && plate.free1200 === null, JSON.stringify(plate));
    },
  },
  {
    name: 'the DI\'s grooming day and taps window are the site\'s Plan of the Day (env.js routineOf), not hours of its own: no 05:00 or 21:50 literal in the instinct\'s base rules',
    fn() {
      const src = readFileSync(path.join(root, 'src/sim/skills/instinct/base.js'), 'utf8').split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
      const own = [...src.matchAll(/21 \+ 50 \/ 60|h >= 5 &&|k\.h >= 22|k\.h < 22|k\.h >= 21\b|h < 5\.5/g)].map(m => m[0]);
      console.log(`      the base rules' own hours: ${own.length ? own.join(', ') : 'none (reveille, taps from the site\'s routine)'}`);
      assert(!own.length && /routineOf\(siteAt\(state\)\)/.test(src), own.join(', '));
    },
  },
  {
    name: 'a filtered test run claims no browser port and prints no quiet lanes when no browser file can hold a test the filter keeps (tests/run.mjs)',
    timeoutMs: 120_000,
    fn() {
      const out = execFileSync(process.execPath, [path.join(root, 'tests', 'run.mjs'), 'env-fixes-nothing-matches ›'], { cwd: root, encoding: 'utf8', env: { ...process.env, QUICK: '1', OLYMPUS_RUN_WORKER: '' } });
      const head = out.split('\n').find(l => /files on \d+ workers/.test(l)) ?? '', lanes = /the quiet lanes/.test(out), tail = out.trim().split('\n').at(-1);
      console.log(`      ${head.trim()}`);
      console.log(`      the quiet lanes' header ${lanes ? 'PRINTED' : 'not printed'}; ${tail}`);
      assert(/with a browser port \(none\)/.test(head) && !lanes && /^0 passed, 0 failed/.test(tail), out.slice(-600));
    },
  },
  {
    name: 'an unknown &env is a toast, not a dead page: ?play=barracks&env=vacuum starts the barracks in the site\'s own environment and says "No environment \'vacuum\'"',
    heavy: true,
    timeoutMs: 120_000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || 8238;
      await withGame(async (page) => {
        const r = await page.evaluate(() => ({ toast: [...document.querySelectorAll('.toast')].map(t => t.textContent), area: window.__olympus.state?.places?.live?.area ?? null, env: window.__olympus.state?.places?.live?.env ?? null }));
        console.log(`      the page: area ${r.area}, live env ${JSON.stringify(r.env)}; the toasts: ${JSON.stringify(r.toast)}`);
        assert(r.area === 'melas.echo.1' && !r.env && r.toast.some(t => /No environment 'vacuum'/.test(t)), JSON.stringify(r));
      }, { port, query: 'play=barracks&env=vacuum&nostore=1&seed=48213' });
    },
  },
];
