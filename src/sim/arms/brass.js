// OLYMPUS arms: the brass on the KD range, every case that came to rest kept and counted on its tile, and the brass call (WEAPONS §2.8, §10.4; the build sheet 0.0.7 §2.3, §8 item 19).
//
// A fired case flies from the port as v0.0.5's does (look.js ejectCase, caseAt: the place's gravity), held in the
// session's live list R.brass (at most BRASS_LIVE 64, the stage's flying cases). On a course that keeps its brass on the
// tiles (COURSES[course].brassTiles: the KD course, test-range, from v0.0.28 by its row, not a literal of its name) a case at
// rest leaves that list for R.brassTiles, a count on the area's 1 m tiles ({ '<ix>,<iz>': { n, mine } },
// mine the player's), so every case of the relay stays drawn and counted however many are fired (settle, each
// tick lived and at a skip's end); test-handling's list is left exactly as v0.0.6 kept it (its cases live
// and die in R.brass). A live round or the coach's dummy thrown out of the port is not brass: it stays in the
// live list where it lies, to be picked up (police) and turned in. brassNear(state, pid, m) counts the cases
// within m of a person (all of them, and the player's); police(state, pid) picks up the player's within
// POLICE_M 4 m (the police-brass activity's effect: R.policed counts them, and any of their live rounds
// lying there go back in the pocket, R.picked, for the turn-in); policeOf(state, pid) does a gunner's, theirs
// alone (n − mine there, never the player's). The declaration (src/sim/scenarios/range.js) compares the brass
// policed with the rounds fired: "No brass, no ammo."
// v0.0.24 (the anywhere round's step 7; WEAPONS §2.8; CONTRACTS §21): **the faces a case meets in free fall**. Under the float
// band a case never falls (look.js ejectCase), so its flight is straight at its launch speed until it meets a face, bounces once
// and drifts to the next. caseFacesOf(state) is the ray that finds them, once at the ejection, on the live area's nav grid
// (navOf for the walker's class at the case's point): the case a point of CASE_R_M 5 mm against the very rects the grid was
// built from (collide.js overlaps: the walls, the blocking fixtures, the closed leaves) and the grid's floor (a point off it is a
// face: the room's edge), marched in CASE_RAY_STEP_M 2 cm steps and bisected to CASE_RAY_TOL_M 0.1 mm at the first touch, the
// face's normal the axis whose step alone touched (the rects are axis-aligned). It returns (x, z, vx, vz) → { tS, x, z, n: [nx,
// nz] } | null, null only when the speed is 0; a ray that leaves the grid has met its edge, so a face is always found. Pure but
// settle, police and policeOf.
import { playerId, playerActor } from '../../core/ids.js';
import { navOf } from '../places/nav.js';
import { overlaps, onFloor } from '../places/collide.js';
import { COURSES } from '../../data/courses.js';

/** The tiles' size, the reach of a police, a case's pick-up time (m, s): the build sheet 0.0.7 §4. */
export const TILE_M = 1, POLICE_M = 4, POLICE_CASE_S = 1.2;

const tileKey = (x, z) => `${Math.floor(x / TILE_M)},${Math.floor(z / TILE_M)}`;
const tileCentre = (key) => { const [i, j] = key.split(',').map(Number); return { x: (i + 0.5) * TILE_M, z: (j + 0.5) * TILE_M }; };
// (a tile is within m of a point when any of it is: the nearest point of its square)
const tileNear = (key, x, z, m) => { const [i, j] = key.split(',').map(Number); const nx = Math.max(i * TILE_M, Math.min(x, (i + 1) * TILE_M)), nz = Math.max(j * TILE_M, Math.min(z, (j + 1) * TILE_M)); return Math.hypot(nx - x, nz - z) <= m; };
const session = (state) => state.armoury?.range ?? null;

/** Every case at rest at ms moved from the live list to its tile (a course whose row keeps its brass on the tiles: see the header). Returns how many moved. */
export function settle(state, ms = state.clock.ms) {
  const R = session(state);
  if (!R || !COURSES[R.course]?.brassTiles || !R.brass?.length) return 0;
  const me = playerId(state), keep = [];
  let n = 0;
  R.brassTiles ??= {};
  for (const rec of R.brass) {
    if (rec.kind !== 'case' || rec.landMs > ms) { keep.push(rec); continue; }
    const k = tileKey(rec.at[0], rec.at[1]), t = (R.brassTiles[k] ??= { n: 0, mine: 0 });
    t.n++;
    if ((rec.who ?? me) === me) t.mine++;
    n++;
  }
  if (n) R.brass = keep;
  return n;
}

/** The cases within m of a person's actor: { n, mine } (see the header). */
export function brassNear(state, pid = playerId(state), m = POLICE_M) {
  const R = session(state), a = pid === playerId(state) ? playerActor(state) : state.actors?.list?.find(x => x.who === pid);
  const out = { n: 0, mine: 0 };
  if (!R || !a) return out;
  for (const [k, t] of Object.entries(R.brassTiles ?? {})) {
    if (!tileNear(k, a.x, a.z, m)) continue;
    out.n += t.n; out.mine += t.mine;
  }
  return out;
}

