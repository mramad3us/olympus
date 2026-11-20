// OLYMPUS tests: the portrait cards' third pass (v0.0.28, the art director's verdicts of 2026-11-20, .run/v028/picks/judge-2.md).
//
// The user, 2026-11-20: "I need you to be serious about this ... please, make an effort for quality." The second pass still read as
// "a photographer with a camera" (A3), "hands to the mouth" (P3), "praying hands" (PS-b), "a thumb-shaped head" (F4), "a standing man
// with a plain rust knee" (K1), "the binocular hostage" and "a segmented bar" (H1), "a crow or broken gun" (board 1A), "the neutral
// arms show hanging" (V3), "one plain rust mass" (D3 in the camouflage) and "he looks unarmed" (F1 from behind). Each test here holds
// the redrawing's measure of one verdict, and each is red on the second pass's drawing (its numbers printed: the chains' fists the
// same size, the profile's forearm 1.5 × the upper arm, the knees one colour of the pattern, the board's rifle at 62 degrees, no veil
// over the arms, the hostage's P-12 tipped 19 degrees). The verdicts on K1 and F1 (P3-6, P3-9) are not acted on: both cards were
// starred on 2026-11-20 and stay as starred (the review of the picks; tests/picks-review.test.mjs holds them to v0.0.27's pixels).
import { assert } from './helpers.mjs';
import { NEAR } from '../src/art/doll/near-holds.js';
import { TPL_S, MASK_C } from '../src/art/doll/near.js';
import { paintPortrait, boardGear, boardLook } from '../src/art/doll/portrait.js';
import { doll } from '../src/art/doll/doll.js';
import { dressOf } from '../src/art/doll/dress.js';
import { paintHitcard, figGeom, HIT_BANDS, HIT_C, unreadRec } from '../src/art/doll/hitcard.js';
import { gunCells, HOSTAGE_TH } from '../src/art/doll/held.js';
import { cloth, lum, mix } from '../src/art/doll/grid.js';
import { VALLES } from '../src/art/figures/outfits.js';
import { PAPERS } from '../src/sim/arms/paper.js';
import { RP, RP_PISTOL, RP_PERSON, ME, ME_PERSON, recOf } from '../samples/portrait-lib/posed.js';

const SCALES = HIT_BANDS.map(b => [b.id, figGeom(b.pxPerM).scale]);
const NEAR_S = SCALES[0][1];
const HAND = new Set([...'hijkl']), SLEEVE = new Set([...'ABCDE']), SLIDE = new Set([...'6789']);
/** The 4-connected clusters of a template's letters in a set: [{ n, cx, cy, x0, x1, y0, y1 }] (template px, absolute rows), largest first. */
function clusters(T, set, y0 = Math.round(T.at[1] * TPL_S)) {
  const at = (x, y) => T.rows[y - y0]?.[x] ?? '.', seen = new Set(), out = [];
  for (let y = y0; y < y0 + T.rows.length; y++) for (let x = 0; x < T.rows[y - y0].length; x++) {
    if (!set.has(at(x, y)) || seen.has(`${x},${y}`)) continue;
    const st = [[x, y]], c = { n: 0, sx: 0, sy: 0, x0: x, x1: x, y0: y, y1: y };
    seen.add(`${x},${y}`);
    while (st.length) {
      const [a, b] = st.pop();
      c.n++; c.sx += a; c.sy += b; c.x0 = Math.min(c.x0, a); c.x1 = Math.max(c.x1, a); c.y0 = Math.min(c.y0, b); c.y1 = Math.max(c.y1, b);
      for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = `${a + i},${b + j}`; if (!seen.has(k) && set.has(at(a + i, b + j))) { seen.add(k); st.push([a + i, b + j]); } }
    }
    out.push({ ...c, cx: c.sx / c.n, cy: c.sy / c.n });
  }
  return out.sort((a, b) => b.n - a.n);
}
const letters = (T, set) => { const out = []; const y0 = Math.round(T.at[1] * TPL_S); T.rows.forEach((r, j) => [...r].forEach((c, i) => { if (set.has(c)) out.push([i, y0 + j]); })); return out; };
const portrait = (rec, S, person = RP_PERSON) => paintPortrait(rec, person, { scale: S }).pm;
const isFig = (pm, x, y) => { const v = pm.data[y * pm.w + x]; return v !== pm.data[0] && v !== pm.data[(pm.h - 1) * pm.w]; };

