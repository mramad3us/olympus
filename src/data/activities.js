// OLYMPUS data: the activities, what an appliance or a place lets the player spend time on, as data (TIME §8; the build sheet 0.0.4 §2.2.1).
//
// A record is TIME §8.1's, with its rules (functions, which a data module may not hold: TECH §2.4)
// in src/sim/time/activities.js under the same id:
//   { id, class, uses, offer, mask, parts, resumable, stoppable, chunkMs, vignette, min, log }
//   class      TIME §7.3's activity class (the mask's default, CLASS_MASKS)
//   uses       the fixture uses it is done at (PLACES's catalogue: a spot's use)
//   offer      the word R's offer opens with ('shower · 10 min, done 19:41')
//   mask       what may interrupt it (TIME §7.2's notation)
//   parts      in order, each { part, ms, met, kind, posture, inside?, wet?, outfit?, line?, lie? }: ms a
//              length or the name of the rule that gives it ('water', 'dress', 'until'); met the
//              metabolic rate at 1 G (BODY §3.2: the body scales it by g and load), kind its motion
//              ('still'), posture the body's ('stand', 'sit', 'lie'), inside whether the figure is in
//              its stall, wet whether the water runs on you, outfit what you wear in it ('towel'), line
//              what the ticker says at its end, lie whether you lie in it with intent to sleep
//   resumable  a cut one may be finished later ("finish your shower · 7 min", TIME §7.5)
//   stoppable  Backspace may stop its splash (TIME §6.4)
//   chunkMs    a repeatable one offers "carry on" in chunks this long (R's wait)
//   vignette   what the stage draws behind the iris (VIEWS §5.2)
//   min        the shortest it may be fitted to (the late card's "fit it in")
//   log        at least four lines in TIME §8.8's voice, picked by hash at its end
//   legacy     (a record, or a part) kept only so a save made in it finishes: never offered nor planned
// Durations at Melas (TIME §8.2 to §8.4): the shower 1 + WATER_MIN 3 + 6 = 10 minutes; the head 75 s;
// a stall 6 min; at a sink, each a single action (the user, 2026-11-06: "not pre-combined actions like
// you do now that make lists hard to read"): wash hands 30 s (WASH_HANDS_MS, my call: the CDC's five
// steps round a 20 s scrub), brush teeth 2 min, shave 4 min, buzz your head CLIP_MIN 10 min (a shaved
// head only; my call: a guardless pass by feel), wash face 1 min, a drink 30 s; dressing DRESS_MIN
// (PT kit 2 min, utilities 4, a towel 0) to put on and UNDRESS_K 0.6 of it to take off; sleep to
// reveille or a chosen time, 20 minutes to 12 hours; a nap 20, 45 or 90 minutes; R's wait 15
// minutes, TIME §7.3's stand-by; standing fast at your rack's foot until a drill's stand-down (the
// stand-by of a drill: the wait's, its length the drill's, its mask 'D A O B' so the count and the
// stand-down, O events, land it); a drink or a snack bar 30 s, lived; a haircut at the barber's pole
// HAIRCUT_MIN 12 min, seated in the chair inside the PX (my call: the chair, no queue this round). In
// an open drill, dressing into utilities takes TIME §8.2's emergency tempo, DRESS_HURRY_K 0.5 of the
// normal (the alarm says "now": PT kit to utilities 2.6 min, so it is a brief splash, the watch
// running, and the squad dresses as fast). My calls: the drink and the snack bar at the machines and
// the taps (the sheet §8, item 15); urinating TIME §8.2's flat 75 s (item 21); the hurried dress (the
// review of v0.0.4: the scramble had no tension).
// The 0.0.6 round (the build sheet 0.0.6 §2.1): v0.0.4's `basin` bundle (teeth, a shave where stubble
// showed, the face) is split into its single actions, and the sleep's turn-in (into PT kit first) is
// gone: you sleep in what you wear, and changing is `dress`. Both stay in the table marked legacy
// (the record `basin`, the sleep's part `turn-in`): never offered nor planned, so a v0.0.5 save made
// mid-basin or mid-turn-in finishes as it would have. The head no longer washes your hands (the user,
// 2026-11-06: "using the head shouldn't wash our hands either afterwards"): the basin does.
// ROWS gives each kind of spot its single actions in the order one does them in (the menu's order,
// and a chain's: the build sheet §8 item 11); PRIORITY gives R's quick action at a spot as the first
// [id, test] whose test holds (the tests are coded in src/sim/places/hand.js: 'hands' dirty hands,
// 'thirst' thirsty, 'stubble' stubble shows, 'haircut' a shaved head due, 'bowel', 'bladder', and the
// rack's 'drill', 'night', 'day'), else the first row not struck (the user, 2026-11-06: "R should wash
// hands if hygiene is low enough, drink if we're thristy and shave if none of the above (use a
// priority thing and R is the most urgent)"). The barber keeps BARBER_H, 10:00 to 20:00 (PLACES §4.13's
// PX hours).
import { HYGIENE } from './body/needs.js';

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The shower's water minutes by site (TIME §8.2: Melas 3, a ship 2, Europa 1.5; PLACES may change them). */
export const WATER_MIN = deepFreeze({ melas: 3, ship: 2, europa: 1.5 });
/** Minutes to put an outfit on (TIME §8.2). */
export const DRESS_MIN = deepFreeze({ pt: 2, utilities: 4, towel: 0 });
/** Taking an outfit off costs this share of putting it on (TIME §8.2). */
export const UNDRESS_K = 0.6;
/** Dressing into utilities in an open drill: TIME §8.2's emergency tempo, this share of the normal (my call). */
export const DRESS_HURRY_K = 0.5;
/** Sleep's bounds (BODY's 12 h; TIME §8.4's 20 minutes), ms. */
export const SLEEP_MAX_MS = 43_200_000, SLEEP_MIN_MS = 1_200_000;
/** A nap's lengths, minutes (TIME §8.4). */
export const NAP_MIN = Object.freeze([20, 45, 90]);
/** R's wait and its chunk, ms (TIME §7.3's stand-by, chunked: the sheet §8, item 16). */
export const WAIT_MS = 900_000;
/** A basin's parts, minutes (TIME §8.2), each now a single action. */
export const BASIN_MIN = deepFreeze({ teeth: 2, shave: 4, face: 1 });
/** Washing your hands, ms (my call: the CDC's five steps round a 20 s scrub). */
export const WASH_HANDS_MS = 30_000;
/** Buzzing a shaved head at a sink, minutes (my call: a guardless pass by feel); a haircut in the barber's chair, minutes (my call: the chair, no queue). */
export const CLIP_MIN = 10, HAIRCUT_MIN = 12;
/** The barber's hours, Melas time (PLACES §4.13's PX, 10:00 to 20:00). */
export const BARBER_H = Object.freeze([10, 20]);
/** Out of the head or a stall, the DI sends you to the basins for this long, ms (the build sheet 0.0.6 §2.1). */
export const HANDS_NAG_MS = 120_000;
/** Stubble shows (so the basin shaves) from this many hours (BODY §6's STUBBLE_SHOWS_H, BODY's own number). */
export const STUBBLE_SHOWS_H = HYGIENE.STUBBLE_SHOWS_H;
/** A drink from a tap or a machine, litres; a snack bar, kcal (BODY §4.1, §3.5). */
export const DRINK_L = 0.5, SNACK_KCAL = 250;

