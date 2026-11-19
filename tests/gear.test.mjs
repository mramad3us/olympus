// OLYMPUS tests: the gear record (src/sim/arms/gear.js; VIEWS §4.2, §7.7; the build sheet 0.0.18 §2.2, §5.2). The user's asks of
// 2026-11-15: "the I and C menu preview of the character should show the currently worn gear", and the target view's people
// "rendered ... as we see them, meaning with their gear". gearOf is the one reader between the kit and every figure; these hold
// that it reads every worn slot, follows the kit as it changes, keys the caches on what is drawn alone, and holds nothing the
// doll cannot show ("we only know what we know").
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { gearOf, gearKey, standGear, gearToFigure, gearOfLoadout, GEAR_KEYS, RIFLE_PLACES } from '../src/sim/arms/gear.js';
import { doAction } from '../src/sim/arms/firearms.js';
import { move } from '../src/sim/arms/kit.js';
import { gunLook, kitLook } from '../src/sim/arms/look.js';
import { TWO_P12_DEFAULT, PRESET_ORDER, codeOf, LOADOUT_PRESETS } from '../src/sim/arms/loadout.js';

const house = (tier = 'sgt', loadout = undefined) => createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go', ...(loadout ? { loadout } : {}) });
const pass = (a) => ({ [a]: 'pass' });
// (the forbidden: what the hands and the belief know, never the eye: a count, a load, the chamber, the selector, a stoppage)
const FORBIDDEN = /"(count|n|load|chamber|mode|selector|stoppage|locked|belief|rounds|kind|cocked)":/;

