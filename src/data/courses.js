// OLYMPUS data: the range's courses of fire, the tower's commands and the words of the range staff (WEAPONS §5.3, §6.4, §11.3; the build sheet 0.0.5 §2.2, §8 items 4 to 6).
//
// A course is authored (the Corps' procedure, the same in every career); what happens on it is
// procedural: the lane drawn on stream(seed, 'range:lane', course), the coach's set stoppage on
// stream(seed, 'arms:set', course) (which of `set.mags`, which round of `set.rounds`, which kind by
// weight), the tower's gaps on stream(seed, 'range:gap', i), the words by hash. fam25 is a new join's
// familiarisation fire at 25 m (the 0.0.6 row of ROADMAP §4.2, shipped as v0.0.5): three magazines of
// five, prone, kneeling, standing, on the 25 m card, alone on the line (the relay beside you comes
// with gunner.js at 0.0.7).
// SEQ is the tower's sequence (the Corps' commands, WEAPONS §5.3): each { id, say: [≥ 2 phrasings],
// ready, short? } where `ready` names what the range officer must see before he gives the next command
// (src/sim/scenarios/handling.js lineReady): 'always' (the brief, +firstGapMs), 'prone', 'magIn',
// 'cond1' (Condition 1 on safe), 'emptyLocked' (locked back on an empty magazine), 'safe' (on safe,
// the finger off), 'kneel1' / 'stand1' (the stance and Condition 1 on safe), 'shown' (the coach's
// "Clear." on an empty chamber); and each command hands the next a gap from roGapMs. The words
// carry {lane}, the lane in words. COACH holds the coach's lines (the voice beside you: the brief,
// the strings, the set stoppage after it is cleared, the faults), each ≥ 2 phrasings picked by hash.
// 0.0.6 (the user, 2026-11-07; DESIGN.md's log: "A scene never dead-ends", "One magazine a string"):
// NEEDS_ROUNDS names the readinesses that want rounds, so the coach's check (checkMs of a command
// waited, no rounds anywhere) lets a dry shooter sit the strings out; moveOnMs is how long of lived
// time the tower waits on one lane before it goes on (the nudge at nudgeMs before it); load is the
// course's kind of round (familiarisation fire is ball); kitMixed is setup 'mixed''s issue; the
// coach's new lines say the dry check, a string sat out or never fired, one magazine a string, the
// line moving on and the rifle he clears himself.
// 0.0.7 (the build sheet 0.0.7 §2.3, §4; WEAPONS §11.1, §11.3, §11.4): the kd course, test-range's "The line
// at 300 m": the zero at 25 m on the bay (three-round groups, the coach reading each, the clicks dialled, at
// most ZERO_GROUPS_MAX 4), the walk to the 300 m line behind its splash, the confirm prone at 4x (five
// rounds slow fire on the A face, each marked by the pits), the pits behind their splash (relay 2's confirm)
// and the walk to the 200 m line, ten rounds rapid sitting in 60 s with the magazine change inside the string
// (mags: 2, this course's written exception to one magazine a string: the sheet's §8 item 11), the brass
// policed and the rounds turned in at each line, the declaration, the end. SEQ_KD is its tower: each
// command { id, ready, say, stage, line?, string? }, the zero's loop written as `next` (after 'dial': the
// unload once zeroed or at the fourth group, else 'reload', which leads back to 'fire'); its readinesses
// (src/sim/scenarios/range.js kdReady): zeroRead (the coach has read the group), dialled (the coach's call
// dialled, or nothing called), optic4, dope (the turrets at the believed dope for the line), arrived (the
// splash landed at the next line), sitMag (sitting, a magazine in), sit1 (sitting, Condition 1 on safe),
// policed (your brass picked up), turnedIn (no rounds on you), declared; the strings (KD_STRINGS) carry
// their line, paper, rounds, magazines, time limit and whether the pits mark each shot or all together
// after. A command's `short` is its terms in a line the radio box can keep beside a voice that wraps
// ("Ten rounds rapid, sixty seconds. Commence fire.": handling.js standingCmd; 0.0.7's tower fixer, so a
// shortened command never loses its rounds or its time), else the nudge's words. KD_COACH and KD_RO are the coach's and the range officer's new lines (two phrasings or more).
// 0.0.8 (the build sheet 0.0.8 §2.3, §4; COMBAT §25.10.3): the pairs course, test-pairs' "Pairs": the 25 m bay's 7 m and
// 10 m lines and its six turners, five strings on the coach's shot timer, the R-7 and three magazines (10, 10 and 2 in
// chest pouches 1, 2 and 3, ball). SEQ_PAIRS is its sequence, given by the coach beside you (no RO on the tower: his
// commands are speech, the sheet's §8 item 20): the brief, LOAD, MAKE READY, then each string's "Standby" (the turn
// comes a drawn gap after it while you wait out of stop motion at low ready) and the coach's "Stop" after it, the walk
// back to the 10 m line before string 2, the short magazine before string 4, the lull's Top up after it (the lull opens at the last string's end or at "Lull", whichever comes first; at it the
// coach hands over a fresh magazine of lullMag 10 into a pouch with room, so there is something to top up with: the
// fixer's, 0.0.8), UNLOAD, SHOW CLEAR and the end. Its readinesses (src/sim/scenarios/pairs.js pairsReady): pairsReady (out of stop motion, still, the
// rifle at low ready in Condition 1 on safe, the finger off, in the line's box; or dry and on safe), stringDone (the
// string over), shortReady (pairsReady with the short magazine in), toppedUp (pairsReady with the magazine in believed
// above half, or a Top up seated since the lull began, or nothing fuller to top up with). One magazine a string is waived
// on this course (oneMag false, the sheet's §8 item 19: string 4's RELOAD is the point). PAIRS_COACH is the coach's
// words (two phrasings or more), {paper} the shot timer's line (pairs.js paperText).
// 0.0.9 (the build sheet 0.0.9 §2.2, §4, §8 items 4 and 5; COMBAT §25.18.3): "Three bangs", test-pairs' setup 'bangs':
// COURSES.pairs.bangs is the coach's three training bangs in the first string's standby (string 0, "string 1" in the
// user's counting): n of them gapMs apart, the first a lead drawn from leadMs into the armed standby, each behindM behind
// the point and spread ±spreadM across it, thrown throwMs before it goes off, the turn turnMs after the third. The coach's
// bangsBrief says noise, never "Bang" (a shooter told "Bang" is forewarned: COMBAT §5.1's ×0.6), and bangsAfter follows
// the banged string's paper.
// 0.0.10 (the build sheet 0.0.10 §2.2, §4, §8 items 2 to 10; COMBAT §25.18.3): the stress course, test-stress's "Bang", run on
// pairs.js's engine (R.course 'pairs', R.stress selecting it): COURSES.stress has every field of COURSES.pairs with its value
// but the magazines (10, 10 and the coach's one-round one), the strings (calm, the din, a bang called, three bangs, the
// three bangs again on the short magazine), every string at 7 m with one threat (draws.one), the teacher whose cap the
// inoculation reaches ('cadre', SKILLS §6.8) and the noise: din (an air horn of hornS seconds at the din's start and after
// every hornEvery-th blank, blanks blanks fired by the coach at your shoulder, the first firstBlankMs into the din, then a
// gap drawn from gapMs each, his muzzle muzzleFwdM downrange of him; the din a lead drawn from leadMs into the armed
// standby, the turn a draw from turnMs into it), call (the coach's "Bang!" callMs before the burst, the burst a lead from
// leadMs, the turn turnMs after it), bangs (pairs' three, the same numbers), reload (string 5's second turner, a draw from
// turnMs after the RELOAD's start, or maxMs after the first turn if no RELOAD came); restMs, the least the coach lets pass
// after his last noise before the next string's "Standby" (his "Stop" waits for it), so each string's chaos starts from
// a pool mostly drained (my call: from three bangs at 79 the pool is 39 after 20 s). SEQ_STRESS is its sequence: SEQ_PAIRS'
// commands without the walk back to the ten, every standby on the 7 m line, its words naming the noise but on strings 4
// and 5 ("Standby." only: unannounced), the one-round magazine before string 5. STRESS_COACH is the coach's words (two
// phrasings or more): "Bang!" is a call, never "Bang out" (that would be prepared: COMBAT §5.1).
// 0.0.12 (the build sheet 0.0.12 §2.3, §4; COMBAT §25.10.4): the house course, test-shoothouse's "Stack and clear", lane A of
// house 1 in the Wheel's sector 4 at 1 G (src/sim/scenarios/shoothouse.js, on handling.js's engine with R.course 'house'):
// the 'house-cqb' issue (three magazines of ten frangible, the dummy riding in the first as its round dummyRound 3 to 6, so
// 29 rounds are issued), the instructor on the catwalk (no RO on a tower: his commands are the PA's). SEQ_HOUSE is its
// sequence: the brief, LOAD, MAKE READY (its readiness houseStart: on the start mark, still, Condition 1, on safe, the
// finger off, low ready, gait Combat, the #2 in place), Standby (goArm: the scene arms GO itself, standbyMs after it),
// GO (laneDone: the lane over), Stop (houseSafe: on safe, the finger off, still), UNLOAD, SHOW CLEAR, the hot wash (washed:
// washMs lived or behind the brief splash) and the end. pars are the instructor's timer's (basic, advanced, operator: from a
// threat's sighting to the first round on it by either of you), parOfTier each sheet's default; draws the stands' faces and
// holds and the #2's pick (by weight); gaps the turners' (a door's after its leaf is open, the hall's after the zone). The
// rest are the scene's numbers (the sheet's §4). HOUSE_CHIEF is the instructor's words (two phrasings or more): his faults
// as he calls them from the catwalk ("Don't stop in the door!", "Your corner!", "Muzzle!"), the hot wash's lines; HOUSE_NUDGE
// what he says to a shooter the line waits on. v0.0.25 ("Hold to hold"): SEQ_WRECK, the Wreck's sequence command for command SEQ_HOUSE's,
// WRECK_CHIEF the cadre's words of the void (its faults: floating, the open middle, the hatch, feet aft), WRECK_LEGS the compartments'
// words, WRECK_ROLES set A's roles, HOUSE_NUDGE's 'boots'. Data only.
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The tower's commands in order (see the header). */
export const SEQ = deepFreeze([
  { id: 'brief', ready: 'always', say: ['Range is open. Familiarisation fire, two-five metres: three strings of five, prone, kneeling, standing. The line is cold.',
    'The range is open. Two-five metre familiarisation: three strings of five rounds, prone, kneeling, standing. The line is cold.'] },
  { id: 'prone', ready: 'prone', say: ['Shooters, assume the prone position.', 'Firing line, get down: the prone position.'] },
  { id: 'load', ready: 'magIn', short: 'Five rounds, LOAD.', say: ['With a magazine of five rounds, LOAD.', 'Shooters, with a magazine of five rounds, LOAD.'] },
  { id: 'ready', ready: 'cond1', say: ['MAKE READY.', 'Shooters, MAKE READY.'] },
  { id: 'fire', ready: 'emptyLocked', string: 0, say: ['Ready on the right. Ready on the left. All ready on the firing line. Commence fire.',
    'Is the line ready? Ready on the right, ready on the left. All ready on the firing line. Commence fire.'] },
  { id: 'cease', ready: 'safe', string: 0, say: ['CEASE FIRE.', 'CEASE FIRE, CEASE FIRE.'] },
  { id: 'kneel', ready: 'kneel1', say: ['Kneeling. RELOAD.', 'Shooters, the kneeling position. RELOAD.'] },
  { id: 'fire', ready: 'emptyLocked', string: 1, say: ['Ready on the right. Ready on the left. All ready on the firing line. Commence fire.',
    'All ready on the right. All ready on the left. All ready on the firing line. Commence fire.'] },
  { id: 'cease', ready: 'safe', string: 1, say: ['CEASE FIRE.', 'CEASE FIRE, CEASE FIRE.'] },
  { id: 'stand', ready: 'stand1', say: ['Standing. RELOAD.', 'Shooters, on your feet: the standing position. RELOAD.'] },
  { id: 'fire', ready: 'emptyLocked', string: 2, say: ['Ready on the right. Ready on the left. All ready on the firing line. Commence fire.',
    'Last string. Ready on the right, ready on the left. All ready on the firing line. Commence fire.'] },
  { id: 'cease', ready: 'safe', string: 2, say: ['CEASE FIRE.', 'CEASE FIRE, CEASE FIRE.'] },
  { id: 'clear', ready: 'shown', say: ['UNLOAD, SHOW CLEAR.', 'Shooters, UNLOAD, SHOW CLEAR to your coach.'] },
  { id: 'end', ready: 'never', say: ['The line is clear.', 'The line is clear. Make your way off the line.'] },
]);

/** The readinesses that want rounds in the rifle: the coach checks for none while the tower waits on one (0.0.6). */
export const NEEDS_ROUNDS = Object.freeze(['magIn', 'cond1', 'kneel1', 'stand1', 'emptyLocked', 'sitMag', 'sit1', 'pairsReady', 'shortReady', 'toppedUp', 'houseStart']);

/** Which command each macro answers (a macro acted on before its command is given is ahead of the tower). */
export const MACRO_CMD = deepFreeze({ load: ['load', 'sit'], ready: 'ready', clear: 'clear', cease: 'cease', unload: 'clear',
  'reload:speed': ['kneel', 'stand', 'reload'], 'reload:retain': ['kneel', 'stand', 'reload'], 'reload:tactical': ['kneel', 'stand', 'reload'] });
/**
 * Which command each macro completes, marked ◉ in the step panel: MACRO_CMD but UNLOAD, which answers 'clear'
 * for the warning but never shows the rifle to the coach, so the tower would still wait for the show (the
 * runtime review: both rows marked, and the first, taken, cost its 4.1 s of the pace scored).
 */
export const MACRO_MARK = deepFreeze({ load: ['load', 'sit'], ready: 'ready', clear: 'clear', cease: 'cease',
  'reload:speed': ['kneel', 'stand', 'reload'], 'reload:retain': ['kneel', 'stand', 'reload'], 'reload:tactical': ['kneel', 'stand', 'reload'] });

