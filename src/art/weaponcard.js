// OLYMPUS art: the weapon card. The rifle side on at the close figure's density, drawn as its holder believes it (VIEWS §4.4).
//
// The step panel shows the weapon in hand as a card (the build sheet 0.0.5 §2.3 (e), §2.4: 180 × 148 px
// at the left of the panel; WEAPONS §4.2, the sheet's §8 item 27): a side view of the R-7 at the doll's
// density (CARD_PX_PER_M 144: VIEWS §4.1's 9 × 16 px/m, a 0.92 m rifle 132 px long), its muzzle to the
// right, showing only what the character knows, so the card can be wrong and the gun right:
//   - the selector: its lever toward the believed mode, its three marks (S, 1, A) beside it, the one it
//     points at lit;
//   - the magazine: in or out; in, its believed rounds behind its window (the HAD-30 has one: a stack of
//     brass to the believed count, its top dithered when the count is approximate), a magazine whose
//     count is not known showing its body with the window blind and a "?" on its baseplate;
//   - the chamber: the port's cover shut or open; a round believed in shows a glint of brass at the port
//     (its case head when the cover is open, an orange dummy when one was seen); the bolt locked back
//     shows the bolt's face at the back of an open port; a chamber never checked shows a "?" by the port;
//   - a stoppage: felt and not yet looked at (a click, a dead trigger, a shot that did not cycle), an amber
//     "!" by the port; looked at, what was seen: a case standing up out of the port (a stovepipe) or two
//     rounds in it (a double feed).
//   - 0.0.6 (the user, 2026-11-07: "on the gun drawing, the magazines are very long, if they could be a bit
//     slicker it would be nice"): the HAD-30 drawn slimmer and shorter, in proportion to the 0.92 m rifle (the
//     whole magazine 0.21 m, WEAPONS §3.3, of which MAG_HIDDEN_M sits up in the well: MAG_SHOWN_M below it,
//     MAG_W_PX wide, MAG_CURVE_PX forward over its length; v0.0.5 drew all 0.21 m below the well, 9 px wide,
//     curving 14), the believed kind's tip on its top round (a tracer's red);
//   - the magazine in the hand (the user's "when we have the mag we reached for, we see if it has ammo in and
//     which kind"): drawn held under the handguard, its window to its believed count, its top round's tip
//     when its kind is known, "?" on its plate when nothing is known, and under it its count ("5", "≈5"), its
//     weight's band ("A FEW") or "?", and "TR" when it is believed tracer.
// The optic (the SO-4) and the sling are drawn as fitted; dust and carbon wait for 0.0.8.
//   - 0.0.7 (the build sheet 0.0.7 §2.5 (a): the shot at distance): the SO-4's turrets and what the holder believes of
//     them, drawn only where they matter (a course at distance, the lever at 4×, a turret off its zero, a hold; so
//     test-handling's card stays as scored): the elevation turret on the tube and the windage on its side, each
//     with a mark that turns with its clicks; over the rifle the dial from the believed zero ("▼3 ◀1", clicks of
//     0.1 mrad; "0 0" on the zero), the lever's power ("4×") at the right, and under them the line's dope as believed
//     ("300 ▼3", its clicks from the zero, ticked "✓" when the turrets are on it, else the clicks still to go: "300 ▼2 TO GO");
//     while the rifle is being zeroed (the KD course's 25 m zero, until the coach accepts it: shot.js zeroingOf, passed
//     as zeroing { from }) the dial counts the clicks dialled in this zero from the turrets as issued, "ZEROING ▲4 ◀2"
//     ("ZEROING · NONE" before any), since a dialled call moves the believed zero with the turrets and the dial from it
//     read "ON ZERO" after every call (the user's report, 2026-11-07: "I dialed in the coaches corrections, the UI still
//     says that I'm on zero ?");
//     a small reticle at the top right with the hold as the aim's offset: the crosshair is where you aim, the target's
//     dot sits where the hold puts it (a hold 0.5 mil right puts the target 0.5 mil left of the crosshair: HOLD_PX_PER_MIL
//     a mil, 0.5 mil ticks). The turrets are seen, so the clicks are the gun's own (beliefOf passes them through); the
//     zero and the dope are beliefs, never the rifle's true zero (ui-truth).
// paintWeaponCard({ model, belief, k = 1, distance = false, line = null, hold = null, zeroing = null }) → { w, h, data, px } (a Pixmap: little-endian RGBA words,
// ImageData's order, alpha 255 or 0; px the same array, the sheet's name for it), k an integer scale.
// cardParts(belief) → the glyphs it will draw (for the tests: every glyph read from the belief alone).
// Pure: no DOM, no three.js.
import { paint } from './paint.js';
import { text, textWidth } from './font.js';
import { tone } from './tone.js';

