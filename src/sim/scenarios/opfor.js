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
//      (else freeze). Calm or under fire he fights, no roll. A choice holds; surrender is final.
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
// opforTick, opforHit, opforBled and ruleOut, which write the session.
import { TICK_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream, weighted } from '../../core/rng.js';
import { nextId, playerActor, playerId } from '../../core/ids.js';
import { OPFOR_SPOTS, RP_STANDS, RP_CARD_WEIGHTS, RP_QUALITY, RP_DOCTRINE, RP_CLASS, RP_INOC } from '../../data/places/house-opfor.js';
import { houseSpecOf, postsOf } from '../scenes/assemble.js';
import { openingState } from '../places/model.js';
import { placeGaits } from '../body/motion.js';
import { moverStart, locoStep } from '../body/loco.js';
import { drawStaff, setPost } from '../people/staff.js';
import { SEEN, headOf } from '../people/perception.js';
import { SKILL_KEYS, BASE_MAX } from '../skills/skills.js';
import { rangeOf, sayOn } from './handling.js';
import { materialise, move, lyingOf } from '../arms/kit.js';
import { feed, gunField, doAction, beliefOf, actionMs, tempoFor } from '../arms/firearms.js';
import { subsOf } from '../arms/drills.js';
import { gunOn, faceOfHead } from '../arms/shooting.js';
import { muzzleOf, lineMasked, lineFromOf } from '../arms/carry.js';
import { BRASS_LIVE } from '../arms/look.js';
import { famCap } from '../arms/models.js';
import { loadOf } from '../arms/calibres.js';
import { TURN_MS } from '../arms/turners.js';
import { resolveShot, aimMsOf } from '../arms/shot.js';
import { rowPlan } from '../arms/specials.js';
import { rollerOf } from '../combat/roll.js';
import { takeInMs } from '../combat/react.js';
import { feltOf, bandN, nerveCheck, startled, addSupp, inputPts, blockOf } from '../combat/supp.js';
import { manPlace, roomAt, SECTOR_HALF_DEG } from '../combat/room.js';
import { legsOf as bodyLegsOf, BODY_GAP_M } from '../combat/bundle.js';
import { profileOf, moveAt, pathLen } from '../combat/stepper.js';
import { bodySeen, marineTarget, incoming, remember, stale, struckOn, forget } from '../combat/men.js';
import { wouldHave, strikeOf, fatalOf, newLedger } from '../combat/would.js';

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
/** His rounds kept on the house's record (R.house.live.shots). */
export const SHOTS_KEPT = 30;
/** His rifle laid on the floor this far ahead of him, toward his door (m; my call). */
export const DROP_M = 0.35;
/** The states (see the header). */
export const RP_STATES = Object.freeze(['wait', 'turn', 'aim', 'fire', 'move', 'cover', 'freeze', 'hands', 'down', 'out']);
/** His words (the cadre's role-player's own; the instructor's are courses.js HOUSE_CHIEF's). */
export const RP_SAY = Object.freeze({ hands: "Don't shoot!", down: 'Hit!' });
/** The table of COMBAT §7.11 for the security doctrine: by felt's band (2 suppressed, 3 pinned) and the nerve check's grade. */
export const CHOICE_TABLE = Object.freeze({
  2: Object.freeze({ superb: 'fight', good: 'fight', pass: 'fight', miss: 'cover', bad: 'freeze', disaster: 'freeze' }),
  3: Object.freeze({ superb: 'cover', good: 'cover', pass: 'cover', miss: 'freeze', bad: 'freeze', disaster: 'surrender' }),
});

const whole = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const actorOf = (state, pid) => (pid ? state.actors?.list?.find(a => a.who === pid) ?? null : null);
const liveOf = (state) => rangeOf(state)?.house?.live ?? null;
const bearing = (a, x, z) => Math.atan2(z - a.z, x - a.x);
const SPENT = new Set(['hands', 'down', 'out']);

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
 * `post` the billet of his lane room's man (the same two men of Base Melas wherever their rooms fall).
 */
