// OLYMPUS sim: the instinct, the drill instructor's voice in your head, one line at a time and a key for what it offers (SKILLS §14; the build sheet 0.0.4 §2.2.8).
//
// Ported from tradecraft v0.2.0-rc3 src/sim/instinct.js (53 lines): its settle() and RANK kept (the
// line up stays while its rule still fires and nothing more pressing does; a line whose rule has
// stopped firing goes at once: "no advice that doesn't even apply", the user, 2026-10-26), its
// street-only place() dropped. SKILLS §14.3's additions:
//   - no flicker: a line stays at least LINE_MIN_MS 3 s before a line of higher tone replaces it,
//     unless that line is urgent; the chip likewise;
//   - no nagging: a line that went because its rule stopped firing (its act done, the need met) does
//     not come back from the same rule within REPEAT_MS 60 s (or the rule's own repeatMs: the range's
//     rules have none, each command on the line being new advice, 0.0.5), unless its tone has risen;
//   - the chip: the most pressing waiting rule with no key of its own (reach null) beside the line,
//     its short words, done by T held (never a calm one: it only informs); waiting rules with a reach (B's orders, F's customs: none this
//     round) show their keycaps (keys), the rest are counted (queued);
//   - silence: none in a splash (interrupts are TIME's); while time stands still, urgent lines only;
//   - humour on calm and note lines at most once every HUMOUR_GAP_MS 300 s of lived time, by hash (never
//     where the rule's case says it carries an order: ctx.noHumour, the drill's stand fast);
// The rules are src/sim/skills/instinct/base.js's (the DI at Base Melas, SKILLS §14.4), each
// { id, voice: 'di', tone, short, when(state, me, ms) → ctx | null, text, act(ctx), reach }: when()
// reads only what the character knows (the body as felt, the clock on the wrist, where they stand),
// and its line's words are picked by hashPick(lines, id, floor(ms / 12,000)) at the moment it first
// shows, so the words hold while the line does (and are picked again when the rule's case changes:
// the klaxon's 'up', then 'dress', then 'rack').
// instinctStep(state, input, bus, ctx) is the fast layer 'offers' (it runs while time stands still):
// on whole seconds, on a tick with an action in it, on the first tick after a skip or a load, and (0.0.5)
// when stop motion's phase or step changes (a step ends between whole seconds, the clock standing there), it
// settles state.$instinct = { line: { id, voice, tone, text, act, short, ms } | null, chip, keys,
// queued, gone, humourAt } (SKILLS §15.4; runtime only, so a load forgets only the repeat timers).
// Since 0.0.5 the range's rules (src/sim/skills/instinct/range.js, the DI on the tower's line) are
// weighed after the base's within each tone, and since 0.0.6 the grooming rules beyond the face
// (src/sim/skills/instinct/groom.js, GROOM_RULES: the haircut due) between the two, and stop motion's hold ('stop') does not silence the line
// (the build sheet §8 item 10: SKILLS §14.3.6's rule holds for every other hold): every tone speaks, T
// acts, and the line carries its lead, "Time stands still." (lead in $instinct, the hud's to show).
// 0.0.8 (the build sheet 0.0.8 §2.3, §2.6): test-pairs' rules (src/sim/skills/instinct/pairs.js, PAIRS_RULES) are weighed
// after the range's; on the pairs course the range's rules that speak of the tower's commands and its card (range-cmd,
// range-kd, range-reload, range-fire, range-wait) keep quiet (the pairs rules say those things for the coach's commands
// and the turners), the rest (the cold line, the muzzle, a stoppage, a press check) speak as anywhere on a range. While a
// take-in's window is open nothing fires at all (src/sim/combat/contact.js pendingOf: no words in the window, COMBAT
// §25.4.5), and at the pause the line's lead, until the first step chosen after it, is "Contact · 0.55 s." (react.js
// takeInWords, the quantity's one formatter) in place of "Time stands still.".
// 0.0.9 (the build sheet 0.0.9 §2.2; COMBAT §5.7): nothing fires while the player is startled either (supp.js startled: the
// startle is the take-in's window re-used, its keys taken, so no words in it); the DI's line after it is pairs-froze's.
// instinctAction(state, { act: 'instinct', args: { id, act, chip } }, bus, ctx) does the act the hud
// saw when T went down, if rule id still fires with that act now ('rise': get up from the rack;
// 'dress:utilities': dress at your rack or locker; 'activity:<id>': the activity of the fixture you
// stand at); with args but no id (the page saw no line as T went down) nothing, so T never does an act
// the player did not see and a replay acts from the saved state and the inputs alone; without args at
// all (the debug handle, tests) it does the line's (or the chip's) act. Acts are only what is at hand
// (the sheet §8, item 12): lines that send you somewhere say where, in words.
import { isHeld, SEC_MS } from '../../core/clock.js';
import { hashPick, hash01 } from '../../core/hash.js';
import { playerActor } from '../../core/ids.js';
import { BASE_RULES, doAct } from './instinct/base.js';
import { GROOM_RULES } from './instinct/groom.js';
import { RANGE_RULES } from './instinct/range.js';
import { PAIRS_RULES } from './instinct/pairs.js';
import { rangeOf } from '../scenarios/handling.js';
import { contactNow, pendingOf } from '../combat/contact.js';
import { takeInWords } from '../combat/react.js';
import { startled } from '../combat/supp.js';

