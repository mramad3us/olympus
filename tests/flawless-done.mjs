// OLYMPUS tests: what done means, the ladder and the standards held, and the moments' pace: F69 to F71 (the build sheet v0.0.21 §8; done lens D3, D4).
//
//   F69  the ladder: over LADDER_SEEDS 40 set seeds (flawless.mjs's: the user's 1489397426, then 1000 + 37 i), each sheet's lane from
//        GO by its own bot (F56's: the keys bot with the Watch below rung 2, the honest T bot from it), the means of the take-in (your
//        own sightings), the first round (from your sighting of a threat to the first round on him) and the lane (GO to the lane's
//        end) strictly ordered boot recruit > private > corporal > sergeant > Raider > tier one, each step at least LADDER_LANE_K 2% of
//        the lower sheet's lane, LADDER_TAKEIN_MS 25 ms and LADDER_FIRST_MS 30 ms (done.md item 4: v0.0.18's thinnest, the Raider to
//        the tier one, 2.6% on the lane). A failed step is a finding for the item that caused it, never a moved floor.
//   F70  the standards: on the same lanes, each sheet a GO at its own standard (shoothouse.js houseVerdict, the lane's par class) on at
//        least GO_OWN_MIN 90% of the seeds, and the last sheet of a standard (the private of basic, the sergeant of advanced) a NO-GO at
//        the next class up (houseVerdict(state, { standard })) on at least NOGO_UP_MIN 80% (the Raider and the tier one share the
//        operator's: question 10).
//   F71  the moments' pace (ROADMAP §2.3): each of the house's moments (tests/moment-house.mjs) with dead air (gaps over DEAD_AIR_GAP_S
//        15 s of lived time with nothing new: no word said, no stop) under DEAD_AIR_MAX 20% of its modelled real time (lived plus THINK_S
//        6 s a stop), and its real minutes inside its sheet's band (COMBAT §25.10.4 as rewritten from the measure: the private 5 to 7,
//        the tier one 2.5 to 3.5; the other sheets' bands printed, no estimate written for them).
// Each row is flawless.mjs's shape ({ id, name, met, value, target }), printed by printDone; DONE_ENFORCED names all three (§8: at once).
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { sheetBot } from './flawless-card.mjs';
import { flawlessSeeds, mean, s1, s2 } from './flawless.mjs';
import { houseVerdict, THREAT_FACES, PAR_OF_TIER } from '../src/sim/scenarios/shoothouse.js';

/** F69's floors (done.md item 4; my calls from v0.0.18's table). */
export const LADDER_LANE_K = 0.02, LADDER_TAKEIN_MS = 25, LADDER_FIRST_MS = 30;
/** F70's rates (done.md item 4; my calls). */
export const GO_OWN_MIN = 0.90, NOGO_UP_MIN = 0.80;
/** F71's model (ROADMAP §2.3; done.md item 3). */
export const THINK_S = 6, DEAD_AIR_GAP_S = 15, DEAD_AIR_MAX = 0.20;
/** F71's bands, real minutes by sheet (COMBAT §25.10.4 rewritten from the measure: the lead's doc change, my call). */
export const REAL_MIN_BAND = Object.freeze({ private: [5, 7], tierone: [2.5, 3.5] });
/** The ladder's sheets, lowest first, and the seeds. */
export const LADDER = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
export const LADDER_SEEDS = Object.freeze(flawlessSeeds(40));
/** The par classes in order (the standards), and each class's last sheet on the ladder (the one judged by the next class up). */
export const STANDARDS = Object.freeze(['basic', 'advanced', 'operator']);
export const lastOfStandard = (std) => [...LADDER].reverse().find(t => PAR_OF_TIER[t] === std) ?? null;
/** The gauges this file enforces (§8: at once). */
export const DONE_ENFORCED = Object.freeze(new Set(['F69', 'F70', 'F71']));

