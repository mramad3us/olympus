// OLYMPUS: the game in the browser. Wires the engine core (src/core) and the sim (src/sim) to the page:
// the loop, the keys and the mouse, the saves, the pixel stage and the game view, the HUD, the cards,
// the sound, the title, the bench and the debug handle.
//
// The loop (src/core/loop.js): real time accumulates and the sim steps in fixed 50 ms ticks while
// nothing pauses it (Space, an open card, a hidden tab, an area's cut); the picture draws every frame
// between the last two ticks. One game second per real second; time moves faster only through an
// activity that takes time (a skip: R twice waits fifteen minutes where no door is at hand), and in debug
// mode through $ (an hour) and ^ (fifteen minutes), AZERTY's labels of the codes BracketRight and
// BracketLeft (] and [ on QWERTY), queued as the actions debug:skip:<ms> (the honesty mark is the
// sim's) and listed on the keys card in debug mode. The sim is src/sim/game.js createSim(): its
// twelve fast layers and its slow layer registered on the loop; this file holds no game rules.
//
// A new career (the title's New career, then Standard or Ironman) starts the barracks scenario at
// START_MS, Monday, Sol 590 of MY 211, 12:39:34 Melas time (CONTRACTS §2, §3): the player in Echo
// Company's barracks at the foot of their rack in bay-2-1, the 1st Squad at their racks. ?play=
// sandbox is still v0.0.2's test rooms; ?play=barracks&hour=23&seed=48213 the barracks at 23:00, and
// &area=<id>&at=<x>,<z>&face=<f> a start elsewhere (a shot of the street at dawn: &area=melas.ground
// &at=522,224).
//
// Areas (PLACES's portals, the build sheet 0.0.3 §2.1, §2.4). Launching a state (new, loaded or
// imported: launch()) sets the loop's state at once, so the debug handle's start(json) then step(n)
// acts on it, and holds the pause reason 'cut' while the view builds the live area (at most
// CUT_MAX_MS, then what is ready shows) and the player's figure. When the sim moves the player
// through a portal it emits area-enter, and the same cut is held while view.setArea() shows the new
// area (from the view's cache at once when it was prepared; a ground's chunks round where you stand
// built before the cut lifts, so none pops in). After each cut the areas the live
// area's portals and stairs lead to are prepared one at a time while play runs (view.prepare: the
// ground and both of Echo's floors stay built), so the next door is a cut of a frame or two.
//
// The picture (src/render): the stage (stage.js, three.js, the area's palette), the game view
// (view.js: the live area built by the paint worker, the people from state.actors, the camera that
// follows you), the paint worker (painter.js, src/art/worker.js) and the upload queue (uploads.js).
// The shader programs are compiled at boot behind the title (warm.js).
//
// The HUD (src/ui/hud, VIEWS §7): DOM over the canvas in VIEWS §7.5's reserved rectangles (layout.js,
// --ui by the window): the wrist terminal's watch top right (watch.js: Melas time large, the weekday
// and the sol, UTC on its second line, the place, the body strip folded in: only the needs that have
// left fine, strip.js), the log's last lines top left (toasts.js), the instinct's line bottom centre
// (instinct.js: SKILLS' line with its tone and T's keycap, its chip on T held, then R's plate at its
// right, in the kit's pixels, on every line, offer.js: "R WASH HANDS · 30 S", "R SHAVE · 4 MIN, DONE
// 19:46", "R OPEN THE DOOR", else "R WAIT 15 MIN", and "R AGAIN: WAIT 15 MIN" for HAND_AGAIN_MS after a
// first R there), "? keys" bottom right, PAUSED at the top centre. A card (Esc the menu, ? the keys, J the
// log, C PERSONNEL, R held the menu of single actions, the late card, a scene's end and score cards, the
// bench's result) pauses and hides the HUD under it.
//
// R and T are press keys (core/keys.js): tapped they act on the key going up, held 220 ms they act
// then (the build sheet 0.0.4 §2.4). R tapped sends what its plate said when the key went down (a door,
// the quick action, getting up, the resume, the wait asked twice); held wherever handMenu has a row, the
// menu of every single action at hand (cards/actions.js, the 0.0.6 round: the user, 2026-11-06, "long
// pressing R should open the menu with all the possible interractions as single actions, with the ability
// to select several actions"), its keys its own while it is up (input.own), what it sends the single or
// one chain ({ act: 'chain' }); an offer or a plan that would make you late for a call opens the late card
// (cards/late.js: fit it in, do it anyway, not now) first. T tapped sends the line shown when the key
// went down ({ act: 'instinct', args: { id, act } }: the sim does it only if that rule still fires),
// T held the chip's.
//
// The splash (src/ui/hud/splash.js; TIME §6, VIEWS §5): on 'skip-start' the controller plans the
// splash and holds the sim's target at its start; each frame it moves the target along TIME's ease
// (loop.skipTarget), gives the view the splash frame (info.splash: the zoom, the iris, the shown
// clock, the vignette's part) and from the landing to the end of the zoom out holds the pause reason
// 'splash' (PAUSED never shows for it). The splash's own HUD (CLOCK, the outcome strip in RADIO, the
// ticker in INSTINCT) shows alone. Its keys: Space, Enter or a click to the end; Backspace stop here
// (skip:stop); Esc the menu, which pauses it; T on the strip's "carry on" one more chunk (skip:chunk). A
// chain's splash (the 0.0.6 round) hears TIME's chain facts: each step's parts join the splash's as it
// begins, and Backspace's stop ({ phase: 'stop' }) decelerates the shown clock to the running step's end.
//
// Test scenes (ROADMAP §2.2; src/data/scenes.js): the title's Tests, or ?play=test-shower and
// ?play=test-night (&seed, &hour to override the scene's), start a scene with no saves; its goal shows
// in the toasts for GOAL_S, and once its endOn fact has come and the splash has played out, the end card
// (Again with the same seed or a new one, Score: the score card, "Copy my scores").
//
// The sound (src/ui/audio, VIEWS §11): the context is made at boot, suspended (it plays nothing before
// the first key or click: the browsers' autoplay rule), and the first key or click resumes it; then footsteps on the surface under the feet at the gait's foot-falls, and the
// doors' leaves from the sim's door facts, the shower's water and the tap while their parts run, the
// flush, the klaxon through the walls, reveille's bugle, the splash's muffle and its ticking watch
// (audio/world.js), all synthesised by code. The master volume and mute are in
// the Esc menu and kept in the saved profile (store.js updateProfile: read and written in one transaction).
//
// Saves (TECH §7.4, TIME §13): the sim emits autosave { why } (a skip's end, the sol's start, five
// minutes of live play, an area change, the content edge); one write a frame at most, after the
// frame's ticks; a 'live' or a 'day' one waits for a quiet frame (one tick owed at most, nothing
// held) up to QUIET_WAIT_MS (TECH §7.4: the day slot at the first quiet frame after local 00:00);
// the rest (a skip's end, an area change, the edge) write at once, behind their splash or cut. A new
// career (or an imported file) is written as it launches. On leaving the page and on hiding the tab
// the write is store.autosaveSync's (no read first, every put issued at once and committed, so it
// lands as the page goes); on quitting to the title the ordinary one. ?nostore=1 neither reads nor writes the saves (shots, benches, agents' smoke runs). The menu exports and
// imports save files, and writes a bug report (store.js reportOf: the last autosave as the anchor, or
// the state launched from (new, loaded or imported) before the first; the errors, the renderer, the
// engine, the state now).
//
// The bench (ROADMAP §4.6, TECH §13.4): ?bench=squadbay-night (or ?bench=1) runs src/data/bench.js's
// scene with no saves (src/ui/cards/bench.js): the squad bay at 23:00, its keys held for 20 s, then a
// card with the frame times, draw calls, uploads, the renderer and the screen, and Copy results;
// window.__bench holds the same.
//
// The weapon mode (the build sheet 0.0.5 §2.4; VIEWS §4.4, §7.4, §7.5, §8.3, §8.10, §10.2, §11.3): while
// the shot role's stopNow(state) says stop motion holds, the HUD takes its weapon state (layout.js):
// the step panel in STEPS (hud/steps.js: stepsOf(state) numbered on the digits, the weapon card at its
// left painted from arms' beliefOf alone, the stage's paintWeaponCard), RADIO on it, your card close in
// PAPER (hud/paper.js, from arms' rangeLook), the plaque over the bracketed target (src/ui/plaque.js:
// the shot role's plaqueOf, its hover the DC's parts and every modifier) with corner brackets, pale on
// what the pointer or the brackets are on, red on what is aimed at (the list shown 2.5 s after an aim or a
// bracket's move by the keys too, the call to fire naming Fire's digit when the last input was a key; the
// plaque gone on a cold line or under a handling step), and a reflex card beside the weapon card while the
// gun's own stop waits (hud/reflex.js; the panel its card alone). The keys: a digit tapped sends the step it shows at
// the normal tempo ({ act: 'stop', args: { step, tempo, target } }), with Shift rushed, held careful
// (Fire held: hold and fire), 0 pages the singles past nine; Enter aims at the bracketed target; Q and
// D (the codes KeyA and KeyD) and the arrows step the brackets (step 'pick:-1' | 'pick:+1'); the mouse
// brackets on hover, aims on a click, fires on a click on the aimed one; in a reflex card a digit
// answers and R flips keep. accept() refuses the bare digit in stop motion (the panel sends what it
// showed). The radio box (hud/radio.js) shows the say facts, the tower's and the coach's, in RADIO in
// every state but a splash; I opens what you carry (cards/inventory.js, arms' kitView, its reach the sim's
// magIn time); the log's toasts carry of the rolls only the shots (by the hole's tone), the failures that are
// not routine and the looks that find something, in the action's words, never a hidden roll; a range fault
// is a short tag, its words the coach's in the radio box; a struck row's digit says why; the
// range's sounds (audio/range.js) hear the shot, step and say facts. test-handling ("Show clear") is
// a scene of the Tests menu and ?play=test-handling&seed=48213[&setup=hot|bench|mixed] (mixed: the Tests menu's
// "Show clear, mixed magazines" too); it ends on the range
// fact at 'clear' or 'stopped', its end card saying the range's summary.
//
// The 0.0.7 round's (the build sheet 0.0.7 §2.5; VIEWS §2.4, §7.4, §7.5, §11): test-range, "The line at 300 m"
// (?play=test-range&seed=48213[&setup=confirm|s200|far], the Tests menu's entry). The far window: each frame the
// sim's far point (shooting.js farPointOf: the aimed, the bracketed, or with E held on a KD line your own face, when
// outside the frame) is placed by layout.js placeFar against the state's rectangles ('weapon-far': PAPER yields, or
// 'walking'), handed to the stage (view.setFar: the disc's centre and radius in window CSS px, the optic), and
// labelled here ("TARGET 10 · 300 M", the plaque's enamel, beside the disc where placeFar left room) with a tick on
// its ring along the true bearing, both at the stage's dissolve (view.farState().alpha); a far target's brackets and
// plaque stand on the window (0.0.8: the brackets at the window's scale, the face 32 px at 4×, 8 at 1× framed at
// 12). The window and its plates keep clear of the nearest wind flag the HUD leaves readable (0.0.8: flagBoxes, the
// KD's flags within 30 m projected, and layout.js flagToKeep; placed again without it when nowhere else is free). The plaque at distance carries its terms' plate (range, wind, hold, zero and the rings' odds: plaque.js
// termsPixels) and its hover their words. The weapon card shows the turrets, the believed dope for the line and the
// hold (art/weaponcard.js); Z S and the arrows dial elevation, Shift with Q D windage (core/keys.js dialOf). PAPER
// on the KD: the zero card live, the group card once the coach has read a group, your face as the pits mark it while
// the window is shut, the score card at a string's end (cards/kd.js). The sounds hear the 'pit' fact (the carriers).
// The end card says the KD's summary and an incident. C lists your wounds in BODY's words, and a casualty's dimming
// (wounds.js avpuOf: P, U) fades the picture. window.__olympus.range() carries kd() and nd(who).
// The 0.0.8 round's (the build sheet 0.0.8 §2.4; COMBAT §25.4, §25.6, §25.10.3, §25.11; VIEWS §7.4): test-pairs, "Pairs"
// (?play=test-pairs&seed=48213[&tier=recruit|private|cpl|sgt|raider|tierone], the Tests menu's entry through its sheet
// picker, cards/pairs.js). The take-in made readable: while a contact's window is open (contact.js contactNow().pending)
// hollow amber brackets stand round each target seen, 3 times its box on the sighting tick, closing to it as the
// window's k goes to 1 on the drawn clock (plaque.js windowBracket), and every key but Space and Esc is refused, in
// the page as in the sim (game.js act's gate): the keys are the marine's once he has taken it in. At the pause (stop
// motion entered via 'contact') the brackets snap to the pale pick and the rest of those taken in stay bracketed pale,
// the stamp "0.55 S" stands on the target for STAMP_S of real time (amber from 0.50 s), the plaque's lead "CONTACT ·
// RIFLE · TAKEN IN 0.55 S" with its strip over the plaque until a step is chosen, the instinct's line leads "Contact ·
// 0.55 s.", and the hover lists the take-in's factors. A shot row's parts stand by the target as a plate (the row
// hovered, else the first offered: plaque.js rowPartsPlaque). The coach's shot timer's paper (hud/timer.js) takes
// PAPER after each string, in and out of stop motion. The end card says the sheet and the three aspects in the
// scene's numbers and offers "Again as …" each other sheet on the same seed (the scene's againAs). The sounds hear the
// 'turner' fact (the motor, the clack, the timer's beep). The handle gains pairs() and contact().
// The 0.0.9 round's (the build sheet 0.0.9 §2.3; COMBAT §5, §25.18.3; VIEWS §7.3, §7.4, §11.2, §12): "Three bangs"
// (?play=test-pairs&setup=bangs[&tier=…], the Tests menu's entry through the picker, the Boot recruit focused; setup
// 'bangs:standby' the tests' and the bench's). COMBAT §5's state is read once a tick (supp.js suppNow: suppRead) and drawn:
// the view's chaos (view.setChaos: the band's corners and drain, the startle's dark and its pale frame, a flash's white and
// its afterimage, the dazzle's veil; "reduce flashes" (&flashes=reduced, the Esc menu, or localStorage olympus.flashes), a grey veil and no
// pale frame), the sound's (audio.frame's chaos: the ducking, the deafness and its whine, captioned "[a high whine]" once);
// the bangs on the pad are rangeLook's (the view's bangs layer), their report the 'fx' fact's. While the marine is startled
// every key but Space and Esc is refused, in the page as in the sim (contact.js refusesAct), a key that went down in it does
// nothing on its way up, and at its end in stop motion the pause's guard (PAUSE_GUARD_MS) holds; "FROZE 2.45 S" stands beside
// your own figure's head for STAMP_S of real time at its end (plaque.js frozeStamp), gone once a step is chosen. A row the chaos
// shakes is marked "! shaking" with its term and the arithmetic on its hover, the plaque's hover adds the chaos's sum (plaque.js
// chaosSum), C gives Hardening in words, the picker each sheet's word. The end card leads with the bangs' lines (the scene's
// bangsNow, and this session's calm run of the sheet on the seed where the page remembers one); "Again as …" keeps the setup;
// the score card asks one aspect, bangs. The handle gains supp().
// The 0.0.10 round's (the build sheet 0.0.10 §2.3; COMBAT §5.2, §25.18.3; VIEWS §7.3, §7.4, §7.7, §11.2): "Bang" (?play=test-stress
// [&tier=…][&setup=standby[:k]], the Tests menu's entry through the picker, the Boot recruit focused). The coach's din is the
// stage's (rangeLook().stress: the view's din layer, the horn in his hand and the blanks' flashes at his muzzle; the stress
// course's bangs the bangs layer's) and the sound's (the 'fx' facts horn and blank: audio/stress.js, through the ear
// defenders); his "Bang!" in the radio box, captioned "[a shout: Bang!]" in the toasts. Breathe (COMBAT §5.2) is the shot role's
// row in the panel; out of the mode, while it runs, the instinct's lead counts the box ("Breathe · in · HOLD · out · hold":
// hud/instinct.js breatheLead), and the body bus breathes it (audio.frame's breathing); the picture eases as the pool drains (the
// band's vignette as built). The hit card (hud/hitcard.js, the art's src/art/doll/hitcard.js) stands in HITCARD at the top
// left, under the log's lines (the coach's timer keeps PAPER): during a string what the marine could tell of each turner he fired at (marks.js hitMarks' belief), at the
// pause in stop motion and HIT_HOLD_MS out of it; from the string's end the holes (truth), until the next string runs; two
// turners hit on the last string, the card follows the brackets' pick, its tabs newest first. The end card leads with the
// stress course's lines and a small truth card a string (cards/stress.js), "Again as …" each sheet on the same seed (the
// scene's againAsStress) led by its hardening word; Score asks the scene's three aspects (chaos, contrast, hands). The handle
// gains stress(). ?bench=stress-din: the din's standby as the Boot recruit, its frames at a blank counted as at a bang.
// For tests and shots, URL parameters skip the title (src/core/debug.js readParams):
// The 0.0.12 round's (the build sheet 0.0.12 §2.4; COMBAT §25.7 to §25.11; VIEWS §7.4, §10, §11): "Stack and clear" (?play=
// test-shoothouse[&tier=…][&par=basic|advanced|operator][&setup=go|room:2|room:3|hall|contact], the Tests menu's entry through the
// picker, the Private focused, the par chooser under the sheets). PAPER is the instructor's lane timer (timer.js laneModel over the
// scene's houseNow), in and out of stop motion; the panel's bundle rows and the running bundle's lanes (steps.js, the drill's bundleNow);
// the instinct line's "T: <what> · <s>" (the row its act names, off the panel shown: actWordsOf); V cycles the movement stances where
// the scene's spec sets stances (the sim's 'gait', in place of the carry), Backspace stops a running bundle after its beat ('drill:stop'),
// and GO's guard holds the keys PAUSE_GUARD_MS from GO as the contact's pause does, so a key pressed in anticipation never spends the
// first choice. The end card says the run sheet's card and the instructor's one thing, the three aspects, this session's runs room by
// room, with the run sheet and the hot wash beside it (cards/house.js), and "Again as …" each sheet on the same seed (againAsHouse).
// The sounds hear the 'house' and 'bundle' facts (audio/house.js), and the hall's reverb holds while you are in the house. The
// handle gains house().
// ?play=sandbox|barracks|test-shower|test-night|test-handling|test-range|test-pairs&seed=<n>&hour=<h>[&mode=ironman][&debug=1][&area=<id>&at=<x>,<z>&face=<f>][&setup=hot|bench|mixed][&tier=…][&env=<preset>];
// &ppm=16|24 (the density, 16 by default, the user's pick: src/render/scale.js; 24 a test density);
// &mood=<name> (else the view's by the hour); &fog=1 (the samples'
// test fog); &nostore=1; &perf=1 (the GL counters and the GPU's time by pass, in window.__report).
// window.__olympus is the debug handle; window.__ready turns true once READY_FRAMES frames are drawn
// with nothing pending (the warm-up, the area, the uploads, the player's sheet, the worker), or at
// READY_LIMIT_MS with window.__report.pending saying what still waited.
import { createBus } from './core/bus.js';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { fromJSON, toJSON } from './core/state.js';
import * as store from './core/store.js';
import { createDebugHandle, installDebug, readParams, houseChoice, shipChoice, breachChoice, breachOnly, holdoutsOnly, holdoutsNote } from './core/debug.js';
import { MIN_MS, HOUR_MS, TICK_MS, durationText, isHeld } from './core/clock.js';
import { BUILT } from './core/reads.js';
import { hitDollCount } from './art/doll/hitcard.js';
import { dollCount } from './art/doll/dress.js';
import { utcClockText } from './core/calendar.js';
import { playerActor, setIdsCheck } from './core/ids.js';
import { solText } from './sim/time/dates.js';
import { createSim, newGame as freshGame, SCENARIOS } from './sim/game.js';
import { WAIT_MS } from './sim/time/domain.js';
import * as splashTiming from './sim/time/splash.js';
import { ACTIVITIES } from './data/activities.js';
import { SCENES, SCENE_IDS } from './data/scenes.js';
// (the scenes' data read by name where an export may not be there yet: HOUSE_ROOMS_DEFAULT, the build sheet's A's)
import * as SCENES_DATA from './data/scenes.js';
import { instinctNow } from './sim/skills/instinct.js';
import { bodyOf } from './sim/body/body.js';
import { stagesOf, stripOf, wordsOf, cuesOf } from './sim/body/cues.js';
import { lookFor, indoorsNow, figureOf } from './sim/people/figure.js';
import { areaOf, generatedIds } from './sim/places/model.js';
import { planOf as placePlanOf, roomAt as placeRoomAt } from './sim/places/plan.js';
import * as FOOTING from './sim/body/footing.js';
import { siteDayOf } from './sim/jobs.js';
import { heldLayouts } from './sim/scenes/assemble.js';
import { timeAt, siteAt, isPreset } from './sim/places/env.js';
import { lightLevel } from './sim/places/light.js';
import { sunAt } from './sim/places/sun.js';
import { handOffer, handMenu } from './sim/places/hand.js';
import { planChain } from './sim/time/chain.js';
import { hairOf } from './sim/body/hair.js';
import { eyeOf, sightMask, canSee } from './sim/people/perception.js';
import { BARRACKS } from './sim/scenarios/barracks.js';
import { BENCH_SCENES, BENCH_DEFAULT, BENCH_PANEL } from './data/bench.js';
import { layoutOfWord, badgeKey, BANK_CODES } from './sim/arms/groups.js';
import { beliefOf, finishOf, REFUSALS, actionMs } from './sim/arms/firearms.js';
import { kitView } from './sim/arms/kit.js';
import { rollerOf } from './sim/combat/roll.js';
import { kitLook, rangeLook } from './sim/arms/look.js';
import { MODELS } from './sim/arms/models.js';
import { stepsOf, stopNow, targetsOf, LABELS as STEP_LABELS, stepLabel } from './sim/arms/shooting.js';
import * as shooting from './sim/arms/shooting.js';
import * as kdScene from './sim/scenarios/range.js';
import * as wounds from './sim/body/wounds.js';
import * as rangeKit from './sim/arms/kit.js';
import { plaqueOf } from './sim/arms/shot.js';
import { rangeNow, STOP_WORDS } from './sim/scenarios/handling.js';
// (0.0.8: the contact's window and pause, the one formatter of the take-in, the pairs scene, the test sheets)
import { contactNow } from './sim/combat/contact.js';
import { takeInWords } from './sim/combat/react.js';
import * as pairsScene from './sim/scenarios/pairs.js';
import * as TEMPLATES from './sim/skills/templates.js';
// (0.0.9: COMBAT §5's model, the chaos: the HUD's reading, hardening for C and the picker)
import * as SUPP from './sim/combat/supp.js';
import { windAt } from './sim/arms/wind.js';
import { turnerPx } from './render/range-items.js';
// (a KD face drawn FACE_K times life size in the far window: the stage's own constant, VIEWS §2.12)
import { FACE_K } from './art/kit/range.js';
import { KD_RANGE } from './data/places/range.js';
import { paintWeaponCard } from './art/weaponcard.js';
// (v0.0.18: the second gun carried, for the weapon card's strip: guns.js)
import { otherGunView } from './sim/arms/guns.js';
import { createBoot } from './ui/boot.js';
// (the To score page and its runtime picks, the Esc menu's extra line, the shot a scene plays)
import { parseLook, lookSet, readPicks, writePicks, topickCard, CORNER_AID_KEY, AID_SETTINGS } from './ui/cards/topick.js';
import { setMenuExtras } from './ui/cards/menu.js';
import { shotFor } from './data/sounds.js';
import { applyScale, uiScale, rectsAt, placeFar, farTick, overlaps, flagToKeep, FLAG_KEEP_M, STATES as HUD_STATES } from './ui/hud/layout.js';
import { createWatch } from './ui/hud/watch.js';
// (ROADMAP "anywhere" step 6: a ship's gravity events, the URL's &grav=, the G line under the watch, the surprise's card)
import { parseGrav, addProfile, gLineOf, gravCardOf } from './sim/places/gravity.js';
import { createGLine } from './ui/hud/strip.js';
import { createToasts } from './ui/hud/toasts.js';
import { wantOf } from './ui/hud/offer.js';
import { createInstinct } from './ui/hud/instinct.js';
import { createSplashControl, createSplashHud, splashContext } from './ui/hud/splash.js';
import { keysRows } from './ui/cards/keys.js';
import { logLines, rollLine, hiddenRec } from './ui/cards/log.js';
import { runBench, benchResult, benchCard, BANG_FRAMES_MS } from './ui/cards/bench.js';
import { actionsCard } from './ui/cards/actions.js';
import { lateCard } from './ui/cards/late.js';
import { sheetOf, sheetCard } from './ui/cards/sheet.js';
import { endCard } from './ui/cards/end.js';
import { scoreCard, readScores } from './ui/cards/score.js';
import { GOAL_S, END_HOLD_S, endsScene, endFacts, sceneLines } from './ui/cards/tests.js';
import { groupCardModel, kdScoreModel, kdLiveModel, atOf } from './ui/cards/kd.js';
import { dialOf, BINDINGS } from './core/keys.js';
import { checkShort } from './sim/skills/checks.js';
import { inventoryCard } from './ui/cards/inventory.js';
import { createAudio } from './ui/audio/engine.js';
import { createSteps, createTicks } from './ui/hud/steps.js';
import { createRadio } from './ui/hud/radio.js';
import { shipWords, shipText } from './ui/ship-words.js';
import { createPaper, paperModel, faceModel } from './ui/hud/paper.js';
import { createTimer, timerModel } from './ui/hud/timer.js';
import { aspectLines, againTiers, runLine, bangLines } from './ui/cards/pairs.js';
// (0.0.10: "Bang": the stress course's view, the hit card's marks and its picture, the strings' end card, Breathe's lead)
import * as stressScene from './sim/scenarios/stress.js';
import { COURSES } from './data/courses.js';
import * as MARKS from './sim/arms/marks.js';
import { createHitcard } from './ui/hud/hitcard.js';
import { paintHitcard, CARD_MIN } from './art/doll/hitcard.js';
import { createTargetView } from './ui/hud/target.js';
import { stressLines, hotWash, sessionGrid, gridTable } from './ui/cards/stress.js';
// (0.0.12: "Stack and clear": the scene's views (shoothouse.js), the drill's running bundle (bundle.js), the instructor's lane timer, the
// run sheet and the hot wash (cards/house.js))
import * as houseScene from './sim/scenarios/shoothouse.js';
import { parseBoarding } from './sim/scenarios/opfor.js';
// (the anywhere round's two scenes: their end cards' lines (cards/anchors.js) from the scenes' own views)
import { anchorsNow } from './sim/scenarios/anchors.js';
import { armouryNow, armouryGunShort, armourySplashSpot } from './sim/scenarios/armoury-day.js';
import { burnNow } from './sim/scenarios/burn.js';
import { anchorsSaid, anchorsAspects, burnSaid, burnAspects } from './ui/cards/anchors.js';
// (0.0.18: the loadout, its code and the screen's numbers (src/sim/arms/loadout.js))
import { loadoutOf, codeOf, loadoutView, reachSOf } from './sim/arms/loadout.js';
import * as BUNDLE from './sim/combat/bundle.js';
import { laneModel } from './ui/hud/timer.js';
import { runSheetEl, hotWashEl, houseRunLine, houseAspects, houseEndLines, truthRows, truthRowEl } from './ui/cards/house.js';
// (the card (the build sheet v0.0.20 §1 items 10, 13, 14, 20, 21, 25, 26): the runs kept and the next sheet, the session's
// grid, the plan view over the debrief's model, who speaks and the plates off the room, the run's export)
import { keepRun, againOrder, weakRoomOf } from './ui/cards/house-runs.js';
// (done (the build sheet v0.0.21 §1 items 9 and 16): qualified's attempt and the drawn house's code on the card and the export)
import { readRuns, qualStart, qualStep, qualSeed, qualKeep, keepQual, nextUp as nextSheetUp } from './ui/cards/house-runs.js';
import { houseCodeOf, houseUrlNote, HOUSE_CODE_SET } from './sim/scenes/assemble.js';
import { createRunLog } from './ui/runlog.js';
import { houseGrid, houseGridEl } from './ui/cards/house.js';
import { housePlanEl } from './ui/cards/houseplan.js';
// (the plan view's ghosts, page memory only (the build sheet §1 item 16), and a named house's letter on the card)
import { ghostKeyOf, ghostOf, keepGhost, ghostsFor, ghostWords, deltaWords } from './ui/cards/house-ghosts.js';
import { namedLaneOf, againHouseOf } from './ui/cards/house.js';
import { debriefOf } from './sim/scenarios/house-debrief.js';
import { speakerMarks, balloon, placeBubbles, keepOff } from './ui/plaque.js';
import { spokenMs } from './core/speech.js';
import { digest as digestOf } from './core/hash.js';
import { WHEEL_S4 } from './data/places/wheel.js';
// (the boarding round's stage 0: the ships' registry, for a ship's own toast when the URL asks a house option of it: debug.js shipChoice's words)
import { SHIPS } from './data/places/ships.js';
import { hitFit } from './ui/hud/hitcard.js';
import { breatheLead } from './ui/hud/instinct.js';
import { isBreathe } from './ui/hud/steps.js';
import { createReflex } from './ui/hud/reflex.js';
import { plaque, bracket, place, shotPlaque, plaqueWords, plaqueParts, termsPlaque, termLines, farLabel,
  windowBracket, bracketScale, stamp, STAMP_S, contactPlaque, rowPartsPlaque, frozeStamp, chaosSum, feltMod } from './ui/plaque.js';
import { doll, DOLL_SCALE } from './art/doll/doll.js';
// (0.0.18, the doll role: the I and C figures and the target view drawn from the gear worn now (gear.js, dress.js), the target view
// whenever you engage a stand or a man (engage.js, hud/target.js))
import * as GEAR from './sim/arms/gear.js';
import { dressedDoll } from './art/doll/dress.js';
// (you on the I and C cards and the loadout's marine through the portrait's renderer, from the Seen record in the mirror)
import { paintPortrait, cardBackdrop } from './art/doll/portrait.js';
import { seenOf } from './sim/people/seen.js';
import { createStage } from './render/stage.js';
import { createView, CUT_MAX_MS, FOG_CELLS } from './render/view.js';
import { FOG_CELL_M } from './render/fog.js';
import { createPainter } from './render/painter.js';
import { createUploads } from './render/uploads.js';
import { instrumentGL } from './render/stats.js';
import { PX_PER_M, RES } from './render/scale.js';
import { farBracketPx } from './render/far.js';

/** Frames drawn with nothing pending before the page says it is ready; the longest it waits (TECH §13.3). */
export const READY_FRAMES = 3, READY_LIMIT_MS = 10_000;
/** The debug skips, by physical key: ^ and $ on AZERTY ([ and ] on QWERTY), fifteen minutes and an hour. */
const DEBUG_SKIPS = Object.freeze([['BracketLeft', 15 * MIN_MS], ['BracketRight', HOUR_MS]]);
/** How long a 'live' autosave waits for a quiet frame (TECH §7.4). */
export const QUIET_WAIT_MS = 10_000;
/** R's wait asks twice: a second R within this long of the first sends it (ms; places' hand.js says why). */
export const HAND_AGAIN_MS = 2000;
/** The sound's settings are written this long after the last change (ms: a slider sends many). */
export const PROFILE_WRITE_MS = 300;
/** The first ticks after a load: every one lost means the save is damaged (store.js RECOVER_TICKS). */
const RECOVER_TICKS = store.RECOVER_TICKS ?? 20;
const WHY_RANK = { live: 0, skip: 1, area: 1, launch: 1, day: 2, edge: 3 };

