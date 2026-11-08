// OLYMPUS data: the bench's scenes, one definition the page's bench card and the stage's test both read.
//
// A bench scene (ROADMAP §4.6, TECH §13.4) is a new game at a fixed seed and hour, the player placed
// at an authored spot, then a script of keys held for set times: the card (src/ui/cards/bench.js) runs
// it in the user's own browser on the Mac and on Windows, with no saves, and the stage's render-bench
// test drives the same keys in headless Chrome, so the two numbers are of one scene (build sheet
// 0.0.3 §8, item 22). keys is a list of [code, ms]: the physical key held (KeyboardEvent.code, so
// KeyD walks east on any layout: AZERTY's D) for ms of real time, or null for ms of standing still.
// warmS is the time the page settles before any frame is counted (the area built, the uploads done,
// the fog eased), and the scene's length is the keys' sum. squadbay-night (0.0.3): the squad bay at
// 23:00, the aisle walked east, west and back, then still (TECH §13.4's 0.1 scene, brought forward so
// the user can judge Windows; the other scenes come with 0.1). splash-sleep (0.0.4, the build sheet
// §2.3 (e)): R at your rack's foot at 21:57, the night's full splash (the zoom, the iris, the night going
// by to reveille's landing) timed frame by frame (0.0.6: you sleep in what you wear, so R in utilities lies
// you down in sight first, about 4.8 s, before the splash: its wait 9 s to 14 s, the build sheet 0.0.6 §8
// item 6, so it still times the whole night's splash); its result's splash row is the splash's frames alone
// ({ frames, medianMs, p95Ms, over25 }), its p95 held at 18 ms as the bay's walk is. range-line (0.0.5, the
// build sheet 0.0.5 §2.3 (g)): test-handling's 'bench' setup (prone on the 25 m line, the line hot, the
// mode entered and aimed at your card, one magazine of 15), Digit1 tapped for 120 ms and then still for
// 1,180 ms, fifteen times: a string of fifteen at 25 m, the flash, the kick, the brass and the holes, timed
// frame by frame (its p95 held at 18 ms); no at: the scene starts you on the line. range-far (0.0.7, the build sheet
// 0.0.7 §2.4 (e), ROADMAP §4.2's 0.0.7 row): test-range's 'far' setup (the 300 m line, prone, the SO-4 at 4×, aimed at
// your face with the far window open on it, Fire alone on the panel, the relay firing a long string beside you),
// Digit1 tapped for 120 ms, then T (the DI's "Wait for your mark": the wait lets time run) 1 s after it, the pull and its
// recovery done, then still,
// four times in 20 s: four shots at 300 m, the pits marking in the window while the relay fires and waits for its own
// marks round you, the game running the whole bench rather than for the five taps alone (the integrator's of v0.0.7:
// the far setup is stop motion, so five taps of Fire ran about 2 s of the line), timed frame by frame (its p95 held at 18 ms).
// pairs-bangs (0.0.9, the build sheet 0.0.9 §2.3, §8 item 25; ROADMAP's bang-room, here on the bay): test-pairs' 'bangs:standby'
// on seed 48213 as the Boot recruit, 20 s still: the coach's three bangs behind you, their flashes and smoke, the startle's
// dark and FROZE, the picture closing at its edges, the turn and the pause; its frames within BANG_FRAMES_MS of a bang a row
// of their own (cards/bench.js bangOf), no frame there over 25 ms.
// stress-din (0.0.10, the build sheet 0.0.10 §2.3, §8 item 22): test-stress's 'standby:1' (the din's standby, armed, out of the mode) on
// seed 48213 as the Boot recruit, 20 s still: the coach's air horn and his thirty blanks at your shoulder, their flashes, the turn
// and the pause; its frames within BANG_FRAMES_MS of a blank are the bench's "at a bang" row (main.js), no frame there over 25 ms.

/** The bench scenes by name (the build sheet's §2.4). */
export const BENCH_SCENES = Object.freeze({
  'squadbay-night': Object.freeze({
    play: 'barracks', seed: 48213, hour: 23,
    at: Object.freeze({ area: 'melas.echo.1', x: 54.8, z: 3.95, face: 'right' }),
    keys: Object.freeze([Object.freeze(['KeyD', 4000]), Object.freeze(['KeyA', 8000]), Object.freeze(['KeyD', 4000]), Object.freeze([null, 4000])]),
    warmS: 2,
  }),
  'splash-sleep': Object.freeze({
    play: 'barracks', seed: 48213, hour: 21.95,
    at: Object.freeze({ area: 'melas.echo.1', x: 52.075, z: 3.3, face: 'up' }),
    keys: Object.freeze([Object.freeze(['KeyR', 100]), Object.freeze([null, 14000])]),
    warmS: 2, splash: true,
  }),
  'range-line': Object.freeze({
    play: 'test-handling', seed: 48213, hour: 9, setup: 'bench',
    keys: Object.freeze(Array.from({ length: 15 }, () => [Object.freeze(['Digit1', 120]), Object.freeze([null, 1180])]).flat()),
    warmS: 2,
  }),
  'pairs-bangs': Object.freeze({
    play: 'test-pairs', seed: 48213, hour: 11, setup: 'bangs:standby', tier: 'recruit',
    keys: Object.freeze([Object.freeze([null, 20000])]),
    warmS: 2,
  }),
  'stress-din': Object.freeze({
    play: 'test-stress', seed: 48213, hour: 11, setup: 'standby:1', tier: 'recruit',
    keys: Object.freeze([Object.freeze([null, 20000])]),
    warmS: 2,
  }),
  'range-far': Object.freeze({
    play: 'test-range', seed: 48213, hour: 10, setup: 'far',
    keys: Object.freeze(Array.from({ length: 4 }, () => [Object.freeze(['Digit1', 120]), Object.freeze([null, 880]), Object.freeze(['KeyT', 120]), Object.freeze([null, 3880])]).flat()),
    warmS: 3,
  }),
});

/** The scene ?bench=1 runs. */
export const BENCH_DEFAULT = 'squadbay-night';
/** The scene's length in real seconds (BENCH_S, the keys' sum) and its settling time (BENCH_WARM_S). */
export const BENCH_S = 20, BENCH_WARM_S = 2;
/** A frame slower than this counts as a hitch on the card (CONTRACTS §7's p99 walking budget). */
export const BENCH_SLOW_MS = 25;
/** A frame drawn within this long of game time after a bang went off is a bang's frame (0.0.9: the bench's row; ms). */
export const BANG_FRAMES_MS = 500;
