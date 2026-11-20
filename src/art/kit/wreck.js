// OLYMPUS art: the Wreck's pieces, the trunk's scuttle, the 1MC's speaker, the hold's cargo and the brig's couch rack (the build sheet v0.0.25 §1 A; PLACES §5.1, §5.4, §5.7).
//
// The Wreck is a stripped Tharsis corvette (src/data/places/wreck.js): a ship's compartment 2.2 m clear, every standing piece deck
// to deckhead so one grid serves a body on either face. Its pieces, each its catalogue's size (src/sim/places/fixtures.js,
// pinned equal to FOOTPRINTS by places-validate):
//   scuttle    the trunk's hatch, Ø 0.8 m, its make its mounting: in the deck ('deck', the fixture's y 0) a round grey coaming
//              round its lid, dogged, a hand wheel on the lid (SCUTTLE_LOOK 'H-b', samples/wreck-faces' H, the user's star of
//              2026-11-20: the area's batch is drawn once, so the lid shown open is the view's to add as a moving piece, as a door's
//              leaf is, D's); in the deckhead ('deckhead', y 2.2) the same coaming hanging under it as a ring, the hole inside it left
//              empty (nothing of the deck above is ever drawn: VIEWS §2.9). Round in boxes: the ring and the lid are laid a pixel
//              row at a time at the area's own density (k.ppm), each row's runs one box or one flat piece, so the circle is the
//              sample's on whole pixels at 16 and at 24 px/m, in one batch with the rest (no draw call of its own). H-a, v0.0.25's
//              square coaming in hazard stripes with four dogs, stays drawable
//   speaker    the 1MC's: a grey box 0.2 m square under the deckhead, its grille ('onemc'), or a squat horn ('horn')
//   cargo      a stack of crates 1.2 m square deck to deckhead, lashed with two yellow straps a face ('lashed') or under a net ('netted')
//   berthRack  the brig's berth couches racked on end deck to deckhead: four posts ('grey' or bare 'steel'), four couch pans in a
//              crash couch's padding blue
//   coaming    a bulkhead hatch's sill, 0.3 m high across its opening and as thick as the wall, its top striped ('yellow') or plain
//              ('grey'); laid by the area's job under each leaf that is a hatch (src/art/jobs.js), the leaf itself the doorLeaf's
//              'hatch' make (structure.js: four dogs, its corners rounded; samples/wreck-faces' B-a until scored)
// Not sampled (the build sheet §10: the scuttle's rim beyond H, the speaker, the cargo stacks are my calls). Pure.
import { tex } from './kit.js';
import { C, U, P, bevel, tone } from './common.js';
import { paintedSteel } from '../materials/index.js';

const RIM_M = 0.08, RIM_H_M = 0.06;
// (hazard stripes over a face, bands `band` px wide)
const stripes = (px, w, h, band) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(i, j, 1, 1, Math.floor((i + j) / band) % 2 ? C.hazardD : C.hazard); };
const rimFace = tex('wreck:coaming', (px, w, h, p) => stripes(px, w, h, Math.max(2, Math.round(3 * U(p)))));
// (the scuttle's lid, dogged, under H-a: square, a dog at each corner turned in, the trunk's stencil: samples/wreck-faces' H-a)
const LID = 0x5d666f;
const lidTop = tex('wreck:lid', (px, w, h, ppm) => {
  paintedSteel(px, 0, 0, w, h, { c: LID, ppm, seed: 52 });
  bevel(px, 0, 0, w, h, LID, 1.3);
  const d = Math.max(2, P(0.08, ppm, 2));
  for (const [x, y] of [[1, 1], [w - 1 - d, 1], [1, h - 1 - d], [w - 1 - d, h - 1 - d]]) { px(x, y, d, d, C.steel); px(x, y + d - 1, d, 1, tone(C.steel, -0.35)); }
  px(Math.floor(w / 2) - 1, Math.floor(h / 2) - 1, 3, 3, C.steelD);
});

