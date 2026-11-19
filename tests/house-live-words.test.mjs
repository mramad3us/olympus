// OLYMPUS tests: the live lane's words end with the lane (the build sheet v0.0.22 items 2 and 3, FL22-2 and FL22-3): paint called once a man's strikes have landed, never "Keep working." over a fatal one; no dummy praise after the cease fire; "Weapons clear." where nobody cleared the lane; your #2 says "Man down!" and calls nothing over you.
//
// Each lane is tests/flawless-end.mjs endLane (test-shoothouse with &opfor=live from the fill to the card, its words watched). Before
// v0.0.22, on the feel lens's 56 casualty lanes (.run/v022-design/feel.md §0): "Keep working." 0.35 s (median) before the fatal strike
// on 52, the dummy praised after the cease fire on 13, "The lane is clear." on 56 of 56, your #2's "Clear!" between your "I'm hit!" and
// the cease fire on 14 and his "Man down!" on none. Each case fails without its hunk (shoothouse.js liveTick's held paint, houseAfterStep's
// end, houseCmdSay, casualtyTick's "Man down!", houseActors' casualty hold).
import { assert } from './helpers.mjs';
import { endLane, endGaugeOf } from './flawless-end.mjs';
import { PAINT_CALL_MS } from '../src/sim/scenarios/shoothouse.js';
import { SEQ_HOUSE } from '../src/data/courses.js';
import { TICK_MS } from '../src/core/clock.js';

const WASH = SEQ_HOUSE.find(c => c.id === 'wash');
const s2 = (ms) => (Number.isFinite(ms) ? (ms / 1000).toFixed(2) : '-');
// (one lane's words line, and what is wrong with it)
function wordsOf(r) {
  const casualty = r.end === 'casualty', bad = [];
  if (r.keepWorking.length) bad.push(`"Keep working." ${r.keepWorking.join(', ')} ms before the cease fire`);
  for (const a of r.after) bad.push(`${a.what} after the end`);
  if (casualty && !WASH.sayEnd.other.includes(r.wash)) bad.push(`the wash said "${r.wash}"`);
  if (!casualty && r.end === 'clear' && !WASH.say.includes(r.wash)) bad.push(`the wash said "${r.wash}" on a lane cleared`);
  if (r.twoInCasualty.length) bad.push(`his ${r.twoInCasualty.map(x => x.text).join(' ')} in the casualty`);
  const down = r.manDown.filter(m => r.casualty && m.who !== r.casualty.who).length;
  if (casualty && down !== 1) bad.push(`"Man down!" from the other marine ${down} times`);
  return { bad, line: `${r.cell}: ${r.done ? r.end : 'NOT to the card'}; wash "${r.wash}"; paint calls ${r.paintSaid.length}${r.cease !== null ? `, the cease fire at ${s2(r.cease - r.goAtMs)} s` : ''}; "Man down!" ${r.manDown.map(m => m.who).join(', ') || 'none'}${bad.length ? `; WRONG: ${bad.join('; ')}` : ''}` };
}

