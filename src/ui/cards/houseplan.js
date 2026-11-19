// OLYMPUS cards: the shoot house's plan view, the lane replayed from above and linked to the run sheet (the build sheet v0.0.20 §1 item 26; card C2; COMBAT §25.10.4).
// v0.0.25: a place of panels far apart in one plan (the Wreck's two decks, 60 m apart) is drawn a panel each, side by side (planFrame's cuts).
//
// "CORNER MISSED · DOORWAY 0.30 S" says what, never where. The plan view draws the lane on the house seen from above, north up as the
// stage draws it (x to the right, z down), at PLAN_PX_M 16 px/m (480 × 320 px for the 30 × 20 m house; 20 px/m in a window 1,600
// px wide and 1,000 high or more), an instrument in Canvas2D as VIEWS §6 draws them: the rooms' walls as hairlines, each door's leaf at its angle at
// the scrubbed time (its hinge and swing, PLACES §1.6; a lane door's open fraction from the trace), the current room's hot spots as
// ticks (pale until covered), you amber and your number two pale, each with a short eye cone, the stands as the paper's figures (the
// face's colour, struck once down), and the events up to the scrubbed time as glyphs: an eye at a sighting, a bracket at a pause, a
// line from the muzzle at a round (its zone's colour, a miss dotted), a red ring at a fault with its paper word, a green tick at a
// "Clear!". Under it the scrubber: the lane's clock from GO, a segment a leg (the run sheet's), the events as ticks in three lanes
// (EYES: sightings and pauses; HANDS: rounds; FEET: corners, doors and calls) and the faults red, played at REPLAY_RATES 1×, 2× and
// 4× on the page's clock (Space plays or pauses with the plan focused, the arrows step TRACE_MS). A fault (its tick or its line under
// the scrubber) seeks to SEEK_LEAD_MS before it; a stand clicked opens its truth card through onStand (main.js passes v0.0.18's
// hitModelOf(s, key, k, 'truth') and paintHitcard, never imported here). Its model is house-debrief.js debriefOf's, given by the
// end card; planAt(d, ms) is the pure part (where everyone was, which leaves stood where, what had happened), drawPlan draws it, and
// housePlanEl the DOM. It never scrolls: its size is fixed by PLAN_PX_M and the house.
// v0.0.22 (its build sheet §1 item 16, the house lens's G4; v0.0.20's C6): a ghost, another run on the same house and lane kept by
// the page (house-ghosts.js), drawn under you at the same lane time from GO: its two discs at GHOST_ALPHA, an outline ring each and
// no eye cone, after the hot spots and before the stands (past its own end at its last place, GHOST_END_ALPHA); the head's "Ghost"
// chooses it (none, or each kept run of this key, newest first; the run played just before by default), its legs a second thin row
// under the scrubber's, and the clock says your lane time at your leg's start less his, "+5.8 s". Each draw is timed (drawMs, the
// slowest kept: F83's 4× replay).

import { ghostAt, ghostDelta, ghostWords, deltaWords, GHOST_ALPHA, GHOST_END_ALPHA } from './house-ghosts.js';

/** The plan's scale (px a metre) and the window from which it is the larger one (1,600 px wide; and 1,000 high, my call: at 1600 × 900 the larger plan and the run sheet under it would scroll). */
export const PLAN_PX_M = 16, PLAN_PX_M_WIDE = 20, PLAN_WIDE_PX = 1600, PLAN_TALL_PX = 1000;
/** The replay's rates (× the game clock), a fault's seek ahead of it (ms), and the arrows' step (ms: the trace's). */
export const REPLAY_RATES = Object.freeze([1, 2, 4]), SEEK_LEAD_MS = 1500, PLAN_STEP_MS = 100;
/** The house's plan rect (m: HOUSE1.rect, x0, z0, x1, z1), the margin around it (px). */
const MARGIN_PX = 6;
const C = Object.freeze({ bg: '#14151c', floor: '#23252f', wall: '#9aa0ad', door: '#e7b84a', leaf: '#f6f4ee', me: '#e7b84a', two: '#b9c4d6', hot: '#5a6272', hotOn: '#5fbf7e',
  threat: '#c4574e', noshoot: '#e2dac6', hostage: '#d9b23a', armoured: '#7a8394', down: '#565b67', fault: '#e0533f', clear: '#5fbf7e', eye: '#95c1e3', round: { A: '#f8e08a', C: '#e7b84a', head: '#f6f4ee', ring: '#95c1e3', miss: '#565b67' } });
