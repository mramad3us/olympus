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
// what he says to a shooter the line waits on. Data only.
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
    },
    gaps: { door: { 'w4.r2': [300, 1200], 'w4.r3': [500, 1500] }, doorOther: [300, 1200], zone: [1500, 3000] },
    funnelM: 0.5, funnelFaultMs: 1000, twoSlotM: 1.5, twoWaitMs: 3000, twoBehindM: 0.65, stackM: 0.4,
    stallMs: 60_000, stallMoreMs: 30_000, laneMaxMs: 600_000, washMs: 90_000,
    // (the rework's R6, COMBAT §25.19.6: the P-12 from the Sergeant up (arms/sidearm.js SIDEARM_TIERS), the house's ten frangible a magazine)
    sidearm: { model: 'p12', mags: [['had17', 10, 'frangible'], ['had17', 10, 'frangible']] },
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

/** The house course's sequence (see the header): the instructor's commands on the PA, { id, ready, say, short? }. */
export const SEQ_HOUSE = deepFreeze([
  { id: 'brief', ready: 'always', say: ["Lane A. Three rooms and the hall, you and your number two. Full G in the Wheel: your kit weighs what it weighs on Earth. On my GO you stack and clear. Threats down, no-shoots untouched. My timer, not your wounds.",
    "This is lane A: three rooms, then the hall, at one G. You and your number two clear it on my GO. Put the threats down and leave the no-shoots alone. I run the timer."] },
  { id: 'load', ready: 'magIn', short: 'Ten rounds, LOAD.', say: ['Practice rounds. With a magazine of ten, LOAD.', 'Frangible today. Your first magazine, ten rounds. LOAD.'] },
  { id: 'ready', ready: 'houseStart', short: 'MAKE READY. Low ready, on safe, on your mark.', say: ['MAKE READY. Low ready, on safe, on your mark. Combat.', 'MAKE READY. On safe, low ready, on your mark, and your number two behind you.'] },
  { id: 'standby', ready: 'goArm', say: ['Standby.', 'Lane A. Standby.'] },
  { id: 'go', ready: 'laneDone', say: ['GO!', 'GO, GO, GO!'] },
  { id: 'stop', ready: 'houseSafe', short: 'Stop. On safe.', say: ['Stop. On safe, finger off.', 'Stop, stop. Make safe.'] },
  { id: 'clear', ready: 'shown', say: ['UNLOAD, SHOW CLEAR.', 'UNLOAD, SHOW CLEAR to me.'] },
  { id: 'wash', ready: 'washed', say: ['The lane is clear. Hot wash, in the booth.', 'The lane is clear. Into the booth: hot wash.'] },
  { id: 'end', ready: 'never', say: ["That's your lane.", 'Done. Off the floor.'] },
]);

/** What the instructor says to a shooter the line waits on ("Shooter, back on your mark."), by what is lacking (shoothouse.js houseWant). */
export const HOUSE_NUDGE = deepFreeze({ mag: 'a magazine in.', chamber: 'a round up: MAKE READY.', safe: 'on safe, finger off.', low: 'low ready.', out: 'out of it.',
  mark: 'back on your mark.', still: 'stand still.', gait: 'Combat. Weapon up.', two: 'wait for your number two.', show: 'show me clear.',
  // (your number two's own wants, said to him: "Number two, a round up." (shoothouse.js twoLacks; handling.js names him))
  'two:busy': 'finish it.', 'two:mag': 'a magazine in.', 'two:chamber': 'a round up.', 'two:safe': 'on safe, finger off.', 'two:low': 'low ready.', 'two:show': 'show me clear.' });

/**
 * The instructor's words (see the header), each ≥ 2 phrasings: his faults from the catwalk as they happen, at most one
 * other line a room, nothing while a take-in runs; the hot wash's lines ({room} a room's word, {s} seconds, {n} a count).
 */
export const HOUSE_CHIEF = deepFreeze({
  brief: ['Your number two takes the far corner of every room you cross. Muzzles up in the stack.', 'Two of you, one lane. He goes where you do not. Muzzle up, never across him.'],
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
  stall: ['Move on.', 'Move. You are clearing, not visiting.'],
  // (his acknowledgement of your number two's rifle shown clear at UNLOAD, SHOW CLEAR (COMBAT §25.19.5))
  twoClear: ['Number two, clear.', 'Number two: clear.'],
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
  // (the one thing to do differently, by the worst number of the run (COMBAT §17.2): the hot wash's last line)
  one: {
    funnel: ['You stood in the doorway. Through it, to your point, and stop there.', 'The door is where they shoot you. Keep moving through it.'],
    // (below rung 2, where the take-in's brake stops you in the door: the one decision that keeps the feet going (COMBAT §25.5.2; the fixer's of 0.0.12))
    funnelKeys: ['You stood in the doorway. Set a Watch on your corner before X: your feet keep going through the door.', 'The door is where they shoot you. Watch your corner before you go, and the pause will not stop you in it.'],
    par: ['He fired first. Set a Watch on your corner before you go: your eyes are there when he is.', 'Too slow off the sighting. Muzzle on the corner before you cross the door.'],
    corner: ['You called clear with a corner unlooked. Every corner, then the call.', 'Look into every corner before you call it.'],
    muzzle: ['Your muzzle crossed your number two. High ready in the stack, always.', 'Never across your number two. Muzzle up when he is in front of it.'],
    noshoot: ['You shot a no-shoot. Identify, then press.', 'Hands first. Then the trigger.'],
    hostage: ['You hit the hostage. With a hostage it is the head or nothing.', 'Hostage: head only, or hold.'],
    standing: ['You left a man standing. Down, then on.', 'Never leave one up behind you.'],
    door: ['You left the inner door. Hold it, or clear it.', 'A closed door at your back is a man at your back. Hold it.'],
    dummy: ['The click: tap, rack, back on him. It should be quicker.', 'The dummy cost you. Tap, rack, and back on target without thinking.'],
    time: ['Too slow through the rooms. The same drill, quicker hands.', 'Faster between the rooms. The pause is the only time you get.'],
    clean: ['Clean lane. Again, faster.', 'Clean. Now do it again, and quicker.'],
  },
});
