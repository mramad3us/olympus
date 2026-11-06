// OLYMPUS data: what a person looks like, within the figure kit's ranges (VIEWS §3.2, §3.9; the 0.0.3 build sheet §2.2).
//
// The roster draws a look { skin, hair: { style, color }, seed } and a body { tmpl, heightM, build }
// for everyone from these tables, and only from values the kit draws (src/art/figures/outfits.js SKIN
// and HAIR, templates.js's cuts): the sim may not import the art (TECH §2.2), so the names are
// written twice and people-roster checks them against the kit. SKINS, the four tones, with weights for
// the Republic's melting pot (my calls). HAIR_STYLES by sex: the Corps' cuts, crew, short and bald for
// men, a bun or short for women (the samples' set; braids and the rest wait for the look round's
// scores, VIEWS §3.9). HAIR_COLOURS by skin tone, the darker tones darker-haired (my calls), with grey
// drawn only at GREY_FROM_Y or older (GREY_W then: a sergeant greying at the temples, never a private).
// HEIGHTS_M by sex, a triangle within the kit's three heights (VIEWS §3.2: short 1.62 to 1.70 m, medium
// 1.70 to 1.80, tall 1.80 to 1.92; [lo, mode, hi], my calls on the Corps' spread); BUILDS, VIEWS's two
// frames (slight, broad) by sex. BODY_TMPL names BODY §2.5's templates. SQUAD_DIFFERENCES is VIEWS
// §3.9's rule as the 0.0.3 sheet narrows it: every pair of one squad differs in at least two of skin,
// hair style and hair colour (redrawn on the squad's stream up to LOOK_REROLLS times).

/** The kit's skin tones (outfits.js SKIN) and their weights. */
export const SKINS = Object.freeze([['light', 25], ['tan', 30], ['brown', 28], ['dark', 17]].map(p => Object.freeze(p)));
/** The kit's cuts by sex, with weights (templates.js T.hair). */
export const HAIR_STYLES = Object.freeze({
  m: Object.freeze([['crew', 55], ['short', 30], ['bald', 15]].map(p => Object.freeze(p))),
  f: Object.freeze([['bun', 70], ['short', 30]].map(p => Object.freeze(p))),
});
/** The kit's hair colours (outfits.js HAIR), weighted by skin tone; grey only from GREY_FROM_Y. */
export const HAIR_COLOURS = Object.freeze({
  light: Object.freeze([['black', 12], ['dark', 26], ['brown', 30], ['auburn', 12], ['blond', 20]].map(p => Object.freeze(p))),
  tan: Object.freeze([['black', 30], ['dark', 36], ['brown', 24], ['auburn', 5], ['blond', 5]].map(p => Object.freeze(p))),
  brown: Object.freeze([['black', 46], ['dark', 40], ['brown', 10], ['auburn', 2], ['blond', 2]].map(p => Object.freeze(p))),
  dark: Object.freeze([['black', 60], ['dark', 34], ['brown', 4], ['auburn', 1], ['blond', 1]].map(p => Object.freeze(p))),
});
export const GREY_FROM_Y = 32, GREY_W = 14;
/** Every value of each look attribute the kit draws (for the checks). */
export const KIT = Object.freeze({
  skins: Object.freeze(['light', 'tan', 'brown', 'dark']),
  styles: Object.freeze(['crew', 'short', 'bald', 'bun']),
  colours: Object.freeze(['black', 'dark', 'brown', 'auburn', 'blond', 'grey']),
  heightM: Object.freeze([1.62, 1.92]),
  builds: Object.freeze(['slight', 'broad']),
});
/** Standing height by sex: a triangle [lo, mode, hi] in metres, inside the kit's 1.62 to 1.92. */
export const HEIGHTS_M = Object.freeze({ m: Object.freeze([1.66, 1.77, 1.92]), f: Object.freeze([1.62, 1.67, 1.82]) });
/** The two frames by sex, with weights. */
export const BUILDS = Object.freeze({
  m: Object.freeze([['slight', 45], ['broad', 55]].map(p => Object.freeze(p))),
  f: Object.freeze([['slight', 60], ['broad', 40]].map(p => Object.freeze(p))),
});
/** BODY §2.5's templates by sex. */
export const BODY_TMPL = Object.freeze({ m: 'm-adult', f: 'f-adult' });
/** A look's seed (the figure's cosmetic choices: camouflage offsets and the like) is drawn in [1, LOOK_SEED_MAX]. */
export const LOOK_SEED_MAX = 9_999_999;
/** VIEWS §3.9 as the sheet narrows it: the attributes a squad's pairs must differ in, and in how many. */
export const SQUAD_DIFFERENCES = Object.freeze({ of: Object.freeze(['skin', 'style', 'colour']), atLeast: 2 });
/** How often a squadmate's look is redrawn on the squad's stream before the roster picks from what still fits (VIEWS §3.9). */
export const LOOK_REROLLS = 10;
