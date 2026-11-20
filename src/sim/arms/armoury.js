// OLYMPUS arms: the rifle's books, the armoury's records of who has which rifle and how many rounds, and the rules that read them (WEAPONS §10.2 to §10.7; the build sheet v0.0.28 §3.1, items 2, 4, 6, 9, 14).
//
// This module is the records (not the place: src/data/places/armoury.js; not the scene: src/sim/scenarios/armoury-day.js; not T's
// lines: src/sim/skills/instinct/armoury.js). A rifle is assigned for the enlistment (WEAPONS §10.1): its serial is six digits by
// hash.js of the world's seed and the item id (serialOf, the same rifle the same number for the whole career; serialWords reads it
// in groups of three for a bubble, "four four seven, one nine three"), its rack slot a label by hash of the id (rackOf; a label, not
// an id: the rack's fixture is the career's armoury, so the books keep `rack` and no reference the id walk would chase). Its record
// is state.armoury.guns[<item id>] (core/state.js' map, its keys item ids since v0.0.5):
//   { assignedId, rack, loc: 'rack' | 'out' | 'lost', out: { toId, byId, atMs } | null, rounds, log: [{ atMs, what, toId?, byId?, ok? }] }
// bookGun enters one at the rack; signOut and signIn move it out to a person and back (the log at most GUN_LOG_MAX 20 lines, the
// oldest dropped, so a save stays small; signIn copies the gun's own count of rounds, the armourer's book), and serialCheck reads
// the card against the rifle each person holds (the sensitive-item check, WEAPONS §10.5): the mismatches, pure.
// The ammunition (WEAPONS §10.4): an issue is a line of state.armoury.ammoIssues, the shape the courses keep since v0.0.7 ({ id,
// atMs, area, toId, cal, load, n, fired, back? }), two fields added where they mean something: handed (the rounds actually handed,
// written only when short of n: the NCO's miscount) and signedAtMs; brassBack (the cases handed back) is the scene's to write at
// the declaration. issueRounds fills the session's own line (the one startRange pushed with n 0), never a second line. reconcile
// is the declaration's one reader: { issued (Σ n), handed, fired, back, held (the rounds on the person: every gun they carry, its
// chamber's round live or misfired and its magazine, the magazine in a hand, the pouches', those at their feet, and the range's
// picked-up rounds, R.picked), losses (the rounds of magazines reported lost), brassFired (one a round fired), brassBack, short
// (issued − (fired + back + held + losses): rounds unaccounted for), ok (nothing short, nothing held, every case back) }, so
// issued = fired + back + held + losses is the books balanced (F173) and short says by how much they are not.
// The magazines drawn are counted back at the turn-in (magsOf: { held, missing }). A lost item (WEAPONS §10.6) is one held by
// nobody whose signer stands more than LOST_M 10 m from it and cannot see it (lostOf: perception.js visibility from the signer's
// eye, PEOPLE §7.1, at its SEEN 0.5); reportLost writes armoury.lost[] = [{ itemId, kind: 'gun' | 'mag', atMs, area, x, z, byId,
// where, rounds? }] (absent until written: additive, no upgrade), a rifle's record to loc 'lost', and the log's record { kind:
// 'armoury', what: 'lost', itemId, text } (told as the bus's 'log' fact, logEntry's). No lockdown, no search, no bill: PEOPLE §11.3's severity 3 and its interrupt are the
// career's (0.0.15). Pure but the writers named (bookGun, signOut, signIn, issueRounds, reportLost), none of which the shipped
// scenes call: their saves are byte for byte as before (F170).
import { hashInt } from '../../core/hash.js';
import { logEntry } from '../log.js';
import { areaOf } from '../places/model.js';
import { gunField } from './firearms.js';
import { holderOf, ownerOf, containersOf, handMagOf, atFeetOf, move } from './kit.js';
import { eyeOf, visibility, SEEN } from '../people/perception.js';

/** A lost item: its signer over this far from it, and it out of their sight (WEAPONS §10.6), m. */
export const LOST_M = 10;
/** A rifle's log keeps at most this many lines, the oldest dropped. */
export const GUN_LOG_MAX = 20;
/** The digits in words, as a serial is read back. */
export const DIGIT_WORDS = Object.freeze(['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']);
/** The cages and racks a slot's label is drawn from (PLACES §4.6's four cages, 18 racks a cage, 10 rifles a rack). */
export const RACK_CAGES = 'efgh', RACK_RACKS = 18, RACK_SLOTS = 10;

