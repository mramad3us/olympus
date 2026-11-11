// OLYMPUS hud: the coach's shot timer, its paper after each string of test-pairs (COMBAT §25.10.3; the build sheet 0.0.8 §2.3, §2.4; VIEWS §7.5).
//
// On "Pairs" the coach runs a shot timer (the scene's pairs.js: it starts on the turn, its beep the turner's), and at a
// string's end he reads its paper: "TURN TO PAUSE 0.80 · PAUSE TO FIRST 1.40 · SPLITS 0.40 · 2 A, 1 HEAD". The paper is
// the scene's (paperOf, paperText: one helper for the coach's words, this paper and the end card); this module draws
// it as the paper it is, a strip of thermal paper out of the timer, in the PAPER rectangle (layout.js: the top centre
// under PAUSED's slot, which the 25 m card has on the other courses: on the pairs pad there is no card to show, and
// the walking states 'walking-paper' and 'paused-paper' give it the same place when you are out of stop motion), so
// it is placed by layout.js clear of every HUD rectangle. Graphics first: the four lines in the picture's 3 × 5
// alphabet at whole device pixels, its header the string and the line, the take-in's line marked by the sheet's
// own amber where it is the marine's (the take-in is the scored thing), the zones as marks (A, C, HEAD, MISS, NO-SHOOT
// HIT). Its words (data-text) are the scene's paperText exactly, so a test reads the same line the coach said.
// timerModel(rec, { text }) is the pure part (the rows and their numbers from the string's record: takeInMs,
// pauseToFirstMs, splitsMs, zones), drawTimer(g, model, s) draws it, createTimer(parent) the DOM, redrawn on change.
// 0.0.9 (the build sheet 0.0.9 §2.2, §8 item 18; COMBAT §25.18.3): the banged string's paper (its record's bangs, frozeMs and
// offSafe, the scene's paperOf) leads "BANGS 3 · FROZE 2.45" and adds "OFF SAFE ✗ ✗ ✓" after PAUSE TO FIRST, each try of
// the safety in its order, a failed one a red ✗ ("OFF SAFE IN THE AIM" where the row's aim took it off, rung 2 up: the
// fixer's); the freeze on the take-in's amber band, as the marine's own time. Every other paper is drawn as before, to the pixel.
// 0.0.10 (the build sheet 0.0.10 §2.2's papers, §2.4; COMBAT §25.18.3): the stress course's papers (the scene's paperOf: the record's
// noise, blanks, bangs, frozeMs, offSafe, reload { ms, tries }, secondMs): the din's string leads "DIN 30 BLANKS", the called
// bang's "BANG CALLED" with FROZE beside it only when a startle froze him, three bangs' "BANGS 3 · FROZE 2.40"; OFF SAFE's tries
// after PAUSE TO FIRST on every noisy string; the last string adds "RELOAD 4.85 S ✗ ✓" (each try, a failed one red) and "SECOND
// 1.15" (the second turner's take-in, on the amber band as the first's) after the splits. A paper of more rows than TIMER_H holds
// grows to PAPER's 200 (TIMER_H_MAX), its strip longer.
// 0.0.12 (the build sheet 0.0.12 §2.3, §2.4; COMBAT §25.10.4): in the shoot house the same paper is the instructor's lane timer (laneModel):
// the lane's time from GO running ("LANE A · 12.4", whole tenths while it runs so the paper is drawn again ten times a second at most,
// hundredths once stopped), a row a room ("ROOM 1 7.40", the room now running), the par of the threat in front of you counting down
// ("PAR 3.00 · 1.2 LEFT"; "HE FIRED FIRST" in red past it, the harness's tone), and the lane's hits as marks; every number houseNow's.
import { textW, writeText } from '../plaque.js';
import { GLOWS } from '../../art/palette.js';

