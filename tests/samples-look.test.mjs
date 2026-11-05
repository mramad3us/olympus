// The look samples (samples/look/) and the gallery the user scores them from (samples/index.html,
// built by tools/gallery.mjs): what the user is shown is what was asked, and shot honestly.
//
// The quick tests read files only. sample.json's matrix expands to the views it promises, a scene's
// four pictures differing in the density and the figures and nothing else (the gallery's captions say
// only that); every person of every cast (cast.js) wears a look the figures draw, in a frame and a
// facing they have; the moment a still freezes is the one placeAt() says (walkers mid-stride by
// distance, a bound in the air, a sitter on the seat). Then the shots: index.json lists every view
// with its shot, each shot is twice its picture's size, every picture pixel a clean 2 × 2 (the gallery
// shoots at three times, point-samples down, keeps twice), and every colour in it is one of the scene's
// palette (the stage snaps every pixel: the figures, the weather and the background too). The PNGs are
// read by a small decoder here (zlib and the five filters), so the test needs nothing installed.
//
// The heavy ones open the pages in Chrome (tests/browser.mjs withGame) on the browser tests' port, or
// SAMPLES_PORT's (an agent's own, while other agents test on 8223): the look page draws a whole cast,
// nothing waiting, in a handful of draw calls; the gallery lists every view, keeps a star and a score
// through a reload, and its "Copy my picks" text carries them with the tallies by row and column.
import { readFileSync, existsSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { expand, nativeOf, readSamples, KEEP_X } from '../tools/gallery.mjs';
import { CASTS, LOOKS, placeAt } from '../samples/look/cast.js';
import { FRAMES, DIRS, STEP_M } from '../src/art/figures/poses.js';
import { OUTFITS, wear } from '../src/art/figures/outfits.js';
import { PROPORTIONS, bodyOf } from '../src/art/figures/body.js';
import { PALETTES } from '../src/art/palette.js';

const SAMPLES = path.join(root, 'samples');
const look = () => readSamples(SAMPLES).find(s => s.folder === 'look');
const lookGroups = () => expand('look', look().sample);
const index = () => JSON.parse(readFileSync(path.join(SAMPLES, 'index.json'), 'utf8'));

/** A PNG's pixels as 0xrrggbb: { w, h, px: Uint32Array } (8-bit RGB, RGBA or palette at 1 to 8 bits, not interlaced). */
export function readPng(file) {
  const b = readFileSync(file);
  assert(b.readUInt32BE(0) === 0x89504e47, `${file}: not a PNG`);
  let at = 8, w = 0, h = 0, depth = 0, type = 0, plte = null;
  const idat = [];
  while (at < b.length) {
    const len = b.readUInt32BE(at), kind = b.toString('latin1', at + 4, at + 8), data = b.subarray(at + 8, at + 8 + len);
    if (kind === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; type = data[9]; assert(data[12] === 0, `${file}: interlaced`); }
    else if (kind === 'PLTE') plte = data;
    else if (kind === 'IDAT') idat.push(data);
    else if (kind === 'IEND') break;
    at += 12 + len;
  }
  const chans = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type], bpp = Math.max(1, (chans * depth) >> 3), stride = Math.ceil(w * chans * depth / 8);
  assert(chans && (depth === 8 || type === 3), `${file}: colour type ${type} at ${depth} bits not read here`);
  const raw = inflateSync(Buffer.concat(idat)), img = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = img.subarray(y * stride, (y + 1) * stride), up = y ? img.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0, u = up ? up[i] : 0, c = up && i >= bpp ? up[i - bpp] : 0;
      let v = src[i];
      if (f === 1) v += a; else if (f === 2) v += u; else if (f === 3) v += (a + u) >> 1;
      else if (f === 4) { const p = a + u - c, pa = Math.abs(p - a), pb = Math.abs(p - u), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? u : c; }
      row[i] = v & 255;
    }
  }
  const px = new Uint32Array(w * h);
  for (let y = 0; y < h; y++) {
    const r = img.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < w; x++) {
    let c;
    if (type === 3) { const bit = x * depth, k = (r[bit >> 3] >> (8 - depth - (bit & 7))) & ((1 << depth) - 1); c = (plte[k * 3] << 16) | (plte[k * 3 + 1] << 8) | plte[k * 3 + 2]; }
    else if (type === 2 || type === 6) { const o = x * chans; c = (r[o] << 16) | (r[o + 1] << 8) | r[o + 2]; }
    else { const g = r[x * chans]; c = (g << 16) | (g << 8) | g; }
    px[y * w + x] = c;
    }
  }
  return { w, h, px };
}

