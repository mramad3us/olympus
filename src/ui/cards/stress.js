// OLYMPUS cards: "Bang"'s end card, the strings' hot wash (COMBAT §25.18.3; VIEWS §7.7; the build sheet 0.0.10 §2.3, §8 items 18 to 21).
//
// test-stress is played as a sheet (the picker of cards/pairs.js, opening on the Boot recruit with the hardening in words), and
// its end card leads with the scene's own view (src/sim/scenarios/stress.js stressNow): the summary ("Boot recruit · 5 strings ·
// froze 0 to 2.40 s · take-in 0.65 to 1.25 s · 3 fumbles, 1 drop · Breathe 2 · 7 A, 2 C, 2 miss"), then a line a string (stringLine:
// its noise, felt's peak and band (the end card and J are where felt is a number), the freeze, the take-in, the fumbles, Breathe,
// the first round from the sighting against calm by the book, the zones, string 5's RELOAD and its second turner), the
// inoculation (inocLine: what a career would have counted, the test sheet's counter fixed), and the hot wash: one string's truth
// card at the HUD's own size beside the lines, chosen by a button a string (the hit card's truth: src/art/doll/hitcard.js on
// hitMarks' marks; the design review of 0.0.10 took five unreadable thumbnails off). From the second sheet on this seed the
// session's grid (sessionGrid) sets the sheets side by side, a row a string, in place of a summary line a sheet. "Again as …" each other
// sheet leads with its hardening word (main.js), so the recruit's card and the tier one's sit on the same seed.
//   stressLines(sn, { fmt }) → [summary, ...strings, inoculation]  (pure)
//   stringLine(x, { fmt })   → one string's line                   (pure)
//   inocLine(sn)             → the inoculation's line                (pure)
//   gridCell(x), sessionGrid(sheets) → the session's sheets side by side (pure); gridTable(grid) its table (DOM)
//   hotWash(cards, { paint, fit }) → one string's truth card at the HUD's size and a button a string (DOM)
import { INOC_FELT } from '../../sim/combat/supp.js';

const two = (ms) => (Number.isFinite(ms) ? (Math.max(0, ms) / 1000).toFixed(2) : '?');
const plural = (n, w, ws = `${w}s`) => `${n} ${n === 1 ? w : ws}`;
/** The words a list of numbers is said in: "2", "2 and 4", "2, 4 and 5". */
export const andList = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/**
 * A string's line: "2 · din 30 blanks · felt 25, under fire · froze 0.85 s · take-in 0.70 s · 1 fumble of 4 · Breathe 1 (8.0 shed) ·
 * first round 2.20 s (calm 1.80) · 1 A, 1 C · RELOAD 4.85 s, 2 tries, 1 failed · second 1.15 s" (no freeze and no fumble go unsaid).
 * x: stressNow's string. The first round is from the sighting (the paper's TURN TO PAUSE + PAUSE TO FIRST), against calm by the book.
 */
export function stringLine(x, { fmt = two } = {}) {
  if (!x) return '';
  const f = x.fumbles ?? {}, z = x.zones ?? {}, br = x.breathe ?? {};
  const zones = [['A', 'A'], ['C', 'C'], ['head', 'head'], ['miss', 'missed']].filter(([k]) => Number(z[k]) > 0).map(([k, w]) => `${z[k]} ${w}`).join(', ');
  const rl = x.reload, fired = ['A', 'C', 'head', 'miss'].some(k => Number(z[k]) > 0);
  return [
    `${Number(x.k) + 1} · ${x.noise ?? x.name ?? '?'}`,
    // (felt's band said from "under fire" up: "felt 15, calm · froze 0.90 s" read as a contradiction (the design review of 0.0.10))
    Number.isFinite(x.feltPeak) ? `felt ${Math.round(x.feltPeak)}${x.band && x.band !== 'calm' ? `, ${x.band}` : ''}` : null,
    x.frozeMs ? `froze ${fmt(x.frozeMs)} s` : null,
    Number.isFinite(x.takeInMs) ? `take-in ${fmt(x.takeInMs)} s` : null,
    f.fails ? `${plural(f.fails, 'fumble')} of ${f.tries}${f.drops ? `, ${plural(f.drops, 'drop')}` : ''}` : null,
    // (a Breathe cut before it shed anything (begun in an input's grace and cut in it) says so, not "0.0 shed": the integrator's)
    br.n ? `Breathe ${br.n} (${Number(br.shedPts ?? 0) >= 0.05 ? `${Number(br.shedPts).toFixed(1)} shed` : 'cut before it shed'})` : null,
    Number.isFinite(x.seenToFirstMs) ? `first round ${fmt(x.seenToFirstMs)} s${Number.isFinite(x.calmSeenToFirstMs) ? ` (calm ${fmt(x.calmSeenToFirstMs)})` : ''}` : 'no round fired',
    zones || null,
    rl ? `RELOAD ${Number.isFinite(rl.ms) ? `${fmt(rl.ms)} s` : 'not finished'}, ${plural(rl.tries ?? 0, 'try', 'tries')}${rl.fails ? `, ${rl.fails} failed` : ''}${rl.drops ? `, ${plural(rl.drops, 'drop')}` : ''}` : null,
    !rl && x.name === 'reload' ? 'no RELOAD' : null,
    x.second && Number.isFinite(x.second.takeInMs) ? `second ${fmt(x.second.takeInMs)} s` : null,
    // (how the string ended when it was not by putting him down: time with rounds fired, or not over (the runtime review of 0.0.10:
    // string 5 timed out with "1 A, 2 missed · RELOAD 4.15 s" and no word of it))
    x.done === 'time' ? (fired ? 'time: he stayed up' : 'time') : !x.done ? 'not finished' : null,
  ].filter(Boolean).join(' · ');
}