export function spotOf(state, T) {
  const P = drawnPosts(state);
  return P ? P[T.stand] : OPFOR_SPOTS[T.stand];
}
/** The lane's role-player stands, room 2's then room 3's: the set's RP_STANDS ['2a', '3a']; on a drawn house the stands of the posts of lane rooms 2 and 3 (G5); state may be null (the set). */
export function rpStandsOf(state) {
  const P = drawnPosts(state);
  return P ? Object.keys(P).sort() : RP_STANDS;
}
/**
 * A role-player's sheet at quality q (COMBAT §7.9's mapping; see the header): Marksmanship and Weapon handling round(4 + 14q), Fieldcraft
 * and Awareness round(3 + 12q), CQC round(2 + 12q), Warfighting round(60 q²); the class 'cop' (supp.js HARD_K, NERVE_K), whose values
 * are the own points as they stand; the private's Fitness 12; the room's drill rung 2 (rowPlan's aim before his first round); a fixed
 * inoculation RP_INOC. Returns a sheet in testSheet's shape.
 */
export function opforSheet(qk = RP_Q) {
  const r = (x) => Math.round(x), named = { marksmanship: r(4 + 14 * qk), weapons: r(4 + 14 * qk), fieldcraft: r(3 + 12 * qk), awareness: r(3 + 12 * qk), cqc: r(2 + 12 * qk), fitness: 12 };
  // (the rest at a security man's middling 5: my call; nothing of the lane reads them)
  const skills = Object.fromEntries(SKILL_KEYS.map(k => [k, [Math.min(BASE_MAX, named[k] ?? 5), 0]]));
  return { cls: RP_CLASS, os: r(60 * qk * qk), skills, drills: { room: { rung: 2 }, passage: { rung: 2 } }, inoc: { pts: RP_INOC, n: 0, sol: 0, fixed: true }, doctrine: RP_DOCTRINE };
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
  const spec = parseOpfor(opts);
  const R = rangeOf(state);
  if (!H || !R || !spec || spec.error || spec.mode !== 'live') return null;
  const seed = state.meta.seed, now = state.clock.ms, cards = drawCards(seed, spec.cards, rpStandsOf(state)), pids = {};
  const area = R.area ?? state.places?.live?.area;
  state.actors ??= { list: [] };
  for (const stand of rpStandsOf(state)) {
    const S = spotOf(state, { stand }), i = R.turners.findIndex(T => T.stand === stand);
    if (i < 0) continue;
    const pid = drawStaff(state, S.post), p = state.people[pid];
    p.skills = opforSheet(RP_Q);
    const kit = materialise(state, pid, 'opfor-fof');
    // (Condition 1: the first magazine seated and racked, on safe; its count told, the load it went in with ten of a thirty)
    const gun = state.items[kit.gunId], mag = state.items[kit.magIds[0]], loadN = mag.n;
    move(state, kit.magIds[0], { gun: kit.gunId });
    feed(gun, mag);
    gun.mode = 'safe';
    gun.belief = { chamber: 'live', count: mag.n, ...(mag.belief?.kind ? { load: mag.belief.kind } : {}), ...(loadN < famCap(mag.fam) ? { fullN: loadN } : {}) };
    delete mag.belief;
    p.kit.carry = { posture: 'lowReady', finger: 'off' };
    const [x, z] = S.start, headRad = headOf(S.face);
    setPost(state, pid, { area, x, z, face: S.face, outfit: 'utilities' });
    // (his actor made here, appended: a sync of the area's actors would make every actor again, the #2's and the instructor's too)
    state.actors.list.push({ id: nextId(state, 'a'), who: pid, x, z, face: S.face, gait: 'idle', moveStance: 'combat', headRad, $px: x, $pz: z });
    const T0 = R.turners[i];
    R.turners[i] = {
      key: T0.key, lane: T0.lane, room: T0.room, stand, name: S.name, slot: T0.slot, x, z, y: T0.y, face: 'threat', holds: 'rifle',
      trigger: { kind: 'go', on: null, gapMs: 0 }, turnAtMs: H.goAtMs ?? null, awayAtMs: null, hits: [], stoppedAtMs: null,
      live: { who: pid, card: cards[stand], st: 'wait', fromMs: now, cue: null, aimAt: null, aiming: null, turn: null, eyes: null, eng: null, move: null,
        choice: null, band: 0, seen: {}, known: {}, drawn: null, give: null, ia: null, firstAtMs: null, fired: 0, dashed: false, said: {} },
    };
    pids[stand] = pid;
  }
  H.live = { mode: 'live', cards, seenBy: {}, struck: [], casualty: null, ruled: [], shots: [], heardMs: now, burstsHeard: H.bursts?.length ?? 0, would: newLedger() };
  // (a man of a leg a setup has cleared already: ruled out, as the setup clears his stand)
  for (const T of R.turners) if (T.live && legIndex(T) < (H.cur ?? 0)) ruleOut(state, null, T, 'setup', now);
  return { cards, pids };
}
const legIndex = (T) => (T.stand === 'H' ? 3 : Number(T.stand?.[0]) - 1);

