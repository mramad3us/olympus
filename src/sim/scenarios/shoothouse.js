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
// 'time', its turners turned away. The lane ends at the hall's "Clear!" ('clear'), at LANE_MAX_MS 10 min lived from GO
// ('time'), with nothing left to fire ('dry'), or by the safety stop.
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
// v0.0.19 (the build sheet's stage 0): his code is house-two.js's (TWO_CMDS to handsOf, legOf to twoStandDown, moved byte for
// byte and re-exported here), and whose a stand is goes through combat/team.js ownerOf, the one reader of "whose man".
// v0.0.19 (L-house; COMBAT §25.18; the build sheet v0.0.19 §0 items 17 and 18, §3.3): **"Stack and clear, live"**, the same lane
// with two role-players of the cadre in place of stands 2a and 3a (scenes.js test-shoothouse-live, or &opfor=live[:<2a card>,<3a
// card>]). The fill's opfor (opfor.js parseOpfor) makes them after every other item and after the setup (opfor.js fillOpfor; R.house
// .live, R.house.opfor the code); with opfor none nothing of it is written or run, so the turner lane is v0.0.18's to the tick
// (tests/house-pin.test.mjs). Each lived tick their brain runs after your number two (opfor.js opforTick), and the house keeps the
// team's side of them (liveTick: seenBy, lastAt, the covers by men.js coverTick, your #2's "Got him." and his fading memory, the
// instructor's "Paint, chest.", a cleared room reopened); a casualty (paint at the stands' sensor on you or your #2: men.js struckOn)
// halts every doing, "I'm hit!", and CASUALTY_MS later "Cease fire!" and the lane's end 'casualty' (casualtyTick). The gate waits
// on a live man down or with his hands up and not covered, or seen and now in nobody's sight (men.js gateWhy: 'down', 'hands',
// 'unaccounted'); a "Clear!" by hand over one is the fault 'uncovered'; at the leg's end a man down or with his hands up is ruled
// out (opfor.js ruleOut 'clear', "He's out."), a man up never, a passed leg's every man ('passed'), the lane's end the rest
// ('lane'); a role-player is never turned away. A round on a man whose hands the shooter saw up is 'surrendered'; his own sensor
// is opfor.js opforHit's. The paper: "LIVE: 1 DOWN · PAINT ON YOU 0 · HIS FIRST ROUND 0.40 S BEFORE YOURS" on his leg, "2
// ROLE-PLAYERS · 1 DOWN, 1 GAVE UP · PAINT ON YOU: NONE" on the card, a casualty's card led "CASUALTY · PAINT: 2 TORSO, ROOM 2, BY
// THE MAN IN THE DEEP CORNER"; houseLook leaves him out of its stands, the stage drawing him as a man (look.js rangeLook's men).
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
import { TICK_MS, isHeld } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream, intIn, weighted } from '../../core/rng.js';
import { hashPick } from '../../core/hash.js';
import { playerActor, playerId } from '../../core/ids.js';
import { post, cancel } from '../../core/queue.js';
import { COURSES, SEQ_HOUSE, HOUSE_CHIEF } from '../../data/courses.js';
import { SCENES } from '../../data/scenes.js';
import { ACTIVITIES } from '../../data/activities.js';
import { WHEEL_S4, HOUSE1 } from '../../data/places/wheel.js';
import { lonOfSite, gravityAt } from '../places/env.js';
import { openingState, setOpening, roomOf, zoneOf } from '../places/model.js';
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
import { rangeOf, sayOn, startRange, fault, roundsLeft, stillOf, stopRange } from './handling.js';
import { materialise, move, sparesOf, issueSidearm, discard, FOF_SIDEARM } from '../arms/kit.js';
import { loadoutOf, applyLoadout, codeOf, isStandard } from '../arms/loadout.js';
import { ownerOf, sideOf, clearTask, teamMarks } from '../combat/team.js';
import { tickDevices, BANG_LATE_MS } from '../combat/burst.js';
import { BREACH_SAFE_KPA } from '../arms/blast.js';
import { DEVICES, handDeviceOf, liveDevices, setSt } from '../arms/devices.js';
import { SIDEARM_TIERS, upHeard, drawn as drawnPistol, holstered as holsteredPistol, pistolOwed } from '../arms/sidearm.js';
import { feed, gunField, doAction, beliefOf, actionMs, tempoFor } from '../arms/firearms.js';
import { subsOf } from '../arms/drills.js';
import { enterStop, leaveStop, gunOn, faceOfHead } from '../arms/shooting.js';
import { muzzleOf, flagsAt, FLAG_MS, SLUNG } from '../arms/carry.js';
import { BRASS_LIVE } from '../arms/look.js';
import { famCap } from '../arms/models.js';
import { turnTo, turnAway, facingOf, turnerTargets, TURN_MS } from '../arms/turners.js';
import { resolveShot, aimMsOf, catchAhead, shotIdNext } from '../arms/shot.js';
import { ROWS, rowPlan, HAMMER_MAX_M, stillUp } from '../arms/specials.js';
import { rollerOf } from '../combat/roll.js';
import { takeInMs, takeInWords, goMs } from '../combat/react.js';
import { pendingOf, IDENT_DC0, IDENT_PER_M, CHALLENGE_MS } from '../combat/contact.js';
import { lanePlanOf, inFunnel, pastThreshold, coveredNow } from '../combat/room.js';
import { cornerTableOf, aidK, aidHoldMs, sectorWedgeOf } from '../combat/corner.js';
import { startled } from '../combat/supp.js';
import { runSlot, freeBody, handBack, legsOf as bodyLegsOf, useClearGate, useCallVoid, skillsOf, crossingOf, doorSwing, CALL_S, TWO_SAY, BODY_GAP_M, GAP_GUARD_M } from '../combat/bundle.js';
import { profileOf, moveAt, pathLen, advanceList, halt as haltDoing } from '../combat/stepper.js';
import { useBodies } from '../places/move.js';
import { useLanes, useKeepClear, liveZoneAt, arcsOf } from '../places/zones.js';
import { leafAt } from '../places/doors.js';
import { moverStart, locoStep } from '../body/loco.js';
import { startActivity } from '../time/activities.js';
// (v0.0.19: your number two's code is in house-two.js, its names re-exported here so the tests, the bots and the gauges import them unchanged)
import { TWO_CMDS, twoLacks, twoCmd, twoAdminTick, legOf, isThreat, twoTick } from './house-two.js';
// (v0.0.19, "Stack and clear, live": the role-players' brain (opfor.js) and the one seam for what is seen of a man and what he
// does to the stack (combat/men.js); the house only calls them, never reads a role-player's state but through them)
import { parseOpfor, fillOpfor, opforTick, opforHit, ruleOut } from './opfor.js';
import { isLive, upNow, seenK, bodySeen, accountedOf, gateWhy, coverTick, struckOn, remember, stale, CASUALTY_MS } from '../combat/men.js';
export { TWO_CMDS, TWO_TRIES, twoLacks, twoCmd, twoAdminTick, handsOf, UP_WAIT_MS, twoCover, twoDrillOf, twoGunDown, twoOwns, twoSees } from './house-two.js';
// (v0.0.19, D2: the kit's second slice is house-kit.js's: the reads, the intelligence, the five, the run sheet's marks, the breach rounds)
import { readsTick, intelOf, kitMarks as kit2Marks, breachShot, intelWords } from './house-kit.js';

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
/** A paper threat's hit sensor (pairs.js's): down at this many torso or head hits, turned away this long after (ms). */
export const STOP_TORSO = 2, STOP_HEAD = 1, SENSOR_MS = 100;
/** A call while a man of the leg turned under this long ago, not yet seen, is void (ms; my call: his turn and the take-in's first ticks). */
export const APPEAR_MS = 1000;
/** The #2's rounds kept on his record (the turners' hits name them). */
export const TWO_SHOTS_KEPT = 30;
/** Your number two's echo of your "Clear!" is dropped within this of his own (ms). */
export const ECHO_MS = 1000;
/** The #2's follow-ups on a man still up after his row (see twoPlan). */
export const TWO_FOLLOW_N = 2;
/** The face's centre on its stand (m; the bay's). */
export const FACE_Y = 1.35;
/** The sheets the picker offers, in its order, and its default (the sheet's §2.6; the boot recruit by §8 item 8). */
export const HOUSE_SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']), HOUSE_SHEET = 'private';
/** The pars the picker offers. */
export const HOUSE_PARS = Object.freeze(Object.keys(PAR_MS));
/** The setups (tests and the page: debug.js's share). */
export const HOUSE_SETUPS = Object.freeze(['go', 'room:2', 'room:3', 'hall', 'contact', 'ref']);
/** The stands' roles (see the header): their face ('draw': 1b and 3a), their trigger, their slot and their name where HOUSE1 gives none. */
export const STANDS = Object.freeze({
  '1a': Object.freeze({ face: 'threat', trigger: 'go', slot: 1, name: 'the far left target' }),
  '1b': Object.freeze({ face: 'draw', trigger: 'go', slot: 2, name: 'the far right target' }),
  '2a': Object.freeze({ face: 'armoured', trigger: 'door', slot: 1, name: 'the armoured target' }),
  '2b': Object.freeze({ face: 'noshoot', trigger: 'go', slot: 1, name: 'the target by the inner door' }),
  '3a': Object.freeze({ face: 'draw', trigger: 'door', slot: 2, name: "the near leg's target" }),
  '3b': Object.freeze({ face: 'hostage', trigger: 'go', slot: 1, name: 'the hostage card' }),
  H: Object.freeze({ face: 'threat', trigger: 'zone', slot: 1, name: "the target at the hall's end" }),
});
const STAND_IDS = Object.freeze(Object.keys(STANDS));
/** The faces that are a threat to put down (the hostage card's hostile with them). */
export const THREAT_FACES = Object.freeze(['threat', 'armoured', 'hostage']);
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
  fragged: 'a frag into a room with a family',
  concussed: 'a no-shoot in the blast',
  burst: 'the stack in the burst',
  exposed: 'exposed in the throw',
  through: 'a round through the door',

  surrendered: 'a man who gave up shot',
  uncovered: 'a man down or with his hands up left uncovered',
  reopened: 'a room called clear with a man up in it',
  casualty: 'paint on the stack: a casualty',
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
});
const ZONES = Object.freeze(['A', 'C', 'head', 'ring', 'headDown', 'miss', 'noshoot', 'hostage']);
const ZONE_PAPER = Object.freeze({ A: 'A', C: 'C', head: 'HEAD', ring: 'RING', headDown: 'HEAD DOWN', miss: 'MISS', noshoot: 'NO-SHOOT', hostage: 'HOSTAGE' });
const LEG_WORD = Object.freeze(['ROOM 1', 'ROOM 2', 'ROOM 3', 'THE HALL']);
const LEG_SAID = Object.freeze(['room 1', 'room 2', 'room 3', 'the hall']);

