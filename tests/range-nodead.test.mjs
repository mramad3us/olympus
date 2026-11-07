// test-handling never dead-ends (src/sim/scenarios/handling.js; the user, 2026-11-07: "Gun system is very close, slight bug (I think ?) in the demo scenario we don't get enough mags for the whole exercise, I shoot two prone, two kneeling and when I have to shoot standing, I don't have any mags left"; DESIGN.md's log). Their own save (v0.0.5, seed 452580432, kept as tests/saves/v0.0.5-handling-nomags.json.gz: the report's "state" alone) loads and plays to the end card; their run replayed by the range bot (four fired, the magazine changed, six more) is one magazine a string's fault and sits the standing string out; a stance never taken and a rifle never shown are passed over by the tower and the coach; and a fuzz shooter of random legal steps reaches the end card on every seed within a bounded game time.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, fmt, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { rangeBot, fuzzBot } from './bots/range.mjs';
import { rangeNow, roundsLeft } from '../src/sim/scenarios/handling.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { sceneSaid } from '../src/ui/cards/tests.js';
import { COURSES } from '../src/data/courses.js';
import { checkIds } from './ids-check.mjs';
import { stepAct } from './bots/lib.mjs';
import { RULES, firedNow } from '../src/sim/skills/instinct.js';
import { withGame } from './browser.mjs';

const SAVE = path.join(root, 'tests', 'saves', 'v0.0.5-handling-nomags.json.gz');
const readSave = () => gunzipSync(readFileSync(SAVE)).toString('utf8');
const C = COURSES.fam25;
/** The fuzz runs' bound: the course's fourteen commands each waited at most moveOnMs, and the strings' play (game ms). */
export const FUZZ_BOUND_MS = 15 * 60_000;
const coachLines = (s) => s.log.filter(e => e.kind === 'say' && e.say === 'speech').map(e => e.text);

/** Play a game with a bot until the scene ends or maxTicks: { g, s, ticks, t0 }. */
function play(g, bot, maxTicks = 20 * 60 * 20) {
  const t0 = g.state.clock.ms;
  let ticks = 0;
  for (; ticks < maxTicks && !g.me().bot?.done; ticks++) g.step(1, bot);
  return { g, s: g.state, ticks, t0 };
}
// (one fuzz run: { seed, from, end, why, min, decisions, shots, sat, dry, faults })
function fuzzRun(seed, from) {
  const g = from === 'save' ? (() => { const x = createGame({ scenario: 'test-handling', seed: 452580432 }); x.load(readSave()); return x; })()
    : createGame({ scenario: 'test-handling', seed: 1000 + seed, hour: 9, setup: from === 'hot' ? 'hot' : null });
  const { s, t0, ticks } = play(g, fuzzBot({ seed }), Math.ceil(FUZZ_BOUND_MS / 50) + 20);
  const R = rangeNow(s), raw = s.armoury.range, mem = g.me().bot;
  const faults = {};
  for (const f of raw.faults) faults[f.rule] = (faults[f.rule] ?? 0) + 1;
  return { seed, from, end: R.end?.phase ?? null, why: R.end?.why ?? null, ms: s.clock.ms - t0, ticks, decisions: Object.values(mem.steps ?? {}).reduce((a, b) => a + b, 0), steps: { ...(mem.steps ?? {}) }, shots: R.summary.shots, sat: raw.sat ?? [], dry: !!raw.dry, faults, errors: g.errors.length, ids: checkIds(JSON.parse(g.save()), g.sim.domains) };
}
function fuzzTable(runs) {
  for (const r of runs) console.log(`      ${r.from} ${r.seed}: ${r.end ?? 'NO END'}${r.why ? ` (${r.why})` : ''} at +${fmt(r.ms / 60000, 1)} min, ${r.decisions} decisions, ${r.shots} shots${r.sat.length ? `, strings ${r.sat.map(k => k + 1).join(', ')} sat out` : ''}${r.dry ? ', dry' : ''}; faults ${Object.entries(r.faults).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}`);
  const ends = {};
  for (const r of runs) ends[r.end ?? 'none'] = (ends[r.end ?? 'none'] ?? 0) + 1;
  const worst = Math.max(...runs.map(r => r.ms));
  // (the dead ends hunted, as often as the dice took them: a magazine dropped on the regolith, one dumped (with rounds or
  // not), picked up again or reached from the dump, the rifle slung and the mode left, a reflex card answered or kept)
  const sum = (pred) => runs.reduce((a, r) => a + Object.entries(r.steps).filter(([k]) => pred(k)).reduce((b, [, n]) => b + n, 0), 0);
  console.log(`      the hunted: dropped ${sum(k => k === 'magOut:drop' || k === 'dropMag')}, dumped ${sum(k => k === 'magOut:dump' || k === 'dumpMag' || k === 'macro:reload:retain')}, picked up ${sum(k => k === 'reach@ground')}, reached from the dump ${sum(k => k === 'reach@dump')}, slung ${sum(k => k === 'stow')}, left the mode ${sum(k => k === 'leave')}, G again ${sum(k => k === 'G')}, reflex cards ${sum(k => k.startsWith('reflex:'))}, waits ${sum(k => k === 'wait')}`);
  console.log(`      ${runs.length} runs: ${Object.entries(ends).map(([k, n]) => `${k} ${n}`).join(', ')}; the longest +${fmt(worst / 60000, 1)} min of game time (bound ${FUZZ_BOUND_MS / 60000} min); ${runs.reduce((a, r) => a + r.decisions, 0)} decisions, ${runs.reduce((a, r) => a + r.shots, 0)} shots`);
  for (const r of runs) assert(r.end && r.ms <= FUZZ_BOUND_MS && !r.errors && !r.ids.invalid.length && !r.ids.dangling.length, JSON.stringify({ ...r, ids: { invalid: r.ids.invalid.slice(0, 3), dangling: r.ids.dangling.slice(0, 3) } }));
}

