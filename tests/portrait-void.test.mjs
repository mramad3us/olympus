// OLYMPUS tests: the boots and the hand on a hold on the card (the build sheet v0.0.24 item 18; AW§4.1 item 1; samples/mag-boots B and H).
//
// The user, 2026-11-17: "show us what we would be seeing, including what they are holding", a hand on a hold included. The gear
// record's boots and anchor (A's fields, src/sim/arms/gear.js gearOf) ride in the Seen record's gear, and a hand on a hold is the
// record's hold 'hold' (src/data/portrait.js HOLD_HOWS: a hand on a rail, the gun in the other). The doll draws mag boots as
// mag-boots' B-a from v0.0.28 (the user's star of 2026-11-20: the magnet's sole two rows deep, no cuff; B-b's grey housing before) and the anchor the gear
// names as its H candidate (H-a the left fist on a rail overhead, H-b the lanyard to a plate on the deck, H-c wedged, a boot under a
// rail): each draws its own pixels, and none of it is on a shipped person's doll, whose bytes are v0.0.23's (their digests recorded on
// the round's base tree). Without the change the boots and the anchor were not drawn at all (dressOf dropped them). Prints the
// pixels each adds. Then on A's own record (tests/void-world.mjs voidWorld, the steel copy at 0 G, the team in locked boots): your #2's
// card draws his boots, his hand on a rail once footing.js setAnchor puts it on a hold, and no rail once he lets go.
import { assert } from './helpers.mjs';
import { doll, DOLL_SCALE, MAG_BOOT_C } from '../src/art/doll/doll.js';
import { dressOf } from '../src/art/doll/dress.js';
import { ANCHOR_C } from '../src/art/doll/worn.js';
import { word } from '../src/art/paint.js';
import { digest } from '../src/core/hash.js';
import { seenKey } from '../src/sim/people/seen.js';
import { HOLD_HOWS } from '../src/data/portrait.js';
import { seenOf } from '../src/sim/people/seen.js';
import { paintPortrait } from '../src/art/doll/portrait.js';
import { setAnchor } from '../src/sim/body/footing.js';
import { holdNear } from '../src/sim/places/model.js';
import { voidWorld } from './void-world.mjs';

const PERSON = { look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' }, head: null }, sex: 'm' };
const ME = (o = {}) => ({ outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'front', mag: true }, pistol: { model: 'p12', place: 'holster', mag: true }, thigh: { holds: 2, mags: 1 }, held: null, painted: false, ...o });
const bytes = (pm) => { const u = new Uint8Array(pm.data.buffer, pm.data.byteOffset, pm.data.byteLength); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return digest(s); };
/** v0.0.23's dolls of shipped gear (no boots, no anchor), recorded on the round's base tree before any edit of E's. */
// (v0.0.24 F, the three combat EVA suits re-recorded on the merged tree: the user's picks of 2026-11-19, the helmet R3 in the Mars
// trim (helmets.js HELMET_DRAWN_AS) and the gloves grey (outfits.js COMBAT_SUIT.glove); the utilities' unmoved; v0.0.23's were
// '1d142da9e84147', '1570a86df13d3f', '1bfebdf91a314f')
const V023 = Object.freeze({ 'slung front': '1fbaf6d824fd8e', 'pistol ready, rifle hung': '0f8ccb9ad41ced', 'slung back': '07ed393eb7af0b', 'utilities, rifle front': '0e8025ffd4472a' });
const SHIPPED = { 'slung front': ME(), 'pistol ready, rifle hung': ME({ pistol: { model: 'p12', place: 'ready', mag: true } }), 'slung back': ME({ rifle: { model: 'r7', finish: null, place: 'back', mag: true } }), 'utilities, rifle front': ME({ outfit: 'utilities', suit: null, ears: 'cups', pistol: null, thigh: null }) };
const paint = (gear, rec = null) => doll({ ...dressOf(gear, PERSON, { rec }), scale: DOLL_SCALE });
const count = (pm, cs) => { const w = new Set(cs.map(c => word(c))); let n = 0; for (const v of pm.data) if (w.has(v)) n++; return n; };
const differ = (a, b) => { let n = 0; for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) n++; return n; };

