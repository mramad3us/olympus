// OLYMPUS sim: the step panel's numbering, the digit each of stepsOf's rows sits on (VIEWS §7.4; COMBAT §25.6.1; the hud's src/ui/hud/steps.js draws it).
//
// Moved here from the hud in the fix of 2026-11-07 (the user's report: "am i supposed to aim for the head ? How do I do
// that ?"), so the DI's line can name the key a row is on ("To the head: 1") from the same rule the panel numbers by,
// never a second copy of it. The rule, unchanged but for that key and the remedies: panelList folds the shot rows struck by
// their gates into one row and brings up beside a struck row the single that lifts it (remedyOf: "off safe first", Off
// safe; a stoppage, IMMEDIATE ACTION; a chamber unknown, Press check; one empty, MAKE READY; RELOAD); panelOf numbers the
// list 1 to 9 then 0 while ten or fewer, else 1 to 9 hold the fixed kinds (the shot, the shot rows, the contact's answers, the commands: at
// most FIXED_MAX), then a page of the rest, and 0 pages; past FIXED_REPEAT fixed rows the pages after the first hold the
// rest, with To the head and the rows above it kept on their keys (so the DI's key holds on every page). digitOf(steps, id,
// { page }) is the key a row is on, on a page (the first by default).
// Pure.

/** The digits, in the panel's order: two columns of five. */
export const PANEL_KEYS = Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
/** Whether a step is a shot row (specials.js: kind 'shot', its rounds and parts). */
export const isShotRow = (s) => s?.kind === 'shot' && Array.isArray(s.rounds);
/** The kinds that stay on every page: the shot, the shot rows, the contact's answers and the tower's commands (the rest page under 0); 0.0.12: the house's drill rows and its door's rows too, so the stack, the bundle T names and the door lead the panel at GO and at the door, as a Corps command does on the bay (the build sheet 0.0.12 §2.2). */
export const FIXED_KINDS = Object.freeze(['fire', 'aim', 'hold', 'command', 'shot', 'contact', 'bundle', 'door']);
/**
 * Whether a step stays on every page (a fixed kind, or a contact's answer by its id); a command stepsOf marks later (at a
 * contact's pause, no answer to the man facing you: UNLOAD, a Top up with nothing to gain) pages with the rest, and a
 * single it brought to the head (Off safe below rung 2) stays (the fixer's of 0.0.8).
 */
export const isFixed = (s) => (FIXED_KINDS.includes(s?.kind) && !s?.later) || String(s?.id ?? '').startsWith('contact:') || !!s?.promoted;

/** The most fixed rows a page keeps, so a page always has room for some of the rest (0.0.8: at a contact's pause the rows are many). */
export const FIXED_MAX = 8;
/** Up to this many fixed rows repeat on every page; past it they hold the first page alone (0.0.8). */
export const FIXED_REPEAT = 5;
/** Whether a shot row is struck by its gate (the sheet below it: "Marksmanship 12"), not by a step to take first. */
export const isGated = (s) => isShotRow(s) && !!s.off && !!s.gate && /^marksmanship/i.test(String(s.off));
/**
 * The shot rows struck by their gates folded into one row (0.0.8: what training buys, seen at a glance and costing one
 * slot): { id: 'gated', kind: 'gated', label: 'Hammer 12 · Triple 18 · Failure drill 12', off: 'Marksmanship', rows }.
 */
export function gatedRow(list) {
  const g = list.filter(isGated);
  if (!g.length) return null;
  return { id: 'gated', kind: 'gated', label: g.map(r => `${r.label} ${r.gate?.v ?? String(r.off).replace(/\D+/g, '')}`).join(' · '), ms: null, off: 'Marksmanship', rows: g, odds: null, routine: null };
}
// (each struck reason's remedy, the singles that lift it in the order they are preferred (specials.js shotRows' reasons))
const REMEDY = Object.freeze([
  [/off safe/, ['selector:semi', 'selector:auto']], [/^a stoppage$/, ['macro:ia']], [/^chamber unknown$/, ['pressCheck']],
  [/^chamber empty$/, ['macro:ready', 'release', 'charge']], [/RELOAD first/, ['macro:reload:speed', 'macro:reload:retain']],
]);
/**
 * The step that lifts a shot row's strike, by its reason (off): Off safe, IMMEDIATE ACTION on a stoppage, Press check on a
 * chamber unknown, MAKE READY (else the bolt release, Charge) on one empty, RELOAD on a bolt locked on an empty; the first
 * offered in steps, or null (the aim, a reach, a gate: none here).
 */
