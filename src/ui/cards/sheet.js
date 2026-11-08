// OLYMPUS cards: the character sheet (C), PERSONNEL, your body as you feel it and your file (VIEWS §8.2).
//
// Tradecraft's four columns made a service record (VIEWS §8.2), three of them this round (the build
// sheet 0.0.4 §2.4): the doll, you as you stand (the stage's doll(), src/art/doll/doll.js, given the
// body's cues: wet hair, grime, sweat, stubble, tired eyes, a hand at the belt when the bladder
// presses), ON YOU (BODY's words for what the character feels, wordsOf(body, ms): the line, "Fed two
// hours ago; thirsty.", then each need a row with its stage in words, never a number the character
// could not know: VIEWS §8.2; the strip's nine glyphs of VIEWS §7.6 each at the head of its own row, in
// the strip's order, the rows with no glyph after them, so the watch's folded glyphs can be learnt
// here: the review of v0.0.4, one row of nine above a table of ten matched nothing), and THE
// FILE (name, rank, MOS, unit, billet, rack, time in service, from the roster). WHAT YOU ARE (the
// skills) comes with SKILLS at 0.0.6. The card pauses the game, as every card does; C or Esc closes it.
//
// sheetOf(state, { body }) is the pure part (the ui-sheet test reads it in node): body is BODY's
// readers ({ bodyOf, stagesOf, stripOf, wordsOf, cuesOf, hairOf }, src/sim/body/), given by main.js so this card
// holds no body rule (but one of words: a shaved head's "Hair wet." reads "Head wet.", since BODY
// knows the body and not the haircut). sheetCard(sheet, { dollOf }) is the DOM; dollOf(args) the stage's doll().
//
// The 0.0.6 round's (the build sheet 0.0.6 §2.3): a Hands row (BODY's wordsOf, "Dirty hands, since the head.":
// the head no longer washes them, the basin does, the user's ask of 2026-11-06) and a Haircut row from the
// hair's one helper, hairOf ("High and tight · growing out", "Haircut due Thursday.", "Out of regulation."):
// grooming the hair as the beard is groomed (the user, 2026-11-06: "we should have to groom our hair the same
// way we will have to groom our beards"). "Head wet." now for the shaved cut (v0.0.4's bald is gone).
//
// The 0.0.7 round's (the build sheet 0.0.7 §2.2, §2.5): a wound is on the sheet in BODY's words (wounds.js
// woundWords(rec, ms): "A gunshot wound in the left thigh, bleeding hard."), under the line and over the needs,
// never a number (blood, points, rates are the body's, not the character's); body.woundWords is given by main.js.
//
// The 0.0.9 round's (the build sheet 0.0.9 §2.3, §8 item 16; SKILLS §6.8; VIEWS §8.2): where the sheet is written, THE FILE
// gives Hardening under the skills, in words (the user's answer of 2026-11-07: "shown in words from green to unshakeable"):
// "Hardening · green · inoculation 6 of 10: as far as unit training goes", the level word (supp.js hardWord), the training
// under noise counted against its teacher's cap (inocOf), "frayed: the noise reaches you more today" while the body's
// toll takes some back; its number and its parts only on the hover ("Hardening 17: experience 11, training 6"). The
// readers are given by main.js (supp: { hardParts, hardWord, inocOf }), so this card holds no rule of the chaos.
import { RANKS } from '../../data/people/ranks.js';
import { COMPANY } from '../../data/people/billets.js';
import { unitName, billetDef } from '../../sim/people/roster.js';
import { playerId, playerActor } from '../../core/ids.js';
import { durationText, DAY_MS } from '../../core/clock.js';
import { entryEl, STRIP_ORDER } from '../hud/strip.js';
import { SKILLS, levelOf } from '../../sim/skills/skills.js';
import { valueOf } from '../../sim/skills/templates.js';

/** A row's glyph on the sheet, CSS pixels a glyph pixel at --ui 1 (my call: 4, the row's height; the HUD's is 3). */
export const ROW_SCALE = 4;

