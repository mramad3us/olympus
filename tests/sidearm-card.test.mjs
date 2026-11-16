// OLYMPUS tests: the weapon card with two guns (VIEWS §4.4 "As built in v0.0.18: two guns"; the build sheet 0.0.18 §5.1 tests 13 to 15).
//
// The user, 2026-11-15: the P-12 shown like the rifle. v0.0.17's card showed only the gun in use, and the P-12 drawn painted the
// R-7 carrying the pistol's belief (pistols.js PISTOL_DRAWN_AS was empty, and weaponcard.js tried a pistol's design only for a
// named drawing). What each test pins:
//   - a rifle alone paints the card it painted: every case below hashes to what v0.0.17's code printed (CARD_HASHES), so no
//     scene without a sidearm moves a pixel;
//   - two guns: the gun in use whole with the hands mark at the top left, the other in the strip at the foot (OTHER_Y, OTHER_H),
//     the rows between them as the one-gun card's, the strip's words its own belief's;
//   - the P-12 in the hand is drawn as a pistol (P12A until the user's pick), never the R-7; weaponCardModel reads only
//     BELIEF_FIELDS of both beliefs and takes the other gun's place from the view, never from a belief.
import { assert } from './helpers.mjs';
import { paintWeaponCard, CARD_W, CARD_H, OTHER_Y, OTHER_H } from '../src/art/weaponcard.js';
import { pistolDrawingOf, PISTOL_DRAWN_AS } from '../src/art/pistols.js';
import { weaponCardModel, BELIEF_FIELDS } from '../src/ui/hud/steps.js';
import { digest } from '../src/core/hash.js';

const R7 = { model: 'r7', short: 'R-7', chamber: 'live', mag: 'in', magFam: 'had30', count: 9, countApprox: false, magLoad: null, mode: 'safe', locked: false, port: 'closed', stoppage: null, condWord: 'fine', cocked: true, hand: null, sight: { elev: 0, wind: 0 }, optic: 1, zero: { elev: 0, wind: 0 }, dope: null };
const P12 = { ...R7, model: 'p12', short: 'P-12', magFam: 'had17', count: 9, sight: null, zero: null, dope: null };
const b = (o) => ({ ...R7, ...o });
/** The cases the art suites draw: [name, paintWeaponCard's options] (one gun: no other). */
export const CARD_CASES = Object.freeze([
  ['C1 safe', { belief: b({}) }], ['C1 semi', { belief: b({ mode: 'semi' }) }], ['C3', { belief: b({ chamber: 'empty' }) }],
  ['C4', { belief: b({ chamber: 'empty', mag: 'out', count: null }) }], ['locked empty', { belief: b({ chamber: 'empty', locked: true, count: 0, port: 'open', mode: 'semi' }) }],
  ['chamber unknown', { belief: b({ chamber: '?', count: null }) }], ['click', { belief: b({ stoppage: 'click', mode: 'semi', cocked: false }) }],
  ['felt', { belief: b({ stoppage: 'felt', mode: 'semi', port: 'open' }) }], ['stovepipe seen', { belief: b({ stoppage: 'case', chamber: 'case', mode: 'semi', port: 'open' }) }],
  ['double seen', { belief: b({ stoppage: 'double', chamber: 'case', mode: 'semi', port: 'open' }) }], ['approx tracer', { belief: b({ count: 14, countApprox: true, magLoad: 'tracer' }) }],
  ['hand 5 ball', { belief: b({ mag: 'out', count: null, chamber: 'empty', hand: { fam: 'had30', n: 5, approx: false, load: 'ball', feel: null, cap: 30 } }) }],
  ['hand a few', { belief: b({ mag: 'out', count: null, hand: { fam: 'had30', n: null, approx: false, load: null, feel: 'few', cap: 30 } }) }],
  ['4x', { belief: b({ optic: 4 }) }], ['the KD at 300', { belief: b({ optic: 4, sight: { elev: 3, wind: -1 } }), distance: true, line: 300, hold: { xMil: 0.5, yMil: 0 } }],
  ['zeroing', { belief: b({ sight: { elev: 4, wind: 2 } }), distance: true, zeroing: { from: { elev: 0, wind: 0 } } }],
  ['desert finish', { belief: b({}), finish: 'desert' }], ['P12A drawn', { model: 'p12', drawing: 'p12a', belief: { ...P12 } }],
  ['P12B locked', { model: 'p12', drawing: 'p12b', belief: { ...P12, locked: true, chamber: 'empty', count: 0, port: 'open', mode: 'semi' } }],
  ['P12C hand', { model: 'p12', drawing: 'p12c', belief: { ...P12, mag: 'out', count: null, hand: { fam: 'had17', n: 10, approx: false, load: 'frangible', feel: null, cap: 17 } } }],
  ['P12D click', { model: 'p12', drawing: 'p12d', belief: { ...P12, stoppage: 'click', mode: 'semi' } }],
]);
/** v0.0.17's digests of CARD_CASES (printed from v0.0.17's code before the two-gun card was built: PRINT_HASH=1). */
const CARD_HASHES = Object.freeze({
  'C1 safe': '1bade961d70a96',
  'C1 semi': '14a9615e435b34',
  'C3': '11277cf17188f1',
  'C4': '13e09c37d117c1',
  'locked empty': '1b2559fed4b867',
  'chamber unknown': '12d2609f52a695',
  'click': '029067a736580e',
  'felt': '02790e97b96eeb',
  'stovepipe seen': '10faff27fce90e',
  'double seen': '02e183bd4c85a2',
  'approx tracer': '02d32974053c12',
  'hand 5 ball': '113caef54ec68e',
  'hand a few': '0596709c1d9c39',
  '4x': '0e945d6b892e8b',
  'the KD at 300': '008ad11243fdbf',
  'zeroing': '1fb688d15ce55b',
  'desert finish': '07214684dd79f5',
  'P12A drawn': '0e1de556cf713f',
  'P12B locked': '15bc6a1a75eb78',
  'P12C hand': '0c96477e1a84ec',
  'P12D click': '03416aa7856930',
});
const hashOf = (pm) => digest(Array.from(pm.data, v => v.toString(16)).join(','));

