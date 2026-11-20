// OLYMPUS tests: the review of v0.0.28's picks patch (2026-11-20), its findings on the cards and the samples that the other suites do
// not hold (the hostage card's is hostage-card's, the corner aid's house-corner's, the doors' view-unknown's, X's deck-words').
//
// Finding 1: the cards the user starred on 2026-11-20 stay as starred. F1 (a man from behind) and K1 (kneeling; only its aim redrawn,
// A3's hold) were redrawn by the art director's third pass (a rifle drawn behind him and clipped hair on F1; K1's hip set lower, a
// raised knee, and every set-down card cropped on to the floor), and the cower and the daze with them through the crop and the shared
// kneel: the starred cards are held here to v0.0.27's own pixels, recorded on the snapshot's tree (v0.0.26 and v027-snapshot.patch,
// c805e72) with samples/portrait-lib/posed.js cardOf at the three bands and the largest and smallest card. Finding 2: a man side on
// (F4) fits the card at every size: at CARD_MIN (170 px, the 1024 × 768 screen) the review's build put 31 to 35 of his pixels on the
// figure's last row, the boots cut by the words' strip. Finding 7: the corner-aid sample's words fit its picture. Each case is red on
// the review's build.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { assert, root } from './helpers.mjs';
import { CARD_W, CARD_MIN, wordsRows } from '../src/art/doll/hitcard.js';
import { POSE_BENDS } from '../src/art/doll/doll.js';
import { RP, RP_PISTOL, RP_PERSON, recOf, cardOf } from '../samples/portrait-lib/posed.js';
import { picture as aidPicture, LOOKS as AID_LOOKS } from '../samples/corner-aid/aid.js';

const BANDS_M = [4, 14, 30], SIZES = [CARD_W, 185, CARD_MIN];
const digest = (c) => createHash('sha1').update(Buffer.from(c.data.buffer)).digest('hex').slice(0, 8);
/** v0.0.27's cards (the snapshot's tree): [4 m at 200, 4 m at 170, 14 m at 200, 14 m at 170, 30 m at 200, 30 m at 170]. */
const STARRED = Object.freeze({
  'F1, from behind at the low ready': [{ facing: 'back', hold: { how: 'rifle-low' } }, ['8a73df44', '43e46699', 'f0256b87', '69e2506a', '156c5397', '94abc2a0']],
  'F1, from behind, empty-handed': [{ facing: 'back', hold: { how: 'empty' } }, ['3e15140b', '741edb06', 'ddc98a89', '420a2973', '42baf26a', 'f3df12ab']],
  'K1, kneeling at the low ready': [{ pose: 'kneel', hold: { how: 'rifle-low' } }, ['9a7b03b5', '2091a675', 'dd426040', 'b302b74d', 'cd8931f0', 'b16dfe98']],
  'K1, kneeling, empty-handed': [{ pose: 'kneel', hold: { how: 'empty' } }, ['b64f8e32', '01c5f358', '53e1891d', 'f2fd5afd', '49a73d79', '7968d945']],
  'the cower (C1, breach-poses C-a)': [{ pose: 'cower', hold: { how: 'empty' } }, ['e1027470', '38b4d51c', '5af389aa', 'db522876', '51fc5f3a', 'd992767b']],
  'the daze (breach-poses D-a)': [{ pose: 'daze', hold: { how: 'rifle-low' } }, ['9026afac', 'bc0cf9ce', '01b3cbba', '2c47557f', 'd8f13547', '33e14e98']],
  'the daze on his knee': [{ pose: 'dazeKneel', hold: { how: 'rifle-low' } }, ['de96b8bc', 'ca0ec363', '6737e20f', '79d51991', '4ae620ba', '21449e18']],
});