const STANCE_R = Object.freeze([0.28, 0.25, 0.25, 0.2]);

/** The plan's scale for a window width (px a metre). */
export const planPxM = (winW = globalThis.innerWidth ?? 1024, winH = globalThis.innerHeight ?? 768) => (winW >= PLAN_WIDE_PX && winH >= PLAN_TALL_PX ? PLAN_PX_M_WIDE : PLAN_PX_M);
// (the sample at or before ms, -1 before the trace)
function at(tr, ms) {
  if (!tr?.ms?.length || ms < tr.ms[0]) return -1;
  let lo = 0, hi = tr.ms.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (tr.ms[m] <= ms) lo = m; else hi = m - 1; }
  return lo;
}
const man = (arr, i) => (i < 0 || !arr?.length || arr[i * 5] === null ? null : { x: arr[i * 5], z: arr[i * 5 + 1], faceDeg: arr[i * 5 + 2], stance: arr[i * 5 + 3], carry: arr[i * 5 + 4] });

/**
 * The plan at ms (pure): { ms, me, two, live: { [key]: { x, z } }, leaves: { [door]: k }, events (up to ms), hot (covered by ms), stands
 * (down by ms), leg (the leg running) }. d: debriefOf's model.
 */
export function planAt(d, ms) {
  const i = at(d.tracks, ms), lanes = {};
  for (const o of d.doors) lanes[o.id] = o.k && i >= 0 ? o.k[Math.min(i, o.k.length - 1)] : o.lane ? 0 : null;
  const events = d.events.filter(e => Number.isFinite(e.atMs) && e.atMs <= ms);
  const covered = new Set(events.filter(e => e.kind === 'corner').map(e => `${e.leg}|${e.hot}`));
  const leg = d.legs.find(L => Number.isFinite(L.fromMs) && L.fromMs <= ms && (L.clearAtMs === null || ms < L.clearAtMs)) ?? null;
  return {
    ms, me: man(d.tracks.me, i), two: man(d.tracks.two, i), live: Object.fromEntries(Object.entries(d.tracks.live ?? {}).map(([k, v]) => [k, i >= 0 && v.length > i * 2 ? { x: v[i * 2], z: v[i * 2 + 1] } : null])),
    leaves: lanes, events, leg, hot: (d.hot ?? []).filter(h => !leg || h.leg === leg.k).map(h => ({ ...h, covered: covered.has(`${h.leg}|${h.id}`) })),
    stands: d.stands.map(s => ({ ...s, down: s.down && Number.isFinite(s.downAtMs) && s.downAtMs <= ms, turned: Number.isFinite(s.turnAtMs) && s.turnAtMs <= ms })),
  };
}

/** v0.0.25: an empty band of the plan wider than this along x is cut to PANEL_SEP_M, so a place of panels apart is drawn a panel each, side by side (m). */
export const PANEL_GAP_M = 10, PANEL_SEP_M = 1;
/**
 * The view's frame: { pxM, w, h, x0, z0, cuts } for the house rect (m) at a scale. v0.0.25 ("Hold to hold": the Wreck's two decks lie 60 m
 * apart in one plan, its build sheet §1 item 13): every empty band along x between the walls wider than PANEL_GAP_M is cut to
 * PANEL_SEP_M, `cuts` [{ atM, shiftM }] (each x past atM drawn shiftM to the west), so the plan is a panel a deck; the house has none,
 * and its frame and every pixel are as before.
 */
