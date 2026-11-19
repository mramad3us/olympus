// OLYMPUS scenarios: test-shoothouse, "Stack and clear": lane A of house 1 in the Wheel's sector 4 at 1 G, three rooms and the hall with your number two on the instructor's GO (ROADMAP §4.2's 0.0.7d row, shipped as v0.0.12; COMBAT §25.10.4; the build sheet 0.0.12 §2.3).
//
// The house is authored (src/data/places/wheel.js: the area melas.wheel.s4 at 1 G of spin, HOUSE1 the lane's stands,
// start mark, catwalk and booth; src/sim/combat/room.js the room plans, the same in every career); everything that
// happens in it is procedural, from the world's seed alone on named streams, never from the sheet played, so "Again as
// …" meets the same rooms, the same faces, the same gaps, the same dummy and the same #2 (the user's rule: the world
// handcrafted, what happens in it from the seed; all people generated): the #2 (stream(seed, 'house:two'): a marine of
// your fire team, COURSES.house.draws.two), each stand's face where it is drawn and what it holds (stream(seed,
// 'house:draw', stand): 1b and 3a a threat or a no-shoot 50/50; a threat's rifle 70 or pistol 30, a no-shoot's hands 60
// or phone 40), each turner's gap after its trigger (stream(seed, 'house:gap', stand), whole ticks), the dummy's place in
// magazine 1 (stream(seed, 'house:dummy'), its round 3 to 6), the gap from Standby to GO (stream(seed, 'house:standby',
// attempt)), the words by hash.
//
// The fill (testShoothouse): the barracks drawn, the player on the start mark facing west in the combat EVA suit, the
// test sheet picked (templates.js testSheet: the boot recruit, the private (the default), the corporal, the sergeant, the
// Raider, the tier one), the 'house-cqb' issue materialised (three magazines of ten frangible; the dummy rides in
// magazine 1, the one you load), gait Combat; the #2 posted TWO_BEHIND_M 0.65 m behind you on the hall's axis in the
// suit, your sheet written on him for the scene, his own issue in Condition 4 as yours (the rework's R5); the instructor (the post melas:wheel-house-chief,
// a generated staff sergeant) at the booth; the seven turners edge-on on their stands; then handling.js startRange on
// the house course (R.course 'house', no lane, R.area the Wheel's). The stands (STANDS): 1a the far left corner of room
// 1, #1's, a threat facing from GO; 1b its far right corner, the #2's sector, drawn, facing from GO; 2a room 2's armoured
// silhouette, turning on its door; 2b a no-shoot by room 2's inner door, facing from GO; 3a room 3's near leg's far
// corner, the #2's, drawn, turning on its door; 3b the hostage card in its far leg, facing from GO; H the hall's west
// end, turning HOUSE_GAPS.zone after you step into the hall's west zone. The setups (tests and the page): 'go' (GO given,
// in stop motion), 'room:2', 'room:3', 'hall' (the rooms before cleared as the tier one's plan clears them, on the same
// draws: their threats down, their doors open, you and your #2 stacked on the next), 'contact' (room 1's door open, you
// in its doorway out of stop motion, the window about to open on 1a).
//
// The sequence (courses.js SEQ_HOUSE; handling.js's engine): the brief, LOAD, MAKE READY (houseStart: on the start mark,
// still, Condition 1, on safe, the finger off, low ready, gait Combat, the #2 in place; houseWant names what is
// lacking), Standby (the scene arms GO itself: STANDBY_MS 1.5 to 4 s, disarmed if you leave the mark or enter the mode
// before it, "Back on your mark. Wait for GO.", re-armed on the next attempt's gap; never a dead end: after moveOnMs of
// it GO comes with a 'slow' fault), GO (the lane hot, the timer from GO, mind.clearing set, and you are put in stop
// motion: the first choice is free), Stop (the lane over: houseSafe), UNLOAD, SHOW CLEAR, the hot wash (WASH_MS 90 s
// behind the brief splash) and the end (the range's 'clear', the card).
//
// The lane (R.house; each lived tick, houseActors and houseRules): the legs in the plan's order (the three rooms, then
// the hall), the current one H.cur. A leg goes ahead → stacked (you within stackM of #1's stack point) → open (its
// door's leaf open; the hall's at once) → entered (you past its threshold) → clear ("Clear!" called: a row, a bundle's
// beat, or houseCall) or passed (a stall moved on). In the current leg each tick: the funnel (inFunnel, the feet stopped
// or nearly, under FUNNEL_STILL_MS 0.3 m/s: its doorway seconds, and FUNNEL_FAULT_MS 1 s at once is the fault 'funnel',
// "Don't stop in the door!"; COMBAT §25.3.2's "standing in a doorway": the fixer's of 0.0.12, a walk through the door
// counted, so a corporal's entry from rest 0.5 m off the frame was faulted in every room), the corners (room.js
// coveredNow for you and the #2: covered once, by whom), the flag (carry.js flagsAt: the muzzle's 3-D line within
// FLAG_BODY_R_M of the #2's body, floor to head, within FLAG_REACH_M, the rifle in hand and neither at high ready nor at low
// ready, for FLAG_MS at once: "Muzzle!", once a room), Relaxed inside ("Weapon up.
// You're in their house."), and the safety stop at any time (an aim at the #2 or the instructor: the range's 'person'
// stop, "Cease fire! Cease fire!", the card). At "Clear!" the leg's faults: a hot spot covered by neither of you
// ('corner', "Your corner!"), a threat of the room still up ('standing'), an inner door neither held nor cleared
// ('door'); the room's turners turn away; the timer's double beep when every par in it was met (the 'house' fact clear,
// met); the plan moves to the next door (mind.clearing with it). Stalls (never a dead end): STALL_MS 60 s lived in a leg
// with no progress (a new cover, a round, a leg's state, a door; never a step: 2026-11-12): "Move on."; STALL_MORE_MS 30 s more and the leg is passed with the fault
// 'time', its turners turned away. The lane's due bounds the stall (legDueMs): with n legs after the current one, the current
// leg is due LANE_MAX_MS − LANE_KEEP_MS − n × LEG_LAST_MS from GO (450, 495, 540 and 585 s), "Move on." STALL_MORE_MS before
// it and the leg passed with 'time' at it, so the lane ends by 585 s by construction. The lane ends at the hall's "Clear!"
// ('clear'), at LANE_MAX_MS 10 min lived from GO ('time', the net the due keeps it from), with nothing left to fire ('dry'),
// or by the safety stop.
//
// The turners (turners.js records, the house's fields: room, stand, name, slot, trigger { kind: 'go' | 'door' | 'zone', on,
// gapMs }; `on` and not `id`, which a save's id walk reads as an id): 'go' turn at GO; 'door' at its door's leaf open +
// gapMs; 'zone' at your first tick in the zone + gapMs. The take-in is contact.js's on them as on the bay. Each round
// (houseShot, from handling.js recordShot): the hit sensor as the bay's (a paper threat down at STOP_TORSO 2 torso or
// STOP_HEAD 1 head hits, turned away SENSOR_MS after; the armoured by its head plate); a no-shoot hit the fault 'noshoot';
// the hostage card: a torso round on it is the hostage's (the fault 'hostage'), a head round graded bad or worse is too,
// a head hit drops the hostile. Zones by room and by shooter (yours and the #2's). Pars (PAR_MS by the sheet's
// PAR_OF_TIER, or the picker's): each threat's from the sighting of the man whose sector it is (your window's seenMs on
// your corner's men, the #2's own on his: slot 2; the first by either where the other never saw him) to the first round
// on it by either of you; past it with no round, the harness's low tone ('house' par, met false) and "he fired first" on
// the sheet. The hot wash's advice on the par counts only your own corner's men.
//
// The #2 (R.house.two): runs his slot through the drill's stepper and bundles (bundle.js runSlot: his stack point, his
// point, his corner, cued on yours), and engages only slot 2's stands on the same mechanics: his sighting by PEOPLE's
// sightOf from his own eyes, his take-in by react.js takeInMs (the one helper), his identification by an Awareness
// check against contact.js's IDENT_DC0 + range / IDENT_PER_M, then his drill's row by specials.js rowPlan (the failure
// drill on armour, the hammer from its Marksmanship gate within 7 m, else the pair; below rung 2 the aim first), each
// round by shot.js resolveShot (log false: the log is yours) at its formula time; a no-shoot he holds; a hand he cannot
// see he looks at again after CHALLENGE_MS. He never flags.
// 2026-11-12 (the rework's R5, COMBAT §25.19.5, §25.19.6): **the tower's commands go to both marines**. houseOnCmd starts his own
// Corps macro on his list doing for LOAD, MAKE READY, Standby (his "Ready."), Stop (MAKE SAFE) and UNLOAD SHOW CLEAR (TWO_CMDS,
// twoCmd): at the command plus his react.js goMs, his sub-steps drills.js's for his belief, each his firearms.js action at his own
// Weapon handling, rolled on his own stream ('house-two') and logged nowhere, timed by stepper.js advanceList (twoAdminTick), a
// halt planned again from his belief up to TWO_TRIES times; drawn as yours (handsOf, the stage's sub-step: look.js gunLook). The
// tower waits on him (twoLacks: houseWant names 'two:busy', 'two:mag', 'two:chamber', 'two:safe', 'two:low', said to him,
// "Number two, a round up."; LOAD, Stop and SHOW CLEAR's readinesses), and SHOW CLEAR ends with "Number two, clear." The setups
// make him ready as yours (armTwo). **His cover** (twoCover, coverTick): your rifle down (the reflex card, IMMEDIATE or REMEDIAL
// ACTION, a stoppage believed; R6's Gun down by its step), he says "Covering!" (on a man, once his row is done), holds his eyes
// on the man you bracketed or your sector's middle, and takes your corner's men in the room from where he stands (your
// bracketed man as his sector's, the others as the room's; a man of yours he fires on is on his record, H.two.covered); your
// rifle back, a man of yours he has not fired on yet is yours again, and UP_WAIT_MS later he says "Up.".
// 2026-11-13 (the rework's R6, COMBAT §25.19.6): **the stoppage and the sidearm**. The fill issues the P-12 on every sheet (the
// user, 2026-11-15: "everyone should have the same loadout"; the Sergeant up to v0.0.16; arms/sidearm.js SIDEARM_TIERS; kit.js
// issueSidearm, after every other item: R.house.pistol; a v0.0.15 or v0.0.16 save of a lower sheet gains it on load,
// upgradeHousePistol), Condition 3 in the thigh holster,
// a spare in the thigh's pouch; MAKE READY racks it and UNLOAD, SHOW CLEAR clear it (sidearm.js adminSubs); the setups make it
// ready as MAKE READY would. The reflex card's answers are sidearm.js's; youDown reads Gun down and Off the line down until their
// "Gun up!" or "Up!", and his "Up." closes your wait on the knee (sidearm.js upHeard, W.upSaidMs); while he covers you he takes
// your man in on his way in too (F20). His own "Gun down!" stops you once out of stop motion, the DI's cqb-two-down naming Cover
// his sector (W.coveredBy until his "Gun up!").
// v0.0.19 (the build sheet's stage 0): his code is combat/two.js's (TWO_CMDS to handsOf, legOf to twoStandDown, moved byte for
// byte and re-exported here), and whose a stand is goes through combat/team.js ownerOf, the one reader of "whose man".
// v0.0.19 (L-house; COMBAT §25.18; the build sheet v0.0.19 §0 items 17 and 18, §3.3): **"Stack and clear, live"**, the same lane
// with two role-players of the cadre in place of stands 2a and 3a (scenes.js test-shoothouse-live, or &opfor=live[:<2a card>,<3a
// card>]). The fill's opfor (opfor.js parseOpfor) makes them after every other item and after the setup (opfor.js fillOpfor; R.house
// .live, R.house.opfor the code); with opfor none nothing of it is written or run, so the turner lane is v0.0.18's to the tick
// (tests/house-pin.test.mjs). Each lived tick their brain runs after your number two (opfor.js opforTick), and the house keeps the
// team's side of them (liveTick: seenBy, lastAt, the covers by men.js coverTick, your #2's "Got him." and his fading memory, the
// instructor's "Paint, chest.", a cleared room reopened); a casualty (a strike on you or your #2 the one rule rates fatal: v0.0.20,
// combat/would.js, the live round's would-have through the carrier's soft panel by the wound model; v0.0.19's two torso or one head
// judges only a lane it saved) halts every doing, "I'm hit!", and CASUALTY_MS later "Cease fire!" and the lane's end 'casualty' (casualtyTick). The gate waits
// on a live man down or with his hands up and not covered, or seen and now in nobody's sight (men.js gateWhy: 'down', 'hands',
// 'unaccounted'); a "Clear!" by hand over one is the fault 'uncovered'; at the leg's end a man down or with his hands up is ruled
// out (opfor.js ruleOut 'clear', "He's out."), a man up never, a passed leg's every man ('passed'), the lane's end the rest
// ('lane'); a role-player is never turned away. A round on a man whose hands the shooter saw up is 'surrendered'; his own sensor
// is opfor.js opforHit's, by the same rule. The paper: "LIVE: 1 DOWN · PAINT ON YOU 1 (WOUNDED) · HIS FIRST ROUND 0.40 S BEFORE
// YOURS" on his leg, "2 ROLE-PLAYERS · 1 DOWN, 1 GAVE UP · 1 HIT AND FIGHTING ON · PAINT ON YOU: 2 TORSO · WOULD HAVE BEEN: WOUNDED,
// CHEST AND BELLY" on the card, a casualty's card led "CASUALTY · FATAL: THE CHEST, 2ND ROUND, THROUGH THE SOFT PANEL, ROOM 2, BY THE
// MAN IN THE DEEP CORNER" (a v0.0.19 lane's "PAINT: 2 TORSO, …"), and the hot wash says what those rounds would have done
// in the wound model's words; houseLook leaves him out of its stands, the stage drawing him as a man (look.js rangeLook's men).
//
// The run sheet (runSheetOf, the one helper of the paper, the card and the instructor's words): a row a leg ("ROOM 1 ·
// 7.40 S · TAKE-IN 0.80 · FIRST 2.00 · BASIC MET · 2 A · CORNERS 3 OF 3 · DOORWAY 0.30 S", zeros out, and its faults
// "NO-SHOOT HIT", "HOSTAGE HIT", "MUZZLE", "DUMMY CLEARED 1.10 S"); the card (COMBAT §25.10.4's "LANE A · PRIVATE · 3
// ROOMS · 58.4 S · 4 OF 4 THREATS · 2 NO-SHOOTS UNTOUCHED · FIRED FIRST ON YOU: ROOM 3 · TAKE-IN 0.80 TO 1.20 S · BASIC:
// MET"); the instructor's one thing to do differently, from the run's worst number (COMBAT §17.2); the spin's line once;
// what a career would have counted toward practised (a test sheet's never moves). hotWashOf: the instructor's lines and
// the take-in bars. houseNow(state, ms): the hud's, the bots' and the end card's view; houseLook(state, ms): the stage's
// (look.js rangeLook().house); againAsHouse(state, tier): "Again as …" on the same seed; houseGoal(state): the goal line
// with your #2 named. Pure but the fill, the hooks and the layers, which write the session.
// 2026-11-13 (the rework's R8b, fluid movement): the scene names each marine's lane through the current door (useLanes, read by
// src/sim/places/move.js throughOf), so a body carried through a doorway goes on along his own slot's path, never across his
// #2's; while his hands are on a man the #2's feet are his free body's (bundle.js freeBody: through a doorway, never at rest in
// one). The funnel's fault is now earned only by a step that stands still by your own choice (a "stop here", Hold him).
import { TICK_MS, SEC_MS, isHeld } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream, intIn, weighted } from '../../core/rng.js';
import { hashPick } from '../../core/hash.js';
import { spokenMs } from '../../core/speech.js';
import { playerActor, playerId } from '../../core/ids.js';
import { post, cancel } from '../../core/queue.js';
import { COURSES, SEQ_HOUSE, HOUSE_CHIEF } from '../../data/courses.js';
import { SCENES } from '../../data/scenes.js';
import { ACTIVITIES } from '../../data/activities.js';
import { WHEEL_S4 } from '../../data/places/wheel.js';
import { houseSpecOf, assembleHouse, drawnCodeOf, wholeCodeOf, parseHouse, ASSEMBLE_V, HOUSE_LAYOUTS, laneWordOf } from '../scenes/assemble.js';
import { lonOfSite, gravityAt } from '../places/env.js';
import { openingState, setOpening, roomOf, zoneOf, areaOf } from '../places/model.js';
import { placeGaits } from '../body/motion.js';
import { setOutfit, syncActors } from '../people/place.js';
import { drawStaff, setPost, staffName } from '../people/staff.js';
import { noteMind, contactOf } from '../people/mind.js';
import { sightOf, SEEN } from '../people/perception.js';
import { startBody } from '../body/body.js';
import { deltaOf } from '../body/record.js';
import { testSheet, TEST_SHEETS, rungOf } from '../skills/templates.js';
import { check } from '../skills/checks.js';
import { barracks } from './barracks.js';
import { setLedgers } from './tests.js';
import { rangeOf, sayOn, startRange, fault, roundsLeft, stillOf, stopRange, lineReady } from './handling.js';
import { materialise, move, sparesOf, issueSidearm, discard, FOF_SIDEARM, containersOf, CONTAINERS } from '../arms/kit.js';
import { loadoutOf, applyLoadout, codeOf, isStandard, twoP12Of } from '../arms/loadout.js';
import { ownerOf, sideOf, clearTask, teamMarks } from '../combat/team.js';
import { tickDevices, BANG_LATE_MS } from '../combat/burst.js';
import { BREACH_SAFE_KPA, STUN_KPA } from '../arms/blast.js';
import { DEVICES, handDeviceOf, liveDevices, setSt } from '../arms/devices.js';
import { SIDEARM_TIERS, upHeard, drawn as drawnPistol, holstered as holsteredPistol, pistolOwed, adminSubs } from '../arms/sidearm.js';
import { feed, gunField, doAction, beliefOf, actionMs, tempoFor } from '../arms/firearms.js';
import { subsOf } from '../arms/drills.js';
import { enterStop, leaveStop, gunOn, faceOfHead } from '../arms/shooting.js';
import { muzzleOf, flagsAt, FLAG_MS, SLUNG } from '../arms/carry.js';
import { BRASS_LIVE } from '../arms/look.js';
import { famCap } from '../arms/models.js';
import { turnTo, turnAway, facingOf, turnerTargets, TURN_MS } from '../arms/turners.js';
import { resolveShot, aimMsOf, catchAhead, shotIdNext, AIM } from '../arms/shot.js';
import { ROWS, rowPlan, HAMMER_MAX_M, stillUp, TRANSITION_NEAR_M } from '../arms/specials.js';
import { rollerOf } from '../combat/roll.js';
import { takeInMs, takeInWords, goMs } from '../combat/react.js';
import { pendingOf, IDENT_DC0, IDENT_PER_M, CHALLENGE_MS } from '../combat/contact.js';
import { lanePlanOf, inFunnel, pastThreshold, coveredNow, sectorOf } from '../combat/room.js';
import { cornerTableOf, aidK, aidHoldMs, sectorWedgeOf, pointOfRule, CORNER_POINT, frameOf, MARK_AT_M, MARK_H_M } from '../combat/corner.js';
import { startled } from '../combat/supp.js';
import { runSlot, freeBody, gapSettle, twoLegOver, handBack, legsOf as bodyLegsOf, useClearGate, useCallVoid, skillsOf, crossingOf, doorSwing, CALL_S, TWO_SAY, BODY_GAP_M, GAP_GUARD_M } from '../combat/bundle.js';
import { profileOf, moveAt, pathLen, advanceList, halt as haltDoing } from '../combat/stepper.js';
import { useBodies } from '../places/move.js';
import { useLanes, useKeepClear, liveZoneAt, arcsOf } from '../places/zones.js';
import { leafAt, toggleDoor, turns as leafTurns } from '../places/doors.js';
import { routed } from '../combat/route.js';
import { moverStart, locoStep } from '../body/loco.js';
import { startActivity } from '../time/activities.js';
// (v0.0.19: your number two's code is in combat/two.js, its names re-exported here so the tests, the bots and the gauges import them unchanged)
import { TWO_CMDS, twoLacks, twoCmd, twoAdminTick, legOf, isThreat, twoTick, maskTick, TWO_FOLLOW_N, THREAT_FACES, whole, actorOf, legsOf, curLeg, loadedGun, twoLeftMs } from '../combat/two.js';
import { registerHost } from '../combat/op.js';
// (v0.0.19, "Stack and clear, live": the role-players' brain (opfor.js) and the one seam for what is seen of a man and what he
// does to the stack (combat/men.js); the house only calls them, never reads a role-player's state but through them)
import { parseOpfor, fillOpfor, opforTick, opforHit, opforBled, ruleOut, spotOf } from './opfor.js';
import { isLive, upNow, seenK, bodySeen, accountedOf, gateWhy, coverTick, struckOn, remember, stale, CASUALTY_MS } from '../combat/men.js';
// (the one rule for every strike on the live lane, what the live round would have done (COMBAT §25.18.7))
import { fatalOf, wouldOn, wouldWash, strikeWords, wouldTick, downAtOf, WOULD_WHY } from '../combat/would.js';
import { LAYERS } from '../arms/penetrate.js';
export { TWO_CMDS, TWO_TRIES, twoLacks, twoCmd, twoAdminTick, handsOf, UP_WAIT_MS, twoCover, twoDrillOf, twoGunDown, twoOwns, twoSees } from '../combat/two.js';
// (moved to combat/two.js with the #2's brain, re-exported here under their names)
export { TWO_FOLLOW_N, THREAT_FACES, whole, actorOf, curLeg, loadedGun };
// (v0.0.19, D2: the kit's second slice is house-kit.js's: the reads, the intelligence, the five, the run sheet's marks, the breach rounds)
import { readsTick, intelOf, kitMarks as kit2Marks, breachShot, intelWords } from './house-kit.js';
// (the card's (the build sheet v0.0.20 §1 items 4, 11, 19, 20, 26): the room bundle's planned time (pure), the take-in's
// and the rows' books at the sheet, the immediate action's, the carry at a sighting, and the constants of the pars and the verdict)
import { planBundle, lockedOf, handMsOf } from '../combat/bundle.js';
import { takeInOf } from '../combat/react.js';
import { POINT_REACH_S, IMMEDIATE_M } from '../arms/specials.js';
import { POSTURES, carryOf } from '../arms/carry.js';
import { macroMs } from '../arms/drills.js';
import { sheetOf } from '../skills/templates.js';
import { ROOM_PAR_K, ROOM_PAR_STEP_MS, STANDARD_PARS, VERDICT_WHY } from '../../data/courses.js';
import { BUILT } from '../../core/reads.js';
import { seenOf, standSeen } from '../people/seen.js';
import { seenFace } from '../arms/engage.js';

const C = COURSES.house;
/** Where the scene plays. */
export const HOUSE_SCENE = Object.freeze({ site: SCENES['test-shoothouse'].host.site, area: WHEEL_S4.id, course: 'house' });
/** The instructor's timer's pars (ms) and each sheet's default (the sheet's §4). */
export const PAR_MS = C.pars, PAR_OF_TIER = C.parOfTier;
/** The gap from Standby to GO (ms, whole ticks). */
export const STANDBY_MS = C.standbyMs;
/** The doorway: stopped within the funnel this long at once is the fault (ms). */
export const FUNNEL_FAULT_MS = C.funnelFaultMs;
/** Stopped in the doorway: the feet under this speed (m/s, from a tick's travel; my call: a walk through it is not standing in it). */
export const FUNNEL_STILL_MS = 0.3;
/** The flag's numbers are carry.js's, the one helper's (FLAG_BODY_R_M, FLAG_REACH_M, FLAG_MS): re-exported for the tests. */
export { FLAG_MS, FLAG_BODY_R_M, FLAG_REACH_M } from '../arms/carry.js';
/** The #2 in place: within TWO_SLOT_M of his slot (m); his start TWO_BEHIND_M behind yours (m). */
export const TWO_SLOT_M = C.twoSlotM, TWO_WAIT_MS = C.twoWaitMs, TWO_BEHIND_M = C.twoBehindM;
/** Stacked: within STACK_M of #1's stack point (m; my call). */
export const STACK_M = C.stackM;
/** The stalls and the lane's limit (ms lived), the hot wash (ms). */
export const STALL_MS = C.stallMs, STALL_MORE_MS = C.stallMoreMs, LANE_MAX_MS = C.laneMaxMs, WASH_MS = C.washMs;
/** The lane's due (see stall): the lane kept back from LANE_MAX_MS, and each leg after the current one's own (ms lived). */
export const LANE_KEEP_MS = C.laneKeepMs, LEG_LAST_MS = C.legLastMs;
/** SHOW CLEAR to the eye (FL22-1): the instructor's eye within SHOW_CLEAR_M of the marine's chest for SHOW_LOOK_MS before he calls the gun clear (m, ms); "The lane is clear." WASH_AFTER_MS after the last "Clear." (ms). */
export const SHOW_CLEAR_M = C.showClearM, SHOW_LOOK_MS = C.showLookMs, WASH_AFTER_MS = C.washAfterMs;
/** A man's strikes on one marine within this are called as one, when the last has landed (ms; v0.0.22, FL22-2). */
export const PAINT_CALL_MS = C.opfor.paintCallMs;
/** A standing marine's chest over his floor (m; the lens's: the catwalk's 3.0 m less 1.3, 1.7 m up). */
export const CHEST_Y_M = 1.3;
/** A paper threat's hit sensor (pairs.js's): down at this many torso or head hits, turned away this long after (ms). */
export const STOP_TORSO = 2, STOP_HEAD = 1, SENSOR_MS = 100;
/** A call while a man of the leg turned under this long ago, not yet seen, is void (ms; my call: his turn and the take-in's first ticks). */
export const APPEAR_MS = 1000;
/** The #2's rounds kept on his record (the turners' hits name them). */
export const TWO_SHOTS_KEPT = 30;
/** The face's centre on its stand (m; the bay's). */
export const FACE_Y = 1.35;
/** The sheets the picker offers, in its order, and its default (the sheet's §2.6; the boot recruit by §8 item 8). */
export const HOUSE_SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']), HOUSE_SHEET = 'private';
/** The pars the picker offers. */
export const HOUSE_PARS = Object.freeze(Object.keys(PAR_MS));
/** The setups (tests and the page: debug.js's share). */
export const HOUSE_SETUPS = Object.freeze(['go', 'room:2', 'room:3', 'hall', 'contact', 'ref']);
/** The stands' roles (see the header): their face ('draw': 1b and 3a), their trigger and their name where the spec gives none (no slot; whose a man is goes by where he stands, the fill's T.slot from room.js sectorOf, read by team.js ownerOf). */
export const STANDS = Object.freeze({
  '1a': Object.freeze({ face: 'threat', trigger: 'go', name: 'the far left target' }),
  '1b': Object.freeze({ face: 'draw', trigger: 'go', name: 'the far right target' }),
  '2a': Object.freeze({ face: 'armoured', trigger: 'door', name: 'the armoured target' }),
  '2b': Object.freeze({ face: 'noshoot', trigger: 'go', name: 'the target by the inner door' }),
  '3a': Object.freeze({ face: 'draw', trigger: 'door', name: "the near leg's target" }),
  '3b': Object.freeze({ face: 'hostage', trigger: 'go', name: 'the hostage card' }),
  H: Object.freeze({ face: 'threat', trigger: 'zone', name: "the target at the hall's end" }),
});
const STAND_IDS = Object.freeze(Object.keys(STANDS));
/** A fault's words on the paper and on the card. */
export const FAULT_WORDS = Object.freeze({
  funnel: 'stopped in the door',
  muzzle: 'the muzzle across your number two',
  corner: 'a corner not looked at',
  noshoot: 'a no-shoot hit',
  hostage: 'the hostage hit',
  standing: 'a threat left standing',
  door: 'the inner door left',
  time: 'a room not cleared in its time',
  relaxed: 'Relaxed in a room',
  cold: 'a round before GO',
  slow: 'the line waited on you',
  person: 'aimed at a person',
  dry: 'out of rounds',
  bang: 'late on the bang',
  blast: 'the stack in the blast',
  feet: 'a bang at your feet',
  charge: 'a charge left on a door',
  pin: 'a pin out at the end',
  fragged: 'a frag into a room with a family',
  concussed: 'a no-shoot in the blast',
  burst: 'the stack in the burst',
  exposed: 'exposed in the throw',
  through: 'a round through the door',

  surrendered: 'a man who gave up shot',
  uncovered: 'a man down or with his hands up left uncovered',
  reopened: 'a room called clear with a man up in it',
  casualty: 'paint on the stack: a casualty',
  masked: 'a round of his held by you on his line',
});
// (a fault's mark on its leg's row of the run sheet (legWords), where it has one)
const FAULT_PAPER = Object.freeze({
  funnel: 'DOORWAY',
  muzzle: 'MUZZLE',
  corner: 'CORNER MISSED',
  noshoot: 'NO-SHOOT HIT',
  hostage: 'HOSTAGE HIT',
  standing: 'LEFT STANDING',
  door: 'DOOR LEFT',
  time: 'TIME',
  relaxed: 'RELAXED',
  cold: 'COLD',
  // (a breach round run on into the room; the read's faults (fragged, concussed, burst, exposed) have no word here: their kit
  // mark names each once, with its figures (practice.js readMarks: "FRAGGED THE HOSTAGE", "NO-SHOOT IN THE BLAST 36 KPA", "IN
  // THE BURST: YOUR #2, 140 FRAGMENTS", "EXPOSED IN THE THROW 1.1 S"); "ROUND THROUGH THE DOOR" whole, so the card's red (ui/cards/
  // house.js FAULT_MARKS) misses the neutral "1A HIT THROUGH THE DOOR" (the review of v0.0.19's K: printed twice, through never red))
  through: 'ROUND THROUGH THE DOOR',

  surrendered: 'HANDS UP SHOT',
  uncovered: 'UNCOVERED',
  reopened: 'REOPENED',
  casualty: 'CASUALTY',
  masked: 'MASKED',
});
const ZONES =Object.freeze(['A', 'C', 'head', 'ring', 'headDown', 'miss', 'noshoot', 'hostage']);
const ZONE_PAPER = Object.freeze({ A: 'A', C: 'C', head: 'HEAD', ring: 'RING', headDown: 'HEAD DOWN', miss: 'MISS', noshoot: 'NO-SHOOT', hostage: 'HOSTAGE' });
const LEG_WORD = Object.freeze(['ROOM 1', 'ROOM 2', 'ROOM 3', 'THE HALL']);
const LEG_SAID = Object.freeze(['room 1', 'room 2', 'room 3', 'the hall']);

const tierOf = (tier) => (tier && TEST_SHEETS[tier] ? tier : HOUSE_SHEET);
const isHouse = (state) => rangeOf(state)?.course === 'house';
/** The house's record, or null off the house course. */
export const houseOf = (state) => (isHouse(state) ? rangeOf(state).house ?? null : null);
/** Leg k's due (game ms; the current leg's by default), or null before GO: LANE_KEEP_MS and LEG_LAST_MS for each leg after it kept back from the lane's limit (see stall). */
export const legDueMs = (H, k = H?.cur ?? 0) => (Number.isFinite(H?.goAtMs) ? H.goAtMs + LANE_MAX_MS - LANE_KEEP_MS - (legsOf(H).length - 1 - k) * LEG_LAST_MS : null);
export const planOf = (state, L) => (L ? lanePlanOf(state).plans[L.door] ?? null : null);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ---- the stands (HOUSE1's places, STANDS' roles) ----

/** The lane's stands in STANDS' order: { stand, room, leg, x, z, y, slot, name } from the house's spec (scenes/assemble.js houseSpecOf: HOUSE1 as set; an array or a map by stand id). */
export function standsOf(state = null) {
  // (the build sheet §1 item 8: a stand's slot is the sector it stands in on its leg's plan, room.js sectorOf (the hall's for
  // H), so a room drawn anywhere gives its men to the marine whose sector they are in; on the set each is HOUSE1's, all seven)
  const S = houseSpecOf(state).stands ?? [], plan = lanePlanOf(state);
  const list = Array.isArray(S) ? S : Object.entries(S).map(([stand, s]) => ({ stand, ...s }));
  return STAND_IDS.map((stand, i) => {
    const s = list.find(x => (x.stand ?? x.id) === stand) ?? null, R = STANDS[stand];
    if (!s) throw new Error(`shoothouse: the house's spec has no stand '${stand}'`);
    // (its trigger the spec's, by its role: a drawn room's stands turn by their chunk's roles, wherever the room stands
    // in the lane; on the set HOUSE1's, which are STANDS' to the stand)
    return { stand, room: s.room, leg: stand === 'H' ? 3 : Number(stand[0]) - 1, x: s.x, z: s.z, y: s.y ?? FACE_Y, slot: sectorOf(plan.plans[plan.order[stand === 'H' ? 3 : Number(stand[0]) - 1]], s.x, s.z) ?? s.slot ?? 1, name: s.name ?? R.name, lane: s.lane ?? i + 1,
      faceRad: s.faceRad ?? null, gapMs: Array.isArray(s.trigger?.gapMs) ? s.trigger.gapMs : null, trigger: s.trigger?.kind ?? R.trigger };
  });
}
const startOf = (state) => { const S0 = houseSpecOf(state).start; return { x: S0.x, z: S0.z, face: S0.face ?? 'left' }; };
// (the #2's start: HOUSE1's, else TWO_BEHIND_M behind yours on the hall's axis, uprange of the lane (east))
const twoStartOf = (state) => { const H1 = houseSpecOf(state); return H1.two ? { x: H1.two.x, z: H1.two.z } : { x: q(H1.start.x + TWO_BEHIND_M, 0.01), z: H1.start.z }; };
// (the zone the hall's turner waits for: HOUSE1's zones.hallWest (a record { id, rect }, or its id))
const hallZone = (state) => { const z = houseSpecOf(state).zones?.hallWest; return typeof z === 'string' ? z : z?.id ?? 'w4.z.hall-west'; };
// (the zone at a point of the house: a trigger zone's (named, with a rect), else its room's)
const zoneAt = (state, x, z) => { const A = houseSpecOf(state).area; return zoneOf(A, x, z)?.id ?? roomOf(A, x, z)?.zone ?? null; };

// ---- the draws (the seed alone) ----

const pickW = (r, list) => weighted(r, list);
/**
 * Every stand's draw from the seed alone (see the header): { [stand]: { face, holds, gapMs } }; a stand's gap range HOUSE1's where it
 * gives one. v0.0.21 A: spec, a drawn house's (scenes/assemble.js assembleHouse(code).spec): each stand's face its cast's (the code's
 * `|f`, drawn by the assembler from the seed), its holds and its gap drawn on the set's streams by its stand id, its gap's range its
 * role's (COURSES.house.draws.cast); spec null, the set's draw byte for byte.
 */
