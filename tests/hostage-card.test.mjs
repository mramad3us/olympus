// The hostage card (v0.0.25's carried round): the user's report of 2026-11-19 with a screenshot of room 3's card ("TO THE HEAD · HEAD",
// "ONE IN THE HEAD. HE WENT DOWN."): "hostage card kind of looks like the hit zone partly covers the hostage's head". The hostage stands
// in front of the hostile and covers 40% of his head circle. On the card his zones are printed only on his own visible pixels, never
// on hers (art/doll/hitcard.js, the jamb's way), on both sides and at every band; in the sim a head round scored on him lands on his
// side of the circle and one scored on her on hers (sim/arms/paper.js hostageHead), so no hole is drawn on her head and called his,
// the spin's shift included. Each case fails without its fix.
import { assert } from './helpers.mjs';
import { paintHitcard, onHostage, HIT_BANDS } from '../src/art/doll/hitcard.js';
import { PAPERS, manHole, hostageHead, HOSTAGE_CLEAR_CM } from '../src/sim/arms/paper.js';
import { HOSTAGE_PLACES } from '../src/art/doll/portrait.js';

const Z = PAPERS.man.zones.head;
const card = (o) => paintHitcard({ phase: 'truth', man: PAPERS.man, words: 'X', ...o });
// (a head roll: ok, the grade given)
const roll = (g) => ({ ok: true, margin: g === 'bad' ? -7 : 6, nat: 10, grade: g });

export default [
  {
    name: 'hostage-card: the hostile\'s zones (the A box, the torso box, the head circle) are printed on none of the hostage\'s pixels, both sides, both H picks, every band (they were printed over her head and body)',
    fn() {
      const rows = [], bad = [];
      for (const b of HIT_BANDS) for (const side of ['right', 'left']) for (const hostage of Object.keys(HOSTAGE_PLACES)) for (const holds of ['pistol', 'rifle']) {
        const c = card({ rangeM: Math.min(b.maxM, 30), subject: { kind: 'board', face: 'hostage', holds, side }, marks: [], picks: { hostage } });
        // (her pixels on the card, read from the sim's frame: every card pixel of the zones' boxes and circle mapped back is off her)
        rows.push(`${b.id} ${side} ${hostage} ${holds}: ${c.zonesOffHim} zone px held off her or the board`);
        if (!(c.zonesOffHim > 0)) bad.push(`${b.id} ${side} ${hostage} ${holds}: no zone px held back`);
      }
      // (the pixels themselves: every pixel the zones change (the card with them against the card without) is off her pixels, both sides,
      // and before the fix some were on her)
      for (const side of ['right', 'left']) for (const hostage of Object.keys(HOSTAGE_PLACES)) {
        const o = { words: 'X', subject: { kind: 'board', face: 'hostage', holds: 'pistol', side }, marks: [], picks: { hostage }, herMask: true };
        const a = paintHitcard({ phase: 'truth', man: PAPERS.man, ...o }), n = paintHitcard({ phase: 'truth', man: null, ...o });
        let zone = 0, onHer = 0, herPx = 0;
        for (let i = 0; i < a.data.length; i++) { if (a.her[i]) herPx++; if (a.data[i] === n.data[i]) continue; zone++; if (a.her[i]) onHer++; }
        rows.push(`near ${side} ${hostage}: her ${herPx} px; the zones' ${zone} px, on her ${onHer}`);
        if (onHer || !zone || !herPx) bad.push(`near ${side} ${hostage}: ${onHer} zone px on her`);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'hostage-card: a head round scored on the hostile lands on his visible head, never where her head stands (40% of his circle), one scored on her on hers; the spin\'s shift keeps it there; both sides drawn so',
    fn() {
      const out = { his: 0, hisOnHer: 0, hers: 0, hersOnHim: 0, threatOnHerSide: 0 };
      for (let i = 0; i < 400; i++) {
        const g = manHole('hostage', 'head', roll('good'), `s${i}`, 48213), b = manHole('hostage', 'head', roll('bad'), `s${i}`, 48213), t = manHole('threat', 'head', roll('good'), `s${i}`, 48213);
        out.his++; out.hers++;
        if (g.zone !== 'head' || g.at[0] - Z.at[0] < HOSTAGE_CLEAR_CM - 1e-9 || Math.hypot(g.at[0] - Z.at[0], g.at[1] - Z.at[1]) > Z.r + 0.1) out.hisOnHer++;
        if (b.at[0] - Z.at[0] > -HOSTAGE_CLEAR_CM + 1e-9) out.hersOnHim++;
        // (as drawn: on the near, mid and far cards, either side (H-b mirrored with its marks), his hole off her pixels, hers on them or the board)
        for (const band of HIT_BANDS) for (const side of ['right', 'left']) { const f = side === 'left' ? -1 : 1; if (onHostage(f * g.at[0], g.at[1], { side, pxPerM: band.pxPerM })) out.hisOnHer++; }
        if (t.at[0] - Z.at[0] < 0) out.threatOnHerSide++;
      }
      // (a spun floor's shift toward her side: put back on his)
      const shifted = hostageHead([Z.at[0] + 2.5 - 6, Z.at[1] + 1], false);
      console.log(`      ${out.his} head rounds scored on him: ${out.hisOnHer} on her (as placed or as drawn at the three bands, both sides); ${out.hers} scored on her: ${out.hersOnHim} on him; a plain threat's head holes on that side ${out.threatOnHerSide} (unchanged); a hole shifted 6 cm onto her put back at ${shifted}`);
      assert(out.hisOnHer === 0 && out.hersOnHim === 0 && out.threatOnHerSide > 100 && shifted[0] - Z.at[0] >= HOSTAGE_CLEAR_CM, JSON.stringify({ out, shifted }));
    },
  },
];
