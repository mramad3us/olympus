// OLYMPUS scenarios: the live lane's role-players, "Stack and clear, live": two men of the cadre in place of stands 2a and 3a who run COMBAT §7.11's procedure with marking rounds (the build sheet v0.0.19 §1 L-opfor, §3.3; opfor.md §1, §2.1, §2.3).
//
// Who. RP-A in room 2's deep corner (2a's place, your sector) and RP-B in room 3's near leg's far corner (3a's place, your number
// two's), authored in src/data/places/house-opfor.js. Each is a generated marine of the cadre (the posts
// 'melas:wheel-house-opfor-a' and '-b', drawn by staff.js drawStaff on their own streams), playing the same security-grade
// opponent every run (RP_Q 0.6: opforSheet's COMBAT §7.9 mapping, Marksmanship and Weapon handling 12, Fieldcraft and Awareness
// 10, CQC 9, Warfighting 22; the class 'cop', so Nerve 4 and hardening 13 + RP_INOC 3 + his own nerve trait's, 16 as §7.11's
// corporate security for a man of no nerve trait (RP-A on seed 48213; RP-B 19)), with the cadre's card
// drawn from the seed alone (drawCards: stream(seed, 'house:rp', stand); RP-A fight 7 give 3, RP-B fight 4 hide 4 give 2) or
// forced (&opfor=live:<2a card>,<3a card>). Their issue is kit.js 'opfor-fof': utilities, the carrier with two pouches, the
// force-on-force mask, the R-7 with two HAD-30s of ten marking rounds, the first seated and racked (Condition 1, on safe, low
// ready).
//
// The record. Each rides an R.turners record in place of his stand's (fillOpfor), keeping its key, lane, stand and trigger 'go',
// so contact.js's take-in, the #2's eyes, the pars, the clear gate, the instinct and the target view take him in through the paths
// they have; a strike the one rule rates fatal puts him down (combat/would.js, the live round's would-have through his
// carrier's soft panel by the wound model; v0.0.19 used the stand's own sensor, two torso or one head, which now judges only a
// lane v0.0.19 saved). T.live is his own:
//   { who, card, st, fromMs, cue, aimAt, aiming, turn, eyes, eng, move, choice, band, seen, known, drawn, give, ia, firstAtMs,
//     fired, dashed, doorAtMs, chalUntilMs, knelt, rifleId, outWhy, said, took, sectorKey, gaveAtMs, droppedAtMs }
// (took: the marines' rounds opforHit has counted, so a round handed twice counts once; sectorKey: the marine he took in with his
// rifle laid on him at the door, 'sector', whom shot.js's sector aim would let him aim at as the clearing marines do: not read yet)
// st one of RP_STATES: 'wait' (at his spot, low ready, his face as authored), 'turn' (head to a cue over TURN_MS 300), 'aim' (his
// rifle onto the door: posture 'aimed' at his aim time; then he looks), 'fire' (a pair), 'move' (the one dash), 'cover' (at his
// hide, crouched), 'freeze' (crouched, the rifle low, seen), 'hands' (the rifle lowered, then on the floor, hands up), 'down' (sitting where he
// fell, the rifle across his knees, still armed), 'out' (the instructor's ruling: ruleOut). seen and known are maps { 'm:<pid>':
// ms } (men.js remember and stale, MAN_MEMORY_MS): who he has seen and when, and whom he has taken in; a marine out of his sight
// past the memory is taken in afresh. The house's R.house.live = { mode, cards, seenBy, struck, casualty, ruled, shots, heardMs, would }
// (seenBy, struck and casualty men.js's and the house's; shots his rounds, the last SHOTS_KEPT; heardMs the news read so far,
// burstsHeard the count of H.bursts read; would the ledger of every strike's would-have, combat/would.js, v0.0.20).
// Nothing of it is written with no role-players: the turner lane stays v0.0.18's to the tick (tests/house-pin.test.mjs).
// Where a man stands and which stands are role-players is read through one seam (its build sheet §0 item 16, §2 step 4):
// spotOf(state, T), his spot (OPFOR_SPOTS[T.stand] on the set), and rpStandsOf(state), the lane's role-player stands (RP_STANDS on
// the set), so a drawn house's posts (the chunks' frames, v0.0.22 G5) are one branch of each. parseOpfor and opforCode take no
// state and keep RP_STANDS as the URL's grammar (room 2's card, then room 3's); no other function names OPFOR_SPOTS[ or RP_STANDS
// (tests/syntax.test.mjs).
//
// Each lived tick (opforTick, from the house's actors layer after the #2's twoTick and before the instructor's walk; decisions
// act the next tick), for each role-player:
//   1. What he hears (hear): his door's leaf off closed; a marine's round within CUE_SHOT_M 8 m in his own room; a burst within
//      CUE_BURST_M 10 m (R.house.bursts). Each is a cue toward it. A round in his room is supp.js 'roomShot' on his pool, a round
//      at him that missed the near miss (subsonic for marking, a crack for anything faster) at NEAR_MISS_M 0.5 m; a strike is
//      opforHit's HIT_PTS. A bang's and a blast's points are burst.js's own, on his actor as on anyone's.
//   2. The give (the card 'give' at the end of his first take-in, or a surrender): st 'hands' from then (fromMs and gaveAtMs the
//      give's), his record T.face 'noshoot' and T.holds 'hands' from that tick (what he shows, the identification's), every
//      marine's memory of him dropped with it (the mind's known and seenAt, the #2's known, ident and seenAt, and the #2's row on
//      him if no round of it has gone), so the change is taken in as a fresh window (we only know what we know); the rifle
//      lowered to low ready (L.give { atMs, dropAtMs }), and GIVE_DROP_MS 600 later on the floor at his feet (kit.js move to
//      { ground }: still held once; droppedAtMs, the floor rifle's fall's start), his hands up (actor.hands), "Don't shoot!".
//      Challenged by a marine within KNEEL_M 6 m, he kneels at the challenge's end.
//   3. The shock: startled (supp.js startled), flash-blind or stunned (his combat block), he starts nothing, a held aim drops off
//      the door (COMBAT §7.11 step 2), his rounds not yet fired are cut and a dash is held.
//   4. His choice (§7.11 step 5, every card): supp.js nerveCheck on stream(seed, 'combat:nerve', pid, 'rp:<key>', atMs), rolled
//      when his felt band changes and again from cover or a freeze once CHOICE_DWELL_MS 1,500 has passed still suppressed or
//      worse, read on §7.11's table with the security doctrine (RP_DOCTRINE): suppressed, pass fight, a miss cover, bad or
//      disaster freeze; pinned, pass cover, a miss or bad freeze, disaster surrender with a marine's weapon within SURRENDER_M 5 m
//      (else freeze). Calm or under fire he fights, no roll. A choice holds; a give is final. (The table's word for it is 'give',
//      the card's word and the gauge's: one choice, one name. Until v0.0.28 the table said 'surrender', and F157 never met a give.)
//   5. His stoppage: a round that did not go or a stoppage behind it, and he clears it by his own drill (combat/two.js's rule: a
//      double feed REMEDIAL ACTION, the bolt locked or dry a speed reload, else IMMEDIATE ACTION) at its time, drills.js subsOf
//      summed over firearms.js actionMs at his Weapon handling, each sub-step then done with a forced pass (doAction's force: the
//      cadre's role-players never fumble; my call), on the stream 'house-rp'.
//   6. The dash (card 'hide' on the first cue, or the choice 'cover'): the chief's walk's pattern (shoothouse.js chiefWalk), a
//      stepper.js trapezoid at the place's run (motion.js placeGaits) on his own legs (bundle.js legsOf), along the authored dash
//      to his hide (or straight from where he is), at most DASH_MAX_MS 2 s and DASH_MAX_M 3 m; held a tick when his next place
//      closes within BODY_GAP_M of a marine, and ended short, "down where he is", if held past HELD_SHORT_MS 0.5 s. At his hide
//      he crouches and lays his rifle on his door's threshold.
//   7. His rounds: a pair (specials.js rowPlan 'shot:pair', its aim from where his muzzle is and its split at his own Marksmanship
//      and Weapon handling), each round shot.js resolveShot at its time on men.js marineTarget (log false), then men.js incoming,
//      the one writer of a round at a marine; v0.0.20: a round strikes the first marine on its line (carry.js lineMasked), the other
//      where he stands on it (fireTick). A pair ending with that marine still seen and standing: another; else back on the
//      door, his eyes picking the next.
//   8. The turn and the aim: a cue in 'wait' turns his head to it over TURN_MS, then his rifle onto the door over shot.js aimMsOf
//      (so a slow entry finds him aimed at the door, COMBAT §7.11 step 3).
//   9. His eyes: each marine (you and your #2) by his exposure from his actor (men.js marineTarget's facingK, bodySeen: the mean of
//      perception.js visibility at the marine's centre and 0.2 m either side, his eyeOf MARINE_AWARENESS 5, a 110° cone on his
//      four-way face; the eye drawn to an unknown shooter by a round, his cone opened), remembered while seen. A marine seen
//      and not known is taken in (react.js takeInMs, his pid, expect 'sector' when his rifle is laid on the door and the marine
//      within SECTOR_HALF_DEG of it, else 'alert' after a cue, 'surprise' before one; the band his felt's); at its end the card:
//      'give' gives up, any other fights.
// He never leaves his leg, never patrols, flees, throws or fights hand to hand, and never stands on a point or a path of the plan
// (opfor-spots). Going down is opforHit's, from the house's houseShot: a strike rated fatal (would.js), his pool +HIT_PTS a strike,
// T.stoppedAtMs at the round, sitting where he stands (post.posture 'sit'), "Hit!", never turned away. ruleOut(state, bus, T, why)
// is the instructor's ruling ('clear' at his leg's Clear when accounted for, 'passed' by the stall, 'lane' at the lane's end,
// 'frag' a practice frag's read, 'setup' a leg cleared by a setup): he sits on and acts no more. Every roll is on a named stream
// (stream(seed, 'house:rp', …), supp.js's, react.js's, shot.js's shotStream), never Math.random. opforNow(state, ms) is the hud's,
// the bots' and the tests' view; opforLook(state, ms) the stage's (the figure's frame, his rifle in his hands, across his knees
// or on the floor). A wound that bleeds him down later (would.js wouldTick) sits him down at that tick (opforBled). Pure but fillOpfor,
// opforTick, opforHit, opforBled, ruleOut and friendDown, which write the session.
//
// v0.0.26, "Bang, then go" (its build sheet §0 items 4, 5, 11, §3.1; COMBAT §7.10, §7.11; defenders.md DF§3 to DF§6): the scene's
// lane (R.house.bangGo, written by the scene's fill only: absent on every other lane, so they read as before) puts the same two men
// in room 1 (house-opfor.js BREACH_SPOTS: RP-A your man in the far left corner, RP-B your #2's in the far right), reached through
// the one seam (rpStandsOf gives BREACH_STANDS, spotOf BREACH_SPOTS[T.stand]); their cards are forced 'fight', so whatever they do
// after is the table's. Four things are new, and the rest is the procedure above:
//   the held door (fillOpfor): with bangGo.held 'held', the spot that `holds` (1a only) starts laid on the door: st 'aim', his
//      carry aimed, his head on aimAt (the funnel inside the threshold), his four-way face on the spot's `eyes` (the threshold), L.aimAt
//      and L.cue (the door) set, so a marine through it in his cone is taken in 'sector'. A loose man turned by the door's leaf lays his
//      aim in shot.js aimMsOf from the facing he turned from (its turn term; TURN_MS the head's part of it), so the hold is worth its
//      0.45 s (the review of A, 2026-11-19: from the facing he turned to, he was laid 1.15 s after the leaf, before any entry, and
//      held and loose were one room on 96 of 96 lanes); on the scene's lane only, the live lane's aim as built (its pins);
//   the window closes (brain): the shock knocks a laid aim off the door; on the scene's lane a man left at st 'aim' with no aim laid
//      nor coming, his shock over, lays it on the door again (startAim, aimMsOf from where he holds it), so a slow stack meets his
//      rifle (the review of B and C, 2026-11-19: he stood at his low ready until a marine was in his eyes, and holding 8 s cost
//      nothing); the live lane as built;
//   a friend seen falling (friendDown, from goDown, so from a fatal round and opforBled alike; COMBAT §7.10's one term): each other
//      live man not spent who sees him fall (men.js bodySeen from his eye, at SEEN) or stands within supp.js FRIEND_HIT_M 10 m of
//      him in the same room takes supp.js's 'friendHit' (FRIEND_HIT_PTS 10, its own gate at 10 m) and L.resolve less RESOLVE_FRIEND
//      0.1 (from 1), which his next nerve check reads (choiceOf passes it to supp.js nerveCheck: round(10 × (resolve − 1)), −1 at
//      0.9); once a fall. On the live lane's set its two men stand 15.6 m apart in rooms 2 and 3 behind walls: nothing is written;
//   the challenge ends a freeze (challengeTick, before the shock: the give is no new aggression): a man in 'freeze' or 'cover' on
//      whom your Challenge ('contact:challenge', contact.js CHALLENGE_MS 1.2 s) runs, who at its end sees you (bodySeen at SEEN) or
//      hears you (supp.js hearsVoice: deaf after the bang but within DEAF_VOICE_M 2 m) within KNEEL_M 6 m, gives on that tick
//      (startGive) and kneels as soon as his rifle is down (kneelTick reads the same L.chalUntilMs). A challenge already over is
//      judged before a new one is taken (a second press on the first one's held end tick never puts the first off). Unchallenged he
//      stays the table's: his felt back under suppressed, he rolls fight and comes back up;
//   the read: a shocked man (men.js shockedNow, rpShocked here) not down nor giving is drawn in the frame 'daze' (opforLook) and read
//      'dazed' (men.js liveStateOf: the identification's word, DAZED), on every live lane. L.choice keeps its band and grade as
//      built ({ what, band, atMs, grade, dc }: the CONTRACTS choice fact's band, grade and atMs, `what` its choice, no who or felt; the fact
//      itself is not posted, CONTRACTS says so).
// opforNow gains dazed, resolve and searched (T.live.searched, the search's end: contact.js's).
//
// v0.0.27, "Away the boarding party" (its build sheet items 5, 6, 7, 9, 10, 11, §0 items 5, 18, 31, 32, §3.1; FT§3 to FT§5, FT§7.1;
// COMBAT §7.3, §7.9 to §7.11, §14.4, §14.6): the same procedure on men who are not role-players, aboard the Patient Mule's deck 2 at 0 G,
// selected by the boarding's record (R.house.boarding on a ship, written by its scene's fill before this module's; absent on every other
// lane, so the house's live lane and "Bang, then go" read as before, their pins held). What is new, each one function:
//   the draw (drawBoarding, parseBoarding, boardingCode): pirates or smugglers 1 : 1 from stream(seed, 'boarding:draw'), their armed
//      men on the ship's posts (the barricade 1a, the deckhead man 4b, the compartments' 2a to 4a: hauler.js, read through shipOf(H).posts
//      and .crew in spotOf and rpStandsOf only) and the hauler's own unarmed crew on their spots; at most BOARDING_ARMED_MAX 4 armed,
//      BOARDING_MEN_MAX 6 men and BOARDING_ROOM_ARMED_MAX 2 armed a compartment; a whole code ('pirates:1a,3a,3b,4a/2c,2d') played as
//      written (the URL's &holdouts= and "Again" keep it);
//   the fill (fillOpfor, armMan): each man drawn from his post ('belt-mule:holdout-n', 'belt-mule:crew-n'), sheeted by his type
//      (opforSheet's { cls, doctrine, inoc }: pirates 'criminal' q 0.55, smugglers 'spacer' q 0.45, the crew 'civilian' q 0.3, inoculation
//      0), issued by his type (kit.js, B's: the R-7 or the P-12 drawn, ball, Condition 1), on his face with his boots locked (footing.js
//      setAnchor, lockOnFace for the deckhead man), no card; a crewman a no-shoot showing his empty hands, cowering from his first tick
//      (L.unarmed, st 'freeze'), who never aims or fires; the ledger made 'real' (would.js newLedger('real'): realOf);
//   the warning (hear, alertAtOf): at the override's end (R.house.boarding.collar.alertAtMs, the scene's) or GO, every armed man waiting
//      turns to his door and lays his weapon on it;
//   the tables (CHOICE_TABLES, choiceOf by the man's own skills.doctrine): 'irregular' turns a miss when suppressed, or a pass when
//      pinned, into cover or blind fire 1 : 1 (IRREG_BLIND_SHARE on stream(seed, 'house:rp', key, 'cb', atMs)) and a pinned disaster into
//      flight; 'civilian' is a freeze always, never a roll. Flight is final, as a give is;
//   blind fire (blindTick; F158): from behind his cover, while a marine not down is in his own compartment (the ship's room he stands
//      in), st 'blind' (FIRING BLIND), a round every BLIND_GAP_MS 700 at the nearest, shot.js BLIND_FIRE_MOD −10, no take-in, no sighting;
//   the push-off (startDash, freeOf, canPush; carried K2): in free fall (gravityAt under throw.js FREE_G_MS2 0.05 m/s²) his dash and his
//      flight are a push-off at DASH_PUSH_MS 1.2 m/s on the push's own ramp (FREEFALL.PUSH.MS 1 s), no brake (he takes his hide at that
//      speed, under FREEFALL.LAND_MS: 3 m in 3 s), his boots let go at its start and locked at its end on the face he left, nothing
//      holding it short; with nothing to push from (footing.js noFootingWhy and freefall.js
//      pushFrom both say so) he takes his cover where he is (L.held 'no footing');
//   the flight (startFlee): to his post's refuge inside his own compartment, at most FLEE_MAX_M 6 m, st 'flee' (RUNNING AWAY), then a
//      freeze there; no refuge in reach, no way out (L.noWay) and a freeze where he is;
//   the real down and rise (opforHit, manTick, goDown, downTick, opforRise; men.js bodyDown): on 'real' a strike is the round on his own
//      body (would.js wouldHave with the bus, B's), and he is down exactly while his body is (the wound model's downOf, the knock
//      included, then the body domain's stance: a casualty waits while he bleeds or is shot in a leg or the torso); no "Hit!", no sitting
//      post; once his body lets him up he rises crouched and his choice is rolled at once on his felt; a later collapse puts him down then;
//   his own tourniquet (aidTick; COMBAT §7.3's level 2, F164's half): conscious, a limb bleeding hard (aid.js tourniquetOf, B's), aid.js
//      TQ_MS of nothing else, then aid.js applyTourniquet;
//   the side (sideTick; F159): at GIVE_UP_LEFT 35% of the armed standing or fewer, GIVE_UP_P 0.5 at the crossing and every
//      GIVE_UP_EVERY_MS 60 s on stream(seed, 'boarding:side', n), final: every standing armed man gives, and the hauler's intercom says
//      SIDE_SAYS (a bubble at a 1MC speaker, never voiced);
//   hors de combat (protectedOf; F155's predicate, the fault D's): 'unarmed', 'down' or 'hands' as a man's record shows him to every
//      marine, PROTECTED_AFTER_MS 500 after his fall or his give;
//   the marines he sees, aims at and hears are the fire team's (team.js fireTeamOf: the leader and the AR besides you and Four aboard),
//      a marine down by his own body on 'real' (struckOn's verdict on 'wound'); opforLook gains 'blind' and 'flee', opforNow the boarding's
//      fields. Every new record field is written only aboard (L.unarmed, downAtMs, aid, blindNextMs, blindN, held, noWay, rose, alertAtMs;
//      R.house.boarding.side).
import { TICK_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream, weighted, intIn, int, chance, next } from '../../core/rng.js';
import { nextId, playerActor, playerId } from '../../core/ids.js';
import { OPFOR_SPOTS, RP_STANDS, BREACH_SPOTS, BREACH_STANDS, RP_CARD_WEIGHTS, RP_QUALITY, RP_DOCTRINE, RP_CLASS, RP_INOC } from '../../data/places/house-opfor.js';
import { shipOf } from '../../data/places/ships.js';
import { houseSpecOf, postsOf } from '../scenes/assemble.js';
import { openingState, areaOf, roomOf } from '../places/model.js';
import { gravityAt } from '../places/env.js';
import { navOf } from '../places/nav.js';
import { placeGaits } from '../body/motion.js';
import { moverStart, locoStep } from '../body/loco.js';
import { drawStaff, setPost } from '../people/staff.js';
import { SEEN, headOf } from '../people/perception.js';
import { FREEFALL } from '../../data/body/needs.js';
import { SKILL_KEYS, BASE_MAX } from '../skills/skills.js';
import { rangeOf, sayOn } from './handling.js';
import { materialise, move, lyingOf, issueBoarding, KIT_TEMPLATES, BOARDING_ISSUES } from '../arms/kit.js';
import { feed, gunField, doAction, beliefOf, actionMs, tempoFor } from '../arms/firearms.js';
import { subsOf } from '../arms/drills.js';
import { gunOn, faceOfHead } from '../arms/shooting.js';
import { muzzleOf, lineMasked, lineFromOf } from '../arms/carry.js';
import { BRASS_LIVE } from '../arms/look.js';
import { famCap, MODELS, isLong } from '../arms/models.js';
import { loadOf } from '../arms/calibres.js';
import { TURN_MS } from '../arms/turners.js';
import { resolveShot, aimMsOf } from '../arms/shot.js';
import { FREE_G_MS2 } from '../arms/throw.js';
import { rowPlan } from '../arms/specials.js';
import { rollerOf } from '../combat/roll.js';
import { takeInMs } from '../combat/react.js';
import { feltOf, bandN, nerveCheck, addSupp, inputPts, hearsVoice, FRIEND_HIT_M } from '../combat/supp.js';
import { manPlace, roomAt, SECTOR_HALF_DEG } from '../combat/room.js';
import { legsOf as bodyLegsOf, BODY_GAP_M } from '../combat/bundle.js';
import { profileOf, moveAt, pathLen } from '../combat/stepper.js';
import { bodySeen, marineTarget, incoming, remember, stale, struckOn, forget, shockedNow, liveStateOf, choosesOf, bodyDown } from '../combat/men.js';
import { wouldHave, strikeOf, fatalOf, newLedger, realOf } from '../combat/would.js';
import { fireTeamOf } from '../combat/team.js';
import { downOf } from '../body/wounds.js';
import { tourniquetOf, applyTourniquet, TQ_MS } from '../body/aid.js';
import { setAnchor, lockOnFace, noFootingWhy, onFaceOf } from '../body/footing.js';
import { pushFrom } from '../body/freefall.js';
import { logEntry } from '../log.js';

