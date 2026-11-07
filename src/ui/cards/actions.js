// OLYMPUS cards: the R menu, every single action at hand, checked and done one after another (VIEWS §8.10, §10.1; the build sheet 0.0.6 §2.3).
//
// The user, 2026-11-06: "long pressing R should open the menu with all the possible interractions as single
// actions, with the ability to select several actions (not pre-combined actions like you do now that make
// lists hard to read), implement pixel art menu drop downs or checkboxes for multiselections". R held
// (TAP_MS 220 ms) opens this card wherever places' handMenu(state) has a row; it replaces v0.0.4's choices
// card (cards/choose.js, gone), whose lines were bundles ("shave+wash+water").
//
// The card is one canvas of pixel art (src/ui/kit: the 3 × 5 capitals, the plates, the checkboxes, the
// drop-downs; with nothing checked a ghost tick in the cursor's box, what Enter would do: "[.]" in its words) on VIEWS §8.1's dark glass, at round(3 × --ui) CSS pixels a pixel: its title on a plate
// (handMenu's: "THE SINK"); up to ten rows, "1 ☐ WASH HANDS · 30 S", "4 ☒ BUZZ YOUR HEAD (BUZZED TODAY)" struck
// with its reason, a row with a parameter carrying its drop-down ("SLEEP [UNTIL REVEILLE ▾] · 8 H 15 MIN"); the
// cursor's row lit (it opens on R's quick action, so Enter at once does what R tapped would); the foot, the
// total and the end of what is checked (or of the cursor's row) from TIME's planChain, "TOTAL 7 MIN · DONE
// 19:53", in amber with the late's words under it when it would make you late; the keys line and a DO IT
// plate. Its keys are its own, read by KeyboardEvent.code while it is open (input.js own(): nothing reaches
// the world), and the mouse its own (kit/list.js's rules: a click on a box checks it, on a drop-down opens it,
// on an item picks it, on DO IT does it; a click outside the card closes it). Like every card it pauses the
// game (VIEWS §8.1), so its times and its end hold while it is open.
//
// What it sends (the card closes first): one row, the single as v0.0.5 sent R's choices ({ act: 'activity',
// args: { id, spotId, args, lead: true } }; the wait as time's own { act: 'activity', args: { id: 'wait' } }, a door
// as R's { act: 'hand', args: { want: 'door', target, from: 'menu' } }, the row it is whatever R tapped would do); two or
// more, one chain ({ act: 'chain', args: { spotId, steps: [{ id, args }] } }, TIME's: the steps in the menu's
// order, which is the order one does them in, one splash over the total); a plan that would make you late,
// the late card first (cards/late.js as v0.0.5; for a chain its "fit it in" is the leading whole steps that
// end in time, never a step shortened: the sheet §8 item 13), its answer added to the same input. The sounds
// (src/data/sounds.js, by code): a tick for a move, a latch for a check and a lower one for an uncheck, two
// rising notes on DO IT, a close; given to onSound(kind), main.js plays them.
//
// The pure part (the ui-menu test reads it in node from a fed handMenu and planChain): menuRows, planFor,
// footOf, sendOf, lateView, cardPixels, cardText. actionsCard() is the DOM.
import { durationText } from '../../core/clock.js';
import { ACTIVITIES } from '../../data/activities.js';
import { KIT, pixmap, blit, writeText, fitWords, rowPixels, dropPixels, labelPlatePixels, TEXT_H } from '../kit/pixels.js';
import { createList, digitOf, timeTextOf, rowNow, KEYS_LINE, KEYS_CHOICE, DO_IT } from '../kit/list.js';
import { mountPixels, pointOf, kitScale } from '../kit/mount.js';

/** A refused row's reason stays lit this long (ms, my call: the step panel's FLASH_MS doubled, a reason to read). */
export const REFUSED_MS = 450;
/** What a row is when it is not an activity at the spot: done alone, never in a chain (my call: one fixture a chain, the sheet §8 item 14). */
export const SOLO = Object.freeze(['wait', 'door', 'open', 'close', 'rise']);
const isSolo = (r) => SOLO.includes(r?.verb) || SOLO.includes(r?.id) || !!r?.args?.resume || r?.verb === 'resume';

