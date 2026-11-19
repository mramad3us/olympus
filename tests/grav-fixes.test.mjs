// OLYMPUS tests: the review of v0.0.24's A to C, the gravity events' findings (F112, F113; BODY §13.7), each failing without its fix.
//
// What the reviewer found under a burn played headless, and what holds now, printed:
//   1. nobody is thrown off what he rests on: the bay at 23:00 on ship-coast under a 1 G burn, every sleeper in his rack and the
//      seated man 'couched' (profile.js restsOn), none 'fell', each still at his rack's height after; at 0 G before the burn none
//      reads 'float' (before: thirteen 'fell', the upper racks at 3.43 m/s, three with broken ribs; all read 'float' in their racks);
//   2. "Stack and clear" on ship-coast by the keys (the private, 48213) with a 1 G burn at 40 s and a 15 s warning lives past the
//      reviewer's crash (tick 1326: a doorway carry planned at 0 G after the ramp, the place NaN, every tick after thrown) to tick
//      2,000 with no error and every place finite, and the instructor on the catwalk is not thrown 3 m through it (before: 'fell'
//      at 5.834 m/s); a fall is a floating body's only, from free fall's height (you, pushed off the deck, from 1 m); heavy: the
//      same lane to its card;
//   3. saves through the burn carry on: the sergeant by T on the same lane, saved at ticks 450, 900, 1050 and 1200 and each played
//      on to 1,500, ends on the digest of the game never saved, its T presses the same (before: from 900 on they differed, the
//      DI's anchor note re-firing after a load: role A's skills/instinct/base.js).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { botOf } from './flawless.mjs';
import { setProfile } from '../src/sim/places/gravity.js';
import { footingOf } from '../src/sim/body/footing.js';
import { FREEFALL } from '../src/data/body/needs.js';

const SEED = 48213, BURN = Object.freeze([{ kind: 'burn', toG: 1, atS: 40, warnS: 15 }]);
const finite = (s) => s.actors.list.every(a => Number.isFinite(a.x) && Number.isFinite(a.z));
const fell = (s) => (s.places.live.env.profile?.log ?? []).filter(r => r.what === 'fell');

// (the keys private's lane under the burn (see the header), to `end` ticks or its card: { g, s, t, errors, card })
function burnLane(end) {
  const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: 'private', env: 'ship-coast', setup: 'go', strict: false }), s = g.state;
  setProfile(s, BURN);
  const bot = botOf('keys'), cw = s.actors.list.find(a => (a.y ?? 0) >= 2.5) ?? null;
  let t = 0, cwY = null;
  for (; t < end && !s.armoury?.range?.end; t++) {
    g.step(1, bot); g.clearFacts();
    if (g.errors.length || !finite(s)) break;
    const c = cw ?? s.actors.list.find(a => (a.y ?? 0) >= 2.5);
    if (c) cwY = { who: c.who, y: c.y };
  }
  return { g, s, t, errors: g.errors.slice(), card: !!s.armoury?.range?.end, cwY };
}

