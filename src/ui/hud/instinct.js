// OLYMPUS hud: the instinct's line, the drill instructor's voice in your head, and R's plate, in the INSTINCT rectangle (VIEWS §7.1, §7.5; SKILLS §14).
//
// One line at the bottom centre (layout.js: 720 × 44 at --ui 1), left to right:
//   the lead     what the game says it is doing instead of the instinct's own line: "Time stands still:
//                a digit to choose." while G's stub holds time (VIEWS §7.4), "Time stands still." in
//                stop motion (the 0.0.5 round: the step panel says the rest, and the line beside the
//                lead speaks every tone there, SKILLS §14.3's rule lifted for the 'stop' hold: the build
//                sheet §8 item 10), the bench's countdown; at a contact's pause, until a step is chosen,
//                "Contact · 0.55 s." in the take-in's amber (0.0.8: COMBAT §25.4.6);
//   the line     SKILLS' instinctNow(state).line, the most pressing thing the DI has to say ("Thirsty.
//                The tap's right here."), its tone as its left border (calm slate, note blue, warn brass,
//                urgent red blinking three times: VIEWS §7.1, §9.4) and T's keycap before it when T does
//                something (its act);
//   the chip     the next line in short, led by "T held" where it has an act at hand (SKILLS §14.1: the
//                most pressing waiting line with no key of its own; T held does it; with no act the
//                short words alone), then the keycaps of waiting lines that have
//                keys of their own and a count of the rest ("+1"); shown on every line, urgent ones too;
//   R's plate    what R does here (offer.js), a plate in the kit's pixels at the right of the rectangle
//                (src/ui/kit/pixels.js keyPlatePixels: R's keycap, then "WASH HANDS · 30 S"; "HOLD ▸" in
//                brass where R held has more; its words amber when the offer would make you late; where the
//                spot's own action is struck, why, in grey before the keycap, "USE THE HEAD: NOTHING TO GIVE"), on
//                EVERY line, urgent ones included: the user, 2026-11-06, "the shave+wash+water when pressing
//                R at a basin without the tootip telling us what is going to happen is no good", so R's
//                words always show before R is pressed (the build sheet 0.0.6 §8 item 7, against SKILLS
//                §14.1's "except on an urgent line"). It keeps its place at the right, so the eye finds it
//                where it was, and takes at most PLATE_SHARE of the rectangle (its words cut with "…" past
//                it); the chip and the lead are shortened before it. An urgent line is not: there the plate
//                is short (no ", done" or ", the count", the late showing in amber anyway, no note), and if
//                the line is still cut the plate gives it the room, its own words cut instead (the fixer's,
//                0.0.6: "PT kit is not th…" at 1600 × 900).
// Keycaps are the player's layout by physical code (keys.js label: T and R on AZERTY as on QWERTY).
// The rectangle never grows: two rows at most left of the plate, the lead and the line on the first, the
// chip on the second (one row alone when there is only one), each row one line whose words are cut with an
// ellipsis rather than spilt over the picture (VIEWS §7.5; my call, after the shot at the rack where the
// line, its chip and the offer wrapped to three rows and the rectangle cut two of them). In a splash the
// line is silent (SKILLS §14.3, rule 6: "During a splash, none") and the rectangle is the splash's
// ticker's (hud/splash.js), so update() hides it.
//
// partsOf() is the pure part, the line as a list of parts (the ui-instinct test reads it in node);
// createInstinct(parent) the DOM, written only when the parts change (a frame costs a string compare),
// and rebuilt then, so an urgent line's three blinks start again with each new line. The plate is a canvas
// at round(2 × --ui) CSS pixels a pixel (kit/mount.js plateScale), with its words in plain text beside it for
// a reader (hidden from sight): the rectangle's text is what the player reads.
import { offerWords } from './offer.js';
import { keyPlatePixels } from '../kit/pixels.js';
import { mountPixels, plateScale } from '../kit/mount.js';

/**
 * R's plate takes at most this share of INSTINCT's width (my call: the line is shortened before the plate, the sheet's
 * rule, and keeps a quarter; at 0.6 the sleep's ", done 05:30" was cut at 1024 × 768, the first shot).
 */