/** The list's rows from handMenu's: the first ten, each marked solo where it is done alone. */
export function menuRows(menu) {
  return (menu?.rows ?? []).slice(0, 10).map((r, i) => ({ ...r, key: r.key ?? `${r.id ?? 'row'}#${i}`, solo: isSolo(r) }));
}

/** The values of what is chosen: [{ id, args, key, row, now }] (now: the row's values at its pick, kit/list.js rowNow). */
function valuesOf(list, chosen) {
  return chosen.map(c => { const i = list.rows.findIndex(r => r.key === c.key), row = list.rows[i]; return { ...c, row, now: rowNow(row, list.picks[c.key]) }; });
}

/**
 * The plan of what is chosen: one row its own (its length, its late, its end from nowMs), two or more TIME's
 * planChain(steps) ({ ok, why, steps, durMs, endMs, label, late }), or null with nothing chosen. planChain
 * absent (a build without TIME's chain): the sum of the rows, late unknown.
 */
export function planFor(menu, list, { planChain = null, nowMs = 0 } = {}) {
  const chosen = valuesOf(list, list.chosen());
  if (!chosen.length) return null;
  if (chosen.length === 1) {
    const { now, row } = chosen[0], durMs = Number.isFinite(now.durMs) ? now.durMs : 0;
    return { ok: true, why: null, durMs, endMs: nowMs + durMs, late: now.late ?? null, label: now.label ?? row?.words ?? null, single: true, steps: [{ id: chosen[0].id, args: chosen[0].args, durMs }] };
  }
  const steps = chosen.map(c => ({ id: c.id, args: c.args ?? {} }));
  if (typeof planChain === 'function') {
    const p = planChain(steps);
    if (p) return { ...p, single: false };
  }
  const durMs = chosen.reduce((a, c) => a + (Number.isFinite(c.now.durMs) ? c.now.durMs : 0), 0);
  return { ok: true, why: null, durMs, endMs: nowMs + durMs, late: null, label: null, single: false, steps };
}

/** The foot's words for a plan: { text: 'TOTAL 7 MIN · DONE 19:53', sub: 'LATE: THE COUNT AT YOUR RACK, 02:35' | '', late }. clockText(ms) the watch's HH:MM. */
export function footOf(plan, { clockText = (ms) => String(ms), menu = null, list = null } = {}) {
  if (!plan) {
    const v = list?.now?.(), r = list?.rows?.[list.cursor];
    return { text: v?.off ? `${r?.words ?? ''}: ${v.off}` : 'nothing chosen', sub: '', late: false };
  }
  if (!plan.ok) return { text: plan.why ?? 'not now', sub: '', late: false };
  if (!(plan.durMs > 0)) return { text: plan.label ?? menu?.title ?? '', sub: '', late: false };
  const late = !!plan.late;
  return { text: `total ${durationText(plan.durMs)} · done ${clockText(plan.endMs)}`, sub: late ? `late: ${plan.late.label ?? 'a call'}` : '', late };
}

/**
 * What the card sends for what is chosen (see the header): chosen, kit/list.js's ([{ id, args, key }]); late the
 * late card's answer ('fit' | 'accepted') or null. Returns the input action, or null with nothing chosen.
 */
export function sendOf(menu, chosen, { late = null } = {}) {
  if (!chosen?.length) return null;
  const rowOf = (c) => (menu?.rows ?? []).find(r => (r.key ?? null) === c.key) ?? (menu?.rows ?? []).find(r => r.id === c.id) ?? null;
  if (chosen.length === 1) {
    const c = chosen[0], r = rowOf(c), verb = r?.verb ?? c.id;
    // (the row it is, never what R tapped would do: R's hand drops a want that is not its offer's kind, so a door
    // row next to an activity, or the wait at a sink, went nowhere; the fixer's, 0.0.6)
    if (verb === 'door' || verb === 'open' || verb === 'close') return { act: 'hand', args: { want: 'door', target: r?.target ?? null, from: 'menu' } };
    if (verb === 'rise') return { act: 'hand', args: { want: 'rise' } };
    if (c.id === 'wait') return { act: 'activity', args: { id: 'wait', spotId: null, args: {}, ...(late ? { late } : {}) } };
    const args = { id: c.id, spotId: r?.spotId ?? menu?.spotId ?? null, args: c.args ?? {} };
    if (!c.args?.resume) args.lead = true;
    if (late) args.late = late;
    return { act: 'activity', args };
  }
  return { act: 'chain', args: { spotId: menu?.spotId ?? null, steps: chosen.map(c => ({ id: c.id, args: c.args ?? {} })), ...(late ? { late } : {}) } };
}

