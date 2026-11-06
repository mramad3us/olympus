// OLYMPUS sim: the activities' rules, how long each takes here and now, what it needs, how it runs and what it leaves (TIME §5.3, §8; the build sheet 0.0.4 §2.2.1).
//
// The table is src/data/activities.js (frozen data); its rules live here by the same id (TECH §2.4).
// activitiesAt(state, x, z) lists what the spots within SPOT_REACH_M 0.6 m let the player do: a
// shower stall a shower; a sink the basin and a drink; a urinal the head; a
// toilet stall a stall or the head; the foot of the player's own rack sleep, a nap and dressing; the
// player's own wall locker dressing; a machine a bar or a drink by its make. Another marine's rack or
// locker offers nothing; a spot with someone else within FIXTURE_FREE_M 0.5 m of it is not free.
// planOf(state, id, { spotId, args }) is the price on the tag: { ok, why, durMs, parts: [{ part,
// fromMs, toMs, …rec }], endMs, kind, late }, its parts laid end to end from now, every end but the
// last on its first whole second (the activity-part events sit there; a part the plan shortens, by a
// resume from its front or a fit from its end, keeps its full length, fullMs, and what was done of it
// before, doneMs, so its effects go by the share lived of the whole part), plan.fullMs the length
// before a fit (what is left to do of it), and kind by TIME §5.2: 'live'
// under LIVE_MAX_MS 45 s, 'ff' (a fast-forward of lived ticks) under FF_MAX_MS 120 s while the live
// actors × the planned seconds stay within FF_ACTOR_S_MAX 6,000, else 'outcome'. The rules for the
// lengths (TIME §8.2 to §8.4): the shower's water minutes by site (Melas 3); dressing 0.6 × the
// outfit taken off plus the one put on (DRESS_MIN: PT kit 2 min, utilities 4, a towel 0: PT kit to
// utilities 5.2 min), × DRESS_HURRY_K 0.5 into utilities while a drill is open (doing.js dressTempo);
// sleep's turn-in (to PT kit) where you are not in it, then the rack until reveille (the next
// reveille event) or a chosen time, 20 minutes to 12 hours; a nap of 20, 45 or 90 minutes; the
// basin's shave only where stubble shows (BODY's STUBBLE_SHOWS_H, 12 h, on a body that grows a beard);
// standing fast until the open drill's stand-down. args: dress { to }, sleep { until: 'reveille' | a
// game ms, forMs }, nap { min }, idle { ms }, resume { remainingMs, outfit } (time.resume's: "finish
// your shower", in what you wore into it).
// lateCheck(state, id, spotId, durMs) is TIME §9.5's obligation check, cut to this round's one
// obligation, an open alert drill, mustered for or not: before the count, an activity that ends after
// the count's due time less the walk back to the rack's foot (the open grid's path at BODY's walk,
// 1.14 m/s) and the dressing into utilities it leaves to do is late; from the count to the
// stand-down every activity is (leaving the muster before the stand-down: the review of v0.0.4).
// { block: 'drill', dueMs, walkMs, dressMs, endMs, fitMs, label }, fitMs the length that would still
// make it ('fit it in'; 0 after the count). Dressing into utilities and standing fast are never
// late: they are how one musters; nor is the debug's idle.
// startActivity(state, bus, ctx, { id, spotId, args, late, force }) runs TIME §5.3's checks (not in
// stop motion or a skip or another activity, nor while one of the player's transitions plays (R pressed
// again as the rise plays: the review of v0.0.4); standing, at the spot, the fixture free (lying
// awake in your own rack, sleep and a nap may begin there); its own
// preconditions, your own rack and locker; the obligation, refused 'late' unless late is 'fit' (the
// activity shortened to fitMs, refused under its min) or 'accepted'), writes time.doing (doing.js),
// steps the player onto the spot (a 'step' transition of STEP_IN_MS, src/sim/people/place.js), posts
// each part's end but the last as an 'activity-part' event (prio 5, src 'time:activity', with the
// part's line for the ticker), and then lives it (mode 'live': the feet held, a move key cuts it at
// its fraction) or hands it to the skip engine (ctx.sim.beginSkip, kind 'ff' or 'outcome' as above;
// force: 'live' | 'ff' | 'outcome' for the tests), telling the bus 'activity' { phase: 'start' }.
// finishActivity(state, bus, endMs, { by, fraction }) closes it, from finishSkip or the live check:
// the part under way given its share (whole parts were given theirs at their events), the landing
// pose and outfit (TIME §7.5: a shower cut or fitted short of its whole dress part lands you in a
// towel; sleep always in the rack), the log line at its end (TIME §8.8's voice, by hashPick(lines,
// id, pid, floor(ms / 12,000))), a cut resumable one (cut by a key, an interrupt or a fit) left in
// time.resume { activity, spotId, remainingMs, untilMs, outfit } for RESUME_MS 10 minutes or until
// the player is 2 m from it (R offers "finish your shower · 7 min"; the outfit worn into it is the one
// its dress part puts back), and 'activity' { phase: 'end' }. Its fraction is of the whole plan
// before a fit, so a fitted shower is cut short.
// The effects, each through BODY's own door (every change calls its bodySync first, so lived and
// skipped meet the same body): the head relieve(bladder 1.0 × the share); a stall the bowel 0.9 and
// the bladder 1.0, × the share; the shower wash(the water minutes lived) at the water's end or its cut,
// a towel until the dress part ends whole and the outfit worn in after it; the basin groom by the
// parts done whole; dressing the outfit at its end (past half-way, cut: the new one);
// sleep and a nap sleepBegin as the rack part starts and sleepEnd as it ends or is cut (the cause:
// reveille, the klaxon, the body, the player, or natural); a drink and a bar intake × the share.
import { isHeld, SEC_MS, MIN_MS, TICK_MS, wholeTicks, durationText } from '../../core/clock.js';
import { playerActor, playerId, cmpId } from '../../core/ids.js';
import { post, cancel, sorted } from '../../core/queue.js';
import { hashPick } from '../../core/hash.js';
import { marsClock } from '../../core/calendar.js';
import { ACTIVITIES, WATER_MIN, SLEEP_MAX_MS, SLEEP_MIN_MS, NAP_MIN, STUBBLE_SHOWS_H, DRINK_L, SNACK_KCAL, DRESS_HURRY_K } from '../../data/activities.js';
import { areaOf } from '../places/model.js';
import { spotsOf, seatOf } from '../places/fixtures.js';
import { openNavOf, path } from '../places/nav.js';
import { PLAYER_CLS, WALK_MS } from '../places/move.js';
import { siteLonEDeg } from '../jobs.js';
import { logEntry } from '../log.js';
import { FF_MAX_MS } from './skip.js';
import { activityNow, activityOf, dressMs, dressTempo, transPlaying } from './doing.js';
import { musterOf } from './alerts.js';

