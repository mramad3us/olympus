// OLYMPUS data: the known-distance range's 25 m bay and its tower, outside Base Melas's East gate (PLACES §4.12, the build sheet 0.0.5 §2.3).
//
// The KD range (X3 on the site plan, x 1,060 to 1,640 and z 280 to 420) fires east, so the figures on
// its line are seen side on (PLACES §4.12: side-on figures read the aim best). Its 200, 300 and 500 m
// lines, its pits and its impact berm come at 0.0.7; this release authors the part a new join fires on
// first, the 25 m bay, and the tower that runs the whole range, each at its final place in melas@1's
// template, so nothing placed now moves when the rest is built (PLACES §9: a final template at its final
// place; the sheet's §8 item 2):
//   - THE TOWER at (1,080, 296), 4 × 4 m and 9 m tall, its deck at 6.0 m: the range officer's post on the
//     deck, facing downrange, the PA horns on its roof and the red flag's pole at its north-east corner
//     (flown while the line is hot: the stage's, src/render/range.js);
//   - THE BAY in X3's north strip, between the tower and the KD lanes (z 302.5 and south): six lanes 3 m
//     apart at z 283.5 to 298.5, the firing line on the 500 m line's x 1,100, the 25 m cards on their
//     frames at x 1,125 (a 30 cm card, its centre 0.6 m up on a 1.0 × 1.2 m backer), and an earth berm
//     6 m deep behind them, x 1,128 to 1,134; a chain-link fence on its north side, a range rope on the
//     south and the west, so the bay is walked (the walk rect) and nowhere else;
//   - every lane: its firing point (fp: where you stand, kneel or lie; the mat under it), the box the
//     range rules hold you in (fp.x − 1.4 to + 2.2, fp.z ± 1.0), the coach's place at your left shoulder
//     (0.9 m back and 1.4 m north of the point) facing downrange, the target, and its pieces' ids
//     (fixtures.fp, fixtures.target).
// KD_RANGE is the shape the build sheet's §2.3 gives every role (the shot role's fill, the arms role's
// range rules, the hud's PAPER inset). RANGE_PIECES are the bay's kit pieces as authored, read by
// src/sim/places/ground.js into the ground area (its `pieces` and the nav's blockers) and drawn by the
// kit (src/art/kit/range.js): the same in every career, no seed of the world (the user, 2026-11-05:
// "game world is handcrafted"); a piece's `seed` is its authored look constant (PLACES §9.2).
// Pure data, frozen.

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** Lanes on the 25 m line, the spacing between them and the first lane's z (metres; the sheet's §2.3). */
export const LANES_25 = 6, LANE_GAP_M = 3, LANE1_Z = 283.5;
/** The firing line, the cards' line, how high a card's centre stands, a frame's backer (w, h), metres. */
export const LINE_X = 1100, TARGET_X = 1125, CARD_CENTRE_Y_M = 0.6, FRAME_M = Object.freeze([1.0, 1.2]);
/** The card at 25 m (WEAPONS §11.1; the shot role's PAPERS.card25): its side and its rings' width, centimetres. */
export const CARD25_CM = 30, CARD25_RING_CM = 2.5;
/** The tower (PLACES §4.12): its rect, its height and its deck's, metres. */
export const TOWER = deepFreeze({ rect: [1078, 294, 1082, 298], heightM: 9, deckY: 6.0 });

const lane = (n) => {
  const fp = { x: LINE_X, z: LANE1_Z + LANE_GAP_M * (n - 1) };
  return {
    lane: n, fp,
    box: [fp.x - 1.4, fp.z - 1.0, fp.x + 2.2, fp.z + 1.0],
    // (the coach at your left shoulder, a step back and north of you, watching downrange with you: drawn behind
    // you, so he covers nothing of you standing, kneeling or prone. The sheet's §2.3 put him at x − 0.6 facing
    // up, his back to the camera over your legs and rifle at 16 px/m; then 1.4 m behind your right shoulder,
    // where prone, your body 1.5 m back from the point, his head sat on your feet for the whole first string
    // (the design review of v0.0.5); my call, one spot for every stance, so he never has to step and pop)
    coach: { x: fp.x - 0.9, z: fp.z - 1.4, face: 'right' },
    target: { x: TARGET_X, z: fp.z, centreY: CARD_CENTRE_Y_M, frameM: [...FRAME_M] },
    fixtures: { fp: `f:kd:fp25-${n}`, target: `f:kd:t25-${n}` },
  };
};

/** The range as the sheet's §2.3 gives it to every role (see the header). */
export const KD_RANGE = deepFreeze({
  area: 'melas.ground', zone: 'melas.kd-25', downrangeRad: 0,
  tower: { rect: [...TOWER.rect], heightM: TOWER.heightM, deckY: TOWER.deckY, ro: { x: 1080, z: 296, face: 'right' }, flag: { x: 1081.5, z: 294.5 } },
  bay: {
    lineX: LINE_X, targetX: TARGET_X, berm: [1128, 280.5, 1134, 300], fence: { z: 280.5, x0: 1086, x1: 1136 }, walk: [1086, 281, 1124, 300],
    lanes: Array.from({ length: LANES_25 }, (_, i) => lane(i + 1)),
  },
});

