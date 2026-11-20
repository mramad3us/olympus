// OLYMPUS tests: collar-side, "Away the boarding party"'s gauge F159, the side gives up (its build sheet item 11, §5, §6 A, §8; COMBAT §14.6; FT§4.4).
//
// opfor.js sideTick, at opforTick's end aboard: when the armed men standing (not down, ruled out, giving or given up, nor fled) fall to
// GIVE_UP_LEFT 35% of the armed at the start or fewer, the side rolls GIVE_UP_P 0.5 on stream(seed, 'boarding:side', n) at that crossing
// and every GIVE_UP_EVERY_MS 60 s after while anyone stands; a success is final: every standing armed man gives at once (startGive: the
// no-shoot face, the rifle on its way to the deck) and the hauler's intercom says "We give up! Don't shoot! We're coming out!", a bubble
// (a 'say' fact with no speaker's body) at the 1MC speaker of the compartment of the standing man nearest you. On the hauler's deck
// (tests/boarding-men.mjs): four pirates put down one by one by hand, the rule read over 400 seeds of the side's stream; two smugglers,
// none left to roll; the give final (the review of v0.0.27): a man down at the intercom's words rises giving (opforRise), and the side
// is never asked again (sideTick's guard on gaveAtMs). Fails with a roll above 35%, a second success, no intercom, a roll off the minute,
// a man rising to the fight after the give, or a roll after it.
import { assert, fmt } from './helpers.mjs';
import { boardingMen } from './boarding-men.mjs';
import { sideTick, protectedOf, GIVE_UP_LEFT, GIVE_UP_P, GIVE_UP_EVERY_MS, SIDE_SAYS } from '../src/sim/scenarios/opfor.js';
import { stream, next } from '../src/core/rng.js';
import { roomOf, areaOf } from '../src/sim/places/model.js';

// (a man down by hand for the side's count: his st as goDown leaves it (the rule reads the record, not the body))
const fell = (T) => { T.live.st = 'down'; T.stoppedAtMs ??= 0; };

