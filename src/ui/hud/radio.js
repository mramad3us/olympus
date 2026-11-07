// OLYMPUS hud: the radio box, the voices that reach you, in the RADIO rectangle (VIEWS §7.1, §7.5; the build sheet 0.0.5 §2.4).
//
// Tradecraft's earpiece (src/sim/tutorial/earpiece.js) grown into the box VIEWS §7.1 names: the people's
// say facts ({ who, text, kind: 'speech' | 'radio' | 'bark' | 'pa', durMs }, CONTRACTS §11) shown as they
// come, each under who said it, in the speaker's rank and name as the marine reads them:
//   pa      the tower's speaker, "◉ TOWER · SSGT KOWALSKI" (the range officer's commands, WEAPONS §5.3);
//   speech  someone beside you, "◉ SGT ABARA · BESIDE YOU" (the coach), "◉ PFC ODUYA · 3 M" further off;
//   radio   your net, "◉ CPL REYES · 1ST SQD" (later rounds);
//   bark    a shout, as speech.
// Besides the standing command (below: the tower's command still to answer, kept from the state, marked NOW),
// two lines at most, the newest under the older (the sheet: "two lines"), so a command and the coach's
// word after it read together and the queue never piles up: a third pushes the oldest out. A long line
// (the tower's brief) wraps to two rows, and then shows alone: the box never grows (VIEWS §7.5). Each holds
// HOLD_S 3.5 s + WORD_S 0.33 s a word of its text (tradecraft's earpiece cadence; the tower's brief, 18
// words, 9.4 s), on a clock that runs only while the world's does: not while time stands still in stop
// motion (the tower's last command stays up while you choose what to do about it), not paused, not under
// a card. In a splash RADIO is the outcome strip's (hud/splash.js), and the box is hidden.
// The tower's standing command (0.0.7's tower fixer; the user's report of 2026-11-07, "tower sometimes doesn't say
// anything but we're expected to do it"): the command you have still to answer (handling.js standingCmd) is kept in
// the box from the state, not the queue, until your readiness meets it, so the coach's dope and wind call said the
// same tick (three lines in a box of two) or a wind call wrapping to two rows no longer push it out, and a save
// loaded, a splash ended or the box cleared shows it again. The box stays in the order things were said, the newest
// under (boxLines): the command stands in place of its own spoken line, the voices said before it above it, those
// after it under; the tower's earlier commands, done or overtaken, leave the box while it stands (a stale "LOAD."
// under "MAKE READY." read as the latest word: the tower verifier's). Marked NOW (a brass tag, style.css), it is never
// trimmed: the oldest other voice goes first, then the command shows in its short form, its terms kept ("Ten rounds
// rapid, sixty seconds. Commence fire.": courses.js `short`), then the voices after it. The box grows to RADIO_H_PX 60
// for three rows (it was 52, two).
//
// lineOf(fact, state) and standingLine(state) are the pure part (the ui tests read them in node), createRadio(parent) the DOM.
import { playerId } from '../../core/ids.js';
import { standingCmd } from '../../sim/scenarios/handling.js';

/** A line holds this long, plus this much a word (s: tradecraft's earpiece). */
export const HOLD_S = 3.5, WORD_S = 0.33;
/** The box shows this many lines at most. */
export const RADIO_LINES = 2;
/** Within this many metres a speaker is "beside you". */
export const BESIDE_M = 2.5;
/** The box's height at --ui 1 (CSS px; layout.js RECTS.RADIO.h): a voice wrapped to two rows and a standing command of one. */
export const RADIO_H_PX = 60;

/** How long a line holds (s): HOLD_S + WORD_S a word. */
export const holdS = (text) => HOLD_S + WORD_S * String(text ?? '').trim().split(/\s+/).filter(Boolean).length;

const rankOf = (p) => String(p?.service?.rank ?? '').toUpperCase();
const familyOf = (p) => String((typeof p?.name === 'string' ? p.name.split(' ').pop() : p?.name?.family) ?? '').toUpperCase();
const UNIT_WORD = (p) => { const u = p?.service?.unitId ?? ''; return /-E$/.test(u) ? 'ECHO' : u ? u.toUpperCase() : ''; };

/**
 * A say fact as the box shows it: { head ('◉ TOWER · SSGT KOWALSKI'), text, kind, who, holdS }, or null for
 * a line with no words or one of your own. state gives the speaker's rank and name and where they stand.
 */
export function lineOf(fact, state = null) {
  if (!fact?.text) return null;
  const me = state ? playerId(state) : null;
  if (fact.who && fact.who === me) return null;
  const p = state?.people?.[fact.who] ?? null, who = [rankOf(p), familyOf(p)].filter(Boolean).join(' ');
  let head;
  if (fact.kind === 'pa') head = `◉ TOWER${who ? ` · ${who}` : ''}`;
  else if (fact.kind === 'radio') head = `◉ ${who || 'NET'}${UNIT_WORD(p) ? ` · ${UNIT_WORD(p)}` : ''}`;
  else {
    const where = whereOf(state, fact.who);
    head = `◉ ${who || 'SOMEONE'}${where ? ` · ${where}` : ''}`;
  }
  return { head, text: String(fact.text), kind: fact.kind ?? 'speech', who: fact.who ?? null, atMs: state?.clock?.ms ?? null, holdS: Number.isFinite(fact.durMs) && fact.durMs > 0 ? Math.max(holdS(fact.text), fact.durMs / 1000) : holdS(fact.text) };
}
/**
 * The tower's standing command as the box keeps it (see the header): { head, text, short, kind: 'pa', who, atMs (when it
 * was said), standing: true, key } or null. Pure.
 */
