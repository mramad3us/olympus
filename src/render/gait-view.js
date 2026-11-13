// OLYMPUS render: how a moving body is drawn, from its locomotion record (VIEWS §3.10.2 to §3.10.7; BODY §16.8; the shoot house rework's stage R8).
//
// The user, 2026-11-11: "saying that the walking about is goofy is an understatement, the animation is really not there
// yet." The sim reports one record for every mover (src/sim/body/loco.js: the gait phase gp, the body's yaw bodyRad, the
// stance); this module turns it into what the figures draw, frame by frame, with a little memory a person (the facing held,
// where a walk started, when it stopped), so nothing here is a clock of its own: stop motion holds every frame.
//   - THE FACING from the body's yaw, never the eyes' (headRad snaps up to 168° in a tick), with hysteresis: it changes when
//     the yaw is FACE_HYST_DEG 55° off the facing's axis, not 45° (v0.0.12 changed your facing 28 times a lane, 8 within
//     250 ms of the last: the dither at 45°, exactly where a room's corners lie from a doorway), and a facing is held FACE_HOLD_MS
//     250 ms unless the yaw has swung FACE_JUMP_DEG 100° since it changed (VIEWS §3.10.9 item 4). A body that is neither moving
//     nor holding a gun keeps the sim's four-way face, which is set where it turns without moving.
//   - THE LEGS by the travel's angle to that facing: within 55° of forward the band's cycle (walkFrame by gp); within 55° of
//     backward the same band reversed; else, with a gun in the hands, the side-step (two keys a step by the metres walked,
//     SIDE_STEP_M 0.25 m a step, the feet never crossing).
//   - THE PLANT LOCK: side on, the card is drawn walk.js cycleAt's lag behind the sim's place along the facing, so the planted
//     foot stays on the pixel it landed on through its stance (the frames' travel is baked in whole pixels); front and back the
//     stride is drawn at compose.js DEPTH_K 0.4 and no lock can hold the foot, so the card follows the body (VIEWS §3.10.2). In
//     the flight the card is at the sim's place, lifted by the ballistic height (walk.js flightLiftM) from the sim's gravity.
//   - THE BEATS (a mover in a stance, with the stance sheet: src/art/figures/poses.js STANCE_BANDS): `start` over the first
//     START_M 0.1 m from a standstill; `plant` while braking under PLANT_V_MS and for PLANT_MS after a stop from a move that
//     reached PLANT_FROM_MS 0.5 m/s (its peak, so a side-step braked to a stop plants too); `fireMove` for the kick of a shot on the move (the legs go on); the stack (`stack`, its exhale `stackB` at the
//     breath's rate, BREATH_S a breath, a person's phase hashed), the #2's tap, the hand on the door and the kick's three, all
//     on the sim's beat (src/sim/arms/look.js beatOf); a turn on the spot plays the new facing's passing step for PIVOT_MS
//     120 ms (the pivot, VIEWS §3.10.6: the turn's own time is the sim's yaw, so the frame follows it); `kneelGoing` half way to the knee (the stance step's frames); the
//     pistol drawn and aimed (COMBAT §25.19.6).
// Pure but for the memory it keeps (createGaitView): no DOM, no three.js.
import { walkFrame } from '../art/figures/poses.js';
import { bandSpec, flightLiftM } from '../art/figures/walk.js';
import { LOPE_VZ_MS, RUN_VZ_MS } from '../data/body/gait.js';
import { hash01 } from '../core/hash.js';

