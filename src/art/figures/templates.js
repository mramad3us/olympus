// OLYMPUS art: the figures' templates. Heads, faces, hair and head gear in role letters, and the guns' shapes.
//
// tradecraft drew its people's heads as templates of role letters on a 15 × 12 head (14 wide side on),
// in three views (src/art/sprites.js T: down, facing the camera; up, the back; right, the profile; left
// the right mirrored, which a head may be). Those templates are the reference here, copied as they are
// (REF), and the gear OLYMPUS needs and tradecraft never drew (the utility cover, the light vac suit's
// helmet with its visor, the neck ring, a miner's hard hat with its lamp) is drawn at the same reference
// size, pixel by pixel, in the same letters. headKit() then fits the reference to a head of any size
// (the chibi's at 16 px/m is the reference itself; at 24 px/m it is 23 × 18) by resampling each
// template's pixels round the head's box (nearest, so shapes stay solid and
// edges stay single pixels), and lays the face on by rule, not by resampling: eyes, brows and a mouth
// placed at the reference's fractions of the head and sized to it (one by two pixels on the reference,
// two by three with a glint on the chibi at 24 px/m).
//
// The cuts (0.0.6): each regulation cut is its top (a part over the head, h) and its sides (k, painted on the head by the
// cut's drawn step: skin fresh, then ĥ a shadow, ħ a dark, h the hair's colour; compose.js head()), a woman's short cut its
// growth at the locks and the nape a row a step, a bun or a braid stray pixels out of regulation (step 3); every top a pixel
// taller at step 3 (compose.js draws it twice).
// Letters (VIEWS.md 3.1, shade.js): s skin, h hair, ĥ and ħ short hair over skin (0.0.6), a hat, ð seal rings, þ visor glass, ¤ a lamp (glows),
// and fixed: e an eye, o its glint, b a brow (the hair's darkest), z the mouth (the skin's darkest), l a
// lens' glint. An upper-case role letter is forced into shade.
//
// The guns are shapes in tradecraft's pixels at 16 px/m (its rifle 16 long: stock, receiver with its lit
// top, the optic OLYMPUS adds, grip, a magazine curving forward, handguard, barrel, front sight), each
// part [along0, along1, across0, across1, letter] (spans inclusive; across is down when level), scaled to
// the gun's length and the density by shapeAt(). The flash is tradecraft's FLASH, scaled the same way.
// 0.0.6 (the user, 2026-11-07: "the magazines are very long, if they could be a bit slicker"): the rifle's
// magazine is one reference pixel wide, stepping forward a pixel as it goes down, two below the receiver
// (v0.0.5's was a four-pixel hook, three along): at 16 px/m two pixels on a 16-pixel rifle (each 6.25 cm of
// the 1.0 m drawn rifle: 12.5 cm below the well, 6 cm front to back, the HAD-30's own 6.5), at 24 px/m a
// 2 × 3 band; the doll's rifle (doll.js, acrossK 2.4) takes the same shape.
// Pure.

// ---------- the reference (tradecraft's 15 × 12 head at [4, 7] facing the camera, 14 × 12 at [5, 7] side on) ----------

const HEAD_DOWN = ['.....sssss.....', '...sssssssss...', '..sssssssssss..', '.sssssssssssss.', '.sssssssssssss.', '.sssssssssssss.',
  'sssssssssssssss', 'sssssssssssssss', '.sssssssssssss.', '.sssssssssssss.', '..sssssssssss..', '....sssssss....'];
const HEAD_RIGHT = ['....ssssss....', '..ssssssssss..', '.ssssssssssss.', 'sssssssssssss.', 'sssssssssssss.', 'sssssssssssss.',
  'ssssssssssssss', 'ssssssssssssss', 'sssssssssssss.', '.ssssssssssss.', '..ssssssssss..', '....sssssss...'];
/** The reference head box: 15 × 12 facing the camera and from behind, 14 × 12 side on. */
export const REF = Object.freeze({ w: 15, sideW: 14, h: 12 });

