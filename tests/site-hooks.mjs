// OLYMPUS tests: the off-Mars sites' module hooks (node:module register), which give env-clock a copy of the game whose site registry holds the two places the anywhere round goes, before their records are authored.
//
// v0.0.24's stage 0 (its build sheet §2 step 4, §6's env-clock; F119, the anywhere note's V19) takes the clocks off Mars: every
// body ticks its clock, its sleep and its routine on the live site's own day (Melas's sol by its longitude, branch for branch as
// before; a ship's and the Phobos School's UTC day), so a scene at Phobos or aboard Testudo no longer throws on its first tick.
// Its test must tick a body a sol at those two sites, but their records are D's to author (src/data/places/sites.js, the same
// round), and the registry is a frozen table read at load (src/sim/places/model.js SITE_RECORDS). So, as tests/fumble-hooks.mjs
// does for the dice, the test loads the game a second time under SITES_QUERY, every module from the same files, and in that copy
// src/data/places/sites.js is a five-line wrapper: the real module re-exported whole, and SITE_LIST with STAND_INS appended where
// the real list has no site of that id. Once D's records land, the real ones are used and the stand-ins are dropped by id, so the
// test then ticks D's sites with no change here. src/ is untouched; the main copy of the game never sees the stand-ins.
// The stand-ins are what the anywhere note (AW§4.4) asks of the two sites: 'phobos-void', the Void Operations School (body
// Phobos, gravity micro at the rock's 0.0006 G, the Martian indoor air inside and vacuum out, clock UTC, lighting a ship's,
// Melas's Plan of the Day on UTC, the ship's water); 'mcrn-testudo', the assault transport coasting (gravity thrust at 0 G, the
// same air, clock UTC, lighting a ship's, the ship's water). The note names no routine aboard, but every lived site needs one:
// the instinct (skills/instinct/base.js know), the night (time/pod.js nightOf) and the placed people (people/place.js) read it on
// every tick and throw on a site that names none, a missing value never defaulted. So the stand-in keeps the embarked marines'
// hours, Melas's Plan of the Day on UTC, as Phobos's does (my call, for D's record to keep or replace with a ship's own row of
// src/data/pod.js ROUTINES). Neither has an area of its own here.
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** The query every module of the copy carries (an ESM cache key of its own). */
export const SITES_QUERY = 'olympus-net=sites';
/** The two sites the anywhere round goes, as the note asks of them (used only where the real registry has no site of the id). */
export const STAND_INS = Object.freeze([
  Object.freeze({
    id: 'phobos-void', kind: 'base', template: 'phobos-void@stand-in', name: 'the Void Operations School (stand-in)', body: 'phobos', clock: 'utc',
    outside: Object.freeze({ kind: 'vacuum', air: 'vacuum' }), inside: Object.freeze({ air: 'martian-indoor' }),
    gravity: Object.freeze({ regime: 'micro', gG: 0.0006, down: Object.freeze([0, -1, 0]) }), lighting: 'ship', water: 'ship', routine: 'melas', palette: null, areas: Object.freeze([]),
  }),
  Object.freeze({
    id: 'mcrn-testudo', kind: 'ship', template: 'mcrn-testudo@stand-in', name: 'MCRN Testudo (stand-in)', body: 'none', clock: 'utc',
    outside: Object.freeze({ kind: 'vacuum', air: 'vacuum' }), inside: Object.freeze({ air: 'martian-indoor' }),
    gravity: Object.freeze({ regime: 'thrust', gG: 0, down: Object.freeze([0, -1, 0]) }), lighting: 'ship', water: 'ship', routine: 'melas', palette: null, areas: Object.freeze([]),
  }),
]);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = `${path.join(ROOT, 'src')}${path.sep}`, TESTS = `${path.join(ROOT, 'tests')}${path.sep}`;
const SITES = path.join(ROOT, 'src', 'data', 'places', 'sites.js');
const SITES_URL = 'olympus-net:sites';
const REAL = 'olympus-net=sites-real';

const inCopy = (url) => typeof url === 'string' && url.includes(SITES_QUERY);
const fileOf = (url) => { try { return url.startsWith('file:') ? fileURLToPath(url.split('?')[0]) : null; } catch { return null; } };
const ours = (file) => !!file && (file.startsWith(SRC) || file.startsWith(TESTS)) && !file.includes(`${path.sep}node_modules${path.sep}`);
const withQuery = (url, q = SITES_QUERY) => `${url.split('?')[0]}?${q}`;

export async function resolve(specifier, context, nextResolve) {
  const parent = context.parentURL ?? '';
  const r = await nextResolve(specifier, context);
  if (!inCopy(parent) && parent !== SITES_URL) return r;
  const file = fileOf(r.url);
  if (!ours(file)) return r;
  // (the copy's modules get the wrapper for sites.js; the wrapper itself the real one, under a query of its own)
  if (file === SITES && parent !== SITES_URL) return { url: SITES_URL, shortCircuit: true };
  if (file === SITES) return { ...r, url: withQuery(r.url, REAL), shortCircuit: true };
  return { ...r, url: withQuery(r.url), shortCircuit: true };
}

export async function load(url, context, nextLoad) {
  if (url !== SITES_URL) return nextLoad(url, context);
  const real = withQuery(new URL(`file://${SITES}`).href, REAL);
  const source = [
    `import * as real from ${JSON.stringify(real)};`,
    `import { STAND_INS } from ${JSON.stringify(new URL(`file://${path.join(TESTS, 'site-hooks.mjs')}`).href)};`,
    `export * from ${JSON.stringify(real)};`,
    `// (the copy's registry: the real sites, then each stand-in whose id the real list lacks: tests/site-hooks.mjs)`,
    `export const SITE_LIST = Object.freeze([...real.SITE_LIST, ...STAND_INS.filter(s => !real.SITE_LIST.some(r => r.id === s.id))]);`,
  ].join('\n');
  return { format: 'module', source, shortCircuit: true };
}
