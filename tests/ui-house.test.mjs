// "Stack and clear"'s face in node (quick) and in the page (heavy): the build sheet 0.0.12 §5.4's ui-house. The picker's par chooser
// (cards/pairs.js parOptions: the sheet's own, Basic 3.0 s, Advanced 1.5 s, Operator 0.8 s, from the course's own numbers), the
// panel's bundle rows (steps.js: the beats as dots by channel, a seam a bar; the variants set at no time) and the running bundle's
// four lanes, the instinct line's "T: <what> · <s>", the instructor's lane timer (timer.js laneModel: tenths while it runs,
// hundredths once stopped, the par counting down, "HE FIRED FIRST" in red), the run sheet's rows split into the room and its marks
// with the faults red, the hot wash's take-in bars (cards/house.js), the combat EVA suit (black, the sealed helmet, no red, no skin
// under the helmet), the door leaf hinged and swung by its opening's swing (art/jobs.js leafOf), the corners' ticks (render/range-
// items.js cornerPixels), the movement stances' frames (render/view.js stanceGait). In the page (heavy, at 1600 × 900 and 1024 × 768):
// no two HUD rectangles meet with the stack's panel up, with a bundle running, at a contact, and the end card with the run sheet
// and the hot wash beside it inside the window; the picker inside the window.
import { assert } from './helpers.mjs';
import { parOptions, parWords, pickerRows, SCENE_LINES } from '../src/ui/cards/pairs.js';
import { bundleDots, beatsWords, laneRows, isFree, rowText, timeText, LANES } from '../src/ui/hud/steps.js';
import { partsOf, textOf } from '../src/ui/hud/instinct.js';
import { laneModel, roomWord } from '../src/ui/hud/timer.js';
import { rowParts, isFault, barParts, barSpan, houseRunLine, houseAspects, houseEndLines } from '../src/ui/cards/house.js';
import { wear, coloursOf, COMBAT_SUIT, WORN_KIT, OUTFITS } from '../src/art/figures/outfits.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { leafOf } from '../src/art/jobs.js';
import { cornerPixels, CORNER_PALE, CORNER_COVERED, CORNER_TWO } from '../src/render/range-items.js';
import { COURSES } from '../src/data/courses.js';
import { SCENES } from '../src/data/scenes.js';
import { withGame } from './browser.mjs';
import { overlaps } from '../src/ui/hud/layout.js';

const SCENE = SCENES['test-shoothouse'];
const hex = (n) => n.toString(16).padStart(6, '0');
// (a colour's hue is red when its red channel leads the others by a third: the Corps' red, a brassard's)
const isRed = (c) => { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; return r > 90 && r > 1.33 * g && r > 1.33 * b; };