/** How the trunk's scuttle is drawn (see the header): 'H-b' round with a hand wheel (v0.0.28, the user's star), or 'H-a' square with dogs. */
export const SCUTTLE_LOOK = 'H-b';
const RING_C = 0x7f868e, WHEEL_C = C.steel;
/**
 * H-b's pixels at a density (see the header): rows of runs { j, i0, i1, kind } across the scuttle's W (N pixels a side, its middle a
 * pixel's centre on an odd N): 'ring' the coaming (the outer RIM_M, at least a pixel and a half), 'lid' and 'wheel' inside it (the
 * wheel a ring at 0.45 of the radius and its two spokes, a pixel wide, the sample's). Pure; the kit lays them, the tests read them.
 */
export function roundScuttleRuns(W, ppm) {
  const N = Math.max(3, Math.round(W * ppm)), R = N / 2, rim = Math.max(1.5, RIM_M * ppm), wR = Math.round(R * 0.45), runs = [];
  const kindAt = (i, j) => {
    const dx = i + 0.5 - R, dy = j + 0.5 - R, r = Math.hypot(dx, dy);
    if (r > R) return null;
    if (r >= R - rim) return 'ring';
    if (Math.abs(r - wR) < 0.5 || (Math.abs(dx) < 0.5 && Math.abs(dy) <= wR) || (Math.abs(dy) < 0.5 && Math.abs(dx) <= wR)) return 'wheel';
    return 'lid';
  };
  for (let j = 0; j < N; j++) {
    let i0 = 0, kind = kindAt(0, j);
    for (let i = 1; i <= N; i++) {
      const k = i < N ? kindAt(i, j) : undefined;
      if (k !== kind) { if (kind) runs.push({ j, i0, i1: i, kind }); i0 = i; kind = k; }
    }
  }
  return { N, runs };
}

/** The trunk's scuttle (see the header): under H-b a round coaming round its dogged lid and its wheel in the deck, or the ring under the deckhead; under H-a v0.0.25's square. */
export function scuttle(k, o) {
  const { W, D } = o, head = o.make === 'deckhead';
  k.comp();
  if ((o.look ?? SCUTTLE_LOOK) === 'H-b') {
    const { N, runs } = roundScuttleRuns(W, k.ppm), P = W / N, at = (i) => -W / 2 + i * P, atZ = (j) => -D / 2 + j * (D / N);
    for (const r of runs) {
      const x0 = at(r.i0), x1 = at(r.i1), z0 = atZ(r.j), z1 = atZ(r.j + 1);
      if (r.kind === 'ring') k.box({ x0, x1, z0, z1, y: head ? -RIM_H_M : 0, h: RIM_H_M, faces: { top: RING_C, front: tone(RING_C, -0.2), sides: tone(RING_C, -0.3) } });
      else if (!head) k.ground({ x0, z0, x1, z1, lift: 0.004, color: r.kind === 'wheel' ? WHEEL_C : LID });
    }
    return;
  }
  if (head) {
    // (y: the fixture's, the deckhead's height; the rim hangs RIM_H_M under it)
    const y = -RIM_H_M;
    k.box({ x0: -W / 2, x1: W / 2, z0: -D / 2, z1: -D / 2 + RIM_M, y, h: RIM_H_M, faces: { front: rimFace, sides: C.hazardD, top: C.hazard } });
    k.box({ x0: -W / 2, x1: W / 2, z0: D / 2 - RIM_M, z1: D / 2, y, h: RIM_H_M, faces: { front: rimFace, sides: C.hazardD, top: C.hazard } });
    k.box({ x0: -W / 2, x1: -W / 2 + RIM_M, z0: -D / 2 + RIM_M, z1: D / 2 - RIM_M, y, h: RIM_H_M, faces: { front: rimFace, sides: C.hazardD, top: C.hazard } });
    k.box({ x0: W / 2 - RIM_M, x1: W / 2, z0: -D / 2 + RIM_M, z1: D / 2 - RIM_M, y, h: RIM_H_M, faces: { front: rimFace, sides: C.hazardD, top: C.hazard } });
    return;
  }
  k.ground({ x0: -W / 2 + RIM_M, z0: -D / 2 + RIM_M, x1: W / 2 - RIM_M, z1: D / 2 - RIM_M, lift: 0.004, top: lidTop });
  k.box({ x0: -W / 2, x1: W / 2, z0: -D / 2, z1: -D / 2 + RIM_M, h: RIM_H_M, faces: { front: rimFace, sides: C.hazardD, top: C.hazard } });
  k.box({ x0: -W / 2, x1: W / 2, z0: D / 2 - RIM_M, z1: D / 2, h: RIM_H_M, faces: { front: rimFace, sides: C.hazardD, top: C.hazard } });
  k.box({ x0: -W / 2, x1: -W / 2 + RIM_M, z0: -D / 2 + RIM_M, z1: D / 2 - RIM_M, h: RIM_H_M, faces: { front: rimFace, sides: C.hazardD, top: C.hazard } });
  k.box({ x0: W / 2 - RIM_M, x1: W / 2, z0: -D / 2 + RIM_M, z1: D / 2 - RIM_M, h: RIM_H_M, faces: { front: rimFace, sides: C.hazardD, top: C.hazard } });
}

