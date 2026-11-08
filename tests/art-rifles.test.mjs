// The rifles' drawings (quick; the user, 2026-11-08: "Martian standard issue would look more like [the first reference],
// but we would have varyiety in the guns marines carry like [the second]"; src/art/rifles.js, samples/guns).
//
// The candidates are drawings, not data: the game's R-7 is drawn as v0.0.9 drew it until the user scores them (a look
// with no model, the model 'r7' and the drawing g0 give the same pixels on the card, the figure and the doll), and each
// candidate drops into both pictures as it is: its card draws every belief the R-7's does with the state parts at the
// R-7's stations (so the words under the card stay where they were scored), its figure template keeps GUNS.rifle's
// stations (16 reference pixels, the grip, the support hand, the well, the muzzle, so every rig holds it), and every
// letter it draws has a colour and is held at its base tone. A clear magazine shows the believed rounds through it,
// none when the holder believes it empty, and frosted with a "?" when the count is not known; the rounds' noses zigzag as
// a double stack lies, not a stripe. Seen end on, a design with furniture shows it behind its muzzle. The furniture's
// colours are the Mars palette's, so the stage's snap keeps each ramp in order and the standard issue apart from the
// variety (the judge's findings of 2026-11-08). g2 is the standard issue in the Corps' black (the user's decision of
// 2026-11-08: the Corps red and black, armour black), black yet clear of the ink outline, with no red on it.
import { assert } from './helpers.mjs';
import { RIFLE_DRAWINGS, DRAWN_AS, drawingOf, HELD_LETTERS, FURN, FURN_L, FURN_D, CLEAR } from '../src/art/rifles.js';
import { paintWeaponCard, CARD_W, CARD_H, MAG_SHOWN_M, MAG_W_PX, MAG_CURVE_PX } from '../src/art/weaponcard.js';
import { GUNS } from '../src/art/figures/templates.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { shade } from '../src/art/figures/shade.js';
import { wear, coloursOf } from '../src/art/figures/outfits.js';
import { doll } from '../src/art/doll/doll.js';
import { PALETTES, nearest, INK } from '../src/art/palette.js';
import { rgbOf } from '../src/art/tone.js';

const IDS = Object.keys(RIFLE_DRAWINGS);
const BELIEFS = [
  {}, { mag: 'in', count: 28, chamber: 'live', mode: 'semi' }, { mag: 'out', chamber: '?', port: 'open', locked: true, mode: 'auto' },
  { mag: 'in', count: 12, countApprox: true, magLoad: 'tracer', stoppage: 'case', port: 'open' }, { mag: 'in', count: 0, stoppage: 'double', port: 'open' },
  { mag: 'out', hand: { n: 5, load: 'tracer' }, stoppage: 'click' }, { mag: 'in', count: 3, optic: 4, sight: { elev: -3, wind: 1 }, dope: { 300: { elev: -3, wind: 0 } } },
];
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const rgb = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);

