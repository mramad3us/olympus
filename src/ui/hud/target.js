// OLYMPUS hud: the target view, when the hit card opens, on whom and for how long (VIEWS §7.7; COMBAT §25.18.4; the build sheet 0.0.18 §2.2, §8 item 14).
//
// The user, 2026-11-15 (DESIGN.md's log): "we need to generalize that target view for every time we're engaging something or
// someone", and the people in it "rendered ... as we see them, meaning with their gear". hud/hitcard.js keeps the DOM, the fit and
// the paint; this module chooses, in three modes:
//   'string' (test-stress, "Bang", scored 100 on 2026-11-15): main.js hitHud's v0.0.17 logic moved here verbatim, its lifecycle
//            as scored: during a string the belief of the turners of that string fired at, at the pause in stop motion and
//            HIT_HOLD_MS after its last change or the mode's end out of it; from the string's end to the next the truth; two hit,
//            the brackets' pick if it is one, else the newest, with tabs;
//   'lane'   (the shoot house): whenever you engage a stand (src/sim/arms/engage.js engagedOf: the row or Fire under way, the
//            aim, the bracket at a pause once your take-in has seen it), the stand as your take-in identified it (engage.js
//            seenFace, never its record) with your rounds' marks (marks.js hitMarks' house branch: belief through the lane);
//            after, hitShown's rule (in stop motion, or HIT_HOLD_MS of real time after its last change out of it), the target
//            the last engaged, else your last round that struck (struckLast); closed when the stand has turned away (after a
//            room's "Clear!") and is not engaged, and from the lane's end (R.end) on the HUD (the truth phase and your #2's
//            marks are kept for the house's end card, whose truth cards are not built yet: the build sheet's C4). A stand's card
//            is the house's alone: the bay's turners off "Bang" and paper open nothing.
//            Two stands of the room struck: tabs, newest first, by stand ('1a', '1b');
//   'free'   (every scene but "Bang": test-handling, test-range, the bay, the barracks; and a man in the house): a live man
//            engaged, drawn in his own colours in the gear he wears now (src/sim/arms/gear.js gearOf, seen by you), his name, no marks this round (a round at a person is the range's safety
//            stop; WEAPONS §8.7's records come with test-breach), held HIT_HOLD_MS out of stop motion only: in stop motion, or
//            while the stop names your paper or a bay turner, a man no longer engaged closes at once.
// v0.0.19 (the build sheet 0.0.19 §1 L-look; opfor §2.6): THE LIVE MAN. A role-player rides R.turners with `live`; engage.js gives
// him as a person (his stand's key, his pid). In the house he is held as a stand is (hitShown's rule after the engagement, your last
// round on him included), closed once he is ruled out ('out') and not engaged. His marks are the house's (marks.js hitMarks: belief
// until R.end, then truth) drawn as paint (art's PAINT_C: the stack's rounds in the cadre's pink), the words the state your take-in
// read (STATE_WORDS) before the marks' own.
// v0.0.23 (the build sheet v0.0.23 items 1 to 5; the user's note of 2026-11-17: "the portraits need to be more dynamic and show us
// what we would be seeing, including what they are holding"): every card's subject carries the Seen record (src/sim/people/seen.js:
// seenOf for a man, as your eye is shown him now, his hold, his pose, his facing from you; standSeen for a board, its gun where the
// stage paints it), drawn by src/art/doll/portrait.js. liveGear is retired (rule V1, the build sheet §0 item 2): the card draws in a
// man's hands what the stage draws in them, the take-in's read stays in the words ("HANDS NOT SEEN · 2A"), so the card never
// contradicts the picture; a board's stage paints nothing in the hands until identified, so neither does its card. The signature
// carries the record's key (`rec.key` as m.subject.key), so the card repaints the frame he raises, aims, kneels, gives up or turns,
// and never otherwise. warm() paints what a scene's men can show at its load (each role-player in his holds and poses, your #2 in his
// carries, the boards' faces at the house's place), the rest one new doll a frame.
// The aim's dwell (the review of 2026-11-18): a man's aim crossing AIM_AT_RAD (seen.js, no hysteresis) flicked the card between
// end on and across the chest for a single tick (50 ms: the tier one's live:hide,give, 2a you, away, you), a repaint and a doll
// swapped each time. The view holds the aimed variant it shows ('you' or 'away') for AIM_DWELL_MS before it shows the other
// (readers.aims, the view's memory by man; targetModel without it is the record as seenOf gives it): raising, lowering, kneeling or
// turning are never held, only the one aim's side, so the card lags the stage's aim by at most AIM_DWELL_MS and never flicks.
// v0.0.24 (the build sheet v0.0.24 item 16, §0 item 15): the card in his light and behind the jamb. The man the card shows is read
// with { cover: true } (seen.js coverOf's COVER_RAYS through the walls from your eye, once a frame of the page for that one man,
// never in a tick), and a house's board gets its stand's light and cover the same way (seen.js lightOf, coverAt at the stand), so
// room 3's dim draws its card darker and a stand half behind a jamb half drawn; "Bang"'s cards are the string's, read as scored.
// v0.0.25 (the build sheet item 12; PC§5): a man or a board upside down to you is drawn as you see him: the record's roll (seen.js:
// the quarter turns between his up and yours, a stand's by its onFace) turns the card (R-a, art/doll/hitcard.js through portrait.js
// turnRegion), its signature with it; R-b keeps it upright and names his face (rollWords).
// v0.0.26 (the build sheet items 6 and 9, §3.3; "Bang, then go"): a role-player dazed or cowering is drawn so (seen.js's pose 'daze',
// 'dazeKneel' or 'cower', warmed at the load: WARM_HOLDS), his words the take-in's DAZED or COWERING; and a man searched ("Search him",
// contact.js's 20 s row after the room's "Clear!": T.live.searched) is shown in truth before the lane's end, every mark where it struck
// (marks.js hitMarks in contact.js cardPhaseOf's phase, A's one reader: belief until his search's end or the lane's), his words "SEARCHED" and the would-have's verdict from the ledger (searchedWords: the first fatal
// strike's "WOULD HAVE BEEN FATAL: THE CHEST", else a wound's "A WOUND: <where>", else "HIS SOFT PANEL STOPPED ONE"; never a number).
// v0.0.27 (its build sheet item 16, §3.5; "Away the boarding party"): a man aboard firing blind or down in free fall is drawn so
// (seen.js's pose 'blind' or 'downFree'), his words FIRING BLIND or DOWN. The boarding's warm set is its own (WARM_BOARD): the holds a
// man aboard can take, the seat left out (at 0 G a man down hangs from his boots: 'downFree'), blind fire and the 0 G down in; an
// unarmed crewman's empty-handed and hands-up holds only (WARM_CREW); at the near band only (the deck is 12 × 10 m: a man past 10 m
// paints his doll on a frame of its own, as any card does), so the scene's dolls stay inside DOLL_LRU (art/doll/dress.js).
// paintOn(state, who) is the role-players' paint on a marine (R.house.live.struck) as card marks in blue, for a card of you or
// your #2 (the casualty's).
// Nothing pops: the card repaints only when its signature changes, and a man's dressed doll not yet painted is painted on a
// frame of its own (the card keeps what it showed for that frame), so no frame paints more than one new doll.
//   targetModel(state, { key, kind, who, phase, tabs, readers })   paintHitcard's model for a target (pure but the readers)
//   targetShown({ engaged, phase, n, inStop, lastT, nowT })        whether it shows (pure)
//   createTargetView({ card, readers })                            → { frame(state, { hidden, inStop, ui, seen, now }) → words, warm(state),
//                                                                    stringModel(state, key, k, phase, tabs), reset() }
// readers (main.js's, read once a tick): pairsOf(s) (pairs.js pairsNow), marksOf(s, key, k, phase) (hitMarks), meAt(s).
import { cardModel, hitShown, hitTabs, hitRangeM, HIT_LOOK } from './hitcard.js';
import { hitDollReady, warmHitcard, bandOf, HIT_BANDS } from '../../art/doll/hitcard.js';
import { paintPortrait, BOARD_PLACES, PORTRAIT_PICKS, ROLL_FACE_WORDS, ROLL_NAMED } from '../../art/doll/portrait.js';
import { engagedOf, struckLast, seenFace, seenState, liveRecOf } from '../../sim/arms/engage.js';
import { seenOf, standSeen, seenKey, lightOf, coverAt, paintKey } from '../../sim/people/seen.js';
import { lookFor, indoorsNow } from '../../sim/people/figure.js';
import { eyeOf, visibility } from '../../sim/people/perception.js';
import { hostKind, alwaysDrawn, seenEver } from '../../sim/places/known.js';
import { STATE_WORDS } from '../plaque.js';
import { wouldOn, WOULD_WHY } from '../../sim/combat/would.js';
import { cardPhaseOf } from '../../sim/combat/contact.js';
import { LAYERS } from '../../sim/arms/penetrate.js';