export function standingLine(state) {
  const c = state ? standingCmd(state) : null;
  if (!c) return null;
  const l = lineOf({ who: c.who, text: c.text, kind: 'pa' }, state);
  return l ? { ...l, atMs: c.atMs, short: c.short, standing: true, key: `${c.i}` } : null;
}
/**
 * What the box shows (pure: the DOM trims it to its room), in the order said, the newest last: with a command standing,
 * the tower's lines said before it (its earlier commands, done or overtaken) and its own spoken line left out, and the
 * command in its place, after the voices said before it and before those said after (the coach's dope and wind call, the
 * same tick, come after it). lines: the queue's, each with the atMs it was said (lineOf).
 */
export function boxLines(lines, standing = null) {
  if (!standing) return lines;
  const at = (l) => l.atMs ?? -Infinity;
  const kept = lines.filter(l => !(l.kind === 'pa' && (at(l) < standing.atMs || (l.text === standing.text && l.head === standing.head))));
  const k = kept.findIndex(l => at(l) >= standing.atMs);
  return k < 0 ? [...kept, standing] : [...kept.slice(0, k), standing, ...kept.slice(k)];
}
// (where a speaker stands from you: "BESIDE YOU" within BESIDE_M, else the metres)
function whereOf(state, who) {
  const list = state?.actors?.list ?? [], me = list.find(a => a.id === state?.player?.actor), them = list.find(a => a.who === who);
  if (!me || !them) return '';
  const d = Math.hypot(them.x - me.x, them.z - me.z);
  return d <= BESIDE_M ? 'BESIDE YOU' : `${Math.round(d)} M`;
}

/** The box's lines over time, without the DOM: { push(line), frame(dtS, running), lines }. */
export function createRadioQueue({ max = RADIO_LINES } = {}) {
  let lines = [];
  return {
    push(line) { if (!line) return; lines.push({ ...line, leftS: line.holdS }); while (lines.length > max) lines.shift(); },
    frame(dtS, running = true) { if (running) for (const l of lines) l.leftS -= Math.max(0, Math.min(dtS, 0.25)); lines = lines.filter(l => l.leftS > 0); },
    clear() { lines = []; },
    get lines() { return lines; },
  };
}

/** The box in parent: { el, say(fact, state), frame(dtMs, running), update({ hidden }) → its text, clear(), lines }. */
export function createRadio(parent) {
  const doc = globalThis.document;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); n.append(...kids); return n; };
  const root = el('div', { className: 'radio voices', hidden: true });
  parent.append(root);
  const queue = createRadioQueue();
  let sig = null, shown = [], standing = null;
  return {
    el: root,
    say(fact, state) { queue.push(lineOf(fact, state)); },
    frame(dtMs, running = true) { queue.frame(dtMs / 1000, running); },
    /** state: the game's, for the tower's standing command (standingLine); without it the box shows the voices alone. */
    update({ hidden = false, weapon = false, state = null } = {}) {
      root.classList.toggle('weapon', !!weapon);
      standing = hidden ? null : standingLine(state);
      const lines = hidden ? [] : boxLines(queue.lines, standing), s = JSON.stringify(lines.map(l => [l.head, l.text, l.kind, !!l.standing]));
      if (s !== sig) {
        sig = s;
        const rows = lines.map(l => el('div', { className: `voice ${l.kind}${l.standing ? ' standing' : ''}` }, el('span', { className: 'who', textContent: l.head }), el('span', { className: 'said', textContent: l.text })));
        root.replaceChildren(...rows);
        root.hidden = !lines.length;
        // (the rectangle never grows: a newest line that wraps to two rows takes the older one's place, as the toasts do)
        // (the voices' own heights, not scrollHeight: the box is aligned to its end, so what overflows it goes off its top,
        // which scrollHeight does not count (the 0.0.7 integrator's: two wrapped lines were each clipped to a row))
        const gap = parseFloat(globalThis.getComputedStyle?.(root)?.rowGap ?? '0') || 0;
        const over = () => { let h = 0; for (const c of root.children) h += c.offsetHeight; return h + gap * (root.children.length - 1) > root.clientHeight + 1; };
        // (the standing command never goes: the oldest other voice first while two remain, then the command to its short
        // form, its terms kept, then the voices left; with none standing, the oldest while two remain, as before)
        let kept = lines.slice();
        const voices = () => kept.filter(l => !l.standing).length;
        const dropOldest = () => { const k = kept.findIndex(l => !l.standing); root.children[k].remove(); kept.splice(k, 1); };
        while (voices() > 1 && over()) dropOldest();
        const si = kept.findIndex(l => l.standing);
        if (si >= 0 && voices() && over()) {
          root.children[si].querySelector('.said').textContent = standing.short;
          kept[si] = { ...standing, text: standing.short };
        }
        while (si >= 0 && voices() && over()) dropOldest();
        shown = kept;
      }
      root.hidden = !lines.length;
      // (what shows: the lines the box kept room for, in the order said, the newest last)
      return root.hidden ? '' : shown.map(l => `${l.head} ${l.text}`).join(' | ');
    },
    clear() { queue.clear(); sig = null; shown = []; root.replaceChildren(); root.hidden = true; },
    /** The box's lines, in the order said: the voices queued and the standing command (as last updated) in its place. */
    get lines() { return boxLines(queue.lines, standing).map(l => ({ head: l.head, text: l.text, kind: l.kind, ...(l.standing ? { standing: true } : {}) })); },
  };
}