/**
 * The inoculation's line (SKILLS §6.8): "Inoculation: strings 2, 4 and 5 would each count +1 in a career, to 15 at the cadre's
 * course; a test sheet stays at 2." sn: stressNow's ({ strings: [{ k, inoc: { counted, would } }], inoc: { pts, cap, fixed } }); cap the
 * course's teacher's cap (supp.js INOC_CAP[COURSES.stress.teacher]).
 */
export function inocLine(sn, { cap: courseCap = null } = {}) {
  if (!sn) return '';
  const would = (sn.strings ?? []).filter(x => x.inoc?.would).map(x => Number(x.k) + 1), counted = (sn.strings ?? []).filter(x => x.inoc?.counted).map(x => Number(x.k) + 1);
  // (the cap the course's teacher reaches, the cadre's 15 (supp.js INOC_CAP), where the caller gives it; the sheet's own is where it stands now)
  const cap = courseCap ?? sn.inoc?.cap ?? 15, pts = sn.inoc?.pts ?? 0;
  // (a string noisy enough but not finished is named with its reason, never left out silently (the runtime review of 0.0.10))
  const left = (sn.strings ?? []).filter(x => Number(x.feltPeak) >= INOC_FELT && (!x.inoc || x.inoc.why === 'not finished')).map(x => Number(x.k) + 1);
  const why = left.length ? ` (${left.length === 1 ? 'string' : 'strings'} ${andList(left)} not finished, so not counted)` : '';
  if (counted.length) return `Inoculation: ${counted.length === 1 ? 'string' : 'strings'} ${andList(counted)} counted +1 each, to ${pts} of ${cap} at the cadre's course${why}.`;
  if (!would.length) return `Inoculation: no string was noisy enough to teach (felt 20 or more, finished)${why}; a test sheet stays at ${pts}.`;
  return `Inoculation: ${would.length === 1 ? 'string' : 'strings'} ${andList(would)} would ${would.length === 1 ? 'count' : 'each count'} +1 in a career, to ${cap} at the cadre's course${why}; a test sheet stays at ${pts}.`;
}

/** The end card's stress lines: [summary, a line a string, the inoculation] (sn: stressNow's, or null: none). */
export function stressLines(sn, { fmt = two, cap = null } = {}) {
  if (!sn) return [];
  return [sn.summary ?? null, ...(sn.strings ?? []).map(x => stringLine(x, { fmt })), inocLine(sn, { cap })].filter(Boolean);
}

/**
 * A string's cell of the session's grid (pure): "froze 2.40 · first 4.85 (2.50)", string 5's RELOAD after it ("RELOAD 4.20"), or
 * "no round fired"; x: stressNow's string.
 */
export function gridCell(x, { fmt = two } = {}) {
  if (!x) return '-';
  const rl = x.reload, cut = !x.done ? ' · not finished' : x.done === 'time' ? ' · time' : '';
  return [x.frozeMs ? `froze ${fmt(x.frozeMs)}` : 'no freeze',
    Number.isFinite(x.seenToFirstMs) ? `first ${fmt(x.seenToFirstMs)}${Number.isFinite(x.calmSeenToFirstMs) ? ` (${fmt(x.calmSeenToFirstMs)})` : ''}` : 'no round fired',
    x.name === 'reload' ? (rl ? `RELOAD ${Number.isFinite(rl.ms) ? fmt(rl.ms) : 'not finished'}` : 'no RELOAD') : null].filter(Boolean).join(' · ') + cut;
}
/**
 * The session's sheets side by side (pure; the design review of 0.0.10: the contrast is scored, and two summary lines hid the
 * strings): { head: ['', sheet labels…], rows: [[string's name, a cell a sheet…]] }, one row a string, one column a sheet played on
 * this seed. sheets: [{ label, word, strings }] (stressNow's, in the order played).
 */
