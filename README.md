# OLYMPUS

A hard science-fiction soldier's life for the browser. You are a career Martian marine: barracks, mess hall, drills and the range on Mars under 0.38 g; the shuttle to Phobos, days under thrust to Jupiter, peacekeeping under Europa's ice, ship combat and boarding seen from inside a strapped-in body, and special operations later. High-resolution pixel art, top-down at several scales, realism where it makes the game better. The solar system above you runs as in LONGHAUL (`../longhaul`); the body, the rifle and the dice play as in tradecraft (`../tradecraft`).

## Play

- **Mac:** `./play.sh` serves your play copy (a release, pinned) on http://localhost:8200 and opens it. `tools/promote.sh` moves it to the latest release (`--status` says where it stands; `tools/promote.sh v0.0.1` rolls back).
- **Windows:** `play.cmd` (Git and Python 3 needed). `play.cmd --promote` moves to the latest release, `play.cmd --status` says where you are.
- **The look gallery:** `./play.sh --gallery` (or `play.cmd --gallery`) opens the samples on :8212 to star and score; "Copy my picks" gives the text to paste back.
- Nothing to install beyond a browser and Python 3. The game is plain ES modules with three.js vendored, and runs offline.

## Where it stands

0.0.x, the foundations: the design (`docs/DESIGN.md`, the hub, and `docs/design/*.md`), the engine core, the pixel stage, the figures and the first look samples (0.0.1), and the skeleton (0.0.2, built from `docs/build/0.0.2.md`).

What the skeleton gives you:
- **A free walk.** `?play=sandbox`, or New career, puts you in the test rooms on the pixel stage with the samples' figure. Z Q S D walk by physical key (1.14 m/s), Shift runs (2.69 m/s) and Alt strolls (0.75 m/s). Walls and furniture stop you and you slide along them, the camera follows you, and the watch opens on Monday, Sol 590 of MY 211, at 12:39 Melas time.
- **One sim, put together in `src/sim/game.js`.** Eight domains each claim their keys of the state, and a tick runs twelve fast layers, with one slow layer a game minute. The event queue holds the jobs. Ids are checked against one table.
- **Skips sliced across frames.** They land on the same bytes however they are sliced, and the slow processes are stepped over each moment of game time once, lived or skipped.
- **Saves per world (store v2).** Every record is digest-checked, a damaged save hands over to the one that stands in for it, autosaves follow TIME's triggers, and a v0.0.1 save still loads.
- **Places.** A* for three body widths (p95 690 µs in the test rooms, 393 µs on a 64 m window of ground), path requests delivered on a tick their cost fixes, and Base Melas's site plan as data. The plan is drawn closer together than PLACES wrote it, so the training sol walks in 11.82 real minutes at 1.14 m/s.
- **The stage in the game.** Areas and figures are painted in a worker, uploads are held to 1 MB and 2 ms a frame, the shaders are warmed behind the title, and the sandbox draws in 5 to 6 calls.

The roadmap to 1.0 is `docs/design/ROADMAP.md`; what each release changed is `CHANGELOG.md`.

## Working on it

`CLAUDE.md` holds the method (versions, releases, the play copy, tests, ports). `npm install` once for the tests' browser driver, then `npm test` (or `npm run test:quick`).
