// OLYMPUS tests: one rule, real (F154): on the boarding's ledger a strike is the round's own load on the struck man's own body, the bus on, down the body's own; a 'wound' lane's strike is still on its scratch body (v0.0.27's build sheet §6 B, items 7 and 13, FT§2, FT§5; src/sim/combat/would.js).
//
// On tests/boarding-world.mjs (the hauler's cabin 2, a pirate on 4a, the ledger 'real') B's own functions are called on the state: would.js
// strikeOf and wouldHave with the scene's bus, body/domain.js woundsFast for the stance, kit.js's boarding issues. FT§2's table is
// reprinted from the game's own path (wouldHave on 'real' over a bare state a trial) within 3 points. Each case fails without its fix:
// with the rule's real branch undone, the pirate's body stays bare and the ledger keeps a would-have body; with 'pc-m3p' rated as the
// training carrier, no round meets a plate; with the 'wound' path moved, its entries differ.
import { assert, fmt } from './helpers.mjs';
import { boardingWorld } from './boarding-world.mjs';
import { createGame } from './game.mjs';
import { newLedger, wouldHave, strikeOf, fatalWhy, realOf, armourOf, STANDS_FOR, WOULD_EXERTION } from '../src/sim/combat/would.js';
import { woundsFast } from '../src/sim/body/domain.js';
import { downOf, hasWounds, holdFactor } from '../src/sim/body/wounds.js';
import { BODY_V } from '../src/sim/body/record.js';
import { BODY_TMPL } from '../src/data/people/looks.js';
import { issueBoarding, ownerOf, KIT_TEMPLATES, BOARDING_ISSUES } from '../src/sim/arms/kit.js';

// (a bus that keeps its facts)
const busOf = () => { const events = []; return { events, emit: (type, data) => events.push({ type, data }) }; };
// (a shot record as shot.js resolveShot writes one: a hit's fields only)
const shotOf = (id, who, gun, atMs, { load, part = 'torso', zone = 'A', margin = 4, rangeM = 4 } = {}) => ({ id, who, gun, atMs, fired: true, load, part, zone, roll: { margin }, flight: { rangeM } });
const actorOf = (s, pid) => s.actors.list.find(a => a.who === pid);

// (FT§2's computation: a bare state a trial, the ledger 'real', a man of a Fitness with or without the plates, a pair 350 ms apart)
function trial(i, { load, model, plates, fitness, marine, rounds = 2 }) {
  const S = { meta: { seed: 48213 }, clock: { ms: 0 }, player: { id: null }, actors: { list: [] }, places: { live: { site: 'belt-mule', area: 'mule.crew' } },
    people: { m: { sex: 'm', service: { branch: marine ? 'marines' : 'civilian' }, kit: { worn: plates ? { carrier: 'c' } : {} }, body: { v: BODY_V, tmpl: BODY_TMPL.m, fitness } } },
    items: { c: { type: 'carrier', model: 'pc-m3p' }, g: { type: 'gun', model } }, armoury: { range: { course: 'house', house: { live: { would: newLedger('real') } } } } };
  const out = [];
  // (each strike at a walk's exertion, as the lens computed it (the live lane's would-have holds its body so: would.js WOULD_EXERTION);
  // aboard the body domain holds each body at its own gait every tick, woundsFast)
  for (let k = 0; k < rounds; k++) {
    out.push(wouldHave(S, strikeOf(S, shotOf(`ft${i}:${k}`, null, 'g', k * 350, { load, margin: 4, rangeM: 4 }), { on: 'm' }), null));
    if (hasWounds(S.people.m.body)) holdFactor(S.people.m.body, k * 350, { exertion: WOULD_EXERTION });
  }
  const body = S.people.m.body, last = (rounds - 1) * 350, wounded = out.some(e => e.why !== 'stopped');
  const why = wounded ? fatalWhy(body, last) : null, knockS = body.knock ? (body.knock.untilMs - last) / 1000 : 0;
  return { stopped: out.filter(e => e.why === 'stopped').length, wounded, down: !!why && why !== 'bleeds', bleeds: why === 'bleeds', up: wounded && !why, knockS };
}
function row(spec, n = 3000) {
  const t = Array.from({ length: n }, (_, i) => trial(i, spec)), pct = (k) => (100 * k) / n, rounds = spec.rounds ?? 2;
  const ks = t.filter(x => x.wounded && x.knockS > 0).map(x => x.knockS).sort((a, b) => a - b), at = (p) => ks[Math.min(ks.length - 1, Math.floor(p * ks.length))] ?? 0;
  return { stopped: (100 * t.reduce((a, x) => a + x.stopped, 0)) / (n * rounds), wounded: pct(t.filter(x => x.wounded).length), down: pct(t.filter(x => x.down).length),
    bleeds: pct(t.filter(x => x.bleeds).length), up: pct(t.filter(x => x.up).length), knockMed: at(0.5), knock90: at(0.9) };
}
// (FT§2's table: the lens's figures, its own computation on the snapshot)
const FT2 = [
  { name: 'your frangible pair on an unarmoured defender (Fitness 10)', spec: { load: 'frangible', model: 'r7', plates: false, fitness: 10, marine: false }, want: { stopped: 0, wounded: 100, down: 81.5, bleeds: 7.6, up: 10.9 } },
  { name: 'their P-12 9×21 ball pair on a marine, plates in (14)', spec: { load: 'ball', model: 'p12', plates: true, fitness: 14, marine: true }, want: { stopped: 84, wounded: 29, down: 0, bleeds: 0.6, up: 28.6 } },
  { name: 'their R-7 ball pair on a marine, plates in (14)', spec: { load: 'ball', model: 'r7', plates: true, fitness: 14, marine: true }, want: { stopped: 54, wounded: 71, down: 12.7, bleeds: 3.2, up: 55.3 } },
  { name: 'their R-7 ball, one round, plates in (14)', spec: { load: 'ball', model: 'r7', plates: true, fitness: 14, marine: true, rounds: 1 }, want: { stopped: 54, wounded: 46, down: 0, bleeds: 0, up: 46 } },
];

