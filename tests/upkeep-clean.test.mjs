// OLYMPUS tests: the bench (the build sheet v0.0.28 §6 A, §0 items 1 to 3, items 10, 11; F185): the three tempos' odds against the sheet's table, the struck rows' words, the round found at the strip, the hands after, and a clean lived against the same clean skipped.
//
// src/sim/arms/upkeep.js cleanOdds is the closed form of the very roll cleanEnd makes (checks.js check(): Weapon handling DC 9 on
// the R-7, pressure none, procedure, TEMPO's rushed, normal or careful), so the row's spotless chance is the dice's: here it is held
// to the sheet's §0 item 2 on the six sheets (spotless and bad exact in whole percent, the minutes within a minute of the table's
// rounding), to check() face by face (tests/flawless-books.mjs faceRows) and, heavy, to check()'s Monte Carlo (40,000 tries a cell,
// within 2 points). The activity (src/data/activities.js clean-rifle, clean-again; src/sim/time/activities.js) is played in the
// sandbox on a rifle materialised onto the player, the gate set: its strip finds a round the belief missed, its end soils the hands
// and leaves the gun as cleanEnd says, and a clean lived tick by tick and the same clean skipped give the same roll, gun and hands.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { armsWorld, sheetFor } from './arms-world.mjs';
import { oddsTable, faceRows, mcClean, SHEET_WH, BREEZY } from './flawless-books.mjs';
import { cleanOdds, cleanOddsOf, cleanMs, cleanOff, cleanEnd, residualOf, CLEAN_WORDS, CLEAN_TEMPOS, RESIDUAL_AT } from '../src/sim/arms/upkeep.js';
import { ACTIVITIES } from '../src/data/activities.js';
import { startActivity } from '../src/sim/time/activities.js';
import { materialise, move } from '../src/sim/arms/kit.js';
import { HANDS } from '../src/data/body/needs.js';
import { handsWords } from '../src/sim/body/cues.js';
import { handsIndex } from '../src/sim/body/hygiene.js';

// (the sandbox with the range's rifle on the player, the gate set, a Weapon handling of wh; the gun's upkeep fields given)
function bench({ wh = 10, gun = {}, seed = 48213 } = {}) {
  const g = createGame({ scenario: 'sandbox', seed }), s = g.state, pid = s.player.id, kit = materialise(s, pid, 'range-fam');
  s.people[pid].skills = sheetFor({ weapons: wh, marksmanship: 10, awareness: 10, fitness: 12 });
  s.armoury.upkeep = true;
  Object.assign(s.items[kit.gunId], { lube: 'dry', ...gun });
  return { g, s, pid, gunId: kit.gunId };
}
// (a clean begun and run to its end: by the skip (outcome) or tick by tick (live))
function cleanRun(b, id, args, force) {
  const r = startActivity(b.s, b.g.bus, { sim: b.g.sim }, { id, args, force });
  let n = 0; while ((b.s.time.doing || b.s.skip) && n++ < 50_000) b.g.step(1);
  const out = b.g.facts('activity').filter(f => f.phase === 'end').at(-1)?.outcome ?? null, roll = b.s.log.filter(e => e.kind === 'roll').at(-1)?.roll ?? null;
  return { start: r, ticks: n, outcome: out, roll, gun: b.s.items[b.gunId], hands: b.s.people[b.pid].body?.hands ?? null, ms: b.s.clock.ms };
}

