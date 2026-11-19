// OLYMPUS tests: the step panel follows the choices made (quick; 2026-11-15, the keys role; VIEWS §7.8; COMBAT §25.19.7).
//
// The user after v0.0.15's "Stack and clear" (2026-11-15): "I notice that the keys selection isn't updated according to the
// choices made earlier yet ?" Read two ways (DESIGN.md's log, my call): the panel in play did not yet match the user's gallery pick
// (P3, layout C, ★ 100 for P3-j, 2026-11-12: "That idea is probably the best proposal if we can make the controls work cleanly"),
// and the rows did not follow from the choices already made in the lane. What each test pins, each failing without its fix:
//   - AT THE DOOR's five as P3 drew it: Stack up 1, Stack up and take point 2, Open 3, Kick door 4, Breach 5, on every lane (v0.0.20,
//     the build sheet's item 5: v0.0.14 to v0.0.15 had Enter 4 and Kick 5, v0.0.17 Enter on 5, v0.0.19 Breach on 5 on a breaching
//     lane only); Breach struck "not issued" (the issue badge) where none is carried, Enter in the fan (Tab › 2 › 7) and on T;
//   - what is done stays on its key, ticked: stacked, Stack up and take point "already stacked" (✓), Read the door once read;
//   - an inner door keeps the room's keys (Watch 1, To your point 2, "Clear!" 3), its Hold it and Clear it on 4 and 5 (they moved
//     "Clear!" from 3 to 4 and Watch from 1 to 3);
//   - the DI is never silent at a choice on the lane (the private aimed at his #2's man in room 3, the recruit bracketed on his #2's
//     rifle with his own man's hands unseen: no line, NEXT empty);
//   - the line names its row (line.row): the act's, or the row its words name with no act (the head, the press, Breathe), and that
//     row's own keys reach it on the panel drawn; "Rifle. Pair." names the pair (the sergeant's lit the failure drill);
//   - the instinct's line shows the row's keys after its words ("Open it. Pull. 3", as P3), never twice where the words name them;
//   - in Pairs the head called for is the line's row, its key 4 (the question of 2026-11-14: one panel model, the head made plain);
//   - the keys card names the layout played (C: the five and the core, Tab; no B banks), the menu's toggle C ⇄ A (P2 dropped);
//   - under --ui 1 a tile says one word (P3's small views: Stack, Point, Open, Kick, Enter).
// v0.0.25 (its build sheet §1 E; the carried lens §3.3): the cases over the lanes' stops (allStops) read the five lanes on 48213 quick,
// and one heavy case runs every one of them again over both seeds (1489397426's five lanes too), each case unchanged: the file was
// over its quick CPU line alone (5.8 s against 4.7 s × k), its ten lanes about half of it. "What is done stays on its key" asks for
// more than ten door stops with a door opened, which 48213's five lanes give nine of (1489397426's another nine): it is heavy whole,
// on both seeds as before, run in the heavy case with the rest (stops 'all').
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseKeysBot, houseHonestBot, runHouse } from './bots/house.mjs';
import { pairsBot } from './bots/pairs.mjs';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { instinctNow, firedNow } from '../src/sim/skills/instinct.js';
import { modelOf, viewOf, keyPathOf, resolvePath, situationOf } from '../src/sim/arms/groups.js';
import { houseNow } from '../src/sim/scenarios/shoothouse.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { contactNow } from '../src/sim/combat/contact.js';
import { partsOf, textOf, namesKeys } from '../src/ui/hud/instinct.js';
import { shortName } from '../src/ui/hud/steps.js';
import { keysRows } from '../src/ui/cards/keys.js';
import { nextPanel } from '../src/ui/boot.js';