export default [
  {
    name: 'your frangible pair on a pirate (F154): rated once each on his own body by the round\'s own load, the bus told, his stance down, the ledger\'s verdict fatalWhy of his body, no would-have body kept',
    fn() {
      const w = boardingWorld({ room: 'cabin-2' }), s = w.s, man = w.men[0], gun = s.people[w.pid].kit.worn.sling, bus = busOf(), t0 = s.clock.ms;
      const mine = s.items[s.items[gun].mag ?? ''] ?? null;
      assert(realOf(s) && armourOf(s, man.pid) === 'carrierTraining' && !hasWounds(s.people[man.pid].body), JSON.stringify({ real: realOf(s), armour: armourOf(s, man.pid) }));
      // (the role-player's training carrier off: a holdout wears none (kit.js 'boarding-pirate'))
      delete s.people[man.pid].kit.worn.carrier;
      const e1 = wouldHave(s, strikeOf(s, shotOf('cr1', w.pid, gun, t0, { load: 'frangible', rangeM: 3.4 }), { on: man.pid, by: 'me' }), bus);
      const e2 = wouldHave(s, strikeOf(s, shotOf('cr2', w.pid, gun, t0 + 350, { load: 'frangible', rangeM: 3.4 }), { on: man.pid, by: 'me' }), bus);
      const again = wouldHave(s, strikeOf(s, shotOf('cr2', w.pid, gun, t0 + 350, { load: 'frangible', rangeM: 3.4 }), { on: man.pid, by: 'me' }), bus);
      const body = s.people[man.pid].body, W = s.armoury.range.house.live.would, wounds = bus.events.filter(e => e.type === 'wound');
      // (no blood on the deck at 0 G: wounds.js applyHit spills nothing under FREE_G_MS2)
      const pools = (s.places.sites[s.places.live.site]?.blood ?? []).length;
      s.clock.ms = t0 + 400; woundsFast(s, null);
      const a = man.actor();
      console.log(`      the pirate on 4a, ${fmt(3.4, 1)} m, your rifle's magazine ${mine?.load ?? '?'}: round 1 ${e1.part} ${e1.layer} ${e1.why ?? 'a wound'} (w ${e1.w}, knock ${e1.knockS} s), round 2 ${e2.part} ${e2.why ?? 'a wound'}; injuries ${body.injuries.length} (${body.injuries.filter(i => i.gunshot && !i.internal).map(i => i.where).join(', ')}); 'wound' facts ${wounds.length}; stance ${a.stance ?? 'up'} (downOf ${downOf(body, t0 + 400).why})`);
      console.log(`      the ledger: ${W.log.length} entries, rule ${W.rule}, bodies kept ${Object.keys(W.bodies).length}; the verdict ${e2.why} = fatalWhy ${fatalWhy(body, t0 + 350)} at the second round; blood on the deck at 0 G ${pools}`);
      assert(pools === 0, `no spatter at 0 G (${pools})`);
      assert(e1.load === 'frangible' && e2.load === 'frangible' && W.log.length === 2 && again === e2, JSON.stringify(W.log));
      assert(hasWounds(body) && body.injuries.some(i => i.gunshot) && wounds.length === 2 && wounds.every(f => f.data.who === man.pid), JSON.stringify({ wounds: wounds.length }));
      assert(Object.keys(W.bodies).length === 0, 'no would-have body on real');
      assert(e2.why === fatalWhy(body, t0 + 350) && e2.fatal === (e2.why !== null), JSON.stringify(e2));
      assert(a.stance === 'down' && downOf(body, t0 + 400).down, JSON.stringify({ stance: a.stance }));
    },
  },
  {
    name: 'a pirate\'s pair on you, plates in (F154): the first round stopped by the plate, nothing on your body; the second in your left or right arm, your own body wounded, the knock trained, your stance down',
    fn() {
      const w = boardingWorld({ room: 'cabin-2' }), s = w.s, man = w.men[0], pgun = s.people[man.pid].kit.worn.sling, t0 = s.clock.ms;
      // (your carrier with its plates in: the boarding's issue (kit.js 'boarding-cqb'), as D's fill gives it)
      s.items[s.people[w.pid].kit.worn.carrier].model = 'pc-m3p';
      const body0 = JSON.stringify(s.people[w.pid].body ?? null);
      // (the first shot ids whose pair is a plate's stop and then an arm: searched on the strike's own stream, each try on a fresh ledger and body)
      let found = null, tries = 0;
      for (let k = 0; k < 400 && !found; k++) {
        tries++;
        s.armoury.range.house.live.would = newLedger('real');
        s.people[w.pid].body = JSON.parse(body0) ?? undefined; if (!s.people[w.pid].body) delete s.people[w.pid].body;
        const bus = busOf();
        const e1 = wouldHave(s, strikeOf(s, shotOf(`pp${k}a`, man.pid, pgun, t0, { load: 'ball', margin: 2, rangeM: 3.6 }), { on: w.pid, by: man.T.key }), bus);
        if (!(e1.why === 'stopped' && e1.layer === 'plate')) continue;
        const after1 = JSON.stringify(s.people[w.pid].body ?? null);
        const e2 = wouldHave(s, strikeOf(s, shotOf(`pp${k}b`, man.pid, pgun, t0 + 350, { load: 'ball', margin: 2, rangeM: 3.6 }), { on: w.pid, by: man.T.key }), bus);
        if (e2.why !== 'stopped' && /^arm/.test(e2.part)) found = { k, e1, e2, after1, bus };
      }
      assert(found, `no plate-then-arm pair in ${tries} tries`);
      const { e1, e2, after1, bus } = found, body = s.people[w.pid].body;
      s.clock.ms = t0 + 400; woundsFast(s, null);
      console.log(`      shot ids pp${found.k}a and pp${found.k}b (${tries} tries): round 1 ${e1.layer} ${e1.why}, the body after it ${after1 === body0 ? 'as it was' : 'changed'}; round 2 ${e2.part}, ${e2.where}, w ${e2.w}, knock ${e2.knockS} s (trained ×0.4); your stance ${w.me().stance ?? 'up'}`);
      assert(after1 === body0, 'a plate\'s stop leaves your body as it was (blunt trauma not built)');
      assert(body.injuries.some(i => i.gunshot && /^arm/.test(i.part)) && bus.events.some(f => f.type === 'wound' && f.data.who === w.pid), JSON.stringify(body.injuries));
      assert(e2.knockS > 0 && e2.knockS <= 12 * 0.4 * 3 + 1e-9 && w.me().stance === 'down', JSON.stringify({ knockS: e2.knockS, stance: w.me().stance }));
    },
  },
  {
    name: 'FT§2\'s table reprinted from the game\'s own path (would.js on \'real\', 3,000 trials a row) within 3 points: your frangible pair ends a man nine times in ten; their rounds mostly cost a marine a knock behind his plates',
    fn() {
      const bad = [];
      for (const r of FT2) {
        const got = row(r.spec);
        console.log(`      ${r.name}: stopped ${fmt(got.stopped)}% (${r.want.stopped}), wounded ${fmt(got.wounded)}% (${r.want.wounded}), down for good ${fmt(got.down)}% (${r.want.down}), bleeds down ${fmt(got.bleeds)}% (${r.want.bleeds}), up after the knock ${fmt(got.up)}% (${r.want.up}); knock ${fmt(got.knockMed)} s / ${fmt(got.knock90)} s`);
        for (const k of ['stopped', 'wounded', 'down', 'bleeds', 'up']) if (Math.abs(got[k] - r.want[k]) > 3) bad.push(`${r.name}: ${k} ${fmt(got[k])} against ${r.want[k]}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'a \'wound\' lane is untouched (F150, F154): its strike is still rated on the scratch body by STANDS_FOR\'s ball whatever the round\'s load, the man\'s own body bare, and no wound told',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', opfor: 'live' }), s = g.state, L = s.armoury.range.house.live;
      const T = s.armoury.range.turners.find(t => t.live), gun = s.people[s.player.id].kit.worn.sling, t0 = s.clock.ms;
      assert(L.would.rule === 'wound' && !realOf(s), JSON.stringify(L.would.rule));
      const bus = busOf(), a = wouldHave(s, strikeOf(s, shotOf('wl1', s.player.id, gun, t0, { load: 'marking' }), { on: T.live.who, by: 'me' }), bus);
      L.would = newLedger();
      const b = wouldHave(s, strikeOf(s, shotOf('wl1', s.player.id, gun, t0, { load: 'frangible' }), { on: T.live.who, by: 'me' }), bus);
      const strip = (e) => JSON.stringify({ ...e });
      console.log(`      the live lane's man ${T.stand}: ${a.part} ${a.layer} ${a.why ?? 'a wound'} (w ${a.w}) with a marking round's record, the same with a frangible's: ${strip(a) === strip(b)}; would-have bodies ${Object.keys(L.would.bodies).length}, his own body ${hasWounds(s.people[T.live.who].body) ? 'wounded' : 'bare'}, wound facts ${bus.events.filter(e => e.type === 'wound').length}; STANDS_FOR ${JSON.stringify(STANDS_FOR)}`);
      assert(strip(a) === strip(b) && !('load' in a), JSON.stringify({ a, b }));
      assert(Object.keys(L.would.bodies).length === 1 && !hasWounds(s.people[T.live.who].body) && !bus.events.some(e => e.type === 'wound'), 'the scratch body only');
      // (and the same man struck on a real ledger in the Wheel, 1 G: his own body, the blood where he stood)
      L.would = newLedger('real');
      const site = s.places.live.site, n0 = (s.places.sites[site]?.blood ?? []).length;
      const c = wouldHave(s, strikeOf(s, shotOf('wl2', s.player.id, gun, t0, { load: 'frangible', part: 'legs' }), { on: T.live.who, by: 'me' }), bus);
      const n1 = (s.places.sites[site]?.blood ?? []).length;
      console.log(`      on a real ledger in the Wheel: ${c.part} ${c.why ?? 'a wound'}, his own body ${hasWounds(s.people[T.live.who].body) ? 'wounded' : 'bare'}, blood on the floor ${n0} → ${n1}`);
      assert(hasWounds(s.people[T.live.who].body) && n1 === n0 + 1, JSON.stringify({ n0, n1 }));
    },
  },
  {
    name: 'no drip on the deck at 0 G either (body/blood.js dripStep under FREE_G_MS2, as applyHit\'s spatter): the pirate bleeding on 4a drips nothing over 30 s; the same man bleeding in the Wheel drips (the review of v0.0.27: the deck took decals and pools from every bleeding body)',
    fn() {
      const w = boardingWorld({ room: 'cabin-2' }), s = w.s, man = w.men[0], gun = s.people[w.pid].kit.worn.sling, t0 = s.clock.ms;
      delete s.people[man.pid].kit.worn.carrier;
      wouldHave(s, strikeOf(s, shotOf('bd1', w.pid, gun, t0, { load: 'frangible', part: 'legs', rangeM: 3.4 }), { on: man.pid, by: 'me' }), busOf());
      const site = s.places.live.site, drops = (S, st) => (S.places.sites[st]?.blood ?? []).reduce((n, d) => n + d.n, 0), d0 = drops(s, site);
      for (let k = 1; k <= 600; k++) { s.clock.ms = t0 + k * 50; woundsFast(s, null); }
      const bleeding = s.people[man.pid].body.injuries.some(i => i.bleed > s.clock.ms && !i.internal && !i.cared), d1 = drops(s, site);
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', opfor: 'live' }), S = g.state, T = S.armoury.range.turners.find(t => t.live);
      S.armoury.range.house.live.would = newLedger('real');
      wouldHave(S, strikeOf(S, shotOf('bd2', S.player.id, S.people[S.player.id].kit.worn.sling, S.clock.ms, { load: 'frangible', part: 'legs' }), { on: T.live.who, by: 'me' }), busOf());
      const wsite = S.places.live.site, e0 = drops(S, wsite), u0 = S.clock.ms;
      for (let k = 1; k <= 600; k++) { S.clock.ms = u0 + k * 50; woundsFast(S, null); }
      const e1 = drops(S, wsite);
      console.log(`      the pirate on 4a at 0 G, a leg bleeding ${bleeding}: drops on the deck ${d0} → ${d1} over 30 s; the live lane's man in the Wheel at 1 G: ${e0} → ${e1}`);
      assert(bleeding && d1 === d0 && e1 > e0, JSON.stringify({ bleeding, d0, d1, e0, e1 }));
    },
  },
  {
    name: 'the boarding\'s issues carry no marking round (F154): \'boarding-cqb\' frangible with the plates in and the mag boots, the pirates\' R-7 and the smugglers\' P-12 ball, the crew nothing but boots',
    fn() {
      const w = boardingWorld({ room: 'cabin-2', men: 1 }), s = w.s, out = {};
      for (const [who, id] of Object.entries(BOARDING_ISSUES)) {
        const pid = `ti-${who}`;
        s.people[pid] = { sex: 'm', name: { given: 'Test', family: who } };
        const r = issueBoarding(s, pid, id), mine = Object.entries(s.items).filter(([iid, it]) => ownerOf(s, iid) === pid);
        const loads = [...new Set(mine.filter(([, it]) => it.type === 'mag').map(([, it]) => it.load))], guns = mine.filter(([, it]) => it.type === 'gun').map(([, it]) => it.model);
        out[who] = { loads, guns, armour: armourOf(s, pid), boots: !!s.people[pid].kit.worn?.boots, pistol: !!r.pistol };
      }
      console.log(`      ${Object.entries(out).map(([k, v]) => `${k}: ${v.guns.join('+') || 'no gun'}, ${v.loads.join('/') || 'no rounds'}, armour ${v.armour ?? 'none'}, boots ${v.boots}`).join('; ')}`);
      assert(Object.values(out).every(v => !v.loads.includes('marking') && v.boots), JSON.stringify(out));
      assert(out.marine.armour === 'carrier' && out.marine.loads.join() === 'frangible' && out.marine.guns.sort().join() === 'p12,r7', JSON.stringify(out.marine));
      assert(out.pirate.armour === null && out.pirate.loads.join() === 'ball' && out.pirate.guns.join() === 'r7', JSON.stringify(out.pirate));
      assert(out.smuggler.loads.join() === 'ball' && out.smuggler.guns.join() === 'p12' && out.crew.guns.length === 0, JSON.stringify(out));
      assert(Object.keys(KIT_TEMPLATES).filter(k => k.startsWith('boarding-')).length === 4, 'four issues');
    },
  },
];
