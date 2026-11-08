// OLYMPUS tests: the door race and the bangs' turn on the built helpers, a model for combat-race and anchors (COMBAT §25.5.5, §25.18.2, §5.8; the build sheet 0.0.9 §2.1, §5.1, §8 items 2, 3).
//
// Ported from the design round's scratch (/private/tmp/claude-501/olympus-build/hardening/merged.mjs, read only: T11 to
// T14), every formula it wrote once now read from the code: the take-in (react.js takeInOf, NOTICE_*), the aim (shot.js
// aimS with the rifle's KINDS.rifle sight ×1.2 and turn ×0.8, the SO-4 at 1×, TRIGGER_S), the pace (skills.js paceOf),
// the fumble ladder (firearms.js FUMBLE_K, DROP_BY, NAT1_*, SLING_RECOVER_S, actionMs), and for the bang the chaos
// (combat/supp.js: inputPts, inputK with the worn protection, poolAdd, suppAt's closed form, feltFrom, bandN, suppMod,
// suppTimeK, startleMsOf, hardFrom, the flash's terms). What is not built stays the model's own, said where it is: the
// defender's choice under the chaos (COMBAT §7.11, with test-breach), his turn to the noise (TURN_MS), a held sector aim
// as a quarter of the sight term (§25.5.4's designed "sector aim", SECTOR_AIM_K).
//
// The reference room (§25.5.1): the defender 4.4 m from the threshold, both seeing each other on the same tick; the
// marine's first round is his take-in plus his aim plus the trigger; the defender's, his, or with the team's bang 1 s
// before the sighting his startle, the flash by his facing and his choices. The kit (§8 item 3, the user's overrule of
// question 6, 2026-11-07): KIT.designed is §25.18.2's (a filtered visor on MSS tactical and enemy special forces, no ear
// protection anywhere); KIT.overrule has the UN's line infantry, MSS tactical and enemy special forces in combat EVA
// suits (a filtered visor, sound filtering at EARPRO_K), the insurgents and the veteran unsuited. rifle: false runs the
// scratch's assumption beside the built one (kindSight and kindTurn 1), for the two disputed cells.
import { paceOf } from '../src/sim/skills/skills.js';
import { grade, passed } from '../src/sim/skills/checks.js';
import { takeInOf, NOTICE_DC0, NOTICE_PER_M, NOTICE_SECTOR } from '../src/sim/combat/react.js';
import { aimS, TRIGGER_S } from '../src/sim/arms/shot.js';
import { KINDS } from '../src/sim/arms/models.js';
import { FUMBLE_K, DROP_BY, NAT1_DROP_BELOW, NAT1_DROP, SLING_RECOVER_S, actionMs } from '../src/sim/arms/firearms.js';
import { TEST_SHEETS } from '../src/sim/skills/templates.js';
import { seedRng, next } from '../src/core/rng.js';
import {
  inputPts, inputK, poolAdd, suppAt, feltFrom, bandN, suppMod, suppTimeK, startleMsOf, hardFrom,
  STARTLE_FROM, STARTLE_REPEAT_MS, STARTLE_JOIN_MS, FLASH_BLIND_MS, FLASH_DAZZLE_MS, DAZZLE_SIGHT, SUPP_DECAY, NERVE_K, NERVE_DC0, NERVE_PER, PREP_K,
} from '../src/sim/combat/supp.js';

/** The model's own (not built: see the header): a held sector aim's share of the sight term; the turn to the noise; a choice's dwell. */
export const SECTOR_AIM_K = 0.25, TURN_MS = 300, CHOICE_DWELL_MS = 1500;
/** The reference room's range (m). */
export const ROOM_M = 4.4;
const RIFLE = KINDS.rifle;