/** The paper's size (CSS px at --ui 1: within layout.js RECTS.PAPER's 200 × 200), its letters' scale (paper px a font px). */
export const TIMER_W = 200, TIMER_H = 140, TIMER_K = 2;
/** The paper at its longest (CSS px at --ui 1: PAPER's height), and the rows TIMER_H holds. */
export const TIMER_H_MAX = 200, TIMER_ROWS = 5;
/** The zones in the paper's order, and their words (the scene's paperText's order). */
// (0.0.8, the fixer's: the steel's own, a round that rang on a plate and the head plate down, as the scene's paper says them)
export const ZONE_ORDER = Object.freeze([['A', 'A'], ['C', 'C'], ['head', 'HEAD'], ['ring', 'RING'], ['headDown', 'HEAD DOWN'], ['miss', 'MISS'], ['noshoot', 'NO-SHOOT HIT']]);
const PAPER_C = '#efe9dc', PAPER_SHADE = '#d9d0bc', INKC = '#24201f', FAINT = '#7d746a', AMBER_C = `#${GLOWS[0].toString(16).padStart(6, '0')}`, RED_C = '#a3423c', GLASS = 'rgba(20, 21, 28, 0.86)';

const two = (ms) => (Number.isFinite(ms) ? (Math.max(0, ms) / 1000).toFixed(2) : '-');
/**
 * The paper's model: { rows: [{ label, value, mark? }], head, zones: [{ k, n, word }], text, numbers: { takeInMs, pauseToFirstMs,
 * splitsMs } }. rec: the string's record ({ k, line, takeInMs, pauseToFirstMs, splitsMs, zones } or paperOf's); text: the scene's
 * paperText of it (the coach's words); fmt: the one formatter of the take-in (react.js takeInWords), two places.
 */
