// OLYMPUS tests: the sol driver, a marine's reference sol lived on a body record, skipped a segment at a time, ticked at 20 Hz or split at random seconds (BODY §2.6, §25; the build sheet 0.0.4 §5.1).
//
// A body record (src/sim/body/record.js's whole form) is walked along a sol's plan (src/data/body/
// sol.js, timed by src/sim/body/body.js solPlan) with no game around it: the body's own rules at each
// row's start (rowActs: reveille, the head, the stall, meals, drinks, the shower's water, the basin,
// the bed), and the advance between, three ways:
//   skip    one bodyAdvance call a segment (a row's span): the skip's way;
//   tick    a call every TICK_MS 50 ms, that tick's load, stamina stepped as the fast layer steps it
//           (staminaTick, the load marked lived): the live game's way at its finest;
//   split   one call a segment, cut besides at N random whole seconds (a seeded stream: the
//           composition test).
// runSols({ body, sols: [{ sol, reveilleMs }], …, mode, untilMs, drop }) chains sols (each rack runs to
// the next sol's reveille) and returns { body, acts, crossed, events }: every act done with its time,
// every band crossed (exact ms), every event (asleep, woke, accidents). drop: { eat, drink, head,
// stall, wash, groom } leaves acts out (a sol without meals, without water). weekOf(mondayMs, lon,
// sols) gives TIME §9.2's week of sols from a Monday's reveille: training Monday to Friday, the
// holiday Saturday and Sunday, each reveille at its routine's hour. stageTimes(crossed) lists, for
// each ledger, when it first reached each band. The body, the plan and the rules are the game's own;
// only the clock is the driver's.
import { msAtMarsTime } from '../../src/core/calendar.js';
import { SOL_MS, TICK_MS, SEC_MS } from '../../src/core/clock.js';
import { stream, int } from '../../src/core/rng.js';
import { REFERENCE_SOL, HOLIDAY_SOL } from '../../src/data/body/sol.js';
import { TEMPLATES } from '../../src/data/body/templates.js';
import { withDefaults, copy } from '../../src/sim/body/record.js';
import { solPlan, rowSeg, rowActs, bodyAdvance, lastReveille } from '../../src/sim/body/body.js';
import { massOf } from '../../src/sim/body/energy.js';
import { staminaTick } from '../../src/sim/body/motion.js';
import { SITES, START_MS } from '../../src/data/setting/calendar.js';

export const MELAS_LON = SITES.melas.lonEDeg;
/** Monday Sol 590's reveille, 05:30 Melas (the career's first sol). */
export const REF_REVEILLE = lastReveille(START_MS, SITES.melas.lonEDeg);
/** The reference man (BODY §3.1: 75 kg, 178 cm, 21 years; medium build at 1.78 m is 74.5 kg). */
export const REF_PERSON = Object.freeze({ id: 'p1', sex: 'm' });

const hmOf = (s) => s.split(':').map(Number);
/** A template body at a reveille (the template's own: a marine after a standard night), the reference man's. */
export function templateBody(reveilleMs, { tmpl = 'm-adult', heightM, build, person = REF_PERSON } = {}) {
  const t = TEMPLATES[tmpl];
  const b = withDefaults({ v: 2, tmpl, heightM: heightM ?? t.heightM, build: build ?? t.build }, person, reveilleMs);
  b.atMs = reveilleMs;
  b.energy.emptySinceMs = reveilleMs - Math.round(t.energy.emptyForH * 3_600_000);
  b.energy.ateMs = reveilleMs - Math.round(t.energy.ateAgoH * 3_600_000);
  return b;
}
/** The reveille of a sol's routine at or after fromMs. */
export const reveilleAfter = (fromMs, sol, lon = MELAS_LON) => { const [h, m] = hmOf(sol.reveille); return msAtMarsTime(fromMs, h, m, lon); };
/** TIME §9.2's week from a Monday's reveille: [{ sol, reveilleMs }] × 7 × weeks. */
export function weekOf(mondayMs, lon = MELAS_LON, weeks = 1) {
  const out = [];
  let at = mondayMs;
  for (let d = 0; d < 7 * weeks; d++) {
    const sol = d % 7 >= 5 ? HOLIDAY_SOL : REFERENCE_SOL;
    const rev = d === 0 ? mondayMs : reveilleAfter(at + 12 * 3_600_000, sol, lon);
    out.push({ sol, reveilleMs: rev });
    at = rev;
  }
  return out;
}

const dropRow = (row, drop) => {
  if (!drop) return row;
  const r = { ...row };
  for (const k of Object.keys(drop)) if (drop[k]) delete r[k];
  return r;
};