export default [
  {
    name: 'the review of the picks, finding 1: the cards starred on 2026-11-20 are drawn as starred: F1 from behind, K1 kneeling, the cower and the daze are v0.0.27\'s pixel for pixel at the three bands and the largest and smallest card, and the kneel\'s bend is v0.0.27\'s (red on the review\'s build: a rifle behind F1, K1\'s hip 38 rows down with a raised knee, the set-down cards cropped to the floor)',
    fn() {
      const rows = [], bad = [];
      for (const [name, [over, want]] of Object.entries(STARRED)) {
        const got = [];
        for (const rangeM of BANDS_M) for (const size of [CARD_W, CARD_MIN]) got.push(digest(cardOf({ gear: RP, person: RP_PERSON, rec: recOf(RP, over), rangeM, words: 'X', size })));
        const same = got.filter((d, i) => d === want[i]).length;
        rows.push(`${name}: ${same} of ${want.length} cards v0.0.27's`);
        if (same !== want.length) bad.push(`${name}: ${got.join(' ')}`);
      }
      const kneel = POSE_BENDS.kneel, daze = POSE_BENDS.dazeKneel, was = JSON.stringify({ drop: 31, legs: { r: [1, 0], l: [0.25, 'fit'] } });
      const bends = { kneel: JSON.stringify(kneel), dazeKneel: JSON.stringify({ drop: daze.drop, legs: daze.legs }) };
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      the kneel's bend ${bends.kneel}; the kneeling daze's ${bends.dazeKneel}`);
      assert(!bad.length && bends.kneel === was && bends.dazeKneel === was, JSON.stringify({ bad, bends }));
    },
  },
  {
    name: 'the review of the picks, finding 2: a man side on (F4) fits the card at every size: standing, kneeling, cowering and sitting, either way, with a rifle or a P-12, at the three bands and at 200, 185 and 170 px, none of his pixels on the figure\'s last row above the words\' strip (red on the review\'s build: 31 to 35 there at 170 px, kneeling and cowering at 4 m)',
    fn() {
      const cases = [
        ['standing, aimed, right', RP, { facing: 'right', hold: { how: 'rifle-aim' }, aimAt: 'away' }],
        ['standing, low, left', RP, { facing: 'left', hold: { how: 'rifle-low' } }],
        ['standing, high, right', RP, { facing: 'right', hold: { how: 'rifle-high' } }],
        ['standing, P-12 aimed, left', RP_PISTOL, { facing: 'left', hold: { how: 'pistol-aim' }, aimAt: 'away' }],
        ['kneeling, aimed, right', RP, { facing: 'right', pose: 'kneel', hold: { how: 'rifle-aim' }, aimAt: 'away' }],
        ['kneeling, low, left', RP, { facing: 'left', pose: 'kneel', hold: { how: 'rifle-low' } }],
        ['kneeling, high, right', RP, { facing: 'right', pose: 'kneel', hold: { how: 'rifle-high' } }],
        ['cowering, left', RP, { facing: 'left', pose: 'cower', hold: { how: 'empty' } }],
        ['sitting, right', RP, { facing: 'right', pose: 'sit', hold: { how: 'rifle-low' } }],
      ];
      const rows = [], bad = [];
      for (const [name, gear, over] of cases) {
        const row = [];
        for (const rangeM of BANDS_M) for (const size of SIZES) {
          const c = cardOf({ gear, person: RP_PERSON, rec: recOf(gear, over), rangeM, words: 'X', size }), W = c.w, figH = W - wordsRows({ words: 'X' }, size).h;
          // (the ground of a row: its colour at column 2, the board's gradient; a figure pixel is any other, frame and edge columns left out)
          let fig = 0, last = 0;
          for (let y = 1; y < figH; y++) { const g = c.data[y * W + 2]; for (let x = 1; x < W - 1; x++) if (c.data[y * W + x] !== g) { fig++; if (y === figH - 1) last++; } }
          row.push(`${rangeM} m/${size}: ${fig}${last ? ` (${last} on the last row)` : ''}`);
          if (last || !fig) bad.push(`${name} ${rangeM} m at ${size} px: ${last} on the last row`);
        }
        rows.push(`${name}: ${row.join(', ')}`);
      }
      for (const r of rows.filter((r, i) => i % 2 === 0 || /last row/.test(r))) console.log(`      ${r}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'the review of the picks, finding 7: the corner-aid sample\'s words fit its picture, every line inside its width at both looks, the picture the size sample.json names (red on the review\'s build: A-b\'s bottom line ran past the right edge, "...A SHORT MARK 0.3 M INTO Y")',
    fn() {
      const scene = JSON.parse(readFileSync(`${root}/samples/corner-aid/scene.json`, 'utf8')), J = JSON.parse(readFileSync(`${root}/samples/corner-aid/sample.json`, 'utf8'));
      const rows = [], bad = [];
      for (const look of AID_LOOKS) {
        const P = aidPicture(look, scene), lines = P.report.lines ?? [], over = lines.filter(l => l.x + l.w > P.w - 1), view = J.groups[0].views.find(v => v.id === look);
        rows.push(`${look}: ${P.w} × ${P.h}, ${lines.length} lines, the widest ending at ${Math.max(...lines.map(l => l.x + l.w))} px; sample.json ${view?.pixel}`);
        if (!lines.length || over.length || view?.pixel !== `${P.w}x${P.h}`) bad.push(`${look}: ${JSON.stringify({ over, size: [P.w, P.h], pixel: view?.pixel })}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
