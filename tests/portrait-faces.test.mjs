// OLYMPUS tests: a man upside down to you, drawn as you see him (the build sheet v0.0.25 item 12, §3.4, §6 D portrait-faces; PC§5).
//
// The Seen record (src/sim/people/seen.js) gains roll: the quarter turns between his up and yours on your picture, from both bodies'
// faces (src/data/faces.js rollOf over FACE_QUARTERS: 0 on one face, 2 the deck and the deckhead, 1 or 3 across a side bulkhead), a
// board's by its stand's onFace (standSeen's { onFace, by }); in the key only when it is not 0, so every key of v0.0.18 to v0.0.24 is
// the string it was. The hit card draws the subject turned by it (R-a, samples/portrait-faces' default until scored: art/doll/
// hitcard.js through portrait.js turnFigure, the sample's own rule), the figure and all on him (his marks, their numbers, the zones)
// turned about the figure's box and centred, the ground's wash upright, a quarter turn halved where it would not fit; R-b draws him
// upright and names his face in the words. Pinned: the roll at every pair of faces; R-a's card the sample's turnCard of the upright
// card pixel for pixel (a half turn and a quarter turn), the words and the frame unmoved; the marks' centres carried through the
// turn; R-b the upright card; the keys of a pinned lane's men unchanged (no roll), and a man on the deckhead seen from the deck keyed
// roll 2. Quick. Fails without seen.js's roll or the card's turn.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { ON_FACES, rollOf } from '../src/data/faces.js';
import { seenOf, standSeen, seenKey } from '../src/sim/people/seen.js';
import { paintHitcard, wordsRows } from '../src/art/doll/hitcard.js';
import { rollDrawn, ROLL_FACE_WORDS, PORTRAIT_PICKS } from '../src/art/doll/portrait.js';
import { turnCard } from '../samples/portrait-faces/faces.js';
import { pic } from '../samples/portrait-lib/card.js';
import { rollWords } from '../src/ui/hud/target.js';
import { cardModel } from '../src/ui/hud/hitcard.js';

// (a card as the sample's picture, 0xrrggbb, to turn by its rule and compare)
const asPic = (c) => { const P = pic(c.w, c.h); P.blit(c, 0, 0); return P; };

// (a house board's card model as the target view builds it: the stand's record by standSeen, its subject keyed by its face and roll)
function boardModel(roll, { marks = [] } = {}) {
  const rec = standSeen('threat', 'rifle', { holds: 'rifle', state: null }, { rangeM: 3, onFace: roll === 2 ? 'deckhead' : roll === 1 ? 'starboard' : roll === 3 ? 'port' : null, by: null });
  const m = cardModel({ key: 'h1', k: 0, phase: 'belief', marks, words: 'H1', line: null }, { face: 'threat', holds: 'rifle', rangeM: 3 });
  return { ...m, subject: { kind: 'board', key: `threat|rifle${rec.roll ? `|r${rec.roll}` : ''}`, face: 'threat', holds: 'rifle', rec } };
}

