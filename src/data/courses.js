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
// Data only.
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

/** Which command each macro answers (a macro acted on before its command is given is ahead of the tower). */
export const MACRO_CMD = deepFreeze({ load: 'load', ready: 'ready', clear: 'clear', cease: 'cease', unload: 'clear',
  'reload:speed': ['kneel', 'stand'], 'reload:retain': ['kneel', 'stand'], 'reload:tactical': ['kneel', 'stand'] });
/**
 * Which command each macro completes, marked ◉ in the step panel: MACRO_CMD but UNLOAD, which answers 'clear'
 * for the warning but never shows the rifle to the coach, so the tower would still wait for the show (the
 * runtime review: both rows marked, and the first, taken, cost its 4.1 s of the pace scored).
 */
export const MACRO_MARK = deepFreeze({ load: 'load', ready: 'ready', clear: 'clear', cease: 'cease',
  'reload:speed': ['kneel', 'stand'], 'reload:retain': ['kneel', 'stand'], 'reload:tactical': ['kneel', 'stand'] });

/** The courses (see the header). */
export const COURSES = deepFreeze({
  fam25: {
    word: 'familiarisation fire, 25 m', paper: 'card25', lanes: [1, 6], lane: { from: 2, to: 5 }, mags: [5, 5, 5], strings: ['prone', 'kneel', 'stand'],
    set: { mags: [2, 3], rounds: [2, 4], kinds: [['dud', 40], ['stovepipe', 35], ['double', 25]] },
    roGapMs: [1500, 4000], firstGapMs: 3000, nudgeMs: 30000, kit: 'range-fam', hour: 9.0,
  },
});

/**
 * The coach's lines (the voice beside you), each a list of phrasings. A string's are by how many missed the
 * paper (0, 1, 2, more: 'low') when any shot of it was rushed or not held to +4, 'held' when every one was
 * (one natural 1 the only miss: 'luck'), {hits} and {shots} its counts in words, capitalised where a line
 * opens on them ({Hits}): a string the set stoppage cut to four is "Four of four", never "five" (the integrator's).
 */
export const COACH = deepFreeze({
  brief: ["I'm your coach. Wait for the tower.", "I'm your coach today. Nothing happens until the tower says so."],
  string: {
    0: ['{Hits} of {shots} on the paper. Keep doing that.', 'All {shots} on the paper. Same again.'],
    1: ['{Hits} of {shots}. Breathe out, then press.', '{Hits} on the paper. Let the shot surprise you.'],
    2: ['{Hits} of {shots}. You are snatching the trigger. Press it.', '{Hits} on the paper. Slow down, the card is not going anywhere.'],
    low: ['Not many on the paper. Settle the sight, breathe out, press.', 'That card got off lightly. Settle the reticle, then the press.'],
    // (every shot of the string held to +4, never rushed: the misses were not haste (the design review's: a careful
    // shooter told "You are snatching the trigger" for what the dice did); one natural 1 alone, owned)
    held: ['{Hits} of {shots}. You held every one; keep that press.', '{Hits} on the paper. The hold was right. Same again.'],
    luck: ['One went wide. That happens; the rest were good.', 'One got away. It happens to everybody. The rest were sound.'],
  },
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
