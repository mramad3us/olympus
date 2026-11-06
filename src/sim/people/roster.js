// OLYMPUS people: the roster generator's first cut, Echo Company drawn from the world's seed (PEOPLE §3; the 0.0.3 build sheet §2.2).
//
// The user, 2026-11-05: "All people generated". Every person is drawn from the world's seed out of
// authored pools (src/data/setting/names.js and homes.js, src/data/people/*), and only the posts they
// fill are authored (src/data/people/billets.js). rollRoster(state, { companyId, leave }) fills
// state.people, state.units and the name registry with Echo Company: its headquarters (13 on
// '2/4-E'), then its three rifle platoons (each its headquarters of 5, then its three squads of 13),
// 145 billets, every one filled but `leave`, the player's (rifleman, 2nd fire team, 1st Squad, 2nd
// Platoon: PEOPLE §3.12), which fillPlayer fills after. Ids are `p<n>` by nextId in that billet order,
// so the same world numbers the same people (p1 the company commander, p63 the 1st Squad's leader).
//
// Each person's dice are their own: stream('roster', seed, unitId, billet) (PEOPLE §3.1), so one
// billet's draws never move another's. On it, in a fixed order: sex (WOMEN_FRAC 30% in every billet),
// rank by the billet's weights, age and time in service (below), home and the place in it (SETTING
// §4.7's shares), background by home kind (PEOPLE §3.7), the six axes (PEOPLE §3.6: NCOs +1 drive and
// rules, staff NCOs and officers +1 nerve too, the background's bias, clamped to ±3), two tags by
// weight with their exclusions and needs, whether they have a quirk (tier 1 always, tier 2 at 50%)
// and a nickname (NICK_FRAC: 40% tier 1, 20% tier 2), the body (height and frame by sex) and the look
// (skin, cut, hair colour, a look seed). What depends on the people drawn before is drawn on side
// streams of the same billet, so a reroll moves nothing else of theirs: the name ('name': up to
// NAME_REROLLS 10 draws against the registry, SETTING's blocklist, the squad's given and family
// names and the company's family names, then a middle name if the full name is still taken), the
// quirk ('quirk': a squad's are all different) and the nickname ('nick': SETTING §12.3's pools by
// surname pun, quirk, home, body and irony; a squad's are all different). A family name already in the
// company once takes the unit's usual fix as a nickname when it has none ("Big Okonjo", "Tharsis
// Okonjo": PEOPLE §3.5).
//
// Age (PEOPLE §3.3): Earth years on the UTC calendar, from a triangle over the rank's range with its
// mode at 35%, in whole days before the roster's reference time ms (START_MS, the world's start, so a
// world gives the same company whatever hour the game starts at: my call). The time in service must
// suit the rank (src/data/people/ranks.js: CAREER §8.1's minimum TIS, and for Pvt and PFC the most
// before the automatic promotion): for those two the service is drawn and the enlistment age must fall
// in 18 to 21; for the rest the enlistment (or commissioning) age is drawn and the service must reach
// the minimum. Redrawn AGE_REDRAWS 5 times, then the age is raised to fit. bornMs and enlistedMs follow.
//
// Looks (VIEWS §3.9, as the sheet narrows it): every pair of a rifle squad differs in at least two of
// skin, hair style and hair colour. squadLooks() runs over each squad in billet order (the player's
// empty billet counted, with the sex and age fillPlayer will draw, so the player's look always fits):
// a look that clashes with one placed before, or leaves the rest of the squad no way to fit (an exact
// search, feasible()), is redrawn on the squad's stream ('looks') up to LOOK_REROLLS 10 times, then
// picked by weight from every look that fits. A squad of thirteen men, or of nine women or more,
// cannot meet the rule on these three alone (the kit's three men's cuts by four skins make twelve
// (skin, cut) pairs, the women's two cuts eight), about 1.7% of squads at 30% women (1.67% in the
// integrator's count, v0.0.3): there the
// clashes are kept fewest and counted (stats.lookClashes).
//
// fillPlayer(state, { unitId, billet }) draws the player as any billet's person (their own stream),
// tier 1, without personality axes, tags, quirk or nickname (PEOPLE §3.12: the player plays the
// personality), takes the next id after the roster, fills the billet, sets state.player.id and picks
// the look from what fits the squad on stream('roster', seed, unitId, 'looks', 'player'). Ties, arcs,
// skills, needs, kit and career timelines are not rolled this round (the sheet §2.2). Each person's
// berthId is places' berthOf(unitId, billet) where their room lists them (the rest have none yet).
// Since 0.0.5 drawCore takes the stream it draws on (the roster's by default, so the roster is drawn
// as before), and admitStaff makes a staff post's person (src/sim/people/staff.js: the range officer,
// the coach) on the staff's streams, after the roster and the player, with no billet.
import { stream, next, int, range, pick, chance, weighted } from '../../core/rng.js';
import { DAY_MS } from '../../core/clock.js';
import { nextId, put } from '../../core/ids.js';
import { START_MS } from '../../data/setting/calendar.js';
import { HOMES, WOMEN_FRAC } from '../../data/setting/homes.js';
import { NICKS } from '../../data/setting/names.js';
import { BATTALION, COMPANY, COMPANY_HQ, PLATOON_HQ, SQUAD, RIFLE_PLATOONS, SQUADS_A_PLATOON, PLAYER_BILLET } from '../../data/people/billets.js';
import { RANKS, AGE_MODE_FRAC, ENTRY_AGE_Y, AGE_REDRAWS } from '../../data/people/ranks.js';
import { AXES, TRAIT_WEIGHTS, TRAIT_MIN, TRAIT_MAX, NCOS_ADD, TAGS, TAGS_T12 } from '../../data/people/traits.js';
import { BACKGROUNDS, BG_W_FIT, BG_W_ANY, MARS_KINDS } from '../../data/people/backgrounds.js';
import { QUIRKS, QUIRK_FRAC } from '../../data/people/quirks.js';
import { SKINS, HAIR_STYLES, HAIR_COLOURS, GREY_FROM_Y, GREY_W, HEIGHTS_M, BUILDS, BODY_TMPL, LOOK_SEED_MAX, LOOK_REROLLS } from '../../data/people/looks.js';
import { personName, middleName, fullName, registerName, nameRejected } from './names.js';
import { berthOf } from '../places/fixtures.js';
import { BODY_V } from '../body/record.js';