const VERSION = (await fetch('VERSION', { cache: 'no-store' }).then(r => (r.ok ? r.text() : '?')).catch(() => '?')).trim() || '?';
store.setVersion(VERSION);
const params = readParams();
// (&env names a preset (src/data/places/env.js ENV_PRESETS): an unknown one, 'vacuum' (an air, not a preset) or a typo, is
// dropped here and said in a toast once the page is up, as an unknown ?play is, never a throw in newGame and a dark page)
const envUnknown = params.env && !isPreset(params.env) ? params.env : null;
if (envUnknown) params.env = null;
// (&grav= a ship's gravity events on every game this page starts (gravity.js parseGrav); one that does not parse is
// dropped here and said in a toast once the page is up, as &env= is)
const gravList = params.grav ? parseGrav(params.grav) : null;
const gravUnknown = params.grav && !gravList ? params.grav : null;
const readLocal = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const benchName = params.bench ? (params.bench === '1' ? BENCH_DEFAULT : params.bench) : null;
const settings = {
  debug: params.debug || readLocal('olympus.debug') === '1',
  nostore: !!params.nostore || !!benchName, perf: !!params.perf, fog: !!params.fog,
  mood: params.mood || null,
  // (0.0.9: VIEWS §12's "reduce flashes": a bang's white a grey veil, no startle's pale frame)
  reduceFlashes: params.flashes === 'reduced' || readLocal('olympus.flashes') === 'reduced',
  // (2026-11-13, the rework's R7: the step panel's layout, VIEWS §7.8: &panel=a|b|c, else this browser's olympus.panel, else C;
  // a bench plays its own (bench.js BENCH_PANEL), so its digits mean what its script says)
  panel: benchName ? BENCH_PANEL : layoutOfWord(params.panel ?? readLocal('olympus.panel')),
  // (the rework's R8: the walk cycle, VIEWS §3.10.4: &cycle=A|B|C, else this browser's olympus.cycle, else the game's (B))
  cycle: params.cycle ?? (['A', 'B', 'C'].includes(readLocal('olympus.cycle')) ? readLocal('olympus.cycle') : null),
  // (FL-9: the shoot house's light candidate, &houselight=b|c (src/data/places/house-light.js), runtime only; none is today's)
  houseLight: params.houseLight ?? null,
};
// (the build sheet v0.0.20 items 2, 10 and 24: the To score page's picks, runtime only (state.$look, the shot, the walk,
// state.$aid), this browser's (topick.js readPicks, olympus.cornerAid) unless the URL says (&look=, &shot=, &cycle=), which wins;
// none of them is ever saved, so a save replays byte for byte)
const toPick = settings.nostore ? { v: 1, scores: {}, stars: [], flags: {} } : readPicks();
const lookAsked = params.look ? parseLook(params.look) : null, lookUnknown = lookAsked?.unknown?.length ? lookAsked.unknown.join(', ') : null;
Object.assign(settings, {
  look: lookAsked ? lookAsked.look : toPick.flags.look ?? null,
  shot: params.shot ?? toPick.flags.shot ?? null,
  aid: AID_SETTINGS.includes(readLocal(CORNER_AID_KEY)) ? readLocal(CORNER_AID_KEY) : 'rung',
});
if (lookAsked?.cycle && !params.cycle) settings.cycle = lookAsked.cycle;
// (debug mode: an id map's cached sorted order checked against a fresh sort every 64th call, TECH §2.3.1)
if (settings.debug) setIdsCheck(64);

// ---- the page ----
const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids.filter(Boolean)); return n; };
applyScale();
const banner = el('div', { className: 'banner', hidden: true });
const keysHint = el('div', { className: 'keyshint' });
const hud = el('div', { id: 'hud', hidden: true });
const frameEl = el('div', { id: 'frame' });
document.body.append(frameEl);

// ---- the stage, the view and the painting ----
const stage = createStage({ parent: frameEl, palette: 'mars' });
frameEl.append(hud);
const watch = createWatch(hud);
const gLine = createGLine(watch.el);
hud.append(banner);
const gl = stage.renderer.getContext();
window.__renderer = stage.stats.gpu;
const counters = settings.perf || settings.debug || benchName ? instrumentGL(gl) : null;
const painter = createPainter();
const uploads = createUploads();
const view = createView({ stage, painter, uploads, cycle: settings.cycle });
if (settings.mood) view.setMood(settings.mood);
if (settings.fog) view.setFog(true);
view.warm();

// ---- the engine ----
const bus = createBus({ onError: (e, type) => broke(e, `a listener of '${type}'`) });
let loop = null, sim = null;
/** The house's fault tags owed while a take-in's window runs (shown at its end). */
const faultsOwed = [];
// (the game owns Tab, Space and the move keys only in play with no card up: on the title they move focus and press buttons)
// (in stop motion the bare digit is refused: the step panel sends the step it showed, the build sheet 0.0.5 §2.4)
const inStop = (s = loop?.state) => s?.stop?.mode === 'stop';
// (0.0.8: while a contact is being taken in nothing is accepted: the keys are the marine's once he has taken it in)
// (0.0.12: V is the movement stances where the scene's spec sets stances: the carry is not queued there, the gait is (onAction))
const input = createInput({ accept: (action, kind) => !!loop?.state && !loop.paused && !splash?.active && !(kind === 'digit' && inStop()) && !windowOpen() && !startledNow() && !guardedFlash(action) && !(action === 'carry' && stancesNow()), swallow: () => !!loop?.state && !boot?.card && !boot?.page });
// (a key the pause's guard holds flashes the panel for GUARD_FLASH_MS, so a press is seen to wait (the play review of 2026-11-13:
// the first key of each fresh pause, T at GO or the row at a contact, was swallowed with no sign, 2 to 5 times a lane))
const GUARD_FLASH_MS = 200;
let guardFlashT = 0;
function guardedFlash(action, e = null) {
  const g = pauseGuarded(action, e);
  if (g && action !== 'up' && action !== 'down' && action !== 'left' && action !== 'right' && inStop()) {
    hud.classList.add('guarded');
    clearTimeout(guardFlashT);
    guardFlashT = setTimeout(() => hud.classList.remove('guarded'), GUARD_FLASH_MS);
  }
  return g;
}
// ---- the contact (0.0.8: contact.js contactNow, read once a tick) ----
// ---- the page's reads, once a tick (the build sheet §1 item 11; the perf lens's P6) ----
// clock.seq counts every tick, held or not, so a read keyed on it was rebuilt twenty times a second while time stood still in
// stop motion, though a held tick with no input changes nothing (only the input and offers layers run then): the panel, the
// belief, the targets, the plaque, every memo below. While the clock is held a read is keyed on the input sent instead
// (inputSeq: every tick's non-empty input, the poll's and the debug handle's, counted by a fast layer of its own), so a long
// pause rebuilds nothing until a key is pressed; while it moves, on the tick's seq as before.
let inputSeq = 0, inputMouse = '';
function inputSent(i) {
  if (!i) return false;
  const m = i.mouse, at = m ? `${m.x}|${m.y}|${m.buttons ?? 0}` : '', moved = at !== inputMouse;
  inputMouse = at;
  return !!(i.act?.length || i.mx || i.mz || i.run || i.stroll || i.look || m?.clicks?.length || m?.wheel || m?.buttons || moved);
}
/** The tick's seq while the clock moves; while it is held, the input sent so far ('h' and inputSeq). */
const seqKey = (s) => (isHeld(s) ? `h${inputSeq}` : `${s.clock.seq}`);
/** A page read's key (see above): `${tick}|${seq}|${ms}` while the clock moves, `${tick}|h<inputSeq>|${ms}` while it is held. */
const readKey = (s) => `${s.clock.tick}|${seqKey(s)}|${s.clock.ms}`;
let contactMemo = { key: null, cn: null };
/** The contact now (contactNow's { pending, last }), or null: read once a tick, never thrown. */
function contactRead(s = loop?.state) {
  if (!s) return null;
  const key = `${s.meta?.seed}|${s.clock.ms}|${seqKey(s)}`;
  if (contactMemo.key === key && contactMemo.state === s) return contactMemo.cn;
  let cn = null;
  try { cn = contactNow(s, s.clock.ms); } catch (e) { broke(e, 'the contact'); }
  contactMemo = { key, state: s, cn };
  return cn;
}
/** Whether a contact's window is open now (the take-in running: every key refused but Space and Esc). */
function windowOpen(s = loop?.state) { return !!contactRead(s)?.pending; }
// ---- the chaos (0.0.9: supp.js suppNow, read once a tick) ----
let suppMemo = { key: null, sn: null };
/** COMBAT §5's state of the player now (suppNow's record: the band, the startle, the flash, the deafness, the sum), or null: read once a tick, never thrown. */
function suppRead(s = loop?.state) {
  if (!s) return null;
  const key = `${s.meta?.seed}|${s.clock.ms}|${seqKey(s)}`;
  if (suppMemo.key === key && suppMemo.state === s) return suppMemo.sn;
  let sn = null;
  try { sn = SUPP.suppNow ? SUPP.suppNow(s, s.player?.id, s.clock.ms) : null; } catch (e) { broke(e, 'the chaos'); }
  suppMemo = { key, state: s, sn };
  return sn;
}
/** Whether the marine is startled now (COMBAT §5.7: every key refused but Space and Esc, as in a contact's window). */
function startledNow(s = loop?.state) { return !!suppRead(s)?.startle; }
// (0.0.8, the fixer's, after the runtime review: the pause's guard, as the cards' CARD_GUARD_MS. A key pressed by reflex
// as the target turns lands after a fast sheet's pause (the tier one's 0.05 s, the Raider's 0.10 s): X, the stop-motion
// key, put him back into real time, and digits mashed in the window chose rows he never saw. So for PAUSE_GUARD_MS of real
// time from when the page first sees the pause no key acts but Space and Esc, and a key that went down while the take-in
// ran, or in that guard, does nothing when it comes up (a digit's tap, R, T). The better the sheet, the surer a natural
// press took away the pause meant as its reward.)
/** The pause's guard (ms of real time from when the page first sees a contact's pause). */
const PAUSE_GUARD_MS = 350;
/** When the page first heard the shoot house's GO (performance.now(); 0.0.12: GO's guard), or -Infinity. */
let goSeenT0 = -Infinity;
let guardSeen = { id: null, winT0: -Infinity, pauseT0: -Infinity };
const keyDownAt = new Map();
addEventListener('keydown', (e) => { if (!e.repeat) keyDownAt.set(e.code, performance.now()); }, true);
/** Note when the page first sees a contact's window and its pause (each check and each frame). */
function guardNote(s = loop?.state) {
  const cn = contactRead(s), now = performance.now();
  const id = cn?.pending?.id ?? (s?.stop?.via === 'contact' ? cn?.last?.id : null) ?? null;
  if (id === null || id === undefined) return guardSeen;
  if (guardSeen.id !== id) guardSeen = { id, winT0: now, pauseT0: -Infinity };
  if (!cn?.pending && guardSeen.pauseT0 === -Infinity) guardSeen.pauseT0 = now;
  return guardSeen;
}
// (0.0.9: the startle's guard, the pause's twin: from when the page first sees a startle to its end, and for PAUSE_GUARD_MS
// after it in stop motion, no key acts but Space and Esc, and a key that went down in it does nothing on its way up)
let startleSeen = { id: null, t0: -Infinity, endT0: -Infinity, stop: false };
/** Note when the page first sees a startle and its end (each check and each frame). */
function startleNote(s = loop?.state) {
  const st = suppRead(s)?.startle ?? null, now = performance.now();
  if (st) { const id = `${st.fromMs}|${st.untilMs}`; if (startleSeen.id !== id) startleSeen = { id, t0: startleSeen.endT0 === -Infinity && startleSeen.id ? startleSeen.t0 : now, endT0: -Infinity, stop: false }; }
  else if (startleSeen.id && startleSeen.endT0 === -Infinity) { startleSeen.endT0 = now; startleSeen.stop = inStop(s); }
  return startleSeen;
}
/** Whether a key acts now (see above): never Space and Esc; refused inside the guard, or when it went down in the window or the guard. */
function pauseGuarded(action, e = null) {
  if (action === 'pause' || action === 'menu') return false;
  const g = guardNote(), now = performance.now(), down = e?.code ? keyDownAt.get(e.code) : undefined;
  // (0.0.9: the startle's)
  const sg = startleNote();
  if (sg.id && sg.endT0 === -Infinity) { frozePulseT0 = performance.now(); return true; }
  if (sg.id) {
    const until = sg.endT0 + (sg.stop || inStop() ? PAUSE_GUARD_MS : 0);
    if (now < until) return true;
    if (down !== undefined && down >= sg.t0 && down < Math.max(until, sg.endT0)) return true;
  }
  // (0.0.12: GO's guard: GO puts you in stop motion, so a key pressed in anticipation of it acts on nothing for PAUSE_GUARD_MS)
  if (goSeenT0 > -Infinity) {
    const goUntil = goSeenT0 + PAUSE_GUARD_MS;
    if (now < goUntil) return true;
    if (down !== undefined && down >= goSeenT0 - PAUSE_GUARD_MS && down < goUntil) return true;
  }
  if (g.pauseT0 === -Infinity) return false;
  const until = g.pauseT0 + PAUSE_GUARD_MS;
  if (now < until) return true;
  return down !== undefined && down >= g.winT0 && down < until;
}
// (0.0.10, the runtime review's: a walk key that went down in a startle or its guard and was held past it walked him once the
// startle ended (0.285 m off the 7 m point). It is let go in the key machine where it went down, so it walks only when
// released and pressed again, as a tap that went down in it does nothing; a key held from before the startle walks on)
const MOVE_CODES = new Set(BINDINGS.filter(b => b.kind === 'move').flatMap(b => b.codes));
const movesHeld = new Map();
addEventListener('keydown', (e) => { if (!e.repeat && MOVE_CODES.has(e.code)) movesHeld.set(e.code, performance.now()); }, true);
addEventListener('keyup', (e) => { movesHeld.delete(e.code); }, true);
addEventListener('blur', () => movesHeld.clear());
/** The walk keys that went down in the startle or its guard let go (each tick's poll, before the snapshot): the codes let go. */
function dropStartleMoves() {
  if (!movesHeld.size) return [];
  const sg = startleNote(), out = [];
  if (!sg.id) return out;
  // (pauseGuarded's own rule for a key's way up: down from the startle's first sight to the end of its guard)
  const until = sg.endT0 === -Infinity ? Infinity : Math.max(sg.endT0, sg.endT0 + (sg.stop || inStop() ? PAUSE_GUARD_MS : 0));
  for (const [code, at] of movesHeld) {
    if (at < sg.t0 || at >= until) continue;
    input.key(code, false);
    movesHeld.delete(code);
    out.push(code);
  }
  return out;
}
const fitInput = () => input.setStage(stage.canvas, stage.W, stage.H);
fitInput();
addEventListener('resize', fitInput);
// (every error is told; sim.noteError writes only a tick's or a skip's into the state: a render's never touches it, TECH §3.7)
loop = createLoop({ render, poll: () => { dropStartleMoves(); return input.snapshot(); }, bus, onError: (e, where) => { try { sim?.noteError(loop.state, e, where); } catch { /* (an error note that fails mustn't stop the game) */ } broke(e, where); } });
// (the run's log is the loop's first fast layer, so it sees every tick's own input, the fast-forward's and the handle's
// steps included: made before the sim registers its own, ui/runlog.js)
const runLog = createRunLog(loop, { onError: (e, where) => broke(e, where) });
// (the build sheet §1 item 11: every tick's input counted, the poll's and the handle's steps alike, so the page's reads
// keyed on it (readKey) are rebuilt while time stands still only when something was sent; it writes nothing in the state)
loop.register('fast', (s, inp) => { if (inputSent(inp)) inputSeq++; }, { name: 'input-seq', whileHeld: true });
sim = createSim({ loop, bus });
const label = (a) => input.label(a);
const instinct = createInstinct(hud, { label });
// (the weapon mode's HUD: the step panel with its weapon card, the reflex card in its place, the radio box, the PAPER inset, the plaque and its brackets)
const stepPanel = createSteps(hud, { label, labelOf: (id) => stepLabel(id), paintCard: (belief, far = {}, finish = null, other = null) => (belief?.model ? paintWeaponCard({ model: belief.model, finish, belief, k: 1, ...far, other }) : null),
  onPick: (step) => { if (!loop.paused && !boot.card && !splash?.active && inStop() && !windowOpen() && !startledNow() && !pauseGuarded('click')) { let st = null; try { st = stopNow(loop.state); } catch { /* (no stop motion: nothing to send) */ } if (st && !st.reflex) { sendStep(step, input.peek().run ? 'rushed' : 'normal', st); stepPanel.chosen(); } } } });
// (R7: NEXT clicked is T tapped)
stepPanel.onNext = () => { if (!loop.paused && !boot.card && !splash?.active && inStop() && !windowOpen() && !startledNow() && !pauseGuarded('click')) nextPress(); };
const reflexCard = createReflex(hud, { plaque, label });
const radio = createRadio(hud);
const paperInset = createPaper(hud);
const ticks = createTicks();
const aimPlaque = el('canvas', { className: 'plaque reticle', hidden: true }), pickBox = el('canvas', { className: 'plaque bracket', hidden: true }), aimBox = el('canvas', { className: 'plaque bracket', hidden: true });
const plaqueInfo = el('div', { className: 'plaque-info', hidden: true });
// (0.0.7: the terms' plate over the plaque at distance; the far window's label and the tick on its ring)
const termsPlate = el('canvas', { className: 'plaque terms', hidden: true });
const farLabelEl = el('canvas', { className: 'plaque farlabel', hidden: true }), farTickEl = el('div', { className: 'fartick', hidden: true });
hud.append(pickBox, aimBox, aimPlaque, termsPlate, plaqueInfo, farLabelEl, farTickEl);
// (0.0.8: the take-in's brackets (a pool, one a target taken in), the pale brackets of the others taken in at a pause, the
// stamp on the target, the plaque's lead (the contact's plate), a shot row's parts' plate, the coach's timer's paper)
const WINDOW_POOL = 6;
const windowBoxes = Array.from({ length: WINDOW_POOL }, () => el('canvas', { className: 'plaque bracket window', hidden: true }));
const takenBoxes = Array.from({ length: WINDOW_POOL }, () => el('canvas', { className: 'plaque bracket', hidden: true }));
// (0.0.9: the FROZE stamp beside your own figure's head at a startle's end)
const frozeEl = el('canvas', { className: 'plaque stamp froze', hidden: true });
const stampEl = el('canvas', { className: 'plaque stamp', hidden: true }), contactPlate = el('canvas', { className: 'plaque contact', hidden: true }), partsPlate = el('canvas', { className: 'plaque parts', hidden: true });
hud.append(...windowBoxes, ...takenBoxes, stampEl, frozeEl, contactPlate, partsPlate);
const timerPaper = createTimer(hud);
// (0.0.10: the hit card on the stress course, at the top left under the log's lines)
const hitCard = createHitcard(hud, { paint: paintHitcard });
// (a casualty's picture dimming at P and U: BODY §17.2's AVPU, wounds.js avpuOf; under the HUD, over the picture)
const fadeEl = el('div', { className: 'avpu-fade', hidden: true });
frameEl.insertBefore(fadeEl, hud);
const splashHud = createSplashHud(hud, { label });
// (the splash: TIME's timing driven in real time; the debug skips get the short time-lapse, so six $ presses are not six full splashes: my call)
const splash = createSplashControl({ timing: splashTiming, shortFor: (e) => e.activity === 'idle' });
hud.append(keysHint);
keysHint.append(el('kbd', { textContent: input.label('help') }), ' keys');

// ---- the sound: made at boot, suspended; nothing plays before the first key or click ----
const audio = createAudio({ profile: null, looks: { kitLook, earsOn: rangeKit.earsOn }, sound: params.sound, shot: settings.shot });
// (the context's construction opens the device synchronously, over 200 ms: paid here behind the title, never on the first key)
try { audio.prepare(); } catch (e) { console.warn('the sound was not prepared', e); }
// (the saved volume and mute; ?nostore=1 neither reads nor writes the database, so a bench or a shot opens none)
if (!settings.nostore) {
  store.getProfile().then((p) => {
    if (p?.audio) { audio.setVolume(p.audio.volume ?? audio.volume); audio.setMuted(!!p.audio.muted); }
  }).catch(() => {});
}
const wake = () => { audio.start(); removeEventListener('keydown', wake, true); removeEventListener('pointerdown', wake, true); };
addEventListener('keydown', wake, true);
addEventListener('pointerdown', wake, true);
let profileTimer = null;
function keepSound() {
  if (settings.nostore) return;
  clearTimeout(profileTimer);
  profileTimer = setTimeout(() => {
    store.updateProfile(p => ({ ...p, audio: { volume: audio.volume, muted: audio.muted } })).catch(e => console.warn('the sound settings were not saved', e));
  }, PROFILE_WRITE_MS);
}

const releases = new Map();                                          // (a pause reason held for each open card)
const boot = createBoot({ cb: {
  newCareer: (mode) => launch(newGame({ mode })),
  continueFrom: (slot) => continueFrom(slot),
  loadFile: async () => {
    const text = await store.importFile();
    if (!text) return;
    try { launch(store.markImported(fromJSON(text))); } catch (e) { toast(`That file won't load: ${e.message}.`, 'bad'); }
  },
  saveFile: () => { if (loop.state) toast(`Saved to ${store.exportFile(loop.state)}.`); },
  report: () => reportProblem(),
  resume: () => loop.pause(false, 'player'),
  // (0.0.9, the fixer's: a test scene ended from the Esc menu goes to its end card at once, as Enter does at its end)
  scene: () => (scene ? { id: scene.rec.id, ended: !!scene.ended } : null),
  // (0.0.9, the fixer's: "reduce flashes" turned from the menu, kept in this browser unless nostore)
  flashes: () => settings.reduceFlashes,
  setFlashes: (on) => { settings.reduceFlashes = !!on; view.setFlashes?.(settings.reduceFlashes); if (!settings.nostore) { try { localStorage.setItem('olympus.flashes', on ? 'reduced' : 'full'); } catch { /* (a private window: this session only) */ } } },
  // (R7: the step panel's layout, turned from the menu (A, B, C in turn) and kept in this browser unless nostore)
  panel: () => settings.panel,
  setPanel: (l) => { settings.panel = layoutOfWord(l); if (loop?.state) loop.state.$panel = settings.panel; if (!settings.nostore) { try { localStorage.setItem('olympus.panel', settings.panel); } catch { /* (a private window: this session only) */ } } },
  endScene: () => { if (!scene || scene.ended) return; scene.ended = true; scene.endNow = true; scene.byMenu = true; loop.pause(false, 'player'); },
  quit: () => quitToTitle(),
  overlay: (name, open) => {
    if (open) releases.set(name, loop.pauseFor(`overlay:${name}`));
    else { releases.get(name)?.(); releases.delete(name); }
    // (the R menu's keys and its listeners go with it, whatever closed it: its own Esc, a load, the title)
    if (!open && name === 'actions') closedActions();
    // (a card shows alone: the HUD and the toasts hidden under it at once, VIEWS §7.5; the frame keeps them so)
    hud.hidden = !!open || !loop.state;
    toasts.el.hidden = !!open;
  },
  keysRows: () => keysRows({
    label: (a) => input.label(a), panel: settings.panel,
    // (carried FH-8: in the shoot house the card leads with the house's block)
    scene: scene?.rec ?? null,
    // (R's words in this build, from the sim's own number)
    says: { hand: `what's at hand, as its plate says: an action, a door, else wait ${durationText(WAIT_MS)} (R twice); held: the menu of every action there` },
    extra: settings.debug ? DEBUG_SKIPS.map(([code, ms]) => [input.label(code), `debug: ${durationText(ms)} pass (marks the save)`]) : [],
  }),
  // (the hidden rolls only in debug, once the scene is over: tradecraft's)
  logLines: () => logLines(loop.state, { over: !!settings.debug && !!scene?.ended }),
  // (the built scenes: a stub's spec, ROADMAP "anywhere" step 4, waits for its layout; v0.0.25: a scene with `menu: false` is played by its
  // URL only until its ship rule is met (scenes.js test-zerocqb), the Tests menu leaving it out)
  scenes: () => SCENE_IDS.map(id => SCENES[id]).filter(rec => rec.menu !== false),
  playScene: (scene, { tier = null, par = null, loadout = null, draw = null, house = null, doors = null, rooms = null, layout = null, plans = null, qual = false, again = false } = {}) => (qual ? qualFirst(scene, tier, par) : playScene(scene, { tier, par, loadout, draw, house, doors, rooms, layout, plans, again })),
  // (0.0.18: the shoot house's loadout screen (cards/loadout.js): the code this browser kept (olympus.loadout, a convenience the sim
  // never reads), kept again on Kit up, and the screen's numbers from a fill of the lane with the code (loadout.js loadoutView))
  loadout: () => ({ code: loadoutOf(readLocal('olympus.loadout')).error ? 'standard' : codeOf(loadoutOf(readLocal('olympus.loadout'))),
    save: (c) => { if (!settings.nostore) { try { localStorage.setItem('olympus.loadout', c); } catch { /* (a private window: this session only) */ } } },
    // (the build sheet v0.0.20 item 23: the marine in the kit, the fill's own gear record and its dressed doll, beside the faces)
    preview: (c, tier) => { try { const s = newGame({ seed: 48213, scene: 'test-shoothouse', scenario: 'test-shoothouse', tier, setup: 'go', loadout: c }), pid = s.player.id, gear = GEAR.gearOf(s, pid); return { ...loadoutView(s, pid, loadoutOf(c)), gear, gearKey: GEAR.gearKey(gear), doll: gear ? loadoutDoll(s, pid, gear) : null }; } catch (e) { broke(e, 'the loadout'); return null; } },
    wh: (tier) => TEMPLATES.TEST_SHEETS?.[tier]?.values?.weapons ?? 10 }),
  // (0.0.8: a scene played as a sheet: the picker's sheets and their order, react's templates.js)
  sheets: () => ({ sheets: TEMPLATES.TEST_SHEETS ?? {}, order: TEMPLATES.PICKER_TIERS ?? null, hard: hardOfSheet,
    // (0.0.12: the shoot house's pars, the course's own numbers, and each sheet's default)
    parMs: COURSES.house?.pars ?? {}, parOf: (t) => COURSES.house?.parOfTier?.[t] ?? null }),
  sound: () => ({ volume: audio.volume, muted: audio.muted }),
  volume: (v) => { audio.setVolume(v); keepSound(); },
  mute: (on) => { audio.setMuted(on); keepSound(); },
} });
const toasts = createToasts(document.body);

function randomSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }

/**
 * A new career's state: { seed, mode, scenario ('barracks', a career's; 'sandbox' the test rooms), hour (the Mars
 * local hour at the live site to start at), at ({ area, x, z, face }: somewhere else than the scenario's start),
 * setup (test-handling's: null, 'hot' at string 1 aimed, 'bench' with one magazine of 15, 'mixed' a fourth of tracer), tier
 * (test-pairs' sheet, 0.0.8: 'recruit' … 'tierone'; null the scene's private), scene (a scene's spec, src/data/scenes.js:
 * its host, environment, hour and setup; ROADMAP "anywhere" step 4) }.
 */
function newGame({ seed = randomSeed(), mode = 'standard', scenario = 'barracks', scene = null, hour = null, at = null, setup = null, tier = null, par = null, env = params.env, loadout = null, opfor = null, draw = null, house = null, doors = null, rooms = null, layout = null, plans = null, again = false, breach = null, holdouts = null } = {}) {
  if (!scene && !SCENARIOS[scenario]) throw new Error(`no scenario '${scenario}'`);
  // (0.0.8: tier, test-pairs' sheet (null: the scene's private); scenes never write a career)
  // (ROADMAP "anywhere" step 2: the URL's &env=<preset> runs every game this page starts under that environment)
  // (0.0.12: par, the shoot house's (null: the sheet's own))
  // (0.0.18: loadout, the shoot house's (null: the standard))
  // (0.0.19: opfor, the shoot house's role-players by the URL (null: the scene's own, "Stack and clear, live"'s 'live'))
  // (draw, house and doors, the shoot house's drawn house (null: as set; the build sheet §0 item 54))
  // (rooms ('all'), layout ('B' | 'C') and plans ('derived'), each passed only when given (playScene's houseChoice orders them))
  // (again, the house's Again of the same lane, passed only when true: the v0.0.23 play review's first finding, playScene's
  // `again` dropped here, so the page never gave the short brief)
  // (breach, "Bang, then go"'s draw by the URL or the card's Again (null: the scene's own, 'drawn'), passed only when given)
  // (holdouts, "Away the boarding party"'s by the URL or the card's Again (null: drawn from the seed), passed only when given)
  const s = freshGame({ seed, mode, scenario, ...(scene ? { scene } : {}), hour, at, setup, version: VERSION, ...(tier ? { tier } : {}), ...(par ? { par } : {}), ...(env ? { env } : {}), ...(loadout ? { loadout } : {}), ...(opfor ? { opfor } : {}), ...(draw ? { draw } : {}), ...(house ? { house } : {}), ...(doors ? { doors } : {}),
    ...(rooms ? { rooms } : {}), ...(layout ? { layout } : {}), ...(plans ? { plans } : {}), ...(again ? { again: true } : {}), ...(breach ? { breach } : {}), ...(holdouts ? { holdouts } : {}) });
  // (the URL's &grav= set on the game before its first tick, its times from the start, added to the scene's own profile
  // (gravity.js addProfile; the fixer of v0.0.24's code review: setProfile alone replaced it, so test-burn lost its burn))
  if (gravList) addProfile(s, gravList);
  return s;
}
/** The URL's start somewhere else (&area=, &at=, &face=), or null: an area alone starts at its spawn. */
function atParam(scenario) {
  const areaId = params.area ?? (params.at && scenario === 'barracks' ? BARRACKS.area : null);
  if (!areaId) return null;
  const spawn = areaOf(areaId)?.spawn ?? null, [x, z] = params.at ?? (spawn ? [spawn.x, spawn.z] : [null, null]);
  if (x === null) return null;
  return { area: areaId, x, z, face: params.face ?? spawn?.face ?? 'down' };
}

// ---- launching: the state at once, the area behind a cut ----
let cutHeld = 0, launched = null, anchor = null;                    // (anchor: the report's, { json, seq })
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const liveArea = (s) => { const id = s?.places?.live?.area; try { return id ? areaOf(id) : null; } catch { return null; } };
// (where the player stands: a ground's chunks are built round it before the cut lifts)
const meAt = (s) => { const a = s ? playerActor(s) : null; return a ? { x: a.x, z: a.z } : null; };

/** Hold the cut while work runs (at most CUT_MAX_MS): resolves with the cut's real ms once it lifts. */
function holdCut(work, what) {
  const release = loop.pauseFor('cut');
  cutHeld++;
  const t0 = performance.now();
  return Promise.race([work, sleep(CUT_MAX_MS)])
    .catch((e) => broke(e, 'the area'))
    .then(() => {
      release(); cutHeld--;
      const ms = Math.round(performance.now() - t0);
      report.cutMs = ms;
      report.cuts.push({ area: what, ms });
      if (report.cuts.length > 16) report.cuts.shift();
      return ms;
    });
}

// ---- the test scenes: a goal on arrival, no saves, the end card once the scene's fact has come ----
let scene = null;                                                    // ({ rec: SCENES', seed, ended: false, shown: false } while a scene plays)
// (two scenes share test-handling's scenario: the mixed one is the game whose range issued the tracer)
const sceneOf = (s) => {
  if (!s?.meta?.scenario) return null;
  // (0.0.9: the banged pairs the game whose session has the setup 'bangs')
  const all = Object.values(SCENES).filter(x => x.scenario === s.meta.scenario), setup = s.armoury?.range?.mixed ? 'mixed' : String(s.armoury?.range?.setup ?? '').startsWith('bangs') ? 'bangs' : null;
  // ("Bang, then go" the house's game whose record carries R.house.bangGo, never another house's; its card, score and Again its own)
  const bang = !!s.armoury?.range?.house?.bangGo, fits = all.filter(x => !!x.breach === bang);
  return fits.find(x => (x.setup ?? null) === setup) ?? fits[0] ?? all[0] ?? null;
};
// (whether a scene's house can be other than the set from the page: its `draws` lists 'drawn', or it lists none)
const drawableOf = (rec) => !Array.isArray(rec?.draws) || rec.draws.includes('drawn');
/** Start a scene: a new game from its spec, at its hour (or the URL's), with the seed given or a new one, the URL's setup (else the scene's own), and a sheet's tier (test-pairs, 0.0.8). */
function playScene(rec, { seed = randomSeed(), hour = null, setup = null, tier = null, par = null, loadout = null, opfor = null, draw = null, house = null, doors = null, rooms = null, layout = null, plans = null, pool = null, again = false, breach = null, holdouts = null } = {}) {
  // (draw, house, rooms and layout as one choice (debug.js houseChoice, a drawn lane given no rooms taking scenes.js
  // HOUSE_ROOMS_DEFAULT, so qualified and "Again with a new seed" follow it); plans beside them, a lead's switch)
  // (`pool`, the end card's, a drawn code's room set kept with it; a scene played as set from the page (its `draws`
  // without 'drawn') given no other house)
  // (its build sheet §2 step 3: again, the house's Again of the same lane (its short brief), passed only when true; the end
  // card's rows that set it are v0.0.23 D's)
  const H = houseChoice({ draw, house, rooms, layout, pool }, { roomsDefault: SCENES_DATA.HOUSE_ROOMS_DEFAULT ?? 'a', drawable: drawableOf(rec) }).opts;
  // (breach, "Bang, then go"'s draw (the URL's, or the card's Again keeping its code), passed only when given: the scene's own, 'drawn', else)
  return launch(newGame({ seed, scene: rec.id, scenario: rec.scenario, hour: hour ?? rec.hour ?? null, setup: setup ?? rec.setup ?? null, tier, par, ...(loadout ? { loadout } : {}), ...(opfor ? { opfor } : {}), ...H, ...(doors ? { doors } : {}), ...(plans ? { plans } : {}), ...(again ? { again: true } : {}), ...(breach ? { breach } : {}), ...(holdouts ? { holdouts } : {}) }));
}