/** One lane's numbers for the ladder (a finished game): { tier, seed, takeIns, firsts, laneMs, go, up: the verdict at the next class, why, upWhy }. */
export function ladderRec(g, tier, seed) {
  const s = g.state, R = s.armoury.range, H = R.house, takeIns = [], firsts = [];
  for (const L of [...H.rooms, H.hall]) for (const c of L.contacts) {
    if (c.by !== 'me') continue;
    if (Number.isFinite(c.takeInMs)) takeIns.push(c.takeInMs);
    const T = R.turners.find(t => t.key === c.key), first = c.firstAtMs ?? T?.firstAtMs ?? null;
    if (THREAT_FACES.includes(c.face) && Number.isFinite(first)) firsts.push(first - c.seenMs);
  }
  const own = houseVerdict(s), next = STANDARDS[STANDARDS.indexOf(H.par) + 1] ?? null, up = next ? houseVerdict(s, { standard: next }) : null;
  return { tier, seed, takeIns, firsts, laneMs: H.end && H.goAtMs !== null ? H.end.atMs - H.goAtMs : null, go: own.go, why: own.why, par: H.par, next, up: up ? up.go : null, upWhy: up?.why ?? [] };
}
/** One sheet's lane on a seed from GO by its own bot, to the card: its ladderRec. */
export function ladderLane(tier, seed, { bot = sheetBot(tier) } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' });
  const run = runHouse(g, bot, { maxMs: 15 * 60_000 });
  return { ...ladderRec(g, tier, seed), done: run.done };
}
/** The lanes over sheets and seeds (lowest sheet first). */
export function ladderLanes({ sheets = LADDER, seeds = LADDER_SEEDS } = {}) {
  const recs = [];
  for (const tier of sheets) for (const seed of seeds) recs.push(ladderLane(tier, seed));
  return recs;
}
/** Each sheet's means: { tier, n, takeInMs, firstMs, laneMs, goOwn, nogoUp, upOf }. */
export function sheetMeans(recs, sheets = LADDER) {
  return sheets.filter(t => recs.some(r => r.tier === t)).map(tier => {
    const mine = recs.filter(r => r.tier === tier), ups = mine.filter(r => r.up !== null);
    return { tier, n: mine.length, takeInMs: mean(mine.flatMap(r => r.takeIns)), firstMs: mean(mine.flatMap(r => r.firsts)), laneMs: mean(mine.map(r => r.laneMs).filter(Number.isFinite)),
      goOwn: mine.filter(r => r.go === true).length / (mine.length || 1), nogoUp: ups.length ? ups.filter(r => r.up === false).length / ups.length : null, next: mine[0]?.next ?? null,
      whyOwn: tally(mine.filter(r => !r.go).flatMap(r => r.why)), whyUp: tally(ups.filter(r => r.up === false).flatMap(r => r.upWhy)) };
  });
}
const tally = (xs) => { const o = {}; for (const x of xs) o[x] = (o[x] ?? 0) + 1; return o; };
const words = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || 'none';
const pc = (k) => (k === null || k === undefined ? '-' : `${Math.round(100 * k)}%`);

