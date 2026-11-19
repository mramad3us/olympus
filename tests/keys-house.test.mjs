// OLYMPUS tests: the keys card leads with the house in the house (v0.0.23, its build sheet item 15, carried FH-8).
//
// The keys card ('?') led with run, stroll and R's "wait 15 min (R twice)" in the shoot house, where R has no wait, and named G, X
// and T among twenty others (the first-hour lens). From v0.0.23 keysRows({ scene }) on a scene whose course is 'house' leads with
// "In the shoot house": T, G, X, the walk, the digits, V, Backspace, then Space, Esc and ?, the house's old rows folded into it; then
// the rest less those, R's words without the wait. Every other scene's card is v0.0.22's row for row. Pure.
import { assert } from './helpers.mjs';
import { keysRows, HOUSE_HEAD, HOUSE_BLOCK } from '../src/ui/cards/keys.js';
import { SCENES } from '../src/data/scenes.js';

const label = (a) => `[${a}]`;
const says = { hand: "what's at hand, as its plate says: an action, a door, else wait 15 min (R twice); held: the menu of every action there" };

export default [
  {
    name: 'in the shoot house the keys card leads with "In the shoot house" (T, G, X, the walk, the digits, V, Backspace, Space, Esc, ?) and R has no wait there; on every other scene the card is as before',
    fn() {
      const house = keysRows({ label, says, panel: 'c', scene: SCENES['test-shoothouse'] }), live = keysRows({ label, says, panel: 'c', scene: SCENES['test-shoothouse-live'] ?? SCENES['test-shoothouse'] });
      const plain = keysRows({ label, says, panel: 'c' }), bay = keysRows({ label, says, panel: 'c', scene: SCENES['test-handling'] });
      const head = house.slice(0, HOUSE_BLOCK.length + 1);
      console.log(`      the house's first rows: ${head.map(([k, w]) => (k === null ? `— ${w} —` : `${k} ${w.split(/[,:;]/)[0]}`)).join(' | ')}`);
      console.log(`      rows: house ${house.length}, live ${live.length}, the bay ${bay.length}, no scene ${plain.length}`);
      const order = head.slice(1).map(([k]) => k);
      assert(house[0][0] === null && house[0][1] === HOUSE_HEAD && order.join(',') === '[instinct],[ready],[shoot],[up] [left] [down] [right],1 … 0,Watch, Look,[carry],[Backspace],[pause],[menu],[help]', JSON.stringify(order));
      const rest = house.slice(HOUSE_BLOCK.length + 1);
      assert(!rest.some(([k, w]) => /wait 15 min|R twice/.test(w ?? '')) && !rest.some(([k, w]) => ['[instinct]', '[ready]', '[shoot]', '[help]', '[carry]'].includes(k) || (k === '[pause]' && w === 'pause') || (k === '[menu]' && w === 'the menu')), JSON.stringify(rest.map(r => r[0])));
      // (v0.0.23, DW: the dead corner named once in the house's help)
      assert(house.some(([k, w]) => k === 'Watch, Look' && /"Look: behind the door"/.test(w)), 'the dead corner in the house\'s help');
      assert(JSON.stringify(bay) === JSON.stringify(plain) && plain.some(([, w]) => /wait 15 min/.test(w)) && plain[0][0] !== null && live[0][1] === HOUSE_HEAD, JSON.stringify(plain.slice(0, 2)));
    },
  },
];
