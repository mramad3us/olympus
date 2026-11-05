// OLYMPUS tests: the id walk over a save (TECH §8.2's game-ids). Every id in a state is of its kind and names something that exists.
//
// checkIds(state, domains) walks the state as it is saved (no $ keys) and finds the ids the way
// TECH §2.3.1 says they are written:
//   definitions   the keys of every id-keyed map a domain registered (idMaps: 'people' → 'p',
//                 'places.sites' → 'place'), each record's own 'id' field (an actor in actors.list,
//                 an event in the queue, the skip), and on the memorial every id it keeps (the dead
//                 stay named there: "a record that exists, or one on the memorial");
//   references    the fields named who, <role>Id or <role>Ids (leaderId, assignedIds), and every
//                 path a domain declared in idFields ('player.actor' → 'a', 'places.live.area' →
//                 'place'; a declared path is a reference even when it is named id, as player.id is).
// A path is written with [] for an array's elements and {} for an id map's values
// ('places.nav.queue[].area', 'people{}.kit.hands[]'), as idFields declares them.
// Each id must pass its kind's validator (src/core/ids.js: the declared kind, else kindOf()), and
// each reference must name a definition, or for the kinds whose records live outside the state, a
// thing that exists: a world is meta.worldId; a site, area, room or zone is PLACES's data (siteOf,
// areaOf, an area's rooms and zones); a fixture, opening or spot is an area's; a path request (pr)
// is a receipt once answered (actor.path.reqId after delivery: its record leaves the queue), so a pr
// reference counts if the counter has passed it (its number below meta.next.pr). Returns
// { checked, byKind: { kind: n }, invalid: [why], dangling: [why] }, so a test prints the counts
// and fails on either list.
import { isId, kindOf, ID_KINDS } from '../src/core/ids.js';
import * as model from '../src/sim/places/model.js';

const isRuntime = (k) => k.charCodeAt(0) === 36;
const REF_NAME = /^(who|[a-z][A-Za-z0-9]*Id)$/, REFS_NAME = /^[a-z][A-Za-z0-9]*Ids$/;

// (does PLACES's data know this place, fixture, opening or spot? Areas' rooms, zones, fixtures and openings included)
function placeKnown(state, id) {
  const tryOf = (fn, x) => { try { return fn?.(x) ?? null; } catch { return null; } };
  if (tryOf(model.siteOf, id) || tryOf(model.areaOf, id)) return true;
  const areas = new Set();
  for (const siteId of Object.keys(state.places?.sites ?? {})) for (const a of tryOf(model.siteOf, siteId)?.areas ?? []) areas.add(a);
  if (state.places?.live?.area) areas.add(state.places.live.area);
  for (const areaId of areas) {
    const a = tryOf(model.areaOf, areaId);
    if (!a) continue;
    for (const list of [a.rooms, a.zones, a.fixtures, a.openings]) if ((list ?? []).some(r => r.id === id)) return true;
    if ((a.fixtures ?? []).some(f => id.startsWith(`${f.id}#`))) return true;
  }
  return false;
}

/** Walk a state's ids (see the header). domains: [{ idMaps, idFields }] (sim.domains). */
export function checkIds(state, domains) {
  const idMaps = {}, idFields = {};
  for (const d of domains) { Object.assign(idMaps, d.idMaps ?? {}); Object.assign(idFields, d.idFields ?? {}); }
  const defined = new Map();                                       // id → kind
  const refs = [], invalid = [], byKind = {};
  let checked = 0;
  const count = (kind) => { byKind[kind ?? '?'] = (byKind[kind ?? '?'] ?? 0) + 1; checked++; };
  const validate = (kind, id, where) => {
    if (kind && !ID_KINDS[kind]) { invalid.push(`${where}: declared kind '${kind}' is not in the id table`); return false; }
    const ok = typeof id === 'string' && (kind ? isId(kind, id) : kindOf(id) !== null);
    if (!ok) invalid.push(`${where}: ${JSON.stringify(id)} is not ${kind ? `a '${kind}' id` : 'an id of any kind'}`);
    return ok;
  };
  const define = (kind, id, where) => { count(kind ?? kindOf(id)); if (validate(kind, id, where)) defined.set(id, kind ?? kindOf(id)); };
  const reference = (kind, id, where) => { count(kind ?? kindOf(id)); if (validate(kind, id, where)) refs.push({ kind: kind ?? kindOf(id), id, where }); };

  function walk(v, path, inMemorial) {
    if (v === null || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach((e) => walk(e, `${path}[]`, inMemorial)); return; }
    if (idMaps[path]) {
      const kind = idMaps[path];
      for (const k of Object.keys(v)) {
        if (isRuntime(k)) continue;
        define(kind, k, `${path}.${k}`);
        const rec = v[k];
        if (rec && typeof rec === 'object' && !Array.isArray(rec) && 'id' in rec && rec.id !== k) invalid.push(`${path}.${k}: the record's id is ${JSON.stringify(rec.id)}`);
        walkObject(rec, `${path}{}`, inMemorial, true);
      }
      return;
    }
    walkObject(v, path, inMemorial, false);
  }
  function walkObject(o, path, inMemorial, keyed) {
    if (o === null || typeof o !== 'object') return;
    if (Array.isArray(o)) { walk(o, path, inMemorial); return; }
    for (const f of Object.keys(o)) {
      if (isRuntime(f)) continue;
      const v = o[f], p = path ? `${path}.${f}` : f;
      const mem = inMemorial || p === 'memorial';
      if (v === null || v === undefined) continue;
      if (idFields[p]) {
        for (const id of Array.isArray(v) ? v : [v]) if (id !== null) (mem ? define : reference)(idFields[p], id, p);
        if (typeof v === 'object' && !Array.isArray(v)) walk(v, p, mem);
        continue;
      }
      if (f === 'id' && typeof v === 'string') { if (!keyed) define(null, v, p); continue; }
      if (REF_NAME.test(f) && typeof v === 'string') { (mem ? define : reference)(null, v, p); continue; }
      if (REFS_NAME.test(f) && Array.isArray(v)) { for (const id of v) if (id !== null) (mem ? define : reference)(null, id, `${p}[]`); continue; }
      walk(v, p, mem);
    }
  }
  walkObject(state, '', false, false);

  const dangling = [];
  for (const r of refs) {
    if (defined.has(r.id)) continue;
    if (r.kind === 'world' && r.id === state.meta?.worldId) continue;
    if (['place', 'fixture', 'opening', 'spot', 'link'].includes(r.kind) && placeKnown(state, r.id)) continue;
    if (r.kind === 'pr' && Number(r.id.slice(2)) < (state.meta?.next?.pr ?? 1)) continue;   // (an answered request)
    dangling.push(`${r.where}: ${r.id} (a '${r.kind}') names nothing`);
  }
  return { checked, byKind, invalid, dangling, defined: defined.size };
}
