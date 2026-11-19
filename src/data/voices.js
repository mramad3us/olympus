// OLYMPUS data: the house's voices, every word it can say spelt into sounds, and how each line is said (the build sheet v0.0.20 item 7; feel.md FL-3; VIEWS §11).
//
// The shoot house speaks: the instructor on the PA, your number two, you, and on the live lane a role-player, in voices made by
// code (src/ui/audio/voice.js renders them; no recording ships, VIEWS §11.1). A word is spelt into phonemes from LEXICON, a
// hand-written pronouncing table in ARPAbet's letters (the CMU convention: AA as in "father", IY as in "see", DH as in "the"),
// a 1 after a vowel its stress where a word has more than one; a word with no entry is read from an entry by its endings
// (MORPH: "rooms" from "room", "door's" from "door", "cleared" from "clear", "clearing"), a number by core/speech.js's rule
// (numberWords: "300" is "three hundred"), a lone capital as its letter's name (LETTERS: "Lane A"), and only then, in the game
// alone, letter by letter (the voice-lexicon test fails on any such word, so the table is kept whole as A's and B's words land).
//
// PHONES gives each phoneme its sound: a vowel its first three formants (Hz; Peterson and Barney's men, 1952, the standard
// table) and its length at an easy pace (ms), a diphthong its two ends; a consonant its manner (stop, fricative, affricate,
// nasal, liquid, glide, aspirate), its voicing, its noise band (Hz and Q) and its place's formant locus. voice.js times a line
// to core/speech.js spokenMs, so the sound and the sim's wait never part.
//
// VOICES are the speakers' paths (my calls, from FL-3): the instructor on the PA at 110 Hz through the catwalk horn's band, 300 Hz
// to 3.4 kHz; your number two at 125 Hz through his helmet's speaker, 250 Hz to 5 kHz, at his place; you at 118 Hz in your own
// helmet, no band but a low shelf (the bone's conduction), OWN_VOICE_DB under his shout; a role-player at 140 Hz, bare, at his.
// REGISTER is how a line is said, shout, plain or whisper, by the TEAM_WORDS id that says it (src/sim/combat/team.js; never a
// field there, so A's and B's words need no audio work but a line here) and by the 'say' fact's kind: the stack's "Ready." is
// whispered, the calls in a room shouted, the PA plain. VOICE_SETS are the four to score (samples/voices): V-a today's stand-ins,
// V-b the words dry, V-c the words through their paths (the game's until the user scores), V-d V-c with breath and effort on
// the shouts. Every number is my call, to be scored.

/** The voice's render rate (Hz): a voice's band ends at 5 kHz, Melas's air takes the rest. */
export const VOICE_RATE_HZ = 24000;
/** The four sets to score (samples/voices, the To score page's Voice row): V-a today's, V-b dry, V-c through their paths, V-d with effort. */
export const VOICE_SETS = Object.freeze(['a', 'b', 'c', 'd']);
/** The set the game plays until the user scores one (the build sheet's ship rule: V-c only if house-voiced and voice-render pass). */
export const VOICE_DEFAULT = 'c';
/** Your own voice under your number two's shout (dB). */
export const OWN_VOICE_DB = -6;
/** The speakers' paths (see the header): pitch (Hz), band [low, high] (Hz) or null, level against a recipe's 0 dB (dB), shelf (dB under 300 Hz). */
export const VOICES = Object.freeze({
  pa: Object.freeze({ hz: 110, band: Object.freeze([300, 3400]), db: 0, shelf: 0, drive: 1.6 }),
  two: Object.freeze({ hz: 125, band: Object.freeze([250, 5000]), db: 0, shelf: 0, drive: 1.2 }),
  me: Object.freeze({ hz: 118, band: null, db: OWN_VOICE_DB, shelf: 3, drive: 1 }),
  man: Object.freeze({ hz: 140, band: null, db: 0, shelf: 0, drive: 1 }),
});
/** A line's peak (dBFS) by register before its path: a shout 3 dB over the plain, a whisper well under. */
export const REGISTER_DB = Object.freeze({ shout: -6, plain: -9, whisper: -18 });
/**
 * How a line is said (see the header): by TEAM_WORDS id, then by the 'say' fact's kind ('pa', 'speech') and the speaker's role
 * ('chief', 'man'). voice-lexicon fails on a TEAM_WORDS id with none.
 */