export const whole = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;
const tierOf = (tier) => (tier && TEST_SHEETS[tier] ? tier : HOUSE_SHEET);
export const actorOf = (state, pid) => (pid ? state.actors?.list?.find(a => a.who === pid) ?? null : null);
const isHouse = (state) => rangeOf(state)?.course === 'house';
/** The house's record, or null off the house course. */
export const houseOf = (state) => (isHouse(state) ? rangeOf(state).house ?? null : null);
// (the legs in the plan's order: the three rooms, then the hall)
const legsOf = (H) => (H ? [...H.rooms, H.hall] : []);
export const curLeg = (H) => legsOf(H)[H?.cur ?? 0] ?? null;
export const planOf = (state, L) => (L ? lanePlanOf(state).plans[L.door] ?? null : null);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// ---- the stands (HOUSE1's places, STANDS' roles) ----

/** The lane's stands in STANDS' order: { stand, room, leg, x, z, y, slot, name } from HOUSE1 (an array or a map by stand id). */
export function standsOf() {
  const S = HOUSE1.stands ?? [];
  const list = Array.isArray(S) ? S : Object.entries(S).map(([stand, s]) => ({ stand, ...s }));
  return STAND_IDS.map((stand, i) => {
    const s = list.find(x => (x.stand ?? x.id) === stand) ?? null, R = STANDS[stand];
    if (!s) throw new Error(`shoothouse: HOUSE1 has no stand '${stand}'`);
    return { stand, room: s.room, leg: stand === 'H' ? 3 : Number(stand[0]) - 1, x: s.x, z: s.z, y: s.y ?? FACE_Y, slot: s.slot ?? R.slot, name: s.name ?? R.name, lane: s.lane ?? i + 1,
      faceRad: s.faceRad ?? null, gapMs: Array.isArray(s.trigger?.gapMs) ? s.trigger.gapMs : null };
  });
}
const startOf = () => ({ x: HOUSE1.start.x, z: HOUSE1.start.z, face: HOUSE1.start.face ?? 'left' });
// (the #2's start: HOUSE1's, else TWO_BEHIND_M behind yours on the hall's axis, uprange of the lane (east))
const twoStartOf = () => (HOUSE1.two ? { x: HOUSE1.two.x, z: HOUSE1.two.z } : { x: q(HOUSE1.start.x + TWO_BEHIND_M, 0.01), z: HOUSE1.start.z });
// (the zone the hall's turner waits for: HOUSE1's zones.hallWest (a record { id, rect }, or its id))
const hallZone = () => { const z = HOUSE1.zones?.hallWest; return typeof z === 'string' ? z : z?.id ?? 'w4.z.hall-west'; };
// (the zone at a point of the house: a trigger zone's (named, with a rect), else its room's)
const zoneAt = (x, z) => zoneOf(WHEEL_S4.id, x, z)?.id ?? roomOf(WHEEL_S4.id, x, z)?.zone ?? null;

// ---- the draws (the seed alone) ----

