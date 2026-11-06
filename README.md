# OLYMPUS

A hard science-fiction soldier's life for the browser. You are a career Martian marine: barracks, mess hall, drills and the range on Mars under 0.38 g; the shuttle to Phobos, days under thrust to Jupiter, peacekeeping under Europa's ice, ship combat and boarding seen from inside a strapped-in body, and special operations later. High-resolution pixel art, top-down at several scales, realism where it makes the game better. The solar system above you runs as in LONGHAUL (`../longhaul`); the body, the rifle and the dice play as in tradecraft (`../tradecraft`).

## Play

- **Mac:** `./play.sh` serves your play copy (a release, pinned) on http://localhost:8200 and opens it. `tools/promote.sh` moves it to the latest release (`--status` says where it stands; `tools/promote.sh v0.0.1` rolls back).
- **Windows:** `play.cmd` (Git and Python 3 needed). `play.cmd --promote` moves to the latest release, `play.cmd --status` says where you are.
- **The look gallery:** `./play.sh --gallery` (or `play.cmd --gallery`) opens the samples on :8212 to star and score; "Copy my picks" gives the text to paste back.
- Nothing to install beyond a browser and Python 3. The game is plain ES modules with three.js vendored, and runs offline.

## Where it stands

0.0.x, the foundations: the design (`docs/DESIGN.md`, the hub, and `docs/design/*.md`), the engine core, the pixel stage, the figures and the first look samples (0.0.1), the skeleton (0.0.2, built from `docs/build/0.0.2.md`), and a walkable barracks on a laid-out base (0.0.3, built from `docs/build/0.0.3.md`).

What you can do now:
- **Live a sol in Echo Company's barracks.** New career puts you at the foot of your rack in bay-2-1 on Monday, Sol 590 of MY 211, at 12:39 Melas time, your squad at their racks. Z Q S D walk by physical key (1.14 m/s), Shift runs (2.69), Alt strolls (0.75). R opens or closes the door in front of you; away from a door, R twice waits 15 minutes. The game is drawn at 16 px/m with the chibi figures, your pick from the look round. The barracks is built whole on both floors (twelve squad bays in three layouts, heads, offices, the quarterdeck, three stairs), the same in every career: the world is handcrafted.
- **Walk out onto Base Melas.** Through the front door to the company street, and across the base (37 buildings, the parade deck, the roads and paths, the regolith between) to its fence; the four gates stay shut this release.
- **Watch the sol turn.** Lights out at 22:00 and on at 05:30 (07:00 at the weekend); the fire watch under the red lamp at night; the sun clears the canyon's wall at 05:44 at the start's sol, its disc coming up over a minute and a half, and only then do shadows fall. The wall clocks agree with your watch.
- **Meet your squad, generated.** Everyone in Echo Company, you included, is drawn from the world's seed: names, looks, ranks, ages, homes, traits. They lie in their berths at night and sit or stand at their racks by day, and change only where you can't see them; out of sight they are drawn as you last saw them.
- **See what you are aware of.** The fog of awareness is perception's own sight function, cell for cell: a cone ahead, a ring round you, reach by the light.
- **Hear where you walk.** Footsteps by surface (tile, concrete, regolith) and doors, made by code, quieter in Melas's thin air; the volume and mute in the Esc menu.
- **Measure it.** `?bench=squadbay-night` plays the bay at 23:00 for 20 s and gives the numbers to copy back (60 fps at 16 and 24 px/m on the Mac, 53 draw calls at most).

Under it: one sim put together in `src/sim/game.js` (eight domains, twelve fast layers, skips sliced across frames that land on the same bytes); saves per world (store v2), and a save made anywhere loads and carries on byte for byte, in node and in the page; A* on 0.25 m cells for three body widths; the stage paints areas and figures in a worker and holds uploads to 1 MB a frame.

The roadmap to 1.0 is `docs/design/ROADMAP.md`; what each release changed is `CHANGELOG.md`.

## Working on it

`CLAUDE.md` holds the method (versions, releases, the play copy, tests, ports). `npm install` once for the tests' browser driver, then `npm test` (or `npm run test:quick`).
