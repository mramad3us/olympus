// OLYMPUS tests: the light the stage draws is places' light, and the ground's chunks meet without a seam (quick).
//
// src/render/light-maps.js carries places' numbers (src/sim/places/light.js lampsOf, lightLevel) to the
// shaders: the lamp table and its 4 m grid, the room map, the tints through the eye's exposure. In node,
// on Echo's ground floor at 23:00 and 12:40 and on the ground at 23:00: every lit pool is in the table
// and in every grid cell its ring reaches (none left out, so no pool appears or vanishes as the camera
// moves), the pools the CPU twin finds at a point are the pools places counts there (lightLevel less the
// room's fill), each room's fill is places' own, ceiling lamps make no pool (the look round's blotches),
// the exposure is monotone and a lit room's fill shows its painted colours, a tint's brightness is the
// exposure of its level. Then the ground's chunks (src/art/terrain/base.js): every building's rects
// reach the chunks they cross, a building is one part on every chunk it crosses (no outline at a seam),
// and a chunk's job is a few kilobytes. Prints the counts and the timings.
import { assert, fmt } from './helpers.mjs';
import { lampMaps, roomFills, roomMap, poolAt, exposure, tintOf, isPool, ADAPT_L } from '../src/render/light-maps.js';
import { lampsOf, lightLevel } from '../src/sim/places/light.js';
import { areaOf } from '../src/sim/places/model.js';
import { indexGround, pieceOf, chunkAt, layChunk, CHUNK_M } from '../src/art/terrain/base.js';
import { createCollector } from '../src/art/jobs.js';
import { msAtMarsTime } from '../src/core/calendar.js';
import { START_MS } from '../src/data/setting/calendar.js';

const LON = 287.2;
const at = (h) => msAtMarsTime(START_MS, Math.floor(h), Math.round((h % 1) * 60), LON);
const stateIn = (area, ms) => ({ clock: { ms }, places: { live: { site: 'melas', area }, sites: {}, nav: { queue: [], pending: [], debtNodes: 0 } }, meta: { seed: 1 } });