// Templates as [dx, dy, rows] from the head box's top-left (tradecraft's [x, y] less the head's [4, 7] or [5, 7]).
const T = {
  // The regulation cuts (0.0.6; CAREER §2; the user, 2026-11-06: "this haircut is not military acceptable"): each cut's top,
  // the hair a barber leaves long, as a part over the head (the shaved head has none). The men's tops grow from high and tight
  // (a narrow patch on the crown, the sides bare high) through low regulation to medium regulation (v0.0.4's crew); the
  // women's short (v0.0.4's), the regulation bun (v0.0.4's) and a braid pinned up round the crown, its crossings in shade (H).
  hair: {
    // (0.0.6, the fixer's: the fronts narrower than the head, skin at the temples, so a fresh cut never reads as a cap)
    highTight: {
      down: [0, -1, ['.....hhhhh.....', '....hhhhhhh....', '....hhhhhhh....', '.....hhhhh.....']],
      up: [0, -1, ['.....hhhhh.....', '....hhhhhhh....', '...hhhhhhhhh...', '...hhhhhhhhh...', '.....hhhhh.....']],
      right: [0, -1, ['....hhhhhh....', '...hhhhhhhhh..', '...hhhhhhhhhh.', '....hhhhhhhh..']],
    },
    lowReg: {
      down: [0, -1, ['....hhhhhhh....', '...hhhhhhhhh...', '...hhhhhhhhh...', '...hhhhhhhhh...']],
      up: [0, -1, ['....hhhhhhh....', '...hhhhhhhhh...', '..hhhhhhhhhhh..', '.hhhhhhhhhhhhh.', '.hhhhhhhhhhhhh.', '..hhhhhhhhhhh..']],
      right: [-1, -1, ['.....hhhhhh....', '...hhhhhhhhhh..', '..hhhhhhhhhhhh.', '..hhhhhhhhhhhh.', '...hhhhhhhhh...']],
    },
    medReg: {
      down: [0, -1, ['....hhhhhhh....', '...hhhhhhhhh...', '..hhhhhhhhhhh..', '.hhhhhhhhhhhhh.', '.hhhhhhhhhhhhh.']],
      up: [0, -1, ['....hhhhhhh....', '...hhhhhhhhh...', '..hhhhhhhhhhh..', '.hhhhhhhhhhhhh.', '.hhhhhhhhhhhhh.', '.hhhhhhhhhhhhh.', '.hhhhhhhhhhhhh.']],
      right: [-1, -1, ['.....hhhhhh....', '...hhhhhhhhhh..', '..hhhhhhhhhhhh.', '.hhhhhhhhhhhhh.', '.hhhhhhhhhhhh..', '.hhhhhhhhh.....']],
    },
    shaved: {},
    bun: {
      down: [0, -5, ['......hhh......', '.....hhhhh.....', '......hhh......', '....hhhhhhh....', '..hhhhhhhhhhh..', '.hhhhhhhhhhhhh.', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhh.......hhhh', 'hh...........hh']],
      up: [0, -5, ['......hhh......', '.....hhhhh.....', '......hhh......', '....hhhhhhh....', '..hhhhhhhhhhh..', '.hhhhhhhhhhhhh.', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'shhhhhhhhhhhhhs', '.hhhhhhhhhhhhh.', '..hhhhhhhhhhh..']],
      right: [-3, -4, ['.hhh.............', 'hhhhh............', '.hhhhhhhhhhh.....', '.hhhhhhhhhhhhh...', '...hhhhhhhhhhhh..', '..hhhhhhhhhhhhhh.', '..hhhhhhhhhhhhh..', '..hhhhhhhhhhhh...', '..hhhhhhhhh......', '..hhhhhh.........', '..hhhh...........']],
    },
    short: {
      down: [0, -2, ['....hhhhhhh....', '..hhhhhhhhhhh..', '.hhhhhhhhhhhhh.', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhh.hhhhhhh.hhh', 'hh...........hh']],
      up: [0, -2, ['....hhhhhhh....', '..hhhhhhhhhhh..', '.hhhhhhhhhhhhh.', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'shhhhhhhhhhhhhs', 'shhhhhhhhhhhhhs', '.hhhhhhhhhhhhh.', '..hhhhhhhhhhh..']],
      right: [-1, -2, ['.....hhhhhh....', '...hhhhhhhhhh..', '..hhhhhhhhhhhh.', '.hhhhhhhhhhhhhh', 'hhhhhhhhhhhhhh.', 'hhhhhhhhhhhhh..', 'hhhhhhhhhhhh...', 'hhhhhhhh.......', 'hhhhh..........', 'hhhh...........', '.hhh...........']],
    },
    braid: {
      down: [0, -3, ['....hHhHhHh....', '..hhhhhhhhhhh..', '.hhhhhhhhhhhhh.', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhh.......hhhh', 'hh...........hh']],
      up: [0, -3, ['....hHhHhHh....', '..hhhhhhhhhhh..', '.hhhhhhhhhhhhh.', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'hhhHhHhHhHhHhhh', 'hhHhhhhhhhhhHhh', 'hhhHhHhHhHhHhhh', 'hhhhhhhhhhhhhhh', 'hhhhhhhhhhhhhhh', 'shhhhhhhhhhhhhs', '.hhhhhhhhhhhhh.', '..hhhhhhhhhhh..']],
      right: [-2, -3, ['...hHhHhHhh.....', '..hhhhhhhhhhhh..', '.hHhhhhhhhhhhhh.', '.Hhhhhhhhhhhhhh.', 'hHhhhhhhhhhhhh..', 'Hhhhhhhhhhhhh...', 'hHhhhhhhhhh.....', 'Hhhhhhhh........', 'hHhhhh..........', '.hhh............']],
    },
  },
  // The sides a cut leaves short, painted on the head itself (k): skin when fresh, then by the cut's drawn step a shadow (ĥ), a
  // dark (ħ) and the hair's own colour (h) as they grow out (VIEWS §3; the build sheet 0.0.6 §2.2); under a cover they show
  // where the cover leaves the head bare. The shaved head's is the whole scalp.
  sides: {
    highTight: {
      down: [0, 1, ['...k.......k...', '..kk.......kk..', '.kkk.......kkk.', '.kk.........kk.', '.k...........k.']],
      up: [0, 1, ['kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk']],
      right: [0, 1, ['..k...........', '.kkk..........', 'kkkkkkkk......', 'kkkkkkkk......', 'kkkkkkk.......', 'kkkk..........', 'kkkk..........', 'kkkk..........', '.kkk..........']],
    },
    lowReg: {
      down: [0, 3, ['.kk.........kk.', '.kk.........kk.', '.k...........k.']],
      up: [0, 4, ['kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk']],
      right: [0, 3, ['kk............', 'kkkkkkkk......', 'kkkkkkk.......', 'kkkk..........', 'kkkk..........', 'kkkk..........', '.kkk..........']],
    },
    medReg: {
      down: [0, 4, ['.kk.........kk.', '.k...........k.']],
      up: [0, 6, ['kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk']],
      right: [0, 5, ['kkkkkk........', 'kkkk..........', 'kkkk..........', 'kkkk..........', '.kkk..........']],
    },
    shaved: {
      down: [0, 0, ['kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkk.......kkkk', '.kk.........kk.', '.k...........k.']],
      up: [0, 0, ['kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk', 'kkkkkkkkkkkkkkk']],
      right: [0, 0, ['kkkkkkkkkkkkkk', 'kkkkkkkkkkkkkk', 'kkkkkkkkkkkk..', 'kkkkkkkkkk....', 'kkkkkkkk......', 'kkkkkkk.......', 'kkkk..........', 'kkkk..........', 'kkkk..........', '.kkk..........']],
    },
  },
  // A woman's short cut growing out: a row more at the side locks and the nape for each step (steps 1 to 3, each a template).
  grow: {
    short: {
      down: [[0, 6, ['hh...........hh']], [0, 7, ['hh...........hh']], [0, 8, ['h.............h']]],
      up: [[0, 10, ['..hhhhhhhhhhh..']], [0, 11, ['....hhhhhhh....']], [0, 12, ['.....hhhhh.....']]],
      right: [[-1, 9, ['hhhh...........']], [-1, 10, ['hhhh...........']], [-1, 11, ['.hhh...........']]],
    },
  },
  // Out of regulation, pinned-up hair works loose: stray pixels at the hairline and the nape (a bun's or a braid's step 3).
  stray: {
    bun: { down: [0, 3, ['h.............h', '...............', '.h...........h.']], up: [0, 7, ['h.............h', '...............', '.h...........h.']], right: [0, 5, ['h.............', '..............', 'h.............', '.h............']] },
    braid: { down: [0, 3, ['h.............h', '...............', '.h...........h.']], up: [0, 8, ['h.............h', '...............', '.h...........h.']], right: [0, 5, ['h.............', '..............', 'h.............', '.h............']] },
  },
  // (under a hat, a woman's short cut shows only at the temples, inside the head's outline; the men's tops not at all: tradecraft,
  // the user 2026-11-03; their sides show where the cover leaves the head bare)
  temples: { down: [0, 5, ['.h...........h.', 'h.............h']], right: [0, 5, ['hh.', 'h..']] },
  // (from behind, under a hat, a woman's short cut is a line of hair at the nape)
  nape: { up: [0, 4, ['.hhhhhhhhhhhhh.']], down: [0, 4, ['...............']], right: [0, 4, ['hhhh..........']] },
  hat: {
    // (the combat helmet: tradecraft's ballistic helmet, a dome to the brow, its sides over the ears, the rim darker)
    helmet: {
      down: [-1, -4, ['....aaaaaaaaa....', '..aaaaaaaaaaaaa..', '.aaaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', 'AAAAAAAAAAAAAAAAA', 'aa.............aa', 'aA.............Aa', 'A...............A']],
      up: [-1, -4, ['....aaaaaaaaa....', '..aaaaaaaaaaaaa..', '.aaaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', '.AAAAAAAAAAAAAAA.']],
      right: [-2, -4, ['....aaaaaaaaa.....', '..aaaaaaaaaaaaa...', '.aaaaaaaaaaaaaaa..', 'aaaaaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaaaaa.', 'aaaaaaaaaaaAAAAAA.', 'aaaaaaaaaaa.......', 'aaaaaaaaaaa.......', 'aaaaaaaaaa........', 'aaaaaaaaaA........', '.AAAAAAAA.........']],
    },
    // (the soft utility cover, my call: a flat crown a pixel proud of the head, its short brim a dark band over the brow, forward side on)
    cover: {
      down: [-1, -3, ['..aaaaaaaaaaaaa..', '.aaaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', '.AAAAAAAAAAAAAAA.', '..AAAAAAAAAAAAA..']],
      up: [-1, -3, ['..aaaaaaaaaaaaa..', '.aaaaaaaaaaaaaaa.', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaa', '.aaaaaaaaaaaaaaa.']],
      right: [-1, -3, ['...aaaaaaaaaaa.....', '.aaaaaaaaaaaaaa....', 'aaaaaaaaaaaaaaaa...', 'aaaaaaaaaaaaaaaa...', 'aaaaaaaaaaaaaaaAAAA', 'aaaaaaaaaaaaaaAAAA.', '.aaaaaaaa..........']],
    },
    // (a miner's hard hat: a dome with a brim all round, its lamp lit at the front)
    hardhat: {
      down: [-2, -5, ['......aaaaaaa......', '....aaaaaaaaaaa....', '...aaaaaaaaaaaaa...', '..aaaaaaaa¤aaaaaa..', '..aaaaaaa¤¤¤aaaaa..', '..aaaaaaaa¤aaaaaa..', '..aaaaaaaaaaaaaaa..', 'aaaaaaaaaaaaaaaaaaa', '.AAAAAAAAAAAAAAAAA.']],
      up: [-2, -5, ['......aaaaaaa......', '....aaaaaaaaaaa....', '...aaaaaaaaaaaaa...', '..aaaaaaaaaaaaaaa..', '..aaaaaaaaaaaaaaa..', '..aaaaaaaaaaaaaaa..', '..aaaaaaaaaaaaaaa..', 'aaaaaaaaaaaaaaaaaaa', '.AAAAAAAAAAAAAAAAA.']],
      right: [-3, -5, ['.......aaaaaa.......', '.....aaaaaaaaaa.....', '....aaaaaaaaaaaa....', '...aaaaaaaaaaaaaa¤..', '...aaaaaaaaaaaaaa¤¤.', '...aaaaaaaaaaaaaa¤..', '...aaaaaaaaaaaaaaa..', 'aaaaaaaaaaaaaaaaaaaa', '.AAAAAAAAAAAAAAAAAA.']],
    },
    // (the light vac suit's helmet, sealed: a shell a size up from the head, the visor's dark glass from
    // the brow to the chin with a glint at its upper left, the neck ring under it; side on, the visor
    // wraps the front half; behind, the shell and a lamp on its crown)
    vac: {
      down: [-2, -4, ['......aaaaaaa......', '...aaaaaaaaaaaaa...', '..aaaaaaaaaaaaaaa..', '.aaaaaaaaaaaaaaaaa.', '.aaaaaaaaaaaaaaaaa.',
        'aaaaþþþþþþþþþþþaaaa', 'aaaþlþþþþþþþþþþþaaa', 'aaaþþlþþþþþþþþþþaaa', 'aaaþþþþþþþþþþþþþaaa', 'aaaþþþþþþþþþþþþþaaa', 'aaaþþþþþþþþþþþþþaaa',
        'AaaaþþþþþþþþþþþaaaA', '.AaaaaaaaaaaaaaaaA.', '..ððððððððððððððð..']],
      up: [-2, -4, ['......aaaaaaa......', '...aaaaaaaaaaaaa...', '..aaaaaaaaaaaaaaa..', '.aaaaaaaaaaaaaaaaa.', '.aaaaaaaaaaaaaaaaa.',
        'aaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaa',
        'AaaaaaaaaaaaaaaaaaA', '.AAaaaaaaaaaaaaaAA.', '..ððððððððððððððð..']],
      right: [-2, -4, ['.....aaaaaaaa......', '...aaaaaaaaaaaa....', '..aaaaaaaaaaaaaa...', '.aaaaaaaaaaaaaaaa..', '.aaaaaaaaaaaaaaaa..',
        'aaaaaaaaaaaþþþþþþþ.', 'aaaaaaaaaaþþlþþþþþ.', 'aaaaaaaaaaþþþlþþþþ.', 'aaaaaaaaaaþþþþþþþþ.', 'aaaaaaaaaaþþþþþþþþ.', 'aaaaaaaaaaaþþþþþþþ.',
        'AaaaaaaaaaaaþþþþaA.', '.AAaaaaaaaaaaaaaA..', '..ðððððððððððððð...']],
    },
  },
};

// ---------- resampling the reference to a head of any size ----------

/**
 * A template [dx, dy, rows] (reference pixels from the head box's top-left) at a head box of bw × bh
 * (whose reference box is rw × REF.h): { x, y, rows } in the target's pixels from its box's top-left.
 * Nearest resampling about the box: each target pixel looks up the reference pixel its centre falls in.
 */
export function resample([dx, dy, rows], bw, bh, rw = REF.w, rh = REF.h) {
  const sx = bw / rw, sy = bh / rh, tw = rows[0].length, th = rows.length;
  const x0 = Math.floor(dx * sx + 1e-6), y0 = Math.floor(dy * sy + 1e-6);
  const x1 = Math.ceil((dx + tw) * sx - 1e-6), y1 = Math.ceil((dy + th) * sy - 1e-6);
  const out = [];
  for (let Y = y0; Y < y1; Y++) {
    let row = '';
    for (let X = x0; X < x1; X++) {
      const i = Math.floor((X + 0.5) / sx) - dx, j = Math.floor((Y + 0.5) / sy) - dy;
      row += i >= 0 && j >= 0 && i < tw && j < th ? rows[j][i] : '.';
    }
    out.push(row);
  }
  return { x: x0, y: y0, rows: out };
}
/** A template seen from the other side (left from right): its rows mirrored about the head box (bw wide); null stays null. */
export const mirror = (t, bw) => (t ? { x: bw - (t.x + t.rows[0].length), y: t.y, rows: t.rows.map(r => [...r].reverse().join('')) } : null);

const kits = new Map();
/** The cuts the kit draws (src/data/people/looks.js CUTS' ids, written twice: the art may not import the data's sim side). */
export const CUT_IDS = Object.freeze(Object.keys(T.hair));
/**
 * Everything on a head of `w` × `h` (sideW wide side on), by view ('down', 'up', 'right', 'left'):
 * { box: [w, h], head, face(eyes), hair[cut] (the top, null for the shaved head), sides[cut] (the short sides, k),
 * grow[cut] (steps 1 to 3), stray[cut], temples, nape, hat[kind] }, each { x, y, rows } from the box's top-left.
 */
export function headKit(w, sideW, h) {
  const key = `${w}x${sideW}x${h}`;
  if (kits.has(key)) return kits.get(key);
  const kit = {};
  for (const view of ['down', 'up', 'right']) {
    const bw = view === 'right' ? sideW : w, rw = view === 'right' ? REF.sideW : REF.w;
    const R = (t) => (t ? resample(t, bw, h, rw) : null);
    const v = {
      box: [bw, h],
      head: R([0, 0, view === 'right' ? HEAD_RIGHT : HEAD_DOWN]),
      hair: Object.fromEntries(Object.entries(T.hair).map(([k, s]) => [k, R(s[view] ?? s.down)])),
      sides: Object.fromEntries(Object.entries(T.sides).map(([k, s]) => [k, R(s[view] ?? s.down)])),
      grow: Object.fromEntries(Object.entries(T.grow).map(([k, s]) => [k, (s[view] ?? s.down).map(R)])),
      stray: Object.fromEntries(Object.entries(T.stray).map(([k, s]) => [k, R(s[view] ?? s.down)])),
      temples: R(T.temples[view] ?? T.temples.down),
      nape: R(T.nape[view] ?? T.nape.down),
      hat: Object.fromEntries(Object.entries(T.hat).map(([k, s]) => [k, R(s[view] ?? s.down)])),
      face: view === 'up' ? null : faceOf(view, bw, h, false),
      shut: view === 'up' ? null : faceOf(view, bw, h, true),
    };
    kit[view] = v;
  }
  const r = kit.right;
  kit.left = {
    box: r.box, head: mirror(r.head, r.box[0]),
    hair: Object.fromEntries(Object.entries(r.hair).map(([k, t]) => [k, mirror(t, r.box[0])])),
    sides: Object.fromEntries(Object.entries(r.sides).map(([k, t]) => [k, mirror(t, r.box[0])])),
    grow: Object.fromEntries(Object.entries(r.grow).map(([k, ts]) => [k, ts.map(t => mirror(t, r.box[0]))])),
    stray: Object.fromEntries(Object.entries(r.stray).map(([k, t]) => [k, mirror(t, r.box[0])])),
    temples: mirror(r.temples, r.box[0]), nape: mirror(r.nape, r.box[0]),
    hat: Object.fromEntries(Object.entries(r.hat).map(([k, t]) => [k, mirror(t, r.box[0])])),
    face: mirror(r.face, r.box[0]), shut: mirror(r.shut, r.box[0]),
  };
  kits.set(key, kit);
  return kit;
}

// ---------- faces, by rule ----------

/**
 * The face on a head box of w × h, as a template over the box (painted on the head, the same part):
 * facing the camera (down) or side on (right). The reference's fractions: brows at 0.42 of the height,
 * eyes from 0.5 (1 × 2 on the reference: a pixel a twelfth of the width, a sixth of the height), the
 * mouth at 0.75 between two shaded pixels; side on, the eye at 0.72 of the width, the ear at 0.3, the
 * nose at the front edge. shut: the eyes closed (a line where the eye's foot was).
 */
function faceOf(view, w, h, shut) {
  const rows = Array.from({ length: h }, () => Array(w).fill('.'));
  const put = (x, y, ch) => { if (x >= 0 && y >= 0 && x < w && y < h) rows[y][x] = ch; };
  const ew = Math.max(1, Math.round(w / 12)), eh = Math.max(1, Math.round(h / 6));
  const ey = Math.round(h * 0.5), by = ey - 1, my = Math.min(h - 2, Math.round(h * 0.75));
  const big = h >= 16, small = h < 9;
  const eye = (x0) => {
    if (shut) { for (let i = 0; i < ew; i++) put(x0 + i, ey + eh - 1, 'z'); return; }
    for (let j = 0; j < eh; j++) for (let i = 0; i < ew; i++) put(x0 + i, ey + j, 'e');
    if (big) put(x0 + ew - 1, ey, 'o');                              // (a glint, toward the light's side: Stoneshard's finish)
  };
  if (view === 'down') {
    const cx = (w - 1) / 2, dx = Math.round(w * 0.2);
    const left = Math.round(cx - dx - (ew - 1) / 2), right = Math.round(cx + dx - (ew - 1) / 2);
    eye(left); eye(right);
    if (!small) for (const x0 of [left, right]) for (let i = -1; i <= ew; i++) put(x0 + i, by, 'b');
    const mc = Math.round(cx), mw = big ? 2 : 1;
    if (!small) { put(mc - 1 - (mw - 1), my, 'S'); for (let i = 0; i < mw; i++) put(mc - (mw - 1) + i, my, 'z'); put(mc + 1, my, 'S'); }
    else put(mc, my, 'z');
    if (big) { put(left - 1, my - 1, 'S'); put(right + ew, my - 1, 'S'); }   // (the cheeks' shade)
  } else {
    const ex = Math.round(w * 0.72) - (ew - 1);
    eye(ex);
    if (!small) for (let i = -1; i <= ew; i++) put(ex + i, by, 'b');
    const ear = Math.round(w * 0.3);
    if (!small) for (let j = 0; j < Math.max(2, eh + 1); j++) { put(ear, ey + j, 'S'); put(ear + 1, ey + j, j === 0 ? 'S' : 's'); }
    put(w - 1, Math.round(h * 0.67), 'S');                            // (the nose, at the front edge)
    put(Math.min(w - 2, Math.round(w * 0.8)), my, 'z');
  }
  return { x: 0, y: 0, rows: rows.map(r => r.join('')) };
}

// ---------- the guns, in tradecraft's pixels at 16 px/m ----------

/** Shapes: [along0, along1, across0, across1, letter], spans inclusive, across down when level; len: the reference length. */
export const GUNS = Object.freeze({
  rifle: {
    len: 16, grip: 4.5, fore: 10.5, muzzle: 16, magwell: 8,
    parts: [[0, 3, 0, 0, 'n'], [0, 1, 1, 1, 'n'], [4, 8, 0, 1, 'n'], [5, 5, 2, 2, 'n'], [9, 11, 0, 0, 'n'], [9, 10, 1, 1, 'n'],
      [12, 15, 0, 0, 'n'], [13, 13, -1, -1, 'n'], [5, 7, -1, -1, 'u'], [5, 8, 0, 0, 'v']],
    mag: [[8, 8, 2, 2, 'u'], [9, 9, 3, 3, 'u']],
  },
  pistol: {
    len: 5, grip: 1, fore: 1.5, muzzle: 5, magwell: 1,
    parts: [[0, 4, -1, -1, 'n'], [0, 2, 0, 0, 'n'], [0, 1, 1, 1, 'n'], [3, 3, -1, -1, 'v']],
    mag: [],
  },
  mag: { len: 3, parts: [[0, 2, 0, 0, 'u'], [2, 2, 1, 1, 'u']], mag: [] },
});

/**
 * A gun's shape at a length of `lenPx` pixels along (foreshortened as it is seen) and `acrossK` pixels a
 * reference pixel across: cells [[along, across, letter]] (nearest resampling of each span). withMag:
 * the magazine drawn in its well.
 */
export function shapeAt(kind, lenPx, acrossK, withMag = true) {
  const g = GUNS[kind], ka = lenPx / g.len, out = new Map();
  const span = ([a0, a1, c0, c1, ch]) => {
    const A0 = Math.floor(a0 * ka + 1e-6), A1 = Math.max(A0, Math.ceil((a1 + 1) * ka - 1e-6) - 1);
    const C0 = Math.floor(c0 * acrossK + 1e-6), C1 = Math.max(C0, Math.ceil((c1 + 1) * acrossK - 1e-6) - 1);
    for (let a = A0; a <= A1; a++) for (let c = C0; c <= C1; c++) out.set(`${a},${c}`, [a, c, ch]);
  };
  for (const p of g.parts) span(p);
  if (withMag) for (const p of g.mag) span(p);
  return [...out.values()];
}

/**
 * Cells of a shape ([[along, across, ch]]) turned by th (radians, y down) about (x0, y0), as tradecraft's
 * turned(): each target pixel looks up where it came from (inverse-mapped), so a turned line steps
 * cleanly and never breaks up. flip: the across axis mirrored (a gun seen from its other side).
 */
export function turned(shape, x0, y0, th, flip = false) {
  if (!shape.length) return [];
  const c = Math.cos(th), s = Math.sin(th), k = flip ? -1 : 1, at = new Map(shape.map(([a, b, ch]) => [`${a},${b}`, ch]));
  const xs = shape.map(([a, b]) => x0 + a * c - k * b * s), ys = shape.map(([a, b]) => y0 + a * s + k * b * c), out = [];
  for (let y = Math.floor(Math.min(...ys)) - 1; y <= Math.ceil(Math.max(...ys)) + 1; y++)
    for (let x = Math.floor(Math.min(...xs)) - 1; x <= Math.ceil(Math.max(...xs)) + 1; x++) {
      const dx = x - x0, dy = y - y0, a = Math.round(dx * c + dy * s) || 0, b = Math.round(k * (-dx * s + dy * c)) || 0;
      const ch = at.get(`${a},${b}`);
      if (ch !== undefined) out.push([x, y, ch]);
    }
  return out;
}

// ---------- the muzzle flash (tradecraft's FLASH: white-hot, then yellow, an orange tip) ----------

export const FLASH_COLOURS = Object.freeze({ white: 0xf6f4ee, yellow: 0xf8e08a, orange: 0xe7b84a });
const FW = FLASH_COLOURS.white, FY = FLASH_COLOURS.yellow, FO = FLASH_COLOURS.orange;
const FLASH = {
  side: [[0, 0, FW], [1, 0, FW], [2, 0, FW], [3, 0, FW], [4, 0, FY], [5, 0, FO], [1, -1, FY], [2, -1, FW], [1, 1, FY], [2, 1, FW], [3, -2, FY], [3, 2, FY]],
  star: [[0, 0, FW], [1, 0, FW], [-1, 0, FW], [0, 1, FW], [0, -1, FW], [2, 0, FO], [-2, 0, FO], [0, 2, FO], [0, -2, FO], [1, 1, FY], [-1, -1, FY], [1, -1, FY], [-1, 1, FY]],
};
/** The flash's cells [[x, y, colour]] at the muzzle (mx, my): a burst along th side on, a star at you or behind; k its scale (ppm / 16). */
export function flashCells(kind, mx, my, th, k = 1) {
  const src = FLASH[kind === 'side' ? 'side' : 'star'], at = new Map(src.map(([a, b, c]) => [`${a},${b}`, c]));
  // (the reference grown by k, nearest: each target pixel looks up the reference pixel its centre falls in)
  const as = src.map(s => s[0]), bs = src.map(s => s[1]), grown = [];
  for (let B = Math.floor(Math.min(...bs) * k); B < Math.ceil((Math.max(...bs) + 1) * k); B++)
    for (let A = Math.floor(Math.min(...as) * k); A < Math.ceil((Math.max(...as) + 1) * k); A++) {
      const c = at.get(`${Math.floor((A + 0.5) / k)},${Math.floor((B + 0.5) / k)}`);
      if (c !== undefined) grown.push([A, B, c]);
    }
  if (kind !== 'side') return grown.map(([a, b, c]) => [Math.round(mx + a), Math.round(my + b), c]);
  return turned(grown, mx, my, th);
}
