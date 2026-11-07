// The weapon card reads the belief, never the truth (quick; the build sheet 0.0.5 §5.4: "a card drawn from a
// belief whose truth differs reads the belief in every glyph"; WEAPONS §4.2; the sheet's §8 item 27).
//
// The HUD's side of the card (src/ui/hud/steps.js): weaponCardModel(belief), its words and the caption that
// stands in when the picture can't be painted, reads only BELIEF_FIELDS of arms' beliefOf record (a Proxy
// counts every key it touches); and the step panel paints the stage's card (src/art/weaponcard.js
// paintWeaponCard) from that record alone. Then the whole path on arms' real records: the range kit
// materialised on a player (src/sim/arms/kit.js), the rifle loaded in truth with a dud chambered and two in
// its magazine while its holder believes a live round and about three (the state after a pull the holder
// counted wrong): beliefOf gives the belief, the model's every word is the belief's, and the card painted
// from beliefOf is pixel for pixel the card of the belief and differs from a card of the truth.
// The 0.0.7 round's (the build sheet 0.0.7 §5.5 ui-weaponcard): the SO-4's turrets on the card at distance, the dial from
// the believed zero ("▼3", never from the rifle's true zero), the lever's power, the line's believed dope ticked when the
// turrets are on it, else the clicks to go, and the hold on the reticle; a card with none of it (test-handling's: the
// turrets on the zero, 1×, no hold, no course at distance) is the v0.0.6 card pixel for pixel.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { weaponCardModel, BELIEF_FIELDS } from '../src/ui/hud/steps.js';
import { beliefOf } from '../src/sim/arms/firearms.js';
import { materialise } from '../src/sim/arms/kit.js';
import { paintWeaponCard, cardParts, distanceParts, dialWords, HOLD_PX_PER_MIL, DIAL_Y, DOPE_Y } from '../src/art/weaponcard.js';

// (the belief after a pull the holder counted wrong, and the truth under it)
const BELIEF = { model: 'r7', short: 'R-7', chamber: 'live', mag: 'in', magFam: 'had30', count: 3, countApprox: true, mode: 'semi', locked: false, port: 'closed', stoppage: 'click', condWord: 'fine', cocked: true };
const TRUTH_AS_BELIEF = { ...BELIEF, chamber: 'dud', count: 2, countApprox: false, stoppage: null };

