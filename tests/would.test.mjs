// OLYMPUS tests: the would-have of a marking round, the one rule that judges every strike on the live lane fatal or not (v0.0.20; src/sim/combat/would.js; COMBAT §25.18.7). The user's answer of 2026-11-16 to v0.0.19's question 7: "Paintball should end if the hit is 'fatal'".
//
// What each test pins, each failing without its change:
//   - one torso strike of either gun is never fatal at Fitness 8 to 21 (the R-7's ball and the P-12's, through the carrier's soft
//     panel as worn), two R-7 strikes fatal far more often at Fitness 8 than at 21, a rifle round in the head fatal nearly always:
//     the would-have's own table, 500 strikes a cell, printed (the design sheet's 2,000 a cell agree within chance);
//   - the soft panel ('carrierTraining', kit.js 'pc-m3''s armour) stops a 9×21 ball always and lets a 6.5 ball through 98.6% of the
//     time (penetrate.js pStop at 5 m, printed);
//   - one rule: a strike on you and on your #2 (men.js incoming) and on a role-player (opfor.js opforHit) is rated by the same helper,
//     the entry each writes the one wouldHave gives for the same strike on a copy of the state; nothing written on any man's own body,
//     no 'wound' fact;
//   - a verdict is the same after a save and a load mid-lane (the ledger saved with the lane, the dice keyed by the seed, the man and
//     the shot);
//   - wounds.js applyHit with a round too weak to cut (w 0.05) on an unwounded torso returns its record (it threw a TypeError at
//     rec.injuries.find before v0.0.20's guard).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot } from './bots/house.mjs';
import { wouldHave, fatalOf, fatalWhy, strikeOf, STANDS_FOR, BLEED_OUT_MS } from '../src/sim/combat/would.js';
import { incoming } from '../src/sim/combat/men.js';
import { opforHit } from '../src/sim/scenarios/opfor.js';
import { applyHit, downOf } from '../src/sim/body/wounds.js';
import { BODY_V } from '../src/sim/body/record.js';
import { penOf, pStop, hitOf, bodyHit, LAYERS, ARMOUR } from '../src/sim/arms/penetrate.js';
import { stream } from '../src/core/rng.js';
import { flightOf, envOfPlace } from '../src/sim/arms/ballistics.js';
import { CONTAINERS } from '../src/sim/arms/kit.js';

const FITNESS = [8, 12, 14, 19, 21], N = 500;
// (a live lane on the sergeant's sheet at GO: the ledger, the kit's carrier and both guns)
const live = (seed = 48213) => createGame({ scenario: 'test-shoothouse', seed, tier: 'sgt', setup: 'go', opfor: 'live' });

