// OLYMPUS art: composing a figure's frame. A pose solved into joints, projected for a facing, drawn as parts in role letters.
//
// tradecraft composed each frame from templates placed per view by its pose table (src/art/sprites.js
// compose()): the far arm and leg, the near leg, the torso, the armour, the near arm, then the head and
// what's on it, each template a new part so the shading (shade.js) can light a part's top edge, shade
// its right and bottom ones and ink an inner line where it lies over another. This keeps that output, a
// grid of { ch, part } cells in draw order, and builds it from a pose (poses.js) in three dimensions:
//   1. solve(): the pose's joint angles into joints in the body's own frame (forward F, left L, up U,
//      metres; the pelvis at the origin), the torso leaning on its hips, each leg a thigh, a shin and a
//      boot, each free arm an upper arm, a forearm and a hand; then the stance's orientation (prone falls
//      forward, supine back) and the ground (the lowest boot, knee or chest set on it);
//   2. the rig (RIGS): where the weapon is (its butt, its direction, which way its magazine hangs) for
//      the frame's mode (aimed, carried low or high, slung on the back, the magazine out or in, prone,
//      across the lap), and the hands put on it by two-bone IK from the shoulders (a hand that can't reach
//      the handguard slides back along the gun until it can: the chibi's short arms);
//   3. the projection: the facing turns the body frame into the world's (x east, y up, z south, toward the
//      camera), and the stage's camera puts a point at (x, z − y) on the picture (src/render/camera.js).
//      A sprite is drawn nearly front-on, as tradecraft's are, so depth moves things down the picture by
//      DEPTH_K (0.4) of what the camera would along the facing and SIDE_K (0.12) across it: an arm reached
//      toward the camera drops a little, the far shoulder rises a pixel, as a 45° camera shows, without
//      making a ball look like an egg. Lying bodies are foreshortened as the floor is (1.0 along them),
//      so a marine prone along the picture's depth is as long as the floor under them;
//   4. the parts, each with its depth toward the camera, sorted far to near (a painter's order, which
//      puts the near arm and a shouldered rifle over the head side on, and the far ones under the body),
//      drawn as capsules between joints (limbs), a polygon of slices along the spine (the torso), a box
//      projected corner by corner (a boot, a pack), the head's templates (templates.js headKit), the gun's
//      shape turned to its line (tradecraft's inverse-mapped turned()) or, seen end on, its muzzle as a
//      ring of steel round the bore;
//   5. a tumble turns the whole grid in the picture (inverse-mapped, nearest), before the shading, so the
//      light still comes from the upper left.
// Joints and limb ends snap to the pixel grid by their thickness (an even limb's line on a pixel edge,
// an odd one's on a pixel's centre), so a 2-px arm is 2 px wide wherever it goes, and the figure is
// symmetric about its middle column. Each cell also carries its part's pattern coordinates (u, v: the
// pixel's offset from the part's origin joint), so a camouflage pattern moves with the sleeve.
// The frame also reports its muzzle and the flash's kind (side on, a burst along the barrel; at you or
// away, a star) for the render's flash card, and the cell's anchor (body.js).
// 0.0.4: a pose may leave its legs out (noLegs: the berth's blanket holds them), sit on its pelvis
// (ground 'pelvis'), turn its head (a look) or its eyes (a glance), drop it a pixel (tired); the towel
// (outfits.js: a towel wrapped at the waist, bare chested, or at the chest for a woman; shower shoes)
// is a wrap drawn over both thighs as one part, so it reads as cloth, not shorts; wet hair (the look's
// cue after a shower) is the hair's own colour darker, with a wet sheen on its crown, and on a shaved
// head a glint on the scalp.
// 0.0.6 (the build sheet 0.0.6 §2.2; the user, 2026-11-06, of v0.0.4's horseshoe: "this haircut is not
// military acceptable"): the regulation cuts at their drawn steps (look.hair.step 0 to 3): the short sides
// painted on the head by the step (skin, a shadow, a dark, the hair's colour), the top a part over it, a
// pixel taller at step 3, a woman's short cut longer at the locks a row a step, a bun's or a braid's stray
// pixels at step 3; under a cover the men's tops hide and their sides show below it.
// 0.0.5 (the build sheet 0.0.5 §2.3 (b)): the rifle's handling rigs (poses.js HELD_RIFLE): 'front' (slung
// across the chest, the muzzle at the left knee, the hands free, the sling over the left shoulder),
// 'raise' (both hands bringing it off the sling), 'charge' (the rifle level under the right arm, the right
// hand up at the charging handle at the receiver's back), 'release' (the left hand at the bolt catch over
// the magazine well), 'check' (the muzzle up, the left hand at the port, the eyes down on it),
// 'proneRest' (prone, the rifle forward off the shoulder); kneeling, the rigs follow the kneeling body;
// prone (rig.prone), the hands work with the rifle propped on the elbows, its well clear of the ground,
// and a slung rifle lies across the back. Pure.
import { PX_PER_M } from '../../render/scale.js';
import { bodyOf } from './body.js';
import { poseOf, cellKind, AIM_TILT, KICK_TILT } from './poses.js';
import { headKit, shapeAt, turned, GUNS } from './templates.js';
import { wear } from './outfits.js';

/** How much of the camera's depth a sprite shows: along the facing, across it, and for a body lying along the depth. */
export const DEPTH_K = 0.4, SIDE_K = 0.12, LYING_K = 1.0;

// ---------- vectors, [F, L, U] metres ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp = (a, b, t) => add(a, mul(sub(b, a), t));
const F = [1, 0, 0], LEFT = [0, 1, 0], UP = [0, 0, 1];

/** The world's axes for a body facing dir: f (forward) and l (left), as [x, z]. */
const FACING = {
  down: { f: [0, 1], l: [1, 0] }, up: { f: [0, -1], l: [-1, 0] }, right: { f: [1, 0], l: [0, -1] }, left: { f: [-1, 0], l: [0, 1] },
};

/** A look's head, a quarter turn to the body's right, as the picture shows it; a glance (from the side or behind: toward the camera, or over the shoulder). */
const HEAD_TURN = { down: 'left', up: 'right', right: 'down', left: 'up' };
const GLANCE = { up: 'right', right: 'down', left: 'down' };

/** A stance's orientation: where the standing body's forward, left and up go (prone falls forward, supine back). */
const ORIENT = {
  prone: { f: [0, 0, -1], l: [0, 1, 0], u: [1, 0, 0] },
  supine: { f: [0, 0, 1], l: [0, 1, 0], u: [-1, 0, 0] },
};
const orient = (o, v) => (o ? add(add(mul(o.f, v[0]), mul(o.l, v[1])), mul(o.u, v[2])) : v);

// ---------- 1. the skeleton ----------

/**
 * A pose's joints in the body frame (metres): pelvis, spine (its unit), neckBase, neckTop, sh.r/l, el.r/l,
 * wr.r/l (free arms), hip/knee/ankle.r/l, foot.r/l ({ heel, toe, dir }), slices (the torso along the
 * spine), and `o` the stance's orientation. The lowest point is on the ground (U 0) unless the body floats.
 */
