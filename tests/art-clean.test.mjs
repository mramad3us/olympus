// OLYMPUS tests: art-clean, "The window and the canopy"'s look as samples/armoury-day draws it (the build sheet v0.0.28 §1 C, item 20, §6 C, §10; F188's art half).
//
// The game builds the set's defaults until the user scores it (W-a, F-a, M-a, D-a), and each default has one home: the mat's five
// frames and the puff's three are the set's matFrame and puffFrame pixel for pixel at 16 px/m on M-a's olive (src/art/kit/vignette.js
// matCells and puffCells, MAT_LOOK), drawn by their nearest cells at 24; the weapon card's dirt at each band condWord gives is the set's
// D-a card pixel for pixel (src/art/weaponcard.js), "fine" and "wants the armourer" the card as v0.0.27 painted it byte for byte (its
// digest on the base tree, FINE_CARDS), a pistol's card clean at every band, and the band in the card's repaint key (steps.js
// BELIEF_FIELDS); the issue window's default make W-a's open counter (src/art/kit/armoury.js), its wall over the bay to the building's
// height and its opening clear from the sill to the head, W-b's grille over the opening's upper half; the other four pieces built at 16
// and 24 px/m. F-a (the basin's lean at the bench) is the stage's frame for the clean's activity (render/view.js, the lead's hunk), so
// not here. Quick. Fails with a default the game does not draw as the set does, a band the card ignores or a fine card that moved.
import { assert } from './helpers.mjs';
import { goldenDigest } from './golden.mjs';
import { unword } from '../src/art/paint.js';
import { piece, VIGNETTE_PIECES, MAT_LOOK, matCells, MAT_CELLS, PUFF_CELLS } from '../src/art/kit/vignette.js';
import { paintWeaponCard, cardParts, CARD_W, CARD_H, DIRT_BANDS } from '../src/art/weaponcard.js';
import { place, FOOTPRINTS } from '../src/art/kit/index.js';
import { HEAD_M, SILL_M, WINDOW_LOOK } from '../src/art/kit/armoury.js';
import { BELIEF_FIELDS } from '../src/ui/hud/steps.js';
import { MAT_FRAME_OF } from '../src/render/vignette-items.js';
import { recordingArea } from './kit-makers.test.mjs';
import { GROUPS, DEFAULTS, BANDS, MAT, PUFF, matFrame, puffFrame, picture, LABEL_H } from '../samples/armoury-day/armoury.js';
import { GAP } from '../samples/portrait-lib/card.js';

/** The fine cards' digest on the base tree 511f11c2 (v0.0.27 as integrated with stage 0): five beliefs × the R-7 and the P-12.
 *  Re-recorded in v0.0.28's carried stage, one cause: the P-12's trigger drawn the right way round (pistols.js bodyCard, the user's
 *  "sidearm trigger is backwards" of 2026-11-20; tests/trigger-way): 19d7fbdf443d45 → 1e0acf7929b4ae, the R-7's five cards unmoved. */
const FINE_CARDS = '1e0acf7929b4ae';
const FINE_BELIEFS = Object.freeze([
  { mag: 'in', count: 20, chamber: '?', mode: 'safe', port: 'shut' }, { mag: 'in', count: 20, chamber: '?', mode: 'safe', port: 'open' },
  { mag: 'in', count: 29, chamber: 'live', mode: 'semi', port: 'closed' }, { mag: 'out', chamber: 'empty', mode: 'safe', port: 'open', locked: true },
  { mag: 'in', count: null, chamber: 'case', mode: 'safe', port: 'open', stoppage: 'case' },
]);
const cards = (extra) => { const all = []; for (const b of FINE_BELIEFS) for (const model of ['r7', 'p12']) all.push(...paintWeaponCard({ model, belief: { ...b, ...extra } }).data); return new Uint32Array(all); };
const rgb = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);

