// The tower on test-range, "The line at 300 m" (the fixer's, after the user's play of v0.0.7 on 2026-11-07: "tower sometimes doesn't say anything but we're expected to do it ? Also did call me line 5 when I'm line 10 here. Also, got a fault for making tower wait when everyone was waiting ?"): every command you must act on said and kept readable until it is done, the point you stand on named and marked, and no 'slow' fault for the tower's or the relay's waiting.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { kdBot } from './bots/kd.mjs';
import { stepAct } from './bots/lib.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { kdNow } from '../src/sim/scenarios/range.js';
import { standingCmd, lineReady, whoOnLine, NUDGE } from '../src/sim/scenarios/handling.js';
import { lineOf, standingLine, boxLines, createRadioQueue, RADIO_H_PX } from '../src/ui/hud/radio.js';
import { RECTS } from '../src/ui/hud/layout.js';
import { SEQ, SEQ_KD } from '../src/data/courses.js';
import { KD_RANGE, RANGE_PIECES, KD_STAKE_DX_M } from '../src/data/places/range.js';
import { rangeLook } from '../src/sim/arms/look.js';
import { ownPointPixels } from '../src/render/range-items.js';
import { isHeld, TICK_MS } from '../src/core/clock.js';

// (a shooter who takes their time on a KD line: reads the flags `reads` times before each shot (1.6 s each, lived), then
// fires as the KD bot does; the reads are the step panel's own row, a careful player's)
export function readerBot(reads = 3) {
  const base = kdBot();
  return (state, me, mem) => {
    const inp = base(state, me, mem), a = inp?.act?.[0], K = kdNow(state);
    if (a && typeof a === 'object' && a.args?.step === 'fire' && K && K.line !== 25) {
      const n = `${K.strings.length}:${K.strings.at(-1)?.shots ?? 0}`;
      if (mem.rd !== n) { mem.rd = n; mem.rk = 0; }
      if (mem.rk < reads && stepsOf(state).some(x => x.id === 'read' && !x.off)) { mem.rk++; return { act: [stepAct('read')] }; }
    }
    return inp;
  };
}
// (a run to the card or to a condition: the say facts and the range facts as they came, each with the command and the tick)
function run(g, bot, { until = null, maxTicks = 20 * 60 * 40, each = null } = {}) {
  const s = g.state, said = [], faults = [], cmds = [];
  let seen = 0, ticks = 0;
  for (; ticks < maxTicks; ticks++) {
    g.step(1, bot);
    const R = s.armoury.range;
    for (; seen < g.bus.events.length; seen++) {
      const [type, d] = g.bus.events[seen];
      if (type === 'say') said.push({ atMs: s.clock.ms, kind: d.kind, who: d.who, text: d.text, cmd: R?.cmd?.id ?? null, i: R?.cmd?.i ?? null, line: R?.line ?? null });
      if (type === 'range' && d.phase === 'fault') faults.push({ rule: d.rule, cmd: d.cmd, atMs: s.clock.ms, onYouMs: R.onYouMs ?? null, livedMs: R.livedMs, hot: R.hot, string: R.string, shots: kdNow(s)?.strings?.at(-1)?.shots ?? null });
      if (type === 'range' && d.phase === 'cmd') cmds.push({ cmd: d.cmd, atMs: s.clock.ms, line: R.line ?? null });
    }
    each?.(s, ticks);
    if (kdNow(s)?.end || (until && until(s))) break;
  }
  g.clearFacts();
  return { said, faults, cmds, ticks };
}

