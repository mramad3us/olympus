// OLYMPUS sim: the drill instructor's close-quarters rules in the house, what the drill says next at the door, in the room and at the pause (COMBAT §25.8.3; SKILLS §14; the build sheet 0.0.12 §2.2, §8 items 9, 10).
//
// The DI's voice in your head (SKILLS §14.3), dry, second person, one idea; from rung 3 it has no speaker, a plain thought,
// the marine's own (COMBAT §25.8.1: "the voice becomes his own": the rule's voice is 'di' below rung 3 and 'self' from it).
// The drill's lines are tiered by Tactics, the shots' by Marksmanship (SKILLS §14.3 rule 5: under 8, 8 to 19, 20 and up),
// four phrasings at least to each case (SKILLS §14.7). Every line that names a row names one the panel has now, and T does
// that row (stepsOf: an act only when its row is offered, actIf), never the shot ("T aims and goes off safe but never takes
// the shot"); the house's lines fire only in the house (the live area is the lane's: shooting.js inHouse) and are silent
// while a take-in's window is open (instinct.js gives nothing then), and only on the lane, from GO to its end (before GO
// and after it the instructor's commands are the range's rules', instinct.js: the fixer's of 0.0.12, T stacked a cold
// rifle on room 1 at LOAD and topped up at UNLOAD). What T does grows with the rung (COMBAT §25.8.1):
//   cqb-stack     note    the lane's door ahead, not stacked, not in: rung 0 Stack up; 1 and 2 Stack up, take point; 3 and
//                         4 "Open, clear the room" (one room a press: "Clear the house" withdrawn in the rework's R4); v0.0.20's
//                         hunt (breach-2): also a stack you had taken and walked off, the door shut (offStack)
//   (2026-11-15, the corner role: the line at the stack names your corner once, src/sim/combat/corner.js's rule in words,
//   "Your corner: left.": cqb-door's below rung 3, cqb-stack's from it, where the room is one press from the hall)
//   cqb-task      note    v0.0.19: your #2 on the door on your word (TEAM 2, 3): "Your two's on the door. Cover it." with your entry
//                         on his work (it waits on his cue), else Wait; "Bang! Go." once the bang has gone or the door is open;
//                         "He needs the door. Give him room." on his front point; "He's taking his charge off. Wait." on As you were;
//                         after As you were or a task that failed, the door shut: "Your call. Back on the door." (your Stack up)
//   cqb-door      note    stacked, the door shut: below rung 2 its row by the swing (Open the door: push or pull), Kick door
//                         where locked and a push (bundle.js breachOf); from rung 2 the group the door begins: "Open, in: your corner" (2), "Open, clear the
//                         room" (3 and 4)
//   cqb-go        note    the door open, not in: rungs 0 and 1 **X go**, the panel's "go: the clock runs, the keys move
//                         you" row ('leave'), the walk's keycaps in the words (the AZERTY keys of the bearing from the
//                         stack to your point, each room's own; its side named once already, at the stack: cqb-door),
//                         never the feet (the build sheet's §8 item 9:
//                         the user's "then would move in using movement keys (game unpaused with X)"); rung 2 Enter and
//                         clear your corner; 3 and 4 the room's bundle
//   cqb-funnel    warn    standing in the doorway (room.js inFunnel, still): from rung 2 Enter; below it, once past the
//                         threshold Move to your point, else "Out of the door. Keys, in." and X, as cqb-go (the fixer's of
//                         0.0.12: the same advice did nothing on T in the doorway and X at the open door)
//   cqb-grenade   urgent  (R1 b) a live grenade on the floor whose burst would stun you where you stand (burst.js stunOn: its
//                         stun line, the walls counted) and Get clear offered: "Grenade! Get clear." (tier 1) to "Grenade! Move." (tier 3),
//                         T Get clear (bundle.js move:clear; the hand-back of a slip at your feet or a toss short, SLIP_WORDS and
//                         SHORT_WORDS). First of the rules: nothing else is worth saying with a grenade at your feet
//   cqb-hands     urgent  (v0.0.19) a device in the hand: a live grenade "Throw it!"; at a contact its way out (devplan.js handsPath,
//                         "Hands first."); v0.0.20, nobody up: this door's drill that uses it ("Finish it: …"), else its throw
//                         through the leg's open door from the stack side, else its way out; never "Get it up." (Up is struck
//                         while the hands are full); a question standing (the #2 away, an inner door) its own line's; never a
//                         practice frag or concussion into a room the brief did not call hostiles only (briefBars): the way out
//   cqb-flag      urgent  the muzzle's 3-D line across the #2's body within FLAG_REACH_M 5 m, the rifle in hand and neither
//                         at high ready nor at low ready (carry.js flagsAt, the house's fault's rule too): Low ready, "Muzzle
//                         down." (COMBAT §25.19.3.5, from R4; high ready where the low is not offered)
//   cqb-contact   urgent  a threat he took in still up and facing in the room, at the pause or after it (every man of the
//                         room he identified, at any of his pauses: the scene's record keeps each, his own corner's first):
//                         below rung 2 Off safe, then Aim (T aims); from rung 2 the row's name and no act ("Rifle. Pair.");
//                         the bracket on another man (a second contact's, a reflex's, a no-shoot): the aim onto him, at
//                         every rung (the fixer's of 0.0.12: the line went quiet, or said "No shot" with a threat up),
//                         and only onto a man in the rifle's frame: none of his in it (hidden by a jamb), "In." and
//                         Carry on (2026-11-12; v0.0.20: the bracketed man too, once out of the frame); from rung 2 with every shot row struck (one round left): Aim (T aims), then Press (Fire), as
//                         below rung 2; none at all (the bolt locked on an empty): quiet, cqb-reload leads (2026-11-11)
//   cqb-rp-fire   urgent  (v0.0.19, "Stack and clear, live") a role-player of yours up and firing on the stack, bracketed, from
//                         rung 2: "He's on you. Pair." and no act, the pair left to you (below rung 2 cqb-contact's Off safe, Aim, Press)
//   cqb-rp-down   warn    (v0.0.19) a role-player of the room down, still armed, nobody covering him (combat/men.js gateWhy 'down'):
//                         Cover him (the contact's "Cover him", else the aim onto him and its hold); the room's "Clear!" waits on it
//   cqb-rp-hands  warn    (v0.0.19) one who gave up, his hands seen up, uncovered: Challenge him, then Cover him
//   cqb-rp-dazed  urgent  (v0.0.26, "Bang, then go" only: R.house.bangGo) a role-player of yours bracketed, up and dazed (men.js
//                         liveStateOf 'dazed': startled, flash-blind or stunned), from rung 2: "He's dazed. Now." and no act, the
//                         pair it names left to you, as cqb-rp-fire's (tests/bots/house.mjs SHOT_LINES and PAIR_LINES carry it);
//                         urgent, so it leads over cqb-contact's "Pair." on the same man (the window is the lesson)
//   cqb-rp-hands  (v0.0.26, "Bang, then go" only) its 'cower' variant: a man of the room seen cowering (liveStateOf 'cowering', his
//                         body at SEEN from your eye), not yet given up: "He's done. Challenge him.", the Challenge with the bracket
//                         on him, else the aim onto him; cqb-contact and cqb-rp-fire keep quiet over him meanwhile (a round at him
//                         stays lawful)
//   cqb-up        urgent  (v0.0.27, a real fight only: would.js realOf) your stance down after a round and your body no longer down
//                         (contact.js knockedDown: the knock over): "On your feet.", T the row "Get up" (contact.js 'contact:up';
//                         the rifle on its sling, its Up first),
//                         G into the mode out of it; while the knock lasts this line is quiet and T presses nothing (contact.js
//                         refusesAct refuses every act while your body is down)
//   cqb-passage   warn    (v0.0.27, "Away the boarding party": the fire team's holders, combat/holders.js) a holder down (his stance
//                         'down'), so the passage he held is nobody's: "Nobody on the passage. Watch your back." No act: said only while
//                         time runs (never at a pause, so T and the honest bot never stand on it), at most once a REPEAT_MS, never once
//                         the fall back is called
//   cqb-back      urgent  (v0.0.27) the fall back called (R.house.boarding.fallback, the scene's at two of four down): "Back to the lock.",
//                         T the scene's row "Back to the lock" (team.js FALLBACK_ROW 'move:lock'), wherever it is offered
//   cqb-rp-search note    (v0.0.26, "Bang, then go" only) after the room's "Clear!", a man accounted for there within contact.js
//                         SEARCH_M 1.5 m, not yet searched (searchableOf): "Search him if you want the truth now.", Search him;
//                         farther, its 'walk' variant: "Go to him. Search him if you want the truth now.", the walk up to him
//                         (contact.js searchWalkOf's 'move:search')
//   cqb-rp-gone   warn    (v0.0.19) one the team saw, up, in nobody's sight now (gateWhy 'unaccounted'): "Find him.", the Look at
//                         the hot spot nearest where he was last seen (the house's H.live.lastAt, never where he is)
//   cqb-hostage   urgent  the hostage card bracketed: "Hostage. Head only, or hold.": the aim if not aimed, below rung 2; from
//                         rung 2 To the head's aim is inside it, so the line names the row and T leaves the shot to you (R3)
//   cqb-noshoot   warn    identified with empty hands or a phone: "Hands. No weapon. Don't." No act, at the pause only; with a
//                         halted bundle to carry on and nobody up, "No shot. Carry on." and T carries on
//   cqb-still-up  urgent  "He's still up" (specials.js stillUp) on a threat or the armoured, never a no-shoot or the hostage: To
//                         the head's name, the aim if not aimed below rung 2 (from rung 2 the row's own aim, as cqb-hostage)
//   cqb-locked    warn    the door's push or pull struck "locked", or a bundle handed back 'refused': an inner door Hold it,
//                         the lane's door Kick it ("Locked. Kick it."; a door that held a kick but is not locked: "It held.
//                         Kick it again."; never "hold it" at a lane door, which has no Hold it row); a pull door has no kick
//                         (places/swing.js, 2026-11-15): never "Kick it" there, an inner one Hold it, the lane's refused at its plan;
//                         v0.0.20: out of the Kick row's reach, the kick again by Carry on or the room's row that kicks, and quiet
//                         once the way in is set to another (Kick ⇄ Pry: that way's row is cqb-stack's)
//   cqb-unplanned warn    a bundle handed back 'door-unplanned': Hold it ("Door, east wall. Hold it or clear it?")
//   cqb-two       warn    a bundle handed back 'two' and your #2 still over TWO_SLOT_M from his slot: Wait
//   cqb-blocked   warn    a walk of yours held PIN_END_MS by a body, handed back 'blocked' (places/move.js): "Your two's in
//                         your way. {keys} round him, or T." (the keys toward where it was going), T Carry on
//   cqb-two-out   warn    your #2 held on his cue TWO_OUT_LINE_MS by you standing on his way in, you inside: "Your two's
//                         outside. Off his lane.", T your point (out of the mode, G first)
//   cqb-limit     warn    you LIMIT_WARN_MS in his sector's wedge before he has swept the room (combat/two.js maskTick):
//                         "You're in his sector. Back to your point.", T your point (out of the mode, G first)
//   cqb-pair      note    in the hall, your lead over him along its axis past HALL_PAIR_M (bundle.js hallLead): "Wait for
//                         your two.", T Wait (out of the mode, G first)
//   cqb-carryon   note    a bundle halted and nothing standing to answer (the 'two' hand-back once he is in place): Carry on;
//                         "He's down." only over a man bracketed down, else "Carry on." (v0.0.20's hunt, breach-9)
//   cqb-dominate  note    rung 2 in the room, nobody of it up and Dominate offered: Dominate (the corporal's next group)
//   cqb-corner    warn    rungs 0 and 1, in the room, a hot spot the scene has not seen covered: a Look at it; the far leg
//                         (a plan's `far`) not yet in view: "Move: the far leg" first (0.0.12's integration)
//   cqb-hall      note    the hall's leg (no door): from rung 2 its bundle (the house's rest, the room's, Dominate, Enter), below
//                         it Move to the hall's end
//   cqb-clear     note    in the room (or the hall), every hot spot covered (the scene's record) and nobody standing: "Clear!"
//   cqb-reload    warn    the gun in use believed dry (the bolt locked back, or the chamber empty with no magazine in): RELOAD
//                         (Transition first where the P-12 is holstered and a man close, Magazine in, the bolt release),
//                         "Pistol's dry. Rifle up." where nothing is left to load; dry, cqb-still-up, cqb-hostage and cqb-contact
//                         keep quiet, so this line leads over a man still up (the fixer's of 0.0.16)
//   cqb-topup     note    a lull with the magazine believed at half or less, of its own load and of the fullest spare at hand: Top up
//   cqb-stoppage  urgent  a stoppage believed: IMMEDIATE ACTION; at the reflex card, its first answer (R4: T did nothing there),
//                         below rung 2 Tap, rack where the card has it (the fixer's of 0.0.16: what training teaches first; the
//                         boot recruit's P-12 at Marksmanship 10 missed the plate's head 20 times running);
//                         with no drill row (the rifle hanging), the weapon group's first (R6)
//   cqb-two-down  urgent  your #2 gun down (R6, COMBAT §25.19.5): "Your two's down. His sector.", Cover his sector
//   cqb-walk      note    out of the mode on the lane, the feet still and nothing of the lane done for WALK_NUDGE_MS (the
//                         scene's stall clock: a door, a cover, a round, a leg's state): "Keep moving. {keys} to your point,
//                         or G for the drill." and T enters the mode (G), where the drill's rows are (the play review of
//                         2026-11-13: after X, or after the one "go", nothing told a key player to walk on, and the lane
//                         ran on the instructor's 90 s "Time on that room" to 375 s; the user's "soldiers need to stay
//                         fluidly moving", 2026-11-13)
//   cqb-next      calm    the last word, at a choice on the lane where no rule above has one (the play review of 2026-11-13:
//                         after a pair dropped the private's man the line was "Time stands still." and T silent): the man
//                         bracketed down ("Down."), then the drill's next row the panel has, in this order: Carry on, your
//                         point, a corner not yet seen, "Clear!", the hall's end, the walk in by the keys (X); its name and T
//   cqb-rifle-up  warn    the P-12 out and nobody of yours facing (R6, §25.19.6): Rifle up (holster, the rifle's drill);
//                         cqb-reload names Transition first where the panel offers it (a man within 10 m, the pistol holstered);
//                         Rifle up keeps quiet with a man on you (manOn: bracketed up and facing, or one of the room up and
//                         facing that you know of), and never onto a rifle the planner finds no round for (v0.0.20's hunt,
//                         breach-6)
// v0.0.20's hunt of "Stack and clear" (breach-1, 3, 5): cqb-next names the far leg's walk by hotRow, never its look from the near
// leg; cqb-contact's "In. On him." acts (Carry on, else the room's In, Clear the room, Dominate or your point: moveAct), and from
// rung 2 with every shot row struck and the gun on safe names Off safe, as below rung 2.
// 2026-11-12 (the shoot house's rework R3): a suspended flow (state.stop.flow, bundle.js) is a bundle to carry on: the door's, the
// stack's, Dominate's and the hall's lines keep quiet while one waits, its "Carry on" the line's (cqb-contact's, cqb-noshoot's).
// 2026-11-12 (the rework's R4, COMBAT §25.19.4): the catalogue's rows by name (cqb-stack, cqb-door, cqb-go, cqb-hall), and every
// stop says why: stopLead, the line's lead in the house ("GO.", "Contact · 0.05 s.", "Hands. No weapon.", "Hostage. Head
// only.", "He's still up.", "Stoppage.", "Back on him.", "Door, east wall.", "Locked.", "Room clear. Next: room 2, 6.2 m.",
// "Done: stacked.", "Stopped.", "Stop."), read by instinct.js and the HUD.
// (COMBAT's cqb-method and cqb-unknown wait: the flash and the unknown faces are not in this round, §7.) Pure.
import { playerId, playerActor } from '../../../core/ids.js';
import { beliefOf } from '../../arms/firearms.js';
import { stepsOf, gunOn, inHouse, ASKS, targetOf, LABELS } from '../../arms/shooting.js';
import { MACROS } from '../../arms/drills.js';
import { muzzleOf, flagsAt } from '../../arms/carry.js';
import { stillUp, halfOrLess, fullerAtHand } from '../../arms/specials.js';
import { sparesOf, believedN, handGunOf } from '../../arms/kit.js';
import { facingOf } from '../../arms/turners.js';
import { contactNow, lullOf, IDENT_WORDS, searchableOf, knockedDown, lockWalkOf } from '../../combat/contact.js';
import { realOf } from '../../combat/would.js';
import { takeInWords } from '../../combat/react.js';
import { doorNow, lockedOf, twoAway, innerWall, HANDBACK_WORDS, breachOf, kickableOf, onFront, twoChargeOn, usesDevice, variantHere } from '../../combat/bundle.js';
// (the bodies and the line's rules (cqb-blocked, cqb-two-out, cqb-limit, cqb-pair))
import { hallLead, HALL_PAIR_M, TWO_OUT_LINE_MS } from '../../combat/bundle.js';
import { LIMIT_WARN_MS } from '../../arms/carry.js';
import { inFunnel, pastThreshold } from '../../combat/room.js';
import { cornerRuleOf } from '../../combat/corner.js';
import { ownerOf, sideOf, FALLBACK_ROW } from '../../combat/team.js';
// (the room's rule (cqb-mark))
import { markYoursOf } from '../../combat/bundle.js';
import { TEAM_TASKS } from '../../combat/drills/enter-and-clear.js';
import { voidOfHouse } from '../../combat/drills/void.js';
import { hatchState } from '../../places/hatch.js';
import { handDeviceOf, DEVICES } from '../../arms/devices.js';
import { placedOn } from '../../combat/breach.js';
import { planFor } from '../../arms/plan.js';
import { handsPath } from '../../arms/devplan.js';
import { isLive, upNow, accountedOf, gateWhy, liveStateOf, seenK, choosesOf } from '../../combat/men.js';
import { SEEN } from '../../people/perception.js';
import { rungOf, valueOf } from '../templates.js';
import { openingState } from '../../places/model.js';
import { keysFor, layoutIn } from '../../arms/groups.js';
import { opOf, opLive, laneRec, sessionOf } from '../../combat/op.js';
import { stunsOn } from '../../combat/burst.js';

/** The house's rules repeat as each case comes (the door, the room, the contact are each new advice). */
export const CQB_REPEAT_MS = 0;
/** Out of the mode, the feet still and nothing of the lane done this long before cqb-walk speaks (ms; my call: two walk cycles' thought, well under the instructor's STALL_MS). */
export const WALK_NUDGE_MS = 3000;
/** Words tiered by a skill: under TIER_2 tier 1, under TIER_3 tier 2, else 3 (SKILLS §14.3 rule 5). */
export const TIER_2 = 8, TIER_3 = 20;
const tierOf = (v) => (v < TIER_2 ? 1 : v < TIER_3 ? 2 : 3);
const NOSHOOT = new Set(['hands', 'phone']);
const HOLD = Object.freeze({ rifle: 'Rifle', pistol: 'Pistol' });
// (the threat's weapon as the line says it: "His pistol.", never the bare "Pistol." the transition says, now that every sheet
// carries a P-12 ("Pistol. On him." read as "draw your pistol": the fixer's of 0.0.16))
const HOLD_SAY = Object.freeze({ rifle: 'Rifle', pistol: 'His pistol' });

