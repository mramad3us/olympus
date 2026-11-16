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
// round on him included), closed once he is ruled out ('out') and not engaged, and drawn in his gear as your take-in identified
// him (liveGear: what is in his hands is what the take-in read; 'unseen' leaves them empty, 'hands' puts them up), never as his
// record holds him. His marks are the house's (marks.js hitMarks: belief until R.end, then truth) drawn as paint (art's PAINT_C:
// the stack's rounds in the cadre's pink), the words the state your take-in read (STATE_WORDS) before the marks' own.
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
import { hitDollReady, warmHitcard, figGeom, bandOf, HIT_BANDS } from '../../art/doll/hitcard.js';
import { dressedDoll } from '../../art/doll/dress.js';
import { engagedOf, struckLast, seenFace, seenState, liveRecOf } from '../../sim/arms/engage.js';
import { gearOf, gearKey } from '../../sim/arms/gear.js';
import { lookFor, indoorsNow } from '../../sim/people/figure.js';
import { STATE_WORDS } from '../plaque.js';

/** The target view's modes (see the header). */
export const TARGET_MODES = Object.freeze(['string', 'lane', 'free']);
/** The words before a stand's when its hands were not seen (COMBAT §25.4.6: "can't see his hands"). */
export const UNSEEN_WORDS = 'HANDS NOT SEEN';

/** The state a take-in read of a live man, as the card says it: the plaque's words (one formatter). */
export { STATE_WORDS };

/**
 * A live man's gear as your take-in identified him (see the header): the kit as worn (the mask, the carrier), what is in his hands
 * as identified: 'unseen' (or nothing told) empties them, 'hands' or a read of 'hands' puts them up, a rifle or a pistol keeps it.
 */
export function liveGear(gear, { holds = 'unseen', state = null } = {}) {
  if (!gear) return gear;
  const inHands = (p) => p && (p.place === 'ready' || p.place === 'hand');
  const g = { ...gear };
  if (holds === 'hands' || state === 'hands') return { ...g, rifle: inHands(g.rifle) ? null : g.rifle, pistol: inHands(g.pistol) ? null : g.pistol, held: null, hands: 'up' };
  if (holds === 'rifle' || holds === 'pistol') return { ...g, hands: null };
  return { ...g, rifle: inHands(g.rifle) ? null : g.rifle, pistol: inHands(g.pistol) ? null : g.pistol, held: null, hands: null };
}

