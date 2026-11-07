// OLYMPUS arms: the round in flight, in every air and gravity the game knows, from tables built once (WEAPONS §2.1, §2.4, §2.5, §2.7, §8.1; the build sheet 0.0.7 §2.1).
//
// One model answers every ballistic question: a point mass with the standard G7 drag function (the
// long-range shooter's model), its retardation a = ρ v² Cd_G7(M) π / (8 BC), BC the load's G7
// coefficient in lb/in² × 703.07 (kg/m²), the Mach number on the local speed of sound. The air is
// the place's: ρ = P M / (R T) and c = √(1.4 R T / M), M 29.62 g/mol for Martian air (outdoors and
// in: the hub's mix) and 28.96 for Earth's (ENV_CLASSES, WEAPONS §2.1's table); vacuum has no air and
// no sound. The muzzle velocity is the load's at its reference barrel, scaled by (barrel / ref)^vExp.
//
// **The tables are on the bore line** (WEAPONS §2.1, the review's): for each calibre, load and barrel,
// boreTable() integrates, once and with no gravity and no angle, the time of flight t(d), the speed v(d)
// and the drop per unit gravity D(d) (s²: the drop 1 m/s² would give), every STEP_M 5 m to MAX_M, on a
// small grid of air density (GRID_RHO 0 to 1.25 kg/m³), speed of sound (GRID_C 310, 345 m/s) and muzzle
// velocity (GRID_V0K 0.92, 1.00, 1.08 of the barrel's). For flat fire the drop is linear in gravity, so
// gravity needs no axis: free fall, Mars, Europa and a 1 g deck read the same table, and for any place
//     path(d)  = d tan θ − g D(d) − h      (h OPTIC_H_M 0.065 m, the SO-4 over the bore; θ the zero's sight angle)
//     drift(d) = crossMs × (t(d) − d / v0) (Didion's lag rule, full value)
// with t, v and D read trilinearly at the place's (ρ, c) and the gun's muzzle velocity, D × v0² and
// t × v0 across the velocity axis (nearly linear there), linearly between the 5 m steps. A lookup is a
// few dozen multiplies and allocates nothing (its answer object is the table's own, overwritten by the
// next call: flight() copies it out). integrate() is the direct 2-D integration the tables are tested
// against (the ballistics suite: the worst path error at 500 m in five random places and zeroes).
//
// **The zero** (WEAPONS §2.5) is a sight angle set in one environment: tan θ = (h + g_z D_z(R)) / R,
// kept with where it came from (zeroOf: { rangeM, gMs2, rhoKgM3, soundMs, v0Ms, angleMrad }). The
// Corps' battle-sight zero is BZO_M 400 m on the valley floor (BZO_ENV 'mars-valley': 65.9 kPa, −10 °C,
// 0.38 g, the ground's air in src/data/body/needs.js). A turret click is CLICK_MRAD 0.1 (my call, the
// metric turret: 1 cm at 100 m, 3 cm at 300 m); dopeOf() gives the clicks from the BZO that put the path
// at 0 at a range (DOPE_CARD, what the Corps prints for the R-7 on the valley floor: 200 m 6 down, 300 m
// 3 down, 500 m 4 up), and ZERO25_MARK_CM the BZO's path at 25 m (about 3 cm low), where the 25 m
// zeroing card prints its mark under the aim box. flight() is the one helper every reader calls.
//
// **What arrives** (WEAPONS §8.1, §8.2): energy ½ m v², penetration pen0 × (v / v0)^penExp mm RHAe, and
// the wound factor w = (E / 500 J)^0.36 × (dia / 9 mm)^0.3 × woundK (woundFactor). Supersonic while
// v > c; in vacuum nothing cracks (WEAPONS §2.7).
// Pure (the tables are a module cache of derived numbers, never state).
import { G_MELAS, GROUND_KPA, OUTDOOR_C, FLOOR_KPA, ROOM_C } from '../../data/body/needs.js';
import { areaOf } from '../places/model.js';
import { CALIBRES, loadOf } from './calibres.js';
import { MODELS } from './models.js';