/** The card, pixels (the hud's STEPS card: the sheet's §4). */
export const CARD_W = 180, CARD_H = 148;
/** The rifle's density on the card: the close figure's (VIEWS §4.1: 9 × 16 px/m). */
export const CARD_PX_PER_M = 144;

const BG = 0x2b2e3a, WALL = 0x383c4a, SHADOW = 0x1f2029, INK = 0x14151c;
const POLY = 0x282b34, POLY_L = 0x3e424d, STEEL = 0x6e7582, STEEL_L = 0x9aa1ae, STEEL_D = 0x49403e;
const BRASS = 0xd0ac5e, BRASS_L = 0xf0d48a, DUMMY = 0xe08a3a, AMBER = 0xe7b84a, RED = 0xb45150, MARK = 0xdad0bc, DIM = 0x565b67, SLING = 0x4c633d;
const COPPER = 0xb8643a, TRACER_TIP = 0xc23b2e, SKIN = 0xb0806a, SKIN_D = 0x8a5e4c;
/** The HAD-30's capacity (the arms role's FAMILIES.had30.n): the window's full height. */
const MAG_N = 30;
/** The HAD-30 as drawn (see the header): metres shown below the well, metres hidden in it, its width and its forward curve in card pixels. */
export const MAG_SHOWN_M = 0.165, MAG_HIDDEN_M = 0.045, MAG_W_PX = 7, MAG_CURVE_PX = 8;
const FEEL_CARD = Object.freeze({ none: 'NONE', few: 'A FEW', half: 'HALF', most: 'NEARLY', full: 'FULL' });

/** The reticle's pixels a mil of hold, and its half-width in mils (the stop's HOLD_MAX_MRAD 3: the sheet's §4). */
export const HOLD_PX_PER_MIL = 3, HOLD_MAX_MIL = 3;
/** The distance rows: the dial's and the dope's top (px), at the words' scale. */
export const DIAL_Y = 3, DOPE_Y = 16;

const clicksOf = (o) => ({ elev: Math.round(Number(o?.elev) || 0), wind: Math.round(Number(o?.wind) || 0) });
/**
 * The distance parts, from the belief alone and the hold: { dial: { elev, wind } (the turrets from the believed zero;
 * while zeroing, from zeroing.from, the turrets as issued), zeroing (true while the rifle is being zeroed), sight, zero
 * (null: the card's, the turrets at issue), optic, line, dope (the line's believed setting, or null), toGo ({ elev, wind }
 * to the dope, or null), onDope, hold: { xMil, yMil } } or null when nothing at distance shows.
 */
