// The KD's paper cards in the PAPER inset (quick; the build sheet 0.0.7 §5.5: "the group card (three holes on the zero
// card, the centre, the call in words and arrows) and the KD score card (the face with its holes and values, the
// string's total) from fixed kdNow's"; WEAPONS §11.1, §11.4).
//
// src/ui/cards/kd.js builds both on hud/paper.js faceModel, which places a hole given in the face's centimetres (x
// right, y down: paper.js's faces) at PAPER's pixels: the zero card 30 × 30 cm at 4 px a cm, the A face 100 × 100 cm
// at 1.3. Fed fixed kdNow records (the range role's shapes, its kdNow not called): the group card's three holes where
// their centimetres say, the earlier group dimmer, the centre a cross at the group's centreCm, the call's arrow from the
// centre to the zero card's mark (ZERO25_MARK_CM under the aim box), and under it "10 UP · 4 RIGHT", or "ZEROED ·
// LEAVE IT"; the score card's five holes each with its value beside it, no two values meeting, under it "300 M · 5 4 V
// 3 4" and "21 OF 25 · 1 V"; the live face as the pits marked it, the newest ringed. Every one fits the 200 px inset.
import { assert, fmt } from './helpers.mjs';
import { groupCardModel, kdScoreModel, kdLiveModel, callWords, stringLines } from '../src/ui/cards/kd.js';
import { faceModel, FACES, PAPER_PX, PAPER_K } from '../src/ui/hud/paper.js';

const GROUPS = [
  { holes: [{ at: [-2.1, 5.2], score: 3 }, { at: [-3.5, 6.8], score: 2 }, { at: [-1.4, 7.3], score: 2 }], centreCm: [-2.33, 6.43], call: { elev: 10, wind: 4, words: 'Ten up, four right.' }, ok: false },
  { holes: [{ at: [0.4, 3.2], score: 5 }, { at: [-0.3, 2.6], score: 5 }, { at: [0.2, 3.5], score: 4 }], centreCm: [0.1, 3.1], call: null, ok: true },
];
const STRING = { id: 'confirm', line: 300, paper: 'kdA', holes: [{ at: [4, -6], score: 5, n: 1 }, { at: [-12, 3], score: 4, n: 2 }, { at: [1, 1], score: 5, v: true, n: 3 }, { at: [18, 9], score: 3, n: 4 }, { at: [-2, 14], score: 4, n: 5 }], score: 21, of: 25, v: 1 };

