// OLYMPUS tests: F87 and F88, the stage's knowledge (the build sheet v0.0.23 items 6 and 7, §8; the user, 2026-11-17: "we see what is in the rooms before entering them, this should not be the case when we start generating procedurally").
//
// F87, nobody before seen: in a combat scene (src/sim/places/known.js hostKind) no person but you, your #2 and the instructor is
// drawn on a frame before his first sighting (and those three are never hidden); once seen he is drawn where he is while his spot is in sight, as last seen while
// neither his spot nor his remembered one is, and never at a spot out of sight that is not his remembered one; a load keeps
// those seen before it who are on your sightings (contact.seenAt) or stand in a room you entered (§0 item 34). peopleGauge()
// plays the view's people half in node exactly as view.js calls it (src/render/memory.js recall with known.js seenEver, a frame
// a tick, the eye perception's eyeOf, in sight its visibility above 0) and holds every answer against an oracle kept apart:
// his first sighting (the first tick perception's visibility at his spot is above 0, or the sim's own sightings name him),
// from the sim's readers alone, never from memory.js or known.js. The page half (the stage's figures drawn) is ui-unknown's.
//
// F88, the unknown house: on a drawn lane no cell inside the footprint is known (drawn) before it, or a cell of its ring
// (render/known.js SEE_RING), has been in sight, and none is unknown again once known; the familiar places' known cells
// inactive (today's picture); the known channel's upload under UPLOAD_MID_KB a frame. cellsGauge() feeds render/known.js
// the fog's own wanted mask (perception's sightMask over a window round the eye, as view.js's fogFrame does, once a game
// second and whenever the eye moves FOG_MOVE_M or turns) and checks each newly known cell against perception's visibility at
// the centres of its ring, called afresh (the oracle: the window's place on the area's lattice is the module's to get right).
// The page half (the rooms' pixels black, the hall's drawn) is ui-unknown's.
// Enforced from B's merge (both: KNOWN_ENFORCED).
import { createMemory } from '../src/render/memory.js';
import { createKnown, SEE_RING, WALL_CELLS } from '../src/render/known.js';
import * as KNOWN from '../src/sim/places/known.js';
import { eyeOf, visibility, sightMask } from '../src/sim/people/perception.js';
import { contactOf } from '../src/sim/people/mind.js';
import { turnersOf } from '../src/sim/arms/turners.js';
import { opOf } from '../src/sim/combat/op.js';
import { areaOf } from '../src/sim/places/model.js';
import { UPLOAD_MID_KB } from '../src/data/bench.js';

/** The gauges this file enforces (from B's merge: the build sheet v0.0.23 §8). */
export const KNOWN_ENFORCED = Object.freeze(new Set(['F87', 'F88']));
/** The fog's cell (render/fog.js FOG_CELL_M, which imports three) and the view's recompute's move and turn (view.js FOG_MOVE_M, FOG_TURN_DEG). */
export const CELL_M = 0.25, MOVE_M = 0.25, TURN_DEG = 3;
/** The fog window round the eye cellsGauge reads (cells): 24 × 24 m, every cell of the house the eye can reach from where it stands. */
export const WINDOW_N = 96;

const meOf = (s) => s.actors.list.find(a => a.who === s.player.id) ?? null;
// (the team and the staff, always drawn)
const always = (s, a) => { const H = opOf(s); return a.who === s.player.id || a.who === H?.twoPid || a.who === H?.chiefPid || a.who === H?.team?.two; };

/**
 * The view's people half in node (see the header): frame(state) → [{ id, who, how: 'as-is' | 'remembered' | 'hidden', x, z, inSight }]
 * for every actor but you, as view.js's people loop answers them this frame. A new state (a load) is a new memory, as the view's.
 * legacy: v0.0.22's call (recall with no combat branch), the gauge's teeth; staffRule false: the combat branch for you, your #2 and
 * the instructor too (the teeth of their rule: they are never hidden).
 */
