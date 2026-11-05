// OLYMPUS core: saves. IndexedDB in the browser, save files and bug reports to export and import.
//
// The one core module that talks to the browser for saving (IndexedDB, and for export and import
// a download link and a file picker). Nothing in the sim imports it: main.js and the screens do.
// It loads in node without touching anything: its pure parts (slots, records, the rotation plan,
// offers, file names, the report) are tested there (tests/core-store.test.mjs, with a small
// IndexedDB of its own), and the real IndexedDB in a page (tests/store-browser.test.mjs).
//
// The database (TECH §7.1): 'olympus', version 2, three stores. Version 1's 'saves' is kept as it
// is (its records are read as they stand), and the upgrade adds the other two. A database a newer
// OLYMPUS has taken to a higher version is opened as it stands, with no version (IndexedDB refuses
// a lower number with a VersionError), and used while it holds these three stores, so rolling the
// play copy back a release keeps the saves in reach (my call after the 0.0.2 review: v0.0.1 cannot
// do this, so after 0.0.2 has run, 0.0.1 finds no saves until the play copy is promoted forward):
//   saves     keyPath 'slot'   the save records
//   profile   keyPath 'key'    one record, 'profile': the worlds played, the careers, the unlocks
//                              (CAREER §3.2); it outlives any world and is never versioned away
//   cache     keyPath 'key'    things the game can make again at any time (sky maps): cleared
//                              freely, never needed for correctness
// Origins keep databases apart: the play copy's are the user's, the dev server's, the tests' and
// the agents' are each their own port's.
//
// Slots are per world (TECH §7.2): '<worldId>:<name>', 'w-48213:auto'. The names:
//   auto, auto-prev   a Standard career's autosave, and an older one rotated on time (below)
//   day               Standard: the sol's first quiet moment after local 00:00, a sol old at most
//   manual-1..9       Standard: nine slots of the player's own (correction 21)
//   edge              Standard: the content edge's save (ROADMAP §2.6)
//   ironman           an Ironman career's one slot, which is also its edge save
//   ironman-prev      Ironman: hidden, rotated like auto-prev, offered only by recovery
// An Ironman career saves only to 'ironman', a Standard one to the rest, nobody to a -prev by hand
// (maySaveTo). A slot with no world (v0.0.1's 'auto', 'manual-3') is read as world 'w-legacy': such
// a record is listed and loads as it stands, and its game saves on into its own world from then on.
// A bare name given to a write (save(name, state)) means the state's own world.
//
// A record (TECH §7.3): { slot, world, career, json, digest, bytes, about, version, schema, mode,
// seed, gameMs, savedAt, marks }. json is state.js toJSON() (canonical: a save, a load and a save
// again give the same bytes); digest is hash.js digest(json), checked on load; bytes its UTF-8
// length; version the game that wrote it (setVersion, from VERSION); about a line for the load
// list; savedAt real time (ms since 1970); marks the state's honesty marks (debugUsed, imported,
// recovered), for the load list. list() gives summaries: the record without its json, with name.
//
// Rotation on time (TECH §7.4, my call there): a door writes an autosave, so copying auto to
// auto-prev at every write would leave auto-prev seconds behind, and a bug that breaks the state
// would be in both within moments. So an autosave copies the auto slot's record to auto-prev, in
// the same transaction, only when the auto-prev there is AUTO_PREV_GAME_MS (10 game minutes) or
// AUTO_PREV_REAL_MS (5 real minutes) older than the save being written, or there is none; and never
// a record whose digest fails (a damaged auto overwritten is lost; copied, it would take the good
// one with it). ironman-prev rotates from ironman the same way. planAutosave() is the rule, pure.
// An autosave with why 'day' also writes 'day', and with 'edge' writes 'edge' (Standard; an Ironman
// career's edge save is its own slot).
//
// Loading checks the digest, then fromJSON() upgrades the save. A save that fails (the digest, the
// parse, the upgrade; or main.js finds each of its first RECOVER_TICKS ticks lost) is damaged, and
// load() throws a SaveError with the slots that could stand in (TECH §7.3): Standard auto-prev,
// then day, then the world's newest manual slot; Ironman its hidden ironman-prev. recover() loads
// the first of them that loads, and marks an Ironman career recovered (meta.recovered), an honesty
// mark kept on the profile and the load list, never in the fiction (correction 22).
//
// Export writes the canonical JSON to a file (both modes: "to keep, or to send with a bug";
// LONGHAUL "had to decode Chrome's IndexedDB blobs to get at a save"); import reads it back through
// fromJSON(), and an Ironman career restored that way is marked imported. A bug report (TECH §7.6)
// carries the anchor (the last autosave's JSON), the inputs since it, the errors, the renderer and
// the engine (Chrome's V8 differs from node's: rule 11), and the state now.
import { toJSON, fromJSON, SAVE_SCHEMA } from './state.js';
import { isoText } from './calendar.js';
import { digest } from './hash.js';

