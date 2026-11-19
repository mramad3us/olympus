// OLYMPUS hud: the body strip, the felt body drawn as nine pictograms (VIEWS §7.6, §9.1), and the glyphs it is made of.
//
// The user, tradecraft 2026-11-04: "too wordy, this needs to be a on-hover infocard", "too many words,
// this should be graphics". So the body as the character feels it is a row of 5 × 5 pictograms (VIEWS
// §9.1's rows, one bit a pixel): water (the drop), food (the fork), bladder (the vessel), bowel (the
// coil), sleep (the moon), grime, heat (the thermometer, the flake when cold), air (the lungs) and
// pain (the jag). BODY gives each need's felt band as stripOf(body, ms): [{ need, band, fill, tone }],
// fill 0 to 5 being how many of the glyph's five rows are filled from the bottom (VIEWS §7.6: "filled
// from the bottom to its felt band"), tone the instinct's (fine, note, warn, urgent). A glyph is drawn
// with its unfilled pixels in the glass's line colour and its filled ones in the tone's colour (fine a
// pale grey, note the prompt blue, warn brass, urgent red: VIEWS §9.4's prompt tones), and a glyph in a
// warn or urgent band takes that colour as its border too, so the tone is doubled by a shape (VIEWS
// §12). The fill is solid: the belief's dithering (a 50% checker when "thinking so") waits for SKILLS'
// beliefs (my call, this round: what the body reports is what is felt).
//
// Where it shows (VIEWS §7.6): folded into the watch, only the glyphs whose band has left fine
// (foldedOf), so it is empty when all is well and is not a row of meters to keep green; at twice that
// size at the head of the character sheet's ON YOU (cards/sheet.js), all nine; and in the splash's
// outcome strip for each need that moved, before and after with a one-pixel arrow between (movedOf;
// hud/splash.js). A glyph's words are its title, the on-hover infocard of this round (my call; VIEWS'
// pixel tooltip comes with LONGHAUL's tooltip.js port).
//
// Each glyph is a 5 × 5 canvas drawn once per change (its pixels by glyphCells, pure, so the node test
// reads them), scaled up by CSS with image-rendering: pixelated: STRIP_SCALE (3) times on the HUD, 6
// on the sheet. createStrip(parent) keeps a row of them and writes the DOM only when the entries'
// signature changes, so a frame costs a string compare.
//
// The G line (v0.0.24, ROADMAP "anywhere" step 6; AW§4.3 item 7): under the strip, one line of the felt gravity, shown only when it
// is not nominal: whenever the felt g is under 0.3 G or a gravity event is pending or under way ("0.00 G · on mag boots",
// "0.00 G · floating", "BRACE 0:08" through the warning, "1.00 G · burn" through the change), and absent at Mars and the Wheel. It
// is the body's own sign (BODY's "what the player knows": weight is felt), not a gauge. gLineText(facts) formats the facts of
// src/sim/places/gravity.js gLineOf (gravityAt for the g to 0.01 G, footingOf for the word: one quantity, one helper; the count to
// the onset in whole seconds, rounded up, as the 1MC counts); createGLine(parent) the DOM, written only on a change.
// v0.0.25's burn polish (the user's score of test-burn, 2026-11-19: "We should have some indication of how strong is the burn and
// evasive maneuvers"): with an event pending or under way the line gives its size and direction, "BRACE 0:08 · JINK 3.0 G ↓ PORT"
// through the warning and "2.40 G ↓ jink to port" or "1.00 G ▼ burn" while it acts (the arrow the screen's way the push throws a
// body, ▼ a felt change onto the deck: src/data/onemc.js dirOf), and the G meter under it (gMeterOf, pure): a bar over GMETER_MAX_G
// 3 G, filled to the push acting now (to the coming size, hatched, through the warning), a mark at what locked boots hold (the
// boots' shear limit across the deck, BRACE_G onto it) and, where they will not, "BOOTS WILL NOT HOLD" in red beside it ("STRAPPED IN"
// in green once you are).
import { GRAV_BODY, BRACE_G } from '../../data/body/needs.js';