export function solve(pose, B) {
  const o = ORIENT[pose.stance] ?? null, lean = pose.lean ?? 0;
  const spine = [Math.sin(lean), 0, Math.cos(lean)], chestF = [Math.cos(lean), 0, -Math.sin(lean)];
  const torso = B.shoulderTop - B.hipJoint, J = { o, spine: orient(o, spine), chestF: orient(o, chestF) };
  const bob = (pose.bob ?? 0) / B.ppm;
  const up = (h) => mul(spine, h - bob * (h > 0.001 ? 1 : 0));
  J.pelvis = [0, 0, 0];
  J.neckBase = up(torso);
  J.neckTop = up(torso + B.neck);
  J.sh = { r: add(up(B.shoulderJoint - B.hipJoint), [0, -B.armOut, 0]), l: add(up(B.shoulderJoint - B.hipJoint), [0, B.armOut, 0]) };
  // (the torso as slices along the spine: [height from the hips, half-width, half-depth])
  const crotch = B.crotch - B.hipJoint;
  J.slices = [
    [crotch - 0.01, B.hipHalf, B.waistDepth], [Math.max(0.02, (B.waistM ?? torso * 0.32)), B.waistHalf, B.waistDepth],
    [torso * 0.72, B.chestHalf, B.chestDepth], [torso - 1.2 / B.ppm, B.shoulderHalf, B.chestDepth * 0.95],
    [torso, B.shoulderHalf - 1 / B.ppm, B.chestDepth * 0.8],
  ].map(([h, w, d]) => ({ c: up(h), h, w, d }));
  // (legs: [hip, knee, abduction]; the right leg on the body's right, -L)
  J.hip = {}; J.knee = {}; J.ankle = {}; J.foot = {};
  for (const s of ['r', 'l']) {
    const [phi, kap, abd] = pose.legs[s], side = s === 'r' ? -1 : 1;
    const hip = [0, side * B.hipSpread, 0];
    const thigh = [Math.sin(phi) * Math.cos(abd), side * Math.sin(abd), -Math.cos(phi) * Math.cos(abd)];
    const shin = [Math.sin(phi - kap) * Math.cos(abd), side * Math.sin(abd) * 0.6, -Math.cos(phi - kap) * Math.cos(abd)];
    const knee = add(hip, mul(thigh, B.thigh)), ankle = add(knee, mul(norm(shin), B.shin));
    // (the boot: flat on the ground while the shin stands; tipped with it, heel down, when swung forward or kicked back)
    const tilt = phi - kap, psi = Math.abs(tilt) < 0.25 ? 0 : Math.max(-1.2, Math.min(0.9, tilt * 0.9));
    const fdir = [Math.cos(psi), 0, Math.sin(psi)];
    const sole = add(ankle, mul(rotUp(fdir), -B.footH));
    J.hip[s] = hip; J.knee[s] = knee; J.ankle[s] = ankle;
    J.foot[s] = { dir: fdir, heel: add(sole, mul(fdir, -B.heel)), toe: add(sole, mul(fdir, B.footLen - B.heel)), top: ankle, side };
  }
  // (free arms: [shoulder, elbow, abduction]; the forearm swings on by the elbow's bend)
  J.el = {}; J.wr = {};
  for (const s of ['r', 'l']) {
    const [th, be, ab] = pose.arms?.[s] ?? [0, 0.1, 0.06], side = s === 'r' ? -1 : 1;
    const upper = [Math.sin(th) * Math.cos(ab), side * Math.sin(ab), -Math.cos(th) * Math.cos(ab)];
    const fore = [Math.sin(th + be) * Math.cos(ab * 0.7), side * Math.sin(ab * 0.7), -Math.cos(th + be) * Math.cos(ab * 0.7)];
    J.el[s] = add(J.sh[s], mul(upper, B.upperArm));
    J.wr[s] = add(J.el[s], mul(norm(fore), B.foreArm));
  }
  // The stance: the body turned, then set on the ground.
  const turn = (v) => orient(o, v);
  for (const k of ['pelvis', 'neckBase', 'neckTop']) J[k] = turn(J[k]);
  for (const k of ['sh', 'el', 'wr', 'hip', 'knee', 'ankle']) for (const s of ['r', 'l']) J[k][s] = turn(J[k][s]);
  for (const s of ['r', 'l']) { const f = J.foot[s]; f.heel = turn(f.heel); f.toe = turn(f.toe); f.top = turn(f.top); f.dir = turn(f.dir); }
  for (const sl of J.slices) sl.c = turn(sl.c);
  J.up = turn(UP); J.fwd = turn(F); J.left = turn(LEFT);
  if (pose.ground === 'pelvis') {
    // (sitting on the mattress: the seat of the body on the ground, the legs out along it)
    shift(J, [0, 0, -J.pelvis[2] + B.thighThick * 0.5 + (pose.lift ?? 0)]);
  } else if (pose.stance !== 'float') {
    const low = [];
    for (const s of ['r', 'l']) { low.push(J.foot[s].heel[2], J.foot[s].toe[2], J.knee[s][2] - B.shinThick / 2); }
    if (o) for (const sl of J.slices) low.push(sl.c[2] - Math.abs(J.chestF[2]) * sl.d - Math.abs(J.left[2]) * sl.w);
    if (o) low.push(J.neckTop[2] - 0.05);
    const dz = -Math.min(...low) + (pose.lift ?? 0);
    shift(J, [0, 0, dz]);
  }
  return J;
}
// (a direction turned 90° up in its own vertical plane: the boot's "up", for its sole)
function rotUp(d) { return norm([-d[2] * Math.sign(d[0] || 1), 0, Math.abs(d[0])]); }
function shift(J, d) {
  for (const k of ['pelvis', 'neckBase', 'neckTop']) J[k] = add(J[k], d);
  for (const k of ['sh', 'el', 'wr', 'hip', 'knee', 'ankle']) for (const s of ['r', 'l']) J[k][s] = add(J[k][s], d);
  for (const s of ['r', 'l']) { const f = J.foot[s]; f.heel = add(f.heel, d); f.toe = add(f.toe, d); f.top = add(f.top, d); }
  for (const sl of J.slices) sl.c = add(sl.c, d);
}

// ---------- 2. the weapon's rig, and the hands on it ----------

/** Two-bone IK: the elbow for a hand at t from the shoulder s (upper a, fore b), bent toward the pole. */
function ik(s, t, a, b, pole) {
  const d = sub(t, s), L = Math.min(len(d), a + b - 1e-4), dir = norm(d);
  const x = (a * a - b * b + L * L) / (2 * L), h = Math.sqrt(Math.max(0, a * a - x * x));
  const p = norm(sub(pole, mul(dir, dot(pole, dir))));
  return add(add(s, mul(dir, x)), mul(p, h));
}
const pitchUp = (d, a) => { const h = Math.hypot(d[0], d[1]) || 1, c = Math.cos(a), s = Math.sin(a); return norm([d[0] / h * (h * c - d[2] * s), d[1] / h * (h * c - d[2] * s), h * s + d[2] * c]); };
const yaw = (d, a) => [d[0] * Math.cos(a) - d[1] * Math.sin(a), d[0] * Math.sin(a) + d[1] * Math.cos(a), d[2]];

/**
 * Where the weapon is for a frame (body frame): { gun, butt, dir, down, lenM, withMag, hand: { r, l },
 * loose (a magazine in the left hand: { at, dir }), strap (a sling across the chest: [from, to]),
 * holster } or null. turn: an aim's turn (side on: up the picture; from the front or behind, to its right).
 */
