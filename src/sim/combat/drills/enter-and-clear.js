// OLYMPUS sim: the room's drill as data, COMBAT §7.7's enter-and-clear written as beats on four channels and the muscle-memory catalogue of rows they make (COMBAT §25.7.2, §25.19.2; the build sheet 0.0.12 §2.2, §8 items 8, 9).
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
// `halts` is the stepper's HALTS in the drill's words.
// 2026-11-12 (the shoot house's rework R3, COMBAT §25.19.2.1): `ready` by slot (bundle.js readyOf: #1 high ready, the #2 low
// ready, muzzle down), the muzzle onto the door #1's only, and `inner` (eyes, #1, after the sector and the feet at the point):
// the inner door the plan does not take asked from the point, never from the doorway; "Clear!" and the far leg wait on it.
// A contact suspends `enter`, the scans and the moves from rung 2 (stepper.js suspendFlow), so `cut` is what a hand-back
// below rung 2, or a step that needs the feet, does to them.
// 2026-11-12 (the shoot house's rework R4, COMBAT §25.19.2): **the muscle-memory catalogue**. `bundles` is replaced by MUSCLE,
// the rows by a room's phases (stack, door, room, weapon, team), each a list of the beats above, ending at "Room clear!" at the
// latest: no row is a mission ("Clear the house", 'house:clear', is withdrawn: the user's "the option to clear the whole house
// should not exist", 2026-11-11). Rung 0's singles: Stack up, Read the door, Open the door, Kick door; rung 1: Stack up, take
// point (the read and "Opens in, I go left."); rung 2's groups: "Stack up, take point", "Open, in: your corner", "Dominate"
// (the corporal's three presses a room); rung 3: "Open, clear the room", from wherever you stand. "Breach (explosive)" is
// data, offered struck with no charge issued (COMBAT §25.19.11 question 3's default); the weapon's and the team's rows wait
// for the stoppage's and the #2's stages (offeredNow false). New beats: `read` (the hinge, the swing, the lock), `tell`
// (#1 tells #2 how it opens and where he goes), `roomclear` (the leader's "Room clear!", after both "Clear!"s), `reorg` (a
// Top up on the approach, only where the row names it: the variant `reorg` 'auto', when the magazine is believed at half or
// less of its load and a fuller one is at hand) and `breach` (no handler until a charge is issued). REMOVED maps the old ids
// for the saves.
// 2026-11-12 (the rework's R5, COMBAT §25.19.5): `reorg` is the #2's too: his own Top up on his way to the next stack when half
// or less of his load is believed in and a fuller magazine is at hand ("Reloading!", then "Up."), his own decision, never a
// row's. Frozen. Pure.

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The last stretch of the approach in which a flowing hand pushes the door (the build sheet 0.0.12 §4: "the door pushed in the approach's last 0.6 m"). */
export const ARRIVE_M = 0.6;
/** The share of the leaf's swing at which a flowing body steps in (§4: "the step in at two thirds open"). */
export const PASS_SHARE = 2 / 3;
/** The catalogue's groups, the phases of a room (COMBAT §25.19.2): their order on the panel. */
export const GROUPS = Object.freeze(['stack', 'door', 'room', 'shot', 'weapon', 'team']);

