// OLYMPUS tests: breach-search, "Bang, then go"'s gauge F146, the sim's half: belief, then truth (its build sheet item 9, §0 item 7, §3.1, §6 A, §8; COMBAT §7.7; VIEWS §7.7; defenders.md DF§7): "Search him" (contact.js 'contact:search', SEARCH_MS 20 s in SEARCH_PARTS 4) is offered only on the scene's lane, after the room's "Clear!", on a man accounted for there, within SEARCH_M 1.5 m, the nearest, not yet searched; while it runs the card stays belief (contact.js cardPhaseOf); at its last part's end T.live.searched = { by, atMs }, the fact { phase: 'rp', kind: 'searched' }, and his card is the truth, equal to marks.js hitMarks' truth; a search cut by a cue (a sighting, at a part's end) leaves belief and is offered again; R.house.bangGo.search the record of the last begun, contact.js searchOn whether one runs. The card's pixels are C's (ui-breach).
//
// On tests/opfor-world.mjs rpScript (room 1 scripted, R.house.bangGo by hand): the bang, you and your #2 in, a pair of yours on 1a, both
// men down, covered, "Clear!" called by the row, then the walk up to him by hand (the keys' work), or by its row ('move:search', T's
// "Go to him."). Fails without its fix: no search row, no searched record, no cut (the cut search would search him anyway), no walk
// (the review of A, 2026-11-19: at "Clear!" the men lay 3.0 to 4.9 m off and no row or line ever reached one).
import { assert, fmt } from './helpers.mjs';
import { rpScript, liveGame } from './opfor-world.mjs';
import { stepAct } from './bots/lib.mjs';
import { enterStop, stepsOf } from '../src/sim/arms/shooting.js';
import { contactRows, searchableOf, searchOn, cardPhaseOf, searchWalkOf, SEARCH_MS, SEARCH_M, SEARCH_PARTS, SEARCH_LABEL, SEARCH_WALK_M, SEARCH_WALK_LABEL } from '../src/sim/combat/contact.js';
import { accountedOf } from '../src/sim/combat/men.js';
import { hitMarks } from '../src/sim/arms/marks.js';
import { noteContact } from '../src/sim/people/mind.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { opforNow } from '../src/sim/scenarios/opfor.js';

// (a press of yours in the mode, run to its end; returns the step's result as the panel saw it)
function press(g, id, target = null) {
  const s = g.s;
  if (s.stop?.mode !== 'stop') enterStop(s, g.g.bus, { via: 'shoot' });
  const had = stepsOf(s).some(r => r.id === id && !r.off) || id.startsWith('pick=');
  g.g.step(1, { act: [stepAct(id, 'normal', target)] });
  let n = 0;
  while (s.stop?.phase === 'act' && n++ < 1000) g.g.step(1, {});
  return had;
}
// (the room fought and called clear: the bang, both in, your pair on 1a, both men down and covered, "Clear!")
function clearedRoom(seed = 48213) {
  const g = rpScript({ seed, held: 'loose' }), s = g.s, k1 = g.man('1a').key, k2 = g.man('1b').key;
  g.open(); g.run(2500); g.bang(); g.run(200);
  g.enter('me', [28.6, 11.3], [27.0, 8.5]); g.enter('two', [29.6, 11.3]);
  g.run(600);
  press(g, `pick=${k1}`);
  const pair = stepsOf(s).find(r => /^shot:pair/.test(r.id) && !r.off && (r.target ?? k1) === k1);
  if (pair) press(g, pair.id, k1);
  const rounds = (s.armoury.range.shots ?? []).filter(x => x.key === k1).length;
  if (g.man('1a').live.st !== 'down') g.down('1a');
  if (g.man('1b').live.st !== 'down') g.down('1b');
  g.run(300);
  press(g, `pick=${k1}`); press(g, 'aim', k1); press(g, 'hold', k1);
  const early = { rows: contactRows(s).map(r => r.id), searchable: searchableOf(s, s.player.id, s.clock.ms, { reach: false }).map(T => T.key), acc: [accountedOf(s, g.man('1a')), accountedOf(s, g.man('1b'))] };
  press(g, 'call:clear');
  g.g.step(1, { act: [stepAct('leave')] }); g.run(1200);
  return { g, s, k1, k2, rounds, early };
}

