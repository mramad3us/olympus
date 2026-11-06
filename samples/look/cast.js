// OLYMPUS look samples: who is where in the five combined scenes. The people, their looks, the camera, the mood.
//
// The look round puts the real figures (src/art/figures/, drawn by src/render/figures.js) into the
// scenes built from the kit (samples/scenes/: the squad bay, the head, the mess hall, the valley floor,
// a frigate's deck 5), so the user scores the whole picture rather than its parts: the density (16 or
// 24 px/m) and the figures (A chibi or B soldier) together, in the places the game will be lived in
// (DESIGN.md, Space and scales: "Pixel density is decided by look samples the user scores"; "Figures
// likewise come down to chibi (tradecraft's pick) or taller proportions, by sample").
//
// Each composition is plain data: the scene and its mood, the camera (a spot and a zoom: zoom 1 is the
// game's own frame, 40 × 22.5 m at either density), and the people. A person is
//   { look: a key of LOOKS, x, z (metres, the scene's frame: x east, z south), face: 'down' | 'up' |
//     'right' | 'left', and what they do:
//     gait: 'idle' (phase: which of the two breaths), or 'walk' | 'run' | 'bound' with speedMs and
//     loopM (they walk that far along their facing, then start again: a still at any t is mid-stride);
//     or frame: a frame by name ('sit', 'sleep', 'couch', 'aim', ...) with seat (a seat's height: the
//     card is lifted by the seat less the candidate's own seatM) or bed (a bed's top: lying frames
//     lie on it);
//     you: true for the one the eyes follow (the see-through and the fog of awareness are round them) }.
// The same cast served both candidates and both densities: only ?prop= and ?ppm= changed between the
// four pictures of a sample (tests/samples-look.test.mjs checks it). Since the user's pick (2026-11-06:
// 16 px/m chibi, VIEWS §2.3) the page draws the chibi alone, and the soldier's shots are the gallery's.
//
// The looks are outfits.js's (utilities, the sergeant's, PT kit, the vac suit sealed and open), plus
// three the outfits don't have yet, made here from wear()'s layers (my calls, for these samples only):
// a towel at the waist and shower shoes (the head), bare (the shower, behind its curtain: only the wet
// head shows above it, VIEWS §3.4), and the galley's whites (the cooks). Colours are outfits.js's
// unless noted. Pure: no DOM, no three.js, so the tests read it in node.
import { wear } from '../../src/art/figures/outfits.js';

// ---------- looks ----------

const TOWELS = Object.freeze({ olive: 0x4c633d, blue: 0x3c5d84, grey: 0x625854 }), SHOWER_SHOES = 0x3c5d84, WHITES = 0xe8e6e0, CHECKS = 0x565b67, GALLEY_SHOES = 0x31292a;
/** A towel round the waist, bare above, shower shoes: PT kit's cut with the shirt and shorts recoloured. */
// (a coloured towel, the rack's towels' colours (src/art/kit/quarters.js): a white one read as underwear)
function towel(base, colour = TOWELS.olive) {
  const L = wear({ ...base, outfit: 'pt' });
  L.top = { kind: 'tee', color: L.skin };
  L.legs = { kind: 'shorts', color: colour };
  L.boots = SHOWER_SHOES; L.accents.socks = L.skin;
  return L;
}
/** In the shower: bare, the hair dark with water (the curtain hides the rest). */
function showering(base) {
  const L = towel(base);
  L.legs = { kind: 'shorts', color: L.skin };
  L.boots = L.skin;
  return L;
}
/** The galley's whites: a white blouse, dark check trousers, a white cap (utilities' cut). */
function cook(base) {
  const L = wear({ ...base, outfit: 'utilities' });
  L.top = { kind: 'blouse', color: WHITES };
  L.legs = { kind: 'trousers', color: CHECKS };
  L.head = { kind: 'cover', color: WHITES };
  L.boots = GALLEY_SHOES; L.belt = null;
  return L;
}

