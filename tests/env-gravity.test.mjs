// Gravity wired (ROADMAP "anywhere", step 2; TECH §1.4; PLACES §3.11, §3.16; CONTRACTS §21): the gaits, the stance
// times, the brass, the range's dust, the footsteps and the wind read the place's environment, and &env=<preset> runs a
// scene under any preset.
//   - env-gait-sweep: at 0, 0.0006 (Phobos), 0.029 (Ceres), 0.049, 0.05, 0.134 (Europa), 0.3, 0.38 (Mars), 1, 1.2, 2, 3,
//     3.5 and 5 G: no NaN and no Infinity in the gaits, any stance change, a case's flight or the range's dust; a mode
//     at every g; nobody faster than at 1 G above it (the audit's probe had a 3 G sprint at 8.81 m/s), and slower the
//     heavier; free fall never a zero-speed trap;
//   - the plan's 1 G row in a game: test-handling under &env=ship-1g walks at 1.45, runs at 3.60 and sprints at 6.00
//     m/s, gets down to prone in about 0.9 s, a standing case lands in 0.53 s (and a fired one at its stance's fall),
//     sound travels at 339 m/s, and no wind blows on a deck; the same scene at Melas is v0.0.10's numbers;
//   - the branches in play: a 3 G burn walks no faster than 1 G; Europa's run is a bound; a coasting deck floats at the
//     push-off's speeds with no foot-falls, a stance there is finite, and a save made floating carries on byte for byte;
//   - the debug parameter: readParams takes &env=<preset>, the sim's newGame sets it live, an unknown one throws;
//   - (heavy) the page: ?play=test-handling&env=ship-1g&nostore=1 boots with no errors under ship-1g.
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { withGame } from './browser.mjs';
import { toJSON } from '../src/core/state.js';
import { q } from '../src/core/num.js';
import { G0_MS2 } from '../src/core/phys.js';
import { readParams } from '../src/core/debug.js';
import { gravityAt, soundMsAt, setLiveEnv } from '../src/sim/places/env.js';
import { gaitSpeeds, gaitsOf, placeGaits } from '../src/sim/body/motion.js';
import { stanceMs, STANCES } from '../src/sim/combat/steps.js';
import { stanceMsOf } from '../src/sim/arms/shooting.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { ejectCase, caseAt, caseGMs2, CASE_G_STEP_MS2 } from '../src/sim/arms/look.js';
import { readWind } from '../src/sim/arms/wind.js';
import { dustPixels, bermDustPixels } from '../src/render/range-items.js';
import { stepVoice, createStepScheduler } from '../src/ui/audio/steps.js';
import { rangeBot } from './bots/range.mjs';
import { TICK_MS } from '../src/core/clock.js';

const SWEEP_G = [0, 0.0006, 0.029, 0.049, 0.05, 0.134, 0.3, 0.38, 1, 1.2, 2, 3, 3.5, 5];
const SPEEDS = ['strollMs', 'walkMs', 'runMs', 'sprintMs'];
const finite = (o) => JSON.stringify(o, (k, v) => (typeof v === 'number' && !Number.isFinite(v) ? `!${v}` : v)).includes('"!') === false;
const throws = (fn) => { try { fn(); return null; } catch (e) { return e.message; } };
const GUN = { model: 'r7' };

// (the player's metres over n ticks of a held input, on the live area)
function metres(g, n, input) {
  const a = () => g.state.actors.list.find(x => x.id === g.state.player.actor);
  const x0 = a().x, z0 = a().z;
  g.step(n, input);
  return { m: Math.hypot(a().x - x0, a().z - z0), gait: a().gait };
}

