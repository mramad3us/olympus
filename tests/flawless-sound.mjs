// OLYMPUS tests: the shoot house's sound gauge, F59 (the build sheet v0.0.20 §8; item 7; feel.md FL-3).
//
// F59: at least 95% of the house's 'say' facts heard; no two lines of one speaker overlapping on the audio clock; no held
// tower command (all but GO and Stop, §0 item 32) starting inside the instructor's chained line (shoothouse.js R.paUntilMs).
// A lane is played from the fill by its sheet's bot, the house's ear (src/ui/audio/house.js createHouse) hearing every fact as
// the page's does, on a stand-in engine whose audio clock is the game's (the lines' times are then the game's) and which
// records each line it is asked to say: { who, atS, ms }. Heard is the ear's own answer to the fact (a voice queued or, with
// V-a, a stand-in played). The criterion's first two clauses are enforced while the voice ships as the default (V-c: the
// build sheet's ship rule, house-voiced and voice-render green), its third at once (the wait ships whatever the voice).
// v0.0.23's fixer: the game voices no line (the user, 2026-11-19, "forget voice synthesis, no voices."; voices.js VOICE_DEFAULT
// 'none'), so the lanes are heard in V-c by name (SOUND_SET), the synthesis &voice=c still plays, until v0.0.24 removes it and F59 with it.
import { createGame } from './game.mjs';
import { houseBot, runHouse } from './bots/house.mjs';
import { createHouse } from '../src/ui/audio/house.js';
import { TICK_MS } from '../src/core/clock.js';

/** The set the lanes are heard in: V-c by name, no longer the game's (see the header). */
export const SOUND_SET = 'c';
/** F59's share of the 'say' facts heard (×). */
export const HEARD_MIN = 0.95;
/** The commands the wait holds (those posted after a command outside the lane). */
export const HELD = Object.freeze(new Set(['load', 'ready', 'standby', 'clear', 'wash', 'end']));
/** The lanes of feel.md's voiced.mjs: the boot recruit and the private by the keys, the corporal to the tier one by T. */
export const SOUND_LANES = Object.freeze([['recruit', 'keys', 48213], ['private', 'keys', 1074], ['cpl', 'T', 48213], ['sgt', 'T', 1037], ['raider', 'T', 48213], ['tierone', 'T', 1489397426]]);
const factsOf = (game) => (game.bus.events ?? []).map(e => (Array.isArray(e) ? { type: e[0], p: e[1] } : { type: e.type, p: e.payload ?? e.data ?? e }));

/**
 * One lane from the fill, heard (see the header): { tier, seed, mode, set, says, heard, byRole, silent: [text…], lines: [{ who, atS,
 * ms }], cmds: [{ id, atMs, chainMs }], end, also: { set, heard } (also: a second set heard on the same facts) }.
 */
export function soundLane({ tier, seed, mode, set = SOUND_SET, also = null, maxMs = 600_000 }) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier }), t0 = g.state.clock.ms;
  const lines = [], rec = { tier, seed, mode, set, says: 0, heard: 0, byRole: {}, silent: [], lines, cmds: [] };
  const ear = createHouse({ house: () => true, hall: () => {}, voice: (text, o) => { lines.push({ who: o.who ?? o.voice, text, atS: o.atS, ms: o.ms }); return true; }, now: () => (g.state.clock.ms - t0) / 1000 }, { voice: set });
  // (a second ear on the same facts, another set (V-a beside V-c), its share alone)
  const ear2 = also ? createHouse({ house: () => true, hall: () => {}, voice: () => true, now: () => (g.state.clock.ms - t0) / 1000 }, { voice: also }) : null;
  rec.also = also ? { set: also, heard: 0 } : null;
  let chain = 0;
  const each = (game) => {
    const R = game.state.armoury.range, now = game.state.clock.ms - TICK_MS;
    for (const { type, p } of factsOf(game)) {
      if (type === 'house' || type === 'bundle') { ear.fact(type, p, game.state); ear2?.fact(type, p, game.state); }
      if (type === 'range' && p.phase === 'cmd') rec.cmds.push({ id: p.cmd, atMs: now - t0, chainMs: Math.max(0, chain - t0) });
      if (type !== 'say') continue;
      rec.says++;
      const n0 = lines.length;
      if (ear.fact('say', p, game.state)) rec.heard++; else if (rec.silent.length < 20) rec.silent.push(String(p.text).slice(0, 40));
      if (ear2?.fact('say', p, game.state)) rec.also.heard++;
      // (the line's speaker as the queue keys it: the fact's who)
      for (const L of lines.slice(n0)) L.who = p.who;
    }
    chain = R.paUntilMs ?? 0;
  };
  const r = runHouse(g, houseBot({ mode }), { each, maxMs });
  rec.end = g.state.armoury.range.house.end?.why ?? null; rec.done = r.done;
  rec.byRole = { ...ear.stats.voice.byRole }; rec.dropped = ear.stats.voice.dropped;
  return rec;
}

/** F59 over lanes: { id, met, enforced, text, heard, overlaps, cut }. enforce: the first two clauses (the voice the default). */
export function f59(recs, { enforce = true } = {}) {
  const says = recs.reduce((a, r) => a + r.says, 0), heard = recs.reduce((a, r) => a + r.heard, 0), share = says ? heard / says : 1;
  let overlaps = 0;
  for (const r of recs) {
    const by = new Map();
    for (const L of r.lines) (by.get(L.who) ?? by.set(L.who, []).get(L.who)).push(L);
    for (const xs of by.values()) { xs.sort((a, b) => a.atS - b.atS); for (let i = 1; i < xs.length; i++) if (xs[i].atS < xs[i - 1].atS + xs[i - 1].ms / 1000 - 1e-6) overlaps++; }
  }
  const cut = recs.flatMap(r => r.cmds.filter(c => HELD.has(c.id) && c.atMs < c.chainMs).map(c => `${r.tier}/${r.seed} ${c.id} at ${(c.atMs / 1000).toFixed(2)} s inside ${(c.chainMs / 1000).toFixed(2)}`));
  const met1 = share >= HEARD_MIN && overlaps === 0, met = met1 && !cut.length;
  const roles = {};
  for (const r of recs) for (const [k, n] of Object.entries(r.byRole)) roles[k] = (roles[k] ?? 0) + n;
  const text = `F59 ${met ? 'MET ' : 'OPEN'} the house heard: ${heard} of ${says} 'say' facts (${(100 * share).toFixed(1)}%; v0.0.19 23.2%), by voice ${Object.entries(roles).map(([k, n]) => `${k} ${n}`).join(', ')}, dropped past their hold ${recs.reduce((a, r) => a + (r.dropped ?? 0), 0)}; one speaker over himself ${overlaps}; a held command inside the instructor's line ${cut.length}${cut.length ? `: ${cut.slice(0, 3).join('; ')}` : ''} over ${recs.length} lanes (target ${HEARD_MIN * 100}%, 0, 0) [${enforce ? 'enforced' : 'the third clause enforced'}]`;
  return { id: 'F59', met, enforced: enforce, text, share, overlaps, cut, fails: (enforce ? !met : cut.length > 0) };
}
