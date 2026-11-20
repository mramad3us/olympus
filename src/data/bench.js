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
// mode entered and aimed at your card, one magazine of 15), Digit6 (the core's shot, Fire, in layout C: the rework's R7; Digit1
// before it) tapped for 120 ms and then still for
// 1,180 ms, fifteen times: a string of fifteen at 25 m, the flash, the kick, the brass and the holes, timed
// frame by frame (its p95 held at 18 ms); no at: the scene starts you on the line. range-far (0.0.7, the build sheet
// 0.0.7 §2.4 (e), ROADMAP §4.2's 0.0.7 row): test-range's 'far' setup (the 300 m line, prone, the SO-4 at 4×, aimed at
// your face with the far window open on it, Fire alone on the panel, the relay firing a long string beside you),
// Digit6 (Fire, the core's shot in layout C) tapped for 120 ms, then T (the DI's "Wait for your mark": the wait lets time run) 1 s after it, the pull and its
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
// shoothouse (0.0.12, the build sheet 0.0.12 §5.4): test-shoothouse's 'go' setup (at GO, in stop motion) on seed 48213 as the Tier one,
// T (the DI's "Clear it": "Open, clear the room" at GO; 2026-11-12, the rework's R4: "Clear the house", Digit5 before, is
// withdrawn), then Digit1 (Pair, the first of CONTACT's five in layout C) and T (the DI's line: the next room's row at "Room clear!") in turn,
// every 2 s for 20 s: the lane's rooms 1 and 2 at the tier one's pace, the doors swinging, the stack and the #2, the shots in a hall,
// timed frame by frame (no frame over 25 ms, its p95 held at 18 ms as the others').
// Every bench plays the step panel's layout C (BENCH_PANEL; R7: its keys are C's, whatever this browser's olympus.panel says).
// v0.0.21 (the build sheet §1 item 22; the perf lens's P8 and the done lens's D11): the house beyond the tier one's walk.
// house-kit: the tier one at GO on 48213 with the full kit (loadout 'full'), T and the shot row (Digit1) in turn every 2 s, as
// shoothouse's, for BENCH_HOUSE_KIT_S 25 s: the kit's rows where T gives them, the devices drawn. house-live: the sergeant on 'live:fight,hide',
// T and the shot row every 2 s for 20 s: the role-players' frames, their masks and paint, a casualty's beat where it falls.
// house-stop: the private at GO in stop motion, 5 s held, KeyD (the brackets: a press that rebuilds the panel and moves no
// clock; on panel C a digit acts and runs it) every 1 s: the page's reads while time stands still. All on the set (draw 'set').
// v0.0.25 (the build sheet §6 D, F133): wreck, "Hold to hold"'s stack on the hold's deckhead after the transit (test-zerocqb's 'hold'
// setup) on seed 48213 as the sergeant, every board up, T (the next step of the drill) and the shot row (Digit1) in turn every 2 s for
// 20 s: the bodies upside down on the deckhead and turned boards on every face, the overhead's footprints, the face change down to
// the deck, the hold's men; judged as the others, from Windows `play.cmd --dev` and ?bench=wreck.
// v0.0.26 (the build sheet §1 C, §6 C, item 11): breach, "Bang, then go" (the house's scenario with breach 'bang,held', main.js bench()'s launch passing it) on seed 48213
// as the sergeant at GO, T (the bang's bundle, then the room's rows) and the shot row (Digit1) in turn every 2 s for 20 s: the throw,
// the burst's flash and smoke, both men in the daze and its sway, a man cowering or giving up, the paint; the band they are drawn
// from prepared behind the brief's cut, so its upload row must stay under UPLOAD_MID_KB after GO; from Windows ?bench=breach.
// v0.0.27 (the build sheet §1 D, F165's page half): collar, "Away the boarding party" stacked on cabin 2's hatch (test-collar's 'cabin2'
// setup: the passage held, cabin 1 and the bunk room cleared) on seed 48213 as the sergeant, the pirates drawn (`holdouts`), T (the hatch's
// drill, the deckhead man's fight) and the shot row (Digit1) in turn every 2 s for 20 s: the four marines on one look, the armed men
// aiming, the man on the deckhead, a man down at 0 G; from Windows ?bench=collar. F73's eased fog mask fails it as it fails the others.
// Every bench's card judges TECH §16.1 (BENCH_BUDGET): the median frame, its p95, no frame over 50 ms after the first 3 s,
// the draw calls, the view's CPU at its p95, no program linked after the warm, no upload over UPLOAD_MID_KB after GO + 1 s.

