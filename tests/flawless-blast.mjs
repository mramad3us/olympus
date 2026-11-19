// OLYMPUS tests: the shoot house's gauges of the stack's own grenade and the #2 near a live one (the build sheet v0.0.22 §8: F78, F79; items 7 to 9, R1 and R2).
//
// A blast lane is "Stack and clear" on a kit loadout from GO, played by a kit bot (tests/bots/kit.mjs houseKitBot: 'kit' the honest bot
// with the keys below rung 2, the corporal up T and the shot the line names; 'T' T as the page sends it, houseTBot; 'fuzz' kitFuzzBot)
// and watched every tick by blastWatch, which keeps plain records:
//   seen     each grenade the first tick it lies live on the floor: whose, whether its burst would stun your #2 where he stood then
//            (burst.js stunOn: its stun line, the walls counted), the hand-back it was given (bundle.js SLIP_WORDS, SHORT_WORDS) and
//            whether your Get clear ran after it (move:clear), whether his own clear ran (two.js TWO_CLEAR_STEP)
//   bursts   each grenade's burst: its peak on you and your #2 (the burst's record; a practice grenade's by the instructor's read of
//            its live twin, practice.js readBurst's stack), whether your line to it was clear (practice.js blastLine), at your feet
//   into     every entry of your #2 (a 'drill:room:in' doing started) with a live grenade in the room he goes into or within its stun
//            line of his way in (burst.js liveIn): none is allowed
//   entry    tests/cqb-gauges.mjs's F25 watcher, whose cues held by a live grenade are timed from its burst (E.live)
// The criteria (blastRows):
//   F78  the stack's own grenade: on every lane of the kit and T bots, no grenade of yours puts more than BREACH_SAFE_KPA 27.6 kPa on
//        you or your #2 but one handed back and declined (its Get clear not taken); the fuzz's bursts over STUN_KPA 20 and over 27.6,
//        the worst and the share whose line to you was clear printed
//   F79  nobody into a live grenade: no entry of your #2 begun into one, on every bot, the fuzz included (it is his brain, not the
//        player's); his peak at STUN_KPA or more only from a grenade that lay within its stun line of where he stood when it came
//        down, his clear runs printed, and the F25 cues held by a live grenade
// Both enforced at once (BLAST_ENFORCED).
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { houseKitBot, kitFuzzBot } from './bots/kit.mjs';
import { entry as entryWatch } from './cqb-gauges.mjs';
import { liveDevices } from '../src/sim/arms/devices.js';
import { STUN_KPA, BREACH_SAFE_KPA } from '../src/sim/arms/blast.js';
import { stunOn, liveIn } from '../src/sim/combat/burst.js';
import { blastLine } from '../src/sim/combat/practice.js';
import { SLIP_WORDS, SHORT_WORDS } from '../src/sim/combat/bundle.js';
import { TWO_CLEAR_STEP } from '../src/sim/combat/two.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';

/** The criteria enforced from v0.0.22 B. */
export const BLAST_ENFORCED = Object.freeze(new Set(['F78', 'F79']));
/** The lanes' seeds: ten of the residuals lens's sweep (48214 to 48223), the boot recruit's slip at his feet (48229), and the review's stunned stack (48224). */
export const BLAST_SEEDS = Object.freeze([48214, 48215, 48216, 48217, 48218, 48219, 48220, 48221, 48222, 48223, 48224, 48229]);
/** The sheets, every one. */
export const BLAST_SHEETS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
/** The loadouts that throw a G-11: the flash and the full (G-11s and the charges). */
export const BLAST_LOADOUTS = Object.freeze(['flash', 'full']);

const r1 = (x) => (Number.isFinite(x) ? Math.round(x * 10) / 10 : x);
const actorOf = (st, pid) => (pid ? st.actors.list.find(a => a.who === pid) ?? null : null);
const GRENADE = /^g\d/;