export default [
  {
    name: 'the group card: three holes on the zero card where their centimetres put them (4 px a cm), the centre a cross, the call an arrow from it to the mark and "10 UP · 4 RIGHT" under it; zeroed, "ZEROED · LEAVE IT"',
    fn() {
      const m = groupCardModel(GROUPS.slice(0, 1), { lane: 4 });
      const { cx, cy, k, size } = m.face;
      console.log(`      the zero card ${size} px (${fmt(k, 2)} px a cm), the mark at (${fmt(m.mark.x - cx, 1)}, ${fmt(m.mark.y - cy, 1)}) px from the centre; holes ${m.holes.map(h => `(${fmt((h.x - cx) / k, 1)}, ${fmt((h.y - cy) / k, 1)})`).join(' ')} cm`);
      console.log(`      centre (${fmt((m.centre.x - cx) / k, 2)}, ${fmt((m.centre.y - cy) / k, 2)}) cm; arrow ${JSON.stringify(Object.fromEntries(Object.entries(m.arrow).map(([a, v]) => [a, Math.round(v)])))}; under it: ${m.scoreLines.join(' | ')}; ${m.words}`);
      assert(k === PAPER_K && size === 120, `${k} / ${size}`);
      GROUPS[0].holes.forEach((h, i) => { assert(Math.abs(m.holes[i].x - (cx + h.at[0] * k)) < 1e-9 && Math.abs(m.holes[i].y - (cy + h.at[1] * k)) < 1e-9, JSON.stringify(m.holes[i])); });
      assert(Math.abs(m.mark.y - (cy + FACES.zero25.markCm[1] * k)) < 1e-9 && m.mark.x === cx, JSON.stringify(m.mark));
      assert(m.arrow.x0 === m.centre.x && m.arrow.y1 === m.mark.y && m.arrow.y1 < m.arrow.y0 && m.arrow.x1 > m.arrow.x0, `a low-left group's arrow points up and right: ${JSON.stringify(m.arrow)}`);
      assert(m.scoreLines[0] === '10 UP · 4 RIGHT' && /group 1: 3 holes/.test(m.words), JSON.stringify(m.scoreLines));
      const z = groupCardModel(GROUPS, { lane: 4 });
      console.log(`      two groups: ${z.holes.filter(h => h.old).length} earlier holes dimmer, ${z.holes.filter(h => !h.old).length} fresh; under it: ${z.scoreLines.join(' | ')}`);
      assert(z.holes.filter(h => h.old).length === 3 && z.holes.filter(h => !h.old).length === 3 && z.scoreLines[0] === 'ZEROED · LEAVE IT' && z.label === 'LANE 4 · GROUP 2', JSON.stringify(z.scoreLines));
      assert(callWords({ elev: -3, wind: 0 }) === '3 DOWN' && callWords({ elev: 0, wind: -2 }) === '2 LEFT' && callWords({ elev: 0, wind: 0 }) === 'ON', 'the call in words');
    },
  },
  {
    name: 'the KD score card: the A face fitted to PAPER (130 px, 1.3 px a cm), every hole with its value beside it (no two values meeting), the string "300 M · 5 4 V 3 4" and its total "21 OF 25 · 1 V" under it, all inside the 200 px inset',
    fn() {
      const m = kdScoreModel(STRING, { lane: 10 });
      const { cx, cy, k, size, y } = m.face;
      const labels = m.holes.map(h => ({ x: h.lx, y: h.ly, w: 7, h: 10, t: h.label }));
      let meets = 0;
      for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) { const a = labels[i], b = labels[j]; if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) meets++; }
      console.log(`      ${m.label}: ${size} px at ${fmt(k, 2)} px a cm, rings ${m.rings.map(r => fmt(r.r, 1)).join(', ')} px, the black ${fmt(m.blackR, 1)} px; values ${labels.map(l => `${l.t}@(${Math.round(l.x)},${Math.round(l.y)})`).join(' ')}; ${meets} meeting`);
      console.log(`      under it: ${m.scoreLines.join(' | ')}; the face's foot at ${y + size} px, the last line's at ${y + size + 6 + 2 * 12} of ${PAPER_PX}`);
      assert(size === 130 && Math.abs(k - 1.3) < 1e-9 && Math.abs(m.blackR - 15 * 1.3) < 1e-9 && Math.abs(m.rings[4].r - 30 * 1.3) < 1e-9, JSON.stringify({ size, k }));
      assert(m.holes.length === 5 && m.holes.map(h => h.label).join(' ') === '5 4 V 3 4' && meets === 0, JSON.stringify(labels));
      STRING.holes.forEach((h, i) => assert(Math.abs(m.holes[i].x - (cx + h.at[0] * k)) < 1e-9 && Math.abs(m.holes[i].y - (cy + h.at[1] * k)) < 1e-9, `hole ${i}`));
      assert(m.scoreLines.join(' | ') === '300 M · 5 4 V 3 4 | 21 OF 25 · 1 V', m.scoreLines.join(' | '));
      assert(y + size + 6 + 2 * 12 <= PAPER_PX, 'two lines fit under the face');
      assert(JSON.stringify(stringLines({ line: 200, holes: [{ at: [0, 0], score: 5 }, { at: null, score: 0 }], score: 5, of: 10 })) === JSON.stringify(['200 M · 5 -', '5 OF 10']), 'a miss is a dash');
    },
  },
  {
    name: 'the live face as the pits marked it: the marked holes in their centimetres, the newest ringed, the string so far under it; a hole off the paper is left off',
    fn() {
      const pit = { up: 1, phase: 'up', spotter: [-4.1, -7.9], holes: [{ at: [6, 2], score: 5, n: 1 }, { at: [-4.1, -7.9], score: 4, n: 2 }, { at: [70, 0], score: 0, n: 3 }] };
      const m = kdLiveModel(pit, { lane: 10, line: 300, str: { line: 300, holes: pit.holes } });
      console.log(`      ${m.words}; newest ${m.holes.filter(h => h.newest).map(h => `(${fmt((h.x - m.face.cx) / m.face.k, 1)}, ${fmt((h.y - m.face.cy) / m.face.k, 1)})`).join('')}`);
      assert(m.holes.length === 2 && m.holes.filter(h => h.newest).length === 1 && Math.abs(m.holes[1].x - (m.face.cx - 4.1 * m.face.k)) < 1e-9 && m.holes[1].newest, JSON.stringify(m.holes));
      assert(m.scoreLines[0] === '300 M · 5 4 -' && m.label === 'TARGET 10 · 300 M', JSON.stringify(m.scoreLines));
      const z = faceModel('zero25', { holes: [{ at: [1, 1] }] });
      assert(z.grid === 4 && z.box === 10 && !z.rings.length, JSON.stringify({ grid: z.grid, box: z.box }));
    },
  },
];
