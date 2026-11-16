// OLYMPUS tests: the P-12's rows, sequenced like the rifle's (the user, 2026-11-15; arms/sidearm.js, plan.js, gunwords.js; the build sheet 0.0.18 §5.1 test 17, Track B's seven).
//
// What each test pins, each failing on v0.0.17:
//   - with the P-12 drawn the panel never offers Sling it (canDo's stow on every gun), and GUN 3 is Rifle up;
//   - the P-12's rows say the pistol's words (Rack the slide, Slide release, Lock the slide back, "Reach: the pistol pouch", where
//     v0.0.17 read "reach@pp (10 frangible)"), and its UNLOAD has no Port cover (the P-12 has none);
//   - the P-12 drawn has the rifle's sequencing from its own state: RELOAD on a slide locked on an empty, Top up, IMMEDIATE
//     ACTION after a click, a press check on a chamber unknown, Off safe on safe, timed at the six sheets;
//   - its magazine out goes to the thigh's pouch (v0.0.17: a rifle's chest pouch);
//   - Rifle up's tail is the rifle's own way to ready: tap, rack for a stoppage felt, to the ms of v0.0.17's at every sheet (so
//     F20 stands); REMEDIAL on a double seen; RELOAD on a locked empty; Magazine in with the magazine out and a round up;
//     nothing more when it is ready;
//   - the P-12 drawn and dry with no HAD-17 left and the rifle hanging loaded: Fix is Rifle up (it read "no rounds"), and "no
//     rounds" only when neither gun has one (the review of v0.0.18);
//   - Gun down and Off the line act on the gun in use: the P-12 drawn and stopped, Gun down taps and racks the P-12;
//   - the holstered P-12's own rows: drawn, done and holstered on safe, in GUN ▸ only, never a lead nor on the band, none with a
//     threat facing; the sergeant's press check 225 + 823 + 898 + 973 + 748 = 3,667 ms.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { canDo, beliefOf, doAction, actionMs } from '../src/sim/arms/firearms.js';
import { macrosFor, subsOf } from '../src/sim/arms/drills.js';
import { stepsOf, chooseStep } from '../src/sim/arms/shooting.js';
import { modelOf } from '../src/sim/arms/groups.js';
import { weaponList, listMs, weaponRows, threatFacing } from '../src/sim/arms/sidearm.js';
import { holderOf, pouchesOf, pistolOf, discard } from '../src/sim/arms/kit.js';
import { rollerOf } from '../src/sim/combat/roll.js';

const TIERS = Object.freeze(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']);
function run(g, s, step) {
  const r = chooseStep(s, g.bus, { step });
  for (let i = 0; i < 400 && s.stop?.mode === 'stop' && s.stop.phase !== 'choose'; i++) g.step(1);
  return r;
}
function house({ tier = 'sgt', draw = true } = {}) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go' }), s = g.state, pid = s.player.id;
  if (draw) run(g, s, 'weapon:transition');
  return { g, s, pid, p: pistolOf(s, pid), rifle: s.people[pid].kit.worn.sling };
}
const set = (s, id, o, truth = {}) => { const gun = s.items[id]; gun.belief = { ...gun.belief, ...o }; Object.assign(gun, truth); for (const [k, v] of Object.entries(truth)) if (v === undefined) delete gun[k]; };
const fixOf = (s) => modelOf(stepsOf(s)).core.fix.row;
const secs = (ms) => (ms / 1000).toFixed(2);