export function drawStands(seed, spec = null) {
  if (spec) return drawnStands(seed, spec);
  const out = {}, given = Object.fromEntries(standsOf(null).map(s => [s.stand, s.gapMs]));
  for (const stand of STAND_IDS) {
    const R = STANDS[stand], r = stream(seed, 'house:draw', stand);
    const face = R.face === 'draw' ? pickW(r, C.draws.faces[stand]) : R.face;
    const holds = face === 'noshoot' ? pickW(r, C.draws.noshootHolds) : pickW(r, C.draws.threatHolds);
    const gr = stream(seed, 'house:gap', stand);
    const span = R.trigger === 'go' ? null : given[stand] ?? (R.trigger === 'zone' ? C.gaps.zone : C.gaps.door[`w4.r${stand[0]}`] ?? C.gaps.doorOther);
    out[stand] = { face, holds, gapMs: span ? whole(intIn(gr, span[0], span[1])) : 0 };
  }
  return out;
}
// (a drawn house's stands' draws (see drawStands): the face its cast's, the holds and the gap on the set's streams by stand id)
function drawnStands(seed, spec) {
  const out = {};
  for (const s of spec.stands) {
    const r = stream(seed, 'house:draw', s.stand), face = s.faces?.[0] ?? 'threat';
    const holds = face === 'noshoot' ? pickW(r, C.draws.noshootHolds) : pickW(r, C.draws.threatHolds);
    const span = s.trigger?.kind === 'go' ? null : Array.isArray(s.trigger?.gapMs) ? s.trigger.gapMs : s.trigger?.kind === 'zone' ? C.gaps.zone : C.gaps.doorOther;
    out[s.stand] = { face, holds, gapMs: span ? whole(intIn(stream(seed, 'house:gap', s.stand), span[0], span[1])) : 0 };
  }
  return out;
}
/**
 * The drawn house's code for a fill (the build sheet v0.0.21 §1 item 1, §0 item 50): `house` a code (its layout part alone gains
 * the cast drawn from the seed; a whole code is played as written) used where `draw` is 'drawn' or not given; `draw` 'drawn' with
 * no house (or a code that is no house) draws one from the seed (doors 'fixed': the chunks' authored swings, every door closed);
 * null for the set ('set', or nothing given). v0.0.22 (its build
 * sheet item 14): `layout` 'B' or 'C' a named house (assemble.js HOUSE_LAYOUTS: its layout part, its cast drawn from the seed), before a
 * code or a draw ('A' and absent: as before); `rooms` 'all' draws from X4's eight rooms (assemble.js lazyOf), absent the three. v0.0.22
 * G5: "Stack and clear, live" can be drawn as any lane is (its men's posts travel with the chunks, opfor.js spotOf), but only where
 * `liveDraw` says so: until its ship rule is met (F80, the drawn slice of shoothouse-live-nodead; the build sheet v0.0.22 §9) a live
 * lane is the set from the page, whatever its URL asks (`live` true, `liveDraw` false: null), as v0.0.21 had it, and drawn as asked by
 * the tests' createGame, which passes `liveDraw` (the B and C review of 2026-11-16: `&draw=drawn`, `&rooms=all`, `&layout=B` and
 * `&layout=C` drew it from the page with F80 open). The ship lifts the gate.
 */
export function drawnCodeFor(seed, { draw = null, house = null, doors = null, live = false, liveDraw = false, rooms = null, layout = null } = {}) {
  if (live && !liveDraw) return null;
  if (layout === 'B' || layout === 'C') return wholeCodeOf(HOUSE_LAYOUTS[layout], seed);
  if (draw === 'set') return null;
  const code = house ? wholeCodeOf(house, seed) : null;
  if (code && assembleHouse(code)) return code;
  return draw === 'drawn' || rooms === 'all' ? drawnCodeOf(seed, { doors: doors === 'fixed' ? 'fixed' : 'drawn', ...(rooms === 'all' ? { rooms: 'all' } : {}) }) : null;
}
/** The dummy's round in magazine 1 (3 to 6) and its count n (feed() takes it when the magazine holds n). */
export function drawDummy(seed) {
  const round = intIn(stream(seed, 'house:dummy'), C.dummyRound[0], C.dummyRound[1]);
  return { mag: 1, round, n: C.mags[0] - round + 1, kind: 'dud' };
}
/** The #2 drawn from your fire team (see the header): a person id, or null with no team. */
export function drawTwo(state) {
  const pid = playerId(state), me = state.people?.[pid], unit = state.units?.[me?.service?.unitId];
  if (!unit) return null;
  const team = (me.service.billet ?? '').split('-')[0];
  const opts = C.draws.two.filter(([b]) => b.startsWith(`${team}-`) && unit.billets[b] && unit.billets[b] !== pid);
  if (!opts.length) { const any = Object.entries(unit.billets).filter(([b, p]) => b.startsWith(`${team}-`) && p !== pid).sort(); return any[0]?.[1] ?? null; }
  return unit.billets[pickW(stream(state.meta.seed, 'house:two'), opts)];
}
/** The gap from Standby to GO for an attempt (ms, whole ticks). */
export const standbyGapOf = (seed, attempt = 0) => whole(intIn(stream(seed, 'house:standby', attempt), STANDBY_MS[0], STANDBY_MS[1]));

// ---- the fill ----

const newLeg = (door, room) => ({ room, door, state: 'ahead', fromMs: null, stackAtMs: null, openAtMs: null, enteredAtMs: null, clearAtMs: null, funnelMs: 0, funnelRunMs: 0, covered: {},
  contacts: [], rounds: 0, zones: {}, twoZones: {}, faults: [], calls: [], presses: 0, pressAbout: { person: 0, door: 0 }, inner: null, how: { keys: 0, bundle: 0 } });

/** The fill of 'test-shoothouse' (see the header). tier: a TEST_SHEETS id (the private by default); par: 'basic' | 'advanced' | 'operator' | null (the sheet's); setup: HOUSE_SETUPS or null. */
// (draw ('set' | 'drawn'), house (a code) and doors ('fixed') come through from the URL, the picker and createGame (the build
// sheet §0 item 54); the set ignores them, the drawn house's branch (A) reads them. v0.0.22 (its build sheet §2 step 3): rooms ('all':
// X4's eight chunks drawn from; absent the three), layout ('B' | 'C': a named house; absent or 'A' the set) and plans ('derived')
// come through likewise, absent when not given; v0.0.22's A reads them, stage 0 only threads them; liveDraw (true from the tests'
// createGame only, never from the page) lets a live lane be drawn as asked while its ship rule is open: drawnCodeFor). v0.0.23 (its
// build sheet §2 step 3, item 14): again (the page's "Again" of the same lane, createGame's again: true) writes R.house.again = true
// when given with no setup (a setup has no brief), nothing otherwise; stage 0 only threads it, v0.0.23's D reads it (the short brief)
export function testShoothouse(state, { at = null, setup = null, tier = null, par = null, loadout = null, opfor = null, draw = null, house = null, doors = null, rooms = null, layout = null, plans = null, liveDraw = false, again = false } = {}) {
  // (the house through its seam, scenes/assemble.js: HOUSE1 and its area as set. v0.0.21 A, the drawn house: its code
  // (drawnCodeFor: the URL's &house, the picker's draw, never the live lane's), its area assembled and registered (model.js's
  // registry), its spec read from it until R.house.draw is written; nothing of it on the set)
  const seed = state.meta.seed, op0 = parseOpfor(opfor), code = drawnCodeFor(seed, { draw, house, doors, live: !!op0 && !op0.error, liveDraw: !!liveDraw, rooms, layout });
  const drawn = code ? assembleHouse(code) : null;
  const hs = drawn?.spec ?? houseSpecOf(state), sheet = tierOf(tier), S0 = startOf(state);
  barracks(state, { at: { area: hs.area, x: S0.x, z: S0.z, face: S0.face, ...(at ?? {}) } });
  // (PLACES §9.9, "what is saved: only { spec, seed, gen: 'assemble@1' }; the layout is rebuilt on load": the places domain's
  // upgrade 'places:gen' registers the area again from it (src/sim/places/domain.js))
  if (drawn) state.places.live.gen = { base: WHEEL_S4.id, code: drawn.code, v: ASSEMBLE_V };
  const me = playerActor(state), pid = playerId(state), person = state.people[pid];
  setOutfit(me, 'combatSuit');
  person.body = deltaOf(setLedgers(startBody(person, state.clock.ms, lonOfSite(HOUSE_SCENE.site), seed), {}));
  person.skills = testSheet(sheet);
  me.moveStance = 'combat';
  // (setup 'ref': room 1 as COMBAT §25.5.1's reference room, one man in it, no dummy (the tests' measure against the sheet's §4))
  const ref = setup === 'ref', dummy = drawDummy(seed);
  // (v0.0.19: on the live lane the marines' issue is 'house-fof', the house's with marking rounds in place of frangible (kit.js):
  // the same items in the same order, so its ids are the lane's own; the P-12's FOF_SIDEARM)
  const op = parseOpfor(opfor), live = !!op && !op.error, issue = live ? 'house-fof' : C.kit;
  const kit = materialise(state, pid, issue, { sets: ref ? {} : { 1: { n: dummy.n, kind: dummy.kind } } });
  // (the #2: a marine of your fire team, your sheet written on him for the scene, his issue in Condition 4 as yours is: the
  // magazines in his pouches, the chamber empty, on safe; he loads on the tower's LOAD and makes ready on its MAKE READY, his
  // own macros (twoCmd; COMBAT §25.19.5, the rework's R5: v0.0.12 loaded him at the fill))
  const twoPid = drawTwo(state), T0 = twoStartOf(state);
  let twoKit = null;
  if (twoPid) {
    const two = state.people[twoPid];
    two.skills = testSheet(sheet);
    twoKit = materialise(state, twoPid, issue);
    state.items[twoKit.gunId].mode = 'safe';
    setPost(state, twoPid, { key: 'house-two', area: hs.area, x: T0.x, z: T0.z, face: 'left', outfit: 'combatSuit' });
  }
  const chiefPid = drawStaff(state, 'melas:wheel-house-chief'), B = hs.booth;
  setPost(state, chiefPid, { area: hs.area, x: B.x, z: B.z, face: B.face ?? 'left' });
  syncActors(state);
  const twoA = actorOf(state, twoPid);
  if (twoA) { twoA.moveStance = 'combat'; twoA.headRad = Math.PI; }
  const R = startRange(state, null, { course: 'house', lane: null, area: hs.area, kit, set: ref ? null : { mag: dummy.mag, n: dummy.n, kind: dummy.kind }, roId: chiefPid, coachId: chiefPid });
  // (the drawn house's record first, so every reader of the seam below (lanePlanOf, standsOf, hallZone) reads its house.
  // its rooms ('all', a lane drawn from the eight; absent the three) and its named layout ('B' | 'C'; absent the set or a
  // draw), and the plans' source (R.house.plans 'derived', the lead's switch: every door's plan derived from its geometry at the fill,
  // scenes/assemble.js planSetOf; absent the authored), each written only when given, so no lane without them moves)
  const named = (layout === 'B' || layout === 'C') && drawn && parseHouse(drawn.code)?.layout === HOUSE_LAYOUTS[layout];
  const drawRec = drawn ? { mode: 'drawn', v: 1, code: drawn.code, ...(rooms === 'all' && !named ? { rooms: 'all' } : {}), ...(named ? { layout } : {}) } : null;
  const plansRec = plans === 'derived' ? { plans: 'derived' } : {};
  if (drawRec || plans === 'derived') { R.house = { ...(drawRec ? { draw: drawRec } : {}), ...plansRec }; delete state.$rooms; }
  const draws = drawStands(seed, drawn?.spec ?? null), plan = lanePlanOf(state);
  R.turners = standsOf(state).map(s => {
    const d = draws[s.stand], R0 = { trigger: s.trigger ?? STANDS[s.stand].trigger };
    const on = R0.trigger === 'door' ? plan.order[s.leg] : R0.trigger === 'zone' ? hallZone(state) : null;
    // (the reference room's second man stays edge-on: setup 'ref')
    if (ref && s.stand === '1b') return { key: `turner:${s.lane}`, lane: s.lane, room: s.room, stand: s.stand, name: s.name, slot: s.slot, x: s.x, z: s.z, y: s.y, ...(s.faceRad !== null ? { faceRad: s.faceRad } : {}),
      face: d.face, holds: d.holds, trigger: { kind: 'never', on: null, gapMs: 0 }, turnAtMs: null, awayAtMs: null, hits: [], stoppedAtMs: null };
    return { key: `turner:${s.lane}`, lane: s.lane, room: s.room, stand: s.stand, name: s.name, slot: s.slot, x: s.x, z: s.z, y: s.y, ...(s.faceRad !== null ? { faceRad: s.faceRad } : {}),
      face: d.face, holds: d.holds, trigger: { kind: R0.trigger, on, gapMs: d.gapMs }, turnAtMs: null, awayAtMs: null, hits: [], stoppedAtMs: null };
  });
  const sheetPar = par && PAR_MS[par] ? par : PAR_OF_TIER[sheet] ?? 'basic';
  const legs = plan.order.map(door => newLeg(door, plan.plans[door]?.room ?? null));
  R.house = {
    lane: plan.lane ?? 'A', tier: sheet, par: sheetPar, parMs: PAR_MS[sheetPar], parSet: par && PAR_MS[par] ? par : null, standby: null, goAtMs: null, twoPid, chiefPid,
    stallAtMs: null, end: null, wash: null, cur: 0, doors: {}, zones: {}, owed: [], spinSaid: false,
    two: { pid: twoPid, aid: twoA?.id ?? null, rung: twoPid ? rungOf(state, twoPid, 'room') : 0, doing: null, hold: null, contact: null, eng: null, known: {}, ident: {}, fired: 0, hits: 0 },
    dummy: { magId: kit.magIds[0], n: ref ? null : dummy.n, round: ref ? null : dummy.round, clickAtMs: null, clearedAtMs: null },
    rooms: legs.slice(0, -1), hall: legs.at(-1),
    // (the drawn house's record, R.house.draw = { mode: 'drawn', v, code }: absent on the set; its rooms and
    // layout where given, and R.house.plans 'derived' where given)
    ...(drawRec ? { draw: drawRec } : {}), ...plansRec,
    // (Again of the same lane, from the fill only (no setup); absent otherwise, so every lane without it is as before)
    ...(again && !setup ? { again: true } : {}),
  };
  R.load = live ? 'marking' : 'frangible';
  // (the rework's R6: the P-12, on every sheet from 2026-11-15 (the Sergeant up before), its ids after every other item of the
  // fill so the stands' and the kit's ids are the same on every sheet; Condition 3, the spare in the thigh's pouch (kit.js issueSidearm))
  if (SIDEARM_TIERS.includes(sheet)) issueHouseSidearm(state, pid, live);
  // (v0.0.18, the loadout (WEAPONS §12.7; loadout.js): one for every sheet, yours then your #2's, its ids after every other
  // item of the fill; the standard makes nothing and writes nothing, so its lane is the lane without it to the byte)
  // (a code the page refuses fills the standard, his P-12 with it (it is the standard's now))
  const asked = loadoutOf(loadout), spec = asked.error ? loadoutOf(null) : asked;
  if (!asked.error && !isStandard(loadout)) {
    applyLoadout(state, pid, spec);
    if (twoPid) applyLoadout(state, twoPid, spec);
    R.house.loadout = codeOf(spec);
    // (v0.0.19, D2: the brief's intelligence where the loadout carries a practice frag or concussion (house-kit.js intelOf))
    const intel = intelOf(state); if (intel) R.house.intel = intel;
  }
  // (your #2's P-12, standard issue from v0.0.20 (loadout.js twoP12Of, the one reader: '~two:none' the tests' only; an unknown code
  // is the standard, so the default): the fill's last items, so every other id is v0.0.18's; on the live lane marking as yours is
  // (v0.0.19 issued his the house's frangible there: one helper for both men now, issueHouseSidearm)
  if (twoPid && twoP12Of(spec.error ? null : spec)) issueHouseSidearm(state, twoPid, live, { two: true });
  // (a lane door drawn open is found open: set so at the fill (a delta in the save) and its time noted, as a setup's
  // open door is; its stands turn no sooner than GO and their gap (triggers))
  if (drawn) parseHouse(drawn.code).rooms.forEach((R1, k) => { if (R1.state === 'open') openDoor(state, plan.order[k]); });
  // (the card: the stands' books, each room's par and the lane's, from the house as drawn, before any setup moves you (fillPars))
  fillPars(state, R.house, kit.gunId);
  if (setup) setupHouse(state, setup);
  // (v0.0.19, "Stack and clear, live" (COMBAT §25.18; the build sheet v0.0.19 §0 item 18): the role-players the last items of the
  // fill, after v0.0.18's and your number two's P-12, so every id before them is the lane's without them, and after the setup,
  // which makes no item, so a man of a leg it cleared is ruled out by opfor.js's fill ('setup'); with opfor none (or a code
  // parseOpfor refuses) nothing is made and nothing written; R.house.opfor the code that made them, for "Again as …")
  if (live) { R.house.opfor = op.cards ? `live:${op.cards['2a'] ?? '*'},${op.cards['3a'] ?? '*'}` : 'live'; fillOpfor(state, R.house, op); }
  return state;
}
// (the sidearm issued (see testShoothouse): the house's ten frangible, two magazines; on the live lane ten marking (v0.0.19), for
// you (H.pistol) and, two, for your #2 (H.two.pistol) by the same rule)
function issueHouseSidearm(state, pid, live = false, { two = false } = {}) {
  const S = live ? FOF_SIDEARM : C.sidearm ?? { model: 'p12', mags: [['had17', 10, 'frangible'], ['had17', 10, 'frangible']] }, H = rangeOf(state).house;
  const gunId = issueSidearm(state, pid, { model: S.model, mags: S.mags }).gunId;
  if (two) H.two.pistol = gunId; else H.pistol = gunId;
  return gunId;
}
// (the P-12 made ready and holstered on safe, as MAKE READY leaves it (the rework's R6): Condition 3 to Condition 1)
/**
 * The tower's move-on past MAKE READY (handling.js moveOn, the house's): with your P-12's round still owed (sidearm.js pistolOwed:
 * its rack fumbled and not answered), the instructor racks it himself, on safe, in the holster, and says so, as the coach clears a
 * rifle never shown (the 'slow' fault is the move-on's). Before the fixer of v0.0.19 the lane went to GO with the P-12 short of
 * Condition 1 (the fumble net's p12-unready-v018: 7 lanes of v0.0.18's sweep). Returns whether he did.
 */
export function houseMoveOn(state, bus, def) {
  const pid = playerId(state), want = def?.ready === 'houseStart' ? houseWant(state) : null;
  // (the review of his P-12 made standard: a want of your number two's at the move-on is his, given up for MAKE READY
  // (W.gaveUp.ready, as TWO_TRIES gives it up), so the standby never waits on it again, and his P-12's round still owed racked by
  // the instructor as yours is; the move-on is quiet then (handling.js: no 'slow' fault of yours for his stall))
  if (String(want ?? '').startsWith('two:')) return twoMoveOn(state, bus);
  // (the P-12's round owed whatever the rifle lacks: with the rifle's magazines on the floor houseWant says 'mag' first, and the
  // pistol went to GO unchambered too (the hunt of v0.0.18's pistol-6: both guns empty at GO))
  // (the build sheet's item 6: and a P-12 in the hand with its round owed, as believed (a magazine in, the chamber empty):
  // its own MAKE READY halted after the draw (a fumbled part), the tower waiting on 'chamber' for it, and the move-on went to GO with
  // it unchambered in the hand, nothing racked (the fumble net's N11, the corporal on seed 1 once the house bot answered "P-12: MAKE
  // READY"). He racks it there, in your hand, on safe)
  if (def?.ready !== 'houseStart') return false;
  const inHand = drawnPistol(state, pid), hb = inHand ? beliefOf(state, inHand) : null;
  const p = inHand ? (hb.mag === 'in' && hb.chamber === 'empty' && hb.count !== 0 ? inHand : null) : adminSubs(state, pid, 'ready').length ? holsteredPistol(state, pid) : null;
  if (!p) return false;
  readyPistol(state, p);
  chiefSays(state, bus, HOUSE_CHIEF.pistolRacked, 'pistolRacked');
  return true;
}
// (your number two's want at MAKE READY's move-on (houseMoveOn): his 'ready' given up, his P-12 racked if its round is owed)
function twoMoveOn(state, bus) {
  const H = houseOf(state), W = H?.two;
  if (!W?.pid) return false;
  (W.gaveUp ??= {}).ready = state.clock.ms;
  const p = W.pistol && state.people[W.pid]?.kit?.worn?.holster === W.pistol ? state.items[W.pistol] : null;
  if (p?.mag && !gunField(p, 'chamber')) { readyPistol(state, W.pistol); chiefSays(state, bus, HOUSE_CHIEF.twoPistolRacked, 'twoPistolRacked'); }
  return true;
}
function readyPistol(state, gunId) {
  const P12 = gunId ? state.items[gunId] : null;
  if (P12?.mag && !gunField(P12, 'chamber')) { const pm = state.items[P12.mag]; feed(P12, pm); P12.mode = 'safe'; P12.belief = { ...(P12.belief ?? {}), chamber: 'live', count: pm.n }; }
}

/**
 * A save of a sheet below the Sergeant made by v0.0.14 to v0.0.16 (the user, 2026-11-15: "everyone should have the same
 * loadout"; the house issued the P-12 from the Sergeant up then) gains its P-12 on load, in the condition the tower's commands
 * so far would have left it: Condition 3 in the holster, its spare in the thigh's pouch, before MAKE READY; Condition 1 on
 * safe from MAKE READY (the macro to come racks nothing then, sidearm.js adminSubs) to the rifle's own UNLOAD; Condition 4
 * after it (the magazine in the pouch, never racked). Its ids are the next ones of the save. A run no-op once it has one (a
 * fresh fill, a save of the Sergeant up, a save loaded twice): an upgrade (core/state.js addUpgrade, the arms domain's).
 */
export function upgradeHousePistol(state) {
  const R = state.armoury?.range, H = R?.house, pid = state.player?.id;
  if (R?.course !== 'house' || !H || H.pistol || !pid || !state.people?.[pid]?.kit || state.people[pid].kit.worn?.holster) return;
  const gunId = issueHouseSidearm(state, pid), at = (id) => SEQ_HOUSE.findIndex(c => c.id === id), i = R.cmd ? at(R.cmd.id) : -1;
  if (i < at('ready')) return;
  const rifle = state.items[gunOn(state, pid)], cleared = i > at('clear') || (i === at('clear') && rifle && !rifle.mag && !gunField(rifle, 'chamber'));
  if (!cleared) { readyPistol(state, gunId); return; }
  const g = state.items[gunId], pouch = state.people[pid].kit.worn.thigh;
  if (g.mag && pouch) { move(state, g.mag, { container: pouch }); if (g.belief) delete g.belief.count; }
}

/**
 * A save of the house made before v0.0.20's pars (v0.0.12 to v0.0.19, and a v0.0.20 lane loaded from one) gains them on load by the
 * fill's own functions (fillPars: each stand's book, each leg's par, the lane's, the immediate action's book), planned from the state
 * as loaded, not as the fill saw it: each leg from where it stands (legFrom) at the load's ms, the doors as they stand, with the
 * rifle the fill planned with (kit.worn.sling: a rifle stays there whatever its posture); so a lane saved mid-way gains pars for what
 * is left of it, which may differ from the fill's (the code review of 2026-11-16), and nothing plans a par on a read again (the build sheet
 * v0.0.21 §0 item 17, §1 item 25; perf lens P10: four planBundles on every read of the timer, the paper and houseNow, 2 to 4 ms a
 * tick in the page, for the rest of that lane). Field by field, only where absent: a v0.0.20 save, which has them, is left as it
 * is. An upgrade (core/state.js addUpgrade, the arms domain's 'arms:house-pars', after 'arms:house-pistol'): a no-op once run.
 */
export function upgradeHousePars(state) {
  const R = state.armoury?.range, H = R?.house, pid = state.player?.id;
  if (R?.course !== 'house' || !H || !pid || !Array.isArray(R.turners) || !H.rooms || !H.hall) return;
  const legs = legsOf(H), gunId = state.people?.[pid]?.kit?.worn?.sling ?? null;
  if (H.books && legs.every(L => Number.isFinite(L.parMs)) && Number.isFinite(H.laneParMs) && (Number.isFinite(H.iaBookMs) || !gunId)) return;
  if (!H.books) H.books = Object.fromEntries(R.turners.map(T => [T.stand, standBookOf(state, T, { pid, gunId })]));
  for (const L of legs) if (!Number.isFinite(L.parMs)) L.parMs = roomParOf(state, L.door, H, { gunId });
  if (!Number.isFinite(H.laneParMs)) H.laneParMs = sum(legs.map(L => L.parMs ?? 0));
  const g = gunId ? state.items[gunId] : null;
  if (g && !Number.isFinite(H.iaBookMs)) H.iaBookMs = macroMs(rollerOf(state, pid), g, 'ia', beliefOf(state, gunId));
}

// (a setup: the rifle loaded, made ready and on safe at low ready; GO given now, in stop motion; the legs before `leg` cleared)
function setupHouse(state, setup) {
  const R = rangeOf(state), H = R.house, pid = playerId(state), me = playerActor(state), gunId = gunOn(state, pid), gun = state.items[gunId], now = state.clock.ms;
  const magId = H.dummy.magId, mag = state.items[magId];
  // (the load it went in with, as the seat records it (firearms.js fullN): ten in a thirty, Top up's "half or less" of ten)
  const loadN = mag.n;
  move(state, magId, { gun: gunId });
  feed(gun, mag);
  gun.mode = 'safe';
  gun.belief = { chamber: 'live', count: mag.n, ...(loadN < famCap(mag.fam) ? { fullN: loadN } : {}) };
  if (mag.belief) delete mag.belief;
  state.people[pid].kit.carry.posture = 'lowReady';
  // (the P-12 made ready and holstered on safe, as MAKE READY leaves it (the rework's R6))
  readyPistol(state, H.pistol);
  // (your #2 made ready as you are: his first magazine seated, a round up, on safe, low ready, as his LOAD and MAKE READY leave him)
  armTwo(state, H);
  readyPistol(state, H.two.pistol);
  cancel(state, 'arms:range');
  const i = SEQ_HOUSE.findIndex(c => c.id === 'go');
  R.cmd = { id: 'go', i, atMs: now }; R.next = null; R.livedMs = 0;
  const leg = setup === 'room:2' ? 1 : setup === 'room:3' ? 2 : setup === 'hall' ? 3 : 0;
  goNow(state, null, { stop: setup !== 'contact' });
  const legs = legsOf(H), plans = lanePlanOf(state).plans;
  for (let k = 0; k < leg; k++) {
    const L = legs[k], P = plans[L.door];
    Object.assign(L, { state: 'clear', setup: true, stackAtMs: now, openAtMs: now, enteredAtMs: now });
    for (const h of P?.hot ?? []) L.covered[h.id] = { atMs: now, by: 'me' };
    if (L.door !== 'hall') openDoor(state, L.door);
    for (const T of R.turners) if (legOf(T) === k) { if (THREAT_FACES.includes(T.face)) T.stoppedAtMs = now; if (T.turnAtMs !== null) turnAway(T, now); }
  }
  H.cur = leg;
  const L = legs[leg], P = plans[L.door];
  L.fromMs = now;
  if (L.door === 'hall') L.state = 'open';
  if (leg > 0 && P) {
    place(me, P.stack[0][0], P.stack[0][1]);
    const a = actorOf(state, H.twoPid);
    if (a && P.stack[1]) placeTwo(state, a, P.stack[1][0], P.stack[1][1]);
    noteMind(state, 'clearing', { room: L.room, fromMs: now });
  }
  if (setup === 'contact' && P) {
    // (the door open, you in its doorway on your path, out of stop motion: the window opens on the first look)
    openDoor(state, L.door);
    const path = P.paths?.[1] ?? [P.stack[0], P.points[0]], a = path[0], b = path.at(-1);
    let x = a[0], z = a[1];
    for (let k = 1; k <= 40; k++) { const t = k / 40; x = a[0] + (b[0] - a[0]) * t; z = a[1] + (b[1] - a[1]) * t; if (pastThreshold(P, x, z)) break; }
    place(me, q(x, 0.01), q(z, 0.01));
    // (the eyes into the room, on the room's middle, and the body's facing with them: the eye's cone is the facing's
    // (perception.js), so the window opens on the first look at a man there)
    const r = P.rects?.[0], mid = r ? [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2] : b;
    me.headRad = q(Math.atan2(mid[1] - z, mid[0] - x), 1e-6); me.face = faceOfHead(me.headRad);
    Object.assign(L, { state: 'open', stackAtMs: now, openAtMs: now });
  }
  H.stallAtMs = now;
}
// (a setup's #2 in Condition 1 as his LOAD and MAKE READY would leave him: his first magazine seated, a round up, on safe, low ready, believed so)
function armTwo(state, H) {
  const W = H?.two, gunId = W?.pid ? gunOn(state, W.pid) : null, gun = gunId ? state.items[gunId] : null;
  if (!gun || gun.mag) return;
  const magId = sparesOf(state, W.pid, null).find(id => (state.items[id]?.n ?? 0) > 0);
  if (!magId) return;
  const mag = state.items[magId], loadN = mag.n;
  move(state, magId, { gun: gunId });
  feed(gun, mag);
  gun.mode = 'safe';
  gun.belief = { chamber: 'live', count: mag.n, ...(loadN < famCap(mag.fam) ? { fullN: loadN } : {}) };
  if (mag.belief) delete mag.belief;
  (state.people[W.pid].kit.carry ??= {}).posture = 'lowReady';
}
const place = (a, x, z) => { a.x = x; a.z = z; a.$px = x; a.$pz = z; };
// (the #2 moved: his actor and his post, so the people layer keeps him where he is)
function placeTwo(state, a, x, z, face = null) {
  place(a, x, z);
  if (face) a.face = face;
  const p = state.people[a.who]?.post;
  if (p) { p.x = q(x, 1e-4); p.z = q(z, 1e-4); if (face) p.face = face; }
}
// (a door set open at once, its leaf already swung (a setup's): the leaf free now, the door's time noted)
function openDoor(state, door) {
  const H = houseOf(state);
  setOpening(state, door, 'open', { atMs: state.clock.ms });
  if (H) H.doors[door] ??= state.clock.ms;
}

// ---- the words ----

// (the instructor's word: owed while a take-in runs (the window's silence: COMBAT §25.4.5), said after it)
export function chiefSays(state, bus, lines, ...key) {
  const R = rangeOf(state), H = R?.house;
  if (!R || !H) return;
  const text = Array.isArray(lines) ? hashPick(lines, 'house-chief', state.meta.seed, ...key) : lines;
  if (pendingOf(state)) { H.owed.push(text); return; }
  chiefSpeaks(state, bus, R, H, text);
}
/**
 * The instructor's call of a strike on the stack ("Paint, chest. Keep working."): chiefSays's, but owed as { text, kind: 'paint' }
 * while a take-in runs, and never said once the casualty has opened or the lane has ended, whether now or when owed (sayOwed): the
 * hunt of v0.0.20 (paint-owed) heard "Paint, chest. Keep working." 50 ms after "I'm hit! I'm hit!", the corporal's keys lane on seed 1,
 * the strike's line owed through a window and said after the fatal strike's. Any later call of the paint goes through here.
 */
export function paintSays(state, bus, text) {
  const R = rangeOf(state), H = R?.house;
  if (!R || !H || paintLate(H)) return;
  if (pendingOf(state)) { H.owed.push({ text, kind: 'paint' }); return; }
  chiefSpeaks(state, bus, R, H, text);
}
// (a strike's call too late to say: the casualty open, or the lane over)
const paintLate = (H) => !!(H.live?.casualty || H.end);
// (the instructor's line said now: the fact, his last line, and outside the lane the PA's chain)
function chiefSpeaks(state, bus, R, H, text) {
  sayOn(state, bus, { who: R.coachId, text, kind: 'speech' });
  H.said = { text, atMs: state.clock.ms };
  // (the build sheet v0.0.20 §0 item 32: outside the lane (before GO's arming, from Stop on) his speech and his PA lines are one
  // speaker's, chained: the tower's next command waits for the chain's end (houseReady), so it never cuts him; in the lane, never)
  if (R.cmd?.id !== 'standby' && R.cmd?.id !== 'go' && text) R.paUntilMs = Math.max(R.paUntilMs ?? 0, state.clock.ms) + spokenMs(text);
}
// (the brief names the floor's gravity where you stand, read from the place (env.js gravityAt), never assumed: "Full G here"
// at 1 G in the Wheel, "0.38 G on this deck." under Mars's (the fixer's of 0.0.12, after the design review: nothing in the scene said
// it was at 1 G, the user's rule of 2026-11-08 and the scene's point)
function gravityWords(state) {
  const me = playerActor(state), here = me ? gravityAt(state, null, me.x, me.z) : null, g = here?.gG;
  if (!Number.isFinite(g)) return '';
  return fill(hashPick(Math.abs(g - 1) <= GRAVITY_FULL_TOL_G ? HOUSE_CHIEF.full : HOUSE_CHIEF.gravity, 'house-chief', state.meta.seed, 'gravity'), { g: q(g, 0.01).toFixed(2) });
}
// (v0.0.18: the brief names the kit when it is not the standard (WEAPONS §12.7): what you carry, and the stands as unsuited men)
function kitWords(state) {
  const H = houseOf(state);
  if (!H?.loadout) return '';
  const m = (re) => Object.values(state.items).filter(x => DEVICES[x?.model] && re.test(x.model) && x.type === DEVICES[x.model].kind).length / (H.twoPid ? 2 : 1);
  const bits = [m(/^g11$/) ? `${m(/^g11$/)} stun${m(/^g11$/) > 1 ? 's' : ''}` : null, m(/^g9p$/) ? `${m(/^g9p$/)} practice frag${m(/^g9p$/) > 1 ? 's' : ''}` : null, m(/^g13p$/) ? `${m(/^g13p$/)} practice concussion${m(/^g13p$/) > 1 ? 's' : ''}` : null, m(/^sc1$/) ? `${m(/^sc1$/)} door charge${m(/^sc1$/) > 1 ? 's' : ''}` : null, m(/^bc1$/) ? `${m(/^bc1$/) > 1 ? `${m(/^bc1$/)} cutting charges` : 'a cutting charge'}` : null, m(/^hal$/) ? 'the halligan' : null, m(/^ram$/) ? 'the ram' : null].filter(Boolean);
  // (v0.0.19, D2: the intelligence, where the loadout carries a practice grenade (house-kit.js intelWords))
  return bits.length ? ` You carry ${bits.join(', ')}: use them on the doors you choose. Treat every target as an unsuited man.${intelWords(state)}` : '';
}
// (the drawn house (the build sheet §1 item 2): the brief names each lane door's swing as its stack reads it, from the
// drawn opening (room.js's plan swing, swing.js doorWordsOf: "Pull door, hinge right."); '' on the set, whose brief is v0.0.20's to
// the word (its spoken length chains the PA, and a word more would move LOAD and every pin cell)
export function doorWords(state) {
  const H = houseOf(state);
  if (H?.draw?.mode !== 'drawn') return '';
  const plan = lanePlanOf(state), words = plan.order.filter(k => k !== 'hall').map((k, i) => {
    const w = plan.plans[k]?.swing?.words;
    return w ? `room ${i + 1}, ${w.charAt(0).toLowerCase()}${w.slice(1, -1)}` : null;
  }).filter(Boolean);
  return words.length ? ` ${fill(hashPick(HOUSE_CHIEF.doors, 'house-chief', state.meta.seed, 'doors'), { doors: words.join('; ') })}` : '';
}
/** Within this of 1 G the brief says "Full G" (G; my call). */
export const GRAVITY_FULL_TOL_G = 0.02;
const fill = (line, map) => Object.entries(map).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, String(v)), line);

