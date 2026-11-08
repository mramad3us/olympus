// OLYMPUS art: the kit, every piece by kind. place() puts one into an area; KINDS lists them; FOOTPRINTS sizes them.
//
// A piece is { kind, x, z, face = 'down', make, look, seed } (tradecraft's furniture() spec, plus make):
// kind names the maker (quarters.js, mess.js, head.js, training.js, ship.js, signs.js, range.js), make a way of
// building it (a steel rack or a modular one), look its state (made or unmade, open or shut, lit or not),
// seed the cosmetic choices a look leaves open (which blanket, which dents), so a bay of fifteen racks
// isn't one rack fifteen times ("at least three kinds of everything": the user, tradecraft, carried
// into DESIGN.md's Areas). Footprints are the sim's to own in the end (PLACES §1.5 fixtures); until the
// sim has them they are here, in metres, from PLACES where it gives them (a rack2 0.95 × 2.05 m, a
// footlocker 0.45 deep, a study table 1.6 × 0.8) and my calls elsewhere.
//
// place(area, spec) builds the piece with the kit builder (kit.js) into the area (src/render/batch.js,
// or any object with the same box(), ground(), lamp(), glowLine() and part()), and returns its world
// boxes and lamps (and a clock's dials, where the stage lays its hands, and a stair's landing, guard,
// arrow and word, which the stairs test holds to the sim's: structure.js). Nothing here holds GPU objects: painters are plain functions, remembered by key.
// Pure.
import { builder, pieceRng, variant } from './kit.js';
import * as quarters from './quarters.js';
import * as mess from './mess.js';
import * as head from './head.js';
import * as training from './training.js';
import * as ship from './ship.js';
import * as signs from './signs.js';
import * as structure from './structure.js';
import * as range from './range.js';