/** The target view's modes (see the header). */
export const TARGET_MODES = Object.freeze(['string', 'lane', 'free']);
/** The words before a stand's when its hands were not seen (COMBAT §25.4.6: "can't see his hands"). */
export const UNSEEN_WORDS = 'HANDS NOT SEEN';
/** A man's words while his give is under way, his rifle not yet on the floor (v0.0.26). */
export const GIVING_WORDS = 'GIVING UP';

/** The state a take-in read of a live man, as the card says it: the plaque's words (one formatter). */
export { STATE_WORDS };

/** How long the card holds the side of an aim it shows ('you' end on, 'away' across the chest) before it shows the other, game ms (see the header). */
export const AIM_DWELL_MS = 300;
/**
 * The record with its aim's side held (see the header): aims, a Map who → { aimAt, atMs } (the view's); the record as given when
 * not aimed, when the side is the one shown, or when the side shown has been shown AIM_DWELL_MS; else the side shown, its key with it.
 */
export function aimHeld(rec, who, ms, aims) {
  if (!aims || !rec) return rec;
  const was = aims.get(who);
  if (!rec.aimAt) { aims.delete(who); return rec; }
  if (was && was.aimAt !== rec.aimAt && ms >= was.atMs && ms - was.atMs < AIM_DWELL_MS) {
    const held = { ...rec, aimAt: was.aimAt };
    held.key = seenKey(held);
    return held;
  }
  if (!was || was.aimAt !== rec.aimAt || ms < was.atMs) aims.set(who, { aimAt: rec.aimAt, atMs: ms });
  return rec;
}