export default [
  {
    name: 'weaponCardModel reads only the belief\'s fields (a Proxy counts each key touched), and every word it gives is the belief\'s: SEMI, "1 + ≈3", CLICK',
    fn() {
      const touched = new Set();
      const spy = new Proxy({ ...BELIEF, truth: { chamber: 'dud', n: 2 }, items: {}, n: 2, jam: 'double' }, { get(t, k) { touched.add(String(k)); return t[k]; } });
      const m = weaponCardModel(spy);
      const stray = [...touched].filter(k => !BELIEF_FIELDS.includes(k));
      console.log(`      touched: ${[...touched].join(', ')}; stray: ${stray.join(', ') || 'none'}`);
      console.log(`      ${m.line} | ${m.words}`);
      assert(!stray.length, `the card read past the belief: ${stray.join(', ')}`);
      assert(m.mode === 'SEMI' && m.line === 'SEMI · 1 + ≈3 · CLICK' && m.stoppage === 'CLICK' && m.chamber === 'ROUND' && m.count === '≈3', JSON.stringify(m));
      assert(/a round in the chamber/.test(m.words) && /about 3 in the magazine/.test(m.words) && !/dud|2 in/.test(m.words), m.words);
      const unknown = weaponCardModel({ ...BELIEF, chamber: '?', count: null, countApprox: false, stoppage: null, mode: 'safe' }), out = weaponCardModel({ ...BELIEF, mag: 'out', stoppage: null, locked: true, chamber: 'empty' });
      console.log(`      never checked: ${unknown.line}; locked back on no magazine: ${out.line}`);
      assert(unknown.line === 'SAFE · ? + ?' && out.line === 'SEMI · 0 + OUT · LOCKED', `${unknown.line} / ${out.line}`);
    },
  },
  {
    name: 'on arms\' own records: the range kit on a player, the truth a dud chambered and two in the magazine, the belief a round and about three: beliefOf gives no truth field, the model reads the belief, and the card painted from it is the belief\'s, not the truth\'s',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: 48213 }), s = g.state, pid = s.player.id;
      const { gunId, magIds } = materialise(s, pid, 'range-fam');
      const gun = s.items[gunId], mag = s.items[magIds[0]];
      // (in truth: the first magazine in, two left in it, a dud in the chamber; the holder believes a live round and about three)
      gun.mag = magIds[0]; mag.n = 2; gun.chamber = 'dud'; gun.mode = 'semi';
      gun.belief = { chamber: 'live', count: 3, countApprox: true, stoppage: 'click', mode: 'semi' };
      const b = beliefOf(s, gunId), keys = Object.keys(b), m = weaponCardModel(b);
      console.log(`      truth: chamber ${gun.chamber}, ${mag.n} in the magazine; beliefOf: ${JSON.stringify(b)}`);
      console.log(`      the card's words: ${m.line} | ${m.words}`);
      assert(keys.every(k => BELIEF_FIELDS.includes(k)), `beliefOf gives a field the card does not know: ${keys.filter(k => !BELIEF_FIELDS.includes(k))}`);
      assert(b.chamber === 'live' && b.count === 3 && b.countApprox && b.mag === 'in', JSON.stringify(b));
      assert(m.line === 'SEMI · 1 + ≈3 · CLICK' && !/DUD|\b2\b/.test(m.line), m.line);
      const fromBelief = paintWeaponCard({ model: b.model, belief: b }), again = paintWeaponCard({ model: 'r7', belief: BELIEF }), truth = paintWeaponCard({ model: 'r7', belief: TRUTH_AS_BELIEF });
      let same = 0, differ = 0;
      for (let i = 0; i < fromBelief.data.length; i++) { if (fromBelief.data[i] === again.data[i]) same++; if (fromBelief.data[i] !== truth.data[i]) differ++; }
      const pb = cardParts(b), pt = cardParts(TRUTH_AS_BELIEF);
      console.log(`      the card from beliefOf: ${fromBelief.w} × ${fromBelief.h}, ${same} of ${fromBelief.data.length} pixels as the belief's own card, ${differ} unlike a card of the truth; its parts ${JSON.stringify(pb)} against the truth's ${JSON.stringify(pt)}`);
      assert(same === fromBelief.data.length && differ > 0, JSON.stringify({ same, differ }));
    },
  },
  {
    name: 'the card at distance: the turrets read from the believed zero (▼3 off a believed 7 up, whatever the rifle\'s true zero), the lever at 4×, the dope for 300 ticked when on it and "▼3 TO GO" for 200, the hold\'s target dot on the reticle; test-handling\'s card unchanged',
    fn() {
      const B = { ...BELIEF, sight: { elev: 4, wind: -2 }, zero: { elev: 7, wind: -2 }, optic: 4, dope: { 200: { elev: 1, wind: -2 }, 300: { elev: 4, wind: -2 }, 500: { elev: 11, wind: -2 } }, trueZero: { elev: 6, wind: -3 } };
      const F300 = distanceParts(B, { distance: true, line: 300, hold: { xMil: 0.5, yMil: 0 } }), F200 = distanceParts(B, { distance: true, line: 200 });
      const w300 = dialWords(F300), w200 = dialWords(F200), m = weaponCardModel(B, { distance: true, line: 300, hold: { xMil: 0.5, yMil: 0 } });
      console.log(`      at 300: ${JSON.stringify(w300)}; at 200: ${JSON.stringify(w200)}`);
      console.log(`      the card's line: ${m.line} | ${m.words}`);
      assert(F300.dial.elev === -3 && F300.dial.wind === 0 && w300.dial === '▼3' && w300.power === '4×' && w300.dope === '300 ▼3' && w300.onDope, JSON.stringify(F300));
      assert(w200.dope === '200 ▼6' && w200.toGo === '▼3' && !w200.onDope, JSON.stringify(w200));
      assert(m.far === '4× · ▼3 · 300 ▼3 ✓ · HOLD 0.5 R' && /3 clicks down from your zero, on your dope for 300 m, holding 0.5 mil right/.test(m.words) && !/6|−3|-3 /.test(m.far), `${m.far} | ${m.words}`);
      // (the pixels: the dial's row and the dope's in the words' colours, the hold's dot 0.5 mil left of the crosshair: the target where the hold puts it)
      const c = paintWeaponCard({ model: 'r7', belief: B, distance: true, line: 300, hold: { xMil: 0.5, yMil: 0 } }), c0 = paintWeaponCard({ model: 'r7', belief: B, distance: true, line: 300 });
      const at = (pm, x, y) => pm.data[y * pm.w + x] & 0xffffff, rowInk = (pm, y0) => { let n = 0; for (let y = y0; y < y0 + 10; y++) for (let x = 4; x < 90; x++) if (at(pm, x, y) !== at(pm, 2, 2)) n++; return n; };
      const RET = [162, 28], dx = Math.round(0.5 * HOLD_PX_PER_MIL), red = at(c, RET[0] - dx, RET[1] - 1), redAt0 = at(c0, RET[0] - 1, RET[1] - 1);
      console.log(`      the dial's row ${rowInk(c, DIAL_Y)} px of ink, the dope's ${rowInk(c, DOPE_Y)}; the target dot at ${-dx} px (0.5 mil left) ${red.toString(16)}, centred with no hold ${redAt0.toString(16)}`);
      assert(rowInk(c, DIAL_Y) > 20 && rowInk(c, DOPE_Y) > 20 && red === redAt0 && red !== at(c, 2, 2), JSON.stringify({ red, redAt0 }));
      // (the same card from a belief whose rifle is truly zeroed elsewhere: the card cannot know, so it is the same)
      const c2 = paintWeaponCard({ model: 'r7', belief: { ...B, trueZero: { elev: 0, wind: 0 } }, distance: true, line: 300, hold: { xMil: 0.5, yMil: 0 } });
      assert(c.data.every((v, i) => v === c2.data[i]), 'the true zero reaches no pixel');
      // (test-handling's belief: the turrets on a zero at issue, 1×, no hold, no distance: no distance parts, the v0.0.6 card)
      const plain = { ...BELIEF, sight: { elev: 0, wind: 0 }, zero: { elev: 0, wind: 0 }, optic: 1, dope: { 200: { elev: -6, wind: 0 }, 300: { elev: -3, wind: 0 }, 500: { elev: 4, wind: 0 } } };
      const a = paintWeaponCard({ model: 'r7', belief: BELIEF }), b = paintWeaponCard({ model: 'r7', belief: plain });
      console.log(`      test-handling's belief: distance parts ${JSON.stringify(cardParts(plain).far)}, the card the same as v0.0.6's: ${a.data.every((v, i) => v === b.data[i])}; its line "${weaponCardModel(plain).line}"`);
      assert(cardParts(plain).far === null && a.data.every((v, i) => v === b.data[i]) && weaponCardModel(plain).line === 'SEMI · 1 + ≈3 · CLICK', 'unchanged');
    },
  },
];