/** The courses (see the header). */
export const COURSES = deepFreeze({
  fam25: {
    word: 'familiarisation fire, 25 m', paper: 'card25', lanes: [1, 6], lane: { from: 2, to: 5 }, mags: [5, 5, 5], strings: ['prone', 'kneel', 'stand'],
    set: { mags: [2, 3], rounds: [2, 4], kinds: [['dud', 40], ['stovepipe', 35], ['double', 25]] },
    roGapMs: [1500, 4000], firstGapMs: 3000, nudgeMs: 30000, checkMs: 3000, moveOnMs: 60000, load: 'ball', kit: 'range-fam', kitMixed: 'range-mixed', hour: 9.0,
  },
  // (0.0.7: test-range's course (see the header); lanes: the bay's for the zero, the KD's 6 + bay lane after it)
  kd: {
    word: 'the line at 300 m', paper: 'zero25', lanes: [1, 6], lane: { from: 2, to: 5 }, mags: [3, 3, 3, 3], strings: ['prone'], seq: 'kd',
    roGapMs: [1500, 4000], firstGapMs: 3000, nudgeMs: 30000, checkMs: 3000, moveOnMs: 60000, load: 'ball', kit: 'range-kd', hour: 10.0,
    zeroGroupsMax: 4, zeroOkCm: 1.0, relayN: 6, relay2N: 6, kdLaneK: 6, policeM: 4, policeCaseS: 1.2, pitsMin: 20,
    dummyIn: [['confirm', 30], ['s200-1', 35], ['s200-2', 35]], dummyRound: [2, 4],
    // (the armoury round's stage 0: a case at rest kept and counted on the area's tiles, brass.js settle; the course's own literal before)
    brassTiles: true,
  },
  // (0.0.8: test-pairs' course (see the header); the strings' draws by their weights: pairs.js drawStrings)
  pairs: {
    word: 'pairs at seven and ten metres', paper: 'man', lanes: [1, 6], lane: { from: 2, to: 5 }, mags: [10, 10, 2], pouches: [1, 2, 3], strings: ['one', 'two', 'noshoot', 'armoured', 'short'],
    roGapMs: [800, 1600], firstGapMs: 3000, nudgeMs: 30000, checkMs: 3000, moveOnMs: 60000, load: 'ball', kit: 'range-pairs', hour: 11.0, oneMag: false, seq: 'pairs',
    standbyMs: [1500, 4000], stringMaxMs: 20_000,
    // (the fresh magazine the coach hands over at "Lull", so the lull has something to top up with (the fixer's, 0.0.8))
    lullMag: 10,
    // (Top up offered with the magazine believed empty and a round up: the lull after the dry string's last rounds (drills.js))
    spoutTopUp: true,
    // (0.0.9: setup 'bangs': the coach's three training bangs in string 0's armed standby (see the header))
    bangs: { string: 0, n: 3, leadMs: [1500, 3000], gapMs: 1000, turnMs: 2000, behindM: 1.5, spreadM: 0.5, throwMs: 600 },
    // (who turns: the lane offset from yours and its weight; a threat's holds and a no-shoot's)
    draws: {
      one: [[0, 50], [-1, 25], [1, 25]], two: [[-1, 50], [1, 50]], armoured: [[0, 50], [-1, 25], [1, 25]], short: [[-1, 50], [1, 50]],
      threatHolds: [['rifle', 70], ['pistol', 30]], noshootHolds: [['hands', 60], ['phone', 40]],
    },
  },
  // (0.0.12: test-shoothouse's course, on handling.js's engine with the scene's own readinesses (see the header))
  house: {
    word: 'the shoot house, lane A', paper: 'man', lanes: [1, 7], mags: [10, 10, 10], strings: ['lane'],
    roGapMs: [800, 1600], firstGapMs: 3000, nudgeMs: 30000, checkMs: 3000, moveOnMs: 60000, load: 'frangible', kit: 'house-cqb', hour: 10.0, oneMag: false, seq: 'house',
    standbyMs: [1500, 4000], dummyRound: [3, 6],
    pars: { basic: 3000, advanced: 1500, operator: 800 },
    parOfTier: { recruit: 'basic', private: 'basic', lcpl: 'advanced', cpl: 'advanced', sgt: 'advanced', ssgt: 'advanced', raider: 'operator', tierone: 'operator' },
    draws: {
      two: [['ft2-tl', 40], ['ft2-ar', 30], ['ft2-aar', 30]],
      faces: { '1b': [['threat', 50], ['noshoot', 50]], '3a': [['threat', 50], ['noshoot', 50]] },
      threatHolds: [['rifle', 70], ['pistol', 30]], noshootHolds: [['hands', 60], ['phone', 40]],
      // (the drawn house (the build sheet v0.0.21 §1 items 2 to 4; house lens H4 to H6; src/sim/scenes/assemble.js): each
      // lane door's swing (push or pull, 50/50: the hinge never drawn, always downrange) and state (closed 60, open 25, locked 15; a
      // pull never locked: the weights without it), and each stand's role by its chunk (src/data/chunks/x4.js stands): its faces'
      // weights, its set face (layout A's, the cast a drawn lane falls back to), its door gap where it turns on its door (A's 2a's
      // and 3a's). The roles travel with their rooms: the corner's armoured man and the ell's hostage go where their rooms go, and
      // the hostage may stand in either (at most one a lane); the lens's 'unknown' face and empty stand wait for rules that score
      // them (my call))
      doors: { swing: { push: 50, pull: 50 }, state: { closed: 60, open: 25, locked: 15 } },
      cast: {
        'centre-a': { faces: [['threat', 75], ['noshoot', 25]], set: 'threat' },
        'centre-b': { faces: [['threat', 50], ['noshoot', 50]], set: 'noshoot' },
        'corner-a': { faces: [['armoured', 40], ['threat', 30], ['hostage', 30]], set: 'armoured', gapMs: [300, 1200] },
        'corner-b': { faces: [['noshoot', 100]], set: 'noshoot' },
        'ell-a': { faces: [['threat', 50], ['noshoot', 50]], set: 'threat', gapMs: [500, 1500] },
        'ell-b': { faces: [['hostage', 40], ['threat', 30], ['armoured', 30]], set: 'hostage' },
        // (X4's other five rooms (its build sheet item 13; house lens G2; my calls, the lens's tables without its 'unknown' face
        // and empty stand, which nothing scores yet): each room's 'a' stand turns on its door and is the live post's (chunks/x4.js
        // posts), its 'b' at GO; the twin's 'b' is the back room's (the far walk finds him), the hostage's room by turns)
        'wide-a': { faces: [['threat', 75], ['noshoot', 25]], set: 'threat', gapMs: [300, 1200] },
        'wide-b': { faces: [['threat', 50], ['noshoot', 50]], set: 'noshoot' },
        'deep-a': { faces: [['threat', 100]], set: 'threat', gapMs: [500, 1500] },
        'deep-b': { faces: [['threat', 45], ['noshoot', 45], ['hostage', 10]], set: 'noshoot' },
        'offset-a': { faces: [['armoured', 50], ['threat', 50]], set: 'armoured', gapMs: [300, 1200] },
        'offset-b': { faces: [['noshoot', 100]], set: 'noshoot' },
        'twin-a': { faces: [['threat', 50], ['noshoot', 50]], set: 'threat', gapMs: [500, 1500] },
        'twin-b': { faces: [['threat', 75], ['hostage', 25]], set: 'threat' },
        'small-a': { faces: [['threat', 100]], set: 'threat', gapMs: [300, 1200] },
        'small-b': { faces: [['noshoot', 100]], set: 'noshoot' },
      },
    },
    gaps: { door: { 'w4.r2': [300, 1200], 'w4.r3': [500, 1500] }, doorOther: [300, 1200], zone: [1500, 3000] },
    funnelM: 0.5, funnelFaultMs: 1000, twoSlotM: 1.5, twoWaitMs: 3000, twoBehindM: 0.65, stackM: 0.4,
    stallMs: 60_000, stallMoreMs: 30_000, laneMaxMs: 600_000, washMs: 90_000,
    // (the lane's due (shoothouse.js stall, COMBAT §25.10; my call, 2026-11-16): each leg after the current one keeps legLastMs (the
    // words at once, the pass stallMoreMs after, 15 s to walk to its door), so the lane ends by laneMaxMs − laneKeepMs, 585 s, by
    // construction; laneMaxMs stays the net (the gauges' F14: the fuzz private on 1111 ran to 600 s on v0.0.20's integration))
    laneKeepMs: 15_000, legLastMs: 45_000,
    // (SHOW CLEAR to the eye (its build sheet's item 1, FL22-1; COMBAT §25.10.4): the instructor walks the catwalk to the
    // marine he inspects and calls a gun clear only with his eye within showClearM of the marine's chest (his eye at the catwalk's
    // 3.0 m, the chest at 1.3 m: at most 1.8 m along) for showLookMs; the tower's "The lane is clear." washAfterMs after the last "Clear.")
    showClearM: 2.5, showLookMs: 600, washAfterMs: 800,
    // (the rework's R6, COMBAT §25.19.6: the P-12 on every sheet from 2026-11-15, the Sergeant up before (arms/sidearm.js SIDEARM_TIERS), the house's ten frangible a magazine)
    sidearm: { model: 'p12', mags: [['had17', 10, 'frangible'], ['had17', 10, 'frangible']] },
    // (v0.0.19, "Stack and clear, live" (the build sheet v0.0.19 §1 L-house; COMBAT §25.18): the stands the role-players take, in
    // the fill's order (src/sim/scenarios/opfor.js); a man of a leg already cleared seen up again holds the next "Clear!" this long
    // at most, as the gate does (bundle.js CLEAR_HOLD_MS), before the stall's words; and the team's own words at a live man: your
    // number two's "Got him." when he covers a man down or with his hands up, a marine's "I'm hit!" at his casualty and the
    // other's "Man down!" (my calls)
    // (paintCallMs (FL22-2; my call): a man's strikes on one marine within it are called as one, when the last has landed: a
    // pair's span at the role-players' cadence, so "Keep working." is never said over a strike the next round makes fatal)
    opfor: { stands: ['2a', '3a'], got: ['Got him.', 'Got him. Covering.'], hit: ["I'm hit!", "I'm hit! I'm hit!"], manDown: ['Man down!', 'Man down! Man down!'], paintCallMs: 600 },
  },
  // (0.0.10: test-stress's course, on pairs.js's engine (see the header); src/sim/scenarios/stress.js)
  stress: {
    word: 'the stress course at seven metres', paper: 'man', lanes: [1, 6], lane: { from: 2, to: 5 }, mags: [10, 10, 1], pouches: [1, 2, 3], strings: ['calm', 'din', 'called', 'bangs', 'reload'],
    roGapMs: [800, 1600], firstGapMs: 3000, nudgeMs: 30000, checkMs: 3000, moveOnMs: 60000, load: 'ball', kit: 'range-pairs', hour: 11.0, oneMag: false, seq: 'stress',
    standbyMs: [1500, 4000], stringMaxMs: 20_000, lullMag: 10, spoutTopUp: true, teacher: 'cadre', restMs: 20_000,
    din: { leadMs: [500, 1500], hornS: 2, hornEvery: 10, blanks: 30, firstBlankMs: 500, gapMs: [250, 450], turnMs: [8500, 10_000], muzzleFwdM: 0.8 },
    call: { leadMs: [1500, 3000], callMs: 1000, turnMs: 2000 },
    bangs: { n: 3, leadMs: [1500, 3000], gapMs: 1000, turnMs: 2000, behindM: 1.5, spreadM: 0.5, throwMs: 600 },
    reload: { turnMs: [1500, 2500], maxMs: 10_000 },
    draws: { one: [[0, 50], [-1, 25], [1, 25]], threatHolds: [['rifle', 70], ['pistol', 30]], noshootHolds: [['hands', 60], ['phone', 40]] },
  },
  // (test-anchors' course, "Anchor before you fire", in Well A at Phobos (AW§5; the build sheet v0.0.24 §1 D;
  // src/sim/scenarios/anchors.js): five stations, each a string at the live face after the anchor its station wants, the move to
  // it part of its time. No tower: the cadre's commands are the course's own (seq 'anchors', no SEQ of handling.js's). My calls:
  // the house's kit (its frangible, the School's live fire); the station's standby 1.0 to 2.5 s once you stand anchored at its
  // mark; the turner's exposure 12 s (at 8 s the recruit's string at 10 m ran short on a fumbled Off safe); a station passed
  // after 120 s of lived time not reached, never a dead end (the longest move, station three to the wedge, about 28 m of hops
  // between pad-eyes, takes the recruit 90 s and more); the floating string's drift watched 60 s for the grab before the cadre
  // calls it; the floating station counts you out in the open at floatOutM 1.5 m from its mark drifting at driftMinVMs 0.1 m/s)
  anchors: {
    word: 'the void range, Well A', paper: 'man', lanes: [1, 5], mags: [10, 10, 10], strings: ['boots', 'lanyard', 'onehand', 'wedge', 'floating'],
    roGapMs: [800, 1600], firstGapMs: 3000, nudgeMs: 30000, checkMs: 3000, moveOnMs: 120_000, load: 'frangible', kit: 'house-cqb', hour: 10.0, oneMag: false, seq: 'anchors',
    sidearm: { model: 'p12', mags: [['had17', 10, 'frangible'], ['had17', 10, 'frangible']] },
    briefMs: 7000, standbyMs: [1000, 2500], exposeMs: 12_000, nextGapMs: 3000, driftMaxMs: 60_000, arriveM: 1.0, floatOutM: 1.5, driftMinVMs: 0.1, endAfterMs: 4000,
    // (the safety boat: a body floating still with no hold in reach for stuckMs is fetched to the station's mark boatMs after the
    // cadre's word, holding the boat's line on its pad-eye: never a dead end in the open well)
    stuckMs: 8000, boatMs: 5000,
  },
  // (test-armoury's "The window and the canopy" (its build sheet item 1, §5; src/sim/scenarios/armoury-day.js): no tower, no paper;
  // the issue line pushed empty at the start (mags []) and filled at the count (ISSUE_N 20, three HAD-30s drawn empty, MAGS_DRAWN 3), the
  // relay's lane drawn from the bay's 2 to 5, the brass on the tiles; the speakers' gaps (roGapMs) short, the line's nudge and move-on the
  // range's; one magazine a string waived (no string is fired lived)
  armoury: {
    word: 'the armoury and the canopy', paper: 'card25', lanes: [1, 6], lane: { from: 2, to: 5 }, mags: [], strings: [], seq: 'armoury',
    roGapMs: [1000, 2500], firstGapMs: 3000, nudgeMs: 30000, checkMs: 3000, moveOnMs: 60000, load: 'ball', kit: 'armoury-draw', hour: 7 + 50 / 60,
    issueN: 20, magsDrawn: 3, oneMag: false, brassTiles: true,
  },
});

/** The kd course's strings (the build sheet 0.0.7 §4): line, paper, position, rounds, magazines, time limit, marked each shot ('each') or all after ('after'). */
export const KD_STRINGS = deepFreeze({
  zero: { line: 25, paper: 'zero25', position: 'prone', rounds: 3, mags: 1, limitS: null, marked: null },
  confirm: { line: 300, paper: 'kdA', position: 'prone', rounds: 5, mags: 1, limitS: 300, marked: 'each' },
  s200: { line: 200, paper: 'kdA', position: 'sit', rounds: 10, mags: 2, limitS: 60, marked: 'after', rapid: true },
});