/** A fault in the house (see the header): the leg's record, the session's, the 'house' fact and the instructor's word (none: words given null). */
export function houseFault(state, bus, kind, words = HOUSE_CHIEF[kind] ?? null, L = curLeg(houseOf(state))) {
  const R = rangeOf(state), H = R?.house;
  if (!H || R.end) return;
  const now = state.clock.ms, text = Array.isArray(words) ? hashPick(words, 'house-chief', state.meta.seed, kind, now) : words;
  if (L) L.faults.push({ kind, atMs: now, text: text ?? null });
  R.faults.push({ rule: kind, kind: 'warn', atMs: now });
  bus?.emit('house', { phase: 'fault', room: L?.room ?? null, who: playerId(state), atMs: now, kind, text: text ?? null });
  if (text) chiefSays(state, bus, text);
}
const hasFault = (L, kind) => !!L?.faults?.some(f => f.kind === kind);

// ---- the readinesses ----

/**
 * What the shooter still lacks for MAKE READY's next (houseStart), in the order it is put right: 'mag', 'chamber', 'safe',
 * 'low', 'out' (in stop motion), 'mark' (off the start mark), 'still', 'gait' (not Combat), 'two' (the #2 not in place);
 * null when ready. Dry (R.dry): only 'safe', 'out', 'mark', 'still'.
 */
export function houseWant(state) {
  const R = rangeOf(state), H = R?.house, pid = playerId(state), me = playerActor(state), gun = state.items?.[gunOn(state, pid)];
  if (!H || !me || !gun) return null;
  const carry = state.people[pid]?.kit?.carry ?? {}, dry = !!R.dry, S0 = startOf(state);
  if (!dry && !gun.mag) return 'mag';
  if (!dry && gunField(gun, 'chamber') !== 'live') return 'chamber';
  if (gunField(gun, 'mode') !== 'safe' || (carry.finger ?? 'off') === 'on') return 'safe';
  if (!dry && carry.posture !== 'lowReady') return 'low';
  // (v0.0.18: the holstered P-12 made ready too, its round up (sidearm.js pistolOwed; the dead-end hunt of 2026-11-16))
  if (!dry && pistolOwed(state, pid)) return 'pistol';
  if (state.stop || state.time?.doing) return 'out';
  if (Math.hypot(me.x - S0.x, me.z - S0.z) > STACK_M) return 'mark';
  if (!stillOf(state) || (me.$px !== undefined && (me.$px !== me.x || me.$pz !== me.z))) return 'still';
  if ((me.moveStance ?? 'relaxed') !== 'combat') return 'gait';
  // (the tower waits on your number two as on you (COMBAT §25.19.5): his macro done, Condition 1, on safe, low ready, in place)
  const lack = twoLacks(state, 'ready');
  if (lack && !(dry && (lack === 'two:mag' || lack === 'two:chamber'))) return lack;
  const a = actorOf(state, H.twoPid), T0 = twoStartOf(state);
  if (a && Math.hypot(a.x - T0.x, a.z - T0.z) > TWO_SLOT_M) return 'two';
  return null;
}

/**
 * What the house's nudge names (handling.js, once the tower has waited nudgeMs; HOUSE_NUDGE's key): before GO houseWant's; at Stop
 * and SHOW CLEAR what the tower waits on there (the pistol out, your #2, the P-12 still loaded, else the show), never MAKE READY's
 * list (the hunt of v0.0.18: "Shooter, back on your mark." 29 s into SHOW CLEAR, with the P-12 1 + 9 in its holster).
 */
export function houseNudgeOf(state) {
  const R = rangeOf(state), id = R?.cmd?.id, pid = playerId(state);
  if (id !== 'stop' && id !== 'clear') return houseWant(state);
  const p = pistolLacks(state, pid, id);
  if (p === 'pistol:out') return p;
  // (FL22-1: your #2's guns shown and the instructor's look at them still owed (two.js W.showOwed: he looks at you first) is
  // no want of his)
  const two = id === 'clear' && R.house?.two?.showOwed !== undefined ? null : twoLacks(state, id);
  if (two) return two;
  if (id === 'clear') return p === 'pistol:safe' ? 'safe' : (R.shown && p) || 'show';
  return p ? 'safe' : null;
}

/**
 * The instructor's readinesses (handling.js lineReady asks them first on the house course): true or false for the
 * house's own (houseStart, goArm, laneDone, houseSafe, washed), null to let the shared switch answer (magIn, shown).
 */
export function houseReady(state, def, { still, safe } = {}) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return null;
  switch (def.ready) {
    case 'houseStart': return houseWant(state) === null;
    case 'goArm': return false;
    case 'laneDone': return !!H.end;
    // (LOAD, Stop and SHOW CLEAR wait on your number two too: his magazine in, his rifle safe, his shown (COMBAT §25.19.5))
    case 'magIn': return twoLacks(state, 'load') ? false : null;
    // (both guns (WEAPONS §3.2's note: "UNLOAD and SHOW CLEAR both, the pistol last"): a P-12 still in the hand at Stop or SHOW
    // CLEAR is not safe, whatever its own safety says, since the rifle on the sling is not judged then (the code review of
    // 2026-11-13: the sergeant who finished the lane on the pistol cleared the line with a hot rifle); holstered, on safe)
    case 'houseSafe': return !!still && !!safe && !pistolLacks(state) && !twoLacks(state, 'stop');
    // (and SHOW CLEAR judges what is in them, by the truth as the rifle's show is the instructor's look: the holstered P-12 with a
    // magazine or a round in it, or the rifle on its sling still loaded behind a show already made, holds the line (the hunt of
    // v0.0.18: a rifle fumble after the show, or the coach's take of the gun in the hand alone, passed the lane clear with the
    // P-12 1 + 9 in its holster or the R-7 racked live); the coach's take at the move-on clears every gun (handling.js coachClears))
    // (FL22-1: and your gun looked at by the instructor's eye (chiefSees), not called clear from the catwalk's far end)
    case 'shown': return twoLacks(state, 'clear') || pistolLacks(state, playerId(state), 'clear') || loadedGun(state.items?.[state.people?.[playerId(state)]?.kit?.worn?.sling]) || !chiefSees(state, H, playerId(state)) ? false : null;
    case 'washed': return !!H.wash && state.clock.ms >= H.wash.atMs + WASH_MS;
    // (its build sheet item 17, DC3: on the live lane LOAD follows the sterile check, the instructor's look at you and at your
    // #2 on the floor (sterileTick), nothing to press; null elsewhere, as before)
    case 'always': return def.id === 'brief' && rangeOf(state)?.load === 'marking' && !(chiefSees(state, H, playerId(state), 'sterile') && (!H.twoPid || chiefSees(state, H, H.twoPid, 'sterile'))) ? false : null;
    default: return null;
  }
}

/**
 * What the P-12 lacks for the tower's Stop and SHOW CLEAR: 'pistol:out' in the hand, 'pistol:safe' holstered off safe, and at SHOW
 * CLEAR (cmd 'clear') 'pistol:loaded' holstered with a magazine, a round (loadedGun) or its slide back; null without one or when it
 * is so. Your #2's is read for Stop's and SHOW CLEAR's (combat/two.js twoLacks: his admin clears his own, the instructor what it leaves).
 */
export function pistolLacks(state, pid = playerId(state), cmd = 'stop') {
  if (drawnPistol(state, pid)) return 'pistol:out';
  const h = holsteredPistol(state, pid), g = h ? state.items[h] : null;
  if (g && gunField(g, 'mode') !== 'safe') return 'pistol:safe';
  // (its slide back too: no pistol goes into a holster locked open, and its part's release is still to do)
  return cmd === 'clear' && !!g && (loadedGun(g) || !!gunField(g, 'locked')) ? 'pistol:loaded' : null;
}

// ---- the instructor's commands ----

/**
 * A house command's words (its build sheet's item 3, FL22-3): the one reader of `say` on the house course (handling.js
 * onRangeCmd's say and standingCmd's text, houseOnCmd's chain). A command with `sayEnd` (the wash) says `sayEnd.clear` on a lane
 * ended 'clear' (the wash's `say` itself, so the pick is v0.0.21's) and `sayEnd.other` on any other end (a casualty, time, dry, a
 * burst, and 'passed': "Weapons clear. Into the booth: hot wash."; before, "The lane is clear." on 56 of 56 casualty lanes); every
 * other command its `say`. A lane ends 'passed' only when its last leg was passed by the stall or the lane's due (endLeg's `how`), a
 * leg nobody cleared, so it is not called clear (the B and C review of 2026-11-16: "The lane is clear." at 711 s after "Time on that
 * room. Next door." at 585 s; the build sheet's item 3 had 'passed' with 'clear', from before the due; my call).
 */
export function houseCmdSay(state, def) {
  // (its build sheet items 14 and 17, carried FH-5 and DC3: Again of the same lane (R.house.again, from the fill) and the live
  // lane (R.load 'marking') say their own words, in this order: the live Again's, Again's, the live lane's; then the wash's by the end)
  const again = !!houseOf(state)?.again, live = rangeOf(state)?.load === 'marking';
  if (def?.sayAgainLive && again && live) return def.sayAgainLive;
  if (def?.sayAgain && again && !live) return def.sayAgain;
  if (def?.sayLive && live) return def.sayLive;
  if (!def?.sayEnd) return def?.say;
  const why = houseOf(state)?.end?.why ?? null;
  return why === 'clear' || why === null ? def.sayEnd.clear : def.sayEnd.other;
}
/** A command said on the house course (handling.js onRangeCmd, after the words and the phase): what the scene does at it. */
export function houseOnCmd(state, bus, def, i = SEQ_HOUSE.findIndex(c => c.id === def.id)) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return;
  const now = state.clock.ms;
  // (the build sheet v0.0.20 §0 item 32: the PA's line, as handling.js onRangeCmd said it (the same pick), chained outside the lane)
  // (FL22-3: the words said, by houseCmdSay, so the chain times "Weapons clear. …" where it is said)
  if (def.id !== 'standby' && def.id !== 'go') R.paUntilMs = Math.max(R.paUntilMs ?? 0, now) + spokenMs(R.cmd?.text ?? hashPick(houseCmdSay(state, def), 'range-cmd', state.meta.seed, i));
  // (each command goes to both marines: your number two's own macro for it, on his list doing (COMBAT §25.19.5))
  if (TWO_CMDS[def.id]) twoCmd(state, bus, def.id);
  switch (def.id) {
    // (carried FH-5: on Again of the same lane the beside-you line is not said, but for a kit with practice grenades, whose
    // rule ("hostiles only" rooms) is never lost to Again: "Same kit." and the intelligence (house-kit.js intelWords))
    case 'brief': if (H.again) { const intel = intelWords(state); if (intel) chiefSays(state, bus, `Same kit.${intel}`, 'brief'); break; }
      chiefSays(state, bus, `${hashPick(HOUSE_CHIEF.brief, 'house-chief', state.meta.seed, 'brief')} ${gravityWords(state)}${doorWords(state)}${kitWords(state)}`, 'brief'); break;
    case 'standby': H.standby = { attempt: 0, goAtMs: null, fromMs: now, backSaid: false }; armGo(state); break;
    case 'go': goNow(state, bus); break;
    case 'stop': R.hot = false; break;
    case 'wash':
      H.wash = { atMs: now };
      if (state.stop && !pendingOf(state)) leaveStop(state, bus, 'scene');
      bus?.emit('house', { phase: 'wash', room: null, who: playerId(state), atMs: now });
      chiefSays(state, bus, HOUSE_CHIEF.wash, 'wash');
      break;
    case 'end': bus?.emit('house', { phase: 'end', room: null, who: playerId(state), atMs: now, kind: H.end?.why ?? null, text: runSheetOf(state).card }); break;
    default: break;
  }
}

// (GO armed: the drawn gap from now, the command posted (R.next, so the tower's own clock leaves it alone); false when not ready)
function armGo(state) {
  const R = rangeOf(state), H = R.house, sb = H.standby, now = state.clock.ms;
  if (!sb || sb.goAtMs !== null || state.stop?.mode === 'stop' || houseWant(state) !== null) return false;
  sb.goAtMs = whole(now + standbyGapOf(state.meta.seed, sb.attempt));
  const i = SEQ_HOUSE.findIndex(c => c.id === 'go');
  post(state, { atMs: sb.goAtMs, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: 'go', i } });
  R.next = { id: 'go', i, atMs: Math.floor(sb.goAtMs / 1000) * 1000 };
  return true;
}

// (GO: the lane hot, the timer, the turners facing from GO, the clear begun, and you in stop motion)
function goNow(state, bus, { stop = true } = {}) {
  const R = rangeOf(state), H = R.house, pid = playerId(state), now = state.clock.ms;
  H.goAtMs = now; H.stallAtMs = now; H.cur = 0;
  R.hot = true; R.phase = 'lane';
  const L = legsOf(H)[0];
  L.fromMs = now;
  for (const T of R.turners) if (T.trigger.kind === 'go') { turnTo(T, now); bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'turn', face: T.face, atMs: T.turnAtMs, toMs: T.turnAtMs + TURN_MS, why: 'standby' }); }
  noteMind(state, 'clearing', { room: L.room, fromMs: now });
  bus?.emit('house', { phase: 'go', room: L.room, who: pid, atMs: now });
  if (stop && !state.stop && gunOn(state, pid)) enterStop(state, bus, { pid, via: 'house' });
}

// ---- each lived tick ----

/** The arms 'actors' layer on the house course (lived): Standby's GO armed or disarmed, the turners' triggers, the #2, the instructor's walk. */
export function houseActors(state, input, bus) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return;
  // (the session over or a fast-forward under way: the lane sits it out, the instructor walks on to his point, braking, never frozen at a walk)
  // (but through SHOW CLEAR's skip after the lane (FL22-1's house-showclear, lived ticks) your number two's admin goes on: frozen
  // there, his P-12's clear outlived the skip twoLeftMs had timed for it and a stop opened on its last tick (the v0.0.22 integration:
  // the keys recruit on 4, live, his pistol:clear held from 40.36 s to 44.10 s; F82's tail with a pause))
  if (R.end || state.skip) { if (state.skip && !R.end && H.end) twoAdminTick(state, bus, H, state.clock.ms); chiefWalk(state, R, H, state.clock.ms); return; }
  const now = state.clock.ms;
  // (your number two's tower admin, from the fill to SHOW CLEAR: his macro's sub-steps at their times)
  twoAdminTick(state, bus, H, now);
  if (R.cmd?.id === 'standby' && H.goAtMs === null) standbyTick(state, bus, R, H, now);
  // (DC3: before GO the instructor walks only for the live lane's sterile check, during the brief, on the floor, and home
  // to the booth after it, through LOAD to Standby if his walk back takes that long)
  if (H.goAtMs === null) { if (R.load === 'marking' && (R.cmd?.id === 'brief' || H.sterile?.home === 'walk')) sterileTick(state, bus, R, H, now); return; }
  triggers(state, bus, R, H, now);
  if (!H.end) {
    const a = actorOf(state, H.twoPid);
    if (a) {
      // (the rework's R2, BODY §16.8: his tween start before anything moves him this tick, his record after)
      moverStart(a);
      // (his slot through the drill's stepper, not while his rounds are going: the row is his hands, and his feet brake to a stop)
      // (nor while his own stoppage drill has his hands (twoGunDown): his feet brake where they are, his list doing his admin's)
      // (a man of yours he takes while covering you on his way in leaves his feet on his walk (the rework's R6: eng.move))
      // (his feet carried through a doorway while his hands work, never braked to rest in it (bundle.js freeBody, the rework's R8b))
      // (FL22-3, and the hunt of v0.0.20's T2: from a casualty's tick, yours or his, through the casualty's beat he is out of
      // the fight as you are: no slot run again (casualtyTick halted it), no eyes, cover or calls (twoTick), his feet braked where they
      // are, so no drill, take-in, "Clear!" or "Up." of his over a marine down (before, a Dominate started 100 ms after his own "I'm hit!"
      // and its call beat said "Clear!"))
      const outOfIt = !!H.live?.casualty;
      if (!outOfIt && (!H.two.eng || H.two.eng.move) && !(H.two.doing && !H.two.doing.beats)) runSlot(state, bus, H.two, now);
      else freeBody(state, H.two, a, now, true);
      // (a body-gap hold with nothing of his walks left to hold closed (bundle.js gapSettle: his walk ended where he stands))
      gapSettle(state, H.two, now);
      // (his eyes where his head is: perception reads the four-way face (people/perception.js eyeOf))
      if (Number.isFinite(a.headRad)) a.face = faceOfHead(a.headRad);
      const p = state.people[H.twoPid]?.post;
      if (p && (p.x !== a.x || p.z !== a.z)) { p.x = a.x; p.z = a.z; }
      if (!outOfIt) twoTick(state, bus, R, H, a, now);
      const v = Math.hypot(a.v?.[0] ?? 0, a.v?.[1] ?? 0);
      locoStep(a, a.$px, a.$pz, { state, pid: H.twoPid, gait: 'walk', stance: a.moveStance ?? 'combat', vMs: v > 0 ? v : null });
    }
    // (v0.0.19: the role-players after your number two, before the instructor's walk (the build sheet v0.0.19 §3.3's tick order):
    // what they decide acts the next tick)
    if (H.live) opforTick(state, bus, R, H, now);
  }
  chiefWalk(state, R, H, now);
}

// (the standby: GO armed while you stand ready out of the mode, disarmed if you move or enter it before; GO all the same after moveOnMs)
function standbyTick(state, bus, R, H, now) {
  const sb = H.standby;
  if (!sb) return;
  const want = houseWant(state), inMode = state.stop?.mode === 'stop';
  if (sb.goAtMs !== null) {
    if (now < sb.goAtMs && (want !== null || inMode)) {
      cancel(state, 'arms:range');
      R.next = null; sb.goAtMs = null; sb.attempt += 1;
      if (!sb.backSaid) { sb.backSaid = true; chiefSays(state, bus, HOUSE_CHIEF.back, 'back'); }
    }
    return;
  }
  if (armGo(state)) return;
  if (now - sb.fromMs >= C.moveOnMs) {
    fault(state, bus, 'slow', 'warn', hashPick(HOUSE_CHIEF.stall, 'house-chief', state.meta.seed, 'standby'));
    sb.goAtMs = whole(now + TICK_MS);
    const i = SEQ_HOUSE.findIndex(c => c.id === 'go');
    post(state, { atMs: sb.goAtMs, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: 'go', i } });
    R.next = { id: 'go', i, atMs: Math.floor(sb.goAtMs / 1000) * 1000 };
  }
}

// (the turners' triggers: a door's leaf open, the hall's zone; each turns its gap after, whole ticks)
function triggers(state, bus, R, H, now) {
  const plan = lanePlanOf(state);
  // (a door of the lane come open is progress for the stall (see stall))
  for (const door of plan.order) if (door !== 'hall' && H.doors[door] === undefined && openingState(state, door) === 'open') { H.doors[door] = now; if (H.goAtMs !== null && !H.end) H.stallAtMs = now; }
  const me = playerActor(state);
  if (me && !H.end) { const zn = zoneAt(state, me.x, me.z); if (zn && H.zones[zn] === undefined) H.zones[zn] = now; }
  for (const T of R.turners) {
    if (T.turnAtMs !== null || T.stoppedAtMs !== null || T.trigger.kind === 'go' || T.trigger.kind === 'never' || T.passed) continue;
    const at0 = T.trigger.kind === 'door' ? H.doors[T.trigger.on] : H.zones[T.trigger.on];
    if (at0 === undefined || H.end) continue;
    // (the build sheet §1 item 3: GO first: a door found open at the fill (a drawn house's) turns its man no sooner than
    // GO and his gap; on the set every door opens after GO (the setups give GO first), so nothing moves there)
    const at = Math.max(at0, H.goAtMs ?? at0);
    // (v0.0.18: a stand dazed by a burst turns when its daze ends at the soonest (burst.js; the brief's unsuited man))
    const turnAt = whole(Math.max(at + T.trigger.gapMs, T.dazeUntilMs ?? 0));
    if (now < turnAt) continue;
    turnTo(T, turnAt);
    bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'turn', face: T.face, atMs: T.turnAtMs, toMs: T.turnAtMs + TURN_MS, why: 'standby' });
  }
}

// (the instructor's walk on the catwalk, over the room you are in: the nearest point of the catwalk's line to its middle. From
// the rework's R2 (BODY §16.8: "the instructor's walk takes the same push and brake"): a trapezoid from where he stands at the
// speed he has to the point, at the place's walk (motion.js placeGaits) and his own legs (bundle.js legsOf), planned again
// when the point moves or a tick went by unwalked (H.chief, saved: { to, path, prof, fromMs, untilMs, atMs }); his tween start
// before the move, his record after)
// v0.0.22 (its build sheet's item 1, FL22-1): after the lane, while the tower's command is Stop or SHOW CLEAR, his point is the
// catwalk's nearest to the marine he inspects next (inspectNext: you, then your #2), and lookTick, after his step, keeps the look
// (R.house.show) that chiefSees reads; the rest of the time as before.
function chiefWalk(state, R, H, now = state.clock.ms) {
  const c = actorOf(state, H.chiefPid), cw = houseSpecOf(state).catwalk;
  if (!c || !cw?.path?.length) return;
  const L = curLeg(H), P = planOf(state, L);
  const insp = showing(R, H) ? inspectNext(state, H) : null, m = insp ? actorOf(state, insp) : null;
  const to = m ? nearestOn(cw.path, [m.x, m.z]) : H.end || !P ? cw.path[0] : nearestOn(cw.path, P.threshold ?? P.points[0]);
  chiefStep(state, H, c, cw, to, now);
  if (insp !== null || H.show) lookTick(state, R, H, insp, now);
}
// (his step toward the point `to` this tick (chiefWalk's walk, as before v0.0.22); v0.0.23 (the review of 2026-11-18): on the floor his
// walk is the nav's (route.js routed, `open` the doors he opens on his way), never a straight line through the booth's or a room's wall)
function chiefStep(state, H, c, cw, to, now, { floor = false, open = [] } = {}) {
  const y = cw?.y ?? 3;
  // (DC3: { floor }: a walk on the floor, the sterile check's: no lift to the catwalk, no place at its end)
  if (!floor && c.y !== y) { c.y = y; const p = state.people[H.chiefPid]?.post; if (p) p.y = y; if (c.x !== cw.path[0][0] || c.z !== cw.path[0][1]) placeTwo(state, c, cw.path[0][0], cw.path[0][1]); }
  moverStart(c);
  let W = H.chief ?? null;
  // (a tick he was not walked (a fast-forward, whose ticks the scene's layer sits out): planned again from where he stands, never run on to where the clock has gone)
  if (W && now - (W.atMs ?? W.fromMs) > TICK_MS) W = null;
  if (!W || W.to[0] !== to[0] || W.to[1] !== to[1]) {
    // (a new point mid-walk: planned from where his place is for, the tick before, so the tick goes on walking, never stands)
    const fromMs = W?.atMs ?? now;
    const d = Math.hypot(to[0] - c.x, to[1] - c.z);
    if (d < 1e-6 && !c.v) { if (W) H.chief = null; c.gait = 'idle'; return; }
    // (from where he stands, at the speed he has: never a jump, never a stop dead)
    const v0 = Math.hypot(c.v?.[0] ?? 0, c.v?.[1] ?? 0), legs = bodyLegsOf(state, H.chiefPid, c.x, c.z), line = [[c.x, c.z], [to[0], to[1]]];
    // (the code review's sixth finding: a floor walk with no way round stands where he is, never the straight line
    // through a wall or a shut leaf; sterileTick opens the doors on his way first (sterileDoors))
    const path = floor ? routed(state, line, { open }) : line;
    if (!path) { if (W) H.chief = null; delete c.v; c.gait = 'idle'; return; }
    const prof = profileOf(pathLen(path), placeGaits(state).walkMs, legs.pushMs2, legs.brakeMs2, { v0: Math.min(v0, placeGaits(state).walkMs), v1: 0 });
    W = H.chief = { to: [to[0], to[1]], path: path.map(p => [q(p[0], 1e-4), q(p[1], 1e-4)]), prof, fromMs, untilMs: fromMs + Math.round(prof.T * 1000) };
  }
  W.atMs = now;
  const p = moveAt(W, now), dx = p.x - c.x, dz = p.z - c.z;
  if (dx || dz) { c.x = p.x; c.z = p.z; const pp = state.people[c.who]?.post; if (pp) { pp.x = p.x; pp.z = p.z; } }
  if (p.vMs > 0) c.v = [q(p.vMs * Math.cos(p.headRad), 0.001), q(p.vMs * Math.sin(p.headRad), 0.001)]; else delete c.v;
  if (Math.abs(dx) > 1e-9 || Math.abs(dz) > 1e-9) c.face = Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : dz > 0 ? 'down' : 'up';
  locoStep(c, c.$px, c.$pz, { state, pid: H.chiefPid, gait: 'walk', stance: null, vMs: p.vMs > 0 ? p.vMs : null, inHand: false });
  if (p.done) H.chief = null;
}

// ---- SHOW CLEAR to the eye (its build sheet's item 1, FL22-1; COMBAT §25.10.4) ----
//
// The instructor calls a gun clear only once he has looked into it: his eye (on the catwalk, at its height: he leans over the rail)
// within SHOW_CLEAR_M 2.5 m of the marine's chest (CHEST_Y_M over his floor) for SHOW_LOOK_MS 600 ms, the marine's guns shown (yours:
// handling.js R.shown, the show's sub-step done, your P-12 holstered clear and the rifle on the sling empty, as the tower judges
// them; your #2's: his SHOW CLEAR macro over, two.js W.showOwed). Before v0.0.22 he walked to the catwalk's west end the moment the
// lane ended and said "Clear." from wherever he had got to: at "Number two, clear." 6.2 m from your #2 on every turner lane, 11 to
// 17 m on a live lane ended in room 2 or 3 (the feel lens). The look is R.house.show = { pid (the marine he walks to now,
// inspectNext's), near: { [pid]: ms his eye came within reach of that marine }, done: { [pid]: ms the look ended } }, absent until
// the lane's Stop (absent means none: no upgrade); he watches both of you from where he stands, so two marines side by side are
// looked at as each shows. A marine no point of the catwalk comes within SHOW_CLEAR_M of (deep in a room) is out of its reach
// (chiefReach): your #2 walks out under it (two.js, his walk out), and you are looked at from the catwalk's point nearest you, once
// the instructor stands there (the bots never stop out of its reach: you fall at a room's point inside 1.8 m of the hall's line;
// the fuzz's are printed by F82).
// (Stop or SHOW CLEAR after the lane: the look's time)
const showing = (R, H) => !!H?.end && !R?.end && (R.cmd?.id === 'stop' || R.cmd?.id === 'clear');
// (the eye to a marine's chest (m))
const eyeTo = (c, m) => Math.hypot(c.x - m.x, (c.y ?? 0) - (m.y ?? 0) - CHEST_Y_M, c.z - m.z);
/** Whether any point of the catwalk comes within SHOW_CLEAR_M of a marine's chest where he stands (true with no instructor or no catwalk: no gate). */
export function chiefReach(state, H, pid) {
  const cw = houseSpecOf(state).catwalk, m = actorOf(state, pid), c = actorOf(state, H?.chiefPid);
  if (!cw?.path?.length || !m || !c) return true;
  const [x, z] = nearestOn(cw.path, [m.x, m.z]);
  return eyeTo({ x, y: cw.y ?? 3, z }, m) <= SHOW_CLEAR_M;
}
// (your guns shown as the tower's SHOW CLEAR judges them (houseReady 'shown''s and lineReady's own reads): the show made (R.shown, at
// its step's end), the P-12 holstered clear, the rifle on the sling empty and no step of yours under way (a P-12's own SHOW CLEAR
// row clears its chamber in its first sub-step); until then the instructor stays with you, so every "Clear." of yours (a
// macro run again after a swing onto the sling says it again) is said under his eye)
const mePassed = (state, R) => { const pid = playerId(state); return !!R?.shown && !pistolLacks(state, pid, 'clear') && !loadedGun(state.items?.[state.people?.[pid]?.kit?.worn?.sling]) && stillOf(state); };
// (a marine's guns shown: yours as the tower judges them, your #2's macro over (his look owed) or his guns already judged)
// (DC3: the look's record by its key, 'show' (SHOW CLEAR's, H.show) or 'sterile' (the live lane's check before LOAD, H.sterile);
// nothing is shown at the sterile check, Condition 4 from the fill, so it is owed and met by the eye alone)
const lookRec = (H, key = 'show') => (key === 'sterile' ? H.sterile : H.show);
const shownBy = (state, R, H, pid, key = 'show') => key === 'sterile' || (pid === H.twoPid ? H.two?.showOwed !== undefined || !!H.two?.shown : mePassed(state, R));
// (a marine the look is owed: each of you until looked at (your #2's line may come on the tick his look is met, chiefSees' own read,
// before lookTick writes it: written then all the same))
const owedBy = (state, H, pid, key = 'show') => !!actorOf(state, pid) && lookRec(H, key)?.done?.[pid] === undefined;
/**
 * The marine the instructor walks to: at Stop and SHOW CLEAR ('show') your #2 if his guns are shown and yours are not, else you, then
 * him; at the live lane's sterile check ('sterile', v0.0.23 DC3) you, then him; null once both are looked at.
 */
export function inspectNext(state, H, key = 'show') {
  const R = rangeOf(state), pid = playerId(state), two = H.twoPid && owedBy(state, H, H.twoPid, key) ? H.twoPid : null, me = owedBy(state, H, pid, key) ? pid : null;
  if (key === 'show' && two && shownBy(state, R, H, two) && !(me && shownBy(state, R, H, me))) return two;
  return me ?? two;
}
/**
 * Whether the instructor has looked at a marine (`key` 'show', the default: his shown guns; 'sterile': the live lane's check before
 * LOAD, v0.0.23 DC3); true with no instructor, or for SHOW CLEAR no catwalk on the house (no gate), and for anyone else.
 */
export function chiefSees(state, H, pid, key = 'show') {
  if (!H || !actorOf(state, H.chiefPid) || (key === 'show' && !houseSpecOf(state).catwalk?.path?.length)) return true;
  if (pid !== playerId(state) && pid !== H.twoPid) return true;
  // (done, or met this tick: his eye in reach long enough at guns shown now, so the tower reads the look on the tick the show ends,
  // never a tick after it, when a pause would open between)
  return lookRec(H, key)?.done?.[pid] !== undefined || lookMet(state, rangeOf(state), H, pid, state.clock.ms, key);
}
// (the look met now: his eye in reach of pid SHOW_LOOK_MS or more, the guns shown)
function lookMet(state, R, H, pid, now = state.clock.ms, key = 'show') {
  const t = lookRec(H, key)?.near?.[pid];
  return Number.isFinite(t) && now - t >= SHOW_LOOK_MS && shownBy(state, R, H, pid, key);
}
// (the look advanced a tick (chiefWalk, after his step): where he walks, since when his eye is within reach of each of you, each look
// done once the guns are shown and SHOW_LOOK_MS have passed in reach; out of the catwalk's reach, from its nearest point once he
// stands there (you; your #2 only where his walk out could not be made, two.js W.out.none))
// v0.0.23 (DC3): keyed 'sterile', the live lane's check on the floor: one marine at a time (the one he walks to), once he stands at his
// point in front of him (his walk over: no H.chief), his eye within SHOW_CLEAR_M, nothing shown; the record H.sterile (sterileTick)
function lookTick(state, R, H, insp, now, key = 'show') {
  const sterile = key === 'sterile';
  if (!sterile && !showing(R, H)) return;
  const S = sterile ? (H.sterile ??= { pid: null, near: {}, done: {} }) : (H.show ??= { pid: null, near: {}, done: {} }), c = actorOf(state, H.chiefPid);
  S.pid = insp;
  if (!c) return;
  for (const pid of [playerId(state), H.twoPid]) {
    const m = pid ? actorOf(state, pid) : null;
    if (!m || !owedBy(state, H, pid, key)) continue;
    const two = pid === H.twoPid;
    const near = sterile ? insp === pid && !H.chief && eyeTo(c, m) <= SHOW_CLEAR_M : chiefReach(state, H, pid) ? eyeTo(c, m) <= SHOW_CLEAR_M : insp === pid && !H.chief && (!two || !!H.two?.out?.none);
    if (!near) { delete S.near[pid]; continue; }
    S.near[pid] ??= now;
    if (lookMet(state, R, H, pid, now, key)) S.done[pid] = now;
  }
}
/** The sterile check's stand-off: the instructor stops this far in front of the marine he checks (m; v0.0.23 DC3, my call: inside SHOW_CLEAR_M from the floor, a body's gap off him). */
export const STERILE_STAND_M = 0.8;
/** The marine moved this far from where the stand-off was taken: the instructor's point taken again (m; my call). */
const STERILE_REPLAN_M = 0.3;
/** Within this of his booth post (m) he is home: the booth's door shut behind him (the review of 2026-11-18; my call). */
const STERILE_HOME_M = 0.05;
// (the booth's door: its turning leaf between the booth and the apron, found by the booth's room, the set's or a drawn house's)
const boothDoorOf = (state, B) => (B?.room ? (areaOf(state.places?.live?.area)?.openings ?? []).find(o => leafTurns(o) && (o.rooms ?? []).includes(B.room)) ?? null : null);
/**
 * The live lane's sterile check (its build sheet item 17, DC3; COMBAT §25.10): once the brief's PA chain is said (the tower's
 * brief and the instructor's line beside you, R.paUntilMs), the instructor walks on the floor (chiefStep's { floor }) to STERILE_STAND_M
 * in front of you, looks (SHOW_LOOK_MS with his eye within SHOW_CLEAR_M), says "Clean. Next.", then the same at your #2, "Clean.";
 * houseReady's brief gate lets LOAD come after both. H.sterile { pid, near, done, to, base, who } (additive: absent until it begins; `to`
 * his point, `base` where its marine `who` stood when it was taken). Before v0.0.23 the live lane was briefed and loaded as the frangible lane,
 * the instructor standing 3.4 m off until GO (the doctrine lens: a live lane begins with the safety's look at every man's kit).
 * The review of 2026-11-18: his walk was a straight line from his post in the booth, through the booth's wall into the hall on every
 * live lane (and through room walls when you moved), and after the looks he stood in the open hall until GO lifted him 28 m to the
 * catwalk in plain sight. Now his floor walk is routed (chiefStep's `open`: out of the booth by its door, which he opens as he sets
 * out (toggleDoor, the bus's 'door'), round by the apron and the hall's east doorway), and once both looks are done he walks home to
 * his post in the booth (`home` 'walk', through LOAD and on to Standby if it takes that long) and shuts its door behind him ('in'), so
 * GO lifts him from the shut booth, out of view, as before DC3. H.sterile gains `home` (additive).
 */