/** Play a state from here (new, loaded or imported). Resolves with it once its area shows (or the cut gives up). */
function launch(s, { from = null } = {}) {
  // (a qualification goes on only into the lane it launched itself; a save loaded, imported or continued ends it)
  qualAttempt = qualKeep(qualAttempt, { qual: qualLaunching, seed: s?.meta?.seed ?? null });
  boot.closeCard();
  boot.hideTitle();
  input.clear();
  toasts.clear();
  splash.clear(); splashPause(false);
  handArmedAt = null; handDown = null; tDown = null;
  resetWeaponHud();
  // (the runtime keys the sim reads, set where the state is made or loaded, before its first tick (the code review of
  // 2026-11-13: set only when the frame was drawn, the first ticks after a load ran on the defaults: the DI's keys, $gp))
  if (s) { s.$panel = settings.panel; if (settings.cycle) s.$cycle = settings.cycle; if (settings.houseLight) s.$houseLight = settings.houseLight; }
  // (the To score page's picks ride the state, never saved: the look, the corner aid)
  if (s) { if (lookSet(settings.look)) s.$look = settings.look; if (settings.aid !== 'rung') s.$aid = settings.aid; }
  // (the build sheet §1 item 15: the scene left behind let go of, so a long session of "Again"s holds nothing of it)
  const was = loop.state;
  if (was && was !== s) leaveScene(was);
  loop.setState(s);
  loop.pause(false, 'player');
  hud.hidden = false;
  // (a state saved mid-skip: its splash picks up from the clock, over the gap left)
  if (s.skip) splash.start({ id: s.skip.id, activity: s.skip.activity, kind: s.skip.kind, engine: s.skip.engine, fromMs: s.clock.ms, toMs: s.skip.toMs, where: s.skip.where, posture: s.skip.posture, mask: s.skip.mask, spotId: s.skip.spotId ?? null, chunkMs: s.skip.chunkMs ?? 0 }, splashContext(s, s.skip));
  const rec = sceneOf(s);
  scene = rec ? { rec, seed: s.meta.seed, ended: false, shown: false } : null;
  // (the build sheet v0.0.20 §0 item 21: the shot each scene plays: the URL's or the To score pick, else A3 in the house's scenes, else A1)
  try { audio.setShot(shotFor(rec?.id ?? s.meta?.scenario, settings.shot)); } catch (e) { broke(e, 'the sound'); }
  // (0.0.12: the shoot house's goal names your number two: the scene's houseGoal)
  let goal = rec?.goal ?? null;
  if (goal && s.armoury?.range?.course === 'house' && houseScene.houseGoal) { try { goal = houseScene.houseGoal(s) ?? goal; } catch (e) { broke(e, 'the goal'); } }
  // (carried FH-4: the goal whole, three lines at most (toasts.js push's kind, style.css .toast.goal))
  if (goal) toasts.push(goal, 'calm', { s: GOAL_S, kind: 'goal' });
  // (0.0.10, the runtime review's: "Bang"'s hit card dolls made at the load, so the first card of a string paints in one frame)
  // (0.0.18: and the shoot house's faces as they may be seen, and your #2 in his gear: hud/target.js warm; the view reset on every
  // launch, so a man held on the scene before is not shown on this one)
  try { targetView.reset(); if (s.armoury?.range?.stress || s.armoury?.range?.course === 'house') targetView.warm(s); } catch (e) { broke(e, 'the hit card'); }
  launched = { from, ticks: loop.stats.ticks, lost: loop.stats.lostTicks, checked: false };
  anchor = { json: toJSON(s), seq: s.clock.seq ?? null };            // (the state played from is the report's first anchor, until an autosave)
  // (a new career, or an imported file, is saved at once, so a reload's Continue finds it: v0.0.3's
  // first build wrote nothing until the first autosave, five minutes of play or a door away)
  if (!from) autosaveNow('launch');
  const area = liveArea(s);
  if (!area) return Promise.resolve(s);
  return holdCut(Promise.all([view.setArea(area, meAt(s)), view.prepareOwn(s)]), area.id).then(() => { prepareAround(area); return s; });
}

/**
 * The teardown of a scene left (the build sheet §1 item 15; the perf lens's P9): every read of the page that held the state
 * left is let go, so that state, and with it the debrief's trace (runtime, TRACE_MAX samples a lane, read by house-debrief.js alone:
 * syntax's TRACE_HOME), is the collector's at once rather than at each read's next tick. The run's export goes with its state: the
 * run log keeps one run, its state's (ui/runlog.js), dropped at the first tick of another.
 */
function leaveScene(was) {
  void was;
  contactMemo = { key: null, cn: null }; suppMemo = { key: null, sn: null }; houseMemo = { key: null, hn: null }; bundleMemo = { key: null, bn: null };
  simRead = { key: null }; pairsMemo = { key: null, pn: null }; stressMemo = { key: null, sn: null };
  // (and the reads keyed by the seed and the clock, not the state: "Again" on the same seed restarts clock.seq at 0, so the last
  // run's strip, AVPU, plaque and hit marks were served at the same ms and seq once the runs parted (the code review of 2026-11-16))
  stripMemo = { key: null, strip: null }; avpuMemo = { key: null, a: 'A' }; plaqueMemo = null; hitMemo.clear();
}

// (the sim moved the player into another area: the cut while the view shows it and paints the people met
// there for the first time, so nobody pops in once it lifts; then its neighbours prepared). The fact comes
// in the tick's player layer, before the actors layer makes the new area's people (people's syncActors),
// so their figures are asked for once the tick is over (a microtask: after the frame's ticks)
bus.on('area-enter', ({ area: id } = {}) => {
  const area = areaOf(id);
  if (!area || !loop.state) return;
  // (a move within the area shown, a debug go: nothing to cut to, and a cut would wait behind the areas being prepared)
  if (view.area?.id === id) return;
  const people = Promise.resolve().then(() => (loop.state ? view.prepareOwn(loop.state) : null));
  holdCut(Promise.all([view.setArea(area, meAt(loop.state)), people]), area.id).then(() => prepareAround(area));
});

// (the build sheet v0.0.25 §0 item 14: a deck change inside one area (places/hatch.js crossHatch's fact 'hatch', the Wreck's trunk)
// posts no area-enter, so no cut: when your eyes go through, the view's deck wipe (X-a), the camera with you, the deck in from the
// trunk's far end; the area already built, nothing sent; a teammate's own crossing changes nothing on the stage)
bus.on('hatch', (f = {}) => {
  if (!loop.state || !view.deckWipe) return;
  const meId = loop.state.player?.id, carried = f.pids ?? f.who ?? null;
  if (Array.isArray(carried) && !carried.includes(meId) && !carried.includes(playerActor(loop.state)?.id)) return;
  Promise.resolve().then(() => { const me = loop.state ? playerActor(loop.state) : null, to = f.to?.at ?? f.at ?? null; if (me) view.deckWipe(Array.isArray(to) ? { x: to[0], z: to[1] } : to && Number.isFinite(to.x) ? to : { x: me.x, z: me.z }); });
});
// (the areas a portal or a stair leads to from here, built into the view's cache one at a time while play runs)
let preparing = Promise.resolve();
function prepareAround(area) {
  const next = new Set();
  for (const p of area.portals ?? []) if (p.to?.area) next.add(p.to.area);
  for (const l of area.links ?? []) for (const st of l.stops ?? []) if (st.area) next.add(st.area);
  next.delete(area.id);
  for (const id of [...next].sort()) {
    const a = areaOf(id);
    if (a && view.prepare) preparing = preparing.then(() => view.prepare(a)).catch((e) => console.warn(`view: '${id}' was not prepared`, e));
  }
  return preparing;
}

async function continueFrom(slot) {
  try { await launch(await store.load(slot), { from: slot }); }
  catch (e) {
    if (e?.code === 'damaged') {
      try { const { state, from } = await store.recover(slot); toast(`That save is damaged: ${from} instead.`, 'warn'); await launch(state, { from }); return; }
      catch (e2) { toast(`That save is damaged, and nothing stands in for it (${e2.message}).`, 'bad'); return; }
    }
    toast(e?.code === 'missing' ? 'That save is gone.' : `That save won't load: ${e?.message}.`, 'bad');
  }
}

async function quitToTitle() {
  qualAttempt = null;                                                // (a qualification left for the title ends)
  // (the card that asked for the title goes with it: the end card's "Back to the title" (its 0) left the card on the title page, over
  // its buttons (the hunt of v0.0.20, P2, found on the way); the Esc menu closed its own before)
  boot.closeCard();
  await autosaveNow('live');
  splash.clear(); splashPause(false); scene = null;
  loop.setState(null);
  await showTitle();
}

async function showTitle() {
  hud.hidden = true;
  let saves = [];
  if (!settings.nostore) { try { saves = await store.list(); } catch (e) { console.warn('the save list did not load', e); } }
  boot.showTitle({ version: VERSION, saves });
}

// ---- saves ----
// (the live site's day key, which the body's readers take: its east longitude on Mars's clock, 'utc' on a ship or at the Phobos
// School (v0.0.24's stage 0, jobs.js siteDayOf); an unknown site throws, never a quiet 0)
const lonAt = (s) => siteDayOf(s);
/** The line a save shows in the lists: 'Standard · Sol 590 MY 211 · 12:44 · 02:24Z · Echo Company barracks, ground floor'. */
function about(s) {
  const c = timeAt(siteAt(s), s.clock.ms), pad = (n) => String(n).padStart(2, '0');
  // (the slip as the watch shows it, '24:00 +24': one moment, one number on every screen; the day on the site's clock)
  const hhmm = c.timeslip ? `24:00 +${Math.floor(c.slipMs / MIN_MS)}` : `${pad(c.hour)}:${pad(c.minute)}`;
  return [s.meta.mode === 'ironman' ? 'Ironman' : 'Standard', c.mars ? `Sol ${c.mars.solOfYear} MY ${c.mars.my}` : c.dateLabel, hhmm, `${utcClockText(s.clock.ms)}Z`, liveArea(s)?.name ?? '?'].join(' · ');
}
let saving = null, due = null;
async function autosaveNow(why = 'live') {
  const s = loop.state;
  if (!s) return null;
  anchor = { json: toJSON(s), seq: s.clock.seq ?? null };            // (the report's anchor: the last autosave, written or not)
  if (settings.nostore || sceneOf(s)) return null;                    // (a test scene saves nothing: the build sheet 0.0.4 §8, item 24)
  if (saving) await saving;                                          // (one write at a time)
  saving = store.autosave(s, about(s), { why }).catch(e => { console.warn('autosave failed', e); return null; }).finally(() => { saving = null; });
  return saving;
}
bus.on('autosave', ({ why = 'live' } = {}) => {
  if (!due || (WHY_RANK[why] ?? 1) > (WHY_RANK[due.why] ?? 1)) due = { why, at: due?.at ?? performance.now() };
});
// (after the frame's ticks: one write a frame at most; a live one waits for a quiet frame)
// (a 'live' or 'day' one waits for a quiet frame: TECH §7.4 writes the day slot "at the first quiet frame after local 00:00")
const WAITS_QUIET = new Set(['live', 'day']);
function autosaveDue(info) {
  if (!due || !loop.state || saving) return;
  const quiet = (info.ticks ?? 0) <= 1 && !info.held;
  if (!WAITS_QUIET.has(due.why) || quiet || performance.now() - due.at >= QUIET_WAIT_MS) { const why = due.why; due = null; autosaveNow(why); }
}
// (what is said: the sim's log records and lines, and the page's own, as toasts)
// (a debug skip says so in its own log line, '[debug] skipped 1 h', the honesty mark's: its end gives no
// second toast, so six $ presses on a morning walk are six lines, not twelve)
// (in a skip, what the log says waits: the splash's ticker has shown it, so on landing only what came at
// its last second (the cause: the klaxon, reveille) and the activity's own line go up as toasts, not
// taps from four hours ago (the review of v0.0.4); a debug skip's idle line is its '[debug]' line's twin)
let debugSkip = false, heldLog = null;
// (the log's records of what was said: the radio box shows them, so no toast says them twice)
const VOICE_KINDS = new Set(['pa', 'speech', 'radio', 'say', 'bark']);
bus.on('log', ({ entry } = {}) => {
  if (entry?.kind === 'debug' && /skipped/.test(entry.text ?? '')) debugSkip = true;
  // (a roll: a toast only for a shot, a failure that is not routine; the rest is in J, folded: the build sheet 0.0.5 §2.4)
  if (entry?.kind === 'roll') { const t = rollToast(entry); if (t && !loop.state?.skip) toast(t.text, t.tone); return; }
  if (!entry?.text) return;
  if (VOICE_KINDS.has(entry.kind)) return;                         // (what was said is in the radio box, and in J)
  // (0.0.8: a contact's sum is the plaque's lead, the stamp and the line's "Contact · 0.55 s." in the picture, and in J whole: no toast says it again)
  if (entry.kind === 'contact') return;
  // (0.0.9: a startle's sum is FROZE in the picture and in J whole: felt is never a number on the HUD)
  if (entry.kind === 'startle') return;
  // (0.0.10: a Breathe's record says the chaos's fall, a number: its head alone in the toasts ("Breathed 4.0 s."), the whole in J)
  if (entry.kind === 'breathe') { const m = /^(.*?):/.exec(entry.text); toast(m ? `${m[1]}.` : entry.text, 'calm'); return; }
  if (loop.state?.skip) { if (entry.kind === 'activity' && debugSkip) return; (heldLog ??= []).push(entry); return; }
  toast(entry.text, entry.tone);
});
/**
 * A roll's toast, or null: a shot's (its line, the hole's word, the hole's tone on a card), a failure that is not
 * routine and a look that found a stoppage or a round, each in the action's words (warn); routine handling and
 * passes stay in the log; a hidden roll (a failed look: SKILLS §5.14) never shows (the parity review's).
 */
function rollToast(entry) {
  const line = rollLine(entry), r = entry.roll;
  if (!line || !r || hiddenRec(entry) || entry.short) return null;
  // (0.0.10, the runtime review's: on the stress course, while a string runs, the hit card is the marine's belief, so a round at
  // a turner says only what he could tell, seen to strike or not, with the roll's numbers; the zone stays in J and in the truth
  // from the string's end (the paper, the card): the user's answer A, "belief then truth")
  if (r.skill === 'marksmanship' && entry.paper !== undefined && beliefNow()) return { text: checkShort({ ...r, verb: entry.paper ? 'seen to strike.' : 'not seen.' }), tone: 'note' };
  if (r.skill === 'marksmanship') return { text: entry.text ?? line.short, tone: entry.paper !== undefined ? entry.tone : r.ok ? 'note' : 'warn' };
  if (r.kind === 'check' && !r.ok && !r.routine) return { text: line.words ?? line.short, tone: 'warn' };
  // (a look that found something: a stoppage or a round is a warning; what a magazine in the hand holds is news (0.0.6))
  if (entry.found && line.words) return { text: line.words, tone: entry.step === 'lookMag' ? 'note' : 'warn' };
  return null;
}
/** Whether the hit card is in belief now: the stress course, a string turned and not over. */
function beliefNow(s = loop?.state) {
  const R = s?.armoury?.range, st = R?.stress ? R.str : null;
  return !!st && !st.done && st.turnedMs !== null && st.turnedMs !== undefined;
}
bus.on('line', ({ text, kind = '' }) => toast(text, kind));
// (an activity's own log line says what passed; the plain skips, which have none, still say how long)
// (a chain is one errand: one toast for it, "Brush teeth, shave, wash face · 7 min.", its steps' own lines kept in J
// and the splash's strip; the fixer's, 0.0.6: three toasts listed it as a list again)
bus.on('skip-end', (e) => {
  const held = heldLog ?? [];
  heldLog = null;
  const chain = Array.isArray(e.outcome?.chain) && e.outcome.chain.length > 1 ? e.outcome.chain : null;
  if (chain) {
    const word = (c) => ACTIVITIES[c.id]?.offer ?? c.id, done = chain.filter(c => c.by !== 'dropped').map(word), dropped = chain.filter(c => c.by === 'dropped').map(word);
    const said = done.join(', ');
    toast(`${said.charAt(0).toUpperCase()}${said.slice(1)} · ${durationText(e.toMs - e.fromMs)}${dropped.length ? `; ${dropped.join(', ')} dropped` : ''}.`);
  }
  for (const entry of held) if ((entry.kind === 'activity' && !chain) || entry.kind === 'debug' || entry.atMs >= e.toMs && entry.kind !== 'activity') toast(entry.text, entry.tone);
  if (debugSkip) { debugSkip = false; return; }
  if (e.toMs > e.fromMs && (!e.activity || e.activity === 'idle' || !ACTIVITIES[e.activity])) toast(`${durationText(e.toMs - e.fromMs)} pass (${e.minutes ?? Math.floor((e.toMs - e.fromMs) / MIN_MS)} minutes stepped).`);
});
bus.on('door', (f) => { try { audio.door(f, loop.state); } catch (e) { broke(e, 'the sound'); } });
// (the weapon mode's facts: the voices to the radio box and the tower's chime, the steps' ticks and clicks, the shot's report, the range's faults and strings)
bus.on('say', (f) => {
  radio.say(f?.text ? { ...f, text: shipWords(String(f.text), loop.state) } : f, loop.state);
  // (who speaks, for his line's bubble over his head (speakerHud): v0.0.24, every line in every scene, the user's "text bubble only";
  // a loudspeaker's line at the fact's `at`; a speaker with no body and no place (a ship's 1MC: { who: null, speaker: '1MC' }) at the
  // top of the picture, his name before his words)
  const by = f?.who ?? (f?.speaker ? `pa:${f.speaker}` : null);
  if (loop.state && by && f.text) {
    // (the build sheet v0.0.25 item 11: a line whose speaker has no body on the stage (the 1MC's, who null; the cadre's from the Shed's
    // gallery) at the speaker fixture of your compartment where the place has them (the area's `speakers`, the Wreck's), else as before)
    const off = !f.who || !(loop.state.actors?.list ?? []).some(a => a.who === f.who);
    const at = f.at && Number.isFinite(f.at.x) ? f.at : (off ? speakerAt(loop.state) : null) ?? (f.who ? null : 'top');
    // (a bodiless speaker's name before its words only at the picture's top, where nothing else says who; at its loudspeaker the
    // bubble is the speaker's (v0.0.25's fixer: the play review's "1MC: BRACE …" under the radio box's "1MC")); on the Wreck a hatch's
    // words for a door's (shipWords)
    const said = shipWords(f.who || at !== 'top' ? String(f.text) : `${f.speaker}: ${f.text}`, loop.state);
    speech.push({ who: by, text: said, atMs: loop.state.clock.ms, spokenMs: spokenMs(f.text), ...(at ? { at } : {}) });
    if (speech.length > SPEECH_KEPT) speech.splice(0, speech.length - SPEECH_KEPT);
  }
  // (0.0.10: the coach's "Bang!" is a shout, captioned (VIEWS §11.4): the radio box has his words, the toast what it sounded like)
  if (loop.state?.armoury?.range?.stress && /^Bang!/.test(String(f?.text ?? ''))) toast(`[a shout: ${String(f.text).trim()}]`, 'warn');
  try { audio.fact('say', f, loop.state); } catch (e) { broke(e, 'the sound'); }
});
bus.on('step', (f) => {
  if (f?.who === loop.state?.player?.id) { ticks.fact(f); if (f.phase === 'end' && f.step === 'aim') showPlaqueInfo(); }
  try { audio.fact('step', f, loop.state); } catch (e) { broke(e, 'the sound'); }
});
bus.on('shot', (f) => { try { audio.fact('shot', f, loop.state); } catch (e) { broke(e, 'the sound'); } });
// (0.0.7: the pits' carriers, heard over the berm)
bus.on('pit', (f) => { try { audio.fact('pit', f, loop.state); } catch (e) { broke(e, 'the sound'); } });
bus.on('stop-mode', () => { stepPage = 0; hoverKey = null; });
// (0.0.8: the turner's motor, clack and the timer's beep; a step chosen after a contact's pause ends the plaque's lead)
bus.on('turner', (f) => { try { audio.fact('turner', f, loop.state); } catch (e) { broke(e, 'the sound'); } });
// (0.0.9: a bang's report, and where it went off: the white's afterimage stands there)
let lastBurst = null, lastBlank = null;
bus.on('fx', (f) => {
  // (0.0.10: the stress course's horn and blanks, heard through the defenders; a blank's moment for the bench's row)
  if (f?.kind === 'horn' || f?.kind === 'blank') {
    if (f.kind === 'blank') lastBlank = { atMs: f.atMs ?? loop.state?.clock?.ms ?? null };
    try { audio.fact('fx', f, loop.state); } catch (e) { broke(e, 'the sound'); }
    return;
  }
  if (f?.kind !== 'bang') return;
  lastBurst = Number.isFinite(f.x) && Number.isFinite(f.z) ? { x: f.x, z: f.z, atMs: f.atMs ?? null } : lastBurst;
  try { audio.fact('fx', f, loop.state); } catch (e) { broke(e, 'the sound'); }
});
bus.on('step', (f) => { if (f?.who === loop.state?.player?.id && f.phase === 'start') stepChosenMs = Number.isFinite(f.fromMs) ? f.fromMs : loop.state?.clock?.ms ?? null; });
bus.on('reflex', (f) => { if (f?.phase === 'offer') reflexKeep = false; });
// (0.0.12: the shoot house's lane and the drill's bundles: heard (audio/house.js); GO's guard from the page's first sight of GO; the
// instructor's faults as tags, his words in the radio box)
bus.on('house', (f) => {
  // (and the brief's toast cleared at GO: the lane's words are the instructor's from here (the play review of 2026-11-13))
  if (f?.phase === 'go') { goSeenT0 = performance.now(); toasts.clear(); }
  // (the fault's tag in its words (FAULT_WORDS: "Fault: stopped in the door"), held while a take-in's window runs and shown at
  // its end, as the sim holds the instructor's word (COMBAT §25.4.5: no words in the window; the fixer's of 0.0.12))
  if (f?.phase === 'fault' && f.text) { const t = `Fault: ${houseScene.FAULT_WORDS?.[f.kind] ?? f.kind ?? 'the lane'}`; if (windowOpen()) faultsOwed.push(t); else toast(t, 'warn'); }
  try { audio.fact('house', f, loop.state); } catch (e) { broke(e, 'the sound'); }
});
bus.on('bundle', (f) => { try { audio.fact('bundle', f, loop.state); } catch (e) { broke(e, 'the sound'); } });
bus.on('range', (f) => {
  if (!f) return;
  if (f.phase === 'string') lastString = { n: f.n, score: f.score, of: f.of, v: f.v, shots: f.list ?? [] };
  else if (f.phase === 'cmd' && f.hot) lastString = null;
  // (a fault's words are the coach's, in the radio box: the toast is a short tag, so the sentence is not on the
  // screen twice (the runtime review's))
  else if (f.phase === 'fault') toast(`${f.kind === 'stop' ? 'Stopped' : 'Fault'}: ${(f.rule === 'time' && f.fired ? FAULT_WORD.timeFired : null) ?? FAULT_WORD[f.rule] ?? f.rule ?? 'the line'}`, f.kind === 'stop' ? 'bad' : 'warn');
});
/** A range fault's tag (carry.js rangeSafety's rules, the scene's own): rule → words (handling.js STOP_WORDS, the end card's too). */
const FAULT_WORD = STOP_WORDS;
// (the splash hears TIME's facts at once: on skip-start the target is held at its start, so the loop's first outcome frame never runs the whole skip)
bus.on('skip-start', (e) => {
  const s = loop.state;
  // (a clean at the armoury's canopy takes no spot of its own (upkeep.js): its table is the scene's (armoury-day.js armourySplashSpot),
  // so the splash frames it and its vignette finds the mat's table)
  const spotId = e.spotId ?? armourySplashSpot(s);
  if (spotId && !e.spotId) e = { ...e, spotId };
  splash.start(e, splashContext(s, e));
  loop.skipTarget(e.engine === 'ff' ? null : e.fromMs);
});
bus.on('skip-frame', (e) => splash.lines(e.ticker));
// (a chain's steps: each one's parts join the splash's as it begins; Backspace's stop decelerates its clock to the running step's end)
bus.on('chain', (f) => {
  if (f?.phase === 'step' && loop.state) splash.steps(splashContext(loop.state, {}).parts);
  else if (f?.phase === 'stop') splash.chainStop(f);
});
bus.on('skip-interrupt', (e) => splash.interrupt(e));
bus.on('skip-end', (e) => splash.end(e));
for (const type of ['body-event', 'reveille']) bus.on(type, (f) => { try { audio.fact(type, f, loop.state); } catch (e) { broke(e, 'the sound'); } });
// (a scene's end: its fact noted, the card once the splash has played out)
for (const type of endFacts(SCENES)) bus.on(type, (f) => { if (scene && !scene.ended && endsScene(scene.rec.endOn, type, f)) scene.ended = true; });

/** The bug report (store.js reportOf, TECH §7.6), the menu's and the debug handle's alike: the anchor, the errors, the stats, the renderer, the engine, the screen, the density. */
async function buildReport() {
  const s = loop.state;
  if (!s) return null;
  // (the sim's errors are in the state; the page's (a render's, a listener's) only in told: both go)
  const pageErrors = [...told].map(m => String(m).split('\n')[0]).filter(m => !(s.meta.errors ?? []).some(e => e.endsWith(`: ${m}`)));
  return store.reportOf(s, {
    anchor: anchor?.json ?? null, anchorSeq: anchor?.seq ?? null, errors: [...(s.meta.errors ?? []), ...pageErrors.map(m => `page: ${m}`)],
    stats: { view: view.stats, loop: { ...loop.stats }, sim: { ...sim.stats }, painter: painter.stats, uploads: uploads.stats, audio: { ...audio.stats } },
    renderer: stage.stats.gpu, screen: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio, picture: [stage.W, stage.H] }, ppm: PX_PER_M,
    engine: await store.engineInfo().catch(() => null),
  });
}
async function reportProblem() {
  const r = await buildReport();
  if (r) toast(`Report written to ${store.exportReport(r)}: send it with what you saw.`);
}

// ---- what is said: lines at the top left, 16 s of play each, three at most (src/ui/hud/toasts.js) ----
const TONES = { '': 'note', note: 'note', warn: 'warn', bad: 'bad', urgent: 'urgent', calm: 'calm' };
function toast(text, kind = '') { return toasts.push(shipWords(text, loop?.state), TONES[kind] ?? 'note'); }
// (an error in a tick, a frame or a listener: told once, the game carries on; Esc, then Report a problem)
const told = new Set();
function broke(e, where = 'tick') {
  console.error(`OLYMPUS: ${where} broke`, e);
  if (told.has(e?.message)) return;
  told.add(e?.message);
  toast(`Something in the game broke (${e?.message}). It carries on; Esc, then Report a problem, to send it.`, 'bad');
}