/** The kd course's tower (see the header). */
export const SEQ_KD = deepFreeze([
  { id: 'brief', ready: 'always', stage: 'zero', line: 25, say: ['Range is open. Relay one: zero at two-five metres in three-round groups, confirm at three hundred, then two hundred sitting, rapid. The line is cold.',
    'The range is open. Relay one zeroes at two-five metres, three rounds a group; the three hundred to confirm; ten rapid sitting at the two hundred. The line is cold.'] },
  { id: 'prone', ready: 'prone', stage: 'zero', say: ['Shooters, assume the prone position.', 'Firing line, get down: the prone position.'] },
  { id: 'load', ready: 'magIn', stage: 'zero', short: 'Three rounds, LOAD.', say: ['With a magazine of three rounds, LOAD.', 'Shooters, with a magazine of three rounds, LOAD.'] },
  { id: 'ready', ready: 'cond1', stage: 'zero', say: ['MAKE READY.', 'Shooters, MAKE READY.'] },
  { id: 'fire', ready: 'emptyLocked', stage: 'zero', string: 'zero', short: 'Three rounds. Commence fire.', say: ['Three rounds at your zeroing card. All ready on the firing line. Commence fire.', 'Your group of three. Ready on the right, ready on the left. Commence fire.'] },
  { id: 'cease', ready: 'safe', stage: 'zero', string: 'zero', say: ['CEASE FIRE.', 'CEASE FIRE, CEASE FIRE.'] },
  { id: 'group', ready: 'zeroRead', stage: 'zero', say: ['Shooters, read your groups with your coach.', 'Coaches, read the groups.'] },
  { id: 'dial', ready: 'dialled', stage: 'zero', next: 'zeroLoop', say: ['Make your sight corrections.', 'Shooters, dial your corrections.'] },
  { id: 'reload', ready: 'cond1', stage: 'zero', next: 'fire', short: 'Three rounds, RELOAD.', say: ['Your next magazine of three. RELOAD.', 'Shooters, the next three rounds. RELOAD.'] },
  { id: 'clear', ready: 'shown', stage: 'zero', say: ['UNLOAD, SHOW CLEAR.', 'Shooters, UNLOAD, SHOW CLEAR to your coach.'] },
  { id: 'police', ready: 'policed', stage: 'zero', say: ['Police your brass.', 'Shooters, police your brass.'] },
  { id: 'turnIn', ready: 'turnedIn', stage: 'zero', say: ['Unused rounds to your coach.', 'Any rounds you have left, to your coach.'] },
  { id: 'walk', ready: 'arrived', stage: 'walk', line: 300, short: 'To the three hundred.', say: ['Relay one, to the three-hundred-metre line.', 'Relay one, move to the three hundred.'] },
  { id: 'prone', ready: 'prone', stage: 'confirm', line: 300, say: ['Shooters, assume the prone position.', 'Relay one, get down: the prone position.'] },
  { id: 'optic', ready: 'optic4', stage: 'confirm', say: ['Optics to four power.', 'Shooters, your optics to four power.'] },
  { id: 'dope', ready: 'dope', stage: 'confirm', line: 300, short: 'Your dope for three hundred.', say: ['Set your dope for three hundred.', 'Shooters, dial your dope for three hundred.'] },
  { id: 'load', ready: 'magIn', stage: 'confirm', short: 'Five rounds, LOAD.', say: ['With a magazine of five rounds, LOAD.', 'Shooters, with a magazine of five rounds, LOAD.'] },
  { id: 'ready', ready: 'cond1', stage: 'confirm', say: ['MAKE READY.', 'Shooters, MAKE READY.'] },
  { id: 'fire', ready: 'emptyLocked', stage: 'confirm', string: 'confirm', short: 'Five rounds slow, five minutes. Commence fire.', say: ['Five rounds slow fire, five minutes. All ready on the firing line. Commence fire.', 'Slow fire, five rounds. Ready on the right, ready on the left. Commence fire.'] },
  { id: 'cease', ready: 'safe', stage: 'confirm', string: 'confirm', say: ['CEASE FIRE.', 'CEASE FIRE, CEASE FIRE.'] },
  { id: 'clear', ready: 'shown', stage: 'confirm', say: ['UNLOAD, SHOW CLEAR.', 'Shooters, UNLOAD, SHOW CLEAR to your coach.'] },
  { id: 'police', ready: 'policed', stage: 'confirm', say: ['Police your brass.', 'Shooters, police your brass.'] },
  { id: 'turnIn', ready: 'turnedIn', stage: 'confirm', say: ['Unused rounds to your coach.', 'Any rounds you have left, to your coach.'] },
  { id: 'pits', ready: 'arrived', stage: 'pits', line: 200, short: 'Relay one, to the pits.', say: ['Relay one to the pits. Relay two, to the line.', 'Relay one, you are pulling butts. Relay two to the three hundred.'] },
  { id: 'dope', ready: 'dope', stage: 's200', line: 200, short: 'Your dope for two hundred.', say: ['Set your dope for two hundred.', 'Shooters, dial your dope for two hundred.'] },
  { id: 'sit', ready: 'sitMag', stage: 's200', short: 'Sitting, five rounds. LOAD.', say: ['The sitting position. With a magazine of five rounds, LOAD.', 'Shooters, sitting. With a magazine of five rounds, LOAD.'] },
  { id: 'ready', ready: 'sit1', stage: 's200', say: ['MAKE READY.', 'Shooters, MAKE READY.'] },
  { id: 'fire', ready: 'emptyLocked', stage: 's200', string: 's200', short: 'Ten rounds rapid, sixty seconds. Commence fire.', say: ['Ten rounds rapid, sixty seconds, your magazine change in the string. Commence fire.', 'Rapid fire, ten rounds, two magazines, sixty seconds. Commence fire.'] },
  { id: 'cease', ready: 'safe', stage: 's200', string: 's200', say: ['CEASE FIRE.', 'CEASE FIRE, CEASE FIRE.'] },
  { id: 'clear', ready: 'shown', stage: 's200', say: ['UNLOAD, SHOW CLEAR.', 'Shooters, UNLOAD, SHOW CLEAR to your coach.'] },
  { id: 'police', ready: 'policed', stage: 's200', say: ['Police your brass.', 'Shooters, police your brass.'] },
  { id: 'turnIn', ready: 'turnedIn', stage: 's200', say: ['Unused rounds to your coach.', 'Any rounds you have left, to your coach.'] },
  { id: 'declare', ready: 'declared', stage: 's200', say: ['Relay one: no brass, no ammo?', 'Shooters, your declaration: no brass, no ammo?'] },
  { id: 'end', ready: 'never', stage: 'end', say: ['The line is clear.', 'The line is clear. Relay one, make your way off the line.'] },
]);

/** The coach's and the RO's new lines on the kd course (see the header), each ≥ 2 phrasings; {up}, {left} and the like filled by the scene. */
export const KD_COACH = deepFreeze({
  brief: ["I'm your coach. Three rounds a group, and I read each one. Wait for the tower.", "I'm your coach today. We zero first: three-round groups, and I call your clicks."],
  group: ['Your group is {where}. {Call}.', 'Group {where}. {Call}.'],
  zeroed: ['Zeroed. Leave it.', 'That is your zero. Leave the turrets alone.'],
  notZeroed: ['Close enough for today. We confirm at three hundred.', 'Not there yet, but we will confirm it at three hundred.'],
  wind: ['Wind from the {from}, about {speed}. Hold {hold} {side}.', 'I make it {speed} from the {from}. Hold {hold} {side}.'],
  still: ['No wind to speak of. Hold centre.', 'Flags are limp. Hold centre.'],
  // (nothing across, but the flags are not limp (wind.js windWords' flags): standing out along the range, or stirring;
  // "limp" only under FLAG_LIMP_MS, the verifier's of the sleeve fix)
  front: ['Wind\'s in our faces, straight up the range: nothing across. Hold centre.', 'Flags are standing out toward us: no wind across. Hold centre.'],
  behind: ['Wind\'s at our backs, straight down the range: nothing across. Hold centre.', 'Flags are standing out toward the targets: no wind across. Hold centre.'],
  light: ['Nothing across worth holding for. Hold centre.', 'A breath across, no more. Hold centre.'],
  confirm: ['{Call}. Dial it.', 'Come {call}. Dial it in.'],
  confirmed: ['Your zero is good. Leave it.', 'Good zero. Leave it.'],
  dummy: ['That was my dummy. Good drill.', 'An orange dummy: mine. Tap, rack, on. Good.'],
  police: ['Your brass, all of it. Pick it up.', 'Police your brass. Every case.'],
  turnIn: ['Unused rounds to me.', 'Anything left, hand it over.'],
  turnedIn: ['{N} rounds back. Noted.', '{N} back to me. Good.'],
  noneBack: ['Nothing to turn in. Good.', 'All fired. Good.'],
  declare: ['Say it: no brass, no ammo.', 'Your declaration.'],
  declared: ['No brass, no ammo, Sergeant.', 'No brass and no ammo, Sergeant.'],
  wrong: ['That is not true. Look again.', 'Not so. Empty your pockets and look again.'],
  dope: ['Your dope for {line} is {clicks}.', 'Dial {clicks} for {line}.'],
  marked: ['A {score} at {clock}.', 'Marked a {score}, {clock}.'],
  miss: ['Maggie\'s drawers: a miss.', 'The red flag. A miss.'],
  offRings: ['Off the rings at {clock}.', 'On the paper, off the rings: {clock}.'],
  rapid: ['{Hits} on the paper: {list}.', 'The string: {hits} on the paper, {list}.'],
  rapidNone: ['Nothing on the paper. The whole string.', 'Not one on the paper.'],
  stay: ['Stay with me. You are going to be fine.', 'Look at me. Stay with me.'],
  limit: ['Time. That string is over.', 'Out of time.'],
  hit: ['Man down! Corpsman up!', 'Corpsman! Man hit!'],
});
export const KD_RO = deepFreeze({
  ceaseNd: ['CEASE FIRE! CEASE FIRE! All shooters on safe.', 'CEASE FIRE, CEASE FIRE! Safe your weapons. Nobody moves.'],
  forward: ['Cease fire! Get back behind the line!', 'CEASE FIRE! You, back behind the line!'],
  closed: ['The range is closed.', 'The range is closed. Unload, show clear.'],
  limit: ['CEASE FIRE. Time.', 'Time. CEASE FIRE.'],
});

/** The pairs course's sequence, the coach's commands (see the header): { id, ready, say, string?, line? }. */
export const SEQ_PAIRS = deepFreeze([
  { id: 'brief', ready: 'always', line: 7, say: ["Pairs. Five strings at seven and ten metres on my timer. Wait out of it at low ready; when a target turns, take it in, then your shots. Threats only.",
    "This is pairs: five strings, seven and ten metres, on the timer. Low ready, on safe, out of it until a target turns. Threats only."] },
  { id: 'load', ready: 'magIn', say: ['With a magazine of ten, LOAD.', 'Your first magazine, ten rounds. LOAD.'] },
  { id: 'ready', ready: 'pairsReady', say: ['MAKE READY. Then low ready, on safe, and step out of it.', 'MAKE READY. On safe, low ready, and out of it.'] },
  { id: 'standby', ready: 'stringDone', string: 0, line: 7, say: ['Shooter ready? Standby.', 'One target. Standby.'] },
  { id: 'stop', ready: 'pairsReady', string: 0, say: ['Stop. On safe, low ready, out of it.', 'Make safe. Low ready. Step out of it.'] },
  { id: 'standby', ready: 'stringDone', string: 1, line: 7, say: ['Two this time. Standby.', 'Shooter ready? Standby.'] },
  { id: 'stop', ready: 'pairsReady', string: 1, say: ['Stop. On safe, low ready, out of it.', 'Make safe. Low ready. Step out of it.'] },
  { id: 'move10', ready: 'pairsReady', line: 10, say: ['Back to the ten-metre line. Low ready.', 'Three steps back, to the ten. Muzzle downrange.'] },
  { id: 'standby', ready: 'stringDone', string: 2, line: 10, say: ['Threats only. Standby.', 'Look before you shoot. Standby.'] },
  { id: 'stop', ready: 'pairsReady', string: 2, say: ['Stop. On safe, low ready, out of it.', 'Make safe. Low ready. Step out of it.'] },
  { id: 'standby', ready: 'stringDone', string: 3, line: 10, say: ['Shooter ready? Standby.', 'One target. Standby.'] },
  { id: 'stop', ready: 'pairsReady', string: 3, say: ['Stop. On safe, low ready, out of it.', 'Make safe. Low ready. Step out of it.'] },
  { id: 'short', ready: 'shortReady', say: ['Top up with the short one: two rounds in it. Then low ready, out of it.', 'Your two-round magazine: top up with it, low ready, and out of it.'] },
  { id: 'standby', ready: 'stringDone', string: 4, line: 10, say: ['Shooter ready? Standby.', 'Last string. Standby.'] },
  { id: 'lull', ready: 'toppedUp', say: ['Lull. Top up if you are at half or less, then low ready, out of it.', 'Take the lull. Half or less, top up; then low ready, out of it.'] },
  { id: 'clear', ready: 'shown', say: ['UNLOAD, SHOW CLEAR.', 'UNLOAD, SHOW CLEAR to me.'] },
  { id: 'end', ready: 'never', say: ["That's the course. The line is clear.", 'Done. The line is clear.'] },
]);

/** The pairs coach's words (see the header), each ≥ 2 phrasings; {paper} the shot timer's line. */
export const PAIRS_COACH = deepFreeze({
  brief: ["I'm your coach and this is my timer. It starts when the target turns.", "I run the timer. It starts as the target turns; you take him in, then you shoot."],
  standby: ['Standby.', 'Standby. Wait for it.'],
  out: ['Out of it. Wait for the turn.', 'Not in the mode. Step out of it and wait for the turn.'],
  paper: ['Timer: {paper}.', 'On the clock: {paper}.'],
  // (said only where it is true: the steel rang and he stands, or two in the torso and he stands (pairs.js))
  stillUp: ["He's still up!", 'Still up! That rang: he is wearing a plate.'],
  noshoot: ['You shot a no-shoot. That string is over.', 'That one had no weapon. String over.'],
  time: ["Time. He'd have had you.", 'Time. You never put him down.'],
  dry: ['Out of rounds. That string is done.', 'Nothing left to fire. String over.'],
  short: ['The two-round magazine is in. Good.', 'Two in the magazine, one up the spout. Good.'],
  lull: ['Topped up. Good habit.', 'Topped up in the lull. That is the habit.'],
  // (0.0.8, the fixer's: the lull's fresh magazine handed over ({pouch} where it went), or none needed above half)
  hand: ['Fresh ten for you, in your {pouch}.', 'Here. A full one in your {pouch}.'],
  lullAbove: ['You are above half. Fresh ten in your {pouch} all the same.', 'Above half: that will do. A spare ten in your {pouch}.'],
  // (a negligent discharge into the berm: a fault on this course, the line carries on (handling.js rangeRules))
  nd: ['Cease fire! That went into the berm. Finger off until you mean to fire.', 'Cease fire! Negligent discharge, into the dirt. Finger straight, on safe.'],
  // (the pairs bay has no tower: the coach's own words for a line kept waiting, and for no rounds left)
  slow: ['I will not wait for you. Keep up.', 'I waited on you there. Be ready on my word.'],
  dryOut: ['No rounds left. On safe, low ready: you sit the rest out.', 'Nothing left to load. On safe; you sit the rest out.'],
  declared: ['On safe: you are done with that one. Noted.', 'Safe. That string is yours to call. Noted.'],
  none: ['No rounds fired that string.', 'Nothing on the timer that string.'],
  // (0.0.9, setup 'bangs' (see the header): noise, never "Bang", at the brief; after the banged string's paper)
  bangsBrief: ["First string, I make some noise behind you. No ear pro today: that's the lesson. Your lane.",
    "On the first string I'll be making noise behind you. No ear defenders today; that is the point. Watch your lane."],
  bangsAfter: ["That's what noise does to your hands.", 'That is noise. Feel your hands? That is what it does to them.'],
});

/**
 * The coach's lines (the voice beside you), each a list of phrasings. A string's are by how many missed the
 * paper (0, 1, 2, more: 'low') when any shot of it was rushed or not held to +4, 'held' when every one was
 * (one natural 1 the only miss: 'luck'), {hits} and {shots} its counts in words, capitalised where a line
 * opens on them ({Hits}): a string the set stoppage cut to four is "Four of four", never "five" (the integrator's).
 */
export const COACH = deepFreeze({
  brief: ["I'm your coach. Wait for the tower.", "I'm your coach today. Nothing happens until the tower says so."],
  briefMixed: ["I'm your coach. One of your magazines is tracer: the course is ball. Wait for the tower.", "I'm your coach today. One of those four is tracer, and we fire ball. Nothing happens until the tower says so."],
  string: {
    0: ['{Hits} of {shots} on the paper. Keep doing that.', 'All {shots} on the paper. Same again.'],
    1: ['{Hits} of {shots}. Breathe out, then press.', '{Hits} on the paper. Let the shot surprise you.'],
    2: ['{Hits} of {shots}. You are snatching the trigger. Press it.', '{Hits} on the paper. Slow down, the card is not going anywhere.'],
    low: ['Not many on the paper. Settle the sight, breathe out, press.', 'That card got off lightly. Settle the reticle, then the press.'],
    // (every shot of the string held to +4, never rushed: the misses were not haste (the design review's: a careful
    // shooter told "You are snatching the trigger" for what the dice did); one natural 1 alone, owned)
    held: ['{Hits} of {shots}. You held every one; keep that press.', '{Hits} on the paper. The hold was right. Same again.'],
    luck: ['One went wide. That happens; the rest were good.', 'One got away. It happens to everybody. The rest were sound.'],
    // (0.0.6: a string with no shot in it, sat out for want of rounds or never fired)
    sat: ['That string goes down as not fired.', 'Not fired. It counts for nothing on the card.'],
    none: ['Nothing on the paper: you never fired.', 'No shots that string. The tower will not wait for you.'],
    // (0.0.6: a string fired with more than its rounds, remarked on, never praised as normal (DESIGN.md 2026-11-07, my
    // call); {shots} the shots fired, {rounds} the string's magazine)
    over: ['{Shots} rounds in a {rounds}-round string. {Rounds} a string, on the tower\'s word.', 'That was {shots} for a string of {rounds}. One magazine, {rounds} rounds.'],
  },
  // (0.0.6: the magazine empty with a round still chambered, said before the change (DESIGN.md 2026-11-07: the user's
  // run-out began with "0 in the magazine" and the fifth round in the chamber); once a string)
  // (0.0.6: a magazine of another kind than the course's seated (setup mixed's tracer), said once, no fault)
  kind: ['That\'s your {kind}. The course is {load}: change it before you fire.', 'That one is {kind}. We fire {load} today: change it.'],
  spout: ['You\'ve one left up the spout. Fire it.', 'There\'s still one in the chamber. Fire it before you change.'],
  // (each short enough for one line of the radio box at 1600 × 900: a second line was cut under the next voice)
  dry: ['No rounds left. You sit this string out, on safe.', 'Nothing left to load. You sit this one out, on safe.'],
  onemag: ['One magazine a string. You reload on the tower\'s word.', 'One magazine a string. Reload when the tower says.'],
  slow: ['The tower will not wait for you. Keep up.', 'The line waited on you. Be ready on the word.'],
  take: ['Give it here. I will clear it.', 'Hand it over. I will show it clear myself.'],
  set: {
    dud: ['That was my dummy. Good.', 'An orange dummy: mine. You cleared it. Good.'],
    stovepipe: ['A light round: it short-stroked. You cleared it.', 'That one I loaded light. It did not cycle, and you sorted it.'],
    double: ['A double feed. I seated that one proud. Good drill.', 'That double was mine. Lock, strip, rack: done right.'],
  },
  clear: ['Clear.', 'Clear. Good.'],
  hold: ['Hold. There is a round in it.', 'Hold. Look again: there is a round in it.'],
  ahead: ['Wait for the tower.', 'Not yet. The tower gives the commands.'],
  stop: ['Cease fire! Cease fire!', 'CEASE FIRE! Cease fire!'],
  cold: ['The line is cold. Finger off, on safe.', 'Nobody fires on a cold line.'],
});