export const DB_NAME = 'olympus';
export const DB_VERSION = 2;
export const SAVES = 'saves', PROFILE = 'profile', CACHE = 'cache';
export const STORES = Object.freeze([SAVES, PROFILE, CACHE]);
export const MANUAL_SLOTS = Object.freeze(Array.from({ length: 9 }, (_, i) => `manual-${i + 1}`));
export const STANDARD_NAMES = Object.freeze(['auto', 'auto-prev', 'day', ...MANUAL_SLOTS, 'edge']);
export const IRONMAN_NAMES = Object.freeze(['ironman', 'ironman-prev']);
export const SLOT_NAMES = Object.freeze([...STANDARD_NAMES, ...IRONMAN_NAMES]);
export const HIDDEN_NAMES = Object.freeze(['auto-prev', 'ironman-prev']);
export const LEGACY_WORLD = 'w-legacy';
export const AUTO_PREV_GAME_MS = 600_000;                          // 10 game minutes (TECH §7.4)
export const AUTO_PREV_REAL_MS = 300_000;                          // 5 real minutes, by savedAt
export const RECOVER_TICKS = 20;                                   // the first ticks after a load: all lost means damaged (§7.3)
export const MARKS = Object.freeze(['debugUsed', 'imported', 'recovered']);
export const PROFILE_KEY = 'profile';

let VERSION = '?';
/** The game's version, stamped on every save (main.js reads VERSION and sets it). */
export function setVersion(v) { VERSION = String(v ?? '?').trim() || '?'; }
export const version = () => VERSION;

let nowMs = () => Date.now();
/** The real clock savedAt and the report read (tests set one; no argument puts Date.now back). */
export function useClock(fn = () => Date.now()) { nowMs = fn; }
const perfNow = () => globalThis.performance?.now?.() ?? nowMs();

// ---- slots ----

/** A state's world: meta.worldId ('w-48213'), else the one its seed names (what upgradeState fills). */
export const worldOf = (state) => state?.meta?.worldId ?? `w-${(state?.meta?.seed ?? 0) >>> 0}`;

/** A world's slot: slotOf('w-48213', 'auto') → 'w-48213:auto'. Throws on a name not in SLOT_NAMES. */
export function slotOf(worldId, name) {
  if (!SLOT_NAMES.includes(name)) throw new Error(`no save slot '${name}'`);
  if (typeof worldId !== 'string' || !worldId || worldId.includes(':')) throw new Error(`no world '${worldId}'`);
  return `${worldId}:${name}`;
}

/** A slot's world and name; a slot with no world (v0.0.1's 'auto') is w-legacy's. */
export function parseSlot(slot) {
  const s = String(slot), i = s.lastIndexOf(':');
  return i < 0 ? { world: LEGACY_WORLD, name: s } : { world: s.slice(0, i), name: s.slice(i + 1) };
}

/** Whether a slot (with or without its world) names one of the slots. */
export const isSlot = (slot) => { const { world, name } = parseSlot(slot); return !!world && SLOT_NAMES.includes(name); };

/** A slot for a write: a bare name is in the state's own world, a full slot stays as it is. */
export const slotFor = (state, slotOrName) => (String(slotOrName).includes(':') ? String(slotOrName) : slotOf(worldOf(state), slotOrName));

