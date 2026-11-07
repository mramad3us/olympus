// OLYMPUS kit: a list of single actions to check, the model of a pixel menu (VIEWS §8.10; the build sheet 0.0.6 §2.3).
//
// The user, 2026-11-06: "long pressing R should open the menu with all the possible interractions as single
// actions, with the ability to select several actions (not pre-combined actions like you do now that make
// lists hard to read), implement pixel art menu drop downs or checkboxes for multiselections". This is that
// menu's state and its rules, with no DOM and no clock, so the ui-kit test drives it by code and by point:
//   rows      places' handMenu rows ({ key, id, words, args, durMs, label, late, off, choices, pick }), ten at
//             most (the digits 1 to 0); a row with choices (how long to sleep, which cut) carries one
//             drop-down, its pick an index into them (never eight rows of sleeps: the user's "lists that read");
//             a struck row (off: "buzzed today") is shown with its reason and is never checked nor chosen;
//             a solo row (a door, the wait, a resume, getting up: not an activity at the spot) is checked alone;
//   cursor    the row the keys act on, lit; it starts on R's quick action (handMenu's quick);
//   checked   the rows to do, a set of keys; chosen() is them in the rows' order (the order one does them in,
//             not the order checked: the sheet §8 item 11), else the cursor's row, else nothing;
//   open      the row whose drop-down is open, if any, and its item under the cursor.
// key(code, { shift, repeat }) reads KeyboardEvent.code (AZERTY's top row types & é " ' unshifted, so the digits
// are read by code, and Z and S are KeyW and KeyS): Digit and Numpad 1 to 0 check that row and put the cursor
// on it (the fixer's, 0.0.6: one key a row), the
// arrows and KeyW, KeyS move it (wrapping), the left and right arrows and KeyA, KeyD change the cursor row's
// choice, Space checks or unchecks (a struck row: its reason lit, refused, nothing checked), Enter and
// NumpadEnter do what is chosen, Escape and KeyR close; with a drop-down open, up and down move in it, Enter or
// Space pick, Escape closes it alone. A key held down repeats only the moves. point(x, y, kind) is the mouse in
// the card's kit pixels ('move' hovers: the cursor follows it; 'down' then 'up' on the same piece is a click: a
// box or a row's words check it, a drop-down opens, an item is picked, DO IT is Enter). Each returns
// { changed, sound: null | 'move' | 'check' | 'uncheck' | 'confirm' | 'close', act: null | 'do' | 'close', refused }.
//
// layout() is the card's geometry in kit pixels, the title plate, the rows (each with its box and its
// drop-down, the drop-downs aligned in one column), the open drop-down's items, the foot (the card's words,
// setFoot: two lines the card's width, the total and the end, then a late's words), the keys line with DO IT
// at its right: { w, h, rects: { title, rows, boxes, drops, options, foot, doIt, keys } }; the width is the rows'
// (their longest choice's, so a pick never widens the card) and the keys line's, the foot's words cut to it,
// and the height kept for the longest drop-down's items, so the card never changes size as one opens.
// Pure.
import { ROW_H, TEXT_H, rowLayout, textWidth, dropBoxW, labelPlatePixels } from './pixels.js';
import { durationText } from '../../core/clock.js';

/** The most rows a menu shows (the digits 1 to 0). */
export const ROWS_MAX = 10;
/** The card's margin, the gap between its bands, an item's height in an open drop-down (kit pixels). */
export const PAD = 6, GAP = 5, ITEM_H = TEXT_H + 4;
/** The keys line under every menu (VIEWS §10.1's keys, by code, labelled for AZERTY where they differ). */
export const KEYS_LINE = '1-0 CHECK · Z S ↑↓ · ENTER DO · ESC';
/** And where a row has a choice (my call: the sheet's line names no key for it); Q D the AZERTY hand's, as the ? card labels them. */
export const KEYS_CHOICE = ' · Q D CHOICE';
/** DO IT's words. */
export const DO_IT = 'DO IT';
const DIGIT = /^(?:Digit|Numpad)([0-9])$/;
const UP = new Set(['ArrowUp', 'KeyW']), DOWN = new Set(['ArrowDown', 'KeyS']), LEFT = new Set(['ArrowLeft', 'KeyA']), RIGHT = new Set(['ArrowRight', 'KeyD']);
const ENTER = new Set(['Enter', 'NumpadEnter']), CLOSE = new Set(['Escape', 'KeyR']);
const none = () => ({ changed: false, sound: null, act: null, refused: null });

