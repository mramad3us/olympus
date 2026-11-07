// The interface's pixel kit (quick): src/ui/kit/pixels.js's pieces and src/ui/kit/list.js's list, in node (the
// build sheet 0.0.6 §5.3's ui-kit). The user, 2026-11-06: "implement pixel art menu drop downs or checkboxes for
// multiselections"; DESIGN.md's rule from it: menus are the game's own drop-downs and checkboxes, drawn in its look,
// never the browser's controls. Prints each piece's pixels as text (a checkbox unchecked, checked, struck and
// focused; a drop-down closed and open; a struck row and the cursor's row; a title plate and DO IT), one character
// a pixel, its tone's letter (# ink, p the box's paper, c the cursor's brass, s the struck grey, T the words…).
// Holds: the checkbox's tick is five ink pixels and a struck box carries a cross, never a tick; the open drop-down
// lists its items under its box, the picked one lit; the list's keys by code (Digit1 to Digit0 and the numpad,
// the arrows and KeyW, KeyS, KeyA, KeyD, Space, Enter and NumpadEnter, Escape, KeyR) and the pointer (hover, a
// click on a box, on a drop-down, on an item, on DO IT) give the changes and the sounds listed; a struck row never
// checks (its reason lit, refused); a solo row is checked alone; chosen() keeps the rows' order whatever order they
// were checked in, else the cursor's row; the card never changes size as a drop-down opens or a pick changes.
import { assert } from './helpers.mjs';
import { KIT, checkboxPixels, dropPixels, rowPixels, keyPlatePixels, labelPlatePixels, textPixels, asText, colourAt, textWidth, BOX, ROW_H } from '../src/ui/kit/pixels.js';
import { createList, hitOf, timeTextOf, digitOf, KEYS_LINE, ROWS_MAX } from '../src/ui/kit/list.js';
import { kitScale, plateScale } from '../src/ui/kit/mount.js';

const show = (title, pm) => console.log(`      ${title} (${pm.w} × ${pm.h}):\n${asText(pm).map(r => `        ${r}`).join('\n')}`);
const count = (pm, colour) => { let n = 0; for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) if (colourAt(pm, x, y) === colour) n++; return n; };
// (a sink's rows as places' handMenu gives them, and a rack's sleep with its choices)
const ROWS = [
  { key: 'wash-hands', id: 'wash-hands', verb: 'activity', words: 'wash hands', args: {}, durMs: 30_000, label: 'wash hands · 30 s' },
  { key: 'teeth', id: 'teeth', verb: 'activity', words: 'brush teeth', args: {}, durMs: 120_000, label: 'brush teeth · 2 min, done 19:33' },
  { key: 'shave', id: 'shave', verb: 'activity', words: 'shave', args: {}, durMs: 240_000, label: 'shave · 4 min, done 19:35' },
  { key: 'clip', id: 'clip', verb: 'activity', words: 'buzz your head', args: {}, durMs: 600_000, label: 'buzz your head · 10 min, done 19:41', off: 'buzzed today' },
  { key: 'wash-face', id: 'wash-face', verb: 'activity', words: 'wash face', args: {}, durMs: 60_000, label: 'wash face · 1 min, done 19:32' },
  { key: 'drink', id: 'drink', verb: 'activity', words: 'drink', args: {}, durMs: 30_000, label: 'drink · 30 s' },
  { key: 'wait', id: 'wait', verb: 'wait', words: 'wait', args: {}, durMs: 900_000, label: 'wait 15 min', solo: true },
];
const SLEEP = { key: 'sleep', id: 'sleep', verb: 'activity', words: 'sleep', pick: 0, choices: [
  { key: 'reveille', words: 'until reveille', args: { until: 'reveille' }, durMs: 29_700_000, label: 'sleep until reveille · 8 h 15 min, done 05:30' },
  { key: '1h', words: '1 h', args: { forMs: 3_600_000 }, durMs: 3_600_000, label: 'sleep 1 h · 1 h, done 22:15' },
  { key: '8h', words: '8 h', args: { forMs: 28_800_000 }, durMs: 28_800_000, label: 'sleep 8 h · 8 h, done 05:15', off: 'reveille comes first' },
] };
const NAP = { key: 'nap', id: 'nap', verb: 'activity', words: 'nap', pick: 1, choices: [20, 45, 90].map(m => ({ key: `${m}min`, words: `${m} min`, args: { min: m }, durMs: m * 60_000, label: `nap ${m} min · ${m} min, done 22:${m % 60}` })) };

