// OLYMPUS tests: the portrait cards redrawn on the user's picks of 2026-11-20 (v0.0.28, the picks' CARDS: C1 to C6).
//
// The user, 2026-11-20, of the portrait cards: "I need you to be serious about this ... please, make an effort for quality"; of the
// guns, "For the cards with gun pointed, we need the gun held to be like soldiers hold a gun, aiming through ironsights" and "Those
// are terrible, more efforts on the gun wielding cards"; of a man side on, "low effort and terrible"; of the hands not read, "should
// not show any hint as to what is behind"; of the man down, "Needs way more polish". Each card's geometry is asserted here, not its
// hash alone, at the near, mid and far bands, and each is red on the drawing it replaces (the old pick drawn through the same code):
//   C1 the aimed holds (A3, P3): the sight within a pixel and a half of the eye's row, the gun's pixels spanning a share of its
//      length, both fists on the gun (A1's ring at the chest and P1's slide at the belly fail);
//   C2 the true profile (F4): the head's silhouette asymmetric about the head's middle (the face ahead, the skull behind), the rifle
//      side on at its length (F3's head turned and F2's squeezed front are symmetric, their rifle foreshortened);
//   C3 the hostage card's hostile (H1): his forearm across her upper chest, his pistol's muzzle at her head's edge, none of it hers
//      (v0.0.27's H1, H0 here, had neither);
//   C4 the hands not read (V3): a rifle aimed, a P-12 aimed and empty hands, each unread, pixel for pixel the same from the line down,
//      the line one row for every pose (V1 drew the gun);
//   C5 sitting (D3): his height under 0.65 of the standing man's, the boots on the floor, the hands open on the rifle and off its grip;
//   C6 the P-12's high ready: its pixels span 0.95 of its side length on the upper chest (v0.0.27's spanned 0.8 at the belly).
// Prints the numbers.
import { assert } from './helpers.mjs';
import { paintPortrait, PORTRAIT_PICKS } from '../src/art/doll/portrait.js';
import { paintHitcard, figGeom, HIT_BANDS, unreadLine, UNREAD_ROW } from '../src/art/doll/hitcard.js';
import { dressedDoll } from '../src/art/doll/dress.js';
import { PAPERS } from '../src/sim/arms/paper.js';
import { RP, RP_PISTOL, RP_PERSON, ME, ME_PISTOL, ME_PERSON, recOf } from '../samples/portrait-lib/posed.js';
import { HIT_C } from '../src/art/doll/hitcard.js';
import { subjectOf } from '../samples/truth-cards/truth.js';
import { readFileSync } from 'node:fs';
import { doll } from '../src/art/doll/doll.js';
import { dressOf } from '../src/art/doll/dress.js';
import { boardGear, boardLook } from '../src/art/doll/portrait.js';
import { PRINT_FILL } from '../src/art/doll/held.js';
import { word } from '../src/art/paint.js';
import { root } from './helpers.mjs';

const SCALES = HIT_BANDS.map(b => [b.id, figGeom(b.pxPerM).scale]);
const RIFLE_PX = (S) => 85 * 0.72 * S, P12_PX = (S) => 19.5 * 0.72 * S;
const portrait = (rec, S, picks = null) => paintPortrait(rec, RP_PERSON, { scale: S, ...(picks ? { picks } : {}) }).pm;
/** The held pixels of a doll: their count, their box and the box's diagonal. */
function heldBox(pm) {
  let n = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1, sy = 0;
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) if (pm.held[y * pm.w + x]) { n++; sy += y; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { n, x0, y0, x1, y1, span: n ? Math.hypot(x1 - x0 + 1, y1 - y0 + 1) : 0, meanY: n ? sy / n : 0 };
}
/** Whether the held pixels come within r px of a point. */
const heldNear = (pm, [cx, cy], r) => { for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(pm.h - 1, Math.ceil(cy + r)); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(pm.w - 1, Math.ceil(cx + r)); x++) if (pm.held[y * pm.w + x] && Math.hypot(x - cx, y - cy) <= r) return true; return false; };