/** Footprints by kind: w across, d deep, h tall (metres), and the makes each kind has. */
export const FOOTPRINTS = Object.freeze({
  rack2: { w: 0.95, d: 2.05, h: 1.7, makes: ['steel', 'grey', 'modular'] },
  rack1: { w: 0.95, d: 2.05, h: 0.75, makes: ['steel', 'grey', 'modular'] },
  rack3: { w: 0.8, d: 2.0, h: 2.15, makes: ['grey', 'steel', 'modular'] },
  wallLocker: { w: 0.6, d: 0.55, h: 1.9, makes: ['single', 'tier', 'mesh'] },
  footlocker: { w: 0.8, d: 0.45, h: 0.4, makes: ['wood', 'steel', 'polymer'] },
  rifleRack: { w: 1.4, d: 0.45, h: 1.85, makes: ['pegs', 'upright', 'cabinet'] },
  desk: { w: 1.2, d: 0.65, h: 0.76, makes: ['steel', 'field', 'wood'] },
  chair: { w: 0.5, d: 0.5, h: 0.9, makes: ['folding', 'office', 'steel'] },
  stool: { w: 0.36, d: 0.36, h: 0.47, makes: ['round', 'square'] },
  studyTable: { w: 1.6, d: 0.8, h: 0.76, makes: ['wood', 'steel'] },
  dutyDesk: { w: 1.8, d: 0.8, h: 1.12, makes: ['counter', 'desk', 'podium'] },
  messTable: { w: 2.4, d: 1.7, h: 0.76, makes: ['bench', 'stools', 'ship'] },
  servingLine: { w: 2.4, d: 1.2, h: 1.6, makes: ['steam', 'cold', 'start'] },
  showerStall: { w: 0.95, d: 1.0, h: 2.0, makes: ['curtain', 'door', 'open'] },
  toiletStall: { w: 0.95, d: 1.5, h: 1.85, makes: ['steel', 'laminate', 'ship'] },
  urinal: { w: 0.6, d: 0.4, h: 1.2, makes: ['wall', 'trough'] },
  sinkRow: { w: 1.8, d: 0.6, h: 1.9, makes: ['counter', 'trough', 'pedestal'] },
  waterFountain: { w: 0.5, d: 0.35, h: 1.2, makes: ['wall', 'bottle', 'cooler'] },
  washer: { w: 0.65, d: 0.65, h: 0.9, makes: ['washer', 'dryer', 'stack'] },
  gymRack: { w: 1.4, d: 1.3, h: 2.3, makes: ['squat', 'dumbbells', 'bench', 'plates'] },
  centrifuge: { w: 2.2, d: 2.8, h: 2.3, makes: ['pod', 'open', 'arm'] },
  rangeBooth: { w: 1.2, d: 1.0, h: 1.6, makes: ['indoor', 'baffled', 'field'] },
  targetCarrier: { w: 0.9, d: 0.4, h: 2.4, makes: ['carrier', 'stand', 'popup'] },
  suitLocker: { w: 0.9, d: 0.6, h: 2.1, makes: ['open', 'locker', 'rack'] },
  airlockDoor: { w: 1.6, d: 0.35, h: 2.6, makes: ['inner', 'outer', 'vehicle'] },
  pressureDoor: { w: 1.5, d: 0.3, h: 2.4, makes: ['sliding', 'dogged', 'fire'] },
  hatch: { w: 1.2, d: 1.2, h: 0.3, makes: ['deck', 'square', 'escape'] },
  ladderWell: { w: 1.4, d: 1.4, h: 1.1, makes: ['rails', 'cage', 'trunk'] },
  crashCouch: { w: 0.85, d: 2.0, h: 1.0, makes: ['troop', 'station', 'medical'] },
  conduit: { w: 3.0, d: 0.2, h: 0.5, makes: ['pipes', 'cables', 'duct'] },
  handhold: { w: 0.3, d: 0.08, h: 0.12, makes: ['bar', 'ring'] },
  emergencyLight: { w: 0.4, d: 0.12, h: 0.15, makes: ['lamp', 'strip', 'beacon', 'night'] },
  sign: { w: 1.0, d: 0.03, h: 0.3, makes: ['plaque', 'stencil', 'exit'] },
  window: { w: 1.2, d: 0.1, h: 1.0, makes: ['deep', 'port', 'slit'] },
  sofa: { w: 1.9, d: 0.85, h: 0.85, makes: ['vinyl', 'cloth'] },
  vending: { w: 0.9, d: 0.8, h: 1.85, makes: ['snack', 'drink'] },
  board: { w: 1.4, d: 0.05, h: 1.0, makes: ['notice', 'white', 'plan'] },
  bin: { w: 0.4, d: 0.4, h: 0.6, makes: ['bin', 'mop', 'extinguisher'] },
  tableSmall: { w: 1.2, d: 0.8, h: 0.76, makes: ['folding', 'steel'] },
  galleyUnit: { w: 1.8, d: 0.9, h: 1.0, makes: ['range', 'kettle', 'prep'] },
  // (0.0.3: the barracks' clocks and stairs, the streets' lamps; equal to places' catalogue, src/sim/places/fixtures.js)
  wallClock: { w: 0.30, d: 0.05, h: 0.30, makes: ['school', 'station'] },
  stairs: { w: 1.2, d: 4.8, h: 3.4, makes: ['concrete', 'steel'] },
  stairsWell: { w: 1.2, d: 4.8, h: 1.0, makes: ['rail', 'wall'] },
  lampPost: { w: 0.25, d: 0.25, h: 4.0, makes: ['sodium', 'flood'] },
  doorLeaf: { w: 1.0, d: 0.045, h: 2.1, makes: ['interior', 'ext', 'office'] },
  // (0.0.5: the KD range's 25 m bay and its tower, pieces of the ground that are not the catalogue's fixtures;
  // equal to the range's own kinds, src/data/places/range.js RANGE_KINDS, pinned by places-validate)
  kdTower: { w: 4.0, d: 4.0, h: 9.0, makes: ['open', 'cab'] },
  kdMat: { w: 1.0, d: 2.2, h: 0.03, makes: ['canvas', 'rubber'] },
  kdFrame: { w: 1.0, d: 0.2, h: 1.35, makes: ['card25', 'chest'] },
  rangeSign: { w: 2.4, d: 0.12, h: 1.3, makes: ['lane', 'distance', 'notice', 'flagpole'] },
  berm: { w: 19.5, d: 6.0, h: 3.0, makes: ['earth', 'sandbag'] },
  rangeFence: { w: 6.0, d: 0.1, h: 2.4, makes: ['mesh', 'rope'] },
  // (0.0.7: the rest of the KD ground, equal to the range role's RANGE_KINDS (src/data/places/range.js), pinned by
  // places-validate; the long pieces stretched by their own w and d)
  kdCarrier: { w: 1.8, d: 0.3, h: 2.0, makes: ['frame', 'timber'] },
  kdParapet: { w: 100, d: 3.0, h: 0.5, makes: ['concrete', 'earth'] },
  kdPits: { w: 100, d: 10, h: 0.0, makes: ['trench', 'timber'] },
  kdBerm: { w: 28, d: 100, h: 8.0, makes: ['earth', 'terraced'] },
  kdFlag: { w: 0.1, d: 0.1, h: 4.5, makes: ['sleeve', 'timber'] },
  kdPoint: { w: 0.1, d: 0.1, h: 0.6, makes: ['stake', 'post'] },
  kdLineBoard: { w: 1.2, d: 0.12, h: 1.3, makes: ['distance', 'frame'] },
  kdCanopy: { w: 6.0, d: 4.0, h: 3.0, makes: ['open', 'tarp'] },
  rangeShack: { w: 12, d: 8, h: 3.5, makes: ['shut', 'store'] },
  // (0.0.8: the pairs pad's turning targets' stands and its painted 7 m and 10 m lines, equal to the scene role's
  // RANGE_KINDS (src/data/places/range.js), pinned by places-validate; the line stretched by its own w)
  kdTurner: { w: 0.5, d: 0.3, h: 1.75, makes: ['stand', 'frame'] },
  kdPaint: { w: 18.6, d: 0.1, h: 0, makes: ['line', 'worn'] },
  // (0.0.9: the training bang's body, equal to the scene role's RANGE_KINDS (src/data/places/range.js); none placed)
  kdBang: { w: 0.05, d: 0.05, h: 0.12, makes: ['olive', 'spent'] },
  // (0.0.6: the PX barber's pole on its stand, equal to places' catalogue, src/sim/places/fixtures.js)
  barberPole: { w: 0.36, d: 0.36, h: 2.2, makes: ['pole', 'lit'] },
});

