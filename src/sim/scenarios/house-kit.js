// OLYMPUS scenarios: the shoot house's kit, second slice (D2): the instructor's reads applied, the brief's intelligence, the five, the run sheet's kit marks, the breach rounds (COMBAT §25.20; the build sheet 0.0.19 §3.1, §0 items 2, 16, 19, 23).
//
// readsTick(state, bus, R, H, now) runs in houseRules after the bursts (burst.js tickDevices): each practice burst's Read
// (practice.js, on R.house.bursts[i].read) is applied once (`applied`), on the leg of the door it was thrown through:
//   - a stand the read puts down is the instructor's hand on the turner: stopped at the burst, T.downBy the live twin ('g9',
//     'g13'), turned away SENSOR_MS after, the 'turner' fact (why 'read'), so the clear gate and the 'standing' fault count it
//     down and the lane goes on as the live grenade would have left it (the user's question 2's default: turned away);
//   - a stand it stuns is dazed (T.dazeUntilMs, the turn and the par wait on it: one source, burst.js step 3 skipped for it);
//   - every ball on a stand is a hit record { by: 'frag', burst, n, part: null } (`burst` an item id, never `burstId`: the
//     save's id walk), so a no-shoot fragged counts hit on the card;
//   - the faults: 'fragged' (a G-9's read with a no-shoot or the hostage in the room, by its truth: "You never frag a family."),
//     'concussed' (a no-shoot or the hostage injured by a G-13's), 'burst' (a ball on a man of the stack), 'exposed' (the throw's
//     exposure past the house's par); a ball count of FRAG_DOWN_N on the stack or EARDRUM50_KPA is the cease fire, returned as
//     'burst' for houseRules to end the lane on (its card: "CEASE FIRE: IN THE ROOM AT THE BURST", or "CEASE FIRE: AT YOUR FEET"
//     for a grenade slipped at the thrower's feet, the read's `cease` 'room' or 'feet' saying which);
//   - the marks on the leg's row (practice.js readMarks): "FRAG IN ROOM 1: 1A DOWN, 1B DOWN", "1A STUNNED 3.2 S", and from the
//     Sergeant up "UNCOOKED 3.8 S" with the instructor's "A live man throws that back. Cook it."; the leg's L.throws gains
//     { by, atMs, exposedMs, at: null };
//   - a clean frag is the instructor's "Good frag: both men down." (counted, never the stands' ids: v0.0.22's fixer); a BC-1's door off its hinges his "Hinges cut. Go." (B.said).
// A role-player (T.live) is never turned away by a read (§0 item 23: L's rebase rules him out 'frag'); the read's verdict on him is
// kept, T.live.fragOut 'down' | 'wounded' (v0.0.20's hunt fix), which the run sheet counts DOWN or WOUNDED as the FRAG row says.
// intelOf(state) is the brief's intelligence when the loadout carries a G-9P or G-13P: { [door]: 'hostiles' | 'unknown' }, a room
// 'hostiles' only when its drawn faces hold no no-shoot and no hostage card (room 1 on the seeds where 1b is a threat), the hall
// never a frag's room; the instructor says it at the brief (shoothouse.js kitWords). This is what the player is told ("we only
// know what we know"); the read judges by the truth of the burst. fiveOf(state) was AT THE DOOR's five for the lane ('breach' on
// a lane whose loadout carries a charge or a tool); from v0.0.20 Breach is on 5 on every lane (groups.js) and it returns null,
// inert, so testShoothouse's call writes nothing and v0.0.18's and v0.0.19's saves load as they were. kitMarks(state, H, views, { card, one }) is the run sheet's
// spread: {} on a lane with nothing of D2's; the card's cease fire head and the hot wash's one thing where a D2 fault outweighs
// the run's own worst (fragged 95, burst 120, concussed 85, through 80, exposed 35 a fault; my calls beside oneThing's).
// breachShot(state, bus, shot) records a ballistic breach's round (bundle.js useDoorShot, set here, and shoothouse.js houseShot's
// guard): the issue's count, the session's shots with the row 'shoot:door' (never a miss on the paper, never the target view),
// the brass, a stoppage and the dummy as any round; a round through the leaf flat (under THROUGH_DEG) is the fault 'through',
// a no-shoot or the hostage struck past the leaf the 'noshoot' or 'hostage' fault "through the door", a threat struck a neutral
// mark "1A HIT THROUGH THE DOOR" (a fragment never stops a turner).
// Pure but readsTick and breachShot, which write the stands, the legs and the faults.
import { playerId } from '../../core/ids.js';
import { hashPick } from '../../core/hash.js';
import { turnAway, TURN_MS } from '../arms/turners.js';
import { DEVICES } from '../arms/devices.js';
import { loadoutOf } from '../arms/loadout.js';
import { BRASS_LIVE } from '../arms/look.js';
import { rungOf } from '../skills/templates.js';
import { readMarks, FRAG_DOWN_N, EARDRUM50_KPA } from '../combat/practice.js';
import { BREACH_SAFE_KPA } from '../arms/blast.js';
import { useDoorShot, useLaneFive, doorSwing, planOf } from '../combat/bundle.js';
import { HOUSE_CHIEF } from '../../data/courses.js';
import { houseFault, chiefSays, curLeg, SENSOR_MS } from './shoothouse.js';
import { ruleOut } from './opfor.js';

