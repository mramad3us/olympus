// OLYMPUS hud: the radio box, the voices that reach you, in the RADIO rectangle (VIEWS §7.1, §7.5; the build sheet 0.0.5 §2.4).
//
// Tradecraft's earpiece (src/sim/tutorial/earpiece.js) grown into the box VIEWS §7.1 names: the people's
// say facts ({ who, text, kind: 'speech' | 'radio' | 'bark' | 'pa', durMs }, CONTRACTS §11) shown as they
// come, each under who said it, in the speaker's rank and name as the marine reads them:
//   pa      the tower's speaker, "◉ TOWER · SSGT KOWALSKI" (the range officer's commands, WEAPONS §5.3);
//   speech  someone beside you, "◉ SGT ABARA · BESIDE YOU" (the coach), "◉ PFC ODUYA · 3 M" further off;
//   radio   your net, "◉ CPL REYES · 1ST SQD" (later rounds);
//   bark    a shout, as speech.
// Two lines at most, the newest under the older (the sheet: "two lines"), so a command and the coach's
// word after it read together and the queue never piles up: a third pushes the oldest out. A long line
// (the tower's brief) wraps to two rows, and then shows alone: the box never grows (VIEWS §7.5). Each holds
// HOLD_S 3.5 s + WORD_S 0.33 s a word of its text (tradecraft's earpiece cadence; the tower's brief, 18
// words, 9.4 s), on a clock that runs only while the world's does: not while time stands still in stop
// motion (the tower's last command stays up while you choose what to do about it), not paused, not under
// a card. In a splash RADIO is the outcome strip's (hud/splash.js), and the box is hidden.
//
// lineOf(fact, state) is the pure part (the ui tests read it in node), createRadio(parent) the DOM.
import { playerId } from '../../core/ids.js';

/** A line holds this long, plus this much a word (s: tradecraft's earpiece). */
export const HOLD_S = 3.5, WORD_S = 0.33;
/** The box shows this many lines at most. */
export const RADIO_LINES = 2;
/** Within this many metres a speaker is "beside you". */
export const BESIDE_M = 2.5;

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
  return { head, text: String(fact.text), kind: fact.kind ?? 'speech', who: fact.who ?? null, holdS: Number.isFinite(fact.durMs) && fact.durMs > 0 ? Math.max(holdS(fact.text), fact.durMs / 1000) : holdS(fact.text) };
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
  let sig = null;
  return {
    el: root,
    say(fact, state) { queue.push(lineOf(fact, state)); },
    frame(dtMs, running = true) { queue.frame(dtMs / 1000, running); },
    update({ hidden = false, weapon = false } = {}) {
      root.classList.toggle('weapon', !!weapon);
      const lines = hidden ? [] : queue.lines, s = JSON.stringify(lines.map(l => [l.head, l.text, l.kind]));
      if (s !== sig) {
        sig = s;
        root.replaceChildren(...lines.map(l => el('div', { className: `voice ${l.kind}` }, el('span', { className: 'who', textContent: l.head }), el('span', { className: 'said', textContent: l.text }))));
        root.hidden = !lines.length;
        // (the rectangle never grows: a newest line that wraps to two rows takes the older one's place, as the toasts do)
        while (root.children.length > 1 && root.scrollHeight > root.clientHeight + 1) root.firstChild.remove();
      }
      root.hidden = !lines.length;
      // (what shows: the lines the box kept room for, the newest last)
      return root.hidden ? '' : lines.slice(-root.children.length).map(l => `${l.head} ${l.text}`).join(' | ');
    },
    clear() { queue.clear(); sig = null; root.replaceChildren(); root.hidden = true; },
    get lines() { return queue.lines.map(l => ({ head: l.head, text: l.text, kind: l.kind })); },
  };
}
