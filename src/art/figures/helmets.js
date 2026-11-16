// OLYMPUS art: the helmet candidates (a look sample's only, samples/helmets): closed helmets, the elites' faceless ones, the OPA's.
//
// The user, 2026-11-15, of the combat EVA suit's sealed helmet (v0.0.12's: the light vac suit's round dome a size up from the
// head, its visor from the brow to the chin): "The helmet design is pretty goofy, I was thinking slicker design like this for
// regular units and even slicker for elite units with no visor, replaced by thin slits for the eyes or red dots depending on the
// elite units (martian get red outlines on their gear, UN get blue), if OPA get elite units, they'll get more rugged looking gear
// like [a cut ballistic helmet with side rails over a full-face mask with two round side filters] modernized." These are the
// candidates the user scores, each an original design (no insignia, letters or logos), in four families:
//   - REGULAR (R1 to R4): a smooth closed shell that hugs the head (17 px wide at 16 px/m, two over the skull; v0.0.12's dome is
//     19 and four over), a wraparound visor whose glass is lit faintly from inside (a dim amber that glows: the render draws it
//     unlit, so it shows in the dark of the house as it would by day), and a moulded jaw and breathing piece below it, the
//     silhouette tapering to the chin so the head reads as a helmet, not a ball;
//   - ELITE (E1 to E4): sleeker still, 15 px wide (the skull's own width), no visor: two thin eye slits or two dots that glow,
//     red by default, the faction's colour when it has one;
//   - the faction's TRIM (look.helm.faction 'mars' or 'un'): thin lines of the faction's colour on the helmet (where each design
//     puts its seam: over the visor, down the faceplate) and on the plates (the carrier's top and side edges, the suit's shoulder
//     seams): Mars red, the UN blue; with no faction the same lines are the shell's own seam in shade;
//   - OPA (O1 to O3), rugged: a modernised cut ballistic helmet (cut high over the ears) with a rail along each side, over a
//     full-face mask with two round filters at the cheeks and two round lenses; their own colours (a coyote or olive shell, a
//     worn grey mask), and the suit under them a worn olive grey, not the Corps' black.
// look.helm is { id, faction } (wear() resolves it with helmOf into L.helm); no look of the game carries one, so the game's
// frames, its atlas and the figure goldens are unchanged until the user picks. compose.js head() draws helmTpl()'s template in
// place of the vac helmet's when a sealed head carries one (the head's own skull cleared first, so a helmet narrower than the
// vac's still makes the whole silhouette), and the carrier's trim; shade.js draws the fixed letters a helm adds (col.$fixed).
// Templates are at the head kit's reference (templates.js REF: the head box 15 × 12, 14 × 12 side on), [dx, dy, rows] from
// the box's top-left, in role letters: a the shell (A in shade), þ the visor's glass (Þ in shade), ĵ the jaw piece or the
// mask (Ĵ in shade), ř a rail (Ř), ŷ a filter (Ŷ); fixed: l a glint, ÷ the visor's light (glows), ¢ an eye dot (glows), ¬ an
// eye slit (glows, dimmer), ı the shell's gloss (its colour a step and a half lighter), § the faction's trim (or, with no faction, the design's own seam letter). Pure.
import { resample, mirror, REF } from './templates.js';
import { mixHex, tone } from '../tone.js';
import { GLOW } from '../paint.js';

/** The factions' trim colours (my call, to be scored): Mars red, the UN blue; and the eyes' glow in each. */
export const FACTIONS = Object.freeze({
  mars: Object.freeze({ trim: 0xc8322a, eye: 0xff4a32 }),
  un: Object.freeze({ trim: 0x3a7ad8, eye: 0x5ab4ff }),
});
/** The default elite eye glow (the user's "red dots") and the regulars' visor light, a dim amber (their photo's lit shield). */
export const EYE_RED = 0xff4a32, VISOR_AMBER = 0x9a5428;

// ---------- the templates ----------