/**
 * The late card's view of a plan (cards/late.js's what and late): one row as v0.0.5 (its activity's least, the
 * card's "fit it in" shortening it); a chain whole, its "fit it in" the leading whole steps that end by the
 * time you must leave (fitMs their total, 0 when none does: refused), never a step shortened.
 */
export function lateView(menu, list, plan) {
  const chosen = valuesOf(list, list.chosen());
  if (!plan?.late || !chosen.length) return null;
  if (chosen.length === 1) {
    const c = chosen[0], head = String(c.now.label ?? c.row?.words ?? c.id).split(' · ')[0];
    return { what: { id: c.id, label: head, durMs: plan.durMs, min: ACTIVITIES[c.id]?.min ?? 0 }, late: plan.late };
  }
  const from = plan.steps?.[0]?.fromMs ?? (plan.endMs - plan.durMs), leave = from + (Number.isFinite(plan.late.fitMs) ? plan.late.fitMs : 0);
  let fitMs = 0;
  for (const s of plan.steps ?? []) { if (Number.isFinite(s.toMs) && s.toMs <= leave) fitMs = s.toMs - from; else break; }
  const label = chosen.map(c => c.row?.words ?? c.id).join(', ');
  return { what: { id: null, label, durMs: plan.durMs, min: 0 }, late: { ...plan.late, fitMs } };
}

/** The card's pixels for a list (its layout, kit/list.js): the title plate, the rows, the foot, the keys line and DO IT, an open drop-down over all. */
export function cardPixels(list) {
  const L = list.layout(), R = L.rects, pm = pixmap(L.w, L.h);
  if (R.title) blit(pm, labelPlatePixels(list.title, { font: '57', colour: KIT.cursor }), R.title.x, R.title.y);
  const none = list.checked.size === 0;
  list.rows.forEach((r, i) => {
    const v = list.now(i), rr = R.rows[i];
    blit(pm, rowPixels({ n: digitOf(i), checked: list.checked.has(r.key), ghost: none && i === list.cursor && !v.off, words: r.words ?? r.id, timeText: timeTextOf(v), off: v.off, late: !!v.late,
      focus: i === list.cursor, drop: R.drops[i] ? { words: v.words ?? '', w: R.drops[i].w } : null, w: rr.w, refused: list.refused === r.key, dropX: L.dropX }), rr.x, rr.y);
  });
  const f = list.foot, chosen = list.chosen().length;
  writeText(pm.px, R.foot.x + 2, R.foot.y, fitWords(f.text, R.foot.w - 2), f.late ? KIT.late : chosen ? KIT.text : KIT.dim);
  if (f.sub) writeText(pm.px, R.foot.x + 2, R.foot.y + TEXT_H + 2, fitWords(f.sub, R.foot.w - 2), KIT.late);
  writeText(pm.px, R.keys.x, R.keys.y, `${KEYS_LINE}${list.rows.some(r => r.choices?.length) ? KEYS_CHOICE : ''}`, KIT.dim);
  blit(pm, labelPlatePixels(DO_IT, { kind: chosen ? 'home' : 'way', w: R.doIt.w, padX: 5, padY: 2, colour: chosen ? null : KIT.dim }), R.doIt.x, R.doIt.y + (list.pressed('doIt') ? 1 : 0));
  if (list.open !== null) {
    const i = list.rows.findIndex(r => r.key === list.open), r = list.rows[i], d = R.drops[i];
    if (r && d) blit(pm, dropPixels({ words: list.now(i).words ?? '', open: true, focus: true, w: d.w, items: r.choices.map(c => ({ words: c.words ?? '', off: c.off ?? null })), pick: list.picks[r.key] ?? 0, itemFocus: list.itemFocus }), d.x, d.y);
  }
  return pm;
}