export { dressMs };
import { nightOf } from './pod.js';
import { stepOnto, layPlayer, outfitOf, setOutfit } from '../people/place.js';
import { bodyOf, intake, relieve, wash, groom, sleepBegin, sleepEnd } from '../body/body.js';
import { stagesOf, hasBeard } from '../body/cues.js';

/** Under this an activity is lived at 1:1 (TIME §8.1), ms. */
export const LIVE_MAX_MS = 45_000;
/** A fast-forward is allowed while live actors × planned seconds stay within this (TIME §5.2). */
export const FF_ACTOR_S_MAX = 6_000;
/** A spot is at hand within this, metres (my call). */
export const SPOT_REACH_M = 0.6;
/** A fixture is taken when someone else stands within this of its spot, metres (my call). */
export const FIXTURE_FREE_M = 0.5;
/** A cut resumable activity is offered again for this long, ms (my call), and while the player is within RESUME_NEAR_M of it. */
export const RESUME_MS = 600_000, RESUME_NEAR_M = 2;
/** The events of a running activity share this source. */
export const ACTIVITY_SRC = 'time:activity';

const ceilSec = (ms) => Math.ceil(ms / SEC_MS) * SEC_MS;
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
const fixtureOfSpot = (spotId) => (typeof spotId === 'string' && spotId.includes('#') ? spotId.slice(0, spotId.lastIndexOf('#')) : null);

// ---- where ----

// (an area's spots by fixture, with the fixture: kept, places' data is frozen)
const spotIndex = new WeakMap();
function spotsWithFixtures(area) {
  let list = spotIndex.get(area);
  if (!list) spotIndex.set(area, (list = (area.fixtures ?? []).flatMap(fx => spotsOf(fx).map(sp => ({ ...sp, fx })))));
  return list;
}
/** A spot of the live area by id: { id, fixture, x, z, use, face, fx } | null. */
export function spotOf(state, spotId) {
  const area = areaOf(state?.places?.live?.area);
  return area && spotId ? spotsWithFixtures(area).find(s => s.id === spotId) ?? null : null;
}

