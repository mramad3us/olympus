// OLYMPUS combat: the holders, the boarding team's #1 and #2 who hold the lock's end of the passage while your pair clears the compartments: a post, a sector, their eyes, their pairs, their own stoppage and tourniquet, their words (v0.0.27, "Away the boarding party": its build sheet §1 C, §3.3, item 4; FT§6.1, FT§6.2; COMBAT §7.1, §7.3).
//
// Who. The fire team of four (COMBAT §7.1) is #1 the team leader, #2 the automatic rifleman, #3 you and #4 your buddy (v0.0.19's #2 as
// built, "Four" in the words: team.js fireTeamOf, TEAM_LABELS). The leader and the AR are the holders, generated marines of the boarding
// team's posts (src/data/places/hauler.js HAULER_HOLDERS: 'belt-mule:board-tl' and '-ar', drawn by people/staff.js drawStaff; the leader is
// the lane's chief, the one testShoothouse drew already), on the scene's sheet as you are (templates.js testSheet), in the boarding's issue
// (kit.js 'boarding-cqb', B's: the carrier with its plates in, the R-7 chambered from the fill, on safe), on locked mag boots, starting in
// the lock (HAULER_START n 1, 2). Their record is R.house.holders = { v, men: [{ pid, n, post, start, at, onFace, aimAt, sectorDeg, hatch,
// st, fromMs, … }], setMs, turn } (plain data, saved; absent on every lane without holders, so no house, Wreck or live lane gains a key).
//
// What a holder does, each lived tick from GO (holderTick, called by the scene's actors layer after your #2's twoTick and before the
// defenders' opforTick: decisions act the next tick), on COMBAT §7.3's ladder from level 2 to 10 with nothing that moves him off his post:
//   1. Down (BODY's knock, the body domain's stance: domain.js woundsFast): his stance 'down', he does nothing but, the knock over and a limb
//      bleeding hard, his tourniquet (2); "I'm hit!" once a fall. A man down is out of the fight: his sector is uncovered (T says so: the
//      instinct's cqb-passage) until he is up again (an arm, the bleeding stopped: woundsFast's `waits` false).
//   2. Self-aid (level 2): conscious, his knock over, a limb bleeding at HARD_BLEED_PM or more or an artery (B's aid.js tourniquetOf): the
//      tourniquet, aid.js TQ_MS 25 s, nothing else meanwhile; at its end aid.js applyTourniquet (the bleed stopped, cared 'tourniquet',
//      his hands −6 after by wounds.js woundMods' limb rule). Never another man's: buddy aid waits for the corpsman.
//   3. The walk to his post (once, at GO): the lock's inner hatch undogged (the override's), the leader opens it at GO plus his react.js
//      goMs and walks through, the AR HOLD_FOLLOW_MS behind; on locked boots at the mag walk's 0.5 m/s (data/body/needs.js MAG_BOOTS), by
//      the routing grid's way (route.js routed, the hatch open); the AR then changes his face to the deckhead (drills/void.js faceMsOf,
//      footing.js lockOnFace), out of the leader's line. Both set, the leader says "Set." (R.house.holders.setMs: the scene's send rule,
//      the leader's "Three, Four: cabin one. Go.", reads it). Nobody leaves his post after. On the way (v0.0.27's carried stage), an
//      armed man in his post's sector and his sight (armedInSight) stops him where he stands: his eyes and his pairs from there as at his
//      post (6 and 7), then on to it once nothing of his is under way and no such man is in sight; the AR stops HOLD_GAP_M behind the
//      leader stopped short of his post (heldUpBy), never walking into him. (Before, both walked on at low ready, finger off, while the
//      barricade man shot them: on D's posts, 5.65 and 4.95 m in, he downed both before "Set." on every sheet.)
//   4. His shock (men.js shockedNow: startled, flash-blind or stunned; his CES visor keeps the flash off him): he starts nothing, his
//      rounds not yet fired cut.
//   5. His stoppage (his own drill, two.js twoDrillOf's: a double feed REMEDIAL ACTION, the bolt locked or dry a speed reload, else
//      IMMEDIATE ACTION) at its time (drills.js subsOf over firearms.js actionMs at his Weapon handling), each sub-step then done unforced
//      on his own stream ('holder'): a marine fumbles as your #2 does; tried at most HOLD_TRIES times. "Gun down!" (a dry rifle
//      "Reloading!"), then "Gun up!" (or "Up."). No magazine left with a round in it, or his drill failed HOLD_TRIES times, his rifle is
//      down for good (m.dry): he holds his post, silent, and fires no more (no transition to his P-12 this round, my call).
//   6. His eyes (level 10, the scan): each live man (R.turners with `live`) in his sector's cone (HOLD_SECTOR_DEG 30° either side of his
//      post's aim, from the post) seen from his eye at SEEN (men.js seenK, his eye drawn by a round of the man's), remembered MAN_MEMORY_MS
//      (men.js remember, stale); a man seen and not known is taken in (react.js takeInMs: 'sector' within SECTOR_HALF_DEG of his aim, else
//      'alert'), then identified (contact.js IDENT_DC0 + range / IDENT_PER_M, an Awareness check on stream(seed, 'holder:ident', …); failed,
//      he looks again CHALLENGE_MS on). "Contact forward!" (the leader) or "Contact!" (the AR), once a man. A man down (holdsFireOn
//      'down') is seen but never taken in nor called: no contact (v0.0.27's review).
//   7. His fire: an armed man who is not giving (holdsFireOn: never a man with his hands up, down, ruled out or with no gun in his hands,
//      read on the truth at every round, so a man who gives as the pair goes gets no second round) gets a pair (specials.js rowPlan
//      'shot:pair' from his muzzle, odds off), each round shot.js resolveShot at its time and handed to the lane's shot path (the host's
//      houseShot: the hit to opfor.js opforHit on the one rule, a miss to the holes), another pair while the man is seen, up, in the
//      sector and armed; **never through a marine** (two.js maskedBy over the rest of the fire team: the round held a tick at a time,
//      "Line!" once a hold, never a step aside: his post is his); a round's plan waits its turn (team.js planTurn: one NPC marine's plan a
//      tick, round-robin, the busiest tick never paid three times at once).
//   8. The fall back (R.house.boarding.fallback, the scene's call at two of four down): each holder able to walk comes off the deckhead
//      and walks back to his place in the lock (st 'back', then 'in'); a holder down stays (the splash carries him, the card says so).
// No choice is rolled (my call, FT§6.2: a Corps marine at his post fights; COMBAT §7.11's military row would give him cover at a miss,
// which one pirate's fire at his hardening never reaches, and a holder in cover has left his sector). holderNow(state, pid) is the hud's,
// the bots' and the tests' view; holderLook(state, pid) the stage's frame. Every roll is on a named stream; pure but fillHolders,
// holdersPosted and holderTick, which write the session, the people and their actors.
import { q } from '../../core/num.js';
import { stream } from '../../core/rng.js';
import { nextId, playerActor, playerId } from '../../core/ids.js';
import { TICK_MS } from '../../core/clock.js';
import { HAULER_START } from '../../data/places/hauler.js';
import { MAG_BOOTS } from '../../data/body/needs.js';
import { SEEN } from '../people/perception.js';
import { drawStaff, setPost } from '../people/staff.js';
import { testSheet } from '../skills/templates.js';
import { check } from '../skills/checks.js';
import { areaOf, openingOf, openingState, setOpening, leafClosed, roomOf } from '../places/model.js';
import { placeGaits } from '../body/motion.js';
import { moverStart, locoStep } from '../body/loco.js';
import { setAnchor, bootsOf, lockOnFace } from '../body/footing.js';
import { downOf, hasWounds } from '../body/wounds.js';
import { tourniquetOf, applyTourniquet, TQ_MS } from '../body/aid.js';
import { materialise, issueBoarding, move, wear, sparesOf } from '../arms/kit.js';
import { feed, gunField, doAction, beliefOf, actionMs, tempoFor } from '../arms/firearms.js';
import { subsOf } from '../arms/drills.js';
import { gunOn, faceOfHead } from '../arms/shooting.js';
import { famCap, modelOf } from '../arms/models.js';
import { facingOf, turnerTargets, turnersOf } from '../arms/turners.js';
import { resolveShot } from '../arms/shot.js';
import { rowPlan } from '../arms/specials.js';
import { rollerOf } from './roll.js';
import { takeInMs, goMs, SECTOR_HALF_DEG } from './react.js';
import { IDENT_DC0, IDENT_PER_M, CHALLENGE_MS } from './contact.js';
import { seenK, remember, stale, shockedNow, drawnOn } from './men.js';
import { opOf, hostOf } from './op.js';
import { fireTeamOf, planTurn, TEAM_WORDS } from './team.js';
import { maskedBy, twoDrillOf, holdsFireOn } from './two.js';
import { lockedOf, legsOf as bodyLegsOf, skillsOf } from './bundle.js';
import { profileOf, moveAt, pathLen } from './stepper.js';
import { routed } from './route.js';
import { faceMsOf } from './drills/void.js';