/** A breach round through the leaf flatter than this is a round into the room (degrees; the doctrine's 45 down, my call on the bound). */
export const THROUGH_DEG = 20;
/** The cook note's rung: from the Sergeant up (kit2 §2.4). */
export const COOK_NOTE_RUNG = 3;
/** The hot wash's weights of D2's faults (see the header). */
export const ONE_WEIGHTS = Object.freeze({ burst: 120, fragged: 95, concussed: 85, through: 80, exposed: 35 });

// (no hall on the Wreck, H.hall null)
const legsOf = (H) => (H ? [...H.rooms, ...(H.hall ? [H.hall] : [])] : []);
const fill = (line, map) => Object.entries(map).reduce((t, [k, v]) => t.replaceAll(`{${k}}`, String(v)), line);
const pick = (state, lines, ...key) => hashPick(lines, 'house-chief', state.meta.seed, ...key);
const listWords = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);
// (the men a frag put down in words, counted: "one man", "both men", "three men")
const MEN_NUM = Object.freeze(['no', 'one', 'two', 'three', 'four', 'five', 'six']);
export const menWords = (n) => (n === 1 ? 'one man' : n === 2 ? 'both men' : `${MEN_NUM[n] ?? n} men`);

/** The reads applied (w; see the header): 'burst' when a read calls the cease fire, else null. */
export function readsTick(state, bus, R, H, now) {
  let cease = null;
  // (the cutting charge's door off its hinges: the instructor's "Hinges cut. Go.", once)
  // (a push door's BC-1 is on its latch edge (breach.js chargeFor), so there the hinges are not what it cut: "Latch cut. Go.")
  for (const B of H.bursts ?? []) if (B.model === 'bc1' && B.door && !B.said) { B.said = true; chiefSays(state, bus, doorSwing(state, planOf(state, B.door))?.how === 'pull' ? HOUSE_CHIEF.cut : HOUSE_CHIEF.cutLatch, 'cut', B.id); }
  for (const B of H.bursts ?? []) {
    const read = B.read;
    if (!read || read.applied) continue;
    read.applied = true;
    const door = B.thrown ?? null, L = (door ? legsOf(H).find(x => x.door === door) : null) ?? legsOf(H).find(x => x.room === read.room) ?? curLeg(H);
    const down = [];
    for (const [key, s] of Object.entries(read.stands)) {
      const T = R.turners.find(t => t.key === key);
      if (!T) continue;
      // (a role-player is ruled out by the read, never turned away: the build sheet 0.0.19 §0 item 23)
      // (a stun short of that is his combat block's, as burst.js gives a real one: rpShocked reads it, nothing new from him till it ends)
      if (T.live) {
        // (the read's verdict kept on him (T.live.fragOut 'down' | 'wounded'), so the LIVE row and the card count him as the FRAG
        // row names him: the hunt of v0.0.20 (frag-down) read "LIVE: 0 DOWN" beside "FRAG IN ROOM 2: 2A DOWN" on the sergeant's frag lane)
        if (s.out === 'down' || s.out === 'wounded') { if (ruleOut(state, bus, T, 'frag')) T.live.fragOut = s.out; }
        else if (s.stunMs) { const a = state.actors?.list?.find(x => x.who === T.live.who); if (a) { const c = (a.combat ??= { supp: 0, suppAtMs: read.atMs, suppRate: 2, startleFromMs: null, startleUntilMs: null, blindUntilMs: null, dazzleUntilMs: null, deafUntilMs: null }); c.stunUntilMs = Math.max(c.stunUntilMs ?? 0, read.atMs + s.stunMs); } }
        continue;
      }
      if (s.n >= 1) (T.hits ??= []).push({ by: 'frag', burst: B.id, n: s.n, part: null });
      if (s.out === 'down' && (T.stoppedAtMs === null || T.stoppedAtMs === undefined)) {
        T.stoppedAtMs = read.atMs; T.downBy = read.as;
        turnAway(T, read.atMs + SENSOR_MS);
        bus?.emit('turner', { key: T.key, lane: T.lane, phase: 'away', face: T.face, atMs: T.awayAtMs ?? read.atMs + SENSOR_MS, toMs: (T.awayAtMs ?? read.atMs + SENSOR_MS) + TURN_MS, why: 'read' });
        down.push(T.stand);
      } else if (s.stunMs) T.dazeUntilMs = Math.max(T.dazeUntilMs ?? 0, read.atMs + s.stunMs);
    }
    const rung = rungOf(state, playerId(state), 'room'), marks = readMarks(read, { parMs: H.parMs ?? Infinity, cookNote: rung >= COOK_NOTE_RUNG });
    if (L) (L.kit ??= []).push(...marks.map(m => m.text));
    // (the leg's throws: who threw, when it went, how long he showed himself (the read's exposure); `at` the stand it was meant for, none yet)
    if (L) (L.throws ??= []).push({ by: B.byId ?? null, atMs: B.atMs, exposedMs: read.exposed?.ms ?? 0, at: null });
    // (the faults, once each a burst, by the read)
    const faults = new Set(marks.map(m => m.fault).filter(Boolean));
    if (faults.has('fragged')) {
      const who = Object.values(read.stands).some(s => s.face === 'hostage' && read.noncombatants.includes(s.stand)) ? 'hostage' : 'no-shoot';
      const t = fill(pick(state, HOUSE_CHIEF.fragged, 'fragged', B.id), { who });
      houseFault(state, bus, 'fragged', t.charAt(0).toUpperCase() + t.slice(1), L);
    }
    if (faults.has('concussed')) houseFault(state, bus, 'concussed', HOUSE_CHIEF.concussed, L);
    if (faults.has('exposed')) houseFault(state, bus, 'exposed', HOUSE_CHIEF.exposed, L);
    const stack = Object.values(read.stack ?? {}).filter(Boolean);
    if (faults.has('burst')) houseFault(state, bus, 'burst', null, L);
    // (D1's 'blast', the stack over BREACH_SAFE_KPA, for a practice grenade's read too: one quantity, one fault (§0 item 19))
    const worst = Math.max(0, ...stack.map(b => b.kPa));
    if (worst > BREACH_SAFE_KPA) { if (L) (L.kit ??= []).push(`STACK IN THE BLAST ${Math.round(worst)} KPA`); houseFault(state, bus, 'blast', HOUSE_CHIEF.stackBlast, L); }
    // (the cease fire said where the burst was: in the room, or at the thrower's feet where a slip left it (the card's head too))
    const hit = (b) => !!b && (b.n >= FRAG_DOWN_N || b.kPa >= EARDRUM50_KPA);
    if (stack.some(hit)) { cease = 'burst'; read.cease = B.atFeet ? 'feet' : 'room'; chiefSays(state, bus, !B.atFeet ? HOUSE_CHIEF.burst : hit(read.stack?.me) ? HOUSE_CHIEF.burstFeet : HOUSE_CHIEF.burstFeetTwo, 'burst', B.id); }
    else if (read.as === 'g9' && !read.fragged && down.length) chiefSays(state, bus, fill(pick(state, HOUSE_CHIEF.fragGood, 'fragGood', B.id), { list: menWords(down.length) }), 'fragGood');
    if (read.uncookedMs && rung >= COOK_NOTE_RUNG && !cease) chiefSays(state, bus, HOUSE_CHIEF.uncooked, 'uncooked', B.id);
  }
  return cease;
}