/** The stress course's sequence (see the header): SEQ_PAIRS' commands without the walk back, every standby at 7 m. */
export const SEQ_STRESS = deepFreeze([
  { id: 'brief', ready: 'always', line: 7, say: ["Five strings at seven metres, on my timer. Wait out of it at low ready; when a target turns, take it in, then your shots. Threats only.",
    "This is the stress course: five strings at seven metres, on the timer. Low ready, on safe, out of it until a target turns."] },
  { id: 'load', ready: 'magIn', say: ['With a magazine of ten, LOAD.', 'Your first magazine, ten rounds. LOAD.'] },
  { id: 'ready', ready: 'pairsReady', say: ['MAKE READY. Then low ready, on safe, and step out of it.', 'MAKE READY. On safe, low ready, and out of it.'] },
  { id: 'standby', ready: 'stringDone', string: 0, line: 7, say: ['A quiet one first. Standby.', 'No noise this time. Standby.'] },
  { id: 'stop', ready: 'pairsReady', string: 0, say: ['Stop. On safe, low ready, out of it.', 'Make safe. Low ready. Step out of it.'] },
  { id: 'standby', ready: 'stringDone', string: 1, line: 7, say: ['Horn and blanks beside you this time. Standby.', 'Noise this time: the horn, and blanks at your shoulder. Standby.'] },
  { id: 'stop', ready: 'pairsReady', string: 1, say: ['Stop. On safe, low ready, out of it.', 'Make safe. Low ready. Step out of it.'] },
  { id: 'standby', ready: 'stringDone', string: 2, line: 7, say: ["One bang this time, and I'll call it. Standby.", 'A bang, and I shout it first. Standby.'] },
  { id: 'stop', ready: 'pairsReady', string: 2, say: ['Stop. On safe, low ready, out of it.', 'Make safe. Low ready. Step out of it.'] },
  { id: 'standby', ready: 'stringDone', string: 3, line: 7, say: ['Standby.', 'Shooter ready? Standby.'] },
  { id: 'stop', ready: 'pairsReady', string: 3, say: ['Stop. On safe, low ready, out of it.', 'Make safe. Low ready. Step out of it.'] },
  { id: 'short', ready: 'shortReady', say: ['The one-round magazine: top up with it. Then low ready, out of it.', 'Top up with the one-round magazine. Then low ready, and out of it.'] },
  { id: 'standby', ready: 'stringDone', string: 4, line: 7, say: ['Standby.', 'Shooter ready? Standby.'] },
  { id: 'lull', ready: 'toppedUp', say: ['Lull. Top up if you are at half or less, then low ready, out of it.', 'Take the lull. Half or less, top up; then low ready, out of it.'] },
  { id: 'clear', ready: 'shown', say: ['UNLOAD, SHOW CLEAR.', 'UNLOAD, SHOW CLEAR to me.'] },
  { id: 'end', ready: 'never', say: ["That's the course. The line is clear.", 'Done. The line is clear.'] },
]);

/** The stress coach's words (see the header), each ≥ 2 phrasings: "Bang!" a call, never "Bang out". */
export const STRESS_COACH = deepFreeze({
  brief: ['Five strings at seven metres, and I make noise: a horn, blanks, bangs. Ear defenders stay on. Threats down.',
    'Five strings, all at seven metres. I will be making noise: the horn, blanks, bangs. Ear defenders on. Put the threats down.'],
  din: ['Horn and blanks beside you this time. Standby.', 'Noise this time: the horn, and blanks at your shoulder. Standby.'],
  call: ['Bang!', 'Bang! Bang!'],
  dinAfter: ['That is what a line sounds like with a friend firing beside you.', 'Noise, and your lane all the same. That is the drill.'],
  calledAfter: ['You heard it coming. A warning is worth having.', 'Called, so you knew. That is what a shout buys you.'],
  bangsAfter: ["That's what noise does to your hands.", 'Three, no warning. Feel your hands? That is what it does to them.'],
  reloadAfter: ['That is a reload under noise. Again tomorrow.', 'A reload with the noise on you. We do that again tomorrow.'],
  // (at "Stop" after a noisy string, the rest's reason (the design review of 0.0.10: 20 s on the screen with nothing said))
  rest: ['Let the smoke clear. Twenty seconds.', 'Twenty seconds for the noise to settle. Stay ready.'],
  short: ['The one-round magazine is in. Good.', 'That is the one-round magazine in. Good.'],
  // (the step's four counts of a second each, in, hold, out, hold: never "for four" (the design review of 0.0.10: the words
  // promised a 16 s box the 4 s step is not))
  breathe: ['Breathe. Box it: in, hold, out, hold.', 'Breathe. In, hold, out, hold.'],
});

// (the wash's words on a lane cleared: one array, its `say` and its `sayEnd.clear`, so the pick is the same)
const WASH_SAY = ['The lane is clear. Hot wash, in the booth.', 'The lane is clear. Into the booth: hot wash.'];
/** The house course's sequence (see the header): the instructor's commands on the PA, { id, ready, say, short?, sayEnd? }. */
export const SEQ_HOUSE = deepFreeze([
  { id: 'brief', ready: 'always', say: ["Lane A. Three rooms and the hall, you and your number two. Full G in the Wheel: your kit weighs what it weighs on Earth. On my GO you stack and clear. Threats down, no-shoots untouched. My timer, not your wounds.",
    "This is lane A: three rooms, then the hall, at one G. You and your number two clear it on my GO. Put the threats down and leave the no-shoots alone. I run the timer."],
    // (its build sheet item 14, carried FH-5: on Again of the same lane (R.house.again) the short brief, shoothouse.js houseCmdSay,
    // the beside-you line not said (houseOnCmd): LOAD about 6 s after the fill, not 23)
    sayAgain: ['Same lane, same rules. Threats down, no-shoots untouched.', 'Again. Same lane. Threats down, no-shoots untouched.'],
    // (its build sheet item 17, DC3: the live lane's brief (R.load 'marking'), its Again's, and never "frangible" or "not your
    // wounds" from the fill to the card there; the sterile check is said, then done on the floor before LOAD (shoothouse.js sterileTick))
    sayLive: ['Lane A, live. Two of my staff are in the house with marking rounds. Masks down until I call the lane. A fatal hit ends your lane. Threats down, no-shoots untouched. Sterile check first, then on my GO you stack and clear.',
      'This is lane A, live: two role-players with marking rounds among the panels, at one G. Masks stay down. A fatal hit ends it. Put the threats down and leave the no-shoots alone. Sterile check first.'],
    sayAgainLive: ['Same lane, live. Masks down. A fatal hit ends it.', 'Again, live. Same lane, same rules. Masks down.'] },
  { id: 'load', ready: 'magIn', short: 'Ten rounds, LOAD.', say: ['Practice rounds. With a magazine of ten, LOAD.', 'Frangible today. Your first magazine, ten rounds. LOAD.'],
    sayLive: ['Marking rounds. With a magazine of ten, LOAD.', 'Marking only today. Your first magazine, ten rounds. LOAD.'] },
  { id: 'ready', ready: 'houseStart', short: 'MAKE READY. Low ready, on safe, on your mark.', say: ['MAKE READY. Low ready, on safe, on your mark. Combat.', 'MAKE READY. On safe, low ready, on your mark, and your number two behind you.'] },
  { id: 'standby', ready: 'goArm', say: ['Standby.', 'Lane A. Standby.'] },
  { id: 'go', ready: 'laneDone', say: ['GO!', 'GO, GO, GO!'] },
  { id: 'stop', ready: 'houseSafe', short: 'Stop. On safe.', say: ['Stop. On safe, finger off.', 'Stop, stop. Make safe.'] },
  { id: 'clear', ready: 'shown', say: ['UNLOAD, SHOW CLEAR.', 'UNLOAD, SHOW CLEAR to me.'] },
  // (FL22-3: the wash's words by how the lane ended (shoothouse.js houseCmdSay): `sayEnd.clear`, its `say` itself, on a lane
  // cleared; `sayEnd.other` on one ended by a casualty, time, a dry rifle, a burst or its last leg passed by the stall or the due,
  // which nobody cleared (the B and C review of 2026-11-16))
  { id: 'wash', ready: 'washed', say: WASH_SAY, sayEnd: { clear: WASH_SAY, other: ['Weapons clear. Into the booth: hot wash.', 'Guns are clear. Hot wash, in the booth.'] } },
  { id: 'end', ready: 'never', say: ["That's your lane.", 'Done. Off the floor.'] },
]);
/**
 * The house course's sequence on a drawn house (the review of A: "Lane A" named a layout the lane did not play): SEQ_HOUSE
 * command for command, the brief's and the standby's words without the lane's letter (handling.js seqOf reads it where the house
 * record carries a draw); every other command the same object.
 */
export const SEQ_HOUSE_DRAWN = deepFreeze(SEQ_HOUSE.map(c => (c.id === 'brief' ? { ...c, say: ['A new layout. Three rooms and the hall, you and your number two. Full G in the Wheel: your kit weighs what it weighs on Earth. On my GO you stack and clear. Threats down, no-shoots untouched. My timer, not your wounds.',
  'The panels are moved: a layout the instructors have set. Three rooms, then the hall, at one G. You and your number two clear it on my GO. Put the threats down and leave the no-shoots alone. I run the timer.'],
  // (its build sheet §0 item 21: the drawn house's own short brief on Again of the same code, never SEQ_HOUSE's "lane")
  sayAgain: ['Same layout, same rules. Threats down, no-shoots untouched.', 'Again. Same layout. Threats down, no-shoots untouched.'],
  sayLive: ['A new layout, live. Two of my staff are in the house with marking rounds. Masks down until I call the lane. A fatal hit ends your lane. Threats down, no-shoots untouched. Sterile check first, then on my GO you stack and clear.',
    'The panels are moved, live: two role-players with marking rounds among the panels, at one G. Masks stay down. A fatal hit ends it. Put the threats down and leave the no-shoots alone. Sterile check first.'],
  sayAgainLive: ['Same layout, live. Masks down. A fatal hit ends it.', 'Again, live. Same layout, same rules. Masks down.'] }
  : c.id === 'standby' ? { ...c, say: ['Standby.', 'New layout. Standby.'] } : c)));
/**
 * The house course's sequence on a named house, B or C (the play review of v0.0.22, 2026-11-17: the card, the paper and the timer
 * said "LANE B" while the tower briefed "A new layout" and "The panels are moved: a lane you have not seen."): SEQ_HOUSE command for
 * command, its brief's and standby's "Lane A" and "lane A" saying the lane's letter, word for word as long (the tower's chain times
 * them), every other command the same object; one frozen sequence a letter, made once.
 */
const SEQ_HOUSE_NAMED = new Map();
export function seqHouseNamed(letter) {
  if (!SEQ_HOUSE_NAMED.has(letter)) {
    const lane = (t) => t.replace(/\bLane A\b/g, `Lane ${letter}`).replace(/\blane A\b/g, `lane ${letter}`);
    // (the live brief's words (sayLive, sayAgainLive, DC3) say the letter too, so a named lane never says
    // "Lane A, live"; the live lane is played as set today, so no lane's words move)
    SEQ_HOUSE_NAMED.set(letter, deepFreeze(SEQ_HOUSE.map(c => (c.id === 'brief' || c.id === 'standby' ? { ...c, say: c.say.map(lane), ...(c.sayLive ? { sayLive: c.sayLive.map(lane) } : {}), ...(c.sayAgainLive ? { sayAgainLive: c.sayAgainLive.map(lane) } : {}) } : c))));
  }
  return SEQ_HOUSE_NAMED.get(letter);
}

/** What the instructor says to a shooter the line waits on ("Shooter, back on your mark."), by what is lacking (shoothouse.js houseWant). */
export const HOUSE_NUDGE = deepFreeze({ mag: 'a magazine in.', chamber: 'a round up: MAKE READY.', safe: 'on safe, finger off.', low: 'low ready.', out: 'out of it.',
  mark: 'back on your mark.', still: 'stand still.', pistol: 'your pistol too: a round up.', gait: 'Combat. Weapon up.', two: 'wait for your number two.', show: 'show me clear.',
  // (at Stop and SHOW CLEAR (shoothouse.js houseNudgeOf): the P-12 still out, or still loaded in its holster)
  'pistol:out': 'pistol away, rifle up.', 'pistol:loaded': 'your pistol too: show me clear.',
  // (your number two's own wants, said to him: "Number two, a round up." (shoothouse.js twoLacks; handling.js names him))
  'two:busy': 'finish it.', 'two:mag': 'a magazine in.', 'two:chamber': 'a round up.', 'two:safe': 'on safe, finger off.', 'two:low': 'low ready.', 'two:show': 'show me clear.',
  // (on the Wreck, your mag boots not locked on the deck at MAKE READY (shoothouse.js houseWant))
  boots: 'boots locked.' });

/**
 * The instructor's words (see the header), each ≥ 2 phrasings: his faults from the catwalk as they happen, at most one
 * other line a room, nothing while a take-in runs; the hot wash's lines ({room} a room's word, {s} seconds, {n} a count).
 */
