# OLYMPUS

A hard science-fiction soldier's life for the browser. You are a career Martian marine: barracks, mess hall, drills and the range on Mars under 0.38 g; the shuttle to Phobos, days under thrust to Jupiter, peacekeeping under Europa's ice, ship combat and boarding seen from inside a strapped-in body, and special operations later. High-resolution pixel art, top-down at several scales, realism where it makes the game better. The solar system above you runs as in LONGHAUL (`../longhaul`); the body, the rifle and the dice play as in tradecraft (`../tradecraft`).

## Play

- **Mac:** `./play.sh` serves your play copy (a release, pinned) on http://localhost:8200 and opens it. `tools/promote.sh` moves it to the latest release (`--status` says where it stands; `tools/promote.sh v0.0.1` rolls back).
- **Windows:** `play.cmd` (Git and Python 3 needed). `play.cmd --promote` moves to the latest release, `play.cmd --status` says where you are.
- **The look gallery:** `./play.sh --gallery` (or `play.cmd --gallery`) opens the samples on :8212 to star and score; "Copy my picks" gives the text to paste back.
- Nothing to install beyond a browser and Python 3. The game is plain ES modules with three.js vendored, and runs offline.

## Where it stands

0.0.x, the foundations: the design (`docs/DESIGN.md`, the hub, and `docs/design/*.md`), the engine core (Mars sols and the timeslip, the 20 Hz tick and skips, saves with export and import), the pixel stage, the figures and the first look samples. The roadmap to 1.0 is `docs/design/ROADMAP.md`; what each release changed is `CHANGELOG.md`.

## Working on it

`CLAUDE.md` holds the method (versions, releases, the play copy, tests, ports). `npm install` once for the tests' browser driver, then `npm test` (or `npm run test:quick`).