/** A full name's draws before the middle-name escape (SETTING §12.5), and the most draws a name gets in all. */
export const NAME_REROLLS = 10, NAME_DRAWS_MAX = 100;
/** The share of each tier with a nickname at generation (PEOPLE §3.5). */
export const NICK_FRAC = Object.freeze({ 1: 0.4, 2: 0.2, 3: 0 });
/** A year and a month in days (Earth years on the UTC calendar: PEOPLE §3.3). */
export const YEAR_D = 365.25, MONTH_D = YEAR_D / 12;
// (the nickname's kinds and their weights: my calls)
const NICK_KINDS = Object.freeze([['pun', 30], ['quirk', 20], ['home', 20], ['body', 15], ['ironic', 15]]);
const QUIRK_REROLLS = 10, NICK_REROLLS = 10;
const ORD = ['1st', '2nd', '3rd'];

// ---- the company's billets, in the roster's order ----

/** The units the roster fills, in order: the battalion, the company, then each platoon and its squads. */
export function rosterUnits(companyId = COMPANY.id) {
  const out = [BATTALION.id, companyId];
  for (let p = 1; p <= RIFLE_PLATOONS; p++) {
    out.push(`${companyId}-${p}`);
    for (let s = 1; s <= SQUADS_A_PLATOON; s++) out.push(`${companyId}-${p}-${s}`);
  }
  return out;
}
/** Echo's units: ['2/4', '2/4-E', '2/4-E-1', '2/4-E-1-1' … '2/4-E-3-3']. */
export const ROSTER_UNITS = Object.freeze(rosterUnits());

/** Every billet the roster fills, in order: [{ unitId, def, squad }] (squad: the squad's unit id, or null). */
export function rosterBillets(companyId = COMPANY.id) {
  const out = COMPANY_HQ.map(def => ({ unitId: companyId, def, squad: null }));
  for (let p = 1; p <= RIFLE_PLATOONS; p++) {
    const plt = `${companyId}-${p}`;
    for (const def of PLATOON_HQ) out.push({ unitId: plt, def, squad: null });
    for (let s = 1; s <= SQUADS_A_PLATOON; s++) for (const def of SQUAD) out.push({ unitId: `${plt}-${s}`, def, squad: `${plt}-${s}` });
  }
  return out;
}

/** A billet's definition by unit and key, or null. */
export function billetDef(unitId, key) {
  const depth = unitId.split('-').length;                          // ('2/4-E' 2, a platoon 3, a squad 4)
  const table = depth === 2 ? COMPANY_HQ : depth === 3 ? PLATOON_HQ : depth === 4 ? SQUAD : [];
  return table.find(d => d.key === key) ?? null;
}