/** The blast watcher (see the header): { tick(game), result() }. */
export function blastWatch(game) {
  const me = game.state.player.id, team = { me, two: game.state.armoury?.range?.house?.twoPid ?? null };
  const rec = { seen: {}, bursts: [], into: [], entries: 0, clears: 0 };
  const E = entryWatch(game, { team });
  let nb = 0, lastStep = null, lastWords = null, lastClear = null;
  return {
    tick(g, { now = g.state.clock.ms, dt = 0, on = true } = {}) {
      const st = g.state, H = st.armoury?.range?.house;
      if (!H) return;
      const two = actorOf(st, H.twoPid), mine = actorOf(st, me);
      E.tick(g, { now, dt, on: on && !!mine && !!two && H.goAtMs !== null && !H.end });
      for (const d of liveDevices(st)) if (d.kind === 'grenade' && !rec.seen[d.id]) rec.seen[d.id] = { atMs: now, model: d.model, byMe: st.items[d.id]?.byId === me, nearTwo: !!two && stunOn(st, d, two), handback: null, took: false, clear: false };
      // (a hand-back of a grenade at your feet or short on you: the nearest live grenade's)
      const w = st.stop?.carry?.words ?? null;
      if (w && w !== lastWords && (w === SLIP_WORDS || w === SHORT_WORDS) && mine) {
        const d = liveDevices(st).filter(x => x.kind === 'grenade').sort((p, q) => Math.hypot(p.x - mine.x, p.z - mine.z) - Math.hypot(q.x - mine.x, q.z - mine.z))[0];
        if (d && rec.seen[d.id]) rec.seen[d.id].handback = w === SLIP_WORDS ? 'slip' : 'short';
      }
      lastWords = w;
      if (st.stop?.doing?.step === 'move:clear') for (const d of liveDevices(st)) if (rec.seen[d.id]?.handback) rec.seen[d.id].took = true;
      // (his own clear, and his entries)
      const W = H.two, step = W?.doing?.step ?? null;
      if (step === TWO_CLEAR_STEP && W.doing !== lastClear) { lastClear = W.doing; rec.clears++; if (rec.seen[W.doing.grenade]) rec.seen[W.doing.grenade].clear = true; }
      if (step !== lastStep && /^drill:room:in>/.test(step ?? '')) {
        rec.entries++;
        const door = step.split('>')[1], P = lanePlanOf(st).plans?.[door], path = W.doing.beats.find(b => b.k === 'move')?.path ?? [];
        const d = P ? liveIn(st, P, path) : null;
        if (d) rec.into.push({ t: now - (H.goAtMs ?? 0), door, model: d.model, leftMs: (st.items[d.id]?.fuseAtMs ?? now) - now });
      }
      lastStep = step;
      // (the bursts of the tick: a practice grenade's peaks are its read's, the live twin's)
      const bs = H.bursts ?? [];
      while (nb < bs.length) {
        const b = bs[nb++];
        if (!GRENADE.test(b.model ?? '')) continue;
        const s = rec.seen[b.id] ?? null, read = b.read?.stack ?? null;
        const onMe = read ? read.me?.kPa ?? 0 : b.kPa?.[me] ?? 0, onTwo = read ? read.two?.kPa ?? 0 : b.kPa?.[H.twoPid] ?? 0;
        const clearMe = mine ? blastLine(st, st.places.live.area, [b.x, b.z], [mine.x, mine.z]).clear : null;
        rec.bursts.push({ id: b.id, t: b.atMs - (H.goAtMs ?? 0), model: b.model, byMe: b.byId === me, onMe: r1(onMe), onTwo: r1(onTwo), clearMe, atFeet: !!b.atFeet, handback: s?.handback ?? null, took: !!s?.took, nearTwo: !!s?.nearTwo, twoClear: !!s?.clear });
      }
    },
    result: () => ({ ...rec, entry: E.result() }),
  };
}

/** One blast lane (see the header): { lane, done, s, end, rec }. bot 'kit' | 'T' | 'fuzz'. */
export function blastLane({ tier, seed, loadout = 'flash', bot = 'kit', maxMs = 12 * 60_000 }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', loadout, strict: false });
  const keys = (RUNG_OF_TIER[tier] ?? 0) < 2;
  const B = bot === 'fuzz' ? kitFuzzBot({ seed }) : houseKitBot({ use: 'flash', base: bot === 'T' ? 'T' : keys ? 'keys' : 'honest' });
  const w = blastWatch(g);
  let prev = g.state.clock.ms;
  const run = runHouse(g, B, { maxMs, each: (game) => { const now = game.state.clock.ms; w.tick(game, { now, dt: now - prev }); prev = now; } });
  return { lane: `${bot} ${loadout} ${tier} ${seed}`, bot, done: run.done, s: r1(run.ms / 1000), end: g.state.armoury?.range?.house?.end?.why ?? null, rec: w.result() };
}

/** The lanes (see the header), every sheet, seed, loadout and bot given. */
export function blastLanes({ sheets = BLAST_SHEETS, seeds = BLAST_SEEDS, loadouts = BLAST_LOADOUTS, bots = ['kit', 'T'], maxMs } = {}) {
  const out = [];
  for (const bot of bots) for (const loadout of loadouts) for (const tier of sheets) for (const seed of seeds) out.push(blastLane({ tier, seed, loadout, bot, ...(maxMs ? { maxMs } : {}) }));
  return out;
}

