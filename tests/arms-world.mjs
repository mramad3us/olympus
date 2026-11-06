// OLYMPUS tests: a small world for the arms suites (firearms, drills, carry, nd, arms-kit, arms-look): a bare state with a marine and a coach on the 25 m bay, the range's kit materialised.
//
// armsWorld(opts) builds the state the arms code reads and nothing else: core's newState (every
// domain's empty fill), the live area melas.ground with its site's record, a marine (p1, actor a1)
// at lane 4's firing point facing downrange and, unless coach is false, a coach (p2, actor a2) at the
// marine's right shoulder, as the scene posts them; each with a written skills sheet (os 0, so a
// value is its base, or a base of 20 and the over-skill that makes a value above 23), the clock at a
// daylit or a dark hour on the bay (found from places' lightLevel, once), the 'range-fam' issue
// materialised on the marine (kit.js), the rifle in the posture asked, and a recording bus. It is the
// small local fixture the build sheet's §1 asks for, standing in for the shot role's scene so these
// suites test the arms on their own; the scene's own test (scene-handling) drives the whole.
import { newState } from '../src/core/state.js';
import { put } from '../src/core/ids.js';
import { recordingBus } from '../src/core/bus.js';
import { lightLevel } from '../src/sim/places/light.js';
import { KD_RANGE } from '../src/data/places/range.js';
import { materialise } from '../src/sim/arms/kit.js';

/** The lane the fixture's marine stands on, and its geometry. */
export const LANE = 4;
export const LANE_REC = KD_RANGE.bay.lanes[LANE - 1];
/** The bay as ndOf reads it. */
export const BAY = Object.freeze({ berm: KD_RANGE.bay.berm, heightM: 3.0, lineX: KD_RANGE.bay.lineX, downrangeRad: KD_RANGE.downrangeRad });

let dayMs = null, nightMs = null;
// (the first whole hour of game time where the bay is lit, and one where it is dark: once a process)
function hours() {
  if (dayMs !== null) return;
  const s = newState(1);
  s.places.live = { site: 'melas', area: 'melas.ground' };
  for (let h = 0; h < 72 && (dayMs === null || nightMs === null); h++) {
    const ms = h * 3_600_000, v = lightLevel(s, LANE_REC.fp.x, LANE_REC.fp.z, ms);
    if (dayMs === null && v >= 0.95 && h > 0) dayMs = ms + 2 * 3_600_000;
    if (nightMs === null && v <= 0.05) nightMs = ms;
  }
}

/** A skills sheet whose values are these (os 0 up to 23; above, a base of 20 and the Warfighting that makes it). */
export function sheetFor(values) {
  const top = Math.max(0, ...Object.entries(values).filter(([k]) => k !== 'fitness').map(([, v]) => v));
  const os = top > 23 ? Math.round((top / 20 - 1) * 100) : 0;
  const skills = {};
  for (const [k, v] of Object.entries(values)) {
    const base = os && k !== 'fitness' ? Math.round(v / (1 + os / 100)) : v;
    skills[k] = [Math.max(0, Math.min(20, base)), Math.max(0, Math.min(3, base - 20))];
  }
  return { cls: 'soldier', os, skills };
}

/**
 * The fixture (see the header). opts: { seed, wh (the marine's Weapon handling), awareness (the
 * coach's), coach, posture ('lowReady'), stance, dark, sets ({ <place>: { n, kind } }), at ({ x, z,
 * face } instead of the firing point), extra ([{ x, z, stance }]: more people standing about) }.
 * Returns { state, bus, pid, gunId, magIds, coachId, actor, coachActor }.
 */
export function armsWorld({ seed = 48213, wh = 10, mrk = 10, awareness = 14, coach = true, posture = 'lowReady', stance = null, dark = false, sets = {}, at = null, extra = [] } = {}) {
  hours();
  const state = newState(seed, { version: 'test' });
  state.clock.ms = dark ? nightMs : dayMs;
  state.places.live = { site: 'melas', area: 'melas.ground' };
  put(state, state.places.sites, 'melas', { template: 'melas@1' });
  state.actors.area = 'melas.ground';
  const person = (id, family, rank, values) => put(state, state.people, id, { id, name: { given: 'Test', family }, service: { rank }, skills: sheetFor(values) });
  person('p1', 'Okafor', 'Pvt', { weapons: wh, marksmanship: mrk, awareness: 6, fitness: 12 });
  const fp = at ?? { x: LANE_REC.fp.x, z: LANE_REC.fp.z, face: 'right' };
  const actor = { id: 'a1', who: 'p1', x: fp.x, z: fp.z, face: fp.face ?? 'right', gait: 'idle' };
  if (stance) actor.stance = stance;
  state.actors.list.push(actor);
  let coachActor = null;
  if (coach) {
    person('p2', 'Diaz', 'Sgt', { weapons: 18, marksmanship: 16, awareness, fitness: 14 });
    coachActor = { id: 'a2', who: 'p2', x: LANE_REC.coach.x, z: LANE_REC.coach.z, face: LANE_REC.coach.face, gait: 'idle' };
    state.actors.list.push(coachActor);
  }
  extra.forEach((e, i) => {
    const id = `p${10 + i}`;
    person(id, `Extra${i}`, 'Pvt', { weapons: 10, awareness: 6, fitness: 12 });
    const a = { id: `a${10 + i}`, who: id, x: e.x, z: e.z, face: e.face ?? 'left', gait: 'idle' };
    if (e.stance) a.stance = e.stance;
    state.actors.list.push(a);
  });
  state.player.id = 'p1'; state.player.actor = 'a1';
  state.meta.next = { ...(state.meta.next ?? {}), p: 20, a: 20 };
  const kit = materialise(state, 'p1', 'range-fam', { sets });
  state.people.p1.kit.carry.posture = posture;
  return { state, bus: recordingBus(), pid: 'p1', gunId: kit.gunId, magIds: kit.magIds, coachId: coach ? 'p2' : null, actor, coachActor };
}

/** The facts a recording bus heard, by name. */
export const heard = (bus, name) => (bus.events ?? []).filter(e => (e.type ?? e.name ?? e[0]) === name).map(e => e.payload ?? e.data ?? e[1]);