/** The range's rules that keep quiet on the pairs course (see the header): the tower's commands and the card are the coach's and the turners' there. */
export const RANGE_OFF_PAIRS = Object.freeze(new Set(['range-cmd', 'range-kd', 'range-reload', 'range-fire', 'range-wait']));
// (a range rule kept quiet on the pairs course: the same rule, its when() answering nothing there)
const offPairs = (r) => (RANGE_OFF_PAIRS.has(r.id) ? Object.freeze({ ...r, when: (state, me, ms) => (rangeOf(state)?.course === 'pairs' ? null : r.when(state, me, ms)) }) : r);
/** Every rule the instinct weighs: the base's, the grooming's, the range's, then the pairs' (merged by tone in settle(): within a tone, in that order). */
export const RULES = Object.freeze([...BASE_RULES, ...GROOM_RULES, ...RANGE_RULES.map(offPairs), ...PAIRS_RULES]);
/** The line's lead while stop motion holds time (VIEWS §7.4; the build sheet §8 item 10). */
export const STOP_LEAD = 'Time stands still.';

export const RANK = Object.freeze({ calm: 0, note: 1, warn: 2, urgent: 3 });
export const LINE_MIN_MS = 3_000, REPEAT_MS = 60_000, HUMOUR_GAP_MS = 300_000;
/** A line's words change with this period (SKILLS §14.7's hash), ms; the words shown are those of the moment it first showed. */
export const WORDS_MS = 12_000;

/**
 * The line and the chip to show (see the header). prev: the last { line, chip, gone }; fired: the rules
 * that fire now, most pressing first within a tone ({ id, tone, act, short, reach, … }); ms: now;
 * urgentOnly while time stands still. Returns { line, chip, keys, queued, gone }.
 */
export function settle(prev, fired, ms, { urgentOnly = false } = {}) {
  const gone = { ...(prev?.gone ?? {}) };
  const shown = prev?.line ?? null, chipWas = prev?.chip ?? null;
  const firing = new Map(fired.filter(Boolean).map(l => [l.id, l]));
  // (a line that went because its rule stopped firing waits REPEAT_MS, unless its tone has risen; while
  // time stands still only urgent lines show, the others still firing, so none of them counts as gone)
  const eligible = [...firing.values()].filter(l => {
    if (urgentOnly && l.tone !== 'urgent') return false;
    const g = gone[l.id];
    return !g || ms - g.ms >= (l.repeatMs ?? REPEAT_MS) || RANK[l.tone] > RANK[g.tone] || shown?.id === l.id;
  });
  const top = eligible.reduce((b, l) => (!b || RANK[l.tone] > RANK[b.tone] ? l : b), null);
  let line = null;
  const still = shown ? eligible.find(l => l.id === shown.id) : null;
  if (still) {
    const higher = top && top.id !== still.id && RANK[top.tone] > RANK[still.tone];
    if (higher && (top.tone === 'urgent' || ms - shown.ms >= LINE_MIN_MS)) line = { ...top, ms };
    else line = { ...still, ms: shown.ms };
  } else line = top ? { ...top, ms } : null;
  if (shown && !firing.has(shown.id)) gone[shown.id] = { ms, tone: shown.tone };
  // (the chip: the most pressing waiting line with no key of its own, held LINE_MIN_MS unless an urgent one comes)
  const waiting = eligible.filter(l => l.id !== line?.id);
  const keyless = waiting.filter(l => !l.reach && l.tone !== 'calm');      // (a calm line informs only: it never takes the chip)
  const best = keyless.reduce((b, l) => (!b || RANK[l.tone] > RANK[b.tone] ? l : b), null);
  let chip = null;
  const chipStill = chipWas ? keyless.find(l => l.id === chipWas.id) : null;
  if (chipStill) {
    const higher = best && best.id !== chipStill.id && RANK[best.tone] > RANK[chipStill.tone];
    chip = higher && (best.tone === 'urgent' || ms - chipWas.ms >= LINE_MIN_MS) ? { ...best, ms } : { ...chipStill, ms: chipWas.ms };
  } else chip = best ? { ...best, ms } : null;
  const keys = waiting.filter(l => l.reach).map(l => (l.reach === 'ack' ? 'B' : 'F'));
  const queued = Math.max(0, keyless.length - (chip ? 1 : 0));
  // (forget repeats long past)
  for (const [id, g] of Object.entries(gone)) if (ms - g.ms > 10 * REPEAT_MS) delete gone[id];
  return { line, chip, keys, queued, gone };
}