/**
 * The record as your eye last had it (the code review of v0.0.23's first finding: seenOf reads a man's true hold, pose and facing
 * wherever he is, so a card held in stop motion showed "sit|front" and the hands up from behind a wall, while the stage drew him
 * as last seen or not at all). last: { state, men: Map who → record } (the view's). As the stage's memory decides (render/memory.js
 * recall's combat branch, in a combat scene only, sim/places/known.js hostKind; never for you, your #2 or the instructor, known.js
 * alwaysDrawn): a man whose spot is in your sight (perception's visibility above 0, the stage's test) is given as seenOf gives him
 * and kept; out of sight, the record kept at the last tick he was in it; never kept, as he is where known.js seenEver says the stage
 * draws him (a load's rooms, the take-in's sightings), else null (no card: the stage draws nothing of him). A new state forgets.
 * Without last, or out of a combat scene, the record as given.
 */
export function seenHeld(state, who, rec, last) {
  if (!last || !rec || hostKind(state) === null) return rec;
  if (last.state !== state) { last.state = state; last.men.clear(); }
  const list = state.actors?.list ?? [], me = list.find(a => a.who === state.player?.id), a = list.find(x => x.who === who);
  if (!me || !a || alwaysDrawn(state, a)) return rec;
  const sight = (x, z) => visibility(state, eyeOf(state, me), x, z, state.clock?.ms ?? 0) > 0;
  if (sight(a.x, a.z)) { last.men.set(who, rec); return rec; }
  return last.men.get(who) ?? (seenEver(state, a, { sight }) ? rec : null);
}
/** A fresh memory for seenHeld (the view's readers.lastSeen). */
export const lastSeenMemory = () => ({ state: null, men: new Map() });

/**
 * The poses a role-player's card may take at a scene's load (warm()'s set: FRAME_SEEN's standing and kneeling holds, sitting, cowering;
 * v0.0.26, "Bang, then go": cowering with the hands empty, the rifle on its sling (C-a's card), and dazed standing and kneeling, the
 * rifle low (D-a's), so no doll is painted when a man first dazes or cowers).
 */
export const WARM_HOLDS = Object.freeze([['rifle-low', 'stand'], ['rifle-aim', 'stand'], ['rifle-high', 'stand'], ['up', 'stand'], ['rifle-low', 'kneel'], ['rifle-aim', 'kneel'], ['up', 'kneel'], ['rifle-low', 'sit'], ['empty', 'cower'], ['rifle-low', 'daze'], ['rifle-low', 'dazeKneel'],
  // (blind fire, the rifle high over his cover, and a man down in free fall, the hands empty (see the header))
  ['rifle-high', 'blind'], ['empty', 'downFree']]);
/** The boarding's (v0.0.27, see the header): an armed man's holds aboard (WARM_HOLDS' but the seat: at 0 G a man down is the 0 G down), and an unarmed crewman's. */
export const WARM_BOARD = Object.freeze(WARM_HOLDS.filter(([, pose]) => pose !== 'sit'));
export const WARM_CREW = Object.freeze([['empty', 'stand'], ['up', 'stand'], ['up', 'kneel'], ['empty', 'cower'], ['empty', 'downFree']]);
/** A rifle's hold as the P-12's, for a man whose only gun it is (seen.js holdOfSeen's sidearm). */
export const PISTOL_HOW = Object.freeze({ 'rifle-low': 'pistol-ready', 'rifle-high': 'pistol-high', 'rifle-aim': 'pistol-aim' });
/** And aimed away (across the chest, A1's other side), standing and kneeling, at the near band only (the house's rooms; 54 dolls with the rest, inside DOLL_LRU 56: breach-look holds it). */
export const WARM_NEAR = Object.freeze([['rifle-aim', 'stand', 'away'], ['rifle-aim', 'kneel', 'away']]);
/** Your #2's carries as his card may show them (warm()'s). */
export const WARM_TWO = Object.freeze(['rifle-low', 'rifle-high', 'rifle-aim']);
/**
 * Every (face, holds) a stand of the house can be drawn with (portrait-warm: the fill's faces, armoured with a pistol the user's
 * 2a of seed 4028068471, and each as unidentified): warm()'s list, at the house's place.
 */