/** The needs' names on the sheet, in the strip's order (VIEWS §7.6), and the rest of what BODY's wordsOf reports. */
export const NEED_NAMES = Object.freeze({ water: 'Thirst', food: 'Hunger', bladder: 'Bladder', bowel: 'Bowel', sleep: 'Sleep', grime: 'Hygiene', heat: 'Heat', air: 'Air', pain: 'Pain', stubble: 'Shave', stamina: 'Breath', stress: 'Nerves', morale: 'Morale', hair: 'Hair', hands: 'Hands', haircut: 'Haircut' });
/** What a need at its first band feels like where BODY's band has no words (nothing to feel: my calls). */
export const FINE_WORDS = Object.freeze({ water: 'Not thirsty.', bladder: 'Nothing pressing.', bowel: 'Nothing pressing.', stamina: 'Breathing easy.' });
const nameOf = (n) => (!n ? '?' : typeof n === 'string' ? n : [n.given, n.nick ? `'${n.nick}'` : null, n.family].filter(Boolean).join(' '));

/**
 * The sheet's contents now: { name, file: [[label, value]…], strip, line, needs: [{ need, name, band, words, tone }],
 * doll: { look, sex, body, outfit } }. body: BODY's readers; ms the clock (state.clock.ms).
 */
/** Inoculation's teachers in words (SKILLS §6.8's caps: boot camp 6, the unit 10, the cadre 15, the schools 20, the training command 25; my words). */
export const TEACHER_WORDS = Object.freeze({ boot: 'as far as boot camp goes', unit: 'as far as unit training goes', cadre: 'as far as the cadre\'s courses go', school: 'as far as the schools go', itc: 'as far as the training command goes' });
/** Hardening's hover: what it is (VIEWS §8.2's words). */
export const HARDENING_ABOUT = 'How much of the noise reaches your hands. It grows with fights lived and with training under noise and bangs.';
/**
 * The Hardening row: { label, value, title, word, H } or null. supp: { hardParts(state, pid, ms), hardWord(H), inocOf(state, pid) }
 * (supp.js's readers, from main.js). The value is words alone but the inoculation's count; the number is the hover's.
 */
export function hardeningRow(state, pid, ms, supp = null) {
  if (!supp?.hardParts || !supp?.hardWord) return null;
  let parts = null, inoc = null;
  try { parts = supp.hardParts(state, pid, ms); inoc = supp.inocOf ? supp.inocOf(state, pid) : null; } catch { return null; }
  if (!parts || !Number.isFinite(parts.H)) return null;
  const word = supp.hardWord(parts.H), toll = (parts.toll ?? []).filter(t => Number(t.v) > 0);
  const taught = inoc && Number.isFinite(inoc.pts) ? `inoculation ${inoc.pts} of ${inoc.cap ?? '?'}${TEACHER_WORDS[inoc.teacher] ? `: ${TEACHER_WORDS[inoc.teacher]}` : ''}` : null;
  const value = [word, taught, toll.length ? 'frayed: the noise reaches you more today' : null].filter(Boolean).join(' · ');
  const sign = (v) => (v < 0 ? `−${-v}` : `+${v}`);
  const title = `Hardening ${Math.round(parts.H)}: experience ${Math.round(parts.exp ?? 0)}, training ${Math.round(parts.inoc ?? 0)}${parts.axis ? `, nerve ${sign(Math.round(parts.axis))}` : ''}${toll.length ? `, ${toll.map(t => `${t.why} −${Math.round(t.v)}`).join(', ')}` : ''}. ${HARDENING_ABOUT}`;
  return { label: 'Hardening', value, title, word, H: parts.H };
}
/** The skills the file shows where the sheet is written (the range's two). */
export const SHEET_SKILLS = Object.freeze(['marksmanship', 'weapons']);

