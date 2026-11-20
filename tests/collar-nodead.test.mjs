// OLYMPUS tests: the boarding never dead-ends and every choice is seen, F153's sweep, F152's, F155's fuzz half and F157 (the build sheet v0.0.27 §1 D, items 2, 10, 18, §6 D, §8; the user, 2026-11-07: "a scene never dead-ends").
//
// Heavy. Every sheet × both types (pirates and smugglers) × four bots (collarTBot, a human pressing T as the page sends it with the
// boarding's own steps; the plain houseTBot, T and nothing else, so "by T" means T (the review of D: collarTBot's own Wait in the lock hid
// T's G and X in turn there); the keys bot; the fuzz) × NODEAD_SEEDS seeds, each lane from the fill to the card (tests/bots/collar.mjs collarLane): every lane to the card, no
// throw, no page error (the game's), the override 120 to 300 s behind its one splash (F152 on every lane), the ends counted (secured,
// fallen back, down, the due's 'time', a compartment 'passed'), the T player's refused presses printed; every fuzz round at a man down,
// with his hands up or unarmed faulted 'protected' and none by Four or a holder (F155: shoothouse.js houseShot over opfor.js protectedOf,
// counted on the 'shot' facts); and over K6_SEEDS honest seeds of each type (the honest player of the sheet: T from the corporal, the keys
// below) each of fight, cover, freeze and give met on at least one lane, blind and flee printed, by sheet and type (F157, the boarding's
// track: R.house.boarding.track, the scene's own record of every man's choices).
// v0.0.28 (the lead's call of 2026-11-20 on F157, red at v0.0.27's release on "never met: give"): the key fixed, not the threshold. The
// track recorded the security table's 'surrender' and the state 'hands', never 'give'; the table now says 'give' (opfor.js CHOICE_TABLE:
// one choice, one name), and collarLane reads a holdout's hands up (his table's give, or a challenge ending his freeze or cover) as his
// give, once a man, the hauler's crew's hands up to a challenge apart as 'crew hands'. The pirates' and smugglers' own table (the
// irregulars') has no give by design (the cell doctrine): theirs comes through the challenge alone.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { collarLane } from './bots/collar.mjs';
import { CQB_RULES } from '../src/sim/skills/instinct/cqb.js';
import { OVERRIDE_PASS_MS, OVERRIDE_MAX_MS } from '../src/sim/scenarios/shoothouse.js';
import * as OPFOR from '../src/sim/scenarios/opfor.js';

/** Seeds a cell of the sweep, and the honest seeds of F157. */
export const NODEAD_SEEDS = 10, K6_SEEDS = 40;
const SHEETS = ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'], TYPES = ['pirates', 'smugglers'];
const seedsOf = (n, base) => Array.from({ length: n }, (_, i) => (i === 0 ? 48213 : base + 37 * i));
/** The choices F157 must meet (each on one lane at least) and those it prints (A's table's). */
export const CHOICES_MET = Object.freeze(['fight', 'cover', 'freeze', 'give']), CHOICES_SEEN = Object.freeze(['blind', 'flee']);

// (stop motion entered and left while the passage is held (GO given, the first leg a hold, no send, no fall back): T's G and X in turn
// there, the review of D's finding; held at none where the instinct has its hold line (cqb.js 'cqb-hold', the lead's edit), printed before)
function holdWatch() {
  const out = { flips: 0, last: null };
  return {
    each(game) {
      const s = game.state, H = s.armoury?.range?.house;
      if (!H?.boarding || H.goAtMs === null || H.cur !== 0 || H.rooms?.[0]?.held || H.boarding.fallback || H.end) { out.last = null; return; }
      const m = s.stop?.mode === 'stop';
      if (out.last !== null && m !== out.last) out.flips++;
      out.last = m;
    },
    out,
  };
}
// (the rounds at men who could not fight, by shooter: every 'shot' fact at a live target, his protectedOf at the round's tick)
function protectedWatch(g) {
  const out = { mine: 0, others: 0 };
  return {
    each(game) {
      const s = game.state, R = s.armoury?.range;
      if (!R?.house?.boarding || typeof OPFOR.protectedOf !== 'function') return;
      for (const f of game.facts('shot')) {
        if (!f?.fired || !f.target) continue;
        const T = R.turners.find(x => x.key === f.target);
        if (!T?.live || !OPFOR.protectedOf(s, T, f.atMs ?? s.clock.ms)) continue;
        if ((f.who ?? s.player.id) === s.player.id) out.mine++; else out.others++;
      }
    },
    out,
  };
}

