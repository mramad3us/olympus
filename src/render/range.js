// OLYMPUS render: the range in play. The holes in the cards, the red flag, the brass in flight and at rest.
//
// The build sheet 0.0.5 §2.3 (c): what moves on the KD range's 25 m line is drawn from the arms role's
// rangeLook(state, ms) (src/sim/arms/look.js; the stage reads it at ms = clock.ms + alpha × TICK_MS, so
// stop motion freezes it), over the bay the kit built (src/art/kit/range.js; src/data/places/range.js):
//   - THE HOLES: ink pixels on each lane's card, where the shot role's paper put them (paper.js holeOf: cm
//     from the card's centre, x right, y down), at the card's own scale (the kit's cardPxPerCm: the card is
//     drawn CARD_K times life size, so a 4-ring hit lands within two pixels of the centre and a string
//     spreads across the black), through the black a pale pixel (the paper's fibres), through the white a
//     dark one (tradecraft's paperFrame rule); a hole new to the view puffs paper round it for PUFF_MS of
//     game time (the round's arrival, 32 ms after the shot at 25 m: seen while the fire step plays); the
//     newest hole's number and ring are the hud's PAPER inset;
//   - THE RED FLAG: flown from the tower's pole while the line is hot (and the line's two, LINE_FLAGS, at
//     its ends, in the frame the weapon mode shows), hoisted over FLAG_HOIST_MS of game
//     time from the moment the line went hot and lowered the same way when it goes cold (never popping in
//     or out; a line first seen hot, a scene that opens hot, shows it flying), its cloth stirring between
//     two shapes every FLAG_FLAP_MS of game time;
//   - THE BLAST: your shot's flash star at the drawn muzzle, over the figure's head, for two ticks, and the
//     regolith it throws up in front of a prone or kneeling muzzle, motes falling at 0.38 g and settling
//     (range-items.js flashPixels, dustPixels: the design review's, a shot that did not read at 16 px/m);
//   - THE BRASS: each case where caseAt has it, in flight two bright pixels turning end over end (its glint
//     by its spin, white on its first tick out of the port), at rest a two-pixel case lying along its spin
//     (a live round brass and copper, the dummy orange). The
//     sim's flight is a real body's (the port at 1.4 m standing: WEAPONS §2.8); the chibi holds its rifle
//     lower (its bore about 0.85 m standing), so a case's height is drawn through the line from the sim's
//     port heights to the chibi's drawn bore at each stance (range-items.js drawnY), starting at the drawn
//     port and landing where and when the sim says (my call: the tick on the regolith and the case lying
//     agree with the picture).
// One instanced draw of pixels (src/render/decals.js createPixels), lit where each pixel is.
// 0.0.7 (the build sheet 0.0.7 §2.4 (b), (c)): the KD ground in play, from rangeLook.kd (look.js, the range role's):
//   - THE FACES on their carriers: one small batch of the kit's own (src/art/jobs.js's collector, a moving piece
//     a face, so each is its own mesh, frustum-culled, in the batch's program: no new one), built once when the
//     KD is first seen, each face painted FACE_K times life size (art/kit/range.js paintKdFace) and raised or
//     lowered every frame where its carrier has it (range-items.js kdFaceAt: rangeLook's up, 0 to 1 over
//     CARRIER_S, never a pop; a face down is under the ground, which hides it as the pits' parapet hides it
//     from the line); on each the holes the pits show, the spotter in the last, the score disk on its pole
//     (rising and going down over DISK_RISE_MS) and a miss's red flag waved across it;
//   - THE FLAGS along both sides of the range, each sleeve blowing by flagOf (the sim's wind: its way and its
//     strength, so the wind reads off them as a marine reads it): its hoop, its bands filling with the speed and
//     its shadow on the ground downwind (range-items.js sleevePixels: the shadow flat, with no line round it);
//   - YOUR POINT: the numbered stake on your row marked yours, a brass frame round its plate and a caret over it
//     (range-items.js ownPointPixels; 0.0.7's tower fixer), on the 25 m bay too (rangeLook.own, 0.0.8: stats.own);
//   - THE RELAY: every shooter's flash star and blast dust from fires (their last 1.2 s), the cases flying and,
//     at rest, by metre tile (rangeLook.kd.tiles: none lost past the session's 64 live cases), and the dust a
//     round throws off the berm.
// 0.0.8 (the build sheet 0.0.8 §2.4; VIEWS §7.4, §11): the pairs pad's turning targets, from rangeLook.pairs (look.js, the
// scene role's): each turner's face drawn TURNER_K times life size and as wide as it has turned (range-items.js
// turnerPixels: facingK 0 edge-on, a pixel of its edge, to 1 facing; continuous over the turner's real TURN_MS, so it
// never jumps), its holes, a new hole's puff, the armoured face's head plate dropping off, and the steel's spark
// (sparkPixels: unlit, in the blast's draw after the figures) for a round that rang. Stands with no face hung draw
// nothing here (the kit's stand alone shows), so test-handling and test-range look as they were scored.
// What is drawn is culled to the views given (the frame, and the far window's while it is open), so a flag 300 m
// off costs nothing until the window looks at it.
import { PX_PER_M } from './scale.js';
import { createPixels } from './decals.js';
import { holePixel, flagPixels, brassPixels, flashPixels, dustPixels, tracePixels, PALE, DARK, PUFF_MS, FLAG_HOIST_MS, FLAG_PART,
  kdFaceAt, kdHolePixel, spotterPixels, diskPixels, missFlagPixels, sleevePixels, tilePixels, bermDustPixels, poleUp, turnerPixels, sparkPixels, turnerAt, ownPointPixels } from './range-items.js';