// (what the character knows in the house now, kept for the tick and the panel; the gun in use's belief and its magazine in the
// key too (v0.0.18: a belief written at an instant with no step of its own, a look's finding or a test's, left the lines naming
// the gun as it was))
let memo = { state: null, key: null, v: null };
const gunKey = (state, id) => { const g = id ? state.items?.[id] : null; return g ? `${g.mag ?? ''}|${g.locked ? 'L' : ''}|${g.chamber ?? ''}|${g.mode ?? ''}|${JSON.stringify(g.belief ?? null)}` : ''; };
function know(state, me, ms) {
  const S = state.stop, R = sessionOf(state);
  // (what a row chosen at no time changes is in the key too: the variant, the held door, the carry's beats (the fixer's of
  // 0.0.12: "Hold it" chosen at the same instant left the line offering it again, and T pressed it for ever))
  const H = opOf(state);
  const key = `${ms}|${state.clock.tick ?? ''}|${S ? `${S.mode}|${S.phase}|${S.gun ?? ''}|${H?.two?.down ? 'd' : ''}${H?.two?.coveredBy ? 'c' : ''}|${S.doing?.step ?? ''}|${S.pick ?? ''}|${S.aim?.key ?? ''}|${S.carry?.why ?? ''}|${S.carry?.beats?.length ?? ''}|${S.flow ? (S.flow.suspended ? 's' : 'f') : ''}|${JSON.stringify(S.variant ?? null)}|${S.reflex ? 'r' : ''}` : ''}|${me ? `${me.x}|${me.z}|${me.headRad ?? ''}|${me.watch?.hotId ?? ''}` : ''}|${contactNow(state, ms)?.last?.id ?? ''}|${H?.two?.hold ?? ''}|${H?.goAtMs ?? ''}|${H?.end ? 'e' : ''}|${H?.cur ?? ''}|${state.armoury?.range?.cmd?.id ?? ''}|${state.people?.[state.player?.id]?.kit?.carry?.posture ?? ''}|${gunKey(state, S?.gun)}`;
  if (memo.state === state && memo.key === key) return memo.v;
  let v = null;
  // (the drill's rules run where an operation is live, op.js opLive: on the range session the house's lane live and
  // you in it, any other course in its area; off it, an operation open where you stand (the hand-off's, D))
  if (opLive(state) && me) {
    const pid = playerId(state), here = doorNow(state, pid), gunId = gunOn(state, pid), b = gunId ? beliefOf(state, gunId) : null;
    const choosing = S?.mode === 'stop' && S.phase === 'choose' && !S.reflex;
    const steps = choosing ? stepsOf(state, ms) : [];
    const offered = (id) => steps.find(s => s.id === id && !s.off) ?? null;
    const rung = rungOf(state, pid, 'room'), last = contactNow(state, ms)?.last ?? null;
    const plan = here?.plan ?? null, inside = plan ? pastThreshold(plan, me.x, me.z) : false;
    // (a compartment entered through a deck hatch (its plan's `hatch`: no door in the plane) is open when its scuttle is)
    const open = plan?.hatch ? hatchState(state, plan.hatch) === 'open' : plan?.door ? openingState(state, plan.door) === 'open' : true;
    const stacked = !!plan && Math.hypot(me.x - plan.stack[0][0], me.z - plan.stack[0][1]) <= 0.3;
    const T = S?.pick ? (R.turners ?? []).find(t => t.key === S.pick) ?? null : null;
    // (a bundle's question still standing (shooting.js ASKS): "Hold it or clear it?" is answered once every inner door of the
    // room is open or held by the #2, so Carry on is the line's again (2026-11-12: the Raider by T on seeds 5 and 7 held room
    // 2's closet at the ask, and the ask stood, no line and T idle for the rest of the lane); a locked lane door's until open)
    const why = S?.carry?.why ?? null, asking = ASKS.has(why) && (why === 'door-unplanned' ? (plan?.inner ?? []).some(id => openingState(state, id) !== 'open' && R.house?.two?.hold !== id) : true);
    v = { state, R, pid, here, plan, b, S, steps, offered, choosing, rung, last, inside, open, stacked, T, asking, inMode: S?.mode === 'stop', me,
      tier: tierOf(valueOf(state, pid, 'tactics')), shotTier: tierOf(valueOf(state, pid, 'marksmanship')), voice: rung >= 3 ? 'self' : 'di', posture: state.people?.[pid]?.kit?.carry?.posture ?? 'slungFront' };
  }
  memo = { state, key, v };
  return v;
}
// (an act only when its row is in the panel now: 'stop:<row id>')
const actIf = (k, id) => (k?.choosing && id && k.offered(id) ? `stop:${id}` : null);
// (the first row offered of a list of ids)
const firstOf = (k, ids) => ids.find(id => id && k.offered(id)) ?? null;
// (the reflex card's answer the DI gives: its first, below rung 2 Tap, rack where the card offers it (see cqb-stoppage))
const answerOf = (k) => { const o = (k?.S?.reflex?.options ?? []).filter(x => !x.off); return (k.rung < 2 ? o.find(x => x.key === 'ia') : null) ?? o[0] ?? null; };
// (the gun in use dry as believed: the bolt locked back, or the chamber empty with no magazine in; then no shot line speaks and
// cqb-reload's leads, its row named (the fixer's of 0.0.16: with the pistol locked back at a man still up the line was "Plate. Go
// to the head." with no act and no row, "Empty. Reload." only flashing in the act phase, and the recruit walked room 3 and
// the hall on an empty pistol))
const dryNow = (k) => !!k?.b && (!!k.b.locked || (k.b.chamber === 'empty' && k.b.mag !== 'in'));
// (the chamber not known with Press check offered (Rifle up clears the rifle and leaves its chamber a question): no shot row is
// offered, so the shot lines keep quiet and range-unknown's "Check it." leads, T the press check (the boot recruit's 1111 after
// Rifle up: "Hostage. Head only, or hold." over a panel with no head row))
const unsureNow = (k) => k?.b?.chamber === '?' && !!k.offered('pressCheck');
// (v0.0.18: no shot for the gun's state though it is no stoppage: an empty chamber with the magazine in and the bolt home (Condition
// 3, a RELOAD halted before its Charge, the P-12 drawn unchambered), or the rifle swung onto its sling by a fumble (Up offered:
// stepsOf's slung panel); the shot lines keep quiet and cqb-reload names the planner's row, Fix's (the dead-end hunt of
// 2026-11-16: "Fire." and "Rifle. On him." over a Fire struck "chamber empty", T doing nothing; the rifle hanging at a contact
// with the DI's "Off safe." and no act))
const emptyNow = (k) => !!k?.b && !k.b.stoppage && !k.b.locked && k.b.chamber === 'empty' && k.b.mag === 'in';
const slungNow = (k) => !!k?.choosing && !!k.offered('up');
const noShotNow = (k) => dryNow(k) || unsureNow(k) || emptyNow(k) || slungNow(k);
// (the rows cqb-reload may name from Fix (shooting.js markFix): the gun's own way to fire, never a drill's or a stance's)
const GUN_FIX = new Set(['weapon:transition', 'macro:reload:speed', 'macro:reload:tactical', 'macro:reload:retain', 'release', 'charge', 'weapon:rifle-up', 'up', 'observe', 'pressCheck']);
// (cqb-reload's words for the row it names, where they are not RELOAD's)
const reloadWords = (next, model) => ({ 'weapon:rifle-up': 'up', 'weapon:transition': 'tr', release: model === 'p12' ? 'relP' : 'rel', charge: model === 'p12' ? 'rack' : 'chg', observe: 'look', pressCheck: 'look', up: 'sling' })[next] ?? null;
/** What cqb-reload's T does, in order: Transition (the P-12 holstered, a man within 10 m), the reloads, the bolt release or Charge, else Rifle up (the P-12 dry with no magazine left). */
export const RELOAD_ACTS = Object.freeze(['weapon:transition', 'macro:reload:speed', 'macro:reload:tactical', 'macro:reload:retain', 'release', 'charge', 'weapon:rifle-up']);
// (the room's threats standing and facing that you know of (taken in, not forgotten: contact.js's known), never one nobody
// has seen (the reach review of 2026-11-13: the DI kept "Clear!" back while a man behind you, unseen, stood))
const standing = (k, ms, state) => { const c = state?.mind?.contact, known = c?.known ?? {}, last = c?.last?.ids ?? [];
  return (k.R.turners ?? []).filter(t => t.room === k.plan?.room && t.face !== 'noshoot' && t.face !== 'hostage' && facingOf(t, ms) >= 0.5 && (t.stoppedAtMs === null || t.stoppedAtMs === undefined)
    && (known[t.key] !== undefined || last.includes(t.key))); };
// (what you know of the room's men up and facing now: each you identified armed, at the last pause or an earlier one (the
// scene's record keeps every pause's identification), the hostage aside (cqb-hostage's); your own corner's first, then the
// nearest (the fixer's of 0.0.12: a second contact replaced the last, and the DI forgot the first man still up))

// (your #2's bang task on the door you stand at, you outside, below rung 2 (from rung 2 your entry is a bundle row that waits on
// his cue, and the contact speaks as before): working, or its bang gone less than BANG_LATE_MS ago)
/** The DI's hold on the contact line after your #2's bang (ms; burst.js BANG_LATE_MS, a literal; exported for the tests, v0.0.20's review: team-task wrote it by hand). */
export const BANG_HOLD_MS = 2000;
function bangPending(k, ms) {
  const t = k.R.house?.two?.task;
  if (t?.kind !== 'bang' || k.rung >= 2 || k.inside || !k.here || t.door !== k.here.door) return false;
  const bang = t.done?.bang;
  return t.st === 'working' || (t.st === 'done' && Number.isFinite(bang) && ms - bang < BANG_HOLD_MS);
}

function upKnown(k, ms) {
  const contacts = k.here?.rec?.contacts ?? [];
  const identOf = (key) => (k.last?.ids?.includes(key) && k.last.ident?.[key] !== 'unseen' ? k.last.ident[key] : contacts.filter(c => c.key === key && c.by === 'me' && c.ident).at(-1)?.ident ?? null);
  const out = [];
  for (const T of k.R.turners ?? []) {
    // (up and facing by men.js upNow, the one reader for a stand and a role-player alike (v0.0.19: a man ruled out is no longer up))
    if (T.room !== k.plan?.room || T.face === 'hostage' || !upNow(T, ms)) continue;
    const hold = identOf(T.key);
    if (HOLD[hold]) out.push({ T, hold });
  }
  const me = k.me;
  return out.sort((a, b) => (ownerOf(k.state, a.T) ?? 1) - (ownerOf(k.state, b.T) ?? 1) || Math.hypot(a.T.x - me.x, a.T.z - me.z) - Math.hypot(b.T.x - me.x, b.T.z - me.z) || a.T.key.localeCompare(b.T.key));
}
// (the men of your own corner of upKnown: with a #2 his corner's men are his (the room's next row is yours to take: 2026-11-12, R3))
const ownKnown = (k, ms) => { const up = upKnown(k, ms); return k.R.house?.twoPid ? up.filter(u => (ownerOf(k.state, u.T) ?? 1) === 1) : up; };
// (a man of your own corner up and facing whose hands you have not seen at the last pause: { key } or null)
function handsUnseen(k, ms) {
  for (const key of k.last?.ids ?? []) {
    const T = (k.R.turners ?? []).find(t => t.key === key);
    if (!T || T.room !== k.plan?.room || (ownerOf(k.state, T) ?? 1) !== 1 || T.face === 'hostage' || (T.stoppedAtMs !== null && T.stoppedAtMs !== undefined) || facingOf(T, ms) < 0.5) continue;
    if ((k.last.ident?.[key] ?? 'unseen') === 'unseen') return { key };
  }
  return null;
}
// (the fullest spare magazine believed at hand, rounds)
const bestSpare = (state, pid) => Math.max(0, ...sparesOf(state, pid, null).map(id => believedN(state.items[id]) ?? 0));
// (the aim onto a man by T: the bracket moved to him and the aim, when the rifle can aim (an 'aim' or 'hold' row: stepsOf).
// The aim row is struck while the bracket sits on a man no longer in the frame (one stopped and turned away: "nothing in the
// frame to aim at"), yet the aim onto another man moves the bracket first (shooting.js chooseStep's target), so a struck
// aim row with the bracket elsewhere is no bar (2026-11-12: the Raider by T on 48213 stood on his point in room 1, 1a up in
// his sector and the bracket on the #2's man down, "Him." and T doing nothing for the rest of the lane))
const aimOnto = (k, key) => (k?.choosing && (k.offered('aim') || k.offered('hold') || (k.S.pick !== key && k.steps.some(s => s.id === 'aim'))) ? (k.S.pick === key && k.offered('aim') ? 'stop:aim' : `stop:aim>${key}`) : null);
// (the scene's record of the room: its covered hot spots)
const coveredOf = (k) => k.here?.rec?.covered ?? null;
// (the row that sees a hot spot not yet covered: its look, but the far leg's walk up to it while that is offered, since the far
// leg is not seen from the near one. One rule for cqb-corner and cqb-contact's hisNext: the hunt of v0.0.18 found hisNext naming
// "Look: the far leg." from the near leg, a look that never covers it, four presses with nothing changed)
const hotRow = (k, h) => (h.why === 'far leg' && k.offered('move:far') ? 'move:far' : `look:${h.id}`);
// (a stack you had taken and walked off, the door still shut: the leg is 'stacked' in the scene's record, yet you stand off your
// point (k.stacked: within STACK_NEAR_M 0.3 m of it, where the panel stops offering Stack up), with no charge on the leaf (its
// safe point is where you wait: cqb-task's and cqb-locked's) and no task of your #2's on the door (cqb-task's). Then Stack up is
// the line's again (the hunt of v0.0.20, breach-2: 1.09 m off room 2's stack, cqb-next said X ('leave'), cqb-walk said G
// ('enter'), 1739 times each, the door never opened and the leg passed on time))
function offStack(k) {
  if (k.here?.rec?.state !== 'stacked' || k.open || k.stacked || !k.plan?.door || k.S?.carry) return false;
  if (placedOn(k.state, k.plan.door)) return false;
  const t = k.R.house?.two?.task;
  return !(t && t.door === k.here.door);
}
// (cqb-contact's "In. On him.": the halted bundle carried on, else the room's own way in from where you stand (In, the rung's Clear
// the room, Dominate inside), else your point: never a line with no act (the hunt of v0.0.20, breach-3: back on the stack after
// the take-in in the doorway, the stack's bundle ended, "In. On him." over a live In at 24 stops, T silent, the leg passed on time))
const moveAct = (k) => (!k.asking ? actIf(k, 'drill:carry') : null) ?? actIf(k, bundleRow(k, 'room:in')?.id ?? null) ?? actIf(k, bundleRow(k, 'room:clear')?.id ?? null)
  ?? actIf(k, bundleRow(k, 'room:dominate')?.id ?? null) ?? actIf(k, 'move:point');
// (a man on you, cqb-rifle-up's quiet: the man bracketed up and facing (never a no-shoot), or a man of the room you know of up and
// facing (upKnown))
const manOn = (k, ms) => (!!k.T && facingOf(k.T, ms) >= 0.5 && (k.T.stoppedAtMs === null || k.T.stoppedAtMs === undefined) && k.T.face !== 'noshoot') || upKnown(k, ms).length > 0;
// (the bundle row a rung's T takes at the door: the rung's own (see the header))
const BUNDLE_OF_RUNG = Object.freeze(['stack:up', 'stack:point', 'stack:point', 'room:clear', 'room:clear']);
// (the rooms left of the lane in words, the current one with them: "Two rooms and the hall")
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
// (FL22-6: a man's place in words, his name less "the man in": "His man: the near leg's far corner." Before it the line was
// "Rifle, the man in the near leg's far corner: your two's. Your corner.", which a new player could not read)
const whereOf = (name) => String(name ?? 'him').replace(/^the man in /, '');
// (R4: the bang a stack line's row carries (bundle.js variantTag's '@…frag…'), named, and the brief's warning where the brief
// did not call the room hostiles only (house-kit.js intelOf, what the player was told; briefBars' test on the door). A flash or no bang
// names nothing: the words to the letter. T's act is the row's as before (the method is the player's, COMBAT §25.5.6))
const BANG_SAY = Object.freeze({ frag: 'frag', conc: 'concussion' });
function bangWords(state, k, rowId) {
  const tags = (/@([^>]*)>/.exec(rowId ?? '')?.[1] ?? '').split('+'), bang = tags.find(t => BANG_SAY[t]) ?? null;
  if (!bang) return { bang: '', brief: '', tag: '' };
  const intel = opOf(state)?.intel ?? null, barred = !!intel && intel[k.here?.door] !== 'hostiles';
  return { bang: `, ${BANG_SAY[bang]}`, brief: barred ? ' The brief: not hostiles only.' : '', tag: `@${bang}${barred ? '!' : ''}` };
}
const NUM = Object.freeze(['No', 'One', 'Two', 'Three', 'Four', 'Five']);
function leftOf(k) {
  const H = k.R.house, legs = [...(H?.rooms ?? []), ...(H?.hall ? [H.hall] : [])], open = legs.filter(L => L.state !== 'clear' && L.state !== 'passed');
  const rooms = open.filter(L => L.door !== 'hall' && L !== H?.hall).length, hall = !!H?.hall && open.includes(H.hall);
  const r = rooms ? `${NUM[rooms] ?? rooms} room${rooms > 1 ? 's' : ''}` : '';
  return r && hall ? `${r} and the hall` : r || (hall ? 'The hall' : 'The lane');
}
/** The AZERTY keys of a bearing (x east, z south): Z north, S south, Q west, D east, the larger part first (my call: a part under 0.35 of the walk's length is no key). */
export function keysOf(dx, dz) {
  const L = Math.hypot(dx, dz) || 1, ew = Math.abs(dx) / L >= 0.35 ? (dx > 0 ? 'D' : 'Q') : null, ns = Math.abs(dz) / L >= 0.35 ? (dz > 0 ? 'S' : 'Z') : null;
  const both = [[ns, Math.abs(dz)], [ew, Math.abs(dx)]].filter(([x]) => x).sort((a, b) => b[1] - a[1]).map(([x]) => x);
  return both.length > 1 ? `${both[0]} and ${both[1]}` : both[0] ?? 'Z';
}
/**
 * The walk in by the keys in words, from a room's plan and where you stand (`at`, the stack by default): { keys, side, legs }. v0.0.23
 * (its build sheet item 10, carried FH-1): the keys along #1's own path (walkLegs, legsWords: "Q to the door, S through it, then D"),
 * never the straight bearing from the stack to the point, which on room 2 and room 3 of lane A ("D and S", "Z") walked a recruit into
 * the wall beside the doorway (the doorways lie west of both stacks: stopped 0.16 m off the stack from 77.8 s to the room's pass); the
 * bearing (keysOf) only for a plan with no path. `legs` the legs' keys run together ('QSD'); his corner's side the rule's as the
 * screen shows it (src/sim/combat/corner.js screenWordsOf, the one place it is decided).
 */