const still = (part, ms, met, posture = 'stand', more = {}) => ({ part, ms, met, kind: 'still', posture, ...more });

/** The activities this round, by id (see the header). */
export const ACTIVITIES = deepFreeze({
  urinate: {
    // (a verb on R's plate, "use the head", a noun where the log names it; the fixer's, 0.0.6: "R THE HEAD" read as a noun)
    id: 'urinate', class: 'toilet', uses: ['urinate', 'toilet'], offer: 'use the head', noun: 'the head', mask: 'D A O* S(k)',
    parts: [still('go', 75_000, 1.8)], resumable: false, stoppable: true, chunkMs: 0, vignette: 'head', min: 0,
    log: ['The head. A minute and change.', 'A minute at the urinal, the water-saver blinking.', 'The head: {dur}. The basins are by the door.', 'Relief, and the recycler took it: {dur}.'],
  },
  bowel: {
    id: 'bowel', class: 'toilet', uses: ['toilet'], offer: 'a stall', mask: 'D A O* S(k)',
    parts: [still('sit', 360_000, 1.5, 'sit', { inside: true })], resumable: false, stoppable: true, chunkMs: 0, vignette: 'stall', min: 0,
    log: ['A stall and the recycler\'s hum: {dur}.', 'Six minutes behind a steel door, boots showing.', 'The stall, the hum, the graffiti about the Gunny: {dur}.', 'Business done: {dur}, and the recycler none the wiser.'],
  },
  shower: {
    id: 'shower', class: 'hygiene', uses: ['shower'], offer: 'shower', mask: 'D A O* B−hygiene S(k)',
    parts: [
      still('in', 60_000, 1.8, 'stand', { inside: true, outfit: 'towel' }),
      still('water', 'water', 2.0, 'stand', { inside: true, wet: true, outfit: 'towel', line: 'Water off.' }),
      still('dress', 360_000, 2.0, 'stand', { inside: true, outfit: 'towel' }),
    ],
    resumable: true, stoppable: true, chunkMs: 0, vignette: 'shower', min: 0,
    log: ['Three minutes of water and the dust off your neck: {dur}, dressed.', 'Hot for three minutes, then the timer: {dur}, dry and dressed.', 'The red dust went down the drain: {dur}, boots back on.', 'A Melas shower, every second of the water counted: {dur}.', 'Steam, the timer light, red water at your feet: {dur}.'],
  },
  'wash-hands': {
    id: 'wash-hands', class: 'hygiene', uses: ['wash'], offer: 'wash hands', mask: 'D A O* S(k)',
    parts: [still('hands', WASH_HANDS_MS, 1.8)], resumable: false, stoppable: true, chunkMs: 0, vignette: 'sink', min: 0,
    log: ['Soap, a scrub, a rinse: {dur}.', 'Hands washed, the way the poster by the mirror says: {dur}.', 'Soap to the wrists and the nails: {dur}.', 'Clean hands, and the recycler took the rest: {dur}.'],
  },
  teeth: {
    id: 'teeth', class: 'hygiene', uses: ['wash'], offer: 'brush teeth', mask: 'D A O* S(k)',
    parts: [still('teeth', BASIN_MIN.teeth * 60_000, 1.8)], resumable: false, stoppable: true, chunkMs: 0, vignette: 'sink', min: 0,
    log: ['Two minutes of brushing: {dur}.', 'Teeth brushed, the foam spat into the recycler: {dur}.', 'Brushed and rinsed: {dur}.', 'The mirror, the brush, the count to two minutes: {dur}.'],
  },
  shave: {
    id: 'shave', class: 'hygiene', uses: ['wash'], offer: 'shave', mask: 'D A O* S(k)',
    parts: [still('shave', BASIN_MIN.shave * 60_000, 1.8)], resumable: false, stoppable: true, chunkMs: 0, vignette: 'sink', min: 0,
    log: ['The mirror, the foam, the razor: {dur}.', 'Shaved, and no blood this time: {dur}.', 'Foam, razor, cold water: {dur}.', 'A clean scrape: {dur}. An inspection would find nothing.'],
  },
  clip: {
    id: 'clip', class: 'hygiene', uses: ['wash'], offer: 'buzz your head', mask: 'D A O* S(k)',
    parts: [still('clip', CLIP_MIN * 60_000, 1.8)], resumable: false, stoppable: true, chunkMs: 0, vignette: 'sink', min: 0,
    log: ['The clippers over the scalp, back to front: {dur}.', 'Buzzed to the skin by feel: {dur}.', 'A guardless pass and the sink rinsed after: {dur}.', 'Head buzzed, the hair brushed off your neck: {dur}.'],
  },
  'wash-face': {
    id: 'wash-face', class: 'hygiene', uses: ['wash'], offer: 'wash face', mask: 'D A O* S(k)',
    parts: [still('face', BASIN_MIN.face * 60_000, 1.8)], resumable: false, stoppable: true, chunkMs: 0, vignette: 'sink', min: 0,
    log: ['Cold water on the face and the day looks possible: {dur}.', 'Two handfuls of cold water: {dur}.', 'The dust off your face: {dur}.', 'Face washed, eyes open: {dur}.'],
  },
  basin: {
    id: 'basin', class: 'hygiene', uses: ['wash'], offer: 'the basin', mask: 'D A O* S(k)', legacy: true,
    parts: [still('teeth', 120_000, 1.8), still('shave', 240_000, 1.8, 'stand', { optional: 'stubble' }), still('face', 60_000, 1.8)],
    resumable: false, stoppable: true, chunkMs: 0, vignette: 'sink', min: 0,
    log: ['Teeth, a shave, cold water: {dur}.', 'The mirror, the foam, the razor: {dur}.', 'Brushed, scraped and rinsed: {dur}.', 'Cold water on the face and the day looks possible: {dur}.'],
  },
  dress: {
    id: 'dress', class: 'kit', uses: ['dress', 'sleep'], offer: 'dress', mask: 'D A O B S',
    parts: [still('dress', 'dress', 2.0)], resumable: false, stoppable: true, chunkMs: 0, vignette: 'locker', min: 0,
    log: ['{outfit} on, boots laced: {dur}.', 'Changed: {outfit}, {dur}.', 'Into {outfit} in {dur}, the locker shut.', 'Dressed, {outfit}, {dur}. Every button where it should be.'],
  },
  sleep: {
    id: 'sleep', class: 'sleep', uses: ['sleep'], offer: 'sleep', mask: 'D A O B S(w)',
    parts: [still('turn-in', 'dress', 2.0, 'stand', { optional: 'turn-in', legacy: true }), still('lie', 'until', 1.0, 'lie', { lie: true })],
    resumable: false, stoppable: true, chunkMs: 0, vignette: 'rack', min: SLEEP_MIN_MS,
    log: ['Rack at {from}. Up at {to}{slip}: {dur}.', 'Lights out at {from}, eyes open at {to}{slip}: {dur}.', 'The rack from {from} to {to}{slip}. {dur} of it.', 'Down at {from}, up at {to}{slip}: {dur} under the blanket.'],
  },
  nap: {
    id: 'nap', class: 'sleep', uses: ['sleep'], offer: 'nap', mask: 'D A O B S(w)',
    parts: [still('lie', 'nap', 1.0, 'lie', { lie: true })], resumable: false, stoppable: true, chunkMs: 0, vignette: 'rack', min: 0,
    log: ['{dur} with your boots on.', 'A nap: {dur} on top of the blanket.', '{dur} of the rack in daylight.', 'Eyes shut for {dur}. Nobody noticed. Probably.'],
  },
  drink: {
    id: 'drink', class: 'eating', uses: ['wash', 'drink', 'buy'], offer: 'drink', mask: '',
    parts: [still('drink', 30_000, 1.5)], resumable: false, stoppable: true, chunkMs: 0, vignette: null, min: 0,
    log: ['Half a litre, cold.', 'Water from the tap, half a litre of it.', 'A drink. The recycler\'s water tastes of nothing, which is the point.', 'Half a litre down.'],
  },
  snack: {
    id: 'snack', class: 'eating', uses: ['buy'], offer: 'a bar', mask: '',
    parts: [still('eat', 30_000, 1.5)], resumable: false, stoppable: true, chunkMs: 0, vignette: null, min: 0,
    log: ['A ration bar from the machine: 250 kilocalories of something.', 'A bar, eaten standing.', 'The machine\'s bar. Chocolate, it says.', 'A bar. It will hold you till chow.'],
  },
  haircut: {
    id: 'haircut', class: 'hygiene', uses: ['haircut'], offer: 'haircut', mask: 'D A O* S(k)',
    parts: [still('cut', HAIRCUT_MIN * 60_000, 1.3, 'sit', { inside: true })], resumable: false, stoppable: true, chunkMs: 0, vignette: null, min: 0,
    log: ['The chair, the clippers and the barber\'s opinions: {dur}.', 'Twelve minutes in the chair, the cape shaken out after: {dur}.', 'Cut to regulation, the neck shaved clean: {dur}.', 'Fresh from the barber: {dur}.'],
  },
  wait: {
    id: 'wait', class: 'rest', uses: [], offer: 'wait', mask: 'D A O B S',
    parts: [still('wait', WAIT_MS, 1.5)], resumable: false, stoppable: true, chunkMs: WAIT_MS, vignette: 'standby', min: 0,
    log: ['Hurry up and wait: {dur}.', '{dur} of standing by.', 'Nothing happened for {dur}. The Corps calls that standing by.', '{dur} of waiting, which is half the job.'],
  },
  standfast: {
    id: 'standfast', class: 'rest', uses: [], offer: 'stand fast', mask: 'D A O B',
    parts: [still('wait', 'standdown', 1.5)], resumable: false, stoppable: true, chunkMs: 0, vignette: 'standby', min: 0,
    log: ['Stood fast at the foot of your rack: {dur}.', '{dur} at the foot of your rack, eyes front.', 'Standing by your rack for {dur}, as ordered.', '{dur} of standing fast. Nobody moved.'],
  },
  // (0.0.7, the KD range's (the build sheet 0.0.7 §2.3): each started by test-range's scene, never offered by R; their
  // lengths asked by the scene (args.ms), their ends src/sim/scenarios/range.js kdPartEnd's: the walk lands the relay at
  // the next line with its issue; the pits run relay 2's confirm and the walk to the 200 m line; the brass is picked up
  // kneeling at the point, behind the brief splash over LIVE_MAX_MS 10 s; the casualty taken off to the aid station, its outcome in the strip)
  'kd-walk': {
    id: 'kd-walk', class: 'day', uses: [], offer: 'to the next line', noun: 'the walk to the line', mask: 'D A',
    parts: [still('kd-walk', 'asked', 2.5, 'stand', { line: 'Relay one at the line.' })], resumable: false, stoppable: false, chunkMs: 0, vignette: null, min: 0,
    log: ['Down the range to the next line: {dur}.', 'Relay one walked the lanes to the line, rifles slung: {dur}.', '{dur} of regolith underfoot to the next line.', 'The walk downrange, the faces growing: {dur}.'],
  },
  'kd-pits': {
    id: 'kd-pits', class: 'day', uses: [], offer: 'the pits', noun: 'the pits', mask: 'D A',
    parts: [still('kd-pits', 'asked', 1.8, 'stand', { line: 'Relay two fired their confirm; you pulled their targets.' })], resumable: false, stoppable: false, chunkMs: 0, vignette: null, min: 0,
    log: ['Pulling butts for relay two: {dur} of faces up, faces down.', 'The pits: the carriers, the spotters, the paste pot, {dur}.', '{dur} in the pits under the cracks going over.', 'Relay two\'s confirm marked from the pits: {dur}.'],
  },
  'police-brass': {
    id: 'police-brass', class: 'day', uses: [], offer: 'police your brass', noun: 'your brass', mask: 'D A O',
    parts: [still('police', 'asked', 2.0, 'stand')], resumable: false, stoppable: false, chunkMs: 0, vignette: null, min: 0,
    log: ['Your brass picked up off the regolith: {dur}.', 'On your knees for your cases: {dur}.', 'Every case found and pocketed: {dur}.', 'Brass policed: {dur}.'],
  },
  'kd-casualty': {
    id: 'kd-casualty', class: 'day', uses: [], offer: 'the casualty', noun: 'the casualty', mask: 'D A',
    parts: [still('kd-casualty', 'asked', 1.5, 'stand', { line: 'The ambulance came for the casualty.' })], resumable: false, stoppable: false, chunkMs: 0, vignette: null, min: 0,
    log: ['The range held while the casualty went to the aid station: {dur}.', '{dur} on safe while the corpsman and the ambulance did their work.', 'Cease fire for {dur}: a casualty off the range.', 'The range closed behind the ambulance: {dur}.'],
  },
  idle: {
    id: 'idle', class: 'day', uses: [], offer: 'idle', mask: 'D A',
    parts: [still('idle', 'asked', 1.5)], resumable: false, stoppable: true, chunkMs: 0, vignette: null, min: 0,
    log: ['{dur} went by.', '{dur} passed.', 'The clock moved {dur}.', '{dur} later.'],
  },
});

