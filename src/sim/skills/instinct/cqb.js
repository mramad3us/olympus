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
//                         4 "Open, clear the room" (one room a press: "Clear the house" withdrawn in the rework's R4)
//   cqb-door      note    stacked, the door shut: below rung 2 its row by the swing (Open the door: push or pull), Kick door
//                         where locked; from rung 2 the group the door begins: "Open, in: your corner" (2), "Open, clear the
//                         room" (3 and 4)
//   cqb-go        note    the door open, not in: rungs 0 and 1 **X go**, the panel's "go: the clock runs, the keys move
//                         you" row ('leave'), the walk's keycaps in the words (the AZERTY keys of the bearing from the
//                         stack to your point, your corner's side as seen from the stack: the plan's, each room's own),
//                         never the feet (the build sheet's §8 item 9:
//                         the user's "then would move in using movement keys (game unpaused with X)"); rung 2 Enter and
//                         clear your corner; 3 and 4 the room's bundle
//   cqb-funnel    warn    standing in the doorway (room.js inFunnel, still): from rung 2 Enter; below it, once past the
//                         threshold Move to your point, else "Out of the door. Keys, in." and X, as cqb-go (the fixer's of
//                         0.0.12: the same advice did nothing on T in the doorway and X at the open door)
//   cqb-flag      urgent  the muzzle's 3-D line across the #2's body within FLAG_REACH_M 5 m, the rifle in hand and neither
//                         at high ready nor at low ready (carry.js flagsAt, the house's fault's rule too): Low ready, "Muzzle
//                         down." (COMBAT §25.19.3.5, from R4; high ready where the low is not offered)
//   cqb-contact   urgent  a threat he took in still up and facing in the room, at the pause or after it (every man of the
//                         room he identified, at any of his pauses: the scene's record keeps each, his own corner's first):
//                         below rung 2 Off safe, then Aim (T aims); from rung 2 the row's name and no act ("Rifle. Pair.");
//                         the bracket on another man (a second contact's, a reflex's, a no-shoot): the aim onto him, at
//                         every rung (the fixer's of 0.0.12: the line went quiet, or said "No shot" with a threat up),
//                         and only onto a man in the rifle's frame: none of his in it (hidden by a jamb), "In." and
//                         Carry on (2026-11-12); from rung 2 with every shot row struck (one round left): Aim (T aims), then Press (Fire), as
//                         below rung 2; none at all (the bolt locked on an empty): quiet, cqb-reload leads (2026-11-11)
//   cqb-hostage   urgent  the hostage card bracketed: "Hostage. Head only, or hold.": the aim if not aimed, below rung 2; from
//                         rung 2 To the head's aim is inside it, so the line names the row and T leaves the shot to you (R3)
//   cqb-noshoot   warn    identified with empty hands or a phone: "Hands. No weapon. Don't." No act, at the pause only; with a
//                         halted bundle to carry on and nobody up, "No shot. Carry on." and T carries on
//   cqb-still-up  urgent  "He's still up" (specials.js stillUp) on a threat or the armoured, never a no-shoot or the hostage: To
//                         the head's name, the aim if not aimed below rung 2 (from rung 2 the row's own aim, as cqb-hostage)
//   cqb-locked    warn    the door's push or pull struck "locked", or a bundle handed back 'refused': an inner door Hold it,
//                         the lane's door Kick it ("Locked. Kick it."; a door that held a kick but is not locked: "It held.
//                         Kick it again."; never "hold it" at a lane door, which has no Hold it row)
//   cqb-unplanned warn    a bundle handed back 'door-unplanned': Hold it ("Door, east wall. Hold it or clear it?")
//   cqb-two       warn    a bundle handed back 'two' and your #2 still over TWO_SLOT_M from his slot: Wait
//   cqb-carryon   note    a bundle halted and nothing standing to answer (the 'two' hand-back once he is in place): Carry on
//   cqb-dominate  note    rung 2 in the room, nobody of it up and Dominate offered: Dominate (the corporal's next group)
//   cqb-corner    warn    rungs 0 and 1, in the room, a hot spot the scene has not seen covered: a Look at it; the far leg
//                         (a plan's `far`) not yet in view: "Move: the far leg" first (0.0.12's integration)
//   cqb-hall      note    the hall's leg (no door): from rung 2 its bundle (the house's rest, the room's, Dominate, Enter), below
//                         it Move to the hall's end
//   cqb-clear     note    in the room (or the hall), every hot spot covered (the scene's record) and nobody standing: "Clear!"
//   cqb-reload    warn    the bolt believed locked on an empty: RELOAD
//   cqb-topup     note    a lull with the magazine believed at half or less, of its own load and of the fullest spare at hand: Top up
//   cqb-stoppage  urgent  a stoppage believed: IMMEDIATE ACTION; at the reflex card, its first answer (R4: T did nothing there);
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
//                         cqb-reload names Transition first where the panel offers it (a man within 10 m, the pistol holstered)
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
import { sparesOf, believedN } from '../../arms/kit.js';
import { facingOf } from '../../arms/turners.js';
import { contactNow, lullOf, IDENT_WORDS } from '../../combat/contact.js';
import { takeInWords } from '../../combat/react.js';
import { doorNow, swingOf, lockedOf, twoAway, innerWall, HANDBACK_WORDS } from '../../combat/bundle.js';
import { inFunnel, pastThreshold } from '../../combat/room.js';
import { rungOf, valueOf } from '../templates.js';
import { openingState } from '../../places/model.js';
import { keysFor, layoutIn } from '../../arms/groups.js';

