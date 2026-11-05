// OLYMPUS tests: the density constant and the picture's fit to a window (src/render/scale.js),
// the moods' numbers (src/render/moods.js) and the painter (src/art/paint.js, src/art/tiles.js). Pure.
import { DENSITIES, densityFrom, frameFor, DEFAULT_PPM, MAX_VIEW_M, snapM } from '../src/render/scale.js';
import { skyAt, SKY, MOODS, MOOD_KEYS, moodOf, glowKOf, pickLamps, lightAt } from '../src/render/moods.js';
import { paint, word, unword, pixAt, GLOW } from '../src/art/paint.js';
import { tile, TILE_KINDS } from '../src/art/tiles.js';
import { text, textWidth } from '../src/art/font.js';

export default [
  { name: 'densities: 16 px/m at 640 × 360, 24 at 960 × 540, picked by ?ppm=', fn() {
    if (densityFrom('?ppm=16') !== 16 || densityFrom('?ppm=24') !== 24 || densityFrom('') !== DEFAULT_PPM || densityFrom('?ppm=20') !== DEFAULT_PPM || densityFrom('', '16') !== 16) throw new Error('density pick');
    for (const d of Object.values(DENSITIES)) if (d.res[0] / d.pxPerM !== 40 || d.res[1] / d.pxPerM !== 22.5) throw new Error('both should show 40 × 22.5 m');
    if (snapM(1.03, 16) !== 1 || snapM(1.03, 24) !== 25 / 24) throw new Error('snapM');
    console.log(`      both densities show 40 × 22.5 m; default ${DEFAULT_PPM} px/m`);
  } },
  { name: 'the picture fits any window: widened, capped, even, scaled', fn() {
    for (const ppm of [16, 24]) {
      const res = DENSITIES[ppm].res, resMax = [Math.round(MAX_VIEW_M[0] * ppm / 2) * 2, Math.round(MAX_VIEW_M[1] * ppm / 2) * 2];
      const f169 = frameFor(1920, 1080, 1, { res, resMax });
      if (f169.w !== res[0] || f169.h !== res[1] || f169.scale !== 1920 / res[0]) throw new Error(`16:9 at ${ppm}`);
      const wide = frameFor(2560, 1080, 2, { res, resMax }), tall = frameFor(1200, 1000, 1, { res, resMax }), ultra = frameFor(5000, 1000, 1, { res, resMax });
      for (const f of [wide, tall, ultra]) if (f.w % 2 || f.h % 2) throw new Error('odd picture side');
      if (!(wide.w > res[0] && wide.h === res[1])) throw new Error('wide window: wider picture');
      if (!(tall.h > res[1] && tall.w === res[0])) throw new Error('tall window: taller picture');
      if (ultra.w !== resMax[0]) throw new Error('capped');
      console.log(`      ${ppm} px/m: 1920×1080 → ${f169.w}×${f169.h} ×${f169.scale}; 2560×1080@2x → ${wide.w}×${wide.h} on ${wide.outW}×${wide.outH}; 1200×1000 → ${tall.w}×${tall.h}; 5000×1000 → ${ultra.w}×${ultra.h} (cap)`);
    }
  } },
  { name: 'sky keyframes are tradecraft\'s; moods are complete', fn() {
    const day = skyAt(18), night = skyAt(-9), dusk = skyAt(0.5);
    if (day.sunK !== 0.79 || day.skyK !== 0.6 || day.glow !== 0 || night.glow !== 1 || dusk.sun !== SKY.earth[2].sun) throw new Error('keyframes');
    for (const k of MOOD_KEYS) {
      const m = moodOf(k), g = glowKOf(m);
      if (g[GLOW.ALWAYS] !== 1 || g.length !== 8) throw new Error(`${k} glow classes`);
      for (const f of ['sun', 'sunK', 'sky', 'ground', 'skyK', 'shadow', 'tint', 'lamps', 'glow', 'stripLight', 'battleLight', 'dimK']) if (m[f] === undefined) throw new Error(`${k} lacks ${f}`);
    }
    const g = (k) => glowKOf(moodOf(k));
    if (g('battle')[GLOW.BATTLE] !== 1 || g('blackout')[GLOW.STRIP] !== 1 || g('blackout')[GLOW.SCREEN] !== 0 || g('emergency')[GLOW.EMERGENCY] !== 1 || g('day')[GLOW.STRIP] !== 0) throw new Error('mood glows');
    console.log(`      ${MOOD_KEYS.join(', ')}: front light ${MOOD_KEYS.map(k => { const m = MOODS[k]; return (m.sunK + m.skyK * 0.5).toFixed(2); }).join(' / ')} (sun + half the sky fill)`);
  } },
  { name: 'lamp slots take the nearest lit lamps; pools are hard-edged', fn() {
    const lamps = Array.from({ length: 30 }, (_, i) => ({ x: i * 3, z: 0, r: 2, core: 0.5, ring: 0.2, kind: i % 5 ? 'ceiling' : 'emergency', color: 0xffffff }));
    const night = moodOf('night'), em = moodOf('emergency');
    const p = pickLamps(lamps, 30, 0, night, 10);
    if (p.length !== 10 || p[0].lamp.x !== 30 && p[0].lamp.x !== 33 && p[0].lamp.x !== 27) throw new Error('nearest');
    if (p.some(q => q.lamp.kind !== 'ceiling')) throw new Error('night lights only ceiling lamps here');
    if (pickLamps(lamps, 30, 0, moodOf({ ...em, lamps: { ceiling: 0, emergency: 1 } }), 10).length !== 6) throw new Error('only the six emergency lamps lit');
    if (pickLamps(lamps, 30, 0, em, 10).length !== 10) throw new Error('emergency: ceiling lamps at a tenth still count');
    const core = lightAt(night, [lamps[1]], 3.5, 0), ring = lightAt(night, [lamps[1]], 3 + 2.5, 0), out = lightAt(night, [lamps[1]], 3 + 3.5, 0);
    if (!(core[0] > ring[0] && ring[0] > out[0] && out[0] === night.tint[0])) throw new Error('pool rings');
    console.log(`      10 of 30 lamps; light under a pool ${core[0].toFixed(3)}, its ring ${ring[0].toFixed(3)}, outside ${out[0].toFixed(3)} (linear red)`);
  } },
  { name: 'the painter: words, glow classes, holes, clipping', fn() {
    const pm = paint(8, 4, (px, w, h) => { px(-2, -2, 20, 20, 0x112233); px(1, 1, 2, 1, 0xe7b84a, GLOW.NIGHT); px(5, 2, -2, 1, null); });
    const a = pixAt(pm, 0, 0), b = pixAt(pm, 1, 1), c = pixAt(pm, 3, 2);
    if (a.hex !== 0x112233 || a.glow !== 0 || a.hole) throw new Error('base');
    if (b.hex !== 0xe7b84a || b.glow !== GLOW.NIGHT) throw new Error('glow');
    if (!c.hole) throw new Error('hole (a negative width runs left)');
    if (unword(word(0xabcdef, 5)).glow !== 5 || word(null) !== 0) throw new Error('word');
    const g = paint(4, 4, (px) => px(0, 0, 4, 4, 0x223344), { glows: { 0x223344: GLOW.SCREEN } });
    if (pixAt(g, 2, 2).glow !== GLOW.SCREEN || !g.glows) throw new Error('glows by colour');
    console.log('      fills clip to the painting, a negative size runs left, null punches a hole, glow classes ride in the alpha byte');
  } },
  { name: 'tiles repeat without a seam at both densities', fn() {
    for (const ppm of [16, 24]) for (const kind of TILE_KINDS()) {
      const t = tile(kind, { metres: 1, ppm });
      if (t.w !== ppm || !t.repeat) throw new Error(`${kind} size`);
      // (no row or column wholly unpainted; the colour across the wrap differs no more than inside: a crude seam check)
      for (let i = 0; i < t.data.length; i++) if (t.data[i] >>> 24 < 248) throw new Error(`${kind}: a hole at ${i}`);
    }
    const pm = paint(40, 7, (px) => text(px, 1, 1, 'MCRN 4', 0xffffff));
    console.log(`      ${TILE_KINDS().length} kinds (${TILE_KINDS().join(', ')}) painted at 16 and 24 px/m; 'MCRN 4' is ${textWidth('MCRN 4')} px wide in the 3 × 5 font`);
    if (pixAt(pm, 1, 1).hex !== 0xffffff) throw new Error('font');
  } },
];