/** The step panel's layout every bench plays (groups.js; its digits are this layout's). */
export const BENCH_PANEL = 'c';

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
    keys: Object.freeze(Array.from({ length: 15 }, () => [Object.freeze(['Digit6', 120]), Object.freeze([null, 1180])]).flat()),
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
  shoothouse: Object.freeze({
    play: 'test-shoothouse', seed: 48213, hour: 10, setup: 'go', tier: 'tierone',
    keys: Object.freeze([Object.freeze(['KeyT', 120]), Object.freeze([null, 1880]),
      ...Array.from({ length: 4 }, () => [Object.freeze(['Digit1', 120]), Object.freeze([null, 1880]), Object.freeze(['KeyT', 120]), Object.freeze([null, 1880])]).flat(),
      Object.freeze(['Digit1', 120]), Object.freeze([null, 1880])]),
    warmS: 2,
  }),
  'house-kit': Object.freeze({
    play: 'test-shoothouse', seed: 48213, hour: 10, setup: 'go', tier: 'tierone', loadout: 'full', draw: 'set',
    keys: Object.freeze([Object.freeze(['KeyT', 120]), Object.freeze([null, 1880]),
      ...Array.from({ length: 5 }, () => [Object.freeze(['Digit1', 120]), Object.freeze([null, 1880]), Object.freeze(['KeyT', 120]), Object.freeze([null, 1880])]).flat(),
      Object.freeze(['Digit1', 120]), Object.freeze([null, 1880]), Object.freeze(['KeyT', 120]), Object.freeze([null, 880])]),
    warmS: 2,
  }),
  'house-live': Object.freeze({
    play: 'test-shoothouse', seed: 48213, hour: 10, setup: 'go', tier: 'sgt', opfor: 'live:fight,hide', draw: 'set',
    keys: Object.freeze([Object.freeze(['KeyT', 120]), Object.freeze([null, 1880]),
      ...Array.from({ length: 4 }, () => [Object.freeze(['Digit1', 120]), Object.freeze([null, 1880]), Object.freeze(['KeyT', 120]), Object.freeze([null, 1880])]).flat(),
      Object.freeze(['Digit1', 120]), Object.freeze([null, 1880])]),
    warmS: 2,
  }),
  'house-stop': Object.freeze({
    play: 'test-shoothouse', seed: 48213, hour: 10, setup: 'go', tier: 'private', draw: 'set',
    keys: Object.freeze(Array.from({ length: 5 }, () => [Object.freeze(['KeyD', 120]), Object.freeze([null, 880])]).flat()),
    warmS: 2,
  }),
  wreck: Object.freeze({
    play: 'test-zerocqb', seed: 48213, hour: 10, setup: 'hold', tier: 'sgt',
    keys: Object.freeze([Object.freeze(['KeyT', 120]), Object.freeze([null, 1880]),
      ...Array.from({ length: 4 }, () => [Object.freeze(['Digit1', 120]), Object.freeze([null, 1880]), Object.freeze(['KeyT', 120]), Object.freeze([null, 1880])]).flat(),
      Object.freeze(['Digit1', 120]), Object.freeze([null, 1880])]),
    warmS: 2,
  }),
  breach: Object.freeze({
    play: 'test-shoothouse', seed: 48213, hour: 10, setup: 'go', tier: 'sgt', breach: 'bang,held',
    keys: Object.freeze([Object.freeze(['KeyT', 120]), Object.freeze([null, 1880]),
      ...Array.from({ length: 4 }, () => [Object.freeze(['Digit1', 120]), Object.freeze([null, 1880]), Object.freeze(['KeyT', 120]), Object.freeze([null, 1880])]).flat(),
      Object.freeze(['Digit1', 120]), Object.freeze([null, 1880])]),
    warmS: 2,
  }),
  collar: Object.freeze({
    play: 'test-collar', seed: 48213, hour: 10, setup: 'cabin2', tier: 'sgt', holdouts: 'pirates',
    keys: Object.freeze([Object.freeze(['KeyT', 120]), Object.freeze([null, 1880]),
      ...Array.from({ length: 4 }, () => [Object.freeze(['Digit1', 120]), Object.freeze([null, 1880]), Object.freeze(['KeyT', 120]), Object.freeze([null, 1880])]).flat(),
      Object.freeze(['Digit1', 120]), Object.freeze([null, 1880])]),
    warmS: 2,
  }),
  'range-far': Object.freeze({
    play: 'test-range', seed: 48213, hour: 10, setup: 'far',
    keys: Object.freeze(Array.from({ length: 4 }, () => [Object.freeze(['Digit6', 120]), Object.freeze([null, 880]), Object.freeze(['KeyT', 120]), Object.freeze([null, 3880])]).flat()),
    warmS: 3,
  }),
});

/** The scene ?bench=1 runs. */
export const BENCH_DEFAULT = 'squadbay-night';
/** The scene's length in real seconds (BENCH_S, the keys' sum) and its settling time (BENCH_WARM_S). */
export const BENCH_S = 20, BENCH_WARM_S = 2;
/** A frame slower than this counts as a hitch on the card (CONTRACTS §7's p99 walking budget). */
export const BENCH_SLOW_MS = 25;
/** house-kit's length (s): T every 2 s through the kit's rooms. */
export const BENCH_HOUSE_KIT_S = 25;
/** The most a frame may send to the GPU after GO + 1 s (KB: a band that goes up mid-lane is painted before GO instead, VIEWS §3.10.1). */
export const UPLOAD_MID_KB = 64;
/**
 * TECH §16.1's budget as the card judges it (the done lens's D11): the median frame and its p95 (ms), the longest frame
 * after the first afterS seconds (ms), the draw calls, the view's CPU at its p95 (ms), the programs linked after the warm, the
 * largest upload after GO + uploadAfterS (KB).
 */
export const BENCH_BUDGET = Object.freeze({ medianMs: 16.7, p95Ms: 18, maxMs: 50, afterS: 3, calls: 160, viewMs: 4, links: 0, uploadKB: UPLOAD_MID_KB, uploadAfterS: 1 });
/** A frame drawn within this long of game time after a bang went off is a bang's frame (0.0.9: the bench's row; ms). */
export const BANG_FRAMES_MS = 500;