export const HOUSE_FACES = Object.freeze([['threat', 'rifle'], ['threat', 'pistol'], ['noshoot', 'hands'], ['noshoot', 'phone'], ['armoured', 'rifle'], ['armoured', 'pistol'], ['armoured', 'unseen'],
  ['hostage', 'pistol'], ['hostage', 'rifle'], ['hostage', 'unseen'], ['unknown', 'unseen']]);

/** The role-players' paint on a marine (R.house.live.struck: { who, part, zone, hole | at }) as card marks, in truth, blue (see the header). */
export function paintOn(state, who) {
  const list = (state?.armoury?.range?.house?.live?.struck ?? []).filter(x => x.who === who);
  return list.map((x, i) => { const at = x.hole ?? x.at ?? null; return { n: i + 1, shotId: x.shotId ?? null, called: at, seen: true, hole: at, zone: x.zone ?? null, part: x.part ?? 'torso', paint: 'rp' }; }).filter(m => m.hole);
}

/** The live man whose search ended last ("Search him", T.live.searched): { key, atMs }, or null. */
export function searchedLast(state) {
  let out = null;
  for (const T of state?.armoury?.range?.turners ?? []) { const at = T.live?.searched?.atMs; if (Number.isFinite(at) && (!out || at > out.atMs)) out = { key: T.key, atMs: at }; }
  return out;
}
/** A searched man's verdict from the ledger (see the header), in the card's words; 'NOT STRUCK' for a man no round reached. */
export function searchedWords(state, pid) {
  const { list } = wouldOn(state, pid), f = list.find(x => x.fatal);
  if (f) return `WOULD HAVE BEEN FATAL: ${WOULD_WHY[f.why] ?? 'THE STRIKE'}`;
  const w = list.find(x => !x.fatal && x.why !== 'stopped' && x.layer !== null);
  if (w) return w.where ? `A WOUND: ${String(w.where).toUpperCase()}` : 'A WOUND';
  const st = list.find(x => x.why === 'stopped');
  if (st) return `HIS ${String(LAYERS[st.layer]?.word ?? 'armour').replace(/^the /, '').toUpperCase()} STOPPED ONE`;
  return 'NOT STRUCK';
}

/**
 * The card's words with his face named before them, for a subject turned to you (v0.0.25: portrait.js ROLL_FACE_WORDS, R-b's; v0.0.28,
 * the user's stars of 2026-11-20 on both: on R-a too, the card turned and the words naming it, portrait.js ROLL_NAMED).
 */
export function rollWords(words, rec, picks = null) {
  const roll = rec?.roll ?? 0, P = { ...PORTRAIT_PICKS, ...(picks ?? {}) };
  return roll && ROLL_NAMED.includes(P.roll) && ROLL_FACE_WORDS[roll] ? [ROLL_FACE_WORDS[roll], words].filter(Boolean).join(' · ') : words;
}

/** Whether a record is drawn aimed (a gun pointed: at you or away, by its hold or its aim). */
export const aimedRec = (rec) => !!rec && (!!rec.aimAt || /aim/.test(rec.hold?.how ?? ''));
/**
 * The state a live man's card says (v0.0.28: the words and the drawing from the one record, the judge's pass of 2026-11-20): the
 * take-in's read (engage.js seenState), but AIMING only over a man the card draws aimed (else the word for what it draws: DOWN,
 * HANDS UP, COWERING or LOOKING), and a man drawn aimed is AIMING whatever the read left (veiled, V3, he is drawn with no gun; firing
 * blind keeps its words): the verb never contradicts the figure. Pure.
 */
export function captionState(st, rec, veiled = false) {
  // (read aiming, drawn otherwise: the word for what is drawn: sitting down DOWN, the hands up HANDS UP, cowering COWERING, else LOOKING)
  if (st === 'aiming' && !aimedRec(rec)) return rec?.pose === 'sit' || rec?.pose === 'sitD1' ? 'down' : rec?.hold?.how === 'up' || rec?.gear?.hands === 'up' ? 'hands' : rec?.pose === 'cower' ? 'cowering' : 'looking';
  // (the converse, the art director's pass 3: "A3 under 'PAIR · 1 SEEN'": a man the card draws aimed carries AIMING whatever the read
  // left (none, LOOKING, RUNNING), unless his hands are veiled (V3 draws no gun) or he fires blind (its own words))
  if (aimedRec(rec) && !veiled && st !== 'aiming' && st !== 'firing-blind') return 'aiming';
  return st;
}

/** Whether the view shows: while engaged, with or without marks; after, hitShown's rule. */
export function targetShown({ engaged = false, phase = 'belief', n = 0, inStop = false, lastT = -Infinity, nowT = 0 } = {}) {
  if (engaged) return true;
  return hitShown({ phase, n: Math.max(1, n), inStop, lastT, nowT });
}

