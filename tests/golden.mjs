// OLYMPUS tests: golden hashes, which pin what the game generates (tradecraft's way, TECH §13.5).
//
//   golden('the sandbox, seed 48213', state, '1c0f…')   → the digest, or throws with both
//
// The value is digested as canonical JSON (src/core/state.js toJSON: keys sorted, $ keys dropped,
// so the order things were built in doesn't move it), a string as it is (a save's JSON), and a
// typed array (a nav grid's costs, a painted page) as its bytes. A mismatch throws with the name, both digests and how to re-set it.
// When generation changes on purpose, run the test with PRINT_HASH=1: each golden prints a line
// ready to paste,
//       golden('the sandbox, seed 48213', …, '1c0f…')
// and passes; paste the new digests, and say so in CHANGELOG.md's Tests bullet ("the sandbox's
// golden re-set on purpose: the spawn moved"). A golden with no expected digest yet fails, unless
// PRINT_HASH is set, so a new one is never taken on trust.
import { toJSON } from '../src/core/state.js';
import { digest } from '../src/core/hash.js';

export const PRINT_HASH = !!process.env.PRINT_HASH;

// (a typed array's bytes as a string of one character a byte, digested as text: one algorithm)
function bytesText(view) {
  const u8 = new Uint8Array(view.buffer, view.byteOffset, view.byteLength), CHUNK = 8192;
  let s = '';
  for (let i = 0; i < u8.length; i += CHUNK) s += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
  return s;
}

/** The digest golden() compares: of a typed array's bytes, else of the value's canonical JSON. */
export function goldenDigest(value) {
  if (ArrayBuffer.isView(value)) return digest(bytesText(value));
  if (value instanceof ArrayBuffer) return digest(bytesText(new Uint8Array(value)));
  return digest(typeof value === 'string' ? value : toJSON(value));
}

/** Compare a value's digest with the one pinned; PRINT_HASH=1 prints the line to paste instead. Returns the digest. */
export function golden(name, value, expected) {
  const got = goldenDigest(value);
  if (PRINT_HASH) {
    console.log(`      golden('${name}', …, '${got}')${expected && expected !== got ? `  (was '${expected}')` : ''}`);
    return got;
  }
  if (!expected) throw new Error(`golden '${name}' has no digest yet: it is '${got}' (run with PRINT_HASH=1 to print the line)`);
  if (got !== expected) throw new Error(`golden '${name}' moved: '${got}', pinned '${expected}' (if on purpose, re-set it with PRINT_HASH=1 and say so in CHANGELOG.md)`);
  return got;
}