export default [
  {
    name: 'with the P-12 drawn the panel never offers Sling it (canDo\'s stow on the drawn pistol, v0.0.17), and GUN 3 is Rifle up',
    fn() {
      const { s, pid, p } = house();
      const rows = stepsOf(s), m = modelOf(rows);
      assert(!canDo(s, pid, p).includes('stow') && !rows.some(r => r.id === 'stow'), JSON.stringify(canDo(s, pid, p)));
      assert(m.groups.GUN.slots[3]?.row?.id === 'weapon:rifle-up' && m.groups.BODY.slots[8]?.row?.id !== 'stow', JSON.stringify({ gun3: m.groups.GUN.slots[3]?.row?.id, body8: m.groups.BODY.slots[8]?.row?.id }));
      console.log(`      GUN 3 "${m.groups.GUN.slots[3].row.label}", BODY 8 ${m.groups.BODY.slots[8]?.row?.label ?? 'empty'}`);
    },
  },
  {
    name: 'the P-12\'s rows say the pistol\'s words: Rack the slide, Slide release, Lock the slide back, Reach: the pistol pouch (it read "reach@pp (10 frangible)"), and its UNLOAD has no Port cover',
    fn() {
      const { s, pid, p } = house();
      set(s, p, { chamber: 'empty', locked: true, count: 3 }, { chamber: undefined, locked: true });
      const rows = stepsOf(s), label = (id) => rows.find(r => r.id === id)?.label ?? null;
      const words = { release: label('release'), lockBack: label('lockBack'), reach: label('reach@pp') };
      assert(words.release === 'Slide release' && /^Reach: the pistol pouch/.test(words.reach ?? ''), JSON.stringify(words));
      set(s, p, { chamber: 'empty', locked: false, count: 3 }, { locked: undefined });
      const rows2 = stepsOf(s);
      const charge = rows2.find(r => r.id === 'charge')?.label, lock = rows2.find(r => r.id === 'lockBack')?.label;
      assert(charge === 'Rack the slide' && lock === 'Lock the slide back', JSON.stringify({ charge, lock }));
      const unload = macrosFor(s, pid, p).find(m => m.id === 'unload');
      assert(unload && !unload.subs.includes('port') && subsOf('unload', { model: 'r7', mag: 'in', chamber: 'live' }).includes('port'), JSON.stringify(unload?.subs));
      console.log(`      ${charge}, ${words.release}, ${lock}, "${words.reach}"; UNLOAD ${unload.subs.join(', ')} (the R-7's ends "port")`);
    },
  },
  {
    name: 'the P-12 drawn has the rifle\'s sequencing from its own state: RELOAD on a dry locked slide, Top up at three left with the spare full, IMMEDIATE ACTION after a click, Press check with the chamber unknown, Off safe on safe; each timed at the six sheets',
    fn() {
      const cases = [
        ['RELOAD', { chamber: 'empty', locked: true, count: 0 }, (g) => { g.s.items[g.s.items[g.p].mag].n = 0; return { chamber: undefined, locked: true }; }, 'macro:reload:speed'],
        ['Top up', { count: 3 }, (g) => { g.s.items[g.s.items[g.p].mag].n = 3; return {}; }, null],
        ['IMMEDIATE ACTION', { stoppage: 'click' }, () => ({ chamber: 'dud' }), 'macro:ia'],
        ['Press check', { chamber: '?' }, () => ({}), 'pressCheck'],
        ['Off safe', {}, () => ({ mode: 'safe' }), 'selector:semi'],
      ];
      const lines = [];
      for (const [what, b, truth, want] of cases) {
        const times = [];
        for (const tier of TIERS) {
          const h = house({ tier }), t = truth(h);
          set(h.s, h.p, b, t);
          const row = want ? fixOf(h.s) : stepsOf(h.s).find(r => r.id === 'macro:reload:tactical');
          assert(row && (!want || row.id === want) && !row.off, JSON.stringify({ what, tier, row: row && { id: row.id, label: row.label, off: row.off } }));
          if (what === 'RELOAD') assert(row.subs.map(x => x.id).join(',') === 'magOut:drop,reach,seat,release' && row.subs.at(-1).label === 'Slide release', JSON.stringify(row.subs));
          times.push(`${tier} ${secs(row.ms)}`);
        }
        lines.push(`${what}: ${times.join(', ')} s`);
      }
      for (const l of lines) console.log(`      ${l}`);
    },
  },
  {
    name: 'a HAD-17 coming out goes to the thigh\'s pouch when it has room (pouchFor by family), never a rifle\'s chest pouch',
    fn() {
      const { g, s, pid, p } = house(), was = s.items[p].mag, thigh = pouchesOf(s, pid).find(q => q.key === 'pp');
      doAction(s, g.bus, { pid, gunId: p, action: 'magOut:pouch', force: { 'magOut:pouch': 'pass' } });
      const to = holderOf(s, was)?.container, model = s.items[to]?.model;
      assert(to === thigh.id && model === 'pouch-p12', JSON.stringify({ to, model }));
      console.log(`      the P-12's magazine out: into ${model} (v0.0.17: pouch-mag2)`);
    },
  },
  {
    name: 'Rifle up\'s tail is the rifle\'s own way to ready: tap, rack for a stoppage felt, its time to the ms of v0.0.17\'s at every sheet; REMEDIAL on a double seen; RELOAD on a locked empty; Magazine in with the magazine out and a round up; nothing when ready',
    fn() {
      const lines = [];
      for (const tier of TIERS) {
        const h = house({ tier }), { s, pid, rifle } = h;
        set(s, rifle, { stoppage: 'click' }, { chamber: 'dud' });
        const list = weaponList(s, pid, 'rifle-up'), b = beliefOf(s, rifle), v17 = ['holster', 'up', ...subsOf('ia', b)];
        const ms = listMs(s, pid, list), ms17 = listMs(s, pid, v17), row = weaponRows(s, pid).find(r => r.id === 'weapon:rifle-up');
        assert(list.join(',') === v17.join(',') && ms === ms17 && row?.label === 'Rifle up: holster, tap, rack', JSON.stringify({ tier, list, v17, ms, ms17, label: row?.label }));
        lines.push(`${tier} ${ms} ms`);
      }
      const h = house(), { s, pid, rifle } = h, gun = s.items[rifle];
      const tail = () => weaponList(s, pid, 'rifle-up').slice(2).join(',');
      set(s, rifle, { stoppage: 'double', chamber: 'case' }, { jam: 'double', chamber: 'case' });
      const rem = tail();
      assert(rem === subsOf('remedial', beliefOf(s, rifle)).join(','), rem);
      set(s, rifle, { stoppage: undefined, chamber: 'empty', locked: true, count: 0 }, { jam: undefined, chamber: undefined, locked: true });
      delete gun.belief.stoppage;
      s.items[gun.mag].n = 0;
      const dry = tail(), dryLabel = weaponRows(s, pid).find(r => r.id === 'weapon:rifle-up')?.label;
      assert(dry === 'magOut:drop,reach,seat,release' && dryLabel === 'Rifle up: holster, RELOAD', JSON.stringify({ dry, dryLabel }));
      // (the magazine out, a round up)
      gun.belief = { chamber: 'live' }; gun.chamber = 'live'; delete gun.locked;
      const m = gun.mag; s.items[m].n = 10; doAction(s, null, { pid, gunId: rifle, action: 'magOut:drop', force: { 'magOut:drop': 'pass' } });
      const magIn = tail(), magLabel = weaponRows(s, pid).find(r => r.id === 'weapon:rifle-up')?.label;
      assert(magIn === 'reach,seat' && magLabel === 'Rifle up: holster, Magazine in', JSON.stringify({ magIn, magLabel }));
      const h2 = house(), ready = weaponList(h2.s, h2.pid, 'rifle-up');
      assert(ready.join(',') === 'holster,up' && weaponRows(h2.s, h2.pid).find(r => r.id === 'weapon:rifle-up')?.label === 'Rifle up: holster', JSON.stringify(ready));
      console.log(`      a click: holster, up, tap, charge, observe at ${lines.join(', ')} (v0.0.17's to the ms); a double: ${rem}; dry: ${dry} ("${dryLabel}"); the magazine out: ${magIn}; ready: nothing more`);
    },
  },
  {
    name: 'the P-12 drawn and dry with no HAD-17 left while the rifle hangs loaded: Fix is Rifle up, never "no rounds" (the review of v0.0.18: it read "no rounds" with a loaded R-7 on the sling); with the rifle emptied too, Fire carries the reason "no rounds"',
    fn() {
      const { s, pid, p, rifle } = house(), gun = s.items[p];
      s.items[gun.mag].n = 0; set(s, p, { chamber: 'empty', locked: true, count: 0 }, { chamber: undefined, locked: true });
      for (const pp of pouchesOf(s, pid)) for (const id of [...pp.mags]) if (s.items[id].fam === 'had17') discard(s, id);
      const f = fixOf(s);
      console.log(`      the P-12 dry, the R-7 hanging loaded: Fix "${f.label}"${f.off ? ` [${f.off}]` : ''}`);
      assert(f.id === 'weapon:rifle-up' && !f.off, JSON.stringify({ fix: f.id, label: f.label, off: f.off }));
      // (neither gun with a round: the rifle's magazine emptied, its chamber too, and every R-7 magazine gone)
      const R = s.items[rifle];
      s.items[R.mag].n = 0; set(s, rifle, { chamber: 'empty', count: 0 }, { chamber: undefined });
      for (const pp of pouchesOf(s, pid)) for (const id of [...pp.mags]) discard(s, id);
      const rows2 = stepsOf(s), g2 = modelOf(rows2).core.fix.row, why = rows2.find(r => r.id === 'fire')?.fixWhy ?? null;
      console.log(`      neither with a round: Fix "${g2.label}" [${g2.off ?? ''}], Fire's reason "${why}"`);
      assert(g2.id !== 'weapon:rifle-up' && why === 'no rounds', JSON.stringify({ fix: g2.id, label: g2.label, off: g2.off, why }));
    },
  },
  {
    name: 'Gun down and Off the line act on the gun in use: with the P-12 drawn and stopped, Gun down taps and racks the P-12, never the hanging rifle',
    fn() {
      const { g, s, pid, p, rifle } = house();
      set(s, p, { stoppage: 'click' }, { chamber: 'dud' });
      const gd = weaponList(s, pid, 'gun-down'), off = weaponList(s, pid, 'offline');
      assert(gd && gd.includes('tap') && off && off.includes('tap'), JSON.stringify({ gd, off }));
      const rows = weaponRows(s, pid).map(r => r.id);
      assert(rows.includes('weapon:rifle-up') && rows.includes('weapon:offline'), JSON.stringify(rows));
      const r0 = JSON.stringify(s.items[rifle]);
      run(g, s, 'weapon:gun-down');
      const pg = s.items[p];
      assert(pg.chamber === 'live' && !pg.belief.stoppage && JSON.stringify(s.items[rifle]) === r0, JSON.stringify({ pistol: pg, rifleSame: JSON.stringify(s.items[rifle]) === r0 }));
      console.log(`      Gun down on the P-12: ${gd.join(', ')}; then the P-12 ${pg.belief.chamber}, the rifle untouched; rows ${rows.join(', ')}`);
    },
  },
  {
    name: 'the holstered P-12\'s own rows are drawn, done and holstered on safe: P-12: Press check, Top up and MAKE READY sit in GUN ▸ only, never lead or on the band, none with a threat facing; the sergeant\'s press check 3,667 ms',
    fn() {
      const { g, s, pid, p } = house({ draw: false });
      const rows = stepsOf(s), mine = rows.filter(r => r.id.startsWith('weapon:other:'));
      const m = modelOf(rows), deep = m.groups.GUN.deep.map(r => r.id);
      const onSlots = Object.values(m.groups).flatMap(G => G.slots.filter(Boolean).map(e => e.row?.id)).filter(id => id?.startsWith('weapon:other:'));
      const onBand = [...(m.situation?.five ?? []).map(e => e.row?.id), ...Object.values(m.core).map(e => e.row?.id)].filter(id => id?.startsWith('weapon:other:'));
      assert(mine.length >= 2 && mine.every(r => !r.lead && deep.includes(r.id)) && !onSlots.length && !onBand.length, JSON.stringify({ mine: mine.map(r => r.id), deep, onSlots, onBand }));
      const pc = mine.find(r => r.id === 'weapon:other:pressCheck');
      assert(pc && pc.label === 'P-12: Press check' && Math.abs(pc.ms - 3667) <= 2, JSON.stringify({ label: pc?.label, ms: pc?.ms, subs: pc?.subs.map(x => x.id) }));
      // (done: drawn, checked, holstered on safe, the rifle up again)
      run(g, s, 'weapon:other:pressCheck');
      const k = s.people[pid].kit;
      assert(k.worn.holster === p && s.items[p].mode !== 'semi' && s.stop.gun === k.worn.sling && k.carry.posture === 'lowReady', JSON.stringify({ holster: k.worn.holster, mode: s.items[p].mode, gun: s.stop.gun, posture: k.carry.posture }));
      // (a threat facing (room 1's 1a at the contact's pause): none of them; the stoppage's answers are the panel's then)
      const c = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'contact' }), cs = c.state;
      for (let i = 0; i < 400 && !(cs.stop?.mode === 'stop' && cs.stop.phase === 'choose' && threatFacing(cs, cs.player.id)); i++) c.step(1);
      const T = threatFacing(cs, cs.player.id), near = weaponRows(cs, cs.player.id).filter(r => r.id.startsWith('weapon:other:'));
      assert(T && !near.length, JSON.stringify({ T: T?.T?.key, near: near.map(r => r.id) }));
      console.log(`      ${mine.map(r => `"${r.label}" ${secs(r.ms)} s`).join(', ')}; in GUN ▸ (${deep.length} there); done: holstered on ${s.items[p].mode ?? 'safe'}; with ${T.T.key} facing at ${T.dM.toFixed(1)} m: none offered`);
    },
  },
];
