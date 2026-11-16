// OLYMPUS tests: the one rule on the live lane, end to end (v0.0.20; src/sim/combat/would.js through men.js incoming, opfor.js opforHit and the house's casualty and paper). The user's answer of 2026-11-16 to v0.0.19's question 7: "Paintball should end if the hit is 'fatal'".
//
// Each lane was v0.0.19's to the tick before the strike that differs, each failing without the rule:
//   - the Raider on 5261 (honest): v0.0.19's casualty at 20.50 s on two A strikes of room 2's man; now two wounds through the
//     soft panel, and the lane clears (44.15 s), its card "PAINT ON YOU: 2 TORSO · WOULD HAVE BEEN: WOUNDED, CHEST" (v0.0.20's code
//     review moved w to the impact's speed, the live path's: the first build's pin, the sergeant on 1777, is now a casualty on its
//     second strike);
//   - the boot recruit on 48213 (keys): its second strike rated fatal, the card "CASUALTY · FATAL: THE CHEST, 2ND ROUND, THROUGH
//     THE SOFT PANEL, ROOM 2, BY THE MAN IN THE DEEP CORNER", and the hot wash says what the rounds would have done, in words, the
//     verdict first ("down, and staying down: the chest"), never "knocked down";
//   - the sergeant on 5144 (honest): two wounds, the lane runs on, and room 2's man, still facing a man standing, fires again: the
//     third strike fatal, the casualty on it (v0.0.19's at 21.05 s on the second);
//   - your #2 struck in the head by room 2's man (the role-players aim at the nearer marine, you on every lane measured, so the
//     strike is made by hand through men.js incoming): the lane ends 'casualty' on him, the card "CASUALTY · FATAL ON YOUR #2: …",
//     the instructor's "Your number two is hit."
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot, houseKeysBot } from './bots/house.mjs';
import { runSheetOf, hotWashOf, houseNow } from '../src/sim/scenarios/shoothouse.js';
import { incoming } from '../src/sim/combat/men.js';
import { fatalOf } from '../src/sim/combat/would.js';

// (a live lane to its card: { g, s, H, card, verdicts })
function lane(tier, seed, bot) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier, setup: 'go', opfor: 'live' }), s = g.state, H = s.armoury.range.house;
  const run = runHouse(g, bot, { maxMs: 10 * 60_000 });
  const who = (p) => (p === s.player.id ? 'you' : p === H.twoPid ? 'your #2' : 'a role-player');
  const verdicts = H.live.would.log.map(e => `${fmt((e.atMs - H.goAtMs) / 1000, 2)} ${who(e.on)} ${e.part}/${e.zone} ${e.layer} ${e.fatal ? `FATAL (${e.why})` : e.why ?? 'wound'}`);
  return { g, s, H, run, card: runSheetOf(s).card, verdicts, endS: H.end ? (H.end.atMs - H.goAtMs) / 1000 : null };
}
const mine = (L) => L.H.live.would.log.filter(e => e.on === L.s.player.id);