/** A person's tier by billet (the sheet §2.2): 1 for the player's squad, its platoon's HQ and the company's commander, first sergeant and gunnery sergeant; 2 for the rest. */
export function tierOf(unitId, key, leave = PLAYER_BILLET) {
  const squad = leave.unitId, platoon = squad.slice(0, squad.lastIndexOf('-')), company = platoon.slice(0, platoon.lastIndexOf('-'));
  if (unitId === squad || unitId === platoon) return 1;
  if (unitId === company && ['co', '1sg', 'gysgt'].includes(key)) return 1;
  return 2;
}

// ---- the draws ----

// (a triangle over [lo, hi) with its mode at c: sqrt is exactly rounded in IEEE 754, so every engine agrees)
function tri(r, lo, c, hi) {
  const u = next(r), f = (c - lo) / (hi - lo);
  return u < f ? lo + Math.sqrt(u * (hi - lo) * (c - lo)) : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - c));
}
const clampTrait = (v) => (v < TRAIT_MIN ? TRAIT_MIN : v > TRAIT_MAX ? TRAIT_MAX : v);
const fitsHome = (bg, kind) => bg.homes.includes('any') || bg.homes.includes(kind) || (bg.homes.includes('mars') && MARS_KINDS.includes(kind));
const bgWeight = (bg, kind) => (bg.homes.includes(kind) ? BG_W_FIT : BG_W_ANY);

/** Age and time in service in whole days, for a rank (see the header). */
export function drawAge(r, rankCode) {
  const rk = RANKS[rankCode];
  const [alo, ahi] = rk.ageY, [tmin, tmax] = rk.tisMo;
  const [elo, ehi] = rk.kind === 'officer' ? ENTRY_AGE_Y.officer : ENTRY_AGE_Y.enlisted;
  const mode = alo + AGE_MODE_FRAC * (ahi + 1 - alo);
  let ageD = 0, tisD = 0, entryD = 0, ok = false, redraws = 0;
  for (let k = 0; k <= AGE_REDRAWS && !ok; k++) {
    if (k) redraws++;
    ageD = Math.floor(tri(r, alo, mode, ahi + 1) * YEAR_D);
    if (tmax !== null) {                                            // (the automatic ranks: the service drawn, the enlistment age checked)
      tisD = Math.floor(range(r, tmin, tmax) * MONTH_D);
      entryD = ageD - tisD;
      ok = entryD >= elo * YEAR_D && entryD < (ehi + 1) * YEAR_D;
    } else {                                                        // (the rest: the entry age drawn, the service checked)
      entryD = Math.floor(range(r, elo, ehi + 1) * YEAR_D);
      tisD = ageD - entryD;
      ok = tisD >= tmin * MONTH_D;
    }
  }
  if (!ok) {                                                        // (raised to fit: PEOPLE §3.3)
    if (tmax !== null) { entryD = Math.max(entryD, Math.ceil(elo * YEAR_D)); ageD = entryD + tisD; }
    else { tisD = Math.ceil(tmin * MONTH_D); ageD = entryD + tisD; }
  }
  return { ageD, tisD, redraws, raised: !ok };
}

/** The colours a person's hair may take, by skin and age: [[colour, weight]…]. */
export function hairColours(skin, ageY) {
  const base = HAIR_COLOURS[skin];
  return ageY >= GREY_FROM_Y ? [...base, ['grey', GREY_W]] : base;
}

/** A look's three attributes drawn on r for a person of sex and age: { skin, style, color }. */
export function drawLookParts(r, sex, ageY) {
  const skin = weighted(r, SKINS);
  const style = weighted(r, HAIR_STYLES[sex]);
  return { skin, style, color: weighted(r, hairColours(skin, ageY)) };
}

// (the tags, drawn by weight without replacement, minding exclusions and needs)
function drawTags(r, n, traits, homeKind, bg) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const pairs = [];
    for (const t of TAGS) {
      if (out.includes(t.id) || out.some(o => t.excl.includes(o) || TAGS.find(x => x.id === o).excl.includes(t.id))) continue;
      if (t.need.homeNot?.includes(homeKind)) continue;
      if (AXES.some(ax => t.need[ax] && ((traits[ax] ?? 0) < t.need[ax][0] || (traits[ax] ?? 0) > t.need[ax][1]))) continue;
      pairs.push([t.id, t.w * (bg.tags[t.id] ?? 1)]);
    }
    if (!pairs.length) break;
    out.push(weighted(r, pairs));
  }
  return out;
}

