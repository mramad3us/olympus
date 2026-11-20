// OLYMPUS tests: the rifle's books' gauges (the build sheet v0.0.28 §8: F172's record half, F173, F177, F182 to F186), measured from the game's own functions against WEAPONS' numbers and the sheet's tables.
//
// Each gauge is a pure measure that returns its rows and its verdict, so the suites print the numbers and fail on the verdict alone:
//   F184 dustCases()   WEAPONS §9.2's three reference cases through upkeep.js dustOver (a calm field day with the covers shut,
//                      ten hours: 0.048; two hours prone on regolith in calm air, the port open: 0.144; an hour of storm standing,
//                      the port open: 0.12, with wet lube 0.18), within 1e-9; linearOver(minutes) a span in one call against the
//                      same span a minute at a time.
//        heatRows()    WEAPONS §9.5's R-7 rows through roundFired and barrelNow (the barrel fired at a rate from the table's
//                      ambient 20 °C; the cooling rows from 400 °C): all eight within HEAT_ROW_K 7%, every one enforced. The
//                      66 kPa hull's two peaks miss it (+7.2%, +10.1% with τ 230 s): the Newton fit reads them hot, radiation
//                      (UK's K_RAD, cut by the sheet's §0 item 9) carries the hot end there, and no τ meets all six of the
//                      hull's rows (215 s scrapes 7.00% on its 90-a-minute peak and its long cooling at once). So F184's heat
//                      clause is OPEN on those two, red in upkeep's own case for them, the lead's question (the review of
//                      v0.0.28 A: a gauge is never read round its failure).
//   F185 oddsTable()   cleanOdds' closed form (upkeep.js cleanOddsOf) on the six sheets × the three tempos against the sheet's §0
//                      item 2 (SHEET_ODDS: spotless and bad exact in whole percent, the minutes within a minute, first time within
//                      FIRST_PTS); faceRows(value, tempo) the same through checks.js check() itself, die face by die face (a stream
//                      found for each face, faceStreams), and mcClean the Monte Carlo through check() on a stream.
//   F177 inspectRows() WEAPONS §10.3's rule at margins 0, 5, 8 and 10 and careful's (margin 7) at an armourer of 17: at margin 5
//                      he finds it 70% of the time, at 8 half, at 10 there is nothing to find; firstMC the first-time rates by
//                      sheet × tempo, through check() (the clean, then his look) on a stream, within FIRST_PTS 3 points of the table.
//   F186 rateStates()  the stoppages over the scene's states (fresh, the breezy relay, the gusty relay, a clean's residual, the
//                      pin) beside WEAPONS §4.3's closed form written out here from firearms.js' constants; mcRates their pulls.
//   F173 books(r)      reconcile's record balanced: issued = fired + back + held + losses + short, ok only when nothing is short,
//                      nothing held and every case back.
// BOOKS_ENFORCED names the gauges enforced (every one of A's, at once).
import { cleanOddsOf, residualOf, findOdds, findDcOf, dustOver, roundFired, barrelNow, CLEAN_DC, CLEAN_MIN, FIND_FREE } from '../src/sim/arms/upkeep.js';
import { pull, misfireP, jamP, MISFIRE, MISFIRE_WORN, MISFIRE_DUST, JAM, JAM_WORN, JAM_DUST, JAM_FOUL, DRY_LUBE, MAG_JAM, MAG_DUST_JAM, WORN_FROM, WORN_SPAN, MAG_FRESH } from '../src/sim/arms/firearms.js';
import { check, TEMPO } from '../src/sim/skills/checks.js';
import { paceOf } from '../src/sim/skills/skills.js';
import { stream, d20 } from '../src/core/rng.js';