export default [
  {
    name: 'the mat and the puff are samples/armoury-day M\'s pieces pixel for pixel at 16 px/m on M-a\'s olive (five parts in four pictures, together the strip\'s, 16 × 6; three, 6 × 6 of mist), drawn at 24 px/m by their nearest cells (24 × 10, 10 × 10); the cleaner\'s hands only at the mat\'s north corners',
    fn() {
      assert(DEFAULTS.M === 'M-a' && MAT_LOOK.mat === GROUPS.M.find(c => c.id === 'M-a').mat, JSON.stringify({ DEFAULTS, mat: MAT_LOOK.mat }));
      assert(MAT_CELLS[0] === MAT.px[0] && MAT_CELLS[1] === MAT.px[1] && VIGNETTE_PIECES.cleanMat.wM === MAT.w && VIGNETTE_PIECES.cleanMat.hM === MAT.d && VIGNETTE_PIECES.cleanMat.frames === MAT.frames.length - 1 && JSON.stringify(matFrame(4, MAT_LOOK.mat)) === JSON.stringify(matFrame(0, MAT_LOOK.mat)), JSON.stringify(VIGNETTE_PIECES.cleanMat));
      assert(VIGNETTE_PIECES.airPuff.wM === PUFF.m && VIGNETTE_PIECES.airPuff.frames === PUFF.frames && VIGNETTE_PIECES.airPuff.mist && !VIGNETTE_PIECES.cleanMat.mist && PUFF_CELLS === Math.round(PUFF.m * 16), JSON.stringify(VIGNETTE_PIECES.airPuff));
      const lines = [];
      for (const ppm of [16, 24]) {
        const sizes = [];
        for (let f = 0; f < 5; f++) {
          const pm = piece('cleanMat', { frame: MAT_FRAME_OF[f] }, ppm), g = matFrame(f, MAT_LOOK.mat), k = pm.w / 16;
          assert(pm.w === Math.round(MAT.w * ppm) && pm.h === Math.round(MAT.d * ppm), `${ppm}: the mat ${pm.w} × ${pm.h}`);
          let off = 0;
          for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) { const v = unword(pm.data[y * pm.w + x]); if (v.hole || v.hex !== g[Math.min(5, Math.floor(y * 6 / pm.h))][Math.min(15, Math.floor(x / k))]) off++; }
          assert(!off, `${ppm} px/m, the mat's frame ${f}: ${off} pixels off the set's`);
          sizes.push(`${pm.w}×${pm.h}`);
        }
        for (let f = 0; f < 3; f++) {
          const pm = piece('airPuff', { frame: f }, ppm), g = puffFrame(f);
          let off = 0, mist = 0;
          for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) { const v = unword(pm.data[y * pm.w + x]), c = g[Math.floor(y * g.length / pm.h)][Math.floor(x * g.length / pm.w)]; if (c === null ? !v.hole : v.hole || v.hex !== c) off++; if (!v.hole) mist++; }
          assert(!off && pm.w === Math.round(PUFF.m * ppm) && pm.mist, `${ppm} px/m, the puff's frame ${f}: ${off} off, ${pm.w} × ${pm.h}`);
          sizes.push(`puff ${f} ${pm.w}×${pm.h} ${mist} px`);
        }
        lines.push(`${ppm} px/m: ${sizes.join(', ')}`);
      }
      // (five different pictures, and the hands only at the corners)
      const keys = new Set([0, 1, 2, 3, 4].map(f => JSON.stringify(matFrame(f, MAT_LOOK.mat))));
      const plain = matCells(1), hands = matCells(1, MAT_LOOK.mat, 0xc48a62), changed = [];
      for (let y = 0; y < 6; y++) for (let x = 0; x < 16; x++) if (plain[y][x] !== hands[y][x]) changed.push([x, y]);
      assert(keys.size === 4 && changed.length === 8 && changed.every(([x, y]) => [1, 2, 13, 14].includes(x) && y <= 1), JSON.stringify({ distinct: keys.size, changed }));
      for (const l of lines) console.log(`      ${l}`);
      console.log(`      the mat's frames: ${keys.size} distinct pictures (the rifle whole at the strip and together, one picture, so four painted); the hands ${changed.length} pixels at the north corners`);
    },
  },
  {
    name: 'the weapon card\'s dirt is samples/armoury-day D-a\'s pixel for pixel at fine, gritty, fouled and wants cleaning; "fine" and "wants the armourer" the card as before byte for byte (R-7 and P-12, five beliefs); a pistol\'s card clean at every band; condWord in the card\'s repaint key',
    fn() {
      assert(DEFAULTS.D === 'D-a' && GROUPS.D[0].drawn && JSON.stringify(DIRT_BANDS) === JSON.stringify(BANDS.slice(1)), JSON.stringify({ DEFAULTS, DIRT_BANDS }));
      // (the set's D-a picture: its cards at GAP + i × (CARD_W + GAP), under its two label rows)
      const P = picture(new URLSearchParams('c=D-a')), y0 = GAP + 2 * LABEL_H, lines = [];
      BANDS.forEach((band, i) => {
        const belief = { mag: 'in', count: 20, chamber: '?', mode: 'safe', port: band === 'fine' ? 'shut' : 'open', condWord: band }, g = paintWeaponCard({ model: 'r7', belief }), X = GAP + i * (CARD_W + GAP);
        let off = 0, dirt = 0;
        const clean = paintWeaponCard({ model: 'r7', belief: { ...belief, condWord: 'fine' } });
        for (let y = 0; y < CARD_H; y++) for (let x = 0; x < CARD_W; x++) { const v = g.data[y * CARD_W + x]; if (P.get(X + x, y0 + y) !== rgb(v)) off++; if (v !== clean.data[y * CARD_W + x]) dirt++; }
        assert(!off && (band === 'fine' ? dirt === 0 : dirt > 20) && cardParts(belief).dirt === (band === 'fine' ? null : band), JSON.stringify({ band, off, dirt }));
        lines.push(`${band} ${dirt} px of dirt (the set's ${P.report.pieces[i].dirt})`);
      });
      // (fine as before: the base tree's digest; the armourer's word is wear, not dirt)
      const fine = goldenDigest(cards({ condWord: 'fine' })), none = goldenDigest(cards({})), worn = goldenDigest(cards({ condWord: 'wants the armourer' }));
      assert(fine === FINE_CARDS && none === FINE_CARDS && worn === FINE_CARDS, JSON.stringify({ fine, none, worn, want: FINE_CARDS }));
      // (a pistol's card at every band: clean)
      const pistol = DIRT_BANDS.map(b => goldenDigest(paintWeaponCard({ model: 'p12', belief: { ...FINE_BELIEFS[0], condWord: b } }).data)), p0 = goldenDigest(paintWeaponCard({ model: 'p12', belief: FINE_BELIEFS[0] }).data);
      assert(pistol.every(d => d === p0), JSON.stringify({ pistol, p0 }));
      // (the band reaches the card: in the repaint key, so a band's change paints it again)
      assert(BELIEF_FIELDS.includes('condWord'), JSON.stringify(BELIEF_FIELDS));
      console.log(`      ${lines.join('; ')}; the fine cards ${fine} (the base tree's ${FINE_CARDS}), with no word ${none}, wants the armourer ${worn}; the P-12's card at ${DIRT_BANDS.length} bands its clean one; condWord in BELIEF_FIELDS`);
    },
  },
  {
    name: 'the issue window (W-a\'s open counter by default, W-b\'s grille), the clearing barrel, the cleaning table, the solvent tank and the air hose build at 16 and 24 px/m; the window\'s counter to the sill, its wall over the bay from the head to the building\'s height, its opening clear between',
    fn() {
      assert(DEFAULTS.W === 'W-a' && FOOTPRINTS.issueWindow.makes[0] === 'counter' && FOOTPRINTS.issueWindow.makes.includes('grille') && !GROUPS.W[0].grille && GROUPS.W[1].grille, JSON.stringify({ DEFAULTS, makes: FOOTPRINTS.issueWindow.makes }));
      const lines = [];
      for (const ppm of [16, 24]) {
        for (const make of FOOTPRINTS.issueWindow.makes) {
          const a = recordingArea(ppm);
          place(a, { kind: 'issueWindow', make, x: 451.875, z: 212, face: 'down', look: { bayM: 1.2, headM: 4.0 }, seed: 1 });
          const bs = a.boxes.map(r => r.b), counter = bs[0], head = bs.find(b => Math.abs(b.y0 - HEAD_M) < 0.04 && Math.abs(b.y1 - 4.0) < 0.04);
          // (nothing but the grille between the sill and the head over the opening, toward the apron of the bay's back)
          const inOpening = bs.filter(b => b !== counter && b.y1 > SILL_M + 0.05 && b.y0 < HEAD_M - 0.05 && b.z1 > 210.9);
          assert(Math.abs(counter.y1 - SILL_M) < 0.04 && Math.abs(counter.z0 - 211.7) < 0.04 && Math.abs(counter.z1 - 212.3) < 0.04, JSON.stringify(counter));
          assert(head && Math.abs(head.z0 - 210.8) < 0.04 && Math.abs(head.z1 - 212) < 0.04 && Math.abs(head.x1 - head.x0 - 1.2) < 0.07, JSON.stringify(head));
          assert(make === 'grille' ? inOpening.length === 1 && Math.abs(inOpening[0].y0 - (SILL_M + HEAD_M) / 2) < 0.04 : !inOpening.length, JSON.stringify({ make, inOpening }));
          lines.push(`${ppm} px/m ${make}: ${bs.length} boxes, the counter to ${counter.y1.toFixed(3)} m, the wall ${head.y0.toFixed(3)} to ${head.y1.toFixed(3)} m over z ${head.z0} to ${head.z1}`);
        }
        for (const kind of ['clearingBarrel', 'cleanTable', 'solventTank', 'airHose']) for (const make of FOOTPRINTS[kind].makes) {
          const a = recordingArea(ppm);
          place(a, { kind, make, x: 10, z: 10, face: 'down', seed: 3 });
          const top = Math.max(...a.boxes.map(r => r.b.y1));
          assert(a.boxes.length >= 2 && top <= FOOTPRINTS[kind].h + 0.2, `${kind}/${make}: ${a.boxes.length} boxes to ${top}`);
          if (ppm === 16) lines.push(`${kind}/${make} ${a.boxes.length} boxes to ${top.toFixed(2)} m`);
        }
      }
      console.log(`      ${lines.join('; ')}; the window's colours ${Object.entries(WINDOW_LOOK).map(([k, v]) => `${k} ${v.toString(16)}`).join(', ')}`);
    },
  },
];
