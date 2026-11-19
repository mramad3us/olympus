// OLYMPUS tests: the card's aim never flicks (the review of 2026-11-18 of the build sheet v0.0.23 items 4 and 5).
//
// seen.js gives a man's aim as 'you' within AIM_AT_RAD of the bearing to your eye and 'away' beyond it, with no hysteresis, so a
// muzzle swinging across the line flicked the card between end on and across the chest for one tick: on the tier one's live:hide,give
// on 48213 (the honest bot), 2a you, away for 50 ms, you; on the sergeant's live:fight,fight, away, you. The target view now holds
// the side it shows for AIM_DWELL_MS (target.js aimHeld, the view's readers.aims): over the lane, every tick, each role-player's
// card as the view gives it against the record as seenOf gives it. Held: no side of an aim shown for less than AIM_DWELL_MS before
// the other side (while he stays aimed); the card's side never behind seenOf's for longer than AIM_DWELL_MS; a raise, a lower and
// a turn never held (the hold, the pose and the facing always seenOf's). Prints the flicks without the dwell and with it.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { targetModel, AIM_DWELL_MS } from '../src/ui/hud/target.js';

const LANES = Object.freeze([['tierone', 48213, 'live:hide,give'], ['sgt', 48213, 'live:fight,fight']]);

// (the shortest dwell of an aim's side shown before the other side, aimed throughout: the runs of 'you' and 'away' between them)
function flicksOf(seq) {
  let short = 0, minMs = Infinity, run = null;
  for (const x of seq) {
    if (!x.aimAt) { run = null; continue; }
    if (run && run.aimAt !== x.aimAt) { const held = x.ms - run.atMs; minMs = Math.min(minMs, held); if (held < AIM_DWELL_MS) short++; run = null; }
    if (!run) run = { aimAt: x.aimAt, atMs: x.ms };
  }
  return { short, minMs };
}

export default [
  {
    name: `the card holds the side of a man's aim for AIM_DWELL_MS (${AIM_DWELL_MS} ms): no flick between end on and across the chest on the live lanes (${LANES.map(l => l.join(' ')).join(', ')}), never behind the record by more, a raise or a turn never held (the review of 2026-11-18: 2a you, away for 50 ms, you)`,
    fn() {
      const bad = [];
      for (const [tier, seed, opfor] of LANES) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', opfor });
        const readers = { known: new Map(), aims: new Map() }, raw = {}, shown = {}, behind = {};
        let ticks = 0, lagMax = 0, otherHeld = 0;
        const r = runHouse(g, houseHonestBot(), { each(game) {
          const s = game.state, H = s.armoury.range.house;
          if (H.goAtMs === null || H.goAtMs === undefined || H.end) return;
          ticks++;
          for (const T of s.armoury.range.turners.filter(t => t.live?.who)) {
            const who = T.live.who, ms = s.clock.ms;
            const a = targetModel(s, { key: T.key, kind: 'person', who, readers: {} }), b = targetModel(s, { key: T.key, kind: 'person', who, readers });
            if (!a || !b) continue;
            const ra = a.subject.rec, rb = b.subject.rec;
            (raw[T.stand] ??= []).push({ ms, aimAt: ra.aimAt });
            (shown[T.stand] ??= []).push({ ms, aimAt: rb.aimAt });
            if (JSON.stringify([ra.hold, ra.pose, ra.facing, !!ra.aimAt]) !== JSON.stringify([rb.hold, rb.pose, rb.facing, !!rb.aimAt])) otherHeld++;
            if (ra.aimAt !== rb.aimAt) { behind[T.stand] ??= ms; lagMax = Math.max(lagMax, ms - behind[T.stand] + 50); } else delete behind[T.stand];
            if (rb.key !== b.subject.key.slice(b.subject.key.indexOf('|') + 1)) bad.push(`${opfor} ${T.stand}: the subject's key is not its record's`);
          }
        } });
        assert(r.done, `${opfor} reaches its card`);
        const stands = Object.keys(raw).sort();
        const before = stands.map(k => [k, flicksOf(raw[k])]), after = stands.map(k => [k, flicksOf(shown[k])]);
        console.log(`      ${tier} ${seed} ${opfor}: ${ticks} ticks; seenOf's sides held under ${AIM_DWELL_MS} ms ${before.map(([k, f]) => `${k} ${f.short} (shortest ${Number.isFinite(f.minMs) ? f.minMs : '-'} ms)`).join(', ')}; the card's ${after.map(([k, f]) => `${k} ${f.short} (shortest ${Number.isFinite(f.minMs) ? f.minMs : '-'} ms)`).join(', ')}; the card behind the record at most ${lagMax} ms; a hold, pose or facing held ${otherHeld}`);
        for (const [k, f] of after) if (f.short) bad.push(`${opfor} ${k}: ${f.short} sides shown under ${AIM_DWELL_MS} ms (shortest ${f.minMs} ms)`);
        if (lagMax > AIM_DWELL_MS) bad.push(`${opfor}: the card behind the record ${lagMax} ms`);
        if (otherHeld) bad.push(`${opfor}: ${otherHeld} ticks with the hold, pose or facing not the record's`);
        if (!before.some(([, f]) => f.short)) bad.push(`${opfor}: no flick in seenOf's own sides, so the lane no longer tests the dwell`);
      }
      assert(!bad.length, JSON.stringify(bad.slice(0, 8)));
    },
  },
];
