// OLYMPUS tests: you prone on the C card, as portrait-pose's Y group stands (the build sheet v0.0.24 item 17; Y-p drawn at its default since v0.0.23).
//
// Nobody has scored portrait-pose's Y group, so you prone are drawn at its default, Y-p (the head and shoulders low behind the rifle,
// end on, whatever the carry), the pick one line (PORTRAIT_PICKS.prone). This round must not move it: the prone dolls with the
// rifle and with the P-12 are v0.0.23's bytes (their digests recorded on the round's base tree, v0.0.23's snapshot with stage 0),
// though the low ready they come from was redrawn (worn.js READY_BUTT: prone keeps the rifle end on, never at the low ready). Fails if
// the redraw or the light reached a prone doll. Prints the digests.
import { assert } from './helpers.mjs';
import { paintPortrait, PORTRAIT_PICKS } from '../src/art/doll/portrait.js';
import { DOLL_SCALE } from '../src/art/doll/doll.js';
import { digest } from '../src/core/hash.js';

const PERSON = { look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' }, head: null }, sex: 'm' };
const ME = (o = {}) => ({ outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'front', mag: true }, pistol: { model: 'p12', place: 'holster', mag: true }, thigh: { holds: 2, mags: 1 }, held: null, painted: false, ...o });
const bytes = (pm) => { const u = new Uint8Array(pm.data.buffer, pm.data.byteOffset, pm.data.byteLength); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return digest(s); };
/** v0.0.23's prone dolls (recorded on the round's base tree, .run/v024/base.tree, before any edit of E's). */
// (v0.0.24 F, re-recorded on the merged tree: the user's picks of 2026-11-19 on the combat EVA suit, the helmet R3 in the Mars trim
// (helmets.js HELMET_DRAWN_AS) and the gloves grey (outfits.js COMBAT_SUIT.glove), drawn on every doll in it, prone too; the redraw of
// the low ready and the light still never reach a prone doll; v0.0.23's were rifle '0d96d1670895a7', pistol '05b87d1c67e90d')
// (v0.0.28, re-recorded by name: the picks of 2026-11-20 on the aimed holds, "we need the gun held to be like soldiers hold a gun,
// aiming through ironsights" (the triage's C1: one aimed hold for every card with a gun pointed, the prone Y-p with them): you prone
// behind the R-7 through its sights (A3, src/art/doll/held.js rifleAimed) and behind the P-12 (P3, pistolAimed), the prone bend as
// before; v0.0.24 F's were rifle '162ab66123ec34', pistol '16867179b0fbf8'. The low ready's redraw and his light still never reach it)
// (v0.0.28, re-recorded by name a second time, the art director's pass of 2026-11-20 on Y-p: "the chest plate faces you as if he
// stood ... the support arm is a grey pipe": you prone low behind the gun, both elbows out wide on the deck (held.js PRONE_ELBOW_Y,
// doll.js POSE_BENDS.prone's line moved to it), the arms flat limbs bent at the elbow, the fists a grey block of their own, the
// R-7 end on with its grip in the fist; the first v0.0.28 recording was rifle '18c9b346b56d75', pistol '0f9aec9cada28a')
const V023 = Object.freeze({ rifle: '0899995fb58bb3', pistol: '0cb93c352e0042' });

export default [
  {
    name: 'you prone are drawn at Y-p, v0.0.23\'s bytes with the rifle and with the P-12 (the low ready\'s redraw and his light never reach a prone doll)',
    fn() {
      const rec = (how, gear) => ({ kind: 'man', gear, hold: { how }, pose: 'prone', facing: 'front', aimAt: null, light: { level: 0.2, sp: 1 } });
      const got = { rifle: bytes(paintPortrait(rec('rifle-low', ME({ rifle: { model: 'r7', finish: null, place: 'ready', mag: true } })), PERSON, { scale: DOLL_SCALE }).pm), pistol: bytes(paintPortrait(rec('pistol-ready', ME()), PERSON, { scale: DOLL_SCALE }).pm) };
      console.log(`      Y-p (${PORTRAIT_PICKS.prone}): the rifle ${got.rifle} (v0.0.23 ${V023.rifle}), the P-12 ${got.pistol} (v0.0.23 ${V023.pistol})`);
      assert(PORTRAIT_PICKS.prone === 'Y-p' && got.rifle === V023.rifle && got.pistol === V023.pistol, JSON.stringify(got));
    },
  },
];
