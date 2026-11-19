// OLYMPUS tests: the To score page's card picks repaint the card shown (the code review of v0.0.23, its fifth finding).
//
// The DOM card (src/ui/hud/hitcard.js createHitcard) paints only when its signature changes. The signature left out m.picks (the
// target card's picks, state.$look.card: Card gun G1 to G3, Hands not read, Aimed, Pistol aimed), and a board's subject key is
// `${face}|${holds}`, a man's `${who}|${rec.key}`: neither carries them, so a pick made on the To score page left the card shown as
// it was until something else in it changed. Driven with a stand-in document and paint counter in node; fails without m.picks in
// the signature.
import { assert } from './helpers.mjs';
import { createHitcard } from '../src/ui/hud/hitcard.js';

function fakeDoc() {
  const el = (tag) => ({ tag, dataset: {}, style: {}, kids: [], hidden: false, append(...k) { this.kids.push(...k); }, getContext: () => ({ putImageData() {} }) });
  return { createElement: el };
}

export default [
  {
    name: 'a card shown repaints when the To score page\'s card picks change (Card gun G2 for G1), and not when nothing it draws changed',
    fn() {
      const was = { document: globalThis.document, ImageData: globalThis.ImageData };
      globalThis.document = fakeDoc();
      globalThis.ImageData = globalThis.ImageData ?? function ImageData(data, w, h) { this.data = data; this.width = w; this.height = h; };
      try {
        let painted = 0;
        const card = createHitcard({ append() {} }, { paint: (m) => { painted++; return { data: new Uint32Array(4), w: 2, h: 2, marks: [] }; } });
        const m = (picks) => ({ look: 'h', man: null, key: 'r1:2a', k: 0, face: 'threat', holds: 'rifle', phase: 'belief', marks: [], words: 'THREAT · 2A', line: null, tabs: [], rangeM: 4.2,
          subject: { kind: 'board', key: 'threat|rifle', face: 'threat', holds: 'rifle' }, ...(picks ? { picks } : {}) });
        card.update(m({ gun: 'G1' })); const a = painted;
        card.update(m({ gun: 'G1' })); const b = painted;
        card.update(m({ gun: 'G2' })); const c = painted;
        card.update(m({ gun: 'G2', aim: 'A2' })); const d = painted;
        console.log(`      paints: first ${a}, the same again ${b}, Card gun G2 ${c}, Aimed A2 too ${d}`);
        assert(a === 1 && b === 1 && c === 2 && d === 3, JSON.stringify({ a, b, c, d }));
      } finally { globalThis.document = was.document; globalThis.ImageData = was.ImageData; }
    },
  },
];