const choosing = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex;
const band = (m) => Object.fromEntries(viewOf(m, 'c', {}).keys.map(k => [k.key, k.entry]));
const rowOn = (b, k) => b[k]?.row?.id ?? null;
// (the lane's choices of a run: [{ tier, seed, t, steps, line, fired, model }], the line as the page shows it at the stop)
function laneStops(tier, seed, bot) {
  const out = [], g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go' });
  let last = null;
  runHouse(g, bot, { maxMs: 12 * 60_000, each(game) {
    const s = game.state, N = houseNow(s);
    // (a take-in's window open is no choice: nothing speaks in it by design, COMBAT §25.4.5)
    if (!choosing(s) || !N || N.goAtMs === null || N.end || contactNow(s)?.pending) return;
    const key = `${s.clock.ms}|${s.stop.doing?.step ?? ''}`;
    if (key === last) return;
    last = key;
    const steps = stepsOf(s), line = instinctNow(s).line;
    out.push({ tier, seed, t: (s.clock.ms - N.goAtMs) / 1000, leg: N.cur, steps, line, fired: firedNow(s).map(l => l.id), model: modelOf(steps, { act: line?.act ?? null }) });
  } });
  return out;
}
/** v0.0.25: the seeds the lanes' stops are read on (see the header): 48213 for the quick cases, both in the heavy case. */
export const STOP_SEEDS_QUICK = Object.freeze([48213]), STOP_SEEDS_ALL = Object.freeze([48213, 1489397426]);
let stopSeeds = STOP_SEEDS_QUICK;
const memo = new Map();
const allStops = () => {
  const k = stopSeeds.join(',');
  if (!memo.has(k)) memo.set(k, [
    ...stopSeeds.flatMap(seed => ['recruit', 'private'].map(t => laneStops(t, seed, houseKeysBot()))).flat(),
    ...stopSeeds.flatMap(seed => ['cpl', 'sgt', 'tierone'].map(t => laneStops(t, seed, houseHonestBot()))).flat(),
  ]);
  return memo.get(k);
};
// (a row, as stepsOf gives it, for the model's own tests)
const R = (id, kind = 'single', extra = {}) => ({ id, kind, label: id, ms: 500, ...extra });