export function distanceParts(belief = {}, { distance = false, line = null, hold = null, zeroing = null } = {}) {
  const b = belief ?? {};
  const sight = clicksOf(b.sight), zero = b.zero ? clicksOf(b.zero) : null, optic = b.optic === 4 ? 4 : 1;
  const h = hold && (Number(hold.xMil) || Number(hold.yMil)) ? { xMil: Number(hold.xMil) || 0, yMil: Number(hold.yMil) || 0 } : { xMil: 0, yMil: 0 };
  const z = zero ?? { elev: 0, wind: 0 };
  // (shown where it matters: a course at distance, the lever at 4×, a turret off the zero, a hold; a zero believed at the
  // turrets' setting is every rifle's at issue, so it alone shows nothing: test-handling's card as scored)
  const shows = distance || optic === 4 || sight.elev || sight.wind || sight.elev !== z.elev || sight.wind !== z.wind || h.xMil || h.yMil;
  if (!shows) return null;
  // (while zeroing, the clicks dialled in this zero from where it started (see the header), else from the believed zero)
  const from = zeroing?.from ? clicksOf(zeroing.from) : z;
  const dial = { elev: sight.elev - from.elev, wind: sight.wind - from.wind };
  const at = line && b.dope?.[line] ? clicksOf(b.dope[line]) : null;
  const toGo = at ? { elev: at.elev - sight.elev, wind: at.wind - sight.wind } : null;
  const dope = at ? { elev: at.elev - z.elev, wind: at.wind - z.wind } : null;
  return { dial, zeroing: !!zeroing?.from, sight, zero, optic, line: at ? line : null, dope, toGo, onDope: !!toGo && !toGo.elev && !toGo.wind, hold: h };
}

/** What the card draws, read from the belief alone: { mag, count, approx, load, chamber, port, locked, mode, mark, seen, hand, far }. */
export function cardParts(belief = {}, opts = {}) {
  const b = belief ?? {};
  const magIn = b.mag !== 'out';
  const known = magIn && Number.isFinite(b.count);
  const portOpen = b.port === true || b.port === 'open' || !!b.locked;
  const seen = b.stoppage === 'case' || b.stoppage === 'double' ? b.stoppage : b.chamber === 'case' ? 'case' : null;
  const felt = ['click', 'dead', 'felt'].includes(b.stoppage) ? b.stoppage : null;
  return {
    mag: magIn ? 'in' : 'out', count: known ? Math.max(0, Math.min(MAG_N, b.count)) : null, approx: known && !!b.countApprox,
    chamber: b.chamber ?? '?', port: portOpen ? 'open' : 'shut', locked: !!b.locked, mode: b.mode ?? 'safe',
    mark: felt ? '!' : b.chamber === '?' ? '?' : null, seen, load: magIn ? b.magLoad ?? null : null,
    hand: b.hand ? { count: Number.isFinite(b.hand.n) ? Math.max(0, Math.min(MAG_N, b.hand.n)) : null, approx: !!b.hand.approx, load: b.hand.load ?? null, feel: b.hand.feel ?? null } : null,
    far: distanceParts(b, opts),
  };
}

// (the font has no "?" or "≈": the card's own, 3 × 5, as the font draws; the plaque's ≈)
const EXTRA = { '?': ['###', '..#', '.##', '...', '.#.'], '≈': ['.#.#', '#.#.', '....', '.#.#', '#.#.'],
  // (0.0.7: the turrets' arrows and the dope's tick, 5 × 5 as the font's letters stand)
  '▲': ['.....', '..#..', '.###.', '#####', '.....'], '▼': ['.....', '#####', '.###.', '..#..', '.....'],
  '◀': ['..#', '.##', '###', '.##', '..#'], '▶': ['#..', '##.', '###', '##.', '#..'], '✓': ['....#', '...#.', '#.#..', '.#...', '.....'],
  '×': ['...', '#.#', '.#.', '#.#', '...'],
  // (the zeroing dial's seam: "ZEROING · NONE")
  '·': ['.', '.', '#', '.', '.'] };