export default [
  {
    name: 'mag boots (B-b) and each anchor (H-a the hand on a rail, H-b the lanyard, H-c the wedge) drawn on the doll from the gear, the hold \'hold\' a hand on a rail; a shipped person\'s doll byte for byte v0.0.23\'s',
    fn() {
      const bad = [], base = paint(ME());
      for (const [k, g] of Object.entries(SHIPPED)) { const d = bytes(paint(g)); if (d !== V023[k]) bad.push(`${k}: ${d}, v0.0.23 ${V023[k]}`); }
      const boots = paint(ME({ boots: 'mag' })), hold = paint(ME({ boots: 'mag', anchor: 'hold', rifle: { model: 'r7', finish: null, place: 'ready', mag: true } }), { kind: 'man', hold: { how: 'hold' }, pose: 'stand', facing: 'front' });
      const lanyard = paint(ME({ anchor: 'lanyard' })), wedge = paint(ME({ anchor: 'wedge' }));
      const row = { boots: [differ(boots, base), count(boots, [MAG_BOOT_C.cuff, MAG_BOOT_C.sole])], hold: [count(hold, [ANCHOR_C.rail, ANCHOR_C.lit])], lanyard: [differ(lanyard, base), count(lanyard, [ANCHOR_C.strap, ANCHOR_C.plate])], wedge: [differ(wedge, base), count(wedge, [ANCHOR_C.rail, ANCHOR_C.lit])] };
      console.log(`      boots: ${row.boots[0]} px off the plain doll, ${row.boots[1]} in the cuff's and the sole's tones; on a hold: the rail ${row.hold[0]} px; the lanyard ${row.lanyard[0]} px off, ${row.lanyard[1]} strap and plate; wedged ${row.wedge[0]} px off, rail ${row.wedge[1]}`);
      console.log(`      shipped dolls: ${Object.keys(SHIPPED).map(k => `${k} ${bytes(paint(SHIPPED[k]))}`).join(', ')}`);
      // (the gear's fields reach the record's key only when set: every key before is the same string)
      const rec = { kind: 'man', gear: ME(), hold: { how: 'empty' }, pose: 'stand', facing: 'front' };
      const k0 = seenKey(rec), k1 = seenKey({ ...rec, gear: { ...ME(), boots: null, anchor: null } });
      assert(HOLD_HOWS.includes('hold') && k0 === k1, JSON.stringify({ k0, k1 }));
      if (!(row.boots[1] > 20 && row.hold[0] > 20 && row.lanyard[1] > 20 && row.wedge[1] > 20 && row.wedge[0] > row.wedge[1])) bad.push(JSON.stringify(row));
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'on A\'s record (the steel copy of house 1 at 0 G, the team in locked mag boots): your #2\'s card draws his boots, then his hand on a rail once he takes the hold (gear.anchor \'hold\', the record\'s hold \'hold\'), and neither once he lets go and you take his boots off the record',
    fn() {
      const w = voidWorld(), s = w.s, two = w.twoPid, a = s.actors.list.find(x => x.who === two), person = { look: s.people[two].look, sex: s.people[two].sex };
      const card = () => { const r = seenOf(s, two, { by: w.pid, fresh: true }); return { r, pm: paintPortrait(r, person, { pxPerM: 96 }).pm }; };
      const booted = card();
      setAnchor(s, two, null);
      const h = holdNear(s, a.x, a.z, 3);
      assert(h, 'no hold near him');
      a.x = h.x + 0.3; a.z = h.z;
      const took = setAnchor(s, two, 'handhold'), held = card();
      setAnchor(s, two, null);
      const free = card();
      const n = (pm, cs) => count(pm, cs);
      console.log(`      boots locked: gear.boots ${booted.r.gear.boots}, anchor ${booted.r.gear.anchor}, hold ${booted.r.hold.how}, ${n(booted.pm, [MAG_BOOT_C.sole])} sole px, ${n(booted.pm, [MAG_BOOT_C.cuff])} cuff px; on the hold (${took.ok ? 'taken' : took.why}): anchor ${held.r.gear.anchor}, hold ${held.r.hold.how}, ${n(held.pm, [ANCHOR_C.rail, ANCHOR_C.lit])} rail px; let go: anchor ${free.r.gear.anchor}, ${n(free.pm, [ANCHOR_C.rail, ANCHOR_C.lit])} rail px`);
      // (v0.0.28: mag-boots B-a, the user's star of 2026-11-20, the heavier sole and no cuff; was the cuff counted, B-b's)
      assert(booted.r.gear.boots === 'mag' && n(booted.pm, [MAG_BOOT_C.sole]) > 10 && n(booted.pm, [MAG_BOOT_C.cuff]) === 0 && took.ok && held.r.gear.anchor === 'hold' && held.r.hold.how === 'hold' && n(held.pm, [ANCHOR_C.rail, ANCHOR_C.lit]) > 10 && !free.r.gear.anchor && n(free.pm, [ANCHOR_C.rail, ANCHOR_C.lit]) === 0, 'the record and the card');
    },
  },
];