const need = (v, why) => { if (v === undefined || v === null) throw new Error(`armoury: ${why}`); return v; };
const recOf = (state, gunId) => need(state.armoury?.guns?.[gunId], `no record for the gun '${gunId}'`);
// (a line in a rifle's log, the oldest dropped past GUN_LOG_MAX)
function logLine(rec, line) {
  (rec.log ??= []).push(line);
  if (rec.log.length > GUN_LOG_MAX) rec.log.splice(0, rec.log.length - GUN_LOG_MAX);
}

// ---- the serial and the slot ----

/** A rifle's serial: six digits by hash of the world's seed and its item id (see the header). */
export const serialOf = (state, gunId) => String(100000 + hashInt(900000, 'serial', state.meta.seed, gunId));
/** A serial read aloud: "four four seven, one nine three". */
export const serialWords = (serial) => {
  const d = String(serial).split('').map(c => DIGIT_WORDS[Number(c)]);
  return `${d.slice(0, 3).join(' ')}, ${d.slice(3).join(' ')}`;
};
/** A rifle's slot in the racks, a label by hash of its id: 'rack-e2#14' (cage, rack, slot). */
export const rackOf = (gunId) => `rack-${RACK_CAGES[hashInt(RACK_CAGES.length, 'rack', gunId)]}${1 + hashInt(RACK_RACKS, 'rack-n', gunId)}#${1 + hashInt(RACK_SLOTS, 'rack-slot', gunId)}`;

// ---- the records ----

/** A rifle entered in the books at the rack (the scene's fill): its record, assigned to a person. Returns it. */
export function bookGun(state, gunId, { assignedId, rack = rackOf(gunId) } = {}) {
  need(state.items?.[gunId], `no gun '${gunId}'`);
  const rec = { assignedId: need(assignedId, `the gun '${gunId}' booked to nobody`), rack, loc: 'rack', out: null, rounds: gunField(state.items[gunId], 'rounds'), log: [] };
  (state.armoury.guns ??= {})[gunId] = rec;
  return rec;
}
/** A rifle signed out of the window to a person, by an armourer. Returns its record. */
export function signOut(state, gunId, toId, byId) {
  const rec = recOf(state, gunId), atMs = state.clock.ms;
  rec.loc = 'out';
  rec.out = { toId: need(toId, 'signed out to nobody'), byId: need(byId, 'signed out by nobody'), atMs };
  logLine(rec, { atMs, what: 'out', toId, byId });
  return rec;
}
/** A rifle signed back in by an armourer: its count of rounds copied, the line clear; at ({ area, x, z }): it lies there, its rack's place. Returns its record. */
export function signIn(state, gunId, byId, { at = null } = {}) {
  const rec = recOf(state, gunId), atMs = state.clock.ms, gun = need(state.items?.[gunId], `no gun '${gunId}'`);
  rec.loc = 'rack';
  rec.out = null;
  rec.rounds = gunField(gun, 'rounds');
  logLine(rec, { atMs, what: 'in', byId: need(byId, 'signed in by nobody') });
  if (at) move(state, gunId, { ground: at });
  return rec;
}
/** The card against the rifles held (WEAPONS §10.5): pairs [{ pid, gunId }] → the mismatches [{ pid, gunId, assignedGunId, card, held }]. Pure. */
export function serialCheck(state, pairs) {
  const out = [];
  for (const { pid, gunId } of pairs) {
    const assigned = Object.keys(state.armoury?.guns ?? {}).find(id => state.armoury.guns[id].assignedId === pid) ?? null;
    if (assigned === gunId) continue;
    out.push({ pid, gunId: gunId ?? null, assignedGunId: assigned, card: assigned ? serialOf(state, assigned) : null, held: gunId ? serialOf(state, gunId) : null });
  }
  return out;
}

// ---- the rounds ----