function sterileTick(state, bus, R, H, now) {
  if (!H.sterile && now < (R.paUntilMs ?? 0)) return;
  const S = (H.sterile ??= { pid: null, near: {}, done: {} }), c = actorOf(state, H.chiefPid);
  if (!c) return;
  const insp = inspectNext(state, H, 'sterile'), m = insp ? actorOf(state, insp) : null;
  // (the fixer of v0.0.24's play review, H2: where his legs have nothing to push on (0 G with no boots: &env=ship-coast, motion.js
  // legsAt's push min(μ g, …) 0) his walk to you never began and the live lane stood at the brief for good, nothing said; there he
  // checks each of you by eye from where he stands, one a tick, and stays at his post, so LOAD follows as on any floor)
  if (!H.chief && !(bodyLegsOf(state, H.chiefPid, c.x, c.z).pushMs2 > 0)) {
    if (insp) { S.done[insp] = now; S.pid = insp; chiefSays(state, bus, inspectNext(state, H, 'sterile') ? HOUSE_CHIEF.sterile[1] : HOUSE_CHIEF.sterile[0]); }
    else if (!S.home) S.home = 'in';
    return;
  }
  const B = houseSpecOf(state).booth, door = boothDoorOf(state, B);
  if (m && (!S.to || S.who !== insp || Math.hypot(m.x - S.base[0], m.z - S.base[1]) > STERILE_REPLAN_M)) {
    const dx = c.x - m.x, dz = c.z - m.z, d = Math.hypot(dx, dz);
    S.to = d > STERILE_STAND_M ? [q(m.x + dx / d * STERILE_STAND_M, 0.01), q(m.z + dz / d * STERILE_STAND_M, 0.01)] : [q(c.x, 0.01), q(c.z, 0.01)];
    S.base = [m.x, m.z]; S.who = insp;
  }
  // (both looked at: home to his post in the booth)
  if (!insp && S.to && B && !S.home) { S.home = 'walk'; S.to = [B.x, B.z]; S.who = null; }
  // (the booth's door open while he is out of it or on his way home; shut behind him once he stands at his post)
  if (door && S.to && S.home !== 'in' && openingState(state, door) !== 'open') toggleDoor(state, door.id, bus, { who: H.chiefPid, to: 'open' });
  const open = [...(door ? [door.id] : []), ...(S.opened ?? [])];
  // (the code review's sixth finding: you behind a room's shut door before LOAD, his walk had no way round and went
  // straight through the leaf; now a walk about to be planned that has none with the booth's door open opens the doors on the way
  // he would take with every door open, as he sets out (S.opened, additive), and with none even so he stands where he is)
  if (S.to && (m || H.chief || S.home === 'walk') && (!H.chief || H.chief.to[0] !== S.to[0] || H.chief.to[1] !== S.to[1])) {
    for (const id of sterileDoors(state, [[c.x, c.z], S.to], open)) {
      if (openingState(state, id) !== 'open') toggleDoor(state, id, bus, { who: H.chiefPid, to: 'open' });
      (S.opened ??= []).push(id); open.push(id);
    }
  }
  if (S.to && (m || H.chief || S.home === 'walk')) chiefStep(state, H, c, houseSpecOf(state).catwalk, S.to, now, { floor: true, open });
  if (S.home === 'walk' && !H.chief && Math.hypot(c.x - B.x, c.z - B.z) <= STERILE_HOME_M) {
    S.home = 'in';
    if (door && openingState(state, door) !== 'closed') toggleDoor(state, door.id, bus, { who: H.chiefPid, to: 'closed' });
  }
  const before = Object.keys(S.done).length;
  lookTick(state, R, H, insp, now, 'sterile');
  if (Object.keys(S.done).length > before) chiefSays(state, bus, inspectNext(state, H, 'sterile') ? HOUSE_CHIEF.sterile[1] : HOUSE_CHIEF.sterile[0]);
}
/**
 * The doors the instructor's floor walk from line[0] to line[1] must open: the turning leaves the nav's way
 * crosses (its path through a leaf's doorway, by the opening's plane between a and b) not in `open` and not swung open. route.js
 * routed solves a way blocked by a shut leaf on the all-open grid, so with you behind room 1's shut door his way went through its
 * leaf (3 ticks inside it on 48213, live:fight,hide): he now opens it as he sets out, as he opens the booth's.
 */
function sterileDoors(state, line, open) {
  const path = routed(state, line, { open });
  if (!path) return [];
  const leaves = (areaOf(state.places?.live?.area)?.openings ?? []).filter(o => leafTurns(o) && leafAt(state, o.id) < 1);
  const crossed = (o) => {
    for (let i = 1; i < path.length; i++) {
      const [ax, az] = path[i - 1], [bx, bz] = path[i], [u0, u1, w0, w1] = o.axis === 'x' ? [az, bz, ax, bx] : [ax, bx, az, bz];
      if ((u0 - o.at) * (u1 - o.at) > 0 || u0 === u1) continue;
      const w = w0 + (w1 - w0) * (o.at - u0) / (u1 - u0);
      if (w >= o.a && w <= o.b) return true;
    }
    return false;
  };
  return leaves.filter(o => !open.includes(o.id) && crossed(o)).map(o => o.id);
}
// (the point of a polyline nearest to p)
function nearestOn(path, p) {
  if (path.length === 1) return path[0];
  let best = path[0], bd = Infinity;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz;
    const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / l2)) : 0;
    const x = q(a[0] + vx * t, 0.01), z = q(a[1] + vz * t, 0.01), d = Math.hypot(p[0] - x, p[1] - z);
    if (d < bd) { bd = d; best = [x, z]; }
  }
  return best;
}

// ---- the rules ----

/** The arms 'rules' layer on the house course, in place of handling.js rangeRules (each tick lived; see the header). */
export function houseRules(state, input, bus, ctx = null) {
  const R = rangeOf(state), H = R?.house;
  if (!H || R.end || state.skip || isHeld(state)) return;
  const now = state.clock.ms, pid = playerId(state), me = playerActor(state);
  if (!me) return;
  // (the debrief's trace (traceTick): the tick's places after houseActors moved everyone, before a rule's early return)
  traceTick(state, R, H, now);
  // (the safety stop: an aim at the #2 or the instructor, held or being brought on)
  const S = state.stop, aimKey = S?.aim?.key ?? (S?.doing?.list?.[S.doing.i] === 'aim' ? S.doing.aimKey ?? null : null);
  if (aimKey) {
    const two = actorOf(state, H.twoPid), chief = actorOf(state, H.chiefPid);
    if ((two && aimKey === two.id) || (chief && aimKey === chief.id)) { stopRange(state, bus, 'person', hashPick(HOUSE_CHIEF.stop, 'house-chief', state.meta.seed, 'stop')); return; }
  }
  sayOwed(state, bus, H);
  // (v0.0.18: every device whose fuse or count has run bursts now (burst.js), before the stands' turns read their daze)
  // (the bursts' marks once each, those of a drill's beat (bundle.js) with them: H.burstsSeen counts the record's done)
  tickDevices(state, bus, now);
  while ((H.burstsSeen ?? 0) < (H.bursts?.length ?? 0)) { kitMarks(state, bus, H, H.bursts[H.burstsSeen ?? 0]); H.burstsSeen = (H.burstsSeen ?? 0) + 1; }
  // (v0.0.19, D2: the instructor's reads of the practice bursts (house-kit.js), the cease fire of the stack in one)
  if (readsTick(state, bus, R, H, now) === 'burst' && H.goAtMs !== null && !H.end) { laneEnd(state, bus, 'burst'); return; }
  // (FL22-1: SHOW CLEAR's skip begun on the tick your guns pass, not at the tower's next whole second (houseSecond's): a
  // second lived for nothing before the brief splash)
  if (H.end && R.cmd?.id === 'clear') showClearSecond(state, bus, ctx, R, H);
  if (H.goAtMs === null || H.end) return;
  // (the would-have bodies judged again by their blood (would.js wouldTick: a wound that bleeds a man into shock puts him down
  // at that tick, the hunt of v0.0.20's bleed-shock): a role-player sits down where he stands, you or your number two the casualty)
  if (H.live && !H.live.casualty) for (const who of wouldTick(state, now)) { const T = R.turners.find(t => t.live?.who === who); if (T) opforBled(state, bus, T, now); }
  // (v0.0.19: a casualty's beat runs alone to the lane's end, nothing else judged meanwhile (see casualtyTick))
  if (H.live && casualtyTick(state, bus, R, H, now)) return;
  if (now - H.goAtMs >= LANE_MAX_MS) { laneEnd(state, bus, 'time'); return; }
  if (now % 1000 === 0 && roundsLeft(state) === 0 && R.stoppage?.cleared !== false) { laneEnd(state, bus, 'dry'); return; }
  noteContacts(state, H, now);
  pars(state, bus, R, H, now);
  const L = curLeg(H), P = planOf(state, L);
  if (!L || !P) return;
  const two = actorOf(state, H.twoPid);
  // (v0.0.18: a breaching tool still in the hands once its door is open, its force not running (a failed pry and the door then
  // opened another way): let go at your feet, the rifle up, as the force's own end does (never a lane carried with a bar in hand))
  const tool = handDeviceOf(state, pid);
  if (tool?.kind === 'tool' && L.door !== 'hall' && openingState(state, L.door) === 'open' && !S?.doing?.beats?.some(b => b.k === 'force' && b.st === 'run')) dropTool(state, pid, tool, me);
  // (the leg's progress: stacked, open, entered)
  if (L.state === 'ahead' && P.stack?.[0] && dist([me.x, me.z], P.stack[0]) <= STACK_M) progress(state, bus, H, L, 'stacked', now);
  if ((L.state === 'ahead' || L.state === 'stacked') && (L.door === 'hall' || H.doors[L.door] !== undefined)) progress(state, bus, H, L, 'open', now);
  if (L.state !== 'entered' && L.state !== 'clear' && pastThreshold(P, me.x, me.z)) { if (L.state === 'ahead' || L.state === 'stacked') L.openAtMs ??= now; progress(state, bus, H, L, 'entered', now); bangToEntry(state, bus, H, L, now); }
  // (the doorway)
  const was = H.meAt ?? null, at = [q(me.x, 1e-4), q(me.z, 1e-4)], vMs = was ? dist(was, at) / (TICK_MS / 1000) : 0;
  H.meAt = at;
  // (a startle's freeze in the door is its own cost, never the doorway's fault: the fault's clock stands while it lasts (the
  // reach review of 2026-11-13))
  const frozen = startled(state, me.who, now);
  if (L.door !== 'hall' && inFunnel(P, me.x, me.z) && vMs < FUNNEL_STILL_MS) {
    if (!frozen) { L.funnelMs += TICK_MS; L.funnelRunMs += TICK_MS; }
    if (L.funnelRunMs >= FUNNEL_FAULT_MS && !hasFault(L, 'funnel')) houseFault(state, bus, 'funnel', HOUSE_CHIEF.funnel, L);
  } else L.funnelRunMs = 0;
  // (the corners: yours and the #2's, each covered once)
  if (L.state === 'entered') {
    for (const [a, by] of [[me, 'me'], [two, 'two']]) {
      if (!a) continue;
      for (const h of coveredNow(state, P, a, now)) if (!L.covered[h]) { L.covered[h] = { atMs: now, by }; H.stallAtMs = now; }
    }
    if ((me.moveStance ?? 'relaxed') === 'relaxed' && !hasFault(L, 'relaxed')) houseFault(state, bus, 'relaxed', HOUSE_CHIEF.relaxed, L);
  }
  // (the flag: the muzzle's line over the #2, in hand, not at high or low ready, FLAG_MS at once while he stands (the #2 walking
  // across a muzzle held still is his crossing, not your sweep: my call))
  const twoAt = two ? [q(two.x, 0.01), q(two.z, 0.01)] : null, twoStill = !!twoAt && H.two.at?.[0] === twoAt[0] && H.two.at?.[1] === twoAt[1];
  if (twoAt) H.two.at = twoAt;
  if (two && twoStill && flagged(state, pid, two)) { L.flagMs = (L.flagMs ?? 0) + TICK_MS; if (L.flagMs >= FLAG_MS && !hasFault(L, 'muzzle')) houseFault(state, bus, 'muzzle', HOUSE_CHIEF.muzzle, L); }
  else if (L.flagMs) L.flagMs = 0;
  // (a beat doing's "Clear!" (see houseInput); a step under way is no progress by itself (see stall))
  callsOf(state, bus, H, S?.doing);
  stall(state, bus, R, H, L, now);
  // (v0.0.19: the live men as the team perceives them: seen, covered, a cleared room reopened (see liveTick))
  if (H.live && !H.end) liveTick(state, bus, R, H, now);
  // (the walks held by a body, your limit of advance, your #2 on your heels (combat/two.js maskTick))
  if (!H.end) maskTick(state, bus, H, now);
}

// (a tool let go at a person's feet, the rifle back up (houseRules))
function dropTool(state, pid, tool, a) {
  move(state, tool.id, { ground: { area: state.places.live.area, x: a.x, z: a.z } });
  delete state.items[tool.id].st;
  const k = state.people[pid].kit;
  if (k?.carry && SLUNG.has(k.carry.posture)) k.carry.posture = 'highReady';
}
// (v0.0.18, the kit's marks on the paper (COMBAT §25.20): a charge's peak on the stack past BREACH_SAFE_KPA "STACK IN THE BLAST 31
// KPA" (a fault), a grenade slipped at your feet "BANG AT YOUR FEET" (a fault: my call, the lane goes on), the door blown, the
// stands of the room dazed "1A STUNNED 2.10 S" (neutral); on the leg the burst's room is)
function kitMarks(state, bus, H, B) {
  const door = B.door ?? B.thrown ?? null, L = (door ? legsOf(H).find(x => x.door === door) : null) ?? legsOf(H).find(x => x.room === B.room) ?? curLeg(H);
  if (!L) return;
  // (the burst on the room ahead is the entry's cue, as a leg's start is (endLeg): the muzzle's vigilance runs from it (react.js
  // VIGIL_MS; my call: a charge's place, walk back and count took the corporal past the leg's own 30 s, and room 3's man by the
  // far leg was taken in 'area', ×1.5, on every seed)
  const R = rangeOf(state);
  if (L === curLeg(H)) R.cueAtMs = Math.max(R.cueAtMs ?? -Infinity, B.atMs);
  const marks = (L.kit ??= []), stack = [playerId(state), H.twoPid].filter(Boolean);
  if (B.door) {
    marks.push('DOOR BLOWN');
    const worst = Math.max(0, ...stack.map(p => B.kPa[p] ?? 0));
    if (worst > BREACH_SAFE_KPA) { marks.push(`STACK IN THE BLAST ${Math.round(worst)} KPA`); houseFault(state, bus, 'blast', 'Too close! You were in the blast.', L); }
  }
  // (the hunt of v0.0.18: a thrown grenade's burst on the stack past BREACH_SAFE_KPA is the charge's fault too, one quantity,
  // one fault (a practice grenade's read says its own, house-kit.js; a slip at your feet its own below): the boot recruit's G-11, short
  // at the door's foot, put 29.8 kPa on him and stunned him 2.4 s, and the card said nothing)
  else if (!B.read && !B.atFeet) {
    const worst = Math.max(0, ...stack.map(p => B.kPa?.[p] ?? 0));
    if (worst > BREACH_SAFE_KPA) { marks.push(`STACK IN THE BLAST ${Math.round(worst)} KPA`); houseFault(state, bus, 'blast', HOUSE_CHIEF.stackBlast, L); }
    // (the review of the hunt fixes: under that line but at burst.js's stun, STUN_KPA 20, the stack is stunned U(2, 6) s all the same:
    // a neutral mark, "STACK STUNNED 24 KPA", so the paper says it (the recruit's seeds 1074 at 26.8 kPa and 1148 at 21.8 said
    // nothing). Not a fault (my call): the SC-1 at its safe point puts 27.1 kPa on the stack by design and is not marked either)
    else if (worst >= STUN_KPA) marks.push(`STACK STUNNED ${Math.round(worst)} KPA`);
  }
  if (B.atFeet) { marks.push('BANG AT YOUR FEET'); houseFault(state, bus, 'feet', 'Grenade! At your feet.', L); }
  for (const [key, d] of Object.entries(B.daze ?? {})) {
    const T = rangeOf(state).turners.find(t => t.key === key);
    if (T && T.room === L.room) marks.push(`${String(T.stand).toUpperCase()} ${d.kind === 'blind' ? 'BLINDED' : d.kind === 'stunned' ? 'STUNNED' : 'STARTLED'} ${s2(d.ms)} S`);
  }
}
// (v0.0.18: the entry on the bang (COMBAT §25.18.2): #1 past the threshold within BANG_LATE_MS of the flash thrown through this
// leg's door, "ON THE BANG 1.20 S", else "BANG TO ENTRY 2.40 S" (a fault: "you gave them back the bang"); only that leg's own
// throw, not one slipped at your feet (the review of 2026-11-16: any flash in the leg's room counted, of any age, and a throw
// for room 1 that burst in the hall fined the hall's leg 63.48 s))
function bangToEntry(state, bus, H, L, now) {
  const B = L.door ? (H.bursts ?? []).filter(b => b.thrown === L.door && !b.atFeet && DEVICES[b.model]?.flash && b.atMs <= now).at(-1) : null;
  if (!B) return;
  const dt = now - B.atMs;
  L.bangMs = dt;
  if (dt > BANG_LATE_MS) { (L.kit ??= []).push(`BANG TO ENTRY ${s2(dt)} S`); houseFault(state, bus, 'bang', `${s2(dt)} seconds from the bang. You gave them back the bang.`, L); }
  else (L.kit ??= []).push(`ON THE BANG ${s2(dt)} S`);
}

// ---- the live men (v0.0.19, "Stack and clear, live"; COMBAT §25.18; the build sheet v0.0.19 §1 L-house) ----
//
// The role-players' brain is opfor.js's and what is seen of a man is men.js's; the house keeps the team's side of them each
// lived tick (liveTick, after the leg's own rules): who of the team has seen each man (H.live.seenBy, his last place seen
// H.live.lastAt, so the instinct's "Find him" looks where he was, never where he is), the cover on a man down or with his hands up
// (men.js coverTick: a marine's muzzle in hand within react.js SECTOR_HALF_DEG of him with a clear line, held COVER_MS; men.js accountedOf
// and gateWhy read it), your number two's own cover of such a man when he is on nobody, not covering you, and can see him (his
// head onto him, "Got him.", H.two.got: covered at his word), and a man of a cleared leg seen up again (the fault 'reopened', "Room 3's not clear!", H.live.reopened: the gate waits on him, and the hall's
// "Clear!" never ends the lane while he is up). The casualty (casualtyTick): a strike on you or your number two the one rule rates
// fatal (combat/would.js fatalOf; v0.0.20) halts every bundle, "I'm hit!" (and "Man down!" from the other), CASUALTY_MS, the
// instructor's "Cease fire!", and the lane's end 'casualty' with its card. None of it runs with opfor none (H.live absent).

// (a man down or with his hands up, covered or not (men.js accountedOf, gateWhy: the one reader of his state), else null)
const downOrHands = (state, T, ms) => { const a = accountedOf(state, T, ms); if (a === 'down' || a === 'hands') return a; const g = gateWhy(state, T, ms); return g === 'down' || g === 'hands' ? g : null; };
// (such a man and nobody covering him: the gate's reason on him)
const uncovered = (state, T, ms) => { const g = gateWhy(state, T, ms); return g === 'down' || g === 'hands'; };
// (the room's word with its capital: "Room 3", "The hall")
const capWord = (w) => w.charAt(0).toUpperCase() + w.slice(1);

// (the team's side of the live men each lived tick (see the section's head); your number two's memory of a man (H.two.seenAt, men.js remember and stale): out of his sight MAN_MEMORY_MS and not his man
// now, he is forgotten for the take-in (his known dropped), so a man who comes back is a fresh sighting. Exported for the tests.)
export function liveTick(state, bus, R, H, now) {
  const LV = H.live, pid = playerId(state), me = playerActor(state), two = actorOf(state, H.twoPid), W = H.two;
  // (paint on you or your number two short of the casualty: the instructor's "Paint, chest. Keep working." (men.js incoming writes the
  // strike and says nothing; LV.said.paint counts the strikes read). v0.0.22 (its build sheet's item 2, FL22-2): held until a man's
  // strikes have landed, as an umpire calls a burst once it is over: a strike opens LV.paintDue = { atMs, n, part, stopped, who, i }
  // (absent by default), another on the same marine within PAINT_CALL_MS adds to it, and at atMs + PAINT_CALL_MS one line is said,
  // "Paint, chest. Keep working." for one, "Paint, chest, twice. Keep working." for more, the panel's words where the soft panel
  // stopped every one; none where the casualty opened meanwhile (this runs only short of it: houseRules), "I'm hit!" and the cease
  // fire saying it. Until v0.0.22 each strike was said on its tick, and on 52 of 56 casualty lanes the fatal strike landed 0.35 s
  // (median) after "Keep working." (the feel lens). A strike on the other marine inside the window calls the first at once.
  // And while the man who struck still has rounds to fire at that marine (his engagement, opfor.js plan's L.eng, its rounds not all
  // fired), the call waits, to PAINT_CALL_MS after his last round: `by` his stand's key, `held` once it waited (a strike on the same
  // marine then joins it whenever it lands), `lastMs` his last round's time (the B and C review of 2026-11-16: the fuzz private on 7
  // live heard "You took paint, chest. Keep working." 1,950 ms before the cease fire, the man's next pair, planned on the tick after
  // his strike, fatal 850 ms after it; the fields additive, absent on a call that never waited)
  const struck = LV.struck ?? [], said = (LV.said ??= {});
  for (let i = said.paint ?? 0; i < struck.length; i++) {
    const x = struck[i], w = LV.would?.log?.find(e => e.shotId === x.shotId && e.on === x.who), at = Number.isFinite(x.atMs) ? x.atMs : now, D = LV.paintDue;
    // (the part as the would-have has it (its `where`: "right arm", "belly"), the zone's where it has none (the review of v0.0.20's
    // asks: an arm's wound was said "Paint, chest."); a call's parts each named once, "chest and left arm")
    // (the hunt of v0.0.20's T3: a strike on your number two is said as his, in paintCall, through paintSays)
    const part = w?.where ?? (x.part === 'head' || x.zone === 'head' ? 'head' : 'chest');
    if (D && D.who === x.who && (at - D.atMs <= PAINT_CALL_MS || D.held)) { D.n += 1; if (w?.why !== 'stopped') D.stopped = false; if (!D.part.split(' and ').includes(part)) D.part = `${D.part} and ${part}`; continue; }
    if (D) paintCall(state, bus, LV);
    LV.paintDue = { atMs: at, n: 1, part, stopped: w?.why === 'stopped', who: x.who ?? null, i, ...(x.by ? { by: x.by } : {}) };
  }
  said.paint = struck.length;
  const D = LV.paintDue;
  if (D && now >= D.atMs + PAINT_CALL_MS) {
    const left = paintRoundsLeft(R, D);
    if (left) { D.held = true; D.lastMs = Math.max(D.lastMs ?? D.atMs, left); }
    else if (now >= (D.lastMs ?? D.atMs) + PAINT_CALL_MS) paintCall(state, bus, LV);
  }
  // (a shot row of yours on a role-player who is down (or ruled out) cut at its sub-step's end: you see your man fall, by your round
  // or your number two's, and no round goes after it (a stand's turn away does this for the paper; a man sits there, facing))
  const d = state.stop?.doing, Td = d && !d.beats && d.kind === 'shot' && d.target ? R.turners.find(x => x.key === d.target) : null;
  if (isLive(Td) && Td.stoppedAtMs !== null && Td.stoppedAtMs <= now) d.cut = true;
  // (a man who gave up (opfor.js gaveAtMs, his hands coming up): a row of yours on him cut at its sub-step's end, and your number
  // two's rounds on him not yet fired dropped, once the shooter sees him and his react.js goMs has passed since the give: you
  // see the hands come up and fire no more (a round already on its way still goes); v0.0.19's review: your #2 fired on a man
  // up to 1,050 ms after his hands came up, on 12 of 12 raider lanes)
  const gaveSeen = (T, who, body) => isLive(T) && T.stoppedAtMs === null && Number.isFinite(T.live.gaveAtMs) && !!body && now >= T.live.gaveAtMs + goMs(skillsOf(state, who).wf) && seenK(state, body, T, now) >= SEEN;
  if (Td && gaveSeen(Td, pid, me)) {
    d.cut = true;
    // (what cut the row is what you saw, so your identification of him is his hands from here (contact.js
    // identify: a failed look never takes away what one saw). Before it a failed look at the re-take after his give left him
    // 'unseen', the DI said "Rifle. Pair." on him at every stop and each pair was cut at its press: the sergeant on 48213's
    // give,give lane pressed it to room 2's stall, 101.6 s (F8, F14, F15 of the live lanes, once the merge's timings moved the dice))
    const L = contactOf(state)?.last;
    if (L?.ids?.includes(Td.key) && L.ident && L.ident[Td.key] !== Td.holds) L.ident[Td.key] = Td.holds ?? 'hands';
  }
  const Te = W?.eng ? R.turners.find(x => x.key === W.eng.key) : null;
  if (Te && gaveSeen(Te, H.twoPid, two)) twoCease(state, H);
  for (const T of R.turners) {
    if (!isLive(T)) continue;
    if (accountedOf(state, T, now) === 'out') continue;
    const seenMe = !!me && seenK(state, me, T, now) >= SEEN, seenTwo = !!two && seenK(state, two, T, now) >= SEEN;
    if (W && two) {
      if (seenTwo) remember((W.seenAt ??= {}), T.key, now);
      else if (W.known?.[T.key] !== undefined && W.seenAt?.[T.key] !== undefined && stale(W.seenAt, T.key, now) && W.contact?.key !== T.key && W.eng?.key !== T.key && W.down?.key !== T.key) delete W.known[T.key];
    }
    if (seenMe || seenTwo) {
      if ((LV.seenBy ??= {})[T.key] === undefined) LV.seenBy[T.key] = now;
      const at = [q(T.x, 0.01), q(T.z, 0.01)], was = (LV.lastAt ??= {})[T.key];
      if (!was || was[0] !== at[0] || was[1] !== at[1]) LV.lastAt[T.key] = at;
    }
    // (the cover on every man kept each tick (men.js coverTick: you, or your number two's muzzle); a man down or with his hands up
    // and nobody on him, your number two takes him by himself when he is on nobody, not covering your rifle down, and can see him,
    // or, his own drill at rest (nothing of his moving), could see him by turning his head (men.js bodySeen, the eye's cone opened:
    // a clear line from where he stands): his head onto him and "Got him." once, which covers him (H.two.got, men.js accountedOf))
    coverTick(state, T, now);
    if (downOrHands(state, T, now)) {
      const free = W && two && !W.eng && !W.contact && !W.down && !W.cover && W.got?.[T.key] === undefined;
      const atRest = free && !W.doing?.beats?.some(b => b.st === 'run' && (b.k === 'move' || b.ch === 'feet'));
      const canSee = seenTwo || (atRest && legOf(T) <= H.cur && bodySeen(state, two, T.x, T.z, now, { drawn: true }) >= SEEN);
      if (uncovered(state, T, now) && free && canSee) {
        two.headRad = q(Math.atan2(T.z - two.z, T.x - two.x), 1e-6); two.face = faceOfHead(two.headRad);
        (W.got ??= {})[T.key] = now;
        sayOn(state, bus, { who: W.pid, text: hashPick(C.opfor.got, 'house-two', state.meta.seed, 'got', T.key), kind: 'speech' });
      }
      // (his head kept on the man he has, while he is on nobody else)
      if (W?.got?.[T.key] !== undefined && two && !W.eng && !W.contact && !W.down && !W.cover) { two.headRad = q(Math.atan2(T.z - two.z, T.x - two.x), 1e-6); two.face = faceOfHead(two.headRad); }
    }
    // (a man of a leg already over, up, a threat, seen again by either of you: the room reopened, once a man)
    const k = legOf(T);
    if (k < H.cur && T.face !== 'noshoot' && (seenMe || seenTwo) && upNow(T, now) && (LV.reopened ??= {})[T.key] === undefined) {
      LV.reopened[T.key] = now;
      const words = fill(hashPick(HOUSE_CHIEF.reopened, 'house-chief', state.meta.seed, 'reopened', T.key), { Room: capWord(LEG_SAID[k] ?? 'the room') });
      houseFault(state, bus, 'reopened', words, curLeg(H));
    }
  }
}

// (the last of the rounds the man who struck (D.by, his stand's key) has still to fire at the marine struck (D.who), in ms, or 0
// when he has none left: his engagement's rounds (opfor.js plan: L.eng = { key: 'p:<who>', rounds }) not yet fired)
function paintRoundsLeft(R, D) {
  if (!D.by) return 0;
  const E = R.turners.find(T => T.key === D.by)?.live?.eng;
  if (!E || E.key?.slice(2) !== D.who) return 0;
  return E.rounds.reduce((m, r) => (r.done ? m : Math.max(m, r.atMs)), 0);
}
// (the held paint said (liveTick): one line for the man's strikes on one marine, the pick keyed by the first strike's place in the
// list as v0.0.21 keyed each; the due cleared)
function paintCall(state, bus, LV) {
  const D = LV.paintDue;
  delete LV.paintDue;
  if (!D || LV.casualty) return;
  // (a strike the soft panel stopped is said so ("Your panel took it."), when every strike of the call was; a strike on your number
  // two in his words (the hunt of v0.0.20's T3: HOUSE_CHIEF.paintTwo, never "You took paint"); said through paintSays, so a call
  // owed through a take-in is dropped once the casualty opens or the lane ends (the v0.0.22 integration, the hunt's fix over C's call))
  const H = houseOf(state), his = !!H && D.who === H.twoPid && D.who !== playerId(state), twice = D.n > 1 && !D.part.includes(' and ');
  const lines = D.stopped ? (his ? HOUSE_CHIEF.paintStoppedTwo : HOUSE_CHIEF.paintStopped) : twice ? (his ? HOUSE_CHIEF.paintTwiceTwo : HOUSE_CHIEF.paintTwice) : his ? HOUSE_CHIEF.paintTwo : HOUSE_CHIEF.paint;
  paintSays(state, bus, fill(hashPick(lines, 'house-chief', state.meta.seed, 'paint', D.i), { part: D.part }));
}

/**
 * The live men's reason the room is not clear for a call on leg k (clearGateOf's, after the window's and your number two's): a
 * man of the leg (or of a room reopened) down and not covered ('down'), with his hands up and not covered ('hands'), or seen by the
 * team, not down, out or with his hands up, and in nobody's sight now ('unaccounted': "he went behind the bend"); else null.
 */
export function liveGateOf(state, H, k, ms = state.clock.ms) {
  const LV = H?.live, R = rangeOf(state);
  if (!LV) return null;
  for (const T of R.turners) {
    if (!isLive(T) || (legOf(T) !== k && LV.reopened?.[T.key] === undefined)) continue;
    const why = gateWhy(state, T, ms);
    if (why) return why;
  }
  return null;
}

// (your number two's row dropped where it stands, its rounds not yet fired cut: his rifle on safe at high ready, as at a row's
// end (combat/two.js twoStandDown's), so the tower's Stop finds him as after any row)
function twoCease(state, H) {
  const W = H.two;
  W.eng = null; W.contact = null;
  const gun = state.items?.[gunOn(state, H.twoPid)], carry = state.people[H.twoPid]?.kit?.carry;
  if (gun) gun.mode = 'safe';
  if (carry) carry.posture = 'highReady';
}

// (the casualty (see the section's head): true while its beat runs, the rest of the rules sitting it out; the lane's end at its close)
function casualtyTick(state, bus, R, H, now) {
  const LV = H.live, pid = playerId(state);
  let K = LV.casualty ?? null;
  if (!K) {
    // (the first of you whose strike the one rule rated fatal (would.js fatalOf; men.js incoming opens it on its tick, this the net))
    const who = [pid, H.twoPid].filter(Boolean).find(p => fatalOf(state, p));
    if (!who) return false;
    // (a wound that put him down later (would.js wouldTick, f.downAtMs): the casualty from that tick, `late`, never from the strike's)
    const f = fatalOf(state, who), last = struckOn(state, who).list.find(x => x.shotId === f.shotId) ?? struckOn(state, who).list.at(-1);
    const late = Number.isFinite(f.downAtMs);
    K = LV.casualty = { who, by: last?.by ?? null, atMs: late ? f.downAtMs : last?.atMs ?? now, endAtMs: null, why: f.why, shotId: f.shotId, ...(late ? { late: true } : {}) };
  }
  K.endAtMs ??= whole(K.atMs + CASUALTY_MS);
  if (!Number.isFinite(K.endAtMs)) K.endAtMs = whole(K.atMs + CASUALTY_MS);
  if ((LV.said ??= {}).casualty === undefined) {
    LV.said.casualty = now;
    // (every bundle and flow halts with it: COMBAT §25.8.2's hand-back, stepper.js HALTS' 'casualty')
    if (state.stop?.doing?.beats || state.stop?.flow) handBack(state, bus, 'casualty');
    if (H.two?.doing?.beats) haltDoing(state, bus, H.two.doing, 'casualty', null, now);

    // (a man hit says so; a wound that bled him down later is the instructor's ruling, his "I'm hit!" said at the strike's paint)
    if (K.late) chiefSays(state, bus, K.who === pid ? HOUSE_CHIEF.bled : HOUSE_CHIEF.twoBled, 'bled');
    else sayOn(state, bus, { who: K.who, text: hashPick(C.opfor.hit, 'house-chief', state.meta.seed, 'hit', K.who), kind: 'speech' });
    // ("Man down!" from the other marine: you when your #2 is hit, and (FL22-3) your #2 when you are: until v0.0.22 he said
    // nothing of it, and on 14 of 56 casualty lanes called "Clear!" in the 2 s after your "I'm hit!" (houseActors now holds him out
    // of the fight through the beat))
    const other = K.who === pid ? H.twoPid : pid;
    if (other) sayOn(state, bus, { who: other, text: hashPick(C.opfor.manDown, 'house-chief', state.meta.seed, 'mandown'), kind: 'speech' });
    // (the casualty on the shooter's leg; a late one on the leg the stack is in when it falls)
    const T = K.by ? R.turners.find(x => x.key === K.by) : null, L = (T && !K.late ? legsOf(H)[legOf(T)] : null) ?? curLeg(H);
    bus?.emit('house', { phase: 'casualty', room: L?.room ?? null, who: K.who, atMs: now, kind: K.who === pid ? 'me' : 'two' });
    houseFault(state, bus, 'casualty', null, L);
  }
  // (through the beat the stack is out of the fight: you out of stop motion, the panel down (no row that does nothing: the review
  // of track L found a full panel for the 2 s whose shot rows were cut on every press, the instinct rebuilding it each tick at 7
  // to 8 ms a tick), every act of yours refused and your feet still (men.js casualtyOn, contact.js refusesAct and feetOf), your
  // number two's rounds not yet fired dropped: no round after the paint)
  if (state.stop) leaveStop(state, bus, 'casualty');
  if (H.two?.eng) twoCease(state, H);
  if (now >= K.endAtMs) {
    chiefSays(state, bus, K.who === pid ? HOUSE_CHIEF.casualty : HOUSE_CHIEF.twoDown, 'casualty');
    laneEnd(state, bus, 'casualty');
  }
  return true;
}

