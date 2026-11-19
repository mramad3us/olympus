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
// v0.0.21 (the build sheet v0.0.21 §1 items 9 and 16, §0 item 43; done lens D5): a run on a drawn house keeps its code (code: the
// whole code, as the score line and the card name it; the set's runs as v0.0.20's), and qualified: "Qualify as <sheet>" starts a
// lane on a seed the page draws and hides until the card, never played on that sheet in this browser (playedSeeds: keyed by sheet
// and seed, the code a function of the seed), on the drawn house (QUAL_DRAW), the standard loadout (QUAL_LOADOUTS) and the sheet's
// own par or a harder one; QUAL_GOS 3 GOs in a row (v0.0.20's verdict at the sheet's standard) qualify. The attempt is page memory
// ({ sheet, n, seeds, codes }); qualStep takes it through a run: a NO-GO, a lane outside the rules ends it, and an abandoned lane
// (the title, Again, a reload) never reaches qualStep, so it ends too ("a qualification is a card you finish", my call). The run kept
// carries qual: { n, of }, and a qualification writes quals: { [sheet]: { atIso, seeds, codes, version } } beside the runs (the
// picker's mark, and "Qualify as <next sheet up>"). Nothing is locked; never in the save, never read by the sim.

/** Qualified's rule (done lens D5; my calls): the GOs in a row, the loadouts, the house. */
export const QUAL_GOS = 3, QUAL_LOADOUTS = Object.freeze(['standard']), QUAL_DRAW = 'drawn';
/** The par classes, easiest first: a qualification lane is at the sheet's own or a harder one. */
export const PAR_ORDER = Object.freeze(['basic', 'advanced', 'operator']);
/** The most fresh seeds the page draws before it gives up on finding one unplayed (a browser of 4 billion seeds' runs never meets it). */
export const QUAL_SEED_TRIES = 64;

/** The storage key, and the most runs kept. */
export const HOUSE_RUNS_KEY = 'olympus.house', HOUSE_RUNS_MAX = 200;

/** The runs kept on a storage: { v: 1, runs: [] } (a bad record started afresh). */
export function readRuns(storage = globalThis.localStorage) {
  let raw = null;
  try { raw = storage?.getItem?.(HOUSE_RUNS_KEY) ?? null; } catch { raw = null; }
  if (!raw) return { v: 1, runs: [] };
  try {
    const o = JSON.parse(raw);
    if (!o || o.v !== 1 || !Array.isArray(o.runs)) return { v: 1, runs: [] };
    // (the qualifications beside the runs; a bad one dropped, the runs kept)
    if (o.quals !== undefined && (typeof o.quals !== 'object' || o.quals === null || Array.isArray(o.quals))) delete o.quals;
    return o;
  } catch { return { v: 1, runs: [] }; }
}

/** Keep a run (newest last, HOUSE_RUNS_MAX at most): the record kept. atIso: an ISO time (tests give one). */
export function keepRun(storage = globalThis.localStorage, { scene, sheet, loadout = null, seed, laneMs, go, why = [], version = null, code = null, qual = null }, { atIso = new Date().toISOString() } = {}) {
  const all = readRuns(storage);
  // (a drawn house's code, and a qualification lane's place in its attempt; absent on the set and outside one)
  const rec = { scene, sheet, loadout: loadout ?? 'standard', seed, laneMs: Number.isFinite(laneMs) ? Math.round(laneMs) : null, go: go === true, why: [...(why ?? [])], atIso, version, ...(code ? { code } : {}), ...(qual ? { qual: { n: qual.n, of: qual.of } } : {}) };
  all.runs.push(rec);
  while (all.runs.length > HOUSE_RUNS_MAX) all.runs.shift();
  try { storage?.setItem?.(HOUSE_RUNS_KEY, JSON.stringify(all)); } catch { /* (no storage here: the run is still on the card) */ }
  return rec;
}

