// OLYMPUS data: the homes of the Corps' marines, with their shares, places, kinds and name cultures (SETTING §4.7; PEOPLE §3.4).
//
// SETTING §4.7's table, as data for PEOPLE's roster generator and CAREER's birthplaces: each home id
// (CAREER §4.3 uses the same ids) with its share among enlisted marines (out of 100), the places
// inside it (a person's place is drawn evenly from the list), its kind for PEOPLE's hooks
// (`valley-town` grew up breathing open air, `dome` never did, `sea-shore` swims, `orbital` is a Navy
// or freighter family, `belt` was born in low gravity, `earth` in 1 G: BODY reads childhood gravity
// from the home id), and its name culture (SETTING §12.1, src/data/setting/names.js CULTURES).
// `lowG` marks Callisto's dome towns, a dome kind in low gravity. `founderLondres` marks the one home
// whose founders' names are twice as common (SETTING §12.1). The places are SETTING's own words
// (Redwater, Canal Town, the Melas and Coprates farms; Low Hellas and the lake towns; Ochre Basin,
// Coldspring, the northern coast; and so on). WOMEN_FRAC is §4.7's 30%, the same in every billet.

const home = (id, share, kind, culture, places, more = {}) => Object.freeze({ id, share, kind, culture, places: Object.freeze(places), ...more });

/** The homes, in SETTING §4.7's order: shares sum to 100. */
export const HOMES = Object.freeze([
  home('redwater', 30, 'valley-town', 'mars-valley', ['Redwater', 'Canal Town', 'the Melas farms', 'the Coprates farms']),
  home('tharsis', 18, 'dome', 'mars-dome', ['the Tharsis domes', 'Dustfall', 'Highrim']),
  home('londres', 9, 'dome', 'mars-dome', ['Londres Nova'], { founderLondres: true }),
  home('hellas', 12, 'sea-shore', 'mars-valley', ['Low Hellas', 'the Hellas lake towns']),
  home('seacoast', 10, 'sea-shore', 'mars-valley', ['Ochre Basin', 'Coldspring', 'the northern coast']),
  home('farms', 7, 'valley-town', 'mars-valley', ['the Chryse co-ops', 'the Isidis co-ops', 'the Acidalia co-ops']),
  home('callisto', 5, 'dome', 'jovian', ['the Callisto domes'], { lowG: true }),
  home('aboard', 3, 'orbital', 'mars-dome', ['Phobos', 'a Navy family afloat', 'a freighter family']),
  home('ceres', 4, 'belt', 'belter', ['Ceres']),
  home('earth', 2, 'earth', 'earther', ['Earth']),
]);

/** A home's record by id, or null. */
export const homeOf = (id) => HOMES.find(h => h.id === id) ?? null;

/** Women's share of the Corps and of its infantry, the same in every billet (SETTING §4.7). */
export const WOMEN_FRAC = 0.30;