function rigOf(pose, J, B, look, dir) {
  const r = pose.rig;
  if (!r) return null;
  const gun = r.gun ?? look.weapon;
  if (!gun) return null;
  const G = GUNS[gun], lenM = gun === 'pistol' ? B.pistolM : B.rifleM, at = (refPx) => lenM * refPx / G.len;
  // (the rig works in the facing's frame, not the body's turned one: lying prone, "forward" is still the way they face)
  const right = mul(LEFT, -1), U = UP, Fw = F;
  const mid = lerp(J.sh.r, J.sh.l, 0.5), side = dir === 'right' || dir === 'left';
  const out = { gun, lenM, withMag: !look.magOut, hand: { r: null, l: null }, mode: r.mode };
  // (a chibi's head is wider than its shoulders: seen from behind, a shouldered gun is drawn just clear of it, as tradecraft drew it)
  const clear = dir === 'up' ? B.headW / 2 - B.armOut * 0.45 + 1.5 / B.ppm : 0;
  const aimDir = () => {
    let d = Fw;
    const turn = r.turn ?? 0, tilt = AIM_TILT[gun];
    if (side) d = pitchUp(d, turn * tilt);
    else d = norm(add(mul(Fw, Math.cos(turn * tilt)), mul(LEFT, Math.sin(turn * tilt) * (dir === 'down' ? 1 : -1))));
    if (r.kick) d = pitchUp(d, KICK_TILT[gun]);
    return d;
  };
  switch (r.mode) {
    case 'aim': case 'prone': {
      out.dir = aimDir();
      if (gun === 'rifle') {
        out.butt = add(add(J.sh.r, mul(Fw, 0.02)), mul(LEFT, B.armOut * 0.45));
        if (r.mode === 'prone') out.butt = add(out.butt, mul(U, 0.03));
      } else {
        const reach = (B.upperArm + B.foreArm) * 0.92;
        const grip = add(add(mid, mul(Fw, reach)), mul(U, -0.02));
        out.butt = sub(grip, mul(out.dir, at(G.grip)));
      }
      if (r.kick) out.butt = sub(out.butt, mul(out.dir, 1.2 / B.ppm));
      out.butt = add(out.butt, mul(right, clear));
      break;
    }
    case 'low': {
      if (gun === 'rifle') {
        out.dir = norm(yaw(pitchUp(Fw, -0.72), 0.55));
        out.butt = add(add(add(J.sh.r, mul(Fw, 0.05)), mul(LEFT, 0.04)), mul(U, -0.05));
      } else {
        out.dir = pitchUp(Fw, -0.85);
        out.butt = add(add(J.pelvis, mul(U, (B.shoulderJoint - B.hipJoint) * 0.42)), mul(Fw, 0.2));
      }
      break;
    }
    case 'high': {
      if (gun === 'rifle') {
        out.dir = norm(add(add(mul(Fw, 0.5), mul(U, 0.78)), mul(right, 0.34)));
        out.butt = add(add(add(J.pelvis, mul(U, (B.shoulderJoint - B.hipJoint) * 0.32)), mul(Fw, B.chestDepth + 0.06)), mul(right, 0.05));
      } else {
        out.dir = norm(add(mul(Fw, 0.3), mul(U, 0.95)));
        out.butt = add(add(mid, mul(U, -0.14)), mul(Fw, B.chestDepth + 0.08));
      }
      break;
    }
    case 'slung': {
      if (gun === 'rifle' && r.prone) return proneSlung(out, J, B, G, at, right);
      if (gun === 'rifle') {
        // (on the back, its muzzle up past the right shoulder; the sling across the chest)
        const k = [0.7, 0.71];
        out.dir = norm(add(add(mul(U, k[0]), mul(right, k[1])), mul(Fw, -0.03)));
        out.butt = add(add(add(J.pelvis, mul(U, 0.06)), mul(LEFT, 0.16)), mul(Fw, -(B.waistDepth + 0.05)));
        out.down = mul(Fw, -1);
        out.strap = [add(add(J.sh.r, mul(Fw, B.chestDepth * 0.9)), mul(U, 0.03)), add(add(J.hip.l, mul(Fw, B.waistDepth)), mul(U, 0.06))];
      } else {
        // (a pistol holstered on the right thigh)
        out.dir = mul(U, -1); out.down = Fw;
        out.butt = add(add(J.hip.r, mul(right, B.thighThick * 0.7)), mul(U, -0.02));
        out.holster = true;
      }
      return finish(out, J, B, G, at, false);
    }
    case 'magout': case 'magin': {
      if (r.prone) {
        // (prone: the rifle propped on the elbows, its well up off the ground, the magazine hanging under it)
        out.dir = pitchUp(Fw, 0.12);
        out.butt = add(add(add(J.sh.r, mul(Fw, 0.12)), mul(U, 0.04)), mul(LEFT, -0.04));
        out.down = mul(U, -1);
      } else {
        out.dir = norm(yaw(pitchUp(Fw, -0.35), 0.35));
        out.butt = add(add(add(J.sh.r, mul(Fw, 0.1)), mul(U, -0.12)), mul(LEFT, 0.02));
        out.down = norm(add(mul(U, -0.8), mul(LEFT, 0.6)));
      }
      out.withMag = r.mode === 'magin';
      break;
    }
    case 'front': {
      if (r.prone) return proneSlung(out, J, B, G, at, right);
      // (slung in front, hands off: across the chest, the butt at the right shoulder, the muzzle at the left knee)
      out.dir = norm(add(add(mul(U, -0.86), mul(LEFT, 0.5)), mul(Fw, 0.1)));
      out.butt = add(add(add(J.sh.r, mul(Fw, B.chestDepth + 0.05)), mul(U, 0.03)), mul(LEFT, 0.03));
      out.down = Fw;
      out.strap = [add(add(J.sh.l, mul(Fw, B.chestDepth * 0.9)), mul(U, 0.03)), out.butt];
      return finish(out, J, B, G, at, false);
    }
    case 'raise': {
      out.dir = norm(yaw(pitchUp(Fw, -0.95), 0.75));
      out.butt = add(add(add(J.sh.r, mul(Fw, 0.08)), mul(U, -0.02)), mul(LEFT, 0.02));
      break;
    }
    case 'charge': case 'release': case 'check': {
      // (the rifle in to the body: level under the arm for the charging handle and the release, muzzle up for a
      // press check; prone, propped on the elbows)
      const up = r.mode === 'check' ? 0.32 : r.mode === 'charge' ? 0.12 : -0.12;
      if (r.prone) { out.dir = pitchUp(Fw, r.mode === 'check' ? 0.22 : 0.08); out.butt = add(add(add(J.sh.r, mul(Fw, 0.12)), mul(U, -0.03)), mul(LEFT, -0.04)); }
      else { out.dir = pitchUp(Fw, up); out.butt = add(add(add(J.sh.r, mul(Fw, 0.02)), mul(U, r.mode === 'check' ? -0.12 : -0.07)), mul(LEFT, B.armOut * 0.3)); }
      break;
    }
    case 'proneRest': {
      out.dir = pitchUp(Fw, -0.06);
      out.butt = add(add(add(J.sh.r, mul(Fw, 0.08)), mul(U, -0.04)), mul(LEFT, B.armOut * 0.3));
      break;
    }
    case 'lap': {
      out.dir = norm(add(mul(LEFT, 1), mul(Fw, 0.12)));
      out.butt = add(add(J.hip.r, mul(Fw, B.thigh * 0.55)), mul(U, B.thighThick * 0.9));
      out.down = Fw;
      break;
    }
    default: return null;
  }
  return finish(out, J, B, G, at, true);
}
// (a rifle slung while prone: across the back from the hips toward the right shoulder, the hands free)
function proneSlung(out, J, B, G, at, right) {
  out.dir = norm(add(add(mul(F, 0.94), mul(right, 0.22)), mul(UP, 0.1)));
  out.butt = add(add(J.pelvis, mul(UP, B.chestDepth * 1.9)), mul(F, -0.18));
  out.down = mul(right, -1);
  return finish(out, J, B, G, at, false);
}
function finish(out, J, B, G, at, hold) {
  if (!out.down) { const d = out.dir; out.down = norm(sub([0, 0, -1], mul(d, -d[2]))); if (Math.abs(out.dir[2]) > 0.95) out.down = F; }
  out.down = norm(sub(out.down, mul(out.dir, dot(out.down, out.dir))));
  const point = (refPx, drop) => add(add(out.butt, mul(out.dir, at(refPx))), mul(out.down, drop));
  out.muzzle = point(G.muzzle, 0);
  out.magwell = point(G.magwell ?? G.grip, at(1.5));
  if (!hold) return out;
  out.hand.r = out.mode === 'charge' ? point(G.grip - 1.2, -at(2.6)) : point(G.grip, at(1.2));   // (charging: the right hand up at the handle, the receiver's back)
  if (out.mode === 'magout') {
    out.hand.l = add(out.magwell, mul(out.down, B.magM * 0.95));
    out.loose = { at: add(out.magwell, mul(out.down, B.magM * 0.25)), dir: out.down };
  } else if (out.mode === 'magin') out.hand.l = add(out.magwell, mul(out.down, B.magM * 0.75));
  else if (out.mode === 'release') out.hand.l = point((G.magwell ?? G.grip) - 1.5, at(0.6));          // (the left hand on the bolt catch)
  else if (out.mode === 'check') out.hand.l = point((G.magwell ?? G.grip) - 1.5, -at(0.9));          // (the left hand at the port)
  else if (out.gun === 'pistol') out.hand.l = add(out.hand.r, mul(out.dir, at(0.5)));
  else {
    // (the support hand under the handguard; a hand that can't reach slides back along the gun until it can)
    const reach = B.upperArm + B.foreArm - 0.005;
    let k = G.fore;
    while (k > G.grip + 1 && len(sub(point(k, at(1)), J.sh.l)) > reach) k -= 0.5;
    out.hand.l = point(k, at(1));
  }
  return out;
}

// ---------- 3. the projection ----------

/**
 * The projector for a facing: p(v) → [x, y] picture pixels from the anchor (x right, y down), depth(v)
 * toward the camera (metres, nearer larger), and the world's x and z of a body point.
 */
function projector(dir, pose, B) {
  const { f, l } = FACING[dir];
  const lying = pose.stance === 'prone' || pose.stance === 'supine';
  const kF = lying ? LYING_K : DEPTH_K;
  const world = (v) => [v[0] * f[0] + v[1] * l[0], v[2], v[0] * f[1] + v[1] * l[1]];
  return {
    world,
    p: (v) => [(v[0] * f[0] + v[1] * l[0]) * B.ppm, (-v[2] + kF * v[0] * f[1] + SIDE_K * v[1] * l[1]) * B.ppm],
    depth: (v) => v[0] * f[1] + v[1] * l[1] + 0.3 * v[2],
  };
}

// ---------- 4. drawing into cells ----------