/** The test sheets as the race reads them: { id, label, wf, mrk, wh, awr, inoc, rung, H }. */
export const SHEETS = Object.freeze(Object.entries(TEST_SHEETS).map(([id, t]) => Object.freeze({
  id, label: t.label, wf: t.wf, mrk: t.values.marksmanship, wh: t.values.weapons, awr: t.values.awareness, inoc: t.inoc, rung: t.rung,
  H: hardFrom({ wf: t.wf, cls: 'soldier', inoc: t.inoc }),
})));
export const sheet = (id) => SHEETS.find(s => s.id === id);
/** The defenders (SKILLS §11.1's middles, COMBAT §5.6's T1 inoculations), their doctrine and whether the overrule suits them. */
export const DEFENDERS = Object.freeze([
  { id: 'insurgent cell member', cls: 'soldier', wf: 11, inoc: 0, awr: 6, wh: 5, mrk: 5, doc: 'irregular', visor: false, suited: false },
  { id: 'insurgent veteran', cls: 'soldier', wf: 32, inoc: 3, awr: 10, wh: 10, mrk: 10, doc: 'irregular', visor: false, suited: false },
  { id: 'UN Marine, line', cls: 'soldier', wf: 26, inoc: 8, awr: 9, wh: 12, mrk: 13, doc: 'military', visor: false, suited: true },
  { id: 'MSS tactical', cls: 'cop', wf: 45, inoc: 12, awr: 14, wh: 13, mrk: 13, doc: 'police', visor: true, suited: true },
  { id: 'enemy special forces', cls: 'soldier', wf: 80, inoc: 22, awr: 30, wh: 30, mrk: 30, doc: 'military', visor: true, suited: true },
].map(d => Object.freeze({ ...d, H: hardFrom(d) })));
export const defender = (id) => DEFENDERS.find(d => d.id === id);
/** The two kits (see the header): a defender's { visor, ears }. */
export const KIT = Object.freeze({
  designed: (d) => ({ visor: d.visor, ears: 'none' }),
  overrule: (d) => (d.suited ? { visor: true, ears: 'suit' } : { visor: false, ears: 'none' }),
});
/** The marines of §25.5.5 and how often their man is in their sector. */
export const MARINES = Object.freeze([
  ['private, by the keys', 'private', 0], ['private, Watch set', 'private', 0.5], ['corporal, rung 2', 'cpl', 1 / 3],
  ['sergeant, rung 3', 'sgt', 0.5], ['Raider, rung 4', 'raider', 0.5], ['tier one, rung 4', 'tierone', 0.5],
].map(([label, id, inSecP]) => Object.freeze({ label, s: sheet(id), inSecP })));
export const STATES = Object.freeze(['aimed', 'alert', 'surprised']);

const d20 = (r) => 1 + Math.floor(next(r) * 20);
const U = (r, a, b) => a + (b - a) * next(r);
const gradeOf = (d, margin) => grade(margin, d === 1 ? 1 : d === 20 ? 20 : 0);
const modOf = (felt, skill) => suppMod(felt, skill)?.v ?? 0;

/** The notice check's grade at the room's range (react.js's terms). */
export function noticeGrade(r, awr, expect, mod = 0) {
  const d = d20(r), dc = NOTICE_DC0 + Math.round(ROOM_M / NOTICE_PER_M) + (expect === 'sector' ? NOTICE_SECTOR : 0);
  return gradeOf(d, d + awr + mod - dc);
}
/** A take-in (s) on react.js's helper, the band felt's. */
export const takeInS = (wf, expect, g, felt = 0) => takeInOf({ wf, expect, grade: g, band: bandN(felt) }).ms / 1000;
/** An aim (s) on shot.js's aimS, × the chaos's time; rifle false: the scratch's assumption (no rifle factors). */
export function aimTurnS(wh, turnDeg, toAimS, felt = 0, { rifle = true } = {}) {
  return aimS({ pace: paceOf(wh), kindSight: rifle ? RIFLE.sight : 1, opticSight: 1, turnDeg, value: wh, kindTurn: rifle ? RIFLE.turn : 1, toAimS }) * suppTimeK(felt);
}
export const aimSectorS = (wh, felt = 0, { rifle = true } = {}) => SECTOR_AIM_K * 0.6 * paceOf(wh) * (rifle ? RIFLE.sight : 1) * suppTimeK(felt);

/** The marine's first round (s after the sighting): in his sector with inSecP, else a room he is clearing and a 45° turn. */
export function marineFirst(r, m, { bang = false, rifle = true } = {}) {
  const s = m.s, f = bang ? feltFrom(poolAdd(0, inputPts('flash', { indoor: true }) * PREP_K.prepared), s.H) : 0;
  const inSec = next(r) < m.inSecP, expect = inSec ? 'sector' : 'area';
  return takeInS(s.wf, expect, noticeGrade(r, s.awr, expect, modOf(f, 'awareness')), f) + (inSec ? aimSectorS(s.wh, f, { rifle }) : aimTurnS(s.wh, 45, 0.15, f, { rifle })) + TRIGGER_S;
}