/** The digit a row shows: '1' to '9', then '0' for the tenth. */
export const digitOf = (i) => String((i + 1) % 10);

/** A row's values now, its pick's where it has choices: { durMs, label, late, off, args, words }. */
export function rowNow(row, pick = row?.pick ?? 0) {
  const c = Array.isArray(row?.choices) && row.choices.length ? row.choices[Math.max(0, Math.min(row.choices.length - 1, pick))] : null;
  if (!c) return { durMs: row?.durMs ?? null, label: row?.label ?? null, late: row?.late ?? null, off: row?.off ?? null, args: row?.args ?? {}, words: null };
  return { durMs: c.durMs ?? null, label: c.label ?? null, late: c.late ?? null, off: c.off ?? row.off ?? null, args: c.args ?? row.args ?? {}, words: c.words ?? null };
}

/**
 * The list (see the header). rows: handMenu's (the first ROWS_MAX); multi: several may be checked (else
 * one, as a radio); cursor: the row it starts on (a key or an index); title: the card's plate.
 */
export function createList({ rows = [], multi = true, cursor = 0, title = '' } = {}) {
  const list = (rows ?? []).slice(0, ROWS_MAX).map((r, i) => ({ ...r, key: r.key ?? `${r.id ?? 'row'}#${i}` }));
  const at = typeof cursor === 'string' ? list.findIndex(r => r.key === cursor) : cursor;
  const st = {
    rows: list, cursor: Math.max(0, Math.min(list.length - 1, Number.isInteger(at) && at >= 0 ? at : 0)),
    checked: new Set(), picks: Object.fromEntries(list.map(r => [r.key, Math.max(0, r.pick ?? 0)])),
    open: null, itemFocus: null, refused: null, pressed: null, foot: { text: '', sub: '', late: false },
  };
  let memo = null;
  const dirty = () => { memo = null; };
  const row = (i = st.cursor) => list[i] ?? null;
  const offOf = (r) => rowNow(r, st.picks[r.key]).off;

  function check(i) {
    const r = row(i);
    if (!r) return none();
    if (offOf(r)) { st.refused = r.key; dirty(); return { changed: true, sound: null, act: null, refused: offOf(r) }; }
    st.refused = null;
    if (st.checked.has(r.key)) { st.checked.delete(r.key); dirty(); return { changed: true, sound: 'uncheck', act: null, refused: null }; }
    // (a solo row is done alone, and a radio list holds one: checking it lets the others go)
    if (!multi || r.solo) st.checked.clear();
    else for (const k of [...st.checked]) if (list.find(x => x.key === k)?.solo) st.checked.delete(k);
    st.checked.add(r.key);
    dirty();
    return { changed: true, sound: 'check', act: null, refused: null };
  }
  function moveTo(i) {
    if (!list.length) return none();
    const n = ((i % list.length) + list.length) % list.length;
    if (n === st.cursor) return none();
    st.cursor = n; st.refused = null; dirty();
    return { changed: true, sound: 'move', act: null, refused: null };
  }
  function pickBy(d) {
    const r = row();
    if (!r?.choices?.length) return none();
    const p = Math.max(0, Math.min(r.choices.length - 1, (st.picks[r.key] ?? 0) + d));
    if (p === st.picks[r.key]) return none();
    st.picks[r.key] = p; st.refused = null; dirty();
    return { changed: true, sound: 'move', act: null, refused: null };
  }
  function openDrop(i) {
    const r = row(i);
    if (!r?.choices?.length) return none();
    if (st.open === r.key) return closeDrop();
    st.open = r.key; st.cursor = i; st.itemFocus = st.picks[r.key] ?? 0; dirty();
    return { changed: true, sound: 'move', act: null, refused: null };
  }
  function closeDrop() {
    if (st.open === null) return none();
    st.open = null; st.itemFocus = null; dirty();
    return { changed: true, sound: 'close', act: null, refused: null };
  }
  function pickItem(i) {
    const r = list.find(x => x.key === st.open);
    if (!r) return none();
    st.picks[r.key] = Math.max(0, Math.min(r.choices.length - 1, i));
    st.open = null; st.itemFocus = null; st.refused = null; dirty();
    return { changed: true, sound: 'check', act: null, refused: null };
  }
  function doIt() {
    const c = chosen();
    if (!c.length) {
      const r = row();
      if (r && offOf(r)) { st.refused = r.key; dirty(); return { changed: true, sound: null, act: null, refused: offOf(r) }; }
      return none();
    }
    return { changed: false, sound: 'confirm', act: 'do', refused: null };
  }
  /** The rows to do, in the rows' order: the checked, else the cursor's row; struck rows never: [{ id, args, key }]. */
  function chosen() {
    const pickOf = (r) => ({ id: r.id, args: rowNow(r, st.picks[r.key]).args ?? {}, key: r.key });
    const checked = list.filter(r => st.checked.has(r.key) && !offOf(r));
    if (checked.length) return checked.map(pickOf);
    const r = row();
    return r && !offOf(r) ? [pickOf(r)] : [];
  }

  return {
    get rows() { return list; },
    get cursor() { return st.cursor; },
    get checked() { return new Set(st.checked); },
    get picks() { return { ...st.picks }; },
    get open() { return st.open; },
    get itemFocus() { return st.itemFocus; },
    get refused() { return st.refused; },
    get foot() { return st.foot; },
    get multi() { return multi; },
    get title() { return title; },
    /** A row's values now (its pick's): rowNow. */
    now(i = st.cursor) { const r = row(i); return r ? rowNow(r, st.picks[r.key]) : null; },
    chosen,
    /** The foot's words (the card's: the total and the end; sub, the late's words under them) and whether they are said late. */
    setFoot(text, { late = false, sub = '' } = {}) {
      const f = { text: String(text ?? ''), sub: String(sub ?? ''), late: !!late };
      if (f.text !== st.foot.text || f.sub !== st.foot.sub || f.late !== st.foot.late) { st.foot = f; dirty(); }
    },
    /** Forget a refusal's lit reason (the card's, after a moment). */
    clearRefused() { if (st.refused !== null) { st.refused = null; dirty(); return true; } return false; },
    /** A key by its code (see the header). */
    key(code, { repeat = false } = {}) {
      const moves = UP.has(code) || DOWN.has(code) || LEFT.has(code) || RIGHT.has(code);
      if (repeat && !moves) return none();
      if (st.open !== null) {
        const r = list.find(x => x.key === st.open), n = r?.choices?.length ?? 0;
        if (UP.has(code) || LEFT.has(code)) { const f = Math.max(0, (st.itemFocus ?? 0) - 1); if (f === st.itemFocus) return none(); st.itemFocus = f; dirty(); return { changed: true, sound: 'move', act: null, refused: null }; }
        if (DOWN.has(code) || RIGHT.has(code)) { const f = Math.min(n - 1, (st.itemFocus ?? 0) + 1); if (f === st.itemFocus) return none(); st.itemFocus = f; dirty(); return { changed: true, sound: 'move', act: null, refused: null }; }
        if (ENTER.has(code) || code === 'Space') return pickItem(st.itemFocus ?? 0);
        if (code === 'Escape' || code === 'KeyR') return closeDrop();
        if (!DIGIT.test(code)) return none();
        closeDrop();
      }
      // (a digit checks its row and puts the cursor there, so R held, 2 3 4, Enter is the errand: two keys a row had been
      // one too many (the fixer's, 0.0.6); Space still checks the cursor's row)
      const d = DIGIT.exec(code);
      if (d) { const i = d[1] === '0' ? 9 : Number(d[1]) - 1; if (i >= list.length) return none(); st.cursor = i; return check(i); }
      if (UP.has(code)) return moveTo(st.cursor - 1);
      if (DOWN.has(code)) return moveTo(st.cursor + 1);
      if (LEFT.has(code)) return pickBy(-1);
      if (RIGHT.has(code)) return pickBy(+1);
      if (code === 'Space') return check(st.cursor);
      if (ENTER.has(code)) return doIt();
      if (CLOSE.has(code)) return { changed: false, sound: 'close', act: 'close', refused: null };
      return none();
    },
    /** The mouse at (x, y) in kit pixels: kind 'move' | 'down' | 'up' (see the header). */
    point(x, y, kind = 'move') {
      const hit = hitOf(this.layout().rects, x, y);
      if (kind === 'move') {
        if (hit?.kind === 'item') { if (hit.i === st.itemFocus) return none(); st.itemFocus = hit.i; dirty(); return { changed: true, sound: 'move', act: null, refused: null }; }
        if (st.open === null && (hit?.kind === 'row' || hit?.kind === 'box' || hit?.kind === 'drop')) return moveTo(hit.i);
        return none();
      }
      if (kind === 'down') { st.pressed = hit ? `${hit.kind}:${hit.i ?? ''}` : null; dirty(); return { changed: true, sound: null, act: null, refused: null }; }
      const was = st.pressed;
      st.pressed = null; dirty();
      if (!hit || was !== `${hit.kind}:${hit.i ?? ''}`) return st.open !== null && !hit ? closeDrop() : { changed: true, sound: null, act: null, refused: null };
      if (hit.kind === 'item') return pickItem(hit.i);
      if (st.open !== null && hit.kind !== 'drop') return closeDrop();
      if (hit.kind === 'drop') return openDrop(hit.i);
      if (hit.kind === 'box' || hit.kind === 'row') { st.cursor = hit.i; return check(hit.i); }
      if (hit.kind === 'doIt') return doIt();
      return none();
    },
    /** Whether a piece is pressed now (DO IT drawn down). */
    pressed(kind) { return st.pressed?.startsWith(`${kind}:`) ?? false; },
    /** The card's geometry in kit pixels (see the header). */
    layout() {
      if (memo) return memo;
      const titleP = title ? labelPlatePixels(title, { font: '57' }) : null;
      const rowSpecs = list.map((r) => {
        const v = rowNow(r, st.picks[r.key]);
        return { words: r.words ?? r.id ?? '', timeText: timeTextOf(v), off: v.off, drop: r.choices?.length ? { words: v.words ?? '', w: Math.max(...r.choices.map(c => dropBoxW(c.words ?? ''))) } : null };
      });
      // (the drop-downs in one column: each starts where the longest word before one ends)
      const dropX = Math.max(0, ...rowSpecs.filter(s => s.drop).map(s => rowLayout({ ...s, dropX: null }).drop));
      const lays = rowSpecs.map(s => rowLayout({ ...s, dropX: s.drop ? dropX : null }));
      // (a row's width must hold its longest choice's time and reason as well, so a pick never widens the card)
      const widest = list.map((r, i) => Math.max(lays[i].w, ...(r.choices ?? []).map(c => rowLayout({ ...rowSpecs[i], timeText: timeTextOf(c), off: c.off ?? null, dropX }).w)));
      const doItW = textWidth(DO_IT) + 2 * 5 + 2, doItH = TEXT_H + 2 * 2 + 2;
      const rowsW = Math.max(0, ...widest), keysW = textWidth(KEYS_LINE) + (list.some(r => r.choices?.length) ? textWidth(KEYS_CHOICE) : 0);
      const W = PAD * 2 + Math.max(titleP?.w ?? 0, rowsW, keysW + 8 + doItW, 120);
      let y = PAD;
      const rects = { title: null, rows: [], boxes: [], drops: [], options: [], foot: null, doIt: null, keys: null };
      if (titleP) { rects.title = { x: PAD, y, w: titleP.w, h: titleP.h }; y += titleP.h + GAP; }
      const inner = W - 2 * PAD;
      list.forEach((r, i) => {
        const ry = y + i * (ROW_H + 1), L = lays[i];
        rects.rows.push({ x: PAD, y: ry, w: inner, h: ROW_H, i, key: r.key });
        rects.boxes.push({ x: PAD + L.box - 2, y: ry, w: 7 + 4, h: ROW_H, i, key: r.key });
        rects.drops.push(rowSpecs[i].drop ? { x: PAD + L.drop, y: ry + 1, w: L.dropW, h: ROW_H - 2, i, key: r.key } : null);
      });
      const rowsEnd = y + Math.max(0, list.length * (ROW_H + 1) - 1);
      // (the foot, two lines the card's width: the total and the end, then the late's words; then the keys line and DO IT)
      y = rowsEnd + GAP;
      rects.foot = { x: PAD, y, w: inner, h: TEXT_H * 2 + 2 };
      y += TEXT_H * 2 + 2 + GAP;
      rects.doIt = { x: W - PAD - doItW, y, w: doItW, h: doItH };
      rects.keys = { x: PAD, y: y + Math.floor((doItH - TEXT_H) / 2), w: keysW, h: TEXT_H };
      y += doItH + PAD;
      // (the open drop-down's options below its box, over the rows under it)
      const openI = st.open !== null ? list.findIndex(r => r.key === st.open) : -1;
      if (openI >= 0) {
        const d = rects.drops[openI], n = list[openI].choices.length;
        for (let k = 0; k < n; k++) rects.options.push({ x: d.x, y: d.y + d.h + 1 + k * ITEM_H, w: d.w, h: ITEM_H, i: k, key: list[openI].key });
      }
      // (room kept for the longest drop-down, open or not, so the card's size holds)
      const reach = Math.max(0, ...list.map((r, i) => (rects.drops[i] ? rects.drops[i].y + rects.drops[i].h + 2 + r.choices.length * ITEM_H + PAD : 0)));
      memo = { w: W, h: Math.max(y, reach), rects, rowLays: lays, dropX };
      return memo;
    },
  };
}