// (REGULAR: a smooth shell over the head, flat-crowned (a dome of two pixels, its gloss ı at the upper left), the visor band
// across the eyes wrapping to the sides, the jaw piece below it in a lighter moulding, the silhouette tapering to the chin)
const R1 = {
  down: [-1, -2, [
    '....aaaaaaaaa....',
    '..aaıııaaaaaaaa..',
    '.aaıaaaaaaaaaaaa.',
    'aaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaaa',
    'aa§§§§§§§§§§§§§aa',
    'aþþþþþþþþþþþþþþþa',
    'aþlþþþþþþþþþþþþþa',
    'a÷÷÷÷÷÷÷÷÷÷÷÷÷÷÷a',
    'AaaaaaaaaaaaaaaaA',
    '.AAaĵĵĵĵĵĵĵĵĵaAA.',
    '..AAaĵĵĴĵĴĵĵaAA..',
    '...AAaĵĵĵĵĵaAA...',
    '.....AĴĴĴĴĴA.....']],
  right: [-1, -2, [
    '...aaaaaaaa.....',
    '.aaıııaaaaaaa...',
    'aaıaaaaaaaaaaa..',
    'aaaaaaaaaaaaaaa.',
    'aaaaaaaaaaaaaaa.',
    'aaaaaaaa§§§§§§§a',
    'aaaaaaaaþþþþþþþþ',
    'aaaAaaaaþþþþlþþþ',
    'aaaAaaaa÷÷÷÷÷÷÷÷',
    'AaaAaaaaaaaaaaaa',
    'AAaaaaaaaaĵĵĵĵĵ.',
    '.AAaaaaaaĵĵĴĵĴ..',
    '..AAAaaaĵĵĵĵĵ...',
    '....AAAĴĴĴĴ.....']],
  up: [-1, -2, [
    '....aaaaaaaaa....',
    '..aaıııaaaaaaaa..',
    '.aaıaaaaaaaaaaaa.',
    'aaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaaa',
    'a§§§§§§§§§§§§§§§a',
    'aaaaaaaaaaaaaaaaa',
    '.AAaaaaaaaaaaaAA.',
    '..AAaaaaaaaaaAA..',
    '...AAAaaaaaAAA...',
    '.....ĴĴĴĴĴĴĴ.....']],
};
// (R2, the shield: a taller visor from the brow to the nose, its lower half lit and dipping in a V into the jaw piece: the photo's)
const R2 = {
  down: [-1, -2, [
    '....aaaaaaaaa....',
    '..aaıııaaaaaaaa..',
    '.aaıaaaaaaaaaaaa.',
    'aaaaaaaaaaaaaaaaa',
    'aa§§§§§§§§§§§§§aa',
    'aþþþþþþþþþþþþþþþa',
    'aþlþþþþþþþþþþþþþa',
    'aþþlþþþþþþþþþþþþa',
    'aa÷÷÷÷÷÷÷÷÷÷÷÷÷aa',
    'Aaaa÷÷÷÷÷÷÷÷÷aaaA',
    '.AAaaa÷÷÷÷÷aaaAA.',
    '..AAaaĵĵĵĵĵaaAA..',
    '...AAĵĴĵĴĵĴĵAA...',
    '.....ĴĴĴĴĴĴĴ.....']],
  right: [-1, -2, [
    '...aaaaaaaa.....',
    '.aaıııaaaaaaa...',
    'aaıaaaaaaaaaaa..',
    'aaaaaaaaaaaaaaa.',
    'aaaaaaa§§§§§§§§.',
    'aaaaaaaþþþþþþþþa',
    'aaaAaaaþþþþþlþþþ',
    'aaaAaaaþþþþþþlþþ',
    'aaaAaaaa÷÷÷÷÷÷÷÷',
    'Aaaaaaaaaa÷÷÷÷÷÷',
    'AAaaaaaaaaa÷÷÷÷.',
    '.AAaaaaaaaĵĵĵĵ..',
    '..AAAaaaĵĵĴĵĴ...',
    '....AAAĴĴĴĴ.....']],
  up: R1.up,
};
// (R3, brow and snout: a jutting brow in shade over a narrow visor, its light a line inside it, the cheek plates' seams, a
// breathing piece with a grille standing out from the jaw, forward of the face side on)
const R3 = {
  down: [-1, -2, [
    '....aaaaaaaaa....',
    '..aaıııaaaaaaaa..',
    '.aaıaaaaaaaaaaaa.',
    'aaaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaaa',
    'aAAAAAAAAAAAAAAAa',
    'aþþþþþþþþþþþþþþþa',
    'aþl÷÷÷÷÷÷÷÷÷÷÷þþa',
    'a§§§§§§§§§§§§§§§a',
    'AaaAaaĵĵĵĵĵaaAaaA',
    '.AaAaĵĵĵĵĵĵĵaAaA.',
    '..AAaĵĴĵĴĵĴĵaAA..',
    '...AAĵĵĵĵĵĵĵAA...',
    '.....ĴĴĴĴĴĴĴ.....']],
  right: [-1, -2, [
    '...aaaaaaaa......',
    '.aaıııaaaaaaa....',
    'aaıaaaaaaaaaaa...',
    'aaaaaaaaaaaaaaa..',
    'aaaaaaaaaaaaaaa..',
    'aaaaaaaaAAAAAAAA.',
    'aaaAaaaaþþþþþþþa.',
    'aaaAaaaaþþþl÷÷÷a.',
    'aaaAaaa§§§§§§§§a.',
    'AaaaaaaaaAaaĵĵĵĵ.',
    'AAaaaaaaaAaĵĵĵĵĴĵ',
    '.AAaaaaaaaĵĵĴĵĴĵ.',
    '..AAAaaaaĵĵĵĵĵ...',
    '....AAAAĴĴĴĴ.....']],
  up: R1.up,
};
// (R4, smoked: R1's shell with the issue's smoked glass and its light a thin line along the visor's top, a heads-up display's)
const swapRows = (t, a, b) => [t[0], t[1], t[2].map((r, j) => (j === a ? t[2][b] : j === b ? t[2][a] : r))];
const R4 = { down: swapRows(R1.down, 6, 8), right: swapRows(R1.right, 6, 8), up: R1.up };

