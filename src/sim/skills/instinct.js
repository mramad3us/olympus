// OLYMPUS sim: the instinct, the drill instructor's voice in your head, one line at a time and a key for what it offers (SKILLS §14; the build sheet 0.0.4 §2.2.8).
//
// Ported from tradecraft v0.2.0-rc3 src/sim/instinct.js (53 lines): its settle() and RANK kept (the
// line up stays while its rule still fires and nothing more pressing does; a line whose rule has
// stopped firing goes at once: "no advice that doesn't even apply", the user, 2026-10-26), its
// street-only place() dropped. SKILLS §14.3's additions:
//   - no flicker: a line stays at least LINE_MIN_MS 3 s before a line of higher tone replaces it,
//     unless that line is urgent; the chip likewise;
//   - no nagging: a line that went because its rule stopped firing (its act done, the need met) does
//     not come back from the same rule within REPEAT_MS 60 s, unless its tone has risen;
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
// on whole seconds, on a tick with an action in it, and on the first tick after a skip or a load, it
// settles state.$instinct = { line: { id, voice, tone, text, act, short, ms } | null, chip, keys,
// queued, gone, humourAt } (SKILLS §15.4; runtime only, so a load forgets only the repeat timers).
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
    return !g || ms - g.ms >= REPEAT_MS || RANK[l.tone] > RANK[g.tone] || shown?.id === l.id;
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
  return { id: rule.id, voice: rule.voice ?? 'di', tone: typeof rule.tone === 'function' ? rule.tone(ctx) : rule.tone, act: rule.act ? rule.act(ctx, state) : null, short: typeof rule.short === 'function' ? rule.short(ctx) : rule.short ?? null, reach: rule.reach ?? null, ctx, rule };
}
const wordsOf = (rule, ctx, ms) => {
  const tier = rule.text?.[ctx?.tier ?? 1] ?? rule.text?.[1] ?? [];
  const lines = (ctx?.variant && rule.text?.[ctx.variant]) || tier;
  const pick = lines.length ? hashPick(lines, rule.id, Math.floor(ms / WORDS_MS)) : '';
  return typeof pick === 'function' ? pick(ctx) : String(pick).replace(/\{(\w+)\}/g, (_, k) => ctx?.[k] ?? '');
};

/** The rules that fire now for the player, most pressing first within a tone (the rules' order). */
export function firedNow(state, ms = state.clock.ms, rules = BASE_RULES) {
  const me = playerActor(state);
  if (!me) return [];
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
  const due = !prev || prev.quiet === 'splash' || ms % SEC_MS === 0 || (input?.act?.length ?? 0) > 0 || prev.atMs === undefined || prev.atMs > ms;
  if (!due) return;
  const fired = firedNow(state, ms);
  const s = settle(prev, fired, ms, { urgentOnly: isHeld(state) });
  const L = present(s.line, prev?.line, ms, prev?.humourAt ?? null);
  const C = s.chip ? { id: s.chip.id, tone: s.chip.tone, short: s.chip.short ?? wordsOf(s.chip.rule, s.chip.ctx, s.chip.ms), act: s.chip.act, ms: s.chip.ms } : null;
  state.$instinct = { line: L.line, chip: C, keys: s.keys, queued: s.queued, gone: s.gone, humourAt: L.humourAt, atMs: ms };
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
  if (isHeld(state) && target.tone !== 'urgent') return false;
  const ok = doAct(state, bus, ctx, target.act);
  if (ok) { const inst = state.$instinct; if (inst) inst.atMs = undefined; }   // (settled again on the next tick, not the next second)
  return ok;
}
