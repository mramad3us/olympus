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
// The guns are shapes in tradecraft's pixels at 16 px/m, each part [along0, along1, across0, across1, letter]
// (spans inclusive; across is down when level), scaled to the gun's length and the density by shapeAt(). The
// rifle's shape is its design's (src/art/rifles.js: the R-7's unless a look names another; 0.0.12, the user's
// picks of 2026-11-08, G0's tradecraft rifle purged), GUNS.rifle holding only the stations every design keeps:
// 16 along, the grip, the support hand, the muzzle and the well. The flash is tradecraft's FLASH, scaled the same way.
// 0.0.6 (the user, 2026-11-07: "the magazines are very long, if they could be a bit slicker"): the rifle's
// magazine is one reference pixel wide, stepping forward a pixel as it goes down, two below the receiver
// (v0.0.5's was a four-pixel hook, three along): at 16 px/m two pixels on a 16-pixel rifle (each 6.25 cm of
// the 1.0 m drawn rifle: 12.5 cm below the well, 6 cm front to back, the HAD-30's own 6.5), at 24 px/m a
// 2 × 3 band; the doll's rifle (doll.js, acrossK 2.4) takes the same shape. Every design keeps it.
// v0.0.24 (the anywhere round; samples/mag-boots): magBootCells(cells) draws mag boots over a composed frame's own boot pixels (the
// role letters f and F, whatever pose), by MAG_BOOT_LOOK: from v0.0.28 B-a, the user's star of 2026-11-20, a heavier sole, two
// pixels added under each boot column's lowest (MAG_BOOT_LETTERS.sole) where the grid is empty there, and no cuff; v0.0.24's B-b
// (a sole a pixel deeper and the boot's top pixel the magnet's grey cuff, MAG_BOOT_LETTERS.cuff) stays drawable. outfits.js
// colours them, compose.js calls it for a look with magBoots.
// Pure.

import { drawingOf } from '../rifles.js';

/** The mag boots' letters (see the header): the cuff over the boot's top, the sole under its foot. */
export const MAG_BOOT_LETTERS = Object.freeze({ cuff: 'ƀ', sole: 'ɓ' });
/** The mag boots drawn (see the header): 'B-a' the heavier sole (v0.0.28, the user's star), 'B-b' the sole and the cuff (v0.0.24's). */
export const MAG_BOOT_LOOK = 'B-a';
/** Each look's sole (pixels added under the boot at 16 px/m; the doll's reference rows) and whether the boot's top is the cuff. */
export const MAG_BOOT_SPEC = Object.freeze({ 'B-a': Object.freeze({ sole: 2, cuff: false }), 'B-b': Object.freeze({ sole: 1, cuff: true }) });
/** Mag boots over a composed frame's cells (see the header): writes cells (a grid of rows of { ch, part, ... } or null). Returns the pixels changed. */
export function magBootCells(cells, look = MAG_BOOT_LOOK) {
  const spec = MAG_BOOT_SPEC[look] ?? MAG_BOOT_SPEC[MAG_BOOT_LOOK];
  const cols = new Map();
  for (let y = 0; y < cells.length; y++) for (let x = 0; x < (cells[y]?.length ?? 0); x++) {
    const c = cells[y][x];
    if (!c || (c.ch !== 'f' && c.ch !== 'F')) continue;
    const k = cols.get(x);
    if (!k) cols.set(x, { top: y, bot: y, part: c.part }); else { k.top = Math.min(k.top, y); k.bot = Math.max(k.bot, y); }
  }
  let n = 0;
  for (const [x, k] of cols) {
    if (spec.cuff && k.bot > k.top) { const c = cells[k.top][x]; cells[k.top][x] = { ...c, ch: MAG_BOOT_LETTERS.cuff, t: 'base' }; n++; }
    for (let d = 1; d <= spec.sole; d++) {
      const y = k.bot + d;
      if (!(y < cells.length && cells[y] && !cells[y][x])) break;
      cells[y][x] = { ch: MAG_BOOT_LETTERS.sole, part: k.part, u: 0, v: 0, t: 'base' }; n++;
    }
  }
  return n;
}

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
  // (the rifle's stations only: its shape is its design's, src/art/rifles.js)
  rifle: { len: 16, grip: 4.5, fore: 10.5, muzzle: 16, magwell: 8 },
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
 * the magazine drawn in its well. tpl: a template of GUNS' form to draw (a rifle design's of
 * src/art/rifles.js); a rifle with none, the R-7's.
 */