export default [
  {
    name: 'every lit pool is in the lamp table and in every cell its ring reaches; ceiling lamps make none; the CPU twin counts the pools places counts',
    fn() {
      for (const [id, h] of [['melas.echo.1', 23], ['melas.echo.1', 12.67], ['melas.ground', 23]]) {
        const area = areaOf(id), ms = at(h), s = stateIn(id, ms), lamps = lampsOf(s, id, ms), b = area.boundsM;
        const t0 = performance.now(), maps = lampMaps(lamps, { x0: b.x0 - 4, z0: b.z0 - 4, x1: b.x1 + 4, z1: b.z1 + 4 }), mapMs = performance.now() - t0;
        const pools = lamps.filter(isPool), ceil = lamps.filter(l => l.kind === 'ceiling' && l.on);
        // (every cell a pool's ring reaches holds it)
        let missing = 0;
        for (const [i, l] of maps.lamps.entries()) {
          const R = 1.5 * l.r;
          for (let a = -R; a <= R; a += 0.5) for (let c = -R; c <= R; c += 0.5) {
            if (Math.hypot(a, c) >= R) continue;
            const cx = Math.floor((l.x + a - maps.x0) / maps.cellM), cz = Math.floor((l.z + c - maps.z0) / maps.cellM);
            if (cx < 0 || cz < 0 || cx >= maps.nx || cz >= maps.nz) continue;
            const ids = maps.grid.subarray((cz * maps.nx + cx) * 4, (cz * maps.nx + cx) * 4 + 4);
            if (![...ids].includes(i + 1)) missing++;
          }
        }
        // (the pools at points round each pool: the CPU twin's against lightLevel less the fill there, where nothing saturates)
        let worst = 0, n = 0;
        if (area.kind !== 'ground') {
          const fills = roomFills(area, lamps, (x, z) => lightLevel(s, x, z, ms, id));
          for (const l of pools) for (const d of [0, 0.5 * l.r, 1.2 * l.r, 1.6 * l.r]) {
            const x = l.x + d, z = l.z, r = (area.rooms ?? []).find(q => x > q.rect[0] && x < q.rect[2] && z > q.rect[1] && z < q.rect[3]);
            if (!r) continue;
            const L = lightLevel(s, x, z, ms, id), want = L - fills.get(r.id), got = poolAt(lamps, x, z).k;
            if (L >= 1) continue;
            worst = Math.max(worst, Math.abs(want - got)); n++;
          }
        }
        console.log(`      ${id} at ${h}:00: ${lamps.length} lamps, ${pools.length} pools in the table (${maps.rows} row${maps.rows > 1 ? 's' : ''}), ${ceil.length} lit ceiling lamps making none; a grid of ${maps.nx} × ${maps.nz} cells of ${maps.cellM} m, ${maps.overflow} overflowing, ${missing} cells missing a pool, built in ${fmt(mapMs, 2)} ms${n ? `; the twin against places at ${n} points: ${fmt(worst, 4)} apart at worst` : ''}`);
        assert(maps.n === pools.length && maps.overflow === 0 && missing === 0, JSON.stringify({ n: maps.n, pools: pools.length, overflow: maps.overflow, missing }));
        assert(!maps.lamps.some(l => l.kind === 'ceiling'), 'a ceiling lamp made a pool');
        assert(worst <= 0.0002, `the CPU twin is ${worst} from places' pools`);
      }
    },
  },
  {
    name: 'each room\'s fill is places\' own (the bay 0.75 by day, 0.04 at lights out, the head lit); the exposure is monotone, a lit room shows its painted colours, a tint\'s brightness is its level\'s exposure',
    fn() {
      const area = areaOf('melas.echo.1'), rows = [];
      for (const h of [12.67, 21, 23]) {
        const ms = at(h), s = stateIn(area.id, ms), lamps = lampsOf(s, area.id, ms);
        const fills = roomFills(area, lamps, (x, z) => lightLevel(s, x, z, ms, area.id));
        const m = roomMap(area, fills, new Map());
        rows.push(`${h}:00 bay-2-1 ${fmt(fills.get('e1.bay-2-1'), 3)}, hall-2 ${fmt(fills.get('e1.hall-2'), 3)}, head-2a ${fmt(fills.get('e1.head-2a'), 3)} (the map ${m.nx} × ${m.nz})`);
        if (h === 12.67) assert(Math.abs(fills.get('e1.bay-2-1') - 0.75) < 0.01, `the bay by day: ${fills.get('e1.bay-2-1')}`);
        if (h === 23) assert(fills.get('e1.bay-2-1') <= 0.06 && fills.get('e1.head-2a') >= 0.6, `at 23:00: the bay ${fills.get('e1.bay-2-1')}, the head ${fills.get('e1.head-2a')}`);
      }
      let mono = true, last = -1;
      for (let L = 0; L <= 1.0001; L += 0.01) { const e = exposure(L); if (e < last) mono = false; last = e; }
      const red = tintOf(0.29, [0.2, 0.2, 0.3], { k: 0.25, rgb: [0.25 * 0.65, 0.25 * 0.04, 0.25 * 0.03] }), lum = 0.3 * red[0] + 0.59 * red[1] + 0.11 * red[2];
      console.log(`      ${rows.join('; ')}`);
      console.log(`      the exposure: 0.04 → ${fmt(exposure(0.04), 3)}, 0.12 → ${fmt(exposure(0.12), 3)}, 0.35 → ${fmt(exposure(0.35), 3)}, ${ADAPT_L} → ${fmt(exposure(ADAPT_L), 3)}, 1 → ${fmt(exposure(1), 3)}; monotone ${mono}; a figure under the red lamp at 0.29: tint ${red.map(v => fmt(v, 3)).join(', ')}, luma ${fmt(lum, 3)} = exposure ${fmt(exposure(0.29), 3)}`);
      assert(mono && exposure(ADAPT_L) === 1 && Math.abs(lum - exposure(0.29)) < 1e-9 && red[0] > red[1] * 3, JSON.stringify({ mono, red }));
    },
  },
  {
    name: 'the ground\'s chunks: every building reaches the chunks it crosses, one part on every one of them (no outline at a seam), a chunk\'s job a few kilobytes',
    fn() {
      const g = areaOf('melas.ground'), t0 = performance.now(), idx = indexGround(g), idxMs = performance.now() - t0;
      let crossings = 0, partsOff = 0, maxBytes = 0, layMs = 0, chunksLaid = 0;
      for (const [i, m] of (g.massing ?? []).entries()) {
        const keys = new Set();
        for (const r of m.rects) { const [a0, b0] = chunkAt(r[0], r[1]), [a1, b1] = chunkAt(r[2] - 1e-6, r[3] - 1e-6); for (let cz = b0; cz <= b1; cz++) for (let cx = a0; cx <= a1; cx++) keys.add(`${cx},${cz}`); }
        if (keys.size > 1) crossings++;
        const parts = new Set();
        for (const k of keys) {
          const [cx, cz] = k.split(',').map(Number), piece = pieceOf(g, idx, cx, cz);
          if (!idx.chunks.has(k)) continue;
          assert(piece.massing.some(x => x.index === i), `${m.id} is missing from chunk ${k}`);
          maxBytes = Math.max(maxBytes, JSON.stringify(piece).length);
          const col = createCollector({ ppm: 16, part: (() => { let n = 50000; return () => n++; })() });
          const t1 = performance.now();
          layChunk(col, piece, { massPart: (j) => 1000 + j, fencePart: 999 });
          layMs += performance.now() - t1; chunksLaid++;
          for (const it of col.items) if (it.part >= 1000 && it.part < 50000) parts.add(it.part);
        }
        if (!parts.has(1000 + i)) partsOff++;
      }
      // (and no chunk gives a building's boxes any part but its own: the massing parts a chunk holds are its buildings')
      let foreign = 0;
      for (const [k] of idx.chunks) {
        const [cx, cz] = k.split(',').map(Number), piece = pieceOf(g, idx, cx, cz);
        if (!piece.massing.length) continue;
        const col = createCollector({ ppm: 16, part: (() => { let n = 50000; return () => n++; })() });
        layChunk(col, piece, { massPart: (j) => 1000 + j, fencePart: 999 });
        const own = new Set(piece.massing.map(m => 1000 + m.index));
        for (const it of col.items) if (it.part >= 1000 && it.part < 50000 && !own.has(it.part)) foreign++;
      }
      partsOff += foreign;
      console.log(`      ${g.massing.length} buildings, ${crossings} of them across chunk lines; the index ${idx.chunks.size} chunks of ${CHUNK_M} m in ${fmt(idxMs, 1)} ms; ${chunksLaid} chunks laid in ${fmt(layMs, 0)} ms; a chunk's record ${fmt(maxBytes / 1024, 1)} KB at most; buildings with more than one part across their chunks: ${partsOff}`);
      assert(partsOff === 0 && maxBytes < 64 * 1024, JSON.stringify({ partsOff, maxBytes }));
    },
  },
];