export const HOUSE_CHIEF = deepFreeze({
  // (its build sheet item 16, DC2: the words agree with the drill, #1 high on the door and the #2 low behind him, his corner
  // the other way, never "far"; each phrasing as long as v0.0.22's (17 and 16 spoken words), so the tower's chain and every lane's ticks hold)
  brief: ['Your number two takes his corner, the other way. You high on the door, him low behind.', 'Two of you, one lane. He goes where you do not. Him low, never across you.'],
  // (the brief's second sentence, by the floor's gravity where you stand (shoothouse.js gravityWords): {g} in G)
  full: ['Full G here: your kit weighs what it weighs on Earth.', 'One G on this deck. Your kit weighs its full weight.'],
  gravity: ['{g} G on this deck.', 'This deck pulls {g} G.'],
  back: ['Back on your mark. Wait for GO.', 'Not yet. Back on your mark and wait for GO.'],
  funnel: ["Don't stop in the door!", 'Out of the door! You are a target in it.'],
  corner: ['Your corner!', 'Corner! You never looked.'],
  muzzle: ['Muzzle!', 'Muzzle! Not across your number two.'],
  relaxed: ["Weapon up. You're in their house.", "Weapon up! You're in their house."],
  noshoot: ['No-shoot! He had nothing.', 'That was a no-shoot. Look before you press.'],
  hostage: ['You hit the hostage!', 'Hostage hit! Head only, or hold.'],
  standing: ['He is still standing in there.', 'You left one up.'],
  door: ['That door was never held.', 'You left a door at your back.'],
  // (the hunt of v0.0.20, breach-4: an inner door opened and never looked into, the room called clear over it)
  doorOpen: ['You opened that door and never looked in.', 'An open door nobody looked through is a man at your back.'],
  stall: ['Move on.', 'Move. You are clearing, not visiting.'],
  // (the fixer of v0.0.24's play review, M1: the stall where your legs have nothing to push on, never "Move.")
  stallFooting: ['No footing in here. I am moving you on.', 'Nothing to push off. Moving you on.'],
  // (DC3: the live lane's sterile check before LOAD (shoothouse.js sterileTick): [0] the last marine looked at, [1] with one to come)
  sterile: ['Clean.', 'Clean. Next.'],
  // (his acknowledgement of your number two's rifle shown clear at UNLOAD, SHOW CLEAR (COMBAT §25.19.5))
  twoClear: ['Number two, clear.', 'Number two: clear.'],
  // (your #2's guns still loaded at the end of his SHOW CLEAR: the instructor clears them himself (combat/two.js twoShown))
  twoTaken: ["Number two, that's still loaded. Give it here.", "Number two: still loaded. I've cleared it."],
  time: ['Time. On to the next.', 'Time on that room. Next door.'],
  par: ['He fired first.', 'Too slow. He fired first.'],
  clear: ['Clear.', 'Good. Clear.'],
  dry: ['You are dry. That is the lane.', 'Nothing left to fire. Lane over.'],
  laneTime: ['Ten minutes. That is the lane.', 'Time on the lane. Stop.'],
  two: ["Your number two's not with you.", 'Wait for your number two.'],
  dummy: ['That was my dummy. Tap, rack, back on him.', 'My dummy. Cleared. Good.'],
  stop: ['Cease fire! Cease fire!', 'CEASE FIRE! Cease fire!'],
  wash: ['Hot wash. Sit down, look at the board.', 'Hot wash. Here is your lane, room by room.'],
  spin: ['The Wheel puts a round low along the spin.', 'The Wheel drops a round low along the spin. Not enough to miss by, in a room.'],
  // (v0.0.19, D2 (COMBAT §25.20; house-kit.js): the brief's intelligence ({rooms} the rooms that are hostiles only), the practice
  // grenades scored as live, the reads' words ({list} the stands down, {who} 'no-shoot' or 'hostage'), the cut and the round through)
  intel: ['Intelligence: {rooms}, hostiles only. Anywhere else, assume a family.', 'Hostiles only in {rooms}. Every other door could be a family.'],
  intelNone: ['No room in this house is hostiles only. Assume a family behind every door.', 'Nothing here is hostiles only. Families behind every door.'],
  practice: ["Practice frags count as live in my book. I'll tell you what they would have done.", 'Those are practice grenades. I score them as the real thing.'],
  // (the men it put down counted, never named by their stands ("Good frag. 1a and 1b down.", the stand shorthand FL22-6 set
  // out to remove; house-kit.js menWords))
  fragGood: ['Good frag: {list} down.', 'That frag did its work: {list} down.'],
  fragged: ['You fragged a room with a {who} in it.', '{who} in there. You never frag a family.'],
  burst: ['Cease fire! You were in the room when it went.', "CEASE FIRE! In the room at the burst. You'd be dead."],
  stackBlast: ['Too close. The stack took that blast.', 'On the wall before it goes.'],
  uncooked: ['A live man throws that back. Cook it.', 'Four seconds on the floor. Cook two.'],
  exposed: ['You hung in the door to throw. He had you.', 'Throw from the wall, not the door.'],
  concussed: ['Your no-shoot took that blast.', 'That concussion hurt your no-shoot.'],
  through: ['A round through that door. Down and in, forty-five.', 'Your round went into the room. Angle it down.'],
  cut: ['Hinges cut. Go.', "Door's off. In."],
  cutLatch: ['Latch cut. Go.', "Lock's gone. In."],
  // (a grenade slipped at the thrower's feet that put the stack in its burst: the cease fire where it was (the review of v0.0.19's K))
  burstFeet: ['Cease fire! That grenade went at your feet.', 'CEASE FIRE! At your feet, and you stood over it.'],
  burstFeetTwo: ['Cease fire! You got clear. Your number two did not.', 'CEASE FIRE! Your number two was still on top of it.'],

  // (the live lane's (v0.0.19, COMBAT §25.18): a live man ruled out at his room's "Clear!", covered; paint on you or your number
  // two ({part} chest or head), the casualty's cease fire with you or him hit, a round on a man whose hands you saw up, a room
  // reopened by a man seen up after its "Clear!" ({Room}: "Room 3"), a man down or with his hands up left uncovered at "Clear!")
  // (FL22-6: said to the man, the umpire's words in force on force (question 3's default); was "He's out.", "That one is out.")
  out: ['You, out. Sit down where you are.', 'You are out. Sit down.'],
  paint: ['Paint, {part}. Keep working.', 'You took paint, {part}. Keep working.'],
  // (a strike the carrier's soft panel stopped, as the live round's would-have rates it (combat/would.js))
  // (a round of yours a role-player's soft panel stopped, once a man (shoothouse.js liveShot))
  hisPanel: ['His panel took that one.', 'That one hit his panel.'],
  paintStopped: ['Paint, {part}. Your panel took it. Keep working.', 'Paint on the panel. Keep working.'],
  // (the hunt of v0.0.20's T3: a strike on your number two is said as his, never as yours ("You took paint" for his was the DI's of v0.0.20))
  paintTwo: ['Paint on your two, {part}. Keep working.', 'Your number two took paint, {part}. Keep working.'],
  paintStoppedTwo: ['Paint on your two, {part}. His panel took it. Keep working.', 'Paint on his panel. Keep working.'],
  casualty: ['Cease fire! Cease fire! You are hit.', 'CEASE FIRE! You are a casualty.'],
  twoDown: ['Cease fire! Cease fire! Your number two is hit.', 'CEASE FIRE! Your number two is a casualty.'],
  // (a wound rated not fatal that bleeds its man into shock later in the lane (combat/would.js wouldTick): the instructor's ruling
  // at that tick, before the cease fire's (the hunt of v0.0.20, bleed-shock))
  bled: ["That wound has bled you into shock. You're down.", 'You have lost too much blood. You are down.'],
  twoBled: ['Your number two has bled into shock. He is down.', 'Your number two has lost too much blood. He is down.'],
  surrendered: ['His hands were up! You never shoot a man who gave up.', 'He gave up, and you shot him. Hands up means stop.'],
  // (the review of v0.0.19's fixer: the tower moved on past MAKE READY with the P-12's round not up; he racks it, as the coach clears a rifle never shown)
  // (your number two's P-12 short of its round at MAKE READY's move-on, racked by the instructor (shoothouse.js twoMoveOn))
  twoPistolRacked: ["Number two, your pistol had no round up. I've racked it.", 'Number two: pistol racked for you. Next time, yourself.'],
  pistolRacked: ["Your pistol had no round up. I've racked it. Next time it's yours.", "Pistol: no round up. Done for you. Next time, yourself."],
  reopened: ["{Room}'s not clear!", "{Room} is not clear! There's one up in there."],
  uncovered: ['Cover your man!', 'Cover him! He is still armed.'],
  // (the line of fire (the build sheet v0.0.20 item 3): a round of your number two's held MASK_FAULT_MS or more by you on his line)
  masked: ['You walked into his line!', 'You were in his line! Hold your point.'],
  // (two strikes on one marine within COURSES.house.opfor.paintCallMs, called as one (FL22-2: shoothouse.js liveTick's paint held))
  paintTwice: ['Paint, {part}, two. Keep working.', 'Two on you, {part}. Keep working.'],
  // (the same two strikes on your number two, in his words (the v0.0.22 integration: the hunt of v0.0.20's T3 met C's held call))
  paintTwiceTwo: ['Paint on your two, {part}, two. Keep working.', 'Two on your number two, {part}. Keep working.'],

  // (the card (the build sheet v0.0.20 §1 item 20): the instructor's verdict at the hot wash's end, against your sheet's
  // standard (shoothouse.js houseVerdict): GO, or NO-GO and its first reason ({why}, in his words: VERDICT_WHY)
  verdict: { go: ['GO.', 'That is a GO.'], nogo: ['NO-GO: {why}.', 'NO-GO. {why}.'] },
  // (the drawn house (the build sheet v0.0.21 §1 item 2): the brief names each lane door's swing as the stack reads it, from the
  // drawn opening ({doors}: "room 1, push door, hinge left; room 2, pull door, hinge right; ..."; swing.js doorWordsOf), on a drawn
  // lane only: the set's brief is v0.0.20's to the word (shoothouse.js doorWords)
  doors: ['The doors: {doors}.', 'Your doors: {doors}.'],

  // (the one thing to do differently, by the worst number of the run (COMBAT §17.2): the hot wash's last line)
  one: {
    funnel: ['You stood in the doorway. Through it, to your point, and stop there.', 'The door is where they shoot you. Keep moving through it.'],
    // (below rung 2, where the take-in's brake stops you in the door: the one decision that keeps the feet going (COMBAT §25.5.2; the fixer's of 0.0.12))
    funnelKeys: ['You stood in the doorway. Set a Watch on your corner before X: your feet keep going through the door.', 'The door is where they shoot you. Watch your corner before you go, and the pause will not stop you in it.'],
    par: ['He fired first. Set a Watch on your corner before you go: your eyes are there when he is.', 'Too slow off the sighting. Muzzle on the corner before you cross the door.'],
    corner: ['You called clear with a corner unlooked. Every corner, then the call.', 'Look into every corner before you call it.'],
    // (DC2: the cure is the low ready with the #2 in front, never "high ready" or "muzzle up" (12 and 14 words, as v0.0.22's))
    muzzle: ['Your muzzle crossed your number two. Low ready when he\'s in front.', 'Never across your number two. Muzzle down when he is in front of it.'],
    noshoot: ['You shot a no-shoot. Identify, then press.', 'Hands first. Then the trigger.'],
    hostage: ['You hit the hostage. With a hostage it is the head or nothing.', 'Hostage: head only, or hold.'],
    standing: ['You left a man standing. Down, then on.', 'Never leave one up behind you.'],
    door: ['You left the inner door. Hold it, or clear it.', 'A closed door at your back is a man at your back. Hold it.'],
    dummy: ['The click: tap, rack, back on him. It should be quicker.', 'The dummy cost you. Tap, rack, and back on target without thinking.'],
    time: ['Too slow through the rooms. The same drill, quicker hands.', 'Faster between the rooms. The pause is the only time you get.'],
    // (its build sheet item 11, carried FH-2: a room passed by the stall or the lane's due, by why (shoothouse.js passWhyOf):
    // at its open door, never crossed ('passed:door'; below rung 2 'passed:doorKeys', the keys' way in), at its stack ('passed:stack'),
    // inside, never called ('passed:room'); was `time` for every one, "Too slow through the rooms." beside "NO-GO. A threat left standing.")
    'passed:doorKeys': ['You stood at an open door. X, then walk it in, the way I call it.', 'The door was open and you never went through. X, then walk it, the way I call it.'],
    'passed:door': ['You stood at an open door. In, on the go: T, or walk it in.', 'Open door, nobody through it. Go on the open.'],
    'passed:stack': ['The door never opened. On the wall, then the door\'s row: T.', 'You never opened it. Stack, then open.'],
    'passed:room': ['You were in and never called it. Every corner, then "Clear!".', 'In the room and no call. Look, then "Clear!".'],
    // (the fixer of v0.0.24's play review, M1: the rooms passed where your legs had nothing to push on)
    'passed:footing': ['No footing, no lane. At zero G, boots on steel or a hold before you move.', 'Nothing under your feet to push on. At zero G, boots on steel or a hold first.'],
    clean: ['Clean lane. Again, faster.', 'Clean. Now do it again, and quicker.'],
    // (the play review: a lane ended before any room was run (Esc, End the scene, at GO) has nothing to wash)
    unplayed: ['No room run, so nothing to wash. Again, from the top.', 'Not one room cleared. From the top.'],
    // (the hunt of v0.0.20, P3: a lane set up ("Again from room 2") with nothing to fault is a room drilled, not a lane run: never "Clean
    // lane" beside its NO-GO; the drill's lesson is the lane it left out)
    setup: ['Clean. Now run it from GO, the walk to the door with it.', 'That was clean. Now the whole lane, from the top.'],
    fragged: ['You fragged a room with a family in it. The brief told you which rooms were hostiles only.', 'Frags go only where the brief says hostiles only. Everywhere else, a stun or nothing.'],
    burst: ['You were in the room when your grenade went. On the wall until it goes, then in.', 'Wait for the bang. In the room at the burst, you are dead.'],
    burstFeet: ['A grenade dropped at the stack\'s feet: the whole stack clear of it, down the wall, and down.', 'A dropped grenade: everyone clear of it and down. Nobody stands over it.'],
    exposed: ['You showed yourself in the door to throw. Throw from the wall, round the jamb.', 'Stay behind the wall for the throw. Only the arm goes in the door.'],
    uncooked: ['Your grenades sat on the floor long enough to be thrown back. Cook two.', 'Let the lever go and count two before the throw.'],
    concussed: ['Your concussion hurt a no-shoot. Throw it deep, away from where they stand.', 'Concussion near a family is a hurt family. Place it.'],
    through: ['Your breach round went into the room. Muzzle on the lock, forty-five down and in.', 'Angle the breach round down and in, so it ends in the floor.'],

    casualty: ['You took paint and it stopped there. Win the first second: on him before he is on you.', 'Paint on the stack ends it. See him first, shoot first.'],
    // (the hunt of v0.0.20's T4: your number two the casualty, never "You took paint": by whose sector the man who shot him stood in
    // ('casualty:two' his own corner's, 'casualty:two:yours' yours); and paint on him alone short of a casualty ('paint:two'))
    'casualty:two': ['Your two took paint and it stopped there. In on his heels, so he never fights his corner alone.', 'Your number two went down in his own corner. Through the door together, and call what you see for him.'],
    'casualty:two:yours': ['Your two took paint from your man. Yours first: on him before he is on either of you.', 'The man in your sector shot your number two. Your corner is yours to kill, before he picks one of you.'],
    'paint:two': ['Your two took paint. In on his heels and call what you see, so he is never alone with a man.', 'Paint on your number two. Together through the door, and his man is called before he shoots.'],
    // (a casualty a wound bled down later (shoothouse.js oneThing, would.js wouldTick): the wound first, and then the minutes worked on it)
    'casualty:bled': ['You took a wound and worked on until the blood ran out. Win the first second, and finish the house before a wound can.', 'A wound keeps bleeding while you work. See him first, shoot first, and keep the lane short.'],
    surrendered: ['You shot a man with his hands up. Read the hands every time, even mid-fight.', 'His hands were up. Stop on the hands.'],
    uncovered: ['A man down is still armed until someone covers him. Cover, then call.', 'Down is not out. Cover him before you call it.'],
    // (the play review: paint on the stack short of the casualty, the lane gone on (the user's answer of 2026-11-16))
    paint: ['You took paint. See him first, and be on him before he is on you.', 'Paint on the stack. Win the first second: see him first, shoot first.'],
    // (the casualty's lesson by its cause (FL22-5; shoothouse.js casualtyCause): a stoppage with him inside the pistol's
    // distance while the DI offered "Transition: pistol" ('click'), a hit of yours he fought through ('fought'), his fatal round before
    // your take-in of him ended ('unseen'); `casualty` itself the rest, slow off the sighting)
    'casualty:click': ['A click with him that close: the pistol, not the tap-rack.', 'That close, a click means the pistol. Then the rifle.'],
    'casualty:fought': ['One hit is not a stop. Rounds until he is down.', 'You hit him, and he was still in it. Keep on him until he is down.'],
    'casualty:unseen': ['He was on the door before you saw him. Through it fast and off its line.', 'He had the door before your eyes did. Through it fast, off its line.'],
    reopened: ['You called a room clear with a man in it. Find every man before the call.', 'He was still in there. Clear means every man accounted for.'],
    // (the cause of a missed par (the build sheet v0.0.20 §1 item 4; shoothouse.js parCauseOf): the par's line by why it was
    // missed, each the advice for that cause. 'par:click' is never said (it scores 0: a par missed only inside the instructor's dummy is
    // met within the click); 'par:unready' is the T sheets' (rung 2 up: "Muzzle up through the door"), 'par:unreadyKeys' below rung 2
    // (the Watch, the keys sheets' one decision); 'par' stays for a contact recorded before v0.0.20 (no cause))
    'par:click': ['The dummy cost you that par, not your eyes.', 'That one was my dummy.'],
    'par:unready': ['Your rifle was down when he showed. Muzzle up through the door, every door.', 'Muzzle up before you cross the door: he was there and you were not.'],
    'par:unreadyKeys': ['Your rifle was down when he showed. Set a Watch on your corner before you go: your eyes are there when he is.', 'Watch your corner before you cross the door. Your muzzle was not on him.'],
    'par:eyes': ['You saw him late. Your corner first, then the room.', 'Slow to take him in. Eyes on your corner as you cross the door.'],
    'par:hands': ['You saw him in time, and your hands were slow. The same row, quicker.', 'Taken in fast, fired slow. Press sooner off the pause.'],
    'par:feet': ['You planted before you fired. Combat walk, not Assault, and fire on the way.', 'Stopping to shoot cost you the par. Keep walking, fire from Combat.'],
    'par:gun': ['Your own gun cost you that par. Know your rounds, and reload before the door.', 'A stoppage of your own, at the wrong time. Count, and top up before the door.'],
  },
});
/**
 * The card's constants (the build sheet v0.0.20 §1 items 11 and 20; shoothouse.js parOf, roomParOf, houseVerdict): a room's
 * par is its bundle's planned time at the sheet (bundle.js planBundle 'room:clear', at the marine's own rung and pace) plus its
 * stands' books, × ROOM_PAR_K ({ room, hall }: [below rung 2, from rung 2], by the leg's kind; below rung 2 every step is a press,
 * so the keys sheets' walk is covered), rounded up to ROOM_PAR_STEP_MS; STANDARD_PARS the stands' pars a GO may miss outside the click; VERDICT_WHY the NO-GO's reasons
 * in the instructor's words, in the order they are named. ROOM_PAR_K fitted once against F56 (tests/flawless-card.mjs) and fixed.
 */
