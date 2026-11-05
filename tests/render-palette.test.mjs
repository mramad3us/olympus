// OLYMPUS tests: the palettes and the palette snap's lookup (src/art/palette.js, src/art/tone.js).
//
// The fixture is tradecraft's FINE_PALETTE and a few tone() and nearest() answers, read from its
// src/art/pixelart.js on 2026-11-05 (node, its own three): the port must give the same colours.
import { TRADECRAFT, PALETTES, PLACES, FIXED, buildPalette, nearest, nearestIndex, paletteRgb, bakeLut, lutSnap, lutLevel, lutTexelOf, lutSize, LUT_LEVELS, LUT_TILES, paletteDistance } from '../src/art/palette.js';
import { tone, oklch, fromOklch, rgbOf, hash3 } from '../src/art/tone.js';

const FINE = [0x1a1416, 0x31292a, 0x49403e, 0x625854, 0x7c736b, 0x999189, 0xb7b0a8, 0xd6d0c9, 0x14161d, 0x282b34, 0x3e424d, 0x565b67, 0x6e7582, 0x87959d, 0xa5b5b6, 0xc7d5d0, 0x220f18, 0x3c2328, 0x573a37, 0x725247, 0x8c6d59, 0xa78c77, 0xc4ac97, 0xe1cdb8, 0x2c0614, 0x491a1b, 0x663120, 0x7f4d23, 0x946c2e, 0xb08b54, 0xccac79, 0xe9cd9e, 0x2b0420, 0x4a152d, 0x6a2a38, 0x8b413f, 0xaa5b46, 0xc57e5f, 0xdfa17c, 0xf8c59d, 0x2c0026, 0x4c0f35, 0x6e2341, 0x91384a, 0xb45150, 0xd07662, 0xea9b7a, 0xffc097, 0x250c1a, 0x411f28, 0x5e3535, 0x7b4d41, 0x96694f, 0xb1896d, 0xccaa8d, 0xe8cbae, 0x001c1e, 0x00342b, 0x264c35, 0x4c633d, 0x737949, 0x949669, 0xb6b48a, 0xd8d2ad, 0x001c27, 0x003536, 0x004f43, 0x27694b, 0x538252, 0x7d9e6b, 0xa6ba87, 0xcfd7a6, 0x021826, 0x0d303d, 0x1e4954, 0x31646a, 0x48807e, 0x6f9d91, 0x98bba5, 0xc2d9be, 0x0b142f, 0x1b2a4a, 0x2b4366, 0x3c5d84, 0x4d79a1, 0x5d9db1, 0x7fbebd, 0xaddeca, 0x121328, 0x262942, 0x3c405d, 0x52587a, 0x6c7198, 0x9a8aad, 0xc4a6bf, 0xeac6d0, 0x1b1027, 0x34233f, 0x4e3858, 0x6b4f71, 0x8a668a, 0xaf839a, 0xd2a3ac, 0xf1c5c1, 0x211114, 0x392523, 0x523d33, 0x695745, 0x7f735a, 0x9c917a, 0xbbb09a, 0xdad0bc, 0x1a1214, 0xf4efe6, 0xe7b84a, 0xf8e08a];
const TONES = [[0x9e3c36, -0.24, 0x420226], [0xe2dac6, 0.06, 0xf6eedb], [0x4c5262, -0.04, 0x424756], [0x8f6345, 0.08, 0xa47c5e]];
const NEAREST = [[0x123456, 0x1b2a4a], [0x808080, 0x6e7582], [0xc0a080, 0xccac79], [0xff0000, 0xb45150]];
const hx = (v) => '0x' + v.toString(16).padStart(6, '0');
const eq = (a, b, what) => { if (a !== b) throw new Error(`${what}: ${typeof a === 'number' ? hx(a) : a} ≠ ${typeof b === 'number' ? hx(b) : b}`); };