/** A holder's sector: this far either side of his post's aim (degrees; my call, FT§6.2). */
export const HOLD_SECTOR_DEG = 30;
/** The AR goes through this long after the leader (ms; my call: a pace behind him). */
export const HOLD_FOLLOW_MS = 600;
/** A holder's stoppage drill tried at most this many times before his rifle stays down (my call: two.js TWO_TRIES' figure). */
export const HOLD_TRIES = 3;
/** The holders' issue (B's kit.js 'boarding-cqb': the CES suit, the carrier with its plates in, the R-7 with frangible, the P-12, mag boots; yours). */
export const HOLD_ISSUE = 'boarding-cqb';
/** On his walk to his post, a holder stops this near behind the other stopped short of his (m; my call: two bodies of 0.35 m and a hand's gap). */
export const HOLD_GAP_M = 0.8;
/** A holder is at his post within this (m: his walk's end to the grid). */
export const AT_POST_M = 0.05;
/** What a holder is doing (holderNow's st): in the lock, walking to his post, changing his face, set, down, his tourniquet, back to the lock, in it. */
export const HOLD_STATES = Object.freeze(['lock', 'go', 'face', 'set', 'down', 'aid', 'back', 'in']);

const actorOf = (state, pid) => (pid ? state.actors?.list?.find(a => a.who === pid) ?? null : null);
const whole = (ms) => Math.ceil(ms / TICK_MS) * TICK_MS;
const rad = (deg) => deg * Math.PI / 180;
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const bearing = (from, x, z) => Math.atan2(z - from[1], x - from[0]);
const holdersOf = (state) => opOf(state)?.holders ?? null;
// (a word of his: a bubble at him (the lane's sayOn: the 'say' fact and the log's line), never voiced (the user, 2026-11-19))
const say = (state, bus, m, id) => { const text = TEAM_WORDS[id]?.words; if (text) hostOf(state).sayOn(state, bus, { who: m.pid, text, kind: 'speech' }); };

// ---- the fill ----

