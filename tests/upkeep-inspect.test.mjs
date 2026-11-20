// OLYMPUS tests: the armourer's inspection (the build sheet v0.0.28 §6 A, §0 item 5, item 13; WEAPONS §10.3, §9.4; F177): his rule at the margins WEAPONS names, his verdicts and words on a state, his number, and the first-time rates by sheet and tempo against the sheet's table.
//
// src/sim/arms/upkeep.js inspect reads the gun as it comes to the window: kept for the LTI under cond 0.5, the pin's loss always
// found (he works the action), nothing to find at total 0.005 or less, else his Awareness against max(5, 30 − 400 × total) on its
// own stream (the same gun after the same cleans draws the same roll), made "Clean it again.", missed "Clean. Rack it." with his
// number. The rule is held at margins 0, 5, 7 (careful's), 8 and 10 at an armourer of 17 (WEAPONS: "a gun cleaned at margin 5 ... is
// turned back about 70% of the time ..., at margin 8 about half"); the first time through by sheet and tempo, the clean and his look
// both through check() 4,000 draws a cell, within 3 points of the sheet's §0 item 2 (tests/flawless-books.mjs firstMC).
import { assert } from './helpers.mjs';
import { armsWorld } from './arms-world.mjs';
import { inspectRows, firstMC, oddsTable, SHEET_WH, FIRST_PTS } from './flawless-books.mjs';
import { inspect, condNumber, residualOf, INSPECT_WORDS, FIND_FREE } from '../src/sim/arms/upkeep.js';

export default [
  {
    name: 'F177: WEAPONS §10.3\'s rule at an armourer of 17: a clean at margin 5 (residual 0.015, DC 24) found 70% of the time, at margin 8 half, at 10 nothing to find; margin 0 and careful\'s 7 printed',
    fn() {
      const rows = inspectRows(17);
      console.log(`      ${rows.map(r => `${r.name}: total ${r.total}, ${r.dc === null ? 'nothing to find' : `DC ${r.dc}, found ${Math.round(r.found * 100)}%`}`).join('; ')}`);
      const at = Object.fromEntries(rows.map(r => [r.margin, r]));
      assert(at[5].dc === 24 && at[5].found === 0.7 && at[8].found === 0.5 && at[10].dc === null && at[10].found === 0 && at[0].found === 0.95 && at[7].found === 0.6, JSON.stringify(rows));
    },
  },
  {
    name: 'F177: the inspection on a state: spotless passes with no roll and his number ("Clean. Rack it. Condition 0.93."); carbon he finds is "Carbon on the carrier. Clean it again.", grit "Grit in the action. ..."; a lost pin always found; under 0.5 kept for the LTI; the same gun draws the same roll',
    fn() {
      const w = armsWorld({ awareness: 17 }), s = w.state, gun = s.items[w.gunId], look = () => inspect(s, w.gunId, { armourerId: w.coachId });
      const spotless = (gun.foul = 0.003, look());
      // (his look after each of twelve cleans: a stream each, some found, some missed)
      const twelve = () => Array.from({ length: 12 }, (_, n) => { gun.cleans = n; return look(); });
      gun.foul = residualOf(5);
      const tried = twelve(), found = tried.find(v => v.verdict === 'again'), missed = tried.find(v => v.verdict === 'pass');
      gun.cleans = tried.indexOf(found); const again = look();
      delete gun.foul; gun.dust = 0.02;
      const grit = twelve().find(v => v.verdict === 'again') ?? null;
      gun.fault = 'pin'; const pin = look(); delete gun.fault;
      gun.cond = 0.45; const keep = look(); gun.cond = 0.93;
      console.log(`      spotless (total ${spotless.total}): ${spotless.verdict}, roll ${spotless.roll}, "${spotless.words}"`);
      console.log(`      margin 5 over 12 cleans: found ${tried.filter(v => v.verdict === 'again').length}, missed ${tried.filter(v => v.verdict === 'pass').length}; found: DC ${found?.dc}, ${found?.roll?.roll} + ${found?.roll?.value} = ${found?.roll?.total}, "${found?.words}"; missed: "${missed?.words}"`);
      console.log(`      grit: "${grit?.words}"; the pin: ${pin.verdict}, "${pin.words}"; at cond 0.45: ${keep.verdict}, "${keep.words}"; his number for 0.93 "${condNumber({ cond: 0.93 })}", 0.927 "${condNumber({ cond: 0.927 })}"`);
      assert(spotless.verdict === 'pass' && spotless.roll === null && spotless.words === `${INSPECT_WORDS.pass} Condition 0.93.` && spotless.total <= FIND_FREE, JSON.stringify(spotless));
      assert(found && missed && found.words === INSPECT_WORDS.carbon && found.dc === 24 && missed.words === `${INSPECT_WORDS.pass} Condition 0.93.` && JSON.stringify(again) === JSON.stringify(found), JSON.stringify({ found, missed, again }));
      assert(grit?.words === INSPECT_WORDS.grit && pin.verdict === 'pin' && pin.words === INSPECT_WORDS.pin && keep.verdict === 'keep' && condNumber({ cond: 0.927 }) === '0.93', JSON.stringify({ grit, pin, keep }));
    },
  },
  {
    name: 'F177: the first time through the window by sheet and tempo, the clean and the armourer\'s look both through check() 4,000 draws a cell, within 3 points of the sheet\'s §0 item 2, and the closed form within 3 of it too',
    fn() {
      const rows = oddsTable(), off = [];
      for (const r of rows) {
        r.mc = firstMC(SHEET_WH[r.sheet], r.tempo, 4000) * 100;
        if (Math.abs(r.mc - r.want[2]) > FIRST_PTS || Math.abs(r.first - r.want[2]) > FIRST_PTS) off.push(r);
      }
      for (const sheet of Object.keys(SHEET_WH)) console.log(`      ${sheet.padEnd(8)} ${rows.filter(r => r.sheet === sheet).map(r => `${r.tempo} ${r.mc.toFixed(1)}% (closed ${r.first.toFixed(1)}%, the sheet ${r.want[2]}%)`).join(' | ')}`);
      assert(!off.length, JSON.stringify(off));
    },
  },
];