/** Where a career's autosave goes: its world's 'ironman' for an Ironman career, 'auto' otherwise. */
export const autoSlotOf = (state) => slotOf(worldOf(state), state?.meta?.mode === 'ironman' ? 'ironman' : 'auto');

/** The hidden older copy of an autosave slot: 'w-1:auto' → 'w-1:auto-prev'. */
export function prevSlotOf(slot) {
  const { world, name } = parseSlot(slot);
  if (name !== 'auto' && name !== 'ironman') throw new Error(`no older copy of '${slot}'`);
  return `${world}:${name}-prev`;
}

/**
 * Whether a career may be saved to a slot: its own world only; an Ironman career only to
 * 'ironman', a Standard one to any other; nobody to a -prev (rotation writes those).
 */
export function maySaveTo(state, slot) {
  let full;
  try { full = slotFor(state, slot); } catch { return false; }
  const { world, name } = parseSlot(full);
  if (!SLOT_NAMES.includes(name) || HIDDEN_NAMES.includes(name) || world !== worldOf(state)) return false;
  return state?.meta?.mode === 'ironman' ? name === 'ironman' : name !== 'ironman';
}

// ---- records ----

// (UTF-8 bytes of a string: its length while it is ASCII, which a save almost always is)
const NON_ASCII = /[^\x00-\x7f]/;
export function utf8Bytes(s) {
  if (!NON_ASCII.test(s)) return s.length;
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) { n += 4; i++; }   // (a surrogate pair: one code point, four bytes)
    else n += 3;
  }
  return n;
}

/** The honesty marks a state carries, in MARKS order. */
export const marksOf = (state) => MARKS.filter(m => state?.meta?.[m]);

/** The record a state makes in a slot (pure but for savedAt: what save() writes). */
export function recordOf(slot, state, about = '', json = toJSON(state)) {
  const { world } = parseSlot(slot);
  return {
    slot, world, career: state.career?.id ?? null, json, digest: digest(json), bytes: utf8Bytes(json), about,
    version: VERSION, schema: SAVE_SCHEMA, mode: state.meta.mode, seed: state.meta.seed, gameMs: state.clock.ms,
    savedAt: nowMs(), marks: marksOf(state),
  };
}

/** A record for the lists: everything but its json, with its world and name (a v0.0.1 record filled in). */
export function summaryOf(record) {
  const { json, ...rest } = record;
  const { world, name } = parseSlot(record.slot);
  return { ...rest, world: rest.world ?? world, name, bytes: rest.bytes ?? (typeof json === 'string' ? utf8Bytes(json) : 0), marks: rest.marks ?? [], career: rest.career ?? null };
}

/** Whether a record's json still matches its digest (a v0.0.1 record has none: nothing to check). */
export const digestOk = (record) => !record.digest || digest(record.json) === record.digest;

/** A save that would not load: code 'damaged', 'missing' or 'newer'; offers, the slots that could stand in. */
export class SaveError extends Error {
  constructor(code, slot, offers = [], why = '') {
    const text = { damaged: 'This save is damaged', missing: 'There is no save', newer: 'This save is from a newer OLYMPUS' }[code] ?? 'This save will not load';
    super(`${text}: ${slot}${why ? ` (${why})` : ''}`);
    this.name = 'SaveError';
    this.code = code; this.slot = slot; this.offers = offers; this.why = why;
  }
}

/** The state a record holds (pure): its digest checked, then fromJSON's upgrade. Throws a SaveError. */
export function stateOfRecord(record, slot = record?.slot) {
  if (!record || typeof record.json !== 'string') throw new SaveError('missing', slot);
  if (record.schema > SAVE_SCHEMA) throw new SaveError('newer', slot, [], `schema ${record.schema}, this game reads ${SAVE_SCHEMA}`);
  if (!digestOk(record)) throw new SaveError('damaged', slot, [], 'its digest does not match');
  try { return fromJSON(record.json); }
  catch (e) {
    if (/newer/.test(e.message)) throw new SaveError('newer', slot, [], e.message);
    throw new SaveError('damaged', slot, [], e.message);
  }
}