/** The role-players' paint on a marine (R.house.live.struck: { who, part, zone, hole | at }) as card marks, in truth, blue (see the header). */
export function paintOn(state, who) {
  const list = (state?.armoury?.range?.house?.live?.struck ?? []).filter(x => x.who === who);
  return list.map((x, i) => { const at = x.hole ?? x.at ?? null; return { n: i + 1, shotId: x.shotId ?? null, called: at, seen: true, hole: at, zone: x.zone ?? null, part: x.part ?? 'torso', paint: 'rp' }; }).filter(m => m.hole);
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
  const R = state.armoury?.range, me = readers.meAt?.(state) ?? null;
  if (kind === 'person') {
    const P = personOf(state, who), gear0 = gearOf(state, who, { by: state.player?.id });
    if (!gear0) return null;
    const a = state.actors?.list?.find?.(x => x.who === who);
    // (v0.0.19: a role-player, as identified, with the house's marks as paint)
    const LT = R?.course === 'house' ? liveRecOf(state, who) : null;
    if (LT) {
      const sf = seenFace(state, LT.key), st = seenState(state, LT.key), gear = liveGear(gear0, { holds: sf.holds, state: st });
      const hm = readers.marksOf ? readers.marksOf(state, LT.key, 0, phase) : null;
      const marks = (hm?.marks ?? []).map(mk => ({ ...mk, paint: 'team' }));
      const lead = [STATE_WORDS[st] ?? (sf.holds === 'unseen' ? UNSEEN_WORDS : null), hm?.words ?? String(LT.stand ?? '').toUpperCase()].filter(Boolean).join(' · ');
      return { look: HIT_LOOK, man: null, key: LT.key, k: 0, face: null, holds: null, phase: hm?.phase ?? phase ?? 'belief', marks, words: lead, line: hm?.line ?? null, tabs, rangeM: hitRangeM(a ?? LT, me, null),
        subject: { kind: 'man', key: `${who}|${gearKey(gear)}`, gear, person: { look: P.look, sex: P.sex } }, live: { key: LT.key, state: st, holds: sf.holds } };
    }
    const gear = gear0;
    return { look: HIT_LOOK, man: null, key, k: 0, face: null, holds: null, phase: 'belief', marks: [], words: P.name, line: null, tabs: [], rangeM: hitRangeM(a, me, null),
      subject: { kind: 'man', key: `${who}|${gearKey(gear)}`, gear, person: { look: P.look, sex: P.sex } } };
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
  return { ...m, words, subject: { kind: 'board', key: `${sf.face}|${sf.holds}`, face: sf.face, holds: sf.holds } };
}

// (whether the stop names a target of yours now, a row's, an aim's or a pause's bracket, whatever it is)
const stopNames = (s) => { const S = s.stop; return !!S && S.who === s.player?.id && !!(S.doing?.target || S.aim?.key || (S.mode === 'stop' && S.pick)); };

/** The target view (see the header): frame() each frame, warm() at the scene's load. */
export function createTargetView({ card, readers: given = {} } = {}) {
  const readers = { known: new Map(), ...given };
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
  const close = (seen, ms) => { held = null; closedMs = ms; seen.shown = null; return card.update(null); };
  function engageFrame(s, { hidden = false, inStop = false, ui = 1, seen, now }) {
    const R = s?.armoury?.range, house = R?.course === 'house', ms = s?.clock?.ms ?? 0;
    if (hidden || !s || (house && R.end)) { held = null; seen.shown = null; return card.update(null); }
    const eng = engagedOf(s);
    // (in the house a stand; anywhere a live man: paper and the bay's turners off "Bang" are not this view's)
    const target = eng && (eng.kind === 'person' || (eng.kind === 'turner' && house)) ? eng : null;
    if (target) held = { key: target.key, kind: target.kind, who: target.who ?? null, live: !!(house && target.kind === 'person' && liveRecOf(s, target.who)) };
    else if (!held && house) {
      const sl = struckLast(s);
      if (sl && sl.atMs > closedMs) { const T = (R?.turners ?? []).find(t => t.key === sl.key); held = T?.live?.who ? { key: sl.key, kind: 'person', who: T.live.who, live: true } : { key: sl.key, kind: 'turner', who: null }; }
    }
    // (v0.0.19: a role-player no longer engaged is held as a stand is, and closed once ruled out)
    if (!target && held?.live) { const T = liveRecOf(s, held.who); if (!T || T.live.st === 'out') return close(seen, ms); }
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
    if (m.subject?.kind === 'man' && !hitDollReady(m.subject, bandOf(m.rangeM).pxPerM)) {
      if (pending !== m.subject.key) { pending = m.subject.key; dressedDoll(m.subject.gear, m.subject.person, figGeom(bandOf(m.rangeM).pxPerM).scale); return card.text; }
    }
    pending = null;
    const sig = JSON.stringify([cur.key, m.phase, m.marks.map(x => [x.n, x.seen]), m.subject?.key, !!target]);
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
      const faces = [['threat', 'rifle'], ['threat', 'pistol'], ['noshoot', 'hands'], ['noshoot', 'phone'], ['armoured', 'rifle'], ['armoured', 'unseen'], ['hostage', 'pistol'], ['hostage', 'rifle'], ['hostage', 'unseen'], ['unknown', 'unseen']];
      // (the house's rooms are within the mid band: its stands at the near and mid bands' densities, HIT_BANDS' 96 and 80 px a metre)
      const bands = HIT_BANDS.filter(b => b.maxM <= 25).map(b => b.pxPerM);
      let n = 0;
      for (const ppm of bands) n = warmHitcard(faces, ppm);
      const two = R.house?.two?.pid, gear = two ? gearOf(s, two) : null;
      if (gear) { const P = personOf(s, two); for (const ppm of bands) dressedDoll(gear, { look: P.look, sex: P.sex }, figGeom(ppm).scale); }
      // (v0.0.19: each role-player as he may be identified: hands unseen, his rifle seen, his hands up)
      for (const T of (R.turners ?? []).filter(t => t.live?.who)) {
        const g0 = gearOf(s, T.live.who), P = personOf(s, T.live.who);
        if (!g0) continue;
        for (const holds of ['unseen', 'rifle', 'hands']) for (const ppm of bands) dressedDoll(liveGear(g0, { holds }), { look: P.look, sex: P.sex }, figGeom(ppm).scale);
      }
      return n;
    },
    reset() { held = null; pending = null; closedMs = -Infinity; readers.known.clear(); },
    /** "Bang"'s card model for a turner of a string (main.js's hot wash reads it too). */
    stringModel: hitModelOf,
  };
}