/** The URL's modes (&opfor=none | live[:<2a card>,<3a card>]). */
export const OPFOR_MODES = Object.freeze(['none', 'live']);
/** The cadre's cards by stand, weighted (house-opfor.js's), and every card a test or the URL may force on either. */
export const RP_CARDS = RP_CARD_WEIGHTS, RP_CARD_NAMES = Object.freeze(['fight', 'give', 'hide']);
/** The role-players' quality (COMBAT §7.9's q), the same every run. */
export const RP_Q = RP_QUALITY;
/** A choice from cover or a freeze is rolled again after this, still suppressed or worse (ms; COMBAT §7.11). */
export const CHOICE_DWELL_MS = 1500;
/** From the give to the rifle on the floor and the hands up (ms; opfor.md §2.3). */
export const GIVE_DROP_MS = 600;
/** The one dash: at most this long and this far (ms, m; COMBAT §7.11's cover). */
export const DASH_MAX_MS = 2000, DASH_MAX_M = 3;
/** A dash held on a marine's body this long ends where he is (ms; opfor.md §2.3). */
export const HELD_SHORT_MS = 500;
/** He hears a marine's round in his own room within this, a burst within that (m). */
export const CUE_SHOT_M = 8, CUE_BURST_M = 10;
/** A round at him that missed passed this close (m; my call: supp.js's near miss at its full points). */
export const NEAR_MISS_M = 0.5;
/** He surrenders only with a marine's weapon within this (m), and kneels to a challenge within that (m) (COMBAT §7.11; opfor.md §2.3). */
export const SURRENDER_M = 5, KNEEL_M = 6;
/** A friend seen falling takes this off his resolve (COMBAT §7.10; v0.0.26). */
export const RESOLVE_FRIEND = 0.1;
/** His rounds kept on the house's record (R.house.live.shots). */
export const SHOTS_KEPT = 30;
/** His rifle laid on the floor this far ahead of him, toward his door (m; my call). */
export const DROP_M = 0.35;
/** The states (see the header). */
export const RP_STATES = Object.freeze(['wait', 'turn', 'aim', 'fire', 'move', 'cover', 'freeze', 'hands', 'down', 'out', 'blind', 'flee']);
/** His words (the cadre's role-player's own; the instructor's are courses.js HOUSE_CHIEF's). */
export const RP_SAY = Object.freeze({ hands: "Don't shoot!", down: 'Hit!' });
/** The table of COMBAT §7.11 for the security doctrine: by felt's band (2 suppressed, 3 pinned) and the nerve check's grade. */
export const CHOICE_TABLE = Object.freeze({
  2: Object.freeze({ superb: 'fight', good: 'fight', pass: 'fight', miss: 'cover', bad: 'freeze', disaster: 'freeze' }),
  3: Object.freeze({ superb: 'cover', good: 'cover', pass: 'cover', miss: 'freeze', bad: 'freeze', disaster: 'give' }),
});

// ---- v0.0.27, "Away the boarding party": the defenders who are not role-players (its build sheet item 5, item 6, §0 items 5, 31, §5) ----

/**
 * COMBAT §7.11's tables by doctrine (the man's own sheet's `doctrine`, opforSheet's: choiceOf reads it): 'security' the role-players'
 * (CHOICE_TABLE, as built), 'irregular' the pirates' and the smugglers' (v0.0.26's cell, DF§4: a miss when suppressed and a pass or better
 * when pinned is cover or blind fire 1 : 1, COVER_BLIND; a disaster when pinned is flight to his refuge, 'flee'), 'civilian' the hauler's
 * own crew (null: always a freeze, never a roll, never a fight).
 */
export const COVER_BLIND = 'cover|blind';
export const CHOICE_TABLES = Object.freeze({
  security: CHOICE_TABLE,
  irregular: Object.freeze({
    2: Object.freeze({ superb: 'fight', good: 'fight', pass: 'fight', miss: COVER_BLIND, bad: 'freeze', disaster: 'freeze' }),
    3: Object.freeze({ superb: COVER_BLIND, good: COVER_BLIND, pass: COVER_BLIND, miss: 'freeze', bad: 'freeze', disaster: 'flee' }),
  }),
  civilian: null,
});
/** An irregular's cover or blind fire: blind fire this share of the time (COMBAT §7.11, §7.9's irregulars; DF§4's 1 : 1). */
export const IRREG_BLIND_SHARE = 0.5;
/** Blind fire: a round every this many ms at the nearest marine in his compartment (DF§5; shot.js BLIND_FIRE_MOD on its roll). */
export const BLIND_GAP_MS = 700;
/** In free fall (gravityAt's gMs2 under throw.js FREE_G_MS2 0.05 m/s²) his dash and his flight are a push-off at this speed (m/s; BODY §16.6's run push), and his flight goes at most this far, inside his own compartment (m; COMBAT §7.11). */
export const DASH_PUSH_MS = 1.2, FLEE_MAX_M = 6;
/** The side gives up (COMBAT §14.6, longhaul's rule): at this share of its armed men standing or fewer, a roll at this chance at the crossing and every this many ms after; a success final. */
export const GIVE_UP_LEFT = 0.35, GIVE_UP_P = 0.5, GIVE_UP_EVERY_MS = 60_000;
/** The intercom's words when the side gives up (a bubble at the speaker of the compartment of the standing man nearest you; never voiced). */
export const SIDE_SAYS = "We give up! Don't shoot! We're coming out!";
/** The deck's caps (§0 item 5): armed men, men in all, armed men in one compartment. */
export const BOARDING_ARMED_MAX = 4, BOARDING_MEN_MAX = 6, BOARDING_ROOM_ARMED_MAX = 2;
/** The hauler's crew's quality (COMBAT §7.9: a civilian's sheet; class and doctrine 'civilian', no inoculation). */
export const CREW_Q = 0.3;
/**
 * The holdouts by type (FT§3, my numbers; §0 item 31's stands): weight (1 : 1), q and class (COMBAT §14.4, §7.9), kit (kit.js's issues,
 * B's), armed [min, max], the barricade's post 1a and the deckhead's 4b each drawn at its chance (pirates only on the deckhead), rooms the
 * compartments' posts the rest are drawn from without repeat (2a cabin 1's, the smugglers' only), and the crew (crewN [min, max]) from crewAt.
 */
export const BOARDING_TYPES = Object.freeze({
  pirates: Object.freeze({ weight: 1, q: 0.55, cls: 'criminal', kit: BOARDING_ISSUES.pirate, armed: Object.freeze([3, 4]), barricade: 1 / 2, deckhead: 1 / 3,
    rooms: Object.freeze(['3a', '3b', '4a']), crewN: Object.freeze([2, 2]), crewAt: Object.freeze(['2c', '2d']) }),
  smugglers: Object.freeze({ weight: 1, q: 0.45, cls: 'spacer', kit: BOARDING_ISSUES.smuggler, armed: Object.freeze([2, 3]), barricade: 1 / 3, deckhead: 0,
    rooms: Object.freeze(['2a', '3a', '3b', '4a']), crewN: Object.freeze([2, 3]), crewAt: Object.freeze(['3c', '3d', '4c']) }),
});
/** The barricade's and the deckhead man's stands (§0 item 31). */
export const BARRICADE_STAND = '1a', DECKHEAD_STAND = '4b';
/** A round at a man down or with his hands up begun this long after his fall or his give is a new decision on a man who could not fight (ms; tests/flawless-live.mjs F39's LATE_ROUND_MS: a pair's second round already in the air is not). */
export const PROTECTED_AFTER_MS = 500;

const whole = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const actorOf = (state, pid) => (pid ? state.actors?.list?.find(a => a.who === pid) ?? null : null);
const liveOf = (state) => rangeOf(state)?.house?.live ?? null;
const bearing = (a, x, z) => Math.atan2(z - a.z, x - a.x);
const SPENT = new Set(['hands', 'down', 'out']);
// (the boarding's record (v0.0.27: R.house.boarding, written by its scene's fill only; absent on every other lane, so they read as before))
const boardingOf = (state) => (state ? rangeOf(state)?.house?.boarding ?? null : null);