export function viewPeople({ legacy = false, staffRule = true } = {}) {
  const mem = createMemory();
  return function frame(state) {
    const me = meOf(state), area = state.places?.live?.area ?? null, fresh = mem.begin(state, area, { skipping: false });
    const eye = me ? eyeOf(state, me) : null, ms = state.clock.ms, combat = !legacy && KNOWN.hostKind(state) !== null;
    const inSight = (x, z) => visibility(state, eye, x, z, ms) > 0, out = [];
    for (const a of state.actors.list) {
      if (a === me || !eye) continue;
      const was = mem.recall(a.id, a.x, a.z, inSight, combat && !(staffRule && KNOWN.alwaysDrawn(state, a)) ? { combat, seenEver: KNOWN.seenEver(state, a, { rooms: fresh, sight: inSight }) } : undefined);
      const sight = inSight(a.x, a.z);
      if (was?.hide) { out.push({ id: a.id, who: a.who, how: 'hidden', x: a.x, z: a.z, inSight: sight }); continue; }
      if (was) { out.push({ id: a.id, who: a.who, how: 'remembered', x: was.x, z: was.z, at: [a.x, a.z], inSight: sight, wasInSight: inSight(was.x, was.z) }); continue; }
      mem.keep(a.id, a.x, a.z, { x: a.x, z: a.z });
      out.push({ id: a.id, who: a.who, how: 'as-is', x: a.x, z: a.z, inSight: sight });
    }
    return out;
  };
}

/**
 * F87's watcher (see the header): each(state, { loaded }) a frame a tick (loaded: this frame is a load's first), end() → { F87: { ok, … } }.
 * The oracle: a man's first sighting, the first tick perception's visibility at his spot is above 0 or your contact's
 * sightings name his turner; after a load, the men on your sightings and in a room you entered (knownRoomsOf's rects, read
 * as the sim's legs say) count as seen.
 */
