// OLYMPUS tests: vig-clean, the clean's vignette at the cleaning table (the build sheet v0.0.28 §1 C, item 20, §6 C; F188's node half).
//
// While clean-rifle or clean-again runs at a cleaning table (vignette 'clean'), the stage stands the mat on the table's top before you,
// its frame by the clean's part (src/render/vignette-items.js cleanFrameOf over CLEAN_PARTS: 0 the strip, 1 the clean's first half,
// dirty, 2 its second, cleaned, 3 the oil, 4 together), your hands at its north corners in your skin, and the air hose's puff over its
// outer end in the clean part's first fifth only: two cards at most, dissolving with the iris; and every piece the clean's splash stands
// is one cleanWarmItems stood dissolved at the brief, so the splash uploads nothing (F188). F188's node half (tests/flawless-ground.mjs
// lookGauge) sweeps a clean at a north spot of every table. Quick. Fails without the clean's branch (no mat), with the frame read off
// the part's bounds, a puff outside the first fifth or a third card.
import { assert } from './helpers.mjs';
import { GROUND_AREA } from '../src/sim/places/ground.js';
import { armouryPlaceOf } from '../src/sim/places/fixtures.js';
import { vignetteItems, cleanFrameOf, cleanWarmItems, toLocal, fixturePoint, CLEAN_PARTS, PUFF_SHARE, PUFF_FPS, MAT_IN_M } from '../src/render/vignette-items.js';
import { VIGNETTE_PIECES, pieceKey } from '../src/art/kit/vignette.js';
import { SKIN } from '../src/art/figures/outfits.js';
import { FOOTPRINTS } from '../src/art/kit/index.js';
import { lookGauge, f188Line } from './flawless-ground.mjs';

const table = (id) => GROUND_AREA.fixtures.find(f => f.id === id);
const sp = (vk, more = {}) => ({ vignette: 'clean', vk, form: 'full', inkK: 1, ...more });

