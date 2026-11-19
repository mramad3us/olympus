// OLYMPUS tests: "Bang, then go"'s window, the cost of a slow stack and the held door (v0.0.26; its build sheet §1 items 2 to 4 and 8, §6 B, §8 F139, F140, F145).
//
// The window is one record and one reader (shoothouse.js breachWindow, bangWindowOf): the bang's ms, the door's, your entry and your #2's,
// each man's daze and blindness at the bang, his rifle on the door again, his fall and his give, and the track of his states and choices.
// F145 (one number): the card's WINDOW (or THE DOOR) and a line a man, the run sheet's "ON THE BANG n S" and "DOOR OPEN n S BEFORE THE
// BANG", and the hot wash's late words, each equal to bangWindowOf's figures to the tick (quick: the sergeant's bang on the held door and
// the private's quiet held door). Heavy: F139 (the bang buys the room: with the bang thrown and the entry on it, no role-player's round
// before your first and no casualty from the corporal up over 20 seeds; the recruit's and the private's rates printed, the window's edge
// by the keys, its build sheet §11 risk 2), F140 (the slow stack: the entry held 0.5, 1, 2, 3, 5 and 8 s after the bang by the kit bot's
// `late` on the held door, the share of lanes you fired first by sheet, COMBAT §25.18.2's T13 reprinted from the game, the 0.5 s cell
// 100% from the corporal up; the held man blinded by every bang through his door; the quiet held door's first round printed by sheet; room
// 1's turn and aim times printed).
import { assert } from './helpers.mjs';
import { breachLane, breachLine, BREACH_SHEETS } from './breach-lanes.mjs';
import { BANG_LATE_MS } from '../src/sim/combat/burst.js';
import { RUNG_OF_TIER } from '../src/sim/skills/templates.js';

const s2 = (ms) => (Math.max(0, ms) / 1000).toFixed(2);
const UP = BREACH_SHEETS.filter(t => (RUNG_OF_TIER[t] ?? 0) >= 2);
// (the stack's first round in the room, game ms (yours or your #2's), and the men's first)
const stackFirst = (rec) => Math.min(...Object.values(rec.yoursOf).filter(Number.isFinite), Infinity);
const theirFirst = (rec) => Math.min(...Object.values(rec.firstOf).filter(Number.isFinite), Infinity);

