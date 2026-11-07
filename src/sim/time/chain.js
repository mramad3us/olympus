// OLYMPUS sim: the chain, several single actions at one fixture run one after another behind one splash (TIME §8.1, §5.3; the build sheet 0.0.6 §2.1, §8 items 10 to 15).
//
// The user, 2026-11-06: "implement ways of combining actions ... long pressing R should open the menu
// with all the possible interractions as single actions, with the ability to select several actions".
// R held checks several rows; this runs them. A chain is one fixture's single actions in ROWS' order
// (the order one does them in, not the order checked: brush teeth, shave, wash face), each planned from
// the end of the one before (planOf's fromMs and wearing: the time and the outfit the steps before
// leave; offOf's bladderMl: a stall or the head empties the bladder, so a head after a stall is struck
// "nothing to give" as it would be alone), every step's end but the last on its first whole second, as an activity's parts are, so
// lived, fast-forwarded and skipped meet the same boundaries to the millisecond.
//   planChain(state, { spotId, steps: [{ id, args }] }) → { ok, why, steps: [{ id, args, label,
//                fromMs, toMs, durMs, off }], durMs, endMs, label, kind, late }: the menu's foot ("brush
//                teeth, shave, wash face · 7 min, done 19:53"); ok false with the first step struck or
//                not at this spot (why its words); kind by the total (TIME §5.2: under 45 s lived, under
//                120 s a fast-forward, else an outcome skip); late TIME §9.5's check on the whole chain,
//                the outfit it leaves you in as its landing (a chain of musters, dressing into
//                utilities and standing fast, is never late).
//   startChain(state, bus, ctx, { spotId, steps, late, force }) → { ok, why }: TIME §5.3's checks once
//                (not busy, standing, at the spot, free); late 'fit' keeps the leading whole steps that
//                end by the late check's fitMs (none: refused, "No time for it."), 'accepted' runs it all,
//                a step never shortened inside a chain; writes time.chain { spotId, fromMs, toMs, i,
//                stopAt, late?, steps: [{ id, args, toMs, done? }] }, begins step 0 as startActivity
//                would (activities.js beginDoing: the step onto the spot, its parts' events; never a lead:
//                a sleep in a chain lies you in the berth behind the splash, v0.0.4's way), and ONE skip
//                over the chain's total (its kind by the total, its vignette the first of the steps', its
//                mask step 0's), and posts 'chain-next' { i: 0 } (prio 5, src 'time:chain') at step 0's
//                toMs.
//   onChainNext  the 'chain-next' event, in every engine at its second: step i ends (finishActivity:
//                its own effects, log line and 'activity' end), its outcome kept in steps[i].done, and
//                step i + 1 begins at the same ms (planned again from there, its end held to the
//                chain's plan), the skip's activity, mask and posture set to it, the next 'chain-next'
//                posted unless it is the last. A step refused at its start (someone at the spot, the
//                player not at it, nothing to do) ends the chain there: the skip stopped, by 'refused'.
//   chainStop    Backspace ('skip:stop' while a chain runs, from the time domain's action in a
//                fast-forward and the outcome engine's commands): the running step runs to its end and
//                the rest is dropped (stopAt, skip.toMs = stopAt, 'chain' { phase: 'stop', toMs }).
//   chainClose   the chain's end: the skip's finishSkip (or a lived chain's last step, or a move key
//                in one) records the running step's outcome, names the rest dropped, tells 'chain' {
//                phase: 'end', by: 'natural' | 'player' | 'interrupt' | 'refused' }, forgets time.chain
//                and its events, and returns the skip-end's outcome.chain [{ id, line, fraction, by }]
//                (a dropped step: line null, fraction 0, by 'dropped'). An interrupt the running step's
//                mask lets through cuts that step at its fraction (a shower left resumable) and drops
//                the rest.
//   chainNow(state, ms) → null | { spotId, steps: [{ id, label, fromMs, toMs, done }], i, n, stopAt }:
//                the splash's view.
// A chain of one is never sent by the page (the menu sends the single, with its lead); the sim runs one
// all the same. The facts: 'chain' (CONTRACTS §11, src/core/facts.js), the steps' 'activity' facts with
// chain { i, n }, the skip's 'skip-start' with chain { steps, n } and 'skip-end''s outcome.chain.
import { isHeld, SEC_MS, durationText } from '../../core/clock.js';
import { playerActor } from '../../core/ids.js';
import { post, cancel } from '../../core/queue.js';
import { ACTIVITIES } from '../../data/activities.js';
import { spotOf, spotFree, idsAt, planOf, offOf, kindFor, lateCheck, priceOf, actionWords, beginDoing, finishActivity, defaultDressTo, SPOT_REACH_M } from './activities.js';
import { activityOf, transPlaying } from './doing.js';
import { outfitOf } from '../people/place.js';