export default [
  {
    name: 'F188 (node half): over a clean at a north spot of each of the eight tables the mat stands on the table\'s top before you with its frame by the clean\'s part (strip, the clean\'s two halves, oil, together), the puff only in the clean part\'s first fifth, never more than two cards',
    fn() {
      const r = lookGauge().F188;
      console.log(`      ${f188Line(r)}`);
      assert(r.ok, JSON.stringify({ wrong: r.wrong.slice(0, 4), puffOut: r.puffOut.slice(0, 4), matOff: r.matOff.slice(0, 4), maxCards: r.maxCards, frames: r.frames }));
    },
  },
  {
    name: 'the clean\'s frames at its parts\' bounds (CLEAN_PARTS 0.1, 0.7, 0.1, 0.1, the sim\'s upkeep.js shares), the puff at 6 fps on the view\'s clock, the mat 0.15 m in from your edge of the table in whole pixels at 16 and 24 px/m, your hands in your skin, the cards dissolving with the iris; nothing at another vignette or another fixture',
    async fn() {
      // (the render's shares are the sim's (src/sim/arms/upkeep.js CLEAN_PARTS, the activity's own parts): written twice, held equal here)
      const sim = await import('../src/sim/arms/upkeep.js').catch(() => null);
      assert(!sim || JSON.stringify(sim.CLEAN_PARTS) === JSON.stringify(CLEAN_PARTS), JSON.stringify({ render: CLEAN_PARTS, sim: sim?.CLEAN_PARTS }));
      const [a, b, c] = [CLEAN_PARTS[0], CLEAN_PARTS[0] + CLEAN_PARTS[1], CLEAN_PARTS[0] + CLEAN_PARTS[1] + CLEAN_PARTS[2]], e = 1e-9;
      const bounds = [[0, 0, false], [a - e, 0, false], [a, 1, true], [a + PUFF_SHARE * CLEAN_PARTS[1] - e, 1, true], [a + PUFF_SHARE * CLEAN_PARTS[1], 1, false], [a + CLEAN_PARTS[1] / 2 - e, 1, false], [a + CLEAN_PARTS[1] / 2, 2, false], [b - e, 2, false], [b, 3, false], [c - e, 3, false], [c, 4, false], [1, 4, false], [NaN, 0, false], [2, 4, false]];
      for (const [vk, stage, puff] of bounds) { const got = cleanFrameOf(vk); assert(got.stage === stage && got.frame === [0, 1, 2, 3, 0][stage] && got.puff === puff, JSON.stringify({ vk, got, stage, puff })); }
      const t = table('f:canopy:t3'), you = { ...armouryPlaceOf('f:canopy:t3#1'), look: { skin: 'tan' } };
      // (the puff's frames on the view's clock at PUFF_FPS)
      const frames = [0, 1, 2, 3].map(i => vignetteItems({ sp: sp(0.15), fixture: t, you, tS: i / PUFF_FPS }).find(x => x.name === 'airPuff').opts.frame);
      assert(frames.join() === '0,1,2,0', frames.join());
      // (the mat: its foot at its south edge (an upright card's foot is its nearest row), its north edge hM above, in whole pixels; 0.15 m in
      // from your edge, on the north half for a north spot, the south half for a south one)
      const lines = [];
      for (const ppm of [16, 24]) for (const n of [1, 2, 3, 4]) {
        const me = { ...armouryPlaceOf(`f:canopy:t3#${n}`), look: { skin: 0x8c5a3f } }, mat = vignetteItems({ sp: sp(0.5), fixture: t, you: me, ppm }).find(x => x.name === 'cleanMat');
        const [lx, lz] = toLocal(t, mat.x, mat.z - 0.01), hM = Math.round(VIGNETTE_PIECES.cleanMat.hM * ppm) / ppm, D = FOOTPRINTS.cleanTable.d, side = n <= 2 ? -1 : 1;
        const top = lz - hM, edge = side < 0 ? -D / 2 + MAT_IN_M : D / 2 - MAT_IN_M - hM;
        assert(Math.abs(top - edge) < 1e-9 && Math.abs(mat.x - me.x) < 1e-9 && mat.y === FOOTPRINTS.cleanTable.h && mat.opts.colour === 0x8c5a3f, JSON.stringify({ ppm, n, mat, top, edge, lx }));
        if (ppm === 16) lines.push(`#${n} (${me.x}, ${me.z}) ${me.face}: the mat from local z ${top.toFixed(3)} to ${(top + hM).toFixed(3)}`);
      }
      const named = vignetteItems({ sp: sp(0.5), fixture: t, you }).find(x => x.name === 'cleanMat');
      assert(named.opts.colour === SKIN.tan, `the skin by name: ${named.opts.colour}`);
      // (the iris: the cards dissolve with its ink in a full splash)
      const half = vignetteItems({ sp: sp(0.15, { inkK: 0.3 }), fixture: t, you });
      assert(half.length === 2 && half.every(x => Math.abs(x.fade - 0.3) < 1e-9), JSON.stringify(half));
      // (nothing at another vignette, nor at another fixture)
      const other = vignetteItems({ sp: { ...sp(0.5), vignette: 'sink' }, fixture: t, you }), stall = vignetteItems({ sp: sp(0.5), fixture: GROUND_AREA.fixtures.find(f => f.kind === 'clearingBarrel'), you });
      assert(!other.length && !stall.length, JSON.stringify({ other, stall }));
      const [px, pz] = fixturePoint(t, 0, 0);
      console.log(`      the shares ${CLEAN_PARTS.join(', ')} (the sim's ${sim ? sim.CLEAN_PARTS.join(', ') : 'not merged here'}); frames at the bounds: ${bounds.map(([vk, f, p]) => `${Number.isFinite(vk) ? vk.toFixed(3) : vk} ${f}${p ? '+puff' : ''}`).join(', ')}; the puff's frames at 0 to 0.5 s ${frames.join(', ')}; table t3 at (${px}, ${pz}): ${lines.join('; ')}; at the iris's 0.3 both cards at 0.3`);
    },
  },
  {
    name: 'every piece a clean\'s splash stands is one cleanWarmItems stands dissolved at the brief (the mat\'s four pictures in your skin, the puff\'s three frames), so the splash puts nothing new in the atlas (F188: nothing uploaded after the brief\'s cut)',
    fn() {
      const lines = [];
      for (const skin of ['tan', 0x5e3a2a]) {
        const you = { ...armouryPlaceOf('f:canopy:t6#2'), look: { skin } }, warm = cleanWarmItems(you), keys = new Set(warm.map(it => pieceKey(it.name, it.opts, 16))), used = new Set();
        assert(warm.every(it => it.fade === 0) && warm.length === 4 + VIGNETTE_PIECES.airPuff.frames, JSON.stringify(warm));
        for (let i = 0; i <= 400; i++) for (const it of vignetteItems({ sp: sp(i / 400), fixture: table('f:canopy:t6'), you, tS: i * 0.037 })) used.add(pieceKey(it.name, it.opts, 16));
        const missing = [...used].filter(k => !keys.has(k));
        assert(!missing.length && used.size === keys.size, JSON.stringify({ missing, used: used.size, warm: keys.size }));
        lines.push(`${typeof skin === 'number' ? skin.toString(16) : skin}: ${used.size} pieces stood over the clean, all ${keys.size} warmed`);
      }
      console.log(`      ${lines.join('; ')}`);
    },
  },
];