const hair = (style, color) => ({ style, color });
/** Every look the casts use, by key (a key is also the renderer's sheet: people dressed alike share one). */
export const LOOKS = Object.freeze({
  // PT kit
  ptBrown: { outfit: 'pt', skin: 'brown', hair: hair('crew', 'black'), seed: 11 },
  ptLight: { outfit: 'pt', skin: 'light', hair: hair('short', 'auburn'), seed: 12 },
  ptTan: { outfit: 'pt', skin: 'tan', hair: hair('bun', 'dark'), seed: 13 },
  ptDark: { outfit: 'pt', skin: 'dark', hair: hair('crew', 'black'), seed: 14 },
  ptBlond: { outfit: 'pt', skin: 'light', hair: hair('crew', 'blond'), seed: 15 },
  // utilities (the Valles pattern), the cover on
  utilTan: { outfit: 'utilities', skin: 'tan', hair: hair('crew', 'dark'), seed: 21 },
  utilLight: { outfit: 'utilities', skin: 'light', hair: hair('short', 'brown'), seed: 22 },
  utilBrown: { outfit: 'utilities', skin: 'brown', hair: hair('crew', 'black'), seed: 23 },
  utilDark: { outfit: 'utilities', skin: 'dark', hair: hair('crew', 'black'), seed: 24 },
  utilBun: { outfit: 'utilities', skin: 'tan', hair: hair('bun', 'brown'), seed: 25 },
  sergeant: { outfit: 'nco', skin: 'light', hair: hair('crew', 'brown'), rank: 'sgt', seed: 26 },
  // the head
  towelLight: towel({ skin: 'light', hair: hair('crew', 'brown'), seed: 31 }, TOWELS.olive),
  towelBrown: towel({ skin: 'brown', hair: hair('crew', 'black'), seed: 32 }, TOWELS.blue),
  towelTan: towel({ skin: 'tan', hair: hair('short', 'dark'), seed: 33 }, TOWELS.grey),
  showerTan: showering({ skin: 'tan', hair: hair('short', 'black'), seed: 34 }),
  // the galley
  cookDark: cook({ skin: 'dark', hair: hair('crew', 'black'), seed: 41 }),
  cookLight: cook({ skin: 'light', hair: hair('short', 'blond'), seed: 42 }),
  // the light vac suit (HAD Mk 7): sealed, or the helmet off and clipped to the pack
  vacSlung: { outfit: 'vac', skin: 'tan', weapon: 'rifle', carry: 'slung', seed: 51 },
  vacLow: { outfit: 'vac', skin: 'light', weapon: 'rifle', carry: 'low', seed: 52 },
  vacSealed: { outfit: 'vac', skin: 'dark', seed: 54 },
  vacOpenDark: { outfit: 'vacOpen', skin: 'dark', hair: hair('crew', 'black'), seed: 55 },
  vacOpenBun: { outfit: 'vacOpen', skin: 'tan', hair: hair('bun', 'auburn'), seed: 56 },
});

// ---------- the five scenes ----------
// (the furniture's places are the scenes' own: samples/scenes/barracks.js, messhall.js, chasm.js, frigate.js)

const walk = (look, x, z, face, loopM = 2.4, o = {}) => ({ look, x, z, face, gait: 'walk', speedMs: 1.35, loopM, ...o });
const idle = (look, x, z, face, phase = 0, o = {}) => ({ look, x, z, face, gait: 'idle', phase, ...o });
const sit = (look, x, z, face, seat, o = {}) => ({ look, x, z, face, frame: 'sit', seat, ...o });

/** Rack heights (src/art/kit/quarters.js): a two-high rack's upper mattress top; a crash couch's (ship.js). */
const UPPER_BUNK_M = 1.41, COUCH_TOP_M = 0.52;
const BENCH_M = 0.46, STOOL_M = 0.47, FOOTLOCKER_M = 0.4, CHAIR_M = 0.48;