export function sheetOf(state, { body = {}, ms = state?.clock?.ms ?? 0, lonEDeg, look = null, supp = null } = {}) {
  const pid = playerId(state), p = state?.people?.[pid] ?? null, svc = p?.service ?? {};
  const rec = body.bodyOf ? body.bodyOf(state, pid) : null;
  // (the site's longitude, for the body clock: the caller's (main.js lonAt), never a default; BODY's readers throw without it)
  const strip = rec && body.stripOf ? body.stripOf(rec, ms, lonEDeg) : [];
  const words = rec && body.wordsOf ? body.wordsOf(rec, ms, lonEDeg) : { line: '', needs: [] };
  const stages = rec && body.stagesOf ? body.stagesOf(rec, ms, lonEDeg) : null;
  const cues = rec && body.cuesOf ? body.cuesOf(rec, ms, lonEDeg) : null;
  const byNeed = new Map((words?.needs ?? []).map(n => [n.need, n]));
  const tones = new Map((strip ?? []).map(e => [e.need, e.tone]));
  const order = (n) => { const i = STRIP_ORDER.indexOf(n); return i < 0 ? 99 : i; };
  // (BODY's words know the body, not the haircut: a shaved head is wet, not its hair)
  const shaved = (look ?? p?.look)?.hair?.style === 'shaved', said = (t) => (shaved && t ? t.replace(/Hair wet\./g, 'Head wet.') : t);
  const needs = [...byNeed.values()].sort((a, b) => order(a.need) - order(b.need))
    .map(n => ({ need: n.need, name: shaved && n.need === 'hair' ? 'Head' : NEED_NAMES[n.need] ?? n.need, band: n.band ?? null, words: said(n.words || FINE_WORDS[n.need] || ''), tone: tones.get(n.need) ?? n.tone ?? 'fine' }));
  // (the haircut, from the hair's one helper: the cut and how it has grown, or when it is due)
  const hair = body.hairOf ? body.hairOf(state, pid, ms) : null;
  if (hair?.band) needs.push({ need: 'haircut', name: NEED_NAMES.haircut, band: hair.band.id, words: haircutWords(hair), tone: hair.band.tone ?? 'fine', title: hair.word ?? null });
  const billet = svc.unitId && svc.billet ? billetDef(svc.unitId, svc.billet) : null;
  const enlisted = Number.isFinite(svc.enlistedMs) ? Math.max(0, ms - svc.enlistedMs) : null;
  const file = [
    ['Name', nameOf(p?.name)],
    ['Rank', svc.rank ? `${RANKS[svc.rank]?.title ?? svc.rank} (${svc.grade ?? RANKS[svc.rank]?.grade ?? '?'})` : '?'],
    ['MOS', svc.mos ?? '?'],
    ['Unit', svc.unitId ? `${unitName(svc.unitId)}, ${COMPANY.name}` : '?'],
    ['Billet', billet?.what ?? svc.billet ?? '?'],
    ['Rack', p?.berthId ? rackName(p.berthId) : 'none'],
    ['In service', enlisted !== null ? (enlisted >= 60 * DAY_MS ? `${Math.round(enlisted / (30.44 * DAY_MS))} months` : durationText(enlisted)) : '?'],
    // (the skills a scene rolls on, where the sheet is written (the range's): every roll uses them, and nowhere but J's
    // sums showed them (the design review's); the value with its trained level)
    ...(p?.skills ? SHEET_SKILLS.map(k => [SKILLS[k].name, `${valueOf(state, pid, k)} · ${levelOf(p.skills.skills?.[k]?.[0] ?? 0)}`]) : []),
  ];
  // (0.0.9: Hardening under the skills, in words; its number on the hover)
  const hard = p?.skills ? hardeningRow(state, pid, ms, supp) : null;
  if (hard) file.push([hard.label, hard.value, hard.title]);
  const me = state ? playerActor(state) : null;
  // (0.0.7: the wounds in BODY's words, none when unhurt; numbers never shown)
  let wounds = [];
  try { wounds = rec && body.woundWords ? (body.woundWords(rec, ms) ?? []).filter(Boolean).map(String) : []; } catch { wounds = []; }
  return {
    name: nameOf(p?.name), file, strip: strip ?? [], line: said(words?.line ?? ''), needs, stages, wounds,
    doll: { look: look ?? p?.look ?? null, sex: p?.sex ?? 'm', body: cues, outfit: me?.outfit ?? 'utilities' },
  };
}