/** The gauges these measures enforce, at once. */
export const BOOKS_ENFORCED = Object.freeze(new Set(['F172', 'F173', 'F177', 'F182', 'F183', 'F184', 'F185', 'F186']));
/** The heat rows' tolerance (the sheet's §6 A: each within 7%). */
export const HEAT_ROW_K = 0.07;
/** First-time rates against the sheet's table, points (F177). */
export const FIRST_PTS = 3;
/** The armourer the sheet's table is priced at (§0 item 2). */
export const ARMOURER_AW = 17;
/** The breezy relay the table is priced at: 18 rounds' carbon and 40 minutes prone with the port open in a breeze. */
export const BREEZY = Object.freeze({ foul: 0.0216, dust: 0.12 });
/** The sheets by Weapon handling (templates.js testSheet's, the sheet's table's). */
export const SHEET_WH = Object.freeze({ recruit: 4, private: 10, cpl: 15, sgt: 19, raider: 31, tierone: 42 });
/** The sheet's §0 item 2, at an armourer of 17 after the breezy relay: [minutes, spotless %, first time %, bad %] by sheet and tempo. */
export const SHEET_ODDS = Object.freeze({
  recruit: { rushed: [28, 20, 33, 10], normal: [47, 35, 48, 0], careful: [71, 45, 58, 0] },
  private: { rushed: [22, 50, 62, 0], normal: [36, 65, 76, 0], careful: [55, 75, 85, 0] },
  cpl: { rushed: [18, 75, 85, 0], normal: [31, 90, 95, 0], careful: [46, 100, 100, 0] },
  sgt: { rushed: [16, 95, 98, 0], normal: [27, 100, 100, 0], careful: [41, 100, 100, 0] },
  raider: { rushed: [12, 100, 100, 0], normal: [20, 100, 100, 0], careful: [31, 100, 100, 0] },
  tierone: { rushed: [10, 100, 100, 0], normal: [17, 100, 100, 0], careful: [25, 100, 100, 0] },
});

const pct = (p) => Math.round(p * 100);

// ---- F184: the dust and the heat ----

/** WEAPONS §9.2's reference cases (see the header): [{ name, got, want }]. */
export function dustCases() {
  const one = (o, lube = 'dry') => { const g = { type: 'gun', model: 'r7', lube }; dustOver(g, o); return g.dust ?? 0; };
  return [
    { name: 'a calm field day, the covers shut (600 min standing)', got: one({ minutes: 600, airDust: 0.2, exposure: 'shut' }), want: 0.048 },
    { name: 'two hours prone on regolith in calm air, the port open', got: one({ minutes: 120, airDust: 0.2, exposure: 'open', prone: true, surfaceDust: 1 }), want: 0.144 },
    { name: 'an hour of storm, the port open', got: one({ minutes: 60, airDust: 1.0, exposure: 'open' }), want: 0.12 },
    { name: 'an hour of storm, the port open, wet lube', got: one({ minutes: 60, airDust: 1.0, exposure: 'open' }, 'wet'), want: 0.18 },
  ];
}
/** A span in one call against the same span a minute at a time (the gun's and a magazine's): { one, stepped, magOne, magStepped }. */
export function linearOver(minutes, o = { airDust: 0.5, exposure: 'open', prone: true, surfaceDust: 1 }) {
  const a = { type: 'gun', model: 'r7', lube: 'dry' }, b = { type: 'gun', model: 'r7', lube: 'dry' }, ma = { type: 'mag' }, mb = { type: 'mag' };
  dustOver(a, { ...o, minutes, mags: [ma] });
  for (let i = 0; i < minutes; i++) dustOver(b, { ...o, minutes: 1, mags: [mb] });
  return { one: a.dust ?? 0, stepped: b.dust ?? 0, magOne: ma.dust ?? 0, magStepped: mb.dust ?? 0 };
}
// (a barrel fired at rpm for mins from the air's 20 °C: its peak, read as the round leaves)
function peakOf(air, rpm, mins) {
  const g = { type: 'gun', model: 'r7' }, gapMs = 60_000 / rpm;
  let peak = air.airC;
  for (let t = 0; t < mins * 60_000; t += gapMs) { roundFired(g, { ms: Math.round(t), air }); peak = Math.max(peak, g.barrelC); }
  return peak;
}
// (minutes from 400 °C to a temperature, the lazy number read every second)
function coolMin(air, toC) {
  const g = { type: 'gun', model: 'r7', barrelC: 400, heatMs: 0 };
  let s = 0;
  while (barrelNow(g, s * 1000, air) > toC && s < 36_000) s++;
  return s / 60;
}
/** WEAPONS §9.5's R-7 rows (see the header): [{ name, got, want, enforced, hullPeak }], every one enforced. */
export function heatRows() {
  const melas = { air: 'mars-melas', airC: 20 }, hull = { air: 'martian-indoor', airC: 20 };
  return [
    { name: 'Mars valley: R-7 at 30 a minute for 30 min, peak °C', got: peakOf(melas, 30, 30), want: 253, enforced: true },
    { name: 'Mars valley: R-7 at 90 a minute for 4 min, peak °C', got: peakOf(melas, 90, 4), want: 495, enforced: true },
    { name: 'Mars valley: cooling 400 to 100 °C, min', got: coolMin(melas, 100), want: 4.8, enforced: true },
    { name: 'Mars valley: cooling 400 to 180 °C, min', got: coolMin(melas, 180), want: 2.7, enforced: true },
    { name: '66 kPa hull: cooling 400 to 100 °C, min', got: coolMin(hull, 100), want: 6.0, enforced: true },
    { name: '66 kPa hull: cooling 400 to 180 °C, min', got: coolMin(hull, 180), want: 3.3, enforced: true },
    { name: '66 kPa hull: R-7 at 30 a minute for 30 min, peak °C', got: peakOf(hull, 30, 30), want: 288, enforced: true, hullPeak: true },
    { name: '66 kPa hull: R-7 at 90 a minute for 4 min, peak °C', got: peakOf(hull, 90, 4), want: 527, enforced: true, hullPeak: true },
  ].map(r => ({ ...r, off: r.got / r.want - 1 }));
}

