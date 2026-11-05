// OLYMPUS render: the camera. Orthographic, looking north, 45° down, snapped to the pixel grid.
//
// tradecraft's camera (src/art/pixelart.js), the angle the user scored 95/100 (2026-10-25): it looks
// straight north (along −z) and 45° down. A metre of ground (z) and a metre of wall (y) both project
// to sin 45° camera units vertically, so the camera's vertical span is H / PX_PER_M · sin 45° for both
// to come out PX_PER_M pixels: tiles and fronts are square on screen, as a 2D game draws them, from a
// real 3D camera (an oblique, cabinet-like projection). On screen a point at height y and depth z sits
// where the ground at z − y does.
//
// look(x, z) puts the picture's centre on the ground at (x, z), snapped to 1/PX_PER_M m in both, so
// the picture moves a whole pixel at a time and nothing shimmers (with the picture's sides even, its
// pixel edges then fall on the metre grid the boxes are built on: src/render/batch-math.js).
//
// The eye-lead hook: the game says where the eyes go (setLead(dx, dz), metres off the focus: tradecraft
// leaned the camera walking and, more, looking, more north–south where the picture is shorter: the
// user, tradecraft v0.0.39, "targets up and down are out of the field of view"); follow(x, z, dtS)
// eases the lean there (LEAD_S) and looks at the focus plus the lean.
import * as THREE from 'three';
import { PX_PER_M, S45 } from './scale.js';

/** How far the camera stands back along its line, metres (any distance: it's orthographic). */
export const CAMERA_BACK_M = 60;
/** How quickly the lean reaches where the eyes go, seconds (tradecraft's LEAD_S). */
export const LEAD_S = 0.35;

export function createCamera(W, H, { ppm = PX_PER_M, near = 1, far = 200 } = {}) {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, near, far);
  let w = W, h = H;
  const at = { x: 0, z: 0, y: 0 }, lead = [0, 0], want = [0, 0];
  function resize(W2, H2) {
    w = W2; h = H2;
    Object.assign(camera, { left: -w / ppm / 2, right: w / ppm / 2, top: h / ppm * S45 / 2, bottom: -h / ppm * S45 / 2 });
    camera.updateProjectionMatrix();
  }
  resize(W, H);
  /** Centre the picture on the ground at (x, z) (y: a floor's height), snapped to the pixel grid. Returns the snapped spot. */
  function look(x, z, y = 0) {
    at.x = Math.round(x * ppm) / ppm; at.z = Math.round(z * ppm) / ppm; at.y = Math.round(y * ppm) / ppm;
    camera.position.set(at.x, at.y + CAMERA_BACK_M * S45, at.z + CAMERA_BACK_M * S45);
    camera.lookAt(at.x, at.y, at.z);
    camera.updateMatrixWorld();
    return at;
  }
  look(0, 0);
  /** The eye-lead hook: where the eyes go, metres off the focus (eased toward by follow()). */
  function setLead(dx, dz) { want[0] = dx; want[1] = dz; }
  /** Follow a focus at (x, z): the lean eased toward the eyes' (dtS: seconds since the last frame), then look(). */
  function follow(x, z, dtS = 1 / 60, y = 0) {
    const k = 1 - Math.exp(-Math.max(0, dtS) / LEAD_S);
    lead[0] += (want[0] - lead[0]) * k; lead[1] += (want[1] - lead[1]) * k;
    return look(x + lead[0], z + lead[1], y);
  }
  const v = new THREE.Vector3();
  /** Where world (x, y, z) falls in the picture, pixels from its top-left. */
  function project(x, y, z) {
    v.set(x, y, z).project(camera);
    return [(v.x + 1) / 2 * w, (1 - v.y) / 2 * h];
  }
  /** The ground (at height y) under picture pixel (px, py): [x, z]. */
  function ground(px, py, y = 0) {
    const gx = at.x + (px - w / 2) / ppm, gz = at.z + (py - h / 2) / ppm + (y - at.y);
    return [gx, gz];
  }
  return { camera, resize, look, follow, setLead, project, ground, get at() { return at; }, get lead() { return lead; }, get viewM() { return [w / ppm, h / ppm]; } };
}
