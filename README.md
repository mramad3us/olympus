# OLYMPUS

A hard science-fiction soldier's life for the browser. You are a career Martian marine: barracks, mess hall, drills and the range on Mars under 0.38 g; the shuttle to Phobos, days under thrust to Jupiter, peacekeeping under Europa's ice, ship combat and boarding seen from inside a strapped-in body, and special operations later. High-resolution pixel art, top-down at several scales, realism where it makes the game better. The solar system above you runs as in LONGHAUL (`../longhaul`); the body, the rifle and the dice play as in tradecraft (`../tradecraft`).

## Play

- **Mac:** `./play.sh` serves your play copy (a release, pinned) on http://localhost:8200 and opens it. `tools/promote.sh` moves it to the latest release (`--status` says where it stands; `tools/promote.sh v0.0.1` rolls back).
- **Windows:** `play.cmd` (Git and Python 3 needed). `play.cmd --promote` moves to the latest release, `play.cmd --status` says where you are.
- **The look gallery:** `./play.sh --gallery` (or `play.cmd --gallery`) opens the samples on :8212 to star and score; "Copy my picks" gives the text to paste back.
- Nothing to install beyond a browser and Python 3. The game is plain ES modules with three.js vendored, and runs offline.

## Where it stands

0.0.x, the foundations: the design (`docs/DESIGN.md`, the hub, and `docs/design/*.md`), the engine core, the pixel stage, the figures and the first look samples (0.0.1), the skeleton (0.0.2, built from `docs/build/0.0.2.md`), a walkable barracks on a laid-out base (0.0.3, `docs/build/0.0.3.md`), and the body's needs with the first skip (0.0.4, `docs/build/0.0.4.md`).

What you can do now:
- **Live a sol in Echo Company's barracks.** New career puts you at the foot of your rack in bay-2-1 on Monday, Sol 590 of MY 211, at 12:39 Melas time, your squad at their racks. Z Q S D walk by physical key (1.14 m/s), Shift runs (2.69) while your body can, Alt strolls (0.75). The game is drawn at 16 px/m with the chibi figures, your pick from the look round. The barracks is built whole on both floors (twelve squad bays in three layouts, heads, offices, the quarterdeck, three stairs), the same in every career: the world is handcrafted.
- **Have a body.** Hunger, thirst, the bladder and the bowel, grime and stubble, sleep and the body clock, stamina and stress run every second, lived or skipped; the needs that have left fine fold into the watch, and C opens PERSONNEL: your figure as you are (wet hair, grime, a tired face), what you feel in words, never a number, and your file.
- **Use what is at hand with R.** A shower stall, a basin, the head, a toilet stall, your rack (sleep until reveille, a nap), your locker (dress), a tap, the hall's drinking fountain or the machines (a drink, a snack bar): R says what and how long ("shower · 10 min, done 19:40"), held it gives the choices. A door opens and closes; away from anything, R twice stands by for 15 minutes.
- **Skip time behind the splash.** Anything over 45 s zooms in on you, closes an iris over what you are doing (the stall's steam, the sink's foam, the sleeper's breathing), runs the watch fast and shows what changed before zooming back out: ten minutes of shower in 4.3 s. Space goes to the end, Backspace stops where you are ("finish your shower · 8 min", in what you wore into it).
- **Sleep, and get up for the klaxon.** Taps at 22:00, reveille at 05:30 (07:00 at the weekend) with the bugle; one night a week, at a minute drawn from the world's seed between 00:30 and 04:30, the alert drill: up, utilities (dressed at the alarm's tempo, 2.6 minutes), the foot of your rack before the count five minutes on, and stand fast there until the stand-down. Your squad sits up, climbs down, dresses, undresses and lies down again in front of you, never popping.
- **Hear the drill instructor in your head.** One line at a time, its tone as its border; T does what it says where you stand (get up, dress, drink, shower), T held the next thing it would say.
- **Walk out onto Base Melas.** Through the front door to the company street, and across the base (37 buildings, the parade deck, the roads and paths, the regolith between) to its fence; the four gates stay shut this release.
- **Watch the sol turn.** The lights follow the hour and the sun clears the canyon's wall at 05:44 at the start's sol, its disc coming up over a minute and a half; the wall clocks agree with your watch.
- **Meet your squad, generated.** Everyone in Echo Company, you included, is drawn from the world's seed: names, looks, ranks, ages, homes, traits. Out of sight they are drawn as you last saw them, and change only where you can't see them, but for the moves they make in front of you.
- **See what you are aware of.** The fog of awareness is perception's own sight function, cell for cell: a cone ahead, a ring round you, reach by the light; woken in your rack you see past its foot.
- **Hear the barracks.** Footsteps by surface, doors, the shower's water, the tap, the flush, the bugle and the klaxon through the walls, all made by code, quieter in Melas's thin air; the volume and mute in the Esc menu.
- **Play the moments to score.** Tests on the title: "Ten minutes under the shower" and "The klaxon at 02:30", each with a score card and Copy my scores to paste back.
- **Measure it.** `?bench=squadbay-night` plays the bay at 23:00 for 20 s, `?bench=splash-sleep` the night's splash, and each gives the numbers to copy back (60 fps on the Mac).

Under it: one sim put together in `src/sim/game.js` (nine domains, the body among them; activities lived, fast-forwarded or skipped to their outcome on one minute grid, so lived and skipped give the same body and land on the same second); saves per world (store v2), and a save made anywhere, mid-splash included, loads and carries on byte for byte, in node and in the page; a v0.0.3 save loads with its body filled in; A* on 0.25 m cells for three body widths; the stage paints areas and figures in a worker and holds uploads to 1 MB a frame.

The roadmap to 1.0 is `docs/design/ROADMAP.md`; what each release changed is `CHANGELOG.md`.

## Working on it

`CLAUDE.md` holds the method (versions, releases, the play copy, tests, ports). `npm install` once for the tests' browser driver, then `npm test` (or `npm run test:quick`).