/** Earth's standard gravity (m/s²), the gas constant (J/mol/K), air's ratio of heats, the molar masses of Martian and Earth air (kg/mol). */
export const G0_MS2 = 9.80665, R_GAS = 8.314462618, GAMMA_AIR = 1.4, MARS_AIR_KG_MOL = 0.02962, EARTH_AIR_KG_MOL = 0.02896;
/** A G7 coefficient in lb/in² to kg/m². */
export const BC_KG_M2 = 703.07;
/** The optic's height over the bore (WEAPONS §2.5), m. */
export const OPTIC_H_M = 0.065;
/** The Corps' battle-sight zero (WEAPONS §2.5): its range and the place it is set in. */
export const BZO_M = 400, BZO_ENV = 'mars-valley';
/** The tables' step and reach (m), their grid (WEAPONS §2.1). */
export const STEP_M = 5, MAX_M = 1500;
export const GRID_RHO = Object.freeze([0, 0.4, 0.8, 1.0, 1.25]), GRID_C = Object.freeze([310, 345]), GRID_V0K = Object.freeze([0.92, 1.00, 1.08]);
/** The integration's step along the bore (m): RK4, so a metre is far finer than the 5 m table needs. */
export const INTEGRATE_DX_M = 1;
/** A turret click (my call: the metric turret), mrad. */
export const CLICK_MRAD = 0.1;

/**
 * The places' air and gravity by class (WEAPONS §2.1's table): { word, gMs2, pKpa, airC, molarKgMol, vacuum }.
 * The classes name the tables WEAPONS prints; the sim reads a place's own env (envOfPlace).
 */
export const ENV_CLASSES = Object.freeze({
  earth: Object.freeze({ word: 'Earth at sea level', gMs2: 9.80665, pKpa: 101.325, airC: 15, molarKgMol: EARTH_AIR_KG_MOL, vacuum: false }),
  'mars-valley': Object.freeze({ word: 'the Melas valley floor', gMs2: G_MELAS * G0_MS2, pKpa: GROUND_KPA, airC: OUTDOOR_C, molarKgMol: MARS_AIR_KG_MOL, vacuum: false }),
  'mars-datum': Object.freeze({ word: 'Mars at the datum', gMs2: G_MELAS * G0_MS2, pKpa: 52, airC: -25, molarKgMol: MARS_AIR_KG_MOL, vacuum: false }),
  'ship-thrust': Object.freeze({ word: 'an MCRN hull under 1 g', gMs2: 9.80665, pKpa: 66, airC: 20, molarKgMol: MARS_AIR_KG_MOL, vacuum: false }),
  'ship-light': Object.freeze({ word: 'an MCRN hull under 0.3 g', gMs2: 0.3 * 9.80665, pKpa: 66, airC: 20, molarKgMol: MARS_AIR_KG_MOL, vacuum: false }),
  'freefall-air': Object.freeze({ word: 'a coasting MCRN deck', gMs2: 0, pKpa: 66, airC: 20, molarKgMol: MARS_AIR_KG_MOL, vacuum: false }),
  'earth-ship': Object.freeze({ word: 'a UN hull at Earth standard', gMs2: 9.80665, pKpa: 101.3, airC: 21, molarKgMol: EARTH_AIR_KG_MOL, vacuum: false }),
  europa: Object.freeze({ word: 'Europa\'s surface', gMs2: 1.314, pKpa: 0, airC: -170, molarKgMol: 0, vacuum: true }),
  'freefall-vacuum': Object.freeze({ word: 'free fall in vacuum', gMs2: 0, pKpa: 0, airC: 0, molarKgMol: 0, vacuum: true }),
});