// (ELITE: 15 px, the skull's own width, a lower crown swept back side on, the face tapering to a narrow chin; no visor)
const ELITE_UP = [0, -1, [
  '...aaaaaaaaa...',
  '.aaıııaaaaaaaa.',
  'aaıaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaa',
  'a§§§§§§§§§§§§§a',
  'aaaaaaaaaaaaaaa',
  '.AAaaaaaaaaaAA.',
  '..AAaaaaaaaAA..',
  '...AAAaaaAAA...',
  '.....ĴĴĴĴĴ.....']];
// (E1, slits: a smooth face, two thin lit slits at the eyes, a ridge down the faceplate to the chin)
const E1 = {
  down: [0, -1, [
    '...aaaaaaaaa...',
    '.aaıııaaaaaaaa.',
    'aaıaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'aa¬¬¬aaaaa¬¬¬aa',
    'aaaaaaa§aaaaaaa',
    'Aaaaaaa§aaaaaaA',
    '.AAaaaa§aaaaAA.',
    '..AAaaa§aaaAA..',
    '...AAaa§aaAA...',
    '.....AAĴAA.....']],
  right: [0, -1, [
    '..aaaaaaaa....',
    'aaıııaaaaaaa..',
    'aıaaaaaaaaaaa.',
    'aaaaaaaaaaaaa.',
    'aaaaaaaaaaaaaa',
    'aaaAaaaaaaaaaa',
    'aaaAaaaaaa¬¬¬a',
    'aaaAaaaaaaaaa§',
    'AAaaaaaaaaaaa§',
    '.AAaaaaaaaaa§.',
    '..AAaaaaaaa§..',
    '...AAAaaaa§...',
    '.....AAAĴĴ....']],
  up: ELITE_UP,
};
// (E2, dots: a recessed faceplate of glossy black edged in the seam, two dots lit in it)
const E2 = {
  down: [0, -1, [
    '...aaaaaaaaa...',
    '.aaıııaaaaaaaa.',
    'aaıaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'aa§§§§§§§§§§§aa',
    'a§ĵıĵĵĵĵĵĵĵĵĵ§a',
    'a§ĵĵ¢ĵĵĵĵĵ¢ĵĵ§a',
    'aa§ĵĵĵĵĵĵĵĵĵ§aa',
    'Aaa§ĵĵĵĵĵĵĵ§aaA',
    '.AAa§ĵĵĵĵĵ§aAA.',
    '..AAa§ĵĵĵ§aAA..',
    '...AAa§Ĵ§aAA...',
    '.....AAAAA.....']],
  right: [0, -1, [
    '..aaaaaaaa....',
    'aaıııaaaaaaa..',
    'aıaaaaaaaaaaa.',
    'aaaaaaaaaaaaa.',
    'aaaaaaaaaaaaaa',
    'aaaAaaaa§ĵıĵĵa',
    'aaaAaaaa§ĵĵ¢ĵĵ',
    'aaaAaaaa§ĵĵĵĵĵ',
    'AAaaaaaaa§ĵĵĵĵ',
    '.AAaaaaaaa§ĵĵ.',
    '..AAaaaaaa§ĵĴ.',
    '...AAAaaaa§Ĵ..',
    '.....AAAAAA...']],
  up: ELITE_UP,
};
// (E3, one slit: a single thin lit slit across the face under a seam, the jaw a small moulded chin)
const E3 = {
  down: [0, -1, [
    '...aaaaaaaaa...',
    '.aaıııaaaaaaaa.',
    'aaıaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'a§§§§§§§§§§§§§a',
    'a¬¬¬¬¬¬¬¬¬¬¬¬¬a',
    'aaaaaaaaaaaaaaa',
    'Aaaaaaaaaaaaaaa',
    '.AAaaĵĵĵĵĵaaAA.',
    '..AAĵĵĴĵĴĵĵAA..',
    '...AAĵĵĵĵĵAA...',
    '.....AĴĴĴA.....']],
  right: [0, -1, [
    '..aaaaaaaa....',
    'aaıııaaaaaaa..',
    'aıaaaaaaaaaaa.',
    'aaaaaaaaaaaaa.',
    'aaaaaaaaaaaaaa',
    'aaaAaaa§§§§§§a',
    'aaaAaaa¬¬¬¬¬¬¬',
    'aaaAaaaaaaaaaa',
    'AAaaaaaaaaaaaa',
    '.AAaaaaaaĵĵĵĵ.',
    '..AAaaaaĵĵĴĵĴ.',
    '...AAAaaĵĵĵĵ..',
    '.....AAAĴĴĴ...']],
  up: ELITE_UP,
};
// (E4, crest: an angular shell, a crest along the crown, a chevron faceplate between the dots)
const E4 = {
  down: [0, -2, [
    '.......a.......',
    '...aaaaAaaaa...',
    '.aaıııaAaaaaaa.',
    'aaıaaaaAaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'aa§aaaaaaaaa§aa',
    'aaa§¢aaaaa¢§aaa',
    'aaaa§aaaaa§aaaa',
    'Aaaaa§aaa§aaaaA',
    '.AAaaa§a§aaaAA.',
    '..AAaaa§aaaAA..',
    '...AAAaaaAAA...',
    '.....AAĴAA.....']],
  right: [0, -2, [
    '...aaaa.......',
    '..aaaaaaaa....',
    'aaAAAAAAAAa...',
    'aıııaaaaaaaa..',
    'aaaaaaaaaaaaa.',
    'aaaaaaaaaaaaaa',
    'aaaAaaaaaa§aaa',
    'aaaAaaaaaaa§¢a',
    'aaaAaaaaaaaa§a',
    'AAaaaaaaaaaa§a',
    '.AAaaaaaaaa§a.',
    '..AAaaaaaa§a..',
    '...AAAaaaaa...',
    '.....AAAĴĴ....']],
  up: [0, -2, [
    '.......a.......',
    '...aaaaAaaaa...',
    '.aaıııaAaaaaaa.',
    'aaıaaaaAaaaaaaa',
    'aaaaaaaAaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaa',
    'a§§§§§§§§§§§§§a',
    'aaaaaaaaaaaaaaa',
    '.AAaaaaaaaaaAA.',
    '..AAaaaaaaaAA..',
    '...AAAaaaAAA...',
    '.....ĴĴĴĴĴ.....']],
};