export default [
  {
    name: 'F153, F152, F155 (heavy): every sheet × both types × T (the boarding bot\'s and the plain houseTBot), the keys and the fuzz on 10 seeds a cell to the card: no dead end, the override 120 to 300 s on every lane, every fuzz round at a man who could not fight faulted, none by Four or a holder; T\'s stop motion entered and left in the hold printed (none where the instinct has its hold line)',
    heavy: true,
    timeoutMs: 3_600_000,
    fn() {
      const bad = [], ends = {}, rows = [];
      let lanes = 0, prot = { mine: 0, others: 0, faulted: 0 }, flips = 0;
      const holdLine = CQB_RULES.some(r => r.id === 'cqb-hold');
      for (const tier of SHEETS) for (const holdouts of TYPES) for (const bot of ['T', 'houseT', 'keys', 'fuzz']) {
        const cell = { n: 0, ends: {}, refused: 0, ms: 0, flips: 0 };
        for (const seed of seedsOf(NODEAD_SEEDS, bot === 'fuzz' ? 2100 : 1000)) {
          let r, W, Hw;
          try {
            W = protectedWatch(); Hw = holdWatch();
            r = collarLane(createGame, { tier, seed, bot, holdouts, each: (game) => { W.each(game); Hw.each(game); } });
          } catch (e) { bad.push(`${tier} ${holdouts} ${bot} ${seed}: threw ${String(e?.message ?? e).slice(0, 160)}`); continue; }
          lanes++; cell.n++;
          const B = r.game.state.armoury.range.house.boarding, mem = r.game.state.actors.list.find(a => a.who === r.game.state.player.id)?.bot ?? {};
          ends[r.end] = (ends[r.end] ?? 0) + 1; cell.ends[r.end] = (cell.ends[r.end] ?? 0) + 1; cell.refused += mem.refused ?? 0;
          if (!r.done) bad.push(`${tier} ${holdouts} ${bot} ${seed}: no card (${r.end})`);
          if (r.game.errors.length) bad.push(`${tier} ${holdouts} ${bot} ${seed}: ${r.game.errors[0]}`);
          if (!B.collar || B.collar.ms < OVERRIDE_PASS_MS || B.collar.ms > OVERRIDE_MAX_MS) bad.push(`${tier} ${holdouts} ${bot} ${seed}: the override ${B.collar?.ms}`);
          prot.mine += W.out.mine; prot.others += W.out.others; prot.faulted += (B.protected ?? []).length;
          if (bot === 'houseT') { cell.flips += Hw.out.flips; flips += Hw.out.flips; }
        }
        rows.push(`${tier} ${holdouts} ${bot}: ${cell.n} lanes, ${Object.entries(cell.ends).map(([k, v]) => `${k} ${v}`).join(', ')}${cell.refused ? `; T refused ${cell.refused}` : ''}${bot === 'houseT' ? `; stop motion in and out in the hold ${cell.flips}` : ''}`);
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      ${lanes} lanes; the ends ${Object.entries(ends).map(([k, v]) => `${k} ${v}`).join(', ')}; rounds at a man who could not fight: yours ${prot.mine} (faulted ${prot.faulted}), Four's and the holders' ${prot.others}`);
      assert(!bad.length, bad.slice(0, 8).join('\n'));
      console.log(`      the plain T in the hold: stop motion entered and left ${flips} times over its lanes (the instinct's hold line ${holdLine ? 'in: held at none' : 'not in this tree (the lead\'s cqb.js edit): printed only'})`);
      assert(prot.faulted === prot.mine && prot.others === 0, JSON.stringify(prot));
      assert(!holdLine || flips === 0, `T's G and X in turn in the hold: ${flips}`);
    },
  },
  {
    name: 'F157 (heavy): over 40 honest seeds of each type, fight, cover, freeze and give each met on at least one lane; blind and flee printed, by sheet and type',
    heavy: true,
    timeoutMs: 1_800_000,
    fn() {
      const met = {}, rows = [];
      for (const holdouts of TYPES) for (const tier of ['private', 'sgt']) {
        const by = {};
        for (const seed of seedsOf(K6_SEEDS / 2, 3000)) {
          const r = collarLane(createGame, { tier, seed, bot: 'honest', holdouts });
          for (const [k, n] of Object.entries(r.track)) { by[k] = (by[k] ?? 0) + (n > 0 ? 1 : 0); met[k] = (met[k] ?? 0) + (n > 0 ? 1 : 0); }
        }
        rows.push(`${holdouts} ${tier}: ${[...CHOICES_MET, ...CHOICES_SEEN].map(k => `${k} ${by[k] ?? 0}`).join(', ')} (lanes met; others ${Object.keys(by).filter(k => ![...CHOICES_MET, ...CHOICES_SEEN].includes(k)).map(k => `${k} ${by[k]}`).join(', ') || 'none'})`);
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      over all: ${[...CHOICES_MET, ...CHOICES_SEEN, 'crew hands'].map(k => `${k} ${met[k] ?? 0}`).join(', ')} (lanes met; a holdout's give his hands up, the crew's apart)`);
      const missing = CHOICES_MET.filter(k => !(met[k] > 0));
      assert(!missing.length, `never met: ${missing.join(', ')}`);
    },
  },
];