/**
 * The draws of one billet's person on their own stream, in the fixed order of the header: { sex,
 * rank, ageD, tisD, home, place, background, traits, tags, hasQuirk, hasNick, body, look, ageY }.
 */
export function drawCore(seed, unitId, def, tier, r = stream('roster', seed, unitId, def.key)) {
  const sex = chance(r, WOMEN_FRAC) ? 'f' : 'm';
  const rank = weighted(r, def.ranks);
  const { ageD, tisD, redraws, raised } = drawAge(r, rank);
  const home = weighted(r, HOMES.map(h => [h, h.share]));
  const place = pick(r, home.places);
  const bgs = BACKGROUNDS.filter(g => fitsHome(g, home.kind));
  const bg = weighted(r, bgs.map(g => [g, bgWeight(g, home.kind)]));
  const traits = {};
  const add = NCOS_ADD[RANKS[rank].kind];
  for (const ax of AXES) traits[ax] = clampTrait(weighted(r, TRAIT_WEIGHTS) + (add[ax] ?? 0) + (bg.traits[ax] ?? 0));
  const tags = drawTags(r, TAGS_T12, traits, home.kind, bg);
  const hasQuirk = chance(r, QUIRK_FRAC[tier] ?? 0) || tier === 1;
  const hasNick = chance(r, NICK_FRAC[tier] ?? 0);
  const [hlo, hmode, hhi] = HEIGHTS_M[sex];
  const heightM = Math.round(tri(r, hlo, hmode, hhi) * 100) / 100;
  const build = weighted(r, BUILDS[sex]);
  const ageY = ageD / YEAR_D;
  const parts = drawLookParts(r, sex, ageY);
  const lookSeed = 1 + int(r, LOOK_SEED_MAX);
  return { sex, rank, ageD, tisD, ageRedraws: redraws, ageRaised: raised, home, place, bg, traits, tags, hasQuirk, hasNick,
    body: { heightM, build }, parts, lookSeed, ageY };
}

// ---- the squad's looks (VIEWS §3.9) ----

const differs = (a, b) => (a.skin !== b.skin) + (a.style !== b.style) + (a.color !== b.color);
/** Whether two looks' parts differ in at least two of skin, style and colour. */
export const lookApart = (a, b) => differs(a, b) >= 2;

// Looks as codes: two looks are apart exactly when they share no pair of (skin, style), (skin,
// colour), (style, colour), so a squad's looks so far are three sets of pairs, and a look is free
// when none of its three pairs is taken: one test a look, not one a placed look.
const SKIN_I = Object.fromEntries(SKINS.map(([k], i) => [k, i]));
const STYLE_I = { crew: 0, short: 1, bald: 2, bun: 3 };
const COLOUR_I = { black: 0, dark: 1, brown: 2, auburn: 3, blond: 4, grey: 5 };
const codeOf = (L) => ({ s: SKIN_I[L.skin], t: STYLE_I[L.style], c: COLOUR_I[L.color] });
const taken = () => ({ st: new Uint8Array(16), sc: new Uint8Array(24), tc: new Uint8Array(24) });
const isFree = (T, k) => !T.st[k.s * 4 + k.t] && !T.sc[k.s * 6 + k.c] && !T.tc[k.t * 6 + k.c];
const mark = (T, k, v) => { T.st[k.s * 4 + k.t] = v; T.sc[k.s * 6 + k.c] = v; T.tc[k.t * 6 + k.c] = v; };
// (every look a member may take, by weight: [{ skin, style, color, w, k }])
const optionCache = new Map();
function looksFor(m) {
  const key = `${m.sex}|${m.ageY >= GREY_FROM_Y ? 'g' : ''}`;
  let out = optionCache.get(key);
  if (out) return out;
  out = [];
  for (const [skin, ws] of SKINS) for (const [style, wst] of HAIR_STYLES[m.sex]) for (const [color, wc] of hairColours(skin, m.ageY)) {
    const L = { skin, style, color, w: ws * wst * wc };
    L.k = codeOf(L);
    out.push(Object.freeze(L));
  }
  optionCache.set(key, Object.freeze(out));
  return out;
}
const FEASIBLE_NODES = 20_000;
// (whether the members still to come can each take a free look, given the pairs taken: an exact
// search, the member with the fewest looks left first, capped at FEASIBLE_NODES nodes)
// (a quick necessary test first: each still to come needs a (skin, cut) pair of their own, men's
// in the crew and bald columns or the short one, women's in the bun column or the short one)
function cellsFit(T, rest, done) {
  let men = 0, women = 0, cb = 0, sh = 0, bun = 0;
  for (let i = 0; i < rest.length; i++) if (!done[i]) { if (rest[i].sex === 'f') women++; else men++; }
  for (let sk = 0; sk < 4; sk++) { cb += !T.st[sk * 4] + !T.st[sk * 4 + 2]; sh += !T.st[sk * 4 + 1]; bun += !T.st[sk * 4 + 3]; }
  return Math.max(0, men - cb) + Math.max(0, women - bun) <= sh;
}
function feasibleFrom(T, rest) {
  if (!rest.length) return true;
  const options = rest.map(looksFor), done = new Uint8Array(rest.length);
  let nodes = 0;
  function dfs(left) {
    if (!left) return true;
    if (++nodes > FEASIBLE_NODES || !cellsFit(T, rest, done)) return false;
    let best = -1, bestN = Infinity;
    for (let i = 0; i < rest.length; i++) {
      if (done[i]) continue;
      let n = 0;
      for (const L of options[i]) if (isFree(T, L.k)) n++;
      if (!n) return false;
      if (n < bestN) { best = i; bestN = n; }
    }
    done[best] = 1;
    for (const L of options[best]) {
      if (!isFree(T, L.k)) continue;
      mark(T, L.k, 1);
      const ok = dfs(left - 1);
      mark(T, L.k, 0);
      if (ok) { done[best] = 0; return true; }
    }
    done[best] = 0;
    return false;
  }
  return dfs(rest.length);
}
/** Whether members can each take a look apart from the placed looks and from each other. */
export function feasible(placed, rest) {
  const T = taken();
  for (const p of placed) mark(T, codeOf(p), 1);
  return feasibleFrom(T, rest);
}