const GREY = 0x6f747a;
const grille = tex('wreck:speaker', (px, w, h) => { px(0, 0, w, h, GREY); bevel(px, 0, 0, w, h, GREY, 1.2); for (let j = 1; j < h - 1; j += 2) px(1, j, Math.max(1, w - 2), 1, tone(GREY, -0.3)); });
const hornMouth = tex('wreck:horn', (px, w, h) => { px(0, 0, w, h, GREY); bevel(px, 0, 0, w, h, GREY, 1.2); px(1, 1, Math.max(1, w - 2), Math.max(1, h - 2), tone(GREY, -0.35)); });
/** The 1MC's speaker (see the header): a grey box under the deckhead (its y the fixture's, under the deckhead), its grille; the 'horn' make a squat horn's mouth. */
export function speaker(k, o) {
  const { W, D } = o;
  k.comp();
  if (o.make === 'horn') { k.box({ x: 0, z: 0, y: -0.08, w: W, d: D * 0.6, h: 0.08, faces: { front: hornMouth, top: tone(GREY, 0.04), sides: tone(GREY, -0.1) } }); return; }
  k.box({ x: 0, z: 0, y: -0.06, w: W, d: D, h: 0.06, faces: { front: grille, top: grille, sides: tone(GREY, -0.1) } });
}

