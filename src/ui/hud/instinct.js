// OLYMPUS hud: the instinct's line, the drill instructor's voice in your head, in the INSTINCT rectangle (VIEWS §7.1, §7.5; SKILLS §14).
//
// One line at the bottom centre (layout.js: 720 × 44 at --ui 1), left to right:
//   the lead     what the game says it is doing instead of the instinct's own line: "Time stands still:
//                a digit to choose." while a choice holds time (VIEWS §7.4), the bench's countdown;
//   the line     SKILLS' instinctNow(state).line, the most pressing thing the DI has to say ("Thirsty.
//                The tap's right here."), its tone as its left border (calm slate, note blue, warn brass,
//                urgent red blinking three times: VIEWS §7.1, §9.4) and T's keycap before it when T does
//                something (its act);
//   the chip     the next line in short, led by "T held" where it has an act at hand (SKILLS §14.1: the
//                most pressing waiting line with no key of its own; T held does it; with no act the
//                short words alone), then the keycaps of waiting lines that have
//                keys of their own and a count of the rest ("+1"); shown on every line, urgent ones too;
//   R's offer    the chip of what's at hand (offer.js), never on an urgent line (SKILLS §14.1).
// Keycaps are the player's layout by physical code (keys.js label: T and R on AZERTY as on QWERTY).
// The rectangle never grows: two rows at most, the lead and the line on the first, the chip and R's
// offer on the second (one row alone when there is only one), each row one line whose words are cut
// with an ellipsis rather than spilt over the picture (VIEWS §7.5; my call, after the shot at the rack
// where the line, its chip and the offer wrapped to three rows and the rectangle cut two of them). In a splash the line is silent (SKILLS §14.3, rule 6: "During a
// splash, none") and the rectangle is the splash's ticker's (hud/splash.js), so update() hides it.
//
// partsOf() is the pure part, the line as a list of parts (the ui-instinct test reads it in node);
// createInstinct(parent) the DOM, written only when the parts change (a frame costs a string compare),
// and rebuilt then, so an urgent line's three blinks start again with each new line.
import { offerWords } from './offer.js';

/** The tones a line may have (SKILLS §14.3's ranks) and the border each takes (VIEWS §9.4). */
export const LINE_TONES = Object.freeze(['calm', 'note', 'warn', 'urgent']);
const toneOf = (t) => (LINE_TONES.includes(t) ? t : 'note');

/**
 * The line's parts: [{ part: 'lead' | 'line' | 'chip' | 'offer', tone, keys: ['T'], text }]. now is
 * instinctNow(state) ({ line, chip, keys, queued }) or null; offer handOffer(state) or null; lead a
 * string or null; label(action) names a key; armed: R's wait asked once.
 */
export function partsOf({ lead = null, now = null, offer = null, label = (a) => a, armed = false } = {}) {
  const out = [];
  const T = label('instinct'), line = now?.line ?? null, chip = now?.chip ?? null;
  if (lead) out.push({ part: 'lead', tone: 'note', keys: [], text: String(lead) });
  if (line?.text) out.push({ part: 'line', tone: toneOf(line.tone), keys: line.act ? [T] : [], text: line.text, id: line.id ?? null, act: line.act ?? null });
  // (the chip: the next keyless line in short, T held does it; the keycaps of lines with keys of their own; the rest counted)
  const keyed = (now?.keys ?? []).map(k => label(k)), queued = Math.max(0, Number(now?.queued) || 0);
  if (chip?.text || chip?.short || keyed.length || queued) {
    const words = [chip?.short ?? shortOf(chip?.text), ...keyed.map(k => `[${k}]`), queued ? `+${queued}` : null].filter(Boolean);
    // (T held's keycap only where the chip has an act to do: a key is never promised for nothing, the review of v0.0.4's "T held Shave" away from a basin)
    out.push({ part: 'chip', tone: toneOf(chip?.tone), keys: chip?.act ? [`${T} held`] : [], text: words.join(' · '), id: chip?.id ?? null, act: chip?.act ?? null });
  }
  // (R's chip, except on an urgent line)
  const w = offerWords(offer, { armed });
  if (w && !(line && toneOf(line.tone) === 'urgent')) out.push({ part: 'offer', tone: 'calm', keys: [label(w.key)], text: w.text, more: w.more, moreKey: w.more ? `${label(w.key)} held` : null });
  return out;
}

/** A waiting line in short, for the chip, when its rule gives no short words: its first sentence. */
export const shortOf = (text) => (text ? (/^[^.!?]+[.!?]/.exec(String(text))?.[0] ?? String(text)) : null);

/** The parts as one plain line (what the player reads), the keycaps in their places. */
export function textOf(parts) {
  return parts.map(p => {
    if (p.part === 'offer') return `${p.keys[0]} ${p.text}${p.more ? ` · ${p.moreKey} more` : ''}`;
    if (p.part === 'chip') return `${p.keys.length ? `${p.keys[0]} ` : ''}${p.text.replace(/\[([^\]]+)\]/g, '$1')}`;
    return `${p.keys.length ? `${p.keys[0]} ` : ''}${p.text}`;
  }).join('  ');
}

/** The line in parent: { el, update(opts) → its text, text }. opts as partsOf's, and hidden (a splash, a card). */
export function createInstinct(parent, { label = (a) => a } = {}) {
  const doc = globalThis.document;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); n.append(...kids); return n; };
  const root = el('div', { className: 'instinct' });
  parent.append(root);
  let shown = null, parts = [];
  const kbd = (k) => el('kbd', { textContent: k });
  // (the parts in their two rows: the lead and the line above, the chip and the offer below)
  function build(list) {
    const top = list.filter(p => p.part === 'lead' || p.part === 'line'), bottom = list.filter(p => p.part === 'chip' || p.part === 'offer');
    return [top, bottom].filter(r => r.length).map((r, i) => el('div', { className: `row ${i === 0 && top.length ? 'top' : 'bottom'}` }, ...partEls(r)));
  }
  function partEls(list) {
    return list.map(p => {
      if (p.part === 'lead') return el('span', { className: 'lead' }, p.text);
      if (p.part === 'line') return el('span', { className: `line ${p.tone}` }, ...(p.keys.length ? [kbd(p.keys[0]), ' '] : []), p.text);
      if (p.part === 'chip') {
        const kids = p.keys.length ? [kbd(p.keys[0]), ' '] : [];
        // (a waiting line's own key as its keycap: "[B]" in the words)
        for (const [i, w] of p.text.split(' · ').entries()) {
          if (i) kids.push(' · ');
          const m = /^\[(.+)\]$/.exec(w);
          kids.push(m ? kbd(m[1]) : w);
        }
        return el('span', { className: `chip next ${p.tone}` }, ...kids);
      }
      const chip = el('span', { className: 'chip offer' }, kbd(p.keys[0]), ` ${p.text}`);
      if (p.more) chip.append(' · ', kbd(p.moreKey), ' more');
      return chip;
    });
  }
  return {
    el: root,
    /** The line now; hidden in a splash or under a card. Returns the text shown ('' when hidden). */
    update({ hidden = false, ...opts } = {}) {
      parts = hidden ? [] : partsOf({ label, ...opts });
      const sig = hidden ? '#hidden' : JSON.stringify(parts);
      if (sig !== shown) {
        shown = sig;
        root.replaceChildren(...build(parts));
        root.hidden = !parts.length;
      }
      return root.hidden ? '' : root.textContent;
    },
    /** The parts shown now (for the debug handle). */
    get parts() { return parts; },
    get text() { return root.hidden ? '' : root.textContent; },
  };
}