// (a man's look as the figures draw him, his name as the targets list gives it)
function personOf(state, who) {
  const p = state.people?.[who], a = state.actors?.list?.find?.(x => x.who === who);
  return { look: p?.look ? lookFor(p.look, a?.outfit ?? 'utilities', indoorsNow(state)) : {}, sex: p?.sex ?? 'm', name: p ? `${p.service?.rank ?? ''} ${p.name?.family ?? ''}`.trim() : who };
}

/** The card's model for a target (see the header): a stand's board with its marks, or a man in his gear. */
export function targetModel(state, { key, kind = 'turner', who = null, phase = null, tabs = [], readers = {} } = {}) {
  const R = state.armoury?.range, me = readers.meAt?.(state) ?? null, picks = readers.picks?.(state) ?? null;
  if (kind === 'person') {
    // (out of your sight the record as last seen (seenHeld), so the card never shows what the stage hides)
    const now = seenOf(state, who, { by: state.player?.id, cover: true }), kept = seenHeld(state, who, now, readers.lastSeen), frozen = !!kept && kept !== now;
    const P = personOf(state, who), rec = aimHeld(kept, who, state.clock?.ms ?? 0, readers.aims);
    if (!rec?.gear) return null;
    const a = state.actors?.list?.find?.(x => x.who === who);
    const person = { look: P.look, sex: P.sex }, subject = { kind: 'man', key: `${who}|${rec.key}`, rec, gear: rec.gear, person };
    // (v0.0.19: a role-player, with the house's marks as paint; v0.0.23: drawn as the stage shows him (V1), the take-in's read in the words)
    const LT = R?.course === 'house' ? liveRecOf(state, who) : null;
    if (LT) {
      const sf = seenFace(state, LT.key), st = seenState(state, LT.key), searched = !!LT.live?.searched;
      // (searched, his card in truth before the lane's end, "SEARCHED" and the verdict first (see the header); the phase
      // contact.js cardPhaseOf's, the one reader, where the caller names none)
      const hm = readers.marksOf ? readers.marksOf(state, LT.key, 0, phase ?? cardPhaseOf(state, LT.key)) : null;
      const marks = (hm?.marks ?? []).map(mk => ({ ...mk, paint: 'team' }));
      // (his give under way, the rifle still in his hands as the figure draws it (seen.js frame 'drop', GIVE_DROP_MS): GIVING UP, the words
      // agreeing with the figure, HANDS UP once it is on the floor (the play review of v0.0.26, finding 6: HANDS UP over a two-handed grip))
      // (the judge's pass of 2026-11-20: "AIMING · PAIR · 1 SEEN" over a man drawn at the low ready: the verb and the drawing
      // from the one record, captionState)
      const stWord = st === 'hands' && rec.frame === 'drop' ? GIVING_WORDS : STATE_WORDS[captionState(st, rec, sf.holds === 'unseen')];
      const lead = [...(searched ? ['SEARCHED', searchedWords(state, who)] : [stWord ?? (sf.holds === 'unseen' ? UNSEEN_WORDS : null)]), hm?.words ?? String(LT.stand ?? '').toUpperCase()].filter(Boolean).join(' · ');
      return { look: HIT_LOOK, man: null, key: LT.key, k: 0, face: null, holds: null, phase: hm?.phase ?? phase ?? cardPhaseOf(state, LT.key), marks, words: lead, ...(searched ? { headRows: 4 } : {}), line: hm?.line ?? null, tabs, rangeM: frozen ? rec.rangeM : hitRangeM(a ?? LT, me, null),
        subject, live: { key: LT.key, state: st, holds: sf.holds }, ...(picks ? { picks } : {}) };
    }
    return { look: HIT_LOOK, man: null, key, k: 0, face: null, holds: null, phase: 'belief', marks: [], words: rollWords(P.name, rec, picks), line: null, tabs: [], rangeM: frozen ? rec.rangeM : hitRangeM(a, me, null), subject, ...(picks ? { picks } : {}) };
  }
  const T = (R?.turners ?? []).find(t => t.key === key) ?? null;
  if (!T) return null;
  const hm = readers.marksOf ? readers.marksOf(state, key, 0, phase) : null, seen0 = seenFace(state, key);
  // (the take-in keeps one contact, the last: a stand identified at an earlier pause reads 'unseen' once another is taken in; the
  // view keeps the last good identification it showed of each stand for the lane (readers.known), never one it was not given)
  const was = readers.known?.get(key) ?? null, sf = seen0.holds === 'unseen' && was ? was : seen0;
  if (seen0.holds !== 'unseen') readers.known?.set(key, seen0);
  // (no round on him yet: the stand's name, '1A', as the instructor's run sheet names it)
  const base = hm ?? { key, k: 0, phase: phase ?? 'belief', marks: [], words: String(T.stand ?? '').toUpperCase(), line: null };
  const m = cardModel(base, { look: HIT_LOOK, face: sf.face, holds: sf.holds, tabs, rangeM: hitRangeM(T, me, null) });
  const words = sf.holds === 'unseen' ? [UNSEEN_WORDS, m.words].filter(Boolean).join(' · ') : m.words;
  // (the stand in its light and behind the jamb from your eye, as a man is (see the header))
  const eye = state.actors?.list?.find?.(a => a.who === state.player?.id) ?? null;
  // (a board on a face turned to you by its roll (R-a); R-b names the face in the words)
  const rec = standSeen(sf.face, sf.holds, { holds: sf.holds, state: null }, { rangeM: m.rangeM ?? null, light: lightOf(state, T.x, T.z), cover: eye ? coverAt(state, T, eye) : null, onFace: T.onFace ?? null, by: eye?.onFace ?? null });
  const pk = paintKey(rec);
  return { ...m, words: rollWords(words, rec, picks), subject: { kind: 'board', key: `${sf.face}|${sf.holds}${pk ? `|${pk}` : ''}${rec.roll ? `|r${rec.roll}` : ''}`, face: sf.face, holds: sf.holds, rec }, ...(picks ? { picks } : {}) };
}