// ---- each lived tick ----

/** The role-players' tick (w; see the header): from the house's actors layer, after the #2, before the instructor's walk. */
export function opforTick(state, bus, R = rangeOf(state), H = R?.house, now = state.clock.ms) {
  const Lv = H?.live;
  if (!Lv || !R) return;
  const news = newsOf(state, R, H, Lv, now);
  for (const T of R.turners) if (T.live) manTick(state, bus, R, H, Lv, T, now, news);
  Lv.heardMs = now; Lv.burstsHeard = H.bursts?.length ?? 0;
}

// (the marines' rounds and the bursts since the last tick, each where it came from)
function newsOf(state, R, H, Lv, now) {
  const from = Lv.heardMs ?? -Infinity, me = playerActor(state), two = actorOf(state, H.twoPid), shots = [];
  const fresh = (s) => s.atMs > from && s.atMs <= now;
  for (const s of R.shots ?? []) if (fresh(s) && me) shots.push({ id: s.id, atMs: s.atMs, who: me.who, key: s.key ?? null, load: s.load ?? null, x: me.x, z: me.z });
  for (const s of H.two?.shots ?? []) if (fresh(s) && two) shots.push({ id: s.id, atMs: s.atMs, who: two.who, key: s.key ?? null, load: null, x: two.x, z: two.z });
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
  if (L.st === 'out' || L.st === 'down') { /* (he sits: nothing more) */ }
  else if (T.stoppedAtMs !== null) ruleOut(state, bus, T, 'setup', now);
  else if (H.end || Lv.casualty) cease(state, T);
  else vMs = brain(state, bus, R, H, Lv, T, a, now, news);
  syncMan(state, T, a);
  locoStep(a, a.$px, a.$pz, { state, pid: L.who, gait: vMs > 0 ? 'run' : 'walk', stance: a.moveStance ?? 'combat', vMs: vMs > 0 ? vMs : null });
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
  const shocked = shockedOf(state, pid, now);
  if (shocked) {
    // (a startle, a flash or a stun: nothing new; a held aim knocked off the door; rounds not yet fired cut)
    if (L.eng) { L.eng = null; L.st = 'aim'; }
    L.eyes = null; L.aiming = null;
    const k = state.people[pid].kit;
    if (k.carry?.posture === 'aimed') { k.carry.posture = 'lowReady'; L.aimAt = null; }
    if (L.move) holdMove(L.move);
    return 0;
  }
  choiceTick(state, bus, H, T, a, now);
  if (L.give) return 0;
  if (L.ia) { if (now < L.ia.untilMs) return 0; clearStoppage(state, bus, T); }
  if (L.move) return moveTick(state, bus, H, T, a, now);
  if (L.st === 'freeze' || L.st === 'cover') { look(state, bus, H, T, a, now, { fire: false }); return 0; }
  if (L.eng) { fireTick(state, bus, R, H, Lv, T, a, now); return 0; }
  turnTick(state, T, a, now);
  look(state, bus, H, T, a, now, { fire: true });
  return 0;
}
/** Whether a role-player is shocked at ms (step 3): startled (supp.js), flash-blind or stunned (his combat block). */
export const rpShocked = (state, pid, now = state.clock.ms) => shockedOf(state, pid, now);
const shockedOf = (state, pid, now) => {
  if (startled(state, pid, now)) return true;
  const c = blockOf(state, pid);
  return !!c && ((c.blindUntilMs ?? 0) > now || (c.stunUntilMs ?? 0) > now);
};

// ---- what he hears (step 1) ----