/** The Haircut row's words from hairOf's record: 'High and tight · growing out' while fresh or growing, the band's own once due ('Haircut due Thursday.', 'Out of regulation.'). */
export function haircutWords(hair) {
  const cut = hair?.word ? `${hair.word[0].toUpperCase()}${hair.word.slice(1)}` : 'Your cut', words = String(hair?.band?.words ?? '');
  if ((hair?.band?.i ?? 0) >= 2) return words;
  return `${cut} · ${words.replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase())}`;
}

// ('f:e1:bay-2-1:rack-n1#2' → 'bay 2-1, rack n1, lower berth')
function rackName(berthId) {
  const m = /:([a-z0-9-]+):rack-([a-z0-9]+)#(\d+)$/.exec(berthId);
  if (!m) return berthId;
  const bay = m[1].replace(/^bay-/, 'bay ');
  return `${bay}, rack ${m[2]}, ${m[3] === '2' ? 'lower' : 'upper'} berth`;
}

/** The card's body (a glass of three columns). dollOf(args) → a Pixmap (the stage's doll()), or null; scale its CSS pixels a doll pixel at --ui 1 (2: the shot at 1 read too small). */
export function sheetCard(sheet, { dollOf = null, scale = 2 } = {}) {
  const doc = globalThis.document;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined)); return n; };
  // (the doll: its pixels straight onto a canvas, shown at whole-pixel scale)
  let figure = null;
  if (dollOf) {
    try {
      const pm = dollOf(sheet.doll);
      if (pm?.data) {
        const c = el('canvas', { className: 'doll' });
        c.width = pm.w; c.height = pm.h;
        c.style.width = `calc(${pm.w * scale}px * var(--ui))`;
        c.style.height = `calc(${pm.h * scale}px * var(--ui))`;
        const g = c.getContext('2d');
        if (g) g.putImageData(new ImageData(new Uint8ClampedArray(pm.data.buffer.slice(0)), pm.w, pm.h), 0, 0);
        figure = c;
      }
    } catch (e) { console.warn('PERSONNEL: the doll was not drawn', e); }
  }
  // (each glyph at the head of its need's row, in the strip's order; then the needs no glyph shows)
  const byNeed = new Map(sheet.needs.map(n => [n.need, n]));
  const row = (n, glyph) => el('div', { className: `need ${n.tone}`, title: n.title ?? (n.band ? `${n.name}: ${n.band}` : n.name) },
    glyph ?? el('span', { className: 'g' }), el('span', { className: 'k', textContent: n.name }), el('span', { className: 'v', textContent: n.words || n.band || '' }));
  const rows = [
    ...sheet.strip.map(e => { const n = byNeed.get(e.need) ?? { need: e.need, name: NEED_NAMES[e.need] ?? e.need, band: e.band ?? null, words: e.words ?? '', tone: e.tone ?? 'fine' }; return row(n, entryEl({ ...e, words: n.words || e.words }, ROW_SCALE)); }),
    ...sheet.needs.filter(n => !sheet.strip.some(e => e.need === n.need)).map(n => row(n, null)),
  ];
  const needs = el('div', { className: 'needs' }, ...rows);
  const file = el('div', { className: 'keylist file' }, ...sheet.file.flatMap(([k, v, title]) => [el('span', { className: 'k', textContent: k, ...(title ? { title } : {}) }), el('span', { className: `v${title ? ' hover' : ''}`, textContent: v, ...(title ? { title } : {}) })]));
  return el('div', { className: 'glass sheetcard' },
    el('h3', { textContent: 'Personnel' }),
    el('div', { className: 'cols' },
      el('div', { className: 'col dollcol' }, figure ?? el('p', { className: 'note', textContent: 'No figure to draw.' })),
      el('div', { className: 'col onyou' }, el('h4', { textContent: 'On you' }), sheet.line ? el('p', { className: 'feel', textContent: sheet.line }) : null,
        ...(sheet.wounds ?? []).map(w => el('p', { className: 'wound', textContent: w })), needs),
      el('div', { className: 'col thefile' }, el('h4', { textContent: 'The file' }), file)),
    el('p', { className: 'note', textContent: 'What you feel, not what a meter says. C or Esc to close.' }));
}