/**
 * The slots that could stand in for a damaged one (pure), from the world's summaries (hidden
 * included): Standard auto-prev, day, the newest manual slot; Ironman ironman-prev. Only slots that
 * hold a record, never the damaged slot itself.
 */
export function offersFor(slot, summaries) {
  const { world, name } = parseSlot(slot);
  const here = new Map(summaries.filter(r => parseSlot(r.slot).world === world).map(r => [parseSlot(r.slot).name, r]));
  const mine = summaries.find(r => r.slot === slot);
  const ironman = IRONMAN_NAMES.includes(name) || (!STANDARD_NAMES.includes(name) && mine?.mode === 'ironman');
  const out = ironman ? ['ironman-prev'] : ['auto-prev', 'day'];
  if (!ironman) {
    const manual = [...here.values()].filter(r => MANUAL_SLOTS.includes(parseSlot(r.slot).name) && r.slot !== slot)
      .sort((a, b) => b.savedAt - a.savedAt || (a.slot < b.slot ? -1 : 1))[0];
    if (manual) out.push(parseSlot(manual.slot).name);
  }
  // (each offer is the stand-in's own key: a v0.0.1 record's is its bare name, 'manual-3', not 'w-legacy:manual-3')
  return out.filter(n => here.has(n) && here.get(n).slot !== slot).map(n => here.get(n).slot);
}

/**
 * The plan of an autosave (pure: the rule, TECH §7.4). auto is the record now in the career's
 * autosave slot (or null), prev the one in its -prev (or null), next the record to write; why the
 * autosave's reason. Gives { puts, rotated, extra, kept }: the records to put, in order, in one
 * transaction; whether auto went to -prev; the extra slot written ('day', 'edge') or null; and why
 * a rotation due was not made ('damaged') or null.
 */
export function planAutosave({ auto = null, prev = null } = {}, next, { mode = 'standard', why = 'live' } = {}) {
  const puts = [];
  let rotated = false, kept = null, extra = null;
  const due = !!auto && (!prev || next.gameMs - prev.gameMs >= AUTO_PREV_GAME_MS || next.savedAt - prev.savedAt >= AUTO_PREV_REAL_MS);
  if (due && !digestOk(auto)) kept = 'damaged';
  else if (due) { puts.push({ ...auto, slot: prevSlotOf(next.slot) }); rotated = true; }
  puts.push(next);
  if (mode !== 'ironman' && (why === 'day' || why === 'edge')) {
    const slot = slotOf(parseSlot(next.slot).world, why);
    puts.push({ ...next, slot });
    extra = slot;
  }
  return { puts, rotated, extra, kept };
}

/** A profile with nothing in it: CAREER §3.2's, kept across worlds. */
export const emptyProfile = () => ({ key: PROFILE_KEY, worlds: [], careers: [], unlocks: {} });

/** The profile after a save in a world (pure): the world noted, its last play, its honesty marks. */
export function profileAfterSave(profile, record) {
  const p = { ...emptyProfile(), ...(profile ?? {}), key: PROFILE_KEY };
  p.worlds = (p.worlds ?? []).map(w => ({ ...w }));
  let w = p.worlds.find(x => x.worldId === record.world);
  if (!w) p.worlds.push(w = { worldId: record.world, createdAt: record.savedAt, lastPlayedAt: record.savedAt });
  w.lastPlayedAt = Math.max(w.lastPlayedAt ?? 0, record.savedAt);
  const marks = MARKS.filter(m => w.marks?.includes(m) || record.marks?.includes(m));
  if (marks.length) w.marks = marks;
  return p;
}

// ---- IndexedDB ----

let idb = null, dbPromise = null;
const factory = () => idb ?? globalThis.indexedDB;

/**
 * The IndexedDB to use (tests give one of their own; no argument goes back to the browser's). The
 * connection held is closed, so the next call opens the new one.
 */