export function remedyOf(steps = [], off) {
  const r = REMEDY.find(([re]) => re.test(String(off ?? '')));
  if (!r) return null;
  for (const id of r[1]) { const x = (steps ?? []).find(st => st.id === id && !st.off); if (x) return x; }
  return null;
}
/**
 * The panel's order (0.0.8): the shot rows struck by their gates folded into one row after the offered ones, and the single
 * that lifts a struck row's strike (remedyOf: "off safe first", Off safe; from the fix of 2026-11-07 a stoppage's IMMEDIATE
 * ACTION, a chamber unknown's Press check, an empty chamber's MAKE READY, RELOAD) brought up beside it, so it is on the
 * first page with the row, where the DI's line names its key.
 */
export function panelList(steps = []) {
  const list = steps ?? [];
  if (!list.some(isShotRow)) return list;
  const gated = gatedRow(list), out = [];
  const named = (s) => (s.off ? remedyOf(list, s.off) : null);
  const promoted = new Set(), placed = new Set();
  let gatedAt = -1;
  for (const s of list) {
    if (isGated(s)) { if (gatedAt < 0) { gatedAt = out.length; out.push(gated); } continue; }
    if (promoted.has(s.id)) continue;
    out.push(s); placed.add(s.id);
    // (a single stepsOf already brought to the head (promoted), or already placed above: kept where it stands, never named twice)
    if (s.promoted) promoted.add(s.id);
    const n = isShotRow(s) ? named(s) : null;
    if (n && !promoted.has(n.id) && !placed.has(n.id)) { promoted.add(n.id); placed.add(n.id); out.push({ ...n, kind: n.kind ?? 'single', promoted: true }); }
  }
  return out;
}
/**
 * The panel's slots: { slots: [{ key: '1', digit: 1, step }], more: { key: '0', page, pages } | null, page, pages }.
 * Ten steps or fewer take 1 to 9 and 0; more, and 1 to 9 hold the fixed kinds (FIXED_MAX at most) then a page of the rest, 0 pages.
 */
export function panelOf(steps = [], { page = 0 } = {}) {
  const list = panelList(steps ?? []);
  if (list.length <= PANEL_KEYS.length) return { slots: list.map((step, i) => ({ key: PANEL_KEYS[i], digit: Number(PANEL_KEYS[i]), step })), more: null, page: 0, pages: 1 };
  const fixed0 = list.filter(s => isFixed(s) || s.kind === 'gated'), fixed = fixed0.slice(0, FIXED_MAX), over = new Set(fixed0.slice(FIXED_MAX));
  const rest = list.filter(s => !fixed.includes(s) || over.has(s)).filter(s => !fixed.includes(s));
  // (a few fixed rows stay on every page (the 25 m line's Fire, Aim and the tower's commands); more than FIXED_REPEAT of them
  // (a contact's pause: the rows, the contact's answers, the reloads) hold the first page, and the pages after it are the
  // rest nine at a time, so the singles are not one a page)
  // (To the head, where it is in the list, keeps its key on every page with the rows above it, so the DI's "To the head: 1"
  // holds wherever the player has paged to (the verifier of the fix of 2026-11-07: page 2's 1 was Finger off))
  if (fixed.length > FIXED_REPEAT) {
    const hi = fixed.findIndex(s => s.id === 'shot:head'), keep = hi >= 0 ? fixed.slice(0, hi + 1) : [], per = 9 - keep.length;
    const first = 9 - fixed.length, pages = 1 + Math.max(0, Math.ceil((rest.length - first) / per)), p = ((page % pages) + pages) % pages;
    const shown = p === 0 ? [...fixed, ...rest.slice(0, first)] : [...keep, ...rest.slice(first + (p - 1) * per, first + p * per)];
    return { slots: shown.map((step, i) => ({ key: PANEL_KEYS[i], digit: i + 1, step })), more: { key: '0', digit: 0, page: p, pages }, page: p, pages };
  }
  const per = Math.max(1, 9 - fixed.length), pages = Math.max(1, Math.ceil(rest.length / per)), p = ((page % pages) + pages) % pages;
  const shown = [...fixed, ...rest.slice(p * per, p * per + per)].slice(0, 9);
  return { slots: shown.map((step, i) => ({ key: PANEL_KEYS[i], digit: i + 1, step })), more: { key: '0', digit: 0, page: p, pages }, page: p, pages };
}

/** The key a row is on (by its id), on a page (the first by default): '1' to '9', '0', or null when it is not on that page. */
export function digitOf(steps = [], id, { page = 0 } = {}) {
  const slot = panelOf(steps, { page }).slots.find(s => s.step?.id === id || (s.step?.kind === 'gated' && s.step.rows?.some(r => r.id === id)));
  return slot ? slot.key : null;
}