export default [
  {
    name: 'the roll between two ups is the faces\' quarters on your picture at every pair: 0 on one face, 2 the deck and the deckhead (or the dorsal bulkhead), 1 or 3 across a side bulkhead',
    fn() {
      const lines = [];
      for (const v of ON_FACES) lines.push(`${v.padEnd(9)} ${ON_FACES.map(s => rollOf(v, s)).join(' ')}`);
      console.log(`      viewer \\ subject: ${ON_FACES.join(' ')}`);
      for (const l of lines) console.log(`      ${l}`);
      for (const v of ON_FACES) for (const s of ON_FACES) {
        const r = rollOf(v, s);
        assert(r >= 0 && r < 4 && (r + rollOf(s, v)) % 4 === 0, JSON.stringify({ v, s, r }));
      }
      assert(rollOf('deck', 'deckhead') === 2 && rollOf('deck', 'dorsal') === 2 && rollOf('deck', 'ventral') === 0 && rollOf('deck', 'starboard') === 1 && rollOf('deck', 'port') === 3 && rollOf(undefined, undefined) === 0, 'the table');
    },
  },
  {
    name: 'the record\'s roll from both bodies\' faces, keyed only when it turns the card: a pinned lane\'s men keep their keys; your #2 on the deckhead seen from the deck is roll 2 (and from the deckhead, 0); a board on the deckhead roll 2',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go' }), s = g.state;
      const two = s.armoury.range.house.twoPid, me = s.actors.list.find(a => a.who === s.player.id), him = s.actors.list.find(a => a.who === two);
      const before = seenOf(s, two, { by: s.player.id });
      assert(!('roll' in before) && !before.key.includes('roll') && before.key === seenKey({ ...before }), before.key);
      him.onFace = 'deckhead';
      const up = seenOf(s, two, { by: s.player.id, fresh: true });
      me.onFace = 'deckhead';
      const both = seenOf(s, two, { by: s.player.id, fresh: true });
      delete him.onFace;
      const meUp = seenOf(s, two, { by: s.player.id, fresh: true });
      delete me.onFace;
      const mirror = seenOf(s, s.player.id, { mirror: true });
      console.log(`      your #2 from you: ${before.key}`);
      console.log(`      on the deckhead: roll ${up.roll}, key …${up.key.slice(-12)}; both on it: roll ${both.roll ?? 0}; you on it, he on the deck: roll ${meUp.roll}`);
      assert(up.roll === 2 && up.key === `${before.key}|roll:2` && !('roll' in both) && both.key === before.key && meUp.roll === 2 && !('roll' in mirror), JSON.stringify({ up: up.roll, both: both.roll, meUp: meUp.roll }));
      const b0 = standSeen('threat', 'rifle', null, { rangeM: 3 }), b2 = standSeen('threat', 'rifle', null, { rangeM: 3, onFace: 'deckhead' }), bb = standSeen('threat', 'rifle', null, { rangeM: 3, onFace: 'deckhead', by: 'deckhead' });
      assert(!('roll' in b0) && b2.roll === 2 && b2.key === `${b0.key}|roll:2` && !('roll' in bb), JSON.stringify([b0.key, b2.key]));
    },
  },
  {
    name: 'R-a: a board upside down to you is the sample\'s turnCard of the upright card, pixel for pixel (a half turn, and a quarter turn on a side bulkhead), the words and the frame unmoved, its marks\' centres carried through the turn; R-b keeps it upright and names the face',
    fn() {
      const rows = [];
      for (const roll of [2, 1, 3]) {
        const up = paintHitcard(boardModel(0)), tc = paintHitcard(boardModel(roll)), upP = asPic(up), want = turnCard(upP, roll), got = asPic(tc);
        let diff = 0, fig = 0;
        for (let i = 0; i < want.P.col.length; i++) { if (want.P.col[i] !== got.col[i]) diff++; if (want.P.col[i] !== upP.col[i]) fig++; }
        rows.push(`roll ${roll}: ${diff} pixels from the sample's turn (${fig} moved from the upright), halved ${tc.halved}`);
        assert(tc.roll === roll && diff === 0 && fig > 0 && tc.halved === want.halved, JSON.stringify({ roll, diff, fig, halved: [tc.halved, want.halved] }));
      }
      const up = paintHitcard(boardModel(0)), figH = up.h - wordsRows(boardModel(0), up.size).h;
      console.log(`      the card ${up.w} × ${up.h}, the figure above row ${figH}; ${rows.join('; ')}`);
      // (the words and the frame: every pixel from the strip down and the frame the upright's)
      const dn = paintHitcard(boardModel(2));
      let moved = 0;
      for (let y = 0; y < up.h; y++) for (let x = 0; x < up.w; x++) if ((y >= figH || x === 0 || x === up.w - 1 || y === 0) && dn.data[y * up.w + x] !== up.data[y * up.w + x]) moved++;
      assert(moved === 0, `moved ${moved}`);
      // (the marks: rings at called points, carried through the turn with the card)
      const marks = [{ n: 1, called: [0, 0], seen: false }, { n: 2, called: [6, -14], seen: true }];
      const mu = paintHitcard(boardModel(0, { marks })), md = paintHitcard(boardModel(2, { marks }));
      const wantMarks = turnCard(asPic(mu), 2), got = asPic(md);
      let mdiff = 0;
      for (let i = 0; i < got.col.length; i++) if (got.col[i] !== wantMarks.P.col[i]) mdiff++;
      console.log(`      marks upright ${mu.marks.map(m => `${m.n}@${m.x},${m.y}`).join(' ')}; turned ${md.marks.map(m => `${m.n}@${m.x},${m.y}`).join(' ')}; ${mdiff} pixels from the sample's turn`);
      assert(mdiff === 0 && md.marks.length === 2 && md.marks.every((m, i) => m.y > mu.marks[i].y), JSON.stringify({ mdiff, got: md.marks }));
      // (R-b: upright, the face named)
      const Rb = { ...PORTRAIT_PICKS, roll: 'R-b' };
      const b = paintHitcard({ ...boardModel(2), picks: { roll: 'R-b' } });
      let diff = 0;
      for (let i = 0; i < b.data.length; i++) if (b.data[i] !== up.data[i]) diff++;
      console.log(`      R-b: ${diff} pixels from the upright card; its words "${rollWords('H1', { roll: 2 }, Rb)}"; R-a's "${rollWords('H1', { roll: 2 })}"`);
      // (v0.0.28, the user's stars of 2026-11-20 on R-a and R-b, joined: the default R-a card is turned and its words name his face
      // too; upright he is named by nothing; was 'H1' on R-a)
      assert(b.roll === 0 && diff === 0 && rollDrawn(2, Rb) === 0 && rollWords('H1', { roll: 2 }, Rb) === `${ROLL_FACE_WORDS[2]} · H1` && rollWords('H1', { roll: 2 }) === `${ROLL_FACE_WORDS[2]} · H1` && rollWords('H1', { roll: 1 }) === 'ON HIS SIDE · H1' && rollWords('H1', { roll: 0 }) === 'H1' && rollDrawn(2) === 2, JSON.stringify({ diff }));
    },
  },
];