/** Every case on the tiles, and the player's: { n, mine }. */
export function brassLeft(state) {
  const out = { n: 0, mine: 0 };
  for (const t of Object.values(session(state)?.brassTiles ?? {})) { out.n += t.n; out.mine += t.mine; }
  return out;
}

/** The player's cases within POLICE_M picked up, and their live rounds lying there (w; see the header). Returns { cases, rounds }. */
export function police(state, pid = playerId(state), m = POLICE_M) {
  const R = session(state), a = playerActor(state);
  if (!R || !a) return { cases: 0, rounds: 0 };
  settle(state, state.clock.ms);
  let cases = 0, rounds = 0;
  for (const [k, t] of Object.entries(R.brassTiles ?? {})) {
    if (!t.mine || !tileNear(k, a.x, a.z, m)) continue;
    cases += t.mine; t.n -= t.mine; t.mine = 0;
    if (!t.n) delete R.brassTiles[k];
  }
  R.brass = (R.brass ?? []).filter(rec => {
    if (rec.kind === 'case' || (rec.who ?? pid) !== pid || Math.hypot(rec.at[0] - a.x, rec.at[1] - a.z) > m) return true;
    if (rec.kind === 'round' || rec.kind === 'tracer') rounds++;
    return false;
  });
  R.policed = (R.policed ?? 0) + cases;
  if (rounds) R.picked = (R.picked ?? 0) + rounds;
  return { cases, rounds };
}

/** A gunner's own cases within POLICE_M picked up (w; never the player's). Returns how many. */
export function policeOf(state, pid, m = POLICE_M) {
  const R = session(state), a = state.actors?.list?.find(x => x.who === pid);
  if (!R || !a) return 0;
  let cases = 0;
  for (const [k, t] of Object.entries(R.brassTiles ?? {})) {
    if (t.n <= t.mine || !tileNear(k, a.x, a.z, m)) continue;
    cases += t.n - t.mine; t.n = t.mine;
    if (!t.n) delete R.brassTiles[k];
  }
  R.brass = (R.brass ?? []).filter(rec => rec.kind === 'case' || rec.who !== pid || Math.hypot(rec.at[0] - a.x, rec.at[1] - a.z) > m);
  return cases;
}

/** The tiles as the stage draws them: [{ x, z, n }] (each tile's centre). */
export function tilesLook(state) {
  return Object.entries(session(state)?.brassTiles ?? {}).filter(([, t]) => t.n > 0).map(([k, t]) => ({ ...tileCentre(k), n: t.n }));
}

/** A case's radius against the faces (m), the ray's march and its tolerance at the touch (m): see the header. */
export const CASE_R_M = 0.005, CASE_RAY_STEP_M = 0.02, CASE_RAY_TOL_M = 0.0001;
// (a position rounded to 0.1 mm toward where it came from: move.js's rule for a walker at contact)
const back = (from, v) => (v >= from ? Math.floor(v * 1e4 + 1e-7) / 1e4 : Math.ceil(v * 1e4 - 1e-7) / 1e4);
/** The walker's class whose grid the ray reads (places/move.js PLAYER_CLS; the rects are the same for every class). */
const RAY_CLS = 'C0';

/** The ray to a case's first face on the live area (see the header): (x, z, vx, vz) → { tS, x, z, n } | null. Throws with no live area. */
export function caseFacesOf(state) {
  const area = state.places?.live?.area;
  if (!area) throw new Error('caseFacesOf(): a case in free fall flies to the faces of a live area, and there is none');
  return (x, z, vx, vz) => {
    const speed = Math.hypot(vx, vz);
    if (!(speed > 0)) return null;
    const grid = navOf(state, area, RAY_CLS, x, z), ux = vx / speed, uz = vz / speed;
    const hit = (px, pz) => !onFloor(grid, px, pz) || overlaps(grid, px, pz, CASE_R_M);
    const reach = Math.hypot(grid.nx * grid.cellM, grid.nz * grid.cellM) + CASE_RAY_STEP_M;
    let free = 0, t = CASE_RAY_STEP_M;
    if (hit(x, z)) return { tS: 0, x, z, n: [-Math.sign(ux) || 0, -Math.sign(uz) || 0] };
    while (t < reach && !hit(x + ux * t, z + uz * t)) { free = t; t += CASE_RAY_STEP_M; }
    t = Math.min(t, reach);
    while (t - free > CASE_RAY_TOL_M) { const m = (free + t) / 2; if (hit(x + ux * m, z + uz * m)) t = m; else free = m; }
    const fx = x + ux * free, fz = z + uz * free, dx = ux * (t - free) * 2 + Math.sign(ux) * CASE_RAY_TOL_M, dz = uz * (t - free) * 2 + Math.sign(uz) * CASE_RAY_TOL_M;
    // (the face's normal: the axis whose step alone touches; a corner both)
    const nx = ux && hit(fx + dx, fz) ? -Math.sign(ux) : 0, nz = uz && hit(fx, fz + dz) ? -Math.sign(uz) : 0;
    const n = nx || nz ? [nx, nz] : [-Math.sign(ux), -Math.sign(uz)];
    // (the touch rounded to 0.1 mm back toward where the case came from, never into the face: the bounce starts clear of it)
    return { tS: free / speed, x: back(x, fx), z: back(z, fz), n };
  };
}