// (OPA: a cut ballistic helmet, its rim in shade, a rail along each side, cut high over the ears; under it a full-face mask,
// two round lenses, two round filters at the cheeks standing out of the silhouette)
const O1 = {
  down: [-2, -3, [
    '.....aaaaaaaaa.....',
    '...aaaaaaaaaaaaa...',
    '..aaaaaaaaaaaaaaa..',
    '..aaaaaaaaaaaaaaa..',
    '.řaaaaaaaaaaaaaaař.',
    '.řaaaaaaaaaaaaaaař.',
    '.ŘAAAAAAAAAAAAAAAŘ.',
    '...ĵĵĵĵĵĵĵĵĵĵĵĵĵ...',
    '...ĵþþþĵĵĵĵĵþþþĵ...',
    '...ĵþlþĵĵĵĵĵþlþĵ...',
    '...ĵĵþĵĵĵĵĵĵĵþĵĵ...',
    '.ŷŷĵĵĵĵĵĵĵĵĵĵĵĵĵŷŷ.',
    'ŷŷŷŷĵĵĵĵĴĴĴĵĵĵĵŷŷŷŷ',
    'ŷŷŷŶĵĵĵĴĵĵĵĴĵĵĵŶŷŷŷ',
    '.ŶŶĵĵĵĵĵĴĵĴĵĵĵĵĵŶŶ.',
    '.....ĵĵĵĵĵĵĵĵĵ.....']],
  right: [-2, -3, [
    '.....aaaaaaa......',
    '...aaaaaaaaaaa....',
    '..aaaaaaaaaaaaa...',
    '.aaaaaaaaaaaaaaa..',
    '.aaaaaaaaaaaaaaaa.',
    '.ařřřřřřřřaaaaaaa.',
    '.aaaaaaaaaaAAAAAAA',
    '.aaaaaaaĵĵĵĵĵĵĵĵ..',
    '.AAaaaĵĵĵĵĵĵĵþþþĵ.',
    '..AAĵĵĵĵĵĵĵĵþþlþĵ.',
    '...ĵĵĵĵĵĵĵĵĵĵþþĵĵ.',
    '...ĵĵĵĵĵĵŷŷŷĵĵĵĵĵ.',
    '...ĵĵĵĵĵŷŷŷŷŷĵĵĵĵĵ',
    '...ĵĵĵĵĵŷŷŶŷŷĵĵĴĵĵ',
    '....ĵĵĵĵŶŷŷŷŶĵĵĵĵ.',
    '.....ĵĵĵĵĵŶŶŶĵĵĵ..']],
  up: [-2, -3, [
    '.....aaaaaaaaa.....',
    '...aaaaaaaaaaaaa...',
    '..aaaaaaaaaaaaaaa..',
    '..aaaaaaaaaaaaaaa..',
    '.řaaaaaaaaaaaaaaař.',
    '.řaaaaaaaaaaaaaaař.',
    '.ŘaaaaaaaaaaaaaaaŘ.',
    '..aaaaaaaaaaaaaaa..',
    '...AAAAAAAAAAAAA...',
    '...ĵĵĵĵĵĵĵĵĵĵĵĵĵ...',
    '...ĴĴĴĴĴĴĴĴĴĴĴĴĴ...',
    '.ŷŷĵĵĵĵĵĵĵĵĵĵĵĵĵŷŷ.',
    'ŷŷŷŷĵĵĵĵĵĵĵĵĵĵĵŷŷŷŷ',
    'ŷŷŷŶĵĵĵĵĵĵĵĵĵĵĵŶŷŷŷ',
    '.ŶŶĵĵĵĵĵĵĵĵĵĵĵĵĵŶŶ.',
    '.....ĵĵĵĵĵĵĵĵĵ.....']],
};
// (O2, the shroud: O1 with a night-vision shroud on the brow and one wide lens across the mask, modernised)
const O2 = {
  down: [-2, -3, [
    '.....aaaaaaaaa.....',
    '...aaaaaaaaaaaaa...',
    '..aaaaaaaaaaaaaaa..',
    '..aaaaaaŘŘŘaaaaaa..',
    '.řaaaaaaŘřŘaaaaaař.',
    '.řaaaaaaaaaaaaaaař.',
    '.ŘAAAAAAAAAAAAAAAŘ.',
    '...ĵĵĵĵĵĵĵĵĵĵĵĵĵ...',
    '...ĵþþþþþþþþþþþĵ...',
    '...ĵþlþþþþþþþþþĵ...',
    '...ĵĵþþþþĵþþþþĵĵ...',
    '.ŷŷĵĵĵĵĵĵĵĵĵĵĵĵĵŷŷ.',
    'ŷŷŷŷĵĵĵĵĴĴĴĵĵĵĵŷŷŷŷ',
    'ŷŷŷŶĵĵĵĴĵĵĵĴĵĵĵŶŷŷŷ',
    '.ŶŶĵĵĵĵĵĴĵĴĵĵĵĵĵŶŶ.',
    '.....ĵĵĵĵĵĵĵĵĵ.....']],
  right: [-2, -3, [
    '.....aaaaaaa......',
    '...aaaaaaaaaaa....',
    '..aaaaaaaaaaaaa...',
    '.aaaaaaaaaaaaaŘŘ..',
    '.aaaaaaaaaaaaaŘřŘ.',
    '.ařřřřřřřřaaaaaaa.',
    '.aaaaaaaaaaAAAAAAA',
    '.aaaaaaaĵĵĵĵĵĵĵĵ..',
    '.AAaaaĵĵĵĵĵĵþþþþĵ.',
    '..AAĵĵĵĵĵĵĵþþþlþĵ.',
    '...ĵĵĵĵĵĵĵĵĵþþþĵĵ.',
    '...ĵĵĵĵĵĵŷŷŷĵĵĵĵĵ.',
    '...ĵĵĵĵĵŷŷŷŷŷĵĵĵĵĵ',
    '...ĵĵĵĵĵŷŷŶŷŷĵĵĴĵĵ',
    '....ĵĵĵĵŶŷŷŷŶĵĵĵĵ.',
    '.....ĵĵĵĵĵŶŶŶĵĵĵ..']],
  up: O1.up,
};

