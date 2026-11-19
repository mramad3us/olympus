// OLYMPUS sim: the drill instructor's line on the void range, the next step to a station while its command stands (test-anchors, "Anchor before you fire"; SKILLS §14; COMBAT §14.8; v0.0.25).
//
// The user's report of 2026-11-19, playing v0.0.24's course: "instructions from the intructor tell you stuff like "push to north
// station", I don't know what is meant, translate what I have to do for the 0G shooting training". The cadre's command says the whole
// way once (data/courses.js VOID_CADRE.cmd); this rule says the one step to take now, as the house's rules do at the door, in the game's
// own terms: the panel's row by its label (and the line names it, ctx.row, so the panel lights that tile), the key by its label
// (scenarios/anchors.js sayKeys, from core/keys.js). One rule, urgent so it stands in stop motion too, only on the course while a
// station's command stands and you are not yet set there (R.anchors.phase 'move'); the base's 'anchor' rule keeps quiet then (base.js).
// The step, in order (voidStepOf):
//   the boots' station   locked boots ("Lock your boots"), then the walk to the ring by the keys toward it, then the gun;
//   on the way           locked boots: "Release your boots"; a lanyard or a wedge: "Let go"; drifting: L within reach of the route's
//                        next pad-eye or the ring, else "drifting"; at rest (or a hand on a hold, which the keys push off): the push
//                        toward the route's furthest point in a straight line free on the walkers' grid (anchors.js stationRoute: the
//                        station's pad-eyes on the way, then its mark), by the keys of the nearest of their eight directions;
//   at the ring          drifting: L; held by another anchor than the station's: "Let go"; else the station's own row (Clip in,
//                        Take the hold, Wedge; a hand on a hold is station three's), then the gun (Transition: pistol, Rifle up);
//   station five         at the ring at rest: the push down into the open (the keys); off it, drifting: wait for the turn.
// T does the row where one is offered now (anchors' rows and the boots' out of the mode or in it, shooting.js anchorAction; a weapon
// row in the mode only), never a push or the grab, which are the keys'. Pure: reads only.
import { playerId } from '../../../core/ids.js';
import { label } from '../../../core/keys.js';
import { VOID_STEP, COURSES } from '../../../data/courses.js';
import { FOOTING } from '../../../data/body/needs.js';
import { anchorsOf, STATIONS, readyAt, NUM, sayKeys, stationRoute } from '../../scenarios/anchors.js';
import { footingOf, driftingNow } from '../../body/footing.js';
import { bootsRow, anchorRows } from '../../arms/shooting.js';
import { weaponRows } from '../../arms/sidearm.js';
import { navOf, isFree } from '../../places/nav.js';
import { holdNear } from '../../places/model.js';

const C = COURSES.anchors;
/** A route's point counts as reached within this (m): the pad-eye in the hand's reach. */
export const VOID_AT_M = 0.8;
// (the eight directions of the keys, by the screen's words: north is up, the top wall)
const DIR8 = Object.freeze([
  ['right', ['right']], ['down and right', ['down', 'right']], ['down', ['down']], ['down and left', ['down', 'left']],
  ['left', ['left']], ['up and left', ['up', 'left']], ['up', ['up']], ['up and right', ['up', 'right']],
]);
/** The keys' words toward a point from (x, z): "up and left (Z and Q)", the nearest of the keys' eight directions. */
export function dirWords(x, z, to) {
  const a = Math.atan2(to[1] - z, to[0] - x), i = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8, [w, keys] = DIR8[i];
  return `${w} (${keys.map(k => label(k)).join(' and ')})`;
}
// (a straight run free on the walkers' grid, sampled every 0.2 m)
function clearRun(state, from, to) {
  const g = navOf(state, state.places.live.area, 'C0'), L = Math.hypot(to[0] - from[0], to[1] - from[1]), n = Math.max(1, Math.ceil(L / 0.2));
  for (let i = 1; i <= n; i++) { const t = i / n; if (!isFree(g, from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t)) return false; }
  return true;
}
/** The route's point to push for from (x, z): the furthest of the station's route not yet reached and in a straight free run, else its next. */
export function routeNext(state, st, x, z) {
  const route = stationRoute(st);
  for (let i = route.length - 1; i >= 0; i--) if (Math.hypot(route[i][0] - x, route[i][1] - z) > VOID_AT_M && clearRun(state, [x, z], route[i])) return route[i];
  return route.find(p => Math.hypot(p[0] - x, p[1] - z) > VOID_AT_M) ?? st.mark;
}