export const REGISTER = Object.freeze({
  reloading: 'shout', up: 'plain', covering: 'shout', gunDown: 'shout', gunUp: 'shout', coming: 'shout',
  'call:gundown': 'shout', 'call:gunup': 'shout', 'call:stoppage': 'shout', 'call:up': 'plain', 'call:covering': 'shout',
  clear: 'shout', ready: 'whisper', roomclear: 'shout', hallclear: 'shout', tell: 'whisper',
  bangout: 'shout', breaching: 'shout', placing: 'plain', open: 'shout',
  side: 'plain', bangit: 'plain', breacherup: 'plain', belay: 'plain', front: 'plain',
  // (the words A and B add this round: "Line!", "Coming out!", "Last man.", "Moving!", "Move!", the call-out)
  line: 'shout', out: 'shout', last: 'plain', moving: 'shout', move: 'shout', contact: 'shout',
  // (by the fact's kind and the speaker)
  pa: 'plain', speech: 'plain', chief: 'plain', man: 'shout',
});
/** The four sets: { words (formant words, or v0.0.19's stand-ins), paths (through the speakers' bands), effort (breath on the shouts) }. */
export const VOICE_SET = Object.freeze({
  a: Object.freeze({ words: false, paths: false, effort: false }),
  b: Object.freeze({ words: true, paths: false, effort: false }),
  c: Object.freeze({ words: true, paths: true, effort: false }),
  d: Object.freeze({ words: true, paths: true, effort: true }),
});
/** The pitch's fall over a line (×: from 1 + DECLINE / 2 to 1 − DECLINE / 2), a stressed vowel's rise, a command word's rise and its lift (dB). */
export const PROSODY = Object.freeze({ decline: 0.15, accent: 0.08, command: 0.2, commandDb: 4, shoutHz: 0.15, shoutF1: 0.1, breathDb: 3 });
/** Pauses taken from a line's word time at its punctuation (× a word's slot). */
export const PAUSE_K = Object.freeze({ ',': 0.3, ';': 0.4, ':': 0.4, '.': 0.5, '!': 0.45, '?': 0.5 });

const V = (f1, f2, f3, ms, to = null) => Object.freeze({ kind: 'vowel', f: Object.freeze([f1, f2, f3]), ms, ...(to ? { to: Object.freeze(to) } : {}) });
const C = (o) => Object.freeze(o);
/** Each phoneme's sound (see the header). Stops: closure, burst band [Hz, Q] and level, aspiration (voiceless), locus F2 (Hz). */
export const PHONES = Object.freeze({
  IY: V(270, 2290, 3010, 110), IH: V(390, 1990, 2550, 75), EH: V(530, 1840, 2480, 90), AE: V(660, 1720, 2410, 120),
  AH: V(640, 1190, 2390, 80), AX: V(500, 1450, 2450, 50), AA: V(730, 1090, 2440, 120), AO: V(570, 840, 2410, 120),
  UH: V(440, 1020, 2240, 80), UW: V(300, 870, 2240, 110), ER: V(490, 1350, 1690, 110),
  AY: V(700, 1150, 2450, 160, [300, 2200, 2900]), EY: V(500, 1850, 2480, 140, [300, 2250, 2950]), OW: V(520, 920, 2400, 140, [320, 900, 2250]),
  AW: V(700, 1150, 2450, 160, [330, 900, 2250]), OY: V(560, 850, 2400, 170, [300, 2150, 2900]),
  P: C({ kind: 'stop', voiced: false, closeMs: 55, burst: [900, 0.8], burstDb: -14, aspMs: 45, locus: 900 }),
  B: C({ kind: 'stop', voiced: true, closeMs: 45, burst: [900, 0.8], burstDb: -18, aspMs: 0, locus: 900 }),
  T: C({ kind: 'stop', voiced: false, closeMs: 50, burst: [4200, 1.2], burstDb: -8, aspMs: 45, locus: 1750 }),
  D: C({ kind: 'stop', voiced: true, closeMs: 40, burst: [3800, 1.2], burstDb: -14, aspMs: 0, locus: 1750 }),
  K: C({ kind: 'stop', voiced: false, closeMs: 55, burst: [2200, 1.6], burstDb: -9, aspMs: 50, locus: 2100 }),
  G: C({ kind: 'stop', voiced: true, closeMs: 45, burst: [2100, 1.6], burstDb: -14, aspMs: 0, locus: 2100 }),
  F: C({ kind: 'fric', voiced: false, ms: 100, band: [4500, 0.6], db: -20, locus: 1100 }),
  V: C({ kind: 'fric', voiced: true, ms: 70, band: [4000, 0.6], db: -24, locus: 1100 }),
  TH: C({ kind: 'fric', voiced: false, ms: 95, band: [5000, 0.6], db: -22, locus: 1400 }),
  DH: C({ kind: 'fric', voiced: true, ms: 50, band: [4500, 0.6], db: -26, locus: 1400 }),
  S: C({ kind: 'fric', voiced: false, ms: 110, band: [6200, 2.2], db: -8, locus: 1750 }),
  Z: C({ kind: 'fric', voiced: true, ms: 80, band: [5800, 2.2], db: -14, locus: 1750 }),
  SH: C({ kind: 'fric', voiced: false, ms: 115, band: [3000, 1.6], db: -7, locus: 1900 }),
  ZH: C({ kind: 'fric', voiced: true, ms: 80, band: [2900, 1.6], db: -13, locus: 1900 }),
  HH: C({ kind: 'asp', voiced: false, ms: 60, db: -16 }),
  CH: C({ kind: 'affr', voiced: false, closeMs: 50, ms: 90, band: [3100, 1.6], db: -7, locus: 1900 }),
  JH: C({ kind: 'affr', voiced: true, closeMs: 40, ms: 70, band: [2900, 1.6], db: -12, locus: 1900 }),
  M: C({ kind: 'nasal', f: Object.freeze([260, 1100, 2150]), ms: 70 }),
  N: C({ kind: 'nasal', f: Object.freeze([260, 1500, 2500]), ms: 65 }),
  NG: C({ kind: 'nasal', f: Object.freeze([260, 2000, 2700]), ms: 75 }),
  L: C({ kind: 'liquid', f: Object.freeze([360, 1100, 2700]), ms: 65 }),
  R: C({ kind: 'liquid', f: Object.freeze([320, 1060, 1400]), ms: 65 }),
  W: C({ kind: 'glide', f: Object.freeze([300, 650, 2150]), ms: 55 }),
  Y: C({ kind: 'glide', f: Object.freeze([270, 2100, 3000]), ms: 55 }),
});

