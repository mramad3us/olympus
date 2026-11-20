// The hostage card (v0.0.25's carried round): the user's report of 2026-11-19 with a screenshot of room 3's card ("TO THE HEAD · HEAD",
// "ONE IN THE HEAD. HE WENT DOWN."): "hostage card kind of looks like the hit zone partly covers the hostage's head". The hostage stands
// in front of the hostile and covers 40% of his head circle. On the card his zones are printed only on his own visible pixels, never
// on hers (art/doll/hitcard.js, the jamb's way), on both sides and at every band; in the sim a head round scored on him lands on his
// side of the circle and one scored on her on hers (sim/arms/paper.js hostageHead), so no hole is drawn on her head and called his,
// the spin's shift included. Each case fails without its fix.
// v0.0.28 (the user's note of 2026-11-20 on target-view H: "If the hostage is hit, the shot is a fail."): judged on the card as drawn.
// A head round scored on him is drawn clear of her pixels by its hole and a pixel at every band, both sides, every hold (v0.0.25's
// 2 cm from the circle's centre line put his hole on the edge of her head); a round whose hole touches her is a hit on the hostage
// whatever its grade, and leaves him up; her outline is paper.js's one table, held here to the pixels the card paints.
import { assert } from './helpers.mjs';
import { paintHitcard, onHostage, HIT_BANDS } from '../src/art/doll/hitcard.js';
import { PAPERS, manHole, hostageHead, hostageTouched, hostageEdge, HOSTAGE_HIS_CM, HOSTAGE_HER_CM, HOSTAGE_EDGE_CM, HOSTAGE_CLEAR_CM } from '../src/sim/arms/paper.js';
import { createGame } from './game.mjs';
import { houseShot } from '../src/sim/scenarios/shoothouse.js';
import { HOSTAGE_PLACES } from '../src/art/doll/portrait.js';
import { HOSTAGE_CARDS, HIT_WORDS } from '../samples/target-view/cards.js';

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
        if (g.zone !== 'head' || g.at[0] - Z.at[0] < HOSTAGE_HIS_CM - 1e-9 || Math.hypot(g.at[0] - Z.at[0], g.at[1] - Z.at[1]) > Z.r + 0.1) out.hisOnHer++;
        if (b.at[0] - Z.at[0] > -HOSTAGE_HER_CM + 1e-9) out.hersOnHim++;
        // (as drawn: on the near, mid and far cards, either side (H-b mirrored with its marks), his hole off her pixels, hers on them or the board)
        for (const band of HIT_BANDS) for (const side of ['right', 'left']) { const f = side === 'left' ? -1 : 1; if (onHostage(f * g.at[0], g.at[1], { side, pxPerM: band.pxPerM })) out.hisOnHer++; }
        if (t.at[0] - Z.at[0] < 0) out.threatOnHerSide++;
      }
      // (a spun floor's shift toward her side: put back on his)
      const shifted = hostageHead([Z.at[0] + 2.5 - 6, Z.at[1] + 1], false);
      console.log(`      ${out.his} head rounds scored on him: ${out.hisOnHer} on her (as placed or as drawn at the three bands, both sides); ${out.hers} scored on her: ${out.hersOnHim} on him; a plain threat's head holes on that side ${out.threatOnHerSide} (unchanged); a hole shifted 6 cm onto her put back at ${shifted}`);
      assert(out.hisOnHer === 0 && out.hersOnHim === 0 && out.threatOnHerSide > 100 && shifted[0] - Z.at[0] >= HOSTAGE_HIS_CM, JSON.stringify({ out, shifted }));
    },
  },
  {
    name: 'hostage-card (v0.0.28, the user\'s "If the hostage is hit, the shot is a fail." of 2026-11-20): every head hole scored on the hostile is drawn clear of her pixels by the hole and a pixel, at the near, mid and far bands, both sides, every H pick and gun (red on v0.0.25\'s 2 cm from the circle\'s centre line)',
    fn() {
      const holes = [];
      for (let i = 0; i < 400; i++) holes.push(manHole('hostage', 'head', roll('good'), `c${i}`, 48213).at);
      const rows = [], bad = [];
      for (const b of HIT_BANDS) for (const side of ['right', 'left']) for (const hostage of Object.keys(HOSTAGE_PLACES)) for (const holds of ['pistol', 'rifle']) {
        const c = card({ rangeM: Math.min(b.maxM, 30), subject: { kind: 'board', face: 'hostage', holds, side }, marks: holes.map((at, n) => ({ n: n + 1, hole: at, zone: 'head' })), picks: { hostage }, herMask: true });
        // (each drawn hole's 5 × 5 and a pixel round it, its corners cut as the hole's are: none of it on her)
        let near = 0, minGap = Infinity;
        for (const mk of c.marks.filter(m => m.kind === 'hole')) {
          let on = false;
          for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
            if (Math.abs(i) === 3 && Math.abs(j) === 3) continue;
            const x = mk.x + i, y = mk.y + j;
            if (x >= 0 && y >= 0 && x < c.w && y < c.h && c.her[y * c.w + x]) on = true;
          }
          if (on) near++;
          for (let y = mk.y - 6; y <= mk.y + 6; y++) for (let x = mk.x - 10; x <= mk.x + 10; x++) if (x >= 0 && y >= 0 && x < c.w && y < c.h && c.her[y * c.w + x]) minGap = Math.min(minGap, Math.max(Math.abs(x - mk.x), Math.abs(y - mk.y)) - 3);
        }
        rows.push(`${b.id} ${side} ${hostage} ${holds}: ${near} of ${holes.length} holes within a pixel of her; the nearest ${minGap === Infinity ? 'none in reach' : `${minGap} px past the gap`}`);
        if (near) bad.push(`${b.id} ${side} ${hostage} ${holds}: ${near}`);
      }
      const xs = holes.map(a => a[0] - Z.at[0]);
      console.log(`      his head holes: x from ${Math.min(...xs).toFixed(1)} to ${Math.max(...xs).toFixed(1)} cm (HOSTAGE_HIS_CM ${HOSTAGE_HIS_CM}: her edge ${HOSTAGE_EDGE_CM.map(r => r[2]).join('/')} and the clearance ${HOSTAGE_CLEAR_CM.join(' × ')} cm)`);
      for (const r of rows.filter((r, i) => i % 4 === 0)) console.log(`      ${r}`);
      assert(!bad.length && holes.every(a => Math.hypot(a[0] - Z.at[0], a[1] - Z.at[1]) <= Z.r + 0.1), bad.join('; '));
    },
  },
  {
    name: 'hostage-card (v0.0.28): her outline is paper.js\'s one table: none of her pixels on any card in reach of a head hole lies past HOSTAGE_EDGE_CM, and a hole whose pixels touch hers at any band is hostageTouched (red without the table)',
    fn() {
      const past = [], missed = [];
      let touchDrawn = 0, touchedRule = 0, probes = 0;
      const pts = [];
      for (let x = -8; x <= 8; x += 1) for (let y = -40; y <= -20; y += 1) pts.push([Z.at[0] + x, y]);
      for (const b of HIT_BANDS) for (const side of ['right', 'left']) for (const hostage of Object.keys(HOSTAGE_PLACES)) for (const holds of ['pistol', 'rifle']) {
        const c = card({ rangeM: Math.min(b.maxM, 30), subject: { kind: 'board', face: 'hostage', holds, side }, marks: pts.map((at, n) => ({ n: n + 1, hole: at, zone: 'head' })), picks: { hostage }, herMask: true });
        const drawn = c.marks.filter(m => m.kind === 'hole');
        // (her pixels mapped back to the sim's frame by the card's own map (herAt: the origin, px a cm, H-b's mirror))
        const M = c.herAt;
        for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
          if (!c.her[y * c.w + x]) continue;
          // (her pixel's side toward him, in cm of the sim's frame: H-b's card is mirrored)
          const xr = M.flip === 1 ? (x + 1 - M.x0) / M.pxPerCm : (M.x0 - x) / M.pxPerCm, y0 = (y - M.y0) / M.pxPerCm, y1 = (y + 1 - M.y0) / M.pxPerCm;
          if (Math.max(y0, y1) < -46 || Math.min(y0, y1) > -14) continue;
          if (xr > hostageEdge(Math.min(y0, y1), Math.max(y0, y1)) + 1e-6) past.push(`${b.id} ${side} ${hostage} ${holds} (${x}, ${y}) at ${xr.toFixed(2)} cm`);
        }
        drawn.forEach((mk, n) => {
          probes++;
          let on = false;
          for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { if (Math.abs(i) === 2 && Math.abs(j) === 2) continue; const x = mk.x + i, y = mk.y + j; if (x >= 0 && y >= 0 && x < c.w && y < c.h && c.her[y * c.w + x]) on = true; }
          if (!on) return;
          touchDrawn++;
          if (hostageTouched(pts[n])) touchedRule++; else missed.push(`${b.id} ${side} ${hostage} ${holds} ${pts[n].join(',')}`);
        });
      }
      console.log(`      her pixels past the table: ${past.length}${past.length ? ` (${past.slice(0, 4).join('; ')})` : ''}; ${probes} holes probed, ${touchDrawn} drawn touching her, ${touchedRule} of them hostageTouched${missed.length ? `; missed ${missed.slice(0, 4).join('; ')}` : ''}`);
      assert(!past.length && !missed.length && touchDrawn > 50, JSON.stringify({ past: past.slice(0, 8), missed: missed.slice(0, 8), touchDrawn }));
    },
  },
  {
    name: 'hostage-card (v0.0.28): a head round graded good whose hole touches the hostage is tallied \'hostage\' (the fault, HOSTAGE HIT, the instructor\'s line) and leaves the hostile up; one clear of her drops him (red on v0.0.27\'s houseShot, where the grade alone decided)',
    fn() {
      const at = (hole) => {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'room:3' }), st = g.state, R = st.armoury.range, H = R.house, T = R.turners.find(t => t.face === 'hostage');
        houseShot(st, null, { id: 'hostage-1', fired: true, who: st.player.id, target: T.key, zone: 'head', part: 'head', roll: roll('good'), hole: { at: hole }, atMs: st.clock.ms });
        const legs = [...H.rooms, H.hall], z = legs.reduce((a, L) => a + (L.zones.hostage ?? 0), 0), heads = legs.reduce((a, L) => a + (L.zones.head ?? 0), 0);
        return { z, heads, faults: legs.flatMap(L => L.faults.map(f => f.kind)), up: T.stoppedAtMs === null, stand: T.stand };
      };
      const on = at([Z.at[0] - 1, Z.at[1]]), clear = at([Z.at[0] + HOSTAGE_HIS_CM + 1, Z.at[1]]);
      console.log(`      a good head round on her (${Z.at[0] - 1}, ${Z.at[1]}): hostage ${on.z}, head ${on.heads}, faults ${on.faults.join(', ') || 'none'}, ${on.stand} ${on.up ? 'up' : 'down'}; clear of her (${Z.at[0] + HOSTAGE_HIS_CM + 1}): hostage ${clear.z}, head ${clear.heads}, ${clear.up ? 'up' : 'down'}`);
      assert(on.z === 1 && on.heads === 0 && on.faults.includes('hostage') && on.up, JSON.stringify(on));
      assert(clear.z === 0 && clear.heads === 1 && !clear.up, JSON.stringify(clear));
    },
  },
  {
    name: 'hostage-card, the review of the picks (finding 4): "judged on the card as drawn" at every band: a head hole the game scores on her (hostageHead on her side) is drawn on her (her pixels, or his forearm and gun drawn over her, which a round goes through into her) and hostageTouched, one it scores on him is drawn clear of her and not, at the near, mid and far bands, both sides; and the target-view sample\'s truth cards (samples/target-view/cards.js, at its 4 m) say HOSTAGE HIT exactly where the hole is drawn on her (red on the review\'s build: its third card\'s hole [2.2, -29.1], no hole the game places, stood 4 card px clear of her under HOSTAGE HIT)',
    fn() {
      // (a hole drawn on her: any of its pixels (the 5 × 5, its corners cut) on hers, or on his arm or gun over her (herBehind))
      const drawnOn = (c, under = true) => c.marks.filter(m => m.kind === 'hole').map(mk => { for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { if (Math.abs(i) === 2 && Math.abs(j) === 2) continue; const x = mk.x + i, y = mk.y + j, k = y * c.w + x; if (x >= 0 && y >= 0 && x < c.w && y < c.h && (c.her[k] || (under && c.herBehind?.[k]))) return true; } return false; });
      const bad = [], tally = { hers: 0, hersOn: 0, hersBare: 0, his: 0, hisOn: 0 };
      for (let i = 0; i < 120; i++) {
        const hers = manHole('hostage', 'head', roll('bad'), `r${i}`, 48213).at, his = manHole('hostage', 'head', roll('good'), `r${i}`, 48213).at;
        for (const b of HIT_BANDS) for (const side of ['right', 'left']) {
          const c = card({ rangeM: Math.min(b.maxM, 30), subject: { kind: 'board', face: 'hostage', holds: 'pistol', side }, marks: [{ n: 1, hole: hers, zone: 'head' }, { n: 2, hole: his, zone: 'head' }], herMask: true });
          const [a, d] = drawnOn(c);
          tally.hers++; tally.his++; if (a) tally.hersOn++; if (d) tally.hisOn++; if (drawnOn(c, false)[0]) tally.hersBare++;
          if (!a || !hostageTouched(hers) || d || hostageTouched(his)) bad.push(`${b.id} ${side} hers ${hers} drawn on ${a}, his ${his} drawn on ${d}`);
        }
      }
      const sample = HOSTAGE_CARDS.filter(([phase, hole]) => phase === 'truth' && hole).map(([, hole, words]) => {
        const c = card({ rangeM: 4, subject: { kind: 'board', face: 'hostage', holds: 'pistol', side: 'right' }, marks: [{ n: 1, hole, zone: 'head' }], herMask: true });
        return { hole, words, hit: words === HIT_WORDS, drawnOn: drawnOn(c)[0], touched: hostageTouched(hole) };
      });
      console.log(`      the game's holes at the three bands, both sides: scored on her ${tally.hersOn} of ${tally.hers} drawn on her (${tally.hersBare} on her own pixels, the rest on his forearm across her), scored on him ${tally.hisOn} of ${tally.his} drawn on her`);
      for (const r of sample) console.log(`      the sample's ${r.words}: the hole ${r.hole.join(', ')} drawn on her ${r.drawnOn}, hostageTouched ${r.touched}`);
      assert(!bad.length && sample.length === 2 && sample.every(r => r.hit === r.drawnOn && r.hit === r.touched), JSON.stringify({ bad: bad.slice(0, 6), sample }));
    },
  },
];