// (the fit, on F56's 40 seeds a sheet (1000 + 37 i) by each sheet's bot, a leg's time over its book (roomBookOf), by the leg's kind
// and the rung's band: the least K on a 0.05 grid with every sheet's every leg of the kind met on at least 90%. The first fit (C's)
// was one K a band, 1.4 from rung 2, set by the hall's worst (1.39), which left the rooms a par 1.3 to 1.6 times their time and the
// lane's par 1.4 to 1.6 times every sheet's lane: the verdict's lane clause could not fire (the C and D review of 2026-11-16). Fitted
// by kind on C's tree alone (rooms 1.5 and 1.15, the hall 0.9 and 1.4) and on the four roles merged (rooms 1.45 and 1.3, the hall
// 1.0 and 1.3: A's and B's calls, waits and far leg lengthen the rooms from rung 2), each value the larger of the two, so both meet
// every leg on 95% or more: the rooms 1.5 below rung 2 (their p90 1.33 to 1.37, room 3's far walk the longest) and 1.3 from it (p90
// 1.06 to 1.14), the hall 1.0 below rung 2 (its book holds the far man's plant: p90 0.88 to 0.97) and 1.4 from it (p90 1.31 to
// 1.32). The lane's par is then 1.3 to 1.45 times the bots' lane (0.69 to 0.79 of it, from 0.62 to 0.74); fixed from here, and a
// room 25% slower than its sheet's bot still meets it on most legs: a tighter par is the book's, the user's question 10 in DESIGN.md's log of v0.0.20)
export const ROOM_PAR_K = deepFreeze({ room: [1.5, 1.3], hall: [1.0, 1.4] }), ROOM_PAR_STEP_MS = 500, STANDARD_PARS = 1;
/**
 * v0.0.24: the void range's cadre at Phobos (test-anchors, "Anchor before you fire"; AW§5): the brief, each station's command (what
 * to do to be anchored there, and where), Standby, the string's end, a station passed for its time, the floating string's grab
 * and the course's end. Every line is a text bubble at the cadre (the user, 2026-11-19: "forget about voices, those are all
 * terrible use text bubble only"), at least two phrasings each picked by hash. {n} is the station's number in words.
 * v0.0.25 (the user's report of 2026-11-19: "instructions from the intructor tell you stuff like "push to north station", I don't
 * know what is meant, translate what I have to do for the 0G shooting training"): the brief is followed by `how`, the three ideas
 * said once (a push-off from rest against the deck, a wall or a hold in reach; the drift until you meet something, L the grab; you
 * fire only from what holds you), and every command says what to press in the game's own terms: {key:<action>} is the key's label
 * (core/keys.js label, AZERTY, read from the bindings so a remap never lies) and {row:<id>} the panel row's label (arms/shooting.js
 * LABELS), filled by scenarios/anchors.js sayKeys; north is said as the top wall. VOID_STEP is the DI's line (T) while a station's
 * command stands, its next step in the same terms (skills/instinct/void.js).
 */
export const VOID_CADRE = deepFreeze({
  brief: [
    'Well A, zero G. Five stations, one anchor each: you fire only from what holds you, never from nothing. Your boots are locked, so {key:up} {key:left} {key:down} {key:right} walk you. Each station is a yellow ring. Wait for my word.',
    'Five stations in zero G, one anchor each. You fire from what holds you, never from nothing. Boots locked: {key:up} {key:left} {key:down} {key:right} walk you. Each station is a yellow ring. Wait for my word.',
  ],
  how: [
    'Off your boots you float. From rest the move keys push you off the deck, a wall or a hold in reach, and you drift until you meet something. {key:grab} grabs a hold in reach. {key:stroll} pushes gently, {key:run} hard. {key:ready} opens the panel; {key:instinct} gives your next step.',
    'Boots released, you float. Push off from rest with the move keys, against the deck, a wall or a hold in reach; you drift till you meet something, and {key:grab} grabs a hold. {key:stroll} for a gentle push, {key:run} a hard one. {key:ready} for the panel, {key:instinct} for your next step.',
  ],
  cmd: {
    boots: ['Station one. Boots locked, walk right ({key:right}) to the ring on the deck and stop on it. The target at ten metres.', 'Station one: the ring on the deck to your right. Walk to it ({key:right}), boots locked, and stop on it. The target at ten metres.'],
    lanyard: ['Station two, the ring at the top wall. {row:boots:release} (the panel), push off up and left ({key:up} and {key:left} together), grab a pad-eye at the wall ({key:grab}), then {row:anchor:clip} (the panel). The target at fifteen metres.',
      'Station two: the top wall, up and left. {row:boots:release} (the panel), push up and left ({key:up} with {key:left}), {key:grab} to grab the pad-eye at the ring, then {row:anchor:clip} (the panel). The target at fifteen metres.'],
    onehand: ['Station three, the ring along the top wall to your right. {row:anchor:letgo} (the panel), push right ({key:right}), grab the hold at the ring ({key:grab}), then {row:weapon:transition} (the panel): one hand on the hold, the pistol in the other. The target at seven metres.',
      'Station three: right along the top wall. {row:anchor:letgo} (the panel), push right ({key:right}), {key:grab} at the ring, then {row:weapon:transition} (the panel). A hand on the hold, the P-12 in the other. The target at seven metres.'],
    wedge: ['Station four, the gap between the two plates. Push down ({key:down}), grab a pad-eye level with the gap ({key:grab}), push left into it ({key:left}), grab ({key:grab}), then {row:anchor:wedge} (the panel): back on one plate, boots on the other. The target at twenty metres.',
      'Station four: the gap between the plates, down and left. Push down ({key:down}), {key:grab} at the pad-eye level with it, push left into the gap ({key:left}), {key:grab}, then {row:anchor:wedge} (the panel). The target at twenty metres.'],
    floating: ['Station five, the ring at the top wall over the plates. {row:anchor:letgo} (the panel), out of the gap left ({key:left}), up to the top wall ({key:up}), right to the ring ({key:right}), grabbing ({key:grab}) at each stop. Then push off down ({key:down}), one round as you drift, and grab the first hold you pass.',
      'Station five: the top wall over the plates. {row:anchor:letgo} (the panel); left out of the gap ({key:left}), up to the top wall ({key:up}), right to the ring ({key:right}), {key:grab} at each stop. Then push off down ({key:down}) into the open, one round floating, and {key:grab} the first hold you pass.'],
  },
  pistol: ['Pistol. {row:weapon:transition} (the panel).', 'Pistol. The rifle stays slung: {row:weapon:transition}.'],
  // (at a rifle station with the P-12 still in the hand, once a station)
  rifle: ['Rifle. {row:weapon:rifle-up} (the panel).', 'The rifle for this one: {row:weapon:rifle-up}.'],
  standby: ['Standby.', 'Standby, standby.'],
  stop: ['Stop. Next station.', 'Stop. Good, next.'],
  short: ['Target gone. Next station.', 'Too slow, it is gone. Next.'],
  passed: ['Station passed. We move on.', 'Out of time on that one. Next station.'],
  drift: ['Now grab a pad-eye ({key:grab}) before you drift off.', 'Take the next hold ({key:grab}). Now.'],
  grabbed: ['Got a hold. That is the drift one round leaves you.', 'Holding. Remember what one round did.'],
  lost: ['Stay put, the safety boat is coming to you.', 'Hands in, the boat will fetch you.'],
  towed: ['On the boat\'s line. Take the pad-eye and carry on.', 'There. Hold on and carry on.'],
  end: ['Well A complete. Unload, show clear at the gallery.', 'Course complete. Weapons on safe.'],
});
/**
 * v0.0.25 (the user's report of 2026-11-19, above): the DI's line on the void range while a station's command stands, its next step
 * (skills/instinct/void.js voidStepOf): by its variant, filled as the cadre's are ({key:…}, {row:…}) and {dir}, the push's keys
 * toward the next point of the station's route ("{key:up} and {key:left}").
 */
export const VOID_STEP = deepFreeze({
  short: 'Station',
  lock: ['Station {n}: {row:boots:lock} first.', 'Station {n}: boots down, {row:boots:lock}.'],
  walk: ['Station {n}: walk {dir} to the yellow ring, and stop on it.', 'Station {n}: the yellow ring, {dir}. Stop on it.'],
  release: ['Station {n}: {row:boots:release}, then push off toward the ring.', 'Station {n}: {row:boots:release} to float, then push toward the ring.'],
  letgo: ['Station {n}: {row:anchor:letgo}, then push off toward the ring.', 'Station {n}: {row:anchor:letgo} first, then push.'],
  push: ['Station {n}: push off {dir}, toward the ring.', 'Station {n}: from rest, push {dir}.'],
  grab: ['Station {n}: {key:grab} now, grab the hold.', 'Station {n}: grab ({key:grab}), now.'],
  drift: ['Station {n}: drifting. {key:grab} when the ring or the pad-eye is in reach.', 'Station {n}: drifting; grab ({key:grab}) as you reach it.'],
  stop: ['Station {n}: stop first. Grab a hold ({key:grab}).', 'Station {n}: grab something ({key:grab}) to stop.'],
  anchor: ['Station {n}: {row} (the panel).', 'Station {n}: on the ring. {row}.'],
  gun: ['Station {n}: {row} (the panel).', 'Station {n}: the gun, {row}.'],
  out: ['Station {n}: push off {dir} into the open.', 'Station {n}: off the wall, {dir}, into the open.'],
  away: ['Station {n}: drifting in the open. Wait for Standby, then one round.', 'Station {n}: let it drift. One round on Standby.'],
  wait: ['Station {n}: ready. Wait for Standby.', 'Station {n}: set. Wait for the turn.'],
});

/**
 * v0.0.24: the berthing compartment's NCO aboard Testudo (test-burn, "Secure for burn"; AW§5): his shout at the warning (the 1MC's
 * own words are the gravity's, src/data/onemc.js), at loose gear thrown by the burn, and at the end. Text bubbles at him, as every
 * line is (the user, 2026-11-19); at least two phrasings each, picked by hash.
 */
export const BURN_NCO = deepFreeze({
  warn: ['Burn! Strap in or lock your boots, now!', 'You heard it! Racks or boots, move!'],
  loose: ['Who left gear adrift? That is a missile in a burn.', 'Loose gear! Stow it before the drive lights, every time.'],
  end: ['Secure from burn. Square your gear away.', 'Coasting. Check your kit, check your mates.'],
  // (the user's score of test-burn: at the warned manoeuvre's warning, as he straps into rack 1 himself)
  evade: ['Racks! Boots will not hold three G sideways. Strap in!', 'Into your rack and strap in! Your boots are no good for this one.'],
});

/**
 * v0.0.24 (the fixer of D's review): the instinct's line aboard while test-burn runs, in place of the barracks' day lines ("Free time.
 * Spend it like it costs something." through the 1MC's warning): by the ship's phase, before the warning, warned, and from the onset to
 * the scene's end. No act: R does the scene's acts (burn.js burnOffer). skills/instinct.js offBurn reads them; short is the line's chip word.
 * v0.0.25's burn polish: `evade` from the warned manoeuvre's warning to its onset (the boots' limit said: only the rack's straps hold 3 G
 * across the deck), and the barracks' "Up. The rack will still be here tonight." quiet while the scene runs (instinct.js offBurnWoke).
 */
export const BURN_T = deepFreeze({
  short: { before: 'Stow', warned: 'Secure', after: 'Hold on', evade: 'Strap in' },
  before: ['Stow your gear; when the 1MC calls it, strap in.', 'Helmet, seabag and rifle case in your locker. Then your rack.'],
  warned: ['Burn coming. Strap in at your rack, or lock your boots.', 'The drive lights soon. Rack or boots, now.'],
  after: ['Stay secured until the drive is quiet.', 'Hold on. The ship is not done with you yet.'],
  // (the user's score of test-burn: from the warned manoeuvre's warning to its onset, the boots' limit said)
  evade: ['Hard manoeuvre coming. Your boots will not hold it: strap in at your rack.', 'Three G sideways tears boots off the deck. Rack and straps, now.'],
});

/**
 * v0.0.25, "Hold to hold" (its build sheet §1 items 1, 11 and 13; ROADMAP §4.2's 0.0.7e; COMBAT §14.5, §14.8): the Wreck's sequence,
 * SEQ_HOUSE command for command (handling.js seqOf reads it, as the Wreck's row of src/data/places/ships.js, where the house record names the Wreck), its readinesses the
 * house's (MAKE READY's houseStart wants the boots locked too: shoothouse.js houseWant), its words the cadre's in the Shed's gallery:
 * every line a text bubble at the 1MC speaker of your compartment (the user, 2026-11-19: "forget voice synthesis, no voices."), never a
 * sound that speaks. No live words: the Wreck has turners and pop-ups only (0.0.7g brings role-players in boots).
 */
