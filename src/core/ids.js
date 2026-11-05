// OLYMPUS core: ids. One grammar per kind, a validator for each, counters, and id-keyed maps kept in order.
//
// The sections wrote the same things several ways (the player as me, p0 and p:player; a unit four
// ways), so TECH §2.3.1 settles one table, and this module is it (ID_KINDS):
//   counted ids   a lower-case prefix and a decimal counter from 1, no separator: p42 (a person),
//                 a7 (an actor on the live area), i9921 (an item), e812 (an event), k37 (a skip),
//                 n8812 (a happening), h44 (a hull), fm2, fg193, od77, uf412, sh812, ob5521, sv12,
//                 ai88, pr5531 (a path request). The counter is state.meta.next[prefix], absent
//                 meaning 1, and an id is never reused in a world (TECH §6.4): nextId().
//   other ids     a world w-48213 (w-48213-2 for a second world on one seed; w-legacy for the 0.0.1
//                 store's unprefixed slots); a career c-48213-1; a unit 2/4-E-2-1-ft2; a site, area,
//                 room or zone, kind 'place', kebab segments joined by dots (melas.echo.1,
//                 e1.z.bay-2-1); a fixture f:e1:rack:07, an opening o:e1:bay-2-1, a link
//                 l:hellas:trunk, a spot or seat f:mess:t14#3; and for the site plan (the 0.0.2
//                 build sheet, §8 item 5) a waypoint w:echo:front, a building b:echo, a road or path
//                 r:valley.
// isId(kind, s) checks one kind; kindOf(s) names the kind of a string (counted kinds first, so p1
// is a person even though it would pass the place grammar too), or null.
//
// Order (TECH §2.3.1, "Order"): cmpId(a, b) compares the kind (the leading letters), then the
// number, then the rest, so p9 comes before p10 and f:t1:rack:9 before f:t1:rack:10. Digit runs
// compare by value wherever they fall (a natural order), and two ids equal by value but written
// differently (01 and 1) fall back to plain string order, so the order is total. It allocates
// nothing: it walks the two strings by character code.
//
// Sorted ids without sorting (TECH §2.3.2). ids(map) is asked per decision per tick over people,
// items and a site's fixtures, so it must not sort each time. An id-keyed map is changed only
// through put(state, map, id, rec) and drop(state, map, id), which keep the map's ids in cmpId
// order in map.$ids (a $ key: runtime only, never saved; non-enumerable, so Object.keys(map) and
// the save never see it), inserting and removing by binary search. ids(map) returns that array,
// building it once (after a load, or for a map filled by hand) and never re-sorting. With
// setIdsCheck(n) every nth call checks it against a fresh sort, so a write that bypassed put() is
// found at once (TECH: every 64th call in debug, every call in the determinism suite).
//
// byDistanceThenId(x, z): the comparator for spatial queries, nearest first, ties by id (§3.2).
//
// The player (TECH §2.3.1, CONTRACTS §10): an ordinary person, named by state.player.id; playerId(state)
// is the one helper for it, and playerActor(state) the one for its actor on the live area (the record in
// state.actors.list that state.player.actor names), so the sim, the view and the tests never look either
// up by hand.

const SEG = '[a-z0-9]+(?:-[a-z0-9]+)*';
const kind = (what, owner, example, pattern, counted = false) => Object.freeze({ what, owner, example, pattern, counted });
const counted = (prefix, what, owner, example) => kind(what, owner, example, new RegExp(`^${prefix}[1-9][0-9]*$`), true);

