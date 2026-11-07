// figures-hair: the regulation cuts drawn at their steps (the build sheet 0.0.6 §2.2, §5.2; the user, 2026-11-06, of
// v0.0.4's horseshoe: "this haircut is not military acceptable"). Each cut × step × view is composed at 16 px/m on a
// bare head (PT kit) and under the utility cover, the doll's head and the sleeper's pillow likewise; printed: the
// pixels that change between consecutive steps; held: no 'bald' and no 'crew' in the art or the data, each step at
// least 2 px from the next on the figure (but a bun's and a braid's, which change only at step 3), a cut never drawn
// over a cover. Shots of every cut at its four steps, the doll's and the sleepers', to .run/figures-hair/.
import { assert, root } from './helpers.mjs';
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import path from 'node:path';
import { composeFrame } from '../src/art/figures/compose.js';
import { shade } from '../src/art/figures/shade.js';
import { wear, coloursOf, cutOf } from '../src/art/figures/outfits.js';
import { headKit, CUT_IDS } from '../src/art/figures/templates.js';
import { doll } from '../src/art/doll/doll.js';
import { paintSleeper, sleeperKey } from '../src/art/figures/bedding.js';
import { CUTS, KIT, HAIR_STYLES } from '../src/data/people/looks.js';

const OUT = path.join(root, '.run', 'figures-hair');
const VIEWS = ['down', 'up', 'right', 'left'];
const PINNED = new Set(['bun', 'braid']);
const LOOKS = { highTight: ['tan', 'dark'], lowReg: ['light', 'brown'], medReg: ['brown', 'black'], shaved: ['dark', 'black'], short: ['light', 'auburn'], bun: ['tan', 'black'], braid: ['brown', 'dark'] };
const look = (cut, step, outfit = 'pt') => wear({ outfit, skin: LOOKS[cut][0], hair: { style: cut, color: LOOKS[cut][1], step }, seed: 3, sex: CUTS[cut].sex });
const frameOf = (cut, step, view, outfit) => { const L = look(cut, step, outfit), fr = composeFrame(L, view, 'idle0', { ppm: 16 }); return { fr, pm: shade(fr.cells, coloursOf(L, 16)) }; };
const diffPx = (a, b) => { let n = 0; for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) n++; return n; };

// (a PNG of 0xrrggbb pixels: the shots, written without a dependency)
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
function sheet(w, h, bg = 0x202028) {
  const px = new Int32Array(w * h).fill(bg);
  return {
    put(x, y, c) { if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = c; },
    blit(pm, x0, y0, k = 1, rows = pm.h, from = 0) {
      for (let y = 0; y < rows; y++) for (let x = 0; x < pm.w; x++) {
        const v = pm.data[(y + from) * pm.w + x];
        if (!v) continue;
        const c = ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff);
        for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) this.put(x0 + x * k + i, y0 + y * k + j, c);
      }
    },
    save(file) {
      const raw = Buffer.alloc((w * 3 + 1) * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = px[y * w + x], o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = (c >> 16) & 255; raw[o + 1] = (c >> 8) & 255; raw[o + 2] = c & 255; }
      const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
      writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
    },
  };
}
// (every .js file under a folder)
const filesUnder = (dir) => readdirSync(dir).flatMap(f => { const p = path.join(dir, f); return statSync(p).isDirectory() ? filesUnder(p) : p.endsWith('.js') ? [p] : []; });