export default [
  {
    name: 'the live lane\'s words end with it: the sergeant by T on 48213 (live:fight,hide) and the private by the keys on 2, live at GO, each a casualty, hear no "Keep working." in the 2.5 s before the cease fire, no dummy line after it, "Weapons clear. …" for the wash (never "The lane is clear."), your #2\'s "Man down!" once and no "Clear!" or "Up." of his before the cease fire (before: the paint said 0.35 s ahead of the fatal strike, "My dummy. Cleared. Good." after "CEASE FIRE!", "The lane is clear.", his "Clear!" over you, no "Man down!")',
    fn() {
      const recs = [endLane({ tier: 'sgt', seed: 48213, bot: 'T', opfor: 'live:fight,hide', setup: 'go' }), endLane({ tier: 'private', seed: 2, bot: 'keys', opfor: 'live', setup: 'go' })];
      const bad = [];
      for (const r of recs) { const w = wordsOf(r); console.log(`      ${w.line}`); if (!r.done || r.end !== 'casualty') bad.push(`${r.cell} ended ${r.end}`); bad.push(...w.bad.map(b => `${r.cell}: ${b}`)); }
      assert(!bad.length, bad.join(' | '));
    },
  },
  {
    name: 'a single strike that is not fatal is still called: "Keep working." once, PAINT_CALL_MS (600 ms) after it lands, the sergeant by T on seed 3, live at GO (the paint held, never dropped; v0.0.21 said it on the strike\'s tick)',
    fn() {
      const r = endLane({ tier: 'sgt', seed: 3, bot: 'T', opfor: 'live', setup: 'go' });
      // (each call against the strike it calls: the last before it; the words may wait on a take-in's window, chiefSays' owed lines)
      const calls = r.paintSaid.map(p => { const x = r.strikes.filter(s => s.atMs <= p.atMs).at(-1) ?? null; return { p, x, gap: x ? p.atMs - x.atMs : null }; });
      console.log(`      ${wordsOf(r).line}; strikes ${r.strikes.map(s => `${s.who} ${s2(s.atMs - r.goAtMs)} s`).join(', ') || 'none'}; calls ${calls.map(c => `"${c.p.text}" ${s2(c.p.atMs - r.goAtMs)} s, ${c.gap ?? '-'} ms after the strike (PAINT_CALL_MS ${PAINT_CALL_MS})`).join('; ')}`);
      assert(r.done && r.end === 'clear' && r.strikes.length === 1 && calls.length === 1 && calls[0].gap >= PAINT_CALL_MS && calls[0].gap <= PAINT_CALL_MS + 2 * TICK_MS, JSON.stringify({ end: r.end, strikes: r.strikes, calls: calls.map(c => [c.p.atMs, c.gap]) }));
    },
  },
  {
    name: 'the live lane\'s words over 8 seeds × the six sheets × the keys and T (heavy): on every casualty lane no "Keep working." in the 2.5 s before the cease fire, no lane word after the end, "Weapons clear." for the wash and the other marine\'s "Man down!" once; on every lane none of his calls over a marine down (the feel lens\'s 56 casualty lanes before: 52, 13, 56 and 0)',
    heavy: true,
    timeoutMs: 900_000,
    fn() {
      const recs = [];
      for (const tier of ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']) for (const bot of ['keys', 'T']) for (const seed of [48213, 1, 2, 3, 4, 5, 6, 7]) recs.push(endLane({ tier, seed, bot, opfor: 'live' }));
      const cas = recs.filter(r => r.end === 'casualty'), bad = recs.flatMap(r => wordsOf(r).bad.map(b => `${r.cell}: ${b}`));
      const g = endGaugeOf(recs);
      console.log(`      ${recs.length} lanes, ${cas.length} casualties, ${recs.filter(r => !r.done).length} not to the card; "Keep working." before a cease fire ${cas.filter(r => r.keepWorking.length).length}; dummy after the end ${recs.filter(r => r.after.some(a => a.what === 'dummy')).length}; "The lane is clear." on a casualty lane ${cas.filter(r => WASH.say.includes(r.wash)).length}; his calls in the casualty ${recs.filter(r => r.twoInCasualty.length).length}; "Man down!" once ${cas.filter(r => r.manDown.filter(m => m.who !== r.casualty.who).length === 1).length} of ${cas.length}`);
      console.log(`      F82 over them: ${g.met ? 'MET' : 'OPEN'}, ${g.value}`);
      // (the fuzz, printed only (the B and C review of 2026-11-16: its "Keep working." before a cease fire made visible; one on the
      // private's 7 before the paint waited for the man's next pair))
      const fuzz = [];
      for (const tier of ['recruit', 'private', 'sgt', 'tierone']) for (const seed of [48213, 1, 2, 3, 4, 5, 6, 7]) fuzz.push(endLane({ tier, seed, bot: 'fuzz', opfor: 'live' }));
      const gf = endGaugeOf(fuzz, { printOnly: true });
      console.log(`      the fuzz (printed): ${gf.value}`);
      for (const b of gf.bad.slice(0, 6)) console.log(`        ${b}`);
      for (const b of [...bad, ...g.bad].slice(0, 12)) console.log(`        ${b}`);
      assert(!bad.length && recs.every(r => r.done) && g.met, [...bad, ...g.bad].slice(0, 12).join(' | '));
    },
  },
];