const paramsOf = (q) => Object.fromEntries(new URLSearchParams(q));

export default [
  {
    name: 'look samples: each scene is a 2 × 2 of the candidates, 16 or 24 px/m by chibi or soldier figures, and its four pictures differ in nothing else',
    fn() {
      const groups = lookGroups(), M = look().sample.matrix, ids = new Set();
      assert(groups.map(g => g.id).join() === 'L1,L2,L3,L4,L5', JSON.stringify(groups.map(g => g.id)));
      for (const g of groups) {
        const sets = g.sets.length;
        assert(g.views.length === 4 * sets, JSON.stringify({ g: g.id, views: g.views.length, sets }));
        for (let s = 0; s < sets; s++) {
          const four = g.views.filter(v => v.set === s), rest = four.map(v => { const p = paramsOf(v.query); delete p.ppm; delete p.prop; return JSON.stringify(Object.entries(p).sort()); });
          assert(new Set(rest).size === 1, `${g.id} set ${s}: the four differ in more than ppm and prop: ${JSON.stringify(rest)}`);
          const combos = new Set(four.map(v => `${paramsOf(v.query).ppm}|${paramsOf(v.query).prop}`));
          assert(combos.size === 4 && M.rows.values.every(r => M.cols.values.every(c => combos.has(`${r}|${c}`))), JSON.stringify([...combos]));
          // (the caption says which: the row's and the column's labels, in that order)
          for (const v of four) assert(v.name.endsWith(`${M.rows.labels[v.row]} · ${M.cols.labels[v.col]}`), JSON.stringify(v));
        }
        for (const v of g.views) { assert(!ids.has(v.id) && /^L\d-[a-h]$/.test(v.id), v.id); ids.add(v.id); assert(CASTS[paramsOf(v.query).scene], `${v.id}: no cast for ${v.query}`); }
        console.log(`      ${g.id} ${g.title}: ${g.views.map(v => v.id.slice(3)).join('')}${sets > 1 ? ` (${g.sets.join(', ')})` : ''} · ${paramsOf(g.views[0].query).scene}, zoom ${paramsOf(g.views[0].query).zoom ?? 1}`);
      }
      assert(ids.size === 24, `${ids.size} views`);
    },
  },
  {
    name: 'look samples: every person wears a look the figures draw, faces a way they have and does a frame they have; one is you',
    fn() {
      for (const [name, C] of Object.entries(CASTS)) {
        assert(C.people.filter(p => p.you).length === 1, `${name}: ${C.people.filter(p => p.you).length} yous`);
        const keys = new Set();
        for (const p of C.people) {
          const L = LOOKS[p.look];
          assert(L, `${name}: no look '${p.look}'`);
          const worn = L.top ? L : wear(L);
          assert(OUTFITS.includes(L.outfit ?? worn.outfit), `${name}: ${p.look} outfit ${L.outfit}`);
          assert(worn.top && worn.legs && typeof worn.skin === 'number', `${name}: ${p.look} not worn`);
          assert(DIRS.includes(p.face), `${name}: face ${p.face}`);
          if (p.frame) assert(FRAMES.includes(p.frame), `${name}: frame ${p.frame}`);
          else assert(['idle', 'walk', 'run', 'bound'].includes(p.gait) && (p.gait === 'idle' || (p.speedMs > 0 && p.loopM > 0)), `${name}: gait ${JSON.stringify(p)}`);
          keys.add(p.look);
        }
        // (a look is a sheet in the atlas: 25 slots at 24 px/m, src/render/figures.js)
        assert(keys.size <= 25, `${name}: ${keys.size} looks`);
        console.log(`      ${name}: ${C.people.length} people, ${keys.size} looks, mood ${C.mood}, camera ${C.camera.x}, ${C.camera.z} at zoom ${C.camera.zoom}`);
      }
    },
  },
  {
    name: 'look samples: a still is the moment placeAt says: walkers mid-stride by distance, the bound in the air at its apex, sitters on the seat',
    fn() {
      const t = 0.9;
      const bay = CASTS.bay.people, chasm = CASTS.chasm.people;
      const w = placeAt(bay[0], t, 0.25);
      const d = bay[0].speedMs * t;
      assert(Math.abs(w.x - (bay[0].x + (d % bay[0].loopM))) < 1e-9 && w.stride === d, JSON.stringify(w));
      const b = placeAt(chasm[1], t, 0.25), bf = `bound${Math.floor(b.stride / STEP_M.bound) % 4}`;
      assert(bf === 'bound2' && b.y > 0.35, `the bound at t ${t}: ${bf}, ${b.y.toFixed(2)} m up`);
      const sitter = CASTS.mess.people.find(p => p.frame === 'sit' && p.seat === 0.46);
      const ys = Object.keys(PROPORTIONS).map(prop => placeAt(sitter, t, bodyOf(prop, 16).seatM).y);
      assert(Math.abs(ys[0] - (0.46 - PROPORTIONS.chibi.seatM)) < 1e-9 && Math.abs(ys[1] - Math.max(0, 0.46 - PROPORTIONS.soldier.seatM)) < 1e-9, JSON.stringify(ys));
      const couch = placeAt(CASTS.deck.people[0], t, 0.25);
      assert(couch.frame === 'couch' && couch.y === 0.52, JSON.stringify(couch));
      console.log(`      at t ${t} s: you walk ${d.toFixed(2)} m (frame walk${Math.floor(d / STEP_M.walk) % 4}); the bound ${bf} at ${b.y.toFixed(2)} m; a bench sitter lifted ${ys.map(y => y.toFixed(2)).join(' (A) and ')} (B) m; the couch at ${couch.y} m`);
    },
  },
  {
    name: 'look samples: index.json lists every view of sample.json with its shot, each twice the size of its picture',
    fn() {
      assert(existsSync(path.join(SAMPLES, 'index.json')), 'no samples/index.json: run node tools/gallery.mjs');
      const I = index(), S = I.samples.find(s => s.id === 'look');
      assert(S, 'index.json has no look sample');
      const listed = new Map(S.groups.flatMap(g => g.views.map(v => [v.id, v])));
      const sizes = new Map();
      for (const g of lookGroups()) for (const v of g.views) {
        const got = listed.get(v.id);
        assert(got, `${v.id} not in index.json: run node tools/gallery.mjs`);
        assert(got.query === v.query && got.name === v.name, `${v.id}: index.json is older than sample.json (${got.query} vs ${v.query}): run node tools/gallery.mjs`);
        const native = nativeOf(v.pixel, v.query), file = path.join(SAMPLES, got.shot);
        assert(existsSync(file), `${v.id}: no ${got.shot}`);
        const b = readFileSync(file), w = b.readUInt32BE(16), h = b.readUInt32BE(20);
        assert(w === native[0] * KEEP_X && h === native[1] * KEEP_X, `${v.id}: ${w}×${h}, its picture ${native.join('×')}`);
        assert(got.report?.drawn === got.report?.people && got.report?.people > 0, `${v.id}: drew ${got.report?.drawn} of ${got.report?.people}`);
        sizes.set(`${native.join('×')} → ${w}×${h}`, (sizes.get(`${native.join('×')} → ${w}×${h}`) ?? 0) + 1);
      }
      console.log(`      built ${I.built}: ${listed.size} views; ${[...sizes].map(([k, n]) => `${n} at ${k}`).join(', ')}`);
    },
  },
  {
    name: 'look samples: every shot is crisp (whole 2 × 2 picture pixels) and every colour in it is one of its scene\'s palette',
    fn() {
      const S = index().samples.find(s => s.id === 'look');
      let n = 0, pixels = 0;
      const colours = [];
      for (const g of S.groups) for (const v of g.views) {
        const { w, h, px } = readPng(path.join(SAMPLES, v.shot));
        const pal = new Set(PALETTES[v.report.palette]);
        assert(pal.size, `${v.id}: no palette '${v.report.palette}'`);
        let soft = 0, off = 0;
        const seen = new Set();
        for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) {
          const c = px[y * w + x];
          if (px[y * w + x + 1] !== c || px[(y + 1) * w + x] !== c || px[(y + 1) * w + x + 1] !== c) soft++;
          if (!pal.has(c)) off++;
          seen.add(c);
        }
        assert(soft === 0, `${v.id}: ${soft} picture pixels not a clean 2 × 2`);
        assert(off === 0, `${v.id}: ${off} picture pixels off the ${v.report.palette} palette`);
        n++; pixels += w * h / 4; colours.push(seen.size);
      }
      console.log(`      ${n} shots, ${(pixels / 1e6).toFixed(1)} M picture pixels, all on their palettes; ${Math.min(...colours)} to ${Math.max(...colours)} colours a shot`);
    },
  },
  {
    name: 'look page: a whole cast drawn in one go, nobody waiting, in a handful of draw calls, with no errors',
    heavy: true,
    async fn() {
      const { withGame } = await import('./browser.mjs');
      const port = Number(process.env.SAMPLES_PORT) || undefined;
      for (const query of ['scene=mess&ppm=24&prop=soldier&t=0.9', 'scene=chasm&mood=storm&ppm=16&prop=chibi&t=0.9']) {
        await withGame(async (page) => {
          const r = await page.evaluate(() => window.__report);
          const C = CASTS[paramsOf(query).scene];
          assert(r.drawn === C.people.length && r.deferred === 0, JSON.stringify({ drawn: r.drawn, of: C.people.length, deferred: r.deferred }));
          // (the area's one batch, the figures' cards and blobs; the post's composite, blit and weather)
          assert(r.calls.total <= 8, JSON.stringify(r.calls));
          console.log(`      ${query}: ${r.drawn} people in ${r.looks} looks, ${r.calls.total} draw calls (scene ${r.calls.scene}, post ${r.calls.post}), ${r.figures.uploads} bands up (${r.figures.uploadKB} KB, painted in ${r.figures.paintMs} ms), cpu ${r.cpuMs} ms a frame${r.fog ? ', the fog of awareness on' : ''}`);
        }, { port, at: '/samples/look/', query, viewport: { width: 960, height: 540 } });
      }
    },
  },
  {
    name: 'gallery: every view listed in its matrix; a star and a score survive a reload, and Copy my picks carries them with the tallies',
    heavy: true,
    async fn() {
      const { withGame } = await import('./browser.mjs');
      const port = Number(process.env.SAMPLES_PORT) || undefined;
      const views = index().samples.flatMap(s => s.groups.flatMap(g => g.views)).length;
      await withGame(async (page, errors, game) => {
        assert(await page.locator('figure').count() === views, `${await page.locator('figure').count()} figures for ${views} views`);
        await page.locator('#L1 figure').nth(2).locator('.star').click();
        await page.locator('#L1 figure').nth(2).locator('.score').fill('85');
        await page.locator('#L3 figure').nth(1).locator('.score').fill('40');
        await page.locator('#L2 textarea').fill('the wet head reads');
        await game.open('');
        const text = await page.evaluate(() => window.__picksText());
        for (const want of ['★ L1-c', '24 px/m · A: chibi · 85/100', '- L3-b', '16 px/m · B: soldier · 40/100', 'by row (16 px/m vs 24 px/m): 16 px/m: 0 ★, mean 40 over 1; 24 px/m: 1 ★, mean 85 over 1', '- L2: the wet head reads'])
          assert(text.includes(want), `no "${want}" in:\n${text}`);
        await page.locator('#L4 figure').nth(4).locator('.pic').click();
        await page.keyboard.press('ArrowRight');
        const boxed = await page.locator('#boxId').textContent();
        assert(boxed === 'L4-f', `the lightbox's → went to ${boxed}`);
        console.log(`      ${views} views; the text:\n${text.split('\n').map(l => `        ${l}`).join('\n')}`);
      }, { port, at: '/samples/', ready: 'window.__ready === true && document.querySelectorAll("figure").length > 0' });
    },
  },
];