export function planFrame(d, pxM = PLAN_PX_M) {
  const xs = d.walls.flatMap(w => [w.rect[0], w.rect[2]]), zs = d.walls.flatMap(w => [w.rect[1], w.rect[3]]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs);
  // (the walls' x spans merged, west to east; a gap between two of over PANEL_GAP_M is a cut)
  const spans = d.walls.map(w => [w.rect[0], w.rect[2]]).sort((a, b) => a[0] - b[0]), cuts = [];
  let end = spans[0]?.[1] ?? x0, shift = 0;
  for (const [a, b] of spans.slice(1)) {
    if (a - end > PANEL_GAP_M) { shift += a - end - PANEL_SEP_M; cuts.push({ atM: end, shiftM: shift }); }
    end = Math.max(end, b);
  }
  return { pxM, x0, z0, cuts, w: Math.ceil((x1 - x0 - shift) * pxM) + 2 * MARGIN_PX, h: Math.ceil((z1 - z0) * pxM) + 2 * MARGIN_PX };
}
// (the shift a point's x takes past the frame's cuts, m: 0 on the house)
const shiftAt = (F, x) => { let s = 0; for (const c of F.cuts ?? []) if (x > c.atM) s = c.shiftM; return s; };
/** A point of the house in the plan's pixels. */
export const toPx = (F, x, z) => [Math.round(MARGIN_PX + (x - F.x0 - shiftAt(F, x)) * F.pxM), Math.round(MARGIN_PX + (z - F.z0) * F.pxM)];

/** Draw the plan at ms on a Canvas2D g (its pixels F.w × F.h), with a ghost (house-ghosts.js) under you if given. Returns the stands' hit boxes for a click: [{ key, x, y, r }]. */
export function drawPlan(g, d, ms, F = planFrame(d), ghost = null) {
  const P = planAt(d, ms), px = (x, z) => toPx(F, x, z), m = F.pxM;
  g.fillStyle = C.bg; g.fillRect(0, 0, F.w, F.h);
  for (const w of d.walls) { const [a, b] = px(w.rect[0], w.rect[1]), [c, e] = px(w.rect[2], w.rect[3]); g.fillStyle = C.floor; g.fillRect(a, b, c - a, e - b); }
  g.strokeStyle = C.wall; g.lineWidth = 1;
  for (const w of d.walls) { const [a, b] = px(w.rect[0], w.rect[1]), [c, e] = px(w.rect[2], w.rect[3]); g.strokeRect(a + 0.5, b + 0.5, c - a - 1, e - b - 1); }
  // (the doors: the gap in the wall, the leaf from its hinge at its fraction open)
  for (const o of d.doors) {
    const along = o.axis === 'x', [ga, gb] = along ? [px(o.a, o.at), px(o.b, o.at)] : [px(o.at, o.a), px(o.at, o.b)];
    g.fillStyle = C.floor; g.fillRect(Math.min(ga[0], gb[0]) - (along ? 0 : 1), Math.min(ga[1], gb[1]) - (along ? 1 : 0), Math.abs(gb[0] - ga[0]) + (along ? 0 : 3), Math.abs(gb[1] - ga[1]) + (along ? 3 : 0));
    if (o.kind !== 'door') continue;
    const k = P.leaves[o.id] ?? 0, hingeA = (o.swing?.hinge ?? 'a') === 'a', into = o.swing?.into ?? 1, span = Math.abs(o.b - o.a);
    const hx = along ? (hingeA ? o.a : o.b) : o.at, hz = along ? o.at : (hingeA ? o.a : o.b);
    const base = along ? (hingeA ? 0 : Math.PI) : (hingeA ? Math.PI / 2 : -Math.PI / 2), turn = (hingeA ? 1 : -1) * (along ? into : -into) * (Math.PI / 2) * k;
    const [h0, h1] = px(hx, hz), ang = base + turn;
    g.strokeStyle = o.lane ? C.door : C.wall; g.lineWidth = 2;
    g.beginPath(); g.moveTo(h0, h1); g.lineTo(h0 + Math.cos(ang) * span * m, h1 + Math.sin(ang) * span * m); g.stroke();
  }
  // (the current leg's hot spots: pale until covered)
  for (const h of P.hot) { const [a, b] = px(h.x, h.z); g.fillStyle = h.covered ? C.hotOn : C.hot; g.fillRect(a - 1, b - 1, 3, 3); }
  // (the ghost at the same lane time from GO, under the stands: his #2 then him, a faint disc and its ring, no eye cone)
  if (ghost) {
    const at = ghostAt(ghost, ms - (d.goAtMs ?? d.from ?? ms)), k = at.ended ? GHOST_END_ALPHA : GHOST_ALPHA;
    for (const [p, c] of [[at.two, C.two], [at.me, C.me]]) {
      if (!p) continue;
      const [a, b] = px(p[0], p[1]), r = Math.max(3, Math.round(0.25 * m));
      g.globalAlpha = k; g.fillStyle = c; g.beginPath(); g.arc(a, b, r, 0, Math.PI * 2); g.fill();
      g.globalAlpha = Math.min(1, k + 0.3); g.strokeStyle = c; g.lineWidth = 1; g.beginPath(); g.arc(a, b, r + 1.5, 0, Math.PI * 2); g.stroke();
      g.globalAlpha = 1;
    }
  }
  // (the stands as the paper's figures, struck once down)
  const hits = [];
  for (const s of P.stands) {
    const [a, b] = px(s.x, s.z), r = Math.max(3, Math.round(0.3 * m));
    g.fillStyle = s.down ? C.down : C[s.face] ?? C.threat; g.fillRect(a - r, b - r, 2 * r, 2 * r);
    if (s.down) { g.strokeStyle = C.bg; g.beginPath(); g.moveTo(a - r, b - r); g.lineTo(a + r, b + r); g.stroke(); }
    hits.push({ key: s.key, stand: s.stand, x: a, y: b, r: r + 2 });
  }
  // (the events: rounds as lines from the shooter to the stand, sightings as eyes, faults as red rings)
  const standAt = new Map(d.stands.map(s => [s.key, s]));
  for (const e of P.events) {
    if (!Number.isFinite(e.x)) continue;
    const [a, b] = px(e.x, e.z);
    if (e.kind === 'round') { const s = standAt.get(e.key); if (s) { const [c, f] = px(s.x, s.z); g.strokeStyle = C.round[e.zone] ?? C.round.miss; g.lineWidth = 1; g.setLineDash(e.zone ? [] : [2, 2]); g.beginPath(); g.moveTo(a, b); g.lineTo(c, f); g.stroke(); g.setLineDash([]); } }
    else if (e.kind === 'sighting') { g.fillStyle = C.eye; g.fillRect(a - 1, b - 1, 2, 2); }
    else if (e.kind === 'fault') { g.strokeStyle = C.fault; g.lineWidth = 1; g.beginPath(); g.arc(a, b, 5, 0, Math.PI * 2); g.stroke(); }
    else if (e.kind === 'clear') { g.fillStyle = C.clear; g.fillRect(a + 3, b - 4, 2, 2); }
  }
  // (the two men: a disc and an eye cone of 55 degrees either side, short)
  for (const [w, c] of [[P.two, C.two], [P.me, C.me]]) {
    if (!w) continue;
    const [a, b] = px(w.x, w.z), r = Math.max(3, Math.round((STANCE_R[w.stance] ?? 0.25) * m)), f = (w.faceDeg ?? 0) * Math.PI / 180;
    g.fillStyle = c; g.globalAlpha = 0.25; g.beginPath(); g.moveTo(a, b); g.arc(a, b, 2.5 * m, f - 55 * Math.PI / 180, f + 55 * Math.PI / 180); g.closePath(); g.fill();
    g.globalAlpha = 1; g.beginPath(); g.arc(a, b, r, 0, Math.PI * 2); g.fill();
  }
  for (const v of Object.values(P.live)) if (v) { const [a, b] = px(v.x, v.z); g.fillStyle = C.threat; g.beginPath(); g.arc(a, b, 3, 0, Math.PI * 2); g.fill(); }
  return hits;
}