import { createCollector, buildAreaData } from '../art/jobs.js';
import { areaFromJob, newPart } from './batch.js';
import { paintKdFace, facePx } from '../art/kit/range.js';
import { LINE_FLAGS, LINE_FLAG } from '../data/places/range.js';
export { cardFace, holePixel, flagPixels, brassPixels, flashPixels, dustPixels, tracePixels, drawnY, drawnBoreM, drawnMuzzleM, FLAG_HOIST_MS, FLAG_FLAP_MS, PUFF_MS, FLAG_PART } from './range-items.js';

/** The most pixels the range draws a frame (six cards of holes, the flags, 64 cases at two pixels, the dust; 0.0.8 six turners' faces, 360 px each at 16 px/m), and the flash star's. */
export const MAX_RANGE_PIXELS = 6000, BLAST_PIXELS = 256;
/** How far outside a view a thing still drawn may stand (metres: a flag's sleeve 4.5 m up, a face's disk). */
export const VIEW_MARGIN_M = 8;
const inViews = (views, x, z) => !views || views.some(v => x > v.x0 - VIEW_MARGIN_M && x < v.x1 + VIEW_MARGIN_M && z > v.z0 - VIEW_MARGIN_M && z < v.z1 + VIEW_MARGIN_M + 6);

/**
 * The range on a stage: { group, update(look, { kd, ms, tintOf }), stats, dispose }. look: rangeLook(state,
 * ms) or null (nothing drawn); kd: KD_RANGE; tintOf(x, z) the light there.
 */