// ---- F185, F177: the bench and the window ----

/** The sheet's table against the closed form (see the header): [{ sheet, tempo, min, spotless, first, bad, want }]. */
export function oddsTable() {
  const dirt = 1 + BREEZY.foul + 1.6 * BREEZY.dust, rows = [];
  for (const [sheet, wh] of Object.entries(SHEET_WH)) {
    for (const tempo of ['rushed', 'normal', 'careful']) {
      const o = cleanOddsOf({ value: wh, tempo, awareness: ARMOURER_AW });
      rows.push({ sheet, tempo, min: CLEAN_MIN.r7 * paceOf(wh) * dirt * TEMPO[tempo].timeK, spotless: pct(o.spotless), first: o.first * 100, bad: pct(o.bad), want: SHEET_ODDS[sheet][tempo] });
    }
  }
  return rows;
}
const FACE_STREAMS = new Map();
/** A stream for each face of the d20: face → a seed key whose first d20 is that face (found once; for check() die by die). */
export function faceStreams() {
  if (FACE_STREAMS.size === 20) return FACE_STREAMS;
  for (let k = 0; FACE_STREAMS.size < 20 && k < 10_000; k++) { const f = d20(stream('face', k)); if (!FACE_STREAMS.has(f)) FACE_STREAMS.set(f, k); }
  return FACE_STREAMS;
}
/** The bench through check() itself, every face once: { spotless, bad } for a value at a tempo (the R-7's DC). */
export function faceRows(value, tempo) {
  let spotless = 0, bad = 0;
  for (const [, k] of faceStreams()) {
    const r = check(stream('face', k), { skill: 'weapons', value, dc: CLEAN_DC.r7, mods: [], tempo, pressure: 'none', procedure: true });
    if (r.grade === 'bad' || r.grade === 'disaster') bad++;
    else if (residualOf(r.margin) <= FIND_FREE) spotless++;
  }
  return { spotless: spotless / 20, bad: bad / 20 };
}
/** The bench's Monte Carlo through check() on a stream: { spotless, bad } over n tries. */
export function mcClean(value, tempo, n, seed = 48213) {
  const rng = stream(seed, 'mc-clean', value, tempo);
  let spotless = 0, bad = 0;
  for (let i = 0; i < n; i++) {
    const r = check(rng, { skill: 'weapons', value, dc: CLEAN_DC.r7, mods: [], tempo, pressure: 'none', procedure: true });
    if (r.grade === 'bad' || r.grade === 'disaster') bad++;
    else if (residualOf(r.margin) <= FIND_FREE) spotless++;
  }
  return { spotless: spotless / n, bad: bad / n };
}
/** First time through the window by check() (the clean, then the armourer's look), n draws: the rate. */
export function firstMC(value, tempo, n, { awareness = ARMOURER_AW, seed = 48213 } = {}) {
  const rng = stream(seed, 'mc-first', value, tempo);
  let pass = 0;
  for (let i = 0; i < n; i++) {
    const r = check(rng, { skill: 'weapons', value, dc: CLEAN_DC.r7, mods: [], tempo, pressure: 'none', procedure: true });
    if (r.grade === 'bad' || r.grade === 'disaster') continue;
    const dc = findDcOf(residualOf(r.margin));
    if (dc === null || !check(rng, { skill: 'awareness', value: awareness, dc, mods: [], pressure: 'none', procedure: false }).ok) pass++;
  }
  return pass / n;
}
/** WEAPONS §10.3 at the margins the sheet names (see the header): [{ name, margin, total, dc, found }]. */
export function inspectRows(awareness = ARMOURER_AW) {
  return [0, 5, 7, 8, 10].map(m => { const total = residualOf(m); return { name: m === 7 ? 'careful (margin 7)' : `margin ${m}`, margin: m, total, dc: findDcOf(total), found: findOdds(total, awareness) }; });
}