export function timerModel(rec, { text = null, fmt = two } = {}) {
  if (!rec) return null;
  // (0.0.10: a stress string's record keeps its paper's fields under stress (pairs.js R.strs[].stress): read as the paper's own)
  if (rec.stress && typeof rec.stress === 'object') rec = { ...rec, ...rec.stress };
  const splits = Array.isArray(rec.splitsMs) ? rec.splitsMs : [];
  const zones = ZONE_ORDER.map(([k, word]) => ({ k, n: Number(rec.zones?.[k]) || 0, word })).filter(z => z.n > 0);
  // (0.0.9: the banged string's rows round the take-in's and the first round's: the bangs and the freeze, the safety's tries)
  // (the record's bangs a count with frozeMs and offSafe beside it (the paper's, paperOf), or the session's record { n, frozeMs, offSafe } (strs[k].bangs))
  const bg = rec.bangs && typeof rec.bangs === 'object' ? rec.bangs : { n: rec.bangs, frozeMs: rec.frozeMs, offSafe: rec.offSafe };
  // (0.0.10: on the stress course the noise says which lead: a called bang's one bang is "BANG CALLED", not "BANGS 1")
  const banged = rec.noise ? (rec.noise === 'bangs' || rec.noise === 'reload') && Number(bg.n) > 0 : Number(bg.n) > 0, tries = Array.isArray(bg.offSafe) ? bg.offSafe : [];
  rec = { ...rec, bangs: Number(bg.n) || 0, frozeMs: bg.frozeMs ?? null };
  // (0.0.10: the stress course's noise: the din's blanks, a called bang; its RELOAD and its second turner)
  const noise = rec.noise ?? null, din = noise === 'din', called = noise === 'called';
  const noisy = banged || din || called, froze = Number.isFinite(rec.frozeMs) && rec.frozeMs > 0;
  const rl = rec.reload && typeof rec.reload === 'object' ? rec.reload : null, rlTries = Array.isArray(rl?.tries) ? rl.tries : [];
  const rows = [
    // (FROZE and its amber only when he froze, as paperText leaves it out and the called bang's row does (the design review of
    // 0.0.10: the tier one's drawn paper marked "FROZE 0.00" where its text said nothing))
    ...(banged ? [{ label: `BANGS ${Number(rec.bangs)}`, value: froze ? `FROZE ${fmt(rec.frozeMs)}` : '', mark: froze ? 'froze' : null }] : []),
    // (the din's plan, and the blanks heard when the string ended first: the scene's stressLead)
    ...(din ? [Number.isFinite(rec.blanksPlan) && (Number(rec.blanks) || 0) < rec.blanksPlan ? { label: `DIN ${rec.blanksPlan} BLANKS`, value: `${Number(rec.blanks) || 0} HEARD` } : { label: `DIN ${Number(rec.blanks) || 0} BLANKS`, value: '' }] : []),
    ...(called ? [{ label: 'BANG CALLED', value: froze ? `FROZE ${fmt(rec.frozeMs)}` : '', mark: froze ? 'froze' : null }] : []),
    { label: 'TURN TO PAUSE', value: Number.isFinite(rec.takeInMs) ? fmt(rec.takeInMs) : '-', mark: 'takein' },
    { label: 'PAUSE TO FIRST', value: Number.isFinite(rec.pauseToFirstMs) ? fmt(rec.pauseToFirstMs) : '-' },
    ...(noisy && tries.length ? [{ label: 'OFF SAFE', value: tries.map(ok => (ok ? '✓' : '✗')).join(' '), mark: 'tries' }]
      : noisy && Number.isFinite(rec.pauseToFirstMs) ? [{ label: 'OFF SAFE', value: 'IN THE AIM' }] : []),
    { label: 'SPLITS', value: splits.length ? splits.map(fmt).join(' ') : '-' },
    ...(rl ? [{ label: 'RELOAD', value: [Number.isFinite(rl.ms) ? `${fmt(rl.ms)} S` : '-', ...rlTries.map(ok => (ok ? '✓' : '✗'))].join(' '), mark: 'tries' }] : []),
    ...(Number.isFinite(rec.secondMs) ? [{ label: 'SECOND', value: fmt(rec.secondMs), mark: 'takein' }] : []),
  ];
  const head = `STRING ${Number.isFinite(rec.k) ? rec.k + 1 : '?'}${Number.isFinite(rec.line) ? ` · ${rec.line} M` : ''}`;
  const said = text ?? [`TURN TO PAUSE ${rows[0].value}`, `PAUSE TO FIRST ${rows[1].value}`, `SPLITS ${rows[2].value}`, zones.length ? zones.map(z => `${z.n} ${z.word}`).join(', ') : null].filter(Boolean).join(' · ');
  // (0.0.10: a long paper grows to PAPER's height; every paper whose lines fit TIMER_H is TIMER_H, as before. The lines are counted
  // as drawTimer lays them, a value wrapped under its label and the zones' wrapped line included: the integrator's fix, as string
  // 5's five splits wrapped and pushed its zones off the foot of a paper sized by its rows alone)
  const bottom = paperFoot(rows, zones), h = bottom + PAPER_FOOT_PAD <= TIMER_H ? TIMER_H : Math.min(TIMER_H_MAX, bottom + PAPER_FOOT_PAD);
  return { head, rows, zones, text: said, h, bottom, numbers: { takeInMs: rec.takeInMs ?? null, pauseToFirstMs: rec.pauseToFirstMs ?? null, splitsMs: splits.slice(), ...(banged ? { bangs: Number(rec.bangs), frozeMs: rec.frozeMs ?? null, offSafe: tries.slice() } : {}), ...(din || called ? { noise, frozeMs: rec.frozeMs ?? null, offSafe: tries.slice() } : {}), ...(rl ? { reload: { ms: rl.ms ?? null, tries: rlTries.slice() } } : {}), ...(Number.isFinite(rec.secondMs) ? { secondMs: rec.secondMs } : {}) } };
}

// (the paper's layout in paper px, drawTimer's: the strip's margins, the rows' left and right, a line's height; and the room kept
// under the last line, TIMER_H less the foot of a five-row paper's zones)
const LAY = Object.freeze({ L: 14, Rt: TIMER_W - 14, lineH: 5 * TIMER_K + 7, top: 29 });
const PAPER_FOOT_PAD = 14;
/** The foot of the paper's last line (paper px), its rows and zones laid out as drawTimer lays them. */
export function paperFoot(rows, zones) {
  const k = TIMER_K, { L, Rt, lineH } = LAY;
  let y = LAY.top;
  for (const r of rows) {
    const vw = textW(r.value ?? '') * k;
    if (vw && L + (textW(r.label) + 3) * k + vw > Rt) y += lineH - 2;
    y += lineH;
  }
  let x = L;
  for (const z of zones) {
    const tw = textW(`${z.n} ${z.word}`) * k;
    if (x + tw > Rt && x > L) { x = L; y += lineH - 2; }
    x += tw + 10;
  }
  return y + 2 + 5 * k;
}