/** Each sheet's best lane and its GOs on a scene (and a loadout, every loadout when null): { [sheet]: { bestMs, bestGoMs, gos, n } }. */
// (a lane set up ("Again from room 2", &setup=: its verdict's why 'setup') is no lane: kept, never a best (the hunt of v0.0.20, P3: the hall
// alone, 5.5 s, became the sergeant's "best 5.5 s · 1 GO" over his full lane's 46.9 s))
export const setUpRun = (r) => (r?.why ?? []).includes('setup');
export function bestsOf(runs, { scene = 'test-shoothouse', loadout = null } = {}) {
  const out = {};
  for (const r of runs ?? []) {
    if (r.scene !== scene || (loadout && (r.loadout ?? 'standard') !== loadout) || setUpRun(r)) continue;
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

// ---- v0.0.21: qualified (see the header) ----

/** The seeds a sheet has played on a scene in this browser (keyed by sheet and seed: the drawn house's code is the seed's). */
export function playedSeeds(runs, sheet, { scene = 'test-shoothouse' } = {}) {
  return new Set((runs ?? []).filter(r => r.scene === scene && r.sheet === sheet).map(r => r.seed));
}
/** A fresh seed for a qualification lane: drawn by draw() (main.js randomSeed) until one this sheet never played, at most QUAL_SEED_TRIES. */
export function qualSeed(runs, sheet, draw, { scene = 'test-shoothouse', taken = [] } = {}) {
  const played = playedSeeds(runs, sheet, { scene });
  for (const s of taken) played.add(s);
  for (let i = 0; i < QUAL_SEED_TRIES; i++) { const s = draw(); if (!played.has(s)) return s; }
  return null;
}
/** Whether a lane keeps a qualification's rules (see the header): why not, or null. run: { sheet, seed, draw, loadout, par, own }. */
export function qualWhyNot(run, attempt, runs = []) {
  if (!attempt || run.sheet !== attempt.sheet) return 'another sheet';
  if (run.draw !== QUAL_DRAW) return 'a house as set';
  if (!QUAL_LOADOUTS.includes(run.loadout ?? 'standard')) return 'a kit loadout';
  if (PAR_ORDER.indexOf(run.par) < PAR_ORDER.indexOf(run.own)) return 'an easier par';
  // (a seed played before on this sheet, here or earlier in this attempt: the runs kept before this one)
  if (attempt.seeds.includes(run.seed) || playedSeeds(runs, run.sheet).has(run.seed)) return 'a seed played before';
  return null;
}
/**
 * The attempt through a launch (main.js launch, at every state set: a new lane, a save loaded or imported, Continue, the debug
 * handle): kept only into the lane it started itself on its hidden seed (qual: the launch the attempt made); any other ends it, so a
 * save made at GO of a qualification lane, loaded after a bad run, is never a retry (the build sheet §1 item 9: "an abandoned lane
 * (the title, Again, a reload) ... ends the attempt"; the review of 2026-11-16). Pure.
 */
export function qualKeep(attempt, { qual = false, seed = null } = {}) { return attempt && qual && seed === attempt.pending ? attempt : null; }
/** A new attempt for a sheet: page memory. */
export const qualStart = (sheet) => ({ sheet, n: 0, seeds: [], codes: [] });
/**
 * A finished lane through an attempt (see the header): { attempt (the next, or null once it ends), qualified (the sheet, or null), words
 * (the card's line: "QUALIFICATION 2 OF 3 · GO", "QUALIFIED: SERGEANT", "QUALIFICATION ENDED: NO-GO"), qual ({ n, of } for the run kept) }.
 * run: { sheet, seed, code, go, draw, loadout, par, own }; runs: the runs kept before this one; label: the sheet's name.
 */
export function qualStep(attempt, run, runs = [], { label = run.sheet } = {}) {
  if (!attempt) return { attempt: null, qualified: null, words: null, qual: null };
  const why = qualWhyNot(run, attempt, runs);
  if (why) return { attempt: null, qualified: null, words: `QUALIFICATION ENDED: ${why.toUpperCase()}`, qual: null };
  const n = attempt.n + 1, qual = { n, of: QUAL_GOS };
  if (!run.go) return { attempt: null, qualified: null, words: `QUALIFICATION ${n} OF ${QUAL_GOS} · NO-GO · ENDED`, qual };
  const next = { ...attempt, n, seeds: [...attempt.seeds, run.seed], codes: [...attempt.codes, run.code ?? null] };
  if (n >= QUAL_GOS) return { attempt: null, qualified: run.sheet, words: `QUALIFIED: ${String(label).toUpperCase()}`, qual, seeds: next.seeds, codes: next.codes };
  return { attempt: next, qualified: null, words: `QUALIFICATION ${n} OF ${QUAL_GOS} · GO`, qual };
}
/** The qualifications kept: { [sheet]: { atIso, seeds, codes, version } }. */
export const qualsOf = (storage = globalThis.localStorage) => readRuns(storage).quals ?? {};
/** Keep a qualification (the record's quals, beside the runs): the record kept. */
export function keepQual(storage = globalThis.localStorage, sheet, { seeds = [], codes = [], version = null } = {}, { atIso = new Date().toISOString() } = {}) {
  const all = readRuns(storage), rec = { atIso, seeds: [...seeds], codes: [...codes], version };
  all.quals = { ...(all.quals ?? {}), [sheet]: rec };
  try { storage?.setItem?.(HOUSE_RUNS_KEY, JSON.stringify(all)); } catch { /* (no storage here: the card still says it) */ }
  return rec;
}
/** The sheet "Qualify as" offers: the one after the highest qualified in the picker's order, else the focused one; null past the top. */
export function qualNext(sheets, quals = {}, focus = 'private') {
  const done = (sheets ?? []).map((t, i) => (quals?.[t] ? i : -1)).filter(i => i >= 0);
  if (!done.length) return (sheets ?? []).includes(focus) ? focus : sheets?.[0] ?? null;
  return sheets[Math.max(...done) + 1] ?? null;
}
