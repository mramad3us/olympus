// OLYMPUS sim: interrupts, which events stop a skip: their priorities, the masks that let them through and the limits on the social ones (TIME §7).
//
// Every event in the queue carries a priority (TIME §7.1): 0 D danger to you, here, now; 1 A alarms;
// 2 O orders and obligations; 3 B your body; 4 S social and world; 5 ambient, which goes to the
// ticker and the log and never stops anything. An activity's mask names the letters that stop it
// (TIME §7.2), written as TIME writes them, 'D A O* B−hygiene S(k)':
//   D, A        always stop, whatever the mask says (TIME §7.2: "D and A stop every activity");
//   O           orders stop it; O* holds them until the activity ends (the skip dispatches the event,
//               its line goes to the ticker and its id to the skip's held list: the toilet's "occupied");
//   B           the body's crossings stop it; B−x all but the ledger x the activity relieves
//               (ev.payload.ledger === x passes);
//   S           social events stop it; S(k) only a knock (ev.payload.social 'knock'); S(w) only being
//               woken ('wake');
//   P           the activity's own kind (a watch's approach to its post): the event's payload.post.
// '−' and '-' read the same. A letter not in the mask (beyond D and A) does not stop it.
// Job events never stop a skip (they are the world's bookkeeping), and neither does an S event past
// the rate limits (TIME §7.4: S_PER_SKIP one a skip, S_PER_SOL three a sol, counted in
// time.interrupts { perSkip, perSol, sol }, reset at a new skip and a new local sol) or of a kind the
// player muted (time.prefs.mute: none can be muted this round, the wrist terminal sets them later).
// stops(mask, ev, state) is the one rule both skip engines and the due layer's fast-forward check
// read (TECH §5.3); noteStop(state, ev, ms) counts a stop that happened, so the rule itself stays a
// pure read. CLASS_MASKS is TIME §7.3's table, by activity class.
// Pure but noteStop (it writes time.interrupts).
import { localSol } from '../../core/calendar.js';
import { siteLonEDeg } from '../jobs.js';

/** The priority of each letter (TIME §7.1); 5 is ambient, the ticker's only. */
export const PRIO = Object.freeze({ D: 0, A: 1, O: 2, B: 3, S: 4 });
/** At most this many S interrupts in one skip (TIME §7.4). */
export const S_PER_SKIP = 1;
/** At most this many S interrupts in one local sol (TIME §7.4). */
export const S_PER_SOL = 3;
/** TIME §7.3's masks by activity class (a block's beats and a watch's P are its own). */
export const CLASS_MASKS = Object.freeze({
  hygiene: 'D A O* B−x S(k)', toilet: 'D A O* S(k)', eating: 'D A O B S', sleep: 'D A O B S(w)', rest: 'D A O B S',
  kit: 'D A O B S', block: 'D A O B', watch: 'D A O B P', ride: 'D A O B', day: 'D A O B S',
});

const LETTERS = Object.freeze(['D', 'A', 'O', 'B', 'S']);
const parsed = new Map();

/** A mask's parts: { D, A, O: true | 'hold' | false, B: true | { except } | false, S: true | 'k' | 'w' | false, P }. '−' or '-' both read. */
export function parseMask(mask) {
  const key = String(mask ?? '');
  let m = parsed.get(key);
  if (m) return m;
  m = { D: true, A: true, O: false, B: false, S: false, P: false };
  for (const raw of key.split(/\s+/)) {
    if (!raw) continue;
    const part = raw.replace('−', '-');
    const L = part[0];
    if (L === 'O') m.O = part === 'O*' ? 'hold' : true;
    else if (L === 'B') m.B = part.startsWith('B-') && part.length > 2 ? Object.freeze({ except: part.slice(2) }) : true;
    else if (L === 'S') m.S = part === 'S(k)' ? 'k' : part === 'S(w)' ? 'w' : true;
    else if (L === 'P') m.P = true;
    else if (L === 'D' || L === 'A') { /* (always) */ }
    else throw new Error(`a mask with a part '${raw}' TIME §7.2 does not know (${key})`);
  }
  m = Object.freeze(m);
  parsed.set(key, m);
  return m;
}

/** The letter of an event's priority, or null for ambient (5) and job events. */
export function letterOf(ev) {
  if (!ev || ev.kind === 'job') return null;
  const p = ev.prio ?? 5;
  return p >= 0 && p <= 4 ? LETTERS[p] : null;
}

// (the S counts as they stand at ms: a new local sol starts them again)
function sCounts(state, ms) {
  const t = state?.time?.interrupts ?? {};
  const sol = state ? localSol(ms ?? state.clock?.ms ?? 0, siteLonEDeg(state)).sol : null;
  return { perSkip: t.perSkip ?? 0, perSol: t.sol === sol ? t.perSol ?? 0 : 0, sol };
}

/** Whether an event stops a skip with this mask (see the header). state may be null (then no limits, no mutes). */
export function stops(mask, ev, state = null) {
  const L = letterOf(ev);
  if (!L) return false;
  if (L === 'D' || L === 'A') return true;
  const m = parseMask(mask);
  if (L === 'O') return m.O === true;
  if (L === 'B') {
    if (m.B === true) return true;
    if (m.B && m.B.except) return ev.payload?.ledger !== m.B.except;
    return false;
  }
  // (S: the mask, the mutes, the limits)
  if (!m.S) return false;
  if (m.S === 'k' && ev.payload?.social !== 'knock') return false;
  if (m.S === 'w' && ev.payload?.social !== 'wake') return false;
  if (state?.time?.prefs?.mute?.includes(ev.payload?.social ?? ev.kind)) return false;
  if (state) {
    const c = sCounts(state, ev.atMs);
    if (c.perSkip >= S_PER_SKIP || c.perSol >= S_PER_SOL) return false;
  }
  return true;
}

/** Whether a mask holds an event until the activity ends (O* and an order): dispatched, its line to the ticker, its id to the skip's held list. */
export const holds = (mask, ev) => letterOf(ev) === 'O' && parseMask(mask).O === 'hold';

/** Count a stop that happened (an S stop moves time.interrupts; the rest change nothing). Writes. */
export function noteStop(state, ev, ms = state.clock.ms) {
  if (letterOf(ev) !== 'S') return;
  const c = sCounts(state, ms);
  state.time.interrupts = { perSkip: c.perSkip + 1, perSol: c.perSol + 1, sol: c.sol };
}

/** A new skip: its S count starts again (the sol's stays). Writes. */
export function resetSkipCount(state) {
  const t = (state.time.interrupts ??= { perSol: 0, perSkip: 0 });
  t.perSkip = 0;
}
