// OLYMPUS render: the batching maths. Boxes and flat pieces in, one set of vertex arrays out.
//
// An area's walls, floors and furniture are boxes (tradecraft's method: "flat things are painted,
// things that stand out are boxes", every box edge on whole pixels). tradecraft drew each box as its
// own mesh with a material a face: up to six draw calls a box, and its ID pass doubled them (821 a
// frame in the furnished flat). Here an area's boxes become quads in one buffer: each vertex carries
// its position and normal, its texel position within its face (aTexel, in pixels), its face's atlas
// region (aRegion: x, y, w, h in texels; the shader wraps the texel inside it, so a tile repeats and a
// face painted to its size maps one texel to one screen pixel), a colour multiplier (flat faces read
// the atlas's white texel and carry their colour here, linear), its part ID (outlines) and its glow
// class. One material, one draw call per atlas page.
//
// The grid: box edges snap to 1/ppm metres (snapBox): the west, north and bottom edges round to whole
// pixels and the sizes round to whole pixels, so neighbours that meet still meet. With the camera on
// the same grid (src/render/camera.js) every face's texels land on screen pixels: the front face (+z)
// spans its width × height in pixels, the top its width × depth (a metre of ground is ppm pixels on
// screen as a metre of wall is).
//
// Faces are oriented as seen from outside, their texel (0, 0) at the corner that shows top-left:
// front (+z) from its top-left, top (+y) from its north-west corner (row 0 the far edge, as the screen
// shows it), and so on round. Every face is emitted (the camera sees only tops and fronts, the sides
// edge-on, but the sun's shadow map draws back faces and needs the box closed), except those a spec
// leaves out. A face can be "anchored" to the world (repeating tiles): its texel position is the
// world's, x · ppm across and z · ppm (tops) or −y · ppm (fronts) down, so tiles run on unbroken
// from one quad to the next.
// Pure.