/**
 * The holders put aboard (w; see the header), from the scene's fill once the house's record is written: posts the ship's holders
 * (SHIPS[…].holders, HAULER_HOLDERS' shape: { n, post, at, onFace, aimAt, sectorDeg }); opts { issue (HOLD_ISSUE), start (each n's
 * place in the lock, { [n]: [x, z] }: hauler.js HAULER_START's by default), face ('right') }. Each person drawn from his post (the leader is
 * the lane's chief, drawn already: drawStaff gives him back), on the scene's sheet, issued and chambered on safe, posted at his start on
 * mag boots, locked; his actor made where none is. Returns R.house.holders, or null with no house record.
 */
export function fillHolders(state, posts, { issue = HOLD_ISSUE, start = null, face = 'right' } = {}) {
  const H = opOf(state), area = state.places?.live?.area;
  if (!H || !posts?.length || !area) return null;
  const tier = H.tier ?? 'private', men = [];
  state.actors ??= { list: [] };
  for (const P of posts) {
    const at0 = start?.[P.n] ?? startOf(P.n, P.at), pid = drawStaff(state, P.post), p = state.people[pid];
    p.skills = testSheet(tier);
    // (the issue chambered at the muster (the build sheet §0 item 11: a real op), on safe, low ready; the magazine's count told)
    // (a boarding issue by B's issueBoarding, its P-12 with it; any other kit (a test's) as materialised)
    const kit = issue.startsWith('boarding-') ? issueBoarding(state, pid, issue) : materialise(state, pid, issue), gun = state.items[kit.gunId], mag = state.items[kit.magIds[0]], loadN = mag.n;
    move(state, kit.magIds[0], { gun: kit.gunId });
    feed(gun, mag);
    gun.mode = 'safe';
    gun.belief = { chamber: 'live', count: mag.n, ...(mag.belief?.kind ? { load: mag.belief.kind } : {}), ...(loadN < famCap(mag.fam) ? { fullN: loadN } : {}) };
    delete mag.belief;
    p.kit.carry = { posture: 'lowReady', finger: 'off' };
    if (!bootsOf(state, pid)) wear(state, pid, 'mb-1');
    setPost(state, pid, { area, x: at0[0], z: at0[1], face, outfit: 'combatSuit' });
    let a = actorOf(state, pid);
    // (his actor made here where none is, appended (a sync of the area's actors would make every actor again: opfor.js fillOpfor's rule))
    // (E's: in the combat EVA suit on his actor, as his post says, which the figure and the doll read: a holder made here wore
    // the utilities' camouflage on the stage and his card)
    if (!a) { a = { id: nextId(state, 'a'), who: pid, x: at0[0], z: at0[1], face, gait: 'idle', moveStance: 'combat', headRad: headOf(face), $px: at0[0], $pz: at0[1], outfit: 'combatSuit' }; state.actors.list.push(a); }
    else Object.assign(a, { x: at0[0], z: at0[1], $px: at0[0], $pz: at0[1], face, headRad: headOf(face), gait: 'idle', moveStance: 'combat', outfit: 'combatSuit' });
    delete a.path;
    setAnchor(state, pid, 'boots');
    const hatch = hatchOf(area, at0, P.at);
    men.push({ pid, n: P.n, post: P.post, start: [at0[0], at0[1]], at: [P.at[0], P.at[1]], onFace: P.onFace ?? 'deck', aimAt: [P.aimAt[0], P.aimAt[1]], sectorDeg: P.sectorDeg ?? HOLD_SECTOR_DEG,
      hatch, st: 'lock', fromMs: state.clock.ms, known: {}, seen: {}, ident: {}, said: {}, fired: 0, hits: 0, shots: [] });
  }
  H.holders = { v: 1, men, setMs: null, turn: null };
  return H.holders;
}
const headOf = (f) => (f === 'right' ? 0 : f === 'down' ? Math.PI / 2 : f === 'up' ? -Math.PI / 2 : Math.PI);
// (n's place in the lock: the hauler's start row (hauler.js HAULER_START, the four on the inner hatch's latch side), else his post)
const startOf = (n, post) => HAULER_START.find(x => x.n === n)?.at ?? post;
// (the opening between the start's room and the post's (the lock's inner hatch aboard the hauler), or null where they share a room)
function hatchOf(areaId, from, to) {
  const A = roomOf(areaId, from[0], from[1])?.id ?? null, B = roomOf(areaId, to[0], to[1])?.id ?? null;
  if (!A || !B || A === B) return null;
  return (areaOf(areaId)?.openings ?? []).find(o => o.rooms?.includes(A) && o.rooms?.includes(B))?.id ?? null;
}

/**
 * The holders at their posts as the honest tier one leaves them (a setup's: the scene's 'cabin2' and 'fallback', D's setupShip): each
 * man not down placed on his post and face, set, his rifle laid down the passage, the lock's inner hatch open behind them, R.house.holders.setMs
 * now (no "Set." said: the setup's past). Returns the holders' record or null.
 */
