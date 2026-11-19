// OLYMPUS sim: the bundles, the drill's steps for a slot and a rung, run through the stepper, and where they hand the decision back (COMBAT §25.2, §25.5, §25.7, §25.8; BODY §16.2; the build sheet 0.0.12 §2.2, §4, §8 items 2, 4, 8, 9, 20).
//
// What T does grows with the rung, the mechanics never change (the user, 2026-11-07: "no watering down but factor in
// experience in how smooth and fast we do things"): a bundle is the drill's beats (src/sim/combat/drills/enter-and-clear.js)
// planned for a door of the lane (src/sim/combat/room.js roomPlanOf: its stack, points, paths, corners, hot spots),
// a slot (1, the player's; 2, the #2's) and a rung, and run by the stepper (src/sim/combat/stepper.js), which runs the
// beats one at a time to rung 2 and lets the hands and the voice (rung 3) and the eyes (rung 4) work while the feet move.
//
// The beats' times (the build sheet's §4, each my call, reproducing §4's 1 G table):
//   move     the plan's path, routed round the walls on the nav (route.js routed: from 2026-11-11 every leg not clear at
//            the walker's C0 goes the nav's way, the bundle's own doors counted open), at the stance's walk
//            (motion.js gaitSpeeds: Combat 1.23, Assault 2.03 m/s at 1 G), pushing
//            and braking at BODY §16.2's legs (motion.js tractionOf: the private 3.12 and 5.07 m/s² with 25 kg on 75), as
//            a closed-form trapezoid (moveAt): rest to rest below rung 4, the approach flowing into the entry at rung 4
//            (it leaves the stack at the Combat walk and the entry speeds up into the Assault lope); its arriveMs is when
//            ARRIVE_M 0.6 m are left, the flowing hand's cue on the door
//   posture  high ready HIGH_READY_S 0.3 × the rifle's HIGH_READY_K 1.15 × paceOf(WH)
//   aim:point the muzzle onto the door: shot.js aimS's sight and turn (AIM.sight × pace + 20° / (90 + 6 WH)), no feet
//   door     the hand DOOR_HAND_S 0.2 × paceOf(WH), then the leaf's swing (the opening's openS, doors.js DOOR_S 0.4 s);
//            a pull adds PULL_STEP_S 0.3 × pace (the step back off its arc); a kick is KICK_S 1.2 s, Fitness against the door's
//            kickDc (an unlocked door KICK_DC_OPEN 8), failed ×FAIL_K 1.6 and the bundle handed back ("Locked. Kick it
//            again, or hold it."); its passMs the leaf passable: open below rung 3, at PASS_SHARE two thirds open from 3 on a
//            push or a kick (flowing in behind the leaf), fully open on a pull at every rung (its leaf swings toward the stack)
// The swing (2026-11-15, the user: "doors should have a direction they open (pull or push) and it should affect our options
// for entry"; src/sim/places/swing.js, the plan's `swing`): the stack on the latch side (the plan's), #1 opens it; a push he
// shoves on the approach's last ARRIVE_M from rung 3 and flows in behind; a pull he stops at the stack for (the approach ends at
// rest, the door's beat after the feet, never on their last stretch), draws, steps back and lets swing clear; a kick only on a
// push (a pull door's row struck KICK_PULL_WHY "opens toward you", its variant never planned, Push ⇄ Kick offered on a push
// only); Open names the way ("Open the door: pull") and the read says it ("Pull door, hinge right.", a line at its end).
//   scan     the eyes: deg / (120 + 6 AWR) + 0.2 × paceOf(AWR) (the corner: from the path's heading to the slot's corner;
//            the sector: from the corner across to the farthest hot spot the slot holds); a held sector while it runs
//   call     CALL_S 0.8 s ("Clear!", "Ready"), CALL_FLOW_S 0.2 from rung 3 (said over the move)
//   mark     MARK_S 0.6 × paceOf(WH)
//   wait     the #2's seam: react.js goMs(WF)
// A failed roll (the kick) is ×FAIL_K; a rushed bundle (Shift) ×RUSH_K 0.6 on every beat but the feet's and −3 on its
// rolls, never routine (the fixer's of 0.0.12: a move's time is its profile's, the legs' limit, so a rushed walk scaled by
// time alone stopped 40% short of the stack; the hands, the eyes and the voice are what hurry). The approach and the moves read the gravity and the floor where they start (env.js gravityAt, surfaceAt:
// nothing assumes Mars or 1 G).
//
// The rows (shooting.js stepsOf reads them in the house): singleRows (every rung: Stack up, the door's rows by its
// swing and lock, Watch a hot spot, Look at one, Move to the point or the hall's end, Hold it, "Clear!", Mark, the
// stances, X go) and bundleRows (the rung's bundles at the lane's door, offered by templates.js offered: the rung reached
// and lived once by hand; a bundle of the rung not yet lived struck "by hand first"). **Below rung 2 nothing but the keys
// crosses a door's plane into a room not yet cleared** (the user: "then would move in using movement keys (game unpaused
// with X)"): rung 0 and 1 rows end at the stack and the door; Move to the point is offered only once past the threshold.
// A bundle never fires, picks, reloads, spends or crosses a door the plan does not take.
//
// Hand-backs (COMBAT §25.8.2; the rest queued as the panel's "Carry on: …", state.stop.carry): a person newly seen
// (contact.js halts the bundle at the pause, 'contact'), an identified no-shoot ('noshoot'), a door that will not open
// ('refused': "Locked. Kick it, or hold it."), a door the plan does not take ('door-unplanned': "Door, east wall. Hold it
// or clear it?"), the #2 over TWO_SLOT_M 1.5 m from his slot TWO_WAIT_MS 3 s after #1 is stacked ('two': "Your number
// two's not with you."), the gun, a failed roll not routine, a seam below the rung, the lane's end; Backspace or X stops
// it after the beat ('stop').
//
// The #2 (runSlot): the same plan for slot 2 (his stack 0.65 m behind, his point and corner the plan's second), one group
// at a time with react.js goMs between below rung 3, the whole room from 3, his beats at his own rung; his entry cued by
// distance (the rework's R5, below; v0.0.12 cued it on #1's first step into the doorway); nothing new while he is on a man (his
// take-in, his row: the scene's), and his room swept only by a Dominate that ran to its end. His shots are the scene's (shoothouse.js).
// bundleNow is the face's view of a running bundle: its lanes of glyphs and its time.
// The variants are rows set at no time (setVariant, state.stop.variant: "Push ⇄ Kick", "Assault ⇄ Combat"; the plans give
// one path a slot, so "Cross ⇄ Hook" waits); a variant rides the bundle's row id ('drill:room:clear@combat>o:w4:r1').
// A halted bundle's rest is state.stop.carry ({ from, bundle, door, rung, variant, beats, why, words, paths: the cut moves'
// rest of path }), carried on from where the body stands (carryRow, carryOn); a shot row fired moving on carries it on at
// its end when nobody of the contact stands (shooting.js: "the drill carries on", COMBAT §25.5.3). The hand-backs asked once
// (the #2's wait at a door, an inner door) are kept on the house's record (R.house.asked), so "Carry on" goes on; a kicked
// lock on R.house.broken, a door read on R.house.read. Below rung 3 the entry's muzzle goes straight in (the door's inward
// normal) and the body faces into the room (the beat's `look`); from rung 3 the eyes and the head are on the slot's corner
// (the beat's `eyes`: react.js reads it as a held sector); a scan sweeps the head (`sweep`, shooting.js stopRules).
// 2026-11-12 (the shoot house's rework R3, COMBAT §25.19.3): **the flow**. From rung 2 a contact's pause suspends the
// player's bundle instead of cutting it (contact.js; stepper.js suspendFlow): the doing moves to state.stop.flow, its beats
// untouched, and the choice is made with time standing still. A list step chosen then (a shot row, the aim, Fire, a reload,
// IMMEDIATE ACTION: flowIn) runs on the hands **inside** the flow, the flow taken up beside it (stepper.js resume with the
// hands held), so the feet go on to the point while the rounds go; a step that needs the feet (Hold him, Challenge, a
// stance, a Wait, the shot with "stop here") halts the flow as v0.0.12 halted it, its rest the panel's "Carry on: …". When
// the step ends (flowAfter) the drill goes on by itself, the bundle the doing again, with no stop and no "Carry on", unless
// a decision is owed: a man of your own corner still up and facing, a window open, a reflex card, a macro's rest; then
// the flow is suspended again and the game stands still. "Carry on" at a suspension takes the flow up with nothing beside
// it (a no-shoot's, the #2's man's). The rifle brought back to high ready first where the step left it aimed (`up`, as
// carryPlan's). Below rung 2 everything is as built (the walk in by the keys, the feet's brake at the window's end).
// The beats amended (§25.19.2.1): `ready` by slot (#1 high ready, the #2 and later low ready, muzzle down: CALL 97-20),
// the muzzle onto the door #1's only; the inner door asked from the point (`inner`, after the sector and the feet at the
// point, never from the doorway); "Clear!" waits on the scene's ready-to-clear predicate (useClearGate: a window open, a
// man turned under a second ago and not yet seen, a turner whose trigger fired and has not turned) up to CLEAR_HOLD_MS,
// then hands back ('clear'), and a man of the room up and facing suspends it from rung 2 (the shot resumes it); the
// crossing rule (crossTick): a move whose next CROSS_AHEAD_MS would carry an aimed muzzle's line across a teammate brings
// the rifle to low ready for the crossing and back after (the move kind's own rule, at every rung).
// 2026-11-12 (the rework's R4, COMBAT §25.19.2, §25.19.4): **the catalogue** (drills/enter-and-clear.js MUSCLE): one door a row
// (the lane's bundle withdrawn: planBundle plans a single door, its approach routed from wherever the body stands); the rows
// by group and slot, every row at every rung, a row above the rung greyed with its rung and paged last (later), the explosive
// breach greyed "no charge issued"; rung 2's groups Stack up, take point, "Open, in: your corner" and Dominate (the #2's
// runSlot the same groups); the labels in a marine's words for the door ("Open", "Kick", gone where it stands open), a
// Top up on the way named where the row will do it (reorgOf: the reorg beat, drills.js runMacro on the hands); the read and
// the tell at the stack, "Room clear!" ending every room row; the stances named for what they trade (STANCE_NAMES: Careful,
// Fast) and the first switch said in one line (state.mind.hints.stance); the standing order's row from rung 4 (setVariant
// keeps it on the house's record, contact.js byOrder fires it); upgradeMuscle maps a save's withdrawn rows.
// 2026-11-12 (the rework's R5, COMBAT §25.19.3.4, §25.19.5): **the #2 beside you**. His entry is cued by distance (entryGo): your
// centre ENTRY_GAP_M 0.75 m past your own threshold waypoint along your path (pastWaypointM), or, your walk in known, ahead of time
// so that he reaches his own threshold as you reach that (entryAhead, his time from his stack planned once and kept on his record);
// a #1 who stops inside by the keys cues him ENTRY_WAIT_MS later. Every tick of his walks holds the body gap (gapHold): his next
// place closing within BODY_GAP_M 0.50 m (+ GAP_GUARD_M) of you holds his walk a tick, counted on his record (rec.gap), which the
// cue should leave idle. He goes to the next stack with you: not before your own move starts, or you are LEAD_GONE_M from where you
// stood (leadGone), then after the least delay that keeps his walk GIVE_MARGIN_M more off yours (giveWay: both closed forms, a
// tick at a time). His own Top up rides his walk to the stack (`reorg`, his slot too, on his hands at every rung): "Reloading!",
// then "Up." (TWO_SAY).
// 2026-11-13 (the rework's R8b, fluid movement; the user: "soldiers need to stay fluidly moving"): **the #2 never waits in a
// doorway** (src/sim/places/zones.js's no-stop zones). He steps into one only when his way through it is clear of you
// (crossingClear: you not standing within the body gap of his path through it and CROSS_CLEAR_M past; you on the move are no
// block, since you never come to rest in one but by your own choice), so blocked he holds at his stack, outside it; a walk
// already under way is held at its edge the same way (zoneGate, counted on his record, rec.gate); and his free body, whose
// brake would leave him at rest in one (his take-in, his row), is carried through to his next point past it on his own lane
// (freeBody: places/move.js throughTick, held off you by the body gap), his head left on his man.
// 2026-11-15 (the user: "squad AI sometimes stays out of the room on entry (room 2)"): **the #2 in on his cue, every room**. His
// crossing reads CROSS_CLEAR_M past the doorway and no further (crossingOf: v0.0.14 to v0.0.16 read the whole leg the stretch
// ended on, room 2's 1.5 m straight in to his point, so you standing anywhere near it held him at his stack); an entry of his
// cut short of the threshold by his take-in goes on in (never back to his stack to wait for your cue again); and your feet are
// carried off his way in as out of a doorway (places/zones.js useKeepClear, the scene's). Held to it by the gauges' F25.
// v0.0.18 (the build sheet 0.0.18 §2.3; COMBAT §25.20): **the kit**. The rows "Breach (explosive)", "Flash it", "Pry it" and "Ram
// it" are offered where the kit carries what they need (breach.js kitHas; else the breach struck "no charge issued" as built, and
// at a pull door "Pry it" struck "not issued" in its place), and the variant rows cycle the ways in the door and the kit allow
// ("Push ⇄ Kick ⇄ Pry ⇄ Charge": breach.js entryOptions) and the bang ("No bang ⇄ Flash"), so "Flash, in: your corner" and
// "Charge, clear the room" are the room rows with their variant (drills/enter-and-clear.js kitBeats). The kit's beats: `arm` (the
// rifle let hang, a G-11 from its pouch at its face's reach, the pin: devices.js), `throw` (throw.js's closed form through the
// open door, "Bang out!", the grenade on the floor burning: its fuseAtMs), `burst` (the bang beat: the eyes off it and the rifle
// back up while the fuse burns; at its end the burst, burst.js tickDevices); `place` (the SC-1 on the latch edge, Demolitions
// DC 10, a miss ×FAIL_K; your #2 sent to his safe point, rec.safe), `back` (to yours: breach.js safePointsOf), `prime`, then
// `breach` ("Breaching!", the count BREACH_S and the fire; FD-1's misfireP 0.01 hands back "Misfire. Prime it again.", the
// charge to prime again by Carry on, the words naming no way the safe point does not offer); `force` (the halligan or the ram off the back, Fitness against the door's DC + the tool's
// dcK, a fail ×FAIL_K and "It won't give. Again, or hold it.", the tool let go at the door, the rifle up). A device left in the
// hands by a cut or a hand-back has its own rows (deviceRows: "Throw it", "Pin back in", "Let it go"), never a dead end; a
// tool let go at a door is picked up again by "Pick up the halligan".
// v0.0.20's hunt (breach-4, breach-10, breach-11): Shoot the lock on an inner door walks you from across the room to its latch
// side first (innerStandOf, the walk in the row's time; startSingle's `walk`), and an inner door opened with a man at its leaf is
// seen (innerSeen, H.innerSeen; shoothouse.js reads it at the room's "Clear!": merely open is
// 'open', a fault); the breach struck "charge spent" (CHARGE_SPENT) once your charge has burst, never "no charge issued"; Pry it
// at a later door struck "halligan left at room 2" (toolLeftOf), never gone with nothing said.
// v0.0.19 (D2, the build sheet 0.0.19 §1, §3.1; kit2 §2.7): **the second slice of the kit.** The practice frag and concussion
// ride the bang's beats with their count: `cook` (the lever let go, the count held: devices.js cookCount, Weapon handling DC 6,
// unpaced; the fuse running from the lever), the throw saying the device's own call (DEVICES[model].call: "Frag out!",
// "Concussion out!") and solved against the fuse the thrower believes is left (throw.js fuseLeftMs), aimed deep for a frag or a
// concussion (throw.js aimOf) and at the room's middle for a G-11 as built; the bang beat ends at the burst. The BC-1 rides D1's
// place, back, prime and breach beats (breach.js chargeFor: its model and its edge, the hinge side on a pull door), and
// `shootDoor` is the R-7's ballistic breach (ballistic.js shootRound: each round a real shot through shot.js resolveShot, its
// magazine, a stoppage, the dummy; the shots recorded by the scene's hook, useDoorShot). The variant rows cycle the bangs the kit
// carries ("No bang ⇄ Flash ⇄ Frag ⇄ Concussion") and the cook ("Cook 2 ⇄ Throw at once"), and the door's rows carry the lane's
// `five` (house-kit.js fiveOf: 'breach' on a breaching lane) where it is set. A live grenade's ways (deviceRows) are Throw it and
// Throw it clear only.
// v0.0.19 (the build sheet v0.0.19 §3.2; team.js): **the team**. A plan's `slot` is the role (the beats' slots, the reorg, the
// ready, the stack approached), its `side` the geometry slot it works (the entry's path, point and corner, the scans: team.js
// sideOf's by default, so with nothing swapped every plan is v0.0.18's); the #2's side at his cue is sideFor's (FM 3-06.11 §3-29:
// you past the threshold on his side and out of the doorway, he takes yours, "Left!"; back on your own before his threshold, he
// gives it back, sideBack). The door's and the kit's beats are the
// doer's (`doer`: you by DOER_DEFAULT, your #2 on your word); TEAM 2 to 4 (teamRows: "#2, bang it", "Breacher up: <way>", "As you
// were", struck by team.js taskWhy) run your `order` (its end writes R.house.two.task) and your walk to the give line; his task
// bundle (TEAM_TASKS: to the stack's front point, his work, back to his own) is taskSlot's; your entry on his work drops his
// beats and waits on a `cue` (his beat done on the task's record, at most CUE_MAX_MS past his plan), from the give line (out to it
// first from his front point). Held off the front point by you, he says "Give me the door!" (frontSay). As you were, or a task that
// failed, with his charge on the door and its fuse not running: he takes it off ('two:recover', the `recover` kind), and your way
// back onto the stack goes along the give line past him (giveVia). TWO_SAY and SAY are read from team.js TEAM_WORDS.
// v0.0.19 (the build sheet v0.0.19 §3.3; COMBAT §5.7, §25.18's reach review: "suspends for incoming fire and for a hit"):
// **the startle suspends the flow**. A marine startled (supp.js startled: a round's sting, a near miss, a blast) starts nothing
// new and does not walk on while he is frozen: his running bundle is suspended 'startle' (stepper.js SUSPENDS) where it stands,
// its running moves cut where the body is (the speed at that instant going on into the brake, BODY §16.2) and put back to wait
// with the rest of their path (pauseMove), its running looks paused (pauseScans), its hands and voice beats let end; at the
// startle's end it goes on by itself, the moves planned again from where the body stopped, with no stop and no "Carry on". A
// window that opened before or comes after pauses as ever (contact.js). The player's (startleTick, the people domain's look
// layer, every lived tick, through contact.js contactLook; beatsDone keeps the suspended doing as the doing, no hold) replaces
// supp.js's "stop after the running beat" for a bundle, which let the feet run on to the move's end while the keys were taken;
// a flow beside a list step is held the same way and, the step over by the startle's end, left suspended as the decision it
// is. The #2's (runSlot's head): his doing held the same way while he is startled, his free body braking. A lane with no
// startle writes nothing new. The live lane's words: a "Clear!" the scene's gate holds on a live man hands back with his reason
// (HANDBACK_WORDS down, hands, unaccounted), and the lane's casualty halts every doing ('casualty', the scene's).
// v0.0.20 (the build sheet v0.0.20 items 1, 3, 8, 9, 19; COMBAT §25.8.2, §25.19.3.5, §25.19.5): **the bodies and the line**. Your
// walk held by his standing body: he steps off it at PIN_GIVE_MS (stepOffPath, v0.0.19's), never while on a task of yours or its walks
// (onTask: you are walked round him, places/move.js roundAbout); held PIN_END_MS it hands back ('blocked'); a leg the stall passes hands
// back what still runs on it ('stall', "Move on.", HANDBACK_WORDS), and his walk to that leg's stack where he stands (twoLegOver). His
// walk held by your standing body TWO_PIN_MS (a walk of yours held by a body is standing: heldStill), you outside a doorway, is routed
// round you (twoRound; in the hall onto its other wall) or ended where he stands, the hold's record closed once nothing of his walks is
// left to hold (gapSettle), and held on his cue where no way round is (entryRound tried
// each TWO_PIN_MS), "Coming in!" again every TWO_BLOCK_REPEAT_MS (blockedCall) and the hold's time on the leg (blockEnd: L.twoHeldMs; the
// DI's cqb-two-out at TWO_OUT_LINE_MS). Below rung 3 he closes up on your heels (heelsGo, heelsStart: your vacated stack point as you
// leave it toward the open door), cued ENTRY_WAIT_MS 400 (was 1,000) after you stop inside, and flows in from there at Fast. In the
// hall his place along its axis is held at or behind yours plus HALL_LEAD_M (hallHold), and from rung 2 your lead over HALL_PAIR_M
// brings him at Fast (hallHurry; hallLead is the DI's cqb-pair's measure). The crossing rule's mirror (mirrorTick): a move that would
// carry a body into the other's live line of fire (carry.js lineMasked) is held a tick at a time, at most MASK_HOLD_MAX_MS, counted
// on H.mirror.
// v0.0.20 (the hunt of v0.0.18's kit findings): **hands full**. While a hand holds a device not yet live the rifle stays on its sling
// (setPosture keeps it there; devices.js handsFullWhy strikes Up and the gun refuses it), and every drill row whose beats do not
// use the device is struck "hands full: the G-11" (handsStruck, applied by shooting.js houseRows; the #2's tasks, the variants,
// the door's hand, the feet, the eyes and the stances stay live), so its ways out and the drill that uses it are what is left.
// From the stack side of a shut door "Throw it" and "Cook 2" are struck "door shut" (shutBetween), and so is a drill whose next
// beat there is its cook or throw before any beat that opens the door; a throw beat that meets a shut door hands back "Door
// shut." with a grenade not yet live (a live one leaves the hand at the thrower, so the leaf stops it). A charge placed or primed
// on the shut leaf (chargeOnLeaf) is the way in: yours sets the room's rows to it (@charge, @cut) with no cycle to another
// (breachWays), and every row that would open the leaf another way, the door's push, pull and kick and the drill's and the #2's
// rows alike, is struck "a charge is on the door" (breach.js CHARGE_ON_WHY); the door beat never waits on a #2 held at his
// charge safe point, and that hold ends once your leg is another door's. #1's tell reads the door's swing for every way in but
// the kick ("Opens out" on a pried pull door).
// Pure but startBundle, stopBundle, carryOn, startSingle, runSlot, flowIn, flowAfter, crossTick, startleTick and the beat handlers,
// which write the doing records, the actors, the doors and the facts.
import { holdTime, releaseTime, TICK_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream, chance } from '../../core/rng.js';
import { playerActor, playerId } from '../../core/ids.js';
import { G0_MS2 } from '../../core/phys.js';
import { paceOf } from '../skills/skills.js';
import { check, oddsOf } from '../skills/checks.js';
import { sheetOf, valueOf, rungOf, offered } from '../skills/templates.js';
import { gaitSpeeds, tractionOf, MOVE_STANCES } from '../body/motion.js';
import { gravityAt, surfaceAt } from '../places/env.js';
import { openingOf, openingArea, openingState, setOpening, leafClosed, areaOf } from '../places/model.js';
import { DOOR_S, leafAt, LEAF_HOWS, stopAtOf } from '../places/doors.js';
import { AIM } from '../arms/shot.js';
import { facingOf } from '../arms/turners.js';
import * as KIT from '../arms/kit.js';
import { halfOrLess, fullerAtHand, topUpGains } from '../arms/kit.js';
import { goMs } from './react.js';
import { registerKind, useBeats, advanceBeats, halt as haltDoing, flowOf, profileOf, profileAt, profileWhen, moveAt, moveNow, pathLen, suspendFlow, resume, release, markOf, pauseScans, kindOf } from './stepper.js';
import { muzzleOf, flagsAt, SLUNG, lineMasked, lineFromOf, MASK_HOLD_MAX_MS } from '../arms/carry.js';
import { relook, ORDER_RUNG } from './contact.js';
import { ENTER_AND_CLEAR, bundleDef, beatsOf, BUNDLES, ARRIVE_M, PASS_SHARE, REMOVED, MUSCLE, KIT_BEATS, kitBeats, BANGS, AFTER_D2, cookDefault, taskDef } from './drills/enter-and-clear.js';
import { kitHas, entryOptions, safePointsOf, chargePointOf, placedOn, forceMs, FIRE_S, NOT_ISSUED, chargeFor, ballisticOk, NOT_LOCKED, shootMs, CHARGE_ON_WHY } from './breach.js';
import { shootPlanOf, shootRound, BALLISTIC_MAX_ROUNDS } from './ballistic.js';
import { tickDevices, stunOn, liveIn } from './burst.js';
import { DEVICES, deviceMs, pouchedOf, handDeviceOf, handsFullWhy, setSt, fuseBelieved, wayOut, HANG_S, UP_S, DEVICE_ACTIONS, devicesOf, cookCount, cookOk, MISFIRE_WAIT_MS } from '../arms/devices.js';
import { throwSolve, throwLand, throwDc, throwVMax, aimOf, fuseLeftMs, DEEP_BEYOND_M } from '../arms/throw.js';
import { spinOf } from '../places/spin.js';
import { beliefOf, doAction } from '../arms/firearms.js';
import { macroMs, runMacro } from '../arms/drills.js';
import { rollerOf } from './roll.js';
import { handsPath } from '../arms/devplan.js';
import { roomPlanOf, lanePlanOf, pastThreshold, inFunnel } from './room.js';
import { cornerRuleOf, frameOf, STATUS_MS, MOVE_ANSWER_MS, MOVE_WAIT_MAX_MS, CORNER_POINT, pointOfRule } from './corner.js';
import { ownerOf, sideOf, TEAM_WORDS, TEAM_OPPOSITE, DOER_DEFAULT, CUE_MAX_MS, sideTaken, takeOtherSide, giveSideBack, giveOf, taskOf, taskWhy } from './team.js';
import { upNow } from './men.js';
import { startled } from './supp.js';
import { routed, clipped } from './route.js';
import { coastTo, throughTick, throughAway, stepAside, roundAbout, PIN_GIVE_MS, PIN_END_MS } from '../places/move.js';
import { liveZoneAt, zoneAt } from '../places/zones.js';
import { swingFrom, KICK_PULL_WHY } from '../places/swing.js';
import { locoStep } from '../body/loco.js';
import { COURSES } from '../../data/courses.js';
import { houseSpecOf } from '../scenes/assemble.js';
import { opOf, opRec, brokenOf, breakOpening, sessionOf } from './op.js';

/** The beats' times (see the header), s at pace 1 unless named. */
export const HIGH_READY_S = 0.3, HIGH_READY_K = 1.15, DOOR_HAND_S = 0.2, PULL_STEP_S = 0.3, KICK_S = 1.2, READ_S = 0.7, CALL_S = 0.8, CALL_FLOW_S = 0.2, MARK_S = 0.6;
/** The rung from which the approach flows into the entry at the Combat walk, never stopping at the stack (COMBAT §25.19.8 F6: "the feet never stop between the stack and the point", rung 3 and up; the rework's R4: rung 4 before). */
export const FLOW_IN_RUNG = 3;
/** The explosive breach's count, s (COMBAT §25.19.2.1: "a count of 2 to 3 s"; data only until a charge is issued). */
export const BREACH_S = 2.5;
/** The eyes' turn (a look, a scan): deg / (LOOK_TURN_BASE + LOOK_TURN_PER × AWR) + LOOK_S × paceOf(AWR); a Watch: AIM.turn's rate + WATCH_S × paceOf(WH). */
export const LOOK_TURN_BASE = 120, LOOK_TURN_PER = 6, LOOK_S = 0.2, WATCH_S = 0.4;
/** A door unlocked kicks against KICK_DC_OPEN; a failed roll takes FAIL_K its time; a rushed bundle RUSH_K its time and RUSH_V on its rolls. */
export const KICK_DC_OPEN = 8, FAIL_K = 1.6, RUSH_K = 0.6, RUSH_V = -3;
/** The #2's place: over TWO_SLOT_M from his slot TWO_WAIT_MS after #1 is stacked hands back (the build sheet 0.0.12 §4). */
export const TWO_SLOT_M = 1.5, TWO_WAIT_MS = 3000;
/** Your "Clear!" waits on the #2's entry and sweep of the room at most this long (ms; my call), and on his man without limit. */
export const CLEAR_WAIT_MS = 5000;
/** The #2 away and not walking to his slot: the hand on the door looks again this often (ms; my call). */
export const TWO_POLL_MS = 500;
/** Stacked: within STACK_NEAR_M of the slot's stack point; the door's rows within DOOR_REACH_M of its middle. */
export const STACK_NEAR_M = 0.3, DOOR_REACH_M = 1.5;
/** Off the line's longest step to the wall (COMBAT §25.19.6, §25.19.9; arms/sidearm.js), metres. */
export const COVER_STEP_M = 1.5;
/** The body under the kit when the person record gives none, and the kit when kit.js cannot weigh it (the build sheet §4: 25 kg on 75). */
export const BODY_KG = 75, KIT_KG = 25;
/** "Clear!" waits on the scene's ready-to-clear predicate at most this long, then hands back (ms; COMBAT §25.19.9). */
export const CLEAR_HOLD_MS = 4000;
/** A "Clear!" the scene found void is said again, after its beat, at most this many times (my call: past APPEAR_MS's second at the call's 0.2 s). */
export const CALL_AGAIN_N = 8;
/** The crossing rule (COMBAT §25.19.2.1): the next CROSS_AHEAD_MS of a move looked at, every CROSS_STEP_MS (ms; my calls). */
export const CROSS_AHEAD_MS = 500, CROSS_STEP_MS = 100;
/** The #2's entry behind #1 (COMBAT §25.19.3.4, §25.19.9): cued once #1's centre is ENTRY_GAP_M past his own threshold waypoint along his path (about 0.4 s at the tier one's lope), or, off his path (the keys), past the threshold that far from it; a #1 who stands inside ENTRY_WAIT_MS cues him all the same, the body gap holding him off (my call: never a dead end). v0.0.20 (the build sheet's item 8, drill.md D2: "almost simultaneously", FM 3-06.11 §3-22c(6)): 400 ms, was 1,000. */
export const ENTRY_GAP_M = 0.75, ENTRY_WAIT_MS = 400;
/** v0.0.20 (item 8): below rung 3, you leaving your stack toward the open door (HEELS_FROM_M along your lane, at CROSS_STILL_MS or more), your #2 closes up onto your vacated stack point on his `heels` beat, HEELS_M behind you (TWO_BEHIND_M, the stack's spacing), the body gap holding (m). */
export const HEELS_FROM_M = 0.2, HEELS_M = 0.65;
/** v0.0.20 (item 19, drill.md D6): in the hall the #2's place along its axis is held at or behind yours plus HALL_LEAD_M; your lead over him past HALL_PAIR_M brings him at Fast and the DI's cqb-pair (m). */
export const HALL_LEAD_M = 0.3, HALL_PAIR_M = 2.0;
/** v0.0.20 (items 1 and 9; user.md U-5): your #2's walk held by your standing body TWO_PIN_MS, you outside a doorway, is routed round you; held on his cue where no way round is, his "Coming in!" again every TWO_BLOCK_REPEAT_MS, and the DI's cqb-two-out at TWO_OUT_LINE_MS (ms). */
export const TWO_PIN_MS = 1500, TWO_BLOCK_REPEAT_MS = 4000, TWO_OUT_LINE_MS = 3000;
/** Your walk held by a body (places/move.js's, re-exported): the give-way at PIN_GIVE_MS, the hand-back at PIN_END_MS (ms). */
export { PIN_GIVE_MS, PIN_END_MS };
/** The body gap (COMBAT §25.19.9): a team member's move is held a tick at a time while its next place would close within BODY_GAP_M + GAP_GUARD_M of the other's body; the #2 leaves for a stack only when his walk keeps GIVE_MARGIN_M more than that off yours, looked at every GIVE_STEP_MS of delay up to GIVE_MAX_MS, GIVE_TAIL_MS past both walks' ends (m, ms; my calls). */
export const BODY_GAP_M = 0.50, GAP_GUARD_M = 0.02, GIVE_MARGIN_M = 0.1, GIVE_STEP_MS = 100, GIVE_MAX_MS = 4000, GIVE_TAIL_MS = 500;
/** Your bundle's walk held this long by the #2's standing body before he steps off your path (ms; my call, the dead-end hunt of 2026-11-16: two walk ticks' thought, well under F14's stall; v0.0.20: places/move.js PIN_GIVE_MS's figure, a literal since this module and move.js are in one cycle and a top-level read would throw in one load order; tests/house-unpinned.test.mjs holds them equal). */
export const OFF_PATH_AFTER_MS = 400;
/** #1 has gone for the next stack (the #2 goes with him): his own move running, or this far from where he stood when the #2 began to wait (m; the keys). */
export const LEAD_GONE_M = 0.5;
/** The words of the hand-backs (COMBAT §25.8.2). */
export const HANDBACK_WORDS = Object.freeze({
  refused: 'Locked. Kick it, or hold it.', doorShut: 'Door shut.', 'refused-kick': 'Locked. Kick it again, or hold it.', 'door-unplanned': 'Door, {wall}. Hold it or clear it?',
  // (the lane's own door has no Hold it row, and a door not locked that held a kick is not locked (the fixer's of 0.0.12))
  'refused-lane': 'Locked. Kick it.', 'refused-kick-lane': 'Locked. Kick it again.', 'refused-held': 'It held. Kick it again.',
  two: "Your number two's not with you.", 'lane-end': 'End of the lane.', gun: 'The gun.', fail: 'Fumbled.', seam: null, contact: null, noshoot: null, stop: null, clear: 'Not clear yet.',
  twoMan: "Your two's on a man.",
  // (the far leg's wait handed back by its cause (moveWaitWhy): his rifle down, at once; his own sector not yet swept at MOVE_WAIT_MAX_MS)
  twoDown: "Your two's gun down.", twoSector: "Your two's still on his sector.",
  // (a locked pull door: no kick opens it (see the header); only an inner one can be, and is held)
  'refused-pull': 'Locked, and it opens toward you. Hold it.',
  // (v0.0.18, the kit's (see the header))
  misfire: 'Misfire. Prime it again.', wontGive: "It won't give. Again, or hold it.", noKit: 'Not issued.', handFull: 'Your hands are full.',
  // (v0.0.19, the live lane's: the clear gate's reasons on a live man (combat/men.js gateWhy), said where the "Clear!" hands back; the casualty the scene's)
  down: "He's down. Cover him.", hands: 'He gave up. Cover him.', unaccounted: 'Find him: he went behind the bend.', casualty: null,
  // (a walk of yours held PIN_END_MS by a body (places/move.js PIN_WORDS, said by the halt itself), as v0.0.19's fixer
  // built it; a doing still running on a leg the instructor's stall passed (shoothouse.js endLeg))
  blocked: null, stall: 'Move on.',
});
/** The clear gate's reasons that hand back in their own words (the live men's; every other reason says HANDBACK_WORDS.clear as built). */
export const GATE_WORDS = Object.freeze(new Set(['down', 'hands', 'unaccounted']));
/** The calls' words (v0.0.19: read from team.js TEAM_WORDS, the team's words in one table). */
export const SAY = Object.freeze(Object.fromEntries(['clear', 'ready', 'roomclear', 'hallclear', 'tell', 'bangout', 'breaching', 'placing'].map(id => [id, TEAM_WORDS[id].words])));

const D2R = Math.PI / 180;
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const r2 = (x) => q(x, 0.01);

// ---- who: the actor, the skills, the body ----

/** A person's actor (the player's, or an NPC's in actors.list), or null. */
export const actorOf = (state, pid) => (playerId(state) === pid ? playerActor(state) : state.actors?.list?.find(a => a.who === pid) ?? null);
/** The skills a bundle's times read: { wf, mrk, wh, awr, fit }. */
export function skillsOf(state, pid) {
  const v = (k) => valueOf(state, pid, k);
  return { wf: sheetOf(state, pid)?.os ?? 0, mrk: v('marksmanship'), wh: v('weapons'), awr: v('awareness'), fit: v('fitness') };
}
/**
 * The #2 hurries to the next stack (planBundle's `hurry`, his approach at Fast) when his walk there is this much longer than
 * yours (m; my call, R9): longer than that he would stand more than about the body gap off his slot when you stand on yours.
 * At 0.5 m he hurried on nearly every leg, and the keys' recruit's lane on 48213 fell to 11.2% under the routed v0.0.12
 * figure F21 holds him to (the hall's "Clear!", which waits on his sweep, 1.9 s sooner).
 */
export const HURRY_M = 1.0;
/** The legs and the speeds where a body stands (see the header): { pushMs2, brakeMs2, walk: { relaxed, combat, assault } }. */
export function legsOf(state, pid, x, z) {
  const a = actorOf(state, pid), gx = x ?? a?.x ?? 0, gz = z ?? a?.z ?? 0;
  const gG = gravityAt(state, null, gx, gz).gG, mu = surfaceAt(state, null, gx, gz)?.mu;
  const loadKg = (typeof KIT.kitMassKg === 'function' ? KIT.kitMassKg(state, pid) : null) ?? KIT_KG;
  const t = tractionOf({ gMs2: gG * G0_MS2, mu: Number.isFinite(mu) ? mu : 0.6, effFitness: skillsOf(state, pid).fit, massKg: BODY_KG, loadKg });
  const walk = Object.fromEntries(MOVE_STANCES.map(s => [s, gaitSpeeds({ gG, gait: s }).walkMs]));
  return { ...t, walk, gG };
}

// ---- the plan: the lane and its doors ----

/** The lane's plans, in order, or null where no lane is laid (room.js lanePlanOf). */
export const laneOf = (state) => { try { return lanePlanOf(state); } catch { return null; } };
/**
 * A move's polyline made walkable on the area's grid (route.js routed: every leg the nav's where its line is not clear,
 * the doors in `open` counted open: the bundle's own, whose door beat swings the leaf first). The user, 2026-11-11:
 * "Operators path through walls when automatic pathing" (every move here was straight lines between the plan's points
 * and the body, placed with no collision).
 */
export const wayOf = (state, pts, open = []) => routed(state, pts, { area: state.places?.live?.area ?? laneOf(state)?.area ?? null, open });
// (the doors a bundle's beats open: their plans' doors)
const doorsOf = (beats) => [...new Set(beats.map(b => b.door).filter(Boolean))];
/** A plan by door id ('hall' the last leg), or null. */
export const planOf = (state, door) => { if (!door) return null; try { return door === 'hall' ? laneOf(state)?.plans?.hall ?? null : roomPlanOf(state, door); } catch { return null; } };
// (the scene's room records, if the house rides the range session: shoothouse.js R.house.rooms)
const houseOf = (state) => opOf(state);   // (the operation's record, op.js: the house's on the lane)
const DONE_ROOM = new Set(['clear', 'passed']);
/**
 * The lane's door now (see the header): the scene's first room not clear, else (no scene) the plan nearest the actor
 * within 8 m: { door, plan, i, rec } or null.
 */
export function doorNow(state, pid = playerId(state)) {
  const lane = laneOf(state);
  if (!lane) return null;
  const H = houseOf(state);
  if (H?.rooms?.length || H?.hall) {
    const recs = [...(H.rooms ?? []), ...(H.hall ? [{ ...H.hall, door: 'hall' }] : [])];
    for (let i = 0; i < lane.order.length; i++) {
      const door = lane.order[i], rec = recs.find(r => (r.door ?? r.id) === door) ?? recs[i] ?? null;
      if (rec && DONE_ROOM.has(rec.state)) continue;
      return { door, plan: lane.plans[door] ?? planOf(state, door), i, rec };
    }
    return null;
  }
  const a = actorOf(state, pid);
  let best = null;
  for (let i = 0; i < lane.order.length; i++) {
    const door = lane.order[i], plan = lane.plans[door] ?? planOf(state, door);
    if (!plan || !a) continue;
    const d = dist([a.x, a.z], plan.stack?.[0] ?? plan.threshold);
    if (d <= 8 && (!best || d < best.d)) best = { door, plan, i, rec: null, d };
  }
  return best ? { door: best.door, plan: best.plan, i: best.i, rec: null } : null;
}

// ---- the beat times (see the header) ----

const stackOf = (plan, slot) => plan.stack?.[slot - 1] ?? plan.stack?.[0];
/**
 * A slot's point of domination as corner.js CORNER_POINT names it (the build sheet v0.0.20 §0 item 33: "the aid's ring is drawn where
 * the plan walks you, so the ring and the walk agree on either setting"): 'authored' the plan's point, 'derived' the rule's own
 * (pointOfRule; room 2's 1.90 m deeper), the entry path's last point moved onto it (entryPath). The aid's ring reads the same rule
 * (shoothouse.js cornerAidLook). [x, z].
 */
export function slotPointOf(plan, slot, mode = CORNER_POINT) {
  if (mode === 'derived') { const r = cornerRuleOf(plan, slot), pt = r ? pointOfRule(r, mode) : null; if (pt) return pt; }
  return plan.points?.[slot - 1] ?? plan.points?.[0];
}
const pointOf = (plan, slot) => slotPointOf(plan, slot);
const entryPath = (plan, slot, mode = CORNER_POINT) => {
  const p = plan.paths?.[slot] ?? plan.paths?.[1] ?? [stackOf(plan, slot), pointOf(plan, slot)];
  return mode === 'derived' && p.length ? [...p.slice(0, -1), slotPointOf(plan, slot, mode)] : p;
};
/** The path a slot's entry walks under a CORNER_POINT setting (see slotPointOf): the plan's, its last point the setting's. */
export const entryPathOf = (plan, slot, mode = CORNER_POINT) => entryPath(plan, slot, mode);
const bearing = (from, to) => Math.atan2(to[1] - from[1], to[0] - from[0]);
const hotXZ = (h) => [h.x, h.z];
/** The slot's corner in a plan: the hot spot its sector names (the one whose bearing from the point lies nearest the sector's yaw), else the plan's first. */
export function cornerOf(plan, slot) {
  const pt = pointOf(plan, slot), sec = plan.sectors?.find(s => s.slot === slot);
  const list = plan.hot?.length ? plan.hot : plan.corners ?? [];
  if (!list.length || !pt) return null;
  if (!sec) return list[0];
  return list.reduce((b, c) => (Math.abs(wrap(bearing(pt, hotXZ(c)) - sec.yawRad)) < Math.abs(wrap(bearing(pt, hotXZ(b)) - sec.yawRad)) ? c : b), list[0]);
}
/** The sector's sweep from the slot's corner (deg): to the farthest hot spot on the slot's side, as seen from its point. */
export function sweepDegOf(plan, slot) {
  const pt = pointOf(plan, slot), c = cornerOf(plan, slot);
  if (!pt || !c) return 0;
  const b0 = bearing(pt, hotXZ(c));
  let deg = 0;
  for (const h of plan.hot ?? []) deg = Math.max(deg, Math.abs(wrap(bearing(pt, hotXZ(h)) - b0)) / D2R);
  return Math.min(180, deg);
}
// (the bearing from the slot's point to the hot spot farthest round from its corner, or null)
function farHot(plan, slot) {
  const pt = pointOf(plan, slot), c = cornerOf(plan, slot);
  if (!pt || !c) return null;
  const b0 = bearing(pt, hotXZ(c));
  let best = null;
  for (const h of plan.hot ?? []) { const b = bearing(pt, hotXZ(h)); if (best === null || Math.abs(wrap(b - b0)) > Math.abs(wrap(best - b0))) best = b; }
  return best;
}
/** The eyes' turn of deg degrees for a person's Awareness (s). */
export const lookS = (awr, deg) => deg / (LOOK_TURN_BASE + LOOK_TURN_PER * awr) + LOOK_S * paceOf(awr);
/** A Watch of turn degrees for a person's Weapon handling (s): the muzzle onto the spot and held there. */
export const watchS = (wh, deg) => deg / (AIM.turn.base + AIM.turn.per * wh) + WATCH_S * paceOf(wh);
/** The muzzle onto the door from high ready (s): the sight's settle and a 20° turn, no feet (shot.js aimS's terms). */
export const muzzleS = (wh, deg = 20) => AIM.sight * paceOf(wh) + deg / (AIM.turn.base + AIM.turn.per * wh);
/** The door's breach (s): { ms, passMs } for 'push', 'pull' or 'kick' at a rung, the leaf's swing openS (a pull passable only fully open: see the header). */
export function doorS(wh, how = 'push', rung = 0, openS = DOOR_S) {
  const hand = how === 'kick' ? KICK_S : DOOR_HAND_S * paceOf(wh) + (how === 'pull' ? PULL_STEP_S * paceOf(wh) : 0);
  const share = rung >= 3 && how !== 'pull' ? PASS_SHARE : 1;
  return { ms: Math.round((hand + openS) * 1000), passMs: Math.round((hand + openS * share) * 1000), handMs: Math.round(hand * 1000) };
}
/**
 * How a door opens from the side the plan clears it from (the opening's swing: PLACES §1.6, `into` an index of its rooms):
 * 'push' where the leaf swings away from you (into the room entered), 'pull' where it swings toward you, or null (no leaf).
 * from: the room you stand in (an inner door's: the plan's room), else the opening's other room than the plan's (the hall).
 */
export function swingOf(state, plan, from = null) {
  return doorSwing(state, plan, from)?.how ?? null;
}
/**
 * The door's whole read from the side the plan clears it from (src/sim/places/swing.js swingFrom: { how, hinge, latch,
 * stackSide, kickable, kickWhy, behindSide, words, … }), or null with no leaf. The lane's door is the plan's own `swing`; an
 * inner door (plan.door another opening, from the plan's room) is read the same way from the room it is seen from.
 */
export function doorSwing(state, plan, from = null) {
  const o = plan?.door ? openingOf(plan.door) : null;
  if (!o || !turnsLeaf(o)) return null;
  if (!from && plan.swing && o.id === plan.id) return plan.swing;
  const here = from ?? o.rooms?.find(r => r !== plan.room) ?? null, area = openingArea(o.id);
  const rects = Object.fromEntries((area?.rooms ?? []).map(r => [r.id, r.rect]));
  return swingFrom(o, here, rects);
}
// (an opening with a hinged leaf to read: a door; a doorway has none)
const turnsLeaf = (o) => !!o && o.kind !== 'doorway' && Number.isFinite(o.at);
/** Whether a door may be kicked from the side the plan clears it from: a push door only (see the header). */
export const kickableOf = (state, plan, from = null) => doorSwing(state, plan, from)?.kickable !== false;
/**
 * How a bundle opens the plan's door (see the header): the variant asked where the door allows it (a kick on a push door only;
 * push or pull only the way it swings), else a kick on a locked push door, else its swing ('push' with no leaf to read).
 */
export function breachOf(state, plan, want = null, from = null, pid = playerId(state)) {
  const sw = swingOf(state, plan, from) ?? 'push', kick = kickableOf(state, plan, from);
  if (want === 'kick') return kick ? 'kick' : sw;
  if (want === 'push' || want === 'pull') return sw;
  // (v0.0.18: the kit's ways in where the door's swing and the kit allow them (see the header), else as built)
  if (KIT_HOWS.includes(want) && kitWayOk(state, pid, plan, want, from)) return want;
  return plan?.door && lockKnownOf(state, plan.door) && kick ? 'kick' : sw;
}
/** Whether a kit's way in ('pry', 'ram', 'charge') may open the plan's door now (v0.0.18): the door shut, its swing one the device works on, the kit carrying it. */
export function kitWayOk(state, pid, plan, how, from = null) {
  if (!plan?.door || openingState(state, plan.door) === 'open' || !pid) return false;
  const sw = swingOf(state, plan, from) ?? 'push';
  if (how === 'charge') return DEVICES.sc1.on.includes(sw) && kitHas(state, pid, 'charge', plan.door);
  // (v0.0.19: the BC-1 on either swing; the lock or the hinges shot on a door locked, on a breaching lane)
  if (how === 'cut') return DEVICES.bc1.on.includes(sw) && kitHas(state, pid, 'cut', plan.door);
  if (how === 'shoot') return lockedOf(state, plan.door) && kitHas(state, pid, 'ballistic');
  const model = how === 'ram' ? 'ram' : 'hal';
  return DEVICES[model].force.on.includes(sw) && kitHas(state, pid, how === 'ram' ? 'ram' : 'halligan');
}
/**
 * The charge on a plan's shut leaf that is the way in, or null: placed or primed (a believed
 * misfire is D3's: its wait, then any way), { how: 'charge' | 'cut' (a BC-1), mine: placed by pid (or by nobody named) and his way
 * by the kit (kitWayOk) }. The #2's own charge (his breacher task) is his: the rows of yours that would open the leaf are struck.
 */
export function chargeOnLeaf(state, pid, plan) {
  const c = plan?.door && openingState(state, plan.door) !== 'open' ? placedOn(state, plan.door) : null;
  if (!c || c.st === 'misfire') return null;
  const rec = state.items[c.id], how = rec?.model === 'bc1' ? 'cut' : 'charge';
  return { how, mine: (!rec?.byId || rec.byId === pid) && kitWayOk(state, pid, plan, how) };
}
/** Whether a door is locked now (its record's lock, not broken by a kick: the scene's or a kick's opening delta 'open'). */
export const lockedOf = (state, id) => { const o = openingOf(id); return !!o?.lock && openingState(state, o) !== 'open' && !brokenOf(state, id); };
/**
 * Whether a lane door's lock is still unknown to the stack: on a drawn house, whose lane doors are drawn locked or not,
 * a lane door nobody has read (the read takes the hinge, the swing and the lock: COMBAT §25.19.2.1) nor tried (an Open refused on
 * it: "Locked. Kick it."), shut and not broken (the play review of 2026-11-16: the panel struck Open "locked door" and T offered
 * "Kick, clear the room" at GO, 8 m from a door no hand had touched). The set's lane doors are never locked, and an inner door's
 * lock is the room's own (the closet), so both are known as built. The instructor's book (the pars, roomBookOf) knows the door.
 */
export function lockUnknownOf(state, id) {
  const H = opOf(state);
  if (H?.draw?.mode !== 'drawn' || H.$book || !id || H.read?.[id] !== undefined || H.tried?.[id] !== undefined) return false;
  if (openingState(state, id) === 'open' || brokenOf(state, id)) return false;
  return !!laneOf(state)?.order?.includes(id);
}
/** Whether the stack knows a door is locked now (lockedOf, and not lockUnknownOf): what the panel, T and the breach's choice read; the door itself answers by lockedOf. */
export const lockKnownOf = (state, id) => lockedOf(state, id) && !lockUnknownOf(state, id);
/** The hand on a door's handle (ms): DOOR_HAND_S × the WH pace (the refused Open's time, and the book's for a locked drawn door). */
export const handMsOf = (state, pid) => Math.round(DOOR_HAND_S * paceOf(skillsOf(state, pid).wh) * 1000);

/** A path taken up from a point: [the point, …the path's waypoints past the segment nearest it] (a body at the stack, mid-door or inside). */
export function pathFrom(path, pos) {
  let best = { d: Infinity, i: 0 };
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1], [bx, bz] = path[i], L2 = (bx - ax) ** 2 + (bz - az) ** 2;
    const t = L2 > 0 ? Math.max(0, Math.min(1, ((pos[0] - ax) * (bx - ax) + (pos[1] - az) * (bz - az)) / L2)) : 0;
    const d = Math.hypot(pos[0] - (ax + t * (bx - ax)), pos[1] - (az + t * (bz - az)));
    if (d < best.d - 1e-9) best = { d, i };
  }
  const rest = path.slice(best.i).filter(p => dist(p, pos) > 0.02);
  return [pos, ...(rest.length ? rest : [path.at(-1)])];
}

// ---- the plan of a bundle (see the header) ----

// (the stance of the entry: Assault from rung 3 unless the row says Combat; Combat below unless the row says Assault)
const entryStance = (rung, variant) => variant?.stance ?? (rung >= 3 ? 'assault' : 'combat');
/**
 * A bundle planned (see the header): { beats: [{ key, k, ch, ms, after, cut, … }] (a beat's name is its key, never an id: the save's id walk reads every id field as one), ms (the planned end from atMs), seams,
 * odds, rung, door, slot, side?, variant, label }. from [x, z] where the body starts (the actor's place), v0 its speed.
 * v0.0.19 (team.js): `slot` is the role (the beats' slots, the reorg, the ready, the stack he approaches), `side` the geometry
 * slot of the plan he works (the entry's path, point and corner, the scans), team.js sideOf's for the door by default, so
 * with no side swapped it is the slot and the plan is v0.0.18's; a beat and the return carry `side` only where it differs.
 */
export function planBundle(state, pid, bundleId, { door = null, slot = 1, side = null, variant = {}, rung = rungOf(state, pid, 'room'), atMs = state.clock.ms, from = null, v0 = 0, tempo = 'normal', hurry = false } = {}) {
  const B = bundleDef(bundleId) ?? taskDef(bundleId);
  if (!B || B.offeredNow === false) return null;
  const a = actorOf(state, pid), here = from ?? [a?.x ?? 0, a?.z ?? 0], sk = skillsOf(state, pid);
  const lane = laneOf(state), out = [];
  // (one door a row: the furthest one press reaches is one room (COMBAT §25.19.2; the lane's bundle withdrawn in R4))
  const dr = door ?? doorNow(state, pid)?.door ?? null, plan = planOf(state, dr);
  if (!plan) return null;
  const sd = side ?? sideOf(state, dr, slot), sideMore = sd !== slot ? { side: sd } : {};
  // (v0.0.19, the doer (team.js; DOER_DEFAULT): the doer's beats (`doer`: the door, the kit's) kept for the man who works the door,
  // the row's `by` (a task's 2), else your #2 working a task at this door (taskOf: your entry waits on his work, a cue), else
  // DOER_DEFAULT; with no task the doer is you, as v0.0.18's `slots: [1]`. A task bundle of his (TEAM_TASKS) is his by its by)
  const task = slot === 1 && B.group !== 'team' ? taskOf(state, dr) : null, tdef = taskDef(bundleId);
  const by = tdef ? 2 : variant.by ?? (task ? 2 : DOER_DEFAULT), onHim = slot === 1 && by !== 1 && !!task;
  let pos = here, vNow = v0, odds = 1;
  const k = tempo === 'rushed' ? RUSH_K : 1, open = [plan.door].filter(Boolean);
  const legs = legsOf(state, pid, pos[0], pos[1]);
  const how = breachOf(state, plan, variant.breach ?? kitHowOf(B), null, pid);
  // (a pull door shut: the approach ends at rest at the stack and the hand comes after the feet (see the header))
  const pullShut = how === 'pull' && !!plan.door && openingState(state, plan.door) !== 'open';
  // (v0.0.18, the kit (see the header): a room row's door beat rewritten for the way in and the bang its variant names, where the
  // kit feeds them (kitBeats); the kit's own rows list their beats)
  // (v0.0.19: a bang only through a door: the hall's leg has none, so a variant set at the last room never throws one at the stack's feet there)
  const kitHow = KIT_HOWS.includes(how) && !onHim ? how : null, bangV = plan.door && !onHim ? bangOf(state, pid, B.offeredNow === 'kit' && B.variants?.bang ? B.variants.bang : variant.bang ?? B.variants?.bang) : null;
  const own0 = beatsOf(B), ids0 = own0.some(x => KIT_BEATS.includes(x)) ? own0 : kitBeats(own0, { breach: kitHow, bang: bangV });
  // (your entry on his work (onHim): from where you stand on the give line, his door and his bang left to him, a cue beat on them)
  // (and from the stack's front point while he still has to reach it, out to the give line first: he never walks into you, and your
  // row is never a wait on a man waiting on you (the review of 2026-11-16: 15 s, both silent))
  const giveFirst = onHim && task.done?.front === undefined && dist(here, stackOf(plan, 1)) < BODY_GAP_M + GAP_GUARD_M;
  const ids = onHim ? ids0.flatMap(x => (ON_HIM_SKIP.includes(x) ? [] : x === 'enter' ? [...(giveFirst ? ['give'] : []), 'cue', 'enter'] : [x])) : ids0;
  // (the feet stop at the stack for a charge, a tool, a bang or a shot breach: the approach never flows into the entry past them)
  const kitStop = ids.some(x => x === 'place' || x === 'force' || x === 'bang' || x === 'shoot');
  // (v0.0.19: the grenade the bang throws, the count's want (the variant, else '2' from rung 3), the charge the door takes)
  const gModel = bangV ? bangModelOf(state, pid, bangV) : null, cookMs = bangV && bangV !== 'flash' && (variant.cook ?? cookDefault(rung)) === '2' && cookOk(gModel, 2000) ? 2000 : 0;
  const charge = kitHow === 'charge' || kitHow === 'cut' ? chargeFor(state, pid, plan, kitHow) : null;
  const stance = entryStance(rung, variant), flowIn = rung >= FLOW_IN_RUNG, roller = rollerOf(state, pid);
  // (a Top up on the way, where the row names it (the variant 'auto', COMBAT §25.19.2.1): the magazine believed at half or less of its load and a fuller one at hand)
  // (the #2 tops up by himself (COMBAT §25.19.5: a teammate's own decision; "nothing unasked" binds the player's rows))
  const reorg = (slot === 1 ? (variant.reorg ?? 'auto') === 'auto' : slot === 2 && isTwo(state, pid)) && ids.includes('reorg') ? reorgOf(state, pid) : null;
  for (const bid of ids) {
    const D = ENTER_AND_CLEAR.beats[bid];
    if (!D) continue;
    if (D.slots && !D.slots.includes(slot)) continue;
    if (D.doer && slot !== by) continue;
    if (D.rungs && !D.rungs.includes(Math.min(4, rung))) continue;
    if ((bid === 'door' || bid === 'read' || bid === 'tell') && !plan.door) continue;
    if (bid === 'read' && (opOf(state)?.read?.[plan.door] || openingState(state, plan.door) === 'open')) continue;
    if (bid === 'tell' && openingState(state, plan.door) === 'open') continue;
    if ((bid === 'far' || bid === 'farlook') && !plan.far) continue;
    if (bid === 'inner' && !(plan.inner ?? []).length) continue;
    // (the room's beats where they apply (the `out`, `status` and `moving` kinds): "Coming out!" from inside a room called
    // clear, his status with a #2 on the lane ("Hall clear!" too), "Moving!" on a plan with a far leg)
    if (bid === 'out' && !clearedRoomAt(state, here[0], here[1])) continue;
    if (bid === 'moving' && !plan.far) continue;
    if (bid === 'status' && !houseOf(state)?.two?.pid) continue;
    if (bid === 'reorg' && !reorg) continue;
    // (the explosive breach waits for a charge issued (COMBAT §25.19.11 question 3: struck here); v0.0.18: each of the kit's beats
    // for what the kit can feed it, the door's swing allowing it (a charge and the ram on a push door; the halligan on either))
    if (KIT_BEATS.includes(bid) && !kitFeeds(state, pid, plan, bid, how)) continue;
    if (bid === 'place' && placedOn(state, plan.door, pid)) continue;
    if (bid === 'cook' && !cookMs) continue;
    // (v0.0.19: D2's dependencies, only where the row runs the beat they name (drills/enter-and-clear.js AFTER_D2))
    const more = Object.entries(AFTER_D2).filter(([k, m]) => m[bid] && ids.includes(k) && (k !== 'cook' || cookMs)).map(([, m]) => m[bid]);
    const after0 = [...(D.after ?? []).map(x => (pullShut && bid === 'door' && x === 'approach@arrive' ? 'approach' : x)), ...more];
    // (a task bundle's hands wait on his walk to the front; your entry on his work waits on its cue)
    const after = tdef && D.ch === 'hands' && bid !== 'front' ? [...after0, 'front'] : onHim && bid === 'enter' ? [...after0, 'cue', ...(giveFirst ? ['give'] : [])] : after0;
    const beat = { key: bid, k: D.k, ch: D.ch, after, cut: !!D.cut, door: plan.door ?? null, plan: dr, slot, ...sideMore, st: 'wait', fromMs: null, untilMs: null, ...(Number.isFinite(D.flowFrom) ? { flowFrom: D.flowFrom } : {}) };
    if (bid === 'back') {
      // (v0.0.18: to the safe point on the latch side's wall, the charge's stand-off away (breach.js safePointsOf), at Combat, to rest)
      const sp = safePointsOf(state, plan, charge?.model ?? 'sc1', charge ? { edge: charge.side } : {}), to = sp?.one ?? pos, path = wayOf(state, [pos, to], []), legs2 = legsOf(state, pid, pos[0], pos[1]);
      const P = profileOf(pathLen(path), legs2.walk.combat, legs2.pushMs2, legs2.brakeMs2, { v0: vNow, v1: 0 });
      Object.assign(beat, { path, stance: 'combat', prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, Math.max(0, P.L - ARRIVE_M)) * 1000), to: 'safe' });
      vNow = 0; pos = to;
    } else if (D.k === 'move' && bid === 'far') {
      // (the far leg's walk from wherever the body stands, at Combat, braking to a stop where the leg is seen)
      const path = wayOf(state, pathFrom(plan.far.path, pos), open), legs2 = legsOf(state, pid, pos[0], pos[1]);
      const P = profileOf(pathLen(path), legs2.walk.combat, legs2.pushMs2, legs2.brakeMs2, { v0: vNow, v1: 0 });
      Object.assign(beat, { path, stance: 'combat', prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, Math.max(0, P.L - ARRIVE_M)) * 1000) });
      // (from rung 3 the eyes lead round the bend onto the far leg as the walk goes, a sector held as the entry's corner is
      // (the rework's R9, 2026-11-13: the walk held none, so the hostage card coming round the bend was taken in 'area', x1.5,
      // and aimed from high ready with the mount: the sergeant missed his advanced par on him on 75 of 100 seeds, F10); below
      // rung 3 the body faces that way (`look`), never a held sector)
      const h = plan.hot.find(x => x.id === plan.far.hot);
      if (h) { beat.look = [h.x, h.z]; if (rung >= 3) beat.eyes = [h.x, h.z]; else beat.muzzleTo = [h.x, h.z]; }
      vNow = 0; pos = path.at(-1);
    } else if (D.k === 'scan' && bid === 'farlook') {
      // (the eyes onto the far leg's middle, its time the look's from the walk's heading; its sweep from where the walk left the
      // head: the walk faces the far leg's spot as it goes (its `look`, its eyes from rung 3, its muzzle below), so the head stays
      // there (the rework's R9, 2026-11-13: the sweep started from the walk's heading, swinging the head and the muzzle back up
      // the near leg at the walk's end, 60 degrees off the hostage card taken in on the way, and the corporal's head shot on her
      // was aimed from there: F10); with no spot, from the heading)
      const h = plan.hot.find(x => x.id === plan.far.hot), fp = plan.far.path, end = fp.at(-1), from = fp.at(-2) ?? end;
      const hb = h ? bearing(end, hotXZ(h)) : bearing(from, end), b0 = h ? hb : bearing(from, end), deg = Math.abs(wrap(hb - bearing(from, end))) / D2R;
      Object.assign(beat, { to: 'far', deg: r2(deg), hot: h?.id ?? null, sweep: [q(b0, 1e-6), q(hb, 1e-6)], ms: Math.round(lookS(sk.awr, deg) * 1000 * k), ...(h ? { eyes: [h.x, h.z] } : {}) });
    } else if (D.k === 'move' && TEAM_MOVES[D.to]) {
      // (v0.0.19, the team's walks (team.js): you to the give line, the doer to the stack's front point and back to his own, the
      // closing up after a burst; at Combat (closeup: Fast), rest to rest)
      const pts = TEAM_MOVES[D.to](state, plan, B, variant), to = pts.at(-1), path = wayOf(state, [pos, ...pts], []), legs2 = legsOf(state, pid, pos[0], pos[1]);
      const P = profileOf(pathLen(path), legs2.walk[D.stance] ?? legs2.walk.combat, legs2.pushMs2, legs2.brakeMs2, { v0: vNow, v1: 0 });
      Object.assign(beat, { path, stance: D.stance, prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, Math.max(0, P.L - ARRIVE_M)) * 1000), to: D.to });
      vNow = 0; pos = to;
    } else if (D.k === 'move') {
      const to = bid === 'approach' || bid === 'restack' ? stackOf(plan, slot) : pointOf(plan, sd);
      // (the approach from wherever the body stands, routed (COMBAT §25.19.2.1): one room a row, so from the last room's point
      // straight to the next stack by the nav, no longer back out along that room's entry path, which the lane's bundle took)
      // (v0.0.19: back on the door from the give line after a task of his at this door (belayed, failed or done), along the give line
      // to beside your stack point and then onto it, never across his on the wall line (giveVia; the review of 2026-11-16: the
      // straight line from beside the safe point passed 0.54 m from his stack point and held you there by the body gap)
      const via = bid === 'approach' && slot === 1 ? giveVia(state, plan, dr, pos, to) : null;
      const path = wayOf(state, bid === 'approach' || bid === 'restack' ? [pos, ...(via ? [via] : []), to] : pathFrom(entryPath(plan, sd), pos), bid === 'restack' ? [] : open);
      // (the approach at Combat; the #2 closing on his slot from further back than you, at Fast (`hurry`, runSlot))
      const st = bid === 'approach' ? (hurry ? 'assault' : 'combat') : bid === 'restack' ? 'combat' : stance;
      const vMax = legs.walk[st];
      // (back on the stack after a charge flows into the entry from rung 3 when nothing waits between (no bang))
      const v1 = (bid === 'approach' && flowIn && ids.includes('enter') && !pullShut && !kitStop) || (bid === 'restack' && flowIn && ids.includes('enter') && !ids.includes('bang')) ? legs.walk.combat : 0;
      const P = profileOf(pathLen(path), vMax, legs.pushMs2, legs.brakeMs2, { v0: vNow, v1 });
      Object.assign(beat, { path, stance: st, prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, P.L - ARRIVE_M) * 1000) });
      // (from rung 3 the eyes go in first, onto the slot's corner: a sector held through the entry (COMBAT §25.5.3); below it
      // the body still faces into the room as it goes in (`look`: the facing the eye's cone is, never a held sector))
      if (bid === 'enter') { const c = cornerOf(plan, sd); if (c) { beat.look = [c.x, c.z]; if (rung >= 3) beat.eyes = [c.x, c.z]; } }
      // (below rung 3 the muzzle goes where the body faces, onto the slot's corner (`muzzleTo`, no held sector: that is rung 3's
      // eyes). The rework's R9, 2026-11-13, replacing v0.0.12's "straight into the room, the door's inward normal" (my call):
      // a trained man's muzzle follows his eyes, and the normal stood 29 degrees off room 1's off-corner man, so the corporal
      // took him 'area' and aimed from high ready with the mount on every seed, missing his advanced par (F10))
      if (bid === 'enter' && rung < 3 && beat.look) beat.muzzleTo = [...beat.look];
      vNow = v1; pos = to;
    } else if (D.k === 'posture') Object.assign(beat, { to: readyOf(D.to, slot), ms: Math.round(HIGH_READY_S * HIGH_READY_K * paceOf(sk.wh) * 1000 * k) });
    else if (D.k === 'inner') Object.assign(beat, { inner: [...plan.inner], ms: 0 });
    else if (D.k === 'aim:point') Object.assign(beat, { to: 'door', ms: Math.round(muzzleS(sk.wh) * 1000 * k) });
    else if (D.k === 'read') Object.assign(beat, { ms: Math.round(READ_S * paceOf(sk.awr) * 1000 * k) });
    // (the #2's on his hands as he walks, at every rung: a man of the team does his own while moving (my call))
    else if (D.k === 'reorg') Object.assign(beat, { macro: reorg.macro, ms: Math.round(reorg.ms * k), ...(slot === 2 ? { flowFrom: 0 } : {}) });
    else if (D.k === 'door') {
      const o = openingOf(plan.door), t = doorS(sk.wh, how, rung, o?.openS ?? DOOR_S);
      if (how === 'kick') odds *= kickOdds(state, pid, plan.door);
      Object.assign(beat, { how, ms: Math.round(t.ms * k), passMs: Math.round(t.passMs * k), handMs: Math.round(t.handMs * k) });
    } else if (D.k === 'scan') {
      const pt = pointOf(plan, sd), c = cornerOf(plan, sd), path = entryPath(plan, sd);
      const deg = bid === 'corner' ? (c && pt ? Math.abs(wrap(bearing(pt, hotXZ(c)) - bearing(path.at(-2) ?? pt, pt))) / D2R : 0) : sweepDegOf(plan, sd);
      // (the head's sweep: the corner's look from the path's heading onto the corner; the sector's from the corner across to the farthest hot spot)
      const cb = c && pt ? bearing(pt, hotXZ(c)) : 0, far = farHot(plan, sd), sweep = bid === 'corner' ? [q(bearing(path.at(-2) ?? pt, pt), 1e-6), q(cb, 1e-6)] : [q(cb, 1e-6), q(far !== null ? cb + wrap(far - cb) : cb, 1e-6)];
      Object.assign(beat, { to: D.to, deg: r2(deg), hot: bid === 'corner' ? c?.id ?? null : null, sweep, ms: Math.round(lookS(sk.awr, deg) * 1000 * k), ...(bid === 'corner' && c ? { eyes: [c.x, c.z] } : {}) });
    } else if (D.k === 'call') {
      Object.assign(beat, { say: D.say, ms: Math.round((rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000 * k) });
      // (#1 tells #2 how it opens and where he goes (MCWP §19b); the leader's "Room clear!", the hall's "Hall clear!")
      if (D.say === 'tell') beat.words = tellWords(state, plan, how);
      if (D.say === 'roomclear') beat.words = dr === 'hall' ? SAY.hallclear : SAY.roomclear;
    } else if (D.k === 'mark') Object.assign(beat, { ms: Math.round(MARK_S * paceOf(sk.wh) * 1000 * k) });
    // (the room's calls planned at a call's time ("Moving!" with his answer), the status's wait and the #2's armed mark at none)
    else if (D.k === 'out' || D.k === 'moving') Object.assign(beat, { ms: Math.round((rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000 * k) + (D.k === 'moving' && houseOf(state)?.two?.pid ? MOVE_ANSWER_MS : 0) });
    else if (D.k === 'status' || D.k === 'markArm') Object.assign(beat, { ms: 0 });
    else if (D.k === 'breach') Object.assign(beat, { ms: Math.round((BREACH_S + FIRE_S) * 1000) });
    // (v0.0.19: your order (its words team.js TEAM_WORDS'; its end writes his task), and your cue on his work)
    else if (D.k === 'order') Object.assign(beat, { task: B.task, how: B.task === 'breach' ? variant.breach ?? null : B.task === 'bang' ? 'flash' : null, call: ORDER_CALL[B.task], ms: Math.round((rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000 * k) });
    else if (D.k === 'cue') Object.assign(beat, { on: CUE_ON[task?.kind === 'bang' ? 'bang' : task?.how ?? 'pry'] ?? 'stepback', ms: 0 });
    // (v0.0.18, the kit's beats (see the header): their times by devices.js deviceMs at the person's skills and the device's face)
    else if (D.k === 'arm') {
      const model = gModel ?? 'g11', g = pouchedOf(state, pid, model), face = g?.face ?? 'left';
      Object.assign(beat, { model, face, ms: Math.round((Math.round(HANG_S * paceOf(sk.wh) * 1000) + deviceMs(roller, 'gren:reach', { face }) + deviceMs(roller, 'gren:pin')) * k) });
    } else if (D.k === 'throw') Object.assign(beat, { ms: Math.round(DEVICE_ACTIONS['gren:throw'].s * 1000) });
    else if (D.k === 'burst') Object.assign(beat, { ms: (fuseBelieved(gModel ?? 'g11') ?? 0) - cookMs });
    // (v0.0.19: the count, its want; the ballistic breach's first point at the person's pace)
    else if (D.k === 'cook') Object.assign(beat, { want: cookMs, ms: cookMs });
    else if (D.k === 'shootDoor') Object.assign(beat, { ms: shootMs(state, pid, swingOf(state, plan) ?? 'push') });
    else if (D.k === 'place') {
      const model = charge?.model ?? 'sc1', c = pouchedOf(state, pid, model), face = c?.face ?? 'right', s0 = model === 'sc1' ? null : DEVICES[model].placeS;
      Object.assign(beat, { face, ...(model !== 'sc1' ? { model, edge: charge.side } : {}), ms: Math.round((Math.round(HANG_S * paceOf(sk.wh) * 1000) + deviceMs(roller, 'charge:reach', { face }) + deviceMs(roller, 'charge:place', { s0 })) * k) });
    } else if (D.k === 'prime') Object.assign(beat, { ms: Math.round(deviceMs(roller, 'charge:prime') * k) });
    // (v0.0.19, his charge taken off the door (As you were): unprimed where primed (the prime's own time), then the reach's motion
    // twice, off the latch edge and into its pouch (my call, as tool:pickup is the reach twice))
    else if (D.k === 'recover') {
      const c = plan.door ? placedOn(state, plan.door, pid) : null;
      Object.assign(beat, { ms: Math.round(((c?.st === 'primed' ? deviceMs(roller, 'charge:prime') : 0) + 2 * deviceMs(roller, 'charge:reach', { face: 'front' })) * k) });
    } else if (D.k === 'force') {
      const model = how === 'ram' ? 'ram' : 'hal', t = pouchedOf(state, pid, model), f = forceMs(roller, model, t?.face ?? 'back'), o = openingOf(plan.door);
      const openMs = Math.round((o?.openS ?? DOOR_S) * 1000), share = rung >= 3 && swingOf(state, plan) !== 'pull' ? PASS_SHARE : 1;
      odds *= oddsOf(sk.fit, forceDc(state, plan.door, model));
      Object.assign(beat, { how: model === 'ram' ? 'ram' : 'pry', model, handMs: f.handMs, ms: Math.max(f.ms, f.handMs + openMs), passMs: f.handMs + Math.round(openMs * share) });
    }
    out.push(beat);
  }
  if (!out.length) return null;
  const d = { beats: out, rung, atMs, fromMs: atMs, lanes: {}, subs: [] };
  const sim = simulate(d);
  const label = onHim ? onHimLabel(B, task) : B.group === 'team' && B.task === 'breach' ? B.label.replace('{how}', variant.breach ?? 'pry') : labelOf(state, B, plan, how, { reorg: !!reorg, bang: ids.includes('bang') ? bangV ?? true : false });
  return { beats: out, ms: sim, seams: [], odds, rung, door: dr, slot, ...sideMore, reorg: !!reorg, variant: { breach: null, entry: lane?.plans?.[dr]?.entry ?? null, stance: entryStance(rung, variant), ...variant }, label };
}
// ---- v0.0.19, the team's planning (team.js; TEAM 2 to 4) ----

// (your way back onto the stack from the give line (planBundle's approach): with a task of his recorded at this door, you standing
// on the give line (within GIVE_ON_M of it, outward of the wall line) and the stack point further along it than GIVE_ON_M, the give
// line's point beside your stack point as a waypoint; else null, the straight way as v0.0.18's)
const GIVE_ON_M = 0.15;
function giveVia(state, plan, door, pos, to) {
  if (houseOf(state)?.two?.task?.door !== door || !plan?.door) return null;
  const g = giveOf(plan, to), F = frameOf(plan);
  if (!g || !F) return null;
  // (how far out of the wall line, along the door's outward normal: the give line is GIVE_M out)
  const out = (p) => -((p[0] - to[0]) * F.f[0] + (p[1] - to[1]) * F.f[1]);
  return Math.abs(out(pos) - out(g)) <= GIVE_ON_M && dist(pos, g) > GIVE_ON_M ? g : null;
}

// (the beats your entry leaves to your #2 working the door (onHim): the walk to the stack he stands on, the read and the tell he
// has done, the muzzle on the door below rung 2 and the door itself)
const ON_HIM_SKIP = Object.freeze(['approach', 'read', 'tell', 'muzzle', 'door', 'reorg']);
// (the team's walks' waypoints: out to the give line beside the stack's front point, and for a charge on along it to beside the
// doer's safe point (never across the man on the wall line: the two lines GIVE_M apart); the stack's front point (#1's); the
// doer's own (#2's))
const TEAM_MOVES = Object.freeze({
  give: (state, plan, B, v) => {
    const g0 = giveOf(plan, stackOf(plan, 1)) ?? stackOf(plan, 1), sp = B.task === 'breach' && v.breach === 'charge' ? safePointsOf(state, plan, 'sc1')?.one : null;
    return sp ? [g0, giveOf(plan, sp) ?? sp] : [g0];
  },
  front: (state, plan) => [stackOf(plan, 1)],
  stack2: (state, plan) => [stackOf(plan, 2)],
});
// (your orders' words by task (team.js TEAM_WORDS ids), and the beat of his your cue waits on, by his work)
const ORDER_CALL = Object.freeze({ bang: 'bangit', breach: 'breacherup', belay: 'belay' });
const CUE_ON = Object.freeze({ bang: 'bang', pry: 'stepback', ram: 'stepback', charge: 'breach' });
// (your entry on his work in words: "In on his bang: your corner", "In on his breach, clear the room")
function onHimLabel(B, task) {
  const w = task?.kind === 'bang' ? 'bang' : 'breach';
  return B.id === 'room:in' ? `In on his ${w}: your corner` : B.id === 'room:clear' ? `In on his ${w}, clear the room` : `${B.label.replace(/\{door\},?\s*/, '')} (on his ${w})`;
}

/**
 * A row's label in a marine's words for the door where it stands (COMBAT §25.19.2: "names its reach"): '{door}' is the
 * breach ("Open", "Kick"), gone where the door stands open ("In: your corner", "Clear the room") and in the hall ("Clear the
 * hall"); a row that names a Top up says so ("Stack up · top up on the way").
 */
export function labelOf(state, B, plan, how = null, { reorg = false, bang = false } = {}) {
  let label = B?.label ?? '';
  if (label.includes('{door}')) {
    const shut = !!plan?.door && openingState(state, plan.door) !== 'open';
    // (v0.0.18: the kit's ways in by name, and the bang after them: "Charge, flash, clear the room"; "Flash, in: your corner" at an open door)
    const way = shut ? (HOW_WORDS[how] ?? 'Open') : null, bw = BANG_LABEL[bang === true ? 'flash' : bang] ?? 'flash';
    if (way || bang) label = label.replace('{door}', [way, bang ? (way ? bw : cap(bw)) : null].filter(Boolean).join(', '));
    else label = cap(label.replace(/^\{door\},\s*/, '').replace('{door}', '')).replace('the room', plan && !plan.door ? 'the hall' : 'the room');
  }
  return reorg ? `${label} · top up on the way` : label;
}
// (the ways in by name on a room row (labelOf), the breach's variant row (bundleRows))
const HOW_WORDS = Object.freeze({ push: 'Open', pull: 'Open', kick: 'Kick', pry: 'Pry', ram: 'Ram', charge: 'Charge', cut: 'Cut', shoot: 'Shoot' });
// (v0.0.19: the bangs' words on a room row: "Frag, in: your corner", "Concuss, clear the room")
const BANG_LABEL = Object.freeze({ flash: 'flash', frag: 'frag', conc: 'concuss' });
// (#1's words to #2 at the door: how it opens and the side his corner is, as seen from the stack (MCWP §19b: One tells Two);
// the side the rule's (src/sim/combat/corner.js cornerRuleOf, the one place it is decided, 2026-11-15))
// (the hunt of v0.0.18: the swing read off the door (swingOf) for every way in but the kick: the kit's ways (pry, ram, a
// charge) replace 'pull' in `how`, and a pried pull door was told "Opens in" though it swings toward the stack)
function tellWords(state, plan, how) {
  const side = cornerRuleOf(plan, 1)?.side ?? 'left';
  const opens = how === 'kick' ? 'Kicking it' : (swingOf(state, plan) ?? how) === 'pull' ? 'Opens out' : 'Opens in';
  return `${opens}, I go ${side}.`;
}
// (a Top up on the way: { macro, ms } when the magazine is believed at half or less of its load and a fuller one is at hand that
// the reach would take (kit.js topUpGains, the one rule), else null)
function reorgOf(state, pid) {
  const gunId = state.stop?.who === pid ? state.stop.gun : state.people?.[pid]?.kit?.worn?.sling ?? null, gun = gunId ? state.items?.[gunId] : null;
  if (!gun) return null;
  const b = beliefOf(state, gunId);
  if (!b || b.stoppage || !halfOrLess(b, gun) || !fullerAtHand(state, pid, gunId, b) || !topUpGains(state, pid, gunId, b)) return null;
  return { macro: 'reload:tactical', gunId, ms: macroMs(rollerOf(state, pid), gun, 'reload:tactical', b) };
}
// (v0.0.18: the kit's ways in by their tokens, a kit row's own way (door:breach the charge, door:pry the halligan, door:ram the ram))
const KIT_HOWS = Object.freeze(['pry', 'ram', 'charge', 'cut', 'shoot']);
const kitHowOf = (B) => ((B?.offeredNow === 'kit' || B?.offeredNow === 'locked') && Array.isArray(B.variants?.breach) ? B.variants.breach[0] : null);
// (a kit row's way at a door: the first of its ways the swing and the kit allow there, else its first (the review of v0.0.19: "Breach
// (explosive)" was the SC-1 alone, so on the cut loadout a pull door had no row for the BC-1 below rung 2)
const kitHowAt = (state, pid, plan, B) => { const ws = kitHowOf(B) ? B.variants.breach : null; return ws ? (plan ? ws.find(w => kitWayOk(state, pid, plan, w)) : null) ?? ws[0] : null; };
// (whether the kit carries what a kit row needs: the breach the SC-1 or the BC-1)
const kitNeeds = (state, pid, B, door) => kitHas(state, pid, B.needs, door) || (B.id === 'door:breach' && kitHas(state, pid, 'cut', door));
// (v0.0.19: the bang a variant names where the kit carries it: 'flash', 'frag', 'conc' or null)
const BANG_NEED = Object.freeze({ flash: 'flashbang', frag: 'frag', conc: 'conc' });
export const bangOf = (state, pid, v) => (BANGS.includes(v) && kitHas(state, pid, BANG_NEED[v]) ? v : null);
/** The grenade model a bang throws for a person (v0.0.19): the first carried of its kind (a G-11 for 'flash', a G-9P or G-9 for 'frag', a G-13P or G-13 for 'conc'), or null. */
export function bangModelOf(state, pid, bang) {
  const ok = (m) => (bang === 'flash' ? !!DEVICES[m]?.flash : bang === 'frag' ? m === 'g9' || DEVICES[m]?.as === 'g9' : bang === 'conc' ? m === 'g13' || DEVICES[m]?.as === 'g13' : false);
  const d = devicesOf(state, pid).find(x => x.kind === 'grenade' && ok(x.model) && ['pouched', 'held', 'armed'].includes(x.st));
  return d?.model ?? (bang === 'flash' ? 'g11' : null);
}
// (whether the kit feeds one of its beats at the plan's door, the way in being `how`)
function kitFeeds(state, pid, plan, bid, how) {
  if (bid === 'place' || bid === 'back' || bid === 'prime' || bid === 'breach' || bid === 'restack') return (how === 'charge' || how === 'cut') && kitHas(state, pid, how, plan.door);
  if (bid === 'force') return (how === 'pry' || how === 'ram') && kitWayOk(state, pid, plan, how);
  if (bid === 'shoot') return how === 'shoot' && kitWayOk(state, pid, plan, how);
  if (bid === 'arm' || bid === 'throw' || bid === 'bang' || bid === 'cook') return BANGS.some(b => kitHas(state, pid, BANG_NEED[b]));
  return true;
}
/** A tool's force against a door (v0.0.18): the door's DC (its kickDc locked, else KICK_DC_OPEN) + the tool's dcK. */
export function forceDc(state, door, model = 'hal') {
  const o = openingOf(door);
  return (o?.lock && lockedOf(state, door) ? o.kickDc ?? 14 : KICK_DC_OPEN) + (DEVICES[model]?.force?.dcK ?? 0);
}
// (a plan's beats laid out by the flow with nothing halting: the planned time, ms)
function simulate(d) {
  const copy = { ...d, beats: d.beats.map(b => ({ ...b, st: 'wait' })), lanes: {}, subs: [], dry: true };
  advanceBeats(null, null, copy, Number.MAX_SAFE_INTEGER);
  return Math.max(0, (copy.untilMs ?? copy.atMs) - d.atMs);
}
/** The kick's odds: Fitness against the door's kickDc (KICK_DC_OPEN for one not locked). */
export function kickOdds(state, pid, door) {
  const o = openingOf(door), dc = o?.lock && lockedOf(state, door) ? o.kickDc ?? 14 : KICK_DC_OPEN;
  return oddsOf(skillsOf(state, pid).fit, dc);
}

// ---- the beat handlers (registered with the stepper) ----

// (in a dry run (planning) a handler only times its beat)
const dry = (d) => !!d?.dry;
registerKind('move', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms, arriveMs: b.arriveMs };
    const a = actorOf(state, d.who);
    // (from where the body is now, at the speed it has: the plan's path re-timed, never a jump; a moving body first brought
    // to its place at the beat's start by the brake (move.js coastTo: a body a tick behind stood still for that tick, the
    // rework's R2), the player's metres kept by its layer's record, the #2's by his from his tween start)
    if (a) {
      coastTo(state, d.who, a, atMs, { record: d.who === playerId(state) });
      const here = [a.x, a.z], v0 = Math.hypot(a.v?.[0] ?? 0, a.v?.[1] ?? 0), legs = legsOf(state, d.who, a.x, a.z);
      const path = wayOf(state, dist(here, b.path[0]) > 0.02 ? [here, ...b.path.slice(dist(here, b.path[1] ?? here) < dist(b.path[0], b.path[1] ?? here) ? 1 : 0)] : [here, ...b.path.slice(1)], doorsOf(d.beats));
      const P = profileOf(pathLen(path), legs.walk[b.stance] ?? legs.walk.combat, legs.pushMs2, legs.brakeMs2, { v0, v1: b.prof?.v1 ?? 0 });
      b.path = path.map(p => [q(p[0], 0.0001), q(p[1], 0.0001)]); b.prof = P;
      a.moveStance = b.stance;
      // (never ×RUSH_K: the body's place is the profile's, moveAt, so the beat's time is the profile's T (see the header))
      return { ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, P.L - ARRIVE_M) * 1000), ok: true, routine: true };
    }
    return { ms: b.ms, arriveMs: b.arriveMs, ok: true, routine: true };
  },
  end(state, bus, d, b, { cut, atMs }) {
    if (dry(d)) return;
    const a = actorOf(state, d.who);
    if (!a || !b.prof) return;
    // (a cut leaves the body where it stands, at the time its place is for (a.locoMs), never run on to the halt's instant nor
    // back to it: a halt in a tick the hold froze put the body a tick ahead while time stood still, then stood it still a tick
    // when time ran, and one in the rules layer put it back a tick's travel (the rework's R2); its speed at that time goes on
    // into the brake (move.js inertStep, coastTo))
    const keep = cut && Number.isFinite(a.locoMs) && a.locoMs >= (b.fromMs ?? atMs);
    const p = keep ? moveAt({ ...b, untilMs: Infinity }, a.locoMs) : moveAt(b, atMs);
    if (!keep) {
      const x0 = a.x, z0 = a.z;
      placeAt(state, d.who, a, p.x, p.z); a.locoMs = atMs;
      // (the player's record keeps these metres too, its layer counting only its own; the #2's counts from his tween start)
      if (d.who === playerId(state)) locoStep(a, x0, z0, { state, pid: d.who, gait: 'walk', stance: b.stance ?? a.moveStance ?? null, vMs: p.vMs > 0 ? p.vMs : null });
    }
    if (cut && p.vMs > 0) a.v = [q(p.vMs * Math.cos(p.headRad), 0.001), q(p.vMs * Math.sin(p.headRad), 0.001)];
    else if (!b.prof.v1) delete a.v;
    else a.v = [q(b.prof.v1 * Math.cos(p.headRad), 0.001), q(b.prof.v1 * Math.sin(p.headRad), 0.001)];
  },
});
registerKind('posture', {
  run(state, bus, d, b) { const to = b.to === 'lowReady' ? 'lowReady' : 'highReady'; if (!dry(d)) setPosture(state, d.who, to); return { ms: b.ms, ok: true, routine: true, text: to === 'lowReady' ? 'Low ready.' : 'High ready.' }; },
});
/** The posture a slot's `ready` takes (COMBAT §25.19.2.1, CALL 97-20: "weapons are pointed down with the exception of the 1-Man"): #1 high ready, the #2 and later low ready. */
export const readyOf = (to, slot) => (to === 'highReady' && slot > 1 ? 'lowReady' : to);
registerKind('aim:point', {
  run(state, bus, d, b) {
    if (!dry(d)) { const a = actorOf(state, d.who), o = openingOf(b.door); if (a && o) a.headRad = q(Math.atan2(doorMid(o)[1] - a.z, doorMid(o)[0] - a.x), 1e-6); }
    return { ms: b.ms, ok: true, routine: true, text: 'Muzzle on the door.' };
  },
});
registerKind('door', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms, passMs: b.passMs };
    const o = openingOf(b.door);
    if (!o) return { ms: 0, ok: true };
    if (openingState(state, o) === 'open' && leafAt(state, o.id, atMs) >= 1) return { ms: 0, passMs: 0, ok: true, routine: true, text: 'The door is open.' };
    // (the words by the door's kind and state: an inner door can be held, the lane's cannot; a kick that failed on a door not locked "held")
    const inner = doorNow(state, d.who)?.plan?.door !== o.id;
    // (a lane door's lock learnt by the hand that tried it (lockUnknownOf): the house's record's `tried`, the lane's doors only)
    if (b.how !== 'kick' && lockedOf(state, o.id) && lockUnknownOf(state, o.id)) (opOf(state).tried ??= {})[o.id] = atMs;
    if (b.how !== 'kick' && lockedOf(state, o.id)) return { ms: handMsOf(state, d.who), ok: false, halt: 'refused', again: true, text: b.how === 'pull' ? HANDBACK_WORDS['refused-pull'] : inner ? HANDBACK_WORDS.refused : HANDBACK_WORDS['refused-lane'] };
    // (the #2 not with you at the lane's own door (never an inner one): the hand waits on the door until he is within
    // TWO_SLOT_M of his slot (his running move's closed form, so his "Ready." releases it), at most TWO_WAIT_MS from the
    // first try; still away then, it hands back once the feet have stopped, the door still to open (COMBAT §25.8.2; the
    // fixer's of 0.0.12: decided once at the beat's start, it waited 3 s on a man who arrived in 1.6 and cut the approach))
    // (never on a #2 held at his safe point for a charge on this door (rec.safe): he is where you sent him)
    const two0 = d.who === playerId(state) && doorNow(state, d.who)?.plan?.door === o.id && !askedOf(state)[`two:${o.id}`] ? houseOf(state)?.two ?? null : null, two = two0?.safe?.door === o.id ? null : two0;
    const off = two ? twoOffSlot(state, two, atMs) : null;
    if (off !== null && off > TWO_SLOT_M) {
      const from = (b.twoFromMs ??= atMs), by = from + TWO_WAIT_MS;
      if (atMs < by) {
        const arr = twoArriveMs(state, two, atMs), until = Math.min(by, arr ?? atMs + TWO_POLL_MS);
        const ms = Math.max(TICK_MS, until - atMs);
        return { ms, passMs: ms, ok: true, routine: true, again: true, text: 'The squeeze.' };
      }
      const feet = d.beats.find(x => x.st === 'run' && x.ch === 'feet');
      if (feet) { const ms = Math.max(TICK_MS, feet.untilMs - atMs); return { ms, passMs: ms, ok: true, routine: true, again: true, text: 'The squeeze.' }; }
      askedOf(state)[`two:${o.id}`] = atMs;
      return { ms: 0, passMs: 0, ok: false, halt: 'two', again: true, text: HANDBACK_WORDS.two };
    }
    let ms = b.ms, passMs = b.passMs, ok = true, grade = null, routine = true;
    if (b.how === 'kick') {
      const dc = o.lock && lockedOf(state, o.id) ? o.kickDc ?? 14 : KICK_DC_OPEN;
      const r = check(stream(state.meta.seed, 'house:kick', d.who, o.id, atMs), { skill: 'fitness', value: skillsOf(state, d.who).fit, dc, pressure: 'evaluated', tempo: d.tempo ?? 'normal', by: d.who, verb: null });
      ok = r.ok; grade = r.grade; routine = false;
      if (!ok) return { ms: Math.round(KICK_S * FAIL_K * 1000), ok: false, grade, halt: 'refused', again: true, text: !lockedOf(state, o.id) ? HANDBACK_WORDS['refused-held'] : inner ? HANDBACK_WORDS['refused-kick'] : HANDBACK_WORDS['refused-kick-lane'] };
      breakOpening(state, o.id, atMs);
    }
    // (the leaf finishes its swing at the hand's end plus openS: leafAt draws it from closed through the hand, then open)
    // (the build sheet v0.0.20 item 15: the verb kept on the delta, the leaf drawn as it was opened (doors.js leafShownAt); the
    // fact names when the leaf starts and first stands at its stop, the kick's boom and the knock's times (the audio's))
    const openMs = Math.round((o.openS ?? DOOR_S) * 1000), leafAtMs = atMs + Math.round(b.handMs ?? 0);
    setOpening(state, o.id, 'open', { atMs: leafAtMs + openMs, how: LEAF_HOWS.includes(b.how) ? b.how : null });
    innerSeen(state, d.who, o, atMs);
    ((state.$places ??= {}).moving ??= new Set()).add(o.id);
    const [x, z] = doorMid(o);
    bus?.emit('door', { id: o.id, area: openingArea(o.id)?.id ?? null, x, z, state: 'open', kind: o.kind, who: d.who, how: b.how, leafAtMs, stopAtMs: stopAtOf(b.how, leafAtMs, openMs) });
    return { ms, passMs, ok, grade, routine, text: b.how === 'kick' ? 'Kicked in.' : b.how === 'pull' ? 'Pulled open.' : 'Pushed open.' };
  },
});
registerKind('scan', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms };
    d.eyes = { hot: b.hot ?? null, fromMs: atMs, deg: b.deg };
    return { ms: b.ms, ok: true, routine: true };
  },
  end(state, bus, d, b) { if (!dry(d)) d.eyes = null; },
});
registerKind('inner', {
  // (a door inside the room the plan does not take: asked once, from the point, the sector swept, "Hold it or clear it?"
  // (COMBAT §25.19.2.1, §25.19.4; v0.0.12 asked it at the sector's start, which from rung 3 is the doorway: the user's
  // "drop you in the doors"); held by the #2 or opened, nothing to ask; the #2's slot never asks)
  run(state, bus, d, b, atMs) {
    if (dry(d) || d.who !== playerId(state)) return { ms: 0, ok: true, routine: true };
    const plan = planOf(state, b.plan), H = houseOf(state);
    for (const id of b.inner ?? plan?.inner ?? []) {
      if (openingState(state, id) === 'open' || H?.two?.hold === id || askedOf(state)[`inner:${id}`]) continue;
      askedOf(state)[`inner:${id}`] = atMs;
      return { ms: 0, ok: false, halt: 'door-unplanned', again: true, text: HANDBACK_WORDS['door-unplanned'].replace('{wall}', wallOf(state, plan, id)) };
    }
    return { ms: 0, ok: true, routine: true };
  },
});
registerKind('call', {
  run(state, bus, d, b, atMs) {
    // (your "Clear!" waits on your #2's side of the room: while he is on a man (his take-in, his row), or his entry and
    // sweep of this room run, at most CLEAR_WAIT_MS; then a threat of the room still up and facing hands back, the call
    // still to come (the fixer's of 0.0.12: from rung 3 T called room 1 clear at 5.35 s with the #2's man up and unfired on))
    if (!dry(d) && b.say === 'clear' && d.who === playerId(state) && b.plan) {
      const two = houseOf(state)?.two ?? null, a2 = two?.pid ? actorOf(state, two.pid) : null, plan = planOf(state, b.plan);
      const from = (b.clearFromMs ??= atMs);
      const onMan = !!(two?.contact || two?.eng);
      const sweeping = !!a2 && !two.swept?.[b.plan] && (two.doing?.door === b.plan || (plan && pastThreshold(plan, a2.x, a2.z)));
      // (the wait on his sweep ends with his group's planned end, never later than CLEAR_WAIT_MS, a tick at least: a half-second
      // poll called the room up to 0.25 s after his "Clear!" (the fixer's second pass of 0.0.12))
      if (!onMan && sweeping && atMs - from < CLEAR_WAIT_MS) {
        const end = Math.min(from + CLEAR_WAIT_MS, Number.isFinite(two.doing?.untilPlanMs) && two.doing.untilPlanMs > atMs ? two.doing.untilPlanMs : atMs + TICK_MS);
        return { ms: Math.max(TICK_MS, end - atMs), ok: true, routine: true, again: true, text: null };
      }
      // (on his man at most CLEAR_HOLD_MS, as the gate's wait: then handed back, "Your two's on a man.", the call still to come
      // (the code review of 2026-11-13: this wait alone had no cap, and a #2 kept on a man, his own drill failing again, held
      // your bundle polling for ever with no stop and no lead))
      if (onMan) {
        const m0 = (b.manFromMs ??= atMs);
        if (atMs - m0 < CLEAR_HOLD_MS) return { ms: TWO_POLL_MS / 2, ok: true, routine: true, again: true, text: null };
        delete b.manFromMs; delete b.clearFromMs;
        return { ms: 0, ok: false, halt: 'clear', again: true, text: HANDBACK_WORDS.twoMan };
      }
      delete b.manFromMs;
      // (the scene's ready-to-clear predicate first (see the header): the drill never calls a void "Clear!"; while a window is
      // open, a man turns or a trigger's gap runs it waits, a tick at a time, up to CLEAR_HOLD_MS, then hands back with the call
      // still to come (a window's own pause suspends it first: the man up below is asked only once he is taken in))
      const gate = clearGate.fn ? clearGate.fn(state, b.plan, atMs) : null;
      const all = plan ? upIn(state, plan.room, atMs) : [], two2 = !!houseOf(state)?.twoPid, up = all.filter(T => !two2 || (ownerOf(state, T) ?? 1) === 1);
      // (asked once a room, as the other hand-backs: a man you chose to hold (the hostage's) is your call, and "Carry on" calls it;
      // from rung 2 the flow is suspended, not halted, so the shot on him takes it up again (COMBAT §25.19.3.3); a man of your
      // #2's corner is his: the call waits on him as on the gate, then asks (2026-11-12, R3))
      const his = !up.length && all.length && !askedOf(state)[`clear:${b.plan}`];
      if (!gate && up.length && !askedOf(state)[`clear:${b.plan}`]) {
        askedOf(state)[`clear:${b.plan}`] = atMs; delete b.clearFromMs; delete b.gateFromMs;
        return (d.rung ?? 0) >= 2 ? { ms: 0, ok: true, routine: true, again: true, suspend: 'up', text: null } : { ms: 0, ok: false, halt: 'contact', again: true, text: null };
      }
      const wait = gate ?? (his ? 'his' : null);
      if (wait) {
        const g0 = (b.gateFromMs ??= atMs);
        if (atMs - g0 < CLEAR_HOLD_MS) return { ms: TICK_MS, ok: true, routine: true, again: true, text: null };
        delete b.gateFromMs;
        if (wait === 'his') { askedOf(state)[`clear:${b.plan}`] = atMs; return { ms: 0, ok: false, halt: 'contact', again: true, text: null }; }
        return { ms: 0, ok: false, halt: 'clear', again: true, text: (GATE_WORDS.has(wait) ? HANDBACK_WORDS[wait] : null) ?? HANDBACK_WORDS.clear };
      }
      delete b.gateFromMs;
    }
    // (your "Room clear!" waits while your #2's Dominate of this room runs with its "Clear!" still to come, at most CLEAR_WAIT_MS:
    // the sector calls first, then the room's (the play review found your "Room clear!" before his "Clear!" in 22
    // of 709 rooms, where his entry was halted on contact and his Dominate began after your own "Clear!", and the scene's echo of
    // his call said in the same tick as yours, his own beat 0.55 s after it: two calls of his in one room)
    if (!dry(d) && b.say === 'roomclear' && d.who === playerId(state) && b.plan) {
      const two = houseOf(state)?.two ?? null, from = (b.roomFromMs ??= atMs);
      const owed = !!two?.doing && two.doing.door === b.plan && !two.swept?.[b.plan] && (two.doing.beats ?? []).some(x => x.key === 'clear' && x.st !== 'done');
      // (the call's own length kept through the wait, which the stepper writes over with each tick's)
      if (owed && atMs - from < CLEAR_WAIT_MS) { b.roomMs ??= b.ms; return { ms: TICK_MS, ok: true, routine: true, again: true, text: null }; }
      if (b.roomMs !== undefined) { b.ms = b.roomMs; delete b.roomMs; }
      delete b.roomFromMs;
    }
    // (the hunt of v0.0.20's T2: a casualty on the lane, yours or his, and no call is said: the stack is out of the fight (men.js casualtyOn))
    if (!dry(d) && houseOf(state)?.live?.casualty) return { ms: 0, ok: true, routine: true, text: null };
    // (one "Clear!" of your #2's a room (FL22-4, held by its fixer): never a second once the scene echoed yours for him or he
    // called it since you went in (R.house.two.clearMs), as when a Dominate re-planned after "Covering!" and "Up." swept again (the play
    // review: "Clear!", "Covering!", "Up.", "Clear!" in the recruit's room 2 on seed 7))
    if (!dry(d) && b.say === 'clear' && b.plan && isTwo(state, d.who) && twoClearSaid(state, b.plan)) return { ms: 0, ok: true, routine: true, text: null };
    // (and T1: your #2's "Clear!" waits while a man of the room the team has seen is up and not given up (twoClearWait); the leg
    // over (cleared or passed), it is never said)
    if (!dry(d) && b.say === 'clear' && b.plan && isTwo(state, d.who)) {
      const w = twoClearWait(state, b.plan, atMs);
      if (w === 'over') return { ms: 0, ok: true, routine: true, text: null };
      if (w) return { ms: TICK_MS, ok: true, routine: true, again: true, text: null };
    }
    const words = b.words ?? SAY[b.say] ?? b.say;
    if (!dry(d)) bus?.emit('say', { who: d.who, text: words, kind: 'speech', durMs: b.ms, call: b.say, room: b.plan ?? null });
    // (the #2's own "Clear!" noted on the house's record: the scene echoes yours for him only where he has called none in the leg
    // (shoothouse.js twoCalledIn), and he never calls a second (twoClearSaid))
    if (!dry(d) && b.say === 'clear' && houseOf(state)?.two?.pid === d.who) houseOf(state).two.clearMs = atMs;
    return { ms: b.ms, ok: true, routine: true, text: words };
  },
});
/**
 * Why your #2's "Clear!" for a door's room waits (the hunt of v0.0.20's T1; COMBAT §25.21): 'over' when the room's leg is cleared or
 * passed (the call is never said), the key of a live man of the room the team has seen (R.house.live.seenBy) who is up and has not
 * given up ('hands'), down or been ruled out, else null. On the live lane only (R.house.live): every turner lane is as it was.
 */
export function twoClearWait(state, door, ms = state.clock.ms) {
  const H = houseOf(state), plan = H?.live ? planOf(state, door) : null;
  if (!plan) return null;
  const L = (H.rooms ?? []).find(x => x.door === door);
  if (L && (L.state === 'clear' || L.state === 'passed')) return 'over';
  // (the turners through op.js's session, the range's or the operation's (OP_HOME; the v0.0.22 integration of v0.0.20's hunt on v0.0.21))
  const T = (sessionOf(state)?.turners ?? []).find(x => x.live && x.room === plan.room && x.stoppedAtMs === null && !['hands', 'down', 'out'].includes(x.live.st) && H.live.seenBy?.[x.key] !== undefined);
  return T ? T.key : null;
}
// (the scene's ready-to-clear predicate: (state, door, ms) → a reason to wait, or null; shoothouse.js registers it)
// (held on a function, which a module's instantiation sets up before its body runs: the scene registers it at its own load,
// which can come first in an import cycle (the rework's R4: bundle.js reads the gun's belief and the macros now))
function clearGate() { return clearGate.fn ?? null; }
/** The scene's ready-to-clear predicate for "Clear!" (see the header): fn(state, door, ms) → a reason or null. */
export function useClearGate(fn) { clearGate.fn = typeof fn === 'function' ? fn : null; }
// (the scene's verdict on a "Clear!" just said: (state, door, ms) → true where it was void; shoothouse.js registers it)
function callVoid() { return callVoid.fn ?? null; }
/** The scene's verdict on your "Clear!" (see the call's run): true where the call said at ms on the door's leg was void. */
export function useCallVoid(fn) { callVoid.fn = typeof fn === 'function' ? fn : null; }
// (the threats of a room standing and facing now: the turners of the range session)
// (the men of a room up and facing that you know of: taken in at the last pause or before and not forgotten (contact.js's
// known), never one nobody has seen (the reach review of 2026-11-13: the call waited on, and relooked, men behind you))
function upIn(state, room, ms) {
  const c = state.mind?.contact, known = c?.known ?? {}, last = c?.last?.ids ?? [];
  // (up and facing through combat/men.js upNow, a stand's as before, a live man's by his record)
  return (sessionOf(state)?.turners ?? []).filter(T => T.room === room && ['threat', 'armoured', 'hostage'].includes(T.face) && upNow(T, ms)
    && (known[T.key] !== undefined || last.includes(T.key)));
}
// (the build sheet v0.0.20 item 12: the last man marks. Your #2's Dominate ends on it, which arms his mark (R.house.two.markOwed,
// by door) and takes no time where he stands: he makes it on the latch-side jamb as he passes the door's plane outward
// (combat/two.js twoTick). Yours (the single, where he cannot: markYoursOf) is made where you stand, on the room's leg (L.marked))
registerKind('markArm', {
  run(state, bus, d, b, atMs) {
    if (!dry(d) && isTwo(state, d.who) && b.plan && b.plan !== 'hall') (houseOf(state).two.markOwed ??= {})[b.plan] = atMs;
    return { ms: 0, ok: true, routine: true, text: null };
  },
});
registerKind('mark', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms ?? 0 };
    const H = houseOf(state), mine = markYoursOf(state, d.who), L = mine ?? (H?.rooms ?? []).find(x => x.door === (b.plan ?? doorNow(state, d.who)?.door));
    if (L && !L.marked) { L.marked = { by: d.who, atMs }; bus?.emit('house', { phase: 'marked', room: L.room, who: d.who, atMs }); }
    return { ms: b.ms, ok: true, routine: true, text: 'Room marked.' };
  },
});
// (the door read: the hinge, the swing, the lock (COMBAT §25.19.2.1), noted on the house's record as the single's is)
registerKind('read', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms, ok: true, routine: true, text: 'The door read.' };
    const words = b.door ? readWords(state, b.plan ?? d.door, b.door) : null;
    if (b.door && d.who === playerId(state) && state.armoury?.range) (opRec(state).read ??= {})[b.door] = atMs;
    // (what the eyes found, said as the read ends (2026-11-15: "the read of the door says which"): "Pull door, hinge right.")
    if (words && d.who === playerId(state)) b.said = words;
    return { ms: b.ms, ok: true, routine: true, text: words ?? 'The door read.' };
  },
  end(state, bus, d, b, { cut }) { if (!dry(d) && b.said && !cut) bus?.emit('line', { text: b.said, kind: 'note', door: b.door }); },
});
// (a door's read in a marine's words from the side the plan clears it from, or null: the plan's own door, or an inner door from its room)
function readWords(state, planKey, door) {
  const plan = planOf(state, planKey);
  if (!plan) return null;
  const w = (door === plan.door ? doorSwing(state, plan) : doorSwing(state, { ...plan, door }, plan.room))?.words ?? null;
  // (the read takes the lock too, on a drawn house's lane door (lockUnknownOf: the set's are never locked): "Push door,
  // hinge right. Locked.")
  return w && door === plan.door && opOf(state)?.draw?.mode === 'drawn' && lockedOf(state, door) ? `${w} Locked.` : w;
}
// (a Top up on the way (the row's reorg, COMBAT §25.19.2.1): the tactical reload's sub-steps on the hands, rolled as the
// command's (drills.js runMacro), its time theirs; still owed at the beat's start, else nothing to do)
registerKind('reorg', {
  run(state, bus, d, b) {
    if (dry(d)) return { ms: b.ms };
    const r0 = reorgOf(state, d.who);
    if (!r0) return { ms: 0, ok: true, routine: true, text: null };
    // (the #2's: "Reloading!" as he starts (FM table 3-2), his rolls on his own stream and in nobody's log, "Up." at its end)
    const two = isTwo(state, d.who);
    if (two) bus?.emit('say', { who: d.who, text: TWO_SAY.reloading, kind: 'speech', durMs: Math.round(CALL_FLOW_S * 1000), call: 'reloading' });
    const r = runMacro(state, bus, { macro: r0.macro, pid: d.who, gunId: r0.gunId, tempo: d.tempo === 'rushed' ? 'rushed' : 'normal', pressure: 'evaluated', ...(two ? { log: false, rng: 'house-two' } : {}) });
    const routine = r.subs.every(x => x.routine !== false || x.ok);
    if (two) b.said = 'up';
    return { ms: r.ms, ok: !r.halted, routine, text: r.halted ? 'The top up fumbled.' : 'Topped up.' };
  },
  end(state, bus, d, b, { cut }) { if (!dry(d) && b.said === 'up' && !cut) bus?.emit('say', { who: d.who, text: TWO_SAY.up, kind: 'speech', durMs: Math.round(CALL_FLOW_S * 1000), call: 'up' }); },
});
/** The #2's own calls (FM 3-06.11 table 3-2; COMBAT §25.19.5): "Reloading!" at his top up or a dry rifle's reload, "Up." at its end and after your rifle is back, "Covering!" as he takes your sector, "Gun down!" at his own stoppage and "Gun up!" once it is cleared (shoothouse.js twoGunDown). */
export const TWO_SAY = Object.freeze(Object.fromEntries(['reloading', 'up', 'covering', 'gunDown', 'gunUp', 'coming'].map(id => [id, TEAM_WORDS[id].words])));
/** Held at his stack on his cue by you standing on his way in this long, your #2 calls "Coming in!" (ms; the fixer's of 0.0.16, the play review's: he waited 11.9 s without a word while the fuzz stood across his way). */
export const TWO_BLOCK_SAY_MS = 1000;
// (his cue given and his way in not clear (crossingClear): the hold timed on his record, and once TWO_BLOCK_SAY_MS long his
// "Coming in!", so you know why he is not with you and step off his lane; v0.0.20 (user.md U-5): again every TWO_BLOCK_REPEAT_MS
// while it lasts (B.saidMs, his last; a save of v0.0.19's has `said` alone, its first call's time then fromMs + TWO_BLOCK_SAY_MS);
// the hold forgotten once he goes (blockEnd))
function blockedCall(state, bus, rec, ms, cued) {
  if (!cued) { blockEnd(state, rec, ms); return; }
  const B = (rec.block ??= { fromMs: ms, said: false });
  const last = B.said ? B.saidMs ?? B.fromMs + TWO_BLOCK_SAY_MS : null;
  if (last === null ? ms - B.fromMs < TWO_BLOCK_SAY_MS : ms - last < TWO_BLOCK_REPEAT_MS) return;
  B.said = true; B.saidMs = ms;
  bus?.emit('say', { who: rec.pid, text: TWO_SAY.coming, kind: 'speech', durMs: Math.round(CALL_FLOW_S * 1000), call: 'coming' });
}
// (user.md U-5: his hold on his cue over, its time on the leg's record (L.twoHeldMs, the run sheet's "HELD OUT"; written only
// where he was held, so a lane where nobody stands on his way keeps its save))
function blockEnd(state, rec, ms) {
  const B = rec.block;
  if (!B) return;
  delete rec.block;
  const L = legNow(state);
  if (L && ms > B.fromMs) L.twoHeldMs = (L.twoHeldMs ?? 0) + (ms - B.fromMs);
}
// (the house's current leg's record, or null)
const legNow = (state) => { const H = houseOf(state); return H && Array.isArray(H.rooms) ? [...H.rooms, H.hall][H.cur ?? 0] ?? null : null; };
// (whether a person is the shoot house's number two)
const isTwo = (state, pid) => !!pid && (houseOf(state)?.two?.pid ?? null) === pid;
// (whether your #2 has said his "Clear!" of door's room: the scene's echo of yours for him on its leg, or his own call since you
// entered it (his call of an earlier room comes before you enter the next; shoothouse.js twoCalledIn's rule))
function twoClearSaid(state, door) {
  const H = houseOf(state), L = (H?.rooms ?? []).find(x => x.door === door);
  if (!L) return false;
  if ((L.calls ?? []).some(c => c.by === 'two' && c.how === 'echo')) return true;
  return Number.isFinite(H.two?.clearMs) && Number.isFinite(L.enteredAtMs) && H.two.clearMs >= L.enteredAtMs;
}
// (the explosive breach: never planned without a charge issued. v0.0.18: "Breaching!", the count and the fire of the charge placed
// on the door (primed here if a misfire left it to prime again); the FD-1's misfire hands back at the count's end, the charge on
// the door to prime again (Carry on) or the halligan; else the charge's fuse is the count's end, where it bursts (burst.js))
registerKind('breach', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms, ok: true, routine: true, text: 'Breaching!' };
    const c = b.door ? placedOn(state, b.door, d.who) : null;
    bus?.emit('say', { who: d.who, text: SAY.breaching, kind: 'speech', durMs: 600, call: 'breaching' });
    if (!c) return { ms: b.ms, ok: true, routine: true, text: SAY.breaching };
    let ms = b.ms;
    if (c.st === 'placed') { setSt(state, c.id, 'primed'); ms += deviceMs(rollerOf(state, d.who), 'charge:prime'); }
    // (v0.0.19, D2: a believed misfire primed again from the safe point, its striker re-cocked (devplan.js D3's 'charge:recock'))
    else if (c.st === 'misfire') { setSt(state, c.id, 'primed'); ms += deviceMs(rollerOf(state, d.who), 'charge:recock'); }
    const rec = state.items[c.id];
    if (chance(stream(state.meta.seed, 'arms:misfire', c.id, atMs), DEVICES.fd1.misfireP)) {
      // (v0.0.19: the charge a believed misfire, felt at the count's end (misAtMs): the planner's D3 primes it again from the safe
      // point, and the door is not walked up to before MISFIRE_WAIT_MS (the force rows struck "wait N s", kitRow); v0.0.18 put it
      // back to 'placed', so D3 and its wait were never reached in a lane (the review of v0.0.19's K))
      setSt(state, c.id, 'misfire'); rec.misAtMs = atMs + ms;
      // (handed back as a failed roll is (the stepper's 'fail'): Carry on primes it again and fires (the DI's "Carry on."), the
      // halligan the other way once the wait is out; never 'refused', whose answer is a kick from the door, out of reach at the safe point)
      return { ms, ok: false, halt: 'fail', again: true, text: HANDBACK_WORDS.misfire };
    }
    delete rec.misAtMs;
    rec.fuseAtMs = atMs + ms; rec.byId = d.who;
    return { ms, ok: true, routine: true, text: SAY.breaching };
  },
  end(state, bus, d, b) { if (!dry(d)) tickDevices(state, bus, b.untilMs); },
});
// (v0.0.18, the kit's beats (see the header))
// (a device out of the hands (deviceRows): an armed grenade's pin back in and the grenade back in its pouch, a held one pouched, a
// tool let go at your feet; a tool lying within reach picked up and hung on the back again (how 'pickup'); the rifle back up at
// the end)
registerKind('stowdev', {
  run(state, bus, d, b) {
    if (dry(d)) return { ms: b.ms };
    if (b.how === 'pickup') {
      const home = b.dev && state.items[b.dev] ? toolHomeOf(state, d.who, b.dev) : null;
      if (!home) return { ms: 0, ok: true, routine: true, text: null };
      setPosture(state, d.who, 'slungFront');
      KIT.move(state, b.dev, { container: home });
      setSt(state, b.dev, 'stowed');
      return { ms: b.ms, ok: true, routine: true, text: 'On your back.' };
    }
    const pid = d.who, h = handDeviceOf(state, pid), a = actorOf(state, pid);
    if (!h) return { ms: 0, ok: true, routine: true };
    if (b.how === 'drop' || h.kind === 'tool') { if (a) KIT.move(state, h.id, { ground: { area: state.places.live.area, x: a.x, z: a.z } }); setSt(state, h.id, DEVICES[h.model].kind === 'tool' ? 'stowed' : 'pouched'); }
    else {
      const home = KIT.containersOf(state, pid).find(c => { const C = KIT.CONTAINERS[state.items[c].model]; return C.fits?.includes(h.kind) && (state.items[c].holds ?? []).length < C.holds; });
      if (home) KIT.move(state, h.id, { container: home });
      else if (a) KIT.move(state, h.id, { ground: { area: state.places.live.area, x: a.x, z: a.z } });
      setSt(state, h.id, 'pouched');
    }
    return { ms: b.ms, ok: true, routine: true, text: b.how === 'drop' ? 'Let go.' : 'Pouched.' };
  },
  end(state, bus, d) { if (!dry(d)) setPosture(state, d.who, 'highReady'); },
});
// (the rifle let hang, a G-11 from its pouch into the strong hand, the pin pulled (Weapon handling DC 8, a miss ×FAIL_K); one
// already in the hand (a carry on) is only pinned)
registerKind('arm', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms };
    const pid = d.who, sk = skillsOf(state, pid), held = handDeviceOf(state, pid);
    if (held?.kind === 'grenade') {
      const pin = held.st === 'held' ? deviceMs(rollerOf(state, pid), 'gren:pin') : 0;
      if (held.st === 'held') setSt(state, held.id, 'armed');
      b.dev = held.id;
      return { ms: pin, ok: true, routine: true, text: 'Pin out.' };
    }
    const g = pouchedOf(state, pid, b.model ?? 'g11');
    if (!g) return { ms: 0, ok: false, halt: 'refused', text: HANDBACK_WORDS.noKit };
    if (state.people[pid].kit?.hands?.[0]) return { ms: 0, ok: false, halt: 'refused', text: HANDBACK_WORDS.handFull };
    setPosture(state, pid, 'slungFront');
    KIT.move(state, g.id, { pid, hand: 0 });
    setSt(state, g.id, 'armed');
    b.dev = g.id;
    const r = check(stream(state.meta.seed, 'arms:pin', pid, g.id), { skill: 'weapons', value: sk.wh, dc: DEVICE_ACTIONS['gren:pin'].dc, pressure: 'evaluated', tempo: d.tempo ?? 'normal', by: pid, verb: null });
    return { ms: r.ok ? b.ms : Math.round(b.ms * FAIL_K), ok: r.ok, grade: r.grade, routine: r.routine, text: 'Pin out.' };
  },
});
// (the throw through the open door: from the hand round the jamb, into the room (throw.js's closed form: the spin's bias, the
// walls, the roll on, never back over the door's line; a slip at the thrower's feet); Marksmanship against throwDc, +4 through
// a doorway; "Bang out!"; the grenade on the floor at once, its lever gone at the release, its fuse running from there; its
// flight names the door it was thrown through, so the run sheet marks the bang on that door's leg)
registerKind('throw', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms };
    const pid = d.who, g = handDeviceOf(state, pid);
    if (!g || g.kind !== 'grenade') return { ms: 0, ok: true, routine: true, text: null };
    const plan = planOf(state, b.plan ?? d.door) ?? planOf(state, doorNow(state, pid)?.door ?? null), a = actorOf(state, pid), sk = skillsOf(state, pid), area = state.places?.live?.area;
    // (the review of the hunt fixes: a grenade not yet live is never thrown at a shut door from its stack side (a door shut by hand
    // between the drill's door beat and its throw): handed back "Door shut.", the pin as it was. Let go, it met the leaf and burst at
    // the thrower's feet, 3,948 kPa; before v0.0.20 it flew through the leaf into the room)
    if (!b.clear && g.st !== 'live' && shutBetween(state, pid, plan)) return { ms: 0, ok: false, halt: 'blocked', again: true, text: HANDBACK_WORDS.doorShut };
    if (g.st === 'held') setSt(state, g.id, 'armed');
    // (v0.0.19: a frag or a concussion thrown deep (throw.js aimOf); "Throw it clear" to the farthest floor away from the stack)
    // (the hunt of v0.0.18: from the stack side of a shut door the hand is no further than the thrower, so the walls' check
    // (throw.js throwLand: lineClear over the route grid, the closed leaf in it) meets the leaf; never released on the room's side
    // of a shut door (deviceRows strikes the row there, handsStruck a drill that throws before it opens it, and the guard above
    // hands back one not yet live: this is a live grenade's, which must leave the hand))
    const shut = !b.clear && shutBetween(state, pid, plan), from = shut ? [a?.x ?? 0, a?.z ?? 0] : throwFromOf(plan, a), aim = b.clear ? clearAimOf(state, plan, a, from) : DEVICES[g.model]?.as ? aimOf(state, plan, 'deep') ?? throwAimOf(plan, from) : throwAimOf(plan, from);
    // (the fuse the solve reads: a G-11's flat one as built; a cooked or practice grenade's as the thrower believes it is left, never the drawn)
    const rec = state.items[g.id], fuseMs = DEVICES[g.model]?.as ? fuseLeftMs(state, g.id, atMs + b.ms) : rec.fuseMs ?? DEVICES[g.model].fuseMs ?? fuseBelieved(g.model);
    const gG = gravityAt(state, null, from[0], from[1]).gG, ceilingM = areaOf(area)?.rooms?.find(r => r.id === plan?.room)?.ceilingM ?? Infinity;
    const suited = !!state.people[pid].kit?.worn?.suit;
    const solve = throwSolve(state, pid, { from: [from[0], 1.4, from[1]], aim, gMs2: gG * G0_MS2, spin: spinOf(state, area), ceilingM, fuseMs, vMaxMs: throwVMax(sk.fit, suited), conditioned: 1 });
    const r = check(stream(state.meta.seed, 'arms:throw', pid, g.id, 'roll'), { skill: 'marksmanship', value: sk.mrk, dc: throwDc(solve.dM, { door: !!plan?.door && !shut }), pressure: 'evaluated', tempo: d.tempo ?? 'normal', by: pid, verb: null });
    // (the room's side from the plan (stackSideOf), never the thrower's: one past the plane was mirrored onto the stack)
    const o = plan?.door && !shut ? openingOf(plan.door) : null, side = o && a ? -stackSideOf(plan, o, a) : 0;
    const land = throwLand(state, pid, solve, { itemId: g.id, ok: r.ok, margin: r.margin, nat: r.nat, wh: sk.wh, area, feet: a ? [a.x, a.z] : null, door: side ? { axis: o.axis, at: o.at, side } : null, ...(DEVICES[g.model]?.as && !b.clear ? { beyondM: DEEP_BEYOND_M } : {}) });
    const relMs = atMs + b.ms, cooked = g.st === 'live' && Number.isFinite(rec.fuseAtMs);
    KIT.move(state, g.id, { ground: { area, x: land.x, z: land.z } });
    setSt(state, g.id, 'live');
    // (a cooked grenade's fuse runs from its lever, gone at the count; else from the release, as built)
    Object.assign(rec, { fuseAtMs: cooked ? rec.fuseAtMs : relMs + (rec.fuseMs ?? DEVICES[g.model].fuseMs ?? fuseBelieved(g.model)), byId: pid, flight: { ...solve.flight, fromMs: relMs, landMs: relMs + solve.flightMs, x1: land.x, z1: land.z, ...(plan?.door && !shut ? { door: plan.door } : {}), ...(land.atFeet ? { atFeet: true } : {}) } });
    if (!cooked && DEVICES[g.model]?.as) rec.leverAtMs = relMs;
    // (v0.0.19: where the thrower stood, for the instructor's read of his exposure in the door (practice.js throwExposure))
    if (DEVICES[g.model]?.as && a) rec.flight.head = [Math.round(a.x * 1000) / 1000, Math.round(a.z * 1000) / 1000];
    b.dev = g.id;
    // (the device's own call: "Bang out!", "Frag out!", "Concussion out!" (devices.js DEVICES[model].call))
    const call = DEVICES[g.model]?.call ?? SAY.bangout, callId = call === SAY.bangout ? 'bangout' : g.model.startsWith('g9') ? 'fragout' : g.model.startsWith('g13') ? 'concout' : 'bangout';
    bus?.emit('say', { who: pid, text: call, kind: 'speech', durMs: 600, call: callId });
    // (v0.0.19: a practice grenade slipped at your own feet hands back at once, stop motion with its fuse still to run, so "Get
    // clear" (singleRows) is yours to take; the bang beat ran on to the burst with no pause (the review of v0.0.19's K: 4.7 s, no row))
    // (R1 b: every grenade, a G-11 too, and a failed toss that lands where its burst would stun you (burst.js stunOn: its
    // stun line, the walls counted by the blast's line): "Grenade short! Get clear." Before it the boot recruit's G-11 slipped at
    // his feet on seed 48229 burst there with no row to take, 321.3 kPa on him and 38.7 on his #2)
    if (pid === playerId(state) && a) {
      if (land.atFeet) return { ms: b.ms, ok: false, grade: r.grade, routine: false, halt: 'fail', text: SLIP_WORDS };
      if (!r.ok && stunOn(state, { kind: 'grenade', model: g.model, x: land.x, z: land.z, area }, a)) return { ms: b.ms, ok: false, grade: r.grade, routine: false, halt: 'fail', text: SHORT_WORDS };
    }
    return { ms: b.ms, ok: r.ok, grade: r.grade, routine: false, text: call };
  },
});
/** The hand-back of a grenade slipped at your feet (v0.0.19; every grenade from v0.0.22), and of a failed toss that lands where its burst would stun you (R1 b). */
export const SLIP_WORDS = 'Grenade! At your feet. Get clear.', SHORT_WORDS = 'Grenade short! Get clear.';
/** "Get clear" runs this far from a live grenade lying within CLEAR_NEAR_M of you, never nearer a body in its line than CLEAR_BODY_M (m; v0.0.19, my call). */
export const CLEAR_RUN_M = 5, CLEAR_NEAR_M = 4, CLEAR_BODY_M = 0.6;
// (a live grenade on the floor within CLEAR_NEAR_M of a person, and where "Get clear" takes him: of eight headings CLEAR_RUN_M
// long, each stopped 0.4 m short of the first wall it meets and CLEAR_BODY_M short of the first body in its line (the #2 behind
// you on the stack), the end farthest from the grenade; null where none lies near. Exported in v0.0.22 for two.js twoClear, his own
// run (the build sheet v0.0.22 §0 item 35). v0.0.22 (my call, against that item's "unchanged"): the heading is the one that has
// you farthest from it when it bursts, its fuse left run along the heading at your legs' pace (stepper.js profileOf, the walk of
// your move stance; `stance` the caller's), the end farthest from it where the fuse outlasts every run; the farthest end alone sent
// the boot recruit west past his own G-11 on 48224 (0.72 m off it mid-run, 23.4 kPa at the burst against 22.5 standing still) and
// on 48229 (0.25 m off it, 21.7 kPa))
export function clearOf(state, pid, a, { stance = a?.moveStance === 'assault' ? 'assault' : 'combat' } = {}) {
  let g = null, gd = Infinity;
  for (const site of Object.values(state.places?.sites ?? {})) for (const l of site?.items ?? []) {
    const rec = state.items?.[l.id];
    if (rec?.type !== 'grenade' || rec.st !== 'live') continue;
    const dd = Math.hypot(l.x - a.x, l.z - a.z);
    if (dd < gd) { gd = dd; g = l; }
  }
  if (!g || gd > CLEAR_NEAR_M) return null;
  const fuseAt = state.items?.[g.id]?.fuseAtMs, leftS = Number.isFinite(fuseAt) ? Math.max(0, (fuseAt - state.clock.ms) / 1000) : Infinity;
  const legs = legsOf(state, pid, a.x, a.z), vMax = legs.walk[stance] ?? legs.walk.combat;
  let best = null;
  for (let k = 0; k < 8; k++) {
    const ang = k * Math.PI / 4, to = [a.x + Math.cos(ang) * CLEAR_RUN_M, a.z + Math.sin(ang) * CLEAR_RUN_M];
    const end0 = clipped(state, [a.x, a.z], to), ux = Math.cos(ang), uz = Math.sin(ang);
    let L = Math.hypot(end0[0] - a.x, end0[1] - a.z) - 0.4;
    for (const o of state.actors?.list ?? []) {
      if (o === a) continue;
      const dx = o.x - a.x, dz = o.z - a.z, along = dx * ux + dz * uz, lat = Math.abs(dx * uz - dz * ux);
      if (along > 0 && lat < CLEAR_BODY_M) L = Math.min(L, along - CLEAR_BODY_M);
    }
    if (L < 0.5) continue;
    const end = [a.x + ux * L, a.z + uz * L];
    const far = Math.hypot(end[0] - g.x, end[1] - g.z);
    // (where the run has you when it bursts: its fuse left along the heading's profile)
    const sAt = Number.isFinite(leftS) ? profileAt(profileOf(L, vMax, legs.pushMs2, legs.brakeMs2), leftS).s : L, atBurst = Math.hypot(a.x + ux * sAt - g.x, a.z + uz * sAt - g.z);
    if (!best || atBurst > best.atBurst + 1e-9 || (Math.abs(atBurst - best.atBurst) <= 1e-9 && far > best.far + 1e-9)) best = { to: [q(end[0], 1e-3), q(end[1], 1e-3)], far, atBurst };
  }
  return best ? { to: best.to, far: best.far } : null;
}
// (the bang: the eyes off it while the fuse burns, the rifle back up (ACTIONS.up's second, inside the fuse), the burst at its end)
registerKind('burst', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms };
    setPosture(state, d.who, 'highReady');
    const id = d.beats.find(x => x.key === 'throw')?.dev ?? null, rec = id ? state.items?.[id] : null;
    const ms = rec && Number.isFinite(rec.fuseAtMs) ? Math.max(0, rec.fuseAtMs - atMs) : 0;
    return { ms, ok: true, routine: true, text: null };
  },
  end(state, bus, d, b) { if (!dry(d)) tickDevices(state, bus, b.untilMs); },
});
// (the charge on the latch edge: the rifle let hang, the SC-1 from its pouch, placed (Demolitions DC 10, a miss ×FAIL_K), its
// FD-1's shock tube fitted; your #2 sent to his own safe point (rec.safe: runSlot), his stack row stopped where it stands)
registerKind('place', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms };
    const pid = d.who, plan = planOf(state, b.plan ?? d.door), sk = skillsOf(state, pid);
    if (placedOn(state, b.door, pid)) return { ms: 0, ok: true, routine: true, text: null };
    // (v0.0.19: the charge the door takes (breach.js chargeFor): the SC-1 on the latch as built, the BC-1 on its edge)
    const model = b.model ?? 'sc1', side = b.edge ?? 'latch', c = pouchedOf(state, pid, model), fd = pouchedOf(state, pid, 'fd1'), at = chargePointOf(state, plan, side);
    if (!c || !fd || !at) return { ms: 0, ok: false, halt: 'refused', text: HANDBACK_WORDS.noKit };
    if (state.people[pid].kit?.hands?.[0] && state.items[state.people[pid].kit.hands[0]]?.type === 'gun') return { ms: 0, ok: false, halt: 'refused', text: HANDBACK_WORDS.handFull };
    setPosture(state, pid, 'slungFront');
    KIT.move(state, c.id, { ground: { area: state.places.live.area, x: at[0], z: at[1] } });
    const rec = state.items[c.id];
    setSt(state, c.id, 'placed'); Object.assign(rec, { door: b.door, side, byId: pid, tubeId: fd.id });
    setSt(state, fd.id, 'fitted');
    const sp = safePointsOf(state, plan, model, model === 'sc1' ? {} : { edge: side }), two = houseOf(state)?.two;
    // (v0.0.19: your #2 the doer (his "Breacher up" task) sends nobody: you are on the give line already)
    if (two?.pid && sp && two.pid !== pid) {
      two.safe = { door: b.door, x: sp.two[0], z: sp.two[1] };
      if (two.doing && !two.doing.halt && /^drill:(stack|room)/.test(two.doing.step ?? '')) haltDoing(state, bus, two.doing, 'stop', null, atMs);
    }
    const r = check(stream(state.meta.seed, 'arms:place', pid, c.id), { skill: 'demolitions', value: valueOf(state, pid, 'demolitions'), dc: DEVICES[model].dc, pressure: 'evaluated', tempo: d.tempo ?? 'normal', by: pid, verb: null });
    bus?.emit('say', { who: pid, text: SAY.placing, kind: 'speech', durMs: 600, call: 'placing' });
    return { ms: r.ok ? b.ms : Math.round(b.ms * FAIL_K), ok: r.ok, grade: r.grade, routine: false, text: 'Charge placed.' };
  },
  end(state, bus, d, b) { if (!dry(d)) setPosture(state, d.who, 'highReady'); },
});
// (the charge primed at the safe point: the FD-1 in the support hand's work, the rifle at high ready in the strong)
registerKind('prime', {
  run(state, bus, d, b) {
    if (dry(d)) return { ms: b.ms };
    const c = b.door ? placedOn(state, b.door, d.who) : null;
    if (c && c.st === 'placed') setSt(state, c.id, 'primed');
    return { ms: c ? b.ms : 0, ok: true, routine: true, text: c ? 'Primed.' : null };
  },
});
// (the halligan or the ram: the rifle let hang, the tool off the back, Fitness against the door's DC + the tool's dcK (a fail ×FAIL_K,
// "It won't give. Again, or hold it.", the tool kept in the hands for the next try), the leaf open, the tool let go at the door
// and the rifle up)
registerKind('force', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms, passMs: b.passMs };
    const pid = d.who, o = openingOf(b.door), model = b.model ?? 'hal', sk = skillsOf(state, pid);
    if (!o) return { ms: 0, ok: true };
    const held = handDeviceOf(state, pid);
    let reach = 0;
    if (!(held?.kind === 'tool' && held.model === model)) {
      const t = pouchedOf(state, pid, model);
      if (!t) return { ms: 0, ok: false, halt: 'refused', text: HANDBACK_WORDS.noKit };
      if ((state.people[pid].kit?.hands ?? []).some(Boolean)) return { ms: 0, ok: false, halt: 'refused', text: HANDBACK_WORDS.handFull };
      setPosture(state, pid, 'slungFront');
      KIT.move(state, t.id, { pid, hand: 0 });
      setSt(state, t.id, 'held');
      reach = 1;
    }
    if (openingState(state, o) === 'open') { b.drop = true; return { ms: 0, passMs: 0, ok: true, routine: true, text: 'The door is open.' }; }
    const handMs = reach ? b.handMs : Math.round(DEVICES[model].force.s * 1000), dc = forceDc(state, o.id, model);
    const r = check(stream(state.meta.seed, 'house:force', pid, o.id, atMs), { skill: 'fitness', value: sk.fit, dc, pressure: 'evaluated', tempo: d.tempo ?? 'normal', by: pid, verb: null });
    if (!r.ok) return { ms: Math.round(handMs * FAIL_K), ok: false, grade: r.grade, halt: 'fail', again: true, text: HANDBACK_WORDS.wontGive };
    breakOpening(state, o.id, atMs);
    // (a pried or rammed leaf keeps the linear swing (no verb on the delta); its fact names the leaf's start and its stop)
    const openMs = Math.round((o.openS ?? DOOR_S) * 1000);
    setOpening(state, o.id, 'open', { atMs: atMs + handMs + openMs });
    innerSeen(state, d.who, o, atMs);
    ((state.$places ??= {}).moving ??= new Set()).add(o.id);
    const [x, z] = doorMid(o);
    bus?.emit('door', { id: o.id, area: openingArea(o.id)?.id ?? null, x, z, state: 'open', kind: o.kind, who: pid, how: b.how, leafAtMs: atMs + handMs, stopAtMs: stopAtOf(null, atMs + handMs, openMs) });
    b.drop = true;
    const rest = b.ms - b.handMs;
    return { ms: handMs + rest, passMs: handMs + (b.passMs - b.handMs), ok: true, grade: r.grade, routine: false, text: b.how === 'ram' ? 'Rammed in.' : 'Pried open.' };
  },
  end(state, bus, d, b, { cut }) {
    if (dry(d) || cut || !b.drop) return;
    const pid = d.who, t = handDeviceOf(state, pid), a = actorOf(state, pid);
    if (t?.kind === 'tool' && a) { KIT.move(state, t.id, { ground: { area: state.places.live.area, x: a.x, z: a.z } }); setSt(state, t.id, 'stowed'); }
    setPosture(state, pid, 'highReady');
  },
});
// (where a throw leaves the hand: round the jamb nearest the thrower, THROW_JAMB_M into the opening and THROW_PAST_M past the
// door's line into the room, the arm's reach from #1 on his stack (0.88 m at room 1's door), so the drawn arc starts at his
// hand (the review of 2026-11-16: from the door's middle it began 1 m from him); the thrower's own place where there is no door)
const THROW_JAMB_M = 0.15, THROW_PAST_M = 0.15;
function throwFromOf(plan, a) {
  const o = plan?.door ? openingOf(plan.door) : null;
  if (!o) return [a?.x ?? 0, a?.z ?? 0];
  // (the stack's side from the plan, never from where the thrower stands: one past the door's plane threw back onto the stack
  // (the review of v0.0.19's K: a G-9P from (28.88, 11.825) landed 2 m into the hall); the actor's own side where no plan says)
  const [mx, mz] = doorMid(o), s = stackSideOf(plan, o, a);
  const lo = Math.min(o.a, o.b) + THROW_JAMB_M, hi = Math.max(o.a, o.b) - THROW_JAMB_M;
  const along = a ? Math.max(lo, Math.min(hi, o.axis === 'x' ? a.x : a.z)) : (o.axis === 'x' ? mx : mz);
  return o.axis === 'x' ? [along, o.at - s * THROW_PAST_M] : [o.at - s * THROW_PAST_M, along];
}
// (the stack's side of a door's line, +1 or -1: the plan's plane (its `into` is the room's side), else the thrower's own side)
function stackSideOf(plan, o, a) {
  if (plan?.plane && plan.plane.axis === o.axis && plan.plane.at === o.at && plan.plane.into) return -plan.plane.into;
  return a ? (o.axis === 'x' ? Math.sign(a.z - o.at) : Math.sign(a.x - o.at)) || 1 : 1;
}
// (where a throw is aimed: the room's middle, the far side of it from the door, else 3 m past the hand)
function throwAimOf(plan, from) {
  const r = plan?.rects?.[0];
  if (!r) return [from[0] + 3, from[1]];
  return [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2];
}
// (v0.0.19, D2 (see the header): the count. The pin is out (the arm's); the lever let go here, the fuse running from it (its drawn
// fuseMs, the truth the burst reads), the count held for the beat's want: Weapon handling DC 6 unpaced (devices.js cookCount),
// late on a miss, a disaster's freeze; the record keeps its want for the planner's belief (devplan.js: cook))
registerKind('cook', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms };
    const pid = d.who, g = handDeviceOf(state, pid);
    if (!g || g.kind !== 'grenade' || g.st !== 'armed' || !DEVICES[g.model]?.cook || !(b.want > 0)) return { ms: 0, ok: true, routine: true, text: null };
    const rec = state.items[g.id];
    setSt(state, g.id, 'live');
    Object.assign(rec, { leverAtMs: atMs, fuseAtMs: atMs + (rec.fuseMs ?? fuseBelieved(g.model)), cook: { wantMs: b.want, atMs }, byId: pid });
    const c = cookCount(stream(state.meta.seed, 'arms:cook', pid, g.id), skillsOf(state, pid).wh, b.want, { tempo: d.tempo ?? 'normal', by: pid });
    return { ms: c.ms, ok: c.grade === 'pass', grade: c.roll.grade, routine: false, text: c.grade === 'pass' ? 'Cooked.' : null };
  },
});
// (v0.0.19, D2 (see the header): the ballistic breach. The rifle on the lock, or each hinge top down, 45 degrees down and in, its
// rounds a real shot each (ballistic.js shootRound: shot.js resolveShot, so a click is the dummy and a stoppage the card); a point
// opened goes on to the next; BALLISTIC_MAX_ROUNDS on one point and it hands back "It won't give." (Again, Pry it, Kick it), a
// click or a stoppage hands back 'gun'; the door open, the stack goes in. One round a run: the beat fires a round and comes back
// (`again`) for the next at the round's end, so each round is taken on its own tick at its own time, heard 333 ms apart, never
// all in the tick the press began (the review of v0.0.19's K: three rounds on one tick, stamped −50, +283 and +616 ms); the
// rounds on the point in hand counted on the beat (`b.n`), so a press never fires more than BALLISTIC_MAX_ROUNDS on one point)
registerKind('shootDoor', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms };
    const pid = d.who, door = b.door ?? d.door, plan = planOf(state, b.plan ?? d.door) ?? planOf(state, doorNow(state, pid)?.door ?? null);
    const o = door ? openingOf(door) : null;
    if (!o || openingState(state, o) === 'open') return { ms: 0, ok: true, routine: true, text: null };
    const why = ballisticOk(state, pid), H = houseOf(state);
    if (why || !H) return { ms: 0, ok: false, halt: 'refused', text: why ?? NOT_ISSUED };
    setPosture(state, pid, 'highReady');
    // (the thumb off safe on the lock, as on a target: the selector's own action and time (firearms.js), the belief with it; the
    // first round at its end)
    const gunId = state.people[pid]?.kit?.worn?.sling ?? null;
    if (gunId && state.items[gunId]?.mode === 'safe') { const t = doAction(state, bus, { pid, gunId, action: 'selector:semi', tempo: d.tempo ?? 'normal' }); if (!t.ok) return { ms: t.ms ?? 0, ok: false, halt: 'fail', again: true, text: t.text }; return { ms: t.ms ?? 0, ok: true, routine: true, again: true, text: null }; }
    // (an inner door's swing as seen from the room it is shot from: the closet's "Push door, hinge left" from room 2)
    const from = plan && plan.door !== door ? plan.room ?? null : null;
    const sp = shootPlanOf(state, pid, { ...(plan ?? {}), door }, { from }), rec = (H.breach ??= {})[door] ??= { how: sp.how, rounds: 0, points: Object.fromEntries(sp.points.map(p => [p.key, 0])), atMs };
    const pt = sp.points.find(p => rec.points[p.key] !== 1);
    if (pt) {
      // (the point in hand: a fresh one starts its count again)
      if (b.pt !== pt.key) { b.pt = pt.key; b.n = 0; }
      const r = shootRound(state, bus, { who: pid, door, how: sp.how, atMs, tempo: d.tempo ?? 'normal', record: doorShot(), plan, from }, pt);
      if (!r.shot?.fired) return { ms: r.ms, ok: false, halt: 'gun', text: r.shot?.why === 'dud' ? 'Click.' : 'Stoppage.' };
      rec.rounds += 1; (rec.tries ??= {})[pt.key] = (rec.tries[pt.key] ?? 0) + 1; b.n += 1;
      // (the most rounds on one point in one press: the gauges' F32, a press handing back within BALLISTIC_MAX_ROUNDS)
      rec.most = Math.max(rec.most ?? 0, b.n);
      if (r.defeated) rec.points[pt.key] = 1;
      else if (b.n >= BALLISTIC_MAX_ROUNDS) return { ms: r.ms, ok: false, halt: 'fail', again: true, text: HANDBACK_WORDS.wontGive };
      // (the next round, the next point, or (the last point opened) the door, at this round's end)
      return { ms: r.ms, ok: true, routine: false, again: true, text: null };
    }
    // (every point opened: the door goes, its leaf swinging in)
    delete b.pt; delete b.n;
    // (the one writer of a broken lock, op.js breakOpening: H.broken on the lane as before, the door's own delta off it)
    breakOpening(state, door, atMs);
    rec.atMs = atMs;
    const openMs = Math.round((o.openS ?? DOOR_S) * 1000);
    setOpening(state, o.id, 'open', { atMs: atMs + openMs });
    innerSeen(state, pid, o, atMs);
    ((state.$places ??= {}).moving ??= new Set()).add(o.id);
    const [x, z] = doorMid(o);
    bus?.emit('door', { id: o.id, area: openingArea(o.id)?.id ?? null, x, z, state: 'open', kind: o.kind, who: pid, how: 'shot' });
    bus?.emit('say', { who: pid, text: SAY.breaching, kind: 'speech', durMs: 600, call: 'breaching' });
    return { ms: openMs, ok: true, routine: false, text: SAY.breaching };
  },
});
// (the scene's record of a breach round (v0.0.19): house-kit.js breachShot, set by the scene, so this module never imports it)
function doorShot() { return doorShot.fn ?? null; }
/** The scene's recorder of a breach round (v0.0.19; ballistic.js shootRound hands it each round): fn(state, bus, shot). */
export function useDoorShot(fn) { doorShot.fn = typeof fn === 'function' ? fn : null; }
export const doorShotOf = () => doorShot();
// (where "Throw it clear" goes (v0.0.19): the farthest open floor of the room ahead where its door stands open, else down the hall away from the thrower's #2)
function clearAimOf(state, plan, a, from) {
  if (plan?.door && openingState(state, plan.door) === 'open') return aimOf(state, plan, 'deep') ?? throwAimOf(plan, from);
  const H = houseOf(state), two = H?.twoPid ? actorOf(state, H.twoPid) : null, dir = two && a ? Math.sign(a.x - two.x) || 1 : 1;
  return [from[0] + 6 * dir, from[1]];
}

// (v0.0.19, the team's kinds (team.js). The walks (give, front, stepback, closeup) are moves with their ends (TEAM_MOVES); `order`
// is your voice, its end writing your #2's task (R.house.two.task), so it acts the next tick ("As you were": his task belayed and
// his work halted where it stands); `cue` waits a tick at a time on the other man's work (his beat done on the task's record, the
// task over), at most team.js CUE_MAX_MS, then hands back with the cue still to come (never a dead end))
/** The team's hand-backs' words (v0.0.19). */
export const TASK_WORDS = Object.freeze({ cue: "Your two's still on the door. Carry on, or as you were.", room: 'He needs the door. Give him room.', belay: 'As you were. Your call.', failed: "He couldn't get it open. Your call." });
registerKind('order', {
  run(state, bus, d, b) {
    if (dry(d)) return { ms: b.ms };
    const words = TEAM_WORDS[b.call]?.words ?? null;
    if (words) bus?.emit('say', { who: d.who, text: words, kind: 'speech', durMs: b.ms, call: b.call });
    return { ms: b.ms, ok: true, routine: true, text: words };
  },
  end(state, bus, d, b, { cut, atMs }) {
    if (dry(d) || cut) return;
    const W = houseOf(state)?.two;
    if (!W?.pid || !b.door) return;
    if (b.task === 'belay') {
      const t = W.task;
      if (t && !['done', 'belayed', 'failed'].includes(t.st)) { t.st = 'belayed'; t.why = 'belay'; if (W.doing?.task && !W.doing.halt) haltDoing(state, bus, W.doing, 'belay', null, atMs); }
      return;
    }
    W.task = { kind: b.task, how: b.how ?? null, door: b.door, atMs, st: 'ordered', done: {}, why: null };
    bus?.emit('house', { phase: 'task', room: planOf(state, b.plan)?.room ?? null, who: W.pid, atMs, kind: b.task, text: b.how ?? null });
  },
});
registerKind('cue', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: 0 };
    const t = houseOf(state)?.two?.task ?? null, from = (b.cueFromMs ??= atMs);
    if (!t || t.door !== b.door) { delete b.cueFromMs; return { ms: 0, ok: true, routine: true, text: null }; }
    if (t.st === 'belayed' || t.st === 'failed') { delete b.cueFromMs; return { ms: 0, ok: false, halt: 'fail', text: t.st === 'belayed' ? TASK_WORDS.belay : TASK_WORDS.failed }; }
    if (t.st === 'done' || t.done?.[b.on] !== undefined) { delete b.cueFromMs; return { ms: 0, ok: true, routine: true, text: null }; }
    // (at most CUE_MAX_MS past the later of the cue's start and his task's planned end: a charge's work is longer than a bang's)
    const W2 = houseOf(state)?.two, plannedEnd = W2?.doing?.task && Number.isFinite(W2.doing.untilPlanMs) ? W2.doing.untilPlanMs : from;
    if (atMs - Math.max(from, plannedEnd) >= CUE_MAX_MS) { delete b.cueFromMs; return { ms: 0, ok: false, halt: 'fail', again: true, text: t.done?.front === undefined ? TASK_WORDS.room : TASK_WORDS.cue }; }
    return { ms: TICK_MS, ok: true, routine: true, again: true, text: null };
  },
});
// (v0.0.19, his charge taken off the door on As you were (taskSlot's 'two:recover'; the review of 2026-11-16): the rifle let hang,
// unprimed where primed, the SC-1 off the latch edge into a pouch that takes it (at his feet where none has room), its FD-1 back in
// its pouch; a charge whose fuse already runs is left to burst)
registerKind('recover', {
  run(state, bus, d, b) {
    if (dry(d)) return { ms: b.ms };
    const pid = d.who, c = b.door ? placedOn(state, b.door, pid) : null, rec = c ? state.items[c.id] : null;
    if (!c || !rec || Number.isFinite(rec.fuseAtMs)) return { ms: 0, ok: true, routine: true, text: null };
    setPosture(state, pid, 'slungFront');
    const a = actorOf(state, pid), tube = rec.tubeId && state.items[rec.tubeId] ? rec.tubeId : null;
    const home = KIT.containersOf(state, pid).find(x => { const C = KIT.CONTAINERS[state.items[x].model]; return C?.fits?.includes('charge') && (state.items[x].holds ?? []).length < C.holds; });
    if (home) KIT.move(state, c.id, { container: home });
    else if (a) KIT.move(state, c.id, { ground: { area: state.places.live.area, x: a.x, z: a.z } });
    for (const f of ['door', 'side', 'byId', 'tubeId']) delete rec[f];
    setSt(state, c.id, 'pouched');
    if (tube) setSt(state, tube, 'pouched');
    return { ms: b.ms, ok: true, routine: true, text: 'Charge off.' };
  },
  end(state, bus, d) { if (!dry(d)) setPosture(state, d.who, 'highReady'); },
});

// ---- v0.0.20, the room (the build sheet's items 12 and 17; drill.md items 3 and 4; COMBAT §25.19.2.1) ----
// The leaving of a room and the far leg's cover, as beats of yours that the #2's tick answers (combat/two.js twoTick): `out` says
// "Coming out!" where the row starts inside a room called clear (nothing, and no time, elsewhere), flowing from rung 3 (CALL_FLOW_S)
// and CALL_S below; `status` waits after your "Room clear!" on his status (R.house.two.status[door]: asked here, answered by his
// tick), at most STATUS_MS; `moving` says "Moving!" before the far leg and waits on his "Move!" (R.house.two.moving[door]) at most
// MOVE_WAIT_MAX_MS, then hands back as the "Clear!" gate does ('clear', in the words of what keeps him: "Your two's on a man.", "Your two's
// still on his sector."; his rifle down, "Your two's gun down." at once; a Carry on then goes without him). The team's calls are tallied
// on the leg (L.teamCalls: { [wordId]: { due, said } }, the run sheet's TEAM row's "CALLS n OF m").
/** The words of the room's calls (team.js TEAM_WORDS). */
export const SAY_ROOM = Object.freeze({ out: TEAM_WORDS.out.words, moving: TEAM_WORDS.moving.words });
// (a call's tally on a leg: due when its beat runs, said when its 'say' is emitted)
export function tallyCall(L, id, said = true) {
  if (!L) return;
  const c = ((L.teamCalls ??= {})[id] ??= { due: 0, said: 0 });
  c.due++; if (said) c.said++;
}
// (a house leg by its door: a room's or the hall's)
const legByDoor = (state, door) => { const H = houseOf(state); return [...(H?.rooms ?? []), ...(H?.hall ? [H.hall] : [])].find(L => L.door === door) ?? null; };
/** The room a body stands inside that has been called clear (or passed), or null (the `out` beat's "inside a cleared room"). */
export function clearedRoomAt(state, x, z) {
  for (const L of houseOf(state)?.rooms ?? []) {
    if (!DONE_ROOM.has(L.state)) continue;
    const P = planOf(state, L.door);
    if (P && pastThreshold(P, x, z)) return L;
  }
  return null;
}
/**
 * The cleared room whose mark is yours (the build sheet's §0 item 22): you inside a room called clear and not marked, your #2 not to
 * mark it (his mark not armed, or he is not the last man: L.markYours, or gun down, or on a task): the single "Mark the room" is
 * offered there (singleRows) and the DI's cqb-mark names it. The leg, or null.
 */
export function markYoursOf(state, pid = playerId(state)) {
  const a = actorOf(state, pid), W = houseOf(state)?.two;
  if (!a || !W?.pid) return null;
  const L = clearedRoomAt(state, a.x, a.z);
  if (!L || L.marked || L.state !== 'clear') return null;
  return L.markYours || W.down || taskOf(state) || !W.markOwed?.[L.door] ? L : null;
}
const callMsOf = (d) => Math.round(((d.rung ?? 0) >= 3 ? CALL_FLOW_S : CALL_S) * 1000 * (d.tempo === 'rushed' ? RUSH_K : 1));
// (a plan's dry run (simulate: no state) times these beats at b.ms, none set by planBundle: 0, the call and the waits being the
// room's to decide as they run; the bundle's planned end is then the beats' without them, as the squeeze's wait is)
registerKind('out', {
  run(state, bus, d, b) {
    if (dry(d)) return { ms: b.ms ?? 0 };
    // (once a room: a "Coming out!" said already (the single, then the stack row) is not said again)
    const a = actorOf(state, d.who), L = a ? clearedRoomAt(state, a.x, a.z) : null;
    if (!L || L.teamCalls?.out?.said) return { ms: 0, ok: true, routine: true, text: null };
    const ms = callMsOf(d);
    bus?.emit('say', { who: d.who, text: SAY_ROOM.out, kind: 'speech', durMs: ms, call: 'out', room: L.door });
    tallyCall(L, 'out');
    return { ms, ok: true, routine: true, text: SAY_ROOM.out };
  },
});
registerKind('status', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms ?? 0 };
    const W = houseOf(state)?.two;
    if (!W?.pid || !b.plan || d.who !== playerId(state)) return { ms: 0, ok: true, routine: true, text: null };
    const s = ((W.status ??= {})[b.plan] ??= { askMs: atMs });
    if (s.saidMs !== undefined || atMs - s.askMs >= STATUS_MS) return { ms: 0, ok: true, routine: true, text: null };
    return { ms: TICK_MS, ok: true, routine: true, again: true, text: null };
  },
});
/** What keeps your #2's "Move!" (the far leg's wait, the `moving` kind): 'twoDown' his rifle down (W.down), 'twoMan' on a man (his take-in or his rounds), else 'twoSector' (his own look or walk still to come); HANDBACK_WORDS' keys. */
export const moveWaitWhy = (W) => (W?.down ? 'twoDown' : W?.contact || W?.eng ? 'twoMan' : 'twoSector');
registerKind('moving', {
  run(state, bus, d, b, atMs) {
    if (dry(d)) return { ms: b.ms ?? 0 };
    const plan = planOf(state, b.plan), W = houseOf(state)?.two, ms = callMsOf(d);
    if (!plan?.far) return { ms: 0, ok: true, routine: true, text: null };
    if (!W?.pid || d.who !== playerId(state)) { bus?.emit('say', { who: d.who, text: SAY_ROOM.moving, kind: 'speech', durMs: ms, call: 'moving' }); return { ms, ok: true, routine: true, text: SAY_ROOM.moving }; }
    const r = ((W.moving ??= {})[b.plan] ??= { atMs });
    if (r.saidMs === undefined) {
      r.saidMs = atMs;
      bus?.emit('say', { who: d.who, text: SAY_ROOM.moving, kind: 'speech', durMs: ms, call: 'moving', room: b.plan });
      tallyCall(legByDoor(state, b.plan), 'moving');
      return { ms, ok: true, routine: true, again: true, text: SAY_ROOM.moving };
    }
    // (his "Move!" heard, or the hand-back already given and Carry on pressed: the far walk goes)
    if (r.moveMs !== undefined || r.handed !== undefined) return { ms: 0, ok: true, routine: true, text: null };
    // (handed back as the "Clear!" gate hands back a #2 on a man ('clear', its Carry on then walks the far leg without his answer), in
    // the words of what keeps him (moveWaitWhy): his rifle down at once, since no "Move!" comes from a man gun down (the review of
    // 2026-11-16: the wait ran its 4 s and said "Your two's on a man." to a #2 who had said "Gun down!"); on a man, or his sector, at
    // MOVE_WAIT_MAX_MS)
    const why = moveWaitWhy(W);
    if (why === 'twoDown' || atMs - r.saidMs >= MOVE_WAIT_MAX_MS) { r.handed = atMs; return { ms: 0, ok: false, halt: 'clear', again: true, text: HANDBACK_WORDS[why] }; }
    return { ms: TICK_MS, ok: true, routine: true, again: true, text: null };
  },
});
registerKind('wait', { run(state, bus, d, b) { return { ms: b.ms, ok: true, routine: true }; } });

// (the hand-backs asked once (the #2's wait at a door, an inner door): the house's record, else the stop's, so "Carry on" goes on)
const askedOf = (state) => { const H = houseOf(state); return H ? (H.asked ??= {}) : state.stop ? (state.stop.asked ??= {}) : {}; };
/** Whether the #2 stands over TWO_SLOT_M from his slot at the lane's door, in the house (cqb.js cqb-two reads it). */
export const twoAway = (state, ms = state.clock.ms) => { const H = houseOf(state); if (!H?.two?.pid) return false; const d = twoOffSlot(state, H.two, ms); return d !== null && d > TWO_SLOT_M; };
/** An inner door's wall in words, from the room's middle: "east wall" (the DI's lead reads it too: cqb.js stopLead). */
export function innerWall(state, plan, id) { return wallOf(state, plan, id); }
// (an inner door's wall in words, from the room's middle: "east wall")
function wallOf(state, plan, id) {
  const o = openingOf(id), r = plan?.rects?.[0];
  if (!o || !r) return 'the far wall';
  const [x, z] = doorMid(o), cx = (r[0] + r[2]) / 2, cz = (r[1] + r[3]) / 2;
  return Math.abs(x - cx) > Math.abs(z - cz) ? (x > cx ? 'east wall' : 'west wall') : (z > cz ? 'south wall' : 'north wall');
}
// (a body put where its move says: an NPC's post goes with him, so the people layer keeps him there (the scene's placeTwo's way))
function placeAt(state, pid, a, x, z) {
  a.x = x; a.z = z;
  if (pid === playerId(state)) return;
  const post = state.people?.[pid]?.post;
  if (post) { post.x = q(x, 1e-4); post.z = q(z, 1e-4); }
}
/**
 * The player's shot-row feet still running when a new step takes their place at ms (state.stop.feet: moving on, or braking
 * to plant): the body put where their closed form has it at ms, at their speed there, so the new step's move starts from
 * the body's place at its own start (the rework's R2, BODY §16.8: dropped a tick behind, the body stood still that tick).
 */
export function feetTo(state, ms = state.clock.ms) {
  const S = state.stop, f = S?.feet;
  if (!f || f.done || !f.prof) return;
  const a = actorOf(state, S.who);
  if (!a) return;
  const p = moveAt(f, ms), x0 = a.x, z0 = a.z;
  a.x = p.x; a.z = p.z; a.locoMs = ms;
  locoStep(a, x0, z0, { state, pid: S.who, gait: 'walk', stance: f.stance ?? a.moveStance ?? null, vMs: p.vMs > 0 ? p.vMs : null });
  if (p.vMs > 0) a.v = [q(p.vMs * Math.cos(p.headRad), 0.001), q(p.vMs * Math.sin(p.headRad), 0.001)]; else delete a.v;
}
const doorMid = (o) => (o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2]);
// (the hunt of v0.0.18: the rifle stays on its sling while a hand holds a device (devices.js handsFullWhy): the flash's
// ready beat, run before its arm, put the rifle at high ready with an armed G-11 in the strong hand. It comes up at the bang, the
// force's end, or once the device is pouched or let go)
const setPosture = (state, pid, posture) => { const k = state.people?.[pid]?.kit; if (!k || (!SLUNG.has(posture) && handDeviceOf(state, pid))) return; (k.carry ??= {}).posture = posture; };

// ---- the player's bundle in stop motion ----

/** The words of a bundle row's beats grouped by channel, for the face: { feet: n, hands: n, eyes: n, voice: n }. */
const laneCount = (beats) => beats.reduce((o, b) => ((o[b.ch] = (o[b.ch] ?? 0) + 1), o), {});

/**
 * The catalogue's rows at the lane's door (see the header; COMBAT §25.19.2): [{ id: 'drill:<row>[@<variant>]><door>', kind:
 * 'bundle', label, ms, beats, seams, rung, variant, lanes, group, slot, off?, struck?, lead, later? }], the rung's own first;
 * a row of the rung not yet lived struck "by hand first"; a row above the rung shown struck with its rung ("rung 3"), never
 * hidden (the user's "even if grayed out", 2026-11-11), and paged last (later); "Breach (explosive)" struck "no charge issued".
 */
export function bundleRows(state, pid = playerId(state), ms = state.clock.ms) {
  const here = doorNow(state, pid);
  if (!here) return [];
  const rung = rungOf(state, pid, 'room'), out = [];
  // (the review of the hunt fixes: a charge placed or primed on the shut leaf is the way in. Yours: the room's rows go by it
  // (@charge, @cut for a BC-1) whatever way was set, and the cycle offers no other (breachWays); every row that would open the leaf
  // another way is struck CHARGE_ON_WHY below. With the strike on the door's singles only, "Clear the room" @push, @kick or @pry
  // stayed live, T named it, and it opened the door over the SC-1: the lane ended "a charge left on a door")
  const leaf = here.plan.door ? chargeOnLeaf(state, pid, here.plan) : null;
  const variant = leaf?.mine ? { ...variantHere(state, pid), breach: leaf.how } : variantHere(state, pid);
  for (const B of BUNDLES) {
    // (v0.0.18, the kit's rows (see the header): live where the kit carries what they need, struck by the door's swing; else as
    // before: the breach struck "no charge issued", at a pull door "Pry it" struck "not issued" in its place, the rest not shown)
    if (B.offeredNow === 'kit' || B.offeredNow === 'locked') { const r = kitRow(state, pid, B, here, rung, variant, ms); if (r) out.push(r); continue; }
    // (v0.0.19, the #2's roles on your word (team.js taskWhy): at a lane's door, struck with their reason, never removed)
    if (B.offeredNow === 'team') { out.push(...teamRows(state, pid, B, here, rung, ms)); continue; }
    if (B.single || B.offeredNow === false) continue;
    // (each where it applies: the stack before the door is open, In before you are in, Dominate inside, the room's row from
    // wherever the room is still ahead)
    if (!groupApplies(state, pid, B.id, here)) continue;
    const id = `drill:${B.id}${variantTag(variant)}>${here.door}`, base = { id, kind: 'bundle', group: B.group, slot: B.slot, rung: B.rung, door: here.door, bundle: B.id, cmd: false, skill: null, carefulMs: null };
    // (a row not built yet here: the breach with no charge issued (COMBAT §25.19.11 question 3's default))
    if (B.offeredNow === 'struck') {
      if (!here.plan.door || openingState(state, here.plan.door) === 'open') continue;
      out.push({ ...base, label: B.label, ms: null, rushMs: null, odds: null, routine: true, off: B.needs === 'charge' ? 'no charge issued' : 'not issued', struck: true, subs: [], beats: [], seams: [], variant: {}, lanes: {}, lead: false, later: true });
      continue;
    }
    // (above the rung: greyed with the rung that runs it, never hidden, paged last)
    if (B.rung > rung) {
      const how = breachOf(state, here.plan, variant.breach, null, pid);
      out.push({ ...base, label: labelOf(state, B, here.plan, how, { bang: variant.bang === 'flash' && kitHas(state, pid, 'flashbang') }), ms: null, rushMs: null, odds: null, routine: true, off: `rung ${B.rung}`, struck: true, subs: [], beats: [], seams: [], variant: {}, lanes: {}, lead: false, later: true });
      continue;
    }
    const plan = planBundle(state, pid, B.id, { door: here.door, rung, variant, atMs: ms });
    if (!plan) continue;
    const lived = offered(state, pid, B);
    const rushed = planBundle(state, pid, B.id, { door: here.door, rung, variant, atMs: ms, tempo: 'rushed' });
    out.push({ ...base, label: plan.label, ms: plan.ms, rushMs: rushed?.ms ?? plan.ms, odds: plan.odds < 1 ? plan.odds : null, routine: plan.odds >= 1, off: lived ? null : 'by hand first',
      struck: !lived, subs: plan.beats.map(b => ({ id: b.key, label: b.key, ms: b.ms })), beats: plan.beats.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), seams: plan.seams,
      variant: plan.variant, lanes: laneCount(plan.beats), lead: leadOf(B, rung), reorg: plan.reorg });
  }
  // (the live rows the rung's own first, then the rest by group and slot; the greyed after them)
  // (a charge on the leaf: a row that opens it another way struck CHARGE_ON_WHY: its plan's breach not the charge's, or the charge's
  // by the wrong man (your charge: the #2's "Breacher up" would place a second; his: yours would))
  const other = (r) => !!leaf && r.kind === 'bundle' && !r.off && !!r.variant?.breach && (r.variant.breach !== leaf.how || (/^drill:team:/.test(r.id) ? leaf.mine : !leaf.mine));
  for (let i = 0; i < out.length; i++) if (other(out[i])) out[i] = { ...out[i], off: CHARGE_ON_WHY, struck: true };
  const live = out.filter(r => !r.later), grey = out.filter(r => r.later);
  live.sort((a, b) => b.rung - a.rung || GROUP_RANK(a.group) - GROUP_RANK(b.group) || a.slot - b.slot);
  const rows = [...live];
  // (the rows set at no time: the breach and the entry's stance, the current first ("Push ⇄ Kick", "Fast ⇄ Careful"), and
  // from rung 4 the standing order "Engage: armed, my sector" (COMBAT §25.19.4, off by default: question 1))
  // (Push ⇄ Kick on a push door only: a pull door has no kick to set, see the header)
  // (v0.0.18: the ways the door and the kit allow, in turn: "Push ⇄ Kick", then "Kick ⇄ Pry", "Pry ⇄ Charge", "Charge ⇄ Push"; a pull
  // door with the halligan "Pull ⇄ Pry"; the default kit's rows as built)
  const ways = here.plan.door && openingState(state, here.plan.door) !== 'open' ? breachWays(state, pid, here.plan) : [];
  if (live.length && rung >= 2 && ways.length > 1) {
    const how = breachOf(state, here.plan, variant.breach, null, pid), i = Math.max(0, ways.indexOf(how)), other = ways[(i + 1) % ways.length];
    rows.push(variantRow('breach', `${cap(how)} ⇄ ${cap(other)}`, other));
  }
  // (the bang: "No bang ⇄ Flash" where the kit carries a G-11 and the room is still ahead)
  // (v0.0.19: the bangs the kit carries in turn, "No bang ⇄ Flash ⇄ Frag ⇄ Concussion"; a G-11 alone as built; the cook with a frag or a concussion)
  const bangs = ['none', ...BANGS.filter(b => kitHas(state, pid, BANG_NEED[b]))];
  if (live.length && rung >= 2 && bangs.length > 1 && !!here.plan.door && !pastThreshold(here.plan, actorOf(state, pid)?.x ?? 0, actorOf(state, pid)?.z ?? 0)) {
    const cur = bangs.includes(variant.bang) ? variant.bang : 'none', nx = bangs[(bangs.indexOf(cur) + 1) % bangs.length];
    if (bangs.length === 2 && bangs[1] === 'flash') { const on = cur === 'flash'; rows.push(variantRow('bang', on ? BANG_WORDS.on : BANG_WORDS.off, on ? 'none' : 'flash')); }
    else rows.push(variantRow('bang', `${BANG_NAMES[cur]} ⇄ ${BANG_NAMES[nx]}`, nx));
    if (cur === 'frag' || cur === 'conc') { const ck = variant.cook ?? cookDefault(rung); rows.push(variantRow('cook', ck === '2' ? COOK_WORDS.on : COOK_WORDS.off, ck === '2' ? '0' : '2')); }
  }
  if (live.length && rung >= 2) {
    const st = entryStance(rung, variant), other = st === 'assault' ? 'combat' : 'assault';
    rows.push(variantRow('stance', `${STANCE_NAMES[st]} ⇄ ${STANCE_NAMES[other]}`, other, { stance: other }));
  }
  if (live.length && rung >= ORDER_RUNG) {
    const on = orderOf(state).engage === 'armed';
    rows.push(variantRow('engage', on ? ORDER_WORDS.on : ORDER_WORDS.off, on ? 'off' : 'armed', { hint: ORDER_WORDS.hint }));
  }
  // (v0.0.19: a believed misfire on this door: the rows that walk up to it (any way but the charge's own, primed again from the
  // safe point) struck "wait N s" until MISFIRE_WAIT_MS has run from it (misfireWaitOf, devplan.js D3))
  const mw = here.plan.door ? misfireWaitOf(state, here.plan.door, ms) : null, mwHow = mw ? breachOf(state, here.plan, variant.breach, null, pid) : null;
  if (mw && mwHow !== 'charge' && mwHow !== 'cut') for (let i = 0; i < rows.length; i++) if (rows[i].kind === 'bundle' && !rows[i].off) rows[i] = { ...rows[i], off: mw, struck: true };
  // (v0.0.19: a live grenade in the hand strikes every bundle (liveInHand): its throw first)
  const all = liveInHand(state, pid) ? [...rows.filter(r => r.kind === 'variant'), ...[...rows.filter(r => r.kind !== 'variant'), ...grey].map(liveStruck)] : [...rows, ...grey];
  // (no lane's `five` on the rows: Breach is on 5 on every lane (groups.js SITUATIONS.door; the build sheet's §0 item 16))
  return all;
}
/**
 * Why the rifle cannot shoot a lock now, as the shooter believes it (v0.0.19), or null: the shot rows' own words (shooting.js
 * Fire's), 'a stoppage' (a click, a dud or a case in the port) or 'chamber empty', so IMMEDIATE ACTION or the reload comes first
 * (the panel's arrow to Fix). The safe is no reason: the breach takes it off itself. A click on the dummy at the lock left "Shoot
 * the lock" live, and each press fired nothing (the review of v0.0.19's K: five presses on seed 1037).
 */
export function shootGunWhy(state, pid) {
  const gunId = state.stop?.who === pid ? state.stop.gun : state.people?.[pid]?.kit?.worn?.sling ?? null, b = gunId ? beliefOf(state, gunId) : null;
  if (!b) return null;
  return b.stoppage || b.chamber === 'dud' || b.chamber === 'case' ? 'a stoppage' : b.chamber === 'empty' ? 'chamber empty' : null;
}
/**
 * Whether a door's charge is a believed misfire still inside its wait (v0.0.19, devplan.js D3): 'wait N s' (N the whole seconds
 * left of MISFIRE_WAIT_MS, counting down; the panel's counting badge), or null.
 */
export function misfireWaitOf(state, door, ms = state.clock.ms) {
  const c = door ? placedOn(state, door) : null, rec = c ? state.items[c.id] : null;
  if (!rec || rec.st !== 'misfire' || !Number.isFinite(rec.misAtMs)) return null;
  const left = rec.misAtMs + MISFIRE_WAIT_MS - ms;
  return left > 0 ? `wait ${Math.ceil(left / 1000)} s` : null;
}
/** A row's strike while a live grenade is in the hand (v0.0.19; the panel's arrow goes to Throw). */
export const LIVE_WHY = 'live grenade';
/**
 * Whether a person's hand holds a live grenade, its lever gone (v0.0.19): every row but its ways out (deviceRows: Throw it, Throw
 * it clear) is struck LIVE_WHY. A bundle begun with a cook and cut before its throw (a halt, a Stop) handed back a live grenade
 * with "Clear the room" still offered, which walked you in and burst it in your hand (the review of v0.0.19's K: 635 fragments).
 */
export const liveInHand = (state, pid) => { const h = handDeviceOf(state, pid); return h?.kind === 'grenade' && h.st === 'live'; };
const liveStruck = (r) => (r.off ? r : { ...r, off: LIVE_WHY, struck: true, later: true });
// (the beats that use a device in the hand: a grenade's arm and throw, a charge's place, a tool's force)
const DEVICE_BEATS = Object.freeze({ grenade: Object.freeze(['arm', 'throw']), charge: Object.freeze(['place']), tool: Object.freeze(['force']) });
const TOOL_HOW = Object.freeze({ pry: 'hal', ram: 'ram' });
// (the beats that open a door, and a grenade's cook and throw: the first of them in a drill's beats says which comes first)
const OPENS_OR_THROWS = Object.freeze(['door', 'force', 'breach', 'cook', 'throw']);
/** Whether a drill row uses the device in the hand: its beats arm or throw the grenade, place the charge, force with the tool. */
export const usesDevice = (h, row) => !!h && (row?.beats ?? []).some(b => DEVICE_BEATS[h.kind]?.includes(b.k));
/**
 * The house's rows with a device in a hand, not yet live (the hunt of v0.0.18; a live grenade's are liveInHand's): every
 * drill row that does not use it (usesDevice; the #2's tasks aside, his hands), and the door's singles that need the rifle or another
 * tool (Shoot the lock, Pry it, Ram it without that tool in hand), struck with devices.js handsFullWhy. The device's own rows
 * (deviceRows), the variants, the door's hand (push, pull, kick, read), the feet, the eyes and the stances stay live. With "Clear
 * the room" live and no device in its beats, an armed G-11 Backspaced at "Pin out." was carried into the room at high ready.
 */
export function handsStruck(state, pid, rows) {
  const h = handDeviceOf(state, pid);
  if (!h || (h.kind === 'grenade' && h.st === 'live')) return rows;
  const why = handsFullWhy(state, pid);
  const bar = (r) => (r.kind === 'bundle' && !/^drill:team:/.test(r.id) && !usesDevice(h, r)) || (r.kind === 'door' && (r.how === 'shoot' || (TOOL_HOW[r.how] && TOOL_HOW[r.how] !== (h.kind === 'tool' ? h.model : null))));
  // (the review of the hunt fixes: a grenade's drill whose next beat at a shut door is its cook or throw, before any beat that opens
  // the door (a Carry on after the door was shut by hand), struck "door shut" as Throw it is: "Finish it" named it)
  const shut = h.kind === 'grenade' && shutBetween(state, pid);
  const throwsShut = (r) => shut && r.kind === 'bundle' && ['cook', 'throw'].includes((r.beats ?? []).find(b => OPENS_OR_THROWS.includes(b.k))?.k);
  return rows.map(r => (r.off ? r : bar(r) ? { ...r, off: why, struck: true } : throwsShut(r) ? { ...r, off: DOOR_SHUT_WHY, struck: true } : r));
}
// (the scene's five (v0.0.19): house-kit.js fiveOf, set by the scene)
function laneFive() { return laneFive.fn ?? null; }
/** The scene's AT THE DOOR five for its lane (v0.0.19): fn(state) → 'breach' | null. */
export function useLaneFive(fn) { laneFive.fn = typeof fn === 'function' ? fn : null; }
/** The bangs' and the cook's variant words (v0.0.19). */
export const BANG_NAMES = Object.freeze({ none: 'No bang', flash: 'Flash', frag: 'Frag', conc: 'Concussion' });
export const COOK_WORDS = Object.freeze({ on: 'Cook 2 ⇄ Throw at once', off: 'Throw at once ⇄ Cook 2' });
// (a row the rung's own: its rung's, rung 2's three groups (COMBAT §25.19.2.3), from rung 3 the room's)
const leadOf = (B, rung) => (rung >= 3 ? B.id === 'room:clear' : rung === 2 ? ENTER_AND_CLEAR.groups.flat().includes(B.id) : B.rung === rung);
const GROUP_RANK = (g) => { const i = ['stack', 'door', 'room', 'shot', 'weapon', 'team'].indexOf(g); return i < 0 ? 9 : i; };
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
/** The movement stances in the words of what they trade (DESIGN.md's log, 2026-11-11: the user's "don't know what the assault <-> combat option is supposed to mean"; COMBAT §25.19.2): Careful (Combat), Fast (Assault). */
export const STANCE_NAMES = Object.freeze({ relaxed: 'Relaxed', combat: 'Careful', assault: 'Fast' });
/** The standing order's rung is contact.js's (COMBAT §25.19.4: offered from rung 4, off by default; question 1); its words. */
export const ORDER_WORDS = Object.freeze({ off: 'Engage: off ⇄ armed, my sector', on: 'Engage: armed, my sector ⇄ off', hint: 'By your order: a clean armed man in your sector is shot at the end of his take-in, no pause.' });
/** The standing order as set (COMBAT §25.19.4): the house's record { engage: 'off' | 'armed' }, off by default. */
export const orderOf = (state) => opOf(state)?.order ?? { engage: 'off' };
/**
 * The stop's variant at the door you are at now: the stance and the entry as set, the breach and the bang only at the door they
 * were chosen at (v0.0.18, the review's: a charge chosen at room 1 carried to room 3, where T alone fired a second one; COMBAT
 * §25.5.6, T never chooses a breach or a grenade).
 */
export function variantHere(state, pid = playerId(state)) {
  const v = state.stop?.variant ?? {};
  if (v.at === undefined || v.at === (doorNow(state, pid)?.door ?? null)) return v;
  const { breach, bang, at, ...rest } = v;
  return rest;
}
// (a variant's row: chosen, it sets the bundles' variant (state.stop.variant) at no time)
const variantRow = (key, label, to, o = {}) => ({ id: `drill:variant:${key}`, kind: 'variant', label, ms: 0, rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], cmd: false, skill: null, variant: { [key]: to }, ...o });
/** A variant row chosen (see bundleRows): the stop's variant set, at no time; the standing order kept on the house's record. Returns { ok, why }. */
export function setVariant(state, row, bus = null) {
  const S = state.stop;
  if (!S || !row?.variant) return { ok: false, why: 'no variant' };
  const { engage, ...rest } = row.variant;
  if (engage !== undefined) { const H = houseOf(state); if (!H) return { ok: false, why: 'no order here' }; H.order = { ...(H.order ?? {}), engage }; }
  if (Object.keys(rest).length) S.variant = { ...(S.variant ?? {}), ...rest };
  // (a breach or a bang is chosen at a door, for that door: kept with its door (at), and dropped at the next (variantHere))
  if (rest.breach !== undefined || rest.bang !== undefined) S.variant.at = doorNow(state, S.who)?.door ?? null;
  // (the entry's stance set says what it now is, in numbers, at every press (the play review of 2026-11-13: one press set
  // Careful at the tier one with no line; the user's remark of 2026-11-11 on the stances' words))
  if (rest.stance && S.who === playerId(state)) {
    const words = stanceWords.fn ? stanceWords.fn(state, S.who, rest.stance) : STANCE_NAMES[rest.stance];
    bus?.emit('line', { text: `The entry: ${words}.`, kind: 'note' });
  }
  return { ok: true, why: null };
}
const variantTag = (v) => { const t = [v?.entry, v?.breach, v?.stance, BANGS.includes(v?.bang) ? v.bang : null, (v?.bang === 'frag' || v?.bang === 'conc') && v?.cook ? `cook${v.cook}` : null].filter(Boolean); return t.length ? `@${t.join('+')}` : ''; };
/** The bang's variant row in words (v0.0.18). */
export const BANG_WORDS = Object.freeze({ off: 'No bang ⇄ Flash', on: 'Flash ⇄ No bang' });
/** The ways in a door allows a person now (v0.0.18): the swing's own, a kick on a push door, then the kit's (breach.js entryOptions' live ones), in that order. */
export function breachWays(state, pid, plan) {
  // (a charge on the shut leaf is the only way in (chargeOnLeaf): no cycle to another)
  const leaf = chargeOnLeaf(state, pid, plan);
  if (leaf) return [leaf.how];
  const sw = swingOf(state, plan) ?? 'push', out = [sw];
  if (kickableOf(state, plan)) out.push('kick');
  for (const h of KIT_HOWS) if (kitWayOk(state, pid, plan, h)) out.push(h);
  return out;
}
// (a kit row at the lane's door (see bundleRows), or null where it is not shown)
// (the ways in that force the leaf (the charge, the halligan, the ram), and why one carried is struck away from the door)
const FORCE_WAYS = new Set(['door:breach', 'door:pry', 'door:ram']);
export const STACK_FIRST_WHY = 'stack first';
/** Where you stand to work an inner door by hand (m; the hunt of v0.0.20, breach-4, my calls): INNER_PAST_M past its latch jamb along the wall, INNER_OFF_M off the leaf's face, out of a pull door's swing and 45 degrees off the lock for the ballistic breach (ballistic.js MUZZLE_REACH_M puts the muzzle on it). */
export const INNER_PAST_M = 0.25, INNER_OFF_M = 0.5, INNER_PAST_MAX_M = 1.0;
/** The point to stand at an inner door of the plan's room (see INNER_PAST_M), on the room's side: [x, z], or null for a doorway. */
export function innerStandOf(state, plan, id) {
  const o = openingOf(id), sw = o ? doorSwing(state, { ...plan, door: id }, plan.room) : null;
  if (!o || !sw) return null;
  const u = [sw.latchXZ[0] - sw.hingeXZ[0], sw.latchXZ[1] - sw.hingeXZ[1]], L = Math.hypot(u[0], u[1]) || 1;
  // (the room's side of the door's line: toward the plan's room's middle)
  const rect = (openingArea(id)?.rooms ?? []).find(r => r.id === plan.room)?.rect ?? null, mid = rect ? [(rect[0] + rect[2]) / 2, (rect[1] + rect[3]) / 2] : null;
  const n = o.axis === 'x' ? [0, Math.sign((mid?.[1] ?? o.at + 1) - o.at) || 1] : [Math.sign((mid?.[0] ?? o.at + 1) - o.at) || 1, 0];
  // (never in the door's own no-stop zone (zones.js zoneAt, the gauges' F4: a walk ends clear of every doorway): further along the
  // wall, a step of 0.05 m at a time, up to INNER_PAST_MAX_M (room 2's closet: 0.35 m past its latch jamb, 0.94 m off the leaf's middle))
  const at = (past) => [q(sw.latchXZ[0] + u[0] / L * past + n[0] * INNER_OFF_M, 1e-3), q(sw.latchXZ[1] + u[1] / L * past + n[1] * INNER_OFF_M, 1e-3)];
  const area = plan.area ?? state.places?.live?.area ?? null;
  let past = INNER_PAST_M;
  while (past < INNER_PAST_MAX_M && area && zoneAt(area, ...at(past))) past = q(past + 0.05, 1e-3);
  return at(past);
}
/**
 * The space behind an inner door seen as it opens (the hunt of v0.0.20, breach-4): the one who opened it inside the room it opens
 * from (the closet, 1.2 m deep, seen whole from room 2 once its leaf is back) or within DOOR_REACH_M of its leaf, his eyes in as the
 * leaf goes, written H.innerSeen[id] (the first time). shoothouse.js houseCall reads it: an inner door open with nobody of the room
 * at it as it opened is 'open', never 'cleared'. Only an inner door of the room you are in is written, so a lane's saves are as
 * before where none is opened.
 */
export function innerSeen(state, pid, o, atMs) {
  const H = houseOf(state), a = actorOf(state, pid), plan = plan0(state, playerId(state));
  if (!H || !a || !o || !(plan?.inner ?? []).includes(o.id) || (!pastThreshold(plan, a.x, a.z) && dist([a.x, a.z], doorMid(o)) > DOOR_REACH_M)) return;
  (H.innerSeen ??= {})[o.id] ??= atMs;
}
/** Why the breach is struck once your charges are fired (the hunt of v0.0.20, breach-10): a note, never the issue badge. */
export const CHARGE_SPENT = 'charge spent';
// (a charge of yours burst on the lane (R.house.bursts: an SC-1 or a BC-1 fired by you), so the breach's want is spent, not unissued)
const chargeSpentOf = (state, pid) => (houseOf(state)?.bursts ?? []).some(b => b.byId === pid && DEVICES[b.model]?.kind === 'charge');
/**
 * Where a tool of yours lies (the hunt of v0.0.20, breach-11): none of that model on you, one on the floor of the live area that
 * your scabbard takes back (toolHomeOf), as "halligan left at room 2" (the room whose door is nearest it), else null.
 */
export function toolLeftOf(state, pid, model) {
  if (devicesOf(state, pid).some(d => d.model === model && d.st !== 'gone')) return null;
  const area = state.places?.live?.area, H = houseOf(state);
  for (const site of Object.values(state.places?.sites ?? {})) for (const l of site?.items ?? []) {
    const rec = state.items?.[l.id];
    if (!rec || rec.model !== model || l.area !== area || !toolHomeOf(state, pid, l.id)) continue;
    const rooms = (H?.rooms ?? []).map((L, i) => { const o = L.door ? openingOf(L.door) : null; return o ? { n: i + 1, dM: dist([l.x, l.z], doorMid(o)) } : null; }).filter(Boolean).sort((a, b) => a.dM - b.dM);
    return `${DEVICES[model].word} left ${rooms.length ? `at room ${rooms[0].n}` : 'behind'}`;
  }
  return null;
}
function kitRow(state, pid, B, here, rung, variant, ms) {
  const plan = here.plan, a = actorOf(state, pid), me = a ? [a.x, a.z] : null, o = plan.door ? openingOf(plan.door) : null;
  const open = !o || openingState(state, o) === 'open', inside = a ? pastThreshold(plan, a.x, a.z) : false;
  const atDoor = !!me && (dist(me, stackOf(plan, 1)) <= STACK_NEAR_M || (!!o && dist(me, doorMid(o)) <= DOOR_REACH_M));
  // (the breach's own rule (groupApplies, as built) for the ways in; the flash at the door shut or open)
  // (the flash only while the room is still ahead: never from the doorway, never once you are in)
  const ahead = !here.rec || !here.rec.state || here.rec.state === 'ahead' || here.rec.state === 'stacked' || here.rec.state === 'open';
  const bangRow = /^door:(flash|frag|conc)$/.test(B.id);
  const base = { id: `drill:${B.id}${variantTag(variant)}>${here.door}`, kind: 'bundle', group: B.group, slot: B.slot, rung: B.rung, door: here.door, bundle: B.id, cmd: false, skill: null, carefulMs: null, single: true };
  const struck = (off, label = B.label, more = {}) => ({ ...base, label, ms: null, rushMs: null, odds: null, routine: true, off, struck: true, subs: [], beats: [], seams: [], variant: {}, lanes: {}, lead: false, later: true, ...more });
  // (a way in the kit carries, short of the door: struck "stack first", never the panel's stand-in "not issued" (the
  // play review: on the breach, full, cut and mixed loadouts every door's first stop read "Breach: not issued" with the issue badge)
  if (o && !inside && !open && !atDoor && FORCE_WAYS.has(B.id) && kitNeeds(state, pid, B, plan.door)) return struck(STACK_FIRST_WHY);
  if (!o || inside || (bangRow ? !atDoor || !ahead || inFunnel(plan, a.x, a.z) : open || !groupApplies(state, pid, 'door:breach', here))) return null;
  const has = kitNeeds(state, pid, B, plan.door);
  // (v0.0.19: Shoot the lock only on a breaching lane, struck by why it cannot be fired (breach.js ballisticOk))
  if (B.id === 'door:shoot' && !has) { const w = ballisticOk(state, pid); return w && w !== NOT_ISSUED ? struck(w) : null; }
  if (!has) {
    // (the default kit's rows as built: the breach struck "no charge issued" at a push door; at a pull door Pry in its place)
    // (the hunt of v0.0.20: a charge you were issued and fired is "charge spent", a note and never the issue badge (breach-10: room 3's
    // Breach on 5 read "no charge issued" with the badge after the one SC-1 went on room 1); a tool you let go at an earlier door is
    // struck where it lies, "halligan left at room 2", where the row had vanished with nothing said (breach-11))
    const pull = swingOf(state, plan) === 'pull';
    if (B.id === 'door:breach' && !pull) return struck(chargeSpentOf(state, pid) ? CHARGE_SPENT : 'no charge issued', B.label, { rung: 2 });
    if (B.id === 'door:pry' || B.id === 'door:ram') { const left = toolLeftOf(state, pid, B.id === 'door:pry' ? 'hal' : 'ram'); if (left) return struck(left); }
    if (B.id === 'door:pry' && pull) return struck(NOT_ISSUED);
    return null;
  }
  // (struck by the swing: a charge or the ram on a pull door, "opens toward you")
  const how = kitHowAt(state, pid, plan, B);
  if (how && !kitWayOk(state, pid, plan, how)) return struck(how === 'shoot' ? NOT_LOCKED : KICK_PULL_WHY);
  if (how === 'shoot') { const w = shootGunWhy(state, pid); if (w) return struck(w); }
  // (v0.0.19: a tool walked up to a door whose charge is a believed misfire waits MISFIRE_WAIT_MS from it, counting down)
  if (how === 'pry' || how === 'ram') { const w = misfireWaitOf(state, plan.door, ms); if (w) return struck(w); }
  const p = planBundle(state, pid, B.id, { door: here.door, rung, variant: { ...variant, ...(how ? { breach: how } : {}) }, atMs: ms });
  if (!p) return null;
  const rushed = planBundle(state, pid, B.id, { door: here.door, rung, variant: { ...variant, ...(how ? { breach: how } : {}) }, atMs: ms, tempo: 'rushed' });
  return { ...base, label: B.label, ms: p.ms, rushMs: rushed?.ms ?? p.ms, odds: p.odds < 1 ? p.odds : null, routine: p.odds >= 1, off: null, struck: false,
    subs: p.beats.map(b => ({ id: b.key, label: b.key, ms: b.ms })), beats: p.beats.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), seams: [], variant: p.variant, lanes: laneCount(p.beats), lead: false };
}
// (v0.0.19, the team's rows at the lane's door (bundleRows; team.js taskWhy): "#2, bang it", "Breacher up: <way>" for each way
// his kit and the door allow (the first on TEAM 3, the rest TEAM's third level), "As you were" while a task of his is live)
function teamRows(state, pid, B, here, rung, ms) {
  const W = houseOf(state)?.two, plan = here.plan, o = plan?.door ? openingOf(plan.door) : null, a = actorOf(state, pid);
  if (!W?.pid || !o || pid !== playerId(state) || !a) return [];
  // (none where his kit carries nothing a task needs (no G-11, charge, halligan or ram): the standard loadout's rows are v0.0.18's,
  // as D1's kit rows hide there (the lead's call on the team's review, finding 10; struck "not issued" on a kit lane that lacks one))
  if (!['flashbang', 'charge', 'halligan', 'ram'].some(k => kitHas(state, W.pid, k, plan.door))) return [];
  const inside = pastThreshold(plan, a.x, a.z), shut = openingState(state, o) !== 'open', task = taskOf(state, here.door), sw = swingOf(state, plan) ?? 'push';
  const away = twoAway(state, ms) || !!(W.doing && !W.doing.beats), busy = !!(W.contact || W.eng || W.down);
  const s0 = stackOf(plan, 1), g = giveOf(plan, s0), c = g ? clipped(state, s0, g) : null, giveOk = !!c && dist(c, g) <= 0.02;
  const base = { kind: 'bundle', group: B.group, slot: B.slot, rung: B.rung, door: here.door, bundle: B.id, cmd: false, skill: null, carefulMs: null, single: true, lead: false };
  const row = (id, label, why, variant) => {
    if (why) return { ...base, id, label, ms: null, rushMs: null, odds: null, routine: true, off: why, struck: true, subs: [], beats: [], seams: [], variant: {}, lanes: {}, later: true };
    const p = planBundle(state, pid, B.id, { door: here.door, rung, variant, atMs: ms });
    if (!p) return null;
    return { ...base, id, label: p.label, ms: p.ms, rushMs: p.ms, odds: null, routine: true, off: null, struck: false, subs: p.beats.map(b => ({ id: b.key, label: b.key, ms: b.ms })), beats: p.beats.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), seams: [], variant: p.variant, lanes: laneCount(p.beats) };
  };
  const m = { away, busy, shut, inside, giveOk, task };
  if (B.task === 'belay') return task ? [row(`drill:${B.id}>${here.door}`, B.label, taskWhy(state, { ...m, kind: 'belay' }), {})].filter(Boolean) : [];
  if (B.task === 'bang') return [row(`drill:${B.id}>${here.door}`, B.label, taskWhy(state, { ...m, kind: 'bang', has: kitHas(state, W.pid, 'flashbang') }), { bang: 'flash' })].filter(Boolean);
  // (no cut of his (the review of v0.0.19 asked for "Breacher up: cut"): the BC-1's blast on your give line is 260 kPa at room 1's
  // latch and 118 kPa at room 2's hinges (the SC-1's 23 kPa), so the cutting charge stays yours, "Breach (explosive)" from its safe point)
  const ways = [['charge', 'charge', DEVICES.sc1.on], ['pry', 'halligan', DEVICES.hal.force.on], ['ram', 'ram', DEVICES.ram.force.on]].filter(([, need]) => kitHas(state, W.pid, need, plan.door));
  if (!ways.length) return [row(`drill:${B.id}>${here.door}`, 'Breacher up', taskWhy(state, { ...m, kind: 'breach', has: false }), {})];
  return ways.map(([how, , on]) => row(`drill:${B.id}@${how}>${here.door}`, B.label.replace('{how}', how), taskWhy(state, { ...m, kind: 'breach', has: true, toward: !on.includes(sw) }), { breach: how })).filter(Boolean);
}
// (whether a row applies where the lane stands: the stack rows outside before the door is open, In at the door, Dominate
// inside, the room's row while the room is ahead of you)
function groupApplies(state, pid, id, here) {
  const open = here.plan.door ? openingState(state, here.plan.door) === 'open' : true, a = actorOf(state, pid), inside = a ? pastThreshold(here.plan, a.x, a.z) : false;
  const ahead = !here.rec || !here.rec.state || here.rec.state === 'ahead' || here.rec.state === 'stacked';
  const me = a ? [a.x, a.z] : null, o = here.plan.door ? openingOf(here.plan.door) : null;
  const stacked = !!me && dist(me, stackOf(here.plan, 1)) <= STACK_NEAR_M, atDoor = stacked || (!!me && !!o && dist(me, doorMid(o)) <= DOOR_REACH_M && latchSideOk(state, here.plan, me));
  if (id === 'room:clear') return ahead || !inside;
  if (id === 'stack:point') return !open && !inside && !stacked && !!here.plan.door;
  if (id === 'door:breach') return !open && !inside && atDoor;
  // (In: from the door, never from down the hall: the door is its first beat, the hand on the leaf)
  // (v0.0.19: and from the give line while your #2 works the door (team.js taskOf): your entry waits on his work)
  if (id === 'room:in') return !inside && (atDoor || (open && !!here.plan.door) || !here.plan.door || !!taskOf(state, here.door));
  if (id === 'room:dominate') return inside;
  return false;
}
/**
 * The singles in the house (see the header), the panel's shape: Stack up, the door's rows, Watch, Look, Move,
 * Hold it, "Clear!", Mark, the stances. Each { id, kind, label, ms, beats?, off?, warn? }.
 */
export function singleRows(state, pid = playerId(state), ms = state.clock.ms) {
  const here = doorNow(state, pid), a = actorOf(state, pid);
  if (!here || !a) return [];
  const sk = skillsOf(state, pid), rung = rungOf(state, pid, 'room'), out = [], plan = here.plan, me = [a.x, a.z];
  const row = (id, kind, label, ms0, o = {}) => ({ id, kind, label, ms: Math.round(ms0), rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], cmd: false, skill: null, door: here.door, group: SINGLE_GROUP[kind] ?? null, ...o });
  // (v0.0.18: a device left in the hands by a cut or a hand-back: its ways out, first (devices.js wayOut: never a dead end))
  out.push(...deviceRows(state, pid, row));
  // (v0.0.19: a live grenade on the floor near you (a slip at your feet): "Get clear", the run away from it (clearOf))
  const gc = clearOf(state, pid, a);
  if (gc) { const way = wayOf(state, [[a.x, a.z], gc.to]), legs = legsOf(state, pid), P = profileOf(pathLen(way), legs.walk[a.moveStance === 'assault' ? 'assault' : 'combat'], legs.pushMs2, legs.brakeMs2); out.push(row('move:clear', 'move', 'Get clear of the grenade', P.T * 1000, { to: gc.to, path: way, group: 'body' })); }
  const inside = pastThreshold(plan, a.x, a.z), stack = stackOf(plan, 1), stacked = dist(me, stack) <= STACK_NEAR_M;
  const open = plan.door ? openingState(state, plan.door) === 'open' : true;
  if (!inside && !stacked && !(here.rec && here.rec.state === 'entered')) {
    const p = planBundle(state, pid, 'stack:up', { door: here.door, rung, atMs: ms, variant: variantHere(state, pid) });
    if (p) out.push(row(`drill:stack:up>${here.door}`, 'bundle', p.label, p.ms, { beats: p.beats.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), bundle: 'stack:up', single: true, group: 'stack', slot: 0, reorg: p.reorg }));
  }
  // (the door's rows: by its swing, a lock striking push and pull, a pull door's kick struck "opens toward you"; within reach of
  // its middle (the user, 2026-11-15: a door's swing "should affect our options for entry"))
  const o = plan.door ? openingOf(plan.door) : null;
  if (o && !open && dist(me, doorMid(o)) <= DOOR_REACH_M) {
    const sw = doorSwing(state, plan), how = sw?.how ?? 'push', locked = lockedOf(state, o.id), t = doorS(sk.wh, how, rung, o.openS ?? DOOR_S);
    // (a pull door is opened from its latch side, the leaf swinging away toward the hinge: from the hinge side it would swing onto
    // you and stand across your way in, so there it is struck with the side to go to, and Stack up takes you there)
    const side = latchSideOk(state, plan, me) ? null : 'from the latch side';
    // (the hunt of v0.0.18: a charge on the leaf strikes the door's hand (breach.js CHARGE_ON_WHY): its row finishes the breach)
    const charged = placedOn(state, o.id) ? CHARGE_ON_WHY : null, kr = kickRow(state, pid, row, o, sk, rung, sw, { group: 'door', slot: 2 });
    out.push(row(`door:${how}>${o.id}`, 'door', `${MUSCLE['door:open'].label}: ${how}`, t.ms, { off: locked ? 'locked' : side ?? charged, how, group: 'door', slot: 1, swing: swingNote(sw) }));
    out.push(charged && !kr.off ? { ...kr, off: charged } : kr);
    if (!opOf(state)?.read?.[o.id]) out.push(row(`door:read>${o.id}`, 'door', MUSCLE['door:read'].label, READ_S * paceOf(sk.awr) * 1000, { how: 'read', group: 'door', slot: 0, words: sw?.words ?? null }));
  }
  // (the inner doors the plan does not take, from inside: Hold it (the #2's muzzle on it), and its own rows, a lock striking push and pull)
  // (in the doorway with the door open too: from rung 3 the eyes sweep the sector while the feet are still in the door, so the
  // bundle asks "Hold it or clear it?" from there (the fixer's of 0.0.12: asked where the panel had no Hold it, T walked on))
  const atDoor = inside || (open && !!plan.door && inFunnel(plan, a.x, a.z));
  for (const id of plan.inner ?? []) {
    const io = openingOf(id), held = houseOf(state)?.two?.hold === id;
    if (!io || !atDoor) continue;
    out.push(row(`door:hold>${id}`, 'door', 'Hold it', 0, { off: held ? 'held' : null, how: 'hold', group: 'room' }));
    if (openingState(state, io) === 'open') continue;
    // (read from the room it is seen from: "Push door, hinge left." for room 2's closet, its kick live only where it is a push)
    const sw = doorSwing(state, { ...plan, door: id }, plan.room), how = sw?.how ?? 'push', t = doorS(sk.wh, how, rung, io.openS ?? DOOR_S);
    // (the muzzle on the lock (the hunt of v0.0.20, breach-4): from across the room Shoot the lock walks you to the door's latch side
    // first (innerStandOf), the walk in the row's time, never fired from 5.5 m off as if there. Open, Kick and Pry it stay where you
    // stand (v0.0.20's, the gauges' fuzz lanes held to their paths); a door so opened from off its leaf is not seen into, and the
    // room's "Clear!" reads it 'open', a fault (innerSeen))
    const st = innerStandOf(state, plan, id), walk = st && dist(me, st) > STACK_NEAR_M ? wayOf(state, [me, st]) : null;
    const wMs = walk ? (() => { const legs = legsOf(state, pid); return profileOf(pathLen(walk), legs.walk.combat, legs.pushMs2, legs.brakeMs2).T * 1000; })() : 0;
    const walkOf = (r) => (walk && !r.off ? { ...r, ms: Math.round(r.ms + wMs), walk } : r);
    out.push(row(`door:${how}>${id}`, 'door', `${MUSCLE['door:open'].label}: ${how}`, t.ms, { off: lockedOf(state, id) ? 'locked' : null, how, inner: true, group: 'door', swing: swingNote(sw) }));
    out.push(kickRow(state, pid, row, io, sk, rung, sw, { inner: true, group: 'door' }));
    // (v0.0.18: the halligan on an inner door, either swing, the lock's DC less its dcK (the closet: 14 − 4 = 10), when the kit carries it)
    if (kitHas(state, pid, 'halligan')) {
      const f = forceMs(rollerOf(state, pid), 'hal', pouchedOf(state, pid, 'hal')?.face ?? 'back'), openMs = Math.round((io.openS ?? DOOR_S) * 1000);
      out.push(row(`door:pry>${id}`, 'door', 'Pry it', Math.max(f.ms, f.handMs + openMs), { how: 'pry', inner: true, group: 'door', odds: oddsOf(sk.fit, forceDc(state, id, 'hal')), skill: 'fitness', routine: false, handMs: f.handMs, passMs: f.handMs + openMs }));
    }
    // (v0.0.19: the R-7 on the lock, on a breaching lane only (breach.js BALLISTIC_LANES): live on a door locked, struck "not locked")
    const bWhy = ballisticOk(state, pid);
    if (bWhy !== NOT_ISSUED) out.push(walkOf(row(`door:shoot>${id}`, 'door', MUSCLE['door:shoot'].label, shootMs(state, pid, how), { how: 'shoot', inner: true, group: 'door', off: bWhy ?? shootGunWhy(state, pid) ?? (lockedOf(state, id) ? null : NOT_LOCKED), skill: 'marksmanship', routine: false })));
  }
  // (Watch a hot spot from outside; Look at one inside)
  const muzzleYaw = a.headRad ?? 0;
  for (const h of plan.hot ?? []) {
    const turn = Math.abs(wrap(bearing(me, hotXZ(h)) - muzzleYaw)) / D2R, name = hotName(plan, h);
    if (!inside) out.push(row(`watch:${h.id}`, 'watch', `Watch: ${name}`, watchS(sk.wh, turn) * 1000, { hot: h.id, off: a.watch?.hotId === h.id ? 'watching' : null }));
    else out.push(row(`look:${h.id}`, 'look', `Look: ${name}`, lookS(sk.awr, turn) * 1000, { hot: h.id }));
  }
  // (Move: inside a room to the slot's point; along the hall to its end; never through a door's plane below rung 2 (see the header))
  if (inside) {
    // (your point: your side's (v0.0.19, team.js sideOf: your #2's once you took his side and he took yours))
    const pt = pointOf(plan, sideOf(state, here.door, 1)), legs = legsOf(state, pid), way = wayOf(state, [me, pt]), P = profileOf(pathLen(way), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
    if (dist(me, pt) > STACK_NEAR_M) out.push(row('move:point', 'move', 'Move to your point', P.T * 1000, { to: pt, path: way }));
    // (a far leg not yet seen: the walk up to where it is (the plan's far path from where you stand), by a press as by the keys)
    const far = plan.far, farEnd = far?.path?.at(-1) ?? null;
    if (far && !here.rec?.covered?.[far.hot] && dist(me, farEnd) > STACK_NEAR_M) {
      const fp = wayOf(state, pathFrom(far.path, me)), FP = profileOf(pathLen(fp), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
      // (in the plan's own words, "Move: the back room" in the twin (A's chunks, plan.far.words); the far leg's elsewhere)
      out.push(row('move:far', 'move', `Move: ${far.words ?? 'the far leg'}`, FP.T * 1000, { to: farEnd, path: fp }));
    }
    out.push(row('call:clear', 'call', 'Clear!', (rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000, { say: 'clear' }));
    out.push(row('mark', 'mark', 'Mark the room', MARK_S * paceOf(sk.wh) * 1000));
  } else if (here.door === 'hall') {
    const pt = pointOf(plan, 1), legs = legsOf(state, pid), way = pt ? wayOf(state, [me, pt]) : null, P = way ? profileOf(pathLen(way), legs.walk.combat, legs.pushMs2, legs.brakeMs2) : null;
    if (pt && dist(me, pt) > STACK_NEAR_M) out.push(row('move:hallEnd', 'move', 'Move to the hall\'s end', P.T * 1000, { to: pt, path: way }));
    out.push(row('call:clear', 'call', 'Clear!', (rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000, { say: 'clear' }));
  }
  // (the build sheet v0.0.20 item 12: still inside a room called clear that is not the leg's own (the hall's leg may hold room 3): "Coming out!" for
  // a walk out by the keys (DRILL_IN 6,
  // the `out` kind's words), and Mark the room where its mark is yours (your #2 not the last man, gun down or on a task: DRILL_IN 5))
  const outOf = clearedRoomAt(state, me[0], me[1]);
  if (outOf && outOf.door !== here.door) {
    if (!inside && markYoursOf(state, pid)) out.push(row('mark', 'mark', 'Mark the room', MARK_S * paceOf(sk.wh) * 1000));
    out.push(row('call:out', 'call', SAY_ROOM.out, (rung >= 3 ? CALL_FLOW_S : CALL_S) * 1000, { say: 'out' }));
  }
  // (the stances: the others than the body's)
  const now = a.moveStance ?? 'relaxed';
  // (named for what they trade (the user's remark of 2026-11-11): Careful is Combat, Fast is Assault; the effect, shooting.js's hint)
  for (const s of MOVE_STANCES) if (s !== now) out.push(row(`gait:${s}`, 'gait', STANCE_NAMES[s], 0, { gait: s, stance: s, group: 'body' }));
  // (v0.0.19: a live grenade in the hand strikes every row but its ways out (liveInHand))
  if (liveInHand(state, pid)) return out.map(r => (/^dev:/.test(r.id) || r.off ? r : { ...r, off: LIVE_WHY }));
  return out;
}
// (a tool lying within DOOR_REACH_M of pid with a scabbard of his to take it: { id, model }, the nearest, or null)
function toolNearOf(state, pid) {
  const a = actorOf(state, pid), area = state.places?.live?.area;
  if (!a) return null;
  let best = null;
  for (const site of Object.values(state.places?.sites ?? {})) for (const l of site?.items ?? []) {
    const rec = state.items?.[l.id];
    if (!rec || l.area !== area || DEVICES[rec.model]?.kind !== 'tool') continue;
    const dM = Math.hypot(l.x - a.x, l.z - a.z);
    if (dM <= DOOR_REACH_M && (!best || dM < best.dM) && toolHomeOf(state, pid, l.id)) best = { id: l.id, model: rec.model, dM };
  }
  return best;
}
// (pid's container that takes a tool and has room: the scabbard on the back)
function toolHomeOf(state, pid, id) {
  const kind = state.items[id]?.type ?? DEVICES[state.items[id]?.model]?.kind;
  return KIT.containersOf(state, pid).find(c => { const C = KIT.CONTAINERS[state.items[c].model]; return C?.fits?.includes(kind) && (state.items[c].holds ?? []).length < C.holds; }) ?? null;
}
/** The throw's strike at a shut door. */
export const DOOR_SHUT_WHY = 'door shut';
// (the door a throw from here would go through is shut and pid stands on its stack side: the throw through it is no throw)
function shutBetween(state, pid, plan = doorNow(state, pid)?.plan ?? null) {
  const a = actorOf(state, pid);
  return !!plan?.door && !!a && openingState(state, plan.door) !== 'open' && !pastThreshold(plan, a.x, a.z);
}
/**
 * The rows of a device in the hands (v0.0.18; see the header): an armed grenade "Throw it" (into the room ahead, its fuse
 * running from the release) and "Pin back in"; a grenade held "Back in the pouch"; a tool "Let it go"; with the hands empty, a
 * tool lying within reach "Pick up the halligan" (how 'pickup'). Each a 'door' row
 * (startSingle) whose how names it: 'throw', 'repin', 'stow', 'drop', 'pickup'.
 */
export function deviceRows(state, pid, row) {
  const h = handDeviceOf(state, pid), roller = rollerOf(state, pid), out = [];
  if (!h) {
    // (a tool let go at a door (the force's end), within reach and with its scabbard empty: "Pick up the halligan" (the review of
    // 2026-11-16: dropped at room 2, the closet could never be pried))
    const t = toolNearOf(state, pid);
    if (t) out.push(row('dev:pickup', 'door', `Pick up the ${DEVICES[t.model].word}`, deviceMs(roller, 'tool:pickup', { face: 'back' }), { how: 'pickup', group: 'door', dev: t.id }));
    return out;
  }
  const D = DEVICES[h.model];
  if (h.kind === 'grenade' && (h.st === 'armed' || h.st === 'live')) {
    // (the hunt of v0.0.18: struck "door shut" from the stack side of a shut door (shutBetween): a G-11 Backspaced at "Pin
    // out." went through the closed leaf and burst in room 1; Pin back in, Throw it clear, or the drill's row that opens the door first)
    out.push(row('dev:throw', 'door', `Throw it: ${D.short}`, DEVICE_ACTIONS['gren:throw'].s * 1000, { how: 'throw', group: 'door', dev: h.id, off: shutBetween(state, pid) ? DOOR_SHUT_WHY : null }));
    if (h.st === 'armed') out.push(row('dev:repin', 'door', 'Pin back in', deviceMs(roller, 'gren:repin') + deviceMs(roller, 'gren:stow'), { how: 'repin', group: 'door', dev: h.id }));
    // (v0.0.19: a live grenade, its lever gone, has only its throw and "Throw it clear" (devplan.js guard D1))
    else out.push(row('dev:gren:clear', 'door', 'Throw it clear', DEVICE_ACTIONS['gren:clear'].s * 1000, { how: 'clear', group: 'door', dev: h.id }));
    // (v0.0.19: an armed grenade that cooks, "Cook 2": the lever let go and the count held (the cook beat, Weapon handling DC 6),
    // then only its throw (liveInHand); where the believed fuse keeps COOK_MARGIN_MS past the count and the throw (devices.js cookOk))
    // (struck "door shut" as the throw is: a count begun at a shut door leaves only "Throw it clear")
    if (h.st === 'armed' && D.cook && cookOk(h.model, 2000)) out.push(row('dev:gren:cook:2', 'door', 'Cook 2', DEVICE_ACTIONS['gren:cook:2'].s * 1000, { how: 'cook', group: 'door', dev: h.id, want: 2000, off: shutBetween(state, pid) ? DOOR_SHUT_WHY : null }));
  } else if (h.kind === 'grenade' || h.kind === 'charge') out.push(row('dev:stow', 'door', 'Back in the pouch', deviceMs(roller, 'gren:stow'), { how: 'stow', group: 'door', dev: h.id }));
  else if (h.kind === 'tool') out.push(row('dev:drop', 'door', `Let it go: the ${D.word}`, DEVICE_ACTIONS['tool:drop'].s * 1000, { how: 'drop', group: 'door', dev: h.id }));
  return out;
}
/**
 * Before GO in the house (the tower's MAKE READY: on your mark, gait Combat; shoothouse.js houseWant), the rows that put the
 * body right in the mode: Back on your mark (a move to the lane's start, routed) when off it by more than the course's
 * stackM, and Careful (Combat) when the gait is another. The play review of 2026-11-13: off the mark, T entered the mode,
 * nothing in it walked you back, X left it and T entered it again, 40 times. The panel's shape, as singleRows'.
 */
export function preGoRows(state, pid = playerId(state), ms = state.clock.ms) {
  const a = actorOf(state, pid), H = houseOf(state);
  if (!a || !H || (H.goAtMs !== null && H.goAtMs !== undefined)) return [];
  const out = [], S0 = houseSpecOf(state).start, me = [a.x, a.z], to = [S0.x, S0.z];
  const row = (id, kind, label, ms0, o = {}) => ({ id, kind, label, ms: Math.round(ms0), rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], cmd: false, skill: null, door: null, group: SINGLE_GROUP[kind] ?? null, ...o });
  if (dist(me, to) > COURSES.house.stackM) {
    const legs = legsOf(state, pid), way = wayOf(state, [me, to]), P = profileOf(pathLen(way), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
    out.push(row('move:mark', 'move', 'Back on your mark', P.T * 1000, { to, path: way }));
  }
  if ((a.moveStance ?? 'relaxed') !== 'combat') out.push(row('gait:combat', 'gait', STANCE_NAMES.combat, 0, { gait: 'combat', stance: 'combat', group: 'body' }));
  return out;
}
/** On a pull door the hand must be on its latch side: half the door's width or less off its middle toward the latch, or past it (see the header); any place on a push door. */
export function latchSideOk(state, plan, at) {
  const sw = plan?.door ? doorSwing(state, plan) : null;
  if (!sw || sw.how !== 'pull' || !at) return true;
  const o = openingOf(plan.door), m = doorMid(o), ux = sw.latchXZ[0] - sw.hingeXZ[0], uz = sw.latchXZ[1] - sw.hingeXZ[1], L = Math.hypot(ux, uz) || 1;
  return ((at[0] - m[0]) * ux + (at[1] - m[1]) * uz) / L >= 0;
}
// (a door's Kick row: live on a push door with its odds (Fitness against the door's DC), struck KICK_PULL_WHY on a pull door)
function kickRow(state, pid, row, o, sk, rung, sw, more = {}) {
  const t = doorS(sk.wh, 'kick', rung, o.openS ?? DOOR_S), kick = sw?.kickable !== false;
  return row(`door:kick>${o.id}`, 'door', MUSCLE['door:kick'].label, t.ms, { odds: kick ? kickOdds(state, pid, o.id) : null, routine: !kick, skill: kick ? 'fitness' : null, how: 'kick', off: kick ? null : sw?.kickWhy ?? KICK_PULL_WHY, ...more });
}
// (what a door's row carries of its swing for the face and the tests: { how, hinge, words })
const swingNote = (sw) => (sw ? { how: sw.how, hinge: sw.hinge, words: sw.words } : null);
// (the singles' groups on the panel (COMBAT §25.19.2: stack, door, room; the stances BODY's))
const SINGLE_GROUP = Object.freeze({ bundle: 'stack', door: 'door', watch: 'room', look: 'room', move: 'room', call: 'room', mark: 'room', gait: 'body' });
// (a hot spot's name in the panel's words)
const HOT_WORDS = Object.freeze({ 'behind the door': 'behind the door', corner: 'the corner', 'far leg': 'the far leg' });
/** A corner this deep past the door's plane or less is a near one, metres; this far or less off the door's middle is straight ahead (my calls). */
export const HOT_NEAR_M = 1.5, HOT_AHEAD_M = 0.3;
function hotName(plan, h) {
  // (the far hot spot in its plan's words, "the back room" in the twin; "the far leg" elsewhere)
  if (h.why === 'far leg' && plan.far?.words) return plan.far.words;
  if (h.why && h.why !== 'corner') return HOT_WORDS[h.why] ?? h.why;
  // (as seen from the door looking in: its depth past the plane, and its side of the door's middle; the plane's normal into
  // the room is the facing, and left of it is (f.z, -f.x) with x east and z south)
  const P = plan.plane, [hx, hz] = hotXZ(h);
  if (P && plan.door) {
    const f = P.axis === 'x' ? [0, P.into] : [P.into, 0], mid = (P.a + P.b) / 2;
    const c = P.axis === 'x' ? [mid, P.at] : [P.at, mid], dx = hx - c[0], dz = hz - c[1];
    const depth = dx * f[0] + dz * f[1], side = dx * f[1] - dz * f[0];
    const near = depth <= HOT_NEAR_M ? 'near' : 'far';
    return Math.abs(side) <= HOT_AHEAD_M ? `the ${near} wall` : `the ${near} ${side > 0 ? 'left' : 'right'} corner`;
  }
  // (a leg with no door (the hall): by its place along the walk from #1's stack to his point, its side of that line as
  // walked (left of a facing f is (f.z, -f.x)), so two spots at the hall's end read apart (the fixer's of 0.0.12: both
  // read "the far right corner"))
  const st = stackOf(plan, 1), pt = pointOf(plan, 1);
  if (!st || !pt) return 'the far end';
  const f = [pt[0] - st[0], pt[1] - st[1]], L = Math.hypot(f[0], f[1]) || 1, dx = hx - st[0], dz = hz - st[1];
  const along = (dx * f[0] + dz * f[1]) / L, side = (dx * f[1] - dz * f[0]) / L;
  const end = along >= L / 2 ? 'the far end' : 'the near end';
  return Math.abs(side) <= HOT_AHEAD_M ? end : `${end}, ${side > 0 ? 'left' : 'right'}`;
}

/**
 * Start a bundle row for the player in stop motion (see the header): rowId 'drill:<bundle>[@<variant>]><door>' or a
 * single's beats (row.beats). Returns { ok, why }.
 */
export function startBundle(state, bus, pid, rowId, { tempo = 'normal', row = null } = {}) {
  const S = state.stop;
  if (!S || S.mode !== 'stop') return { ok: false, why: 'not in the mode' };
  const m = /^drill:([a-z:-]+?)(?:@([a-z0-9+]+))?(?:>(.+))?$/.exec(rowId ?? '');
  if (!m) return { ok: false, why: 'no such bundle' };
  const B = bundleDef(m[1]);
  if (!B) return { ok: false, why: 'no such bundle' };
  if (!offered(state, pid, B)) return { ok: false, why: B.rung > rungOf(state, pid, 'room') ? 'not taught' : 'by hand first' };
  const variant = { ...variantHere(state, pid) };
  for (const t of (m[2] ?? '').split('+').filter(Boolean)) { if (['cross', 'hook'].includes(t)) variant.entry = t; else if (['push', 'pull', 'kick', 'pry', 'ram', 'charge', 'cut', 'shoot'].includes(t)) variant.breach = t; else if (['assault', 'combat'].includes(t)) variant.stance = t; else if (t === 'none' || BANGS.includes(t)) variant.bang = t; else if (t === 'cook2' || t === 'cook0') variant.cook = t.slice(4); }
  // (a kit row's own way in (v0.0.18): the breach the charge (or the BC-1 where only it fits the door), Pry the halligan, Ram the ram)
  if (kitHowOf(B)) variant.breach = kitHowAt(state, pid, (m[3] ? lanePlanOf(state)?.plans?.[m[3]] : null) ?? doorNow(state, pid)?.plan ?? null, B);
  const rung = rungOf(state, pid, 'room'), plan = planBundle(state, pid, B.id, { door: m[3] ?? null, rung, variant, atMs: state.clock.ms, tempo });
  if (!plan) return { ok: false, why: 'no door' };
  return beginBeats(state, bus, pid, { step: rowId, bundle: B.id, plan, tempo, label: plan.label });
}
// (a beat doing set on the player's stop and begun: 'stop' released, the start fact, the first beats at the clock)
function beginBeats(state, bus, pid, { step, bundle, plan, tempo, label }) {
  const S = state.stop, now = state.clock.ms;
  const d = { who: pid, step, kind: 'bundle', bundle, tempo, rung: plan.rung, slot: plan.slot, ...(plan.side ? { side: plan.side } : {}), door: plan.door, variant: plan.variant, beats: plan.beats.map(b => ({ ...b, st: 'wait', fromMs: null, untilMs: null })),
    lanes: {}, subs: [], fromMs: now, atMs: now, untilMs: now, untilPlanMs: now + plan.ms, seams: plan.seams ?? [], ...(label ? { label } : {}) };
  feetTo(state, now);
  // (a new bundle or single in place of a suspended flow: the flow's rest is dropped, the new doing planned from the body)
  S.doing = d; S.phase = 'act'; S.queue = []; S.carry = null; S.feet = null; S.flow = null;
  // (the stop's why reads what was begun last (cqb.js stopLead): kept in the house only, so every other scene's bytes stand)
  if (houseOf(state)) S.last = { step, bundle: bundle ?? null, door: plan.door ?? null, atMs: now };
  const me = actorOf(state, pid);
  if (me?.watch && !String(step).startsWith('watch:')) delete me.watch;
  // (a bundle or single begun with the rifle at the aim that moves or sweeps the eyes: the muzzle up first, as a carry's and the
  // flow's (2026-11-12, R3: the flow going on by itself replaced the carry that raised it; the corporal's Dominate, begun aimed
  // after his shot, swept his sector across his #2 on every seed: the gauges' F8, muzzle 100 in 100 lanes). The carry plans its own.
  if (step !== 'drill:carry' && !String(step).startsWith('watch:') && d.beats.some(b => b.k === 'move' || b.k === 'scan') && d.beats[0]?.k !== 'posture') upFirst(state, d, now);
  releaseTime(state, 'stop');
  bus?.emit('bundle', { phase: 'start', who: pid, id: step, beat: null, ch: null, atMs: now, label, ms: plan.ms });
  const r = advanceBeats(state, bus, d, now);
  if (r !== 'running') beatsDone(state, bus, d, r);
  return { ok: true, why: null };
}
// (the player's beat doing finished: choosing again, the rest as "Carry on" when it halted; suspended, the flow kept)
function beatsDone(state, bus, d, r) {
  const S = state.stop;
  if (!S || S.doing !== d) return;
  // (v0.0.19: suspended by a startle, it stays the doing, time running, and goes on by itself at its end (startleTick))
  if (r === 'suspended' && d.suspended?.why === 'startle') return;
  S.doing = null;
  S.phase = 'choose';
  if (r === 'suspended') {
    // (the flow suspended (see the header): kept whole on the stop, the choice made with time standing still; the pause's own
    // hold is contact.js's while a window is open, else this one; a man of the room up at "Clear!" is bracketed)
    S.flow = d; S.carry = null;
    if (d.suspended?.why === 'up') upPick(state, d, bus);
    if (!state.mind?.contact?.pending) holdTime(state, 'stop');
    return;
  }
  S.carry = r === 'halted' ? carryOf(d) : null;
  // (the halt said its own fact when it came (the stepper's); here the doing's end, halted or not)
  bus?.emit('bundle', { phase: 'end', who: d.who, id: d.step, beat: null, ch: null, atMs: d.untilMs, why: d.halt?.why ?? null });
  if (d.halt?.words) bus?.emit('line', { text: d.halt.words, kind: 'warn' });
  // (no hold inside a take-in's window: the window runs at 1:1 to its pause (contact.js))
  if (!state.mind?.contact?.pending) holdTime(state, 'stop');
}
// (a halted doing's rest as the panel's "Carry on" (see beatsDone), or null)
function carryOf(d) {
  if (!d.rest?.length) return null;
  // (a move cut where it stood leaves the rest of its path: the carry on, and a shot row fired moving on, take it from there)
  const paths = {};
  for (const b of d.beats) if (b.st === 'cut' && b.k === 'move' && b.prof) paths[b.key] = restPath(b, b.untilMs);
  return { from: d.step, bundle: d.bundle, door: d.door, rung: d.rung, variant: d.variant, beats: d.rest, why: d.halt?.why ?? null, words: d.halt?.words ?? null, paths };
}
// (a man of the room up at "Clear!": the bracket on him, your own corner's first, the last contact his (contact.js relook: a
// man the last pause did not take in has no rows and no line, and the honest T waited out the stall: 2026-11-12, R3's gauges,
// the tier one on seeds 1259 and 1333 with 1a's hands unseen after a challenge and 1b's pause after it))
function upPick(state, d, bus = null) {
  const S = state.stop, plan = planOf(state, d.beats.find(b => b.k === 'call' && b.st === 'wait')?.plan ?? d.door), two = !!houseOf(state)?.twoPid, ms = state.clock.ms;
  const up = plan ? upIn(state, plan.room, ms) : [], known = state.mind?.contact?.known ?? {};
  const mine = up.filter(t => !two || (ownerOf(state, t) ?? 1) === 1), T = mine.find(t => known[t.key] !== undefined) ?? mine[0] ?? up[0];
  if (!T) return;
  relook(state, bus, T.key, ms);
  S.pick = T.key; S.via = 'contact';
}
/** The men of your own corner up and facing that you know of (COMBAT §25.19.3.3's "a man still up"): the last contact's, and those of the room you are in seen and not forgotten. */
export function mineUp(state, ms = state.clock.ms) {
  const c = state.mind?.contact, L = c?.last, known = c?.known ?? {}, R = sessionOf(state), two = !!R?.house?.twoPid;
  const room = doorNow(state, playerId(state))?.plan?.room ?? null;
  return (R?.turners ?? []).filter(T => (!two || (ownerOf(state, T) ?? 1) === 1) && ['threat', 'armoured', 'hostage'].includes(T.face) && (T.stoppedAtMs === null || T.stoppedAtMs === undefined)
    && facingOf(T, ms) >= 0.5 && (L?.ids?.includes(T.key) || (room && T.room === room && known[T.key] !== undefined)));
}

// ---- the startle (v0.0.19, see the header) ----

// (a running move put back to wait where the body stands: cut there (its speed going on into the brake), the rest of its path
// kept, so it is planned again from the body when the doing goes on)
function pauseMove(state, bus, d, b, ms) {
  const a = actorOf(state, d.who), at = Number.isFinite(a?.locoMs) && a.locoMs >= (b.fromMs ?? ms) ? Math.min(a.locoMs, ms) : ms;
  const rest = restPath(b, at);
  kindOf('move')?.end?.(state, bus, d, b, { cut: true, atMs: ms });
  b.path = rest; b.st = 'wait'; b.after = []; b.fromMs = null; b.untilMs = null; b.paused = true;
  // (its glyph taken back, so its restart writes its own: the lanes show each beat once)
  const lane = d.lanes?.[b.ch]?.findLastIndex?.(x => x.key === b.key);
  if (lane !== undefined && lane >= 0) d.lanes[b.ch].splice(lane, 1);
}
// (a beat doing held by a startle at ms: suspended 'startle', its running moves and looks paused where they stand; one suspended
// or asked to suspend already keeps its why, its moves paused. supp.js's "stop after the beat" is taken back: while a startle
// lasts every act is refused, so a stop asked in it is the startle's own (haltCommand), never the player's)
function startleHold(state, bus, d, ms) {
  if (!d?.beats || d.halt) return;
  delete d.stopAfter;
  if (!d.suspended && !d.suspendAsk) suspendFlow(state, bus, d, 'startle', ms);
  for (const b of d.beats) if (b.st === 'run' && b.k === 'move' && b.prof) pauseMove(state, bus, d, b, ms);
  pauseScans(d, ms);
}
/** Whether a beat doing is held by a startle (see the header). */
export const startleHeld = (d) => d?.suspended?.why === 'startle' || d?.suspendAsk?.why === 'startle';
/**
 * The player's flow under a startle at ms (see the header; contact.js contactLook calls it first, every lived tick): while he is
 * startled his doing and a flow beside a list step are held; at its end the doing goes on by itself, and a flow whose step has
 * ended is left suspended as the decision it is. Writes nothing when no startle is on or held.
 */
export function startleTick(state, bus, ms = state.clock.ms) {
  const S = state.stop, pid = playerId(state);
  if (!S || (!S.doing?.beats && !S.flow?.beats)) return;
  const on = startled(state, pid, ms);
  for (const d of [S.doing, S.flow]) {
    if (!d?.beats || d.who !== pid || d.halt) continue;
    if (on) { startleHold(state, bus, d, ms); continue; }
    if (!startleHeld(d)) continue;
    // (a flow whose list step is over: the choice is the player's, as flowAfter leaves it; else taken up again, its channel held)
    if (d === S.flow && d !== S.doing && !S.doing && d.suspended) { d.suspended = { why: 'decision', atMs: d.suspended.atMs }; continue; }
    resume(d, ms);
    bus?.emit('bundle', { phase: 'resume', who: d.who, id: d.step, beat: null, ch: null, atMs: ms, why: 'startle' });
  }
}

// ---- the flow (see the header) ----

/**
 * The steps that need the feet (COMBAT §25.19.3.1 item 3): chosen at a suspension they halt the flow, its rest "Carry on".
 * The challenge is the voice's, said on the way to the point (my call: the design lists it with Hold him, but halted it stood
 * the honest T in the doorway for its 1.2 s and earned the funnel fault, a fault by T: the gauges of 2026-11-12, F8).
 */
export const FLOW_FEET_KINDS = Object.freeze(new Set(['contact', 'stance', 'wait', 'breathe', 'leave']));
export const FLOW_VOICE_IDS = Object.freeze(new Set(['contact:challenge']));
/** Whether a list step chosen at a suspension runs inside the flow (on the hands, or the voice) or halts it (the feet's): st the panel's row, way a shot's feet. */
export const flowsWith = (st, way = null) => !!st && !st.needsFeet && (FLOW_VOICE_IDS.has(st.id) || !FLOW_FEET_KINDS.has(st.kind)) && !String(st.id).startsWith('stance:') && way !== 'stop' && way !== 'planted';
/** The player's suspended flow, or null. */
export const flowOn = (state) => (state.stop?.flow?.suspended ? state.stop.flow : null);
/**
 * A list step about to begin while a flow is suspended (shooting.js startStep, before the step's plan): taken up beside it
 * on the hands (stepper.js resume) or, a step that needs the feet, halted where it stands into "Carry on". Returns 'flow',
 * 'halted' or null (no flow).
 */
export function flowIn(state, bus, st, way = null) {
  const S = state.stop, F = flowOn(state);
  if (!F) return null;
  const now = state.clock.ms;
  if (flowsWith(st, way)) { resume(F, now, { ch: FLOW_VOICE_IDS.has(st.id) ? 'voice' : 'hands', step: st.id }); return 'flow'; }
  haltFlow(state, bus, F, 'contact', now);
  return 'halted';
}
// (a flow halted where it stands into "Carry on": its moves cut, the rest the panel's)
function haltFlow(state, bus, F, why, ms) {
  const S = state.stop;
  resume(F, ms);
  delete F.hold;
  haltDoing(state, bus, F, why, null, ms);
  advanceBeats(state, bus, F, ms);
  S.flow = null;
  S.carry = carryOf(F);
  bus?.emit('bundle', { phase: 'end', who: F.who, id: F.step, beat: null, ch: null, atMs: ms, why });
}
// (the flow beside a list step ended, halted or suspended on its own (stepper.js advance): kept as it is, the step's end decides)
function flowAdvanced(state, bus, F, r) { if (r === 'ended' || r === 'halted') F.over = r; }
/** Whether a man of your own corner is up and facing that you know of (mineUp; the #2's are his: COMBAT §25.19.4's #2 sector rule's part the flow reads). */
export const ownUp = (state, ms = state.clock.ms) => mineUp(state, ms).length > 0;
/**
 * A list step ended with the flow beside it (shooting.js afterEnd, see the header): why the step's end ('end', 'stop' (the
 * gun), 'halt', 'cut'), owed whether a decision is owed whatever the step (a window open, a reflex card to come). Returns
 * true when the drill went on by itself (the flow the doing again), false when the choice is the player's (the flow
 * suspended again, or over: its rest "Carry on" if it halted).
 */
export function flowAfter(state, bus, d, why, { owed = false } = {}) {
  const S = state.stop, F = S?.flow;
  if (!F) return false;
  const now = state.clock.ms;
  release(F, now, { ok: why === 'end' });
  if (F.over) {
    const r = F.over; delete F.over;
    S.flow = null;
    if (r === 'halted') S.carry = carryOf(F);
    bus?.emit('bundle', { phase: 'end', who: F.who, id: F.step, beat: null, ch: null, atMs: F.untilMs ?? now, why: F.halt?.why ?? null });
    if (F.halt?.words) bus?.emit('line', { text: F.halt.words, kind: 'warn' });
    return false;
  }
  // (a failure drill whose third round was not fired on a man down after the pair ended as planned: its 'cut' is an end)
  const ended = why === 'end' || (why === 'cut' && d?.assessed === 'down');
  if (owed || !ended || d?.gunStop || S.queue?.length || ownUp(state, now)) {
    suspendFlow(state, bus, F, 'decision', now);
    advanceBeats(state, bus, F, now);
    return false;
  }
  // (your "Clear!" the scene found void (a man of the room turned as you called it: the range's knowledge, not yours, which
  // the gate no longer reads): the drill is not done with the room, so the call is owed again, at most CALL_AGAIN_N times
  // (the reach review of 2026-11-13: the void call ended the drill, a stop more in the hall on 8 of 10 lanes))
  for (const b of F.beats ?? []) {
    if (b.k !== 'call' || b.say !== 'clear' || b.st !== 'done' || (b.voids ?? 0) >= CALL_AGAIN_N || !callVoid.fn?.(state, b.plan, b.untilMs)) continue;
    b.voids = (b.voids ?? 0) + 1; b.st = 'wait'; b.redo = true; b.untilMs = now;
    delete b.clearFromMs; delete b.gateFromMs; delete b.manFromMs;
  }
  // (the drill goes on: the bundle the doing again, the rifle back to high ready first where the step left it aimed)
  upFirst(state, F, now);
  S.flow = null; S.doing = F; S.phase = 'act';
  if (houseOf(state)) S.last = { step: F.step, bundle: F.bundle ?? null, door: F.door ?? null, atMs: now };
  releaseTime(state, 'stop');
  bus?.emit('bundle', { phase: 'resume', who: F.who, id: F.step, beat: null, ch: null, atMs: now });
  const r = advanceBeats(state, bus, F, now);
  if (r !== 'running') beatsDone(state, bus, F, r);
  return true;
}
// (the muzzle up to high ready first, a hands beat flowing with the feet from rung 3, where the rifle is at the aim (carryPlan's))
function upFirst(state, F, ms) {
  if (state.people?.[F.who]?.kit?.carry?.posture !== 'aimed') return;
  const first = F.beats.find(b => b.st === 'wait') ?? F.beats[0], pre = /^\d+:/.test(first?.key ?? '') ? first.key.split(':')[0] + ':' : '';
  const n = F.beats.filter(b => /(^|:)up(\.\d+)?$/.test(b.key)).length, wh = skillsOf(state, F.who).wh;
  F.beats.unshift({ key: `${pre}up.${n}`, k: 'posture', ch: 'hands', to: 'highReady', after: [], cut: false, door: first?.door ?? null, plan: first?.plan ?? null, slot: F.slot ?? 1, st: 'wait', fromMs: null, untilMs: null,
    ms: Math.round(HIGH_READY_S * HIGH_READY_K * paceOf(wh) * 1000) });
  F.atMs = Math.max(F.atMs ?? 0, ms);
}
useBeats({ done: beatsDone, flow: flowAdvanced });

/** The rest of a move beat's path from where it stood at ms: [[x, z] there, …the waypoints still ahead]. */
export function restPath(b, ms) {
  const P = b.prof, sNow = profileAt(P, Math.max(0, (ms - b.fromMs) / 1000)).s, here = moveAt(b, ms);
  const out = [[here.x, here.z]];
  let acc = 0;
  for (let i = 1; i < b.path.length; i++) { acc += dist(b.path[i - 1], b.path[i]); if (acc > sNow + 0.01) out.push([...b.path[i]]); }
  return out.length > 1 ? out : [[here.x, here.z], [...b.path.at(-1)]];
}

/** The "Carry on" row of a halted bundle (see the header), or null: { id: 'drill:carry', kind: 'bundle', label: 'Carry on: …', ms }. */
export function carryRow(state, pid = playerId(state), ms = state.clock.ms) {
  const F = flowOn(state);
  if (F) return flowRow(state, F, ms);
  const C = state.stop?.carry;
  if (!C?.beats?.length) return null;
  const p = carryPlan(state, pid, C, ms);
  if (!p) return null;
  // (the leg it stands in by its beats, the legs after it by name: "in, the sector, "Clear!", the mark; then room 2, room 3
  // and the hall" (the fixer's of 0.0.12: the lane's rest listed every beat, its keys '2:far' among them))
  const order = laneOf(state)?.order ?? [], legName = (door) => { const i = order.indexOf(door); return i < 0 ? 'the next' : door === 'hall' ? 'the hall' : `room ${i + 1}`; };
  const first = p.beats[0]?.plan ?? null, here = p.beats.filter(b => b.plan === first), later = [...new Set(p.beats.filter(b => b.plan !== first).map(b => legName(b.plan)))];
  const beatWords = [...new Set(here.map(b => BEAT_WORDS[b.key.split(':').at(-1)] ?? b.key.split(':').at(-1)))].join(', ');
  const words = later.length ? `${beatWords}; then ${later.length > 1 ? `${later.slice(0, -1).join(', ')} and ${later.at(-1)}` : later[0]}` : beatWords;
  return { id: 'drill:carry', kind: 'bundle', label: `Carry on: ${words}`, ms: p.ms, rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], beats: p.beats.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), cmd: false, skill: null, lead: true, carry: true };
}
// (the suspended flow's "Carry on": its beats not done, taken up as they stand)
function flowRow(state, F, ms) {
  const left = F.beats.filter(b => b.st === 'wait' || b.st === 'run');
  if (!left.length) return null;
  const order = laneOf(state)?.order ?? [], legName = (door) => { const i = order.indexOf(door); return i < 0 ? 'the next' : door === 'hall' ? 'the hall' : `room ${i + 1}`; };
  const first = left[0]?.plan ?? null, here = left.filter(b => b.plan === first), later = [...new Set(left.filter(b => b.plan !== first).map(b => legName(b.plan)))];
  const beatWords = [...new Set(here.map(b => BEAT_WORDS[b.key.split(':').at(-1).replace(/\.\d+$/, '')] ?? b.key.split(':').at(-1)))].join(', ');
  const words = later.length ? `${beatWords}; then ${later.length > 1 ? `${later.slice(0, -1).join(', ')} and ${later.at(-1)}` : later[0]}` : beatWords;
  const until = F.untilPlanMs ?? ms, at = F.suspended?.atMs ?? ms;
  return { id: 'drill:carry', kind: 'bundle', label: `Carry on: ${words}`, ms: Math.max(0, until - at), rushMs: null, carefulMs: null, odds: null, routine: true, off: null, subs: [], beats: left.map(b => ({ id: b.key, k: b.k, ch: b.ch, ms: b.ms })), cmd: false, skill: null, lead: true, carry: true, flow: true };
}
/** The beats' words in "Carry on: …". */
export const BEAT_WORDS = Object.freeze({ approach: 'the stack', reorg: 'the top up', ready: 'high ready', up: 'the muzzle up', muzzle: 'the muzzle on the door', read: 'the read', tell: 'the word to your two', squeeze: 'the squeeze', door: 'the door', breach: 'the breach', enter: 'in', corner: 'your corner', sector: 'the sector', inner: 'the inner door', far: 'the far leg', farlook: 'a look down the far leg', clear: '"Clear!"', roomclear: '"Room clear!"', mark: 'the mark' });
// (the rest re-planned from where the body is now, keeping the bundle's beat ids)
function carryPlan(state, pid, C, ms) {
  const full = planBundle(state, pid, C.bundle, { door: C.door, rung: C.rung, variant: C.variant ?? {}, atMs: ms });
  if (!full) return null;
  const keep = new Set(C.beats), beats = full.beats.filter(b => keep.has(b.key));
  if (!beats.length) return null;
  const a = actorOf(state, pid), v0 = Math.hypot(a?.v?.[0] ?? 0, a?.v?.[1] ?? 0);
  const firstMove = beats.find(b => b.k === 'move');
  if (firstMove && a) {
    const legs = legsOf(state, pid), cut = C.paths?.[firstMove.key];
    // (taken up from the body's place along the cut path, never back to a waypoint already behind it, and routed)
    const path = wayOf(state, pathFrom(cut ?? firstMove.path, [a.x, a.z]), doorsOf(beats)), P = profileOf(pathLen(path), legs.walk[firstMove.stance], legs.pushMs2, legs.brakeMs2, { v0, v1: firstMove.prof.v1 });
    Object.assign(firstMove, { path, prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, P.L - ARRIVE_M) * 1000) });
  }
  // (a dependency on a beat already done is met: dropped)
  for (const b of beats) b.after = b.after.filter(x => keep.has(x.split('@')[0]));
  // (the rifle still at the aim after the shots: the rest starts with the muzzle up to high ready, a hands beat that flows
  // with the feet from rung 3, so the walk on never sweeps the #2 (the fixer's second pass of 0.0.12: the sergeant's Carry
  // on walked room 1 aimed and took the muzzle fault on his own #2, the line "Muzzle. Up." in the middle of T's bundle).
  // First whatever the rest holds: a lane's rest holds the next room's own high ready, which waits on the approach's
  // 60%, so asked only where the rest held no posture beat the tier one walked out of room 2 aimed across his still #2
  // for 2.35 s and took the fault (the user, 2026-11-11: "we still get flagged a fault for muzzle"))
  if (state.people?.[pid]?.kit?.carry?.posture === 'aimed' && beats[0]?.k !== 'posture') {
    const pre = /^\d+:/.test(beats[0].key) ? beats[0].key.split(':')[0] + ':' : '', wh = skillsOf(state, pid).wh;
    beats.unshift({ key: `${pre}up`, k: 'posture', ch: 'hands', to: 'highReady', after: [], cut: false, door: beats[0].door ?? null, plan: beats[0].plan, slot: 1, st: 'wait', fromMs: null, untilMs: null,
      ms: Math.round(HIGH_READY_S * HIGH_READY_K * paceOf(wh) * 1000) });
  }
  const d = { beats, rung: C.rung, atMs: ms, fromMs: ms, lanes: {}, subs: [] };
  return { beats, ms: simulate(d), rung: C.rung, slot: 1, door: C.door, variant: C.variant, seams: [] };
}
/** Carry on (the panel's "Carry on: …"): the halted bundle's rest from where the body is. Returns { ok, why }. */
export function carryOn(state, bus, pid = playerId(state), { tempo = 'normal' } = {}) {
  const S = state.stop, F = flowOn(state);
  if (F) {
    // (a suspended flow taken up with nothing beside it: a no-shoot's, the #2's man's (COMBAT §25.19.4: "Carry on (T): at rung 2 and up the flow resumes"))
    const now = state.clock.ms;
    resume(F, now); upFirst(state, F, now);
    S.flow = null; S.doing = F; S.phase = 'act'; S.queue = [];
    if (houseOf(state)) S.last = { step: F.step, bundle: F.bundle ?? null, door: F.door ?? null, atMs: now };
    releaseTime(state, 'stop');
    bus?.emit('bundle', { phase: 'resume', who: pid, id: F.step, beat: null, ch: null, atMs: now });
    const r = advanceBeats(state, bus, F, now);
    if (r !== 'running') beatsDone(state, bus, F, r);
    return { ok: true, why: null };
  }
  const C = S?.carry;
  if (!C) return { ok: false, why: 'nothing to carry on' };
  const p = carryPlan(state, pid, C, state.clock.ms);
  if (!p) { S.carry = null; return { ok: false, why: 'nothing left' }; }
  return beginBeats(state, bus, pid, { step: 'drill:carry', bundle: C.bundle, plan: p, tempo, label: 'Carry on' });
}
/** Backspace (or X on a bundle): stop the player's bundle after its beat (the stepper's 'stop'). Returns whether it was asked. */
export function stopBundle(state, bus, pid = playerId(state)) {
  const d = state.stop?.doing;
  if (!d?.beats) return false;
  return haltDoing(state, bus, d, 'stop', null, state.clock.ms);
}
/** Hand a running bundle back (contact.js at the pause, the scene for 'two', 'noshoot', 'gun', 'lane-end'): why one of the stepper's HALTS. */
export function handBack(state, bus, why, words = null, pid = playerId(state)) {
  // (a flow suspended or beside a step: halted where it stands into "Carry on" (the lane's end))
  if (state.stop?.flow) { haltFlow(state, bus, state.stop.flow, why, state.clock.ms); return true; }
  const d = state.stop?.doing;
  if (!d?.beats) return false;
  return haltDoing(state, bus, d, why, words ?? HANDBACK_WORDS[why] ?? null, state.clock.ms);
}

/** A single's run in stop motion (the door's rows, Watch, Look, Move, "Clear!", Mark, the stances): one beat through the stepper. Returns { ok, why }. */
export function startSingle(state, bus, pid, row, { tempo = 'normal' } = {}) {
  const S = state.stop;
  if (!S || S.mode !== 'stop' || !row) return { ok: false, why: 'not offered' };
  if (row.off) return { ok: false, why: row.off };
  const a = actorOf(state, pid), sk = skillsOf(state, pid), rung = rungOf(state, pid, 'room'), here = doorNow(state, pid);
  if (row.kind === 'gait') { setStance(state, bus, pid, row.gait); return { ok: true, why: null }; }
  if (row.kind === 'watch') {
    const h = here?.plan?.hot?.find(x => x.id === row.hot);
    if (!h || !a) return { ok: false, why: 'nothing to watch' };
    const yaw = q(bearing([a.x, a.z], hotXZ(h)), 1e-6);
    const beat = { key: 'watch', k: 'wait', ch: 'hands', ms: row.ms, after: [], st: 'wait' };
    const r = beginBeats(state, bus, pid, { step: row.id, bundle: null, plan: { beats: [beat], ms: row.ms, rung, slot: 1, door: here.door, variant: {}, seams: [] }, tempo, label: row.label });
    // (the Watch is the body's, kept out of the mode while the keys walk him in: actor.watch, until the pause takes it in)
    a.watch = { hotId: h.id, x: h.x, z: h.z, yawRad: yaw, fromMs: state.clock.ms };
    a.headRad = yaw; setPosture(state, pid, 'highReady');
    return r;
  }
  let beat;
  // (v0.0.18: a device's way out of the hands (deviceRows): the throw and the bang as the drill's beats; the rest on the hands)
  if (row.kind === 'door' && (row.how === 'throw' || row.how === 'clear')) {
    const t = { key: 'throw', k: 'throw', ch: 'hands', ms: row.ms, after: [], plan: here?.door ?? null, ...(row.how === 'clear' ? { clear: true } : {}) };
    const b2 = { key: 'bang', k: 'burst', ch: 'eyes', ms: fuseBelieved(state.items[row.dev]?.model ?? 'g11') ?? 0, after: ['throw'] };
    return beginBeats(state, bus, pid, { step: row.id, bundle: null, plan: { beats: [t, b2], ms: t.ms + b2.ms, rung, slot: 1, door: here?.door ?? null, variant: {}, seams: [] }, tempo, label: row.label });
  }
  // (v0.0.19: the lock shot at an inner door (singleRows: the closet on a breaching lane))
  if (row.kind === 'door' && row.how === 'shoot') beat = { key: 'shoot', k: 'shootDoor', ch: 'hands', door: row.id.split('>')[1], ms: row.ms, after: [] };
  else if (row.kind === 'door' && row.how === 'cook') beat = { key: 'cook', k: 'cook', ch: 'hands', want: row.want ?? 2000, ms: row.ms, after: [] };
  else if (row.kind === 'door' && ['repin', 'stow', 'drop', 'pickup'].includes(row.how)) beat = { key: row.how, k: 'stowdev', ch: 'hands', how: row.how, ms: row.ms, after: [], ...(row.how === 'pickup' ? { dev: row.dev } : {}) };
  else if (row.kind === 'door' && row.how === 'pry') beat = { key: 'force', k: 'force', ch: 'hands', door: row.id.split('>')[1], how: 'pry', model: 'hal', ms: row.ms, passMs: row.passMs, handMs: row.handMs, after: [] };
  else if (row.kind === 'door' && row.how === 'read') {
    beat = { key: 'read', k: 'read', ch: 'eyes', ms: row.ms, after: [], door: row.id.split('>')[1], plan: here.door };
    (opRec(state).read ??= {})[here.plan.door] = state.clock.ms;
  } else if (row.kind === 'door' && row.how === 'hold') {
    const H = houseOf(state); if (H?.two) H.two.hold = row.id.split('>')[1];
    bus?.emit('say', { who: pid, text: 'Hold that door.', kind: 'speech', durMs: 800 });
    // (the question answered, the drill goes on by itself: one press for the inner door (COMBAT §25.19.4: "Hold it (T)"; the
    // rework's R4: Hold it then Carry on was two presses at one stop, the gauges' F13)
    if (S.carry?.why === 'door-unplanned' && !(plan0(state, pid)?.inner ?? []).some(id => openingState(state, id) !== 'open' && H?.two?.hold !== id)) carryOn(state, bus, pid);
    return { ok: true, why: null };
  } else if (row.kind === 'door') {
    const how = row.how, t = doorS(sk.wh, how, rung);
    beat = { key: 'door', k: 'door', ch: 'hands', door: row.id.split('>')[1], how, ms: t.ms, passMs: t.passMs, handMs: t.handMs, after: [] };
  } else if (row.kind === 'look') {
    const h = here?.plan?.hot?.find(x => x.id === row.hot);
    beat = { key: `look:${row.hot}`, k: 'scan', ch: 'eyes', hot: row.hot, deg: 0, ms: row.ms, after: [] };
    if (a && h) a.headRad = q(bearing([a.x, a.z], hotXZ(h)), 1e-6);
  } else if (row.kind === 'move') {
    const legs = legsOf(state, pid), path = wayOf(state, row.path ? pathFrom(row.path, [a.x, a.z]) : [[a.x, a.z], row.to]), st = a.moveStance === 'assault' ? 'assault' : 'combat';
    const P = profileOf(pathLen(path), legs.walk[st], legs.pushMs2, legs.brakeMs2);
    beat = { key: 'move', k: 'move', ch: 'feet', stance: st, path, prof: P, ms: Math.round(P.T * 1000), after: [], cut: true };
    // (the far leg's walk: the body turns onto the leg as it comes into view, as the bundle's does)
    const fh = row.id === 'move:far' ? here?.plan?.hot?.find(x => x.id === here.plan.far?.hot) : null;
    if (fh) beat.look = [fh.x, fh.z];
  // ("Coming out!" by itself (a call row saying 'out'), the `out` kind's, for a walk out by the keys)
  } else if (row.kind === 'call' && row.say === 'out') beat = { key: 'out', k: 'out', ch: 'voice', ms: row.ms, after: [] };
  else if (row.kind === 'call') beat = { key: 'clear', k: 'call', ch: 'voice', say: 'clear', ms: row.ms, after: [], plan: here?.door ?? null };
  else if (row.kind === 'mark') beat = { key: 'mark', k: 'mark', ch: 'hands', ms: row.ms, after: [] };
  if (!beat) return { ok: false, why: 'not offered' };
  if (tempo === 'rushed' && beat.k !== 'move') beat.ms = Math.round(beat.ms * RUSH_K);
  // (a row that walks you up first (singleRows' Shoot the lock on an inner door: the muzzle on the lock): the walk at Combat, then
  // the row's own beat at its end (the hunt of v0.0.20, breach-4))
  if (row.walk && a) {
    const legs = legsOf(state, pid), path = wayOf(state, pathFrom(row.walk, [a.x, a.z])), P = profileOf(pathLen(path), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
    const mv = { key: 'move', k: 'move', ch: 'feet', stance: 'combat', path, prof: P, ms: Math.round(P.T * 1000), after: [], cut: true };
    beat.after = ['move'];
    return beginBeats(state, bus, pid, { step: row.id, bundle: null, plan: { beats: [mv, beat], ms: mv.ms + beat.ms, rung, slot: 1, door: here?.door ?? null, variant: {}, seams: [] }, tempo, label: row.label });
  }
  return beginBeats(state, bus, pid, { step: row.id, bundle: null, plan: { beats: [beat], ms: beat.ms, rung, slot: 1, door: here?.door ?? null, variant: {}, seams: [] }, tempo, label: row.label });
}

// (the plan of the door you are at)
const plan0 = (state, pid) => doorNow(state, pid)?.plan ?? null;
/** The body's movement stance set (V in the house, the gait rows): Relaxed slings the rifle's posture to slung, Combat low ready, Assault shouldered; the 'gait' fact. */
export function setStance(state, bus, pid, to) {
  const a = actorOf(state, pid);
  if (!a || !MOVE_STANCES.includes(to)) return false;
  const from = a.moveStance ?? 'relaxed';
  if (from === to) return false;
  a.moveStance = to;
  bus?.emit('gait', { who: pid, from, to, atMs: state.clock.ms });
  // (the first switch explains itself in one line (the user, 2026-11-11: "don't know what the assault <-> combat option is
  // supposed to mean"): what the stance trades, in numbers, once a game (state.mind.hints.stance))
  if (pid === playerId(state) && !state.mind?.hints?.stance) {
    ((state.mind ??= {}).hints ??= {}).stance = state.clock.ms;
    const words = stanceWords.fn ? stanceWords.fn(state, pid, to) : STANCE_NAMES[to];
    bus?.emit('line', { text: `${words}. ${STANCE_HINT}`, kind: 'note' });
  }
  return true;
}
/** The first switch's second sentence: what V does, by the names that say what they trade. */
export const STANCE_HINT = 'V: Relaxed (rifle slung), Careful (Combat: steadier), Fast (Assault: quicker, shots worse on the move).';
// (the stance's effect in numbers, specials.js stanceHint, registered at its load: held on a function, as the clear gate is)
function stanceWords() { return stanceWords.fn ?? null; }
/** The stance's words in numbers for the first switch's line (specials.js registers stanceHint). */
export function useStanceWords(fn) { stanceWords.fn = typeof fn === 'function' ? fn : null; }

// ---- the face's view ----

/**
 * The running bundle (see the header): { id, label, lanes: { feet, hands, eyes, voice: [{ key, glyph }] }, fromMs, untilMs,
 * k } or null; glyphs (stepper.js markOf) ✓ passed, ◦ routine, ~ a natural 1 caught, ★ a natural 20, ✗ a failure that cost, – cut, · to come, ▸ running.
 */
export function bundleNow(state, pid = playerId(state), ms = state.clock.ms) {
  const d = state.stop?.who === pid ? (state.stop?.doing?.beats ? state.stop.doing : state.stop?.flow ?? state.stop?.doing) : houseOf(state)?.two?.pid === pid ? houseOf(state).two.doing : null;
  if (!d?.beats) return null;
  const lanes = { feet: [], hands: [], eyes: [], voice: [] };
  for (const b of d.beats) {
    if (!lanes[b.ch]) continue;
    const g = b.st === 'wait' ? '·' : b.st === 'run' ? '▸' : b.st === 'cut' ? '–' : markOf(d.subs.find(s => s.beat === b.key) ?? { ok: true }) ?? '✓';
    lanes[b.ch].push({ key: b.key, glyph: g });
  }
  const until = d.untilPlanMs ?? d.untilMs, k = until > d.fromMs ? Math.max(0, Math.min(1, (ms - d.fromMs) / (until - d.fromMs))) : 1;
  return { id: d.step, label: d.label ?? bundleDef(d.bundle)?.label ?? d.step, lanes, fromMs: d.fromMs, untilMs: until, k };
}
/** The sector the bundle's eyes hold now (react.js heldSectorOf reads it): { yawRad, why: 'bundle' } or null. */
export function bundleEyes(state, pid = playerId(state)) {
  const d = state.stop?.who === pid ? (state.stop?.doing?.beats ? state.stop.doing : state.stop?.flow ?? state.stop?.doing) : houseOf(state)?.two?.pid === pid ? houseOf(state).two.doing : null, a = actorOf(state, pid);
  if (!d?.beats || !a) return null;
  const b = d.beats.find(x => x.st === 'run' && x.k === 'scan') ?? d.beats.find(x => x.st === 'run' && x.k === 'move' && x.key.endsWith('enter'));
  if (!b) return null;
  const plan = planOf(state, b.plan), c = plan ? cornerOf(plan, b.side ?? b.slot ?? 1) : null;
  return c ? { yawRad: Math.atan2(c.z - a.z, c.x - a.x), why: 'bundle' } : null;
}
// ---- the #2: his slot through the same plan (see the header) ----

/**
 * The #2's slot this tick (the scene's houseActors, the think layer): rec R.house.two { pid, aid, rung, doing, hold,
 * contact, fired, hits }. At the lane's door: below rung 3 one group at a time ('stack:up' then the door's wait, the
 * entry, the sector) with goMs between, from rung 3 the room; his entry waits for #1's crossing the plane. Returns his
 * doing's state: 'idle' | 'running' | 'ended' | 'halted'.
 */
export function runSlot(state, bus, rec, ms = state.clock.ms) {
  if (!rec?.pid) return 'idle';
  const a = actorOf(state, rec.pid);
  if (!a) return 'idle';
  // (v0.0.19: startled, his doing held where it stands (its moves and looks paused) and his free body braking; at its end it goes on)
  if (startled(state, rec.pid, ms)) { if (rec.doing) startleHold(state, bus, rec.doing, ms); freeBody(state, rec, a, ms, true); return 'idle'; }
  if (startleHeld(rec.doing)) resume(rec.doing, ms);
  // (a man of his seen: his take-in, his identification and his row are the scene's; his slot halts where it stands and
  // starts nothing until they are done (the fixer's of 0.0.12: a Dominate planned in his window was halted the next tick and
  // never run again, so he stood 0.38 m off his point, his sector unswept))
  // (a man he takes on the move, your man while he covers you on his way in (the rework's R6: contact.move, eng.move), leaves his walk be)
  const busy = !!((rec.contact && !rec.contact.move) || (rec.eng && !rec.eng.move));
  if (busy && rec.doing && !rec.doing.halt) haltDoing(state, bus, rec.doing, 'contact', null, ms);
  // (v0.0.19, the other side (team.js; sideFor): his walk in begun on his own side, short of his threshold, when you have taken
  // it: halted ('side'), and planned again next tick on yours from where he stands (the cut rule below goes on in))
  if (rec.doing?.bundle === 'room:in' && !rec.doing.halt && (rec.doing.side ?? 2) === 2 && TEAM_OPPOSITE) {
    const h0 = doorNow(state, playerId(state)), me0 = playerActor(state);
    if (h0 && h0.door === rec.doing.door && !pastThreshold(h0.plan, a.x, a.z) && sideFor(state, bus, rec, h0, me0, a, ms) !== 2) {
      haltDoing(state, bus, rec.doing, 'side', null, ms);
      advanceBeats(state, bus, rec.doing, ms);
      rec.last = { step: rec.doing.step, untilMs: ms, why: 'side' };
      rec.doing = null;
      return 'halted';
    }
  }
  // (and the other way (the review of 2026-11-16): his walk in on your side, short of his threshold, and you back on your own (sideBack):
  // the swap given back and his walk planned again on his own; v0.0.19's first build held him outside the doorway, silent, his walk
  // ending on you)
  if (rec.doing?.bundle === 'room:in' && !rec.doing.halt && rec.doing.side === 1 && TEAM_OPPOSITE) {
    const h0 = doorNow(state, playerId(state)), me0 = playerActor(state);
    if (h0 && h0.door === rec.doing.door && !pastThreshold(h0.plan, a.x, a.z) && sideBack(state, bus, rec, h0, me0, ms)) {
      haltDoing(state, bus, rec.doing, 'side', null, ms);
      advanceBeats(state, bus, rec.doing, ms);
      rec.last = { step: rec.doing.step, untilMs: ms, why: 'side' };
      rec.doing = null;
      return 'halted';
    }
  }
  // (R2 a: his walk in begun before the grenade came down (your throw from past the door's line, the hunt's recipe) and short
  // of the doorway when one lands in the room he goes into or by his way in (burst.js liveIn): halted where he stands ('live'), silently,
  // his entry planned again on its burst (the guard below holds it till then); in the doorway or past it he goes on, never stopped in it)
  if (rec.doing?.bundle === 'room:in' && !rec.doing.halt) {
    const P0 = planOf(state, rec.doing.door);
    if (P0?.door && !pastThreshold(P0, a.x, a.z) && !inFunnel(P0, a.x, a.z) && liveIn(state, P0, rec.doing.beats.find(b => b.k === 'move' && b.st !== 'done')?.path ?? entryPath(P0, sideOf(state, rec.doing.door, 2)))) {
      haltDoing(state, bus, rec.doing, 'live', null, ms);
      advanceBeats(state, bus, rec.doing, ms);
      rec.last = { step: rec.doing.step, untilMs: ms, why: 'live' };
      rec.doing = null;
      return 'halted';
    }
  }
  // (his stack-up still finishing at his stack point, its "Ready." still to say, when your cue comes: ended there, his
  // entry on the cue after his reaction, as from his stack idle. Before it he finished the stack-up first: re-stacked after his own
  // Get clear of your slipped G-11 (two.js twoClear), the mixed loadout's keys recruit on 1222 cued him at 16.00 s, 0.30 s before his
  // "Ready.", and he started in at 17.35 s, his threshold 3.30 s after the cue (F25, house-flawless-kit2: the integration's open gauge))
  if ((rec.doing?.bundle === 'stack:up' || rec.doing?.bundle === 'stack:point') && !rec.doing.halt && !rec.doing.task) {
    const h0 = doorNow(state, playerId(state)), me0 = playerActor(state);
    if (h0?.plan?.door && h0.door === rec.doing.door && me0 && dist([a.x, a.z], stackOf(h0.plan, 2)) <= STACK_NEAR_M && entryGo(state, h0.plan, me0, ms, h0.rec)) {
      haltDoing(state, bus, rec.doing, 'cue', null, ms);
      advanceBeats(state, bus, rec.doing, ms);
      rec.last = { step: rec.doing.step, untilMs: ms, why: 'cue' };
      rec.doing = null;
      return 'halted';
    }
  }
  if (rec.doing) {
    // (his eyes on a man he takes on the move: his corner's and his sector's looks wait, paused where they stand, none started,
    // and go on once he is off him (the rework's R9, 2026-11-13: room 2's corner ran out while his head was on the armoured man
    // he took for you, and your "Clear!" came with his corner never looked at: "Corner!", 2 of 100 tier one lanes, F7)
    // (and while he covers your sector, his head on your man or your sector's middle (shoothouse.js twoCover))
    if (rec.contact?.move || rec.eng?.move || rec.cover) { rec.doing.eyesOff = true; pauseScans(rec.doing, ms); }
    else if (rec.doing.eyesOff) { delete rec.doing.eyesOff; rec.doing.atMs = Math.max(rec.doing.atMs ?? 0, ms); }
    const r = advanceBeats(state, bus, rec.doing, ms);
    // (time held off the looks is lived: what waits on them starts from now, not back when the eyes left)
    if (rec.doing.eyesOff) rec.doing.atMs = Math.max(rec.doing.atMs ?? 0, ms);
    // (v0.0.19: each beat of his task ended noted on the task's record (task.done), what your cue waits on)
    if (rec.doing.task && rec.task) for (const b of rec.doing.beats) if (b.st === 'done' && rec.task.done[b.key] === undefined) {
      rec.task.done[b.key] = b.untilMs;
      // (the bang: your Wait on his work ends with it (cqb.js cqb-task's "Cover it", then "Bang! Go."), not WAIT_MAX_MS on (the review
      // of v0.0.19: the recruit's Wait ran 1.1 s past the bang, and the entry missed BANG_LATE_MS))
      if (b.key === 'bang' && state.stop?.doing?.kind === 'wait' && state.stop.doing.untilMs > ms) state.stop.doing.untilMs = ms;
    }
    const mv = rec.doing.beats.find(b => b.st === 'run' && b.k === 'move' && b.prof);
    // (his place by his move's closed form, its speed his body's (BODY §16.8); with none running, the free body's brake)
    if (mv) {
      let p = moveAt(mv, ms);
      // (the body gap (see the header): his next place closing within BODY_GAP_M of yours holds his walk a tick, his time
      // and the doing's planned end with it, counted on his record (rec.gap); the cue and the departure should leave it idle)
      // (and never into a doorway he cannot cross: held outside it while you stand in his way through it (zoneGate, the rework's R8b))
      // (the build sheet v0.0.20 item 19: in the hall at Fast while you lead him by over HALL_PAIR_M (hallHurry), and held at or
      // behind you plus HALL_LEAD_M along its axis (hallHold))
      if (rec.doing.door === 'hall' && hallHurry(state, rec, a, mv, ms)) p = moveAt(mv, ms);
      const held = zoneGate(state, rec, a, p, mv, ms) || gapHold(state, rec, a, p, ms, false, bus) || hallHold(state, rec, a, p, mv, ms);
      // (v0.0.19: his walk to the front held by you: his "Give me the door!" once it is TWO_BLOCK_SAY_MS long (frontSay))
      if (rec.doing.task && mv.key === 'front') { if (held) frontSay(state, bus, rec, ms); else if (rec.front) delete rec.front; }
      if (held) {
        // (held by you in a doorway: never a queue there; he gives way, out of it away from you, and his walk is planned again
        // once his way through is clear (giveWay below; the rework's R8b: the fuzz's lanes stood both of you 4 to 6 minutes))
        if (giveWayOut(state, bus, rec, a, ms)) return 'halted';
        // (the build sheet v0.0.20 item 9: held by your body TWO_PIN_MS, you standing outside a doorway, his walk is routed round you in gapHold
        // (twoRound), from where he stands as this tick's hold ends; with no way round, his doing ended where he stands (never on a task
        // of yours), planned again from there when his way is clear)
        if (rec.gap?.stuck === ms && !onTask(rec)) {
          haltDoing(state, bus, rec.doing, 'two', null, ms); advanceBeats(state, bus, rec.doing, ms);
          rec.last = { step: rec.doing.step, untilMs: ms, why: 'two' }; rec.doing = null; delete rec.gap.stuck;
          return 'halted';
        }
        mv.fromMs += TICK_MS; mv.untilMs += TICK_MS; if (Number.isFinite(rec.doing.untilPlanMs)) rec.doing.untilPlanMs += TICK_MS; p = { ...moveAt(mv, ms), vMs: 0 };
      }
      placeAt(state, rec.pid, a, p.x, p.z); a.headRad = p.headRad; a.locoMs = ms;
      if (p.vMs > 0) a.v = [q(p.vMs * Math.cos(p.headRad), 0.001), q(p.vMs * Math.sin(p.headRad), 0.001)]; else delete a.v;
      delete a.through;
    } else if (!busy && !a.through && stepOffPath(state, bus, rec, a, ms)) { freeBody(state, rec, a, ms, busy); return 'halted'; }
    else freeBody(state, rec, a, ms, busy);
    // (his eyes: a scan sweeps his head across his sector over its time, as the player's does (shooting.js stopRules); a
    // move with a look or held eyes faces them (the fixer's of 0.0.12: his head stayed on the near corner through his
    // sector's scan, so he never saw room 3's near-leg man)
    const sc = rec.doing.beats.find(b => b.st === 'run' && b.k === 'scan' && b.sweep);
    if (sc) { const k = sc.untilMs > sc.fromMs ? Math.min(1, Math.max(0, (ms - sc.fromMs) / (sc.untilMs - sc.fromMs))) : 1; a.headRad = q(sc.sweep[0] + wrap(sc.sweep[1] - sc.sweep[0]) * k, 1e-6); }
    else if (mv && (mv.eyes ?? mv.look)) { const e = mv.eyes ?? mv.look; a.headRad = q(Math.atan2(e[1] - a.z, e[0] - a.x), 1e-6); }
    // (his moves obey the crossing rule too (COMBAT §25.19.5))
    crossTick(state, rec.pid, ms);
    if (r === 'running') return r;
    rec.last = { step: rec.doing.step, untilMs: rec.doing.untilMs, why: rec.doing.halt?.why ?? null };
    // (the room swept only by a Dominate that ran to its end; a halted one is planned again from where he stands)
    if (r === 'ended' && rec.doing.bundle === 'room:dominate') (rec.swept ??= {})[rec.doing.door] = ms;
    // (v0.0.19: his task's bundle over: done to its end, else failed (a refusal, a fumble) or belayed by your word)
    if (rec.doing.task && rec.task && rec.task.st === 'working') { rec.task.st = r === 'ended' ? 'done' : 'failed'; if (r !== 'ended') rec.task.why = rec.doing.halt?.why ?? null; }
    // (his task failed with its tool in his hand (a pry or a ram that would not give, halted 'fail'), the tool
    // goes down at his feet as the force beat's own end leaves it, and he goes on with his hands free. Before it he carried the
    // halligan into every room after and to the card (F37: the sergeant on 1489397426, room 2, once the merge's timings moved the dice))
    if (rec.doing.task && rec.task?.st === 'failed') {
      const t = handDeviceOf(state, rec.pid);
      if (t?.kind === 'tool') { KIT.move(state, t.id, { ground: { area: state.places.live.area, x: a.x, z: a.z } }); setSt(state, t.id, 'stowed'); setPosture(state, rec.pid, 'highReady'); }
    }
    // (his charge off the door: your Wait on it ends with it (cqb.js cqb-task's "He's taking his charge off. Wait."), not WAIT_MAX_MS on)
    if (rec.doing.bundle === 'two:recover' && state.stop?.doing?.kind === 'wait' && state.stop.doing.untilMs > ms) state.stop.doing.untilMs = ms;
    rec.doing = null;
    return r;
  }
  // (no slot running: his body brakes from whatever speed a cut or a move's end left it (the brake, never the cut)), carried
  // through a doorway rather than left at rest in it (freeBody)
  // (idle, off your walk as soon as it closes on him ahead of you, not once it is held (stepOffPath's `ahead`))
  if (!busy && !a.through) stepOffPath(state, bus, rec, a, ms, OFF_PATH_AFTER_MS, true);
  freeBody(state, rec, a, ms, busy);
  if (a.through) return 'idle';
  if (busy) return 'idle';
  // (v0.0.18: your charge on the lane's door: to his own safe point (rec.safe, your place beat's), held there until the door is
  // blown or the charge is gone, then on in on his cue as ever)
  if (rec.safe) {
    // (the hunt of v0.0.18: and once you have left that door for another leg, the charge left on it: he comes with you (the
    // lane's end marks the charge, shoothouse.js chargesLeft); held there, every later door waited on him and "Wait." ran the lane out)
    if (openingState(state, rec.safe.door) === 'open' || !placedOn(state, rec.safe.door) || (doorNow(state, playerId(state))?.plan?.door ?? null) !== rec.safe.door) delete rec.safe;
    else {
      if (dist([a.x, a.z], [rec.safe.x, rec.safe.z]) <= STACK_NEAR_M) return 'idle';
      const path = wayOf(state, [[a.x, a.z], [rec.safe.x, rec.safe.z]], []), legs = legsOf(state, rec.pid, a.x, a.z), P = profileOf(pathLen(path), legs.walk.combat, legs.pushMs2, legs.brakeMs2);
      const beat = { key: 'back', k: 'move', ch: 'feet', stance: 'combat', path, prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, Math.max(0, P.L - ARRIVE_M)) * 1000), after: [], cut: true, st: 'wait', fromMs: null, untilMs: null, slot: 2 };
      rec.doing = { who: rec.pid, step: 'drill:safe', kind: 'bundle', bundle: null, tempo: 'normal', rung: rec.rung ?? 0, slot: 2, door: rec.safe.door, variant: {}, beats: [beat], lanes: {}, subs: [], fromMs: ms, atMs: ms, untilMs: ms, untilPlanMs: ms + beat.ms, seams: [] };
      return 'running';
    }
  }
  const here = doorNow(state, playerId(state));
  if (!here) return 'idle';
  const rung = rec.rung ?? rungOf(state, rec.pid, 'room'), gap = goMs(skillsOf(state, rec.pid).wf);
  // (v0.0.19, his roles on your word (team.js; TEAM 2 to 4): a task ordered at this door, his task bundle; belayed with a device in
  // his hands, its way out first (devices.js wayOut, never a dead end); else his slot as ever)
  const tr = taskSlot(state, bus, rec, a, here, rung, ms);
  if (tr) return tr;
  if (rec.last && ms < rec.last.untilMs + (rung < 3 ? gap : 0)) return 'idle';
  // (his entry cued by distance (COMBAT §25.19.3.4, the rework's R5): your centre ENTRY_GAP_M past your own threshold
  // waypoint, his lane his own, so he steps in almost at once behind you and never through you (v0.0.12 cued him on your
  // first step into the doorway: through your body 1.8 s a lane))
  const me = playerActor(state), plan = here.plan;
  const inside1 = me ? entryGo(state, plan, me, ms, here.rec) : false;
  // (the build sheet v0.0.20 item 8: closed up on your heels onto your vacated stack point (rec.heels) is his stack as much as his own)
  if (rec.heels && rec.heels.door !== here.door) delete rec.heels;
  const onHeels = !!rec.heels && dist([a.x, a.z], stackOf(plan, 1)) <= STACK_NEAR_M;
  const stacked2 = dist([a.x, a.z], stackOf(plan, 2)) <= STACK_NEAR_M || onHeels, inside2 = pastThreshold(plan, a.x, a.z);
  // (the build sheet v0.0.20 item 8 (drill.md D2): below rung 3, you leaving your stack toward the open door, he closes up onto your stack point
  // (heelsGo), so his entry on his cue starts 0.65 m nearer and he is in "almost simultaneously" (FM 3-06.11 §3-22c(6)); from rung 3
  // entryAhead starts him on time, as built)
  // (R2 a: never onto your stack point over a live grenade (burst.js liveIn): your slip on seed 48229 left it 0.25 m off your
  // point, and he closed up onto it as you ran clear, 0.39 m from it at the burst)
  if (rung < 3 && !inside1 && !inside2 && !rec.heels && dist([a.x, a.z], stackOf(plan, 2)) <= STACK_NEAR_M && me && heelsGo(state, plan, me, here.door, ms) && !liveIn(state, plan, [[a.x, a.z], stackOf(plan, 1)])) return heelsStart(state, bus, rec, a, here, me, rung, ms);
  let bundle = null;
  // (cued, he goes in from wherever he stands: a man cut mid-entry by his contact goes on in, never back to the stack. His
  // entry begun (ahead of your cue, entryAhead) and cut short of the threshold is his cue kept: 2026-11-15, the user: "squad AI
  // sometimes stays out of the room on entry"; v0.0.14 to v0.0.16 read your cue again, and with you not yet ENTRY_GAP_M along
  // your lane sent him back to his stack (stack:point), to wait there for it: the corporal's room 3 on 96 of 200 lanes by T,
  // 4.65 s from the cue to his threshold)
  const cut = !inside2 && rec.last?.step === `drill:room:in>${here.door}` && rec.last.why !== 'two';
  // (the catalogue's groups, one at a time (COMBAT §25.19.2.3): the stack, in to his corner, his point and his sector)
  if (!inside2 && (inside1 || cut)) bundle = 'room:in';
  else if (!inside2 && !stacked2 && here.rec?.state !== 'clear') bundle = rung >= 2 ? 'stack:point' : 'stack:up';
  else if (inside2 && !rec.swept?.[here.door]) bundle = 'room:dominate';
  if (!bundle && !(stacked2 && !inside2)) return 'idle';
  // (to the next stack he goes with you (COMBAT §25.19.5): not before your own move starts (the tick yours does), and then when
  // his walk keeps the body gap off yours (giveWay): v0.0.12 left on a poll the moment the room was clear and stood on your way)
  const stackRow = bundle === 'stack:point' || bundle === 'stack:up';
  if (stackRow && !leadGone(state, rec, here, me)) return 'idle';
  // (not cued yet but at his stack, your walk in known: he steps off so as to reach his own threshold as you are ENTRY_GAP_M past
  // yours, never sooner (entryAhead: "almost simultaneously", the gap kept at the door rather than waited for at the stack))
  if (!bundle && !inside2 && stacked2 && me && entryAhead(state, rec, a, here, me, rung, ms)) bundle = 'room:in';
  if (!bundle) return 'idle';
  // (never into a leaf still swinging: a door kicked or pushed by the keys is 'open' at once, its leaf at its stop only at its
  // swing's end (model.js leafClosed), and the #2 cued in that while walked into it (2026-11-12, the gauges' F1: a recruit's
  // fuzz lane, the #2 0.14 m into room 1's leaf on his lane))
  if (bundle === 'room:in' && plan.door && leafClosed(state, plan.door, ms)) return 'idle';
  // (R2 a: nor into a live grenade, silently: one lying in the room he would go into, or within its stun line of his way in
  // (burst.js liveIn); its burst lets him go, "the bang, then in". Before it nothing read one: the hunt's recipe had him start his
  // entry 1.6 s before the burst, and chaosT's recruit on 48218 walked him into the doorway at 178.6 kPa)
  if (bundle === 'room:in' && !inside2 && liveIn(state, plan, entryPath(plan, sideOf(state, here.door, 2)))) return 'idle';
  // (nor into a doorway you stand in, or stand on his way through: he holds at his stack, outside it, until you are through
  // (the rework's R8b, the user, 2026-11-13: "soldiers need to stay fluidly moving"; never a queue in the door))
  // (v0.0.19: the other side (sideFor, team.js): you past the threshold on his side, he takes yours, decided once a room; his way
  // in then your lane's, its crossing read on it)
  const side = bundle === 'room:in' && !inside2 && (inside1 || cut) ? sideFor(state, bus, rec, here, me, a, ms) : sideOf(state, here.door, 2);
  // (the build sheet v0.0.20 items 1 and 9: held on his cue TWO_PIN_MS by you standing outside the doorway, his walk in routed round you (entryRound))
  let round = null;
  if (bundle === 'room:in' && !inside2 && !crossingClear(state, entryPath(plan, side), [a.x, a.z])) {
    round = inside1 || cut ? entryRound(state, rec, a, here, me, rung, ms) : null;
    if (!round) { blockedCall(state, bus, rec, ms, inside1 || cut); return 'idle'; }
  }
  blockEnd(state, rec, ms);
  // (his beats at his own rung, the recruit's #2 his muzzle on the door as the recruit's; only the groups are rung 2's, his
  // keys being the drill's (the fixer's of 0.0.12: planned at rung 2 or above, a private's #2 stacked a muzzleS quicker))
  // (the build sheet v0.0.20 item 8: closed up on your heels, he flows in behind you at Fast, as the entry from rung 3 does (entryStance))
  let p = round ?? planBundle(state, rec.pid, bundle, { door: here.door, slot: 2, rung, atMs: ms, from: [a.x, a.z], ...(bundle === 'room:in' && onHeels ? { variant: { stance: 'assault' } } : {}) });
  if (!p) return 'idle';
  // (going to the next stack from further back than you are (his point deep in the room, yours by its door; or you left first),
  // he hurries: his approach at Fast when his walk to his stack is HURRY_M longer than yours to your own, so he is on his slot
  // as you stand on yours (the rework's R9, 2026-11-13: F17, the fuzz walked from room 1's door at once while he stood on his
  // point, and he came up 2.19 m short; the same with the sergeant, 4.04 m))
  const myLeft = me ? pathLen(wayOf(state, [[me.x, me.z], stackOf(plan, 1)], [plan.door].filter(Boolean))) : 0, hisApp = p.beats.find(b => b.key === 'approach');
  if (stackRow && hisApp?.path && pathLen(hisApp.path) > myLeft + HURRY_M) p = planBundle(state, rec.pid, bundle, { door: here.door, slot: 2, rung, atMs: ms, from: [a.x, a.z], hurry: true }) ?? p;
  delete rec.wait;
  // (his start: now, or later by the least delay that keeps his walk off yours (a stack row's only); the doing waits for it)
  const at = stackRow ? ms + giveWay(state, rec, a, p, me, ms) : ms;
  rec.doing = { who: rec.pid, step: `drill:${bundle}>${here.door}`, kind: 'bundle', bundle, tempo: 'normal', rung, slot: 2, ...(p.side ? { side: p.side } : {}), door: here.door, variant: p.variant, beats: p.beats.map(b => ({ ...b, st: 'wait' })),
    lanes: {}, subs: [], fromMs: at, atMs: at, untilMs: at, untilPlanMs: at + p.ms, seams: [] };
  bus?.emit('bundle', { phase: 'start', who: rec.pid, id: rec.doing.step, beat: null, ch: null, atMs: at, label: p.label, ms: p.ms });
  return 'running';
}
/**
 * The #2's task this tick (v0.0.19; runSlot): R.house.two.task 'ordered' at the lane's door, you off the stack's front point (his
 * walk there never into you), his task bundle (drills/enter-and-clear.js TEAM_TASKS: "two:bang", "two:pry", "two:ram",
 * "two:charge") planned from where he stands, the task 'working'; belayed ("As you were") with a device in his hands, its way out
 * (devices.js wayOut: the pin back in and the pouch, a tool let go) on his hands. Returns his doing's state, or null to go on.
 */
export function taskSlot(state, bus, rec, a, here, rung, ms = state.clock.ms) {
  const t = rec.task;
  if (!t) return null;
  // (a task that failed with his charge left on the door (a misfire): taken off as on As you were, so the door is yours again)
  if (t.st === 'failed' && t.door === here.door && !handDeviceOf(state, rec.pid)) return recoverSlot(state, bus, rec, a, here, rung, ms);
  if (t.st === 'belayed') {
    const h = handDeviceOf(state, rec.pid);
    // (his charge left on the door (placed, or primed with its fuse not yet running): to the front, the charge off, back to his own
    // point ('two:recover'); v0.0.19's first build left it there, nothing able to fire or clear it, the DI's line flipping a tick at a
    // time and the leg passed by the stall with your "charge" fault: the review of 2026-11-16)
    if (!h) return t.door === here.door ? recoverSlot(state, bus, rec, a, here, rung, ms) : null;
    if (rec.last?.step === 'drill:stowdev' && ms < rec.last.untilMs) return null;
    // (his way out by devplan.js handsPath, the planner's over his belief (the build sheet 0.0.19 §3.2, once K merged); D1's wayOut
    // where it finds none)
    const hp = handsPath(state, rec.pid), way = wayOut(h.kind, h.st, DEVICES[h.model]) ?? [], roller = rollerOf(state, rec.pid);
    const ms0 = hp?.path ? hp.ms : way.reduce((n, act) => n + (DEVICE_ACTIONS[act] ? deviceMs(roller, act) : 0), 0);
    const beat = { key: 'stow', k: 'stowdev', ch: 'hands', how: h.kind === 'tool' ? 'drop' : 'stow', ms: ms0, after: [], cut: false, door: here.plan.door ?? null, plan: here.door, slot: 2, st: 'wait', fromMs: null, untilMs: null };
    rec.doing = { who: rec.pid, step: 'drill:stowdev', kind: 'bundle', bundle: null, tempo: 'normal', rung, slot: 2, door: here.door, variant: {}, beats: [beat], lanes: {}, subs: [], fromMs: ms, atMs: ms, untilMs: ms, untilPlanMs: ms + ms0, seams: [] };
    return 'running';
  }
  if (t.st !== 'ordered' || t.door !== here.door) return null;
  if (frontHeld(state, bus, rec, here, ms)) return 'idle';
  const id = t.kind === 'bang' ? 'two:bang' : `two:${t.how ?? 'pry'}`;
  const p = planBundle(state, rec.pid, id, { door: here.door, slot: 2, rung, atMs: ms, from: [a.x, a.z], variant: { by: 2, ...(t.kind === 'bang' ? { bang: 'flash' } : { breach: t.how }) } });
  if (!p || !p.beats.some(b => b.key === 'front')) { t.st = 'failed'; t.why = 'no plan'; return null; }
  rec.doing = { who: rec.pid, step: `drill:${id}>${here.door}`, kind: 'bundle', bundle: id, tempo: 'normal', rung, slot: 2, door: here.door, variant: p.variant, task: true, beats: p.beats.map(b => ({ ...b, st: 'wait' })),
    lanes: {}, subs: [], fromMs: ms, atMs: ms, untilMs: ms, untilPlanMs: ms + p.ms, seams: [] };
  t.st = 'working';
  bus?.emit('bundle', { phase: 'start', who: rec.pid, id: rec.doing.step, beat: null, ch: null, atMs: ms, label: p.label, ms: p.ms });
  return 'running';
}
/** Whether you stand on the stack's front point (the body gap of it), where your #2's task walks to (taskSlot holds him off it; cqb.js cqb-task says so). */
export const onFront = (plan, me) => !!plan?.stack && !!me && dist([me.x, me.z], stackOf(plan, 1)) < BODY_GAP_M + GAP_GUARD_M;
/** Your #2's charge on a door (placed or primed): { id, st, live (its fuse running: it bursts, nobody takes it off) }, or null; what his As you were takes off (taskSlot; cqb.js cqb-task). */
export function twoChargeOn(state, door) {
  const pid = houseOf(state)?.two?.pid, c = pid && door ? placedOn(state, door, pid) : null;
  return c ? { ...c, live: Number.isFinite(state.items[c.id]?.fuseAtMs) } : null;
}
// (you on the stack's front point, his way to it: held, and once TWO_BLOCK_SAY_MS long his "Give me the door!" (TEAM_WORDS.front), once
// a hold (rec.front, gone as you step off); v0.0.19's first build waited silent: the review of 2026-11-16)
function frontHeld(state, bus, rec, here, ms) {
  if (!onFront(here.plan, playerActor(state))) { if (rec.front) delete rec.front; return false; }
  frontSay(state, bus, rec, ms);
  return true;
}
// (his hold on his way to the front timed on his record (rec.front { fromMs, said }), his call once it is TWO_BLOCK_SAY_MS long:
// held before his task bundle starts (frontHeld) or on its walk to the front by the body gap (runSlot))
function frontSay(state, bus, rec, ms) {
  const F = (rec.front ??= { fromMs: ms, said: false });
  if (F.said || ms - F.fromMs < TWO_BLOCK_SAY_MS) return;
  F.said = true;
  bus?.emit('say', { who: rec.pid, text: TEAM_WORDS.front.words, kind: 'speech', durMs: Math.round(CALL_FLOW_S * 1000), call: 'front' });
}
// (his charge taken off the door on As you were (taskSlot): 'two:recover' planned from where he stands while a charge of his is on
// the lane's door and its fuse not running, you off the front point (frontHeld); null where there is none)
function recoverSlot(state, bus, rec, a, here, rung, ms) {
  const c = twoChargeOn(state, here.plan.door);
  if (!c || c.live) return null;
  if (rec.last?.step === `drill:two:recover>${here.door}` && ms < rec.last.untilMs) return null;
  if (frontHeld(state, bus, rec, here, ms)) return 'idle';
  const p = planBundle(state, rec.pid, 'two:recover', { door: here.door, slot: 2, rung, atMs: ms, from: [a.x, a.z], variant: { by: 2 } });
  if (!p || !p.beats.some(b => b.key === 'recover')) return null;
  rec.doing = { who: rec.pid, step: `drill:two:recover>${here.door}`, kind: 'bundle', bundle: 'two:recover', tempo: 'normal', rung, slot: 2, door: here.door, variant: p.variant, beats: p.beats.map(b => ({ ...b, st: 'wait' })),
    lanes: {}, subs: [], fromMs: ms, atMs: ms, untilMs: ms, untilPlanMs: ms + p.ms, seams: [] };
  bus?.emit('bundle', { phase: 'start', who: rec.pid, id: rec.doing.step, beat: null, ch: null, atMs: ms, label: p.label, ms: p.ms });
  return 'running';
}
/**
 * The #2's side at the lane's door (v0.0.19, FM 3-06.11 §3-29: "#2 moves in the direction opposite #1"; team.js): the side
 * decided for the door (R.house.two.side), else, with TEAM_OPPOSITE and you past the threshold on his side (team.js sideTaken:
 * where you stand, or where a move of yours under way ends), his way along your lane clear of you (crossingClear: you in the
 * doorway across both lanes keeps v0.0.18's hold and "Coming in!"), yours taken (team.js takeOtherSide: saved, called); else
 * 2. Called at his cue (runSlot, entryAhead's plan reads the side after) and on his walk in short of his threshold.
 */
export function sideFor(state, bus, rec, here, me, a, ms = state.clock.ms) {
  const door = here?.door, plan = here?.plan, set = rec?.side?.[door];
  if (set) return set;
  if (!TEAM_OPPOSITE || !plan || !me || !a) return 2;
  const mv = moveNow(state, playerId(state)), end = mv?.prof && Number.isFinite(mv.untilMs) ? moveAt(mv, mv.untilMs) : null;
  const pos = end ? [end.x, end.z] : [me.x, me.z];
  if (!pastThreshold(plan, me.x, me.z) && !(end && pastThreshold(plan, pos[0], pos[1]))) return 2;
  const took = sideTaken(plan, pos[0], pos[1]);
  if (!took || took !== cornerRuleOf(plan, 2)?.side) return 2;
  // (you standing in a doorway (a no-stop zone), or across your own lane's way in: v0.0.18's hold and "Coming in!" (the play
  // review of 2026-11-15, tests/house-block.test.mjs); past the doorway on his lane, he takes yours instead of waiting on you)
  const area = state.places?.live?.area;
  if ((area && liveZoneAt(state, area, me.x, me.z)) || !crossingClear(state, entryPath(plan, 1), [a.x, a.z])) return 2;
  return takeOtherSide(state, bus, rec, plan, door, took, ms);
}
/**
 * The swap given back (v0.0.19, the review of 2026-11-16; runSlot): the door's sides swapped and you now past the threshold on your
 * own side (team.js sideTaken, where you stand or where a move of yours under way ends: the slot whose point is nearer, outside the
 * dead band), so his walk in on yours would end on you: team.js giveSideBack (the record dropped, his own side called). Returns
 * whether it was given back.
 */
export function sideBack(state, bus, rec, here, me, ms = state.clock.ms) {
  const door = here?.door, plan = here?.plan;
  if (rec?.side?.[door] !== 1 || !plan || !me) return false;
  const mv = moveNow(state, playerId(state)), end = mv?.prof && Number.isFinite(mv.untilMs) ? moveAt(mv, mv.untilMs) : null;
  const pos = end ? [end.x, end.z] : [me.x, me.z];
  if (!pastThreshold(plan, pos[0], pos[1])) return false;
  const took = sideTaken(plan, pos[0], pos[1]);
  if (!took || took !== cornerRuleOf(plan, 1)?.side) return false;
  giveSideBack(state, bus, rec, plan, door, ms);
  return true;
}
// (the #2's free body this tick (the rework's R8b, fluid movement): where his brake would leave him at rest in a no-stop zone (a
// doorway), carried through to his next point past it on his own lane (places/move.js throughTick), held off you as his walks
// are (gapHold); his head left on his man while he takes one (busy: the scene's); else the brake (coastTo))
export function freeBody(state, rec, a, ms, busy = false) {
  const t = throughTick(state, rec.pid, a, ms);
  if (!t) { coastTo(state, rec.pid, a, ms, { record: false }); return; }
  let p = moveAt(t, ms);
  if (gapHold(state, rec, a, p, ms, t.way === 'away' || t.way === 'aside')) {
    // (his carry into you, in a doorway: out of it the other way, away from you (throughAway), once)
    const me = playerActor(state), away = me ? unit([a.x - me.x, a.z - me.z]) : null, alt = t.way !== 'away' ? throughAway(state, rec.pid, a, away, ms) : null;
    if (alt) { a.through = alt; return freeBody(state, rec, a, ms, busy); }
    t.fromMs += TICK_MS; t.untilMs += TICK_MS; p = { ...moveAt(t, ms), x: a.x, z: a.z, vMs: 0, done: false };
  }
  placeAt(state, rec.pid, a, p.x, p.z); a.locoMs = ms;
  if (!busy) a.headRad = p.headRad;
  if (p.vMs > 0) a.v = [q(p.vMs * Math.cos(p.headRad), 0.001), q(p.vMs * Math.sin(p.headRad), 0.001)]; else delete a.v;
  if (p.done) delete a.through;
}
// ---- the #2 beside you: the entry gap, the body gap, going with you (COMBAT §25.19.3.4, §25.19.5) ----

// (a point's place along a path: the arc length of its projection, and how far off the path it stands)
function onPath(path, p) {
  let best = { s: 0, off: Infinity }, run = 0;
  for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1], [bx, bz] = path[i], L = Math.hypot(bx - ax, bz - az);
    const t = L > 0 ? Math.max(0, Math.min(1, ((p[0] - ax) * (bx - ax) + (p[1] - az) * (bz - az)) / (L * L))) : 0;
    const off = Math.hypot(p[0] - (ax + t * (bx - ax)), p[1] - (az + t * (bz - az)));
    if (off < best.off - 1e-9) best = { s: run + t * L, off };
    run += L;
  }
  return best;
}
/** How far #1 stands past his own threshold waypoint (m): along his entry path where he is on it (within ENTRY_OFF_M), else straight from it once past the threshold; null outside. */
export function pastWaypointM(plan, x, z) {
  const path = entryPath(plan, 1), th = onPath(path, plan.threshold ?? path[0]), me = onPath(path, [x, z]);
  if (me.off <= ENTRY_OFF_M) return me.s - th.s;
  if (!pastThreshold(plan, x, z)) return null;
  const w = alongPath(path, th.s);
  return Math.hypot(x - w[0], z - w[1]);
}
/** Off his path by more than this, #1's gap is measured straight from the waypoint (m; my call). */
export const ENTRY_OFF_M = 0.3;
// (the point s metres along a path)
function alongPath(path, s) {
  let left = s;
  for (let i = 1; i < path.length; i++) {
    const L = dist(path[i - 1], path[i]);
    if (left <= L || i === path.length - 1) { const k = L > 0 ? Math.max(0, Math.min(1, left / L)) : 0; return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * k, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * k]; }
    left -= L;
  }
  return path[0];
}
/** How far ahead #1's walk in is looked at for the entry's cue (ms; my call). */
export const ENTRY_AHEAD_MS = 4000;
/**
 * The entry's cue ahead of time (see ENTRY_GAP_M): your walk in running (its closed form), the #2 at his stack and the door
 * passable, he steps off on the first tick at which his own walk from rest (planned from where he stands, kept on his record
 * while he stands there) reaches his threshold waypoint no sooner than yours reaches ENTRY_GAP_M past your own.
 */
export function entryAhead(state, rec, a, here, me, rung, ms = state.clock.ms) {
  const plan = here.plan, lead = moveNow(state, playerId(state));
  if (!lead?.prof || (plan.door && (openingState(state, plan.door) !== 'open' || leafClosed(state, plan.door, ms)))) return false;
  // (when your walk reaches the gap: the first tick at or after ms, Infinity where it stops short)
  let t1 = Infinity;
  for (let t = ms; t <= Math.min(lead.untilMs ?? ms, ms + ENTRY_AHEAD_MS); t += TICK_MS) {
    const p = moveAt(lead, t), m = pastWaypointM(plan, p.x, p.z);
    if (m !== null && m >= ENTRY_GAP_M) { t1 = t; break; }
  }
  if (!Number.isFinite(t1)) return false;
  // (his time to his own threshold waypoint from rest, by his entry's walk as planned from his stack)
  const key = `${here.door}@${q(a.x, 0.01)},${q(a.z, 0.01)}`;
  if (rec.entryT?.key !== key) {
    const p2 = planBundle(state, rec.pid, 'room:in', { door: here.door, slot: 2, rung, atMs: ms, from: [a.x, a.z] }), mv = p2?.beats.find(b => b.key === 'enter' && b.prof);
    const path2 = entryPath(plan, sideOf(state, here.door, 2)), th2 = alongPath(path2, onPath(path2, plan.threshold ?? path2[0]).s), s2 = mv ? onPath(mv.path, th2).s : null;
    rec.entryT = { key, ms: mv && s2 !== null ? Math.round(profileWhen(mv.prof, s2) * 1000) : null };
  }
  return rec.entryT.ms !== null && ms + rec.entryT.ms >= t1;
}
/** Whether #1 is far enough in for the #2 to step in behind him (see ENTRY_GAP_M): rec the leg's record (its enteredAtMs). */
export function entryGo(state, plan, me, ms = state.clock.ms, rec = null) {
  if (!plan || !me) return false;
  if (plan.door && openingState(state, plan.door) !== 'open') return false;
  const m = pastWaypointM(plan, me.x, me.z);
  if (m !== null && m >= ENTRY_GAP_M) return true;
  // (a #1 who stopped inside (the keys' take-in brake, a planted shot) cues him after ENTRY_WAIT_MS: the body gap holds him off)
  return pastThreshold(plan, me.x, me.z) && Number.isFinite(rec?.enteredAtMs) && ms - rec.enteredAtMs >= ENTRY_WAIT_MS;
}
// ---- v0.0.20: on your heels, round you, the pair in the hall (the build sheet v0.0.20 items 1, 8, 9, 19) ----

/**
 * Whether you have left your stack toward the door (item 8): the door open and its leaf passable, you HEELS_FROM_M or more along
 * your own lane from your stack point (its projection, within ENTRY_OFF_M of it, or past the threshold), moving at CROSS_STILL_MS
 * or more. Read for the #2's heels beat below rung 3 (runSlot).
 */
export function heelsGo(state, plan, me, door, ms = state.clock.ms) {
  if (!plan?.door || !me || openingState(state, plan.door) !== 'open' || leafClosed(state, plan.door, ms)) return false;
  if (Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) < CROSS_STILL_MS) return false;
  const path = entryPath(plan, sideOf(state, door, 1)), at = onPath(path, [me.x, me.z]);
  return (at.off <= ENTRY_OFF_M && at.s >= HEELS_FROM_M) || pastThreshold(plan, me.x, me.z);
}
// (his heels beat begun (item 8): a feet beat of slot 2, `heels`, from his stack to your vacated stack point, routed, at your stance's
// walk, held off you by the body gap as every walk of his; rec.heels { door, atMs } kept, so his stack is there now (runSlot's onHeels)
// and his entry on his cue runs from where he stands. Its own beat here, not drills/enter-and-clear.js's table, where 'all-but-breach'
// would plan it into every "clear the room" (beatsOf: every key but the kit's and TEAM_BEATS))
const HEELS_BEAT = Object.freeze({ k: 'move', ch: 'feet', to: 'stack', slots: Object.freeze([2]) });
function heelsStart(state, bus, rec, a, here, me, rung, ms) {
  const D = HEELS_BEAT, to = stackOf(here.plan, 1), st = me.moveStance === 'assault' ? 'assault' : 'combat';
  const path = wayOf(state, [[a.x, a.z], to], [here.plan.door].filter(Boolean)), legs = legsOf(state, rec.pid, a.x, a.z);
  const P = profileOf(pathLen(path), legs.walk[st] ?? legs.walk.combat, legs.pushMs2, legs.brakeMs2);
  const beat = { key: 'heels', k: D?.k ?? 'move', ch: D?.ch ?? 'feet', stance: st, path, prof: P, ms: Math.round(P.T * 1000), arriveMs: Math.round(profileWhen(P, Math.max(0, P.L - ARRIVE_M)) * 1000), after: [], cut: true, door: here.plan.door, plan: here.door, slot: 2, st: 'wait', fromMs: null, untilMs: null };
  rec.heels = { door: here.door, atMs: ms };
  rec.doing = { who: rec.pid, step: `drill:heels>${here.door}`, kind: 'bundle', bundle: null, tempo: 'normal', rung, slot: 2, door: here.door, variant: {}, beats: [beat], lanes: {}, subs: [], fromMs: ms, atMs: ms, untilMs: ms, untilPlanMs: ms + beat.ms, seams: [] };
  bus?.emit('bundle', { phase: 'start', who: rec.pid, id: rec.doing.step, beat: null, ch: null, atMs: ms, label: 'On his heels', ms: beat.ms });
  return 'running';
}
// (you standing still outside a doorway: not moving, no walk of yours under way, not in a no-stop zone)
function standingOut(state, me, held = false) {
  const area = state.places?.live?.area, mine = moveNow(state, playerId(state));
  return !!me && !moving(me) && (!mine || (held && heldStill(state, mine))) && !(area && liveZoneAt(state, area, me.x, me.z));
}
// (your walk held by a body on your last tick (places/move.js pinTick; your move ticks after his): you stand as surely as with none.
// v0.0.20 (my call): each of you held by the other, his walk was rounded only once yours ended at PIN_END_MS, the tick after, 1.85 s
// into his hold (the gauges' F46, the private's fuzz lane on 1037: your Stack up and his heels beat at room 1's stack, 0.51 m apart);
// gapHold counts it standing, so his way round (or his walk ended, and then his step off yours) comes at TWO_PIN_MS)
const heldStill = (state, mv) => Number.isFinite(mv?.heldAtMs) && mv.heldAtMs >= state.clock.ms - TICK_MS;
// (items 1 and 9: his walk in, held on his cue TWO_PIN_MS by you standing outside the doorway on its stretch, planned round you
// (places/move.js roundAbout on its enter beat: your disc the body gap and its guard), tried once each TWO_PIN_MS of the hold; the
// plan, or null where there is no way round or the way round still crosses you)
function entryRound(state, rec, a, here, me, rung, ms) {
  const B = rec.block;
  if (!B || ms - B.fromMs < TWO_PIN_MS || ms - (B.roundMs ?? -Infinity) < TWO_PIN_MS || !standingOut(state, me)) return null;
  B.roundMs = ms;
  const p = planBundle(state, rec.pid, 'room:in', { door: here.door, slot: 2, rung, atMs: ms, from: [a.x, a.z] }), mv = p?.beats.find(b => b.key === 'enter' && b.prof);
  const r = mv ? roundAbout(state, rec.pid, a, mv, { x: me.x, z: me.z, gapM: BODY_GAP_M }, ms) : null;
  if (!r || !crossingClear(state, r.path, [a.x, a.z])) return null;
  const was = mv.ms, lead = Number.isFinite(mv.arriveMs) ? Math.max(0, was - mv.arriveMs) : null;
  Object.assign(mv, { path: r.path, prof: r.prof, ms: r.untilMs - r.fromMs });
  if (lead !== null) mv.arriveMs = Math.max(0, mv.ms - lead);
  p.ms += mv.ms - was;
  (rec.rounds ??= { n: 0 }).n += 1;
  return p;
}
// (items 1 and 9: his walk or carry under way held by your body TWO_PIN_MS (gapHold), you standing outside a doorway: routed round you
// from where he stands, its time from now (the caller's hold then slides it a tick); in the hall this takes its other wall. Returns
// whether it was)
function twoRound(state, rec, a, mv, ms) {
  const me = playerActor(state);
  if (!me) return false;
  const r = roundAbout(state, rec.pid, a, mv, { x: me.x, z: me.z, gapM: BODY_GAP_M }, ms);
  if (!r) return false;
  const was = mv.untilMs, lead = Number.isFinite(mv.arriveMs) ? Math.max(0, (was - mv.fromMs) - mv.arriveMs) : null;
  Object.assign(mv, { path: r.path, prof: r.prof, fromMs: r.fromMs, untilMs: r.untilMs, ms: r.untilMs - r.fromMs });
  if (lead !== null) mv.arriveMs = Math.max(0, mv.ms - lead);
  if (rec.doing?.beats?.includes(mv) && Number.isFinite(rec.doing.untilPlanMs)) rec.doing.untilPlanMs += r.untilMs - was;
  (rec.rounds ??= { n: 0 }).n += 1;
  return true;
}
// (the hall's axis, from #1's lane: its unit heading, or null)
function hallAxis(state) {
  const P = planOf(state, 'hall'), path = P ? entryPath(P, 1) : null;
  return path?.length >= 2 ? unit([path.at(-1)[0] - path[0][0], path.at(-1)[1] - path[0][1]]) : null;
}
const alongAxis = (u, p) => p[0] * u[0] + p[1] * u[1];
/** Your lead over your #2 along the hall's axis (m; negative when he is ahead), or null off the hall's leg or with no #2 (item 19; cqb.js cqb-pair reads it). */
export function hallLead(state) {
  const H = houseOf(state), two = H?.two?.pid ? actorOf(state, H.two.pid) : null, me = playerActor(state), u = hallAxis(state);
  if (!two || !me || !u || doorNow(state, playerId(state))?.door !== 'hall') return null;
  // (the drawn house: only once you stand in the hall; a cross entry into the last room leaves #1's point downrange of his,
  // so in the room you led him by 3 m before either had left it, "Wait for him." while he waited for you to go, the hall passed at 90 s)
  const P = planOf(state, 'hall');
  if (P && !P.rects.some(r => me.x >= r[0] && me.x <= r[2] && me.z >= r[1] && me.z <= r[3])) return null;
  return alongAxis(u, [me.x, me.z]) - alongAxis(u, [two.x, two.z]);
}
// (item 19: his next place p in the hall, past its threshold, more than HALL_LEAD_M ahead of you along its axis and on from where he
// stands: held a tick, counted on his record (rec.hall))
function hallHold(state, rec, a, p, mv, ms) {
  if (rec.doing?.door !== 'hall') return false;
  const P = planOf(state, 'hall'), u = hallAxis(state), me = playerActor(state);
  if (!P || !u || !me || !pastThreshold(P, p.x, p.z)) return false;
  const next = alongAxis(u, [p.x, p.z]);
  if (!(next > alongAxis(u, [me.x, me.z]) + HALL_LEAD_M && next > alongAxis(u, [a.x, a.z]) + 1e-6)) return false;
  const G = (rec.hall ??= { ms: 0 });
  G.ms += TICK_MS;
  return true;
}
// (item 19: you leading him by more than HALL_PAIR_M along the hall, his walk there planned again at Fast from where he stands, once
// a walk (mv.hurried), from rung 2, where T walks you both: below it you walk the hall by the keys and the DI's cqb-pair asks you to
// wait for him (my call: at Fast his hall ended 1.7 s sooner on the private by the keys, which with ENTRY_WAIT_MS's 0.6 s a room put
// the gauges' F21 band's ten-seed mean at -11.7%, outside its 10%). Returns whether it was)
function hallHurry(state, rec, a, mv, ms) {
  if (mv.hurried || mv.stance === 'assault' || (rec.rung ?? rungOf(state, rec.pid, 'room')) < 2) return false;
  const lead = hallLead(state), P = planOf(state, 'hall');
  if (lead === null || lead <= HALL_PAIR_M || !P || !pastThreshold(P, a.x, a.z)) return false;
  const at = moveAt(mv, ms), rest = [[at.x, at.z], ...restOf(mv.path, [at.x, at.z]).slice(1)];
  const legs = legsOf(state, rec.pid, at.x, at.z), P2 = profileOf(pathLen(rest), legs.walk.assault, legs.pushMs2, legs.brakeMs2, { v0: at.vMs, v1: mv.prof.v1 ?? 0 });
  const was = mv.untilMs, lead0 = Number.isFinite(mv.arriveMs) ? Math.max(0, (was - mv.fromMs) - mv.arriveMs) : null;
  Object.assign(mv, { path: rest, prof: P2, fromMs: ms, untilMs: ms + Math.round(P2.T * 1000), stance: 'assault', hurried: true });
  mv.ms = mv.untilMs - mv.fromMs;
  if (lead0 !== null) mv.arriveMs = Math.max(0, mv.ms - lead0);
  if (Number.isFinite(rec.doing?.untilPlanMs)) rec.doing.untilPlanMs += mv.untilMs - was;
  (rec.hall ??= { ms: 0 }).hurried = (rec.hall.hurried ?? 0) + 1;
  return true;
}
// ---- the #2 and the doorway (the rework's R8b, fluid movement: places/zones.js's no-stop zones) ----

/** How far past a doorway's edge the #2's way through it must be clear of you before he steps into it (m: the body gap, my call). */
export const CROSS_CLEAR_M = BODY_GAP_M;
/** You moving at this or more, or on a move of the game's, are passing through, not standing in his way (m/s: the gauges' still speed). */
export const CROSS_STILL_MS = 0.3;
// (a polyline from its point nearest `from` on: the arc s of that point, and the path's points after it)
function restOf(path, from) {
  const pr = onPath(path, from);
  let run = 0;
  for (let i = 1; i < path.length; i++) {
    const L = dist(path[i - 1], path[i]);
    if (run + L >= pr.s - 1e-9) return [alongPath(path, pr.s), ...path.slice(i)];
    run += L;
  }
  return [path[path.length - 1]];
}
// (the least distance from a point to a polyline)
function toLine(path, p) { return onPath(path, p).off; }
/**
 * Whether the #2's way through a doorway is clear of you (see CROSS_CLEAR_M): along his path from where he stands, the stretch
 * that lies in a no-stop zone and CROSS_CLEAR_M past its last point in one, with you not standing within the body gap (and its
 * guard) of it. You on the move are no block: you never come to rest in a doorway but by your own choice (places/move.js
 * throughOf), so he follows you through it, the body gap kept (gapHold). True where his path crosses no zone.
 */
export function crossingClear(state, path, from) {
  const me = playerActor(state), area = state.places?.live?.area;
  if (!me || !area || !path?.length) return true;
  if (Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) >= CROSS_STILL_MS || moveNow(state, playerId(state))) return true;
  const pts = crossingOf(path, from, (x, z) => !!liveZoneAt(state, area, x, z));
  if (!pts) return true;
  return pts.length < 2 ? dist(pts[0], [me.x, me.z]) >= BODY_GAP_M + GAP_GUARD_M : toLine(pts, [me.x, me.z]) >= BODY_GAP_M + GAP_GUARD_M;
}
/** The crossing's samples along a path (m: a zone's edge found to this, mid-leg as at a waypoint). */
export const CROSS_STEP_M = 0.05;
/**
 * The stretch of a path from its point nearest `from` through the no-stop zone it crosses and CROSS_CLEAR_M past the zone's
 * last point on it, cut there (inZone(x, z)): a polyline, or null where the path crosses no zone. 2026-11-15 (the user: "squad
 * AI sometimes stays out of the room on entry (room 2)"): v0.0.14 to v0.0.16 kept the whole leg on which the stretch ended, so
 * room 2's #2, whose lane runs 1.5 m straight in from the doorway to his point, was held at his stack by you standing anywhere
 * within the body gap of that leg, as deep as his point, for as long as you stood there (my probe: 36 of 91 places in the room).
 */
export function crossingOf(path, from, inZone) {
  const rest = restOf(path, from), pts = [rest[0]];
  let inside = inZone(rest[0][0], rest[0][1]), past = 0, last = rest[0];
  for (let i = 1; i < rest.length; i++) {
    const a = rest[i - 1], b = rest[i], l = dist(a, b), n = Math.max(1, Math.ceil(l / CROSS_STEP_M));
    for (let k = 1; k <= n; k++) {
      const p = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n], z = inZone(p[0], p[1]), step = dist(last, p);
      if (z) { inside = true; past = 0; }
      else if (inside) {
        // (the stretch past the zone, cut at CROSS_CLEAR_M of it)
        if (past + step >= CROSS_CLEAR_M) { const t = step > 0 ? (CROSS_CLEAR_M - past) / step : 0; pts.push([last[0] + (p[0] - last[0]) * t, last[1] + (p[1] - last[1]) * t]); return pts; }
        past += step;
      }
      last = p;
    }
    pts.push(b);
  }
  return inside ? pts : null;
}
// (held by you where he must not wait: in a doorway, or where your own move is held by his body (both standing, each in the
// other's way: the fuzz's lanes stood them 4 to 6 minutes): his doing halted ('two') and a walk out of your way, back to his
// stack at the lane's door where he is off it (places/move.js stepAside), else out of the doorway away from you (throughAway);
// his entry cued again only once his way through is clear (crossingClear). Returns whether he gave way)
function giveWayOut(state, bus, rec, a, ms) {
  const area = state.places?.live?.area, me = playerActor(state);
  if (!area || !me) return false;
  const inZone = !!liveZoneAt(state, area, a.x, a.z), mine = moveNow(state, playerId(state)), stuck = !!mine && mine.heldAtMs === ms;
  if (!inZone && !stuck) return false;
  // (never for you going on ahead of him, opening the gap at CROSS_STILL_MS or more and your walk not held: his hold then lasts the tick or
  // two you take to go on, and a give-way turned him back into the room and planned him again behind you (the review of 2026-11-16:
  // F17, the tier one's fuzz lane on 1074, his stack 1.503 m off as you reached yours); you coming at him, he gives way as ever)
  const vx = me.v?.[0] ?? 0, vz = me.v?.[1] ?? 0, dx = me.x - a.x, dz = me.z - a.z, d = Math.hypot(dx, dz);
  if (!stuck && d > 0 && (vx * dx + vz * dz) / d >= CROSS_STILL_MS) return false;
  const here = doorNow(state, playerId(state)), st = here ? stackOf(here.plan, 2) : null;
  const t = (st && dist([a.x, a.z], st) > STACK_NEAR_M ? stepAside(state, rec.pid, a, st, ms) : null) ?? (inZone ? throughAway(state, rec.pid, a, unit([a.x - me.x, a.z - me.z]), ms) : null);
  // (your walk held by him with either of you in a doorway, and that step ending on your walk's path (or none): off your
  // walk's path at once (stepOffPath with no wait), never both of you held there, each on the other (the review of 2026-11-16: F4,
  // the tier one's fuzz lane on 1037: his step out of the doorway ended 0.3 m off it, your walk through room 1's doorway still held
  // by him and his walk to his stack beyond you by you, 2 s and pressed again))
  // (and the same with your walk coming at him, before it is held: his step out of the doorway ahead of it, 0.3 m, was onto it)
  const onMine = (p) => !!mine?.path?.length && pathDist([[me.x, me.z], ...mine.path], p) < BODY_GAP_M + GAP_GUARD_M;
  if (mine && (inZone || youInDoor(state, me)) && (!t || onMine(t.path.at(-1))) && stepOffPath(state, bus, rec, a, ms, 0, true)) return true;
  if (!t) return false;
  haltDoing(state, bus, rec.doing, 'two', null, ms);
  advanceBeats(state, bus, rec.doing, ms);
  rec.last = { step: rec.doing.step, untilMs: ms, why: 'two' };
  rec.doing = null;
  a.through = t;
  (rec.gave ??= { n: 0 }).n += 1;
  return true;
}
const unit = (d) => { const l = Math.hypot(d[0], d[1]); return l > 1e-9 ? [d[0] / l, d[1] / l] : null; };
// (you standing in a live no-stop zone (a doorway), where no hold may last (the gauges' F4: none over 0.3 s at once))
const youInDoor = (state, me) => { const area = state.places?.live?.area; return !!me && !!area && !!liveZoneAt(state, area, me.x, me.z); };
// (the build sheet v0.0.20 §0 item 25: a #2 on a task of yours (v0.0.19 T: his task bundle, or its record working) or on its walks
// (give, front, stepback, closeup) never gives way: he is walked round (places/move.js roundAbout), his task never cut for your walk)
const TASK_WALKS = Object.freeze(new Set(['give', 'front', 'stepback', 'closeup']));
const onTask = (rec) => !!rec?.doing?.task || rec?.task?.st === 'working' || !!rec?.doing?.beats?.some(b => b.st === 'run' && TASK_WALKS.has(b.key));
// (a body moving (above the brake's rest, 0.05 m/s))
const moving = (a) => Math.hypot(a?.v?.[0] ?? 0, a?.v?.[1] ?? 0) > 0.05;
// (a point's least distance from a path's segments)
function pathDist(path, p) {
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i], vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz;
    const t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / l2)) : 0;
    best = Math.min(best, Math.hypot(a[0] + vx * t - p[0], a[1] + vz * t - p[1]));
  }
  return best;
}
/**
 * Your bundle's walk held by his standing body (the dead-end hunt of 2026-11-16: "Clear the room" from beside your stack on the
 * sergeant's 7091 ran a straight line to it through your #2 standing on his own, and the body gap held you there for 89 s,
 * Backspace, G, X and the keys doing nothing, until the stall passed the room; Stack up the same at room 3): once held
 * OFF_PATH_AFTER_MS, he steps off your walk's path (places/move.js stepAside: routed, walkable, never into you or a doorway),
 * to the nearest of the points beside where he stands that keep the body gap and GIVE_MARGIN_M off its whole length, his own
 * doing halted ('two') and planned again from there. Returns whether he stepped.
 */
function stepOffPath(state, bus, rec, a, ms, afterMs = OFF_PATH_AFTER_MS, ahead = false) {
  const me = playerActor(state), mine = moveNow(state, playerId(state));
  if (!me || !mine?.path?.length || onTask(rec)) return false;
  // (held OFF_PATH_AFTER_MS (afterMs); or, idle (`ahead`, v0.0.20), as soon as your walk's next OFF_PATH_LOOK_M closes on him inside the
  // body gap: he is off it before you reach him (the review of 2026-11-16: F4, his heels beat left him on your stack point and your
  // Stack up back to it was held in the doorway 0.65 s, the private's fuzz lane on 1592 and nine more of 120))
  if (mine.heldAtMs === ms ? (mine.held ?? 0) < afterMs : !(ahead && closingAhead(mine, me, a))) return false;
  const path = [[me.x, me.z], ...mine.path], want = BODY_GAP_M + GAP_GUARD_M + GIVE_MARGIN_M;
  // (the walk's heading where it passes him, and its normal: points beside him, off either side, a little back and on)
  let seg = null, bd = Infinity;
  for (let i = 1; i < path.length; i++) { const d = pathDist([path[i - 1], path[i]], [a.x, a.z]); if (d < bd) { bd = d; seg = [path[i - 1], path[i]]; } }
  const u = seg ? unit([seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]]) : null;
  if (!u) return false;
  const n = [-u[1], u[0]], tries = [];
  for (const k of [want + 0.05, want + 0.3, want + 0.6]) for (const side of [1, -1]) for (const along of [0, -0.4, 0.4]) {
    const to = [q(a.x + n[0] * k * side + u[0] * along, 1e-4), q(a.z + n[1] * k * side + u[1] * along, 1e-4)];
    if (pathDist(path, to) >= want) tries.push({ to, d: Math.hypot(to[0] - a.x, to[1] - a.z) });
  }
  tries.sort((x, y) => x.d - y.d);
  for (const { to, d } of tries) {
    const t = stepAside(state, rec.pid, a, to, ms);
    if (!t || t.path.some((p, i) => i > 0 && pathDist(path, p) < BODY_GAP_M + GAP_GUARD_M)) continue;
    // (a step, never a walk round a wall: a point beside him through the wall was routed through room 2's doorway, 3.5 s,
    // and he reached room 3's stack 3.78 m behind you (the review's F17, the private's fuzz lane on 1296))
    if (pathLen(t.path) > d + OFF_PATH_DETOUR_M) continue;
    if (rec.doing) { haltDoing(state, bus, rec.doing, 'two', null, ms); advanceBeats(state, bus, rec.doing, ms); rec.last = { step: rec.doing.step, untilMs: ms, why: 'two' }; rec.doing = null; }
    a.through = t;
    (rec.gave ??= { n: 0 }).n += 1;
    return true;
  }
  return false;
}
/** v0.0.20: how far along your walk ahead of you the #2, idle, looks for his body in its way (m; my call: at your Combat walk, his step aside's half second); and the most his step off it may run beyond the straight line to its point (m; my call: a step round a corner, never a walk round a wall). */
export const OFF_PATH_LOOK_M = 1.0, OFF_PATH_DETOUR_M = 0.5;
// (your walk's path from where you stand, its next OFF_PATH_LOOK_M sampled every 5 cm, passing within the body gap and its guard of a
// standing body and closer than you stand to it now)
function closingAhead(mine, me, b) {
  const pts = [[me.x, me.z], ...restOf(mine.path, [me.x, me.z]).slice(1)], now = dist([me.x, me.z], [b.x, b.z]), lim = BODY_GAP_M + GAP_GUARD_M;
  let run = 0;
  for (let i = 1; i < pts.length && run < OFF_PATH_LOOK_M; i++) {
    const p0 = pts[i - 1], p1 = pts[i], l = dist(p0, p1), n = Math.max(1, Math.ceil(l / 0.05));
    for (let k = 1; k <= n && run < OFF_PATH_LOOK_M; k++) {
      const d = dist([p0[0] + (p1[0] - p0[0]) * k / n, p0[1] + (p1[1] - p0[1]) * k / n], [b.x, b.z]);
      run += l / n;
      if (d < lim && d < now - 1e-6) return true;
    }
  }
  return false;
}
// (the doorway's gate for the #2's walk this tick: his next place p in a no-stop zone he is not yet in, his way through it not
// clear of you (crossingClear): held a tick where he stands, outside it, counted on his record (rec.gate))
function zoneGate(state, rec, a, p, mv, ms) {
  const area = state.places?.live?.area;
  const hold = !!area && !liveZoneAt(state, area, a.x, a.z) && !!liveZoneAt(state, area, p.x, p.z) && !crossingClear(state, mv.path, [p.x, p.z]);
  if (!hold) { if (rec.gate) rec.gate.runMs = 0; return false; }
  const G = (rec.gate ??= { holds: 0, ms: 0, runMs: 0 });
  if (!G.runMs) G.holds += 1;
  G.runMs += TICK_MS; G.ms += TICK_MS;
  return true;
}
// (the body gap's guard for the #2's walk this tick: his next place p closing within BODY_GAP_M + GAP_GUARD_M of yours; for his
// own carry out of your way (`giving`: way 'away' or 'aside', planned by places/move.js bodyClear to keep BODY_GAP_M off you), within
// BODY_GAP_M only, the bound it was planned to: the guard's 2 cm held a carry that passed 0.516 m from you for good, and your walk,
// held by his body, with it (the review of 2026-11-16: F4, the tier one's fuzz lane on 1037, both of you 2 s and more in room 1's
// doorway))
function gapHold(state, rec, a, p, ms, giving = false, bus = null) {
  const me = playerActor(state);
  if (!me) return false;
  const now = dist([a.x, a.z], [me.x, me.z]), next = dist([p.x, p.z], [me.x, me.z]), hold = next < BODY_GAP_M + (giving ? 0 : GAP_GUARD_M) && next < now - 1e-6;
  const G = (rec.gap ??= { holds: 0, ms: 0, maxMs: 0, runMs: 0 });
  // (a hold over: its way round tried afresh in the next (G.roundAt is the run's; kept across runs, the next was tried only at 3.05 s)
  if (!hold) { G.runMs = 0; delete G.roundAt; if (rec.block?.gap) blockEnd(state, rec, ms); return false; }
  if (!G.runMs) G.holds += 1;
  G.runMs += TICK_MS; G.ms += TICK_MS; G.maxMs = Math.max(G.maxMs, G.runMs);
  // (the build sheet v0.0.20 items 1 and 9: held TWO_PIN_MS by you standing outside a doorway, his walk or his carry (a doing's running move, else
  // actor.through) routed round you (twoRound); with no way round, his walk ended where he stands (G.stuck: runSlot halts his doing,
  // and he goes on from there once his way is clear, as from a give-way) and a carry 'aside' dropped (your walk over, he has nothing
  // to step aside from: the fuzz stood on one 22 s), never held longer (the gauges' F46 as the build sheet words it: "outside a
  // funnel, at most TWO_PIN_MS + his routed walk"; the review of 2026-11-16: he stood 43.5 s behind you on the private's 1074, a
  // route tried every 1.5 s)
  if (G.runMs >= TWO_PIN_MS && G.runMs - (G.roundAt ?? 0) >= TWO_PIN_MS && standingOut(state, me, true)) {
    const beat = rec.doing?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof) ?? (a.through?.prof ? a.through : null);
    G.roundAt = G.runMs;
    if (beat && !twoRound(state, rec, a, beat, ms)) { if (beat === a.through && beat.way === 'aside') delete a.through; else if (beat !== a.through) G.stuck = ms; }
  }
  // (and in a doorway, where no way round is, his calls as on his cue (blockedCall: "Coming in!" at TWO_BLOCK_SAY_MS, then every
  // TWO_BLOCK_REPEAT_MS; the DI's cqb-two-out at TWO_OUT_LINE_MS), the hold on the leg's record (blockEnd), the hold marked `gap` so his
  // cue's own record is never ended by it (the review of 2026-11-16: 41 s in room 2 behind you standing in its doorway, not a word))
  else if (bus && (!rec.block || rec.block.gap) && youInDoor(state, me) && !moving(me)) {
    const fresh = !rec.block;
    blockedCall(state, bus, rec, ms, true);
    if (fresh && rec.block) { rec.block.gap = true; rec.block.fromMs = ms - G.runMs + TICK_MS; }
  }
  return true;
}
/**
 * Your #2's walk to a stack whose leg is over (shoothouse.js endLeg, the stall's pass or a clear): his stack row for that door ('stack:up',
 * 'stack:point', or his heels beat onto your stack point) halted where he stands ('stall'), so his next tick plans the next leg's stack
 * from there, hurried as ever when his walk is the longer. v0.0.20 (my call): before it he walked the passed leg's stack row to its end;
 * the fuzz recruit on 1489397426, back on room 2's stack after his heels beat, had his Stack up at room 2 running when the stall passed
 * it (247.75 s), and he walked back to room 2's stack and stood its ready and squeeze (3.4 s more) before setting off: 3.41 m off his
 * slot when you stood on room 3's (the gauges' F17). Returns whether a doing was halted.
 */
export function twoLegOver(state, bus, rec, door, ms = state.clock.ms) {
  const d = rec?.doing;
  if (!d?.beats || d.halt || d.task || d.door !== door) return false;
  if (d.bundle !== 'stack:up' && d.bundle !== 'stack:point' && d.step !== `drill:heels>${door}`) return false;
  haltDoing(state, bus, d, 'stall', null, ms); advanceBeats(state, bus, d, ms);
  rec.last = { step: d.step, untilMs: ms, why: 'stall' }; rec.doing = null;
  return true;
}
/**
 * The body gap's hold over once nothing of his walks is left to hold (the scene's #2 tick, after runSlot or freeBody): no move beat
 * of his doing running and no carry (actor.through), so gapHold was not asked this tick and his walk is held by nobody; the run's
 * record closed as a tick with no hold closes it (rec.gap.runMs 0, its way round forgotten, a doorway's hold ended on the leg's
 * record). v0.0.20 (my call): his walk ended where he stands (G.stuck, no way round you) or his carry aside dropped left runMs at
 * the hold's 1.85 s for as long as he then stood, 27.6 s behind you on the private's fuzz lane on 1037 (the gauges' F46, 556
 * ticks), and a hold begun after it counted on from there (its "Coming in!" dated 1.85 s early). Returns whether a run was closed.
 */
export function gapSettle(state, rec, ms = state.clock.ms) {
  const G = rec?.gap, a = rec?.pid ? actorOf(state, rec.pid) : null;
  if (!G?.runMs || !a) return false;
  if (a.through || rec.doing?.beats?.some(b => b.st === 'run' && b.k === 'move' && b.prof)) return false;
  G.runMs = 0; delete G.roundAt; delete G.stuck;
  if (rec.block?.gap) blockEnd(state, rec, ms);
  return true;
}
// (you have gone for the next stack: your own move running, or LEAD_GONE_M from where you stood when he began to wait, or there)
function leadGone(state, rec, here, me) {
  if (!me) return true;
  if (moveNow(state, playerId(state))) return true;
  // (or standing still near enough your stack to work its door (DOOR_REACH_M): the fuzz recruit on seed 1333 stopped 1.0 m short
  // of room 3's stack and opened the door, and his #2, 4.9 m off and still waiting, was handed back as 'two' (the review of
  // v0.0.18: F17); never while you still walk in by the keys, whose walk his giveWay cannot see, nor where his straight way to his
  // stack would pass you (the boot recruit by T stood on room 3's stack 1.5 m from the hall's, and his #2 walked into him, held 3.1 s))
  if (!moving(me) && dist([me.x, me.z], stackOf(here.plan, 1)) <= DOOR_REACH_M) {
    const a = actorOf(state, rec.pid);
    if (a && pathDist([[a.x, a.z], stackOf(here.plan, 2)], [me.x, me.z]) >= BODY_GAP_M + GAP_GUARD_M + GIVE_MARGIN_M) return true;
  }
  const w = (rec.wait ??= { door: here.door, at: [q(me.x, 1e-4), q(me.z, 1e-4)] });
  if (w.door !== here.door) { rec.wait = { door: here.door, at: [q(me.x, 1e-4), q(me.z, 1e-4)] }; return false; }
  return dist([me.x, me.z], w.at) >= LEAD_GONE_M;
}
/**
 * The least delay before the #2 leaves for his stack (ms, whole ticks) that keeps his walk GIVE_MARGIN_M more than the body gap
 * off yours, your running move's closed form against his planned one, looked at a tick at a time until GIVE_TAIL_MS past both
 * ends (you standing where your walk ends, or where you stand); the delay that keeps him furthest off when none does.
 */
export function giveWay(state, rec, a, p, me, ms = state.clock.ms) {
  const mv2 = p.beats.find(b => b.k === 'move' && b.prof);
  if (!mv2 || !me) return 0;
  const lead = moveNow(state, playerId(state)), T2 = Math.round(mv2.prof.T * 1000);
  const end1 = lead ? Math.max(ms, lead.untilMs ?? ms) : ms, at1 = (t) => (lead ? moveAt(lead, t) : me);
  const want = BODY_GAP_M + GAP_GUARD_M + GIVE_MARGIN_M;
  // (each delay's look reads your walk and his at the same ticks; both read once a tick here, not once a delay and a tick:
  // his walk delayed d is his walk from now read d earlier, to the same ms (moveAt is a function of the time since its start), so
  // every delay's answer is the one it was. A drawn house's #2 who finds no delay scanned 41 delays × ~150 ticks: 30% of the busiest
  // tick of the sergeant's drawn seed 11 (the review of v0.0.21's A and B))
  const b0 = { ...mv2, fromMs: ms, untilMs: ms + T2 }, P1 = new Map(), P2 = new Map();
  const p1At = (t) => { let v = P1.get(t); if (!v) P1.set(t, v = at1(t)); return v; };
  const p2At = (u) => { let v = P2.get(u); if (!v) P2.set(u, v = moveAt(b0, u)); return v; };
  let best = { d: 0, min: -Infinity };
  for (let d = 0; d <= GIVE_MAX_MS; d += GIVE_STEP_MS) {
    const until = Math.max(end1, ms + d + T2) + GIVE_TAIL_MS;
    let min = Infinity;
    for (let t = ms; t <= until && min >= want; t += TICK_MS) {
      const p1 = p1At(t), p2 = t < ms + d ? a : p2At(t - d);
      min = Math.min(min, dist([p1.x, p1.z], [p2.x, p2.z]));
    }
    if (min >= want) return d;
    if (min > best.min + 1e-6) best = { d, min };
  }
  return best.d;
}
// ---- the crossing rule (see the header) ----

// (the teammate a person's muzzle must not cross in the house: the player's #2, or the #2's player)
function mateOf(state, pid) {
  const H = houseOf(state), two = H?.two?.pid ?? H?.twoPid ?? null;
  if (!two) return null;
  return actorOf(state, pid === two ? playerId(state) : pid === playerId(state) ? two : null);
}
// (whether an aimed muzzle carried along a move's next CROSS_AHEAD_MS would cross the mate, the head held where it is)
function crossing(state, pid, a, mv, ms, mate) {
  for (let t = 0; t <= CROSS_AHEAD_MS; t += CROSS_STEP_MS) {
    const p = moveAt(mv, ms + t), m = muzzleOf(state, pid, { ...a, x: p.x, z: p.z }, 'aimed');
    if (flagsAt(m, mate.x, mate.z, mate.stance ?? 'stand')) return true;
  }
  return false;
}
/**
 * The crossing rule for one person this tick (see the header; COMBAT §25.19.2.1): a move under way whose next CROSS_AHEAD_MS
 * would carry an aimed muzzle's line across the teammate brings the rifle to low ready (the carry's `cross`, { from, atMs },
 * what it goes back to), and back to the aim once the look ahead is clear. A step on the hands (a shot row, the aim) owns the
 * posture: the rule stands aside for it. Returns 'low', 'back' or null.
 */
export function crossTick(state, pid, ms = state.clock.ms) {
  const c = state.people?.[pid]?.kit?.carry, a = actorOf(state, pid), mate = mateOf(state, pid);
  if (!c || !a || !mate) return null;
  mirrorTick(state, pid, a, mate, ms);
  const me = pid === playerId(state), mv = me ? moveNow(state, pid) : houseOf(state)?.two?.doing?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof) ?? null;
  const hands = me && !!state.stop?.doing && !state.stop.doing.beats;
  if (c.cross) {
    if (hands) { delete c.cross; return null; }
    if (mv && c.posture === 'lowReady' && crossing(state, pid, a, mv, ms, mate)) return null;
    if (c.posture === 'lowReady') c.posture = c.cross.from;
    delete c.cross;
    return 'back';
  }
  if (hands || !mv || c.posture !== 'aimed' || !crossing(state, pid, a, mv, ms, mate)) return null;
  c.cross = { from: 'aimed', atMs: ms };
  c.posture = 'lowReady';
  return 'low';
}

// (the build sheet v0.0.20 item 3: the crossing rule's mirror. A teammate aimed on a man (your #2 with rounds of his row still to
// go, or you with your aim or a shot row on a stand) has his line from his rifle at the holder to the man's aim point; a move of the
// other's whose next CROSS_AHEAD_MS would carry his body into that line (carry.js lineMasked), from a place where it is not, is held a
// tick at a time, at most MASK_HOLD_MAX_MS a hold, counted on the house's record (H.mirror { n, ms, runMs }: written only where it acts;
// the plans' paths never cross a line, so the bots' lanes should never meet it))
function mirrorTick(state, pid, a, mate, ms) {
  const H = houseOf(state);
  if (!H?.two?.pid) return;
  const me = pid === playerId(state), mv = me ? moveNow(state, pid) : H.two.doing?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof) ?? null;
  const T = mv ? lineTargetOf(state, H, me ? H.two.pid : playerId(state)) : null;
  const M = H.mirror;
  if (!T) { if (M?.runMs) M.runMs = 0; return; }
  const to = { x: T.x, y: T.y ?? 1.35, z: T.z }, from = lineFromOf(state, mate.who, mate, to);
  const on = (p) => !!lineMasked(from, to, [{ x: p.x, z: p.z, stance: a.stance ?? 'stand' }]);
  // (your #2's line is live only once his next round is due: a body that crosses it before then is across before he fires (his rounds
  // are held while it is on it: combat/two.js maskHold); yours, while your aim or your row is on the man)
  const next = me ? H.two.eng.rounds.filter(r => !r.done).reduce((t, r) => Math.min(t, r.atMs), Infinity) : -Infinity;
  let into = false;
  if (!on(a)) for (let t = CROSS_STEP_MS; t <= CROSS_AHEAD_MS && !into; t += CROSS_STEP_MS) into = ms + t >= next && on(moveAt(mv, ms + t));
  if (!into || (M?.runMs ?? 0) >= MASK_HOLD_MAX_MS) { if (!into && M?.runMs) M.runMs = 0; return; }
  const R = (H.mirror ??= { n: 0, ms: 0, runMs: 0 });
  if (!R.runMs) R.n += 1;
  R.runMs += TICK_MS; R.ms += TICK_MS;
  mv.fromMs += TICK_MS; mv.untilMs += TICK_MS;
  const d = me ? (state.stop?.doing?.beats?.includes(mv) ? state.stop.doing : null) : H.two.doing;
  if (d && Number.isFinite(d.untilPlanMs)) d.untilPlanMs += TICK_MS;
}
// (the stand a teammate is aimed on now: your #2's man while rounds of his row are still to go; yours, your aim's or your shot row's)
function lineTargetOf(state, H, pid) {
  const R = sessionOf(state), find = (key) => (key ? R?.turners?.find(t => t.key === key && t.stoppedAtMs === null) ?? null : null);
  // (his rifle at the aim: a line is only a line while it is aimed)
  if ((state.people?.[pid]?.kit?.carry?.posture ?? null) !== 'aimed') return null;
  if (pid === H.two.pid) return H.two.eng && H.two.eng.rounds?.some(r => !r.done) ? find(H.two.eng.key) : null;
  const S = state.stop;
  return find(S?.aim?.key ?? (S?.doing && !S.doing.beats ? S.doing.target : null));
}
/** How far the #2 stands from his slot's stack at the lane's door at ms (m; his running move's closed form, else his actor), or null. */
export function twoOffSlot(state, rec, ms = state.clock.ms) {
  const a = rec?.pid ? actorOf(state, rec.pid) : null, here = doorNow(state, playerId(state));
  if (!a || !here) return null;
  const mv = rec.doing?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof), p = mv ? moveAt(mv, ms) : a;
  return dist([p.x, p.z], stackOf(here.plan, 2));
}
/** When the #2's running move brings him within TWO_SLOT_M of his slot (ms, a whole tick), or null where no move of his gets him there. */
export function twoArriveMs(state, rec, ms = state.clock.ms) {
  const here = doorNow(state, playerId(state)), mv = rec?.doing?.beats?.find(b => b.st === 'run' && b.k === 'move' && b.prof);
  if (!here || !mv) return null;
  const slot = stackOf(here.plan, 2), off = (t) => { const p = moveAt(mv, t); return dist([p.x, p.z], slot); };
  if (off(mv.untilMs) > TWO_SLOT_M) return null;
  if (off(ms) <= TWO_SLOT_M) return ms;
  // (the last stretch of a walk onto the slot closes on it: the first time within, by bisection)
  let lo = ms, hi = mv.untilMs;
  for (let k = 0; k < 30 && hi - lo > 1; k++) { const m = (lo + hi) / 2; if (off(m) <= TWO_SLOT_M) hi = m; else lo = m; }
  return Math.ceil(hi / TICK_MS) * TICK_MS;
}
// ---- a save made before the catalogue (COMBAT §25.19.2.2; the pre-1.0 rule: carried where it comes naturally) ----

// (a beat's key without the lane's leg prefix ('1:approach' → 'approach'), and the prefix ('1:'), or '')
const legOfKey = (k) => (/^\d+:/.test(k ?? '') ? k.split(':')[0] + ':' : '');
const bareKey = (k) => String(k ?? '').replace(/^\d+:/, '');
// (a doing of the withdrawn lane's bundle cut to the leg it stands in, as that door's room row: its beats of that leg kept, their
// keys and dependencies without the prefix, a dependency on another leg's beat dropped (done, or not this row's))
function laneToRoom(d) {
  const cur = d.beats.find(b => b.st === 'run' || b.st === 'wait') ?? d.beats.at(-1), pre = legOfKey(cur?.key), door = cur?.plan ?? d.door;
  d.beats = d.beats.filter(b => legOfKey(b.key) === pre).map(b => ({ ...b, key: bareKey(b.key), after: (b.after ?? []).filter(x => legOfKey(x) === pre).map(bareKey) }));
  for (const L of Object.values(d.lanes ?? {})) for (const g of L) g.key = bareKey(g.key);
  for (const sub of d.subs ?? []) if (sub.beat) sub.beat = bareKey(sub.beat);
  d.bundle = 'room:clear'; d.door = door; d.step = `drill:room:clear>${door}`;
  return d;
}
/**
 * The saves' mapping (an upgrade, on load): a running or suspended doing, a carry or the #2's doing of an id the catalogue
 * removed (enter-and-clear.js REMOVED): 'house:clear' becomes 'room:clear' for the leg it stands in; an id whose beats a
 * row keeps is renamed to it ('room:stack' Stack up, 'room:enter' In: your corner); any other loads as the choice (the
 * player's doing dropped, time standing still; the #2's dropped, he plans again).
 */
export function upgradeMuscle(state) {
  const S = state.stop, H = opOf(state);
  const lane = (() => { try { return state.places ? lanePlanOf(state) : null; } catch { return null; } })();
  const map = (d) => {
    if (!d?.beats || !(d.bundle in REMOVED)) return d;
    if (d.bundle === 'house:clear') return laneToRoom(d);
    const to = REMOVED[d.bundle];
    if (!to) return null;
    d.bundle = to; d.step = String(d.step ?? '').replace(/^drill:[a-z:-]+?(?=[@>]|$)/, `drill:${to}`);
    return d;
  };
  if (S?.doing?.beats && S.doing.bundle in REMOVED) {
    const d = map(S.doing);
    if (!d) { S.doing = null; S.phase = 'choose'; holdTime(state, 'stop'); }
  }
  if (S?.flow?.beats && S.flow.bundle in REMOVED) S.flow = map(S.flow);
  const C = S?.carry;
  if (C && C.bundle in REMOVED) {
    if (C.bundle === 'house:clear') {
      const n0 = Math.min(...(C.beats ?? []).map(k => Number(legOfKey(k).slice(0, -1) || 0))), pre = `${n0}:`, i0 = lane?.order?.indexOf(C.door) ?? -1;
      const door = i0 >= 0 ? lane.order[i0 + n0] ?? C.door : C.door;
      S.carry = { ...C, bundle: 'room:clear', door, beats: C.beats.filter(k => legOfKey(k) === pre || (!legOfKey(k) && n0 === 0)).map(bareKey),
        paths: Object.fromEntries(Object.entries(C.paths ?? {}).filter(([k]) => legOfKey(k) === pre).map(([k, v]) => [bareKey(k), v])) };
    } else if (REMOVED[C.bundle]) S.carry = { ...C, bundle: REMOVED[C.bundle] };
    else S.carry = null;
  }
  if (H?.two?.doing?.beats && H.two.doing.bundle in REMOVED) H.two.doing = map(H.two.doing);
}

export { flowOf, profileOf, profileAt, profileWhen, moveAt, moveNow };