/** The G7 standard drag function: [Mach, Cd] (the published table, Mach 0 to 5). */
export const G7 = Object.freeze([
  [0.00, 0.1198], [0.05, 0.1197], [0.10, 0.1196], [0.15, 0.1194], [0.20, 0.1193], [0.25, 0.1194], [0.30, 0.1194], [0.35, 0.1194], [0.40, 0.1193],
  [0.45, 0.1193], [0.50, 0.1194], [0.55, 0.1193], [0.60, 0.1194], [0.65, 0.1197], [0.70, 0.1202], [0.725, 0.1207], [0.75, 0.1215], [0.775, 0.1226],
  [0.80, 0.1242], [0.825, 0.1266], [0.85, 0.1306], [0.875, 0.1368], [0.90, 0.1464], [0.925, 0.1660], [0.95, 0.2054], [0.975, 0.2993], [1.0, 0.3803],
  [1.025, 0.4015], [1.05, 0.4043], [1.075, 0.4034], [1.10, 0.4014], [1.125, 0.3987], [1.15, 0.3955], [1.20, 0.3884], [1.25, 0.3810], [1.30, 0.3732],
  [1.35, 0.3657], [1.40, 0.3580], [1.50, 0.3440], [1.55, 0.3376], [1.60, 0.3315], [1.65, 0.3260], [1.70, 0.3209], [1.75, 0.3160], [1.80, 0.3117],
  [1.85, 0.3078], [1.90, 0.3042], [1.95, 0.3010], [2.00, 0.2980], [2.05, 0.2951], [2.10, 0.2922], [2.15, 0.2892], [2.20, 0.2864], [2.25, 0.2835],
  [2.30, 0.2807], [2.35, 0.2779], [2.40, 0.2752], [2.45, 0.2725], [2.50, 0.2697], [2.55, 0.2670], [2.60, 0.2643], [2.65, 0.2615], [2.70, 0.2588],
  [2.75, 0.2561], [2.80, 0.2533], [2.85, 0.2506], [2.90, 0.2479], [2.95, 0.2451], [3.00, 0.2424], [3.10, 0.2368], [3.20, 0.2313], [3.30, 0.2258],
  [3.40, 0.2205], [3.50, 0.2154], [3.60, 0.2106], [3.70, 0.2060], [3.80, 0.2017], [3.90, 0.1975], [4.00, 0.1935], [4.20, 0.1861], [4.40, 0.1793],
  [4.60, 0.1730], [4.80, 0.1672], [5.00, 0.1618],
].map(r => Object.freeze(r)));
const G7_M = Float64Array.from(G7, r => r[0]), G7_CD = Float64Array.from(G7, r => r[1]);

/** G7's drag coefficient at a Mach number (linear between the table's points; flat past its ends). */
export function cdG7(mach) {
  if (!(mach > 0)) return G7_CD[0];
  const n = G7_M.length;
  if (mach >= G7_M[n - 1]) return G7_CD[n - 1];
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (G7_M[m] <= mach) lo = m; else hi = m; }
  return G7_CD[lo] + (G7_CD[hi] - G7_CD[lo]) * (mach - G7_M[lo]) / (G7_M[hi] - G7_M[lo]);
}

/** A place's air (WEAPONS §2.1): { rhoKgM3, soundMs }; vacuum { 0, 0 }. */
export function airOf(env) {
  if (!env || env.vacuum || !(env.pKpa > 0)) return { rhoKgM3: 0, soundMs: 0 };
  const T = env.airC + 273.15, M = env.molarKgMol || MARS_AIR_KG_MOL;
  return { rhoKgM3: env.pKpa * 1000 * M / (R_GAS * T), soundMs: Math.sqrt(GAMMA_AIR * R_GAS * T / M) };
}
/** The speed of sound in a place (m/s), 0 in vacuum: the hud's delays. */
export const soundMsOf = (env) => airOf(env).soundMs;

/**
 * Where a place stands as the round sees it (the build sheet §2.1): the body's own env (src/sim/body/body.js
 * envOf: the ground 65.9 kPa and −10 °C outdoors, the floors 66.0 kPa and 20 °C in), Martian air, 0.38 g.
 * On the range: 'mars-valley' exactly.
 */
export function envOfPlace(state, area = state?.places?.live?.area ?? null, x = 0, z = 0) {
  const outdoors = (area ? areaOf(area)?.kind : 'ground') === 'ground';
  return { gMs2: G_MELAS * G0_MS2, pKpa: outdoors ? GROUND_KPA : FLOOR_KPA, airC: outdoors ? OUTDOOR_C : ROOM_C, molarKgMol: MARS_AIR_KG_MOL, vacuum: false };
}

/** A load's muzzle velocity from a barrel (WEAPONS §2.1: v = vRef × (barrel / ref)^vExp), m/s. */
export function v0Of(cal, load = 'ball', barrelMm = null) {
  const L = loadOf(cal, load);
  if (!L || !L.vRefMs) return 0;
  return L.vRefMs * Math.pow((barrelMm ?? L.refBarrelMm) / L.refBarrelMm, L.vExp ?? 0.18);
}
/** The load's G7 coefficient in kg/m². */
const bcOf = (L) => (L.bcG7 ?? 0.2) * BC_KG_M2;