export default [
  {
    name: 'P3-1 A3 is drawn in depth (judge-2: "two fists side by side at the chin read as someone holding a camera"): the support hand under the muzzle, a third larger than the firing fist, which sits lower and to his right; and the doll draws the template',
    fn() {
      const T = NEAR.A3, [a, b] = clusters(T, HAND), bore = clusters(T, new Set(['x']))[0];
      const sup = Math.abs(a.cx - bore.cx) < Math.abs(b.cx - bore.cx) ? a : b, fire = sup === a ? b : a;
      const ratio = sup.n / fire.n, under = sup.cy > bore.cy && Math.abs(sup.cx - bore.cx) <= 4, lower = fire.cy > sup.cy + 2, right = fire.cx < sup.cx - 4;
      console.log(`      the support hand ${sup.n} px under the muzzle (${(sup.cx - bore.cx).toFixed(1)} px across), the firing fist ${fire.n} px (${ratio.toFixed(2)} ×), ${(fire.cy - sup.cy).toFixed(1)} px lower, ${(sup.cx - fire.cx).toFixed(1)} px to his right`);
      // (the doll at the near band: your glove at the support hand's middle, the template's pixel through the doll)
      const pm = portrait(recOf(ME, { hold: { how: 'rifle-aim' }, aimAt: 'you' }), NEAR_S, ME_PERSON), drop = Math.round(2 * NEAR_S), w = pm.data[(sup.y1 - 2 + drop) * pm.w + Math.round(sup.cx)];
      const L = 0.3 * (w & 0xff) + 0.59 * ((w >>> 8) & 0xff) + 0.11 * ((w >>> 16) & 0xff);
      console.log(`      the doll's pixel in its palm: lum ${L.toFixed(0)} (the glove's grey)`);
      assert(ratio >= 1.3 && under && lower && right && L >= 112, JSON.stringify({ ratio, under, lower, right, L }));
    },
  },
  {
    name: 'P3-2 P3 is the isosceles from the front (judge-2: "still hands to the mouth ... the arms make a ^ from below the shoulders"): one double fist a third over its size (90 px and more at the near band; the chain\'s 69), the slide\'s top at the eye\'s row, the arms level from the shoulders (none below 4.5 rows under the shoulder\'s joint)',
    fn() {
      const T = NEAR.P3, hands = clusters(T, HAND), fist = hands.reduce((s, c) => s + c.n, 0), slideTop = Math.min(...letters(T, SLIDE).map(p => p[1])) / TPL_S;
      const armLow = Math.max(...letters(T, SLEEVE).map(p => p[1])) / TPL_S, eye = T.stations.eye[1];
      console.log(`      the double fist ${fist} px in ${hands.length} hands, the slide's top at row ${slideTop.toFixed(1)} (the eye's ${eye}), the arms' lowest row ${armLow.toFixed(1)} (the shoulder's joint 31.6)`);
      assert(fist >= 90 && Math.abs(slideTop - eye) <= 1.5 && armLow <= 31.6 + 4.5, JSON.stringify({ fist, slideTop, armLow }));
    },
  },
  {
    name: 'P3-3 the P-12\'s high ready is not praying hands (judge-2: "the forearms parallel and nearly vertical below the fists, the elbows tucked under them, not an A"): the elbows (the sleeve\'s lowest rows) under the double fist\'s span, the muzzle 4 rows or more over the fists',
    fn() {
      const T = NEAR.PSB, hands = clusters(T, HAND), x0 = Math.min(...hands.map(c => c.x0)), x1 = Math.max(...hands.map(c => c.x1)), yb = Math.max(...hands.map(c => c.y1));
      const sl = letters(T, SLEEVE), yLow = Math.max(...sl.map(p => p[1])), elbows = sl.filter(([, y]) => y > yLow - 3), out = elbows.filter(([x]) => x < x0 - 4 || x > x1 + 4);
      const bore = clusters(T, new Set(['x']))[0], up = (hands[0].cy - bore.cy) / TPL_S;
      console.log(`      the elbows (the sleeve's last 3 rows, ${elbows.length} px) ${out.length} px outside the fists' span ${x0} to ${x1} and 4 px; the muzzle ${up.toFixed(1)} rows over the fists; the fists' foot row ${yb}`);
      assert(elbows.length >= 8 && out.length === 0 && up >= 4, JSON.stringify({ elbows: elbows.length, out: out.length, up }));
    },
  },
  {
    name: 'P3-4 the profile\'s near arm is a man\'s (judge-2 on F4: "the forearm about the upper arm\'s length ... the upper arm angled forward about 30 degrees" at the low ready): aimed and at the low ready, either way he faces, the forearm 0.75 to 1.3 of the upper arm, the low ready\'s upper arm 20 degrees or more forward of the vertical',
    fn() {
      const rows = [], bad = [];
      for (const facing of ['right', 'left']) for (const [how, aimAt] of [['rifle-aim', 'away'], ['rifle-low', null]]) {
        const pm = portrait(recOf(RP, { facing, hold: { how }, ...(aimAt ? { aimAt } : {}) }), NEAR_S), A = pm.side?.arm, dir = facing === 'left' ? -1 : 1;
        if (!A) { bad.push({ facing, how, arm: null }); continue; }
        const up = Math.hypot(A.elbow[0] - A.shoulder[0], A.elbow[1] - A.shoulder[1]), fore = Math.hypot(A.hand[0] - A.elbow[0], A.hand[1] - A.elbow[1]), k = fore / up;
        const fwd = Math.atan2(dir * (A.elbow[0] - A.shoulder[0]), A.elbow[1] - A.shoulder[1]) * 180 / Math.PI;
        rows.push(`${facing} ${how}: the forearm ${k.toFixed(2)} of the upper arm, the upper arm ${fwd.toFixed(0)} degrees forward of the vertical`);
        if (k < 0.75 || k > 1.3 || (how === 'rifle-low' && fwd < 20)) bad.push({ facing, how, k, fwd });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'P3-5 the masked head side on has a profile, a strap and a neck (judge-2: "a thumb shape ... the eye a blindfold bar, the neck as deep as the head"): the strap one row, lighter than the hair; the neck at most 0.65 of the head\'s depth at the eye',
    fn() {
      const T = NEAR.HEAD_FOF, strapRows = new Set(letters(T, new Set(['S'])).map(p => p[1])).size, hair = cloth(0x1c1a1c).base;
      const widthAt = (j) => { const r = T.rows[j]; const xs = [...r].map((c, i) => (c !== '.' && c !== 'o' ? i : -1)).filter(i => i >= 0); return xs.length ? xs.at(-1) - xs[0] + 1 : 0; };
      const eyeRow = Math.round((T.stations.eye[1] - T.at[1]) * TPL_S), neckRow = T.rows.length - 4, k = widthAt(neckRow) / widthAt(eyeRow);
      console.log(`      the strap on ${strapRows} row (lum ${lum(MASK_C[5]).toFixed(0)}, the hair's ${lum(hair).toFixed(0)}); the neck ${widthAt(neckRow)} px of the head's ${widthAt(eyeRow)} at the eye (${k.toFixed(2)})`);
      assert(strapRows === 1 && lum(MASK_C[5]) > lum(hair) + 15 && k <= 0.65, JSON.stringify({ strapRows, k }));
    },
  },
  {
    name: 'P3-7 D3 in the camouflage wears its pattern (judge-2: "knees and arms one plain rust mass"): at the near band each knee shows two colours of the pattern or more',
    fn() {
      const pm = portrait(recOf(RP, { pose: 'sit', hold: { how: 'rifle-low' } }), NEAR_S), ramps = Object.values(VALLES).map(c => { const T = cloth(c); return new Set([T.light, T.soft, T.base, T.shade, T.deep]); });
      const hexOf = (v) => ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff), out = [];
      for (const [kx, ky] of pm.stations.knees) {
        const got = new Set();
        for (let y = Math.round(ky - 4 * NEAR_S); y <= Math.round(ky + 4 * NEAR_S); y++) for (let x = Math.round(kx - 4 * NEAR_S); x <= Math.round(kx + 4 * NEAR_S); x++) { const c = hexOf(pm.data[y * pm.w + x]); ramps.forEach((R, i) => { if (R.has(c)) got.add(i); }); }
        out.push(got.size);
      }
      console.log(`      the knees in ${out.join(' and ')} colours of the pattern`);
      assert(out.length === 2 && out.every(n => n >= 2), JSON.stringify(out));
    },
  },
  {
    name: 'P3-8 the hostage\'s P-12 is level at her temple (judge-2: "the gun tips up between the faces: it points past her head toward the ceiling"): the slide\'s top within a slope of 0.12 of the level at every band (the tipped gun\'s 0.35)',
    fn() {
      const rows = [], bad = [];
      for (const [band, S] of SCALES) {
        // (the slide's top: the topmost gun pixel of each column over the front half, fitted to a line)
        const G = gunCells('p12', S, HOSTAGE_TH), xs = G.cells.map(c => c[0]), x0 = Math.min(...xs), x1 = Math.max(...xs), pts = [];
        for (let x = Math.round((x0 + x1) / 2); x <= x1; x++) { const col = G.cells.filter(c => c[0] === x); if (col.length) pts.push([x, Math.min(...col.map(c => c[1]))]); }
        const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length, my = pts.reduce((a, p) => a + p[1], 0) / pts.length, k = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
        rows.push(`${band}: the slide's top at a slope of ${k.toFixed(2)}`);
        if (Math.abs(k) > 0.12) bad.push({ band, k });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'P3-10 board 1A\'s rifle is a print silhouette (judge-2: "the resampled stamp reads as a crow or broken gun"): its pixels along one line at 25 to 45 degrees at every band (the stamp\'s 62)',
    fn() {
      const rows = [], bad = [];
      for (const b of HIT_BANDS) {
        const S = figGeom(b.pxPerM).scale, D = doll({ ...dressOf(boardGear('threat', 'rifle', 'ready'), { look: boardLook('threat'), sex: 'm' }), scale: S });
        let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
        for (let y = 0; y < D.h; y++) for (let x = 0; x < D.w; x++) if (D.held[y * D.w + x]) { n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; }
        const cxx = sxx / n - (sx / n) ** 2, cyy = syy / n - (sy / n) ** 2, cxy = sxy / n - (sx / n) * (sy / n), th = Math.abs(0.5 * Math.atan2(2 * cxy, cxx - cyy)) * 180 / Math.PI;
        rows.push(`${b.id}: ${n} px along ${th.toFixed(0)} degrees`);
        if (!(th >= 25 && th <= 45)) bad.push({ band: b.id, th });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'P3-11 V3 hides the arms and keeps its plate to the figure (judge-2: "the neutral arms show hanging, which hints hands down ... the plate is 1.7 times the figure\'s width"): beside the torso the veil starts under the deltoids, and the plate is no wider than the figure plus its frame',
    fn() {
      const rows = [], bad = [];
      for (const b of HIT_BANDS) {
        const rangeM = b.maxM === Infinity ? 30 : b.maxM - 1, rec = recOf(RP, { hold: { how: 'rifle-aim' }, aimAt: 'you' });
        const v = paintHitcard({ subject: { kind: 'man', rec, person: RP_PERSON }, rangeM, live: { holds: 'unseen' } }), o = paintHitcard({ subject: { kind: 'man', rec: unreadRec(rec), person: RP_PERSON }, rangeM });
        const line = v.hidden.line, G = figGeom(b.pxPerM), half = 13.6 * G.scale, cx = v.w / 2;
        let veiled = 0, plate = [Infinity, -1], fig = [Infinity, -1];
        for (let y = line - Math.round(5 * G.scale); y < line; y++) for (let x = 0; x < v.w; x++) if (Math.abs(x + 0.5 - cx) > half && v.data[y * v.w + x] !== o.data[y * o.w + x]) veiled++;
        const plateW = HIT_C.plate, hexOf = (w) => ((w & 0xff) << 16) | (w & 0xff00) | ((w >>> 16) & 0xff);
        for (let y = line; y < v.h - v.words.h; y++) for (let x = 0; x < v.w; x++) if (hexOf(v.data[y * v.w + x]) === plateW) { plate[0] = Math.min(plate[0], x); plate[1] = Math.max(plate[1], x); }
        const g0 = o.data[2 * o.w + 2];
        for (let y = 0; y < o.h - o.words.h; y++) for (let x = 3; x < o.w - 3; x++) if (Math.abs(lum(hexOf(o.data[y * o.w + x])) - lum(hexOf(o.data[y * o.w + 3]))) > 6 && o.data[y * o.w + x] !== g0) { fig[0] = Math.min(fig[0], x); fig[1] = Math.max(fig[1], x); }
        const pw = plate[1] - plate[0] + 1, fw = fig[1] - fig[0] + 1;
        rows.push(`${b.id}: ${veiled} px of the arms veiled over the deltoid's rows; the plate ${pw} px, the figure ${fw}`);
        if (veiled < 10 || pw > fw + 6) bad.push({ band: b.id, veiled, pw, fw });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
];
void mix;
