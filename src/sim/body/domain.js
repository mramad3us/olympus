// OLYMPUS body: the body domain, as game.js composes it (TECH §2.5; the build sheet 0.0.4 §2.1, §2.2.9, §8 item 7).
//
// The body lives on the person (CONTRACTS §9: people[pid].body), so the domain claims no top-level
// key. It adds to the game, after places and before people in DOMAIN_ORDER (TIME §5.4's slow order:
// the place, the body, the people):
//   start      a new game's (game.js runs it after the fill and the jobs): every body at v2, and the
//              player's start body where the fill left none (startBody: the template advanced along
//              the reference sol to the clock, the traits drawn from the world's seed), its first
//              interrupting crossing posted;
//   bodyFast   the fast layer (TECH §3.1, layer 5): this tick's load into the live mix (body.held:
//              the activity's part when one runs, else the player's gait or posture; when the tick's
//              load differs from the mix's, the mix is synced first, so a mix is always one load), and
//              stamina stepped (BODY §8);
//   body       the slow contributor (steady: the body never holds a skip to minute steps; its own
//              grid is the minute already): bodySync the player to the step's end, then the next
//              interrupting crossing solved again when the load's segment changed since it was solved,
//              and a crossing that came by without its event (a load that changed between solves)
//              posted at its own second, so a skip still stops on it;
//   events     'body' (a crossing, prio 3: TIME's B interrupts): the body synced, 'body-interrupt'
//              told if the crossing still holds, the next one solved; 'body-hazard' (bursting, 3% a
//              minute; desperate, 2%): the bladder or the bowel lets go if still in its band;
//   upgrades   'body:v2': a v0.0.3 save's bodies set to v2 and the player's ledgers written as
//              startBody at the save's clock (flag mig:body-v2). A new save is unchanged by it.
//              The eyes need none (0.0.5): a body with no eyes record (a v0.0.3 or v0.0.4 save, a new
//              game) has eyes adapted to the light they stand in, and the first tick anchors them there
//              at the clock, as an upgrade would have, without moving a save on load;
//   eyes       (0.0.5, src/sim/body/eyes.js) the player's eyes brought to the tick in the bodyFast
//              layer, after the body (the light's key checked each tick, the field the eyes receive,
//              perception's fieldOf, re-read for their own move), and in a skip by the slow
//              contributor 'eyes' at each step (the light's steps, the open air's minute, the lids):
//              the same anchors lived or skipped. Steady, its next change while the eyes' field reads
//              the open air the next minute the sky's level changes, an hour on at most (so a day's hour
//              steps never pass the sky's minutes at dawn and dusk, and never cut a night or a noon
//              into minutes), else none.
// The squad's bodies stay { v: 2, tmpl, heightM, build } this round (their needs come at 0.0.9).
// 0.0.7 (the build sheet 0.0.7 §2.2, §2.7; src/sim/body/wounds.js): the wounds, anyone's, needs or not.
//   bodyFast   first, for each actor on the live area whose body carries wounds (an unwounded one is
//              passed over: nothing new runs): the stance 'down' while downOf says so (a casualty
//              lies; a figure not down any more is stood up again, the player's only by a move key:
//              BODY change 2, getting up is the player's choice; anyone else's once nothing bleeds
//              and no round is in a leg or the torso: such a casualty waits for the corpsman and the
//              stretcher where they fell, my call), the bleed's factor (the gait's
//              exertion, the cold of the core: stepWounds re-anchors when it changes), and the drips
//              (blood.js dripStep, lived only);
//   body       the slow contributor steps every wounded body to the step's end first (stepWounds,
//              lived each minute and each skip step alike: a closed form, so a minute's steps and one
//              skip agree; in a skip the player's factor is the activity's), a death told as
//              'body-dead'; then the player's needs as before.
// Hits come by call (applyHit), never by event: no event or upgrade is added (§8 item 14).
import { TICK_MS, SEC_MS } from '../../core/clock.js';
import { playerId, playerActor, ids } from '../../core/ids.js';
import { post } from '../../core/queue.js';
import { q } from '../../core/num.js';
import { BLADDER } from '../../data/body/needs.js';
import { BODY_V, deltaOf, massOfRecord } from './record.js';
import { bodySync, bodyOf, envAt, segOf, segKey, resolveCrossing, startBody, activityLoad, gaitLoad, covering, ceilSec, letGo, LEDGERS } from './body.js';
import { staminaTick } from './motion.js';
import { stagesOf } from './cues.js';
import { asleepAt } from './sleep.js';
import { activityNow } from '../time/doing.js';
import { siteLonEDeg } from '../jobs.js';
import { eyesStep, skyChangeMs } from './eyes.js';
import { eyeOf, fieldOf } from '../people/perception.js';
import { sightGridOf } from '../places/sight.js';
import { hasWounds, stepWounds, downOf, exertionOf, holdFactor, bleeding } from './wounds.js';
import { dripStep } from './blood.js';