/** F69's row over lanes (see the header), with its steps: { id, name, met, value, target, steps }. */
export function ladderRow(recs, sheets = LADDER) {
  const m = sheetMeans(recs, sheets), steps = [], bad = [];
  for (let i = 1; i < m.length; i++) {
    const lo = m[i - 1], hi = m[i], lane = lo.laneMs - hi.laneMs, takeIn = lo.takeInMs - hi.takeInMs, first = lo.firstMs - hi.firstMs;
    const st = { from: lo.tier, to: hi.tier, laneMs: lane, laneK: lane / hi.laneMs, takeInMs: takeIn, firstMs: first };
    st.ok = st.laneK >= LADDER_LANE_K && takeIn >= LADDER_TAKEIN_MS && first >= LADDER_FIRST_MS;
    steps.push(st);
    if (!st.ok) bad.push(`${lo.tier} to ${hi.tier}${st.laneK < LADDER_LANE_K ? ` lane ${(100 * st.laneK).toFixed(1)}%` : ''}${takeIn < LADDER_TAKEIN_MS ? ` take-in ${takeIn.toFixed(0)} ms` : ''}${first < LADDER_FIRST_MS ? ` first ${first.toFixed(0)} ms` : ''}`);
  }
  const value = `${m.map(x => `${x.tier} ${x.takeInMs?.toFixed(0)}/${x.firstMs?.toFixed(0)} ms ${s2(x.laneMs / 1000)} s`).join(' > ')} over ${m[0]?.n ?? 0} seeds; steps ${steps.map(st => `${(100 * st.laneK).toFixed(1)}% ${st.takeInMs.toFixed(0)} ${st.firstMs.toFixed(0)}`).join(' | ')}${bad.length ? `; short: ${bad.join('; ')}` : ''}`;
  return { id: 'F69', name: 'the ladder: take-in, first round and lane strictly ordered over the sheets', met: m.length > 1 && !bad.length, value, target: `each step ${100 * LADDER_LANE_K}% of the lane, ${LADDER_TAKEIN_MS} ms, ${LADDER_FIRST_MS} ms`, steps, means: m };
}
/** F70's row over lanes (see the header). */
export function standardsRow(recs, sheets = LADDER) {
  const m = sheetMeans(recs, sheets), bad = [];
  for (const x of m) if (x.goOwn < GO_OWN_MIN) bad.push(`${x.tier} GO at its own ${pc(x.goOwn)} (NO-GO by ${words(x.whyOwn)})`);
  for (const std of STANDARDS.slice(0, -1)) {
    const t = lastOfStandard(std), x = m.find(y => y.tier === t);
    if (x && (x.nogoUp ?? 0) < NOGO_UP_MIN) bad.push(`${t} NO-GO at ${x.next} ${pc(x.nogoUp)}`);
  }
  const value = `${m.map(x => `${x.tier} GO ${pc(x.goOwn)}${x.tier === lastOfStandard(PAR_OF_TIER[x.tier]) && x.next ? `, NO-GO at ${x.next} ${pc(x.nogoUp)}` : ''}`).join('; ')} over ${m[0]?.n ?? 0} seeds${bad.length ? `; short: ${bad.join('; ')}` : ''}`;
  return { id: 'F70', name: 'the standards: GO at your own, NO-GO at the next', met: m.length > 0 && !bad.length, value, target: `own ${pc(GO_OWN_MIN)}, the next ${pc(NOGO_UP_MIN)}` };
}
/**
 * A moment's pace from its record (tests/moment-house.mjs paceOf): { livedS, stops, realMin, decisionsMin, deadAirS, deadShare, longestS }
 * in, F71's row out over the moments: dead air under DEAD_AIR_MAX of each one's modelled real time, its real minutes in its sheet's band.
 */
export function paceRow(paces) {
  const bad = [];
  for (const p of paces) {
    if (p.deadShare >= DEAD_AIR_MAX) bad.push(`${p.id} dead air ${pc(p.deadShare)}`);
    const band = REAL_MIN_BAND[p.tier];
    if (band && (p.realMin < band[0] || p.realMin > band[1])) bad.push(`${p.id} ${s2(p.realMin)} real min outside ${band[0]} to ${band[1]}`);
  }
  const value = paces.map(p => `${p.id} ${s1(p.livedS)} s lived, ${p.stops} stops, ${s2(p.realMin)} real min, dead air ${pc(p.deadShare)}`).join('; ') + (bad.length ? `; short: ${bad.join('; ')}` : '');
  return { id: 'F71', name: "the moments' pace: dead air under 20%, real minutes in the sheet's band", met: paces.length > 0 && !bad.length, value, target: `dead air under ${pc(DEAD_AIR_MAX)}; ${Object.entries(REAL_MIN_BAND).map(([t, [a, b]]) => `${t} ${a} to ${b} min`).join(', ')}` };
}

/** The rows as lines, six spaces in, with a head. */
export function printDone(head, rows) {
  console.log(`      ${head}`);
  for (const r of rows) console.log(`      ${r.id.padEnd(3)} ${r.met ? 'MET ' : 'OPEN'} ${r.name}: ${r.value} (target ${r.target})${DONE_ENFORCED.has(r.id) ? ' [enforced]' : ''}`);
}
/** The criteria enforced and not met. */
export const doneFailing = (rows) => rows.filter(r => DONE_ENFORCED.has(r.id) && !r.met).map(r => `${r.id} ${r.name}: ${r.value}`);