/** The glyphs' rows, top to bottom, 1 an ink pixel (VIEWS §9.1; the look glyphs of the outcome strip my calls). */
export const GLYPHS = Object.freeze({
  water: ['00100', '00100', '01110', '11111', '01110'],
  food: ['10101', '10101', '11111', '00100', '00100'],
  bladder: ['10001', '10001', '10001', '10001', '01110'],
  bowel: ['01110', '10000', '01110', '00001', '01110'],
  sleep: ['01110', '11000', '11000', '11000', '01110'],
  grime: ['10010', '00100', '01001', '10000', '00101'],
  heat: ['00100', '00100', '00100', '01110', '01110'],
  cold: ['10101', '01110', '11111', '01110', '10101'],
  air: ['00100', '10101', '11011', '11011', '01010'],
  pain: ['00010', '00100', '01110', '00100', '01000'],
  clock: ['01110', '10101', '10111', '10001', '01110'],
  // (the outcome strip's one-pixel arrow, before → after: VIEWS §5.6)
  arrow: ['00100', '00010', '11111', '00010', '00100'],
  // (you as you look, for the outcome strip: wet hair, a towel, utilities, PT kit; my calls)
  wet: ['01010', '00000', '01110', '11111', '11111'],
  towel: ['00000', '11111', '11111', '10101', '00000'],
  utilities: ['11011', '11111', '01110', '01110', '01110'],
  pt: ['11011', '01110', '01110', '01010', '01010'],
});
/** The strip's order, left to right (VIEWS §7.6). */
export const STRIP_ORDER = Object.freeze(['water', 'food', 'bladder', 'bowel', 'sleep', 'grime', 'heat', 'air', 'pain']);
/**
 * Glyph pixels, and the scale on the HUD (my call: 5 × 5 at 3×, the build sheet 0.0.4 §4), on the sheet
 * (twice that, VIEWS §8.2) and in the splash's outcome strip (twice too, my call: the strip is the
 * moment the change is read, 0.8 s of it, and at 3× the shot of the shower showed it too small to read).
 */
export const GLYPH_PX = 5, STRIP_SCALE = 3, SHEET_SCALE = 6, OUTCOME_SCALE = 6;
/** The tones' colours (VIEWS §9.4's prompt tones; fine a pale grey of the glass). */
export const TONE_COLOURS = Object.freeze({ fine: '#b8bdc8', calm: '#4c5262', note: '#3b6296', warn: '#e7b84a', urgent: '#9e3c36' });
/** An unfilled pixel of a glyph (a faint slate: the glass's line colour read too dark on the HUD's glass in the shots). */
export const INK_COLOUR = '#6a7182';
const TONES = new Set(['fine', 'calm', 'note', 'warn', 'urgent']);
const toneOf = (t) => (TONES.has(t) ? t : 'fine');

/** A glyph's 25 pixels for a fill (0 to 5 rows from the bottom): 0 empty, 1 ink, 2 filled; an unknown name is all empty. */
export function glyphCells(name, fill = 0) {
  const rows = GLYPHS[name], out = new Uint8Array(GLYPH_PX * GLYPH_PX);
  if (!rows) return out;
  const f = Math.max(0, Math.min(GLYPH_PX, Math.round(fill)));
  for (let y = 0; y < GLYPH_PX; y++) for (let x = 0; x < GLYPH_PX; x++) {
    if (rows[y][x] !== '1') continue;
    out[y * GLYPH_PX + x] = y >= GLYPH_PX - f ? 2 : 1;
  }
  return out;
}

/** Whether an entry's band has left fine (the watch shows only those). */
export const leftFine = (e) => !!e && ((e.i ?? 0) > 0 || (toneOf(e.tone) !== 'fine' && toneOf(e.tone) !== 'calm'));

/** The entries the watch folds in: those whose band has left fine, in the strip's order. */
export function foldedOf(strip) {
  return orderOf(strip).filter(leftFine);
}

// (a strip's entries in VIEWS's order, unknown needs after)
function orderOf(strip) {
  const list = Array.isArray(strip) ? strip.filter(e => e && e.need) : [];
  const at = (n) => { const i = STRIP_ORDER.indexOf(n); return i < 0 ? 99 : i; };
  return list.slice().sort((a, b) => at(a.need) - at(b.need));
}