// (a word at n pixels a font pixel: the card's words at twice the letter, the runtime and design reviews': at 1×
// "SEMI" and the count were 7 screen px tall at 1600 × 900, and shrunk at 1024 × 768 they dropped columns)
function say(px, x, y, str, c, n = 1) {
  const dot = n === 1 ? px : (X, Y, w, h, col) => px(x + (X - x) * n, y + (Y - y) * n, w * n, h * n, col);
  let cx = x;
  for (const ch of String(str)) {
    const g = EXTRA[ch];
    if (g) { g.forEach((row, j) => [...row].forEach((v, i) => { if (v === '#') dot(cx + i, y + j, 1, 1, c); })); cx += g[0].length + 1; }
    else { text(dot, cx, y, ch, c); cx += textWidth(ch) + 1; }
  }
}
const sayWidth = (str) => [...String(str)].reduce((a, ch) => a + (EXTRA[ch] ? EXTRA[ch][0].length + 1 : textWidth(ch) + 1), -1);
/** The card's words' letter scale and their baseline's top (px): the mode under the stock, the count under the magazine. */
export const WORD_K = 2, WORD_Y = 112;

// (the rifle's stations along its length, metres from the butt, and its heights above and below the bore, metres)
const M = (m) => Math.round(m * CARD_PX_PER_M);

/** The card for a belief (see the header). */
export function paintWeaponCard({ model = 'r7', belief = {}, k = 1, distance = false, line = null, hold = null, zeroing = null } = {}) {
  const P = cardParts(belief, { distance, line, hold, zeroing });
  const base = paint(CARD_W, CARD_H, (px, w, h) => {
    // The backdrop: the doll's wall and floor (VIEWS §4.1), the rifle's shadow thrown a little right.
    px(0, 0, w, h, BG);
    px(0, 0, w, Math.round(h * FLOOR_K), WALL);
    px(0, Math.round(h * FLOOR_K), w, 1, tone(WALL, -0.15));
    const layer = paint(w, h, (q) => rifle(q, P, model));
    // (the shadow: the silhouette, offset, on the floor's colour)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = layer.data[y * w + x];
      if ((v >>> 24) >= 128 && x + 3 < w && y + 5 < h) px(x + 3, y + 5, 1, 1, SHADOW);
    }
    // (the ink outline round the rifle, then the rifle)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if ((layer.data[y * w + x] >>> 24) >= 128) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < w && Y < h && (layer.data[Y * w + X] >>> 24) >= 128; });
      if (near) px(x, y, 1, 1, INK);
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = layer.data[y * w + x];
      if ((v >>> 24) >= 128) px(x, y, 1, 1, ((v & 0xff) << 16) | (v & 0xff00) | ((v >>> 16) & 0xff));
    }
    marks(px, P);
    if (P.far) farMarks(px, P.far);
  });
  // (opaque everywhere, alpha 255: the hud puts it straight into an ImageData)
  const W = CARD_W * k, H = CARD_H * k, data = new Uint32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) data[y * W + x] = (base.data[Math.floor(y / k) * CARD_W + Math.floor(x / k)] | 0xff000000) >>> 0;
  return { w: W, h: H, data, px: data };
}

// The R-7 at CARD_PX_PER_M, its bore along y = Y0, its butt at x = X0. (0.0.6, the fixer's: the rifle 6 px higher and the
// floor's line at FLOOR_K of the card, so the magazine seated or in the hand hangs clear of the line and the words under it:
// its baseplate had crossed into the SAFE / 5 TR row)
const X0 = 22, Y0 = 56;
/** The wall's share of the card's height, its floor's line under it (v0.0.6's 0.62). */
const FLOOR_K = 0.69;
const at = (m) => X0 + M(m);