export function useIndexedDB(f = null) {
  const was = dbPromise;
  idb = f; dbPromise = null;
  was?.then(db => db.close()).catch(() => {});
}

// (one open request: at a version, or with none, as the database stands)
function openAt(f, ver) {
  return new Promise((resolve, reject) => {
    const req = ver === undefined ? f.open(DB_NAME) : f.open(DB_NAME, ver);
    // (version 1 had 'saves' alone: kept as it is, its records read as they stand)
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SAVES)) db.createObjectStore(SAVES, { keyPath: 'slot' });
      if (!db.objectStoreNames.contains(PROFILE)) db.createObjectStore(PROFILE, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(CACHE)) db.createObjectStore(CACHE, { keyPath: 'key' });
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };   // (another tab upgrading: let it)
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    // (another tab holds an older version open: its onversionchange closes it, and then this one
    // goes on; nothing to do but wait)
    req.onblocked = () => {};
  });
}

function open() {
  if (dbPromise) return dbPromise;
  const f = factory();
  if (!f) return Promise.reject(new Error('no IndexedDB here'));
  dbPromise = openAt(f, DB_VERSION).catch((e) => {
    if (e?.name !== 'VersionError') throw e;
    // (a newer OLYMPUS has raised the version, which IndexedDB never lets an older one open by
    // number: opened as it stands, and used if it still holds the three stores, so a rollback
    // keeps its saves. What it reads it reads by stateOfRecord, which refuses a newer schema)
    return openAt(f, undefined).then((db) => {
      if (STORES.every(n => db.objectStoreNames.contains(n))) return db;
      db.close();
      throw new Error(`the saves' database is at version ${db.version}, from a newer OLYMPUS, without the stores this one needs`);
    });
  }).catch((e) => { dbPromise = null; throw e; });
  return dbPromise;
}

/**
 * One transaction over stores: fn(tx) makes its requests (callbacks only: an await inside would let
 * the transaction commit) and returns a thunk read once it completes, or a request whose result is
 * the answer.
 */
async function run(stores, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    let out;
    try { out = fn(t); } catch (e) { try { t.abort(); } catch { /* (already finished) */ } reject(e); return; }
    t.oncomplete = () => resolve(typeof out === 'function' ? out() : out?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error ?? new Error('save transaction aborted'));
  });
}

// (the profile updated in a transaction already open on it)
function touchProfile(t, record) {
  const s = t.objectStore(PROFILE), g = s.get(PROFILE_KEY);
  g.onsuccess = () => s.put(profileAfterSave(g.result ?? null, record));
}

/** Write a state to a slot (a bare name is in its world). Resolves to the record's summary. */
export async function save(slot, state, about = '') {
  const full = slotFor(state, slot);
  if (!maySaveTo(state, full)) throw new Error(`a ${state?.meta?.mode ?? '?'} career may not save to '${full}'`);
  const rec = recordOf(full, state, about);
  await run([SAVES, PROFILE], 'readwrite', (t) => { t.objectStore(SAVES).put(rec); touchProfile(t, rec); });
  return summaryOf(rec);
}

/**
 * The career's autosave (TECH §7.4): its auto or ironman slot, with the rotation to -prev and the
 * extra 'day' or 'edge' slot planned by planAutosave(), all in one transaction. Resolves to
 * { slot, rotated, extra, kept, bytes, ms } (ms: real time from the encode to the commit).
 */
export async function autosave(state, about = '', { why = 'live' } = {}) {
  const t0 = perfNow();
  const slot = autoSlotOf(state), next = recordOf(slot, state, about), prevSlot = prevSlotOf(slot);
  let plan = null;
  await run([SAVES, PROFILE], 'readwrite', (t) => {
    const s = t.objectStore(SAVES), ga = s.get(slot), gp = s.get(prevSlot);
    // (requests on one store complete in order: the auto record is in by the time prev's is)
    gp.onsuccess = () => {
      plan = planAutosave({ auto: ga.result ?? null, prev: gp.result ?? null }, next, { mode: state.meta.mode, why });
      for (const r of plan.puts) s.put(r);
    };
    touchProfile(t, next);
  });
  return { slot, rotated: plan.rotated, extra: plan.extra, kept: plan.kept, bytes: next.bytes, ms: perfNow() - t0 };
}