// (a round on a live man (houseShot's branch): a man whose hands the shooter saw up at that round is the fault 'surrendered' (his
// last identification, yours at your pause or your number two's own: a round already on its way when the hands came up is not), the
// zones by shooter as for any man, the first round on a man fighting his par's; then his own sensor and state (opfor.js opforHit))
function liveShot(state, bus, H, L, T, shot, mine, tally) {
  const gave = T.face === 'noshoot';
  const c = gave ? contactOf(state) : null, saw = !gave ? null : mine ? (c?.last?.ids?.includes(T.key) ? c.last.ident?.[T.key] : null) ?? L?.contacts?.filter(x => x.key === T.key && x.by === 'me' && x.ident).at(-1)?.ident ?? null : H.two?.ident?.[T.key] ?? null;
  // (a no-shoot hit only where the shooter saw the hands, the fault's own condition: a round already on its way when they came up
  // is tallied by its zone, so the lane timer, the room's row, the shots line and the card say one thing (the review of v0.0.19:
  // a red "1 NO-SHOOT HIT" beside "2 NO-SHOOTS UNTOUCHED" and no fault))
  if (saw === 'hands') {
    tally('noshoot');
    houseFault(state, bus, 'surrendered', HOUSE_CHIEF.surrendered, L);
  } else {
    tally(shot.down ? 'headDown' : shot.ring && !shot.through ? 'ring' : shot.zone);
    if (!gave) T.firstAtMs ??= shot.atMs;
  }
  const hit = T.stoppedAtMs === null ? opforHit(state, bus, T, shot) : null;
  // (a round of yours his soft panel stopped (a 9×21 ball's, nearly always) is said, once a man, so you know why he
  // fights on with your paint on his chest; the instructor names no remedy)
  const said = H.live && (H.live.said ??= {});
  if (mine && hit?.would?.why === 'stopped' && said && !(said.hisPanel ??= {})[T.key]) { said.hisPanel[T.key] = shot.atMs ?? state.clock.ms; chiefSays(state, bus, HOUSE_CHIEF.hisPanel, 'hisPanel', T.key); }
}

// (the live men of leg k at its end: passed by the stall, every man of it ruled out; cleared, each down or with his hands up ruled
// out ("He's out."), a man still up never (he may reopen it); a man of a reopened room with them)
function liveLegEnd(state, bus, H, k, how) {
  const R = rangeOf(state), LV = H.live;
  let out = 0;
  for (const T of R.turners) {
    if (!isLive(T) || (legOf(T) !== k && LV.reopened?.[T.key] === undefined)) continue;
    if (accountedOf(state, T) === 'out') continue;
    if (how === 'passed') ruleOut(state, bus, T, 'passed');
    else if (downOrHands(state, T, state.clock.ms)) { ruleOut(state, bus, T, 'clear'); out++; }
  }
  if (out) chiefSays(state, bus, HOUSE_CHIEF.out, 'out', k);
}

// (the muzzle's 3-D line over the #2's body as he stands, kneels or lies: carry.js flagsAt, the DI's rule too)
const flagged = (state, pid, two) => flagsAt(muzzleOf(state, pid), two.x, two.z, two.stance ?? 'stand');

// (a leg's state moved on, its time noted, the fact)
function progress(state, bus, H, L, to, now) {
  const order = ['ahead', 'stacked', 'open', 'entered', 'clear'];
  if (order.indexOf(to) <= order.indexOf(L.state)) return;
  L.state = to;
  if (to === 'stacked') L.stackAtMs ??= now;
  if (to === 'open') L.openAtMs ??= now;
  if (to === 'entered') L.enteredAtMs ??= now;
  H.stallAtMs = now;
  // (the leg moved on after "Move on.": STALL_MORE_MS from this step of the leg's own, no longer from the words (2026-11-15, the
  // doors role: a fuzz lane that stacked, opened and entered after the words had the whole STALL_MS + STALL_MORE_MS again from
  // each corner or round after, and walked three legs of 180 to 245 s to the lane's 600 s, LANE_MAX_MS: the gauges' F14))
  if (L.stallSaid && L.stallAtMs !== undefined) L.stallAtMs = now;
  else if (L.stallAtMs !== undefined) L.stallAtMs = null;
  bus?.emit('house', { phase: to === 'entered' ? 'enter' : to, room: L.room, who: playerId(state), atMs: now });
}

// (the owed words, after the window)
// (a line is a string; a strike's call { text, kind: 'paint' } (paintSays), dropped once it is too late, so the next owed line is said in
// its place)
function sayOwed(state, bus, H) {
  while (H.owed.length && !pendingOf(state)) {
    const o = H.owed.shift(), text = typeof o === 'string' ? o : o?.text;
    if (o?.kind === 'paint' && paintLate(H)) continue;
    const R = rangeOf(state);
    sayOn(state, bus, { who: R.coachId, text, kind: 'speech' });
    H.said = { text, atMs: state.clock.ms };
    return;
  }
}

// (your sightings, from the contact's record: each turner's first sighting of the lane, its take-in once paused)
function noteContacts(state, H, now) {
  const c = contactOf(state), R = rangeOf(state);
  if (!c) return;
  for (const rec of [c.pending, c.last]) {
    if (!rec) continue;
    for (const key of rec.ids ?? []) {
      const T = R.turners.find(x => x.key === key);
      if (!T || T.turnAtMs === null || rec.seenMs < T.turnAtMs) continue;
      noteSighting(state, H, T, { seenMs: rec.seenMs, takeInMs: rec === c.last ? rec.ms : null, pauseAtMs: rec === c.last ? rec.atMs : null, by: 'me', ident: rec === c.last ? rec.ident?.[key] ?? null : null });
    }
  }
}
// (a sighting on its turner's leg: the first by anyone opens its par; yours fills your take-in)
// (and what you made of him at your latest pause on him (contact.js keeps only the last contact's): the DI's memory of a
// man you took in, still up after a second contact (instinct/cqb.js))
export function noteSighting(state, H, T, { seenMs, takeInMs: ms, pauseAtMs, by, ident = null }) {
  const L = legsOf(H)[legOf(T)];
  if (!L) return;
  let k = L.contacts.find(x => x.key === T.key && x.by === by);
  // (the card: how the rifle was carried at the sighting (carry.js POSTURES' id: 'aimed', 'highReady', 'lowReady', slung), the
  // missed par's 'unready' (parCauseOf); yours only, the #2's carry is his drill's; additive, absent on a contact before it)
  if (!k) { const c = by === 'me' ? carryOf(state, playerId(state))?.posture ?? null : null; k = { key: T.key, stand: T.stand, face: T.face, seenMs, takeInMs: null, pauseAtMs: null, firstAtMs: null, by, parMet: null, ...(c ? { carry: c } : {}) }; L.contacts.push(k); }
  if (ms !== null && k.takeInMs === null) { k.takeInMs = ms; k.pauseAtMs = pauseAtMs; }
  if (ident && ident !== 'unseen') k.ident = ident;
}
// (the par's clock for a threat: the sighting of the man whose sector it is, the #2's for his own (slot 2) while he lives in
// the lane, else the first by either of you (the fixer's of 0.0.12: a slot-2 man's par ran from your sighting, before the
// #2 could cross the door, so every sheet missed it however well it played))
// (the lane's turner on a stand: whose man it is goes through team.js ownerOf on it, v0.0.21)
const turnerAt = (state, stand) => rangeOf(state)?.turners?.find(T => T.stand === stand) ?? null;
// (v0.0.18: a dazed man's par runs from when he could first have fired, his daze's end, at the soonest)
// (and a man seen while another of the same marine's corner was still to answer, engaged first, from that man's first round and his
// row's book (H.books' rowMs): the second of two seen together met his par only by being the first (the play review of 2026-11-16:
// on drawn houses two men stand in one window, and every such second man of the raider's missed, 1.87 to 3.64 s from his sighting))
const parFrom = (state, L, key) => {
  const by = firstBy(state, L, key), list = L.contacts.filter(k => k.key === key && (by === null || k.by === by));
  if (!list.length) return Infinity;
  const R = rangeOf(state), T = R?.turners?.find(x => x.key === key), daze = T?.dazeUntilMs, seen = Math.min(...list.map(k => k.seenMs)), books = houseOf(state)?.books;
  let after = -Infinity;
  for (const o of L.contacts) {
    if (o.key === key || by === null || o.by !== by || !THREAT_FACES.includes(o.face)) continue;
    // (a man of the same marine's corner only (team.js ownerOf): a round of the other's on his own man is no turn of yours)
    const To = R?.turners?.find(x => x.key === o.key), f = To?.firstAtMs;
    if (!Number.isFinite(f) || f < seen || (Number.isFinite(T?.firstAtMs) && f >= T.firstAtMs) || (ownerOf(state, To) ?? 1) !== (by === 'two' ? 2 : 1)) continue;
    after = Math.max(after, f + (books?.[To.stand]?.rowMs ?? 0));
  }
  return Math.max(seen, Number.isFinite(daze) ? daze : -Infinity, after);
};
// (each threat's par: past it with no round, the low tone and "he fired first")
function pars(state, bus, R, H, now) {
  for (const L of legsOf(H)) for (const k of L.contacts) {
    // (v0.0.19: a role-player who gave up is no threat to meet a par on: his sighting's face as he is now)
    if (H.live && k.parMet === null && k.face !== 'noshoot') { const T0 = R.turners.find(x => x.key === k.key); if (isLive(T0) && T0.face === 'noshoot') k.face = 'noshoot'; }
    if (!THREAT_FACES.includes(k.face) || k.parMet !== null || k.by !== firstBy(state, L, k.key)) continue;
    // (the card (the build sheet v0.0.20 §1 items 4 and 11): the stand's own par (parOf: the class's plus its allowances),
    // judged less the instructor's dummy where its click fell in your window (clickIn: met within the click, "MET (CLICK 0.67)"; your
    // rifle's dummy never holds your number two's man),
    // and every verdict's cause (parCauseOf); the low tone waits from the click to the first round, at most PAR_CLICK_MAX_MS)
    const T = R.turners.find(x => x.key === k.key), from = parFrom(state, L, k.key), par = parOf(state, T, H).ms;
    if (T?.firstAtMs !== undefined && T.firstAtMs !== null) {
      const cm = k.by === 'me' ? clickIn(H, from, T.firstAtMs) : 0;
      k.parMet = T.firstAtMs - from - cm <= par; k.firstAtMs = T.firstAtMs;
      if (cm > 0 && T.firstAtMs - from > par) k.click = cm;
      if (!k.parMet) k.cause = parCauseOf(state, H, L, k, T, from, T.firstAtMs, now); else if (k.click) k.cause = 'click';
      continue;
    }
    const cm = k.by === 'me' ? clickIn(H, from, now) : 0;
    if (now >= from + par + cm && (cm === 0 || cm >= PAR_CLICK_MAX_MS || H.dummy.clickAtMs - from > par)) {
      k.parMet = false; k.cause = parCauseOf(state, H, L, k, T, from, null, now);
      if (cm > 0) k.click = cm;
      bus?.emit('house', { phase: 'par', room: L.room, who: playerId(state), atMs: now, met: false, kind: k.key, text: hashPick(HOUSE_CHIEF.par, 'house-chief', state.meta.seed, 'par', k.key) });
    }
  }
}
// (whose sighting carries a threat's par (see parFrom): the #2's on a man of his while the house has a #2 (team.js ownerOf: a
// slot-2 stand, or yours once the sides are swapped), until a round of yours lands on him before his sighting; else the earliest)
function firstBy(state, L, key) {
  const list = L.contacts.filter(k => k.key === key).sort((a, b) => a.seenMs - b.seenMs), H = houseOf(state);
  if (list.length && H?.twoPid && ownerOf(state, turnerAt(state, list[0].stand)) === 2) {
    if (list.some(k => k.by === 'two')) return 'two';
    const T = rangeOf(state)?.turners?.find(x => x.key === key);
    if (T?.firstAtMs === null || T?.firstAtMs === undefined) return 'two';
  }
  return list[0]?.by ?? null;
}

// (the stall: "Move on." after STALL_MS, the leg passed with 'time' STALL_MORE_MS later (never a dead end). Its clock, H.stallAtMs,
// counts progress only (COMBAT §25.19.4's no-dead-end rules; the shoot house's rework R1, 2026-11-12): a hot spot newly covered,
// a round fired (yours or the #2's), a leg's state moved on (stacked, open, entered, cleared or passed), a door of the lane come
// open or an inner door held. Never a step begun or ended, so neither a Wait nor a row that changes nothing holds it off: until
// 2026-11-12 every step's start and end reset it, and a lane where T pressed Wait at a dead end ran to LANE_MAX_MS, 600 s, with
// no "Move on." (the gauges' 3 hangs in 400 lanes; a marine pressing Wait for ever, tests/house-floor.test.mjs)). Once "Move on."
// is said, only the leg's own state moved on (progress: stacked, open, entered) buys more time: a corner looked at or a round fired
// after it no longer does, and the leg is passed STALL_MORE_MS after the words, or after the last step of the leg's own state
// after them (2026-11-15, the doors role: each such step bought the whole stall again), (2026-11-15, my call: with the P-12 on every sheet
// the fuzz's private on 1148 looked and fired a little every minute and walked three rooms 185 to 247 s each, to the lane's
// 600 s, LANE_MAX_MS: the gauges' F14). L.stallAtMs, the words' time, plain data on the leg (a save before it reads absent).
// The lane's due (2026-11-16, my call: the stall alone has no upper bound, every leg at least 90 s and each look or round before
// the words buying 60 s again; the fuzz private on 1111 ran 148, 153, 227 and 72 s to the lane's 600 s, 'time', on v0.0.20's
// integration, and the fuzz recruit sat at 598.1 s): the leg is due at legDueMs, each leg after it keeping LEG_LAST_MS 45 s and
// the lane LANE_KEEP_MS 15 s, so a lane ends by 585 s by construction. "Move on." STALL_MORE_MS before the due, if not said,
// and at the due the leg is passed with 'time', its own state's steps buying nothing more. It bites only on a lane already
// past 420 s from GO with legs to go (no honest lane comes near it). L.dueSaid, true once the due said the words or passed the
// leg (additive: absent on a save before it, and on every leg the due never met).
/**
 * Why a leg the stall or the lane's due passes was passed (its build sheet item 11, carried FH-2): 'stack' (the door never
 * opened: the leg 'ahead' or 'stacked'), 'door' (open, never crossed), 'room' (entered, never called); the hall none (it has no door:
 * its pass keeps v0.0.20's lesson, `time`). Written on the leg as L.passWhy (additive: absent on old saves, read as `time`). Pure.
 */
export const passWhyOf = (L) => (L.door === 'hall' ? null : L.state === 'open' ? 'door' : L.state === 'entered' ? 'room' : L.state === 'ahead' || L.state === 'stacked' ? 'stack' : null);
// (the leg passed, its why first: at both of stall's passes)
function passLeg(state, bus, H, L, now) {
  // (the fixer of v0.0.24's play review, M1: a room passed while your legs had nothing to push on (0 G with no boots locked) is the
  // footing's, 'footing', never the door's or the stack's lesson)
  const w = footless(state) ? 'footing' : passWhyOf(L);
  if (w) L.passWhy = w;
  houseFault(state, bus, 'time', HOUSE_CHIEF.time, L);
  endLeg(state, bus, H, L, 'passed', now);
}
// (your legs have nothing to push on where you stand (0 G with no boots locked: motion.js legsAt through bundle.js legsOf), so no walk
// of yours can start: the fixer of v0.0.24's play review, M1)
const footless = (state) => { const pid = playerId(state), a = actorOf(state, pid); return !!a && !(bodyLegsOf(state, pid, a.x, a.z).pushMs2 > 0); };
function stall(state, bus, R, H, L, now) {
  const since = now - (H.stallAtMs ?? now), due = legDueMs(H, legsOf(H).indexOf(L)), dueNear = due !== null && now >= due - STALL_MORE_MS;
  if ((since >= STALL_MS || dueNear) && !L.stallSaid) {
    L.stallSaid = true; L.stallAtMs = now;
    if (since < STALL_MS) L.dueSaid = true;
    bus?.emit('house', { phase: 'stall', room: L.room, who: playerId(state), atMs: now });
    // (the fixer of v0.0.24's play review, M1: "Move. You are clearing, not visiting." beside "No footing here." where you could not
    // move: with your legs on nothing the instructor says why he moves you on)
    chiefSays(state, bus, footless(state) ? HOUSE_CHIEF.stallFooting : HOUSE_CHIEF.stall, 'stall', L.room);
  }
  if (due !== null && now >= due) {
    L.dueSaid = true;
    passLeg(state, bus, H, L, now);
    return;
  }
  if (since >= STALL_MS + STALL_MORE_MS || (L.stallSaid && Number.isFinite(L.stallAtMs) && now - L.stallAtMs >= STALL_MORE_MS)) passLeg(state, bus, H, L, now);
}

/**
 * "Clear!" called (a row 'call:clear' at its end, a bundle's beat, or the drill's own call): by 'me' or 'two', atMs
 * when it was said. Yours ends the current leg once you are in it: its faults, the double beep when every par in it
 * was met, the next door. Returns whether it ended a leg.
 */
export function houseCall(state, bus, { by = 'me', atMs = state.clock.ms, fromMs = atMs, how = 'keys' } = {}) {
  const R = rangeOf(state), H = R?.house;
  if (!H || R.end || H.end || H.goAtMs === null) return false;
  const L = curLeg(H);
  if (!L || L.calls.some(c => c.atMs === atMs && c.by === by)) return false;
  L.calls.push({ say: 'clear', atMs, by, how });
  if (by !== 'me' || L.state !== 'entered') return false;
  const P = planOf(state, L), now = state.clock.ms;
  // (a turner of the leg whose trigger is met and which has not turned yet turns now, and the call is void: the lane's
  // target meets a "Clear!" called before it (my call: never a lane over with its last man not yet shown))
  const early = R.turners.filter(T => legOf(T) === H.cur && T.turnAtMs === null && T.stoppedAtMs === null && !T.passed && triggerMet(H, T));
  // (the hall's end not reached (its turner's zone not entered): a "Clear!" said on the way there is void)
  if (R.turners.some(T => legOf(T) === H.cur && T.trigger.kind === 'zone' && T.turnAtMs === null && !T.passed && !triggerMet(H, T))) { L.calls.at(-1).void = true; return false; }
  if (early.length) {
    for (const T of early) { turnTo(T, now); bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'turn', face: T.face, atMs: T.turnAtMs, toMs: T.turnAtMs + TURN_MS, why: 'standby' }); }
    L.calls.at(-1).early = true;
    return false;
  }
  // (a call said while a man of the leg was being taken in (his window open at any time of it, its pause at or after the
  // call began) is no decision made on him: void, the pause his)
  const c = contactOf(state), ofLeg = (rec) => (rec?.ids ?? []).some(k => { const T = R.turners.find(x => x.key === k); return T && legOf(T) === H.cur && T.stoppedAtMs === null; });
  if ((c?.pending && ofLeg(c.pending)) || (c?.last && c.last.atMs >= fromMs && ofLeg(c.last))) { L.calls.at(-1).void = true; return false; }
  // (a man of the leg turning to face you as you call, not yet seen (turned under APPEAR_MS ago): void too, his window to come)
  if (R.turners.some(T => legOf(T) === H.cur && T.turnAtMs !== null && T.stoppedAtMs === null && now - T.turnAtMs < APPEAR_MS && c?.known?.[T.key] === undefined)) { L.calls.at(-1).void = true; return false; }
  // (v0.0.19: the hall's "Clear!" never ends the lane while a man of a reopened room is up)
  if (H.live && L.door === 'hall' && R.turners.some(T => isLive(T) && H.live.reopened?.[T.key] !== undefined && T.face !== 'noshoot' && upNow(T, now))) { L.calls.at(-1).void = true; return false; }
  // (the faults the call shows: a hot spot neither of you covered, a threat still up, the inner door left)
  if ((P?.hot ?? []).some(h => !L.covered[h.id])) houseFault(state, bus, 'corner', HOUSE_CHIEF.corner, L);
  const up = R.turners.filter(T => legOf(T) === H.cur && isThreat(T) && T.turnAtMs !== null && T.stoppedAtMs === null);
  if (up.length) houseFault(state, bus, 'standing', HOUSE_CHIEF.standing, L);
  // (v0.0.19: a live man of the leg (or of a reopened room) down or with his hands up and nobody covering him: "Cover your man!";
  // the call stands, as a corner's does)
  if (H.live && R.turners.some(T => isLive(T) && (legOf(T) === H.cur || H.live.reopened?.[T.key] !== undefined) && uncovered(state, T, now))) houseFault(state, bus, 'uncovered', HOUSE_CHIEF.uncovered, L);
  // (the inner door: held (the #2's muzzle on it: bundle.js's Hold it writes two.hold), cleared (opened with a man at its leaf, its
  // space seen: bundle.js innerSeen), open (opened and never looked into: the hunt of v0.0.20, breach-4, the closet shot from across
  // room 2 and the room called clear over it), or left)
  if ((P?.inner ?? []).length && !L.inner) {
    const open = P.inner.filter(id => openingState(state, id) === 'open');
    L.inner = P.inner.includes(H.two.hold) ? 'held' : open.some(id => H.innerSeen?.[id] !== undefined) ? 'cleared' : open.length ? 'open' : 'left';
    if (L.inner === 'left') houseFault(state, bus, 'door', HOUSE_CHIEF.door, L);
    if (L.inner === 'open') houseFault(state, bus, 'door', HOUSE_CHIEF.doorOpen, L);
  }
  endLeg(state, bus, H, L, 'clear', now);
  return true;
}

/**
 * The ready-to-clear predicate a bundle's "Clear!" waits on (bundle.js useClearGate; COMBAT §25.19.2.1, the rework's R3): the
 * reason the room is not yet clear for a call on the door's leg now, as the team perceives it, or null: a window open on a
 * man of the leg (a man being taken in), or your number two on a man of the leg (his take-in, his row, his rifle down on
 * him: what his calls tell you). Off the current leg, before GO or after the lane, null.
 * From the reach review of 2026-11-13: the gate no longer reads what nobody in the room knows (a man turned under APPEAR_MS
 * ago and not yet seen, a turner whose trigger has fired and which has not turned): a drill that would have the marine
 * never wrong about a room. The range officer's knowledge stays the scene's: houseCall voids such a call and turns the man.
 */
export function clearGateOf(state, door, ms = state.clock.ms) {
  const R = rangeOf(state), H = R?.house;
  if (!H || R.end || H.end || H.goAtMs === null || !Array.isArray(H.rooms)) return null;
  const L = curLeg(H);
  if (!L || (door && L.door !== door)) return null;
  const c = contactOf(state), k = legsOf(H).indexOf(L);
  const ofLeg = (rec) => (rec?.ids ?? []).some(key => { const T = R.turners.find(x => x.key === key); return T && legOf(T) === k && T.stoppedAtMs === null; });
  if (c?.pending && ofLeg(c.pending)) return 'window';
  // (your number two on a man of the leg: his take-in, his row, or his rifle down on him (the rework's R5: v0.0.13 called the
  // room clear over his stopped rifle with his man up))
  for (const key of [H.two?.contact?.key, H.two?.eng?.key, H.two?.down && !H.two.down.failed ? H.two.down.key : null]) {
    const T = key ? R.turners.find(x => x.key === key) : null;
    if (T && legOf(T) === k && T.stoppedAtMs === null) return 'two';
  }
  // (v0.0.19: the live men as the team perceives them: down or with his hands up and not covered, or seen and now unaccounted for)
  return H.live ? liveGateOf(state, H, k, ms) : null;
}
useClearGate(clearGateOf);
// (your "Clear!" said at ms on the door's leg, void (a man turning as you called it, the hall's end not reached, a window on a man of the leg))
useCallVoid((state, door, ms) => {
  const H = houseOf(state), L = H ? curLeg(H) : null, c = L?.calls?.find(x => x.by === 'me' && x.atMs === ms);
  return !!L && L.state === 'entered' && (!door || L.door === door) && !!c && (!!c.void || !!c.early);
});
// (you and your number two never through each other (COMBAT §25.19.3.4, F2): the walker keeps each body BODY_GAP_M off the other,
// on the lane and off it; and off every man of the lane, up or down, the hostage too, since a stand is a body where it stands
// (the reach review of 2026-11-13: only the two of you were bodies, and a man in a corner was walked through; the instructor
// on the catwalk is above the floor, never one)
useBodies((state, pid) => {
  const H = houseOf(state), me = playerId(state);
  if (!H || (pid !== me && pid !== H.twoPid)) return null;
  const other = H.twoPid ? actorOf(state, pid === me ? H.twoPid : me) : null;
  const bodies = [...(other ? [{ x: other.x, z: other.z }] : []), ...(rangeOf(state)?.turners ?? []).map(T => ({ x: T.x, z: T.z }))];
  return bodies.length ? { gapM: BODY_GAP_M, bodies } : null;
});
// (the path a body of yours is on, for the carry through a doorway (src/sim/places/zones.js useLanes, the rework's R8b): your slot's
// and your number two's through the current leg's door, so the feet carry each man on his own lane to his point, never across)
useLanes((state, pid) => {
  const H = houseOf(state);
  if (!H || H.goAtMs === null || H.end) return null;
  const slot = pid === playerId(state) ? 1 : pid === H.twoPid ? 2 : null, P = slot ? planOf(state, curLeg(H)) : null;
  return P?.door ? P.paths?.[sideOf(state, curLeg(H).door, slot)] ?? null : null;
});

// (the way you must not come to rest across (src/sim/places/zones.js useKeepClear; 2026-11-15, the user: "squad AI sometimes stays
// out of the room on entry (room 2)"): your number two's way in through the current leg's door, from its threshold through the
// rest of the doorway and CROSS_CLEAR_M past it (bundle.js crossingOf, his crossing rule's own stretch), while you are inside
// and he is not yet past the threshold; never his approach outside, where your own stack stands beside it)
useKeepClear((state, pid) => {
  const H = houseOf(state);
  if (!H || H.goAtMs === null || H.end || pid !== playerId(state) || !H.twoPid) return null;
  const P = planOf(state, curLeg(H)), area = state.places?.live?.area, two = actorOf(state, H.twoPid), me = actorOf(state, pid), path = P?.door ? P.paths?.[sideOf(state, curLeg(H).door, 2)] : null;
  if (!path || !area || !two || !me || !P.threshold || !pastThreshold(P, me.x, me.z) || pastThreshold(P, two.x, two.z)) return null;
  const way = crossingOf(path, P.threshold, (x, z) => !!liveZoneAt(state, area, x, z));
  return way ? [{ path: way, gapM: BODY_GAP_M + GAP_GUARD_M }] : null;
});

// (a turner's trigger met: its door open, its zone entered (not yet its gap))
const triggerMet = (H, T) => (T.trigger.kind === 'door' ? H.doors[T.trigger.on] !== undefined : T.trigger.kind === 'zone' ? H.zones[T.trigger.on] !== undefined : T.trigger.kind === 'go');

// (a leg over, cleared or passed: its turners turned away, the #2's echo, the next leg; the hall's the lane's end)
function endLeg(state, bus, H, L, how, now) {
  const R = rangeOf(state), k = legsOf(H).indexOf(L);
  L.state = how; L.clearAtMs = now;
  clearTask(H);
  // (the build sheet v0.0.20 item 1: a doing of yours still running on the leg the stall passes hands back, "Move on." (bundle.js
  // HANDBACK_WORDS.stall), as the lane's end does; before it a walk held by your #2 ran on into the next leg)
  if (how === 'passed') { const S = state.stop, d = S?.flow ?? S?.doing; if (d?.beats && (d.door ?? L.door) === L.door) handBack(state, bus, 'stall'); }
  // (and your #2's walk to this leg's stack, halted where he stands, the next leg's planned from there (bundle.js twoLegOver))
  if (H.two) twoLegOver(state, bus, H.two, L.door, now);
  // (a role-player is never turned away: ruled out or left up, by liveLegEnd (v0.0.19))
  for (const T of R.turners) if (legOf(T) === k) { if (how === 'passed') T.passed = true; if (!isLive(T) && T.turnAtMs !== null && (T.awayAtMs === null || T.awayAtMs > now)) { turnAway(T, now); bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'away', face: T.face, atMs: T.awayAtMs, toMs: T.awayAtMs + TURN_MS, why: 'string' }); } }
  if (H.live) liveLegEnd(state, bus, H, k, how);
  if (how === 'clear') {
    const met = L.contacts.filter(c => THREAT_FACES.includes(c.face) && c.by === firstBy(state, L, c.key)).every(c => c.parMet === true);
    bus?.emit('house', { phase: 'clear', room: L.room, who: playerId(state), atMs: now, met });
    // (your number two's "Clear!" after yours, only where he has called none of his own in the leg: one "Clear!" a man a room (
    // its build sheet's item 4, FL22-4). Until v0.0.22 the echo was dropped only within ECHO_MS 1 s of his own call, so on the
    // turner lanes 84 of your 169 calls were followed by his second "Clear!", his first 0.25 to 16.35 s before yours (room 3 and the
    // hall); and never once the casualty has opened (FL22-3: no lane word of his over a marine down)
    if (H.twoPid && !twoCalledIn(H, L) && !H.live?.casualty) { sayOn(state, bus, { who: H.twoPid, text: 'Clear!', kind: 'speech' }); L.calls.push({ say: 'clear', atMs: now, by: 'two', how: 'echo' }); }
  }
  H.stallAtMs = now;
  H.cur = k + 1;
  const next = legsOf(H)[H.cur];
  if (!next) { laneEnd(state, bus, how === 'clear' ? 'clear' : 'passed'); return; }
  next.fromMs = now;
  if (next.door === 'hall') next.state = 'open';
  noteMind(state, 'clearing', { room: next.room, fromMs: now });
  R.cueAtMs = now;
}

// (whether your number two called his own "Clear!" in leg L (FL22-4): his Dominate on its door swept to its end (bundle.js
// runSlot's R.house.two.swept, its 'clear' beat the call), its 'clear' beat said while it still runs, or his last call (bundle.js's
// R.house.two.clearMs, his call beat on any door) since you entered the leg (the hall's from its start): his call of an earlier room
// comes before you enter the next)
function twoCalledIn(H, L) {
  const W = H.two;
  if (!W || !L) return false;
  if (L.door && W.swept?.[L.door] !== undefined) return true;
  if (L.door && W.doing?.door === L.door && W.doing.beats?.some(b => b.key === 'clear' && b.st === 'done')) return true;
  const from = L.enteredAtMs ?? L.fromMs;
  return Number.isFinite(W.clearMs) && Number.isFinite(from) && W.clearMs >= from;
}

// (the lane over: the turners turned away, the clear ended, the instructor's Stop to come (laneDone))
function laneEnd(state, bus, why) {
  const R = rangeOf(state), H = R.house, now = state.clock.ms;
  if (H.end) return;
  H.end = { why, atMs: now };
  clearTask(H);
  R.hot = false; R.phase = 'cmd';
  // (the role-players ruled out by the instructor at the lane's end, never turned away (v0.0.19))
  for (const T of R.turners) {
    if (isLive(T)) { if (accountedOf(state, T) !== 'out') ruleOut(state, bus, T, 'lane'); continue; }
    if (T.turnAtMs !== null && (T.awayAtMs === null || T.awayAtMs > now)) turnAway(T, now);
  }
  noteMind(state, 'clearing', null);
  // (a bundle running hands back at the lane's end: COMBAT §25.8.2's 'lane-end')
  if (state.stop?.doing?.beats || state.stop?.flow) handBack(state, bus, 'lane-end');
  if (why === 'time') houseFault(state, bus, 'time', HOUSE_CHIEF.laneTime, curLeg(H));
  if (why === 'dry') chiefSays(state, bus, HOUSE_CHIEF.dry, 'dry');
  // (v0.0.19, D2: why 'burst', the stack in a practice grenade's read, is a cease fire with its card: the words said by the read, house-kit.js)
  chargesLeft(state, bus, H);
  handsLeft(state, bus, H);
  bus?.emit('house', { phase: 'stop', room: null, who: playerId(state), atMs: now, kind: why });
}

// (v0.0.18: a charge placed and never fired, still on its door at the lane's end (opened by hand past it), is a fault on that
// door's leg, "CHARGE LEFT ON THE DOOR", and the instructor makes it safe: the charge off the door and out of the game, its
// FD-1 unfitted (the review of 2026-11-16: it stayed live on the open door to the card, unmarked))
function chargesLeft(state, bus, H) {
  for (const d of liveDevices(state)) {
    const rec = state.items[d.id];
    if (d.kind !== 'charge' || Number.isFinite(rec?.fuseAtMs)) continue;
    const L = legsOf(H).find(x => x.door === rec.door) ?? curLeg(H);
    if (L) { (L.kit ??= []).push('CHARGE LEFT ON THE DOOR'); houseFault(state, bus, 'charge', 'You left a charge on that door. Never walk away from a placed charge.', L); }
    if (rec.tubeId && state.items[rec.tubeId]) setSt(state, rec.tubeId, 'pouched');
    discard(state, d.id);
  }
}

