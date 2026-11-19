// OLYMPUS cards: the plan view's ghosts, a run you played kept so the next on the same house is drawn beside it (the build sheet v0.0.22 §1 item 16; the house lens's G4; v0.0.20's C6; COMBAT §25.10).
//
// "Again as Tier one" puts the gulf on the card in numbers; the ghost puts it on the plan: the run you just played drawn faint under
// the one you are looking at, scrubbed by the same lane time from GO, so you see where he was while you were still at the door.
// A ghost is made from the end card's model (house-debrief.js debriefOf: its trace, R.house.$trace, sampled every TRACE_MS 100 from
// GO) and is UI only: nothing in src/sim reads it (tests/syntax.test.mjs holds the import), and it lives in this page's memory, the
// last GHOSTS_KEPT 6, gone at a reload (question 7 of the build sheet asks about keeping your best per house in this browser).
//   ghostKeyOf(rec, state)  the lane a ghost belongs to: the scene, the seed, the house's code (houseCodeOf: 'A' as set, a drawn
//                           house's whole code with its cast, so the stands stood where they stand now), the setup ('room:2' …),
//                           the loadout, the role-players (a live lane's men act otherwise) and the room plans ('derived': a lane
//                           on derived plans is never offered an authored lane's ghost, my call); one string;
//   ghostOf(d, { key, label, sheet })  the ghost: { key, label, sheet, laneMs, legs: [[fromMs, clearAtMs] from GO], ox, oz, b64, n },
//                           the trace packed as Int16, six a sample (you x and z to 0.01 m from the house's corner (ox, oz), your
//                           facing to 1 degree, your #2's x and z, the lane time in tenths of a second), base64; null for a lane
//                           with no GO, or traced from later than GHOST_FROM_GO_MS after it (a lane loaded mid-way: "traced from
//                           31.2 s"); a lane long enough to pass GHOST_KB_MAX keeps every second sample, or third, until it fits
//                           (the recruit's 92 s lane is about 14 KB whole);
//   ghostAt(G, laneMs)      where the ghost was at a lane time: { me: [x, z, yawDeg], two: [x, z] | null, ended }, the sample at or
//                           before it (the first before its first); past its end its last place, ended true (drawn at
//                           GHOST_END_ALPHA: nothing pops out of view);
//   ghostDelta(d, G, ms)    your lane time at the start of the leg you are in less the ghost's (ms: +5,800 is 5.8 s behind him), null
//                           where either has not started that leg;
//   keepGhost(G), ghostsFor(key, { not })  the page's list: kept newest last (the same ghost once; the end card keeps each run's
//                           once, main.js); the ghosts of a key, newest first, but `not`.
// The plan (houseplan.js) draws the ghost's two discs at GHOST_ALPHA 0.4, an outline ring each and no eye cone, under the stands.
// Pure but for the one list.
import { houseCodeOf } from '../../sim/scenes/assemble.js';
import { houseSetupOf } from '../../sim/scenarios/house-debrief.js';

/** The ghosts the page keeps (v0.0.20 C6's), the ghost's alpha, and its alpha past its own end. */
export const GHOSTS_KEPT = 6, GHOST_ALPHA = 0.4, GHOST_END_ALPHA = 0.2;
/** A trace starting later than this after GO makes no ghost (ms: two samples). */
export const GHOST_FROM_GO_MS = 200;
/** The most a ghost's packed trace may weigh (KB of base64). */
export const GHOST_KB_MAX = 16;
// (the sample's fields, and the sentinel for your #2 not on the lane)
const F = 6, NONE = -32768;

/** The lane a ghost belongs to (see the header). rec: the scene's record (its id); state: the lane's. */
export function ghostKeyOf(rec, state) {
  const R = state?.armoury?.range, H = R?.house ?? null;
  let code = null;
  try { code = houseCodeOf(state); } catch { code = null; }
  return [rec?.id ?? rec ?? '?', state?.meta?.seed ?? '?', code ?? '?', houseSetupOf(H) ?? 'go', H?.loadout ?? 'standard', H?.opfor ?? '-', H?.plans ?? 'authored'].join('|');
}

// (base64 of bytes and back, in the page and in node alike)
function toB64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return globalThis.btoa(s);
}
function fromB64(b64) {
  const s = globalThis.atob(b64), u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return new Int16Array(u8.buffer);
}
const i16 = (v) => Math.max(-32767, Math.min(32767, Math.round(v)));