/** The house's rules repeat as each case comes (the door, the room, the contact are each new advice). */
export const CQB_REPEAT_MS = 0;
/** Out of the mode, the feet still and nothing of the lane done this long before cqb-walk speaks (ms; my call: two walk cycles' thought, well under the instructor's STALL_MS). */
export const WALK_NUDGE_MS = 3000;
/** Words tiered by a skill: under TIER_2 tier 1, under TIER_3 tier 2, else 3 (SKILLS §14.3 rule 5). */
export const TIER_2 = 8, TIER_3 = 20;
const tierOf = (v) => (v < TIER_2 ? 1 : v < TIER_3 ? 2 : 3);
const NOSHOOT = new Set(['hands', 'phone']);
const HOLD = Object.freeze({ rifle: 'Rifle', pistol: 'Pistol' });

// (what the character knows in the house now, kept for the tick and the panel)
let memo = { state: null, key: null, v: null };
function know(state, me, ms) {
  const S = state.stop, R = state.armoury?.range;
  // (what a row chosen at no time changes is in the key too: the variant, the held door, the carry's beats (the fixer's of
  // 0.0.12: "Hold it" chosen at the same instant left the line offering it again, and T pressed it for ever))
  const H = state.armoury?.range?.house;
  const key = `${ms}|${state.clock.tick ?? ''}|${S ? `${S.mode}|${S.phase}|${S.gun ?? ''}|${H?.two?.down ? 'd' : ''}${H?.two?.coveredBy ? 'c' : ''}|${S.doing?.step ?? ''}|${S.pick ?? ''}|${S.aim?.key ?? ''}|${S.carry?.why ?? ''}|${S.carry?.beats?.length ?? ''}|${S.flow ? (S.flow.suspended ? 's' : 'f') : ''}|${JSON.stringify(S.variant ?? null)}|${S.reflex ? 'r' : ''}` : ''}|${me ? `${me.x}|${me.z}|${me.headRad ?? ''}|${me.watch?.hotId ?? ''}` : ''}|${contactNow(state, ms)?.last?.id ?? ''}|${H?.two?.hold ?? ''}|${H?.goAtMs ?? ''}|${H?.end ? 'e' : ''}|${H?.cur ?? ''}|${state.armoury?.range?.cmd?.id ?? ''}|${state.people?.[state.player?.id]?.kit?.carry?.posture ?? ''}`;
  if (memo.state === state && memo.key === key) return memo.v;
  let v = null;
  const live = R?.course !== 'house' || (R.house?.goAtMs !== null && R.house?.goAtMs !== undefined && !R.house?.end);
  if (R && !R.end && live && inHouse(state) && me) {
    const pid = playerId(state), here = doorNow(state, pid), gunId = gunOn(state, pid), b = gunId ? beliefOf(state, gunId) : null;
    const choosing = S?.mode === 'stop' && S.phase === 'choose' && !S.reflex;
    const steps = choosing ? stepsOf(state, ms) : [];
    const offered = (id) => steps.find(s => s.id === id && !s.off) ?? null;
    const rung = rungOf(state, pid, 'room'), last = contactNow(state, ms)?.last ?? null;
    const plan = here?.plan ?? null, inside = plan ? pastThreshold(plan, me.x, me.z) : false;
    const open = plan?.door ? openingState(state, plan.door) === 'open' : true;
    const stacked = !!plan && Math.hypot(me.x - plan.stack[0][0], me.z - plan.stack[0][1]) <= 0.3;
    const T = S?.pick ? (R.turners ?? []).find(t => t.key === S.pick) ?? null : null;
    // (a bundle's question still standing (shooting.js ASKS): "Hold it or clear it?" is answered once every inner door of the
    // room is open or held by the #2, so Carry on is the line's again (2026-11-12: the Raider by T on seeds 5 and 7 held room
    // 2's closet at the ask, and the ask stood, no line and T idle for the rest of the lane); a locked lane door's until open)
    const why = S?.carry?.why ?? null, asking = ASKS.has(why) && (why === 'door-unplanned' ? (plan?.inner ?? []).some(id => openingState(state, id) !== 'open' && R.house?.two?.hold !== id) : true);
    v = { R, pid, here, plan, b, S, steps, offered, choosing, rung, last, inside, open, stacked, T, asking, inMode: S?.mode === 'stop', me,
      tier: tierOf(valueOf(state, pid, 'tactics')), shotTier: tierOf(valueOf(state, pid, 'marksmanship')), voice: rung >= 3 ? 'self' : 'di', posture: state.people?.[pid]?.kit?.carry?.posture ?? 'slungFront' };
  }
  memo = { state, key, v };
  return v;
}
// (an act only when its row is in the panel now: 'stop:<row id>')
const actIf = (k, id) => (k?.choosing && id && k.offered(id) ? `stop:${id}` : null);
// (the first row offered of a list of ids)
const firstOf = (k, ids) => ids.find(id => id && k.offered(id)) ?? null;
// (the room's threats standing and facing that you know of (taken in, not forgotten: contact.js's known), never one nobody
// has seen (the reach review of 2026-11-13: the DI kept "Clear!" back while a man behind you, unseen, stood))
const standing = (k, ms, state) => { const c = state?.mind?.contact, known = c?.known ?? {}, last = c?.last?.ids ?? [];
  return (k.R.turners ?? []).filter(t => t.room === k.plan?.room && t.face !== 'noshoot' && t.face !== 'hostage' && facingOf(t, ms) >= 0.5 && (t.stoppedAtMs === null || t.stoppedAtMs === undefined)
    && (known[t.key] !== undefined || last.includes(t.key))); };
