// The rifles' drawings (quick; src/art/rifles.js, samples/guns). The user's scores of 2026-11-08 (DESIGN.md's log, the user's
// gallery picks): G2 ★ 95 "make this the standard issue. Just get rid of the green arch it serves no purpose ... I would prefer
// this gun with the scope of the V1, for short and mid range engagements"; G1 kept as an alternate, "not R-7 replacement"; G0
// "Purge it from used assets"; V1 kept; M1 "Long gun standard for marksmanship for sure".
//
// The R-7 is drawn as r7: the model, a look with no drawing and the drawing r7 give the same pixels, on the card, the figure and
// the doll; the R-7M as m1; G0 is gone. r7 is g1 from the bore down (the standard issue's body) and v1 at its sight (the carry
// handle and the box, to the pixel), with the SO-4's flip magnifier behind the box, in line at the believed 4× and swung down at
// 1× (v1 has none: no pixel behind its box moves with the lever); the turrets sit on the box. No card draws a sling. Every design
// in every finish (src/data/finishes.js) paints the card in every belief with the state parts at the same stations and one
// silhouette whatever the finish; its figure template keeps GUNS.rifle's stations and draws in every pose and facing, its letters
// coloured and held at their base tone. A clear magazine shows the believed rounds through it; seen end on, the furniture shows
// round the muzzle. The Corps' black is clear of the ink outline, lit, with no red on it. The HAD-30 on the card is 9 px wide,
// curving 5, as scored with G2.
import { assert, fmt } from './helpers.mjs';
import { RIFLE_DESIGNS, DESIGN_IDS, DRAWN_AS, drawingOf, HELD_LETTERS, FURN, FURN_L, FURN_D, CLEAR, MAGNIFIER_AT_M } from '../src/art/rifles.js';
import { FINISH_IDS, FINISHES } from '../src/data/finishes.js';
import { paintWeaponCard, CARD_W, CARD_H, CARD_PX_PER_M, MAG_SHOWN_M, MAG_W_PX, MAG_CURVE_PX } from '../src/art/weaponcard.js';
import { GUNS } from '../src/art/figures/templates.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { shade } from '../src/art/figures/shade.js';
import { wear, coloursOf } from '../src/art/figures/outfits.js';
import { doll } from '../src/art/doll/doll.js';
import { PALETTES, nearest, INK } from '../src/art/palette.js';
import { rgbOf } from '../src/art/tone.js';

const BELIEFS = [
  {}, { mag: 'in', count: 28, chamber: 'live', mode: 'semi' }, { mag: 'out', chamber: '?', port: 'open', locked: true, mode: 'auto' },
  { mag: 'in', count: 12, countApprox: true, magLoad: 'tracer', stoppage: 'case', port: 'open' }, { mag: 'in', count: 0, stoppage: 'double', port: 'open' },
  { mag: 'out', hand: { n: 5, load: 'tracer' }, stoppage: 'click' }, { mag: 'in', count: 3, optic: 4, sight: { elev: -3, wind: 1 }, dope: { 300: { elev: -3, wind: 0 } } },
];
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const rgb = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);
const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
const lum = (c) => { const [r, g, b] = rgbOf(c); return 0.3 * r + 0.59 * g + 0.11 * b; };
/** The card's rifle placement (weaponcard.js X0, Y0): metres from the butt to x. */
const X0 = 22, Y0 = 56, at = (m) => X0 + Math.round(m * CARD_PX_PER_M);
const px = (d, x, y) => rgb(d[y * CARD_W + x]);
/** Pixels differing between two cards in a box [x0, x1) × [y0, y1). */
const differ = (a, b, x0 = 0, x1 = CARD_W, y0 = 0, y1 = CARD_H) => { let n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (a[y * CARD_W + x] !== b[y * CARD_W + x]) n++; return n; };