/** The scrubber's ticks (pure): [{ lane: 'eyes' | 'hands' | 'feet', kind, k (0 to 1 along the lane), atMs, fault?, word? }] over [fromMs, toMs]. */
export function scrubTicks(d, fromMs, toMs) {
  const span = Math.max(1, toMs - fromMs), LANE = { sighting: 'eyes', pause: 'eyes', round: 'hands', corner: 'feet', door: 'feet', clear: 'feet', fault: 'feet', go: 'feet' };
  return d.events.filter(e => Number.isFinite(e.atMs) && e.atMs >= fromMs && e.atMs <= toMs).map(e => ({ lane: LANE[e.kind] ?? 'feet', kind: e.kind, k: (e.atMs - fromMs) / span, atMs: e.atMs, ...(e.kind === 'fault' ? { fault: true, word: e.word } : {}) }));
}
/** Where a fault seeks: SEEK_LEAD_MS before it, never before the lane's start. */
export const seekOf = (atMs, fromMs) => Math.max(fromMs, atMs - SEEK_LEAD_MS);

/**
 * The plan view's DOM ({ className 'houseplan' }): the canvas, the scrubber with its legs and ticks, the rates, the faults' lines.
 * { el, seek(ms), play(rate), pause(), get ms, hits }. d: debriefOf's model; onStand(key, stand) a stand clicked; winW the window's
 * width (the scale); now() the page's clock in ms for the replay (performance.now by default). aside: an element set beside the
 * canvas in its row (.plan-row; main.js's truth card's slot: the hunt of v0.0.20, P4, under the plan it pushed the run sheet out of the
 * side column), wrapping under it where the column is too narrow.
 */