/** The id table (TECH §2.3.1): kind → { what, owner, example, pattern, counted }. Counted kinds are named by their prefix. */
export const ID_KINDS = Object.freeze({
  p: counted('p', 'a person of tiers 1 to 3 (the player too)', 'PEOPLE', 'p42'),
  a: counted('a', 'an actor on the live area', 'PEOPLE', 'a7'),
  i: counted('i', 'an item with a record', 'WEAPONS', 'i9921'),
  e: counted('e', 'an event in the queue', 'TIME', 'e812'),
  k: counted('k', 'a skip', 'TIME', 'k37'),
  n: counted('n', 'a happening', 'PEOPLE', 'n8812'),
  h: counted('h', 'a saved hull', 'TECH, COMBAT', 'h44'),
  fm: counted('fm', "a member of a marine's family", 'CAREER', 'fm2'),
  fg: counted('fg', 'a fight', 'COMBAT', 'fg193'),
  od: counted('od', 'an order given', 'COMBAT', 'od77'),
  uf: counted('uf', 'a use-of-force record', 'COMBAT', 'uf412'),
  sh: counted('sh', 'a shot', 'WEAPONS', 'sh812'),
  ob: counted('ob', 'ordnance in flight', 'COMBAT', 'ob5521'),
  sv: counted('sv', 'a salvo', 'COMBAT', 'sv12'),
  ai: counted('ai', 'an ammunition issue', 'WEAPONS', 'ai88'),
  pr: counted('pr', 'a path request', 'PLACES', 'pr5531'),
  world: kind('a world', 'TECH', 'w-48213', /^w-(?:[0-9]+(?:-[1-9][0-9]*)?|legacy)$/),
  career: kind('a career', 'CAREER', 'c-48213-1', /^c-[0-9]+-[1-9][0-9]*$/),
  unit: kind('a unit of the Corps', 'PEOPLE', '2/4-E-2-1', /^[1-9][0-9]*\/[1-9][0-9]*(?:-(?:[A-Z]|[1-9][0-9]*|ft[1-9][0-9]*|hq|[a-z][a-z0-9]+))*$/),
  spot: kind('a spot or seat of a fixture', 'PLACES', 'f:mess:t14#3', new RegExp(`^f(?::${SEG})+#[0-9]+$`)),
  fixture: kind('a fixture', 'PLACES', 'f:e1:rack:07', new RegExp(`^f(?::${SEG})+$`)),
  opening: kind('an opening (a door, a doorway, a gate)', 'PLACES', 'o:e1:bay-2-1', new RegExp(`^o(?::${SEG})+$`)),
  link: kind('a link between areas', 'PLACES', 'l:hellas:trunk', new RegExp(`^l(?::${SEG})+$`)),
  waypoint: kind('a waypoint of a site plan', 'PLACES', 'w:echo:front', new RegExp(`^w(?::${SEG})+$`)),
  building: kind('a building of a site plan', 'PLACES', 'b:echo', new RegExp(`^b(?::${SEG})+$`)),
  road: kind('a road or path of a site plan', 'PLACES', 'r:valley', new RegExp(`^r(?::${SEG})+$`)),
  place: kind('a site, area, room or zone', 'PLACES', 'melas.echo.1', new RegExp(`^${SEG}(?:\\.${SEG})*$`)),
});
const KIND_NAMES = Object.freeze(Object.keys(ID_KINDS));
const OTHER_KINDS = KIND_NAMES.filter(k => !ID_KINDS[k].counted);        // (in the table's order: place, the loosest, last)
/** The counted prefixes. */
export const COUNTED = Object.freeze(KIND_NAMES.filter(k => ID_KINDS[k].counted));
const COUNTED_SET = new Set(COUNTED);

/** Whether s is an id of a kind (a name of ID_KINDS). */
export function isId(kindName, s) {
  const k = ID_KINDS[kindName];
  if (!k) throw new Error(`no id kind '${kindName}' (TECH §2.3.1: ${KIND_NAMES.join(', ')})`);
  return typeof s === 'string' && k.pattern.test(s);
}

// (the leading run of lower-case letters of s: a counted id's prefix, any id's "kind" for cmpId)
function alphaLen(s) {
  let i = 0;
  while (i < s.length) { const c = s.charCodeAt(i); if (c < 97 || c > 122) break; i++; }
  return i;
}

/** The kind of an id ('p', 'place', 'fixture'…), or null for a string of no kind. */
export function kindOf(s) {
  if (typeof s !== 'string' || !s) return null;
  const n = alphaLen(s);
  if (n > 0 && n < s.length) {
    const prefix = s.slice(0, n);
    if (COUNTED_SET.has(prefix) && ID_KINDS[prefix].pattern.test(s)) return prefix;
  }
  for (const k of OTHER_KINDS) if (ID_KINDS[k].pattern.test(s)) return k;
  return null;
}

/** The number of a counted id (p42 → 42), or null. */
export function numOf(s) {
  const k = kindOf(s);
  return k && ID_KINDS[k].counted ? Number(s.slice(k.length)) : null;
}

// ---- order ----

const isDigit = (c) => c >= 48 && c <= 57;

