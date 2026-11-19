// OLYMPUS tests: the held devices sample (samples/held-devices; kit-10 of the v0.0.18 hunt), and the figure hooks it draws with.
//
// The stage's figure draws both fists empty while a G-11, the halligan, the ram or a charge is in them; the sample shows the
// candidates the user scores, drawn by the game's figure code through two hooks of compose.js that only a given pose opens (its
// `reach`, a free hand put on a point, and its `device`, the device's parts). These tests hold that the hooks are shut for the
// game (1,824 of its frames, three looks by four facings by every frame and beat, shaded, digest for digest what v0.0.19 drew,
// pinned on v0.0.19's own compose.js before the hooks went in), that every candidate's device is drawn whole, at the hands that
// hold it and seen from the front at its still, that the throw's one quantity holds in the data (the can in the hand up to the
// release, never after), and that sample.json's views are the pages the gallery shoots. The last runs the hunt's lane in node to
// its three moments and checks capture.mjs's record still says what the sim says (a device in your hand at each). Pure, in node.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { golden } from './golden.mjs';
import { composeFrame } from '../src/art/figures/compose.js';
import { shade } from '../src/art/figures/shade.js';
import { wear, coloursOf } from '../src/art/figures/outfits.js';
import { FRAMES as FRAMES_ALL, DIRS, BANDS } from '../src/art/figures/poses.js';
// (v0.0.22: the held band's frames are new (poses.js BANDS.stanceHeld, the build sheet v0.0.22 §1 item 17); the game's frames before
// them are pinned here as they were, and art-held holds the new ones)
// (v0.0.24: the P-12's high-ready walk (BANDS.stancePistol) is new frames too, left out; 'draw' and 'pistolAim' left the stance sheet
// but beatPose still poses them for three samples: composed at their old place after fireMove1, so the golden holds unmoved)
const FRAMES = FRAMES_ALL.filter(f => !BANDS.stanceHeld.includes(f) && !BANDS.stancePistol.includes(f)).flatMap(f => (f === 'fireMove1' ? [f, 'draw', 'pistolAim'] : [f]));
import { BEAT_FRAMES, beatPose } from '../src/art/figures/walk.js';
import { expand } from '../tools/gallery.mjs';
import { DEV_COL, isDevice, SETS, THROWS, specOf, poseFor } from '../samples/held-devices/held.js';

const PPM = 16;
const suit = (carry = 'low') => wear({ outfit: 'combatSuit', carrier: true, weapon: 'rifle', carry, seed: 3, model: 'r7' });
const STACK = beatPose('stack', { weapon: 'rifle', carry: 'low' });
const frameOf = (spec, dir) => composeFrame(suit(), dir, 'idle0', { ppm: PPM, pose: poseFor(spec, STACK) });
const deviceCells = (f) => { const out = []; f.cells.forEach((row, y) => row.forEach((c, x) => { if (isDevice(c?.ch)) out.push([x, y]); })); return out; };
/** Every candidate's frames that hold a device: [{ set, cand, frame, spec }]. */
const held = () => Object.entries(SETS).flatMap(([set, S]) => Object.keys(S.cands).flatMap(cand => [...new Set(S.phases.map(p => p[2]))]
  .map(frame => ({ set, cand, frame, spec: specOf(set, cand, frame) })).filter(x => x.spec.dev)));

