// OLYMPUS render: everyone on the stage in one draw. Figures' cards from a GPU atlas filled a band at a time.
//
// tradecraft's crowd (src/render/crowd.js), ported to OLYMPUS's figures (src/art/figures/) and stage:
//   - THE ATLAS is one ATLAS_PX square texture allocated on the GPU and never sent whole (the user,
//     tradecraft 2026-10-29: "each time I turn it staggers almost a second", the cost of a big texture
//     re-sent). Each look (outfit, skin, hair, weapon, carry: a person's sheet) takes a slot the size of
//     its sheet (src/art/figures/atlas.js sheetLayout(): about 512 × 480 at 16 px/m, 768 × 720 at 24);
//     a full atlas reuses the slot whose look has gone unseen longest. A slot is filled a BAND at a time
//     (the gait first; the arms, rest and float bands the first time that person aims, sits or floats),
//     each band painted by a resumable job (atlas.js bandSteps()) and sent up alone into its rectangle
//     (renderer.copyTextureToTexture: one texSubImage2D of a quarter to half a megabyte).
//   - THE BUDGET: the painting shares BUDGET_MS a frame (VIEWS.md 3.7: 1.5 ms at 16 px/m, 3 at 24), and at
//     most SHEETS_PER_FRAME (2) bands go up a frame. Anyone whose band isn't ready is drawn in a band
//     already up (standing, idle) or, new, not yet: a frame or two on, still coming out of the dark.
//     Your own figure (own: true) is never put off.
//   - ONE DRAW: every person is an instance of one upright card (an InstancedMesh), per instance its
//     place (the matrix), its frame's rectangle in the atlas (aRect) and the light where it stands
//     (aTint: stage.lightAt(), the same number the dice read). The card writes the people's part ID
//     (src/render/cards.js PEOPLE_PART) through the stage's MRT and is seen through like any card in
//     front of the figure in focus (src/render/materials.js FRAG_DECL, olySee). A pixel whose alpha
//     carries a glow class (a helmet lamp, a suit's chest display, a dosimeter: shade.js) is drawn
//     unlit, as bright at night as by day.
//   - PLACING A CARD: each frame's cell has an anchor (the pixel over the sim's spot: the ground under
//     the body, or a floater's pelvis). The card stands upright in the plane a little nearer the camera
//     than the spot, as far as the cell has rows below its anchor, so its lowest rows stay above the
//     floor and the anchor still lands on the spot (on screen a card's row is where the ground at z − y
//     is). A seat, a bound's height or a float lifts it (y); the blob stays on the floor and shrinks
//     with the height (VIEWS.md 3.5: 1 / (1 + 0.6 h), opacity 0.4 down to 0.15). A body lying side on
//     has a long blob, one lying end on a deep one. v0.0.28 (the user's stars of 2026-11-20, S5 and F-a): a man standing on the
//     floor casts his shadow in its place, his legs laid flat away from the light, hard-edged (render/faces.js castShadowPixels,
//     SHADOW_*), in the blobs' own draw from his atlas cell; two men 0.65 m apart in the stack no longer share one blob.
//   - FLASHES: a third instanced draw of cards from the flash strip (atlas.js flashStrip()), at the
//     muzzle, unlit, nudged along the camera's line (in front, or behind the head from behind), for
//     FLASH_MS; the caller lights whoever is within FLASH_LIT_M (poses.js gunPose() decides when).
//   - HELD (the build sheet v0.0.22 §1 item 17): the device in a figure's hands (p.held: { shape, colour }, view.js from
//     look.js heldLook) is a fifth instanced draw of cards from the held strip (atlas.js heldStrip: the pixels a device adds to its
//     frame, by shape, colour, frame and facing), lit by the same tint and carrying the person's part, placed by the drawn frame's
//     cell and nudged a little toward the camera so it lies over the figure's card. Its strip is baked for the shapes asked
//     (prepareHeld, the view's behind the brief's cut) and sent whole then; a shape first met mid-lane is baked at once (stats.heldLate).
//   - BERTHS (0.0.3): a person lying in a rack (lie: { y, head, ... }) is not a card: in this projection an
//     upright card of a body lying head north reads as one standing (the look round's L5). They are drawn
//     as the berth shows them, a quad lying on the mattress at its height, painted with the blanket over
//     the body and the head on the pillow in their own hair and skin, or the drawn curtain
//     (src/art/figures/bedding.js), from a small atlas a cell a sleeper, a fourth instanced draw with the
//     cards' own shader (one program), lit by the same tint; no blob (the rack is under them).
//   - RIFLE SHEETS (0.0.5): the rifle's handling bands (poses.js RIFLE_BANDS) are a second, smaller sheet
//     a look gets only when it first handles a rifle (atlas.js pools.rifle: 1360 × 152 at 16 px/m from v0.0.23, the P-12's band
//     beside the rifle's; 896 × 152 before), kept in the atlas's rows the base sheets leave below them (RIFLE_SLOTS_MIN of them at
//     least, a base row given up for them where the rows left are too few): 6 at 16 px/m and 6 at 24 in a 4096 atlas (8 and 9
//     to v0.0.22), the base sheets' 40 and 15 unchanged. A full pool gives the rifle sheet unseen longest to the look that needs
//     one; its owner keeps its base sheet.
//     0.0.7 (the KD's relay, six rifles in sight): prepare takes a rifle sheet when one is free; a rifle band
//     painted for a look with none is forgotten, so it is asked again once the look has one; and a figure whose
//     band is not up yet is drawn from its twin's sheet (p.twin: the same figure with the magazine in or out)
//     when that has it, so a shooter changing magazines prone never stands up while the new sheet paints.
// v0.0.25 (the build sheet items 8 and 14, §3.4; PC§3.2): A CARD ON A FACE. A person drawn planted on a face other than the deck (p.turn,
// p.flip: the face's turn from art/figures/poses.js faceCard; view.js) is the same instance of the same card, its matrix turned about
// the anchor in the card's plane by render/faces.js cardTurn (whole pixels: no atlas cell, no band, no program, the rifle the rifle's
// shape turned with the man), the held card and the flash turned with it; p.blobLift the lift its blob is drawn for (heightLookOf's,
// not the card's height), p.ring its blob drawn as a dashed ring (the overhead's footprint, samples/wreck-faces K-b: the blob draw's
// own shader, aRing, every other blob as before).
// Frames follow the sim (poses.js gaitFrame(): walks by distance, idles at 2 fps by a person's phase).
//   - STANCE SHEETS (R8, VIEWS §3.10.8; the third option, my call: no new texture): an armed mover in a stance has a sheet a carry
//     (low, high, aimed) of the stance pool (poses.js STANCE_BANDS: the glide, Assault, the beats), its own look (sheet 'stance')
//     in a base slot like any look's, since the pool's sheet is no larger than a base one (atlas.js); a frame of it is drawn from
//     that slot (p.stanceKey, p.stanceLook), and while its band is not up, from the base sheet's stand-in (p.fallback).
//
// In the game (TECH §9.4, §11.2) the bands are painted off the main thread: given a painter
// (src/render/painter.js), a band not yet up is asked of the paint worker (priority 'visible', or 'own'
// for the player's), and when its pixels come back they wait in the upload queue (src/render/uploads.js:
// 1 MB and 2 ms a frame, the player's first) for their texSubImage2D, rather than being painted here
// within BUDGET_MS. The player's own figure is never put off: a band of theirs that is not up when it is
// drawn is painted on the main thread at once (painter.runNow) and sent at once. prepare() asks for a
// look's bands behind a cut and resolves once they are up (view.js waits on the player's before the
// world shows). Without a painter (the samples) the bands are painted here as before. MAX_PEOPLE is 256
// (TECH correction 20, §16.7: the largest drawn count, a crowd scene's 224 live agents and 32 ghosts).
import * as THREE from 'three';
import { PX_PER_M } from './scale.js';
import { FRAG_DECL } from './materials.js';
import { PEOPLE_PART, PEOPLE_PARTS, PEOPLE_PART_STEP } from './cards.js';
import { sheetLayout, bandSteps, flashStrip, heldStrip, heldKey } from '../art/figures/atlas.js';
import { BAND_OF, POOL_OF, gaitFrame, CARRY_FREE_BANDS } from '../art/figures/poses.js';
const CARRY_FREE = new Set(CARRY_FREE_BANDS);
import { wear } from '../art/figures/outfits.js';
import { paintSleeper, sleeperKey, BERTH_M } from '../art/figures/bedding.js';
import { paint } from '../art/paint.js';
import { cardTurn, SHADOW_UP_M, SHADOW_K, SHADOW_A } from './faces.js';