export default [
  {
    name: 'a rifle alone paints the card it painted: for every case of the art suites, with no other gun the card\'s pixels are v0.0.17\'s (the ranges\' card unchanged)',
    fn() {
      const got = Object.fromEntries(CARD_CASES.map(([n, o]) => [n, hashOf(paintWeaponCard({ k: 1, ...o }))]));
      if (process.env.PRINT_HASH) console.log(`      ${JSON.stringify(got)}`);
      const bad = Object.entries(got).filter(([n, h]) => CARD_HASHES[n] !== h);
      console.log(`      ${CARD_CASES.length} cards, ${CARD_CASES.length - bad.length} the same as v0.0.17's to the pixel`);
      assert(!bad.length, JSON.stringify(bad.slice(0, 6)));
    },
  },
  {
    name: 'two guns: the gun in use drawn whole with the hands mark, the other in the strip under the words; rows 13 to 122 the same as the one-gun card\'s, and the strip\'s words are its own belief\'s (SAFE 1+9 for the holstered P-12 made ready)',
    fn() {
      const rifle = b({ mode: 'semi' }), other = { model: 'p12', place: 'holster', belief: { ...P12 }, finish: null };
      const one = paintWeaponCard({ model: 'r7', belief: rifle }), two = paintWeaponCard({ model: 'r7', belief: rifle, other });
      let same = 0, diffMid = 0, strip = 0, mark = 0;
      for (let y = 0; y < CARD_H; y++) for (let x = 0; x < CARD_W; x++) {
        const d = one.data[y * CARD_W + x] !== two.data[y * CARD_W + x];
        if (!d) { same++; continue; }
        if (y >= OTHER_Y - 1) strip++; else if (y < 13 && x < 14) mark++; else diffMid++;
      }
      // (the strip: the other gun's own words, its place's; never the gun in use's)
      const m = weaponCardModel(rifle, { other });
      assert(diffMid === 0 && strip > 200 && mark > 10, JSON.stringify({ same, diffMid, strip, mark }));
      assert(m.other?.line === 'P-12 HOLSTER · SAFE · 1 + 9' && /in its holster/.test(m.other.words), JSON.stringify(m.other));
      // (the P-12 in use, the rifle hanging with a double feed: its "!" in the strip)
      const m2 = weaponCardModel({ ...P12, mode: 'semi' }, { other: { model: 'r7', place: 'hanging', belief: b({ stoppage: 'double', chamber: 'case', mode: 'semi' }) } });
      assert(/^R-7 HANGING · SEMI · CASE \+ 9 · DOUBLE$/.test(m2.other?.line ?? ''), JSON.stringify(m2.other));
      console.log(`      ${strip} pixels in the strip (rows ${OTHER_Y - 1} to ${OTHER_Y + OTHER_H - 1}), ${mark} in the hands mark, ${diffMid} elsewhere; "${m.other.line}"; "${m2.other.line}"`);
    },
  },
  {
    name: 'the P-12 in the hand is drawn as a pistol, never the R-7 (PISTOL_DRAWN_AS p12 → p12a until the user\'s pick), and weaponCardModel reads only BELIEF_FIELDS of both beliefs',
    fn() {
      const belief = { ...P12, mode: 'semi' };
      const game = paintWeaponCard({ model: 'p12', belief }), a = paintWeaponCard({ model: 'p12', drawing: 'p12a', belief }), r7 = paintWeaponCard({ model: 'r7', belief });
      assert(PISTOL_DRAWN_AS.p12 === 'p12a' && pistolDrawingOf('p12')?.id === 'p12a', JSON.stringify(PISTOL_DRAWN_AS));
      assert(hashOf(game) === hashOf(a) && hashOf(game) !== hashOf(r7), JSON.stringify({ game: hashOf(game), a: hashOf(a), r7: hashOf(r7) }));
      // (a Proxy on each belief: every key read is one of BELIEF_FIELDS)
      const read = new Set();
      const spy = (o) => new Proxy(o, { get(t, k) { if (typeof k === 'string') read.add(k); return t[k]; } });
      weaponCardModel(spy(b({})), { other: { model: 'p12', place: 'holster', belief: spy({ ...P12, secret: 'truth' }) } });
      const stray = [...read].filter(k => !BELIEF_FIELDS.includes(k));
      assert(!stray.length, JSON.stringify({ stray }));
      console.log(`      the game's P-12 card is P12A's to the pixel (${hashOf(game)}), not the R-7's (${hashOf(r7)}); fields read ${read.size}, none outside BELIEF_FIELDS`);
    },
  },
];