export function peopleGauge({ legacy = false, staffRule = true } = {}) {
  const view = viewPeople({ legacy, staffRule }), seenAtTick = new Map(), out = { frames: 0, men: 0, shownBefore: [], shownOff: [], rememberedInSight: [], hiddenWhileOk: [], staffHidden: [], shownFrames: 0, hiddenFrames: 0, firstSeen: {}, atGo: null, loads: 0 };
  const menOf = (s) => new Map(turnersOf(s).filter(T => T.live).map(T => [T.live.who, T]));
  function each(state, { loaded = false } = {}) {
    const me = meOf(state), eye = me ? eyeOf(state, me) : null, ms = state.clock.ms, men = menOf(state), seenAt = contactOf(state)?.seenAt ?? {};
    if (!eye) return;
    out.frames++;
    if (loaded) {
      out.loads++;
      // (a load: those on your sightings and in a room you entered count as seen; the rest wait for their next sighting)
      const rooms = KNOWN.knownRoomsOf(state);
      for (const [who, T] of men) {
        const a = state.actors.list.find(x => x.who === who);
        const inRoom = a && rooms.some(r => a.x >= r.rect[0] && a.x <= r.rect[2] && a.z >= r.rect[1] && a.z <= r.rect[3]);
        if (seenAt[T.key] !== undefined || inRoom) { if (!seenAtTick.has(who)) seenAtTick.set(who, ms); } else seenAtTick.delete(who);
      }
    }
    for (const [who, T] of men) {
      const a = state.actors.list.find(x => x.who === who);
      if (!a) continue;
      if (!seenAtTick.has(who) && (visibility(state, eye, a.x, a.z, ms) > 0 || seenAt[T.key] !== undefined)) { seenAtTick.set(who, ms); out.firstSeen[T.stand ?? T.key] ??= ms - (opOf(state)?.goAtMs ?? ms); }
    }
    const H = opOf(state), go = H?.goAtMs ?? null;
    const rows = view(state);
    if (go !== null && ms === go) out.atGo = { men: men.size, shown: rows.filter(r => men.has(r.who) && r.how !== 'hidden').length };
    for (const r of rows) {
      const a = state.actors.list.find(x => x.id === r.id);
      const note = (list) => { if (list.length < 6) list.push({ msAfterGo: go === null ? null : ms - go, who: r.who, how: r.how, at: [a?.x, a?.z] }); };
      // (you, your #2 and the instructor: never hidden)
      if (a && always(state, a)) { if (r.how === 'hidden') note(out.staffHidden); continue; }
      if (!a || !men.has(r.who)) continue;
      const seen = seenAtTick.has(r.who);
      if (r.how === 'hidden') {
        out.hiddenFrames++;
        // (once seen, hidden only where his remembered spot is in sight and he is not there; never while it is out of sight)
        if (seen && r.inSight) note(out.hiddenWhileOk);
        continue;
      }
      out.shownFrames++;
      if (!seen) note(out.shownBefore);
      else if (r.how === 'as-is' && !r.inSight && !loaded) note(out.shownOff);
      else if (r.how === 'remembered' && r.wasInSight) note(out.rememberedInSight);
    }
    out.men = Math.max(out.men, men.size);
  }
  function end() {
    const ok = !out.shownBefore.length && !out.shownOff.length && !out.rememberedInSight.length && !out.hiddenWhileOk.length && !out.staffHidden.length && (out.atGo === null || out.atGo.shown === 0);
    return { F87: { ok, ...out } };
  }
  return { each, end };
}
/** F87's line, as the runners print it. */
export const f87Line = (r) => `F87 ${r.ok ? 'MET' : 'OPEN'}: ${r.men} role-players over ${r.frames} frames (${r.loads} loads), shown ${r.shownFrames}, hidden ${r.hiddenFrames}; at GO ${r.atGo ? `${r.atGo.shown} of ${r.atGo.men} shown` : 'not met'}; shown before his first sighting ${r.shownBefore.length}, as he is out of sight ${r.shownOff.length}, remembered at a spot in sight ${r.rememberedInSight.length}, hidden in sight ${r.hiddenWhileOk.length}; your #2 or the instructor hidden ${r.staffHidden.length}; first seen (ms after GO) ${JSON.stringify(r.firstSeen)}`;

/**
 * F88's watcher (see the header): each(state) a frame a tick, recomputing the fog's wanted mask as the view does; end() → { F88: { ok, … } }.
 * known: the render/known.js instance it drives (made here unless given), so a test can read its cells.
 */
