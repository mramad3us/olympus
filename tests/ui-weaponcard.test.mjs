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
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { weaponCardModel, BELIEF_FIELDS } from '../src/ui/hud/steps.js';
import { beliefOf } from '../src/sim/arms/firearms.js';
import { materialise } from '../src/sim/arms/kit.js';
import { paintWeaponCard, cardParts } from '../src/art/weaponcard.js';

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
];
