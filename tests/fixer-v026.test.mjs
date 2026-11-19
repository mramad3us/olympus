// OLYMPUS tests: v0.0.26's fixer, the play review and the code review of the integrated round (.run/v026/fix.md). Each case fails without
// its fix (checked by undoing it): the hot wash's window line on the end card; T naming the flash below rung 2 on a bang draw; room 1's par
// carrying the bang; no head shot named over a man read COWERING; GIVING UP while his rifle is still in his hands; no room 2 after room 1's
// "Clear!" on "Bang, then go"; a searched man's verdict whole on his card, and the second man's truth shown after his search; the card's
// STARTLED TO, "NONE ASKED OF THEM" and the men named at "out"; the timer strip keeping the man's par; no search offered after the lane's
// end; the search's offer judged before the lane's time and dry ends. The lanes are "Bang, then go"'s own (tests/breach-lanes.mjs), one
// played once each and read by every case that needs it.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { breachLane, breachLine } from './breach-lanes.mjs';
import { breachFuzzBot, houseTBot } from './bots/house.mjs';
import * as cards from '../src/ui/cards/house.js';
import * as target from '../src/ui/hud/target.js';
import * as timer from '../src/ui/hud/timer.js';
import { wordsRows, wordsW, WORDS_K } from '../src/art/doll/hitcard.js';
import { windowWords, houseNow, LANE_MAX_MS } from '../src/sim/scenarios/shoothouse.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { stopLead } from '../src/sim/skills/instinct/cqb.js';
import { searchableOf, contactRows } from '../src/sim/combat/contact.js';
import { liveStateOf } from '../src/sim/combat/men.js';
import { hitMarks } from '../src/sim/arms/marks.js';
import { playerActor } from '../src/core/ids.js';

const meAt = (s) => { const a = playerActor(s); return a ? { x: a.x, z: a.z } : null; };
const readers = () => ({ marksOf: (st, key, k, ph) => hitMarks(st, key, { k, phase: ph }), meAt });
const lanes = new Map();
/** A lane played once (breachLane's options as its key), with what `watch` read at each tick. */
function lane(o, watch = null) {
  const k = JSON.stringify(o);
  if (!lanes.has(k)) { const seen = []; const out = breachLane({ ...o, each: watch ? (g) => watch(g, seen) : null }); lanes.set(k, { ...out, seen }); }
  return lanes.get(k);
}
// (the instinct's line at each tick it changes: [tick, id, text])
const lines = (g, seen) => { const L = g.state.$instinct?.line, w = L ? `${L.id}|${L.text ?? ''}` : ''; if (w && seen.at(-1)?.[3] !== w) seen.push([g.state.clock.tick, L.id, L.text ?? '', w]); };

