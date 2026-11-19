// OLYMPUS tests: the doll holds the rifle as a marine does (the user, 2026-11-19, of doll-gear's R: "The Doll is wrong, nobody holds their gun like that").
//
// v0.0.18 to v0.0.23 drew the doll's low ready (the I and C cards, the target card's men, the house's boards at W1) at the hip, 35°
// below level across the belly, the butt hanging free of the body below the elbow. Now the butt is in his right shoulder's pocket
// (the viewer's left), the rifle down across the body toward the ground ahead of his left foot, foreshortened (worn.js READY_BUTT,
// READY_MUZZLE, READY_LEN_K), the right fist at the grip under the shoulder and the left on the handguard. The slung rifle still hangs
// in front ("Rifles are not worn on the back when slung they are hanging front", the same note: the slung dolls are v0.0.23's bytes,
// held by portrait-void). Read from the doll's own pixels (its held part set, pm.held): the rifle's topmost pixel within the shoulder
// pocket's rows, its lowest below the belt, both fists touching it. Prints the rifle's extent and the fists' places.
import { assert } from './helpers.mjs';
import { doll, DOLL_SCALE, DOLL_ROWS, BODY } from '../src/art/doll/doll.js';
import { dressOf } from '../src/art/doll/dress.js';
import { READY_BUTT, gearBends, rifleStamp } from '../src/art/doll/worn.js';

const PERSON = { look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' }, head: null }, sex: 'm' };
const GEAR = (outfit) => ({ outfit, suit: outfit === 'combatSuit' ? { model: 'ces-1', colour: 'black', helm: null } : null, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: null, thigh: null, held: null, painted: false });
/** The shoulder pocket's rows (reference): the collarbone to the armpit (doll.js BODY's armOut from 29.4, the armpit at 40). */
const POCKET = Object.freeze([28, 40]);

export default [
  {
    name: 'the doll\'s low ready as a marine holds it: the butt in his right shoulder\'s pocket (the viewer\'s left), the muzzle down across the body below the belt, both fists on the rifle (v0.0.23: the butt free at the hip)',
    fn() {
      const S = DOLL_SCALE, mid = 32, bad = [];
      for (const outfit of ['combatSuit', 'utilities']) {
        const pm = doll({ ...dressOf(GEAR(outfit), PERSON), scale: S });
        // (the rifle's own pixels, the stamp's, as drawn: its extent in reference rows and columns)
        const cells = rifleStamp('r7', null, S, 'ready', BODY.m, mid, true), ys = cells.map(c => c[1] / S), xs = cells.map(c => c[0] / S);
        const top = Math.min(...ys), bottom = Math.max(...ys), topX = xs[ys.indexOf(top)] - mid;
        const b = gearBends({ rifle: { place: 'ready' } });
        const near = (to, side) => cells.some(([x, y]) => Math.hypot(x / S - (mid + side * to[0]), y / S - to[1]) <= 3);
        const held = pm.held.reduce((a, v) => a + v, 0);
        console.log(`      ${outfit}: the rifle from row ${top.toFixed(1)} (column ${topX.toFixed(1)} from the middle) to row ${bottom.toFixed(1)}; the belt at ${DOLL_ROWS.BELT_Y}; the right fist at [${b.bendR.map(v => v.toFixed(1))}], the left at [${b.bendL.map(v => v.toFixed(1))}]; ${held} px held`);
        if (!(top >= POCKET[0] && top <= POCKET[1] && topX < -6)) bad.push(`${outfit}: the butt at row ${top.toFixed(1)}, column ${topX.toFixed(1)}: not in the shoulder's pocket`);
        if (!(bottom > DOLL_ROWS.BELT_Y)) bad.push(`${outfit}: the muzzle not below the belt`);
        if (!near(b.bendR, -1) || !near(b.bendL, 1)) bad.push(`${outfit}: a fist off the rifle`);
        if (held < 100) bad.push(`${outfit}: ${held} px held`);
      }
      assert(READY_BUTT[1] <= POCKET[1] && !bad.length, bad.join('; '));
    },
  },
];
