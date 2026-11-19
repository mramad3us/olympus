// "Anchor before you fire" says what to press (v0.0.25's carried round): the user's report of 2026-11-19 playing v0.0.24's course,
// "instructions from the intructor tell you stuff like "push to north station", I don't know what is meant, translate what I have to
// do for the 0G shooting training". The cadre's words name the keys by their labels (core/keys.js, never a letter written in the
// data) and the panel's rows by theirs (arms/shooting.js LABELS); the brief is followed by the three ideas (the push-off, the drift
// and the grab, fire only from what holds you); every row a command names is one the panel offers on the way, its first at the
// command's tick; the DI's line names the next step, its row offered at that tick; the station's ring and its line to the turner are on
// the stage while its command stands; and the station's rows lead the panel. Each fails without its part of the fix.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { anchorsBot } from './bots/void.mjs';
import { anchorsNow, anchorsLook, sayKeys, STATIONS } from '../src/sim/scenarios/anchors.js';
import { VOID_CADRE, VOID_STEP } from '../src/data/courses.js';
import { label, bindingOf } from '../src/core/keys.js';
import { LABELS, bootsRow, anchorRows, stepsOf } from '../src/sim/arms/shooting.js';
import { weaponRows } from '../src/sim/arms/sidearm.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { spokenMs } from '../src/core/speech.js';
import { stationPixels, STATION_C } from '../src/render/range-items.js';
import { setAnchor } from '../src/sim/body/footing.js';

const all = (o) => (Array.isArray(o) ? o.flatMap(all) : o && typeof o === 'object' ? Object.values(o).flatMap(all) : typeof o === 'string' ? [o] : []);
const rowsIn = (t) => [...t.matchAll(/\{row:([\w:-]+)\}/g)].map(m => m[1]);
// (a row offered now, not struck: the boots', the anchors' and the weapon group's, as the panel builds them)
const offeredNow = (s, id) => { const pid = s.player.id, rows = id.startsWith('boots:') ? [bootsRow(s, pid)] : id.startsWith('anchor:') ? anchorRows(s, pid) : weaponRows(s, pid, s.clock.ms); return rows.some(r => r && r.id === id && !r.off); };

// (one course by the keys bot on 48213 as the private, read every tick: the commands, the DI's lines, the rows offered on each move)
let RUN = null;
function course() {
  if (RUN) return RUN;
  const g = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private' }), b = anchorsBot(), s = g.state, A = s.armoury.range.anchors;
  const cmds = [], lines = [], badLines = [], seen = new Map();
  let ph = A.phase, moveTicks = 0, lineTicks = 0;
  for (let n = 0; n < 20 * 60 * 15 && !anchorsNow(s).end; n++) {
    g.step(1, b);
    if (A.phase === 'move' && ph !== 'move') {
      const st = STATIONS[A.st], said = g.facts('say').at(-1)?.text ?? '', named = rowsIn(VOID_CADRE.cmd[st.id][0]);
      cmds.push({ n: st.n, id: st.id, said, named, first: named[0] ?? null, firstOffered: named.length ? offeredNow(s, named[0]) : null, atMs: s.clock.ms });
    }
    if (A.phase === 'move') {
      moveTicks++;
      const c = cmds.at(-1);
      for (const id of c.named) if (offeredNow(s, id)) seen.set(`${c.n}|${id}`, true);
      const L = instinctNow(s).line;
      if (L?.id === 'void-station') {
        lineTicks++;
        if (lines.at(-1)?.text !== L.text) lines.push({ n: c.n, text: L.text, row: L.row ?? null, act: L.act ?? null });
        if (L.row && !offeredNow(s, L.row)) badLines.push(`${s.clock.ms}: "${L.text}" names ${L.row}, not offered`);
        if (/[{}]/.test(L.text)) badLines.push(`${s.clock.ms}: "${L.text}" unfilled`);
      }
    }
    ph = A.phase;
  }
  RUN = { g, s, cmds, lines, badLines, seen, moveTicks, lineTicks, says: g.facts('say').filter(x => x.who === s.armoury.range.coachId) };
  return RUN;
}

