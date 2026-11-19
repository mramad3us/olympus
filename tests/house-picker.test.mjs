// OLYMPUS tests: the picker's house and rooms, and the named house's letter on the paper and the card (the build sheet v0.0.22 §1 item 14, §0 items 19 to 21; the house lens's G3).
//
// Pure, in node, on a small stand-in for the page's document. Without the rooms' role's exports (assemble.js HOUSE_LAYOUTS, ROOM_SETS,
// laneWordOf: the stubs the sheet names) the picker's house row is v0.0.21's to the letter ("As set", "Drawn from the seed", H
// cycling it, the pick carrying { draw }), with no rooms row. With them, "House: A · B · C · Drawn from the seed" and under it
// "Rooms: The three · All eight", the rooms off until the drawn house is chosen and its default HOUSE_ROOMS_DEFAULT; the pick carries
// { draw: 'set' } for A, { layout: 'B' } for B, { draw: 'drawn', rooms } for the drawn house, the keys H and R cycling them (R only on
// the drawn house). A named house's lane word: the run sheet's title "LANE B · THE WHEEL · HOUSE 1" and its card's "NEW LAYOUT" as
// "LANE B", the end card's header "· lane B" where a drawn house says "· house <code>", the score line "lane B" before the code;
// none of it as set or on a drawn house. Fails without the rows.
import { assert } from './helpers.mjs';
import { pickerPage, layoutsOf, roomSetsOf, DRAW_WORDS } from '../src/ui/cards/pairs.js';
import { runSheetEl, namedLaneOf, againHouseOf } from '../src/ui/cards/house.js';
import { endCard } from '../src/ui/cards/end.js';
import { SCENES } from '../src/data/scenes.js';

// (a stand-in for the page's elements: what pickerPage, runSheetEl and endCard touch)
class El {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.childNodes = []; this.dataset = {}; this.cls = new Set(); this.on = {}; this.textContent = ''; this.disabled = false; this.style = {}; }
  get className() { return [...this.cls].join(' '); }
  set className(v) { this.cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get classList() { const c = this.cls; return { add: (x) => c.add(x), remove: (x) => c.delete(x), contains: (x) => c.has(x), toggle: (x, f = !c.has(x)) => (f ? c.add(x) : c.delete(x), f) }; }
  // (the end card numbers its lines through each button's first child, its kbd (end.js keysOf, the hunt of v0.0.20's P2))
  get firstChild() { return this.childNodes[0] ?? null; }
  append(...k) { this.childNodes.push(...k); }
  replaceChildren(...k) { this.childNodes = [...k]; }
  addEventListener(t, f) { (this.on[t] ??= []).push(f); }
  click() { this.onclick?.(); }
  focus() {}
  key(code) { const e = { code, preventDefault() {}, stopPropagation() {} }; for (const f of this.on.keydown ?? []) f(e); }
}
const doc = { createElement: (t) => new El(t) };
const text = (n) => (typeof n === 'string' ? n : [n.textContent ?? '', ...(n.childNodes ?? []).map(text)].join(''));
const withDoc = (fn) => { const was = globalThis.document; globalThis.document = doc; try { return fn(); } finally { globalThis.document = was; } };
const SCENE = SCENES['test-shoothouse'], SHEETS = { private: { label: 'Private', wf: 15 }, sgt: { label: 'Sergeant', wf: 30 } };