export default [
  {
    name: 'env-gait-sweep: from 0 to 5 G no gait, stance, case or mote is NaN or Infinity, every g has a mode, nobody is faster than at 1 G above it and the heavier is never the faster, and free fall moves at the push-off\'s speeds',
    fn() {
      const one = gaitSpeeds({ gG: 1 }), rows = [], bad = [];
      let last = null;
      for (const gG of SWEEP_G) {
        const s = gaitSpeeds({ gG }), gMs2 = q(gG * G0_MS2, CASE_G_STEP_MS2);
        const stances = STANCES.flatMap(a => STANCES.map(b => stanceMs(a, b, { gG })));
        const rec = ejectCase(GUN, { x: 0, z: 0, yawRad: 0, stance: 'stand' }, { atMs: 1000, key: `sweep:${gG}`, gMs2 });
        const fly = [caseAt(rec, 1000 + (rec.landMs - 1000) / 2, gMs2), caseAt(rec, rec.landMs + 10, gMs2)];
        const dust = [200, 600, 1100].flatMap(t => dustPixels({ atMs: 0, x: 0, z: 0, face: 'right', stance: 'prone' }, t, 16, gMs2));
        const berm = [100, 500].flatMap(t => bermDustPixels({ x: 0, y: 1, z: 0, atMs: 0 }, t, 16, gMs2));
        const step = stepVoice('concrete', 'walk', { gG, pKpa: 66 });
        const row = { gG, s, stances, rec, fly, dust: dust.length, berm: berm.length };
        if (!finite({ s, stances, rec, fly, dust, berm }) || !s.mode || SPEEDS.some(k => !(s[k] > 0))) bad.push(`${gG} G: ${JSON.stringify(row).slice(0, 300)}`);
        if (JSON.stringify(JSON.parse(JSON.stringify(rec))) !== JSON.stringify(rec)) bad.push(`${gG} G: the case's record is not JSON-safe`);
        if (gG > 1 && SPEEDS.some(k => s[k] > one[k])) bad.push(`${gG} G: faster than 1 G (${SPEEDS.map(k => s[k]).join(', ')})`);
        if (last && last.gG >= 1 && SPEEDS.some(k => s[k] > last.s[k])) bad.push(`${gG} G: faster than ${last.gG} G`);
        if (gG > 0 && !Number.isFinite(step.gainDb)) bad.push(`${gG} G: a footstep's level ${step.gainDb}`);
        rows.push(`${String(gG).padStart(6)} G ${s.mode.padEnd(5)} ${(s.gBand ?? '').padEnd(12)} stroll ${s.strollMs} walk ${s.walkMs} run ${s.runMs}${s.runOk ? '' : ' (no run)'} sprint ${s.sprintMs}${s.sprintOk ? '' : ' (no sprint)'} m/s; to prone ${stanceMs('stand', 'prone', { gG })} ms, kneel to prone ${stanceMs('kneel', 'prone', { gG })}; a standing case ${rec.landMs - 1000} ms${rec.restY !== undefined ? ` (free: held at ${rec.restY} m)` : ''}; motes ${dust.length}+${berm.length}; a step ${fmt(step.gainDb, 1)} dB`);
        last = row;
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      wrong: ${bad.length ? bad.join('; ') : 'none'}`);
      assert(!bad.length, bad.join('\n'));
      // (the branches' edges: the float's push-off speeds, the bound band, the 1 G clamp, the heavy bands)
      const f = gaitSpeeds({ gG: 0 }), b = gaitSpeeds({ gG: 0.134 }), w = gaitSpeeds({ gG: 0.38 }), h3 = gaitSpeeds({ gG: 3 });
      assert(f.mode === 'float' && f.walkMs === 0.6 && f.runMs === 1.2 && f.sprintMs === 2 && f.strollMs === 0.3, JSON.stringify(f));
      assert(b.mode === 'bound' && w.mode === 'walk' && one.mode === 'walk' && gaitSpeeds({ gG: 1.2 }).gBand === 'heavy' && h3.gBand === 'cannot-stand' && !h3.runOk, JSON.stringify({ b, w, h3 }));
      assert(one.walkMs === 1.45 && one.runMs === 3.6 && one.sprintMs === 6 && stanceMs('stand', 'prone', { gG: 0 }) === stanceMs('stand', 'prone', { gG: 0.05 }), 'the 1 G row and the float stance at the band\'s edge');
      assert(throws(() => gaitSpeeds({ gG: -1 })) && throws(() => ejectCase(GUN, { x: 0, z: 0, yawRad: 0 }, { atMs: 0, gMs2: -1 })), 'a negative gravity is an error');
    },
  },
  {
    name: 'the plan\'s 1 G row in a game: test-handling under ship-1g walks at 1.45, runs at 3.60, sprints at 6.00 m/s, gets down to prone in 0.9 s, a standing case lands in 0.53 s, sound goes at 339 m/s and no wind blows on the deck; at Melas the same scene is v0.0.10\'s',
    fn() {
      const out = {};
      for (const env of [null, 'ship-1g']) {
        const g = createGame({ scenario: 'test-handling', seed: 48213, env }), s = g.state, pid = s.player.id, me = s.actors.list.find(a => a.id === s.player.actor);
        const gG = gravityAt(s).gG, gaits = gaitsOf(s, pid), fit = rollerOf(s, pid).value('fitness');
        const rec = ejectCase(GUN, { x: me.x, z: me.z, yawRad: 0, stance: 'stand' }, { atMs: s.clock.ms, key: 'row', gMs2: caseGMs2(s) });
        const wind = readWind(s, pid, { bearingRad: -Math.PI / 2, rangeM: 25 });
        out[env ?? 'melas'] = { gG, preset: s.places.live.env?.preset ?? null, walk: gaits.walkMs, run: gaits.runMs, sprint: gaits.sprintMs, mode: gaits.mode,
          prone: stanceMsOf('stand', 'prone', fit, gG), prone10: stanceMs('stand', 'prone', { gG }), fit, caseMs: rec.landMs - rec.atMs, caseG: caseGMs2(s), soundMs: Math.round(soundMsAt(s) * 10) / 10, windMs: wind.crossMs, place: placeGaits(s).walkMs };
      }
      for (const [k, v] of Object.entries(out)) console.log(`      ${k.padEnd(8)} ${JSON.stringify(v)}`);
      const M = out.melas, S = out['ship-1g'];
      assert(M.gG === 0.38 && M.preset === null && M.walk === 1.14 && M.run === 2.69 && M.sprint === 4.28 && M.prone10 === 1033 && M.caseMs === 867 && M.caseG === 3.727, JSON.stringify(M));
      assert(S.gG === 1 && S.preset === 'ship-1g' && S.walk === 1.45 && S.run === 3.6 && S.sprint === 6 && S.mode === 'walk' && S.place === 1.45, JSON.stringify(S));
      assert(S.prone10 === 901 && S.prone < M.prone && S.fit === M.fit, `stand to prone at 1 G: ${S.prone10} ms at Fitness 10, ${S.prone} at the player's ${S.fit}`); near(S.caseMs, 530, 10, 'a standing case at 1 G:'); near(S.soundMs, 339.4, 0.1, 'sound on the deck:');
      assert(S.windMs === 0 && M.soundMs === 321.6, `no wind on a deck (${S.windMs} m/s); Melas's sound ${M.soundMs}`);
    },
  },
  {
    name: 'a fired case falls at the deck\'s gravity: the range bot\'s first shot prone under ship-1g lands in √(2 × 0.25 / 9.807) s, at Melas in √(2 × 0.25 / 3.727) s as since v0.0.5',
    timeoutMs: 120_000,
    fn() {
      const got = {};
      for (const env of [null, 'ship-1g']) {
        const g = createGame({ scenario: 'test-handling', seed: 48213, env }), bot = rangeBot();
        let rec = null;
        for (let t = 0; t < 20 * 60 * 20 && !rec; t += 20) { g.step(20, bot); rec = (g.state.armoury?.range?.brass ?? []).find(b => b.kind === 'case') ?? null; }
        assert(rec, `${env}: no shot fired`);
        const gMs2 = caseGMs2(g.state), want = Math.round(Math.sqrt(2 * rec.y0 / gMs2) * 1000);
        got[env ?? 'melas'] = { y0: rec.y0, gMs2, landS: (rec.landMs - rec.atMs) / 1000, want: want / 1000, tick: g.state.clock.seq ?? null };
        assert(rec.landMs - rec.atMs === want && rec.restY === undefined, JSON.stringify({ env, rec, want }));
      }
      console.log(`      ${JSON.stringify(got)}`);
      assert(got.melas.gMs2 === 3.727 && got['ship-1g'].gMs2 === 9.807 && got['ship-1g'].landS < got.melas.landS, JSON.stringify(got));
    },
  },
  {
    name: 'the branches in play: a 3 G burn walks and runs no faster than 1 G, Europa\'s run is a bound, a coasting deck floats at the push-off\'s speeds with no foot-falls and a finite stance, and a save made floating carries on byte for byte',
    fn() {
      const g = createGame({ scenario: 'sandbox', seed: 7 }), rows = [], res = {};
      for (const [k, over, input] of [['1 G walk', { preset: 'ship-1g' }, { mx: 1 }], ['1 G run', { preset: 'ship-1g' }, { mx: -1, run: true }],
        ['3 G walk', { preset: 'ship-1g', gravity: { regime: 'thrust', gG: 3 } }, { mx: 1 }], ['3 G run', { preset: 'ship-1g', gravity: { regime: 'thrust', gG: 3 } }, { mx: -1, run: true }],
        ['Europa run', { preset: 'europa-surface' }, { mx: 1, run: true }], ['coast walk', { preset: 'ship-coast' }, { mx: -1 }], ['coast push', { preset: 'ship-coast' }, { mx: 1, run: true }]]) {
        setLiveEnv(g.state, over);
        const r = metres(g, 20, input);
        res[k] = { ms: Math.round(r.m / (20 * TICK_MS / 1000) * 100) / 100, gait: r.gait };
        rows.push(`${k} ${res[k].ms} m/s (${res[k].gait})`);
      }
      const gG = gravityAt(g.state).gG, prone = stanceMs('stand', 'prone', { gG }), sched = createStepScheduler();
      sched.frame({ strideM: 0, gait: 'walk', nowS: 0 });
      const falls = sched.frame({ strideM: 1.2, stepM: 0.03, gait: 'float', nowS: 0.05 });
      console.log(`      ${rows.join('; ')}`);
      console.log(`      coasting: stand to prone ${prone} ms; foot-falls over 1.2 m floating ${falls.length}`);
      assert(res['3 G walk'].ms <= res['1 G walk'].ms && res['3 G run'].ms <= res['1 G run'].ms && res['1 G walk'].ms > 1.4, JSON.stringify(res));
      assert(res['Europa run'].gait === 'bound' && res['coast walk'].gait === 'float' && res['coast push'].gait === 'float', JSON.stringify(res));
      near(res['coast walk'].ms, 0.6, 0.02, 'the push-off walk:'); near(res['coast push'].ms, 1.2, 0.02, 'the hard push:');
      assert(Number.isFinite(prone) && prone > 0 && falls.length === 0, `${prone}, ${falls.length}`);
      // (saved floating, carried on: byte for byte)
      const json = g.save();
      g.step(40, { mx: 1, mz: 1 });
      const a = g.digest(), after = toJSON(g.state);
      g.load(json); g.step(40, { mx: 1, mz: 1 });
      console.log(`      saved floating and carried on 40 ticks: ${a} → ${g.digest()}`);
      assert(a === g.digest() && after === toJSON(g.state), 'byte for byte');
    },
  },
  {
    name: 'the debug parameter: &env=<preset> is read, the sim\'s newGame sets it live on the host before the fill and a save keeps it, an unknown preset throws, a malformed one is dropped',
    fn() {
      const p = readParams('?play=test-handling&env=ship-1g'), none = readParams('?play=test-handling'), odd = readParams('?env=../../x');
      const g = createGame({ scenario: 'test-handling', seed: 48213, env: p.env }), json = g.save();
      const h = createGame({ scenario: 'test-handling', seed: 48213 });
      h.load(json);
      const bad = throws(() => createGame({ scenario: 'sandbox', seed: 1, env: 'mars-but-nicer' }));
      console.log(`      readParams: ${p.env}, ${none.env}, ${odd.env}; live ${JSON.stringify(g.state.places.live.env)}; loaded into another game ${h.state.places.live.env?.preset} at ${gravityAt(h.state).gG} G; unknown: ${bad?.slice(0, 60)}`);
      assert(p.env === 'ship-1g' && none.env === null && odd.env === null, JSON.stringify({ p, none, odd }));
      assert(g.state.places.live.env?.preset === 'ship-1g' && gravityAt(h.state).gG === 1 && bad, 'set, saved, refused');
    },
  },
  {
    name: 'the page under &env=ship-1g: ?play=test-handling&env=ship-1g&nostore=1 boots with no errors, its live environment is ship-1g at 1 G and a second of walking runs clean',
    heavy: true,
    async fn() {
      await withGame(async (page) => {
        const got = await page.evaluate(() => { const s = window.__olympus.state; return { env: s.places.live.env ?? null, area: s.places.live.area }; });
        await page.evaluate(() => window.__olympus.step(20, { mx: 1 }));
        console.log(`      the page: ${JSON.stringify(got)}`);
        assert(got.env?.preset === 'ship-1g', JSON.stringify(got));
      }, { query: 'play=test-handling&seed=48213&env=ship-1g&nostore=1' });
    },
  },
];
