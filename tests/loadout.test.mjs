// OLYMPUS tests: the loadout, a spec, a code and a fill, one for every sheet (WEAPONS §12.7; the build sheet 0.0.18 §5.3; src/sim/arms/loadout.js).
//
// The user, 2026-11-15: "a loadout screen where the marine draws and carries them", and "everyone should have the same loadout,
// there is no reason to not give sidearms to low ranks". The standard loadout is the house's issue to the byte, so no lane,
// gauge or golden of "Stack and clear" moves with it. Each test fails without loadout.js and its kit.js entries.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { LOADOUT_PRESETS, PRESET_ORDER, loadoutOf, codeOf, checkLoadout, loadoutView, extraKg, isStandard } from '../src/sim/arms/loadout.js';
import { kitMassKg } from '../src/sim/arms/kit.js';
import { devicesOf, deviceMs } from '../src/sim/arms/devices.js';
import { rollerOf } from '../src/sim/combat/roll.js';
import { TWO_P12_DEFAULT } from '../src/sim/arms/loadout.js';

const SHEETS = ['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'];
const house = (tier, loadout = null) => createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go', ...(loadout ? { loadout } : {}) });

export default [
  {
    name: 'the standard loadout is the house issue to the byte: on seed 48213 every sheet\'s fill has the same digest with and without &loadout=standard, the carrier, the R-7, its magazines and the P-12 the kit\'s mass',
    fn() {
      const rows = [], bad = [];
      for (const tier of SHEETS) {
        const a = house(tier), b = house(tier, 'standard'), c = house(tier, 'v1~front:mag2,mag2,dump');
        const kg = kitMassKg(a.state, a.state.player.id);
        rows.push(`${tier} ${a.digest()} ${kg} kg`);
        if (a.digest() !== b.digest() || a.digest() !== c.digest() || a.state.armoury.range.house.loadout !== undefined) bad.push(tier);
      }
      console.log(`      ${rows.join(' | ')}`);
      assert(!bad.length, bad.join());
    },
  },
  {
    name: 'one loadout for every sheet (the user, 2026-11-15: "everyone should have the same loadout"): a code gives the boot recruit and the tier one the same items, ids and mass, and the #2 the same again',
    fn() {
      const out = {};
      for (const code of ['flash', 'breach', 'full', 'v1~front:mag2,mag2,dump~left:g11~right:sc1+fd1,g11~back:ram']) {
        const sig = SHEETS.map(tier => {
          const g = house(tier, code), s = g.state, pid = s.player.id, two = s.armoury.range.house.twoPid;
          return JSON.stringify({ me: devicesOf(s, pid).map(d => `${d.id}:${d.model}`), kg: kitMassKg(s, pid), two: devicesOf(s, two).map(d => d.model) });
        });
        out[code] = { same: new Set(sig).size === 1, sig: JSON.parse(sig[0]) };
        console.log(`      ${code}: ${out[code].same ? 'one' : 'NOT one'} kit on six sheets: ${out[code].sig.me.join(', ')}, ${out[code].sig.kg} kg (+${extraKg(loadoutOf(code))} over the standard); the #2 ${out[code].sig.two.join(', ')}`);
      }
      assert(Object.values(out).every(x => x.same && x.sig.two.length === x.sig.me.length), JSON.stringify(out));
    },
  },
  {
    name: 'a loadout that overfills a face or puts a halligan in a pouch is refused with its reason, and the screen\'s mass and reach are the sim\'s (kitMassKg, devices.js deviceMs): a G-11 on the left 0.38 kg and 1.38 s at Weapon handling 10',
    fn() {
      const cases = [[{ left: ['g11', 'g11', 'g11'] }, 'the left side holds 2'], [{ left: ['hal'] }, 'a halligan goes on your back'], [{ right: ['mag2'] }, 'magazines ride the front this round'],
        [{ front: ['mag2', 'dump'] }, 'magazines ride the front this round'], [{ back: ['hal', 'ram'] }, 'the back holds 1'], [{ back: ['g11'] }, 'a G-11 stun grenade rides a side'], [{ left: ['g11'], right: ['sc1+fd1'] }, null]];
      const got = cases.map(([spec, want]) => ({ spec: JSON.stringify(spec), want, got: checkLoadout(spec) }));
      for (const c of got) console.log(`      ${c.spec}: ${c.got ?? 'accepted'}`);
      assert(got.every(c => c.got === c.want), JSON.stringify(got.filter(c => c.got !== c.want)));
      const g = house('private', 'flash'), s = g.state, pid = s.player.id, V = loadoutView(s, pid, loadoutOf('flash'));
      const g11 = V.faces.left[0].items[0], sim = deviceMs(rollerOf(s, pid), 'gren:reach', { face: 'left' }) / 1000;
      console.log(`      the screen: ${V.massKg} kg, push ${V.push.pushMs2} brake ${V.push.brakeMs2} m/s², WH ${V.wh}; the left face: ${V.faces.left.map(p => `${p.word} (${p.items.map(i => `${i.word} ${i.massKg} kg, reach ${i.reachS} s`).join(', ')})`).join('; ')}`);
      assert(V.massKg === kitMassKg(s, pid) && g11.massKg === 0.38 && g11.reachS === 1.38 && Math.abs(g11.reachS - sim) < 0.006, JSON.stringify({ g11, sim }));
    },
  },
  {
    name: 'a code round-trips through codeOf and loadoutOf (a "+" arriving as a space from the URL), and an unknown or refused one is dropped: an error for the page\'s toast, the lane filled standard',
    fn() {
      const codes = [...PRESET_ORDER, 'v1~front:mag2,mag2,dump~left:g11', 'v1~front:mag2,mag2,dump~right:sc1+fd1,g11~back:ram'];
      const trips = codes.map(c => ({ c, back: codeOf(loadoutOf(c)) }));
      const space = codeOf(loadoutOf('v1~front:mag2,mag2,dump~right:sc1 fd1'));
      const bad = ['vacuum', 'v1~left:g11,g11,g11', 'v2~left:g11', 'v1~top:g11'].map(c => ({ c, err: loadoutOf(c).error ?? null }));
      console.log(`      ${trips.map(t => `${t.c} → ${t.back}`).join(' | ')}; a space for '+': ${space}`);
      console.log(`      dropped: ${bad.map(b => `${b.c}: ${b.err}`).join(' | ')}`);
      assert(trips.every(t => t.back === t.c) && space === 'v1~front:mag2,mag2,dump~right:sc1+fd1', JSON.stringify(trips));
      assert(bad.every(b => b.err), JSON.stringify(bad));
      const g = house('private', 'vacuum'), std = house('private');
      assert(g.digest() === std.digest() && isStandard(null) && !isStandard('flash') && codeOf(LOADOUT_PRESETS.full) === 'full', 'an unknown loadout fills the standard');
    },
  },
  // (v0.0.19 (the build sheet 0.0.19 §0 item 10, §6): the presets and the #2's P-12 token)
  {
    name: 'every v0.0.18 code round-trips byte for byte, and "~two:p12" round-trips after a preset and after a v1 code (absent when off: TWO_P12_DEFAULT false); the four new presets name themselves',
    fn() {
      const v18 = ['standard', 'flash', 'breach', 'full', 'v1~front:mag2,mag2,dump~left:g11', 'v1~front:mag2,mag2,dump~right:sc1+fd1,g11~back:ram'];
      const d2 = ['frag', 'conc', 'cut', 'mixed', 'flash~two:p12', 'standard~two:p12', 'v1~front:mag2,mag2,dump~left:g9p~right:bc1+fd1~two:p12'];
      const rt = (c) => codeOf(loadoutOf(c));
      console.log(`      v0.0.18's: ${v18.map(c => `${c} → ${rt(c)}`).join('; ')}`);
      console.log(`      v0.0.19's: ${d2.map(c => `${c} → ${rt(c)}${loadoutOf(c).two?.p12 ? ' (his P-12)' : ''}`).join('; ')}; the default ${TWO_P12_DEFAULT}; presets ${PRESET_ORDER.join(', ')}`);
      assert(v18.every(c => rt(c) === c && !loadoutOf(c).two), JSON.stringify(v18.map(rt)));
      assert(d2.every(c => rt(c) === c) && loadoutOf('flash~two:p12').two?.p12 === true && !TWO_P12_DEFAULT, JSON.stringify(d2.map(rt)));
      assert(['frag', 'conc', 'cut', 'mixed'].every(p => PRESET_ORDER.includes(p) && !checkLoadout(LOADOUT_PRESETS[p])), 'presets');
    },
  },
  {
    name: 'the review of v0.0.19: TWO_P12_DEFAULT is the one switch: with the default on, a plain code gives the #2 his P-12, "~two:none" takes it off, and both round-trip (loadoutOf resolves the default, codeOf writes only a difference); with it off, "~two:none" is the plain code',
    fn() {
      const on = { twoDefault: true }, off = { twoDefault: false };
      const plain = loadoutOf('standard', on), none = loadoutOf('standard~two:none', on), unset = loadoutOf(null, on);
      const codeOn = codeOf({ ...LOADOUT_PRESETS.standard, two: { p12: true } }, on), codeNone = codeOf({ ...LOADOUT_PRESETS.standard, two: { p12: false } }, on);
      const back = loadoutOf(codeNone, on), offNone = loadoutOf('flash~two:none', off), offCode = codeOf(offNone, off);
      console.log(`      default on: 'standard' ${JSON.stringify(plain.two ?? null)}, null ${JSON.stringify(unset.two ?? null)}, '~two:none' ${JSON.stringify(none.two ?? null)}; the codes ${codeOn}, ${codeNone} (read back ${JSON.stringify(back.two ?? null)}); default off: 'flash~two:none' ${JSON.stringify(offNone.two ?? null)} written ${offCode}`);
      assert(plain.two?.p12 === true && unset.two?.p12 === true && !none.two && codeOn === 'standard' && codeNone === 'standard~two:none' && !back.two && !back.error, JSON.stringify({ plain, none, codeOn, codeNone }));
      assert(!offNone.two && !offNone.error && offCode === 'flash', JSON.stringify({ offNone, offCode }));
    },
  },
];