/** The brief's intelligence (see the header): { [door]: 'hostiles' | 'unknown' }, or null when the loadout carries no G-9P or G-13P. */
export function intelOf(state) {
  const R = state.armoury?.range, H = R?.house, spec = H?.loadout ? loadoutOf(H.loadout) : null;
  if (!spec || spec.error) return null;
  const places = Object.values(spec).filter(Array.isArray).flat();
  if (!places.some(p => DEVICES[p]?.as)) return null;
  const out = {};
  for (const L of H.rooms) out[L.door] = (R.turners ?? []).some(T => T.room === L.room && (T.face === 'noshoot' || T.face === 'hostage')) ? 'unknown' : 'hostiles';
  return out;
}
/**
 * AT THE DOOR's five for the lane (see the header): null on every lane from v0.0.20 (the build sheet's item 5, §0 item 16: Breach
 * is on 5 everywhere, groups.js SITUATIONS.door, so nothing per lane is written; testShoothouse's call writes nothing).
 */
export const fiveOf = (state) => null;

/** The intelligence in the instructor's words for the brief (shoothouse.js kitWords): '' with none. */
export function intelWords(state) {
  const H = state.armoury?.range?.house, I = H?.intel;
  if (!I) return '';
  const rooms = H.rooms.map((L, k) => (I[L.door] === 'hostiles' ? `room ${k + 1}` : null)).filter(Boolean);
  const said = rooms.length ? fill(pick(state, HOUSE_CHIEF.intel, 'intel'), { rooms: listWords(rooms) }) : pick(state, HOUSE_CHIEF.intelNone, 'intel');
  return ` ${pick(state, HOUSE_CHIEF.practice, 'practice')} ${said}`;
}