// ---- the keys ----
// (R: what its plate said when the key went down. A door, the quick action, getting up, the resume go on
// the tap (the key going up under TAP_MS); the wait asks for a second R within HAND_AGAIN_MS, "R again:
// wait 15 min", so R a step short of a door, or just past one, never waits by accident. Held TAP_MS
// wherever handMenu has a row: the menu (cards/actions.js); with none (lying: R gets you up) what the tap
// does. An offer that would make you late: the late card. The sim drops the action if the offer has
// changed kind by its tick: places' hand.js)
let handArmedAt = null, handDown = null, tDown = null;
const currentOffer = () => { try { return loop.state ? handOffer(loop.state) : null; } catch { return null; } };
const canAct = () => !!loop.state && !loop.paused && !splash.active;
function handPress(kind) {
  if (kind === 'down') { handDown = canAct() ? currentOffer() : null; return; }
  const o = handDown;
  handDown = null;
  if (!o || !canAct()) return;
  if (kind === 'held' && openActions()) return;
  if (o.late) { openLate(singleLate(o), (late) => ({ act: 'activity', args: { id: o.id, spotId: o.spotId ?? null, args: o.args ?? {}, late, lead: true } })); return; }
  if (o.verb === 'wait') {
    const now = performance.now();
    if (handArmedAt !== null && now - handArmedAt <= HAND_AGAIN_MS) { handArmedAt = null; input.queue(wantOf(o)); }
    else handArmedAt = now;
    return;
  }
  handArmedAt = null;
  input.queue(wantOf(o));
}
// (T: the line shown when the key went down, tapped; its chip, held)
function instinctPress(kind) {
  if (kind === 'down') { tDown = canAct() ? instinctNow(loop.state) : null; return; }
  const seen = tDown;
  tDown = null;
  if (!canAct()) return;
  if (kind === 'tap') {
    input.queue({ act: 'instinct', args: { id: seen?.line?.id ?? null, act: seen?.line?.act ?? null } });
    // (its build sheet item 12, carried FH-3: a line that names a row and leaves it to you ("Press it."): T pulses that row's
    // tile on the panel, the NEXT tile saying "6: yours. T never shoots."; the sim gets the same input as before)
    if (seen?.line && !seen.line.act && seen.line.row) stepPanel.pulse(seen.line.row);
  }
  else if (kind === 'held' && seen?.chip) input.queue({ act: 'instinct', args: { id: seen.chip.id ?? null, act: seen.chip.act ?? null, chip: true } });
}
// (the splash's keys: Space, Enter or a click to the end; Backspace stop here; T on the strip's "carry on"; Esc the menu)
function splashKey(action, kind) {
  if (action === 'menu') { boot.openMenu(); return; }
  if (action === 'pause') { splash.toEnd(); return; }
  if (action === 'instinct' && kind === 'tap') {
    if (splash.chunk()) input.queue('skip:chunk');                  // (the strip's offer: the pause lets go for the tick that takes it)
    else if (splash.chunkable()) input.queue('skip:chunk');         // (during the lapse: the engine's own chunk)
  }
}
input.onAction((action, kind, e) => {
  if (!loop.state) { if (action === 'menu') boot.back(); return; }  // (the title's pages: Esc goes back)
  if (boot.card) {                                                   // (a card is open: its keys)
    const own = (action === 'help' && boot.card === 'keys') || (action === 'log' && boot.card === 'log') || (action === 'sheet' && boot.card === 'sheet') || (action === 'inventory' && boot.card === 'inventory');
    if (action === 'menu' || own) { const was = boot.card; boot.closeCard(); if (was === 'menu') loop.pause(false, 'player'); if (was === 'score' && scene?.ended) openEnd(); }
    else if (kind === 'digit') boot.digit(Number(action.slice(6)));
    return;
  }
  if (splash.active) { splashKey(action, kind); return; }
  // (0.0.8: a contact being taken in: Space and Esc alone, COMBAT §25.4.5; and the pause's guard (see pauseGuarded))
  if ((windowOpen() || startledNow()) && action !== 'pause' && action !== 'menu') return;
  if (guardedFlash(action, e)) return;
  // (0.0.12: V in the house cycles the movement stances, Relaxed, Combat, Assault (the sim's gait), in and out of stop motion)
  if (action === 'carry' && kind !== 'up' && stancesNow() && !loop.paused) { input.queue('gait'); return; }
  // (the surprise's free card answers its digits in stop motion too, where it is shown in the panel's place unless a reflex card of the
  // stop's own is up: the fixer of v0.0.24's code review, a card holding time unseen and unanswerable in weapon mode)
  if (!loop.paused && !(inStop() && stopReflexUp()) && gravCardKey(action, kind)) return;
  if (inStop() && !loop.paused && stopKey(action, kind, e)) return;
  if (action === 'pause') loop.togglePause('player');
  else if (action === 'menu') boot.openMenu();
  else if (action === 'help') boot.openKeys();
  else if (action === 'log') boot.openLog();
  else if (action === 'sheet') openSheet();
  else if (action === 'inventory') openInventory();
  else if (action === 'hand') handPress(kind);
  else if (action === 'instinct') instinctPress(kind);
});
// (stop motion's keys, the build sheet 0.0.5 §2.4: a digit tapped is the step the panel shows on it at its normal
// tempo, rushed with Shift (read as the key went down), held careful (Fire held: hold and fire); 0 pages the singles
// past nine; in a reflex card a digit answers it and R flips keep. Returns whether the key was stop motion's)
/** The panel's decisions seen (R7: a new key at each stop's 'choose', so its navigation starts again there). */
const panelSeen = { seq: 0, phase: null, via: null };
let stepPage = 0, digitShift = false, reflexKeep = false, hoverKey = null, lastString = null, plaqueMemo = null, stepChosenMs = null;
// (the plaque's list of the DC's parts and the modifiers, for the keys as for the mouse: shown PLAQUE_INFO_MS of real
// time after an aim ends and whenever the brackets move (the design review's: by the keys it never showed); the last
// input, a key or the mouse, names the plaque's call to fire; the plaque's own rectangle, hovered as its target)
const PLAQUE_INFO_MS = 2500;
let infoUntil = 0, lastInput = 'key', plaqueRect = null;
const showPlaqueInfo = () => { infoUntil = performance.now() + PLAQUE_INFO_MS; };
addEventListener('keydown', () => { lastInput = 'key'; }, true);
addEventListener('pointermove', (e) => { if (e.movementX || e.movementY) lastInput = 'mouse'; }, true);
function resetWeaponHud() { stepPage = 0; digitShift = false; reflexKeep = false; hoverKey = null; lastString = null; plaqueMemo = null; stepChosenMs = null; stampSeen = null; frozeSeen = null; lastBurst = null; lastBlank = null; hitSeen = { sig: null, t: -Infinity, stop: false, shown: null }; startleSeen = { id: null, t0: -Infinity, endT0: -Infinity, stop: false }; ticks.reset(); radio.clear(); }
// (ROADMAP "anywhere" step 6: the surprise's card out of stop motion (gravity.js gravCardOf): a digit pressed answers it, as the reflex
// card's digit does; the card holds time, and nothing else hears the digits while it is up)
// (a reflex card of stop motion's own is up (stopNow's reflex))
function stopReflexUp() { try { return !!stopNow(loop.state)?.reflex; } catch { return false; } }
function gravCardKey(action, kind) {
  let card = null;
  try { card = loop.state ? gravCardOf(loop.state) : null; } catch { card = null; }
  if (!card || !action.startsWith('digit:')) return false;
  if (kind === 'digit') { const o = reflexCard.optionFor(Number(action.slice(6))); if (o && !o.off) input.queue({ act: 'grav', args: { card: o.key } }); }
  return true;
}
function stopKey(action, kind, e) {
  const s = loop.state;
  let st = null;
  try { st = stopNow(s); } catch { st = null; }
  if (!st) return false;
  if (action === 'hand' && st.reflex) { if (kind === 'down') reflexKeep = !reflexKeep; return true; }
  if (!action.startsWith('digit:')) return false;
  const n = Number(action.slice(6));
  // (2026-11-13, the rework's R7: a digit going down moves the panel's navigation (a group's tab, a ▸, home, the pager) at once,
  // and its tap or hold then does nothing more; any other key's entry is noted as it goes down, so a fan let go between the
  // digit's down and its up still sends the row that was under it)
  if (kind === 'digit') {
    digitShift = !!e?.shiftKey || input.peek().run;
    if (!st.reflex) { if (stepPanel.down(n)) navDown.add(n); else downEntry.set(n, stepPanel.entryFor(n)); }
    return true;
  }
  if (kind !== 'tap' && kind !== 'held') return true;
  if (st.reflex) {
    const o = reflexCard.optionFor(n);
    // (an answer shown struck says why (Transition "not carried", a man with no pistol; a Breach "no charge issued"), never nothing)
    if (o?.off) toast(`${o.label}: ${o.off}.`, 'warn');
    else if (o) input.queue({ act: 'stop', args: { step: `reflex:${o.key}`, keep: reflexKeep } });
    return true;
  }
  if (navDown.delete(n)) return true;
  const entry = downEntry.has(n) ? downEntry.get(n) : stepPanel.entryFor(n);
  downEntry.delete(n);
  if (!entry) return true;
  // (NEXT: T's act, as T tapped (VIEWS §7.8.1: T is never the only way))
  if (entry.core === 'next') { if (entry.live) nextPress(); return true; }
  const step = entry.row;
  if (!step) return true;
  // (a struck row's digit says why, never nothing (the runtime and parity reviews': the key looked dropped))
  if (step.off) { refusedStep(step, entry); return true; }
  sendStep(step, kind === 'held' ? 'careful' : digitShift ? 'rushed' : 'normal', st);
  // (a row set at no time (a variant: the entry's stance, the breach, the standing order) keeps its group open, so its new
  // state shows where it was pressed (the play review of 2026-11-13: one press set Careful and the group closed, no word)
  if (step.kind !== 'variant') stepPanel.chosen();
  return true;
}
/** The digits whose going down moved the panel's navigation (their tap does nothing more), and each other digit's entry as it went down. */
const navDown = new Set(), downEntry = new Map();
/** NEXT pressed: T's act now, as T tapped would send it. */
function nextPress() {
  if (!canAct()) return;
  const now = instinctNow(loop.state);
  input.queue({ act: 'instinct', args: { id: now?.line?.id ?? null, act: now?.line?.act ?? null } });
}
// (R7's keys of the panel itself, ahead of the game's (capture): layout C's fan while Tab is held, layout B's banks on R C B F by
// physical code (the same keys on AZERTY), Esc or Backspace back to the band where a group is open; only in stop motion with
// the panel up (no reflex card), and nothing else hears them then)
function panelKeyOwned(e) {
  if (!loop?.state || boot.card || splash.active || loop.paused || e.metaKey || e.ctrlKey || !inStop() || windowOpen() || startledNow()) return false;
  let st = null;
  try { st = stopNow(loop.state); } catch { return false; }
  return !!st && !st.reflex;
}
addEventListener('keydown', (e) => {
  if (e.code === 'Tab' && settings.panel === 'c' && panelKeyOwned(e)) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) stepPanel.fan(true); return; }
  if ((e.code === 'Escape' || e.code === 'Backspace') && panelKeyOwned(e) && (stepPanel.where?.nav?.group || stepPanel.where?.nav?.deep)) { e.preventDefault(); e.stopImmediatePropagation(); stepPanel.back(); return; }
  if (settings.panel === 'b' && BANK_CODES[e.code] && panelKeyOwned(e)) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) stepPanel.bank(BANK_CODES[e.code]); }
}, true);
addEventListener('keyup', (e) => {
  if (e.code === 'Tab' && stepPanel.fanHeld) { e.preventDefault(); e.stopImmediatePropagation(); stepPanel.fan(false); return; }
  if (settings.panel === 'b' && BANK_CODES[e.code] && panelKeyOwned(e)) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
addEventListener('blur', () => stepPanel.fan(false));
/** A struck step chosen: its row flashed, its reason said (Fire on safe in WEAPONS §4.4's words), and the remedy's key where its badge has one (R7). */
function refusedStep(step, entry = null) {
  stepPanel.flash?.(step.id);
  const rk = entry?.badge ? badgeKey(entry.badge, settings.panel) : null;
  // (0.0.8: the shot rows above your Marksmanship, folded into one row: what training buys)
  toast(step.kind === 'fire' && step.off === 'on safe' ? `${REFUSALS.safety}${rk ? ` Off safe: ${rk}.` : ''}` : step.kind === 'gated' ? `Not yet: your Marksmanship is under ${step.label.replace(/ (\d+)/g, ' (Marksmanship $1)')}.` : `${step.label}: ${step.off}.${rk ? ` → ${rk}` : ''}`, 'warn');
}
/** A step chosen (a digit, a click on its row): { act: 'stop', args: { step, tempo, target } }, the aim at the bracketed target, Fire held as hold and fire. */
function sendStep(step, tempo, st = null) {
  // (a range action on the panel (0.0.7: police, rounds back, the declaration): the range's own action, no tempo)
  if (step.act) { stepPage = 0; input.queue(step.act); return; }
  const pick = st?.pick ?? null;
  const args = { step: step.id, tempo, target: step.kind === 'aim' ? step.target ?? pick : null };
  if (step.kind === 'fire' && tempo === 'careful') args.hold = true;
  stepPage = 0;                                                      // (the panel back to its first page once a step is chosen)
  input.queue({ act: 'stop', args });
}
// (the brackets: Q and D (the codes KeyA and KeyD) and the arrows step them, Enter aims at the bracketed one)
addEventListener('keydown', (e) => {
  if (!loop.state || boot.card || splash.active || loop.paused || e.metaKey || e.ctrlKey || !inStop() || windowOpen() || startledNow() || pauseGuarded('pick', e)) return;
  let st = null;
  try { st = stopNow(loop.state); } catch { return; }
  if (!st || st.reflex) return;
  // (0.0.7: the turrets, a click a key: Z S ↑ ↓ the elevation, Shift with Q D ← → the windage; held, a click a repeat)
  const dial = dialOf(e.code, { shift: e.shiftKey });
  if (dial) { e.preventDefault(); input.queue({ act: 'stop', args: { step: dial, tempo: 'normal' } }); return; }
  if (e.repeat) return;
  // (R7: with nobody in sight to bracket, Q and D step the one Watch row across the drill's hot spots (VIEWS §7.8.1))
  const dir = e.code === 'KeyA' || e.code === 'ArrowLeft' ? -1 : e.code === 'KeyD' || e.code === 'ArrowRight' ? 1 : 0;
  if (dir && !st.pick && stepPanel.stepWatch(dir)) return;
  if (dir < 0) { input.queue({ act: 'stop', args: { step: 'pick:-1' } }); showPlaqueInfo(); }
  else if (dir > 0) { input.queue({ act: 'stop', args: { step: 'pick:+1' } }); showPlaqueInfo(); }
  else if ((e.code === 'Enter' || e.code === 'NumpadEnter') && st.pick) { e.preventDefault(); input.queue({ act: 'stop', args: { step: 'aim', target: st.pick, tempo: 'normal' } }); }
});
// (the mouse in stop motion: a click on a target aims at it, a click on the aimed one fires)
frameEl.addEventListener('pointerdown', (e) => {
  if (!loop.state || boot.card || splash.active || loop.paused || e.button !== 0 || !inStop() || windowOpen() || startledNow() || pauseGuarded('click')) return;
  if (e.target?.closest?.('.steps, .reflexcard')) return;
  let st = null;
  try { st = stopNow(loop.state); } catch { return; }
  const key = targetUnderPointer();
  if (!st || st.reflex || !key) return;
  if (st.aim?.key === key) input.queue({ act: 'stop', args: { step: 'fire', tempo: 'normal' } });
  else input.queue({ act: 'stop', args: { step: 'aim', target: key, tempo: 'normal' } });
});

// (0.0.12: Backspace stops a running bundle at the end of its beat, the rest offered as "Carry on" (VIEWS §10's row; the drill's
// 'drill:stop'), outside a splash and a card; in stop motion and out of it)
addEventListener('keydown', (e) => {
  if (e.code !== 'Backspace' || e.repeat || !loop?.state || boot?.card || boot?.page || splash?.active) return;
  const d = loop.state.stop?.doing ?? null, bn = bundleRead(loop.state);
  if (!bn && d?.kind !== 'bundle') return;
  e.preventDefault();
  if (!windowOpen() && !startledNow() && !pauseGuarded('drill:stop', e)) input.queue('drill:stop');
});
// (in a splash: Enter to the end, Backspace stop here; on the strip any key unbound there closes it, never T or Backspace)
const SPLASH_OWN = new Set(['Space', 'KeyT', 'Backspace', 'Escape', 'Enter', 'NumpadEnter', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'ControlLeft', 'ControlRight']);
addEventListener('keydown', (e) => {
  if (!loop.state || !splash.active || boot.card || e.repeat || e.metaKey || e.ctrlKey) return;
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); splash.toEnd(); }
  else if (e.code === 'Backspace') { e.preventDefault(); if (splash.stop()) input.queue('skip:stop'); }
  else if (splash.phase === 'strip' && !SPLASH_OWN.has(e.code)) splash.toEnd();
});
frameEl.addEventListener('pointerdown', () => { if (loop.state && splash.active && !boot.card) splash.toEnd(); });
// (a scene ended, its last picture held: Enter ends it now)
addEventListener('keydown', (e) => {
  if (!loop.state || splash.active || boot.card || e.repeat || !scene?.ended || scene.shown) return;
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { e.preventDefault(); scene.endNow = true; }
});