// (one member's look, apart from the placed and leaving the rest a way to fit: see the header)
function placeLook(T, placedList, m, rest, r, stats, ahead) {
  const ok = (L) => { const k = codeOf(L); if (!isFree(T, k)) return false; if (!ahead) return true; mark(T, k, 1); const f = feasibleFrom(T, rest); mark(T, k, 0); return f; };
  let L = m.parts;
  if (!ok(L)) {
    let found = false;
    for (let n = 0; n < LOOK_REROLLS && !found; n++) { stats.redraws++; L = drawLookParts(r, m.sex, m.ageY); found = ok(L); }
    if (!found) {
      const fits = looksFor(m).filter(ok);
      if (fits.length) { stats.picks++; const c = weighted(r, fits.map(f => [f, f.w])); L = { skin: c.skin, style: c.style, color: c.color }; }
      else {                                                        // (no way to fit: the fewest clashes, by weight)
        const scored = looksFor(m).map(f => ({ f, n: placedList.filter(p => !lookApart(f, p)).length }));
        const fewest = Math.min(...scored.map(x => x.n));
        const c = weighted(r, scored.filter(x => x.n === fewest).map(x => [x.f, x.f.w]));
        L = { skin: c.skin, style: c.style, color: c.color };
        stats.clashes += fewest;
      }
    }
  }
  mark(T, codeOf(L), 1);
  placedList.push(L);
  return L;
}

/**
 * Each member's look made apart from the squad's (see the header). members: [{ sex, ageY, parts }]
 * in billet order, placed: looks already fixed (fillPlayer's squadmates); r the squad's stream.
 * Returns { looks: [parts…] for the members, redraws, picks, clashes }.
 */
export function squadLooks(members, r, placed = []) {
  const T = taken(), list = [...placed], stats = { redraws: 0, picks: 0, clashes: 0 };
  for (const p of placed) mark(T, codeOf(p), 1);
  // (a squad that cannot fit from the start, thirteen men: no look-ahead, so the first fit and the last clash fewest)
  const ahead = feasibleFrom(T, members);
  const looks = members.map((m, i) => placeLook(T, list, m, members.slice(i + 1), r, stats, ahead));
  return { looks, ...stats, fits: ahead };
}

// ---- the person ----