export default [
  {
    name: 'the game\'s frames are v0.0.19\'s to the byte: the hooks open only for a pose that carries reach or device',
    fn() {
      const looks = [suit('low'), suit('front'), wear({ outfit: 'utilities', weapon: 'pistol', carry: 'low', carrier: true, seed: 5 })];
      const parts = [];
      for (const L of looks) for (const d of DIRS) {
        // (v0.0.23: the P-12's band (poses.js BANDS.pistol, the user's note of 2026-11-17) is new frames, left out: every frame before it as pinned)
        for (const f of FRAMES.filter(x => !BANDS.pistol.includes(x))) { const fr = composeFrame(L, d, f, { ppm: PPM }); parts.push(shade(fr.cells, coloursOf(fr.look, PPM)).data); assert(!fr.hands, `${f} ${d} reports hands`); }
        for (const b of BEAT_FRAMES) { const fr = composeFrame(L, d, 'idle0', { ppm: PPM, pose: beatPose(b, { weapon: L.weapon, carry: L.carry }) }); parts.push(shade(fr.cells, coloursOf(fr.look, PPM)).data); assert(!fr.hands, `${b} ${d} reports hands`); }
      }
      const all = new Uint32Array(parts.reduce((a, p) => a + p.length, 0));
      let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
      console.log(`      ${parts.length} frames, ${all.length} pixels`);
      // (pinned on v0.0.19's compose.js before the sample's hooks were written)
      // (v0.0.24 F, re-recorded with three causes, each the user's pick of 2026-11-19: the combat EVA suit's helmet R3 in the Mars trim (helmets.js HELMET_DRAWN_AS), its gloves grey (outfits.js COMBAT_SUIT.glove), and the aimed rifle's stock raised to the cheek (compose.js AIM_CHEEK_UP_M); was '1c53d76d17f6d4')
      golden('the figures\' frames, three looks, every frame and beat, four facings', all, '09289684fb05a6');
    },
  },
  {
    name: 'no device letter is drawn and no hand moves without the hooks: today\'s figure with a device in hand is the slung rifle and empty fists',
    fn() {
      const today = frameOf({}, 'down'), plain = composeFrame(suit(), 'down', 'idle0', { ppm: PPM, pose: { ...STACK, rig: { mode: 'front', gun: 'rifle' } } });
      const key = (f) => f.cells.map(r => r.map(c => (c ? c.ch : '.')).join('')).join('\n');
      assert(key(today) === key(plain) && deviceCells(today).length === 0, 'the sample\'s "today" is the plain frame');
      for (const ch of Object.keys(DEV_COL)) assert(coloursOf(suit(), PPM)[ch] === undefined, `the game's colours know ${ch}`);
    },
  },
  {
    name: 'every candidate\'s device is drawn whole inside its cell, and a hand on it holds it (within 2 px)',
    fn() {
      let n = 0, worst = 0;
      for (const { set, cand, frame, spec } of held()) for (const dir of ['down', 'right', 'left']) {
        // (the shock tube is left out: it lies on the floor, the devices layer's in the game, drawn into the figure here for the picture)
        const only = frameOf({ ...spec, only: true, dev: spec.dev.filter(q => q.role !== 'ő') }, dir), cells = deviceCells(only), w = only.w, h = only.h;
        assert(cells.length >= 3, JSON.stringify({ set, cand, frame, dir, px: cells.length }));
        // (whole: no device pixel on the cell's edge, where a longer part would have been cut off)
        assert(cells.every(([x, y]) => x > 0 && y > 0 && x < w - 1 && y < h - 1), JSON.stringify({ set, cand, frame, dir, edge: cells.filter(([x, y]) => !(x > 0 && y > 0 && x < w - 1 && y < h - 1)) }));
        for (const s of ['r', 'l']) {
          if ((!spec[s] && !spec.dev.some(q => q.hand === s)) || spec.free === s) continue;
          const t = only.hands[s], d = Math.min(...cells.map(([x, y]) => Math.hypot(x + 0.5 - t[0], y + 0.5 - t[1])));
          worst = Math.max(worst, d);
          assert(d <= 2.0, JSON.stringify({ set, cand, frame, dir, hand: s, at: t.map(v => +v.toFixed(1)), nearestPx: +d.toFixed(2) }));
        }
        n++;
      }
      console.log(`      ${n} frames by facing, the farthest hand ${worst.toFixed(2)} px from its device`);
    },
  },
  {
    name: 'each candidate\'s still shows its device facing you: most of its pixels are not hidden by the body, the arms or the slung rifle',
    fn() {
      const rows = [];
      for (const [set, S] of Object.entries(SETS)) for (const cand of Object.keys(S.cands)) {
        const spec = specOf(set, cand, set === 'hold' ? 'hold' : 'carry'), all = deviceCells(frameOf({ ...spec, only: true }, 'down')).length, seen = deviceCells(frameOf(spec, 'down')).length;
        rows.push(`${cand} ${seen}/${all}`);
        assert(seen >= 0.6 * all, JSON.stringify({ set, cand, seen, all }));
      }
      console.log(`      seen of drawn, facing you: ${rows.join(', ')}`);
    },
  },
  {
    name: 'one quantity: the can is in the hand through the throw\'s two frames and gone at the follow-through, for every throw',
    fn() {
      for (const t of Object.keys(THROWS)) {
        const a = specOf('hold', 'G1', 'throw0', t), b = specOf('hold', 'G1', 'throw1', t), c = specOf('hold', 'G1', 'after', t);
        assert(a.dev?.length && b.dev?.length && !c.dev, JSON.stringify({ t, throw0: !!a.dev, throw1: !!b.dev, after: !!c.dev }));
      }
      // (the loops: the G-11's pin, the throw and its release on DEVICE_ACTIONS' times at 10)
      const P = Object.fromEntries(SETS.hold.phases.map(p => [p[2], p[1]]));
      assert(Math.abs(P.pin + P.pinOut - 0.5) < 1e-9 && Math.abs(P.throw0 + P.throw1 - 0.7) < 1e-9 && P.reachG === 1.2, JSON.stringify(P));
    },
  },
  {
    name: 'sample.json\'s views are the pages the gallery shoots: each group\'s candidates, the defaults first, each at its picture\'s size',
    fn() {
      const s = JSON.parse(readFileSync(path.join(root, 'samples/held-devices/sample.json'), 'utf8')), groups = expand('held-devices', s);
      const SIZE = { hold: '320x184', bar: '320x184', ram: '320x184', charge: '320x184', all: '420x196', throw: '334x222', check: '500x246' };
      const ids = groups.flatMap(g => g.views.map(v => v.id));
      assert(ids.join(',') === 'G1,G2,G3,G-all,T1,T2,T3,B1,B2,B3,R1,R2,C1,C2,K1', ids.join(','));
      for (const g of groups) for (const v of g.views) {
        const q = new URLSearchParams(v.query), set = q.get('set');
        assert(SIZE[set] === v.pixel, JSON.stringify({ id: v.id, set, pixel: v.pixel }));
        const c = q.get('g') ?? q.get('b') ?? q.get('r') ?? q.get('c') ?? q.get('t');
        if (c) assert(c === v.id && (SETS[{ g: 'hold', b: 'bar', r: 'ram', c: 'charge' }[[...q.keys()].find(k => k !== 'set')]]?.cands[c] || THROWS[c]), JSON.stringify(v));
      }
      for (const S of Object.values(SETS)) assert(Object.keys(S.cands)[0] === S.def && S.cands[S.def].name.includes('THE DEFAULT'), S.def);
      console.log(`      ${ids.length} views in ${groups.length} groups`);
    },
  },
  {
    name: 'the check\'s moments are the sim\'s: the hunt\'s lane holds a device in your hand at 13,350, 28,850 and 33,400 ms after GO',
    async fn() {
      const rec = JSON.parse(readFileSync(path.join(root, 'samples/held-devices/check.json'), 'utf8'));
      const { createGame } = await import('./game.mjs'), { runHouse } = await import('./bots/house.mjs'), { houseKitBot } = await import('./bots/kit.mjs');
      const { handDeviceOf } = await import('../src/sim/arms/devices.js');
      const L = rec.lane, g = createGame({ scenario: 'test-shoothouse', seed: L.seed, tier: L.tier, setup: 'go', loadout: L.loadout });
      const pid = g.state.player.id, go = g.state.armoury.range.house.goAtMs, want = rec.moments.map(m => m.ms), got = [];
      runHouse(g, houseKitBot({ use: L.use, base: L.base }), { maxMs: 40_000, each: (game) => {
        const ms = game.state.clock.ms - go;
        if (!want.includes(ms)) return;
        const h = handDeviceOf(game.state, pid), a = game.state.actors.list.find(x => x.who === pid);
        got.push({ ms, model: h?.model ?? null, st: h?.st ?? null, face: a.face });
      } });
      console.log(`      ${got.map(m => `${m.ms} ms ${m.model} ${m.st} facing ${m.face}`).join('; ')}`);
      assert(got.length === 3, JSON.stringify(got));
      got.forEach((m, i) => { const r = rec.moments[i]; assert(m.model === r.device.model && m.st === r.device.st && m.face === r.face, JSON.stringify({ sim: m, record: r })); });
    },
  },
];
