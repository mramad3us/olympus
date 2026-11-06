// OLYMPUS: build the samples gallery. Shoot every view of every samples/<name>/sample.json, crisply.
//
//   node tools/gallery.mjs [filter] [--port 8212] [--contact <out.jpg>]
//
// tradecraft's gallery (its tools/gallery.mjs), carried over for OLYMPUS's look samples. Every folder
// samples/<name>/ with a sample.json gets each of its views shot in headless Chrome on the GPU by
// tools/shot.mjs (which fails on page errors, console errors and failed requests, so a broken page never
// passes as a picture), saved as samples/<name>/shots/<view id>.png; samples/index.json then lists them
// all for samples/index.html, the gallery the user scores from (./play.sh --dev, then /samples/). A view
// that fails is reported, left out of the index, and makes the run exit 1. The filter keeps the views
// whose folder, group or id holds it (`node tools/gallery.mjs L4`); the others keep their last shots.
//
// PIXEL ART IS SHOT CRISPLY (tradecraft's pixel mode): a view's picture is shot at three times its own
// size (its "native" size, the stage's picture in pixels), brought back to native by point sampling, and
// saved at twice native, every picture pixel a clean 2 × 2 (smooth resizing and JPEG spoil pixel art).
// The run checks it: the native picture scaled back up three times must equal the shot, pixel for pixel,
// or the page didn't draw on whole pixels (an overlay, a fractional scale) and the view fails. The native
// size is sample.json's "pixel" ("640x360"), or "stage": the stage's own picture for the view's ?ppm=
// and ?zoom= (src/render/scale.js DENSITIES, one place for those numbers), checked against the frame the
// page reports (window.__report.frame).
//
// sample.json, one of two forms (either may carry "frozen": why, and a frozen sample's views are never
// shot again: they keep their last shots and index entries, as unwanted views of a filter do. The look
// round is frozen once scored, 2026-11-06: its soldier columns can no longer be drawn):
//   - tradecraft's: { title, about, pixel?, views: [{ name, query, id? }] };
//   - groups, OLYMPUS's look rounds: { title, about, pixel?, matrix?, groups: [{ id, title, about, query?,
//     sets?: [{ label, query }], views? }] }. With a matrix ({ rows: { param, values, labels }, cols: {
//     param, values, labels } }) each set of a group becomes rows × cols views lettered in reading order
//     (L1-a, L1-b, ... the next set going on at e), each the group's query plus the set's plus its row's
//     and column's parameter: so the pictures of a group differ only in what the matrix says, and each
//     view's name says what that is.
// index.json: { built, samples: [{ id (the folder), title, about, pixel, matrix, groups: [{ id, title,
// about, sets, views: [{ id, name, set, row, col, query, shot, native, report }] }] }] }, report being
// the numbers the page published (draw calls, people, the atlas's uploads), kept to be read.
//
// The repository is served by tools/serve.py on the gallery's own port (8212 by default: its own browser
// origin, so its own saves; never the play copy's 8200 or the dev tree's 8201), refused if anything
// already answers there. --contact writes one labelled sheet of every view (ImageMagick's montage).
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, mkdtempSync, statSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DENSITIES } from '../src/render/scale.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAMPLES = path.join(ROOT, 'samples');
export const GALLERY_PORT = 8212;
/** How many times the picture's own size a view is shot at, and kept at (tradecraft's 3 and 2). */
export const SHOOT_X = 3, KEEP_X = 2;
const VIEW_TIMEOUT_MS = 90000;
// (the user's play copy and dev tree, the browser tests', and the sibling projects': never ours here)
const NOT_OURS = new Set([8200, 8201, 8223, 8090, 8100, 8101, 8112, 8123]);
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const joinQuery = (...parts) => {
  const q = new URLSearchParams();
  for (const p of parts) for (const [k, v] of new URLSearchParams(p ?? '')) q.set(k, v);
  return q.toString();
};
const even = (v) => 2 * Math.round(v / 2);