export const SEQ_WRECK = deepFreeze([
  { id: 'brief', ready: 'always', say: ['The Wreck. Two decks of a Tharsis-class at zero G: the brig, then down the trunk into the hold. Boots locked, you and your number two. On my GO you clear it hold to hold, every face. Anchor before you fire. Threats down, no-shoots untouched.',
    'This is the Wreck: deck five, the trunk, deck six, in free fall. You and your number two on your boots. On my GO, every compartment, every face, hold to hold. Anchor before you fire. Threats down, no-shoots alone.'],
    sayAgain: ['Same Wreck, same rules. Anchor before you fire.', 'Again. Same Wreck. Anchor before you fire.'] },
  { id: 'load', ready: 'magIn', short: 'Ten rounds, LOAD.', say: ['Frangible. With a magazine of ten, LOAD.', 'Frangible today. Your first magazine, ten rounds. LOAD.'] },
  { id: 'ready', ready: 'houseStart', short: 'MAKE READY. Boots locked, on safe, low ready.', say: ['MAKE READY. Boots locked, on safe, low ready, on your mark.', 'MAKE READY. On safe, low ready, boots locked, your number two behind you.'] },
  { id: 'standby', ready: 'goArm', say: ['Standby.', 'The Wreck. Standby.'] },
  { id: 'go', ready: 'laneDone', say: ['GO!', 'GO, GO, GO!'] },
  { id: 'stop', ready: 'houseSafe', short: 'Stop. On safe.', say: ['Stop. On safe, finger off.', 'Stop, stop. Make safe.'] },
  { id: 'clear', ready: 'shown', say: ['UNLOAD, SHOW CLEAR.', 'UNLOAD, SHOW CLEAR to me.'] },
  { id: 'wash', ready: 'washed', say: ['Weapons clear. Hot wash, right here.', 'The Wreck is clear. Hot wash, where you stand.'],
    sayEnd: { clear: ['Weapons clear. Hot wash, right here.', 'The Wreck is clear. Hot wash, where you stand.'], other: ['Weapons clear. Hot wash, right here.', 'Guns are clear. Hot wash, where you stand.'] } },
  { id: 'end', ready: 'never', say: ["That's the Wreck.", 'Done. Off the Wreck.'] },
]);
/**
 * The Wreck's words beside the house's (HOUSE_CHIEF stays the instructor's book; shoothouse.js reads a key here first on the
 * Wreck's lane): the brief's beside-you line and the gravity (free fall named, never "0.00 G on this deck"), the four faults of the
 * void (a round fired floating, the open middle, hanging in the hatch, not feet aft at the tug's onset: shoothouse.js houseRules), a
 * compartment's and a deck's "clear!", the stand's words by its face, and the hot wash's one thing for each fault. Each ≥ 2 phrasings,
 * picked by hash; text bubbles, never a voice.
 */
export const WRECK_CHIEF = deepFreeze({
  brief: ['Your number two takes your harness at the deck hatch. Through head first, then your boots on the nearest face.', 'At the trunk he holds you, you go through first. Plant your boots before you walk.'],
  zero: ['Nothing holds you in here but your boots and your hands.', 'Free fall in here: your boots, a hold or your number two, nothing else.'],
  float: ['Anchor before you fire!', 'You fired floating! Anchor first.'],
  open: ['Get on a face! Hold to hold.', 'Off the open middle! Hold to hold.'],
  hatch: ["Don't hang in the hatch!", 'Out of the hatch! You are a target in it.'],
  aft: ['Feet aft! Boots on the deck.', 'Feet aft! Not on the deckhead in a burn.'],
  deck: ['Deck {n} clear!', 'Deck {n} clear! Next.'],
  // (the hot wash after SEQ_WRECK's "Hot wash, where you stand.": nobody sits in free fall (the review of C and D))
  wash: ['Hot wash. Here is your lane, compartment by compartment.', 'Hot wash. Keep your boots down and look at the board.'],
  one: {
    float: ['You fired floating. Boots, a hold or your number two first, then the trigger.', 'A round from nothing pushes you off the line. Anchor, then fire.'],
    open: ['You hung in the open middle. Hold to hold: a face or a hold always in reach.', 'Nothing in reach is nothing to stop you. Hold to hold, never the middle.'],
    hatch: ['You hung in the hatch. Through it, plant, then look.', 'The hatch is where they shoot you. Through and onto a face.'],
    aft: ['The tug found you on the deckhead. At the siren, boots to the deck.', 'Feet aft means boots on the deck before the pull, every time.'],
  },
});
/** The Wreck's legs' words (the card's row word, what the cadre says of it, and its entry), in the lane's order (its build sheet §1 item 13). */
export const WRECK_LEGS = deepFreeze([
  { word: 'CELL 2', said: 'cell 2', entry: 'bulkhead hatch', deck: 5 },
  { word: 'CELL 5', said: 'cell 5', entry: 'bulkhead hatch', deck: 5 },
  { word: 'THE HOLD', said: 'the hold', entry: 'deck hatch', deck: 6 },
  { word: 'THE STORE', said: 'the store', entry: 'bulkhead hatch', deck: 6 },
]);
/**
 * The Wreck's set A's roles (its build sheet §5): ten boards, the house's form of id (the leg's number then a letter, two.js legOf's
 * `stand[0]`), each its face, its trigger (a no-shoot and the hostage facing from GO, every other turning on its compartment's hatch open
 * and a gap) and its name, the card's word (C2a, H1, S1 …); where each stands, on which face, and which pops are A's (data/places/wreck.js).
 */
export const WRECK_ROLES = deepFreeze({
  '1a': { face: 'threat', trigger: 'door', name: 'C2a' }, '1b': { face: 'noshoot', trigger: 'go', name: 'C2b' },
  '2a': { face: 'threat', trigger: 'door', name: 'C5a' }, '2b': { face: 'threat', trigger: 'door', name: 'C5b' },
  '3a': { face: 'threat', trigger: 'door', name: 'H1' }, '3b': { face: 'threat', trigger: 'door', name: 'H2' },
  '3c': { face: 'noshoot', trigger: 'go', name: 'H3' }, '3d': { face: 'threat', trigger: 'door', name: 'H4' },
  '4a': { face: 'armoured', trigger: 'door', name: 'S1' }, '4b': { face: 'hostage', trigger: 'go', name: 'S2' },
});
/** Words for a deck's number. */
export const DECK_WORDS = deepFreeze({ 2: 'two', 5: 'five', 6: 'six' });
/**
 * v0.0.27's stage 0, "Away the boarding party" (its build sheet §0 item 31, §3.0): the Patient Mule's stands' roles, one a stand of
 * src/data/places/hauler.js HAULER_POSTS and HAULER_CREW, in the house's form (the leg's number then a letter: 1 the passage, 2 cabin 1,
 * 3 the bunk room, 4 cabin 2), each its face (an armed man 'threat', a crewman 'noshoot'), its trigger (an armed man turning on his
 * compartment's hatch, a crewman facing from GO) and its name on the card; shoothouse.js standsOf throws on a stand with none. The
 * scene's men are live men, never boards (A's fill makes a man of every drawn stand and keeps no other). D owns this table after stage 0.
 */
export const HAULER_ROLES = deepFreeze({
  '1a': { face: 'threat', trigger: 'door', name: 'the man at the locker' },
  '2a': { face: 'threat', trigger: 'door', name: 'the man in cabin 1' },
  '2c': { face: 'noshoot', trigger: 'go', name: 'a crewman in cabin 1' }, '2d': { face: 'noshoot', trigger: 'go', name: 'a crewman in cabin 1' },
  '3a': { face: 'threat', trigger: 'door', name: 'the man between the berths' }, '3b': { face: 'threat', trigger: 'door', name: 'the man by the head' },
  '3c': { face: 'noshoot', trigger: 'go', name: 'a crewman in the bunk room' }, '3d': { face: 'noshoot', trigger: 'go', name: 'a crewman in the bunk room' },
  '4a': { face: 'threat', trigger: 'door', name: 'the man by the column' }, '4b': { face: 'threat', trigger: 'door', name: 'the man on the deckhead' },
  '4c': { face: 'noshoot', trigger: 'go', name: 'a crewman in cabin 2' },
});

// v0.0.27, "Away the boarding party" (its build sheet §1 D, items 1, 2, 4, 14, 15; COMBAT §14.1 to §14.6; SH§5, SH§6, FT§6.3): the Patient
// Mule's sequence, the leader's words and the compartments' words. A real op, not a lane: chambered at the muster (the fill), so no LOAD,
// MAKE READY, UNLOAD or SHOW CLEAR, no hot wash in a booth; the brief, the override, the standby, GO and the leader's one after-action
// line in the lock. Every line a text bubble at its speaker, the boarding team's #1 (the lane's chief aboard: shoothouse.js testShoothouse's
// ship branch), never a voice (the user, 2026-11-19: "forget voice synthesis, no voices.").
/** The override's DC (COMBAT §14.3, row 1: 10 + 3 × TL, the hauler's TL 1). */
export const OVERRIDE_DC = 13;
/**
 * The hauler's sequence (see the section's head; handling.js seqOf reads it as its row of src/data/places/ships.js): the brief (the
 * leader's first two bubbles), the override (its readiness 'override': the lock cycled, shoothouse.js collarTick), Standby, GO (laneDone:
 * the deck secured, fallen back from, you down or the due), the end (the leader's after-action line by the end, `sayEnd`). Its indices
 * are not SEQ_HOUSE's: the scene's readers find a command by id in the lane's own sequence (shoothouse.js cmdIndexOf).
 */
export const SEQ_COLLAR = deepFreeze([
  { id: 'brief', ready: 'always', say: ['Patient Mule, Belt ice hauler. The crew struck to the hail and are on deck one. Deck two did not answer: armed men, and some of the crew. The crew are not targets.',
    'The Patient Mule, an ice hauler out of the Belt. Her crew struck to the hail and mustered on deck one. Deck two never answered: armed men, and some of her crew. The crew are not targets.'],
    sayAgain: ['Deck two again. Armed men and some of the crew. The crew are not targets.', 'Same deck, same rules. The crew are not targets.'] },
  { id: 'override', ready: 'override', short: 'Four, override.', say: ['Four, override.', 'Four, the panel. Override.'] },
  { id: 'standby', ready: 'goArm', say: ['Stand by.', 'Stand by. On my GO.'] },
  { id: 'go', ready: 'laneDone', say: ['GO!', 'Go, go, go!'] },
  { id: 'end', ready: 'never', say: ['Deck two is ours. Hold the lock for the corpsman.', 'That is deck two. Weapons tight, hold the lock for the corpsman.'],
    sayEnd: { clear: ['Deck two is ours. Hold the lock for the corpsman.', 'That is deck two. Weapons tight, hold the lock for the corpsman.'],
      other: ['Lock dogged. The corpsman is coming through.', 'We are out. Hold the lock for the corpsman.'],
      // (you down for good in the deck: the corpsman sent to you, never "We are out." over you lying in the passage (the review of D))
      down: ['Three is down. Corpsman forward, now.', 'Man down, it is Three. Corpsman, forward.'] } },
]);
/**
 * The leader's words (shoothouse.js reads a key here first where the house record names the hauler, as the Wreck's WRECK_CHIEF): the
 * brief's beside-you line and the gravity (free fall named), the void's four faults (as the Wreck's: a round fired floating, the open
 * middle, hanging in the hatch, feet aft), a deck's "clear!", the send to each compartment ({room}: the leg's `said`), the deck secured,
 * the fall back, the hull holed, the override's lockout (Four's), the lane's stall and its time, a man ruled out at his compartment's
 * "Clear!", and the hot wash's lines (never said aboard: no wash). Each ≥ 2 phrasings, picked by hash; text bubbles, never a voice.
 */
export const COLLAR_LEADER = deepFreeze({
  brief: ['Frangible. Feet on the plate.', 'Frangible only. Boots on the plate.'],
  zero: ['Zero G aboard: your boots hold you, nothing else.', 'She is coasting. Nothing holds you but your boots.'],
  float: ['Anchor before you fire!', 'You fired floating! Boots down first.'],
  open: ['Get on a face! Hold to hold.', 'Off the open middle! Boots on the plate.'],
  hatch: ["Don't hang in the hatch!", 'Out of the hatch! You are a target in it.'],
  aft: ['Feet on the plate!', 'Boots down! On the plate.'],
  deck: ['Deck {n} clear!', 'Deck {n} clear!'],
  send: ['Three, Four: {room}. Go.', 'Three, Four, {room}. Go.'],
  // (the send by Four where the leader and the AR are down (shoothouse.js leaderSays): his to you, Three)
  sendTwo: ['Three, with me: {room}. Go.', 'Three, on me, {room}. Go.'],
  secure: ['Deck secure.', 'Deck two secure.'],
  fallback: ['Fall back to the lock!', 'Back to the lock! Fall back!'],
  hull: ["Hull's holed. Keep going.", "That one holed the hull. Keep going."],
  lockout: ["Panel's locked me out. Again.", 'Locked out. Going again.'],
  stall: ['Move. Get on with it.', 'Move. The deck is not cleared standing still.'],
  time: ['Leave it. Next.', 'Time. Next compartment.'],
  laneTime: ['Time. Back to the lock.', 'That is the time. Out.'],
  // (a man down or with his hands up ruled out at his compartment's "Clear!": a real man, never told to sit down as a role-player is)
  out: ['Down and covered. Leave him for the corpsman.', 'He is done. Leave him for the corpsman.'],
  // (men ruled out with their hands up and none down: they stay where they are, nobody's casualty (the v0.0.27 play review, finding 5))
  outHands: ['Hands up and covered. He stays there.', 'He has given up. Leave him where he is.'],
  wash: ['After action, here in the lock.', 'In the lock: what went right, what went wrong.'],
  one: {
    float: ['You fired floating. Boots, then the trigger.', 'A round from nothing pushes you off the line. Boots first.'],
    open: ['You hung in the open middle. A face in reach, always.', 'Nothing in reach is nothing to stop you. Hold to hold.'],
    hatch: ['You hung in the hatch. Through it, then look.', 'The hatch is where they shoot you. Through and onto a face.'],
    aft: ['Your boots came off the plate. Keep them down.', 'Boots on the plate, every step.'],
    // (the boarding's own (shoothouse.js oneThing, the v0.0.27 play review, finding 6): no range verdict aboard, the deck's lesson)
    clean: ['The deck is ours, by the drill. That is the job.', 'Secured by the drill. That is how it is done.'],
    fellBack: ['Two of us down, so we came out. Win the first fight and the rest follows.', 'We fell back with our wounded. Fewer seconds in their sight next time.'],
    down: ['You went down in there. Every second in a hatch is a second in their sight.', 'Down. Plates stop rounds, not all of them: off the line, fast.'],
    protected: ['A round at a man who could not fight. Down, hands up or unarmed: never.', 'You fired on a man out of the fight. Look before the trigger.'],
    bang: ['Late on the bang. Go in while they are blind.', 'The bang buys you seconds. Spend them going in.'],
  },
});
/**
 * The boarding's card words (shoothouse.js collarCardOf and collarRowsOf): the hull's kind and the deck after the ship's name, the end's
 * word before its time ("SECURED 3:12", "FELL BACK 2:40", "YOU WERE DOWN 1:55", "NOT SECURED: TIME 10:00"), the run sheet's place, the
 * fire team's labels by number (team.js fireTeamOf's n: a label, never a slot) and the men's states.
 */
export const COLLAR_CARD = deepFreeze({
  ship: 'BELT ICE HAULER', deck: 'DECK 2', place: 'THE PATIENT MULE · DECK 2',
  ends: { clear: 'SECURED', fellBack: 'FELL BACK', down: 'YOU WERE DOWN', time: 'NOT SECURED: TIME', passed: 'NOT SECURED', dry: 'NOT SECURED: DRY' },
  team: { 1: 'THE LEADER', 2: 'THE AR', 3: 'YOU', 4: 'FOUR' },
  states: { down: 'DOWN', hands: 'GAVE UP', out: 'DOWN', flee: 'FLED', fled: 'FLED', up: 'STILL UP' },
  // (the corpsman's outcomes (aid.js boardingCare's, B's))
  care: { stable: 'STABLE', aidStation: 'TO THE AID STATION', diedOfWounds: 'DIED OF WOUNDS', killed: 'KILLED OUTRIGHT' },
});
/** The Patient Mule's legs' words (the card's row word, what the leader says of it, its entry, its deck), in the lane's order (hauler-plans.js HAULER_ORDER). */
export const HAULER_LEGS = deepFreeze([
  { word: 'THE PASSAGE', said: 'the passage', entry: 'lock hatch', deck: 2 },
  { word: 'CABIN 1', said: 'cabin one', entry: 'bulkhead hatch', deck: 2 },
  { word: 'THE BUNK ROOM', said: 'the bunk room', entry: 'bulkhead hatch', deck: 2 },
  { word: 'CABIN 2', said: 'cabin two', entry: 'bulkhead hatch', deck: 2 },
]);