/** C1's gauge on one doll: { ok, sightOff (px), span (share of the gun's length), fists (both on it) }. */
function aimed(pm, S, lenPx) {
  const st = pm.stations, b = heldBox(pm);
  if (!st?.eye || !st?.sight) return { ok: false, why: 'no sight at an eye', span: +(b.span / lenPx).toFixed(2) };
  const sightOff = Math.abs(st.sight[1] - st.eye[1]), span = b.span / lenPx, fists = (st.fists ?? []).filter(f => heldNear(pm, f, 4 * S)).length;
  return { ok: sightOff <= 1.5 * S && fists === 2, sightOff: +(sightOff / S).toFixed(2), span: +span.toFixed(2), fists };
}

export default [
  {
    name: 'C1 a gun pointed at you is held as a soldier aims (the user, 2026-11-20: "aiming through ironsights"): A3 and P3 at every band put the sight within a pixel and a half of the eye\'s row and both fists on the gun; A1\'s ring at the chest and P1\'s slide at the belly do not',
    fn() {
      const rows = [], bad = [];
      const cases = [['A3', recOf(RP, { hold: { how: 'rifle-aim' }, aimAt: 'you' }), RIFLE_PX, { aim: 'A3' }], ['P3', recOf(RP_PISTOL, { hold: { how: 'pistol-aim' }, aimAt: 'you' }), P12_PX, { pistol: 'P3' }],
        ['K1 (A3 kneeling)', recOf(RP, { pose: 'kneel', hold: { how: 'rifle-aim' }, aimAt: 'you' }), RIFLE_PX, { aim: 'A3' }]];
      for (const [id, rec, len, picks] of cases) for (const [band, S] of SCALES) {
        const r = aimed(portrait(rec, S, picks), S, len(S));
        rows.push(`${id} ${band}: sight ${r.sightOff} ref px off the eye, the gun ${r.span} of its length across, ${r.fists} fists on it`);
        if (!r.ok) bad.push({ id, band, ...r });
      }
      // (the old holds through the same code: red)
      const old = [['A1', recOf(RP, { hold: { how: 'rifle-aim' }, aimAt: 'you' }), RIFLE_PX, { aim: 'A1' }], ['A2', recOf(RP, { hold: { how: 'rifle-aim', place: 'aimAway' }, aimAt: 'away' }), RIFLE_PX, { aim: 'A2' }], ['P1', recOf(RP_PISTOL, { hold: { how: 'pistol-aim' }, aimAt: 'you' }), P12_PX, { pistol: 'P1' }]];
      for (const [id, rec, len, picks] of old) { const S = SCALES[0][1], r = aimed(portrait(rec, S, picks), S, len(S)); rows.push(`${id} (v0.0.27's) near: ${r.ok ? 'passes' : `fails (${r.why ?? `sight ${r.sightOff}`})`}`); if (r.ok) bad.push({ id, oldPasses: true }); }
      for (const r of rows) console.log(`      ${r}`);
      assert(PORTRAIT_PICKS.aim === 'A3' && PORTRAIT_PICKS.pistol === 'P3' && !bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'C2 a man side on is a true profile (the user, 2026-11-20: "low effort and terrible"): F4\'s head is asymmetric about its middle (the face ahead, the skull behind), his eye ahead and the back of his head his hair, either way he faces, and his rifle side on spans its length; F3\'s turned head and F2\'s squeezed front are front faces, their rifle foreshortened',
    fn() {
      const rows = [], bad = [];
      // (the head's silhouette against its mirror about the head's anchor, from the brow to the chin: a front view (F3's turned head,
      // F2's squeezed front) is near its mirror, a profile (the face ahead, the skull and the ear behind) is not)
      const mirror = (pm) => {
        const [hx, hy] = pm.anchors.head, S = pm.scale, on = (x, y) => x >= 0 && x < pm.w && pm.data[y * pm.w + x] !== pm.data[0];
        let n = 0, off = 0;
        for (let y = Math.round(hy - 4 * S); y <= Math.round(hy + 8 * S); y++) for (let dx = 0; dx <= Math.round(12 * S); dx++) { const a = on(Math.round(hx + dx), y), b = on(Math.round(hx - dx), y); if (a || b) { n++; if (a !== b) off++; } }
        return off / Math.max(1, n);
      };
      // (and, the judge's pass of 2026-11-20 ("he reads bald ... no face"): his one eye ahead of the head's middle toward his facing, and
      // the crown over the back of his head his hair's dark, as the front card's cut, not skin)
      const dark = (c) => { const r = c & 0xff, gg = (c >>> 8) & 0xff, b = (c >>> 16) & 0xff; return 0.3 * r + 0.59 * gg + 0.11 * b < 70; };
      const backHair = (pm, dir) => {
        const [hx, hy] = pm.anchors.head, S = pm.scale;
        let n = 0, d = 0;
        for (let y = Math.round(hy - 12 * S); y <= Math.round(hy - 8 * S); y++) for (let x = Math.round(hx - dir * 6 * S); dir > 0 ? x <= Math.round(hx - dir * 1 * S) : x >= Math.round(hx - dir * 1 * S); x += dir) { const c = pm.data[y * pm.w + x]; if (c === pm.data[0]) continue; n++; if (dark(c)) d++; }
        return n ? d / n : 0;
      };
      for (const [side, facing] of [['F4', 'right'], ['F4', 'left'], ['F3', 'right'], ['F2', 'right']]) for (const [band, S] of SCALES) {
        const rec = recOf(RP, { facing, hold: { how: 'rifle-low' } }), pm = portrait(side === 'F2' ? { ...rec, facing: 'profile' } : rec, S, { side }), asym = mirror(pm), b = heldBox(pm);
        const dir = facing === 'left' ? -1 : 1, eyeAhead = pm.side?.eye ? dir * (pm.side.eye[0] - pm.anchors.head[0]) / S : 0, hair = backHair(pm, dir);
        const span = b.span / RIFLE_PX(S), ok = asym >= 0.2 && span >= 0.85 && eyeAhead >= 4 && hair >= 0.5;
        rows.push(`${side} facing ${facing} ${band}: the head's silhouette ${(asym * 100).toFixed(0)}% off its mirror, his eye ${eyeAhead.toFixed(1)} ref px ahead of its middle, the crown ${(hair * 100).toFixed(0)}% hair, the rifle ${span.toFixed(2)} of its length`);
        if ((side === 'F4') !== ok) bad.push({ side, facing, band, asym, span, eyeAhead, hair });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(PORTRAIT_PICKS.side === 'F4' && !bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'C3 the hostage card\'s hostile (the user, 2026-11-20: "more efforts on the gun wielding cards"): at every band his forearm crosses her upper chest, his P-12 reaches her head\'s edge and none of his gun is drawn as hers; v0.0.27\'s H1 (H0) had no arm across her',
    fn() {
      const rows = [], bad = [];
      for (const h of ['H1', 'H0']) for (const b of HIT_BANDS) {
        const c = paintHitcard({ subject: { kind: 'board', face: 'hostage', holds: 'pistol' }, man: PAPERS.man, rangeM: b.maxM === Infinity ? 30 : b.maxM - 1, picks: { hostage: h }, herMask: true, words: 'CHECK' });
        // (her chest's rows: her pixels' box from a third down to half way; his pixels inside her box there, the forearm across)
        let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
        for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) if (c.her[y * c.w + x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        const top = Math.round(y0 + (y1 - y0) * 0.22), foot = Math.round(y0 + (y1 - y0) * 0.45);
        let across = 0;
        for (let y = top; y <= foot; y++) {
          // (inside her own span on the row: his pixels there lie over her, the forearm across)
          let l = -1, r = -1; for (let x = 0; x < c.w; x++) if (c.her[y * c.w + x]) { if (l < 0) l = x; r = x; }
          let run = 0; for (let x = l + 3; x < r - 3; x++) { const his = !c.her[y * c.w + x]; run = his ? run + 1 : 0; across = Math.max(across, run); }
        }
        void x0; void x1;
        const k = b.pxPerM / 96, ok = across >= 10 * k && c.gun.toned >= 8 * k;
        rows.push(`${h} ${b.id}: his widest run across her chest ${across} px, his gun's pixels ${c.gun.toned}`);
        if ((h === 'H1') !== ok) bad.push({ h, band: b.id, across, gun: c.gun.toned });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(PORTRAIT_PICKS.hostage === 'H1' && !bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'C4 his hands not read show no hint (the user, 2026-11-20: "should not show any hint as to what is behind"): V3\'s cards of a rifle aimed, a P-12 aimed and empty hands are the same pixel for pixel from the line down at every band, the line one row for every pose; V1\'s are not',
    fn() {
      const rows = [], bad = [], men = [recOf(RP, { hold: { how: 'rifle-aim' }, aimAt: 'you' }), recOf(RP_PISTOL, { hold: { how: 'pistol-aim' }, aimAt: 'you' }), recOf({ ...RP, rifle: null }, { hold: { how: 'empty' } }), recOf(RP, { pose: 'kneel', hold: { how: 'rifle-low' } })];
      for (const v of ['V3', 'V1']) for (const b of HIT_BANDS) {
        const r = b.maxM === Infinity ? 30 : b.maxM - 1, cards = men.map(rec => paintHitcard({ subject: { kind: 'man', rec, person: RP_PERSON }, rangeM: r, words: 'HANDS NOT SEEN', picks: { unread: v }, live: { holds: 'unseen' } }));
        const line = unreadLine(b.pxPerM), figH = cards[0].h - cards[0].words.h;
        let differ = 0;
        for (const c of cards.slice(1)) for (let y = line; y < figH; y++) for (let x = 0; x < c.w; x++) if (c.data[y * c.w + x] !== cards[0].data[y * c.w + x]) differ++;
        const lines = new Set(cards.map(c => c.hidden?.line ?? -1));
        rows.push(`${v} ${b.id}: the line at card row ${line} (UNREAD_ROW ${UNREAD_ROW}), ${differ} px differ under it across the four, lines ${[...lines].join(',')}`);
        const ok = differ === 0 && lines.size === 1 && lines.has(line);
        if ((v === 'V3') !== ok) bad.push({ v, band: b.id, differ, lines: [...lines] });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(PORTRAIT_PICKS.unread === 'V3' && !bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'C5 a man down sits where he is (the user, 2026-11-20: "Needs way more polish"): D3 at every band is under 0.65 of the standing man\'s height, his boots on the floor, one hand open on the rifle and the other slid off it, neither on its grip (the judge\'s pass of 2026-11-20); v0.0.27\'s D1 has no such hands',
    fn() {
      const rows = [], bad = [], extent = (pm) => { let y0 = Infinity, y1 = -1; for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) if (pm.data[y * pm.w + x] !== pm.data[0] && pm.data[y * pm.w + x] !== pm.data[(pm.h - 1) * pm.w]) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [y0, y1]; };
      for (const d of ['D3', 'D1']) for (const [band, S] of SCALES) {
        const sit = portrait(recOf(RP, { pose: 'sit', hold: { how: 'rifle-low' } }), S, { down: d }), stand = dressedDoll(RP, RP_PERSON, S, null);
        const [a0, a1] = extent(sit), [b0, b1] = extent(stand), k = (a1 - a0) / (b1 - b0), st = sit.stations;
        // (the judge's pass of 2026-11-20: his right hand open on the rifle, his left slid off it onto his thigh; neither on the grip)
        const near = (h) => heldNear(sit, h, 3.2 * S), onGun = st?.onGun ? st.onGun.filter(near).length : 0, offGun = st?.offGun ? st.offGun.filter(h => !near(h)).length : 0;
        const offGrip = st?.hands && st.grip ? st.hands.every(h => Math.hypot(h[0] - st.grip[0], h[1] - st.grip[1]) > 3 * S) : false;
        const ok = k < 0.65 && a1 >= b1 - 3 * S && onGun === 1 && offGun === 1 && offGrip;
        rows.push(`${d} ${band}: ${(k * 100).toFixed(0)}% of the standing height, his foot ${a1} (standing ${b1}), a hand on the rifle ${onGun}, a hand slid off it ${offGun}, off the grip ${offGrip}`);
        if ((d === 'D3') !== ok) bad.push({ d, band, k, onGun, offGun, offGrip });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(PORTRAIT_PICKS.down === 'D3' && !bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'C6 the P-12\'s high ready reads (pistol-stances PS-b, 0/100 on 2026-11-20; the judge\'s pass the same day: "praying hands"): at every band one double fist on the upper chest above row 40 and the low ready\'s, the slide tipped toward you over it with its muzzle 4 rows or more over the grip; v0.0.27\'s (highOld) has no such fists',
    fn() {
      const rows = [], bad = [];
      for (const place of ['high', 'highOld']) for (const [band, S] of SCALES) {
        const hi = portrait(recOf(RP_PISTOL, { hold: { how: 'pistol-high', ...(place === 'highOld' ? { place } : {}) } }), S), lo = portrait(recOf(RP_PISTOL, { hold: { how: 'pistol-ready' } }), S);
        const st = hi.stations, l = heldBox(lo), f = st?.fists ?? [], fy = f.length ? f.reduce((a, p) => a + p[1], 0) / f.length : Infinity;
        const up = st?.muzzle && st?.grip ? (st.grip[1] - st.muzzle[1]) / S : 0, onGun = f.filter(p => heldNear(hi, [p[0], p[1] - 2.4 * S], 2.4 * S)).length;
        const ok = f.length === 2 && fy < (40 + 2) * S && fy < l.meanY && up >= 4 && onGun === 2;
        rows.push(`${place} ${band}: the fists at row ${Number.isFinite(fy) ? (fy / S).toFixed(1) : '-'} (the low ready's gun ${(l.meanY / S).toFixed(1)}), the muzzle ${up.toFixed(1)} rows over the grip, fists under the slide ${onGun}`);
        if ((place === 'high') !== ok) bad.push({ place, band, fy, up, onGun });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'C7 the hands read on the black suit (the judge\'s pass of 2026-11-20, fault 2: "hands and gun black on black"): your fists in A3, P3 and the P-12\'s high ready, at the near band, each a block of at least 4 × 4 card px a clear grey (a mean lum of 112 and over) against the suit\'s black and the gun (v0.0.27\'s round fists in the glove\'s shade, 97 to 110)',
    fn() {
      const rows = [], bad = [], S = SCALES[0][1], lumOf = (w) => 0.3 * (w & 0xff) + 0.59 * ((w >>> 8) & 0xff) + 0.11 * ((w >>> 16) & 0xff);
      for (const [id, gear, over] of [['A3', ME, { hold: { how: 'rifle-aim' }, aimAt: 'you' }], ['P3', ME_PISTOL, { hold: { how: 'pistol-aim' }, aimAt: 'you' }], ['high', ME_PISTOL, { hold: { how: 'pistol-high' } }]]) {
        const pm = paintPortrait(recOf(gear, over), ME_PERSON, { scale: S }).pm, got = (pm.stations?.fists ?? []).map(([x, y]) => { let sum = 0; for (let j = -1; j <= 2; j++) for (let i = -2; i <= 1; i++) sum += lumOf(pm.data[(Math.round(y) + j) * pm.w + Math.round(x) + i]); return sum / 16; });
        rows.push(`${id}: the fists' 4 × 4 blocks at a mean lum of ${got.map(v => v.toFixed(0)).join(', ')} (the suit's 29, the gun's 64)`);
        if (got.length !== 2 || got.some(v => v < 112)) bad.push({ id, got });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'C8 the boards\' guns read whole in printed hands (the judge\'s pass of 2026-11-20: 1A "cut into shards", 2A "a 3 × 5 px L at the belt"): the pistol at the low ready at least 48 card px a 96 px/m band (an L of 8 × 6), the rifle\'s forearms and fists printed over it (a light fill in the print\'s line)',
    fn() {
      const rows = [], bad = [];
      for (const b of HIT_BANDS) {
        const r = b.maxM === Infinity ? 30 : b.maxM - 1, k = b.pxPerM / 96;
        const pc = paintHitcard({ man: PAPERS.man, words: 'X', rangeM: r, subject: { kind: 'board', face: 'threat', holds: 'pistol' } });
        // (the rifle's board doll: the printed hands' fill (held.js PRINT_FILL), which only printHands draws, ringed by the print's line)
        const bd = doll({ ...dressOf(boardGear('threat', 'rifle', 'ready'), { look: boardLook('threat'), sex: 'm' }), scale: figGeom(b.pxPerM).scale }), fill = word(PRINT_FILL);
        let inner = 0;
        for (let i = 0; i < bd.data.length; i++) if (bd.data[i] === fill) inner++;
        rows.push(`${b.id}: the pistol's ${pc.gun.toned} px, the rifle board's printed hands ${inner} px`);
        if (pc.gun.toned < 48 * k || inner < 20 * k) bad.push({ band: b.id, pistol: pc.gun.toned, inner });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'C9 the truth cards draw what the end card draws (the judge\'s pass of 2026-11-20: "every board is drawn with no gun, and 3B is the old hostage outline"): truth-cards\' card of each stand you engaged carries the end card\'s board subject (house.js truthRows), its gun drawn in its own colours',
    fn() {
      const lane = JSON.parse(readFileSync(`${root}/samples/truth-cards/lane.json`, 'utf8')), rows = [], bad = [];
      for (const c of lane.cards) {
        const pm = paintHitcard({ ...c.model, subject: subjectOf(c.model), size: 170 }), none = paintHitcard({ ...c.model, size: 170 });
        rows.push(`${c.stand} (${c.model.face}, ${c.model.holds}): the gun's ${pm.gun.toned} px (with no subject ${none.gun.toned})`);
        if (pm.gun.toned < 8) bad.push({ stand: c.stand, toned: pm.gun.toned });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'C10 a board whose hands were not seen takes V3\'s veil (the judge\'s pass of 2026-11-20: "HANDS NOT SEEN · 1B" over two empty fists): at every band the card is veiled from the line, the same line as a man\'s',
    fn() {
      const rows = [], bad = [];
      for (const b of HIT_BANDS) {
        const c = paintHitcard({ man: PAPERS.man, words: 'HANDS NOT SEEN · 1B', rangeM: b.maxM === Infinity ? 30 : b.maxM - 1, subject: { kind: 'board', face: 'threat', holds: 'unseen' } });
        rows.push(`${b.id}: the veil from row ${c.hidden?.line ?? '-'} (a man's ${unreadLine(b.pxPerM)})`);
        if (c.hidden?.line !== unreadLine(b.pxPerM)) bad.push({ band: b.id, hidden: c.hidden ?? null });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'C11 you prone are low behind the gun (the judge\'s pass of 2026-11-20 on Y-p: "the chest plate faces you as if he stood"): at every band the figure from the helmet to the deck at most 40 reference rows, its arms on the deck wider than twice the head',
    fn() {
      const rows = [], bad = [];
      for (const [band, S] of SCALES) {
        const pm = portrait(recOf(RP, { pose: 'prone', hold: { how: 'rifle-aim' }, aimAt: 'you' }), S), spans = {};
        let y0 = Infinity, y1 = -1;
        for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) { const v = pm.data[y * pm.w + x]; if (v === pm.data[0] || v === pm.data[(pm.h - 1) * pm.w]) continue; y0 = Math.min(y0, y); y1 = Math.max(y1, y); const sp = spans[y] ?? (spans[y] = [x, x]); sp[0] = Math.min(sp[0], x); sp[1] = Math.max(sp[1], x); }
        const h = (y1 - y0) / S, deck = spans[y1 - Math.round(2 * S)], head = spans[y0 + Math.round(6 * S)], wide = deck && head ? (deck[1] - deck[0]) / (head[1] - head[0]) : 0;
        rows.push(`${band}: ${h.toFixed(1)} rows from the helmet to the deck, the arms on the deck ${wide.toFixed(2)} × the head`);
        if (h > 40 || wide < 2) bad.push({ band, h, wide });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, JSON.stringify(bad));
    },
  },
];
