// OLYMPUS tests: "Hold to hold", the shoot house's lane on the Wreck at Phobos (v0.0.25; its build sheet §1 item 1, §3.3, §6 C; F125).
//
// The Wreck is the house's lane on a second set of authored data, selected by the operation record's `ship: 'wreck'`, played as its own
// scenario 'test-zerocqb' (game.js specOf holds one host a scenario). These hold its frame: its spec resolves and every other scene's
// still does (no "different hosts" throw); the Tests menu leaves it out while `menu` is false (main.js scenes()'s filter), the URL plays
// it; the lane's due with four compartments and no hall is the house's four slots (two.js legsOf, shoothouse.js legDueMs: 450, 495, 540,
// 585 s); the URL's house options and kit are dropped with one toast (debug.js shipChoice); a pop-up rises over POPUP_MS 400 (turners.js
// facingOf), a turner as built; the plan view draws a panel a deck (houseplan.js planFrame's cuts), the house's frame as before; and
// "Again as …" replays the game's own scenario. The lane to the card on every sheet is its own case below (F125's first half).
import { assert } from './helpers.mjs';
import { specOf, SCENARIOS } from '../src/sim/game.js';
import { SCENES, SCENE_IDS, STARTS } from '../src/data/scenes.js';
import { legDueMs, againAsHouse, LANE_MAX_MS, LANE_KEEP_MS, LEG_LAST_MS } from '../src/sim/scenarios/shoothouse.js';
import { legsOf } from '../src/sim/combat/two.js';
import { shipChoice, SHIP_DROPPED, houseChoice, SETUPS, readParams } from '../src/core/debug.js';
import { facingOf, TURN_MS, POPUP_MS, seenAtMs } from '../src/sim/arms/turners.js';
import { planFrame, toPx, PANEL_SEP_M } from '../src/ui/cards/houseplan.js';
import { wreckLane, deadEnds, laneLine } from './flawless-wreck.mjs';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';

const leg = () => ({ state: 'ahead' });

