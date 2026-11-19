// OLYMPUS sim: the void's drill as data, the `void` family's first beats and its muscle-memory catalogue (COMBAT §14.5, §14.8, §25.3's `void` family; the build sheet v0.0.25 §1 B, §3.2, §5, items 3 to 6; PL§5, PL§6, PL§7).
//
// Written as drills/enter-and-clear.js is (its header's grammar: a beat's kind `k`, its channel `ch`, `after`, `cut`, `slots`,
// `doer`), so the stepper's one list gives the recruit's sum and the operator's flow (stepper.js flowOf), and read beside it through
// bundle.js's one `defOf` (a row: bundleDef, then VOID_DRILL.muscle) and `beatDefOf` (a beat: VOID_DRILL's, then ENTER_AND_CLEAR's).
// The house's room beats stand as they are; the void adds only what a hatch and a face need:
//   undog    the dogs (a door beat, how 'undog': UNDOG_MS 1.5 s, no roll; at its end combat/op.js breakOpening, so bundle.js lockedOf
//            reads the hatch open to the hand: a bulkhead hatch is a locked door, kind 'door' with leaf 'hatch' and lock: true, and the
//            deck hatch's dogs go on the same record by its id)
//   lift     the deck hatch swung up into the deck you stand on (a door beat, how 'hatch': OPEN_HATCH_MS 0.5 s, no roll)
//   brace    your #2's hand out for your harness at his stack on the scuttle (his slot's, no time, after his "Ready." at a deck
//            hatch: bundle.js hatchBeats puts it there): the grip itself is taken as your
//            transit starts ("Got you.": combat/two.js twoBrace), where he stands within FOOTING.BUDDY_M of you through the hatch
//   hatch    the transit, head and gun first (THROUGH_MS 1.0 s × the Zero-g pace: 1.04 s for the sergeant at Zero-g 9, 0.60 s for the
//            tier one at 28; one Zero-g roll at DC 6, a miss +200 ms a point,
//            never a drift): the brace taken at its start, else the coaming's hold one-handed; the deck changed with the body as the
//            eyes pass the plane (places/hatch.js crossHatch, the only writer of a deck change: one tick, one area); floatY under the
//            far deckhead; the take-in on the first face seen
//   plant    the boots swung to the far face beside the hatch and locked (FACE_MS' tuck and turn 800 and lock 400 ms: 1.2 s from the
//            grip): footing.js setOnFace, then setAnchor 'boots'. Cut by a contact as the house's entry is
//   let      your #2's "Through.", the grip let go on your plant or LET_AFTER_MS 0.2 s after your first round from it (two.js), his
//            own transit and plant after it on the scuttle's other side (his entry's cue: bundle.js entryGo)
//   onface   a face changed by a hold, the boots released (300), the tuck and turn (800), the lock (400): 1.5 s, 1.2 s from floating;
//            bundle.js planBundle puts it at the head of a row whose first move goes to a point on the other face (the hold's
//            deckhead to the store's stack on the deck), so T's "Undog, clear the compartment" goes down to the deck first
//   coaming  over a bulkhead hatch's 0.3 m coaming on boots (COAMING_MS 0.6 s, my call): the entry's step over the sill
// The rows (`muscle`, MUSCLE's shape: { id, family, group, slot, rung, label, beats, as? }): rung 0's singles "Stack on the hatch",
// "Undog the hatch", "Open the hatch", "Through the hatch" (the deck hatch's) and the BODY group's "Boots to the deckhead" (the
// panel's face row, arms/shooting.js faceRows: offeredNow 'body'); rung 1 "Stack up, take the hatch"; rung 2's groups "Stack up, take
// the hatch", "Undog, through: your face" (a bulkhead hatch's "Undog, in: your corner"), "Dominate"; rung 3 "Undog, clear the
// compartment". Each room row names the house's row whose machinery it runs (`as`: where it applies, which row leads by rung, the
// #2's groups), so the house's code reads one catalogue's shape and nothing of the house moves (every house row's defOf is its
// bundleDef). "Kick the hatch" is offered struck "no kick in free fall" (a kick would push you off: BODY §16.6), never hidden.
// Frozen. Pure.
import { VOID } from '../../../data/body/needs.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The void's times (see the header): needs.js VOID's, here by their sheet names. */
export const UNDOG_MS = VOID.UNDOG_MS, OPEN_HATCH_MS = VOID.OPEN_HATCH_MS, THROUGH_MS = VOID.THROUGH_MS, COAMING_MS = VOID.COAMING_MS;
/** The face change's parts (ms): release 300, tuck and turn 800, lock 400 (1.5 s from boots, 1.2 s from floating). */
export const FACE_MS = VOID.FACE_MS;
/** The face change's time (ms): from locked boots, or from floating within reach of a face (the tuck and the lock). */
export const faceMsOf = (fromBoots) => (fromBoots ? FACE_MS.release : 0) + FACE_MS.turn + FACE_MS.lock;
/** The words of a struck kick at a hatch (see the header). */
export const KICK_VOID_WHY = 'no kick in free fall';