export default [
  {
    name: 'without the rooms\' exports the house row is v0.0.21\'s ("As set", "Drawn from the seed", { draw }), no rooms row; with them "A · B · C · Drawn from the seed" and "Rooms: The three · All eight", live on the drawn house only, the pick carrying { draw: \'set\' }, { layout: \'B\' } or { draw: \'drawn\', rooms }',
    fn() {
      const picks = [], pick = (tier, o) => picks.push({ tier, ...o });
      const scene = { ...SCENE, draws: ['set', 'drawn'], layouts: ['A', 'B', 'C'], rooms: ['a', 'all'] };
      // (the stubs: { A: 'A' } and no room sets, as the sheet's §7 gives them)
      const P0 = withDoc(() => pickerPage({ scene, sheets: SHEETS, onPick: pick, layouts: { A: 'A' }, roomSets: null }));
      const words0 = P0.draws.map(b => b.textContent);
      P0.buttons[0].click(); P0.body.key('KeyH'); P0.buttons[0].click();
      console.log(`      the stubs: house ${JSON.stringify(words0)}, rooms ${P0.rooms.length}; picks ${JSON.stringify(picks)}`);
      assert(words0.join() === [DRAW_WORDS.set, DRAW_WORDS.drawn].join() && !P0.rooms.length && picks[0].draw === 'set' && !('layout' in picks[0]) && !('rooms' in picks[0]) && picks[1].draw === 'drawn' && !('rooms' in picks[1]), JSON.stringify({ words0, picks }));
      picks.length = 0;
      const P = withDoc(() => pickerPage({ scene, sheets: SHEETS, onPick: pick, layouts: { A: 'A', B: 'Wn280pc.Os195lc.Tn165pc', C: 'Qn290pc.Ds205lc.En175pc' }, roomSets: { a: ['C', 'K', 'E'], all: [] }, roomsDefault: 'a' }));
      const words = P.draws.map(b => b.textContent), rooms = P.rooms.map(b => b.textContent), off0 = P.rooms.every(b => b.disabled);
      P.buttons[0].click();                       // (A: the set)
      P.draws[1].click(); P.buttons[1].click();    // (B)
      P.body.key('KeyR'); const roomAtB = P.roomSet;
      P.body.key('KeyH'); P.body.key('KeyH');      // (C, then the drawn house)
      const live = P.rooms.every(b => !b.disabled);
      P.buttons[0].click();                       // (drawn, the three)
      P.body.key('KeyR'); P.buttons[0].click();   // (drawn, all eight)
      console.log(`      with them: house ${JSON.stringify(words)}, rooms ${JSON.stringify(rooms)} (off until drawn: ${off0}, live on it: ${live}; R on B left ${roomAtB}); picks ${JSON.stringify(picks)}`);
      assert(words.join() === `A,B,C,${DRAW_WORDS.drawn}` && rooms.join() === 'The three,All eight' && off0 && live && roomAtB === 'a', JSON.stringify({ words, rooms, off0, live, roomAtB }));
      assert(picks[0].draw === 'set' && !picks[0].layout && picks[1].layout === 'B' && !picks[1].draw && picks[2].draw === 'drawn' && picks[2].rooms === 'a' && picks[3].rooms === 'all', JSON.stringify(picks));
      assert(layoutsOf({ layouts: ['A', 'B'] }, { A: 'A' }).length === 0 && layoutsOf({}, { A: 'A', B: 'b' }).length === 0 && roomSetsOf(null).length === 0, 'the helpers');
    },
  },
  {
    name: 'the ship rule\'s switches (the A and D review, 2026-11-16): with every export of the rooms\' role, the picker offers only the layouts and room sets the scene lists (scenes.js layouts and rooms), so "All eight" is absent while test-shoothouse\'s rooms is [\'a\'], and a layout the scene leaves out is never on the row (fails with roomSetsOf reading the sim\'s export alone)',
    fn() {
      const have = { A: 'A', B: 'Wn280pc.Os195lc.Tn165pc', C: 'Qn290pc.Ds205lc.En175pc' }, sets = { a: ['C', 'K', 'E'], all: [] };
      const P = withDoc(() => pickerPage({ scene: SCENE, sheets: SHEETS, onPick: () => {}, layouts: have, roomSets: sets, roomsDefault: 'a' }));
      const words = P.draws.map(b => b.textContent), listed = (SCENE.layouts ?? []).filter(l => have[l] !== undefined);
      const offRooms = roomSetsOf(sets, { rooms: ['a'] }), noRooms = roomSetsOf(sets, {}), onRooms = roomSetsOf(sets, { rooms: ['a', 'all'] });
      const offC = layoutsOf({ layouts: ['A', 'B'] }, have);
      console.log(`      test-shoothouse's switches: layouts ${JSON.stringify(SCENE.layouts ?? null)}, rooms ${JSON.stringify(SCENE.rooms ?? null)}; the row ${JSON.stringify(words)}, rooms ${P.rooms.length}; roomSetsOf off ${JSON.stringify(offRooms)}, absent ${JSON.stringify(noRooms)}, on ${JSON.stringify(onRooms)}; layouts without C ${JSON.stringify(offC)}`);
      assert(!(SCENE.rooms ?? []).includes('all') && P.rooms.length === 0, JSON.stringify({ rooms: SCENE.rooms, shown: P.rooms.map(b => b.textContent) }));
      assert(offRooms.length === 0 && noRooms.length === 0 && onRooms.join() === 'a,all', JSON.stringify({ offRooms, noRooms, onRooms }));
      assert(offC.join() === 'A,B' && words.filter(w => /^[A-C]$/.test(w)).join() === (listed.length > 1 ? listed.join() : ''), JSON.stringify({ offC, words, listed }));
    },
  },
  {
    name: '"Again with a new seed" keeps a named house with a new cast (the A and D review, 2026-11-16: after layout B it played a house drawn whole): { layout: \'B\' } on a new seed, the code on the same seed, a drawn house drawn afresh on its own rooms, the set as set',
    fn() {
      const codeB = 'Wn280pc.Os195lc.Tn165pc|fttantt|p302102', codeD = 'Es265po.Cs200pc.Kn170pc|ftttnan|p211331';
      const rows = {
        bNew: againHouseOf({ same: false, code: codeB, lane: 'B' }), bSame: againHouseOf({ same: true, code: codeB, lane: 'B' }),
        cNew: againHouseOf({ same: false, code: codeB, lane: 'C' }), dNew: againHouseOf({ same: false, code: codeD }),
        d8New: againHouseOf({ same: false, code: codeD, rooms: 'all' }), dSame: againHouseOf({ same: true, code: codeD, rooms: 'all' }),
        setNew: againHouseOf({ same: false }), setSame: againHouseOf({ same: true }),
      };
      console.log(`      ${Object.entries(rows).map(([k, v]) => `${k} ${JSON.stringify(v)}`).join('; ')}`);
      assert(JSON.stringify(rows.bNew) === '{"layout":"B"}' && JSON.stringify(rows.cNew) === '{"layout":"C"}' && !('draw' in rows.bNew), JSON.stringify(rows));
      assert(rows.bSame.house === codeB && rows.dSame.house === codeD && rows.dNew.draw === 'drawn' && !rows.dNew.house && !rows.dNew.layout && rows.d8New.rooms === 'all', JSON.stringify(rows));
      assert(JSON.stringify(rows.setNew) === '{}' && JSON.stringify(rows.setSame) === '{}', JSON.stringify(rows));
    },
  },
  {
    name: 'a named house says its letter: the run sheet\'s title and card "LANE B", the end card "· lane B" (a drawn house "· house <code>"), none as set; namedLaneOf only B and C',
    fn() {
      const word = (c) => (c === 'A' ? 'A' : c.startsWith('Wn280pc.Os195lc.Tn165pc') ? 'B' : 'drawn');
      const codeB = 'Wn280pc.Os195lc.Tn165pc|ftttttt|p000000', codeD = 'Cn290pc.Ks206lc.En175pc|ftttttt|p000000';
      const lanes = { A: namedLaneOf('A', word), B: namedLaneOf(codeB, word), drawn: namedLaneOf(codeD, word), none: namedLaneOf(null, word), stub: namedLaneOf(codeB, null) };
      const rs = { rows: [], card: 'GO · NEW LAYOUT · PRIVATE · 3 ROOMS · 58.4 S' };
      const sB = text(runSheetEl(rs, { doc, lane: 'B' })), sSet = text(runSheetEl({ ...rs, card: 'GO · LANE A · PRIVATE' }, { doc }));
      const h = (o) => withDoc(() => text(endCard({ scene: { title: 'Stack and clear', aspects: [] }, seed: 48213, sheet: 'Private', ...o }).body).split('A test scene')[0].slice(0, 90));
      const eB = h({ code: codeB, lane: 'B' }), eD = h({ code: codeD }), eSet = h({});
      console.log(`      namedLaneOf ${JSON.stringify(lanes)}; the paper "${sB.slice(0, 70)}"; as set "${sSet.slice(0, 40)}"`);
      console.log(`      the end card: "${eB}" | "${eD}" | "${eSet}"`);
      assert(lanes.A === null && lanes.B === 'B' && lanes.drawn === null && lanes.none === null && lanes.stub === null, JSON.stringify(lanes));
      assert(sB.includes('LANE B · THE WHEEL · HOUSE 1') && sB.includes('GO · LANE B · PRIVATE') && !sB.includes('NEW LAYOUT') && sSet.includes('THE WHEEL · HOUSE 1') && !sSet.includes('LANE B'), sB);
      assert(eB.includes('as Private · lane B') && !eB.includes('house ') && eD.includes('· house Cn290pc.Ks206lc.En175pc') && !/lane|house /.test(eSet), JSON.stringify({ eB, eD, eSet }));
    },
  },
];
