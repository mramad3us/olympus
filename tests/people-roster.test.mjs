// The roster generator's first cut (PEOPLE §3; the 0.0.3 build sheet §2.2, §5.2): Echo Company drawn
// from the world's seed, "All people generated" (the user, 2026-11-05). The counts per rank, billet
// and unit, the people's homes and backgrounds, the 1st Squad's sheet, the names drawn and rerolled,
// the generation's cost and the save's size are printed; what holds is PEOPLE's and SETTING's: 145
// billets, the player's the one left for fillPlayer, ranks from each billet's list, ages in each
// rank's range with the service its rank needs, 20 to 40% women, names from SETTING's pools and
// never its blocklist, unique full names, a squad's given and family names its own, every squad pair
// apart in two of skin, cut and colour, each placed person's berth in their own bay, the same world
// the same bytes, another seed another company, and a golden at seed 48213.
import { assert, fmt } from './helpers.mjs';
import { golden } from './golden.mjs';
import { createGame } from './game.mjs';
import { newState, toJSON } from '../src/core/state.js';
import { initPeople } from '../src/sim/people/domain.js';
import { rollRoster, fillPlayer, rosterBillets, ROSTER_UNITS, drawCore, tierOf, lookApart, squadLooks, YEAR_D, NAME_REROLLS } from '../src/sim/people/roster.js';
import { fullName } from '../src/sim/people/names.js';
import { RANKS } from '../src/data/people/ranks.js';
import { PLAYER_BILLET, SQUAD } from '../src/data/people/billets.js';
import { HOMES } from '../src/data/setting/homes.js';
import { KIT, SKINS, HAIR_STYLES, HEIGHTS_M } from '../src/data/people/looks.js';
import { GIVEN_POOLS, FAMILY_POOLS, BLOCKED_FULL, BLOCKED_FAMILY_T12 } from '../src/data/setting/names.js';
import { START_MS } from '../src/data/setting/calendar.js';
import { DAY_MS } from '../src/core/clock.js';
import { seatOf, berthOf } from '../src/sim/places/fixtures.js';
import { stream } from '../src/core/rng.js';
import { SKIN, HAIR } from '../src/art/figures/outfits.js';
import { placed } from '../src/sim/people/place.js';
import { checkIds } from './ids-check.mjs';

const SEED = 48213;
/** Worlds the looks sweep rolls (each about 30 ms). */
const SWEEP_WORLDS = 80;
// (the roster's people key, digest pinned: PRINT_HASH=1 reprints it, said in CHANGELOG.md when it moves)
const GOLDEN_ROSTER = '015b827a61b0dc';
const ageY = (p) => (START_MS - p.bornMs) / DAY_MS / YEAR_D;
const tisMo = (p) => (START_MS - p.service.enlistedMs) / DAY_MS / (YEAR_D / 12);
const partsOf = (p) => ({ skin: p.look.skin, style: p.look.hair.style, color: p.look.hair.color });
const tally = (list, key) => { const m = {}; for (const x of list) { const k = key(x); m[k] = (m[k] ?? 0) + 1; } return m; };
const line = (m) => Object.entries(m).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ');
const squadIds = (s, unit) => Object.values(s.units[unit].billets);
const ALL_GIVEN = new Set(Object.values(GIVEN_POOLS).flatMap(p => [...p.f, ...p.m, ...p.any]));
const ALL_FAMILY = new Set(Object.values(FAMILY_POOLS).flat());

// (a bare roll: the people domain's empty keys, the roster, then the player)
function roll(seed, { player = true } = {}) {
  const s = newState(seed);
  initPeople(s);
  const out = rollRoster(s);
  const empty = [];
  for (const b of rosterBillets()) if (!s.units[b.unitId].billets[b.def.key]) empty.push(`${b.unitId} ${b.def.key}`);
  const pid = player ? fillPlayer(s) : null;
  return { s, out, empty, pid };
}
const rosterOf = (s) => ({ people: s.people, units: s.units, names: s.names });

