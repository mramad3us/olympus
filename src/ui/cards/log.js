// OLYMPUS cards: the log card (J), the last lines of the game's record, readable whole (VIEWS §8.6).
//
// The log is the sim's (src/sim/log.js: state.log, records newest last, at most LOG_MAX 1,500): what
// happened, where you went, what the debug keys did. The card shows its last LOG_CARD_LINES (40),
// newest last (the build sheet 0.0.3 §2.4; VIEWS §8.6's filters by kind and its newest-first order
// come with the rolls), each stamped in the clock you live by, TIME's face helper on the live site's
// clock: 'S590 06:12:33' (VIEWS §8.6), 'S590 24:00 +12' in the timeslip; its tone as its border, as
// on the toasts. A record with no text (a roll, rendered by SKILLS from 0.0.6) shows its kind. The
// card pauses, as every card does, and opens scrolled to its end.
import { marsClock } from '../../sim/time/dates.js';
import { MIN_MS } from '../../core/clock.js';

/** The lines the card shows. */
export const LOG_CARD_LINES = 40;
const pad2 = (n) => String(n).padStart(2, '0');

/** A record's time on the live site's clock: 'S590 06:12:33', 'S590 24:00 +12' in the slip. */
export function logStamp(ms, lonEDeg) {
  const c = marsClock(ms, lonEDeg);
  return c.timeslip ? `S${c.solOfYear} 24:00 +${Math.floor(c.slipMs / MIN_MS)}` : `S${c.solOfYear} ${pad2(c.hour)}:${pad2(c.minute)}:${pad2(c.second)}`;
}

/** The card's lines: [{ seq, stamp, text, tone }], the last n records of state.log, newest last. */
export function logLines(state, { lonEDeg = 0, n = LOG_CARD_LINES } = {}) {
  return (state?.log ?? []).slice(-n).map(r => ({ seq: r.seq, stamp: logStamp(r.atMs, lonEDeg), text: r.text ?? `(${r.kind})`, tone: r.tone ?? 'note' }));
}

/** The card's body. */
export function logCard(lines) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
  const list = el('div', { className: 'loglist' }, ...(lines.length
    ? lines.map(l => el('div', { className: `logline ${l.tone}` }, el('span', { className: 'stamp', textContent: l.stamp }), el('span', { className: 'text', textContent: l.text })))
    : [el('div', { className: 'logline note' }, el('span', { className: 'text', textContent: 'Nothing written yet.' }))]));
  const body = el('div', { className: 'glass log' }, el('h3', { textContent: 'Log' }), list,
    el('p', { className: 'note', textContent: `The last ${LOG_CARD_LINES} lines, newest last. J or Esc to close.` }));
  queueMicrotask(() => { list.scrollTop = list.scrollHeight; });
  return body;
}