export function housePlanEl(d, { doc = globalThis.document, onStand = null, aside = null, winW = globalThis.innerWidth ?? 1024, winH = globalThis.innerHeight ?? 768, now = () => globalThis.performance?.now?.() ?? Date.now(), ghosts = [] } = {}) {
  if (!d || !doc) return null;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); for (const k of kids.flat()) if (k !== null && k !== undefined && k !== false) n.append(k); return n; };
  const F = planFrame(d, planPxM(winW, winH)), from = d.goAtMs ?? d.from ?? 0, to = d.endAtMs ?? d.tracks.ms.at(-1) ?? from;
  const cv = el('canvas', { className: 'plan-canvas', width: F.w, height: F.h, tabIndex: 0 });
  cv.style.width = `${F.w}px`; cv.style.height = `${F.h}px`;
  const g = cv.getContext?.('2d') ?? null;
  let ms = from, rate = 0, last = null, hits = [];
  // (the ghost drawn, the run just before by default; each draw's time, the slowest kept)
  const offered = Array.isArray(ghosts) ? ghosts.filter(Boolean) : [];
  let ghost = offered[0] ?? null, drawMs = 0, drawMaxMs = 0, draws = 0;
  const clock = el('span', { className: 'plan-clock', textContent: '' });
  const range = el('input', { type: 'range', className: 'plan-scrub', min: String(from), max: String(Math.max(from + 1, to)), step: String(PLAN_STEP_MS), value: String(from) });
  const draw = () => {
    const t0 = now();
    if (g) { g.imageSmoothingEnabled = false; hits = drawPlan(g, d, ms, F, ghost); }
    drawMs = now() - t0; drawMaxMs = Math.max(drawMaxMs, drawMs); draws++;
    const dl = ghost ? ghostDelta(d, ghost, ms) : null;
    clock.textContent = `${((ms - from) / 1000).toFixed(1)} s${dl !== null ? ` \u00b7 ${deltaWords(dl)}` : ''}`;
    range.value = String(ms);
    root.dataset.ms = String(ms);
  };
  const seek = (t) => { ms = Math.max(from, Math.min(to, Math.round(t))); draw(); };
  const tick = () => { if (!rate) return; const t = now(); ms = Math.min(to, ms + (t - last) * rate); last = t; draw(); if (ms >= to) rate = 0; else globalThis.requestAnimationFrame?.(tick); };
  const play = (r = 1) => { rate = r; last = now(); globalThis.requestAnimationFrame?.(tick); };
  const pause = () => { rate = 0; };
  range.addEventListener('input', () => { pause(); seek(Number(range.value)); });
  cv.addEventListener('click', (e) => {
    const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) * (F.w / b.width), y = (e.clientY - b.top) * (F.h / b.height);
    const h = hits.find(s => Math.hypot(s.x - x, s.y - y) <= s.r);
    if (h) onStand?.(h.key, h.stand);
  });
  cv.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); e.stopPropagation(); if (rate) pause(); else play(1); }
    else if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); pause(); seek(ms + (e.code === 'ArrowRight' ? 1 : -1) * PLAN_STEP_MS); }
  });
  // (the legs as the scrubber's segments, the ticks in their lanes, the faults red and clickable)
  const span = Math.max(1, to - from), pct = (v) => `${(Math.max(0, Math.min(1, v)) * 100).toFixed(2)}%`;
  const legs = el('div', { className: 'plan-legs' }, ...d.legs.filter(L => Number.isFinite(L.fromMs)).map(L => el('span', { className: `plan-leg ${L.state}`, textContent: L.word, style: `left: ${pct((L.fromMs - from) / span)}; width: ${pct(((L.clearAtMs ?? to) - L.fromMs) / span)}` })));
  // (the ghost's legs, a second thin row under yours, on your lane's clock from GO)
  const ghostLegs = el('div', { className: 'plan-legs ghost' });
  const ghostRow = () => {
    ghostLegs.replaceChildren(...(ghost ? ghost.legs.map((L, k) => [L, k]).filter(([L]) => Number.isFinite(L[0])).map(([L, k]) => {
      const a = (d.goAtMs ?? from) + L[0], b = Number.isFinite(L[1]) ? (d.goAtMs ?? from) + L[1] : (d.goAtMs ?? from) + ghost.laneMs;
      return el('span', { className: 'plan-leg ghost', textContent: d.legs[k]?.word ?? '', style: `left: ${pct((a - from) / span)}; width: ${pct((Math.min(b, to) - Math.min(a, to)) / span)}` });
    }) : []));
    ghostLegs.hidden = !ghost;
  };
  ghostRow();
  const ghostPick = offered.length ? el('select', { className: 'plan-ghost', title: 'Ghost: another run on this house and lane, drawn under you at the same time from GO' },
    el('option', { value: '-1', textContent: 'Ghost: none' }), ...offered.map((G, i) => el('option', { value: String(i), textContent: `Ghost: ${ghostWords(G)}` }))) : null;
  const setGhost = (i) => { ghost = offered[i] ?? null; if (ghostPick) ghostPick.value = String(ghost ? i : -1); ghostRow(); draw(); };
  if (ghostPick) { ghostPick.value = '0'; ghostPick.addEventListener('change', () => setGhost(Number(ghostPick.value))); }
  const ticks = scrubTicks(d, from, to);
  const lanes = el('div', { className: 'plan-lanes' }, ...['eyes', 'hands', 'feet'].map(lane => el('div', { className: `plan-lane ${lane}` }, el('b', { textContent: lane.toUpperCase() }),
    ...ticks.filter(t => t.lane === lane).map(t => { const i = el('i', { className: `plan-tick ${t.kind}${t.fault ? ' fault' : ''}`, style: `left: ${pct(t.k)}`, title: t.word ?? t.kind }); if (t.fault) i.onclick = () => { pause(); seek(seekOf(t.atMs, from)); }; return i; }))));
  const faults = d.events.filter(e => e.kind === 'fault');
  const faultList = faults.length ? el('div', { className: 'plan-faults' }, ...faults.map(f => el('button', { className: 'plan-fault', type: 'button', textContent: `${((f.atMs - from) / 1000).toFixed(1)} s · ${f.word}`, onclick: () => { pause(); seek(seekOf(f.atMs, from)); } }))) : null;
  const rates = el('span', { className: 'plan-rates' }, el('button', { className: 'plan-play', type: 'button', textContent: '▶', onclick: () => (rate ? pause() : play(1)) }),
    ...REPLAY_RATES.map(r => el('button', { className: 'plan-rate', type: 'button', textContent: `${r}×`, onclick: () => play(r) })));
  const root = el('div', { className: 'houseplan' },
    el('div', { className: 'plan-head' }, el('span', { textContent: 'THE LANE FROM ABOVE' }), d.from !== null && d.goAtMs !== null && d.from > d.goAtMs + PLAN_STEP_MS * 2 ? el('small', { textContent: `traced from ${((d.from - d.goAtMs) / 1000).toFixed(1)} s` }) : null, ghostPick, clock),
    el('div', { className: 'plan-row' }, cv, aside), el('div', { className: 'plan-scrubber' }, legs, ghostLegs, range, lanes), el('div', { className: 'plan-foot' }, rates, faultList));
  root.dataset.faults = String(faults.length);
  root.dataset.ghosts = String(offered.length);
  draw();
  return { el: root, seek, play, pause, get ms() { return ms; }, get hits() { return hits; }, frame: F,
    // (the ghosts offered, the one drawn, the delta now, and the draws' times)
    ghosts: offered, get ghost() { return ghost; }, setGhost, get delta() { return ghost ? ghostDelta(d, ghost, ms) : null; }, get drawMs() { return drawMs; }, get drawMaxMs() { return drawMaxMs; }, get draws() { return draws; }, resetDraws() { drawMaxMs = 0; draws = 0; } };
}