/** The player's own rack and locker (from their berth): { rackId, lockerId, seatId }. */
export function ownOf(state, pid = playerId(state)) {
  const berth = state.people?.[pid]?.berthId ?? null, seat = berth ? seatOf(berth) : null;
  return { rackId: seat?.fixture ?? null, lockerId: seat?.lockerId ?? null, seatId: berth };
}

// (the activities a spot takes, by its use and its fixture, for this player)
function idsAt(state, sp) {
  const own = ownOf(state);
  switch (sp.use) {
    case 'shower': return ['shower'];
    case 'wash': return ['basin', 'drink'];
    case 'urinate': return ['urinate'];
    case 'toilet': return ['bowel', 'urinate'];
    case 'drink': return ['drink'];
    case 'buy': return [sp.fx.make === 'snack' ? 'snack' : 'drink'];
    case 'sleep': return sp.fixture === own.rackId ? ['sleep', 'nap', 'dress'] : [];
    case 'dress': return sp.fixture === own.lockerId ? ['dress'] : [];
    default: return [];
  }
}

/** Whether anyone but the player stands within FIXTURE_FREE_M of a spot. */
export function spotFree(state, sp) {
  const me = playerActor(state);
  for (const a of state.actors?.list ?? []) {
    if (a === me) continue;
    if (dist(a.x, a.z, sp.x, sp.z) <= FIXTURE_FREE_M && (a.posture ?? 'stand') !== 'lie') return false;
  }
  return true;
}

/** The spots within SPOT_REACH_M of (x, z) whose use an activity takes: [{ id, spotId, fixtureId, use, free, d }], nearest first, ties by id. */
export function activitiesAt(state, x, z) {
  const area = areaOf(state?.places?.live?.area);
  if (!area) return [];
  const out = [];
  for (const sp of spotsWithFixtures(area)) {
    const d = dist(x, z, sp.x, sp.z);
    if (d > SPOT_REACH_M) continue;
    const ids = idsAt(state, sp);
    if (!ids.length) continue;
    const free = spotFree(state, sp);
    for (const id of ids) out.push({ id, spotId: sp.id, fixtureId: sp.fixture, use: sp.use, free, d });
  }
  return out.sort((a, b) => a.d - b.d || cmpId(a.spotId, b.spotId));
}

// ---- how long ----

/** The next reveille: the queue's own event, else the night's. */
export function nextReveilleMs(state, fromMs = state.clock.ms) {
  let best = Infinity;
  for (const ev of sorted(state)) if (ev.kind === 'reveille' && ev.atMs > fromMs) { best = ev.atMs; break; }
  if (Number.isFinite(best)) return best;
  let n = nightOf(state, fromMs);
  if (n.reveilleMs <= fromMs) n = nightOf(state, n.reveilleMs + 12 * 3_600_000);
  return n.reveilleMs;
}

// (does an optional part happen: the shave where stubble shows on a face that grows it, the stall where the bowel could go, the turn-in out of PT kit)
function wants(state, opt) {
  const pid = playerId(state), body = bodyOf(state, pid);
  if (opt === 'stubble') return !!body && hasBeard(body) && (body.hygiene?.stubbleH ?? 0) >= STUBBLE_SHOWS_H;
  if (opt === 'bowel') return !!body && (stagesOf(body, state.clock.ms, siteLonEDeg(state))?.bowel?.i ?? 0) >= 1;
  if (opt === 'turn-in') return outfitOf(playerActor(state)) !== 'pt';
  return true;
}

// (a part's length by its rule)
function partMs(state, id, def, args, atMs) {
  if (typeof def.ms === 'number') return def.ms;
  const me = playerActor(state);
  switch (def.ms) {
    case 'water': return Math.round((WATER_MIN[state.places?.live?.site] ?? WATER_MIN.melas) * MIN_MS);
    case 'dress': {
      const to = id === 'sleep' ? 'pt' : args.to ?? defaultDressTo(state);
      return dressMs(outfitOf(me), to, dressTempo(state, to, atMs));
    }
    case 'until': {
      const until = args.until === undefined || args.until === 'reveille' ? nextReveilleMs(state, atMs) : Number(args.until);
      const want = Number.isFinite(args.forMs) ? args.forMs : until - atMs;
      return Math.max(SLEEP_MIN_MS, Math.min(SLEEP_MAX_MS, want));
    }
    case 'nap': return (NAP_MIN.includes(args.min) ? args.min : 45) * MIN_MS;
    case 'asked': return Math.max(TICK_MS, Number(args.ms) || MIN_MS);
    case 'standdown': { const d = state.time?.drills?.open; return d && d.endMs > atMs ? wholeTicks(d.endMs - atMs) : 0; }
    default: throw new Error(`no length rule '${def.ms}' (${id})`);
  }
}