export function sessionGrid(sheets = [], { fmt = two } = {}) {
  const ks = [...new Set(sheets.flatMap(sh => (sh.strings ?? []).map(x => x.k)))].sort((a, b) => a - b);
  const nameOf = (k) => sheets.map(sh => sh.strings?.find(x => x.k === k)).find(Boolean);
  return {
    head: ['', ...sheets.map(sh => `${sh.label}${sh.word ? ` (${sh.word})` : ''}`)],
    rows: ks.map(k => [`${k + 1} · ${nameOf(k)?.name === 'din' ? 'din' : nameOf(k)?.noise ?? nameOf(k)?.name ?? '?'}`, ...sheets.map(sh => gridCell(sh.strings?.find(x => x.k === k), { fmt }))]),
  };
}
/** The grid as a table (DOM), the sheet just played marked. */
export function gridTable(grid, { now = -1 } = {}) {
  const doc = globalThis.document, t = doc.createElement('table');
  t.className = 'stress-grid';
  const row = (cells, th = false) => { const tr = doc.createElement('tr'); cells.forEach((c, i) => { const td = doc.createElement(th || !i ? 'th' : 'td'); td.textContent = c; if (i - 1 === now) td.className = 'now'; tr.append(td); }); return tr; };
  t.append(row(grid.head, true), ...grid.rows.map(r => row(r)));
  return t;
}

/**
 * The hot wash (DOM; the design review of 0.0.10: five 72 px thumbnails showed nothing a player could use): one string's truth
 * card at the HUD's own size, at whole device pixels (fit: hud/hitcard.js hitFit's), and a button a string to choose it, the last
 * string fired at chosen first. cards: [{ k, model }] (model null where no round was fired at him); paint: paintHitcard. The
 * card is painted when its string is chosen, never five at once. Returns the element, its figure's data-text the card's words.
 */
export function hotWash(cards = [], { paint = null, fit = { size: 200, k: 1, smooth: false } } = {}) {
  const doc = globalThis.document;
  const box = doc.createElement('div'), cv = doc.createElement('canvas'), fig = doc.createElement('figure'), tabs = doc.createElement('div'), cap = doc.createElement('figcaption');
  box.className = 'stress-wash';
  tabs.className = 'wash-tabs';
  cv.width = fit.size; cv.height = fit.size;
  cv.style.width = `${fit.size * fit.k}px`; cv.style.height = `${fit.size * fit.k}px`;
  cv.style.imageRendering = fit.smooth ? 'auto' : 'pixelated';
  const show = (c) => {
    for (const b of tabs.children) b.classList.toggle('on', b.dataset.k === String(c?.k));
    cap.textContent = c ? `String ${Number(c.k) + 1}${c.model ? '' : ': no rounds at him'}` : '';
    fig.dataset.k = c ? String(c.k) : '';
    fig.dataset.text = c?.model ? [c.model.words, c.model.line].filter(Boolean).join(' | ') : '';
    const g = cv.getContext('2d');
    if (!g) return;
    if (!c?.model || !paint) { g.clearRect(0, 0, cv.width, cv.height); fig.dataset.marks = '[]'; return; }
    const pm = paint({ ...c.model, size: fit.size });
    g.putImageData(new ImageData(new Uint8ClampedArray(pm.data.buffer.slice(0)), pm.w, pm.h), 0, 0);
    fig.dataset.marks = JSON.stringify((pm.marks ?? []).map(d => [d.n, d.kind, d.zone]));
  };
  for (const c of cards) {
    const b = doc.createElement('button');
    b.type = 'button'; b.className = 'wash-tab'; b.dataset.k = String(c.k); b.textContent = String(Number(c.k) + 1);
    b.title = c.model ? c.model.words : 'no rounds at him';
    b.disabled = !c.model;
    b.onclick = () => show(c);
    tabs.append(b);
  }
  fig.append(cv, cap);
  box.append(fig, tabs);
  show([...cards].reverse().find(c => c.model) ?? cards[0] ?? null);
  return box;
}
