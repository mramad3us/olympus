// test-burn, "Secure for burn" (src/sim/scenarios/burn.js on the gravity's events, src/sim/places/gravity.js; src/data/places/testudo.js; the anywhere note AW§5; the build sheet v0.0.24 §1 D, §6, §8 F118, its numbers read three higher): the berth as authored, R's acts at hand, the bot secured in time on every seed, and a thrown body's card equal to what impactOf wrote.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { burnBot, burnLazyBot, runVoid } from './bots/void.mjs';
import { burnNow, burnOffer, STOW_MS, STRAP_MS } from '../src/sim/scenarios/burn.js';
import { handOffer, handMenu } from '../src/sim/places/hand.js';
import { gravCardOf } from '../src/sim/places/gravity.js';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { BURN_T } from '../src/data/courses.js';
import { BASE_RULES } from '../src/sim/skills/instinct/base.js';
import { BERTH_2, BERTH_SPOTS } from '../src/data/places/testudo.js';
import { SCENES } from '../src/data/scenes.js';
import { gravityAt, localTime } from '../src/sim/places/env.js';
import { footingOf } from '../src/sim/body/footing.js';
import { navOf, isFree } from '../src/sim/places/nav.js';
import { burnSaid } from '../src/ui/cards/anchors.js';
import { checkIds } from './ids-check.mjs';

/** The quick seeds: the jink on some, not on others (C's draw: chance 0.5 on stream(seed, 'grav', 1)). */
export const SEEDS = Object.freeze([48213, 7, 99, 1, 2, 3]);
const S = (ms) => (Number.isFinite(ms) ? `${fmt(ms / 1000, 1)} s` : '-');

/** One scene by a bot to its end: { g, B, ticks, done, ids, profile }. */
export function burnRun({ seed = 48213, bot = burnBot(), maxTicks = 20 * 60 * 4 } = {}) {
  const g = createGame({ scenario: 'test-burn', seed });
  const r = runVoid(g, bot, { view: burnNow, maxTicks });
  return { g, B: burnNow(g.state), ...r, ids: checkIds(JSON.parse(g.save()), g.sim.domains), profile: g.state.places.live.env?.profile ?? null };
}