// ---- the cards of this round: PERSONNEL, the choices, the late card, a scene's end and score ----
const BODY = Object.freeze({ bodyOf, stagesOf, stripOf, wordsOf, cuesOf, hairOf, woundWords: wounds.woundWords });
// (0.0.9: hardening's readers for C, supp.js's)
const SUPP_READERS = Object.freeze({ hardParts: SUPP.hardParts, hardWord: SUPP.hardWord, inocOf: SUPP.inocOf });
/** A test sheet's hardening in words (the picker's: supp.js hardFrom over the sheet's Warfighting and inoculation, hardWord), or null. */
function hardWordOfSheet(tier) {
  return hardOfSheet(tier)?.word ?? null;
}
/** A test sheet's hardening for the picker and "Again as …": { word, title } ("Hardening 7: experience 5, training 2" on the hover; the fixer's). */
function hardOfSheet(tier) {
  const t = TEMPLATES.TEST_SHEETS?.[tier];
  if (!t || !SUPP.hardFrom || !SUPP.hardWord) return null;
  const inoc = t.inoc ?? SUPP.INOC_OF_TIER?.[tier] ?? 0, H = SUPP.hardFrom({ wf: t.wf, cls: 'soldier', inoc }), exp = SUPP.hardFrom({ wf: t.wf, cls: 'soldier', inoc: 0 });
  return { word: SUPP.hardWord(H), title: `Hardening ${H}: experience ${exp}, training ${inoc}` };
}
// (the build sheet v0.0.23 item 5; the user's ask of 2026-11-15, "the I and C menu preview of the character should show the
// currently worn gear": you as in a mirror, the Seen record's (seen.js seenOf with mirror: front on, your stance and your hold: kneeling
// with your carry, prone behind the rifle, a G-11 in the fist, the P-12 at the ready) painted by portrait.js at the doll's scale; the
// gear as worn when the record cannot be read)
// (the build sheet v0.0.24 item 17; samples/portrait-suit: the cards' ground by the place you stand in, D-b from v0.0.28 (the
// place's backdrop, the user's star of 2026-11-20; D-a the doll's own wall, v0.0.24's); portrait.js cardBackdrop, by suitPlaceOf:
// the shoot house, an indoor place, or the street)
function mirrorDoll(s, gear, person) {
  let rec = null;
  try { rec = seenOf(s, s.player.id, { mirror: true }); } catch (e) { broke(e, 'the portrait'); }
  return rec ? cardBackdrop(paintPortrait(rec, person, { scale: DOLL_SCALE }).pm, DOLL_SCALE, suitPlaceOf(s)) : dressedDoll(gear, person);
}
/** The I and C cards' place for their ground (portrait.js SUIT_PLACES): 'house' in the shoot house, 'street' on open ground, else 'bay'. */
function suitPlaceOf(s) {
  if (s?.armoury?.range?.course === 'house') return 'house';
  try { return indoorsNow(s) ? 'bay' : 'street'; } catch { return 'bay'; }
}
// (the loadout's marine: standing, the rifle at the low ready, the kit as chosen, through the same renderer)
function loadoutDoll(s, pid, gear) {
  const person = { look: s.people[pid]?.look, sex: s.people[pid]?.sex }, rec = seenOf(s, pid, { mirror: true });
  return rec ? paintPortrait({ ...rec, hold: { ...rec.hold, how: 'rifle-low', act: null }, aimAt: null, pose: 'stand', facing: 'front' }, person, { scale: DOLL_SCALE }).pm : dressedDoll(gear, person);
}
// (the player's hair's drawn step, hairOf's: the sheet's and the inventory's dolls wear the cut as it has grown)
const hairStep = (s) => { try { return hairOf(s, s.player?.id, s.clock.ms)?.step ?? 0; } catch { return 0; } };
const clockText = (ms) => { const c = timeAt(siteAt(loop.state), ms); return c.timeslip ? `24:00 +${Math.floor(c.slipMs / MIN_MS)}` : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`; };
function openSheet() {
  const s = loop.state, me = s ? playerActor(s) : null, p = s?.people?.[s.player?.id];
  if (!s) return;
  let sheet;
  try { sheet = sheetOf(s, { body: BODY, supp: SUPP_READERS, lonEDeg: lonAt(s), look: p?.look ? lookFor(p.look, me?.outfit ?? 'utilities', indoorsNow(s), hairStep(s)) : null }); }
  catch (e) { broke(e, 'the character sheet'); return; }
  // (0.0.18: the figure wears the gear worn now, gear.js gearOf through dress.js; a person with no kit and no actor as before)
  const gear = (() => { try { return GEAR.gearOf(s, s.player.id); } catch (e) { broke(e, 'the gear'); return null; } })();
  boot.openCard('sheet', sheetCard(sheet, { dollOf: (args) => (gear ? mirrorDoll(s, gear, { look: args?.look, sex: args?.sex, body: args?.body }) : doll(args)) }));
}
// (I: what you carry, believed counts only (arms' kitView); the doll as on the sheet)
function openInventory() {
  const s = loop.state, me = s ? playerActor(s) : null, p = s?.people?.[s.player?.id];
  if (!s) return;
  let view = null;
  try {
    // (the reach the sim's own: a magazine in, at your Weapon handling, as the step panel shows it)
    const gunId = s.people?.[s.player.id]?.kit?.worn?.sling, g0 = gunId ? s.items?.[gunId] : null;
    view = kitView(s, s.player.id, { magInS: g0 ? actionMs(rollerOf(s, s.player.id), g0, 'magIn') / 1000 : null,
      groundS: g0 ? (actionMs(rollerOf(s, s.player.id), g0, 'reach@ground') + actionMs(rollerOf(s, s.player.id), g0, 'seat')) / 1000 : null,
      // (0.0.18: a device pouch's reach from its face, as the loadout screen gives it)
      devReachS: (m, f) => reachSOf(rollerOf(s, s.player.id), m, f) });
    const gun = view?.sling?.gunId ? s.items?.[view.sling.gunId] : null;
    if (view?.sling && gun) view = { ...view, sling: { ...view.sling, word: `Your ${MODELS[gun.model]?.short ?? 'rifle'}` } };
  } catch (e) { broke(e, 'the inventory'); return; }
  const look = p?.look ? lookFor(p.look, me?.outfit ?? 'utilities', indoorsNow(s), hairStep(s)) : null;
  // (0.0.18: the figure wears the gear worn now, as the sheet's; the plaque names the suit when one is worn)
  const gear = (() => { try { return GEAR.gearOf(s, s.player.id); } catch (e) { broke(e, 'the gear'); return null; } })();
  const { body, lines } = inventoryCard(view, { label: (a) => input.label(a), sub: gear?.suit ? 'COMBAT EVA SUIT' : null,
    dollOf: look ? () => (gear ? mirrorDoll(s, gear, { look, sex: p.sex }) : doll({ look, sex: p.sex, outfit: me?.outfit ?? 'utilities' })) : null });
  boot.openCard('inventory', body, lines);
}
// (R held: the menu of every single action at hand, cards/actions.js; its keys its own while it is up)
let actions = null, actionsKeys = null;
function openActions() {
  const s = loop.state;
  let menu = null;
  try { menu = s ? handMenu(s) : null; } catch (e) { broke(e, 'the R menu'); return false; }
  if (!menu?.rows?.length) return false;
  const card = actionsCard({
    menu, nowMs: s.clock.ms, clockText, ui: uiK,
    planChain: (steps) => planChain(s, { spotId: menu.spotId, steps }),
    onSound: (kind) => { try { audio.fact('ui', { kind }, loop.state); } catch (e) { broke(e, 'the sound'); } },
    onClose: () => boot.closeCard(),
    onSend: (action, { late }) => {
      boot.closeCard();
      // (a plan that would make you late: the late card first, its answer added to the same input; the wait
      // goes as time's activity, a door is never late)
      if (late) {
        openLate(late, (answer) => ({ ...action, args: { ...action.args, late: answer } }));
        return;
      }
      // (a scene's own row (registerHandScene's rows: no verb, "The window and the canopy"'s) goes to R with its id, the scene's act,
      // never to time's activities, which know none of them)
      const sceneRow = action.act === 'activity' && menu.spotId === null && menu.rows.some(r => r.id === action.args?.id && !r.verb);
      input.queue(sceneRow ? { act: 'hand', args: { id: action.args.id } } : action);
    },
  });
  boot.openCard('actions', card.body, [], { guard: false });
  actions = card;
  actionsKeys = input.own((code, e) => card.key(code, e));
  return true;
}
// (the R menu closed, whatever closed it: its keys given back, its listeners gone)
function closedActions() {
  actionsKeys?.(); actionsKeys = null;
  actions?.destroy(); actions = null;
}
/** The late card's view of a single offer: cards/late.js's what (its head words, length, least) and late. */
const singleLate = (o) => ({ what: { id: o.id, label: String(o.label ?? o.id ?? '').split(' · ')[0], durMs: o.durMs, min: ACTIVITIES[o.id]?.min ?? 0 }, late: o.late });
// (view: { what: { label, durMs, min }, late } (a single's, or a chain's from cards/actions.js lateView: "fit it in"
// the leading whole steps); send(answer) the input to queue for 'fit' or 'accepted')
function openLate(view, send) {
  const { body, lines } = lateCard({
    what: view.what, late: view.late, nowMs: loop.state?.clock.ms ?? null, clockText,
    onAnswer: (answer) => {
      boot.closeCard();
      if (answer === 'fit' || answer === 'accepted') input.queue(send(answer));
    },
  });
  boot.openCard('late', body, lines);
}
/** This session's test-pairs runs, by scene and seed, then by sheet: their end card lines (page memory, never saved). */
const sessionRuns = new Map();
/** This session's calm test-pairs runs: the first string's turn to first round (ms), by seed and sheet (0.0.9: the banged card's calm line; page memory). */
const calmRuns = new Map();
// (0.0.10: "Bang"'s sheets this session on each seed, stressNow's strings by sheet: page memory only, the session's grid)
const sessionStress = new Map();
function openEnd() {
  if (!scene) return;
  const { rec, seed } = scene;
  // (0.0.12: the shoot house's own card)
  if (loop.state?.armoury?.range?.course === 'house') return openHouseEnd(rec, seed);
  // (the void's two scenes, their own lines on the scene's card)
  if (loop.state?.armoury?.range?.course === 'anchors' || loop.state?.armoury?.burn) return openVoidEnd(rec, seed);
  // ("The window and the canopy": the scene's own lines (armoury-day.js armouryNow's card))
  if (loop.state?.armoury?.range?.course === 'armoury') return openArmouryEnd(rec, seed);
  let said = null, pn = null;
  // (the range's summary, and on the KD an incident on a line of its own: sceneLines)
  try { const s = loop.state, r = s ? rangeNow(s) : null; said = sceneLines(r, r?.course === 'kd' ? kdOf(s) : null, { clockText }); } catch (e) { broke(e, 'the end card'); }
  // (0.0.8: a scene played as a sheet: which sheet, its three aspects in the scene's numbers, "Again as …" the others on the same seed)
  pn = loop.state ? pairsOf(loop.state) : null;
  const sheets = TEMPLATES.TEST_SHEETS ?? {}, played = pn?.sheet ?? null;
  const tier = played ?? scene.tier ?? null;
  // (this session's runs on this seed, by sheet: page memory only, never the save (the design review of v0.0.8))
  // (0.0.9: the banged scene's lines first: the scene's bangsNow summary and this session's calm run on the seed and sheet; a calm
  // run's first string's first round from the sighting (the paper's sum) kept for it, by seed and sheet)
  let bangs = [], bn = null;
  const banged = String(loop.state?.armoury?.range?.setup ?? '').startsWith('bangs');
  try {
    const s = loop.state;
    if (pn && played && !banged) { const f = pn.strs?.[0], t1 = Number.isFinite(f?.takeInMs) && Number.isFinite(f?.pauseToFirstMs) ? f.takeInMs + f.pauseToFirstMs : null; if (Number.isFinite(t1)) calmRuns.set(`${seed}|${played}`, t1); }
    bn = banged && s && pairsScene.bangsNow ? pairsScene.bangsNow(s, s.clock.ms) : null;
    if (bn) bangs = bangLines(bn, { calmRunMs: calmRuns.get(`${seed}|${played}`) ?? null, fmt: takeInWords });
  } catch (e) { broke(e, 'the end card'); }
  // (this session's runs on this seed, by sheet: page memory only, never the save (the design review of v0.0.8); on "Three bangs"
  // each sheet's bangs line, so the recruit's and the tier one's sit side by side (the design review of v0.0.9), the sheet just
  // played marked and its line not said twice above)
  let runs = [];
  if (pn && played) {
    const key = `${rec.id}|${seed}`, m = sessionRuns.get(key) ?? new Map();
    m.set(played, bn ? bn.summary : runLine(pn, { fmt: takeInWords }));
    sessionRuns.set(key, m);
    runs = [...m.entries()].filter(([, t]) => t).map(([t, text]) => ({ text, now: t === played }));
    if (bn && runs.length > 1) bangs = bangs.slice(1);
  }
  const again = pn ? againTiers(sheets, played, Array.isArray(rec.sheets) ? rec.sheets : TEMPLATES.PICKER_TIERS ?? null) : [];
  // (0.0.10: "Bang": the stress course's lines and a small truth card a string lead; its sheets' hardening words lead "Again as …";
  // the pairs course's own summary and aspects are not said (they are test-pairs' three, not this scene's))
  const sn = loop.state ? stressRead(loop.state) : null;
  let stress = [], cards = null, grid = null;
  if (sn) {
    try {
      stress = stressLines(sn, { fmt: takeInWords, cap: SUPP.INOC_CAP?.[COURSES.stress?.teacher ?? 'cadre'] ?? null });
      const s = loop.state, cardsOf = (sn.strings ?? []).map(x => {
        const keys = pn?.strs?.find(p => p.k === x.k && p.done !== 'setup')?.keys ?? s.armoury.range.stress?.strs?.find(r => r.k === x.k)?.holes?.map(h => h.key) ?? [];
        const key = [...new Set(keys)].map(k => ({ k, hm: hitMarksRead(s, k, x.k, 'truth') })).find(y => y.hm?.marks?.length)?.k ?? null;
        return { k: x.k, model: key ? hitModelOf(s, key, x.k, 'truth') : null };
      });
      cards = hotWash(cardsOf, { paint: paintHitcard, fit: hitFit(uiK, globalThis.devicePixelRatio ?? 1) });
    } catch (e) { broke(e, 'the end card'); }
    said = null;
    if (played) { const key = `${rec.id}|${seed}`, m = sessionRuns.get(key) ?? new Map(); m.set(played, `${sn.word ? `${sn.word} · ` : ''}${sn.summary}`); sessionRuns.set(key, m); runs = [...m.entries()].filter(([, t]) => t).map(([t, text]) => ({ text, now: t === played })); }
    // (the session's sheets on this seed side by side, a row a string, from the second sheet (the design review of 0.0.10))
    if (played) {
      const key = `${rec.id}|${seed}`, m = sessionStress.get(key) ?? new Map();
      m.set(played, { label: sn.label, word: sn.word, strings: sn.strings });
      sessionStress.set(key, m);
      if (m.size > 1) { try { const sheetsNow = [...m.entries()]; grid = gridTable(sessionGrid(sheetsNow.map(([, v]) => v), { fmt: takeInWords }), { now: sheetsNow.findIndex(([t]) => t === played) }); } catch (e) { broke(e, 'the end card'); } }
    }
  }
  if (banged || sn) for (const a of again) a.hard = hardWordOfSheet(a.tier);
  const { body, lines } = endCard({ scene: rec, seed, said, sheet: played ? sheets[played]?.label ?? played : null, runs, bangs, stress, cards, grid,
    aspects: pn && !sn ? aspectLines(pn.card, { fmt: takeInWords }) : [], again, on: {
    again: (same) => playScene(rec, { seed: same ? seed : randomSeed(), hour: params.play === rec.scenario ? params.hour : null, setup: params.play === rec.scenario || params.play === rec.id ? params.setup : null, tier }),
    againAs: (t) => againAs(rec, t),
    score: () => openScore(),
    title: () => quitToTitle(),
  } });
  boot.openCard('end', body, lines);
}
/**
 * v0.0.24 (the anywhere round; its build sheet §1 D): the end card of "Anchor before you fire" and of "Secure for burn": the scene's
 * own lines (cards/anchors.js, from anchorsNow and burnNow), the anchors' "Again as …" each other sheet on the same seed.
 */
function openVoidEnd(rec, seed) {
  const s = loop.state, sheets = TEMPLATES.TEST_SHEETS ?? {};
  let said = [], aspects = [], played = null;
  try {
    const an = s?.armoury?.range?.course === 'anchors' ? anchorsNow(s) : null, bn = an ? null : burnNow(s);
    if (an) { said = anchorsSaid(an); aspects = anchorsAspects(an); played = an.tier; } else if (bn) { said = burnSaid(bn); aspects = burnAspects(bn); }
  } catch (e) { broke(e, 'the end card'); }
  const again = played ? againTiers(sheets, played, Array.isArray(rec.sheets) ? rec.sheets : TEMPLATES.PICKER_TIERS ?? null) : [];
  const { body, lines } = endCard({ scene: rec, seed, said, sheet: played ? sheets[played]?.label ?? played : null, aspects, again, on: {
    again: (same) => playScene(rec, { seed: same ? seed : randomSeed(), tier: played }),
    againAs: (t) => playScene(rec, { seed, tier: t }),
    score: () => openScore(),
    title: () => quitToTitle(),
  } });
  boot.openCard('end', body, lines);
}
/**
 * v0.0.28, "The window and the canopy" (its build sheet item 16): the scene's card, its summary and the day's lines (armoury-day.js
 * armouryNow's card), this session's runs on the seed a line a sheet (page memory, never saved), "Again as …" each other sheet on the same
 * seed (the same slip, short count and air), "Another day" a new seed.
 */
function openArmouryEnd(rec, seed) {
  const s = loop.state, sheets = TEMPLATES.TEST_SHEETS ?? {};
  let said = [], aspects = [], played = null, runs = [];
  try {
    const N = s ? armouryNow(s) : null;
    if (N) {
      said = N.card.lines; aspects = N.card.aspects; played = N.tier;
      const key = `${rec.id}|${seed}`, m = sessionRuns.get(key) ?? new Map();
      m.set(played, N.card.summary);
      sessionRuns.set(key, m);
      runs = m.size > 1 ? [...m.entries()].map(([t, text]) => ({ text, now: t === played })) : [];
    }
  } catch (e) { broke(e, 'the end card'); }
  const again = played ? againTiers(sheets, played, Array.isArray(rec.sheets) ? rec.sheets : TEMPLATES.PICKER_TIERS ?? null) : [];
  const { body, lines } = endCard({ scene: rec, seed, said, sheet: played ? sheets[played]?.label ?? played : null, runs, aspects, again, on: {
    again: (same) => playScene(rec, { seed: same ? seed : randomSeed(), tier: played }),
    againAs: (t) => playScene(rec, { seed, tier: t }),
    score: () => openScore(),
    title: () => quitToTitle(),
  } });
  boot.openCard('end', body, lines);
}
// ---- 0.0.12: "Stack and clear" (the build sheet 0.0.12 §2.3, §2.4) ----
/** This session's shoot house runs, by seed, then by sheet: their lines room by room (page memory, never saved). */
const sessionHouse = new Map();
/** The shoot house's view now (houseNow), once a tick: null off its course. */
let houseMemo = { key: null, hn: null };
function houseRead(s) {
  if (s?.armoury?.range?.course !== 'house' || !houseScene.houseNow) return null;
  const key = readKey(s);
  if (houseMemo.key === key && houseMemo.state === s) return houseMemo.hn;
  let hn = null;
  try { hn = houseScene.houseNow(s, s.clock.ms); } catch (e) { broke(e, 'the shoot house'); }
  houseMemo = { key, state: s, hn };
  return hn;
}
/** The running bundle now (the drill's bundleNow), once a tick, or null. */
let bundleMemo = { key: null, bn: null };
function bundleRead(s) {
  if (!s || !BUNDLE.bundleNow) return null;
  const key = `${readKey(s)}|${s.stop?.doing?.step ?? ''}`;
  if (bundleMemo.key === key && bundleMemo.state === s) return bundleMemo.bn;
  let bn = null;
  try { bn = BUNDLE.bundleNow(s, s.player.id); } catch (e) { broke(e, 'the bundle'); }
  bundleMemo = { key, state: s, bn };
  return bn;
}
/** The spot of the Watch or Look row T's act names now ('stop:look:r1:nl' → 'r1:nl'), or null (the play review's fourth finding, v0.0.23's fixer). */
function hotOfAct(s) {
  if (s?.armoury?.range?.course !== 'house' || !s.stop) return null;
  let act = null;
  try { act = instinctNow(s)?.line?.act ?? null; } catch (e) { broke(e, 'the instinct'); }
  const m = /^stop:(?:watch|look):(.+?)(?:@[a-z]+)?$/.exec(String(act ?? ''));
  return m ? m[1] : null;
}
/** Whether the scene being played turns V into the movement stances (its spec's stances: the build sheet 0.0.12 §8 item 7). */
const stancesNow = (s = loop?.state) => !!(s && sceneOf(s)?.stances);
/**
 * The words T's keycap names before the press (0.0.12; COMBAT §25.11): the panel's row the line's act names ('stop:<row>'), its label
 * and its time, "Stack up · 4.7 s", "Open, clear the room · 5.4 s" (one room a row from the rework's R4); null
 * where the act is no row of the panel shown (the act's own words are the line's).
 */
function actWordsOf(act, steps) {
  const id = typeof act === 'string' ? act.replace(/^stop:/, '') : act?.args?.step ?? null;
  if (!id || !steps?.length) return null;
  const row = steps.find(x => x.id === id && !x.off);
  if (!row) return null;
  const secs = Number.isFinite(row.ms) && row.ms > 0 ? `${(row.ms / 1000).toFixed(1)} s` : null;
  return [row.label, row.lane ?? null, secs].filter(Boolean).join(' · ');
}
/** The shoot house's end card: the run sheet's card line and the instructor's one thing, the aspects, the session's runs, the run sheet and the hot wash beside it. */
// (the card: the verdict leads; the run kept in this browser (house-runs.js keepRun: bests and GOs on the picker); after a GO
// "Again as" leads with the next sheet up, after a NO-GO "Again from room n" (the weak room's setup); the session's sheets side by side
// (houseGrid) from the second; the plan view beside the run sheet (houseplan.js over house-debrief.js debriefOf), a stand clicked
// opening its truth card under it (hitModelOf(s, key, k, 'truth'), k the leg's index); "Export the run" (the run's log, runLog))
// (the drawn house's code in the header, kept by "Again", "Again as" and "Again from" (a new seed draws a new house), on the
// run kept and the export; a qualification lane's step (house-runs.js qualStep) once, its line under the verdict and its next lane
// first (a hidden seed, house-runs.js qualSeed); every other line abandons the attempt)
function openHouseEnd(rec, seed) {
  const s = loop.state, hn = houseRead(s), sheets = TEMPLATES.TEST_SHEETS ?? {};
  let code = null;
  try { code = houseCodeOf(s); } catch (e) { broke(e, 'the house\'s code'); }
  // (the house kept with its room set and its plans' source (house.js againHouseOf, the same seed's))
  const H0 = s?.armoury?.range?.house ?? null, roomsOf = H0?.draw?.rooms ?? null, plansOf = H0?.plans ?? null;
  const drawn = code && code !== HOUSE_CODE_SET ? code : null, keepHouse = againHouseOf({ same: true, code: drawn, rooms: roomsOf, plans: plansOf });
  // (a named house's letter, B or C, said in the code's place on the card and the paper)
  const lane = namedLaneOf(drawn);
  let rs = null, hw = null;
  try { rs = houseScene.runSheetOf ? houseScene.runSheetOf(s) : null; } catch (e) { broke(e, 'the run sheet'); }
  try { hw = houseScene.hotWashOf ? houseScene.hotWashOf(s) : null; } catch (e) { broke(e, 'the hot wash'); }
  const played = hn?.tier ?? s?.armoury?.range?.house?.tier ?? null, label = played ? sheets[played]?.label ?? played : null;
  const verdict = rs?.verdict ?? null, H = s?.armoury?.range?.house ?? null;
  let runs = [], grid = null;
  if (played) {
    const key = `${rec.id}|${seed}`, m = sessionHouse.get(key) ?? new Map();
    m.set(played, { text: houseRunLine(hn, { fmt: takeInWords, label }), label, legs: hn?.legs ?? [] });
    sessionHouse.set(key, m);
    runs = [...m.entries()].filter(([, v]) => v?.text).map(([t, v]) => ({ text: v.text, now: t === played }));
    if (m.size > 1) { try { grid = houseGridEl(houseGrid([...m.entries()].map(([t, v]) => ({ label: v.label, legs: v.legs, now: t === played })))); } catch (e) { broke(e, 'the grid'); } }
    // (the run kept once, when the card first opens on it (the score card comes back here: never twice))
    if (verdict && verdict.go !== null && runKept !== s) {
      runKept = s;
      // (the qualification's step, against the runs kept before this one; an attempt whose lane this is not is abandoned)
      let q = null;
      try {
        if (qualAttempt && qualAttempt.pending === seed && qualAttempt.sheet === played) {
          q = qualStep(qualAttempt, { sheet: played, seed, code: drawn, go: verdict.go, draw: H?.draw?.mode === 'drawn' ? 'drawn' : 'set', loadout: H?.loadout ?? 'standard', par: H?.par ?? null, own: COURSES.house?.parOfTier?.[played] ?? null }, readRuns(globalThis.localStorage).runs, { label });
        }
        qualAttempt = q?.attempt ?? null;
        if (q?.qualified) keepQual(globalThis.localStorage, played, { seeds: q.seeds, codes: q.codes, version: VERSION });
      } catch (e) { qualAttempt = null; broke(e, 'the qualification'); }
      qualSaid = { s, q };
      try { keepRun(globalThis.localStorage, { scene: rec.id, sheet: played, loadout: H?.loadout ?? null, seed, laneMs: hn?.timerMs ?? null, go: verdict.go, why: verdict.why, version: VERSION, code: drawn, qual: q?.qual ?? null }); } catch (e) { broke(e, 'the runs kept'); }
    }
  }
  let side = null, planEl = null, truthEl = null;
  try {
    const said = new Set([...(rs?.rows ?? []).map(r => r.words), ...(rs?.would ?? []), typeof rs?.one === 'string' ? rs.one : rs?.one?.text, rs?.team?.words, verdict?.words].filter(Boolean));
    const stand = new Map((hn?.turners ?? []).map(T => [T.key, T.stand]));
    const sheetEl = runSheetEl(rs, { bars: hw?.bars ?? null, lane, place: houseScene.onWreck?.(s) ? 'THE WRECK · DECKS 5 AND 6' : null }), washEl = hotWashEl(hw, { fmt: takeInWords, skip: said, nameOf: (k) => stand.get(k) ?? k });
    // (the plan view: the debrief's model; a stand clicked opens its truth card in the slot under the plan)
    const d = debriefOf(s), slot = document.createElement('div');
    slot.className = 'plan-truth';
    // (this run kept as a ghost once (the score card's way back never keeps it twice), and the ghosts of its house and
    // lane offered on its plan, the run played just before first (house-ghosts.js; never read by the sim))
    let ghosts = [], gkey = null;
    try {
      gkey = ghostKeyOf(rec, s);
      if (!ghostKept.has(s)) ghostKept.set(s, keepGhost(ghostOf(d, { key: gkey, label, sheet: played })));
      ghosts = ghostsFor(gkey, { not: ghostKept.get(s) });
    } catch (e) { broke(e, 'the ghost'); }
    // (with the plan the hot wash stands down: its lines are the run sheet's, its bars the scrubber's lanes (card C2))
    // (the truth card beside the canvas, captioned by its stand ("Room 2, 2a"), with no string's button: the hunt of v0.0.20, P4, it read
    // "String 1" with a button 1, Pairs' words, under the plan, and pushed the run sheet out of the side column)
    const plan = d && d.tracks.ms.length ? housePlanEl(d, { winW: innerWidth, winH: innerHeight, aside: slot, ghosts, onStand: (key) => {
      try {
        const T = s.armoury.range.turners.find(x => x.key === key), k = T ? (T.stand === 'H' ? 3 : Number(T.stand[0]) - 1) : 0;
        const model = hitModelOf(s, key, k, 'truth');
        slot.replaceChildren(...(model ? [hotWash([{ k, model }], { paint: paintHitcard, fit: hitFit(uiK, globalThis.devicePixelRatio ?? 1), caption: () => standWords(T?.stand), tabs: false })] : []));
        slot.dataset.stand = T?.stand ?? '';
      } catch (e) { broke(e, 'the truth card'); }
    } }) : null;
    planEl = plan?.el ?? null;
    if (planEl) {
      report.plan = { faults: Number(planEl.dataset.faults) || 0, seek: (t) => plan.seek(t), get ms() { return plan.ms; }, get stand() { return slot.dataset.stand ?? null; }, frame: plan.frame,
        // (the ghosts offered and the one drawn, its delta now, the replay's slowest draw: the browser test's (F83))
        ghost: { key: gkey, offered: plan.ghosts.map(ghostWords), get chosen() { return plan.ghost ? ghostWords(plan.ghost) : null; }, get delta() { return deltaWords(plan.delta); }, set: (i) => plan.setGhost(i),
          play: (r) => plan.play(r), pause: () => plan.pause(), get drawMaxMs() { return plan.drawMaxMs; }, get draws() { return plan.draws; }, reset: () => plan.resetDraws() } };
    }
    // (the truth cards under the plan, each man and stand you engaged as he truly was at your first round (house.js
    // truthRows, truth-cards' T-a), the card's marks in truth, a role-player's as paint)
    try {
      truthEl = truthRowEl(truthRows(s), { paint: paintHitcard, size: CARD_MIN, modelOf: (r) => { const m = hitModelOf(s, r.key, r.leg, 'truth'); return m ? { ...m, subject: r.subject, marks: r.live ? m.marks.map(x => ({ ...x, paint: 'team' })) : m.marks } : null; } });
      if (truthEl) report.truth = { n: Number(truthEl.dataset.n) || 0, text: truthEl.dataset.text };
    } catch (e) { broke(e, 'the truth cards'); }
    if (sheetEl || washEl || planEl) { side = document.createElement('div'); side.className = `house-side${planEl ? ' with-plan' : ''}`; side.append(...[planEl, planEl ? truthEl : null, sheetEl, planEl ? null : washEl].filter(Boolean)); }
  } catch (e) { broke(e, 'the run sheet'); }
  const order = Array.isArray(rec.sheets) ? rec.sheets : TEMPLATES.PICKER_TIERS ?? [];
  const again = againOrder(againTiers(sheets, played, Array.isArray(rec.sheets) ? rec.sheets : TEMPLATES.PICKER_TIERS ?? null), { go: verdict?.go === true, played, sheets: order }).map((a, i) => (verdict?.go && i === 0 && order.indexOf(a.tier) === order.indexOf(played) + 1 ? { ...a, up: true, why: `you are a GO as ${label}` } : a));
  const from = verdict?.go === false ? weakRoomOf(hn?.legs ?? []) : null;
  const par = s?.armoury?.range?.house?.par ?? null, loadout = s?.armoury?.range?.house?.loadout ?? null;
  // (the qualification's line and its next lane: the same sheet while the attempt goes on, the next sheet up once qualified)
  const qs = qualSaid?.s === s ? qualSaid.q : null, upT = qs?.qualified ? nextSheetUp(order, played) : null;
  const qNext = qs?.attempt ? { tier: played, label } : upT ? { tier: upT, label: sheets[upT]?.label ?? upT } : null;
  const qual = qs?.words ? { words: qs.words, n: qs.qual?.n ?? 0, of: qs.qual?.of ?? 0, done: !!qs.qualified, next: qNext } : null;
  const qualLane = (tier) => {
    const runsNow = (() => { try { return readRuns(globalThis.localStorage).runs; } catch { return []; } })();
    const going = qualAttempt?.sheet === tier ? qualAttempt : qualStart(tier), seedQ = qualSeed(runsNow, tier, randomSeed, { taken: going.seeds });
    if (seedQ === null) { toast('No fresh seed to qualify on.', 'warn'); return null; }
    qualAttempt = { ...going, pending: seedQ };
    return qualLaunch(() => playScene(rec, { seed: seedQ, tier, par: tier === played ? H?.parSet ?? null : null, setup: null, draw: 'drawn' }));
  };
  const leave = (fn) => (...a) => { qualAttempt = null; return fn(...a); };
  const { body, lines } = endCard({ scene: rec, seed, said: houseEndLines(hn, rs, hw), sheet: label, runs, cards: side, grid, aspects: houseAspects(hn, { fmt: takeInWords }), again, verdict,
    from: from?.setup ? from : null, exportRun: !!runLogOf(s), code: drawn, lane, qual, on: {
    // (a new seed keeps a named house, B or C, with a new cast, and a drawn house its rooms (house.js againHouseOf))
    // (its build sheet item 14, carried FH-5: the short brief, "Same lane, same rules.", where the house is the run before's: the
    // same seed, or a new seed on a set or named house (the same layout, a new cast); never a drawn house's new seed (new doors))
    // ("Bang, then go"'s Again keeps its draw's words (the same door, the same kit), its new seed ("Another door") draws anew)
    again: leave((same) => playScene(rec, { seed: same ? seed : randomSeed(), tier: played, par, setup: null, loadout, again: same || !drawn || !!lane, ...againHouseOf({ same, code: drawn, lane, rooms: roomsOf, plans: plansOf }), ...(same && H?.bangGo ? { breach: H.bangGo.code } : {}), ...(same && H?.boarding ? { holdouts: H.boarding.code } : {}) })),
    // ("Again as" on a drawn house keeps its code (the same seed, the same house, another sheet))
    againAs: leave((t) => { if (!drawn && !plansOf && !H?.bangGo) return againAs(rec, t); const h = houseScene.againAsHouse(s, t); return playScene(rec, { seed: h.seed, tier: h.tier, par: h.par ?? null, setup: null, loadout: h.loadout ?? null, ...(h.breach ? { breach: h.breach } : {}), ...(h.holdouts ? { holdouts: h.holdouts } : {}), ...keepHouse }); }),
    from: leave((setup) => playScene(rec, { seed, tier: played, par, setup, loadout, ...keepHouse })),
    qual: (tier) => qualLane(tier),
    exportRun: () => exportRun(rec, s),
    score: () => openScore(),
    title: leave(() => quitToTitle()),
  } });
  // (on the Wreck, the card's door words as a hatch's: "DOOR LEFT", the plan's and the sheet's (ui/ship-words.js; v0.0.25's fixer))
  try { shipText(body, s); } catch (e) { broke(e, 'the words'); }
  boot.openCard('end', body, lines);
  // (the v0.0.24 integration: the truth row closes itself where, open, it would make the side column scroll (ui-hunt-page's P1, the
  // hunt of v0.0.20: "nothing scrolled or cut"; the sergeant's live card at 1280 × 720 scrolled 89 px with it open), and stays open
  // where it fits (truth-cards' T-a), its summary there to open it)
  try { if (truthEl?.open && side?.isConnected && side.scrollHeight > side.clientHeight + 1) truthEl.open = false; } catch (e) { broke(e, 'the truth cards'); }
}
// (the state the end card last kept a run for: the score card's way back never keeps it twice)
let runKept = null;
// (each state's own ghost, kept once (house-ghosts.js keepGhost), so its card never offers it to itself)
const ghostKept = new WeakMap();
// (the qualification under way (house-runs.js: { sheet, n, seeds, codes, pending: the hidden seed of its lane }) and the step
// the card said for a state; page memory only: a reload ends the attempt)
let qualAttempt = null, qualSaid = null;
// (set only while the attempt launches its own lane (qualFirst, the card's next lane): main.js launch keeps the attempt through
// that launch alone (house-runs.js qualKeep); a save loaded, imported or continued ends it)
let qualLaunching = false;
/** A launch the attempt makes: its own lane, then the flag down whatever happened. */
function qualLaunch(fn) { qualLaunching = true; try { return fn(); } finally { qualLaunching = false; } }
/** A drawn house's code for the score line (score.js scoreLine's house), or null as set. */
function drawnCodeOf(s) { try { const c = s?.armoury?.range?.course === 'house' ? houseCodeOf(s) : null; return c && c !== HOUSE_CODE_SET ? c : null; } catch { return null; } }
/** "Qualify as <sheet>" from the picker: a new attempt, its first lane on a hidden seed never played on that sheet, the drawn house. */
function qualFirst(rec, tier, par = null) {
  let runs = [];
  try { runs = readRuns(globalThis.localStorage).runs; } catch { runs = []; }
  const seedQ = qualSeed(runs, tier, randomSeed);
  if (seedQ === null) { toast('No fresh seed to qualify on.', 'warn'); return null; }
  qualAttempt = { ...qualStart(tier), pending: seedQ };
  return qualLaunch(() => playScene(rec, { seed: seedQ, tier, par, setup: null, draw: 'drawn' }));
}
/** A stand in the run sheet's words, for the truth card's caption: "Room 2, 2a", "The hall, H". */
const standWords = (stand) => (!stand ? 'The stand' : stand === 'H' ? 'The hall, H' : `Room ${stand[0]}, ${stand}`);

// ---- v0.0.20: the run's log, its export, who speaks and the plates off the room ----
/** The run's log for a state, or null (ui/runlog.js: none kept, the log full, or no save at GO). */
const runLogOf = (s) => runLog.of(s);
/** "Export the run": { game, version, scene, seed, sheet, par, loadout, atGo, inputs, steps, runtime, sheetHash, digest } as a JSON file. */
function exportRun(rec, s) {
  const r = runLogOf(s);
  if (!r) { toast('No run to export: it was not kept from GO.', 'warn'); return; }
  const H = s.armoury.range.house;
  let sheetHash = r.endSheet ?? null;
  if (!sheetHash) try { sheetHash = digestOf(JSON.stringify(houseScene.runSheetOf(s))); } catch (e) { broke(e, 'the export'); }
  // (the house's code, 'A' as set; the save at GO carries a drawn house's places.live.gen, so the replay rebuilds its area)
  let code = HOUSE_CODE_SET;
  try { code = houseCodeOf(s); } catch (e) { broke(e, 'the export'); }
  const out = { game: 'olympus', kind: 'house-run', version: VERSION, scene: rec.id, seed: s.meta.seed, code, sheet: H.tier, par: H.parSet ?? null, loadout: H.loadout ?? null,
    atGo: r.atGo, inputs: r.inputs, steps: r.endN ?? r.n, runtime: r.runtime, sheetHash, digest: r.endDigest ?? digestOf(toJSON(s)) };
  try { toast(`Run exported to ${store.exportFile(JSON.stringify(out), `olympus-run-${rec.id}-${H.tier}-${s.meta.seed}.json`)}.`); } catch (e) { broke(e, 'the export'); }
  return out;
}
/** What was played, for the score line (score.js playedWords): the panel's layout, the walk, the look (the page's runtime settings). */
// (the shot from the engine that plays it (audio.shot), as the debug handle's picks() reads it: v0.0.20's fixer, the code
// review: s.$shot was read here and written nowhere, so no score line said it)
const playedNow = (s) => (s?.armoury?.range?.course === 'house' ? { panel: s.$panel ? String(s.$panel).toUpperCase() : null, walk: s.$cycle ?? null, look: s.$look ?? null, shot: audio.shot ?? null } : null);

/**
 * v0.0.25 (the build sheet item 11, §3.4): the loudspeaker of your compartment, { x, y, z }, or null where the live area has none: the
 * area's `speakers` ([{ room, x, y, z }], the Wreck's 1MC on every compartment's deckhead), the one in the room you stand in, else the
 * nearest to you in the plan (a passage's, the next compartment's: the decks are sixty metres apart, so never the other deck's).
 */
function speakerAt(s) {
  const id = s?.places?.live?.area, me = s ? playerActor(s) : null;
  let area = null;
  try { area = id ? areaOf(id) : null; } catch { area = null; }
  const list = area?.speakers ?? [];
  if (!list.length || !me) return null;
  const room = area.rooms?.length ? placeRoomAt(placePlanOf(area), me.x, me.z)?.id ?? null : null;
  const sp = list.find(q => room && q.room === room) ?? list.reduce((b, q) => (Math.hypot(q.x - me.x, q.z - me.z) < Math.hypot(b.x - me.x, b.z - me.z) ? q : b), list[0]);
  return { x: sp.x, y: sp.y ?? 2.1, z: sp.z };
}
/**
 * v0.0.25: the height of the top of a person as drawn, for his bubble (footing.js bodySpanOf's far end off the deck: a man on the deckhead's
 * boots at 2.2 m; on the deck the 1.8 m every scene had). v0.0.26 (ui-breach, F149's page half): a man standing on a height is drawn on it
 * (render/view.js: the figure's y, the instructor on the shoot house's catwalk), so his head is 1.8 m over it, not over the floor: "GO, GO,
 * GO!" stood 2.2 m below him.
 */
function headHeightOf(s, a) {
  if (!a?.onFace || a.onFace === 'deck') { const f = figureOf(s, a, s.clock.ms); return 1.8 + ((f.posture ?? 'stand') === 'stand' && (f.y ?? 0) > 0.05 ? f.y : 0); }
  const span = typeof FOOTING.bodySpanOf === 'function' ? FOOTING.bodySpanOf(s, a) : null;
  return (Array.isArray(span) ? Math.max(span[0], span[1]) : (Number.isFinite(a.floatY) ? a.floatY + 1.0 : 2.2)) + 0.05;
}
/** The says heard (the 'say' facts: who, text, atMs, spokenMs, at?), for the speakers' bubbles; the newest SPEECH_KEPT, this state's only. */
const speech = [], SPEECH_KEPT = 24;
let speechOf = null;
const speakerEls = [];
/**
 * Who speaks now, his line in a bubble over his head (plaque.js speakerMarks and placeBubbles; feel FL-4; v0.0.24, the user's "text
 * bubble only" of 2026-11-19): every line of anyone with a body on the stage, or of a loudspeaker at its `at`, in every scene, clear
 * of the other figures, the bubbles placed before it and the HUD's rectangles; a bubble with no free place waits in the radio box.
 */
function speakerHud(s, { hidden = false } = {}) {
  const hide = (from = 0) => { for (let i = from; i < speakerEls.length; i++) speakerEls[i].hidden = true; };
  // (a new state, a new game or a load: the lines heard before it are another clock's)
  if (s !== speechOf) { speech.length = 0; speechOf = s; }
  if (hidden || !s || !stage.cam?.project) return hide();
  const marks = speakerMarks(speech, s.clock.ms);
  if (!marks.length) return hide();
  const { ox, oy, k } = pictureBox(), boxes = figureBoxes(s), byWho = new Map((s.actors?.list ?? []).filter(a => a.who).map(a => [a.who, a]));
  // (the HUD as it stands this frame: every element of it shown, a plaque included, the bubbles themselves left out; read only
  // when a bubble is to be placed; one larger than half the window is an overlay, not a panel)
  // (each rectangle grown to the whole picture pixels it touches, so a bubble at whole pixels never meets it by a fraction once scaled;
  // read after every other part of the HUD is written this frame (frame's order), so the read is the frame's one layout, never one
  // forced between two writes: the fixer of v0.0.24's reviews)
  const toPic = (q) => { const x0 = Math.floor((q.left - ox) / k), y0 = Math.floor((q.top - oy) / k), x1 = Math.ceil((q.right - ox) / k), y1 = Math.ceil((q.bottom - oy) / k); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, who: 'ui' }; };
  const ui = [...hud.children].filter(e => !e.hidden && !e.classList.contains('speaker')).map(e => e.getBoundingClientRect())
    .filter(q => q.width > 0 && q.height > 0 && q.width * q.height < 0.5 * innerWidth * innerHeight).map(toPic);
  // (a loudspeaker with no place: a head at the picture's top middle, under the HUD's top panels, the bubble standing over it)
  const topY = Math.max(0, ...ui.filter(q => q.y < stage.H / 3).map(q => q.y + q.h)) + 2;
  const headOf = (m) => {
    if (m.at === 'top') return { x: stage.W / 2 - 5, y: topY + 48, w: 10, h: 0 };
    // (a person's top as drawn, headHeightOf: on the deckhead his boots, the bubble over the man drawn head down)
    // (a line heard somewhere other than at its speaker, its `at` (v0.0.25's review of E, A and B: your #2's "Got you." and "Through."
    // at the scuttle on your deck, he 58 m off in the plan), is placed there; no shipped line carries both a speaker on the stage and an `at`)
    const a = byWho.get(m.who), p = m.at && m.at !== 'top' ? [m.at.x, m.at.y ?? 2.2, m.at.z] : a ? [a.x, headHeightOf(s, a), a.z] : null;
    if (!p) return null;
    const [hx, hy] = stage.cam.project(p[0], p[1], p[2]);
    return { x: hx - 0.3 * PX_PER_M, y: hy, w: 0.6 * PX_PER_M, h: 0.4 * PX_PER_M };
  };
  const { placed } = placeBubbles(marks, { headOf, boxes, ui, bounds: { x: 0, y: 0, w: stage.W, h: stage.H } });
  let n = 0;
  for (const { m, at } of placed) {
    const p = balloon(m.text);
    const e = speakerEls[n] ?? (speakerEls[n] = Object.assign(document.createElement('canvas'), { className: 'plaque speaker call', hidden: true }));
    if (!e.parentNode) hud.append(e);
    place(e, p, at.x + p.tip, at.y + p.h, k, 'tip', { ox, oy });
    e.style.opacity = String(m.k);
    const H = s.armoury?.range?.house;
    e.dataset.who = m.who === s.player.id ? 'me' : H && m.who === H.twoPid ? 'two' : H && m.who === H.chiefPid ? 'chief' : m.who;
    e.dataset.words = p.words;
    e.hidden = false;
    n++;
  }
  hide(n);
}
/** The figures' and stands' boxes in the picture's pixels ({ x, y, w, h, who }): the men from foot to head 0.7 m wide, the stands 0.6 m. */
function figureBoxes(s) {
  const R = s.armoury?.range, out = [];
  for (const a of s.actors?.list ?? []) { if (!a.who) continue; const [fx, fy] = stage.cam.project(a.x, 0, a.z), [, hy] = stage.cam.project(a.x, 1.85, a.z); out.push({ x: fx - 0.35 * PX_PER_M, y: Math.min(hy, fy), w: 0.7 * PX_PER_M, h: Math.abs(fy - hy) + 1, who: a.who }); }
  for (const T of R?.turners ?? []) { const [fx, fy] = stage.cam.project(T.x, 0, T.z), [, hy] = stage.cam.project(T.x, 1.8, T.z); out.push({ x: fx - 0.3 * PX_PER_M, y: Math.min(hy, fy), w: 0.6 * PX_PER_M, h: Math.abs(fy - hy) + 1, who: T.key }); }
  return out;
}
/** The plates off the room (plaque.js keepOff; feel FL-8), in the house while the lane runs: the figures, the stands, the floor of the room you are in or about to enter, the panel and the radio box; null elsewhere. */
function houseKeepOff(s, { hidden = false } = {}) {
  const H = !hidden && s?.armoury?.range?.course === 'house' ? s.armoury.range.house : null;
  if (!H || H.goAtMs === null || H.end || !stage.cam?.project) { keepOff(null); return; }
  try {
    const { ox, oy, k } = pictureBox(), boxes = figureBoxes(s), L = houseScene.curLeg(H), room = L ? roomRect(L.room) : null;
    if (room) { const [ax, ay] = stage.cam.project(room[0], 0, room[1]), [bx, by] = stage.cam.project(room[2], 0, room[3]); boxes.push({ x: Math.min(ax, bx), y: Math.min(ay, by), w: Math.abs(bx - ax), h: Math.abs(by - ay), who: 'room' }); }
    const r = rectsAt(innerWidth, innerHeight, 'weapon'), toPic = (q) => ({ x: (q.x - ox) / k, y: (q.y - oy) / k, w: q.w / k, h: q.h / k });
    for (const name of ['STEPS', 'RADIO']) if (r[name]) boxes.push({ ...toPic(r[name]), who: name });
    keepOff({ boxes, bounds: { x: 0, y: 0, w: stage.W, h: stage.H }, reserved: r.PLAQUE ? toPic(r.PLAQUE) : null });
    report.keepOff = { boxes: boxes.length, ox, oy, k };
  } catch (e) { keepOff(null); broke(e, 'the plates off the room'); }
}
/**
 * The plates off the HUD, off the house (v0.0.26's carried round, v0.0.25's fixer's held finding: in Well A the "AIM 1.9 S" plate at
 * the cadre stood half under the target card; VIEWS §7.5, nothing over the HUD): on a range course, a plate naming a target (plaque.js
 * SLIDES) keeps off the HUD's cards as they stand at the frame's start (the watch, the log's lines, the step panel, the radio box,
 * PAPER, the line; read after render() has written this frame's hud.hidden, toasts and watch, so it may force one layout where those
 * changed, as the bubbles' read of the HUD's rects does: the code review of v0.0.26, finding 6, corrected the claim that it forces none), off the target
 * card's rectangle (HITCARD) always, and off the plates placed before it (v0.0.25's C3 rule, now off the house too). No reserved rect:
 * a plate with no free side stands where it was. The house keeps its own (houseKeepOff: the room, the figures and the stands too).
 */
function plateKeepOff(s, { hidden = false } = {}) {
  if (s?.armoury?.range?.course === 'house') { houseKeepOff(s, { hidden }); return; }
  if (hidden || !s?.armoury?.range || !stage.cam?.project) { keepOff(null); return; }
  try {
    const { ox, oy, k } = pictureBox();
    const toPic = (q) => { const x0 = Math.floor((q.left - ox) / k), y0 = Math.floor((q.top - oy) / k), x1 = Math.ceil((q.right - ox) / k), y1 = Math.ceil((q.bottom - oy) / k); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, who: 'ui' }; };
    // (the HUD's own elements shown, never a plate, a bracket, a bubble or the plaque's hover; one larger than half the window is an overlay)
    const els = [...[...hud.children].filter(e => !e.hidden && !/\b(plaque|plaque-info|fartick)\b/.test(e.className)), ...toasts.el.children];
    const boxes = els.map(e => e.getBoundingClientRect()).filter(q => q.width > 0 && q.height > 0 && q.width * q.height < 0.5 * innerWidth * innerHeight).map(toPic);
    // (and the target card's own rectangle (layout.js HITCARD) whether it shows yet or not: it opens on the frame you engage, the frame
    // the plate first stands, after the plates are placed, so the last frame's layout would leave the plate under it for that frame)
    const c = rectsAt(innerWidth, innerHeight, 'weapon-hit').HITCARD;
    if (c) boxes.push(toPic({ left: c.x, top: c.y, right: c.x + c.w, bottom: c.y + c.h }));
    keepOff({ boxes, bounds: { x: 0, y: 0, w: stage.W, h: stage.H }, reserved: null });
  } catch (e) { keepOff(null); broke(e, 'the plates off the HUD'); }
}
// (a room's floor rect (m) by its id, from the house's area (the Wheel's sector 4))
// (the live area's rooms, a drawn house's own ids 'w4~<v>.rN' (scenes/assemble.js); the Wheel's sector 4 as set)
const roomRect = (id) => (areaOf(loop.state?.places?.live?.area)?.rooms ?? WHEEL_S4.rooms ?? []).find(r => r.id === id)?.rect ?? null;
/** "Again as …" a sheet on the same seed (the scene's againAs: the same targets at the same gaps). */
function againAs(rec, tier) {
  // (0.0.12: the shoot house's own, the same draws on the seed; the par kept where it was chosen)
  if (loop.state?.armoury?.range?.course === 'house') {
    let h = null;
    try { h = houseScene.againAsHouse ? houseScene.againAsHouse(loop.state, tier) : null; } catch (e) { broke(e, 'Again as'); }
    return playScene(rec, { seed: h?.seed ?? scene?.seed ?? randomSeed(), tier: h?.tier ?? tier, par: h?.par ?? null, setup: null, loadout: h?.loadout ?? null, ...(h?.breach ? { breach: h.breach } : {}), ...(h?.holdouts ? { holdouts: h.holdouts } : {}) });
  }
  let a = null;
  // (0.0.10: the stress course's own, which keeps the scene)
  try { a = loop.state?.armoury?.range?.stress && stressScene.againAsStress ? stressScene.againAsStress(loop.state, tier) : loop.state && pairsScene.againAs ? pairsScene.againAs(loop.state, tier) : null; } catch (e) { broke(e, 'Again as'); }
  // (0.0.9: with the setup it was played with: "Three bangs" again as the tier one is three bangs)
  return playScene(rec, { seed: a?.seed ?? scene?.seed ?? randomSeed(), tier: a?.tier ?? tier, hour: params.play === rec.scenario ? params.hour : null, setup: a?.setup ?? rec.setup ?? null });
}
function openScore() {
  if (!scene) return;
  // (the line names what was played, in the house: the panel, the walk, the look (D's page adds the shot))
  const { body, lines } = scoreCard({ scene: scene.rec, version: VERSION, seed: scene.seed, onCopy: copyText, onDone: () => openEnd(), played: playedNow(loop.state), house: drawnCodeOf(loop.state) });
  boot.openCard('score', body, lines);
}

addEventListener('keydown', (e) => {                                 // (debug mode: the clock moves on, through the sim)
  if (!settings.debug || !loop.state || loop.paused || e.repeat) return;
  for (const [code, ms] of DEBUG_SKIPS) if (e.code === code) input.queue(`debug:skip:${ms}`);
});
// (leaving the page: written at once, with no read first, so it lands as the page goes: store.autosaveSync)
function leaveSave() {
  const s = loop.state;
  if (!s) return;
  anchor = { json: toJSON(s), seq: s.clock.seq ?? null };
  if (settings.nostore || sceneOf(s)) return;
  try { store.autosaveSync(s, about(s), { why: 'live' }); } catch (e) { console.warn('the autosave on leaving failed', e); }
}
addEventListener('pagehide', leaveSave);
document.addEventListener('visibilitychange', () => { if (document.hidden && loop.state) { loop.pause(true, 'player'); leaveSave(); } });

// ---- a frame: the picture, the sound, the HUD, the saves, whether the page is ready ----
const report = { version: VERSION, ppm: PX_PER_M, renderer: stage.stats.gpu, view: view.stats, stage: stage.stats, pending: [], cutMs: null, cuts: [], gl: null, frame: null, painter: painter.stats, uploads: uploads.stats, audio: audio.stats, hud: null };
window.__report = report;
window.__ready = false;
const bootT0 = performance.now();
let quietFrames = 0, lastFrameT = null, benchLead = null;
// (the splash's pause, from the landing to the end of the zoom out; never shown as PAUSED)
let splashRelease = null;
function splashPause(on) {
  if (on && !splashRelease) splashRelease = loop.pauseFor('splash');
  else if (!on && splashRelease) { splashRelease(); splashRelease = null; }
}
// (the strip folded into the watch: BODY's stripOf, read once a game second, kept between)
let stripMemo = { key: null, strip: null };
function stripNow(s) {
  const key = `${s.meta?.seed}|${Math.floor(s.clock.ms / 1000)}|${seqKey(s)}`;
  if (stripMemo.key !== key) {
    let strip = null;
    try { const b = bodyOf(s, s.player?.id); strip = b ? stripOf(b, s.clock.ms, lonAt(s)) : null; } catch (e) { broke(e, 'the body strip'); }
    stripMemo = { key, strip };
  }
  return stripMemo.strip;
}
function render(alpha, s, info) {
  if (faultsOwed.length && !windowOpen()) for (const t of faultsOwed.splice(0)) toast(t, 'warn');
  const t = performance.now(), dtMs = lastFrameT === null ? 0 : t - lastFrameT;
  lastFrameT = t;
  const lon = s ? lonAt(s) : 0;
  // (the splash first: its frame for the view, the sim's next target, its pause. Its real time stands
  // still while a card is up or the tab is hidden: Esc's menu pauses the splash, TIME §6.4)
  let sf = null;
  if (s && splash.active) {
    const frozen = !!boot.card || cutHeld > 0 || loop.pauseReasons.some(r => r !== 'splash');
    try { sf = splash.frame(frozen ? 0 : Math.min(dtMs, 250) / 1000, { clockMs: s.clock.ms, skipToMs: s.skip?.toMs ?? null }); }
    catch (e) { broke(e, 'the splash'); splash.clear(); }
    if (sf && s.skip && sf.target !== null) loop.skipTarget(sf.target);
    splashPause(!!sf?.pause);
  } else {
    splashPause(false);
    if (s?.skip) loop.skipTarget(null);                              // (a skip with no splash to pace it runs on to its end)
  }
  const shown = sf?.done ? null : sf?.view ?? null;
  // (0.0.9: the chaos on the picture, the reading of this tick; the burst the last bang's)
  const sn = s ? suppRead(s) : null;
  { const me = s ? playerActor(s) : null; view.setChaos?.(sn ? { sn, ms: s.clock.ms, reduce: settings.reduceFlashes, face: me?.face ?? 'right', burst: lastBurst } : null); }
  // (0.0.9: the bay's wind for the bangs' smoke, the sim's own (wind.js windAt at the pad), only while a bang is planned)
  const bangsNow0 = s?.armoury?.range?.bangs?.plan ?? null, windNow = bangsNow0?.length ? windAt(s.meta.seed, s.clock.ms, bangsNow0[0].x, bangsNow0[0].z, { gust: false }) : null;
  // (its build sheet item 18, DW: the hot spot of the Watch or Look row under the panel's cursor, drawn lit on the floor)
  // (the play review's fourth finding: with no row under the cursor, the spot of the Watch or Look row T's act names
  // (NEXT's), so a player on the keys sees which corner T would take; the cursor's row wins)
  const hov = stepPanel.hovered, hot = hov && /^(watch|look):/.test(hov) ? hov.slice(hov.indexOf(':') + 1) : hotOfAct(s);
  view.frame(alpha, s, { ...info, lonEDeg: lon, cut: cutHeld > 0, splash: shown, wind: windNow, hot });
  // (the frame's main-thread work: its ticks and the view; the frame clock itself is the browser's)
  report.frame = { ticks: info.ticks ?? 0, tickMs: (info.ticks ?? 0) * (loop.stats.tickMs ?? 0), viewMs: view.stats.viewMs, splash: shown ? shown.phase : null };
  counters && (report.gl = { last: counters.frame(), max: counters.max, total: { bytes: counters.total.bytes, uploads: counters.total.uploads, links: counters.total.links, compiles: counters.total.compiles } });
  const uiT0 = performance.now();
  // (0.0.10: Breathe running, in or out of the mode: the box breath on the body bus)
  const breath = s ? breatheRun(s) : null;
  if (s) { try { audio.frame(s, alpha, t / 1000, { splash: shown, chaos: sn, breathing: !!breath }); const cap = audio.caption?.(); if (cap) toast(cap, 'calm'); } catch (e) { broke(e, 'the sound'); } }
  autosaveDue(info);
  if (s && launched && !launched.checked && loop.stats.ticks - launched.ticks >= RECOVER_TICKS) {
    launched.checked = true;
    if (launched.from && loop.stats.lostTicks - launched.lost >= RECOVER_TICKS) { const from = launched.from; launched = null; recoverBroken(from); }
  }
  // (the page is ready once a few frames have gone with nothing pending)
  if (!window.__ready) {
    const idle = view.idle && !cutHeld;
    quietFrames = idle ? quietFrames + 1 : 0;
    report.pending = view.pending.concat(cutHeld ? ['cut'] : []);
    if (quietFrames >= READY_FRAMES || performance.now() - bootT0 >= READY_LIMIT_MS) window.__ready = true;
  }
  // (the toasts' 16 s run while the game does: not under a card, not paused, not in a splash; on the title, always)
  toasts.frame(dtMs, !s || (!info.paused && !boot.card && !shown));
  toasts.el.hidden = !!boot.card || !!shown;
  if (!s) return;
  // (a scene's end card, once its fact has come, the splash has played out and END_HOLD_S of live play
  // gone by after it (or Enter), so the scene's last picture is seen: you clean at 19:40, the squad back down)
  if (scene?.ended && !scene.shown && !shown && !boot.card && !cutHeld) {
    if (!info.paused) scene.heldS = (scene.heldS ?? 0) + dtMs / 1000;
    if (scene.heldS >= END_HOLD_S || scene.endNow) { scene.shown = true; openEnd(); }
  }
  // (a card shows alone: the HUD is hidden under it, VIEWS §7.5)
  hud.hidden = !!boot.card;
  if (hud.hidden) return;
  // (a splash: CLOCK, the outcome strip in RADIO, the ticker in INSTINCT; everything else hidden, VIEWS §7.5)
  const inSplash = !!shown;
  watch.el.hidden = inSplash; keysHint.hidden = inSplash;
  const splashText = splashHud.update(shown, { state: s });
  const faces = inSplash ? null : watch.update(s, { strip: stripNow(s) });
  // (ROADMAP "anywhere" step 6: the G line under the watch, only when the gravity is not nominal (gravity.js gLineOf, strip.js gLineText))
  let gFacts = null;
  if (!inSplash) { try { gFacts = gLineOf(s); } catch (e) { broke(e, 'the G line'); } }
  const gText = gLine.update(gFacts);
  const showBanner = !inSplash && !cutHeld && loop.pauseReasons.some(r => r !== 'splash' && r !== 'cut');
  banner.hidden = !showBanner;
  if (showBanner) {
    const text = `PAUSED|${input.label('pause')} to carry on`;
    if (banner.dataset.text !== text) { banner.dataset.text = text; const [a, b] = text.split('|'); banner.replaceChildren(a, el('small', { textContent: b })); }
  }
  let hand = null, now = null;
  if (!inSplash) {
    try { hand = info.paused || cutHeld ? null : handOffer(s); } catch (e) { broke(e, 'the offer'); }
    try { now = instinctNow(s); } catch (e) { broke(e, 'the instinct'); }
  }
  // (R pressed once where it would wait: the line asks for it again, for HAND_AGAIN_MS)
  if (handArmedAt !== null && (performance.now() - handArmedAt > HAND_AGAIN_MS || hand?.verb !== 'wait')) handArmedAt = null;
  // (stop motion, the build sheet 0.0.5 §2.4: the step panel or the reflex card, PAPER, the plaque; the radio box in every state but a splash)
  // (in the house, the plates off the room: the boxes they keep off, set before any is placed (houseKeepOff); on another range course
  // off the HUD's cards (plateKeepOff))
  plateKeepOff(s, { hidden: inSplash });
  const weapon = weaponHud(s, alpha, { hidden: inSplash });
  // (0.0.8: the take-in's brackets and the pause's stamp; the coach's timer's paper on the pairs pad)
  const contact = contactHud(s, alpha, { hidden: inSplash });
  const froze = frozeHud(s, { hidden: inSplash });
  const timer = timerHud(s, { hidden: inSplash });
  // (0.0.10: the hit card on the stress course)
  const hit = hitHud(s, { hidden: inSplash, inStop: weapon.on });
  radio.frame(dtMs, !info.paused && !boot.card && !shown && !isHeld(s));
  // (the radio box over the panel's place while the surprise's free card holds it out of stop motion, as in stop motion: the fixer
  // of v0.0.24's play review, M2, the 1MC's and the NCO's lines inside the jink's card)
  const voices = radio.update({ hidden: inSplash, weapon: weapon.on || !!weapon.reflex, state: s });
  // (the lead: "Time stands still." in stop motion (VIEWS §7.4), v0.0.4's words while G's stub holds time, the scene's end;
  // 0.0.8: at a contact's pause, until a step is chosen, "Contact · 0.55 s." in its place)
  const pause = weapon.on && !s.skip ? pauseOf(s) : null;
  // (0.0.10: Breathe running out of the mode counts the box on the lead; in the mode the panel's running view has it)
  // (2026-11-12, the shoot house's rework R4: in the house every stop says why, the sim's one helper's words (cqb.js stopLead,
  // in the instinct's lead): "GO.", "Room clear. Next: room 2, 6.2 m.", "Door, east wall.", the contact's take-in at its pause)
  const houseLead = weapon.on && !s.skip && s.armoury?.range?.course === 'house' && now?.lead && now.lead !== 'Time stands still.' ? now.lead : null;
  const lead = benchLead ?? houseLead ?? (pause && leadStands(s, pause) ? `Contact · ${takeInWords(pause.ms)} s.` : breath && !weapon.on ? breatheLead(breath.i) : weapon.on && isHeld(s) && !s.skip ? 'Time stands still.' : info.held && !s.skip ? 'Time stands still: a digit to choose.' : scene?.ended && !scene.shown ? 'Enter: end the scene' : null);
  // (0.0.12: T's keycap names the row its act is and its time, from the panel shown)
  let actWords = null;
  if (weapon.on && now?.line?.act) { try { actWords = actWordsOf(now.line.act, readSim(s).steps); } catch (e) { broke(e, 'the instinct'); } }
  // (2026-11-15: the row the line names, its keys on the panel by its own place after the words, "Open it. Pull. [3]", as the user's
  // pick P3 drew it; not where the words already name them ("To the head: 4."))
  let rowKeys = null;
  if (weapon.on && now?.line?.row) { try { rowKeys = stepPanel.rowKeys(now.line.row); } catch (e) { broke(e, 'the instinct'); } }
  const line = instinct.update({ hidden: inSplash, lead, now, offer: hand, armed: handArmedAt !== null, ui: uiK, actWords, rowKeys });
  // (who speaks, over his head: after every other part of the HUD is written this frame, the hit card, the radio box and the line
  // among them, so a bubble is placed clear of what the frame shows (the fixer of v0.0.24's reviews: a bubble under the hit card, one
  // a pixel into the radio box, and a forced layout between the HUD's writes))
  // (on a ship, the HUD's door words said as a hatch's: the panel, the line, the plates (ui/ship-words.js; v0.0.25's fixer))
  try { shipText(hud, s); } catch (e) { broke(e, 'the words'); }
  speakerHud(s, { hidden: inSplash || !!boot.card });
  report.hud = { watch: faces, gline: gText, offer: line, line, plate: instinct.plate, toasts: toasts.lines, splash: splashText, steps: weapon.steps, reflex: weapon.reflex, paper: weapon.paper, plaque: weapon.plaque, radio: voices, weapon: weapon.on, far: weapon.far,
    terms: termsPlate.hidden ? '' : termsPlate.dataset.text ?? '', timer, contact, lead, froze, chaos: view.stats.chaos ?? null, hit,
    contactPlate: contactPlate.hidden ? '' : contactPlate.dataset.text ?? '', parts: partsPlate.hidden ? '' : partsPlate.dataset.text ?? '' };
  avpuFade(s);
  // (the HUD's and the sound's share of the frame: CONTRACTS §7's UI DOM budget is 1 ms)
  report.frame.uiMs = performance.now() - uiT0;
}
// ---- the weapon mode's HUD (the build sheet 0.0.5 §2.4) ----
// (the --ui scale now, for the PAPER inset's crisp pixels: layout.js's, read on resize)
let uiK = uiScale(innerWidth, innerHeight);
addEventListener('resize', () => { uiK = uiScale(innerWidth, innerHeight); });
const HIDDEN_WEAPON = Object.freeze({ on: false, steps: '', reflex: '', paper: '', plaque: '', far: '' });
// (what the sim says of stop motion, read once a tick, not once a frame: the state moves only in ticks, 20 a
// second, and the frames are three times that; CONTRACTS §7's 1 ms for the UI, which the panel's readers took
// alone while firing)
let simRead = { key: null };
// (the KD course's view, kdNow, once a tick: the stages, groups, strings, pits, the coach's call; null off the KD)
const kdOf = (s) => { try { return kdScene.kdNow ? kdScene.kdNow(s, s.clock.ms) : null; } catch (e) { broke(e, 'the KD'); return null; } };
function readSim(s) {
  const key = `${readKey(s)}|${s.stop?.phase}|${s.stop?.pick}|${s.stop?.aim?.key}`;
  if (simRead.key === key && simRead.state === s) return simRead;
  const r = { key, state: s, st: null, steps: [], belief: null, finish: null, other: null, range: null, look: null, targets: [], kd: null, far: null };
  try { r.st = stopNow(s); } catch (e) { broke(e, 'stop motion'); }
  try { r.range = rangeNow(s); r.kd = r.range?.course === 'kd' ? kdOf(s) : null; } catch (e) { broke(e, 'the range'); }
  if (r.st?.mode === 'stop') {
    if (!r.st.reflex) { try { r.steps = stepsOf(s); } catch (e) { broke(e, 'the step panel'); } }
    try { r.belief = s.stop?.gun ? beliefOf(s, s.stop.gun) : null; } catch (e) { broke(e, 'the weapon card'); }
    // (the gun's finish, the card's colours: the item's own by its id, never the belief's, which the card reads only for what is believed)
    r.finish = s.stop?.gun && s.items?.[s.stop.gun] ? finishOf(s.items[s.stop.gun]) : null;
    // (v0.0.18: the gun not in use, its place and its own belief, for the card's strip: null with one gun)
    try { r.other = s.stop?.who ? otherGunView(s, s.stop.who) : null; } catch (e) { broke(e, 'the weapon card'); }
    try { r.look = r.range ? rangeLook(s, s.clock.ms) : null; } catch (e) { broke(e, 'the PAPER inset'); }
    try { r.targets = targetsOf(s, s.player.id); } catch (e) { broke(e, 'the targets'); }
  }
  return (simRead = r);
}
/** The KD line you are on (200, 300, 500), for the card's dope: kdNow's, where it is a firing line. */
const kdLineOf = (kd) => ([200, 300, 500].includes(kd?.line) ? kd.line : null);
/** Your KD lane (6 + your bay lane: range.js kdLane), or null. */
const kdLaneOf = (s, range) => { try { return kdScene.kdLane?.(s) ?? (Number.isFinite(range?.lane) ? 6 + range.lane : null); } catch { return null; } };
/**
 * PAPER on the KD course (cards/kd.js): the zero card live as you fire, the group card once the coach has read the group
 * (until the next commence fire), your face as the pits mark it, the score card at a string's end; null where the far
 * window shows the face (PAPER yields: 'weapon-far').
 */
function kdPaper(s, sim) {
  const kd = sim.kd, R = sim.range, lane = kd?.line === 25 ? kd.lane ?? R?.lane ?? null : R?.lane ?? null, kdLane = kd?.kdLane ?? kdLaneOf(s, R);
  if (!kd) return null;
  if (kd.stage === 'zero' || kd.line === 25) {
    const groups = kd.groups ?? [], last = groups.at(-1);
    if (last && !kd.hot && (last.call || last.ok || last.centreCm)) return groupCardModel(groups, { lane });
    const holes = groups.flatMap((g, i) => (g.holes ?? []).map((h, j) => ({ at: atOf(h), score: h?.score, v: h?.v, n: j + 1, old: i < groups.length - 1 })));
    return faceModel('zero25', { holes, label: `LANE ${lane ?? '?'} · GROUP ${Math.max(1, groups.length)}`, scoreLines: null });
  }
  const strs = kd.strings ?? [], last = strs.at(-1) ?? null, line = kdLineOf(kd);
  const pit = kd.pits?.[kdLane] ?? null, cur = last && last.line === line ? last : null;
  // (the score card once the line is cold and the pits have marked every hole of the string: never a score before its marks)
  const same = (a, b) => Array.isArray(a) && Array.isArray(b) && Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
  const marked = !!cur && (cur.holes ?? []).every(h => !h.at || (pit?.holes ?? []).some(p => same(atOf(p), h.at)));
  if (cur && !kd.hot && cur.holes?.length && marked && pit?.phase === 'up') return kdScoreModel(cur, { lane: kdLane });
  return kdLiveModel(pit, { paper: cur?.paper ?? 'kdA', lane: kdLane, line, str: cur });
}
/** The step panel or the reflex card, PAPER, the plaque and its brackets, the far window, for the state now: { on, steps, reflex, paper, plaque, far } (their texts). */
function weaponHud(s, alpha, { hidden = false } = {}) {
  // (R7: the layout played rides the state as a runtime key (never saved), so the DI's line names the keys of the panel drawn)
  if (s && s.$panel !== settings.panel) s.$panel = settings.panel;
  // (R8: the walk cycle played, the same way: the sim counts the gait phase in its steps, the view draws its frames)
  if (s && settings.cycle && s.$cycle !== settings.cycle) s.$cycle = settings.cycle;
  if (s && settings.houseLight && s.$houseLight !== settings.houseLight) s.$houseLight = settings.houseLight;
  const sim = s && !hidden ? readSim(s) : null, st = sim?.st ?? null;
  const on = st?.mode === 'stop';
  hud.classList.toggle('weapon', !!on);
  // (the KD's PAPER first: the group card and the score card stay up with the far window open, which then goes round
  // PAPER (the state 'weapon'); the live face yields to the window, which shows it ('weapon-far'))
  let kdModel = null;
  if (on && sim?.kd) { try { kdModel = kdPaper(s, sim); } catch (e) { broke(e, 'the PAPER inset'); } }
  const keepPaper = kdModel?.card === 'group' || kdModel?.card === 'score';
  // (the far window, in stop motion or by E held on a KD line: placed before PAPER, which yields to it)
  const far = s && !hidden ? farHud(s, sim, on, { paper: keepPaper }) : farHud(null);
  if (!on) {
    // (ROADMAP "anywhere" step 6: the surprise's card out of stop motion, a ship's crew's: the reflex card alone, time standing still)
    let card = null;
    if (s && !hidden) { try { card = gravCardOf(s); } catch (e) { broke(e, 'the gravity card'); } }
    stepPanel.update({ hidden: true }); const reflexText = reflexCard.update(card); paperInset.update(null); aimHud(null);
    return { ...HIDDEN_WEAPON, reflex: reflexText ?? '', far: far?.words ?? '' };
  }
  // (0.0.8: the pairs pad has no card to show close: PAPER is the coach's timer's (timerHud))
  // (0.0.12: the shoot house's PAPER is the instructor's lane timer too)
  const onPairs = sim.range?.course === 'pairs' || sim.range?.course === 'house' || s.armoury?.range?.course === 'house';
  let stepsText = '', reflexText = '', paperText = '';
  // (zeroing: on the KD zero until the coach accepts it, the card counts the clicks dialled in this zero: kdNow's, shot.js zeroingOf)
  const distance = { distance: !!sim.kd, line: kdLineOf(sim.kd), hold: s.stop?.hold ?? null, zeroing: sim.kd?.zeroing ?? null, finish: sim.finish, other: sim.other, gunShort: armouryGunShort(s, sim.belief?.short ?? null) };
  // (0.0.7: the range's own actions at their commands (range.js kdActs: police your brass, rounds to the coach, "No brass,
  // no ammo"), rows of the panel among the commands, the tower's current marked; sent as the range's action, not a step)
  const acts = (sim.kd?.acts ?? []).map(a => ({ id: a.id, kind: 'command', label: a.label, ms: a.ms ?? null, rushMs: null, carefulMs: null, odds: null, routine: null, off: null, subs: [], cmd: true, skill: null, act: a.id }));
  const steps = acts.length ? [...sim.steps.filter(x => x.kind === 'fire' || x.kind === 'aim' || x.kind === 'hold'), ...acts, ...sim.steps.filter(x => !(x.kind === 'fire' || x.kind === 'aim' || x.kind === 'hold'))] : sim.steps;
  // (a reflex card: the weapon card stays at its place, the reflex card beside it in the rest of STEPS)
  // (the fixer of the code review: the surprise's free card (gravity.js gravCardOf) holds time in stop motion too, so it is
  // shown there in the reflex card's place and its digits answer it (gravCardKey); before, it held time with no card drawn)
  let grav = null;
  if (!st.reflex) { try { grav = gravCardOf(s); } catch (e) { broke(e, 'the gravity card'); } }
  if (st.reflex || grav) { stepPanel.update({ cardOnly: true, steps: [], belief: sim.belief, ui: uiK, ...distance }); reflexText = st.reflex ? reflexCard.update(st.reflex, { keep: reflexKeep }) : reflexCard.update(grav); }
  else {
    reflexCard.update(null);
    // (R7: the panel's model by the layout played, T's act on NEXT with its words, and a key a decision, so a drawer or a bank
    // opened at one stop is closed at the next and layout A's FIRE opens by itself at each contact's pause)
    if (st.phase !== panelSeen.phase || st.via !== panelSeen.via) { if (st.phase === 'choose') panelSeen.seq++; panelSeen.phase = st.phase; panelSeen.via = st.via; }
    const tNow = instinctNow(s), act = tNow?.line?.act ?? null;
    let tWords = null;
    if (act) { try { tWords = actWordsOf(act, steps) ?? tNow.line.short ?? null; } catch (e) { broke(e, 'the panel'); } }
    stepsText = stepPanel.update({ phase: st.phase, steps, page: stepPage, shift: input.peek().run, doing: st.doing, nowMs: s.clock.ms + (isHeld(s) ? 0 : alpha * TICK_MS), belief: sim.belief, ticks, ui: uiK, chaos: suppRead(s), bundle: bundleRead(s), ...distance,
      layout: settings.panel, act, actWords: tWords, stopKey: panelSeen.seq, diRow: tNow?.line?.row ?? null });
  }
  try {
    if (far?.open && !keepPaper) paperText = paperInset.update(null);
    else if (sim.kd) paperText = paperInset.update(kdModel, { ui: uiK });
    else if (onPairs) paperText = paperInset.update(null);
    else {
      const mine = sim.look?.lanes?.find(l => l.mine) ?? null;
      paperText = paperInset.update(mine ? paperModel(mine, { last: lastString, hot: !!sim.range?.hot }) : null, { ui: uiK });
    }
  } catch (e) { broke(e, 'the PAPER inset'); }
  return { on: true, steps: stepsText, reflex: reflexText, paper: paperText, plaque: aimHud(s, st, sim.targets, sim.range), far: far?.words ?? '' };
}
// ---- a casualty's picture (BODY §17.2: AVPU; the build sheet 0.0.7 §2.5: the fade at P and U is the hud's) ----
/** The picture's dimming by AVPU (0 clear; my calls: V a shade, P most of it, U nearly black). */
const AVPU_FADE = Object.freeze({ A: 0, V: 0.25, P: 0.6, U: 0.92 });
let avpuMemo = { key: null, a: 'A' };
function avpuFade(s) {
  const key = `${s.meta?.seed}|${s.clock.ms}|${seqKey(s)}`;
  if (avpuMemo.key !== key) {
    let a = 'A';
    try { const rec = wounds.avpuOf ? bodyOf(s, s.player?.id) : null; a = rec && (rec.injuries?.length || rec.knock || rec.dead) ? wounds.avpuOf(rec, s.clock.ms) ?? 'A' : 'A'; } catch (e) { broke(e, 'the casualty\'s picture'); }
    avpuMemo = { key, a };
  }
  const o = AVPU_FADE[avpuMemo.a] ?? 0;
  fadeEl.hidden = !o;
  if (o && fadeEl.dataset.avpu !== avpuMemo.a) { fadeEl.style.opacity = String(o); fadeEl.dataset.avpu = avpuMemo.a; }
}
// ---- the far window (VIEWS §2.4; the build sheet 0.0.7 §2.4, §2.5 (b)) ----
/** The far window's radius in picture pixels (VIEWS §2.4: 0.22 × the picture's base height, 79 px at 16 px/m). */
const FAR_R_PIC = Math.round(0.22 * RES[1]);
let farNow = null;                                                     // ({ far, place, open, alpha }: the frame's, for targetPx and the handle)
// (the stack beside the far window, in picture px: its label, then a far target's plaque and its terms' plate, the sizes
// aimHud drew last (a frame behind: they change with the words); placeFar keeps the whole stack free of the HUD)
let farStack = { plaque: { w: 120, h: 15 }, terms: { w: 170, h: 12 } };
const STACK_GAP_PX = 2;
/** The rectangles the far window's hover keeps clear of (layout.js's weapon-far state). */
const STATES_FAR = HUD_STATES['weapon-far'];
/** The wind flags near the player on the KD as boxes on the page (layout.js flagToKeep's): the pole's foot projected, FLAG_KEEP_M round it. */
const FLAG_NEAR_M = 30;
let farFlag = null;                                                    // (the flag kept clear this frame, for the handle)
function flagBoxes(s, me, ox, oy, k) {
  if (s?.places?.live?.area !== KD_RANGE.area) return [];
  const out = [];
  for (const f of KD_RANGE.kd.flags) {
    const dM = Math.hypot(f.x - me.x, f.z - me.z);
    if (dM > FLAG_NEAR_M) continue;
    const [ax, ay] = stage.cam.project(f.x - FLAG_KEEP_M.side, 0, f.z - FLAG_KEEP_M.up), [bx, by] = stage.cam.project(f.x + FLAG_KEEP_M.side, 0, f.z + FLAG_KEEP_M.down);
    out.push({ x: ox + ax * k, y: oy + ay * k, w: (bx - ax) * k, h: (by - ay) * k, dM, fx: f.x, fz: f.z });
  }
  return out;
}
/** The far window this frame: placed, handed to the stage, labelled and ticked. Returns { open, words } or null. */
function farHud(s, sim = null, inStopMode = false, { paper = false } = {}) {
  const hideAll = () => { farLabelEl.hidden = farTickEl.hidden = true; try { view.setFar?.(null); } catch (e) { broke(e, 'the far window'); } farNow = null; return null; };
  if (!s || !stage.cam?.project) return hideAll();
  let far = null;
  try { far = shooting.farPointOf ? shooting.farPointOf(s, s.player.id, { looking: !!input.peek().look }) : null; } catch (e) { broke(e, 'the far point'); }
  if (!far) return hideAll();
  const me = playerActor(s);
  if (!me) return hideAll();
  const { ox, oy, k } = pictureBox();
  const [px, py] = stage.cam.project(me.x, 0.9, me.z), [fx, fy] = stage.cam.project(far.x, far.y ?? 0, far.z);
  const bearingRad = Math.atan2(fy - py, fx - px);
  const spec = farLabel(far), pq = plaque(spec);
  const hudState = inStopMode ? (paper ? (loop.paused ? 'weapon-paused' : 'weapon') : loop.paused ? 'weapon-far-paused' : 'weapon-far') : loop.paused ? 'paused' : 'walking';
  // (in stop motion the stack holds the label, the plaque and the terms; walking (E held), the label alone)
  const stackW = inStopMode ? Math.max(pq.w, farStack.plaque.w, farStack.terms.w) : pq.w, stackH = inStopMode ? pq.h + farStack.plaque.h + farStack.terms.h + 2 * STACK_GAP_PX : pq.h;
  const place = { bearingRad, rCss: FAR_R_PIC * k, k, frame: { x: ox, y: oy, w: stage.W * k, h: stage.H * k }, from: { x: ox + px * k, y: oy + py * k }, label: { w: stackW * k, h: stackH * k } };
  // (the wind flag you read kept clear of the window and its plates as the HUD is; nowhere else to go, the window over it)
  const flag = flagToKeep(innerWidth, innerHeight, hudState, flagBoxes(s, me, ox, oy, k), place.frame);
  let p = flag ? placeFar(innerWidth, innerHeight, hudState, { ...place, keep: [flag] }) : null;
  if (!p || p.hidden) p = placeFar(innerWidth, innerHeight, hudState, place);
  farFlag = flag && !p.hidden && !overlaps({ x: p.cx - p.RK, y: p.cy - p.RK, w: 2 * p.RK, h: 2 * p.RK }, flag) && !(p.label && overlaps(p.label, flag)) ? flag : null;
  if (p.hidden) return hideAll();
  const optic = (sim?.belief?.optic ?? 1) === 4 ? 4 : 1;
  try { view.setFar?.({ key: far.key, x: far.x, y: far.y ?? 0, z: far.z, rangeM: far.rangeM, cx: p.cx, cy: p.cy, rCss: p.r, optic, hold: s.stop?.hold ?? null }); } catch (e) { broke(e, 'the far window'); }
  let fs = null;
  try { fs = view.farState?.() ?? null; } catch { fs = null; }
  const alpha = fs ? fs.alpha ?? (fs.open ? 1 : 0) : 1, open = fs ? !!fs.open || alpha > 0 : true;
  // (the label beside the disc where placeFar left room, and the tick on the ring along the true bearing; both at the dissolve's alpha)
  if (p.label) {
    if (farLabelEl.$p !== pq) { farLabelEl.$p = pq; farLabelEl.width = pq.w; farLabelEl.height = pq.h; farLabelEl.getContext('2d')?.drawImage(pq.canvas, 0, 0); farLabelEl.dataset.text = pq.words; }
    farLabelEl.style.width = `${pq.w * k}px`; farLabelEl.style.height = `${pq.h * k}px`;
    // (the label nearest the disc: at the stack's top when it is under the disc, at its foot over it, centred across it)
    const lx = p.label.x + (p.label.w - pq.w * k) / 2, ly = p.label.side === 'above' ? p.label.y + p.label.h - pq.h * k : p.label.y;
    farLabelEl.style.transform = `translate(${Math.round(lx)}px, ${Math.round(ly)}px)`;
    farLabelEl.style.opacity = String(alpha); farLabelEl.hidden = !open;
  } else farLabelEl.hidden = true;
  const t = farTick(p, k);
  if (t) {
    const len = Math.hypot(t.x1 - t.x0, t.y1 - t.y0);
    farTickEl.style.width = `${Math.round(len)}px`; farTickEl.style.height = `${Math.max(1, Math.round(k))}px`;
    farTickEl.style.transform = `translate(${Math.round(t.x0)}px, ${Math.round(t.y0)}px) rotate(${p.tickRad}rad)`;
    farTickEl.style.opacity = String(alpha); farTickEl.hidden = !open;
  }
  farNow = { far, place: p, open, alpha, k, ox, oy, mag: fs?.mag ?? 4 };
  return { open, words: open ? pq.words : '' };
}
// (where the picture lies on the page: its top-left and its CSS pixels a picture pixel; stage.js fit() sets them)
const pictureBox = () => { const c = stage.canvas.style; return { ox: parseFloat(c.left) || 0, oy: parseFloat(c.top) || 0, k: (parseFloat(c.width) || stage.W) / stage.W }; };
/**
 * A target's place in the picture: its centre and its frame's size in picture pixels { x, y, w, h } (a card on its backer; a
 * person standing). A far one (0.0.7) stands in the far window: its centre the window's, its frame FACE_K times life size at
 * the window's density (0.0.8: the lever's scale, far.js farBracketPx, 4 px clear of the face at 1×), and the disc's radius
 * (rPic) so the plaque stands clear of the window.
 */
function targetPx(t) {
  if (t.far && farNow?.place && farNow.far?.key === t.key) {
    // (0.0.8: the face as the window draws it at the lever's scale, 16 px/m at 4×, 4 at 1×, the brackets clear of it at 1×)
    const { place: p, k, ox, oy, mag } = farNow, size = farBracketPx(mag, (t.paper === 'kdB' ? 1.2 : 1.0) * FACE_K, PX_PER_M);
    return { x: (p.cx - ox) / k, y: (p.cy - oy) / k, w: size, h: size, far: true, rPic: p.RK / k, labelSide: p.label?.side ?? null,
      stack: p.label ? { x: (p.label.x - ox) / k, y: (p.label.y - oy) / k, w: p.label.w / k, h: p.label.h / k, side: p.label.side } : null };
  }
  // (0.0.8: a turner's face as the stage draws it, TURNER_K times life size about its centre's height: the box the brackets close on)
  if (t.kind === 'turner') {
    const [x, y] = stage.cam.project(t.x, t.y ?? 1.35, t.z), tp = turnerPx(PX_PER_M);
    return { x, y, w: tp.w, h: tp.h };
  }
  const paper = t.kind === 'paper', lane = paper ? KD_RANGE.bay.lanes.find(l => l.lane === t.lane) : null;
  const yM = paper ? t.y ?? lane?.target.centreY ?? 0.6 : (t.y ?? 0) + 0.9, frame = paper ? lane?.target.frameM ?? [1.0, 1.2] : [0.6, 1.8];
  const [x, y] = stage.cam.project(t.x, yM, t.z);
  return { x, y, w: Math.round(frame[0] * PX_PER_M), h: Math.round(frame[1] * PX_PER_M) };
}
/** The target under the pointer now (its key), or null: within its frame's box in the picture. list: targetsOf's, if read already. */
function targetUnderPointer(list = null) {
  const s = loop.state, m = input.mouse;
  if (!s || !m.inside || !stage.cam?.project) return null;
  if (!list) { try { list = targetsOf(s, s.player.id); } catch { return null; } }
  // (the pointer over the plaque hovers what it names: the words are where a player reaches for the numbers)
  if (plaqueRect && m.x >= plaqueRect.x0 && m.x <= plaqueRect.x1 && m.y >= plaqueRect.y0 && m.y <= plaqueRect.y1 && list.some(t => t.key === plaqueRect.key)) return plaqueRect.key;
  let best = null, bd = Infinity;
  for (const t of list) {
    // (a far target outside the window's frame is not under the pointer: it is aimed through the window, or by the keys)
    if (t.far && !(farNow?.far?.key === t.key)) continue;
    const p = targetPx(t), dx = Math.abs(m.x - p.x), dy = Math.abs(m.y - p.y);
    if (dx <= p.w / 2 + 3 && dy <= p.h / 2 + 3 && dx + dy < bd) { best = t.key; bd = dx + dy; }
  }
  return best;
}
/** The plaque over what the brackets, the pointer or the aim are on, its brackets, its terms at distance, and its hover's list. Returns the plaque's words. */
function aimHud(s, st = null, list = [], range = null) {
  const hide = () => { aimPlaque.hidden = pickBox.hidden = aimBox.hidden = plaqueInfo.hidden = termsPlate.hidden = contactPlate.hidden = partsPlate.hidden = true; plaqueRect = null; return ''; };
  if (!s || !st || st.reflex || !stage.cam?.project) return hide();
  // (a cold line, or a handling step running: no plaque counting over the card, the brackets at half strength so the
  // lane stays marked (the design review's: "+4 IN 2.8 S · ON SAFE" jumping through SHOW CLEAR's sub-steps))
  const sub = st.doing?.kind !== 'wait' ? st.doing?.list?.[st.doing.i] ?? null : null;
  const quiet = (range && range.hot === false) || (sub !== null && !['aim', 'hold', 'fire'].includes(sub));
  aimBox.style.opacity = pickBox.style.opacity = quiet ? '0.5' : '';
  hoverKey = targetUnderPointer(list);
  const aimedKey = st.aim?.key ?? null, shownKey = hoverKey ?? st.pick ?? aimedKey;
  // (a far target whose window is not open has nowhere in the picture to stand: no brackets, no plaque, until it opens)
  // (0.0.8: a turner edge-on or turned away is no target in the picture: no brackets left round its edge)
  const placed = (t) => !!t && (!t.far || farNow?.far?.key === t.key) && !(t.kind === 'turner' && (t.facingK ?? 1) < 0.5);
  const shown0 = list.find(t => t.key === shownKey) ?? null, aimed0 = list.find(t => t.key === aimedKey) ?? null;
  const shown = placed(shown0) ? shown0 : null, aimed = placed(aimed0) ? aimed0 : null;
  if (!shown && !aimed) return hide();
  const { ox, oy, k } = pictureBox();
  if (aimed) { const p = targetPx(aimed); place(aimBox, bracket({ w: p.w, h: p.h, style: 'tail' }), p.x, p.y, k, 'centre', { ox, oy }); aimBox.hidden = false; } else aimBox.hidden = true;
  if (shown && shown.key !== aimedKey) { const p = targetPx(shown); place(pickBox, bracket({ w: p.w, h: p.h, style: 'seen' }), p.x, p.y, k, 'centre', { ox, oy }); pickBox.hidden = false; } else pickBox.hidden = true;
  if (!shown || quiet) { aimPlaque.hidden = plaqueInfo.hidden = termsPlate.hidden = contactPlate.hidden = partsPlate.hidden = true; plaqueRect = null; return ''; }
  // (the plaque's record, once a tick and a target: the shot role's plaqueOf, the roll's own list)
  const memoKey = `${s.clock.ms}|${seqKey(s)}|${shown.key}|${aimedKey}`;
  if (plaqueMemo?.key !== memoKey) {
    let rec = null;
    try { rec = plaqueOf(s, s.player.id, { target: shown }); } catch (e) { broke(e, 'the plaque'); }
    plaqueMemo = { key: memoKey, rec };
  }
  // (on the aimed card, Fire struck in the panel says why in CLICK FIRE's place: 'ON SAFE', 'A STOPPAGE')
  const fireOff = shown.key === aimedKey ? (simRead.state === s ? simRead.steps : []).find(x => x.id === 'fire')?.off ?? null : null;
  // (by the keys, the plaque names Fire's digit, not a click: '+4 IN 1.4 S · 1 HELD FIRE'; CLICK FIRE after a mouse move)
  const fireKey = lastInput === 'key' ? (simRead.state === s ? stepPanel.slots : []).find(x => x.step?.id === 'fire')?.key ?? '1' : null;
  const rec = plaqueMemo.rec ? { ...plaqueMemo.rec, ...(fireOff ? { fireOff } : {}), ...(fireKey ? { fireKey } : {}) } : null;
  if (!rec) { aimPlaque.hidden = plaqueInfo.hidden = termsPlate.hidden = contactPlate.hidden = partsPlate.hidden = true; plaqueRect = null; return ''; }
  // (a far target's plaque stands in the stack beside the window that placeFar kept free, with no notch: the window is what it names)
  const p = targetPx(shown), st0 = p.far ? p.stack : null;
  // (0.0.8: a turner's plaque stands beside it, not over it: the pairs pad's lanes are 3 m apart up the picture, and a stack
  // over one target covered the next; it goes to its right, over the 25 m frames this course leaves unused, or its left
  // where the picture's edge is near, unnotched, its middle level with the target's)
  const beside = shown.kind === 'turner' && !st0;
  const pq = plaque({ ...shotPlaque(rec, { aimed: shown.key === aimedKey }), ...(st0 || beside ? { notch: false } : {}) });
  const tp = rec.terms?.length ? termsPlaque(rec.terms, { ringOdds: rec.kd?.ringOdds ?? null }) : null;
  if (st0) farStack = { plaque: { w: pq.w, h: pq.h }, terms: tp ? { w: tp.w, h: tp.h } : { w: 0, h: 0 } };
  // (kept inside the picture, 2 px from its edges: a card near the frame's edge, or a long reason, ran it off
  // the page's right side: the integrator's; the notch then points a little off the card rather than the words being cut)
  // (in the far window's stack: under the label when the stack hangs under the disc, the terms under it; over it, the
  // terms first and the plaque next to the label; beside it, under the label)
  const lh = farLabelEl.$p?.h ?? 12, G = STACK_GAP_PX;
  const sx = st0 ? st0.x + st0.w / 2 : 0;
  // (0.0.12: and to the side with no other card under the stack's column: in the house room 1's second man stood just right
  // of the first, and the contact's plate, the row's and the plaque covered him as he turned (the fixer's, after the runtime
  // review); a turner still edge-on counts, his turn may come under the plates)
  const others = beside && range?.course === 'house' ? list.filter(t => t.key !== shown.key && t.kind === 'turner' && !t.far).map(targetPx) : [];
  const blockedAt = (right) => others.some(o => (right ? o.x > p.x && o.x - o.w / 2 < p.x + p.w / 2 + 150 : o.x < p.x && o.x + o.w / 2 > p.x - p.w / 2 - 150) && o.y + o.h / 2 > p.y - 90 && o.y - o.h / 2 < p.y + 20);
  const fitsR = p.x + p.w / 2 + 5 + 140 <= stage.W - 2, fitsL = p.x - p.w / 2 - 5 - 140 >= 2;
  const sideR = beside && fitsR && (!fitsL || !blockedAt(true) || blockedAt(false)), sideX = beside ? (sideR ? Math.round(p.x + p.w / 2 + 5) : Math.round(p.x - p.w / 2 - 5)) : 0;
  const tipX = st0 ? Math.round(sx - pq.w / 2) + pq.tip : beside ? (sideR ? sideX : sideX - pq.w) + pq.tip : Math.max(pq.tip + 2, Math.min(stage.W - (pq.w - pq.tip) - 2, p.x));
  const tipY = st0 ? (st0.side === 'above' ? st0.y + (tp ? tp.h + G : 0) + pq.h : st0.y + lh + G + pq.h) : beside ? Math.round(p.y - pq.h / 2) + pq.h : p.y - p.h / 2 - 3;
  place(aimPlaque, pq, tipX, tipY, k, 'tip', { ox, oy });
  aimPlaque.hidden = false;
  plaqueRect = { key: shown.key, x0: tipX - pq.tip, x1: tipX - pq.tip + pq.w, y0: tipY - pq.h, y1: tipY };
  // (0.0.7: the terms at distance, a plate of glyphs: range, wind, hold, zero, the rings' odds; over the plaque near a
  // target in the picture, in the far window's stack beside the window)
  let tpRect = null;
  if (tp) {
    const ty = st0 ? (st0.side === 'above' ? st0.y : tipY + G) : tipY - pq.h - 1 - tp.h;
    const tx = st0 ? Math.round(sx - tp.w / 2) : Math.max(2, Math.min(stage.W - tp.w - 2, tipX - Math.floor(tp.w / 2)));
    tpRect = { x: ox + tx * k, y: oy + ty * k, w: tp.w * k, h: tp.h * k };
    if (termsPlate.$p !== tp) { termsPlate.$p = tp; termsPlate.width = tp.w; termsPlate.height = tp.h; termsPlate.getContext('2d')?.drawImage(tp.canvas, 0, 0); termsPlate.dataset.text = tp.words; }
    termsPlate.style.width = `${tp.w * k}px`; termsPlate.style.height = `${tp.h * k}px`;
    termsPlate.style.transform = `translate(${Math.round(ox + tx * k)}px, ${Math.round(oy + ty * k)}px)`;
    termsPlate.hidden = false;
  } else termsPlate.hidden = true;
  // (0.0.8: over the plaque, a shot row's parts (the row hovered in the panel, else the first offered) and, at a contact's pause
  // until a step is chosen, the plaque's lead: "CONTACT · RIFLE · TAKEN IN 0.55 S" and its strip; kept inside the picture)
  const pause0 = pauseOf(s), lead = pause0 && leadStands(s, pause0) && (pause0.ids ?? []).includes(shown.key) ? pause0 : null;
  const row = !p.far && st.pick === shown.key ? shotRowShown(s) : null;
  let stackTop = tpRect ? (tpRect.y - oy) / k : tipY - pq.h;
  const stackAt = (elx, pp) => {
    // (beside a turner: aligned on the plaque's side; over any other target: centred on the plaque's notch)
    const cx = beside ? (sideR ? sideX + pp.w / 2 : sideX - pp.w / 2) : Math.max(Math.ceil(pp.w / 2) + 2, Math.min(stage.W - Math.ceil(pp.w / 2) - 2, tipX)), cy = stackTop - 1 - pp.h / 2;
    place(elx, pp, cx, cy, k, 'centre', { ox, oy });
    elx.hidden = false;
    stackTop = cy - pp.h / 2;
    return { x: ox + (cx - pp.w / 2) * k, y: oy + (cy - pp.h / 2) * k, w: pp.w * k, h: pp.h * k };
  };
  let partsRect = null, leadRect = null;
  if (row) partsRect = stackAt(partsPlate, rowPartsPlaque(row, { secs: (ms) => (ms / 1000).toFixed(2) })); else partsPlate.hidden = true;
  if (lead) leadRect = stackAt(contactPlate, contactPlaque({ ms: lead.ms, words: takeInWords(lead.ms), ident: lead.ident?.[shown.key] ?? null, state: lead.state?.[shown.key] ?? null })); else contactPlate.hidden = true;
  // (the plates over a target never over the lane timer's paper (VIEWS §7.5, nothing overlaps; the design review of 2026-11-13: at
  // every house contact "CONTACT · RIFLE · TAKEN IN" and the plaques hid the timer's third and fourth rows, and the overlap
  // check had neither): the stack moves the least way off it, left, right or under the paper, all its plates together)
  if (!p.far && !timerPaper.el.hidden) {
    const tr = timerPaper.el.getBoundingClientRect(), aimR = { x: ox + (tipX - pq.tip) * k, y: oy + (tipY - pq.h) * k, w: pq.w * k, h: pq.h * k };
    const plates = [[aimPlaque, aimR], [termsPlate, tpRect], [partsPlate, partsRect], [contactPlate, leadRect]].filter(([e, r]) => r && !e.hidden);
    const U = plates.reduce((u, [, r]) => ({ x0: Math.min(u.x0, r.x), y0: Math.min(u.y0, r.y), x1: Math.max(u.x1, r.x + r.w), y1: Math.max(u.y1, r.y + r.h) }), { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
    if (tr.width > 0 && plates.length && overlaps({ x: U.x0, y: U.y0, w: U.x1 - U.x0, h: U.y1 - U.y0 }, { x: tr.left, y: tr.top, w: tr.width, h: tr.height })) {
      const moves = [{ dx: tr.left - 4 - U.x1, dy: 0 }, { dx: tr.right + 4 - U.x0, dy: 0 }, { dx: 0, dy: tr.bottom + 4 - U.y0 }].filter(m => U.x0 + m.dx >= 0 && U.x1 + m.dx <= innerWidth && U.y1 + m.dy <= innerHeight);
      const m = moves.sort((a, b) => Math.hypot(a.dx, a.dy) - Math.hypot(b.dx, b.dy))[0];
      if (m) {
        for (const [e, r] of plates) { e.style.transform += ` translate(${Math.round(m.dx)}px, ${Math.round(m.dy)}px)`; r.x += m.dx; r.y += m.dy; }
        if (plaqueRect) { plaqueRect.x0 += m.dx / k; plaqueRect.x1 += m.dx / k; plaqueRect.y0 += m.dy / k; plaqueRect.y1 += m.dy / k; }
      }
    }
  }
  // (hovering it, or just after an aim or a bracket's move by the keys: the DC's parts and every modifier as believed, the list the roll will use)
  // (0.0.9: the felt term's arithmetic, "pinned −9: the chaos 105 − your hardening 17 = felt 88", where the roll's list carries one)
  const chaosLine = chaosSum(feltMod(rec.mods), suppRead(s));
  const parts = plaqueParts(rec), terms = termLines(rec), takeIn = lead ? contactFactors(lead) : null, sig = JSON.stringify([parts, terms, takeIn, chaosLine]);
  plaqueInfo.hidden = hoverKey !== shown.key && !(performance.now() < infoUntil && shown.key === (st.pick ?? aimedKey));
  if (!plaqueInfo.hidden) {
    if (plaqueInfo.dataset.sig !== sig) {
      plaqueInfo.dataset.sig = sig;
      // (the rows filtered: a null given to replaceChildren is written as the word "null")
      plaqueInfo.replaceChildren(...[el('div', { className: 'pi-dc', textContent: `${parts.dc}: ${parts.parts.join(' · ')}` }), el('div', { className: 'pi-mods', textContent: parts.mods.length ? `${parts.mods.join(' · ')}` : 'no modifier' }),
        terms.length ? el('div', { className: 'pi-terms', textContent: terms.join(' · ') }) : null,
        takeIn ? el('div', { className: 'pi-takein', textContent: takeIn }) : null,
        chaosLine ? el('div', { className: 'pi-chaos', textContent: chaosLine }) : null,
        el('div', { className: 'pi-odds', textContent: rec.part === 'FIVE' ? `a five or a V ${parts.odds} · on the paper ${Math.round((rec.kd?.scoreOdds ?? 0) * 100)}%` : `${rec.part === 'PAPER' ? 'on the paper' : 'the odds'} ${parts.odds}` })].filter(Boolean));
    }
    // (below the target and to its left, kept in the free band over the bottom stack: above the plaque if it would reach RADIO)
    const ih = plaqueInfo.offsetHeight, iw = plaqueInfo.offsetWidth;
    if (p.far) {
      // (beside the far window: the first of its left, its right, under its stack, over it that meets no rectangle of the HUD)
      const rects = rectsAt(innerWidth, innerHeight, 'weapon-far'), blocks = STATES_FAR.map(n => rects[n]).filter(Boolean);
      const cx = ox + p.x * k, cy = oy + p.y * k, R = p.rPic * k, sb = p.stack ? { x: ox + p.stack.x * k, y: oy + p.stack.y * k, w: p.stack.w * k, h: p.stack.h * k } : null;
      const spots = [{ x: cx - R - 6 - iw, y: cy - ih / 2 }, { x: cx + R + 6, y: cy - ih / 2 }, sb ? { x: sb.x + sb.w / 2 - iw / 2, y: sb.y + sb.h + 6 } : null, { x: cx - iw / 2, y: cy - R - 6 - ih }].filter(Boolean);
      const fits = (b) => b.x >= 0 && b.y >= 0 && b.x + iw <= innerWidth && b.y + ih <= innerHeight && !blocks.some(r => overlaps({ x: b.x, y: b.y, w: iw, h: ih }, r)) && !(sb && overlaps({ x: b.x, y: b.y, w: iw, h: ih }, sb));
      const at = spots.find(fits) ?? spots[0];
      plaqueInfo.style.transform = `translate(${Math.round(at.x)}px, ${Math.round(Math.max(0, at.y))}px)`;
    } else {
      // (near a target in the picture: the first of left of it below, right of it below, left or right level with it,
      // over the plaque and its terms, that meets no rectangle of the HUD (the paper inset among them), the plaque nor
      // the terms' plate; none clear, it is not shown (the runtime review's of v0.0.7: at 1600 x 900 on the zero card
      // it covered the PAPER inset and the terms, "on the paper 78%" under the plate; VIEWS §7.5, nothing overlaps)
      const rects = rectsAt(innerWidth, innerHeight, 'weapon'), blocks = (HUD_STATES.weapon ?? Object.keys(rects).filter(n => n !== 'ui')).map(n => rects[n]).filter(r => r && typeof r === 'object');
      const pqRect = { x: ox + plaqueRect.x0 * k, y: oy + plaqueRect.y0 * k, w: pq.w * k, h: pq.h * k };
      const left = ox + (p.x - p.w / 2 - 6) * k - iw, right = ox + (p.x + p.w / 2 + 6) * k, below = oy + (p.y + p.h / 2 + 4) * k, level = oy + p.y * k - ih / 2;
      const top = Math.min(pqRect.y, tpRect?.y ?? Infinity, partsRect?.y ?? Infinity, leadRect?.y ?? Infinity) - ih - 4;
      const spots = [{ x: left, y: below }, { x: right, y: below }, { x: left, y: level }, { x: right, y: level }, { x: pqRect.x + pqRect.w / 2 - iw / 2, y: top }, { x: left, y: top }, { x: right, y: top }];
      const box = (b) => ({ x: b.x, y: b.y, w: iw, h: ih });
      const fits = (b) => b.x >= 0 && b.y >= 0 && b.x + iw <= innerWidth && b.y + ih <= innerHeight && !blocks.some(r => overlaps(box(b), r)) && !overlaps(box(b), pqRect) && !(tpRect && !termsPlate.hidden && overlaps(box(b), tpRect))
        && !(partsRect && overlaps(box(b), partsRect)) && !(leadRect && overlaps(box(b), leadRect));
      const at = spots.find(fits);
      if (at) plaqueInfo.style.transform = `translate(${Math.round(at.x)}px, ${Math.round(at.y)}px)`;
      else plaqueInfo.hidden = true;
    }
  }
  return plaqueWords(rec);
}

/** The shot row whose parts stand over the target: the row hovered in the panel, else the first one offered (not struck); null if none. */
function shotRowShown(s) {
  const steps = simRead.state === s ? simRead.steps ?? [] : [];
  const hov = stepPanel.hovered ? steps.find(x => x.id === stepPanel.hovered && x.kind === 'shot') : null;
  return hov ?? steps.find(x => x.kind === 'shot' && !x.off && Array.isArray(x.parts)) ?? null;
}
/** The take-in's factors as the hover says them: "taken in in 0.55 s: 0.54 Warfighting 15 · × 1 your sector · noticed". */
function contactFactors(last) {
  const parts = (last.parts ?? []).map(p => (p.k !== undefined ? `× ${p.k} ${p.why}` : `${takeInWords(p.ms)} ${p.why}`));
  return `taken in in ${takeInWords(last.ms)} s${parts.length ? `: ${parts.join(' · ')}` : ''}${last.grade && last.grade !== 'pass' ? ` · the notice ${last.grade}` : ''}`;
}
// ---- 0.0.8: the take-in made readable, the pairs pad's paper (the build sheet 0.0.8 §2.4; COMBAT §25.11) ----
// (test-pairs now, the scene's pairsNow, once a tick: null off its course)
let pairsMemo = { key: null, pn: null };
function pairsOf(s) {
  const key = `${s.meta?.seed}|${s.clock.ms}|${seqKey(s)}`;
  if (pairsMemo.key === key && pairsMemo.state === s) return pairsMemo.pn;
  let pn = null;
  try { pn = rangeNow(s)?.course === 'pairs' || s.armoury?.range?.course === 'pairs' ? pairsScene.pairsNow(s, s.clock.ms) : null; } catch (e) { broke(e, 'the pairs'); }
  pairsMemo = { key, state: s, pn };
  return pn;
}
/** The pause the stop motion now came from, or null: contactNow().last while stop motion was entered via 'contact'. */
function pauseOf(s, cn = contactRead(s)) {
  return s?.stop?.mode === 'stop' && s.stop.via === 'contact' && cn?.last ? cn.last : null;
}
/** Whether the plaque's lead (the contact's plate, the line's "Contact · 0.55 s.") stands: at the pause, until a step is chosen after it. */
const leadStands = (s, last) => !!last && !(Number.isFinite(stepChosenMs) && stepChosenMs >= last.atMs);
let stampSeen = null;                                                // ({ id, t0 }: the stamp's real-time start, by the contact's id)
/** A target's place for the window's brackets, by its key: targetsOf's record (a turner on the pairs pad), or null. */
function targetByKey(s, key, list = null) {
  try { return (list ?? targetsOf(s, s.player.id)).find(t => t.key === key) ?? null; } catch { return null; }
}
/**
 * The window and the pause in the picture: the amber brackets closing round each target seen (their size by the window's k on the
 * drawn clock), at the pause the pale brackets of the others taken in and the stamp on the pick. Returns its words for the report:
 * { window: { ids, k, scale } | null, pause: { id, ms, words, stamp } | null }.
 */
function contactHud(s, alpha, { hidden = false } = {}) {
  const out = { window: null, pause: null };
  guardNote(s);                                                      // (the pause's guard counts from the frame that first sees it)
  const hideAll = () => { for (const b of windowBoxes) b.hidden = true; for (const b of takenBoxes) b.hidden = true; stampEl.hidden = true; };
  if (!s || hidden || !stage.cam?.project) { hideAll(); return out; }
  const cn = contactRead(s), P = cn?.pending ?? null, last = pauseOf(s, cn);
  const { ox, oy, k } = pictureBox();
  let list = null;
  try { list = P || last ? targetsOf(s, s.player.id) : null; } catch { list = null; }
  // (the window: the brackets close on the drawn clock, between the ticks, so a 0.65 s window closes in 39 frames, not 13 steps)
  if (P) {
    const ms = s.clock.ms + (isHeld(s) ? 0 : alpha * TICK_MS), span = P.untilMs - P.seenMs, wk = span > 0 ? Math.max(0, Math.min(1, (ms - P.seenMs) / span)) : 1;
    const sc = bracketScale(wk), ids = P.ids ?? [];
    // (each bracket, its ink and arms 4 px round it, no taller than the gap to its neighbour's centre less 2 px, so two lanes' brackets never meet in an "E"
    // (the runtime review of v0.0.8, at 7 m); never under the face itself)
    const pxs = ids.map(id => { const t = targetByKey(s, id, list); return t ? targetPx(t) : null; });
    windowBoxes.forEach((b, i) => {
      const p = i < ids.length ? pxs[i] : null;
      if (!p) { b.hidden = true; return; }
      const dy = Math.min(Infinity, ...pxs.filter((q, j) => q && j !== i && Math.abs(q.x - p.x) < (p.w + q.w) * sc).map(q => Math.abs(q.y - p.y)));
      const h = Math.max(p.h, Math.min(p.h * sc, dy - 2 * 4 - 2));
      place(b, windowBracket({ w: p.w * sc, h }), p.x, p.y, k, 'centre', { ox, oy });
      b.hidden = false;
    });
    out.window = { ids: ids.slice(), k: Math.round(wk * 1000) / 1000, scale: Math.round(sc * 1000) / 1000, untilMs: P.untilMs, seenMs: P.seenMs };
  } else for (const b of windowBoxes) b.hidden = true;
  // (the pause: the others taken in, bracketed pale while they face; the stamp on the pick for STAMP_S of real time)
  if (last) {
    const others = (last.ids ?? []).filter(id => id !== s.stop?.pick && id !== s.stop?.aim?.key);
    takenBoxes.forEach((b, i) => {
      const t = i < others.length ? targetByKey(s, others[i], list) : null;
      if (!t || t.down || (t.facingK ?? 1) < 0.5) { b.hidden = true; return; }
      const p = targetPx(t);
      place(b, bracket({ w: p.w, h: p.h, style: 'seen' }), p.x, p.y, k, 'centre', { ox, oy });
      b.hidden = false;
    });
    if (stampSeen?.id !== last.id) stampSeen = { id: last.id, t0: performance.now() };
    const age = (performance.now() - stampSeen.t0) / 1000, pick = targetByKey(s, s.stop?.pick ?? last.ids?.[0], list) ?? targetByKey(s, last.ids?.[0], list);
    const words = takeInWords(last.ms);
    // (STAMP_S of real time from when the page first drew the pause, and never once the game clock has run that far past it)
    // (and gone once a step is chosen: the stamp is the pause's, never over the shots that follow it)
    if (pick && age < STAMP_S && s.clock.ms - last.atMs <= STAMP_S * 1000 && leadStands(s, last)) {
      // (above the face and its brackets' top arm, never over the 15 px face (the runtime review of v0.0.8: it covered its left half))
      const p = targetPx(pick), st = stamp(last.ms, words);
      place(stampEl, st, p.x, p.y - Math.ceil(p.h / 2) - 4 - Math.ceil(st.h / 2), k, 'centre', { ox, oy });
      // (its last half second fading: nothing pops out of view)
      stampEl.style.opacity = String(Math.max(0, Math.min(1, (STAMP_S - age) / 0.5)));
      stampEl.hidden = false;
    } else stampEl.hidden = true;
    out.pause = { id: last.id, ms: last.ms, words, stamp: stampEl.hidden ? null : stampEl.dataset.text ?? null, ids: (last.ids ?? []).slice(), expect: last.expect, n: last.n };
  } else { for (const b of takenBoxes) b.hidden = true; stampEl.hidden = true; }
  return out;
}
// ---- 0.0.9: the FROZE stamp (VIEWS §7.4; COMBAT §5.7) ----
/** The FROZE stamp beside your head: its left edge this far right of your feet (picture px) and its middle this high (m: the chibi's head). */
const FROZE_BESIDE_PX = 8, FROZE_HEAD_M = 1.45;
let frozeSeen = null;                                                // ({ atMs, t0 }: the stamp's real-time start, by the startle's end)
/** A refused key's pulse on the counting stamp (ms of real time). */
const FROZE_PULSE_MS = 220;
let frozePulseT0 = -Infinity;
/**
 * "FROZE 2.45 S" beside your own figure's head at a startle's end (suppNow().froze: the whole freeze), in the take-in stamp's alphabet and
 * amber, for STAMP_S of real time from when the page first sees it, never once the game clock has run that far past it, gone once a
 * step is chosen after it; its last half second fading. Returns { ms, atMs, text } while it stands, else null.
 */
function frozeHud(s, { hidden = false } = {}) {
  startleNote(s);                                                    // (the startle's guard counts from the frame that first sees it)
  // (0.0.9, the design review: the stamp counts up while the startle lasts, so the freeze is seen as it happens, and
  // holds its figure while a planned bang is still to join it; then the whole freeze stands for STAMP_S, shown once)
  const sn = !hidden && s ? suppRead(s) : null, live = sn?.startle ?? null, held = !live && !!sn?.froze && pairsScene.bangDue(s);
  const fz = live ? (live.soFarMs > 0 ? { ms: live.soFarMs, atMs: live.untilMs } : null) : sn?.froze ?? null;
  if (!fz || !stage.cam?.project) { frozeEl.hidden = true; return null; }
  const now = performance.now();
  if (live || held || frozeSeen?.atMs !== fz.atMs) frozeSeen = { atMs: fz.atMs, t0: now };
  const age = (now - frozeSeen.t0) / 1000, chosen = !live && !held && Number.isFinite(stepChosenMs) && stepChosenMs >= fz.atMs;
  const me = playerActor(s);
  if (!me || chosen || age >= STAMP_S || (!live && !held && s.clock.ms - fz.atMs > STAMP_S * 1000)) { frozeEl.hidden = true; return null; }
  const { ox, oy, k } = pictureBox(), [px, py] = stage.cam.project(me.x, 0, me.z), st = frozeStamp(fz.ms, takeInWords(fz.ms));
  // (beside the head, downrange of it: over the head it met the coach at your shoulder; the take-in stamp's alphabet and size)
  place(frozeEl, st, Math.round(px) + FROZE_BESIDE_PX, Math.round(py) - Math.round(FROZE_HEAD_M * PX_PER_M), k, 'left', { ox, oy });
  frozeEl.style.opacity = String(Math.max(0, Math.min(1, (STAMP_S - age) / 0.5)));
  // (a key refused inside the startle pulses the stamp, as the brackets answer one in the take-in's window)
  frozeEl.classList.toggle('pulse', live !== null && now - frozePulseT0 < FROZE_PULSE_MS);
  frozeEl.hidden = false;
  return { ms: fz.ms, atMs: fz.atMs, live: !!live, held, text: frozeEl.dataset.text ?? null };
}
/** The coach's shot timer's paper on the pairs pad: the last string's, until the next string runs (in PAPER, in and out of stop motion). */
function timerHud(s, { hidden = false } = {}) {
  // (0.0.12: the shoot house's lane timer, the instructor's, from GO)
  const hn = !hidden && s ? houseRead(s) : null;
  if (hn) { try { return timerPaper.update(laneModel(hn, s.clock.ms), { ui: uiK }); } catch (e) { broke(e, 'the lane timer'); return timerPaper.update(null); } }
  const pn = !hidden && s ? pairsOf(s) : null;
  if (!pn) return timerPaper.update(null);
  const strs = pn.strs ?? [], running = pn.str && !pn.str.done, last = running ? null : [...strs].reverse().find(x => x.done !== null && x.done !== undefined) ?? null;
  if (!last) return timerPaper.update(null);
  const text = typeof last.paper === 'string' ? last.paper : last.paper?.text ?? null;
  const rec = typeof last.paper === 'object' && last.paper ? { ...last, ...last.paper } : last;
  return timerPaper.update(timerModel(rec, { text, fmt: takeInWords }), { ui: uiK });
}

// ---- 0.0.10: "Bang", the stress course (the build sheet 0.0.10 §2.3) ----
/** Breathe running for the player now, in or out of the mode: { i (its sub-step, 0 to 3), live (out of the mode) }, or null. */
function breatheRun(s) {
  const d = s?.stop?.doing;
  if (!d || !isBreathe(d.step) || (d.who && d.who !== s.player?.id)) return null;
  return { i: Math.max(0, Math.min(3, d.i ?? 0)), live: s.stop.mode !== 'stop' };
}
// (the stress course's view, stressNow, once a tick: null off its course)
let stressMemo = { key: null, sn: null };
function stressRead(s) {
  if (!s?.armoury?.range?.stress || !stressScene.stressNow) return null;
  const key = `${s.meta?.seed}|${s.clock.ms}|${seqKey(s)}`;
  if (stressMemo.key === key && stressMemo.state === s) return stressMemo.sn;
  let sn = null;
  try { sn = stressScene.stressNow(s, s.clock.ms); } catch (e) { broke(e, 'the stress course'); }
  stressMemo = { key, state: s, sn };
  return sn;
}
// (hitMarks for a turner and a string, once a tick)
const hitMemo = new Map();
function hitMarksRead(s, key, k, phase) {
  const mk = `${s.meta?.seed}|${s.clock.ms}|${seqKey(s)}|${key}|${k}|${phase}`;
  if (hitMemo.has(mk)) return hitMemo.get(mk);
  let hm = null;
  try { hm = MARKS.hitMarks ? MARKS.hitMarks(s, key, { k, phase }) : null; } catch (e) { broke(e, 'the hit card'); }
  if (hitMemo.size > 32) hitMemo.clear();
  hitMemo.set(mk, hm);
  return hm;
}
// (0.0.18, the doll role: the target view, hud/target.js. "Bang"'s card as scored, hitModelOf and hitHud's v0.0.17 bodies moved there
// verbatim (its 'string' mode); the shoot house's stands and any live man whenever you engage them (its 'lane' and 'free' modes))
// (the card's picks tried live on the To score page (state.$look.card, runtime only) over portrait.js PORTRAIT_PICKS)
const targetView = createTargetView({ card: hitCard, readers: { pairsOf, marksOf: hitMarksRead, meAt, picks: (s) => s?.$look?.card ?? null } });
/** The hit card's model for a turner of a string (paintHitcard's input: cardModel), its face and holds the turner's. */
const hitModelOf = (s, key, k, phase, tabs = []) => targetView.stringModel(s, key, k, phase, tabs);
// (when the card in belief last changed or stop motion was left: its hold out of the mode counts from there)
let hitSeen = { sig: null, t: -Infinity, stop: false, shown: null };
/** The target view now (VIEWS §7.7; hud/target.js): its words. */
function hitHud(s, { hidden = false, inStop = false } = {}) {
  return targetView.frame(s, { hidden, inStop, ui: uiK, seen: hitSeen, now: performance.now() });
}

// (every one of a loaded save's first ticks lost: it is damaged; what stands in for it is loaded)
async function recoverBroken(slot) {
  try { const { state, from } = await store.recover(slot); toast(`That save is damaged: ${from} instead.`, 'warn'); await launch(state, { from }); }
  catch (e) { toast(`That save is damaged, and nothing stands in for it (${e.message}).`, 'bad'); }
}

// ---- the bench: a scene for a fixed time, its numbers on a card to copy ----
async function bench(name) {
  const scene = BENCH_SCENES[name];
  if (!scene || !SCENARIOS[scene.play]) { toast(`No bench scene '${name}': the title instead.`, 'warn'); await showTitle(); return null; }
  // (a house bench's kit, role-players and the house as set, as the URL would give them)
  await launch(newGame({ seed: scene.seed, scenario: scene.play, hour: scene.hour, at: scene.at ?? null, setup: scene.setup ?? null, tier: scene.tier ?? null, ...(scene.loadout ? { loadout: scene.loadout } : {}), ...(scene.opfor ? { opfor: scene.opfor } : {}), ...(scene.draw ? { draw: scene.draw } : {}), ...(scene.breach ? { breach: scene.breach } : {}), ...(scene.holdouts ? { holdouts: scene.holdouts } : {}) }));
  while (!window.__ready) await sleep(50);
  const me = () => { const a = playerActor(loop.state); return a ? { x: a.x, z: a.z } : null; };
  // (the scene's keys through the input, so a press key (R at the rack) reaches the page's listeners as a real one would)
  const run = await runBench({
    scene, keys: { down: (code) => input.key(code, true), up: (code) => input.key(code, false) }, where: me,
    sample: () => ({ calls: view.stats.calls, triangles: view.stats.triangles, programs: view.stats.programs, viewMs: view.stats.viewMs, ticks: report.frame?.ticks ?? 0, tickMs: report.frame?.tickMs ?? 0, bytes: report.gl?.last?.bytes ?? 0, splash: report.frame?.splash ?? null,
      // (0.0.9: a frame at a bang, within BANG_FRAMES_MS of game time after the last went off)
      // (0.0.10: a frame at a blank of the din counts as at a bang: the stress-din bench's no frame over 25 ms at a blank)
      bang: [lastBurst, lastBlank].some(b => b && Number.isFinite(b.atMs) && loop.state && loop.state.clock.ms - b.atMs >= 0 && loop.state.clock.ms - b.atMs < BANG_FRAMES_MS),
      // (the build sheet §1 item 22: the sim's busiest tick since the warm, the UI's ms, the programs linked and the upload queue's biggest job this frame)
      // (a figure's band sent whole outside the queue named by its look and band (render/figures.js lastFrame.bands))
      // (F73: the frame's senders by the GL counters' tags, render/stats.js tag, largest first; the queue's key without them)
      tickMax: loop.stats.tickMsMax ?? 0, uiMs: report.frame?.uiMs ?? 0, links: report.gl?.last?.links ?? 0, upKey: report.gl?.last?.top ?? uploads.stats.last?.key ?? (view.figures?.stats?.lastFrame?.bands?.join(' ') || null) }),
    onWarm: () => { loop.stats.tickMsMax = 0; },
    onLeft: (left) => { benchLead = `Bench: ${name}, ${left} s left`; },
  });
  benchLead = null;
  const result = benchResult(run, {
    name, version: VERSION, ppm: PX_PER_M, renderer: stage.stats.gpu, dpr: devicePixelRatio, window: [innerWidth, innerHeight], picture: [stage.W, stage.H], threads: navigator.hardwareConcurrency ?? null,
  });
  window.__bench = result;
  boot.openCard('bench', benchCard(result, { onCopy: copyText, onAgain: () => location.reload() }));
  return result;
}
// ---- v0.0.20: the Esc menu's To score page (the build sheet item 10; cards/topick.js) ----
view.setFlashes?.(settings.reduceFlashes);
setMenuExtras(() => (loop.state ? [['To score: try the samples live', () => openToScore(), null]] : []));
/** The To score page over the game: each row's choice applied at once (the look, the walk, the shot, the corner aid). */
function openToScore() {
  const s = loop.state, look = settings.look ?? { stack: [], helm: null, jamb: null };
  const keep = (p) => { if (!settings.nostore) writePicks({ ...p, flags: { look: settings.look, shot: settings.shot } }); };
  const apply = (row, v) => {
    const st = loop.state;
    if (row === 'stack' || row === 'helm' || row === 'jamb') {
      settings.look = { ...(settings.look ?? { stack: [], helm: null, jamb: null }), [row]: v };
      if (st) { if (lookSet(settings.look)) st.$look = settings.look; else delete st.$look; }
    } else if (row.startsWith('card.')) {
      // (the target card's picks, state.$look.card, runtime only: the target view reads them over PORTRAIT_PICKS)
      const L = settings.look ?? { stack: [], helm: null, jamb: null };
      settings.look = { ...L, card: { ...(L.card ?? {}), [row.slice(5)]: v } };
      if (st) { if (lookSet(settings.look)) st.$look = settings.look; else delete st.$look; }
    } else if (row === 'walk') {
      settings.cycle = v; view.setCycle?.(v); if (st) st.$cycle = v;
      if (!settings.nostore) { try { localStorage.setItem('olympus.cycle', v); } catch { /* (a private window: this session only) */ } }
    } else if (row === 'shot') { settings.shot = v; audio.setShot(v); }
    else if (row === 'aid') {
      settings.aid = v; if (st) { if (v === 'rung') delete st.$aid; else st.$aid = v; }
      if (!settings.nostore) { try { localStorage.setItem(CORNER_AID_KEY, v); } catch { /* (a private window: this session only) */ } }
    }
    keep(card.picks);
  };
  const card = topickCard({
    now: { look, walk: settings.cycle ?? 'B', shot: audio.shot === 'old' ? null : audio.shot, aid: settings.aid },
    picks: toPick, play: { scene: scene?.rec?.id ?? s?.meta?.scenario ?? '?', seed: s?.meta?.seed ?? '?', version: VERSION },
    cb: { apply, save: (p) => { Object.assign(toPick, p); keep(p); }, copy: (t) => copyText(t), back: () => boot.openMenu() },
  });
  boot.openCard('topick', card.body, card.lines);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* (no clipboard permission: the old way) */ }
  try {
    const ta = el('textarea', { value: text });
    document.body.append(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch { return false; }
}

// ---- the debug handle, and the way in ----
const nameOf = (p) => (typeof p?.name === 'string' ? p.name : p?.name ? [p.name.given, p.name.nick ? `'${p.name.nick}'` : null, p.name.family].filter(Boolean).join(' ') : null);
const handleMore = {
  /** The page's read counters (tests/ui-held.test.mjs, ui-soak.test.mjs): the step panel's builds and the run sheet's (core/reads.js BUILT), the input sent (inputSeq: the reads' key while the clock is held), the hit card's board dolls and the dressed dolls (dress.js's LRU). */
  // (and the session's caches of areas: the drawn houses' layouts held (scenes/assemble.js, HOUSE_REG_KEEP), the
  // generated areas registered (places/model.js), the view's areas built (AREA_CACHE), for the soak)
  get perf() { return { steps: BUILT.steps, sheet: BUILT.sheet, inputSeq, hitDolls: hitDollCount(), dressed: dollCount(), layouts: heldLayouts(), generated: generatedIds(), viewAreas: view.stats.cached ?? null }; },
  /** The live area's id. */
  get area() { return loop.state?.places?.live?.area ?? null; },
  /** A debug move (debug:go, marking the save): to (x, z) in an area, facing face. */
  go(area, x, z, face = null) { return this.act(`debug:go:${area}:${x}:${z}${face ? `:${face}` : ''}`); },
  /** A door opened or closed by the places' door action. */
  door(id, to) { return this.act({ act: 'door', args: { id, to } }); },
  /** Each actor of the live area: who, where, posture, outfit, and whether you see them. */
  actors() {
    const s = loop.state, me = s ? playerActor(s) : null;
    if (!s) return [];
    return (s.actors?.list ?? []).map(a => {
      let seen = a === me;
      if (!seen && me) { try { seen = canSee(s, me, a); } catch { seen = null; } }
      return { id: a.id, who: a.who, name: nameOf(s.people?.[a.who]), x: a.x, z: a.z, y: a.y ?? 0, face: a.face, gait: a.gait, posture: a.posture ?? 'stand', outfit: a.outfit ?? 'utilities', curtain: !!a.curtain, spotId: a.spotId ?? null, seen };
    });
  },
  /** The fog of awareness on or off (the samples' instructor's view, samples/house-light: the catwalk sees into every room). */
  fog(on = true) { view.setFog(!!on); return !!on; },
  /** The light at (x, z) in the live area now (places' lightLevel). */
  light(x, z) { const s = loop.state; return s ? lightLevel(s, x, z, s.clock.ms) : null; },
  /** The sun at the live site now (sunAt). */
  sun() { const s = loop.state; return s?.places?.live ? sunAt(s.places.live.site, s.clock.ms) : null; },
  /** People's sight mask for the player now, over the view's fog window (or the area round you): { x0, z0, nx, nz, cellM, vis: [] }. */
  sightMask(win = null) {
    const s = loop.state, me = s ? playerActor(s) : null;
    if (!me) return null;
    const f = win ?? view.fog ?? null, cellM = f?.cellM ?? FOG_CELL_M;
    const x0 = f?.x0 ?? Math.floor((me.x - 24) / cellM) * cellM, z0 = f?.z0 ?? Math.floor((me.z - 16) / cellM) * cellM;
    const nx = f?.nx ?? FOG_CELLS[0], nz = f?.nz ?? FOG_CELLS[1];
    const mask = sightMask(s, eyeOf(s, me), { x0, z0, nx, nz, cellM, vis: new Float32Array(nx * nz) });
    return { x0: mask.x0, z0: mask.z0, nx: mask.nx, nz: mask.nz, cellM: mask.cellM ?? cellM, vis: Array.from(mask.vis) };
  },
  /** R's offer now (places' handOffer). */
  offer() { const s = loop.state; return s ? handOffer(s) : null; },
  /** The sound's numbers (src/ui/audio/engine.js stats), and its master gain as the graph has it. */
  get audio() { return { ...audio.stats, masterGain: audio.masterGain, contextState: audio.context?.state ?? 'none', hallOn: !!audio.stats.hallOn }; },
  /** The HUD's lines now: the watch's faces, the instinct's line, the toasts, the splash's plaque, ticker and strip. */
  get hud() { return report.hud; },
  /** The test scene playing ({ id, seed, ended }), or null. */
  get scene() { return scene ? { id: scene.rec.id, seed: scene.seed, ended: scene.ended, shown: scene.shown } : null; },
  /** The audio's world (the water, the tap, the flush, the klaxon, the bugle, the splash's muffle and ticks). */
  get world() { return { ...audio.stats.world }; },
  /** The range's sounds (the reports, echoes, clicks, cases, chimes and the last of each). */
  get rangeSound() { return { ...audio.stats.range }; },
  /** The radio box's lines now: [{ head, text, kind }]. */
  get radio() { return radio.lines; },
  /** The far window now (0.0.7): { far (farPointOf's), place (placeFar's), open, alpha, stage (view.farState()), flag (the wind flag's box it keeps clear, 0.0.8, or null) }, or null. */
  get far() { return farNow ? { far: farNow.far, place: farNow.place, open: farNow.open, alpha: farNow.alpha, label: farLabelEl.hidden ? null : farLabelEl.dataset.text ?? null, stage: view.farState?.() ?? null, flag: farFlag } : null; },
  /** The KD course now (range.js kdNow), or null off it. */
  kd() { const s = loop.state; return s && rangeNow(s)?.course === 'kd' ? kdOf(s) : null; },
  /**
   * The chaos now (0.0.9): { now (supp.js suppNow), hard (hardParts), inoc (inocOf), picture (the view's chaos as drawn),
   * bangs (the view's bangs layer), froze (the stamp as shown), mix (the sound's), reduce (the "reduce flashes" setting) }.
   */
  supp() {
    const s = loop.state;
    if (!s) return null;
    let hard = null, inoc = null;
    try { hard = SUPP.hardParts(s, s.player.id, s.clock.ms); inoc = SUPP.inocOf(s, s.player.id); } catch { /* (no sheet: none) */ }
    return { now: suppRead(s), hard, inoc, picture: view.stats.chaos ?? null, bangs: view.stats.bangs ?? null, froze: report.hud?.froze ?? null, frozeText: frozeEl.hidden ? null : frozeEl.dataset.text ?? null, mix: audio.stats.bang ? { ...audio.stats.bang } : null, chaosStage: audio.stats.chaos ?? null, reduce: settings.reduceFlashes };
  },
  /**
   * "Bang" now (0.0.10): { now (stress.js stressNow), look (stressLook: the coach, the horn, the blanks, the bangs), hit (the hit card
   * as shown: { k, key, phase, text, marks (drawn: [n, kind, zone, x, y]) } or null), din (the view's din layer), sound (audio/stress.js
   * stats), breathe ({ offer (supp.js breatheOffer), running (breatheRun) }) }, or null off the course.
   */
  /**
   * "Stack and clear" now (0.0.12): { now (houseNow), look (houseLook), sheet (runSheetOf), wash (hotWashOf), bundle (bundleNow), timer
   * (the lane timer's words as drawn), steps (the panel's words), instinct (the line's words, T's act named), sound (audio/house.js stats) },
   * or null off the course.
   */
  /** The live area's door leaves as the stage turns them (0.0.12: view.js leaves), or the one an opening names. */
  leaves(id = null) { return view.leaves ? view.leaves(id) : null; },
  /** Where world (x, y, z) falls in the stage's picture, pixels from its top-left (the tests' look at the figures). */
  project(x, y = 0, z = 0) { const [px, py] = stage.cam.project(x, y, z); return { x: px, y: py }; },
  /**
   * The picture as last drawn and its part IDs under the people (the tests' look at one outline a person, VIEWS §3.10.1):
   * { w, h, picture, ids } as plain arrays of the rectangle [x0, y0, x1, y1] (picture pixels from the top-left), rows top-down.
   */
  pixels(x0, y0, x1, y1) {
    const pic = stage.readPicture(), ids = stage.readIds(), W = ids.w, H = ids.h, out = { w: W, h: H, picture: [], ids: [] };
    for (let y = Math.max(0, y0); y < Math.min(H, y1); y++) {
      const row = H - 1 - y, p = [], d = [];
      for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) { const i = (row * W + x) * 4; p.push([pic[i], pic[i + 1], pic[i + 2]]); d.push(ids.buf[i] | (ids.buf[i + 1] << 8) | (ids.buf[i + 2] << 16)); }
      out.picture.push(p); out.ids.push(d);
    }
    return out;
  },
  house() {
    const s = loop.state;
    if (s?.armoury?.range?.course !== 'house') return null;
    const safe = (fn) => { try { return fn(); } catch { return null; } };
    return { now: houseRead(s), look: safe(() => houseScene.houseLook?.(s, s.clock.ms) ?? null), sheet: safe(() => houseScene.runSheetOf?.(s) ?? null), wash: safe(() => houseScene.hotWashOf?.(s) ?? null),
      bundle: bundleRead(s), timer: timerPaper.text, steps: stepPanel.text, instinct: instinct.text, sound: audio.stats.house ? { ...audio.stats.house, byKind: { ...audio.stats.house.byKind } } : null,
      corners: view.stats.range?.house ?? null, gait: playerActor(s)?.moveStance ?? playerActor(s)?.gait ?? null, goGuard: goSeenT0 > -Infinity ? Math.round(performance.now() - goSeenT0) : null };
  },
  stress() {
    const s = loop.state;
    if (!s?.armoury?.range?.stress) return null;
    let look = null, offer = null;
    try { look = stressScene.stressLook ? stressScene.stressLook(s, s.clock.ms) : null; } catch { /* (none) */ }
    try { offer = SUPP.breatheOffer ? SUPP.breatheOffer(s, s.player.id, s.clock.ms) : null; } catch { /* (none) */ }
    const hel = hitCard.el;
    return { now: stressRead(s), look, hit: hitSeen.shown && !hel.hidden ? { ...hitSeen.shown, text: hel.dataset.text ?? '', marks: JSON.parse(hel.dataset.marks ?? '[]'), scale: Number(hel.dataset.k ?? 1), smooth: !!hel.dataset.smooth, rect: (() => { const r = hel.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })() } : null,
      din: view.stats.din ? { ...view.stats.din, flashing: [...(view.stats.din.flashing ?? [])] } : null, sound: audio.stats.stress ? { ...audio.stats.stress } : null, breathe: { offer, running: breatheRun(s) } };
  },
  /** The step panel's step on a digit now (n 0 to 9), as the key would send it. */
  stepOn(n) { const st = stepPanel.stepFor(n); return st && typeof st === 'object' ? { id: st.id, kind: st.kind, label: st.label } : st; },
  // (R7: the step panel as drawn: its layout, level, head and keys; the keys a row is on now; a key pressed into its navigation)
  panel: () => ({ layout: settings.panel, where: stepPanel.where, keys: stepPanel.keys, text: stepPanel.text, situation: stepPanel.model?.situation?.id ?? null }),
  keysFor: (id) => stepPanel.keysFor(id),
  setPanel: (l) => { settings.panel = layoutOfWord(l); if (loop?.state) loop.state.$panel = settings.panel; },
};
installDebug(createDebugHandle({
  loop, sim, start: launch, newGame, version: VERSION, store, bus, about, view, solText, report: buildReport, queue: (a) => input.queue(a), more: handleMore,
  body: (s) => {
    const b = bodyOf(s, s.player?.id), ms = s.clock.ms;
    const lon = b ? lonAt(s) : null;
    return b ? { body: b, stages: stagesOf(b, ms, lon), strip: stripOf(b, ms, lon), words: wordsOf(b, ms, lon), cues: cuesOf(b, ms, lon) } : null;
  },
  instinct: (s) => ({ ...instinctNow(s), parts: instinct.parts, plate: instinct.plate }),
  // (the 0.0.6 round's readers: R held's menu and the card up, the hands, the hair)
  menu: (s) => {
    const m = handMenu(s);
    if (!m && !actions) return null;
    const L = actions?.list;
    return { ...(m ?? {}), card: L ? { text: actions.text, cursor: L.cursor, checked: [...L.checked], picks: L.picks, open: L.open, chosen: L.chosen(), plan: actions.plan } : null };
  },
  hands: (s) => {
    const b = bodyOf(s, s.player?.id), st = b ? stagesOf(b, s.clock.ms, lonAt(s))?.hands : null, c = b ? cuesOf(b, s.clock.ms, lonAt(s)) : null;
    return b ? { dirt: b.hands?.dirt ?? null, why: b.hands?.why ?? null, band: st?.id ?? st?.band ?? null, i: st?.i ?? null, words: st?.words ?? null, k: c?.handsK ?? null } : null;
  },
  hair: (s) => hairOf(s, s.player?.id, s.clock.ms),
  splash: () => splash.info,
  scores: () => readScores(),
  // (the weapon mode's readers, the build sheet 0.0.5 §2.4: the gun's truth beside its belief, the panel, the plaque, the range, stop motion)
  arms: {
    // (the To score page's picks as played: the shot the engine plays, the walk, the look, your #2's drawn look's key)
    picks: () => ({ shot: audio.shot, cycle: settings.cycle ?? null, look: settings.look ?? null, aid: settings.aid, twoLook: view.stats.twoLook ?? null }),
    gun: (s) => {
      const id = s.stop?.gun ?? s.people?.[s.player?.id]?.kit?.worn?.sling ?? null;
      return id && s.items?.[id] ? { id, truth: JSON.parse(JSON.stringify(s.items[id])), belief: beliefOf(s, id) } : null;
    },
    steps: (s) => (stopNow(s) ? { steps: stepsOf(s), slots: stepPanel.slots.map(x => ({ key: x.key, id: x.step.id, kind: x.step.kind, label: x.step.label, ms: x.step.ms, off: x.step.off ?? null, routine: !!x.step.routine, odds: x.step.odds ?? null, cmd: !!x.step.cmd })), text: stepPanel.text, page: stepPage } : null),
    plaque: () => (plaqueMemo?.rec ? { rec: plaqueMemo.rec, words: plaqueWords(plaqueMemo.rec), parts: plaqueParts(plaqueMemo.rec), shown: aimPlaque.dataset.text ?? null } : null),
    // (0.0.7: on the KD, kd() (kdNow) and nd(who) ride on the record unenumerated, so a test's evaluate still gets plain data)
    range: (s) => {
      const r = rangeNow(s);
      if (!r) return r;
      const out = { ...r };
      Object.defineProperty(out, 'kd', { enumerable: false, value: () => kdOf(loop.state) });
      Object.defineProperty(out, 'nd', { enumerable: false, value: (toward = null) => {
        const st = loop.state;
        if (!kdScene.forceNd || !st) return null;
        // (a debug act on the state outside a tick, as debug:go is; the save is marked debug)
        st.meta.debugUsed = true;
        return kdScene.forceNd(st, bus, { pid: st.player.id, toward });
      } });
      return out;
    },
    stop: (s) => stopNow(s),
    // (0.0.8: test-pairs now, and the contact with what the page draws of it: the brackets, the stamp, the plate, the paper)
    pairs: (s) => pairsOf(s),
    contact: (s) => {
      const cn = contactRead(s);
      return { ...(cn ?? { pending: null, last: null }), hud: report.hud?.contact ?? null, plate: contactPlate.hidden ? null : contactPlate.dataset.text ?? null, timer: report.hud?.timer ?? '', lead: report.hud?.lead ?? null,
        brackets: windowBoxes.filter(b => !b.hidden).map(b => ({ w: b.width, h: b.height, css: b.style.width })) };
    },
  },
}));
loop.start();
// (said once the start is made: launch clears the toasts)
// (0.0.18: &loadout=, a preset or a code (loadout.js); an unknown one dropped with its toast as &env= is)
const loadoutParam = params.loadout && !loadoutOf(params.loadout).error ? codeOf(loadoutOf(params.loadout)) : null, loadoutUnknown = params.loadout && !loadoutParam ? params.loadout : null;
// (a &house= code not played as written (assemble.js houseUrlNote, read from the house the scene plays, once it is made:
// the code review of 2026-11-16 found the toast said "Its rooms as given" on &draw=set, the live lane and every other scene, and a
// malformed code dropped silently; a code that &layout dropped is not judged here: its toast is houseChoice's)
const houseSay = () => { if (!params.houseAsked || params.layout || !drawableOf(recURL) || recURL?.ship || recURL?.breach) return; let note = null; try { const s = loop?.state, played = s?.armoury?.range?.course === 'house' ? houseCodeOf(s) : null; note = houseUrlNote(params.houseAsked, played, params.seed ?? 48213); } catch (e) { broke(e, 'the house\'s code'); } if (note) toast(note, 'warn'); };
// (&layout, &house, &rooms and &draw as one choice (houseChoice): a loser dropped with its toast)
// (and on a scene played as set from the page, the live lane until F80 is met, any other house dropped with its words (drawableOf))
const recURL = params.play ? SCENE_IDS.map(id => SCENES[id]).find(x => x.id === params.play || x.scenario === params.play) ?? null : null;
// (a ship's lane (the Wreck) is shot as set with the standard kit: its own one toast in place of houseChoice's (shipChoice))
// ("Bang, then go" is played in room 1 as set: its own one toast likewise (breachChoice), every setup but 'go' said with it)
const houseURL = recURL?.breach ? breachChoice(recURL, { draw: params.draw, house: params.houseAsked, rooms: params.rooms, layout: params.layout, plans: params.plans, opfor: params.opfor, loadout: params.loadout, setup: params.setup })
  : recURL?.ship ? shipChoice(recURL, { draw: params.draw, house: params.houseAsked, rooms: params.rooms, layout: params.layout, opfor: params.opfor, loadout: params.loadout, words: SHIPS[recURL.ship]?.dropped })
  : houseChoice({ draw: params.draw, house: params.house, rooms: params.rooms, layout: params.layout }, { roomsDefault: SCENES_DATA.HOUSE_ROOMS_DEFAULT ?? 'a', drawable: drawableOf(recURL) });
// (&breach= is "Bang, then go"'s alone: on any other scene, or a bare scenario, dropped with its toast (breachOnly; the review of
// B and C, 2026-11-19: "Stack and clear" and its live lane played room 1 alone with no word))
const breachURL = breachOnly(recURL, params.breach);
// (a &holdouts= not played as asked (holdoutsNote over opfor.js parseBoarding): said once, as &env= and &loadout= are)
// (and on a scene that boards nobody, dropped with its own toast (holdoutsOnly), as &breach= is: the v0.0.27 code review, finding 8)
const holdoutsURL = holdoutsOnly(params.holdoutsAsked, params.holdouts, !!SHIPS[recURL?.ship]?.posts);
const holdoutsDropped = holdoutsURL.dropped.length ? null : holdoutsNote(params.holdoutsAsked, params.holdouts, parseBoarding);
const sayEnv = () => { if (envUnknown) toast(`No environment '${envUnknown}': the site's own instead.`, 'warn'); if (gravUnknown) toast(`No gravity event '${gravUnknown}': none instead.`, 'warn'); if (lookUnknown) toast(`No look '${lookUnknown}': the game's instead.`, 'warn'); if (loadoutUnknown) toast(`No loadout '${loadoutUnknown}': the standard instead.`, 'warn');
  for (const t of [...houseURL.dropped, ...breachURL.dropped, ...holdoutsURL.dropped, ...(holdoutsDropped ? [holdoutsDropped] : [])]) toast(t, 'warn');
  houseSay(); };
if (benchName) { await bench(benchName).catch((e) => broke(e, 'the bench')); sayEnv(); }
else if (params.play) {
  const rec = SCENE_IDS.map(id => SCENES[id]).find(x => x.id === params.play || x.scenario === params.play);
  if (rec && SCENARIOS[rec.scenario]) playScene(rec, { seed: params.seed ?? 48213, hour: params.hour, setup: params.setup, tier: params.tier, par: params.par, loadout: loadoutParam, opfor: params.opfor, draw: params.draw ?? null, house: params.house ?? null, doors: params.doors ?? null, rooms: params.rooms ?? null, layout: params.layout ?? null, plans: params.plans ?? null, breach: breachURL.breach, holdouts: holdoutsURL.holdouts });
  else if (SCENARIOS[params.play]) launch(newGame({ seed: params.seed ?? 1, scenario: params.play, mode: params.mode, hour: params.hour, at: atParam(params.play) }));
  else { toast(`No scenario '${params.play}': the title instead.`, 'warn'); await showTitle(); }
  sayEnv();
} else { await showTitle(); sayEnv(); }