/** The card as plain lines (what the player reads; the tests' and a screen reader's): title, rows, foot, DO IT. */
export function cardText(list) {
  const lines = [String(list.title ?? '').toUpperCase()];
  list.rows.forEach((r, i) => {
    const v = list.now(i), box = v.off ? '[-]' : list.checked.has(r.key) ? '[x]' : !list.checked.size && i === list.cursor ? '[.]' : '[ ]', t = timeTextOf(v);
    lines.push(`${i === list.cursor ? '>' : ' '}${digitOf(i)} ${box} ${String(r.words ?? r.id).toUpperCase()}${v.words ? ` [${String(v.words).toUpperCase()} ▾]` : ''}${v.off ? ` (${String(v.off).toUpperCase()})` : t ? ` · ${t.toUpperCase()}` : ''}`);
  });
  lines.push(String(list.foot.text).toUpperCase());
  if (list.foot.sub) lines.push(String(list.foot.sub).toUpperCase());
  lines.push(DO_IT);
  return lines.join('\n');
}

/**
 * The card's DOM: { body, list, key(code, event) → whether it took the key, redraw(), destroy(), text }. menu: handMenu's;
 * planChain(steps) → TIME's plan at the menu's spot; nowMs the clock; clockText(ms) 'HH:MM'; ui the --ui scale;
 * onSend(action, { plan, late: lateView | null }) (the card closes first), onClose(), onSound(kind).
 */
export function actionsCard({ menu, planChain = null, nowMs = 0, clockText = (ms) => String(ms), ui = 1, onSend = null, onClose = null, onSound = null }) {
  const doc = globalThis.document;
  const rows = menuRows(menu);
  const quick = rows.findIndex(r => r.key === menu?.quick);
  const list = createList({ rows, cursor: quick >= 0 ? quick : 0, title: menu?.title ?? 'What you can do here' });
  const canvas = doc.createElement('canvas');
  canvas.className = 'kitcanvas';
  const said = Object.assign(doc.createElement('pre'), { className: 'kittext' });
  const body = Object.assign(doc.createElement('div'), { className: 'glass actions' });
  body.append(canvas, said);
  let pm = null, plan = null, refusedTimer = null, gone = false;

  function redraw() {
    plan = planFor(menu, list, { planChain, nowMs });
    const f = footOf(plan, { clockText, menu, list });
    list.setFoot(f.text, { late: f.late, sub: f.sub });
    pm = cardPixels(list);
    mountPixels(canvas, pm, { scale: kitScale(ui) });
    const text = cardText(list);
    said.textContent = text;
    body.dataset.text = text;
    canvas.setAttribute('aria-label', text);
  }
  function answer(r) {
    if (!r || gone) return;
    if (r.sound) onSound?.(r.sound);
    if (r.refused) { clearTimeout(refusedTimer); refusedTimer = setTimeout(() => { if (!gone && list.clearRefused()) redraw(); }, REFUSED_MS); }
    if (r.act === 'close') { onClose?.(); return; }
    if (r.act === 'do') {
      const action = sendOf(menu, list.chosen());
      if (action) onSend?.(action, { plan, late: plan?.late ? lateView(menu, list, plan) : null, chosen: list.chosen() });
      return;
    }
    if (r.changed) redraw();
  }
  const at = (e) => pointOf(canvas, e, pm);
  canvas.addEventListener('pointermove', (e) => { const p = at(e); answer(list.point(p.x, p.y, 'move')); });
  canvas.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; e.preventDefault(); const p = at(e); answer(list.point(p.x, p.y, 'down')); });
  canvas.addEventListener('pointerup', (e) => { if (e.button !== 0) return; const p = at(e); answer(list.point(p.x, p.y, 'up')); });
  // (a click outside the card closes it: the veil's, heard on the document while the card is up)
  const outside = (e) => { if (!gone && e.button === 0 && !body.contains(e.target)) { e.preventDefault(); onSound?.('close'); onClose?.(); } };
  doc.addEventListener('pointerdown', outside, true);
  redraw();
  return {
    body, list, canvas,
    /** A key going down while the card is up (input.js own()): its code, and the event for repeat. Returns true: every key is the card's. */
    key(code, e = null) { answer(list.key(code, { repeat: !!e?.repeat, shift: !!e?.shiftKey })); return true; },
    redraw,
    get text() { return said.textContent; },
    get plan() { return plan; },
    destroy() { gone = true; clearTimeout(refusedTimer); doc.removeEventListener('pointerdown', outside, true); },
  };
}