/**
 * The candidates: { id, family, name, tpl, colours }. colours: shell (the helmet's a), jaw (ĵ: the jaw piece, the faceplate or
 * the mask), visor (þ), lit (÷), slit (¬, dimmed from the eye's colour), filter (ŷ), rail (ř), seam (the letter § falls back to
 * with no faction), suit (the body's colours under it, over outfits.js COMBAT_SUIT's).
 */
const BLACK = 0x2c2f37, JAW = 0x41444d, ELITE = 0x26282f;
export const HELMS = Object.freeze({
  R1: { id: 'R1', family: 'regular', name: 'R1 the band: a visor band, its lower edge lit', tpl: R1, colours: { shell: BLACK, jaw: JAW, visor: 0x3a2a22, lit: VISOR_AMBER, seam: 'A' } },
  R2: { id: 'R2', family: 'regular', name: 'R2 the shield: a tall visor, lit in a V to the jaw', tpl: R2, colours: { shell: BLACK, jaw: JAW, visor: 0x3a2a22, lit: VISOR_AMBER, seam: 'A' } },
  R3: { id: 'R3', family: 'regular', name: 'R3 brow and snout: a narrow visor, a grille', tpl: R3, colours: { shell: BLACK, jaw: JAW, visor: 0x3a2a22, lit: VISOR_AMBER, seam: 'A' } },
  R4: { id: 'R4', family: 'regular', name: 'R4 smoked: the issue\'s glass, a lit line at its top', tpl: R4, colours: { shell: BLACK, jaw: JAW, visor: 0x33465a, lit: VISOR_AMBER, seam: 'A' } },
  E1: { id: 'E1', family: 'elite', name: 'E1 slits: two thin lit slits, a ridge down the face', tpl: E1, colours: { shell: ELITE, jaw: 0x1b1c22, eye: EYE_RED, seam: 'A' } },
  E2: { id: 'E2', family: 'elite', name: 'E2 dots: two red dots in a dark faceplate', tpl: E2, colours: { shell: ELITE, jaw: 0x111216, eye: EYE_RED, seam: 'A' } },
  E3: { id: 'E3', family: 'elite', name: 'E3 one slit: a single lit slit across the face', tpl: E3, colours: { shell: ELITE, jaw: 0x1b1c22, eye: EYE_RED, seam: 'A' } },
  E4: { id: 'E4', family: 'elite', name: 'E4 crest: an angular shell, a crest, a chevron and dots', tpl: E4, colours: { shell: ELITE, jaw: 0x1b1c22, eye: EYE_RED, seam: 'A' } },
  O1: { id: 'O1', family: 'opa', name: 'O1 cut and mask: coyote shell, rails, two lenses, two filters', tpl: O1, colours: { shell: 0x8a7656, jaw: 0x34363a, visor: 0x3c4a44, filter: 0x5c5f52, rail: 0x6e7078, seam: 'A', suit: { shell: 0x4a4c40, skin: 0x2e3029, ring: 0x5a5c52, boot: 0x3a3226, pack: 0x5a4e3a, carrier: 0x6a5a40, pouches: 0x55492f } } },
  O2: { id: 'O2', family: 'opa', name: 'O2 the shroud: olive shell, a night-vision shroud, one wide lens', tpl: O2, colours: { shell: 0x5a6044, jaw: 0x3e4044, visor: 0x2e3c48, filter: 0x8a7656, rail: 0x6e7078, seam: 'A', suit: { shell: 0x4a4c40, skin: 0x2e3029, ring: 0x5a5c52, boot: 0x3a3226, pack: 0x4a4e38, carrier: 0x50563c, pouches: 0x444a32 } } },
  O3: { id: 'O3', family: 'opa', name: 'O3 worn black: a scuffed black shell, grey mask, hazard-orange filter caps', tpl: O1, colours: { shell: 0x34343a, jaw: 0x4a4c50, visor: 0x2a3036, filter: 0xb4602c, rail: 0x7a7c84, seam: 'A', scuff: true, suit: { shell: 0x3c3e40, skin: 0x262729, ring: 0x55575c, boot: 0x2e2a26, pack: 0x45403a, carrier: 0x3a3a36, pouches: 0x4a4636 } } },
});
export const HELM_IDS = Object.freeze(Object.keys(HELMS));