export default [
  {
    name: 'the tower names the point you stand on: "Lane five" on the 25 m bay, "Point eleven" on the KD\'s 200 and 300 m lines where you stand on point 11 (the user, 2026-11-07: "did call me line 5 when I\'m line 10 here": the nudge named the bay\'s lane on the KD), and it comes at 30 s of the line\'s wait on you alone, the move-on at 60 s',
    fn() {
      // (seed 99 draws bay lane 5, KD point 11; a shooter who does nothing at all after the walk: the relay goes prone, you do not)
      const idle = () => ({});
      const g = createGame({ scenario: 'test-range', seed: 99, setup: 'confirm' }), s = g.state, R = s.armoury.range;
      const r = run(g, idle, { until: (st) => st.armoury.range.cmd?.id === 'optic' });
      const nudges = r.said.filter(x => x.kind === 'pa' && /, the prone position\.$/.test(x.text));
      const slow = r.faults.filter(f => f.rule === 'slow');
      console.log(`      seed 99: bay lane ${R.lane}, KD point ${R.kdLane}; at 300 m the tower: ${nudges.map(x => `"${x.text}" at ${fmt((x.atMs - r.cmds[0].atMs) / 1000, 0)} s`).join(', ')}; the move-on's 'slow' at ${slow.map(f => `${fmt((f.atMs - r.cmds[0].atMs) / 1000, 0)} s (your wait ${fmt(f.onYouMs / 1000, 0)} s)`).join(', ')}`);
      assert(R.lane === 5 && R.kdLane === 11, JSON.stringify({ lane: R.lane, kdLane: R.kdLane }));
      assert(nudges.length === 1 && nudges[0].text === 'Point eleven, the prone position.', JSON.stringify(nudges));
      assert(!r.said.some(x => /^Lane /.test(x.text)), JSON.stringify(r.said.filter(x => /^Lane /.test(x.text))));
      assert(slow.length === 1 && slow[0].cmd === 'prone' && slow[0].onYouMs >= 60_000, JSON.stringify(slow));
      // (on the bay, the zero's prone: the bay's lane, its board's number)
      const h = createGame({ scenario: 'test-range', seed: 99 });
      const b = run(h, idle, { until: (st) => st.armoury.range.cmd?.id === 'load' });
      const bay = b.said.filter(x => x.kind === 'pa' && /, the prone position\.$/.test(x.text));
      console.log(`      on the bay: ${bay.map(x => `"${x.text}"`).join(', ')}; whoOnLine there '${whoOnLine(h.state)}'`);
      assert(bay.length === 1 && bay[0].text === 'Lane five, the prone position.', JSON.stringify(bay));
    },
  },
  {
    name: 'each KD point\'s numbered stake stands on its point\'s own row, behind the shooter, and yours is marked: a brass frame round its plate and a caret over it (the user, 2026-11-07: "did call me line 5 when I\'m line 10": the stake 1.2 m south of its point sat a third of the way to the next, under the figure on 11); the 25 m bay\'s lane stakes the same, yours marked there too (the tower verifier\'s, 0.0.8)',
    fn() {
      const stakes = RANGE_PIECES.filter(p => p.kind === 'kdPoint' && !p.id.startsWith('f:kd:lane25-'));
      const off = [];
      for (const L of KD_RANGE.kd.lanes) for (const d of [200, 300, 500]) {
        const st = stakes.find(p => p.id === L.fixtures.fp[d]), P = L.points[d];
        // (read as the picture reads it, from the south at 45°: the row (z) says whose; the own row exactly, a neighbour's 5 m off)
        const rows = KD_RANGE.kd.lanes.map(M => ({ lane: M.lane, dz: Math.abs(st.z - M.points[d].fp.z) })).sort((a, b) => a.dz - b.dz);
        if (rows[0].lane !== L.lane || rows[0].dz > 0.25 || rows[1].dz < 4.5 || st.x >= P.box[0] || P.fp.x - st.x > 2.5 || st.look.text !== String(L.lane)) off.push({ id: st.id, x: st.x, z: st.z, rows: rows.slice(0, 2) });
      }
      const st11 = stakes.find(p => p.id === KD_RANGE.kd.lanes[10].fixtures.fp[200]);
      console.log(`      ${stakes.length} stakes; point 11 at 200 m: fp (${KD_RANGE.kd.lanes[10].points[200].fp.x}, ${KD_RANGE.kd.lanes[10].points[200].fp.z}), its stake (${st11.x}, ${st11.z}), ${-KD_STAKE_DX_M} m behind on its row; off their rows: ${off.length}`);
      assert(stakes.length === 60 && !off.length, JSON.stringify(off.slice(0, 4)));
      // (yours marked: rangeLook.kd.own on a KD line, its frame and caret at 16 px/m; none on the bay)
      const g = createGame({ scenario: 'test-range', seed: 99, setup: 's200' }), s = g.state;
      const own = rangeLook(s).kd.own, px = ownPointPixels(own, 16), top = Math.max(...px.filter(p => p.c !== px.at(-1).c).map(p => p.y));
      const caret = px.filter(p => p.y > top);
      const bay = rangeLook(createGame({ scenario: 'test-range', seed: 99 }).state).kd.own;
      console.log(`      on the 200 m line: own ${JSON.stringify(own)}; ${px.length} pixels at 16 px/m, ${caret.length} in the caret over the frame's top at ${fmt(top, 3)} m; on the bay: ${JSON.stringify(bay)}`);
      assert(own && own.lane === 11 && own.line === 200 && own.z === KD_RANGE.kd.lanes[10].z && Math.abs(own.x - st11.x) < 1e-9 && own.text === '11', JSON.stringify(own));
      assert(px.length >= 30 && caret.length === 9 && bay === null, JSON.stringify({ n: px.length, caret: caret.length, bay }));
      // (the bay's six: the KD's stake on its own lane's row, 2 m behind its point and outside its box, the next row 3 m off;
      // a board 1.3 m tall 0.9 m north of its row drew lane 5's "5" 60 px over your mat and lane 6's "6" 36 px under it)
      const B = KD_RANGE.bay.lanes, bayOff = [];
      for (const L of B) {
        const st = RANGE_PIECES.find(p => p.id === `f:kd:lane25-${L.lane}`);
        const rows = B.map(M => ({ lane: M.lane, dz: Math.abs(st.z - M.fp.z) })).sort((a, b) => a.dz - b.dz);
        if (st.kind !== 'kdPoint' || rows[0].lane !== L.lane || rows[0].dz > 0.01 || rows[1].dz < 2.9 || st.x >= L.box[0] || Math.abs(L.fp.x - st.x - 2) > 1e-9 || st.look.text !== String(L.lane)) bayOff.push({ id: st.id, kind: st.kind, x: st.x, z: st.z, rows: rows.slice(0, 2) });
      }
      // (yours on the bay: rangeLook.own, in test-range's zero and test-handling alike; the KD's own null there)
      const zero = createGame({ scenario: 'test-range', seed: 99 }), th = createGame({ scenario: 'test-handling', seed: 48213 });
      const o1 = rangeLook(zero.state).own, o2 = rangeLook(th.state).own, l1 = zero.state.armoury.range.lane, l2 = th.state.armoury.range.lane;
      const at = (o, l) => o && o.line === 25 && o.lane === l && o.z === B[l - 1].fp.z && o.x === B[l - 1].fp.x + KD_STAKE_DX_M && o.text === String(l);
      const onKd = rangeLook(g.state).own;
      console.log(`      the bay's stakes: ${B.map(L => { const st = RANGE_PIECES.find(p => p.id === `f:kd:lane25-${L.lane}`); return `${L.lane} at (${st.x}, ${st.z})`; }).join(', ')}; off their rows: ${bayOff.length}; yours on the zero (lane ${l1}) ${JSON.stringify(o1)}, in test-handling (lane ${l2}) ${JSON.stringify(o2)}; on the 200 m line ${JSON.stringify(onKd)}`);
      assert(!bayOff.length && at(o1, l1) && at(o2, l2) && onKd === null, JSON.stringify({ bayOff, o1, o2, onKd }));
    },
  },
  {
    name: 'the 200 m string run to its minute by a shooter who reads the flags five times a shot ends at the tower\'s "CEASE FIRE. Time." with no \'slow\' fault, on seeds 48213, 7 and 99 (the user, 2026-11-07: "got a fault for making tower wait when everyone was waiting": the move-on\'s whole seconds from a command given between two reached 60 s before the string\'s limit)',
    fn() {
      for (const seed of [48213, 7, 99]) {
        const g = createGame({ scenario: 'test-range', seed, setup: 's200' }), s = g.state;
        const r = run(g, readerBot(5), { until: (st) => st.armoury.range.cmd?.id === 'clear' });
        const str = kdNow(s).strings.find(x => x.id === 's200'), fire = r.cmds.find(c => c.cmd === 'fire'), cease = r.cmds.find(c => c.cmd === 'cease');
        const time = r.said.some(x => x.kind === 'pa' && /^(CEASE FIRE\. Time\.|Time\. CEASE FIRE\.)$/.test(x.text));
        // (the limit's words are the CEASE FIRE, said once: the verifier heard "CEASE FIRE. Time." and the sequence's "CEASE FIRE." a tick after)
        const ceases = r.said.filter(x => x.kind === 'pa' && x.atMs >= fire.atMs && /CEASE FIRE/.test(x.text));
        console.log(`      seed ${seed}: ${str.shots} shots in ${fmt((cease.atMs - fire.atMs) / 1000, 1)} s (${str.score} of ${str.of}), the limit's cease ${time ? 'said' : 'not said'}, the tower's CEASE FIRE lines: ${ceases.map(x => `"${x.text}"`).join(', ')}; faults ${JSON.stringify(r.faults.map(f => `${f.rule} at ${f.cmd}`))}`);
        assert(str.shots < 10 && time && cease.atMs - fire.atMs >= 60_000 && cease.atMs - fire.atMs <= 61_000, JSON.stringify({ shots: str.shots, time, ms: cease.atMs - fire.atMs }));
        assert(ceases.length === 1, JSON.stringify(ceases));
        assert(!r.faults.some(f => f.rule === 'slow'), JSON.stringify(r.faults));
      }
    },
  },
  {
    name: 'the confirm\'s five rounds slow fire take as long as their marks and your reads, within the tower\'s five minutes: past 60 s lived, no \'slow\' fault and no CEASE FIRE before the fifth round (it was cut at 60 s, "The line waited on you.", the string\'s last rounds never fired)',
    fn() {
      for (const seed of [48213, 7]) {
        const g = createGame({ scenario: 'test-range', seed, setup: 'confirm' }), s = g.state;
        const r = run(g, readerBot(8), { until: (st) => st.armoury.range.cmd?.id === 'clear' && st.armoury.range.stage === 'confirm' });
        const str = kdNow(s).strings.find(x => x.id === 'confirm'), fire = r.cmds.find(c => c.cmd === 'fire'), cease = r.cmds.find(c => c.cmd === 'cease');
        console.log(`      seed ${seed}: ${str.shots} shots in ${fmt((cease.atMs - fire.atMs) / 1000, 1)} s lived (${str.score} of ${str.of}); faults ${JSON.stringify(r.faults.map(f => `${f.rule} at ${f.cmd}`))}`);
        assert(str.shots === 5 && cease.atMs - fire.atMs > 60_000 && cease.atMs - fire.atMs < 300_000, JSON.stringify({ shots: str.shots, ms: cease.atMs - fire.atMs }));
        assert(!r.faults.some(f => f.rule === 'slow'), JSON.stringify(r.faults));
      }
    },
  },
  {
    name: 'you ready and the relay not (a gunner still at it for 90 s at "Optics to four power."): the tower waits on the relay, your wait on you stays 0 s, no nudge and no \'slow\' fault; let go, the line moves on',
    fn() {
      const g = createGame({ scenario: 'test-range', seed: 48213, setup: 'confirm' }), s = g.state, R = s.armoury.range;
      let heldFrom = null, maxOnYou = 0;
      const r = run(g, kdBot(), {
        until: (st) => st.armoury.range.cmd?.id === 'dope',
        each: (st) => {
          const Rr = st.armoury.range;
          if (Rr.cmd?.id !== 'optic') return;
          if (lineReady(st, 'optic', { relay: false })) heldFrom ??= st.clock.ms;
          const G = Rr.relay[0];
          // (the gunner held at it: not done, its next sub-step a second off, for 90 s from your readiness)
          if (heldFrom !== null && st.clock.ms - heldFrom < 90_000) { G.done = false; G.untilMs = st.clock.ms + 1000; }
          maxOnYou = Math.max(maxOnYou, Rr.onYouMs ?? 0);
        },
      });
      const optic = r.cmds.find(c => c.cmd === 'optic'), dope = r.cmds.find(c => c.cmd === 'dope');
      const nudges = r.said.filter(x => x.kind === 'pa' && /^(Point|Lane) /.test(x.text));
      console.log(`      "Optics to four power." to "Set your dope": ${fmt((dope.atMs - optic.atMs) / 1000, 1)} s, you ready after ${fmt((heldFrom - optic.atMs) / 1000, 1)} s; your wait on you at most ${fmt(maxOnYou / 1000, 0)} s; nudges ${nudges.length}; faults ${JSON.stringify(r.faults.map(f => f.rule))}`);
      assert(dope.atMs - optic.atMs >= 90_000 && maxOnYou === 0 && !nudges.length && !r.faults.length, JSON.stringify({ ms: dope.atMs - optic.atMs, maxOnYou, nudges, faults: r.faults }));
    },
  },
  {
    name: 'a standing command shortened beside a voice that wraps keeps its terms: its rounds, its time, its line ("Ten rounds rapid, sixty seconds. Commence fire.", "Five rounds slow, five minutes. Commence fire.", "Sitting, five rounds. LOAD."), never the nudge\'s bare "Commence fire." (the verifier\'s, seed 48213 at 1600 × 900: the full command never drawn at either line, "five minutes" and "sixty seconds" lost)',
    fn() {
      const TERMS = ['three', 'five', 'ten', 'sixty', 'rounds', 'seconds', 'minutes', 'hundred'];
      const rows = [], bad = [];
      for (const [name, seq] of [['fam25', SEQ], ['kd', SEQ_KD]]) for (const def of seq) {
        if (['always', 'never', 'zeroRead', 'arrived'].includes(def.ready)) continue;
        const short = def.short ?? NUDGE[def.id], said = def.say.join(' ').toLowerCase();
        const lost = TERMS.filter(t => new RegExp(`\\b${t}\\b`).test(said) && !new RegExp(`\\b${t}\\b`, 'i').test(short));
        if (def.short) rows.push(`${name} ${def.id}${def.string ? ` (${def.string})` : ''}: "${def.short}"`);
        if (lost.length) bad.push({ course: name, id: def.id, short, lost });
      }
      for (let k = 0; k < rows.length; k += 3) console.log(`      ${rows.slice(k, k + 3).join('; ')}`);
      assert(!bad.length, JSON.stringify(bad));
      // (the standing command gives it, as the box shows it: the 200 m string on seed 48213)
      const g = createGame({ scenario: 'test-range', seed: 48213, setup: 's200' });
      run(g, kdBot(), { until: (st) => st.armoury.range.cmd?.id === 'fire' && !!standingCmd(st) });
      const c = standingCmd(g.state);
      console.log(`      seed 48213 at 200 m: "${c.text}" stands, short "${c.short}"`);
      assert(/ten rounds/i.test(c.short) && /sixty seconds/.test(c.short) && /Commence fire\.$/.test(c.short), JSON.stringify(c));
    },
  },
  {
    name: 'every tower command you must act on is said on the PA and stands in the radio box from its word until your readiness meets it, over the whole course on seeds 48213, 7 and 99 and the 200 m string read slowly: never pushed out by the coach\'s lines (v0.0.7\'s box of two lost "Set your dope" under the coach\'s dope and wind call the same tick), the box in the order said with the newest under and none of the tower\'s earlier commands left in it (the verifier\'s: a stale "LOAD." under "MAKE READY."), and never a command not said',
    fn() {
      const box = RECTS.RADIO.h;
      assert(box === RADIO_H_PX && box >= 57, `the box ${box} px: a voice of two rows (35.25) and a standing row (19.6) and the gap (2) at --ui 1`);
      const audit = {};
      for (const [seed, setup, bot] of [[48213, null, kdBot()], [7, null, kdBot()], [99, null, kdBot()], [99, 's200', readerBot(5)]]) {
        const g = createGame({ scenario: 'test-range', seed, setup }), s = g.state;
        const q = createRadioQueue(), q2 = createRadioQueue();
        let lostOld = 0, standTicks = 0, stale = 0, bad = [];
        // (the say facts as the page takes them, in the tick that says them, with its clock: main.js's bus.on('say'))
        g.bus.on('say', (d) => {
          q.push(lineOf(d, s)); q2.push(lineOf(d, s));
          const R = s.armoury.range, Ri = R?.cmd?.i, D = SEQ_KD[Ri];
          if (d.kind === 'pa' && (D?.say.includes(d.text) || d.text === R?.cmd?.text)) (audit[`${Ri} ${D.id}`] ??= { said: 0, stood: 0, lostOld: 0 }).said++;
        });
        run(g, bot, {
          each: (st) => {
            q.frame(TICK_MS / 1000, !isHeld(st) && !st.skip); q2.frame(TICK_MS / 1000, !isHeld(st) && !st.skip);
            const c = standingCmd(st), R = st.armoury.range;
            if (!R?.cmd) return;
            const def = SEQ_KD[R.cmd.i], a = (audit[`${R.cmd.i} ${def.id}`] ??= { said: 0, stood: 0, lostOld: 0 });
            if (!c) return;
            standTicks++; a.stood++;
            const line = standingLine(st), lines = boxLines(q.lines, line);
            if (!q.lines.some(l => l.kind === 'pa' && l.text === c.text)) { lostOld++; a.lostOld++; }
            // (the old order, the command on top: a tower line said before it left under it)
            const was = [line, ...q2.lines.filter(l => !(l.kind === 'pa' && l.text === line.text))];
            if (was.slice(1).some(l => l.kind === 'pa' && l.atMs < c.atMs)) stale++;
            const ordered = lines.every((l, k) => !k || (lines[k - 1].atMs ?? -Infinity) <= (l.atMs ?? -Infinity));
            if (lines.filter(l => l === line).length !== 1 || line.text !== c.text || !/^◉ TOWER · /.test(line.head) || lines.filter(l => l.text === c.text).length !== 1
              || lines.some(l => l !== line && l.kind === 'pa' && l.atMs < c.atMs) || !ordered) bad.push({ cmd: def.id, lines: lines.map(l => [l.atMs, l.text]) });
          },
        });
        console.log(`      seed ${seed}${setup ? ` (${setup}, the slow reader)` : ''}: ${standTicks} ticks with a command standing; the old box of two had lost the tower's words on ${lostOld} of them; the command on top would have left an earlier tower line under it on ${stale}; the new box: ${bad.length ? `${bad.length} wrong` : 'the command in its place, in the order said, no earlier command, on every one'}`);
        assert(!bad.length, JSON.stringify(bad.slice(0, 3)));
      }
      // (the course command by command over the four runs: every one that stood was said on the PA)
      const rows = Object.entries(audit).sort((a, b) => Number(a[0].split(' ')[0]) - Number(b[0].split(' ')[0]));
      console.log(`      the course, command by command (said on the PA · ticks it stood · of them, lost by the old box of two):`);
      for (let k = 0; k < rows.length; k += 6) console.log(`        ${rows.slice(k, k + 6).map(([c, a]) => `${c} ${a.said}·${a.stood}·${a.lostOld}`).join(', ')}`);
      const unsaid = rows.filter(([, a]) => a.stood && !a.said);
      assert(!unsaid.length, JSON.stringify(unsaid));
    },
  },
];