/**
 * A row's time as the menu says it: its priced label's time ('wash hands · 30 s' → '30 s', 'sleep until reveille · 8 h
 * 15 min, done 05:30' → '8 h 15 min'), so the menu and R's plate say one number (CLAUDE.md: one quantity, one number on
 * every screen); a row with no price (the wait) core/clock.js durationText of its length; '' with neither (a door).
 */
export function timeTextOf({ label = null, durMs = null } = {}) {
  const m = /·\s*([^,]+)/.exec(String(label ?? ''));
  if (m) return m[1].trim();
  return Number.isFinite(durMs) && durMs > 0 ? durationText(durMs) : '';
}

/** The piece at (x, y) of a layout's rects: { kind: 'item' | 'doIt' | 'drop' | 'box' | 'row', i, key } or null (an open drop-down's items first). */
export function hitOf(rects, x, y) {
  const inside = (r) => !!r && x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
  for (const r of rects?.options ?? []) if (inside(r)) return { kind: 'item', i: r.i, key: r.key };
  if (inside(rects?.doIt)) return { kind: 'doIt', i: null, key: null };
  for (const r of rects?.drops ?? []) if (inside(r)) return { kind: 'drop', i: r.i, key: r.key };
  for (const r of rects?.boxes ?? []) if (inside(r)) return { kind: 'box', i: r.i, key: r.key };
  for (const r of rects?.rows ?? []) if (inside(r)) return { kind: 'row', i: r.i, key: r.key };
  return null;
}