/** A strip as an outcome's before or after holds it: the array, or { strip }. */
export const stripIn = (side) => (Array.isArray(side) ? side : Array.isArray(side?.strip) ? side.strip : []);

/**
 * The needs that moved between two strips (the outcome strip, VIEWS §5.6): [{ need, before, after }],
 * in the strip's order; a need moved when its band or its fill changed.
 */
export function movedOf(before, after) {
  const b = new Map(stripIn(before).map(e => [e.need, e]));
  const out = [];
  for (const a of orderOf(stripIn(after))) {
    const p = b.get(a.need);
    if (!p) continue;
    if (p.band !== a.band || Math.round(p.fill ?? 0) !== Math.round(a.fill ?? 0)) out.push({ need: a.need, before: p, after: a });
  }
  return out;
}

/** The glyph a need is drawn with: its own, heat's flake when its band is a cold one. */
export const glyphFor = (e) => (e?.need === 'heat' && /cold|chill/.test(String(e.band ?? '')) ? 'cold' : e?.need);

/** A glyph's words for its on-hover card: the band's words if the entry has them, else the need and its band. */
export function wordsFor(e) {
  if (!e) return '';
  if (e.words) return e.words;
  const need = { water: 'Thirst', food: 'Hunger', bladder: 'Bladder', bowel: 'Bowel', sleep: 'Sleep', grime: 'Hygiene', heat: 'Heat', air: 'Air', pain: 'Pain' }[e.need] ?? e.need;
  return e.band ? `${need}: ${e.band}` : need;
}

// ---- the DOM ----

/** A glyph as a canvas element (5 × 5 pixels, shown at scale): { name, fill, tone, scale, title }. */
export function glyphEl({ name, fill = 0, tone = 'fine', scale = STRIP_SCALE, title = '', border = null } = {}) {
  const c = globalThis.document.createElement('canvas');
  c.width = GLYPH_PX; c.height = GLYPH_PX;
  c.className = `glyph ${toneOf(tone)}`;
  const t = toneOf(tone), bordered = border ?? (t === 'warn' || t === 'urgent');
  c.style.width = c.style.height = `calc(${GLYPH_PX * scale}px * var(--ui))`;
  if (bordered) c.classList.add('bordered');
  if (title) c.title = title;
  c.dataset.glyph = name;
  c.dataset.fill = String(Math.round(fill));
  const g = c.getContext('2d');
  if (g) {
    const cells = glyphCells(name, fill);
    for (let i = 0; i < cells.length; i++) {
      if (!cells[i]) continue;
      g.fillStyle = cells[i] === 2 ? TONE_COLOURS[t] : INK_COLOUR;
      g.fillRect(i % GLYPH_PX, Math.floor(i / GLYPH_PX), 1, 1);
    }
  }
  return c;
}

/** A strip's entry as a glyph element (its words its title). */
export const entryEl = (e, scale = STRIP_SCALE) => glyphEl({ name: glyphFor(e), fill: e.fill ?? 0, tone: e.tone, scale, title: wordsFor(e) });

/**
 * A row of the strip in parent: { el, update(entries) → the signature shown }. entries are stripOf()'s
 * (or foldedOf()'s); the row is hidden when there are none. The DOM is written only on a change.
 */
export function createStrip(parent, { scale = STRIP_SCALE, className = 'strip' } = {}) {
  const root = Object.assign(globalThis.document.createElement('div'), { className });
  root.hidden = true;
  parent.append(root);
  let shown = null;
  return {
    el: root,
    update(entries = []) {
      const list = Array.isArray(entries) ? entries : [];
      const sig = list.map(e => `${e.need}:${e.band}:${Math.round(e.fill ?? 0)}:${e.tone}:${e.words ?? ''}`).join('|');
      if (sig !== shown) {
        shown = sig;
        root.replaceChildren(...list.map(e => entryEl(e, scale)));
        root.hidden = !list.length;
      }
      return sig;
    },
    get shown() { return shown; },
  };
}

// ---- the G line (v0.0.24, see the header) ----