export default [
  {
    name: 'the Wreck\'s scene (F125): its own scenario, its spec and every other resolving (no "different hosts" throw), on the void site, by URL only while its menu is false',
    fn() {
      const bad = [];
      for (const id of [...Object.keys(SCENES), ...Object.keys(STARTS)]) { try { specOf({ scene: id }); } catch (e) { bad.push(`${id}: ${e.message}`); } }
      for (const sc of Object.keys(SCENARIOS)) { try { specOf({ scenario: sc }); } catch (e) { bad.push(`${sc}: ${e.message}`); } }
      const W = specOf({ scene: 'test-zerocqb' }), menu = SCENE_IDS.map(id => SCENES[id]).filter(rec => rec.menu !== false).map(rec => rec.id);
      const url = readParams('?play=test-zerocqb&setup=tug&tier=sgt');
      console.log(`      ${W.id} "${W.title}": scenario ${W.scenario}, ship ${W.ship}, course ${W.course}, host ${JSON.stringify(W.host)}, env ${W.env.preset}, tug ${JSON.stringify(W.tug)}, familiar ${W.familiar}, menu ${W.menu}; specs refused ${bad.length}`);
      console.log(`      the Tests menu (${menu.length}): …${menu.slice(-3).join(', ')}; the URL's setup ${url.setup}, tier ${url.tier}`);
      assert(!bad.length, bad.join('; '));
      assert(W.scenario === 'test-zerocqb' && SCENARIOS['test-zerocqb'] && W.ship === 'wreck' && W.course === 'house' && W.host.site === 'phobos-void' && W.host.area === 'phobos.void.wreck' && W.env.preset === 'site', JSON.stringify(W));
      // (re-read at v0.0.27's integration: "Away the boarding party" joins the Tests menu last, after "Hold to hold" (the ships together, its
      // build sheet §14 item 22), so the Wreck is the last but one, after "Secure for burn", and only the hauler after it)
      assert(SCENE_IDS.includes('test-zerocqb') && (W.menu === false ? !menu.includes('test-zerocqb') : menu.at(-2) === 'test-zerocqb' && menu.at(-1) === 'test-collar' && menu.at(-3) === 'test-burn'), JSON.stringify(menu));
      assert(['go', 'trunk', 'hold', 'tug'].every(k => SETUPS.includes(k)) && url.setup === 'tug', SETUPS.join());
      assert(W.tug.kind === 'burn' && W.tug.toG === 0.2 && W.tug.warnS === 15 && W.tug.holdS === 3 && W.tug.atS[0] === 60 && W.tug.atS[1] === 60, JSON.stringify(W.tug));
    },
  },
  {
    name: 'the Wreck\'s lane due (its build sheet §0 item 1): four compartments and no hall are the house\'s four slots, 450, 495, 540 and 585 s from GO, never five from 405 s',
    fn() {
      const H = { goAtMs: 0, cur: 0, rooms: [leg(), leg(), leg(), leg()], hall: null }, house = { goAtMs: 0, cur: 0, rooms: [leg(), leg(), leg()], hall: leg() };
      const due = [0, 1, 2, 3].map(k => legDueMs(H, k) / 1000), dueHouse = [0, 1, 2, 3].map(k => legDueMs(house, k) / 1000);
      console.log(`      legs ${legsOf(H).length} (the house ${legsOf(house).length}); due ${due.join(', ')} s (the house ${dueHouse.join(', ')} s); LANE_MAX_MS ${LANE_MAX_MS}, LANE_KEEP_MS ${LANE_KEEP_MS}, LEG_LAST_MS ${LEG_LAST_MS}`);
      assert(legsOf(H).length === 4 && !legsOf(H).includes(null), 'four legs, no hall');
      assert(JSON.stringify(due) === JSON.stringify([450, 495, 540, 585]) && JSON.stringify(dueHouse) === JSON.stringify(due), JSON.stringify({ due, dueHouse }));
    },
  },
  {
    name: 'the Wreck is shot as set with the standard kit (its build sheet §1 item 1): a URL\'s house, layout, rooms, draw, role-players or kit dropped with one toast, nothing dropped when none is asked; the house\'s choice as before',
    fn() {
      const W = SCENES['test-zerocqb'], H = SCENES['test-shoothouse'];
      const rows = [
        ['nothing', shipChoice(W, {})], ['&layout=B', shipChoice(W, { layout: 'B' })], ['&draw=drawn&rooms=all', shipChoice(W, { draw: 'drawn', rooms: 'all' })],
        ['&opfor=live', shipChoice(W, { opfor: 'live' })], ['&loadout=flash', shipChoice(W, { loadout: 'flash' })], ['&loadout=standard', shipChoice(W, { loadout: 'standard' })],
        ['the house, &layout=B', shipChoice(H, { layout: 'B' })],
      ];
      for (const [w, r] of rows) console.log(`      ${w.padEnd(22)} dropped ${JSON.stringify(r.dropped)}`);
      const house = houseChoice({ layout: 'B' }, {});
      assert(!rows[0][1].dropped.length && !rows[5][1].dropped.length && !rows[6][1].dropped.length, 'nothing dropped unasked, nor on the house');
      assert(rows.slice(1, 5).every(([, r]) => r.dropped.length === 1 && r.dropped[0] === SHIP_DROPPED), SHIP_DROPPED);
      assert(house.opts.layout === 'B' && !house.dropped.length, JSON.stringify(house));
    },
  },
  {
    name: 'a pop-up rises from flat on its face over POPUP_MS 400 (turners.js facingOf, the one closed form), a turner turns over TURN_MS 300 as built',
    fn() {
      const T = { turnAtMs: 1000, awayAtMs: null }, P = { ...T, pop: true };
      const at = (X, ms) => facingOf(X, ms);
      console.log(`      the turner at +150 ms ${at(T, 1150)}, +300 ${at(T, 1300)}, seen at +${seenAtMs(T) - 1000}; the pop-up at +150 ${at(P, 1150)}, +300 ${at(P, 1300)}, +400 ${at(P, 1400)}, seen at +${seenAtMs(P) - 1000}`);
      assert(TURN_MS === 300 && POPUP_MS === 400 && at(T, 1300) === 1 && at(P, 1300) < 1 && at(P, 1400) === 1 && seenAtMs(T) - 1000 === 100 && seenAtMs(P) - 1000 > 100, 'spans');
    },
  },
  {
    name: 'the plan view a panel a deck (its build sheet §1 item 13): an empty band over 10 m along x is cut to 1 m, the house\'s frame as before',
    fn() {
      const house = { walls: [{ rect: [5, 4, 20, 12] }, { rect: [20, 4, 35, 24] }] }, wreck = { walls: [{ rect: [0, 0, 9.2, 7.2] }, { rect: [60, 0, 69.2, 7.2] }] };
      const Fh = planFrame(house), Fw = planFrame(wreck);
      console.log(`      the house ${Fh.w} × ${Fh.h} px, cuts ${JSON.stringify(Fh.cuts)}; the Wreck ${Fw.w} × ${Fw.h} px, cuts ${JSON.stringify(Fw.cuts)}; deck 6's corner at ${toPx(Fw, 60, 0)} (deck 5's east wall ${toPx(Fw, 9.2, 0)})`);
      assert(!Fh.cuts.length && Fh.w === 30 * 16 + 12 && JSON.stringify(toPx(Fh, 5, 4)) === JSON.stringify([6, 6]), JSON.stringify(Fh));
      assert(Fw.cuts.length === 1 && Math.abs(toPx(Fw, 60, 0)[0] - toPx(Fw, 9.2, 0)[0] - PANEL_SEP_M * 16) <= 1 && Fw.w <= Math.ceil((9.2 * 2 + PANEL_SEP_M) * 16) + 12, JSON.stringify(Fw));
    },
  },
  {
    name: '"Again as …" replays the game\'s own scenario: the Wreck\'s test-zerocqb, the house\'s test-shoothouse',
    fn() {
      const fake = (scenario, H = {}) => ({ meta: { seed: 48213, scenario }, armoury: { range: { course: 'house', house: H } } });
      const w = againAsHouse(fake('test-zerocqb', { ship: 'wreck' }), 'sgt'), h = againAsHouse(fake('test-shoothouse'), 'sgt');
      console.log(`      the Wreck's ${JSON.stringify(w)}; the house's ${JSON.stringify(h)}`);
      assert(w.scenario === 'test-zerocqb' && h.scenario === 'test-shoothouse' && w.tier === 'sgt' && w.seed === 48213, JSON.stringify({ w, h }));
    },
  },
  {
    name: 'the Wreck to the card (F125\'s first half): the sergeant by T and the private by the keys on 48213, every compartment cleared, no dead end, the card\'s line the Wreck\'s ("THE WRECK · … · 2 DECKS · 4 COMPARTMENTS · FIRED FLOATING: NONE · FEET AFT IN …") and each row its entry and its first round\'s anchor',
    fn() {
      const rows = [];
      for (const [tier, bot] of [['sgt', 'honest'], ['private', 'keys']]) {
        const { g, rec } = wreckLane({ tier, bot });
        const rs = runSheetOf(g.state);
        console.log(`      ${laneLine(rec)}`);
        console.log(`        ${rs.card}`);
        for (const r of rs.rows) console.log(`        ${r.words}`);
        rows.push({ tier, rec, rs });
      }
      for (const { tier, rec, rs } of rows) {
        assert(!deadEnds(rec).length && rec.why === 'clear' && rec.legs.every(x => x === 'clear'), `${tier}: ${laneLine(rec)}`);
        assert(/THE WRECK · /.test(rs.card) && / · 2 DECKS · 4 COMPARTMENTS · /.test(rs.card) && /FIRED FLOATING: NONE/.test(rs.card) && /FEET AFT IN \d/.test(rs.card), `${tier}: ${rs.card}`);
        assert(rs.rows.length === 4 && rs.rows.every(r => /(BULKHEAD|DECK) HATCH · FIRST ROUND /.test(r.words)), `${tier}: ${rs.rows.map(r => r.words).join(' | ')}`);
      }
    },
  },
];