/** A look's helm ({ id, faction } or an id) resolved: the candidate with its faction's colours, or null. */
export function helmOf(h) {
  const spec = typeof h === 'string' ? { id: h } : h;
  const C = spec && HELMS[spec.id];
  if (!C) return null;
  // (the OPA are neither Mars nor the UN: their gear takes no faction's trim)
  const F = C.family === 'opa' ? null : FACTIONS[spec.faction] ?? null, eye = F?.eye ?? C.colours.eye ?? EYE_RED;
  return Object.freeze({
    id: C.id, family: C.family, faction: F ? spec.faction : null, tpl: C.tpl, scuff: !!C.colours.scuff,
    shell: C.colours.shell, jaw: C.colours.jaw, visor: C.colours.visor ?? 0x33465a, lit: C.colours.lit ?? VISOR_AMBER,
    eye, slit: mixHex(eye, 0x14151c, 0.25), filter: C.colours.filter ?? 0x5c5f52, rail: C.colours.rail ?? 0x6e7078,
    trim: F?.trim ?? null, seam: C.colours.seam ?? 'A', suit: C.colours.suit ?? null,
  });
}

/** The role colours and fixed letters a helm adds to a look's (outfits.js coloursOf; shade.js reads $fixed). */
export function helmColours(H) {
  return {
    ĵ: H.jaw, ŷ: H.filter, ř: H.rail,
    $fixed: { 'ı': [tone(H.shell, 0.16), 0], '÷': [H.lit, GLOW.ALWAYS], '¢': [H.eye, GLOW.ALWAYS], '¬': [H.slit, GLOW.ALWAYS], ...(H.trim ? { '§': [H.trim, 0] } : {}) },
  };
}