export function walkWords(plan, at = null) {
  const st = plan?.stack?.[0], pt = plan?.points?.[0];
  if (!st || !pt) return { keys: 'Z', side: 'left', legs: '' };
  const legs = walkLegs(plan, at ?? st);
  return { keys: legs.length ? legsWords(legs) : keysOf(pt[0] - st[0], pt[1] - st[1]), side: cornerOf1(plan) ?? 'left', legs: legs.map(l => l.key).join('') };
}
/** A leg of the walk in shorter than this is no key of its own, unless it crosses the door's plane or is the last (m; FH-1, measured on 81 rooms). */
export const WALK_LEG_MIN_M = 0.2;
/** Standing this far or more inside the doorway's span from either jamb, not yet through, the legs along the wall are dropped: the next word is the door's (m; FH-1). */
export const DOOR_SPAN_INSET_M = 0.2;
/** Standing farther than this off #1's path (its nearest point), the walk in starts with the approach to it (m; my call: the reading recruit on eight-room seed 208 stood 7.5 m off room 2's stack with its door found open). */
export const WALK_PATH_OFF_M = 0.6;
/** The approach's key of an axis while its part of the way is this long or more (m; my call: under WALK_PATH_OFF_M, so the approach ends on the path). */
export const WALK_AXIS_M = 0.3;
/**
 * The approach's keys (x east, z south): a key for each axis whose part is WALK_AXIS_M or more, the north or south key first ("S and Q").
 * By a fixed length a part, never keysOf's share of the bearing: holding both walks the diagonal and each part only shrinks, so a key
 * drops out once and never comes back. By the share, the words flipped between "S" and "S and Q" every 0.6 s as the diagonal crossed
 * its 0.35, each flip a new line to read, and the reading recruit on eight-room seed 208 crept 3 m in 10 s until room 2 was passed at its
 * open door (house-reader's F92). Pure.
 */
export function approachKeys(dx, dz) {
  const ns = Math.abs(dz) >= WALK_AXIS_M ? (dz > 0 ? 'S' : 'Z') : null, ew = Math.abs(dx) >= WALK_AXIS_M ? (dx > 0 ? 'D' : 'Q') : null;
  return ns && ew ? `${ns} and ${ew}` : ns ?? ew ?? keysOf(dx, dz);
}
/**
 * #1's path (plan.paths[1]) from where he stands as legs of one key each (carried FH-1): from the nearest segment ahead of
 * `at` by projection, each segment's key by its larger part (Z north, S south, Q west, D east, as keysOf), equal keys merged, a leg
 * under WALK_LEG_MIN_M dropped unless it crosses the plane (`past`) or is the last; standing in the doorway's span (inset
 * DOOR_SPAN_INSET_M from either jamb) and not through, the legs along the wall dropped (the overshoot: "D to the door" read at x 19.91
 * with the doorway's west jamb at 20.15). [{ key, m, past }]; [] with no path. Pure.
 */
export function walkLegs(plan, at) {
  const path = plan?.paths?.[1];
  if (!path?.length || !at) return [];
  let best = { i: 0, d: Infinity };
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((at[0] - ax) * dx + (at[1] - az) * dz) / L2)), d = Math.hypot(at[0] - (ax + t * dx), at[1] - (az + t * dz));
    if (d < best.d - 1e-9) best = { i, d };
  }
  // (far off the path (WALK_PATH_OFF_M), the approach first: one leg to its nearest point, keyed by its parts (approachKeys, "S and Q"),
  // so a walk from across the hall goes to the stack and never stairs between two keys, each change a new read)
  const [ax0, az0] = path[best.i], [bx0, bz0] = path[best.i + 1] ?? path[best.i], vx = bx0 - ax0, vz = bz0 - az0, l2 = vx * vx + vz * vz || 1;
  const t0 = Math.max(0, Math.min(1, ((at[0] - ax0) * vx + (at[1] - az0) * vz) / l2)), near = [ax0 + t0 * vx, az0 + t0 * vz];
  const far = best.d > WALK_PATH_OFF_M ? { key: approachKeys(near[0] - at[0], near[1] - at[1]), m: best.d, past: false, approach: true } : null;
  const pts = [far ? near : at, ...path.slice(best.i + 1)], legs = [];
  const pl = plan.plane, side = (p) => (pl ? Math.sign(((pl.axis === 'x' ? p[1] : p[0]) - pl.at) * pl.into) : 0);
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1];
    const key = Math.abs(dx) >= Math.abs(dz) ? (dx > 0 ? 'D' : 'Q') : dz > 0 ? 'S' : 'Z', m = Math.hypot(dx, dz), past = side(pts[i]) <= 0 && side(pts[i + 1]) > 0;
    const last = legs.at(-1);
    if (last && last.key === key) { last.m += m; last.past ||= past; } else legs.push({ key, m, past });
  }
  if (pl) {
    const u = pl.axis === 'x' ? at[0] : at[1], along = pl.axis === 'x' ? ['Q', 'D'] : ['Z', 'S'];
    if (side(at) <= 0 && u >= pl.a + DOOR_SPAN_INSET_M && u <= pl.b - DOOR_SPAN_INSET_M) while (legs.length > 1 && along.includes(legs[0].key) && !legs[0].past) legs.shift();
  }
  const kept = legs.filter((l, i) => l.m >= WALK_LEG_MIN_M || l.past || i === legs.length - 1);
  const out = kept.reduce((a, l) => { const last = a.at(-1); if (last && last.key === l.key) { last.m += l.m; last.past ||= l.past; } else a.push({ ...l }); return a; }, []);
  return far ? [far, ...out] : out;
}
/** The legs in words: "Q to the door, S through it, then D"; one leg alone its key (carried FH-1). */
export function legsWords(legs) {
  if (!legs?.length) return '';
  // (the approach from off the path first: "S and Q to the stack, then Q to the door, S through it, then D")
  if (legs[0].approach) { const rest = legsWords(legs.slice(1)); return `${legs[0].key} to the stack${rest ? `, then ${rest}` : ''}`; }
  if (legs.length === 1) return legs[0].key;
  const k = legs.findIndex(l => l.past);
  if (k < 0) return legs.map(l => l.key).join(', then ');
  const before = legs.slice(0, k).map(l => l.key), after = legs.slice(k + 1).map(l => l.key);
  return [before.length ? `${before.join(', ')} to the door` : null, `${legs[k].key} through it`, after.length ? `then ${after.join(', ')}` : null].filter(Boolean).join(', ');
}
/**
 * The walk in's key where you stand (carried FH-1's refresh key): '' unless out of stop motion on the lane (GO given, no end),
 * your room rung under 2, the door ahead open and you not past it; then `${door}|${the legs' keys}`. instinct.js instinctStep re-reads
 * the line the tick it changes, so the words follow your legs, not the clock's whole second (without it the 0.4 m leg "S through it"
 * was crossed in 0.33 s between two whole seconds and the recruit read "D to the door" past the jamb). Cheap first: the stop and the
 * rung before doorNow. Pure, runtime only (instinct.js keeps it on $instinct).
 */
export function walkInKey(state) {
  if (state.stop) return '';
  const H = opOf(state);
  if (!H || H.goAtMs === null || H.goAtMs === undefined || H.end) return '';
  const me = playerActor(state), pid = playerId(state);
  if (!me || rungOf(state, pid, 'room') >= 2) return '';
  const plan = doorNow(state, pid)?.plan;
  if (!plan?.door || openingState(state, plan.door) !== 'open' || pastThreshold(plan, me.x, me.z)) return '';
  return `${plan.door}|${walkLegs(plan, [me.x, me.z]).map(l => l.key).join('')}`;
}
// (your corner in words, #1's by the rule (corner.js), as the screen shows it (screenWordsOf: room 2, entered going south, is
// "right"; the marine's own "left" read wrong against the bracket on the screen's right, the play review of 2026-11-15):
// "left", "right", "the top", "the far left"; null without a plan. v0.0.19: your side's rule (team.js sideOf: your #2's once you
// took his side and he took yours), so the words follow the swap)
const cornerOf1 = (plan, state = null) => { const r = cornerRuleOf(plan, state ? sideOf(state, plan?.door ?? 'hall', 1) : 1); return r?.screen ?? r?.words ?? null; };
// (To the head offered live on the bracketed man: from rung 2 its aim is inside it, so the line names it and T leaves it (2026-11-12, R3))
const headRow = (k) => k.steps.find(s => s.id.startsWith('shot:head') && !s.off && (s.target ?? k.T?.key) === k.T?.key) ?? null;
const headLive = (k) => !!headRow(k);
// (the keys of To the head on the panel drawn (groups.js keysFor, the layout played), named by the line from rung 2, where T
// leaves the shot to you (the design review of 2026-11-13: after Transition "Head." named no key, the row at Tab › 1 › 5))
const headKeys = (state, k) => { const r = k.rung >= 2 ? headRow(k) : null; return r ? keysFor(k.steps, r.id, { layout: layoutIn(state) }).text : null; };
// (the Wreck: at a hatch the panel offers the void's rows, each running as a house row (drills/void.js voidOfHouse: 'room:clear'
// is 'void:clear' there), so T leads with the void row a house bundle names)
const bundleRow = (k, bundle) => { const v = voidOfHouse(bundle); return k.steps.find(s => (s.id.startsWith(`drill:${bundle}`) || (v && s.id.startsWith(`drill:${v}`))) && s.id.endsWith(`>${k.here.door}`) && !s.off) ?? null; };

// ---- the stop's why (COMBAT §25.19.4: "every stop says why in the line's lead") ----

/** A row's group done, below the rung that runs the room whole: the seam's words ("Done: stacked."). */
const DONE_WORDS = Object.freeze({ 'stack:up': 'stacked', 'stack:point': 'stacked, the door read', 'room:in': 'in, your corner', 'room:dominate': 'your sector' });
// (the lane's leg after a door, in words, and how far its stack is from you: "room 2, 6.2 m", "the hall, 4.0 m")
function nextWords(state, R, me) {
  // ("Bang, then go" is room 1 alone (R.house.bangGo): no next leg to name, "Clear." (the play review of v0.0.26, finding 7))
  if (R.house?.bangGo) return null;
  const H = R.house, next = (H?.rooms ?? []).find(r => r.state !== 'clear' && r.state !== 'passed'), hall = !next && H?.hall && H.hall.state !== 'clear' && H.hall.state !== 'passed';
  const here = doorNow(state, playerId(state)), st = here?.plan?.stack?.[0] ?? null;
  // (a distance under half a metre is no distance: you are there (the design review of 2026-11-13: "room 2, 0.0 m"))
  const dM = st && me ? Math.hypot(st[0] - me.x, st[1] - me.z) : 0, m = dM >= 0.5 ? `, ${dM.toFixed(1)} m` : '';
  if (next) return `room ${(H.rooms.indexOf(next) + 1)}${m}`;
  return hall ? `the hall${m}` : null;
}
/**
 * The lead of a stop in the house on the lane (COMBAT §25.19.4's table), or null where the stop has no house's why (the
 * plain "Time stands still."): the contact ("Contact · 0.05 s.", "Hands. No weapon.", "Hostage. Head only."), a man still up,
 * the stoppage, the door's questions ("Door, east wall.", "Locked.", "It held."), "Room clear. Next: room 2, 6.2 m.", a seam
 * below the rung ("Done: stacked."), "Stopped.", "GO." and the lane's "Stop.". Pure.
 */
export function stopLead(state, ms = state.clock.ms) {
  const S = state.stop, R = sessionOf(state), H = laneRec(state);
  if (!S || S.mode !== 'stop' || !H || H.goAtMs === null || H.goAtMs === undefined || !inHouse(state)) return null;
  if (H.end) return 'Stop.';
  if (S.reflex) return 'Stoppage.';
  if (S.phase !== 'choose') return null;
  const me = playerActor(state), L = contactNow(state, ms)?.last ?? null, T = S.pick ? (R.turners ?? []).find(t => t.key === S.pick) ?? null : null;
  const up = !!T && (T.stoppedAtMs === null || T.stoppedAtMs === undefined) && facingOf(T, ms) >= 0.5;
  // (the contact's own pause: no step begun since it)
  // (a step chosen at the pause's own instant is begun after it: the stop it ends in is its own)
  if (L && L.atMs > (S.last?.atMs ?? -Infinity) && L.ids.includes(S.pick)) {
    if (T?.face === 'hostage' && up) return 'Hostage. Head only.';
    if (NOSHOOT.has(L.ident?.[T?.key]) && up) return 'Hands. No weapon.';
    return `Contact · ${takeInWords(L.ms)} s.`;
  }
  if (up && T.face === 'hostage') return 'Hostage. Head only.';
  if (up && S.last?.step === 'macro:ia') return 'Back on him.';
  if (up && (T.face === 'threat' || T.face === 'armoured') && (stillUp(state, T.key) || S.flow?.suspended?.why === 'up')) return "He's still up.";
  if (up && S.last?.step === 'contact:challenge' && L?.ident?.[T.key]) return `Challenged: ${IDENT_WORDS[L.ident[T.key]] ?? L.ident[T.key]}.`;
  const C = S.carry;
  if (C?.why) {
    const first = (w) => (w ? `${String(w).split('.')[0]}.` : null);
    if (C.why === 'door-unplanned' || C.why === 'refused') return first(C.words) ?? (C.why === 'refused' ? 'Locked.' : 'Door.');
    if (C.why === 'two') return "Your number two's not with you.";
    if (C.why === 'clear') return C.words === HANDBACK_WORDS.twoMan ? C.words : 'Not clear yet.';
    if (C.why === 'stop') return 'Stopped.';
    if (C.why === 'noshoot') return 'Hands. No weapon.';
    if (C.why === 'gun') return 'The gun.';
    if (C.why === 'fail') return 'Fumbled.';
  }
  if (!S.last) return 'GO.';
  // (a room cleared since the last step began ("Room clear!", or "Clear!" by hand): the leader's decision, the next door)
  const legs = [...(H.rooms ?? []), ...(H.hall ? [{ ...H.hall, door: 'hall' }] : [])], cleared = legs.filter(r => r.state === 'clear' && Number.isFinite(r.clearAtMs)).sort((a, b) => b.clearAtMs - a.clearAtMs)[0];
  // (once stacked on the next door the "Next" is said: the lead goes on to what is there (the design review of 2026-11-13))
  const here0 = doorNow(state, playerId(state)), st0 = here0?.plan?.stack?.[0], stackedNext = !!st0 && !!me && Math.hypot(st0[0] - me.x, st0[1] - me.z) < 0.5;
  // (a step begun at the clear's own instant is begun after it, as the contact's (above): only the clear itself keeps the lead on a
  // tie (the hunt of v0.0.18: the hall's walk chosen the ms room 3 was set clear, and at the hall's end "Room clear. Next: the
  // hall, 5.8 m." with the room 9 s behind you and the 5.8 m back to where you set out)
  const since = cleared && (cleared.clearAtMs > S.last.atMs || (cleared.clearAtMs === S.last.atMs && /^(call:clear|drill:room:|drill:void:(clear|dominate)|room:clear)/.test(S.last.step ?? '')));
  if (since && !stackedNext) { const n = nextWords(state, R, me); return n ? `${cleared.door === 'hall' ? 'Hall' : 'Room'} clear. Next: ${n}.` : 'Clear.'; }
  // (the inner door the plan does not take, from inside: asked)
  const here = doorNow(state, playerId(state)), plan = here?.plan;
  if (plan && me && pastThreshold(plan, me.x, me.z)) { const id = (plan.inner ?? []).find(x => openingState(state, x) !== 'open' && H.two?.hold !== x); if (id) return `Door, ${innerWall(state, plan, id)}.`; }
  // (a group of the catalogue done below the rung that runs the room whole: the seam)
  if (S.last.bundle && DONE_WORDS[S.last.bundle] && !S.carry) return `Done: ${DONE_WORDS[S.last.bundle]}.`;
  if (/^(shot:|fire$)/.test(S.last.step ?? '') && !up) return 'Down.';
  // (else the step last done, in its row's words, never the bare "Time stands still." (the design review of 2026-11-13: most of
  // the private's 39 stops led with it))
  const w = doneWords(S.last.step);
  return w ? `Done: ${w}.` : null;
}
// (a step's words for the stop's lead: the action's label, the Corps macro's, the drill's)
function doneWords(id) {
  if (!id) return null;
  const w = LABELS[id] ?? MACROS[String(id).replace(/^macro:/, '')]?.label ?? null;
  return w ? String(w).replace(/[.:]$/, '').replace(/^\w/, c => c.toLowerCase()) : null;
}

// ---- the live men (v0.0.19, "Stack and clear, live"; COMBAT §25.18) ----
// (a role-player of the room you are in, or of a room reopened, that you know of: in your last pause or taken in before (the scene's
// record), or seen by the team (the house's H.live.seenBy): never one nobody has seen)
function liveMen(k) {
  const LV = k.R.house?.live, last = k.last?.ids ?? [], known = k.state.mind?.contact?.known ?? {};
  if (!LV) return [];
  return (k.R.turners ?? []).filter(T => isLive(T) && (T.room === k.plan?.room || LV.reopened?.[T.key] !== undefined) && accountedOf(k.state, T) !== 'out'
    && (last.includes(T.key) || known[T.key] !== undefined || LV.seenBy?.[T.key] !== undefined));
}
// (a man down, or with his hands up, nobody covering him (men.js gateWhy, the clear gate's reason on him): the bracketed one first)
const uncoveredOf = (k, ms, acc) => liveMen(k).filter(T => gateWhy(k.state, T, ms) === acc).sort((a, b) => (b.key === k.S?.pick) - (a.key === k.S?.pick) || a.key.localeCompare(b.key))[0] ?? null;
// (the row that puts your muzzle on him and keeps it there: the contact's "Cover him" (contact:hold) with the bracket on him, else
// the aim's hold when aimed on him, else the aim onto him; null where none is offered)
const coverAct = (k, T) => (!T ? null : k.S?.pick === T.key ? actIf(k, 'contact:hold') ?? (k.S.aim?.key === T.key ? actIf(k, 'hold') : aimOnto(k, T.key)) : aimOnto(k, T.key));
// ("Bang, then go"'s lane, the scene's record (R.house.bangGo): its lines and the cower's quiet only there, so the live lane's T is v0.0.25's)
const bangGoLane = (k) => !!k?.R?.house?.bangGo;
// (the boarding round's stage 0 (K1): the lines over a cowering or dazed man are the choosing's, on every lane whose men choose (men.js choosesOf:
// "Bang, then go" and the boarding); the search's (cqb-rp-search) stays the scene's, bangGoLane)
const choosingLane = (k) => !!k?.state && choosesOf(k.state);
// (a man of the room you see cowering, not giving up, on "Bang, then go": the bracketed one first)
const cowerOf = (k, ms) => (choosingLane(k) ? liveMen(k).filter(T => liveStateOf(k.state, T, ms) === 'cowering' && seenK(k.state, k.me, T, ms) >= SEEN)
  .sort((a, b) => (b.key === k.S?.pick) - (a.key === k.S?.pick) || a.key.localeCompare(b.key))[0] ?? null : null);

