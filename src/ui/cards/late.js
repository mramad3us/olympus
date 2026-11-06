// OLYMPUS cards: the late card, an activity that would end after you are due somewhere (TIME §9.5; the build sheet 0.0.4 §2.4).
//
// Time's lateCheck(state, id, spotId, durMs) says when an activity begun now would end after the
// moment you must leave for a call (the drill's count at your rack, due − the walk): { block, dueMs,
// walkMs, endMs, fitMs, label: 'the count at your rack, 02:35' }. Then R does not start it: this card
// comes up, paused like every card, with three answers (TIME §9.5):
//   1 fit it in · 6 min    the activity shortened to end at due − walk (fitMs), offered only where it
//                          fits the activity's least (time refuses it under min: the line is struck out
//                          with why);
//   2 do it anyway         the whole of it, and late (it says when it would be done);
//   3 not now              nothing.
// The answer goes back to main.js, which sends time's { act: 'activity', args: { id, spotId, args,
// late: 'fit' | 'accepted' } }, or nothing. Graphics over words (the user, tradecraft 2026-11-04): the
// card is the call, a bar of the time left against the activity's length, and the three lines.
import { durationText, MIN_MS } from '../../core/clock.js';

/** The card's lines, pure: [{ answer: 'fit' | 'accepted' | 'no', text, small, ok }]. what: { label, durMs, min }; late: lateCheck's. */
export function lateLines(what, late, { clockText = (ms) => String(ms) } = {}) {
  const fitMs = Number.isFinite(late?.fitMs) ? late.fitMs : null, minMs = (what?.min ?? 0) * MIN_MS;
  const canFit = fitMs !== null && fitMs > 0 && fitMs >= minMs && fitMs < (what?.durMs ?? Infinity);
  return [
    { answer: 'fit', text: canFit ? `fit it in · ${durationText(fitMs)}` : 'fit it in', small: canFit ? `done ${clockText((late.endMs ?? 0) - (what.durMs - fitMs))}, in time` : 'it will not fit', ok: canFit },
    { answer: 'accepted', text: 'do it anyway', small: `done ${clockText(late?.endMs ?? 0)}, late`, ok: true },
    { answer: 'no', text: 'not now', small: null, ok: true },
  ];
}

/**
 * The card's body and its numbered lines: { body, lines }. what: { label (the offer's head: 'shower'),
 * durMs, min }; late: lateCheck's; onAnswer('fit' | 'accepted' | 'no'); clockText(ms) the watch's 'HH:MM';
 * nowMs the clock now (the bar's start).
 */
export function lateCard({ what, late, onAnswer, clockText = (ms) => String(ms), nowMs = null }) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(globalThis.document.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined)); return n; };
  const rows = lateLines(what, late, { clockText });
  const lines = rows.map((r, i) => {
    const b = el('button', { className: `item${r.ok ? '' : ' struck'}`, type: 'button', disabled: !r.ok, onclick: () => r.ok && onAnswer?.(r.answer) },
      el('kbd', { textContent: String(i + 1) }), r.text, r.small ? el('small', { textContent: r.small }) : null);
    return b;
  });
  // (the time left before you must go, against the activity's length: the bar is the argument, VIEWS §8.1)
  let bar = null;
  if (Number.isFinite(nowMs) && Number.isFinite(late?.dueMs) && Number.isFinite(what?.durMs)) {
    const leaveMs = late.dueMs - (late.walkMs ?? 0), span = Math.max(what.durMs, leaveMs - nowMs, 1);
    const pct = (ms) => `${Math.max(0, Math.min(100, (ms / span) * 100)).toFixed(1)}%`;
    bar = el('div', { className: 'latebar', title: `${durationText(Math.max(0, leaveMs - nowMs))} before you must go; ${what.label ?? 'it'} takes ${durationText(what.durMs)}` },
      el('span', { className: 'left', style: `width:${pct(Math.max(0, leaveMs - nowMs))}` }), el('span', { className: 'need', style: `width:${pct(what.durMs)}` }));
  }
  const body = el('div', { className: 'glass late' },
    el('h3', { textContent: `Late for ${late?.label ?? 'a call'}` }),
    bar,
    el('div', { className: 'glass-list' }, ...lines),
    el('p', { className: 'note', textContent: `${what?.label ?? 'It'} takes ${durationText(what?.durMs ?? 0)}. A digit or a click; Esc is not now.` }));
  return { body, lines };
}