export const PLATE_SHARE = 0.75;
/** INSTINCT's width at --ui 1 (layout.js RECTS.INSTINCT). */
const INSTINCT_W = 720;

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
  // (0.0.8: a contact's pause leads "Contact · 0.55 s." in the take-in's amber: COMBAT §25.4.6)
  if (lead) out.push({ part: 'lead', tone: /^Contact · /.test(String(lead)) ? 'contact' : 'note', keys: [], text: String(lead) });
  if (line?.text) out.push({ part: 'line', tone: toneOf(line.tone), keys: line.act ? [T] : [], text: line.text, id: line.id ?? null, act: line.act ?? null });
  // (the chip: the next keyless line in short, T held does it; the keycaps of lines with keys of their own; the rest counted)
  const keyed = (now?.keys ?? []).map(k => label(k)), queued = Math.max(0, Number(now?.queued) || 0);
  if (chip?.text || chip?.short || keyed.length || queued) {
    const words = [chip?.short ?? shortOf(chip?.text), ...keyed.map(k => `[${k}]`), queued ? `+${queued}` : null].filter(Boolean);
    // (T held's keycap only where the chip has an act to do: a key is never promised for nothing, the review of v0.0.4's "T held Shave" away from a basin)
    out.push({ part: 'chip', tone: toneOf(chip?.tone), keys: chip?.act ? [`${T} held`] : [], text: words.join(' · '), id: chip?.id ?? null, act: chip?.act ?? null });
  }
  // (R's plate, on every line, urgent ones included: the build sheet 0.0.6 §8 item 7)
  // (on an urgent line the plate is short, so the DI's order keeps its sentence: the fixer's, 0.0.6)
  const w = offerWords(offer, { armed, short: line?.tone === 'urgent' });
  if (w) out.push({ part: 'offer', tone: 'calm', keys: [label(w.key)], text: w.text, more: w.more, late: w.late, moreKey: w.more ? `${label(w.key)} held` : null, note: w.note ?? null });
  return out;
}

/** A waiting line in short, for the chip, when its rule gives no short words: its first sentence. */
export const shortOf = (text) => (text ? (/^[^.!?]+[.!?]/.exec(String(text))?.[0] ?? String(text)) : null);

/** The parts as one plain line (what the player reads), the keycaps in their places. */
export function textOf(parts) {
  return parts.map(p => {
    if (p.part === 'offer') return `${p.note ? `${p.note} · ` : ''}${p.keys[0]} ${p.text}${p.more ? ` · ${p.moreKey}: the menu` : ''}`;
    if (p.part === 'chip') return `${p.keys.length ? `${p.keys[0]} ` : ''}${p.text.replace(/\[([^\]]+)\]/g, '$1')}`;
    return `${p.keys.length ? `${p.keys[0]} ` : ''}${p.text}`;
  }).join('  ');
}