export function shapeAt(kind, lenPx, acrossK, withMag = true, tpl = null) {
  const g = tpl ?? (kind === 'rifle' ? drawingOf('r7').fig : GUNS[kind]), ka = lenPx / g.len, out = new Map();
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

// ---------- the device in the hands (the build sheet v0.0.22 §1 item 17, the residuals lens's R3) ----------
// With a G-11, the halligan, the ram or a charge in the hands the stage's figure drew both fists empty (kit-10 of the v0.0.18 hunt).
// HELD is one template a device's shape (devices.js DEVICES[model].look.shape: can, egg, strip, spool, bar, ram): its parts as
// compose.js draws a device (a capsule from a to b, th pixels, in a device's role letter; `hand` measures from that hand's tip,
// else from the shoulders' middle; [forward, left, up] metres), held in the right fist, the way a figure walks or runs with it.
// HELD_POSES are the beats' own (the held band, poses.js BANDS.stanceHeld): the arms put by the rig's IK where the user's picks
// of samples/held-devices put them (scored by the user on 2026-11-19: G1 the can at the chest, G2 and G3 with T3 and T2 by the
// throw's distance beside T1 the underhand lob, B3 the halligan on the shoulder, R2 the ram hanging, C1 the strip upright in the
// fist; the pin, the pry, the swing and the placing the sample's, which every candidate shares), with the device's parts where
// those candidates draw them. The device's
// pixels are a card over the figure (atlas.js heldStrip: only those the body leaves in sight), so its colour is its model's and no
// figure's frame carries it: a figure with no device is drawn as before, to the byte.
/** The device's role letters (a device's own, as the sample's: the body, steel, black, the tube) and the colours the card paints them in by the look's colour word (devicetable.js look.colour; the doll's DEVICE_C). */
export const HELD_LETTERS = Object.freeze({ body: 'ǧ', steel: 'š', black: 'ƶ', tube: 'ő' });
export const HELD_COLOURS = Object.freeze({ olive: 0x5a6238, blue: 0x3f6a96, black: 0x2a2c34, grey: 0x7c8088, steel: 0x8a909c, orange: 0xc8742a });
/** The colour words each shape is drawn in: the catalogue's (devicetable.js DEVICES[model].look; art-held holds the two equal), the spool never in a hand. */
export const HELD_VARIANTS = Object.freeze([['can', Object.freeze(['black', 'blue', 'grey', 'olive'])], ['egg', Object.freeze(['blue', 'olive'])], ['strip', Object.freeze(['olive'])], ['bar', Object.freeze(['steel'])], ['ram', Object.freeze(['black'])]]);
const can = (hand = 'r') => [
  { hand, a: [0, 0, 0.04], b: [0, 0, 0.14], th: 3, role: 'ǧ', layer: 'over' },
  { hand, a: [0, -0.11, 0.05], b: [0, -0.11, 0.14], th: 1, role: 'š', layer: 'over', dz: 0.001 },
];
const egg = (hand = 'r') => [
  { hand, a: [0, 0, 0.05], b: [0, 0, 0.11], th: 3, role: 'ǧ', layer: 'over' },
  { hand, a: [0, -0.1, 0.06], b: [0, -0.1, 0.12], th: 1, role: 'š', layer: 'over', dz: 0.001 },
];
const bar = (p0, p1, hand = null) => [
  { a: p0, b: p1, th: 2, role: 'š', layer: 'under', ...(hand ? { hand } : {}) },
  { a: p1, b: [p1[0] + 0.02, p1[1] + 0.07, p1[2] - 0.03], th: 1, role: 'š', layer: 'under', dz: 0.001, ...(hand ? { hand } : {}) },
  { a: p1, b: [p1[0] + 0.02, p1[1] - 0.04, p1[2] + 0.06], th: 1, role: 'š', layer: 'under', dz: 0.001, ...(hand ? { hand } : {}) },
];
const ram = (p0, p1, hand = null) => {
  const d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], L = Math.hypot(...d), e = d.map(v => v / L);
  return [
    { a: p0, b: p1, th: 4, role: 'ƶ', layer: 'under', ...(hand ? { hand } : {}) },
    { a: [p1[0] - e[0] * 0.02, p1[1] - e[1] * 0.02, p1[2] - e[2] * 0.02], b: [p1[0] + e[0] * 0.03, p1[1] + e[1] * 0.03, p1[2] + e[2] * 0.03], th: 4, role: 'š', layer: 'under', dz: 0.001, ...(hand ? { hand } : {}) },
  ];
};
const strip = (a, b, layer = 'under', hand = null) => [{ a, b, th: 2, role: 'ǧ', layer, ...(hand ? { hand } : {}) }];
/** One template a shape, held in the right fist as a figure walks or runs with it (see above): [part…]. */
export const HELD = Object.freeze({
  can: Object.freeze(can('r')),
  egg: Object.freeze(egg('r')),
  strip: Object.freeze(strip([0, 0, -0.02], [0, 0, 0.3], 'under', 'r')),
  // (a spool is never in a hand (devices.js: an initiator fills none); drawn as the FD-1's small orange drum all the same)
  spool: Object.freeze([{ hand: 'r', a: [0, 0, 0.03], b: [0, 0, 0.07], th: 3, role: 'ǧ', layer: 'over' }]),
  // (the halligan by its middle, hanging forward of the fist and up along the forearm; the ram by its rear handle, its head down and
  // forward at the knee: level ahead, a running stride carried it off the cell)
  bar: Object.freeze(bar([-0.18, 0, -0.16], [0.3, 0, 0.36], 'r')),
  ram: Object.freeze(ram([-0.12, 0, 0.06], [0.26, 0, -0.08], 'r')),
});
// (the defaults' points, held.js's: B1, R1; v0.0.24, the user's stars of 2026-11-19: B3 on the shoulder, R2 hanging)
const B1P = [[0.22, -0.3, -0.54], [0.24, 0.26, 0.28]], R1P = [[0.02, -0.25, -0.42], [0.62, 0.02, -0.38]];
const B3P = [[0.3, -0.26, -0.18], [-0.6, -0.3, 0.25]], R2P = [[0.04, -0.34, -0.3], [0.5, -0.34, -0.42]];
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const along = (p0, p1, kr, kl) => ({ r: kr === null ? null : lerp3(p0, p1, kr), l: kl === null ? null : lerp3(p0, p1, kl) });
/**
 * The held band's poses (poses.js BANDS.stanceHeld): frame → { lean, reach: { r, l }, parts: { [shape]: [part…] } } over the stack's
 * legs, the rifle slung in front (the hands-full rule). parts by the shapes the frame holds (a can's frames hold an egg the same way).
 */