export const ATLAS_PX = 4096;
export const SHEETS_PER_FRAME = 2;
/** Milliseconds a frame for painting new bands (VIEWS.md 3.7). */
export const BUDGET_MS = PX_PER_M >= 20 ? 3.0 : 1.5;
export const MAX_PEOPLE = 256, MAX_FLASHES = 24;
/** The fewest rifle sheets the atlas keeps (a base row is given up for them if the rows left hold fewer). */
export const RIFLE_SLOTS_MIN = 4;
/** The berths' atlas, texels square (a sleeper's cell is 0.84 × 1.92 m: 20 × 46 px at 24 px/m, 275 cells). */
export const BERTH_ATLAS_PX = 512;
/** The part a berth's sleeper writes (outlined against the rack, not against the people standing by). */
export const BERTH_PART = PEOPLE_PART + 1;
/** v0.0.25: the overhead's ring under a body on the deckhead (K-b): its inner edge as a share of the blob's radius, and its dashes round. */
export const BLOB_RING_IN = 0.72, BLOB_DASHES = 12;
/** Who a flash lights, and the most it lights them (tradecraft's: linear, a warm white). */
export const FLASH_LIT_M = 3, FLASH_LIGHT = Object.freeze([1.0, 0.85, 0.55]);
const INK = 0x14151c, TOWARD = new THREE.Vector3(0, Math.SQRT1_2, Math.SQRT1_2).multiplyScalar(0.15);
/** A held card's nudge toward the camera (m): over its figure's card, under anything a hand's breadth nearer. */
const HELD_TOWARD = new THREE.Vector3(0, Math.SQRT1_2, Math.SQRT1_2).multiplyScalar(0.02);

/**
 * The figures of the stage: { group (add it to the scene or an area), update(people), prepare(key, look,
 * bands), stats, atlas, layout, dispose }. opts: renderer (required), ppm,
 * atlasPx, budgetMs, sheetsPerFrame, maxPeople, painter (the paint worker's: src/render/painter.js),
 * uploads (the frame's upload queue: src/render/uploads.js).
 */