/** A lone capital as said: its letter's name. */
export const LETTERS = Object.freeze({
  A: 'EY1', B: 'B IY1', C: 'S IY1', D: 'D IY1', E: 'IY1', F: 'EH1 F', G: 'JH IY1', H: 'EY1 CH', I: 'AY1', J: 'JH EY1', K: 'K EY1', L: 'EH1 L',
  M: 'EH1 M', N: 'EH1 N', O: 'OW1', P: 'P IY1', Q: 'K Y UW1', R: 'AA1 R', S: 'EH1 S', T: 'T IY1', U: 'Y UW1', V: 'V IY1', W: 'D AH1 B AH L Y UW', X: 'EH1 K S',
  Y: 'W AY1', Z: 'Z EH1 D',
});

// (the table, a word a line's worth: "word: PHONES"; written so a word is found by eye)
const TABLE = `
a: AX | about: AX B AW1 T | accounted: AX K AW1 N T IH D | across: AX K R AO1 S | again: AX G EH1 N | all: AO L | alone: AX L OW1 N | along: AX L AO1 NG
always: AO1 L W EY Z | an: AE N | and: AE N D | angle: AE1 NG G AX L | anywhere: EH1 N IY W EH R | are: AA R | arm: AA R M | armed: AA R M D | as: AE Z
assume: AX S UW1 M | at: AE T | away: AX W EY1 | back: B AE K | bang: B AE NG | be: B IY | before: B IH F AO1 R | behind: B IH HH AY1 N D | between: B IH T W IY1 N
blast: B L AA S T | bled: B L EH D | bleeding: B L IY1 D IH NG | blood: B L AH D | board: B AO R D | book: B UH K | booth: B UW TH | brass: B R AA S | breach: B R IY CH | breacher: B R IY1 CH ER | brief: B R IY F
burst: B ER S T | by: B AY | call: K AO L | can: K AE N | casualty: K AE1 ZH UW AX L T IY | cease: S IY S | charge: CH AA R JH | clean: K L IY N | clear: K L IH R
click: K L IH K | close: K L OW S | closed: K L OW Z D | coach: K OW CH | combat: K AA1 M B AE T | come: K AH M | commence: K AX M EH1 N S
concussion: K AX N K AH1 SH AX N | contact: K AA1 N T AE K T | cook: K UH K | corner: K AO1 R N ER | correction: K ER EH1 K SH AX N | cost: K AO S T
could: K UH D | count: K AW N T | cover: K AH1 V ER | cross: K R AO S | cut: K AH T | dead: D EH D | deck: D EH K | declaration: D EH K L ER EY1 SH AX N
deep: D IY P | did: D IH D | do: D UW | don't: D OW N T | done: D AH N | door: D AO R | doorway: D AO1 R W EY | dope: D OW P | down: D AW N | drill: D R IH L
drop: D R AA P | dry: D R AY | dummy: D AH1 M IY | earth: ER TH | else: EH L S | end: EH N D | enough: IH N AH1 F | even: IY1 V AX N | every: EH1 V R IY
everyone: EH1 V R IY W AH N | everywhere: EH1 V R IY W EH R | eye: AY | eyes: AY Z | families: F AE1 M AX L IY Z | family: F AE1 M AX L IY | far: F AA R
fast: F AA S T | faster: F AA1 S T ER | feet: F IY T | fight: F AY T | find: F AY N D | finger: F IH1 NG G ER | finish: F IH1 N IH SH | fire: F AY1 ER
first: F ER S T | five: F AY V | flash: F L AE SH | floor: F L AO R | for: F AO R | forty: F AO1 R T IY | four: F AO R | frag: F R AE G
frangible: F R AE1 N JH AX B AX L | from: F R AH M | front: F R AH N T | full: F UH L | gave: G EY V | get: G EH T | give: G IH V | go: G OW
going: G OW1 IH NG | gone: G AO N | good: G UH D | got: G AA T | grenade: G R AX N EY1 D | gun: G AH N | had: HH AE D | hall: HH AO L | hand: HH AE N D
hands: HH AE N D Z | has: HH AE Z | have: HH AE V | he: HH IY | he's: HH IY Z | head: HH EH D | held: HH EH L D | here: HH IH R | high: HH AY | him: HH IH M
hinge: HH IH N JH | his: HH IH Z | hit: HH IH T | hold: HH OW L D | hostage: HH AA1 S T IH JH | hostile: HH AA1 S T AY L | hot: HH AA T | house: HH AW S
hung: HH AH NG | hurt: HH ER T | i: AY | i'll: AY L | i'm: AY M | identify: AY D EH1 N T IH F AY | in: IH N | inner: IH1 N ER
intelligence: IH N T EH1 L IH JH AX N S | into: IH1 N T UW | is: IH Z | it: IH T | its: IH T S | jamb: JH AE M | keep: K IY P | kit: K IH T | kneel: N IY L
lane: L EY N | last: L AA S T | latch: L AE CH | leave: L IY V | left: L EH F T | leg: L EH G | let: L EH T | lever: L IY1 V ER | light: L AY T
line: L AY N | live: L AY V | load: L OW D | lock: L AA K | long: L AO NG | look: L UH K | lost: L AO S T | low: L OW | magazine: M AE G AX Z IY1 N | make: M EY K
man: M AE N | mark: M AA R K | mask: M AA S K | me: M IY | mean: M IY N | means: M IY N Z | men: M EH N | met: M EH T | metre: M IY1 T ER | mid: M IH D
minute: M IH1 N IH T | minutes: M IH1 N IH T S | miss: M IH S | move: M UW V | muzzle: M AH1 Z AX L | much: M AH CH | my: M AY | near: N IH R | never: N EH1 V ER
next: N EH K S T | no: N OW | nobody: N OW1 B AX D IY | not: N AA T | nothing: N AH1 TH IH NG | now: N AW | number: N AH1 M B ER | of: AX V | off: AO F
on: AA N | one: W AH N | only: OW1 N L IY | open: OW1 P AX N | optic: AA1 P T IH K | or: AO R | other: AH1 DH ER | out: AW T | outside: AW1 T S AY D
over: OW1 V ER | paint: P EY N T | pair: P EH R | par: P AA R | pause: P AO Z | pistol: P IH1 S T AX L | place: P L EY S | point: P OY N T | police: P AX L IY1 S
position: P AX Z IH1 SH AX N | power: P AW1 ER | practice: P R AE1 K T IH S | press: P R EH S | prone: P R OW N | pull: P UH L | put: P UH T
quick: K W IH K | quicker: K W IH1 K ER | rack: R AE K | ran: R AE N | read: R IY D | ready: R EH1 D IY | real: R IY L | reload: R IY L OW1 D | rifle: R AY1 F AX L
right: R AY T | room: R UW M | round: R AW N D | run: R AH N | safe: S EY F | same: S EY M | sat: S AE T | say: S EY | says: S EH Z | score: S K AO R
second: S EH1 K AX N D | sector: S EH1 K T ER | see: S IY | set: S EH T | shock: SH AA K | shoot: SH UW T | short: SH AO R T | shot: SH AA T | should: SH UH D
show: SH OW | side: S AY D | sight: S AY T | sit: S IH T | slow: S L OW | so: S OW | someone: S AH1 M W AH N | spin: S P IH N | stack: S T AE K
stand: S T AE N D | standby: S T AE1 N D B AY | stay: S T EY | still: S T IH L | stood: S T UH D | stop: S T AA P | stoppage: S T AA1 P IH JH
stun: S T AH N | take: T EY K | tap: T AE P | target: T AA1 R G IH T | tell: T EH L | that: DH AE T | that's: DH AE T S | the: DH AX | their: DH EH R
them: DH EH M | then: DH EH N | there: DH EH R | they: DH EY | thing: TH IH NG | think: TH IH NG K | this: DH IH S | those: DH OW Z | threat: TH R EH T
through: TH R UW | throw: TH R OW | thrown: TH R OW N | time: T AY M | timer: T AY1 M ER | to: T UW | today: T AX D EY1 | told: T OW L D | too: T UW
took: T UH K | top: T AA P | touch: T AH CH | trigger: T R IH1 G ER | two: T UW | unload: AH N L OW1 D | until: AH N T IH1 L | up: AH P | visit: V IH1 Z IH T
wait: W EY T | walk: W AO K | wall: W AO L | was: W AA Z | wash: W AA SH | watch: W AA CH | way: W EY | weapon: W EH1 P AX N | weigh: W EY | weight: W EY T
went: W EH N T | were: W ER | what: W AA T | wheel: W IY L | when: W EH N | where: W EH R | which: W IH CH | while: W AY L | who: HH UW | whole: HH OW L | will: W IH L
win: W IH N | with: W IH DH | without: W IH DH AW1 T | word: W ER D | work: W ER K | would: W UH D | wound: W UW N D | x: EH1 K S | yet: Y EH T | you: Y UW
you'd: Y UW D | you're: Y AO R | your: Y AO R | yourself: Y AO R S EH1 L F
accounted: AX K AW1 N T IH D | untouched: AH N T AH1 CH T | unlooked: AH N L UH1 K T | verdict: V ER1 D IH K T | chemlight: K EH1 M L AY T
assault: AX S AO1 L T | know: N OW | late: L EY T | own: OW N | planted: P L AE1 N T IH D | row: R OW | saw: S AO | sooner: S UW1 N ER
taken: T EY1 K AX N | wrong: R AO NG
i've: AY V | panel: P AE1 N AX L
heel: HH IY L | together: T AX G EH1 DH ER | either: IY1 DH ER | kill: K IH L | pick: P IH K
zero: Z IH1 R OW | three: TH R IY | six: S IH K S | seven: S EH1 V AX N | eight: EY T | nine: N AY N | ten: T EH N | eleven: IH L EH1 V AX N
twelve: T W EH L V | thirteen: TH ER T IY1 N | fourteen: F AO R T IY1 N | fifteen: F IH F T IY1 N | sixteen: S IH K S T IY1 N | seventeen: S EH V AX N T IY1 N
eighteen: EY T IY1 N | nineteen: N AY N T IY1 N | twenty: T W EH1 N T IY | thirty: TH ER1 T IY | fifty: F IH1 F T IY | sixty: S IH1 K S T IY
seventy: S EH1 V AX N T IY | eighty: EY1 T IY | ninety: N AY1 N T IY | hundred: HH AH1 N D R AX D | thousand: TH AW1 Z AX N D
`;
/** Every word the house can say, by its spelling in lower case (see the header): [phonemes], a 1 on a stressed vowel. */
export const LEXICON = Object.freeze(Object.fromEntries(TABLE.split(/[|\n]/).map(x => x.trim()).filter(Boolean).map(x => {
  const i = x.indexOf(':');
  return [x.slice(0, i).trim(), Object.freeze(x.slice(i + 1).trim().split(/\s+/))];
})));

/**
 * Endings read off an entry (see the header), tried in order: [ending, what is left is spelt with, the ending's sound by the
 * left's last phoneme]. The sound: 's' a plural or a possessive (S after a voiceless sound, IH Z after a hiss, else Z), 'd' a
 * past (T after a voiceless sound, IH D after T or D, else D), 'ing' IH NG, 'er' ER.
 */
export const MORPH = Object.freeze([["'s", '', 's'], ['es', '', 's'], ['s', '', 's'], ['ed', '', 'd'], ['ed', 'e', 'd'], ['d', '', 'd'], ['ing', '', 'ing'], ['ing', 'e', 'ing'],
  ['er', '', 'er'], ['ers', '', 'ers']]);