// ---- the URL, the cards and the sheet ----

/**
 * The &opfor= parameter read (see the header): null for none (absent, '', 'none'); { mode: 'live', cards: null | { [stand]: card } }
 * ('live', 'live:fight,hide', a card '*' or left empty drawn); { error } for anything else. An object already read is returned as it is.
 */
export function parseOpfor(s) {
  if (s === null || s === undefined || s === '' || s === 'none' || s === false) return null;
  if (typeof s === 'object') return s.error || s.mode === 'live' ? s : null;
  const m = /^live(?::(.*))?$/.exec(String(s).trim());
  if (!m) return { error: `No role-players '${s}': none, live or live:<card>,<card> (${RP_CARD_NAMES.join(', ')}).` };
  if (m[1] === undefined) return { mode: 'live', cards: null };
  const parts = m[1].split(',').map(x => x.trim());
  if (parts.length > RP_STANDS.length) return { error: `No role-players '${s}': two cards at most, room 2's then room 3's.` };
  const cards = {};
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '' || parts[i] === '*') continue;
    if (!RP_CARD_NAMES.includes(parts[i])) return { error: `No card '${parts[i]}': ${RP_CARD_NAMES.join(', ')}.` };
    cards[RP_STANDS[i]] = parts[i];
  }
  return { mode: 'live', cards: Object.keys(cards).length ? cards : null };
}
/** The parameter's words for a spec ("Again as …" keeps them): 'live' or 'live:fight,hide'; null for none. */
export function opforCode(spec) {
  const S = parseOpfor(spec);
  if (!S || S.error) return null;
  return S.cards ? `live:${RP_STANDS.map(s => S.cards[s] ?? '*').join(',')}` : 'live';
}
/**
 * Each role-player's card from the seed alone (stream(seed, 'house:rp', stand)), a forced one kept: { '2a': card, '3a': card }. stands:
 * the lane's (rpStandsOf), the set's by default. v0.0.22 (its build sheet §0 items 16 and 18, G5): the weights by his lane room
 * (RP_CARD_WEIGHTS[stand[0]]), and a forced card found by his stand, else by his lane room: parseOpfor keys the URL's cards by the set's
 * stands ('2a' room 2's, '3a' room 3's: a key's first character its lane room), so on a drawn house whose post in room 3 is '3c' the
 * forced card still reaches him (before,
 * read by the stand alone, `&opfor=live:fight,hide` on a drawn lane would have drawn both cards).
 */
export function drawCards(seed, forced = null, stands = rpStandsOf(null)) {
  const byRoom = (stand) => forced?.[stand] ?? Object.entries(forced ?? {}).find(([k]) => k[0] === String(stand)[0])?.[1];
  return Object.fromEntries(stands.map(stand => [stand, byRoom(stand) ?? weighted(stream(seed, 'house:rp', stand), RP_CARD_WEIGHTS[String(stand)[0]])]));
}

/**
 * The holdouts drawn (v0.0.27, "Away the boarding party": its build sheet item 5, §0 items 5, 31, 32, §3.1; FT§3), from the seed alone on
 * stream(seed, 'boarding:draw'): the type 1 : 1 (always drawn, then the holdouts given take its place, so naming the type the seed draws
 * draws the same deck), the armed men (BOARDING_TYPES' [min, max], at most BOARDING_ARMED_MAX), the barricade (1a) and the deckhead man
 * (4b) each at its chance, the rest from the type's compartment posts without repeat (at most BOARDING_ROOM_ARMED_MAX a compartment, the
 * stand's first digit its leg and compartment), then the crew from their spots (at most BOARDING_MEN_MAX on the deck). A draw with fewer
 * posts than men (pirates, four, neither the barricade nor the deckhead drawn: three posts) stands the men it has posts for (my call).
 * Each man's post is his person's (src/data/people/posts.js): 'belt-mule:holdout-n' the n-th armed man drawn, 'belt-mule:crew-n' the n-th
 * crewman. holdouts: null (the seed's type), a type ('pirates' | 'smugglers', the URL's &holdouts=), or a whole code (boardingCode's:
 * 'pirates:1a,3a,3b,4b/2c,2d'), played as written where its type's posts and spots and the caps allow it, else the seed's draw of its
 * type. Pure. Returns { type, code (the whole code: "Again" keeps it), armed: [{ stand, post, kit, q, cls, doctrine, armed }], crew:
 * [the same], stands: { [stand]: that entry } }.
 */
export function drawBoarding(seed, { holdouts = null } = {}) {
  const r = stream(seed, 'boarding:draw');
  const drawn = weighted(r, Object.entries(BOARDING_TYPES).map(([k, t]) => [k, t.weight]));
  const given = parseBoarding(holdouts), type = given?.type ?? drawn, D = BOARDING_TYPES[type];
  let armed, unarmed;
  if (given?.armed) { armed = given.armed; unarmed = given.unarmed; }
  else {
    const n = Math.min(BOARDING_ARMED_MAX, intIn(r, D.armed[0], D.armed[1]));
    const barricade = chance(r, D.barricade), deckhead = chance(r, D.deckhead), pool = [...D.rooms];
    armed = [...(barricade ? [BARRICADE_STAND] : []), ...(deckhead ? [DECKHEAD_STAND] : [])];
    const inRoom = (st) => armed.filter(x => x[0] === st[0]).length;
    while (armed.length < n && pool.length) { const st = pool.splice(int(r, pool.length), 1)[0]; if (inRoom(st) < BOARDING_ROOM_ARMED_MAX) armed.push(st); }
    const nc = Math.min(BOARDING_MEN_MAX - armed.length, intIn(r, D.crewN[0], D.crewN[1])), spots = [...D.crewAt];
    unarmed = [];
    while (unarmed.length < nc && spots.length) unarmed.push(spots.splice(int(r, spots.length), 1)[0]);
  }
  const man = (stand, i) => Object.freeze({ stand, post: `belt-mule:holdout-${i + 1}`, kit: D.kit, q: D.q, cls: D.cls, doctrine: 'irregular', armed: true });
  // (the crew's issue indexed, BOARDING_ISSUES['crew']: syntax's seam rule keeps a member read of `.crew` in opfor.js for the ship's row)
  const crewman = (stand, i) => Object.freeze({ stand, post: `belt-mule:crew-${i + 1}`, kit: BOARDING_ISSUES['crew'], q: CREW_Q, cls: 'civilian', doctrine: 'civilian', armed: false });
  const A = armed.map(man), C = unarmed.map(crewman);
  return Object.freeze({ type, code: boardingCode(type, armed, unarmed), armed: Object.freeze(A), crew: Object.freeze(C), stands: Object.freeze(Object.fromEntries([...A, ...C].map(e => [e.stand, e]))) });
}
/** A draw's whole code: '<type>:<armed stands in draw order>/<crew spots in draw order>' ('pirates:1a,4b,3a/2d,2c'). */
export const boardingCode = (type, armed, unarmed) => `${type}:${armed.join(',')}/${unarmed.join(',')}`;
/**
 * The holdouts' words read (the URL's &holdouts=, a record's code): null for none or anything unknown; { type } for a type; { type, armed,
 * unarmed } for a whole code its type allows (the armed from 1a, 4b and the type's posts, no repeat, at most BOARDING_ARMED_MAX and
 * BOARDING_ROOM_ARMED_MAX a compartment; the crew from the type's spots; at most BOARDING_MEN_MAX), else { type } alone.
 */
export function parseBoarding(code) {
  if (typeof code !== 'string' || !code) return null;
  const [type, rest] = code.split(':');
  if (!Object.hasOwn(BOARDING_TYPES, type)) return null;
  if (rest === undefined) return { type };
  const D = BOARDING_TYPES[type], [a = '', c = ''] = rest.split('/'), armed = a ? a.split(',') : [], unarmed = c ? c.split(',') : [];
  const posts = new Set([BARRICADE_STAND, ...(D.deckhead > 0 ? [DECKHEAD_STAND] : []), ...D.rooms]), spots = new Set(D.crewAt);
  const ok = armed.length >= 1 && armed.length <= BOARDING_ARMED_MAX && armed.length + unarmed.length <= BOARDING_MEN_MAX && new Set(armed).size === armed.length && new Set(unarmed).size === unarmed.length
    && armed.every(st => posts.has(st) && armed.filter(x => x[0] === st[0]).length <= BOARDING_ROOM_ARMED_MAX) && unarmed.every(st => spots.has(st));
  return ok ? { type, armed, unarmed } : { type };
}
// (the lane's draw from its record's code and the seed, memoised: spotOf and rpStandsOf read it every tick)
const DRAWS = new Map();
function boardingDraw(state) {
  const B = boardingOf(state);
  if (!B) return null;
  const key = `${state.meta?.seed ?? 0}|${B.code ?? B.type ?? ''}`;
  let d = DRAWS.get(key);
  if (!d) { if (DRAWS.size > 256) DRAWS.clear(); DRAWS.set(key, (d = drawBoarding(state.meta?.seed ?? 0, { holdouts: B.code ?? B.type ?? null }))); }
  return d;
}
// (a hauler's post or crew spot as a role-player's spot (spotOf's shape: post, name, door, start, face, hide, dash, aimAt, eyes), with
// what the boarding adds: refuge (his flight's end), onFace, room and unarmed (a crewman). Memoised by the stand and the draw)
const SHIP_SPOTS = new Map();
function shipSpot(state, P, S) {
  const d = boardingDraw(state), e = d?.stands[P.stand] ?? null, key = `${state.meta?.seed ?? 0}|${d?.code ?? ''}|${P.stand}`;
  let spot = SHIP_SPOTS.get(key);
  if (spot) return spot;
  const eyes = P.eyes ?? P.aimAt ?? P.at, hide = P.hide ?? P.at;
  spot = Object.freeze({ post: e?.post ?? null, name: S?.roles?.[P.stand]?.name ?? P.stand, door: P.door, start: [...P.at], face: faceOfHead(Math.atan2(eyes[1] - P.at[1], eyes[0] - P.at[0])),
    hide: [...hide], dash: [[...P.at], [...hide]], aimAt: [...(P.aimAt ?? eyes)], eyes: [...eyes], refuge: P.refuge ? [...P.refuge] : null, onFace: P.onFace ?? 'deck', room: P.room ?? null, unarmed: !e?.armed });
  if (SHIP_SPOTS.size > 512) SHIP_SPOTS.clear();
  SHIP_SPOTS.set(key, spot);
  return spot;
}

// ---- the seam: where a role-player stands, and which stands are role-players (the build sheet §0 item 16) ----

// (a drawn house's posts (G5: scenes/assemble.js postsOf, the chunks' posts placed with their rooms, memoised by the spec and
// never saved), null on the set or with no state)
function drawnPosts(state) {
  if (!state || rangeOf(state)?.house?.draw?.mode !== 'drawn') return null;
  return postsOf(houseSpecOf(state));
}
/**
 * A role-player's spot by his stand ({ post, name, door, start, face, hide, dash, aimAt, why? }), reading T.stand only: the set's,
 * OPFOR_SPOTS[T.stand]; on a drawn house (G5) the post of his stand as assemble.js postsOf places it in the house drawn, its
 * `post` the billet of his lane room's man (the same two men of Base Melas wherever their rooms fall). Aboard the boarding (v0.0.27) the
 * ship's post or crew spot of his stand (hauler.js's, through shipOf(H)), its person's post by the draw, its refuge, face and room.
 */
export function spotOf(state, T) {
  if (bangGoOf(state)) return BREACH_SPOTS[T.stand];
  // (aboard, the ship's posts and crew spots, read through its row (shipOf(H).posts and .crew: the seam rule), by the draw)
  const S = boardingOf(state) ? shipOf(rangeOf(state).house) : null;
  if (S?.posts) { const P = S.posts.find(p => p.stand === T.stand) ?? S.crew?.find(p => p.stand === T.stand) ?? null; return P ? shipSpot(state, P, S) : null; }
  const P = drawnPosts(state);
  return P ? P[T.stand] : OPFOR_SPOTS[T.stand];
}
/**
 * The lane's role-player stands, room 2's then room 3's: the set's RP_STANDS ['2a', '3a']; on a drawn house the stands of the posts of
 * lane rooms 2 and 3 (G5); on "Bang, then go" (v0.0.26: R.house.bangGo, never R.house.breach, the house's breached doors) room 1's
 * BREACH_STANDS ['1a', '1b']; aboard the boarding (v0.0.27: R.house.boarding) the drawn stands of the ship's posts and crew spots;
 * state may be null (the set).
 */
export function rpStandsOf(state) {
  if (bangGoOf(state)) return BREACH_STANDS;
  // (aboard, the drawn stands of the ship's posts and crew spots, in stand order (the fill's))
  const S = boardingOf(state) ? shipOf(rangeOf(state).house) : null;
  if (S?.posts) { const d = boardingDraw(state); return [...S.posts, ...(S.crew ?? [])].map(p => p.stand).filter(st => d?.stands[st]).sort(); }
  const P = drawnPosts(state);
  return P ? Object.keys(P).sort() : RP_STANDS;
}
// (the scene's record, "Bang, then go"'s (v0.0.26): its fill's alone; absent on every other lane)
const bangGoOf = (state) => (state ? rangeOf(state)?.house?.bangGo ?? null : null);
/**
 * A role-player's sheet at quality q (COMBAT §7.9's mapping; see the header): Marksmanship and Weapon handling round(4 + 14q), Fieldcraft
 * and Awareness round(3 + 12q), CQC round(2 + 12q), Warfighting round(60 q²); the class 'cop' (supp.js HARD_K, NERVE_K), whose values
 * are the own points as they stand; the private's Fitness 12; the room's drill rung 2 (rowPlan's aim before his first round); a fixed
 * inoculation RP_INOC. Returns a sheet in testSheet's shape. v0.0.27 (its build sheet item 5): { cls, doctrine, inoc } for the boarding's
 * holdouts and crew (pirates 'criminal', smugglers 'spacer', the crew 'civilian', each with inoculation 0 and the doctrine choiceOf reads),
 * defaulting to the role-players' RP_CLASS, RP_DOCTRINE and RP_INOC, so their call is unchanged.
 */
export function opforSheet(qk = RP_Q, { cls = RP_CLASS, doctrine = RP_DOCTRINE, inoc = RP_INOC } = {}) {
  const r = (x) => Math.round(x), named = { marksmanship: r(4 + 14 * qk), weapons: r(4 + 14 * qk), fieldcraft: r(3 + 12 * qk), awareness: r(3 + 12 * qk), cqc: r(2 + 12 * qk), fitness: 12 };
  // (the rest at a security man's middling 5: my call; nothing of the lane reads them)
  const skills = Object.fromEntries(SKILL_KEYS.map(k => [k, [Math.min(BASE_MAX, named[k] ?? 5), 0]]));
  return { cls, os: r(60 * qk * qk), skills, drills: { room: { rung: 2 }, passage: { rung: 2 } }, inoc: { pts: inoc, n: 0, sol: 0, fixed: true }, doctrine };
}

// ---- the fill ----

/**
 * The role-players put in the house (w; see the header), the last items of the fill: H the house's record, opts a parseOpfor spec or
 * its words. For each of the lane's role-player stands (rpStandsOf): his person drawn (staff.js), his sheet, his issue ('opfor-fof', Condition 1 at low ready), his
 * post and his actor at his start, his stand's turner record replaced by his own (trigger 'go', turned at GO when GO has been given),
 * and R.house.live. A man whose leg a setup has already cleared is ruled out ('setup'). Returns { cards, pids } or null (no
 * role-players: nothing written).
 */