/** A ghost of a finished lane (see the header), or null. d: debriefOf's model. */
export function ghostOf(d, { key = null, label = null, sheet = null } = {}) {
  const tr = d?.tracks, go = d?.goAtMs;
  if (!tr?.ms?.length || !Number.isFinite(go) || !Number.isFinite(d.from) || d.from - go > GHOST_FROM_GO_MS) return null;
  const xs = d.walls.flatMap(w => [w.rect[0]]), zs = d.walls.flatMap(w => [w.rect[1]]);
  const ox = xs.length ? Math.min(...xs) : 0, oz = zs.length ? Math.min(...zs) : 0;
  const idx = [];
  for (let i = 0; i < tr.ms.length; i++) if (tr.ms[i] >= go - GHOST_FROM_GO_MS && tr.me[i * 5] !== null) idx.push(i);
  if (!idx.length) return null;
  const pack = (step) => {
    const keep = idx.filter((_, j) => j % step === 0 || j === idx.length - 1), a = new Int16Array(keep.length * F);
    keep.forEach((i, j) => {
      const o = j * F, me = tr.me, two = tr.two;
      a[o] = i16((me[i * 5] - ox) * 100); a[o + 1] = i16((me[i * 5 + 1] - oz) * 100); a[o + 2] = i16(me[i * 5 + 2] ?? 0);
      const tx = two?.[i * 5] ?? null, tz = two?.[i * 5 + 1] ?? null;
      a[o + 3] = tx === null ? NONE : i16((tx - ox) * 100); a[o + 4] = tz === null ? NONE : i16((tz - oz) * 100);
      a[o + 5] = i16(Math.max(0, tr.ms[i] - go) / 100);
    });
    return { n: keep.length, b64: toB64(new Uint8Array(a.buffer)) };
  };
  let step = 1, p = pack(1);
  while (p.b64.length > GHOST_KB_MAX * 1024 && step < 64) p = pack(++step);
  const end = Number.isFinite(d.endAtMs) ? d.endAtMs : tr.ms.at(-1);
  const rel = (v) => (Number.isFinite(v) ? v - go : null);
  return { key, label, sheet, laneMs: Math.max(0, end - go), legs: (d.legs ?? []).map(L => [rel(L.fromMs), rel(L.clearAtMs)]), ox, oz, step, ...p };
}

// (the unpacked trace, kept on the ghost's own object out of its fields)
const unpacked = new WeakMap();
const samples = (G) => { let a = unpacked.get(G); if (!a) unpacked.set(G, (a = fromB64(G.b64))); return a; };

/** Where the ghost was at a lane time (see the header). */
export function ghostAt(G, laneMs) {
  const a = samples(G), n = G.n, t = laneMs / 100;
  let lo = 0, hi = n - 1;
  if (t <= a[5]) hi = 0;
  else while (lo < hi) { const m = (lo + hi + 1) >> 1; if (a[m * F + 5] <= t) lo = m; else hi = m - 1; }
  const o = (t <= a[5] ? 0 : lo) * F;
  return { me: [G.ox + a[o] / 100, G.oz + a[o + 1] / 100, a[o + 2]], two: a[o + 3] === NONE || a[o + 4] === NONE ? null : [G.ox + a[o + 3] / 100, G.oz + a[o + 4] / 100], ended: laneMs > G.laneMs };
}

/** Your lane time at the start of your leg less the ghost's (see the header; ms), or null. d: debriefOf's model; ms the game clock. */
export function ghostDelta(d, G, ms) {
  if (!d || !G || !Number.isFinite(d.goAtMs)) return null;
  let k = -1;
  (d.legs ?? []).forEach((L, i) => { if (Number.isFinite(L.fromMs) && L.fromMs <= ms) k = i; });
  if (k < 0) return null;
  const mine = d.legs[k].fromMs - d.goAtMs, his = G.legs?.[k]?.[0];
  return Number.isFinite(his) ? mine - his : null;
}

// ---- the page's list ----
const kept = [];
/** Keep a ghost (newest last, GHOSTS_KEPT at most; the same ghost kept once: a run played again to the tick is a run of its own). Returns it. */
export function keepGhost(G) {
  if (!G) return null;
  if (kept.includes(G)) return G;
  kept.push(G);
  while (kept.length > GHOSTS_KEPT) kept.shift();
  return G;
}
/** The ghosts of a key, newest first, but `not` (the run itself). */
export const ghostsFor = (key, { not = null } = {}) => kept.filter(G => G.key === key && G !== not).reverse();
/** Forget every ghost (the tests'). */
export const forgetGhosts = () => { kept.length = 0; };
/** A ghost's words on the plan's head: "Private 58.4 s". */
export const ghostWords = (G) => `${G.label ?? G.sheet ?? 'run'} ${(G.laneMs / 1000).toFixed(1)} s`;
/** A delta's words: "+5.8 s", "−1.2 s", "±0.0 s". */
export const deltaWords = (ms) => (Number.isFinite(ms) ? `${ms > 49 ? '+' : ms < -49 ? '−' : '±'}${(Math.abs(ms) / 1000).toFixed(1)} s` : '');