/** The session's issue line filled at the count (see the header): n the record's, handed what came across the table (only when short). Returns its id. */
export function issueRounds(state, { issueId, n, handed = n }) {
  const line = need(state.armoury?.ammoIssues?.find(a => a.id === issueId), `no issue line '${issueId}'`);
  line.n = need(n, 'an issue of no rounds');
  if (handed !== n) line.handed = handed; else delete line.handed;
  line.signedAtMs = state.clock.ms;
  return issueId;
}
/** The rounds on a person (see the header: their guns' chambers and magazines, the hand's, the pouches', those at their feet). */
export function roundsOn(state, pid) {
  let n = 0;
  const count = (id) => { const m = state.items?.[id]; if (m?.type === 'mag') n += m.n ?? 0; };
  const k = state.people?.[pid]?.kit;
  const guns = [...(k?.hands ?? []).filter(id => id && state.items?.[id]?.type === 'gun'), k?.worn?.sling, k?.worn?.holster].filter((id, i, a) => id && a.indexOf(id) === i);
  for (const id of guns) {
    const gun = state.items?.[id];
    if (!gun) continue;
    const ch = gunField(gun, 'chamber');
    if (ch === 'live' || ch === 'dud') n++;
    if (gun.mag) count(gun.mag);
  }
  const h = handMagOf(state, pid);
  if (h) count(h.id);
  for (const c of containersOf(state, pid)) for (const id of state.items[c].holds ?? []) count(id);
  for (const l of atFeetOf(state, pid)) count(l.id);
  return n;
}
/** The declaration's one reader (see the header). Pure. */
export function reconcile(state, pid) {
  const lines = (state.armoury?.ammoIssues ?? []).filter(a => a.toId === pid);
  const sum = (f) => lines.reduce((t, a) => t + f(a), 0);
  const issued = sum(a => a.n ?? 0), handed = sum(a => a.handed ?? a.n ?? 0), fired = sum(a => a.fired ?? 0), back = sum(a => a.back ?? 0);
  const brassBack = sum(a => a.brassBack ?? 0);
  const held = roundsOn(state, pid) + (state.armoury?.range?.picked ?? 0);
  const losses = (state.armoury?.lost ?? []).filter(l => l.byId === pid).reduce((t, l) => t + (l.rounds ?? 0), 0);
  const short = issued - (fired + back + held + losses);
  return { issued, handed, fired, back, held, losses, brassFired: fired, brassBack, short, ok: short === 0 && held === 0 && brassBack >= fired };
}

// ---- the magazines and the lost ----

/** The magazines a person drew, counted back: { held (on them), missing }. Pure. */
export function magsOf(state, pid, drawn = []) {
  const held = [], missing = [];
  for (const id of drawn) (state.items?.[id] && ownerOf(state, id) === pid ? held : missing).push(id);
  return { held, missing };
}
// (where an item lies: its ground holder, through the container or gun it is in; null when a person or nothing holds it)
function lyingAt(state, itemId) {
  let h = holderOf(state, itemId);
  for (let guard = 0; h && guard < 8; guard++) {
    if (h.ground) return h.ground;
    if (h.pid) return null;
    h = h.container ? holderOf(state, h.container) : h.gun ? holderOf(state, h.gun) : null;
  }
  return null;
}
/**
 * Whether an item is lost (WEAPONS §10.6; see the header): { lost, where ({ area, x, z } | null), why ('held' | 'nowhere' | 'unsigned' |
 * 'near' | 'in sight' | 'gone') }. by: the person it is signed to (a rifle's record's out.toId by default). Pure.
 */
export function lostOf(state, itemId, { by = null } = {}) {
  if (ownerOf(state, itemId)) return { lost: false, where: null, why: 'held' };
  const at = lyingAt(state, itemId);
  if (!at) return { lost: false, where: null, why: 'nowhere' };
  const signer = by ?? state.armoury?.guns?.[itemId]?.out?.toId ?? null;
  if (!signer) return { lost: false, where: at, why: 'unsigned' };
  const a = state.actors?.list?.find(x => x.who === signer) ?? null;
  if (a && at.area === state.places?.live?.area) {
    if (Math.hypot(a.x - at.x, a.z - at.z) <= LOST_M) return { lost: false, where: at, why: 'near' };
    if (visibility(state, eyeOf(state, a), at.x, at.z) >= SEEN) return { lost: false, where: at, why: 'in sight' };
  }
  return { lost: true, where: at, why: 'gone' };
}
/** A lost item reported (see the header): its entry, a rifle's record to 'lost', the log's record. Returns the entry. */
export function reportLost(state, bus, itemId, { by, kind = state.items?.[itemId]?.type === 'gun' ? 'gun' : 'mag', where = null } = {}) {
  const at = lyingAt(state, itemId), item = state.items?.[itemId], atMs = state.clock.ms;
  const place = where ?? (at ? areaOf(at.area)?.name ?? at.area : 'unknown');
  const entry = { itemId, kind, atMs, ...(at ? { area: at.area, x: at.x, z: at.z } : {}), byId: need(by, 'a loss reported against nobody'), where: place };
  if (item?.type === 'mag' && (item.n ?? 0) > 0) entry.rounds = item.n;
  (state.armoury.lost ??= []).push(entry);
  const rec = state.armoury.guns?.[itemId];
  if (rec) { rec.loc = 'lost'; logLine(rec, { atMs, what: 'lost', byId: by }); }
  logEntry(state, bus, { kind: 'armoury', tone: 'warn', what: 'lost', itemId, text: `${kind === 'gun' ? 'A rifle' : 'A magazine'} lost: ${place}.`, who: by, area: state.places?.live?.area ?? undefined });
  return entry;
}