// (whether the stop names a target of yours now, a row's, an aim's or a pause's bracket, whatever it is)
const stopNames = (s) => { const S = s.stop; return !!S && S.who === s.player?.id && !!(S.doing?.target || S.aim?.key || (S.mode === 'stop' && S.pick)); };

/** The target view (see the header): frame() each frame, warm() at the scene's load. */
export function createTargetView({ card, readers: given = {} } = {}) {
  const readers = { known: new Map(), aims: new Map(), lastSeen: lastSeenMemory(), ...given };
  // ---- 'string': main.js hitHud's v0.0.17 body, moved verbatim (its hitModelOf beside it) ----
  function hitModelOf(s, key, k, phase, tabs = []) {
    const hm = readers.marksOf(s, key, k, phase);
    if (!hm) return null;
    const T = (s.armoury?.range?.turners ?? []).find(t => t.key === key) ?? null;
    // (the board's figure at the turner's range band, the line's ("keep all three to represent varying ranges", the user, 2026-11-08))
    return cardModel(hm, { look: HIT_LOOK, face: hm.face ?? T?.face ?? 'threat', holds: hm.holds ?? T?.holds ?? 'rifle', tabs, rangeM: hitRangeM(T, readers.meAt(s), s.armoury?.range?.line) });
  }
  function stringFrame(s, { hidden = false, inStop = false, ui = 1, seen, now }) {
    const hitSeen = seen, hitCard = card, uiK = ui;
    const R = s?.armoury?.range, pn = !hidden && R?.stress ? readers.pairsOf(s) : null;
    if (!pn) { hitSeen.shown = null; return hitCard.update(null); }
    const running = !!pn.str && !pn.str.done;
    const last = running ? null : [...(pn.strs ?? [])].reverse().find(x => x.done !== null && x.done !== undefined && x.done !== 'setup') ?? null;
    const k = running ? pn.str.k : last?.k, keys = running ? pn.str.keys ?? [] : last?.keys ?? R.stress?.strs?.find(x => x.k === last?.k)?.holes?.map(h => h.key) ?? [];
    if (!Number.isFinite(k) || !keys.length) { hitSeen.shown = null; return hitCard.update(null); }
    const phase = running ? 'belief' : 'truth';
    const hit = [...new Set(keys)].map(key => ({ key, hm: readers.marksOf(s, key, k, phase) })).filter(x => x.hm?.marks?.length);
    if (!hit.length) { hitSeen.shown = null; return hitCard.update(null); }
    // (newest first: the turner whose last round came last; the brackets' pick shows its own)
    const lastShot = (x) => Math.max(...x.hm.marks.map(m => m.n ?? 0));
    hit.sort((a, b) => keys.indexOf(b.key) - keys.indexOf(a.key) || lastShot(b) - lastShot(a));
    const shownKey = hit.some(x => x.key === s.stop?.pick) ? s.stop.pick : hit[0].key;
    const tabs = hit.length > 1 ? hitTabs(hit.map(x => x.key), shownKey, (key) => (R.turners ?? []).find(t => t.key === key)?.lane ?? null) : [];
    const m = hitModelOf(s, shownKey, k, phase, tabs);
    const sig = JSON.stringify([k, phase, shownKey, m?.marks?.map(x => [x.n, x.seen])]);
    if (sig !== hitSeen.sig || (hitSeen.stop && !inStop)) hitSeen.t = now;
    hitSeen.sig = sig; hitSeen.stop = inStop;
    const on = hitShown({ phase, n: m?.marks?.length ?? 0, inStop, lastT: hitSeen.t, nowT: now });
    hitSeen.shown = on ? { k, key: shownKey, phase } : null;
    return hitCard.update(on ? m : null, { ui: uiK });
  }
  // ---- 'lane' and 'free': whatever you engage ----
  let held = null;                                                   // ({ key, kind, who }: the target shown last, held after the engagement)
  let closedMs = -Infinity;                                          // (game ms the held card last closed: a round struck after it opens it again)
  let pending = null;                                                // (a man's doll painted this frame: the card waits a frame for it)
  let pin = null;                                                    // ({ key, atMs, under, on }: the man last searched and the aim or bracket he took the card from)
  const close = (seen, ms) => { held = null; closedMs = ms; seen.shown = null; return card.update(null); };
  function engageFrame(s, { hidden = false, inStop = false, ui = 1, seen, now }) {
    const R = s?.armoury?.range, house = R?.course === 'house', ms = s?.clock?.ms ?? 0;
    if (hidden || !s || (house && R.end)) { held = null; seen.shown = null; return card.update(null); }
    const eng = engagedOf(s);
    // (in the house a stand; anywhere a live man: paper and the bay's turners off "Bang" are not this view's)
    let target = eng && (eng.kind === 'person' || (eng.kind === 'turner' && house)) ? eng : null;
    // (a search that has just ended takes the card from the aim or the bracket left where they were (pin.under, the first one
    // met after it), until they move or a row engages another: the splash hid the card and your muzzle stayed on the first man, so after
    // the second search the card went back to his, your #2's man's truth never shown (the play review of v0.0.26, finding 8))
    const sr = house ? searchedLast(s) : null;
    if (sr && sr.atMs > (pin?.atMs ?? -Infinity)) pin = { key: sr.key, atMs: sr.atMs, under: undefined, on: true };
    if (pin?.on && target && target.key !== pin.key) {
      if (target.why !== 'row' && pin.under === undefined) pin.under = target.key;
      if (target.why === 'row' || target.key !== pin.under) pin.on = false;
    }
    if (pin?.on) {
      const T = (R?.turners ?? []).find(t => t.key === pin.key);
      if (T?.live?.who) { target = null; held = { key: pin.key, kind: 'person', who: T.live.who, live: true }; } else pin.on = false;
    }
    if (target) held = { key: target.key, kind: target.kind, who: target.who ?? null, live: !!(house && target.kind === 'person' && liveRecOf(s, target.who)) };
    else if (!held && house) {
      // (the man last searched, where his search ended after your last round that struck: the splash hides the card and
      // drops what it held, so after the second search the card went back to the first man's, your #2's man's truth never shown
      // (the play review of v0.0.26, finding 8))
      const sl0 = struckLast(s), sr = searchedLast(s), sl = sr && (!sl0 || sr.atMs >= sl0.atMs) ? sr : sl0;
      if (sl && sl.atMs > closedMs) { const T = (R?.turners ?? []).find(t => t.key === sl.key); held = T?.live?.who ? { key: sl.key, kind: 'person', who: T.live.who, live: true } : { key: sl.key, kind: 'turner', who: null }; }
    }
    // (v0.0.19: a role-player no longer engaged is held as a stand is, and closed once ruled out)
    // (a man searched is held as any other, so the truth his search turned is seen after it ends)
    if (!target && held?.live) { const T = liveRecOf(s, held.who); if (!T || (T.live.st === 'out' && !T.live.searched)) return close(seen, ms); }
    // (a man no longer engaged is held only out of stop motion: in it, or while the stop names something this view does not draw
    // (your paper, a bay turner off "Bang"), his card closes at once, so it never stands over your own target)
    if (!target && held?.kind === 'person' && !held.live && (inStop || stopNames(s))) return close(seen, ms);
    const cur = target ?? held;
    if (!cur) { seen.shown = null; return card.update(null); }
    // (a stand no longer engaged that has turned away, after a room's "Clear!": closed)
    if (!target && cur.kind === 'turner') { const T = (R?.turners ?? []).find(t => t.key === cur.key); if (!T || (T.awayAtMs !== null && T.awayAtMs <= ms)) return close(seen, ms); }
    // (two stands of the room struck: tabs, newest first, by stand)
    let tabs = [];
    if (cur.kind === 'turner' && house) {
      const T0 = R.turners.find(t => t.key === cur.key), mineStruck = [];
      for (let i = R.shots.length - 1; i >= 0; i--) { const x = R.shots[i], T = R.turners.find(t => t.key === x.key); if (T && T.room === T0?.room && !mineStruck.includes(T.key) && (T.hits ?? []).some(h => h.shotId === x.id && h.by !== 'two')) mineStruck.push(T.key); }
      if (mineStruck.length > 1 && mineStruck.includes(cur.key)) tabs = hitTabs(mineStruck, cur.key, () => null, (key) => R.turners.find(t => t.key === key)?.stand ?? key);
    }
    const m = targetModel(s, { key: cur.key, kind: cur.kind, who: cur.who ?? null, tabs, readers });
    if (!m) { seen.shown = null; return card.update(null); }
    // (a man's doll not painted yet: painted now, the card as it was for this frame)
    if (m.subject?.kind === 'man' && !hitDollReady(m.subject, bandOf(m.rangeM).pxPerM, { picks: m.picks ?? null })) {
      if (pending !== m.subject.key) { pending = m.subject.key; paintPortrait(m.subject.rec, m.subject.person, { pxPerM: bandOf(m.rangeM).pxPerM, picks: m.picks ?? null }); return card.text; }
    }
    pending = null;
    const sig = JSON.stringify([cur.key, m.phase, m.marks.map(x => [x.n, x.seen]), m.subject?.key, m.subject?.rec?.key ?? null, !!target, m.picks ?? null]);
    if (sig !== seen.sig || (seen.stop && !inStop) || target) seen.t = now;
    seen.sig = sig; seen.stop = inStop;
    const on = targetShown({ engaged: !!target, phase: m.phase, n: m.marks.length, inStop, lastT: seen.t, nowT: now });
    if (!on) return close(seen, ms);
    seen.shown = { k: 0, key: cur.key, phase: m.phase, why: target?.why ?? 'held' };
    return card.update(m, { ui });
  }
  return {
    /** The view this frame: its words ('' when hidden). seen: main.js's hitSeen record (reset with the weapon HUD); now: performance.now(). */
    frame(s, { hidden = false, inStop = false, ui = 1, seen, now = globalThis.performance?.now?.() ?? 0 } = {}) {
      if (s?.armoury?.range?.stress) return stringFrame(s, { hidden, inStop, ui, seen, now });
      return engageFrame(s, { hidden, inStop, ui, seen, now });
    },
    /** The scene's dolls made at its load (the stands' faces as they may be seen, your #2 in his gear), so no frame paints more than one. */
    warm(s) {
      const R = s?.armoury?.range;
      if (R?.stress) return warmHitcard();
      if (R?.course !== 'house') return 0;
      // (the house's rooms are within the mid band: its stands at the near and mid bands' densities, HIT_BANDS' 96 and 80 px a metre;
      // v0.0.23: the boards at the house's place (W1), every face the fill can give, armoured with a pistol among them)
      const bands = HIT_BANDS.filter(b => b.maxM <= 25).map(b => b.pxPerM), picks = readers.picks?.(s) ?? null;
      const place = BOARD_PLACES[{ ...PORTRAIT_PICKS, ...(picks ?? {}) }.where] ?? 'ready';
      let n = 0;
      for (const ppm of bands) n = warmHitcard(HOUSE_FACES, ppm, { place });
      // (your #2 in his carries; v0.0.23: each role-player front on in the holds and poses his frames can give (WARM_HOLDS))
      const front = (who, how, pose = 'stand', aimAt = 'you') => { const r = seenOf(s, who, { by: s.player?.id }); return r ? { ...r, hold: { ...r.hold, how, act: null }, aimAt: how.endsWith('aim') ? aimAt : null, pose, facing: 'front' } : null; };
      const two = R.house?.two?.pid;
      if (two) { const P = personOf(s, two); for (const how of WARM_TWO) { const rec = front(two, how); if (rec) for (const ppm of bands) paintPortrait(rec, { look: P.look, sex: P.sex }, { pxPerM: ppm, picks }); } }
      // (the boarding's men at the near band, each by what he carries (see the header))
      if (R.house?.boarding) {
        for (const T of (R.turners ?? []).filter(t => t.live?.who)) {
          const P = personOf(s, T.live.who), g0 = seenOf(s, T.live.who, { by: s.player?.id })?.gear, armed = !!(g0?.rifle || g0?.pistol);
          // (a man whose only gun is the P-12 holds it where a rifleman holds his rifle: seen.js holdOfSeen's sidearm)
          const how1 = (how) => (!g0?.rifle && g0?.pistol ? PISTOL_HOW[how] ?? how : how);
          for (const [how, pose] of armed ? WARM_BOARD : WARM_CREW) { const rec = front(T.live.who, how1(how), pose); if (rec) paintPortrait(rec, { look: P.look, sex: P.sex }, { pxPerM: bands[0], picks }); }
          if (armed) for (const [how, pose, aimAt] of WARM_NEAR) { const rec = front(T.live.who, how1(how), pose, aimAt); if (rec) paintPortrait(rec, { look: P.look, sex: P.sex }, { pxPerM: bands[0], picks }); }
        }
        return n;
      }
      for (const T of (R.turners ?? []).filter(t => t.live?.who)) {
        const P = personOf(s, T.live.who);
        for (const [how, pose] of WARM_HOLDS) { const rec = front(T.live.who, how, pose); if (rec) for (const ppm of bands) paintPortrait(rec, { look: P.look, sex: P.sex }, { pxPerM: ppm, picks }); }
        for (const [how, pose, aimAt] of WARM_NEAR) { const rec = front(T.live.who, how, pose, aimAt); if (rec) paintPortrait(rec, { look: P.look, sex: P.sex }, { pxPerM: bands[0], picks }); }
      }
      return n;
    },
    reset() { held = null; pending = null; pin = null; closedMs = -Infinity; readers.known.clear(); readers.aims?.clear?.(); if (readers.lastSeen) { readers.lastSeen.state = null; readers.lastSeen.men.clear(); } },
    /** "Bang"'s card model for a turner of a string (main.js's hot wash reads it too). */
    stringModel: hitModelOf,
  };
}