export default [
  {
    name: 'breach-search: out of reach (from your point, 3.3 m off), the row is its walk, "To him, to search" (a house move row), and T\'s cqb-rp-search names it (its \'walk\' variant, "Go to him. Search him if you want the truth now."); pressed (T), it walks you to SEARCH_WALK_M short of the nearest, searchOn says so meanwhile, and there the search\'s own row and T\'s "Search him." follow',
    fn() {
      const { g, s, k1 } = clearedRoom();
      g.enter('me', [27.5, 11.5], [27.0, 8.5]);
      if (s.stop?.mode !== 'stop') enterStop(s, g.g.bus, { via: 'shoot' });
      g.g.step(1, {});
      const row = contactRows(s).find(r => r.id === 'move:search'), W = searchWalkOf(s), line = instinctNow(s).line, inSteps = stepsOf(s).some(r => r.id === 'move:search' && !r.off);
      g.g.step(1, { act: ['instinct'] });
      let n = 0, on = 0;
      while (s.stop?.phase === 'act' && n++ < 400) { if (searchOn(s) === k1) on++; g.g.step(1, {}); }
      g.g.step(1, {});
      const me = g.g.me(), a = g.actor('1a'), dM = Math.hypot(me.x - a.x, me.z - a.z), there = contactRows(s).map(r => r.id), line2 = instinctNow(s).line;
      console.log(`      from 3.3 m: the row "${row?.label}" (${row?.kind}) to ${row?.to} in ${row?.ms} ms on ${row?.target}, on the panel ${inSteps}; T: ${line ? `${line.id}/${line.variant} "${line.text}" ${line.act}` : 'none'}; walked ${n} ticks (searchOn ${on}), then ${fmt(dM, 2)} m off him (SEARCH_WALK_M ${SEARCH_WALK_M}, SEARCH_M ${SEARCH_M}): rows ${JSON.stringify(there)}, T ${line2 ? `${line2.id} "${line2.text}" ${line2.act}` : 'none'}`);
      assert(row && row.kind === 'move' && row.label === SEARCH_WALK_LABEL && row.target === k1 && W?.key === k1 && inSteps && line?.id === 'cqb-rp-search' && line.variant === 'walk' && line.act === 'stop:move:search', JSON.stringify({ row, W, line: line && { id: line.id, act: line.act } }));
      assert(dM <= SEARCH_M && on > 0 && there.includes('contact:search') && !there.includes('move:search') && line2?.id === 'cqb-rp-search' && line2.act === 'stop:contact:search', JSON.stringify({ dM, on, there }));
    },
  },
  {
    name: 'breach-search: offered only after the room\'s "Clear!", on a man accounted for there, within SEARCH_M 1.5 m (the nearest), never out of reach, never on the live lane; T\'s line after "Clear!" names it (cqb-rp-search)',
    fn() {
      const { g, s, k1, k2, early } = clearedRoom(), H = g.H;
      const ruled = H.live.ruled.map(r => `${r.key} ${r.why} (was ${r.was})`).join(', ');
      // (from your point, 3.3 m off 1a: not in reach)
      g.enter('me', [27.5, 11.5], [27.0, 8.5]);
      if (s.stop?.mode !== 'stop') enterStop(s, g.g.bus, { via: 'shoot' });
      const far = { rows: contactRows(s).map(r => r.id), any: searchableOf(s, s.player.id, s.clock.ms, { reach: false }).map(T => T.key) };
      // (walked up to him: 0.9 m)
      g.enter('me', [27.6, 9.2], [27.0, 8.5]);
      g.g.step(1, {});
      const near = { rows: contactRows(s).map(r => `${r.id}>${r.target}`), line: instinctNow(s).line };
      const row = contactRows(s).find(r => r.id === 'contact:search');
      // (the live lane: a man down and covered, his room clear: never offered (no bangGo))
      const w = liveGame({ seed: 48213, tier: 'sgt', opfor: 'live:fight,fight', setup: 'room:2' });
      const T2 = w.s.armoury.range.turners.find(t => t.stand === '2a');
      T2.live.st = 'out'; T2.live.outWhy = 'clear'; w.H.live.ruled.push({ key: T2.key, why: 'clear', atMs: w.s.clock.ms, was: 'down' });
      const live = searchableOf(w.s, w.s.player.id, w.s.clock.ms, { reach: false }).length;
      console.log(`      before "Clear!": rows ${JSON.stringify(early.rows)}, searchable ${JSON.stringify(early.searchable)} (accounted ${early.acc.join(', ')}); at it: ${ruled}`);
      console.log(`      from your point (3.3 m): rows ${JSON.stringify(far.rows)}, searchable at any reach ${JSON.stringify(far.any)}; at 0.9 m: ${JSON.stringify(near.rows)}, the row "${row?.label}" ${row?.ms} ms in ${row?.list.length} parts; T: ${near.line ? `${near.line.id} "${near.line.text}" ${near.line.act}` : 'none'}; the live lane: ${live} searchable`);
      assert(!early.rows.includes('contact:search') && !early.searchable.length, JSON.stringify(early));
      assert(!far.rows.includes('contact:search') && far.any.includes(k1) && far.any.includes(k2), JSON.stringify(far));
      assert(row && row.target === k1 && row.label === SEARCH_LABEL && row.ms === SEARCH_MS && row.list.length === SEARCH_PARTS && near.line?.id === 'cqb-rp-search' && near.line.act === 'stop:contact:search', JSON.stringify(near));
      assert(live === 0, 'never on the live lane');
    },
  },
  {
    name: 'breach-search: belief until the search\'s last part ends (cardPhaseOf, the hit card\'s marks without holes), then the truth: T.live.searched { by, atMs }, the fact, bangGo.search back to null, his card equal to hitMarks\' truth; the other man\'s card stays belief',
    fn() {
      const { g, s, k1, k2, rounds } = clearedRoom(), H = g.H;
      g.enter('me', [27.6, 9.2], [27.0, 8.5]);
      if (s.stop?.mode !== 'stop') enterStop(s, g.g.bus, { via: 'shoot' });
      g.g.step(1, { act: [stepAct('contact:search', 'normal', k1)] });
      const rec = { ...H.bangGo.search }, during = [];
      let n = 0;
      while (s.stop?.phase === 'act' && n++ < 1000) {
        during.push(cardPhaseOf(s, k1));
        if (cardPhaseOf(s, k1) === 'truth' && s.stop?.phase === 'act') break;
        g.g.step(1, {});
      }
      const T = g.man('1a'), card = hitMarks(s, k1, { phase: cardPhaseOf(s, k1) }), truth = hitMarks(s, k1, { phase: 'truth' }), belief = hitMarks(s, k1, { phase: 'belief' });
      const fact = g.g.facts('house').find(f => f.kind === 'searched');
      console.log(`      ${rounds} rounds of yours on 1a; the search from ${rec.fromMs % 100000} ms (record ${rec.key} to ${rec.untilMs % 100000}): ${during.filter(p => p === 'belief').length} ticks in belief, then ${cardPhaseOf(s, k1)} at ${s.clock.ms % 100000} ms (${s.clock.ms - rec.fromMs} ms); searched ${JSON.stringify(T.live.searched && { ...T.live.searched, atMs: T.live.searched.atMs % 100000 })}, opforNow ${!!opforNow(s).find(m => m.key === k1).searched}, the fact ${!!fact}, the record ${JSON.stringify(H.bangGo.search)}`);
      console.log(`      his card: ${card?.words ?? 'none'} (truth: ${truth?.words ?? 'none'}; belief before: ${belief?.words ?? 'none'}); 1b's card phase ${cardPhaseOf(s, k2)}`);
      assert(rec.key === k1 && rec.untilMs - rec.fromMs === SEARCH_MS && during.every(p => p === 'belief') && during.length >= SEARCH_MS / 50 - 2, JSON.stringify({ rec, n: during.length }));
      assert(T.live.searched?.by === s.player.id && T.live.searched.atMs === rec.fromMs + SEARCH_MS && fact?.key === k1 && H.bangGo.search === null && cardPhaseOf(s, k1) === 'truth' && cardPhaseOf(s, k2) === 'belief', JSON.stringify({ searched: T.live.searched, fact }));
      assert(JSON.stringify(card) === JSON.stringify(truth) && (!truth || truth.phase === 'truth'), 'his card the truth');
      assert(!searchableOf(s).length && !contactRows(s).some(r => r.id === 'contact:search'), 'never offered twice');
    },
  },
  {
    name: 'breach-search: a search cut by a cue (a sighting: contact.js contactInput cuts it at its part\'s end, as a Breathe) leaves him unsearched and his card belief, searchOn false, and is offered again',
    fn() {
      const { g, s, k1 } = clearedRoom();
      g.enter('me', [27.6, 9.2], [27.0, 8.5]);
      if (s.stop?.mode !== 'stop') enterStop(s, g.g.bus, { via: 'shoot' });
      g.g.step(1, { act: [stepAct('contact:search', 'normal', k1)] });
      const t0 = g.H.bangGo.search.fromMs;
      // (into its second part, a window opens as the detector writes one)
      while (s.clock.ms < t0 + 6000) g.g.step(1, {});
      const on = searchOn(s), c = s.mind.contact;
      noteContact(s, { pending: { id: (c.n ?? 0) + 1, ids: [g.man('1b').key], seenMs: s.clock.ms, untilMs: s.clock.ms + 400, ms: 400, expect: null, n: 1, grade: null, roll: null, parts: [], rangeM: 3.2, whoK: 1, armed: false, goMs: 235, mx: 0, mz: 0, run: false } });
      c.n = (c.n ?? 0) + 1;
      let n = 0;
      while (s.stop?.phase === 'act' && n++ < 400) g.g.step(1, {});
      const cutAt = s.clock.ms;
      g.g.step(2, g.LEAVE);
      if (s.stop?.mode !== 'stop') enterStop(s, g.g.bus, { via: 'shoot' });
      const again = contactRows(s).some(r => r.id === 'contact:search' && r.target === k1);
      console.log(`      begun at ${t0 % 100000} ms, running at +6 s ${on}, the window at ${(t0 + 6000) % 100000}, the step over at ${cutAt % 100000} (+${cutAt - t0} ms, the part's end ${SEARCH_MS / SEARCH_PARTS} ms a part); searched ${JSON.stringify(g.man('1a').live.searched ?? null)}, card ${cardPhaseOf(s, k1)}, searchOn ${searchOn(s)}, offered again ${again}`);
      assert(on === k1 && cutAt - t0 === 2 * SEARCH_MS / SEARCH_PARTS && !g.man('1a').live.searched && cardPhaseOf(s, k1) === 'belief' && searchOn(s) === null && again, JSON.stringify({ on, cut: cutAt - t0, again }));
      // (searched in full after it)
      g.g.step(1, { act: [stepAct('contact:search', 'normal', k1)] });
      n = 0; while (s.stop?.phase === 'act' && n++ < 1000) g.g.step(1, {});
      assert(g.man('1a').live.searched && cardPhaseOf(s, k1) === 'truth', 'searched in full after');
    },
  },
];