/** The room's drill (see the header). */
export const ENTER_AND_CLEAR = deepFreeze({
  id: 'enter-and-clear', family: 'room',
  beats: {
    approach: { k: 'move', ch: 'feet', to: 'stack', stance: 'combat', cut: true },
    reorg: { k: 'reorg', ch: 'hands', slots: [1, 2], after: ['approach@0.1'], variant: 'reorg' },
    ready: { k: 'posture', ch: 'hands', to: 'highReady', after: ['approach@0.6'] },
    muzzle: { k: 'aim:point', ch: 'hands', to: 'door', slots: [1], after: ['ready'], rungs: [0, 1] },
    read: { k: 'read', ch: 'eyes', slots: [1], after: ['approach@0.6'], flowFrom: 3 },
    tell: { k: 'call', ch: 'voice', say: 'tell', slots: [1], after: ['read'] },
    squeeze: { k: 'call', ch: 'voice', say: 'ready', slots: [2], after: ['approach'] },
    door: { k: 'door', ch: 'hands', variant: 'breach', slots: [1], after: ['approach@arrive', 'ready', 'muzzle', 'squeeze'] },
    breach: { k: 'breach', ch: 'hands', slots: [1], after: ['squeeze'], needs: 'charge' },
    enter: { k: 'move', ch: 'feet', to: 'point', stance: 'entry', after: ['approach', 'door@pass'], cut: true },
    corner: { k: 'scan', ch: 'eyes', to: 'corner', after: ['enter@0.4'], cut: true },
    sector: { k: 'scan', ch: 'eyes', to: 'sector', after: ['corner'], cut: true },
    inner: { k: 'inner', ch: 'eyes', to: 'inner', slots: [1], after: ['sector', 'enter'] },
    far: { k: 'move', ch: 'feet', to: 'far', stance: 'combat', slots: [1], after: ['sector', 'inner'], cut: true },
    farlook: { k: 'scan', ch: 'eyes', to: 'far', slots: [1], after: ['far@0.8'], cut: true },
    clear: { k: 'call', ch: 'voice', say: 'clear', after: ['sector', 'farlook', 'inner'] },
    roomclear: { k: 'call', ch: 'voice', say: 'roomclear', slots: [1], after: ['clear'] },
    mark: { k: 'mark', ch: 'hands', slots: [1], after: ['roomclear', 'clear'] },
  },
  // (the catalogue, MUSCLE below, by the phases of a room; `rung` the lowest rung at which the row runs whole, `band` doctrine's
  // time band in game seconds, a sanity check the tests print against, never a timer)
  muscle: {
    // STACK
    'stack:up': { group: 'stack', slot: 0, rung: 0, single: true, label: 'Stack up', beats: ['approach', 'reorg', 'ready', 'muzzle', 'squeeze'], variants: { reorg: 'auto' }, band: { recruit: [4.0, 7.0], operator: [2.5, 4.0] } },
    'stack:point': { group: 'stack', slot: 1, rung: 1, label: 'Stack up, take point', beats: ['approach', 'reorg', 'ready', 'muzzle', 'read', 'tell', 'squeeze'], variants: { reorg: 'auto' }, band: { recruit: [4.5, 7.5], operator: [2.5, 4.0] } },
    'stack:on-him': { group: 'stack', slot: 2, rung: 1, label: 'Stack up on him', beats: [], offeredNow: false },
    // DOOR (its singles are the door's rows, bundle.js singleRows: 'door:read>', 'door:push>' or 'door:pull>', 'door:kick>')
    'door:read': { group: 'door', slot: 0, rung: 0, single: true, label: 'Read the door', beats: ['read'], row: 'door:read' },
    'door:open': { group: 'door', slot: 1, rung: 0, single: true, label: 'Open the door', beats: ['door'], variants: { breach: ['push', 'pull'] }, row: 'door:push' },
    'door:kick': { group: 'door', slot: 2, rung: 0, single: true, label: 'Kick door', beats: ['door'], variants: { breach: ['kick'] }, row: 'door:kick', band: { recruit: [1.3, 1.8], operator: [0.8, 1.2] } },
    'door:breach': { group: 'door', slot: 3, rung: 2, label: 'Breach (explosive)', beats: ['breach'], needs: 'charge', offeredNow: 'struck' },
    'door:flash': { group: 'door', slot: 4, rung: 2, label: 'Flash, then in', beats: [], needs: 'flashbang', offeredNow: false },
    // ROOM
    'room:in': { group: 'room', slot: 0, rung: 2, label: '{door}, in: your corner', beats: ['door', 'enter', 'corner'], variants: { breach: ['push', 'pull', 'kick'], entry: ['cross', 'hook'], stance: ['assault', 'combat'] } },
    'room:dominate': { group: 'room', slot: 1, rung: 2, label: 'Dominate', beats: ['enter', 'sector', 'inner', 'far', 'farlook', 'clear', 'roomclear', 'mark'] },
    'room:clear': { group: 'room', slot: 2, rung: 3, label: '{door}, clear the room', beats: 'all-but-breach', variants: { breach: ['push', 'pull', 'kick'], entry: ['cross', 'hook'], stance: ['assault', 'combat'], reorg: 'auto' }, band: { recruit: [12, 18], operator: [5, 6] } },
    'room:slice': { group: 'room', slot: 8, rung: 2, label: 'Slice the pie', beats: [], offeredNow: false },
    'room:limited': { group: 'room', slot: 9, rung: 2, label: 'Limited penetration', beats: [], offeredNow: false },
    // WEAPON (under contact, COMBAT §25.19.6: the stoppage's answers, built with the sidearm)
    'weapon:gun-down': { group: 'weapon', slot: 0, rung: 0, label: 'Gun down: {ia}', beats: [], when: 'stoppage', offeredNow: false },
    'weapon:transition': { group: 'weapon', slot: 1, rung: 0, label: 'Transition: pistol', beats: [], needs: 'pistol', when: 'stoppage or empty', offeredNow: false },
    'weapon:offline': { group: 'weapon', slot: 2, rung: 0, label: 'Off the line: to the wall, {ia}', beats: [], when: 'stoppage', offeredNow: false },
    'weapon:rifle-up': { group: 'weapon', slot: 3, rung: 0, label: 'Rifle up: holster, {ia}', beats: [], when: 'pistol in hand, rifle stopped, nobody facing', offeredNow: false },
    // TEAM (COMBAT §25.19.5)
    'team:cover': { group: 'team', slot: 0, rung: 0, label: 'Cover his sector', beats: [], when: '#2 gun down', offeredNow: false },
    'team:on-me': { group: 'team', slot: 1, rung: 0, label: 'On me', beats: [], when: '#2 off his slot', offeredNow: false },
    'team:hold': { group: 'team', slot: 2, rung: 1, label: 'Hold that door', beats: [], when: 'inner door, #2 nearer', offeredNow: false },
  },
  // (rung 2's groups, the order a corporal presses them: the stack, the door and in, the point and the sweep; the #2's one
  // group at a time below rung 3, a seam at each)
  groups: [['stack:point'], ['room:in'], ['room:dominate']],
  variants: { breach: ['push', 'pull', 'kick'], entry: ['cross', 'hook'], stance: ['assault', 'combat'], reorg: ['auto', 'off'], engage: ['off', 'armed'] },
  halts: ['contact', 'noshoot', 'refused', 'door-unplanned', 'two', 'gun', 'fail', 'seam', 'lane-end', 'stop', 'clear'],
});