function rifle(px, P, model) {
  void model;
  // (the sling under it, stock to handguard, slack)
  for (let x = at(0.08); x < at(0.62); x++) { const t = (x - at(0.08)) / (at(0.62) - at(0.08)), y = Y0 + 14 + Math.round(Math.sin(t * Math.PI) * 9); px(x, y, 1, 2, SLING); }
  // The stock: a butt pad, the body tapering to the receiver, a cheek riser.
  for (let x = at(0); x < at(0.24); x++) {
    const t = (x - at(0)) / M(0.24), top = Math.round(Y0 - 9 + t * 4), bot = Math.round(Y0 + 10 - t * 6);
    px(x, top, 1, bot - top, POLY);
    px(x, top, 1, 1, POLY_L);
  }
  px(at(0), Y0 - 9, 3, 19, 0x14151c);
  px(at(0.07), Y0 + 1, M(0.1), 2, tone(POLY, -0.2));
  // The lower receiver: the pistol grip angled back, the trigger and its guard, the magazine well.
  for (let j = 0; j < M(0.11); j++) px(at(0.28) - Math.round(j * 0.35), Y0 + 6 + j, 6, 1, j % 5 === 0 ? POLY_L : POLY);
  px(at(0.24), Y0 + 2, M(0.25), 7, STEEL_D);
  px(at(0.24), Y0 + 2, M(0.25), 1, STEEL);
  px(at(0.33), Y0 + 9, M(0.06), 1, STEEL_D); px(at(0.39), Y0 + 7, 1, 3, STEEL_D);
  px(at(0.345), Y0 + 7, 1, 3, STEEL_L);
  // The upper receiver: the bore's body, the charging handle at its back, the port on its right side.
  px(at(0.24), Y0 - 6, M(0.28), 9, STEEL);
  px(at(0.24), Y0 - 6, M(0.28), 1, STEEL_L);
  px(at(0.24) - 3, Y0 - 6, 4, 2, STEEL_L);
  // (the forward assist and the case deflector, small)
  px(at(0.375), Y0 - 3, 3, 3, STEEL_D);
  // The handguard, vented, the gas block, the barrel, the muzzle device.
  px(at(0.52), Y0 - 5, M(0.26), 10, POLY);
  px(at(0.52), Y0 - 5, M(0.26), 1, POLY_L);
  for (let x = at(0.55); x < at(0.76); x += 5) px(x, Y0 - 2, 3, 2, 0x14151c);
  px(at(0.78), Y0 - 2, M(0.1), 4, STEEL_D);
  px(at(0.78), Y0 - 2, M(0.1), 1, STEEL);
  px(at(0.88), Y0 - 3, M(0.04), 6, STEEL_D);
  px(at(0.88), Y0 - 3, M(0.04), 1, STEEL_L);
  // The SO-4 on its mount: the tube, the turret, the objective's bell, the glass.
  px(at(0.31), Y0 - 10, M(0.18), 4, STEEL_D);
  px(at(0.30), Y0 - 16, M(0.2), 6, POLY);
  px(at(0.30), Y0 - 16, M(0.2), 1, POLY_L);
  px(at(0.47), Y0 - 18, M(0.04), 10, POLY);
  px(at(0.39), Y0 - 19, 4, 3, POLY_L);
  // (0.0.7: the turrets, where the card shows the distance: the elevation's knob on the tube and the windage's beside it, each
  // with its mark turned by its clicks (a click a pixel round its face, so a dial is seen to move))
  if (P.far) {
    const ex = at(0.37), ey = Y0 - 22;
    px(ex, ey, 7, 5, POLY); px(ex, ey, 7, 1, POLY_L); px(ex + 1, ey + 5, 5, 1, STEEL_D);
    px(ex + ((P.far.sight.elev % 7) + 7) % 7, ey + 1, 1, 2, MARK);
    const wx = at(0.41), wy = Y0 - 15;
    px(wx, wy, 5, 5, POLY_L); px(wx, wy, 5, 1, STEEL_L);
    px(wx + 2, wy + 1 + ((P.far.sight.wind % 3) + 3) % 3, 1, 1, MARK);
  }
  px(at(0.51) - 1, Y0 - 17, 1, 8, 0x3c5d84);
  px(at(0.30) - 1, Y0 - 15, 1, 4, 0x3c5d84);
  // The magazine: in its well, curving forward, its window to the count believed; one in the hand under the handguard.
  if (P.mag === 'in') magazine(px, at(0.40), Y0 + 8, { count: P.count, approx: P.approx, load: P.load });
  else px(at(0.40), Y0 + 8, M(0.07), 2, 0x14151c);
  if (P.hand) handMag(px, P.hand);
  // The selector, above the grip: its lever toward the believed mode.
  const sx = at(0.30), sy = Y0 + 4;
  px(sx - 1, sy - 1, 3, 3, STEEL_D);
  const lever = { safe: [1, 0], semi: [0, -1], auto: [-1, 0] }[P.mode] ?? [1, 0];
  for (let i = 1; i <= 4; i++) px(sx + lever[0] * i - (lever[1] ? 0 : 0), sy + lever[1] * i, lever[1] ? 2 : 1, lever[1] ? 1 : 2, i === 4 ? MARK : STEEL_L);
  // The ejection port: its cover shut or open; what is seen in it.
  const portX = at(0.40), portY = Y0 - 3, portW = M(0.08), portH = 4;
  if (P.port === 'open') {
    px(portX, portY, portW, portH, 0x14151c);
    px(portX, portY + portH, portW, 2, STEEL_L);                                 // (the cover, hinged down)
    if (P.locked) { px(portX, portY, 3, portH, STEEL_L); px(portX + 3, portY, 1, portH, STEEL); }   // (the bolt's face, back)
    if (!P.seen && (P.chamber === 'live' || P.chamber === 'dud')) {
      const c = P.chamber === 'dud' ? DUMMY : BRASS;
      px(portX + portW - 6, portY + 1, 5, 2, c); px(portX + portW - 6, portY + 1, 5, 1, P.chamber === 'dud' ? tone(DUMMY, 0.2) : BRASS_L);
    }
  } else {
    px(portX, portY, portW, portH, STEEL_D);
    px(portX, portY, portW, 1, STEEL_L);
    if (P.chamber === 'live' || P.chamber === 'dud') px(portX + portW - 2, portY + portH - 1, 2, 1, P.chamber === 'dud' ? DUMMY : BRASS_L);   // (the glint at the cover's edge)
  }
  if (P.seen === 'case') {
    // (a stovepipe: the spent case standing up out of the port, its mouth up)
    px(portX + portW - 7, portY - 8, 4, 9, BRASS);
    px(portX + portW - 7, portY - 8, 4, 1, BRASS_L); px(portX + portW - 4, portY - 8, 1, 9, tone(BRASS, -0.2));
  } else if (P.seen === 'double') {
    // (a double feed: two rounds in the port, one over the other, their tips crossed)
    px(portX + 1, portY, portW - 2, 2, BRASS); px(portX + portW - 3, portY, 2, 2, 0xc28b4a);
    px(portX + 2, portY + 2, portW - 3, 2, BRASS_L); px(portX + portW - 2, portY + 2, 2, 2, 0xc28b4a);
  }
}