export default [
  {
    name: 'one torso strike of either gun is never fatal at Fitness 8 to 21 (the live round\'s ball through the carrier\'s soft panel as worn), two R-7 strikes fatal for at least 80% at Fitness 8 and 10 to 40% at 21 (w at the impact\'s speed, the live path\'s), a rifle round in the head nearly always; 500 strikes a cell (the would-have\'s table, printed)',
    timeoutMs: 120_000,
    fn() {
      const g = live(), s = g.state, H = s.armoury.range.house, me = s.people[s.player.id], rifle = me.kit.worn.sling, pistol = H.pistol, at = s.clock.ms;
      const rows = [], cell = {};
      for (const [gun, gunId] of [['R-7', rifle], ['P-12', pistol]]) for (const F of FITNESS) {
        let one = 0, two = 0, head = 0, stopped = 0;
        for (let i = 0; i < N; i++) {
          const on = `w:${gun}:${F}:${i}`;
          s.people[on] = { sex: 'm', service: me.service, kit: me.kit };
          H.live.would.bodies[on] = { v: BODY_V, tmpl: 'm-adult', fitness: F };
          const a = wouldHave(s, { on, by: 'test', shotId: `${on}:1`, atMs: at, part: 'torso', zone: 'A', margin: 6, rangeM: 5, gunId });
          if (a.fatal) one++;
          if (a.why === 'stopped') stopped++;
          const b = wouldHave(s, { on, by: 'test', shotId: `${on}:2`, atMs: at + 350, part: 'torso', zone: 'A', margin: 6, rangeM: 5, gunId });
          if (b.fatal || a.fatal) two++;
          const hon = `${on}:h`;
          s.people[hon] = { sex: 'm', service: me.service, kit: me.kit };
          H.live.would.bodies[hon] = { v: BODY_V, tmpl: 'm-adult', fitness: F };
          if (wouldHave(s, { on: hon, by: 'test', shotId: `${hon}:1`, atMs: at, part: 'head', zone: 'head', margin: 6, rangeM: 5, gunId }).fatal) head++;
          delete s.people[on]; delete s.people[hon];
        }
        cell[`${gun}:${F}`] = { one, two, head, stopped };
        rows.push(`${gun} Fitness ${F}: one strike ${fmt(one / N * 100, 1)}%, two ${fmt(two / N * 100, 1)}%, the head ${fmt(head / N * 100, 1)}%; stopped by the panel ${fmt(stopped / N * 100, 1)}%`);
      }
      H.live.would.log.length = 0;
      for (const r of rows) console.log(`      ${r}`);
      assert(Object.values(cell).every(c => c.one === 0), JSON.stringify(cell));
      // (v0.0.20's review: w at the impact's speed, the live path's (penetrate.js bodyHit): two strikes 92, 89, 83, 44 and 24% at
      // Fitness 8, 12, 14, 19 and 21 (500 a cell); with w after the panel, the first build's, 50, 12, 5, 2 and 2%)
      assert(cell['R-7:8'].two >= N * 0.8 && cell['R-7:8'].two > cell['R-7:21'].two + N * 0.4 && cell['R-7:21'].two > N * 0.1 && cell['R-7:21'].two < N * 0.4, JSON.stringify({ r8: cell['R-7:8'], r21: cell['R-7:21'] }));
      assert(FITNESS.every(F => cell[`R-7:${F}`].head >= N * 0.95), JSON.stringify(FITNESS.map(F => cell[`R-7:${F}`].head)));
    },
  },
  {
    name: 'the soft panel (the carrier worn with its plates out for training: kit.js \'pc-m3\' armour \'carrierTraining\', 0.85 of the torso) stops a 9×21 ball always and lets a 6.5 ball through 98.6% of the time at 5 m; the live load is the calibre\'s ball',
    fn() {
      const g = live(), s = g.state, env = envOfPlace(s), P = LAYERS.soft.P;
      const r7 = flightOf('r7', STANDS_FOR['6.5x40r'], env, 5), p12 = flightOf('p12', STANDS_FOR['9x21r'], env, 5);
      const pen7 = penOf('6.5x40r', 'ball', r7.vMs), pen9 = penOf('9x21r', 'ball', p12.vMs), s7 = pStop(pen7, P), s9 = pStop(pen9, P);
      console.log(`      the R-7's ball at 5 m: ${Math.round(r7.vMs)} m/s, pen ${fmt(pen7, 2)} mm against the panel's ${P}: stopped ${fmt(s7 * 100, 1)}%; the P-12's: ${Math.round(p12.vMs)} m/s, pen ${fmt(pen9, 2)} mm: stopped ${fmt(s9 * 100, 1)}%; the carrier ${CONTAINERS['pc-m3'].armour} covers ${JSON.stringify(ARMOUR.carrierTraining.cover)}; BLEED_OUT_MS ${BLEED_OUT_MS}`);
      assert(CONTAINERS['pc-m3'].armour === 'carrierTraining' && ARMOUR.carrierTraining.cover.soft === 0.85 && s9 === 1 && Math.abs(s7 - 0.014) < 0.003, JSON.stringify({ s7, s9 }));
    },
  },
  {
    name: 'one rule: a strike on you and on your #2 (men.js incoming) and on a role-player (opfor.js opforHit) is rated by one helper, the entry each writes the one wouldHave gives for the same strike on a copy of the lane; nothing written on any man\'s own body and no \'wound\' fact; a fatal verdict is the casualty or the man down',
    fn() {
      const g = live(), s = g.state, H = s.armoury.range.house, pid = s.player.id, two = H.twoPid, T = s.armoury.range.turners.find(t => t.stand === '2a'), rp = T.live.who;
      const shot = (id, part, zone, gun) => ({ id, fired: true, hole: { at: [0, 30] }, zone, part, load: 'marking', gun, roll: { margin: 5 }, flight: { rangeM: 4.6 }, muzzle: { x: T.x, y: 1.4, z: T.z }, dirRad: 0, atMs: s.clock.ms });
      const rpGun = s.people[rp].kit.worn.sling, myGun = s.people[pid].kit.worn.sling;
      const twin = (strike) => { const c = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', opfor: 'live' }); c.load(g.save()); return wouldHave(c.state, strike); };
      const out = [];
      for (const [who, sh] of [[pid, shot('one:me', 'torso', 'A', rpGun)], [two, shot('one:two', 'torso', 'A', rpGun)]]) {
        const want = twin({ on: who, by: T.key, shotId: sh.id, atMs: sh.atMs, part: 'torso', zone: 'A', margin: 5, rangeM: 4.6, gunId: rpGun });
        const got = incoming(s, g.bus, { who, by: T.key, shot: sh }).would;
        out.push({ who: who === pid ? 'you' : 'your #2', got, want });
      }
      T.hits.push({ shotId: 'one:rp', part: 'head', zone: 'head', ring: false, through: false, at: null, atMs: s.clock.ms, by: 'me' });
      const wantRp = twin({ on: rp, by: 'me', shotId: 'one:rp', atMs: s.clock.ms, part: 'head', zone: 'head', margin: 5, rangeM: 4.6, gunId: myGun });
      const gotRp = opforHit(s, g.bus, T, { ...shot('one:rp', 'head', 'head', myGun), who: pid }).would;
      out.push({ who: 'the role-player', got: gotRp, want: wantRp });
      const bodies = [pid, two, rp].map(p => (s.people[p].body?.injuries ?? []).length), wounds = g.facts('wound').length;
      for (const o of out) console.log(`      ${o.who}: ${o.got.layer} ${o.got.fatal ? `FATAL (${o.got.why})` : o.got.why ?? `wound, ${o.got.where}`} (w ${o.got.w}); the helper on a copy: ${JSON.stringify(o.got) === JSON.stringify(o.want) ? 'the same entry' : `DIFFERENT ${JSON.stringify(o.want)}`}`);
      console.log(`      their own bodies' injuries ${bodies.join(', ')}; 'wound' facts ${wounds}; the role-player ${T.live.st}, the casualty ${H.live.casualty ? 'opened' : 'none'}`);
      assert(out.every(o => JSON.stringify(o.got) === JSON.stringify(o.want)), JSON.stringify(out));
      assert(bodies.every(n => n === 0) && wounds === 0, JSON.stringify({ bodies, wounds }));
      assert(gotRp.fatal === (T.live.st === 'down') && !!H.live.casualty === out.slice(0, 2).some(o => o.got.fatal) && fatalOf(s, rp) === (gotRp.fatal ? gotRp : null), JSON.stringify({ st: T.live.st, casualty: H.live.casualty }));
    },
  },
  {
    name: 'a verdict is the same after a save and a load mid-lane: the sergeant on 48213 live, saved after the first strike on the stack, carried on to the card, the ledger and the card the unbroken run\'s',
    timeoutMs: 120_000,
    fn() {
      const g = live(), H = g.state.armoury.range.house;
      let json = null;
      runHouse(g, houseHonestBot(), { maxMs: 10 * 60_000, each: (game) => { if (!json && (H.live.struck ?? []).length === 1) json = game.save(); } });
      const h = live(); h.load(json);
      const H2 = h.state.armoury.range.house, at = H2.live.would.log.length;
      runHouse(h, houseHonestBot(), { maxMs: 10 * 60_000 });
      // (the saves compared, canonical: the ledger's keys are written sorted, so a loaded one's objects read in another order)
      const a = g.save(), b = h.save(), v = (X) => X.live.would.log.map(e => `${e.shotId} ${e.fatal ? `F:${e.why}` : e.why ?? 'w'}`).join(', ');
      console.log(`      saved with ${at} entries; the unbroken run ${H.live.would.log.length} entries, ${H.end?.why}; carried on from the save ${H2.live.would.log.length}, ${H2.end?.why}; the saves at the card ${a === b ? 'byte for byte' : 'DIFFERENT'}; the verdicts ${v(H)} (from the save: ${v(H2)})`);
      assert(json && at >= 1 && a === b && v(H) === v(H2) && H.live.would.log.length > at, JSON.stringify({ at, a: H.live.would.log.length, b: H2.live.would.log.length }));
    },
  },
  {
    name: 'wounds.js applyHit with a round too weak to cut (w 0.05, no injury made) on an unwounded torso returns its record and makes the inside bleed (it threw a TypeError at rec.injuries.find before v0.0.20\'s guard; the would-have of a ball through a worn layer reached it); fatalWhy reads the body after',
    fn() {
      const s = { meta: { seed: 1 }, clock: { ms: 1000 }, player: { id: null }, people: { x: { sex: 'm', body: { v: BODY_V, tmpl: 'm-adult', fitness: 12 } } }, actors: { list: [] }, places: {} };
      let out = null, err = null;
      try { out = applyHit(s, null, { onId: 'x', part: 'torso', w: 0.05, margin: 6, shotId: 'weak' }); } catch (e) { err = e.message; }
      const rec = s.people.x.body;
      console.log(`      w 0.05 on the torso: ${err ? `threw ${err}` : `${out.part}, injuries ${JSON.stringify((rec.injuries ?? []).map(i => i.name))}, the torso ${rec.parts?.torso} points`}; fatalWhy ${err ? '-' : fatalWhy(rec, 1000)}`);
      assert(!err && out && Array.isArray(rec.injuries) && rec.injuries.some(i => i.internal) && fatalWhy(rec, 1000) === null, JSON.stringify({ err, rec }));
    },
  },
  {
    name: 'a strike\'s record is the live path\'s (v0.0.20\'s code review): the would-have calls penetrate.js bodyHit, traceRound\'s own body branch, on its stream, and the entry is that record\'s; an R-7 ball through the soft panel at 5 m carries w at the impact\'s speed, 1.61 at 5 m, as a live round\'s record does (the first build took it after the panel, 1.19)',
    fn() {
      const g = live(), s = g.state, H = s.armoury.range.house, me = s.people[s.player.id], rifle = me.kit.worn.sling, at = s.clock.ms;
      const v = flightOf('r7', 'ball', envOfPlace(s), 5).vMs, impact = hitOf({ cal: '6.5x40r', load: 'ball', vMs: v }).w;
      const soft = [], same = [];
      for (let i = 0; i < 200 && soft.length < 20; i++) {
        const on = `rec:${i}`;
        s.people[on] = { sex: 'm', service: me.service, kit: me.kit };
        const e = wouldHave(s, { on, by: 'test', shotId: `${on}:1`, atMs: at, part: 'torso', zone: 'A', margin: 6, rangeM: 5, gunId: rifle });
        const b = bodyHit(stream('would', s.meta.seed, on, `${on}:1`), { onId: on, part: 'torso', rangeM: 5, cal: '6.5x40r', load: 'ball', vMs: v, margin: 6, shotId: `${on}:1`, cover: ARMOUR.carrierTraining.cover, wear: {} });
        same.push(b.layer === e.layer && (b.stopped ? e.why === 'stopped' : b.hit.w === e.w));
        if (e.layer === 'soft' && e.why !== 'stopped') soft.push(e.w);
        delete s.people[on];
      }
      H.live.would.log.length = 0;
      console.log(`      the R-7's ball at 5 m: ${Math.round(v)} m/s, w at impact ${impact}; ${soft.length} strikes through the panel: w ${[...new Set(soft)].join(', ')}; bodyHit on the would-have's stream: the same layer and w ${same.filter(Boolean).length} of ${same.length}`);
      assert(soft.length >= 10 && soft.every(w => w === impact) && impact > 1.5 && same.every(Boolean), JSON.stringify({ impact, soft, same: same.filter(x => !x).length }));
    },
  },
  {
    name: 'an arm in front of the carrier is met before its panel (v0.0.20\'s review: the arm was turned after the panel\'s contest, so a stopped round never became an arm\'s wound and an arm\'s wound read "THROUGH THE SOFT PANEL"): P-12 strikes on the torso, some an arm\'s wound with no layer, every stop and every panel\'s wound the torso\'s; and a strike on the legs or the arms is rated there, never as the torso (strikeOf)',
    fn() {
      const g = live(), s = g.state, H = s.armoury.range.house, me = s.people[s.player.id], at = s.clock.ms;
      const tally = { arm: 0, armLayered: 0, stopped: 0, stoppedNotTorso: 0, soft: 0, softNotTorso: 0 };
      for (let i = 0; i < 400; i++) {
        const on = `arm:${i}`;
        s.people[on] = { sex: 'm', service: me.service, kit: me.kit };
        const e = wouldHave(s, { on, by: 'test', shotId: `${on}:1`, atMs: at, part: 'torso', zone: 'A', margin: 2, rangeM: 5, gunId: H.pistol });
        const arm = /^arm/.test(e.part);
        if (arm) { tally.arm++; if (e.layer !== 'bare') tally.armLayered++; }
        if (e.why === 'stopped') { tally.stopped++; if (e.part !== 'torso') tally.stoppedNotTorso++; }
        else if (e.layer === 'soft') { tally.soft++; if (e.part !== 'torso') tally.softNotTorso++; }
        delete s.people[on];
      }
      const legs = strikeOf(s, { id: 'leg', part: 'legs', zone: 'C', roll: { margin: 3 }, flight: { rangeM: 4 }, gun: s.people[s.player.id].kit.worn.sling, atMs: at }, { on: H.twoPid, by: 'test' });
      const el = wouldHave(s, legs);
      H.live.would.log.length = 0;
      console.log(`      400 P-12 torso strikes at margin 2: an arm's ${tally.arm} (with a layer ${tally.armLayered}), stopped ${tally.stopped} (not the torso ${tally.stoppedNotTorso}), through the panel ${tally.soft} (not the torso ${tally.softNotTorso}); a strike on the legs: strikeOf ${legs.part}, rated ${el.part}/${el.layer} ${el.fatal ? 'FATAL' : el.why ?? `wound, ${el.where}`}`);
      assert(tally.arm >= 20 && tally.armLayered === 0 && tally.stoppedNotTorso === 0 && tally.softNotTorso === 0, JSON.stringify(tally));
      assert(legs.part === 'legs' && /^leg/.test(el.part) && el.layer === 'bare', JSON.stringify({ legs, el }));
    },
  },
  {
    name: 'fatalWhy judges the body as if the knock had passed (v0.0.20\'s code review: the knock that follows every round hid shock and the pain\'s floor, so \'shock\' and \'pain\' could never be returned): a body in shock under a fresh knock, its bleeding stopped, is fatal \'shock\'; the same body with its blood at 80 is not',
    fn() {
      const s = { meta: { seed: 7 }, clock: { ms: 1000 }, player: { id: null }, people: { x: { sex: 'm', service: { branch: 'marines' }, body: { v: BODY_V, tmpl: 'm-adult', fitness: 14 } } }, actors: { list: [] }, places: {} };
      applyHit(s, null, { onId: 'x', part: 'arms', w: 1.2, margin: 6, shotId: 'k', atMs: 1000 });
      const rec = s.people.x.body;
      for (const i of rec.injuries ?? []) i.bleed = 1000;
      const knocked = downOf(rec, 1000).why;
      rec.blood = 65; rec.bloodMs = 1000;
      const shock = fatalWhy(rec, 1000);
      rec.blood = 80;
      const fine = fatalWhy(rec, 1000);
      console.log(`      the knock until +${rec.knock.untilMs - 1000} ms (downOf: ${knocked}); the blood at 65: fatalWhy ${shock}; at 80: ${fine}`);
      assert(knocked === 'knock' && shock === 'shock' && fine === null, JSON.stringify({ knocked, shock, fine }));
    },
  },
];
