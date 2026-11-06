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
// by to reveille's landing) timed frame by frame; its result's splash row is the splash's frames alone
// ({ frames, medianMs, p95Ms, over25 }), its p95 held at 18 ms as the bay's walk is.

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
    keys: Object.freeze([Object.freeze(['KeyR', 100]), Object.freeze([null, 9000])]),
    warmS: 2, splash: true,
  }),
});

/** The scene ?bench=1 runs. */
export const BENCH_DEFAULT = 'squadbay-night';
/** The scene's length in real seconds (BENCH_S, the keys' sum) and its settling time (BENCH_WARM_S). */
export const BENCH_S = 20, BENCH_WARM_S = 2;
/** A frame slower than this counts as a hitch on the card (CONTRACTS §7's p99 walking budget). */
export const BENCH_SLOW_MS = 25;