const MAKERS = {
  rack2: quarters.rack2, rack1: quarters.rack1, rack3: quarters.rack3, wallLocker: quarters.wallLocker, footlocker: quarters.footlocker,
  rifleRack: quarters.rifleRack, desk: quarters.desk, chair: quarters.chair, stool: quarters.stool,
  studyTable: quarters.studyTable, dutyDesk: quarters.dutyDesk,
  messTable: mess.messTable, servingLine: mess.servingLine, galleyUnit: mess.galleyUnit, tableSmall: mess.tableSmall,
  showerStall: head.showerStall, toiletStall: head.toiletStall, urinal: head.urinal, sinkRow: head.sinkRow,
  waterFountain: head.waterFountain, washer: head.washer,
  gymRack: training.gymRack, centrifuge: training.centrifuge, rangeBooth: training.rangeBooth, targetCarrier: training.targetCarrier,
  suitLocker: ship.suitLocker, airlockDoor: ship.airlockDoor, pressureDoor: ship.pressureDoor, hatch: ship.hatch,
  ladderWell: ship.ladderWell, crashCouch: ship.crashCouch, conduit: ship.conduit, handhold: ship.handhold, emergencyLight: ship.emergencyLight,
  sign: signs.sign, window: signs.wallWindow, board: signs.board, sofa: signs.sofa, vending: signs.vending, bin: signs.bin, barberPole: signs.barberPole,
  wallClock: structure.wallClock, stairs: structure.stairs, stairsWell: structure.stairsWell, lampPost: structure.lampPost, doorLeaf: structure.doorLeaf,
  kdTower: range.kdTower, kdMat: range.kdMat, kdFrame: range.kdFrame, rangeSign: range.rangeSign, berm: range.berm, rangeFence: range.rangeFence,
  kdCarrier: range.kdCarrier, kdParapet: range.kdParapet, kdPits: range.kdPits, kdBerm: range.kdBerm, kdFlag: range.kdFlag, kdPoint: range.kdPoint,
  kdLineBoard: range.kdLineBoard, kdCanopy: range.kdCanopy, rangeShack: range.rangeShack, kdTurner: range.kdTurner, kdPaint: range.kdPaint, kdBang: range.kdBang,
};
/** Every kind the kit builds. */
export const KINDS = Object.freeze(Object.keys(MAKERS));

/**
 * Put a piece into an area: { kind, x, z, y = 0 (a floor's height, or a fixture's mounting height for
 * wall pieces that take it), face, make, look, seed, w, d (a piece that stretches: a conduit's run, a
 * serving line's length), dir and open (a flight's) }. Returns { kind, boxes, lamps, footprint, face, dials, stair }.
 */
export function place(area, spec) {
  const { kind, x = 0, z = 0, y = 0, face = 'down', seed = 1 } = spec;
  const fp = FOOTPRINTS[kind], make = MAKERS[kind];
  if (!fp || !make) throw new Error(`kit: no kind '${kind}'`);
  const k = builder(area, { x, z, y, face });
  const o = { W: spec.w ?? fp.w, D: spec.d ?? fp.d, H: spec.h ?? fp.h, ppm: area.ppm, seed, v: variant(seed, 4), r: pieceRng(kind, seed), make: spec.make ?? fp.makes[0], look: spec.look ?? {}, kind, faces: spec.faces, dir: spec.dir, open: spec.open };
  make(k, o);
  return { kind, boxes: k.boxes, lamps: k.lamps, footprint: { w: o.W, d: o.D, h: o.H }, face, dials: k.dials ?? null, stair: k.stair ?? null };
}
