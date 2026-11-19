// OLYMPUS sample: you in the black suit on the I and C cards (pure; main.js shows the pictures). The overhaul's O-16 (PD).
//
// The I and C cards draw you as the doll in the gear you wear (v0.0.18, the user's ask of 2026-11-15), and in the combat EVA
// suit the doll is black on the doll's own dark wall: the suit's outline is the ink round it, so the figure reads as a hole.
// Each picture is the game's own dressed doll (src/art/doll/dress.js dressedDoll, at the cards' scale, unlit as they draw it),
// you at GO in the shoot house (the suit, the carrier, the R-7 at the low ready, the P-12 holstered) and after Transition (the
// P-12 at the ready, the R-7 slung in front; labelled GO and P-12), in three places (HOUSE, BAY, STREET); the candidate redraws only the ground behind the figure and, in
// D-c, a rim of light on the suit's edge:
//   ?d=D-a  today's backdrop: the doll's own wall and floor, whatever the place (the three columns alike);
//   ?d=D-b  the place's backdrop: the wall and floor in the place's tones (the shoot house's grey slab, the bay's painted wall
//           and deck, the Melas street's dust), the doll's floor shadow kept;
//   ?d=D-c  the place's backdrop and a rim light: the suit's outermost pixels on the lit side (the light from the upper left,
//           as the doll's own is) lifted toward the place's light by RIM_K, so the black reads against any ground.
import { dressedDoll } from '../../src/art/doll/dress.js';
import { DOLL_SCALE, backdropAt } from '../../src/art/doll/doll.js';
import { INK, mix } from '../../src/art/doll/grid.js';
import { pic, hexOf, figureMask, GAP } from '../portrait-lib/card.js';

export const LOOKS = Object.freeze(['D-a', 'D-b', 'D-c']), DEFAULT = 'D-a';
/** The places (the shoot house's grey slab, the squad bay's painted wall and deck, the Melas street's dust): their wall, floor and floor's shadow, and their light (the rim's colour). */
export const PLACES = Object.freeze({
  house: Object.freeze({ name: 'HOUSE', wall: 0x57534e, floor: 0x76726c, shadow: 0x4f4c48, light: 0xf2ead8 }),
  bay: Object.freeze({ name: 'BAY', wall: 0x4a5560, floor: 0x3a3f47, shadow: 0x262a30, light: 0xdfe6f0 }),
  street: Object.freeze({ name: 'STREET', wall: 0x8a5d46, floor: 0x6b4634, shadow: 0x4a2f24, light: 0xf0c49a }),
});
/** The rim's share toward the place's light (D-c). */
export const RIM_K = 0.55;
const S = DOLL_SCALE, LABEL_H = 9;
const ME = (over = {}) => ({ outfit: 'combatSuit', suit: { model: 'ces-1', colour: 'black', helm: null }, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 1 }, { key: 'p2', holds: 2, mags: 1 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: { model: 'p12', place: 'holster', mag: true }, thigh: { holds: 2, mags: 1 }, held: null, devices: [], painted: false, mask: null, hands: null, device: null, ...over });
const PERSON = { look: { skin: 'tan', hair: { style: 'medReg', color: 'dark' }, head: null }, sex: 'm' };
export const FIGS = Object.freeze([['GO', ME()], ['P-12', ME({ rifle: { model: 'r7', finish: null, place: 'front', mag: true }, pistol: { model: 'p12', place: 'ready', mag: true } })]]);
const DW = Math.round(64 * S), DH = Math.round(142 * S);
export const SIZE = Object.freeze([GAP + 3 * (DW + GAP), GAP + 2 * (LABEL_H + DH + GAP)]);

/** A doll with its ground redrawn for a place and a look: a Pic, and the rim's pixel count. */
export function dollIn(gear, place, look) {
  const pm = dressedDoll(gear, PERSON, S), mask = figureMask(pm, S), P = pic(pm.w, pm.h), Pl = PLACES[place];
  let rim = 0;
  for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
    const i = y * pm.w + x, c = hexOf(pm.data[i]);
    if (mask[i] || look === 'D-a') { P.col[i] = c; continue; }
    // (the doll's own backdrop's three tones to the place's: its wall, its floor and the shadow under the feet)
    const b = backdropAt(x, y, S);
    P.col[i] = b === 0x383c4a ? Pl.wall : b === 0x1f2029 ? Pl.shadow : Pl.floor;
  }
  if (look === 'D-c') {
    // (the rim: a figure pixel next to its ink, the ink at its left or above it (the light from the upper left))
    const isInk = (x, y) => x >= 0 && y >= 0 && x < pm.w && y < pm.h && mask[y * pm.w + x] && hexOf(pm.data[y * pm.w + x]) === INK;
    const lit = [];
    for (let y = 0; y < pm.h; y++) for (let x = 0; x < pm.w; x++) {
      const i = y * pm.w + x;
      if (!mask[i] || hexOf(pm.data[i]) === INK) continue;
      if ((isInk(x - 1, y) && !isInk(x + 1, y)) || isInk(x, y - 1)) lit.push(i);
    }
    for (const i of lit) { P.col[i] = mix(P.col[i], Pl.light, RIM_K); rim++; }
  }
  return { P, rim };
}

/** The picture for a query: you at GO and after Transition (rows) in the three places (columns). */
export function picture(q = new URLSearchParams()) {
  const look = LOOKS.includes(q.get('d')) ? q.get('d') : DEFAULT, [W, H] = SIZE, P = pic(W, H), cells = [];
  FIGS.forEach(([label, gear], row) => Object.keys(PLACES).forEach((place, col) => {
    const x = GAP + col * (DW + GAP), y = GAP + row * (LABEL_H + DH + GAP), { P: D, rim } = dollIn(gear, place, look);
    P.write(x + 1, y + 1, `${label} · ${PLACES[place].name}`, 0x9aa0ab);
    P.blit(D, x, y + LABEL_H);
    cells.push({ fig: label, place, rim });
  }));
  P.report = { frame: [W, H], look, cells };
  return P;
}
