// The instinct (SKILLS §14; the build sheet 0.0.4 §2.2.8; tradecraft's settle() ported): SKILLS's
// scripted morning (woken by reveille in the rack, up, the head, the basin) and then the drill (the
// klaxon, up, utilities, the count), the line and the chip printed second by second. Holds: at most
// one line and one chip; no line goes in under 3 s but for an urgent one or its own act done; no line
// back within 60 s of going but at a higher tone; T acts only while its rule fires with that act;
// silence in a splash; while time stands still, urgent lines only.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { cancel } from '../src/core/queue.js';
import { NIGHT_SRC } from '../src/sim/time/pod.js';
import { settle, instinctNow, firedNow, RANK, LINE_MIN_MS, REPEAT_MS } from '../src/sim/skills/instinct.js';
import { BASE_RULES } from '../src/sim/skills/instinct/base.js';
import { goTo, plan, runBot } from './bots/lib.mjs';
import { hand, instinctT, until, heedLine, pause } from './bots/routine.mjs';
import { marsClock } from '../src/core/calendar.js';
import { SITES } from '../src/data/setting/calendar.js';
import { TICK_MS } from '../src/core/clock.js';

const SEED = 48213, LON = SITES.melas.lonEDeg;
const hm = (ms) => { const c = marsClock(ms, LON); return `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}:${String(c.second).padStart(2, '0')}`; };

// (a monitor of the instinct tick by tick: its lines, their spans, the rules broken)
function monitor(g) {
  const m = { log: [], spans: [], broken: [], last: null, lastChip: null, gone: new Map(), splashLines: 0, heldLines: 0, ticks: 0 };
  m.tick = () => {
    const s = g.state, it = instinctNow(s), ms = s.clock.ms, line = it.line;
    m.ticks++;
    if (s.skip && line) m.splashLines++;
    const prevId = m.last?.id ?? null, id = line?.id ?? null;
    if (prevId !== id) {
      if (m.last) {
        const shown = ms - m.last.since, firesNow = firedNow(s, ms).some(l => l.id === m.last.id);
        m.spans.push({ id: m.last.id, tone: m.last.tone, ms: shown });
        // (under the minimum: only an urgent one replaces it, or it went because its rule stopped (its act done))
        if (shown < LINE_MIN_MS && firesNow && line?.tone !== 'urgent' && !s.skip && !m.last.skipped) m.broken.push(`${m.last.id} gone after ${shown} ms for ${id}`);
        if (!firesNow) m.gone.set(m.last.id, { ms, tone: m.last.tone });
      }
      if (line) {
        const g0 = m.gone.get(id);
        if (g0 && ms - g0.ms < REPEAT_MS && RANK[line.tone] <= RANK[g0.tone]) m.broken.push(`${id} back after ${ms - g0.ms} ms`);
        m.log.push(`${hm(ms)} ${line.tone.padEnd(6)} ${id}: "${line.text}"${line.act ? ` [T ${line.act}]` : ''}${it.chip ? ` · chip ${it.chip.short}${it.chip.act ? ` [T held ${it.chip.act}]` : ''}` : ''}`);
      } else if (prevId && !s.skip) m.log.push(`${hm(ms)} (no line)`);
      m.last = line ? { id, tone: line.tone, since: ms, skipped: false } : null;
    }
    if (s.skip && m.last) m.last.skipped = true;
  };
  return m;
}
const stepWatch = (g, m, n, input = {}) => { for (let i = 0; i < n; i++) { g.step(1, input); m.tick(); } };