const tpls = new Map();
/**
 * A helm's template for a view ('down', 'up', 'right', 'left') at a head box bw × bh: { x, y, rows } from the box's top-left
 * (templates.js resample, mirrored for 'left'), the trim's letter § left for the faction or turned to the design's seam, and
 * O3's scuffs (a few lit pixels on the shell, by a fixed pattern).
 */
export function helmTpl(H, view, bw, bh) {
  const key = `${H.id}|${H.trim ? 't' : H.seam}|${view}|${bw}x${bh}`;
  let t = tpls.get(key);
  if (t === undefined) {
    const v = view === 'left' ? 'right' : view, src = H.tpl[v] ?? H.tpl.down;
    let rows = src[2].map(r => (H.trim ? r : r.replaceAll('§', H.seam)));
    if (H.scuff) rows = rows.map((r, j) => [...r].map((ch, i) => (ch === 'a' && j < 6 && (i * 7 + j * 5) % 13 === 0 ? 'ı' : ch)).join(''));
    const sideOn = v === 'right', rw = sideOn ? REF.sideW : REF.w;
    t = resample([src[0], src[1], rows], view === 'left' || sideOn ? bw : bw, bh, rw);
    if (view === 'left') t = mirror(t, bw);
    tpls.set(key, t);
  }
  return t;
}

/**
 * The faction's trim on the plates (compose.js, the carrier's op): the slab's pixels on its top and side edges (whose upper,
 * left or right neighbour is empty or an earlier part, the body under it) take the trim's letter §, a thin line round the plate.
 */
export function trimPlate(cells, slab) {
  const hit = [];
  const outside = (x, y) => { const o = cells[y]?.[x]; return !o || o.part < slab; };
  for (let y = 0; y < cells.length; y++) for (let x = 0; x < cells[y].length; x++) {
    const c = cells[y][x];
    if (c?.part === slab && (outside(x, y - 1) || outside(x - 1, y) || outside(x + 1, y))) hit.push(c);
  }
  for (const c of hit) { c.ch = '§'; c.t = null; }
}

