// OLYMPUS tests: your number two's P-12 (v0.0.19, the team's track T2, behind one switch; v0.0.20: standard issue, loadout.js TWO_P12_DEFAULT true, the user's answer of 2026-11-16 to the round's question 10, "#2 has to have a sidearm"; '~two:none', the tests' only, takes it off).
//
// With his P-12 (every code now; '~two:p12' the same as none) the fill issues him the house's P-12 after every other item (house-two.js; shoothouse.js testShoothouse's line),
// so every other id is v0.0.18's; the tower's MAKE READY racks it and holsters it on safe, Stop holsters it on safe, SHOW CLEAR
// clears it (his own admin: sidearm.js adminSubs, adminRun on his stream, logged nowhere); his walk carries its weight (bundle.js
// legsOf prices the kit); and in a fight, his rifle stopped with an armed man facing him within TRANSITION_NEAR_M, he draws it
// instead of "Gun down!", takes his man with it, and once nobody faces him holsters it and brings his rifle back (house-two.js
// twoTransition, twoStandDown's Rifle up). With '~two:none' nothing of it exists: his kit is v0.0.18's.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot, houseKeysBot } from './bots/house.mjs';
import { checkIds, checkHolders } from './ids-check.mjs';
import { gunField, beliefOf } from '../src/sim/arms/firearms.js';
import { legsOf } from '../src/sim/combat/bundle.js';
import { kitMassKg, sparesOf } from '../src/sim/arms/kit.js';
import { houseWant } from '../src/sim/scenarios/shoothouse.js';
import { twoLacks } from '../src/sim/combat/two.js';

const P12 = 'standard~two:p12', NONE = 'standard~two:none';
const two = (s) => s.armoury.range.house.two;
// (the house from the brief to GO by a bot, each tick handed to each)
function toGo(g, bot, each = null, maxMs = 140_000) {
  const s = g.state, H = s.armoury.range.house, t0 = s.clock.ms;
  while (H.goAtMs === null && s.clock.ms - t0 < maxMs) { g.step(1, bot); each?.(g); g.clearFacts?.(); }
}
const cond = (s, id) => { const g = s.items[id], k = s.people[two(s).pid].kit; return { holstered: k.worn?.holster === id, chamber: gunField(g, 'chamber') ?? 'empty', mode: gunField(g, 'mode'), mag: !!g.mag }; };