export const HELD_POSES = Object.freeze({
  heldCan: { reach: { r: [0.22, -0.06, -0.2] }, parts: { can: can('r'), egg: egg('r') } },
  heldPin: { reach: { r: [0.2, -0.04, -0.16], l: [0.24, 0.2, -0.12] }, parts: { can: can('r'), egg: egg('r') } },
  heldThrow0: { lean: 0.2, reach: { r: [-0.14, -0.3, -0.4] }, parts: { can: can('r'), egg: egg('r') } },
  heldThrow1: { lean: 0.16, reach: { r: [0.34, -0.12, -0.3] }, parts: { can: can('r'), egg: egg('r') } },
  // (the user, 2026-11-19, of G: "Use the ones that make sense depending on how far we're throwing, those are all good",
  // and of T: "use what makes sense again depending on distance": a short throw wound up low at the hip (G2, the left finger in
  // the ring) and bowled round the jamb (T3); a long one cocked at the shoulder (G3, the left arm out at the target) and thrown
  // overarm (T2); between them today's lob from the chest (G1, T1). poses.js heldFrameOf picks them by the throw's distance;
// `free` names a hand that holds no part of the device: the ring finger's, the arm out at the target)
  heldThrowNear0: { lean: 0.04, reach: { r: [0.12, -0.2, -0.44], l: [0.13, -0.1, -0.36] }, free: 'l', parts: { can: can('r'), egg: egg('r') } },
  heldThrowNear1: { lean: 0.06, reach: { r: [0.22, -0.46, -0.44] }, parts: { can: can('r'), egg: egg('r') } },
  heldThrowFar0: { lean: 0.0, reach: { r: [-0.04, -0.27, 0.1], l: [0.3, 0.06, 0.0] }, free: 'l', parts: { can: can('r'), egg: egg('r') } },
  heldThrowFar1: { lean: 0.14, reach: { r: [0.3, -0.16, 0.06] }, parts: { can: can('r'), egg: egg('r') } },
  heldBar: { reach: along(...B3P, 0.08, null), parts: { bar: bar(...B3P) } },
  heldForce0: { lean: 0.05, reach: along([-0.25, -0.15, -0.25], [0.7, 0.0, 0.1], 0.3, 0.55), parts: { bar: bar([-0.25, -0.15, -0.25], [0.7, 0.0, 0.1]) } },
  heldForce1: { lean: -0.12, reach: along([-0.2, -0.45, -0.2], [0.7, 0.0, 0.1], 0.3, 0.45), parts: { bar: bar([-0.2, -0.45, -0.2], [0.7, 0.0, 0.1]) } },
  heldRam: { reach: along(...R2P, 0.05, null), parts: { ram: ram(...R2P) } },
  heldSwing0: { lean: -0.04, reach: along([-0.3, -0.2, -0.38], [0.38, -0.02, -0.34], 0.2, 0.55), parts: { ram: ram([-0.3, -0.2, -0.38], [0.38, -0.02, -0.34]) } },
  heldSwing1: { lean: 0.14, reach: along([-0.06, -0.12, -0.3], [0.66, 0.0, -0.22], 0.2, 0.55), parts: { ram: ram([-0.06, -0.12, -0.3], [0.66, 0.0, -0.22]) } },
  heldStrip: { reach: { r: [0.2, -0.12, -0.3] }, parts: { strip: strip([0, 0, -0.02], [0, 0, 0.3], 'under', 'r') } },
  heldPlace: { lean: 0.06, reach: { r: [0.43, -0.02, 0.1], l: [0.43, 0.02, -0.2] }, parts: { strip: strip([0.45, 0, -0.3], [0.45, 0, 0.2]) } },
});