/** What dressing at your locker or rack puts on by default: utilities while a drill is open, from PT kit or a towel; else PT kit. */
export function defaultDressTo(state) {
  const o = outfitOf(playerActor(state));
  if (state.time?.drills?.open) return 'utilities';
  return o === 'pt' || o === 'towel' ? 'utilities' : 'pt';
}

/** The kind an activity of durMs takes here (TIME §5.2): 'live' | 'ff' | 'outcome'. */
export function kindFor(state, durMs) {
  if (durMs < LIVE_MAX_MS) return 'live';
  const live = state.actors?.list?.length ?? 1;
  if (durMs < FF_MAX_MS && live * (durMs / SEC_MS) <= FF_ACTOR_S_MAX) return 'ff';
  return 'outcome';
}

/** The price on the tag (see the header). */
export function planOf(state, id, { spotId = null, args = {} } = {}) {
  const rec = ACTIVITIES[id];
  if (!rec) return { ok: false, why: 'unknown', durMs: 0, parts: [], endMs: state.clock.ms, kind: null, late: null };
  const t0 = state.clock.ms, raw = [];
  let at = t0;
  for (const def of rec.parts) {
    if (def.optional && !wants(state, def.optional)) continue;
    const ms = partMs(state, id, def, args, at);
    if (ms <= 0) continue;
    raw.push({ def, ms });
    at += ms;
  }
  if (!raw.length) return { ok: false, why: 'nothing to do', durMs: 0, parts: [], endMs: t0, kind: null, late: null };
  let total = raw.reduce((s, r) => s + r.ms, 0);
  // (a resume: the plan's last remainingMs, its first parts cut from the front)
  let skipMs = 0;
  if (Number.isFinite(args.resume?.remainingMs)) { skipMs = Math.max(0, total - args.resume.remainingMs); total -= skipMs; }
  const fullMs = wholeTicks(total);
  const fit = Number.isFinite(args.fitMs);
  if (fit) total = Math.min(total, Math.max(TICK_MS, args.fitMs));
  total = wholeTicks(total);
  const parts = [];
  let from = t0, cut = skipMs, left = total;
  for (let i = 0; i < raw.length && left > 0; i++) {
    let ms = raw[i].ms;
    const full = ms;
    if (cut >= ms) { cut -= ms; continue; }
    const done = cut;
    ms -= cut; cut = 0;
    ms = Math.min(ms, left);
    const last = i === raw.length - 1 || ms >= left;
    const to = last ? t0 + total : Math.min(t0 + total, ceilSec(from + ms));
    // (a part the fit shortens by more than the boundaries' whole seconds, or the resume began part-way: its full length and what was done before)
    const fitCut = fit && full - done - (to - from) > (i + 1) * SEC_MS;
    parts.push({ ...raw[i].def, fromMs: from, toMs: to, ...(done > 0 || fitCut ? { fullMs: full, doneMs: done, ...(fitCut ? { fit: true } : {}) } : {}) });
    left = t0 + total - to;
    from = to;
    if (last) break;
  }
  const durMs = total;
  return { ok: true, why: null, durMs, fullMs: Math.max(fullMs, durMs), parts, endMs: t0 + durMs, kind: kindFor(state, durMs), late: lateCheck(state, id, spotId, durMs, args) };
}

// ---- the obligation (TIME §9.5) ----

const walkMemo = new Map();
/** The walk between two points of an area on its open grid, ms at BODY's walk (memoised by the pair). */
export function walkMs(areaId, ax, az, bx, bz) {
  const key = `${areaId}|${ax}|${az}|${bx}|${bz}`;
  let v = walkMemo.get(key);
  if (v === undefined) {
    const grid = openNavOf(areaId, PLAYER_CLS), r = grid ? path(grid, [ax, az], [bx, bz]) : null;
    const m = r && !r.fail ? r.lengthM : dist(ax, az, bx, bz) * 1.4;
    walkMemo.set(key, (v = Math.ceil((m / WALK_MS) * SEC_MS)));
  }
  return v;
}