// (the puzzled player of the user's save: reach at your feet, look at it, drop it, again, by stop motion's steps, never
// pressing Wait; once the coach has found them dry, the range bot)
function puzzledBot() {
  const LOOP = ['reach@ground', 'lookMag', 'dropMag'], then = rangeBot();
  return (state, me, mem) => {
    const R = rangeNow(state);
    if (!R || R.end) { mem.done = true; return {}; }
    if (state.armoury.range.dry) return then(state, me, mem);
    mem.k ??= 0; mem.loops ??= [];
    const S = state.stop;
    if (!S) return { act: ['ready'] };
    if (S.mode !== 'stop' || S.phase !== 'choose') return {};
    const offered = stepsOf(state).filter(x => !x.off).map(x => x.id);
    for (let j = 0; j < LOOP.length; j++) {
      const id = LOOP[(mem.k + j) % LOOP.length];
      if (offered.includes(id)) { mem.k = (mem.k + j + 1) % LOOP.length; mem.loops.push(id); return { act: [stepAct(id, 'normal', null)] }; }
    }
    return {};
  };
}

export default [
  {
    name: 'the user\'s own save played as a puzzled player would (the fixer\'s, 0.0.6; DESIGN.md 2026-11-07, "Not theirs: the game should have said it"): reach at your feet, look, drop, again, never Wait; the instinct says "Nothing left to load", the coach says so before any move-on, no \'slow\' fault, and the end card',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 452580432 });
      const s0 = g.load(readSave());
      const said0 = coachLines(s0).length, faults0 = s0.armoury.range.faults.length;
      const dryLine = firedNow(s0, s0.clock.ms, RULES).find(l => l.id === 'range-reload');
      const { s, ticks, t0 } = play(g, puzzledBot());
      const R = rangeNow(s), raw = s.armoury.range, lines = coachLines(s).slice(said0), mem = g.me().bot;
      const added = raw.faults.slice(faults0).map(f => f.rule);
      console.log(`      the instinct at the load: "${dryLine ? (dryLine.rule.text[dryLine.ctx.variant] ?? dryLine.rule.text[1])[0] : '-'}" (${dryLine?.ctx.variant ?? 'none'})`);
      console.log(`      the puzzled steps before the coach's word: ${(mem.loops ?? []).join(' ')}; dry at +${fmt(((raw.dry?.atMs ?? NaN) - t0) / 1000, 1)} s`);
      console.log(`      the coach after the load: ${lines.map(l => `"${l}"`).join(' ')}; faults added: ${added.join(', ') || 'none'}; the end ${R.end?.phase ?? 'none'} after ${ticks} ticks`);
      assert(dryLine?.ctx.variant === 'dry' && raw.dry && lines.some(l => /No rounds left|Nothing left to load/.test(l)) && !added.includes('slow') && R.end?.phase === 'clear' && (mem.loops ?? []).length >= 1,
        JSON.stringify({ variant: dryLine?.ctx.variant, dry: raw.dry, lines, added, end: R.end, loops: mem.loops }));
    },
  },
  {
    name: 'the user\'s own save (v0.0.5, seed 452580432, 2026-11-07: "when I have to shoot standing, I don\'t have any mags left": fifteen fired, three empty magazines on the regolith, the tower at \'stand\') loads and the range bot plays it to the end card: the coach finds no rounds and says so, the standing string sat out and scored not fired, UNLOAD, SHOW CLEAR, "The line is clear."',
    fn() {
      const json = readSave(), old = JSON.parse(json);
      assert(old.meta.version === '0.0.5' && old.meta.seed === 452580432 && old.armoury.range.cmd.id === 'stand', 'not the user\'s save');
      const g = createGame({ scenario: 'test-handling', seed: 452580432 });
      const s0 = g.load(json);
      const left0 = roundsLeft(s0), r0 = rangeNow(s0);
      console.log(`      loaded: the tower at '${r0.cmd}' (${s0.armoury.range.next ? 'next posted' : 'waiting'}), rounds left ${left0}, the magazines ${Object.values(s0.items).filter(i => i.type === 'mag').map(m => m.n).join(', ')}, the panel ${stepsOf(s0).map(x => x.id).join(' ')}`);
      const said0 = coachLines(s0).length;
      const { s, ticks, t0 } = play(g, rangeBot());
      const R = rangeNow(s), raw = s.armoury.range;
      const lines = coachLines(s).slice(said0), line = sceneSaid(R, { clockText: () => 'hh:mm' });
      console.log(`      played on ${ticks} ticks (+${fmt((s.clock.ms - t0) / 1000, 1)} s): ${g.me().bot.log.map(l => l.step).join(' ')}`);
      console.log(`      the coach after the load: ${lines.map(l => `"${l}"`).join(' ')}`);
      console.log(`      strings ${R.strings.map((x, i) => `${i + 1}: ${x.shots} shots, ${x.score} of ${x.of}${x.sat ? ', sat out' : ''}`).join('; ')}; the end card: "${line}"`);
      assert(left0 === 0 && R.end?.phase === 'clear' && raw.dry && JSON.stringify(raw.sat) === '[2]' && R.strings[2].shots === 0 && R.strings[2].sat, JSON.stringify({ end: R.end, dry: raw.dry, sat: raw.sat }));
      assert(lines.some(l => /No rounds left|Nothing left to load/.test(l)) && lines.some(l => /not fired|counts for nothing/.test(l)) && /1 string not fired/.test(line) && !g.errors.length, JSON.stringify({ lines, line, errors: g.errors }));
    },
  },
  {
    name: 'the user\'s own save in the page (2026-11-07: "Because I can\'t shoot standing I can\'t finish the exercise and rate it"): loaded through the handle, played by the keys (the range bot deciding, each step pressed on its digit), to the end card, "1 string not fired", and on Enter to the score card',
    heavy: true,
    timeoutMs: 300_000,
    async fn() {
      const json = readSave(), H = '__olympus';
      await withGame(async (page) => {
        await page.evaluate(async ([h, json]) => { await window[h].load(json); }, [H, json]);
        await page.waitForFunction((h) => window[h].scene?.id === 'test-handling' && window[h].stop()?.mode === 'stop', H, { timeout: 20000 });
        const pressed = [];
        for (let guard = 0; guard < 60; guard++) {
          const st = await page.evaluate((h) => ({ end: !!window[h].range()?.end, phase: window[h].stop()?.phase ?? null }), H);
          if (st.end) break;
          if (st.phase !== 'choose') { await page.waitForTimeout(150); continue; }
          const want = await page.evaluate(async (h) => {
            const { rangeBot } = await import('/tests/bots/range.mjs');
            window.__kb ??= { mem: {}, bot: rangeBot() };
            const s = window[h].state, me = s.actors.list.find(a => a.id === s.player.actor), out = window.__kb.bot(s, me, window.__kb.mem);
            return out.act?.[0]?.args?.step ?? null;
          }, H);
          if (!want) { await page.waitForTimeout(150); continue; }
          let key = null;
          for (let i = 0; i < 6 && !key; i++) {
            key = await page.evaluate(([h, id]) => window[h].steps()?.slots?.find(x => x.id === id)?.key ?? null, [H, want]);
            if (!key) { await page.keyboard.press('Digit0'); await page.waitForTimeout(120); }
          }
          assert(key, `no ${want} on the panel`);
          await page.keyboard.press(`Digit${key}`); pressed.push(`${key} ${want}`);
          await page.waitForTimeout(200);
          await page.waitForFunction((h) => { const S = window[h].stop(); return !S || S.phase === 'choose' || window[h].range()?.end; }, H, { timeout: 60000 });
        }
        await page.waitForFunction((h) => window[h].scene?.ended, H, { timeout: 20000 });
        await page.waitForTimeout(300);
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('.glass.end'), null, { timeout: 15000 });
        const end = await page.evaluate(() => document.querySelector('.glass.end').innerText.split('\n').filter(Boolean).slice(0, 2).join(' | '));
        // (past the card's guard, CARD_GUARD_MS 400: Enter presses its lead, Score it)
        await page.waitForTimeout(700); await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('.glass.score'), null, { timeout: 5000 });
        console.log(`      pressed ${pressed.join(', ')}; the end card '${end}'; Enter: the score card`);
        assert(/Clear at \d\d:\d\d · 70 of 75 · 7 V · 1 string not fired · 2 faults/.test(end), end);
      }, { port: Number(process.env.OLYMPUS_TEST_PORT) || 8223, query: 'nostore=1', viewport: { width: 1600, height: 900 }, timeoutMs: 60000 });
    },
  },
  {
    name: 'their run replayed (the user, 2026-11-07: four fired in the prone string, the magazine changed, six more): the seat\'s row is marked "one magazine a string", not struck; seated, a fault \'onemag\' on the card and the coach\'s "One magazine a string. You reload on the tower\'s word." once; the standing string sat out, the course to its end card, on seeds 452580432, 48213 and 7; the coach says "You\'ve one left up the spout" before the change, and the ten-round string is remarked on, never praised ("1 string over-fired")',
    fn() {
      for (const seed of [452580432, 48213, 7]) {
        const g = createGame({ scenario: 'test-handling', seed, hour: 9 });
        const { s } = play(g, rangeBot({ early: 4 }));
        const R = rangeNow(s), raw = s.armoury.range, mem = g.me().bot, lines = coachLines(s);
        const one = lines.filter(l => /^One magazine a string\. /.test(l));
        console.log(`      seed ${seed}: the seat's row ${mem.marked ? `marked "${mem.marked}"` : 'NOT marked'}; faults ${raw.faults.map(f => f.rule).join(', ')}; the coach "${one[0]}" ×${one.length}; strings ${R.strings.map(x => `${x.shots}${x.sat ? ' (sat out)' : ''}`).join(', ')}; ${R.end?.phase}, "${sceneSaid(R, { clockText: () => 'hh:mm' })}"`);
        assert(mem.marked === 'one magazine a string' && raw.faults.filter(f => f.rule === 'onemag').length === 1 && one.length === 1, JSON.stringify({ marked: mem.marked, faults: raw.faults, one }));
        assert(R.end?.phase === 'clear' && R.strings[0].shots === 10 && JSON.stringify(raw.sat) === '[2]' && !g.errors.length, JSON.stringify({ end: R.end, strings: R.strings, sat: raw.sat }));
        // (DESIGN.md 2026-11-07: "the coach says so before the change ("You've one left up the spout. Fire it."), and a string fired
        // with more than its rounds is remarked on, never praised as normal"; the fixer's, 0.0.6)
        const spout = lines.findIndex(l => /up the spout|still one in the chamber/.test(l)), oneAt = lines.findIndex(l => /^One magazine a string\. /.test(l));
        const said0 = lines.filter(l => /rounds in a five-round string|for a string of five/.test(l)), praised = lines.some(l => /^All ten|^Ten of ten|Same again\.$/.test(l) && /ten/i.test(l));
        console.log(`        the coach before the change: "${lines[spout]}" (line ${spout}, the onemag at ${oneAt}); at CEASE FIRE: "${said0[0]}"${praised ? ' (AND PRAISED)' : ''}`);
        assert(spout >= 0 && spout < oneAt && lines.filter(l => /up the spout|still one in the chamber/.test(l)).length === 1 && said0.length === 1 && !said0[0].includes("{") && !praised && R.strings[0].over && /1 string over-fired/.test(sceneSaid(R)), JSON.stringify({ spout, oneAt, said0, praised, over: R.strings[0].over, said: sceneSaid(R) }));
      }
    },
  },
  {
    name: 'a second change in a string is a fault again but the coach says it once; the RELOAD the tower gives is never one (the user\'s rule of 2026-11-07: "One magazine a string"), and the range bot\'s course has none',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 });
      const bot = rangeBot({ early: 2 });
      // (after the first change, a second by the same singles once two more are fired)
      const second = (state, me, mem) => {
        const R = rangeNow(state);
        if (mem.early >= 3 && R.string === 0 && R.strings[0].shots >= 4 && (mem.again ?? 0) < 3 && state.stop?.phase === 'choose') {
          const want = ['magOut:dump', 'reach', 'seat'][mem.again ?? 0], st = stepsOf(state).find(x => !x.off && (want === 'reach' ? x.id.startsWith('reach@') : x.id === want));
          if (st) { mem.again = (mem.again ?? 0) + 1; return { act: [{ act: 'stop', args: { step: st.id, tempo: 'normal' } }] }; }
        }
        return bot(state, me, mem);
      };
      const { s } = play(g, second);
      const raw = s.armoury.range, one = coachLines(s).filter(l => /^One magazine a string/.test(l));
      console.log(`      two changes in the prone string: faults ${raw.faults.map(f => f.rule).join(', ')}; the coach's line ×${one.length}; the end ${raw.end?.phase}`);
      assert(raw.faults.filter(f => f.rule === 'onemag').length === 2 && one.length === 1 && raw.end?.phase === 'clear', JSON.stringify({ faults: raw.faults, one }));
      const h = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 });
      const { s: s2 } = play(h, rangeBot());
      console.log(`      the range bot's course: faults ${s2.armoury.range.faults.length}, the RELOADs on the tower's word marked ${h.me().bot.log.filter(l => l.step.startsWith('macro:reload')).length ? 'never' : '-'}`);
      assert(!s2.armoury.range.faults.length, JSON.stringify(s2.armoury.range.faults));
    },
  },
  {
    name: 'the coach clears a rifle never shown once (the fixer\'s, 0.0.6): a shooter busy with steps after his "Clear." (never still on the whole second) gets one \'slow\' fault for UNLOAD, SHOW CLEAR, never one a second',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state;
      const BUSY = ['stance:kneel', 'stance:stand'];
      let atClear = null, busy = 0;
      const bot = (state, me, mem) => {
        const R = rangeNow(state), raw = state.armoury.range;
        if (!R || R.end) { mem.done = true; return {}; }
        if (R.cmd === 'clear' && atClear === null) atClear = raw.faults.length;
        if (R.cmd !== 'clear' || (!raw.shown && raw.livedMs < 55_000)) return {};
        // (from just before his move-on and after his "Clear.": stop motion and one step after another, so the RO never sees the line still)
        const S = state.stop;
        if (!S) return { act: ['ready'] };
        if (S.mode !== 'stop' || S.phase !== 'choose') return {};
        const offered = stepsOf(state).filter(x => !x.off).map(x => x.id), id = BUSY.find(b => offered.includes(b) && b !== `stance:${me.stance ?? 'stand'}`);
        if (!id || busy > 40) return { act: [stepAct('wait', 'normal', null)] };
        busy++;
        return { act: [stepAct(id, 'normal', null)] };
      };
      play(g, bot, Math.ceil(FUZZ_BOUND_MS / 50));
      const raw = s.armoury.range, after = raw.faults.slice(atClear ?? raw.faults.length).filter(f => f.rule === 'slow');
      const clears = coachLines(s).filter(l => /^Clear/.test(l)).length;
      console.log(`      after UNLOAD, SHOW CLEAR: ${busy} steps chosen around the coach's "Clear.", ${after.length} 'slow' fault(s), "Clear." said ${clears} time(s); the end ${raw.end?.phase ?? 'none'}`);
      assert(atClear !== null && after.length === 1 && clears === 1 && busy >= 5 && raw.end?.phase === 'clear', JSON.stringify({ atClear, slow: after.length, clears, busy, end: raw.end }));
    },
  },
  {
    name: 'a stance never taken and a rifle never shown are passed over (the user\'s rule of 2026-11-07, "A scene never dead-ends"): the tower nudges at 30 s of lived time and goes on at 60 s with the coach\'s \'slow\' fault; at UNLOAD, SHOW CLEAR the coach takes the rifle, clears it and shows it himself, and the line is clear',
    fn() {
      // (a shooter who stands there: out of the mode, pressing nothing, from the brief to the end)
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), s = g.state, t0 = s.clock.ms;
      const idle = (state, me, mem) => { if (rangeNow(state)?.end) mem.done = true; return {}; };
      const { ticks } = play(g, idle, Math.ceil(FUZZ_BOUND_MS / 50));
      const R = rangeNow(s), raw = s.armoury.range, gun = s.items[s.people[s.player.id].kit.worn.sling];
      const pa = s.log.filter(e => e.kind === 'say' && e.say === 'pa').map(e => e.text);
      console.log(`      nothing pressed: ${R.end?.phase} at +${fmt((s.clock.ms - t0) / 60000, 2)} min (${ticks} ticks); faults ${raw.faults.map(f => f.rule).join(', ')}; the nudges ${pa.filter(t => /^Lane/.test(t)).length}; the coach ${coachLines(s).filter(l => /wait|Hand it|Give it/.test(l)).map(l => `"${l}"`).join(' ')}`);
      console.log(`      the rifle after: chamber ${gun.chamber ?? 'empty'}, ${gun.mag ? 'a magazine in' : 'no magazine'}, ${gun.mode ?? 'safe'}, slung ${s.people[s.player.id].kit.carry.posture}; shown ${raw.shown}`);
      // (nine commands want something of the shooter: prone, LOAD, MAKE READY, the three strings, the two stances with
      // their RELOAD, the show; the CEASE FIREs are answered by a rifle on safe, which an idle one is)
      assert(R.end?.phase === 'clear' && raw.shown && raw.faults.every(f => f.rule === 'slow') && raw.faults.length === 9 && !gun.chamber && !gun.mag && s.clock.ms - t0 <= FUZZ_BOUND_MS, JSON.stringify({ end: R.end, faults: raw.faults.length }));
      assert(pa.filter(t => /^Lane/.test(t)).length === 9 && C.moveOnMs === 60_000 && C.nudgeMs === 30_000, JSON.stringify(pa));
    },
  },
  {
    name: 'a stoppage left on the reflex card ("Nothing: stay on the card", kept) and never cleared does not hold the line (2026-11-07, "A scene never dead-ends"): waiting, the tower goes on, and at UNLOAD, SHOW CLEAR the coach clears the stoppage himself',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: 48213, hour: 9 }), bot = rangeBot();
      const stubborn = (state, me, mem) => {
        const S = state.stop;
        if (rangeNow(state)?.end) { mem.done = true; return {}; }
        if (S?.reflex && !mem.left) { mem.left = S.reflex.title; return { act: [{ act: 'stop', args: { step: 'reflex:none', tempo: 'normal', keep: true } }] }; }
        if (!mem.left) return bot(state, me, mem);
        if (S?.mode === 'stop' && S.phase === 'choose') return { act: [{ act: 'stop', args: { step: 'wait', tempo: 'normal' } }] };
        return {};
      };
      const { s } = play(g, stubborn, Math.ceil(FUZZ_BOUND_MS / 50));
      const R = rangeNow(s), raw = s.armoury.range, gun = s.items[s.people[s.player.id].kit.worn.sling];
      console.log(`      the card "${g.me().bot.left}" left with nothing; then only Wait: ${R.end?.phase}; faults ${raw.faults.map(f => f.rule).join(', ')}; the stoppage ${JSON.stringify(raw.stoppage)}; the rifle after: chamber ${gun.chamber ?? 'empty'}, jam ${gun.jam ?? 'none'}; the brass ${raw.brass.map(b => b.kind).filter(k => k !== 'case').join(', ') || 'cases only'}`);
      assert(g.me().bot.left && R.end?.phase === 'clear' && raw.shown && !gun.chamber && !gun.jam && raw.faults.some(f => f.rule === 'slow') && !g.errors.length, JSON.stringify({ end: R.end, faults: raw.faults }));
    },
  },
  {
    name: 'the fuzz shooter (random legal steps, the user\'s 2026-11-07 "A scene never dead-ends") reaches the end card on 4 quick runs: from the brief twice, from the hot line, and from the user\'s own save',
    fn() {
      fuzzTable([fuzzRun(1, 'brief'), fuzzRun(2, 'brief'), fuzzRun(3, 'hot'), fuzzRun(4, 'save')]);
    },
  },
  {
    name: 'the fuzz shooter on 20 seeds from the brief, 5 from the hot line and 5 from the user\'s own save (2026-11-07: "I can\'t finish the exercise"): every run reaches the end card within 15 minutes of game time, no lost tick, every item held once',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const runs = [];
      for (let i = 1; i <= 20; i++) runs.push(fuzzRun(i, 'brief'));
      for (let i = 21; i <= 25; i++) runs.push(fuzzRun(i, 'hot'));
      for (let i = 26; i <= 30; i++) runs.push(fuzzRun(i, 'save'));
      fuzzTable(runs);
    },
  },
];