export default [
  {
    name: 'the Raider on 5261: v0.0.19\'s casualty at 20.50 s on two A strikes is now two wounds through the soft panel, and the lane clears; its card "PAINT ON YOU: 2 TORSO · WOULD HAVE BEEN: WOUNDED, CHEST"',
    timeoutMs: 120_000,
    fn() {
      const L = lane('raider', 5261, houseHonestBot()), m = mine(L);
      console.log(`      ${L.H.end?.why} at ${fmt(L.endS, 1)} s; the strikes ${L.verdicts.join(' · ')}\n      ${L.card}`);
      const wash = hotWashOf(L.s).lines.filter(l => /^What those rounds/.test(l));
      console.log(`      ${wash.join(' | ')}`);
      assert(wash.length === 1 && !/knocked|staying down/i.test(wash[0]), JSON.stringify(wash));
      assert(L.run.done && L.H.end?.why === 'clear' && m.length === 2 && m.every(e => !e.fatal && e.why === null) && /PAINT ON YOU: 2 TORSO · WOULD HAVE BEEN: WOUNDED, CHEST/.test(L.card), JSON.stringify({ end: L.H.end, m, card: L.card }));
    },
  },
  {
    name: 'the boot recruit on 48213 (keys): the second strike rated fatal, the lane ends \'casualty\' on it, the card "CASUALTY · FATAL: THE CHEST, 2ND STRIKE ON YOU, THROUGH THE SOFT PANEL, ROOM 2, BY THE MAN IN THE DEEP CORNER", the hot wash\'s word on what the rounds would have done, the verdict first and never "knocked down", never a number',
    timeoutMs: 120_000,
    fn() {
      const L = lane('recruit', 48213, houseKeysBot()), m = mine(L), K = L.H.live.casualty, wash = hotWashOf(L.s).lines.filter(l => /^What those rounds/.test(l));
      console.log(`      ${L.H.end?.why} at ${fmt(L.endS, 1)} s; the strikes ${L.verdicts.join(' · ')}\n      ${L.card}\n      ${wash.join(' | ')}`);
      assert(L.H.end?.why === 'casualty' && m.length === 2 && !m[0].fatal && m[1].fatal && K.shotId === m[1].shotId && K.why === m[1].why, JSON.stringify({ m, K }));
      assert(/^CASUALTY · FATAL: THE CHEST, 2ND STRIKE ON YOU, THROUGH THE SOFT PANEL, ROOM 2, BY THE MAN IN THE DEEP CORNER/.test(L.card) && wash.length === 1 && !/\d/.test(wash[0]) && /^What those rounds would have done: you, down, and staying down: the chest; /.test(wash[0]) && !/knocked/i.test(wash[0]), JSON.stringify({ card: L.card, wash }));
    },
  },
  {
    name: 'the sergeant on 5144: two wounds and the lane runs on; room 2\'s man, his marine still standing, fires again, and the third strike is the casualty (v0.0.19\'s at 21.05 s on the second)',
    timeoutMs: 120_000,
    fn() {
      const L = lane('sgt', 5144, houseHonestBot()), m = mine(L), K = L.H.live.casualty;
      console.log(`      ${L.H.end?.why} at ${fmt(L.endS, 2)} s, the casualty at ${fmt((K.atMs - L.H.goAtMs) / 1000, 2)} s; the strikes ${L.verdicts.join(' · ')}`);
      assert(L.H.end?.why === 'casualty' && m.length === 3 && !m[0].fatal && !m[1].fatal && m[2].fatal && K.shotId === m[2].shotId && (K.atMs - L.H.goAtMs) / 1000 > 19.05, JSON.stringify({ m, K }));
    },
  },
  {
    name: 'your #2 struck in the head by room 2\'s man (through men.js incoming, the one writer): the strike rated fatal, the lane ends \'casualty\' on him CASUALTY_MS later, the card "CASUALTY · FATAL ON YOUR #2: A ROUND IN THE HEAD …" or "KILLED OUTRIGHT", "Your number two is hit." said',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'room:2', opfor: 'live' }), s = g.state, H = s.armoury.range.house, T = s.armoury.range.turners.find(t => t.stand === '2a');
      const gun = s.people[T.live.who].kit.worn.sling, two = s.actors.list.find(a => a.who === H.twoPid);
      // (the strike made on a lived tick, as a role-player's round lands: the first on which the clock moved, room 2's door open)
      let out = null, was = s.clock.ms;
      const said = [];
      runHouse(g, houseHonestBot(), { maxMs: 60_000, each: (game) => {
        for (const f of game.facts('say')) if (/number two/i.test(f.text)) said.push(f.text);
        const lived = s.clock.ms > was; was = s.clock.ms;
        if (out || !lived || H.end || H.rooms[1].openAtMs === null) return;
        out = incoming(s, g.bus, { who: H.twoPid, by: T.key, shot: { id: 'by-hand', fired: true, hole: { at: [0, 5] }, zone: 'head', part: 'head', load: 'marking', gun, roll: { margin: 6 }, flight: { rangeM: 4.2 }, muzzle: { x: T.x, y: 1.4, z: T.z }, dirRad: Math.atan2(two.z - T.z, two.x - T.x), atMs: s.clock.ms } });
      } });
      const card = runSheetOf(s).card, f = fatalOf(s, H.twoPid);
      console.log(`      the strike: ${out.would.layer} ${out.would.fatal ? `FATAL (${out.would.why})` : out.would.why ?? 'wound'}; the lane ${H.end?.why} ${H.end ? H.end.atMs - H.live.casualty.atMs : '-'} ms after it; said ${JSON.stringify(said)}\n      ${card}`);
      assert(out.would.fatal && f && H.live.casualty?.who === H.twoPid && H.end?.why === 'casualty' && /^CASUALTY · FATAL ON YOUR #2: (A ROUND IN THE HEAD|KILLED OUTRIGHT), 1ST STRIKE ON HIM, ROOM 2, BY THE MAN IN THE DEEP CORNER/.test(card) && said.some(t => /Your number two is (hit|a casualty)/.test(t)), JSON.stringify({ out: out.would, card, said }));
    },
  },
  {
    name: 'the instructor names the place the would-have gives (v0.0.20\'s review: an arm\'s wound was said "Paint, chest."): P-12 strikes made by hand on you through men.js incoming until one is an arm\'s, and his word for it names that arm',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'room:2', opfor: 'live' }), s = g.state, H = s.armoury.range.house, T = s.armoury.range.turners.find(t => t.stand === '2a');
      const me = s.actors.list.find(a => a.who === s.player.id);
      let k = 0, arm = null, was = s.clock.ms;
      const said = [];
      runHouse(g, houseHonestBot(), { maxMs: 30_000, each: (game) => {
        for (const f of game.facts('say')) if (/paint/i.test(f.text)) said.push({ text: f.text, atMs: s.clock.ms });
        const lived = s.clock.ms > was; was = s.clock.ms;
        if (arm || !lived || H.end || H.live.casualty || H.rooms[1].openAtMs === null) return;
        const out = incoming(s, g.bus, { who: s.player.id, by: T.key, shot: { id: `arm:${k++}`, fired: true, hole: { at: [0, 5] }, zone: 'A', part: 'torso', load: 'marking', gun: H.pistol, roll: { margin: 0 }, flight: { rangeM: 4.2 }, muzzle: { x: T.x, y: 1.4, z: T.z }, dirRad: Math.atan2(me.z - T.z, me.x - T.x), atMs: s.clock.ms } });
        if (out?.would && /^arm/.test(out.would.part)) arm = { ...out.would, i: (H.live.struck ?? []).length - 1 };
      } });
      const after = said.filter(x => arm && x.atMs >= arm.atMs);
      console.log(`      ${k} strikes by hand; the arm's: ${arm ? `${arm.part}, ${arm.where}, ${arm.layer}` : 'none'}; the words from it: ${JSON.stringify(after.slice(0, 2).map(x => x.text))}`);
      assert(arm && arm.layer === 'bare' && after.some(x => x.text.includes(arm.where)), JSON.stringify({ arm, after }));
    },
  },
  {
    name: 'a round of yours a role-player\'s soft panel stopped is said, once a man ("His panel took that one."; v0.0.20\'s review: your P-12 torso strikes on them were stopped 4 of 4 and nothing said why he fought on): the sergeant on 5083, honest, two P-12 strikes stopped, one word',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 5083, tier: 'sgt', setup: 'go', opfor: 'live' }), s = g.state, H = s.armoury.range.house;
      const said = [], model = {};
      runHouse(g, houseHonestBot(), { maxMs: 8 * 60_000, each: (game) => { for (const f of game.facts('shot')) model[f.id] = s.items[f.gun]?.model; for (const f of game.facts('say')) if (/his panel|hit his panel/i.test(f.text)) said.push(f.text); } });
      const rp = new Set(s.armoury.range.turners.filter(T => T.live).map(T => T.live.who));
      const stopped = H.live.would.log.filter(e => rp.has(e.on) && e.why === 'stopped' && e.by === 'me');
      console.log(`      ${H.end?.why}; your strikes on them stopped ${stopped.length} (${stopped.map(e => model[e.shotId]).join(', ')}); said ${JSON.stringify(said)}`);
      assert(stopped.length >= 2 && said.length === new Set(stopped.map(e => e.on)).size, JSON.stringify({ stopped, said }));
    },
  },
  {
    name: 'a casualty\'s card times its legs to the lane\'s end, as the run sheet does (v0.0.19\'s, found by v0.0.20\'s review: the private on 3054 by the keys, "drill room 2 133.20 s" beside the run sheet\'s 15.85 s): houseNow\'s views stop at H.end on the live lane',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 3054, tier: 'private', setup: 'go', opfor: 'live' }), s = g.state, H = s.armoury.range.house;
      runHouse(g, houseKeysBot(), { maxMs: 10 * 60_000 });
      const legs = houseNow(s).aspects.drill.legs, laneMs = H.end.atMs - H.goAtMs, after = s.clock.ms - H.end.atMs;
      console.log(`      ${H.end.why} at ${fmt(laneMs / 1000, 2)} s, the clock ${fmt(after / 1000, 2)} s past it; the drill's legs ${legs.map(x => x.ms === null ? '-' : fmt(x.ms / 1000, 2)).join(', ')} s; the rows ${runSheetOf(s).rows.map(r => r.words.split(' · ').slice(0, 2).join(' · ')).join(' | ')}`);
      assert(H.end.why === 'casualty' && after > 10_000 && legs.every(x => x.ms === null || x.ms <= laneMs), JSON.stringify({ legs, laneMs }));
    },
  },
];