export function fillOpfor(state, H = rangeOf(state)?.house ?? null, opts = null) {
  // (aboard the boarding (R.house.boarding on a ship, written before this by the scene's fill) the men are the draw's, whatever
  // opts says; the ship's posts are read by spotOf and rpStandsOf alone (syntax's seam rule))
  const B = H?.boarding && shipOf(H) ? H.boarding : null, spec = B ? { mode: 'live', cards: null } : parseOpfor(opts);
  const R = rangeOf(state);
  if (!H || !R || !spec || spec.error || spec.mode !== 'live') return null;
  const seed = state.meta.seed, now = state.clock.ms, stands = rpStandsOf(state), pids = {};
  // (the boarding's men carry no card: no brief, no give at the take-in, no hide; their doctrine's table from their first cue)
  const cards = B ? Object.fromEntries(stands.map(st => [st, 'fight'])) : drawCards(seed, spec.cards, stands), draw = B ? boardingDraw(state) : null;
  const area = R.area ?? state.places?.live?.area;
  state.actors ??= { list: [] };
  for (const stand of stands) {
    const S = spotOf(state, { stand }), i = R.turners.findIndex(T => T.stand === stand);
    if (i < 0) continue;
    const pid = drawStaff(state, S.post), p = state.people[pid], D = draw?.stands[stand] ?? null;
    p.skills = D ? opforSheet(D.q, { cls: D.cls, doctrine: D.doctrine, inoc: 0 }) : opforSheet(RP_Q);
    // (his issue made ready: the role-players' 'opfor-fof', the boarding's by his type (kit.js, B's), a crewman's nothing in his hands)
    const gunId = armMan(state, pid, D ? D.kit : 'opfor-fof');
    // (Condition 1 at low ready; a crewman's hands as his issue leaves them)
    p.kit.carry = { posture: D && !D.armed ? KIT_TEMPLATES[D.kit]?.posture ?? 'lowReady' : 'lowReady', finger: 'off' };
    const [x, z] = S.start, headRad = headOf(S.face);
    // (E's: aboard, each man in his post's dress (data/people/posts.js: the Belt coverall, the second holdout in the light vac
    // suit open), on his actor, which the figure and the doll read; on every other lane the utilities as before)
    const post = setPost(state, pid, { area, x, z, face: S.face, ...(D ? {} : { outfit: 'utilities' }) }), outfit = D ? post?.outfit ?? 'utilities' : 'utilities';
    // (his actor made here, appended: a sync of the area's actors would make every actor again, the #2's and the instructor's too)
    state.actors.list.push({ id: nextId(state, 'a'), who: pid, x, z, face: S.face, gait: 'idle', moveStance: 'combat', headRad, $px: x, $pz: z, ...(outfit !== 'utilities' ? { outfit } : {}) });
    const T0 = R.turners[i], unarmed = !!D && !D.armed;
    const holds = unarmed ? 'hands' : gunId && state.items[gunId] && !isLong(MODELS[state.items[gunId].model]) ? 'pistol' : 'rifle';
    R.turners[i] = {
      key: T0.key, lane: T0.lane, room: T0.room, stand, name: S.name, slot: T0.slot, x, z, y: T0.y, face: unarmed ? 'noshoot' : 'threat', holds,
      trigger: { kind: 'go', on: null, gapMs: 0 }, turnAtMs: H.goAtMs ?? null, awayAtMs: null, hits: [], stoppedAtMs: null,
      live: { who: pid, card: cards[stand], st: 'wait', fromMs: now, cue: null, aimAt: null, aiming: null, turn: null, eyes: null, eng: null, move: null,
        choice: null, band: 0, seen: {}, known: {}, drawn: null, give: null, ia: null, firstAtMs: null, fired: 0, dashed: false, said: {} },
    };
    // (the held door, "Bang, then go"'s draw: the spot that holds laid on the threshold from the fill (see the header))
    if (H.bangGo?.held === 'held' && S.holds) holdDoor(state, R.turners[i], state.actors.list.at(-1), S, now);
    // (aboard, on his face with his boots locked (the deckhead man on it); a crewman cowering in his corner from the start,
    // a no-shoot showing his empty hands, who never takes up a weapon (FT§3))
    if (B) {
      const a = state.actors.list.at(-1);
      if (S.onFace === 'deckhead') lockOnFace(state, pid, 'deckhead'); else setAnchor(state, pid, 'boots');
      if (unarmed) { const L = R.turners[i].live; L.unarmed = true; L.st = 'freeze'; L.choice = { what: 'freeze', band: 0, atMs: now }; a.stance = 'kneel'; }
    }
    pids[stand] = pid;
  }
  // (the ledger: 'wound' on the live lane and "Bang, then go" (the would-have), 'real' aboard (v0.0.27: would.js, B's real branch))
  H.live = { mode: 'live', cards, seenBy: {}, struck: [], casualty: null, ruled: [], shots: [], heardMs: now, burstsHeard: H.bursts?.length ?? 0, would: newLedger(B ? 'real' : 'wound') };
  // (a man of a leg a setup has cleared already: ruled out, as the setup clears his stand)
  for (const T of R.turners) if (T.live && legIndex(T) < (H.cur ?? 0)) ruleOut(state, null, T, 'setup', now);
  // (the side's record, its armed men at the start (sideTick))
  if (B) B.side = { armed: R.turners.filter(T => T.live && !T.live.unarmed).length, rolls: 0, crossedAtMs: null, nextAtMs: null, gaveAtMs: null };
  return { cards, pids };
}
/**
 * A man's issue made ready (w): the template's (kit.js materialise), its gun Condition 1, the first magazine seated and racked, on safe,
 * its count told (the load it went in with: ten of a thirty). v0.0.27: a boarding issue (kit.js issueBoarding, B's: the template and its
 * sidearm) whose only gun is its P-12 (the smugglers') has the pistol drawn into his strong hand and made ready the same way; an issue with
 * no gun (the crew's) arms nobody. Returns the gun's id or null.
 */
/** v0.0.27, E's: the boarding's guns' finishes by issue (data/finishes.js): the pirates' R-7s in urban grey (the build sheet item 16, my call: an existing finish, not sampled); none, the issue's black. */
export const BOARDING_FINISH = Object.freeze({ [BOARDING_ISSUES.pirate]: 'urban' });
function armMan(state, pid, kitId) {
  const kit = Object.values(BOARDING_ISSUES).includes(kitId) ? issueBoarding(state, pid, kitId, { finish: BOARDING_FINISH[kitId] ?? null }) : materialise(state, pid, kitId);
  let gunId = kit.gunId, magId = kit.magIds[0] ?? null;
  if (!gunId && kit.pistol?.gunId) {
    gunId = kit.pistol.gunId;
    move(state, gunId, { pid, hand: 0 });
    magId = state.items[gunId].mag ?? kit.pistol.magIds[0] ?? null;
  }
  if (!gunId || !magId) return gunId ?? null;
  const gun = state.items[gunId], mag = state.items[magId], loadN = mag.n;
  if (gun.mag !== magId) move(state, magId, { gun: gunId });
  feed(gun, mag);
  gun.mode = 'safe';
  gun.belief = { chamber: 'live', count: mag.n, ...(mag.belief?.kind ? { load: mag.belief.kind } : {}), ...(loadN < famCap(mag.fam) ? { fullN: loadN } : {}) };
  delete mag.belief;
  return gunId;
}
const legIndex = (T) => (T.stand === 'H' ? 3 : Number(T.stand?.[0]) - 1);
// (his rifle laid on his door's threshold before anyone comes: st 'aim', aimed, his head on it, the door his cue already (v0.0.26))
function holdDoor(state, T, a, S, now) {
  const L = T.live, [x, z] = S.aimAt;
  L.st = 'aim'; L.fromMs = now;
  L.aimAt = [x, z];
  L.cue = { x: q(x, 0.001), z: q(z, 0.001), atMs: now, why: 'door' };
  state.people[L.who].kit.carry.posture = 'aimed';
  a.headRad = q(bearing(a, x, z), 1e-6); a.face = eyesFace(a, S);
}

// ---- each lived tick ----

/** The role-players' tick (w; see the header): from the house's actors layer, after the #2, before the instructor's walk. */
export function opforTick(state, bus, R = rangeOf(state), H = R?.house, now = state.clock.ms) {
  const Lv = H?.live;
  if (!Lv || !R) return;
  const news = newsOf(state, R, H, Lv, now);
  for (const T of R.turners) if (T.live) manTick(state, bus, R, H, Lv, T, now, news);
  Lv.heardMs = now; Lv.burstsHeard = H.bursts?.length ?? 0;
  // (aboard, the side's give-up, once every man has lived his tick)
  if (H.boarding && !H.end) sideTick(state, bus, R, H, now);
}

// (the marines' rounds and the bursts since the last tick, each where it came from)
function newsOf(state, R, H, Lv, now) {
  const from = Lv.heardMs ?? -Infinity, me = playerActor(state), two = actorOf(state, H.twoPid), shots = [];
  const fresh = (s) => s.atMs > from && s.atMs <= now;
  for (const s of R.shots ?? []) if (fresh(s) && me) shots.push({ id: s.id, atMs: s.atMs, who: me.who, key: s.key ?? null, load: s.load ?? null, x: me.x, z: me.z });
  for (const s of H.two?.shots ?? []) if (fresh(s) && two) shots.push({ id: s.id, atMs: s.atMs, who: two.who, key: s.key ?? null, load: null, x: two.x, z: two.z });
  // (C: the holders' rounds, kept on their own records (combat/holders.js), heard where each holder stands)
  for (const m of H.holders?.men ?? []) { const ha = actorOf(state, m.pid); if (ha) for (const s of m.shots ?? []) if (fresh(s)) shots.push({ id: s.id, atMs: s.atMs, who: m.pid, key: s.key ?? null, load: null, x: ha.x, z: ha.z }); }
  // (the bursts by their count read, not their time: one set off in the rules layer (shoothouse.js tickDevices, after this tick's
  // read) carries an atMs already behind heardMs, and by time alone was never heard (the review of v0.0.19); a record without the
  // count (a save before it) takes those by time)
  const all = H.bursts ?? [], bursts = Number.isInteger(Lv.burstsHeard) ? all.slice(Lv.burstsHeard) : all.filter(fresh);
  return { shots, bursts };
}

function manTick(state, bus, R, H, Lv, T, now, news) {
  const L = T.live, a = actorOf(state, L.who);
  if (!a) return;
  moverStart(a);
  let vMs = 0;
  // (on 'real': a man whose own body has gone down since his last tick (a later collapse: the blood, the pain) goes down now)
  const real = realOf(state);
  if (real && L.st !== 'down' && L.st !== 'out' && bodyDown(state, L.who, now)) goDown(state, bus, T, now);
  if (L.st === 'out') { /* (he sits: nothing more) */ }
  else if (L.st === 'down') { if (real && !H.end) downTick(state, bus, T, a, now); }
  else if (T.stoppedAtMs !== null) ruleOut(state, bus, T, 'setup', now);
  else if (H.end || Lv.casualty) cease(state, T);
  else vMs = brain(state, bus, R, H, Lv, T, a, now, news);
  syncMan(state, T, a);
  // (a push-off's flight is the float's record, no stride; on his feet as built)
  const flying = !!L.move?.push;
  locoStep(a, a.$px, a.$pz, { state, pid: L.who, gait: flying ? 'float' : vMs > 0 ? 'run' : 'walk', stance: a.moveStance ?? 'combat', vMs: vMs > 0 ? vMs : null });
}

// (his record from his actor: T's place, his room and side by where he stands (room.js manPlace), his post kept with him)
function syncMan(state, T, a) {
  if (T.x !== a.x || T.z !== a.z) { T.x = a.x; T.z = a.z; }
  const at = manPlace(state, T);
  if (T.room !== at.room) T.room = at.room;
  // (the side is the geometry, written for a live record only; whose man he is stays team.js ownerOf's)
  if (at.slot !== T.slot) T.slot = at.slot;
  const p = state.people[T.live.who]?.post;
  if (p) {
    if (p.x !== a.x || p.z !== a.z) { p.x = a.x; p.z = a.z; }
    if (p.face !== a.face) p.face = a.face;
    const posture = a.posture ?? 'stand';
    if ((p.posture ?? 'stand') !== posture) { if (posture === 'stand') delete p.posture; else p.posture = posture; }
  }
}

// (the lane over or a marine down: he ceases fire, his rounds not yet fired cut, his rifle low)
function cease(state, T) {
  const L = T.live;
  L.eng = null; L.eyes = null; L.aiming = null;
  if (L.aid) L.aid = null;
  if (L.st === 'blind') { L.st = 'cover'; L.fromMs = state.clock.ms; }
  const k = state.people[L.who]?.kit;
  if (k?.carry && k.carry.posture === 'aimed') k.carry.posture = 'lowReady';
  const g = state.items?.[gunOn(state, L.who)];
  if (g && g.mode !== 'safe') g.mode = 'safe';
}

function brain(state, bus, R, H, Lv, T, a, now, news) {
  const L = T.live, pid = L.who;
  hear(state, bus, H, T, a, now, news);
  if (L.give) { if (now >= L.give.dropAtMs) giveUp(state, bus, T, a, now); return 0; }
  if (L.st === 'hands') { kneelTick(state, T, a, now); return 0; }
  if (challengeTick(state, bus, T, a, now)) return 0;
  const shocked = shockedOf(state, pid, now);
  if (shocked) {
    // (a startle, a flash or a stun: nothing new; a held aim knocked off the door; rounds not yet fired cut)
    if (L.eng) { L.eng = null; L.st = 'aim'; }
    // (blind fire stops with the shock: back behind his cover, crouched)
    if (L.st === 'blind') { L.st = 'cover'; L.fromMs = now; }
    L.eyes = null; L.aiming = null;
    const k = state.people[pid].kit;
    if (k.carry?.posture === 'aimed') { k.carry.posture = 'lowReady'; L.aimAt = null; }
    // (a push-off already under way flies on: a body in free fall has nothing to stop it but the face it reaches)
    if (L.move && !L.move.push) holdMove(L.move);
    else if (L.move) return moveTick(state, bus, H, T, a, now);
    return 0;
  }
  // (aboard: COMBAT §7.3's level 2, his own tourniquet on a limb bleeding hard, nothing else meanwhile (aid.js, B's))
  if (aidTick(state, bus, T, a, now)) return 0;
  choiceTick(state, bus, H, T, a, now);
  if (L.give) return 0;
  if (L.ia) { if (now < L.ia.untilMs) return 0; clearStoppage(state, bus, T); }
  if (L.move) return moveTick(state, bus, H, T, a, now);
  // (an irregular who chose blind fire, behind his cover: his rounds over it while a marine is in his compartment, his eyes down)
  if (L.choice?.what === 'blind' && (L.st === 'cover' || L.st === 'blind')) { blindTick(state, bus, R, H, Lv, T, a, now); return 0; }
  if (L.st === 'freeze' || L.st === 'cover') { look(state, bus, H, T, a, now, { fire: false }); return 0; }
  if (L.eng) { fireTick(state, bus, R, H, Lv, T, a, now); return 0; }
  // ("Bang, then go" only: his shock over, a man left at st 'aim' with no aim laid nor coming (the shock knocked it off,
  // above) lays his rifle on the door again, from where he holds it; before, nothing re-aimed him but a marine in his eyes, so a slow
  // stack cost nothing (the review of B and C, 2026-11-19). On the live lane as built, so its pins hold. v0.0.27's stage 0 (K1): on every
  // lane whose men choose (men.js choosesOf: "Bang, then go" and the boarding))
  if (L.st === 'aim' && !L.aimAt && !L.aiming && !L.turn && choosesOf(state) && gunOn(state, pid)) startAim(state, T, a, now);
  turnTick(state, T, a, now);
  look(state, bus, H, T, a, now, { fire: true });
  return 0;
}
/** Whether a role-player is shocked at ms (step 3): startled (supp.js), flash-blind or stunned (his combat block); men.js shockedNow, the one reader (v0.0.26). */
export const rpShocked = (state, pid, now = state.clock.ms) => shockedNow(state, pid, now);
const shockedOf = (state, pid, now) => shockedNow(state, pid, now);

