// OLYMPUS tests: every line of "Bang, then go" a text bubble at its speaker, none voiced (v0.0.26; its build sheet §6 B, §8 F149's sim half).
//
// The user, 2026-11-19: "forget voice synthesis, no voices." The scene's lines are the instructor's (the brief: room 1, the role-players'
// part and the kit by the draw, never the door, "Sterile check first."; "Room 1. Standby."; after room 1's "Clear!" with a man down or
// given up, "Search them if you want the truth now."; the hot wash's window words), yours and your #2's, and the role-players' ("Don't
// shoot!", "Hit!"), each a 'say' fact with its speaker. F149's sim half, on the sergeant's lanes from the fill (the brief, LOAD, MAKE READY)
// on the bang and on the quiet door: every 'say' has a speaker (a person), none is heard by the house's ear or asked of an engine
// (no-voices' rule, audio/house.js createHouse), the brief names the kit as drawn and never the door, and the search's offer is said once
// where a man went down or gave up. The review of B and C (2026-11-19) adds the search's splash: each "Search him" runs its 20 s behind
// the house's skip ('house-search', a fast-forward of the stop's lived ticks, its splash line), begun on the search's first running tick
// and over at its end; red without it (the skip was begun only out of stop motion, which the search never is: 40 s at 1×).
import { assert } from './helpers.mjs';
import { createHouse } from '../src/ui/audio/house.js';
import { BREACH_CHIEF } from '../src/data/courses.js';
import { breachLane, breachLine } from './breach-lanes.mjs';
import { ACTIVITIES } from '../src/data/activities.js';

export default [
  {
    name: 'F149 (the sim\'s half): the sergeant\'s lanes on 48213 from the fill, the bang held and the quiet loose door: every line a \'say\' with a speaker, none heard or asked of an engine; the brief names the kit, never the door; the search offered once where a man fell',
    timeoutMs: 120_000,
    fn() {
      const bad = [];
      for (const code of ['bang,held', 'quiet,loose']) {
        const cues = [], asked = [];
        const ear = createHouse({ house: (kind) => { cues.push(kind); return true; }, hall: () => {}, voice: (text) => { asked.push(text); return true; } });
        let heard = 0;
        const { g, rec } = breachLane({ tier: 'sgt', code, setup: null, each: (game) => { for (const f of game.facts('say')) if (ear.fact('say', f, game.state)) heard++; } });
        const pids = new Set(Object.keys(g.state.people ?? {})), noSpeaker = rec.says.filter(x => !(x.who && pids.has(x.who)) && !x.speaker);
        const texts = rec.says.map(x => x.text), brief = texts.find(t => BREACH_CHIEF.brief.some(b => t.startsWith(b))) ?? null;
        const kit = BREACH_CHIEF.kit[code.startsWith('bang') ? 'bang' : 'quiet'], other = BREACH_CHIEF.kit[code.startsWith('bang') ? 'quiet' : 'bang'];
        const search = texts.filter(t => BREACH_CHIEF.search.includes(t)).length, fell = Object.values(rec.W.men).some(M => M.downAtMs !== null || M.gaveAtMs !== null);
        console.log(`      ${breachLine(rec)}`);
        console.log(`        ${rec.says.length} lines, with no speaker ${noSpeaker.length}; heard ${heard}, asked of an engine ${asked.length}; the search offered ${search} time(s); the brief "${brief}"`);
        if (!rec.done || rec.says.length < 15 || noSpeaker.length || heard || asked.length) bad.push(`${code}: ${JSON.stringify({ says: rec.says.length, noSpeaker: noSpeaker.slice(0, 2), heard, asked: asked.length })}`);
        if (!brief || !kit.some(k => brief.includes(k)) || other.some(k => brief.includes(k)) || /\b(held|holds|aimed|loose)\b/i.test(brief)) bad.push(`${code}: the brief "${brief}"`);
        if (search !== (fell && rec.end === 'clear' ? 1 : 0)) bad.push(`${code}: the search offered ${search} times (a man fell: ${fell}, the end ${rec.end})`);
      }
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: '"Search him" runs its 20 s behind the house\'s skip with its splash: the private by the keys on 48213, the bang held, searches both men, each search a fast-forward (\'house-search\', its splash line) from its first running tick to its end, no lived tick of it at 1× (the review of B and C, 2026-11-19: 40 s of watching after "Clear!")',
    fn() {
      const runs = [];
      let cur = null;
      const { g, rec } = breachLane({ tier: 'private', code: 'bang,held', each: (game) => {
        const s = game.state, G = s.armoury.range.house.bangGo, d = s.stop?.doing, on = !!G?.search && d?.list?.[d.i] === 'contact:search';
        if (on && !cur) runs.push(cur = { key: G.search.key, fromMs: G.search.fromMs, untilMs: G.search.untilMs, ticks: 0, ff: 0, what: new Set() });
        if (cur && on) { cur.ticks++; if (s.skip?.engine === 'ff' && s.time?.doing?.activity === 'house-search') cur.ff++; else cur.what.add(s.skip ? `${s.skip.engine}:${s.time?.doing?.activity}` : 'live'); }
        if (cur && !on) { cur.endMs = s.clock.ms; cur.skipAfter = !!s.skip; cur = null; }
      } });
      const line = ACTIVITIES['house-search']?.parts?.[0]?.line ?? null, searched = g.state.armoury.range.turners.filter(T => T.live?.searched).length;
      console.log(`      ${breachLine(rec)}; the splash "${line}"`);
      for (const r of runs) console.log(`        ${r.key}: ${r.ticks} ticks of search, ${r.ff} of them behind the skip${r.what.size ? ` (else ${[...r.what].join(', ')})` : ''}; over at ${r.endMs - r.fromMs} ms, the skip ${r.skipAfter ? 'still on' : 'over'}`);
      assert(rec.done && searched === 2 && runs.length === 2 && line && runs.every(r => r.ticks >= 395 && r.ff >= r.ticks - 1 && !r.skipAfter), JSON.stringify(runs.map(r => ({ ...r, what: [...r.what] }))));
    },
  },
];
