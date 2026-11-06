// The DI on the range (src/sim/skills/instinct/range.js, instinct.js; SKILLS §14, the build sheet 0.0.5 §2.2, §8 item 10): a shooter who only follows T, the line second by second.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { stepAct } from './bots/lib.mjs';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { startBody } from '../src/sim/body/body.js';
import { deltaOf } from '../src/sim/body/record.js';
import { setLedgers } from '../src/sim/scenarios/tests.js';
import { SITES } from '../src/data/setting/calendar.js';

/**
 * A shooter who presses only T (the line's act, as the hud sends it) and, on a reflex card, "Nothing": the DI then
 * says what to do; and where the DI says "Press." (the range-fire line, which T never acts on: the shot is always
 * the player's own digit, the design review's), Fire held, the one key T leaves to them.
 */
export function tBot() {
  return (state, me, mem) => {
    const S = state.stop, I = instinctNow(state), L = I.line;
    if (state.armoury.range?.end) { mem.done = true; return {}; }
    if (S?.reflex) return { act: [stepAct('reflex:none')] };
    if (L?.id === 'range-fire' && !L.act && S?.phase === 'choose' && !S.doing && mem.lastAt !== state.clock.ms) { mem.lastAt = state.clock.ms; (mem.fires ??= []).push(state.clock.ms); return { act: [stepAct('fire', 'careful')] }; }
    if (!L?.act || (mem.lastAt === state.clock.ms)) return {};
    mem.lastAt = state.clock.ms;
    (mem.ts ??= []).push({ atMs: state.clock.ms, id: L.id, act: L.act });
    return { act: [{ act: 'instinct', args: { id: L.id, act: L.act } }] };
  };
}

export default [
  {
    name: 'a shooter who only presses T, and Fire held where the DI says to press (T never takes the shot), clears the line on seed 48213 with no fault: one line and one chip at most, T doing only the act shown and never a command before the tower\'s; the base needs below urgent and the calm situation silent on the line; the felt stoppage\'s line before the look, the double\'s after',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state, pid = s.player.id, p = s.people[pid];
      p.body = deltaOf(setLedgers(startBody(p, s.clock.ms, SITES.melas.lonEDeg, s.meta.seed), { bladderMl: 420 }));   // (a bladder past 'need': the base's warning, kept quiet on the line)
      const bot = tBot(), seen = [], ids = new Set();
      let last = '', n = 0, maxLines = 0;
      for (; n < 20 * 400 && !g.me().bot?.done; n++) {
        g.step(1, bot);
        const I = s.$instinct ?? {}, L = I.line, C = I.chip;
        maxLines = Math.max(maxLines, (L ? 1 : 0) + (C ? 1 : 0));
        if (L && !s.armoury.range.end) ids.add(L.id);
        const t = L ? `${I.lead ? '(still) ' : ''}[${L.tone}] ${L.text}${L.act ? ` {T ${L.act}}` : ''}${C ? ` · chip ${C.short}` : ''}` : '';
        if (t && t !== last && (s.clock.ms % 1000 === 0 || s.stop?.phase === 'choose')) { seen.push(`${((s.clock.ms - s.meta.createdMs) / 1000).toFixed(2).padStart(6)} ${s.armoury.range.cmd?.id?.padEnd(6) ?? ''} ${t}`); last = t; }
      }
      for (const l of seen) console.log(`      ${l}`);
      const R = s.armoury.range, faults = R.faults.map(f => f.rule);
      const T = g.me().bot.ts ?? [];
      console.log(`      ${n} ticks; ended ${R.end?.phase ?? 'NOT'} with ${faults.length} faults [${faults.join(', ')}]; T pressed ${T.length} times, Fire held ${g.me().bot.fires?.length ?? 0} times (never T's); the lines' rules while the line was open: ${[...ids].join(', ')}; after it: "${s.$instinct?.line?.text ?? ''}" (${s.$instinct?.line?.id ?? 'none'})`);
      assert(R.end?.phase === 'clear' && !faults.length, JSON.stringify({ end: R.end, faults }));
      assert(maxLines <= 2 && !ids.has('need-bladder') && !ids.has('situation'), JSON.stringify([...ids]));
      const stop = seen.filter(l => l.includes('Tap, rack') || l.includes('Look at') || l.includes('Double') || l.includes('Lock'));
      const iFelt = seen.findIndex(l => /Tap, rack|Immediate action|A stoppage|It stopped/.test(l)), iDouble = seen.findIndex(l => /Double feed|double|Lock it back|Two rounds/.test(l));
      console.log(`      the stoppage's lines: ${stop.map(l => l.trim().slice(14, 70)).join(' | ')}`);
      assert(iFelt >= 0 && iDouble > iFelt, JSON.stringify({ iFelt, iDouble }));
    },
  },
  {
    name: 'T sent for a line not shown, or with another act, does nothing; T with no line seen does nothing; under the stop the line leads "Time stands still."',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 7, hour: 9 }), s = g.state;
      g.step(20 * 6);
      const t0 = s.clock.ms, stop0 = s.stop;
      g.step(1, { act: [{ act: 'instinct', args: { id: 'range-cmd', act: 'stop:macro:ready' } }] });
      g.step(1, { act: [{ act: 'instinct', args: { id: null } }] });
      assert(s.stop === stop0 && !s.armoury.range.faults.length, 'a T not shown did something');
      g.step(1, { act: ['ready'] });
      for (let k = 0; k < 40 && s.stop?.phase !== 'choose'; k++) g.step(1);
      const I = instinctNow(s);
      console.log(`      T for MAKE READY during "${s.armoury.range.cmd.id}": nothing (${s.clock.ms - t0} ms on); in the mode: "${I.lead} ${I.line?.text}" (${I.line?.id}, T ${I.line?.act})`);
      assert(I.lead === 'Time stands still.' && I.line, JSON.stringify(I));
    },
  },
];
