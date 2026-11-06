# OLYMPUS: playtests

What Claude played before the user did (ROADMAP §2.9): a dated log, newest first, as tradecraft kept it. Each entry says what was played (bots at speed, moment tests, browser sessions with pictures), the numbers, what turned up and what was done about it, and, as they arrive, the user's scores, notes and waivers. Tradecraft's lesson stands: most bugs were found by Claude playing the real game before the user saw it, and the user "expects Claude to have played before they do" (`docs/research/tradecraft-design-3.md` §16).

Shots and drivers stay in the scratch folders named below, outside the repo; what they found is here.

---

## v0.0.4, 2026-11-06: needs and the first skip

**What was played.** Two reviews of the built round, then the fixer's replays of what they found, then the integrator's runs in the foreground.
- **The runtime review**, in headless Chrome on the GPU at 16 px/m, served on port 8237: the title's Tests menu, `test-shower` and `test-night` by the keys, and the same in a career: walking to Head A, a stall, the sinks, the fountain, a urinal and a toilet, the rack; R, R held, T, C, Space, Backspace, Esc; the late card's "do it anyway" and the score card's Copy line. 114 shots, looked at (`/private/tmp/claude-501/olympus-build/r4-review-runtime/shots/`, the drivers beside them).
- **The design review**, by physical keys in headless Chrome on port 8239 at 16 px/m, with shots looked at and headless traces for the timings: `test-shower` from the Tests menu; `test-night` at seed 48213; the dawdle after the klaxon (the head, a shower at 02:31, the late card, back to the rack); a career's evening, night and reveille (`?play=barracks&hour=21.2`); the morning routine and a toilet stall at 05:36; the career's afternoon from 12:39 to taps on R's real wait (`/private/tmp/claude-501/olympus-build/r4-review-design/`, the `sh-`, `n-`, `d-`, `c-`, `m-` and `st-` shots).
- **The fixer's replays**: each finding pinned by a test that fails without its fix (`tests/time-review.test.mjs` and the suites named in CHANGELOG), the moments replayed by their bots (`moment-shower`, `moment-night`).