function grid(w, h) {
  const cells = Array.from({ length: h }, () => Array(w).fill(null));
  let part = 0, ou = 0, ov = 0;
  const g = {
    w, h, cells,
    get part() { return part; },
    /** A new part; (u0, v0) its pattern's origin. */
    begin(u0 = 0, v0 = 0) { part++; ou = u0; ov = v0; return part; },
    put(x, y, ch, t = null) {
      x = Math.floor(x); y = Math.floor(y);
      if (x < 0 || y < 0 || x >= w || y >= h || ch === '.' || ch === ' ') return;
      cells[y][x] = { ch, part, u: x - ou, v: y - ov, t };
    },
    /** A detail on a part's own pixels only (painted on it, the same part). */
    on(p, x, y, ch, t = null) { x = Math.floor(x); y = Math.floor(y); const c = cells[y]?.[x]; if (c && c.part === p) { c.ch = ch; c.t = t; } },
    /** Every pixel whose centre lies within r of segment ab (a limb); role(k) its letter, k 0..1 along it. */
    capsule(a, b, r, role) {
      const x0 = Math.floor(Math.min(a[0], b[0]) - r - 1), x1 = Math.ceil(Math.max(a[0], b[0]) + r + 1);
      const y0 = Math.floor(Math.min(a[1], b[1]) - r - 1), y1 = Math.ceil(Math.max(a[1], b[1]) + r + 1);
      const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-9;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const cx = x + 0.5, cy = y + 0.5, k = Math.max(0, Math.min(1, ((cx - a[0]) * dx + (cy - a[1]) * dy) / L2));
        const ex = cx - a[0] - k * dx, ey = cy - a[1] - k * dy;
        if (ex * ex + ey * ey < r * r - 1e-6) g.put(x, y, typeof role === 'function' ? role(k) : role);
      }
    },
    /** A polygon (pixel centres inside it). */
    poly(pts, role) {
      const ys = pts.map(p => p[1]);
      for (let y = Math.floor(Math.min(...ys)); y < Math.ceil(Math.max(...ys)); y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
          if ((ay <= yc) !== (by <= yc)) xs.push(ax + (bx - ax) * (yc - ay) / (by - ay));
        }
        xs.sort((p, q) => p - q);
        for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) g.put(x, y, typeof role === 'function' ? role(x, y) : role);
      }
    },
    /** A template ({ x, y, rows } from (x0, y0)), its letters through map (a letter to a letter, or null to skip). */
    tpl(t, x0, y0, map = null) {
      if (!t) return;
      t.rows.forEach((row, j) => [...row].forEach((ch, i) => {
        if (ch === '.') return;
        const c = map ? map(ch) : ch;
        if (c) g.put(x0 + t.x + i, y0 + t.y + j, c);
      }));
    },
  };
  return g;
}

// (a point snapped for a line of thickness th: an even one on a pixel edge, an odd one on a pixel's centre)
const snapTo = (v, th) => (th % 2 === 0 ? Math.round(v) : Math.floor(v) + 0.5);
const snap2 = (p, th) => [snapTo(p[0], th), snapTo(p[1], th)];

/** A template turned by quarter turns (q: 1 clockwise) and its box, for a lying head. */
function quarter(t, bw, bh, q) {
  q = ((q % 4) + 4) % 4;
  if (!q || !t) return { t, bw, bh };
  let rows = t.rows, x = t.x, y = t.y, W = bw, H = bh;
  for (let k = 0; k < q; k++) {
    const h = rows.length, w = rows[0].length;
    rows = Array.from({ length: w }, (_, j) => Array.from({ length: h }, (_, i) => rows[h - 1 - i][j]).join(''));
    [x, y] = [H - (y + h), x]; [W, H] = [H, W];
  }
  return { t: { x, y, rows }, bw: W, bh: H };
}

const ROLE_ARM = { blouse: ['t', 't'], tee: ['t', 's'], suit: ['p', 'p'], coverall: ['t', 't'], bare: ['s', 's'], towelChest: ['s', 's'] };

/**
 * One frame of a look (outfits.js wear(), or a raw look), facing dir: { cells (rows of { ch, part, u, v, t }
 * or null), w, h, ax, ay (the anchor), kind (the cell), muzzle ([x, y] or null), flash ({ kind, th } or
 * null), look }.
 */
export function composeFrame(look, dir, frame, { ppm = PX_PER_M } = {}) {
  const Lk = look?.top ? look : wear(look);
  const B = bodyOf(ppm), pose = poseOf(frame, { weapon: Lk.weapon, carry: Lk.carry, tired: !!Lk.tired });
  const kind = cellKind(frame, dir), cell = B.cell[kind];
  const J = solve(pose, B), rig = rigOf(pose, J, B, Lk, dir);
  if (rig) for (const s of ['r', 'l']) if (rig.hand[s]) {
    const pole = norm([-0.3, (s === 'r' ? -1 : 1) * 0.7, -1].map((v, i) => (J.o ? orient(J.o, [-0.3, (s === 'r' ? -1 : 1) * 0.7, -1])[i] : v)));
    J.el[s] = ik(J.sh[s], rig.hand[s], B.upperArm, B.foreArm, pose.stance === 'prone' ? [0, 0, -1] : pole);
    J.wr[s] = add(J.el[s], mul(norm(sub(rig.hand[s], J.el[s])), Math.min(B.foreArm, len(sub(rig.hand[s], J.el[s])))));
  }
  const P = projector(dir, pose, B);
  // Drawn on a grid with a margin round the cell, so nothing is lost before the fit: a standing figure
  // keeps the cell's anchor (cropped to it); a lying one is fitted after (centred across, its lowest pixel
  // on the cell's ground), a floating one centred both ways after its tumble, its anchor then its pelvis.
  const M = kind === 'stand' ? 0 : Math.max(cell.w, cell.h);
  const ax = cell.ax + 0.5 + M, ay = cell.ay + M;
  const pp = (v) => { const q = P.p(v); return [ax + q[0], ay + q[1]]; };
  const g = grid(cell.w + 2 * M, cell.h + 2 * M), ops = [];
  const op = (depth, run) => ops.push({ depth, run, n: ops.length });
  const top = Lk.top?.kind ?? 'blouse', legsKind = Lk.legs?.kind ?? 'trousers';
  const T = B.thick;

  // Legs: thigh and shin one part, the boot its own (a dark line where the trouser meets it).
  for (const s of pose.noLegs ? [] : ['r', 'l']) {
    const hip = J.hip[s], knee = J.knee[s], ankle = J.ankle[s], ft = J.foot[s];
    const d = (P.depth(hip) + P.depth(knee) + P.depth(ankle)) / 3 - 0.04;
    op(d, () => {
      const a = pp(hip), k = pp(knee), b = pp(ankle);
      g.begin(a[0], a[1]);
      const legRole = legsKind === 'shorts' ? (kk) => (kk < 0.55 ? 'p' : 's') : legsKind === 'towel' ? (kk) => (kk < 0.7 ? 'p' : 's') : 'p';
      g.capsule(snap2(a, T.thigh), snap2(k, T.thigh), T.thigh / 2, legRole);
      const shinRole = legsKind === 'shorts' ? (kk) => (kk > 0.62 ? 'ŝ' : 's') : legsKind === 'towel' ? 's' : legsKind === 'coverall' ? (kk) => (kk > 0.35 && kk < 0.55 ? 'i' : 'p') : 'p';
      g.capsule(snap2(k, T.shin), snap2(b, T.shin), T.shin / 2, shinRole);
    });
    op(P.depth(ft.toe) / 2 + P.depth(ft.heel) / 2 - 0.035, () => {
      g.begin();
      box(g, pp, ft.heel, ft.toe, J.left, B.footW, B.footH, ft.dir, 'f');
    });
  }
  // The torso: slices along the spine, joined into a polygon; its details by where they lie on it.
  const torsoDepth = P.depth(lerp(J.pelvis, J.neckBase, 0.5));
  let torsoPart = 0;
  const torsoRole = top === 'suit' ? 'c' : 't';
  op(torsoDepth, () => {
    const pts = torsoOutline(J, P, pp);
    const nk = pp(J.neckBase);
    torsoPart = g.begin(nk[0], nk[1]);
    g.poly(pts, torsoRole);
    torsoDetails(g, torsoPart, Lk, J, P, pp, B, dir, pose);
  });
  // The towel: one wrap over the hips and both thighs to above the knees (a skirt of cloth, not two legs),
  // its rolled top edge a darker row; under a blanket (noLegs) only its top shows.
  if (legsKind === 'towel' && !pose.noLegs) op(torsoDepth + 0.004, () => towelWrap(g, J, P, pp, B));
  // The plate carrier (a slab over the chest, front and back) and its pouches; the vac suit's pack.
  if (Lk.armour) {
    op(torsoDepth + 0.005, () => carrier(g, Lk, J, P, pp, B, dir));
  }
  if (Lk.pack) {
    const back = add(lerp(J.pelvis, J.neckBase, 0.62), mul(J.chestF, -(B.chestDepth + B.chestDepth * 0.55)));
    op(P.depth(back), () => pack(g, Lk, J, P, pp, B, dir));
  }
  // Arms: upper arm, forearm and hand (gloved or bare), each arm one part.
  const [upperRole, foreRole] = ROLE_ARM[top] ?? ROLE_ARM.blouse;
  for (const s of ['r', 'l']) {
    const sh = J.sh[s], el = J.el[s], wr = J.wr[s];
    const handDir = norm(sub(wr, el)), tip = add(wr, mul(handDir, B.hand * 0.7));
    const d = Math.max(P.depth(el), (P.depth(sh) + P.depth(el) + P.depth(wr)) / 3) + 0.02;
    op(d, () => {
      const a = pp(sh), e = pp(el), w2 = pp(wr), h2 = pp(tip);
      g.begin(a[0], a[1]);
      const shell = top === 'suit' ? (k) => (k < 0.38 ? 'c' : upperRole) : Lk.brassard && s === 'l' ? (k) => (k > 0.12 && k < 0.8 ? 'i' : upperRole) : upperRole;
      g.capsule(snap2(a, T.arm), snap2(e, T.arm), T.arm / 2, shell);
      g.capsule(snap2(e, T.fore), snap2(w2, T.fore), T.fore / 2, (k) => (top === 'suit' && k > 0.82 ? 'ð' : foreRole));
      g.capsule(snap2(w2, T.hand), snap2(h2, T.hand), T.hand / 2, Lk.gloves ? 'd' : 's');
    });
  }
  // What the right hand holds at the sink: a toothbrush (its white handle, the bristles), a razor (steel).
  if (pose.held) {
    const el = J.el.r, wr = J.wr.r, dirH = norm(sub(wr, el)), tip = add(wr, mul(dirH, B.hand * 0.6));
    op(Math.max(P.depth(wr), P.depth(J.neckTop)) + 0.08, () => {
      const a = pp(tip), b = pp(add(tip, mul(dirH, pose.held === 'brush' ? 0.16 : 0.08)));
      g.begin();
      g.capsule(snap2(a, 1), snap2(b, 1), 0.55, pose.held === 'brush' ? 'w' : 'v');
      if (pose.held === 'brush') g.put(Math.floor(b[0]), Math.floor(b[1]), 'i');
    });
  }
  // The weapon (and a loose magazine, a sling, a holster).
  let muzzle = null, flash = null;
  if (rig) {
    const gd = rig.mode === 'slung' ? P.depth(rig.butt) : P.depth(add(rig.butt, mul(rig.dir, rig.lenM * 0.3))) - 0.012;
    op(gd, () => { const m = gunCells(g, rig, pp, P, B); muzzle = m.muzzle; flash = m.flash; });
    if (rig.loose) op(P.depth(rig.loose.at) + 0.03, () => looseMag(g, rig, pp, B));
    if (rig.strap) op(torsoDepth + 0.01, () => { const a = pp(rig.strap[0]), b = pp(rig.strap[1]); g.begin(); g.capsule(snap2(a, 1), snap2(b, 1), 0.5 + (B.ppm >= 20 ? 0.5 : 0), 'y'); });
  }
  // The head: the skull, the face painted on it, the hair, the hat; turned to lie with a lying body.
  op(P.depth(J.neckTop) + 0.05, () => head(g, Lk, J, P, pp, B, dir, pose));
  if (pose.straps) op(torsoDepth + 0.02, () => straps(g, J, pp, B));

  ops.sort((a, b) => a.depth - b.depth || a.n - b.n);
  for (const o of ops) o.run();
  let cells = g.cells;
  if (pose.roll) { const b = bbox(cells); cells = rotateCells(cells, pose.roll, (b.x0 + b.x1 + 1) / 2, (b.y0 + b.y1 + 1) / 2); muzzle = null; }
  let dx = M, dy = M;                                              // (where the cell's top-left is on the drawing grid)
  if (kind !== 'stand') {
    const b = bbox(cells);
    dx = Math.round((b.x0 + b.x1 + 1) / 2 - cell.w / 2);
    dy = kind === 'float' ? Math.round((b.y0 + b.y1 + 1) / 2 - cell.h / 2) : b.y1 + 1 - cell.ay;
  }
  const out = Array.from({ length: cell.h }, (_, y) => Array.from({ length: cell.w }, (_, x) => cells[y + dy]?.[x + dx] ?? null));
  if (muzzle) muzzle = [muzzle[0] - dx, muzzle[1] - dy];
  return { cells: out, w: cell.w, h: cell.h, ax: Math.floor(ax) - dx, ay: ay - dy, kind, muzzle, flash: muzzle ? flash : null, look: Lk, pose };
}