/** The DI's close-quarters rules (see the header), most pressing first within a tone. */
// (whether the brief forbids the bang of the grenade in the hand into a door's room: a practice
// frag or concussion (DEVICES[model].as) anywhere the brief's intelligence does not say hostiles only (house-kit.js intelOf; the
// hall never is). The instructor never names that throw; the player may still choose it, and the read judges it)
function briefBars(state, h, door) {
  if (h?.kind !== 'grenade' || !DEVICES[h.model]?.as) return false;
  return (opOf(state)?.intel ?? {})[door] !== 'hostiles';
}
export const CQB_RULES = Object.freeze([
  {
    // (R1 b: a grenade at your feet or short on you, handed back with Get clear on the panel: the row named, T runs it.
    // Before it no rule named it, so the hand-back of v0.0.19's practice slip had no line and T did nothing there)
    id: 'cqb-grenade', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'Get clear', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.offered('move:clear') || !stunsOn(state, me).length) return null;
      return { k, tier: k.tier, voice: k.voice };
    },
    act: (ctx) => actIf(ctx.k, 'move:clear'),
    text: { 1: ['Grenade! Get clear.', 'Grenade on the floor! Get clear of it.', 'Live grenade! Get clear.', 'Grenade! Get away from it.'], 2: ['Grenade! Get clear.', 'Grenade! Away from it.', 'Get clear!', 'Grenade! Clear of it.'], 3: ['Grenade! Move.', 'Move!', 'Grenade. Away.', 'Off it. Move.'] },
  },
  {
    // (v0.0.19, D2 (COMBAT §25.20; kit2 §2.8): the hands first. A live grenade in the hand, its lever gone: "Throw it!", T throws
    // (its only legal act, devplan.js guard D1); a grenade armed or any device in the hand at a contact: the hands' way out by
    // its row's words (devplan.js handsPath: "Pin in, pouch, rifle up."), T does it. Never a line choosing a grenade or a breach
    // (the method is the player's, COMBAT §25.5.6); v0.0.20: with nobody up, the drill row that uses the device in the hand (the
    // player's own way, already chosen), else its throw through the open door, else its way out (see when))
    id: 'cqb-hands', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'Hands', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing) return null;
      const h = handDeviceOf(state, k.pid);
      if (!h) return null;
      if (h.kind === 'grenade' && h.st === 'live') return k.offered('dev:throw') ? { k, tier: k.tier, voice: k.voice, id: 'dev:throw' } : null;
      // (at a contact: a man of the last take-in still up and facing)
      const up = (k.last?.ids ?? []).some(key => { const T = (k.R.turners ?? []).find(t => t.key === key); return !!T && (T.stoppedAtMs === null || T.stoppedAtMs === undefined) && facingOf(T, ms) > 0; });
      const p = handsPath(state, k.pid), out = p?.id && k.offered(p.id) ? { k, tier: k.tier, voice: k.voice, variant: 'hands', words: 'hands', id: p.id } : null;
      if (up) return out;
      // (the hunt of v0.0.18: nobody up, a device still in the hand (a bundle Backspaced at "Pin out.", a pry that would
      // not give): the drill that uses it, else its throw through the open door, else its way out; never "Get it up." (Up is struck
      // while the hands are full: devices.js handsFullWhy), never silent, never the walk in with a pin out. A question standing
      // (the #2 not with you, an inner door) is its own line's: the device waits in the hand)
      if ((k.S?.carry?.why === 'two' && twoAway(state, ms)) || k.asking) return null;
      // (this door's drill only: a Carry on of a leg the stall passed would walk back to its door)
      const carry = k.offered('drill:carry'), carryHere = carry && (k.S?.carry?.door ?? k.S?.flow?.door ?? null) === (k.here?.door ?? null) ? carry : null;
      // (the review of the hunt fixes: never a practice frag or concussion into a room the brief did not call hostiles only (house-kit.js
      // intelOf, what the player was told): "Finish it" on a G-9P armed at room 1 with a no-shoot threw it, the 'fragged' fault, 95 on the
      // hot wash. There the way out (Pin back in) is the line)
      const barred = (door) => briefBars(state, h, door ?? k.S?.carry?.door ?? k.S?.flow?.door ?? k.here?.door ?? null);
      const use = [carryHere, k.here ? bundleRow(k, BUNDLE_OF_RUNG[Math.min(4, k.rung)]) : null, ...k.steps.filter(r => r.kind === 'bundle' && !r.off && r.id !== 'drill:carry')]
        .find(r => r && usesDevice(h, r) && !barred(r.id.split('>')[1]));
      if (use) return { k, tier: k.tier, voice: k.voice, variant: 'use', words: 'use', id: use.id, what: String(use.label ?? use.id).replace(/[.:]$/, '') };
      // (the throw through this leg's own door, open, from its stack side: never in the hall, nor back out of the room)
      if (k.plan?.door && k.open && !k.inside && k.offered('dev:throw') && !barred(k.here?.door)) return { k, tier: k.tier, voice: k.voice, variant: 'throw', words: 'throwIt', id: 'dev:throw' };
      return out;
    },
    act: (ctx) => actIf(ctx.k, ctx.id),
    text: { 1: ['Throw it! The lever is gone.', 'Throw it! Now.', 'It is live. Throw it.', 'Lever gone: throw it!'], 2: ['Throw it!', 'Live. Throw.', 'Throw it now.', 'Out of your hand. Throw.'], 3: ['Throw.', 'Throw it.', 'Now.', 'Out.'],
      hands: ['Hands first. Free them, then the rifle.', 'Free your hands. Then the rifle.', 'Hands. Pouch it, rifle up.', 'Your hands are full. Free them.'],
      use: ['Your hands are full. Finish it: {what}.', 'Finish what you started: {what}.', '{what}. Then the rifle.', "It's in your hand. {what}."],
      throwIt: ["Door's open. Throw it.", 'Pin is out. Throw it in.', 'Throw it. Then the rifle.', 'In the room with it. Throw.'] },
  },
  {
    id: 'cqb-flag', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'Muzzle', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), two = k?.R.house?.two;
      if (!k || !two?.pid) return null;
      const a = state.actors?.list?.find(x => x.who === two.pid);
      if (!a || !flagsAt(muzzleOf(state, k.pid), a.x, a.z, a.stance ?? 'stand')) return null;
      return { k, tier: k.tier, voice: k.voice };
    },
    // (the cure is low ready, muzzle down (COMBAT §25.19.3.5; CALL 97-20), high ready where the rifle cannot go low)
    act: (ctx) => actIf(ctx.k, 'posture:lowReady') ?? actIf(ctx.k, 'posture:highReady'),
    text: { 1: ['Muzzle! He\'s your number two. Muzzle down.', 'Muzzle off him. Low ready.', 'You\'re sweeping your two. Muzzle down.', 'Muzzle down. Not across him.'], 2: ['Muzzle down.', 'Off your two. Low ready.', 'Sweeping him. Down.', 'Low ready. Off him.'], 3: ['Muzzle down.', 'Off him.', 'Low ready.', 'Down.'] },
  },
  {
    // (the rework's R6: the words name the card's first answer, the one T gives: "Gun down.", "Pistol.", "Off the line.")
    id: 'cqb-stoppage', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', reach: null,
    short: (ctx) => ({ gundown: 'Gun down', transition: 'Transition', offline: 'Off the line' }[ctx.words] ?? 'Immediate action'),
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!(k?.inMode && k.b && (k.b.stoppage || k.b.chamber === 'dud' || k.b.chamber === 'case'))) return null;
      // (while an answer runs, the words are its own, never "Tap, rack." over a transition (the fixer's of 0.0.16))
      const first = ({ 'weapon:transition': 'transition', 'weapon:gun-down': 'gundown', 'weapon:offline': 'offline' })[k.S?.doing?.step] ?? answerOf(k)?.key ?? null;
      return { k, tier: k.shotTier, ...(['gundown', 'transition', 'offline'].includes(first) ? { variant: first, words: first } : {}) };
    },
    // (at the reflex card its first answer, the card's own order (COMBAT §25.19.6: "cqb-stoppage's act is the card's first
    // answer"; R4's dead-end rule: with the card up no row is offered, and T did nothing at every click: 400 in 400 lanes))
    // (the rework's R6: with no drill row offered (the rifle hanging after a fumbled draw), the weapon group's answers, then the rifle up)
    // (none of those offered (a dud believed in the chamber with no drill for it): Fix's row, the planner's way, so the line is never
    // silent while a man faces you (the fumble net's stoppage-silent))
    act: (ctx) => (answerOf(ctx.k) ? `stop:reflex:${answerOf(ctx.k).key}` : actIf(ctx.k, firstOf(ctx.k, ctx.k.rung < 2 ? ['macro:ia', 'macro:remedial', 'up', 'weapon:transition', 'weapon:gun-down', 'weapon:offline'] : ['macro:ia', 'macro:remedial', 'weapon:transition', 'weapon:gun-down', 'weapon:offline', 'up']) ?? ctx.k.steps?.find(st => st.fix && !st.off)?.id ?? null)),
    text: { 1: ['Stoppage. Immediate action.', 'It quit. Tap, rack.', 'Dead trigger. Immediate action.', 'Stoppage. Fix it, now.'], 2: ['Stoppage. Tap, rack.', 'Immediate action.', 'Tap, rack, back on.', 'Clear it.'], 3: ['Tap, rack.', 'Clear it.', 'Immediate action.', 'Tap. Rack.'],
      gundown: ['Gun down. Knee, fix it.', 'Gun down. Your two has it.', 'Call it. Gun down.', 'Knee. Tap, rack.'], transition: ['Pistol.', "He's close. Pistol.", 'Transition. Pistol.', 'Rifle down. Pistol up.'],
      offline: ['Off the line. Fix it.', 'Step off his line.', 'Off the line.', 'Wall. Tap, rack.'] },
  },
  {
    // (the rework's R6, COMBAT §25.19.5: your #2's rifle down ("Gun down!"): his sector is yours until his "Gun up!")
    id: 'cqb-two-down', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'His sector', reach: null,
    when(state, me, ms) { const k = know(state, me, ms), W = k?.R.house?.two; return k?.choosing && W?.down && !W.coveredBy && k.offered('team:cover') ? { k, tier: k.tier, voice: k.voice } : null; },
    act: (ctx) => actIf(ctx.k, 'team:cover'),
    text: { 1: ["Your two's down. His sector.", 'Your two is gun down. Cover his sector.', "He's down. Take his sector.", 'Gun down on your two. His side.'], 2: ["Your two's down. His sector.", 'His sector.', 'Two down. Cover him.', 'Take his side.'], 3: ['His sector.', 'Cover him.', 'His side.', 'Two down.'] },
  },
  {
    id: 'cqb-still-up', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'Head', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.T || (k.T.face !== 'threat' && k.T.face !== 'armoured') || !stillUp(state, k.T.key) || facingOf(k.T, ms) < 0.5 || noShotNow(k)) return null;
      // ("Bang, then go": a man you see cowering is cqb-rp-hands' to challenge, never this line's head shot (the play review of
      // v0.0.26, finding 5: "Plate. Head: 4." over a man read COWERING, and T shot him))
      if (bangGoLane(k) && cowerOf(k, ms) === k.T) return null;
      const key = headKeys(state, k), row = headRow(k)?.id;
      return key ? { k, tier: k.shotTier, voice: k.voice, key, variant: `key${key}`, words: 'key', row } : { k, tier: k.shotTier, voice: k.voice, row };
    },
    // (from rung 2 the head row's aim is inside it (specials.js RUNG_AIM): the line names the row, T leaves the shot to you)
    act: (ctx) => (ctx.k.S.aim?.key === ctx.k.T.key || (ctx.k.rung >= 2 && headLive(ctx.k)) ? null : actIf(ctx.k, 'aim')),
    text: { 1: ["He's still up. Head.", 'Still standing. The head.', 'Plate. Go to the head.', "He's up. Head shot."], 2: ["Still up. Head.", 'Head.', 'Plate. Head.', 'Up. Head.'], 3: ['Head.', 'Head. Now.', 'Plate. Head.', 'Still up. Head.'],
      key: ['Still up. Head: {key}.', 'Head: {key}.', 'Plate. Head: {key}.', 'Up. Head: {key}.'] },
  },
  {
    id: 'cqb-hostage', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'Head only', reach: null,
    // (never on a hostage card already hit down (its sensor's stoppedAtMs): no row is offered on it, and the line named nothing
    // (the rework's R2: a tier one braked to a stop before his head shot hit him down, and the DI still said "Head only", a dead end))
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!(k?.choosing && k.T?.face === 'hostage' && (k.T.stoppedAtMs === null || k.T.stoppedAtMs === undefined) && facingOf(k.T, ms) >= 0.5) || noShotNow(k)) return null;
      // (on him, the head shot struck only for the safe ("off safe first") and Off safe offered: the thumb first, as
      // cqb-contact's 'safe'. Before, "Hostage. Head only, or hold." with no act and no row named, a dead end for T: the reading recruit
      // on eight-room seed 208, aimed at room 1's hostage-taker on safe, stood 90 s in stop motion until the room was passed)
      const onHim = k.S.aim?.key === k.T.key, headSafe = k.steps.some(s => s.id.startsWith('shot:head') && /off safe/i.test(String(s.off ?? '')) && (s.target ?? k.T.key) === k.T.key);
      if (onHim && !headLive(k) && headSafe && k.offered('selector:semi')) return { k, tier: k.shotTier, voice: k.voice, variant: 'safe', words: 'safe', row: 'selector:semi' };
      const key = headKeys(state, k), row = headRow(k)?.id;
      return key ? { k, tier: k.shotTier, voice: k.voice, key, variant: `key${key}`, words: 'key', row } : { k, tier: k.shotTier, voice: k.voice, row };
    },
    act: (ctx) => (ctx.variant === 'safe' ? actIf(ctx.k, 'selector:semi') : ctx.k.S.aim?.key === ctx.k.T.key || (ctx.k.rung >= 2 && headLive(ctx.k)) ? null : actIf(ctx.k, 'aim')),
    text: { 1: ['Hostage. Head only, or hold.', 'He\'s got a hostage. Head, or hold.', 'Hostage. Nothing but the head.', 'Hostage. Head shot or no shot.'], 2: ['Hostage. Head only, or hold.', 'Head only. Or hold.', 'Hostage. Head or nothing.', 'Head only.'], 3: ['Head only.', 'Hostage. Head.', 'Head, or hold.', 'Head or nothing.'],
      key: ['Hostage. Head only, {key}, or hold.', 'Head only: {key}. Or hold.', 'Hostage. Head or nothing: {key}.', 'Head only: {key}.'],
      safe: ['Hostage. Off safe, then the head.', 'Hostage. Thumb it off first. Head only.', 'Off safe. Head only, or hold.', 'Hostage. Safe off, then the head.'] },
  },
  {
    // (v0.0.19, COMBAT §25.18: a role-player of yours up and firing on the stack, bracketed: the shot the line names and leaves to
    // you (no act; tests/bots/house.mjs SHOT_LINES), the pair first, from rung 2 (below it cqb-contact's Off safe, Aim and Press))
    id: 'cqb-rp-fire', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'On you', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), T = k?.T;
      if (!k?.choosing || k.rung < 2 || !isLive(T) || !upNow(T, ms) || T.face !== 'threat' || !(T.live.fired > 0) || noShotNow(k) || stillUp(state, T.key)) return null;
      // ("Bang, then go": a man you see cowering is no longer on you: cqb-rp-hands' challenge leads)
      if (choosingLane(k) && cowerOf(k, ms) === T) return null;
      // (a man you know (taken in at your last pause or before): never one nobody has seen, firing or not)
      if (!(k.last?.ids ?? []).includes(T.key) && state.mind?.contact?.known?.[T.key] === undefined) return null;
      if (k.R.house?.twoPid && (ownerOf(state, T) ?? 1) !== 1) return null;
      const onHim = (s) => s.id.startsWith('shot:') && !s.off && (s.target ?? T.key) === T.key;
      const shot = k.steps.find(s => onHim(s) && /^shot:pair(@|$)/.test(s.id)) ?? k.steps.find(onHim);
      return shot ? { k, tier: k.shotTier, voice: k.voice, row: shot.id } : null;
    },
    act: () => null,
    text: { 1: ["He's on you. Pair, now.", "He's shooting at you. Pair him.", 'Return fire. Pair.', "He's firing. Two in him."], 2: ["He's on you. Pair.", 'Pair. Now.', 'On you. Pair.', 'Return fire.'], 3: ['Pair.', 'On you.', 'Now.', 'Pair him.'] },
  },
  {
    // ("Bang, then go": a role-player of yours bracketed, up and dazed (men.js liveStateOf): the window the bang bought, named
    // with the pair it leaves to you (no act), as cqb-rp-fire's; on the scene's lane only (see the header))
    id: 'cqb-rp-dazed', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'Dazed', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), T = k?.T;
      if (!k?.choosing || k.rung < 2 || !choosingLane(k) || !isLive(T) || !upNow(T, ms) || T.face !== 'threat' || liveStateOf(state, T, ms) !== 'dazed' || noShotNow(k) || stillUp(state, T.key)) return null;
      if (!(k.last?.ids ?? []).includes(T.key) && state.mind?.contact?.known?.[T.key] === undefined) return null;
      if (k.R.house?.twoPid && (ownerOf(state, T) ?? 1) !== 1) return null;
      const onHim = (s) => s.id.startsWith('shot:') && !s.off && (s.target ?? T.key) === T.key;
      const shot = k.steps.find(s => onHim(s) && /^shot:pair(@|$)/.test(s.id)) ?? k.steps.find(onHim);
      return shot ? { k, tier: k.shotTier, voice: k.voice, row: shot.id } : null;
    },
    act: () => null,
    text: { 1: ["He's dazed. Now. Pair.", "He can't see. Pair him now.", "Dazed. Two in him, now.", "He's blind. Now."], 2: ["He's dazed. Now.", 'Dazed. Pair.', 'Now. Pair.', "He's dazed."], 3: ['Now.', 'Dazed. Now.', 'Pair.', 'Now. Him.'] },
  },
  {
    // ("Away the boarding party" (its build sheet §1 A; FT§6.4): a man of yours bracketed, up and firing blind over his cover
    // (men.js liveStateOf 'firing-blind'), from rung 2: "Firing blind. Get on him." and no act, the pair it names left to you, as
    // cqb-rp-dazed's (tests/bots/house.mjs SHOT_LINES and PAIR_LINES carry it, D's); on a lane whose men choose)
    id: 'cqb-rp-blind', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'Blind', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), T = k?.T;
      if (!k?.choosing || k.rung < 2 || !choosingLane(k) || !isLive(T) || !upNow(T, ms) || T.face !== 'threat' || liveStateOf(state, T, ms) !== 'firing-blind' || noShotNow(k) || stillUp(state, T.key)) return null;
      if (!(k.last?.ids ?? []).includes(T.key) && state.mind?.contact?.known?.[T.key] === undefined) return null;
      if (k.R.house?.twoPid && (ownerOf(state, T) ?? 1) !== 1) return null;
      const onHim = (s) => s.id.startsWith('shot:') && !s.off && (s.target ?? T.key) === T.key;
      const shot = k.steps.find(s => onHim(s) && /^shot:pair(@|$)/.test(s.id)) ?? k.steps.find(onHim);
      return shot ? { k, tier: k.shotTier, voice: k.voice, row: shot.id } : null;
    },
    act: () => null,
    text: { 1: ['Firing blind. Get on him.', "He's firing blind. Pair him.", "He can't see you. Get on him.", 'Blind fire. Two in him.'], 2: ['Firing blind. Get on him.', 'Blind fire. Pair.', 'Get on him.', 'Firing blind.'], 3: ['Get on him.', 'Blind. Now.', 'Pair.', 'On him.'] },
  },
  {
    // (a man of the room you see running to his refuge (liveStateOf 'running-away'): "He's running. Hold." No act: a round at him
    // stays lawful (COMBAT §7.11's line), and the line holds the stack, not the trigger; warn, never over a man up and firing)
    id: 'cqb-rp-flee', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Running', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.plan || !choosingLane(k)) return null;
      const T = liveMen(k).find(t => liveStateOf(state, t, ms) === 'running-away' && seenK(state, k.me, t, ms) >= SEEN) ?? null;
      return T ? { k, tier: k.tier, voice: k.voice, key: T.key } : null;
    },
    act: () => null,
    text: { 1: ["He's running. Hold.", "He's running away. Hold your ground.", 'Running. Hold.', "He's off. Hold."], 2: ["He's running. Hold.", 'Running. Hold.', 'Hold.', "He's running."], 3: ['Hold.', 'Running.', 'Hold it.', 'Let him run.'] },
  },
  {
    // (one of the hauler's crew seen cowering, unarmed, not yet given up (opfor.js's L.unarmed, liveStateOf 'cowering'): "He's
    // crew. Challenge him.", the Challenge with the bracket on him, else the aim onto him; cqb-rp-hands' cower variant's crew words, its
    // own line here so it leads over "He's done." on a crewman (my call: the variant as a line under A's anchor))
    id: 'cqb-rp-crew', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Crew', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.plan || !choosingLane(k)) return null;
      // (what you see of him, no gun in his hands (kit.js handGunOf), never the fill's hidden `unarmed` flag (the v0.0.27 code review, finding 5);
      // an armed man cowering keeps his gun in his hands, so the two agree on every cowering man of the sweep's four lanes, 28,314 ticks)
      const C = !k.R.house?.boarding ? null : liveMen(k).filter(T => !!T.live && !handGunOf(state, T.live.who) && liveStateOf(state, T, ms) === 'cowering' && seenK(state, k.me, T, ms) >= SEEN)
        .sort((a, b) => (b.key === k.S?.pick) - (a.key === k.S?.pick) || a.key.localeCompare(b.key))[0] ?? null;
      if (!C || C.live.chalUntilMs !== undefined) return null;
      if (k.S?.pick === C.key && k.offered('contact:challenge')) return { k, tier: k.tier, voice: k.voice, key: C.key, variant: 'challenge', words: `crew${k.tier}`, act: 'stop:contact:challenge' };
      const act = k.S?.pick === C.key ? null : aimOnto(k, C.key);
      return act ? { k, tier: k.tier, voice: k.voice, key: C.key, variant: 'onto', words: `crewOnto${k.tier}`, act } : null;
    },
    act: (ctx) => ctx.act,
    text: { crew1: ["He's crew. Challenge him.", "He's one of the crew. Challenge him.", 'No weapon. Challenge him.', "Crew. Tell him what to do."], crew2: ["He's crew. Challenge him.", 'Crew. Challenge.', 'Challenge him.', 'No weapon. Challenge.'], crew3: ['Challenge.', 'Crew.', 'Challenge him.', 'Tell him.'],
      crewOnto1: ["He's crew. On him, then challenge.", 'Crew, no weapon. Get on him.', "He's crew. Cover him first.", 'No weapon. Muzzle on him.'], crewOnto2: ["He's crew. On him.", 'Crew. On him.', 'On him.', 'No weapon.'], crewOnto3: ['On him.', 'Crew.', 'Him.', 'Cover.'] },
  },
  {
    // (a real fight (would.js realOf): your stance down after a round, the knock over (contact.js knockedDown false): "On your feet.",
    // T the row "Get up" (contact.js 'contact:up'), G into the mode out of it; while the knock lasts nothing (see the header))
    id: 'cqb-up', voice: 'di', repeatMs: 0, tone: 'urgent', short: 'Get up', reach: null,
    when(state, me, ms) {
      if (me?.stance !== 'down' || !realOf(state)) return null;
      const k = know(state, me, ms);
      if (!k || knockedDown(state, k.pid, ms)) return null;
      return { k, tier: k.tier, voice: k.voice, row: 'contact:up' };
    },
    // (the boarding round's review: the rifle on its sling, whose panel offers no "Get up": T brings it up first, never a pause with no act)
    act: (ctx) => actIf(ctx.k, 'contact:up') ?? actIf(ctx.k, 'up') ?? (ctx.k.inMode ? null : 'stop:enter'),
    text: { 1: ['On your feet.', 'Up. On your feet.', 'Get up. Now.', 'On your feet. Back in it.'], 2: ['On your feet.', 'Up.', 'Get up.', 'Up. Back in it.'], 3: ['Up.', 'On your feet.', 'Get up.', 'Up, now.'] },
  },
  {
    // ("Away the boarding party": a holder down (combat/holders.js, his stance down), so the passage he held is nobody's. Said
    // while time runs only: it names nothing to press, so it never stands over a pause (the honest bot's "no act" dead end), and comes
    // back at most once a REPEAT_MS; never once the fall back is called (cqb-back's))
    id: 'cqb-passage', voice: 'di', tone: 'warn', short: 'Passage', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), Q = k?.R?.house?.holders;
      if (!k || k.inMode || !Q?.men?.length || k.R.house.boarding?.fallback) return null;
      const down = Q.men.some(m => state.actors?.list?.find(a => a.who === m.pid)?.stance === 'down');
      return down ? { k, tier: k.tier, voice: k.voice } : null;
    },
    act: () => null,
    text: { 1: ['Nobody on the passage. Watch your back.', 'The passage is open behind you. Watch your back.', "Your holder's down. Watch the passage.", 'Nobody holds the passage now. Watch your back.'],
      2: ['Nobody on the passage. Watch your back.', 'Passage is open. Watch your back.', 'Watch your back. The passage.', 'Nobody on the passage.'],
      3: ['Watch your back.', 'Passage is open.', 'Nobody on the passage.', 'Your back.'] },
  },
  {
    // ("Away the boarding party": the fall back called (R.house.boarding.fallback, the scene's at two of four down): the scene's
    // "Back to the lock" row (team.js FALLBACK_ROW, the house's move kind), its act, wherever it is offered)
    id: 'cqb-back', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'Back', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.R?.house?.boarding?.fallback || !lockWalkOf(state)) return null;
      // (out of the mode, time running: G for the row (the v0.0.27 play review, finding 3: cqb-walk's "D to your point. G for the drill."
      // stood over the walk back, and nothing named the lock)
      if (!k.inMode) return state.time?.doing || Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) > 0.05 ? null : { k, tier: k.tier, voice: k.voice, words: 'enter', enter: true };
      if (!k.choosing || !k.offered(FALLBACK_ROW)) return null;
      return { k, tier: k.tier, voice: k.voice, row: FALLBACK_ROW };
    },
    act: (ctx) => (ctx.enter ? 'stop:enter' : actIf(ctx.k, FALLBACK_ROW)),
    text: { enter: ['Back to the lock. G, then the row.', 'The lock. G, and back.', 'Fall back: G, the lock.', 'G. Back to the lock.'],
      1: ['Back to the lock.', 'Fall back. Back to the lock.', 'Out of it. Back to the lock.', 'Back to the lock, now.'],
      2: ['Back to the lock.', 'The lock. Go.', 'Fall back. The lock.', 'Back to the lock, now.'], 3: ['Back to the lock.', 'The lock.', 'Fall back.', 'Lock. Go.'] },
  },
  {
    // ("Away the boarding party" (the review of D): the passage held by the team (the lane's first leg a hold, GO given, no send
    // yet, no fall back): your pair holds in the lock until the leader's "Three, Four: cabin one. Go.". In stop motion T takes the panel's
    // Wait, time running on to the send; out of it nothing to press. Before it T read the held leg as one to enter and leave, "On: X, then
    // the keys." and "Don't stand there. G, and the next row." in turn, 646 times on the sergeant's 48213 to the fall back; a man of yours
    // up (the shot lines, urgent) and the passage's own warning lead over it)
    id: 'cqb-hold', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Hold', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), H = k?.R?.house, L0 = H?.rooms?.[0];
      if (!k || !H?.boarding || H.goAtMs === null || H.end || H.cur !== 0 || H.boarding.fallback || L0?.held || !k.plan?.hold) return null;
      if (k.inMode && !k.offered('wait')) return null;
      return { k, tier: k.tier, voice: k.voice, ...(k.inMode ? { row: 'wait' } : {}) };
    },
    act: (ctx) => (ctx.k.inMode ? actIf(ctx.k, 'wait') : null),
    text: { 1: ['Hold in the lock. The leader sends you.', 'Hold here. Wait for the send.', 'In the lock. Hold for the send.', 'Hold. The passage is theirs.'],
      2: ['Hold in the lock.', 'Hold. Wait for the send.', 'Hold for the send.', 'Hold.'], 3: ['Hold.', 'Wait.', 'Hold for it.', 'In the lock.'] },
  },
  {
    id: 'cqb-contact', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'Aim', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.plan) return null;
      // (your #2's bang on this door, you outside it: his task's line leads (cqb-task: "Cover it", then "Bang! Go."), never a challenge
      // or a shot through the doorway he opened, until BANG_LATE_MS after the bang (the review of v0.0.19: the recruit and the private
      // by the keys were led into a contact 0.15 s before the bang, entered 6.36 s and 3.97 s after it and were faulted 'bang')
      if (bangPending(k, ms)) return null;
      // ("Bang, then go": a man you see cowering is cqb-rp-hands' to challenge, not this line's to shoot)
      const cower = choosingLane(k) ? cowerOf(k, ms) : null;
      const all = upKnown(k, ms).filter(u => u.T !== cower), twoPid = k.R.house?.twoPid ?? null;
      // (with a #2, his corner's men are his: yours first; a man of yours whose hands you have not seen comes before his)
      const up = twoPid ? all.filter(u => (ownerOf(state, u.T) ?? 1) === 1) : all;
      if (!up.length) {
        // (over a gun that cannot fire nothing here leads on (Carry on, your point, a look, a challenge): cqb-reload's line names the
        // gun's own way first (v0.0.18's sweep, leads-on-v018: "That one's his. Carry on." over a rifle locked back and empty, T looping)
        if (noShotNow(k)) return null;
        const hands = handsUnseen(k, ms);
        if (hands && k.T?.key === hands.key && k.offered('contact:challenge')) return { k, variant: 'hands', words: `hands${k.shotTier}`, key: hands.key, voice: k.voice };
        // (his hands unseen and the bracket on another man (the recruit, room 1 on 48213, bracketed on his #2's rifle with 1a's hands
        // unseen: the line was silent, NEXT empty; the keys role of 2026-11-15): the muzzle onto him (the aim row, which moves the
        // bracket: a row of the panel, F24), then the challenge with the bracket on him)
        // (aimed and holding on another man, the aim row is not offered: the muzzle up off him first, High ready, then the aim onto him)
        if (hands && k.T?.key !== hands.key && targetOf(state, hands.key, k.pid) && (k.offered('aim') || k.offered('posture:highReady'))) {
          const H = (k.R.turners ?? []).find(t => t.key === hands.key);
          return { k, variant: 'handsOnto', words: 'handsOnto', key: hands.key, who: H?.name ?? 'him', Who: cap(H?.name ?? 'him'), voice: k.voice };
        }
        // (a man of your #2's corner up and facing whose hands you did not see: his all the same, "Carry on" yours (2026-11-12, R3:
        // the tier one by T on seed 3405, room 3's 3a unseen at the pause, no line and the honest T's Wait for the stall))
        if (!hands && !all.length && twoPid) {
          const his = (k.last?.ids ?? []).map(key => (k.R.turners ?? []).find(t => t.key === key)).find(T => T && (ownerOf(state, T) ?? 1) === 2 && T.room === k.plan?.room && T.face !== 'hostage' && T.face !== 'noshoot' && (T.stoppedAtMs === null || T.stoppedAtMs === undefined) && facingOf(T, ms) >= 0.5);
          if (his && k.offered('drill:carry') && !k.asking) return { k, variant: 'his', words: 'hisU', who: his.name ?? 'him', Who: cap(his.name ?? 'him'), where: whereOf(his.name), voice: k.voice };
        }
        if (hands || !all.length) return null;
        // (his man and nothing of yours to carry on: the room's own next row speaks (the corporal's Dominate), never a line with no
        // act over it (2026-11-12, R3: the corporal by T, room 3's 3a up for his #2 after "In, your corner", on 51 of 100 seeds))
        // (no bundle to carry on, below rung 2 (the private, room 3, 1489397426 and 48213, aimed at 3b, his #2's: the line was silent
        // and NEXT empty, cqb-next keeping quiet over a man up; the keys role of 2026-11-15): his man is his, and yours the room's next
        // row of your own, your point, else a corner of yours not yet seen; with none of those, the man is engaged as any other)
        if (!k.offered('drill:carry')) {
          const cov = coveredOf(k), look = k.inside && cov ? (k.plan?.hot ?? []).find(h => !cov[h.id] && k.offered(`look:${h.id}`)) : null;
          // (at rung 2 the room's Dominate first, cqb-dominate's row, which takes the corners and the far leg in one: the walk to the
          // far leg alone, then the bundle, cost the corporal on 48213's breach lane 9 s; the hunt of v0.0.18's page-1)
          const next = firstOf(k, ['move:point', k.rung === 2 ? bundleRow(k, 'room:dominate')?.id ?? null : null, look ? hotRow(k, look) : null]);
          if (next) return { k, variant: 'hisNext', words: 'hisNext', next, row: next, who: all[0].T.name ?? 'him', Who: cap(all[0].T.name ?? 'him'), where: whereOf(all[0].T.name), what: String(k.steps.find(x => x.id === next)?.label ?? next).replace(/\.$/, ''), voice: k.voice };
          return null;
        }
        // (the review of A and B: while the bundle's question stands (k.asking: "Door, east wall. Hold it or clear it?", a drawn
        // house's closet your #2 does not hold), Carry on is no answer, so "That one's his. Carry on." had no act and T nothing to press
        // (the tier one on drawn seed 62, room 3), and the honest bot shot the no-shoot bracketed in your sector instead (the sergeant on
        // drawn seed 10, tick 182). His man is his either way: the question's own line (cqb-unplanned: Hold it) leads)
        if (k.asking) return null;
        return { k, variant: 'his', words: 'his', hold: HOLD_SAY[all[0].hold], Hold: HOLD_SAY[all[0].hold], who: all[0].T.name ?? 'him', Who: cap(all[0].T.name ?? 'him'), where: whereOf(all[0].T.name), voice: k.voice };
      }
      // (the man bracketed if he is one of them (and not still up: cqb-still-up's), else the first of them: the aim onto him)
      // (the aim goes onto a man in the rifle's frame (shooting.js targetsOf: a clear line to him); one taken in from the
      // stack and hidden now by the jamb is not aimable, and "On him." with T pressing an aim that could not be taken was a
      // dead end (the shoot house's rework, R1, 2026-11-12: the Raider by T on 48213, 5 and 7, room 1, stopped in the door's
      // outer middle with 1a behind the hinge-side jamb): another of his men who is in the frame, else "In." and Carry on,
      // the feet into the room where he is seen)
      const inFrame = (u) => !!targetOf(state, u.T.key, k.pid);
      // (the hunt of v0.0.18: the bracket on a man out of the frame is no aim either, as no bracket is: another of his men in
      // the frame, else "In." and Carry on. "Clear the room" chosen at room 1's contact pause and Backspaced walked #1 back to the
      // stack, 1a behind the jamb and still bracketed: 'row' with no shot row, then nothing, and T silent to the leg's stall)
      const on0 = up.find(u => u.T.key === k.T?.key) ?? null, on = on0 && inFrame(on0) ? on0 : null, U = on ?? up.find(inFrame) ?? on0 ?? up[0];
      if (on && stillUp(state, on.T.key)) return null;
      // (dry: no shot to name, cqb-reload's line leads (see dryNow))
      if (noShotNow(k)) return null;
      const aimed = k.S.aim?.key === U.T.key;
      let variant = !on ? (inFrame(U) ? 'onto' : 'move') : k.rung < 2 ? (k.b?.mode === 'safe' ? 'safe' : aimed ? 'press' : 'aim') : 'row';
      // ("Pair." only while a shot row is there to take: with one round left they are all struck ("one left"), and with the
      // bolt locked on an empty so is Fire; the line, with no act, held the lead for the rest of the lane and T did nothing
      // (the bugs auditor of 2026-11-11: the tier one by T in the hall on seeds 7 and 1489397426, the lane ended by time).
      // So the one round as the rung below takes it, Aim then Press (the Fire row), and with none, nothing here:
      // cqb-reload's "Reload." leads)
      if (variant === 'row' && !k.steps.some(s => s.id.startsWith('shot:') && !s.off)) {
        // (on safe, Fire struck "on safe": the thumb first, as below rung 2 (the hunt of v0.0.20, breach-5: the armoured man up and
        // aimed at, one round left on safe, the magazine out: no line for 37 stops while Off safe was live, the leg passed on time))
        if (k.b?.mode === 'safe' && k.offered('selector:semi')) variant = 'safe';
        else if (!aimed && k.offered('aim')) variant = 'aim';
        else if (aimed && k.offered('fire')) variant = 'press';
        else return null;
      }
      // (the press and the row name the shot the panel has for it, its keys shown after the words (2026-11-15, the keys role: "Press."
      // named no key below rung 2, where Pair is on 1 and Fire on 6): the first live shot row on him, else Fire)
      // (the row's words say Pair: the pair first, else the first live shot on him (the sergeant's "Rifle. Pair." lit the failure drill))
      const onHim = (s) => s.id.startsWith('shot:') && !s.off && (s.target ?? U.T.key) === U.T.key;
      const shot = variant === 'press' || variant === 'row' ? k.steps.find(s => onHim(s) && /^shot:pair(@|$)/.test(s.id)) ?? k.steps.find(onHim) ?? (variant === 'press' && k.offered('fire') ? { id: 'fire' } : null) : null;
      return { k, variant, words: variant === 'onto' ? `onto${k.shotTier}` : `${variant}${k.shotTier}`, hold: HOLD_SAY[U.hold], Hold: HOLD_SAY[U.hold], key: U.T.key, who: U.T.name ?? 'him', Who: cap(U.T.name ?? 'him'), voice: k.voice, ...(shot ? { row: shot.id } : {}) };
    },
    act: (ctx) => (ctx.variant === 'safe' ? actIf(ctx.k, 'selector:semi') : ctx.variant === 'aim' || ctx.variant === 'onto' ? aimOnto(ctx.k, ctx.key)
      : ctx.variant === 'hands' ? actIf(ctx.k, 'contact:challenge') : ctx.variant === 'handsOnto' ? (ctx.k.offered('aim') ? aimOnto(ctx.k, ctx.key) : actIf(ctx.k, 'posture:highReady')) : ctx.variant === 'hisNext' ? actIf(ctx.k, ctx.next)
        : ctx.variant === 'his' && !ctx.k.asking ? actIf(ctx.k, 'drill:carry') : ctx.variant === 'move' ? moveAct(ctx.k) : null),
    text: {
      safe1: ['{hold}. Off safe. Then aim.', '{hold}. Thumb it off first.', '{hold}. Safe off, then aim.', '{hold}. Off safe.'], safe2: ['{hold}. Off safe.', '{hold}. Thumb off.', 'Off safe.', '{hold}. Safe off.'], safe3: ['Off safe.', '{hold}. Off.', 'Thumb.', 'Safe off.'],
      aim1: ['{hold}. Aim. Then press.', '{hold}, in the room. Aim at him.', '{hold}. Get on him.', '{hold}. Aim first.'], aim2: ['{hold}. Aim.', 'On him.', '{hold}. On him.', 'Aim.'], aim3: ['On him.', 'Aim.', '{hold}.', 'Him.'],
      press1: ['Press.', 'Now press.', 'You\'re on him. Press.', 'Press it.'], press2: ['Press.', 'Now.', 'Fire.', 'Press.'], press3: ['Press.', 'Now.', 'Fire.', 'Go.'],
      row1: ['{hold}. Pair.', '{hold}. Two in him.', '{hold}. Pair him.', '{hold}. Pair.'], row2: ['{hold}. Pair.', 'Pair.', '{hold}. Two in him.', 'Pair him.'], row3: ['Pair.', '{hold}. Pair.', 'Two in him.', 'Pair.'],
      move1: ['{hold}, inside. Get in and on him.', '{hold} in there. Move in to him.', 'In. {hold}, inside.', "Get in. He's in there."], move2: ['{hold}. In.', 'Get in.', 'In. On him.', 'In.'], move3: ['In.', 'Move.', 'Get in.', 'In.'],
      hands1: ["Can't see his hands. Challenge him.", 'Hands? Make him show you.', 'His hands. Challenge.', 'Show me your hands. Say it.'], hands2: ['Hands. Challenge.', 'Challenge him.', 'Hands?', 'Challenge.'], hands3: ['Hands.', 'Challenge.', 'Hands?', 'Show me.'],
      his: ["His man: {where}. Yours: your corner.", "{Who}'s your two's. Trust him.", "That one's his. Carry on.", "Your two's man. Leave him to him."],
      handsOnto: ["{Who}: hands not seen. Cover him.", "{Who}. His hands? On him.", "{Who}, hands unseen. Him first.", "Hands not seen: {who}. Cover him."],
      // (the next row's label its own sentence, never after "Yours:" (the play review: "Yours: Move to your point.",
      // "Yours: Look: behind the door."))
      hisNext: ["His man: {where}. {what}.", "{Who}'s your two's. {what}.", "That one's his. {what}.", "Your two's man. {what}."],
      hisU: ["His man: {where}. Yours: your corner.", "{Who}'s your two's. Carry on.", "That one's his. Carry on.", "Your two's man. Leave him to him."],
      onto1: ["{Hold}'s still up: {who}. Get on him.", '{hold} up, {who}. On him.', "He's still in the fight: {who}. Aim.", '{Who}. Still up. On him.'], onto2: ['{Who}. On him.', '{hold}, still up. On him.', 'Still one up. On him.', '{Who}. Up.'], onto3: ['{Who}.', 'One up.', 'Him.', 'Still up.'],
    },
  },
  {
    // (v0.0.19, COMBAT §25.18: a role-player of the room down, still armed, nobody covering him: Cover him (the row that puts your
    // muzzle on him; the room's "Clear!" waits on it: shoothouse.js liveGateOf))
    id: 'cqb-rp-down', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Cover him', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.plan) return null;
      const T = uncoveredOf(k, ms, 'down'), act = coverAct(k, T);
      return act ? { k, tier: k.tier, voice: k.voice, key: T.key, act } : null;
    },
    act: (ctx) => ctx.act,
    text: { 1: ["He's down. Cover him.", "He's down, still armed. Cover him.", 'Down is not out. Cover him.', "He's down. Muzzle on him."], 2: ["He's down. Cover him.", 'Cover him.', 'Down. Cover him.', 'Muzzle on him.'], 3: ['Cover him.', 'Cover.', 'On him.', 'Cover the man.'] },
  },
  {
    // (v0.0.19: a role-player who gave up, his hands seen up, nobody covering him: Challenge him (contact.js's row), then Cover him)
    id: 'cqb-rp-hands', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: (ctx) => (ctx.variant === 'challenge' ? 'Challenge' : 'Cover him'), reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.plan) return null;
      const said = k.S?.last?.step === 'contact:challenge' || k.S?.last?.step === 'contact:hold';
      // ("Bang, then go": a man seen cowering, not giving up: "He's done. Challenge him.", the bracket and the aim onto him first)
      // (never again while a challenge of yours on him is not yet judged: the tick it ends holds the clock, and a second press there
      // ran past his give (the review of A, 2026-11-19); the hands variant's `said`, by his record, so a challenge he did not hear is offered again)
      const C = cowerOf(k, ms);
      if (C && C.live.chalUntilMs === undefined) {
        if (k.S?.pick === C.key && k.offered('contact:challenge')) return { k, tier: k.tier, voice: k.voice, key: C.key, variant: 'cower', words: `cower${k.tier}`, act: 'stop:contact:challenge' };
        const act = k.S?.pick === C.key ? null : aimOnto(k, C.key);
        if (act) return { k, tier: k.tier, voice: k.voice, key: C.key, variant: 'cowerOnto', words: `cowerOnto${k.tier}`, act };
      }
      const T = uncoveredOf(k, ms, 'hands');
      if (!T) return null;
      if (k.S?.pick === T.key && !said && k.offered('contact:challenge')) return { k, tier: k.tier, voice: k.voice, key: T.key, variant: 'challenge', words: `challenge${k.tier}`, act: 'stop:contact:challenge' };
      const act = coverAct(k, T);
      return act ? { k, tier: k.tier, voice: k.voice, key: T.key, variant: 'cover', words: `cover${k.tier}`, act } : null;
    },
    act: (ctx) => ctx.act,
    text: { challenge1: ['Hands up. Challenge him.', 'He gave up. Challenge him.', 'Hands up. Tell him what to do.', 'He quit. Challenge him.'], challenge2: ['Hands up. Challenge.', 'Challenge him.', 'Hands. Challenge.', 'Challenge.'], challenge3: ['Challenge.', 'Hands. Challenge.', 'Tell him.', 'Challenge him.'],
      cower1: ["He's done. Challenge him.", "He's cowering. Challenge him.", "He's frozen. Make him give up.", "He's done. Tell him."], cower2: ["He's done. Challenge him.", 'Cowering. Challenge.', "He's done. Challenge.", 'Challenge him.'], cower3: ['Challenge.', "He's done.", 'Challenge him.', 'Tell him.'],
      cowerOnto1: ["He's done. On him, then challenge.", "He's cowering. Get on him.", "He's frozen. Cover him first.", "He's done. Muzzle on him."], cowerOnto2: ["He's done. On him.", 'Cowering. On him.', 'On him.', "He's done."], cowerOnto3: ['On him.', "He's done.", 'Him.', 'Cover.'],
      cover1: ['He gave up. Cover him.', 'Hands up. Keep him covered.', 'He quit. Muzzle on him.', 'Cover him. He gave up.'], cover2: ['Cover him.', 'Hands up. Cover.', 'On him.', 'Keep him covered.'], cover3: ['Cover him.', 'Cover.', 'On him.', 'Covered.'] },
  },
  {
    // (v0.0.19: a role-player the team has seen, not down nor with his hands up, in nobody's sight now ("he went behind the bend"):
    // Find him, the Look at the hot spot nearest where he was last seen (the house's H.live.lastAt: where you saw him, not where he is))
    id: 'cqb-rp-gone', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Find him', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), H = k?.R.house;
      if (!k?.choosing || !k.plan || !k.inside || !H?.live) return null;
      // (men.js gateWhy's 'unaccounted': seen by the team, up, in nobody's sight now)
      const T = liveMen(k).find(t => gateWhy(state, t, ms) === 'unaccounted');
      const at = T ? H.live.lastAt?.[T.key] ?? [T.x, T.z] : null;
      const hot = at ? (k.plan.hot ?? []).filter(h => k.offered(`look:${h.id}`)).sort((a, b) => Math.hypot(a.x - at[0], a.z - at[1]) - Math.hypot(b.x - at[0], b.z - at[1]))[0] : null;
      return hot ? { k, tier: k.tier, voice: k.voice, key: T.key, act: `stop:look:${hot.id}` } : null;
    },
    act: (ctx) => ctx.act,
    text: { 1: ['Find him. He went behind the bend.', "He's gone from view. Find him.", 'Where did he go? Look there.', 'Lost him. Find him before you call it.'], 2: ['Find him.', 'Lost him. Look.', 'He moved. Find him.', 'Find him first.'], 3: ['Find him.', 'Look.', 'Where is he?', 'Find him.'] },
  },
  {
    // ("Bang, then go": after the room's "Clear!", a man accounted for there within reach and not yet searched: Search him
    // (contact.js's row, 20 s behind the scene's skip); never required, so a note; on the scene's lane only (see the header))
    id: 'cqb-rp-search', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Search him', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !bangGoLane(k)) return null;
      const T = k.offered('contact:search') ? searchableOf(state, k.pid, ms)[0] : null;
      if (T) return { k, tier: k.tier, voice: k.voice, key: T.key, act: 'stop:contact:search' };
      // (out of reach: the walk up to him first, the search's own row then (contact.js searchWalkOf; the review of A, 2026-11-19))
      const W = k.offered('move:search') ? searchableOf(state, k.pid, ms, { reach: false })[0] : null;
      return W ? { k, tier: k.tier, voice: k.voice, key: W.key, variant: 'walk', words: `walk${k.tier}`, act: 'stop:move:search' } : null;
    },
    act: (ctx) => ctx.act,
    text: { 1: ['Search him if you want the truth now.', "Search him. You'll see what you hit.", 'Search him: where did yours go?', 'Search him. Then you know.'], 2: ['Search him.', 'Search him if you want.', 'Search. The truth.', 'Search him now.'], 3: ['Search him.', 'Search.', 'Check him.', 'Search him.'],
      walk1: ['Go to him. Search him if you want the truth now.', 'Walk up to him and search him.', 'To him, then search him.', 'Go and search him. Then you know.'], walk2: ['To him. Search him.', 'Go search him.', 'To him, search.', 'Search him if you want.'], walk3: ['To him.', 'Search him.', 'Go.', 'Search.'] },
  },
  {
    // (the rework's R6, COMBAT §25.19.6: the pistol out and nobody of yours facing: holster it, the rifle up and cleared)
    id: 'cqb-rifle-up', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Rifle up', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.offered('weapon:rifle-up') || manOn(k, ms)) return null;
      // (the rifle believed dry (its bolt locked, or its chamber empty with no magazine in) and Fix naming another way for the gun in
      // hand: Fix's line leads (v0.0.18's sweep, pingpong-v018: Rifle up onto a dry rifle, Transition back onto a P-12 whose
      // magazine was out, and again, with its press check never named)
      const rifle = state.people?.[k.pid]?.kit?.worn?.sling, rb = rifle ? beliefOf(state, rifle) : null;
      const rifleDry = !!rb && (!!rb.locked || !!rb.stoppage || (rb.chamber === 'empty' && rb.mag !== 'in'));
      const fix = k.steps.find(st => st.fix && !st.off)?.id ?? null;
      if (rifleDry && fix && fix !== 'weapon:rifle-up') return null;
      // (never onto a rifle the planner finds no round for (no magazine of it reachable, the chamber empty): the pistol is the gun
      // that fires, and Rifle up then cqb-reload's Transition went round for ever (the hunt of v0.0.20, breach-6, its save: the
      // rifle's magazines all out of reach, 21 Rifle ups))
      if (rifleDry && !planFor(state, k.pid, rifle, 'fire', { carry: 'hands', purpose: null }).path) return null;
      return { k, tier: k.tier, voice: k.voice };
    },
    act: (ctx) => actIf(ctx.k, 'weapon:rifle-up'),
    text: { 1: ["He's down. Rifle up.", 'Pistol away. Rifle up.', 'Holster it. Clear the rifle.', 'Down. Rifle back up.'], 2: ['Rifle up.', 'Holster. Rifle.', 'Pistol away. Rifle.', 'Rifle back.'], 3: ['Rifle.', 'Rifle up.', 'Holster.', 'Rifle back.'] },
  },
  {
    id: 'cqb-noshoot', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'No shot', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.T || !k.last?.ids?.includes(k.T.key) || !NOSHOOT.has(k.last.ident?.[k.T.key]) || facingOf(k.T, ms) < 0.5) return null;
      // (over a gun that cannot fire, cqb-reload's line and its act lead: "No shot." with no act held the lead while a threat beside
      // him faced you (the fumble net's noshoot-silent))
      if (noShotNow(k)) return null;
      // (at the pause itself (time still where it stopped), or with the bundle's rest to carry on and nobody of the room up:
      // then the line names Carry on and T does it (the fixer's of 0.0.12: a no-shoot never turns away, and his line,
      // with no act, held the panel's lead for the rest of the room))
      // (never past a door the bundle asked about: its own line, Hold it, comes first (the fixer's of 0.0.12: "No shot. Carry on."
      // outranked "Door. Hold it or clear it?" and T walked past room 2's closet))
      const on = k.offered('drill:carry') && !k.asking && !upKnown(k, ms).length;
      if (!on && ms !== k.last.atMs) return null;
      return { k, tier: k.shotTier, voice: k.voice, variant: on ? 'on' : null, words: on ? 'on' : k.shotTier };
    },
    act: (ctx) => (ctx.variant === 'on' ? actIf(ctx.k, 'drill:carry') : null),
    text: { 1: ['Hands. No weapon. Don\'t.', 'Empty hands. No shot.', 'No weapon. Hold your fire.', 'Hands. Don\'t shoot him.'], 2: ['Hands. Don\'t.', 'No weapon. No shot.', 'Hands. Hold.', 'No shot.'], 3: ['No shot.', 'Hands.', 'Hold.', 'No weapon.'],
      on: ['Hands. No weapon. Carry on.', 'No shot. Carry on.', 'Empty hands. Leave him. On.', 'No weapon. On.'] },
  },
  {
    // (its chip an act, "Hold the locked door" or "Kick it", never the bare "Locked" (the play review of 2026-11-13: "T held Locked" 78 times))
    id: 'cqb-locked', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: (ctx) => (ctx.variant === 'hold' ? 'Hold the locked door' : ctx.words === 'again' ? 'Kick it again' : 'Kick it'), reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing) return null;
      const struck = k.steps.find(s => /^door:(push|pull)>/.test(s.id) && s.off === 'locked');
      const id = struck ? struck.id.split('>')[1] : k.S?.carry?.why === 'refused' ? k.here?.plan?.door : null;
      if (!id) return null;
      // (the hunt of v0.0.18: a kick handed back and the way in then set to another (Kick ⇄ Pry): that way's row is the
      // drill's next, never "Kick it again" over it)
      const way = !struck ? variantHere(state, k.pid)?.breach ?? null : null;
      if (way && way !== 'kick') return null;
      const inner = (k.plan?.inner ?? []).includes(id), held = !inner && !lockedOf(state, id);
      // (a pull door has no kick (src/sim/places/swing.js): never "Kick it" over a struck row; held, as an inner door is)
      const kick = inner ? kickableOf(state, { ...k.plan, door: id }, k.plan.room) : kickableOf(state, k.plan);
      if (!kick) return inner && k.R.house?.two?.hold !== id ? { k, id, variant: 'hold', words: 'hold', voice: k.voice } : null;
      // (an inner door already held is answered: no line (the fixer's of 0.0.12: "Locked. Leave it held." over a held door))
      if (inner && k.R.house?.two?.hold === id) return null;
      return { k, id, variant: inner ? 'hold' : 'kick', words: inner ? 'hold' : held ? 'again' : 'kick', voice: k.voice };
    },
    // (the hunt of v0.0.18: the door's own Kick row is offered within DOOR_REACH_M of its middle, and a kick that held left
    // #1 1.51 m from it: the kick again by the drill's rows then, its Carry on (the door beat again from where he stands) or the
    // room's row that kicks, never "Again. Kick it." with no act)
    act: (ctx) => (ctx.variant === 'hold' ? actIf(ctx.k, `door:hold>${ctx.id}`) : actIf(ctx.k, `door:kick>${ctx.id}`) ?? (ctx.k.S?.carry?.why === 'refused' ? actIf(ctx.k, 'drill:carry') : null)
      ?? actIf(ctx.k, ctx.k.steps.find(s => s.kind === 'bundle' && !s.off && s.id.endsWith(`>${ctx.id}`) && /@[^>]*\bkick\b/.test(s.id))?.id)),
    text: { kick: ['Locked. Kick it.', 'Locked. Boot it.', 'It won\'t go. Kick it.', 'Locked. Kick it in.'], again: ['It held. Kick it again.', 'Again. Kick it.', 'It held. Boot it again.', 'Kick it again.'], hold: ['Locked. Hold it.', 'Locked. Leave it held.', 'It won\'t open. Hold it.', 'Locked. Your two holds it.'] },
  },
  {
    id: 'cqb-unplanned', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Door', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || k.S?.carry?.why !== 'door-unplanned') return null;
      const id = (k.plan?.inner ?? []).find(x => k.offered(`door:hold>${x}`)) ?? null;
      return id ? { k, id, tier: k.tier, voice: k.voice } : null;
    },
    act: (ctx) => actIf(ctx.k, `door:hold>${ctx.id}`),
    text: { 1: ['A door in here. Hold it or clear it?', 'Door. Hold it before you go on.', 'Another door. Hold it.', 'A door you didn\'t plan. Hold it.'], 2: ['Door. Hold it or clear it?', 'Door. Hold it.', 'Inner door. Hold it.', 'Door. Your call.'], 3: ['Door. Hold it.', 'Inner door.', 'Door. Hold.', 'That door.'] },
  },
  {
    id: 'cqb-two', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Your two', reach: null,
    // (never over a gun that cannot fire: cqb-reload's line leads (v0.0.19's fixer: the fumble net's recovery by T looped on Wait))
    when(state, me, ms) { const k = know(state, me, ms); return k?.choosing && k.S?.carry?.why === 'two' && twoAway(state, ms) && !noShotNow(k) ? { k, tier: k.tier, voice: k.voice } : null; },
    act: (ctx) => actIf(ctx.k, 'wait'),
    text: { 1: ["Your number two's not with you. Wait for him.", 'Where\'s your two? Wait.', 'Not without your two. Wait.', 'Your two isn\'t stacked. Wait.'], 2: ["Your two's not with you. Wait.", 'Wait for your two.', 'Two\'s not up. Wait.', 'Wait for him.'], 3: ['Wait for him.', 'My two.', 'Wait.', 'Not yet.'] },
  },
  {
    id: 'cqb-reload', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: (ctx) => ({ up: 'Rifle up', tr: 'Transition', rel: 'Bolt release', relP: 'Slide release', chg: 'Charge', rack: 'Rack it', look: 'Look', sling: 'Up' }[ctx.words] ?? 'RELOAD'), reach: null,
    // (0.0.16, the fixer's: on any dry gun (dryNow, the magazine in or out), and named by the row T does, Rifle up where the
    // P-12 is dry with nothing left to load, so a man still up never leaves the line naming a shot the panel cannot take)
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!(k?.inMode && (dryNow(k) || emptyNow(k) || slungNow(k)))) return null;
      // (the play review: never while a hand holds a device, cqb-hands its way out: "T held RELOAD" stood under
      // "It's in your hand. Flash it." with an armed G-11 in the hand, every rifle row struck "hands full")
      if (handDeviceOf(state, k.pid)) return null;
      // (v0.0.18: Transition first where it is offered, then the row Fix names (the planner's: the bolt release on a locked bolt over a
      // magazine with rounds, Charge on Condition 3, the look at the port, Up), then the reloads as before, so T is Fix and never a Top
      // up for ever over a locked bolt (the dead-end hunt of 2026-11-16: the bolt stayed locked on a magazine of 10 through six T))
      const fix = k.choosing ? k.steps.find(st => st.fix && !st.off)?.id ?? null : null;
      // (Transition wherever the panel offers it: on a dry rifle only with a man known, facing and in the line within
      // TRANSITION_NEAR_M (sidearm.js threatFacing), or with no round for the rifle anywhere. The hunt of v0.0.20's breach-6 loop was
      // cqb-rifle-up's, bringing that rifle back up (its guard below); a gate here on manOn, built with it, was dropped by the review of
      // the fixes (R3): no state of 36 honest lanes reached it, and where it could, the man it passed over was known, facing you in
      // the line within 10 m, a man on you)
      const next = k.choosing ? firstOf(k, ['weapon:transition']) ?? (GUN_FIX.has(fix) ? fix : null) ?? firstOf(k, [...RELOAD_ACTS, 'up']) : null;
      // (a RELOAD on the P-12 at tier 1: the list's own words, its slide for the rifle's bolt (the hunt of v0.0.18))
      const w = reloadWords(next, k.b?.model) ?? (k.b?.model === 'p12' && k.shotTier === 1 ? 'rldP' : null);
      return { k, tier: k.shotTier, voice: k.voice, next, ...(w ? { variant: w, words: w } : {}), ...(next ? { row: next } : {}) };
    },
    // (the rework's R6: with the P-12 in the holster and a man within 10 m, Transition first (COMBAT §25.19.6's DI))
    act: (ctx) => actIf(ctx.k, ctx.next),
    text: { 1: ['Empty. Reload.', 'Bolt\'s back. RELOAD.', 'Dry. Reload it.', 'Empty. Magazine.'], rldP: ['Empty. Reload.', 'Slide\'s back. RELOAD.', 'Dry. Reload it.', 'Empty. Magazine.'], 2: ['Empty. Reload.', 'Reload.', 'Dry. Reload.', 'Mag.'], 3: ['Reload.', 'Mag.', 'Empty.', 'Reload.'],
      up: ["Pistol's dry. Rifle up.", 'Nothing left for it. Rifle up.', 'Dry. Holster, rifle up.', 'Empty pistol. Rifle up.'], tr: ['Empty. Pistol.', 'Dry. Transition.', "Bolt's back. Pistol.", 'Empty. Go to the pistol.'],
      rel: ["Bolt's back on a full one. Send it.", 'Bolt release.', 'Locked back. Release it.', 'Send the bolt.'], relP: ["Slide's back. Send it.", 'Slide release.', 'Locked back. Release it.', 'Send the slide.'],
      chg: ['Empty chamber. Charge it.', 'Charge it.', 'Nothing chambered. Charge.', 'Charge.'], rack: ['Empty chamber. Rack it.', 'Rack it.', 'Nothing chambered. Rack the slide.', 'Rack.'],
      look: ['Not sure what\'s in it. Look.', 'Check the port.', 'Look at it.', 'Check it.'], sling: ["Rifle's on the sling. Up.", 'Get it up.', 'Rifle up.', 'Up. Now.'] },
  },
  {
    id: 'cqb-funnel', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Out of the door', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      // (never once the boarding's fall back is called: "In." over the walk back to the lock (the v0.0.27 play review, finding 3 b))
      if (!k?.plan?.door || !inFunnel(k.plan, me.x, me.z) || Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) > 0.05 || k.S?.doing || k.R?.house?.boarding?.fallback) return null;
      const variant = k.rung >= 2 ? 'enter' : k.inside ? 'point' : 'keys';
      // (carried FH-1: the walk in's keys from where you stand in the doorway, #1's path's (walkWords), the legs in the variant)
      if (variant === 'keys') { const w = walkWords(k.plan, [me.x, me.z]); return { k, variant: `keys|${w.legs}`, words: 'keys', voice: k.voice, keys: w.keys }; }
      return { k, variant, words: variant, voice: k.voice };
    },
    // (in: the room's bundle where it is offered, else the halted bundle's Carry on, else your point; never a line naming nothing
    // (the rework's R2: a tier one braked to a stop in room 2's doorway at the closet's Hold it, the room's bundle not offered
    // inside it, and T waited 90 s: the stopped body had kept its speed before, so the line never came))
    act: (ctx) => (ctx.variant === 'enter' ? actIf(ctx.k, bundleRow(ctx.k, ctx.k.rung >= 3 ? 'room:clear' : 'room:in')?.id ?? null) ?? actIf(ctx.k, 'drill:carry') ?? actIf(ctx.k, bundleRow(ctx.k, 'room:dominate')?.id ?? null) ?? actIf(ctx.k, 'move:point') : ctx.variant === 'point' ? actIf(ctx.k, 'move:point') : actIf(ctx.k, 'leave')),
    text: { enter: ['Out of the door. In.', 'You\'re in the door. Go.', 'Don\'t stop in the door. In.', 'Doorway. Move.'], point: ['Out of the door. Your point.', 'Off the door. To your point.', 'Not in the door. Your point.', 'Move. Your point.'],
      keys: ['Out of the door. X, then {keys}.', "You're a target in the door. X, and {keys}.", "Don't stand in the door. X, then {keys}.", 'Out of the door. X, in: {keys}.'] },
  },
  {
    id: 'cqb-corner', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Your corner', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), cov = k ? coveredOf(k) : null;
      if (!k?.choosing || k.rung >= 2 || !k.inside || !cov || upKnown(k, ms).length) return null;
      const h = (k.plan.hot ?? []).find(x => !cov[x.id] && k.offered(`look:${x.id}`));
      if (!h) return null;
      // (the far leg is not seen from the near one: the walk up to it first, then the look)
      const variant = hotRow(k, h) === 'move:far' ? 'far' : h.why === 'behind the door' ? 'door' : 'corner';
      // (a far walk whose plan names it ("the back room", the twin's: A's chunks) in its own words)
      const fw = variant === 'far' && k.plan.far?.words && k.plan.far.words !== 'the far leg' ? 'farNamed' : variant;
      return { k, hot: h.id, variant, words: fw, voice: k.voice, where: k.plan.far?.words ?? 'the far leg', Where: cap(k.plan.far?.words ?? 'the far leg') };
    },
    act: (ctx) => actIf(ctx.k, ctx.variant === 'far' ? 'move:far' : `look:${ctx.hot}`),
    text: { door: ['Behind the door. Check it.', 'The door. Look behind it.', 'Behind the door.', 'Check behind the door.'], corner: ['Your corner. Look.', 'That corner. Check it.', 'Corner. Look at it.', 'You didn\'t look there.'],
      far: ['The far leg. Walk up and look.', 'Round the bend. Go and see it.', 'There\'s more room past the bend. Walk it.', 'The far leg. You can\'t see it from here.'],
      farNamed: ['{Where}. Walk up and look.', '{Where}. Go and see it.', 'There\'s more room through there: {where}. Walk it.', '{Where}. You can\'t see it from here.'] },
  },
  {
    // (the build sheet v0.0.20 item 1: a walk of yours held PIN_END_MS by a body handed back where it stands ('blocked', places/
    // move.js): the keys round him to where the walk was going, or T, the same row planned again from here (Carry on))
    id: 'cqb-blocked', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Round him', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || k.S?.carry?.why !== 'blocked') return null;
      const end = Object.values(k.S.carry.paths ?? {}).find(p => p?.length)?.at(-1) ?? k.plan?.points?.[0] ?? null;
      return { k, tier: k.tier, voice: k.voice, keys: end ? keysOf(end[0] - me.x, end[1] - me.z) : 'Z' };
    },
    act: (ctx) => actIf(ctx.k, 'drill:carry'),
    text: { 1: ["Your two's in your way. {keys} round him, or T.", "He's in your way. {keys}, round him, or T.", 'Your two blocks you. {keys} round him, or T.', "Your two's in the way. Round him: {keys}. Or T."],
      2: ["Your two's in your way. {keys} round him, or T.", 'In your way. {keys} round, or T.', 'Round him. {keys}, or T.', 'Your two. {keys} round.'], 3: ['Round him. {keys}.', '{keys}, round.', 'Round.', 'My two. Round.'] },
  },
  {
    // (the build sheet v0.0.20 item 9 (user.md U-5): your #2 held on his cue TWO_OUT_LINE_MS by you standing on his way in (bundle.js blockedCall):
    // "Your two's outside. Off his lane.", T your point (Move to your point; out of the mode, G first)
    id: 'cqb-two-out', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Off his lane', reach: null,
    when(state, me, ms) {
      // (and his walk held by you standing in a doorway, where no way round is (bundle.js gapHold's `gap` hold), inside or not)
      const k = know(state, me, ms), B = k?.R.house?.two?.block;
      if (!k || !(k.inside || B?.gap) || !B || ms - B.fromMs < TWO_OUT_LINE_MS) return null;
      return { k, tier: k.tier, voice: k.voice };
    },
    act: (ctx) => (!ctx.k.inMode ? 'stop:enter' : actIf(ctx.k, 'move:point')),
    text: { 1: ["Your two's outside. Off his lane.", "You're on his way in. Off it, to your point.", "Your two can't get in. Off his lane.", 'Off his lane. Let him in.'], 2: ["Your two's outside. Off his lane.", 'Off his lane.', 'Let him in. Your point.', "He can't get in. Move."], 3: ['Off his lane.', 'Let him in.', 'His lane.', 'Move.'] },
  },
  {
    // (the build sheet v0.0.20 item 3 (drill.md item 1; FM 3-06.11 §3-22c(9)): your point is your limit of advance: you LIMIT_WARN_MS inside your #2's
    // sector's wedge before he has swept the room (combat/two.js maskTick, H.limit): back to your point (out of the mode, G first)
    id: 'cqb-limit', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'His sector', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), L = k?.R.house?.limit;
      if (!k || !L || L.door !== k.here?.door || ms - L.fromMs < LIMIT_WARN_MS) return null;
      return { k, tier: k.tier, voice: k.voice };
    },
    act: (ctx) => (!ctx.k.inMode ? 'stop:enter' : actIf(ctx.k, 'move:point')),
    text: { 1: ["You're in his sector. Back to your point.", "That's his sector. Back to your point.", 'Out of his line. Your point.', "You're in front of his muzzle. Your point."], 2: ["You're in his sector. Your point.", 'His sector. Back.', 'Your point. Now.', 'Out of his line.'], 3: ['His sector.', 'Back.', 'Your point.', 'His line.'] },
  },
  {
    id: 'cqb-stack', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Stack', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.here || k.inside || k.stacked || k.S?.flow || (k.here.rec && k.here.rec.state && k.here.rec.state !== 'ahead' && !offStack(k)) || k.here.door === 'hall' && k.rung < 2) return null;
      const want = BUNDLE_OF_RUNG[Math.min(4, k.rung)], row = bundleRow(k, want) ?? bundleRow(k, 'stack:up');
      if (!row) return null;
      // (one room a press: the next door is always the player's (COMBAT §25.19.2; "Clear the house" withdrawn in R4))
      // (from rung 3 this is the line at the stack, the room's one press: it names your corner (corner.js; the user,
      // 2026-11-15: "there is currently no indication at to where we're supposed to be looking"); below it cqb-door does)
      const bw = bangWords(state, k, row.id);
      return { k, row: row.id, variant: `r${Math.min(4, k.rung)}${bw.tag}`, words: `r${Math.min(4, k.rung)}`, voice: k.voice, ms: (row.ms / 1000).toFixed(1), left: leftOf(k), corner: cornerOf1(k.plan, state) ?? 'left', bang: bw.bang, brief: bw.brief };
    },
    act: (ctx) => actIf(ctx.k, ctx.row),
    text: {
      r0: ['Find the wall. Stack up on the door. {ms} s.', 'Get on the wall by the door.', 'Stack up on that door.', 'To the door. On the wall.'],
      r1: ['Stack up, take point. Read the door.', 'Take point. Muzzle on the door.', 'Stack up. You\'re point.', 'You lead. Read the door, then tell your two.'],
      r2: ['Stack up, take point.', 'Take point. Read it.', 'Stack up. Point.', 'Up to the door. Point.'],
      r3: ['Clear it{bang}.{brief} {ms} s. Your corner: {corner}.', 'This room. Clear it{bang}.{brief} Your corner: {corner}.', 'Room. Clear it{bang}.{brief} Your corner: {corner}.', 'Clear the room{bang}.{brief} Your corner: {corner}.'],
      r4: ['Clear it{bang}.{brief} Your corner: {corner}.', 'Next room{bang}.{brief} Your corner: {corner}.', 'This one{bang}.{brief} Your corner: {corner}.', 'Room{bang}.{brief} Your corner: {corner}.'],
    },
  },
  {
    // (v0.0.19, the team's track: your #2 on the door on your word (team.js; TEAM 2 and 3): while his work runs, "Your two's on the
    // door. Cover it." and your entry on his work (it waits on its cue), else Wait; once the bang has gone or the door is open,
    // "Bang! Go." with the same row (below rung 2: X and the keys). It names only rows you chose: never the order itself)
    id: 'cqb-task', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: (ctx) => (ctx.variant === 'cover' ? 'His door' : 'Go'), reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), t = k?.R.house?.two?.task ?? null;
      if (!k?.choosing || !k.here || k.inside || !t || t.door !== k.here.door) return null;
      // (the review of 2026-11-16: As you were with his charge on the door, he takes it off (bundle.js taskSlot): Wait while he does,
      // off the front point first (X and the keys) where you stand on his way to it. Then, or after a task that failed, the door
      // still shut and you on the give line: back on the door (your Stack up; cqb-stack is silent once the room is 'stacked', and
      // v0.0.19's first build left the DI flipping between "Next: X" and "Keep moving" a tick at a time until the stall)
      const front = onFront(k.plan, k.me);
      if (t.st === 'belayed' || t.st === 'failed') {
        const c = twoChargeOn(state, k.plan?.door);
        // (its fuse already running: off the door until it bursts, never back onto it (the stack's blast fault))
        if (c?.live) return k.offered('wait') ? { k, id: 'wait', variant: 'live', words: 'live', voice: k.voice } : null;
        if (c) {
          const act = front ? 'leave' : 'wait';
          return k.offered(act) ? { k, id: act, variant: front ? 'room' : 'recover', words: front ? 'room' : 'recover', voice: k.voice } : null;
        }
        if (k.stacked || k.open) return null;
        const row = bundleRow(k, 'stack:point') ?? bundleRow(k, 'stack:up');
        return row ? { k, id: row.id, variant: 'restack', words: 'restack', voice: k.voice } : null;
      }
      const cue = TEAM_TASKS[t.kind === 'bang' ? 'two:bang' : `two:${t.how ?? 'pry'}`]?.cue ?? 'stepback', go = t.st === 'done' || t.done?.[cue] !== undefined;
      // (you on the front point before he has reached it: he waits on you, so the line says so; your entry on his work walks you out
      // to the give line first (bundle.js planBundle), below rung 2 X and the keys)
      const blocked = !go && (front || !!k.R.house?.two?.front) && t.done?.front === undefined;
      const row = k.rung >= 2 ? bundleRow(k, k.rung >= 3 ? 'room:clear' : 'room:in') : null;
      const act = row?.id ?? ((go || blocked) && k.rung < 2 ? 'leave' : 'wait');
      if (!k.offered(act)) return null;
      const variant = blocked ? 'room' : !go ? 'cover' : t.kind === 'bang' ? 'bang' : 'open';
      return { k, id: act, variant, words: variant, voice: k.voice };
    },
    act: (ctx) => actIf(ctx.k, ctx.id),
    text: { room: ['He needs the door. Give him room.', 'Off the door. Let him at it.', 'Give him the door.', 'Off his door.'],
      recover: ["He's taking his charge off. Wait.", 'Let him clear his charge.', 'Charge coming off. Wait.', 'Wait for him.'],
      live: ["It's lit. Stay off the door.", 'Charge is going. Wait.', 'Stay back. It blows.', 'Wait for the bang.'],
      restack: ['Your call. Back on the door.', 'Stack up again. Your door.', 'Back on the wall. Your door.', 'On the door.'],
      cover: ["Your two's on the door. Cover it.", 'Let him work. Cover the door.', "He's on it. Cover the door.", 'Cover him.'],
      bang: ['Bang! Go.', 'Bang. In.', "That's the bang. Go.", 'Go. Now.'], open: ['Open. Go.', "It's open. In.", 'Door. Go.', 'Go.'] },
  },
  {
    // (the build sheet v0.0.20 item 19 (drill.md D6): in the hall you lead your #2 by more than HALL_PAIR_M along its axis (bundle.js hallLead): the
    // pair moves together; Wait (out of the mode, G first)
    id: 'cqb-pair', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Your two', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k || k.here?.door !== 'hall') return null;
      const lead = hallLead(state);
      return lead !== null && lead > HALL_PAIR_M ? { k, tier: k.tier, voice: k.voice } : null;
    },
    act: (ctx) => (!ctx.k.inMode ? 'stop:enter' : actIf(ctx.k, 'wait')),
    text: { 1: ['Wait for your two.', "You're on your own out there. Wait for him.", 'Not without your two. Wait.', 'The pair moves together. Wait.'], 2: ['Wait for your two.', 'Wait for him.', 'Together. Wait.', 'Your two. Wait.'], 3: ['Wait for him.', 'Together.', 'My two.', 'Wait.'] },
  },

  // (the build sheet v0.0.20 item 12, §0 item 22: the last man marks the room; where that is you (your #2 gun down, on a task, or
  // still in it behind you as you leave), the DI names the row, once a room (bundle.js markYoursOf); no fault for a room unmarked)
  {
    id: 'cqb-mark', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Mark', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !markYoursOf(state) || !k.offered('mark')) return null;
      return { k, id: 'mark', variant: 'mark', words: 'mark', voice: k.voice };
    },
    act: (ctx) => actIf(ctx.k, ctx.id),
    text: { mark: ['Mark it.', "You're last out. Mark it.", 'Mark the room.', 'Mark it, then out.'] },
  },
  {
    id: 'cqb-door', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Door', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.stacked || k.open || !(k.plan?.door ?? k.plan?.hatch)) return null;
      // (a deck hatch's rows below rung 2 are its own, the dogs and then the transit (combat/drills/void.js), named in turn)
      const hatch = !k.plan.door ? k.plan.hatch : null, how = hatch ? (['undog', 'hatch'].find(h => k.offered(`door:${h}>${hatch}`)) ?? 'undog') : breachOf(state, k.plan), id = `door:${how}>${k.plan.door ?? hatch}`;
      // (from rung 2 the door is the group's first beat: "Open, in: your corner" (rung 2), "Open, clear the room" (3 and up),
      // so the corporal clears a room in three presses (COMBAT §25.19.2.3))
      const row = k.rung >= 2 ? bundleRow(k, k.rung >= 3 ? 'room:clear' : 'room:in') : null;
      // (below rung 3 this is the line at the stack: it names your corner once, the rule's (corner.js); from rung 3 cqb-stack did)
      const corner = cornerOf1(k.plan, state) ?? 'left';
      if (row) { const bw = bangWords(state, k, row.id); return { k, id: row.id, variant: `${how}${bw.tag}`, words: k.rung >= 3 ? 'clear' : 'in', voice: k.voice, corner, bang: bw.bang, brief: bw.brief }; }
      // ("Bang, then go" with the bang issued: below rung 2 the door's row is the flash's ("Flash it", the kit's single), as the
      // room's row carries it from rung 2; the push left the boot recruit and the private no word of the bang, and every one of their
      // lanes without it was a casualty (the play review of v0.0.26, finding 2). Spent, the door's own way again)
      const fr = !hatch && bangGoLane(k) && k.R.house.bangGo.bang === 'bang' ? bundleRow(k, 'door:flash') : null;
      if (fr) return { k, id: fr.id, variant: 'flash', words: 'flash', voice: k.voice, corner };
      return k.offered(id) ? { k, id, variant: how, words: how, voice: k.voice, corner } : null;
    },
    act: (ctx) => actIf(ctx.k, ctx.id),
    text: { flash: ['Flash it. Your corner: {corner}.', 'The bang first. Flash it. Your corner: {corner}.', 'Door and bang: flash it. Your corner: {corner}.', 'Flash it, then in. Your corner: {corner}.'],
      push: ['Open it. Push. Your corner: {corner}.', 'Push it open. Your corner: {corner}.', 'The door. Push. Your corner: {corner}.', 'Open it. Your corner: {corner}.'],
      pull: ['Pull it open. Your corner: {corner}.', 'It opens to you. Pull. Your corner: {corner}.', 'Pull the door. Your corner: {corner}.', 'Open it. Pull. Your corner: {corner}.'],
      kick: ['Kick it. Your corner: {corner}.', 'Locked. Kick it. Your corner: {corner}.', 'Boot the door. Your corner: {corner}.', 'Kick it in. Your corner: {corner}.'],
      undog: ['Undog it. Your face: {corner}.', 'The dogs. Your face: {corner}.', 'Undog the hatch. Your face: {corner}.', 'Dogs off. Your face: {corner}.'],
      hatch: ['Through, head first. Your face: {corner}.', 'Through it. Your face: {corner}.', 'Head first, through. Your face: {corner}.', 'Go through. Your face: {corner}.'],
      in: ['Open, in{bang}.{brief} Your corner: {corner}.', 'Open it and in{bang}.{brief} Your corner: {corner}.', 'Door, in{bang}.{brief} Your corner: {corner}.', 'Go{bang}.{brief} Your corner: {corner}.'], clear: ['Clear it{bang}.{brief} Your corner: {corner}.', 'Open, clear it{bang}.{brief} Your corner: {corner}.', 'Room. Go{bang}.{brief} Your corner: {corner}.', 'Go{bang}.{brief} Your corner: {corner}.'] },
  },
  {
    id: 'cqb-go', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'In', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.open || k.inside || !(k.plan?.door ?? k.plan?.hatch) || k.S?.carry || k.S?.flow) return null;
      // (the play review: never the walk in while a hand holds a device, cqb-hands its way out first)
      if (handDeviceOf(state, k.pid)) return null;
      // (carried FH-1: the keys along #1's path from where you stand, the legs in the variant so the words are picked
      // again when a leg changes; the act tests the words' entry, never the variant, which now carries the legs)
      if (k.rung < 2) { if (!k.offered('leave')) return null; const w = walkWords(k.plan, [me.x, me.z]); return { k, variant: `keys|${w.legs}`, words: 'keys', voice: k.voice, ...w }; }
      const row = bundleRow(k, k.rung >= 3 ? 'room:clear' : 'room:in');
      const bw = row ? bangWords(state, k, row.id) : null;
      return row ? { k, row: row.id, variant: `enter${bw.tag}`, words: 'enter', voice: k.voice, bang: bw.bang, brief: bw.brief } : null;
    },
    act: (ctx) => (ctx.words === 'keys' ? actIf(ctx.k, 'leave') : actIf(ctx.k, ctx.row)),
    // (the side is named once, at the stack (cqb-door, corner.js); here the floor's mark says it, the words only "your corner")
    text: { keys: ["X, then walk it: {keys}. Don't stop in the door.", 'X. Then the keys: {keys}.', 'Go. X, and walk it in: {keys}.', 'X, then {keys}. Your corner.'],
      enter: ['In{bang}, your corner.{brief}', 'Enter{bang}. Your corner.{brief}', 'In{bang}. Take your corner.{brief}', 'Go{bang}. Corner.{brief}'] },
  },
  {
    id: 'cqb-carryon', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Carry on', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.offered('drill:carry') || k.asking || (k.S?.carry?.why === 'two' && twoAway(state, ms))) return null;
      if (k.T && facingOf(k.T, ms) >= 0.5 && (k.T.stoppedAtMs === null || k.T.stoppedAtMs === undefined) && k.T.face !== 'noshoot') return null;
      if (upKnown(k, ms).length) return null;
      // (the words by why the drill stopped: "Down" only over a man bracketed down, as cqb-next's (the hunt of v0.0.20, breach-9: "He's
      // down. Carry on." after a charge's misfire, nobody bracketed and no round fired on the leg); the variant, so the words' entry
      // is read: 'two' was never said, instinct.js wordsOf needing one)
      const down = !!k.T && k.T.stoppedAtMs !== null && k.T.stoppedAtMs !== undefined;
      const words = k.S.carry?.why === 'two' ? 'two' : down ? k.tier : `on${k.tier}`;
      return { k, tier: k.tier, voice: k.voice, words, variant: String(words) };
    },
    act: (ctx) => actIf(ctx.k, 'drill:carry'),
    text: { 1: ['He\'s down. Carry on.', 'Down. Keep going.', 'Carry on. The room.', 'Down. Carry on.'], 2: ['Carry on.', 'Down. On.', 'Keep going.', 'On.'], 3: ['On.', 'Carry on.', 'Next.', 'Go on.'],
      on1: ['Carry on.', 'Keep going. The room.', 'Carry on. The room.', 'On with it.'], on2: ['Carry on.', 'On.', 'Keep going.', 'On with it.'], on3: ['On.', 'Carry on.', 'Next.', 'Go on.'],
      two: ["He's on you. Carry on.", 'Your two is up. Go.', 'Two\'s with you. Carry on.', 'He\'s there. Go.'] },
  },
  {
    id: 'cqb-walk', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Keep moving', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), H = k?.R.house;
      // (never once the boarding's fall back is called: cqb-back has the walk (the v0.0.27 play review, finding 3))
      if (!k || k.inMode || !H || state.time?.doing || !k.plan || H.boarding?.fallback) return null;
      if (k.inside && H.two?.block) return null;
      // (carried FH-1: on the walk in below rung 2 (the door open, not yet through) the line holds while you walk, its keys
      // re-read along #1's path as you go (walkInKey), with no wait and no stillness test; elsewhere v0.0.21's nudge)
      const walkIn = k.rung < 2 && !k.inside && k.open && !!k.plan.door;
      if (!walkIn && (Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) > 0.05 || ms - (H.stallAtMs ?? ms) < WALK_NUDGE_MS)) return null;
      // (where the walk goes: your point once in (or the door open), else your stack; its keys by the bearing)
      const to = k.inside || k.open ? k.plan.points?.[0] : k.plan.stack?.[0];
      if (!to) return null;
      const d = Math.hypot(to[0] - me.x, to[1] - me.z), where = k.inside || k.open ? (k.here?.door === 'hall' ? 'the hall\'s end' : 'your point') : 'the door';
      // (below rung 2 the walk in through an open door is the keys' (cqb-go: "X, then {keys}"): the line names them and T
      // leaves them to you, as the mode would only give X back)
      const keysOnly = k.rung < 2 && !k.inside && k.open && !!k.plan.door;
      // (the variant names the words' entry, as instinct.js wordsOf reads them only with one (since v0.0.14 this line's
      // words were empty, on the lane and off it: the review of 2026-11-16), the keys in it so the words follow the bearing)
      const keys = keysOnly ? walkWords(k.plan, [me.x, me.z]).keys : keysOf(to[0] - me.x, to[1] - me.z), words = keysOnly ? 'keys' : 'go';
      return d > 0.5 ? { k, tier: k.tier, voice: k.voice, words, variant: `${words}|${keys}`, keys, where, keysOnly } : { k, tier: k.tier, voice: k.voice, words: 'here', variant: 'here' };
    },
    act: (ctx) => (ctx.keysOnly ? null : 'stop:enter'),
    text: { go: ['Keep moving. {keys} to {where}, or G for the drill.', "Don't stand there. {keys}: {where}.", 'Move. {keys} to {where}. G for the drill.', 'On. {keys}, {where}.'],
      keys: ["{keys}. Don't stop in the door.", 'Walk it in: {keys}.', 'In: {keys}. Your corner.', 'Move: {keys}.'],
      here: ['Keep moving. G for the drill.', "Don't stand there. G, and the next row.", 'Move. G for the drill.', 'On. G.'] },
  },
  {
    id: 'cqb-dominate', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Dominate', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || k.rung !== 2 || !k.inside || k.S?.carry || k.S?.flow || ownKnown(k, ms).length) return null;
      const row = bundleRow(k, 'room:dominate');
      return row ? { k, row: row.id, tier: k.tier, voice: k.voice } : null;
    },
    act: (ctx) => actIf(ctx.k, ctx.row),
    text: { 1: ['Now your point. Dominate the room.', 'Up to your point. Sweep your sector.', 'Dominate. Point, sector, call it.', 'In deeper. Your point, then your sector.'], 2: ['Dominate.', 'Your point. Your sector.', 'Dominate the room.', 'To your point. Then your sector.'], 3: ['Dominate.', 'Point.', 'Sector.', 'Take the room.'] },
  },
  {
    id: 'cqb-hall', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'The hall', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || k.here?.door !== 'hall' || k.S?.carry || k.S?.flow || ownKnown(k, ms).length) return null;
      // (the hall's leg has no door: from rung 2 its group or the house's rest, below it the walk to its end (the fixer's of
      // 0.0.12: no rule spoke in the hall, and a sergeant by T stood at its mouth until the stall))
      const row = k.rung >= 2 ? ['room:clear', 'room:dominate', 'room:in', 'stack:point'].map(b => bundleRow(k, b)).find(Boolean) ?? null : null;
      if (row) return { k, row: row.id, variant: 'bundle', words: `b${k.tier}`, voice: k.voice };
      return k.offered('move:hallEnd') ? { k, row: 'move:hallEnd', variant: 'walk', words: `w${k.tier}`, voice: k.voice } : null;
    },
    act: (ctx) => actIf(ctx.k, ctx.row),
    text: { b1: ['The hall. Clear it to the end.', 'Last leg. The hall.', 'The hall. Down it, your sector.', 'Now the hall.'], b2: ['The hall.', 'Hall. Clear it.', 'Last leg.', 'Down the hall.'], b3: ['Hall.', 'Last leg.', 'The hall.', 'Down it.'],
      w1: ['The hall. Walk it to the end, eyes up.', 'Down the hall to its end.', 'Last leg. Walk the hall.', 'The hall. To the end.'], w2: ['The hall. To the end.', 'Down the hall.', 'Walk it.', 'Hall.'], w3: ['Hall.', 'To the end.', 'Down it.', 'The hall.'] },
  },
  {
    id: 'cqb-clear', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Clear!', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), cov = k ? coveredOf(k) : null;
      if (!k?.choosing || !(k.inside || k.here?.door === 'hall') || !cov || !k.offered('call:clear')) return null;
      if ((k.plan.hot ?? []).some(h => !cov[h.id]) || standing(k, ms, state).length) return null;
      // (the hall is clear at its end, not before: "Move to the hall's end" first (the design review of 2026-11-13: the private
      // by the keys was told "Room's done" 3.6 s before the hall's man turned))
      const hall = k.here?.door === 'hall';
      if (hall && k.offered('move:hallEnd')) return null;
      return { k, tier: k.tier, voice: k.voice, ...(hall ? { variant: 'hall', words: 'hall' } : {}) };
    },
    act: (ctx) => actIf(ctx.k, 'call:clear'),
    text: { 1: ['All of it seen. Call it. "Clear!"', 'Nobody up. Call it clear.', 'Room\'s done. "Clear!"', 'Say it. "Clear!"'], 2: ['Call it.', '"Clear!"', 'Clear. Call it.', 'Call it clear.'], 3: ['Clear.', 'Call it.', '"Clear!"', 'Done. Clear.'],
      hall: ['The hall\'s seen to its end. "Clear!"', 'End of the hall. Call it.', 'Hall\'s done. "Clear!"', 'Nobody in the hall. Call it.'] },
  },
  {
    id: 'cqb-topup', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Top up', reach: null,
    // (half or less of the fullest spare at hand too, not only of the magazine's size: the house's magazines hold ten, so at GO
    // nine in the rifle against ten in a pouch is no top-up (the integrator's list of 0.0.12: "T held: Top up" at GO))
    when(state, me, ms) { const k = know(state, me, ms); return k?.choosing && k.b && halfOrLess(k.b, state.items?.[gunOn(state, k.pid)]) && lullOf(state, k.pid, ms) && fullerAtHand(state, k.pid, gunOn(state, k.pid), k.b) && k.b.count * 2 <= bestSpare(state, k.pid) ? { k, tier: k.shotTier, voice: k.voice } : null; },
    act: (ctx) => actIf(ctx.k, 'macro:reload:tactical'),
    text: { 1: ['Quiet. Top up.', 'A lull. Fresh magazine.', 'Top it up while you can.', 'Half gone. Top up.'], 2: ['Top up.', 'Lull. Top up.', 'Fresh mag.', 'Top up now.'], 3: ['Top up.', 'Mag.', 'Fresh one.', 'Top up.'] },
  },
  {
    id: 'cqb-next', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'calm', short: 'Next', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || k.asking || upKnown(k, ms).length) return null;
      // (never over a man bracketed up and facing, the hostage card among them: his own line, his shot (as cqb-carryon))
      if (k.T && facingOf(k.T, ms) >= 0.5 && (k.T.stoppedAtMs === null || k.T.stoppedAtMs === undefined) && k.T.face !== 'noshoot') return null;
      const cov = coveredOf(k), look = k.inside && cov ? (k.plan?.hot ?? []).find(h => !cov[h.id] && k.offered(`look:${h.id}`)) : null;
      // (a corner not yet seen by hotRow, cqb-corner's and hisNext's one rule: the far leg's walk while it is offered, never its look
      // from the near leg (the hunt of v0.0.20, breach-1: after Enter in room 3 T pressed "Look: the far leg" 452 times, nothing
      // covered, the leg passed on time))
      const id = firstOf(k, ['drill:carry', 'move:point', look ? hotRow(k, look) : null, 'call:clear', 'move:hallEnd', 'leave']);
      if (!id) return null;
      const row = k.steps.find(x => x.id === id), down = !!k.T && k.T.stoppedAtMs !== null && k.T.stoppedAtMs !== undefined;
      // (carried FH-1: the walk in named by its keys along #1's path from where you stand, as cqb-go names them)
      const what = id === 'leave' ? `X, then ${k.plan?.door && k.open && !k.inside ? walkWords(k.plan, [me.x, me.z]).keys : 'the keys'}` : String(row?.label ?? id).replace(/\.$/, '');
      // (the variant, so the words' entry is read (empty since v0.0.14: instinct.js wordsOf needs one), the row in it so
      // the words follow it)
      return { k, id, tier: k.tier, voice: k.voice, what, words: down ? 'down' : 'on', variant: `${down ? 'down' : 'on'}|${id}${id === 'leave' ? `|${what}` : ''}` };
    },
    act: (ctx) => actIf(ctx.k, ctx.id),
    text: { down: ['Down. Next: {what}.', 'Down. {what}.', "He's down. {what}.", 'Down. On: {what}.'], on: ['Next: {what}.', 'On: {what}.', '{what}.', 'Keep it going: {what}.'] },
  },
].map(r => Object.freeze({ ...r, voice: (ctx) => ctx?.voice ?? 'di' })));