/** The fast layer 'bodyFast': this tick's load into the live mix, and stamina (see the header). */
export function bodyFastStep(state, input, bus) {
  woundsFast(state, input);
  const pid = playerId(state), p = state.people?.[pid];
  let rec = p?.body;
  if (!rec || rec.atMs === null || rec.atMs === undefined) return;
  const ms = state.clock.ms, env = envAt(state, pid), mass = massOfRecord(rec), a = covering(activityNow(state, ms), ms);
  const load = a ? activityLoad(a, env, mass, true) : gaitLoad(playerActor(state), env, mass, true);
  const sig = `${load.key}|${env.key}`;
  if (rec.held?.ms > 0 && rec.held.sig !== sig) { bodySync(state, pid, ms, bus); rec = p.body; }
  const h = (rec.held ??= {});
  if (!(h.ms > 0)) { h.cur = load; h.env = env; h.sig = sig; h.ms = 0; }
  h.ms += TICK_MS;
  const st = staminaTick(rec.stamina ?? 100, !!rec.blown, load.metG, TICK_MS / SEC_MS);
  if (st.stamina >= 100) delete rec.stamina; else rec.stamina = q(st.stamina, 1e-9);
  if (st.blown) rec.blown = true; else delete rec.blown;
  stepEyes(state, state.clock.ms, true);
}

// (a casualty who waits for the corpsman and the stretcher where they fell, the knock over: still bleeding, or shot in a leg or the torso; my call)
const waits = (rec, ms) => bleeding(rec, ms) || (rec.injuries ?? []).some(i => i.gunshot && (i.part === 'torso' || i.part.startsWith('leg')));
// (whether a tick's input moves the feet: the player's way up from 'down')
const moving = (input) => !!input && ((input.mx ?? 0) !== 0 || (input.mz ?? 0) !== 0);
/** The fast layer's wounds (see the header): the casualty's stance, the bleed's factor, the drips. Writes. */
export function woundsFast(state, input) {
  const list = state.actors?.list;
  if (!list?.length) return;
  const ms = state.clock.ms, me = state.player?.actor;
  let any = false;
  for (const a of list) {
    const rec = a.who ? state.people?.[a.who]?.body : null;
    if (!hasWounds(rec)) continue;
    any = true;
    const d = downOf(rec, ms);
    if (d.down) a.stance = 'down';
    else if (a.stance === 'down' && (a.id === me ? moving(input) : !waits(rec, ms))) delete a.stance;
    if (!rec.dead) holdFactor(rec, ms, { exertion: exertionOf(a), coreC: rec.thermal?.coreC ?? 37 });
  }
  if (any) dripStep(state, ms);
}
// (the bleed's factor in a skip: the player's activity's kind, still for anyone else)
const SKIP_EXERTION = Object.freeze({ walk: 1.5, run: 2.5 });
/** Every wounded body brought to toMs (see the header); a death told. Writes. */
export function woundsSlow(state, bus, fromMs, toMs, ctx = {}) {
  const pid = playerId(state);
  for (const id of ids(state.people ?? {})) {
    const rec = state.people[id].body;
    if (!hasWounds(rec)) continue;
    let k = null;
    if (ctx.skipping) {
      const act = id === pid ? covering(activityNow(state, fromMs), fromMs) : null;
      k = { exertion: SKIP_EXERTION[act?.kind] ?? 1, coreC: rec.thermal?.coreC ?? 37 };
    }
    const { events } = stepWounds(rec, fromMs, toMs, k);
    for (const e of events) if (e.kind === 'dead') bus?.emit('body-dead', { who: id, why: e.why, atMs: e.atMs });
  }
}

/** The player's eyes brought to ms (src/sim/body/eyes.js eyesStep); look: the eyes' own move too (lived ticks). */
export function stepEyes(state, ms, look = false) {
  const pid = playerId(state), me = playerActor(state), area = state.places?.live?.area;
  if (!pid || !area || !me) return null;
  // (the light the eyes receive at a time, the lids shut or not: perception's field from where the eyes are)
  const eye = eyeOf(state, me), fieldAt = (t, shut) => fieldOf(state, eye, t, shut);
  const gen = sightGridOf(state, area, eye.x, eye.z)?.gen ?? 0;
  const lookSig = look ? `${area}|${eye.x}|${eye.z}|${eye.headRad}|${eye.eyeLayer}|${eye.asleep ? 1 : 0}|${gen}` : null;
  return eyesStep(state, pid, ms, fieldAt, { look, lookSig });
}
/** The slow contributor 'eyes': the player's eyes to the step's end by time alone (the light's steps, the open air's minute, the lids). */
export function eyesSlowStep(state, bus, fromMs, toMs) { stepEyes(state, toMs, false); }
/** When the eyes' field may next change by time alone: while it reads the open air, the next game minute the sky's level changes (or an hour on, to look again: eyes.js skyChangeMs), else never (the light's steps are found inside any step). */
export function eyesNextChangeMs(state, t0) {
  return skyChangeMs(state, state.people?.[playerId(state)]?.body?.eyes, t0);
}

