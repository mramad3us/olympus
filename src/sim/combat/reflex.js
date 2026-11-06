// OLYMPUS sim: the reflex card, a moment that wants a sudden answer, inside stop motion this round (COMBAT §3.5; the build sheet 0.0.5 §2.2, §8 item 8).
//
// Tradecraft's reflex (src/sim/reflex.js, 76 lines: offer, chosen, KEEP_S 120 s kept answers, "Nothing:
// let it come" always there), ported with the build sheet's change: the moment comes from the gun
// itself during a lived step (a click instead of a bang, a shot that did not cycle), so the card opens
// inside stop motion, not only outside it as COMBAT §3.5 had it. Its record is state.stop.reflex
// (saved, TIME §13: a save made while the card waits holds the stopped clock with it), not
// tradecraft's runtime $reflex:
//     { why: 'click' | 'stop', title, atMs, options: [{ key, label, step, ms }…, NONE] }
// offerReflex(state, bus, { why, title, options }, { run }) opens it and holds time ('reflex'); an
// answer kept for this kind of moment (stop.keep[why] = { key, untilMs }, until KEEP_MS 120 s after it
// was kept) and still among the options is chosen at once with no card ("By reflex: tap, rack.",
// 'reflex' { phase: 'kept' }), through run(option), the caller's way to start its step.
// chosenReflex(state, bus, key, { keep }) closes it, releases 'reflex', keeps the answer when asked
// (never 'none'), and returns the option chosen (NONE for an unknown key); the caller starts its step.
// The 'reflex' fact tells the hud: { phase: 'offer' | 'chosen' | 'kept', why, title, options, key }.
import { holdTime, releaseTime } from '../../core/clock.js';
import { logEntry } from '../log.js';

/** How long a kept answer answers the same moment again (tradecraft's KEEP_S), ms. */
export const KEEP_MS = 120_000;
/** The answer always there. */
export const NONE = Object.freeze({ key: 'none', label: 'Nothing: let it come', step: null, ms: 0 });
/** Its words by the moment: your own rifle stopping is nothing coming at you (the design review's: tradecraft's grenade wording on a click). */
export const NONE_LABEL = Object.freeze({ click: 'Nothing: stay on the card', stop: 'Nothing: stay on the card' });

const optionsOf = (options, why = null) => [...options.filter(o => o && o.key !== 'none').map(o => ({ key: o.key, label: o.label, step: o.step ?? null, ms: o.ms ?? 0 })), { ...NONE, label: NONE_LABEL[why] ?? NONE.label }];

/** Open a reflex card (see the header). Returns whether a moment was offered (kept answers count). */
export function offerReflex(state, bus, { why, title, options = [] }, { run = null } = {}) {
  const S = state.stop;
  if (!S || state.skip) return false;
  const now = state.clock.ms, list = optionsOf(options, why);
  const K = S.keep?.[why];
  const kept = K && K.untilMs > now ? list.find(o => o.key === K.key && o.key !== 'none') : null;
  if (kept) {
    logEntry(state, bus, { kind: 'note', tone: 'note', text: `By reflex: ${kept.label.toLowerCase().replace(/\.$/, '')}.` });
    bus?.emit('reflex', { phase: 'kept', why, title, options: list, key: kept.key });
    run?.(kept);
    return true;
  }
  S.reflex = { why, title, atMs: now, options: list };
  holdTime(state, 'reflex');
  bus?.emit('reflex', { phase: 'offer', why, title, options: list, key: null });
  return true;
}

/** The answer given (see the header): the card closed, 'reflex' released, the answer kept if asked. Returns the option. */
export function chosenReflex(state, bus, key, { keep = false } = {}) {
  const S = state.stop, R = S?.reflex;
  if (!R) return null;
  S.reflex = null;
  releaseTime(state, 'reflex');
  const opt = R.options.find(o => o.key === key) ?? { ...NONE };
  if (keep && opt.key !== 'none') (S.keep ??= {})[R.why] = { key: opt.key, untilMs: state.clock.ms + KEEP_MS };
  bus?.emit('reflex', { phase: 'chosen', why: R.why, title: R.title, options: R.options, key: opt.key });
  return opt;
}

/** The card waiting, or null. */
export const reflexNow = (state) => state.stop?.reflex ?? null;