/** A boot: the box from heel to toe, footW wide and footH tall, projected corner by corner and filled. */
function box(g, pp, heel, toe, left, w, h, fdir, role) {
  const up = norm(cross(norm(sub(toe, heel)), left)), half = mul(left, w / 2), hi = mul(up, h);
  const corners = [];
  for (const base of [heel, toe]) for (const sx of [-1, 1]) for (const sy of [0, 1]) corners.push(pp(add(add(base, mul(half, sx)), mul(hi, sy))));
  g.poly(hull(corners), role);
}
/** The convex hull of 2-D points (gift wrapping: a handful of points). */
function hull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const crossz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const q of p) { while (lower.length >= 2 && crossz(lower.at(-2), lower.at(-1), q) <= 0) lower.pop(); lower.push(q); }
  for (const q of [...p].reverse()) { while (upper.length >= 2 && crossz(upper.at(-2), upper.at(-1), q) <= 0) upper.pop(); upper.push(q); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** The torso's outline: each slice's extent across the spine (as the picture shows the spine), left ends then right. */
function torsoOutline(J, P, pp) {
  const c0 = pp(J.slices[0].c), c1 = pp(J.slices.at(-1).c);
  let sx = c1[0] - c0[0], sy = c1[1] - c0[1];
  const sl = Math.hypot(sx, sy) || 1; sx /= sl; sy /= sl;
  const n = [-sy, sx];                                            // (across the spine, in the picture)
  const pr = (v) => { const a = P.p([0, 0, 0]), b = P.p(v); return [b[0] - a[0], b[1] - a[1]]; };
  const lat = pr(J.left), dep = pr(J.chestF);
  const L = [], R = [];
  for (const s of J.slices) {
    const c = pp(s.c);
    const ext = Math.hypot((lat[0] * n[0] + lat[1] * n[1]) * s.w, (dep[0] * n[0] + dep[1] * n[1]) * s.d);
    L.push([c[0] - n[0] * ext, c[1] - n[1] * ext]); R.push([c[0] + n[0] * ext, c[1] + n[1] * ext]);
  }
  // (snapped to whole pixels: a clean edge)
  return [...L, ...R.reverse()].map(([x, y]) => [Math.round(x), Math.round(y)]);
}

/** Which side of the torso the camera sees: 'front', 'back' or 'side'. */
function torsoView(J, P) {
  const a = P.depth([0, 0, 0]), f = P.depth(J.chestF) - a - 0.3 * J.chestF[2], u = J.chestF[2];
  if (u > 0.6) return 'front';                                    // (lying on the back: the front is up, to the camera)
  if (u < -0.6) return 'back';
  return f > 0.5 ? 'front' : f < -0.5 ? 'back' : 'side';
}

/**
 * Details on the torso, by where a pixel lies on it: t along the spine (pixels from the hips) and s across
 * (pixels from the spine, the picture's right positive). The belt, a collar, a placket, rank pins, the
 * suit's waist ring and chest display, a miner's reflective bands and dosimeter, the PT shirt's emblem.
 */
function torsoDetails(g, part, Lk, J, P, pp, B, dir, pose) {
  const h0 = pp(J.slices[0].c), h1 = pp(J.slices.at(-1).c);
  let sx = h1[0] - h0[0], sy = h1[1] - h0[1];
  const H = Math.hypot(sx, sy) || 1; sx /= H; sy /= H;
  const view = torsoView(J, P), top = Lk.top?.kind;
  // (the body's right on the picture: + when the picture's right is the body's right)
  const pr = (v) => { const a = P.p([0, 0, 0]), b = P.p(v); return [b[0] - a[0], b[1] - a[1]]; };
  const lat = pr(J.left), rightSign = -Math.sign(lat[0] * -sy + lat[1] * sx) || 1;
  const px = B.ppm >= 20 ? 1.5 : 1;
  const waistT = H * ((B.crotch - B.hipJoint + 0.02) / (B.shoulderTop - B.hipJoint) + 0.18);
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const c = g.cells[y][x];
    if (!c || c.part !== part) continue;
    const vx = x + 0.5 - h0[0], vy = y + 0.5 - h0[1], t = vx * sx + vy * sy, s = -(vx * -sy + vy * sx);
    const fromTop = H - t, abs = Math.abs(s), bodyRight = s * rightSign > 0;
    let ch = null;
    // (below the waist, the shorts or the suit's skin: a T-shirt and the suit's hard shell stop there)
    if ((top === 'tee' || top === 'suit' || top === 'bare') && t < waistT) ch = 'p';
    // (a towel at the chest: bare shoulders above it, its tucked edge a darker row)
    if (top === 'towelChest') { if (fromTop < H * 0.2) ch = 's'; else if (fromTop < H * 0.2 + px) ch = 'T'; else if (t < waistT) ch = 'p'; }
    // (the belt, all round; its buckle in front)
    if (Lk.belt && top !== 'tee' && Math.abs(t - waistT) < px * 0.75 + 0.01) ch = view === 'front' && abs < px * 1.2 ? 'g' : 'y';
    if (top === 'suit' && Math.abs(t - waistT) < px * 0.6) ch = 'ð';
    if (view === 'front') {
      if ((top === 'blouse' || top === 'tee') && fromTop < px * 1.6 && abs < px * (top === 'tee' ? 1.6 : 1.1)) ch = 's';   // (the open collar, the tee's neck)
      if (top === 'blouse' && fromTop >= px * 1.6 && t > waistT + px && abs < 0.5) ch = 'T';                              // (the placket)
      if (Lk.rank && fromTop < px * 1.5 && abs > px * 1.6 && abs < px * 3.2) ch = abs < px * 2.4 ? 'k' : 'm';               // (rank pins on the collar points)
      if (top === 'suit' && Math.abs(fromTop - H * 0.36) < px * 0.6 && s * rightSign < 0 && abs > px * 0.6 && abs < px * 2.6) ch = abs < px * 1.6 ? '°' : '¦';   // (the chest display, the wearer's left)
      if (top === 'tee' && Lk.top.emblem && Math.abs(fromTop - H * 0.3) < px * 0.6 && s * rightSign < 0 && abs > px * 1.4 && abs < px * 2.8) ch = 'g';
      if (top === 'coverall') {
        if (Math.abs(fromTop - H * 0.45) < px * 0.6) ch = 'i';
        if (Math.abs(fromTop - H * 0.25) < px * 0.55 && s * rightSign < 0 && abs > px * 1.2 && abs < px * 2.4) ch = '°';   // (the dosimeter)
        if (abs < 0.5 && fromTop > px * 1.5) ch = ch ?? 'T';                                                              // (the zip)
      }
    } else if (view === 'back') {
      if (top === 'coverall' && Math.abs(fromTop - H * 0.45) < px * 0.6) ch = 'i';
      if (top === 'blouse' && abs < 0.5 && t > waistT + px) ch = 'T';                                                       // (the back seam)
    } else {
      if (top === 'coverall' && Math.abs(fromTop - H * 0.45) < px * 0.6) ch = 'i';
      if ((top === 'blouse' || top === 'tee') && fromTop < px * 1.2 && bodyRight === (dir === 'right')) ch = null;
    }
    if (ch) { c.ch = ch; c.t = null; }
  }
  // (the suit's shoulders carry the Corps' red band: the top of the shell)
  if (top === 'suit') for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const c = g.cells[y][x];
    if (!c || c.part !== part) continue;
    const t = (x + 0.5 - h0[0]) * sx + (y + 0.5 - h0[1]) * sy;
    if (H - t < px * 1.05 && view !== 'side') c.ch = 'i';
  }
  void pose;
}