// ---- what he hears (step 1) ----

function hear(state, bus, H, T, a, now, news) {
  const L = T.live, pid = L.who, mine = roomHere(state, a.x, a.z);
  for (const s of news.shots) {
    const here = roomHere(state, s.x, s.z) === mine && mine !== null;
    if (here) addSupp(state, bus, pid, { id: `${s.id}:room`, kind: 'roomShot', pts: inputPts('roomShot', { indoor: true }), atMs: s.atMs, why: 'a round in the room' });
    // (a round at him that missed: the near miss, subsonic for the marking round (supp.js SUBSONIC_PTS), a crack for anything faster)
    if (s.key === T.key && !T.hits.some(h => h.shotId === s.id)) {
      const marking = s.load ? !!loadOf('6.5x40r', s.load)?.marking : liveLoad(state), kind = marking ? 'subsonic' : 'crack';
      addSupp(state, bus, pid, { id: `${s.id}:near`, kind, pts: inputPts(kind, { rM: NEAR_MISS_M }), atMs: s.atMs });
      if (!SPENT.has(L.st) && L.known[`m:${s.who}`] === undefined) L.drawn = { key: `m:${s.who}`, atMs: now };
    }
    if (here && Math.hypot(s.x - a.x, s.z - a.z) <= CUE_SHOT_M) cue(state, T, a, { x: s.x, z: s.z, atMs: s.atMs, why: 'shot' }, now);
  }
  for (const b of news.bursts) if (Math.hypot(b.x - a.x, b.z - a.z) <= CUE_BURST_M) cue(state, T, a, { x: b.x, z: b.z, atMs: b.atMs, why: 'burst' }, now);
  const S = spotOf(state, T);
  if (S && L.doorAtMs === undefined && openingState(state, S.door) !== 'closed') { L.doorAtMs = now; cue(state, T, a, { x: S.aimAt[0], z: S.aimAt[1], atMs: now, why: 'door' }, now); }
  // (aboard: the holdouts warned at the override's end (alertAtOf): each armed man waiting turns to his door and lays his weapon on it)
  if (S && H.boarding && L.alertAtMs === undefined && !L.unarmed && alertAtOf(H) <= now) { L.alertAtMs = now; cue(state, T, a, { x: S.aimAt[0], z: S.aimAt[1], atMs: now, why: 'alert' }, now); }
}
/**
 * When the boarding's holdouts are warned (v0.0.27; the build sheet item 2): the override's end, the scene's (shoothouse.js collarTick
 * writes R.house.boarding.collar.alertAtMs, D's), else GO. Infinity before either.
 */
export function alertAtOf(H) {
  const c = H?.boarding?.collar?.alertAtMs;
  return Number.isFinite(c) ? c : Number.isFinite(H?.goAtMs) ? H.goAtMs : Infinity;
}
// (the compartment a point is in: aboard, the ship's room there (the area's: the lock, the passage, a cabin, the bunk room); on every
// other lane the lane plan's room, room.js roomAt, as built)
function roomHere(state, x, z) {
  if (!boardingOf(state)) return roomAt(state, x, z);
  const area = state.places?.live?.area;
  return area ? roomOf(area, x, z)?.id ?? null : null;
}
// (the lane's issue is marking: the #2's rounds carry no load on their record)
const liveLoad = (state) => rangeOf(state)?.load === 'marking';

// (a cue heard: kept; waiting, he turns to it, or dashes on the first one with the card 'hide')
function cue(state, T, a, c, now) {
  const L = T.live;
  L.cue = { x: q(c.x, 0.001), z: q(c.z, 0.001), atMs: c.atMs, why: c.why };
  if (L.st !== 'wait' || L.give) return;
  if (L.card === 'hide' && !L.dashed) { startDash(state, T, a, spotOf(state, T)?.hide, 'hide', now); return; }
  const to = bearing(a, c.x, c.z);
  L.turn = { fromRad: q(a.headRad ?? headOf(a.face), 1e-6), toRad: q(to, 1e-6), fromMs: now, untilMs: now + TURN_MS };
  L.st = 'turn'; L.fromMs = now;
}

// ---- the turn and the aim (step 8) ----

function turnTick(state, T, a, now) {
  const L = T.live;
  if (L.st === 'turn' && L.turn) {
    const k = clamp01((now - L.turn.fromMs) / TURN_MS);
    a.headRad = q(L.turn.fromRad + wrap(L.turn.toRad - L.turn.fromRad) * k, 1e-6);
    a.face = faceOfHead(a.headRad);
    if (now >= L.turn.untilMs) { const turn = L.turn; L.turn = null; startAim(state, T, a, now, turn); }
  }
  if (L.aiming && now >= L.aiming.untilMs) {
    const k = state.people[L.who].kit;
    k.carry.posture = 'aimed';
    L.aimAt = L.aiming.at; L.aiming = null;
  }
}
// (his rifle onto his door's threshold: posture 'aimed' at his aim time from where he holds it. v0.0.26, "Bang, then go" only: after a
// cue's turn, the aim is shot.js aimMsOf from the facing he turned from (its turn term counted, the turn's TURN_MS part of it), not
// from the facing he turned to: the turn of 148° from the far wall cost TURN_MS 300 ms and then a still man's aim, so a loose man
// was laid on the door 1.15 s after its leaf moved, before the entry, and the held door changed nothing on 96 of 96 lanes (the
// review of A, 2026-11-19). On the live lane the aim is as built, so its pins hold (see the header))
function startAim(state, T, a, now, turn = null) {
  const L = T.live, S = spotOf(state, T), gunId = gunOn(state, L.who);
  L.st = 'aim'; L.fromMs = now;
  if (!S || !gunId) return;
  const [x, z] = S.aimAt, dM = Math.hypot(x - a.x, z - a.z);
  let ms;
  // (the boarding round's stage 0 (K1): the aim from the facing he turned from on every lane whose men choose (men.js choosesOf), not "Bang, then go" alone)
  if (turn && choosesOf(state)) {
    const head = a.headRad;
    a.headRad = turn.fromRad;
    ms = Math.max(0, aimMsOf(state, L.who, gunId, { x, z, dM }, { ms: now }) - (now - turn.fromMs));
    a.headRad = head;
  } else ms = aimMsOf(state, L.who, gunId, { x, z, dM }, { ms: now });
  a.headRad = q(bearing(a, x, z), 1e-6); a.face = eyesFace(a, S);
  L.aiming = { at: [x, z], untilMs: whole(now + ms) };
}
// (his four-way face, the eyes' cone (perception.js eyeOf reads the face, not headRad): on his spot's `eyes` where it has them (v0.0.26,
// "Bang, then go": the threshold, his rifle laid on the funnel inside it; see house-opfor.js BREACH_SPOTS), else his aim's (as built))
const eyesFace = (a, S) => (S?.eyes ? faceOfHead(bearing(a, S.eyes[0], S.eyes[1])) : faceOfHead(a.headRad));

// ---- his eyes and his card (step 9) ----

// (the marines: the fire team (team.js fireTeamOf: you and your number two, and aboard the boarding the leader and the AR too, v0.0.27),
// each with an actor on the stage)
function marinesOf(state, H) {
  const me = playerActor(state), out = [];
  for (const m of fireTeamOf(state)) if (m.pid && (me?.who === m.pid ? me : actorOf(state, m.pid))) out.push(m.pid);
  return out;
}
// (a marine down: by the one rule's verdict (would.js fatalOf, struckOn) on the live lane; on 'real' (v0.0.27) by his own body)
const marineDown = (state, who, now) => (realOf(state) ? bodyDown(state, who, now) : struckOn(state, who).down);
const fighting = (L) => !SPENT.has(L.st) && L.st !== 'freeze' && L.st !== 'cover' && L.st !== 'move' && L.st !== 'blind' && L.st !== 'flee' && !L.give && !L.unarmed;

function look(state, bus, H, T, a, now, { fire }) {
  const L = T.live, pid = L.who;
  let best = null;
  for (const who of marinesOf(state, H)) {
    const t = marineTarget(state, who, a, now);
    if (!t || marineDown(state, who, now)) continue;
    // (a marine's exposure from his eye (men.js marineTarget's facingK, bodySeen's), the eye drawn onto an unknown shooter)
    const k = L.drawn?.key === t.key ? bodySeen(state, a, t.x, t.z, now, { drawn: true }) : t.facingK;
    if (k >= SEEN) { remember(L.seen, t.key, now); if (!best || t.dM < best.t.dM) best = { t, k }; }
  }
  // (a man out of his sight past the memory: forgotten, taken in afresh when he is seen again)
  for (const key of Object.keys(L.known)) if (stale(L.seen, key, now)) delete L.known[key];
  if (L.eyes) {
    if (now < L.eyes.untilMs) return;
    const e = L.eyes;
    L.eyes = null;
    L.known[e.key] = now;
    // (the marine taken in where his rifle was laid: his sector's man, the seam for shot.js's sector aim (see the handoff of v0.0.19))
    if (e.expect === 'sector') L.sectorKey = e.key; else if (L.sectorKey === e.key) delete L.sectorKey;
    if (L.card === 'give' && !L.gaveCard) { L.gaveCard = true; startGive(state, T, now); return; }
    if (fire && fighting(L) && !stale(L.seen, e.key, now)) plan(state, T, a, e.key, now);
    return;
  }
  if (!best) return;
  if (L.known[best.t.key] !== undefined) { if (fire && fighting(L)) plan(state, T, a, best.t.key, now); return; }
  // (a take-in: react.js's, on his own eyes and felt; expect by where his rifle is laid and whether a cue was heard)
  const t = best.t;
  const laid = !!L.aimAt && state.people[pid].kit.carry?.posture === 'aimed' && Math.abs(wrap(bearing(a, t.x, t.z) - bearing(a, L.aimAt[0], L.aimAt[1]))) <= SECTOR_HALF_DEG * Math.PI / 180;
  const expect = laid ? 'sector' : L.cue || L.drawn ? 'alert' : 'surprise';
  const ti = takeInMs(state, pid, { id: `rp:${T.key}:${t.key}`, targets: [{ key: t.key, x: t.x, z: t.z, rangeM: q(t.dM, 0.01), face: 'threat' }], seenMs: now, expect: { [t.key]: expect }, band: bandN(feltOf(state, pid, now)) });
  L.eyes = { key: t.key, seenMs: now, untilMs: whole(now + ti.ms), expect };
  L.drawn = null;
}

// ---- his rounds (step 7) ----

// (a pair on a marine: rowPlan's parts from now, his rifle off safe and aimed, his head on the man)
function plan(state, T, a, key, now) {
  const L = T.live, pid = L.who, gunId = gunOn(state, pid), gun = state.items?.[gunId];
  const who = key.slice(2), t = marineTarget(state, who, a, now);
  if (!gun || !t || L.unarmed) return;
  a.headRad = q(bearing(a, t.x, t.z), 1e-6); a.face = faceOfHead(a.headRad);
  const P = rowPlan(state, pid, 'shot:pair', t, { atMs: now, gunId, odds: false });
  if (!P) return;
  gun.mode = 'semi';
  state.people[pid].kit.carry.posture = 'aimed';
  state.people[pid].kit.carry.finger = 'on';
  const rounds = P.parts.filter(p => p.k === 'round');
  L.eng = { key, row: 'pair', rounds: rounds.map(p => ({ atMs: whole(now + p.at), part: p.part, follow: p.follow ?? 0, climbK: p.climbK ?? 1, i: p.i, n: rounds.length })) };
  L.st = 'fire'; L.fromMs = now; L.aiming = null;
}

// (a marine's stance, for his capsule on a line)
const actorStance = (state, who) => (playerActor(state)?.who === who ? playerActor(state) : state.actors?.list?.find(x => x.who === who))?.stance ?? 'stand';
function fireTick(state, bus, R, H, Lv, T, a, now) {
  const L = T.live, E = L.eng, pid = L.who, who = E.key.slice(2), gunId = gunOn(state, pid);
  for (const r of E.rounds) {
    if (r.done || r.atMs > now) continue;
    r.done = true;
    // (the build sheet v0.0.20 §0 item 19: his round strikes the first body on his line, the other marine where he stands on it
    // (carry.js lineMasked; men.js marineTarget is the one reader of a marine as a target, untouched))
    const aimed = marineTarget(state, who, a, now), from = aimed ? lineFromOf(state, pid, a, aimed) : null;
    const other = aimed ? marinesOf(state, H).filter(x => x !== who).map(x => marineTarget(state, x, a, now)).filter(Boolean) : [];
    const first = aimed && other.length ? lineMasked(from, aimed, other.map(o => ({ ...o, stance: actorStance(state, o.who) }))) : null;
    const t = first ? marineTarget(state, first.who, a, now) : aimed;
    if (!t || !gunId) continue;
    a.headRad = q(bearing(a, t.x, t.z), 1e-6); a.face = faceOfHead(a.headRad);
    const { shot } = resolveShot(state, bus, { pid, gunId, target: t, part: r.part, follow: r.follow, climbK: r.climbK, log: false, atMs: now, row: { id: 'shot:pair', n: r.n, i: r.i } });
    let out = null;
    if (shot.fired) {
      L.fired += 1; L.firstAtMs ??= now;
      out = incoming(state, bus, { who: t.who, by: T.key, shot, atMs: now });
      if (shot.brassRec && R.brass) { R.brass.push({ ...shot.brassRec, who: pid }); if (R.brass.length > BRASS_LIVE) R.brass.splice(0, R.brass.length - BRASS_LIVE); }
    }
    Lv.shots.push({ id: shot.id, atMs: now, by: T.key, at: E.key, fired: !!shot.fired, hit: !!out?.hit, ...(shot.part ? { part: shot.part } : {}), ...(shot.zone ? { zone: shot.zone } : {}) });
    if (Lv.shots.length > SHOTS_KEPT) Lv.shots.splice(0, Lv.shots.length - SHOTS_KEPT);
    // (his rifle stopped, or a stoppage behind the round: the pair ends and his drill takes his hands)
    if ((!shot.fired && shot.why !== 'safety') || shot.stoppage) { startStoppage(state, T, now); return; }
  }
  if (!E.rounds.every(r => r.done)) return;
  L.eng = null;
  const t = marineTarget(state, who, a, now);
  // (another pair while that marine is seen and standing; else back on the door, his eyes on the next)
  if (t && !marineDown(state, who, now) && t.facingK >= SEEN) { plan(state, T, a, E.key, now); return; }
  L.st = 'aim'; L.fromMs = now;
  const k = state.people[pid].kit;
  k.carry.finger = 'off';
}