/** The G line's words for gravity.js gLineOf's facts, '' when there are none (nominal). */
export function gLineText(g) {
  if (!g) return '';
  const sized = Number.isFinite(g.toG) && g.dir;
  if (g.phase === 'warn' && Number.isFinite(g.leftMs)) {
    const s = Math.ceil(g.leftMs / 1000), count = `BRACE ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    if (!sized) return count;
    return `${count} · ${g.kind.toUpperCase()} ${g.toG.toFixed(1)} G ${g.dir.arrow}${g.lateral ? ` ${g.dir.word.toUpperCase()}` : ''}`;
  }
  const gG = Number.isFinite(g.gG) ? g.gG.toFixed(2) : '?';
  if (g.phase && g.kind && sized) return g.lateral ? `${(g.pushG ?? 0).toFixed(2)} G ${g.dir.arrow} ${g.kind} ${g.dir.to}` : `${gG} G ${g.dir.arrow} ${g.kind}`;
  return g.phase && g.kind ? `${gG} G · ${g.kind}` : `${gG} G · ${g.word ?? ''}`.trim();
}

/** The G meter's scale, G (see the header). */
export const GMETER_MAX_G = 3;
/** The note beside the meter where locked boots will not hold the event, and where you ride it strapped in. */
export const NO_HOLD_WORDS = 'BOOTS WILL NOT HOLD', STRAPPED_WORDS = 'STRAPPED IN';
/**
 * The G meter for gravity.js gLineOf's facts (see the header): null with no event pending or under way, else { k (the fill, 0 to 1
 * of GMETER_MAX_G), markK (what locked boots hold, on the same scale), target (through the warning: the coming size), over (boots
 * will not hold it), note }.
 */
export function gMeterOf(g) {
  if (!g?.phase || !Number.isFinite(g.toG) || !g.dir) return null;
  const clamp = (v) => Math.max(0, Math.min(1, v / GMETER_MAX_G)), target = g.phase === 'warn';
  const now = target ? g.toG : g.lateral ? g.pushG ?? 0 : g.gG;
  const over = g.holds === false, safe = g.word === 'strapped in';
  return { k: clamp(now), markK: clamp(g.lateral ? GRAV_BODY.BOOTS_SHEAR_G : BRACE_G), target, over, safe, note: safe ? STRAPPED_WORDS : over ? NO_HOLD_WORDS : '' };
}

/** The G line in parent: { el, update(facts) → its text }; hidden when nominal, the DOM written only on a change (the meter's on a change of its rounded fill). */
export function createGLine(parent, { className = 'gline' } = {}) {
  const doc = globalThis.document, mk = (tag, cls) => Object.assign(doc.createElement(tag), { className: cls });
  const root = mk('div', className), text = mk('div', 'gtext'), row = mk('div', 'gmrow'), note = mk('span', 'gnote'), meter = mk('span', 'gmeter'), fill = mk('i', 'fill'), mark = mk('b', 'mark');
  meter.append(fill, mark); row.append(note, meter); root.append(text, row);
  root.hidden = true; row.hidden = true;
  parent.append(root);
  let shown = null, meterKey = null;
  return {
    el: root,
    update(facts = null) {
      const words = gLineText(facts);
      if (words !== shown) {
        shown = words;
        text.textContent = words;
        root.hidden = !words;
        root.classList.toggle('brace', !!facts && facts.phase === 'warn');
      }
      const m = words ? gMeterOf(facts) : null, key = m ? `${Math.round(m.k * 100)}|${Math.round(m.markK * 100)}|${m.target}|${m.over}|${m.safe}` : '';
      if (key !== meterKey) {
        meterKey = key;
        row.hidden = !m;
        if (m) {
          fill.style.width = `${(m.k * 100).toFixed(0)}%`; mark.style.left = `${(m.markK * 100).toFixed(0)}%`;
          meter.classList.toggle('target', m.target); meter.classList.toggle('over', m.over);
          note.textContent = m.note; note.classList.toggle('safe', m.safe);
        }
      }
      return words;
    },
    get shown() { return shown; },
    get meter() { return meterKey; },
  };
}