/** The towel wrapped at the waist: one polygon over the hips and both thighs to above the knees, its rolled top a darker row. */
function towelWrap(g, J, P, pp, B) {
  const pts = [];
  const across = mul(J.left, B.hipHalf + 0.6 / B.ppm), deep = mul(J.chestF, B.waistDepth + 0.4 / B.ppm);
  const waist = lerp(J.pelvis, J.neckBase, 0.12);
  for (const sx of [-1, 1]) for (const sd of [-1, 1]) pts.push(pp(add(add(waist, mul(across, sx)), mul(deep, sd))));
  for (const s of ['r', 'l']) {
    const k = lerp(J.hip[s], J.knee[s], 0.72), th = B.thighThick / 2 + 0.5 / B.ppm;
    for (const sx of [-1, 1]) for (const sd of [-1, 1]) pts.push(pp(add(add(k, mul(J.left, sx * th)), mul(J.chestF, sd * th))));
  }
  const hulled = hull(pts).map(([x, y]) => [Math.round(x), Math.round(y)]);
  const id = g.begin(...pp(waist));
  g.poly(hulled, 'p');
  const top = Math.min(...hulled.map(p => p[1]));
  for (let x = Math.min(...hulled.map(p => p[0])); x <= Math.max(...hulled.map(p => p[0])); x++) g.on(id, x, top, 'P');
}

/** The plate carrier: a slab over the chest from the collarbones to above the belt, a pixel proud; three pouches across the belly in front; the back plate's drag handle behind. */
function carrier(g, Lk, J, P, pp, B, dir) {
  const view = torsoView(J, P);
  const lo = 0.34, hi = 0.94, pad = 1.2 / B.ppm;
  // (the slab's outline from the torso's own slices, a pixel wider and deeper)
  const fake = {
    ...J, slices: J.slices.map(s => ({ ...s, w: s.w + pad, d: s.d + pad })).filter((s, i, a) => {
      const t = i / (a.length - 1); return t >= lo - 0.3 && t <= hi;
    }),
  };
  const torsoH = B.shoulderTop - B.hipJoint;
  fake.slices = [
    { c: lerp(J.pelvis, J.neckBase, lo), w: B.waistHalf + pad, d: B.waistDepth + pad },
    { c: lerp(J.pelvis, J.neckBase, 0.72), w: B.chestHalf + pad, d: B.chestDepth + pad },
    { c: lerp(J.pelvis, J.neckBase, hi), w: B.chestHalf - 1 / B.ppm, d: B.chestDepth + pad },
  ];
  const nk = pp(J.neckBase);
  const slab = g.begin(nk[0], nk[1]);
  g.poly(torsoOutline(fake, P, pp), 'ø');
  void torsoH;
  if (view === 'front') {
    // (three pouches across the belly: a band of webbing with their flaps parted)
    const a = pp(lerp(J.pelvis, J.neckBase, lo + 0.04)), b = pp(lerp(J.pelvis, J.neckBase, lo + 0.27));
    const w = Math.round((B.waistHalf + pad) * B.ppm), y0 = Math.round(b[1]), y1 = Math.round(a[1]);
    g.begin();
    for (let y = y0; y < y1; y++) for (let x = Math.round(a[0]) - w; x < Math.round(a[0]) + w + 1; x++) {
      const c = g.cells[y]?.[x];
      if (!c || c.part !== slab) continue;
      const k = (x - (Math.round(a[0]) - w)) / (2 * w + 1);
      const gap = Math.abs(k - 1 / 3) < 0.5 / (2 * w + 1) + 0.01 || Math.abs(k - 2 / 3) < 0.5 / (2 * w + 1) + 0.01;
      g.put(x, y, gap ? 'Æ' : y === y0 ? 'æ' : 'æ');
    }
  } else if (view === 'back') {
    const h = pp(lerp(J.pelvis, J.neckBase, hi - 0.06));
    g.begin();
    for (let k = -1; k <= 1; k++) g.put(Math.round(h[0]) + k - 0.5 + 0.5, Math.round(h[1]), 'æ');
  } else {
    // (side on: the pouches stand out in front of the slab)
    const a = pp(add(lerp(J.pelvis, J.neckBase, lo + 0.12), mul(J.chestF, B.waistDepth + pad * 1.6)));
    g.begin();
    const s = Math.max(1, Math.round(B.ppm / 12));
    for (let j = -s; j <= s; j++) g.put(a[0], a[1] + j, 'æ');
  }
  void Lk; void dir;
}

/** The vac suit's life-support pack: a box on the back (seen from behind it covers the back; side on it stands proud); open, the helmet clipped to it. */
function pack(g, Lk, J, P, pp, B, dir) {
  const back = mul(J.chestF, -1), up = J.spine, left = J.left;
  const hw = B.chestHalf * 0.85, d = B.chestDepth * 1.2, lo = 0.35, hi = 1.04;
  const base = add(lerp(J.pelvis, J.neckBase, lo), mul(back, B.waistDepth * 0.7));
  const topc = add(lerp(J.pelvis, J.neckBase, hi), mul(back, B.chestDepth * 0.7));
  const corners = [];
  for (const c of [base, topc]) for (const sx of [-1, 1]) for (const sd of [0, 1]) corners.push(pp(add(add(c, mul(left, hw * sx)), mul(back, d * sd))));
  const nk = pp(J.neckBase);
  const id = g.begin(nk[0], nk[1]);
  g.poly(hull(corners), 'j');
  // (its vents, two dark rows, seen from behind)
  if (torsoView(J, P) === 'front') { /* hidden */ }
  else {
    const m = pp(lerp(base, topc, 0.3));
    for (let k = -2; k <= 2; k++) g.on(id, m[0] + k, m[1], 'J');
  }
  if (Lk.pack?.helmet) {
    // (the helmet off, clipped to the pack's right side: a dome, its visor up)
    const at = add(add(lerp(base, topc, 0.3), mul(left, -hw * 0.95)), mul(back, d * 0.6));
    const c = pp(at), r = Math.max(2.5, B.headH * 0.24 * B.ppm);
    g.begin(c[0], c[1]);
    for (let y = Math.floor(c[1] - r); y <= Math.ceil(c[1] + r); y++) for (let x = Math.floor(c[0] - r); x <= Math.ceil(c[0] + r); x++) {
      const dx = x + 0.5 - c[0], dy = y + 0.5 - c[1];
      if (dx * dx + dy * dy < r * r) g.put(x, y, dy > r * 0.35 ? 'þ' : 'c');
    }
  }
  void dir; void up;
}