// ---- the defender's choice (COMBAT §7.11; not built: the model's own, as the design wrote it) ----
const DOC = {
  irregular: { coverMiss: { cover: 0.5, blind: 0.5 }, pinnedPass: { cover: 0.5, blind: 0.5 }, pinnedBad: 'flee' },
  police: { coverMiss: { cover: 1 }, pinnedPass: { cover: 1 }, pinnedBad: 'surrender' },
  military: { coverMiss: { cover: 0.7, blind: 0.3 }, pinnedPass: { cover: 0.7, blind: 0.3 }, pinnedBad: 'freeze' },
};
const pickW = (r, w) => { let u = next(r); for (const [k, v] of Object.entries(w)) if ((u -= v) <= 0) return k; return Object.keys(w)[0]; };
const nerveOf = (t) => Math.round(t.wf * (NERVE_K[t.cls] ?? 0));
const nerveDC = (f) => NERVE_DC0 + Math.round(f / NERVE_PER);
function choose(r, t, f) {
  const b = bandN(f);
  if (b <= 1) return 'fight';
  const d = d20(r), g = gradeOf(d, d + nerveOf(t) - nerveDC(f)), D = DOC[t.doc];
  if (b === 2) return passed(g) ? 'fight' : g === 'miss' ? pickW(r, D.coverMiss) : 'freeze';
  if (passed(g)) return pickW(r, D.pinnedPass);
  return g !== 'disaster' ? 'freeze' : D.pinnedBad;
}
const reroll = (st, bandNow, bandThen, sinceMs) => st !== 'flee' && st !== 'surrender' && (bandNow !== bandThen || ((st === 'cover' || st === 'blind') && bandNow >= 2 && sinceMs >= CHOICE_DWELL_MS));
const FACING = { aimed: [0.8, 0.2, 0], alert: [0.4, 0.3, 0.3], surprised: [0.3, 0.3, 0.4] };

/**
 * The defender's first aimed round (s after the sighting), Infinity within 10 s: { fires, choice, flash, pool, felt, startleMs }.
 * bang: the team's bang delayS before the sighting; kit: a defender's { visor, ears } (KIT.designed or KIT.overrule).
 */