// (the hunt of v0.0.18: a device still in your hand at the lane's end. A G-11 with its pin out is a fault on the leg you are
// on, "PIN OUT AT THE END", and the instructor makes it safe as he does a charge left on a door: the pin back in and the grenade
// pouched; a tool goes back on your back, a charge or a pinned grenade into its pouch (a pouch full: at your feet). Off the lane the
// drill's rows that free the hands are gone, and Up is struck while they are full (devices.js handsFullWhy), so UNLOAD could never
// come: the chaos lanes reached the card holding an armed G-11 for 150 s, F29's breach. A live one, its lever gone, is its own burst)
function handsLeft(state, bus, H) {
  const pid = playerId(state), h = handDeviceOf(state, pid), a = actorOf(state, pid);
  if (!h || (h.kind === 'grenade' && h.st === 'live')) return;
  // (the leg you are on, else the last: a lane passed in full has no current leg)
  const L = curLeg(H) ?? legsOf(H).at(-1) ?? null;
  if (h.kind === 'grenade' && h.st === 'armed') { if (L) (L.kit ??= []).push('PIN OUT AT THE END'); houseFault(state, bus, 'pin', HOUSE_CHIEF_PIN, L); }
  const home = containersOf(state, pid).find(c => { const C = CONTAINERS[state.items[c].model]; return C?.fits?.includes(h.kind) && (state.items[c].holds ?? []).length < C.holds; });
  if (home) move(state, h.id, { container: home });
  else if (a) move(state, h.id, { ground: { area: state.places.live.area, x: a.x, z: a.z } });
  delete state.items[h.id].st;
}
/** The instructor's words for a pin still out at the lane's end. */
export const HOUSE_CHIEF_PIN = 'Pin back in. Never finish a lane with the pin out.';

/** A step begun on the house course (handling.js onStepStart): no progress for the stall by itself (see stall); kept as the hook. */
export function houseStepStart(state, bus, d) {
  const H = houseOf(state);
  if (!H || H.goAtMs === null || H.end || !d) return;
}

/** A step ended on the house course (handling.js afterStep): "Clear!" by its row, a door held, the dummy cleared. */
export function houseAfterStep(state, bus, d, why) {
  const R = rangeOf(state), H = R?.house;
  if (!H || R.end) return;
  const now = state.clock.ms, step = d?.step ?? '';
  if (step === 'call:clear' && why === 'end') houseCall(state, bus, { by: 'me', atMs: now, how: 'keys' });
  const held = /^door:hold>(.+)$/.exec(step)?.[1] ?? null;
  if (held) { const L = legsOf(H).find(x => planOf(state, x)?.inner?.includes(held)); if (L && !L.inner) { L.inner = 'held'; if (H.goAtMs !== null && !H.end) H.stallAtMs = now; } }
  // (the dummy's click cleared: the session's stoppage put right (handling.js afterStep marks it))
  if (H.dummy.clickAtMs !== null && H.dummy.clearedAtMs === null && R.stoppage?.set && R.stoppage.cleared) {
    H.dummy.clearedAtMs = now;
    // (FL22-3: its time on the run sheet whenever it came, its praise only in the lane: after the lane's end (a casualty's
    // cease fire, Stop) the instructor says no lane word; before, "My dummy. Cleared. Good." came after "CEASE FIRE!" on 13 of 56
    // casualty lanes)
    if (!H.end) chiefSays(state, bus, HOUSE_CHIEF.dummy, 'dummy');
  }
}

/**
 * Your "Clear!" by a beat doing (a single's 'call:clear' or a bundle's 'clear' beat: bundle.js's, run by the stepper,
 * which calls no step hook): each 'call' beat whose key names clear, done, said after the last call taken. The doing is
 * read as it stands and as it was last seen ($seen, runtime), before and after the stop layer moves it, so a beat that
 * ends the doing in the same tick is read all the same; a call before GO, or one already taken, is nothing.
 */
function callsOf(state, bus, H, d) {
  for (const x of [H.$seen, d]) {
    if (!x?.beats) continue;
    for (const b of x.beats) {
      if (b.k !== 'call' || b.st !== 'done' || !/clear/.test(b.key ?? '') || !Number.isFinite(b.untilMs) || b.untilMs <= (H.callMs ?? -Infinity)) continue;
      H.callMs = b.untilMs;
      houseCall(state, bus, { by: 'me', atMs: b.untilMs, fromMs: b.fromMs ?? b.untilMs, how: x.bundle ? 'bundle' : 'keys' });
    }
  }
  H.$seen = d?.beats ? d : null;
}
/** Before the stop layer (arms/domain.js's input): the doing as it stands, seen. */
export function houseInputBefore(state) {
  const H = houseOf(state);
  if (H && (state.stop?.doing?.beats || state.stop?.flow)) H.$seen = state.stop.doing?.beats ? state.stop.doing : state.stop.flow;
}

/** The input layer on the house course (runs while time stands still): a beat's "Clear!" (callsOf), the presses counted on the current leg, a person's and a door's apart. */
export function houseInput(state, input, bus) {
  const H = houseOf(state);
  if (!H || H.goAtMs === null || H.end) return;
  // (2026-11-12, R3: the bundle as it stands, or the flow beside a step (bundle.js))
  if (!rangeOf(state).end) callsOf(state, bus, H, state.stop?.doing?.beats ? state.stop.doing : state.stop?.flow ?? state.stop?.doing);
  if (!input?.act?.length || pendingOf(state)) return;
  const L = curLeg(H);
  if (!L) return;
  for (const act of input.act) {
    const name = typeof act === 'string' ? act : act?.act ?? '';
    // (T as the page sends it: the instinct's act, 'stop:<step>')
    const step = name === 'instinct' ? String(act?.args?.act ?? '').replace(/^stop:/, '') : typeof act === 'object' ? act?.args?.step ?? '' : name.startsWith('stop:') ? name.slice(5) : '';
    if (!PRESS_ACTS.some(p => name === p || name.startsWith(`${p}:`))) continue;
    L.presses += 1;
    // (about a person: a shot row, the aim, Fire, the contact's rows, the brackets, "Carry on" past him, or any press at a
    // contact's pause; about a door: its rows, Hold it, a drill's row at a door of the plan (the hall's leg too))
    if (/^door:|>o:|>hall$|^drill:room:(stack|open)/.test(step)) L.pressAbout.door += 1;
    else if (/^(shot:|aim|fire|contact:|drill:carry)/.test(step) || step.startsWith('pick') || (state.stop?.via === 'contact' && contactOf(state)?.last && contactOf(state).last.atMs >= (L.enteredAtMs ?? L.fromMs ?? 0))) L.pressAbout.person += 1;
    if (step.startsWith('drill:')) L.how.bundle += 1; else L.how.keys += 1;
  }
}
const PRESS_ACTS = Object.freeze(['stop', 'shoot', 'ready', 'gait', 'drill', 'carry', 'stance', 'breathe', 'instinct']);

// ---- the shots ----

/**
 * A shot on the house course (handling.js recordShot's house branch, and the #2's): the issue's count, the session's
 * shots, the turner's hits and its sensor, a no-shoot's and the hostage's faults, the zones by room and shooter, the
 * first round on a threat (its par).
 */
export function houseShot(state, bus, shot) {
  // (v0.0.19, D2: a ballistic breach's round is the breach's tally, never a miss nor the target view (house-kit.js))
  if (shot?.row?.id === 'shoot:door') return breachShot(state, bus, shot);
  const R = rangeOf(state), H = R?.house;
  if (!R || !H) return;
  const pid = playerId(state), mine = (shot.who ?? pid) === pid, T = shot.target ? R.turners.find(x => x.key === shot.target) ?? null : null, now = state.clock.ms;
  if (shot.fired) {
    if (mine) {
      const issue = state.armoury.ammoIssues.find(a => a.id === R.issueId);
      if (issue) issue.fired += 1;
      R.shots.push({ id: shot.id, atMs: shot.atMs, lane: null, string: 0, hole: null, score: 0, v: false, logSeq: shot.logSeq ?? null, key: shot.target ?? null, load: shot.load ?? null, ...(shot.row ? { row: shot.row.id } : {}), part: shot.part ?? 'torso' });
      if (R.shots.length > 100) R.shots.splice(0, R.shots.length - 100);
      if (!R.hot && !R.end) houseFault(state, bus, 'cold', null);
    } else {
      // (his rounds kept on his record, the last TWO_SHOTS_KEPT: the turners' hits name them)
      H.two.fired += 1;
      (H.two.shots ??= []).push({ id: shot.id, atMs: shot.atMs, key: shot.target ?? null });
      if (H.two.shots.length > TWO_SHOTS_KEPT) H.two.shots.splice(0, H.two.shots.length - TWO_SHOTS_KEPT);
    }
    if (shot.brassRec) { R.brass.push(mine ? shot.brassRec : { ...shot.brassRec, who: shot.who }); if (R.brass.length > BRASS_LIVE) R.brass.splice(0, R.brass.length - BRASS_LIVE); }
    if (H.goAtMs !== null) H.stallAtMs = now;
  }
  if (mine && ((!shot.fired && shot.why === 'dud') || shot.stoppage)) {
    R.stoppage = { atMs: shot.atMs, kind: shot.set ?? (shot.stoppage === 'double' ? 'double' : shot.stoppage ? 'stovepipe' : 'dud'), set: !!shot.set, cleared: false };
    if (shot.set && H.dummy.clickAtMs === null) H.dummy.clickAtMs = shot.atMs;
  }
  if (!shot.fired) return;
  // (the truth cards' moment, your first round at a man or a stand, hit or miss: what he truly was then, once (truthAt))
  if (mine && T && !T.atFirst) T.atFirst = truthAt(state, T, shot.atMs);
  const L = T ? legsOf(H)[legOf(T)] : curLeg(H);
  const zone = shot.zone ?? null, part = shot.part ?? 'torso', hit = !!T && zone !== null;
  const tally = (z) => { if (!L) return; const Z = mine ? L.zones : L.twoZones; Z[z] = (Z[z] ?? 0) + 1; };
  if (L && mine) L.rounds += 1;
  if (!hit) { tally('miss'); return; }
  T.hits.push({ shotId: shot.id, part, zone, ring: !!shot.ring, through: !!shot.through, at: shot.hole?.at ?? null, atMs: shot.atMs, by: mine ? 'me' : 'two' });
  if (mine) H.lastHitMs = shot.atMs; else H.two.hits += 1;
  // (v0.0.19: a role-player, never a stand's sensor nor its turn away (see liveShot))
  if (isLive(T)) { liveShot(state, bus, H, L, T, shot, mine, tally); return; }
  if (T.face === 'noshoot') { tally('noshoot'); houseFault(state, bus, 'noshoot', HOUSE_CHIEF.noshoot, L); return; }
  if (T.face === 'hostage') {
    const bad = ['bad', 'disaster'].includes(shot.roll?.grade);
    if (part !== 'head' || bad) { tally('hostage'); houseFault(state, bus, 'hostage', HOUSE_CHIEF.hostage, L); return; }
  }
  tally(shot.down ? 'headDown' : shot.ring && !shot.through ? 'ring' : zone);
  T.firstAtMs ??= shot.atMs;
  if (T.stoppedAtMs !== null) return;
  if (T.face === 'armoured') {
    if (shot.ring) bus?.emit('fx', { kind: 'spark', x: T.x, y: q(T.y + (shot.hole?.at ? -shot.hole.at[1] / 100 : 0), 0.01), z: T.z, atMs: shot.atMs, dir: Math.PI, size: 0.4 });
    if (shot.down ?? (part === 'head' && zone === 'head' && !shot.ring)) stopTurner(bus, T, shot.atMs);
    return;
  }
  const torso = T.hits.filter(h => h.part === 'torso' && (h.zone === 'A' || h.zone === 'C')).length, head = T.hits.filter(h => h.zone === 'head').length;
  if (T.face === 'hostage' ? head >= STOP_HEAD : torso >= STOP_TORSO || head >= STOP_HEAD) stopTurner(bus, T, shot.atMs);
}
/**
 * What a man or a stand truly was at your first round at him (v0.0.24, the build sheet v0.0.24 item 19, §0 items 14 and 28; the
 * overhaul's O-17): T.atFirst = { ms, how, gun, pose, facing, aimAt, face, holds, read }, written once by houseShot and never again, so the
 * end card's truth card draws him as he was, beside what your take-in had read (read: engage.js seenFace's face and holds then, the
 * belief you acted on; gun: the model in his hands then, so a man who later gave up and dropped it is drawn holding it). A role-player is his Seen record from your eye (seen.js seenOf, read here in a tick for this capture only,
 * the cover off, { fresh: true, keep: false }: no cache of the page's is written, and a save loaded captures the same); a board is
 * what its stand holds, front on. Additive: a save made before has none, read as not engaged until a round is fired at it.
 */
export function truthAt(state, T, ms) {
  const sf = seenFace(state, T.key), read = { face: sf.face, holds: sf.holds };
  const r = isLive(T) && T.live?.who ? seenOf(state, T.live.who, { by: playerId(state), ms, fresh: true, keep: false, cover: false }) : null;
  if (r) return { ms, how: r.hold?.how ?? 'empty', gun: r.hold?.right ?? null, pose: r.pose, facing: r.facing, aimAt: r.aimAt ?? null, face: T.face, holds: T.holds, read };
  const b = standSeen(T.face, T.holds);
  return { ms, how: b.hold.how, pose: 'stand', facing: 'front', aimAt: null, face: T.face, holds: T.holds, read };
}
// (the hit sensor: down, and turned away SENSOR_MS after)
function stopTurner(bus, T, atMs) {
  T.stoppedAtMs = atMs;
  turnAway(T, atMs + SENSOR_MS);
  bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'away', face: T.face, atMs: T.awayAtMs, toMs: T.awayAtMs + TURN_MS, why: 'hit' });
}

// ---- the second (handling.js rangeSecond) ----

/**
 * The second on the house course (live only): true while the scene keeps the clock itself (the standby before GO is
 * posted, the lane running), so the tower's nudge and move-on leave it alone; the hot wash put behind the brief splash.
 */
export function houseSecond(state, bus, ctx) {
  const R = rangeOf(state), H = R?.house;
  if (!H || R.end) return false;
  const id = R.cmd?.id;
  if (id === 'standby' && H.goAtMs === null) return true;
  if (id === 'go' && !H.end) return true;
  // (FL22-1: at Stop the tower waits for the instructor to stand over you (he walks there from the lane's end), so its
  // UNLOAD, SHOW CLEAR finds him where he can see your port; as long as he is walking to you, no longer)
  const me = playerId(state);
  if (id === 'stop' && H.end && H.chief && chiefReach(state, H, me) && H.show?.pid === me && H.show.near?.[me] === undefined) return true;
  if (id === 'clear' && H.end && showClearSecond(state, bus, ctx, R, H)) return true;
  if (id === 'wash' && H.wash) {
    const left = H.wash.atMs + WASH_MS - state.clock.ms;
    if (left > 0 && !state.skip && !state.time?.doing && !state.stop && ctx?.sim) {
      const act = ACTIVITIES['house-wash'] ? 'house-wash' : 'idle';
      startActivity(state, bus, ctx, { id: act, args: { ms: whole(left) } });
    }
    // (the wash is the scene's clock: no move-on until it is over)
    if (left > 0) return true;
  }
  // (the build sheet v0.0.20 §0 item 32: the tower keeps its second while the instructor's chained line (R.paUntilMs: his PA
  // lines and his speech outside the lane) is still being said, so its next command never cuts him, and no nudge or move-on runs
  // on his own talking. Never at Standby (GO is posted at its drawn time) or GO (Stop comes when the lane is done). Here, not in
  // houseReady: that is the shooter's readiness too (the DI's range-wait reads it), and a guard there left a shooter who had
  // done the command at a stop with no act while the tower talked: 261 dead ends in house-flawless-quick's ten lanes)
  if (id !== 'standby' && id !== 'go' && state.clock.ms < (R.paUntilMs ?? 0)) return true;
  return false;
}

// (FL22-1: SHOW CLEAR once your guns are passed (your SHOW CLEAR over, both guns, and the instructor's look at you done).
// What is left (your #2's clear: his macro, his walk out, the instructor's walk to him and his look; then the tower's "The lane is
// clear.") is the scene's clock, as the hot wash is: no nudge, no move-on, and, you still, the activity 'house-showclear' behind the
// brief splash for what is owed of it (two.js twoLeftMs, his list's and his walk's, plus the instructor's walk to him and his look,
// and the wash's own wait), started again while it is owed (a halt plans his list again: TWO_TRIES bounds it). With both looked at,
// "The lane is clear." is posted WASH_AFTER_MS after the last "Clear.", at the tower's whole second (core/queue.js posts by the
// second). The feel lens measured your "Clear." to the hot wash at 5.3 to 16.1 s by sheet, his clear stood through at 1×. True while
// the scene keeps the clock)
function showClearSecond(state, bus, ctx, R, H) {
  const pid = playerId(state), W = H.two, now = state.clock.ms;
  if (!mePassed(state, R) || !chiefSees(state, H, pid)) return false;
  const owed = !!H.twoPid && !!actorOf(state, H.twoPid) && !W?.shown;
  let left;
  if (owed) {
    const c = actorOf(state, H.chiefPid), m = actorOf(state, H.twoPid), cw = houseSpecOf(state).catwalk, at = c && m && cw?.path?.length ? nearestOn(cw.path, [m.x, m.z]) : null;
    const walkMs = at ? Math.round(Math.hypot(at[0] - c.x, at[1] - c.z) / placeGaits(state).walkMs * 1000) : 0;
    left = twoLeftMs(state, W) + walkMs + SHOW_LOOK_MS + TICK_MS + WASH_AFTER_MS + SEC_MS;
  } else {
    if (!R.next) {
      if (!lineReady(state, 'clear')) return false;
      // (a breath after the last "Clear.": yours at your look's end, his the tick after his look)
      const last = Math.max(H.show?.done?.[pid] ?? 0, (H.show?.done?.[H.twoPid] ?? -Infinity) + TICK_MS), i = SEQ_HOUSE.findIndex(c => c.id === 'wash');
      // (never inside the instructor's chained line, "Number two, clear." itself (R.paUntilMs: the build sheet v0.0.20 §0 item 32))
      const atMs = Math.ceil(Math.max(now, last + WASH_AFTER_MS, R.paUntilMs ?? 0) / SEC_MS) * SEC_MS;
      post(state, { atMs, prio: 2, kind: 'range-cmd', src: 'arms:range', payload: { cmd: 'wash', i } });
      R.next = { id: 'wash', i, atMs };
    }
    if (R.next.id !== 'wash') return false;
    left = R.next.atMs - now;
  }
  if (left > 0 && !state.skip && !state.time?.doing && ctx?.sim && !pendingOf(state) && stillOf(state)) {
    if (state.stop) leaveStop(state, bus, 'scene');
    if (!state.stop) startActivity(state, bus, ctx, { id: ACTIVITIES['house-showclear'] ? 'house-showclear' : 'idle', args: { ms: whole(left) } });
  }
  return true;
}

// ---- the view ----

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const s2 = (ms) => takeInWords(ms);
const zonesText = (Z) => ZONES.filter(z => Z?.[z]).map(z => `${Z[z]} ${ZONE_PAPER[z]}`).join(', ');
// (a leg's own times: from when it became current (room 1 from GO) to its end)
const legMs = (L) => (L.fromMs !== null && L.clearAtMs !== null ? L.clearAtMs - L.fromMs : null);

// ---- v0.0.20, the card (the build sheet v0.0.20 §1 items 4, 11, 19, 20, 26; COMBAT §25.10.4) ----
//
// The par (parOf, the one reader of H.parMs): a stand's is the class's (PAR_MS by the picker or the sheet) plus its own allowances,
// each the formula the panel shows at the sheet, never measured: 'head' (below rung 2, the hostage card: the head row, careful, less
// the pair) and
// 'far' (below rung 2, a man beyond IMMEDIATE_M 7 m of the point you reach, or met on your walk (the hall's, turning as you enter its
// zone): the plant, POINT_REACH_S). A room's (roomParOf) is its
// bundle's planned time at the sheet (bundle.js planBundle 'room:clear', from where the leg starts: the start mark for room 1, the
// last room's #1 point after) plus the books of its men of yours (the trigger's gap, the take-in's book, the row's) (roomBookOf),
// × ROOM_PAR_K by the leg's kind and the rung's band (the rooms 1.5 below rung 2 and 1.3 from it, the hall 1.0 and 1.4: courses.js,
// the fit), rounded up to ROOM_PAR_STEP_MS; the lane's their sum. Written at the fill (fillPars: L.parMs,
// H.laneParMs and the stands' books H.books, additive; absent on an old save, computed on read).
// The cause (parCauseOf) of a par missed, at its verdict: 'gun' (a stoppage of your own in the window), 'unready' (the rifle neither
// aimed nor at high ready at the sighting), else the larger excess of 'eyes' (the take-in over EYES_K × the sheet's book) and
// 'hands' (the pause to the first round over HANDS_K × the row's; 'feet' below rung 2 where the row planted first); 'eyes' only where
// the take-in is over its allowance, the hands' (or the feet's) where it is within it (the time went after it: v0.0.20's fixer). The instructor's
// dummy is set apart: a click in the window is taken off the time (clickIn), so a par met but for it is met, k.click its time.
// The verdict (houseVerdict): GO or NO-GO against the sheet's standard, read off the run sheet's own record. The trace (traceTick):
// both men and each lane door's leaf every TRACE_MS from GO, into R.house.$trace (runtime only, never saved: house-debrief.js reads
// it, nothing else in src/sim).

/** A missed par's cause: the take-in over EYES_K × the sheet's book, the pause to the first round over HANDS_K × the row's (card C1; my calls). */
export const EYES_K = 1.3, HANDS_K = 1.3;
/** The causes, in the paper's order. */
export const PAR_CAUSES = Object.freeze(['click', 'gun', 'unready', 'eyes', 'hands', 'feet']);
/** The instructor's dummy holds a par's verdict from its click to the first round, at most this long (ms; my call: never a par open for ever on a gun left broken). */
export const PAR_CLICK_MAX_MS = 10_000;
/** The trace: a sample every TRACE_MS of game time from GO to the lane's end, at most TRACE_MAX (the lane's 600 s). */
export const TRACE_MS = 100, TRACE_MAX = 6000;
/** The trace's codes: a man's movement stance and the rifle's carry. */
export const TRACE_STANCES = Object.freeze(['relaxed', 'combat', 'assault', 'kneel']), TRACE_CARRY = Object.freeze(['slungBack', 'slungFront', 'lowReady', 'highReady', 'aimed']);
// (the postures that are "up" at a sighting: the rifle on him at once)
const READY_CARRY = new Set(['aimed', 'highReady']);
// (a stand's row by its face: the failure drill on the armoured plate, the head past the hostage, else the pair)
const rowOfFace = (face) => (face === 'armoured' ? 'shot:failure' : face === 'hostage' ? 'shot:head' : 'shot:pair');
// (the point the leg's #1 reaches: its plan's own, slot 1's side)
const pointOf = (state, P) => (P ? P.points?.[(sideOf(state, P.door, 1) ?? 1) - 1] ?? P.points?.[0] ?? null : null);
// (where a leg starts: the start mark for room 1, the last leg's #1 point after)
function legFrom(state, k) {
  const plan = lanePlanOf(state), prev = k > 0 ? plan.plans[plan.order[k - 1]] : null;
  return prev ? pointOf(state, prev) : [startOf(state).x, startOf(state).z];
}

/**
 * The time the instructor's dummy cost a window [from, to] (ms; 0 where its click fell outside it), at most PAR_CLICK_MAX_MS: from
 * the click to the window's end (the first round on the man, or now), since the press that clicked was the round that would have
 * been first. A par is then judged on its time less this: met within the click when the click itself came inside the par.
 */
export function clickIn(H, from, to) {
  const d = H?.dummy;
  if (!d || d.clickAtMs === null || d.clickAtMs === undefined || d.clickAtMs < from || d.clickAtMs > to) return 0;
  return Math.max(0, Math.min(PAR_CLICK_MAX_MS, to - d.clickAtMs));
}