/** A crash couch's harness: a strap over each shoulder to the waist, and one across the thighs. */
function straps(g, J, pp, B) {
  const w = B.ppm >= 20 ? 1 : 0.5;
  g.begin();
  for (const s of ['r', 'l']) {
    const a = pp(add(J.sh[s], mul(J.left, (s === 'r' ? 1 : -1) * B.armOut * 0.35))), b = pp(lerp(J.pelvis, J.neckBase, 0.32));
    g.capsule(snap2(a, 1), snap2(b, 1), 0.5 + w * 0.5, 'y');
  }
  const k = pp(lerp(J.knee.r, J.hip.r, 0.45)), k2 = pp(lerp(J.knee.l, J.hip.l, 0.45));
  g.capsule(snap2(k, 1), snap2(k2, 1), 0.5 + w * 0.5, 'y');
  const b = pp(lerp(J.pelvis, J.neckBase, 0.32));
  g.put(b[0], b[1], 'g');
}

/** The cuts whose top a cover hides (0.0.6: the men's four and a woman's short; a bun or a braid shows below it). */
const CROPPED = new Set(['highTight', 'lowReg', 'medReg', 'shaved', 'short']);
/** The short sides' letter by the cut's step: skin, a shadow, a dark, the hair's colour (outfits.js coloursOf). */
const SIDE_ROLE = Object.freeze(['s', 'ĥ', 'ħ', 'h']);
/** The head and what's on it, as templates centred on the neck (side on, a little forward of it). */
function head(g, Lk, J, P, pp, B, dir, pose) {
  // (which view of the head, and a quarter turn: lying on the back, the face to the sky; elsewhere upright)
  let view = dir, q = 0;
  if (pose.stance === 'supine') {
    view = 'down';
    q = dir === 'down' ? 0 : dir === 'up' ? 2 : dir === 'right' ? -1 : 1;
  } else if (pose.stance === 'prone') view = dir;
  else if (pose.head === 'turn') view = HEAD_TURN[dir];
  else if (pose.head === 'glance' && dir !== 'down') view = GLANCE[dir];
  const kit = headKit(B.head.w, B.head.sideW, B.head.h);
  const K = kit[view];
  const [bw, bh] = K.box;
  const nk = pp(J.neckTop);
  // (the head's middle lies from the neck along the crown, as the picture shows the crown: over the neck
  // standing, beyond the shoulders lying; side on, a little forward of it: tradecraft's profile overhangs the chest)
  const fwd = view === 'right' ? 1 : view === 'left' ? -1 : 0;
  const T = (t) => quarter(t, bw, bh, q);
  const box = T(K.head), W = box.bw, H = box.bh;
  // (prone, the head is held up to look along the sights: its crown halfway between forward and up)
  const crownV = pose.stance === 'prone' ? norm(add(J.up, mul(UP, 1.3))) : J.up;
  const o = P.p([0, 0, 0]), cu = P.p(crownV), cl = Math.hypot(cu[0] - o[0], cu[1] - o[1]) || 1;
  const crown = [(cu[0] - o[0]) / cl, (cu[1] - o[1]) / cl], ext = Math.abs(crown[0]) * W + Math.abs(crown[1]) * H;
  const x0 = Math.round(nk[0] + crown[0] * ext / 2 - W / 2 + fwd * bw * 0.06), y0 = Math.round(nk[1] + crown[1] * ext / 2 - H / 2) + (pose.headDrop ?? 0);
  const head = g.begin(x0, y0);
  g.tpl(box.t, x0, y0);
  const hat = Lk.head?.kind, sealed = hat === 'vac';
  // (the face, painted on the head: the same part; behind a sealed visor, no face; a glance from the
  // front moves the eyes a pixel to the body's right, the picture's left)
  if (!sealed) {
    const f = T(pose.eyes === 'shut' ? K.shut : K.face).t, sx = pose.head === 'glance' && view === 'down' ? -1 : 0;
    if (f) f.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') g.on(head, x0 + f.x + i + sx, y0 + f.y + j, ch); }));
  }
  const style = K.hair[Lk.hair?.style] !== undefined ? Lk.hair.style : 'lowReg', step = Lk.hair?.step ?? 0, cropped = CROPPED.has(style);
  const covering = hat && hat !== 'ring';
  if (!sealed) {
    // (the short sides, painted on the head's own skin by the cut's step: a shadow, a dark, the hair's colour; under
    // a cover they show where it leaves the head bare, and the face's brows, eyes and ear are never painted over)
    const sd = K.sides[style] ? T(K.sides[style]).t : null;
    if (sd && step > 0) sd.rows.forEach((row, j) => [...row].forEach((ch, i) => {
      if (ch === '.') return;
      const c = g.cells[y0 + sd.y + j]?.[x0 + sd.x + i];
      if (c && c.part === head && c.ch === 's') g.on(head, x0 + sd.x + i, y0 + sd.y + j, SIDE_ROLE[step]);
    }));
    const top = K.hair[style] ? T(K.hair[style]).t : null;
    const drawTop = () => {
      if (!top) return;
      g.begin(x0, y0);
      g.tpl(top, x0, y0);
      if (step >= 3) g.tpl(top, x0, y0 - 1);                       // (out of regulation: the top a pixel taller)
      const gr = K.grow[style];
      if (gr) for (let k = 0; k < Math.min(step, gr.length); k++) g.tpl(T(gr[k]).t, x0, y0);
      if (step >= 3 && K.stray[style]) g.tpl(T(K.stray[style]).t, x0, y0);
    };
    if (!covering) drawTop();
    // (under a hat, pinned-up hair shows below it; a woman's short cut only at the temples or the nape (tradecraft, the
    // user 2026-11-03); a man's top lies flat under the cover, painted on the head where it reaches below it, behind and
    // side on, and never stands over the cover's edge)
    else if (!cropped) drawTop();
    else if (style === 'short' && view !== 'up') { g.begin(x0, y0); g.tpl(T(K.temples).t, x0, y0); }
    else if (style === 'short') { g.begin(x0, y0); g.tpl(T(K.nape).t, x0, y0); }
    else if (top) top.rows.forEach((row, j) => [...row].forEach((ch, i) => {
      const c = g.cells[y0 + top.y + j]?.[x0 + top.x + i];
      if (ch !== '.' && c && c.part === head && /^[sĥħ]$/.test(c.ch)) g.on(head, x0 + top.x + i, y0 + top.y + j, 'h');
    }));
  }
  if (covering) { const t = T(K.hat[hat]).t; g.begin(x0, y0); g.tpl(t, x0, y0); }
  if ((Lk.ears || Lk.headset) && !sealed && pose.stance !== 'supine') earCups(g, Lk, view, x0, y0, W, H, B);
  // (foam: white at the mouth round the brush, or along the jaw for a shave: on the head's own lowest skin pixels)
  if (pose.foam && !sealed && view !== 'up') {
    const skin = [];
    box.t.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 's') skin.push([x0 + box.t.x + i, y0 + box.t.y + j]); }));
    const low = Math.max(...skin.map(p => p[1])), mid = (Math.min(...skin.map(p => p[0])) + Math.max(...skin.map(p => p[0]))) / 2;
    const fwdX = view === 'right' ? 1 : view === 'left' ? -1 : 0, mouthY = low - Math.max(1, Math.round(H * 0.22));
    for (const [x, y] of skin) {
      const jaw = pose.foam === 'jaw' && y >= low - 1 && (fwdX === 0 || (x - mid) * fwdX >= 0);
      const mouth = pose.foam === 'mouth' && Math.abs(y - mouthY) <= 0 && Math.abs(x - (mid + fwdX * W * 0.3)) <= 1;
      if (jaw || mouth) g.on(head, x, y, 'w');
    }
  }
  // (wet hair: a sheen on the crown, two pixels of the lens' glint toward the light, the upper left)
  if (Lk.wet && !covering && !sealed && style !== 'shaved') {
    const hp = g.part, t = T(K.hair[style]).t, pts = [];
    t.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'h' && pts.length < 64) pts.push([x0 + t.x + i, y0 + t.y + j]); }));
    const top = Math.min(...pts.map(p => p[1])), row1 = pts.filter(p => p[1] <= top + 1).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const mid = row1[Math.floor(row1.length * 0.3)];
    if (mid) { g.on(hp, mid[0], mid[1] + 1, 'l'); g.on(hp, mid[0] + 1, mid[1] + 1, 'l'); if (B.ppm >= 20) g.on(hp, mid[0] + 2, mid[1] + 2, 'l'); }
  }
  // (a wet shaved head: the same glint on the scalp, on the head's own top pixels, so the shower shows
  // on a shaved head too: moment 3 asks for the wet head)
  if (Lk.wet && !covering && !sealed && style === 'shaved') {
    const skin = [];
    box.t.rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 's') skin.push([x0 + box.t.x + i, y0 + box.t.y + j]); }));
    if (skin.length) {
      const top = Math.min(...skin.map(p => p[1])), row1 = skin.filter(p => p[1] <= top + 1).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const mid = row1[Math.floor(row1.length * 0.3)];
      if (mid) { g.on(head, mid[0], mid[1] + 1, 'w'); g.on(head, mid[0] + 1, mid[1] + 1, 'w'); if (B.ppm >= 20) g.on(head, mid[0] + 2, mid[1] + 2, 'w'); }
    }
  }
  if (hat === 'ring') {
    // (the helmet off: the suit's neck ring round the collar)
    const w = Math.round((B.shoulderHalf * 0.75) * B.ppm), y = Math.round(nk[1]);
    g.begin();
    for (let x = Math.round(nk[0]) - w; x <= Math.round(nk[0]) + w; x++) { g.put(x, y, 'ð'); if (B.ppm >= 20) g.put(x, y + 1, 'Ð'); }
  }
}