export function cellsGauge({ known = createKnown({ cellM: CELL_M }), windowN = WINDOW_N, everyMs = 0 } = {}) {
  const out = { frames: 0, recomputes: 0, active: null, base: 0, known: 0, unseen: [], lost: 0, maskBytes: 0, newMax: 0, area: null, familiar: null, inside: 0, insideKnown: 0 };
  let at = null, gen = null, prev = null;
  function each(state) {
    const me = meOf(state);
    if (!me) return;
    out.frames++;
    const area = areaOf(state.places.live.area), eye = eyeOf(state, me), sec = Math.floor(state.clock.ms / 1000);
    const active = known.begin(state, area, () => ({ familiar: KNOWN.familiarOf(state, area.id), footprint: KNOWN.footprintOf(state), rooms: KNOWN.knownRoomsOf(state) }));
    out.active = active; out.area = area.id; out.familiar = KNOWN.familiarOf(state, area.id);
    if (!active) return;
    const fresh = gen !== known.gen; gen = known.gen;
    if (fresh) { out.base = known.count; prev = null; }
    const turned = at && Math.abs((((eye.headRad ?? 0) - at.head) * 180 / Math.PI + 540) % 360 - 180) >= TURN_DEG;
    // (the view's schedule; everyMs, the quick runners': at most one recompute in that much game time, which can only know less)
    if (!(fresh || !at || Math.hypot(eye.x - at.x, eye.z - at.z) >= MOVE_M || turned || sec !== at.sec)) return;
    if (!fresh && at && everyMs && state.clock.ms - at.ms < everyMs) return;
    at = { x: eye.x, z: eye.z, head: eye.headRad ?? 0, sec, ms: state.clock.ms };
    out.recomputes++;
    const x0 = Math.floor((eye.x - windowN * CELL_M / 2) / CELL_M) * CELL_M, z0 = Math.floor((eye.z - windowN * CELL_M / 2) / CELL_M) * CELL_M;
    const mask = { x0, z0, nx: windowN, nz: windowN, cellM: CELL_M, vis: new Float32Array(windowN * windowN) };
    sightMask(state, eye, mask);
    const before = prev ?? snapshot(known);
    const n = known.see(mask.vis, mask);
    out.newMax = Math.max(out.newMax, n);
    const after = snapshot(known);
    // (each cell newly known: a cell of its ring in sight now, by perception's visibility at its centre, called afresh)
    const [nx, nz] = known.size, m = known.mask;
    for (let c = 0; c < after.length; c++) {
      if (before[c] && !after[c]) out.lost++;
      if (before[c] || !after[c]) continue;
      const i = c % nx, j = Math.floor(c / nx);
      let ok = false;
      for (let dj = -SEE_RING; dj <= SEE_RING && !ok; dj++) for (let di = -SEE_RING; di <= SEE_RING && !ok; di++) {
        const x = m.x0 + (i + di + 0.5) * CELL_M, z = m.z0 + (j + dj + 0.5) * CELL_M;
        if (visibility(state, eye, x, z) > 0) ok = true;
      }
      if (!ok && out.unseen.length < 6) out.unseen.push({ ms: state.clock.ms, cell: [i, j], at: [m.x0 + (i + 0.5) * CELL_M, m.z0 + (j + 0.5) * CELL_M] });
    }
    prev = after;
    out.known = known.count; out.maskBytes = m.w * m.h;
    // (inside the footprint, past its outer band: how much of the house the eye has known)
    const fp = KNOWN.footprintOf(state).rect;
    let inside = 0, insideKnown = 0;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const x = m.x0 + (i + 0.5) * CELL_M, z = m.z0 + (j + 0.5) * CELL_M;
      if (x > fp[0] + WALL_CELLS * CELL_M && x < fp[2] - WALL_CELLS * CELL_M && z > fp[1] + WALL_CELLS * CELL_M && z < fp[3] - WALL_CELLS * CELL_M) { inside++; if (after[j * nx + i]) insideKnown++; }
    }
    out.inside = inside; out.insideKnown = insideKnown;
  }
  function end() {
    const ok = !out.unseen.length && !out.lost && out.maskBytes <= UPLOAD_MID_KB * 1024;
    return { F88: { ok, ...out } };
  }
  return { each, end, known };
}
// (the known cells as a plain array of 0 and 1)
function snapshot(known) {
  const [nx, nz] = known.size, a = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) a[j * nx + i] = known.known(i, j) ? 1 : 0;
  return a;
}
/** F88's line, as the runners print it. */
export const f88Line = (r) => `F88 ${r.ok ? 'MET' : 'OPEN'}: ${r.area} ${r.familiar ? 'familiar (inactive)' : 'unfamiliar'}; ${r.recomputes} recomputes over ${r.frames} frames; known ${r.known} cells (${r.base} at the making), inside the footprint ${r.insideKnown} of ${r.inside}; known before in sight ${r.unseen.length}${r.unseen.length ? ` ${JSON.stringify(r.unseen)}` : ''}, unknown again ${r.lost}; the most cells known at one recompute ${r.newMax}; the mask ${r.maskBytes} B a send (UPLOAD_MID_KB ${UPLOAD_MID_KB})`;