/** A stand's books at the sheet (pure, at the fill or on read): { takeInMs, rowMs, gapMs, parts: [{ why, ms }] } for its owner (slot 1 is yours). */
export function standBookOf(state, T, { pid = playerId(state), gunId = null } = {}) {
  const k = legOf(T), plan = lanePlanOf(state), P = plan.plans[plan.order[k]] ?? null, at = pointOf(state, P) ?? [T.x, T.z];
  const target = (dM) => ({ key: T.key, dM, x: T.x, z: T.z, kind: T.face });
  const g = gunId ?? gunOn(state, pid), dM = q(dist(at, [T.x, T.z]), 0.01), rung = rungOf(state, pid, 'room');
  const row = (id, tempo = 'normal') => rowPlan(state, pid, id, target(dM), { odds: false, tempo, gunId: g })?.ms ?? 0;
  const parts = [];
  // (the head past the hostage below rung 2, where the row has no aim of its own and the head waits on a careful hold; from rung 2 the
  // aim is the row's and the T sheets met 3b at the class's par on every seed (F56's probe: a 0.40 s allowance let the tier one hold
  // 0.6 s and still meet it))
  if (T.face === 'hostage' && rung < 2) { const head = row('shot:head', 'careful') - row('shot:pair'); if (head > 0) parts.push({ why: 'head', ms: whole(head) }); }
  // (the hall's man turns on your walk into its zone, 5.9 m from its edge: met on the move as a far man is, below rung 2 the row plants first)
  if (rung < 2 && (dM > IMMEDIATE_M || T.trigger?.kind === 'zone')) parts.push({ why: 'far', ms: whole(POINT_REACH_S * 1000) });
  // (the muzzle's turn off its owner's sector onto a man where the room's plan does not aim it: the set's sectors are aimed
  // at the set's men (0° on every threat), a drawn place stands up to 44° off them, and the turn at AIM.turn's rate was all the
  // raider's and the corporal's misses at drawn places 1 and 2 with no other man before (0.83 to 0.94 s against 0.80; the play
  // review of 2026-11-16). A threat's or an armoured man's (the hostage card's head has its own part; the set's 3b meets its class
  // par at 33°, F56); the owner's point, sector and WH, so a man of your #2's is booked by his)
  const turn = T.face === 'threat' || T.face === 'armoured' ? turnOffMs(state, T, P) : 0;
  if (turn > 0) parts.push({ why: 'turn', ms: whole(turn) });
  return { takeInMs: takeInOf({ wf: sheetOf(state, pid)?.os ?? 0, expect: 'area' }).ms, rowMs: row(rowOfFace(T.face)), gapMs: T.trigger?.kind === 'door' || T.trigger?.kind === 'zone' ? T.trigger.gapMs ?? 0 : 0, parts, dM };
}
const bookOf = (state, H, T) => H?.books?.[T.stand] ?? (T.$book ??= standBookOf(state, T));
// (the muzzle's turn (ms) from its owner's sector at his point onto a stand (see standBookOf): the angle off the sector's middle at
// AIM.turn's rate for the owner's WH (turn.base + turn.per × WH °/s, shot.js); 0 with no plan, sector or point)
function turnOffMs(state, T, P) {
  const slot = ownerOf(state, T) ?? 1, pt = P?.points?.[slot - 1] ?? P?.points?.[0], sec = P?.sectors?.find(x => x.slot === slot) ?? P?.sectors?.[0];
  if (!pt || !sec) return 0;
  const H = houseOf(state), who = slot === 2 && H?.twoPid ? H.twoPid : playerId(state), wh = skillsOf(state, who)?.wh ?? 0;
  const off = Math.abs(((Math.atan2(T.z - pt[1], T.x - pt[0]) - sec.yawRad) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI) * 180 / Math.PI;
  return off > TURN_FREE_DEG ? (off - TURN_FREE_DEG) / (AIM.turn.base + AIM.turn.per * wh) * 1000 : 0;
}
/** The turn off a sector that the class's par holds already (°; my call: a degree, the sector's aim on the set's men being exact). */
export const TURN_FREE_DEG = 1;

/** A stand's par (the one reader of H.parMs): { ms, base, parts: [{ why: 'head' | 'far', ms }] }; a null T gives the class's alone. */
export function parOf(state, T, H = houseOf(state)) {
  const base = H?.parMs ?? PAR_MS.basic, parts = T && THREAT_FACES.includes(T.face) ? bookOf(state, H, T).parts ?? [] : [];
  return { ms: base + sum(parts.map(p => p.ms)), base, parts: parts.map(p => ({ ...p })) };
}
/** A par as a roll is said: "Par 3.00 + 0.65 (the head, past the hostage) = 3.65 s"; the class's alone "Par 3.00 s". */
export function parWords(p) {
  const why = { head: 'the head, past the hostage', far: 'met on the move, the plant first', turn: 'the turn off your sector' };
  return p.parts.length ? `Par ${s2(p.base)} ${p.parts.map(x => `+ ${s2(x.ms)} (${why[x.why] ?? x.why})`).join(' ')} = ${s2(p.ms)} s` : `Par ${s2(p.base)} s`;
}

/** A leg's book (ms, unrounded): its bundle's planned time from where it starts plus its men of yours' books (see the block's head); null for no leg. */
export function roomBookOf(state, door, H = houseOf(state), { atMs = state.clock.ms, gunId = null } = {}) {
  const pid = playerId(state), plan = lanePlanOf(state), k = plan.order.indexOf(door);
  if (k < 0) return null;
  // (the instructor's book knows the door (bundle.js lockUnknownOf reads H.$book): a drawn lane door locked is planned as the
  // kick it takes, and its try first (the Open refused, handMsOf), as the stack meets it (the play review of 2026-11-16))
  const was = H?.$book;
  if (H) H.$book = true;
  let B;
  try { B = planBundle(state, pid, 'room:clear', { door, from: legFrom(state, k), atMs }); } finally { if (H) { if (was === undefined) delete H.$book; else H.$book = was; } }
  const tryMs = H?.draw?.mode === 'drawn' && door !== 'hall' && lockedOf(state, door) ? handMsOf(state, pid) : 0;
  const R = rangeOf(state), mine = (R?.turners ?? []).filter(T => legOf(T) === k && THREAT_FACES.includes(T.face) && ownerOf(state, T) === 1);
  const books = mine.map(T => { const b = H?.books?.[T.stand] ?? standBookOf(state, T, { pid, gunId }); return b.gapMs + b.takeInMs + b.rowMs + sum((b.parts ?? []).map(p => p.ms)); });
  return (B?.ms ?? 0) + tryMs + sum(books);
}
/** ROOM_PAR_K for a leg: by its kind (the hall apart from the rooms) and the sheet's rung (below 2, from 2). */
export const roomParK = (state, door, pid = playerId(state)) => ROOM_PAR_K[door === 'hall' ? 'hall' : 'room'][rungOf(state, pid, 'room') >= 2 ? 1 : 0];
/** The rooms' pars planned (roomParOf's calls: a bundle planned each), counted for the tests (never on a read; game-upgrade's par case). */
export const PAR_PLANS = { n: 0 };
/** A room's par (ms, whole ROOM_PAR_STEP_MS): its book (roomBookOf) × ROOM_PAR_K by the leg's kind and the sheet's rung (see the block's head). */
export function roomParOf(state, door, H = houseOf(state), opts = {}) {
  PAR_PLANS.n++;
  const book = roomBookOf(state, door, H, opts);
  return book === null ? null : Math.ceil(book * roomParK(state, door) / ROOM_PAR_STEP_MS) * ROOM_PAR_STEP_MS;
}
/** The fill's pars (testShoothouse's one line, before any setup): each stand's books, each leg's par, the lane's, and the immediate action's book. */
export function fillPars(state, H, gunId = null) {
  const R = rangeOf(state), pid = playerId(state);
  H.books = Object.fromEntries(R.turners.map(T => [T.stand, standBookOf(state, T, { pid, gunId })]));
  for (const L of legsOf(H)) L.parMs = roomParOf(state, L.door, H, { gunId });
  H.laneParMs = sum(legsOf(H).map(L => L.parMs ?? 0));
  const g = gunId ? state.items[gunId] : null;
  // (a saved key: a $ key is stripped from the save, and a loaded lane then recomputed the book from whatever gun was in hand, the
  // P-12 after Transition: the C and D review of 2026-11-16)
  if (g) H.iaBookMs = macroMs(rollerOf(state, pid), g, 'ia', beliefOf(state, gunId));
}
// (a leg's par: the fill's, or the load's on a save from before v0.0.20 (upgradeHousePars); never planned on a read (the
// build sheet §0 item 17: v0.0.20 computed it on read, four planBundles on every read of the timer, the paper and houseNow))
const legParOf = (state, H, L) => L.parMs ?? null;
/** The immediate action's book (ms): the fill's (H.iaBookMs, saved), else, on a save from before it, the gun's in hand now. */
export const iaBookOf = (state, H) => { if (Number.isFinite(H.iaBookMs)) return H.iaBookMs; const pid = playerId(state), g = gunOn(state, pid); return g && state.items[g] ? macroMs(rollerOf(state, pid), state.items[g], 'ia', beliefOf(state, g)) : 0; };

/** A missed par's cause at its verdict (see the block's head): one of PAR_CAUSES but 'click'. first: the first round's time, or null. */
export function parCauseOf(state, H, L, c, T, from, first, now) {
  const R = rangeOf(state), end = first ?? now, st = R?.stoppage;
  if (c.by === 'me' && st && !st.set && st.atMs >= from && st.atMs <= end) return 'gun';
  if (c.by === 'me' && c.carry && !READY_CARRY.has(c.carry)) return 'unready';
  const b = bookOf(state, H, T ?? { stand: c.stand, face: c.face, key: c.key, x: 0, z: 0 });
  const eyes = Number.isFinite(c.takeInMs) ? c.takeInMs - EYES_K * b.takeInMs : end - from;
  const hands = Number.isFinite(c.pauseAtMs) ? end - c.pauseAtMs - HANDS_K * b.rowMs : -Infinity;
  // ('eyes' only for a take-in over its allowance (the play review: the tier one's 50 ms take-in at a book of 50 was
  // "You saw him late", the larger of two shortfalls: with the row's book over the par the hands' excess is always below nought).
  // A take-in within it and the par gone all the same: the time went after it, a step under way holding the pause or no round off
  // it, the hands' (or the feet's, below rung 2, where the row planted first))
  if (hands > eyes || eyes <= 0) {
    const shot = (R?.shots ?? []).find(x => x.key === c.key && x.atMs <= end + TICK_MS);
    return rungOf(state, playerId(state), 'room') < 2 && /@(planted|point|stop)\b/.test(shot?.row ?? '') ? 'feet' : 'hands';
  }
  return 'eyes';
}

/** The lane's par (ms): the fill's, the legs' summed; on a lane set up ("Again from room 2", &setup=) the legs it ran only. */
export const laneParOf = (state, H) => (legsOf(H).some(L => L.setup) ? sum(legsOf(H).filter(L => !L.setup).map(L => legParOf(state, H, L) ?? 0)) : H.laneParMs ?? sum(legsOf(H).map(L => legParOf(state, H, L) ?? 0)));
// (a stand in a room a setup cleared before the lane began: the setup's, never the lane's to count (the hunt of v0.0.20, P3))
const setUpStand = (H, T) => !!legsOf(H)[legOf(T)]?.setup;
/**
 * The instructor's verdict on the lane (pure, read off the run sheet's record): { go (null before the lane's end), why: [VERDICT_WHY keys] }.
 * standard (the build sheet §1 item 10, §4.3; done lens D4): the par class the run is judged by, the lane's own (H.par, the
 * sheet's or the picker's) by default, so every call without it is v0.0.20's to the key. Another class ('basic', 'advanced',
 * 'operator') re-judges each of your judged men's first round against that class's par plus the stand's own allowances (parOf's
 * parts), less the instructor's click as the lane judged it, and returns standard: the class; the lane's par stays the sheet's own
 * (its rooms' books are the sheet's walk, which no class changes; my call). F70 reads it: a sheet's run judged by the next class up.
 */
export function sheetStandard(state) { return houseOf(state)?.par ?? null; }
export function houseVerdict(state, { standard = sheetStandard(state) } = {}) {
  const R = rangeOf(state), H = R?.house;
  if (!H || !H.end) return { go: null, why: [] };
  const std = standard && standard !== H.par && Number.isFinite(PAR_MS[standard]) ? standard : null;
  const legs = legsOf(H), n = (kind) => sum(legs.map(L => L.faults.filter(f => f.kind === kind).length)), why = [];
  if (legs.some(L => L.setup)) why.push('setup');
  if (H.end.why === 'casualty') why.push('casualty');
  // (a lane the instructor's cease fire at a grenade's burst ended leads with it, as a casualty does (the play review:
  // "CEASE FIRE: IN THE ROOM AT THE BURST · NO-GO: A THREAT LEFT STANDING"))
  if (H.end.why === 'burst') why.push('burst');
  if (n('hostage')) why.push('hostage');
  if (n('noshoot')) why.push('noshoot');
  if (R.end?.phase === 'stopped') why.push('stopped');
  if (n('muzzle')) why.push('muzzle');
  if (R.turners.some(T => !isLive(T) && THREAT_FACES.includes(T.face) && T.stoppedAtMs === null)) why.push('standing');
  if (legs.some(L => L.state === 'passed')) why.push('passed');
  if (H.end.why === 'time') why.push('time');
  // (only your own men's pars count against you: a par the #2 missed on a man of his is his (team.js ownerOf, as legView's
  // parMissedMine and the one thing read it; the C and D review of 2026-11-16: the sergeant by T on 1489397426 was NO-GO for his 3a))
  const yours = (L, c) => !H.twoPid || ownerOf(state, turnerAt(state, c.stand)) === 1;
  const missed = sum(legs.map(L => L.contacts.filter(c => THREAT_FACES.includes(c.face) && (std ? c.parMet !== null && c.parMet !== undefined && !metAt(state, H, L, c, std) : c.parMet === false) && c.by === firstBy(state, L, c.key) && yours(L, c)).length));
  if (missed > STANDARD_PARS) why.push('pars');
  // (a lane set up is timed from its first room, so its par is its own rooms', never the whole lane's (the hunt of v0.0.20, P3: the hall
  // alone, 5.5 s, beside "PAR 69.0 S"))
  const laneMs = H.goAtMs === null ? null : H.end.atMs - H.goAtMs, par = laneParOf(state, H);
  if (Number.isFinite(laneMs) && par > 0 && laneMs > par) why.push('lane');
  return { go: !why.length, why, missed, laneMs, laneParMs: par, ...(std ? { standard: std } : {}) };
}
// (a judged contact's first round met at another class's par (houseVerdict's standard): its window as pars() judged it, less the
// instructor's click in it; no first round is a miss)
function metAt(state, H, L, c, std) {
  const T = rangeOf(state)?.turners?.find(x => x.key === c.key), first = c.firstAtMs ?? T?.firstAtMs ?? null;
  if (first === null || first === undefined) return false;
  const from = parFrom(state, L, c.key), cm = c.by === 'me' ? clickIn(H, from, first) : 0, parts = parOf(state, T, H).parts;
  return first - from - cm <= PAR_MS[std] + sum(parts.map(p => p.ms));
}
/** The verdict in the instructor's words: "GO." or "NO-GO: the hostage." (HOUSE_CHIEF.verdict), or null before the lane's end. */
export function verdictWords(state, v = houseVerdict(state)) {
  if (v.go === null) return null;
  const C0 = HOUSE_CHIEF.verdict, pick = (lines) => hashPick(lines, 'house-chief', state.meta.seed, 'verdict');
  if (v.go) return pick(C0.go);
  // (the reason opens a sentence of its own after a full stop ('NO-GO. {why}.'): its first letter a capital, "NO-GO. Too many pars
  // missed.", never "NO-GO. too many": the C and D review of 2026-11-16)
  const line = pick(C0.nogo), why = String(VERDICT_WHY[v.why[0]] ?? v.why[0]);
  return line.replace('{why}', /[.!?]\s*\{why\}/.test(line) ? why.charAt(0).toUpperCase() + why.slice(1) : why);
}

/**
 * The run sheet's TEAM row (the build sheet v0.0.20 §1 item 19; one spread of runSheetOf): "TEAM · LINE CLEAN · #2 IN 1.60 S · HELD
 * OUT 0 · CALLS 15 OF 15 · MARKED 3 OF 3", from the legs' fields of the stack (absent reads zero or none): L.masked (his rounds held
 * by you), L.heelsMs (you past the threshold to him past it: the longest), L.twoHeldMs, B's calls ({ [word]: { due, said } }: L.teamCalls, or
 * L.calls where it is that object: the leg's L.calls is v0.0.12's array of "Clear!"s, so B's must take another name), L.marked,
 * and v0.0.19's sides swapped. null on a lane with no #2.
 */
export function teamRowOf(state, H) {
  if (!H?.twoPid) return null;
  const legs = legsOf(H), rooms = legs.filter(L => L.door !== 'hall' && L.state !== 'ahead');
  const masked = sum(legs.map(L => (L.masked ?? []).length)), heels = legs.map(L => L.heelsMs).filter(Number.isFinite);
  const held = sum(legs.map(L => L.twoHeldMs ?? 0)), calls = legs.flatMap(L => Object.values(L.teamCalls ?? (L.calls && !Array.isArray(L.calls) ? L.calls : {})));
  // (MARKED counts the rooms left or cleared (the play review: the room a casualty ended the lane in was "MARKED 1 OF
  // 2", nobody having left it), as CALLS counts only the calls that came due)
  const due = sum(calls.map(c => c.due ?? 0)), said = sum(calls.map(c => c.said ?? 0)), marked = rooms.filter(L => L.marked).length;
  const markable = rooms.filter(L => L.marked || L.state === 'clear' || L.state === 'passed').length;
  const swapped = Object.keys(H.two?.side ?? {}).length;
  const words = ['TEAM', masked ? `LINE MASKED ${masked}` : 'LINE CLEAN', heels.length ? `#2 IN ${s2(Math.max(...heels))} S` : null, `HELD OUT ${held ? `${s2(held)} S` : '0'}`,
    due ? `CALLS ${said} OF ${due}` : null, rooms.some(L => L.marked !== undefined) || marked ? `MARKED ${marked} OF ${markable}` : null, swapped ? `SIDES SWAPPED ${swapped}` : null].filter(Boolean).join(' · ');
  return { words, masked, heelsMs: heels.length ? Math.max(...heels) : null, heldMs: held, calls: { due, said }, marked, of: markable, swapped };
}

/** The trace's sample (traceTick): a man's x and z to 0.01 m, his facing to 1 degree, his movement stance and his carry as codes, or five nulls. */
function traceOf(state, a) {
  if (!a) return [null, null, null, null, null];
  const c = state.people?.[a.who]?.kit?.carry?.posture ?? null, st = a.stance === 'kneel' ? 'kneel' : a.moveStance ?? 'relaxed';
  const head = Number.isFinite(a.headRad) ? a.headRad : null;
  return [q(a.x, 0.01), q(a.z, 0.01), head === null ? null : Math.round((((head * 180 / Math.PI) % 360) + 360) % 360), TRACE_STANCES.indexOf(st), TRACE_CARRY.indexOf(c)];
}
/**
 * The debrief's trace (the build sheet v0.0.20 §1 item 26; houseRules' one call): every TRACE_MS of game time from GO to the lane's
 * end, at most TRACE_MAX, into R.house.$trace = { fromMs, ms: [], me: [5 a sample], two: [5 a sample], doors: { [door]: [leaf k] },
 * live: { [key]: [x, z] } }: runtime only (a $ key, never saved), so a lane loaded mid-way traces from its load. Read by house-debrief.js
 * alone (tests/syntax.test.mjs).
 */
export function traceTick(state, R, H, now = state.clock.ms) {
  if (!H || H.goAtMs === null || H.end) return;
  const T = (H.$trace ??= { fromMs: now, ms: [], me: [], two: [], doors: {}, live: {} });
  if ((T.ms.length && now - T.ms.at(-1) < TRACE_MS) || T.ms.length >= TRACE_MAX) return;
  T.ms.push(now);
  T.me.push(...traceOf(state, playerActor(state)));
  T.two.push(...traceOf(state, actorOf(state, H.twoPid)));
  for (const L of legsOf(H)) if (L.door !== 'hall') (T.doors[L.door] ??= []).push(q(leafAt(state, L.door, now), 0.01));
  for (const t of R.turners) if (isLive(t)) { const a = t.live?.aid ? state.actors?.list?.find(x => x.id === t.live.aid) : null; (T.live[t.key] ??= []).push(q(a?.x ?? t.x, 0.01), q(a?.z ?? t.z, 0.01)); }
}

/** A leg as the paper and the hud read it. */
function legView(state, H, L, k, now) {
  const P = planOf(state, L), mine = L.contacts.filter(c => c.by === 'me');
  const takeIns = mine.map(c => c.takeInMs).filter(Number.isFinite);
  const firsts = mine.filter(c => Number.isFinite(c.firstAtMs ?? turnerFirst(state, c.key))).map(c => (c.firstAtMs ?? turnerFirst(state, c.key)) - c.seenMs);
  const threats = L.contacts.filter(c => THREAT_FACES.includes(c.face) && c.by === firstBy(state, L, c.key));
  const hot = P?.hot ?? [], covered = hot.filter(h => L.covered[h.id]).length;
  return {
    // (a leg a setup cleared has no time: it was never run (the hunt of v0.0.20, P3: "drill room 1 120.10 s" on the hall's drill, room 1's
    // clock left running from GO))
    k, word: LEG_WORD[k] ?? `LEG ${k + 1}`, room: L.room, door: L.door, state: L.state, setup: !!L.setup, ms: L.setup ? null : legMs(L) ?? (L.fromMs !== null && L.state !== 'ahead' || k === H.cur ? now - (L.fromMs ?? now) : null),
    doorToClearMs: L.openAtMs !== null && L.clearAtMs !== null ? L.clearAtMs - L.openAtMs : null,
    takeIns, firsts, par: threats.length ? (threats.every(c => c.parMet === true) ? 'met' : threats.some(c => c.parMet === false) ? 'missed' : 'open') : null,
    parMissed: threats.filter(c => c.parMet === false).length, parMissedMine: threats.filter(c => c.parMet === false && ownerOf(state, turnerAt(state, c.stand)) === 1).length,
    // (the card: the room's par (legParOf), the pars met within the instructor's click (its longest, ms), and your missed pars by cause)
    parMs: legParOf(state, H, L), clickMs: Math.max(0, ...threats.filter(c => c.parMet === true && c.click > 0).map(c => c.click)) || null,
    causes: threats.filter(c => c.parMet === false && ownerOf(state, turnerAt(state, c.stand)) === 1).reduce((o, c) => { const k = c.cause ?? 'par'; o[k] = (o[k] ?? 0) + 1; return o; }, {}),
    zones: { ...L.zones }, twoZones: { ...L.twoZones }, rounds: L.rounds, corners: { covered, of: hot.length, by: { ...Object.fromEntries(Object.entries(L.covered).map(([h, c]) => [h, c.by])) } },
    doorwayMs: L.funnelMs, faults: L.faults.map(f => ({ ...f })), presses: L.presses, pressAbout: { ...L.pressAbout }, how: { ...L.how }, seen: new Set(L.contacts.map(c => c.key)).size,
    contacts: L.contacts.map(c => ({ ...c, ...(THREAT_FACES.includes(c.face) ? { parMs: parOf(state, rangeOf(state).turners.find(T => T.key === c.key), H).ms, ...parLeftOf(state, H, L, c, now) } : {}) })), inner: L.inner, kit: [...(L.kit ?? []), ...teamMarks(state, H, L)], bangMs: L.bangMs ?? null,
    ...(H.live ? { live: liveLegOf(state, H, k) } : {}),
    // (carried FH-2: why a passed leg was passed, 'stack' | 'door' | 'room'; absent on a leg not passed, or the hall)
    ...(L.passWhy ? { passWhy: L.passWhy } : {}),
  };
}
// (an open threat's par clock as pars() judges it, for the lane timer's strip (the code review: the strip ran each
// man's par from his first sighting by anyone and without the instructor's click, and read "2A HE FIRED FIRST" for 1.25 s on a par
// the sim met within the click, "1B HE FIRED FIRST" on the #2's own man): { parLeftMs } on the record that carries the par (firstBy's),
// from parFrom with clickIn's allowance (held while the click lies in the window, as the verdict is); { parLeftMs: null } on any
// other threat's record, no par running on it (the #2's man before he has seen him), or his answered; 0 on a par missed and not
// yet answered)
function parLeftOf(state, H, L, c, now) {
  if (c.parMet === true || c.by !== firstBy(state, L, c.key)) return { parLeftMs: null };
  const T = rangeOf(state).turners.find(x => x.key === c.key);
  // (a par missed stays missed until a round answers him: 0 left, "HE FIRED FIRST", while he has had no round and is not down)
  if (c.parMet === false) return { parLeftMs: (T?.firstAtMs === null || T?.firstAtMs === undefined) && (T?.stoppedAtMs === null || T?.stoppedAtMs === undefined) ? 0 : null };
  const from = parFrom(state, L, c.key), par = parOf(state, T, H).ms;
  if (!Number.isFinite(from)) return { parLeftMs: null };
  const cm = c.by === 'me' ? clickIn(H, from, now) : 0, held = cm > 0 && cm < PAR_CLICK_MAX_MS && H.dummy.clickAtMs - from <= par;
  return { parLeftMs: held ? Math.max(TICK_MS, from + par + cm - now) : from + par + cm - now };
}
// (v0.0.19: a leg's live men as the paper reads them, or null with none: { n, down, gave, paint (rounds of theirs on you), paintTwo
// (on your number two), paintWould and paintTwoWould (the worst would-have of those, 'FATAL' | 'WOUNDED' | 'STOPPED' | null),
// gapMs (his first round less yours on the first of them who fired: over 0 he fired first), unanswered (that man fired and no round
// of the stack's ever struck back at him) })
function liveLegOf(state, H, k) {
  const R = rangeOf(state), men = R.turners.filter(T => isLive(T) && legOf(T) === k);
  if (!men.length) return null;
  const keys = new Set(men.map(T => T.key)), struck = (H.live.struck ?? []).filter(x => keys.has(x.by)), pid = playerId(state);
  const fired = men.filter(T => Number.isFinite(T.live.firstAtMs)).sort((a, b) => a.live.firstAtMs - b.live.firstAtMs)[0] ?? null;
  const worst = (who) => worstOf(state, struck.filter(x => x.who === who));
  return { n: men.length, down: men.filter(T => liveDown(state, T)).length, gave: men.filter(T => gaveUp(state, T)).length, hurt: men.filter(T => fragHurt(state, T)).length,
    paint: struck.filter(x => x.who === pid).length, paintTwo: struck.filter(x => x.who === H.twoPid).length, paintWould: worst(pid), paintTwoWould: worst(H.twoPid),
    gapMs: fired && Number.isFinite(fired.firstAtMs) ? fired.firstAtMs - fired.live.firstAtMs : null,
    // (he fired and the stack never answered him: fired first on you, though there is no gap to measure (the play
    // review's card named room 1's missed par and left out room 2, where the role-player fired first and killed you unanswered))
    unanswered: !!fired && !Number.isFinite(fired.firstAtMs) };
}
// (a role-player down by the stack's rounds: a strike on him the one rule rated fatal (would.js fatalOf; v0.0.19 the stands'
// own sensor, STOP_TORSO, STOP_HEAD), or by a practice frag's read of 'down' (house-kit.js readsTick, T.live.fragOut: the instructor's
// ruling stands for the live grenade, as it puts a paper stand down); a man the instructor ruled out otherwise is stopped too, and not down)
const downByHits = (state, T) => !!fatalOf(state, T.live?.who) || T.live?.fragOut === 'down';
// (a role-player the frag's read ruled out 'wounded' and nothing put down: the FRAG row's "2A WOUNDED", counted so on the LIVE row and the card)
const fragHurt = (state, T) => T.live?.fragOut === 'wounded' && !liveDown(state, T) && !gaveUp(state, T);
// (each role-player counted once (the review of v0.0.19: "2 ROLE-PLAYERS · 2 DOWN, 1 GAVE UP"): a man whose hands came up before
// a round put him down GAVE UP, whatever was in flight then; DOWN otherwise, by his fatal strike)
const gaveUp = (state, T) => { const f = T.face === 'noshoot' ? fatalOf(state, T.live?.who) : null; return T.face === 'noshoot' && !(f && (!Number.isFinite(T.live?.gaveAtMs) || downAtOf(f) < T.live.gaveAtMs)); };
const liveDown = (state, T) => !gaveUp(state, T) && downByHits(state, T);
// (a struck man's worst would-have on a list of strikes (FATAL, then WOUNDED, then STOPPED), or null on a v0.0.19 lane's or none)
function worstOf(state, xs) {
  const log = state.armoury?.range?.house?.live?.would?.log ?? [], es = xs.map(x => log.find(e => e.shotId === x.shotId && e.on === x.who)).filter(e => e && e.layer !== null);
  return !es.length ? null : es.some(e => e.fatal) ? 'FATAL' : es.some(e => e.why !== 'stopped') ? 'WOUNDED' : 'STOPPED';
}
// (a leg's live words: "LIVE: 1 DOWN · PAINT ON YOU 1 (WOUNDED) · HIS FIRST ROUND 0.40 S BEFORE YOURS"; his round and yours on the one
// tick "FIRST ROUNDS TOGETHER", never "YOURS 0.00 S BEFORE HIS" (the hunt of v0.0.20, gap-zero: the sergeant's room 3 by T on 48213))
const liveWords = (V) => (V ? [`LIVE: ${V.down} DOWN${V.hurt ? `, ${V.hurt} WOUNDED` : ''}${V.gave ? `, ${V.gave} GAVE UP` : ''}`, `PAINT ON YOU ${V.paint}${V.paint && V.paintWould ? ` (${V.paintWould})` : ''}`, V.paintTwo ? `PAINT ON YOUR #2 ${V.paintTwo}${V.paintTwoWould ? ` (${V.paintTwoWould})` : ''}` : null,
  V.gapMs === null ? null : V.gapMs > 0 ? `HIS FIRST ROUND ${s2(V.gapMs)} S BEFORE YOURS` : V.gapMs < 0 ? `YOURS ${s2(-V.gapMs)} S BEFORE HIS` : 'FIRST ROUNDS TOGETHER'].filter(Boolean) : []);
const turnerFirst = (state, key) => rangeOf(state)?.turners?.find(T => T.key === key)?.firstAtMs ?? null;

/** A leg's row of the run sheet (see the header): "ROOM 1 · 7.40 S · TAKE-IN 0.80 · FIRST 2.00 · BASIC MET · 2 A · CORNERS 3 OF 3 · DOORWAY 0.30 S". */
export function legWords(V, H, dummy = null) {
  // (a leg a setup cleared is no leg run: its row says so and nothing more (the hunt of v0.0.20, P3: "SET UP · CORNERS 4 OF 4 · DUMMY
  // CLEARED 1.28 S", the corners the setup marked and the dummy clicked in room 2))
  if (V.setup) return [V.word, 'SET UP'].join(' · ');
  const span = (xs) => (xs.length ? (Math.min(...xs) === Math.max(...xs) ? s2(xs[0]) : `${s2(Math.min(...xs))} TO ${s2(Math.max(...xs))}`) : null);
  const kinds = [...new Set(V.faults.map(f => f.kind))].filter(k => k !== 'funnel' && FAULT_PAPER[k]).map(k => FAULT_PAPER[k]);
  // (the card: the room's time against its par, "6.70 S / 7.5", and a par met within the instructor's click "OPERATOR MET (CLICK 0.67)")
  const par = Number.isFinite(V.parMs) ? ` / ${(V.parMs / 1000).toFixed(1)}` : '';
  return [V.word, V.setup ? 'SET UP' : V.ms !== null ? `${s2(V.ms)} S${par}` : null, V.state === 'passed' ? 'PASSED' : null, V.takeIns.length ? `TAKE-IN ${span(V.takeIns)}` : null,
    V.firsts.length ? `FIRST ${span(V.firsts)}` : null, V.par ? `${H.par.toUpperCase()} ${V.par === 'met' ? `MET${V.clickMs ? ` (CLICK ${s2(V.clickMs)})` : ''}` : V.par === 'missed' ? 'MISSED' : 'OPEN'}` : null,
    zonesText(V.zones) || null, zonesText(V.twoZones) ? `#2 ${zonesText(V.twoZones)}` : null, V.corners.of ? `CORNERS ${V.corners.covered} OF ${V.corners.of}` : null,
    V.doorwayMs ? `DOORWAY ${s2(V.doorwayMs)} S` : null, ...liveWords(V.live), ...kinds, ...(V.kit ?? []), dummy].filter(Boolean).join(' · ');
}

/** The run sheet (see the header): { rows: [{ room, words }], card, one, spinLine, practised }. The one helper of the paper, the card and the instructor's words. */
export function runSheetOf(state, ms = state.clock.ms) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return null;
  BUILT.sheet++;
  // (v0.0.19: on the live lane a leg's clock stops at the lane's end, a casualty's leg its time to the cease fire, never to the wash's)
  const at = H.live && H.end ? Math.min(ms, H.end.atMs) : ms;
  const legs = legsOf(H), views = legs.map((L, k) => legView(state, H, L, k, at));
  const d = H.dummy, dummyWord = d.clickAtMs !== null ? (d.clearedAtMs !== null ? `DUMMY CLEARED ${s2(d.clearedAtMs - d.clickAtMs)} S` : 'DUMMY NOT CLEARED') : null;
  // (the dummy on the leg it clicked in)
  const dumLeg = d.clickAtMs === null ? -1 : legs.findIndex(L => !L.setup && L.fromMs !== null && d.clickAtMs >= L.fromMs && (L.clearAtMs === null || d.clickAtMs <= L.clearAtMs));
  const rows = views.filter(V => V.state !== 'ahead' || V.k <= H.cur).map(V => ({ room: V.room, words: legWords(V, H, V.k === dumLeg ? dummyWord : null) }));
  const card = cardOf(state, R, H, views, ms), one = oneThing(state, H, views);
  // (the card: the TEAM row (teamRowOf) and the verdict (houseVerdict) as their own spreads; house-kit.js weighs its keys
  // against the one thing's own score, so a cause's key is passed to it as v0.0.19's 'par' (its ownScore knows that one))
  const team = teamRowOf(state, H), verdict = houseVerdict(state);
  // (v0.0.19, D2: the kit's spread, {} on a lane with nothing of it: the cease fire's head, the one thing where its fault weighs more)
  // (the play review: on the live lane the wound model's sentences (wouldLines) are the run sheet's own, so the end
  // card shows them under the plan view, where the hot wash stands down: the page said only "WOULD HAVE BEEN: WOUNDED, CHEST")
  return { rows, card, one, spinLine: hashPick(HOUSE_CHIEF.spin, 'house-chief', state.meta.seed, 'spin'), practised: practisedOf(state, H, views), ...(team ? { team } : {}), verdict: { ...verdict, words: verdictWords(state, verdict) },
    ...(H.live ? { would: wouldLines(state, H) } : {}),
    ...kit2Marks(state, H, views, { card, one: one.key.startsWith('par:') ? { ...one, key: 'par' } : one }) };
}

// (the floor's gravity on the card, "1 G" in the Wheel, from the environment (the user's rule of 2026-11-08: the house is at 1 G))
const gWords = (state) => { const me = playerActor(state), g = gravityAt(state, null, me?.x ?? 0, me?.z ?? 0).gG; return `${Math.round(g * 100) / 100} G`; };
// (the card's line: COMBAT §25.10.4's)
function cardOf(state, R, H, views, ms) {
  const label = (TEST_SHEETS[H.tier]?.label ?? H.tier).toUpperCase();
  // (the hunt of v0.0.20, P3: a lane set up counts the rooms it ran and the men in them, never the setup's: "3 ROOMS · 6 OF 6 THREATS"
  // was read off room 2's drill)
  const rooms = views.filter(V => !V.setup && V.door !== 'hall' && (V.state === 'clear' || V.state === 'passed')).length;
  const laneMs = H.goAtMs === null ? null : (H.end?.atMs ?? ms) - H.goAtMs;
  // (v0.0.19: the role-players apart, on their own words (liveCard): a man who gave up is neither a threat down nor a no-shoot)
  const stands = R.turners.filter(T => !isLive(T) && !setUpStand(H, T));
  const threats = stands.filter(T => THREAT_FACES.includes(T.face)), down = threats.filter(T => T.stoppedAtMs !== null).length;
  const nsAll = stands.filter(T => T.face === 'noshoot' || T.face === 'hostage');
  // (a hostage hit by a round of the leg's tally, or by a frag's balls (house-kit.js's hit record, `by: 'frag'`, has no zone: the
  // review of v0.0.19 found "FRAGGED THE HOSTAGE" beside "2 NO-SHOOTS UNTOUCHED"))
  const nsHit = nsAll.filter(T => T.face === 'noshoot' ? T.hits.length > 0 : T.hits.some(h => h.by === 'frag') || views.some(V => (V.zones.hostage ?? 0) + (V.twoZones.hostage ?? 0) > 0 && V.k === legOf(T))).length;
  // (on the live lane a room whose man's first round came before the stack's (liveLegOf's gapMs over 0, the row's "HIS FIRST ROUND
  // 0.11 S BEFORE YOURS") is one he fired first in, whatever the book's par says: the hunt of v0.0.20 (par-met-first) found the room
  // a man fired first in and killed you left off the card, the line built from the missed pars alone)
  const firstOn = views.filter(V => V.parMissed > 0 || (V.live?.gapMs ?? 0) > 0 || V.live?.unanswered).map(V => (V.k === 3 ? 'THE HALL' : `ROOM ${V.k + 1}`));
  const takeIns = views.flatMap(V => V.takeIns);
  // (v0.0.19: on the live lane a par still open at the lane's end (a casualty's room) is neither met nor missed)
  const pars = views.filter(V => V.par && !(H.live && V.par === 'open')), met = pars.every(V => V.par === 'met');
  const head = R.end?.phase === 'stopped' ? `STOPPED: ${(FAULT_WORDS[R.end.why] ?? R.end.why ?? '').toUpperCase()}` : H.end?.why === 'time' ? 'TIME' : H.end?.why === 'dry' ? 'DRY' : H.end?.why === 'casualty' ? 'CASUALTY' : null;
  // (the card: the instructor's verdict leads the line once the lane is over, "GO" or "NO-GO: THE HOSTAGE" (houseVerdict);
  // where the line already leads with why it stopped (STOPPED, TIME, DRY, CASUALTY) that head is the NO-GO, said once)
  const v = houseVerdict(state), verdict = v.go === null ? null : v.go ? 'GO' : `NO-GO: ${String(VERDICT_WHY[v.why[0]] ?? v.why[0]).toUpperCase()}`;
  // (a lane set up on the hall ran no room: "THE HALL", never "0 ROOMS"; and a no-shoot only where there was one to touch)
  const setUp = views.some(V => V.setup), ranWords = setUp && !rooms ? 'THE HALL' : `${rooms} ROOM${rooms === 1 ? '' : 'S'}`;
  // (a burst's cease fire is its head too, house-kit.js kitMarks' "CEASE FIRE: …" before the line: the NO-GO said once)
  return [head || H.end?.why === 'burst' ? null : verdict, head, ...(H.live ? casualtyWords(state, R, H) : []), laneCardOf(H), label, `AT ${gWords(state)}`, ranWords, laneMs !== null ? `${(laneMs / 1000).toFixed(1)} S` : null,
    Number.isFinite(laneMs) && Number.isFinite(v.laneParMs ?? laneParOf(state, H)) ? `PAR ${((v.laneParMs ?? laneParOf(state, H)) / 1000).toFixed(1)} S` : null,
    `${down} OF ${threats.length} THREATS`, nsHit ? `${nsHit} OF ${nsAll.length} NO-SHOOTS HIT` : nsAll.length || !setUp ? `${nsAll.length} NO-SHOOT${nsAll.length === 1 ? '' : 'S'} UNTOUCHED` : null, ...(H.live ? liveCard(state, R, H) : []),
    firstOn.length ? `FIRED FIRST ON YOU: ${firstOn.join(', ')}` : null,
    takeIns.length ? `TAKE-IN ${s2(Math.min(...takeIns))}${Math.max(...takeIns) !== Math.min(...takeIns) ? ` TO ${s2(Math.max(...takeIns))}` : ''} S` : null,
    pars.length ? `${H.par.toUpperCase()}: ${met ? 'MET' : `MISSED ${sum(pars.map(V => V.parMissed))}`}` : null].filter(Boolean).join(' · ');
}

