// spin: the spin's closed forms (src/sim/places/spin.js) against an integration in the inertial frame, and against the build sheet 0.0.12 §4's figures (PLACES §4.15; COMBAT §25.10.4; WEAPONS §2.9).
//
// The Wheel (R 500 m, ω 0.1347 rad/s, its floor banked so 1 G is felt over Mars's 0.38) and the Ring (the G-house's,
// R 45 m, the same felt 1 G): a body's Coriolis push by its speed and heading, and a round's offset from the felt-
// gravity path after 3, 5, 7 and 10 m along, against and across the spin, frangible at 790 m/s and a marking round
// at 120 m/s. The integration is spin.py's (/private/tmp/claude-501/olympus-build/1g/spin.py, 2026-11-08) written
// again here: the round flies straight under Mars's pull alone in the inertial frame while the floor turns under it,
// and its place in the floor's frame is compared with a straight line and the felt drop. Fails on an offset off by
// 0.05 cm at the Wheel (at the Ring 0.25 cm or 1.5% of the whole, whose second-order terms grow with ω: a marking
// round there is 0.34 cm off at 10 m of 37 cm), a wrong sign by bearing, the
// sheet's §4 figures missed, spinOf wrong on the places (the Wheel's area, a live preset, a surface, a drum with
// no ω), and ω or a Coriolis term in src's code outside spin.js and the environment's tables (SPIN_HOME).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { assert, fmt, root } from './helpers.mjs';
import { newState } from '../src/core/state.js';
import { G0_MS2 } from '../src/core/phys.js';
import { BODIES, ENV_PRESETS } from '../src/data/places/env.js';
import { setLiveEnv } from '../src/sim/places/env.js';
import { spinOf, spinFrom, bodyPushOf, spinBiasCm, spinWords } from '../src/sim/places/spin.js';

const RANGES = [3, 5, 7, 10], V_FRANGIBLE = 790, V_MARKING = 120;
const HEADINGS = Object.freeze({ along: 0, against: Math.PI, across: Math.PI / 2, inboard: -Math.PI / 2 });
/** The modules allowed to name ω or a Coriolis term in code (SPIN_HOME and the tables that hold R and ω as data). */
const SPIN_OK = new Set(['src/sim/places/spin.js', 'src/data/places/env.js']);

/** spin.py's inertial integration (see the header): the offset from Earth's path after d m, cm { up, side } (side + to the right). */
function inertial({ R, w, gM, d, v, heading }) {
  const SIN = gM / G0_MS2, COS = Math.sqrt(1 - SIN * SIN), n = [-COS, 0, SIN];
  const p0 = [R + 1.5 * n[0], 0, 1.5 * n[2]];
  const u = heading === 0 ? [0, 1, 0] : heading === Math.PI ? [0, -1, 0] : heading > 0 ? [SIN, 0, COS] : [-SIN, 0, -COS];
  const vi = [v * u[0] - w * p0[1], v * u[1] + w * p0[0], v * u[2]];
  let t = d / v, disp = [0, 0, 0];
  for (let k = 0; k < 50; k++) {
    const pi = [p0[0] + vi[0] * t, p0[1] + vi[1] * t, p0[2] + vi[2] * t - 0.5 * gM * t * t], c = Math.cos(-w * t), s = Math.sin(-w * t);
    const pr = [c * pi[0] - s * pi[1], s * pi[0] + c * pi[1], pi[2]];
    disp = pr.map((x, i) => x - p0[i]);
    t += (d - disp.reduce((a, x, i) => a + x * u[i], 0)) / v;
  }
  const exp = u.map((x, i) => x * d - n[i] * 0.5 * G0_MS2 * t * t), err = disp.map((x, i) => x - exp[i]);
  const side = [u[1] * n[2] - u[2] * n[1], u[2] * n[0] - u[0] * n[2], u[0] * n[1] - u[1] * n[0]];
  return { up: err.reduce((a, x, i) => a + x * n[i], 0) * 100, side: err.reduce((a, x, i) => a + x * side[i], 0) * 100 };
}

// (a state on a place: the Wheel's sector, a surface, or a live preset over one)
function stateOn(area, preset = null) {
  const s = newState(1, { version: 'test' });
  s.places.live = { site: 'melas', area };
  if (preset) setLiveEnv(s, { preset });
  return s;
}
// (src's .js files, and their code with the comments and strings blanked)
function srcFiles(dir = path.join(root, 'src'), out = []) {
  for (const f of readdirSync(dir)) { const p = path.join(dir, f); if (statSync(p).isDirectory()) srcFiles(p, out); else if (f.endsWith('.js')) out.push(p); }
  return out;
}
const codeOf = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1').replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g, "''");