/** The chain's events share this source. */
export const CHAIN_SRC = 'time:chain';

const ceilSec = (ms) => Math.ceil(ms / SEC_MS) * SEC_MS;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const refuse = (bus, why, text) => { if (text) bus?.emit('line', { text, kind: 'refused' }); return { ok: false, why }; };

// (what a step leaves you wearing: a dress its outfit, a whole shower what you wore into it; the rest as you were)
const wearingAfter = (state, id, args, wearing) => (id === 'dress' ? args.to ?? defaultDressTo(state, wearing) : wearing);
// (a step that is how one musters: never late, so a chain of them is not either)
const mustering = (state, st, wearing) => st.id === 'standfast' || st.id === 'idle' || (st.id === 'dress' && (st.args?.to ?? defaultDressTo(state, wearing)) === 'utilities');
// (a step's place in the spot's order: its row; the wait, which needs no spot, after them)
function orderOf(state, sp) {
  const ids = sp ? idsAt(state, sp) : [];
  return (id) => { const i = ids.indexOf(id); return i >= 0 ? i : id === 'wait' ? ids.length : -1; };
}

/** The chain's plan (see the header). */
export function planChain(state, { spotId = null, steps = [] } = {}) {
  const t0 = state.clock.ms, me = playerActor(state), sp = spotOf(state, spotId);
  const none = { ok: false, why: 'nothing to do', steps: [], durMs: 0, endMs: t0, label: '', kind: null, late: null };
  if (!steps?.length || !me) return none;
  const at = orderOf(state, sp);
  // (the menu's order, which is the order one does them in: never the order checked)
  const list = steps.map((st, k) => ({ id: st.id, args: st.args ?? {}, k })).sort((a, b) => (at(a.id) - at(b.id)) || a.k - b.k);
  const out = [];
  // (what the steps before leave: the outfit, and the bladder a stall or the head empties, so the head after a stall
  // is struck 'nothing to give' as it would be alone; the fixer's, 0.0.6)
  let from = t0, wearing = outfitOf(me), bladderMl = null, ok = true, why = null, musters = true;
  for (let i = 0; i < list.length; i++) {
    const { id, args } = list[i], rec = ACTIVITIES[id], last = i === list.length - 1;
    let off = null;
    if (!rec || rec.legacy) off = 'unknown';
    else if (at(id) < 0 || (rec.uses.length && !sp)) off = 'not here';
    const p = rec ? planOf(state, id, { spotId, args, fromMs: from, wearing }) : null;
    if (!off) off = offOf(state, id, rec.uses.length ? sp : null, args, { atMs: from, wearing, plan: p?.ok ? p : null, bladderMl });
    if (!off && !p.ok) off = p.why;
    const end = p?.ok ? p.endMs : from;
    const toMs = last ? end : ceilSec(end);
    musters = musters && mustering(state, { id, args }, wearing);
    out.push({ id, args, label: `${actionWords(state, id, args)} · ${durationText(toMs - from)}`, fromMs: from, toMs, durMs: toMs - from, off });
    if (off && ok) { ok = false; why = off; }
    wearing = wearingAfter(state, id, args, wearing);
    if (id === 'bowel' || id === 'urinate') bladderMl = 0;
    from = toMs;
  }
  const endMs = out.at(-1).toMs, durMs = endMs - t0;
  const words = out.map(st => actionWords(state, st.id, st.args)).join(', ');
  const late = ok && !musters ? lateCheck(state, 'chain', spotId, durMs, { landing: wearing }) : null;
  return { ok, why, steps: out, durMs, endMs, label: priceOf(state, words, durMs), kind: kindFor(state, durMs), late };
}