/** The facing's hysteresis (deg) and its hold (a facing kept FACE_HOLD_MS game ms unless the yaw has turned FACE_JUMP_DEG since it changed), the start's metres, the plant's hold after a stop (game ms) and the speed under which a braking body plants (m/s), the side-step's step (m), a breath at the stack (s) and its exhale's share. */
/** A walk is a start only from under this speed the tick before (m/s): above it the body was already going (R9). */
export const START_FROM_MS = 0.3;
export const FACE_HYST_DEG = 55, FACE_HOLD_MS = 250, FACE_JUMP_DEG = 100, PIVOT_MS = 120, START_M = 0.1, PLANT_MS = 150, PLANT_V_MS = 0.7, PLANT_FROM_MS = 0.5, SIDE_STEP_M = 0.25, BREATH_S = 4, EXHALE_K = 0.4;
/** The four facings' axes (rad, atan2(dz, dx): z runs down the picture). */
export const FACE_AXIS = Object.freeze({ right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 });
const FACES = ['right', 'down', 'left', 'up'];
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const HYST = FACE_HYST_DEG * Math.PI / 180;
/** The facing nearest an angle. */
export const nearestFace = (rad) => FACES[((Math.round(wrap(rad) / (Math.PI / 2)) % 4) + 4) % 4];
/** The facing for a yaw, held from `prev` until the yaw is FACE_HYST_DEG off its axis (see the header). */
export function faceFor(prev, rad) {
  if (!Number.isFinite(rad)) return prev ?? 'down';
  if (prev && FACE_AXIS[prev] !== undefined && Math.abs(wrap(rad - FACE_AXIS[prev])) <= HYST) return prev;
  return nearestFace(rad);
}
/** How the travel lies to the facing: 'fwd', 'back' or 'side' (within FACE_HYST_DEG of forward or backward, else across). */
export function travelKind(face, travelRad) {
  const r = Math.abs(wrap(travelRad - (FACE_AXIS[face] ?? 0)));
  return r <= HYST ? 'fwd' : r >= Math.PI - HYST ? 'back' : 'side';
}
/** The stance sheet's frames for a walk-type band's frame on the base sheet: the base walk's index (the Relaxed keys stand in), or the run's flight. */
function baseOf(at, band, cycle) {
  if (at.flight) return `run${at.step * 4 + 3}`;
  return `walk${at.step * bandSpec(cycle, band).n + at.j}`;
}

/**
 * The figures' gait for the frame: { draw(o) → { face, frame (null: the rifle's or the gait's own), offX, offZ (the plant lock, m),
 * lift (m), lagPx, band, kind, beat }, memo, reset }. o: { id, ms (the moment drawn, game ms), tickMs (the tick's), free (the
 * facing turns by the yaw: standing, not in a transition), simFace, yawRad (bodyRad), turnsByYaw (moving, or a gun in the hands),
 * walking, travelRad, stride (m, at the moment drawn), gp (at the moment drawn), stepM, vMs, band ('walk' | 'combat' | 'assault' |
 * 'run'), sheet (a stance sheet in this carry), kick (a shot's kick now), aimed, beat (look.js beatOf), action (the rifle's
 * action frame), pistol ({ posture } or null), gMs2, cycle }.
 */
