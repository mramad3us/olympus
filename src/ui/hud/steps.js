// OLYMPUS hud: the step panel of stop motion, in the STEPS rectangle, the weapon card at its left (VIEWS §4.4, §7.4, §10.2; the build sheet 0.0.5 §2.4).
//
// Tradecraft's numbered steps, each with its key and its time (docs/research/tradecraft-art-render.md:
// "1 draw SIG · 1.4 s; 2 aim at the man in the grey coat · 0.9 s"), the pattern the user approved, laid
// out in OLYMPUS's reserved rectangle (layout.js STEPS, 720 × 148 at --ui 1, on INSTINCT): the weapon
// card (CARD_W × CARD_H, 180 × 148) at its left, the steps in two columns of five to its right.
//
// The steps are the shot role's stepsOf(state) (TECH §2.6's options(): Fire, Aim, Hold, the Corps'
// commands with the tower's current first, the singles canDo() allows from the gun's believed state,
// stance, posture, Wait), each { id, kind, label, ms, rushMs, carefulMs, odds, routine, off, subs, cmd,
// skill }. panelOf(steps, { page }) numbers them: 1 to 9 then 0 while ten or fewer; past ten, 1 to 9
// hold Fire, Aim, Hold and the commands, then a page of the rest, and 0 is "more", paging the singles
// (the sheet's "past nine, 0 is more"). A row reads "3 LOAD · 2.4 s" (the step's own label and its time
// at the normal tempo), its odds where they matter ("85%", or "routine" for a roll the trained never
// miss: SKILLS §5.1), a command's sub-steps as dots, struck through with its reason when off ("1 fire ·
// 0.4 s (on safe)"); the tower's current command is marked (a brass edge, its "◉"); Shift held shows the
// rushed times (where a step can be rushed), and hovering a row its rushed and careful times and what
// it rolls. The keys (main.js, the build sheet §8 item 15): a digit tapped is the step at its normal
// tempo, with Shift rushed, held careful; Fire held is hold and fire.
//
// While a step runs (stopNow's phase 'act') the panel shows it alone, the running view: its name and
// tempo, its sub-steps with their words as glyph ticks filling as they are rolled (✓ passed, ◦ routine,
// ✗ fumbled, · still to come), from the 'step' facts (createTicks), and a bar of its time gone on the
// game clock (the sub-steps done and the share of the one running), so stop motion freezes it as it
// freezes the picture; during Fire's recovery 1 again is the tap (a follow-up at the same aim). The step
// is the one the panel last listed under its id (it leaves stepsOf's list as it changes the gun: LOAD
// once the magazine is in). A chained wait (a step that completed the tower's command runs on to the
// next: the sheet's §8 item 16) keeps the panel, any step chosen cutting it, its row "waiting for the tower".
//
// While a reflex card waits the panel is its weapon card alone (cardOnly), the reflex card beside it in the rest of
// STEPS (main.js), so the believed state stays in sight at the moment of diagnosis.
//
// The weapon card (VIEWS §4.4) is the gun as its holder believes it, never the truth they do not know
// (WEAPONS §4.2; the sheet's §8 item 27): its picture is the stage's paintWeaponCard({ model, belief })
// (src/art/weaponcard.js: the selector's marks, the window's rounds, the port's glint, its "?" and "!"),
// and its words weaponCardModel(belief) (the card's hover, and its caption only where the picture could
// not be painted), both fed beliefOf(state, gunId) alone (arms' "the only view the HUD reads"), so
// nothing here can read a truth field: SAFE or SEMI, the
// chamber as believed (a round, empty, "?" never checked, a dud or a case once seen), the magazine's
// count as known ("3", "≈3" under Weapon handling 15, "?" uncounted, OUT), the bolt locked, a stoppage
// once felt (CLICK, DEAD, FELT; CASE and DOUBLE once looked at). The ui-weaponcard test feeds a belief
// whose truth differs and reads the belief in every glyph.
import { CARD_W, CARD_H } from './layout.js';

/** A struck row chosen lights this long (ms). */
export const FLASH_MS = 220;

