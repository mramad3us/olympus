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
import { TWO_P12_DEFAULT, twoP12Of } from '../src/sim/arms/loadout.js';

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
  // (v0.0.19 (the build sheet 0.0.19 §0 item 10, §6): the presets and the #2's P-12 token; v0.0.20: his P-12 the default)
  {
    name: 'every v0.0.18 code round-trips byte for byte (his P-12 issued with each: v0.0.20, the user\'s answer of 2026-11-16, "#2 has to have a sidearm"); a v0.0.19 code "…~two:p12" reads with it and is written back without the token; "~two:none" (the tests\' only) reads it off and round-trips; the four new presets name themselves',
    fn() {
      // (v0.0.20's integration: loadoutOf keeps only a token's `two`; twoP12Of, the one reader, resolves the default)
      const v18 = ['standard', 'flash', 'breach', 'full', 'v1~front:mag2,mag2,dump~left:g11', 'v1~front:mag2,mag2,dump~right:sc1+fd1,g11~back:ram'];
      const v19 = ['flash~two:p12', 'standard~two:p12', 'v1~front:mag2,mag2,dump~left:g9p~right:bc1+fd1~two:p12'];
      const none = ['frag~two:none', 'standard~two:none', 'v1~front:mag2,mag2,dump~left:g9p~right:bc1+fd1~two:none'];
      const rt = (c) => codeOf(loadoutOf(c));
      console.log(`      v0.0.18's: ${v18.map(c => `${c} → ${rt(c)}${twoP12Of(loadoutOf(c)) ? ' (his P-12)' : ''}`).join('; ')}`);
      console.log(`      v0.0.19's: ${v19.map(c => `${c} → ${rt(c)}`).join('; ')}; off: ${none.map(c => `${c} → ${rt(c)}${twoP12Of(loadoutOf(c)) ? '' : ' (none)'}`).join('; ')}; the default ${TWO_P12_DEFAULT}; presets ${PRESET_ORDER.join(', ')}`);
      assert(TWO_P12_DEFAULT === true && v18.every(c => rt(c) === c && !loadoutOf(c).two && twoP12Of(loadoutOf(c))), JSON.stringify(v18.map(rt)));
      assert(v19.every(c => rt(c) === c.slice(0, -'~two:p12'.length) && twoP12Of(loadoutOf(c))), JSON.stringify(v19.map(rt)));
      assert(none.every(c => rt(c) === c && loadoutOf(c).two?.p12 === false && !twoP12Of(loadoutOf(c)) && isStandard(c) === false), JSON.stringify(none.map(rt)));
      assert(['frag', 'conc', 'cut', 'mixed'].every(p => PRESET_ORDER.includes(p) && !checkLoadout(LOADOUT_PRESETS[p])), 'presets');
    },
  },
  {
    name: 'the review of v0.0.19: TWO_P12_DEFAULT is the one switch: with the default on, a plain code gives the #2 his P-12, "~two:none" takes it off, and both round-trip (loadoutOf reads the token, twoP12Of resolves the default, codeOf writes only a difference); with it off, "~two:none" is the plain code',
    fn() {
      // (v0.0.20's integration: v0.0.19's fixer resolved the default in loadoutOf, v0.0.20's stage 0 in twoP12Of, the one reader
      // the fill and the screen call; the merge keeps stage 0's, so a spec's `two` is the token's and the default is twoP12Of's)
      const on = { twoDefault: true }, off = { twoDefault: false };
      const plain = loadoutOf('standard'), none = loadoutOf('standard~two:none'), unset = loadoutOf(null);
      const codeOn = codeOf({ ...LOADOUT_PRESETS.standard, two: { p12: true } }, on), codeNone = codeOf({ ...LOADOUT_PRESETS.standard, two: { p12: false } }, on);
      const back = loadoutOf(codeNone), offNone = loadoutOf('flash~two:none'), offCode = codeOf(offNone, off);
      const p = (x, o) => twoP12Of(x, o);
      console.log(`      default on: 'standard' ${p(plain, on)}, null ${p(unset, on)}, '~two:none' ${p(none, on)}; the codes ${codeOn}, ${codeNone} (read back ${p(back, on)}); default off: 'flash~two:none' ${p(offNone, off)} written ${offCode}`);
      assert(p(plain, on) && p(unset, on) && !p(none, on) && codeOn === 'standard' && codeNone === 'standard~two:none' && !p(back, on) && !back.error && !unset.error, JSON.stringify({ plain, none, codeOn, codeNone }));
      assert(!p(offNone, off) && !offNone.error && offCode === 'flash' && codeOf(plain, off) === 'standard' && codeOf(plain, on) === 'standard', JSON.stringify({ offNone, offCode }));
    },
  },
];
