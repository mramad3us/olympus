// OLYMPUS sample: the card in the dark, behind a jamb, and with his hands not yet read (pure; main.js shows the pictures).
//
// The user, 2026-11-17: the portraits "need to be more dynamic and show us what we would be seeing" (P§6.4). Each card is a live
// man's, the live lane's role-player 2a (utilities, the plate carrier, the force-on-force mask, the R-7 at the low ready), in
// his own colours on the card's dark, drawn by ../portrait-lib/card.js manCard over the game's own doll; the candidates are
// drawn over it by this module:
//   ?l=L1|L2   L, his light: L1 (the default for v0.0.24) the figure lit by his place's light, k = the light over the lit
//              room's LIGHT_REF 0.75, never below LIGHT_FLOOR_K 0.3 (the build sheet §5's reserved numbers), at four places:
//              a lit room (0.75), room 3's dim (0.40), a dark room (0.10) and a man in a lamp's pool (the light falling off
//              from a lamp above his left shoulder, LAMP_R_PX away); L2 unlit (today's: the four the same);
//   ?j=J1|J2   J, half behind the jamb (a quarter, a half and three quarters of him behind it, from the viewer's left): J1
//              the jamb drawn over him (the house's wall in its tones, its lit edge toward you), J2 the hidden share faded
//              to the card's ground (JAMB_FADE_K);
//   ?v=V1|V2   V, his hands before your take-in has read them: today's card (the hands emptied, v0.0.22's liveGear), then
//              the candidate at the near and mid bands: V1 (the default, this release) the hands and the rifle drawn as the
//              stage shows them, the words "HANDS NOT SEEN · 2A"; V2 the hands and what is in them veiled, hatched in the
//              card's ground over the hands' box.
import { pic, manCard, sheetSize, CARD_W, GAP } from '../portrait-lib/card.js';
import { mix } from '../../src/art/doll/grid.js';

export const GROUPS = Object.freeze({ l: Object.freeze(['L1', 'L2']), j: Object.freeze(['J1', 'J2']), v: Object.freeze(['V1', 'V2']) });
export const DEFAULTS = Object.freeze({ l: 'L1', j: 'J1', v: 'V1' });
/** The light's numbers (the build sheet §5, reserved for v0.0.24): the floor, the lit room's level; the lamp's pool across (card px). */
export const LIGHT_FLOOR_K = 0.3, LIGHT_REF = 0.75, LAMP_R_PX = 120;
/** The places' light for L (places' lightLevel's numbers in the house: the rooms and hall 0.75, room 3 0.40; a dark room). */
export const PLACES = Object.freeze([['LIT ROOM', 0.75], ['ROOM 3 DIM', 0.40], ['DARK ROOM', 0.10], ['LAMP POOL', null]]);
/** The jamb's shares, its colours (the house's wall: face, lit edge, ink) and J2's fade toward the ground. */
export const JAMB_SHARES = Object.freeze([0.25, 0.5, 0.75]), JAMB_C = Object.freeze({ face: 0x4b4540, lit: 0x6e665c, ink: 0x14151c }), JAMB_FADE_K = 0.8;
const LABEL_H = 10;
export const SIZE = Object.freeze({ l: sheetSize(4, 1, LABEL_H), j: sheetSize(3, 1, LABEL_H), v: sheetSize(3, 1, LABEL_H) });

/** Role-player 2a as the stage draws him (src/sim/arms/gear.js's form: the live lane's issue, opfor.js setPost's utilities). */
export const RP_GEAR = Object.freeze({ outfit: 'utilities', suit: null, carrier: { model: 'pc-m3', pouches: [{ key: 'p1', holds: 2, mags: 2 }, { key: 'p2', holds: 2, mags: 2 }, { key: 'dump', holds: 4, mags: 0 }] }, ears: null, rifle: { model: 'r7', finish: null, place: 'ready', mag: true }, pistol: null, thigh: null, held: null, devices: [], painted: false, mask: 'fof', hands: null, device: null });
export const RP_PERSON = Object.freeze({ look: { skin: 'brown', hair: { style: 'highTight', color: 'black' }, head: null }, sex: 'm' });
const emptied = () => ({ ...RP_GEAR, rifle: null });

