// OLYMPUS bots: the reading recruit, the honest bot that also walks the keys the instructor names (v0.0.23, its build sheet item 10, carried FH-1; COMBAT §25.10).
//
// readerBot() is the honest bot (tests/bots/house.mjs houseHonestBot: T and the shot the line names, nothing else) with one thing
// more, what a new player does with the drill instructor's words below the corporal: out of stop motion on the lane (GO given, the
// lane not ended, no skip, no take-in window), it holds the keys the DI's line names first (readKeys: one key, or two as "D and S"),
// READ_MS after the line changed (a human's read and reaction), until the line names others or none; with no keys named it is the
// honest bot (time runs; the stall is the judge). It reads only the line the page shows (instinct.js instinctNow), never the plan.
// It is a floor, not a human: it never looks at the floor's marks or the room, so a line naming the wrong keys walks it into the
// wall, as it walked the recruit of v0.0.22 ("D and S" at room 2's stack, 0.16 m off the stack until the room's pass). Its memory is
// plain data on the actor (mem.read: { text, atMs, keys }, mem.heldMs, mem.reads), so a save holds it.
//
// readKeys(text) is the keys a player reads first in a line: the first of Z, Q, S, D standing as a word, and its partner where
// the line says "X and Y"; [] when it names none.
import { houseHonestBot } from './house.mjs';
import { contactNow } from '../../src/sim/combat/contact.js';
import { instinctNow } from '../../src/sim/skills/instinct.js';
import { TICK_MS } from '../../src/core/clock.js';

/** A human's read of a new line and the reaction to it, before the keys go down (ms; FH-1). */
export const READ_MS = 300;
/** The move keys by physical position, as the page sends them (x east, z south). */
export const KEY_MOVE = Object.freeze({ Z: [0, -1], S: [0, 1], Q: [-1, 0], D: [1, 0] });

/** The keys a player reads first in a line (see the header). */
export function readKeys(text) {
  const m = /\b([ZQSD])(?: and ([ZQSD]))?\b/.exec(String(text ?? ''));
  return m ? [m[1], m[2]].filter(Boolean) : [];
}

/** The reading recruit (see the header). */
export function readerBot({ readMs = READ_MS } = {}) {
  const honest = houseHonestBot();
  return (state, me, mem) => {
    mem.heldMs ??= 0; mem.reads ??= 0;
    // (the lane read off the house's record, as the page's timer does: GO given, no end; cheaper than houseNow a tick)
    const R = state.armoury?.range, H = R?.house, lane = !!H && H.goAtMs !== null && H.goAtMs !== undefined && !H.end && !R.end;
    if (lane && !state.stop && !state.skip && !contactNow(state)?.pending) {
      const text = instinctNow(state).line?.text ?? '';
      if (text !== mem.read?.text) { const keys = readKeys(text); mem.read = { text, atMs: state.clock.ms, keys }; if (keys.length) mem.reads++; }
      const keys = mem.read.keys;
      if (keys.length && state.clock.ms - mem.read.atMs >= readMs) {
        let mx = 0, mz = 0;
        for (const k of keys) { mx += KEY_MOVE[k][0]; mz += KEY_MOVE[k][1]; }
        mem.heldMs += TICK_MS;
        return { mx, mz };
      }
      if (keys.length) return {};
    } else if (mem.read) delete mem.read;
    return honest(state, me, mem);
  };
}