/** The picture's own size for a view: "WxH", or "stage" (the stage's picture for its ppm and zoom). */
export function nativeOf(pixel, query) {
  if (!pixel) return null;
  if (pixel !== 'stage') { const [w, h] = pixel.split('x').map(Number); return [w, h]; }
  const q = new URLSearchParams(query), d = DENSITIES[Number(q.get('ppm'))] ?? DENSITIES[24], zoom = Number(q.get('zoom') ?? 1);
  // (as src/render/stage.js sizes a zoomed picture: even sides)
  return [even(d.res[0] / zoom), even(d.res[1] / zoom)];
}

/**
 * A sample.json's views, grouped: [{ id, title, about, sets, views: [{ id, name, set, row, col, query, pixel }] }].
 * (Exported for tests/samples-look.test.mjs, which checks the look round's expansion.)
 */
export function expand(folder, s) {
  if (!s.groups) {
    const views = (s.views ?? []).map((v, i) => ({ id: v.id ?? `${folder}-${LETTERS[i]}`, name: v.name, query: v.query ?? '', pixel: v.pixel ?? s.pixel ?? null }));
    return [{ id: folder, title: s.title, about: s.about, sets: null, views }];
  }
  return s.groups.map((g) => {
    const M = g.matrix ?? s.matrix, pixel = g.pixel ?? s.pixel ?? null, views = [];
    if (M) {
      const sets = g.sets ?? [{ label: null, query: '' }];
      let n = 0;
      sets.forEach((set, si) => {
        M.rows.values.forEach((rv, r) => M.cols.values.forEach((cv, c) => {
          views.push({
            id: `${g.id}-${LETTERS[n++]}`, set: si, row: r, col: c, pixel,
            name: [set.label, M.rows.labels[r], M.cols.labels[c]].filter(Boolean).join(' · '),
            query: joinQuery(g.query, set.query, `${M.rows.param}=${rv}`, `${M.cols.param}=${cv}`),
          });
        }));
      });
      return { id: g.id, title: g.title, about: g.about, sets: sets.map(x => x.label), matrix: { rows: M.rows.labels, cols: M.cols.labels }, views };
    }
    return { id: g.id, title: g.title, about: g.about, sets: null, views: (g.views ?? []).map((v, i) => ({ id: v.id ?? `${g.id}-${LETTERS[i]}`, name: v.name, query: joinQuery(g.query, v.query), pixel: v.pixel ?? pixel })) };
  });
}

/** Every samples/<folder>/sample.json, read: [{ folder, sample }] in folder order. */
export function readSamples(dir = SAMPLES) {
  return readdirSync(dir).filter(d => existsSync(path.join(dir, d, 'sample.json'))).sort()
    .map(folder => ({ folder, sample: JSON.parse(readFileSync(path.join(dir, folder, 'sample.json'), 'utf8')) }));
}

/** shot.mjs's output: its first line, the report it printed (JSON, ended by a line "}"), the lines after. */
function parseShot(out) {
  const lines = out.split('\n'), a = lines.findIndex(l => l === '{'), b = a >= 0 ? lines.indexOf('}', a) : -1;
  let report = null;
  if (a >= 0 && b > a) { try { report = JSON.parse(lines.slice(a, b + 1).join('\n')); } catch { report = null; } }
  return { report, rest: lines.slice(b >= 0 ? b + 1 : 1).filter(Boolean) };
}
/** The numbers worth keeping from a page's report. */
const keep = (r) => r && Object.fromEntries(Object.entries({
  frame: r.frame, ppm: r.ppm, prop: r.prop, mood: r.mood, zoom: r.zoom, palette: r.palette, calls: r.calls?.total, cpuMs: r.cpuMs,
  people: r.people, looks: r.looks, drawn: r.drawn, boxes: r.area?.boxes,
  figureUploads: r.figures?.uploads, figureKB: r.figures?.uploadKB, figurePaintMs: r.figures?.paintMs,
}).filter(([, v]) => v !== undefined && v !== null));