export default [
  {
    name: 'Echo Company is drawn from the world\'s seed: 145 billets, 144 generated and the player in 1st Squad\'s ft2-r, the only billet the roster leaves (PEOPLE §3.2, §3.12; "All people generated", the user, 2026-11-05)',
    fn() {
      const times = [];
      let r = null;
      for (let k = 0; k < 5; k++) { const t0 = performance.now(); r = roll(SEED); times.push(performance.now() - t0); }
      const { s, out, empty, pid } = r;
      const people = Object.values(s.people), billets = rosterBillets();
      times.sort((a, b) => a - b);
      const kb = toJSON(s.people).length / 1024;
      assert(billets.length === 145 && out.people === 144 && people.length === 145, JSON.stringify({ billets: billets.length, made: out.people, people: people.length }));
      assert(empty.length === 1 && empty[0] === `${PLAYER_BILLET.unitId} ${PLAYER_BILLET.billet}`, `left empty before fillPlayer: ${empty.join('; ')}`);
      assert(pid === 'p145' && s.player.id === pid && s.units['2/4-E-2-1'].billets['ft2-r'] === pid && s.meta.next.p === 146, JSON.stringify({ pid, next: s.meta.next }));
      assert(Object.keys(s.units).join() === ROSTER_UNITS.join() && ROSTER_UNITS.length === 14, Object.keys(s.units).join());
      // (ids in billet order: the company HQ p1 to p13, 1st Platoon p14 to p57, 2nd Platoon's HQ p58 to p62, its 1st Squad from p63)
      assert(s.units['2/4-E'].billets.co === 'p1' && s.units['2/4-E-1'].billets.pltcmdr === 'p14' && s.units['2/4-E-2'].billets.pltcmdr === 'p58' && s.units['2/4-E-2-1'].billets.sl === 'p63', 'billet order');
      for (const p of people) {
        const b = billets.find(x => x.unitId === p.service.unitId && x.def.key === p.service.billet);
        assert(b && b.def.ranks.some(([rk]) => rk === p.service.rank), `${p.id} ${p.service.unitId} ${p.service.billet}: rank ${p.service.rank} not in ${JSON.stringify(b?.def.ranks)}`);
        const rk = RANKS[p.service.rank], a = ageY(p), t = tisMo(p);
        assert(rk.grade === p.service.grade && p.service.mos === b.def.mos && p.service.branch === b.def.branch, `${p.id}: ${JSON.stringify(p.service)}`);
        assert(a >= rk.ageY[0] && a < rk.ageY[1] + 1, `${p.id} ${p.service.rank} aged ${fmt(a, 2)} (range ${rk.ageY.join('-')})`);
        assert(t >= rk.tisMo[0] - 1e-9 && (rk.tisMo[1] === null || t < rk.tisMo[1]), `${p.id} ${p.service.rank}: ${fmt(t, 1)} months in service (${rk.tisMo.join('-')})`);
        assert(p.tier === tierOf(p.service.unitId, p.service.billet), `${p.id}: tier ${p.tier}`);
        assert(HOMES.some(h => h.id === p.home.id && h.places.includes(p.home.place) && h.kind === p.home.kind && h.culture === p.culture), `${p.id}: home ${JSON.stringify(p.home)} ${p.culture}`);
      }
      const women = people.filter(p => p.sex === 'f').length / people.length;
      assert(women >= 0.2 && women <= 0.4, `women ${fmt(women * 100)}%`);
      const tier1 = people.filter(p => p.tier === 1);
      assert(tier1.length === 21 && tier1.every(p => p.service.unitId === '2/4-E-2-1' || p.service.unitId === '2/4-E-2' || ['co', '1sg', 'gysgt'].includes(p.service.billet)), `tier 1: ${tier1.length}`);
      // (the player plays the personality: no axes, tags, quirk or nickname, PEOPLE §3.12)
      const me = s.people[pid];
      assert(!me.traits && !me.tags && !me.quirks && !me.name.nick && me.tier === 1, JSON.stringify(me));
      assert(times[2] <= 50 && kb <= 120, `generation median ${fmt(times[2])} ms, people ${fmt(kb)} KB`);
      console.log(`      ${billets.length} billets on ${ROSTER_UNITS.length} units; ${out.people} generated and the player ${pid}; empty before fillPlayer: ${empty.join(', ')}`);
      console.log(`      ranks: ${line(tally(people, p => p.service.rank))}`);
      console.log(`      by unit: ${line(tally(people, p => p.service.unitId))}`);
      console.log(`      by billet (squads' 13 alike): ${line(tally(people.filter(p => p.service.unitId.split('-').length !== 4), p => `${p.service.billet}`))}; a squad: ${SQUAD.map(d => d.key).join(' ')}`);
      console.log(`      women ${people.filter(p => p.sex === 'f').length}, men ${people.filter(p => p.sex === 'm').length} (${fmt(women * 100)}% women; SETTING §4.7's 30%)`);
      console.log(`      homes: ${line(tally(people, p => p.home.id))}`);
      console.log(`      cultures: ${line(tally(people, p => p.culture))}`);
      console.log(`      backgrounds: ${line(tally(people, p => p.background))}`);
      console.log(`      tags: ${line(tally(people.flatMap(p => p.tags ?? []), x => x))}`);
      console.log(`      ages by rank (min / mean / max): ${Object.keys(RANKS).filter(k => people.some(p => p.service.rank === k)).map(k => { const a = people.filter(p => p.service.rank === k).map(ageY); return `${k} ${fmt(Math.min(...a))}/${fmt(a.reduce((x, y) => x + y, 0) / a.length)}/${fmt(Math.max(...a))}`; }).join(', ')}`);
      console.log(`      ages redrawn ${out.stats.ageRedraws}, raised ${out.stats.ageRaised}; generation ${fmt(times[0])} ms the first, ${fmt(times[2])} ms the median of 5 (limit 50); the people key ${fmt(kb)} KB (limit 120), ${fmt(kb * 1024 / people.length, 0)} bytes a person`);
      console.log(`      tier 1 (${tier1.length}):`);
      for (const p of tier1) {
        console.log(`        ${p.id.padEnd(5)}${(p.service.unitId + ' ' + p.service.billet).padEnd(20)}${p.service.rank.padEnd(7)}${(fullName(p.name) + (p.name.nick ? ` "${p.name.nick}"` : '')).padEnd(34)}${fmt(ageY(p))}  ${p.sex}  ${p.home.place}, ${p.background}; ${(p.tags ?? []).join('/') || 'no tags'}; ${p.quirks?.[0] ?? 'no quirk'}; ${p.look.skin} ${p.look.hair.style} ${p.look.hair.color}, ${p.body.heightM} m ${p.body.build}`);
      }
    },
  },
  {
    name: 'names come from SETTING\'s pools by culture and sex, never its blocklist; no full name twice in the world, no given or family name twice in a squad, a family name at most twice in the company (PEOPLE §3.5; SETTING §12)',
    fn() {
      const { s, out } = roll(SEED);
      const people = Object.values(s.people);
      const fulls = people.map(p => fullName(p.name));
      assert(new Set(fulls).size === people.length, 'a full name twice');
      assert(Object.keys(s.names.people).length === people.length && people.every(p => s.names.people[fullName(p.name)] === p.id), 'the registry');
      const blocked = new Set(BLOCKED_FULL), blockedFam = new Set(BLOCKED_FAMILY_T12);
      for (const p of people) {
        assert(ALL_GIVEN.has(p.name.given) && ALL_FAMILY.has(p.name.family) && (!p.name.middle || ALL_GIVEN.has(p.name.middle)), `${p.id}: ${fullName(p.name)} not from the pools`);
        assert(!blocked.has(`${p.name.given} ${p.name.family}`) && !blockedFam.has(p.name.family), `${p.id}: ${fullName(p.name)} is blocked`);
      }
      const fam = tally(people, p => p.name.family);
      assert(Object.values(fam).every(n => n <= 2), `a family name thrice: ${line(fam).split(', ').slice(0, 3)}`);
      let squads = 0;
      for (const u of ROSTER_UNITS.filter(x => x.split('-').length === 4)) {
        const sq = squadIds(s, u).map(id => s.people[id]);
        assert(new Set(sq.map(p => p.name.given)).size === sq.length && new Set(sq.map(p => p.name.family)).size === sq.length, `${u}: a name twice in the squad`);
        const nicks = sq.map(p => p.name.nick).filter(Boolean);
        assert(new Set(nicks).size === nicks.length, `${u}: a nickname twice`);
        squads++;
      }
      const t1 = people.filter(p => p.tier === 1 && p.id !== s.player.id), t2 = people.filter(p => p.tier === 2);
      const nickT1 = t1.filter(p => p.name.nick).length / t1.length, nickT2 = t2.filter(p => p.name.nick).length / t2.length;
      console.log(`      ${people.length} full names, all different; ${squads} squads, each with its own given and family names; family names at most twice (${Object.values(fam).filter(n => n === 2).length} pairs, each fixed with a nickname: ${out.stats.familyFix})`);
      console.log(`      names drawn ${out.stats.drawn} for ${people.length} people (rerolled: ${line(out.stats.rerolled) || 'none'}; up to ${NAME_REROLLS} before a middle name, used ${out.stats.middle} times)`);
      console.log(`      nicknames: tier 1 ${fmt(nickT1 * 100, 0)}% (NICK_FRAC 40%), tier 2 ${fmt(nickT2 * 100, 0)}% (20%, and the family fixes); e.g. ${people.filter(p => p.name.nick).slice(0, 6).map(p => `${p.name.given} "${p.name.nick}" ${p.name.family}`).join(', ')}`);
      console.log(`      family names by pool: ${line(tally(people, p => (FAMILY_POOLS.valley.includes(p.name.family) ? 'valley' : FAMILY_POOLS.founder.includes(p.name.family) ? 'founder' : 'family')))}`);
    },
  },
  {
    name: 'looks are the kit\'s, and every pair of a rifle squad differs in at least two of skin, hair style and hair colour (VIEWS §3.9, the sheet\'s three); a sweep of worlds counts the squads that cannot (thirteen men, or nine women or more)',
    fn() {
      const { s, out } = roll(SEED);
      const people = Object.values(s.people);
      for (const p of people) {
        assert(KIT.skins.includes(p.look.skin) && SKIN[p.look.skin] !== undefined && HAIR[p.look.hair.color] !== undefined, `${p.id}: ${JSON.stringify(p.look)} not the kit's`);
        assert(HAIR_STYLES[p.sex].some(([st]) => st === p.look.hair.style), `${p.id} (${p.sex}): cut ${p.look.hair.style}`);
        assert(p.look.hair.color !== 'grey' || ageY(p) >= 32, `${p.id}: grey at ${fmt(ageY(p))}`);
        const [lo, , hi] = HEIGHTS_M[p.sex];
        assert(p.body.heightM >= lo && p.body.heightM <= hi && p.body.heightM >= KIT.heightM[0] && p.body.heightM <= KIT.heightM[1] && KIT.builds.includes(p.body.build), `${p.id}: ${JSON.stringify(p.body)}`);
        assert(p.body.tmpl === (p.sex === 'f' ? 'f-adult' : 'm-adult') && p.body.v === 1 && Number.isInteger(p.look.seed), `${p.id}: ${JSON.stringify(p.body)}`);
      }
      let closest = 3, pairs = 0, clashing = 0;
      for (const u of ROSTER_UNITS.filter(x => x.split('-').length === 4)) {
        const sq = squadIds(s, u).map(id => s.people[id]);
        for (let i = 0; i < sq.length; i++) for (let j = i + 1; j < sq.length; j++) {
          pairs++;
          const a = partsOf(sq[i]), b = partsOf(sq[j]), d = (a.skin !== b.skin) + (a.style !== b.style) + (a.color !== b.color);
          closest = Math.min(closest, d);
          if (!lookApart(a, b)) clashing++;
        }
      }
      const mine = squadIds(s, '2/4-E-2-1').map(id => s.people[id]);
      assert(clashing === 0, `${clashing} squad pairs at seed ${SEED} share two of skin, cut and colour`);
      // (the sweep: how often a world's squad cannot meet the rule, and that the rest always do)
      let worlds = 0, cannot = 0, failedFeasible = 0, playerSquadClash = 0;
      for (let seed = 1000; seed < 1000 + SWEEP_WORLDS; seed++) {
        const w = roll(seed);
        worlds++;
        for (const u of ROSTER_UNITS.filter(x => x.split('-').length === 4)) {
          const sq = squadIds(w.s, u).map(id => w.s.people[id]);
          let bad = 0;
          for (let i = 0; i < sq.length; i++) for (let j = i + 1; j < sq.length; j++) if (!lookApart(partsOf(sq[i]), partsOf(sq[j]))) bad++;
          const men = sq.filter(p => p.sex === 'm').length;
          if (men === 13 || men <= 4) { cannot++; continue; }          // (thirteen men, or nine women or more: twelve and eight (skin, cut) pairs)
          if (bad) { failedFeasible++; if (u === '2/4-E-2-1') playerSquadClash++; }
        }
      }
      assert(failedFeasible === 0, `${failedFeasible} squads that could fit did not (${playerSquadClash} of them the player's)`);
      console.log(`      ${people.length} looks within the kit (skins ${KIT.skins.join(' ')}; cuts ${Object.entries(HAIR_STYLES).map(([k, v]) => `${k} ${v.map(x => x[0]).join('/')}`).join(', ')}; heights ${KIT.heightM.join('-')} m)`);
      console.log(`      seed ${SEED}: ${pairs} squad pairs, none sharing two of the three (closest pair differs in ${closest}); looks redrawn ${out.stats.lookRedraws}, picked from what fits ${out.stats.lookPicks}, clashes left ${out.stats.lookClashes}`);
      console.log(`      1st Squad: ${mine.map(p => `${p.name.family} ${p.look.skin}/${p.look.hair.style}/${p.look.hair.color}`).join(', ')}`);
      console.log(`      skins in the company: ${line(tally(people, p => p.look.skin))} (weights ${SKINS.map(x => x.join(' ')).join(', ')}); cuts: ${line(tally(people, p => p.look.hair.style))}; colours: ${line(tally(people, p => p.look.hair.color))}`);
      console.log(`      sweep: ${worlds} worlds, ${worlds * 9} squads; ${cannot} of thirteen men or nine women or more, which these three attributes cannot set apart (${fmt(cannot / worlds / 9 * 100, 2)}%; 1.31% expected: 0.97% all men, 0.40% nine women or more); every other squad apart`);
    },
  },
  {
    name: 'every placed person\'s berth is a berth of their own bay, and 1st Squad\'s berths are the sheet\'s §2.1 table (the player in rack n1\'s lower berth)',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED });
      const s = g.state, ids = placed(s);
      assert(ids.length === 14, `placed ${ids.length}`);
      const rows = [];
      for (const id of ids) {
        const p = s.people[id], seat = seatOf(p.berthId);
        assert(seat && p.berthId === berthOf(p.service.unitId, p.service.billet), `${id}: berth ${p.berthId}`);
        const bay = `e1.bay-${p.service.unitId.split('-').slice(2).join('-')}`;
        assert(seat.room === bay, `${id} (${p.service.unitId}) sleeps in ${seat.room}, not ${bay}`);
        rows.push(`${p.service.billet} ${p.berthId.replace('f:e1:', '')}`);
      }
      const me = s.people[s.player.id];
      assert(me.berthId === 'f:e1:bay-2-1:rack-n1#2', `the player's berth ${me.berthId}`);
      const want = { 'ft2-tl': 'rack-n0#2', 'ft2-ar': 'rack-n0#3', 'ft2-r': 'rack-n1#2', 'ft2-aar': 'rack-n1#3', 'ft1-tl': 'rack-n2#2', 'ft1-ar': 'rack-n2#3', 'ft1-aar': 'rack-n3#2', 'ft1-r': 'rack-n3#3', 'ft3-tl': 'rack-s0#2', 'ft3-ar': 'rack-s0#3', 'ft3-aar': 'rack-s1#2', 'ft3-r': 'rack-s1#3', sl: 'rack-sl#2' };
      for (const [billet, berth] of Object.entries(want)) assert(berthOf('2/4-E-2-1', billet) === `f:e1:bay-2-1:${berth}`, `${billet}: ${berthOf('2/4-E-2-1', billet)}`);
      const withBerth = Object.values(s.people).filter(p => p.berthId).length;
      console.log(`      placed ${ids.length}: ${rows.join('; ')}`);
      console.log(`      ${withBerth} of ${Object.keys(s.people).length} people have a berth in the areas built (2nd Platoon's three bays and HQ room, and 1st and 3rd Platoons' bays where they are laid)`);
    },
  },
  {
    name: 'the same world twice gives the same bytes, seed 48214 another company, and one billet\'s dice never move another\'s; a golden of { people, units, names } at seed 48213',
    fn() {
      const a = roll(SEED), b = roll(SEED), c = roll(SEED + 1);
      const ja = toJSON(rosterOf(a.s)), jb = toJSON(rosterOf(b.s)), jc = toJSON(rosterOf(c.s));
      assert(ja === jb, 'the same seed gave two companies');
      assert(ja !== jc, 'seeds 48213 and 48214 gave one company');
      const same = Object.keys(a.s.people).filter(id => fullName(a.s.people[id].name) === fullName(c.s.people[id]?.name ?? {})).length;
      // (each billet's core draws are a function of the seed, the unit and the billet alone)
      let checked = 0;
      for (const bt of rosterBillets()) {
        const id = a.s.units[bt.unitId].billets[bt.def.key];
        const p = a.s.people[id], core = drawCore(SEED, bt.unitId, bt.def, tierOf(bt.unitId, bt.def.key));
        assert(p.sex === core.sex && p.service.rank === core.rank && p.home.place === core.place && p.background === core.bg.id && p.body.heightM === core.body.heightM
          && p.look.seed === core.lookSeed && p.bornMs === START_MS - core.ageD * DAY_MS, `${bt.unitId} ${bt.def.key}: not its own stream's draw`);
        checked++;
      }
      // (a game's roster is a bare roll's: the scenario adds nothing to the people but the actors)
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 23 });
      assert(toJSON(rosterOf(g.state)) === ja, 'the barracks game\'s roster differs from a bare roll\'s (the hour moved it?)');
      const d = golden(`the roster, seed ${SEED}`, rosterOf(a.s), GOLDEN_ROSTER);
      console.log(`      seed ${SEED} twice: ${ja.length} bytes, equal; seed ${SEED + 1}: different (${same} of ${Object.keys(a.s.people).length} ids with the same full name); ${checked} billets each their own stream's draw; the barracks game at 23:00 the same roster`);
      console.log(`      the roster's golden ${d} (${fmt(ja.length / 1024)} KB of people, units and names)`);
    },
  },
  {
    name: 'squadLooks fits a squad that can fit, and keeps a squad of thirteen men to its fewest clashes',
    fn() {
      const r = stream('test', 'looks');
      const mix = Array.from({ length: 13 }, (_, i) => ({ sex: i % 4 === 0 ? 'f' : 'm', ageY: 20, parts: { skin: 'tan', style: i % 4 === 0 ? 'bun' : 'crew', color: 'dark' } }));
      const fit = squadLooks(mix, r);
      let bad = 0;
      for (let i = 0; i < 13; i++) for (let j = i + 1; j < 13; j++) if (!lookApart(fit.looks[i], fit.looks[j])) bad++;
      assert(fit.fits && bad === 0, `a mixed squad of identical looks: ${bad} clashes after the pass`);
      const men = Array.from({ length: 13 }, () => ({ sex: 'm', ageY: 20, parts: { skin: 'tan', style: 'crew', color: 'dark' } }));
      const most = squadLooks(men, r);
      let badMen = 0;
      for (let i = 0; i < 13; i++) for (let j = i + 1; j < 13; j++) if (!lookApart(most.looks[i], most.looks[j])) badMen++;
      assert(!most.fits && badMen >= 1 && badMen <= 2, `thirteen men: ${badMen} clashing pairs`);
      console.log(`      13 identical looks (4 women, 9 men): ${fit.redraws} redraws, ${fit.picks} picks, 0 clashes; 13 men: cannot fit, ${badMen} clashing pair (twelve (skin, cut) pairs for thirteen)`);
    },
  },
  {
    name: 'a barracks game\'s ids are each of their kind and name something that exists (TECH §2.3.1): people, units, berths, spots, the actors and their area',
    fn() {
      const g = createGame({ scenario: 'barracks', seed: SEED, hour: 23 });
      const r1 = checkIds(g.state, g.sim.domains);
      g.run(2 * 60_000);
      const r2 = checkIds(g.state, g.sim.domains);
      for (const r of [r1, r2]) assert(!r.invalid.length && !r.dangling.length, JSON.stringify({ invalid: r.invalid.slice(0, 5), dangling: r.dangling.slice(0, 5) }));
      console.log(`      at 23:00: ${r1.checked} ids checked (${Object.entries(r1.byKind).map(([k, n]) => `${k} ${n}`).join(', ')}), none invalid or dangling; two minutes later the same: ${r2.checked}`);
    },
  },
];