/** Draw the paper on a Canvas2D at s device pixels a paper pixel (crisp at every --ui and device ratio). */
export function drawTimer(g, m, s = 1) {
  const W = TIMER_W, H = m.h ?? TIMER_H, k = TIMER_K;
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x * s), Math.round(y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))); };
  // (the font's pixels at k paper pixels each, through writeText's px)
  const put = (x, y, text, c) => writeText((px, py, w, h) => R(x + (px - x) * k, y + (py - y) * k, w * k, h * k, c), x, y, text, null);
  const putC = (x, y, text, c) => { g.fillStyle = c; put(x, y, text, c); };
  R(0, 0, W, H, GLASS);
  // (the strip of thermal paper, its torn top edge, a shade down its right)
  const px0 = 8, pw = W - 16;
  R(px0, 4, pw, H - 8, PAPER_C);
  for (let i = 0; i < pw; i += 4) R(px0 + i, 4, 2, 1, GLASS);
  R(px0 + pw - 2, 6, 2, H - 10, PAPER_SHADE);
  const L = px0 + 6, Rt = px0 + pw - 6, lineH = 5 * k + 7;
  putC(L, 10, m.title ?? 'TIMER', FAINT);
  putC(Rt - textW(m.head) * k, 10, m.head, FAINT);
  R(L, 23, pw - 12, 1, PAPER_SHADE);
  let y = 29;
  for (const r of m.rows) {
    putC(L, y, r.label, INKC);
    const vw = textW(r.value) * k;
    // (a value too long for the label's line (a string's many splits) goes on the line under it, right-aligned)
    if (vw && L + (textW(r.label) + 3) * k + vw > Rt) y += lineH - 2;
    const vx = Rt - vw;
    // (the take-in, the scored thing, on an amber band: the marine's own time; 0.0.9 the freeze too)
    if ((r.mark === 'takein' || r.mark === 'froze') && r.value && !/-$/.test(r.value)) R(vx - 3, y - 2, vw + 6, 5 * k + 4, AMBER_C);
    // (0.0.12: the lane's par missed, red; met, the ink's)
    if (r.mark === 'late') putC(vx, y, r.value, RED_C);
    // (0.0.9: the safety's tries, a failed one red)
    else if (r.mark === 'tries') { let tx = vx; for (const ch of r.value) { putC(tx, y, ch, ch === '✗' ? RED_C : INKC); tx += (textW(ch) + 1) * k; } }
    else putC(vx, y, r.value, INKC);
    y += lineH;
  }
  R(L, y - 3, pw - 12, 1, PAPER_SHADE);
  // (the zones: a line of marks, a no-shoot hit and a miss in red)
  let x = L;
  for (const z of m.zones) {
    const t = `${z.n} ${z.word}`, tw = textW(t) * k;
    if (x + tw > Rt && x > L) { x = L; y += lineH - 2; }
    putC(x, y + 2, t, z.k === 'noshoot' || z.k === 'miss' ? RED_C : INKC);
    x += tw + 10;
  }
  if (!m.zones.length) putC(L, y + 2, 'NO HITS', FAINT);
}

/** The paper in parent: { el, update(model | null, { ui, dpr }) → its words, text }. */
export function createTimer(parent) {
  const doc = globalThis.document;
  const root = Object.assign(doc.createElement('div'), { className: 'timer', hidden: true });
  const cv = doc.createElement('canvas');
  root.append(cv);
  parent.append(root);
  let sig = null, words = '';
  return {
    el: root,
    update(m, { ui = 1, dpr = globalThis.devicePixelRatio ?? 1 } = {}) {
      if (!m) { root.hidden = true; words = ''; return ''; }
      root.hidden = false;
      const s = Math.max(1, ui * dpr), H = m.h ?? TIMER_H, sg = JSON.stringify([Math.round(s * 100), m.title ?? null, m.head, m.rows, m.zones, H]);
      if (sg !== sig) {
        sig = sg;
        cv.width = Math.round(TIMER_W * s); cv.height = Math.round(H * s);
        // (0.0.10: a long paper's strip longer, within PAPER)
        root.style.height = H === TIMER_H ? '' : `calc(${H}px * var(--ui))`;
        const g = cv.getContext('2d');
        if (g) { g.imageSmoothingEnabled = false; drawTimer(g, m, s); }
        words = m.text;
        root.dataset.text = words;
        root.dataset.takein = m.rows[0]?.value ?? '';
        root.dataset.first = m.rows[1]?.value ?? '';
        root.dataset.splits = m.rows[2]?.value ?? '';
      }
      return words;
    },
    get text() { return root.hidden ? '' : words; },
  };
}

