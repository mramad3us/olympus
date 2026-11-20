// OLYMPUS tests: going down a deck explained (v0.0.28; the user's note of 2026-11-20 on samples/wreck-faces X: "I don't know what I'm
// looking at, make an effort to explain what I'm looking at please."). In the sample, X's pictures open with the trunk side on and
// caption every frame (DECK 5, THE WIPE or THE CUT and THE GLIDE, DECK 6), deck 6 drawn on the new defaults (the round hatch, no
// footprint dashed under the scuttle overhead), and the words name what is drawn: the scuttle overhead is H-b's grey ring, not v0.0.25's
// yellow square (the review of the picks). The game is unchanged: X-a stays the game's until scored (the triage), so no toast is added
// on the deck change. Each case fails without its change.
import { readFileSync } from 'node:fs';
import { assert, root } from './helpers.mjs';
import { picture, SIZE, DEFAULTS, X_LAST_WORDS } from '../samples/wreck-faces/faces.js';
import { YELLOW_C, BAR_C } from '../samples/void-look/deck.js';
import { tone } from '../src/art/tone.js';

export default [
  {
    name: 'wreck-faces X explained: both looks drawn at their size with the trunk side on at the left and every frame captioned, first DECK 5 and last DECK 6, X-a\'s middle THE WIPE, X-b\'s THE CUT then THE GLIDE',
    fn() {
      const out = {};
      for (const c of ['X-a', 'X-b']) { const P = picture(new URLSearchParams(`x=${c}`)); out[c] = { size: [P.w, P.h], captions: P.report.frames.map(f => f.caption) }; }
      console.log(`      ${JSON.stringify(out)}`);
      const a = out['X-a'].captions, b = out['X-b'].captions;
      assert(JSON.stringify(out['X-a'].size) === JSON.stringify(SIZE.x) && a.length === 7 && a[0] === 'DECK 5' && a[6] === 'DECK 6' && a.slice(1, 6).every(x => x === 'THE WIPE') && b[1] === 'THE CUT' && b.slice(2, 6).every(x => x === 'THE GLIDE') && SIZE.x[0] > 592, JSON.stringify(out));
    },
  },
  {
    name: 'the review of the picks, finding 3: X\'s words name the picture as drawn: the scuttle overhead is the grey ring (H-b, the game\'s), no yellow pixel in the X pictures, the words say no yellow square or ring, and the set\'s text names the game\'s K-a, P-b and H-b, not v0.0.25\'s K-b, P-a and H-a as defaults (red on the review\'s build: "UNDER THE YELLOW SQUARE", the side section\'s scuttles yellow, "K (the default K-b)")',
    fn() {
      const yellow = new Set([YELLOW_C, tone(YELLOW_C, -0.12)]), grey = tone(BAR_C, -0.1), rows = {};
      for (const c of ['X-a', 'X-b']) {
        const P = picture(new URLSearchParams(`x=${c}`));
        let y = 0, g = 0;
        for (const v of P.col) { if (yellow.has(v)) y++; if (v === grey) g++; }
        rows[c] = { yellowPx: y, greyRimPx: g };
      }
      const J = JSON.parse(readFileSync(`${root}/samples/wreck-faces/sample.json`, 'utf8')), X = J.groups.find(g => g.id === 'X');
      const text = `${J.about} ${X.about} ${X_LAST_WORDS}`.toUpperCase();
      const said = { lastWords: X_LAST_WORDS, yellowWords: /YELLOW (SQUARE|RING)|SCUTTLES IN YELLOW/.test(text), greyRing: /GREY RING/.test(X_LAST_WORDS) && /GREY RING/i.test(X.about), staleDefaults: /THE DEFAULT K-B|P \(P-A\)|H \(H-A\)/.test(text), defaults: DEFAULTS };
      console.log(`      ${JSON.stringify(rows)}`);
      console.log(`      ${JSON.stringify(said)}`);
      assert(Object.values(rows).every(r => r.yellowPx === 0 && r.greyRimPx > 0) && !said.yellowWords && said.greyRing && !said.staleDefaults && DEFAULTS.k === 'K-a' && DEFAULTS.p === 'P-b' && DEFAULTS.h === 'H-b', JSON.stringify({ rows, said }));
    },
  },
  {
    name: 'the review of the picks, finding 9: no toast is added on the deck change (X-a stays the game\'s until scored, the triage): main.js\'s hatch handler puts up no deck words and ui/ship-words.js exports no deckWords',
    fn() {
      const main = readFileSync(`${root}/src/main.js`, 'utf8'), words = readFileSync(`${root}/src/ui/ship-words.js`, 'utf8');
      const hatch = main.slice(main.indexOf("bus.on('hatch'"), main.indexOf('});', main.indexOf("bus.on('hatch'")));
      const found = { deckWords: /deckWords/.test(main) || /deckWords/.test(words), toastInHatch: /toast\(/.test(hatch) };
      console.log(`      ${JSON.stringify(found)}`);
      assert(!found.deckWords && !found.toastInHatch && hatch.length > 0, JSON.stringify(found));
    },
  },
];