export const VERDICT_WHY = deepFreeze({
  setup: 'a lane set up is no lane', casualty: 'a casualty', hostage: 'the hostage', noshoot: 'a no-shoot', stopped: 'the safety stop', muzzle: 'your muzzle',
  standing: 'a threat left standing', passed: 'a room not cleared', pars: 'too many pars missed', lane: 'over the lane\'s par', time: 'the lane ran out of time',
  burst: 'the cease fire at the burst',
});

// v0.0.26, "Bang, then go" (its build sheet §1 item 1, item 8, §3.2; SC§10.1, SC§10.3): the instructor's words for room 1 with the two
// role-players, each a text bubble at its speaker (the user, 2026-11-19: "forget voice synthesis, no voices."). The brief names the kit and
// never the door ("we only know what we know"); the card says afterwards which it was. Read by shoothouse.js houseCmdSay (the PA's brief and
// standby on R.house.bangGo), its search offer after room 1's "Clear!" and windowWords (the hot wash's first line, by the window's case).
/** "Bang, then go"'s words (see the section's head): the brief (first run, Again), the kit's line by the draw, the standby, the search offer, the window's six. */
export const BREACH_CHIEF = deepFreeze({
  brief: ['Room 1, live: two role-players with marking rounds, playing Star Helix security. Masks stay down. A fatal hit ends it. Put them down or take their surrender.',
    'Room 1, live. Two of my staff are in there with marking rounds, playing Star Helix security. Masks stay down. A fatal hit ends it. Put them down or take their surrender.'],
  again: ['Room 1 again.', 'Room 1, again.'],
  kit: { bang: ['You each carry a G-11. On the bang, go.', 'One G-11 each. On the bang, go.'], quiet: ['No bangs today. Speed is your bang.', 'No bangs today. Your speed is the bang.'] },
  sterile: 'Sterile check first.',
  standby: ['Room 1. Standby.', 'Standby.'],
  search: ['Search them if you want the truth now.', 'Search them now if you want the truth.'],
  // (the men ruled out at room 1's "Clear!", named ({men}: "1A", "1A and 1B"): the house's "You, out." read as said to you, the instructor
  // beside you (the play review of v0.0.26))
  out: ['{men}, you are out. Sit down where you are.', '{men}: out. Sit down.'],
  // (the hot wash's first line by the window's case (shoothouse.js windowWords; SC§10.3's five, and a sixth, my call: the quiet loose
  // door where he was on it first); {n} the seconds from the bang to your entry)
  window: {
    onBang: ['On the bang. They were blind when you came through.', 'On the bang. They could not see you come through.'],
    late: ['You came in {n} seconds after the bang. They were getting their eyes back.', '{n} seconds after the bang. Their eyes were coming back.'],
    wasted: ['Five seconds of blind, and you spent them outside.', 'You spent their five seconds of blind outside the door.'],
    kept: ['You had a bang and kept it.', 'A bang in your pouch is no bang.'],
    held: ['He had his rifle on that door before you opened it. That is what the bang is for.', 'His rifle was on that door before it moved. That is what the bang is for.'],
    faster: ['The door turned him. You were faster.', 'The door turned him, and you beat his rifle.'],
    slower: ['The door turned him, and he was on it before you. Speed is your bang.', 'He heard the door and got there first. Speed is your bang.'],
  },
});

// v0.0.28, "The window and the canopy" (its build sheet items 1 to 16, §5; src/sim/scenarios/armoury-day.js): the armourer at window 1, the
// squad leader in front of the rank and at the canopy, the ammunition NCO at his table and at your shoulder on the lane, each line a text
// bubble at its speaker (the user, 2026-11-19: "forget voice synthesis, no voices."). SEQ_ARMOURY is the scene's sequence on the course
// engine (handling.js seqOf), each command { id, key (unique: the three UNLOAD, SHOW CLEARs share the id 'clear', so the step panel offers its
// macro with the observer, shooting.js stepsOf), ready (armoury-day.js armouryReady; 'shown' the range's own), stage, who ('armourer' | 'nco' |
// 'leader'), say (≥ 2 phrasings, {serial} the rifle's in words), short (its terms in a line) }, an id never in camel case (a save's id walk,
// tests/ids-check.mjs, reads a record's `id` as a place's when it can: 'fall-in', not 'fallIn'); the next after one is the scene's (armouryNext: the
// slip's way back to the window, a turn-back's to the table). ARM_SAY is every other line (≥ 2 phrasings, picked by hash); ARM_ROWS the rows'
// labels, the one place a row is named (the R menu, the press words, T's lines); ARM_PRESS each command's station and the rows it asks for, read by
// armouryPressOf, which builds the press words from these labels and core/keys.js' (never written by hand: the user's report of 2026-11-19).
/** "The window and the canopy"'s sequence (see the section's head). */
export const SEQ_ARMOURY = deepFreeze([
  { id: 'brief', key: 'brief', ready: 'always', stage: 'window', who: 'leader', say: ['Echo two, draw weapons. Card, serial, show clear, sign. Bus at zero eight-twenty.', 'Echo two, draw your weapons: card, serial, show clear, sign. The bus is at zero eight-twenty.'] },
  { id: 'card', key: 'card', ready: 'carded', stage: 'window', who: 'armourer', short: 'Weapons card.', say: ['Weapons card.', 'Next. Weapons card.'] },
  { id: 'clear', key: 'window', ready: 'signed', stage: 'window', who: 'armourer', short: 'Show me clear and sign.', say: ['{Serial}. Show me clear and sign.', '{Serial}. Show it clear and sign for it.'] },
  { id: 'fall-in', key: 'fallIn', ready: 'inRank', stage: 'rank', who: 'leader', short: 'Fall in.', say: ['Fall in.', 'Echo two, fall in.'] },
  { id: 'serials', key: 'serials', ready: 'called', stage: 'rank', who: 'leader', short: 'Sensitive items. Serials.', say: ['Sensitive items. Serials.', 'Sensitive items check. Serials, down the rank.'] },
  { id: 'back', key: 'back', ready: 'handedBack', stage: 'window', who: 'armourer', short: 'Hand it back.', say: ['Hand it back.', 'Give it here. Hand it back.'] },
  { id: 'bus', key: 'bus', ready: 'arrived', stage: 'bus', who: 'leader', short: 'On the bus.', say: ['Echo two, on the bus.', 'Echo two, mount up. On the bus.'] },
  { id: 'issue', key: 'issue', ready: 'issued', stage: 'ammo', who: 'nco', short: 'Count them and sign.', say: ['Twenty rounds ball. Count them and sign.', 'Twenty rounds of ball. Count them, then sign.'] },
  { id: 'relay', key: 'relay', ready: 'arrived', stage: 'relay', who: 'nco', short: 'To the two-five line.', say: ['Relay one, to the two-five line.', 'Relay one, move to the two-five line.'] },
  { id: 'clear', key: 'lane', ready: 'shown', stage: 'lane', who: 'nco', short: 'UNLOAD, SHOW CLEAR.', say: ['UNLOAD, SHOW CLEAR.', 'Relay one, UNLOAD, SHOW CLEAR.'] },
  { id: 'police', key: 'police', ready: 'policed', stage: 'lane', who: 'nco', short: 'Police your brass.', say: ['Police your brass.', 'Relay one, police your brass. Every case.'] },
  { id: 'walk', key: 'walk', ready: 'arrived', stage: 'walk', who: 'nco', short: 'To the ammunition point.', say: ['Relay one, to the ammunition point.', 'Relay one, back to the ammunition point.'] },
  { id: 'turn-in', key: 'turnIn', ready: 'turnedIn', stage: 'ammo', who: 'nco', short: 'Unused rounds back.', say: ['Unused rounds back.', 'Any rounds you have left, back to me.'] },
  { id: 'declare', key: 'declare', ready: 'declared', stage: 'ammo', who: 'nco', short: 'No brass, no ammo?', say: ['No brass, no ammo?', 'Your declaration: no brass, no ammo?'] },
  { id: 'bus-back', key: 'busBack', ready: 'arrived', stage: 'bus', who: 'leader', short: 'On the bus.', say: ['Echo two, on the bus.', 'Echo two, mount up. Back to the lines.'] },
  { id: 'clean', key: 'clean', ready: 'cleaned', stage: 'canopy', who: 'leader', short: 'Clean your weapons. Rifles in by ten-thirty.', say: ['Clean your weapons. Rifles in by ten-thirty.', 'Weapons cleaning. Rifles in by ten-thirty.'] },
  { id: 'clear', key: 'barrel', ready: 'barrel', stage: 'barrel', who: 'armourer', short: 'Clear it at the barrel.', say: ['Clear it at the barrel.', 'At the barrel first. Clear it.'] },
  { id: 'hand-in', key: 'handIn', ready: 'handedIn', stage: 'window', who: 'armourer', short: 'Turn it in.', say: ['Turn it in.', 'Next. Turn it in.'] },
  { id: 'sign-in', key: 'signIn', ready: 'signedIn', stage: 'window', who: 'armourer', short: 'Sign it in.', say: ['Sign it in.', 'Sign here. It is back in my rack.'] },
  { id: 'end', key: 'end', ready: 'never', stage: 'end', who: 'leader', say: ['Weapons are in. Echo two, fall out.', 'That is the day\'s weapons in. Echo two, fall out.'] },
]);
/** The rows' labels (see the section's head): the R menu's, the press words', T's. */
export const ARM_ROWS = deepFreeze({
  card: 'Hand over your weapons card', read: 'Read the serial back', show: 'UNLOAD, SHOW CLEAR', sign: 'Sign for it', back: 'Hand it back', call: 'Call your serial',
  count: 'Count the rounds', sign20: 'Sign for twenty', police: 'Police your brass', roundsBack: 'Rounds back', declare: 'No brass, no ammo',
  rushed: 'Clean, rushed', normal: 'Clean, normal', careful: 'Clean, careful', againRushed: 'Clean it again, rushed', againNormal: 'Clean it again, normal', againCareful: 'Clean it again, careful',
  barrel: 'Clear it into the barrel', handIn: 'Hand it in', signIn: 'Sign it in', draw: 'Draw', backDeclare: 'Rounds back, declare',
});
/**
 * Each command's station and the rows it asks for, in the order they are done (see the section's head): { station, rows, tempo? }; the press
 * words name the next row not yet done (armoury-day.js armouryPressOf). The table's rows ({ tempo }) are its three tempos, R alone normal.
 */
export const ARM_PRESS = deepFreeze({
  card: { station: 'window', rows: ['card'] },
  window: { station: 'window', rows: ['read', 'show', 'sign'] },
  fallIn: { station: 'rank', rows: [] },
  serials: { station: 'rank', rows: ['call'] },
  back: { station: 'window', rows: ['back'] },
  issue: { station: 'ammo', rows: ['count', 'sign20'] },
  lane: { station: 'lane', rows: ['show'] },
  police: { station: 'lane', rows: ['police'] },
  turnIn: { station: 'ammo', rows: ['roundsBack'] },
  declare: { station: 'ammo', rows: ['declare'] },
  clean: { station: 'table', rows: ['rushed', 'normal', 'careful'], tempo: true },
  barrel: { station: 'barrel', rows: ['barrel'] },
  handIn: { station: 'window', rows: ['handIn'] },
  signIn: { station: 'window', rows: ['signIn'] },
});
/** "The window and the canopy"'s other lines (see the section's head), each ≥ 2 phrasings; {n}, {serial} and the like filled by the scene. */
export const ARM_SAY = deepFreeze({
  cardRead: ['{Name}, Echo two. {Card}.', '{Name}. Echo two, {card}.'],
  fetched: ['Here. Bolt locked back.', 'Your rifle. Bolt is back.'],
  readSlip: ['That is {read}. My card says {card}.', '{Read}, Sergeant. My card says {card}.'],
  readMine: ['{Read}. That is mine.', '{Read}. Mine.'],
  mistake: ['My mistake. Wait one.', 'My mistake. The next slot. Wait one.'],
  showFirst: ['Show me clear first.', 'Clear first, then sign.'],
  signed: ['Signed. Next.', 'Signed out to you. Next.'],
  checkOne: ['{Serial}.', '{Serial}, Sergeant.'],
  // (the rank's own calls, the serial's last three digits, one at a time: armoury-day.js CHECK_GAP_MS)
  checkTail: ['{Tail}.', 'Ends {tail}.'],
  checkYou: ['{Name}.', '{Name}, your serial.'],
  checkSlip: ['That is not what my sheet says. Back to the window.', 'That number is not on my sheet against you. Back to the window.'],
  checkOk: ['Good. All present.', 'All present. Good.'],
  handedBack: ['Wait one.', 'The right one. Wait one.'],
  countShort: ['Nineteen, Sergeant.', 'I make it nineteen, Sergeant.'],
  countFull: ['Twenty, Sergeant.', 'Twenty, Sergeant. All there.'],
  countAdded: ['Nineteen? So it is. Here.', 'So it is. One more. Here.'],
  sign20: ['Signed. Twenty rounds ball.', 'Twenty ball, signed for.'],
  air: { calm: ['Still air, for once.', 'Not a breath of wind.'], breezy: ['A breeze off the rim.', 'A breeze down off the rim.'], gusty: ['Grit in everything.', 'Gusts off the rim, and grit in everything.'] },
  backN: ['{N} rounds back. Noted.', '{N} back to me. Noted.'],
  back1: ['One round back. Noted.', 'One back to me. Noted.'],
  backNone: ['Nothing back. Noted.', 'All fired. Noted.'],
  declared: ['No brass, no ammo, Sergeant.', 'No brass and no ammo, Sergeant.'],
  declOk: ['Clear. On the bus.', 'Good. On the bus.'],
  declBrass: ['You fired {fired} and policed {policed}. Back on the line.', '{Fired} fired, {policed} policed. Back on the line.'],
  declHeld: ['What is this, then?', 'And what is this?'],
  declShort: ['One round unaccounted for. Nobody leaves.', 'One round short on my sheet. Nobody leaves.'],
  declMag: ['Your magazine is still on {where}, {n} in it. Lost, on my sheet.', 'A magazine of yours left on {where}, {n} in it. It goes on my sheet as lost.'],
  declLoose: ['And what is this? {N} live on my line. Your declaration was false.', 'What is this, then? {N} live on my line, yours.'],
  shakedown: ['My count, and you signed for it. Count what you sign for.', 'It was my count, and you signed for it. Count what you sign for.'],
  liveOnMat: ['A live round on your mat. Your declaration was false.', 'That is a live round. You declared no ammo.'],
  inspect: ['Bolt. Carrier. Bore.', 'Bolt. Carrier. Bore. Let me look.'],
  pass: ['Clean. Rack it. Condition {cond}.', 'Clean. Racked. Condition {cond}.'],
  again: ['Carbon on the carrier. Clean it again.', 'Grit in the action. Clean it again.'],
  taken: ['I will take it. It goes in the book.', 'I will take it, and it goes in the book.'],
  pin: ['Where is your firing pin retaining pin?', 'Your firing pin retaining pin. Where is it?'],
  chit: ['A chit, and twenty minutes of my day.', 'A chit for the pin, and twenty minutes of my day.'],
  magsShort: ['{What}. You drew three.', 'I count {what}. You drew three.'],
  magsOk: ['Three magazines.', 'Three magazines. Good.'],
  signedIn: ['Racked. Next.', 'In the rack. Next.'],
  late: ['Ten-thirty was the time. It goes on the sheet.', 'That is past ten-thirty. It goes on the sheet.'],
  muzzle: { armourer: ['Muzzle! Watch it at my window.', 'Muzzle! Not at my window.'], leader: ['Muzzle! Watch it in my rank.', 'Muzzle! Not in my rank.'], nco: ['Muzzle! Watch it on my line.', 'Muzzle! Not on my line.'] },
  box: ['Where are you going? Back here.', 'Where do you think you are going? Back here.'],
  fetchedYou: ['The squad leader came for you.', 'Your squad leader fetched you back.'],
  slow: ['The line waited on you.', 'We waited on you.'],
  taken2: ['I will do it. It goes on the sheet.', 'Give it here. It goes on the sheet.'],
});