export default [
  {
    name: 'the R-7 is drawn as the standard issue the user picked (DRAWN_AS r7 → r7, the R-7M → m1, G0 purged): the model, a look with no drawing, the drawing r7 and the Corps\' black give the same card, figure and doll',
    fn() {
      assert(DRAWN_AS.r7 === 'r7' && DRAWN_AS.r7m === 'm1' && drawingOf('r7').id === 'r7' && drawingOf('r7m').id === 'm1' && drawingOf('nonesuch').id === 'r7' && !RIFLE_DESIGNS.g0 && !RIFLE_DESIGNS.g2, JSON.stringify({ DRAWN_AS, ids: DESIGN_IDS }));
      assert(drawingOf('r7') === drawingOf('r7', 'black') && drawingOf('r7', 'nonesuch') === drawingOf('r7') && drawingOf('r7').finish === 'black', 'the issue\'s finish is the default');
      for (const belief of BELIEFS) {
        const a = paintWeaponCard({ belief }), b = paintWeaponCard({ model: 'r7', belief }), c = paintWeaponCard({ drawing: 'r7', finish: 'black', belief });
        assert(same(a.data, b.data) && same(a.data, c.data), `the R-7's card differs for ${JSON.stringify(belief)}`);
      }
      let frames = 0;
      for (const frame of ['aim', 'prone', 'kneel', 'lowReady', 'slungBack', 'magout']) for (const dir of ['right', 'left', 'down', 'up']) {
        const L0 = wear({ outfit: 'utilities', weapon: 'rifle' }), L1 = wear({ outfit: 'utilities', weapon: 'rifle', model: 'r7', finish: 'black' });
        const p0 = shade(composeFrame(L0, dir, frame, { ppm: 16 }).cells, coloursOf(L0, 16)), p1 = shade(composeFrame(L1, dir, frame, { ppm: 16 }).cells, coloursOf(L1, 16));
        assert(same(p0.data, p1.data), `the R-7 on the figure differs: ${frame} ${dir}`);
        frames++;
      }
      const d0 = doll({ look: { outfit: 'utilities' }, hand: 'rifle', scale: 1 }), d1 = doll({ look: { outfit: 'utilities', model: 'r7', finish: 'black' }, hand: 'rifle', scale: 1 });
      assert(same(d0.data, d1.data), 'the doll\'s R-7 differs');
      console.log(`      ${BELIEFS.length} beliefs on the card, ${frames} frames, the doll: the R-7 as r7 in the Corps' black; designs ${DESIGN_IDS.join(', ')}`);
    },
  },
  {
    name: 'r7 is g1 from the bore down and v1 at its sight: no pixel differs from g1\'s card under the bore, its box is v1\'s to the pixel, and the flip magnifier behind it moves with the believed lever (in line at 4×, swung down at 1×) where v1\'s card does not',
    fn() {
      const b = { mag: 'in', count: 28, chamber: 'live', mode: 'semi' };
      const r7 = paintWeaponCard({ drawing: 'r7', belief: b }).data, g1 = paintWeaponCard({ drawing: 'g1', finish: 'black', belief: b }).data, v1 = paintWeaponCard({ drawing: 'v1', belief: b }).data;
      const below = differ(r7, g1, 0, CARD_W, Y0, CARD_H);
      const [bx0, bx1, by0, by1] = [at(0.35), at(0.49), Y0 - 28, Y0 - 20], box = differ(r7, v1, bx0, bx1, by0, by1), boxPx = (bx1 - bx0) * (by1 - by0);
      // (the magnifier's room behind the box, clear of the distance rows' words: the lever at 1× and at 4× on the near line)
      const room = [at(MAGNIFIER_AT_M[0]) - 3, at(0.35), Y0 - 30, Y0 - 16];
      const one = (d) => paintWeaponCard({ drawing: d, belief: { ...b, optic: 1 } }).data, four = (d) => paintWeaponCard({ drawing: d, belief: { ...b, optic: 4 } }).data;
      const r7Moves = differ(one('r7'), four('r7'), ...[room[0], room[1], room[2], room[3]]), v1Moves = differ(one('v1'), four('v1'), room[0], room[1], room[2], room[3]);
      // (in line at 4×: the magnifier's glass at its front, on the box's axis; at 1× that row is the card's wall)
      const glassAt = (d) => px(d, at(MAGNIFIER_AT_M[1]), Y0 - 25);
      // (the turrets on the box at distance: the elevation's over its hood, the windage's at its front)
      const far = paintWeaponCard({ drawing: 'r7', belief: { ...b, optic: 4, sight: { elev: -3, wind: 1 } }, distance: true }).data;
      const S = drawingOf('r7').card({ px: () => {}, at, M: (m) => Math.round(m * CARD_PX_PER_M), Y0, optic: 4 });
      console.log(`      under the bore: ${below} px differ from g1's; the box (${bx1 - bx0} × ${by1 - by0}): ${box} of ${boxPx} px differ from v1's; behind the box, 1× against 4×: r7 ${r7Moves} px, v1 ${v1Moves}; the magnifier's front glass ${hex(glassAt(four('r7')))} at 4×, ${hex(glassAt(one('r7')))} at 1×; the turrets at x ${S.turrets.e[0]} (hood, y ${S.turrets.e[1]}) and ${S.turrets.w[0]} (front), the box ${bx0} to ${bx1 - 1}, the magnifier ${at(MAGNIFIER_AT_M[0])} to ${at(MAGNIFIER_AT_M[1]) - 1}`);
      assert(below === 0 && box === 0 && r7Moves > 40 && v1Moves === 0, JSON.stringify({ below, box, r7Moves, v1Moves }));
      const GLASSES = [0x3c5d84, 0xb8d8ec];
      assert(GLASSES.includes(glassAt(four('r7'))) && !GLASSES.includes(glassAt(one('r7'))), 'the magnifier\'s glass in line at 4× only');
      assert(S.turrets.e[0] >= bx0 && S.turrets.e[0] + 7 <= bx1 && S.turrets.e[1] + 5 > by0 && S.turrets.w[0] >= bx1 - 1 && S.turrets.w[0] > at(MAGNIFIER_AT_M[1]), JSON.stringify(S.turrets));
      assert(differ(far, four('r7')) > 0, 'the turrets drawn at distance');
    },
  },
  {
    name: 'no green arch on any card (the user, 2026-11-08: "get rid of the green arch it serves no purpose"): no design in the Corps\' black has a pixel of the old sling\'s green, and under the stock is only the card\'s wall and floor',
    fn() {
      const SLING = 0x4c633d, rows = [];
      for (const id of DESIGN_IDS) {
        const d = paintWeaponCard({ drawing: id, belief: BELIEFS[1] }).data;
        let green = 0;
        for (const v of d) if (rgb(v) === SLING) green++;
        // (where the arch hung: from the stock's middle back, below the stock's own shadow)
        const under = new Set();
        for (let y = Y0 + 17; y < Y0 + 27; y++) for (let x = at(0.06); x < at(0.22); x++) under.add(px(d, x, y));
        rows.push(`${id}: ${green} green pixels; under the stock ${[...under].map(hex).join(' ')}`);
        assert(green === 0 && under.size <= 2 && ![...under].some(c => c === SLING), rows.at(-1));
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'every design in every finish paints the card in every belief, opaque, the state parts at the same stations (the well, the selector), one silhouette whatever the finish (its ink outline the same pixels)',
    fn() {
      const rows = [];
      for (const id of DESIGN_IDS) {
        const inks = new Map();
        for (const f of FINISH_IDS) for (const [i, belief] of BELIEFS.entries()) {
          const c = paintWeaponCard({ drawing: id, finish: f, belief, distance: !!belief.optic, line: belief.optic ? 300 : null });
          assert(c.w === CARD_W && c.h === CARD_H && c.data.every(v => (v >>> 24) === 255), `${id} ${f}: not an opaque ${CARD_W} × ${CARD_H} card`);
          const ink = []; c.data.forEach((v, k) => { if (rgb(v) === INK) ink.push(k); });
          const key = ink.join(',');
          if (!inks.has(i)) inks.set(i, key);
          assert(inks.get(i) === key, `${id} in ${f}: its silhouette moved for belief ${i}`);
        }
        const inn = paintWeaponCard({ drawing: id, belief: { mag: 'in', count: 30 } }).data, out = paintWeaponCard({ drawing: id, belief: { mag: 'out' } }).data;
        const wellMoves = [0, 1, 2, 3, 4].some(dy => px(inn, at(0.40) + 3, Y0 + 12 + dy) !== px(out, at(0.40) + 3, Y0 + 12 + dy));
        const safe = paintWeaponCard({ drawing: id, belief: { mode: 'safe' } }).data, semi = paintWeaponCard({ drawing: id, belief: { mode: 'semi' } }).data;
        const sx = at(0.30), sy = Y0 + 4, leverMoves = px(safe, sx + 4, sy) !== px(semi, sx + 4, sy) && px(safe, sx, sy - 4) !== px(semi, sx, sy - 4);
        rows.push(`${id} ${RIFLE_DESIGNS[id].lenM} m: ${FINISH_IDS.length} finishes × ${BELIEFS.length} beliefs, one silhouette; well ${wellMoves ? 'ok' : 'MISSING'}, selector ${leverMoves ? 'ok' : 'MISSING'}`);
        assert(wellMoves && leverMoves, `${id}: the state parts are not at the stations`);
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'a finish colours the card: each finish\'s furniture base is on every design\'s card in that finish',
    fn() {
      const rows = [];
      for (const id of DESIGN_IDS) {
        const counts = FINISH_IDS.map(f => { const d = paintWeaponCard({ drawing: id, finish: f, belief: BELIEFS[1] }).data; let n = 0; for (const v of d) if (rgb(v) === FINISHES[f].F) n++; return n; });
        rows.push(`${id}: ${FINISH_IDS.map((f, i) => `${f} ${counts[i]}`).join(', ')} px of the finish's base`);
        assert(counts.every(n => n > 60), rows.at(-1));
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'a clear magazine shows the believed rounds through it: brass for 30, none for 0, about half for 15, frosted with no brass when the count is not known; its noses zigzag',
    fn() {
      const brassOf = (belief) => {
        const d = paintWeaponCard({ drawing: 'v1', belief }).data;
        let n = 0;
        for (let y = 66; y < 92; y++) for (let x = 78; x < 98; x++) { const c = px(d, x, y); if (c === 0xd0ac5e || c === 0xf0d48a) n++; }
        return n;
      };
      const full = brassOf({ mag: 'in', count: 30 }), half = brassOf({ mag: 'in', count: 15 }), none = brassOf({ mag: 'in', count: 0 }), unknown = brassOf({ mag: 'in', count: null });
      console.log(`      brass pixels in the clear magazine: 30 → ${full}, 15 → ${half}, 0 → ${none}, unknown → ${unknown}`);
      assert(full > 50 && none === 0 && unknown === 0 && half > full * 0.35 && half < full * 0.65, JSON.stringify({ full, half, none, unknown }));
      const d = paintWeaponCard({ drawing: 'v1', belief: { mag: 'in', count: 30, magLoad: 'tracer' } }).data, tips = [];
      for (let y = 66; y < 92; y++) for (let x = 78; x < 98; x++) if (px(d, x, y) === 0xc23b2e) tips.push([x, y]);
      const has = (x, y) => tips.some(([x2, y2]) => x2 === x && y2 === y);
      const stacked = tips.filter(([x, y]) => has(x, y + 1)).length, runs = tips.filter(([x, y]) => has(x, y + 1) && has(x, y + 2)).length;
      console.log(`      tracer noses: ${tips.length}, ${stacked} directly above another, ${runs} runs of three`);
      assert(tips.length >= 15 && runs === 0 && stacked <= tips.length / 4, JSON.stringify({ tips: tips.length, stacked, runs }));
    },
  },
  {
    name: 'seen end on, every design shows its furniture round its muzzle, black round the bore, no steel',
    fn() {
      const rows = [];
      for (const id of DESIGN_IDS) {
        const L = wear({ outfit: 'utilities', weapon: 'rifle', model: id });
        let furn = 0, steel = 0;
        for (const frame of ['aim', 'kneel']) for (const row of composeFrame(L, 'down', frame, { ppm: 16 }).cells) for (const c of row) { if (c?.ch === FURN) furn++; if (c?.ch === 'v') steel++; }
        rows.push(`${id}: ${furn} furniture, ${steel} steel pixels facing the camera (aimed and kneeling)`);
        assert(RIFLE_DESIGNS[id].fig.furn && furn > 0 && steel === 0, rows.at(-1));
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'every finish\'s colours are the Mars palette\'s own, so the stage\'s snap leaves them, and through every place\'s palette each ramp stays in order',
    fn() {
      const rows = [];
      for (const f of FINISH_IDS) {
        const C = drawingOf('r7', f).colours;
        for (const ch of [FURN, FURN_L, FURN_D, CLEAR]) assert(PALETTES.mars.includes(C[ch]), `${f}: ${ch} ${hex(C[ch])} is not a Mars colour`);
        for (const place of ['mars', 'ship', 'europa']) {
          const [l, b, d] = [FURN_L, FURN, FURN_D].map(ch => nearest(C[ch], PALETTES[place]));
          assert(lum(l) > lum(b) && lum(b) > lum(d), `${f} on ${place}: ${[l, b, d].map(hex)} out of order`);
        }
        rows.push(`${f}: ${[FURN_L, FURN, FURN_D].map(ch => hex(C[ch])).join(' ')}`);
      }
      console.log(`      ${rows.join('; ')}`);
    },
  },
  {
    name: 'the Corps\' black (the user, 2026-11-08: "the Corps red and black", armour black): its furniture the darkest, clear of the ink outline after every place\'s snap, its top lit, and no red on the card',
    fn() {
      const B = drawingOf('r7', 'black').colours, rows = [];
      const others = FINISH_IDS.filter(f => f !== 'black').map(f => lum(FINISHES[f].F));
      for (const place of ['mars', 'ship', 'europa']) {
        const [l, b] = [FURN_L, FURN].map(ch => nearest(B[ch], PALETTES[place])), ink = nearest(INK, PALETTES[place]);
        rows.push(`${place}: lit ${hex(l)} (${lum(l).toFixed(2)}), base ${hex(b)} (${lum(b).toFixed(2)}), ink ${hex(ink)} (${lum(ink).toFixed(2)})`);
        assert(lum(b) - lum(ink) > 0.12 && lum(l) > lum(b), `${place}: the black is lost in the outline or unlit: ${rows.at(-1)}`);
      }
      assert(lum(B[FURN]) < 0.3 && others.every(d => lum(B[FURN]) < d), `the black's base ${hex(B[FURN])} is not the darkest furniture`);
      const reds = (d) => { let n = 0; for (const v of d) { const [r, g, b] = rgbOf(rgb(v)); if (r > 0.45 && r > 2 * g && r > 2 * b) n++; } return n; };
      const belief = { mag: 'in', count: 28, chamber: 'live', mode: 'safe' };
      const r7 = reds(paintWeaponCard({ drawing: 'r7', belief }).data), g1 = reds(paintWeaponCard({ drawing: 'g1', finish: 'fde', belief }).data);
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      red pixels on the card on safe: r7 in black ${r7}, g1 in flat dark earth ${g1}`);
      assert(r7 === g1, JSON.stringify({ r7, g1 }));
    },
  },
  {
    name: 'the R-7\'s figure carries the SO-4\'s magnifier: one pixel of gun metal behind the box, on the carry handle, at MAGNIFIER_AT_M along the reference\'s 16 (the judge\'s finding of 2026-11-11: a 3 px box alone); v1\'s box has none',
    fn() {
      const F = RIFLE_DESIGNS.r7.fig, V = RIFLE_DESIGNS.v1.fig, top = Math.min(...F.parts.map(p => p[2]));
      const span = MAGNIFIER_AT_M.map(m => m / RIFLE_DESIGNS.r7.lenM * F.len), row = (T, y) => T.parts.filter(p => p[2] === y).map(p => [p[0], p[4]]).sort((a, b) => a[0] - b[0]);
      const r7Top = row(F, top), v1Top = row(V, top), handle = row(F, top + 1).map(p => p[0]);
      const mag = r7Top.filter(([a]) => a >= Math.floor(span[0]) && a < Math.ceil(span[1]) && !v1Top.some(([b]) => b === a));
      console.log(`      the magnifier's span ${fmt(span[0], 1)} to ${fmt(span[1], 1)} of ${F.len}; the R-7's top row ${JSON.stringify(r7Top)}, v1's ${JSON.stringify(v1Top)}; the magnifier at ${JSON.stringify(mag)}`);
      assert(mag.length === 1 && mag[0][1] === 'n' && handle.includes(mag[0][0]) && r7Top.length === v1Top.length + 1, JSON.stringify({ r7Top, v1Top, handle }));
    },
  },
  {
    name: 'every design\'s figure template keeps the R-7\'s stations and draws on the figure in every rifle pose and facing in every finish, its letters coloured (the finish\'s) and held at their base tone',
    fn() {
      const R = GUNS.rifle, rows = [];
      for (const id of DESIGN_IDS) {
        const F = RIFLE_DESIGNS[id].fig;
        assert(['len', 'grip', 'fore', 'muzzle', 'magwell'].every(k => F[k] === R[k]), `${id}: its stations differ from GUNS.rifle's`);
        const spans = [...F.parts, ...F.mag];
        assert(spans.every(([a0, a1]) => a0 >= 0 && a1 < F.len), `${id}: a part past the rifle's length`);
        let drawn = 0, furn = 0;
        for (const f of FINISH_IDS) {
          const L = wear({ outfit: 'utilities', weapon: 'rifle', model: id, finish: f }), col = coloursOf(L, 16);
          const FR = FINISHES[f].fig ?? FINISHES[f];
          assert(col[FURN] === FR.F && col[FURN_L] === FR.FL && col[FURN_D] === FR.FD, `${id} in ${f}: the figure's furniture is not the finish's`);
          const letters = new Set(spans.map(p => p[4]));
          for (const ch of letters) assert(col[ch] !== undefined || ch === 'l' || ch === 'g', `${id}: letter ${ch} has no colour`);
          for (const frame of ['aim', 'fire', 'prone', 'kneel', 'lowReady', 'highReady', 'slungBack', 'slungFront', 'magout', 'proneMagin', 'sitAim']) for (const dir of ['right', 'left', 'down', 'up']) {
            const fr = composeFrame(L, dir, frame, { ppm: 16 }), pm = shade(fr.cells, col);
            drawn++;
            for (const row of fr.cells) for (const c of row) if (c && HELD_LETTERS.includes(c.ch)) furn++;
            fr.cells.forEach((row, y) => row.forEach((c, x) => { if (c && c.ch === FURN) assert(rgb(pm.data[y * pm.w + x]) === col[FURN], `${id} ${f}: furniture shaded at ${frame} ${dir}`); }));
          }
        }
        rows.push(`${id}: ${drawn} frames (${FINISH_IDS.length} finishes), ${furn} furniture or clear-magazine pixels, magazine out in the hand as "${F.loose}"`);
        assert(furn > 0, `${id}: its furniture never shows`);
        if (F.mag.some(p => p[4] === CLEAR)) assert(F.loose === CLEAR, `${id}: the clear magazine turns black in the hand`);
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'the HAD-30 on the card as scored with G2 (MAG_W_PX 9, MAG_CURVE_PX 5, MAG_SHOWN_M 0.165), the same numbers in rifles.js and weaponcard.js and in every design\'s magazine but v1\'s clear one',
    fn() {
      console.log(`      HAD-30 on the card: ${MAG_SHOWN_M} m shown, ${MAG_W_PX} px wide, ${MAG_CURVE_PX} px forward; the designs': ${DESIGN_IDS.map(i => { const m = drawingOf(i).mag; return `${i} ${m.shownM} m ${m.w} px ${m.curvePx} px${m.clear ? ' clear' : ''}`; }).join(', ')}`);
      assert(MAG_W_PX === 9 && MAG_CURVE_PX === 5 && MAG_SHOWN_M === 0.165, JSON.stringify({ MAG_W_PX, MAG_CURVE_PX }));
      for (const id of DESIGN_IDS) {
        const m = drawingOf(id).mag;
        assert(m.shownM === MAG_SHOWN_M && (m.clear || (m.w === MAG_W_PX && m.curvePx === MAG_CURVE_PX)), `${id}: ${JSON.stringify(m)}`);
      }
    },
  },
];