// (the bore line, no gravity: dv/dx = −a/v, dt/dx = 1/v, and the drop of a unit gravity, dvy/dx = (−1 − (a/v) vy) / v, dy/dx = vy / v)
function boreDeriv(x, s, out, rho, c, k) {
  const v = s[1], mach = c > 0 ? v / c : 0, a = rho > 0 ? k * rho * v * v * cdG7(mach) : 0, av = a / v;
  out[0] = 1 / v; out[1] = -av; out[2] = (-1 - av * s[2]) / v; out[3] = s[2] / v;
}

/** Integrate the bore line at one grid point: Float64Array [t, v, D] every STEP_M to MAX_M (see the header). */
function boreRun(L, v0, rho, c, maxM = MAX_M) {
  const n = Math.round(maxM / STEP_M) + 1, out = new Float64Array(n * 3), k = Math.PI / (8 * bcOf(L));
  const s = new Float64Array([0, v0, 0, 0]), k1 = new Float64Array(4), k2 = new Float64Array(4), k3 = new Float64Array(4), k4 = new Float64Array(4), tmp = new Float64Array(4);
  const dx = INTEGRATE_DX_M, per = Math.round(STEP_M / dx);
  out[0] = 0; out[1] = v0; out[2] = 0;
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < per; j++) {
      const x = ((i - 1) * per + j) * dx;
      boreDeriv(x, s, k1, rho, c, k);
      for (let q = 0; q < 4; q++) tmp[q] = s[q] + 0.5 * dx * k1[q];
      boreDeriv(x + dx / 2, tmp, k2, rho, c, k);
      for (let q = 0; q < 4; q++) tmp[q] = s[q] + 0.5 * dx * k2[q];
      boreDeriv(x + dx / 2, tmp, k3, rho, c, k);
      for (let q = 0; q < 4; q++) tmp[q] = s[q] + dx * k3[q];
      boreDeriv(x + dx, tmp, k4, rho, c, k);
      for (let q = 0; q < 4; q++) s[q] += dx / 6 * (k1[q] + 2 * k2[q] + 2 * k3[q] + k4[q]);
      if (!(s[1] > 1)) s[1] = 1;                                   // (a round that would stop in the air: never on a rifle's table)
    }
    out[i * 3] = s[0]; out[i * 3 + 1] = s[1]; out[i * 3 + 2] = -s[3];
  }
  return out;
}

// (an axis's cell and fraction: the grid's own cell, extrapolating linearly past either end)
function cell(grid, x) {
  const n = grid.length;
  if (n === 1) return [0, 0];
  let i = 0;
  while (i < n - 2 && x > grid[i + 1]) i++;
  return [i, (x - grid[i]) / (grid[i + 1] - grid[i])];
}

const TABLES = new Map();
/**
 * The bore-line table of a calibre, a load and a barrel (see the header), built at first use and cached:
 * { cal, load, barrelMm, v0Ms, stepM, maxM, at(rhoKgM3, soundMs, v0K, rangeM) → { tofS, vMs, dS2 } }. at()'s
 * answer is the table's own object, overwritten by the next call (nothing allocated per call).
 */
