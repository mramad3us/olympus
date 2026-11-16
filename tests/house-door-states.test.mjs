// OLYMPUS tests: the drawn house's doors found closed, open or locked (the build sheet v0.0.21 §1 item 3, §6; house lens H5; F62's turns).
//
// Each lane door's state is drawn (DOOR_STATE_W closed 60, open 25, locked 15), a pull never locked (no kick opens it and no charge
// is issued on the standard loadout: room.js doorPlanOf refuses one), and the draw never reads the loadout or the sheet. A door found
// open is set open at the fill and its time noted, as a setup's open door is, and the turners' triggers wait for GO: a door-turned
// man turns at max(the door's time, GO) + his gap (shoothouse.js triggers). Without that gate the man of an open door turned
// before GO (the house lens §0 item 10: 2a would turn in the brief), at the fill's time plus his gap. The cases: an open door's man
// turns no sooner than GO and his gap, and nobody turns before GO on that lane (F62's turns); over 100 drawn seeds no pull door is
// locked and every locked door's opening carries the lock and KICK_DC.locked 14; a locked push door opened by the honest tier one
// within STALL_MS, its room cleared; the same doors on every sheet and loadout.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot } from './bots/house.mjs';
import { f62Turns } from './flawless-drawn-a.mjs';
import { drawHouse, drawnCodeOf, parseHouse } from '../src/sim/scenes/assemble.js';
import { X4_CHUNKS, KICK_DC } from '../src/data/chunks/x4.js';
import { openingOf } from '../src/sim/places/model.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { STALL_MS } from '../src/sim/scenarios/shoothouse.js';

// (the first drawn seed with a door of the given state in a room whose 'a' stand turns on its door (the corner's and the ell's))
function seedWith(state) {
  for (let seed = 1; seed <= 400; seed++) {
    const H = parseHouse(drawHouse(seed)), k = H.rooms.findIndex(R => R.state === state && X4_CHUNKS[R.chunk].stands.some(s => s.trigger === 'door'));
    if (k >= 0) return { seed, k };
  }
  return null;
}
// (a lane run by the honest bot until a test says stop, a watcher ticked each tick)
function run(g, bot, until, watch = null, max = 20_000) {
  for (let i = 0; i < max && !g.state.armoury.range.end && !until(g.state); i++) { g.step(1, bot); watch?.tick(g); }
}

export default [
  {
    name: 'a lane door found open turns its man no sooner than GO and his gap, and nobody on the lane turns before GO (F62\'s turns; the house lens §0 item 10: without the gate on GO he turned in the brief)',
    fn() {
      const { seed, k } = seedWith('open'), g = createGame({ scenario: 'test-shoothouse', seed, tier: 'tierone', draw: 'drawn' }), s = g.state, R = s.armoury.range, H = R.house;
      const T = R.turners.find(t => t.stand === `${k + 1}a`), door = lanePlanOf(s).order[k], fillMs = s.clock.ms, w = f62Turns();
      const openAtFill = H.doors[door] === fillMs;
      run(g, houseHonestBot(), (st) => T.turnAtMs !== null && st.clock.ms > T.turnAtMs + 1000, w);
      const go = H.goAtMs, r = w.result();
      console.log(`      ${seed} ${H.draw.code}: room ${k + 1}'s door open at the fill ${openAtFill}, ${T.stand} (${T.face}) turns on it with a gap of ${T.trigger.gapMs} ms; GO ${fmt((go - fillMs) / 1000, 2)} s after the fill, his turn ${fmt((T.turnAtMs - go) / 1000, 2)} s after GO; turned before GO: ${r.early.join(', ') || 'none'}`);
      assert(openAtFill && go !== null && T.turnAtMs >= go + T.trigger.gapMs && r.ok, JSON.stringify({ openAtFill, go, turn: T.turnAtMs, gap: T.trigger.gapMs, early: r.early }));
    },
  },
  {
    name: 'over 100 drawn seeds no pull door is locked, every locked door\'s opening carries the lock and KICK_DC.locked 14; the doors the same on every sheet and loadout',
    fn() {
      const n = { push: 0, pull: 0, closed: 0, open: 0, locked: 0 }, bad = [];
      for (let seed = 1; seed <= 100; seed++) for (const R of parseHouse(drawHouse(seed)).rooms) { n[R.how]++; n[R.state]++; if (R.how === 'pull' && R.state === 'locked') bad.push(`${seed}: a locked pull`); }
      const { seed } = seedWith('locked'), fills = [['private', null], ['tierone', 'full'], ['recruit', 'breach']].map(([tier, loadout]) => createGame({ scenario: 'test-shoothouse', seed, tier, draw: 'drawn', ...(loadout ? { loadout } : {}) }));
      const codes = new Set(fills.map(g => g.state.armoury.range.house.draw.code)), s = fills[0].state, L = lanePlanOf(s);
      const locks = parseHouse(s.armoury.range.house.draw.code).rooms.map((R, k) => { const o = openingOf(L.order[k]); return { state: R.state, lock: !!o.lock, dc: o.kickDc }; });
      for (const x of locks) if ((x.state === 'locked') !== x.lock || (x.lock && x.dc !== KICK_DC.locked)) bad.push(`${seed}: ${JSON.stringify(x)}`);
      console.log(`      100 seeds' doors: ${JSON.stringify(n)}; ${bad.length} off; seed ${seed}'s doors ${JSON.stringify(locks)}; one code on three sheets and loadouts ${codes.size === 1} (${[...codes][0]}; drawnCodeOf ${drawnCodeOf(seed) === [...codes][0]})`);
      assert(!bad.length && n.locked > 0 && codes.size === 1 && drawnCodeOf(seed) === [...codes][0], JSON.stringify({ bad, n, codes: [...codes] }));
    },
  },
  {
    name: 'a locked push door is opened by the honest tier one within STALL_MS of his stack, its room cleared, never passed',
    fn() {
      const { seed, k } = seedWith('locked'), g = createGame({ scenario: 'test-shoothouse', seed, tier: 'tierone', draw: 'drawn' }), s = g.state, H = s.armoury.range.house;
      const L = () => [...H.rooms, H.hall][k];
      run(g, houseHonestBot(), () => ['clear', 'passed'].includes(L().state));
      const leg = L(), opened = leg.openAtMs !== null ? leg.openAtMs - (leg.stackAtMs ?? leg.fromMs) : null;
      console.log(`      ${seed} ${H.draw.code}: room ${k + 1} locked; stacked to open ${opened === null ? 'never' : `${fmt(opened / 1000, 2)} s`}, the leg ${leg.state} in ${fmt((leg.clearAtMs - leg.fromMs) / 1000, 2)} s; the door ${s.places.sites.melas.openings?.[lanePlanOf(s).order[k]]?.how ?? 'how unsaid'}`);
      assert(leg.state === 'clear' && opened !== null && opened < STALL_MS, JSON.stringify({ state: leg.state, opened }));
    },
  },
];