/** The record in a slot (with its json), or null. */
export const getRecord = (slot) => run([SAVES], 'readonly', t => t.objectStore(SAVES).get(String(slot))).then(r => r ?? null);

/** Every save's summary, newest first; of one world, and the hidden -prev slots, when asked. */
export async function list({ world = null, hidden = false } = {}) {
  const all = (await run([SAVES], 'readonly', t => t.objectStore(SAVES).getAll())) ?? [];
  return all.map(summaryOf)
    .filter(r => (world === null || r.world === world) && (hidden || !HIDDEN_NAMES.includes(r.name)))
    .sort((a, b) => b.savedAt - a.savedAt || (a.slot < b.slot ? -1 : a.slot > b.slot ? 1 : 0));
}

/** The slots that could stand in for a damaged one, from what the store holds now. */
export async function offersOf(slot) {
  return offersFor(String(slot), await list({ world: parseSlot(slot).world, hidden: true }));
}

/**
 * The state saved in a slot, its digest checked and upgraded. Throws a SaveError: 'missing',
 * 'newer', or 'damaged' with the slots that could stand in (recover() loads the first that loads).
 */
export async function load(slot) {
  const rec = await getRecord(slot);
  try { return stateOfRecord(rec, String(slot)); }
  catch (e) {
    if (e instanceof SaveError && e.code !== 'newer') e.offers = await offersOf(slot).catch(() => []);
    throw e;
  }
}

/**
 * The first stand-in for a damaged slot that loads: { state, from }. An Ironman career recovered
 * from its ironman-prev is marked meta.recovered (TECH §7.3). Throws a SaveError if none loads.
 */
export async function recover(slot) {
  const offers = await offersOf(slot), tried = [];
  for (const from of offers) {
    try {
      const state = stateOfRecord(await getRecord(from), from);
      if (parseSlot(from).name === 'ironman-prev' || state.meta.mode === 'ironman') state.meta.recovered = true;
      return { state, from };
    } catch (e) { tried.push(`${from}: ${e.message}`); }
  }
  throw new SaveError('damaged', String(slot), [], tried.length ? `no stand-in loads (${tried.join('; ')})` : 'nothing to stand in');
}

/** Empty a slot. */
export const remove = (slot) => run([SAVES], 'readwrite', t => t.objectStore(SAVES).delete(String(slot)));
export { remove as delete };

/** The profile (an empty one until something is saved). */
export const getProfile = () => run([PROFILE], 'readonly', t => t.objectStore(PROFILE).get(PROFILE_KEY)).then(p => p ?? emptyProfile());
/** Write the profile whole. */
export const putProfile = (p) => run([PROFILE], 'readwrite', t => { t.objectStore(PROFILE).put({ ...p, key: PROFILE_KEY }); });

/** A cached thing (any structured-cloneable value), or null. */
export const cacheGet = (key) => run([CACHE], 'readonly', t => t.objectStore(CACHE).get(String(key))).then(r => r?.value ?? null);
export const cachePut = (key, value) => run([CACHE], 'readwrite', t => { t.objectStore(CACHE).put({ key: String(key), value }); });
export const cacheClear = () => run([CACHE], 'readwrite', t => { t.objectStore(CACHE).clear(); });

// ---- the engine, for the report ----

/** V8's version from Chrome's milestone (Chrome 124 shipped V8 12.4, the one node 22 carries): '14.2' for 142. */
export const v8OfChrome = (major) => (Number.isFinite(major) && major >= 10 ? `${Math.floor(major / 10)}.${major % 10}` : null);

/**
 * Which JavaScript engine runs this (TECH §7.6): { browser, v8, platform }. In Chrome from
 * navigator.userAgentData's high-entropy values; elsewhere from the user agent; in node its own.
 */
