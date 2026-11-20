// OLYMPUS tests: upkeep's numbers (the build sheet v0.0.28 §6 A, F184; WEAPONS §9.1, §9.2, §9.3, §9.5): the dust's three reference cases and its linearity, the dirt's factor, the barrel's heat as a lazy number, a round's carbon and the lube's rounds, and a span of rounds as the rounds themselves.
//
// src/sim/arms/upkeep.js moves the four numbers the reliability formulas read: these hold its formulas to WEAPONS' own reference
// figures (tests/flawless-books.mjs dustCases and heatRows) and its writers to one another (dustOver a span against the span a
// minute at a time; firedOutcome, a relay behind its splash, against the same rounds pulled one by one with upkeep live).
import { assert } from './helpers.mjs';
import { dustCases, linearOver, heatRows, HEAT_ROW_K } from './flawless-books.mjs';
import { dirtOf, barrelNow, coolBarrel, heatTauOf, roundFired, firedOutcome, FOUL, LUBE_ROUNDS, HEAT_DROP_C } from '../src/sim/arms/upkeep.js';
import { pull } from '../src/sim/arms/firearms.js';
import { stream } from '../src/core/rng.js';

export default [
  {
    name: 'F184: the dust is WEAPONS §9.2\'s one formula: a calm field day with the covers shut 0.048, two hours prone on regolith with the port open 0.144, an hour of storm 0.12 (0.18 with wet lube), within 1e-9; a span in one call is the span stepped a minute at a time, a magazine taking half',
    fn() {
      const cases = dustCases(), lin = linearOver(120);
      for (const c of cases) console.log(`      ${c.name}: ${c.got} (WEAPONS ${c.want})`);
      console.log(`      120 minutes prone in a breeze, the port open: one call ${lin.one}, a minute at a time ${lin.stepped}; a magazine ${lin.magOne} and ${lin.magStepped}`);
      for (const c of cases) assert(Math.abs(c.got - c.want) <= 1e-9, JSON.stringify(c));
      assert(Math.abs(lin.one - lin.stepped) <= 1e-9 && Math.abs(lin.magOne - lin.magStepped) <= 1e-9 && Math.abs(lin.magOne - lin.one / 2) <= 1e-9, JSON.stringify(lin));
    },
  },
  {
    name: 'F184: the dirt slows a clean by 1 + foul + 1.6 × dust, at most 2: the relay\'s calm, breezy and gusty airs (18 rounds\' carbon, 40 minutes prone with the port open) 1.098, 1.214 and 1.367; a clean rifle 1; a storm\'s rifle held at 2',
    fn() {
      const relay = [['calm', 0.048], ['breezy', 0.12], ['gusty', 0.216]].map(([air, dust]) => ({ air, dust, dirt: dirtOf({ type: 'gun', foul: 18 * FOUL, dust }) }));
      const clean = dirtOf({ type: 'gun' }), storm = dirtOf({ type: 'gun', foul: 0.3, dust: 0.9 });
      console.log(`      ${relay.map(r => `${r.air} (dust ${r.dust}): ${r.dirt.toFixed(4)}`).join('; ')}; clean ${clean}; a storm's ${storm}`);
      assert(Math.abs(relay[0].dirt - 1.0984) < 1e-9 && Math.abs(relay[1].dirt - 1.2136) < 1e-9 && Math.abs(relay[2].dirt - 1.3672) < 1e-9, JSON.stringify(relay));
      assert(clean === 1 && storm === 2, JSON.stringify({ clean, storm }));
    },
  },
  {
    name: 'F184: the barrel is a lazy number fitted to WEAPONS §9.5 (Newton\'s cooling, τ 186 s on Melas\'s air, 230 s in a 66 kPa hull): Melas\'s four R-7 rows and the hull\'s cooling rows within 7% (its two peaks in the next case); a cool barrel is the air\'s and its record dropped within 1 °C; an air with no τ (vacuum) throws',
    fn() {
      const rows = heatRows().filter(r => !r.hullPeak);
      for (const r of rows) console.log(`      ${r.name}: ${r.got.toFixed(1)} (WEAPONS ${r.want}), ${(r.off * 100).toFixed(1)}%`);
      for (const r of rows) assert(r.enforced && Math.abs(r.off) <= HEAT_ROW_K, JSON.stringify(r));
      const air = { air: 'mars-melas', airC: -10 }, g = { type: 'gun', model: 'r7' };
      const cold = barrelNow(g, 5000, air);
      roundFired(g, { ms: 0, air });
      const warm = g.barrelC, later = barrelNow(g, 186_000, air);
      coolBarrel(g, 60_000, air); const kept = g.barrelC !== undefined;
      coolBarrel(g, 600_000, air); const dropped = g.barrelC === undefined && g.heatMs === undefined;
      let threw = null; try { heatTauOf({ air: 'vacuum', airC: 0 }); } catch (e) { threw = e.message; }
      console.log(`      Melas at −10 °C: a cool barrel ${cold} °C; one round ${warm} °C, a τ later ${later.toFixed(3)} °C; a minute after it still over the air by more than ${HEAT_DROP_C} °C, kept: ${kept}; ten minutes later within ${HEAT_DROP_C} °C and dropped: ${dropped}; vacuum: "${threw}"`);
      assert(cold === -10 && warm === -7.5 && Math.abs(later - (-10 + 2.5 / Math.E)) < 1e-9 && kept && dropped && /no barrel cooling/.test(threw ?? ''), JSON.stringify({ cold, warm, later, kept, dropped, threw }));
    },
  },
  {
    name: 'F184 (OPEN, the lead\'s question): the 66 kPa hull\'s two R-7 peaks within 7% of WEAPONS §9.5 (288 °C at 30 a minute for 30 min, 527 °C at 90 a minute for 4 min); Newton\'s cooling alone at τ 230 s reads them hot, the radiation that carries the hot end cut by the sheet\'s §0 item 9, and no τ meets all six hull rows: red until the lead re-reads the row or the radiation is built (the review of v0.0.28 A: never read round its failure)',
    fn() {
      const rows = heatRows().filter(r => r.hullPeak);
      for (const r of rows) console.log(`      ${r.name}: ${r.got.toFixed(1)} (WEAPONS ${r.want}), ${(r.off * 100).toFixed(1)}% against ±${HEAT_ROW_K * 100}%${Math.abs(r.off) <= HEAT_ROW_K ? '' : ' MISSED'}`);
      for (const r of rows) assert(r.enforced && Math.abs(r.off) <= HEAT_ROW_K, JSON.stringify(r));
    },
  },
  {
    name: 'F184: the relay leaves the barrel at the air\'s (the sheet\'s §0 item 9, item 7): its 18 rounds on Melas\'s air, one each 133 s, read at the relay\'s end five minutes or more after the last round keep no barrelC or heatMs (4.9 °C over the air read at the last round itself); an air with no barrel cooling (liveOpts\' air null) keeps none and counts the carbon',
    fn() {
      const air = { air: 'mars-melas', airC: -10 }, n = 18, gapS = 133, lastMs = n * gapS * 1000;
      const atLast = { type: 'gun', model: 'r7', lube: 'dry' }; firedOutcome(atLast, n, { ms: lastMs, gapS, air });
      const atEnd = { type: 'gun', model: 'r7', lube: 'dry' }; firedOutcome(atEnd, n, { ms: lastMs, gapS, air, endMs: lastMs + 5 * 60_000 });
      const none = { type: 'gun', model: 'r7', lube: 'dry' }; firedOutcome(none, n, { ms: lastMs, gapS, air: null });
      const one = { type: 'gun', model: 'r7' }; roundFired(one, { ms: 0, air: null });
      let threw = null; try { roundFired({ type: 'gun', model: 'r7' }, { ms: 0 }); } catch (e) { threw = e.message; }
      console.log(`      read at the last round: barrel ${atLast.barrelC} °C (${(atLast.barrelC - air.airC).toFixed(2)} over the air); read 5 min on: barrelC ${atEnd.barrelC}, heatMs ${atEnd.heatMs}, foul ${atEnd.foul}, ${atEnd.rounds} rounds`);
      console.log(`      no barrel cooling (air null): barrelC ${none.barrelC}, foul ${none.foul}; one round ${JSON.stringify(one)}; an air left out: "${threw}"`);
      assert(atLast.barrelC !== undefined && atEnd.barrelC === undefined && atEnd.heatMs === undefined && atEnd.rounds === n && Math.abs(atEnd.foul - n * FOUL) < 1e-9, JSON.stringify({ atLast, atEnd }));
      assert(none.barrelC === undefined && none.heatMs === undefined && Math.abs(none.foul - n * FOUL) < 1e-9 && one.barrelC === undefined && one.foul === FOUL && /no temperature/.test(threw ?? ''), JSON.stringify({ none, one, threw }));
    },
  },
  {
    name: 'F184: a round fired puts 0.0012 of carbon in (×1.5 suppressed) and the lube runs out 300 rounds after it was put on; a relay behind its splash (firedOutcome) leaves the gun the same rounds pulled one by one with upkeep live leave it',
    fn() {
      const air = { air: 'mars-melas', airC: -10 }, a = { type: 'gun', model: 'r7' }, s = { type: 'gun', model: 'r7' };
      roundFired(a, { ms: 0, air }); roundFired(s, { ms: 0, air, suppressor: true });
      const lube = { type: 'gun', model: 'r7', lube: 'dry', rounds: LUBE_ROUNDS - 1, lubeRd: 0 };
      roundFired(lube, { ms: 0, air }); const before = lube.lube; lube.rounds = LUBE_ROUNDS; roundFired(lube, { ms: 1000, air });
      // (18 rounds over the relay's 40 minutes, a round each 133 s, the last at 40 min: behind the splash, and pulled one by one)
      const n = 18, gapS = 40 * 60 / n, endMs = 40 * 60_000, sk = { type: 'gun', model: 'r7', cond: 0.93, lube: 'dry' };
      firedOutcome(sk, n, { ms: endMs, gapS, air });
      const lv = { type: 'gun', model: 'r7', cond: 0.93, lube: 'dry', mode: 'semi', chamber: 'live' }, mag = { type: 'mag', fam: 'had30', n: 30, load: 'ball' }, rng = stream(48213, 'upkeep', 'relay');
      for (let k = 0; k < n; k++) { const r = pull(rng, lv, mag, { live: true, ms: Math.round(endMs - (n - 1 - k) * gapS * 1000), air }); assert(r.fired && !r.stoppage, JSON.stringify(r)); }
      coolBarrel(lv, endMs, air);
      const keys = ['rounds', 'cond', 'foul', 'lube', 'barrelC', 'heatMs', 'portOpen'], pick = (g) => Object.fromEntries(keys.map(k => [k, g[k]]));
      console.log(`      one round ${a.foul}, suppressed ${s.foul}; the lube at round ${LUBE_ROUNDS - 1}: '${before}', at ${LUBE_ROUNDS}: '${lube.lube}'`);
      console.log(`      the breezy relay's ${n} rounds behind the splash: ${JSON.stringify(pick(sk))}; pulled: ${JSON.stringify(pick(lv))}`);
      assert(a.foul === FOUL && Math.abs(s.foul - FOUL * 1.5) < 1e-12 && before === 'dry' && lube.lube === 'none', JSON.stringify({ a, s, before, lube }));
      assert(JSON.stringify(pick(sk)) === JSON.stringify(pick(lv)) && sk.rounds === n && Math.abs(sk.foul - n * FOUL) < 1e-9, JSON.stringify({ sk: pick(sk), lv: pick(lv) }));
    },
  },
];
