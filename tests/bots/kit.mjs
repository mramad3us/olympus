// OLYMPUS tests: the kit's bots for "Stack and clear" (v0.0.18, the build sheet 0.0.18 §5.3; COMBAT §25.20): the honest or the keys bot with the kit's row pressed once a door, and the kit's fuzz.
//
// houseKitBot({ use: 'flash' | 'breach' | 'both', base }) is tests/bots/house.mjs's honest bot (base 'honest': T and the shot the line names) or its keys
// bot (base 'keys': the recruit's and the private's walk) with one thing more, once at each door of the lane: from rung 2 the
// variant rows set at each door ("No bang ⇄ Flash" to Flash for use 'flash'; "Push ⇄ Kick ⇄ …" to Charge, else Pry, for use 'breach'; from the
// fixer of v0.0.18 a breach or a bang is chosen for its door alone, bundle.js variantHere), so
// T's own room row carries the kit ("Flash, in: your corner", "Charge, clear the room"); below rung 2 the kit's row itself
// ("Flash it", "Breach (explosive)", else "Pry it") pressed at the door. The ways a door allows are the variant row's own cycle
// (bundle.js breachWays), what the player sees it offer. T never chooses a breach or a grenade (COMBAT
// §25.5.6): the bot does, as a player would, and everything else is T's. Its memory says what it pressed (mem.kitPresses,
// mem.kitDoors). kitFuzzBot({ seed }) is the house's fuzz bot with the kit's rows and the device rows weighted in, hunting the
// dead ends a grenade in the hand or a charge on a door could leave.
// The memory is plain data on the actor (the bots' rule), so it saves.
import { houseHonestBot, houseKeysBot, houseFuzzBot } from './house.mjs';
import { stepAct } from './lib.mjs';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { houseNow } from '../../src/sim/scenarios/shoothouse.js';
import { rungOf } from '../../src/sim/skills/templates.js';
import { doorNow, breachWays, variantHere } from '../../src/sim/combat/bundle.js';
import { hashInt } from '../../src/core/hash.js';

/** The most variant presses at one door (a row cycles its ways: four at most), so a door the kit cannot work is left to T. */
export const KIT_VARIANT_MAX = 6;

/** The kit bot (see the header). */
export function houseKitBot({ use = 'flash', base = 'honest' } = {}) {
  const inner = base === 'keys' ? houseKeysBot() : houseHonestBot();
  return (state, me, mem) => {
    mem.kitPresses ??= 0; mem.kitDoors ??= {};
    const N = houseNow(state), S = state.stop;
    const lane = N && N.goAtMs !== null && !N.end;
    if (lane && S?.mode === 'stop' && S.phase === 'choose' && !S.reflex) {
      const pid = state.player.id, here = doorNow(state, pid), door = here?.door ?? null;
      if (door && door !== 'hall') {
        const rec = (mem.kitDoors[door] ??= { n: 0, done: false });
        const rows = stepsOf(state), rung = rungOf(state, pid, 'room'), v = variantHere(state, pid);
        const press = (id) => { rec.n++; mem.kitPresses++; return { act: [stepAct(id)] }; };
        if (!rec.done && rec.n < KIT_VARIANT_MAX) {
          if (rung >= 2) {
            const bang = rows.find(r => r.id === 'drill:variant:bang'), br = rows.find(r => r.id === 'drill:variant:breach');
            if ((use === 'flash' || use === 'both') && bang && v.bang !== 'flash') return press(bang.id);
            if ((use === 'breach' || use === 'both') && br) {
              const ways = here.plan ? breachWays(state, pid, here.plan) : [];
              const want = ways.includes('charge') ? 'charge' : ways.includes('pry') ? 'pry' : null;
              if (want && v.breach !== want) return press(br.id);
              if (want) rec.done = true;
            } else if ((use === 'flash' || use === 'both') && v.bang === 'flash') rec.done = true;
          } else {
            const live = (re) => rows.find(r => re.test(r.id) && !r.off);
            const row = use === 'flash' ? live(/^drill:door:flash/) : live(/^drill:door:breach/) ?? live(/^drill:door:pry/) ?? (use === 'both' ? live(/^drill:door:flash/) : null);
            if (row) { rec.done = use !== 'both' || /flash/.test(row.id); return press(row.id); }
          }
        }
      }
    }
    return inner(state, me, mem);
  };
}

/** The kit's fuzz (see the header): the house fuzz bot, with a kit row or a device row pressed in its place one time in KIT_FUZZ_K. */
export const KIT_FUZZ_K = 3;
export function kitFuzzBot({ seed = 1 } = {}) {
  const inner = houseFuzzBot({ seed });
  return (state, me, mem) => {
    mem.kn ??= 0;
    const S = state.stop, N = houseNow(state);
    if (N && N.goAtMs !== null && !N.end && S?.mode === 'stop' && S.phase === 'choose' && !S.reflex) {
      const rows = stepsOf(state).filter(r => !r.off && (/^drill:door:(flash|breach|pry|ram)|^dev:|^drill:variant:(bang|breach)/.test(r.id)));
      if (rows.length && hashInt(KIT_FUZZ_K, 'kit-fuzz', seed, mem.kn++) === 0) {
        const r = rows[hashInt(rows.length, 'kit-fuzz-pick', seed, mem.kn++)];
        (mem.kitSteps ??= {})[r.id] = (mem.kitSteps[r.id] ?? 0) + 1;
        return { act: [stepAct(r.id)] };
      }
    }
    return inner(state, me, mem);
  };
}