function nickFor(r, rec, quirkId, taken) {
  const kinds = NICK_KINDS.filter(([k]) => (k === 'pun' ? !!NICKS.pun[rec.name.family] : k === 'quirk' ? !!QUIRKS.find(q => q.id === quirkId)?.nick : true));
  for (let k = 0; k < NICK_REROLLS; k++) {
    const kind = weighted(r, kinds);
    const h = rec.body.heightM;
    const nick = kind === 'pun' ? NICKS.pun[rec.name.family]
      : kind === 'quirk' ? QUIRKS.find(q => q.id === quirkId).nick
        : kind === 'home' ? pick(r, NICKS.home[rec.home.id])
          : kind === 'body' ? pick(r, NICKS.body[h >= 1.84 ? 'tall' : h <= 1.66 ? 'short' : rec.body.build])
            : pick(r, NICKS.ironic);
    if (!taken.has(nick)) return nick;
  }
  return null;
}

/** A sparse copy of the axes (TECH §6.6: zeros left out), or null when every one is 0. */
function sparseTraits(traits) {
  const out = {};
  for (const ax of AXES) if (traits[ax]) out[ax] = traits[ax];
  return Object.keys(out).length ? out : null;
}

// (one billet's person record from its core draws; the name, quirk and nick on the billet's side streams)
function makePerson(state, ctx, { unitId, def, squad }, core, tier, { player = false, base = null } = {}) {
  const seed = state.meta.seed;
  const rk = RANKS[core.rank];
  // (the person's side streams: a billet's on the roster's, a post's on the staff's: staff.js)
  const side = (...k) => (base ? stream(...base, ...k) : stream('roster', seed, unitId, def.key, ...k));
  // (the name: up to NAME_REROLLS draws against the rules, then the middle name for a full name still taken)
  const rn = side('name');
  const sq = squad ? ctx.squads.get(squad) : null;
  const rules = { tier, squad: sq, companyFamily: ctx.family };
  let name = null;
  for (let k = 0; k < NAME_DRAWS_MAX && !name; k++) {
    const n = personName(core.home.culture, core.home.id, core.sex, rn);
    ctx.stats.drawn++;
    const why = nameRejected(state, n, k < NAME_REROLLS ? rules : { ...rules, registry: false });
    if (!why) { name = n; break; }
    ctx.stats.rerolled[why] = (ctx.stats.rerolled[why] ?? 0) + 1;
  }
  if (!name) throw new Error(`people: no name fits ${unitId} ${def.key} after ${NAME_DRAWS_MAX} draws`);
  for (let k = 0; nameRejected(state, name, rules) === 'taken' && k < NAME_REROLLS; k++) { name.middle = middleName(core.home.culture, core.home.id, core.sex, rn); ctx.stats.middle++; }
  // (the quirk, a squad's all different)
  let quirk = null;
  if (core.hasQuirk && !player) {
    const rq = side('quirk');
    for (let k = 0; k < QUIRK_REROLLS && !quirk; k++) { const q = pick(rq, QUIRKS).id; if (!sq?.quirks.has(q)) quirk = q; }
  }
  const rec = {
    id: null, tier, name: { given: name.given, family: name.family }, sex: core.sex,
    bornMs: ctx.refMs - core.ageD * DAY_MS,
    home: { id: core.home.id, place: core.place, kind: core.home.kind }, culture: core.home.culture,
    service: { branch: def.branch, rank: core.rank, grade: rk.grade, mos: def.mos, unitId, billet: def.key, enlistedMs: ctx.refMs - core.tisD * DAY_MS },
    background: core.bg.id,
    body: { v: BODY_V, tmpl: BODY_TMPL[core.sex], heightM: core.body.heightM, build: core.body.build },   // (BODY's record at its version: its ledgers from the template, src/sim/body/record.js)
    look: { skin: core.parts.skin, hair: { style: core.parts.style, color: core.parts.color }, seed: core.lookSeed },
  };
  if (name.middle) rec.name.middle = name.middle;
  if (!player) {
    const traits = sparseTraits(core.traits);
    if (traits) rec.traits = traits;
    if (core.tags.length) rec.tags = core.tags;
    if (quirk) rec.quirks = [quirk];
  }
  // (the nickname, a squad's all different; then the company's fix for a family name it already has)
  if (core.hasNick && !player) {
    const nick = nickFor(side('nick'), rec, quirk, sq?.nicks ?? new Set());
    if (nick) rec.name.nick = nick;
  }
  const first = ctx.firstOfFamily.get(name.family);
  if (first && !rec.name.nick && !player) {
    const dh = rec.body.heightM - first.body.heightM;
    rec.name.nick = `${dh >= 0.05 ? 'Big' : dh <= -0.05 ? 'Little' : NICKS.home[rec.home.id][0]} ${name.family}`;
    ctx.stats.familyFix++;
  }
  return rec;
}