export function defenderFirst(r, t, st, { bang = false, delayS = 1, kit = KIT.overrule, rifle = true } = {}) {
  const H = t.H;
  if (!bang) {
    const expect = st === 'aimed' ? 'sector' : st === 'alert' ? 'alert' : 'surprise';
    const ti = takeInS(t.wf, expect, noticeGrade(r, t.awr, expect, 0), 0);
    return { fires: ti + (st === 'aimed' ? 0 : aimTurnS(t.wh, st === 'alert' ? 60 : 90, 0.15, 0, { rifle })) + TRIGGER_S, choice: 'fight', flash: null, pool: 0, felt: 0, startleMs: 0 };
  }
  const prot = kit(t), b = -Math.round(delayS * 1000);
  const pool0 = poolAdd(0, inputPts('flash', { indoor: true }) * inputK({ kind: 'flash', prep: 'unprepared', ears: prot.ears })), f0 = feltFrom(pool0, H);
  const startleMs = f0 >= STARTLE_FROM ? startleMsOf({ u: next(r), H, n: 0 }) : 0, stEnd = b + startleMs, startledAt = startleMs > 0;
  const u = next(r), fc = FACING[st], face = u < fc[0] ? 'front' : u < fc[0] + fc[1] ? 'side' : 'back';
  const flash = prot.visor ? null : face === 'front' ? 'blind' : face === 'side' ? 'dazzled' : null;
  const blindEnd = flash === 'blind' ? b + FLASH_BLIND_MS : b, dazzleEnd = flash === 'dazzled' ? b + FLASH_DAZZLE_MS : b;
  const held = st === 'aimed' && !startledAt, turnEnd = held ? b : stEnd + TURN_MS;
  let state = 'startled', since = 0, band = 0, aimDone = held ? b : null, inCover = false, first = null, takeEnd = null;
  const feltAt = (ms) => feltFrom(suppAt({ supp: pool0, suppAtMs: b, suppRate: inCover ? SUPP_DECAY.cover : SUPP_DECAY.exposed }, ms), H);
  const decide = (ms) => {
    state = choose(r, t, feltAt(ms)); since = ms; band = bandN(feltAt(ms)); if (first === null) first = state;
    if (state === 'cover' || state === 'blind') { inCover = true; aimDone = null; }
    else if (state === 'fight' && aimDone === null) aimDone = ms + 1000 * aimTurnS(t.wh, inCover ? 30 : 15, 0.15, feltAt(ms), { rifle });
    else if (state === 'freeze') aimDone = null;
  };
  for (let ms = Math.max(b, turnEnd); ms <= 10_000; ms += 50) {
    if (state === 'startled') decide(ms);
    else if (reroll(state, bandN(feltAt(ms)), band, ms - since)) decide(ms);
    else band = bandN(feltAt(ms));
    if (state === 'flee' || state === 'surrender') return { fires: Infinity, choice: first, flash, pool: pool0, felt: f0, startleMs };
    if (takeEnd === null && ms >= 0 && ms >= blindEnd) {
      const g = noticeGrade(r, t.awr, 'sector', modOf(feltAt(ms), 'awareness') + (ms < dazzleEnd ? DAZZLE_SIGHT : 0));
      takeEnd = ms + 1000 * takeInS(t.wf, 'sector', g, feltAt(ms));
    }
    if (takeEnd !== null && ms >= takeEnd) {
      if (ms === Math.ceil(takeEnd / 50) * 50 && state !== 'fight') decide(ms);
      if (state === 'fight' && aimDone !== null && ms >= aimDone) return { fires: (Math.max(ms, aimDone) + 1000 * TRIGGER_S) / 1000, choice: first, flash, pool: pool0, felt: f0, startleMs };
    }
  }
  return { fires: Infinity, choice: first ?? 'freeze', flash, pool: pool0, felt: f0, startleMs };
}

/** How often the marine fires first (or the defender never fires an aimed round at him): 0 to 1, over n seeded runs. */
export function raceOdds(m, t, st, { bang = false, n = 4000, seed = 1, kit = KIT.overrule, delayS = 1, rifle = true } = {}) {
  const r = seedRng(seed);
  let w = 0;
  for (let i = 0; i < n; i++) if (marineFirst(r, m, { bang, rifle }) < defenderFirst(r, t, st, { bang, delayS, kit, rifle }).fires) w++;
  return w / n;
}

/** The defender's median first round, without and with the bang (T11): { without, with, never }. */
export function boughtOf(t, st, { n = 4000, seed = 1, kit = KIT.overrule } = {}) {
  const r1 = seedRng(seed), r2 = seedRng(seed + 1), a = [], b = [];
  let never = 0;
  for (let i = 0; i < n; i++) { a.push(defenderFirst(r1, t, st).fires); const x = defenderFirst(r2, t, st, { bang: true, kit }); b.push(x.fires); if (x.fires === Infinity) never++; }
  a.sort((x, y) => x - y); b.sort((x, y) => x - y);
  return { without: a[n >> 1], with: b[n >> 1], never: never / n };
}

// ---- the bangs' turn (T14; COMBAT §5.8, §25.18.3) ----

/** The bangs on the bay: three 1 s apart, 1.5 m behind, in the open, unprepared, ears unprotected; the turn TURN_AFTER_MS after the third. */
export const BANGS_GAP_MS = 1000, BANGS_N = 3, BANG_BEHIND_M = 1.5, TURN_AFTER_MS = 2000;