// (a HAD-30 hanging from (x0, y0) (see the header): its body MAG_SHOWN_M long and MAG_W_PX wide, curving forward, a
// polymer window along its side with the rounds believed in it from the top (the top one's tip by its kind), its
// baseplate; a count unknown, "?" on it. Returns its baseplate's place.)
function magazine(px, x0, y0, { count = null, approx = false, load = null } = {}) {
  const len = M(MAG_SHOWN_M), w = MAG_W_PX;
  const cells = [];
  for (let j = 0; j < len; j++) {
    const t = j / len, x = x0 + Math.round(t * t * MAG_CURVE_PX), y = y0 + j;
    px(x, y, w, 1, POLY);
    px(x, y, 1, 1, POLY_L);
    cells.push([x + 2, y]);
  }
  const bx = cells.at(-1)[0] - 2, by = cells.at(-1)[1] + 1;
  px(bx - 1, by, w + 2, 2, POLY_L);                                              // (the baseplate)
  // (the window: a strip down the body; the rounds believed in it, from the top, brass)
  const top = 2, rows = len - top - 3;
  for (let j = 0; j < rows; j++) { const [x, y] = cells[top + j]; px(x, y, 3, 1, 0x1d2b46); }
  if (count === null) {
    say(px, bx + 2, by - 8, '?', AMBER);
    return { bx, by };
  }
  const fill = count > 0 ? Math.max(1, Math.round(rows * count / MAG_N)) : 0;
  for (let j = 0; j < fill; j++) {
    const [x, y] = cells[top + j], last = j >= fill - 2 && approx;
    if (last && (x + y) % 2) continue;                                          // (an approximate count: its top dithered)
    px(x, y, 3, 1, j % 2 ? BRASS : BRASS_L);
  }
  // (the top round's nose at the feed lips: a tracer's red, ball's bare copper, when the kind is believed)
  if (fill && load) { const [x, y] = cells[top]; px(x + 2, y, 1, 1, load === 'tracer' ? TRACER_TIP : COPPER); }
  return { bx, by };
}