export function holdersPosted(state, now = state.clock.ms) {
  const Q = holdersOf(state);
  if (!Q) return null;
  for (const m of Q.men) {
    const a = actorOf(state, m.pid);
    if (!a || a.stance === 'down') continue;
    if (m.hatch && openingState(state, m.hatch) !== 'open') setOpening(state, m.hatch, 'open', { atMs: now });
    place(a, m.at);
    if (m.onFace !== 'deck') lockOnFace(state, m.pid, m.onFace);
    else setAnchor(state, m.pid, 'boots');
    setInPost(state, m, a, now);
  }
  if (Q.setMs === null) Q.setMs = now;
  return Q;
}
const place = (a, [x, z]) => { a.x = x; a.z = z; a.$px = x; a.$pz = z; delete a.path; };
// (set at his post: his rifle laid down his sector (aimed, finger off), his head on its aim)
function setInPost(state, m, a, now) {
  m.st = 'set'; m.fromMs = now; delete m.walk; delete m.face;
  const k = state.people[m.pid]?.kit;
  if (k?.carry) { k.carry.posture = 'aimed'; k.carry.finger = 'off'; }
  a.headRad = q(bearing(m.at, m.aimAt[0], m.aimAt[1]), 1e-6); a.face = faceOfHead(a.headRad); a.gait = 'idle';
}

// ---- the views ----

/** The holder of a person, or null: his record on R.house.holders. */
export function holderOf(state, pid) { return holdersOf(state)?.men?.find(m => m.pid === pid) ?? null; }
/** Whether the scene has holders (the fire team's #1 and #2 on R.house.holders). */
export const hasHolders = (state) => !!holdersOf(state)?.men?.length;
/**
 * A holder now (the hud's, the bots', the scene's and the tests' view): { pid, n, st, at, aimAt, onFace, down (his stance), set (at his
 * post, able), seen (the keys of the men he sees now), eng (his man while a pair is under way), aid (his tourniquet's end ms), fired, hits },
 * or null.
 */
export function holderNow(state, pid, ms = state.clock.ms) {
  const m = holderOf(state, pid), a = actorOf(state, pid);
  if (!m) return null;
  return { pid, n: m.n, st: m.st, at: [...m.at], aimAt: [...m.aimAt], onFace: a?.onFace ?? 'deck', down: a?.stance === 'down', set: m.st === 'set',
    seen: Object.entries(m.seen ?? {}).filter(([, t]) => t === ms).map(([k]) => k), eng: m.eng?.key ?? null, aid: m.aid?.untilMs ?? null, fired: m.fired, hits: m.hits };
}
/**
 * The stage's frame of a holder (E's; arms/look.js gunLook draws the marines as it draws your #2): { who, x, z, headRad, onFace, frame,
 * carry } with frame 'walk' (to his post or back), 'face' (his face change), 'aim' (set, his rifle laid), 'drill' (his stoppage), 'aid'
 * (his tourniquet), 'down' (his stance down: hanging from his boots at 0 G, the house's sit under gravity is E's to choose), else 'stand'.
 */
export function holderLook(state, pid) {
  const m = holderOf(state, pid), a = actorOf(state, pid);
  if (!m || !a) return null;
  const carry = state.people[pid]?.kit?.carry ?? {};
  const frame = a.stance === 'down' ? 'down' : m.aid ? 'aid' : m.walk ? 'walk' : m.face ? 'face' : m.ia ? 'drill' : carry.posture === 'aimed' ? 'aim' : 'stand';
  return { who: pid, n: m.n, x: a.x, z: a.z, headRad: a.headRad ?? null, onFace: a.onFace ?? 'deck', frame, carry: { posture: carry.posture ?? 'lowReady', finger: carry.finger ?? 'off' } };
}

// (a man inside a holder's sector: his bearing from the post within its half-angle of the post's aim)
const inSector = (m, T) => Math.abs(wrap(bearing(m.at, T.x, T.z) - bearing(m.at, m.aimAt[0], m.aimAt[1]))) <= rad(m.sectorDeg ?? HOLD_SECTOR_DEG) + 1e-9;
// (he sees a man: his facing (1 for a live man not ruled out) times his exposure from the holder's eye, quantised, at SEEN)
const sees = (state, a, m, T, now) => facingOf(T, now) >= SEEN && q(seenK(state, a, T, now, { drawn: drawnOn(m, T.key, now) }), 1e-6) >= SEEN;
// (the other holder stopped short of his post HOLD_GAP_M or nearer ahead of him on his way: he stops behind him, never walks into him)
const heldUpBy = (state, Q, m, a) => {
  const to = m.walk?.to ?? m.at, dx = to[0] - a.x, dz = to[1] - a.z;
  return Q.men.some(o => {
    if (o === m || o.walk || o.st !== 'go') return false;
    const b = actorOf(state, o.pid), ox = (b?.x ?? 0) - a.x, oz = (b?.z ?? 0) - a.z;
    return !!b && b.stance !== 'down' && Math.hypot(ox, oz) <= HOLD_GAP_M && ox * dx + oz * dz > 0;
  });
};
// (a man he may shoot in his sector and his sight, his rifle not down for good: what stops his walk to his post (see brain))
const armedInSight = (state, m, a, now) => !m.dry && turnersOf(state).some(T => T.live && inSector(m, T) && !holdsFireOn(state, T) && sees(state, a, m, T, now));

// ---- each lived tick ----

/** Whether the scene's fall back is called (R.house.boarding.fallback, the scene's record: D's call at two of four down). */
export const fallbackOn = (H) => !!H?.boarding?.fallback;

/**
 * A holder's tick (w; see the header), once a tick whoever calls it: from the scene's actors layer after twoTick, before opforTick. His body's
 * tween start and its record after (body/loco.js moverStart, locoStep: his walk's steps drawn), his post kept with him (staff.js's place).
 */
