// OLYMPUS cards: the log card (J), the game's record, readable whole (VIEWS §8.6).
//
// The log is the sim's (src/sim/log.js: state.log, records newest last, at most LOG_MAX 1,500): what
// happened, where you went, what the debug keys did. The card shows its last LOG_CARD_LINES (400: a
// whole scene on the range, which writes some 70; the parity review's, where the last 40 had lost
// string 1 before the scene was scored), newest first with VIEWS §8.6's filter by kind (everything,
// the rolls, what was said, the rest), each stamped in the clock you live by, TIME's face helper on the
// live site's clock (src/sim/places/env.js timeAt, ROADMAP "anywhere"'s step 3): 'S590 06:12:33' at
// Melas (VIEWS §8.6), 'S590 24:00 +12' in the timeslip, '22Mar 06:12:33' on a ship's UTC; its tone as its
// border, as on the toasts. A record with no text shows its kind. A record or a roll marked hidden (a
// failed look that leaves no trace: SKILLS §5.14, "a failed roll to notice something leaves no trace")
// is left out, as tradecraft's J left it out. The card pauses, as every card does, and opens at its top.
//
// The 0.0.5 round's rolls (the build sheet §2.4, VIEWS §8.6: "every roll is readable"): a record of kind
// 'roll' ({ kind: 'roll', roll, step, gun, text }, written by arms and the shot: SKILLS §15.2's record in roll)
// is what the action did in its own words ("Two rounds in the action: a double feed."), with SKILLS'
// checkShort under it after the action's name ("Look at the port: Weapon handling 17 against 4 ·
// routine", "Marksmanship 27 against 19 · a 5": tradecraft's J, the words with the sum under them, the
// parity review's), that folds open on a click (or Enter on it) to the whole sum, checkText, every
// modifier named and the DC's parts in brackets ("Marksmanship check: 14 + 10 + 4 (prone) + 1 (the SO-4)
// + 4 (the aim held) = 33 against 19 (base 6, 25 m 7, the 25 m card 6), hit: a 5."), with the DC's parts
// again on their own line. A routine roll's line is quieter (calm), a failure that is not routine warn.
// An observer's look (a record marked short: the coach's at SHOW CLEAR) is its outcome alone, named
// ("Sgt Trevelyan looks in the chamber: clear."), never its sum: his number is not the shooter's to know.
//
// The 0.0.8 round's contact (the build sheet 0.0.8 §2.1; COMBAT §25.11): a record of kind 'contact' (contact.js, at the
// pause: "Contact: the target, lane 4, 7 m: a rifle.") carries the take-in's sum under it as a roll's line does, folded
// open to the whole sum, factor by factor ("Taken in in 0.55 s: 0.54 (Warfighting 15) × 1 (your sector); Awareness 6 + 14
// = 20 against 7, noticed."); the Rolls filter shows it with the rolls (its notice check is one).
//
// The 0.0.9 round's startle (the build sheet 0.0.9 §2.4; COMBAT §5.7): a record of kind 'startle' (supp.js, at a startle's end:
// "Startled 1.20 s: the bang, the chaos 60 − your hardening 17 = felt 43.") reads as a roll's line does, its head what
// happened ("Startled 1.20 s: the bang.") over the chaos's sum, folded open to the whole record (startleLine); the Rolls
// filter shows it, as it is the one place but the roll's hover where felt is a number (tradecraft's every term).
//
// The 0.0.10 round's Breathe (the build sheet 0.0.10 §2.4; COMBAT §5.2): a record of kind 'breathe' (supp.js breatheEnd: "Breathed
// 4.0 s: the chaos 79 → 63.") reads as a startle's does, its head what was done ("Breathed 4.0 s.") over the chaos's fall
// (breatheLine); the Rolls filter shows it beside the startles (the chaos's own records).
import { MIN_MS } from '../../core/clock.js';
import { timeAt, siteAt } from '../../sim/places/env.js';
import { checkShort, checkText, partsText } from '../../sim/skills/checks.js';
import { ACTIONS } from '../../sim/arms/firearms.js';

/** The lines the card shows. */
export const LOG_CARD_LINES = 400;
/** VIEWS §8.6's filters by kind: id → [the button's words, a record's test]. */
export const LOG_FILTERS = Object.freeze({
  all: Object.freeze(['Everything', () => true]),
  rolls: Object.freeze(['Rolls', (r) => r.kind === 'roll' || r.kind === 'contact' || r.kind === 'startle' || r.kind === 'breathe']),
  said: Object.freeze(['Said', (r) => r.kind === 'say']),
  other: Object.freeze(['The rest', (r) => r.kind !== 'roll' && r.kind !== 'say' && r.kind !== 'contact' && r.kind !== 'startle' && r.kind !== 'breathe']),
});
/** Whether a record stays out of J and the toasts: hidden, or its roll hidden (see the header). */
export const hiddenRec = (rec) => !!(rec?.hidden || rec?.roll?.hidden);
const pad2 = (n) => String(n).padStart(2, '0');

