// OLYMPUS tests: the stencils read back as what they say (quick).
//
// The look round's "2ND SQUAD" read "EUND" (2026-11-06): 0.0.1 cut the bridges out of every 3 × 5
// glyph's middle row, as a stencil plate has them, and a letter five pixels tall had nothing to spare.
// Stencils are now painted whole in the density's alphabet (src/art/kit/type.js fontFor: 3 × 5 under
// 20 px/m, 5 × 7 from it). This reads them back the way an eye does: each text painted, cut into its
// characters' cells by the glyphs' widths and the one-pixel gaps, every cell matched against every
// glyph of the alphabet; a cell must be its own glyph exactly, and the nearest glyph to it its own
// character. Then the same through the cutaway itself: the test rooms' north wall painted as the area
// job paints it, and the stencil's cell found at decorRect() and read back. The texts are every
// stencil in the areas' decor (src/sim/places/model.js AREA_RECORDS: the test rooms, and Echo's
// floors once places has them), the stencilled signs among their fixtures, and the samples'.
import { assert } from './helpers.mjs';
import { fontFor } from '../src/art/kit/type.js';
import { paint, unword } from '../src/art/paint.js';
import { createCollector, buildAreaData } from '../src/art/jobs.js';
import { buildCutaway, decorRect, stencilColour, FINISHES } from '../src/render/cutaway.js';
import { planOf, OUTER_T_M, WALL_H_M } from '../src/sim/places/plan.js';
import { AREA_RECORDS } from '../src/sim/places/model.js';
import { TEST_AREA } from '../src/data/places/testroom.js';

const ALNUM = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'];
/** What a cell is matched against: the letters and digits, and the marks a stencil may hold. */
const CANDIDATES = [...ALNUM, ..."/-.:'#&!%,"];
const SAMPLE_TEXTS = ['1ST SQUAD', '2ND SQUAD', '3RD SQUAD', 'HEAD 2A', 'WET FLOOR', 'WEAPONS PLT', '2/4 ECHO', 'VEHICLE'];

/** Every stencil text in the areas (decor, stencilled signs) and the samples'. */
function texts() {
  const out = new Map();
  for (const a of Object.values(AREA_RECORDS)) {
    for (const d of a.look?.decor ?? []) if (d.kind === 'stencil' && d.text) out.set(d.text, a.id);
    for (const f of a.fixtures ?? []) if (f.kind === 'sign' && f.make === 'stencil' && f.look?.text) out.set(f.look.text, a.id);
  }
  for (const t of SAMPLE_TEXTS) if (!out.has(t)) out.set(t, 'samples');
  return out;
}

/** A painting's cell read as a glyph: rows of '0' and '1' (a pixel is set when it holds colour c). */
function cellOf(pm, x0, y0, w, h, c) {
  const rows = [];
  for (let j = 0; j < h; j++) { let r = ''; for (let i = 0; i < w; i++) { const v = x0 + i < pm.w && y0 + j < pm.h ? unword(pm.data[(y0 + j) * pm.w + x0 + i]) : null; r += v && !v.hole && v.hex === c ? '1' : '0'; } rows.push(r); }
  return rows;
}
const dist = (a, b) => { if (a[0].length !== b[0].length) return Infinity; let d = 0; for (let j = 0; j < a.length; j++) for (let i = 0; i < a[j].length; i++) if (a[j][i] !== b[j][i]) d++; return d; };

/** Read a text back from a painting at (x0, y0) in font f: the characters it reads, and the cells that are not their glyphs. */
function readBack(pm, x0, y0, str, f, c) {
  let x = x0, read = '';
  const bad = [];
  for (const ch of String(str).toUpperCase()) {
    const g = f.glyph(ch), w = g[0].length, cell = cellOf(pm, x, y0, w, f.h, c);
    if (ch !== ' ') {
      if (dist(cell, g) !== 0) bad.push(`${ch}: ${cell.join('/')} is not ${g.join('/')}`);
      let best = null, bd = Infinity;
      for (const k of CANDIDATES) { const d = dist(cell, f.glyph(k)); if (d < bd) { bd = d; best = k; } }
      read += best ?? '?';
    } else read += ' ';
    const gap = cellOf(pm, x + w, y0, 1, f.h, c).join('');
    if (gap.includes('1') && x + w < x0 + f.width(str)) bad.push(`${ch}: the gap after it is painted`);
    x += w + 1;
  }
  return { read, bad };
}

