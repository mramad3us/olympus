// OLYMPUS tests: room 1 of lane A, step by step by the keys and by T, against the build sheet 0.0.12 §4's table at 1 G (COMBAT §25.5.2 to §25.5.4 reprinted; src/sim/combat/drills/enter-and-clear.js, bundle.js, stepper.js; the drill's bot tests/bots/drill.mjs).
//
// The user's rule (2026-11-07): "make sure actual gameplay is consistent with training, no watering down but factor in
// experience in how smooth and fast we do things": every sheet plays the same room, the same man in the far left corner,
// the same mechanics; only the rung decides what one press covers. Held: the room within ±10% of the table, the take-in
// within ±0.05 s, the first round after the sighting within ±0.10 s by T and ±0.15 s by the keys (the keys' facing at the
// pause sets the aim's turn, and the built aim carries the rifle's sight ×1.2 and turn ×0.8 that the sheet's scratch left
// out: COMBAT §25.5.5's settled note), the same end state both ways (the man down, "Clear!", #1 within 0.3 m of his point,
// the room's hot spots covered), never a round before the sighting + the trigger + the aim (COMBAT §25.4.4's body floor),
// and the private's room at least 1.5 times the tier one's (COMBAT §25.13).
import { assert, fmt } from './helpers.mjs';
import { roomRun } from './bots/drill.mjs';
import { TRIGGER_S } from '../src/sim/arms/shot.js';
import { OUT_WAIT_MS } from '../src/sim/arms/specials.js';
import { RUNG_OF_TIER, valueOf } from '../src/sim/skills/templates.js';
import { paceOf } from '../src/sim/skills/skills.js';
import { READ_S, CALL_S } from '../src/sim/combat/bundle.js';

// (the build sheet 0.0.12 §4: room s, sighting to the first round s, take-in s, presses)
const TABLE = {
  recruit: { room: 15.33, first: 2.98, takeIn: 0.95, presses: 8 },
  private: { room: 13.79, first: 2.00, takeIn: 0.80, presses: 8 },
  privateWatch: { room: 13.31, first: 0.92, takeIn: 0.55, presses: 9 },
  // (the corporal re-pinned on purpose by the rework's R9, 2026-11-13: below rung 3 his muzzle goes in onto the corner he faces
  // (bundle.js muzzleTo), no longer down the door's normal 29 degrees off the off-corner man, so he takes him in his sector:
  // the take-in 0.50 to 0.35 s and the first round 1.53 to 0.81 s, inside the advanced par he is held to (COMBAT §25.19.8 F10);
  // the room is the build sheet's)
  cpl: { room: 8.82, first: 0.81, takeIn: 0.35, presses: 4 },
  sgt: { room: 6.13, first: 0.56, takeIn: 0.25, presses: 2 },
  raider: { room: 5.19, first: 0.37, takeIn: 0.10, presses: 2 },
  tierone: { room: 4.98, first: 0.30, takeIn: 0.05, presses: 2 },
};
const RUNS = [['recruit', {}], ['private', {}], ['privateWatch', { tier: 'private', watch: true }], ['cpl', {}], ['sgt', {}], ['raider', {}], ['tierone', {}]];
const o0 = (key) => RUNS.find(([k]) => k === key)?.[1]?.tier ?? key;
let cache = null;
const runs = () => (cache ??= RUNS.map(([key, o]) => ({ key, r: roomRun({ tier: o.tier ?? key, ...o }) })));