// ---- his stoppage (step 5) ----

/** The drill a role-player's rifle needs, by what it shows (combat/two.js twoDrillOf's rule): 'remedial', 'reload:speed' or 'ia'. */
export function rpDrillOf(state, gun) {
  if (!gun) return null;
  if (gunField(gun, 'jam')) return 'remedial';
  const mag = gun.mag ? state.items?.[gun.mag] : null, ch = gunField(gun, 'chamber');
  if (gunField(gun, 'locked') || !mag || ((mag.n ?? 0) <= 0 && ch !== 'dud' && ch !== 'case')) return 'reload:speed';
  return 'ia';
}
function startStoppage(state, T, now) {
  const L = T.live, pid = L.who, gunId = gunOn(state, pid), gun = state.items?.[gunId];
  L.eng = null;
  const macro = rpDrillOf(state, gun);
  if (!macro) return;
  const roller = rollerOf(state, pid, { ms: now }), list = subsOf(macro, beliefOf(state, gunId));
  const ms = list.reduce((s, x) => s + actionMs(roller, gun, x, { tempo: tempoFor(x, 'normal') }), 0);
  state.people[pid].kit.carry.finger = 'off';
  L.ia = { macro, fromMs: now, untilMs: whole(now + ms), list };
  // (a blind firer's reload behind his cover, crouched, and back to it after (blindTick); every other man back on his door)
  L.st = L.st === 'blind' ? 'cover' : 'aim'; L.fromMs = now;
}
function clearStoppage(state, bus, T) {
  const L = T.live, pid = L.who, gunId = gunOn(state, pid), D = L.ia;
  L.ia = null;
  if (!gunId) return;
  for (const action of D.list) doAction(state, bus, { pid, gunId, action, tempo: tempoFor(action, 'normal'), pressure: 'evaluated', log: false, rng: 'house-rp', deferSay: true, force: { [action.split(':')[0]]: 'pass', [action]: 'pass' } });
  // (back up: aimed on his door, his eyes on whoever he can see)
  const k = state.people[pid].kit;
  if (k.carry) k.carry.posture = L.aimAt ? 'aimed' : 'lowReady';
}

// ---- the dash (step 6) ----

function startDash(state, T, a, to, why, now) {
  const L = T.live, pid = L.who, S = spotOf(state, T);
  if (!to) return;
  const atStart = S && Math.hypot(a.x - S.start[0], a.z - S.start[1]) < 0.05 && to === S.hide;
  const path = atStart ? S.dash.map(p => [p[0], p[1]]) : [[a.x, a.z], [to[0], to[1]]];
  // (K2: in free fall the dash is a push-off (freeOf), and a man with nothing to push from holds where he is: the cover he
  // chose is taken there, crouched (before, he ran on the place's legs at 0 G over a floor that does not hold him))
  const free = freeOf(state, a), max = why === 'flee' ? FLEE_MAX_M : DASH_MAX_M;
  if (free && !canPush(state, pid, a, path)) { L.dashed = true; L.held = 'no footing'; L.eng = null; L.eyes = null; L.aiming = null; L.turn = null; arrive(state, T, a, now); return; }
  // (at most DASH_MAX_M along it (his flight FLEE_MAX_M))
  let len = pathLen(path);
  if (len > max) { const k = max / len, e = path.at(-1), s0 = path.at(-2); path[path.length - 1] = [q(s0[0] + (e[0] - s0[0]) * k, 1e-4), q(s0[1] + (e[1] - s0[1]) * k, 1e-4)]; len = pathLen(path); }
  L.dashed = true;
  L.eng = null; L.eyes = null; L.aiming = null; L.turn = null;
  const k = state.people[pid].kit;
  k.carry.posture = 'lowReady'; k.carry.finger = 'off';
  delete a.stance;
  if (len < 0.05) { arrive(state, T, a, now); return; }
  // (in free fall the push-off's own ramp (BODY §16.6: it reaches its speed over FREEFALL.PUSH.MS) and nothing to brake on: he flies at
  // it to his hide and takes its face or hold there at that speed, under FREEFALL.LAND_MS, which lands (freefall.js's rule); on his feet
  // the place's run on his own legs, as built)
  const pushMs2 = DASH_PUSH_MS / (FREEFALL.PUSH.MS / 1000);
  const legs = free ? { pushMs2, brakeMs2: pushMs2 } : bodyLegsOf(state, pid, a.x, a.z), vMax = free ? DASH_PUSH_MS : placeGaits(state).runMs;
  const prof = profileOf(len, vMax, legs.pushMs2, legs.brakeMs2, { v0: 0, v1: free ? DASH_PUSH_MS : 0 });
  // (a push-off: his boots let go at its start (the deckhead man leaves his face), the face he took off from kept for the lock at its end)
  const push = free ? { face: onFaceOf(state, pid) } : null;
  if (push) setAnchor(state, pid, null);
  L.move = { to: [to[0], to[1]], path: path.map(p => [q(p[0], 1e-4), q(p[1], 1e-4)]), prof, fromMs: now, untilMs: now + Math.round(prof.T * 1000), startMs: now, heldMs: 0, why, ...(push ? { push } : {}) };
  L.st = why === 'flee' ? 'flee' : 'move'; L.fromMs = now;
}
/**
 * Whether a man's place is in free fall (v0.0.27; the build sheet §0 item 17): the gravity there under throw.js FREE_G_MS2 0.05 m/s²
 * (the hauler's 0, the Wreck's 0). At or above it the dash is the place's run, as built.
 */
export const freeOf = (state, a) => !!a && !!state.places?.live?.area && gravityAt(state, null, a.x, a.z).gMs2 < FREE_G_MS2;
// (K2: whether a man in free fall can push off toward his path's first leg: the footing holds his feet (footing.js noFootingWhy null: his
// mag boots locked), or a face or a hold is in his reach behind the push (freefall.js pushFrom: the deck under him, a bulkhead, a rung))
function canPush(state, pid, a, path) {
  if (!noFootingWhy(state, pid)) return true;
  const [x1, z1] = path[1] ?? path[0], dx = x1 - a.x, dz = z1 - a.z, d = Math.hypot(dx, dz);
  if (d < 1e-6) return false;
  return pushFrom(state, a, navOf(state, state.places.live.area, 'C0', a.x, a.z), dx / d, dz / d) !== null;
}
/**
 * His flight (v0.0.27; COMBAT §7.11, FT§4.3): an irregular pinned who rolled a disaster runs (in free fall pushes off) to his post's refuge,
 * inside his own compartment and at most FLEE_MAX_M, read RUNNING AWAY with his back to you (st 'flee'), then freezes there (arrive). A
 * post with no refuge, or one out of his compartment or his reach, is no way out: he freezes where he is (L.noWay). Final: his choice
 * 'flee' is never rolled again; a challenge still ends his freeze.
 */
export function startFlee(state, T, a, now) {
  const L = T.live, S = spotOf(state, T), to = S?.refuge ?? null;
  const mine = roomHere(state, a.x, a.z), ok = !!to && Math.hypot(to[0] - a.x, to[1] - a.z) <= FLEE_MAX_M + 1e-9 && mine !== null && roomHere(state, to[0], to[1]) === mine;
  if (!ok || Math.hypot(to[0] - a.x, to[1] - a.z) < 0.05) { L.noWay = !ok; freezeHere(state, T, a, now); return false; }
  startDash(state, T, a, to, 'flee', now);
  if (L.st !== 'flee' && L.st !== 'freeze') freezeHere(state, T, a, now);
  return L.st === 'flee';
}
// (a freeze where he stands: crouched, the rifle low, finger off)
function freezeHere(state, T, a, now) {
  const L = T.live, k = state.people[L.who].kit;
  L.eng = null; L.eyes = null; L.aiming = null; L.turn = null;
  L.st = 'freeze'; L.fromMs = now; a.stance = 'kneel';
  if (k.carry) { k.carry.posture = 'lowReady'; k.carry.finger = 'off'; }
}
// (a dash held a tick: its clock moved on by the tick)
function holdMove(W) { W.fromMs += TICK_MS; W.untilMs += TICK_MS; W.heldMs += TICK_MS; }
function moveTick(state, bus, H, T, a, now) {
  // (a push-off flies to its profile's end, nothing to hold it short: its length is capped at the start; on his feet the dash's time cap, as built)
  const L = T.live, W = L.move, p = moveAt(W, now), capMs = W.push ? Infinity : W.why === 'flee' ? Math.round(FLEE_MAX_M / DASH_MAX_M * DASH_MAX_MS) : DASH_MAX_MS;
  // (held on a marine's body: the next place closing within BODY_GAP_M of one; a push-off flies on (nothing to stop it but a face))
  const blocked = !W.push && marinesOf(state, H).some(who => { const m = actorOf(state, who) ?? (playerActor(state)?.who === who ? playerActor(state) : null); if (!m) return false; const d1 = Math.hypot(p.x - m.x, p.z - m.z); return d1 < BODY_GAP_M && d1 < Math.hypot(a.x - m.x, a.z - m.z) - 1e-6; });
  if (blocked) {
    holdMove(W);
    if (W.heldMs > HELD_SHORT_MS) { L.move = null; arrive(state, T, a, now); }
    return 0;
  }
  a.x = p.x; a.z = p.z;
  a.headRad = p.headRad; a.face = faceOfHead(a.headRad);
  if (p.done || now - W.startMs >= capMs) { L.move = null; landPush(state, L, W); arrive(state, T, a, now); return 0; }
  return p.vMs;
}
// (a push-off's end: his boots locked on the face he took off from, the deckhead man on it again (footing.js lockOnFace))
function landPush(state, L, W) {
  if (!W?.push) return;
  if (W.push.face === 'deckhead') lockOnFace(state, L.who, 'deckhead'); else setAnchor(state, L.who, 'boots');
}
// (at his hide, or down where he is: crouched, his rifle laid on his door again; the card 'hide' fights from there, cover keeps down;
// v0.0.27: blind fire waits behind the cover (blindTick), and a flight ends in a freeze at his refuge)
function arrive(state, T, a, now) {
  const L = T.live;
  a.stance = 'kneel';
  if (L.choice?.what === 'flee') { freezeHere(state, T, a, now); return; }
  if (L.choice?.what === 'cover' || L.choice?.what === 'blind') { L.st = 'cover'; L.fromMs = now; return; }
  startAim(state, T, a, now);
}

// ---- his choice (step 4) ----

function choiceTick(state, bus, H, T, a, now) {
  const L = T.live, pid = L.who, ch = L.choice;
  // (a give is final; v0.0.27: so is flight)
  if (ch?.what === 'give' || ch?.what === 'flee') return;
  const felt = feltOf(state, pid, now), band = bandN(felt);
  let roll = false;
  if (band !== L.band) { L.band = band; roll = true; }
  else if (ch && (ch.what === 'cover' || ch.what === 'freeze' || ch.what === 'blind') && band >= 2 && now - ch.atMs >= CHOICE_DWELL_MS) roll = true;
  if (!roll) return;
  const { what, grade, dc } = choiceOf(state, pid, { felt, atMs: now, key: `rp:${T.key}`, near: () => weaponNear(state, H, a), resolve: L.resolve ?? null });
  L.choice = { what, band, atMs: now, ...(grade ? { grade, dc } : {}) };
  if (what === 'fight') { if (L.st === 'freeze' || L.st === 'cover' || L.st === 'blind') { delete a.stance; startAim(state, T, a, now); } return; }
  if (what === 'give') { startGive(state, T, now); return; }
  L.eng = null; L.eyes = null; L.aiming = null;
  const k = state.people[pid].kit;
  k.carry.finger = 'off';
  if (what === 'freeze') { if (!L.move) { L.st = 'freeze'; L.fromMs = now; a.stance = 'kneel'; k.carry.posture = 'lowReady'; } return; }
  // (flight to his refuge, or no way out)
  if (what === 'flee') { if (!L.move) startFlee(state, T, a, now); return; }
  // (cover, or v0.0.27's blind fire from behind it: the one dash to his hide, or down where he is when he has dashed already or stands there)
  const S = spotOf(state, T);
  if (!L.dashed && S && Math.hypot(a.x - S.hide[0], a.z - S.hide[1]) > 0.1) startDash(state, T, a, S.hide, 'cover', now);
  else if (!L.move) { L.st = 'cover'; L.fromMs = now; a.stance = 'kneel'; k.carry.posture = 'lowReady'; }
}
/**
 * A role-player's choice at a felt (COMBAT §7.11's table, the security doctrine; see the header): { what: 'fight' | 'cover' | 'freeze' |
 * 'give', band, grade, dc }. Calm or under fire 'fight' with no roll; else supp.js nerveCheck on its stream (key: 'rp:<turner key>'),
 * read on CHOICE_TABLE, a surrender only with near() true (a marine's weapon within SURRENDER_M), else a freeze. resolve (v0.0.26: his
 * L.resolve, a friend seen falling) goes to the nerve check as built; null (none written) rolls as before.
 * v0.0.27 (its build sheet item 6; FT§4.1): the table is his doctrine's (CHOICE_TABLES[doctrine], doctrine his own sheet's
 * skills.doctrine, opforSheet's, unless given): 'security' as above; 'irregular' adds 'blind' (a cover-or-blind cell drawn 1 : 1 on
 * stream(seed, 'house:rp', key, 'cb', atMs) at IRREG_BLIND_SHARE) and 'flee' (pinned, a disaster); 'civilian' is a freeze always, never a
 * roll (no grade, no dc).
 */
export function choiceOf(state, pid, { felt, atMs = state.clock.ms, key = 'rp', near = () => false, resolve = null, doctrine = null }) {
  const band = bandN(felt), doc = doctrine ?? state.people?.[pid]?.skills?.doctrine ?? RP_DOCTRINE, table = Object.hasOwn(CHOICE_TABLES, doc) ? CHOICE_TABLES[doc] : CHOICE_TABLE;
  if (!table) return { what: 'freeze', band, grade: null, dc: null };
  if (band < 2) return { what: 'fight', band, grade: null, dc: null };
  const r = nerveCheck(state, pid, { felt, atMs, key, resolve }), grade = r.roll?.grade ?? 'pass';
  let what = table[Math.min(3, band)][grade] ?? 'freeze';
  if (what === COVER_BLIND) what = next(stream(state.meta.seed, 'house:rp', key, 'cb', atMs)) < IRREG_BLIND_SHARE ? 'blind' : 'cover';
  if (what === 'give' && !near()) what = 'freeze';
  return { what, band, grade, dc: r.dc };
}
// (a marine's weapon within SURRENDER_M of him: his rifle in his hands)
function weaponNear(state, H, a) {
  return marinesOf(state, H).some(who => { const m = who === playerId(state) ? playerActor(state) : actorOf(state, who); const mz = m ? muzzleOf(state, who, m) : null; return !!mz?.inHand && Math.hypot(m.x - a.x, m.z - a.z) <= SURRENDER_M; });
}

// ---- the give (step 2) ----