// (the magazine in the support hand, held under the handguard as it comes to the well: its knuckles round its middle)
const HAND_X = 116, HAND_Y = Y0 + 16;
function handMag(px, H) {
  magazine(px, HAND_X, HAND_Y, { count: H.count, approx: H.approx, load: H.load });
  const my = HAND_Y + Math.round(M(MAG_SHOWN_M) * 0.45);
  px(HAND_X - 2, my, MAG_W_PX + 4, 4, SKIN); px(HAND_X - 2, my + 3, MAG_W_PX + 4, 1, SKIN_D); px(HAND_X - 2, my, 1, 4, SKIN_D);
}

function marks(px, P) {
  // The selector's marks round its pivot (S forward, 1 up, A back: a dot each, the believed one lit), and
  // the mode's word on the floor under the stock, white on safe and red off it.
  const sx = at(0.30), sy = Y0 + 4, dots = { safe: [sx + 6, sy], semi: [sx, sy - 6], auto: [sx - 6, sy] };
  for (const [mode, [x, y]] of Object.entries(dots)) px(x, y, 1, 1, mode === P.mode ? (mode === 'safe' ? MARK : RED) : DIM);
  const word = { safe: 'SAFE', semi: 'SEMI', auto: 'AUTO' }[P.mode] ?? String(P.mode).toUpperCase();
  say(px, X0 - 6, WORD_Y, word, P.mode === 'safe' ? MARK : RED, WORD_K);
  // The port's "?" (never checked) or "!" (a stoppage felt, not yet looked at), above the receiver over the port.
  if (P.mark) say(px, at(0.43), Y0 - 13, P.mark, AMBER);
  // The magazine's believed count beside its baseplate ("≈" when it is a guess), "MAG OUT" with none, in the
  // words' colour (it had been the dim grey of an unlit mark, hard to read on the slate).
  // (with a magazine in the hand the empty well says MAG OUT by itself, and the hand's words take the right)
  const label = P.mag === 'out' ? (P.hand ? '' : 'MAG OUT') : P.count === null ? '' : `${P.approx ? '≈' : ''}${P.count}`;
  if (label) say(px, P.mag === 'out' ? CARD_W - 4 - sayWidth(label) * WORD_K : at(0.40) + 12, WORD_Y, label, MARK, WORD_K);
  if (label && P.mag === 'in' && P.load === 'tracer' && !P.hand) say(px, at(0.40) + 12 + (sayWidth(label) + 2) * WORD_K, WORD_Y, 'TR', RED, WORD_K);
  // (the hand's magazine: its count believed, else its weight's band, else "?"; "TR" in red when believed tracer)
  if (P.hand) {
    const H = P.hand, word = H.count !== null ? `${H.approx ? '≈' : ''}${H.count}` : H.feel ? FEEL_CARD[H.feel] ?? '?' : '?';
    const x = HAND_X - 4;
    say(px, x, WORD_Y, word, MARK, WORD_K);
    if (H.load === 'tracer') say(px, x + (sayWidth(word) + 2) * WORD_K, WORD_Y, 'TR', RED, WORD_K);
  }
}