// ---- 0.0.12: the instructor's lane timer in the shoot house (houseNow's numbers) ----
const tenth = (ms) => (Number.isFinite(ms) ? (Math.max(0, ms) / 1000).toFixed(1) : '-');
/** A room's name on the paper: the leg's own word ("ROOM 1", "HALL"), else by its place. */
export const roomWord = (r, i = 0) => r?.word ?? (r?.id === 'hall' || r?.door === 'hall' || r?.hall ? 'HALL' : `ROOM ${i + 1}`);
/** The faces a par runs on (the scene's THREAT_FACES: a threat, the armoured, the man with the hostage). */
const PAR_FACES = new Set(['threat', 'armoured', 'hostage']);
/**
 * The lane timer's model (drawTimer's shape): { title 'LANE TIMER', head 'LANE A', rows, zones, text, h }. hn: houseNow(state, ms)
 * ({ lane, timerMs, parMs, legs (or rooms and hall): [{ word, state, ms, par, parMissed, zones }], contacts: [{ seenMs, firstAtMs,
 * parMet, face }], end }); nowMs the game clock. Every number the scene's (a leg's ms is its own); the running ones in tenths, the
 * stopped in hundredths; null before GO.
 */
export function laneModel(hn, nowMs = 0) {
  if (!hn || !Number.isFinite(hn.timerMs)) return null;
  const done = !!hn.end, t = hn.timerMs;
  const rows = [{ label: done ? 'LANE' : 'GO', value: (done ? two : tenth)(t), mark: null }];
  const legs = hn.legs ?? [...(hn.rooms ?? []), ...(hn.hall ? [{ ...hn.hall, hall: true }] : [])];
  // (a leg once it has begun, its time the scene's: the one running in tenths)
  for (const [i, r] of legs.entries()) {
    if (!Number.isFinite(r.ms) || r.state === 'ahead') continue;
    const over = r.state === 'clear' || r.state === 'passed' || done, late = r.par === 'missed' || Number(r.parMissed) > 0 || (r.contacts ?? []).some(c => c.parMet === false);
    rows.push({ label: roomWord(r, i), value: (over ? two : tenth)(r.ms), mark: late ? 'late' : null });
  }
  // (the par of a threat still waiting for a round, counting down; past it, "HE FIRED FIRST")
  const parMs = hn.parMs, open = (hn.contacts ?? []).filter(c => Number.isFinite(c.seenMs) && (c.face === undefined || PAR_FACES.has(c.face)) && (c.parMet === null || c.parMet === undefined) && !Number.isFinite(c.firstAtMs));
  if (Number.isFinite(parMs) && open.length && !done) {
    const c = open[open.length - 1], left = c.seenMs + parMs - nowMs;
    rows.push(left > 0 ? { label: `PAR ${two(parMs)}`, value: `${tenth(left)} LEFT`, mark: null } : { label: 'PAR', value: 'HE FIRED FIRST', mark: 'late' });
  }
  // (at most TIMER_ROWS + 2 rows: the oldest legs give way)
  while (rows.length > TIMER_ROWS + 2) rows.splice(1, 1);
  const z = {};
  for (const r of legs) for (const [k, n] of Object.entries(r.zones ?? {})) z[k] = (z[k] ?? 0) + (Number(n) || 0);
  const zones = [...ZONE_ORDER, ['hostage', 'HOSTAGE HIT']].map(([k, word]) => ({ k: k === 'hostage' ? 'noshoot' : k, n: Number(z[k]) || 0, word })).filter(x => x.n > 0);
  const head = `LANE ${hn.lane ?? 'A'}`, text = `${head} · ${rows.map(r => `${r.label} ${r.value}`).join(' · ')}${zones.length ? ` · ${zones.map(x => `${x.n} ${x.word}`).join(', ')}` : ''}`;
  const h = Math.min(TIMER_H_MAX, Math.max(TIMER_H, paperFoot(rows, zones) + PAPER_FOOT_PAD));
  return { title: 'LANE TIMER', head, rows, zones, text, h, numbers: { timerMs: t } };
}