const CRATE = 0x8a7a5c;
const crateFace = (seed) => tex(`wreck:crate:${seed % 3}`, (px, w, h, ppm) => {
  paintedSteel(px, 0, 0, w, h, { c: tone(CRATE, (seed % 3 - 1) * 0.04), ppm, seed: 70 + (seed % 3) });
  // (the crates' seams every 0.55 m up, two straps of the lashing down the face)
  for (let y = P(0.55, ppm); y < h; y += P(0.55, ppm)) px(0, y, w, 1, tone(CRATE, -0.22));
  const sw = Math.max(2, P(0.05, ppm, 2));
  for (const t of [0.28, 0.72]) { const x = Math.round(t * w - sw / 2); px(x, 0, sw, h, C.hazard); px(x, 0, 1, h, tone(C.hazard, 0.08)); }
  bevel(px, 0, 0, w, h, CRATE, 1.1);
});
const crateTop = tex('wreck:cratetop', (px, w, h, ppm) => { paintedSteel(px, 0, 0, w, h, { c: CRATE, ppm, seed: 73 }); const sw = Math.max(2, P(0.05, ppm, 2)); for (const t of [0.28, 0.72]) { px(Math.round(t * w - sw / 2), 0, sw, h, C.hazard); px(0, Math.round(t * h - sw / 2), w, sw, C.hazard); } });
// (the 'netted' make: the same crates under a cargo net, its cords a diamond lattice every 0.3 m)
const NET = 0x3e424d;
const netOver = (face) => tex(`wreck:net:${face}`, (px, w, h, ppm) => {
  paintedSteel(px, 0, 0, w, h, { c: CRATE, ppm, seed: face === 'top' ? 74 : 75 });
  if (face !== 'top') for (let y = P(0.55, ppm); y < h; y += P(0.55, ppm)) px(0, y, w, 1, tone(CRATE, -0.22));
  const s = Math.max(4, P(0.3, ppm, 4));
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + j) % s === 0 || (i - j + 4 * s * 64) % s === 0) px(i, j, 1, 1, NET);
});
/** The hold's cargo (see the header): a stack of crates deck to deckhead, lashed with straps ('lashed') or under a net ('netted'). */
export function cargo(k, o) {
  const { W, D, H, seed } = o;
  k.comp();
  if (o.make === 'netted') { k.box({ x: 0, z: 0, w: W, d: D, h: H, faces: { front: netOver('side'), back: netOver('side'), sides: netOver('side'), top: netOver('top') } }); return; }
  k.box({ x: 0, z: 0, w: W, d: D, h: H, faces: { front: crateFace(seed), back: crateFace(seed + 1), sides: crateFace(seed + 2), top: crateTop } });
}

const POSTS = Object.freeze({ grey: 0x565b67, steel: 0x7c736b });
const panTop = tex('wreck:couchpan', (px, w, h) => { px(0, 0, w, h, C.padBlue); bevel(px, 0, 0, w, h, C.padBlue, 1.2); for (let j = 2; j < h - 2; j += 4) px(2, j, Math.max(1, w - 4), 1, tone(C.padBlue, -0.08)); });
const panFront = tex('wreck:couchfront', (px, w, h) => { px(0, 0, w, h, C.padBlue); px(0, 0, w, 1, C.padBlueL); px(0, h - 1, w, 1, tone(C.padBlue, -0.2)); });
/** The brig's couch rack (see the header): the berth couches racked on end, deck to deckhead, its frame grey or bare steel by make. */
export function berthRack(k, o) {
  const { W, D, H } = o, post = 0.05, POST = POSTS[o.make] ?? POSTS.grey;
  k.comp();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box({ x: sx * (W / 2 - post / 2), z: sz * (D / 2 - post / 2), w: post, d: post, h: H, faces: { sides: POST, top: tone(POST, 0.08) } });
  for (const y of [0.3, 0.8, 1.3, 1.8]) {
    k.comp();
    k.box({ x: 0, z: 0, y, w: W - 2 * post, d: D - 2 * post, h: 0.12, faces: { top: panTop, front: panFront, sides: C.padBlue } });
  }
  k.comp();
  k.box({ x: 0, z: 0, y: H - 0.05, w: W, d: D, h: 0.05, faces: { sides: POST, top: tone(POST, 0.05) } });
}

const SILL = 0x6d757f;
const sillTop = (make) => tex(`wreck:sill:${make}`, (px, w, h, p) => (make === 'grey' ? px(0, 0, w, h, tone(SILL, 0.06)) : stripes(px, w, h, Math.max(2, Math.round(3 * U(p))))));
/** A bulkhead hatch's coaming (see the header): the sill across its opening, the wall's thickness, 0.3 m high. */
export function coaming(k, o) {
  const { W, D, H } = o;
  k.comp();
  k.box({ x: 0, z: 0, w: W, d: D, h: H, faces: { front: tex('wreck:sillface', (px, w, h, p) => { paintedSteel(px, 0, 0, w, h, { c: SILL, ppm: p, seed: 9 }); px(0, 0, w, 1, tone(SILL, 0.1)); }), top: sillTop(o.make ?? 'yellow'), sides: tone(SILL, -0.1) } });
}