/** F78 and F79 from lanes (see the header): [{ id, name, met, value, target, enforced }]. */
export function blastRows(lanes) {
  const honest = lanes.filter(l => l.bot !== 'fuzz'), fuzz = lanes.filter(l => l.bot === 'fuzz');
  const mine = (ls) => ls.flatMap(l => l.rec.bursts.filter(b => b.byMe).map(b => ({ ...b, lane: l.lane })));
  const over = (b) => Math.max(b.onMe, b.onTwo) > BREACH_SAFE_KPA, declined = (b) => !!b.handback && !b.took;
  const hb = mine(honest), bad = hb.filter(b => over(b) && !declined(b)), handed = hb.filter(b => b.handback);
  const fb = mine(fuzz), worst = (bs) => Math.max(0, ...bs.map(b => Math.max(b.onMe, b.onTwo)));
  const share = (bs) => (bs.length ? `${Math.round(100 * bs.filter(b => b.clearMe).length / bs.length)}%` : '-');
  const fuzzWords = fuzz.length ? `; the fuzz (printed) ${fuzz.length} lanes: ${fb.length} of yours, over ${STUN_KPA} kPa ${fb.filter(b => Math.max(b.onMe, b.onTwo) >= STUN_KPA).length}, over ${BREACH_SAFE_KPA} ${fb.filter(over).length} (declined hand-backs ${fb.filter(b => over(b) && declined(b)).length}), worst ${worst(fb)} kPa, the line to you clear ${share(fb)}` : '';
  const f78 = { id: 'F78', name: 'the stack\'s own grenade', met: honest.length > 0 && !bad.length, enforced: true, target: `none over BREACH_SAFE_KPA ${BREACH_SAFE_KPA} kPa on you or your #2 but a hand-back declined`,
    value: `${honest.length} lanes (kit and T): ${hb.length} grenades of yours, over ${STUN_KPA} kPa ${hb.filter(b => Math.max(b.onMe, b.onTwo) >= STUN_KPA).length}, over ${BREACH_SAFE_KPA} ${hb.filter(over).length} (${bad.length} not declined${bad.length ? `: ${bad.slice(0, 4).map(b => `${b.lane} ${b.model} ${b.onMe}/${b.onTwo} kPa at ${b.t} ms`).join('; ')}` : ''}); hand-backs ${handed.length} (slip ${handed.filter(b => b.handback === 'slip').length}, short ${handed.filter(b => b.handback === 'short').length}; Get clear taken ${handed.filter(b => b.took).length}); worst ${worst(hb)} kPa, the line to you clear ${share(hb)}${fuzzWords}` };
  const all = lanes, into = all.flatMap(l => l.rec.into.map(x => ({ ...x, lane: l.lane })));
  const stunned = all.flatMap(l => l.rec.bursts.filter(b => b.onTwo >= STUN_KPA).map(b => ({ ...b, lane: l.lane, fuzz: l.bot === 'fuzz' })));
  const unearned = stunned.filter(b => !b.nearTwo), clears = all.reduce((n, l) => n + l.rec.clears, 0), entries = all.reduce((n, l) => n + l.rec.entries, 0);
  const held = all.reduce((n, l) => n + Object.values(l.rec.entry ?? {}).filter(e => e.live).length, 0);
  const f79 = { id: 'F79', name: 'nobody into a live grenade', met: all.length > 0 && !into.length && !unearned.length, enforced: true, target: 'no entry of your #2 into a live grenade; his peak at STUN_KPA only from one within its stun line of him',
    value: `${all.length} lanes (${fuzz.length} fuzz): ${entries} entries of his, into a live grenade ${into.length}${into.length ? ` (${into.slice(0, 4).map(x => `${x.lane} ${x.door} at ${x.t} ms, ${x.leftMs} ms of fuse`).join('; ')})` : ''}; his peak at ${STUN_KPA} kPa or more ${stunned.length} (${unearned.length} from a grenade not within its stun line of him${unearned.length ? `: ${unearned.slice(0, 4).map(b => `${b.lane} ${b.model} ${b.onTwo} kPa at ${b.t} ms`).join('; ')}` : ''}); his clear runs ${clears} (his peak after them ${stunned.filter(b => b.twoClear).map(b => b.onTwo).join(', ') || 'none at 20 kPa or more'}); F25's cues held by a live grenade ${held}` };
  return [f78, f79];
}
/** The criteria failing (enforced and not met), as words. */
export const blastFailing = (rows) => rows.filter(r => BLAST_ENFORCED.has(r.id) && !r.met).map(r => `${r.id} ${r.name}: ${r.value}`);