export function createFigures({ renderer, ppm = PX_PER_M, atlasPx = ATLAS_PX, budgetMs = BUDGET_MS, sheetsPerFrame = SHEETS_PER_FRAME, maxPeople = MAX_PEOPLE, painter = null, uploads = null } = {}) {
  const lay = sheetLayout(ppm), RL = lay.pools.rifle;
  const COLS = Math.floor(atlasPx / lay.w), RCOLS = Math.max(1, Math.floor(atlasPx / RL.w));
  let ROWS = Math.floor(atlasPx / lay.h);
  while (ROWS > 1 && Math.floor((atlasPx - ROWS * lay.h) / RL.h) * RCOLS < RIFLE_SLOTS_MIN) ROWS--;
  const SLOTS = COLS * ROWS, RY0 = ROWS * lay.h, RSLOTS = RCOLS * Math.floor((atlasPx - RY0) / RL.h);
  // (on the GPU only: storage made at its first use, nothing sent with it; rows top-down, as the sheets are painted)
  const atlas = new THREE.DataTexture(null, atlasPx, atlasPx);
  atlas.magFilter = atlas.minFilter = THREE.NearestFilter;
  atlas.generateMipmaps = false;
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.flipY = false;
  atlas.source.dataReady = false;
  atlas.needsUpdate = true;
  const stats = { slots: SLOTS, rifleSlots: RSLOTS, rifleUsed: 0, used: 0, fallback: 0, twin: 0, sib: 0, uploads: 0, uploadBytes: 0, uploadMs: 0, paintMs: 0, bandsPainted: 0, drawn: 0, deferred: 0, asked: 0, waiting: 0, ownNow: 0, lastFrame: { uploads: 0, bytes: 0, paintMs: 0, uploadMs: 0 }, atlasPx, sheet: [lay.w, lay.h] };

  // ---------- slots: look key → { slot, bands: Set, seen, job } ----------
  const slots = new Map(), free = Array.from({ length: SLOTS }, (_, i) => SLOTS - 1 - i);
  const rifleOwner = new Array(RSLOTS).fill(null), rfree = Array.from({ length: RSLOTS }, (_, i) => RSLOTS - 1 - i);
  // (a rifle sheet for a slot: its own, or a free one, or the one unseen longest whose owner was not drawn this frame)
  function rifleSlotOf(s) {
    if (s.rslot !== null && s.rslot !== undefined) return s.rslot;
    let r = rfree.pop();
    if (r === undefined) {
      let worst = -1;
      for (let i = 0; i < RSLOTS; i++) { const o = rifleOwner[i]; if (o && o.seen < frameNo && (worst < 0 || o.seen < rifleOwner[worst].seen)) worst = i; }
      if (worst < 0) return null;
      dropRifle(rifleOwner[worst]); r = rfree.pop();
    }
    s.rslot = r; rifleOwner[r] = s; stats.rifleUsed = RSLOTS - rfree.length;
    return r;
  }
  function dropRifle(o) {
    if (o.rslot === null || o.rslot === undefined) return;
    for (const b of [...o.bands]) if (POOL_OF[b] === 'rifle') { o.bands.delete(b); uploads?.cancel(`fig:${o.slot}:${b}`); o.got.delete(b); o.asked.delete(b); }
    rifleOwner[o.rslot] = null; rfree.push(o.rslot); o.rslot = null; stats.rifleUsed = RSLOTS - rfree.length;
  }
  let frameNo = 0, uploadsLeft = 0, msLeft = 0;
  const at = new THREE.Vector2();
  function slotOf(key, look, own) {
    let s = slots.get(key);
    if (!s) {
      if (!painter && uploadsLeft <= 0 && !own) return null;      // (painting here: a new face only when a band may go up)
      let i = free.pop();
      if (i === undefined) {                                        // (full: the slot unseen longest, if not seen this frame)
        let worst = null;
        for (const [k, v] of slots) if (v.seen < frameNo && (!worst || v.seen < worst[1].seen)) worst = [k, v];
        if (!worst) return null;
        slots.delete(worst[0]); i = worst[1].slot;
        forget(worst[1]);
        // (a slot given to another look counted, so the bench and the page's tests say when a prepared sheet was evicted)
        stats.evicted = (stats.evicted ?? 0) + 1;
      }
      s = { slot: i, rslot: null, key, raw: look, look: look?.top ? look : wear(look), bands: new Set(), asked: new Map(), got: new Map(), seen: frameNo, job: null, jobBand: null, gone: false };
      slots.set(key, s);
      stats.used = slots.size;
    }
    s.seen = frameNo;
    return s;
  }
  // (a slot given to another look: what was asked for the old one never lands in it)
  function forget(s) {
    dropRifle(s);
    s.gone = true;
    if (uploads) for (const b of s.got.keys()) uploads.cancel(`fig:${s.slot}:${b}`);
    s.got.clear();
  }
  const bandOf = ({ meta, buffers }) => ({ band: meta.band, rect: meta.rect, pm: { w: meta.w, h: meta.h, data: new Uint32Array(buffers[0]) } });
  // (a band asked of the paint worker: its pixels into the upload queue when they come)
  function ask(s, band, priority, { direct = false } = {}) {
    if (s.asked.has(band)) return s.asked.get(band);
    stats.asked++; stats.waiting++;
    const p = painter.run('sheet', { look: s.raw, band, ppm }, { priority }).then(({ meta, buffers }) => {
      stats.waiting--;
      if (s.gone || s.bands.has(band)) return;
      // (a rifle band painted for a look with no rifle sheet (prepare's, or evicted since): forgotten, so the look asks
      // again once it has one (the 0.0.7 integrator's: kept as asked, it was never painted, and the relay stood up))
      if (POOL_OF[band] === 'rifle' && (s.rslot === null || s.rslot === undefined)) { s.asked.delete(band); return; }
      const b = bandOf({ meta, buffers });
      stats.paintMs += meta.ms?.paint ?? 0;
      if (direct || !uploads) { upload(s, b); return; }
      s.got.set(band, b);
      uploads.queue({ key: `fig:${s.slot}:${band}`, bytes: b.rect.w * b.rect.h * 4, own: !!s.own, run: () => { const g = s.got.get(band); s.got.delete(band); if (g && !s.gone && !s.bands.has(band)) upload(s, g); } });
    }, (e) => { stats.waiting--; s.asked.delete(band); console.warn(`figures: band '${band}' of '${s.key}' did not paint`, e); });
    s.asked.set(band, p);
    return p;
  }
  /** Work on a slot's band within the frame's budget (own: to its end); true once it's up. */
  function ensureBand(s, band, own) {
    if (s.bands.has(band)) return true;
    if (POOL_OF[band] === 'rifle' && rifleSlotOf(s) === null) return false;   // (no rifle sheet free this frame)
    if (painter) {
      if (own) {
        // (yours: never put off. Its pixels back from the worker and waiting in the queue go up now;
        // otherwise it is painted here, whatever the worker is doing, and sent now)
        s.own = true;
        const g = s.got.get(band);
        if (g) { s.got.delete(band); uploads?.cancel(`fig:${s.slot}:${band}`); upload(s, g); return true; }
        upload(s, bandOf(painter.runNow('sheet', { look: s.raw, band, ppm })));
        stats.ownNow++;
        return true;
      }
      if (!s.asked.has(band)) ask(s, band, 'visible');
      return false;
    }
    if (s.ready) return false;                                     // (painted, waiting for a frame with an upload to spare)
    if (s.job && s.jobBand !== band) return false;                 // (one band at a time a slot)
    if (!s.job) { s.job = bandSteps(s.look, band, { ppm }); s.jobBand = band; }
    for (;;) {
      if (!own && msLeft <= 0) return false;
      const t0 = performance.now(), r = s.job.next(), dt = performance.now() - t0;
      msLeft -= dt; stats.paintMs += dt; stats.lastFrame.paintMs += dt;
      if (r.done) {
        if (!own && uploadsLeft <= 0) { s.ready = r.value; s.job = null; s.jobBand = null; break; }
        upload(s, r.value); s.job = null; s.jobBand = null;
        return true;
      }
    }
    return false;
  }
  function upload(s, b) {
    const t0 = performance.now();
    const src = new THREE.DataTexture(new Uint8Array(b.pm.data.buffer), b.rect.w, b.rect.h);
    src.flipY = false;
    const [px0, py0] = originOf(s, b.band), ox = px0 + b.rect.x, oy = py0 + b.rect.y;
    renderer.copyTextureToTexture(src, atlas, null, at.set(ox, oy));
    src.dispose();
    s.bands.add(b.band); s.ready = null;
    uploadsLeft--;
    const bytes = b.rect.w * b.rect.h * 4, ms = performance.now() - t0;
    stats.uploads++; stats.uploadBytes += bytes; stats.uploadMs += ms; stats.bandsPainted++;
    stats.lastFrame.uploads++; stats.lastFrame.bytes += bytes; stats.lastFrame.uploadMs += ms;
    // (which band went up, so the bench card names a band that went late (its look's outfit, the band, yours or not))
    (stats.lastFrame.bands ??= []).push(`${s.raw?.outfit ?? 'look'}/${b.band}${s.raw?.carry ? `/${s.raw.carry}` : ''}${s.raw?.sheet ? `/${s.raw.sheet}` : ''}${s.own ? '/own' : ''}:${Math.round(bytes / 1024)}KB`);
  }

  /** Where a slot's sheet for a band's pool lies in the atlas: [x, y] of its top-left. */
  function originOf(s, band) {
    if (POOL_OF[band] === 'rifle') return [(s.rslot % RCOLS) * RL.w, RY0 + Math.floor(s.rslot / RCOLS) * RL.h];
    return [(s.slot % COLS) * lay.w, Math.floor(s.slot / COLS) * lay.h];
  }

  // ---------- the cards ----------
  const geo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  const aRect = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople * 4), 4);
  const aTint = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople * 3), 3);
  // (one person, one outline (VIEWS §3.10.1, the rework's R2): each card's own part, PEOPLE_PART plus its draw slot mod PEOPLE_PARTS
  // in the ID's high byte, so the post pass inks the pixel between two figures standing at one depth (#1 and #2 in a stack))
  const aPartK = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople), 1);
  geo.setAttribute('aRect', aRect); geo.setAttribute('aTint', aTint); geo.setAttribute('aPartK', aPartK);
  const material = cardMaterial(atlas, atlasPx, PEOPLE_PART);
  material.userData.oly = { card: true };
  const cards = new THREE.InstancedMesh(geo, material, maxPeople);
  cards.frustumCulled = false; cards.count = 0;
  cards.userData.part = PEOPLE_PART;

  // ---------- the blobs (an ink ellipse a person, opacity by height, long for a body lying down) and, from v0.0.28, the cast shadow
  // of a man standing on the floor (render/faces.js SHADOW_*: his card's lower rows laid flat away from the light, sampled from his
  // own atlas cell in this draw's shader: one draw, no CPU a body more than the blob's) ----------
  // (a unit quad on the floor: the ellipse cut from it in the shader (v0.0.27's was a circle of 18 segments, 0.42 m by 0.252), or
  // the shadow's box of pixels from the card's left and its sole's row)
  const bgeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const aAlpha = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople), 1);
  // (1 draws the blob as the overhead's dashed ring (K-b, retired), BLOB_RING_IN of its radius in, BLOB_DASHES dashes round; 0 as before)
  const aRing = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople), 1);
  // (the cast shadow: the card's left (x, m), its sole's row (z, m), its anchor's row in the cell (px) and 1, or 0 for the ellipse;
  // the cell itself is the cards' own aRect, shared)
  const aCast = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople * 4), 4);
  bgeo.setAttribute('aAlpha', aAlpha); bgeo.setAttribute('aRing', aRing); bgeo.setAttribute('aCast', aCast); bgeo.setAttribute('aRect', aRect);
  const UP_PX = SHADOW_UP_M * ppm, CAST_K = Math.ceil(UP_PX) + 1, CAST_W_PX = Math.ceil(UP_PX * SHADOW_K[0]) + 2, CAST_D_PX = Math.ceil(UP_PX * SHADOW_K[1]) + 3;
  const bmat = new THREE.ShaderMaterial({
    uniforms: { ink: { value: new THREE.Color(INK) }, atlas: { value: atlas }, size: { value: atlasPx } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute float aAlpha; attribute float aRing; attribute vec4 aCast; attribute vec4 aRect;
      varying float vA; varying float vRing; varying vec2 vLocal; flat varying vec4 vCast; flat varying vec4 vRect; varying vec3 vOlyWorld; flat varying float vOlyPart;
      void main() { vA = aAlpha; vRing = aRing; vCast = aCast; vRect = aRect; vLocal = position.xz; vOlyPart = 0.0; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vOlyWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      ${FRAG_DECL}
      uniform vec3 ink; uniform sampler2D atlas; uniform float size; varying float vA; varying float vRing; varying vec2 vLocal; flat varying vec4 vCast; flat varying vec4 vRect;
      void main() {
        if (vCast.w > 0.5) {
          // (the floor pixel from the card's left column and its sole's row; each card row up to SHADOW_UP_M, h px up, laid at
          // (round(h ${SHADOW_K[0]}), round(h ${SHADOW_K[1]} - 0.5)), JS's Math.round: this pixel is shadow where one lands an opaque pixel)
          vec2 q = (vOlyWorld.xz - vCast.xy) * ${ppm.toFixed(4)};
          float ix = floor(q.x), iy = floor(q.y);
          bool on = false;
          for (int k = -1; k < ${CAST_K}; k++) {
            float h = float(k) + 0.5;
            if (h > ${UP_PX.toFixed(4)}) break;
            float hh = max(0.0, h);
            if (floor(hh * ${SHADOW_K[1].toFixed(4)}) != iy) continue;
            float px = ix - floor(hh * ${SHADOW_K[0].toFixed(4)} + 0.5), py = vCast.z - 1.0 - float(k);
            if (px < 0.0 || px >= vRect.z || py < 0.0 || py >= vRect.w) continue;
            if (texture2D(atlas, (vRect.xy + vec2(px, py) + 0.5) / size).a * 255.0 >= 127.5) { on = true; break; }
          }
          if (!on) discard;
          gl_FragColor = vec4(ink, vA); pc_fragId = vec4(0.0);
          return;
        }
        vec2 e = vLocal * 2.0;
        if (length(e) > 1.0) discard;
        if (vRing > 0.5 && (length(e) < ${BLOB_RING_IN.toFixed(2)} || fract((atan(e.y, e.x) / 6.2831853 + 0.5) * ${BLOB_DASHES.toFixed(1)}) > 0.5)) discard;
        gl_FragColor = vec4(ink, vA); pc_fragId = vec4(0.0);
      }`,
  });
  bmat.userData.oly = { blob: true };
  const blobs = new THREE.InstancedMesh(bgeo, bmat, maxPeople);
  blobs.frustumCulled = false; blobs.count = 0; blobs.renderOrder = 1;
  blobs.userData.noId = true;

  // ---------- the flashes ----------
  const strip = flashStrip(ppm), FS = strip.size;
  const ftex = new THREE.DataTexture(new Uint8Array(strip.pm.data.buffer), strip.pm.w, strip.pm.h);
  ftex.magFilter = ftex.minFilter = THREE.NearestFilter; ftex.generateMipmaps = false; ftex.colorSpace = THREE.SRGBColorSpace; ftex.flipY = false; ftex.needsUpdate = true;
  const fgeo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  const aSlot = new THREE.InstancedBufferAttribute(new Float32Array(MAX_FLASHES), 1);
  fgeo.setAttribute('aSlot', aSlot);
  const fmat = new THREE.ShaderMaterial({
    uniforms: { map: { value: ftex }, size: { value: new THREE.Vector2(strip.pm.w, strip.pm.h) }, fs: { value: FS } },
    transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute float aSlot; uniform float fs; varying vec2 vPx; varying vec3 vOlyWorld; flat varying float vOlyPart;
      void main() { vPx = vec2(aSlot * fs + uv.x * fs, (1.0 - uv.y) * fs); vOlyPart = 0.0; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vOlyWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      ${FRAG_DECL}
      uniform sampler2D map; uniform vec2 size; varying vec2 vPx;
      void main() { vec4 c = texture2D(map, (floor(vPx) + 0.5) / size); if (c.a < 0.5) discard; gl_FragColor = vec4(c.rgb, 1.0); pc_fragId = vec4(0.0); }`,
  });
  fmat.userData.oly = { flash: true };
  const flashes = new THREE.InstancedMesh(fgeo, fmat, MAX_FLASHES);
  flashes.frustumCulled = false; flashes.count = 0; flashes.renderOrder = 2;
  flashes.userData.noId = true;

  // ---------- the device in the hands (atlas.js heldStrip, see the header) ----------
  let held = null, heldShapes = [];
  const hgeo = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  const hRect = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople * 4), 4), hTint = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople * 3), 3), hPartK = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople), 1);
  hgeo.setAttribute('aRect', hRect); hgeo.setAttribute('aTint', hTint); hgeo.setAttribute('aPartK', hPartK);
  const htex0 = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  const heldMat = stripMaterial(htex0, [1, 1], PEOPLE_PART);
  const helds = new THREE.InstancedMesh(hgeo, heldMat, maxPeople);
  helds.frustumCulled = false; helds.count = 0; helds.renderOrder = 1;
  /** Bake the held cards of these shapes (with those already baked) and send the strip whole (behind a cut). */
  function prepareHeld(shapes = []) {
    const want = [...new Set([...heldShapes, ...shapes])].sort();
    if (held && want.join() === heldShapes.join()) return held;
    const t0 = performance.now(), S = heldStrip(ppm, { shapes: want });
    const tex = new THREE.DataTexture(new Uint8Array(S.pm.data.buffer), S.pm.w, S.pm.h);
    tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; tex.needsUpdate = true;
    const old = heldMat.uniforms.atlas.value;
    heldMat.uniforms.atlas.value = tex; heldMat.uniforms.size.value.set(S.pm.w, S.pm.h);
    if (old !== htex0) old.dispose();
    held = S; heldShapes = want;
    stats.held = { shapes: want, cards: S.index.size, px: [S.pm.w, S.pm.h], bytes: S.pm.w * S.pm.h * 4, bakeMs: Math.round(performance.now() - t0) };
    return held;
  }

  // ---------- the berths (a sleeper on a mattress: bedding.js, see the header) ----------
  const bw = Math.max(4, Math.round(BERTH_M[0] * ppm)), bh = Math.max(8, Math.round(BERTH_M[1] * ppm));
  const BCOLS = Math.floor(BERTH_ATLAS_PX / bw), BCELLS = BCOLS * Math.floor(BERTH_ATLAS_PX / bh);
  const batlas = new THREE.DataTexture(null, BERTH_ATLAS_PX, BERTH_ATLAS_PX);
  batlas.magFilter = batlas.minFilter = THREE.NearestFilter; batlas.generateMipmaps = false; batlas.colorSpace = THREE.SRGBColorSpace; batlas.flipY = false;
  batlas.source.dataReady = false; batlas.needsUpdate = true;
  const bgeo2 = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const bRect = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople * 4), 4), bTint = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople * 3), 3);
  // (bSee: 1 where the see-through may thin a berth, 0 for your own: lying in your rack, your berth is you, never a thing in front
  // of you; v0.0.25's fixer, the play review's "you strapped in are almost invisible" under the checkerboard)
  const bSee = new THREE.InstancedBufferAttribute(new Float32Array(maxPeople).fill(1), 1);
  bgeo2.setAttribute('aRect', bRect); bgeo2.setAttribute('aTint', bTint); bgeo2.setAttribute('aPartK', new THREE.InstancedBufferAttribute(new Float32Array(maxPeople), 1)); bgeo2.setAttribute('aSee', bSee);
  const berthMat = cardMaterial(batlas, BERTH_ATLAS_PX, BERTH_PART, { seeAttr: true });
  const berths = new THREE.InstancedMesh(bgeo2, berthMat, maxPeople);
  berths.frustumCulled = false; berths.count = 0; berths.userData.part = BERTH_PART;
  const berthCells = new Map();                                      // key → cell index
  function berthCell(o) {
    const key = sleeperKey(o);
    let c = berthCells.get(key);
    if (c !== undefined) return c;
    if (berthCells.size >= BCELLS) { const first = berthCells.keys().next().value; c = berthCells.get(first); berthCells.delete(first); } else c = berthCells.size;
    berthCells.set(key, c);
    const pm = paint(bw, bh, (px) => paintSleeper(px, bw, bh, { ...o, ppm }));
    const src = new THREE.DataTexture(new Uint8Array(pm.data.buffer), bw, bh);
    src.flipY = false;
    renderer.copyTextureToTexture(src, batlas, null, at.set((c % BCOLS) * bw, Math.floor(c / BCOLS) * bh));
    src.dispose();
    stats.berthsPainted = (stats.berthsPainted ?? 0) + 1;
    return c;
  }
  const HEAD_TURN = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 };
  const q4 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), ps = new THREE.Vector3();

  const group = new THREE.Group();
  group.name = 'figures';
  group.add(cards, blobs, flashes, berths, helds);

  const m4 = new THREE.Matrix4(), snap = (v) => Math.round(v * ppm) / ppm;
  /**
   * Draw these people: [{ key, look, x, z, y? (a lift: seat, bound, float, metres), floorY? (the floor they stand on: a deck), face, frame? | gait,
   * stride, tS, phase, tint: [r, g, b], own?, flash? }]. key: their look's (people dressed alike may share
   * one). Returns how many were drawn.
   */
  function update(people) {
    frameNo++;
    uploadsLeft = sheetsPerFrame; msLeft = budgetMs;
    stats.lastFrame = { uploads: 0, bytes: 0, paintMs: 0, uploadMs: 0 };
    let i = 0, nf = 0, nBerth = 0, nh = 0;
    stats.deferred = 0; stats.fallback = 0; stats.twin = 0; stats.sib = 0; stats.stanceFallback = 0; stats.heldDrawn = 0; stats.heldNone = 0;
    for (const p of people) {
      if (i >= maxPeople) break;
      if (p.lie) {
        // (a sleeper in a rack: the berth's quad, flat on the mattress, the head at its end; see the header)
        const c = berthCell(p.lie);   // (its breath, its curtain's step and whether it is thrown back are in the painting's key: bedding.js)
        q4.setFromAxisAngle(up, HEAD_TURN[p.lie.head] ?? 0);
        sc.set(bw / ppm, 1, bh / ppm);
        ps.set(snap(p.x), (p.lie.y ?? 0.5), snap(p.z));
        m4.compose(ps, q4, sc);
        berths.setMatrixAt(nBerth, m4);
        bRect.setXYZW(nBerth, (c % BCOLS) * bw, Math.floor(c / BCOLS) * bh, bw, bh);
        const t = p.tint ?? [1, 1, 1];
        bTint.setXYZ(nBerth, t[0], t[1], t[2]);
        bSee.setX(nBerth, p.own ? 0 : 1);
        nBerth++;
        continue;
      }
      const s = slotOf(p.key, p.look, p.own);
      if (!s) { stats.deferred++; continue; }
      if (s.ready && (uploadsLeft > 0 || p.own)) upload(s, s.ready);   // (a band painted last frame, its upload put off; yours never)
      let frame = p.frame ?? gaitFrame(p.gait ?? 'idle', p);
      const face = p.face ?? 'down';
      let band = BAND_OF[frame] ?? 'gait';
      let from = s;
      // (R8: a stance sheet's frame from the stance sheet's own slot (p.stanceKey, a base slot: VIEWS §3.10.8); its band not up
      // yet, the base sheet's stand-in (p.fallback: the Relaxed walk's frame, the rifle's own, the idle) meanwhile)
      let stanceUp = false;
      if (POOL_OF[band] === 'stance') {
        const ss = p.stanceKey ? slotOf(p.stanceKey, p.stanceLook, p.own) : null;
        if (ss && ensureBand(ss, band, p.own)) { from = ss; stanceUp = true; }
        else { frame = p.fallback ?? 'idle0'; band = BAND_OF[frame] ?? 'gait'; stats.stanceFallback = (stats.stanceFallback ?? 0) + 1; }
      }
      // (F73: a carry-free band not on this sheet but on the same figure's sheet in another gait carry (p.sibs: the same
      // pixels, the rework's R2) is drawn from that one, yours too, rather than painted now and sent whole mid-lane (the bench's
      // house-kit and house-live sent your look's rifle band, 144 KB, the first time you walked at the high ready))
      const sib0 = !stanceUp && !s.bands.has(band) && CARRY_FREE.has(band) && p.sibs ? p.sibs.map(k => slots.get(k)).find(x => x?.bands.has(band)) ?? null : null;
      if (sib0) { from = sib0; sib0.seen = frameNo; stats.sib = (stats.sib ?? 0) + 1; }
      else if (!stanceUp && !ensureBand(s, band, p.own)) {
        // (its band not up yet: its twin's (the same figure with the magazine in or out, p.twin) if that one has it, so a
        // prone shooter changing magazines never stands up for the frames the new sheet takes (the 0.0.7 integrator's);
        // a carry-free band from the sheet of the same figure in another gait carry (p.sibs: the same pixels, the rework's
        // R2); else standing in the gait's frames meanwhile, if those are; else not drawn yet)
        const t = p.twin ? slots.get(p.twin) : null;
        const sib = CARRY_FREE.has(band) && p.sibs ? p.sibs.map(k => slots.get(k)).find(x => x?.bands.has(band)) ?? null : null;
        if (t && t.bands.has(band)) { from = t; t.seen = frameNo; stats.twin = (stats.twin ?? 0) + 1; }
        else if (sib) { from = sib; sib.seen = frameNo; stats.sib = (stats.sib ?? 0) + 1; }
        else if (band !== 'gait' && (s.bands.has('gait') || ensureBand(s, 'gait', p.own))) { frame = 'idle0'; band = 'gait'; stats.fallback++; }
        else { stats.deferred++; continue; }
      }
      p.drawnFrame = frame;
      const c = lay.cells.get(`${frame}|${face}`) ?? lay.cells.get(`idle0|down`);
      const [ox, oy] = originOf(from, band);
      // (see the header: the anchor's row on the spot; the card's lowest rows above the floor)
      // (a floating body past the float's scale height one step larger, nearer the camera (view.js FLOAT_SCALE_K: float-look's
      // F-b), its card a whole number of pixels on each side so it stays on the grid; every other card at 1 as before)
      const sk = p.scaleK ?? 1, cw = sk === 1 ? c.w : Math.round(c.w * sk), chh = sk === 1 ? c.h : Math.round(c.h * sk), cay = sk === 1 ? c.ay : Math.round(c.ay * sk), cax = sk === 1 ? c.ax : Math.round(c.ax * sk);
      const nb = (chh - cay) / ppm, ys = p.y ?? 0, yb = snap(Math.max(0, ys - nb)), zc = snap(p.z - ys + yb + nb);
      const left = snap(p.x) - cax / ppm;
      // (a card on a face turned about its anchor (see the header); a sub-card (the held device, the flash) by the same map. A
      // card flipped top to bottom is flipped in its atlas rectangle (a negative height: the quad's winding kept, so it is never culled
      // as a back face), its anchor then cay rows over its foot; the quarter turn is the quad's)
      const flip = !!p.flip, TT = p.turn || flip ? cardTurn({ cw, ch: chh, ax: cax, ay: flip ? cay : chh - cay, quarter: p.turn ?? 0, at: { x: p.x, y: ys, z: p.z }, ppm }) : null;
      const sub = (ox, oy0, w, h, toward = null) => {
        const oy = flip ? chh - oy0 - h : oy0, u0 = ox / cw, v0 = 1 - (oy + h) / chh, su = w / cw, sv = h / chh;
        m4.set(TT.a * su, TT.b * sv, 0, TT.a * u0 + TT.b * v0 + TT.tx, TT.c * su, TT.d * sv, 0, TT.c * u0 + TT.d * v0 + TT.ty, 0, 0, 1, TT.tz, 0, 0, 0, 1);
        if (toward) { m4.elements[12] += toward.x; m4.elements[13] += toward.y; m4.elements[14] += toward.z; }
        return m4;
      };
      if (TT) sub(0, 0, cw, chh);
      else m4.makeScale(cw / ppm, chh / ppm, 1).setPosition(left, yb, zc);
      cards.setMatrixAt(i, m4);
      if (flip) aRect.setXYZW(i, ox + c.x, oy + c.y + c.h, c.w, -c.h);
      else aRect.setXYZW(i, ox + c.x, oy + c.y, c.w, c.h);
      const t = p.tint ?? [1, 1, 1];
      aTint.setXYZ(i, t[0], t[1], t[2]);
      aPartK.setX(i, i % PEOPLE_PARTS);
      // (the blob: under the body on the floor; long under a body lying side on, deep under one lying end on)
      const lift = Number.isFinite(p.blobLift) ? p.blobLift : c.kind === 'float' ? ys : Math.max(0, ys - (p.seat ?? 0)), floorY = p.floorY ?? 0;
      let bx = snap(p.x), bz = snap(p.z), sx = 1, sz = 1;
      if (c.kind === 'long') { bx = left + c.w / 2 / ppm; sx = 2.3; sz = 0.9; }
      else if (c.kind === 'tall') { bz = snap(p.z) - c.ay / 2 / ppm; sx = 0.95; sz = 3.2; }
      const k = 1 / (1 + 0.6 * lift);
      // (a man standing on the floor, his card upright and whole, casts his shadow (faces.js SHADOW_*); else the ellipse)
      const cast = !p.noBlob && !TT && sk === 1 && lift === 0 && !p.float && !p.ring && (p.seat ?? 0) === (p.floorY ?? 0) && c.kind !== 'long' && c.kind !== 'tall' && c.kind !== 'float';
      if (cast) {
        const sz0 = snap(p.z), qw = (c.w + CAST_W_PX) / ppm, qd = CAST_D_PX / ppm;
        m4.makeScale(qw, 1, qd).setPosition(left - 1 / ppm + qw / 2, floorY + 0.012, sz0 - 1 / ppm + qd / 2);
        aCast.setXYZW(i, left, sz0, c.ay, 1);
      } else {
        m4.makeScale(0.84 * sx * k, 1, 0.504 * sz * k).setPosition(bx, floorY + 0.012, bz);
        aCast.setXYZW(i, 0, 0, 0, 0);
      }
      blobs.setMatrixAt(i, m4);
      aAlpha.setX(i, p.noBlob ? 0 : cast ? SHADOW_A : Math.max(0.15, 0.4 - 0.083 * lift));
      aRing.setX(i, p.ring ? 1 : 0);
      // (the device in the hands, its card by the frame drawn; none where the body hides it whole)
      if (p.held) {
        if (!held || !heldShapes.includes(p.held.shape)) { prepareHeld([p.held.shape]); stats.heldLate = (stats.heldLate ?? 0) + 1; }
        const hc = held.index.get(heldKey(p.held.shape, p.held.colour, frame, face));
        if (hc?.w) {
          if (TT) sub(hc.ox, hc.oy, hc.w, hc.h, HELD_TOWARD);
          else {
            m4.makeScale(hc.w / ppm, hc.h / ppm, 1).setPosition(left + hc.ox / ppm, yb + (c.h - hc.oy - hc.h) / ppm, zc);
            m4.elements[12] += HELD_TOWARD.x; m4.elements[13] += HELD_TOWARD.y; m4.elements[14] += HELD_TOWARD.z;
          }
          helds.setMatrixAt(nh, m4);
          if (flip) hRect.setXYZW(nh, hc.x, hc.y + hc.h, hc.w, -hc.h);
          else hRect.setXYZW(nh, hc.x, hc.y, hc.w, hc.h);
          hTint.setXYZ(nh, t[0], t[1], t[2]);
          hPartK.setX(nh, i % PEOPLE_PARTS);
          nh++; stats.heldDrawn++;
        } else stats.heldNone++;
      }
      // (the flash: its card over the muzzle, a little toward the camera, or behind the head from behind)
      const gun = s.look.weapon;
      if (p.flash && gun && nf < MAX_FLASHES) {
        const fl = strip.index.get(`${gun}|${face}|${frame}`);
        if (fl) {
          const kk = fl.behind ? -1 : 1;
          if (TT) sub(fl.ox, fl.oy, FS, FS, { x: TOWARD.x * kk, y: TOWARD.y * kk, z: TOWARD.z * kk });
          else {
            const fy = yb + (c.h - fl.oy - FS) / ppm;
            m4.makeScale(FS / ppm, FS / ppm, 1).setPosition(left + fl.ox / ppm, fy, zc);
            m4.elements[12] += TOWARD.x * kk; m4.elements[13] += TOWARD.y * kk; m4.elements[14] += TOWARD.z * kk;
          }
          flashes.setMatrixAt(nf, m4);
          aSlot.setX(nf, fl.slot);
          nf++;
        }
      }
      i++;
    }
    cards.count = blobs.count = i; flashes.count = nf; berths.count = nBerth; helds.count = nh;
    // (only the instances drawn are sent: a frame's few hundred bytes, not MAX_PEOPLE's 16 KB a matrix buffer)
    for (const [a, n] of [[cards.instanceMatrix, i], [blobs.instanceMatrix, i], [flashes.instanceMatrix, nf], [aRect, i], [aTint, i], [aPartK, i], [aAlpha, i], [aRing, i], [aCast, i], [aSlot, nf], [berths.instanceMatrix, nBerth], [bRect, nBerth], [bTint, nBerth], [bSee, nBerth], [helds.instanceMatrix, nh], [hRect, nh], [hTint, nh], [hPartK, nh]]) {
      if (!n) continue;
      a.clearUpdateRanges(); a.addUpdateRange(0, n * a.itemSize); a.needsUpdate = true;
    }
    stats.drawn = i + nBerth; stats.lying = nBerth;
    return i + nBerth;
  }

  /** Whether a look's band is on the GPU (for tests and warm-ups). */
  const ready = (key, band = 'gait') => !!slots.get(key)?.bands.has(band);
  /** Paint and send a look's bands now, whatever the budget (a load screen's warm-up). */
  function warm(key, look, bands = ['gait']) {
    const s = slotOf(key, look, true);
    for (const b of bands) {
      uploadsLeft = Math.max(uploadsLeft, 1);
      if (painter && !s.bands.has(b)) upload(s, bandOf(painter.runNow('sheet', { look: s.raw, band: b, ppm })));
      else ensureBand(s, b, true);
    }
    return s;
  }
  /**
   * Ask the paint worker for a look's bands behind a cut (priority 'own' for the player's): resolves once
   * they are on the GPU, sent at once rather than through the queue (a cut allows whole uploads: TECH §9.7).
   */
  function prepare(key, look, { bands = ['gait'], own = false } = {}) {
    const s = slotOf(key, look, true);
    // (no sheet free for it (every slot a look drawn this frame holds): nothing prepared, drawn when one frees, never a throw)
    if (!s) return Promise.resolve(null);
    if (own) s.own = true;
    if (!painter) { warm(key, look, bands); return Promise.resolve(s); }
    // (a rifle sheet taken for its rifle bands if one is free (none is taken from a look drawn this frame))
    if (bands.some(b => POOL_OF[b] === 'rifle')) rifleSlotOf(s);
    // (a band already on its way is waited for; if it would go through the queue, it is sent as soon as it lands)
    return Promise.all(bands.filter(b => !s.bands.has(b)).map(b => ask(s, b, own ? 'own' : 'visible', { direct: true }).then(() => {
      const g = s.got.get(b);
      if (g && !s.bands.has(b)) { s.got.delete(b); uploads?.cancel(`fig:${s.slot}:${b}`); upload(s, g); }
    }))).then(() => s);
  }
  function dispose() {
    geo.dispose(); material.dispose(); bgeo.dispose(); bmat.dispose(); fgeo.dispose(); fmat.dispose(); ftex.dispose(); atlas.dispose();
    bgeo2.dispose(); berthMat.dispose(); batlas.dispose(); hgeo.dispose(); heldMat.uniforms.atlas.value.dispose(); heldMat.dispose(); htex0.dispose();
    group.removeFromParent();
  }
  group.userData.dispose = dispose;
  return { group, cards, blobs, flashes, berths, helds, update, warm, prepare, prepareHeld, get held() { return held; }, ready, stats, atlas, layout: lay, slots, dispose, COLS, ROWS, SLOTS, RCOLS, RSLOTS, RY0, ppm, material, bmat, fmat, berthMat, heldMat };
}

