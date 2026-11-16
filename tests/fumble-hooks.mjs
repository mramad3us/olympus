// OLYMPUS tests: the fumble net's module hooks (node:module register), which give the net a copy of the game whose handling rolls a test can force, with no line of src/ changed.
//
// The net (tests/bots/fumble.mjs) needs the game's own handling rolls (firearms.js act(): skills/checks.js check() with skill
// 'weapons' and procedure true, the player's and the #2's) to come out a miss, bad or disaster at a rate it sets, on every
// tier. Three ways were weighed (my call, the net's brief of 2026-11-16 asking for the cleanest):
//   - wrapping the dice (state.rng.main): the stream is shared by every system on 'main', so a draw cannot tell a handling
//     roll from any other without reading the call stack; a d20 cannot make a fumble that the roll's arithmetic forbids
//     (the tier one's natural 1 is caught: SKILLS §5.1), so "every tier" could not be met; and a Proxy in the state breaks
//     the save's clone. Rejected.
//   - a loader that rewrites firearms.js's text (the hunt's hooks.mjs, .run/hunt/hunt-handling/): exact, but it breaks the
//     day a line it matches is reworded, and the arms role owns firearms.js this round. Rejected.
//   - (kept) a resolve hook alone, rewriting no source: the game is loaded a second time under the query NET_QUERY, every
//     module of it from the same files (so the net's copy has registries of its own and the suites sharing a worker
//     process keep theirs), and in that copy any module of src/ that imports skills/checks.js gets a five-line wrapper in
//     its place (the virtual module DICE_URL: the real module re-exported whole, its check() called as ever, the dice
//     drawn as ever, then the record handed to globalThis[NET_DICE], the harness's, which may give it a forced grade). The
//     grade is applied as doAction's own test lever applies one (firearms.js forced(): the roll kept, `forced` marked,
//     the margin pulled to −1, −6 or −10). With no plan set the copy is the game byte for byte (house-fumble's first test).
// Only file: URLs under the repository's src/ and tests/ carry the query on; node: built-ins, node_modules and the vendored
// three.js are left alone. The hooks run on node's hooks thread; the decision (which roll, which grade) is the main thread's,
// read through the global at each roll, so nothing crosses between the threads but URLs.
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/** The query every module of the net's copy carries (an ESM cache key of its own). */
export const NET_QUERY = 'olympus-net=fumble';
/** The global the wrapper reads at each roll: (record, args) → record (the harness's; absent, the record as rolled). */
export const NET_DICE = 'olympus.net.dice';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = `${path.join(ROOT, 'src')}${path.sep}`, TESTS = `${path.join(ROOT, 'tests')}${path.sep}`;
const CHECKS = path.join(ROOT, 'src', 'sim', 'skills', 'checks.js');
const DICE_URL = `olympus-net:dice-checks`;

const inNet = (url) => typeof url === 'string' && url.includes(NET_QUERY);
const fileOf = (url) => { try { return url.startsWith('file:') ? fileURLToPath(url.split('?')[0]) : null; } catch { return null; } };
const ours = (file) => !!file && (file.startsWith(SRC) || file.startsWith(TESTS)) && !file.includes(`${path.sep}node_modules${path.sep}`);
const withQuery = (url) => `${url.split('?')[0]}?${NET_QUERY}`;

export async function resolve(specifier, context, nextResolve) {
  const parent = context.parentURL ?? '';
  const r = await nextResolve(specifier, context);
  if (!inNet(parent) && parent !== DICE_URL) return r;
  const file = fileOf(r.url);
  if (!ours(file)) return r;
  // (src/'s modules get the wrapper for skills/checks.js; the wrapper itself, and the tests, the real one)
  if (file === CHECKS && parent !== DICE_URL && fileOf(parent)?.startsWith(SRC)) return { url: DICE_URL, shortCircuit: true };
  return { ...r, url: withQuery(r.url), shortCircuit: true };
}

export async function load(url, context, nextLoad) {
  if (url !== DICE_URL) return nextLoad(url, context);
  const real = withQuery(new URL(`file://${CHECKS}`).href);
  const source = [
    `import * as real from ${JSON.stringify(real)};`,
    `export * from ${JSON.stringify(real)};`,
    `// (the net's check: the real one, then the harness's say on the record: tests/fumble-hooks.mjs)`,
    `export function check(rng, o) { const r = real.check(rng, o), f = globalThis[Symbol.for(${JSON.stringify(NET_DICE)})]; return f ? f(r, o) : r; }`,
  ].join('\n');
  return { format: 'module', source, shortCircuit: true };
}