// (the distance rows over the rifle (see the header): the dial from the believed zero, the lever's power, the line's dope,
// the reticle with the hold; the words at WORD_K, every number a belief's or a turret's)
const signArrows = (n, up, down) => (n > 0 ? `${up}${n}` : n < 0 ? `${down}${-n}` : '0');
export function dialWords(F) {
  if (!F) return null;
  // (the elevation first, the windage after it only when off; both on the zero: "ON ZERO"; while zeroing, "ZEROING ▲4 ◀2",
  // "ZEROING · NONE" before a click: the clicks dialled in this zero)
  const none = !F.dial.elev && !F.dial.wind, clicks = [F.dial.elev ? signArrows(F.dial.elev, '▲', '▼') : '0', F.dial.wind ? signArrows(F.dial.wind, '▶', '◀') : null].filter(Boolean).join(' ');
  const dial = F.zeroing ? (none ? 'ZEROING · NONE' : `ZEROING ${clicks}`) : none ? 'ON ZERO' : clicks;
  const dope = F.line ? `${F.line} ${signArrows(F.dope.elev, '▲', '▼')}${F.dope.wind ? ` ${signArrows(F.dope.wind, '▶', '◀')}` : ''}` : null;
  const toGo = F.toGo && !F.onDope ? `${signArrows(F.toGo.elev, '▲', '▼')}${F.toGo.wind ? ` ${signArrows(F.toGo.wind, '▶', '◀')}` : ''}` : null;
  return { dial, power: `${F.optic}×`, dope, toGo, onDope: F.onDope };
}
const RET_X = 162, RET_Y = 28, RET_R = 10;
function farMarks(px, F) {
  const w = dialWords(F);
  say(px, 4, DIAL_Y, w.dial, MARK, WORD_K);
  say(px, CARD_W - 4 - sayWidth(w.power) * WORD_K, DIAL_Y, w.power, F.optic === 4 ? AMBER : DIM, WORD_K);
  if (w.dope) {
    say(px, 4, DOPE_Y, w.dope, AMBER, WORD_K);
    const x = 4 + (sayWidth(w.dope) + 3) * WORD_K;
    if (w.onDope) say(px, x, DOPE_Y, '✓', 0x5fbf7e, WORD_K);
    else if (w.toGo) say(px, x, DOPE_Y, w.toGo, RED, 1), say(px, x, DOPE_Y + 6, 'TO GO', RED, 1);
  }
  // (the reticle: its circle and crosshair, ticks every 0.5 mil; the target's dot where the hold puts it)
  for (let a = 0; a < 64; a++) { const t = a / 64 * Math.PI * 2; px(Math.round(RET_X + Math.cos(t) * RET_R), Math.round(RET_Y + Math.sin(t) * RET_R), 1, 1, STEEL_L); }
  px(RET_X - RET_R + 1, RET_Y, 2 * RET_R - 1, 1, INK); px(RET_X, RET_Y - RET_R + 1, 1, 2 * RET_R - 1, INK);
  for (let m = -HOLD_MAX_MIL; m <= HOLD_MAX_MIL; m += 0.5) {
    if (!m) continue;
    const d = Math.round(m * HOLD_PX_PER_MIL), long = Number.isInteger(m);
    px(RET_X + d, RET_Y - (long ? 1 : 0), 1, long ? 3 : 2, INK); px(RET_X - (long ? 1 : 0), RET_Y + d, long ? 3 : 2, 1, INK);
  }
  const hx = Math.max(-HOLD_MAX_MIL, Math.min(HOLD_MAX_MIL, F.hold.xMil)), hy = Math.max(-HOLD_MAX_MIL, Math.min(HOLD_MAX_MIL, F.hold.yMil));
  const tx = RET_X - Math.round(hx * HOLD_PX_PER_MIL), ty = RET_Y + Math.round(hy * HOLD_PX_PER_MIL);
  px(tx - 1, ty - 1, 3, 3, RED); px(tx, ty, 1, 1, INK);
}