function hear(state, bus, H, T, a, now, news) {
  const L = T.live, pid = L.who, mine = roomAt(state, a.x, a.z);
  for (const s of news.shots) {
    const here = roomAt(state, s.x, s.z) === mine && mine !== null;
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
    if (now >= L.turn.untilMs) { L.turn = null; startAim(state, T, a, now); }
  }
  if (L.aiming && now >= L.aiming.untilMs) {
    const k = state.people[L.who].kit;
    k.carry.posture = 'aimed';
    L.aimAt = L.aiming.at; L.aiming = null;
  }
}
// (his rifle onto his door's threshold: posture 'aimed' at his aim time from where he holds it)
function startAim(state, T, a, now) {
  const L = T.live, S = spotOf(state, T), gunId = gunOn(state, L.who);
  L.st = 'aim'; L.fromMs = now;
  if (!S || !gunId) return;
  const [x, z] = S.aimAt, dM = Math.hypot(x - a.x, z - a.z);
  const ms = aimMsOf(state, L.who, gunId, { x, z, dM }, { ms: now });
  a.headRad = q(bearing(a, x, z), 1e-6); a.face = faceOfHead(a.headRad);
  L.aiming = { at: [x, z], untilMs: whole(now + ms) };
}

// ---- his eyes and his card (step 9) ----

// (the marines: you and your number two)
function marinesOf(state, H) {
  const out = [], me = playerActor(state), two = actorOf(state, H.twoPid);
  if (me) out.push(me.who);
  if (two) out.push(two.who);
  return out;
}
const fighting = (L) => !SPENT.has(L.st) && L.st !== 'freeze' && L.st !== 'cover' && L.st !== 'move' && !L.give;