export function createGaitView() {
  const memo = new Map();
  function draw(o) {
    let m = memo.get(o.id);
    if (!m || o.ms < (m.ms ?? -Infinity) - 1000) memo.set(o.id, (m = { face: null, faceMs: -Infinity, moving: false, startStride: 0, stopMs: -Infinity, stopV: 0, peakV: 0, tickMs: null, v: 0, v0: 0, ms: o.ms }));
    m.ms = o.ms;
    if (o.tickMs !== m.tickMs) { m.v0 = m.v; m.v = o.walking ? o.vMs : 0; m.tickMs = o.tickMs; }
    // (the facing: by the yaw with hysteresis, else the sim's four-way face)
    let face = o.free ? (o.turnsByYaw ? faceFor(m.face ?? o.simFace, o.yawRad) : o.simFace) : o.simFace;
    // (held FACE_HOLD_MS after a change unless the yaw swung FACE_JUMP_DEG since: a fast turn through two facings shows the middle one)
    if (o.free && o.turnsByYaw && m.face && face !== m.face && o.ms - m.faceMs < FACE_HOLD_MS && Number.isFinite(m.faceYaw) && Math.abs(wrap(o.yawRad - m.faceYaw)) <= FACE_JUMP_DEG * Math.PI / 180) face = m.face;
    // (the first facing given is no change: the hold starts at the first change)
    const turned = !!m.face && face !== m.face;
    if (face !== m.face) { m.lastFaceMs = m.faceMs; m.faceMs = m.face ? o.ms : -Infinity; m.face = face; m.faceYaw = o.yawRad; }
    // (a turn on the spot: the new facing's step for PIVOT_MS, the feet moving under the body as it comes round)
    if (turned && !o.walking && o.turnsByYaw && o.sheet) m.pivotUntil = o.ms + PIVOT_MS;
    const out = { face, frame: null, offX: 0, offZ: 0, lift: 0, lagPx: 0, band: null, kind: null, beat: null };
    if (!o.free) { m.moving = false; return out; }
    if (o.walking) {
      // (a walk taken up again while the sim's body was already going (a shot's frame or a beat drawn over it for a frame, not
      // free): no start, the stride counted as begun (the rework's R9, 2026-11-13: a body braking from 0.79 m/s was drawn on
      // `start` for three ticks after a frame not free, and its stop missed its plant, ui-walk)
      if (!m.moving) { m.moving = true; m.startStride = m.v0 >= START_FROM_MS ? o.stride - START_M : o.stride; m.peakV = m.v0 >= START_FROM_MS ? m.v0 : 0; }
      m.peakV = Math.max(m.peakV, m.v);
      const kind = travelKind(face, o.travelRad), sheet = !!o.sheet;
      out.band = o.band; out.kind = kind;
      const walked = ((o.stride - m.startStride) % 201.6 + 201.6) % 201.6;
      const braking = m.v < m.v0 - 0.02 && m.v < PLANT_V_MS;
      if (sheet && o.kick && o.aimed) { out.frame = `fireMove${Math.floor(((o.gp % 2) + 2) % 2)}`; out.beat = 'fireMove'; return out; }
      if (sheet && kind === 'side') {
        const right = wrap(o.travelRad - (FACE_AXIS[face] ?? 0)) > 0;
        out.frame = `side${right ? 'R' : 'L'}${Math.floor(o.stride / (SIDE_STEP_M / 2)) % 2}`; out.beat = 'side';
        return out;
      }
      if (sheet && o.band !== 'run' && walked < START_M) { out.frame = 'start'; out.beat = 'start'; return out; }
      if (sheet && o.band !== 'run' && braking) { out.frame = 'plant'; out.beat = 'plant'; return out; }
      const at = walkFrame(o.band, { gp: o.gp, stepM: o.stepM, back: kind === 'back', cycle: o.cycle });
      out.frame = sheet || o.band === 'walk' || o.band === 'run' ? at.frame : baseOf(at, o.band, o.cycle);
      out.lagPx = at.lagPx;
      if (at.flight) out.lift = flightLiftM(at.u, o.band === 'run' ? RUN_VZ_MS : LOPE_VZ_MS, o.gMs2);
      else if (kind !== 'side' && (face === 'right' || face === 'left')) {
        // (the plant lock: the card held where the key began, the planted foot on the pixel it landed on)
        const lagM = at.lagPx / 16;
        out.offX = face === 'right' ? -lagM : lagM;
      }
      return out;
    }
    // (the stop's speed is the move's peak, not the last tick's: a body braked to a stop, or out of a side-step whose frames held
    // its braking, still plants at the end (VIEWS §3.10.9 item 2: plant on every stop from 0.8 m/s))
    if (m.moving) { m.moving = false; m.stopMs = o.ms; m.stopV = Math.max(m.v, m.v0, m.peakV); }
    if (!o.sheet && !o.pistol) return out;
    if (o.ms < (m.pivotUntil ?? -Infinity) && !o.kick && !o.action && !o.pistol) { out.frame = `glide${bandSpec(o.cycle, 'combat').n === 4 ? 2 : 1}`; out.beat = 'pivot'; return out; }
    // (the pistol out (COMBAT §25.19.6): drawn, then aimed; the rifle's kneeling and handling frames stay the rifle's)
    if (o.pistol) { out.frame = o.pistol.posture === 'aimed' ? 'pistolAim' : 'draw'; out.beat = 'pistol'; return out; }
    if (o.action === 'kneelGoing' || o.action === 'kneelLow') { out.frame = o.action; out.beat = 'kneel'; return out; }
    const b = o.beat;
    if (b?.kind === 'kick') { out.frame = `kick${Math.min(2, Math.floor(b.k * 3))}`; out.beat = 'kick'; return out; }
    if (b?.kind === 'door') { out.frame = 'doorHand'; out.beat = 'door'; return out; }
    if (b?.kind === 'tap') { out.frame = 'stackTap'; out.beat = 'tap'; return out; }
    if (o.ms - m.stopMs < PLANT_MS && m.stopV >= PLANT_FROM_MS && !o.action && !o.kick) { out.frame = 'plant'; out.beat = 'plant'; return out; }
    if (b?.kind === 'stack' && !o.action && !o.kick) {
      // (held at the stack: the exhale a pixel lower at the breath's rate, the phase the person's own; game time, so held in stop motion)
      const ph = (o.ms / 1000 / BREATH_S + hash01('breath', o.id)) % 1;
      out.frame = ph < EXHALE_K ? 'stackB' : 'stack'; out.beat = 'stack';
    }
    return out;
  }
  return { draw, memo, reset: () => memo.clear() };
}
