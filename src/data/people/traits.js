// OLYMPUS data: personality, the six axes and the tags (PEOPLE §3.6).
//
// Six integer axes from −3 to +3 (AXES, in PEOPLE §3.6's order), each drawn from TRAIT_WEIGHTS (−3:
// 3%, −2: 10%, −1: 22%, 0: 30%, +1: 22%, +2: 10%, +3: 3%). Promotion selects people, so NCOS_ADD
// says what a rank's kind adds before clamping: an NCO +1 to drive and rules, a staff NCO or an
// officer +1 to nerve as well (PEOPLE §3.6, "(my call)" there). What each axis drives is PEOPLE's
// table, read by the systems that need it (none yet this round: the axes are data here).
//
// TAGS are PEOPLE §3.6's thirty, each { id, w, excl, need }: w its weight in the draw (my calls:
// common habits 4 to 6, the strong ones 2, the ugly ones 1), excl the tags it never sits with
// (PEOPLE: no `squared-away` with `shammer`, no `teetotal` with `drinker`; and my calls: `discreet`
// against `gossip`, `forgiving` against `grudge-holder`, `loner` against `party-animal`, `clean-freak`
// against `slob`, `early-bird` against `night-owl`, `protective` against `bully`), and need what a
// person must be to carry it ({ axis: [min, max] } on the axes, or homeNot: home kinds it is never
// drawn for): PEOPLE's `bully` only with temper ≥ 1 and warmth ≤ −1; `earther-hater` never for the
// Earth-born, `belt-sympathiser` never for the Belt-born (they are the Belters); a `loner` has social
// ≤ 0 and a `party-animal` social ≥ 0 (my calls). A tier 1 or 2 person carries TAGS_T12 (two), a tier
// 3 TAGS_T3 (one). A background's bias multiplies a tag's weight (src/data/people/backgrounds.js).

/** The six axes (PEOPLE §3.6). */
export const AXES = Object.freeze(['nerve', 'drive', 'warmth', 'temper', 'rules', 'social']);
/** The draw for one axis: [[value, weight %]…] (PEOPLE §3.6). */
export const TRAIT_WEIGHTS = Object.freeze([[-3, 3], [-2, 10], [-1, 22], [0, 30], [1, 22], [2, 10], [3, 3]].map(p => Object.freeze(p)));
export const TRAIT_MIN = -3, TRAIT_MAX = 3;
/** What a rank's kind adds to the axes before clamping (PEOPLE §3.6). */
export const NCOS_ADD = Object.freeze({
  junior: Object.freeze({}),
  nco: Object.freeze({ drive: 1, rules: 1 }),
  snco: Object.freeze({ drive: 1, rules: 1, nerve: 1 }),
  officer: Object.freeze({ drive: 1, rules: 1, nerve: 1 }),
});

const t = (id, w, excl = [], need = {}) => Object.freeze({ id, w, excl: Object.freeze(excl), need: Object.freeze(need) });

/** The tags (PEOPLE §3.6), with their weights, exclusions and needs. */
export const TAGS = Object.freeze([
  t('joker', 5), t('gossip', 4, ['discreet']), t('discreet', 4, ['gossip']), t('straight-shooter', 4),
  t('gym-rat', 6), t('bookish', 3), t('devout', 3), t('homesick', 3), t('letter-writer', 4),
  t('drinker', 3, ['teetotal']), t('teetotal', 2, ['drinker']), t('gambler', 3), t('mother-hen', 2),
  t('sea-lawyer', 2), t('shammer', 2, ['squared-away']), t('squared-away', 4, ['shammer']),
  t('grudge-holder', 2, ['forgiving']), t('forgiving', 3, ['grudge-holder']),
  t('loner', 3, ['party-animal'], { social: [-3, 0] }), t('party-animal', 3, ['loner'], { social: [0, 3] }),
  t('clean-freak', 3, ['slob']), t('slob', 2, ['clean-freak']), t('night-owl', 3, ['early-bird']), t('early-bird', 3, ['night-owl']),
  t('schemer', 2), t('protective', 3, ['bully']), t('bully', 1, ['protective'], { temper: [1, 3], warmth: [-3, -1] }),
  t('earther-hater', 1, [], { homeNot: ['earth'] }), t('belt-sympathiser', 1, [], { homeNot: ['belt'] }), t('terraformer', 2),
]);

/** Tags a person carries by tier (PEOPLE §3.6). */
export const TAGS_T12 = 2, TAGS_T3 = 1;