const pickW = (r, list) => weighted(r, list);
/** Every stand's draw from the seed alone (see the header): { [stand]: { face, holds, gapMs } }; a stand's gap range HOUSE1's where it gives one. */
export function drawStands(seed) {
  const out = {}, given = Object.fromEntries(standsOf().map(s => [s.stand, s.gapMs]));
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
export function testShoothouse(state, { at = null, setup = null, tier = null, par = null, loadout = null, opfor = null } = {}) {
  const seed = state.meta.seed, sheet = tierOf(tier), S0 = startOf();
  barracks(state, { at: { area: WHEEL_S4.id, x: S0.x, z: S0.z, face: S0.face, ...(at ?? {}) } });
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
  const twoPid = drawTwo(state), T0 = twoStartOf();
  let twoKit = null;
  if (twoPid) {
    const two = state.people[twoPid];
    two.skills = testSheet(sheet);
    twoKit = materialise(state, twoPid, issue);
    state.items[twoKit.gunId].mode = 'safe';
    setPost(state, twoPid, { key: 'house-two', area: WHEEL_S4.id, x: T0.x, z: T0.z, face: 'left', outfit: 'combatSuit' });
  }
  const chiefPid = drawStaff(state, 'melas:wheel-house-chief'), B = HOUSE1.booth;
  setPost(state, chiefPid, { area: WHEEL_S4.id, x: B.x, z: B.z, face: B.face ?? 'left' });
  syncActors(state);
  const twoA = actorOf(state, twoPid);
  if (twoA) { twoA.moveStance = 'combat'; twoA.headRad = Math.PI; }
  const R = startRange(state, null, { course: 'house', lane: null, area: WHEEL_S4.id, kit, set: ref ? null : { mag: dummy.mag, n: dummy.n, kind: dummy.kind }, roId: chiefPid, coachId: chiefPid });
  const draws = drawStands(seed), plan = lanePlanOf(state);
  R.turners = standsOf().map(s => {
    const d = draws[s.stand], R0 = STANDS[s.stand];
    const on = R0.trigger === 'door' ? plan.order[s.leg] : R0.trigger === 'zone' ? hallZone() : null;
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
  };
  R.load = live ? 'marking' : 'frangible';
  // (the rework's R6: the P-12, on every sheet from 2026-11-15 (the Sergeant up before), its ids after every other item of the
  // fill so the stands' and the kit's ids are the same on every sheet; Condition 3, the spare in the thigh's pouch (kit.js issueSidearm))
  if (SIDEARM_TIERS.includes(sheet)) issueHouseSidearm(state, pid, live);
  // (v0.0.18, the loadout (WEAPONS §12.7; loadout.js): one for every sheet, yours then your #2's, its ids after every other
  // item of the fill; the standard makes nothing and writes nothing, so its lane is the lane without it to the byte)
  const spec = loadoutOf(loadout);
  if (!spec.error && !isStandard(loadout)) {
    applyLoadout(state, pid, spec);
    if (twoPid) applyLoadout(state, twoPid, spec);
    R.house.loadout = codeOf(spec);
    // (v0.0.19, D2: the brief's intelligence where the loadout carries a practice frag or concussion (house-kit.js intelOf))
    const intel = intelOf(state); if (intel) R.house.intel = intel;
  }
  // (v0.0.19, your #2's P-12 (the loadout's ~two:p12; loadout.js TWO_P12_DEFAULT off): the fill's last items, so every other id is v0.0.18's)
  if (twoPid && !spec.error && spec.two?.p12) R.house.two.pistol = issueSidearm(state, twoPid, { ...(C.sidearm ?? { model: 'p12', mags: [['had17', 10, 'frangible'], ['had17', 10, 'frangible']] }) }).gunId;
  if (setup) setupHouse(state, setup);
  // (v0.0.19, "Stack and clear, live" (COMBAT §25.18; the build sheet v0.0.19 §0 item 18): the role-players the last items of the
  // fill, after v0.0.18's and your number two's P-12, so every id before them is the lane's without them, and after the setup,
  // which makes no item, so a man of a leg it cleared is ruled out by opfor.js's fill ('setup'); with opfor none (or a code
  // parseOpfor refuses) nothing is made and nothing written; R.house.opfor the code that made them, for "Again as …")
  if (live) { R.house.opfor = op.cards ? `live:${op.cards['2a'] ?? '*'},${op.cards['3a'] ?? '*'}` : 'live'; fillOpfor(state, R.house, op); }
  return state;
}
// (the sidearm issued (see testShoothouse): the house's ten frangible, two magazines; on the live lane ten marking (v0.0.19))
function issueHouseSidearm(state, pid, live = false) {
  const S = live ? FOF_SIDEARM : C.sidearm ?? { model: 'p12', mags: [['had17', 10, 'frangible'], ['had17', 10, 'frangible']] };
  return (rangeOf(state).house.pistol = issueSidearm(state, pid, { model: S.model, mags: S.mags }).gunId);
}
// (the P-12 made ready and holstered on safe, as MAKE READY leaves it (the rework's R6): Condition 3 to Condition 1)
/**
 * The tower's move-on past MAKE READY (handling.js moveOn, the house's): with your P-12's round still owed (sidearm.js pistolOwed:
 * its rack fumbled and not answered), the instructor racks it himself, on safe, in the holster, and says so, as the coach clears a
 * rifle never shown (the 'slow' fault is the move-on's). Before the fixer of v0.0.19 the lane went to GO with the P-12 short of
 * Condition 1 (the fumble net's p12-unready-v018: 7 lanes of v0.0.18's sweep). Returns whether he did.
 */
export function houseMoveOn(state, bus, def) {
  const pid = playerId(state);
  if (def?.ready !== 'houseStart' || houseWant(state) !== 'pistol') return false;
  const p = holsteredPistol(state, pid);
  if (!p) return false;
  readyPistol(state, p);
  chiefSays(state, bus, HOUSE_CHIEF.pistolRacked, 'pistolRacked');
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
  sayOn(state, bus, { who: R.coachId, text, kind: 'speech' });
  H.said = { text, atMs: state.clock.ms };
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
  const carry = state.people[pid]?.kit?.carry ?? {}, dry = !!R.dry, S0 = startOf();
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
  const a = actorOf(state, H.twoPid), T0 = twoStartOf();
  if (a && Math.hypot(a.x - T0.x, a.z - T0.z) > TWO_SLOT_M) return 'two';
  return null;
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
    case 'shown': return twoLacks(state, 'clear') || pistolLacks(state) ? false : null;
    case 'washed': return !!H.wash && state.clock.ms >= H.wash.atMs + WASH_MS;
    default: return null;
  }
}

/** What the P-12 lacks for the tower's Stop and SHOW CLEAR: 'pistol:out' in the hand, 'pistol:safe' holstered off safe; null without one or when it is so. */
export function pistolLacks(state, pid = playerId(state)) {
  if (drawnPistol(state, pid)) return 'pistol:out';
  const h = holsteredPistol(state, pid), g = h ? state.items[h] : null;
  return g && gunField(g, 'mode') !== 'safe' ? 'pistol:safe' : null;
}

// ---- the instructor's commands ----

/** A command said on the house course (handling.js onRangeCmd, after the words and the phase): what the scene does at it. */
export function houseOnCmd(state, bus, def) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return;
  const now = state.clock.ms;
  // (each command goes to both marines: your number two's own macro for it, on his list doing (COMBAT §25.19.5))
  if (TWO_CMDS[def.id]) twoCmd(state, bus, def.id);
  switch (def.id) {
    case 'brief': chiefSays(state, bus, `${hashPick(HOUSE_CHIEF.brief, 'house-chief', state.meta.seed, 'brief')} ${gravityWords(state)}${kitWords(state)}`, 'brief'); break;
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
  if (R.end || state.skip) { chiefWalk(state, R, H, state.clock.ms); return; }
  const now = state.clock.ms;
  // (your number two's tower admin, from the fill to SHOW CLEAR: his macro's sub-steps at their times)
  twoAdminTick(state, bus, H, now);
  if (R.cmd?.id === 'standby' && H.goAtMs === null) standbyTick(state, bus, R, H, now);
  if (H.goAtMs === null) return;
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
      if ((!H.two.eng || H.two.eng.move) && !(H.two.doing && !H.two.doing.beats)) runSlot(state, bus, H.two, now);
      else freeBody(state, H.two, a, now, true);
      // (his eyes where his head is: perception reads the four-way face (people/perception.js eyeOf))
      if (Number.isFinite(a.headRad)) a.face = faceOfHead(a.headRad);
      const p = state.people[H.twoPid]?.post;
      if (p && (p.x !== a.x || p.z !== a.z)) { p.x = a.x; p.z = a.z; }
      twoTick(state, bus, R, H, a, now);
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
  if (me && !H.end) { const zn = zoneAt(me.x, me.z); if (zn && H.zones[zn] === undefined) H.zones[zn] = now; }
  for (const T of R.turners) {
    if (T.turnAtMs !== null || T.stoppedAtMs !== null || T.trigger.kind === 'go' || T.trigger.kind === 'never' || T.passed) continue;
    const at = T.trigger.kind === 'door' ? H.doors[T.trigger.on] : H.zones[T.trigger.on];
    if (at === undefined || H.end) continue;
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
function chiefWalk(state, R, H, now = state.clock.ms) {
  const c = actorOf(state, H.chiefPid), cw = HOUSE1.catwalk;
  if (!c || !cw?.path?.length) return;
  const L = curLeg(H), P = planOf(state, L);
  const to = H.end || !P ? cw.path[0] : nearestOn(cw.path, P.threshold ?? P.points[0]);
  const y = cw.y ?? 3;
  if (c.y !== y) { c.y = y; const p = state.people[H.chiefPid]?.post; if (p) p.y = y; if (c.x !== cw.path[0][0] || c.z !== cw.path[0][1]) placeTwo(state, c, cw.path[0][0], cw.path[0][1]); }
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
    const v0 = Math.hypot(c.v?.[0] ?? 0, c.v?.[1] ?? 0), legs = bodyLegsOf(state, H.chiefPid, c.x, c.z), path = [[c.x, c.z], [to[0], to[1]]];
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
export function houseRules(state, input, bus) {
  const R = rangeOf(state), H = R?.house;
  if (!H || R.end || state.skip || isHeld(state)) return;
  const now = state.clock.ms, pid = playerId(state), me = playerActor(state);
  if (!me) return;
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
  if (H.goAtMs === null || H.end) return;
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
// "Clear!" never ends the lane while he is up). The casualty (casualtyTick): two torso or one head of paint on you or your number
// two (men.js struckOn, the stands' own sensor) halts every bundle, "I'm hit!" (and "Man down!" from the other), CASUALTY_MS, the
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
  // (paint on you or your number two short of the casualty: the instructor's "Paint, chest. Keep working." once a strike (men.js
  // incoming writes the strike and says nothing; LV.said.paint counts those said)
  const struck = LV.struck ?? [], said = (LV.said ??= {});
  for (let i = said.paint ?? 0; i < struck.length; i++) {
    const x = struck[i];
    if (!LV.casualty) chiefSays(state, bus, fill(hashPick(HOUSE_CHIEF.paint, 'house-chief', state.meta.seed, 'paint', i), { part: x.part === 'head' || x.zone === 'head' ? 'head' : 'chest' }));
  }
  said.paint = struck.length;
  // (a shot row of yours on a role-player who is down (or ruled out) cut at its sub-step's end: you see your man fall, by your round
  // or your number two's, and no round goes after it (a stand's turn away does this for the paper; a man sits there, facing))
  const d = state.stop?.doing, Td = d && !d.beats && d.kind === 'shot' && d.target ? R.turners.find(x => x.key === d.target) : null;
  if (isLive(Td) && Td.stoppedAtMs !== null && Td.stoppedAtMs <= now) d.cut = true;
  // (a man who gave up (opfor.js gaveAtMs, his hands coming up): a row of yours on him cut at its sub-step's end, and your number
  // two's rounds on him not yet fired dropped, once the shooter sees him and his react.js goMs has passed since the give: you
  // see the hands come up and fire no more (a round already on its way still goes); v0.0.19's review: your #2 fired on a man
  // up to 1,050 ms after his hands came up, on 12 of 12 raider lanes)
  const gaveSeen = (T, who, body) => isLive(T) && T.stoppedAtMs === null && Number.isFinite(T.live.gaveAtMs) && !!body && now >= T.live.gaveAtMs + goMs(skillsOf(state, who).wf) && seenK(state, body, T, now) >= SEEN;
  if (Td && gaveSeen(Td, pid, me)) d.cut = true;
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
// end (house-two.js twoStandDown's), so the tower's Stop finds him as after any row)
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
    const who = [pid, H.twoPid].filter(Boolean).find(p => struckOn(state, p).down);
    if (!who) return false;
    const last = struckOn(state, who).list.at(-1);
    K = LV.casualty = { who, by: last?.by ?? null, atMs: last?.atMs ?? now, endAtMs: null };
  }
  K.endAtMs ??= whole(K.atMs + CASUALTY_MS);
  if (!Number.isFinite(K.endAtMs)) K.endAtMs = whole(K.atMs + CASUALTY_MS);
  if ((LV.said ??= {}).casualty === undefined) {
    LV.said.casualty = now;
    // (every bundle and flow halts with it: COMBAT §25.8.2's hand-back, stepper.js HALTS' 'casualty')
    if (state.stop?.doing?.beats || state.stop?.flow) handBack(state, bus, 'casualty');
    if (H.two?.doing?.beats) haltDoing(state, bus, H.two.doing, 'casualty', null, now);

    sayOn(state, bus, { who: K.who, text: hashPick(C.opfor.hit, 'house-chief', state.meta.seed, 'hit', K.who), kind: 'speech' });
    if (K.who !== pid) sayOn(state, bus, { who: pid, text: hashPick(C.opfor.manDown, 'house-chief', state.meta.seed, 'mandown'), kind: 'speech' });
    const T = K.by ? R.turners.find(x => x.key === K.by) : null, L = (T ? legsOf(H)[legOf(T)] : null) ?? curLeg(H);
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
  if (T.stoppedAtMs === null) opforHit(state, bus, T, shot);
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
function sayOwed(state, bus, H) {
  if (!H.owed.length || pendingOf(state)) return;
  const R = rangeOf(state), text = H.owed.shift();
  sayOn(state, bus, { who: R.coachId, text, kind: 'speech' });
  H.said = { text, atMs: state.clock.ms };
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
  if (!k) { k = { key: T.key, stand: T.stand, face: T.face, seenMs, takeInMs: null, pauseAtMs: null, firstAtMs: null, by, parMet: null }; L.contacts.push(k); }
  if (ms !== null && k.takeInMs === null) { k.takeInMs = ms; k.pauseAtMs = pauseAtMs; }
  if (ident && ident !== 'unseen') k.ident = ident;
}
// (the par's clock for a threat: the sighting of the man whose sector it is, the #2's for his own (slot 2) while he lives in
// the lane, else the first by either of you (the fixer's of 0.0.12: a slot-2 man's par ran from your sighting, before the
// #2 could cross the door, so every sheet missed it however well it played))
const slotOfStand = (stand) => STANDS[stand]?.slot ?? 1;
// (v0.0.18: a dazed man's par runs from when he could first have fired, his daze's end, at the soonest)
const parFrom = (state, L, key) => { const by = firstBy(state, L, key), list = L.contacts.filter(k => k.key === key && (by === null || k.by === by)); if (!list.length) return Infinity; const daze = rangeOf(state)?.turners?.find(T => T.key === key)?.dazeUntilMs; return Math.max(Math.min(...list.map(k => k.seenMs)), Number.isFinite(daze) ? daze : -Infinity); };
// (each threat's par: past it with no round, the low tone and "he fired first")
function pars(state, bus, R, H, now) {
  for (const L of legsOf(H)) for (const k of L.contacts) {
    // (v0.0.19: a role-player who gave up is no threat to meet a par on: his sighting's face as he is now)
    if (H.live && k.parMet === null && k.face !== 'noshoot') { const T0 = R.turners.find(x => x.key === k.key); if (isLive(T0) && T0.face === 'noshoot') k.face = 'noshoot'; }
    if (!THREAT_FACES.includes(k.face) || k.parMet !== null || k.by !== firstBy(state, L, k.key)) continue;
    const T = R.turners.find(x => x.key === k.key), from = parFrom(state, L, k.key);
    if (T?.firstAtMs !== undefined && T.firstAtMs !== null) { k.parMet = T.firstAtMs - from <= H.parMs; k.firstAtMs = T.firstAtMs; continue; }
    if (now >= from + H.parMs) {
      k.parMet = false;
      bus?.emit('house', { phase: 'par', room: L.room, who: playerId(state), atMs: now, met: false, kind: k.key, text: hashPick(HOUSE_CHIEF.par, 'house-chief', state.meta.seed, 'par', k.key) });
    }
  }
}
// (whose sighting carries a threat's par (see parFrom): the #2's on a man of his while the house has a #2 (team.js ownerOf: a
// slot-2 stand, or yours once the sides are swapped), until a round of yours lands on him before his sighting; else the earliest)
function firstBy(state, L, key) {
  const list = L.contacts.filter(k => k.key === key).sort((a, b) => a.seenMs - b.seenMs), H = houseOf(state);
  if (list.length && H?.twoPid && ownerOf(state, { slot: slotOfStand(list[0].stand), room: L.room }) === 2) {
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
function stall(state, bus, R, H, L, now) {
  const since = now - (H.stallAtMs ?? now);
  if (since >= STALL_MS && !L.stallSaid) {
    L.stallSaid = true; L.stallAtMs = now;
    bus?.emit('house', { phase: 'stall', room: L.room, who: playerId(state), atMs: now });
    chiefSays(state, bus, HOUSE_CHIEF.stall, 'stall', L.room);
  }
  if (since >= STALL_MS + STALL_MORE_MS || (L.stallSaid && Number.isFinite(L.stallAtMs) && now - L.stallAtMs >= STALL_MORE_MS)) {
    houseFault(state, bus, 'time', HOUSE_CHIEF.time, L);
    endLeg(state, bus, H, L, 'passed', now);
  }
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
  // (the inner door: held (the #2's muzzle on it: bundle.js's Hold it writes two.hold), cleared (opened), or left)
  if ((P?.inner ?? []).length && !L.inner) {
    L.inner = P.inner.includes(H.two.hold) ? 'held' : P.inner.some(id => openingState(state, id) === 'open') ? 'cleared' : 'left';
    if (L.inner === 'left') houseFault(state, bus, 'door', HOUSE_CHIEF.door, L);
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
  // (a role-player is never turned away: ruled out or left up, by liveLegEnd (v0.0.19))
  for (const T of R.turners) if (legOf(T) === k) { if (how === 'passed') T.passed = true; if (!isLive(T) && T.turnAtMs !== null && (T.awayAtMs === null || T.awayAtMs > now)) { turnAway(T, now); bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'away', face: T.face, atMs: T.awayAtMs, toMs: T.awayAtMs + TURN_MS, why: 'string' }); } }
  if (H.live) liveLegEnd(state, bus, H, k, how);
  if (how === 'clear') {
    const met = L.contacts.filter(c => THREAT_FACES.includes(c.face) && c.by === firstBy(state, L, c.key)).every(c => c.parMet === true);
    bus?.emit('house', { phase: 'clear', room: L.room, who: playerId(state), atMs: now, met });
    // (your number two's "Clear!" after yours)
    // (dropped when his own "Clear!" (his Dominate's call beat, bundle.js) came within ECHO_MS: one call, not two (the fixer's of 0.0.12))
    if (H.twoPid && !(now - (H.two.clearMs ?? -Infinity) < ECHO_MS)) { sayOn(state, bus, { who: H.twoPid, text: 'Clear!', kind: 'speech' }); L.calls.push({ say: 'clear', atMs: now, by: 'two', how: 'echo' }); }
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
    chiefSays(state, bus, HOUSE_CHIEF.dummy, 'dummy');
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
  if (id === 'wash' && H.wash) {
    const left = H.wash.atMs + WASH_MS - state.clock.ms;
    if (left > 0 && !state.skip && !state.time?.doing && !state.stop && ctx?.sim) {
      const act = ACTIVITIES['house-wash'] ? 'house-wash' : 'idle';
      startActivity(state, bus, ctx, { id: act, args: { ms: whole(left) } });
    }
    // (the wash is the scene's clock: no move-on until it is over)
    if (left > 0) return true;
  }
  return false;
}

// ---- the view ----

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const s2 = (ms) => takeInWords(ms);
const zonesText = (Z) => ZONES.filter(z => Z?.[z]).map(z => `${Z[z]} ${ZONE_PAPER[z]}`).join(', ');
// (a leg's own times: from when it became current (room 1 from GO) to its end)
const legMs = (L) => (L.fromMs !== null && L.clearAtMs !== null ? L.clearAtMs - L.fromMs : null);

/** A leg as the paper and the hud read it. */
function legView(state, H, L, k, now) {
  const P = planOf(state, L), mine = L.contacts.filter(c => c.by === 'me');
  const takeIns = mine.map(c => c.takeInMs).filter(Number.isFinite);
  const firsts = mine.filter(c => Number.isFinite(c.firstAtMs ?? turnerFirst(state, c.key))).map(c => (c.firstAtMs ?? turnerFirst(state, c.key)) - c.seenMs);
  const threats = L.contacts.filter(c => THREAT_FACES.includes(c.face) && c.by === firstBy(state, L, c.key));
  const hot = P?.hot ?? [], covered = hot.filter(h => L.covered[h.id]).length;
  return {
    k, word: LEG_WORD[k] ?? `LEG ${k + 1}`, room: L.room, door: L.door, state: L.state, setup: !!L.setup, ms: legMs(L) ?? (L.fromMs !== null && L.state !== 'ahead' || k === H.cur ? now - (L.fromMs ?? now) : null),
    doorToClearMs: L.openAtMs !== null && L.clearAtMs !== null ? L.clearAtMs - L.openAtMs : null,
    takeIns, firsts, par: threats.length ? (threats.every(c => c.parMet === true) ? 'met' : threats.some(c => c.parMet === false) ? 'missed' : 'open') : null,
    parMissed: threats.filter(c => c.parMet === false).length, parMissedMine: threats.filter(c => c.parMet === false && ownerOf(state, { slot: slotOfStand(c.stand), room: L.room }) === 1).length,
    zones: { ...L.zones }, twoZones: { ...L.twoZones }, rounds: L.rounds, corners: { covered, of: hot.length, by: { ...Object.fromEntries(Object.entries(L.covered).map(([h, c]) => [h, c.by])) } },
    doorwayMs: L.funnelMs, faults: L.faults.map(f => ({ ...f })), presses: L.presses, pressAbout: { ...L.pressAbout }, how: { ...L.how }, seen: new Set(L.contacts.map(c => c.key)).size,
    contacts: L.contacts.map(c => ({ ...c })), inner: L.inner, kit: [...(L.kit ?? []), ...teamMarks(state, H, L)], bangMs: L.bangMs ?? null,
    ...(H.live ? { live: liveLegOf(state, H, k) } : {}),
  };
}
// (v0.0.19: a leg's live men as the paper reads them, or null with none: { n, down, gave, paint (rounds of theirs on you), paintTwo
// (on your number two), gapMs (his first round less yours on the first of them who fired: over 0 he fired first) })
function liveLegOf(state, H, k) {
  const R = rangeOf(state), men = R.turners.filter(T => isLive(T) && legOf(T) === k);
  if (!men.length) return null;
  const keys = new Set(men.map(T => T.key)), struck = (H.live.struck ?? []).filter(x => keys.has(x.by)), pid = playerId(state);
  const fired = men.filter(T => Number.isFinite(T.live.firstAtMs)).sort((a, b) => a.live.firstAtMs - b.live.firstAtMs)[0] ?? null;
  return { n: men.length, down: men.filter(liveDown).length, gave: men.filter(gaveUp).length,
    paint: struck.filter(x => x.who === pid).length, paintTwo: struck.filter(x => x.who === H.twoPid).length,
    gapMs: fired && Number.isFinite(fired.firstAtMs) ? fired.firstAtMs - fired.live.firstAtMs : null };
}
// (a role-player down by the stack's rounds, the stands' own sensor on his hits (STOP_TORSO, STOP_HEAD): a man the instructor ruled
// out is stopped too, and not down)
const downByHits = (T) => T.hits.filter(h => h.part === 'torso' && (h.zone === 'A' || h.zone === 'C')).length >= STOP_TORSO || T.hits.filter(h => h.zone === 'head').length >= STOP_HEAD;
// (each role-player counted once (the review of v0.0.19: "2 ROLE-PLAYERS · 2 DOWN, 1 GAVE UP"): a man whose hands came up before
// his rounds put him down GAVE UP, whatever was in flight then; DOWN otherwise, by his hits)
const gaveUp = (T) => T.face === 'noshoot' && !downByHits({ hits: T.hits.filter(h => !Number.isFinite(T.live?.gaveAtMs) || h.atMs < T.live.gaveAtMs) });
const liveDown = (T) => !gaveUp(T) && downByHits(T);
// (a leg's live words: "LIVE: 1 DOWN · PAINT ON YOU 0 · HIS FIRST ROUND 0.40 S BEFORE YOURS")
const liveWords = (V) => (V ? [`LIVE: ${V.down} DOWN${V.gave ? `, ${V.gave} GAVE UP` : ''}`, `PAINT ON YOU ${V.paint}`, V.paintTwo ? `PAINT ON YOUR #2 ${V.paintTwo}` : null,
  V.gapMs === null ? null : V.gapMs > 0 ? `HIS FIRST ROUND ${s2(V.gapMs)} S BEFORE YOURS` : `YOURS ${s2(-V.gapMs)} S BEFORE HIS`].filter(Boolean) : []);
const turnerFirst = (state, key) => rangeOf(state)?.turners?.find(T => T.key === key)?.firstAtMs ?? null;

/** A leg's row of the run sheet (see the header): "ROOM 1 · 7.40 S · TAKE-IN 0.80 · FIRST 2.00 · BASIC MET · 2 A · CORNERS 3 OF 3 · DOORWAY 0.30 S". */
export function legWords(V, H, dummy = null) {
  const span = (xs) => (xs.length ? (Math.min(...xs) === Math.max(...xs) ? s2(xs[0]) : `${s2(Math.min(...xs))} TO ${s2(Math.max(...xs))}`) : null);
  const kinds = [...new Set(V.faults.map(f => f.kind))].filter(k => k !== 'funnel' && FAULT_PAPER[k]).map(k => FAULT_PAPER[k]);
  return [V.word, V.setup ? 'SET UP' : V.ms !== null ? `${s2(V.ms)} S` : null, V.state === 'passed' ? 'PASSED' : null, V.takeIns.length ? `TAKE-IN ${span(V.takeIns)}` : null,
    V.firsts.length ? `FIRST ${span(V.firsts)}` : null, V.par ? `${H.par.toUpperCase()} ${V.par === 'met' ? 'MET' : V.par === 'missed' ? 'MISSED' : 'OPEN'}` : null,
    zonesText(V.zones) || null, zonesText(V.twoZones) ? `#2 ${zonesText(V.twoZones)}` : null, V.corners.of ? `CORNERS ${V.corners.covered} OF ${V.corners.of}` : null,
    V.doorwayMs ? `DOORWAY ${s2(V.doorwayMs)} S` : null, ...liveWords(V.live), ...kinds, ...(V.kit ?? []), dummy].filter(Boolean).join(' · ');
}

/** The run sheet (see the header): { rows: [{ room, words }], card, one, spinLine, practised }. The one helper of the paper, the card and the instructor's words. */
export function runSheetOf(state, ms = state.clock.ms) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return null;
  // (v0.0.19: on the live lane a leg's clock stops at the lane's end, a casualty's leg its time to the cease fire, never to the wash's)
  const at = H.live && H.end ? Math.min(ms, H.end.atMs) : ms;
  const legs = legsOf(H), views = legs.map((L, k) => legView(state, H, L, k, at));
  const d = H.dummy, dummyWord = d.clickAtMs !== null ? (d.clearedAtMs !== null ? `DUMMY CLEARED ${s2(d.clearedAtMs - d.clickAtMs)} S` : 'DUMMY NOT CLEARED') : null;
  // (the dummy on the leg it clicked in)
  const dumLeg = d.clickAtMs === null ? -1 : legs.findIndex(L => L.fromMs !== null && d.clickAtMs >= L.fromMs && (L.clearAtMs === null || d.clickAtMs <= L.clearAtMs));
  const rows = views.filter(V => V.state !== 'ahead' || V.k <= H.cur).map(V => ({ room: V.room, words: legWords(V, H, V.k === dumLeg ? dummyWord : null) }));
  const card = cardOf(state, R, H, views, ms), one = oneThing(state, H, views);
  // (v0.0.19, D2: the kit's spread, {} on a lane with nothing of it: the cease fire's head, the one thing where its fault weighs more)
  return { rows, card, one, spinLine: hashPick(HOUSE_CHIEF.spin, 'house-chief', state.meta.seed, 'spin'), practised: practisedOf(H, views), ...kit2Marks(state, H, views, { card, one }) };
}

// (the floor's gravity on the card, "1 G" in the Wheel, from the environment (the user's rule of 2026-11-08: the house is at 1 G))
const gWords = (state) => { const me = playerActor(state), g = gravityAt(state, null, me?.x ?? 0, me?.z ?? 0)?.gG ?? 1; return `${Math.round(g * 100) / 100} G`; };
// (the card's line: COMBAT §25.10.4's)
function cardOf(state, R, H, views, ms) {
  const label = (TEST_SHEETS[H.tier]?.label ?? H.tier).toUpperCase();
  const rooms = views.filter(V => V.door !== 'hall' && (V.state === 'clear' || V.state === 'passed')).length;
  const laneMs = H.goAtMs === null ? null : (H.end?.atMs ?? ms) - H.goAtMs;
  // (v0.0.19: the role-players apart, on their own words (liveCard): a man who gave up is neither a threat down nor a no-shoot)
  const stands = R.turners.filter(T => !isLive(T));
  const threats = stands.filter(T => THREAT_FACES.includes(T.face)), down = threats.filter(T => T.stoppedAtMs !== null).length;
  const nsAll = stands.filter(T => T.face === 'noshoot' || T.face === 'hostage');
  // (a hostage hit by a round of the leg's tally, or by a frag's balls (house-kit.js's hit record, `by: 'frag'`, has no zone: the
  // review of v0.0.19 found "FRAGGED THE HOSTAGE" beside "2 NO-SHOOTS UNTOUCHED"))
  const nsHit = nsAll.filter(T => T.face === 'noshoot' ? T.hits.length > 0 : T.hits.some(h => h.by === 'frag') || views.some(V => (V.zones.hostage ?? 0) + (V.twoZones.hostage ?? 0) > 0 && V.k === legOf(T))).length;
  const firstOn = views.filter(V => V.parMissed > 0).map(V => (V.k === 3 ? 'THE HALL' : `ROOM ${V.k + 1}`));
  const takeIns = views.flatMap(V => V.takeIns);
  // (v0.0.19: on the live lane a par still open at the lane's end (a casualty's room) is neither met nor missed)
  const pars = views.filter(V => V.par && !(H.live && V.par === 'open')), met = pars.every(V => V.par === 'met');
  const head = R.end?.phase === 'stopped' ? `STOPPED: ${(FAULT_WORDS[R.end.why] ?? R.end.why ?? '').toUpperCase()}` : H.end?.why === 'time' ? 'TIME' : H.end?.why === 'dry' ? 'DRY' : H.end?.why === 'casualty' ? 'CASUALTY' : null;
  return [head, ...(H.live ? casualtyWords(state, R, H) : []), `LANE ${H.lane}`, label, `AT ${gWords(state)}`, `${rooms} ROOM${rooms === 1 ? '' : 'S'}`, laneMs !== null ? `${(laneMs / 1000).toFixed(1)} S` : null,
    `${down} OF ${threats.length} THREATS`, nsHit ? `${nsHit} OF ${nsAll.length} NO-SHOOTS HIT` : `${nsAll.length} NO-SHOOTS UNTOUCHED`, ...(H.live ? liveCard(state, R, H) : []),
    firstOn.length ? `FIRED FIRST ON YOU: ${firstOn.join(', ')}` : null,
    takeIns.length ? `TAKE-IN ${s2(Math.min(...takeIns))}${Math.max(...takeIns) !== Math.min(...takeIns) ? ` TO ${s2(Math.max(...takeIns))}` : ''} S` : null,
    pars.length ? `${H.par.toUpperCase()}: ${met ? 'MET' : `MISSED ${sum(pars.map(V => V.parMissed))}`}` : null].filter(Boolean).join(' · ');
}

// (v0.0.19: the role-players on the card: "2 ROLE-PLAYERS · 1 DOWN, 1 GAVE UP · PAINT ON YOU: NONE" ("PAINT ON YOU: 1 TORSO", "PAINT ON
// YOUR #2: …" where he took some))
function liveCard(state, R, H) {
  const men = R.turners.filter(isLive), pid = playerId(state), struck = H.live.struck ?? [];
  const parts = (who) => { const xs = struck.filter(x => x.who === who); if (!xs.length) return null; const t = xs.filter(x => x.part === 'torso').length, h = xs.filter(x => x.part === 'head').length, o = xs.length - t - h; return [t ? `${t} TORSO` : null, h ? `${h} HEAD` : null, o ? `${o} LIMB` : null].filter(Boolean).join(', '); };
  const down = men.filter(liveDown).length, gave = men.filter(gaveUp).length, me = parts(pid), two = H.twoPid ? parts(H.twoPid) : null;
  return [`${men.length} ROLE-PLAYER${men.length === 1 ? '' : 'S'}`, `${down} DOWN${gave ? `, ${gave} GAVE UP` : ''}`, `PAINT ON YOU: ${me ?? 'NONE'}`, two ? `PAINT ON YOUR #2: ${two}` : null].filter(Boolean);
}
// (v0.0.19: the casualty's own words after the card's head: "PAINT: 2 TORSO, ROOM 2, BY THE MAN IN THE DEEP CORNER" ("ON YOUR #2" when his))
function casualtyWords(state, R, H) {
  const K = H.end?.why === 'casualty' ? H.live.casualty : null;
  if (!K) return [];
  const xs = (H.live.struck ?? []).filter(x => x.who === K.who), t = xs.filter(x => x.part === 'torso').length, h = xs.filter(x => x.part === 'head').length;
  const T = K.by ? R.turners.find(x => x.key === K.by) : null, k = T ? legOf(T) : -1;
  return [`PAINT${K.who === playerId(state) ? '' : ' ON YOUR #2'}: ${[t ? `${t} TORSO` : null, h ? `${h} HEAD` : null].filter(Boolean).join(', ') || 'HIT'}${k >= 0 ? `, ${LEG_WORD[k]}` : ''}${T ? `, BY ${String(LIVE_NAMES[T.stand] ?? T.name ?? 'the man').toUpperCase()}` : ''}`];
}
/** The role-players by their stand, in the paper's words (v0.0.19): room 2's deep corner and room 3's near leg. */
export const LIVE_NAMES = Object.freeze({ '2a': 'the man in the deep corner', '3a': 'the man in the near leg' });

// (the instructor's one thing to do differently: the worst number of the run, by its weight (COMBAT §17.2; my call on the weights))
function oneThing(state, H, views) {
  const n = (kind) => sum(views.map(V => V.faults.filter(f => f.kind === kind).length));
  const doorway = sum(views.map(V => V.doorwayMs));
  const score = {
    // (the par's advice from your own corner's men only: a miss on the #2's is his (the fixer's of 0.0.12))
    hostage: n('hostage') * 100, noshoot: n('noshoot') * 90, muzzle: n('muzzle') * 70, standing: n('standing') * 60, par: sum(views.map(V => V.parMissedMine ?? V.parMissed)) * 40,
    funnel: n('funnel') * 30 + Math.round(doorway / 100), corner: n('corner') * 25, door: n('door') * 20,
    dummy: H.dummy.clickAtMs !== null ? (H.dummy.clearedAtMs === null ? 50 : Math.round((H.dummy.clearedAtMs - H.dummy.clickAtMs) / 200)) : 0, time: n('time') * 15,
    // (v0.0.19, the live lane's: paint that ended it first, a man who gave up shot, a room reopened, a man left uncovered; my calls)
    ...(H.live ? { casualty: n('casualty') * 120, surrendered: n('surrendered') * 95, reopened: n('reopened') * 55, uncovered: n('uncovered') * 45 } : {}),
  };
  const worst = Object.entries(score).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  const key = worst && worst[1] > 0 ? worst[0] : 'clean';
  // (the doorway's advice below rung 2 names the Watch, the one decision that keeps the feet going through the door)
  const lines = key === 'funnel' && rungOf(state, playerId(state), 'room') < 2 && HOUSE_CHIEF.one.funnelKeys ? HOUSE_CHIEF.one.funnelKeys : HOUSE_CHIEF.one[key];
  return { key, text: hashPick(lines, 'house-chief', state.meta.seed, 'one', key) };
}

// (what a career would count: the clean rooms (no fault called), toward practised at REPS_PRACTISED; a test sheet's never moves)
function practisedOf(H, views) {
  const clean = views.filter(V => V.door !== 'hall' && V.state === 'clear' && !V.faults.length).length;
  return { clean, rooms: views.filter(V => V.door !== 'hall').length, words: `${clean} clean room${clean === 1 ? '' : 's'}: a career would count ${clean === 1 ? 'it' : 'them'} toward practised. A test sheet's never move.` };
}

/** The hot wash (see the header): { lines, spinLine, bars: [{ room, key, face, takeInMs, parMs (null for a no-shoot: no par to meet), firstMs }] }. */
export function hotWashOf(state) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return null;
  const sheet = runSheetOf(state), lines = [hashPick(HOUSE_CHIEF.wash, 'house-chief', state.meta.seed, 'wash'), ...sheet.rows.map(r => r.words), sheet.one.text];
  const bars = legsOf(H).flatMap(L => L.contacts.filter(c => c.by === 'me').map(c => ({ room: L.room, key: c.key, face: c.face, takeInMs: c.takeInMs, parMs: THREAT_FACES.includes(c.face) ? H.parMs : null, firstMs: (c.firstAtMs ?? turnerFirst(state, c.key)) !== null ? (c.firstAtMs ?? turnerFirst(state, c.key)) - c.seenMs : null })));
  return { lines, spinLine: sheet.spinLine, bars };
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
  };
}

/** The house as the hud, the bots and the end card read it (see the header), or null off the house course. */
export function houseNow(state, ms = state.clock.ms) {
  const R = rangeOf(state), H = R?.house;
  if (!H) return null;
  const views = legsOf(H).map((L, k) => legView(state, H, L, k, ms));
  const two = state.people?.[H.twoPid], faults = views.flatMap(V => V.faults);
  const sheet = runSheetOf(state, ms);
  return {
    tier: H.tier, label: TEST_SHEETS[H.tier]?.label ?? H.tier, lane: H.lane, cmd: R.cmd?.id ?? null, cmdAtMs: R.cmd?.atMs ?? null, hot: R.hot, goAtMs: H.goAtMs,
    timerMs: H.goAtMs === null ? null : (H.end?.atMs ?? ms) - H.goAtMs, par: H.par, parMs: H.parMs, cur: H.cur, curRoom: curLeg(H)?.room ?? null,
    rooms: views.slice(0, 3), hall: views[3], legs: views,
    two: { pid: H.twoPid, name: two ? `${two.service?.rank ?? ''} ${two.name?.family ?? ''}`.trim() : null, rank: two?.service?.rank ?? null, rung: H.two.rung, fired: H.two.fired, hits: H.two.hits },
    dummy: { ...H.dummy }, contacts: views.flatMap(V => V.contacts), faults, presses: sum(views.map(V => V.presses)),
    aspects: aspectsOf(state, H, views), summary: sheet.card, sheet, end: H.end, rangeEnd: R.end, standby: H.standby ? { ...H.standby } : null, wash: H.wash,
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
    observerId: R.coachId, roId: R.roId, paper: 'man', line: null, strings: [], end: R.end, house: N, summary: N.summary,
    score: { shots: N.aspects.shots.rounds, hits: sum(Object.entries(N.aspects.shots.zones).filter(([z]) => z !== 'miss').map(([, n]) => n)), down: threats.filter(T => T.down).length, of: threats.length,
      faults: R.faults.length, clearAtMs: R.end?.phase === 'clear' ? R.end.atMs : null },
    dry: !!R.dry,
  };
}

/** What "Again as …" starts: the same seed, another sheet, the par the picker set (else the sheet's own). */
export const againAsHouse = (state, tier) => ({ scenario: 'test-shoothouse', seed: state.meta.seed, tier: tierOf(tier), par: houseOf(state)?.parSet ?? null, ...(houseOf(state)?.loadout ? { loadout: houseOf(state).loadout } : {}), ...(houseOf(state)?.opfor ? { opfor: houseOf(state).opfor } : {}) });

/** The goal line with your number two named: COMBAT §25.10.4's. */
export function houseGoal(state) {
  const H = houseOf(state), two = state.people?.[H?.twoPid];
  const who = two ? `${RANK_WORD[two.service?.rank] ?? two.service?.rank ?? ''} ${two.name?.family ?? ''}`.trim() : 'your number two';
  // (short enough for the goal box's two lines at 1600 × 900, the rule that matters most last but whole (the fixer's of 0.0.12))
  return `Lane A at 1 G, ${who} your number two. On GO: three rooms and the hall. Threats down, no-shoots untouched.`;
}
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
    aid: cornerAidLook(state, H, ms),
  };
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
 */
export function cornerAidLook(state, H = houseOf(state), ms = state.clock.ms) {
  const out = { marks: [], sector: null };
  if (!H || H.end || H.goAtMs === null) return out;
  const pid = playerId(state), rung = rungOf(state, pid, 'room'), hold = aidHoldMs(rung), legs = legsOf(H), plans = lanePlanOf(state).plans;
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
    if (km > 0) for (const r of rules) out.marks.push({ room: L.room, slot: r.slot, mine: r.slot === mine, k: q(km, 0.01), corner: { x: r.corner.x, z: r.corner.z, along: r.corner.along, back: r.corner.back }, point: [...r.point] });
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
  for (const A of arcsOf(WHEEL_S4.id)) {
    const k = leafAt(state, A.door, ms), moving = k > 0 && k < 1 || (openingState(state, A.door) === 'open' && k < 1);
    const shut = openingState(state, A.door) !== 'open';
    const ours = (P?.door === A.door && shut) || (inner.includes(A.door) && shut);
    if (!ours && !moving) continue;
    const sw = P ? (A.door === P.door ? doorSwing(state, P) : doorSwing(state, { ...P, door: A.door }, P.room)) : null;
    out.push({ door: A.door, hinge: [...A.hinge], u: [...A.u], n: [...A.n], widthM: A.widthM, openK: q(k, 0.001), moving, how: sw?.how ?? null });
  }
  return out;
}
