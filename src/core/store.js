// OLYMPUS core: saves. IndexedDB in the browser, and save files to export and import.
//
// The one core module that talks to the browser (IndexedDB, and for export and import a download
// link and a file picker). Nothing in the sim imports it: main.js and the screens do. It loads in
// node without touching anything, so its pure parts (slots, records, file names) are tested there,
// and its IndexedDB part in a page (tests/core-browser.test.mjs).
//
// One database per origin, 'olympus', store 'saves', keyPath 'slot' (tradecraft's src/ui/store.js
// and LONGHAUL's js/storage.js, merged). Origins keep saves apart: the play copy's are the user's;
// the dev server's, the tests' and the agents' are their own (each its own port).
// Slots (DESIGN.md, Saves and death: "Ironman or Standard is chosen per career"):
//   'auto'          a Standard career's autosave (every 30 game minutes, on leaving the page, on
//                   quitting to the title): for carrying on, not for undoing
//   'manual-1'..'manual-9'   a Standard career's saves, made anywhere
//   'ironman'       an Ironman career's one save: autosaves only, and death ends the career
// A record is { slot, json, about, version, schema, mode, seed, gameMs, savedAt }: json is
// state.js toJSON() (canonical, so a save, a load and a save again give the same bytes), version the
// game that wrote it (VERSION, set by main.js through setVersion()), about a line for the load list,
// savedAt real time (ms since 1970). list() gives the records without their json, newest first.
//
// Export writes the same json to a file ("to keep, or to send with a bug": a save the user hits a
// bug in replays exactly; LONGHAUL "had to decode Chrome's IndexedDB blobs to get at a save").
// Import reads one back through fromJSON(), which upgrades an older save. JSON export and import
// exist in both modes (the user, 2026-11-05).
import { toJSON, fromJSON, SAVE_SCHEMA } from './state.js';
import { isoText } from './calendar.js';

export const DB_NAME = 'olympus';
export const DB_VERSION = 1;
export const STORE = 'saves';
export const MANUAL_SLOTS = Object.freeze(Array.from({ length: 9 }, (_, i) => `manual-${i + 1}`));
export const SLOTS = Object.freeze(['auto', ...MANUAL_SLOTS, 'ironman']);

let VERSION = '?';
/** The game's version, stamped on every save (main.js reads VERSION and sets it). */
export function setVersion(v) { VERSION = String(v ?? '?').trim() || '?'; }
export const version = () => VERSION;

export const isSlot = (slot) => SLOTS.includes(slot);
/** Where a career's autosave goes: 'ironman' for an Ironman career, 'auto' otherwise. */
export const autoSlotOf = (state) => (state?.meta?.mode === 'ironman' ? 'ironman' : 'auto');
/** Whether a career may be saved to a slot: an Ironman career only to its own, a Standard one to any but that. */
export const maySaveTo = (state, slot) => (state?.meta?.mode === 'ironman' ? slot === 'ironman' : isSlot(slot) && slot !== 'ironman');

/** The record a state makes in a slot (pure: what put() writes). */
export function recordOf(slot, state, about = '', json = toJSON(state)) {
  return { slot, json, about, version: VERSION, schema: SAVE_SCHEMA, mode: state.meta.mode, seed: state.meta.seed, gameMs: state.clock.ms, savedAt: Date.now() };
}

/** A file name for an exported save: 'olympus-standard-2351-03-22T08-00-00Z.json'. */
export const fileName = (state) => `olympus-${state.meta.mode}-${isoText(state.clock.ms).replace(/:/g, '-')}.json`;

// ---- IndexedDB ----

let dbPromise = null;
function open() {
  if (dbPromise) return dbPromise;
  if (!globalThis.indexedDB) return Promise.reject(new Error('no IndexedDB here'));
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'slot' }); };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => { db.close(); dbPromise = null; };   // (another tab upgrading: let it)
      resolve(db);
    };
    req.onerror = () => { dbPromise = null; reject(req.error); };
    req.onblocked = () => { dbPromise = null; reject(new Error('the save database is held open by another tab')); };
  });
  return dbPromise;
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode), req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error ?? new Error('save transaction aborted'));
  });
}

/** Write a state to a slot. Resolves to the record, without its json. */
export async function save(slot, state, about = '') {
  if (!isSlot(slot)) throw new Error(`no save slot '${slot}'`);
  const rec = recordOf(slot, state, about);
  await tx('readwrite', s => s.put(rec));
  const { json, ...rest } = rec;
  return { ...rest, bytes: json.length };
}

/** The record in a slot (with its json), or null. */
export const getRecord = (slot) => tx('readonly', s => s.get(slot)).then(r => r ?? null);

/** The state saved in a slot (upgraded), or null. */
export async function load(slot) {
  const rec = await getRecord(slot);
  return rec ? fromJSON(rec.json) : null;
}

/** Every save, without its json, newest first. */
export async function list() {
  const all = (await tx('readonly', s => s.getAll())) ?? [];
  return all.map(({ json, ...r }) => ({ ...r, bytes: json?.length ?? 0 })).sort((a, b) => b.savedAt - a.savedAt);
}

/** Empty a slot. */
export const remove = (slot) => tx('readwrite', s => s.delete(slot));
export { remove as delete };

// ---- files ----

/** Offer a save as a file to download (a state, or its json). */
export function exportFile(stateOrJson, name) {
  const json = typeof stateOrJson === 'string' ? stateOrJson : toJSON(stateOrJson);
  const fname = name ?? (typeof stateOrJson === 'string' ? fileName(fromJSON(json)) : fileName(stateOrJson));
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: fname });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return fname;
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
