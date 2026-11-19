// The target view by distance (v0.0.25's carried round; the user's word of 2026-11-19 on the picks, "just pick what you will, I'll revise
// what I find weird in game, use what makes sense again depending on distance"; my call, overrulable): a man's card's ground chosen by
// the range to him, by the card's band (art/doll/hitcard.js MAN_GROUND_BY_BAND over HIT_BANDS' metres): the dark (L-a) near and mid,
// the lifted ground (L-b) far; a pick on the To score page wins. Fails without it (every range the dark).
import { assert } from './helpers.mjs';
import { paintHitcard, HIT_BANDS, MAN_GROUND_BY_BAND } from '../src/art/doll/hitcard.js';

const TWO = { outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: null, thigh: null, held: null, painted: false };
const card = (rangeM, picks = null) => paintHitcard({ look: 'B', man: null, phase: 'belief', marks: [], words: 'X', line: null, tabs: [], rangeM, ...(picks ? { picks } : {}), subject: { kind: 'man', key: 'two', gear: TWO, person: { look: { skin: 'brown', hair: { style: 'highTight', color: 'black' } }, sex: 'm' } } });

export default [
  {
    name: 'target-distance: a man\'s card\'s ground by the range to him: the dark near (to 10 m) and mid (to 25 m), lifted far; the To score page\'s pick wins at any range',
    fn() {
      const rows = [5, 10, 14, 25, 40, 80].map(m => { const c = card(m); return { m, band: c.band, ground: c.ground }; });
      const picked = card(40, { ground: 'L-a' }).ground;
      console.log(`      the bands ${HIT_BANDS.map(b => `${b.id} ${Number.isFinite(b.maxM) ? `to ${b.maxM} m` : "beyond"}`).join(', ')}; the grounds ${JSON.stringify(MAN_GROUND_BY_BAND)}`);
      console.log(`      ${rows.map(r => `${r.m} m ${r.band} ${r.ground}`).join(', ')}; at 40 m with L-a picked: ${picked}`);
      assert(rows.every(r => r.ground === (r.m > 25 ? 'lifted' : 'dark')) && picked === 'dark', JSON.stringify({ rows, picked }));
    },
  },
];