/** The range rope round the bay's open sides: the south (along z 300) and the west (along x 1,086), metres. */
export const ROPES = deepFreeze([
  { name: 'rope-south', x0: 1085.8, z0: 300.2, x1: 1128.4, z1: 300.2 },
  { name: 'rope-west', x0: 1085.8, z0: 280.6, x1: 1085.8, z1: 300.2 },
]);
/** The flag pole's top and the flag's size (the red flag, flown while hot), metres. */
export const FLAG = deepFreeze({ poleTopY: 11.5, w: 1.2, h: 0.8 });
/**
 * The line's own red flags, flown with the tower's while hot, at the firing line's two ends (my call: the
 * tower stands 20 m behind the line, out of the frame the weapon mode's lead shows, so a flag on a pole at
 * each end of the line is in sight from every lane): where each pole stands, its top and its flag, metres.
 */
export const LINE_FLAGS = deepFreeze([{ x: 1103.5, z: 281.2 }, { x: 1103.5, z: 299.8 }]);
export const LINE_FLAG = deepFreeze({ poleTopY: 3.6, w: 0.6, h: 0.4, baseY: 1.2 });

/**
 * The bay's kit pieces (src/art/kit/range.js), as authored: { id, kind, make, x, z, face, w?, d?, h?,
 * look, seed, block: 'solid' | 'see' | null (what the nav and the sight grid make of it) }.
 */
export const RANGE_PIECES = deepFreeze([
  // The tower, its legs and stair seen from the bay; its deck open under a roof, so the RO stands in sight.
  { id: 'f:kd:tower', kind: 'kdTower', make: 'open', x: 1080, z: 296, face: 'down', look: { flag: [1.5, -1.5] }, seed: 11, block: 'see' },
  // The firing line's mats, one a lane, from behind the hips to past the elbows of a body prone on it.
  ...KD_RANGE.bay.lanes.map(l => ({ id: l.fixtures.fp, kind: 'kdMat', make: 'canvas', x: l.fp.x + 0.35, z: l.fp.z, face: 'right', look: { lane: l.lane }, seed: 20 + l.lane, block: null })),
  // The lane boards behind the line, a number on each.
  ...KD_RANGE.bay.lanes.map(l => ({ id: `f:kd:lane25-${l.lane}`, kind: 'rangeSign', make: 'lane', x: l.fp.x - 1.6, z: l.fp.z - 0.9, face: 'down', w: 0.4, look: { text: String(l.lane) }, seed: 30 + l.lane, block: 'see' })),
  // The frames and their cards at 25 m, drawn facing you as the picture shows paper (tradecraft's target card).
  ...KD_RANGE.bay.lanes.map(l => ({ id: l.fixtures.target, kind: 'kdFrame', make: 'card25', x: l.target.x, z: l.target.z, face: 'down', look: { lane: l.lane }, seed: 40 + l.lane, block: 'see' })),
  // The berm behind the cards, stepped up away from the line.
  // (it stops walkers, not eyes: nothing stands behind it, and its stepped top reads lit as you see it)
  { id: 'f:kd:berm25', kind: 'berm', make: 'earth', x: 1131, z: 290.25, face: 'left', w: 19.5, d: 6, look: {}, seed: 51, block: 'see' },
  // The fence on the north side, the rope on the south and the west.
  { id: 'f:kd:fence25', kind: 'rangeFence', make: 'mesh', x: 1111, z: 280.5, face: 'down', w: 50, look: {}, seed: 61, block: 'see' },
  ...ROPES.map((r, i) => {
    const along = r.z0 === r.z1, len = along ? r.x1 - r.x0 : r.z1 - r.z0;
    return { id: `f:kd:${r.name}`, kind: 'rangeFence', make: 'rope', x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2, face: along ? 'down' : 'left', w: len, look: {}, seed: 62 + i, block: 'see' };
  }),
  // The line's flag poles at its two ends (the cloth is the stage's, flown while hot).
  ...LINE_FLAGS.map((f, i) => ({ id: `f:kd:flag25-${i ? 's' : 'n'}`, kind: 'rangeSign', make: 'flagpole', x: f.x, z: f.z, face: 'down', w: 0.1, look: {}, seed: 80 + i, block: 'see' })),
  // The distance board at the cards' line, and the notice at the line's west end.
  { id: 'f:kd:sign25', kind: 'rangeSign', make: 'distance', x: 1123.0, z: 281.4, face: 'down', w: 1.2, look: { text: '25 M' }, seed: 71, block: 'see' },
  { id: 'f:kd:notice25', kind: 'rangeSign', make: 'notice', x: 1088.4, z: 281.4, face: 'down', w: 2.4, look: { text: 'LIVE FIRE' }, seed: 72, block: 'see' },
]);

/** The firing line's sintered pad, under the mats (a path surface on the ground), metres. */
export const LINE_PAD = deepFreeze({ id: 's:kd:line25', kind: 'path', rect: [1098.5, 281.2, 1102.5, 299.8] });

/**
 * The bay's piece kinds as the sim reads them (the kit's FOOTPRINTS for the same kinds, pinned equal by
 * places-validate, as the catalogue's are: what is drawn is what blocks): w across and d deep as the piece
 * faces 'down', h its height, metres; a stretched piece (the berm, a fence run) gives its own w and d.
 */
export const RANGE_KINDS = deepFreeze({
  kdTower: { w: 4.0, d: 4.0, h: 9.0 },
  kdMat: { w: 1.0, d: 2.2, h: 0.03 },
  kdFrame: { w: 1.0, d: 0.2, h: 1.35 },
  rangeSign: { w: 2.4, d: 0.12, h: 1.3 },
  berm: { w: 19.5, d: 6.0, h: 3.0 },
  rangeFence: { w: 6.0, d: 0.1, h: 2.4 },
});