/** A record's time on a site's clock (where: a site, or a Mars east longitude): 'S590 06:12:33', 'S590 24:00 +12' in the slip, '22Mar 06:12:33' on UTC. */
export function logStamp(ms, where) {
  const c = timeAt(where, ms);
  return c.timeslip ? `${c.dayShort} 24:00 +${Math.floor(c.slipMs / MIN_MS)}` : `${c.dayShort} ${pad2(c.hour)}:${pad2(c.minute)}:${pad2(c.second)}`;
}

/** A roll's line, folded and open: { short, full, parts, tone } (SKILLS' checkShort and checkText), or null for a record with no roll. */
export function rollLine(rec) {
  const r = rec?.roll;
  if (!r || (r.kind !== 'check' && r.kind !== 'opposed')) return null;
  // (an observer's look: what he found, named, and no number (see the header))
  if (rec.short) {
    const said = `${rec.name ?? 'The observer'} looks in the chamber: ${r.verb ?? (r.ok ? 'done' : 'nothing seen')}.`;
    return { short: said, full: said, parts: null, tone: 'note', words: null };
  }
  let short, full;
  try { short = checkShort(r); full = checkText(r); } catch { return null; }
  // (a handling roll says what was done first, "Magazine in: Weapon handling 17 against 9 · routine", or a page of
  // them reads as one sum after another (the integrator's, from J on the line); a shot's line is its own)
  const what = rec.step && rec.step !== 'fire' ? ACTIONS[rec.step]?.label ?? null : null;
  if (what) short = `${what}: ${short}`;
  const parts = r.dcParts?.length ? `DC ${r.dc}: ${partsText(r.dcParts)}` : null;
  // (a shot on a card takes its hole's tone, set by the shot (on the paper or not), not the pass at the DC)
  const tone = rec.paper !== undefined ? rec.tone ?? 'note' : r.kind === 'check' && !r.ok && !r.routine ? 'warn' : r.routine ? 'calm' : rec.tone ?? 'note';
  // (the action's own words, a handling roll's: a shot's line is its own)
  const words = rec.step && rec.step !== 'fire' && rec.text ? rec.text : null;
  return { short, full, parts, tone, words };
}

/**
 * A contact's line (a record of kind 'contact'): { short, full, parts, tone, words } as a roll's, its head the record's text,
 * under it the take-in's sum (the record's words, contactNow().last.words: "Taken in in 0.55 s: …"), the factors on
 * their own line where the record lists them ({ why, ms } and { why, k }); null for any other record.
 */
export function contactLine(rec) {
  if (rec?.kind !== 'contact') return null;
  // (a challenge's record carries its identification roll: the roll's line, its head the record's words)
  if (rec.roll && (rec.roll.kind === 'check' || rec.roll.kind === 'opposed')) {
    let short = null, full = null;
    try { short = checkShort(rec.roll); full = checkText(rec.roll); } catch { short = full = null; }
    if (short) return { short, full, parts: rec.roll.dcParts?.length ? `DC ${rec.roll.dc}: ${partsText(rec.roll.dcParts)}` : null, tone: rec.tone ?? 'note', words: rec.text ?? null };
  }
  // (the pause's record: its head ("Contact · 0.55 s. Lane 2, 7 m: a pistol.") over the take-in's sum, from the record's own
  // words where it gives them, else read off its text, whose sum is the sentence "Taken in in …")
  const text = String(rec.text ?? 'Contact.'), m = /^(.*?)\s*(Taken in in [^;]*;[^]*?(?:noticed|notice[^.]*|late)\.)\s*(.*)$/.exec(text);
  const sum = rec.words ?? m?.[2] ?? null, head = rec.words ? text.replace(rec.words, '').replace(/\s+/g, ' ').trim() : m ? `${m[1]} ${m[3]}`.trim() : text;
  const factors = Array.isArray(rec.parts) && rec.parts.length ? rec.parts.map(p => (p.k !== undefined ? `× ${p.k} ${p.why}` : `${(p.ms / 1000).toFixed(2)} s ${p.why}`)).join(' · ') : null;
  if (!sum) return { short: text, full: text, parts: factors, tone: rec.tone ?? 'urgent', words: null };
  return { short: sum, full: sum, parts: factors, tone: rec.tone ?? 'urgent', words: head };
}

/**
 * A startle's line (a record of kind 'startle', 0.0.9): { short, full, parts, tone, words }, its head "Startled 1.20 s: the bang."
 * over the sum "the chaos 60 − your hardening 17 = felt 43" (the record's words where it gives them, else read off its text);
 * null for any other record.
 */