/**
 * Ear defenders (0.0.5: the 25 m line's), drab cups at the ears on a dark band over the crown and the
 * cover; a headset (the range officer's) is one cup, at the left ear, and a boom to the mouth. Side on,
 * the near cup over the ear, the band up over the head; from the front or behind, a cup each side.
 */
function earCups(g, Lk, view, x0, y0, W, H, B) {
  const u = Math.max(1, Math.round(B.ppm / 16)), cw = 2 * u, ch = 3 * u + 1, ey = y0 + Math.round(H * 0.52);
  const cup = (cx) => { g.begin(); for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) g.put(cx + i, ey + j, Lk.headset && !Lk.ears ? 'u' : 'æ'); };
  const band = (x) => { g.begin(); for (let y = y0 - u; y < ey; y++) for (let i = 0; i < u; i++) g.put(x + i, y, 'u'); };
  if (view === 'right' || view === 'left') {
    const cx = view === 'right' ? x0 + Math.round(W * 0.24) : x0 + W - Math.round(W * 0.24) - cw;
    // (a headset is at the left ear: seen from the right it is the far one, behind the head; only its boom shows)
    if (Lk.ears || view === 'left') { band(cx + (view === 'left' ? 0 : cw - u)); cup(cx); }
    if (Lk.headset) {
      // (the boom: from the near cup to the mouth seen from the left; from the right only its tip shows at the mouth)
      g.begin();
      if (view === 'left') for (let i = 0; i < Math.round(W * 0.3); i++) g.put(cx - 1 - i, ey + ch - 1 + Math.floor(i / 3), 'n');
      else for (let i = 0; i < 2 * u; i++) g.put(x0 + Math.round(W * 0.66) + i, ey + ch, 'n');
    }
    return;
  }
  const left = view === 'down' ? x0 + W - 1 : x0 - cw + 1, right = view === 'down' ? x0 - cw + 1 : x0 + W - 1;
  for (let x = x0; x < x0 + W; x++) for (let i = 0; i < u; i++) { g.begin(); g.put(x, y0 - u + i, 'u'); }
  if (Lk.ears) { cup(left); cup(right); } else { cup(left); if (view === 'down') { g.begin(); for (let i = 0; i < Math.round(W * 0.35); i++) g.put(left - i, ey + ch, 'n'); } }
}

/** The gun's cells: its shape turned along its line as the picture shows it, or seen end on, its muzzle a ring. */
function gunCells(g, rig, pp, P, B) {
  const a = pp(rig.butt), m = pp(rig.muzzle), lenPx = rig.lenM * B.ppm;
  let dx = m[0] - a[0], dy = m[1] - a[1];
  const seen = Math.hypot(dx, dy), ratio = seen / lenPx;
  const nearer = P.depth(rig.muzzle) > P.depth(rig.butt);
  // (seen end on when it points along the camera's depth, toward it or away, however long the picture draws it)
  const along = Math.abs(P.world(rig.dir)[2]), atYou = nearer && (ratio < 0.5 || along > 0.8);
  const kA = B.ppm / 16;
  g.begin(a[0], a[1]);
  if (rig.holster) {
    // (a holstered pistol: a dark grip at the hip, the holster down the thigh)
    const d2 = pp(add(rig.butt, mul(rig.dir, rig.lenM * 0.8)));
    g.capsule(snap2(a, 2), snap2(d2, 2), 1, 'n');
    return { muzzle: null, flash: null };
  }
  if (atYou) {
    // (at you: a ring of steel round the black bore before the chest, as tradecraft drew it (a long gun's
    // at the right cheek), the gun's body dark behind it toward the butt; the camera would drop it lower)
    const k = rig.gun === 'rifle' ? 0.32 : 0.6;
    const cx = Math.round(a[0] + dx * k - 0.5), cy = Math.round(a[1] + dy * k - 0.5), r = Math.max(1, Math.round(kA));
    dx *= k; dy *= k;
    const ux = dx / (seen || 1), uy = dy / (seen || 1);
    for (let j = 1; j <= Math.max(2, Math.round(Math.hypot(dx, dy))); j++) g.put(cx - ux * j, cy - uy * j, 'n');
    if (rig.gun === 'rifle' && rig.withMag) { const d = pp(add(rig.magwell, mul(rig.down, rig.lenM * 0.08))); g.put(d[0], d[1], 'u'); g.put(d[0], d[1] + 1, 'u'); }
    for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) g.put(cx + i, cy + j, i === 0 && j === 0 ? 'k' : Math.abs(i) + Math.abs(j) > r ? 'n' : 'v');
    return { muzzle: [cx, cy], flash: { kind: 'front', th: 0 } };
  }
  // (along its line: the shape turned about the butt, flipped so its magazine hangs the way the gun's down points)
  const th = Math.atan2(dy, dx), dn = sub(pp(add(rig.butt, mul(rig.down, 0.1))), a);
  const flip = (-Math.sin(th) * dn[0] + Math.cos(th) * dn[1]) < 0;
  const shape = shapeAt(rig.gun, Math.max(3, seen), kA, rig.withMag);
  for (const [x, y, ch] of turned(shape, Math.floor(a[0]), Math.floor(a[1]), th, flip)) g.put(x, y, ch);
  return { muzzle: [Math.round(m[0] - 0.5), Math.round(m[1] - 0.5)], flash: { kind: ratio > 0.65 ? 'side' : nearer ? 'front' : 'back', th } };
}

/** A magazine out of the well, in the left hand: as long as the one in the well shows, a pixel wide at 16 px/m and two at 24 (0.0.6: slimmer, the user's 2026-11-07). */
function looseMag(g, rig, pp, B) {
  const a = pp(rig.loose.at), b = pp(add(rig.loose.at, mul(rig.loose.dir, B.magM * 0.75)));
  g.begin();
  const th = B.ppm >= 20 ? 2 : 1;
  g.capsule(snap2(a, th), snap2(b, th), th / 2, 'u');
}

// ---------- 5. a tumble: the grid turned in the picture ----------

/** The rows and columns a grid's drawing covers. */
function bbox(cells) {
  let x0 = Infinity, x1 = -1, y0 = Infinity, y1 = -1;
  cells.forEach((row, y) => row.forEach((c, x) => { if (c) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }));
  return x1 < 0 ? { x0: 0, x1: 0, y0: 0, y1: 0 } : { x0, x1, y0, y1 };
}

function rotateCells(cells, rad, cx, cy) {
  const h = cells.length, w = cells[0].length, out = Array.from({ length: h }, () => Array(w).fill(null));
  const c = Math.cos(rad), s = Math.sin(rad);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
    const sx = Math.floor(cx + dx * c + dy * s), sy = Math.floor(cy - dx * s + dy * c);
    const src = cells[sy]?.[sx];
    if (src) out[y][x] = { ...src };
  }
  return out;
}