/**
 * The cards' material: an upright (or, for the berths, a lying) quad per instance reading its rectangle
 * of an atlas (aRect, texels, rows top-down), tinted by the light where it stands (aTint), writing the
 * given part (one program for every card material: its source is the same).
 */
/** The held cards' material: cardMaterial's, over a strip w × h (not square). */
function stripMaterial(tex, [w, h], part) {
  return new THREE.ShaderMaterial({
    uniforms: { atlas: { value: tex }, size: { value: new THREE.Vector2(w, h) }, part: { value: part } },
    defines: { OLY_SEE: '' },
    vertexShader: /* glsl */`
      attribute vec4 aRect; attribute vec3 aTint; attribute float aPartK;
      varying vec2 vPx; varying vec3 vTint; varying vec3 vOlyWorld; flat varying float vOlyPart;
      uniform float part;
      void main() {
        vPx = aRect.xy + vec2(uv.x, 1.0 - uv.y) * aRect.zw;
        vTint = aTint; vOlyPart = part + aPartK * ${PEOPLE_PART_STEP.toFixed(1)};
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vOlyWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      ${FRAG_DECL}
      uniform sampler2D atlas; uniform vec2 size;
      varying vec2 vPx; varying vec3 vTint;
      void main() {
        olySee(vOlyWorld);
        vec4 c = texture2D(atlas, (floor(vPx) + 0.5) / size);
        if (c.a < 0.5) discard;
        gl_FragColor = vec4(c.rgb * vTint, 1.0);
        pc_fragId = olyId(vOlyPart, olyFlag);
      }`,
  });
}
function cardMaterial(atlas, size, part, { seeAttr = false } = {}) {
  // (seeAttr: an instance attribute aSee, 0 where the see-through leaves the instance whole (your own berth), else 1)
  return new THREE.ShaderMaterial({
    uniforms: { atlas: { value: atlas }, size: { value: size }, part: { value: part } },
    defines: { OLY_SEE: '' },
    vertexShader: /* glsl */`
      attribute vec4 aRect; attribute vec3 aTint; attribute float aPartK;${seeAttr ? ' attribute float aSee;' : ''}
      varying vec2 vPx; varying vec3 vTint; varying vec3 vOlyWorld; flat varying float vOlyPart; varying float vSee;
      uniform float part;
      void main() {
        vPx = aRect.xy + vec2(uv.x, 1.0 - uv.y) * aRect.zw;          // (atlas pixels, rows top-down as painted)
        vSee = ${seeAttr ? 'aSee' : '1.0'};
        vTint = aTint; vOlyPart = part + aPartK * ${PEOPLE_PART_STEP.toFixed(1)};
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vOlyWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      ${FRAG_DECL}
      uniform sampler2D atlas; uniform float size;
      varying vec2 vPx; varying vec3 vTint; varying float vSee;
      void main() {
        if (vSee > 0.5) olySee(vOlyWorld);
        vec4 c = texture2D(atlas, (floor(vPx) + 0.5) / size);
        float a = floor(c.a * 255.0 + 0.5);
        if (a < 128.0) discard;
        // (a glow class in the alpha: a lamp, a display, drawn unlit; the rest lit by where they stand)
        gl_FragColor = vec4(a < 248.0 || a > 254.5 ? c.rgb * vTint : c.rgb, 1.0);
        pc_fragId = olyId(vOlyPart, olyFlag);
      }`,
  });
}
