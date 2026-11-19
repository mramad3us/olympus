// OLYMPUS tests: the kit's bots for "Stack and clear" (v0.0.18, the build sheet 0.0.18 §5.3; COMBAT §25.20): the honest or the keys bot with the kit's row pressed once a door, and the kit's fuzz.
//
// houseKitBot({ use: 'flash' | 'breach' | 'both', base }) is tests/bots/house.mjs's honest bot (base 'honest': T and the shot the line names;
// v0.0.22: base 'T', houseTBot, T as the page sends it, for the gauges' T kit lanes, flawless-blast.mjs) or its keys
// bot (base 'keys': the recruit's and the private's walk) with one thing more, once at each door of the lane: from rung 2 the
// variant rows set at each door ("No bang ⇄ Flash" to Flash for use 'flash'; "Push ⇄ Kick ⇄ …" to Charge, else Pry, for use 'breach'; from the
// fixer of v0.0.18 a breach or a bang is chosen for its door alone, bundle.js variantHere), so
// T's own room row carries the kit ("Flash, in: your corner", "Charge, clear the room"); below rung 2 the kit's row itself
// ("Flash it", "Breach (explosive)", else "Pry it") pressed at the door. The ways a door allows are the variant row's own cycle
// (bundle.js breachWays), what the player sees it offer. T never chooses a breach or a grenade (COMBAT
// §25.5.6): the bot does, as a player would, and everything else is T's. Its memory says what it pressed (mem.kitPresses,
// mem.kitDoors). kitFuzzBot({ seed }) is the house's fuzz bot with the kit's rows and the device rows weighted in, hunting the
// dead ends a grenade in the hand or a charge on a door could leave.
// v0.0.19 (D2): use 'frag' and 'conc' throw a practice grenade only at a door the brief named hostiles only (R.house.intel, what
// the player is told: F31), and a G-11 elsewhere where one is carried ('mixed'); 'cut' breaches by the BC-1 at the pull door its
// hinges are for (room 2), the other doors T's own; 'shoot' shoots the closet's lock (the inner door's row), the lane's doors
// T's own. `cook` ('2', '0' or null: the rung's default) sets the count's variant.
// v0.0.22 (the build sheet v0.0.22 item 8, R1 b): a grenade handed back at your feet or short on you ("Get clear"), the kit bot
// presses T on the DI's line (cqb.js cqb-grenade, "Grenade! Get clear.": Get clear, bundle.js move:clear), as a player who reads
// it; mem.clears counts them. With `decline` it carries on the drill instead (Carry on; mem.declined), the tests' lane that keeps the fault.
// v0.0.26 ("Bang, then go", its build sheet §6 B, F140): `late`, ms held at the stack after the bang through room 1's door, the slow
// stack's knob (tests/breach-window's T13 reprinted from the game). On every sheet the bot stacks by its row ("To the door. On the
// wall."), presses the single "Flash it" (the room row would go through on the bang by itself), and from the bang leaves stop motion and
// stands still until `late` ms have passed (mem.lateAt, the bang's ms), then hands the entry to its base bot (the keys' walk, T's
// bundle). The memory is plain data on the actor (the bots' rule), so it saves.
import { houseHonestBot, houseKeysBot, houseFuzzBot, houseTBot } from './house.mjs';
import { stepAct } from './lib.mjs';
import { stepsOf } from '../../src/sim/arms/shooting.js';
import { houseNow } from '../../src/sim/scenarios/shoothouse.js';
import { rungOf } from '../../src/sim/skills/templates.js';
import { doorNow, breachWays, swingOf, variantHere } from '../../src/sim/combat/bundle.js';
import { kitHas } from '../../src/sim/combat/breach.js';
import { hashInt } from '../../src/core/hash.js';
import { instinctNow } from '../../src/sim/skills/instinct.js';

/** The most variant presses at one door (a row cycles its ways: four at most), so a door the kit cannot work is left to T. */
export const KIT_VARIANT_MAX = 6;