export default [
  {
    name: 'his rifle dry with nothing left to load it (its magazine and his spares empty), his P-12 drawn: once he has seen there is nothing to load he keeps the pistol, at most one Rifle up and one draw after the room\'s first "Clear!" (the sergeant, room 3 on); v0.0.19\'s first build drew and holstered eleven times to the tower (the review of 2026-11-16)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'room:3', loadout: P12 }), s = g.state, W = two(s), k = s.people[W.pid].kit, rifle = s.items[k.worn.sling];
      rifle.chamber = 'empty'; if (rifle.mag) s.items[rifle.mag].n = 0;
      const spares = sparesOf(s, W.pid, s.items[rifle.mag]?.fam ?? null); for (const id of spares) s.items[id].n = 0;
      const macros = [], clears = [];
      runHouse(g, houseHonestBot(), { maxMs: 120_000, each: (game) => {
        const m = W.down?.macro ?? (W.hand === 'pistol' ? '(pistol)' : null);
        if (m && macros.at(-1)?.m !== m) macros.push({ m, ms: s.clock.ms });
        for (const f of game.facts('say')) if (f.who === W.pid && f.text === 'Clear!') clears.push(s.clock.ms);
      } });
      const after = macros.filter(x => clears.length && x.ms > clears[0]), ups = after.filter(x => x.m === 'rifle-up').length, draws = after.filter(x => x.m === 'transition').length;
      console.log(`      his spares emptied ${spares.join(', ')}; his macros ${macros.map(x => `${x.m} +${fmt((x.ms - macros[0].ms) / 1000, 1)}`).join(', ')} (${macros.length}); his "Clear!" ${clears.length}; after the first: Rifle up ${ups}, draws ${draws}; at the end ${W.hand === 'pistol' ? 'the pistol in his hand' : 'his rifle'}`);
      assert(macros.length && clears.length >= 2 && ups <= 1 && draws <= 1 && macros.length <= 6, JSON.stringify(macros));
    },
  },
  {
    name: 'his P-12 is standard issue (v0.0.20: the plain code issues it, \'~two:p12\' the same lane): every other id of the fill is the one without it (\'~two:none\', the tests\' only), his P-12 and its three after them (gun, its HAD-17, the thigh pouch and its spare), every item held exactly once',
    fn() {
      const off = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', loadout: NONE }), on = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' });
      const tok = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', loadout: P12 });
      const ids = (s) => Object.keys(s.items).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
      const a = ids(off.state), b = ids(on.state), extra = b.filter(id => !a.includes(id)), W = two(on.state);
      const same = a.every(id => JSON.stringify(off.state.items[id]) === JSON.stringify(on.state.items[id]));
      const chk = { ...checkIds(JSON.parse(on.save()), on.sim.domains), holders: checkHolders(on.state) };
      const tokSame = tok.digest() === on.digest();
      console.log(`      '~two:none': ${a.length} items, his P-12 ${two(off.state).pistol ?? 'none'}; the plain code: ${b.length} items, his P-12 ${W.pistol}, the new ids ${extra.join(', ')}; every other item the same ${same}; '~two:p12' the same lane ${tokSame}; the id walk: ${JSON.stringify(chk)}`);
      assert(!two(off.state).pistol && W.pistol === extra[0] && extra.length === 4 && same && tokSame && Number(extra[0].slice(1)) > Math.max(...a.map(x => Number(x.slice(1)))), JSON.stringify({ extra, same, tokSame }));
      assert(!(chk.invalid?.length) && !(chk.dangling?.length), JSON.stringify(chk));
    },
  },
  {
    name: 'on the live lane every HAD-17 is marking, his and yours (v0.0.20: one helper issues both P-12s, issueHouseSidearm; v0.0.19 gave his the house\'s frangible there, so with his P-12 the default two of the lane\'s four pistol magazines were frangible); off the live lane both are frangible',
    fn() {
      const out = {};
      for (const opfor of ['live', null]) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', ...(opfor ? { opfor } : {}) }), s = g.state, H = s.armoury.range.house;
        const of = (gunId) => { const p = s.items[gunId], k = Object.values(s.people).find(x => x.kit?.worn?.holster === gunId)?.kit; return [p.mag, ...(s.items[k.worn.thigh]?.holds ?? [])].map(id => s.items[id].load); };
        out[opfor ?? 'none'] = { mine: of(H.pistol), his: of(H.two.pistol), all: Object.values(s.items).filter(x => x.fam === 'had17').map(x => x.load) };
      }
      console.log(`      live: yours ${out.live.mine.join(', ')}, his ${out.live.his.join(', ')} (every HAD-17 on the lane: ${out.live.all.join(', ')}); turners: yours ${out.none.mine.join(', ')}, his ${out.none.his.join(', ')}`);
      assert(out.live.all.length === 4 && out.live.all.every(l => l === 'marking') && out.live.his.every(l => l === 'marking'), JSON.stringify(out.live));
      assert(out.none.all.length === 4 && out.none.all.every(l => l === 'frangible'), JSON.stringify(out.none));
    },
  },
  {
    name: 'his walk carries the P-12\'s weight: his kit 1.21 kg heavier with it, his push and brake by BODY §16.2\'s legs a little less (printed at the private and the tier one)',
    fn() {
      const out = [];
      for (const tier of ['private', 'tierone']) {
        const off = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, loadout: NONE }), on = createGame({ scenario: 'test-shoothouse', seed: 48213, tier });
        const m = (g) => kitMassKg(g.state, two(g.state).pid), l = (g) => legsOf(g.state, two(g.state).pid);
        out.push({ tier, kg: [m(off), m(on)], push: [l(off).pushMs2, l(on).pushMs2], brake: [l(off).brakeMs2, l(on).brakeMs2] });
      }
      for (const o of out) console.log(`      ${o.tier}: his kit ${fmt(o.kg[0], 2)} → ${fmt(o.kg[1], 2)} kg, push ${fmt(o.push[0], 3)} → ${fmt(o.push[1], 3)} m/s², brake ${fmt(o.brake[0], 3)} → ${fmt(o.brake[1], 3)} m/s²`);
      assert(out.every(o => Math.abs(o.kg[1] - o.kg[0] - 1.21) < 0.02 && o.push[1] < o.push[0] && o.brake[1] < o.brake[0]), JSON.stringify(out));
    },
  },
  {
    name: 'the tower\'s commands cover his P-12 as yours: MAKE READY racks it and holsters it on safe (Condition 1), Stop leaves it holstered on safe, SHOW CLEAR clears it (no magazine, the chamber empty, holstered on safe), each within his macro\'s time at the private and the tier one (printed)',
    heavy: true,
    timeoutMs: 120_000,
    fn() {
      const out = [];
      for (const tier of ['private', 'tierone']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, loadout: P12 }), s = g.state, W = two(s), p = W.pistol, seen = {};
        let cur = null;
        runHouse(g, tier === 'private' ? houseKeysBot() : houseHonestBot(), { maxMs: 12 * 60_000, each: () => {
          const d = W.doing;
          if (d && !d.beats && d.list?.some(x => x.startsWith('pistol:'))) cur = { cmd: d.cmd, fromMs: d.fromMs, planMs: d.planMs };
          if (cur && !W.doing) { seen[cur.cmd] = { ...cond(s, p), livedMs: s.clock.ms - cur.fromMs, planMs: cur.planMs }; cur = null; }
          if (s.armoury.range.cmd?.id === 'stop' && !seen.stop && !W.doing) seen.stop = { ...cond(s, p), livedMs: 0, planMs: 0 };
        } });
        out.push({ tier, seen, end: cond(s, p), b: beliefOf(s, p) });
      }
      for (const o of out) console.log(`      ${o.tier}: ${Object.entries(o.seen).map(([c, v]) => `${c} ${v.holstered ? 'holstered' : 'OUT'} ${v.chamber} ${v.mode} ${v.mag ? 'mag in' : 'no mag'} (${fmt(v.livedMs / 1000, 2)} s lived, planned ${fmt(v.planMs / 1000, 2)})`).join(' · ')}; at the card ${JSON.stringify(o.end)}`);
      assert(out.every(o => o.seen.ready && o.seen.ready.holstered && o.seen.ready.chamber === 'live' && o.seen.ready.mode === 'safe' && o.seen.ready.mag), JSON.stringify(out.map(o => o.seen.ready)));
      assert(out.every(o => o.seen.clear && o.seen.clear.holstered && o.seen.clear.chamber === 'empty' && !o.seen.clear.mag && o.seen.clear.mode === 'safe' && o.end.holstered), JSON.stringify(out.map(o => o.seen.clear)));
      assert(out.every(o => o.seen.stop?.holstered && o.seen.stop.mode === 'safe'), JSON.stringify(out.map(o => o.seen.stop)));
      assert(out.every(o => Object.values(o.seen).every(v => v.livedMs <= v.planMs + 500 + 3000)), 'within his macro (a fumble\'s own cost allowed: ADMIN_SLACK_MS 500 + its retry)');
    },
  },
  {
    name: 'his rifle stopped with an armed man facing him within 10 m: he draws his P-12 (no "Gun down!"), fires it on his man, and once nobody faces him holsters it and brings the rifle back to fire ("Gun up!"); the room cleared, the P-12 holstered at the card (v0.0.18: Gun down only)',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'room:3', loadout: P12 }), s = g.state, W = two(s), rifle = s.people[W.pid].kit.worn.sling;
      s.items[rifle].chamber = 'case';
      const macros = [], says = [], guns = new Set();
      let hand = false;
      runHouse(g, houseHonestBot(), { maxMs: 60_000, each: (game) => {
        if (W.down?.macro && macros.at(-1) !== W.down.macro) macros.push(W.down.macro);
        if (W.hand === 'pistol') hand = true;
        for (const f of game.facts('say')) if (f.who === W.pid) says.push(f.text);
        for (const sh of s.armoury.range.shots ?? []) if (sh.pid === W.pid || sh.by === W.pid) guns.add(sh.gunId ?? sh.gun);
      } });
      const end = cond(s, W.pistol), room3 = s.armoury.range.house.rooms[2];
      console.log(`      his answers ${macros.join(' then ')}; the P-12 in his hand ${hand}; he said ${says.filter(t => /Gun|Up|Reload/.test(t)).join(' ')}; room 3 ${room3.state}; at the card ${JSON.stringify(end)}`);
      assert(macros[0] === 'transition' && macros.includes('rifle-up') && hand && !says.slice(0, 1).includes('Gun down!') && says.includes('Gun up!') && end.holstered && room3.state === 'clear', JSON.stringify({ macros, hand, says, end, state: room3.state }));
    },
  },
  {
    name: 'his P-12\'s rack fumbled at MAKE READY is tried again, as his rifle\'s halts are (house-two.js twoHalt, TWO_TRIES): the boot recruit from the brief by the keys, seeds 7001, 7300 and 8170, GO within 20 s of the same lane without his P-12 and no \'slow\' fault charged to you (the review of v0.0.20\'s asks: GO at 127 to 128 s, the stall blamed on you twice; v0.0.19 on 7001 without his P-12, 20 s)',
    timeoutMs: 60_000,
    fn() {
      const out = [];
      for (const seed of [7001, 7300, 8170]) {
        const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'recruit' }), s = g.state, H = s.armoury.range.house, t0 = s.clock.ms;
        let halts = 0;
        toGo(g, houseKeysBot(), () => { const d = H.two.doing; if (d && !d.beats) halts = Math.max(halts, d.tries ?? 0); });
        const goS = H.goAtMs === null ? null : (H.goAtMs - t0) / 1000, slow = s.armoury.range.faults.filter(f => f.rule === 'slow');
        // (against the same seed with '~two:none' (v0.0.20's integration: the tower now waits on the instructor's lines, item 7, so GO
        // comes about 20 s later whatever his P-12 does; the bound is his P-12's own cost, 20 s at most, where the fault cost 97 s and more)
        const g0 = createGame({ scenario: 'test-shoothouse', seed, tier: 'recruit', loadout: 'standard~two:none' }), H0 = g0.state.armoury.range.house, t00 = g0.state.clock.ms;
        toGo(g0, houseKeysBot(), () => {});
        const goNone = H0.goAtMs === null ? null : (H0.goAtMs - t00) / 1000;
        out.push({ seed, goS, goNone, tries: halts, slow: slow.length, pistol: gunField(s.items[H.two.pistol], 'chamber') });
        assert(goS !== null && goNone !== null && goS - goNone < 20 && !slow.length && gunField(s.items[H.two.pistol], 'chamber') === 'live', JSON.stringify(out.at(-1)));
      }
      console.log(`      ${out.map(o => `${o.seed}: GO ${fmt(o.goS, 2)} s (without his P-12 ${fmt(o.goNone, 2)} s), his tries ${o.tries}, slow ${o.slow}`).join('; ')}`);
    },
  },
  {
    name: 'a want of your number two\'s at MAKE READY\'s move-on is his: the instructor racks his P-12 ("Number two, your pistol had no round up. I\'ve racked it."), his MAKE READY is given up, the standby never waits on him again and no \'slow\' fault is charged to you (the review of v0.0.20\'s asks: "I will not wait for you. Keep up.", then 60 s more to GO)',
    timeoutMs: 60_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private' }), s = g.state, H = s.armoury.range.house, R = s.armoury.range, t0 = s.clock.ms;
      let undone = null;
      const said = [];
      toGo(g, houseKeysBot(), (game) => {
        for (const f of game.facts('say')) said.push(f.text);
        // (once his MAKE READY is done and the tower waits on him alone: his P-12's round taken out, as a rack he never tried again)
        if (!undone && R.cmd?.id === 'ready' && !H.two.doing && houseWant(s) === null) {
          const p = s.items[H.two.pistol]; p.chamber = null; p.belief = { ...(p.belief ?? {}), chamber: 'empty' };
          undone = { atMs: s.clock.ms, want: houseWant(s), lacks: twoLacks(s, 'ready') };
        }
      });
      const goS = (H.goAtMs - t0) / 1000, slow = R.faults.filter(f => f.rule === 'slow'), racked = said.find(t => /^Number two.*racked/i.test(t));
      console.log(`      his round taken out at ${fmt((undone?.atMs - t0) / 1000, 2)} s (the tower's want ${undone?.want}); GO ${fmt(goS, 2)} s; "${racked}"; slow faults ${slow.length}; given up ${JSON.stringify(H.two.gaveUp ?? null)}`);
      assert(undone && undone.want === 'two:chamber', JSON.stringify(undone));
      assert(racked && H.two.gaveUp?.ready && gunField(s.items[H.two.pistol], 'chamber') === 'live', JSON.stringify({ racked, gaveUp: H.two.gaveUp, ch: gunField(s.items[H.two.pistol], 'chamber') }));
      assert(!slow.length, JSON.stringify(slow));
      assert(goS < 100, JSON.stringify({ goS, note: 'the standby waited on him to its own move-on' }));
    },
  },
];