/** The line in parent: { el, update(opts) → its text, text }. opts as partsOf's, and hidden (a splash, a card) and ui (the --ui scale, for R's plate). */
export function createInstinct(parent, { label = (a) => a } = {}) {
  const doc = globalThis.document;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); n.append(...kids); return n; };
  const root = el('div', { className: 'instinct' });
  const rowsEl = el('div', { className: 'rows' });
  const plateCanvas = el('canvas'), plateWords = el('span', { className: 'words' });
  const plateEl = el('span', { className: 'plate', hidden: true }, plateCanvas, plateWords);
  plateCanvas.setAttribute('aria-hidden', 'true');
  root.append(rowsEl, plateEl);
  parent.append(root);
  let shown = null, parts = [], plateSig = null, plateText = '';
  const kbd = (k) => el('kbd', { textContent: k });
  // (the parts left of the plate in their two rows: the lead and the line above, the chip below)
  function build(list) {
    const top = list.filter(p => p.part === 'lead' || p.part === 'line'), bottom = list.filter(p => p.part === 'chip');
    return [top, bottom].filter(r => r.length).map((r, i) => el('div', { className: `row ${i === 0 && top.length ? 'top' : 'bottom'}` }, ...partEls(r)));
  }
  function partEls(list) {
    return list.map(p => {
      if (p.part === 'lead') return el('span', { className: `lead${p.tone === 'contact' ? ' contact' : ''}` }, p.text);
      if (p.part === 'line') return el('span', { className: `line ${p.tone}` }, ...(p.keys.length ? [kbd(p.keys[0]), ' '] : []), p.text);
      const kids = p.keys.length ? [kbd(p.keys[0]), ' '] : [];
      // (a waiting line's own key as its keycap: "[B]" in the words)
      for (const [i, w] of p.text.split(' · ').entries()) {
        if (i) kids.push(' · ');
        const m = /^\[(.+)\]$/.exec(w);
        kids.push(m ? kbd(m[1]) : w);
      }
      return el('span', { className: `chip next ${p.tone}` }, ...kids);
    });
  }
  // (R's plate: the kit's pixels, drawn again only when its words, its marks, the scale or its room change; squeeze,
  // kit pixels to give back to an urgent line that is cut)
  let plateW = 0;
  function plate(p, ui, squeeze = 0) {
    if (!p) { plateEl.hidden = true; plateSig = null; plateText = ''; plateW = 0; return false; }
    const k = plateScale(ui), maxW = Math.floor((PLATE_SHARE * INSTINCT_W * ui) / k) - squeeze, sig = `${p.keys[0]}|${p.text}|${p.more}|${p.late}|${p.note}|${k}|${maxW}`;
    const changed = sig !== plateSig;
    if (changed) {
      plateSig = sig;
      const pm = keyPlatePixels({ keyText: p.keys[0], words: p.text, more: p.more, late: p.late, maxW, note: p.note });
      mountPixels(plateCanvas, pm, { scale: k });
      plateW = pm.w;
      plateText = `${p.note ? `${p.note} · ` : ''}${p.keys[0]} ${p.text}${p.more ? ` · ${p.moreKey}: the menu` : ''}`;
      plateWords.textContent = ` ${plateText}`;
      plateEl.dataset.text = pm.words;
      plateEl.dataset.note = pm.note ?? '';
      plateEl.title = plateText;
    }
    plateEl.hidden = false;
    return changed;
  }
  // (an urgent line is never cut for the plate: measured once its words or the plate change, the plate's room
  // given back to it, the plate's words cut with "…" instead; the fixer's, 0.0.6, after "PT kit is not th…")
  let squeezed = 0;
  function fitUrgent(p, ui) {
    const lineEl = rowsEl.querySelector('.line.urgent');
    if (!lineEl || !p) { squeezed = 0; return; }
    const over = lineEl.scrollWidth - lineEl.clientWidth;
    if (over <= 0) return;
    const k = plateScale(ui), give = Math.ceil((over + 1) / k);
    const least = Math.floor((PLATE_SHARE * INSTINCT_W * ui) / k) - plateW;     // (the room the plate already left)
    squeezed = Math.max(0, least) + give;
    plate(p, ui, squeezed);
  }
  return {
    el: root,
    /** The line now; hidden in a splash or under a card. Returns the text shown ('' when hidden). */
    update({ hidden = false, ui = 1, ...opts } = {}) {
      parts = hidden ? [] : partsOf({ label, ...opts });
      const sig = hidden ? '#hidden' : JSON.stringify(parts.filter(p => p.part !== 'offer'));
      const rebuilt = sig !== shown;
      if (rebuilt) {
        shown = sig;
        squeezed = 0;
        rowsEl.replaceChildren(...build(parts));
      }
      const op = parts.find(p => p.part === 'offer') ?? null;
      const redrawn = plate(op, ui, squeezed);
      root.hidden = !parts.length;
      if ((rebuilt || redrawn) && !root.hidden && parts.some(p => p.part === 'line' && p.tone === 'urgent')) fitUrgent(op, ui);
      return root.hidden ? '' : root.textContent;
    },
    /** The parts shown now (for the debug handle). */
    get parts() { return parts; },
    /** R's plate's words as drawn ('R WASH HANDS · 30 S'), or ''. */
    get plate() { return plateEl.hidden ? '' : plateEl.dataset.text ?? ''; },
    get text() { return root.hidden ? '' : root.textContent; },
  };
}