export default [
  {
    name: 'grav-fixes: nobody is thrown off what he rests on: the bay at 23:00 on ship-coast under a 1 G burn, every sleeper and the seated man couched, none fell, each at his rack\'s height after; none reads float at 0 G before',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 23, env: 'ship-coast' }), s = g.state;
      g.step(5);
      const high = s.actors.list.filter(a => a.who && (a.y ?? 0) > 0.01).map(a => ({ who: a.who, y: a.y, posture: a.posture ?? null, footing: footingOf(s, a.who).mode }));
      setProfile(s, [{ kind: 'burn', toG: 1, atS: 1, warnS: 0 }]);
      g.step(200);
      const log = s.places.live.env.profile.log, byWho = Object.fromEntries(log.map(r => [r.who, r.what]));
      const after = high.map(h => { const a = s.actors.list.find(x => x.who === h.who); return { who: h.who, was: h.y, y: a.y ?? 0, what: byWho[h.who] ?? null }; });
      const modes = {}; for (const h of high) modes[h.footing] = (modes[h.footing] ?? 0) + 1;
      const whats = {}; for (const h of after) whats[h.what] = (whats[h.what] ?? 0) + 1;
      console.log(`      ${high.length} resting above the deck (${high.filter(h => h.posture === 'lie').length} lying, ${high.filter(h => h.posture === 'sit').length} seated), their footing at 0 G ${JSON.stringify(modes)}; under the burn ${JSON.stringify(whats)}, ${fell(s).length} fell in all, ${after.filter(h => h.y !== h.was).length} moved off their height; errors ${g.errors.length}`);
      assert(high.length >= 10 && !modes.float, JSON.stringify(high.slice(0, 3)));
      assert(fell(s).length === 0 && after.every(h => h.what === 'couched' && h.y === h.was), JSON.stringify(after.filter(h => h.what !== 'couched' || h.y !== h.was).slice(0, 3)));
      assert(g.errors.length === 0, g.errors[0]);
    },
  },
  {
    name: 'grav-fixes: "Stack and clear" on ship-coast by the keys with a 1 G burn at 40 s lives past the reviewer\'s crash (tick 1326) to tick 2,000, no error, every place finite, and the instructor stays on his catwalk',
    fn() {
      const L = burnLane(2000), cw = L.cwY ? L.s.places.live.env.profile.log.filter(r => r.who === L.cwY.who).map(r => r.what) : [];
      console.log(`      ${L.t} ticks, errors ${L.errors.length}${L.errors.length ? ` (${L.errors[0]})` : ''}, finite ${finite(L.s)}; thrown ${JSON.stringify(L.s.places.live.env.profile.log.map(r => [r.who, r.what, r.vMs ?? null]))}; the catwalk's ${L.cwY ? `${L.cwY.who} at ${L.cwY.y} m, met ${JSON.stringify(cw)}` : 'none'}`);
      assert(L.t >= 2000 || L.card, `${L.t} ticks`);
      assert(L.errors.length === 0 && finite(L.s), L.errors[0] ?? 'a place not finite');
      // (a fall is a floating body's only, from free fall's height: you, pushed off the deck, may fall from FLOAT_Y_M; the catwalk never)
      assert(L.cwY && L.cwY.y >= 2.5 && !cw.includes('fell') && fell(L.s).every(r => r.who !== L.cwY.who && r.fromM <= FREEFALL.FLOAT_Y_M), JSON.stringify({ cw: L.cwY, met: cw, fell: fell(L.s).map(r => [r.who, r.fromM]) }));
    },
  },
  {
    name: 'grav-fixes: the same lane by the keys under the burn runs to its card with no error (heavy)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const L = burnLane(20_000);
      console.log(`      ${L.t} ticks, the card ${L.card}, errors ${L.errors.length}${L.errors.length ? ` (${L.errors[0]})` : ''}; fell ${fell(L.s).length}`);
      assert(L.card && L.errors.length === 0 && finite(L.s), JSON.stringify({ t: L.t, card: L.card, err: L.errors[0] }));
    },
  },
  {
    name: 'grav-fixes: saves through the burn carry on: the sergeant by T on ship-coast, saved at ticks 450, 900, 1050 and 1200, each played on to 1,500 ends on the never-saved game\'s digest, its T presses the same',
    fn() {
      const O = { scenario: 'test-shoothouse', seed: SEED, tier: 'sgt', env: 'ship-coast', setup: 'go' }, END = 1500, AT = [450, 900, 1050, 1200];
      const mk = () => { const g = createGame(O); setProfile(g.state, BURN); return g; };
      // (the bot's T presses counted as it makes them: an act 'instinct' in its input, the keys' T or the act it saw)
      const isT = (a) => a === 'instinct' || a?.act === 'instinct';
      const counted = (b, box) => (s, me, mem) => { const i = b(s, me, mem), acts = [i?.act ?? []].flat(); if (acts.some(isT)) box.n++; return i; };
      const A = mk(), box = { n: 0 }, bot = counted(botOf('honest'), box), saves = {}, tA = {};
      for (let t = 0; t < END; t++) {
        if (AT.includes(t)) { saves[t] = A.save(); tA[t] = box.n; }
        A.step(1, bot); A.clearFacts();
      }
      const presses = box.n;
      const want = A.digest(), out = [];
      for (const t of AT) {
        const C = createGame(O); C.load(saves[t]); const cb = { n: tA[t] }, bot2 = counted(botOf('honest'), cb);
        for (let k = t; k < END; k++) { C.step(1, bot2); C.clearFacts(); }
        out.push({ t, same: C.digest() === want, presses: cb.n, errors: C.errors.length });
      }
      console.log(`      the never-saved game: ${END} ticks, digest ${want}, ${presses} T presses, phase ${A.state.places.live.env.profile.phase}; ${out.map(o => `saved at ${o.t}: ${o.same ? 'same' : 'DIFFERS'}, ${o.presses} presses`).join('; ')}`);
      assert(A.state.places.live.env.profile.phase !== 'wait', 'the burn came');
      assert(out.every(o => o.same && o.presses === presses && o.errors === 0), JSON.stringify(out));
    },
  },
];