// (a rule's firing now, as a line: its words picked at the moment it first shows)
function fire(rule, ctx, state, ms) {
  return { id: rule.id, voice: rule.voice ?? 'di', tone: typeof rule.tone === 'function' ? rule.tone(ctx) : rule.tone, act: rule.act ? rule.act(ctx, state) : null, short: typeof rule.short === 'function' ? rule.short(ctx) : rule.short ?? null, reach: rule.reach ?? null, repeatMs: rule.repeatMs ?? null, ctx, rule };
}
// (the words by the variant, or by ctx.words where a rule names its entry apart: the variant then carries all that should
// pick the words again when it changes (pairs-still-up's key, reason and remedy; the fix of 2026-11-07), present() keeping
// them while it stands)
const wordsOf = (rule, ctx, ms) => {
  const tier = rule.text?.[ctx?.tier ?? 1] ?? rule.text?.[1] ?? [];
  const lines = (ctx?.variant && rule.text?.[ctx.words ?? ctx.variant]) || tier;
  const pick = lines.length ? hashPick(lines, rule.id, Math.floor(ms / WORDS_MS)) : '';
  return typeof pick === 'function' ? pick(ctx) : String(pick).replace(/\{(\w+)\}/g, (_, k) => ctx?.[k] ?? '');
};

/** The rules that fire now for the player, most pressing first within a tone (the rules' order); none while a take-in's window is open or the player is startled. */
export function firedNow(state, ms = state.clock.ms, rules = RULES) {
  const me = playerActor(state);
  if (!me || pendingOf(state) || startled(state, me.who, ms)) return [];
  const out = [];
  for (const r of rules) {
    const ctx = r.when(state, me, ms);
    if (ctx) out.push(fire(r, ctx, state, ms));
  }
  return out;
}

// (the line as the hud reads it: its words, without its rule)
function present(l, prevShown, ms, humourAt) {
  if (!l) return { line: null, humourAt };
  const variant = l.ctx?.variant ?? null;
  const same = prevShown && prevShown.id === l.id && prevShown.ms === l.ms && (prevShown.variant ?? null) === variant;
  let text = same ? prevShown.text : wordsOf(l.rule, l.ctx, l.ms);
  let humour = same ? !!prevShown.humour : false;
  if (!same && (l.tone === 'calm' || l.tone === 'note') && l.rule.humour?.length && !l.ctx?.noHumour && ms - (humourAt ?? -Infinity) >= HUMOUR_GAP_MS && hash01('humour', l.id, Math.floor(ms / WORDS_MS)) < 0.3) {
    text = hashPick(l.rule.humour, l.id, Math.floor(ms / WORDS_MS)); humour = true; humourAt = ms;
  }
  return { line: { id: l.id, voice: l.voice, tone: l.tone, text, act: l.act, short: l.short, ms: l.ms, ...(variant ? { variant } : {}), ...(humour ? { humour: true } : {}) }, humourAt };
}

