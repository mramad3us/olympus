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
// Durations at Melas (TIME §8.2 to §8.4): the shower 1 + WATER_MIN 3 + 6 = 10 minutes; the head 75 s;
// a stall 6 min; the basin teeth 2 + a shave 4 where stubble shows + face 1; dressing DRESS_MIN
// (PT kit 2 min, utilities 4, a towel 0) to put on and UNDRESS_K 0.6 of it to take off; sleep to
// reveille or a chosen time, 20 minutes to 12 hours; a nap 20, 45 or 90 minutes; R's wait 15
// minutes, TIME §7.3's stand-by; standing fast at your rack's foot until a drill's stand-down (the
// stand-by of a drill: the wait's, its length the drill's, its mask 'D A O B' so the count and the
// stand-down, O events, land it); a drink or a snack bar 30 s, lived. In an open drill, dressing into
// utilities takes TIME §8.2's emergency tempo, DRESS_HURRY_K 0.5 of the normal (the alarm says "now":
// PT kit to utilities 2.6 min, so it is a brief splash, the watch running, and the squad dresses as
// fast). My calls: the drink and the snack bar at the machines and the taps (the sheet §8, item 15);
// urinating TIME §8.2's flat 75 s (item 21); the hurried dress (the review of v0.0.4: the scramble had
// no tension). The morning routine that bundled the head and a stall into the basin is gone this round
// (the review of v0.0.4: urinating at a sink, and the figure hidden in place at the basin for the
// stall's six minutes): the urinal and the stall keep their own R.
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
/** A basin's parts, minutes (TIME §8.2). */
export const BASIN_MIN = deepFreeze({ teeth: 2, shave: 4, face: 1 });
/** Stubble shows (so the basin shaves) from this many hours (BODY §6's STUBBLE_SHOWS_H, BODY's own number). */
export const STUBBLE_SHOWS_H = HYGIENE.STUBBLE_SHOWS_H;
/** A drink from a tap or a machine, litres; a snack bar, kcal (BODY §4.1, §3.5). */
export const DRINK_L = 0.5, SNACK_KCAL = 250;

const still = (part, ms, met, posture = 'stand', more = {}) => ({ part, ms, met, kind: 'still', posture, ...more });

/** The activities this round, by id (see the header). */
export const ACTIVITIES = deepFreeze({
  urinate: {
    id: 'urinate', class: 'toilet', uses: ['urinate', 'toilet'], offer: 'the head', mask: 'D A O* S(k)',
    parts: [still('go', 75_000, 1.8)], resumable: false, stoppable: true, chunkMs: 0, vignette: 'head', min: 0,
    log: ['The head. A minute and change.', 'A minute at the urinal, the water-saver blinking.', 'The head: {dur}, hands washed.', 'Relief, and the recycler took it: {dur}.'],
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
  basin: {
    id: 'basin', class: 'hygiene', uses: ['wash'], offer: 'the basin', mask: 'D A O* S(k)',
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
    parts: [still('turn-in', 'dress', 2.0, 'stand', { optional: 'turn-in' }), still('lie', 'until', 1.0, 'lie', { lie: true })],
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
  idle: {
    id: 'idle', class: 'day', uses: [], offer: 'idle', mask: 'D A',
    parts: [still('idle', 'asked', 1.5)], resumable: false, stoppable: true, chunkMs: 0, vignette: null, min: 0,
    log: ['{dur} went by.', '{dur} passed.', 'The clock moved {dur}.', '{dur} later.'],
  },
});

/** The activity ids, in the table's order. */
export const ACTIVITY_IDS = Object.freeze(Object.keys(ACTIVITIES));