export default [
  {
    name: 'the hot wash\'s first line of "Bang, then go" (its window, windowWords) is on the end card\'s lines, not only in the wash the plan stands down (the play review of v0.0.26, finding 1: on no end card)',
    fn() {
      const { g, rec } = lane({ tier: 'sgt', seed: 48213, code: 'bang,held', bot: 'auto' }), s = g.state;
      const lead = windowWords(s), said = cards.houseEndLines(houseNow(s), rec.sheet, rec.wash);
      console.log(`      ${breachLine(rec)}`);
      console.log(`      the wash's lead: "${rec.wash?.lead}"; the card's lines: ${JSON.stringify(said)}`);
      assert(lead && rec.wash?.lead === lead && said.includes(lead), JSON.stringify({ lead, washLead: rec.wash?.lead, said }));
      // (and the page passes the wash to the card's lines)
      const main = readFileSync(path.join(root, 'src/main.js'), 'utf8');
      assert(/said: houseEndLines\(hn, rs, hw\)/.test(main), 'main.js openHouseEnd does not pass the hot wash to houseEndLines');
    },
  },
  {
    name: 'on a bang draw T names the flash at the door for the boot recruit and the private, and his press throws it (the play review of v0.0.26, finding 2: "Open it. Push." and no word of the bang)',
    // (heavy: whole lanes over the quick file's CPU budget, QUICK_FILE_CPU_S 3 s)
    heavy: true,
    fn() {
      for (const tier of ['recruit', 'private']) {
        const { rec, seen } = lane({ tier, seed: 48213, code: 'bang,loose', bot: 'T', maxMs: 30_000 }, lines);
        const door = seen.find(x => x[1] === 'cqb-door');
        console.log(`      ${tier}: T at the door "${door?.[2]}"; the bang at ${rec.W?.bangAtMs ?? 'none'}`);
        assert(door && /flash/i.test(door[2]) && rec.W?.bangAtMs !== null && rec.W?.bangAtMs !== undefined, JSON.stringify({ tier, door, bang: rec.W?.bangAtMs }));
      }
    },
  },
  {
    name: 'room 1\'s par carries the bang where the draw issued it, so the tier one who uses it is no NO-GO over the lane\'s par; the quiet room\'s par is as it was (the play review of v0.0.26, finding 3: 9.6 s against 9.0)',
    fn() {
      const bang = lane({ tier: 'tierone', seed: 48213, code: 'bang,loose', bot: 'T' }), quiet = lane({ tier: 'tierone', seed: 48213, code: 'quiet,loose', bot: 'T' });
      const vb = bang.rec.sheet.verdict, vq = quiet.rec.sheet.verdict;
      console.log(`      the bang: lane ${vb.laneMs} ms, par ${vb.laneParMs} ms, ${vb.go ? 'GO' : `NO-GO ${vb.why}`}; quiet: lane ${vq.laneMs} ms, par ${vq.laneParMs} ms, ${vq.go ? 'GO' : `NO-GO ${vq.why}`}`);
      assert(vb.go && !vb.why.includes('lane') && vb.laneParMs > vq.laneParMs && vq.laneParMs === 9000, JSON.stringify({ vb, vq }));
    },
  },
  {
    name: 'T never names the head on a man read COWERING: Challenge leads, and he gives up rather than goes down to T (the play review of v0.0.26, finding 5: "Plate. Head: 4." and T shot him); his card reads GIVING UP while his rifle is still in his hands, HANDS UP once it is down (finding 6)',
    fn() {
      const fz = breachFuzzBot({ seed: 1018 }), nx = houseTBot();
      let sw = null;
      const bot = () => (s, me, mem) => { if (sw === null && s.armoury.range.turners.some(T => T.live && liveStateOf(s, T, s.time.ms) === 'cowering')) sw = s.clock.tick; return sw !== null ? nx(s, me, (me.bot2 ??= {})) : fz(s, me, mem); };
      const words = [];
      const { g, seen } = lane({ tier: 'sgt', seed: 1018, code: 'drawn', bot }, (game, out) => {
        lines(game, out);
        const s = game.state, T = s.armoury.range.turners.find(x => x.stand === '1a');
        if (sw === null || s.clock.tick > sw + 80 || !T?.live) return;
        const m = target.targetModel(s, { kind: 'person', who: T.live.who, readers: readers() });
        const w = `${String(m?.words ?? '').split(' · ')[0]}|${m?.subject?.rec?.frame}`;
        if (words.at(-1) !== w) words.push(w);
      });
      const T = g.state.armoury.range.turners.find(x => x.stand === '1a');
      const after = seen.filter(x => x[0] >= sw && x[0] <= sw + 40).map(x => x[1]);
      console.log(`      cowering at tick ${sw}; T's lines after: ${after.join(', ')}; 1a gave at ${T.live.gaveAtMs ?? 'never'}; his card: ${words.join(' > ')}`);
      assert(sw !== null && !after.includes('cqb-still-up') && after[0] === 'cqb-rp-hands' && Number.isFinite(T.live.gaveAtMs), JSON.stringify({ sw, after, gave: T.live.gaveAtMs }));
      const drop = words.find(w => w.endsWith('|drop')), up = words.find(w => w.startsWith('HANDS UP|'));
      assert(drop === `${target.GIVING_WORDS}|drop` && up && !words.some(w => w === 'HANDS UP|drop'), JSON.stringify(words));
    },
  },
  {
    name: 'after room 1\'s "Clear!" on "Bang, then go" nothing of room 2 is offered or said: no row on its door, no "Next: room 2", no "Clear it. 13.9 s." (the play review of v0.0.26, finding 7)',
    fn() {
      const leaks = [];
      const { rec, seen } = lane({ tier: 'sgt', seed: 48213, code: 'quiet,loose', bot: 'T' }, (game, out) => {
        lines(game, out);
        const s = game.state, H = s.armoury.range.house;
        if (H.rooms[0].state !== 'clear' || H.end) return;
        const r2 = H.rooms[1]?.door, rows = (stepsOf(s) ?? []).filter(x => r2 && x.id.endsWith(`>${r2}`) && !x.off).map(x => x.id), lead = stopLead(s) ?? '';
        if (rows.length || /room 2/i.test(lead)) leaks.push({ tick: s.clock.tick, rows, lead });
      });
      const clearAt = rec.says.findIndex(x => /Room clear!|^Clear!$/.test(x.text));
      const stackAfter = seen.filter(x => x[1] === 'cqb-stack' && x[0] > 200);
      console.log(`      ${breachLine(rec)}; ticks with room 2 offered or named: ${leaks.length}; cqb-stack after the clear: ${stackAfter.length}`);
      assert(clearAt >= 0 && !leaks.length && !stackAfter.length, JSON.stringify({ leaks: leaks.slice(0, 3), stackAfter: stackAfter.slice(0, 3) }));
    },
  },
  {
    name: 'a searched man\'s card shows his verdict whole (four rows of words, a part too wide wrapped at its words), and after the second search the card shows the second man\'s truth (the play review of v0.0.26, finding 8)',
    // (heavy: whole lanes over the quick file's CPU budget, QUICK_FILE_CPU_S 3 s)
    heavy: true,
    fn() {
      // (the card's words at the HUD's size and the end card's least)
      for (const size of [170, 200]) {
        const r = wordsRows({ words: 'SEARCHED · WOULD HAVE BEEN FATAL: KILLED OUTRIGHT · 1A', headRows: 4 }, size).head;
        assert(r.join(' ').includes('KILLED OUTRIGHT') && !r.some(x => x.endsWith('..')) && r.every(x => wordsW(x, WORDS_K) <= size - 12), JSON.stringify({ size, r, w: r.map(x => wordsW(x, WORDS_K)) }));
      }
      // (the target view over the lane, hidden while a skip runs as the page hides it behind the splash)
      const view = target.createTargetView({ card: { update: (m) => m?.words ?? '', text: '' }, readers: readers() });
      const seen = { sig: null, t: -Infinity, stop: false, shown: null }, shown = [];
      const { g, rec } = lane({ tier: 'sgt', seed: 48213, code: 'bang,held', bot: 'auto' });
      void g;
      // (played again with the view: the lane above is the one the first case read)
      const endTick = {};
      const again = breachLane({ tier: 'sgt', seed: 48213, code: 'bang,held', bot: 'auto', each: (game) => {
        const s = game.state, w = view.frame(s, { hidden: !!s.skip, inStop: !!s.stop, seen, now: s.clock.ms });
        for (const T of s.armoury.range.turners) if (T.live?.searched && endTick[T.key] === undefined) endTick[T.key] = s.clock.tick;
        if (w && /^SEARCHED/.test(w) && shown.at(-1)?.key !== seen.shown?.key) shown.push({ tick: s.clock.tick, key: seen.shown?.key, words: w, rows: target.targetModel(s, { kind: 'person', who: s.armoury.range.turners.find(T => T.key === seen.shown?.key)?.live?.who, readers: readers() })?.headRows ?? null });
      } });
      const R = again.g.state.armoury.range, men = R.turners.filter(T => T.live), order = men.filter(T => T.live.searched).sort((a, b) => a.live.searched.atMs - b.live.searched.atMs).map(T => T.key);
      console.log(`      ${breachLine(rec)}; searched in order ${order.join(', ')}; the card's searched faces: ${shown.map(x => `t${x.tick} ${x.key} (${x.rows} rows) "${x.words}"`).join('; ')}`);
      // (each man's searched face on the card within a few ticks of his search's end, not at the lane's end)
      assert(order.length === 2 && shown.length >= 2 && shown[0].key === order[0] && shown[1].key === order[1] && shown.slice(0, 2).every(x => x.rows === 4 && x.tick <= endTick[x.key] + 5), JSON.stringify({ order, endTick, shown }));
    },
  },
  {
    name: 'the card\'s words: a man\'s startle STARTLED TO (DAZED the plaque\'s whole shock), THEIR CHOICES "NONE ASKED OF THEM" where nobody went in and none of them fired, and the men ruled out named at "Clear!" (the play review of v0.0.26, finding 10)',
    // (heavy: whole lanes over the quick file's CPU budget, QUICK_FILE_CPU_S 3 s)
    heavy: true,
    fn() {
      const { rec } = lane({ tier: 'sgt', seed: 48213, code: 'bang,held', bot: 'auto' });
      const men = rec.sheet.breach.men, out = rec.says.find(x => /you are out|: out\./.test(x.text));
      console.log(`      ${men.join(' | ')}; "${out?.text}"`);
      assert(men.every(x => !/DAZED TO/.test(x)) && men.some(x => /STARTLED TO/.test(x)) && out && /1A and 1B/.test(out.text), JSON.stringify({ men, out }));
      // (nobody in: the boot recruit by T throws the bang and never walks in, the house's T below rung 2)
      const none = lane({ tier: 'recruit', seed: 48213, code: 'bang,loose', bot: 'T', maxMs: 30_000 }, lines);
      const R = none.g.state.armoury.range, fired = R.turners.filter(T => T.live).reduce((a, T) => a + (T.live.fired ?? 0), 0);
      console.log(`      the recruit by T: in at ${none.rec.W.inAtMs ?? 'never'}, their rounds ${fired}: "${none.rec.sheet.breach.choices}"`);
      assert(none.rec.W.inAtMs !== null || fired > 0 || none.rec.sheet.breach.choices === 'THEIR CHOICES: NONE ASKED OF THEM', JSON.stringify(none.rec.sheet.breach));
      assert(none.rec.W.inAtMs === null && fired === 0, 'the lane meant to test it went in or was fired on: choose another');
    },
  },
  {
    name: 'the timer strip keeps the man\'s par where its words are wider than the strip: the room\'s own par gives way, then the room\'s word (the play review of v0.0.26, finding 10: "1A 5." cut)',
    fn() {
      assert(typeof timer.stripParts === 'function', 'no stripParts');
      const a = timer.stripParts('ROOM 1 13.2 · PAR 24.0 · 1A 5.0 LEFT'), b = timer.stripParts('ROOM 1 13.2 · PAR 24.0 · 1A HE FIRED FIRST'), c = timer.stripParts('GO 1.2 · PAR 24.0');
      console.log(`      ${JSON.stringify(a)} ${JSON.stringify(b)} ${JSON.stringify(c)}`);
      assert(a.at(-1) === '1A 5.0 LEFT' && b.at(-1) === '1A HE FIRED FIRST' && c.join(' · ') === 'GO 1.2 · PAR 24.0', JSON.stringify({ a, b, c }));
    },
  },
  {
    name: 'no search is offered once the lane has ended: a man ruled out at "Clear!" and never searched is no row and no walk at SHOW CLEAR or the wash (the code review of v0.0.26, finding 1)',
    fn() {
      // (T searches both men on this lane now, so their records are put back as if neither had been searched, then restored)
      const { g } = lane({ tier: 'sgt', seed: 48213, code: 'quiet,loose', bot: 'T' }, lines), s = g.state, H = s.armoury.range.house;
      const men = s.armoury.range.turners.filter(T => T.live && T.live.st === 'out' && T.live.outWhy === 'clear'), kept = men.map(T => T.live.searched);
      for (const T of men) delete T.live.searched;
      let left, rows;
      try {
        left = searchableOf(s, s.player.id, s.clock.ms, { reach: false }).map(x => x.key ?? x.T?.key);
        rows = contactRows(s).map(r => r.id).filter(id => /search/.test(id));
      } finally { men.forEach((T, i) => { if (kept[i]) T.live.searched = kept[i]; }); }
      console.log(`      the lane ended "${H.end?.why}"; men ruled out at "Clear!", unsearched for the case: ${men.map(T => T.stand).join(', ')}; searchable after the end ${left.length}; rows ${rows.join(', ') || 'none'}`);
      assert(H.end && men.length && !left.length && !rows.length, JSON.stringify({ end: H.end, left, rows }));
    },
  },
  {
    name: 'the search\'s offer is judged before the lane\'s time and dry ends: a room 1 already called clear ends \'clear\', never \'time\', while the offer holds its clock (the code review of v0.0.26, finding 3)',
    fn() {
      let moved = false;
      const { g, rec } = breachLane({ tier: 'sgt', seed: 48213, code: 'quiet,loose', bot: 'T', each: (game) => {
        const H = game.state.armoury.range.house;
        if (!moved && H.bangGo?.offer && !H.end) { moved = true; H.goAtMs -= LANE_MAX_MS; }
      } });
      const H = g.state.armoury.range.house;
      console.log(`      the GO moved back ${LANE_MAX_MS} ms at the offer: the lane ended "${H.end?.why}" (${breachLine(rec)})`);
      assert(moved && H.end?.why === 'clear', JSON.stringify({ moved, end: H.end }));
    },
  },
];