/** Walk a body along sols (see the header). Writes body. */
export function runSols({ body, sols, lon = MELAS_LON, gG = 0.38, mode = 'skip', untilMs = Infinity, fromMs = null, drop = null, splits = 1000, seed = 1, onSpan = null }) {
  const acts = [], crossed = [], events = [], take = (r) => { crossed.push(...r.crossed); events.push(...r.events); };
  const spans = [];
  for (let i = 0; i < sols.length; i++) spans.push(...solPlan(sols[i].sol, sols[i].reveilleMs, lon, sols[i + 1]?.reveilleMs ?? null));
  const start = fromMs ?? spans[0].fromMs, end = Math.min(untilMs, spans[spans.length - 1].toMs);
  // (split: the random whole seconds, drawn once over the whole run)
  let cuts = [];
  if (mode === 'split') {
    const r = stream('sol-split', seed), n = Math.floor((end - start) / SEC_MS);
    const set = new Set();
    while (set.size < Math.min(splits, n - 1)) set.add(start + (1 + int(r, n - 1)) * SEC_MS);
    cuts = [...set].sort((a, b) => a - b);
  }
  body.atMs = start;
  for (const span of spans) {
    if (span.toMs <= start || span.fromMs >= end) continue;
    const row = dropRow(span.row, drop);
    if (span.fromMs >= start) for (const a of rowActs(body, { ...span, row }, span.fromMs, lon)) acts.push({ ...a, atMs: span.fromMs, what: row.what });
    const a = Math.max(start, span.fromMs), b = Math.min(end, span.toMs), mass = massOf(body);
    onSpan?.(span, body);
    if (mode === 'tick') {
      const seg = rowSeg(row, lon, mass, true, gG);
      for (let t = a; t < b; t += TICK_MS) {
        const t1 = Math.min(b, t + TICK_MS);
        const st = staminaTick(body.stamina, !!body.blown, seg.load.metG, (t1 - t) / SEC_MS);
        body.stamina = st.stamina; body.blown = st.blown;
        take(bodyAdvance(body, seg, t, t1));
      }
    } else if (mode === 'split') {
      const seg = rowSeg(row, lon, mass, false, gG);
      let t = a;
      for (const c of cuts) if (c > a && c < b) { take(bodyAdvance(body, seg, t, c)); t = c; }
      take(bodyAdvance(body, seg, t, b));
    } else take(bodyAdvance(body, rowSeg(row, lon, mass, false, gG), a, b));
  }
  crossed.sort((x, y) => x.atMs - y.atMs);
  return { body, acts, crossed, events, fromMs: start, toMs: end };
}

/** For each ledger, when it first reached each band: { <ledger>: [{ band, atMs }] }. */
export function stageTimes(crossed) {
  const out = {};
  for (const c of crossed) {
    if (c.transition || (c.toI !== undefined && c.toI < c.fromI)) continue;
    const list = (out[c.ledger] ??= []);
    if (!list.some(x => x.band === c.to)) list.push({ band: c.to, atMs: c.atMs });
  }
  return out;
}
export { copy, lastReveille, SOL_MS };

/**
 * A minimal state round one body (no game: the readers' fixture): the player p1 with the body, actor
 * a1, no live site (Melas's longitude), the clock at ms. The body is stored as its deltas.
 */
export function fixtureState(body, ms = body.atMs, { seed = 1, outfit = 'utilities', posture = 'stand' } = {}) {
  const b = copy(body);
  delete b.sex; delete b.ageY;
  return { meta: { seed, next: {} }, clock: { ms, tick: 0, holds: [], seq: 0 }, events: [], skip: null, time: {}, people: { p1: { id: 'p1', sex: 'm', body: b } },
    player: { id: 'p1', actor: 'a1' }, actors: { list: [{ id: 'a1', who: 'p1', x: 0, z: 0, face: 'down', gait: 'idle', outfit, posture }] }, places: { live: null }, flags: {}, log: [] };
}

/**
 * The stage times every body suite prints (the build sheet 0.0.4 §5.1): from a rested, fed start (the
 * template at Monday's reveille, breakfast eaten at 07:05) through a training sol's activities with
 * nothing more eaten or drunk, no head, no shower and no rack, when hunger, thirst, the bladder and
 * sleep pressure (fatigue) reach each band. Returns the lines.
 */
export function stageLines(lon = MELAS_LON) {
  const rev = weekOf(REF_REVEILLE, lon, 1);
  const b = templateBody(rev[0].reveilleMs), sols = rev.slice(0, 2);
  const fed = runSols({ body: b, sols, untilMs: rev[0].reveilleMs + Math.round(1.75 * 3_600_000) });
  const r = runSols({ body: b, sols, fromMs: fed.toMs, untilMs: sols[1].reveilleMs, drop: { eat: true, drink: true, head: true, stall: true, wash: true, bed: true } });
  const st = stageTimes(r.crossed), T = (ms) => `+${(Math.round((ms - fed.toMs) / 360_000) / 10).toFixed(1)} h`;
  return ['hunger', 'thirst', 'bladder', 'fatigue'].map(k => `${k}: ${(st[k] ?? []).map(x => `${x.band} ${T(x.atMs)}`).join(', ') || 'no band crossed'}`);
}
/** The stage-times entry every body suite opens with (printed, held only to have crossed something). */
export const STAGE_TEST = Object.freeze({
  name: 'the stage times from a rested, fed start (Monday 07:15, after breakfast) through a training sol with nothing more eaten, drunk or done: hunger, thirst, the bladder, sleep pressure',
  fn() {
    const lines = stageLines();
    for (const l of lines) console.log(`      ${l}`);
    if (!lines.some(l => l.startsWith('fatigue: tired'))) throw new Error(`no fatigue crossed: ${lines.join('; ')}`);
  },
});
