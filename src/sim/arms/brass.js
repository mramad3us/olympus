// OLYMPUS arms: the brass on the KD range, every case that came to rest kept and counted on its tile, and the brass call (WEAPONS §2.8, §10.4; the build sheet 0.0.7 §2.3, §8 item 19).
//
// A fired case flies from the port as v0.0.5's does (look.js ejectCase, caseAt: Mars' gravity), held in the
// session's live list R.brass (at most BRASS_LIVE 64, the stage's flying cases). On the KD course (test-range)
// a case at rest leaves that list for R.brassTiles, a count on the area's 1 m tiles ({ '<ix>,<iz>': { n, mine } },
// mine the player's), so every case of the relay stays drawn and counted however many are fired (settle, each
// tick lived and at a skip's end); test-handling's list is left exactly as v0.0.6 kept it (its cases live
// and die in R.brass). A live round or the coach's dummy thrown out of the port is not brass: it stays in the
// live list where it lies, to be picked up (police) and turned in. brassNear(state, pid, m) counts the cases
// within m of a person (all of them, and the player's); police(state, pid) picks up the player's within
// POLICE_M 4 m (the police-brass activity's effect: R.policed counts them, and any of their live rounds
// lying there go back in the pocket, R.picked, for the turn-in); policeOf(state, pid) does a gunner's, theirs
// alone (n − mine there, never the player's). The declaration (src/sim/scenarios/range.js) compares the brass
// policed with the rounds fired: "No brass, no ammo." Pure but settle, police and policeOf.
import { playerId, playerActor } from '../../core/ids.js';

/** The tiles' size, the reach of a police, a case's pick-up time (m, s): the build sheet 0.0.7 §4. */
export const TILE_M = 1, POLICE_M = 4, POLICE_CASE_S = 1.2;

const tileKey = (x, z) => `${Math.floor(x / TILE_M)},${Math.floor(z / TILE_M)}`;
const tileCentre = (key) => { const [i, j] = key.split(',').map(Number); return { x: (i + 0.5) * TILE_M, z: (j + 0.5) * TILE_M }; };
// (a tile is within m of a point when any of it is: the nearest point of its square)
const tileNear = (key, x, z, m) => { const [i, j] = key.split(',').map(Number); const nx = Math.max(i * TILE_M, Math.min(x, (i + 1) * TILE_M)), nz = Math.max(j * TILE_M, Math.min(z, (j + 1) * TILE_M)); return Math.hypot(nx - x, nz - z) <= m; };
const session = (state) => state.armoury?.range ?? null;

/** Every case at rest at ms moved from the live list to its tile (the KD course only: see the header). Returns how many moved. */
export function settle(state, ms = state.clock.ms) {
  const R = session(state);
  if (!R || R.course !== 'kd' || !R.brass?.length) return 0;
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