// (write a made person into the state: their id, the registry, the unit's billet, the squad's sets)
function admit(state, ctx, b, rec) {
  const id = nextId(state, 'p');
  rec.id = id;
  const berth = berthOf(b.unitId, b.def.key);
  if (berth) rec.berthId = berth;
  put(state, state.people, id, rec);
  registerName(state, fullName(rec.name), id);
  state.units[b.unitId].billets[b.def.key] = id;
  ctx.family.set(rec.name.family, (ctx.family.get(rec.name.family) ?? 0) + 1);
  if (!ctx.firstOfFamily.has(rec.name.family)) ctx.firstOfFamily.set(rec.name.family, rec);
  if (b.squad) {
    const sq = ctx.squads.get(b.squad);
    sq.given.add(rec.name.given); sq.family.add(rec.name.family);
    if (rec.quirks) sq.quirks.add(rec.quirks[0]);
    if (rec.name.nick) sq.nicks.add(rec.name.nick);
  }
  return id;
}

function unitRecord(id, companyId) {
  if (id === BATTALION.id) return { name: BATTALION.name };
  if (id === companyId) return { name: companyId === COMPANY.id ? COMPANY.name : companyId, parentId: BATTALION.id, billets: {} };
  return { parentId: id.slice(0, id.lastIndexOf('-')), billets: {} };
}

// (the runtime context a roll keeps for fillPlayer: the squads' names, the company's family names)
function contextOf(state, companyId, refMs) {
  const ctx = { refMs, squads: new Map(), family: new Map(), firstOfFamily: new Map(),
    stats: { drawn: 0, rerolled: {}, middle: 0, familyFix: 0, ageRedraws: 0, ageRaised: 0, lookRedraws: 0, lookPicks: 0, lookClashes: 0 } };
  for (const u of rosterUnits(companyId)) if (u.split('-').length === 4) ctx.squads.set(u, { given: new Set(), family: new Set(), quirks: new Set(), nicks: new Set() });
  // (from what the state already holds, so fillPlayer after a load sees the same squad)
  for (const id of Object.keys(state.people ?? {})) {
    const p = state.people[id];
    if (!p?.service?.unitId || !p.name?.family) continue;
    ctx.family.set(p.name.family, (ctx.family.get(p.name.family) ?? 0) + 1);
    const sq = ctx.squads.get(p.service.unitId);
    if (sq) { sq.given.add(p.name.given); sq.family.add(p.name.family); if (p.quirks?.[0]) sq.quirks.add(p.quirks[0]); if (p.name.nick) sq.nicks.add(p.name.nick); }
  }
  for (const id of Object.keys(state.people ?? {}).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))) {
    const p = state.people[id];
    if (p?.name?.family && !ctx.firstOfFamily.has(p.name.family)) ctx.firstOfFamily.set(p.name.family, p);
  }
  return ctx;
}

/**
 * Roll the company (see the header): state.people, state.units and state.names.people filled, every
 * billet but `leave`. Returns { people, units, ms, stats }: the counts made, the reference time the
 * ages count back from, and what the draws did (names drawn and rerolled by reason, middle names, the
 * family fixes, ages redrawn and raised, looks redrawn, picked and left clashing).
 */
export function rollRoster(state, { companyId = COMPANY.id, leave = PLAYER_BILLET, refMs = START_MS } = {}) {
  state.people ??= {};
  state.units ??= {};
  state.names ??= { people: {}, ships: {}, ops: {} };
  state.names.people ??= {};
  for (const u of rosterUnits(companyId)) if (!state.units[u]) put(state, state.units, u, unitRecord(u, companyId));
  const ctx = contextOf(state, companyId, refMs);
  const seed = state.meta.seed;
  const billets = rosterBillets(companyId);
  // (a squad at a time: its people drawn, their looks made apart, then admitted in billet order)
  const groups = [];
  for (const b of billets) {
    const g = groups.at(-1);
    if (g && g.key === (b.squad ?? b.unitId)) g.list.push(b); else groups.push({ key: b.squad ?? b.unitId, squad: b.squad, list: [b] });
  }
  let made = 0;
  for (const g of groups) {
    const cores = g.list.map(b => {
      const tier = tierOf(b.unitId, b.def.key, leave);
      const core = drawCore(seed, b.unitId, b.def, tier);
      ctx.stats.ageRedraws += core.ageRedraws; ctx.stats.ageRaised += core.ageRaised ? 1 : 0;
      return { b, tier, core, empty: b.unitId === leave.unitId && b.def.key === leave.billet };
    });
    if (g.squad) {
      const out = squadLooks(cores.map(c => ({ sex: c.core.sex, ageY: c.core.ageY, parts: c.core.parts })), stream('roster', seed, g.squad, 'looks'));
      out.looks.forEach((L, i) => { cores[i].core.parts = L; });
      ctx.stats.lookRedraws += out.redraws; ctx.stats.lookPicks += out.picks; ctx.stats.lookClashes += out.clashes;
    }
    for (const c of cores) {
      if (c.empty) continue;
      const rec = makePerson(state, ctx, c.b, c.core, c.tier);
      admit(state, ctx, c.b, rec);
      made++;
    }
  }
  state.$people ??= {};
  state.$people.rosterStats = ctx.stats;
  return { people: made, units: rosterUnits(companyId).length, ms: refMs, stats: ctx.stats };
}