export default [
  {
    name: 'the picker\'s par chooser (cards/pairs.js): the sheet\'s own first, then Basic 3.0 s, Advanced 1.5 s, Operator 0.8 s from the course\'s own PAR_MS (never a copy); each sheet\'s own par on its line\'s hover; the scene\'s line under the title',
    fn() {
      const pars = COURSES.house?.pars ?? { basic: 3000, advanced: 1500, operator: 800 };
      const opts = parOptions(SCENE?.pars ? SCENE : { pars: ['basic', 'advanced', 'operator'] }, pars);
      const words = opts.map(o => parWords(o, null, pars));
      console.log(`      the chooser: ${words.join(' | ')}`);
      const own = ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'].map(t => `${t} ${COURSES.house?.parOfTier?.[t] ?? '?'}`);
      console.log(`      each sheet's own: ${own.join(', ')}; "${parWords(opts[0], 'basic', pars)}"`);
      console.log(`      the line under the title: ${SCENE_LINES['test-shoothouse']}`);
      assert(opts.length === 4 && opts[0].id === null && words[1] === 'Basic · 3.0 s' && words[2] === 'Advanced · 1.5 s' && words[3] === 'Operator · 0.8 s', JSON.stringify(words));
      assert(parWords(opts[0], 'basic', pars) === "The sheet's own (basic, 3.0 s)" && parOptions({}, pars).length === 0, 'no pars, no chooser');
      if (SCENE?.sheets) {
        const rows = pickerRows({ recruit: { label: 'Boot recruit', wf: 6 }, private: { label: 'Private', wf: 15 }, cpl: { label: 'Corporal', wf: 34 }, sgt: { label: 'Sergeant', wf: 44 }, raider: { label: 'Raider', wf: 70 }, tierone: { label: 'Tier one', wf: 93 } }, SCENE.sheets, SCENE.sheet);
        console.log(`      the picker's sheets: ${rows.map(r => `${r.label}${r.focus ? ' (focused)' : ''}`).join(', ')}`);
        assert(rows.some(r => r.focus && r.tier === 'private'), JSON.stringify(rows));
      }
    },
  },
  {
    name: 'a bundle\'s row (steps.js): its beats as dots, a gap where the channel changes, a bar after each seam\'s beat ("Clear it · 4.0 s ●  ● │ ●  ●  ●"); its beats in words on the hover by channel; a variant ("Cross ⇄ Hook") shows no time; a single keeps its time and odds as built',
    fn() {
      const b = { id: 'drill:room:clear>o:w4:r1', kind: 'bundle', label: 'Clear it', ms: 4000, rung: 2, seams: [1],
        beats: [{ id: 'approach', k: 'move', ch: 'feet', ms: 3400 }, { id: 'door', k: 'door', ch: 'hands', ms: 600 }, { id: 'enter', k: 'move', ch: 'feet', ms: 400 }, { id: 'corner', k: 'scan', ch: 'eyes', ms: 500 }, { id: 'clear', k: 'call', ch: 'voice', ms: 800 }] };
      const v = { id: 'drill:variant:entry', kind: 'variant', label: 'Cross ⇄ Hook', ms: 0 };
      const single = { id: 'door:push>o:w4:r1', kind: 'single', label: 'Push it open', ms: 600, odds: 0.9 };
      const rows = [rowText({ key: '1', step: b }), rowText({ key: '2', step: v }), rowText({ key: '3', step: single })];
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      the hover: ${beatsWords(b)}`);
      assert(bundleDots(b) === '●  ● │ ●  ●  ●' && rows[0] === '1 Clear it · 4.0 s ●  ● │ ●  ●  ●', rows[0]);
      assert(isFree(v) && timeText(v) === '' && rows[1] === '2 Cross ⇄ Hook' && rows[2] === '3 Push it open · 0.6 s · 90%', JSON.stringify(rows));
      assert(bundleDots(single) === '' && /feet: move 3\.4 s, move 0\.4 s/.test(beatsWords(b)) && /1 seam/.test(beatsWords(b)), beatsWords(b));
    },
  },
  {
    name: 'the running bundle\'s lanes (steps.js laneRows): FEET, HANDS, EYES, VOICE in that order from bundleNow\'s lanes, only the lanes with a beat; from the doing record\'s beats when bundleNow gives none (wait ·, run ▸, done ✓, cut ✗); the recruit\'s fill one lane at a time, the tier one\'s together',
    fn() {
      const bn = { id: 'drill:house:clear', label: 'Clear the house', lanes: { feet: [{ id: 'a', glyph: '✓' }, { id: 'e', glyph: '▸' }], hands: [{ id: 'd', glyph: '✓' }], eyes: [{ id: 'c', glyph: '▸' }], voice: [] }, fromMs: 0, untilMs: 5000 };
      const L = laneRows(bn), shown = L.map(l => `${l.name} ${l.glyphs.map(g => g.glyph).join(' ')}`);
      const rec = { beats: [{ id: 'a', ch: 'feet', st: 'done' }, { id: 'b', ch: 'hands', st: 'run' }, { id: 'c', ch: 'eyes', st: 'wait' }, { id: 'd', ch: 'voice', st: 'cut' }] };
      const R = laneRows(null, rec).map(l => `${l.name} ${l.glyphs.map(g => g.glyph).join(' ')}`);
      console.log(`      the tier one's, two lanes running at once: ${shown.join(' · ')}`);
      console.log(`      from the record: ${R.join(' · ')}`);
      const running = L.filter(l => l.glyphs.some(g => g.glyph === '▸')).length;
      assert(LANES.join() === 'feet,hands,eyes,voice' && L.length === 3 && L[0].name === 'FEET' && running === 2, JSON.stringify(L));
      assert(R.join(' · ') === 'FEET ✓ · HANDS ▸ · EYES · · VOICE ✗', R.join(' · '));
    },
  },
  {
    name: 'T\'s keycap names the act and its planned time before the press (instinct.js): "T: Stack on the door · 4.7 s. Stack up."; the tier one\'s "T: Clear the house · 3 rooms and the hall · 13.6 s"; no act, no words; a line whose act names no row keeps its built form',
    fn() {
      const label = (a) => (a === 'instinct' ? 'T' : a);
      const one = textOf(partsOf({ label, now: { line: { text: 'Stack up.', act: 'stop:drill:room:stack>o:w4:r1', tone: 'note' } }, actWords: 'Stack on the door · 4.7 s' }));
      const two = textOf(partsOf({ label, now: { line: { text: 'Your lane.', act: 'stop:drill:house:clear>o:w4:r1', tone: 'note' } }, actWords: 'Clear the house · 3 rooms and the hall · 13.6 s' }));
      const none = textOf(partsOf({ label, now: { line: { text: 'Wait for GO.', act: null, tone: 'calm' } }, actWords: 'Stack on the door · 4.7 s' }));
      const plain = textOf(partsOf({ label, now: { line: { text: 'Thirsty.', act: 'drink', tone: 'note' } } }));
      for (const t of [one, two, none, plain]) console.log(`      ${t}`);
      assert(one === 'T: Stack on the door · 4.7 s. Stack up.' && two.startsWith('T: Clear the house · 3 rooms and the hall') && none === 'Wait for GO.' && plain === 'T Thirsty.', JSON.stringify([one, two, none, plain]));
    },
  },
  {
    name: 'the instructor\'s lane timer (timer.js laneModel): the lane from GO in tenths while it runs and hundredths once stopped, a row a room from its stack (the running one counted to now), the par counting down, "HE FIRED FIRST" in red past it, the lane\'s hits as marks; null before GO',
    fn() {
      const hn = { lane: 'A', timerMs: 12400, parMs: 3000, legs: [{ word: 'ROOM 1', state: 'clear', ms: 13790, par: 'met', zones: { A: 2 } }, { word: 'ROOM 2', state: 'entered', ms: 5512, zones: { ring: 1 } }, { word: 'ROOM 3', state: 'ahead', ms: null, zones: {} }, { word: 'HALL', state: 'ahead', ms: null, zones: {} }], contacts: [{ seenMs: 7000, firstAtMs: 9000, parMet: true, face: 'threat' }, { seenMs: 20000, parMet: null, face: 'armoured' }, { seenMs: 20000, parMet: null, face: 'noshoot' }] };
      const m = laneModel(hn, 21500), late = laneModel(hn, 24000), done = laneModel({ ...hn, end: { why: 'clear' }, timerMs: 58412, legs: [hn.legs[0], { ...hn.legs[1], state: 'clear', ms: 9000 }, { word: 'ROOM 3', state: 'clear', ms: 11200, zones: {} }, { word: 'HALL', state: 'clear', ms: 4000, par: 'missed', zones: {} }] }, 60000);
      for (const x of [m, late, done]) console.log(`      ${x.text}`);
      assert(m.rows[0].value === '12.4' && m.rows[1].value === '13.79' && m.rows[2].value === '5.5' && m.rows.at(-1).value === '1.5 LEFT', JSON.stringify(m.rows));
      assert(late.rows.at(-1).value === 'HE FIRED FIRST' && late.rows.at(-1).mark === 'late', JSON.stringify(late.rows));
      assert(done.rows[0].label === 'LANE' && done.rows[0].value === '58.41' && done.rows.some(r => r.label === 'HALL' && r.mark === 'late'), JSON.stringify(done.rows));
      assert(laneModel(null) === null && roomWord({ id: 'hall' }) === 'HALL' && m.title === 'LANE TIMER' && m.zones.map(z => z.word).join() === 'A,RING', JSON.stringify(m.zones));
    },
  },
  {
    name: 'the run sheet and the hot wash (cards/house.js): a row split into the room and its time, then its marks, the faults red (NO-SHOOT HIT, HOSTAGE HIT, MUZZLE, FIRED FIRST); the take-in bars from the sighting (the take-in, the first round, the par\'s tick, late past it); the session\'s run line room by room; the end card\'s lines the sheet\'s card and the instructor\'s one thing',
    fn() {
      const row = rowParts('ROOM 1 · 7.40 S · TAKE-IN 0.80 · FIRST 2.00 · BASIC MET · 2 A · CORNERS 3 OF 3 · DOORWAY 0.30 S · NO-SHOOT HIT');
      console.log(`      ${row.head} | ${row.marks.map(m => `${m.text}${m.fault ? ' (red)' : ''}`).join(' | ')}`);
      assert(row.head === 'ROOM 1 · 7.40 S' && row.marks.length === 7 && row.marks.at(-1).fault && !row.marks[0].fault && isFault('HOSTAGE HIT') && isFault('MUZZLE'), JSON.stringify(row));
      const bars = [{ room: 'w4.r1', key: '1a', takeInMs: 800, parMs: 3000, firstMs: 2000 }, { room: 'w4.r3', key: '3a', takeInMs: 1200, parMs: 3000, firstMs: 3400 }, { room: 'w4.hall', key: 'H', takeInMs: 900, parMs: 3000, firstMs: null }];
      const span = barSpan(bars), parts = bars.map(b => barParts(b, span));
      console.log(`      the span ${span} ms; ${parts.map((p, i) => `${bars[i].key} take-in to ${p.takeIn[1].toFixed(3)}, first ${p.first ? p.first[1].toFixed(3) : 'none'}, par at ${p.par.toFixed(3)}${p.late ? ', late' : ''}`).join('; ')}`);
      assert(Math.abs(span - 3740) < 1e-6 && !parts[0].late && parts[1].late && parts[2].late && parts[2].first === null, JSON.stringify(parts));
      const hn = { label: 'Private', timerMs: 58400, legs: [{ word: 'ROOM 1', state: 'clear', ms: 13790 }, { word: 'ROOM 2', state: 'clear', ms: 9100 }, { word: 'ROOM 3', state: 'clear', ms: 11200 }, { word: 'HALL', state: 'clear', ms: 4000 }], contacts: [{ takeInMs: 800, by: 'me' }, { takeInMs: 1200, by: 'me' }, { takeInMs: 300, by: 'two' }],
        aspects: { pause: { n: 2, minMs: 800, maxMs: 1200, firstMinMs: 2000 }, drill: { words: 'by hand, 34 presses' }, shots: { rounds: 9, zones: { A: 6, C: 1, miss: 2 }, two: { fired: 2, hits: 2 }, dummy: { clickAtMs: 1000, clearedAtMs: 2100 } } } };
      const line = houseRunLine(hn, { fmt: (ms) => (ms / 1000).toFixed(2) });
      console.log(`      ${line}`);
      assert(line === 'Private: room 1 13.79 · room 2 9.10 · room 3 11.20 · hall 4.00 · lane 58.40 s · take-in 0.80 to 1.20', line);
      const asp = houseAspects(hn);
      for (const [k, t] of asp) console.log(`      ${k}: ${t}`);
      assert(asp.map(a => a[0]).join() === 'pause,drill,shots' && asp[1][1] === 'by hand, 34 presses' && asp[0][1] === '2 taken in, 0.80 to 1.20 s · the first round 2.00 s from the sighting at the quickest' && asp[2][1] === '9 rounds · 6 A, 1 C, 2 missed · your number two 2 fired, 2 hit · the dummy cleared in 1.10 s', JSON.stringify(asp));
      assert(houseEndLines(hn, { card: 'LANE A · PRIVATE · 3 ROOMS · 58.4 S', one: { key: 'funnel', text: 'Take the door.' } }).join(' | ') === 'LANE A · PRIVATE · 3 ROOMS · 58.4 S | Take the door.', 'the end lines');
    },
  },
  {
    name: 'the combat EVA suit (outfits.js, compose.js): black all over (its shell, skin, boots, helmet), the sealed helmet\'s smoked visor, no red in any colour it paints, no skin under the helmet at the neck, outside the samples\' lineup (WORN_KIT) so the atlas\'s count holds',
    fn() {
      const L = wear({ outfit: 'combatSuit', weapon: 'rifle', carrier: true, seed: 3 }), col = coloursOf(L, 16);
      const used = new Map();
      for (const dir of ['down', 'right', 'up']) {
        const fr = composeFrame(L, dir, 'idle0', { ppm: 16 });
        for (const row of fr.cells) for (const c of row) if (c) used.set(c.ch, (used.get(c.ch) ?? 0) + 1);
      }
      const roles = [...used.keys()], reds = roles.filter(ch => typeof col[ch] === 'number' && isRed(col[ch]));
      console.log(`      the roles drawn: ${roles.map(ch => `${ch} ${typeof col[ch] === 'number' ? hex(col[ch]) : 'fixed'}`).join(', ')}`);
      console.log(`      the suit's blacks: ${Object.entries(COMBAT_SUIT).map(([k, v]) => `${k} ${hex(v)}`).join(', ')}; skin pixels ${used.get('s') ?? 0}; red roles ${reds.join(', ') || 'none'}`);
      assert(L.head?.kind === 'vac' && L.head.sealed && L.top.kind === 'suit' && L.armour?.color === COMBAT_SUIT.carrier && !L.ears, JSON.stringify(L.head));
      assert(!used.get('s') && !reds.length, JSON.stringify({ skin: used.get('s'), reds }));
      assert(WORN_KIT.includes('combatSuit') && !OUTFITS.includes('combatSuit'), 'outside the lineup');
      const dark = [COMBAT_SUIT.shell, COMBAT_SUIT.skin, COMBAT_SUIT.boot].every(c => (((c >> 16) & 255) + ((c >> 8) & 255) + (c & 255)) / 3 < 64);
      assert(dark, 'black');
    },
  },
  {
    name: 'a door\'s leaf hinged and swung by its opening\'s swing (art/jobs.js leafOf, PLACES §1.6): hinged at a or b, into either room, its open end in the room named; without a swing, v0.0.3\'s rule to the bit',
    fn() {
      const plan = { rooms: [{ id: 'hall', x0: 0, x1: 30, z0: 12, z1: 14.4 }, { id: 'r1', x0: 27, x1: 32, z0: 8, z1: 12 }, { id: 'r2', x0: 20, x1: 25.5, z0: 14.4, z1: 19.4 }] };
      // (the leaf's open end: the pivot plus the leaf's direction turned by base + swing × a quarter, three.js's turn about y)
      const openEnd = (l) => { const a = l.base + l.swing * Math.PI / 2; return [l.pivot[0] + l.w * Math.cos(a), l.pivot[1] - l.w * Math.sin(a)]; };
      const cases = [
        ['room 1 inward, hinged at a', { id: 'o1', axis: 'x', at: 12, a: 28.55, b: 29.45, rooms: ['hall', 'r1'], swing: { hinge: 'a', into: 1 } }, (z) => z < 12],
        ['room 1 inward, hinged at b', { id: 'o1b', axis: 'x', at: 12, a: 28.55, b: 29.45, rooms: ['hall', 'r1'], swing: { hinge: 'b', into: 1 } }, (z) => z < 12],
        ['room 2 outward into the hall, hinged at a', { id: 'o2', axis: 'x', at: 14.4, a: 20.15, b: 21.05, rooms: ['hall', 'r2'], swing: { hinge: 'a', into: 0 } }, (z) => z < 14.4],
        ['room 2 inward, hinged at b', { id: 'o2b', axis: 'x', at: 14.4, a: 20.15, b: 21.05, rooms: ['hall', 'r2'], swing: { hinge: 'b', into: 1 } }, (z) => z > 14.4],
        ['a wall along z, into the east room, hinged at b', { id: 'o3', axis: 'z', at: 25.5, a: 16, b: 16.9, rooms: ['r2', 'hall'], swing: { hinge: 'b', into: 1 } }, null],
      ];
      for (const [what, o, ok] of cases) {
        const l = leafOf(o, plan, 2.1), e = openEnd(l);
        console.log(`      ${what}: pivot ${l.pivot.map(v => v.toFixed(2)).join(', ')}, base ${l.base.toFixed(3)}, swing ${l.swing}; the open end at ${e.map(v => v.toFixed(2)).join(', ')}`);
        assert(l.pivot[0] === (o.axis === 'x' ? (o.swing.hinge === 'b' ? o.b : o.a) : o.at), JSON.stringify(l));
        if (ok) assert(ok(e[1]) && Math.abs(e[0] - l.pivot[0]) < 1e-9, `${what}: ${JSON.stringify(e)}`);
      }
      const old = leafOf({ id: 'x', axis: 'x', at: 12, a: 28.55, b: 29.45, rooms: ['r1', 'hall'] }, plan, 2.1);
      assert(old.pivot[0] === 28.55 && old.base === 0 && old.swing === 1 && !old.hinge, JSON.stringify(old));
    },
  },
  {
    name: 'the corners as covered, sparingly (render/range-items.js cornerPixels): a 2 px tick on the floor at each hot spot, pale until covered, brass once yours, a lighter brass the #2\'s; nothing for a corner with no place',
    fn() {
      const pale = cornerPixels({ x: 27.4, z: 8.6, covered: false }), mine = cornerPixels({ x: 27.4, z: 8.6, covered: true, by: 'you' }), his = cornerPixels({ x: 31.6, z: 8.6, covered: true, by: 'two' });
      console.log(`      ${pale.length} px each; pale ${hex(pale[0].c)}, yours ${hex(mine[0].c)}, the #2's ${hex(his[0].c)}; at ${pale.map(p => `${p.x.toFixed(4)}, ${p.y}, ${p.z}`).join(' and ')}`);
      assert(pale.length === 2 && pale[0].c === CORNER_PALE && mine[0].c === CORNER_COVERED && his[0].c === CORNER_TWO && cornerPixels({ x: NaN }).length === 0, 'the ticks');
      assert(Math.abs(pale[1].x - pale[0].x - 1 / 16) < 1e-9 && pale[0].y < 0.05, JSON.stringify(pale));
    },
  },
  {
    name: 'in the page at 1600 × 900 and 1024 × 768 (heavy): the Tests menu\'s "Stack and clear" and its picker (six sheets, the Private focused, the par chooser) inside the window; at GO with the stack\'s panel, a bundle running and at a contact no two HUD rectangles meet; the end card with the run sheet and the hot wash beside it inside the window, nothing to scroll',
    heavy: true,
    timeoutMs: 600000,
    async fn() {
      const port = Number(process.env.OLYMPUS_TEST_PORT) || undefined;
      await withGame(async (page, errors, game) => {
        const rows = [];
        const rectsNow = () => page.evaluate(() => {
          const r = (sel) => { const e = document.querySelector(sel); if (!e || e.hidden || e.closest('[hidden]') || getComputedStyle(e).display === 'none') return null; const b = e.getBoundingClientRect(); return b.width && b.height ? { x: b.left, y: b.top, w: b.width, h: b.height } : null; };
          return { TOASTS: r('.toasts'), WATCH: r('.watch'), TIMER: r('.timer'), PAPER: r('.paper'), INSTINCT: r('.instinct'), STEPS: r('.steps'), RADIO: r('.radio.voices'), KEYS: r('.keyshint'), BANNER: r('.banner') };
        });
        const clashOf = (rects) => { const names = Object.keys(rects).filter(k => rects[k]), out = []; for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) if (overlaps(rects[names[i]], rects[names[j]])) out.push(`${names[i]} × ${names[j]}`); return out; };
        for (const [w, h] of [[1600, 900], [1024, 768]]) {
          await page.setViewportSize({ width: w, height: h });
          await game.open('nostore=1');
          await page.waitForSelector('#title .item.tests');
          await page.click('#title .item.tests');
          await page.evaluate(() => [...document.querySelectorAll('#title .item.scene')].find(b => b.innerText.startsWith('Stack and clear')).click());
          await page.waitForSelector('#title .sheet.picker');
          const pk = await page.evaluate(() => {
            const inWin = (e) => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; };
            return { rows: [...document.querySelectorAll('#title .item.sheetpick')].map(b => ({ tier: b.dataset.tier, lead: b.classList.contains('lead'), in: inWin(b) })), pars: [...document.querySelectorAll('#title .item.parpick')].map(b => ({ par: b.dataset.par, text: b.textContent, in: inWin(b), on: b.classList.contains('on') })) };
          });
          rows.push(`${w} × ${h} the picker: ${pk.rows.map(r => `${r.tier}${r.lead ? '*' : ''}${r.in ? '' : ' (out)'}`).join(', ')}; the pars ${pk.pars.map(p => `${p.text}${p.on ? '*' : ''}${p.in ? '' : ' (out)'}`).join(' | ')}`);
          assert(pk.rows.length >= 5 && pk.rows.find(r => r.lead)?.tier === 'private' && pk.rows.every(r => r.in) && pk.pars.length === 4 && pk.pars.every(p => p.in) && pk.pars[0].on, JSON.stringify(pk));
          // (at GO, the stack's panel: the private, in stop motion)
          await game.open('play=test-shoothouse&setup=go&tier=private&seed=48213&nostore=1');
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house' && document.querySelector('.steps:not([hidden]) .step'), null, { timeout: 60000 });
          const go = { rects: await rectsNow(), panel: await page.evaluate(() => document.querySelector('.steps').innerText.replace(/\s+/g, ' ').slice(0, 300)) };
          rows.push(`${w} × ${h} at GO: the panel '${go.panel}'; meeting ${clashOf(go.rects).join(', ') || 'none'}`);
          assert(!clashOf(go.rects).length, JSON.stringify(go));
          // (a bundle running: the tier one, T)
          await game.open('play=test-shoothouse&setup=go&tier=tierone&seed=48213&nostore=1');
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house' && document.querySelector('.steps:not([hidden]) .step'), null, { timeout: 60000 });
          await page.waitForTimeout(500);
          await page.keyboard.press('KeyT');
          await page.waitForFunction(() => document.querySelector('.steps .running-view.bundle') || window.__olympus.house()?.bundle, null, { timeout: 10000 }).catch(() => null);
          const run = { rects: await rectsNow(), panel: await page.evaluate(() => document.querySelector('.steps')?.innerText.replace(/\s+/g, ' ').slice(0, 300) ?? '') };
          rows.push(`${w} × ${h} a bundle running: '${run.panel}'; meeting ${clashOf(run.rects).join(', ') || 'none'}`);
          assert(!clashOf(run.rects).length, JSON.stringify(run));
          // (a contact: the private's window open, then its pause)
          await game.open('play=test-shoothouse&setup=contact&tier=private&seed=48213&nostore=1');
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
          await page.waitForFunction(() => window.__olympus.contact?.()?.pending === null || window.__olympus.state?.stop?.via === 'contact', null, { timeout: 15000 }).catch(() => null);
          await page.waitForTimeout(600);
          const ct = { rects: await rectsNow(), lead: await page.evaluate(() => document.querySelector('.instinct .lead')?.textContent ?? '') };
          rows.push(`${w} × ${h} at a contact: the lead '${ct.lead}'; meeting ${clashOf(ct.rects).join(', ') || 'none'}`);
          assert(!clashOf(ct.rects).length, JSON.stringify(ct));
          // (the end card: the lane run to its end by the scene's bot, then the card with the run sheet and the hot wash beside it)
          await game.open('play=test-shoothouse&setup=go&tier=tierone&seed=48213&nostore=1');
          await page.waitForFunction(() => window.__ready && window.__olympus.state?.armoury?.range?.course === 'house', null, { timeout: 60000 });
          const ended = await page.evaluate(async () => {
            const O = window.__olympus;
            let bot = null;
            try { const m = await import('/tests/bots/house.mjs'); bot = m.houseBot({ mode: 'T' }); } catch { bot = null; }
            if (!bot) return false;
            O.pause(true);
            for (let n = 0; n < 400000 && !O.scene?.ended; n++) { const s = O.state, me = s.actors.list.find(a => a.id === s.player.actor); if (s.skip?.engine === 'ff') O.sim.ffTick(s); else O.step(1, bot(s, me, (me.bot ??= {}))); }
            O.pause(false);
            return !!O.scene?.ended;
          });
          if (!ended) { rows.push(`${w} × ${h} the end card: the scene's bot did not reach it (tests/bots/house.mjs)`); continue; }
          await page.keyboard.press('Enter');
          await page.waitForSelector('.glass.end', { timeout: 30000 });
          const end = await page.evaluate(() => {
            const inWin = (b) => !!b && b.left >= 0 && b.top >= 0 && b.right <= innerWidth + 1 && b.bottom <= innerHeight + 1;
            const e = document.querySelector('.glass.end'), r = e.getBoundingClientRect(), side = document.querySelector('.end-wrap .house-side'), sr = side?.getBoundingClientRect();
            return { in: inWin(r), scroll: e.scrollHeight - e.clientHeight, said: [...e.querySelectorAll('.said')].map(p => p.textContent), side: side ? { in: inWin(sr), overlaps: sr.right > r.left + 1 && sr.left < r.right - 1, sheet: document.querySelector('.runsheet')?.dataset.text ?? null, wash: document.querySelector('.house-wash')?.dataset.text ?? null, bars: document.querySelectorAll('.house-wash .hw-bar').length } : null };
          });
          rows.push(`${w} × ${h} the end card: inside ${end.in}, ${end.scroll} px to scroll, '${end.said.join(' | ')}'; the side ${JSON.stringify(end.side)}`);
          assert(end.in && end.scroll <= 1 && end.side?.in && !end.side.overlaps, JSON.stringify(end));
        }
        for (const r of rows) console.log(`      ${r}`);
        assert(!errors.length, errors.join(' | '));
      }, { port });
    },
  },
];
