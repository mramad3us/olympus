// OLYMPUS tests: the painted materials (src/art/materials/), the lettering (src/art/kit/type.js) and the
// storm table the weather reads (src/render/weather.js dustOf). Pure: no GPU.
//
// A floor is one tile repeated, so a tile must meet its own next copy without a seam: its noise periodic,
// its hashed specks wrapped, and its size a whole number of its pattern's repeats (tileSizePx). Lettering
// must stay legible: the 5 × 7 alphabet has every letter the 3 × 5 has, a stencil wears only the top and
// foot rows, and a plaque paints to the size it says. The storm table is VIEWS §2.7's, row for row.
import { paint, unword } from '../src/art/paint.js';
import { tile, tileSizePx, MATERIAL_KINDS, concrete, vinyl, deckPlate, rubberMat, ceramic, regolith } from '../src/art/materials/index.js';
import { GLYPHS57, fontFor, plaque, plaqueSize, text57, stencil57, width57 } from '../src/art/kit/type.js';
import { textWidth } from '../src/art/font.js';
import { dustOf, DUST_ROWS } from '../src/render/weather.js';
import { assert } from './helpers.mjs';

const SEAMLESS = { concrete: { jointM: 1, cracks: 0 }, vinyl: { tileM: 0.3 }, deckPlate: { plateM: 1, kind: 'grip' }, rubberMat: { kind: 'coin', tileM: 1 }, ceramic: { tileM: 0.15 }, regolith: { pebbles: 0 } };
const PAINT = { concrete, vinyl, deckPlate, rubberMat, ceramic, regolith };

export default [
  { name: 'tiles repeat without a seam: their pattern and noise periodic, their size whole repeats', fn() {
    const lines = [];
    for (const ppm of [16, 24]) for (const [kind, o] of Object.entries(SEAMLESS)) {
      const n = tileSizePx(kind, { ...o, metres: 1.2 }, ppm);
      // (painted twice as wide with the tile's period: the second copy must be the first, pixel for pixel)
      const pm = paint(2 * n, n, (px) => PAINT[kind](px, 0, 0, 2 * n, n, { ...o, ppm, period: n, seed: 3 }));
      let diff = 0;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (pm.data[j * 2 * n + i] !== pm.data[j * 2 * n + i + n]) diff++;
      assert(diff === 0, `${kind} at ${ppm} px/m: ${diff} pixels differ from the next copy`);
      lines.push(`${kind} ${n}`);
    }
    for (const kind of MATERIAL_KINDS) for (const ppm of [16, 24]) { const t = tile(kind, { metres: 1.2, ppm }); assert(t.repeat && t.w === t.h, `${kind}: a tile`); }
    console.log(`      1.2 m tiles in px (16 then 24 px/m): ${lines.join(', ')}; ${MATERIAL_KINDS.length} materials tile at both densities`);
  } },
  { name: 'the valley floor painted apart meets itself: two halves are the whole, pixel for pixel', fn() {
    for (const ppm of [16, 24]) {
      const n = 7 * ppm, o = { ppm, seed: 7, dust: 0.5, ripples: 0.5, pebbles: 1 };
      const whole = paint(2 * n, n, (px) => regolith(px, 0, 0, 2 * n, n, { ...o, wx: 100, wy: 40 }));
      const a = paint(n, n, (px) => regolith(px, 0, 0, n, n, { ...o, wx: 100, wy: 40 })), b = paint(n, n, (px) => regolith(px, 0, 0, n, n, { ...o, wx: 100 + n, wy: 40 }));
      let diff = 0;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { if (whole.data[j * 2 * n + i] !== a.data[j * n + i]) diff++; if (whole.data[j * 2 * n + n + i] !== b.data[j * n + i]) diff++; }
      assert(diff === 0, `${ppm} px/m: ${diff} pixels differ along the join`);
    }
    console.log('      7 m of regolith at 16 and 24 px/m: the two halves painted apart equal the whole painted at once (pebbles across the join included)');
  } },
  { name: 'lettering stays legible: the 5 × 7 alphabet is complete, a stencil wears only top and foot, a plaque paints to its size', fn() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-./:!#&%\'';
    for (const ch of letters) { const g = GLYPHS57[ch]; assert(g && g.length === 7 && g.every(r => r.length === g[0].length), `5 × 7 '${ch}'`); }
    assert(fontFor(16).name === '3x5' && fontFor(24).name === '5x7', 'the alphabet by density');
    const lit = (fn, str) => { const s = new Set(); fn((x, y) => s.add(`${x},${y}`), 0, 0, str, 1); return s; };
    for (const word of ['VEHICLE LOCK 1', 'DECK 5', 'HEAD 2A']) {
      const full = lit(text57, word), worn = lit(stencil57, word);
      for (const p of full) { const y = +p.split(',')[1]; if (y > 0 && y < 6) assert(worn.has(p), `'${word}': a stencil lost a middle-row pixel at ${p}`); }
      assert(worn.size < full.size, `'${word}': no wear`);
    }
    for (const ppm of [16, 24]) {
      const [w, h] = plaqueSize({ text: 'DECK 5', sub: 'MARINES', icon: 'helmet', ppm });
      const pm = paint(w + 4, h + 4, (px) => plaque(px, 0, 0, { text: 'DECK 5', sub: 'MARINES', icon: 'helmet', ppm }));
      let maxX = 0, maxY = 0;
      for (let j = 0; j < pm.h; j++) for (let i = 0; i < pm.w; i++) if (!unword(pm.data[j * pm.w + i]).hole) { maxX = Math.max(maxX, i); maxY = Math.max(maxY, j); }
      assert(maxX === w - 1 && maxY === h - 1, `${ppm} px/m: the plaque says ${w} × ${h} and paints ${maxX + 1} × ${maxY + 1}`);
    }
    console.log(`      ${letters.length} glyphs in 5 × 7; "VEHICLE LOCK 1" is ${textWidth('VEHICLE LOCK 1')} px in 3 × 5 (0.${Math.round(5 / 16 * 100)} m tall at 16 px/m), ${width57('VEHICLE LOCK 1')} px in 5 × 7 (0.${Math.round(7 / 24 * 100)} m at 24); plaques paint to their size`);
  } },
  { name: 'the storm table is VIEWS §2.7\'s: its rows at their τ, darker and thicker as τ grows', fn() {
    for (const r of DUST_ROWS) { const d = dustOf(r.tau); for (const k of ['sunK', 'skyK', 'haze', 'dust', 'shadow']) assert(Math.abs(d[k] - r[k]) < 1e-9, `τ ${r.tau}: ${k} ${d[k]} vs ${r[k]}`); }
    let last = dustOf(0.5);
    const out = [];
    for (let tau = 0.75; tau <= 10; tau += 0.25) {
      const d = dustOf(tau);
      assert(d.sunK <= last.sunK + 1e-9 && d.haze >= last.haze - 1e-9 && d.farM <= last.farM + 1e-9, `τ ${tau}: not monotonic`);
      if ([1, 2, 3, 4, 6, 10].includes(tau)) out.push(`τ ${tau}: sun ×${d.sunK.toFixed(2)}, haze ${d.haze.toFixed(2)}, sight ${d.farM.toFixed(0)} m, falls ${d.dust.toFixed(2)}`);
      last = d;
    }
    for (const l of out) console.log(`      ${l}`);
  } },
];
