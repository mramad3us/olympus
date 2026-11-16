// OLYMPUS tests: a save anywhere in "Stack and clear, live" loads and carries on byte for byte (TECH §13.1; the build sheet v0.0.19 §6, §9 item 4).
//
// A role-player is plain data on his turner record (T.live: his card, his state and its times, his eyes, his rounds, his dash,
// `who` a person id the id walk follows), the house's side of him on R.house.live (seenBy, lastAt, struck, casualty, ruled,
// reopened, said) and H.two (seenAt, got), none of it runtime. Nine points of the lane, each the first tick a bot's lane meets
// it (a list of lanes tried in turn, the cards forced where a point needs one): his turn, mid-dash, between his two rounds, his
// rifle falling, his hands, his fall, the casualty's beat, a room reopened and a startle. At each the save is checked by the id
// walk (tests/ids-check.mjs: `who`, every item held exactly once) and both games, the one that saved and one loaded from it,
// run AFTER ticks on by the same bot and must end on the same digest.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, houseKeysBot, houseFuzzBot } from './bots/house.mjs';
import { checkIds } from './ids-check.mjs';
import { startled } from '../src/sim/combat/supp.js';
import { movingNow } from '../src/sim/combat/men.js';
import { GIVE_DROP_MS } from '../src/sim/scenarios/opfor.js';
import { houseCall, liveTick } from '../src/sim/scenarios/shoothouse.js';
import { lanePlanOf } from '../src/sim/combat/room.js';
import { faceOfHead } from '../src/sim/arms/shooting.js';

// (a room reopened by hand where no bot's lane meets one (the honest bots look into every corner): room 2 set up at its door with
// its man hiding, its "Clear!" called with him never seen, then seen from room 2's point; the lane goes on from there by the bot)
function reopenBuilt(g) {
  const st = g.state, R = st.armoury.range, H = R.house, legs = [...H.rooms, H.hall], P = lanePlanOf(st).plans[legs[1].door], T = R.turners.find(t => t.stand === '2a');
  const me = st.actors.list.find(a => a.who === st.player.id);
  for (const x of R.turners) if (x.turnAtMs !== null) x.turnAtMs -= 5000;
  legs[1].state = 'entered';
  houseCall(st, null, { by: 'me', atMs: st.clock.ms });
  me.x = P.points[0][0]; me.z = P.points[0][1]; me.$px = me.x; me.$pz = me.z; me.headRad = Math.atan2(T.z - me.z, T.x - me.x); me.face = faceOfHead(me.headRad);
  liveTick(st, null, R, H, st.clock.ms);
}

const AFTER = 120, MAX_TICKS = 4000;
const men = (s) => (s.armoury?.range?.turners ?? []).filter(T => T.live);
const lane = (s) => s.armoury?.range?.house?.goAtMs !== null && s.armoury?.range?.house?.goAtMs !== undefined && !s.armoury.range.house.end;
const BOTS = { honest: () => houseHonestBot(), keys: () => houseKeysBot(), fuzz: () => houseFuzzBot({ seed: 3 }) };
/** The nine points: a predicate on the state, and the lanes tried for it in turn ({ tier, opfor, bot, seed }). */
export const POINTS = Object.freeze({
  'his turn': { at: (s) => lane(s) && men(s).some(T => T.live.st === 'turn'), lanes: [{ tier: 'tierone', opfor: 'live:fight,fight', bot: 'honest' }] },
  'mid-dash': { at: (s) => lane(s) && men(s).some(T => movingNow(T, s.clock.ms)), lanes: [{ tier: 'tierone', opfor: 'live:fight,hide', bot: 'honest' }, { tier: 'private', opfor: 'live:fight,hide', bot: 'keys' }] },
  'between his two rounds': { at: (s) => lane(s) && men(s).some(T => T.live.eng?.rounds?.some(r => r.done) && T.live.eng.rounds.some(r => !r.done)), lanes: [{ tier: 'recruit', opfor: 'live:fight,fight', bot: 'keys' }, { tier: 'private', opfor: 'live:fight,fight', bot: 'keys' }] },
  'his rifle falling': { at: (s) => lane(s) && men(s).some(T => T.live.card === 'give' && T.live.st === 'hands' && s.clock.ms - T.live.fromMs < GIVE_DROP_MS), lanes: [{ tier: 'tierone', opfor: 'live:give,give', bot: 'honest' }, { tier: 'private', opfor: 'live:give,give', bot: 'keys' }] },
  'his hands': { at: (s) => lane(s) && men(s).some(T => T.live.st === 'hands' && s.clock.ms - T.live.fromMs >= GIVE_DROP_MS), lanes: [{ tier: 'tierone', opfor: 'live:give,give', bot: 'honest' }, { tier: 'private', opfor: 'live:give,give', bot: 'keys' }] },
  'his fall': { at: (s) => lane(s) && men(s).some(T => T.stoppedAtMs !== null && s.clock.ms - T.stoppedAtMs <= 200), lanes: [{ tier: 'tierone', opfor: 'live:fight,fight', bot: 'honest' }] },
  'the casualty beat': { at: (s) => lane(s) && !!s.armoury.range.house.live?.casualty, lanes: [{ tier: 'recruit', opfor: 'live:fight,fight', bot: 'keys' }, { tier: 'private', opfor: 'live:fight,fight', bot: 'keys' }, { tier: 'private', opfor: 'live:fight,fight', bot: 'fuzz' }] },
  'a reopened room': { at: (s) => lane(s) && Object.keys(s.armoury.range.house.live?.reopened ?? {}).length > 0, lanes: [{ tier: 'private', opfor: 'live:fight,hide', bot: 'keys' }, { tier: 'recruit', opfor: 'live:fight,hide', bot: 'keys' }, { tier: 'private', opfor: 'live:fight,hide', bot: 'fuzz' }, { tier: 'cpl', opfor: 'live:fight,hide', bot: 'honest' }, { tier: 'tierone', opfor: 'live:hide,fight', bot: 'honest', setup: 'room:2', build: reopenBuilt }] },
  'a startle': { at: (s) => lane(s) && startled(s, s.player.id, s.clock.ms), lanes: [{ tier: 'recruit', opfor: 'live:fight,fight', bot: 'keys' }, { tier: 'private', opfor: 'live:fight,fight', bot: 'keys' }] },
});