// (a step begun at its start, as the chain planned it: its end held to the plan's, so every engine meets the same boundaries)
function beginStep(state, bus, i, kind) {
  const C = state.time.chain, st = C.steps[i], n = C.steps.length, me = playerActor(state);
  const sp = spotOf(state, C.spotId), rec = activityOf(st.id);
  // (refused at its start: someone took the spot, or you are not at it)
  if (rec.uses.length) {
    if (!sp) return 'no spot';
    if (Math.hypot(me.x - sp.x, me.z - sp.z) > SPOT_REACH_M) return 'not here';
    if (!spotFree(state, sp)) return 'taken';
  }
  const from = i === 0 ? C.fromMs : C.steps[i - 1].toMs;
  const p = planOf(state, st.id, { spotId: C.spotId, args: st.args, fromMs: i === 0 ? null : from, wearing: outfitOf(me) });
  if (!p.ok || !p.parts.length) return p.why ?? 'nothing to do';
  const parts = p.parts.filter(x => x.fromMs < st.toMs).map(x => ({ ...x, toMs: Math.min(x.toMs, st.toMs) }));
  parts[parts.length - 1].toMs = st.toMs;
  beginDoing(state, bus, { id: st.id, sp: rec.uses.length ? sp : null, plan: { ...p, parts, endMs: st.toMs, durMs: st.toMs - from }, kind, args: st.args, step: i === 0, chain: { i, n } });
  C.i = i;
  if (i < n - 1) post(state, { atMs: st.toMs, prio: 5, kind: 'chain-next', src: CHAIN_SRC, payload: { i } });
  return null;
}

// (the chain's fact, its common fields)
const told = (C, more) => ({ spotId: C.spotId, steps: C.steps.map(s => s.id), i: C.i, n: C.steps.length, fromMs: C.fromMs, toMs: C.toMs, by: null, dropped: [], lines: [], ...more });

/** Start a chain (see the header): { ok, why }. Writes. */
export function startChain(state, bus, ctx, { spotId = null, steps = [], late = null, force = null } = {}) {
  if (isHeld(state) || state.skip || state.time?.doing || state.time?.lead || state.time?.chain) return refuse(bus, 'busy', null);
  const me = playerActor(state);
  if (!me) return refuse(bus, 'nobody', null);
  if (transPlaying(me, state.clock.ms)) return refuse(bus, 'busy', null);
  if ((me.posture ?? 'stand') !== 'stand') return refuse(bus, 'lying', 'Get up first.');
  // (TIME §5.3's checks, once for the chain: at the spot, and free)
  const sp = spotOf(state, spotId);
  if (!sp) return refuse(bus, 'no spot', null);
  if (Math.hypot(me.x - sp.x, me.z - sp.z) > SPOT_REACH_M) return refuse(bus, 'not here', null);
  if (!spotFree(state, sp)) return refuse(bus, 'taken', 'Taken.');
  let plan = planChain(state, { spotId, steps });
  if (!plan.ok) return refuse(bus, plan.why, plan.why ? `${cap(plan.why)}.` : null);
  if (plan.late) {
    if (late === 'fit') {
      // (the leading whole steps that end by the fit: a step is never shortened inside a chain)
      const t0 = state.clock.ms, keep = [];
      for (const st of plan.steps) { if (st.toMs - t0 > plan.late.fitMs) break; keep.push({ id: st.id, args: st.args }); }
      if (!keep.length) return refuse(bus, 'late', 'No time for it.');
      plan = planChain(state, { spotId, steps: keep });
      if (!plan.ok) return refuse(bus, plan.why, null);
    } else if (late !== 'accepted') return refuse(bus, 'late', null);
  }
  const kind = force ?? plan.kind, t0 = state.clock.ms, n = plan.steps.length;
  state.time.chain = { spotId, fromMs: t0, toMs: plan.endMs, i: 0, stopAt: null, ...(late ? { late } : {}), steps: plan.steps.map(st => ({ id: st.id, args: st.args, toMs: st.toMs })) };
  const why = beginStep(state, bus, 0, kind);
  if (why) { delete state.time.chain; cancel(state, CHAIN_SRC); return refuse(bus, why, null); }
  bus.emit('chain', told(state.time.chain, { phase: 'start' }));
  if (kind !== 'live') {
    const rec0 = activityOf(plan.steps[0].id), d = state.time.doing;
    ctx.sim.beginSkip(state, { activity: rec0.id, planMs: plan.durMs, kind, spotId, posture: activityOf(rec0.id).parts.find(p => p.part === d.parts.at(-1).part)?.posture ?? 'stand',
      mask: rec0.mask || 'D A', chunkMs: 0, vignette: plan.steps.map(st => activityOf(st.id).vignette).find(v => v) ?? null, stoppable: true,
      chain: { steps: plan.steps.map(st => st.id), n } });
  }
  return { ok: true, why: null, kind, durMs: plan.durMs, n };
}