/** The next step to the station now (see the header): { variant, n, row?, act?, dir? } or null off the course or out of its move. */
export function voidStepOf(state, me, ms = state.clock.ms) {
  const R = anchorsOf(state);
  if (!R || R.end || R.anchors?.phase !== 'move' || !me) return null;
  const A = R.anchors, st = STATIONS[A.st], rec = A.stations[A.st];
  if (!st) return null;
  const pid = playerId(state), F = footingOf(state, pid), n = NUM[st.n - 1], busy = !!state.skip || !!state.time?.doing, inMode = state.stop?.mode === 'stop';
  // (the words by the step's kind (ctx.words), the variant carrying what picks them again when it changes: the push's keys, the row)
  const r = readyAt(state, st), v = (kind, o = {}) => ({ variant: [kind, o.dir ?? '', o.row ?? ''].join('|'), words: kind, n, busy, ...o });
  // (a row offered now, not struck: the boots', the anchors' (out of the mode or in it) and the weapon group's)
  const offered = (id) => { const rows = id.startsWith('boots:') ? [bootsRow(state, pid)] : id.startsWith('anchor:') ? anchorRows(state, pid) : weaponRows(state, pid, ms); return rows.some(x => x && x.id === id && !x.off); };
  const rowStep = (variant, id) => (offered(id) ? v(variant, { row: id, label: sayKeys(`{row:${id}}`), act: id.startsWith('weapon:') ? (inMode ? `stop:${id}` : null) : `anchor:${id}` }) : null);
  const gunStep = () => {
    if (r.gun) return null;
    const id = st.gun === 'pistol' ? 'weapon:transition' : 'weapon:rifle-up';
    return rowStep('gun', id) ?? v('gun', { label: sayKeys(`{row:${id}}`), act: null });
  };
  if (r.ok) return v('wait');
  const dM = Math.hypot(me.x - st.mark[0], me.z - st.mark[1]), moving = driftingNow(state, pid) || !!me.push;
  if (st.want === 'magBoots') {
    if (F.hold !== 'boots') return rowStep('lock', 'boots:lock') ?? v('stop');
    if (!r.near) return v('walk', { dir: dirWords(me.x, me.z, st.mark) });
    return gunStep() ?? v('wait');
  }
  const held = ['handhold', 'tether', 'braced'].includes(F.hold), atMark = dM <= C.arriveM;
  if (st.want === 'floating' && rec?.atMarkMs !== undefined && rec?.atMarkMs !== null) {
    // (station five: at its ring, set and still, then off it into the open; drifting away from it, the turn is the cadre's)
    if (!atMark) return moving ? v('away') : v('out', { dir: dirWords(me.x, me.z, [st.mark[0], st.mark[1] + 10]) });
    if (F.hold === 'boots') return rowStep('release', 'boots:release') ?? v('stop');
    if (F.hold === 'tether' || F.hold === 'braced') return rowStep('letgo', 'anchor:letgo') ?? v('stop');
    // (pushing off it, or drifting away from it: the turn is coming; drifting onto it: the grab)
    if (moving && !held) return me.push || ((me.v?.[0] ?? 0) * (me.x - st.mark[0]) + (me.v?.[1] ?? 0) * (me.z - st.mark[1]) > 0) ? v('away') : v('grab');
    return gunStep() ?? v('out', { dir: dirWords(me.x, me.z, [st.mark[0], st.mark[1] + 10]) });
  }
  if (atMark && st.want !== 'floating') {
    if (moving && !held) return v('grab');
    const want = st.hold === 'tether' ? 'anchor:clip' : st.hold === 'braced' ? 'anchor:wedge' : 'anchor:hold';
    if (F.hold !== st.hold) {
      if (F.hold === 'tether' || F.hold === 'braced' || F.hold === 'boots') return F.hold === 'boots' ? rowStep('release', 'boots:release') ?? v('stop') : rowStep('letgo', 'anchor:letgo') ?? v('stop');
      return rowStep('anchor', want) ?? (holdNear(state, me.x, me.z, FOOTING.REACH_M) ? v('grab') : v('push', { dir: dirWords(me.x, me.z, st.mark) }));
    }
    return gunStep() ?? v('wait');
  }
  // (on the way)
  if (F.hold === 'boots') return rowStep('release', 'boots:release') ?? v('stop');
  if (F.hold === 'tether' || F.hold === 'braced') return rowStep('letgo', 'anchor:letgo') ?? v('stop');
  const next = routeNext(state, st, me.x, me.z);
  if (moving && !held) {
    const near = stationRoute(st).some(p => Math.hypot(p[0] - me.x, p[1] - me.z) <= VOID_AT_M);
    return near && holdNear(state, me.x, me.z, FOOTING.REACH_M) ? v('grab') : v('drift');
  }
  return v('push', { dir: dirWords(me.x, me.z, next) });
}

// (the words: the cadre's terms filled once ({key:…}, {row:…}), {n}, {dir} and {label} by the line's ctx (instinct.js wordsOf))
const fillRows = (lines) => lines.map(l => sayKeys(l).replace('{row}', '{label}'));
const TEXT = Object.freeze(Object.fromEntries(Object.entries(VOID_STEP).filter(([k]) => k !== 'short').map(([k, lines]) => [k, Object.freeze(fillRows(lines))])));

/** The void range's rule (see the header). */
export const VOID_RULES = Object.freeze([
  {
    id: 'void-station', voice: 'di', tone: 'urgent', short: VOID_STEP.short, reach: null, repeatMs: 0,
    when(state, me, ms) { const s = voidStepOf(state, me, ms); return s ? { ...s, noHumour: true } : null; },
    act: (ctx) => (ctx.busy ? null : ctx.act ?? null),
    text: { 1: TEXT.wait, ...TEXT },
  },
]);