/** The activity ids, in the table's order. */
export const ACTIVITY_IDS = Object.freeze(Object.keys(ACTIVITIES));

/**
 * A spot's single actions by its use, in the order one does them in: the menu's rows and a chain's
 * steps (the build sheet 0.0.6 §2.1, §8 item 11). 'drill' is your rack's foot while a drill is open;
 * a machine ('buy') offers the one its make sells. hand.js filters them by who you are (no shave for a
 * face that grows no beard, the clippers only for a shaved head). At your rack dressing comes first,
 * since one dresses and then sleeps (the sheet's §8 item 6: "the menu chains dress then sleep"; its §2.1
 * table listed sleep, nap, dress, which as a chain's order would sleep first: my call, the rule over the
 * table).
 */
export const ROWS = deepFreeze({
  wash: ['wash-hands', 'teeth', 'shave', 'clip', 'wash-face', 'drink'],
  shower: ['shower'],
  urinate: ['urinate'],
  toilet: ['bowel', 'urinate'],
  sleep: ['dress', 'sleep', 'nap'],
  drill: ['dress', 'standfast', 'sleep', 'nap'],
  dress: ['dress'],
  drink: ['drink'],
  buy: ['snack', 'drink'],
  haircut: ['haircut'],
});
/** R's quick action at a spot: the first [id, test] whose test holds and whose row is not struck (the tests: src/sim/places/hand.js). */
export const PRIORITY = deepFreeze({
  wash: [['wash-hands', 'hands'], ['drink', 'thirst'], ['shave', 'stubble'], ['clip', 'haircut']],
  toilet: [['bowel', 'bowel'], ['urinate', 'bladder']],
  urinate: [['urinate', 'bladder']],
  sleep: [['dress', 'drill'], ['standfast', 'drill'], ['sleep', 'night'], ['nap', 'day']],
  drill: [['dress', 'drill'], ['standfast', 'drill'], ['sleep', 'night'], ['nap', 'day']],
});