/** The rung from which the kit bot throws a practice frag or concussion (see bangFor): the corporal's, Weapon handling 11. */
export const FRAG_RUNG = 2;
/** The kit bot (see the header). */
export function houseKitBot({ use = 'flash', base = 'honest', cook = null, decline = false, late = null } = {}) {
  const inner = base === 'keys' ? houseKeysBot() : base === 'T' ? houseTBot() : houseHonestBot();
  // (v0.0.19: the bang a door gets by the use and the brief, and the way in by the use)
  const bangFor = (state, door, kinds) => {
    // (below the corporal no frag or concussion is thrown on the lane (my call, FRAG_RUNG): Weapon handling under 10 (the boot
    // recruit's 4, the private's 9) slips a grenade at his own feet on a natural 1 (throw.js), beside his stack (the gauges' F30);
    // they flash where a G-11 is carried)
    const hostiles = state.armoury.range.house.intel?.[door] === 'hostiles' && rungOf(state, state.player.id, 'room') >= FRAG_RUNG;
    if ((use === 'frag' || use === 'mixed') && hostiles && kinds.includes('frag')) return 'frag';
    if (use === 'conc' && hostiles && kinds.includes('conc')) return 'conc';
    if ((use === 'flash' || use === 'both' || use === 'mixed') && kinds.includes('flash')) return 'flash';
    return null;
  };
  const breaching = use === 'breach' || use === 'both' || use === 'cut' || use === 'shoot';
  return (state, me, mem) => {
    mem.kitPresses ??= 0; mem.kitDoors ??= {};
    if (late !== null) { const r = lateStep(state, mem, late); if (r) return r; }
    const N = houseNow(state), S = state.stop;
    const lane = N && N.goAtMs !== null && !N.end;
    if (lane && S?.mode === 'stop' && S.phase === 'choose' && !S.reflex) {
      // (v0.0.22: "Grenade! Get clear.": T, the DI's own row)
      const line = instinctNow(state).line;
      if (line?.id === 'cqb-grenade' && line.act) {
        if (!decline) { mem.clears = (mem.clears ?? 0) + 1; return { act: [{ act: 'instinct', args: { id: line.id, act: line.act } }] }; }
        if (stepsOf(state).some(r => r.id === 'drill:carry' && !r.off)) { mem.declined = (mem.declined ?? 0) + 1; return { act: [stepAct('drill:carry')] }; }
      }
      const pid = state.player.id, here = doorNow(state, pid), door = here?.door ?? null;
      const rows = stepsOf(state), rung = rungOf(state, pid, 'room'), v = variantHere(state, pid);
      // (the closet's lock shot from room 2, once, on a shoot lane)
      const shoot = use === 'shoot' ? rows.find(r => /^door:shoot>/.test(r.id) && !r.off) : null;
      // (pressed again after a click or a point that would not give, while it is still live, up to KIT_VARIANT_MAX)
      if (shoot && (mem.kitDoors[shoot.id]?.n ?? 0) < KIT_VARIANT_MAX) { (mem.kitDoors[shoot.id] ??= { n: 0, done: true }).n++; mem.kitPresses++; return { act: [stepAct(shoot.id)] }; }
      if (door && door !== 'hall') {
        const rec = (mem.kitDoors[door] ??= { n: 0, done: false });
        const press = (id) => { rec.n++; mem.kitPresses++; return { act: [stepAct(id)] }; };
        const kinds = ['flash', 'frag', 'conc'].filter(k => kitHas(state, pid, k === 'flash' ? 'flashbang' : k));
        // (the late stack's bang thrown by its own row: the entry after it goes in with none (late; a second G-11 would reset the window))
        const want = late !== null && mem.lateFlashed ? null : bangFor(state, door, kinds);
        if (!rec.done && rec.n < KIT_VARIANT_MAX) {
          if (rung >= 2) {
            const bang = rows.find(r => r.id === 'drill:variant:bang'), br = rows.find(r => r.id === 'drill:variant:breach'), ck = rows.find(r => r.id === 'drill:variant:cook');
            // (a frag or a concussion set at the last door is taken off here where the brief did not name it: "No bang")
            if (bang && (want ? v.bang !== want : v.bang === 'frag' || v.bang === 'conc')) return press(bang.id);
            if (want && want !== 'flash' && cook && ck && (v.cook ?? (rung >= 3 ? '2' : '0')) !== cook) return press(ck.id);
            if (breaching && br) {
              const ways = here.plan ? breachWays(state, pid, here.plan) : [];
              // (cut: the BC-1 on the pull door its hinges are for, the other doors T's own; shoot: the lane's doors T's own, the closet shot;
              // breach and both: D1's, a charge else the halligan at every door)
              const pull = here.plan ? swingOf(state, here.plan) === 'pull' : false;
              const way = use === 'cut' ? (pull && ways.includes('cut') ? 'cut' : null) : use === 'shoot' ? null : ways.includes('charge') ? 'charge' : ways.includes('pry') ? 'pry' : null;
              if (way && v.breach !== way) return press(br.id);
              if (way) rec.done = true;
            } else if (!want || v.bang === want) rec.done = true;
          } else {
            const live = (re) => rows.find(r => re.test(r.id) && !r.off);
            const bangRow = want ? live(new RegExp(`^drill:door:${want}`)) : null;
            const pull = here.plan ? swingOf(state, here.plan) === 'pull' : false;
            const row = use === 'cut' ? (pull ? live(/^drill:door:breach/) : null) : use === 'shoot' ? null : breaching ? live(/^drill:door:breach/) ?? live(/^drill:door:pry/) ?? (use === 'both' ? live(/^drill:door:flash/) : null) : bangRow;
            if (row) { rec.done = use !== 'both' || /flash/.test(row.id); return press(row.id); }
          }
        }
      }
    }
    return inner(state, me, mem);
  };
}