export function holderTick(state, bus, pid, now = state.clock.ms) {
  const H = opOf(state), Q = H?.holders, m = Q?.men?.find(x => x.pid === pid), a = actorOf(state, pid);
  if (!m || !a || H.end) return;
  if (m.tickMs === now) return;
  m.tickMs = now;
  if (H.goAtMs === null || H.goAtMs === undefined || now < H.goAtMs) return;
  moverStart(a);
  brain(state, bus, H, Q, m, a, now);
  const p = state.people[pid]?.post;
  if (p && (p.x !== a.x || p.z !== a.z)) { p.x = a.x; p.z = a.z; }
  locoStep(a, a.$px, a.$pz, { state, pid, gait: 'walk', stance: a.moveStance ?? 'combat' });
}
// (his ladder this tick (see the header): down, his tourniquet, the fall back, his face change, his walk (stopped by an armed man in
// sight), the lock, then at his post or stopped short of it his shock, his drill, his pair, his eyes)
function brain(state, bus, H, Q, m, a, now) {
  if (downTick(state, bus, H, m, a, now)) return;
  if (m.aid) { aidTick(state, bus, m, now); return; }
  if (startAid(state, m, a, now)) return;
  if (fallbackOn(H) && m.st !== 'back' && m.st !== 'in' && !m.face?.back) { startBack(state, H, m, a, now); return; }
  if (m.face) { faceTick(state, bus, H, Q, m, a, now); return; }
  if (m.walk) {
    // (an armed man in his sector on his way to his post: he stops where he stands and fights from there (v0.0.27's carried stage: he
    // walked on at low ready, finger off, while the barricade man shot him))
    if (m.st !== 'go' || (!armedInSight(state, m, a, now) && !heldUpBy(state, Q, m, a))) { walkTick(state, bus, H, Q, m, a, now); return; }
    place(a, [a.x, a.z]); delete m.walk; a.gait = 'idle';
  }
  if (m.st === 'lock') { lockTick(state, bus, H, Q, m, a, now); return; }
  if (m.st === 'go') {
    // (stopped short of his post: on to it once nothing of his is under way and no armed man is in his sight)
    if (!m.eng && !m.eyes && !m.ia && !armedInSight(state, m, a, now) && !heldUpBy(state, Q, m, a)) { startWalk(state, m, a, m.at, now, 'go'); return; }
  } else if (m.st !== 'set') return;
  else setCheck(state, bus, Q, now);
  if (shockedNow(state, m.pid, now)) { if (m.eng) m.eng = null; return; }
  if (m.ia) { iaTick(state, bus, m, now); return; }
  if (m.eng) { fireTick(state, bus, H, m, a, now); return; }
  if (m.dry) return;
  eyesTick(state, bus, H, m, a, now);
}

// (down: his stance down (woundsFast's: the knock, a collapse, or lying wounded after it); "I'm hit!" once a fall; everything of his
// dropped; his tourniquet only, his knock over (see aidTick). Returns whether he is down)
function downTick(state, bus, H, m, a, now) {
  if (a.stance !== 'down') {
    if (m.st !== 'down') return false;
    // (up again: at his post set; short of it (he fell on his way) walk on; in the lock after the fall back, in)
    delete m.downAtMs;
    if (fallbackOn(H)) { m.st = 'lock'; startBack(state, H, m, a, now); return true; }
    if (Math.hypot(a.x - m.at[0], a.z - m.at[1]) <= AT_POST_M) setInPost(state, m, a, now);
    else { m.st = 'lock'; startWalk(state, m, a, m.at, now, 'go'); }
    return true;
  }
  if (m.st !== 'down') {
    m.st = 'down'; m.fromMs = now; m.downAtMs = now;
    m.eng = null; delete m.eyes; delete m.masked; delete m.walk; delete m.face; delete m.ia;
    const k = state.people[m.pid]?.kit;
    if (k?.carry) { k.carry.posture = 'lowReady'; k.carry.finger = 'off'; }
    a.gait = 'idle';
    say(state, bus, m, 'hold:hit');
  }
  // (his tourniquet while he lies, his knock over: a limb bleeding hard)
  if (m.aid) aidTick(state, bus, m, now);
  else startAid(state, m, a, now);
  return true;
}
// (his tourniquet begun: conscious and his knock over (wounds.js downOf, the knock counted), a limb bleeding hard (aid.js tourniquetOf))
function startAid(state, m, a, now) {
  const rec = state.people[m.pid]?.body;
  if (!hasWounds(rec) || downOf(rec, now).down) return false;
  const inj = tourniquetOf(rec, now);
  if (!inj) return false;
  const i = rec.injuries.indexOf(inj);
  m.aid = { i, part: inj.part, fromMs: now, untilMs: whole(now + TQ_MS) };
  m.eng = null; delete m.eyes; delete m.masked; delete m.ia;
  const k = state.people[m.pid]?.kit;
  if (k?.carry) { k.carry.posture = 'lowReady'; k.carry.finger = 'off'; }
  return true;
}
// (his tourniquet run: knocked down again meanwhile it is cut (begun again once he can); done, aid.js applyTourniquet on that injury)
function aidTick(state, bus, m, now) {
  const rec = state.people[m.pid]?.body;
  if (!rec || downOf(rec, now).down) { delete m.aid; return; }
  if (now < m.aid.untilMs) return;
  const inj = rec.injuries?.[m.aid.i] ?? null;
  if (inj && !inj.cared) applyTourniquet(rec, inj, now);
  bus?.emit('house', { phase: 'tourniquet', who: m.pid, n: m.n, part: m.aid.part, fromMs: m.aid.fromMs, atMs: now });
  delete m.aid;
  const a = actorOf(state, m.pid);
  if (a && m.st === 'set') setInPost(state, m, a, now);
}

// ---- the walk to his post, and back (see the header, 3 and 8) ----

