// OLYMPUS tests: what a no-stop zone is, and a leafless doorway declared one (the build sheet v0.0.22 item 13, §6 A, F77; house lens G2; PLACES §1.6).
//
// A zone carries its why (places/zones.js ZONE_WHYS: 'door' a leafed door's funnel, 'doorway' a leafless gap a layout declares, 'leaf'
// an arc, and 'hatch', 'stairhead' and 'crossing' the rects a place declares) beside its shape. The twin room's 1.2 m inner doorway is
// declared a funnel by its chunk (chunks/x4.js noStop), placed by the assembler with the room and read by zonesOf; a leafless gap wider
// than FUNNEL_GAP_MAX_M 1.5 m (the ell's 2.6 m leg) stays floor. Held here, on layout B (the twin as room 3): the zones by why; the
// doorway live whatever (no leaf to close); a body walking through it whose brake would leave it inside is carried through to a place
// clear of every live zone (move.js throughOf), and one at rest in it carried out (rest: the feet the game's); a body knelt in it is
// left (a stance, a step that stands still by choice: zones.js standsStill); a hatch's rect (a synthetic one) is left along the heading
// to a place clear of it. It fails without the declared list (no doorway funnel: nobody carried out of the doorway).
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { zonesOf, liveZoneAt, inZone, exitOf, standsStill, ZONE_WHYS, FUNNEL_GAP_MAX_M } from '../src/sim/places/zones.js';
import { throughOf } from '../src/sim/places/move.js';
import { openingOf } from '../src/sim/places/model.js';

export default [
  {
    name: 'the twin room\'s inner doorway is a no-stop funnel (why \'doorway\'), live with no leaf; a body walking through it or at rest in it is carried clear of every zone, a body knelt in it left; the ell\'s 2.6 m leg stays floor; a hatch\'s rect is left along the heading',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', layout: 'B' }), s = g.state, area = s.places.live.area, pid = s.player.id;
      const Zs = zonesOf(area), why = Zs.reduce((o, Z) => ({ ...o, [Z.why]: (o[Z.why] ?? 0) + 1 }), {}), D = Zs.find(Z => Z.why === 'doorway'), o = D ? openingOf(D.door) : null;
      const bad = [];
      if (!D) bad.push('no doorway funnel');
      if (Zs.some(Z => !ZONE_WHYS.includes(Z.why))) bad.push(`a zone of no why: ${Zs.filter(Z => !ZONE_WHYS.includes(Z.why)).map(Z => Z.id)}`);
      let walked = null, rested = null, knelt = null, mid = null;
      if (D) {
        mid = [(o.a + o.b) / 2, o.at];
        const a = s.actors.list.find(x => x.who === pid);
        // (walking north through it at 1.5 m/s: the brake (about 0.4 m) leaves the body inside the funnel's 0.5 m)
        Object.assign(a, { x: mid[0], z: mid[1] + 0.15, v: [0, -1.5], moveStance: 'combat', stance: null });
        if (!liveZoneAt(s, area, a.x, a.z)) bad.push('the doorway not live');
        const t = throughOf(s, pid, a), e = t?.path?.at(-1) ?? null;
        walked = e ? { end: e, clear: !liveZoneAt(s, area, e[0], e[1]), past: o.at - e[1] } : null;
        if (!walked?.clear || walked.past <= 0) bad.push(`walked through: ${JSON.stringify(walked)}`);
        // (at rest in it, the feet the game's)
        Object.assign(a, { x: mid[0], z: mid[1] - 0.1, v: [0, 0] });
        const r = throughOf(s, pid, a, s.clock.ms, { rest: true }), re = r?.path?.at(-1) ?? null;
        rested = re ? { end: re, clear: !liveZoneAt(s, area, re[0], re[1]) } : null;
        if (!rested?.clear) bad.push(`at rest: ${JSON.stringify(rested)}`);
        // (knelt in it: a stance the player chose, left where he is)
        Object.assign(a, { stance: 'kneel' });
        knelt = throughOf(s, pid, a, s.clock.ms, { rest: true });
        if (knelt) bad.push('a body knelt in the doorway was carried');
        a.stance = null;
      }
      // (the ell's leg (layout C's room 3) is floor: a 2.6 m gap, wider than FUNNEL_GAP_MAX_M)
      const gC = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', layout: 'C' }), ell = zonesOf(gC.state.places.live.area).filter(Z => Z.why === 'doorway');
      if (ell.length) bad.push(`layout C has doorway funnels ${ell.map(Z => Z.id)}`);
      // (a hatch: a synthetic rect, left along the heading to EXIT_M past it)
      const hatch = { id: 'hatch:test', kind: 'rect', rect: [10, 10, 11, 11], why: 'hatch' }, out = exitOf(hatch, [10.5, 10.5], [1, 0]);
      if (inZone(hatch, out[0], out[1]) || out[0] <= 11) bad.push(`the hatch left at ${JSON.stringify(out)}`);
      const chosen = ['contact:hold', 'contact:challenge', 'weapon:gun-down', 'stance:kneel', 'shot:pair@stop'].every(standsStill) && !['move:far', 'move:point', 'leave'].some(standsStill);
      if (!chosen) bad.push('standsStill');
      console.log(`      layout B's zones by why ${JSON.stringify(why)} (the doorway ${D?.id}, ${o ? fmt(o.b - o.a, 2) : '-'} m against ${FUNNEL_GAP_MAX_M}); walked through: carried to ${JSON.stringify(walked?.end)}, ${fmt(walked?.past ?? NaN, 2)} m past its line, clear ${walked?.clear}; at rest: carried to ${JSON.stringify(rested?.end)}, clear ${rested?.clear}; knelt: left ${!knelt}; layout C's doorway funnels ${ell.length}; the hatch left at ${JSON.stringify(out)}; the chosen steps read ${chosen}`);
      assert(!bad.length, bad.join(' | '));
    },
  },
];