export function createRange(stage, { ppm = stage.ppm ?? PX_PER_M } = {}) {
  const THREE = stage.THREE, px = createPixels(THREE, MAX_RANGE_PIXELS, { ppm, order: 1 });
  // (the flash star its own draw after the figures, so it lies over the head: the figures' cards are drawn in
  // three.js's transparent pass, which comes after every opaque draw whatever its order, and write no depth)
  const blast = createPixels(THREE, BLAST_PIXELS, { ppm, order: 3 });
  blast.mesh.material.transparent = true; blast.mesh.material.depthWrite = false;
  const group = new THREE.Group();
  group.name = 'range';
  group.add(px.mesh, blast.mesh);
  const stats = { holes: 0, brass: 0, flying: 0, flag: 0, flash: 0, dust: 0, own: 0, pixels: 0, kd: null, pairs: null };
  // ---------- the KD's faces: a moving piece each, built once ----------
  let faces = null;                                                 // { built, byLane: Map lane → { group, paper } }
  const discs = new Map(), misses = new Map();                     // (lane → { value, sinceMs, untilMs }: the disk and the flag going down after the look drops them)
  function buildFaces(list) {
    const col = createCollector({ ppm, part: newPart }), byLane = new Map();
    const painters = {};
    for (const f of list) {
      const paper = f.paper ?? 'kdA', n = facePx(paper, ppm), h = n / ppm / 2;
      painters[paper] ??= (px) => paintKdFace(px, 0, 0, ppm, paper);
      col.prop({ id: `face:${f.lane}`, kind: 'face', lane: f.lane, pivot: [f.x, f.z] });
      col.box({ x0: -h, x1: h, y0: 0, y1: 2 * h, z0: -0.01, z1: 0.01, faces: { front: painters[paper], back: 0x8c6d59, sides: 0x8c6d59, top: 0x8c6d59 } });
      col.endProp();
      byLane.set(f.lane, { paper });
    }
    const g = buildAreaData(col, { name: 'kd-faces' });
    let r; do { r = g.next(); } while (!r.done);
    const built = areaFromJob(r.value, { name: 'kd-faces', see: false });
    built.upload(stage.renderer); built.atlas.release();
    for (const p of built.props) { const e = byLane.get(p.lane); if (e) e.group = p.group; for (const m of p.group.children) { m.castShadow = false; m.receiveShadow = true; } }
    group.add(built.group);
    return { built, byLane };
  }
  // (the flag's hoist: from where it was when the line last changed, toward up or down, on game time)
  let hot = false, fromK = 0, sinceMs = null, seen = false;
  const holesSeen = new Map();                                      // (lane|n|xCm|yCm → the game time it was first drawn)
  const hoistAt = (ms) => { if (sinceMs === null) return hot ? 1 : 0; const t = Math.max(0, Math.min(1, (ms - sinceMs) / FLAG_HOIST_MS)); return hot ? fromK + (1 - fromK) * t : fromK * (1 - t); };
  function update(look, { kd = null, ms = 0, tintOf = null, views = null } = {}) {
    let n = 0, nb = 0;
    const put = (p, part = 0, noLine = false) => { if (px.set(n, { ...p, color: p.c, tint: tintOf ? tintOf(p.x, p.z) : [1, 1, 1], part, noLine })) n++; };
    stats.holes = stats.brass = stats.flying = stats.flag = stats.flash = stats.dust = stats.own = 0;
    if (look && kd) {
      const seen0 = seen;
      if (!seen) { seen = true; hot = !!look.hot; sinceMs = null; }
      else if (!!look.hot !== hot) { fromK = hoistAt(ms); hot = !!look.hot; sinceMs = ms; }
      const lanes = new Map(kd.bay.lanes.map(l => [l.lane, l]));
      for (const l of look.lanes ?? []) {
        const t = lanes.get(l.lane)?.target;
        if (!t) continue;
        for (const h of l.holes ?? []) {
          const q = holePixel(t, h, ppm);
          if (!q) continue;
          put({ ...q, c: q.black ? PALE : DARK }, 0, true); stats.holes++;
          const key = `${l.lane}|${h.n}|${h.xCm}|${h.yCm}`;
          if (!holesSeen.has(key)) holesSeen.set(key, seen0 ? ms : -Infinity);
          const age = ms - holesSeen.get(key);
          if (age >= 0 && age < PUFF_MS) for (const [dx, dy] of age < PUFF_MS / 2 ? [[1, 0], [-1, 0], [0, -1]] : [[1, -1], [-1, -1]]) put({ x: q.x + dx / ppm, y: q.y - dy / ppm, z: q.z, c: PALE }, 0, true);
        }
      }
      const k = hoistAt(ms);
      for (const p of flagPixels(kd.tower.flag, k, ms, ppm)) { put(p, FLAG_PART); stats.flag++; }
      for (const pole of LINE_FLAGS) for (const p of flagPixels(pole, k, ms, ppm, LINE_FLAG)) { put(p, FLAG_PART + 1); stats.flag++; }
      for (const b of look.brass ?? []) { for (const p of brassPixels(b, ppm, ms)) put(p); stats.brass++; if (!b.rest) stats.flying++; }
      // (your bay lane's stake marked as yours on the 25 m line, as on the KD's (0.0.8))
      if (look.own && inViews(views, look.own.x, look.own.z)) for (const q of ownPointPixels(look.own, ppm)) { put(q, 0, true); stats.own++; }
      // (the blast: noLine, so the outline pass draws no line round the star or the motes; the star unlit, a light itself)
      const flash = flashPixels(look.fire, ms, ppm), dust = dustPixels(look.fire, ms, ppm);
      for (const p of dust) put(p, 0, true);
      // (a tracer's ember to its card (0.0.6): unlit, a light of its own, no outline)
      const lane = look.fire?.lane ? lanes.get(look.fire.lane) : null;
      for (const p of tracePixels(look.fire, ms, ppm, lane?.target ?? null)) put(p, 0, true);
      flash.forEach((p, i) => blast.set(i, { ...p, color: p.c, part: 0, noLine: true }));
      nb = flash.length;
      stats.flash = flash.length; stats.dust = dust.length;
      // ---------- the KD ground (0.0.7) ----------
      const K = look.kd ?? null;
      if (K) {
        const ks = { faces: 0, up: 0, holes: 0, spotters: 0, disks: 0, misses: 0, flags: 0, fires: 0, cases: 0, tiles: 0, dust: 0, own: 0, carriers: [] };
        if (!faces && K.faces?.length) faces = buildFaces(K.faces);
        for (const f of K.faces ?? []) {
          const fa = kdFaceAt(f, ppm), e = faces?.byLane.get(f.lane);
          if (e?.group) {
            const px0 = fa.x0 + fa.n / ppm / 2;
            if (e.group.position.x !== px0 || e.group.position.y !== fa.yBot || e.group.position.z !== fa.z) { e.group.position.set(px0, fa.yBot, fa.z); e.group.updateMatrixWorld(true); }
          }
          ks.faces++; if ((f.up ?? 1) >= 1) ks.up++;
          ks.carriers.push({ lane: f.lane, up: f.up ?? 1, yTop: fa.yTop });
          if (!inViews(views, f.x, f.z)) continue;
          for (const h of f.holes ?? []) { const q = kdHolePixel(fa, h, ppm); if (q && q.y > 0) { put({ ...q, c: q.black ? PALE : DARK }, 0, true); ks.holes++; } }
          for (const q of spotterPixels(fa, f.spotter, ppm)) if (q.y > 0) { put(q, 0, true); ks.spotters++; }
          // (the disk: up while the look gives it, then down over DISK_RISE_MS; the miss's flag the same)
          const d0 = discs.get(f.lane);
          if (f.disk) discs.set(f.lane, { value: f.disk.value, sinceMs: f.disk.sinceMs ?? ms, untilMs: null });
          else if (d0 && d0.untilMs === null) d0.untilMs = ms;
          const d = discs.get(f.lane);
          if (d) { const k = poleUp(d.sinceMs, ms, d.untilMs); if (k > 0) { for (const q of diskPixels(fa, d.value, k, ppm)) put(q, FLAG_PART + 2, false); ks.disks++; } else if (d.untilMs !== null) discs.delete(f.lane); }
          const m0 = misses.get(f.lane);
          if (Number.isFinite(f.flagSinceMs)) misses.set(f.lane, { sinceMs: f.flagSinceMs, untilMs: null });
          else if (m0 && m0.untilMs === null) m0.untilMs = ms;
          const m = misses.get(f.lane);
          if (m) { const k = poleUp(m.sinceMs, ms, m.untilMs); if (k > 0) { for (const q of missFlagPixels(fa, k, ms, ppm)) put(q, FLAG_PART + 3, false); ks.misses++; } else if (m.untilMs !== null) misses.delete(f.lane); }
        }
        // (your own point's stake marked as yours: a brass frame and a caret (range-items.js ownPointPixels))
        if (K.own && inViews(views, K.own.x, K.own.z)) for (const q of ownPointPixels(K.own, ppm)) { put(q, 0, true); ks.own++; }
        for (const fl of K.flags ?? []) { if (!inViews(views, fl.x, fl.z)) continue; for (const q of sleevePixels(fl, ms, ppm)) put(q, q.shadow ? 0 : FLAG_PART + 4, !!q.shadow); ks.flags++; }
        for (const fire of K.fires ?? []) {
          if (!inViews(views, fire.x, fire.z)) continue;
          if (look.fire && fire.atMs === look.fire.atMs && Math.abs(fire.x - look.fire.x) < 0.01 && Math.abs(fire.z - look.fire.z) < 0.01) continue;   // (yours: drawn above)
          ks.fires++;
          for (const q of dustPixels(fire, ms, ppm)) put(q, 0, true);
          for (const q of flashPixels(fire, ms, ppm)) { if (blast.set(nb, { ...q, color: q.c, part: 0, noLine: true })) nb++; }
        }
        for (const b of K.brass ?? []) { if (!inViews(views, b.x, b.z)) continue; for (const q of brassPixels(b, ppm, ms)) put(q); ks.cases++; }
        for (const t of K.tiles ?? []) { if (!inViews(views, t.x, t.z)) continue; for (const q of tilePixels(t, ppm)) put(q); ks.tiles++; }
        for (const d of K.dust ?? []) { if (!inViews(views, d.x, d.z)) continue; for (const q of bermDustPixels(d, ms, ppm)) { put(q, 0, true); ks.dust++; } }
        stats.kd = ks;
        if (faces) faces.built.group.visible = true;
      } else { stats.kd = null; if (faces) faces.built.group.visible = false; }
      // ---------- the pairs pad (0.0.8): the turners' faces, their holes, the steel's spark ----------
      const PR = look.pairs ?? null;
      if (PR) {
        const ps = { turners: 0, hung: 0, facing: 0, pixels: 0, holes: 0, sparks: 0, widths: [] };
        for (const t of PR.turners ?? []) {
          ps.turners++;
          if (!t.face) continue;
          ps.hung++;
          const ta = turnerAt(t, ppm);
          ps.widths.push({ lane: t.lane, dw: ta.dw, facingK: Math.round((t.facingK ?? 0) * 1000) / 1000 });
          if ((t.facingK ?? 0) >= 0.999) ps.facing++;
          if (!inViews(views, t.x, t.z)) continue;
          for (const p of turnerPixels(t, ms, ppm)) { put(p, p.part, p.noLine); ps.pixels++; }
          ps.holes += (t.holes ?? []).length;
          for (const h of t.holes ?? []) if (h.ring) for (const q of sparkPixels(t, h, ms, ppm)) { if (blast.set(nb, { ...q, color: q.c, part: 0, noLine: true })) { nb++; ps.sparks++; } }
        }
        stats.pairs = ps;
      } else stats.pairs = null;
    } else { hot = false; sinceMs = null; fromK = 0; seen = false; holesSeen.clear(); if (faces) faces.built.group.visible = false; stats.kd = null; stats.pairs = null; }
    px.count(n);
    blast.count(nb);
    stats.pixels = n + nb;
    return stats;
  }
  return { group, update, stats, pixels: px, blast, get faces() { return faces; }, dispose() { px.dispose(); blast.dispose(); faces?.built.dispose(); group.removeFromParent(); } };
}
