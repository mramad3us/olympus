// OLYMPUS arms: what you are engaging, and how you saw it: the target view's one reader (VIEWS §7.7; COMBAT §25.18.4; the build sheet 0.0.18 §2.2).
//
// The user, 2026-11-15 (DESIGN.md's log): "we need to generalize that target view for every time we're engaging something or
// someone". engagedOf(state, pid) is the stand or the man you are engaging now, from what the stop already records, the
// first of: the target of the row or Fire under way (state.stop.doing.target: 'row'), the one you aim at (stop.aim.key:
// 'aim'), the one bracketed at a pause in stop motion (stop.pick: 'bracket'). Keys only, read from the records: it never
// calls targetsOf (its sight-grid lines are not a frame's work). A stand is a turner of the range session (R.turners: kind
// 'turner'); a man an actor with a person (kind 'person', who). A stand that turned toward you before your take-in is not
// engaged by the bracket alone: in the shoot house it opens nothing until your take-in has seen it (its last contact names it
// since it turned) or a round of yours has struck it, so the target view never gives away a man you have not taken in.
// struckLast(state, pid) is your last round that struck a stand ({ key, atMs }): the view holds it after the engagement ends.
// seenFace(state, key) is the stand as you saw it, never as its record holds ("we only know what we know"):
//   - in the shoot house, by the stage's own rule (shoothouse.js houseLook, so the card and the picture agree): your last
//     contact's identification when it took the stand in since it turned (contact.js identify's ident), else your #2's call
//     (house.two.ident); 'unseen' when neither, or when the look failed ("can't see his hands"). The face follows what was
//     identified: a rifle or a pistol a threat, hands or a phone a no-shoot, nothing told 'unknown'; the armoured silhouette
//     and the hostage pair are seen as they are (the stage draws them so);
//   - on the bay's courses (pairs and stress), the stand's own face and holds: the faces hang at 7 m in daylight in front of
//     you, and "Bang" is drawn exactly as scored (my call).
// ENGAGE_WHY names the three ways in. Pure: it reads state.mind.contact through mind.js contactOf, never noteContact.
// v0.0.19 (the build sheet 0.0.19 §1 L-look, §3.3; opfor §2.6): a role-player rides R.turners as a turner record with `live`
// ({ who, st, … }), keeping the stand's key. engagedOf gives him as the man he is, { key, kind: 'person', who: T.live.who, why },
// under the stand's own rule (the bracket opens nothing until your take-in has seen him since he showed, or a round of yours
// struck him), so the target view draws him in his gear, never a board. seenFace reads him as it reads a stand (the take-in's
// identification), and seenState(state, key) is the state your take-in read of him (contact.js identify's last.state: 'aiming',
// 'looking', 'running', 'hands', 'cowering', 'down'), null when it read none ("can't tell"): never his record's st.
import { playerId } from '../../core/ids.js';
import { contactOf } from '../people/mind.js';
import { rangeOf } from '../scenarios/handling.js';

/** The ways a target is engaged, in the order engagedOf tries them. */
export const ENGAGE_WHY = Object.freeze(['row', 'aim', 'bracket']);

const turnerOf = (R, key) => (R?.turners ?? []).find(t => t.key === key) ?? null;
const actorOf = (state, key) => state.actors?.list?.find?.(a => a.id === key && a.who) ?? null;
// (the house's take-in of a stand: your last contact named it since it turned)
const takenIn = (state, T) => { const last = contactOf(state)?.last; return !!last && T.turnAtMs !== null && last.seenMs >= T.turnAtMs && (last.ids ?? []).includes(T.key); };
const struckBy = (T, by = 'me') => (T.hits ?? []).some(h => h.by === by || (by === 'me' && h.by === undefined));

/** What you are engaging (see the header): { key, kind: 'turner' | 'person', who?, why } or null. */
export function engagedOf(state, pid = playerId(state)) {
  const S = state.stop;
  if (!S || S.who !== pid) return null;
  const R = rangeOf(state), house = R?.course === 'house';
  const tries = [[S.doing?.target ?? null, 'row'], [S.aim?.key ?? null, 'aim'], [S.mode === 'stop' ? S.pick ?? null : null, 'bracket']];
  for (const [key, why] of tries) {
    if (!key) continue;
    // (v0.0.19: a door's lock or hinges shot (the ballistic breach's target, kind 'door') is no engagement: no target view)
    if (S.doing?.target?.kind === 'door' || /^o:/.test(String(key))) return null;
    const T = turnerOf(R, key);
    if (T) {
      if (why === 'bracket' && house && !takenIn(state, T) && !struckBy(T)) continue;
      // (v0.0.19: a role-player is a man, his stand's key kept; out of the lane once ruled out, as a stand turned away)
      if (T.live) { if (!T.live.who) continue; return { key, kind: 'person', who: T.live.who, why }; }
      return { key, kind: 'turner', why };
    }
    const a = actorOf(state, key);
    if (a && a.who !== pid) return { key, kind: 'person', who: a.who, why };
  }
  return null;
}

/** Your last round that struck a stand: { key, atMs } or null (the shoot house's records; elsewhere null). */
export function struckLast(state, pid = playerId(state)) {
  void pid;
  const R = rangeOf(state);
  if (R?.course !== 'house') return null;
  for (let i = (R.shots ?? []).length - 1; i >= 0; i--) {
    const x = R.shots[i], T = x.key ? turnerOf(R, x.key) : null;
    if (T && (T.hits ?? []).some(h => h.shotId === x.id && h.by !== 'two')) return { key: x.key, atMs: x.atMs };
  }
  return null;
}

/** Whether a range record is a role-player (a live man riding R.turners: v0.0.19). */
export const isLiveRec = (T) => !!T?.live;
/** The role-player's record by his person (pid), or null. */
export function liveRecOf(state, who) {
  return (rangeOf(state)?.turners ?? []).find(t => t.live && t.live.who === who) ?? null;
}
/** The state your take-in read of a live man (see the header), or null: contact.js identify's last.state, only once taken in since he showed. */
export function seenState(state, key) {
  const R = rangeOf(state), T = turnerOf(R, key);
  if (!T?.live) return null;
  const last = contactOf(state)?.last;
  return takenIn(state, T) ? last?.state?.[key] ?? null : null;
}

/** A stand as you saw it (see the header): { face, holds, armour }. */
export function seenFace(state, key) {
  const R = rangeOf(state), T = turnerOf(R, key);
  if (!T) return { face: 'unknown', holds: 'unseen', armour: false };
  if (R.course !== 'house') return { face: T.face ?? 'threat', holds: T.holds ?? 'rifle', armour: T.face === 'armoured' };
  const last = contactOf(state)?.last, mine = takenIn(state, T);
  const id = mine ? last.ident?.[T.key] ?? null : R.house?.two?.ident?.[T.key] ?? null;
  const holds = id && id !== 'unseen' ? id : 'unseen';
  const face = T.face === 'armoured' ? 'armoured' : T.face === 'hostage' ? 'hostage' : holds === 'rifle' || holds === 'pistol' ? 'threat' : holds === 'hands' || holds === 'phone' ? 'noshoot' : 'unknown';
  return { face, holds, armour: T.face === 'armoured' };
}