export default [
  {
    name: 'the game\'s R-7 is still drawn as v0.0.9 drew it until the user picks: model r7 and drawing g0 paint the same card, figure and doll as a look with no drawing',
    fn() {
      assert(DRAWN_AS.r7 === 'g0' && drawingOf('r7') === RIFLE_DRAWINGS.g0 && drawingOf('nonesuch') === RIFLE_DRAWINGS.g0, JSON.stringify(DRAWN_AS));
      for (const belief of BELIEFS) {
        const a = paintWeaponCard({ belief }), b = paintWeaponCard({ model: 'r7', belief }), c = paintWeaponCard({ drawing: 'g0', belief });
        assert(same(a.data, b.data) && same(a.data, c.data), `the R-7's card changed for ${JSON.stringify(belief)}`);
      }
      let frames = 0;
      for (const frame of ['aim', 'prone', 'kneel', 'lowReady', 'slungBack', 'magout']) for (const dir of ['right', 'left', 'down', 'up']) {
        const L0 = wear({ outfit: 'utilities', weapon: 'rifle' }), L1 = wear({ outfit: 'utilities', weapon: 'rifle', model: 'g0' });
        const p0 = shade(composeFrame(L0, dir, frame, { ppm: 16 }).cells, coloursOf(L0, 16)), p1 = shade(composeFrame(L1, dir, frame, { ppm: 16 }).cells, coloursOf(L1, 16));
        assert(same(p0.data, p1.data), `the R-7 on the figure changed: ${frame} ${dir}`);
        frames++;
      }
      const d0 = doll({ look: { outfit: 'utilities' }, hand: 'rifle', scale: 1 }), d1 = doll({ look: { outfit: 'utilities', model: 'g0' }, hand: 'rifle', scale: 1 });
      assert(same(d0.data, d1.data), 'the doll\'s R-7 changed');
      console.log(`      ${BELIEFS.length} beliefs on the card, ${frames} frames, the doll: the R-7 as built`);
    },
  },
  {
    name: 'every candidate paints the card in every belief, differs from the R-7\'s, keeps its rifle on the card, and draws the state parts at the R-7\'s stations',
    fn() {
      const rows = [];
      for (const id of IDS) {
        const D = RIFLE_DRAWINGS[id];
        for (const belief of BELIEFS) {
          const c = paintWeaponCard({ drawing: id, belief, distance: !!belief.optic, line: belief.optic ? 300 : null });
          assert(c.w === CARD_W && c.h === CARD_H && c.data.every(v => (v >>> 24) === 255), `${id}: not an opaque ${CARD_W} × ${CARD_H} card`);
        }
        const r7 = paintWeaponCard({ belief: BELIEFS[1] }).data, card = paintWeaponCard({ drawing: id, belief: BELIEFS[1] }).data;
        let differ = 0;
        for (let i = 0; i < r7.length; i++) if (r7[i] !== card[i]) differ++;
        // (the stations: a magazine believed in and one believed out differ at the R-7's well, and the lever moves at its selector)
        const inn = paintWeaponCard({ drawing: id, belief: { mag: 'in', count: 30 } }).data, out = paintWeaponCard({ drawing: id, belief: { mag: 'out' } }).data;
        const at = (d, x, y) => d[y * CARD_W + x];
        const wellMoves = [0, 1, 2, 3, 4].some(dy => at(inn, 22 + Math.round(0.40 * 144) + 3, 56 + 12 + dy) !== at(out, 22 + Math.round(0.40 * 144) + 3, 56 + 12 + dy));
        const safe = paintWeaponCard({ drawing: id, belief: { mode: 'safe' } }).data, semi = paintWeaponCard({ drawing: id, belief: { mode: 'semi' } }).data;
        const sx = 22 + Math.round(0.30 * 144), sy = 56 + 4, leverMoves = at(safe, sx + 4, sy) !== at(semi, sx + 4, sy) && at(safe, sx, sy - 4) !== at(semi, sx, sy - 4);
        rows.push(`${id} ${D.lenM} m: ${differ} px differ from the R-7's card; well ${wellMoves ? 'ok' : 'MISSING'}, selector ${leverMoves ? 'ok' : 'MISSING'}`);
        assert(wellMoves && leverMoves, `${id}: the state parts are not at the R-7's stations`);
        if (id !== 'g0') assert(differ > 400, `${id}: hardly differs from the R-7 (${differ} px)`);
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'a clear magazine shows the believed rounds through it: brass for 30, none for 0, about half for 15, frosted with no brass when the count is not known',
    fn() {
      const brassOf = (belief) => {
        const d = paintWeaponCard({ drawing: 'v1', belief }).data;
        let n = 0;
        // (the magazine's column under the well: x from the well to its curve, y below the receiver)
        for (let y = 66; y < 92; y++) for (let x = 78; x < 98; x++) { const c = rgb(d[y * CARD_W + x]); if (c === 0xd0ac5e || c === 0xf0d48a) n++; }
        return n;
      };
      const full = brassOf({ mag: 'in', count: 30 }), half = brassOf({ mag: 'in', count: 15 }), none = brassOf({ mag: 'in', count: 0 }), unknown = brassOf({ mag: 'in', count: null });
      console.log(`      brass pixels in the clear magazine: 30 → ${full}, 15 → ${half}, 0 → ${none}, unknown → ${unknown}`);
      assert(full > 50 && none === 0 && unknown === 0 && half > full * 0.35 && half < full * 0.65, JSON.stringify({ full, half, none, unknown }));
      // (the tracer noses: one a round, on its front pixel, alternating columns down the stack, never two in a column in a row)
      const d = paintWeaponCard({ drawing: 'v1', belief: { mag: 'in', count: 30, magLoad: 'tracer' } }).data, tips = [];
      for (let y = 66; y < 92; y++) for (let x = 78; x < 98; x++) if (rgb(d[y * CARD_W + x]) === 0xc23b2e) tips.push([x, y]);
      // (where the magazine's curve steps forward two noses can meet in a column; three in a row would be a stripe)
      const has = (x, y) => tips.some(([x2, y2]) => x2 === x && y2 === y);
      const stacked = tips.filter(([x, y]) => has(x, y + 1)).length, runs = tips.filter(([x, y]) => has(x, y + 1) && has(x, y + 2)).length;
      console.log(`      tracer noses: ${tips.length}, ${stacked} directly above another (where the curve steps), ${runs} runs of three`);
      assert(tips.length >= 15 && runs === 0 && stacked <= tips.length / 4, JSON.stringify({ tips: tips.length, stacked, runs }));
    },
  },
  {
    name: 'seen end on, a design with furniture shows it round its muzzle, black round the bore; the R-7 keeps its gun metal and steel',
    fn() {
      const rows = [];
      for (const id of IDS) {
        const L = wear({ outfit: 'utilities', weapon: 'rifle', model: id });
        let furn = 0, steel = 0;
        for (const frame of ['aim', 'kneel']) for (const row of composeFrame(L, 'down', frame, { ppm: 16 }).cells) for (const c of row) { if (c?.ch === FURN) furn++; if (c?.ch === 'v') steel++; }
        rows.push(`${id}: ${furn} furniture, ${steel} steel pixels facing the camera (aimed, kneeling and standing)`);
        if (RIFLE_DRAWINGS[id].fig?.furn) assert(furn > 0 && steel === 0, `${id}: ${furn} furniture, ${steel} steel facing the camera`);
        else assert(furn === 0 && steel > 0, `${id}: the R-7 changed facing the camera`);
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'the furniture\'s colours are the Mars palette\'s own, so the stage\'s snap leaves them, and through every place\'s palette each ramp stays in order and the standard issue\'s base apart from the variety\'s',
    fn() {
      const lum = (c) => { const [r, g, b] = rgbOf(c); return 0.3 * r + 0.59 * g + 0.11 * b; };
      const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
      for (const id of IDS.filter(i => RIFLE_DRAWINGS[i].fig?.furn)) {
        const C = RIFLE_DRAWINGS[id].colours;
        for (const ch of [FURN, FURN_L, FURN_D, CLEAR]) assert(PALETTES.mars.includes(C[ch]), `${id}: ${ch} ${hex(C[ch])} is not a Mars colour`);
        for (const place of ['mars', 'ship', 'europa']) {
          const [l, b, d] = [FURN_L, FURN, FURN_D].map(ch => nearest(C[ch], PALETTES[place]));
          assert(lum(l) > lum(b) && lum(b) > lum(d), `${id} on ${place}: ${[l, b, d].map(hex)} out of order`);
        }
      }
      for (const place of ['mars', 'ship', 'europa']) {
        const g = nearest(RIFLE_DRAWINGS.g1.colours[FURN], PALETTES[place]), v = nearest(RIFLE_DRAWINGS.v1.colours[FURN], PALETTES[place]);
        console.log(`      ${place}: g1's base ${hex(g)} (${lum(g).toFixed(2)}), v1's ${hex(v)} (${lum(v).toFixed(2)})`);
        assert(lum(v) - lum(g) > 0.08, `${place}: the standard issue and the variety snap too close`);
      }
    },
  },
  {
    name: 'g2 is the standard issue in the Corps\' black (the user, 2026-11-08: "the Corps red and black", armour black): its furniture is black, darker than every other design\'s, clear of the ink outline after every place\'s snap, its top lit, and with no red on the card',
    fn() {
      const lum = (c) => { const [r, g, b] = rgbOf(c); return 0.3 * r + 0.59 * g + 0.11 * b; };
      const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;
      const B = RIFLE_DRAWINGS.g2.colours;
      const others = IDS.filter(i => i !== 'g2' && RIFLE_DRAWINGS[i].fig?.furn).map(i => lum(RIFLE_DRAWINGS[i].colours[FURN_D]));
      const rows = [];
      for (const place of ['mars', 'ship', 'europa']) {
        const [l, b] = [FURN_L, FURN].map(ch => nearest(B[ch], PALETTES[place])), ink = nearest(INK, PALETTES[place]);
        rows.push(`${place}: lit ${hex(l)} (${lum(l).toFixed(2)}), base ${hex(b)} (${lum(b).toFixed(2)}), ink ${hex(ink)} (${lum(ink).toFixed(2)})`);
        assert(lum(b) - lum(ink) > 0.12 && lum(l) > lum(b), `${place}: the black is lost in the outline or unlit: ${rows.at(-1)}`);
      }
      assert(lum(B[FURN]) < 0.3 && others.every(d => lum(B[FURN]) < d), `g2's base ${hex(B[FURN])} is not the darkest furniture`);
      // (no Corps red on the field rifle, my call: red on the card means the fire mark, the words and tracer; the R-7's card has the same red pixels)
      const reds = (d) => { let n = 0; for (const v of d) { const [r, g, b] = rgbOf(rgb(v)); if (r > 0.45 && r > 2 * g && r > 2 * b) n++; } return n; };
      const belief = { mag: 'in', count: 28, chamber: 'live', mode: 'safe' };
      const g2r = reds(paintWeaponCard({ drawing: 'g2', belief }).data), g1r = reds(paintWeaponCard({ drawing: 'g1', belief }).data);
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      red pixels on the card on safe: g2 ${g2r}, g1 ${g1r}`);
      assert(g2r === g1r, JSON.stringify({ g2r, g1r }));
    },
  },
  {
    name: 'every candidate\'s figure template keeps the R-7\'s stations and draws on the figure in every rifle pose and facing, its letters coloured and held at their base tone',
    fn() {
      const R = GUNS.rifle, rows = [];
      for (const id of IDS.filter(i => RIFLE_DRAWINGS[i].fig)) {
        const F = RIFLE_DRAWINGS[id].fig;
        assert(['len', 'grip', 'fore', 'muzzle', 'magwell'].every(k => F[k] === R[k]), `${id}: its stations differ from GUNS.rifle's`);
        const spans = [...F.parts, ...F.mag];
        assert(spans.every(([a0, a1]) => a0 >= 0 && a1 < F.len), `${id}: a part past the rifle's length`);
        const L = wear({ outfit: 'utilities', weapon: 'rifle', model: id }), col = coloursOf(L, 16);
        const letters = new Set(spans.map(p => p[4]));
        for (const ch of letters) assert(col[ch] !== undefined || ch === 'l' || ch === 'g', `${id}: letter ${ch} has no colour`);
        let drawn = 0, furn = 0;
        for (const frame of ['aim', 'fire', 'prone', 'kneel', 'lowReady', 'highReady', 'slungBack', 'slungFront', 'magout', 'proneMagin', 'sitAim']) for (const dir of ['right', 'left', 'down', 'up']) {
          const fr = composeFrame(L, dir, frame, { ppm: 16 }), pm = shade(fr.cells, col);
          drawn++;
          for (const row of fr.cells) for (const c of row) if (c && HELD_LETTERS.includes(c.ch)) furn++;
          // (a held letter keeps its base colour wherever it is drawn: shade.js HELD)
          fr.cells.forEach((row, y) => row.forEach((c, x) => { if (c && c.ch === FURN) assert(rgb(pm.data[y * pm.w + x]) === col[FURN], `${id}: furniture shaded at ${frame} ${dir}`); }));
        }
        rows.push(`${id}: ${drawn} frames, ${furn} furniture or clear-magazine pixels, magazine out in the hand as "${F.loose}"`);
        if (id !== 'g0') assert(furn > 0 || !letters.has(FURN), `${id}: its furniture never shows`);
        if (F.mag.some(p => p[4] === CLEAR)) assert(F.loose === CLEAR, `${id}: the clear magazine turns black in the hand`);
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'the candidates\' magazine looks start from the HAD-30 as the card draws it (MAG_SHOWN_M, MAG_W_PX, MAG_CURVE_PX): no number drifts from weaponcard.js',
    fn() {
      const g0 = RIFLE_DRAWINGS.g0.mag;
      console.log(`      HAD-30 on the card: ${MAG_SHOWN_M} m shown, ${MAG_W_PX} px wide, ${MAG_CURVE_PX} px forward; the candidates': ${IDS.map(i => `${i} ${RIFLE_DRAWINGS[i].mag.shownM} m ${RIFLE_DRAWINGS[i].mag.w} px ${RIFLE_DRAWINGS[i].mag.curvePx} px${RIFLE_DRAWINGS[i].mag.clear ? ' clear' : ''}`).join(', ')}`);
      assert(g0.shownM === MAG_SHOWN_M && g0.w === MAG_W_PX && g0.curvePx === MAG_CURVE_PX, JSON.stringify(g0));
    },
  },
];