**The numbers.**
- **The shower** (moment 3): the whole splash 4.25 to 4.30 s by the reviews' samplers and 4.28 to 4.30 s in the stage's and integrator's runs (in 0.37 to 0.40, lapse 2.60 to 2.62, strip 0.79 to 0.80, out 0.48 to 0.50), against TIME §6.2's 4.29; the watch stepping 19:30 to 19:40 minute by minute, "Water off." at 19:34; the strip "grime 3→0" and "wet", the body's grime 58.0 to 2.12 and wet 0.70; frames 16.7 ms median and p95, none over 25 ms, 25 draw calls, 482.5 KB uploaded in a frame at most.
- **The night** (moment 4): "sleep until reveille" 7.7 s; the light turning at taps with "Taps. Lights out." in the ticker, the slip shown as "24:00 +2", the sol turning over; the klaxon's landing on 23,532,601,000 ms exactly (02:30:00.091), the same after Space, which snaps to the klaxon and not past it; its splash 5.42 s (in 0.40, lapse 3.57, decel 0.33, beat 0.60, out 0.52), the beacon lit in all 108 frames after, frames p95 16.8 ms, none over 25 ms. Space runs the whole night out in 1.5 s. The klaxon whoops on a 3 s cycle, −14.5 dB through one wall at 9.4 m.
- **The scramble**: the urgent line 0.2 s after landing; T rises you, T dresses you; after the fixes, mustered at 02:32:40, 140 s early; the count at 02:35 ("13 of 13"); a shower taken anyway at 02:30 back at the rack at 02:43:09, late by 8.2 minutes. The squad rises after 3.3 to 19.1 s each, all in utilities by 02:32:58; watched 30 minutes through the drill, 150 changes seen, the biggest move between two ticks 0.201 m; in the page 0 figures appeared or vanished and the most any moved in a frame was 0.147 m. Woken in a lower berth, 3 of the 12 are seen getting up within 25 s.
- **The body through every gap**: R's wait stops at "bursting", and an accident inside a later wait lands as an interrupt; 0.38 G gaits (1.14 m/s walking), BODY's bladder bands (400, 550, 700, 850 mL), three minutes of water, "Breathing easy" in Melas's air. The first minute of a New career has the bladder at "need" at 12:39 and the DI saying "Your bladder has opinions. The head is across the hall.": a first objective.
- **The HUD**: the rectangles apart at 1024 × 768, 1280 × 600, 1600 × 900 and 1920 × 1080; typing in the score card's note fires none of its digits; the copied score line in the right form (reading v0.0.3 until the release stamps VERSION). The C sheet is in words, with no number anywhere.
- **The bench**: `squadbay-night` 16.7 ms median and p95 at 16 and 24 px/m, 53 draw calls, 51.1 KB uploaded a frame at most, the view's CPU 1.20 ms at the median; `splash-sleep`'s splash 16.7 ms median, 16.8 ms p95, none over 25 ms of 470, 23 draw calls, 336 KB at most (the integrator's, in the foreground at 60 Hz).

**What turned up, and what was done.**
- **Upper berths emptied at every squad call** (the runtime review, high): from the klaxon's first frame, and at reveille with the lights on, every upper sleeper was drawn in the lower berth, hidden under the upper deck, until they climbed. Now the berth drawn is the pose's own (`trans.from.spotId`), and `time-placement` fails on a berth frame off its berth.
- **R pressed while getting up started the next activity** (the runtime review, high), and the figure jumped 1.6 to 1.85 m from the berth to the rack's foot. Now no offer shows and every activity is refused while the rise plays, and the move keys no longer swing a rising player round.
- **The drill after you muster** (the design review): you stood 25 real minutes or went back to sleep and were still counted. Now the count counts only who stands at their rack at its second (an arrival gone is marked left), "stand fast" is R's offer and T's act once mustered, and the count and the stand-down are O events, so standing fast lands at each for its beat.
- **The scramble had no tension** (the design review): two T presses and a 3.9 s dressing splash with almost five minutes to spare. The count is now at 5 minutes, and dressing into utilities in a drill takes the alarm's tempo, 2.6 minutes.
- **Women got stubble** (the design review): in the words, on the doll, in the DI's lines and as a shave at the basin. A woman's body now grows none (`hasBeard`).
- **The morning routine hid the figure** (the design review): it vanished from the iris and popped back, and bundled the head and a stall at a sink. Withdrawn this round; the sink, the urinal and the stall keep their own R.
- **The shower scene's end card covered the landing** (the design review), so moment 3's "back ... and clean" was never seen. The card now waits 6 s of play, or Enter.
- **Smaller ones, fixed**: a resumed shower ended in the towel it was cut in, its water counted twice; "fit it in" gave the whole shower's effects in a fraction of its time; reveille ending "sleep until reveille" skipped its strip; the stand-down's undressing flipped outfits in sight; the vignette's pieces popped on the splash's first frame and off after its last; the stall read as a checkered shape inside the iris; the ticker's lines lingered and "Taps. Lights out." came up as a toast at 02:30; the 15-minute wait toasted twice; sleep was offered past reveille and the head at an empty bladder; the DI said "Shave" mustered at 02:35 and "The count is at 02:40" at 02:41; "T held" showed on chips that could do nothing; the bench card's p95 read 18.5 ms from its own callback's clock (now rAF's timestamps); the career's first drill, drawn over the week's seven nights, was a 1-in-7 chance on the first night (now one of the first two: seed 48213's at 02:57 on Monday night).

**What works and should not change** (the design review): the night's light, ticker and slip; the klaxon's jolt (the clock slowing to the second, the red iris, ALARM, a dark bay); the shower's pace; the late card's three answers with their times; the count's toast; the C sheet in words; the body running through every gap; the realism numbers.

**Left for the user.** Scores for `test-shower` and `test-night` (ROADMAP §2.2). The sleep balance (BODY §29, question 9: an 8.0-hour sleeper at 1.6 h of pressure on Wednesday's reveille, against BODY's 0.4 to 1.0). The Windows bench card (`play.cmd --dev`, `?bench=squadbay-night` and `?bench=splash-sleep`). Sound, which headless Chrome cannot judge.

---

## v0.0.3, 2026-11-06: a walkable barracks on a laid-out base

**What was played.** The runtime review, in headless Chrome on port 8237 at 16 px/m with the chibi figures: New career from the title, the bay at 23:00, the morning by $ and R, the bay door, the east stair up and down, the lobby, the vestibule, the street at dawn, the north fence and back to the rack; the night street, the bench card, the cards, the HUD at 1600 × 900 and 1024 × 768, reload and Continue.

**The numbers.** Frames: median 16.7 ms and p95 16.7 ms over 20,408 frames (4 over 25 ms). Draw calls: 53 at most in the bay, 82 on the ground. Cuts: 5 to 38 ms once prepared, 132 to 167 ms at launch, and no chunk first drawn in the picture. 0 people popping in 943 frames at 23:00. Walk 1.14 m/s, stroll 0.75, run 2.69. 1,005 footsteps and 4 doors, none late.

**What turned up, and was fixed before the release.**
- A new career was lost on reload before its first autosave: now saved at launch and on leaving the page.
- `DEFAULT_PPM` was still 24: now 16.
- A wrong frame at every door cut: the cut now holds the last picture.
- The inside's fog was stamped on the street after a cut: the fog moves with its cells and snaps on a new area.
- The canyon sunrise snapped in one frame: the disc now clears the wall over 87 s.
- A 15-minute wait across reveille flipped 7 squadmates out of bed in sight: poses now change only out of sight in a skip.
- R a step short of a door waited 15 minutes: R twice for the wait.
- Wall clocks were 5 px: 9 px dials.
- The player was a box on the roof behind tall buildings: a wide see-through after 0.25 s.
- The first key's 230 ms AudioContext stall: the context is made at boot.
- EXIT signs on Echo's street doors: company plates.
- An eye pressed against a wall saw through it: sight on the 0.25 m lattice.

**Left for the user.** The seen-through checkerboard (VIEWS §18, question 9), shadows by the real azimuth at dawn (question 10), lower-berth sitters showing only their heads (question 11), and the Windows bench.