/** The instinct as it stands (SKILLS §15.4; runtime): { line, chip, keys, queued, gone, humourAt }. */
export const instinctNow = (state) => state.$instinct ?? { line: null, chip: null, keys: [], queued: 0, gone: {}, humourAt: null };

/** The fast layer 'offers' (see the header). */
export function instinctStep(state, input, bus, ctx) {
  const prev = state.$instinct ?? null, ms = state.clock.ms;
  if (state.skip) { state.$instinct = { ...(prev ?? instinctNow(state)), line: null, chip: null, keys: [], queued: 0, quiet: 'splash' }; return; }
  // (stop motion's phase and step: a step that ends between whole seconds leaves the clock standing there, so its end is due too)
  // (0.0.8: a take-in's window opening or closing is due at once too: its silence starts on the sighting tick, not the next second)
  // (0.0.9: a startle's start and end are due at once too: the line goes on the bang's tick, not the next second (the design
  // review: "Let it come." stood 0.6 s into the startle))
  const S = state.stop, win = pendingOf(state) ? 'w' : '', jolt = state.player?.id && startled(state, state.player.id, ms) ? '|s' : '';
  const stopKey = `${S ? `${S.mode}|${S.phase}|${S.doing?.step ?? ''}|${S.doing?.i ?? ''}|${S.reflex ? 'r' : ''}` : ''}${win ? `|${win}` : ''}${jolt}`;
  const due = !prev || prev.quiet === 'splash' || ms % SEC_MS === 0 || (input?.act?.length ?? 0) > 0 || prev.atMs === undefined || prev.atMs > ms || (prev.stopKey ?? '') !== stopKey;
  if (!due) return;
  const fired = firedNow(state, ms);
  const stop = isHeld(state, 'stop');
  const s = settle(prev, fired, ms, { urgentOnly: isHeld(state) && !stop });
  const L = present(s.line, prev?.line, ms, prev?.humourAt ?? null);
  const C = s.chip ? { id: s.chip.id, tone: s.chip.tone, short: s.chip.short ?? wordsOf(s.chip.rule, s.chip.ctx, s.chip.ms), act: s.chip.act, ms: s.chip.ms } : null;
  // (the contact's lead at a pause, until the first step chosen after it (see the header))
  const cl = contactLead(state, prev);
  state.$instinct = { line: L.line, chip: C, keys: s.keys, queued: s.queued, gone: s.gone, humourAt: L.humourAt, atMs: ms, lead: stop && L.line ? cl.lead ?? STOP_LEAD : null, stopKey, leadDone: cl.done };
}

/** The line's lead at a contact's pause: "Contact · 0.55 s.", until a step is chosen after it (runtime: $instinct.leadDone, the contact whose lead has gone). */
export function contactLead(state, prev = state.$instinct ?? null) {
  const last = contactNow(state)?.last ?? null, S = state.stop;
  let done = prev?.leadDone ?? null;
  if (!last || S?.mode !== 'stop') return { lead: null, done };
  if (S.doing && S.doing.kind !== 'wait' && (S.doing.fromMs ?? 0) >= last.atMs) done = last.id;
  return { lead: done === last.id ? null : `Contact · ${takeInWords(last.ms)} s.`, done };
}

/** The 'instinct' action, T (see the header). */
export function instinctAction(state, action, bus, ctx) {
  if (state.skip) return false;
  const args = typeof action === 'object' ? action?.args ?? null : null;
  const fired = firedNow(state, state.clock.ms);
  let target = null;
  if (args?.id) target = fired.find(l => l.id === args.id && (args.act === undefined || l.act === args.act)) ?? null;
  else if (args && 'id' in args) return false;                     // (the page saw no line as T went down: nothing, never a line it did not show)
  else {
    const now = instinctNow(state), want = args?.chip ? now.chip : now.line;
    target = want ? fired.find(l => l.id === want.id) ?? null : null;
  }
  if (!target?.act) return false;
  if (isHeld(state) && !isHeld(state, 'stop') && target.tone !== 'urgent') return false;
  const ok = doAct(state, bus, ctx, target.act);
  if (ok) { const inst = state.$instinct; if (inst) inst.atMs = undefined; }   // (settled again on the next tick, not the next second)
  return ok;
}