// (in the lock, from GO: the leader opens the inner hatch once it is undogged and walks through; the AR HOLD_FOLLOW_MS behind him, once it is open)
function lockTick(state, bus, H, Q, m, a, now) {
  if (now < whole(H.goAtMs + goMs(skillsOf(state, m.pid).wf) + (m.n - 1) * HOLD_FOLLOW_MS)) return;
  const id = m.hatch;
  if (id) {
    if (lockedOf(state, id)) return;
    if (openingState(state, id) !== 'open') {
      if (m.n !== Math.min(...Q.men.filter(x => actorOf(state, x.pid)?.stance !== 'down').map(x => x.n))) return;
      const o = openingOf(id);
      setOpening(state, id, 'open', { atMs: whole(now + Math.round((o?.openS ?? 0.5) * 1000)), how: 'push' });
      // (on the swing: doors.js doorsStep frees the leaf for sight and the nav grid when it ends, as bundle.js and toggleDoor have it;
      // without it the hatch stood open to the eye's leafClosed but shut on the cached sight grid for the whole lane, and a save,
      // which finds its moving leaves again from the deltas, went another way: the review of v0.0.27 D)
      ((state.$places ??= {}).moving ??= new Set()).add(id);
      return;
    }
    if (leafClosed(state, id, now)) return;
  }
  startWalk(state, m, a, m.at, now, 'go');
}
// (a walk begun to a point: the routing grid's way with the hatch open and the other marines' bodies kept clear (route.js routed), else
// straight; on locked boots aboard the mag walk (MAG_BOOTS.WALK_MS), else the place's walk; the trapezoid on his own legs)
function startWalk(state, m, a, to, now, st) {
  const bodies = fireTeamOf(state).filter(x => x.pid !== m.pid).map(x => actorOf(state, x.pid) ?? (playerActor(state)?.who === x.pid ? playerActor(state) : null)).filter(Boolean).map(b => ({ x: b.x, z: b.z, rM: 0.35 }));
  const pts = [[a.x, a.z], [to[0], to[1]]];
  const path = (routed(state, pts, { open: m.hatch ? [m.hatch] : [], bodies }) ?? routed(state, pts, { open: m.hatch ? [m.hatch] : [] }) ?? pts).map(p => [q(p[0], 1e-4), q(p[1], 1e-4)]);
  const len = pathLen(path), vMs = bootsOf(state, m.pid) && a.anchor === 'boots' ? MAG_BOOTS.WALK_MS : placeGaits(state).walkMs;
  m.st = st; m.fromMs = now;
  if (len < AT_POST_M) { place(a, to); arrive(state, null, holdersOf(state), m, a, now); return; }
  const legs = bodyLegsOf(state, m.pid, a.x, a.z), prof = profileOf(len, vMs, legs.pushMs2, legs.brakeMs2, { v0: 0, v1: 0 });
  m.walk = { to: [to[0], to[1]], path, prof, fromMs: now, untilMs: now + Math.round(prof.T * 1000) };
  const k = state.people[m.pid]?.kit;
  if (k?.carry) { k.carry.posture = 'lowReady'; k.carry.finger = 'off'; }
  a.gait = 'walk';
}
function walkTick(state, bus, H, Q, m, a, now) {
  const p = moveAt(m.walk, now);
  a.x = p.x; a.z = p.z; a.headRad = p.headRad; a.face = faceOfHead(a.headRad);
  if (!p.done) return;
  place(a, m.walk.to);
  delete m.walk;
  arrive(state, bus, Q, m, a, now);
}
// (at the walk's end: at his post, the AR's face change to the deckhead first; back in the lock, in)
function arrive(state, bus, Q, m, a, now) {
  a.gait = 'idle';
  if (m.st === 'back') { m.st = 'in'; m.fromMs = now; return; }
  if (m.onFace !== 'deck' && a.onFace !== m.onFace) { m.st = 'face'; m.face = { to: m.onFace, fromMs: now, untilMs: whole(now + faceMsOf(true)) }; return; }
  setInPost(state, m, a, now);
  if (Q) setCheck(state, bus, Q, now);
}
// (his face change at its end: footing.js lockOnFace (the boots checked first; refused, he stays on the face he had, set all the same))
function faceTick(state, bus, H, Q, m, a, now) {
  if (now < m.face.untilMs) return;
  const F = m.face;
  delete m.face;
  lockOnFace(state, m.pid, F.to);
  if (F.back) { startWalk(state, m, a, m.start, now, 'back'); return; }
  setInPost(state, m, a, now);
  setCheck(state, bus, Q, now);
}
// (both holders set, or the one left standing: the leader's "Set." (the AR's where the leader is down), once; the scene's send rule reads setMs)
function setCheck(state, bus, Q, now) {
  if (Q.setMs !== null) return;
  const able = Q.men.filter(x => actorOf(state, x.pid)?.stance !== 'down');
  if (!able.length || !able.every(x => x.st === 'set')) return;
  Q.setMs = now;
  say(state, bus, able[0], 'hold:set');
}
// (the fall back: off the deckhead first, then the walk back to his place in the lock, nothing fired meanwhile)
function startBack(state, H, m, a, now) {
  m.eng = null; delete m.eyes; delete m.masked; delete m.ia; delete m.walk; delete m.face;
  if (a.onFace && a.onFace !== 'deck') { m.st = 'back'; m.face = { to: 'deck', back: true, fromMs: now, untilMs: whole(now + faceMsOf(true)) }; return; }
  startWalk(state, m, a, m.start, now, 'back');
}

// ---- his rifle (see the header, 5 to 7) ----