function startGive(state, T, now) {
  const L = T.live;
  // (a push-off under way ends where he is, his boots locked: he gives from there)
  if (L.move?.push) landPush(state, L, L.move);
  L.give = { atMs: now, dropAtMs: whole(now + GIVE_DROP_MS) };
  L.st = 'hands'; L.fromMs = now; L.gaveAtMs = now;
  L.eng = null; L.eyes = null; L.aiming = null; L.move = null; L.turn = null;
  const k = state.people[L.who].kit;
  // (the rifle lowered to low ready on its way to the floor: the figure lowers it, never holds it aimed through the give)
  k.carry.finger = 'off';
  if (k.carry.posture === 'aimed' || k.carry.posture === 'highReady') k.carry.posture = 'lowReady';
  const g = state.items?.[gunOn(state, L.who)];
  if (g) g.mode = 'safe';
  // (from the give's first tick he is a man giving up, to every reader of his record: a no-shoot showing his hands (the
  // identification's), and every marine's memory of him dropped, so the change is a fresh window that reads it; before
  // v0.0.19's review he read 'threat' with a rifle for the 600 ms of the lowering and your #2 took him in and shot him)
  Object.assign(T, { face: 'noshoot', holds: 'hands' });
  forgetMan(state, T);
}
function giveUp(state, bus, T, a, now) {
  const L = T.live, pid = L.who, gunId = gunOn(state, pid), S = spotOf(state, T);
  if (gunId) {
    const to = S ? bearing(a, S.aimAt[0], S.aimAt[1]) : a.headRad ?? 0, area = rangeOf(state)?.area ?? state.places?.live?.area;
    state.items[gunId].mode = 'safe';
    move(state, gunId, { ground: { area, x: a.x + DROP_M * Math.cos(to), z: a.z + DROP_M * Math.sin(to) } });
    L.rifleId = gunId;
  }
  const k = state.people[pid].kit;
  if (k?.carry) { k.carry.posture = 'slungFront'; k.carry.finger = 'off'; }
  a.hands = true; delete a.stance;
  L.give = null; L.droppedAtMs = now;
  Object.assign(T, { face: 'noshoot', holds: 'hands' });
  say(state, bus, T, 'hands');
  bus?.emit('house', { phase: 'rp', kind: 'hands', key: T.key, stand: T.stand, who: pid, atMs: now });
}
// (at the give's start: every marine's memory of him dropped (men.js forget: your and your #2's known and seenAt), his
// identification by your #2 with it, and your #2's take-in of him and his row on him if no round of it has left the muzzle (a
// row with a round gone is the house's: liveTick cuts its rounds once he sees the hands): the change is taken in afresh)
function forgetMan(state, T) {
  forget(state, T.key);
  const W = rangeOf(state)?.house?.two;
  if (W) {
    if (W.ident) delete W.ident[T.key];
    if (W.eng?.key === T.key && !W.eng.rounds?.some(r => r.done)) W.eng = null;
    if (W.contact?.key === T.key && !W.eng) W.contact = null;
  }
}
// (a challenge of yours on him, from within KNEEL_M: he kneels when it is over)
function kneelTick(state, T, a, now) {
  const L = T.live;
  if (L.knelt) return;
  const d = state.stop?.doing, me = playerActor(state);
  if (d && !d.beats && d.list?.[d.i] === 'contact:challenge' && (d.target ?? state.stop?.pick) === T.key && me && Math.hypot(me.x - a.x, me.z - a.z) <= KNEEL_M) L.chalUntilMs = d.untilMs ?? now;
  if (L.chalUntilMs !== undefined && now >= L.chalUntilMs) { L.knelt = now; a.stance = 'kneel'; }
}

// (your challenge on a man frozen or in cover (see the header): recorded while it runs on him, judged on the first tick he lives
// at or past its end (the tick its sub-step ends holds the clock for your next choice, so the men live the one after); returns whether he gave)
function challengeTick(state, bus, T, a, now) {
  const L = T.live, d = state.stop?.doing, me = playerActor(state);
  const on = !!d && !d.beats && d.list?.[d.i] === 'contact:challenge' && (d.target ?? state.stop?.pick) === T.key;
  // (one left from a challenge he outlasted (he stood to fight before its end) is dropped once its end has passed, never a give later)
  if (L.st !== 'freeze' && L.st !== 'cover') { if (L.chalUntilMs !== undefined && !on && now >= L.chalUntilMs) delete L.chalUntilMs; return false; }
  // (a challenge already over is judged before a new one is taken: the tick a challenge ends holds the clock, so a second Challenge
  // pressed on that held tick runs by the first tick he lives, and taking its end first moved the first one's give 1.2 s on, past
  // his next roll (the review of A, 2026-11-19: the recruit on seed 5, T's "He's done. Challenge him." pressed twice, his re-roll
  // to fight at +350 ms and a chest casualty; with one press he gave on the end tick))
  // (given, L.chalUntilMs stays: kneelTick kneels him on it once his rifle is down)
  if (L.chalUntilMs !== undefined && now >= L.chalUntilMs) {
    const ended = L.chalUntilMs;
    if (challengeHeard(state, L, a, me, now)) { startGive(state, T, now); return true; }
    delete L.chalUntilMs;
    if (!on || (d.untilMs ?? now) <= ended) return false;
  }
  if (on) L.chalUntilMs = d.untilMs ?? now;
  if (L.chalUntilMs === undefined || now < L.chalUntilMs) return false;
  if (!challengeHeard(state, L, a, me, now)) { delete L.chalUntilMs; return false; }
  startGive(state, T, now);
  return true;
}
// (whether a challenge ending now reaches him: you within KNEEL_M, whom he sees or hears (see the header))
function challengeHeard(state, L, a, me, now) {
  return !!me && Math.hypot(me.x - a.x, me.z - a.z) <= KNEEL_M && (bodySeen(state, a, me.x, me.z, now) >= SEEN || hearsVoice(state, L.who, { x: me.x, z: me.z }, now));
}

function say(state, bus, T, kind) {
  const L = T.live;
  // (on 'real' a man shot does not announce it: no "Hit!" (FT§5.5))
  if (kind === 'down' && realOf(state)) return;
  if (L.said[kind]) return;
  L.said[kind] = state.clock.ms;
  sayOn(state, bus, { who: L.who, text: RP_SAY[kind], kind: 'speech' });
}

// ---- v0.0.27, "Away the boarding party": blind fire, self-aid, the real down and rise, the side, hors de combat ----

// (any marine's actor: the stage's list, the player's own first)
const anyActor = (state, who) => (playerActor(state)?.who === who ? playerActor(state) : actorOf(state, who));
/**
 * Blind fire (w; DF§5, FT§4.2; its build sheet item 6, F158): an irregular who chose 'blind', behind his cover (st 'cover' after his one
 * dash or where he is), fires once a marine not down is in his own compartment (roomHere): kneeling, st 'blind' (FIRING BLIND) exactly
 * while he does, one round every BLIND_GAP_MS at the nearest such marine, with no take-in and no aim time, shot.js BLIND_FIRE_MOD on
 * the roll ('firing blind'), his eyes down (nothing seen, nothing remembered), the round line-masked as his pair's (carry.js
 * lineMasked: it strikes the first marine on its line), then men.js incoming; his rounds kept with `blind: true`. The magazine's end or a
 * stoppage is his drill as built (behind the cover: back to it after). Nobody in his compartment: back behind the cover (st 'cover'),
 * the rifle low. Rolled again after the dwell (choiceTick).
 */
export function blindTick(state, bus, R, H, Lv, T, a, now) {
  const L = T.live, pid = L.who, gunId = gunOn(state, pid), gun = state.items?.[gunId], k = state.people[pid].kit;
  const mine = roomHere(state, a.x, a.z);
  let best = null;
  if (mine !== null && gun) {
    for (const who of marinesOf(state, H)) {
      const m = anyActor(state, who);
      if (!m || marineDown(state, who, now) || roomHere(state, m.x, m.z) !== mine) continue;
      const dM = Math.hypot(m.x - a.x, m.z - a.z);
      if (!best || dM < best.dM) best = { who, dM };
    }
  }
  L.eyes = null; L.eng = null; L.aiming = null; L.turn = null;
  a.stance = 'kneel';
  if (!best) {
    if (L.st === 'blind') { L.st = 'cover'; L.fromMs = now; }
    if (k.carry) { k.carry.posture = 'lowReady'; k.carry.finger = 'off'; }
    return null;
  }
  if (L.st !== 'blind') { L.st = 'blind'; L.fromMs = now; }
  gun.mode = 'semi';
  k.carry.posture = 'aimed'; k.carry.finger = 'on';
  if (Number.isFinite(L.blindNextMs) && now < L.blindNextMs) return null;
  L.blindNextMs = now + BLIND_GAP_MS;
  const aimed = marineTarget(state, best.who, a, now), from = aimed ? lineFromOf(state, pid, a, aimed) : null;
  const other = aimed ? marinesOf(state, H).filter(x => x !== best.who).map(x => marineTarget(state, x, a, now)).filter(Boolean) : [];
  const first = aimed && other.length ? lineMasked(from, aimed, other.map(o => ({ ...o, stance: anyActor(state, o.who)?.stance ?? 'stand' }))) : null;
  const t = first ? marineTarget(state, first.who, a, now) : aimed;
  if (!t) return null;
  a.headRad = q(bearing(a, t.x, t.z), 1e-6); a.face = faceOfHead(a.headRad);
  const { shot } = resolveShot(state, bus, { pid, gunId, target: t, part: 'torso', log: false, atMs: now, row: { id: 'shot:blind', n: 1, i: 0 }, blind: true });
  let out = null;
  if (shot.fired) {
    L.fired += 1; L.firstAtMs ??= now; L.blindN = (L.blindN ?? 0) + 1;
    out = incoming(state, bus, { who: t.who, by: T.key, shot, atMs: now });
    if (shot.brassRec && R.brass) { R.brass.push({ ...shot.brassRec, who: pid }); if (R.brass.length > BRASS_LIVE) R.brass.splice(0, R.brass.length - BRASS_LIVE); }
  }
  Lv.shots.push({ id: shot.id, atMs: now, by: T.key, at: `m:${t.who}`, fired: !!shot.fired, hit: !!out?.hit, blind: true, ...(shot.part ? { part: shot.part } : {}), ...(shot.zone ? { zone: shot.zone } : {}) });
  if (Lv.shots.length > SHOTS_KEPT) Lv.shots.splice(0, Lv.shots.length - SHOTS_KEPT);
  if ((!shot.fired && shot.why !== 'safety') || shot.stoppage) startStoppage(state, T, now);
  return shot;
}

/**
 * His own tourniquet (w; COMBAT §7.3's level 2, FT§7.1; its build sheet item 9, F164): on 'real', conscious (his body not down by the
 * wound model: the knock over, nothing out), a limb bleeding hard (aid.js tourniquetOf, B's): aid.js TQ_MS of nothing else (L.aid), then
 * aid.js applyTourniquet, the 'house' fact phase 'rp' kind 'tourniquet'. A shock pauses nothing of it but his hands' next act. Returns
 * whether his hands are on it this tick.
 */
function aidTick(state, bus, T, a, now) {
  const L = T.live;
  if (!realOf(state)) return false;
  const rec = state.people[L.who]?.body;
  if (L.aid) {
    if (now < L.aid.untilMs) return true;
    const inj = rec?.injuries?.[L.aid.i] ?? null;
    if (inj) applyTourniquet(rec, inj, now);
    bus?.emit('house', { phase: 'rp', kind: 'tourniquet', key: T.key, stand: T.stand, who: L.who, part: inj?.part ?? null, atMs: now });
    L.aid = null;
    return false;
  }
  if (!rec || downOf(rec, now).down) return false;
  const inj = tourniquetOf(rec, now);
  if (!inj) return false;
  L.aid = { i: rec.injuries.indexOf(inj), part: inj.part, fromMs: now, untilMs: whole(now + TQ_MS) };
  L.eng = null; L.eyes = null; L.aiming = null; L.turn = null;
  if (L.st === 'blind') L.st = 'cover'; else if (L.st === 'fire') L.st = 'aim';
  const k = state.people[L.who]?.kit;
  if (k?.carry) { k.carry.finger = 'off'; if (k.carry.posture === 'aimed') k.carry.posture = 'lowReady'; }
  return true;
}

// (a man down on 'real' (manTick's): his own tourniquet once the knock is over, else up when his body is (opforRise))
function downTick(state, bus, T, a, now) {
  const L = T.live, rec = state.people[L.who]?.body;
  if (L.aid || (rec && !downOf(rec, now).down && tourniquetOf(rec, now))) { aidTick(state, bus, T, a, now); return; }
  if (!bodyDown(state, L.who, now)) opforRise(state, bus, T, now);
}
/**
 * A defender up again (w; v0.0.27, on 'real': FT§5.2, the build sheet item 7): his body no longer down (bodyDown false: the knock over,
 * and nothing that makes a casualty wait, body/domain.js woundsFast's rule), he rises from where he fell, crouched (st 'freeze', his
 * stand no longer stopped: a fighter again, who may reopen his room), and his choice is rolled at once on his felt (choiceTick with his
 * band unread: a strike is supp.js HIT_PTS, so mostly pinned: cover, blind fire or a freeze); once his side has given up (sideTick,
 * final) he rises giving (startGive), never to a choice. The 'house' fact phase 'rp' kind 'rise'.
 * Returns whether he rose.
 */
export function opforRise(state, bus, T, atMs = state.clock.ms) {
  const L = T?.live, a = actorOf(state, L?.who), R = rangeOf(state);
  if (!L || L.st !== 'down' || !a) return false;
  L.st = 'freeze'; L.fromMs = atMs; L.rose = (L.rose ?? 0) + 1;
  delete L.downAtMs;
  T.stoppedAtMs = null;
  delete a.posture; a.stance = 'kneel';
  const p = state.people[L.who]?.post;
  if (p) delete p.posture;
  bus?.emit('house', { phase: 'rp', kind: 'rise', key: T.key, stand: T.stand, who: L.who, atMs });
  // (the side given up (sideTick: final): an armed man down at the intercom's words rises giving, his hands up, never to the fight
  // (the boarding round's review: 6 of 36 rose to 'aim' and 'fight' 34 to 43 s after it))
  if (R?.house?.boarding?.side?.gaveAtMs != null && !L.unarmed) { startGive(state, T, atMs); return true; }
  if (L.choice?.what !== 'flee' && L.choice?.what !== 'give') { L.band = -1; choiceTick(state, bus, R?.house, T, a, atMs); }
  return true;
}

// (standing for the side (COMBAT §14.6): an armed man not down, ruled out, giving or given up, nor fled)
const standing = (T) => { const L = T.live; return !!L && !L.unarmed && L.st !== 'down' && L.st !== 'out' && L.st !== 'hands' && !L.give && L.choice?.what !== 'flee'; };
/**
 * The side's give-up (w; COMBAT §14.6, FT§4.4; its build sheet item 11, F159), at opforTick's end aboard: the armed men standing at
 * GIVE_UP_LEFT of the start (R.house.boarding.side.armed, fillOpfor's) or fewer, the side rolls GIVE_UP_P on stream(seed,
 * 'boarding:side', n) at that crossing and every GIVE_UP_EVERY_MS after while someone stands; a success is final: every standing armed
 * man gives at once (startGive) and the hauler's intercom says SIDE_SAYS, a bubble at the speaker of the compartment of the standing man
 * nearest you. Each roll the 'house' fact phase 'side'. Returns true on the give, false on a failed roll, null otherwise.
 */
