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
// A line longer than two rows (a drawn house's brief: its doors and its kit after the lane's words, 534 × 125 px of text at
// 1280 × 720 in a box of two rows, the play review of 2026-11-16) is paged, never cut: split at its sentences (at its words where
// one sentence is longer than the box) into pages that each fit the two rows (splitPages, measured on the row itself), each shown
// for its words' share of the line's hold (pageAt), "…" at a page's end where more follows and at the next one's start. The box
// still never grows.
//
// v0.0.25's fixer (the play review of "Hold to hold"): a speaker's line said on the tick of a long one of his (over CHAIN_WORDS 12
// words, which shows alone) waits for it (the queue's waitS), so the cadre's two lines of the brief's tick both read; on a ship (the Wreck: R.house.ship) there is no tower, and
// the cadre's commands are headed as his own words where he stands; a line heard at a place (the fact's `at`, your #2's "Got you."
// at the scuttle on your deck) is as far as that place, never as its speaker in the plan, 58 m off on the other deck.
// lineOf(fact, state) and standingLine(state) are the pure part (the ui tests read them in node), createRadio(parent) the DOM.
import { playerId } from '../../core/ids.js';
import { standingCmd, rangeOf } from '../../sim/scenarios/handling.js';

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
  // (ROADMAP "anywhere" step 6: a speaker that is no person, the ship's 1MC (gravity.js), says its own name)
  if (fact.speaker && !fact.who) head = `◉ ${String(fact.speaker).toUpperCase()}`;
  // (no tower on a ship, the Wreck's cadre's commands are his own word where he stands, the play review's "TOWER ·
  // SSGT BARROS" in the Wreck)
  else if (fact.kind === 'pa' && !state?.armoury?.range?.house?.ship) head = `◉ TOWER${who ? ` · ${who}` : ''}`;
  else if (fact.kind === 'radio') head = `◉ ${who || 'NET'}${UNIT_WORD(p) ? ` · ${UNIT_WORD(p)}` : ''}`;
  else {
    // (a line heard at a place other than its speaker's (its `at`: your #2's "Got you." at the scuttle while he is 58 m off in the
    // plan, on the other deck) is as far as that place, the fixer of v0.0.25's play review)
    const where = fact.at && Number.isFinite(fact.at.x) ? whereAt(state, fact.at) : whereOf(state, fact.who);
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
  // (0.0.9, the fixer's: on the pairs bay the coach runs the line beside you, so his command stands as his speech, not the
  // tower's: it stood twice, "◉ TOWER … NOW" over his own "BESIDE YOU" line (the integrator's, from v0.0.8))
  // (at the armoury the armourer, the NCO and the squad leader beside you, never a tower; the standing line their words and what to
  // press after them (said: the words alone, so the spoken line it stands for leaves the box))
  const l = lineOf({ who: c.who, text: c.text, kind: ['pairs', 'armoury'].includes(rangeOf(state)?.course) ? 'speech' : 'pa' }, state);
  return l ? { ...l, atMs: c.atMs, short: c.short, standing: true, key: `${c.i}`, ...(c.said ? { said: c.said } : {}) } : null;
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
  const kept = lines.filter(l => !((l.kind === 'pa' && at(l) < standing.atMs) || (l.text === standing.text && l.head === standing.head) || (standing.said && l.text === standing.said && l.head === standing.head)));
  const k = kept.findIndex(l => at(l) >= standing.atMs);
  return k < 0 ? [...kept, standing] : [...kept.slice(0, k), standing, ...kept.slice(k)];
}
// (where a speaker stands from you: "BESIDE YOU" within BESIDE_M, else the metres)
function whereOf(state, who) {
  const list = state?.actors?.list ?? [], them = list.find(a => a.who === who);
  return them ? whereAt(state, them) : '';
}
// (where a place is from you, the same words)
function whereAt(state, at) {
  const me = (state?.actors?.list ?? []).find(a => a.id === state?.player?.actor);
  if (!me || !at) return '';
  const d = Math.hypot(at.x - me.x, at.z - me.z);
  return d <= BESIDE_M ? 'BESIDE YOU' : `${Math.round(d)} M`;
}

/**
 * A text split into pages that each fit (see the header): fits(text) says whether a page's text fits the two rows (the DOM's
 * measure in the page; a test gives its own). At sentences, at words where one sentence does not fit alone. Pure.
 */