/** The slow contributor 'body' (see the header). */
export function bodySlowStep(state, bus, fromMs, toMs, ctx = {}) {
  woundsSlow(state, bus, fromMs, toMs, ctx);
  const pid = playerId(state), rec = state.people?.[pid]?.body;
  if (!rec || rec.atMs === null || rec.atMs === undefined) return;
  const out = bodySync(state, pid, toMs, bus);
  const h = state.people[pid].body.held ?? {}, src = `body:${pid}`;
  const missed = out.crossed.filter(c => c.interrupt && !(h.posted && h.posted.ledger === c.ledger && h.posted.band === c.to && h.posted.atMs === ceilSec(c.atMs)));
  for (const c of missed) post(state, { atMs: Math.min(toMs, ceilSec(c.atMs)), prio: 3, kind: 'body', src, who: pid, line: c.words || null, payload: { ledger: c.ledger, band: c.to } });
  if (missed.length || h.solved !== segKey(segOf(state, pid, toMs))) resolveCrossing(state, pid, toMs);
}

// (whether a crossing's event still holds when it is dispatched: the ledger at or past the band it named)
function holds(state, pid, ledger, band, ms) {
  const b = bodyOf(state, pid, ms);
  if (!b || b.atMs === null) return false;
  if (band === 'accident') return true;
  if (ledger === 'sleep') return band === 'woke' ? b.sleep.wokeMs !== null && b.sleep.wokeMs !== undefined : true;
  if (ledger === 'bladder' && band === 'wake') return asleepAt(b.sleep, ms) && b.bladder.ml >= BLADDER.WAKE_ML;
  const spec = LEDGERS.find(l => l.key === ledger && !l.pseudo), s = stagesOf(b, ms, siteLonEDeg(state))[ledger];
  const want = spec ? spec.bands.findIndex(x => x.id === band) : -1;
  return !!s && want >= 0 && s.i >= want;
}

/** A crossing's event (kind 'body'): the interrupt told if it still holds, the next one solved. */
export function onBodyEvent(state, bus, ev) {
  const pid = ev.who, ms = state.clock.ms;
  if (!pid) return;
  bodySync(state, pid, ms, bus);
  const { ledger, band } = ev.payload ?? {};
  if (holds(state, pid, ledger, band, ms)) bus.emit('body-interrupt', { who: pid, ledger, band, atMs: ev.atMs });
  resolveCrossing(state, pid, ms);
}

/** A hazard come due (kind 'body-hazard'): the accident, if the ledger is still in its band. */
export function onHazard(state, bus, ev) {
  const pid = ev.who, ledger = ev.payload?.ledger;
  if (!pid || !ledger) return;
  letGo(state, pid, ledger, state.clock.ms, bus);
}

// (every body at v2, the player's started where it has no ledgers: start's and the upgrade's one rule)
function startBodies(state) {
  let changed = 0;
  for (const id of ids(state.people ?? {})) { const b = state.people[id].body; if (b && b.v !== BODY_V) { b.v = BODY_V; changed++; } }
  const pid = playerId(state), p = pid ? state.people?.[pid] : null;
  if (p && (p.body?.atMs === null || p.body?.atMs === undefined)) {
    p.body = deltaOf(startBody(p, state.clock.ms, siteLonEDeg(state), state.meta.seed));
    resolveCrossing(state, pid, state.clock.ms);
    changed++;
  }
  return changed;
}
// (a new game's start: the bodies as the upgrade has them, and the player's first crossing posted whatever
// made the body (a test scene makes its own), so an activity begun at once lands on its own second)
function startGame(state) {
  startBodies(state);
  const pid = playerId(state), p = pid ? state.people?.[pid] : null;
  if (p?.body && Number.isFinite(p.body.atMs) && !(state.events ?? []).some(ev => !ev.dead && ev.src === `body:${pid}`)) resolveCrossing(state, pid, state.clock.ms);
}
/** The upgrade 'body:v2' (see the header). */
export function upgradeBodies(state) {
  if (startBodies(state)) (state.flags ??= {})['mig:body-v2'] = true;
}

/** The body domain's descriptor (TECH §2.5). */
export const bodyDomain = Object.freeze({
  name: 'body',
  owner: 'BODY',
  keys: Object.freeze([]),
  idMaps: Object.freeze({}),
  idFields: Object.freeze({}),
  init: () => {},
  start: startGame,
  fast: Object.freeze({ bodyFast: bodyFastStep }),
  slow: Object.freeze([Object.freeze({ name: 'body', step: bodySlowStep, steady: () => true, nextChangeMs: () => Infinity }),
    Object.freeze({ name: 'eyes', step: eyesSlowStep, steady: () => true, nextChangeMs: eyesNextChangeMs })]),
  jobs: Object.freeze({}),
  events: Object.freeze({ body: onBodyEvent, 'body-hazard': onHazard }),
  actions: Object.freeze({}),
  upgrades: Object.freeze([['body:v2', upgradeBodies]]),
});