/**
 * The player: a generated person in the empty billet (see the header), made state.player.id.
 * Returns their person id.
 */
export function fillPlayer(state, { unitId = PLAYER_BILLET.unitId, billet = PLAYER_BILLET.billet, refMs = START_MS } = {}) {
  const def = billetDef(unitId, billet);
  if (!def) throw new Error(`people: no billet '${billet}' on '${unitId}'`);
  if (!state.units?.[unitId]) throw new Error(`people: no unit '${unitId}' in the roster (rollRoster first)`);
  if (state.units[unitId].billets[billet]) throw new Error(`people: ${unitId} ${billet} is filled (${state.units[unitId].billets[billet]})`);
  const companyId = unitId.split('-').slice(0, 2).join('-');
  const ctx = contextOf(state, companyId, refMs);
  const seed = state.meta.seed;
  const core = drawCore(seed, unitId, def, 1);
  const squad = unitId.split('-').length === 4 ? unitId : null;
  if (squad) {
    // (the look: the player's own, else one that fits the squad, picked on the player's look stream)
    const mates = Object.values(state.units[squad].billets).map(id => state.people[id]).filter(Boolean)
      .map(p => ({ skin: p.look.skin, style: p.look.hair.style, color: p.look.hair.color }));
    const out = squadLooks([{ sex: core.sex, ageY: core.ageY, parts: core.parts }], stream('roster', seed, unitId, 'looks', 'player'), mates);
    core.parts = out.looks[0];
    ctx.stats.lookRedraws += out.redraws; ctx.stats.lookPicks += out.picks; ctx.stats.lookClashes += out.clashes;
  }
  const b = { unitId, def, squad };
  const rec = makePerson(state, ctx, b, core, 1, { player: true });
  const id = admit(state, ctx, b, rec);
  state.player ??= {};
  state.player.id = id;
  if (state.$people?.rosterStats) {
    const s = state.$people.rosterStats;
    s.drawn += ctx.stats.drawn; s.lookRedraws += ctx.stats.lookRedraws; s.lookPicks += ctx.stats.lookPicks; s.lookClashes += ctx.stats.lookClashes;
    for (const [k, v] of Object.entries(ctx.stats.rerolled)) s.rerolled[k] = (s.rerolled[k] ?? 0) + v;
  }
  return id;
}

/**
 * A person of a staff post (src/sim/people/staff.js; the 0.0.5 build sheet §2.6): made from their
 * core draws as a billet's person is, named on the post's side streams (base: ['staff', seed, site,
 * post], so the roster's names and the player's move by nothing), given the next id and registered,
 * with no billet in any unit (service.billet names the post). tier 3. Returns their person id.
 */
export function admitStaff(state, core, def, { base, refMs = START_MS, tier = 3 } = {}) {
  const ctx = contextOf(state, COMPANY.id, refMs);
  const rec = makePerson(state, ctx, { unitId: def.unitId, def, squad: null }, core, tier, { base });
  const id = nextId(state, 'p');
  rec.id = id;
  put(state, state.people, id, rec);
  registerName(state, fullName(rec.name), id);
  return id;
}

/** The unit a squad, platoon or company id names, in words ("1st Squad, 2nd Platoon"). */
export function unitName(unitId) {
  const parts = unitId.split('-');
  if (parts.length === 4) return `${ORD[Number(parts[3]) - 1] ?? parts[3]} Squad, ${ORD[Number(parts[2]) - 1] ?? parts[2]} Platoon`;
  if (parts.length === 3) return `${ORD[Number(parts[2]) - 1] ?? parts[2]} Platoon`;
  if (unitId === COMPANY.id) return COMPANY.name;
  if (unitId === BATTALION.id) return BATTALION.name;
  return unitId;
}