// (the run's own worst one thing's score, as shoothouse.js oneThing weighs it, for the key it chose)
function ownScore(H, views, key) {
  const n = (kind) => views.reduce((a, V) => a + V.faults.filter(f => f.kind === kind).length, 0);
  const W = { hostage: 100, noshoot: 90, muzzle: 70, standing: 60, corner: 25, door: 20, time: 15 };
  if (W[key]) return n(key) * W[key];
  if (key === 'par') return views.reduce((a, V) => a + (V.parMissedMine ?? V.parMissed), 0) * 40;
  if (key === 'funnel') return n('funnel') * 30 + Math.round(views.reduce((a, V) => a + V.doorwayMs, 0) / 100);
  if (key === 'dummy') return H.dummy.clickAtMs !== null ? (H.dummy.clearedAtMs === null ? 50 : Math.round((H.dummy.clearedAtMs - H.dummy.clickAtMs) / 200)) : 0;
  return 0;
}
/** The run sheet's kit spread (see the header): {} on a lane with nothing of D2's, else { card?, one? }. */
export function kitMarks(state, H, views, { card = null, one = null } = {}) {
  const out = {};
  const feet = (H?.bursts ?? []).some(b => b.read?.cease === 'feet');
  if (H?.end?.why === 'burst' && card !== null) out.card = `CEASE FIRE: ${feet ? 'AT YOUR FEET' : 'IN THE ROOM AT THE BURST'} · ${card}`;
  const n = (kind) => views.reduce((a, V) => a + V.faults.filter(f => f.kind === kind).length, 0);
  const mine = Object.entries(ONE_WEIGHTS).map(([k, w]) => [k, n(k) * w]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  // (the one thing's own score where it gives one (shoothouse.js oneThing: its causes 'par:<cause>', the dummy against its book))
  if (mine.length && one && mine[0][1] > (Number.isFinite(one.score) ? one.score : ownScore(H, views, one.key))) {
    const key = mine[0][0], words = key === 'burst' && feet ? HOUSE_CHIEF.one.burstFeet : HOUSE_CHIEF.one[key];
    out.one = { key, text: hashPick(words, 'house-chief', state.meta.seed, 'one', key) };
  }
  return out;
}

/** A ballistic breach's round recorded (w; see the header). */
export function breachShot(state, bus, shot) {
  const R = state.armoury?.range, H = R?.house;
  if (!R || !H || !shot) return;
  const pid = playerId(state), mine = (shot.who ?? pid) === pid, now = state.clock.ms, L = legsOf(H).find(x => x.door === shot.door) ?? curLeg(H);
  if (shot.fired && mine) {
    const issue = state.armoury.ammoIssues.find(a => a.id === R.issueId);
    if (issue) issue.fired += 1;
    R.shots.push({ id: shot.id, atMs: shot.atMs, lane: null, string: 0, hole: null, score: 0, v: false, logSeq: shot.logSeq ?? null, key: null, load: shot.load ?? null, row: 'shoot:door', part: 'thing', door: shot.door, grade: shot.roll?.grade ?? null, ...(shot.breach ? { pitchDeg: shot.breach.pitchDeg } : {}) });
    if (R.shots.length > 100) R.shots.splice(0, R.shots.length - 100);
    if (!R.hot && !R.end) houseFault(state, bus, 'cold', null);
    if (shot.brassRec) { R.brass.push(shot.brassRec); if (R.brass.length > BRASS_LIVE) R.brass.splice(0, R.brass.length - BRASS_LIVE); }
    if (H.goAtMs !== null) H.stallAtMs = now;
  }
  // (a click at the lock is the dummy's, a stoppage the card's: as any round (shoothouse.js houseShot))
  if (mine && ((!shot.fired && shot.why === 'dud') || shot.stoppage)) {
    R.stoppage = { atMs: shot.atMs, kind: shot.set ?? (shot.stoppage === 'double' ? 'double' : shot.stoppage ? 'stovepipe' : 'dud'), set: !!shot.set, cleared: false };
    if (shot.set && H.dummy.clickAtMs === null) H.dummy.clickAtMs = shot.atMs;
  }
  if (!shot.fired || !shot.breach) return;
  const b = shot.breach;
  if (b.through && b.pitchDeg < THROUGH_DEG) houseFault(state, bus, 'through', HOUSE_CHIEF.through, L);
  const T = b.struck ? R.turners.find(t => t.key === b.struck) : null;
  if (!T) return;
  (T.hits ??= []).push({ shotId: shot.id, part: 'thing', zone: null, ring: false, through: true, at: null, atMs: shot.atMs, by: mine ? 'me' : 'two', via: 'door' });
  if (T.face === 'noshoot' || T.face === 'hostage') houseFault(state, bus, T.face === 'noshoot' ? 'noshoot' : 'hostage', HOUSE_CHIEF.through, L);
  else if (L) (L.kit ??= []).push(`${String(T.stand).toUpperCase()} HIT THROUGH THE DOOR`);
}

// (the scene's hooks: the breach rounds recorded here, the lane's five read here (bundle.js), set as the module loads)
useDoorShot(breachShot);
useLaneFive(fiveOf);
