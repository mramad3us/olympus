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
//   - every lane: its numbered stake on its own row, 2 m behind its point (KD_STAKE_DX_M; the KD's stake, kdPoint: 0.0.8's,
//     where a 1.3 m board 0.9 m north of the row had read as the next lane's), your own marked yours on the stage;
//   - every lane: its firing point (fp: where you stand, kneel or lie; the mat under it), the box the
//     range rules hold you in (fp.x − 1.4 to + 2.2, fp.z ± 1.0), the coach's place at your left shoulder
//     (0.9 m back and 1.4 m north of the point) facing downrange, the target, and its pieces' ids
//     (fixtures.fp, fixtures.target).
// KD_RANGE is the shape the build sheet's §2.3 gives every role (the shot role's fill, the arms role's
// range rules, the hud's PAPER inset).
// 0.0.7 (the build sheet 0.0.7 §2.3, §8 item 21; PLACES §4.12): the rest of the KD ground, KD_RANGE.kd,
// at its final place beside the bay, firing east:
//   - THE LINES at x 1,400 (200 m), 1,300 (300 m) and 1,100 (500 m) from the faces at x 1,600, each 20
//     numbered points 5 m apart (z 302.5 to 397.5: lane n at 297.5 + 5n), a sintered pad under each line
//     (KD_PADS), a stake numbered for its lane behind each point, on the point's own row (kdPoint: KD_STAKE_DX_M behind
//     its fp, KD_STAKE_DZ_M 0 across; 0.0.7's tower fixer, the user's report of 2026-11-07, "did call me line 5 when I'm
//     line 10": at 1.6 m behind and 1.2 m south of its point the stake sat a third of the way to the next point's, so
//     the figure on 11 read the "10" above it as its own) and the line's distance board
//     at its north end (kdLineBoard); every point has the bay's shapes: fp, the box (fp.x − 1.4 to + 2.2,
//     fp.z ± 1.0) and the coach's place at your left shoulder (fp.x − 0.9, fp.z − 1.4) facing downrange;
//   - THE TARGET LINE: each lane's face on its carrier (kdCarrier, 1.8 × 0.3 × 2.0 m, at x 1,603.5 in the
//     pits), its centre FACE_UP_Y 1.9 m up when raised and FACE_DOWN_Y −0.6 m pulled down behind the
//     parapet (whose top is 0.5 m up), the A face by default (the course says which), and the puller's
//     place behind it (x 1,605.5, facing the carrier);
//   - THE PITS: the trench x 1,600 to 1,610 (kdPits, its floor 2.5 m down: a floor piece, not a blocker),
//     the parapet in front (x 1,597 to 1,600, kdParapet, stretched), its back wall and its two ends
//     (kdParapet too: concrete), the pits' walk (x 1,600.4 to 1,609.6) closed in by them;
//   - THE IMPACT BERM x 1,612 to 1,640, 8 m high (kdBerm, stretched), stopping what passes the faces;
//   - THE WIND FLAGS every 100 m from x 1,100 to 1,600 on both sides of the lanes, at z 299.0 and 401.0
//     (kdFlag: the pole, the sleeve's cloth the stage's from wind.js's flagOf): the north row's first stands
//     at x 1,140, past the bay's berm, since its x 1,100 would stand on the bay's sixth point (my call); and the
//     middle flags (KD_FLAGS_MID): on each line a row 18 m downrange between the relay's lanes, in the picture's clear
//     column beside the far window, and two more down the middle (see KD_FLAGS_MID);
//   - THE READY LINE at x 1,062 (behind the 500 m line: the sheet's 1,060 is X3's own west edge, where the rope
//     stands; my call), the range shack (12 × 8 m, shut this round) west of
//     the tower, and the ammunition point's canopy (6 × 4 m) at (1,070, 420): its piece's centre 2.5 m
//     north so all of it stands in X3 (my call); both outside the walk;
//   - THE ROPE round the lanes' ground (north along z 300.2 past the bay's own, south along z 399.8, west
//     along x 1,060.2), so the KD is walked in its rect (x 1,060.4 to 1,597, z 300.5 to 399.5; the sheet's 1,056 is outside X3) and the pits
//     in theirs, and nowhere else; the gates stay shut, so only a scene reaches it.
// 0.0.8 (the build sheet 0.0.8 §2.3, §8 item 4; PLACES §4.12; COMBAT §25.10.3): test-pairs' ground on the bay, PAIRS:
//   - THE TURNERS: a turning target's stand 1 m in front of each lane's frame (x 1,124.0, on the lane's axis: kdTurner,
//     0.5 × 0.3 × 1.75 m, block 'see'), its face 0.46 × 0.76 m with its centre 1.35 m up, hung and turned by the scene
//     (src/sim/arms/turners.js; none hung in test-handling and test-range, whose cards stay uncovered);
//   - THE LINES at 7 and 10 m from the turners (x 1,117.0 and 1,114.0), painted across a sintered pad (x 1,112.6 to
//     1,118.6, the bay's width: kdPaint, '7 M' and '10 M'), each lane a point on each line with the bay's shapes: fp,
//     the box (fp.x − 1.4 to + 2.2, fp.z ± 1.0) and the coach's place at your left shoulder (fp.x − 0.9, fp.z − 1.4);
//   - THE BANG (0.0.9, "Three bangs"): where the coach's training bangs land, PAIRS.bang: 1.5 m behind your point on the
//     pad, ±0.5 m across it (kdBang, 0.05 × 0.05 × 0.12 m, thrown by the scene, never placed as a piece);
//   - the pad is the last of KD_PADS (my call: the ground reads that list into its surfaces, so the pad needs no new
//     reader there), 's:kd:pairs'.
// kdLaneOf(lane) gives a lane's record; which line holds a person is the scene's (src/sim/scenarios/range.js
// kdLineOf: it reads the state). RANGE_PIECES are the bay's kit pieces as authored, read by
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
/**
 * A point's numbered stake from its fp (m), on the KD's lines and the 25 m bay alike: behind it (west, uprange) past the
 * soles of a body prone on it, on its own row (0.0.7's tower fixer for the KD; the bay's from 0.0.8, see the header).
 */