function eyesTick(state, bus, H, m, a, now) {
  const turners = turnersOf(state);
  // (a man out of his sight past the memory: forgotten, taken in afresh when he is seen again)
  for (const key of Object.keys(m.known)) if (stale(m.seen, key, now)) delete m.known[key];
  // (his take-in under way: at its end the identification, then his pair or his eyes again)
  if (m.eyes) {
    if (now < m.eyes.untilMs) return;
    const T = turners.find(x => x.key === m.eyes.key);
    if (!T || !inSector(m, T) || !sees(state, a, m, T, now)) { delete m.eyes; return; }
    if (!m.eyes.ident) {
      const rangeM = Math.hypot(T.x - a.x, T.z - a.z), roller = rollerOf(state, m.pid, { ms: now });
      const roll = check(stream(state.meta.seed, 'holder:ident', m.pid, T.key, now), { skill: 'awareness', value: roller.value('awareness'), dc: IDENT_DC0 + Math.round(rangeM / IDENT_PER_M), mods: roller.mods('awareness', { ms: now }), pressure: 'evaluated', by: m.pid });
      if (!roll.ok) { m.eyes.untilMs = now + CHALLENGE_MS; return; }
      m.eyes.ident = true;
      m.ident[T.key] = T.face === 'noshoot' ? T.holds ?? 'hands' : T.holds ?? 'rifle';
      m.known[T.key] = now;
    }
    // (his row waits its turn (team.js planTurn: one NPC marine's plan a tick); a man he must not shoot he only watches)
    if (holdsFireOn(state, T)) { delete m.eyes; return; }
    if (!planTurn(state, m.pid, now)) return;
    delete m.eyes;
    plan(state, m, a, T, now);
    return;
  }
  let best = null;
  for (const T of turners) {
    if (!T.live || !inSector(m, T) || !sees(state, a, m, T, now)) continue;
    remember(m.seen, T.key, now);
    // (a man down is no contact: seen, never taken in nor called (the review of v0.0.27: the AR's "Contact!" after "Set." on the
    // barricade man the leader had put down before it, five sheets of six); up again, he is a fresh take-in)
    if (holdsFireOn(state, T) === 'down') continue;
    const dM = Math.hypot(T.x - a.x, T.z - a.z);
    if (!best || dM < best.dM) best = { T, dM };
  }
  if (!best) { aimSector(a, m); return; }
  const T = best.T;
  if (m.known[T.key] !== undefined) {
    // (a man he knows and may shoot: his row, its turn come)
    if (!holdsFireOn(state, T) && planTurn(state, m.pid, now)) plan(state, m, a, T, now);
    return;
  }
  // (a take-in: react.js's, on his own eyes; 'sector' where his rifle is laid within SECTOR_HALF_DEG of the man, else 'alert')
  const laid = Math.abs(wrap(bearing([a.x, a.z], T.x, T.z) - (a.headRad ?? 0))) <= rad(SECTOR_HALF_DEG);
  const t = takeInMs(state, m.pid, { id: `hold:${m.n}:${T.key}`, targets: [{ key: T.key, x: T.x, z: T.z, rangeM: q(best.dM, 0.01), face: T.face }], seenMs: now, expect: { [T.key]: laid ? 'sector' : 'alert' } });
  m.eyes = { key: T.key, seenMs: now, untilMs: whole(now + t.ms), expect: laid ? 'sector' : 'alert' };
  if (!m.said[T.key]) { m.said[T.key] = now; say(state, bus, m, m.n === 1 ? 'hold:forward' : 'hold:contact'); }
}
// (his rifle laid down his sector, his head on its aim (nobody to shoot))
function aimSector(a, m) {
  const h = q(bearing(m.at, m.aimAt[0], m.aimAt[1]), 1e-6);
  if (a.headRad !== h) { a.headRad = h; a.face = faceOfHead(h); }
}
// (a pair on a man: rowPlan's parts from now, his rifle off safe and aimed, his head on the man)
function plan(state, m, a, T, now) {
  const gunId = gunOn(state, m.pid), gun = state.items?.[gunId];
  if (!gun) return;
  const target = { ...turnerTargets(state, now).find(t => t.key === T.key), dM: Math.hypot(T.x - a.x, T.z - a.z) };
  a.headRad = q(Math.atan2(T.z - a.z, T.x - a.x), 1e-6); a.face = faceOfHead(a.headRad);
  const P = rowPlan(state, m.pid, 'shot:pair', target, { atMs: now, gunId, odds: false });
  if (!P) return;
  gun.mode = 'semi';
  const k = state.people[m.pid].kit;
  k.carry.posture = 'aimed'; k.carry.finger = 'on';
  const rounds = P.parts.filter(p => p.k === 'round');
  m.eng = { key: T.key, row: 'pair', rounds: rounds.map(p => ({ atMs: whole(now + p.at), part: p.part, follow: p.follow ?? 0, climbK: p.climbK ?? 1, i: p.i, n: rounds.length })) };
}
// (his rounds at their times: each first held while a marine masks his line ("Line!" once a hold), cut on a man he must not shoot or who
// left his sector or his sight; handed to the lane's shot path (the host's houseShot, as your #2's are); a stoppage his drill)
function fireTick(state, bus, H, m, a, now) {
  const E = m.eng, T = turnersOf(state).find(x => x.key === E.key), gunId = gunOn(state, m.pid);
  const first = E.rounds.find(r => !r.done);
  if (!T || !gunId || !first) { endPair(state, bus, H, m, a, T, now); return; }
  if (first.atMs > now) return;
  if (holdsFireOn(state, T) || !inSector(m, T) || !sees(state, a, m, T, now)) { endPair(state, bus, H, m, a, null, now); return; }
  // (never through a marine: the rest of the fire team, each body on his line from his muzzle's tip to the man)
  const others = fireTeamOf(state).filter(x => x.pid !== m.pid).map(x => (playerActor(state)?.who === x.pid ? playerActor(state) : actorOf(state, x.pid))).filter(Boolean);
  if (others.some(b => maskedBy(state, m.pid, a, T, b))) {
    if (!m.masked) { m.masked = { since: now }; say(state, bus, m, 'line'); (m.holds ??= 0); m.holds += 1; }
    for (const r of E.rounds) if (!r.done) r.atMs = Math.max(r.atMs, now + TICK_MS);
    return;
  }
  if (m.masked) { delete m.masked; for (const r of E.rounds) if (!r.done) r.atMs = Math.max(r.atMs, whole(now + 150)); return; }
  for (const r of E.rounds) {
    if (r.done || r.atMs > now) continue;
    r.done = true;
    const target = { ...turnerTargets(state, now).find(t => t.key === T.key), dM: Math.hypot(T.x - a.x, T.z - a.z) };
    a.headRad = q(Math.atan2(T.z - a.z, T.x - a.x), 1e-6); a.face = faceOfHead(a.headRad);
    const { shot } = resolveShot(state, bus, { pid: m.pid, gunId, target, part: r.part, follow: r.follow, climbK: r.climbK, log: false, atMs: now, row: { id: 'shot:pair', n: r.n, i: r.i } });
    if (shot.fired) {
      m.fired += 1;
      m.shots.push({ id: shot.id, atMs: now, key: T.key, hit: shot.zone !== null && shot.zone !== undefined && !!shot.hole?.at });
      if (m.shots.length > 20) m.shots.splice(0, m.shots.length - 20);
      if (m.shots.at(-1).hit) m.hits += 1;
    }
    hostOf(state).houseShot(state, bus, shot);
    if ((!shot.fired && shot.why !== 'safety') || shot.stoppage) { startDrill(state, bus, m, now); return; }
    // (one round a tick: the next waits its own time)
    break;
  }
  if (E.rounds.every(r => r.done)) endPair(state, bus, H, m, a, T, now);
}
// (a pair over: another on the same man while he is seen, up, in the sector and may be shot, its turn come; else back on the sector)
function endPair(state, bus, H, m, a, T, now) {
  m.eng = null; delete m.masked;
  const gun = state.items?.[gunOn(state, m.pid)];
  if (gun && (gunField(gun, 'locked') || !gun.mag || (state.items[gun.mag]?.n ?? 0) <= 0) && gunField(gun, 'chamber') !== 'live') { startDrill(state, bus, m, now); return; }
  if (T && !holdsFireOn(state, T) && inSector(m, T) && sees(state, a, m, T, now) && planTurn(state, m.pid, now)) { plan(state, m, a, T, now); return; }
  const k = state.people[m.pid]?.kit;
  if (k?.carry) k.carry.finger = 'off';
  aimSector(a, m);
}
// (his drill begun: two.js twoDrillOf's by what his rifle shows, its time the sub-steps' at his Weapon handling; "Gun down!" or "Reloading!".
// A reload with no magazine left that holds a round (kit.js sparesOf) is none: his rifle is dry for good (m.dry), he holds his post with
// it, fires no more and says nothing more (my call: no transition to his P-12 this round; the passage is your pair's then))
function startDrill(state, bus, m, now, tries = 1) {
  m.eng = null; delete m.masked; delete m.ia;
  const gunId = gunOn(state, m.pid), gun = state.items?.[gunId];
  const macro = gun ? twoDrillOf(state, gun) : null;
  if (!macro) return;
  if (macro.startsWith('reload') && !sparesOf(state, m.pid, modelOf(gun).fam).some(id => (state.items[id]?.n ?? 0) > 0)) { m.dry = now; return; }
  const roller = rollerOf(state, m.pid, { ms: now }), list = subsOf(macro, beliefOf(state, gunId));
  const ms = list.reduce((s, x) => s + actionMs(roller, gun, x, { tempo: tempoFor(x, 'normal') }), 0);
  const k = state.people[m.pid].kit;
  k.carry.finger = 'off'; k.carry.posture = 'lowReady';
  m.ia = { macro, fromMs: now, untilMs: whole(now + ms), list, tries };
  say(state, bus, m, macro.startsWith('reload') ? 'reloading' : 'gunDown');
}
// (his drill at its end: each sub-step done unforced on his stream; his rifle working, "Gun up!" (a reload's "Up."); else again, at most HOLD_TRIES)
function iaTick(state, bus, m, now) {
  if (now < m.ia.untilMs) return;
  const D = m.ia, gunId = gunOn(state, m.pid);
  delete m.ia;
  if (!gunId) return;
  for (const action of D.list) doAction(state, bus, { pid: m.pid, gunId, action, tempo: tempoFor(action, 'normal'), pressure: 'evaluated', log: false, rng: 'holder', deferSay: true });
  const gun = state.items[gunId], ok = gunField(gun, 'chamber') === 'live' && !gunField(gun, 'jam');
  if (!ok && D.tries < HOLD_TRIES) { startDrill(state, bus, m, now, D.tries + 1); return; }
  if (ok) say(state, bus, m, D.macro.startsWith('reload') ? 'up' : 'gunUp');
  const k = state.people[m.pid].kit;
  if (k?.carry) k.carry.posture = ok ? 'aimed' : 'lowReady';
  if (!ok) m.dry = now;
}