export function sideTick(state, bus, R = rangeOf(state), H = R?.house, now = state.clock.ms) {
  const S = H?.boarding?.side;
  if (!S || S.gaveAtMs !== null || !(S.armed > 0)) return null;
  const up = R.turners.filter(T => T.live && standing(T));
  if (up.length > GIVE_UP_LEFT * S.armed) return null;
  if (S.crossedAtMs === null) { S.crossedAtMs = now; S.nextAtMs = now; }
  if (!up.length || now < S.nextAtMs) return null;
  const n = S.rolls;
  S.rolls += 1; S.nextAtMs = now + GIVE_UP_EVERY_MS;
  const ok = next(stream(state.meta.seed, 'boarding:side', n)) < GIVE_UP_P;
  bus?.emit('house', { phase: 'side', n, ok, left: up.length, armed: S.armed, atMs: now });
  if (!ok) return false;
  S.gaveAtMs = now;
  for (const T of up) startGive(state, T, now);
  intercom(state, bus, up, now);
  return true;
}
// (the intercom's line: a bubble at the 1MC speaker of the compartment of the standing man nearest you (the area's `speakers`), never voiced)
function intercom(state, bus, up, now) {
  const me = playerActor(state), area = state.places?.live?.area, A = area ? areaOf(area) : null;
  const near = up.map(T => actorOf(state, T.live.who)).filter(Boolean).sort((p, q2) => Math.hypot(p.x - (me?.x ?? 0), p.z - (me?.z ?? 0)) - Math.hypot(q2.x - (me?.x ?? 0), q2.z - (me?.z ?? 0)))[0] ?? null;
  const room = near && area ? roomOf(area, near.x, near.z)?.id ?? null : null, sp = A?.speakers?.find(x => x.room === room) ?? A?.speakers?.[0] ?? null;
  bus?.emit('say', { who: null, speaker: 'Intercom', text: SIDE_SAYS, kind: 'pa', ...(sp ? { at: { x: sp.x, y: sp.y ?? 2.3, z: sp.z } } : {}) });
  logEntry(state, bus, { kind: 'say', tone: 'note', who: null, text: SIDE_SAYS, say: 'pa', name: 'the intercom' });
}

/**
 * Hors de combat (v0.0.27, COMBAT §7.10, FT§5.4; its build sheet item 10, F155): whether a man could not fight when a round left at ms,
 * as his record shows him to every marine: 'unarmed' (a crewman, from his first tick), 'down' (on the deck, PROTECTED_AFTER_MS after his
 * fall: a pair's second round already in the air is not a new decision), 'hands' (his give's first tick, the same PROTECTED_AFTER_MS on:
 * a man who drops his rifle as you fire is not your fault), or null (up and armed: a cowering or fleeing armed man is lawful). A man ruled
 * out is judged as he was when ruled. by: the shooter (D's houseShot passes it; every marine's take-in reads the same record today).
 * Pure; shoothouse.js houseShot faults 'protected' on it (D's).
 */
export function protectedOf(state, T, ms = state.clock.ms, { by = null } = {}) {
  const L = T?.live;
  if (!L) return null;
  if (L.unarmed) return 'unarmed';
  const st = L.st === 'out' ? (liveOf(state)?.ruled?.find(x => x.key === T.key)?.was ?? 'out') : L.st;
  const gave = Number.isFinite(L.gaveAtMs) && (st === 'hands' || !!L.give || T.face === 'noshoot');
  if (gave && ms - L.gaveAtMs >= PROTECTED_AFTER_MS) return 'hands';
  const downAt = Number.isFinite(L.downAtMs) ? L.downAtMs : T.stoppedAtMs;
  if (st === 'down' && Number.isFinite(downAt) && ms - downAt >= PROTECTED_AFTER_MS) return 'down';
  return null;
}

// ---- hits and rulings ----

/**
 * A marine's round on a role-player (w; from the house's houseShot once T.hits has it): his pool +HIT_PTS a strike, his eye drawn to
 * a shooter he did not know, and the strike rated by the one rule (would.js wouldHave; fatal, he is down, sitting where he
 * stands, T.stoppedAtMs the round's, "Hit!"; a wound or a stop, he fights on by his card). Returns { torso, head, down, would } or
 * null for a record not live.
 */
export function opforHit(state, bus, T, shot, now = state.clock.ms) {
  const L = T?.live;
  if (!L || !shot?.fired) return null;
  // (a round handed twice counts once: the shots taken, kept on his record)
  if ((L.took ??= []).includes(shot.id)) return { torso: null, head: null, down: L.st === 'down', again: true };
  L.took.push(shot.id);
  const hit = T.hits.some(h => h.shotId === shot.id);
  if (hit && L.st !== 'out') addSupp(state, bus, L.who, { id: `${shot.id}:hit`, kind: 'hit', pts: inputPts('hit'), atMs: shot.atMs ?? now });
  const key = `m:${shot.who ?? playerId(state)}`;
  if (!SPENT.has(L.st) && L.known[key] === undefined) L.drawn = { key, atMs: now };
  const torso = T.hits.filter(h => h.part === 'torso' && (h.zone === 'A' || h.zone === 'C')).length, head = T.hits.filter(h => h.zone === 'head').length;
  // (a strike on the man: the zones of his target, A, C or the head (a record's miss is none))
  const h = hit ? T.hits.find(x => x.shotId === shot.id && (x.zone === 'A' || x.zone === 'C' || x.zone === 'head')) : null;
  const would = h ? wouldHave(state, strikeOf(state, shot, { on: L.who, by: h.by ?? null, part: h.part, zone: h.zone }), bus) : null;
  // (on 'real' the round was on his own body (would.js's real branch), and he goes down when it is down, the knock included)
  const down = realOf(state) ? !!h && bodyDown(state, L.who, shot.atMs ?? now) : !!h && !!fatalOf(state, L.who);
  if (down && L.st !== 'down' && L.st !== 'out') goDown(state, bus, T, shot.atMs ?? now);
  return { torso, head, down: L.st === 'down', would };
}
/** A role-player a wound put down later (would.js wouldTick; w): down where he stands at atMs, as at a fatal round; a man down or out already stays so. */
export function opforBled(state, bus, T, atMs = state.clock.ms) {
  const L = T?.live;
  if (L && L.st !== 'down' && L.st !== 'out') goDown(state, bus, T, atMs);
}
function goDown(state, bus, T, atMs) {
  const L = T.live, a = actorOf(state, L.who), real = realOf(state), W = L.move;
  L.st = 'down'; L.fromMs = atMs;
  if (real) L.downAtMs = atMs;
  L.eng = null; L.eyes = null; L.aiming = null; L.move = null; L.turn = null; L.give = null; L.ia = null;
  if (L.aid) L.aid = null;
  if (T.stoppedAtMs === null) T.stoppedAtMs = atMs;
  const k = state.people[L.who]?.kit;
  if (k?.carry && gunOn(state, L.who)) { k.carry.posture = 'lowReady'; k.carry.finger = 'off'; }
  // (on 'real': his stance is his body's (body/domain.js woundsFast keeps it 'down'), not a sitting post: in free fall he hangs
  // from his boots, the look's to draw (E's); a push-off cut short by the round ends where he is, his boots locked)
  if (a && real) { delete a.v; a.gait = 'idle'; landPush(state, L, W); }
  else if (a) { a.posture = 'sit'; delete a.stance; delete a.v; a.gait = 'idle'; }
  const p = state.people[L.who]?.post;
  if (p && !real) p.posture = 'sit';
  say(state, bus, T, 'down');
  bus?.emit('house', { phase: 'rp', kind: 'down', key: T.key, stand: T.stand, who: L.who, atMs });
  friendDown(state, bus, T, atMs);
}
/**
 * A friend seen falling (w; v0.0.26, COMBAT §7.10; see the header): from goDown, once a fall. Each other live man not spent who sees T
 * fall (men.js bodySeen from his eye, at SEEN) or stands within FRIEND_HIT_M of him in the same room: supp.js 'friendHit' on his pool
 * (inputPts' own gate: FRIEND_HIT_PTS within FRIEND_HIT_M, nothing past it) and his L.resolve less RESOLVE_FRIEND. Returns the keys
 * of the men it reached ([] where no one qualifies: nothing written).
 */
export function friendDown(state, bus, T, atMs = state.clock.ms) {
  const R = rangeOf(state), fa = actorOf(state, T?.live?.who), out = [];
  if (!R || !fa) return out;
  const room = roomHere(state, fa.x, fa.z);
  for (const O of R.turners) {
    const L = O.live;
    if (O === T || !L || SPENT.has(L.st) || L.give) continue;
    const a = actorOf(state, L.who);
    if (!a) continue;
    const rM = Math.hypot(a.x - fa.x, a.z - fa.z), near = room !== null && rM <= FRIEND_HIT_M && roomHere(state, a.x, a.z) === room;
    if (!near && !(bodySeen(state, a, fa.x, fa.z, atMs) >= SEEN)) continue;
    addSupp(state, bus, L.who, { id: `${T.key}:friend`, kind: 'friendHit', pts: inputPts('friendHit', { rM }), atMs, why: 'a friend down' });
    L.resolve = q((L.resolve ?? 1) - RESOLVE_FRIEND, 0.01);
    out.push(O.key);
  }
  return out;
}
/**
 * The instructor's ruling on a role-player (w): he is out (why 'clear' | 'passed' | 'lane' | 'frag' | 'setup'), sits on as he is and acts no
 * more; R.house.live.ruled gains { key, why, atMs }; a man not yet down is stopped at the ruling (T.stoppedAtMs), so every reader of the
 * stands counts him done. Returns whether he was ruled now.
 */
export function ruleOut(state, bus, T, why, atMs = state.clock.ms) {
  const L = T?.live, Lv = liveOf(state);
  if (!L || L.st === 'out') return false;
  const was = L.st;
  L.st = 'out'; L.outWhy = why; L.fromMs = atMs;
  L.eng = null; L.eyes = null; L.aiming = null; L.move = null; L.turn = null; L.give = null; L.ia = null;
  if (T.stoppedAtMs === null) T.stoppedAtMs = atMs;
  const k = state.people[L.who]?.kit;
  if (k?.carry && gunOn(state, L.who)) { k.carry.posture = 'lowReady'; k.carry.finger = 'off'; }
  const g = state.items?.[gunOn(state, L.who)];
  if (g) g.mode = 'safe';
  Lv?.ruled.push({ key: T.key, why, atMs, was });
  bus?.emit('house', { phase: 'rp', kind: 'out', key: T.key, stand: T.stand, who: L.who, why, atMs });
  return true;
}

// ---- the views ----

/** The role-players now (the hud's, the bots' and the tests' view): [{ key, stand, name, who, card, st, x, z, room, slot, headRad, fired, firstAtMs, hits, fatal (the why of his fatal strike, would.js, or null), rifle, choice, band, outWhy, giving, knelt, dazed, resolve, searched }] (v0.0.26: dazed men.js liveStateOf's, resolve his L.resolve or null, searched contact.js's { by, atMs } or null). */
export function opforNow(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R?.house?.live) return [];
  return R.turners.filter(T => T.live).map(T => {
    const L = T.live, a = actorOf(state, L.who);
    const torso = T.hits.filter(h => h.part === 'torso' && (h.zone === 'A' || h.zone === 'C')).length, head = T.hits.filter(h => h.zone === 'head').length;
    return { key: T.key, stand: T.stand, name: T.name, who: L.who, card: L.card, st: L.st, x: T.x, z: T.z, room: T.room, slot: T.slot, headRad: a?.headRad ?? null,
      fired: L.fired, firstAtMs: L.firstAtMs, hits: { torso, head }, fatal: fatalOf(state, L.who)?.why ?? null, rifle: rifleWhere(state, T), choice: L.choice?.what ?? null, band: L.band, outWhy: L.outWhy ?? null,
      giving: !!L.give, knelt: !!L.knelt, dazed: liveStateOf(state, T, ms) === 'dazed', resolve: L.resolve ?? null, searched: L.searched ?? null, at: ms,
      // (aboard: blind fire, the flight, a crewman, no way out, his tourniquet under way, his rounds blind, the side's give)
      ...(R.house.boarding ? { blind: L.st === 'blind', fleeing: L.st === 'flee', unarmed: !!L.unarmed, noWay: !!L.noWay, aid: !!L.aid, blindN: L.blindN ?? 0, rose: L.rose ?? 0,
        side: R.house.boarding.side?.gaveAtMs ?? null, protected: protectedOf(state, T, ms) } : {}) };
  });
}
// (where his rifle is: in his hands, across his knees (down), on the floor (given up), or nowhere)
function rifleWhere(state, T) {
  const L = T.live;
  if (L.rifleId) return 'floor';
  if (!gunOn(state, L.who)) return null;
  return actorOf(state, L.who)?.posture === 'sit' ? 'knees' : 'hands';
}
/**
 * The stage's role-players (look.js rangeLook().house's, the look role's): [{ key, who, x, z, headRad, frame, posture, stance, hands,
 * rifle: { where: 'hands' | 'knees' | 'floor', x?, z?, yawRad?, fromMs? }, mask: true }]. frame: 'stand', 'aim', 'run', 'crouch',
 * 'cower', 'drop' (the rifle falling, from L.give's atMs to its dropAtMs), 'hands', 'kneel', 'sit', and (v0.0.26) 'daze' (men.js
 * liveStateOf 'dazed': shocked, not down nor giving; before cower, run, aim, crouch and stand); v0.0.27, aboard, 'blind' (st 'blind':
 * FIRING BLIND) and 'flee' (st 'flee': RUNNING AWAY), after the daze. The view never reads this (look.js gunLook is its one reader of a
 * man's frame, E's); the tests and seen.js do.
 */
export function opforLook(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R?.house?.live) return [];
  const lying = R.area ? lyingOf(state, R.area) : [];
  return R.turners.filter(T => T.live).map(T => {
    const L = T.live, a = actorOf(state, L.who), carry = state.people[L.who]?.kit?.carry ?? {};
    const frame = L.st === 'down' || (L.st === 'out' && a?.posture === 'sit') ? 'sit' : L.give ? 'drop' : L.st === 'hands' ? (L.knelt ? 'kneel' : 'hands')
      : liveStateOf(state, T, ms) === 'dazed' ? 'daze' : L.st === 'blind' ? 'blind' : L.st === 'flee' ? 'flee' : L.st === 'move' ? 'run' : L.st === 'freeze' ? 'cower' : carry.posture === 'aimed' ? 'aim' : a?.stance === 'kneel' ? 'crouch' : 'stand';
    const floor = L.rifleId ? lying.find(l => l.id === L.rifleId) ?? null : null;
    // (a crewman has none: { where: 'none' })
    const rifle = L.unarmed ? { where: 'none' } : floor ? { where: 'floor', x: floor.x, z: floor.z, yawRad: q(bearing(a ?? { x: T.x, z: T.z }, floor.x, floor.z), 1e-4) } : L.give ? { where: 'hands', fromMs: L.give.atMs, toMs: L.give.dropAtMs } : { where: rifleWhere(state, T) ?? 'hands' };
    return { key: T.key, stand: T.stand, who: L.who, x: a?.x ?? T.x, z: a?.z ?? T.z, headRad: a?.headRad ?? null, frame, posture: a?.posture ?? 'stand', stance: a?.stance ?? 'stand', hands: !!a?.hands, rifle, mask: true };
  });
}