// ---------- v0.0.19: the force-on-force masks (the build sheet 0.0.19 §1 L-look; samples/opfor-look) ----------
// The role-players' mask on the world figure, the doll's three looks (src/art/doll/worn.js MASK_LOOKS) at the head kit's
// reference: M1 a mesh in a black frame, M2 (the default) a clear lens over the eyes and a moulded lower shell, M3 a smoked
// shield with a chin guard. Unlike a helm it sits over a bare head (the hair and the head's own skull stay), so its template
// covers the face alone, from the brow to the chin, and '.' leaves the face's own pixel: letters ĵ the frame and shell (Ĵ in
// shade), þ the lens or the shield (Þ in shade), l a glint. Seen from behind ('up') it is the strap alone, round the head at the
// eyes' row. The composer draws it once it reads look.mask (the lead's wiring: compose.js head(), outfits.js wear()); until then it
// is the samples' and the tests'.
const MASK_TPL = Object.freeze({
  M1: { down: [1, 4, ['ĵĵĵĵĵĵĵĵĵĵĵĵĵ', 'ĵĴ.Ĵ.Ĵ.Ĵ.Ĵ.Ĵĵ', 'ĵ.Ĵ.Ĵ.Ĵ.Ĵ.Ĵ.ĵ', 'ĵĴ.Ĵ.Ĵ.Ĵ.Ĵ.Ĵĵ', '.ĵ.Ĵ.Ĵ.Ĵ.Ĵ.ĵ.', '..ĵĵĵĵĵĵĵĵĵ..', '....ĴĴĴĴĴ....']],
    right: [7, 4, ['ĵĵĵĵĵĵĵ', 'Ĵ.Ĵ.Ĵ.ĵ', '.Ĵ.Ĵ.Ĵĵ', 'Ĵ.Ĵ.Ĵ.ĵ', 'ĵ.Ĵ.Ĵĵ.', 'ĵĵĵĵĵĵ.', 'ĴĴĴĴ...']],
    up: [0, 6, ['ĵ.............ĵ', 'ĵĵĵĵĵĵĵĵĵĵĵĵĵĵĵ']] },
  M2: { down: [1, 4, ['ĵĵĵĵĵĵĵĵĵĵĵĵĵ', 'ĵlþþþþþþþþþþĵ', 'ĵþþþþþþþþþþÞĵ', 'ĵĵĵĵĵĵĵĵĵĵĵĵĵ', '.ĵĵĴĵĵĴĵĵĴĵĵ.', '..ĵĵĵĵĵĵĵĵĵ..', '....ĴĴĴĴĴ....']],
    right: [7, 4, ['ĵĵĵĵĵĵĵ', 'ĵĵlþþþĵ', 'ĵĵþþþÞĵ', 'ĵĵĵĵĵĵĵ', 'ĵĵĴĵĴĵ.', 'ĵĵĵĵĵĵ.', 'ĴĴĴĴ...']],
    up: [0, 6, ['ĵ.............ĵ', 'ĵĵĵĵĵĵĵĵĵĵĵĵĵĵĵ']] },
  M3: { down: [1, 3, ['ĵĵĵĵĵĵĵĵĵĵĵĵĵ', 'ĵlþþþþþþþþþþĵ', 'ĵþþþþþþþþþþÞĵ', 'ĵþþþþþþþþþþÞĵ', 'ĵþþþþþþþþþÞÞĵ', '.ĵĵĵĵĵĵĵĵĵĵĵ.', '..ĵĴĴĴĴĴĴĴĵ..', '....ĴĴĴĴĴ....']],
    right: [7, 3, ['ĵĵĵĵĵĵĵ', 'ĵlþþþþĵ', 'ĵþþþþÞĵ', 'ĵþþþþÞĵ', 'ĵþþþÞÞĵ', 'ĵĵĵĵĵĵ.', 'ĵĴĴĴĵ..', 'ĴĴĴ....']],
    up: [0, 5, ['ĵ.............ĵ', 'ĵĵĵĵĵĵĵĵĵĵĵĵĵĵĵ']] },
});
/** The masks' looks to score and the default (the doll's MASK_LOOKS' ids), with their colours: the frame (ĵ) and the lens (þ). */
export const FOF_MASKS = Object.freeze({
  M1: Object.freeze({ id: 'M1', name: 'M1 the mesh: a wire mesh in a black frame', frame: 0x24262d, lens: 0x30333b }),
  M2: Object.freeze({ id: 'M2', name: 'M2 lens and shell: a clear lens, a moulded lower shell, three vents', frame: 0x2e3139, lens: 0x8fb4c8 }),
  M3: Object.freeze({ id: 'M3', name: 'M3 the shield: a smoked shield to the jaw, a chin guard', frame: 0x24262d, lens: 0x4e6474 }),
});
export const FOF_MASK = 'M2';
const masks = new Map();
/** A mask's template for a view at a head box bw × bh: { x, y, rows } from the box's top-left ('left' mirrored from 'right'), or null with no such mask. */
export function fofMaskTpl(id, view, bw, bh) {
  const M = MASK_TPL[id];
  if (!M) return null;
  const key = `${id}|${view}|${bw}x${bh}`;
  let t = masks.get(key);
  if (t === undefined) {
    const v = view === 'left' ? 'right' : view, src = M[v] ?? M.down, sideOn = v === 'right';
    t = resample(src, bw, bh, sideOn ? REF.sideW : REF.w);
    if (view === 'left') t = mirror(t, bw);
    masks.set(key, t);
  }
  return t;
}
/** A mask's role colours for a look's (outfits.js coloursOf: ĵ the frame, þ the lens). */
export const fofMaskColours = (id) => { const M = FOF_MASKS[id] ?? FOF_MASKS[FOF_MASK]; return { ĵ: M.frame, þ: M.lens }; };