export function splitPages(text, fits) {
  const t = String(text ?? '').trim();
  if (!t || fits(t)) return [t];
  const parts = t.split(/(?<=[.!?:;])\s+/).flatMap(sn => (fits(`… ${sn} …`) ? [sn] : sn.split(/\s+/)));
  const pages = [];
  let cur = '';
  for (const w of parts) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && !fits(`… ${next} …`)) { pages.push(cur); cur = w; } else cur = next;
  }
  if (cur) pages.push(cur);
  return pages;
}
/** The page shown elapsedS into a line held holdS, each page for its words' share of the hold (see the header). Pure. */
export function pageAt(pages, elapsedS, holdS) {
  if (!pages?.length) return 0;
  const words = pages.map(p => p.split(/\s+/).filter(Boolean).length), all = words.reduce((a, b) => a + b, 0) || 1;
  const f = Math.max(0, Math.min(1, elapsedS / Math.max(1e-6, holdS)));
  let acc = 0;
  for (let i = 0; i < pages.length; i++) { acc += words[i] / all; if (f < acc - 1e-9) return i; }
  return pages.length - 1;
}
/** A page as the box shows it: "…" where text comes before it and where more follows. */
export const pageText = (pages, i) => `${i > 0 ? '… ' : ''}${pages[i] ?? ''}${i < pages.length - 1 ? ' …' : ''}`;

/** A line of more words than this said on a tick holds back a line of the same speaker's said with it (createRadioQueue; v0.0.25's fixer). */
export const CHAIN_WORDS = 12;
const wordsOf = (t) => String(t ?? '').trim().split(/\s+/).filter(Boolean).length;
/** The box's lines over time, without the DOM: { push(line), frame(dtS, running), lines }. */
export function createRadioQueue({ max = RADIO_LINES } = {}) {
  let lines = [];
  return {
    // (a speaker's line said on the tick of a long one of his (over CHAIN_WORDS: it wraps to the box's two rows and shows alone) waits
    // for it (waitS), so it never puts the long one out of the box before it is read: v0.0.25's fixer, the play review's "the brief's
    // first line is never shown"; short lines of one tick, the coach's dope and his wind call, still read together)
    push(line) {
      if (!line) return;
      const prev = lines.at(-1), chained = prev && line.atMs !== null && prev.atMs === line.atMs && prev.who === line.who && prev.head === line.head && wordsOf(prev.text) > CHAIN_WORDS;
      lines.push({ ...line, leftS: line.holdS, waitS: chained ? (prev.waitS ?? 0) + prev.holdS : 0 });
      while (lines.length > max + lines.filter(l => l.waitS > 0).length) lines.shift();
    },
    frame(dtS, running = true) {
      if (running) for (const l of lines) { const d = Math.max(0, Math.min(dtS, 0.25)); if (l.waitS > 0) l.waitS = Math.max(0, l.waitS - d); else l.leftS -= d; }
      lines = lines.filter(l => l.leftS > 0);
    },
    clear() { lines = []; },
    get lines() { return lines.filter(l => !(l.waitS > 0)); },
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
  // (a long line's pages by its text and the row's width (splitPages); a line's text as shown now, its page by its hold)
  const pagesKept = new Map();
  const shownText = (l) => {
    const P = l.standing ? null : pagesKept.get(`${l.text}|${root.clientWidth}`);
    return P && P.length > 1 ? pageText(P, pageAt(P, (l.holdS ?? 0) - (l.leftS ?? 0), l.holdS ?? 1)) : l.text;
  };
  return {
    el: root,
    say(fact, state) { queue.push(lineOf(fact, state)); },
    frame(dtMs, running = true) { queue.frame(dtMs / 1000, running); },
    /** state: the game's, for the tower's standing command (standingLine); without it the box shows the voices alone. */
    update({ hidden = false, weapon = false, state = null } = {}) {
      root.classList.toggle('weapon', !!weapon);
      standing = hidden ? null : standingLine(state);
      const lines = hidden ? [] : boxLines(queue.lines, standing), s = JSON.stringify(lines.map(l => [l.head, shownText(l), l.kind, !!l.standing]));
      if (s !== sig) {
        sig = s;
        const rows = lines.map(l => el('div', { className: `voice ${l.kind}${l.standing ? ' standing' : ''}` }, el('span', { className: 'who', textContent: l.head }), el('span', { className: 'said', textContent: shownText(l) })));
        root.replaceChildren(...rows);
        root.hidden = !lines.length;
        // (a voice longer than its two rows paged, measured on its own row once a text and width (see the header))
        if (!root.hidden) lines.forEach((l, i) => {
          const key = `${l.text}|${root.clientWidth}`, said = rows[i].querySelector('.said');
          if (l.standing || pagesKept.has(key) || !said) return;
          const fits = (t) => { said.textContent = t; return said.scrollHeight <= said.clientHeight + 1; };
          const P = fits(l.text) ? [l.text] : splitPages(l.text, fits);
          if (pagesKept.size > 32) pagesKept.clear();
          pagesKept.set(key, P);
          said.textContent = shownText(l);
          if (P.length > 1) sig = JSON.stringify(lines.map(x => [x.head, shownText(x), x.kind, !!x.standing]));
        });
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
    clear() { queue.clear(); sig = null; shown = []; pagesKept.clear(); root.replaceChildren(); root.hidden = true; },
    /** The box's lines, in the order said: the voices queued and the standing command (as last updated) in its place. */
    get lines() { return boxLines(queue.lines, standing).map(l => ({ head: l.head, text: l.text, kind: l.kind, ...(l.standing ? { standing: true } : {}) })); },
  };
}
