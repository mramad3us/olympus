// OLYMPUS sim: the room's drill as data, COMBAT §7.7's enter-and-clear written as beats on four channels and the bundles a rung offers (COMBAT §25.7.2; the build sheet 0.0.12 §2.2, §8 items 8, 9).
//
// The player's slot (1) and the #2's (2) are the bundles' source; slots 3 and 4 wait for the fire team's join (§7).
// Each beat names its kind (bundle.js's handlers through the stepper: move, posture, aim:point, door, scan, call, mark,
// wait), its channel, what it goes to in the room plan (src/sim/combat/room.js roomPlanOf: 'stack', 'point', 'door',
// 'corner', 'sector'), its dependencies (`after`: a beat's id, 'id@0.6' a share of its time, 'id@pass' the door's leaf
// passable, 'id@arrive' the approach's last ARRIVE_M 0.6 m) and whether a contact cuts it where it stands (`cut`). The
// stepper runs them one at a time to rung 2 and overlaps hands and voice with the feet from rung 3, the eyes too at 4
// (stepper.js flowOf), so one list of beats gives the recruit's sum and the operator's flow.
//
// The bundles (as COMBAT §25.7.2 sketched them, amended by the build sheet's §8 item 8): 'room:stack' (Stack on the door)
// and 'room:open' (the door's row) are rung 0 singles, always in the panel, one press each, so the boot recruit plays
// the lane; 'room:stack-open', 'room:enter' and 'room:dominate' are rung 2's groups; 'room:clear' rung 3's room;
// 'house:clear' rung 4's lane (the plan's order, the hall's leg last). 'room:limited' and 'room:slice' stay in the data,
// offeredNow: false (§7). From rung 2 the muzzle onto the door rides the high ready (`muzzle` rungs 0 and 1 only: the
// trained hands bring the rifle up onto the door in one movement; my call, which reproduces the 0.0.12 sheet's §4 table).
// Dominate carries the body the rest of the way to its point first (its `enter` from wherever it stands: bundle.js
// pathFrom), then the sector, "Clear!" and the mark, so a group pressed from the doorway still ends on the point.
// A room with a far leg (a plan's `far`: room 3's L) has #1 walk it after his sector, Combat, his eyes onto the leg's
// middle at 0.8 of the walk (`far`, `farlook`), before "Clear!": the room's own dead space, not a branch, so T clears
// the whole room and the pause comes on whoever stands there (0.0.12's integration, my call; a plan without one skips them).
// The #2's whispered "Ready." (`squeeze`, his slot only) ends his stack at every rung, the single's too, so the man in
// front hears his number two is on him whether or not the group runs (0.0.12's integration).
// `variants`: the breach (push and pull by the swing, kick by the player; never chosen by the bundle), the entry (the
// plan's, the player may change it on the row), the stance of the entry (Combat below rung 3, Assault from 3).
// `halts` is the stepper's HALTS in the drill's words. Frozen. Pure.

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The last stretch of the approach in which a flowing hand pushes the door (the build sheet 0.0.12 §4: "the door pushed in the approach's last 0.6 m"). */
export const ARRIVE_M = 0.6;
/** The share of the leaf's swing at which a flowing body steps in (§4: "the step in at two thirds open"). */
export const PASS_SHARE = 2 / 3;

/** The room's drill (see the header). */
export const ENTER_AND_CLEAR = deepFreeze({
  id: 'enter-and-clear', family: 'room',
  beats: {
    approach: { k: 'move', ch: 'feet', to: 'stack', stance: 'combat', cut: true },
    ready: { k: 'posture', ch: 'hands', to: 'highReady', after: ['approach@0.6'] },
    muzzle: { k: 'aim:point', ch: 'hands', to: 'door', after: ['ready'], rungs: [0, 1] },
    squeeze: { k: 'call', ch: 'voice', say: 'ready', slots: [2], after: ['approach'] },
    door: { k: 'door', ch: 'hands', variant: 'breach', slots: [1], after: ['approach@arrive', 'ready', 'muzzle'] },
    enter: { k: 'move', ch: 'feet', to: 'point', stance: 'entry', after: ['approach', 'door@pass'], cut: true },
    corner: { k: 'scan', ch: 'eyes', to: 'corner', after: ['enter@0.4'], cut: true },
    sector: { k: 'scan', ch: 'eyes', to: 'sector', after: ['corner'], cut: true },
    far: { k: 'move', ch: 'feet', to: 'far', stance: 'combat', slots: [1], after: ['sector'], cut: true },
    farlook: { k: 'scan', ch: 'eyes', to: 'far', slots: [1], after: ['far@0.8'], cut: true },
    clear: { k: 'call', ch: 'voice', say: 'clear', after: ['sector', 'farlook'] },
    mark: { k: 'mark', ch: 'hands', slots: [1], after: ['clear'] },
  },
  bundles: {
    'room:stack': { rung: 0, single: true, beats: ['approach', 'ready', 'muzzle', 'squeeze'], label: 'Stack on the door', short: 'stack' },
    'room:open': { rung: 0, single: true, beats: ['door'], label: 'Open the door', short: 'open' },
    'room:stack-open': { rung: 2, beats: ['approach', 'ready', 'muzzle', 'squeeze', 'door'], label: 'Stack and open', short: 'stack · open' },
    'room:enter': { rung: 2, beats: ['enter', 'corner'], label: 'Enter and clear your corner', short: 'in · corner' },
    'room:dominate': { rung: 2, beats: ['enter', 'sector', 'far', 'farlook', 'clear', 'mark'], label: 'Dominate', short: 'point · sector · clear' },
    'room:clear': { rung: 3, beats: 'all', label: 'Clear the room', short: 'stack · open · in · sweep · clear' },
    'room:limited': { rung: 2, beats: ['approach', 'ready', 'door', 'enter:threshold', 'sector', 'back'], label: 'Limited penetration', offeredNow: false },
    'room:slice': { rung: 2, beats: ['approach', 'slice*'], label: 'Slice the pie', offeredNow: false },
    'house:clear': { rung: 4, lane: true, beats: 'all', label: 'Clear the house', short: 'the lane' },
  },
  // (the order of the groups below the rung that runs them whole: the #2's one step at a time, a seam at each)
  groups: [['room:stack-open'], ['room:enter'], ['room:dominate']],
  variants: { breach: ['push', 'pull', 'kick'], entry: ['cross', 'hook'], stance: ['assault', 'combat'] },
  halts: ['contact', 'noshoot', 'refused', 'door-unplanned', 'two', 'gun', 'fail', 'seam', 'lane-end', 'stop'],
});

/** The bundle records with their ids and family, in the data's order (templates.js offered reads { id, family, rung }). */
export const BUNDLES = deepFreeze(Object.entries(ENTER_AND_CLEAR.bundles).map(([id, b]) => ({ id, family: ENTER_AND_CLEAR.family, ...b })));
/** A bundle by id, or null. */
export const bundleDef = (id) => BUNDLES.find(b => b.id === id) ?? null;
/** The beat ids a bundle runs, in the drill's order: 'all' every beat. */
export const beatsOf = (b) => (b?.beats === 'all' ? Object.keys(ENTER_AND_CLEAR.beats) : [...(b?.beats ?? [])]);
/** Every bundle of a rung or below that a test sheet counts as lived (rung 0's singles included). */
export const livedAt = (rung) => BUNDLES.filter(b => b.rung <= rung && b.offeredNow !== false).map(b => b.id);
