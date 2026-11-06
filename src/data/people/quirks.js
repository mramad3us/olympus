// OLYMPUS data: the quirks, a person's habits with a cue the figure or the log can show (PEOPLE §3.9).
//
// PEOPLE §3.9's starting pool of twenty (SETTING and VIEWS add to it, toward forty), each { id, text,
// nick }: id stable (saves name it), text the habit in words, and nick the nickname a squad might
// coin from it, or null (the nickname draw keys on it: PEOPLE §3.5, "a pool keyed by quirk, home,
// background or a pun on the surname"; the nicks are my calls). Every tier 1 person has one quirk,
// QUIRK_FRAC of tier 2 (half) one, and a squad's are all different (my call: thirteen people with
// one habit each read better than two who hum the same cadence). The effects PEOPLE gives some of
// them (`snores`: rack neighbours within 3 m sleep worse, BODY's rule) are read by their systems
// when they come; nothing here acts.

const q = (id, text, nick = null) => Object.freeze({ id, text, nick });

/** The quirks (PEOPLE §3.9). */
export const QUIRKS = Object.freeze([
  q('hums-cadence', 'hums cadence while cleaning', 'Cadence'),
  q('stim-gum', 'chews stim gum', 'Chewie'),
  q('first-in-line', 'always first in the chow line', 'Chow'),
  q('sleeps-with-photo', 'sleeps with a photo'),
  q('sleep-talker', 'talks in their sleep', 'Mumbles'),
  q('snores', 'snores', 'Foghorn'),
  q('rock-from-home', 'keeps a rock from home', 'Rocky'),
  q('counts-rounds', 'counts rounds aloud', 'Count'),
  q('no-mag-seven', 'will not use magazine number seven', 'Lucky'),
  q('reads-regs', 'reads the regulations for fun', 'Regs'),
  q('lichen-terrarium', 'keeps a terrarium of lichen', 'Moss'),
  q('wipes-dust', 'wipes the dust off everything', 'Dusty'),
  q('hellas-story', 'tells the same story about Hellas', 'Story'),
  q('checks-dosimeter', 'checks their dosimeter constantly', 'Geiger'),
  q('names-rifle', 'names their rifle'),
  q('belta-mutter', 'speaks Lang Belta under their breath', 'Beltalowda'),
  q('always-volunteers', 'always volunteers', 'Eager'),
  q('never-volunteers', 'never volunteers', 'Ghost'),
  q('nervous-pushups', 'does push-ups when nervous', 'Pushups'),
  q('mimics-officers', 'mimics officers, badly', 'Sir'),
]);

/** Tier 2's chance of a quirk at generation (tier 1 always has one: PEOPLE §3.9). */
export const QUIRK_FRAC = Object.freeze({ 1: 1, 2: 0.5, 3: 0 });
