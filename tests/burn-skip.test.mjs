// No skip over the burn (v0.0.25's carried round; the v0.0.24 integration's open note, def-lead-edits §3): in Testudo's berth the
// sim refuses an activity that skips time while a surprise of the ship's profile is still to come (places/gravity.js skipBarred), the
// debug handle's own `{ act: 'activity', args: { id: 'wait' } }` included ("Not now: secure for the burn."), so no path passes over the
// surprise jink, which has no warning and whose onset is no interrupt of a skip; on a seed with no surprise a wait begun before the
// warned burn is taken and stopped at its warning (F112), never past it; after the profile a wait is taken. Fails without it (the
// wait on the jink's seeds begun before the warning, stopped at the warning, and one begun after the burn passed over the jink).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { BRACE_REFUSED } from '../src/sim/time/activities.js';
import { skipBarred, gravCardOf } from '../src/sim/places/gravity.js';

const WAIT = { act: [{ act: 'activity', args: { id: 'wait' } }] };
// (a tick as a player who answers the surprise's card, "Nothing: let it come" (its last option): v0.0.25's burn polish throws the
// idle body to port in the warned manoeuvre, by the racks' rungs, so the surprise offers it a grab and holds time for the answer)
const tick = (g) => { const c = gravCardOf(g.state); g.step(1, c?.options?.length ? { act: [{ act: 'grav', args: { card: c.options.at(-1).key } }] } : {}); };
// (the berth on a seed, its profile's events: test-burn's jink is on half the seeds, 3156898961 the user's of 2026-11-19 among them)
function berth(seed) {
  const g = createGame({ scenario: 'test-burn', seed }), s = g.state, P = () => s.places.live.env?.profile, rows = [];
  const tryWait = (when) => {
    const n0 = g.facts('line').length, t0 = s.clock.ms;
    g.step(1, WAIT);
    // (a wait taken runs its skip; on to its end, as the page's loop runs it)
    for (let n = 0; n < 20 * 60 * 20 && s.time?.doing; n++) g.step(1);
    const refused = g.facts('line').slice(n0).some(l => l.kind === 'refused' && l.text === BRACE_REFUSED), passedMs = s.clock.ms - t0;
    rows.push(`${seed} ${when} (profile ${P()?.phase ?? 'none'}): ${refused ? 'refused' : `taken, ${passedMs} ms passed, the profile now ${P()?.phase}`}`);
    return { refused, passedMs, phase: P()?.phase ?? null, endMs: s.clock.ms };
  };
  return { g, s, P, rows, tryWait, events: () => P().list.map(e => ({ kind: e.kind, surprise: !!e.surprise, atMs: e.atMs })) };
}

export default [
  {
    name: 'burn-skip: in the berth a wait is refused while a surprise jink is still to come (the user\'s seed 3156898961 and seed 2), taken once it has passed; on a seed with no surprise a wait before the burn stops at its warning',
    fn() {
      const bad = [], rows = [];
      for (const seed of [3156898961, 2]) {
        const B = berth(seed), jink = B.events().find(e => e.surprise);
        B.g.step(20);
        const before = B.tryWait('before the warning');
        // (on through the burn to the moment after its hold: the jink still to come)
        for (let n = 0; n < 20 * 60 * 3 && B.s.clock.ms < jink.atMs - 5000; n++) tick(B.g);
        const between = B.tryWait('after the burn, the jink to come');
        for (let n = 0; n < 20 * 60 * 3 && B.s.clock.ms <= jink.atMs + 1000; n++) tick(B.g);
        const after = B.tryWait('after the jink');
        rows.push(...B.rows);
        if (!before.refused || !between.refused || after.refused || skipBarred(B.s)) bad.push(`seed ${seed}`);
      }
      // (a seed with no surprise: the wait before the warned burn taken, stopped at its warning)
      const C = berth(48213), burn = C.events()[0];
      C.g.step(20);
      const plain = C.tryWait('before the warning, no surprise');
      rows.push(...C.rows);
      if (plain.refused || plain.phase !== 'warn' || plain.endMs > burn.atMs) bad.push('48213: the wait not stopped at the warning');
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