export default [
  {
    name: 'void-words: the cadre\'s and the DI\'s words name every key by its label from core/keys.js (no key letter written in the data) and every panel row by its label; north is the top wall',
    fn() {
      const T = [...all(VOID_CADRE), ...all(VOID_STEP)], bad = [];
      for (const t of T) {
        for (const m of t.matchAll(/\{key:(\w+)\}/g)) if (!bindingOf(m[1])) bad.push(`no binding '${m[1]}' in "${t}"`);
        for (const id of rowsIn(t)) if (!LABELS[id]) bad.push(`no row '${id}' in "${t}"`);
        if (/\((?:[A-Z]|Shift|Alt)(?: (?:and|with) [A-Z])?\)/.test(t)) bad.push(`a key written in the data: "${t}"`);
        if (/\bnorth\b/i.test(t)) bad.push(`"north" said: "${t}"`);
      }
      const keys = ['up', 'left', 'down', 'right', 'grab', 'run', 'stroll', 'ready', 'instinct'].map(a => `${a} ${sayKeys(`{key:${a}}`)}`);
      console.log(`      ${T.length} lines; the keys as said: ${keys.join(', ')}`);
      console.log(`      station two: "${sayKeys(VOID_CADRE.cmd.lanyard[0])}"`);
      assert(sayKeys('{key:grab}') === label('grab') && label('grab') === 'L' && sayKeys('{key:up}') === 'Z' && sayKeys('{row:boots:release}') === 'Release your boots', keys.join(', '));
      assert(VOID_CADRE.cmd.lanyard.every(t => /top wall/.test(t)), 'station two says the top wall');
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'void-words: the brief is followed by the three ideas (from rest the keys push off the deck, a wall or a hold; the drift until you meet something; L grabs; you fire only from what holds you), the first command after their spoken time',
    fn() {
      const R = course(), [brief, how, first] = R.says;
      console.log(`      the brief at ${fmt(brief.atMs ?? 0, 0)}: "${brief.text}"`);
      console.log(`      then: "${how.text}"`);
      console.log(`      the first command: "${first.text}"`);
      const t0 = R.g.facts('say').findIndex(x => x === brief);
      assert(/what holds you/.test(brief.text) && /push/.test(how.text) && /drift/.test(how.text) && /\bL grab/.test(how.text) && /deck, a wall or a hold/.test(how.text), JSON.stringify([brief.text, how.text]));
      assert(t0 >= 0 && /^Station one/.test(first.text), first.text);
      const A = R.s.armoury.range.anchors;
      assert(A.howAtMs >= A.stations[0].cmdAtMs - spokenMs(how.text) - spokenMs(brief.text) && A.stations[0].cmdAtMs - A.howAtMs >= spokenMs(how.text), JSON.stringify({ how: A.howAtMs, cmd: A.stations[0].cmdAtMs, spoken: spokenMs(how.text) }));
    },
  },
  {
    name: 'void-words: every row a station\'s command names is offered on its way (the keys bot on 48213), the first at the command\'s own tick; the said words are the template\'s filled, no brace left',
    fn() {
      const R = course(), bad = [];
      for (const c of R.cmds) {
        const ok = c.named.map(id => `${LABELS[id]} ${R.seen.get(`${c.n}|${id}`) ? 'offered' : 'NEVER'}`);
        console.log(`      station ${c.n} (${c.id}): ${ok.join(', ') || 'no row'}${c.first ? `; the first, ${LABELS[c.first]}, at the command ${c.firstOffered ? 'offered' : 'NOT OFFERED'}` : ''}`);
        if (c.named.some(id => !R.seen.get(`${c.n}|${id}`))) bad.push(`station ${c.n} names a row never offered`);
        if (c.first && ['lanyard', 'onehand', 'floating'].includes(c.id) && !c.firstOffered) bad.push(`station ${c.n}'s first row not offered at the command`);
        if (/[{}]/.test(c.said) || !VOID_CADRE.cmd[c.id].some(t => sayKeys(t) === c.said)) bad.push(`station ${c.n} said "${c.said}"`);
      }
      assert(R.cmds.length === 5 && !bad.length, bad.join('; '));
    },
  },
  {
    name: 'void-words: the DI\'s line names the next step on every station\'s way, each row it names offered at that tick, T\'s act that row',
    fn() {
      const R = course();
      for (const L of R.lines.slice(0, 40)) console.log(`      ${L.n}: ${L.text}${L.act ? ` [T: ${L.act}]` : ''}`);
      console.log(`      ${R.lines.length} lines in all; the line stands ${R.lineTicks} of the ${R.moveTicks} ticks on the way (${fmt(100 * R.lineTicks / R.moveTicks, 1)}%)`);
      const acts = R.lines.filter(l => l.act), wrong = acts.filter(l => l.act !== `anchor:${l.row}` && l.act !== `stop:${l.row}`);
      assert(!R.badLines.length, R.badLines.slice(0, 5).join('; '));
      assert(R.lineTicks >= 0.95 * R.moveTicks && !wrong.length, JSON.stringify({ lineTicks: R.lineTicks, moveTicks: R.moveTicks, wrong: wrong.slice(0, 3) }));
      for (const want of ['Release your boots', 'Let go', 'push', 'drifting', 'Clip in', 'Wedge', 'walk right (D)']) assert(R.lines.some(l => l.text.includes(want)), `no line with "${want}"`);
    },
  },
  {
    name: 'void-words: the station\'s ring is on the stage at its mark with its line to the turner while its command stands, gone in the gap and the string',
    fn() {
      const g = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private', setup: 's2' }), s = g.state, A = s.armoury.range.anchors;
      const gap = anchorsLook(s).station;
      g.step(25);
      const L = anchorsLook(s), M = L.station, st = STATIONS[A.st], px = stationPixels(M, 16);
      const ring = px.filter(q => q.c === STATION_C.ring), line = px.filter(q => q.c === STATION_C.line);
      const off = ring.map(q => Math.min(...[M.rM, M.rM - 1 / 16].map(r => Math.abs(Math.hypot(q.x - M.x, q.z - M.z) - r)))), ends = line.length ? Math.hypot(line.at(-1).x - st.turner[0], line.at(-1).z - st.turner[1]) : null;
      console.log(`      in the gap: ${gap ? 'a ring' : 'none'}; at station ${st.n}'s command (${A.phase}): a ring at (${M?.x}, ${M?.z}) of ${M?.rM} m, ${ring.length} px within ${fmt(Math.max(...off), 4)} m of it, a line of ${line.length} px ending ${fmt(ends, 2)} m short of the turner`);
      assert(!gap && A.phase === 'move' && M && M.x === st.mark[0] && M.z === st.mark[1] && ring.length >= 90 && Math.max(...off) < 1e-6 && line.length > 50 && ends < 0.5, JSON.stringify({ gap, phase: A.phase, M }));
    },
  },
  {
    name: 'void-words: while a station\'s command stands its rows lead the panel (Release your boots at station two\'s), and a hand on a hold offers Clip in and the wedge from it, "grab a pad-eye (L), Clip in", with no Let go between',
    fn() {
      const g = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private', setup: 's2' }), s = g.state, pid = s.player.id;
      g.step(25); g.step(1, { act: ['ready'] }); g.step(2);
      const rows = stepsOf(s).filter(r => !r.off).map(r => r.id);
      console.log(`      station two's command, the panel: ${rows.slice(0, 6).join(', ')}, …`);
      assert(s.stop?.mode === 'stop' && rows[0] === 'boots:release', rows.slice(0, 5).join(', '));
      // (at station two's mark, a hand on the pad-eye's hold: Let go, and Clip in offered from it)
      const h = createGame({ scenario: 'test-anchors', seed: 48213, tier: 'private', setup: 's3' }), hs = h.state, me = h.me();
      setAnchor(hs, pid, 'handhold');
      const ar = anchorRows(hs, pid).map(r => `${r.id}${r.off ? ` (${r.off})` : ''}`);
      console.log(`      a hand on the hold at (${me.x}, ${me.z}): ${ar.join(', ')}`);
      assert(anchorRows(hs, pid).some(r => r.id === 'anchor:clip' && !r.off) && anchorRows(hs, pid).some(r => r.id === 'anchor:letgo' && !r.off), ar.join(', '));
    },
  },
];
