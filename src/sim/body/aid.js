// OLYMPUS body: the casualty's care in a real fight, your own tourniquet and the corpsman's card after it (BODY §18; COMBAT §7.3, §7.10; v0.0.27, "Away the boarding party": its build sheet §0 items 9 and 15, FT§7).
//
// Self-aid (COMBAT §7.3's level 2): a limb bleeding hard is the one wound a marine treats himself in the fight, with one hand and his
// own tourniquet; nothing for the torso (a chest seal and pressure are the IFAK's, 0.1.x) and nothing for another man (buddy aid waits;
// the corpsman comes). tourniquetOf(rec, ms) is the wound that wants it: the worst limb injury bleeding at HARD_BLEED_PM 4 %/min or more,
// or an artery, at ms, not internal, not cared (the artery first, then the rate); null when there is none. The same two functions are
// everyone's: your row "Tourniquet · 25 s" (combat/contact.js, TQ_MS in TQ_PARTS parts, so a sighting cuts it at a part's end), the
// holders' and Four's self-aid at the head of their ticks (C's) and the defenders' (A's). applyTourniquet(rec, injury, ms) is the care
// done: the blood anchored at ms, then every injury of that limb still bleeding and not internal stopped there (`bleed` ms) and cared
// 'tourniquet', exactly as wounds.js careOf's limb rule writes it (one strap high on the limb stops what bleeds below it, my call), so
// the corpsman finds it as done and wounds.js woundMods counts the limb as broken (−6 on Weapon handling, −4 on the hands and arms).
// boardingCare(state, endMs) is the corpsman across the collar at the scene's end, any end (FT§7.3): every wounded person of the fight,
// ours first (the fire team, combat/team.js fireTeamOf, in its order, then any other marine), then theirs (the live men, in the
// turners' order; the hauler's crew among them, marked `crew`), each given wounds.js careOf at endMs + n × CARE_EACH_MS (n from 1, so
// a pirate fourth in the line waits eight minutes) on a copy of his body, and wounds.js casualtyOutcome from then over EVAC_MIN 12
// minutes: 'stable' (stabilised on the deck), 'aidStation' (evacuated), 'diedOfWounds' (dead before the aid station), or 'killed' for
// a man dead at the end (a fourth outcome the sheet's three leave out: killed outright is not died of wounds). Pure: the bodies are
// read, never written; the card reads it.
import { MIN_MS } from '../../core/clock.js';
import { playerId } from '../../core/ids.js';
import { HARD_BLEED_PM, EVAC_MIN, hasWounds, careOf, casualtyOutcome, anchorBlood, hitWhere } from './wounds.js';
import { fireTeamOf } from '../combat/team.js';
import { sessionOf } from '../combat/op.js';

/** The tourniquet (BODY §18): its time (ms) and the parts it is done in (a cue cuts it at a part's end; contact.js). */
export const TQ_MS = 25_000, TQ_PARTS = 5;
/** The corpsman's time a casualty after the fight (ms; my call): two minutes each, ours first. */
export const CARE_EACH_MS = 120_000;
/** The limbs a tourniquet goes on. */
export const TQ_LIMBS = Object.freeze(['armL', 'armR', 'legL', 'legR']);
/** The card's outcomes, by wounds.js casualtyOutcome's (see the header). */
export const CARE_OUTCOME = Object.freeze({ stabilised: 'stable', evacuated: 'aidStation', dead: 'diedOfWounds' });

const hard = (i, ms) => !i.internal && !i.cared && i.bleed > ms && TQ_LIMBS.includes(i.part) && (!!i.artery || (i.rate ?? 0) >= HARD_BLEED_PM);

/** The limb wound a tourniquet wants at ms (see the header): the injury record, or null. */
export function tourniquetOf(rec, ms) {
  if (!hasWounds(rec) || rec.dead) return null;
  let best = null;
  for (const i of rec.injuries ?? []) {
    if (!hard(i, ms)) continue;
    if (!best || (!!i.artery && !best.artery) || (!!i.artery === !!best.artery && (i.rate ?? 0) > (best.rate ?? 0))) best = i;
  }
  return best;
}

/** The tourniquet on (w; see the header): the limb's bleeds stopped at ms, cared 'tourniquet'. Returns the injuries it stopped. */
export function applyTourniquet(rec, injury, ms) {
  if (!rec || !injury || !TQ_LIMBS.includes(injury.part) || rec.dead) return [];
  anchorBlood(rec, ms);
  if (rec.dead) return [];
  const out = [];
  for (const i of rec.injuries ?? []) {
    if (i.part !== injury.part || i.internal || i.cared || !(i.bleed > ms)) continue;
    i.bleed = ms; i.cared = 'tourniquet';
    out.push(i);
  }
  return out;
}

// (a body copied for the corpsman's closed form: plain data, so a structured copy is the whole of it)
const copyOf = (rec) => JSON.parse(JSON.stringify(rec));
const branchOf = (state, pid) => state.people?.[pid]?.service?.branch ?? null;

/**
 * The corpsman's card (see the header): [{ pid, side: 'ours' | 'theirs', crew, n, fromMs, care: ['tourniquet' | 'dressing'], outcome:
 * 'stable' | 'aidStation' | 'diedOfWounds' | 'killed', atMs, bloodPct, where, words }], ours first, a wounded person each.
 */
export function boardingCare(state, endMs) {
  const team = fireTeamOf(state).map(m => m.pid).filter(Boolean), me = playerId(state);
  const live = (sessionOf(state)?.turners ?? []).filter(T => T.live?.who).map(T => T.live.who);
  const ours = [...new Set([...(team.includes(me) || !me ? [] : [me]), ...team])];
  for (const pid of Object.keys(state.people ?? {})) if (!ours.includes(pid) && !live.includes(pid) && branchOf(state, pid) === 'marines' && hasWounds(state.people[pid].body)) ours.push(pid);
  const line = [...ours.map(pid => ({ pid, side: 'ours' })), ...live.filter(pid => !ours.includes(pid)).map(pid => ({ pid, side: 'theirs' }))]
    .filter(x => hasWounds(state.people?.[x.pid]?.body));
  return line.map((x, k) => {
    const body = state.people[x.pid].body, n = k + 1, fromMs = endMs + n * CARE_EACH_MS, crew = state.people[x.pid]?.kit?.tmpl === 'boarding-crew';
    if (body.dead && body.dead.ms <= endMs) return { ...x, crew, n, fromMs, care: [], outcome: 'killed', atMs: body.dead.ms, bloodPct: null, where: hitWhere(body), words: 'killed outright' };
    const c = copyOf(body), before = (c.injuries ?? []).map(i => !!i.cared);
    careOf(c, fromMs, { tier: 'corpsman' });
    const care = [...new Set((c.injuries ?? []).filter((i, j) => i.cared && !before[j]).map(i => i.cared))];
    const o = casualtyOutcome(c, { fromMs, evacMs: EVAC_MIN * MIN_MS });
    return { ...x, crew, n, fromMs, care, outcome: CARE_OUTCOME[o.outcome] ?? o.outcome, atMs: o.atMs, bloodPct: o.bloodPct, where: hitWhere(body), words: o.words };
  });
}