export default [
  {
    name: 'scene-burn: berthing 2 as authored, coasting at 0 G on UTC; R at hand: the boots on the deck, stow at your locker an item a press, strap in at your rack\'s foot, unstrap strapped; the burn\'s profile the spec\'s, drawn from the seed',
    fn() {
      const g = createGame({ scenario: 'test-burn', seed: 48213 }), s = g.state, me = g.me(), grid = navOf(s, BERTH_2.id, 'C0');
      const G = gravityAt(s, null, me.x, me.z), t = localTime(s.places.live.site, s.clock.ms), F = footingOf(s, s.player.id);
      console.log(`      ${BERTH_2.name}: ${G.gG} G (${G.regime}), the clock ${t.face} ${t.hour}:${String(t.minute).padStart(2, '0')}, you at (${me.x}, ${me.z}) ${F.mode}, boots ${F.hold}`);
      const bad = [];
      if (G.gG !== 0 || t.face !== 'utc' || F.mode !== 'float') bad.push('the start');
      for (const [what, p] of [['the locker\'s spot', BERTH_SPOTS.locker.spot], ['the rack\'s foot', BERTH_SPOTS.rack.foot], ['the start', [BERTH_SPOTS.start.x, BERTH_SPOTS.start.z]]]) {
        console.log(`      ${what} (${p.join(', ')}) free ${isFree(grid, ...p)}`);
        if (!isFree(grid, ...p)) bad.push(what);
      }
      const offers = [];
      const at = (x, z) => { Object.assign(me, { x, z }); return burnOffer(s); };
      offers.push(['the aisle', at(BERTH_SPOTS.start.x, BERTH_SPOTS.start.z)]);
      offers.push(['the locker', at(...BERTH_SPOTS.locker.spot)]);
      offers.push(['the rack', at(...BERTH_SPOTS.rack.foot)]);
      for (const [w, o] of offers) console.log(`      R at ${w}: ${o?.label ?? 'nothing'}`);
      if (offers[0][1]?.id !== 'boots' || offers[1][1]?.id !== 'stow' || offers[1][1]?.durMs !== STOW_MS || offers[2][1]?.id !== 'strap' || offers[2][1]?.durMs !== STRAP_MS) bad.push('R\'s offers');
      const P = s.places.live.env?.profile;
      console.log(`      the profile: ${P ? P.list.map(e => `${e.kind} ${e.toG} G at ${S(e.atMs - P.t0Ms)} (warning ${e.warnS} s, hold ${e.holdS} s${e.surprise ? ', a surprise' : ''})`).join('; ') : 'NONE'} (the spec's ${JSON.stringify(SCENES['test-burn'].env.profile.map(e => e.atS))})`);
      if (!P || P.list[0].kind !== 'burn') bad.push('no profile');
      else {
        const warnS = (P.list[0].atMs - P.t0Ms) / 1000 - P.list[0].warnS;
        if (warnS < 25 || warnS > 45) bad.push(`the warning at ${warnS} s`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'scene-burn (F118): the bot secured in time on every quick seed (boots locked, three items stowed, strapped in at the rack after the 1MC), to the scene\'s end; the card\'s lines',
    timeoutMs: 300_000,
    fn() {
      const bad = [];
      for (const seed of SEEDS) {
        const r = burnRun({ seed }), B = r.B;
        console.log(`      ${seed}: ${r.done ? 'to the end' : 'NOT DONE'} in ${r.ticks} ticks; ${B.summary ?? '-'}; the warning at ${S(B.warn ? B.warn.atMs - r.g.state.armoury.burn.t0Ms : null)}, secured ${B.secured ? `${B.secured.how} after ${S(B.secured.inMs)}` : 'NOT'}; the burn: ${B.onset?.what ?? '-'}; the jink: ${B.jink?.what ?? (B.jinks ? 'pending' : 'none')}`);
        if (!r.done) bad.push(`${seed}: not done`);
        if (!B.secured) bad.push(`${seed}: not secured`);
        if (B.onset?.what && !['couched', 'rode'].includes(B.onset.what)) bad.push(`${seed}: the burn ${B.onset.what}`);
        if (B.onset?.loose) bad.push(`${seed}: ${B.onset.loose} items loose`);
        if (r.ids.invalid.length || r.ids.dangling.length) bad.push(`${seed}: ids`);
      }
      const r = burnRun({ seed: 48213 });
      console.log(`      the card on 48213: ${burnSaid(r.B).join(' / ')}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'scene-burn (F118): a body left floating when the drive lights is thrown, and the card says what impactOf wrote: the speed, the first contact, the injuries, the profile\'s own log',
    timeoutMs: 300_000,
    fn() {
      // (a marine who does nothing about it: pushed off the deck once, floating when the drive lights)
      const r = burnRun({ seed: 48213, bot: burnLazyBot() }), B = r.B, P = r.profile, pid = r.g.state.player.id;
      const mine = (P?.log ?? []).filter(x => x.who === pid);
      console.log(`      the log for you: ${JSON.stringify(mine)}`);
      console.log(`      the card: ${burnSaid(B).join(' / ')}`);
      assert(r.done && B.onset?.what === 'fell' && B.onset.vMs > 0 && Array.isArray(B.onset.injuries), JSON.stringify(B.onset));
      const L = mine.find(x => x.atMs >= B.onset.atMs && x.what === B.onset.what);
      assert(L && L.vMs === B.onset.vMs && JSON.stringify(L.injuries ?? null) === JSON.stringify(B.onset.injuries ?? null) && (L.first ?? null) === B.onset.first, JSON.stringify({ L, onset: B.onset }));
      assert(!B.secured && B.onset.loose === 3, JSON.stringify(B));
    },
  },
  {
    name: 'scene-burn (the fixer of D\'s review, 2026-11-19): R at the burn\'s hold on seed 7 (a jink seed; boots never locked, one push off the deck) is struck, "Stand by for the burn", with no R held menu: no fifteen-minute wait, so the clock stays under 120 s, the jink is logged at its onset and its Grab card is offered',
    fn() {
      const bad = [];
      for (const atS of [49, 60]) {
        const g = createGame({ scenario: 'test-burn', seed: 7 }), s = g.state, t0 = s.clock.ms, P = s.places.live.env.profile;
        let offer = null, menu = null, after = null, cards = 0, n = 0;
        for (; n < 20 * 300 && !burnNow(s)?.end; n++) {
          // (one push off the deck at the start, the lazy marine's: floating when the jink comes, so its card is his)
          let input = n === 2 ? { mx: 1, mz: 0, stroll: true } : {};
          if (n === atS * 20) { offer = handOffer(s); menu = handMenu(s); input = { act: ['hand'] }; }
          // (the surprise's card answered as a player does, Grab first: the bots' way)
          const card = gravCardOf(s);
          if (card?.options?.length) { cards++; const o = card.options.find(x => x.key === 'grab') ?? card.options[0]; input = { act: [{ act: 'grav', args: { card: o.key } }] }; }
          g.step(1, input);
          if (n === atS * 20 + 5) after = (s.clock.ms - t0) / 1000;
        }
        const B = burnNow(s), endS = (s.clock.ms - t0) / 1000, jinkS = P.list[1] ? (P.list[1].atMs - t0) / 1000 : null;
        console.log(`      R at ${atS} s: offered "${offer?.verb} ${offer?.id}: ${offer?.label}", R held's menu ${menu ? `${menu.rows.length} rows` : 'none'}; 5 ticks on the clock at ${fmt(after, 2)} s; the jink at ${fmt(jinkS, 1)} s, its card ${cards ? `offered (${cards} ticks)` : 'NEVER'}, logged ${B.jink?.what ?? '-'} at ${fmt(B.jink ? (B.jink.atMs - t0) / 1000 : null, 1)} s; the end at ${fmt(endS, 1)} s`);
        if (offer?.verb !== 'scene' || offer?.id !== 'standby') bad.push(`${atS} s: the offer ${offer?.verb} ${offer?.id}`);
        if (menu) bad.push(`${atS} s: R held's menu ${menu.rows.map(r => r.id).join(',')}`);
        if (!(after < atS + 1)) bad.push(`${atS} s: the clock at ${after} s after R`);
        if (!(endS < 120)) bad.push(`${atS} s: the end at ${endS} s`);
        if (!jinkS || !cards) bad.push(`${atS} s: no jink card`);
        if (!B.jink || Math.abs(B.jink.atMs - P.list[1].atMs) > 2000) bad.push(`${atS} s: the jink logged at ${B.jink?.atMs}`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'scene-burn (the fixer of D\'s review, 2026-11-19): the T line aboard is the scene\'s by the ship\'s phase (stow, then strap in at the 1MC\'s warning, then hold on), no act, never the barracks\' "Free time. Spend it like it costs something."',
    fn() {
      const g = createGame({ scenario: 'test-burn', seed: 7 }), s = g.state, t0 = s.clock.ms;
      const day = new Set(Object.values(BASE_RULES.find(r => r.id === 'situation').text).flat().concat(BASE_RULES.find(r => r.id === 'situation').humour ?? []));
      const seen = new Map(), bad = [];
      for (let n = 0; n < 20 * 300 && !burnNow(s)?.end; n++) {
        const card = gravCardOf(s);
        g.step(1, card?.options?.length ? { act: [{ act: 'grav', args: { card: card.options[0].key } }] } : {});
        const L = instinctNow(s).line, B = burnNow(s), ph = B.end ? 'end' : B.onset ? 'after' : B.warn ? 'warned' : 'before';
        if (!L) continue;
        const k = `${ph}|${L.id}|${L.text}`;
        if (!seen.has(k)) seen.set(k, { atS: (s.clock.ms - t0) / 1000, ph, L });
        if (day.has(L.text)) bad.push(`${ph} at ${(s.clock.ms - t0) / 1000} s: "${L.text}"`);
        if (L.id === 'situation' && ph !== 'end' && (!BURN_T[ph].includes(L.text) || L.act)) bad.push(`${ph}: "${L.text}" act ${L.act}`);
      }
      for (const { atS, ph, L } of seen.values()) console.log(`      ${fmt(atS, 1)} s ${ph}: ${L.id} "${L.text}"${L.act ? ` act ${L.act}` : ''}`);
      for (const ph of ['before', 'warned', 'after']) if (![...seen.values()].some(x => x.ph === ph && x.L.id === 'situation')) bad.push(`no ${ph} line`);
      assert(!bad.length, [...new Set(bad)].slice(0, 6).join('; '));
    },
  },
];