export default [
  {
    name: 'gearOf gives what a marine in the shoot house wears and carries: the combat EVA suit, the plate carrier with chest pouches 1 and 2 and the dump pouch, the R-7 at the ready with its magazine in, the P-12 in its thigh holster and its spare in the pouch below (seed 48213, setup go); his #2 the same with his P-12 (~two:p12), without it on ~two:none, the bare lane as TWO_P12_DEFAULT says',
    fn() {
      const g = house(), s = g.state, me = gearOf(s, s.player.id), two = gearOf(s, s.armoury.range.house.two.pid);
      console.log(`      you: ${gearKey(me)}`);
      console.log(`      your #2: ${gearKey(two)}`);
      assert(me.outfit === 'combatSuit' && me.suit?.model === 'ces-1' && me.suit.colour === 'black', JSON.stringify(me.suit));
      assert(me.carrier?.model === 'pc-m3' && me.carrier.pouches.map(p => `${p.key}:${p.mags}/${p.holds}`).join() === 'p1:1/2,p2:1/2,dump:0/4', JSON.stringify(me.carrier));
      assert(me.rifle?.model === 'r7' && me.rifle.place === 'ready' && me.rifle.mag === true, JSON.stringify(me.rifle));
      assert(me.pistol?.model === 'p12' && me.pistol.place === 'holster' && me.pistol.mag === true, JSON.stringify(me.pistol));
      assert(me.thigh?.holds === 2 && me.thigh.mags === 1 && me.ears === null && me.held === null && me.painted === false, JSON.stringify(me));
      // (the #2's P-12 by the loadout's switch (v0.0.20, its build sheet §0 item 15: the user, 2026-11-15, "everyone should have the
      // same loadout"; v0.0.17's call "the #2's is not"): with it he wears and carries what you do; '~two:none' takes it off, and
      // TWO_P12_DEFAULT says which the bare lane is)
      const on = house('sgt', 'standard~two:p12').state, twoOn = gearOf(on, on.armoury.range.house.two.pid);
      const off = house('sgt', 'standard~two:none').state, twoOff = gearOf(off, off.armoury.range.house.two.pid);
      console.log(`      your #2 with ~two:none: ${gearKey(twoOff)}; the bare lane his ${TWO_P12_DEFAULT ? 'with' : 'without'} it (TWO_P12_DEFAULT ${TWO_P12_DEFAULT})`);
      assert(gearKey(twoOn) === gearKey(me) && gearKey(two) === gearKey(TWO_P12_DEFAULT ? twoOn : twoOff), JSON.stringify({ two, twoOn }));
      assert(twoOff.pistol === null && twoOff.thigh === null && JSON.stringify({ ...twoOff, pistol: null, thigh: null }) === JSON.stringify({ ...me, pistol: null, thigh: null }), JSON.stringify(twoOff));
      // (every sheet wears the same: one loadout for every sheet, the user, 2026-11-15)
      for (const tier of ['recruit', 'private', 'cpl', 'raider', 'tierone']) { const t = house(tier).state; assert(gearKey(gearOf(t, t.player.id)) === gearKey(me), `${tier}: ${gearKey(gearOf(t, t.player.id))}`); }
    },
  },
  {
    name: 'gearOf holds nothing the doll cannot show (we only know what we know): its keys are GEAR_KEYS and a pouch\'s only number is the magazines in it; no count, load, chamber, selector or stoppage',
    fn() {
      const g = house(), s = g.state, pid = s.player.id, kit = s.people[pid].kit, rifle = kit.worn.sling;
      // (a stoppage set, the selector moved, a belief told: none of it reaches the record)
      s.items[rifle].mode = 'semi';
      doAction(s, g.bus, { pid, gunId: rifle, action: 'magOut:drop', force: pass('magOut:drop') });
      const gear = gearOf(s, pid), json = JSON.stringify(gear);
      console.log(`      ${json}`);
      assert(JSON.stringify(Object.keys(gear)) === JSON.stringify(GEAR_KEYS), Object.keys(gear).join());
      assert(!FORBIDDEN.test(json), json.match(FORBIDDEN)?.[0]);
      assert(gear.carrier.pouches.every(p => JSON.stringify(Object.keys(p)) === '["key","holds","mags"]'), JSON.stringify(gear.carrier));
      assert(JSON.stringify(Object.keys(gear.rifle)) === '["model","finish","place","mag"]' && JSON.stringify(Object.keys(gear.pistol)) === '["model","place","mag"]', json);
    },
  },
  {
    name: 'the gear follows the kit as it changes: Magazine out empties the well, Transition: pistol puts the P-12 in the hand and the R-7 on its sling in front, Rifle up and the holster put them back, a magazine reached from chest pouch 1 leaves it with one',
    fn() {
      const g = house(), s = g.state, pid = s.player.id, kit = s.people[pid].kit, rifle = kit.worn.sling, pistol = kit.worn.holster, rows = [];
      const note = (what) => { const k = gearKey(gearOf(s, pid)); rows.push(`${what}: ${k}`); return gearOf(s, pid); };
      const act = (gunId, action) => { const r = doAction(s, g.bus, { pid, gunId, action, force: pass(action) }); assert(r?.ok !== false, `${action}: ${r?.why ?? r?.text}`); };
      const g0 = note('at GO');
      act(rifle, 'magOut:drop'); const g1 = note('magazine out');
      assert(g0.rifle.mag && !g1.rifle.mag, 'the well empty');
      act(rifle, 'reach@p1'); const g2 = note('reached from pouch 1');
      assert(g2.held === 'mag' && g2.carrier.pouches[0].mags === g0.carrier.pouches[0].mags - 1, JSON.stringify(g2.carrier));
      act(rifle, 'seat'); const g3 = note('seated');
      assert(g3.rifle.mag && g3.held === null, 'seated');
      // (Transition: pistol, as sidearm.js runs it: the rifle let hang, the P-12 drawn into the hand at the low ready)
      act(rifle, 'hang'); move(s, pistol, { pid, hand: 0 }); kit.carry.posture = 'lowReady';
      const g4 = note('Transition: pistol');
      assert(g4.rifle.place === 'front' && g4.pistol.place === 'ready', JSON.stringify([g4.rifle, g4.pistol]));
      // (the holster, then Rifle up)
      move(s, pistol, { pid, slot: 'holster' }); kit.carry.posture = 'slungFront';
      const g5 = note('holstered');
      assert(g5.pistol.place === 'holster' && g5.rifle.place === 'front', JSON.stringify([g5.rifle, g5.pistol]));
      act(rifle, 'up'); const g6 = note('Rifle up');
      assert(g6.rifle.place === RIFLE_PLACES[kit.carry.posture] && g6.rifle.place === 'ready', JSON.stringify(g6.rifle));
      for (const r of rows) console.log(`      ${r}`);
    },
  },
  {
    name: 'gearKey changes with every difference the doll draws and with nothing else: a round fired, a believed count or the selector leave it',
    fn() {
      const g = house(), s = g.state, pid = s.player.id, kit = s.people[pid].kit, rifle = kit.worn.sling, base = gearOf(s, pid), k0 = gearKey(base);
      // (what the doll does not draw: the selector, the belief, a round gone from the magazine)
      s.items[rifle].mode = 'semi';
      const mag = s.items[s.items[rifle].mag];
      if (mag) { mag.n = Math.max(0, (mag.n ?? 1) - 1); mag.belief = { n: 3 }; }
      s.items[rifle].belief = { ...(s.items[rifle].belief ?? {}), count: 2, chamber: 'live' };
      assert(gearKey(gearOf(s, pid)) === k0, `${gearKey(gearOf(s, pid))} vs ${k0}`);
      // (each thing it draws moves it)
      const variants = {
        outfit: { ...base, outfit: 'utilities' }, suit: { ...base, suit: null }, carrier: { ...base, carrier: { ...base.carrier, pouches: base.carrier.pouches.map((p, i) => (i ? p : { ...p, mags: 2 })) } },
        ears: { ...base, ears: 'cups' }, rifle: { ...base, rifle: { ...base.rifle, place: 'front' } }, mag: { ...base, rifle: { ...base.rifle, mag: false } },
        finish: { ...base, rifle: { ...base.rifle, finish: 'fde' } }, pistol: { ...base, pistol: { ...base.pistol, place: 'ready' } }, thigh: { ...base, thigh: { ...base.thigh, mags: 0 } },
        held: { ...base, held: 'mag' }, painted: { ...base, painted: true },
      };
      const keys = new Set([k0]);
      for (const [what, v] of Object.entries(variants)) { const k = gearKey(v); assert(!keys.has(k), `${what} left the key as it was: ${k}`); keys.add(k); }
      console.log(`      ${keys.size} distinct keys over ${Object.keys(variants).length} differences and the base; the base ${k0}`);
    },
  },
  {
    name: 'standGear draws each face the house and the bay hang: threat with a rifle or a pistol, no-shoot with hands or a phone, the armoured silhouette, the hostage card; an unseen hand holds nothing',
    fn() {
      const cases = [['threat', 'rifle'], ['threat', 'pistol'], ['noshoot', 'hands'], ['noshoot', 'phone'], ['armoured', 'rifle'], ['hostage', 'pistol'], ['threat', 'unseen'], ['unknown', 'rifle']];
      const out = cases.map(([f, h]) => [f, h, standGear(f, h)]);
      for (const [f, h, gr] of out) console.log(`      ${f} ${h}: ${gearKey(gr)}`);
      const by = (f, h) => out.find(o => o[0] === f && o[1] === h)[2];
      // (v0.0.23, re-pinned for the user's note of 2026-11-17, "the portrait of the NPC holding a gun does not display the gun they
      // are holding": the painted man holds his gun at the ready, where the stage paints it (W1); v0.0.22 hung it from the hand)
      assert(by('threat', 'rifle').rifle?.place === 'ready' && by('threat', 'pistol').pistol?.place === 'ready' && by('noshoot', 'phone').held === 'phone', 'what the hands hold');
      assert(!by('noshoot', 'hands').rifle && !by('noshoot', 'hands').pistol && !by('noshoot', 'hands').held, 'empty hands');
      assert(by('armoured', 'rifle').carrier && by('armoured', 'rifle').rifle?.place === 'ready' && by('armoured', 'rifle').outfit === 'carrier', 'the armoured silhouette');
      for (const [f, h] of [['threat', 'unseen'], ['unknown', 'rifle']]) { const gr = by(f, h); assert(!gr.rifle && !gr.pistol && !gr.held, `${f} ${h} holds nothing`); }
      assert(out.every(o => o[2].painted === true && JSON.stringify(Object.keys(o[2])) === JSON.stringify(GEAR_KEYS)), 'painted, the same keys');
    },
  },
  {
    name: 'the doll\'s gear and the world figure\'s look agree for every person on the lane: the carrier, the ear defenders, the rifle\'s carry and its magazine, the pistol out (gearToFigure against look.js gunLook and kitLook)',
    fn() {
      const g = house(), s = g.state, rows = [];
      const CARRY = { front: 'front', slung: 'back', low: 'ready', high: 'ready', aim: 'ready' };
      for (const a of s.actors.list.filter(x => s.people[x.who]?.kit)) {
        const gear = gearOf(s, a.who), fig = gearToFigure(gear), look = gunLook(s, a), kl = kitLook(s, a.who);
        rows.push(`${a.who}: figure ${JSON.stringify(fig)}; look ${look?.carry} mag ${look?.mag} pistol ${look?.pistol?.model ?? '-'}`);
        assert(fig.carrier === kl.carrier && fig.ears === kl.ears, JSON.stringify({ fig, kl }));
        if (look) assert(fig.carry === (CARRY[look.carry] === 'back' ? 'slung' : CARRY[look.carry]) && fig.magOut === !look.mag && fig.pistol === (look.pistol?.model ?? null), JSON.stringify({ fig, look: { carry: look.carry, mag: look.mag, pistol: look.pistol } }));
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(rows.length >= 2, 'you and your #2');
    },
  },
  {
    name: 'the loadout screen\'s marine (the build sheet v0.0.20 item 23; the user, 2026-11-15: "a loadout screen where the marine draws and carries them"): gearOfLoadout(code, the standard\'s gear) is the gear of a game filled with &loadout=code, for every preset and a v1 code, the devices on their faces in order; a refused code none',
    fn() {
      const base = (() => { const g = createGame({ scenario: 'test-shoothouse', seed: 48213, setup: 'go' }); return gearOf(g.state, g.state.player.id); })();
      const rows = [], bad = [];
      for (const code of [...PRESET_ORDER.map(id => codeOf(LOADOUT_PRESETS[id])), 'v1~front:mag2,mag2,dump~left:g11~back:ram']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, setup: 'go', loadout: code }), want = gearOf(g.state, g.state.player.id), got = gearOfLoadout(code, base);
        rows.push(`${code}: ${got.devices.map(d => `${d.face}${d.slot} ${d.model}`).join(', ') || 'none'} (${gearKey(got) === gearKey(want) ? 'the fill\'s' : 'NOT the fill\'s'})`);
        if (JSON.stringify(got) !== JSON.stringify(want)) bad.push(code);
      }
      console.log(`      ${rows.join('; ')}; 'v1~left:nope' ${JSON.stringify(gearOfLoadout('v1~left:nope', base))}`);
      assert(!bad.length && gearOfLoadout('v1~left:nope', base) === null, JSON.stringify(bad));
    },
  },
];