// (a clock time as the watch shows it, the slip as '24:00 +12'; and the moment its shown minute began)
const hhmm = (ms, lon) => { const c = marsClock(ms, lon); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / MIN_MS)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`; };
const shownMinuteMs = (ms, lon) => { const c = marsClock(ms, lon); return ms - ((c.timeslip ? c.slipMs : c.civilMs) % MIN_MS); };

/** TIME §9.5's late check for an activity of durMs at a spot (see the header): null, or what makes it late. */
export function lateCheck(state, id, spotId, durMs, args = {}) {
  const d = state.time?.drills?.open, now = state.clock.ms;
  if (!d || now >= d.endMs || id === 'standfast' || id === 'idle') return null;
  if (id === 'dress' && (args.to ?? defaultDressTo(state)) === 'utilities') return null;     // (dressing for the muster is how you make it)
  const pid = playerId(state);
  const m = musterOf(state, pid), me = playerActor(state);
  if (!m) return null;
  const sp = spotOf(state, spotId), x = sp?.x ?? me?.x ?? m.x, z = sp?.z ?? me?.z ?? m.z;
  const walk = state.places?.live?.area === m.area ? walkMs(m.area, x, z, m.x, m.z) : 600_000;
  const lon = siteLonEDeg(state);
  const endMs = now + durMs;
  // (from the count to the stand-down: whatever takes you from the muster is late for it, counted or not)
  if (now >= d.dueMs) {
    const dress = dressMs(landingOutfit(state, id, 1, null, args), 'utilities', DRESS_TEMPO_DRILL);
    return { block: 'drill', dueMs: d.dueMs, walkMs: walk, dressMs: dress, endMs, fitMs: 0, label: `the stand-down at your rack, ${hhmm(d.endMs, lon)}` };
  }
  // (before it: late when it ends after the count less the walk back and the dressing it leaves; a
  // fitted shower lands you in a towel, so the fit is reckoned from the towel)
  const dressFull = dressMs(landingOutfit(state, id, 1, null, args), 'utilities', DRESS_TEMPO_DRILL);
  const by = d.dueMs - walk - dressFull;
  if (endMs <= by) return null;
  const dressCut = dressMs(landingOutfit(state, id, 0.5, null, args), 'utilities', DRESS_TEMPO_DRILL);
  return { block: 'drill', dueMs: d.dueMs, walkMs: walk, dressMs: dressFull, endMs, fitMs: Math.max(0, d.dueMs - walk - dressCut - now), label: `the count at your rack, ${hhmm(d.dueMs, lon)}` };
}
// (the tempo of the dressing an open drill leaves to do: hurried)
const DRESS_TEMPO_DRILL = DRESS_HURRY_K;

// (what an activity leaves you wearing at its end, or at a share of it; a resumed shower puts back what was worn into it)
function landingOutfit(state, id, fraction, doing = null, args = null) {
  const now = outfitOf(playerActor(state)), from = doing?.from?.outfit ?? args?.resume?.outfit ?? (args?.resume ? state.time?.resume?.outfit : null) ?? now;
  if (id === 'shower') return fraction >= 1 ? from : 'towel';
  if (id === 'dress') return fraction >= 0.5 ? (doing?.args?.to ?? defaultDressTo(state)) : from;
  if (id === 'sleep') return fraction > 0 || from === 'pt' ? 'pt' : from;
  return now;
}

// ---- starting one ----

const refuse = (bus, why, text) => { if (text) bus?.emit('line', { text, kind: 'refused' }); return { ok: false, why }; };

/** TIME §5.3's start (see the header). Returns { ok, why }. */
export function startActivity(state, bus, ctx, { id, spotId = null, args = {}, late = null, force = null } = {}) {
  const rec = activityOf(id);
  if (!rec) return refuse(bus, 'unknown', null);
  if (isHeld(state) || state.skip || state.time?.doing) return refuse(bus, 'busy', null);
  const me = playerActor(state), pid = playerId(state);
  if (!me) return refuse(bus, 'nobody', null);
  // (a transition playing, the rise from the rack above all: nothing starts until it has, so a second R never cuts it)
  if (id !== 'idle' && transPlaying(me, state.clock.ms)) return refuse(bus, 'busy', null);
  // (lying awake in your own berth: back to sleep there, the berth where you lie)
  const inBerth = (me.posture ?? 'stand') === 'lie' && !!me.spotId && me.spotId === ownOf(state).seatId && (id === 'sleep' || id === 'nap');
  if ((me.posture ?? 'stand') !== 'stand' && id !== 'idle' && !inBerth) return refuse(bus, 'lying', 'Get up first.');
  let sp = null;
  if (rec.uses.length) {
    sp = spotOf(state, spotId);
    if (!sp) return refuse(bus, 'no spot', null);
    if (!inBerth && dist(me.x, me.z, sp.x, sp.z) > SPOT_REACH_M) return refuse(bus, 'not here', null);
    if (!rec.uses.includes(sp.use) && !(id === 'dress' && (sp.use === 'sleep' || sp.use === 'dress'))) return refuse(bus, 'not here', null);
    if (!idsAt(state, sp).includes(id)) return refuse(bus, 'not yours', 'Not your rack. Not your locker.');
    if (!spotFree(state, sp)) return refuse(bus, 'taken', 'Taken.');
  }
  if (id === 'dress' && dressMs(outfitOf(me), args.to ?? defaultDressTo(state)) <= 0) return refuse(bus, 'dressed', 'Already dressed for it.');
  let plan = planOf(state, id, { spotId, args });
  if (!plan.ok) return refuse(bus, plan.why, null);
  if (plan.late) {
    if (late === 'fit') {
      if (plan.late.fitMs < Math.max(rec.min, TICK_MS)) return refuse(bus, 'late', 'No time for it.');
      plan = planOf(state, id, { spotId, args: { ...args, fitMs: plan.late.fitMs } });
    } else if (late !== 'accepted') return refuse(bus, 'late', null);
  }
  const kind = force ?? plan.kind;
  const t0 = state.clock.ms;
  // (a resumed shower: what was worn into it, not the towel it was cut in)
  const wornIn = args.resume ? args.resume.outfit ?? state.time.resume?.outfit ?? null : null;
  const from = { outfit: wornIn ?? outfitOf(me), x: me.x, z: me.z, face: me.face ?? 'down' };
  state.time.doing = {
    activity: id, spotId: sp?.id ?? null, mode: kind, fromMs: t0, toMs: plan.endMs,
    parts: plan.parts.map(p => ({ part: p.part, toMs: p.toMs, ...(p.fullMs ? { fullMs: p.fullMs, doneMs: p.doneMs ?? 0, ...(p.fit ? { fit: true } : {}) } : {}) })),
    from, args: { ...args, ...(id === 'dress' ? { to: args.to ?? defaultDressTo(state) } : {}) },
  };
  if (plan.fullMs > plan.durMs) state.time.doing.fullMs = plan.fullMs;
  if (late) state.time.doing.late = late;
  delete state.time.resume;
  if (sp && !inBerth) stepOnto(state, me, sp, t0);
  // (each part's end but the last, on its whole second: the outcome steps end there, lived and skipped read the same boundaries)
  for (let i = 0; i < plan.parts.length - 1; i++) {
    const p = plan.parts[i];
    post(state, { atMs: p.toMs, prio: 5, kind: 'activity-part', src: ACTIVITY_SRC, line: p.line ?? undefined, payload: { activity: id, part: p.part, i } });
  }
  partStart(state, bus, state.time.doing, plan.parts[0].part, t0);
  bus.emit('activity', { phase: 'start', activity: id, who: pid, spotId: sp?.id ?? null, fromMs: t0, toMs: plan.endMs, mode: kind, fraction: 0, by: null, outcome: null });
  if (kind !== 'live') {
    const posture = plan.parts.at(-1).posture ?? 'stand';
    ctx.sim.beginSkip(state, { activity: id, planMs: plan.durMs, kind, spotId: sp?.id ?? null, posture, mask: rec.mask || 'D A', chunkMs: rec.chunkMs,
      vignette: rec.vignette, stoppable: rec.stoppable });
  }
  return { ok: true, why: null, kind, durMs: plan.durMs };
}

// ---- the parts' effects ----

// (a part begins: what you wear in it, lying down in the rack)
function partStart(state, bus, d, part, ms) {
  const rec = activityOf(d.activity), def = rec?.parts.find(p => p.part === part);
  const me = playerActor(state), pid = playerId(state);
  if (!def || !me) return;
  if (def.outfit) setOutfit(me, def.outfit);
  if (def.lie) {
    layPlayer(state, me, ownOf(state).seatId, ms);
    sleepBegin(state, pid, ms, { bed: 'own-rack' }, bus);
  }
}

// (a part ends: f the share of the whole part lived in this run (for what it adds: water, relief,
// food), whole how much of the part is done, the run before a resume included (for what it finishes:
// a shave, the dress). A part neither shortened nor resumed has f = whole, 1 when it ran to its end)
function partEnd(state, bus, d, part, f, ms, whole = f) {
  const pid = playerId(state), me = playerActor(state);
  f = Math.max(0, Math.min(1, f)); whole = Math.max(0, Math.min(1, whole));
  if (f <= 0 && whole <= 0 && part !== 'lie') return;
  switch (part) {
    case 'go': relieve(state, pid, { bladderK: 1.0 * f }, ms, bus); break;
    case 'sit': relieve(state, pid, { bowelK: 0.9 * f, bladderK: 1.0 * f }, ms, bus); break;
    case 'water': if (f > 0) wash(state, pid, { waterMin: (WATER_MIN[state.places?.live?.site] ?? WATER_MIN.melas) * f }, ms, bus); break;
    case 'teeth': if (whole >= 1) groom(state, pid, { teeth: true }, ms, bus); break;
    case 'shave': if (whole >= 1) groom(state, pid, { shave: true }, ms, bus); break;
    case 'face': if (whole >= 1) groom(state, pid, { face: true }, ms, bus); break;
    case 'drink': intake(state, pid, { waterL: DRINK_L * f, food: 'water' }, ms, bus); break;
    case 'eat': intake(state, pid, { kcal: SNACK_KCAL * f, food: 'bar' }, ms, bus); break;
    case 'dress':
      if (d.activity === 'shower') { if (whole >= 1 && me) setOutfit(me, d.from.outfit); }
      else if (me && whole >= 0.5) setOutfit(me, d.args?.to ?? defaultDressTo(state));
      break;
    case 'turn-in': if (me && whole >= 0.5) setOutfit(me, 'pt'); break;
    case 'lie': {
      const by = d.stopBy ?? 'natural';
      const r = sleepEnd(state, pid, ms, { by }, bus);
      d.result = { ...(d.result ?? {}), inertia: r?.inertia ?? 0, inertiaUntilMs: r?.untilMs ?? null };
      break;
    }
    default: break;
  }
  (d.done ??= []).push(whole >= 1 ? part : `${part}:${Math.round(whole * 100) / 100}`);
}

// (a part's shares at ms: { f, whole } (see partEnd); ran: it reached its planned end)
function sharesOf(p, fromMs, toMs, ms) {
  const ran = ms >= toMs, lived = Math.max(0, Math.min(ms, toMs) - fromMs);
  if (p?.fullMs > 0) return { f: lived / p.fullMs, whole: ran && !p.fit ? 1 : ((p.doneMs ?? 0) + lived) / p.fullMs };
  const k = ran ? 1 : toMs > fromMs ? lived / (toMs - fromMs) : 1;
  return { f: k, whole: k };
}

/** The 'activity-part' event: one part ended wholly, the next begins (both engines dispatch it at its second). */
export function onActivityPart(state, bus, ev) {
  const d = state.time?.doing;
  if (!d || d.activity !== ev.payload?.activity) return;
  const i = ev.payload.i, p = d.parts[i], next = d.parts[i + 1];
  if (!p || d.done?.includes(p.part)) return;
  const { f, whole } = sharesOf(p, i === 0 ? d.fromMs : d.parts[i - 1].toMs, p.toMs, ev.atMs);
  partEnd(state, bus, d, p.part, f, ev.atMs, whole);
  if (next) partStart(state, bus, d, next.part, ev.atMs);
}

// ---- finishing one ----

const STOP_CAUSE = Object.freeze({ reveille: 'reveille', alert: 'alert', body: 'body' });
/** The cause an activity was cut by, as BODY's sleepEnd takes it: 'natural' | 'reveille' | 'alert' | 'player' | 'body'. */
export function causeOf(by, stopKind = null) {
  if (!by) return 'natural';
  if (by === 'player' || by === 'hold') return 'player';
  return STOP_CAUSE[stopKind] ?? (stopKind ? 'alert' : 'natural');           // (another interrupt woke you: as an alarm does)
}

// (TIME §8.8's line, its placeholders filled)
function lineOf(state, d, endMs, fraction) {
  const rec = activityOf(d.activity), pid = playerId(state), lon = siteLonEDeg(state);
  const durMs = endMs - d.fromMs;
  if (fraction < 1 && !['sleep', 'nap', 'wait', 'standfast', 'idle'].includes(d.activity)) return `${cap(rec.offer)}, cut short after ${durationText(durMs)}.`;
  const tmpl = hashPick(rec.log, d.activity, pid, Math.floor(endMs / 12_000));
  // (beside the clock times it prints, the duration is theirs: "Down at 21:55, up at 23:00: 1 h 5 min", never rounded past them)
  const durText = /\{(from|to)\}/.test(tmpl) ? durationText(shownMinuteMs(endMs, lon) - shownMinuteMs(d.fromMs, lon)) : durationText(durMs);
  const slip = (() => { for (let t = d.fromMs; t < endMs; t += 60_000) if (marsClock(t, lon).timeslip) return true; return marsClock(endMs, lon).timeslip; })();
  const outfit = { utilities: 'Utilities', pt: 'PT kit', towel: 'A towel' }[outfitOf(playerActor(state))] ?? 'Utilities';
  return cap(tmpl.replace('{dur}', durText).replace('{from}', hhmm(d.fromMs, lon)).replace('{to}', hhmm(endMs, lon)).replace('{slip}', slip ? ', through the slip' : '').replace('{outfit}', outfit));
}
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Close the activity under way (see the header). Returns its outcome, or null when none runs. */
export function finishActivity(state, bus, endMs = state.clock.ms, { by = null, fraction = null, stopKind = null } = {}) {
  const d = state.time?.doing;
  if (!d) return null;
  const rec = activityOf(d.activity), me = playerActor(state), pid = playerId(state);
  // (the share of the whole plan: a fitted one's of its length before the fit, so a fit is cut short)
  const planMs = d.fullMs ?? (d.toMs - d.fromMs);
  const f = fraction ?? (planMs > 0 ? Math.max(0, Math.min(1, (endMs - d.fromMs) / planMs)) : 1);
  d.stopBy = endMs >= d.toMs && !by ? 'natural' : causeOf(by, stopKind);
  cancel(state, ACTIVITY_SRC);
  // (the part under way: its shares; the parts after it: nothing)
  const now = activityNow(state, endMs);
  if (now && !d.done?.includes(now.part)) {
    const { f: pf, whole } = sharesOf(d.parts[now.index], now.fromMs, now.toMs, endMs);
    partEnd(state, bus, d, now.part, pf, endMs, whole);
  }
  // (the landing: TIME §7.5)
  const cut = f < 1;
  if (me) {
    if (rec.parts.some(p => p.lie) && (d.done ?? []).some(x => x.startsWith('lie'))) { /* (asleep in the rack: you wake lying there) */ }
    else if (cut && now?.posture === 'sit') { me.posture = 'sit'; }
    else if (me.posture === 'lie' && !rec.parts.some(p => p.lie)) delete me.posture;
    if (cut && d.activity === 'shower' && !(d.done ?? []).includes('dress')) setOutfit(me, 'towel');
  }
  const line = lineOf(state, d, endMs, f);
  logEntry(state, bus, { kind: 'activity', tone: 'note', text: line });
  if (cut && rec.resumable && d.spotId) state.time.resume = { activity: d.activity, spotId: d.spotId, remainingMs: wholeTicks(Math.max(TICK_MS, planMs - (endMs - d.fromMs))), untilMs: endMs + RESUME_MS, outfit: d.from.outfit };
  const outcome = { activity: d.activity, fraction: f, by: d.stopBy, parts: [...(d.done ?? [])], line, look: { outfit: outfitOf(me), wet: d.activity === 'shower' && (d.done ?? []).some(x => x.startsWith('water')) },
    ...(d.result ?? {}) };
  delete state.time.doing;
  bus.emit('activity', { phase: 'end', activity: d.activity, who: pid, spotId: d.spotId, fromMs: d.fromMs, toMs: endMs, mode: d.mode, fraction: f, by: d.stopBy, outcome });
  return outcome;
}

/** The time domain's input layer's part for a lived activity: a move key cuts it at its fraction, its end closes it. */
export function liveStep(state, input, bus) {
  const d = state.time?.doing;
  if (!d || d.mode !== 'live' || state.skip) return;
  if (input?.mx || input?.mz) { finishActivity(state, bus, state.clock.ms, { by: 'player' }); return; }
  if (state.clock.ms >= d.toMs) finishActivity(state, bus, d.toMs);
}

/** The resume on offer, or null (time.resume, while its time and the player's distance hold). */
export function resumeOf(state) {
  const r = state.time?.resume, me = playerActor(state);
  if (!r || !me || state.clock.ms > r.untilMs) return null;
  const sp = spotOf(state, r.spotId);
  if (!sp || dist(me.x, me.z, sp.x, sp.z) > RESUME_NEAR_M) return null;
  return { ...r, spot: sp };
}

/** Forget a resume past its time or its distance (the time domain's second layer). */
export function resumeStep(state) {
  if (state.time?.resume && !resumeOf(state)) delete state.time.resume;
}