// (what you know of the room's men up and facing now: each you identified armed, at the last pause or an earlier one (the
// scene's record keeps every pause's identification), the hostage aside (cqb-hostage's); your own corner's first, then the
// nearest (the fixer's of 0.0.12: a second contact replaced the last, and the DI forgot the first man still up))
function upKnown(k, ms) {
  const contacts = k.here?.rec?.contacts ?? [];
  const identOf = (key) => (k.last?.ids?.includes(key) && k.last.ident?.[key] !== 'unseen' ? k.last.ident[key] : contacts.filter(c => c.key === key && c.by === 'me' && c.ident).at(-1)?.ident ?? null);
  const out = [];
  for (const T of k.R.turners ?? []) {
    if (T.room !== k.plan?.room || T.face === 'hostage' || (T.stoppedAtMs !== null && T.stoppedAtMs !== undefined) || facingOf(T, ms) < 0.5) continue;
    const hold = identOf(T.key);
    if (HOLD[hold]) out.push({ T, hold });
  }
  const me = k.me;
  return out.sort((a, b) => (a.T.slot ?? 1) - (b.T.slot ?? 1) || Math.hypot(a.T.x - me.x, a.T.z - me.z) - Math.hypot(b.T.x - me.x, b.T.z - me.z) || a.T.key.localeCompare(b.T.key));
}
// (the men of your own corner of upKnown: with a #2 his corner's men are his (the room's next row is yours to take: 2026-11-12, R3))
const ownKnown = (k, ms) => { const up = upKnown(k, ms); return k.R.house?.twoPid ? up.filter(u => (u.T.slot ?? 1) === 1) : up; };
// (a man of your own corner up and facing whose hands you have not seen at the last pause: { key } or null)
function handsUnseen(k, ms) {
  for (const key of k.last?.ids ?? []) {
    const T = (k.R.turners ?? []).find(t => t.key === key);
    if (!T || T.room !== k.plan?.room || (T.slot ?? 1) !== 1 || T.face === 'hostage' || (T.stoppedAtMs !== null && T.stoppedAtMs !== undefined) || facingOf(T, ms) < 0.5) continue;
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
// (the bundle row a rung's T takes at the door: the rung's own (see the header))
const BUNDLE_OF_RUNG = Object.freeze(['stack:up', 'stack:point', 'stack:point', 'room:clear', 'room:clear']);
// (the rooms left of the lane in words, the current one with them: "Two rooms and the hall")
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
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
/** The walk in by the keys in words, from a room's plan: { keys, side } (the bearing from #1's stack to his point; his point's side of the stack's line to the threshold, as seen from the stack). */
export function walkWords(plan) {
  const st = plan?.stack?.[0], pt = plan?.points?.[0], th = plan?.threshold ?? pt;
  if (!st || !pt || !th) return { keys: 'Z', side: 'left' };
  const fx = th[0] - st[0], fz = th[1] - st[1], dx = pt[0] - th[0], dz = pt[1] - th[1];
  // (left of a facing f, x east and z south: (f.z, -f.x), as bundle.js hotName reads it)
  const side = dx * fz - dz * fx > 0 ? 'left' : 'right';
  return { keys: keysOf(pt[0] - st[0], pt[1] - st[1]), side };
}
// (To the head offered live on the bracketed man: from rung 2 its aim is inside it, so the line names it and T leaves it (2026-11-12, R3))
const headRow = (k) => k.steps.find(s => s.id.startsWith('shot:head') && !s.off && (s.target ?? k.T?.key) === k.T?.key) ?? null;
const headLive = (k) => !!headRow(k);
// (the keys of To the head on the panel drawn (groups.js keysFor, the layout played), named by the line from rung 2, where T
// leaves the shot to you (the design review of 2026-11-13: after Transition "Head." named no key, the row at Tab › 1 › 5))
const headKeys = (state, k) => { const r = k.rung >= 2 ? headRow(k) : null; return r ? keysFor(k.steps, r.id, { layout: layoutIn(state) }).text : null; };
const bundleRow = (k, bundle) => k.steps.find(s => s.id.startsWith(`drill:${bundle}`) && s.id.endsWith(`>${k.here.door}`) && !s.off) ?? null;

// ---- the stop's why (COMBAT §25.19.4: "every stop says why in the line's lead") ----

/** A row's group done, below the rung that runs the room whole: the seam's words ("Done: stacked."). */
const DONE_WORDS = Object.freeze({ 'stack:up': 'stacked', 'stack:point': 'stacked, the door read', 'room:in': 'in, your corner', 'room:dominate': 'your sector' });
// (the lane's leg after a door, in words, and how far its stack is from you: "room 2, 6.2 m", "the hall, 4.0 m")
function nextWords(state, R, me) {
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
  const S = state.stop, R = state.armoury?.range, H = R?.house;
  if (!S || S.mode !== 'stop' || R?.course !== 'house' || !H || H.goAtMs === null || H.goAtMs === undefined || !inHouse(state)) return null;
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
  if (cleared && cleared.clearAtMs >= S.last.atMs && !stackedNext) { const n = nextWords(state, R, me); return n ? `${cleared.door === 'hall' ? 'Hall' : 'Room'} clear. Next: ${n}.` : 'Clear.'; }
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

/** The DI's close-quarters rules (see the header), most pressing first within a tone. */
export const CQB_RULES = Object.freeze([
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
      const first = k.S?.reflex?.options?.[0]?.key ?? null;
      return { k, tier: k.shotTier, ...(['gundown', 'transition', 'offline'].includes(first) ? { variant: first, words: first } : {}) };
    },
    // (at the reflex card its first answer, the card's own order (COMBAT §25.19.6: "cqb-stoppage's act is the card's first
    // answer"; R4's dead-end rule: with the card up no row is offered, and T did nothing at every click: 400 in 400 lanes))
    // (the rework's R6: with no drill row offered (the rifle hanging after a fumbled draw), the weapon group's answers, then the rifle up)
    act: (ctx) => (ctx.k.S?.reflex?.options?.length ? `stop:reflex:${ctx.k.S.reflex.options[0].key}` : actIf(ctx.k, firstOf(ctx.k, ['macro:ia', 'macro:remedial', 'weapon:transition', 'weapon:gun-down', 'weapon:offline', 'up']))),
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
      if (!k?.choosing || !k.T || (k.T.face !== 'threat' && k.T.face !== 'armoured') || !stillUp(state, k.T.key) || facingOf(k.T, ms) < 0.5) return null;
      const key = headKeys(state, k);
      return key ? { k, tier: k.shotTier, voice: k.voice, key, variant: `key${key}`, words: 'key' } : { k, tier: k.shotTier, voice: k.voice };
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
      if (!(k?.choosing && k.T?.face === 'hostage' && (k.T.stoppedAtMs === null || k.T.stoppedAtMs === undefined) && facingOf(k.T, ms) >= 0.5)) return null;
      const key = headKeys(state, k);
      return key ? { k, tier: k.shotTier, voice: k.voice, key, variant: `key${key}`, words: 'key' } : { k, tier: k.shotTier, voice: k.voice };
    },
    act: (ctx) => (ctx.k.S.aim?.key === ctx.k.T.key || (ctx.k.rung >= 2 && headLive(ctx.k)) ? null : actIf(ctx.k, 'aim')),
    text: { 1: ['Hostage. Head only, or hold.', 'He\'s got a hostage. Head, or hold.', 'Hostage. Nothing but the head.', 'Hostage. Head shot or no shot.'], 2: ['Hostage. Head only, or hold.', 'Head only. Or hold.', 'Hostage. Head or nothing.', 'Head only.'], 3: ['Head only.', 'Hostage. Head.', 'Head, or hold.', 'Head or nothing.'],
      key: ['Hostage. Head only, {key}, or hold.', 'Head only: {key}. Or hold.', 'Hostage. Head or nothing: {key}.', 'Head only: {key}.'] },
  },
  {
    id: 'cqb-contact', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'urgent', short: 'Aim', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.plan) return null;
      const all = upKnown(k, ms), twoPid = k.R.house?.twoPid ?? null;
      // (with a #2, his corner's men are his: yours first; a man of yours whose hands you have not seen comes before his)
      const up = twoPid ? all.filter(u => (u.T.slot ?? 1) === 1) : all;
      if (!up.length) {
        const hands = handsUnseen(k, ms);
        if (hands && k.T?.key === hands.key && k.offered('contact:challenge')) return { k, variant: 'hands', words: `hands${k.shotTier}`, key: hands.key, voice: k.voice };
        // (a man of your #2's corner up and facing whose hands you did not see: his all the same, "Carry on" yours (2026-11-12, R3:
        // the tier one by T on seed 3405, room 3's 3a unseen at the pause, no line and the honest T's Wait for the stall))
        if (!hands && !all.length && twoPid) {
          const his = (k.last?.ids ?? []).map(key => (k.R.turners ?? []).find(t => t.key === key)).find(T => T && (T.slot ?? 1) === 2 && T.room === k.plan?.room && T.face !== 'hostage' && T.face !== 'noshoot' && (T.stoppedAtMs === null || T.stoppedAtMs === undefined) && facingOf(T, ms) >= 0.5);
          if (his && k.offered('drill:carry')) return { k, variant: 'his', words: 'hisU', who: his.name ?? 'him', Who: cap(his.name ?? 'him'), voice: k.voice };
        }
        if (hands || !all.length) return null;
        // (his man and nothing of yours to carry on: the room's own next row speaks (the corporal's Dominate), never a line with no
        // act over it (2026-11-12, R3: the corporal by T, room 3's 3a up for his #2 after "In, your corner", on 51 of 100 seeds))
        if (!k.offered('drill:carry')) return null;
        return { k, variant: 'his', words: 'his', hold: HOLD[all[0].hold], Hold: HOLD[all[0].hold], who: all[0].T.name ?? 'him', Who: cap(all[0].T.name ?? 'him'), voice: k.voice };
      }
      // (the man bracketed if he is one of them (and not still up: cqb-still-up's), else the first of them: the aim onto him)
      // (the aim goes onto a man in the rifle's frame (shooting.js targetsOf: a clear line to him); one taken in from the
      // stack and hidden now by the jamb is not aimable, and "On him." with T pressing an aim that could not be taken was a
      // dead end (the shoot house's rework, R1, 2026-11-12: the Raider by T on 48213, 5 and 7, room 1, stopped in the door's
      // outer middle with 1a behind the hinge-side jamb): another of his men who is in the frame, else "In." and Carry on,
      // the feet into the room where he is seen)
      const inFrame = (u) => !!targetOf(state, u.T.key, k.pid);
      const on = up.find(u => u.T.key === k.T?.key) ?? null, U = on ?? up.find(inFrame) ?? up[0];
      if (on && stillUp(state, on.T.key)) return null;
      const aimed = k.S.aim?.key === U.T.key;
      let variant = !on ? (inFrame(U) ? 'onto' : 'move') : k.rung < 2 ? (k.b?.mode === 'safe' ? 'safe' : aimed ? 'press' : 'aim') : 'row';
      // ("Pair." only while a shot row is there to take: with one round left they are all struck ("one left"), and with the
      // bolt locked on an empty so is Fire; the line, with no act, held the lead for the rest of the lane and T did nothing
      // (the bugs auditor of 2026-11-11: the tier one by T in the hall on seeds 7 and 1489397426, the lane ended by time).
      // So the one round as the rung below takes it, Aim then Press (the Fire row), and with none, nothing here:
      // cqb-reload's "Reload." leads)
      if (variant === 'row' && !k.steps.some(s => s.id.startsWith('shot:') && !s.off)) {
        if (!aimed && k.offered('aim')) variant = 'aim';
        else if (aimed && k.offered('fire')) variant = 'press';
        else return null;
      }
      return { k, variant, words: variant === 'onto' ? `onto${k.shotTier}` : `${variant}${k.shotTier}`, hold: HOLD[U.hold], Hold: HOLD[U.hold], key: U.T.key, who: U.T.name ?? 'him', Who: cap(U.T.name ?? 'him'), voice: k.voice };
    },
    act: (ctx) => (ctx.variant === 'safe' ? actIf(ctx.k, 'selector:semi') : ctx.variant === 'aim' || ctx.variant === 'onto' ? aimOnto(ctx.k, ctx.key)
      : ctx.variant === 'hands' ? actIf(ctx.k, 'contact:challenge') : (ctx.variant === 'his' || ctx.variant === 'move') && !ctx.k.asking ? actIf(ctx.k, 'drill:carry') : null),
    text: {
      safe1: ['{hold}. Off safe. Then aim.', '{hold}. Thumb it off first.', '{hold}. Safe off, then aim.', '{hold}. Off safe.'], safe2: ['{hold}. Off safe.', '{hold}. Thumb off.', 'Off safe.', '{hold}. Safe off.'], safe3: ['Off safe.', '{hold}. Off.', 'Thumb.', 'Safe off.'],
      aim1: ['{hold}. Aim. Then press.', '{hold}, in the room. Aim at him.', '{hold}. Get on him.', '{hold}. Aim first.'], aim2: ['{hold}. Aim.', 'On him.', '{hold}. On him.', 'Aim.'], aim3: ['On him.', 'Aim.', '{hold}.', 'Him.'],
      press1: ['Press.', 'Now press.', 'You\'re on him. Press.', 'Press it.'], press2: ['Press.', 'Now.', 'Fire.', 'Press.'], press3: ['Press.', 'Now.', 'Fire.', 'Go.'],
      row1: ['{hold}. Pair.', '{hold}. Two in him.', '{hold}. Pair him.', '{hold}. Pair.'], row2: ['{hold}. Pair.', 'Pair.', '{hold}. Two in him.', 'Pair him.'], row3: ['Pair.', '{hold}. Pair.', 'Two in him.', 'Pair.'],
      move1: ['{hold}, inside. Get in and on him.', '{hold} in there. Move in to him.', 'In. {hold}, inside.', "Get in. He's in there."], move2: ['{hold}. In.', 'Get in.', 'In. On him.', 'In.'], move3: ['In.', 'Move.', 'Get in.', 'In.'],
      hands1: ["Can't see his hands. Challenge him.", 'Hands? Make him show you.', 'His hands. Challenge.', 'Show me your hands. Say it.'], hands2: ['Hands. Challenge.', 'Challenge him.', 'Hands?', 'Challenge.'], hands3: ['Hands.', 'Challenge.', 'Hands?', 'Show me.'],
      his: ["{Hold}, {who}: your two's. Your corner.", "{Who}'s your two's. Trust him.", "That one's his. Carry on.", "Your two's man. Leave him to him."],
      hisU: ["{Who}: your two's. Your corner.", "{Who}'s your two's. Carry on.", "That one's his. Carry on.", "Your two's man. Leave him to him."],
      onto1: ["{Hold}'s still up: {who}. Get on him.", '{hold} up, {who}. On him.', "He's still in the fight: {who}. Aim.", '{Who}. Still up. On him.'], onto2: ['{Who}. On him.', '{hold}, still up. On him.', 'Still one up. On him.', '{Who}. Up.'], onto3: ['{Who}.', 'One up.', 'Him.', 'Still up.'],
    },
  },
  {
    // (the rework's R6, COMBAT §25.19.6: the pistol out and nobody of yours facing: holster it, the rifle up and cleared)
    id: 'cqb-rifle-up', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Rifle up', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.offered('weapon:rifle-up') || (k.T && facingOf(k.T, ms) >= 0.5 && (k.T.stoppedAtMs === null || k.T.stoppedAtMs === undefined) && k.T.face !== 'noshoot')) return null;
      return upKnown(k, ms).length ? null : { k, tier: k.tier, voice: k.voice };
    },
    act: (ctx) => actIf(ctx.k, 'weapon:rifle-up'),
    text: { 1: ["He's down. Rifle up.", 'Pistol away. Rifle up.', 'Holster it. Clear the rifle.', 'Down. Rifle back up.'], 2: ['Rifle up.', 'Holster. Rifle.', 'Pistol away. Rifle.', 'Rifle back.'], 3: ['Rifle.', 'Rifle up.', 'Holster.', 'Rifle back.'] },
  },
  {
    id: 'cqb-noshoot', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'No shot', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.T || !k.last?.ids?.includes(k.T.key) || !NOSHOOT.has(k.last.ident?.[k.T.key]) || facingOf(k.T, ms) < 0.5) return null;
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
      const inner = (k.plan?.inner ?? []).includes(id), held = !inner && !lockedOf(state, id);
      // (an inner door already held is answered: no line (the fixer's of 0.0.12: "Locked. Leave it held." over a held door))
      if (inner && k.R.house?.two?.hold === id) return null;
      return { k, id, variant: inner ? 'hold' : 'kick', words: inner ? 'hold' : held ? 'again' : 'kick', voice: k.voice };
    },
    act: (ctx) => actIf(ctx.k, ctx.variant === 'hold' ? `door:hold>${ctx.id}` : `door:kick>${ctx.id}`),
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
    when(state, me, ms) { const k = know(state, me, ms); return k?.choosing && k.S?.carry?.why === 'two' && twoAway(state, ms) ? { k, tier: k.tier, voice: k.voice } : null; },
    act: (ctx) => actIf(ctx.k, 'wait'),
    text: { 1: ["Your number two's not with you. Wait for him.", 'Where\'s your two? Wait.', 'Not without your two. Wait.', 'Your two isn\'t stacked. Wait.'], 2: ["Your two's not with you. Wait.", 'Wait for your two.', 'Two\'s not up. Wait.', 'Wait for him.'], 3: ['Wait for him.', 'My two.', 'Wait.', 'Not yet.'] },
  },
  {
    id: 'cqb-reload', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'RELOAD', reach: null,
    when(state, me, ms) { const k = know(state, me, ms); return k?.inMode && k.b?.locked && k.b.mag === 'in' ? { k, tier: k.shotTier, voice: k.voice } : null; },
    // (the rework's R6: with the P-12 in the holster and a man within 10 m, Transition first (COMBAT §25.19.6's DI))
    act: (ctx) => actIf(ctx.k, firstOf(ctx.k, ['weapon:transition', 'macro:reload:speed', 'macro:reload:retain'])),
    text: { 1: ['Empty. Reload.', 'Bolt\'s back. RELOAD.', 'Dry. Reload it.', 'Empty. Magazine.'], 2: ['Empty. Reload.', 'Reload.', 'Dry. Reload.', 'Mag.'], 3: ['Reload.', 'Mag.', 'Empty.', 'Reload.'] },
  },
  {
    id: 'cqb-funnel', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Out of the door', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.plan?.door || !inFunnel(k.plan, me.x, me.z) || Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) > 0.05 || k.S?.doing) return null;
      const variant = k.rung >= 2 ? 'enter' : k.inside ? 'point' : 'keys';
      return { k, variant, words: variant, voice: k.voice };
    },
    // (in: the room's bundle where it is offered, else the halted bundle's Carry on, else your point; never a line naming nothing
    // (the rework's R2: a tier one braked to a stop in room 2's doorway at the closet's Hold it, the room's bundle not offered
    // inside it, and T waited 90 s: the stopped body had kept its speed before, so the line never came))
    act: (ctx) => (ctx.variant === 'enter' ? actIf(ctx.k, bundleRow(ctx.k, ctx.k.rung >= 3 ? 'room:clear' : 'room:in')?.id ?? null) ?? actIf(ctx.k, 'drill:carry') ?? actIf(ctx.k, bundleRow(ctx.k, 'room:dominate')?.id ?? null) ?? actIf(ctx.k, 'move:point') : ctx.variant === 'point' ? actIf(ctx.k, 'move:point') : actIf(ctx.k, 'leave')),
    text: { enter: ['Out of the door. In.', 'You\'re in the door. Go.', 'Don\'t stop in the door. In.', 'Doorway. Move.'], point: ['Out of the door. Your point.', 'Off the door. To your point.', 'Not in the door. Your point.', 'Move. Your point.'],
      keys: ['Out of the door. X, then keys, in.', "You're a target in the door. X, and in.", "Don't stand in the door. X, then the keys.", 'Out of the door. X, in, with the keys.'] },
  },
  {
    id: 'cqb-corner', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'warn', short: 'Your corner', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), cov = k ? coveredOf(k) : null;
      if (!k?.choosing || k.rung >= 2 || !k.inside || !cov || upKnown(k, ms).length) return null;
      const h = (k.plan.hot ?? []).find(x => !cov[x.id] && k.offered(`look:${x.id}`));
      if (!h) return null;
      // (the far leg is not seen from the near one: the walk up to it first, then the look)
      const variant = h.why === 'far leg' && k.offered('move:far') ? 'far' : h.why === 'behind the door' ? 'door' : 'corner';
      return { k, hot: h.id, variant, words: variant, voice: k.voice };
    },
    act: (ctx) => actIf(ctx.k, ctx.variant === 'far' ? 'move:far' : `look:${ctx.hot}`),
    text: { door: ['Behind the door. Check it.', 'The door. Look behind it.', 'Behind the door.', 'Check behind the door.'], corner: ['Your corner. Look.', 'That corner. Check it.', 'Corner. Look at it.', 'You didn\'t look there.'],
      far: ['The far leg. Walk up and look.', 'Round the bend. Go and see it.', 'There\'s more room past the bend. Walk it.', 'The far leg. You can\'t see it from here.'] },
  },
  {
    id: 'cqb-stack', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Stack', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.here || k.inside || k.stacked || k.S?.flow || (k.here.rec && k.here.rec.state && k.here.rec.state !== 'ahead') || k.here.door === 'hall' && k.rung < 2) return null;
      const want = BUNDLE_OF_RUNG[Math.min(4, k.rung)], row = bundleRow(k, want) ?? bundleRow(k, 'stack:up');
      if (!row) return null;
      // (one room a press: the next door is always the player's (COMBAT §25.19.2; "Clear the house" withdrawn in R4))
      return { k, row: row.id, variant: `r${Math.min(4, k.rung)}`, words: `r${Math.min(4, k.rung)}`, voice: k.voice, ms: (row.ms / 1000).toFixed(1), left: leftOf(k) };
    },
    act: (ctx) => actIf(ctx.k, ctx.row),
    text: {
      r0: ['Find the wall. Stack up on the door. {ms} s.', 'Get on the wall by the door.', 'Stack up on that door.', 'To the door. On the wall.'],
      r1: ['Stack up, take point. Read the door.', 'Take point. Muzzle on the door.', 'Stack up. You\'re point.', 'Point. Read it, tell your two.'],
      r2: ['Stack up, take point.', 'Take point. Read it.', 'Stack up. Point.', 'Up to the door. Point.'],
      r3: ['Clear it. {ms} s.', 'This room. Clear it.', 'Room. Clear it.', 'Clear the room.'],
      r4: ['Clear it.', 'Next room.', 'This one. Clear it.', 'Room.'],
    },
  },
  {
    id: 'cqb-door', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Door', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.stacked || k.open || !k.plan?.door) return null;
      const how = lockedOf(state, k.plan.door) ? 'kick' : swingOf(state, k.plan) ?? 'push', id = `door:${how}>${k.plan.door}`;
      // (from rung 2 the door is the group's first beat: "Open, in: your corner" (rung 2), "Open, clear the room" (3 and up),
      // so the corporal clears a room in three presses (COMBAT §25.19.2.3))
      const row = k.rung >= 2 ? bundleRow(k, k.rung >= 3 ? 'room:clear' : 'room:in') : null;
      if (row) return { k, id: row.id, variant: how, words: k.rung >= 3 ? 'clear' : 'in', voice: k.voice };
      return k.offered(id) ? { k, id, variant: how, words: how, voice: k.voice } : null;
    },
    act: (ctx) => actIf(ctx.k, ctx.id),
    text: { push: ['Open it. Push.', 'Push it open.', 'The door. Push.', 'Open it.'], pull: ['Pull it open.', 'It opens to you. Pull.', 'Pull the door.', 'Open it. Pull.'], kick: ['Kick it.', 'Locked. Kick it.', 'Boot the door.', 'Kick it in.'],
      in: ['Open, in. Your corner.', 'Open it and in. Corner.', 'Door, in, your corner.', 'Go. Corner.'], clear: ['Clear it.', 'Open, clear it.', 'Room. Go.', 'Go.'] },
  },
  {
    id: 'cqb-go', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'In', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.open || k.inside || !k.plan?.door || k.S?.carry || k.S?.flow) return null;
      if (k.rung < 2) return k.offered('leave') ? { k, variant: 'keys', words: 'keys', voice: k.voice, ...walkWords(k.plan) } : null;
      const row = bundleRow(k, k.rung >= 3 ? 'room:clear' : 'room:in');
      return row ? { k, row: row.id, variant: 'enter', words: 'enter', voice: k.voice } : null;
    },
    act: (ctx) => (ctx.variant === 'keys' ? actIf(ctx.k, 'leave') : actIf(ctx.k, ctx.row)),
    text: { keys: ["In. Your corner's {side}. Don't stop in the door. X, then {keys}.", 'X. Then in, with the keys. Your corner first.', "Go. X, and walk it in, {keys}. Don't stop in the door.", 'X, then in. Corner {side}. Keep moving.'],
      enter: ['In, your corner.', 'Enter. Your corner.', 'In. Take your corner.', 'Go. Corner.'] },
  },
  {
    id: 'cqb-carryon', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Carry on', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms);
      if (!k?.choosing || !k.offered('drill:carry') || k.asking || (k.S?.carry?.why === 'two' && twoAway(state, ms))) return null;
      if (k.T && facingOf(k.T, ms) >= 0.5 && (k.T.stoppedAtMs === null || k.T.stoppedAtMs === undefined) && k.T.face !== 'noshoot') return null;
      if (upKnown(k, ms).length) return null;
      return { k, tier: k.tier, voice: k.voice, words: k.S.carry?.why === 'two' ? 'two' : k.tier };
    },
    act: (ctx) => actIf(ctx.k, 'drill:carry'),
    text: { 1: ['He\'s down. Carry on.', 'Down. Keep going.', 'Carry on. The room.', 'Down. Carry on.'], 2: ['Carry on.', 'Down. On.', 'Keep going.', 'On.'], 3: ['On.', 'Carry on.', 'Next.', 'Go on.'],
      two: ["He's on you. Carry on.", 'Your two is up. Go.', 'Two\'s with you. Carry on.', 'He\'s there. Go.'] },
  },
  {
    id: 'cqb-walk', voice: 'di', repeatMs: CQB_REPEAT_MS, tone: 'note', short: 'Keep moving', reach: null,
    when(state, me, ms) {
      const k = know(state, me, ms), H = k?.R.house;
      if (!k || k.inMode || !H || state.time?.doing || !k.plan) return null;
      if (Math.hypot(me.v?.[0] ?? 0, me.v?.[1] ?? 0) > 0.05 || ms - (H.stallAtMs ?? ms) < WALK_NUDGE_MS) return null;
      // (where the walk goes: your point once in (or the door open), else your stack; its keys by the bearing)
      const to = k.inside || k.open ? k.plan.points?.[0] : k.plan.stack?.[0];
      if (!to) return null;
      const d = Math.hypot(to[0] - me.x, to[1] - me.z), where = k.inside || k.open ? (k.here?.door === 'hall' ? 'the hall\'s end' : 'your point') : 'the door';
      // (below rung 2 the walk in through an open door is the keys' (cqb-go: "X, then {keys}"): the line names them and T
      // leaves them to you, as the mode would only give X back)
      const keysOnly = k.rung < 2 && !k.inside && k.open && !!k.plan.door;
      return d > 0.5 ? { k, tier: k.tier, voice: k.voice, words: keysOnly ? 'keys' : 'go', keys: keysOf(to[0] - me.x, to[1] - me.z), where, keysOnly } : { k, tier: k.tier, voice: k.voice, words: 'here' };
    },
    act: (ctx) => (ctx.keysOnly ? null : 'stop:enter'),
    text: { go: ['Keep moving. {keys} to {where}, or G for the drill.', "Don't stand there. {keys}: {where}.", 'Move. {keys} to {where}. G for the drill.', 'On. {keys}, {where}.'],
      keys: ["Keep moving. {keys}, in. Don't stop in the door.", 'In. {keys}. Your corner.', 'Walk it in: {keys}.', 'Move. {keys}, through the door.'],
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
    text: { 1: ['Now your point. Dominate the room.', 'Up to your point. Sweep your sector.', 'Dominate. Point, sector, call it.', 'In deeper. Your point, then your sector.'], 2: ['Dominate.', 'Your point. Your sector.', 'Dominate the room.', 'Point. Sector.'], 3: ['Dominate.', 'Point.', 'Sector.', 'Take the room.'] },
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
      const id = firstOf(k, ['drill:carry', 'move:point', look ? `look:${look.id}` : null, 'call:clear', 'move:hallEnd', 'leave']);
      if (!id) return null;
      const row = k.steps.find(x => x.id === id), down = !!k.T && k.T.stoppedAtMs !== null && k.T.stoppedAtMs !== undefined;
      const what = id === 'leave' ? 'X, then the keys' : String(row?.label ?? id).replace(/\.$/, '');
      return { k, id, tier: k.tier, voice: k.voice, what, words: down ? 'down' : 'on' };
    },
    act: (ctx) => actIf(ctx.k, ctx.id),
    text: { down: ['Down. Next: {what}.', 'Down. {what}.', "He's down. {what}.", 'Down. On: {what}.'], on: ['Next: {what}.', 'On: {what}.', '{what}.', 'Keep it going: {what}.'] },
  },
].map(r => Object.freeze({ ...r, voice: (ctx) => ctx?.voice ?? 'di' })));