const CASES = [
  {
    stops: true,
    name: 'AT THE DOOR\'s five is P3-j\'s on every lane (the build sheet v0.0.20 item 5; the user, 2026-11-11: "always visible and accessible (even if grayed out)"): Stack up 1, Stack up and take point 2, Open 3, Kick door 4, Breach 5, struck "not issued" with the issue badge on the standard lane and live on the breach lane, the same key in both; Enter on Tab › 2 › 7 (re-pinned on purpose: v0.0.17 had Enter on 5, v0.0.19 Enter on 5 but on a breaching lane)',
    fn() {
      const rows = [];
      for (const loadout of ['standard', 'breach']) for (const [setup, door] of [['go', 'o:w4:r1'], ['room:2', 'o:w4:r2']]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'cpl', setup, loadout }), s = g.state, H = s.armoury.range.house, P = lanePlanOf(s).plans[door];
        const me = s.actors.list.find(a => a.who === s.player.id), two = s.actors.list.find(a => a.who === H.two.pid);
        me.x = P.stack[0][0]; me.z = P.stack[0][1]; two.x = P.stack[1][0]; two.z = P.stack[1][1];
        const steps = stepsOf(s), M = modelOf(steps), b = band(M), e5 = M.situation.five[4], enter = steps.find(r => /^drill:room:(clear|in)(@|>)/.test(r.id));
        rows.push({ loadout, door, sit: M.situation.id, words: ['1', '2', '3', '4', '5'].map(k => b[k]?.words), five: e5?.row?.id ?? null, off: e5?.row?.off ?? null, badge: e5?.badge?.t ?? null, enter: enter ? keyPathOf(M, 'c', enter.id, { next: false })?.join(' › ') : null });
      }
      for (const r of rows) console.log(`      ${r.loadout} at ${r.door}: ${r.words.join(' · ')}; 5 = ${r.five}${r.off ? ` (${r.off}, badge ${r.badge})` : ' (live)'}; Enter ${r.enter}`);
      const ok = rows.every(r => r.sit === 'door' && r.words.join('|') === 'Stack up|Stack up, take point|Open|Kick door|Breach' && /^drill:door:(breach|pry|ram|shoot)/.test(r.five ?? '') && r.enter === 'Tab › 2 › 7');
      const std = rows.filter(r => r.loadout === 'standard'), br = rows.filter(r => r.loadout === 'breach');
      assert(ok && std.every(r => /^(not|no charge) issued$/.test(r.off ?? '') && r.badge === 'issue') && br.every(r => !r.off), JSON.stringify(rows));
      // (and in the bots' lanes: every AT THE DOOR stop has Breach's words on 5, never Enter)
      const stops = allStops().filter(x => x.model.situation.id === 'door' && x.leg < 3), bad = stops.filter(x => band(x.model)['5']?.words !== 'Breach');
      console.log(`      the bots' lanes: ${stops.length} AT THE DOOR stops, Breach on 5 at ${stops.length - bad.length}`);
      assert(stops.length > 10 && !bad.length, JSON.stringify(bad.slice(0, 3).map(x => [x.tier, x.seed, x.t, band(x.model)['5']?.words])));
    },
  },
  {
    stops: 'all',
    heavy: true,
    name: 'what is done stays on its key, ticked (VIEWS §7.8.1\'s ✓; P3 drew "Stack up ✓"): stacked on the door, Stack up and Stack up and take point struck "already stacked" with the done badge, and Read the door "already read" once read; nothing on the five goes blank after a choice at the same door',
    fn() {
      const stops = allStops().filter(x => x.model.situation.id === 'door' && x.steps.some(s => /^door:(push|pull|kick)>/.test(s.id)));
      let bad = 0, seen = 0;
      for (const x of stops) {
        const b = band(x.model), d = x.model.groups.DRILL.slots;
        for (const k of ['1', '2']) { seen++; if (!(b[k]?.row?.off === 'already stacked' && b[k].badge?.t === 'done')) bad++; }
        if (!x.steps.some(s => /^door:read>/.test(s.id))) { seen++; if (!(d[8].row?.off === 'already read' && d[8].badge?.t === 'done')) bad++; }
      }
      console.log(`      ${stops.length} stacked stops, ${seen} done slots checked, ${bad} not ticked`);
      assert(stops.length > 10 && bad === 0, JSON.stringify({ stops: stops.length, bad }));
    },
  },
  {
    stops: true,
    name: 'nothing on the five goes blank at the same situation once done: the hall\'s end reached keeps To the next door struck "already there", Challenge once his hands are seen "already seen", and a door opened outside it Stack up and take point, Open and Kick door "already open" (the audit found 12 such blanks on 24 lanes: the hall\'s walk done, the challenge given, the tier one\'s room 3 opened under him)',
    fn() {
      const list = allStops(), bad = [], seen = {};
      for (let i = 1; i < list.length; i++) {
        const a = list[i - 1], b = list[i];
        if (a.tier !== b.tier || a.seed !== b.seed || a.leg !== b.leg || a.model.situation.id !== b.model.situation.id) continue;
        const A = band(a.model), B = band(b.model);
        for (const k of ['1', '2', '3', '4', '5']) {
          if (B[k]?.row?.off && /^already/.test(B[k].row.off) && B[k].stand) seen[B[k].row.off] = (seen[B[k].row.off] ?? 0) + 1;
          // (a mark itself may go where its reason does: the man bracketed down, nobody's hands to see)
          if (A[k]?.row && !A[k].stand && !B[k]?.row) bad.push(`${b.tier}/${b.seed} leg ${b.leg} ${b.model.situation.id} @${b.t}: ${k} ${B[k]?.words} (was ${A[k].row.id})`);
        }
      }
      console.log(`      marks kept: ${Object.entries(seen).map(([w, n]) => `${n}× "${w}"`).join(', ')}; blanks ${bad.length}${bad.length ? `: ${bad.slice(0, 3).join('; ')}` : ''}`);
      // (the three marks by the model alone: the hall's end, the hands seen, the door open)
      const m1 = modelOf([R('look:hall:nw', 'look'), R('call:clear', 'call'), R('drill:room:dominate>hall', 'bundle')]);
      const m2 = modelOf([R('shot:pair', 'shot'), R('contact:hold', 'contact'), R('fire', 'fire')]);
      const m3 = modelOf([R('drill:stack:up>o:w4:r3', 'bundle'), R('drill:room:in>o:w4:r3', 'bundle'), R('drill:variant:stance', 'variant'), R('watch:r3:nw', 'watch')]);
      const off = (m, g, k) => m.groups[g].slots[k].row?.off ?? null;
      assert(!bad.length && off(m1, 'DRILL', 7) === 'already there: the hall\'s end' && off(m2, 'TEAM', 6) === 'already seen: his hands' && [2, 3, 4].every(k => off(m3, 'DRILL', k) === 'already open'), JSON.stringify({ bad: bad.slice(0, 6), m1: off(m1, 'DRILL', 7), m2: off(m2, 'TEAM', 6), m3: [2, 3, 4].map(k => off(m3, 'DRILL', k)) }));
    },
  },
  {
    stops: true,
    name: 'an inner door keeps the room\'s keys (Watch 1, To your point 2, "Clear!" 3), its Hold it and Clear it on 4 and 5 (they moved "Clear!" from 3 to 4 and Watch from 1 to 3 as the door was seen); in the bots\' lanes no row changes its key between the room and its inner door',
    fn() {
      const room = [R('watch:r2:ne', 'watch'), R('move:point', 'move'), R('call:clear', 'call'), R('call:out', 'call'), R('move:next', 'move')];
      const inner = [...room, R('door:hold>o:w4:closet', 'door'), R('door:kick>o:w4:closet', 'door')];
      const a = modelOf(room), b = modelOf(inner), ba = band(a), bb = band(b);
      console.log(`      ${a.situation.name}: ${['1', '2', '3', '4', '5'].map(k => `${k} ${rowOn(ba, k)}`).join(' · ')}`);
      console.log(`      ${b.situation.name}: ${['1', '2', '3', '4', '5'].map(k => `${k} ${rowOn(bb, k)}`).join(' · ')}`);
      assert(a.situation.id === 'room' && b.situation.id === 'inner', JSON.stringify([a.situation.id, b.situation.id]));
      assert(['1', '2', '3'].every(k => rowOn(ba, k) === rowOn(bb, k)) && /^door:hold>/.test(rowOn(bb, '4')) && /^door:kick>/.test(rowOn(bb, '5')), JSON.stringify([ba, bb].map(x => Object.keys(x).map(k => rowOn(x, k)))));
      // (the lanes: a row on 1 to 5 at one stop and on another of 1 to 5 at the next, the same leg, room and inner door only)
      const moved = [];
      const list = allStops();
      for (let i = 1; i < list.length; i++) {
        const p = list[i - 1], x = list[i];
        if (p.seed !== x.seed || p.tier !== x.tier || p.leg !== x.leg || ![p, x].every(y => ['room', 'inner'].includes(y.model.situation.id))) continue;
        const pb = band(p.model), xb = band(x.model);
        for (const k of ['1', '2', '3', '4', '5']) { const id = rowOn(xb, k), was = ['1', '2', '3', '4', '5'].find(j => rowOn(pb, j) === id); if (id && was && was !== k) moved.push(`${x.tier}/${x.seed} @${x.t}: ${id} ${was}→${k}`); }
      }
      console.log(`      rows moved between the room and its inner door: ${moved.length}${moved.length ? ` (${moved.slice(0, 3).join('; ')})` : ''}`);
      assert(!moved.length, JSON.stringify(moved.slice(0, 5)));
    },
  },
  {
    stops: true,
    name: 'the hall\'s leg, with no door, is named THE HALL on the band, its five on AT THE DOOR\'s keys (the hall\'s entry on 5); a door\'s leg keeps AT THE DOOR (it said AT THE DOOR in the hall); inside it, IN THE HALL, the rooms\' IN THE ROOM (it said IN THE ROOM down the hall)',
    fn() {
      const list = allStops().filter(x => x.model.situation.id === 'door'), hall = list.filter(x => x.leg === 3), rooms = list.filter(x => x.leg < 3);
      const h = hall.find(x => /^drill:.*>hall$/.test(rowOn(band(x.model), '5') ?? ''));
      console.log(`      ${hall.length} hall stops named ${[...new Set(hall.map(x => x.model.situation.name))].join(', ')}; ${rooms.length} door stops named ${[...new Set(rooms.map(x => x.model.situation.name))].join(', ')}; the hall's 5: ${h ? rowOn(band(h.model), '5') : 'none'}`);
      assert(hall.length > 0 && hall.every(x => x.model.situation.name === 'THE HALL') && rooms.every(x => x.model.situation.name === 'AT THE DOOR') && h, JSON.stringify({ hall: hall.map(x => x.model.situation.name), rooms: [...new Set(rooms.map(x => x.model.situation.name))] }));
      const ins = allStops().filter(x => x.model.situation.id === 'room'), inHall = ins.filter(x => x.leg === 3), inRooms = ins.filter(x => x.leg < 3);
      console.log(`      inside: ${inHall.length} hall stops named ${[...new Set(inHall.map(x => x.model.situation.name))].join(', ')}; ${inRooms.length} room stops named ${[...new Set(inRooms.map(x => x.model.situation.name))].join(', ')}`);
      assert(inHall.length > 0 && inHall.every(x => x.model.situation.name === 'IN THE HALL') && inRooms.every(x => x.model.situation.name === 'IN THE ROOM'), JSON.stringify({ inHall: [...new Set(inHall.map(x => x.model.situation.name))], inRooms: [...new Set(inRooms.map(x => x.model.situation.name))] }));
    },
  },
  {
    stops: true,
    name: 'the DI is never silent at a choice on the lane (the standing rule: never a dead end): a line fires at every stop of the keys and honest lanes on two seeds, with the private aimed at his #2\'s man in room 3 ("your two\'s; yours: your point") and the recruit bracketed on his #2\'s rifle with his own man\'s hands unseen ("hands not seen; on him") (both were silent, NEXT empty)',
    fn() {
      const list = allStops(), silent = list.filter(x => !x.fired.length);
      const his = list.filter(x => x.line?.variant === 'hisNext').length, onto = list.filter(x => x.line?.variant === 'handsOnto').length;
      console.log(`      ${list.length} choices on the lane; ${silent.length} with no rule firing${silent.length ? `: ${silent.slice(0, 3).map(x => `${x.tier}/${x.seed} @${x.t} ${x.model.situation.id}`).join('; ')}` : ''}; "your two's, yours: …" ${his}, "hands not seen, on him" ${onto}`);
      assert(!silent.length && his > 0 && onto > 0, JSON.stringify(silent.slice(0, 4).map(x => [x.tier, x.seed, x.t, x.model.situation.id])));
    },
  },
  {
    stops: true,
    name: 'the line names its row (line.row: its act\'s, or the head, the press, Breathe its words name with no act), and that row\'s own keys on the panel drawn reach it at every stop; "Rifle. Pair." names the pair (the sergeant\'s lit the failure drill on 3), "Press." a shot or Fire',
    fn() {
      const list = allStops(), bad = [], counts = {};
      let named = 0;
      for (const x of list) {
        const L = x.line;
        if (!L?.row) continue;
        named++;
        const rid = x.model.rows.some(r => r.id === L.row) ? L.row : L.row.split('>')[0];
        const own = keyPathOf(x.model, 'c', rid, { next: false }), back = own ? resolvePath(x.model, 'c', own) : null;
        counts[own?.length ?? 'none'] = (counts[own?.length ?? 'none'] ?? 0) + 1;
        if (!own || back?.id !== rid) bad.push(`${x.tier}/${x.seed} @${x.t}: ${L.id} ${L.row} ${own?.join('›')} → ${back?.id}`);
        if (L.id === 'cqb-contact' && /^row/.test(L.variant ?? 'row') && /Pair/.test(L.text) && x.steps.some(s => /^shot:pair(@|$)/.test(s.id) && !s.off) && !/^shot:pair/.test(L.row)) bad.push(`${x.tier}/${x.seed} @${x.t}: "${L.text}" names ${L.row}`);
        if (L.id === 'cqb-contact' && /^press/.test(L.words ?? '') && !/^(shot:|fire$)/.test(L.row)) bad.push(`${x.tier}/${x.seed} @${x.t}: "${L.text}" names ${L.row}`);
      }
      const press = list.filter(x => x.line?.id === 'cqb-contact' && /^Press|^Now|^Fire|^Go/.test(x.line.text));
      console.log(`      ${named} of ${list.length} lines name a row; its own keys: ${Object.entries(counts).map(([n, c]) => `${c}× ${n} key${n === '1' ? '' : 's'}`).join(', ')}; the house's "Press." lines ${press.length}, each naming ${[...new Set(press.map(x => x.line.row))].join(', ')}`);
      assert(!bad.length && named > 100 && press.length > 0 && press.every(x => x.line.row), JSON.stringify(bad.slice(0, 5)));
    },
  },
  {
    name: 'the instinct\'s line shows the row\'s keys after its words, as P3 drew it ("Open it. Pull. 3"), T\'s label not said again for that row (0.0.16), never twice where its words name them ("Plate. To the head: 4.", "Breathe: Tab › 1 › 8."), and never for a key that is only part of a number ("room 2, 7.0 m")',
    fn() {
      const label = (a) => (a === 'instinct' ? 'T' : a);
      const one = textOf(partsOf({ label, now: { line: { text: 'Open it. Pull.', act: 'stop:door:pull>o:w4:r2', tone: 'note', row: 'door:pull>o:w4:r2' } }, actWords: 'Open the door: pull · 0.9 s', rowKeys: ['3'] }));
      const press = textOf(partsOf({ label, now: { line: { text: 'Press.', act: null, tone: 'urgent', row: 'shot:pair' } }, rowKeys: ['1'] }));
      const head = textOf(partsOf({ label, now: { line: { text: 'Plate. To the head: 4.', act: null, tone: 'urgent', row: 'shot:head' } }, rowKeys: ['4'] }));
      const fan = textOf(partsOf({ label, now: { line: { text: 'Breathe: Tab › 1 › 8.', act: 'stop:breathe', tone: 'warn', row: 'breathe' } }, rowKeys: ['Tab', '1', '8'] }));
      const far = namesKeys('Room clear. Next: room 2, 7.0 m.', ['7']);
      // (0.0.16, the fixer's: T's label is not said again where the line names its act's own row by its keys (at 1600 × 900 the long
      // label cut the line's side and its key chip with "…"); a line whose act is another row keeps it)
      const other = textOf(partsOf({ label, now: { line: { text: 'Plate. Head.', act: 'stop:aim>turner:3', tone: 'urgent', row: 'shot:head' } }, actWords: 'Aim at the armoured target · 0.7 s', rowKeys: ['4'] }));
      const long = textOf(partsOf({ label, now: { line: { text: 'Pull it open. Your corner: right.', act: 'stop:door:pull>o:w4:r2@normal', tone: 'note', row: 'door:pull>o:w4:r2' } }, actWords: 'Open the door: pull · 1.0 s', rowKeys: ['3'] }));
      for (const t of [one, press, head, fan, other, long]) console.log(`      ${t}`);
      assert(one === 'T Open it. Pull. 3' && press === 'Press. 1' && head === 'Plate. To the head: 4.' && fan === 'T Breathe: Tab › 1 › 8.' && !far, JSON.stringify([one, press, head, fan, far]));
      assert(other === 'T: Aim at the armoured target · 0.7 s. Plate. Head. 4' && long === 'T Pull it open. Your corner: right. 3', JSON.stringify([other, long]));
    },
  },
  {
    name: 'Pairs\' still-up (the question of 2026-11-14: the head moved from 1 to 4 and the old habit puts a pair into the plate; one panel model): the DI\'s line names the head row (line.row shot:head) and its key, 4, CONTACT\'s fourth, which reaches it; Pair keeps 1',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private', setup: 'standby:3' }), s = g.state, bot = pairsBot();
      let line = null, steps = null;
      for (let n = 0; n < 20 * 60 * 2 && !line; n++) {
        g.step(1, bot);
        const l = instinctNow(s).line;
        if (l?.id === 'pairs-still-up' && choosing(s)) { line = l; steps = stepsOf(s); }
      }
      const m = modelOf(steps, { act: line?.act ?? null }), b = band(m), path = keyPathOf(m, 'c', line?.row, { next: false });
      console.log(`      "${line?.text}" row ${line?.row}, its keys ${path?.join(' › ')}; 1 ${rowOn(b, '1')}, 4 ${rowOn(b, '4')}`);
      assert(line?.row === 'shot:head' && path?.join() === '4' && rowOn(b, '4') === 'shot:head' && /^shot:pair/.test(rowOn(b, '1') ?? '') && line.text.includes(': 4.'), JSON.stringify({ line, path }));
    },
  },
  {
    name: 'the keys card names the layout played (the user\'s "the keys selection isn\'t updated according to the choices made earlier"): C says 1 to 5 the situation\'s five and 6 to 0 the core, and Tab, never B\'s banks; A its drawers and Esc; with no layout, every row as before; the menu\'s toggle turns C and A in turn (P2 dropped, 2026-11-12)',
    fn() {
      const label = (a) => a;
      const c = keysRows({ label, panel: 'c' }).map(r => r.join(' ')), a = keysRows({ label, panel: 'a' }).map(r => r.join(' ')), all = keysRows({ label }).map(r => r.join(' '));
      for (const r of c.filter(x => /panel|situation|core/.test(x))) console.log(`      C: ${r}`);
      assert(c.some(r => /situation's five/.test(r)) && c.some(r => /^6 7 8 9 0 .*core/.test(r)) && c.some(r => /^Tab /.test(r)) && !c.some(r => /panel B/.test(r)) && !c.some(r => /panel A/.test(r)), JSON.stringify(c));
      assert(a.some(r => /drawers/.test(r)) && a.some(r => /panel A/.test(r)) && !a.some(r => /panel B|panel C/.test(r)), JSON.stringify(a));
      assert(all.some(r => /panel B/.test(r)) && all.some(r => /panel C/.test(r)), JSON.stringify(all));
      assert(nextPanel('c') === 'a' && nextPanel('a') === 'c' && nextPanel('b') === 'c', JSON.stringify(['c', 'a', 'b'].map(nextPanel)));
    },
  },
  {
    name: 'under --ui 1 a tile says one word, as P3\'s small views (1024 × 768): at the door Stack, Point, Open, Kick, Enter; in the room Watch, Point, Clear!; the core\'s by its row (Off safe, High, IA); Rifle up on Transition\'s slot says Rifle',
    fn() {
      const w = [
        shortName({ group: 'DRILL', slot: 1, row: { label: 'Stack up' } }, 'out'), shortName({ group: 'DRILL', slot: 2, row: { label: 'Stack up, take point' } }, 'out'),
        shortName({ group: 'DRILL', slot: 3, row: { label: 'Open the door: pull' } }, 'out'), shortName({ group: 'DRILL', slot: 4, row: { label: 'Kick it' } }, 'out'),
        shortName({ group: 'DRILL', slot: 7, row: { label: 'Open, clear the room' } }, 'out'),
        shortName({ group: 'DRILL', slot: 1, row: { label: 'Watch: the near left corner' } }, 'in'), shortName({ group: 'DRILL', slot: 2, row: { label: 'Move to your point' } }, 'in'), shortName({ group: 'DRILL', slot: 3, row: { label: 'Clear!' } }, 'in'),
        shortName({ core: 'fix', row: { label: 'Off safe' } }), shortName({ core: 'muzzle', row: { label: 'High ready' } }), shortName({ core: 'fix', row: { label: 'IMMEDIATE ACTION' } }),
        shortName({ group: 'GUN', slot: 3, row: { label: 'Rifle up: holster, tap, rack' } }),
      ];
      console.log(`      ${w.join(' · ')}`);
      assert(w.join('|') === 'Stack|Point|Open|Kick|Enter|Watch|Point|Clear!|Off safe|High|IA|Rifle', w.join('|'));
    },
  },
];
// (a run with the stops read on a set of seeds; and the stops of a set of seeds, as allStops reads them)
function withSeeds(seeds, fn) { const was = stopSeeds; stopSeeds = seeds; try { return fn(); } finally { stopSeeds = was; } }
const allStopsOf = (seeds) => withSeeds(seeds, allStops);

export default [
  // (a case over both seeds' stops (stops 'all') reads both, as it did before v0.0.25)
  ...CASES.map(c => (c.stops === 'all' ? { ...c, fn: () => withSeeds(STOP_SEEDS_ALL, c.fn) } : c)),
  {
    name: 'every case over the lanes\' stops above, again over both seeds (48213 and 1489397426: ten lanes; heavy from v0.0.25, the quick cases on 48213\'s five, each case unchanged)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const cases = CASES.filter(c => c.stops && c.stops !== 'all');
      withSeeds(STOP_SEEDS_ALL, () => { for (const c of cases) { console.log(`      ${c.name.slice(0, 60)}…`); c.fn(); } });
      console.log(`      ${cases.length} quick cases again, over ${allStopsOf(STOP_SEEDS_ALL).length} stops on both seeds (${allStopsOf(STOP_SEEDS_QUICK).length} on 48213)`);
    },
  },
];
