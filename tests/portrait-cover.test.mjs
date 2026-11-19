// OLYMPUS tests: half behind the jamb, half drawn (the build sheet v0.0.24 item 16, its F118 read as F121; P§3.3; samples/portrait-light J1, the default).
//
// The user, 2026-11-17: the portraits "need to be more dynamic and show us what we would be seeing". The target view reads the man
// its card shows with the jamb's rays (seen.js coverOf: COVER_RAYS 5 lines from your eye through perception.js clearLine across
// ±COVER_HALF_M 0.25 m of him, square to the line of sight), and the card draws the share the walls hide from a side as the wall over
// him (J1: the house's wall in its tones, its lit edge toward you), the marks on top. In house 1 at GO, the live lane's 2a stood where
// the doorway's jamb hides his left from your eye reads cover.left 0.5 or more, and his card's columns on that side are the jamb's
// tones, nothing else of it moved; in the open he reads no cover; hidden whole, his card draws him whole, as last seen. Without the
// change the record's cover was null and the card drew him whole. Prints where he stood, the rays and the card's pixels.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { seenOf, coverAt, COVER_RAYS, COVER_HALF_M } from '../src/sim/people/seen.js';
import { paintHitcard } from '../src/art/doll/hitcard.js';
import { jambDrawn, LOOKS_ENFORCED } from './flawless-looks.mjs';

const actorOf = (s, who) => s.actors.list.find(a => a.who === who);

export default [
  {
    name: 'F121 a man half behind a jamb from the stack\'s eye reads cover.left 0.5 or more and his card\'s hidden columns are the jamb\'s tones, nothing else moved; in the open no cover; hidden whole, drawn whole',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,hide', setup: 'go' }), s = g.state;
      const me = actorOf(s, s.player.id), rp = s.armoury.range.turners.find(T => T.live).live.who, a = actorOf(s, rp), eye = { x: me.x, z: me.z };
      // (the first place, out from your eye in rings, where a wall's edge hides his left half: the jamb of a doorway in view)
      let at = null, open = null;
      for (let r = 2; r <= 14 && !at; r += 0.25) for (let k = 0; k < 96 && !at; k++) {
        const t = (k / 96) * 2 * Math.PI, p = { x: eye.x + Math.cos(t) * r, z: eye.z + Math.sin(t) * r }, c = coverAt(s, p, eye);
        if (!open && !c.left && !c.right) open = p;
        if (c.left >= 0.5 && c.left < 1 && !c.right) at = { ...p, c, r, deg: Math.round(t * 180 / Math.PI) };
      }
      assert(at && open, JSON.stringify({ at, open }));
      a.x = at.x; a.z = at.z; a.headRad = Math.atan2(eye.z - a.z, eye.x - a.x);
      const rec = seenOf(s, rp, { fresh: true, cover: true }), person = { look: s.people[rp].look, sex: s.people[rp].sex };
      console.log(`      2a at ${at.r} m, ${at.deg}° from your eye (${at.x.toFixed(2)}, ${at.z.toFixed(2)}): cover ${JSON.stringify(rec.cover)} by ${COVER_RAYS} rays across ±${COVER_HALF_M} m`);
      const whole = paintHitcard({ subject: { kind: 'man', rec: { ...rec, cover: null }, person }, rangeM: 4, words: '2A' });
      const hid = paintHitcard({ subject: { kind: 'man', rec, person }, rangeM: 4, words: '2A' });
      // (his figure's columns on the whole card: the card's own ground is one colour a row)
      const W = whole.w, figH = whole.h - whole.words.h;
      let fx0 = W, fx1 = -1;
      for (let y = 1; y < figH; y++) { const g0 = whole.data[y * W + 2]; for (let x = 1; x < W - 1; x++) if (whole.data[y * W + x] !== g0) { fx0 = Math.min(fx0, x); fx1 = Math.max(fx1, x); } }
      const J = jambDrawn(whole, hid, { fx0, fx1, figH, left: rec.cover.left });
      console.log(`      his columns ${fx0} to ${fx1}; the jamb to column ${J.edge}: ${J.jamb} of ${J.cells} px in its tones, ${J.outside} moved past it; the card's jamb ${hid.jamb} px`);
      // (in the open: none; hidden whole: drawn whole)
      a.x = open.x; a.z = open.z;
      const inOpen = seenOf(s, rp, { fresh: true, cover: true }).cover;
      const gone = paintHitcard({ subject: { kind: 'man', rec: { ...rec, cover: { left: 1, right: 0 } }, person }, rangeM: 4, words: '2A' });
      let goneDiffer = 0; for (let i = 0; i < gone.data.length; i++) if (gone.data[i] !== whole.data[i]) goneDiffer++;
      console.log(`      in the open: ${JSON.stringify(inOpen)}; hidden whole: ${goneDiffer} px off the whole card`);
      assert(rec.cover.left >= 0.5 && J.ok && !inOpen.left && !inOpen.right && goneDiffer === 0 && LOOKS_ENFORCED.has('F121'), JSON.stringify({ cover: rec.cover, J, inOpen, goneDiffer }));
    },
  },
];