export const CASTS = Object.freeze({
  // L1: Echo Company's east wing at reveille. The overheads on before the sky is light; the bays get up.
  bay: {
    scene: 'bay', mood: 'reveille', camera: { x: 17.4, z: 7.3, zoom: 1 },
    people: [
      walk('ptBrown', 2.2, 3.7, 'right', 3.2, { you: true }),               // (you: down the 1st squad's aisle)
      idle('utilTan', 6.3, 1.0, 'up', 0),                                   // (at an open wall locker, dressing)
      sit('ptLight', 3.075, 2.3, 'right', FOOTLOCKER_M),                     // (on a footlocker, lacing running shoes)
      walk('towelLight', 8.7, 4.4, 'down', 2.6),                            // (out of the bay for the head)
      idle('sergeant', 16.6, 3.7, 'down', 1),                               // (the squad leader, calling the 2nd squad out)
      { look: 'ptDark', x: 14.675, z: 1.9, face: 'down', frame: 'sleep', bed: UPPER_BUNK_M },   // (still asleep, upper rack)
      idle('ptTan', 19.575, 2.85, 'up', 1),                                 // (making a rack)
      walk('ptBlond', 26.4, 3.8, 'right', 3.0, { step: 2 }),                // (3rd squad, out to formation)
      walk('ptBrown', 31.9, 4.6, 'down', 2.4, { step: 1 }),
      sit('utilLight', 33.05, 5.73, 'down', STOOL_M),                       // (at the study table, a notebook)
      idle('utilDark', 2.9, 8.9, 'left', 0),                                // (the fire watch by the desk)
      walk('towelBrown', 13.4, 8.5, 'left', 3.0, { step: 3 }),              // (along the hallway to the head)
      idle('towelTan', 10.8, 13.05, 'up', 1),                               // (at head A's basins)
    ],
  },
  // L2: the head in the evening. One marine showers behind a drawn curtain (VIEWS §3.4: above it the wet
  // hair); the rest at the basins, on the drying bench, coming in. Steam over the one shower running.
  head: {
    scene: 'head', mood: 'evening', camera: { x: 3.9, z: 2.7, zoom: 2 },
    people: [
      // (stall 3 of 5, its curtain closed: far enough back in the stall that the head clears the curtain's rail)
      idle('showerTan', 3.975, 0.05, 'down', 0),
      idle('towelLight', 2.1, 5.35, 'up', 0, { you: true }),               // (at the basins, the mirror fogged)
      idle('ptDark', 3.05, 5.4, 'up', 1),                                   // (west of the stalls, which would hide him)
      sit('towelBrown', 5.3, 2.0, 'right', BENCH_M),                       // (drying off on the bench)
      walk('ptBrown', 0.8, 1.4, 'down', 1.6, { step: 1 }),                 // (in through the door)
    ],
    // (steam over the shower that runs, thinner and higher than the scene's so the wet head shows through
    // it, and the mirror's fog; the other stalls are dry)
    steam: (puff) => (Math.abs(puff.x - 3.975) < 0.4 ? { ...puff, y: 2.45, k: 0.45 } : puff.z > 2 ? puff : null),
  },
  // L3: the mess hall at noon. A queue from the entry's basins through the door to the serving line,
  // trays along the line, the cooks behind it, the dining room half full.
  mess: {
    scene: 'mess', mood: 'noon', camera: { x: 20, z: 9.1, zoom: 1 },   // (south of the scene's own spot: the second row of tables in, the wall's top a little cut)
    people: [
      idle('cookDark', 11.0, 9.55, 'down', 0), idle('cookLight', 15.4, 9.55, 'down', 1), idle('cookLight', 26.0, 9.55, 'down', 0),
      idle('cookDark', 13.0, 4.0, 'up', 1),
      // (at the line, facing the food, sliding their trays east)
      idle('utilTan', 9.0, 11.85, 'up', 0), idle('utilBrown', 11.4, 11.85, 'up', 1), idle('ptLight', 13.6, 11.85, 'up', 0), idle('utilBun', 17.3, 11.85, 'up', 1),
      idle('utilDark', 24.6, 11.85, 'up', 0), idle('utilLight', 27.0, 11.85, 'up', 1),
      // (the queue, through the door from the entry)
      idle('utilLight', 7.6, 12.55, 'right', 1), idle('ptBrown', 6.6, 12.85, 'right', 0),
      walk('utilTan', 5.2, 13.15, 'right', 0.8, { you: true }), idle('utilDark', 4.1, 13.3, 'right', 1),
      idle('utilBrown', 3.0, 10.1, 'up', 0),                               // (washing hands at the entry)
      sit('sergeant', 6.9, 16.5, 'left', CHAIR_M),                         // (the headcount desk)
      // (dining: the north benches face the camera, the south ones turn their backs)
      sit('utilBun', 12.3, 14.38, 'down', BENCH_M), sit('utilDark', 13.6, 14.38, 'down', BENCH_M), sit('utilLight', 12.9, 15.62, 'up', BENCH_M),
      sit('utilBrown', 18.9, 14.38, 'down', BENCH_M), sit('ptTan', 20.4, 14.38, 'down', BENCH_M), sit('utilTan', 19.3, 15.62, 'up', BENCH_M), sit('utilDark', 20.9, 15.62, 'up', BENCH_M),
      sit('utilLight', 15.6, 18.78, 'down', BENCH_M), sit('ptBlond', 16.4, 20.02, 'up', BENCH_M),
    ],
  },
  // L4: the valley floor. Two marines in vac suits on a suit drill: you walking back to the vehicle lock,
  // rifle at the low ready; the other in the low-g bound (BODY.md's lope at 0.38 g), rifle slung.
  // By day; then in a dust storm of optical depth 4 (VIEWS §2.7), the fog of awareness round you.
  chasm: {
    scene: 'chasm', mood: 'day', camera: { x: 0, z: 1.2, zoom: 1 },
    people: [
      walk('vacLow', -6.4, 13.2, 'up', 1.6, { you: true, speedMs: 1.2 }),
      // (open ground east of the garage, just inside your cone of sight: in the storm, a shape in the haze)
      { look: 'vacSlung', x: 6.0, z: 8.4, face: 'left', gait: 'bound', speedMs: 2.8, loopM: 5.6, hopM: 0.45, step: 3 },
    ],
  },
  // L5: a Hellas-class frigate's deck 5 at battle stations (the red light). You strapped into a crash
  // couch in the ready room, two more strapped in, one sat on his couch about to strap in, the
  // section's NCO in the aisle, helmet off. Zoom 2 on the ready room: the couch's splash.
  deck: {
    scene: 'deck', mood: 'battle', camera: { x: 9.4, z: 3.4, zoom: 2 },
    people: [
      { look: 'vacSealed', x: 13.0, z: 2.5, face: 'down', frame: 'couch', bed: COUCH_TOP_M, you: true },
      { look: 'vacOpenDark', x: 15.1, z: 2.5, face: 'down', frame: 'couch', bed: COUCH_TOP_M },
      { look: 'vacSlung', x: 11.95, z: 5.1, face: 'down', frame: 'couch', bed: COUCH_TOP_M },
      // (sat side on, on the one couch whose harness is still open, about to strap in: the aisle crowds the
      // couches' heads, and the corridor and the passage aren't used, the trunk's ladder and the cut walls
      // hide whoever is in them)
      sit('vacSlung', 14.05, 4.4, 'right', COUCH_TOP_M),
      idle('vacOpenBun', 16.7, 2.9, 'left', 0),
    ],
  },
});