export default [
  {
    name: 'room 1 by every sheet against the table at 1 G: the room ±10%, the take-in ±0.05 s, the first round after the sighting ±0.10 s by T and ±0.15 s by the keys, by T from rung 3 later by at most the wait for the feet out of the door (the user, 2026-11-07: "a recruit marine would have to do everything step by step while an experience Tier 1 Operator would have automations through pressing T"; the rework, 2026-11-12: the first round out of the door)',
    timeoutMs: 120_000,
    fn() {
      const bad = [];
      console.log('      sheet           how    room s (table)    take-in s (table)  first s (table)  presses (table)  sighting s  pause s');
      for (const { key, r } of runs()) {
        const t = TABLE[key], room = r.roomMs / 1000, ti = r.takeInMs / 1000, first = r.firstMs / 1000;
        // (2026-11-12, the rework's R4, COMBAT §25.19.2: below rung 3 the corporal's "Stack up, take point" reads the door and tells
        // his #2 how it opens ("Opens in, I go left."), one beat at a time, so his table gains their own times, the read's
        // READ_S × paceOf(Awareness) and the call's CALL_S: re-pinned on purpose; from rung 3 the read rides the approach)
        const told = r.mode === 'T' && (RUNG_OF_TIER[o0(key)] ?? 0) === 2 ? READ_S * paceOf(valueOf(r.w.s, r.w.pid, 'awareness')) + CALL_S : 0;
        console.log(`      ${key.padEnd(15)} ${r.mode.padEnd(6)} ${fmt(room, 2).padStart(6)} (${fmt(t.room + told, 2)})   ${fmt(ti, 2)} (${fmt(t.takeIn, 2)})        ${fmt(first, 2)} (${fmt(t.first, 2)})      ${String(r.presses).padStart(2)} (${t.presses})          ${fmt(r.seenMs / 1000, 2)}       ${fmt(r.pauseMs / 1000, 2)}`);
        if (Math.abs(room - t.room - told) > 0.10 * (t.room + told)) bad.push(`${key} room ${fmt(room, 2)} against ${fmt(t.room + told, 2)}`);
        if (Math.abs(ti - t.takeIn) > 0.05 + 1e-9) bad.push(`${key} take-in ${fmt(ti, 2)} against ${t.takeIn}`);
        // (the boot recruit below the Pair's gate fires Fire twice: his first round's time is printed, not held to the Pair's)
        // (2026-11-12, R3: inside the flow the first round moving on waits for the feet past the door's threshold (specials.js
        // OUT_WAIT_MS; COMBAT §25.19.8 F5), which the routed lanes' outer middle puts about 0.18 s after the table's for the
        // Raider and the tier one (0.50 and 0.48 s against 0.37 and 0.30): later by at most that wait, never sooner)
        const late = r.mode === 'T' && (RUNG_OF_TIER[o0(key)] ?? 0) >= 3 ? OUT_WAIT_MS / 1000 : 0;
        if (key !== 'recruit' && (first - t.first > (r.mode === 'keys' ? 0.15 : 0.10) + late + 1e-9 || t.first - first > (r.mode === 'keys' ? 0.15 : 0.10) + 1e-9)) bad.push(`${key} first round ${fmt(first, 2)} against ${t.first}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'the same end state by the keys and by T: the man down, "Clear!" called, #1 within 0.3 m of his point and past the threshold, every hot spot of the room covered (the user, 2026-11-07: "no watering down")',
    timeoutMs: 120_000,
    fn() {
      const bad = [];
      for (const { key, r } of runs()) {
        console.log(`      ${key.padEnd(13)} ${r.mode.padEnd(5)} down ${r.end.down} · "Clear!" ${r.end.clear} · off his point ${fmt(r.end.offPointM, 2)} m · in ${r.end.inside} · covered ${r.end.covered.join(' ')}`);
        if (!r.end.down || !r.end.clear || r.end.offPointM > 0.3 || !r.end.inside || r.end.covered.length < 4) bad.push(`${key}: ${JSON.stringify(r.end)}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'no first round before the sighting + the trigger + the aim (COMBAT §25.4.4\'s body floor), the tier one\'s round still a human time after his one-tick take-in',
    timeoutMs: 120_000,
    fn() {
      const bad = [];
      for (const { key, r } of runs()) {
        const floor = r.takeInMs / 1000 + TRIGGER_S;
        if (r.firstMs / 1000 < floor - 1e-9) bad.push(`${key}: first ${fmt(r.firstMs / 1000, 3)} s under ${fmt(floor, 3)}`);
      }
      const t1 = runs().find(x => x.key === 'tierone').r;
      console.log(`      the tier one: taken in ${fmt(t1.takeInMs / 1000, 2)} s, his first round ${fmt(t1.firstMs / 1000, 2)} s after the man could see him (COMBAT §25.4.4: "the pause is the decision becoming available, not the round leaving")`);
      assert(!bad.length && t1.firstMs >= 200, bad.join('; ') || `the tier one's first round at ${t1.firstMs} ms`);
    },
  },
  {
    name: 'faster and smoother by training, not by watering down: the private\'s room at least 1.5 times the tier one\'s (COMBAT §25.13), each rung no slower than the one below it, and a Watch buys the private time in still time',
    timeoutMs: 120_000,
    fn() {
      const by = Object.fromEntries(runs().map(({ key, r }) => [key, r.roomMs]));
      const ratio = by.private / by.tierone;
      console.log(`      the room: recruit ${fmt(by.recruit / 1000, 2)} · private ${fmt(by.private / 1000, 2)} (Watch ${fmt(by.privateWatch / 1000, 2)}) · corporal ${fmt(by.cpl / 1000, 2)} · sergeant ${fmt(by.sgt / 1000, 2)} · Raider ${fmt(by.raider / 1000, 2)} · tier one ${fmt(by.tierone / 1000, 2)} s; private / tier one ${fmt(ratio, 2)} (table 2.77)`);
      assert(ratio >= 1.5, `the ratio ${ratio}`);
      assert(by.cpl < by.private && by.sgt < by.cpl && by.raider <= by.sgt && by.tierone <= by.raider + 50, JSON.stringify(by));
      assert(by.privateWatch < by.private, `Watch ${by.privateWatch} against ${by.private}`);
    },
  },
];
