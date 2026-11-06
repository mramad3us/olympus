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
import { PX_PER_M } from './scale.js';
import { createPixels } from './decals.js';
import { holePixel, flagPixels, brassPixels, flashPixels, dustPixels, PALE, DARK, PUFF_MS, FLAG_HOIST_MS, FLAG_PART } from './range-items.js';
import { LINE_FLAGS, LINE_FLAG } from '../data/places/range.js';
export { cardFace, holePixel, flagPixels, brassPixels, flashPixels, dustPixels, drawnY, drawnBoreM, drawnMuzzleM, FLAG_HOIST_MS, FLAG_FLAP_MS, PUFF_MS, FLAG_PART } from './range-items.js';

/** The most pixels the range draws a frame (six cards of holes, the flags, 64 cases at two pixels, the dust), and the flash star's. */
export const MAX_RANGE_PIXELS = 1700, BLAST_PIXELS = 32;

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
  const stats = { holes: 0, brass: 0, flying: 0, flag: 0, flash: 0, dust: 0, pixels: 0 };
  // (the flag's hoist: from where it was when the line last changed, toward up or down, on game time)
  let hot = false, fromK = 0, sinceMs = null, seen = false;
  const holesSeen = new Map();                                      // (lane|n|xCm|yCm → the game time it was first drawn)
  const hoistAt = (ms) => { if (sinceMs === null) return hot ? 1 : 0; const t = Math.max(0, Math.min(1, (ms - sinceMs) / FLAG_HOIST_MS)); return hot ? fromK + (1 - fromK) * t : fromK * (1 - t); };
  function update(look, { kd = null, ms = 0, tintOf = null } = {}) {
    let n = 0, nb = 0;
    const put = (p, part = 0, noLine = false) => { if (px.set(n, { ...p, color: p.c, tint: tintOf ? tintOf(p.x, p.z) : [1, 1, 1], part, noLine })) n++; };
    stats.holes = stats.brass = stats.flying = stats.flag = stats.flash = stats.dust = 0;
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
      // (the blast: noLine, so the outline pass draws no line round the star or the motes; the star unlit, a light itself)
      const flash = flashPixels(look.fire, ms, ppm), dust = dustPixels(look.fire, ms, ppm);
      for (const p of dust) put(p, 0, true);
      flash.forEach((p, i) => blast.set(i, { ...p, color: p.c, part: 0, noLine: true }));
      nb = flash.length;
      stats.flash = flash.length; stats.dust = dust.length;
    } else { hot = false; sinceMs = null; fromK = 0; seen = false; holesSeen.clear(); }
    px.count(n);
    blast.count(nb);
    stats.pixels = n + nb;
    return stats;
  }
  return { group, update, stats, pixels: px, blast, dispose() { px.dispose(); blast.dispose(); group.removeFromParent(); } };
}
