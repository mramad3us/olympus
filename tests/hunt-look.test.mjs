// OLYMPUS tests: the hunt of v0.0.18's look and page findings, each failing without its fix (the user's directive for the shoot
// house: "Stack and clear" perfected, never a dead end; the drawn figure as the sim's record, the instructor's words naming a key
// that works). look-1: the doll's magazine follows the gear; look-2 and kit-10: a device in the hands is in the gear record and
// drawn; look-3: an emptied device pouch keeps its slot; look-5: the armoured man holding a pistol is drawn with it; look-6: the
// stage's ear defenders are read from both slots; look-7: the I card lists what is in the hands and the rifle hanging; page-1: the
// far leg is walked, not looked at from the near one; page-2: no stale "Room clear. Next:" at the hall's end; page-3: the line's
// row keys never name an Aim row aimed at another man (pinned in the model too, and in the page's own path: steps.js rowKeysOf and
// diLit, which createSteps' rowKeys and the DI's light call). look-8, the I card's fit, is a browser test: ui-hunt-look.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseKitBot } from './bots/kit.mjs';
import { houseBot, stoppageBot } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { gearOf, gearKey, standGear } from '../src/sim/arms/gear.js';
import { handDeviceOf, devicesOf } from '../src/sim/arms/devices.js';
import { kitLook } from '../src/sim/arms/look.js';
import { kitView } from '../src/sim/arms/kit.js';
import { dressedDoll } from '../src/art/doll/dress.js';
import { paintHitcard } from '../src/art/doll/hitcard.js';
import { lookFor } from '../src/sim/people/figure.js';
import { tilesOf } from '../src/ui/cards/inventory.js';
import { isRowOf, rowKeysOf, diLit } from '../src/ui/hud/steps.js';
import { modelOf, viewOf, LAYOUTS, GROUPS } from '../src/sim/arms/groups.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { stopLead } from '../src/sim/skills/instinct/cqb.js';
import { stepsOf } from '../src/sim/arms/shooting.js';

const house = (o = {}) => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', ...o });
const diff = (a, b) => { let n = 0; for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) n++; return n; };
// (your doll as the I card paints it: the gear's, in your own look)
const dollOf = (s, gear) => { const pid = s.player.id, p = s.people[pid], a = s.actors.list.find(x => x.who === pid); return dressedDoll(gear, { look: lookFor(p.look, a.outfit, false), sex: p.sex }); };
const save = (name) => gunzipSync(readFileSync(path.join(root, 'tests', 'saves', `${name}.json.gz`))).toString('utf8');
const settle = (g) => { for (let n = 0; n < 120 && !(g.state.stop?.phase === 'choose' && instinctNow(g.state).line); n++) g.step(1); };