const darken = (c, k) => mix(0x000000, c, k);
/** L: the figure lit by k at each pixel (a number, or a function of the pixel). */
function lit(C, k) {
  for (let y = 0; y < C.figH; y++) for (let x = 0; x < C.w; x++) { const i = y * C.w + x; if (C.fig[i]) C.col[i] = darken(C.col[i], Math.max(LIGHT_FLOOR_K, typeof k === 'function' ? k(x, y) : k)); }
  return C;
}
/** J: the jamb over the share of him from the viewer's left (J1 drawn, J2 the figure faded to the ground). */
function jamb(C, share, how) {
  let fx0 = C.w, fx1 = 0;
  for (let y = 0; y < C.figH; y++) for (let x = 0; x < C.w; x++) if (C.fig[y * C.w + x]) { fx0 = Math.min(fx0, x); fx1 = Math.max(fx1, x); }
  const edge = Math.round(fx0 + (fx1 - fx0 + 1) * share);
  for (let y = 1; y < C.figH; y++) for (let x = 1; x < edge; x++) {
    const i = y * C.w + x;
    if (how === 'J1') C.col[i] = x === edge - 1 ? JAMB_C.ink : x >= edge - 3 ? JAMB_C.lit : JAMB_C.face;
    else if (C.fig[i]) C.col[i] = mix(C.col[i], C.groundAt(y), JAMB_FADE_K);
  }
  return C;
}
/** V2: the hands' box veiled, hatched in the ground over the figure. */
function veil(C) {
  const b = C.hands;
  for (let y = b.y; y < b.y + b.h && y < C.figH; y++) for (let x = b.x; x < b.x + b.w; x++) { const i = y * C.w + x; if (C.fig[i] && (x + y) % 3 !== 0) C.col[i] = C.groundAt(y); }
  return C;
}

/** The picture for a query (see the header): a Pic with .report. */
export function picture(q = new URLSearchParams()) {
  const set = q.get('j') ? 'j' : q.get('v') ? 'v' : 'l', cand = GROUPS[set].includes(q.get(set)) ? q.get(set) : DEFAULTS[set];
  const [W, H] = SIZE[set], P = pic(W, H), cards = [];
  const head = { L1: 'L1 · LIT BY HIS PLACE, NEVER BELOW 30%', L2: 'L2 · UNLIT (TODAY)', J1: 'J1 · THE JAMB DRAWN OVER HIM', J2: 'J2 · THE HIDDEN SHARE FADED', V1: 'V1 · AS THE STAGE SHOWS HIM, IN WORDS · CARD 1 TODAY', V2: 'V2 · THE HANDS VEILED · CARD 1 TODAY' }[cand];
  P.write(GAP + 1, GAP + 1, head, 0x9aa0ab);
  const at = (i) => [GAP + i * (CARD_W + GAP), GAP + LABEL_H];
  const man = (o) => manCard({ gear: RP_GEAR, person: RP_PERSON, ...o });
  if (set === 'l') PLACES.forEach(([name, L], i) => {
    const C = man({ words: `2A · ${name}${L === null ? '' : ` ${L.toFixed(2)}`}` });
    // (the lamp: just above his left shoulder, the viewer's right, its light falling off to nothing LAMP_R_PX away)
    const lamp = [C.at.x + 78, 10], k = L === null ? (x, y) => Math.min(1, 1.25 * Math.max(0, 1 - Math.hypot(x - lamp[0], y - lamp[1]) / LAMP_R_PX)) : L / LIGHT_REF;
    if (cand === 'L1') lit(C, k);
    P.blit(C, ...at(i));
    cards.push({ place: name, light: L, k: typeof k === 'number' ? +Math.max(LIGHT_FLOOR_K, Math.min(1, k)).toFixed(3) : 'pool' });
  });
  else if (set === 'j') JAMB_SHARES.forEach((sh, i) => {
    const C = jamb(man({ words: `2A · ${Math.round(sh * 100)}% BEHIND` }), sh, cand);
    P.blit(C, ...at(i));
    cards.push({ share: sh });
  });
  else {
    const today = manCard({ gear: emptied(), person: RP_PERSON, words: 'TODAY · HANDS NOT SEEN · 2A' });
    P.blit(today, ...at(0));
    [4, 14].forEach((r, i) => {
      const C = man({ rangeM: r, words: `HANDS NOT SEEN · 2A · ${r} M` });
      if (cand === 'V2') veil(C);
      let gunShown = 0; for (let j = 0; j < C.gun.length; j++) if (C.gun[j] && C.fig[j] && !(cand === 'V2' && j % C.w >= C.hands.x && j % C.w < C.hands.x + C.hands.w && Math.floor(j / C.w) >= C.hands.y && Math.floor(j / C.w) < C.hands.y + C.hands.h)) gunShown++;
      P.blit(C, ...at(i + 1));
      cards.push({ rangeM: r, hands: C.hands, gunShownPx: gunShown });
    });
  }
  P.report = { frame: [W, H], set, candidate: cand, cards };
  return P;
}