/** Faces in BoxGeometry's order: +x, −x, +y, −y, +z, −z. */
export const FACES = Object.freeze(['right', 'left', 'top', 'bottom', 'front', 'back']);
export const NORMALS = Object.freeze([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
/** Floats a vertex carries per attribute. */
export const LAYOUT = Object.freeze({ position: 3, normal: 3, aTexel: 2, aRegion: 4, color: 3, aPart: 1, aGlow: 1 });

/**
 * A box snapped to the pixel grid at ppm. The spec is either a footprint centre and sizes
 * ({ x, z, y = 0, w, d, h }: x and z the centre, y the bottom, metres) or corners ({ x0, x1, y0, y1,
 * z0, z1 }). Returns corners in metres and sizes in pixels (each at least 1).
 */
export function snapBox(s, ppm) {
  let wPx, hPx, dPx, ix0, iy0, iz0;
  if (s.x0 !== undefined) {
    ix0 = Math.round(s.x0 * ppm); iy0 = Math.round((s.y0 ?? 0) * ppm); iz0 = Math.round(s.z0 * ppm);
    wPx = Math.max(1, Math.round(s.x1 * ppm) - ix0); hPx = Math.max(1, Math.round(s.y1 * ppm) - iy0); dPx = Math.max(1, Math.round(s.z1 * ppm) - iz0);
  } else {
    wPx = Math.max(1, Math.round(s.w * ppm)); hPx = Math.max(1, Math.round(s.h * ppm)); dPx = Math.max(1, Math.round(s.d * ppm));
    ix0 = Math.round(s.x * ppm - wPx / 2); iy0 = Math.round((s.y ?? 0) * ppm); iz0 = Math.round(s.z * ppm - dPx / 2);
  }
  return { x0: ix0 / ppm, x1: (ix0 + wPx) / ppm, y0: iy0 / ppm, y1: (iy0 + hPx) / ppm, z0: iz0 / ppm, z1: (iz0 + dPx) / ppm, wPx, hPx, dPx, ix0, iy0, iz0 };
}

/** A face's size in texels [columns, rows] as it is painted (front: w × h; top: w × d; sides: d × h). */
export function faceTexels(face, b) {
  switch (face) {
    case 'front': case 'back': return [b.wPx, b.hPx];
    case 'top': case 'bottom': return [b.wPx, b.dPx];
    default: return [b.dPx, b.hPx];
  }
}

/** A face's corners [top-left, top-right, bottom-right, bottom-left], each [x, y, z], as seen from outside. */
export function faceCorners(face, b) {
  const { x0, x1, y0, y1, z0, z1 } = b;
  switch (face) {
    case 'front': return [[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]];
    case 'back': return [[x1, y1, z0], [x0, y1, z0], [x0, y0, z0], [x1, y0, z0]];
    case 'top': return [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    case 'bottom': return [[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x0, y0, z0]];
    case 'right': return [[x1, y1, z1], [x1, y1, z0], [x1, y0, z0], [x1, y0, z1]];
    case 'left': return [[x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [x0, y0, z0]];
  }
  throw new Error(`no face '${face}'`);
}

/** Where a world-anchored face's top-left texel is, in pixels: tiles continue across quads. */
export function worldTexel(face, b, ppm) {
  switch (face) {
    case 'top': return [b.x0 * ppm, b.z0 * ppm];
    case 'bottom': return [b.x0 * ppm, -b.z1 * ppm];
    case 'front': return [b.x0 * ppm, -b.y1 * ppm];
    case 'back': return [-b.x1 * ppm, -b.y1 * ppm];
    case 'right': return [-b.z1 * ppm, -b.y1 * ppm];
    case 'left': return [b.z0 * ppm, -b.y1 * ppm];
  }
  return [0, 0];
}

/**
 * A quad, plain data, ready for buildArrays(): its corners (tl, tr, br, bl), its normal, its texel
 * size, the texel of its top-left corner (0, 0, or the world's), its atlas region [x, y, w, h], colour
 * (linear [r, g, b]), part and glow class.
 */
export function faceQuad(face, b, { region, color = [1, 1, 1], part = 0, glow = 0, anchor = 'local', ppm }) {
  const [cols, rows] = faceTexels(face, b);
  return { corners: faceCorners(face, b), normal: NORMALS[FACES.indexOf(face)], cols, rows, origin: anchor === 'world' ? worldTexel(face, b, ppm) : [0, 0], region, color, part, glow };
}

/** Arrays for quads: { position, normal, aTexel, aRegion, color, aPart, aGlow, index, vertices, triangles }. */
export function buildArrays(quads) {
  const nv = quads.length * 4, A = {};
  for (const [k, n] of Object.entries(LAYOUT)) A[k] = new Float32Array(nv * n);
  const index = nv > 65535 ? new Uint32Array(quads.length * 6) : new Uint16Array(quads.length * 6);
  const CORNER_T = [[0, 0], [1, 0], [1, 1], [0, 1]];
  quads.forEach((q, i) => {
    const v0 = i * 4;
    for (let c = 0; c < 4; c++) {
      const v = v0 + c, p = q.corners[c];
      A.position.set(p, v * 3);
      A.normal.set(q.normal, v * 3);
      A.aTexel[v * 2] = q.origin[0] + CORNER_T[c][0] * q.cols;
      A.aTexel[v * 2 + 1] = q.origin[1] + CORNER_T[c][1] * q.rows;
      A.aRegion.set(q.region, v * 4);
      A.color.set(q.color, v * 3);
      A.aPart[v] = q.part;
      A.aGlow[v] = q.glow;
    }
    // (counter-clockwise from outside: tl, bl, br and tl, br, tr)
    index.set([v0, v0 + 3, v0 + 2, v0, v0 + 2, v0 + 1], i * 6);
  });
  return { ...A, index, vertices: nv, triangles: quads.length * 2 };
}