export default [
  {
    name: 'every letter and digit of both alphabets is its own glyph, and no two are alike',
    fn() {
      for (const ppm of [16, 24]) {
        const f = fontFor(ppm), seen = new Map(), same = [];
        for (const ch of ALNUM) { const k = f.glyph(ch).join('/'); if (seen.has(k)) same.push(`${seen.get(k)} = ${ch}`); seen.set(k, ch); }
        let nearest = Infinity;
        for (const a of ALNUM) for (const b of ALNUM) if (a < b) nearest = Math.min(nearest, dist(f.glyph(a), f.glyph(b)));
        assert(!same.length, `${f.name}: glyphs alike: ${same.join(', ')}`);
        console.log(`      ${f.name} (${ppm} px/m): ${ALNUM.length} glyphs, all distinct; the closest two differ by ${nearest} pixel${nearest === 1 ? '' : 's'}`);
      }
    },
  },
  {
    name: 'every stencil of the areas and the samples reads back as itself ("2ND SQUAD" read "EUND" in the look round, 2026-11-06)',
    fn() {
      const all = texts(), mism = [];
      for (const ppm of [16, 24]) {
        const f = fontFor(ppm), c = 0x5a4c3a, lines = [];
        for (const [t, from] of all) {
          const w = f.width(t), pm = paint(w + 2, f.h + 2, (px) => f.stencil(px, 1, 1, t, c));
          const { read, bad } = readBack(pm, 1, 1, t, f, c);
          if (read !== t.toUpperCase() || bad.length) mism.push(`${ppm} px/m '${t}' (${from}) reads '${read}': ${bad.join('; ')}`);
          lines.push(`'${t}' → '${read}'`);
        }
        console.log(`      ${f.name} at ${ppm} px/m, ${all.size} texts: ${lines.join(', ')}`);
      }
      console.log(`      mismatches: ${mism.length ? mism.join(' | ') : 'none'}`);
      assert(!mism.length, mism.join('\n'));
    },
  },
  {
    name: 'the test rooms\' stencil painted on the north wall by the cutaway reads back at its place',
    fn() {
      for (const ppm of [16, 24]) {
        const col = createCollector({ ppm, part: (() => { let n = 1; return () => n++; })() });
        const plan = { ...planOf(TEST_AREA), decor: TEST_AREA.look.decor, lamps: [] };
        buildCutaway(col, plan, { finish: TEST_AREA.look.finish });
        const north = col.items.find(it => typeof it.faces.front === 'function' && Math.abs(it.b.z1 - plan.z0) < 0.01 && Math.abs(it.b.y1 - WALL_H_M) < 0.05);
        assert(north, 'no north wall in the collector');
        const pm = paint(north.b.wPx, north.b.hPx, (px, w, h) => north.faces.front(px, w, h, ppm));
        const bx0 = plan.x0 - OUTER_T_M, X = (m) => Math.round((m - bx0) * ppm);
        const F = TEST_AREA.look.finish ?? FINISHES.block;
        for (const d of plan.decor.filter(d => d.kind === 'stencil')) {
          const r = decorRect(d, ppm, X, north.b.hPx), { read, bad } = readBack(pm, r.x, r.y, d.text, fontFor(ppm), d.color ?? stencilColour(F));
          console.log(`      ${ppm} px/m: '${d.text}' at (${r.x}, ${r.y}) px of the ${pm.w} × ${pm.h} px wall reads '${read}'`);
          assert(read === d.text.toUpperCase() && !bad.length, `${ppm} px/m: '${d.text}' reads '${read}': ${bad.join('; ')}`);
        }
        void buildAreaData;
      }
    },
  },
];