export default [
  {
    name: 'no \'bald\' and no \'crew\' in the art or the data (the user, 2026-11-06: "this haircut is not military acceptable"): the kit\'s cuts are CAREER §2\'s seven, the data\'s and the art\'s the same',
    heavy: true,
    fn() {
      const hits = [];
      for (const f of [...filesUnder(path.join(root, 'src', 'art')), ...filesUnder(path.join(root, 'src', 'data'))]) {
        readFileSync(f, 'utf8').split('\n').forEach((line, i) => { if (/['"`](bald|crew)['"`]/.test(line)) hits.push(`${path.relative(root, f)}:${i + 1}`); });
      }
      const kit = headKit(15, 14, 12);
      console.log(`      the kit's cuts: ${CUT_IDS.join(', ')}; the data's: ${KIT.styles.join(', ')}; men ${HAIR_STYLES.m.map(x => x[0]).join(', ')}, women ${HAIR_STYLES.f.map(x => x[0]).join(', ')}; 'bald' or 'crew' as an id in src/art or src/data: ${hits.length ? hits.join(', ') : 'none'}`);
      assert(!hits.length, hits.join(', '));
      assert(CUT_IDS.join() === KIT.styles.join() && CUT_IDS.join() === Object.keys(CUTS).join(), 'the kit\'s cuts are the data\'s');
      for (const v of VIEWS) assert(!('bald' in kit[v].hair) && !('crew' in kit[v].hair), `${v}: ${Object.keys(kit[v].hair).join()}`);
      assert(cutOf('crew') === 'lowReg' && cutOf('bald') === 'shaved' && cutOf(undefined) === 'lowReg', 'a v0.0.5 look read by the art');
    },
  },
  {
    name: 'each cut at its four steps in every view at 16 px/m: each step at least 2 px from the next on the head (the sides from skin to a shadow, a dark, the hair\'s colour; the top a pixel taller at step 3), a bun or a braid changing only at step 3 (stray pixels); the doll and the sleeper\'s pillow likewise; shots to .run/figures-hair/',
    heavy: true,
    fn() {
      mkdirSync(OUT, { recursive: true });
      const K = 4, CW = 26, CH = 30, cuts = Object.keys(CUTS);
      const fig = sheet(4 * VIEWS.length * CW * K + 20, cuts.length * CH * K + 20);
      const bad = [];
      for (const [r, cut] of cuts.entries()) {
        const rows = [];
        for (const [vi, view] of VIEWS.entries()) {
          const pms = [0, 1, 2, 3].map(step => frameOf(cut, step, view, 'pt').pm);
          const d = [diffPx(pms[0], pms[1]), diffPx(pms[1], pms[2]), diffPx(pms[2], pms[3])];
          rows.push(`${view} ${d.join('/')}`);
          d.forEach((n, i) => { const need = PINNED.has(cut) && i < 2 ? 0 : 2; if (n < need) bad.push(`${cut} ${view} step ${i}→${i + 1}: ${n} px`); });
          if (PINNED.has(cut)) assert(d[0] === 0 && d[1] === 0, `${cut} ${view}: changed before step 3 (${d})`);
          pms.forEach((pm, step) => {
            const top = frameOf(cut, step, view, 'pt').fr.cells.findIndex(row => row.some(Boolean));
            fig.blit(pm, 10 + (step * VIEWS.length + vi) * CW * K, 10 + r * CH * K, K, CH, Math.max(0, top - 2));
          });
        }
        console.log(`      ${CUTS[cut].word}: pixels changed step to step ${rows.join(', ')}`);
      }
      fig.save(path.join(OUT, 'figures.png'));
      assert(!bad.length, bad.join('; '));
      // (the doll: each cut at its four steps; the sleeper's pillow)
      const dl = sheet(4 * 64 * 3 + 20, cuts.length * 34 * 3 + 20), dollRows = [], sleepRows = [];
      for (const [r, cut] of cuts.entries()) {
        const pms = [0, 1, 2, 3].map(step => doll({ look: { outfit: 'pt', skin: LOOKS[cut][0], hair: { style: cut, color: LOOKS[cut][1], step } }, sex: CUTS[cut].sex, scale: 1 }));
        const d = [diffPx(pms[0], pms[1]), diffPx(pms[1], pms[2]), diffPx(pms[2], pms[3])];
        dollRows.push(`${cut} ${d.join('/')}`);
        pms.forEach((pm, step) => dl.blit(pm, 10 + step * 64 * 3, 10 + r * 34 * 3, 3, 34, 0));
        if (!PINNED.has(cut)) assert(d.every(n => n >= 2), `the doll's ${cut}: ${d}`);
        else assert(d[0] === 0 && d[1] === 0 && d[2] >= 2, `the doll's ${cut}: ${d}`);
        const pillow = [0, 1, 2, 3].map(step => { const W = 13, H = 31, buf = new Uint32Array(W * H); paintSleeper((x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < W && Y < H) buf[Y * W + X] = c; } }, W, H, { skin: LOOKS[cut][0], hair: { style: cut, color: LOOKS[cut][1], step }, seed: 2, ppm: 16 }); return { data: buf }; });
        const ds = [diffPx(pillow[0], pillow[1]), diffPx(pillow[1], pillow[2]), diffPx(pillow[2], pillow[3])];
        sleepRows.push(`${cut} ${ds.join('/')}`);
        assert(new Set([0, 1, 2, 3].map(step => sleeperKey({ hair: { style: cut, step } }))).size === 4, `${cut}: the sleeper's key must name the step`);
        if (!PINNED.has(cut) && cut !== 'short') assert(ds.every(n => n >= 1), `the sleeper's ${cut}: ${ds}`);
      }
      dl.save(path.join(OUT, 'doll.png'));
      console.log(`      the doll's head, pixels changed step to step: ${dollRows.join(', ')}`);
      console.log(`      the sleeper's head on the pillow: ${sleepRows.join(', ')}`);
      console.log(`      shots: .run/figures-hair/figures.png (each cut a row, steps 0 to 3 × down, up, right, left), doll.png`);
    },
  },
  {
    name: 'a cut is never drawn over a cover: under the utility cover the cover\'s pixels are the same whatever the cut and its step; a man\'s sides show below it by their step',
    heavy: true,
    fn() {
      const coverOf = (fr) => fr.cells.flatMap((row, y) => row.map((c, x) => (c && /^[aA]$/.test(c.ch) ? `${x},${y}` : null)).filter(Boolean)).join(';');
      const rows = [];
      for (const view of VIEWS) {
        const ref = coverOf(frameOf('shaved', 0, view, 'utilities').fr);
        for (const cut of Object.keys(CUTS)) for (const step of [0, 3]) {
          const got = coverOf(frameOf(cut, step, view, 'utilities').fr);
          assert(got === ref, `${cut} at step ${step} from ${view}: the cover's pixels differ`);
        }
        const below = diffPx(frameOf('lowReg', 0, view, 'utilities').pm, frameOf('lowReg', 3, view, 'utilities').pm);
        rows.push(`${view}: the cover the same for every cut and step; a low regulation cut's sides below it ${below} px apart from step 0 to 3`);
      }
      for (const r of rows) console.log(`      ${r}`);
    },
  },
];