export function boreTable(cal, load = 'ball', barrelMm = null) {
  const L = loadOf(cal, load);
  if (!L || !L.vRefMs) throw new Error(`ballistics.boreTable(): no flight for ${cal} ${load}`);
  const bar = barrelMm ?? L.refBarrelMm, key = `${cal}|${load}|${bar}`;
  const had = TABLES.get(key);
  if (had) return had;
  const v0Ref = v0Of(cal, load, bar), n = Math.round(MAX_M / STEP_M) + 1;
  const NR = GRID_RHO.length, NC = GRID_C.length, NV = GRID_V0K.length;
  // (each node: n × [t × v0, D × v0², v], laid out [rho][c][v0K])
  const data = new Float64Array(NR * NC * NV * n * 3);
  for (let ir = 0; ir < NR; ir++) for (let ic = 0; ic < NC; ic++) for (let iv = 0; iv < NV; iv++) {
    const v0 = v0Ref * GRID_V0K[iv], run = boreRun(L, v0, GRID_RHO[ir], GRID_C[ic]), base = ((ir * NC + ic) * NV + iv) * n * 3;
    for (let i = 0; i < n; i++) { data[base + i * 3] = run[i * 3] * v0; data[base + i * 3 + 1] = run[i * 3 + 2] * v0 * v0; data[base + i * 3 + 2] = run[i * 3 + 1]; }
  }
  const res = { tofS: 0, vMs: 0, dS2: 0 };
  const node = (ir, ic, iv) => ((ir * NC + ic) * NV + iv) * n * 3;
  const T = {
    cal, load, barrelMm: bar, v0Ms: v0Ref, stepM: STEP_M, maxM: MAX_M,
    at(rho, c, v0K, rangeM) {
      const [ir, fr] = cell(GRID_RHO, Math.max(0, rho)), [ic, fc] = cell(GRID_C, c > 0 ? c : GRID_C[0]), [iv, fv] = cell(GRID_V0K, v0K);
      const xr = Math.max(0, Math.min(MAX_M, rangeM)) / STEP_M, k = Math.min(n - 2, Math.floor(xr)), fk = xr - k;
      let tv = 0, dv = 0, vv = 0;
      for (let a = 0; a < 2; a++) {
        const wa = a ? fr : 1 - fr;
        for (let b = 0; b < 2; b++) {
          const wb = wa * (b ? fc : 1 - fc);
          for (let e = 0; e < 2; e++) {
            const w = wb * (e ? fv : 1 - fv);
            if (w === 0) continue;
            const o = node(ir + a, ic + b, iv + e) + k * 3;
            tv += w * (data[o] + fk * (data[o + 3] - data[o]));
            dv += w * (data[o + 1] + fk * (data[o + 4] - data[o + 1]));
            vv += w * (data[o + 2] + fk * (data[o + 5] - data[o + 2]));
          }
        }
      }
      const v0 = v0Ref * v0K;
      res.tofS = tv / v0; res.dS2 = dv / (v0 * v0); res.vMs = vv;
      return res;
    },
  };
  TABLES.set(key, T);
  return T;
}

/**
 * The direct integration the tables are tested against (WEAPONS §2.1's [computed] check): a 2-D point mass from
 * the bore, the sight angle angleRad over the line of sight, gravity g, the place's air, to rangeM along the line
 * of sight; RK4 in time at dtS. Returns { tofS, vMs, pathCm } (the path against the line of sight, + high).
 */