export default [
  {
    name: 'settle(): the line up stays while its rule fires and nothing more pressing does; a more pressing one waits out LINE_MIN_MS unless urgent; a gone line waits REPEAT_MS unless its tone rose; the chip is the next keyless line',
    fn() {
      const L = (id, tone, more = {}) => ({ id, tone, act: null, short: id, reach: null, ...more });
      let st = settle(null, [L('a', 'note'), L('b', 'note')], 0);
      assert(st.line.id === 'a' && st.chip.id === 'b' && st.queued === 0, JSON.stringify(st));
      st = settle(st, [L('c', 'warn'), L('a', 'note')], 1000);
      assert(st.line.id === 'a', `a warn replaced a note after 1 s: ${st.line.id}`);
      st = settle(st, [L('c', 'warn'), L('a', 'note')], 3000);
      assert(st.line.id === 'c' && st.line.ms === 3000 && st.chip.id === 'a', `after 3 s the warn: ${JSON.stringify(st.line)}`);
      st = settle(st, [L('u', 'urgent'), L('c', 'warn')], 3500);
      assert(st.line.id === 'u', 'an urgent line at once');
      st = settle(st, [L('c', 'warn')], 4000);
      assert(st.line.id === 'c' && st.gone.u, 'the urgent one gone');
      st = settle(st, [L('u', 'urgent'), L('c', 'warn')], 20000);
      assert(st.line.id === 'c', `u back within ${REPEAT_MS} ms: ${st.line.id}`);
      st = settle(st, [L('u', 'urgent'), L('c', 'warn')], 4000 + REPEAT_MS);
      assert(st.line.id === 'u', 'u back after the repeat time');
      const many = settle(null, [L('a', 'warn'), L('b', 'note'), L('c', 'note'), L('d', 'calm', { reach: 'ack' })], 0);
      assert(many.line.id === 'a' && many.chip.id === 'b' && many.queued === 1 && many.keys.join() === 'B', JSON.stringify(many));
      console.log(`      a note held against a warn for ${LINE_MIN_MS} ms, an urgent at once, a gone line kept out ${REPEAT_MS / 1000} s; chip ${many.chip.id}, queued ${many.queued}, keys ${many.keys.join()}`);
      console.log(`      the DI's rules: ${BASE_RULES.map(r => `${r.id} (${r.tone})`).join(', ')}`);
    },
  },
  {
    name: 'SKILLS\'s scripted morning: woken by reveille in the rack ("Awake. On your feet."), up by T, then each need the DI names heeded where it says (the head across the hall, the basin) and done by T there; the line and the chip second by second, none under 3 s but an urgent one or its act done, none back within 60 s, silence in a splash',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 23 });
      // (a quiet night: the career's first drill, drawn onto its first two nights, taken out of this one's queue)
      cancel(g.state, NIGHT_SRC, ev => ev.kind === 'alert');
      const m = monitor(g);
      stepWatch(g, m, 20);
      // (R at the rack: sleep until reveille)
      g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] }); m.tick();
      const woke = instinctNow(g.state).line;
      stepWatch(g, m, 20 * 4);
      const bot = plan([
        until(s => instinctNow(s).line?.act === 'rise', 20_000, 'the woke line'), instinctT(), until(s => !(g.me().trans && s.clock.ms < g.me().trans.fromMs + g.me().trans.ms), 10_000, 'up'),
        until(s => !!instinctNow(s).line, 5_000, 'a line'), heedLine(), pause(4_000), heedLine(), pause(4_000), heedLine(),
      ]);
      let ticks = 0;
      const status = () => g.me()?.bot?.plan?.status ?? 'running';
      while (ticks < 20 * 60 * 20 && status() === 'running') { g.step(1, bot); m.tick(); ticks++; }
      const P = g.me().bot.plan;
      for (const l of m.log) console.log(`      ${l}`);
      console.log(`      ${m.ticks} ticks watched; lines shown ${m.spans.length}, the shortest ${Math.min(...m.spans.filter(x => !x.skipped).map(x => x.ms))} ms; ${m.splashLines} ticks with a line in a splash; broken: ${m.broken.length ? m.broken.join('; ') : 'none'}`);
      assert(P.status === 'done', `the morning: ${P.why} ${JSON.stringify(P.log.at(-1))}`);
      assert(woke === null || !g.state.skip, 'a line while the sleep skipped');
      assert(!m.broken.length && m.splashLines === 0, m.broken.join('; '));
      const done = g.facts('activity').filter(f => f.phase === 'end' && f.activity !== 'sleep').map(f => f.activity);
      console.log(`      heeded by T where the line sent the player: ${done.join(', ') || 'nothing'}`);
      assert(m.log.some(l => /woke/.test(l)) && m.log.some(l => /need-|stubble/.test(l)) && done.length >= 1, `the morning's lines, and ${done.length} heeded`);
    },
  },
  {
    name: 'the drill: the klaxon\'s urgent line on landing, T rises you, T dresses you at your rack, the line gone once you stand mustered; T for a rule that does not fire, or with another act, does nothing; while time stands still only urgent lines',
    fn() {
      const g = createGame({ scenario: 'test-night', seed: SEED });
      const m = monitor(g), s = g.state;
      g.step(1, { act: [{ act: 'hand', args: { want: 'activity' } }] }); m.tick();
      stepWatch(g, m, 2);
      const first = instinctNow(s).line;
      // (T for another rule, or the right rule with another act: nothing)
      const before = JSON.stringify(g.me());
      const fired = firedNow(s, s.clock.ms).map(l => l.id);
      g.step(1, { act: [{ act: 'instinct', args: { id: 'need-thirst', act: 'activity:drink' } }] }); m.tick();
      g.step(1, { act: [{ act: 'instinct', args: { id: 'woke', act: 'rise' } }] }); m.tick();
      g.step(1, { act: [{ act: 'instinct', args: { id: 'alarm', act: 'dress:utilities' } }] }); m.tick();
      const untouched = JSON.stringify(g.me()) === before && !s.time.doing && !s.skip;
      const bot = plan([instinctT(), until(st => instinctNow(st).line?.act === 'dress:utilities', 20_000, 'up'), instinctT(), until(st => (st.time.attend ?? []).length > 0, 10 * 60_000, 'mustered')]);
      let ticks = 0;
      while (ticks < 20 * 60 * 12 && (g.me()?.bot?.plan?.status ?? 'running') === 'running') { g.step(1, bot); m.tick(); ticks++; }
      stepWatch(g, m, 20 * 3);
      const after = instinctNow(s).line;
      // (time standing still: only urgent lines)
      g.step(1, { act: ['ready'] }); stepWatch(g, m, 25);
      const held = instinctNow(s).line;
      g.step(1, { act: ['digit:1'] });
      for (const l of m.log) console.log(`      ${l}`);
      console.log(`      landed: ${first?.tone} ${first?.id} [T ${first?.act}] (firing: ${fired.join(', ')}); a T for 'need-thirst' and 'woke' (not firing) and one for 'alarm' with another act changed nothing: ${untouched}; mustered ${JSON.stringify(s.time.attend.at(-1))}; then ${after ? after.id : 'no'} line; held: ${held ? held.id : 'none'} (urgent only)`);
      assert(first?.id === 'alarm' && first.tone === 'urgent' && first.act === 'rise' && untouched, JSON.stringify(first));
      assert(g.me().bot.plan.status === 'done' && s.time.attend.at(-1)?.class === 'on-time' && after?.id !== 'alarm', JSON.stringify(g.me().bot.plan));
      assert(!held || held.tone === 'urgent', JSON.stringify(held));
      assert(!m.broken.length && m.splashLines === 0, m.broken.join('; '));
    },
  },
];