/** Where a person is at t seconds and how they're drawn: { x, z, y, face, frame | gait, stride, tS, phase }. */
export function placeAt(p, tS, seatM) {
  const out = { x: p.x, z: p.z, y: 0, face: p.face, tS, phase: p.phase ?? 0 };
  if (p.frame) {
    out.frame = p.frame;
    if (p.seat !== undefined) { out.y = Math.max(0, p.seat - seatM); out.seat = out.y; }
    if (p.bed !== undefined) out.y = p.bed;
    return out;
  }
  out.gait = p.gait;
  if (p.gait === 'walk' || p.gait === 'run' || p.gait === 'bound') {
    const step = { walk: 0.16, run: 0.45, bound: 0.7 }[p.gait];           // (poses.js STEP_M: a frame's distance)
    const d = p.speedMs * tS + (p.step ?? 0) * step, along = ((d % p.loopM) + p.loopM) % p.loopM;
    const [ux, uz] = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }[p.face];
    out.x = p.x + ux * along; out.z = p.z + uz * along; out.stride = d;
    // (a bound: four frames a leap, its height a parabola over the leap after the push-off, so the apex
    // frame (the third) is near the top and the push-off on the ground)
    if (p.gait === 'bound') { const u = (d % (4 * step)) / (4 * step), v = Math.min(1, Math.max(0, (u - 0.15) / 0.85)); out.y = 4 * (p.hopM ?? 0.4) * v * (1 - v); }
  }
  return out;
}