export default [
  {
    name: 'the pieces in pixels: a checkbox unchecked (a grey frame round paper), checked (a five-pixel tick in ink), struck (a grey cross on a dark well, never a tick) and under the cursor (a brass frame); a drop-down closed and open (its items under it, the picked lit); a struck row and the cursor\'s; a title plate; DO IT',
    fn() {
      const boxes = [['unchecked', {}], ['checked', { checked: true }], ['struck', { off: true, checked: true }], ['the cursor\'s, checked', { focus: true, checked: true }]].map(([what, o]) => [what, checkboxPixels(o)]);
      for (const [what, pm] of boxes) show(`a checkbox, ${what}`, pm);
      const [un, ch, st, fo] = boxes.map(([, pm]) => pm);
      assert(un.w === BOX && un.h === BOX && count(un, KIT.grey) === 24 && count(un, KIT.ink) === 0 && count(ch, KIT.ink) === 5, `the tick: ${count(ch, KIT.ink)} ink pixels`);
      assert(count(st, KIT.strike) === 5 && count(st, KIT.ink) === 0 && count(st, KIT.well) === 20 && !st.checked && st.off, 'a struck box: a cross of five on a dark well, never a tick');
      assert(count(fo, KIT.cursor) === 24, 'the cursor\'s box framed in brass');
      const closed = dropPixels({ words: 'until reveille' }), open = dropPixels({ words: 'until reveille', open: true, items: SLEEP.choices.map(c => ({ words: c.words, off: c.off })), pick: 0, itemFocus: 1 });
      show('a drop-down, closed', closed);
      show('a drop-down, open (until reveille picked, 1 h under the cursor, 8 h struck)', open);
      assert(open.items.length === 3 && open.h > closed.h && open.items[0].y >= closed.h && asText(closed).join('').includes('c'), JSON.stringify(open.items));
      const struck = rowPixels({ n: '4', words: 'buzz your head', timeText: '10 min', off: 'buzzed today' }), cursor = rowPixels({ n: '1', words: 'wash hands', timeText: '30 s', focus: true, checked: true });
      show('a struck row', struck);
      show('the cursor\'s row, checked', cursor);
      assert(struck.h === ROW_H && count(struck, KIT.dim) > 20 && count(struck, KIT.strike) > 30 && struck.parts.time === null, 'the struck row: its words through, its reason after, no time');
      assert(count(cursor, KIT.cursor) >= ROW_H * 2 && cursor.parts.time > cursor.parts.words, 'the cursor\'s row: lit, a brass bar, the time right-aligned');
      show('the title plate', labelPlatePixels('The sink', { font: '57', colour: KIT.cursor }));
      show('DO IT', labelPlatePixels('DO IT', { kind: 'home', padX: 5, padY: 2 }));
      assert(textPixels('The sink', { font: '57' }).h === 7 && textPixels('wash hands').h === 5, 'the two alphabets');
    },
  },
  {
    name: 'the list by its keys, by code: 1 to 0 and the numpad check a row and move to it (one key a row), the arrows and Z S (KeyW KeyS) move and wrap, Q D (KeyA KeyD) and the arrows change a choice, Space checks (a struck row refused, nothing checked), Enter does, Esc and R close; a held key repeats only the moves',
    fn() {
      const L = createList({ rows: [...ROWS.slice(0, 6), SLEEP, NAP, ROWS[6]], title: 'The sink', cursor: 'wash-hands' });
      const seen = [];
      const k = (code, o) => { const r = L.key(code, o); seen.push(`${code}→${r.sound ?? '-'}${r.act ? `/${r.act}` : ''}${r.refused ? `(${r.refused})` : ''}`); return r; };
      assert(L.cursor === 0, 'opens on its quick row');
      const a = [k('Digit3'), k('Numpad5'), k('Digit0'), k('Digit9'), k('ArrowUp'), k('KeyW'), k('KeyS'), k('ArrowDown')];
      // (a digit checks its row and puts the cursor there (the fixer's, 0.0.6: one key a row): Digit3 the third, Numpad5 the
      // fifth, Digit0 nothing (no tenth row), Digit9 the ninth (the wait, solo: the others let go); up, up, down, down: back to it)
      assert(a[0].sound === 'check' && a[1].sound === 'check' && L.rows.length === 9 && a[2].sound === null && !a[2].changed, `the digits: ${seen.join(' ')}`);
      assert(a[3].changed && L.rows[8].key === 'wait' && L.cursor === 8 && [...L.checked].join() === 'wait', `Digit9 and the moves: cursor ${L.cursor}, checked ${[...L.checked]} after ${seen.join(' ')}`);
      assert(k('Digit9').sound === 'uncheck' && !L.checked.size, 'a digit again unchecks');
      k('ArrowDown');
      assert(L.cursor === 0, `the arrows wrap: ${L.cursor}`);
      k('ArrowUp');
      assert(L.cursor === L.rows.length - 1, 'and back');
      k('ArrowDown');
      // (a struck row: its digit refused, nothing checked, the reason lit; Space the same)
      const refused = k('Digit4'), refused2 = k('Space');
      assert(refused.refused === 'buzzed today' && refused2.refused === 'buzzed today' && !L.checked.size && L.refused === 'clip' && L.cursor === 3, JSON.stringify(refused));
      // (checked out of order, chosen in the rows' order)
      k('Digit5'); k('Digit2'); k('Digit3');
      assert([...L.checked].join() === 'wash-face,teeth,shave' && L.chosen().map(c => c.id).join() === 'teeth,shave,wash-face', `chosen ${JSON.stringify(L.chosen())}`);
      const un = k('Space');
      assert(un.sound === 'uncheck' && L.chosen().map(c => c.id).join() === 'teeth,wash-face', 'unchecked');
      // (a choice: Q D and the arrows on the sleep's row, clamped, never wrapping onto the struck 8 h unseen)
      for (let i = 0; i < 4; i++) k('KeyS');
      k('KeyD');
      assert(L.cursor === 6 && L.now().words === '1 h' && L.chosen().map(c => c.id).join() === 'teeth,wash-face', `the choice: ${L.now().words}`);
      k('ArrowRight');
      assert(L.now().words === '8 h' && L.now().off === 'reveille comes first', 'the struck choice shown with its reason');
      const sp = k('Space');
      assert(sp.refused === 'reveille comes first', 'a struck pick refused');
      k('KeyA'); k('Space');
      assert(L.chosen().map(c => `${c.id}${c.args.forMs ? `:${c.args.forMs / 3_600_000}h` : ''}`).join() === 'teeth,wash-face,sleep:1h', JSON.stringify(L.chosen()));
      // (a repeat: the moves only)
      const rep = [L.key('Space', { repeat: true }), L.key('ArrowDown', { repeat: true })];
      assert(!rep[0].changed && rep[1].changed, 'a held key repeats only the moves');
      // (Enter does what is chosen; Esc and R close)
      const go = k('Enter'), go2 = k('NumpadEnter'), esc = k('Escape'), r = k('KeyR');
      assert(go.act === 'do' && go.sound === 'confirm' && go2.act === 'do' && esc.act === 'close' && esc.sound === 'close' && r.act === 'close', JSON.stringify({ go, esc, r }));
      console.log(`      ${seen.join(' ')}`);
      console.log(`      chosen: ${L.chosen().map(c => `${c.id} ${JSON.stringify(c.args)}`).join(', ')}`);
    },
  },
  {
    name: 'Enter with nothing checked does the cursor\'s row (R\'s quick action, where the card opens); a struck cursor\'s row refused; a solo row (the wait, a door) is checked alone; a radio list holds one',
    fn() {
      const L = createList({ rows: ROWS, cursor: 'shave' });
      assert(L.chosen().map(c => c.id).join() === 'shave', 'the cursor\'s row');
      L.key('Digit4');
      const r = L.key('Enter');
      assert(!r.act && r.refused === 'buzzed today' && !L.chosen().length, JSON.stringify(r));
      L.key('Digit2'); L.key('Digit7');
      assert([...L.checked].join() === 'wait', `the wait alone: ${[...L.checked]}`);
      L.key('Digit6');
      assert([...L.checked].join() === 'drink', `and an activity lets the wait go: ${[...L.checked]}`);
      const R = createList({ rows: ROWS, multi: false });
      R.key('Digit2'); R.key('Digit3');
      assert([...R.checked].join() === 'shave', 'a radio list');
      console.log(`      the cursor's row by Enter: shave; the struck clip refused; the wait checked alone; a radio list holds ${[...R.checked]}`);
    },
  },
  {
    name: 'the pointer in kit pixels: hover moves the cursor, a click on a box or a row checks it (a struck one refused), on a drop-down opens it, on an item picks it, on DO IT does it; a click elsewhere closes an open drop-down; the card\'s size holds through it all',
    fn() {
      const L = createList({ rows: [ROWS[0], ROWS[1], ROWS[3], SLEEP, NAP], title: 'Your rack', cursor: 0 });
      L.setFoot('total 2 min · done 19:33');
      const lay0 = L.layout(), R = lay0.rects, mid = (r) => [r.x + Math.floor(r.w / 2), r.y + Math.floor(r.h / 2)];
      const click = (r) => { const [x, y] = mid(r); L.point(x, y, 'down'); return L.point(x, y, 'up'); };
      console.log(`      the card ${lay0.w} × ${lay0.h} kit pixels (${lay0.w * kitScale(1)} × ${lay0.h * kitScale(1)} CSS px at --ui 1, ${lay0.w * kitScale(1.5)} × ${lay0.h * kitScale(1.5)} at 1.5); rows at y ${R.rows.map(r => r.y).join(', ')}; the drop-downs at x ${R.drops.filter(Boolean).map(d => d.x).join(', ')}; DO IT at (${R.doIt.x}, ${R.doIt.y})`);
      assert(R.drops[3].x === R.drops[4].x, 'the drop-downs in one column');
      const hover = L.point(...mid(R.rows[1]), 'move');
      assert(hover.sound === 'move' && L.cursor === 1, 'hover');
      const c1 = click(R.boxes[1]);
      assert(c1.sound === 'check' && L.checked.has('teeth'), 'a box clicked');
      const c2 = click(R.rows[2]);
      assert(c2.refused === 'buzzed today' && !L.checked.has('clip'), 'a struck row clicked');
      const open = click(R.drops[3]);
      const lay1 = L.layout();
      assert(open.changed && L.open === 'sleep' && lay1.rects.options.length === 3 && lay1.w === lay0.w && lay1.h === lay0.h, `open: ${JSON.stringify({ open: L.open, items: lay1.rects.options.length, w: lay1.w, h: lay1.h })}`);
      assert(hitOf(lay1.rects, ...mid(lay1.rects.options[1]))?.kind === 'item', 'the items lie over the rows under them');
      L.point(...mid(lay1.rects.options[1]), 'move');
      assert(L.itemFocus === 1, 'an item hovered');
      const pick = click(lay1.rects.options[1]);
      assert(pick.sound === 'check' && L.open === null && L.now(3).words === '1 h' && L.layout().w === lay0.w, 'an item picked, the card\'s size held');
      click(R.drops[4]);
      const away = click(R.title);
      assert(away.sound === 'close' && L.open === null, 'a click elsewhere closes the drop-down');
      const done = click(R.doIt);
      assert(done.act === 'do' && done.sound === 'confirm', JSON.stringify(done));
      // (the drop-down by the keys while open: down, Enter)
      click(R.drops[4]); L.key('ArrowDown'); L.key('Enter');
      assert(L.now(4).words === '90 min' && L.open === null, `the nap by keys: ${L.now(4).words}`);
      console.log(`      hover row 2, click its box: checked; click the struck row: refused; the sleep's drop-down: 3 items, 1 h picked; outside: closed; DO IT: do; the nap's drop-down by the keys: ${L.now(4).words}`);
    },
  },
  {
    name: 'a row\'s time is its priced label\'s (the same number R\'s plate says), the digits 1 to 0, ten rows at most; the kit\'s scales whole CSS pixels at every --ui (3 × --ui a card\'s, 2 × --ui the plate\'s)',
    fn() {
      const times = [ROWS[0], ROWS[1], { label: 'sleep until reveille · 8 h 15 min, done 05:30, the count 02:35' }, { label: 'wait 15 min', durMs: 900_000 }, { label: 'open the door' }].map(timeTextOf);
      console.log(`      times: ${times.map(t => `'${t}'`).join(', ')}; digits ${Array.from({ length: 10 }, (_, i) => digitOf(i)).join(' ')}`);
      assert(times.join('|') === '30 s|2 min|8 h 15 min|15 min|', times.join('|'));
      const many = createList({ rows: Array.from({ length: 14 }, (_, i) => ({ id: `a${i}`, words: `row ${i}`, durMs: 1000 })) });
      assert(many.rows.length === ROWS_MAX && digitOf(9) === '0', 'ten rows');
      many.key('Digit0');
      assert(many.cursor === 9, 'Digit0 is the tenth');
      const scales = [0.85, 1, 1.13, 1.5].map(ui => [ui, kitScale(ui), plateScale(ui)]);
      console.log(`      --ui → card, plate CSS px a pixel: ${scales.map(([u, a, b]) => `${u} → ${a}, ${b}`).join('; ')}; the keys line '${KEYS_LINE}' ${textWidth(KEYS_LINE)} kit pixels`);
      assert(scales.every(([, a, b]) => Number.isInteger(a) && Number.isInteger(b) && a >= 2 && b >= 2) && kitScale(1) === 3 && plateScale(1) === 2, JSON.stringify(scales));
      assert(keyPlatePixels({ words: 'x' }).h === 11, 'the plate\'s height');
    },
  },
];