// (every figure the paper says of the window against bangWindowOf's, to the tick: [] when they agree)
function figuresOff(rec) {
  const W = rec.W, B = rec.sheet.breach, row = rec.sheet.rows[0]?.words ?? '', t0 = W.bangAtMs ?? W.doorAtMs, off = [];
  const want = (what, words, re, ms) => { const m = re.exec(words); if (!Number.isFinite(ms)) { if (m) off.push(`${what}: said "${m[0]}" with none`); return; } if (!m || m[1] !== s2(ms)) off.push(`${what}: "${m?.[0] ?? 'none'}" against ${s2(ms)}`); };
  if (W.bangAtMs !== null) {
    want('ON THE BANG / BANG TO ENTRY', row, /(?:ON THE BANG|BANG TO ENTRY) ([0-9.]+) S/, W.inAtMs !== null ? W.inAtMs - W.bangAtMs : NaN);
    if (W.doorAtMs !== null && W.bangAtMs - W.doorAtMs > 3000) want('DOOR OPEN', row, /DOOR OPEN ([0-9.]+) S BEFORE THE BANG/, W.bangAtMs - W.doorAtMs);
  }
  want('YOU IN AT', B.window, /YOU IN AT ([0-9.]+) S/, W.inAtMs !== null ? W.inAtMs - t0 : NaN);
  want('YOUR #2 AT', B.window, /YOUR #2 AT ([0-9.]+) S/, W.twoInAtMs !== null ? W.twoInAtMs - t0 : NaN);
  for (const M of Object.values(W.men)) {
    const line = B.men.find(x => x.startsWith(`${String(M.stand).toUpperCase()}:`)) ?? '';
    if (W.bangAtMs !== null) {
      // (v0.0.26's fixer: the card's startle is STARTLED TO, DAZED the plaque's word for the whole shock; the figure the same dazeToMs)
      want(`${M.stand} STARTLED TO`, line, /STARTLED TO ([0-9.]+) S/, M.dazeToMs !== null ? M.dazeToMs - t0 : NaN); want(`${M.stand} BLIND TO`, line, /BLIND TO ([0-9.]+) S/, M.blindToMs !== null ? M.blindToMs - t0 : NaN);
      // (the run sheet's kit mark on him at that bang, "1A BLINDED 5.00 S", the longest of the two: one quantity, one number)
      const longest = Math.max(M.dazeToMs ?? 0, M.blindToMs ?? 0);
      want(`${M.stand}'s kit mark`, row, new RegExp(`${String(M.stand).toUpperCase()} (?:BLINDED|STUNNED|STARTLED) ([0-9.]+) S`), longest > W.bangAtMs ? longest - W.bangAtMs : NaN);
    }
    want(`${M.stand} DOWN AT`, line, /DOWN AT ([0-9.]+) S/, M.downAtMs !== null ? M.downAtMs - t0 : NaN);
    want(`${M.stand} GAVE UP AT`, line, /GAVE UP AT ([0-9.]+) S/, M.gaveAtMs !== null ? M.gaveAtMs - t0 : NaN);
  }
  return off;
}

export default [
  {
    name: 'F145 (one number): the card\'s window rows, the run sheet\'s bang and door-open marks and the wash read bangWindowOf\'s figures to the tick: the sergeant\'s bang on the held door, the private\'s quiet held door by the keys, the sergeant 3 s late',
    timeoutMs: 120_000,
    fn() {
      const bad = [];
      for (const o of [{ tier: 'sgt', code: 'bang,held' }, { tier: 'private', code: 'quiet,held' }, { tier: 'sgt', code: 'bang,held', late: 3000 }]) {
        const { rec } = breachLane(o), off = figuresOff(rec);
        console.log(`      ${breachLine(rec)}`);
        console.log(`        ${rec.sheet.breach.window} | ${rec.sheet.breach.men.join(' | ')} | ${(rec.sheet.rows[0].words.match(/(ON THE BANG|BANG TO ENTRY|DOOR OPEN)[^·]*/g) ?? []).join(' · ')} | the wash: ${rec.wash.lines[0]}`);
        if (off.length) bad.push(`${o.tier} ${o.code}: ${off.join('; ')}`);
        if (o.late && !rec.wash.lines[0].includes(((rec.W.inAtMs - rec.W.bangAtMs) / 1000).toFixed(1)) && !rec.casualty) bad.push(`${o.tier} late: the wash "${rec.wash.lines[0]}"`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'F139: the bang buys the room: with the bang thrown and the entry on it, no role-player\'s round before the stack\'s first and no casualty from the corporal up over 20 seeds; the recruit\'s and the private\'s rates printed (the window\'s edge by the keys)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const bad = [], seeds = Array.from({ length: 20 }, (_, i) => 2000 + 41 * i);
      for (const tier of BREACH_SHEETS) {
        let n = 0, onBang = 0, first = 0, cas = 0;
        const dts = [];
        for (const seed of seeds) {
          const code = seed % 2 ? 'bang,held' : 'bang,loose', { rec } = breachLane({ tier, seed, code }), W = rec.W;
          if (!rec.done) bad.push(`${tier} ${seed}: not to its card`);
          if (W.bangAtMs === null || W.inAtMs === null) continue;
          n++; dts.push(W.inAtMs - W.bangAtMs);
          if (W.inAtMs - W.bangAtMs > BANG_LATE_MS) continue;
          onBang++;
          const theirs = theirFirst(rec) < stackFirst(rec);
          if (theirs) first++;
          if (rec.casualty) cas++;
          if (UP.includes(tier) && (theirs || rec.casualty)) bad.push(`${tier} ${seed} ${code}: ${theirs ? 'his round first' : ''} ${rec.casualty ? 'a casualty' : ''}`);
        }
        console.log(`      ${tier.padEnd(8)} ${n} lanes with the bang thrown, ${onBang} on it (bang to entry ${s2(Math.min(...dts))} to ${s2(Math.max(...dts))} s): his round first ${first}, a casualty ${cas}${UP.includes(tier) ? '' : ' (printed only)'}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'F140: the slow stack and the held door: the entry held 0.5 to 8 s after the bang (T13 from the game by sheet, the 0.5 s cell 100% from the corporal up); the held man blinded by every bang through his door; the quiet held door\'s first round by sheet; room 1\'s turn and aim times',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const bad = [], LATE = [500, 1000, 2000, 3000, 5000, 8000], seeds = [48213, 1000, 1037, 1074, 1111];
      let unblinded = 0, thrown = 0;
      for (const tier of BREACH_SHEETS) {
        const cells = LATE.map(late => {
          let won = 0, n = 0;
          for (const seed of seeds) {
            const { rec } = breachLane({ tier, seed, code: 'bang,held', late }), W = rec.W, held = Object.values(W.men).find(M => M.stand === '1a');
            if (W.bangAtMs === null) continue;
            n++; thrown++;
            if (held && held.blindToMs === null) unblinded++;
            if (stackFirst(rec) < theirFirst(rec) && !rec.casualty) won++;
          }
          return { late, won, n };
        });
        console.log(`      ${tier.padEnd(8)} T13 (you first, no casualty) at ${cells.map(c => `${c.late / 1000} s ${c.n ? Math.round(c.won / c.n * 100) : '-'}%`).join(' / ')}`);
        if (UP.includes(tier) && cells[0].won !== cells[0].n) bad.push(`${tier}: the 0.5 s cell ${cells[0].won} of ${cells[0].n}`);
      }
      // (the quiet held door: his first round before yours, by sheet; the loose men's turn and aim on room 1 from the door's leaf)
      for (const tier of BREACH_SHEETS) {
        let his = 0, n = 0;
        const on = [];
        for (const seed of seeds) {
          const { rec } = breachLane({ tier, seed, code: 'quiet,held' }), W = rec.W;
          n++; if (theirFirst(rec) < stackFirst(rec)) his++;
          const b = Object.values(W.men).find(M => M.stand === '1b');
          if (b?.onDoorAtMs !== null && b?.onDoorAtMs !== undefined && W.doorAtMs !== null) on.push(b.onDoorAtMs - W.doorAtMs);
        }
        console.log(`      ${tier.padEnd(8)} the quiet held door: his first round first on ${his} of ${n}; 1b (loose) on the door ${on.length ? `${s2(Math.min(...on))} to ${s2(Math.max(...on))} s after the leaf moved (the turn ${300} ms and his aim)` : 'never before your entry'}`);
      }
      console.log(`      the held man blinded by the bang through his door: ${thrown - unblinded} of ${thrown}`);
      assert(!unblinded, `the held man unblinded by a bang through his door ${unblinded} of ${thrown}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