export function startleLine(rec) {
  if (rec?.kind !== 'startle') return null;
  const text = String(rec.text ?? 'Startled.'), m = /^(.*?),\s*(the chaos [^]*?)\.?$/.exec(text);
  const sum = rec.words ?? m?.[2] ?? null, head = m ? `${m[1]}.` : text;
  if (!sum) return { short: text, full: text, parts: null, tone: rec.tone ?? 'warn', words: null };
  return { short: sum, full: text, parts: null, tone: rec.tone ?? 'warn', words: head };
}
/**
 * A Breathe's line (a record of kind 'breathe', 0.0.10): { short, full, parts, tone, words }, its head "Breathed 4.0 s." over the
 * chaos's fall "the chaos 79 → 63" (read off its text); null for any other record.
 */
export function breatheLine(rec) {
  if (rec?.kind !== 'breathe') return null;
  const text = String(rec.text ?? 'Breathed.'), m = /^(.*?):\s*(the chaos [^]*?)\.?$/.exec(text);
  if (!m) return { short: text, full: text, parts: null, tone: rec.tone ?? 'calm', words: null };
  return { short: m[2], full: text, parts: null, tone: rec.tone ?? 'calm', words: `${m[1]}.` };
}
/**
 * The card's lines: [{ seq, stamp, text, sub?, tone, kind, roll?: { short, full, parts } }], the last n records of
 * state.log that are not hidden (see the header), newest first, stamped on the site's clock (site, or Mars at lonEDeg,
 * else the live site's). over: the hidden ones too (debug, after the scene).
 */
export function logLines(state, { lonEDeg = null, site = null, n = LOG_CARD_LINES, over = false } = {}) {
  const where = site ?? lonEDeg ?? siteAt(state);                  // (the live site's clock, the start site's before one)
  return (state?.log ?? []).filter(r => over || !hiddenRec(r)).slice(-n).reverse().map(r => {
    const roll = r.kind === 'roll' ? rollLine(r) : r.kind === 'contact' ? contactLine(r) : r.kind === 'startle' ? startleLine(r) : r.kind === 'breathe' ? breatheLine(r) : null;
    const text = roll ? roll.words ?? roll.short : r.text ?? `(${r.kind})`;
    return { seq: r.seq, stamp: logStamp(r.atMs, where), text, ...(roll?.words ? { sub: roll.short } : {}), tone: roll?.tone ?? r.tone ?? 'note', kind: r.kind, ...(roll ? { roll } : {}) };
  });
}

/** The card's body. */
export function logCard(lines) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids); return n; };
  // (a roll's line folds open to its whole sum on a click, or Enter on it)
  const line = (l) => {
    if (!l.roll) { const r = el('div', { className: `logline ${l.tone}` }, el('span', { className: 'stamp', textContent: l.stamp }), el('span', { className: 'text', textContent: l.text })); r.dataset.kind = l.kind ?? ''; return r; }
    const full = el('div', { className: 'rollfull', hidden: true }, el('span', { textContent: l.roll.full }), ...(l.roll.parts ? [el('br'), el('small', { textContent: l.roll.parts })] : []));
    const sub = l.sub ? [el('small', { className: 'sum', textContent: l.sub })] : [];
    const row = el('div', { className: `logline roll ${l.tone}`, tabIndex: 0, title: 'A click: the whole sum' }, el('span', { className: 'stamp', textContent: l.stamp }), el('span', { className: 'text' }, el('span', { className: 'fold', textContent: '▸ ' }), l.text, ...sub, full));
    row.dataset.kind = 'roll';
    const flip = () => { full.hidden = !full.hidden; row.classList.toggle('open', !full.hidden); row.querySelector('.fold').textContent = full.hidden ? '▸ ' : '▾ '; };
    row.addEventListener('click', flip);
    row.addEventListener('keydown', (e) => { if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); flip(); } });
    return row;
  };
  const rows = lines.map(l => ({ l, row: line(l) }));
  const list = el('div', { className: 'loglist' }, ...(rows.length ? rows.map(x => x.row) : [el('div', { className: 'logline note' }, el('span', { className: 'text', textContent: 'Nothing written yet.' }))]));
  // (VIEWS §8.6's filter by kind: a click shows only that kind)
  const kindOf = (l) => (l.roll ? 'roll' : l.kind ?? '');
  const buttons = Object.entries(LOG_FILTERS).map(([id, [words, test]]) => {
    const b = el('button', { type: 'button', className: `logfilter${id === 'all' ? ' on' : ''}`, textContent: words });
    b.dataset.filter = id;
    b.addEventListener('click', () => {
      for (const x of rows) x.row.hidden = !test({ kind: kindOf(x.l) });
      for (const o of filters.children) o.classList.toggle('on', o === b);
    });
    return b;
  });
  const filters = el('div', { className: 'logfilters' }, ...buttons);
  const rolls = lines.filter(l => l.roll).length;
  const body = el('div', { className: 'glass log' }, el('h3', { textContent: 'Log' }), filters, list,
    el('p', { className: 'note', textContent: `The last ${LOG_CARD_LINES} lines, newest first.${rolls ? ' A roll\'s line opens to its whole sum on a click.' : ''} J or Esc to close.` }));
  queueMicrotask(() => { list.scrollTop = 0; });
  return body;
}
