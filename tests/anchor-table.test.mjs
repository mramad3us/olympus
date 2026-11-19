// anchor-table, F101 and F104's half (v0.0.24's build sheet §6 A, §8's F98 and F101 read three higher): footing holds the recoil (ROADMAP "anywhere" step 5; WEAPONS §7.3, §7.8; BODY §16.6, §22; COMBAT §14.8;
// PLACES §2.7; CONTRACTS §21; the user, 2026-11-08: "Try keeping rifles looking like rifles even zero G stuff, let's say we
// use footing to hold recoil").
//
// Printed from the code (src/sim/body/footing.js footingOf, footingMods; src/sim/arms/shot.js anchorOf, pullMsOf, modsOf):
//   - at Mars and the Wheel nothing changes: test-handling's shooter at Melas standing, kneeling and prone, and the
//     shoot house's in the Wheel on its concrete and on its steel apron, with mag boots worn and locked too, are all
//     'planted', the recovery and the climb ×1, the pull's times v0.0.12's, and no roll of any skill takes a footing entry;
//   - on a coasting deck (ship-coast, 0 G) the anchor table's numbers by footing, a test each: floating, mag boots, a hand
//     on a hold, a lanyard, the wedge (braced) and a teammate's brace, each with WEAPONS §7.8's recovery and climb, what
//     the shooter keeps of the push and the spin, the pull's time, the anchoring modifier at Zero-g 0 (−6, −2, −2, −2, 0,
//     0) and at the marine's own Zero-g, the handling roll's (−2 floating or one-handed) and the shot's one hand (−4);
//   - low g (Europa's surface, 0.134 G): 'light', the recovery ×1.2, the climb ×1.3 on automatic only, braced is planted,
//     and Close combat, Fieldcraft and Fitness take −2 while the shot takes none;
//   - the mag boots as worn kit: 2.4 kg in the 'boots' slot, their row ("Lock your boots" 400 ms on a ferrous face under
//     0.3 G, struck "no steel underfoot" off one, none at the Wheel's 1 G, "Release your boots" 300 ms), the steps as
//     live steps with their time, the walk on them 0.5 m/s with no run, the grip μ (m g + 300 N), their clank;
//   - the hands by the ground (footing.js groundSoilOf): Melas's +15 'regolith' as before, nothing indoors, every
//     surface's soil word has its words; and a save made on locked boots carries on byte for byte.
import { assert, near, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { toJSON } from '../src/core/state.js';
import { TICK_MS } from '../src/core/clock.js';
import { footingOf, footingMods, setAnchor, groundSoilOf, bootsOf } from '../src/sim/body/footing.js';
import { anchorOf, ANCHORS, pullMsOf, modsOf, recoverMs, fireMs, ONE_HAND_MOD } from '../src/sim/arms/shot.js';
import { climbFor } from '../src/sim/arms/specials.js';
import { wear, kitMassKg, CONTAINERS, SLOTS } from '../src/sim/arms/kit.js';
import { bootsRow, liveStep, stepsOf } from '../src/sim/arms/shooting.js';
import { legsHere } from '../src/sim/places/move.js';
import { setLiveEnv, surfaceAt } from '../src/sim/places/env.js';
import { setOpening } from '../src/sim/places/model.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { paceOf, SKILL_KEYS } from '../src/sim/skills/skills.js';
import { MODELS } from '../src/sim/arms/models.js';
import { SURFACES } from '../src/data/places/env.js';
import { MAG_BOOTS, FOOTING } from '../src/data/body/needs.js';
import { handsWords } from '../src/sim/body/cues.js';
import { MATERIALS } from '../src/sim/arms/penetrate.js';
import { stepVoice } from '../src/ui/audio/steps.js';

const SEED = 48213;
/** On the Wheel's sector 4: a spot of the steel apron (deckPlate, ferrous) and one of the house's concrete. */
const APRON = Object.freeze([2, 10]), HOUSE = Object.freeze([33.88, 13.2]);
/** Room 1's doorway on its line (its door 0.9 m wide: o:w4:r1, x 28.55 to 29.45 at z 12). */
const DOORWAY = Object.freeze([29, 12]);
/** WEAPONS §7.8's table, as the design writes it: recovery ×, climb ×, the push kept, the spin kept. */
const TABLE = Object.freeze({ planted: [1, 1, 0, 0], light: [1.2, 1.3, 0, 0], magBoots: [1.2, 1.3, 0, 0.1], handhold: [1.6, 1.8, 0.2, 1 / 3], braced: [1.1, 1.1, 0, 0], floating: [2.5, 3.0, 1, 1] });

const meOf = (s) => s.actors.list.find(a => a.id === s.player.actor);
const gunOf = (s, pid) => s.people[pid].kit.worn.sling;
// (the shoot house's game under a preset, the player put at a spot)
function house(env, at = HOUSE) {
  const g = createGame({ scenario: 'test-shoothouse', seed: SEED, ...(env ? { env } : {}) }), s = g.state, me = meOf(s);
  me.x = at[0]; me.z = at[1];
  return { g, s, pid: s.player.id, me };
}
// (what one footing gives the shooter: the row, its factors, the pull, the mods)
function rowOf(s, pid) {
  const gunId = gunOf(s, pid), A = anchorOf(s, pid, { gunId }), P = pullMsOf(s, pid, gunId), M = MODELS[s.items[gunId].model];
  const pace = paceOf(rollerOf(s, pid).value('weapons')), me = meOf(s);
  const target = { key: 'probe', kind: 'thing', name: 'the probe', x: me.x + 7, z: me.z, dM: 7 };
  const shot = modsOf(s, pid, { gunId, target, part: 'torso' });
  const zg = rollerOf(s, pid).value('zerog');
  return {
    row: A.row, mode: A.footing.mode, hold: A.footing.hold, recover: A.recover, climb: A.climb, keepPush: A.keepPush, keepSpin: A.keepSpin,
    pullMs: P.ms, recMs: P.recoverMs, recBase: recoverMs({ recoil: M.recoil, pace }), pullCalc: fireMs({ recoil: M.recoil, pace, rpm: M.rpm, anchor: A.recover }), recCalc: recoverMs({ recoil: M.recoil, pace, anchor: A.recover }),
    climb1: climbFor({ mrk: rollerOf(s, pid).value('marksmanship'), follow: 1, anchor: A.climb }),
    mod0: footingMods(s, pid, 'marksmanship', 0)[0]?.v ?? 0, modOwn: footingMods(s, pid, 'marksmanship')[0] ?? null, zg,
    handling0: footingMods(s, pid, 'weapons', 0)[0]?.v ?? 0, oneHand: shot.find(m => m.v === ONE_HAND_MOD)?.v ?? 0,
    shotEnv: shot.filter(m => m.src === 'env' && /free fall|low g/.test(m.why)).map(m => m.v),
  };
}
const line = (k, r) => `      ${k.padEnd(10)} ${r.row.padEnd(8)} (${r.mode}, ${r.hold}) recovery ×${r.recover} climb ×${r.climb} keeps push ${fmt(r.keepPush, 2)} spin ${fmt(r.keepSpin, 2)}; pull ${r.pullMs} ms, recovery ${r.recMs} ms (planted ${r.recBase}); a follow-up's climb ${r.climb1}; anchoring ${r.mod0} at Zero-g 0, ${r.modOwn ? `${r.modOwn.v} (${r.modOwn.why})` : '0'} at the marine's ${r.zg}; handling ${r.handling0}; one hand ${r.oneHand}`;
// (the row against WEAPONS §7.8's table and the pull's formula)
function holds(k, r, want) {
  const [rec, cl, push, spin] = TABLE[want];
  assert(r.row === want && r.recover === rec && r.climb === cl && r.keepPush === push && Math.abs(r.keepSpin - spin) < 1e-9, `${k}: ${JSON.stringify(r)}`);
  assert(r.pullMs === r.pullCalc && r.recMs === r.recCalc && Math.abs(r.recMs - r.recBase * rec) <= 1, `${k}: the pull on the anchor's recovery ${JSON.stringify(r)}`);
}

export default [
  {
    name: 'at Mars and the Wheel nothing changes: standing, kneeling and prone at Melas, on the Wheel\'s concrete and on its steel apron, with mag boots worn and locked, every shooter is planted, ×1 on the recovery and the climb, and no roll of any skill takes a footing entry',
    fn() {
      const out = [];
      const h = createGame({ scenario: 'test-handling', seed: SEED }), hs = h.state, hp = hs.player.id;
      for (const stance of ['stand', 'kneel', 'prone']) {
        const me = meOf(hs); if (stance === 'stand') delete me.stance; else me.stance = stance;
        const F = footingOf(hs, hp), A = anchorOf(hs, hp, { gunId: gunOf(hs, hp) });
        out.push([`Melas ${stance}`, F, A, SKILL_KEYS.flatMap(k => footingMods(hs, hp, k))]);
      }
      for (const [k, at] of [['house', HOUSE], ['apron', APRON]]) {
        const { s, pid } = house(null, at);
        out.push([`Wheel ${k}`, footingOf(s, pid), anchorOf(s, pid), SKILL_KEYS.flatMap(x => footingMods(s, pid, x))]);
        wear(s, pid, 'mb-1');
        const r = setAnchor(s, pid, 'boots');
        out.push([`Wheel ${k} booted`, footingOf(s, pid), anchorOf(s, pid), SKILL_KEYS.flatMap(x => footingMods(s, pid, x)), r.ok]);
      }
      for (const [k, F, A, mods, locked] of out) console.log(`      ${k.padEnd(18)} ${F.gG} G, ${F.mode}, ${F.anchor} (${F.hold}); recovery ×${A.recover}, climb ×${A.climb}; footing entries ${mods.length}${locked === undefined ? '' : `; boots ${locked ? 'locked' : 'refused'}`}`);
      for (const [k, F, A, mods] of out) assert(F.anchor === 'planted' && F.surface === null && A.recover === 1 && A.climb === 1 && !mods.length, `${k}: ${JSON.stringify({ F, A, mods })}`);
      assert(out.find(o => o[0] === 'Wheel apron booted')[4] === true && out.find(o => o[0] === 'Wheel house booted')[4] === false, 'the boots lock on the apron\'s steel and not on concrete, and change nothing at 1 G');
      // (the pull's times are v0.0.12's: the planted formula exactly)
      const P = pullMsOf(hs, hp, gunOf(hs, hp)), pace = paceOf(rollerOf(hs, hp).value('weapons'));
      console.log(`      Melas's pull ${P.ms} ms, its recovery ${P.recoverMs} ms (the planted formula ${fireMs({ recoil: MODELS.r7.recoil, pace, rpm: MODELS.r7.rpm })}, ${recoverMs({ recoil: MODELS.r7.recoil, pace })})`);
      assert(P.ms === fireMs({ recoil: MODELS.r7.recoil, pace, rpm: MODELS.r7.rpm }) && P.recoverMs === recoverMs({ recoil: MODELS.r7.recoil, pace }), JSON.stringify(P));
    },
  },
  {
    name: 'on a coasting deck the anchor table by footing (WEAPONS §7.8): floating ×2.5 and ×3.0, mag boots ×1.2 and ×1.3, a hand on a hold and a lanyard ×1.6 and ×1.8, the wedge and a teammate\'s brace ×1.1; the anchoring −6, −2, −2, −2, 0, 0 at Zero-g 0, worn down by the marine\'s own; handling −2 floating or one-handed; one hand on a rifle −4',
    fn() {
      const R = {};
      { const { s, pid } = house('ship-coast'); R.floating = rowOf(s, pid); }
      { const { s, pid } = house('ship-coast', APRON); wear(s, pid, 'mb-1'); assert(setAnchor(s, pid, 'boots').ok, 'the boots lock on the apron'); R.boots = rowOf(s, pid); }
      // (a hold and a lanyard: no shipped deck has handholds (PLACES §2.7's grip: the Wheel's apron has mag strips), so the actor's
      // record is written as setAnchor would on a grating; setAnchor's refusal there is the next line's)
      { const { s, pid, me } = house('ship-coast', APRON); const r = setAnchor(s, pid, 'handhold'); assert(!r.ok && r.why === 'nothing to hold here', JSON.stringify(r));
        me.anchor = 'handhold'; me.anchorAt = [me.x, me.z]; R.handhold = rowOf(s, pid); me.anchor = 'tether'; R.lanyard = rowOf(s, pid); }
      // (the wedge across a passage of 0.8 to 1.2 m (v0.0.24: model.js passageAt): room 1's doorway, its door open, 0.9 m; the hall, 2.24 m, refused)
      { const { s, pid, me } = house('ship-coast'); const r0 = setAnchor(s, pid, 'braced');
        assert(!r0.ok && r0.why === 'no passage to wedge across', `the hall is too wide to wedge: ${JSON.stringify(r0)}`);
        setOpening(s, 'o:w4:r1', 'open'); me.x = DOORWAY[0]; me.z = DOORWAY[1];
        assert(setAnchor(s, pid, 'braced').ok, 'the wedge in the doorway'); R.braced = rowOf(s, pid); }
      { const { s, pid, me } = house('ship-coast', APRON), two = s.armoury.range.house.two.pid, b = s.actors.list.find(a => a.who === two);
        b.x = me.x + 0.6; b.z = me.z;
        assert(setAnchor(s, pid, 'buddy', { ref: two }).ok, 'the brace taken');
        R.unheld = rowOf(s, pid);                                        // (the #2 floating holds nobody)
        wear(s, two, 'mb-1'); assert(setAnchor(s, two, 'boots').ok, 'the #2 on his boots');
        R.buddy = rowOf(s, pid);
        b.x = me.x + 1.5; R.far = rowOf(s, pid); }
      for (const [k, r] of Object.entries(R)) console.log(line(k, r));
      holds('floating', R.floating, 'floating'); holds('boots', R.boots, 'magBoots'); holds('handhold', R.handhold, 'handhold'); holds('lanyard', R.lanyard, 'handhold');
      holds('braced', R.braced, 'braced'); holds('buddy', R.buddy, 'braced'); holds('unheld', R.unheld, 'floating'); holds('far', R.far, 'floating');
      const mods = Object.fromEntries(Object.entries(R).map(([k, r]) => [k, [r.mod0, r.handling0, r.oneHand]]));
      assert(JSON.stringify(mods) === JSON.stringify({ floating: [-6, -2, 0], boots: [-2, 0, 0], handhold: [-2, -2, -4], lanyard: [-2, 0, 0], braced: [0, 0, 0], unheld: [-6, -2, 0], buddy: [0, 0, 0], far: [-6, -2, 0] }), JSON.stringify(mods));
      // (worn down by the marine's own Zero-g, SKILLS §5.13: never more than the base, never to nothing; the shot's list carries it once)
      for (const [k, r] of Object.entries(R)) if (r.mod0) assert(r.modOwn && r.modOwn.v >= r.mod0 && r.modOwn.v < 0 && r.shotEnv.length === 1 && r.shotEnv[0] === r.modOwn.v, `${k}: ${JSON.stringify(r)}`);
      assert(R.floating.recMs > R.handhold.recMs && R.handhold.recMs > R.boots.recMs && R.boots.recMs > R.braced.recMs && R.braced.recMs > R.floating.recBase, 'the recovery orders with the anchor');
    },
  },
  {
    name: 'low g (Europa\'s surface, 0.134 G): the shooter is \'light\', ×1.2 on the recovery and ×1.3 on the climb on automatic only; braced, planted; Close combat, Fieldcraft and Fitness −2 and the shot nothing',
    fn() {
      const g = createGame({ scenario: 'test-handling', seed: SEED, env: 'europa-surface' }), s = g.state, pid = s.player.id, gunId = gunOf(s, pid);
      const semi = anchorOf(s, pid, { gunId });
      s.items[gunId].mode = 'auto'; const auto = anchorOf(s, pid, { gunId }); s.items[gunId].mode = 'semi';
      const low = Object.fromEntries(SKILL_KEYS.map(k => [k, footingMods(s, pid, k, 0)[0]?.v ?? 0]).filter(([, v]) => v));
      // (no passage on the open bay to wedge across (model.js passageAt: a ground has none): the record written as setAnchor would in one)
      const me = meOf(s), r = setAnchor(s, pid, 'braced'); assert(!r.ok && r.why === 'no passage to wedge across', JSON.stringify(r));
      me.anchor = 'braced'; me.anchorAt = [me.x, me.z]; const braced = anchorOf(s, pid, { gunId });
      console.log(`      Europa ${semi.footing.gG} G, ${semi.footing.mode} on ${semi.footing.surface}: ${semi.row}, recovery ×${semi.recover}, climb ×${semi.climb} on semi, ×${auto.climb} on auto; the push a slide ${semi.slide}; braced ${braced.row}; low g's entries ${JSON.stringify(low)}`);
      assert(semi.row === 'light' && semi.recover === 1.2 && semi.climb === 1 && auto.climb === 1.3 && semi.slide && braced.row === 'planted' && braced.recover === 1, JSON.stringify({ semi, auto, braced }));
      assert(JSON.stringify(low) === JSON.stringify({ cqc: -2, fieldcraft: -2, fitness: -2 }), JSON.stringify(low));
    },
  },
  {
    name: 'the mag boots as worn kit: 2.4 kg in the boots slot; "Lock your boots" 400 ms on steel under 0.3 G, struck off it, none at 1 G, "Release your boots" 300 ms; the steps take their time; on them a 0.5 m/s walk with no run, the grip μ (m g + 300 N) and a clank',
    fn() {
      const { g, s, pid, me } = house('ship-coast', APRON), kg0 = kitMassKg(s, pid);
      assert(!bootsRow(s, pid), 'no row without boots');
      const id = wear(s, pid, 'mb-1'), kg1 = kitMassKg(s, pid);
      const lock = bootsRow(s, pid);
      me.x = HOUSE[0]; me.z = HOUSE[1]; const struck = bootsRow(s, pid); me.x = APRON[0]; me.z = APRON[1];
      const legs0 = legsHere(s, pid, me.x, me.z), t0 = s.clock.ms;
      assert(liveStep(s, g.bus, { pid, step: 'boots:lock' }).ok, 'the lock taken as a live step');
      let n = 0; while (s.stop && n < 40) { g.step(1); n++; }
      const locked = { anchor: me.anchor, ms: s.clock.ms - t0, F: footingOf(s, pid), legs: legsHere(s, pid, me.x, me.z) }, release = bootsRow(s, pid);
      // (the house's Combat stance has the body's inertia (0.0.12): 20 ticks to come up to speed at the boots' grip, then 20 measured)
      g.step(20, { mx: 1, run: true }); const x0 = me.x; g.step(20, { mx: 1, run: true }); const walked = (me.x - x0) / (20 * TICK_MS / 1000), gait = me.gait, stance = me.moveStance ?? 'relaxed';
      const json = g.save(); g.step(30, { mx: -1 }); const a = g.digest(), after = toJSON(s); g.load(json); g.step(30, { mx: -1 });
      const reload = g.digest() === a && toJSON(g.state) === after, s2 = g.state, me2 = meOf(s2);
      const t1 = s2.clock.ms; assert(liveStep(s2, g.bus, { pid, step: 'boots:release' }).ok, 'the release taken');
      n = 0; while (s2.stop && n < 40) { g.step(1); n++; }
      const freed = { anchor: me2.anchor ?? null, ms: s2.clock.ms - t1, F: footingOf(s2, pid) };
      // (released, the keys find no grip at 0 G in the Combat stance: the body drifts on at what it had (free-fall motion is step 7's))
      const x1 = me2.x; g.step(20); const drift = (me2.x - x1) / (20 * TICK_MS / 1000);
      const wheel = house(null, APRON); wear(wheel.s, wheel.pid, 'mb-1');
      const voice = stepVoice('deckPlate', 'walk', { gG: 0, pKpa: 66, boots: true }), bare = stepVoice('deckPlate', 'walk', { gG: 0, pKpa: 66 });
      console.log(`      ${CONTAINERS['mb-1'].word} ${id} in ${JSON.stringify(Object.entries(s.people[pid].kit.worn).find(([, v]) => v === id)?.[0])} (SLOTS ${SLOTS.join(', ')}); carried ${kg0} → ${kg1} kg`);
      console.log(`      rows: ${lock.label} ${lock.ms} ms on ${surfaceAt(s, null, ...APRON).id}; on ${surfaceAt(s, null, ...HOUSE).id} "${struck.label}" struck "${struck.off}"; at the Wheel's 1 G ${bootsRow(wheel.s, wheel.pid)?.label ?? 'none'}; locked, ${release.label} ${release.ms} ms`);
      console.log(`      locked after ${locked.ms} ms (${locked.F.mode}, ${locked.F.anchor}); the grip ${fmt(legs0.gripMs2, 3)} → ${fmt(locked.legs.gripMs2, 3)} m/s², push ${fmt(locked.legs.pushMs2, 3)}; Shift held in ${stance}: ${fmt(walked, 2)} m/s (${gait}); saved and carried on 30 ticks: ${reload ? 'byte for byte' : 'DIFFERS'}`);
      console.log(`      released after ${freed.ms} ms (${freed.F.mode}); drifting on at ${fmt(drift, 2)} m/s with no keys; the step on steel ${voice.kind} ${voice.gainDb} dB, bare ${bare.kind} ${bare.gainDb} dB`);
      assert(CONTAINERS['mb-1'].slot === 'boots' && s.people[pid].kit.worn.boots === id && bootsOf(s, pid)?.model === 'mb-1' && Math.abs(kg1 - kg0 - 2.4) <= 0.005, 'worn in the boots slot');
      assert(lock.id === 'boots:lock' && lock.ms === MAG_BOOTS.LOCK_MS && !lock.off && struck.off === 'no steel underfoot' && !bootsRow(wheel.s, wheel.pid) && release.id === 'boots:release' && release.ms === MAG_BOOTS.UNLOCK_MS, 'the rows');
      // (lived: the formula's time to the tick that ends it, and the tick the stepper takes it on: never shorter, at most a tick longer)
      const lived = (ms, want) => ms >= want && ms <= Math.ceil(want / TICK_MS) * TICK_MS + TICK_MS;
      assert(locked.anchor === 'boots' && lived(locked.ms, MAG_BOOTS.LOCK_MS) && locked.F.mode === 'magWalk' && freed.anchor === null && lived(freed.ms, MAG_BOOTS.UNLOCK_MS) && freed.F.mode === 'float', JSON.stringify({ locked, freed }));
      assert(legs0.gripMs2 === 0, `no grip floating: ${legs0.gripMs2}`);
  near(locked.legs.gripMs2, SURFACES.deckPlate.muDry * MAG_BOOTS.HOLD_N / (75 + kg1), 0.001, 'the grip on the boots:');
      near(walked, MAG_BOOTS.WALK_MS, 0.02, 'the walk on boots, Shift held:'); assert(gait === 'walk', `no run on boots: ${gait}`);
      assert(reload, 'a save on locked boots carries on byte for byte');
      assert(voice.kind === 'mag' && Number.isFinite(voice.gainDb) && !Number.isFinite(bare.gainDb), 'a locked boot is heard on steel where a bare foot weighs nothing');
    },
  },
  {
    name: 'the panel offers the boots after the stances, and the hands take the ground\'s own: Melas +15 regolith as before, nothing indoors, and every surface\'s soil word has its words',
    fn() {
      const { g, s, pid } = house('ship-coast', APRON);
      wear(s, pid, 'mb-1');
      s.stop = { mode: 'stop', who: pid, gun: gunOf(s, pid), phase: 'choose', pick: null, aim: null, doing: null, queue: [], reflex: null, keep: {} };
      const ids = stepsOf(s).map(r => r.id), at = ids.indexOf('boots:lock'), stance = Math.max(...ids.map((id, i) => (id.startsWith('stance:') ? i : -1)));
      s.stop = null;
      const melas = createGame({ scenario: 'test-handling', seed: SEED }), ms = melas.state, me = meOf(ms);
      const soilM = groundSoilOf(ms, ms.places.live.area, me.x, me.z), soilW = groundSoilOf(s, s.places.live.area, ...APRON);
      const words = [...new Set(Object.values(SURFACES).map(r => r.soilWord))].map(w => [w, handsWords(2, w)]);
      // (step 5: a surface's material, penetrate.js's: a dropped magazine wears on a hard one, and one picked up off a loose one takes its dust)
      const loose = Object.keys(SURFACES).filter(id => MATERIALS[SURFACES[id].material]?.hard === false), unknown = Object.keys(SURFACES).filter(id => !MATERIALS[SURFACES[id].material]);
      const magnetic = Object.keys(SURFACES).filter(id => SURFACES[id].ferrous);
      console.log(`      the panel: ${ids.length} rows, the boots at ${at}, the last stance at ${stance}; Melas's ground soils ${JSON.stringify(soilM)}, the Wheel's deck ${JSON.stringify(soilW)}`);
      console.log(`      the hands' words (dirty): ${words.map(([w, t]) => `${w} "${t}"`).join(', ')}`);
      console.log(`      loose underfoot (no drop wear, dust on a pick-up): ${loose.join(', ')}; mag boots hold on: ${magnetic.join(', ')}`);
      assert(at === stance + 1, `the boots after the stances: ${ids.join(', ')}`);
      assert(soilM?.k === 15 && soilM.why === 'regolith' && soilW === null, JSON.stringify({ soilM, soilW }));
      assert(words.every(([w, t]) => t && t !== 'Dirty hands.'), JSON.stringify(words));
      assert(!unknown.length && loose.join() === 'regolith,soil,grass' && magnetic.join() === 'deckPlate,plateGrid,grating', JSON.stringify({ unknown, loose, magnetic }));
      void g;
    },
  },
];