// (v0.0.19: the role-players on the card: "2 ROLE-PLAYERS · 1 DOWN, 1 GAVE UP · PAINT ON YOU: NONE" ("PAINT ON YOU: 1 TORSO", "PAINT ON
// YOUR #2: …" where he took some); v0.0.20: a man struck and neither down nor given up "1 HIT AND FIGHTING ON", and after a marine's
// paint what the live rounds would have done, "WOULD HAVE BEEN: WOUNDED, CHEST AND BELLY" (or "STOPPED BY THE SOFT PANEL", "FATAL"))
function liveCard(state, R, H) {
  const men = R.turners.filter(T => isLive(T) && !setUpStand(H, T)), pid = playerId(state), struck = H.live.struck ?? [];
  const parts = (who) => { const xs = struck.filter(x => x.who === who); if (!xs.length) return null; const t = xs.filter(x => struckPart(state, x) === 'torso').length, h = xs.filter(x => struckPart(state, x) === 'head').length, o = xs.length - t - h; return [t ? `${t} TORSO` : null, h ? `${h} HEAD` : null, o ? `${o} LIMB` : null].filter(Boolean).join(', '); };
  const would = (who) => { const w = wouldOn(state, who).list.filter(e => e.layer !== null); if (!w.length) return null; if (w.some(e => e.fatal)) return 'FATAL'; const hurt = w.filter(e => e.why !== 'stopped'); return hurt.length ? `WOUNDED${hurt.some(e => e.where) ? `, ${[...new Set(hurt.map(e => e.where).filter(Boolean))].map(x => x.toUpperCase()).join(' AND ')}` : ''}` : strikeWords(w[0]); };
  const paint = (who, word) => { const p = parts(who); if (!p) return null; const w = would(who); return `${word}: ${p}${w ? ` · WOULD HAVE BEEN: ${w}` : ''}`; };
  const down = men.filter(T => liveDown(state, T)).length, gave = men.filter(T => gaveUp(state, T)).length, hurt = men.filter(T => fragHurt(state, T)).length;
  const fighting = men.filter(T => T.hits.length && !liveDown(state, T) && !gaveUp(state, T) && !fragHurt(state, T) && T.live.st !== 'down').length;
  return [`${men.length} ROLE-PLAYER${men.length === 1 ? '' : 'S'}`, `${down} DOWN${hurt ? `, ${hurt} WOUNDED` : ''}${gave ? `, ${gave} GAVE UP` : ''}`, fighting ? `${fighting} HIT AND FIGHTING ON` : null,
    paint(pid, 'PAINT ON YOU') ?? 'PAINT ON YOU: NONE', H.twoPid ? paint(H.twoPid, 'PAINT ON YOUR #2') : null].filter(Boolean);
}
// (a strike on the stack by where it went: 'head', 'torso' or 'limb', as the would-have rated it (would.js: an arm in front of the
// carrier draws the round onto the arm, penetrate.js bodyHit), the strike's own part where it has no rating (a v0.0.19 lane's count):
// the card counts the paint where the instructor said it and the wound is (the hunt of v0.0.20, arm-card: "You took paint, left arm."
// and "WOUNDED, CHEST AND LEFT ARM" beside "PAINT ON YOU: 2 TORSO"))
function struckPart(state, x) {
  const e = state.armoury?.range?.house?.live?.would?.log?.find(w => w.shotId === x.shotId && w.on === x.who), p = e?.layer !== null && e?.part ? e.part : x.part;
  return p === 'head' ? 'head' : p === 'torso' ? 'torso' : 'limb';
}
// (the casualty's own words after the card's head: v0.0.20 "FATAL: THE CHEST, 2ND ROUND, THROUGH THE SOFT PANEL, ROOM 2, BY THE MAN
// IN THE DEEP CORNER" ("FATAL ON YOUR #2: A ROUND IN THE HEAD, …" when his; the why by would.js WOULD_WHY, the round its place among
// the strikes on him); a lane v0.0.19 saved, v0.0.19's "PAINT: 2 TORSO, ROOM 2, BY …")
function casualtyWords(state, R, H) {
  const K = H.end?.why === 'casualty' ? H.live.casualty : null;
  if (!K) return [];
  const xs = (H.live.struck ?? []).filter(x => x.who === K.who), t = xs.filter(x => struckPart(state, x) === 'torso').length, h = xs.filter(x => struckPart(state, x) === 'head').length;
  const T = K.by ? R.turners.find(x => x.key === K.by) : null, k = T ? legOf(T) : -1, mine = K.who === playerId(state);
  // (G5: on a drawn house the man by his post's name (opfor.js spotOf's, the drawn post's words placed with his room), never the
  // set's LIVE_NAMES by a stand id that is also '2a' there)
  const name = H.draw?.mode === 'drawn' ? spotOf(state, T ?? {})?.name ?? T?.name : LIVE_NAMES[T?.stand] ?? T?.name;
  const where = `${k >= 0 ? `, ${LEG_WORD[k]}` : ''}${T ? `, BY ${String(name ?? 'the man').toUpperCase()}` : ''}`;
  const f = fatalOf(state, K.who);
  if (!f || f.why === 'count') return [`PAINT${mine ? '' : ' ON YOUR #2'}: ${[t ? `${t} TORSO` : null, h ? `${h} HEAD` : null].filter(Boolean).join(', ') || 'HIT'}${where}`];
  // (the strike's place among the strikes on him, from anyone: "2ND STRIKE ON YOU", never "2ND ROUND" beside a shooter's name, which
  // read as his second (the review of v0.0.20's asks))
  // (a wound that put him down later (would.js wouldTick): "SHOCK FROM THE BLOOD LOST 199.0 S AFTER THE 1ST STRIKE ON YOU")
  const n = xs.findIndex(x => x.shotId === f.shotId) + 1, layer = f.layer && f.layer !== 'bare' ? `, THROUGH ${String(LAYERS[f.layer]?.word ?? f.layer).toUpperCase()}` : '';
  const after = Number.isFinite(f.downAtMs) ? ` ${((f.downAtMs - f.atMs) / 1000).toFixed(1)} S AFTER THE` : ',';
  return [`FATAL${mine ? '' : ' ON YOUR #2'}: ${WOULD_WHY[f.why] ?? 'FATAL'}${n > 0 ? `${after} ${ordinal(n)} STRIKE ON ${mine ? 'YOU' : 'HIM'}` : ''}${layer}${where}`];
}
// (1ST, 2ND, 3RD, 4TH …)
const ordinal = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] ?? 'TH'}`;
/** The role-players by their stand, in the paper's words (v0.0.19): room 2's deep corner and room 3's near leg. */
export const LIVE_NAMES = Object.freeze({ '2a': 'the man in the deep corner', '3a': 'the man in the near leg' });

// (the instructor's one thing to do differently: the worst number of the run, by its weight (COMBAT §17.2; my call on the weights))
function oneThing(state, H, views) {
  const n = (kind) => sum(views.map(V => V.faults.filter(f => f.kind === kind).length));
  // (carried FH-2: a threat left standing in a room passed at the door is that pass's consequence, not its cause: not counted)
  const nStanding = sum(views.map(V => (V.passWhy === 'door' || V.passWhy === 'footing' ? 0 : V.faults.filter(f => f.kind === 'standing').length)));
  const passed = (why) => views.filter(V => V.passWhy === why).length;
  const doorway = sum(views.map(V => V.doorwayMs));
  const score = {
    // (the par's advice from your own corner's men only: a miss on the #2's is his (the fixer's of 0.0.12))
    hostage: n('hostage') * 100, noshoot: n('noshoot') * 90, muzzle: n('muzzle') * 70, standing: nStanding * 60,
    // (its build sheet item 11, carried FH-2: a room passed, by why: at its open door, never crossed (over the muzzle's 70 and
    // under the no-shoot's 90: a lane lost at the door is the first thing to fix), at its stack, the door never opened, or inside, never
    // called; the hall's pass keeps `time` (my calls). Before, every pass was `time`, "Too slow through the rooms. …", beside the NO-GO)
    'passed:door': passed('door') * PASS_DOOR_W, 'passed:stack': passed('stack') * PASS_STACK_W, 'passed:room': passed('room') * PASS_ROOM_W,
    // (the fixer of v0.0.24's play review, M1: rooms passed with no footing, the lane's whole lesson, over every other)
    'passed:footing': passed('footing') * PASS_FOOTING_W,
    // (the card (the build sheet v0.0.20 §1 item 4): a missed par scored by its cause, each its own advice ('par:click' is a
    // par met within the dummy's click, scored 0; 'par' a contact recorded before the causes), your number two's line masked by you)
    ...Object.fromEntries(Object.entries(views.reduce((o, V) => { for (const [k, c] of Object.entries(V.causes ?? {})) o[k] = (o[k] ?? 0) + c; return o; }, {})).map(([k, c]) => [k === 'par' ? 'par' : `par:${k}`, c * 40])),
    masked: n('masked') * 65, heels: legsOf(H).filter(L => L.heelsMs > HEELS_LATE_MS).length * 20,
    funnel: n('funnel') * 30 + Math.round(doorway / 100), corner: n('corner') * 25, door: n('door') * 20,
    // (the dummy: not cleared, or cleared slower than HANDS_K × the sheet's immediate action (the click is the instructor's, and a
    // tier one's 0.50 s at his own pace no lesson: the card's C1, 6 of 20 tier one lanes told it))
    dummy: H.dummy.clickAtMs !== null ? (H.dummy.clearedAtMs === null ? 50 : dummyOver(state, H) > 0 ? Math.max(1, Math.round(dummyOver(state, H) / 200)) : 0) : 0, time: n('time') * 15,
    // (v0.0.19, the live lane's: paint that ended it first, a man who gave up shot, a room reopened, a man left uncovered; my calls)
    // (FL22-5: the casualty scored by its cause, as a missed par is (casualtyKey: your casualty a wound bled down later its own
    // lesson, 'casualty:bled' (would.js wouldTick, the hunt of v0.0.20), then 'casualty:<cause>'; 'slow' and your number two's keep
    // 'casualty', which whoseOne words as his)
    ...(H.live ? { [casualtyKey(state, H)]: n('casualty') * 120, surrendered: n('surrendered') * 95, reopened: n('reopened') * 55, uncovered: n('uncovered') * 45,
      // (the play review: paint on you or your number two short of the casualty, now that a wound no longer ends the
      // lane (the user's answer of 2026-11-16), weighs as a strike; a casualty's own paint is the casualty's line; my call on 80)
      paint: n('casualty') ? 0 : paintOf(views) * 80 } : {}),
  };
  const worst = Object.entries(score).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  // (the play review: a lane ended before a room was cleared or passed is not "Clean lane": nothing was run; the hunt of v0.0.20, P3: on a
  // lane set up the rooms the setup cleared were never run, the hall drilled alone is, and with nothing to fault the lesson is the
  // lane it left out ('setup'), never "Clean lane. Again, faster." beside its NO-GO)
  const setUp = views.some(V => V.setup);
  const ran = views.some(V => !V.setup && (setUp || V.door !== 'hall') && (V.state === 'clear' || V.state === 'passed'));
  const key = whoseOne(state, H, views, worst && worst[1] > 0 ? worst[0] : ran ? (setUp ? 'setup' : 'clean') : 'unplayed');
  // (the doorway's advice below rung 2 names the Watch, the one decision that keeps the feet going through the door)
  const keys = rungOf(state, playerId(state), 'room') < 2;
  const lines = key === 'funnel' && keys && HOUSE_CHIEF.one.funnelKeys ? HOUSE_CHIEF.one.funnelKeys : key === 'par:unready' && keys ? HOUSE_CHIEF.one['par:unreadyKeys']
    : key === 'passed:door' && keys ? HOUSE_CHIEF.one['passed:doorKeys'] : HOUSE_CHIEF.one[key] ?? HOUSE_CHIEF.one.par;
  return { key, text: hashPick(lines, 'house-chief', state.meta.seed, 'one', key), score: worst?.[1] ?? 0 };
}
// (the one thing's key for a casualty, in the merge's order (the v0.0.22 integration): your late one 'casualty:bled' (the hunt of
// v0.0.20's paint fix), then 'casualty:<cause>' for yours, 'casualty' for 'slow' and for your #2's (whoseOne words his after the score))
const casualtyKey = (state, H) => {
  const K = H.live?.casualty;
  if (K?.late && K.who === playerId(state)) return 'casualty:bled';
  const c = casualtyCause(state, H);
  return c && c !== 'slow' ? `casualty:${c}` : 'casualty';
};
/**
 * Why the casualty happened (its build sheet's item 5, FL22-5), from the record at the fatal strike, the first that holds:
 * 'click', a stoppage of yours (the instructor's dummy, or your own) between your sighting of the man and his fatal strike, him within
 * specials.js TRANSITION_NEAR_M 10 m and your P-12 holstered (the reflex card's "Transition: pistol", the DI's offer there; one distance
 * for one quantity, never a new 5 m) and your rung 2 or more (below it the DI's line at a stoppage is Tap, rack: v0.0.22's fixer); 'fought', a round of yours struck him before his fatal one and he fought on; 'unseen', his fatal
 * round before your take-in of him ended (no pause of yours on him by then); 'slow', the rest (the line as built). Your #2 the
 * casualty: 'slow'. Null with no casualty. Pure.
 */
export function casualtyCause(state, H = houseOf(state)) {
  const K = H?.live?.casualty, pid = playerId(state);
  if (!K) return null;
  if (K.who !== pid) return 'slow';
  const R = rangeOf(state), T = K.by ? R?.turners?.find(x => x.key === K.by) ?? null : null;
  if (!T) return 'slow';
  const L = legsOf(H)[legOf(T)], mine = (L?.contacts ?? []).filter(k => k.key === T.key && k.by === 'me');
  const seenMs = mine.length ? Math.min(...mine.map(k => k.seenMs)) : null;
  const clicks = [H.dummy?.clickAtMs, R.stoppage?.atMs].filter(Number.isFinite);
  const me = playerActor(state), near = !!me && Math.hypot(T.x - me.x, T.z - me.z) <= TRANSITION_NEAR_M;
  // (the DI's own rule (instinct/cqb.js answerOf): below rung 2 a stoppage's line is the card's Tap, rack, and the pistol only from it;
  // the play review of v0.0.22 (2026-11-17) heard "Tap, rack, back on." at the click and then the lesson "That close, a click means
  // the pistol." on the private's lane: below rung 2 the lesson is never the click's)
  if (seenMs !== null && near && rungOf(state, pid, 'room') >= 2 && !drawnPistol(state, pid) && !!holsteredPistol(state, pid) && clicks.some(ms => ms >= seenMs && ms <= K.atMs)) return 'click';
  if ((T.hits ?? []).some(h => h.by === 'me' && h.atMs < K.atMs)) return 'fought';
  if (!mine.some(k => Number.isFinite(k.pauseAtMs) && k.pauseAtMs <= K.atMs)) return 'unseen';
  return 'slow';
}
// (the hunt of v0.0.20's T4: the casualty's and the paint's one thing said to whom it happened. Your number two the casualty:
// 'casualty:two', or 'casualty:two:yours' where the man who shot him stood in your sector (team.js ownerOf 1); paint on him alone
// (none on you): 'paint:two'. The weights are the same: only the words move, never the key that wins)
function whoseOne(state, H, views, key) {
  const K = H.live?.casualty, two = H.twoPid;
  if (key === 'casualty' && K && two && K.who === two) {
    const T = K.by ? rangeOf(state).turners.find(x => x.key === K.by) : null;
    return T && ownerOf(state, T) === 1 ? 'casualty:two:yours' : 'casualty:two';
  }
  if (key === 'paint' && two && !sum(views.map(V => V.live?.paint ?? 0)) && sum(views.map(V => V.live?.paintTwo ?? 0))) return 'paint:two';
  return key;
}
/** A room passed at its open door, at its stack, inside it: the one thing's weights (carried FH-2; my calls). */
export const PASS_DOOR_W = 75, PASS_STACK_W = 40, PASS_ROOM_W = 30, PASS_FOOTING_W = 200;
// (your number two in the room this long after you is late on your heels: the one thing's "Let him in with you." (F48's TWO_HEELS_MS))
const HEELS_LATE_MS = 2000;
// (the dummy's clearing over HANDS_K × the sheet's immediate action (ms; ≤ 0 within it))
const dummyOver = (state, H) => (H.dummy.clearedAtMs ?? 0) - (H.dummy.clickAtMs ?? 0) - HANDS_K * iaBookOf(state, H);

// (the live lane's strikes on the stack, short of the casualty or with it: yours and your number two's, by the legs' own count)
const paintOf = (views) => sum(views.map(V => (V.live?.paint ?? 0) + (V.live?.paintTwo ?? 0)));
/**
 * Whether a leg was a clean repetition (COMBAT §25.3.2; the build sheet v0.0.21 §1 item 24): a room (never the hall) cleared with no
 * fault called (a doorway over FUNNEL_FAULT_MS, a hot zone not looked at, the muzzle over a teammate, a no-shoot hit, a threat left
 * standing: each the leg's fault) and, on the live lane, no paint on the stack (v0.0.20's fixer, the play review's "3 clean rooms"
 * on a lane you were wounded in). The one judge: the paper's "clean rooms" (practisedOf) and the career's count (skills/drills.js
 * drillRep's clean) read it. leg: the leg's index on the lane, or the leg itself.
 */
export function cleanRoomOf(state, leg) {
  const H = houseOf(state), legs = legsOf(H), L = typeof leg === 'number' ? legs[leg] ?? null : leg;
  // (a room a setup cleared was never run: not clean, not counted (the hunt of v0.0.20, P3: "3 clean rooms" on room 2's drill))
  if (!L || L.setup || L.door === 'hall' || L.state !== 'clear' || (L.faults ?? []).length) return false;
  // (v0.0.21's integration: v0.0.20's paint rule, read from the leg's live men as the paper reads them)
  const V = H.live ? liveLegOf(state, H, legs.indexOf(L)) : null;
  return !((V?.paint ?? 0) + (V?.paintTwo ?? 0));
}
// (what a career would count: the clean rooms (cleanRoomOf), toward practised at REPS_PRACTISED; a test sheet's never moves)
function practisedOf(state, H, views) {
  const clean = legsOf(H).filter(L => cleanRoomOf(state, L)).length;
  return { clean, rooms: views.filter(V => V.door !== 'hall').length, words: `${clean} clean room${clean === 1 ? '' : 's'}: a career would count ${clean === 1 ? 'it' : 'them'} toward practised. A test sheet's never move.` };
}

/** The hot wash (see the header): { lines, spinLine, bars: [{ room, key, face, takeInMs, parMs (null for a no-shoot: no par to meet), firstMs }] }. */
export function hotWashOf(state) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return null;
  // (the card: the verdict said last ("GO." / "NO-GO: the hostage."); each bar's par the stand's own (parOf) with its roll's
  // words, its cause where missed, and the instructor's click across its track (clickMs from the sighting, its own grey segment))
  const sheet = runSheetOf(state), lines = [hashPick(HOUSE_CHIEF.wash, 'house-chief', state.meta.seed, 'wash'), ...sheet.rows.map(r => r.words), ...(sheet.would ?? []), sheet.team?.words ?? null, sheet.one.text, sheet.verdict?.words ?? null].filter(Boolean);
  const d = H.dummy, bars = legsOf(H).flatMap(L => L.contacts.filter(c => c.by === 'me').map(c => {
    const T = R.turners.find(x => x.key === c.key), p = THREAT_FACES.includes(c.face) ? parOf(state, T, H) : null, first = c.firstAtMs ?? turnerFirst(state, c.key);
    const click = d.clickAtMs !== null && d.clickAtMs >= c.seenMs && (first === null || d.clickAtMs <= first) ? { clickMs: d.clickAtMs - c.seenMs, clickToMs: (d.clearedAtMs ?? d.clickAtMs) - c.seenMs } : {};
    return { room: L.room, key: c.key, face: c.face, takeInMs: c.takeInMs, parMs: p?.ms ?? null, ...(p?.parts.length ? { parWords: parWords(p) } : {}), firstMs: first !== null ? first - c.seenMs : null, ...(c.cause ? { cause: c.cause } : {}), ...(c.parMet === false ? { missed: true } : {}), ...click };
  }));
  return { lines, spinLine: sheet.spinLine, bars, verdict: sheet.verdict };
}

// (the hot wash's word on what the live rounds would have done, one line for each marine they struck, in the wound model's
// sentences (would.js wouldWords), never a number: "What those rounds would have done: you, a gunshot wound in the chest, …")
// v0.0.20's review: the verdict first for a fatal strike ("down, and staying down: the chest"), and the words read at the strike that
// decided it, the knock's left out (the rule leaves it out): read at the lane's end they said "knocked down." or not by when it ended)
function wouldLines(state, H) {
  const out = [];
  for (const [who, word] of [[playerId(state), 'you'], [H.twoPid, 'your number two']]) {
    if (!who) continue;
    const w = wouldWash(state, who);
    if (w.length) out.push(`What those rounds would have done: ${word}, ${w.join('; ')}.`);
    else if (wouldOn(state, who).stopped) out.push(`What those rounds would have done: ${word}, nothing; the panel took ${wouldOn(state, who).stopped === 1 ? 'it' : 'them'}.`);
  }
  return out;
}

/** The aspects the score card asks about, in numbers: the pause (the take-ins), the drill (times, presses, how), the shots (rounds, zones, rows). */
function aspectsOf(state, H, views) {
  const takeIns = views.flatMap(V => V.takeIns), firsts = views.flatMap(V => V.firsts);
  const shots = { rounds: sum(views.map(V => V.rounds)), zones: {} };
  for (const V of views) for (const [z, n] of Object.entries(V.zones)) shots.zones[z] = (shots.zones[z] ?? 0) + n;
  return {
    pause: { n: takeIns.length, minMs: takeIns.length ? Math.min(...takeIns) : null, maxMs: takeIns.length ? Math.max(...takeIns) : null, firstMinMs: firsts.length ? Math.min(...firsts) : null },
    drill: { legs: views.map(V => ({ room: V.room, ms: V.ms, presses: V.presses, how: V.how, doorwayMs: V.doorwayMs })), presses: sum(views.map(V => V.presses)) },
    shots: { ...shots, two: { fired: H.two.fired, hits: H.two.hits }, dummy: { ...H.dummy } },
    // (the card (the build sheet v0.0.20 §1 item 10): six aspects, the team (your #2: in on his cue, his calls, his admin:
    // the TEAM row's numbers), the panel (the keys: presses, by hand or by a row, and the step panel's layout) and the feel (the walk,
    // the sound, the look: what was played, the page's runtime settings the sim reads, never saves))
    team: H.twoPid ? { ...(teamRowOf(state, H) ?? {}), fired: H.two.fired, hits: H.two.hits } : null,
    panel: { presses: sum(views.map(V => V.presses)), keys: sum(views.map(V => V.how?.keys ?? 0)), rows: sum(views.map(V => V.how?.bundle ?? 0)), layout: state.$panel ?? null },
    feel: { cycle: state.$cycle ?? null, look: state.$look ? { ...state.$look } : null },
  };
}

// (a drawn house's letter where it is a named one: its record's layout, else its code's (assemble.js laneWordOf); null otherwise)
export const namedLaneOfDraw = (draw) => { const w = draw?.layout ?? laneWordOf(draw?.code); return w === 'B' || w === 'C' ? w : null; };
/** The house as the hud, the bots and the end card read it (see the header), or null off the house course. */
export function houseNow(state, ms = state.clock.ms) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return null;
  // (on the live lane the legs stop at the lane's end, as runSheetOf's do: a casualty's card timed room 2 to the range's end, 133.20 s
  // beside the run sheet's 15.85 s (the review of v0.0.20's asks; v0.0.19's own))
  const at = H.live && H.end ? Math.min(ms, H.end.atMs) : ms;
  const views = legsOf(H).map((L, k) => legView(state, H, L, k, at));
  const two = state.people?.[H.twoPid], faults = views.flatMap(V => V.faults);
  // (the run sheet built on its first read only (summary, sheet, verdict), never by a bot's or the sim's read of the
  // view: it was a quarter of a lane's CPU; a getter is enumerable, so JSON and the debug handle still see it)
  let sheet0 = null;
  const sheetOnce = () => (sheet0 ??= runSheetOf(state, ms));
  return {
    // (a named house says its letter, B or C, as the card and the paper do (its record's layout, else its code's: a pasted
    // code of B's rooms is B); another drawn house none, and `drawn` says it is one (the timer's head "NEW LAYOUT"))
    tier: H.tier, label: TEST_SHEETS[H.tier]?.label ?? H.tier, lane: H.draw ? namedLaneOfDraw(H.draw) : H.lane, drawn: !!H.draw, cmd: R.cmd?.id ?? null, cmdAtMs: R.cmd?.atMs ?? null, hot: R.hot, goAtMs: H.goAtMs,
    timerMs: H.goAtMs === null ? null : (H.end?.atMs ?? ms) - H.goAtMs, par: H.par, parMs: parOf(state, null, H).ms, cur: H.cur, curRoom: curLeg(H)?.room ?? null,
    rooms: views.slice(0, 3), hall: views[3], legs: views,
    two: { pid: H.twoPid, name: two ? `${two.service?.rank ?? ''} ${two.name?.family ?? ''}`.trim() : null, rank: two?.service?.rank ?? null, rung: H.two.rung, fired: H.two.fired, hits: H.two.hits },
    dummy: { ...H.dummy }, contacts: views.flatMap(V => V.contacts), faults, presses: sum(views.map(V => V.presses)),
    aspects: aspectsOf(state, H, views), get summary() { return sheetOnce().card; }, get sheet() { return sheetOnce(); }, end: H.end, rangeEnd: R.end, standby: H.standby ? { ...H.standby } : null, wash: H.wash,
    // (the card: the verdict and the lane's par)
    get verdict() { return sheetOnce().verdict; }, laneParMs: legsOf(H).some(L => L.setup) ? laneParOf(state, H) : H.laneParMs ?? null,
    turners: R.turners.map(T => ({ key: T.key, stand: T.stand, room: T.room, slot: T.slot, owner: ownerOf(state, T), face: T.face, x: T.x, z: T.z, facingK: q(facingOf(T, ms), 0.001), down: T.stoppedAtMs !== null, turned: T.turnAtMs !== null && T.turnAtMs <= ms,
      // (v0.0.19: a role-player's: live, the instructor's ruling (out) and whether he is covered, as the stack sees it)
      ...(isLive(T) ? { live: true, out: accountedOf(state, T, ms) === 'out', covered: ['down', 'hands'].includes(accountedOf(state, T, ms)) } : {}) })),
    ...(H.live ? { live: { mode: H.live.mode, casualty: H.live.casualty ? { ...H.live.casualty } : null, reopened: { ...(H.live.reopened ?? {}) }, struck: (H.live.struck ?? []).length } } : {}),
  };
}

/** rangeNow's shape on the house course (handling.js rangeNow): the end card's summary the card's line. */
export function houseRangeNow(state, R, ms = state.clock.ms) {
  const N = houseNow(state, ms), threats = N.turners.filter(T => THREAT_FACES.includes(T.face));
  return {
    course: R.course, lane: null, phase: R.phase, string: 0, cmd: R.cmd?.id ?? null, cmdI: R.cmd?.i ?? null, cmdAtMs: R.cmd?.atMs ?? null, hot: R.hot,
    observerId: R.coachId, roId: R.roId, paper: 'man', line: null, strings: [], end: R.end, house: N, get summary() { return N.summary; },   // (lazy, as houseNow's)
    score: { shots: N.aspects.shots.rounds, hits: sum(Object.entries(N.aspects.shots.zones).filter(([z]) => z !== 'miss').map(([, n]) => n)), down: threats.filter(T => T.down).length, of: threats.length,
      faults: R.faults.length, clearAtMs: R.end?.phase === 'clear' ? R.end.atMs : null },
    dry: !!R.dry,
  };
}

/** What "Again as …" starts: the same seed, another sheet, the par the picker set (else the sheet's own). */
export const againAsHouse = (state, tier) => ({ scenario: 'test-shoothouse', seed: state.meta.seed, tier: tierOf(tier), par: houseOf(state)?.parSet ?? null, ...(houseOf(state)?.loadout ? { loadout: houseOf(state).loadout } : {}), ...(houseOf(state)?.opfor ? { opfor: houseOf(state).opfor } : {}) });

/**
 * The lane in words (the review of A: the goal box said "Lane A" over a drawn house): 'Lane A' on the house as set (its
 * record's lane), 'Lane B' or 'Lane C' on a named house, 'A new layout' on another drawn house, whose lane record stays 'A' as room.js's cache key; the run sheet's card says it
 * in capitals.
 */
export const laneNameOf = (state) => { const H = houseOf(state), named = H?.draw ? namedLaneOfDraw(H.draw) : null; return named ? `Lane ${named}` : H?.draw ? 'A new layout' : `Lane ${H?.lane ?? 'A'}`; };
// (the card's lane: "LANE B" on a named house as the paper, the timer and the end card's header say it (the play review of v0.0.22,
// 2026-11-17: the glass card said "NEW LAYOUT" over lane B), "NEW LAYOUT" on another drawn house, the set's letter as set)
const laneCardOf = (H) => { const named = H?.draw ? namedLaneOfDraw(H.draw) : null; return named ? `LANE ${named}` : H?.draw ? 'NEW LAYOUT' : `LANE ${H.lane}`; };

/** The goal line with your number two named: COMBAT §25.10.4's. */
export function houseGoal(state) {
  const H = houseOf(state), two = state.people?.[H?.twoPid];
  const who = two ? `${RANK_WORD[two.service?.rank] ?? two.service?.rank ?? ''} ${two.name?.family ?? ''}`.trim() : 'your number two';
  // (short enough for the goal box's two lines at 1600 × 900, the rule that matters most last but whole (the fixer's of 0.0.12))
  // (its build sheet items 13 and 18, carried FH-4, DC3b and DW: the goal line is three lines at most (toasts.js kind 'goal'); the
  // live lane's its own, the role-players and their marking rounds named (it was the frangible lane's word for word: houseGoal read no
  // live men); and the dead corner named once (GOAL_CORNER), never in the spoken brief, whose every word moves every lane's ticks. The
  // words measured in the page against the longest rank and family the names can give ("Private First Class Merriweather") on a drawn
  // house: 163 and 168 characters, three lines at 1280 × 720 and 1600 × 900 (ui-goal-clamp); the carried lens's live words, 234 with
  // its corner, were four)
  const live = rangeOf(state)?.load === 'marking';
  return live
    ? `${laneNameOf(state)} at 1 G, live, ${who} your number two. Two role-players with marking rounds. Threats down, no-shoots untouched. ${GOAL_CORNER}`
    : `${laneNameOf(state)} at 1 G, ${who} your number two. On GO: three rooms and the hall. Threats down, no-shoots untouched. ${GOAL_CORNER}`;
}
/** The dead corner named once on the goal line (DW: the user, 2026-11-17, "i don't know what the "look behind the door" option does"; my call on the words). */
export const GOAL_CORNER = 'Look behind a push door.';
const RANK_WORD = Object.freeze({ Pvt: 'Private', PFC: 'Private First Class', LCpl: 'Lance Corporal', Cpl: 'Corporal', Sgt: 'Sergeant', SSgt: 'Staff Sergeant' });

/**
 * The stage's door on the house course (look.js rangeLook().house; the sheet's §2.4): the instructor on the catwalk and
 * his last words, the corners of the current leg as covered (a tick each, gone after "Clear!"), the stands as the marine
 * sees them (pairs.js's rule: paper as paper, what it holds once identified), the timer.
 */
export function houseLook(state, ms = state.clock.ms) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return null;
  const c = actorOf(state, H.chiefPid), L = curLeg(H), P = planOf(state, L);
  const said = H.said && ms - H.said.atMs < 3500 + 330 * H.said.text.split(/\s+/).length ? H.said.text : null;
  const corners = !H.end && L && L.state !== 'clear' && P ? (P.hot ?? []).map(h => ({ room: L.room, id: h.id, x: h.x, z: h.z, covered: !!L.covered[h.id], by: L.covered[h.id]?.by ?? null })) : [];
  const last = contactOf(state)?.last ?? null;
  // (v0.0.19: a role-player is no stand: drawn as a man, look.js rangeLook's men and floor (L-look's), never a stand under him)
  const stands = R.turners.filter(T => !isLive(T)).map(T => {
    const mine = last && T.turnAtMs !== null && last.seenMs >= T.turnAtMs && (last.ids ?? []).includes(T.key), id = mine ? last.ident?.[T.key] ?? null : H.two.ident[T.key] ?? null;
    return { key: T.key, stand: T.stand, room: T.room, x: T.x, z: T.z, y: T.y, facingK: q(facingOf(T, ms), 0.001), face: T.face === 'armoured' ? 'armoured' : 'paper', holds: id && id !== 'unseen' ? id : null,
      holes: T.hits.filter(h => h.at && h.atMs <= ms).map(h => ({ xCm: h.at[0], yCm: h.at[1], zone: h.zone, ring: !!h.ring, atMs: h.atMs })), down: T.stoppedAtMs !== null && T.stoppedAtMs <= ms };
  });
  return {
    instructor: c ? { x: c.x, z: c.z, y: c.y ?? 0, face: c.face ?? 'down', say: said, name: staffName(state, H.chiefPid) } : null, corners, stands,
    timer: { runMs: H.goAtMs === null ? null : (H.end?.atMs ?? ms) - H.goAtMs, parMs: H.parMs, par: H.par }, leaves: leavesLook(state, H, L, P, ms),
    aid: cornerAidLook(state, H, ms), marks: marksLook(state, H, ms),
    // (the house's spec for the stage's build, render/range.js buildHouse: HOUSE1 as set, through scenes/assemble.js)
    spec: houseSpecOf(state),
  };
}
/**
 * The rooms' marks on their jambs (the build sheet v0.0.20 item 12; drill.md D3): [{ door, room, side, by, atMs, x, z, y }] for every
 * room marked (L.marked) by ms, drawn from the hand's sub-step on (L.marked.atMs: nothing pops in): on the latch-side jamb (the
 * plan's swing.stackSide, the stack's), corner.js MARK_AT_M outward of the door's plane, MARK_H_M high. Derived, never stored.
 */
export function marksLook(state, H = houseOf(state), ms = state.clock.ms) {
  const out = [];
  for (const L of H?.rooms ?? []) {
    if (!L.marked || L.marked.atMs > ms) continue;
    const P = planOf(state, L), F = P ? frameOf(P) : null;
    if (!F) continue;
    const side = P.swing?.stackSide ?? 'left', [x, z] = F.at(-MARK_AT_M, (side === 'left' ? 1 : -1) * F.halfW);
    out.push({ door: L.door, room: L.room, side, by: L.marked.by === playerId(state) ? 1 : 2, atMs: L.marked.atMs, x, z, y: MARK_H_M });
  }
  return out;
}
/**
 * Your corner shown (the user, 2026-11-15: "there is currently no indication at to where we're supposed to be looking when
 * entering a room"; src/sim/combat/corner.js, the rule and the aid's times): on the current leg, and on the one just cleared
 * while it fades, { marks: [{ room, slot, mine, k, corner: { x, z, along, back }, point: [x, z] }] (yours and your #2's from
 * the read of the door: H.read, set as the read beat starts; where nothing reads it, the boot recruit's (rung 0: no read in his
 * single steps) from the stack, the others' from the door's opening (he skipped the read: he learns it as the door opens), a door
 * found open from the stack; the hall's leg from its start), sector: { room, k, x, z, fromRad, toRad, rays, arcM } | null
 * (yours, from your entry; the hall's from its start) }; each strength k (corner.js aidK) held aidHoldMs(the room rung) from its start, gone at
 * domination (every hot spot covered, or the leg's "Clear!") over AID_FADE_MS. Nothing on the brief, after the lane's end, or
 * where k is 0. Read every frame: the rule and the wedge are cached by the frozen plan.
 * v0.0.20 (the build sheet's item 24): the hold is the player's setting, state.$aid ('rung' as built, 'always' to domination on every
 * sheet, 'off' nothing drawn: corner.js aidHoldMs), a runtime key the Esc menu writes and no save carries; each ring is drawn at the
 * point the rule's CORNER_POINT names (corner.js pointOfRule; `point` the tests' override), so the ring and the walk agree.
 */
export function cornerAidLook(state, H = houseOf(state), ms = state.clock.ms, { point = CORNER_POINT } = {}) {
  const out = { marks: [], sector: null }, setting = state.$aid ?? 'rung';
  if (!H || H.end || H.goAtMs === null || setting === 'off') return out;
  const pid = playerId(state), rung = rungOf(state, pid, 'room'), hold = aidHoldMs(rung, setting), legs = legsOf(H), plans = lanePlanOf(state).plans;
  for (const i of [H.cur - 1, H.cur]) {
    const L = legs[i], P = L ? plans[L.door] : null;
    if (!L || !P || (i < H.cur && L.clearAtMs === null)) continue;
    const hot = P.hot ?? [], all = hot.length && hot.every(h => L.covered[h.id]) ? Math.max(...hot.map(h => L.covered[h.id].atMs)) : null;
    const dom = [all, L.clearAtMs].filter(Number.isFinite), domMs = dom.length ? Math.min(...dom) : null;
    const open = L.door === 'hall' || openingState(state, L.door) === 'open';
    // (stacked: the leg's record, or you on #1's stack point now while time stands still (a setup puts you there in stop motion,
    // and the record waits on a lived tick))
    const me = i === H.cur ? actorOf(state, pid) : null, onStack = me && P.stack?.[0] && Math.hypot(me.x - P.stack[0][0], me.z - P.stack[0][1]) <= STACK_M;
    const stacked = L.stackAtMs ?? (onStack ? L.fromMs ?? ms : null);
    const start = L.door === 'hall' ? L.fromMs ?? stacked : H.read?.[L.door] ?? (rung === 0 ? stacked : null) ?? L.openAtMs ?? (open ? stacked : null) ?? L.enteredAtMs;
    const end = (s) => Math.min(Number.isFinite(s) ? s + hold : Infinity, domMs ?? Infinity);
    const rules = cornerTableOf(P), km = aidK(start, end(start), ms);
    const mine = sideOf(state, L.door, 1);
    if (km > 0) for (const r of rules) out.marks.push({ room: L.room, slot: r.slot, mine: r.slot === mine, k: q(km, 0.01), corner: { x: r.corner.x, z: r.corner.z, along: r.corner.along, back: r.corner.back }, point: pointOfRule(r, point) });
    // (the hall's leg has no door to enter by: its sector from the leg's start, with the marks)
    const from = L.door === 'hall' ? start : L.enteredAtMs, ks = aidK(from, end(from), ms), W = ks > 0 ? sectorWedgeOf(P, rules.find(r => r.slot === mine) ?? rules[0]) : null;
    if (W) out.sector = { room: L.room, k: q(ks, 0.01), ...W };
  }
  return out;
}
/**
 * The doors' swings on the floor (2026-11-15, the user: "doors should have a direction they open (pull or push)"; graphics over
 * words): the leaf's arc (src/sim/places/swing.js arcOf, zones.js arcsOf) for the current leg's door while it is shut, its room's
 * inner doors while you are in it and they are shut, and any leaf while it moves (then the arc is its no-stop zone, the sweep
 * still to come): [{ door, hinge, u, n, widthM, openK (0 shut to 1 open), moving, how ('push' | 'pull' from your side) }].
 */
export function leavesLook(state, H, L = curLeg(H), P = L ? planOf(state, L) : null, ms = state.clock.ms) {
  const me = actorOf(state, playerId(state)), out = [];
  if (!me || H?.end) return out;
  const inner = P && pastThreshold(P, me.x, me.z) ? P.inner ?? [] : [];
  for (const A of arcsOf(houseSpecOf(state).area)) {
    const k = leafAt(state, A.door, ms), moving = k > 0 && k < 1 || (openingState(state, A.door) === 'open' && k < 1);
    const shut = openingState(state, A.door) !== 'open';
    const ours = (P?.door === A.door && shut) || (inner.includes(A.door) && shut);
    if (!ours && !moving) continue;
    const sw = P ? (A.door === P.door ? doorSwing(state, P) : doorSwing(state, { ...P, door: A.door }, P.room)) : null;
    out.push({ door: A.door, hinge: [...A.hinge], u: [...A.u], n: [...A.n], widthM: A.widthM, openK: q(k, 0.001), moving, how: sw?.how ?? null });
  }
  return out;
}

// v0.0.21 (the build sheet v0.0.21 §0 item 31): the lane's functions your number two's brain calls (src/sim/combat/two.js), given it
// through op.js's host on the house course, so no file of combat/ imports this scenario. At the module's end: every name here is
// defined by now (two.js reads none at its top level).
registerHost('house', { houseOf, planOf, noteSighting, houseShot, chiefSays, sayOn, pistolLacks, houseFault, chiefSees, chiefReach });
