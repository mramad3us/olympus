// OLYMPUS cards: the shoot house's runs kept in the browser, its bests and GOs, the next sheet up and the weak room (the build sheet v0.0.20 §1 item 20; card C5).
//
// A run ends, and the card says whether it was good enough for your sheet (the instructor's GO or NO-GO, shoothouse.js houseVerdict)
// and what to try next. This module keeps the runs (page memory kept per browser, as the scores are: score.js): localStorage
// ['olympus.house'] = { v: 1, runs: [{ scene, sheet, loadout, seed, laneMs, go, why, atIso, version }] }, the last HOUSE_RUNS_MAX,
// newest last, a stored value that does not parse started afresh, every read and write in try and catch. Never in the save, never
// read by the sim. bestsOf gives the picker each sheet's best lane and its GOs (on a scene and a loadout); nextUp the sheet after
// the one played, in the picker's order ("Again as" leads with it after a GO); weakRoomOf the setup of the room with the worst row
// after a NO-GO ("Again from room 2": the room drilled without the walk to it). Nothing is locked: every sheet stays on the picker.
// Pure over a storage (the tests hand a Map-backed one), as score.js.

/** The storage key, and the most runs kept. */
export const HOUSE_RUNS_KEY = 'olympus.house', HOUSE_RUNS_MAX = 200;

/** The runs kept on a storage: { v: 1, runs: [] } (a bad record started afresh). */
export function readRuns(storage = globalThis.localStorage) {
  let raw = null;
  try { raw = storage?.getItem?.(HOUSE_RUNS_KEY) ?? null; } catch { raw = null; }
  if (!raw) return { v: 1, runs: [] };
  try { const o = JSON.parse(raw); return o && o.v === 1 && Array.isArray(o.runs) ? o : { v: 1, runs: [] }; } catch { return { v: 1, runs: [] }; }
}

/** Keep a run (newest last, HOUSE_RUNS_MAX at most): the record kept. atIso: an ISO time (tests give one). */
export function keepRun(storage = globalThis.localStorage, { scene, sheet, loadout = null, seed, laneMs, go, why = [], version = null }, { atIso = new Date().toISOString() } = {}) {
  const all = readRuns(storage);
  const rec = { scene, sheet, loadout: loadout ?? 'standard', seed, laneMs: Number.isFinite(laneMs) ? Math.round(laneMs) : null, go: go === true, why: [...(why ?? [])], atIso, version };
  all.runs.push(rec);
  while (all.runs.length > HOUSE_RUNS_MAX) all.runs.shift();
  try { storage?.setItem?.(HOUSE_RUNS_KEY, JSON.stringify(all)); } catch { /* (no storage here: the run is still on the card) */ }
  return rec;
}

/** Each sheet's best lane and its GOs on a scene (and a loadout, every loadout when null): { [sheet]: { bestMs, bestGoMs, gos, n } }. */
export function bestsOf(runs, { scene = 'test-shoothouse', loadout = null } = {}) {
  const out = {};
  for (const r of runs ?? []) {
    if (r.scene !== scene || (loadout && (r.loadout ?? 'standard') !== loadout)) continue;
    const o = (out[r.sheet] ??= { bestMs: null, bestGoMs: null, gos: 0, n: 0 });
    o.n++;
    if (Number.isFinite(r.laneMs) && (o.bestMs === null || r.laneMs < o.bestMs)) o.bestMs = r.laneMs;
    if (r.go) { o.gos++; if (Number.isFinite(r.laneMs) && (o.bestGoMs === null || r.laneMs < o.bestGoMs)) o.bestGoMs = r.laneMs; }
  }
  return out;
}
/** A sheet's best in the picker's words: "best 42.2 s · 3 GO" ("best 80.7 s · no GO yet"), or null with no run. */
export function bestWords(b) {
  if (!b?.n) return null;
  return [Number.isFinite(b.bestMs) ? `best ${(b.bestMs / 1000).toFixed(1)} s` : null, b.gos ? `${b.gos} GO` : 'no GO yet'].filter(Boolean).join(' · ');
}

/** The sheet after the one played, in the picker's order (sheets: its ids), or null at the top. */
export function nextUp(sheets, played) {
  const i = (sheets ?? []).indexOf(played);
  return i >= 0 && i + 1 < sheets.length ? sheets[i + 1] : null;
}
/** "Again as" ordered for a verdict: after a GO the next sheet up leads, the rest in the picker's order; after a NO-GO as they were. again: [{ tier, … }]. */
export function againOrder(again, { go, played, sheets }) {
  if (!go) return again;
  const up = nextUp(sheets, played);
  const i = again.findIndex(a => a.tier === up);
  return i > 0 ? [again[i], ...again.slice(0, i), ...again.slice(i + 1)] : again;
}

/** The setup of the room with the worst row after a NO-GO ('room:2' | 'room:3' | 'hall', or null: room 1 is the lane's own start). legs: houseNow's legs. */
export function weakRoomOf(legs) {
  const SETUPS = [null, 'room:2', 'room:3', 'hall'];
  const bad = (V) => (V.state === 'passed' ? 100 : 0) + (V.faults?.length ?? 0) * 10 + (V.parMissed ?? 0) * 5 + (Number.isFinite(V.ms) && Number.isFinite(V.parMs) && V.ms > V.parMs ? 3 : 0);
  let worst = -1, k = -1;
  (legs ?? []).forEach((V, i) => { if (!V.setup && bad(V) > worst) { worst = bad(V); k = i; } });
  return worst > 0 ? { k, setup: SETUPS[k] ?? null, word: ['room 1', 'room 2', 'room 3', 'the hall'][k] ?? null } : null;
}