export function integrate(cal, load, barrelMm, env, rangeM, { angleRad = 0, v0K = 1, dtS = 0.0002 } = {}) {
  const L = loadOf(cal, load), { rhoKgM3: rho, soundMs: c } = airOf(env), g = env.gMs2 ?? 0, k = Math.PI / (8 * bcOf(L));
  const v0 = v0Of(cal, load, barrelMm) * v0K;
  const f = (s) => {
    const v = Math.hypot(s[2], s[3]), a = rho > 0 ? k * rho * v * v * cdG7(c > 0 ? v / c : 0) : 0;
    return [s[2], s[3], -a * s[2] / v, -g - a * s[3] / v];
  };
  let s = [0, -OPTIC_H_M, v0 * Math.cos(angleRad), v0 * Math.sin(angleRad)], t = 0;
  while (s[0] < rangeM) {
    const k1 = f(s), k2 = f(s.map((x, i) => x + dtS / 2 * k1[i])), k3 = f(s.map((x, i) => x + dtS / 2 * k2[i])), k4 = f(s.map((x, i) => x + dtS * k3[i]));
    const n = s.map((x, i) => x + dtS / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    if (n[0] >= rangeM) { const u = (rangeM - s[0]) / (n[0] - s[0]); s = s.map((x, i) => x + u * (n[i] - x)); t += u * dtS; break; }
    s = n; t += dtS;
  }
  return { tofS: t, vMs: Math.hypot(s[2], s[3]), pathCm: s[1] * 100 };
}

/**
 * A zero set at rangeM in env (WEAPONS §2.5): { rangeM, gMs2, rhoKgM3, soundMs, v0Ms, angleMrad }, the sight's
 * angle over the bore that puts the round on the line of sight there.
 */
export function zeroOf(cal, load, barrelMm, env, rangeM, { v0K = 1 } = {}) {
  const { rhoKgM3, soundMs } = airOf(env), T = boreTable(cal, load, barrelMm).at(rhoKgM3, soundMs, v0K, rangeM);
  const g = env.gMs2 ?? 0, angle = Math.atan((OPTIC_H_M + g * T.dS2) / rangeM);
  return Object.freeze({ rangeM, gMs2: g, rhoKgM3: Math.round(rhoKgM3 * 1e4) / 1e4, soundMs: Math.round(soundMs * 10) / 10, v0Ms: Math.round(v0Of(cal, load, barrelMm) * v0K * 10) / 10, angleMrad: Math.round(angle * 1e9) / 1e6 });
}
/** The Corps' battle-sight zero: the R-7's ball at BZO_M on the valley floor. */
export const BZO = zeroOf('6.5x40r', 'ball', 460, ENV_CLASSES[BZO_ENV], BZO_M);

/**
 * The round at a range (the one helper: see the header): { rangeM, tofS, vMs, eJ, pathCm, dropCm, driftCm,
 * penMm, supersonic, mach }. pathCm against the line of sight for that zero, + high; dropCm the bore line's
 * fall in this gravity; driftCm toward the crosswind's way (crossMs, m/s, + pushing right); mach null in vacuum.
 */
export function flight(cal, load, barrelMm, env, rangeM, { zero = BZO, crossMs = 0, v0K = 1 } = {}) {
  const L = loadOf(cal, load), { rhoKgM3, soundMs } = airOf(env), T = boreTable(cal, load, barrelMm).at(rhoKgM3, soundMs, v0K, rangeM);
  const tofS = T.tofS, vMs = T.vMs, dS2 = T.dS2, v0 = v0Of(cal, load, barrelMm) * v0K, g = env.gMs2 ?? 0, d = rangeM;
  const dropM = g * dS2, pathM = d * Math.tan((zero?.angleMrad ?? 0) / 1000) - dropM - OPTIC_H_M;
  const driftM = d > 0 ? crossMs * (tofS - d / v0) : 0;
  return {
    rangeM, tofS, vMs, eJ: 0.5 * (L.massG / 1000) * vMs * vMs, pathCm: pathM * 100, dropCm: dropM * 100, driftCm: driftM * 100,
    penMm: (L.pen0Mm ?? 0) * Math.pow(vMs / v0, L.penExp ?? 2), supersonic: soundMs > 0 && vMs > soundMs, mach: soundMs > 0 ? vMs / soundMs : null,
  };
}

/** A model's flight (the model's calibre and barrel). */
export const flightOf = (model, load, env, rangeM, opts = {}) => { const M = MODELS[model]; return flight(M.cal, load, M.barrelMm, env, rangeM, opts); };

/** The clicks from a zero that put the path at 0 at rangeM in env (WEAPONS §2.5's dope): { elev, wind: 0 }; + up. */
export function dopeOf(model, load, env, rangeM, zero = BZO) {
  const f = flightOf(model, load, env, rangeM, { zero });
  return { elev: Math.round(-f.pathCm / 100 / rangeM * 1000 / CLICK_MRAD), wind: 0 };
}
/** The Corps' dope card for the R-7's ball from the BZO on the valley floor (WEAPONS §2.5; the build sheet §4). */
export const DOPE_CARD = Object.freeze({
  r7: Object.freeze(Object.fromEntries([200, 300, 500].map(d => [d, Object.freeze(dopeOf('r7', 'ball', ENV_CLASSES[BZO_ENV], d))]))),
});
/** The BZO's path at 25 m (cm, − low), as the zero card prints its mark. */
export const ZERO25_MARK_CM = Math.round(flightOf('r7', 'ball', ENV_CLASSES[BZO_ENV], 25).pathCm * 10) / 10;

/** The wound factor of a round as it arrives (WEAPONS §8.1): (E / 500)^0.36 × (dia / 9)^0.3 × woundK. */
export const woundFactor = ({ eJ, diaMm, woundK = 1 }) => (eJ > 0 ? Math.pow(eJ / 500, 0.36) * Math.pow(diaMm / 9, 0.3) * woundK : 0);

/** The range a load stays supersonic to in a place (m; WEAPONS §2.7), MAX_M if past the table, 0 in vacuum. */
export function supersonicToM(cal, load, barrelMm, env) {
  const { rhoKgM3, soundMs } = airOf(env);
  if (!(soundMs > 0)) return 0;
  const T = boreTable(cal, load, barrelMm);
  for (let d = 0; d <= MAX_M; d += STEP_M) if (T.at(rhoKgM3, soundMs, 1, d).vMs <= soundMs) return d;
  return MAX_M;
}

/** Every calibre and load that flies (for the tests' tables). */
export const FLYING = Object.freeze(Object.entries(CALIBRES).flatMap(([cal, C]) => Object.entries(C.loads).filter(([, L]) => L.vRefMs).map(([load]) => Object.freeze([cal, load]))));