/** Three bangs on a sheet (supp.js's pool and startle): { pool, felts, startleEndMs, frozeMs (FROZE: the freeze in all, startles joined as supp.js joins them), inAllMs (every span's union) } (ms from the first bang). */
export function bangsOn(r, H, { n = BANGS_N, gapMs = BANGS_GAP_MS, ears = 'none', prep = 'unprepared' } = {}) {
  const pts = inputPts('flash', { rM: BANG_BEHIND_M }) * inputK({ kind: 'flash', prep, ears });
  let pool = 0, felt = 0, froze = 0, until = null, chain = 0, last = -Infinity;
  const felts = [], spans = [];
  for (let i = 0; i < n; i++) {
    const at = i * gapMs, s0 = pool > 0 ? suppAt({ supp: pool, suppAtMs: last, suppRate: SUPP_DECAY.exposed }, at) : 0, before = feltFrom(s0, H);
    chain = at - last <= STARTLE_REPEAT_MS ? chain + 1 : 1; last = at;
    pool = poolAdd(s0, pts); felt = feltFrom(pool, H); felts.push(felt);
    if (felt - before >= STARTLE_FROM && prep !== 'prepared') {
      const ms = startleMsOf({ u: next(r), H, n: chain - 1, forewarned: prep === 'forewarned' });
      const on = until !== null && at < until, joins = on || (until !== null && at - until <= STARTLE_JOIN_MS), next1 = Math.max(on ? until : 0, at + ms);
      froze = !joins ? ms : on ? froze + Math.max(0, next1 - until) : froze + ms;
      until = next1;
      spans.push([at, at + ms]);
    }
  }
  let inAll = 0, end = -Infinity;
  for (const [a, b] of spans) { if (a > end) { inAll += b - a; end = b; } else if (b > end) { inAll += b - end; end = b; } }
  return { pool, felts, startleEndMs: until, frozeMs: froze, inAllMs: inAll };
}

const offSafeMs = (wh, felt) => actionMs({ value: () => wh, timeK: suppTimeK(felt) }, { type: 'gun', model: 'r7' }, 'selector:semi');

/**
 * From the turn to the first round on the bay (T14), one run: the startle, the take-in in his sector at 7 m, Off safe below
 * rung 2 (up to eight tries, the ladder's fumble and sling), the aim from low ready, the trigger. Returns { s, fumbled, still }.
 */
export function turnToFirst(r, s, { bangs = true } = {}) {
  const turn = (BANGS_N - 1) * BANGS_GAP_MS + TURN_AFTER_MS;
  const b = bangs ? bangsOn(r, s.H) : { pool: 0, startleEndMs: null };
  const still = (b.startleEndMs ?? 0) > turn;
  let ms = Math.max(turn, b.startleEndMs ?? 0);
  const lastBang = (BANGS_N - 1) * BANGS_GAP_MS;
  const f = bangs ? feltFrom(suppAt({ supp: b.pool, suppAtMs: lastBang, suppRate: SUPP_DECAY.exposed }, ms), s.H) : 0, m = modOf(f, 'weapons');
  ms += 1000 * takeInS(s.wf, 'sector', noticeGrade(r, s.awr, 'sector', modOf(f, 'awareness')), f);
  let fumbled = false;
  if (s.rung < 2) {
    for (let k = 0; k < 8; k++) {
      const d = d20(r), mg = d + s.wh + m - 6, g = gradeOf(d, mg), base = offSafeMs(s.wh, f);
      if (passed(g)) { ms += base; break; }
      fumbled = true; ms += Math.round(base * (1 + FUMBLE_K));
      if (mg <= -DROP_BY || (d === 1 && s.wh < NAT1_DROP_BELOW && next(r) < NAT1_DROP)) ms += SLING_RECOVER_S * 1000 * paceOf(s.wh);
    }
  }
  ms += 1000 * (aimTurnS(s.wh, 0, 0.15, f) + TRIGGER_S);
  return { s: (ms - turn) / 1000, fumbled, still };
}

/** T14 over n runs: { mean, p95, fumbled, still, calm }. */
export function turnTable(s, { n = 20_000, seed = 16_000 } = {}) {
  const r = seedRng(seed + s.wf), xs = [];
  let fum = 0, still = 0;
  for (let i = 0; i < n; i++) { const x = turnToFirst(r, s); xs.push(x.s); if (x.fumbled) fum++; if (x.still) still++; }
  xs.sort((a, b) => a - b);
  const rc = seedRng(seed + 1000 + s.wf);
  let c = 0;
  for (let i = 0; i < Math.min(n, 4000); i++) c += turnToFirst(rc, s, { bangs: false }).s;
  return { mean: xs.reduce((a, b) => a + b, 0) / n, p95: xs[Math.floor(0.95 * n)], fumbled: fum / n, still: still / n, calm: c / Math.min(n, 4000) };
}