// (the late stack (see the header), room 1's door only, before your entry: the stack row, then the single "Flash it", then still until
// the bang + late; null to hand the decision on)
function lateStep(state, mem, late) {
  const H = state.armoury?.range?.house, L = H?.rooms?.[0], S = state.stop, now = state.clock.ms;
  if (!H || H.goAtMs === null || H.end || !L || L.enteredAtMs !== null || state.skip) return null;
  const B = (H.bursts ?? []).filter(b => b.thrown === L.door && !b.atFeet).at(-1) ?? null;
  if (B) { mem.lateAt ??= B.atMs; if (now >= B.atMs + late) return null; }
  // (a doing of the approach or the throw runs out; the throw done and its fuse burning, or the bang thrown and `late` not yet passed:
  // out of stop motion and still, the time running)
  if (S?.doing) return {};
  if (B || mem.lateFlashed) return S?.mode === 'stop' && S.phase === 'choose' && !S.reflex ? { act: [stepAct('leave')] } : S ? null : {};
  if (!S || S.mode !== 'stop' || S.phase !== 'choose' || S.reflex) return null;
  const rows = stepsOf(state), live = (re) => rows.find(r => re.test(r.id) && !r.off);
  const flash = live(/^drill:door:flash/);
  if (flash) { mem.lateFlashed = now; mem.kitPresses++; return { act: [stepAct(flash.id)] }; }
  const stack = live(/^drill:stack:up/);
  return stack ? { act: [stepAct(stack.id)] } : null;
}

/** The kit's fuzz (see the header): the house fuzz bot, with a kit row or a device row pressed in its place one time in KIT_FUZZ_K. */
export const KIT_FUZZ_K = 3;
export function kitFuzzBot({ seed = 1 } = {}) {
  const inner = houseFuzzBot({ seed });
  return (state, me, mem) => {
    mem.kn ??= 0;
    const S = state.stop, N = houseNow(state);
    if (N && N.goAtMs !== null && !N.end && S?.mode === 'stop' && S.phase === 'choose' && !S.reflex) {
      const rows = stepsOf(state).filter(r => !r.off && (/^drill:door:(flash|frag|conc|breach|pry|ram|shoot)|^door:shoot>|^dev:|^drill:variant:(bang|breach|cook)/.test(r.id)));
      if (rows.length && hashInt(KIT_FUZZ_K, 'kit-fuzz', seed, mem.kn++) === 0) {
        const r = rows[hashInt(rows.length, 'kit-fuzz-pick', seed, mem.kn++)];
        (mem.kitSteps ??= {})[r.id] = (mem.kitSteps[r.id] ?? 0) + 1;
        return { act: [stepAct(r.id)] };
      }
    }
    return inner(state, me, mem);
  };
}