/** The void's drill (see the header). */
export const VOID_DRILL = deepFreeze({
  id: 'void', family: 'void',
  beats: {
    undog: { k: 'door', ch: 'hands', how: 'undog', doer: true, after: ['approach@arrive', 'ready', 'muzzle', 'squeeze'] },
    lift: { k: 'door', ch: 'hands', how: 'hatch', doer: true, after: ['undog', 'approach@arrive', 'ready', 'muzzle', 'squeeze'] },
    brace: { k: 'brace', ch: 'hands', slots: [2], after: ['squeeze'] },
    hatch: { k: 'hatch', ch: 'feet', after: ['approach', 'lift', 'undog', 'let'] },
    plant: { k: 'plant', ch: 'feet', after: ['hatch'], cut: true },
    let: { k: 'let', ch: 'voice', slots: [2] },
    onface: { k: 'onface', ch: 'feet' },
    coaming: { k: 'coaming', ch: 'feet', after: ['door@pass'] },
  },
  muscle: {
    // STACK
    'void:stack': { group: 'stack', slot: 0, rung: 0, single: true, label: 'Stack on the hatch', as: 'stack:up', beats: ['out', 'approach', 'reorg', 'ready', 'muzzle', 'squeeze'], variants: { reorg: 'auto' } },
    'void:point': { group: 'stack', slot: 1, rung: 1, label: 'Stack up, take the hatch', as: 'stack:point', beats: ['out', 'approach', 'reorg', 'ready', 'muzzle', 'read', 'tell', 'squeeze'], variants: { reorg: 'auto' } },
    // DOOR (the hatch's singles: bundle.js singleRows' door rows at a hatch)
    'void:undog': { group: 'door', slot: 0, rung: 0, single: true, label: 'Undog the hatch', beats: ['undog'], row: 'door:undog' },
    'void:open': { group: 'door', slot: 1, rung: 0, single: true, label: 'Open the hatch', beats: ['door'], row: 'door:push' },
    'void:through': { group: 'door', slot: 2, rung: 0, single: true, label: 'Through the hatch', beats: ['hatch'], row: 'door:hatch' },
    'void:kick': { group: 'door', slot: 3, rung: 0, single: true, label: 'Kick the hatch', beats: [], offeredNow: 'struck', off: KICK_VOID_WHY },
    // BODY (the panel's face row, arms/shooting.js faceRows)
    'void:face': { group: 'body', slot: 0, rung: 0, single: true, label: 'Boots to the deckhead', beats: ['onface'], offeredNow: 'body' },
    // ROOM
    'void:in': { group: 'room', slot: 0, rung: 2, label: '{undog}, through: your face', as: 'room:in', beats: ['out', 'undog', 'door', 'coaming', 'enter', 'corner'] },
    'void:dominate': { group: 'room', slot: 1, rung: 2, label: 'Dominate', as: 'room:dominate', beats: ['enter', 'sector', 'inner', 'moving', 'far', 'farlook', 'clear', 'roomclear', 'status', 'mark'] },
    'void:clear': { group: 'room', slot: 2, rung: 3, label: '{undog}, clear the compartment', as: 'room:clear', beats: 'all-but-breach', variants: { reorg: 'auto' } },
  },
  groups: [['void:point'], ['void:in'], ['void:dominate']],
});

/** The void's rows by id ({ id, family: 'void', … }), MUSCLE's shape. */
export const VOID_MUSCLE_ROWS = deepFreeze(Object.fromEntries(Object.entries(VOID_DRILL.muscle).map(([id, b]) => [id, { id, family: VOID_DRILL.family, ...b }])));
/** The void's rows in the data's order. */
export const VOID_BUNDLES = Object.freeze(Object.values(VOID_MUSCLE_ROWS));
/** The catalogue's labels by rung (the build sheet §3.2's VOID_MUSCLE): the rows each rung runs whole. */
export const VOID_MUSCLE = deepFreeze({
  0: ['Stack on the hatch', 'Undog the hatch', 'Open the hatch', 'Through the hatch', 'Boots to the deckhead'],
  1: ['Stack up, take the hatch'],
  2: ['Stack up, take the hatch', 'Undog, through: your face', 'Dominate'],
  3: ['Undog, clear the compartment'],
});
/** A void row by id, or null. */
export const voidDef = (id) => VOID_MUSCLE_ROWS[id] ?? null;
/** The void's own beat ids (never in the house's 'all-but-breach'). */
export const VOID_BEATS = Object.freeze(Object.keys(VOID_DRILL.beats));
/** The house row a void row runs as, or its own id. */
export const asHouse = (id) => VOID_MUSCLE_ROWS[id]?.as ?? id;
/** The void row that runs as a house row ('room:clear' → 'void:clear'), or null. */
export const voidOfHouse = (houseId) => VOID_BUNDLES.find(b => b.as === houseId)?.id ?? null;
/** Every void row of a rung or below a test sheet counts as lived (drills/enter-and-clear.js livedAt's twin: the Wreck's fill writes drills.void with it; the face and the struck kick are the panel's, never a bundle). */
export const voidLivedAt = (rung) => VOID_BUNDLES.filter(b => b.rung <= rung && b.offeredNow !== 'body' && b.offeredNow !== 'struck').map(b => b.id);