/** The digits, in the panel's order: two columns of five. */
export const PANEL_KEYS = Object.freeze(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
/** The kinds that stay on every page: the shot and the tower's commands (the rest page under 0). */
export const FIXED_KINDS = Object.freeze(['fire', 'aim', 'hold', 'command']);

/**
 * The panel's slots: { slots: [{ key: '1', digit: 1, step }], more: { key: '0', page, pages } | null, page, pages }.
 * Ten steps or fewer take 1 to 9 and 0; more, and 1 to 9 hold the fixed kinds then a page of the rest, 0 pages.
 */
export function panelOf(steps = [], { page = 0 } = {}) {
  const list = steps ?? [];
  if (list.length <= PANEL_KEYS.length) return { slots: list.map((step, i) => ({ key: PANEL_KEYS[i], digit: Number(PANEL_KEYS[i]), step })), more: null, page: 0, pages: 1 };
  const fixed = list.filter(s => FIXED_KINDS.includes(s.kind)), rest = list.filter(s => !FIXED_KINDS.includes(s.kind));
  const per = Math.max(1, 9 - fixed.length), pages = Math.max(1, Math.ceil(rest.length / per)), p = ((page % pages) + pages) % pages;
  const shown = [...fixed, ...rest.slice(p * per, p * per + per)].slice(0, 9);
  return { slots: shown.map((step, i) => ({ key: PANEL_KEYS[i], digit: i + 1, step })), more: { key: '0', digit: 0, page: p, pages }, page: p, pages };
}

const secs = (ms) => (Number.isFinite(ms) ? `${(Math.max(0, ms) / 1000).toFixed(1)} s` : '');
/** A step's odds as the row says them: 'routine', '85%', or '' where no roll is in doubt. */
export function oddsText(step) {
  if (!step) return '';
  if (step.routine) return 'routine';
  return Number.isFinite(step.odds) && step.odds < 1 ? `${Math.round(step.odds * 100)}%` : '';
}
/** Which time a row shows: rushed while Shift is held (where it can be rushed), else the normal one. */
export const shownMs = (step, { shift = false } = {}) => (shift && Number.isFinite(step?.rushMs) ? step.rushMs : step?.ms);
/** A row as one plain line: '3 LOAD · 2.4 s · routine', '1 fire · 0.4 s (on safe)'. */
export function rowText(slot, opts = {}) {
  const s = slot.step, t = secs(shownMs(s, opts)), odds = oddsText(s);
  return `${slot.key} ${s.label}${t ? ` · ${t}` : ''}${odds && !s.off ? ` · ${odds}` : ''}${s.off ? ` (${s.off})` : ''}`;
}
/** A row's hover words: what it rolls, and its rushed and careful times where it has them. */
export function rowTitle(step, { label = (a) => a } = {}) {
  if (!step) return '';
  const bits = [];
  if (step.skill) bits.push(`rolls ${step.skill}`);
  if (Number.isFinite(step.rushMs)) bits.push(`${label('run')} + digit: rushed, ${secs(step.rushMs)} (−3, never routine)`);
  if (Number.isFinite(step.carefulMs)) bits.push(`held: careful, ${secs(step.carefulMs)} (+2)`);
  if (step.kind === 'fire') bits.push('held: hold the aim to +4, then fire');
  if (step.subs?.length) bits.push(step.subs.map(x => `${x.label ?? x.id}${Number.isFinite(x.ms) ? ` ${secs(x.ms)}` : ''}`).join(', '));
  if (step.off) bits.push(`not now: ${step.off}`);
  return bits.join(' · ');
}

// ---- the ticks of a running macro, from the 'step' facts ----
/** A sub-step's mark: ✓ passed, ◦ routine, ✗ fumbled (a failure, or a routine natural 1's slowed miss). */
export function markOf(f) {
  if (!f || f.ok === undefined || f.ok === null) return null;
  if (!f.ok || f.grade === 'miss' || f.grade === 'bad' || f.grade === 'disaster') return '✗';
  return f.routine ? '◦' : '✓';
}
/** The running step's ticks: { fact(payload) (a 'step' fact: 'start' begins a step, each 'sub' and 'halt' marks its i), of(stepId, n) → ['✓', '◦', '·'…], last }. */
export function createTicks() {
  let cur = null;
  return {
    fact(f) {
      if (!f) return;
      if (f.phase === 'start' || !cur || cur.step !== f.step || cur.who !== f.who) cur = { step: f.step, who: f.who, marks: [], halted: false, ended: false };
      // (a sub-step's own roll, as it is rolled, and the one that halted the rest; the step's start and end carry none)
      const m = f.phase === 'sub' || f.phase === 'halt' ? markOf(f) : null;
      if (m && Number.isInteger(f.i)) cur.marks[f.i] = m;
      if (f.phase === 'halt') cur.halted = true;
      if (f.phase === 'end' || f.phase === 'cut') cur.ended = true;
    },
    of(stepId, n) {
      const marks = cur && cur.step === stepId ? cur.marks : [];
      return Array.from({ length: Math.max(n, marks.length) }, (_, i) => marks[i] ?? '·');
    },
    get last() { return cur; },
    reset() { cur = null; },
  };
}

// ---- the weapon card: the belief, never the truth ----
const MODE_WORD = Object.freeze({ safe: 'SAFE', semi: 'SEMI', auto: 'AUTO', burst: 'BURST' });
const CHAMBER_WORD = Object.freeze({ live: 'ROUND', empty: 'EMPTY', '?': '?', dud: 'DUD', case: 'CASE' });
const STOPPAGE_WORD = Object.freeze({ click: 'CLICK', dead: 'DEAD', felt: 'FELT', case: 'CASE', double: 'DOUBLE' });
/** The keys of beliefOf's record the card reads: nothing else is ever read from it. */
export const BELIEF_FIELDS = Object.freeze(['model', 'short', 'chamber', 'mag', 'magFam', 'count', 'countApprox', 'mode', 'locked', 'port', 'stoppage', 'condWord', 'cocked']);
/**
 * The card's caption from a belief (beliefOf's record): { short, mode, chamber, count, locked, port, stoppage,
 * cond, line ('SAFE · ROUND + 3'), words (the hover's plain sentence) }. Pure; reads only BELIEF_FIELDS.
 */
export function weaponCardModel(belief) {
  const b = {};
  for (const k of BELIEF_FIELDS) b[k] = belief?.[k];
  const mode = MODE_WORD[b.mode] ?? (b.mode ? String(b.mode).toUpperCase() : '?');
  const chamber = CHAMBER_WORD[b.chamber] ?? '?';
  const count = b.mag === 'out' ? 'OUT' : b.count === null || b.count === undefined || b.count === '?' ? '?' : b.countApprox ? `≈${b.count}` : String(b.count);
  const stoppage = b.stoppage ? STOPPAGE_WORD[b.stoppage] ?? String(b.stoppage).toUpperCase() : null;
  const roundIn = b.chamber === 'live' ? '1' : b.chamber === 'empty' ? '0' : b.chamber === '?' ? '?' : chamber;
  const line = [mode, `${roundIn} + ${count}`, b.locked ? 'LOCKED' : null, stoppage].filter(Boolean).join(' · ');
  const chamberWords = { live: 'a round in the chamber', empty: 'the chamber empty', '?': "the chamber: you haven't checked", dud: 'a dud in the chamber', case: 'a case caught in the port' }[b.chamber] ?? 'the chamber: unknown';
  const magWords = b.mag === 'out' ? 'no magazine' : count === '?' ? 'a magazine, uncounted' : `${b.countApprox ? 'about ' : ''}${b.count} in the magazine`;
  const words = `${b.short ?? 'The rifle'}: ${chamberWords}, ${magWords}, ${b.mode === 'safe' ? 'on safe' : `on ${b.mode ?? '?'}`}${b.locked ? ', the bolt locked back' : ''}${stoppage ? `; ${stoppage.toLowerCase()}` : ''}${b.condWord && b.condWord !== 'fine' ? `; ${b.condWord}` : ''}.`;
  return { short: b.short ?? null, model: b.model ?? null, mode, chamber, count, locked: !!b.locked, port: b.port ?? null, stoppage, cond: b.condWord ?? null, line, words };
}

/** Pixels onto a canvas: a Pixmap-like { w, h, data | px } (a Uint32Array in ImageData's order, or RGBA bytes). */
export function putPixels(canvas, pm) {
  const raw = pm?.data ?? pm?.px;
  if (!raw || !pm.w || !pm.h) return false;
  canvas.width = pm.w; canvas.height = pm.h;
  const g = canvas.getContext('2d');
  if (!g) return false;
  const bytes = raw instanceof Uint8ClampedArray ? raw : new Uint8ClampedArray(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  g.putImageData(new ImageData(bytes, pm.w, pm.h), 0, 0);
  // (a card pixel a CSS pixel at --ui 1, as the doll is drawn: VIEWS §4.1's density; the panel sets an integer scale)
  if (!canvas.style.width) { canvas.style.width = `calc(${pm.w}px * var(--ui))`; canvas.style.height = `calc(${pm.h}px * var(--ui))`; }
  return true;
}
/**
 * The weapon card's CSS pixels a card pixel: a whole number of device pixels, the largest at or under the --ui
 * scale (at least one), so its pixel letters keep every column (the runtime review's: at 1.244 they ran uneven,
 * shrunk to 0.84 they dropped columns, "SEMI" reading "<-NT"); a card larger than its box is cropped by it, centred.
 */
export const cardScale = (ui = 1, dpr = 1) => Math.max(1, Math.floor(ui * dpr + 1e-6)) / dpr;

/**
 * The panel in parent: { el, update(view) → its text, text, slots, stepFor(n) }. view: { phase ('choose' | 'act'),
 * steps (stepsOf), page, shift (Shift held), doing (stopNow's), nowMs, belief (beliefOf's record), ticks
 * (createTicks()), hidden }. paintCard(belief) → the card's pixels (the stage's paintWeaponCard), or null;
 * onPick(step) a row clicked (main.js sends it as a tapped digit would); labelOf(actionId) an action's words
 * (shooting.js LABELS), for the running step's sub-steps.
 */
export function createSteps(parent, { label = (a) => a, paintCard = null, onPick = null, labelOf = (id) => id } = {}) {
  const doc = globalThis.document;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined && k !== false)); return n; };
  const root = el('div', { className: 'steps', hidden: true });
  const cardBox = el('div', { className: 'wcard' }), cardCanvas = el('canvas', { className: 'wcard-pic' }), caption = el('div', { className: 'wcard-cap' });
  cardBox.style.setProperty('--card-w', String(CARD_W)); cardBox.style.setProperty('--card-h', String(CARD_H));
  cardBox.append(cardCanvas, caption);
  const list = el('div', { className: 'steplist' });
  root.append(cardBox, list);
  parent.append(root);
  let sigRows = null, sigCard = null, slots = [], rowsEls = [], bar = null, text = '', cardK = null;
  // (every step the panel has shown, by id: the one running leaves stepsOf's list as it changes the gun, LOAD once the magazine is in)
  const known = new Map();

  function update(v = {}) {
    if (v.hidden || !v.steps) { root.hidden = true; text = ''; return ''; }
    root.hidden = false;
    // (the card: repainted only when the belief it shows changes; its size at a whole number of device pixels)
    const k = cardScale(v.ui ?? 1, globalThis.devicePixelRatio || 1);
    if (k !== cardK) { cardK = k; cardCanvas.style.width = `${CARD_W * k}px`; cardCanvas.style.height = `${CARD_H * k}px`; }
    const model = weaponCardModel(v.belief);
    const cs = JSON.stringify(BELIEF_FIELDS.map(k => v.belief?.[k]));
    if (cs !== sigCard) {
      sigCard = cs;
      let drawn = false;
      try { drawn = !!paintCard && putPixels(cardCanvas, paintCard(v.belief)); } catch (e) { console.warn('the weapon card was not painted', e); }
      cardCanvas.hidden = !drawn;
      // (the card's picture says it all, its marks and its count included; the words only stand in when it can't be painted)
      caption.hidden = drawn;
      caption.replaceChildren(...[el('span', { className: `wc-mode ${model.mode === 'SAFE' ? 'safe' : 'live'}`, textContent: model.mode }),
        el('span', { className: `wc-rounds${model.chamber === '?' || model.count === '?' ? ' unknown' : ''}`, textContent: model.line.split(' · ')[1] ?? '' }),
        model.locked ? el('span', { className: 'wc-locked', textContent: 'LOCKED' }) : null,
        model.stoppage ? el('span', { className: 'wc-stop', textContent: model.stoppage }) : null].filter(Boolean));
      cardBox.title = model.words;
      cardBox.dataset.text = model.line;
    }
    // (a reflex card waiting: the weapon card alone, at its place at the left, the card in the rest of STEPS beside it,
    // so what you believe of the rifle stays in sight while you decide (the design review's: the card hid it))
    root.classList.toggle('cardonly', !!v.cardOnly);
    if (v.cardOnly) { if (sigRows !== 'cardonly') { list.replaceChildren(); sigRows = 'cardonly'; slots = []; rowsEls = []; } text = model.line; return text; }
    for (const st of v.steps) known.set(st.id, st);
    while (known.size > 64) known.delete(known.keys().next().value);
    const doing = v.phase === 'act' ? v.doing ?? null : null;
    // (a step running, the chained wait apart (any step chosen cuts it, so its panel stays): the running view)
    if (doing && doing.kind !== 'wait') return running(v, doing, model);
    const panel = panelOf(v.steps, { page: v.page ?? 0 });
    slots = panel.slots;
    const rs = JSON.stringify(['panel', !!v.shift, panel.page, panel.pages, doing?.step ?? null, doing?.chain ?? null, panel.slots.map(s => [s.key, s.step.id, s.step.label, s.step.ms, s.step.rushMs, s.step.odds, s.step.routine, s.step.off, s.step.cmd, s.step.subs?.length ?? 0])]);
    if (rs !== sigRows) {
      sigRows = rs;
      bar = null;
      rowsEls = panel.slots.map(slot => row(slot, v, doing));
      if (panel.more) rowsEls.push(el('div', { className: 'step more' }, el('kbd', { textContent: '0' }), el('span', { className: 'label', textContent: `more · ${panel.page + 1}/${panel.pages}` })));
      list.replaceChildren(...rowsEls);
      root.classList.toggle('acting', !!doing);
      text = [model.line, ...panel.slots.map(s => rowText(s, { shift: v.shift })), panel.more ? `0 more · ${panel.page + 1}/${panel.pages}` : null].filter(Boolean).join(' | ');
    }
    if (bar && doing) bar.style.width = `${Math.round(progress(doing, v.nowMs) * 100)}%`;
    return text;
  }
  // (how far a doing has gone, 0 to 1: its sub-steps done and the share of the current one, on the game clock)
  function progress(d, nowMs) {
    const n = Math.max(1, d.list?.length ?? 1), i = Math.max(0, d.i ?? 0), from = d.subFromMs ?? d.fromMs, to = d.untilMs;
    const k = Number.isFinite(from) && Number.isFinite(to) && to > from ? Math.max(0, Math.min(1, ((nowMs ?? from) - from) / (to - from))) : 0;
    return Math.min(1, (i + k) / n);
  }
  // (the running view: the step's name and tempo, its sub-steps as ticks with their words, its time gone; Fire's recovery offers the tap on 1)
  function running(v, d, model) {
    const st = known.get(d.step) ?? { id: d.step, kind: d.kind, label: labelOf(d.step) };
    const subs = d.list ?? st.subs?.map(x => x.id) ?? [d.step], marks = v.ticks?.of(d.step, subs.length) ?? subs.map(() => '·');
    const fire = d.kind === 'fire' ? v.steps.find(x => x.id === 'fire') ?? known.get('fire') ?? null : null;
    slots = fire ? [{ key: '1', digit: 1, step: fire }] : [];
    const rs = JSON.stringify(['run', d.step, d.tempo, d.i, marks.join(''), !!fire]);
    if (rs !== sigRows) {
      sigRows = rs;
      bar = el('i', { className: 'bar' });
      const tempo = d.tempo && d.tempo !== 'normal' ? d.tempo : null;
      rowsEls = [el('div', { className: `running-view ${d.kind ?? ''}` },
        el('div', { className: 'rv-head' }, el('span', { className: 'rv-name', textContent: st.label }), tempo ? el('span', { className: `rv-tempo ${tempo}`, textContent: tempo }) : null),
        subs.length > 1 ? el('div', { className: 'rv-subs' }, ...subs.map((id, i) => el('span', { className: `rv-sub${i === d.i ? ' now' : ''}${marks[i] === '✗' ? ' bad' : ''}` }, el('b', { textContent: marks[i] }), ` ${labelOf(id)}`))) : null,
        el('span', { className: 'track' }, bar),
        fire ? el('div', { className: 'rv-tap' }, el('kbd', { textContent: '1' }), ' again in the recovery: a follow-up at the same aim') : null)];
      list.replaceChildren(...rowsEls);
      root.classList.add('acting');
      text = [model.line, `running: ${st.label}${subs.length > 1 ? ` ${subs.map((id, i) => `${marks[i]} ${labelOf(id)}`).join(', ')}` : ''}`, fire ? '1 again: a follow-up' : null].filter(Boolean).join(' | ');
    }
    bar.style.width = `${Math.round(progress(d, v.nowMs) * 100)}%`;
    return text;
  }
  // (a row: its key, its label (two lines at most), and at its right its time over its odds or its reason;
  // the chained wait's row marked as it runs, its time gone as a bar along its foot)
  function row(slot, v, doing) {
    const s = slot.step, isRunning = !!doing && doing.step === s.id, odds = oddsText(s), t = secs(shownMs(s, v));
    const lab = el('span', { className: 'label' }, el('span', { className: 'name', textContent: s.label }));
    const meta = el('span', { className: 'meta' },
      t ? el('span', { className: `time${v.shift && Number.isFinite(s.rushMs) ? ' rushed' : ''}`, textContent: t }) : null,
      s.off ? el('span', { className: 'why', textContent: s.off }) : odds ? el('span', { className: `odds${s.routine ? ' routine' : ''}`, textContent: odds }) : null);
    const kids = [el('kbd', { textContent: slot.key }), lab, meta];
    const r = el('div', { className: `step ${s.kind ?? 'single'}${s.off ? ' off' : ''}${s.cmd ? ' cmd' : ''}${isRunning ? ' running' : ''}`, title: rowTitle(s, { label }) }, ...kids);
    r.dataset.step = s.id; r.dataset.key = slot.key;
    if (onPick && !s.off) r.addEventListener('click', () => onPick(s));
    if (isRunning) {
      if (doing.chain) r.append(el('span', { className: 'wait', textContent: 'waiting for the tower' }));
      bar = el('i', { className: 'bar' });
      r.append(el('span', { className: 'track' }, bar));
    }
    return r;
  }
  return {
    el: root, update,
    get text() { return root.hidden ? '' : text; },
    /** The slots shown now: [{ key, digit, step }]. */
    get slots() { return slots; },
    /** Flash a row (a struck step chosen: its reason lit for FLASH_MS). */
    flash(id) {
      const r = rowsEls.find(x => x.dataset?.step === id);
      if (!r) return false;
      r.classList.add('refused');
      setTimeout(() => r.classList.remove('refused'), FLASH_MS);
      return true;
    },
    /** The step on a digit now (n 0 to 9), or 'more' for the pager, or null. */
    stepFor(n) {
      const key = String(n);
      const s = slots.find(x => x.key === key);
      if (s) return s.step;
      return key === '0' && rowsEls.some(r => r.classList.contains('more')) ? 'more' : null;
    },
  };
}
