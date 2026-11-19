// OLYMPUS tests: a man turned as you see him, and the marks on his plane (the build sheet v0.0.24 item 15, its F117 read as F120; P§3.2 rule 4).
//
// The user, 2026-11-17: "the portraits need to be more dynamic and show us what we would be seeing". v0.0.23 drew the facing at its
// defaults (F1 from behind, F3 side on with the head turned) behind PORTRAIT_FACING; this round applies the pick (PORTRAIT_PICKS.back,
// .side: F1 and F3 until the user scores portrait-facing, F2 the profile only on its pick) and puts the marks where they land on
// the man-target's plane: side on, at the cosine of his yaw from the figure's middle (a board turned 67.5° from you shows 38% of its
// width), front on and from behind where the front card puts them. On the live lane's 2a at 4 m: a man turned 150° from your eye
// is drawn from behind, 90° and 60° side on, 30° front on; his paint at the cosine. Without the change the side card's marks sat at
// the front card's columns (yawK 1) and a side pick was never read. Prints each facing's doll and the marks' worst offset.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { seenOf, seenKey } from '../src/sim/people/seen.js';
import { paintPortrait, PORTRAIT_PICKS } from '../src/art/doll/portrait.js';
import { paintHitcard } from '../src/art/doll/hitcard.js';
import { facingDrawn, marksOnPlane, LOOKS_ENFORCED } from './flawless-looks.mjs';

const live = () => createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', opfor: 'live:fight,hide', setup: 'go' });
const actorOf = (s, who) => s.actors.list.find(a => a.who === who);
const MARKS = [{ n: 1, shotId: 'a', called: [-8, 4], seen: true, hole: [-8, 4], zone: 'A', part: 'torso', paint: 'team' }, { n: 2, shotId: 'b', called: [12, -6], seen: true, hole: [12, -6], zone: 'A', part: 'torso', paint: 'team' }, { n: 3, shotId: 'c', called: [2, -28], seen: true, hole: [2, -28], zone: 'head', part: 'head', paint: 'team' }];

export default [
  {
    name: 'F120 a man turned is drawn as scored: 150° from your eye from behind (F1), 90° and 60° side on (F3, the head turned), 30° front on; F2 the profile only on its pick; the paint on his plane at the cosine of his yaw side on, where the front card puts it from behind',
    fn() {
      const g = live(), s = g.state, me = actorOf(s, s.player.id), rp = s.armoury.range.turners.find(T => T.live).live.who, a = actorOf(s, rp);
      a.x = me.x + 4; a.z = me.z;
      const person = { look: s.people[rp].look, sex: s.people[rp].sex };
      const at = (deg) => { a.headRad = Math.PI + deg * Math.PI / 180; return seenOf(s, rp, { fresh: true }); };
      const card = (rec, picks = null) => paintHitcard({ subject: { kind: 'man', rec, person }, rangeM: 4, phase: 'truth', marks: MARKS, words: 'CHECK', ...(picks ? { picks } : {}) });
      const front = at(0), fc = card(front);
      const midX = fc.anchors.aZone[0];
      const rows = [], bad = [];
      for (const deg of [0, 30, -30, 60, 90, -90, 120, 150, -150, 180]) {
        const rec = at(deg), P = paintPortrait(rec, person, { pxPerM: 96 }), f = facingDrawn(rec, P.pm, PORTRAIT_PICKS), c = card(rec);
        const side = rec.facing === 'left' || rec.facing === 'right', m = marksOnPlane(fc.marks, c.marks, side ? rec.yawQ : 0, midX);
        rows.push(`${deg}° ${rec.facing} drawn ${f.got} yawQ ${rec.yawQ.toFixed(3)} marks ×${m.k} worst ${m.worst} px`);
        if (!f.ok) bad.push(`${deg}°: drawn ${f.got}, the pick says ${f.want}`);
        if (!m.ok) bad.push(`${deg}°: the marks ${m.worst} px off the plane (×${m.k})`);
        if (side && c.yawK >= 0.999) bad.push(`${deg}°: side on, the plane not foreshortened`);
      }
      for (const r of rows) console.log(`      ${r}`);
      // (the profile only on F2's pick; F3 the head turned)
      const side90 = at(90), f2 = paintPortrait(side90, person, { pxPerM: 96, picks: { side: 'F2' } }), f3 = paintPortrait(side90, person, { pxPerM: 96 });
      console.log(`      90° on F2: ${f2.pm.pose.facing}, on F3 (the default): ${f3.pm.pose.facing}; the yaw in the key side on only: ${seenKey(side90).split('|').at(-1)} / front ${seenKey(front).split('|').at(-1) || '(none)'}`);
      assert(f2.pm.pose.facing === 'profile' && f3.pm.pose.facing === 'left' && seenKey(side90).split('|').at(-1) !== '' && seenKey(front).split('|').at(-1) === '', 'F2 on its pick, F3 by default; the yaw keyed side on only');
      assert(!bad.length && LOOKS_ENFORCED.has('F120'), bad.join('; '));
    },
  },
];