/** The order of ids: kind, then number, then the rest (p9 before p10); total, allocation-free. */
export function cmpId(a, b) {
  if (a === b) return 0;
  const la = alphaLen(a), lb = alphaLen(b);
  // (the kinds: the leading letters, a shorter one first where one is the start of the other)
  const lk = la < lb ? la : lb;
  for (let i = 0; i < lk; i++) { const d = a.charCodeAt(i) - b.charCodeAt(i); if (d) return d; }
  if (la !== lb) return la - lb;
  // (the rest, in natural order: digit runs by value)
  let i = la, j = lb;
  while (i < a.length && j < b.length) {
    const ca = a.charCodeAt(i), cb = b.charCodeAt(j);
    if (isDigit(ca) && isDigit(cb)) {
      let si = i, sj = j;
      while (si < a.length && a.charCodeAt(si) === 48) si++;           // (leading zeros don't make a number bigger)
      while (sj < b.length && b.charCodeAt(sj) === 48) sj++;
      let ei = si, ej = sj;
      while (ei < a.length && isDigit(a.charCodeAt(ei))) ei++;
      while (ej < b.length && isDigit(b.charCodeAt(ej))) ej++;
      if (ei - si !== ej - sj) return (ei - si) - (ej - sj);
      for (let x = si, y = sj; x < ei; x++, y++) { const d = a.charCodeAt(x) - b.charCodeAt(y); if (d) return d; }
      i = ei; j = ej;
      continue;
    }
    if (ca !== cb) return ca - cb;
    i++; j++;
  }
  if (a.length - i !== b.length - j) return (a.length - i) - (b.length - j);
  return a < b ? -1 : a > b ? 1 : 0;                                  // (equal by value, written differently: 01 and 1)
}

/** A comparator for records with { x, z, id }: nearest to (x, z) first, ties by id. */
export function byDistanceThenId(x, z) {
  return (p, r) => {
    const dp = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z), dr = (r.x - x) * (r.x - x) + (r.z - z) * (r.z - z);
    return dp - dr || cmpId(p.id, r.id);
  };
}

// ---- counters ----

/** The next number of a counted prefix, taken (meta.next[prefix], absent meaning 1). */
export function nextNum(state, prefix) {
  if (!COUNTED_SET.has(prefix)) throw new Error(`'${prefix}' is not a counted id prefix (TECH §2.3.1: ${COUNTED.join(', ')})`);
  const next = (state.meta.next ??= {});
  const n = next[prefix] ?? 1;
  next[prefix] = n + 1;
  return n;
}

/** The next id of a counted prefix: nextId(state, 'p') → 'p1', then 'p2'… Never reused in a world. */
export const nextId = (state, prefix) => prefix + nextNum(state, prefix);

// ---- id-keyed maps, kept in order ----

const isRuntime = (k) => k.charCodeAt(0) === 36;                       // ('$')
function freshIds(map) {
  return Object.keys(map).filter(k => !isRuntime(k)).sort(cmpId);
}
function setIds(map, list) {
  Object.defineProperty(map, '$ids', { value: list, writable: true, configurable: true, enumerable: false });
  return list;
}
// (where id goes in a sorted list: its index if there, else -(insertion point) - 1)
function search(list, id) {
  let lo = 0, hi = list.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1, c = cmpId(list[mid], id);
    if (c < 0) lo = mid + 1; else if (c > 0) hi = mid - 1; else return mid;
  }
  return -lo - 1;
}

let checkEvery = 0, calls = 0;
/** Check ids(map) against a fresh sort every nth call (0: never; 1: always, as the determinism suite does). */
export function setIdsCheck(every = 0) { checkEvery = every >>> 0; calls = 0; }

/** The map's ids in cmpId order: the cached map.$ids, built when absent. The same array until a put or drop changes it. */
export function ids(map) {
  const list = map.$ids ?? setIds(map, freshIds(map));
  if (checkEvery && ++calls % checkEvery === 0) {
    const fresh = freshIds(map);
    if (fresh.length !== list.length || fresh.some((id, i) => id !== list[i])) {
      throw new Error(`ids(): the map's cached order is stale (a write bypassed put/drop): cached ${list.length}, fresh ${fresh.length}`);
    }
  }
  return list;
}

/** Set map[id] = rec, keeping the map's cached order. Returns rec. */
export function put(state, map, id, rec) {
  if (typeof id !== 'string' || !id || isRuntime(id)) throw new Error(`put(): not an id: ${id}`);
  const had = Object.prototype.hasOwnProperty.call(map, id);
  map[id] = rec;
  const list = map.$ids;
  if (list && !had) { const at = search(list, id); if (at < 0) list.splice(-at - 1, 0, id); }
  return rec;
}

/** Delete map[id], keeping the map's cached order. Returns whether it was there. */
export function drop(state, map, id) {
  if (!Object.prototype.hasOwnProperty.call(map, id)) return false;
  delete map[id];
  const list = map.$ids;
  if (list) { const at = search(list, id); if (at >= 0) list.splice(at, 1); }
  return true;
}

/** The player's person id (state.player.id: an ordinary p<n>, never an alias), or null. */
export const playerId = (state) => state?.player?.id ?? null;

/** The player's actor on the live area (the record state.player.actor names in state.actors.list), or null. */
export function playerActor(state) {
  const id = state?.player?.actor;
  return (id && state.actors?.list?.find?.(a => a.id === id)) || null;
}