export default [
  {
    name: 'the doll draws the rifle\'s magazine only when it is in (the hunt of v0.0.18, look-1: the I card showed a magazine beside the weapon card\'s MAG OUT): test-pairs\' private at his first tick, and the shoot house\'s rifle at the ready and slung in front, in against out',
    fn() {
      const g = createGame({ scenario: 'test-pairs', seed: 48213, tier: 'private' }), s = g.state, gear = gearOf(s, s.player.id);
      assert(gear.rifle && gear.rifle.mag === false, JSON.stringify(gear.rifle));
      const pairs = diff(dollOf(s, gear), dollOf(s, { ...gear, rifle: { ...gear.rifle, mag: true } }));
      const h = house(), hs = h.state, hg = gearOf(hs, hs.player.id), out = {};
      for (const place of ['ready', 'front']) out[place] = diff(dollOf(hs, { ...hg, rifle: { ...hg.rifle, place, mag: true } }), dollOf(hs, { ...hg, rifle: { ...hg.rifle, place, mag: false } }));
      console.log(`      pixels between the magazine in and out: test-pairs ${pairs}; the house at the ready ${out.ready}, slung in front ${out.front} (v0.0.18: 0, 0, 0)`);
      assert(pairs > 0 && out.ready > 0 && out.front > 0, JSON.stringify({ pairs, out }));
    },
  },
  {
    name: 'a device in the hands is in the gear record and on the doll (the hunt of v0.0.18, look-2 and kit-10: an armed G-11 and the halligan held, the record\'s hands empty and the doll\'s fists too): every tick of the full kit\'s throw and the breach kit\'s pry (sergeant, seed 48213)',
    fn() {
      for (const [loadout, use, model] of [['full', 'flash', 'g11'], ['breach', 'breach', 'hal']]) {
        const g = house({ loadout }), bot = houseKitBot({ use }), pid = g.state.player.id;
        let ticks = 0, wrong = 0, px = null, first = null;
        for (let i = 0; i < 4000 && !g.state.armoury.range.house.end; i++) {
          g.step(1, bot);
          const hd = handDeviceOf(g.state, pid);
          if (!hd) continue;
          ticks++;
          const gear = gearOf(g.state, pid);
          if (gear.device?.model !== hd.model) wrong++;
          if (hd.model === model && px === null) { first = gearKey(gear); px = diff(dollOf(g.state, gear), dollOf(g.state, { ...gear, device: null })); }
        }
        console.log(`      ${loadout}: ${ticks} ticks with a device in the hands, ${wrong} with the record not naming it; the doll's ${model} ${px} px; ${first}`);
        assert(ticks > 0 && wrong === 0 && px > 0, JSON.stringify({ loadout, ticks, wrong, px }));
      }
    },
  },
  {
    name: 'an emptied device pouch keeps its slot on the doll and the full one below it stays in its own (the hunt of v0.0.18, look-3: after the first G-11 the second pouch was drawn in the first\'s place): the flash kit, sergeant, seed 48213',
    fn() {
      const g = house({ loadout: 'flash' }), bot = houseKitBot({ use: 'flash' }), pid = g.state.player.id;
      let at = null;
      for (let i = 0; i < 4000 && !at; i++) { g.step(1, bot); if (devicesOf(g.state, pid).some(d => d.where === 'hand')) at = gearOf(g.state, pid); }
      const left = (at?.devices ?? []).filter(d => d.face === 'left');
      console.log(`      the first G-11 drawn: ${gearKey(at)}`);
      assert(left.length === 2 && left[0].slot === 0 && left[0].model === null && left[1].slot === 1 && left[1].model === 'g11', JSON.stringify(left));
    },
  },
  {
    name: 'the armoured man holding a pistol is drawn holding it, on the record and on the target card (the hunt of v0.0.18, look-5: the card drew the R-7 where the stage\'s board held a pistol)',
    fn() {
      const gp = standGear('armoured', 'pistol'), gr = standGear('armoured', 'rifle');
      assert(gp.pistol?.place === 'hand' && !gp.rifle && gp.outfit === 'carrier' && gp.carrier && gr.rifle?.place === 'hand' && !gr.pistol, JSON.stringify({ gp, gr }));
      const P = (face, holds) => paintHitcard({ face, holds, phase: 'belief', marks: [], words: `${face} ${holds}`, rangeM: 6, subject: { kind: 'board', face, holds } });
      const a = P('armoured', 'pistol'), b = P('armoured', 'rifle');
      let n = 0;
      for (let y = 0; y < 150; y++) for (let x = 0; x < a.w; x++) if (a.data[y * a.w + x] !== b.data[y * a.w + x]) n++;
      console.log(`      the card's figure, armoured with a pistol against a rifle: ${n} px apart (v0.0.18: 0)`);
      assert(n > 0, `${n}`);
    },
  },
  {
    name: 'the stage figure wears ear defenders where the doll does, in either slot (the hunt of v0.0.18, look-6: test-stress, test-pairs and test-range issue ed1 in its own slot, and the stage drew you and the relay bare-eared)',
    fn() {
      const rows = [];
      for (const scenario of ['test-stress', 'test-pairs', 'test-range', 'test-handling', 'test-shoothouse']) {
        const g = createGame({ scenario, seed: 48213 }), s = g.state;
        for (const pid of Object.keys(s.people)) {
          if (!s.people[pid]?.kit) continue;
          const k = kitLook(s, pid).ears, d = gearOf(s, pid)?.ears === 'cups';
          rows.push({ scenario, pid, k, d });
        }
      }
      const off = rows.filter(r => r.k !== r.d), cups = rows.filter(r => r.k).length;
      console.log(`      ${rows.length} kitted people over five scenes, ${cups} in ear defenders, ${off.length} where the stage and the doll disagree`);
      assert(!off.length && cups >= 8, JSON.stringify(off.slice(0, 5)));
    },
  },
  {
    name: 'the I card lists what is in the hands and says the rifle hangs while the P-12 is out (the hunt of v0.0.18, look-7: "Your R-7, at the low ready" with the pistol drawn, and the P-12, a G-11 or the halligan in the hand listed nowhere)',
    fn() {
      const g = house({ loadout: 'standard' }), bot = stoppageBot({ answer: 'transition' }), pid = g.state.player.id;
      for (let i = 0; i < 4000 && gearOf(g.state, pid).pistol?.place !== 'ready'; i++) g.step(1, bot);
      const t = tilesOf(kitView(g.state, pid)), hand = t.groups.find(x => x.id === 'hand');
      console.log(`      the P-12 drawn: "${t.sling?.word}"; in the hand: ${hand?.items.map(x => x.word).join(', ') ?? 'nothing'}`);
      assert(/hanging/.test(t.sling?.word ?? '') && hand?.items.some(x => x.kind === 'gun' && /P-12/.test(x.word)), JSON.stringify({ sling: t.sling, hand }));
      for (const [loadout, use, model] of [['full', 'flash', 'g11'], ['breach', 'breach', 'hal']]) {
        const h = house({ loadout }), hb = houseKitBot({ use }), hp = h.state.player.id;
        for (let i = 0; i < 4000 && handDeviceOf(h.state, hp)?.model !== model; i++) h.step(1, hb);
        const ht = tilesOf(kitView(h.state, hp)), hh = ht.groups.find(x => x.id === 'hand');
        console.log(`      ${loadout}: in the hand: ${hh?.items.map(x => x.word).join(', ') ?? 'nothing'}`);
        assert(hh?.items.some(x => x.kind !== 'mag' && x.word), JSON.stringify({ loadout, groups: ht.groups.map(x => x.id) }));
      }
    },
  },
  {
    name: 'with your #2\'s man up and the far leg unseen, the instructor names the walk to the far leg, never a look that cannot see it (the hunt of v0.0.18, page-1: "Your two\'s man. You: Look: the far leg. [1]" four presses with nothing changed; the private\'s page save at room 3, seed 48213)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213 });
      g.load(save('v0.0.18-house-farleg'));
      g.step(1);
      const line = instinctNow(g.state).line, offered = stepsOf(g.state).some(x => x.id === 'move:far' && !x.off);
      console.log(`      ${line?.id}: "${line?.text}" ${line?.act}; move:far offered ${offered}`);
      assert(offered && line?.act === 'stop:move:far' && !/look:r3:far/.test(line?.act ?? ''), JSON.stringify(line));
      // (and pressed, it walks there: the far leg seen)
      g.step(1, { act: [stepAct('move:far')] }); settle(g);
      const me = g.state.actors.list.find(a => a.who === g.state.player.id);
      console.log(`      after the walk: (${me.x.toFixed(2)}, ${me.z.toFixed(2)})`);
      assert(me.z < 9, JSON.stringify({ x: me.x, z: me.z }));
    },
  },
  {
    name: 'at the hall\'s end the lead no longer says "Room clear. Next: the hall" when the walk down it began the instant room 3 was cleared (the hunt of v0.0.18, page-2: "Room clear. Next: the hall, 5.8 m." standing at its end); the private by the keys, seed 48213, standard and full',
    fn() {
      for (const loadout of ['standard', 'full']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'private', loadout }), bot = houseBot({ mode: 'keys' });
        let stale = 0, said = 0;
        for (let i = 0; i < 6000 && !g.state.armoury.range.house.end; i++) {
          g.step(1, bot);
          const S = g.state.stop, lead = S?.phase === 'choose' ? stopLead(g.state) : null;
          if (!lead || !/^Room clear\. Next: the hall/.test(lead)) continue;
          said++;
          if (S.last?.step === 'move:hallEnd') stale++;
        }
        console.log(`      ${loadout}: "Room clear. Next: the hall" said at ${said} stops, ${stale} of them at the hall's end`);
        assert(said > 0 && stale === 0, JSON.stringify({ loadout, said, stale }));
      }
    },
  },
  {
    name: 'the line\'s row keys never name an Aim row aimed at another man than the one the line names (the hunt of v0.0.18, page-3: "Hands not seen: the armoured target. Cover him. [7]", the 7 aiming at the no-shoot by the door, then 9, then 7, for ever; the private\'s page save at room 2, seed 48213, the breach kit)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213 });
      g.load(save('v0.0.18-house-coverhim'));
      settle(g);
      const seen = [];
      // (the line's own act, T, as the page now shows it with no row keys: in a few presses the bracket and the muzzle are on him)
      for (let i = 0; i < 6; i++) {
        const line = instinctNow(g.state).line, rows = stepsOf(g.state), aim = rows.find(x => x.id === 'aim');
        const named = line?.row ? rows.find(x => isRowOf(x, line.row)) ?? null : null;
        seen.push({ text: line?.text, row: line?.row ?? null, named: named?.id ?? null, namedAt: named?.target ?? null, aimAt: aim?.target ?? null, pick: g.state.stop?.pick });
        // (a row the line names aims, if at all, at the man in its words)
        const who = String(line?.row ?? '').split('>')[1];
        if (named && who) assert(named.target === who, JSON.stringify(seen.at(-1)));
        if (!line?.act) break;
        g.step(1, { act: ['instinct'] }); settle(g);
      }
      for (const x of seen) console.log(`      ${JSON.stringify(x)}`);
      const hands = seen.find(x => x.row === 'aim>turner:3' && x.aimAt === 'turner:4');
      assert(!hands || hands.named === null, JSON.stringify(hands));
      assert(g.state.stop?.pick === 'turner:3' || seen.some(x => x.pick === 'turner:3'), JSON.stringify(seen));
    },
  },
  {
    name: 'the page\'s row keys and the DI\'s light follow the Aim row\'s man (the review of the page-3 fix: a revert of createSteps\' rowKeys alone to v0.0.19\'s match passed every test): steps.js rowKeysOf and diLit over the panel\'s model at the coverhim save, every layout, null and unlit while the line names turner:3 and the Aim row is on turner:4, keyed and lit with the same rows aimed at turner:3',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213 });
      g.load(save('v0.0.18-house-coverhim'));
      settle(g);
      const ID = 'aim>turner:3';
      // (the panel's model as the page builds it (steps.js update: modelOf over the sim's rows), and the entries of every view of it)
      const read = (rows) => {
        // (the light by row, over every row of the model: the Aim row sits in a group's deep list here, drawn in no view's keys)
        const pm = modelOf(rows), out = { lit: pm.rows.filter(r => diLit({ row: r }, ID)).map(r => `${r.id}>${r.target ?? ''}`) };
        for (const L of LAYOUTS) {
          // (and on the keys drawn: the band, then each group opened (A's drawers, B's banks, C's fan))
          const lit = [{}, ...GROUPS.map(group => ({ group }))].flatMap(nav => viewOf(pm, L, nav).keys.filter(k => diLit(k.entry, ID)).map(k => `${nav.group ?? 'band'}:${k.key}`));
          // (v0.0.19's rowKeys: the row whole, else by its id before '>', whatever man it aims at)
          const old = [ID, ID.split('>')[0]].find(x => pm.rows.some(r => r.id === x)) ?? null;
          out[L] = { keys: rowKeysOf(pm, L, ID), lit, v0019: old };
        }
        return out;
      };
      // (T, the line's own act, from High ready until the line names the armoured man while the Aim row is on the no-shoot)
      let rows = null, line = null;
      for (let i = 0; i < 6; i++) {
        line = instinctNow(g.state).line?.row ?? null; rows = stepsOf(g.state);
        if (line === ID && rows.find(x => x.id === 'aim')?.target === 'turner:4') break;
        g.step(1, { act: ['instinct'] }); settle(g); rows = null;
      }
      assert(rows, JSON.stringify({ line }));
      const before = read(rows);
      console.log(`      the line at ${ID}, the Aim row on turner:4: rows lit ${JSON.stringify(before.lit)}; ${LAYOUTS.map(L => `${L} keys ${JSON.stringify(before[L].keys)} lit ${JSON.stringify(before[L].lit)} (v0.0.19: the '${before[L].v0019}' row's keys)`).join('; ')}`);
      assert(before.lit.length === 0, JSON.stringify(before.lit));
      for (const L of LAYOUTS) assert(before[L].keys === null && before[L].lit.length === 0 && before[L].v0019 === 'aim', JSON.stringify({ L, ...before[L] }));
      // (the same rows with the Aim row on the man named: his row, keyed and lit in every layout)
      const after = read(rows.map(x => (x.id === 'aim' ? { ...x, target: 'turner:3' } : x)));
      console.log(`      the same rows, the Aim row on turner:3: rows lit ${JSON.stringify(after.lit)}; ${LAYOUTS.map(L => `${L} keys ${JSON.stringify(after[L].keys)} lit ${JSON.stringify(after[L].lit)}`).join('; ')}`);
      for (const L of LAYOUTS) assert(Array.isArray(after[L].keys) && after[L].keys.length > 0, JSON.stringify({ L, ...after[L] }));
      assert(after.lit.length === 1 && after.lit[0] === 'aim>turner:3', JSON.stringify(after.lit));
      // (the light: never on the NEXT key's copy, never on another man's, never with no line)
      const row = { id: 'aim', kind: 'aim', target: 'turner:3' };
      assert(diLit({ row }, ID) && !diLit({ row, core: 'next' }, ID) && !diLit({ row: { ...row, target: 'turner:4' } }, ID) && !diLit({ row }, null), 'diLit');
    },
  },
];