async function answers(port) {
  try { await fetch(`http://127.0.0.1:${port}/VERSION`, { signal: AbortSignal.timeout(800) }); return true; } catch { return false; }
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : null; };
  const port = Number(opt('--port') ?? GALLERY_PORT), contact = opt('--contact');
  const filter = args[0] ?? '';
  if (NOT_OURS.has(port)) throw new Error(`port ${port} is not the gallery's (8200 and 8201 are the user's, 8223 the browser tests', the rest other projects')`);
  if (await answers(port)) throw new Error(`port ${port} already answers: some other server is there (lsof -nP -iTCP:${port} -sTCP:LISTEN)`);

  const server = spawn('python3', [path.join(ROOT, 'tools/serve.py'), String(port), ROOT], { stdio: 'ignore' });
  const scratch = mkdtempSync(path.join(tmpdir(), 'olympus-gallery-'));
  const indexPath = path.join(SAMPLES, 'index.json');
  const old = existsSync(indexPath) ? JSON.parse(readFileSync(indexPath, 'utf8')) : { samples: [] };
  const oldViews = new Map(old.samples.flatMap(s => (s.groups ?? []).flatMap(g => g.views.map(v => [`${s.id}/${v.id}`, v]))));
  const failed = [], out = [];
  let shot = 0;
  try {
    for (let w = 0; !(await answers(port)); w += 100) {
      if (w > 5000) throw new Error(`tools/serve.py on ${port} did not come up`);
      await new Promise(r => setTimeout(r, 100));
    }
    for (const { folder, sample } of readSamples()) {
      const groups = expand(folder, sample), shots = path.join(SAMPLES, folder, 'shots');
      mkdirSync(shots, { recursive: true });
      let all = true;
      for (const g of groups) for (const v of g.views) {
        const keyOld = `${folder}/${v.id}`;
        const wanted = !sample.frozen && (!filter || [folder, g.id, v.id].some(x => x.includes(filter)));
        if (!wanted) { all = false; if (oldViews.has(keyOld)) Object.assign(v, oldViews.get(keyOld), { name: v.name, query: v.query }); else v.missing = true; continue; }
        const native = nativeOf(v.pixel, v.query);
        const raw = path.join(scratch, `${v.id}.raw.png`), file = `${slug(v.id)}.${native ? 'png' : 'jpg'}`, dest = path.join(shots, file);
        const url = `http://127.0.0.1:${port}/samples/${folder}/${v.query ? '?' + v.query : ''}`;
        const t0 = performance.now();
        try {
          const size = native ? `${native[0] * SHOOT_X}x${native[1] * SHOOT_X}` : '1600x1000';
          let text = '';
          try { text = execFileSync('node', [path.join(ROOT, 'tools/shot.mjs'), url, raw, '--size', size, '--timeout', String(VIEW_TIMEOUT_MS)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
          catch (e) { const { rest } = parseShot(String(e.stdout ?? '')); throw new Error(rest.slice(-3).join(' / ') || String(e.stderr ?? e.message).trim().split('\n').pop()); }
          const { report } = parseShot(text);
          if (native) {
            if (report?.frame && (report.frame[0] !== native[0] || report.frame[1] !== native[1])) throw new Error(`the page drew ${report.frame.join('×')}, sample.json says ${native.join('×')} (a ppm or zoom missing from the query?)`);
            const small = path.join(scratch, `${v.id}.native.png`), back = path.join(scratch, `${v.id}.back.png`);
            execFileSync('magick', [raw, '-filter', 'point', '-resize', `${native[0]}x${native[1]}!`, small]);
            execFileSync('magick', [small, '-filter', 'point', '-resize', `${native[0] * SHOOT_X}x${native[1] * SHOOT_X}!`, back]);
            // (compare prints the count of differing pixels on stderr, and exits 1 when there are any)
            let diff = '0';
            try { execFileSync('magick', ['compare', '-metric', 'AE', raw, back, 'null:'], { stdio: ['ignore', 'pipe', 'pipe'] }); }
            catch (e) { diff = String(e.stderr ?? '').trim().split(/\s/)[0]; }
            if (Number(diff) !== 0) throw new Error(`not crisp: ${diff} pixels of the shot are not whole ${SHOOT_X} × ${SHOOT_X} picture pixels (an overlay, or a fractional scale)`);
            execFileSync('magick', [small, '-filter', 'point', '-resize', `${native[0] * KEEP_X}x${native[1] * KEEP_X}!`, dest]);
          } else execFileSync('magick', [raw, '-resize', '800x', '-quality', '82', dest]);
          Object.assign(v, { shot: `${folder}/shots/${file}`, native, report: keep(report) });
          shot++;
          const r = v.report ?? {};
          console.log(`  ✓ ${v.id} · ${v.name} (${((performance.now() - t0) / 1000).toFixed(1)} s)${native ? ` ${native.join('×')} ×${KEEP_X}` : ''}` +
            `${r.calls !== undefined ? ` · ${r.calls} draw calls` : ''}${r.people !== undefined ? ` · ${r.drawn}/${r.people} people, ${r.looks} looks` : ''}${r.figureUploads !== undefined ? ` · ${r.figureUploads} bands, ${r.figureKB} KB, painted ${r.figurePaintMs} ms` : ''}`);
        } catch (e) {
          all = false; v.missing = true;
          failed.push(`${v.id} · ${v.name}: ${String(e.message).split('\n')[0]}`);
          console.log(`  ✗ ${v.id} · ${v.name}`);
        }
      }
      // (shots of views that no longer exist go, once every view of the folder was shot: a renamed view would leave its old picture)
      if (all) {
        const live = new Set(groups.flatMap(g => g.views.map(v => path.basename(v.shot ?? ''))));
        for (const f of readdirSync(shots)) if (/\.(jpg|png)$/.test(f) && !live.has(f) && statSync(path.join(shots, f)).isFile()) rmSync(path.join(shots, f));
      }
      for (const g of groups) g.views = g.views.filter(v => !v.missing).map(({ pixel, missing, ...v }) => v);
      out.push({ id: folder, title: sample.title, about: sample.about, pixel: !!sample.pixel, matrix: sample.matrix ? { rows: sample.matrix.rows.labels, cols: sample.matrix.cols.labels } : null, groups });
    }
  } finally {
    server.kill();
    rmSync(scratch, { recursive: true, force: true });
  }
  writeFileSync(indexPath, JSON.stringify({ built: new Date().toISOString().slice(0, 16), samples: out }, null, 1) + '\n');
  const views = out.flatMap(s => s.groups.flatMap(g => g.views));
  if (contact && views.length) {
    const font = ['/System/Library/Fonts/Helvetica.ttc', '/System/Library/Fonts/Supplemental/Arial.ttf'].find(f => existsSync(f));
    const tiles = views.flatMap(v => ['-label', `${v.id} · ${v.name}`, path.join(SAMPLES, v.shot)]);
    try {
      execFileSync('magick', ['montage', ...(font ? ['-font', font] : []), ...tiles, '-tile', '4x', '-geometry', '480x270+6+6',
        '-background', '#15171c', '-fill', '#cfd3da', '-pointsize', '13', contact], { stdio: 'pipe' });
      console.log(`contact sheet: ${contact}`);
    } catch (e) { console.log(`contact sheet failed: ${String(e.stderr ?? e.message).trim()}`); }
  }
  console.log(`\n${shot} shot, ${views.length} views in samples/index.json`);
  if (failed.length) { console.log('failed:\n  ' + failed.join('\n  ')); process.exitCode = 1; }
}

// (run as a script; imported, as the tests do, it only lends expand(), nativeOf() and readSamples())
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(`gallery: ${e.message}`); process.exitCode = 1; });
}