// ---- F186: the stoppages ----

/** The scene's states (see the header): [{ name, gun, mag }]. */
export function rateStates() {
  const gun = (o) => ({ type: 'gun', model: 'r7', cond: 0.93, lube: 'dry', mode: 'semi', chamber: 'live', ...o });
  return [
    { name: 'fresh from the rack', gun: gun({}), mag: { type: 'mag', fam: 'had30', n: 30, load: 'ball' } },
    { name: 'after the breezy relay', gun: gun({ foul: 0.0216, dust: 0.12 }), mag: { type: 'mag', fam: 'had30', n: 30, load: 'ball', dust: 0.06 } },
    { name: 'after the gusty relay', gun: gun({ foul: 0.0216, dust: 0.216 }), mag: { type: 'mag', fam: 'had30', n: 30, load: 'ball', dust: 0.108 } },
    { name: 'cleaned at margin 5 (the residual 0.015)', gun: gun({ foul: 0.015 }), mag: { type: 'mag', fam: 'had30', n: 30, load: 'ball' } },
    { name: 'its firing pin retaining pin lost', gun: gun({ fault: 'pin' }), mag: { type: 'mag', fam: 'had30', n: 30, load: 'ball' } },
  ];
}
/** WEAPONS §4.3 written out (see the header): { misfire, jam } for a state; the pin's: none fires. */
export function closedRates({ gun, mag }) {
  const wear = Math.max(0, Math.min(1, (WORN_FROM - (gun.cond ?? 0.95)) / WORN_SPAN)), dust = gun.dust ?? 0, foul = gun.foul ?? 0;
  const misfire = MISFIRE + MISFIRE_WORN * wear + MISFIRE_DUST * dust;
  const jam = JAM + JAM_WORN * wear ** 2 + JAM_DUST * dust ** 2 + JAM_FOUL * foul ** 2 + ((gun.lube ?? 'wet') === 'none' ? DRY_LUBE : 0)
    + MAG_JAM * Math.max(0, 0.9 - (mag.cond ?? MAG_FRESH)) + MAG_DUST_JAM * (mag.dust ?? 0);
  return gun.fault ? { misfire: 0, jam: 0, fires: false } : { misfire, jam, fires: true };
}
/** The game's own reliability for a state (firearms.js misfireP and jamP). */
export const gameRates = ({ gun, mag }) => ({ misfire: misfireP(gun, mag), jam: jamP(gun, mag) });
/** n pulls of a state through firearms.js pull, the gun put back to its state after each: { misfire, jam (a fired round's), broken, fired }. */
export function mcRates(state, n, seed = 48213) {
  const rng = stream(seed, 'mc-rates', state.name);
  let dud = 0, fired = 0, stop = 0, broken = 0;
  for (let i = 0; i < n; i++) {
    const g = { ...state.gun }, m = { ...state.mag };
    const r = pull(rng, g, m);
    if (r.why === 'broken') broken++;
    else if (r.why === 'dud') dud++;
    if (r.fired) { fired++; if (r.stoppage) stop++; }
  }
  return { misfire: dud / n, jam: fired ? stop / fired : 0, broken: broken / n, fired };
}

// ---- F173: the books ----

/** reconcile's record balanced (see the header): { balanced, okRight }. */
export function books(r) {
  const balanced = r.issued === r.fired + r.back + r.held + r.losses + r.short;
  const okRight = r.ok === (r.short === 0 && r.held === 0 && r.brassBack >= r.brassFired);
  return { balanced, okRight };
}