export async function engineInfo() {
  const nav = globalThis.navigator;
  if (globalThis.process?.versions?.node) {                        // (node 21 and later have a navigator too: 'Node.js/22')
    const v = globalThis.process.versions;
    return { browser: `node ${v.node}`, v8: String(v.v8).split('.').slice(0, 2).join('.'), platform: globalThis.process.platform };
  }
  try {
    const hi = await nav?.userAgentData?.getHighEntropyValues?.(['fullVersionList', 'platform']);
    const brand = hi?.fullVersionList?.find(b => /Chrom/.test(b.brand) && !/Not/.test(b.brand));
    if (brand) return { browser: `${brand.brand.replace('Google ', '')} ${brand.version}`, v8: v8OfChrome(parseInt(brand.version, 10)), platform: hi.platform || nav.platform || '?' };
  } catch { /* (refused, or not Chrome: the user agent says enough) */ }
  const ua = nav?.userAgent ?? '';
  const chrome = /Chrome\/(\d+)[\d.]*/.exec(ua), firefox = /Firefox\/([\d.]+)/.exec(ua), safari = /Version\/([\d.]+).*Safari/.exec(ua);
  const browser = chrome ? `Chrome ${chrome[0].slice(7)}` : firefox ? `Firefox ${firefox[1]}` : safari ? `Safari ${safari[1]}` : (ua || '?');
  return { browser, v8: chrome ? v8OfChrome(Number(chrome[1])) : null, platform: nav?.userAgentData?.platform || nav?.platform || '?' };
}

// ---- files and reports ----

const stamp = (ms) => isoText(ms).replace(/:/g, '-');
/** An exported save's file name: 'olympus-w-48213-standard-2351-12-19T02-20-00Z.json' (the game's UTC). */
export const fileName = (state) => `olympus-${worldOf(state)}-${state.meta.mode}-${stamp(state.clock.ms)}.json`;
/** A bug report's file name: 'olympus-report-w-48213-2351-12-19T02-20-00Z.json'. */
export const reportName = (state) => `olympus-report-${worldOf(state)}-${stamp(state.clock.ms)}.json`;

/**
 * A bug report (TECH §7.6), plain data: the anchor (the last autosave's JSON) and its seq, the
 * inputs and skip commands since, the checkpoints, the errors (meta.errors unless given), the
 * renderer, the engine, the screen and the density, the stats, and the state now with its digest.
 */
export function reportOf(state, { anchor = null, anchorSeq = null, inputs = [], skipCmds = [], checkpoints = [], errors = null,
  stats = {}, renderer = null, screen = null, ppm = null, engine = null } = {}) {
  const json = toJSON(state);
  return {
    olympus: 'report', version: VERSION, world: worldOf(state), mode: state.meta.mode, gameMs: state.clock.ms, madeAt: nowMs(),
    renderer, engine, screen, ppm, anchor, anchorSeq, inputs, skipCmds, checkpoints,
    errors: errors ?? state.meta.errors ?? [], stats, state: json, digest: digest(json),
  };
}

/** Mark a state imported from a file: an Ironman career restored from an export says so (TECH §7.6). */
export function markImported(state) {
  if (state?.meta?.mode === 'ironman') state.meta.imported = true;
  return state;
}

function download(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return name;
}

/** Offer a save as a file to download (a state, or its json). Returns the file's name. */
export function exportFile(stateOrJson, name) {
  const json = typeof stateOrJson === 'string' ? stateOrJson : toJSON(stateOrJson);
  return download(json, name ?? fileName(typeof stateOrJson === 'string' ? fromJSON(json) : stateOrJson));
}

/** Offer a bug report (reportOf()) as a file to download. Returns the file's name. */
export function exportReport(report, name) {
  return download(JSON.stringify(report), name ?? reportName({ meta: { worldId: report.world, mode: report.mode }, clock: { ms: report.gameMs } }));
}

/** Ask for a save file: resolves to its text, or null if none was picked. */
export function importFile() {
  return new Promise((resolve) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' });
    input.addEventListener('change', async () => resolve(input.files?.[0] ? await input.files[0].text() : null));
    input.addEventListener('cancel', () => resolve(null));
    input.click();
  });
}