function look(state, bus, H, T, a, now, { fire }) {
  const L = T.live, pid = L.who;
  let best = null;
  for (const who of marinesOf(state, H)) {
    const t = marineTarget(state, who, a, now);
    if (!t || struckOn(state, who).down) continue;
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
  if (!gun || !t) return;
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
  if (t && !struckOn(state, who).down && t.facingK >= SEEN) { plan(state, T, a, E.key, now); return; }
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
  L.st = 'aim'; L.fromMs = now;
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
  // (at most DASH_MAX_M along it)
  let len = pathLen(path);
  if (len > DASH_MAX_M) { const k = DASH_MAX_M / len, e = path.at(-1), s0 = path.at(-2); path[path.length - 1] = [q(s0[0] + (e[0] - s0[0]) * k, 1e-4), q(s0[1] + (e[1] - s0[1]) * k, 1e-4)]; len = pathLen(path); }
  L.dashed = true;
  L.eng = null; L.eyes = null; L.aiming = null; L.turn = null;
  const k = state.people[pid].kit;
  k.carry.posture = 'lowReady'; k.carry.finger = 'off';
  delete a.stance;
  if (len < 0.05) { arrive(state, T, a, now); return; }
  const legs = bodyLegsOf(state, pid, a.x, a.z), prof = profileOf(len, placeGaits(state).runMs, legs.pushMs2, legs.brakeMs2, { v0: 0, v1: 0 });
  L.move = { to: [to[0], to[1]], path: path.map(p => [q(p[0], 1e-4), q(p[1], 1e-4)]), prof, fromMs: now, untilMs: now + Math.round(prof.T * 1000), startMs: now, heldMs: 0, why };
  L.st = 'move'; L.fromMs = now;
}
// (a dash held a tick: its clock moved on by the tick)
function holdMove(W) { W.fromMs += TICK_MS; W.untilMs += TICK_MS; W.heldMs += TICK_MS; }
function moveTick(state, bus, H, T, a, now) {
  const L = T.live, W = L.move, p = moveAt(W, now);
  // (held on a marine's body: the next place closing within BODY_GAP_M of one)
  const blocked = marinesOf(state, H).some(who => { const m = actorOf(state, who) ?? (playerActor(state)?.who === who ? playerActor(state) : null); if (!m) return false; const d1 = Math.hypot(p.x - m.x, p.z - m.z); return d1 < BODY_GAP_M && d1 < Math.hypot(a.x - m.x, a.z - m.z) - 1e-6; });
  if (blocked) {
    holdMove(W);
    if (W.heldMs > HELD_SHORT_MS) { L.move = null; arrive(state, T, a, now); }
    return 0;
  }
  a.x = p.x; a.z = p.z;
  a.headRad = p.headRad; a.face = faceOfHead(a.headRad);
  if (p.done || now - W.startMs >= DASH_MAX_MS) { L.move = null; arrive(state, T, a, now); return 0; }
  return p.vMs;
}
// (at his hide, or down where he is: crouched, his rifle laid on his door again; the card 'hide' fights from there, cover keeps down)
function arrive(state, T, a, now) {
  const L = T.live;
  a.stance = 'kneel';
  if (L.choice?.what === 'cover') { L.st = 'cover'; L.fromMs = now; return; }
  startAim(state, T, a, now);
}

// ---- his choice (step 4) ----

function choiceTick(state, bus, H, T, a, now) {
  const L = T.live, pid = L.who, ch = L.choice;
  if (ch?.what === 'surrender') return;
  const felt = feltOf(state, pid, now), band = bandN(felt);
  let roll = false;
  if (band !== L.band) { L.band = band; roll = true; }
  else if (ch && (ch.what === 'cover' || ch.what === 'freeze') && band >= 2 && now - ch.atMs >= CHOICE_DWELL_MS) roll = true;
  if (!roll) return;
  const { what, grade, dc } = choiceOf(state, pid, { felt, atMs: now, key: `rp:${T.key}`, near: () => weaponNear(state, H, a) });
  L.choice = { what, band, atMs: now, ...(grade ? { grade, dc } : {}) };
  if (what === 'fight') { if (L.st === 'freeze' || L.st === 'cover') { delete a.stance; startAim(state, T, a, now); } return; }
  if (what === 'surrender') { startGive(state, T, now); return; }
  L.eng = null; L.eyes = null; L.aiming = null;
  const k = state.people[pid].kit;
  k.carry.finger = 'off';
  if (what === 'freeze') { if (!L.move) { L.st = 'freeze'; L.fromMs = now; a.stance = 'kneel'; k.carry.posture = 'lowReady'; } return; }
  // (cover: the one dash to his hide, or down where he is when he has dashed already or stands there)
  const S = spotOf(state, T);
  if (!L.dashed && S && Math.hypot(a.x - S.hide[0], a.z - S.hide[1]) > 0.1) startDash(state, T, a, S.hide, 'cover', now);
  else if (!L.move) { L.st = 'cover'; L.fromMs = now; a.stance = 'kneel'; k.carry.posture = 'lowReady'; }
}
/**
 * A role-player's choice at a felt (COMBAT §7.11's table, the security doctrine; see the header): { what: 'fight' | 'cover' | 'freeze' |
 * 'surrender', band, grade, dc }. Calm or under fire 'fight' with no roll; else supp.js nerveCheck on its stream (key: 'rp:<turner key>'),
 * read on CHOICE_TABLE, a surrender only with near() true (a marine's weapon within SURRENDER_M), else a freeze.
 */
export function choiceOf(state, pid, { felt, atMs = state.clock.ms, key = 'rp', near = () => false }) {
  const band = bandN(felt);
  if (band < 2) return { what: 'fight', band, grade: null, dc: null };
  const r = nerveCheck(state, pid, { felt, atMs, key }), grade = r.roll?.grade ?? 'pass';
  let what = CHOICE_TABLE[Math.min(3, band)][grade] ?? 'freeze';
  if (what === 'surrender' && !near()) what = 'freeze';
  return { what, band, grade, dc: r.dc };
}
// (a marine's weapon within SURRENDER_M of him: his rifle in his hands)
function weaponNear(state, H, a) {
  return marinesOf(state, H).some(who => { const m = who === playerId(state) ? playerActor(state) : actorOf(state, who); const mz = m ? muzzleOf(state, who, m) : null; return !!mz?.inHand && Math.hypot(m.x - a.x, m.z - a.z) <= SURRENDER_M; });
}

// ---- the give (step 2) ----

function startGive(state, T, now) {
  const L = T.live;
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

function say(state, bus, T, kind) {
  const L = T.live;
  if (L.said[kind]) return;
  L.said[kind] = state.clock.ms;
  sayOn(state, bus, { who: L.who, text: RP_SAY[kind], kind: 'speech' });
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
  const would = h ? wouldHave(state, strikeOf(state, shot, { on: L.who, by: h.by ?? null, part: h.part, zone: h.zone })) : null;
  if (h && fatalOf(state, L.who) && L.st !== 'down' && L.st !== 'out') goDown(state, bus, T, shot.atMs ?? now);
  return { torso, head, down: L.st === 'down', would };
}
/** A role-player a wound put down later (would.js wouldTick; w): down where he stands at atMs, as at a fatal round; a man down or out already stays so. */
export function opforBled(state, bus, T, atMs = state.clock.ms) {
  const L = T?.live;
  if (L && L.st !== 'down' && L.st !== 'out') goDown(state, bus, T, atMs);
}
function goDown(state, bus, T, atMs) {
  const L = T.live, a = actorOf(state, L.who);
  L.st = 'down'; L.fromMs = atMs;
  L.eng = null; L.eyes = null; L.aiming = null; L.move = null; L.turn = null; L.give = null; L.ia = null;
  if (T.stoppedAtMs === null) T.stoppedAtMs = atMs;
  const k = state.people[L.who]?.kit;
  if (k?.carry && gunOn(state, L.who)) { k.carry.posture = 'lowReady'; k.carry.finger = 'off'; }
  if (a) { a.posture = 'sit'; delete a.stance; delete a.v; a.gait = 'idle'; }
  const p = state.people[L.who]?.post;
  if (p) p.posture = 'sit';
  say(state, bus, T, 'down');
  bus?.emit('house', { phase: 'rp', kind: 'down', key: T.key, stand: T.stand, who: L.who, atMs });
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

/** The role-players now (the hud's, the bots' and the tests' view): [{ key, stand, name, who, card, st, x, z, room, slot, headRad, fired, firstAtMs, hits, fatal (the why of his fatal strike, would.js, or null), rifle, choice, band, outWhy }]. */
export function opforNow(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R?.house?.live) return [];
  return R.turners.filter(T => T.live).map(T => {
    const L = T.live, a = actorOf(state, L.who);
    const torso = T.hits.filter(h => h.part === 'torso' && (h.zone === 'A' || h.zone === 'C')).length, head = T.hits.filter(h => h.zone === 'head').length;
    return { key: T.key, stand: T.stand, name: T.name, who: L.who, card: L.card, st: L.st, x: T.x, z: T.z, room: T.room, slot: T.slot, headRad: a?.headRad ?? null,
      fired: L.fired, firstAtMs: L.firstAtMs, hits: { torso, head }, fatal: fatalOf(state, L.who)?.why ?? null, rifle: rifleWhere(state, T), choice: L.choice?.what ?? null, band: L.band, outWhy: L.outWhy ?? null,
      giving: !!L.give, knelt: !!L.knelt, at: ms };
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
 * 'cower', 'drop' (the rifle falling, from L.give's atMs to its dropAtMs), 'hands', 'kneel', 'sit'.
 */
export function opforLook(state, ms = state.clock.ms) {
  const R = rangeOf(state);
  if (!R?.house?.live) return [];
  const lying = R.area ? lyingOf(state, R.area) : [];
  return R.turners.filter(T => T.live).map(T => {
    const L = T.live, a = actorOf(state, L.who), carry = state.people[L.who]?.kit?.carry ?? {};
    const frame = L.st === 'down' || (L.st === 'out' && a?.posture === 'sit') ? 'sit' : L.give ? 'drop' : L.st === 'hands' ? (L.knelt ? 'kneel' : 'hands')
      : L.st === 'move' ? 'run' : L.st === 'freeze' ? 'cower' : carry.posture === 'aimed' ? 'aim' : a?.stance === 'kneel' ? 'crouch' : 'stand';
    const floor = L.rifleId ? lying.find(l => l.id === L.rifleId) ?? null : null;
    const rifle = floor ? { where: 'floor', x: floor.x, z: floor.z, yawRad: q(bearing(a ?? { x: T.x, z: T.z }, floor.x, floor.z), 1e-4) } : L.give ? { where: 'hands', fromMs: L.give.atMs, toMs: L.give.dropAtMs } : { where: rifleWhere(state, T) ?? 'hands' };
    return { key: T.key, stand: T.stand, who: L.who, x: a?.x ?? T.x, z: a?.z ?? T.z, headRad: a?.headRad ?? null, frame, posture: a?.posture ?? 'stand', stance: a?.stance ?? 'stand', hands: !!a?.hands, rifle, mask: true };
  });
}