/** The muscle-memory catalogue (COMBAT §25.19.2.2): the rows by id, each { id, family, group, slot, rung, label, beats, … }, in the data's order. */
export const MUSCLE = deepFreeze(Object.fromEntries(Object.entries(ENTER_AND_CLEAR.muscle).map(([id, b]) => [id, { id, family: ENTER_AND_CLEAR.family, ...b }])));
/** The catalogue's rows in the data's order (templates.js offered reads { id, family, rung }). */
export const BUNDLES = Object.freeze(Object.values(MUSCLE));
/** A row of the catalogue by id, or null. */
export const bundleDef = (id) => MUSCLE[id] ?? null;
/** The beat ids a row runs, in the drill's order: 'all-but-breach' every beat but the explosive breach. */
export const beatsOf = (b) => (b?.beats === 'all-but-breach' || b?.beats === 'all' ? Object.keys(ENTER_AND_CLEAR.beats).filter(k => k !== 'breach') : [...(b?.beats ?? [])]);
/** Every row of a rung or below that a test sheet counts as lived (rung 0's singles included; the rows not built yet left out). */
export const livedAt = (rung) => BUNDLES.filter(b => b.rung <= rung && b.offeredNow !== false).map(b => b.id);
/**
 * The ids the rework removed (COMBAT §25.19.2.2): a running doing or a carry of one of them in a save made before is mapped on
 * load (bundle.js upgradeMuscle): 'house:clear' onto 'room:clear' for the current leg's door, the others onto the row whose
 * beats they held where it keeps them, else dropped to the choice.
 */
export const REMOVED = Object.freeze({ 'house:clear': 'room:clear', 'room:stack': 'stack:up', 'room:stack-open': null, 'room:enter': 'room:in', 'room:open': null });