export default [
  {
    name: 'spin: the Wheel\'s spin read from its area (R 500 m, ω 0.1347 rad/s, the bank\'s 0.38 across), from a live `wheel` preset, and none on a surface or a drum preset that gives no ω',
    fn() {
      const W = spinOf(stateOn('melas.wheel.s4'), 'melas.wheel.s4'), live = spinOf(stateOn('melas.ground', 'wheel')), ground = spinOf(stateOn('melas.ground')), drum = spinOf(stateOn('melas.ground', 'ceres-drum'));
      console.log(`      the Wheel's sector 4: ${JSON.stringify(W)}; under a live 'wheel' on the ground: ω ${live?.omegaRadS}, acrossK ${live?.acrossK}; Melas's ground ${ground}; 'ceres-drum' (0.3 G, no ω) ${drum}`);
      console.log(`      ω² R ${fmt(W.omegaRadS ** 2 * W.radiusM, 3)} m/s² against the felt 1 G's centripetal part ${fmt(Math.sqrt(1 - BODIES.mars.gG ** 2) * G0_MS2, 3)}; rim ${fmt(W.omegaRadS * W.radiusM, 1)} m/s, ${fmt(W.omegaRadS * 60 / (2 * Math.PI), 2)} rpm`);
      assert(W.radiusM === 500 && W.omegaRadS === 0.1347 && W.alongRad === 0 && W.acrossK === BODIES.mars.gG && Math.abs(W.cosK - 0.924986) < 1e-6 && W.gMs2 === G0_MS2, JSON.stringify(W));
      assert(live?.omegaRadS === ENV_PRESETS.wheel.gravity.spin.omegaRadS && live.alongRad === 0 && ground === null && drum === null, JSON.stringify({ live, ground, drum }));
      assert(Math.abs(W.omegaRadS ** 2 * W.radiusM / (Math.sqrt(1 - BODIES.mars.gG ** 2) * G0_MS2) - 1) < 0.002, 'ω² R is the felt 1 G\'s centripetal part');
    },
  },
  {
    name: 'spin: a body\'s Coriolis push (the sheet\'s §4: 3.4% of its weight at the Combat walk of 1.23 m/s along the spin, 5.6% at the Assault walk of 2.03, 2.1% across), heavier prograde and lighter retrograde, pushed retrograde moving outboard, the push\'s vector in the area\'s frame',
    fn() {
      const W = spinOf(stateOn('melas.wheel.s4'), 'melas.wheel.s4'), rows = [];
      for (const v of [1.23, 1.45, 2.03, 3.0, 3.6, 6.0]) {
        const pro = bodyPushOf(W, { vx: v }), retro = bodyPushOf(W, { vx: -v }), out = bodyPushOf(W, { vz: v });
        rows.push({ v, pro, retro, out });
        console.log(`      ${fmt(v, 2)} m/s: prograde ${fmt(pro.alongK * 100, 1)}% (weight ${pro.weightK > 0 ? '+' : ''}${fmt(pro.weightK * 100, 1)}%, push ${JSON.stringify(pro.pushMs2)} m/s²), retrograde ${fmt(retro.alongK * 100, 1)}%, outboard ${fmt(out.acrossK * 100, 1)}% retrograde (push ${JSON.stringify(out.pushMs2)})`);
      }
      const at = (v) => rows.find(r => r.v === v);
      assert(fmt(at(1.23).pro.alongK * 100, 1) === '3.4' && fmt(at(2.03).pro.alongK * 100, 1) === '5.6' && fmt(at(2.03).out.acrossK * 100, 1) === '2.1', 'the sheet\'s 3.4, 5.6 and 2.1%');
      for (const r of rows) {
        assert(r.pro.weightK > 0 && r.retro.weightK < 0 && r.pro.pushMs2.y < 0 && r.retro.pushMs2.y > 0, `${r.v}: heavier prograde, lighter retrograde`);
        assert(r.out.acrossK > 0 && r.out.pushMs2.x < 0 && r.out.pushMs2.y === 0 && r.pro.pushMs2.z > 0, `${r.v}: outboard pushed retrograde; prograde pushed outboard by the bank`);
        assert(Math.abs(Math.hypot(r.pro.pushMs2.x, r.pro.pushMs2.y, r.pro.pushMs2.z) - 2 * W.omegaRadS * r.v) < 2e-4, `${r.v}: the push's size 2ωv`);
      }
      // (turned with the sector: alongRad π/2 makes +z prograde)
      const turned = bodyPushOf(spinFrom({ ...W, alongRad: Math.PI / 2 }), { vz: 2.03 });
      assert(Math.abs(turned.alongK - at(2.03).pro.alongK) < 1e-6, JSON.stringify(turned));
      console.log(`      a sector turned a quarter (alongRad π/2): 2.03 m/s along +z ${fmt(turned.alongK * 100, 1)}%`);
    },
  },
  {
    name: 'spin: a round\'s spin bias against spin.py\'s inertial integration, frangible at 790 m/s and a marking round at 120 m/s, along, against and across the spin, at the Wheel (within 0.05 cm) and the Ring (R 45 m, within 0.25 cm or 1.5% of the whole); the sheet\'s §4: 0.15, 0.43, 0.84 and 1.71 cm at 3, 5, 7 and 10 m (low prograde, high retrograde), × 0.38 across (0.65 cm at 10 m), a marking round 2.8 cm at 5 m',
    fn() {
      const W = spinOf(stateOn('melas.wheel.s4'), 'melas.wheel.s4'), gM = BODIES.mars.gG * G0_MS2, gc = Math.sqrt(1 - BODIES.mars.gG ** 2) * G0_MS2;
      const ring = spinFrom({ omegaRadS: Math.sqrt(gc / 45), radiusM: 45, acrossK: BODIES.mars.gG });
      const worst = { wheel: 0, ring: 0 }, signs = [];
      for (const [label, S, tol] of [['wheel', W, 0.05], ['ring', ring, 0.25]]) {
        console.log(`      ${label === 'wheel' ? 'the Wheel' : 'the Ring'}: R ${S.radiusM} m, ω ${fmt(S.omegaRadS, 4)} rad/s`);
        for (const v of [V_FRANGIBLE, V_MARKING]) for (const [h, b] of Object.entries(HEADINGS)) {
          const cells = RANGES.map(d => {
            const B = spinBiasCm(S, { rangeM: d, vMs: v, bearingRad: b }), N = inertial({ R: S.radiusM, w: S.omegaRadS, gM, d, v, heading: b });
            worst[label] = Math.max(worst[label], Math.abs(B.upCm - N.up), Math.abs(B.sideCm - N.side));
            const within = Math.max(tol, label === 'ring' ? 0.015 * B.cm : 0);
            if (Math.abs(B.upCm - N.up) > within || Math.abs(B.sideCm - N.side) > within) signs.push(`${label} ${v} ${h} ${d} m: ${JSON.stringify(B)} against ${fmt(N.up, 3)}, ${fmt(N.side, 3)}`);
            if (h === 'along' && !(B.upCm < 0) || h === 'against' && !(B.upCm > 0) || (h === 'across' || h === 'inboard') && B.upCm !== 0 || !(B.sideCm > 0)) signs.push(`${label} ${h} ${d} m: a wrong sign ${JSON.stringify(B)}`);
            return `${d} m ${B.cm} (${fmt(B.upCm, 2)}, ${fmt(B.sideCm, 2)} | ${fmt(N.up, 2)}, ${fmt(N.side, 2)})`;
          });
          console.log(`        ${v} m/s ${h.padEnd(7)}: ${cells.join('  ')}`);
        }
      }
      console.log(`      worst against the integration: the Wheel ${fmt(worst.wheel, 3)} cm, the Ring ${fmt(worst.ring, 3)} cm (cm: the whole ω d² / v; then up and right, closed form | integrated)`);
      assert(!signs.length, signs.slice(0, 6).join('\n'));
      const fr = RANGES.map(d => spinBiasCm(W, { rangeM: d, vMs: V_FRANGIBLE }).cm), across10 = spinBiasCm(W, { rangeM: 10, vMs: V_FRANGIBLE, bearingRad: Math.PI / 2 }).sideCm, mark5 = spinBiasCm(W, { rangeM: 5, vMs: V_MARKING }).cm;
      console.log(`      the sheet's §4: frangible ${fr.join(', ')} cm at ${RANGES.join(', ')} m; across at 10 m ${across10} cm; a marking round at 5 m ${mark5} cm; "${spinWords(W, { vMs: V_FRANGIBLE })}"`);
      assert(fr.join() === '0.15,0.43,0.84,1.71' && across10 === 0.65 && fmt(mark5, 1) === '2.8', JSON.stringify({ fr, across10, mark5 }));
    },
  },
  {
    name: 'spin: SPIN_HOME, no ω and no Coriolis term in src\'s code outside src/sim/places/spin.js and the environment\'s tables (src/data/places/env.js holds R and ω as data)',
    fn() {
      const files = srcFiles(), bad = [];
      const re = /\bomegaRadS\b|\bcoriolis\w*\b|\bOMEGA\w*\b/gi;
      for (const f of files) {
        const r = path.relative(root, f).split(path.sep).join('/');
        if (SPIN_OK.has(r)) continue;
        for (const m of codeOf(readFileSync(f, 'utf8')).matchAll(re)) bad.push(`${r}: ${m[0]}`);
      }
      console.log(`      ${files.length} modules; allowed ${[...SPIN_OK].join(', ')}; found elsewhere ${bad.length ? bad.join(', ') : 'none'}`);
      assert(!bad.length, bad.join('\n'));
    },
  },
];