export default [
  {
    name: 'collar-side: the side\'s roll comes only at 35% standing or fewer: four pirates, nothing at 4, 3 or 2 standing, the roll at the crossing to 1; two smugglers, nothing at 1 and none to roll at 0 (fails with the roll before the crossing)',
    fn() {
      const w = boardingMen({ seed: 48213, holdouts: 'pirates', stands: ['1a', '3a', '3b', '4a', '2c', '2d'] }), s = w.s, S = w.H.boarding.side, armed = w.men.filter(T => !T.live.unarmed), rows = [];
      let early = 0;
      for (let k = 0; k < armed.length; k++) {
        const r = sideTick(s, w.bus, w.R, w.H, s.clock.ms), up = armed.filter(T => T.live.st !== 'down').length;
        rows.push(`${up} standing: ${r === null ? 'no roll' : r ? 'gave' : 'held'}`);
        if (r !== null && up > GIVE_UP_LEFT * S.armed) early++;
        if (r !== null) break;
        fell(armed[k]);
      }
      const v = boardingMen({ seed: 48213, holdouts: 'smugglers', stands: ['3a', '4a', '3c', '4c'] }), V = v.H.boarding.side, vs = v.men.filter(T => !T.live.unarmed), vrows = [];
      for (let k = 0; k <= vs.length; k++) { const r = sideTick(v.s, v.bus, v.R, v.H, v.s.clock.ms); vrows.push(`${vs.filter(T => T.live.st !== 'down').length}: ${r === null ? 'none' : r}`); if (k < vs.length) fell(vs[k]); }
      console.log(`      four pirates (armed at the start ${S.armed}, the line ${fmt(GIVE_UP_LEFT * S.armed, 2)}): ${rows.join('; ')}; two smugglers (line ${fmt(GIVE_UP_LEFT * V.armed, 2)}): ${vrows.join('; ')}, rolls ${V.rolls}`);
      assert(!early && S.rolls === 1 && S.crossedAtMs !== null && /1 standing: (gave|held)/.test(rows.at(-1)) && V.rolls === 0, JSON.stringify({ rows, vrows, S, V }));
    },
  },
  {
    name: 'collar-side: over 400 seeds the side rolls at the crossing and every 60 s after, 0.5 a roll (the stream over 2,000 draws), final at its first success: every standing armed man gives at once and the intercom\'s bubble stands at the speaker of his compartment; never a roll above 35% (fails with a second success or a roll off the minute)',
    fn() {
      const w = boardingMen({ seed: 48213, holdouts: 'pirates', stands: ['1a', '3a', '3b', '4a', '2c', '2d'] }), s = w.s, H = w.H, armed = w.men.filter(T => !T.live.unarmed);
      for (const T of armed.slice(0, 3)) fell(T);
      const last = armed[3], keep = { live: JSON.stringify(last.live), face: last.face, holds: last.holds }, a = w.actor(last.stand), seed0 = s.meta.seed, t0 = s.clock.ms;
      const A = areaOf(s.places.live.area), off = [], tries = {};
      let draws = 0, wins = 0, gaveAll = 0, intercoms = 0, atRoom = 0, after = 0;
      for (let k = 0; k < 2000; k++) { draws++; if (next(stream(k + 1, 'boarding:side', k % 5)) < GIVE_UP_P) wins++; }
      for (let seed = 1; seed <= 400; seed++) {
        s.meta.seed = seed; s.clock.ms = t0;
        Object.assign(last, { live: JSON.parse(keep.live), face: keep.face, holds: keep.holds });
        H.boarding.side = { armed: 4, rolls: 0, crossedAtMs: null, nextAtMs: null, gaveAtMs: null };
        const S = H.boarding.side, n0 = w.facts.length;
        let res = null, rolled = [];
        for (let m = 0; m < 12 && !res; m++) {
          // (each tick of a minute: the roll only at its minute's first)
          for (let i = 0; i < 3; i++) { const r = sideTick(s, w.bus, w.R, H, s.clock.ms); if (r !== null) { rolled.push(s.clock.ms - t0); res = r; } s.clock.ms += 50; }
          if (!res) s.clock.ms = t0 + (m + 1) * GIVE_UP_EVERY_MS;
        }
        tries[S.rolls] = (tries[S.rolls] ?? 0) + 1;
        if (rolled.some((ms, i) => ms !== i * GIVE_UP_EVERY_MS)) off.push({ seed, rolled });
        // (final: nothing more for ten minutes)
        for (let m = 0; m < 10; m++) { s.clock.ms += GIVE_UP_EVERY_MS; if (sideTick(s, w.bus, w.R, H, s.clock.ms) !== null) after++; }
        if (res && last.live.st === 'hands' && last.face === 'noshoot' && last.live.give) gaveAll++;
        const says = w.facts.slice(n0).filter(([k, f]) => k === 'say' && f.text === SIDE_SAYS);
        if (says.length === 1) { intercoms++; const at = says[0][1].at, room = roomOf(A, a.x, a.z)?.id; if (at && A.speakers.some(sp => sp.room === room && sp.x === at.x && sp.z === at.z)) atRoom++; }
        if (!res || says.length !== 1) off.push({ seed, res, says: says.length });
      }
      s.meta.seed = seed0;
      const mean = Object.entries(tries).reduce((n, [k, v]) => n + k * v, 0) / 400;
      console.log(`      the stream: ${wins} of ${draws} draws under GIVE_UP_P ${GIVE_UP_P} (${fmt(100 * wins / draws, 1)}%); 400 seeds, the last of four pirates standing: rolls to the give ${JSON.stringify(tries)} (mean ${fmt(mean, 2)}, 2 for a fair coin), the man given up ${gaveAll}, the intercom ${intercoms} (at his compartment's speaker ${atRoom}), a roll after the give ${after}; off ${off.length}`);
      assert(!off.length && !after && gaveAll === 400 && intercoms === 400 && atRoom === 400 && Math.abs(wins / draws - GIVE_UP_P) < 0.03 && Math.abs(mean - 2) < 0.3, JSON.stringify({ off: off.slice(0, 4), tries, after, gaveAll }));
    },
  },
  {
    name: 'collar-side: the give is final: a pirate down in the arm at the intercom\'s words rises with his hands up (st \'hands\', the no-shoot face, protected) and fires 0 rounds; and after the give the side never rolls again, a man standing or not (the review of v0.0.27: 6 of 36 rose to \'aim\' and \'fight\', and nothing failed without the finality guard)',
    fn() {
      // (seed 2000, the review's probe: 3b and 4b in the torso, 4a in the arm, so the side gives at 2 s with 4a down, who rises at about 38 s)
      const w = boardingMen({ seed: 2000, holdouts: 'pirates', stands: ['3a', '3b', '4a', '4b'], room: 'bunks' }), { s, H } = w;
      H.goAtMs ??= s.clock.ms;
      const t0 = s.clock.ms;
      w.run(2000);
      w.shoot('4a', { zone: 'C', part: 'armL', margin: 0 });
      for (const st of ['3b', '3b', '4b', '4b']) w.shoot(st, { zone: 'A', margin: 6 });
      const T = w.man('4a');
      let gaveAt = null, downAtGive = null, roseAt = null, fired0 = null;
      for (let t = 0; t < 3600 && !(roseAt !== null && s.clock.ms - roseAt > 5000); t++) {
        w.tick();
        if (gaveAt === null && H.boarding.side?.gaveAtMs != null) { gaveAt = s.clock.ms; downAtGive = T.live.st === 'down'; fired0 = T.live.fired ?? 0; }
        if (gaveAt !== null && roseAt === null && T.live.st !== 'down') roseAt = s.clock.ms;
      }
      const after = { st: T.live.st, face: T.face, fired: (T.live.fired ?? 0) - (fired0 ?? 0), protected: protectedOf(s, T, s.clock.ms) };
      console.log(`      the side gave at ${fmt((gaveAt - t0) / 1000, 1)} s with 4a down ${downAtGive}; 4a rose at ${roseAt === null ? 'never' : fmt((roseAt - t0) / 1000, 1) + ' s'}; 5 s on: st ${after.st}, face ${after.face}, protected ${after.protected}, rounds after the give ${after.fired}`);
      assert(gaveAt !== null && downAtGive && roseAt !== null && after.st === 'hands' && after.face === 'noshoot' && after.protected === 'hands' && after.fired === 0, JSON.stringify({ gaveAt, downAtGive, roseAt, after }));
      // (final: one of them put back on his feet as a fighter by hand, the side is not asked again over three minutes)
      const S = H.boarding.side, rolls = S.rolls, n0 = w.facts.length, M = w.man('3a');
      Object.assign(M.live, { st: 'cover', give: null }); Object.assign(M, { face: 'threat', holds: 'rifle' });
      let back = 0;
      for (let k = 0; k < 4; k++) { s.clock.ms += GIVE_UP_EVERY_MS; if (sideTick(s, w.bus, w.R, H, s.clock.ms) !== null) back++; }
      const said = w.facts.slice(n0).filter(([k, f]) => (k === 'house' && f.phase === 'side') || (k === 'say' && f.text === SIDE_SAYS)).length;
      console.log(`      after the give, a man standing again by hand: ${back} answers of sideTick over 4 minutes, rolls ${rolls} then ${S.rolls}, the side's facts and intercom lines ${said}`);
      assert(back === 0 && S.rolls === rolls && said === 0, JSON.stringify({ back, rolls, now: S.rolls, said }));
    },
  },
];