export const KD_STAKE_DX_M = -2.0, KD_STAKE_DZ_M = 0;
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
const KD_RANGE_025 = ({
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
const PIECES_025 = ([
  // The tower, its legs and stair seen from the bay; its deck open under a roof, so the RO stands in sight.
  { id: 'f:kd:tower', kind: 'kdTower', make: 'open', x: 1080, z: 296, face: 'down', look: { flag: [1.5, -1.5] }, seed: 11, block: 'see' },
  // The firing line's mats, one a lane, from behind the hips to past the elbows of a body prone on it.
  ...KD_RANGE_025.bay.lanes.map(l => ({ id: l.fixtures.fp, kind: 'kdMat', make: 'canvas', x: l.fp.x + 0.35, z: l.fp.z, face: 'right', look: { lane: l.lane }, seed: 20 + l.lane, block: null })),
  // The lanes' numbered stakes behind the line, each on its own lane's row as the KD's points' are (0.0.8: a board 1.3 m
  // tall at 1.6 m behind and 0.9 m north of its point drew its number nearer the next lane's mat than its own: lane 5's
  // "5" 60 px over your mat and lane 6's "6" 36 px under it at 32 CSS px a metre, the user's report of the KD's of
  // 2026-11-07, "did call me line 5 when I'm line 10", the tower verifier's finding on the bay).
  ...KD_RANGE_025.bay.lanes.map(l => ({ id: `f:kd:lane25-${l.lane}`, kind: 'kdPoint', make: 'stake', x: l.fp.x + KD_STAKE_DX_M, z: l.fp.z + KD_STAKE_DZ_M, face: 'down', look: { text: String(l.lane) }, seed: 30 + l.lane, block: null })),
  // The frames and their cards at 25 m, drawn facing you as the picture shows paper (tradecraft's target card).
  ...KD_RANGE_025.bay.lanes.map(l => ({ id: l.fixtures.target, kind: 'kdFrame', make: 'card25', x: l.target.x, z: l.target.z, face: 'down', look: { lane: l.lane }, seed: 40 + l.lane, block: 'see' })),
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
  // (0.0.7, the build sheet 0.0.7 §2.3: the KD's pieces; the berm, the parapet and the pits stretched, giving their own w and d)
  kdCarrier: { w: 1.8, d: 0.3, h: 2.0 },
  kdParapet: { w: 100.0, d: 3.0, h: 0.5 },
  kdPits: { w: 100.0, d: 10.0, h: 0.0 },
  kdBerm: { w: 28.0, d: 100.0, h: 8.0 },
  kdFlag: { w: 0.1, d: 0.1, h: 4.5 },
  kdPoint: { w: 0.1, d: 0.1, h: 0.6 },
  kdLineBoard: { w: 1.2, d: 0.12, h: 1.3 },
  kdCanopy: { w: 6.0, d: 4.0, h: 3.0 },
  rangeShack: { w: 12.0, d: 8.0, h: 3.5 },
  // (0.0.8, the build sheet 0.0.8 §2.3, §4: test-pairs' turner stands and the painted lines across their pad (flat: h 0))
  kdTurner: { w: 0.5, d: 0.3, h: 1.75 },
  kdPaint: { w: 18.6, d: 0.1, h: 0 },
  // (0.0.9, the build sheet 0.0.9 §2.2: the coach's training bang, a body thrown onto the pad by the scene (pairs.js
  // planBangs), none placed as a piece, so the ground's golden is unchanged)
  kdBang: { w: 0.05, d: 0.05, h: 0.12 },
});

// ---- 0.0.7: the KD ground (see the header) ----

/** The KD's lanes, their spacing, lane 1's z, the target line, the ready line (metres). */
export const KD_LANES = 20, KD_LANE_GAP_M = 5, KD_LANE1_Z = 302.5, KD_TARGET_X = 1600, KD_READY_X = 1062;
/** The firing lines by their distance: x and zone. */
export const KD_LINES = deepFreeze({ 200: { x: 1400, zone: 'melas.kd-line-200' }, 300: { x: 1300, zone: 'melas.kd-line-300' }, 500: { x: 1100, zone: 'melas.kd-line-500' } });
/** A face's centre raised and pulled down (m above the ground; the parapet's top 0.5 m), and the carriers' and pullers' x. */
export const FACE_UP_Y = 1.9, FACE_DOWN_Y = -0.6, CARRIER_X = 1603.5, PULLER_X = 1605.5;
/** Where the carrier's frame is drawn: the middle of its face as drawn (the face's line + 1.1 m). */
export const CARRIER_DRAWN_X = 1601.1;
/** The pits, the parapet, the berm (metres; the build sheet 0.0.7 §2.3). */
export const KD_PITS = deepFreeze({ x0: 1600, x1: 1610, floorY: -2.5, parapet: { x0: 1597, x1: 1600, topY: 0.5 }, walk: [1600.4, 300.5, 1609.6, 399.5] });
export const KD_BERM = deepFreeze({ rect: [1612, 300, 1640, 400], heightM: 8 });
/**
 * The flags (x 1,100 to 1,600 every 100 m, both sides; the north row's first at x 1,140: see the header), and the middle
 * flags down the lanes the relay fires on. On each line (500, 300 and 200 m) a row KD_FLAG_AHEAD_M 18 m downrange of the
 * points, one flag between each pair of the relay's lanes (z 340, 345, 350 and 355: between lanes 8 and 9 to 11 and 12), so
 * the flag on your lane's south side stands 2.5 m from your row where the picture as played always shows it: right of
 * the far window and its plates, below the watch, above the keys, clear of the step panel, on every lane you can draw
 * (8 to 11) at 1,024 x 768 to 1,920 x 1,080 (the sock verifier's of 0.0.8: the one middle row at 10 m downrange, z 345,
 * stood under the plates, the step panel or the far window for every lane; my call on the places). Beside them, one
 * 10 m downrange of the 100 m mark and one 5 m short of the parapet (z 345), seen in the far window at 1x (19.75 m round
 * the far point) beside faces 8 to 11, outside its 4.9 m at 4x
 * (the design review's of v0.0.7: the nearest flag stood 33.5 m from any lane you fire on, never on screen, and "read
 * the flags" was a menu's number); the ammunition point, the shack.
 */
export const KD_FLAG_AHEAD_M = 18;
export const KD_FLAGS_MID = deepFreeze([1100, 1300, 1400].flatMap(x => [340, 345, 350, 355].map(z => ({ x: x + KD_FLAG_AHEAD_M, z })))
  .concat([1510, 1595].map(x => ({ x, z: 345.0 }))));
export const KD_FLAGS = deepFreeze([1140, 1200, 1300, 1400, 1500, 1600].map(x => ({ x, z: 299.0 })).concat([1100, 1200, 1300, 1400, 1500, 1600].map(x => ({ x, z: 401.0 })), KD_FLAGS_MID));
export const KD_AMMO = deepFreeze({ x: 1070, z: 420 }), KD_SHACK = deepFreeze({ x: 1070, z: 285 });
/** The KD's walked rect and its rope. */
export const KD_WALK = deepFreeze([1060.4, 300.5, 1597, 399.5]);
export const KD_ROPES = deepFreeze([
  { name: 'kd-rope-north-w', x0: 1060.2, z0: 300.2, x1: 1085.8, z1: 300.2 },
  { name: 'kd-rope-north-e', x0: 1128.4, z0: 300.2, x1: 1597.0, z1: 300.2 },
  { name: 'kd-rope-south', x0: 1060.2, z0: 399.8, x1: 1597.0, z1: 399.8 },
  { name: 'kd-rope-west', x0: 1060.2, z0: 300.2, x1: 1060.2, z1: 399.8 },
]);

const kdPoint = (lane, d) => {
  const z = KD_LANE1_Z + KD_LANE_GAP_M * (lane - 1), x = KD_LINES[d].x, fp = { x, z };
  return { fp, box: [x - 1.4, z - 1.0, x + 2.2, z + 1.0], coach: { x: x - 0.9, z: z - 1.4, face: 'right' } };
};
const kdLane = (n) => {
  const z = KD_LANE1_Z + KD_LANE_GAP_M * (n - 1);
  return {
    lane: n, z,
    face: { x: KD_TARGET_X, z, upY: FACE_UP_Y, downY: FACE_DOWN_Y, paper: 'kdA' },
    carrier: { x: CARRIER_X, z }, puller: { x: PULLER_X, z, face: 'left' },
    points: { 200: kdPoint(n, 200), 300: kdPoint(n, 300), 500: kdPoint(n, 500) },
    fixtures: { face: `f:kd:t-${n}`, fp: { 200: `f:kd:fp200-${n}`, 300: `f:kd:fp300-${n}`, 500: `f:kd:fp500-${n}` } },
  };
};
/** The KD ground as the build sheet 0.0.7 §2.3 gives it to every role (KD_RANGE.kd: see the header). */
export const KD = deepFreeze({
  targetX: KD_TARGET_X, lanes: Array.from({ length: KD_LANES }, (_, i) => kdLane(i + 1)), laneGap: KD_LANE_GAP_M, lane1Z: KD_LANE1_Z, readyX: KD_READY_X, zone: 'melas.kd-range',
  lines: { 200: { ...KD_LINES[200] }, 300: { ...KD_LINES[300] }, 500: { ...KD_LINES[500] } },
  pits: { x0: KD_PITS.x0, x1: KD_PITS.x1, floorY: KD_PITS.floorY, parapet: { ...KD_PITS.parapet }, walk: [...KD_PITS.walk] },
  berm: { rect: [...KD_BERM.rect], heightM: KD_BERM.heightM },
  flags: KD_FLAGS.map(f => ({ ...f })), ammo: { ...KD_AMMO }, shack: { ...KD_SHACK },
  walk: [...KD_WALK], nLanes: KD_LANES,
});
/** A KD lane's record (1 to 20), or null. */
export const kdLaneOf = (lane) => KD.lanes[lane - 1] ?? null;

/** A long rope's run (m): see KD_PIECES. */
export const ROPE_RUN_M = 30;
/** The KD's pieces (see the header): appended to RANGE_PIECES. */
const KD_PIECES = [
  ...[200, 300, 500].map((d, i) => ({ id: `f:kd:board-${d}`, kind: 'kdLineBoard', make: 'distance', x: KD_LINES[d].x + 0.5, z: 300.8, face: 'down', look: { text: String(d) }, seed: 90 + i, block: 'see' })),
  ...KD.lanes.flatMap(L => [200, 300, 500].map(d => ({ id: L.fixtures.fp[d], kind: 'kdPoint', make: 'stake', x: L.points[d].fp.x + KD_STAKE_DX_M, z: L.z + KD_STAKE_DZ_M, face: 'down', look: { text: String(L.lane) }, seed: 100 + L.lane, block: null }))),
  // (the carrier's frame drawn under its face as the stage draws it, twice life size with its left edge on the line
  // (VIEWS §2.12 FACE_K 2): at the sim's 1,603.5 it stood 1.5 m east of the face; the sim's carrier.x is unchanged)
  ...KD.lanes.map(L => ({ id: L.fixtures.face, kind: 'kdCarrier', make: 'frame', x: CARRIER_DRAWN_X, z: L.z, face: 'left', look: { lane: L.lane }, seed: 130 + L.lane, block: 'see' })),
  { id: 'f:kd:parapet', kind: 'kdParapet', make: 'concrete', x: 1598.5, z: 350, face: 'left', w: 100, d: 3, look: {}, seed: 151, block: 'see' },
  { id: 'f:kd:pits-back', kind: 'kdParapet', make: 'concrete', x: 1611.0, z: 350, face: 'left', w: 100, d: 2, look: {}, seed: 152, block: 'see' },
  { id: 'f:kd:pits-n', kind: 'kdParapet', make: 'concrete', x: 1605.0, z: 300.2, face: 'down', w: 10, d: 0.4, look: {}, seed: 153, block: 'see' },
  { id: 'f:kd:pits-s', kind: 'kdParapet', make: 'concrete', x: 1605.0, z: 399.8, face: 'down', w: 10, d: 0.4, look: {}, seed: 154, block: 'see' },
  { id: 'f:kd:pits', kind: 'kdPits', make: 'trench', x: 1605.0, z: 350, face: 'left', w: 100, d: 10, look: { floorY: KD_PITS.floorY }, seed: 155, block: null },
  { id: 'f:kd:berm', kind: 'kdBerm', make: 'earth', x: 1626.0, z: 350, face: 'left', w: 100, d: 28, look: {}, seed: 156, block: 'see' },
  // (a flag on a line's middle row is named by its z too: four share each x)
  ...KD_FLAGS.map((f, i) => ({ id: `f:kd:wind-${f.z < 320 ? 'n' : f.z > 380 ? 's' : 'm'}${f.x}${f.x % 100 === KD_FLAG_AHEAD_M ? `-${f.z}` : ''}`, kind: 'kdFlag', make: 'sleeve', x: f.x, z: f.z, face: 'down', look: {}, seed: 160 + i, block: 'see' })),
  { id: 'f:kd:canopy', kind: 'kdCanopy', make: 'open', x: KD_AMMO.x, z: KD_AMMO.z - 2.5, face: 'down', look: {}, seed: 180, block: null },
  { id: 'f:kd:shack', kind: 'rangeShack', make: 'shut', x: KD_SHACK.x, z: KD_SHACK.z, face: 'down', look: {}, seed: 181, block: 'solid' },
  // (a rope in runs of at most ROPE_RUN_M: the stage draws a piece with the chunk its middle is in, so a 537 m rope in one
  // piece went undrawn wherever its middle's chunk was out of reach; each run's middle is within 15 m of any part of it)
  ...KD_ROPES.flatMap((r, i) => {
    const along = r.z0 === r.z1, len = along ? r.x1 - r.x0 : r.z1 - r.z0, n = Math.max(1, Math.ceil(len / ROPE_RUN_M)), run = n === 1 ? len : Math.floor(len / n * 100) / 100;
    return Array.from({ length: n }, (_, k) => {
      const mid = (along ? r.x0 : r.z0) + run * (k + 0.5);
      return { id: n === 1 ? `f:kd:${r.name}` : `f:kd:${r.name}-${k + 1}`, kind: 'rangeFence', make: 'rope', x: Math.round((along ? mid : r.x0) * 100) / 100, z: Math.round((along ? r.z0 : mid) * 100) / 100,
        face: along ? 'down' : 'left', w: run, look: {}, seed: 190 + i, block: 'see' };
    });
  }),
];
// ---- 0.0.8: test-pairs' turners and its 7 m and 10 m lines on the bay (see the header) ----

/** The turners' line, the two lines' x by their distance from it, the pad under them (metres; the build sheet 0.0.8 §4). */
export const TURNER_X = 1124.0, PAIRS_LINES = deepFreeze({ 7: { x: 1117.0 }, 10: { x: 1114.0 } }), PAIRS_PAD_RECT = deepFreeze([1112.6, 281.2, 1118.6, 299.8]);
/** A turner's face (its width and height, its centre's height) and its stand (metres). */
export const TURNER_FACE = deepFreeze({ wM: 0.46, hM: 0.76, centreY: 1.35 }), TURNER_STAND = deepFreeze({ w: 0.5, d: 0.3, h: 1.75 });
const pairsPoint = (x, z) => ({ fp: { x, z }, box: [x - 1.4, z - 1.0, x + 2.2, z + 1.0], coach: { x: x - 0.9, z: z - 1.4, face: 'right' } });
/** test-pairs' ground (see the header): the turners' line, the two lines, the pad, the face, the stand, each bay lane's turner and points; 0.0.9's bang, where the coach's training bangs land (behindM behind your point, ±spreadM across it: courses.js COURSES.pairs.bangs the same). */
export const PAIRS = deepFreeze({
  turnerX: TURNER_X, lines: { 7: { ...PAIRS_LINES[7] }, 10: { ...PAIRS_LINES[10] } }, pad: [...PAIRS_PAD_RECT], face: { ...TURNER_FACE }, stand: { ...TURNER_STAND },
  bang: { behindM: 1.5, spreadM: 0.5, kind: 'kdBang' },
  lanes: KD_RANGE_025.bay.lanes.map(l => ({
    lane: l.lane, z: l.fp.z,
    turner: { x: TURNER_X, z: l.fp.z, fixture: `f:kd:turner-${l.lane}` },
    points: { 7: pairsPoint(PAIRS_LINES[7].x, l.fp.z), 10: pairsPoint(PAIRS_LINES[10].x, l.fp.z) },
  })),
});
/** A bay lane's record on test-pairs' ground (1 to 6), or null. */
export const pairsLaneOf = (lane) => PAIRS.lanes[lane - 1] ?? null;
/** test-pairs' pieces: the six turner stands (facing the line), the two painted lines across the pad. */
const PAIRS_PIECES = [
  ...PAIRS.lanes.map(L => ({ id: L.turner.fixture, kind: 'kdTurner', make: 'stand', x: L.turner.x, z: L.turner.z, face: 'left', look: { lane: L.lane }, seed: 200 + L.lane, block: 'see' })),
  ...[7, 10].map((d, i) => ({ id: `f:kd:paint-${d}`, kind: 'kdPaint', make: 'line', x: PAIRS_LINES[d].x, z: (PAIRS_PAD_RECT[1] + PAIRS_PAD_RECT[3]) / 2, face: 'left', look: { text: `${d} M` }, seed: 210 + i, block: null })),
];
/** test-pairs' pad, a path surface on the ground as LINE_PAD (metres). */
export const PAIRS_PAD = deepFreeze({ id: 's:kd:pairs', kind: 'path', rect: [...PAIRS_PAD_RECT] });

/** The KD lines' sintered pads (path surfaces on the ground, as LINE_PAD), metres; 0.0.8: test-pairs' pad last (see the header). */
export const KD_PADS = deepFreeze([...[200, 300, 500].map(d => ({ id: `s:kd:line${d}`, kind: 'path', rect: [KD_LINES[d].x - 1.5, 300.5, KD_LINES[d].x + 2.5, 399.5] })), { ...PAIRS_PAD, rect: [...PAIRS_PAD.rect] }]);

/** The range as the sheet's §2.3 gives it to every role (see the header): the bay (0.0.5) and, from 0.0.7, the KD (kd). */
export const KD_RANGE = deepFreeze({ ...KD_RANGE_025, kd: KD });
/**
 * The range's kit pieces (src/art/kit/range.js), as authored: { id, kind, make, x, z, face, w?, d?, h?,
 * look, seed, block: 'solid' | 'see' | null (what the nav and the sight grid make of it) }: the bay's (0.0.5),
 * the KD's (0.0.7), then test-pairs' turner stands and painted lines (0.0.8).
 */
export const RANGE_PIECES = deepFreeze([...PIECES_025, ...KD_PIECES, ...PAIRS_PIECES]);