/** The 'chain-next' event (see the header). Writes. */
export function onChainNext(state, bus, ev) {
  const C = state.time?.chain;
  if (!C || ev.payload?.i !== C.i || C.stopAt !== null) return;
  const i = C.i, ms = ev.atMs, d = state.time.doing;
  const kind = d?.mode ?? (state.skip ? (state.skip.engine === 'ff' ? 'ff' : 'outcome') : 'live');
  const out = d && d.chain === i ? finishActivity(state, bus, ms) : null;
  C.steps[i].done = { fraction: out?.fraction ?? 0, by: out?.by ?? 'natural', line: out?.line ?? null };
  const why = beginStep(state, bus, i + 1, kind);
  if (why) {
    // (refused at its start: the chain ends there; the skip lands now, and its finish closes the chain)
    C.refused = why;
    if (state.skip) { if (!state.skip.stop) state.skip.stop = { atMs: ms, by: 'refused' }; }
    else chainClose(state, bus, ms, null, 'refused');
    return;
  }
  const s = state.skip, st = C.steps[i + 1], rec = activityOf(st.id);
  if (s) {
    s.activity = st.id; s.mask = rec.mask || 'D A';
    s.posture = rec.parts.find(p => p.part === state.time.doing.parts.at(-1).part)?.posture ?? 'stand';
  }
  bus.emit('chain', told(C, { phase: 'step', i: i + 1, fromMs: ms, toMs: st.toMs }));
}

/** Backspace in a chain (see the header): whether it took. Writes. */
export function chainStop(state, bus) {
  const C = state.time?.chain;
  if (!C || C.stopAt !== null) return false;
  const st = C.steps[C.i];
  C.stopAt = st.toMs;
  cancel(state, CHAIN_SRC);
  if (state.skip) state.skip.toMs = Math.max(state.clock.ms, st.toMs);
  bus.emit('chain', told(C, { phase: 'stop', toMs: C.stopAt, by: 'player', dropped: C.steps.slice(C.i + 1).map(s => s.id) }));
  return true;
}

/** The chain's end (see the header): its outcome.chain. Writes. */
export function chainClose(state, bus, endMs, out = null, by = 'natural') {
  const C = state.time?.chain;
  if (!C) return null;
  const st = C.steps[C.i];
  if (out && !st.done) st.done = { fraction: out.fraction, by: out.by, line: out.line };
  cancel(state, CHAIN_SRC);
  const result = C.steps.map(s => (s.done ? { id: s.id, line: s.done.line, fraction: s.done.fraction, by: s.done.by } : { id: s.id, line: null, fraction: 0, by: 'dropped' }));
  const dropped = C.steps.filter(s => !s.done).map(s => s.id);
  const why = by === 'natural' && C.stopAt !== null ? 'player' : by;
  bus.emit('chain', told(C, { phase: 'end', toMs: endMs, by: why, dropped, lines: result.filter(r => r.line).map(r => r.line) }));
  delete state.time.chain;
  return result;
}

/** How a skip that ends a chain ended it: 'natural' | 'player' | 'interrupt' | 'refused'. */
export function chainByOf(skip) {
  const b = skip?.stop?.by ?? null;
  if (!b) return 'natural';
  if (b === 'player' || b === 'refused') return b;
  return 'interrupt';
}

/** The chain as the splash shows it (see the header), or null. */
export function chainNow(state, ms = state?.clock?.ms) {
  const C = state?.time?.chain;
  if (!C) return null;
  const steps = C.steps.map((s, k) => {
    const fromMs = k === 0 ? C.fromMs : C.steps[k - 1].toMs;
    return { id: s.id, label: `${actionWords(state, s.id, s.args)} · ${durationText(s.toMs - fromMs)}`, fromMs, toMs: s.toMs, done: s.done ? { ...s.done } : (ms >= s.toMs && k < C.i ? { fraction: 1, by: 'natural', line: null } : null) };
  });
  return { spotId: C.spotId, steps, i: C.i, n: C.steps.length, stopAt: C.stopAt };
}
