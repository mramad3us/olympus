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
// ready } where `ready` names what the range officer must see before he gives the next command
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
// after. KD_COACH and KD_RO are the coach's and the range officer's new lines (two phrasings or more). Data only.
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The tower's commands in order (see the header). */
export const SEQ = deepFreeze([
  { id: 'brief', ready: 'always', say: ['Range is open. Familiarisation fire, two-five metres: three strings of five, prone, kneeling, standing. The line is cold.',
    'The range is open. Two-five metre familiarisation: three strings of five rounds, prone, kneeling, standing. The line is cold.'] },
  { id: 'prone', ready: 'prone', say: ['Shooters, assume the prone position.', 'Firing line, get down: the prone position.'] },
  { id: 'load', ready: 'magIn', say: ['With a magazine of five rounds, LOAD.', 'Shooters, with a magazine of five rounds, LOAD.'] },
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
export const NEEDS_ROUNDS = Object.freeze(['magIn', 'cond1', 'kneel1', 'stand1', 'emptyLocked', 'sitMag', 'sit1']);

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
  { id: 'load', ready: 'magIn', stage: 'zero', say: ['With a magazine of three rounds, LOAD.', 'Shooters, with a magazine of three rounds, LOAD.'] },
  { id: 'ready', ready: 'cond1', stage: 'zero', say: ['MAKE READY.', 'Shooters, MAKE READY.'] },
  { id: 'fire', ready: 'emptyLocked', stage: 'zero', string: 'zero', say: ['Three rounds at your zeroing card. All ready on the firing line. Commence fire.', 'Your group of three. Ready on the right, ready on the left. Commence fire.'] },
  { id: 'cease', ready: 'safe', stage: 'zero', string: 'zero', say: ['CEASE FIRE.', 'CEASE FIRE, CEASE FIRE.'] },
  { id: 'group', ready: 'zeroRead', stage: 'zero', say: ['Shooters, read your groups with your coach.', 'Coaches, read the groups.'] },
  { id: 'dial', ready: 'dialled', stage: 'zero', next: 'zeroLoop', say: ['Make your sight corrections.', 'Shooters, dial your corrections.'] },
  { id: 'reload', ready: 'cond1', stage: 'zero', next: 'fire', say: ['Your next magazine of three. RELOAD.', 'Shooters, the next three rounds. RELOAD.'] },
  { id: 'clear', ready: 'shown', stage: 'zero', say: ['UNLOAD, SHOW CLEAR.', 'Shooters, UNLOAD, SHOW CLEAR to your coach.'] },
  { id: 'police', ready: 'policed', stage: 'zero', say: ['Police your brass.', 'Shooters, police your brass.'] },
  { id: 'turnIn', ready: 'turnedIn', stage: 'zero', say: ['Unused rounds to your coach.', 'Any rounds you have left, to your coach.'] },
  { id: 'walk', ready: 'arrived', stage: 'walk', line: 300, say: ['Relay one, to the three-hundred-metre line.', 'Relay one, move to the three hundred.'] },
  { id: 'prone', ready: 'prone', stage: 'confirm', line: 300, say: ['Shooters, assume the prone position.', 'Relay one, get down: the prone position.'] },
  { id: 'optic', ready: 'optic4', stage: 'confirm', say: ['Optics to four power.', 'Shooters, your optics to four power.'] },
  { id: 'dope', ready: 'dope', stage: 'confirm', line: 300, say: ['Set your dope for three hundred.', 'Shooters, dial your dope for three hundred.'] },
  { id: 'load', ready: 'magIn', stage: 'confirm', say: ['With a magazine of five rounds, LOAD.', 'Shooters, with a magazine of five rounds, LOAD.'] },
  { id: 'ready', ready: 'cond1', stage: 'confirm', say: ['MAKE READY.', 'Shooters, MAKE READY.'] },
  { id: 'fire', ready: 'emptyLocked', stage: 'confirm', string: 'confirm', say: ['Five rounds slow fire, five minutes. All ready on the firing line. Commence fire.', 'Slow fire, five rounds. Ready on the right, ready on the left. Commence fire.'] },
  { id: 'cease', ready: 'safe', stage: 'confirm', string: 'confirm', say: ['CEASE FIRE.', 'CEASE FIRE, CEASE FIRE.'] },
  { id: 'clear', ready: 'shown', stage: 'confirm', say: ['UNLOAD, SHOW CLEAR.', 'Shooters, UNLOAD, SHOW CLEAR to your coach.'] },
  { id: 'police', ready: 'policed', stage: 'confirm', say: ['Police your brass.', 'Shooters, police your brass.'] },
  { id: 'turnIn', ready: 'turnedIn', stage: 'confirm', say: ['Unused rounds to your coach.', 'Any rounds you have left, to your coach.'] },
  { id: 'pits', ready: 'arrived', stage: 'pits', line: 200, say: ['Relay one to the pits. Relay two, to the line.', 'Relay one, you are pulling butts. Relay two to the three hundred.'] },
  { id: 'dope', ready: 'dope', stage: 's200', line: 200, say: ['Set your dope for two hundred.', 'Shooters, dial your dope for two hundred.'] },
  { id: 'sit', ready: 'sitMag', stage: 's200', say: ['The sitting position. With a magazine of five rounds, LOAD.', 'Shooters, sitting. With a magazine of five rounds, LOAD.'] },
  { id: 'ready', ready: 'sit1', stage: 's200', say: ['MAKE READY.', 'Shooters, MAKE READY.'] },
  { id: 'fire', ready: 'emptyLocked', stage: 's200', string: 's200', say: ['Ten rounds rapid, sixty seconds, your magazine change in the string. Commence fire.', 'Rapid fire, ten rounds, two magazines, sixty seconds. Commence fire.'] },
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