export default [
  { name: 'tradecraft palette ported exactly (116 colours)', fn() {
    eq(TRADECRAFT.length, FINE.length, 'length');
    FINE.forEach((c, i) => eq(TRADECRAFT[i], c, `colour ${i}`));
    console.log(`      ${TRADECRAFT.length} colours, 14 families × 8 steps + 4 fixed, all equal to tradecraft's FINE_PALETTE`);
  } },
  { name: 'tone() and nearest() answer as tradecraft', fn() {
    for (const [h, d, want] of TONES) eq(tone(h, d), want, `tone(${hx(h)}, ${d})`);
    for (const [h, want] of NEAREST) eq(nearest(h, TRADECRAFT), want, `nearest(${hx(h)})`);
    const [L, C, H] = oklch(0x9e3c36);
    eq(fromOklch(L, C, H), 0x9e3c36, 'OKLCH round trip');
    console.log(`      4 tones, 4 nearest, an OKLCH round trip (L ${L.toFixed(3)} C ${C.toFixed(3)} h ${H.toFixed(1)}°)`);
  } },
  { name: 'place palettes: built from parameters, carry the fixed colours, fit the loop', fn() {
    for (const [name, p] of Object.entries(PALETTES)) {
      if (p.length > 128) throw new Error(`${name}: ${p.length} colours, over the loop's 128`);
      if (new Set(p).size !== p.length) throw new Error(`${name}: duplicates`);
      for (const f of FIXED) if (!p.includes(f)) throw new Error(`${name}: lacks ${hx(f)}`);
      // (each family's ramp rises in lightness)
      for (let k = 0, i = 0; k < PLACES[name].families.length; k++) {
        const n = (PLACES[name].families[k][2] ?? [0, 0, 0, 0, 0, 0, 0, 0]).length;
        for (let j = 1; j < n; j++) if (oklch(p[i + j])[0] <= oklch(p[i + j - 1])[0]) throw new Error(`${name}: family ${k} not rising at step ${j}`);
        i += n;
      }
      console.log(`      ${name}: ${p.length} colours (${PLACES[name].families.length} families)`);
    }
    eq(buildPalette({ families: [[60, 0.016]], fixed: [] }).length, 8, 'one family');
  } },
  { name: 'lookup maths: levels, texels, size', fn() {
    eq(lutLevel(0), 0, 'level 0'); eq(lutLevel(1), LUT_LEVELS - 1, 'level 1'); eq(lutLevel(0.5), 32, 'level 0.5');
    const [w, h] = lutSize();
    eq(w, 512, 'width'); eq(h, 512, 'height');
    const seen = new Set();
    for (let b = 0; b < LUT_LEVELS; b += 7) for (let g = 0; g < LUT_LEVELS; g += 9) for (let r = 0; r < LUT_LEVELS; r += 5) {
      const [x, y] = lutTexelOf(r, g, b);
      if (x < 0 || y < 0 || x >= w || y >= h) throw new Error('texel out of the texture');
      const k = y * w + x; if (seen.has(k)) throw new Error('two cells on one texel'); seen.add(k);
    }
    console.log(`      ${LUT_LEVELS} levels a channel, blue's planes ${LUT_TILES} × ${LUT_TILES}: a ${w} × ${h} texture, ${seen.size} cells checked distinct`);
  } },
  // (the lookup keeps four candidates a cell and the snap measures the pixel against them: the exact loop's answer
  // unless the true nearest is not among the cell centre's four, a near-tie; painted colours, palette colours, never miss)
  { name: 'lookup snap: palette colours map to themselves; random colours as the exact loop', heavy: false, fn() {
    for (const [name, pal] of Object.entries(PALETTES)) {
      const t0 = performance.now(), lut = bakeLut(pal), ms = performance.now() - t0;
      let self = 0;
      for (const c of pal) if (lutSnap(lut, c, pal) === c) self++;
      if (self !== pal.length) throw new Error(`${name}: only ${self} of ${pal.length} colours map to themselves`);
      const rgb = paletteRgb(pal);
      let same = 0, worst = 0;
      const N = 20000;
      for (let i = 0; i < N; i++) {
        const h = hash3(i, 99, name.length), c = h & 0xffffff, [r, g, b] = rgbOf(c);
        const exact = pal[nearestIndex(r, g, b, rgb)], viaLut = lutSnap(lut, c, pal);
        if (exact === viaLut) { same++; continue; }
        const [er, eg, eb] = rgbOf(exact), [vr, vg, vb] = rgbOf(viaLut);
        worst = Math.max(worst, paletteDistance(r, g, b, vr, vg, vb) - paletteDistance(r, g, b, er, eg, eb));
      }
      if (same / N < 0.999 || worst > 1e-3) throw new Error(`${name}: only ${(100 * same / N).toFixed(1)}% as the loop`);
      console.log(`      ${name}: ${pal.length}/${pal.length} map to themselves; ${(100 * same / N).toFixed(2)}% of ${N} random colours as the exact loop, worst extra distance ${worst.toExponential(2)}; CPU bake ${ms.toFixed(0)} ms`);
    }
  } },
];