export default [
  {
    name: 'F185: the row\'s spotless chance and the bad grade are the bench roll\'s own closed form, equal to the sheet\'s §0 item 2 on the six sheets at each tempo (whole percent; the minutes within a minute of its rounding) and to checks.js check() face by face; cleanOdds reads the person and the armourer on a state',
    fn() {
      const rows = oddsTable(), bad = [];
      for (const r of rows) {
        const f = faceRows(SHEET_WH[r.sheet], r.tempo), o = cleanOddsOf({ value: SHEET_WH[r.sheet], tempo: r.tempo });
        const [min, spot, , badPct] = r.want;
        if (r.spotless !== spot || r.bad !== badPct || Math.abs(r.min - min) > 1 || o.spotless !== f.spotless || o.bad !== f.bad) bad.push({ ...r, faces: f });
      }
      for (const sheet of Object.keys(SHEET_WH)) console.log(`      ${sheet.padEnd(8)} ${rows.filter(r => r.sheet === sheet).map(r => `${r.tempo} ${r.min.toFixed(1)} min · ${r.spotless}% spotless · bad ${r.bad}% (the sheet: ${r.want[0]} · ${r.want[1]}% · ${r.want[3]}%)`).join(' | ')}`);
      const w = armsWorld({ wh: 10, awareness: 17 }), gun = w.state.items[w.gunId];
      Object.assign(gun, BREEZY);
      const onState = Object.fromEntries(CLEAN_TEMPOS.map(t => [t, { min: cleanMs(w.state, w.pid, w.gunId, t) / 60_000, ...cleanOdds(w.state, w.pid, w.gunId, t, { armourerId: w.coachId }) }]));
      console.log(`      on a state (the private, the breezy relay's rifle, an armourer of 17): ${CLEAN_TEMPOS.map(t => `${t} ${onState[t].min.toFixed(1)} min, ${Math.round(onState[t].spotless * 100)}% spotless, first ${Math.round(onState[t].first * 100)}%`).join('; ')}`);
      assert(!bad.length, JSON.stringify(bad));
      assert(Math.abs(onState.normal.min - 36.43) < 0.01 && onState.normal.spotless === 0.65 && Math.abs(onState.normal.first - 0.76) < 0.01 && onState.rushed.spotless === 0.5 && onState.careful.spotless === 0.75, JSON.stringify(onState));
    },
  },
  {
    name: 'F185: a clean is struck while the rifle is not believed clear, in the row\'s words: "Nothing in your hands to clean.", "Clear it first." (a believed stoppage), "Magazine out first.", "Check the chamber first." (a \'?\' chamber too); a Condition 4 rifle is not struck; startActivity refuses a struck one in the same words',
    fn() {
      const w = armsWorld({ wh: 10 }), s = w.state, gun = s.items[w.gunId];
      const words = {};
      words.clear = cleanOff(s, w.pid, w.gunId);
      gun.belief = { chamber: '?' }; words.unsure = cleanOff(s, w.pid, w.gunId);
      gun.belief = { chamber: 'live' }; words.live = cleanOff(s, w.pid, w.gunId);
      gun.belief = { chamber: 'case', stoppage: 'felt' }; words.stoppage = cleanOff(s, w.pid, w.gunId);
      gun.belief = { chamber: 'empty' };
      const magId = w.magIds[0]; move(s, magId, { gun: w.gunId }); words.mag = cleanOff(s, w.pid, w.gunId);
      words.nobody = cleanOff(s, w.coachId, w.gunId); words.none = cleanOff(s, w.pid, null);
      const b = bench({ wh: 10 }); b.s.items[b.gunId].belief = { chamber: '?' };
      const r = startActivity(b.s, b.g.bus, { sim: b.g.sim }, { id: 'clean-rifle', args: { tempo: 'normal' } });
      const said = b.g.facts('line').at(-1)?.text ?? null;
      console.log(`      ${Object.entries(words).map(([k, v]) => `${k}: ${v === null ? 'not struck' : `"${v}"`}`).join('; ')}`);
      console.log(`      startActivity on a '?' chamber: ${JSON.stringify(r)}, said "${said}"`);
      assert(words.clear === null && words.unsure === CLEAN_WORDS.chamber && words.live === CLEAN_WORDS.chamber && words.stoppage === CLEAN_WORDS.stoppage && words.mag === CLEAN_WORDS.mag && words.nobody === CLEAN_WORDS.nothing && words.none === CLEAN_WORDS.nothing, JSON.stringify(words));
      assert(!r.ok && said === CLEAN_WORDS.chamber && !b.s.time.doing, JSON.stringify({ r, said }));
    },
  },
  {
    name: 'F185: the clean as an activity: a live round the belief missed drops out on the mat at the strip (the outcome says so), the bench\'s roll at its end leaves dust 0, the Corps\' dry film and foul the residual of its margin, the hands "Gun oil and carbon on your hands." (40), the function check in the log',
    fn() {
      const b = bench({ wh: 10, gun: { foul: BREEZY.foul, dust: BREEZY.dust, chamber: 'live', lube: 'none' } });
      const r = cleanRun(b, 'clean-rifle', { tempo: 'normal' }, null);
      const hands = r.hands, words = hands ? handsWords(handsIndex(hands.dirt), hands.why) : null, texts = b.s.log.slice(-6).map(e => e.text).filter(Boolean);
      console.log(`      ${JSON.stringify(r.start)}; the outcome ${JSON.stringify({ found: r.outcome.found, grade: r.outcome.grade, margin: r.outcome.margin, residual: r.outcome.residual, fault: r.outcome.fault })}`);
      console.log(`      the gun after: ${JSON.stringify(r.gun)}; the hands ${JSON.stringify(hands)}: "${words}"`);
      console.log(`      the log: ${texts.join(' | ')}`);
      assert(r.start.ok && r.start.kind === 'outcome' && r.outcome.found === 'live' && r.gun.chamber === undefined && texts.includes(CLEAN_WORDS.round) && texts.includes(CLEAN_WORDS.check), JSON.stringify(r.outcome));
      assert(r.gun.dust === undefined && r.gun.lube === 'dry' && (r.gun.foul ?? 0) === r.outcome.residual && r.outcome.residual === Math.max(0, Math.round((RESIDUAL_AT - 0.003 * r.outcome.margin) * 1e6) / 1e6) && r.gun.cleans === 1, JSON.stringify(r.gun));
      assert(hands && hands.dirt >= HANDS.CLEAN && hands.why === 'rifle' && words === 'Gun oil and carbon on your hands.', JSON.stringify({ hands, words }));
    },
  },
  {
    name: 'F185: a clean lived tick by tick and the same clean skipped give the same roll, the same gun and the same hands (WEAPONS §16\'s parity: the roll on stream(seed, \'clean\', gun, n)): "Clean it again", rushed, at Weapon handling 42',
    fn() {
      const gun = { foul: 0.03, dust: 0.05, cleans: 1 };
      const skipped = cleanRun(bench({ wh: 42, gun }), 'clean-again', { tempo: 'rushed' }, 'outcome'), lived = cleanRun(bench({ wh: 42, gun }), 'clean-again', { tempo: 'rushed' }, 'live');
      const same = (k) => JSON.stringify(skipped[k]) === JSON.stringify(lived[k]);
      console.log(`      skipped: ${skipped.start.kind} in ${skipped.ticks} tick, lived: ${lived.start.kind} in ${lived.ticks} ticks, both ${skipped.start.durMs / 1000} s; the roll ${skipped.roll.roll} + ${skipped.roll.value} ${skipped.roll.mods.map(m => `${m.v} (${m.why})`).join(' ')} = ${skipped.roll.total} against ${skipped.roll.dc}, ${skipped.roll.grade}`);
      console.log(`      the roll ${same('roll') ? 'the same' : 'DIFFERS'}, the gun ${same('gun') ? 'the same' : 'DIFFERS'} (${JSON.stringify(lived.gun)}), the hands ${same('hands') ? 'the same' : 'DIFFERS'}, the clock ${skipped.ms === lived.ms ? 'the same' : 'DIFFERS'}`);
      assert(skipped.start.kind === 'outcome' && lived.start.kind === 'live' && lived.ticks > 3000 && same('roll') && same('gun') && same('hands') && skipped.ms === lived.ms && lived.gun.cleans === 2, JSON.stringify({ skipped, lived }));
    },
  },
  {
    name: 'F185: "Clean it again" never adds carbon: from a rifle turned back at 0.015 (a margin-5 clean) the re-clean leaves the lesser of its residual and what it had, on the six sheets at each tempo over 20 rolls a cell, and its row\'s odds read that; "Clean it again" by its activity at Weapon handling 4, rushed, the same (the review of v0.0.28 A: the re-clean wrote a fresh residual, up to 0.03)',
    fn() {
      const FROM = 0.015, rows = [];
      for (const [sheet, wh] of Object.entries(SHEET_WH)) {
        const b = bench({ wh, gun: { foul: FROM, cleans: 1 } }), gun = b.s.items[b.gunId];
        for (const tempo of CLEAN_TEMPOS) {
          let up = 0, worst = 0, fresh = 0, n = 0;
          for (let c = 1; c <= 20; c++) {
            Object.assign(gun, { foul: FROM, cleans: c }); delete gun.fault;
            const r = cleanEnd(b.s, b.g.bus, b.pid, b.gunId, { tempo, again: true }), foul = gun.foul ?? 0;
            n++; if (foul > FROM) up++; worst = Math.max(worst, foul);
            if (residualOf(r.margin) > FROM) fresh++;
            assert(foul === (r.residual ?? 0) && foul === Math.min(FROM, residualOf(r.margin)), JSON.stringify({ sheet, tempo, c, foul, r: { margin: r.margin, residual: r.residual } }));
          }
          Object.assign(gun, { foul: FROM }); delete gun.fault;
          const o = cleanOdds(b.s, b.pid, b.gunId, tempo, { again: true }), first = cleanOdds(b.s, b.pid, b.gunId, tempo);
          rows.push({ sheet, tempo, n, up, worst, fresh, spotless: o.spotless, firstSpotless: first.spotless });
        }
      }
      const act = bench({ wh: 4, seed: 1, gun: { foul: FROM, cleans: 1 } }), ran = cleanRun(act, 'clean-again', { tempo: 'rushed' }, 'outcome');
      const clean = bench({ wh: 4, gun: { foul: 0.004, cleans: 1 } }), atFree = cleanOdds(clean.s, clean.pid, clean.gunId, 'rushed', { again: true });
      for (const sheet of Object.keys(SHEET_WH)) console.log(`      ${sheet.padEnd(8)} ${rows.filter(r => r.sheet === sheet).map(r => `${r.tempo} ${r.up} of ${r.n} raised (a fresh residual over ${FROM} on ${r.fresh}), at most ${r.worst}, spotless ${(r.spotless * 100).toFixed(0)}%`).join('; ')}`);
      console.log(`      the activity, WH 4 rushed on seed 1: margin ${ran.outcome?.margin}, residual ${ran.outcome?.residual}, the rifle's carbon ${FROM} to ${ran.gun.foul ?? 0}; from 0.004 the re-clean's row reads spotless ${(atFree.spotless * 100).toFixed(0)}% (all but its bad grade's ${(atFree.bad * 100).toFixed(0)}%, the pin lost)`);
      assert(rows.every(r => r.up === 0 && r.worst <= FROM && r.spotless === r.firstSpotless) && rows.some(r => r.fresh > 0), JSON.stringify(rows));
      assert(ran.start.ok && (ran.gun.foul ?? 0) <= FROM && (ran.gun.foul ?? 0) === ran.outcome.residual && Math.abs(atFree.spotless - (1 - atFree.bad)) < 1e-12, JSON.stringify({ outcome: ran.outcome, gun: ran.gun, atFree }));
    },
  },
  {
    name: 'F185: the clean\'s end lines say what was done, never what the armourer will find (the review of v0.0.28 A: every spotless clean read "The armourer will still find something.")',
    fn() {
      const lines = ['clean-rifle', 'clean-again'].flatMap(id => ACTIVITIES[id].log.map(t => ({ id, t })));
      const ahead = lines.filter(l => /armourer|inspect|find/i.test(l.t));
      for (const l of lines) console.log(`      ${l.id}: "${l.t}"`);
      assert(lines.length === 8 && !ahead.length, JSON.stringify(ahead));
    },
  },
  {
    name: 'F185 (heavy): the bench\'s Monte Carlo through check(), 40,000 tries a cell on the six sheets at each tempo, within 2 points of the closed form; and the private\'s whole clean lived and skipped the same',
    heavy: true,
    fn() {
      const off = [];
      for (const [sheet, wh] of Object.entries(SHEET_WH)) {
        const line = [];
        for (const tempo of CLEAN_TEMPOS) {
          const mc = mcClean(wh, tempo, 40_000), o = cleanOddsOf({ value: wh, tempo });
          line.push(`${tempo} ${(mc.spotless * 100).toFixed(1)}% (${(o.spotless * 100).toFixed(0)}%) bad ${(mc.bad * 100).toFixed(1)}%`);
          if (Math.abs(mc.spotless - o.spotless) > 0.02 || Math.abs(mc.bad - o.bad) > 0.02) off.push({ sheet, tempo, mc, o });
        }
        console.log(`      ${sheet.padEnd(8)} ${line.join(' | ')}`);
      }
      const gun = { foul: BREEZY.foul, dust: BREEZY.dust };
      const skipped = cleanRun(bench({ wh: 10, gun }), 'clean-rifle', { tempo: 'normal' }, 'outcome'), lived = cleanRun(bench({ wh: 10, gun }), 'clean-rifle', { tempo: 'normal' }, 'live');
      const same = ['roll', 'gun', 'hands'].every(k => JSON.stringify(skipped[k]) === JSON.stringify(lived[k])) && skipped.ms === lived.ms;
      console.log(`      the private's clean after the breezy relay: ${lived.start.durMs / 60_000} min, lived in ${lived.ticks} ticks and skipped: ${same ? 'the same roll, gun and hands' : 'DIFFER'}`);
      assert(!off.length, JSON.stringify(off));
      assert(same && lived.start.kind === 'live', JSON.stringify({ skipped, lived }));
    },
  },
];