// (a lane's key: its options and bot)
const keyOf = (L) => `${L.tier}|${L.opfor}|${L.bot}|${L.setup ?? 'go'}|${L.build ? 'built' : ''}`;

export default [
  {
    name: 'v0.0.19: a save at nine points of a live lane (his turn, mid-dash, between his two rounds, his rifle falling, his hands, his fall, the casualty\'s beat, a room reopened, a startle) loads and carries on byte for byte, every item held exactly once and no id dangling',
    timeoutMs: 180_000,
    fn() {
      const rows = {}, bad = [], left = new Set(Object.keys(POINTS));
      // (each lane run once, every point still owed that lists it checked on each of its ticks: at a point the save is loaded into a
      // second game and both step AFTER ticks in lockstep by the same bot, then the first goes on for the points after)
      const lanes = []; for (const P of Object.values(POINTS)) for (const L of P.lanes) if (!lanes.some(x => keyOf(x) === keyOf(L))) lanes.push(L);
      for (const L of lanes) {
        const want = [...left].filter(n => POINTS[n].lanes.some(x => keyOf(x) === keyOf(L)));
        if (!want.length) continue;
        const opts = { scenario: 'test-shoothouse', seed: L.seed ?? 48213, tier: L.tier, setup: L.setup ?? 'go', opfor: L.opfor }, g = createGame(opts), bot = BOTS[L.bot]();
        // (a point no bot's lane meets, built by hand on the lane's state: the load below replays from the save, so both are the same lane)
        if (L.build) L.build(g);
        let n = 0;
        while (n++ < MAX_TICKS && want.some(x => left.has(x)) && !g.state.armoury.range.end) {
          // (every point met on this tick shares its save)
          const hits = want.filter(x => left.has(x) && POINTS[x].at(g.state));
          if (hits.length) {
            for (const h of hits) left.delete(h);
            const json = g.save(), ms = g.state.clock.ms - g.state.armoury.range.house.goAtMs, ids = checkIds(JSON.parse(json), g.sim.domains);
            const g2 = createGame({ ...opts, setup: 'go' }), bot2 = BOTS[L.bot]();
            g2.load(json);
            for (let i = 0; i < AFTER; i++) { g.step(1, bot); g.clearFacts?.(); g2.step(1, bot2); g2.clearFacts?.(); }
            const same = g.digest() === g2.digest(), st = men(JSON.parse(json)).map(T => `${T.stand} ${T.live.st}`).join(', ');
            for (const hit of hits) rows[hit] = `${hit.padEnd(22)} ${L.tier} ${L.opfor} (${L.bot}${L.build ? ', built by hand' : ''}) at +${(ms / 1000).toFixed(2)} s (${st}): ${ids.checked} ids, ${ids.invalid.length} invalid, ${ids.dangling.length} dangling; ${AFTER} ticks on ${same ? 'the same' : 'APART'}`;
            if (!same || ids.invalid.length || ids.dangling.length || g.errors.length || g2.errors.length) bad.push(`${hits.join(', ')}: ${same ? '' : 'apart '}${[...ids.invalid, ...ids.dangling].slice(0, 3).join('; ')} ${[...g.errors, ...g2.errors].slice(0, 2).join('; ')}`);
            continue;
          }
          g.step(1, bot); g.clearFacts?.();
        }
      }
      for (const name of left) { rows[name] = `${name.padEnd(22)} NEVER REACHED on ${POINTS[name].lanes.map(L => `${L.tier} ${L.opfor} (${L.bot})`).join(', ')}`; bad.push(`${name}: never reached`); }
      for (const name of Object.keys(POINTS)) console.log(`      ${rows[name]}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
];
