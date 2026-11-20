// OLYMPUS tests: the boarding's words, F166's sim half (the build sheet v0.0.27 §1 D, §6 D, §8; the user, 2026-11-19: "forget voice synthesis, no voices.").
//
// Every line of "Away the boarding party" is a text bubble at its speaker: the leader's brief, override, send, "Deck secure.", "Fall back
// to the lock!" and after-action line at the leader (the lane's chief aboard, a body on the deck: shoothouse.js testShoothouse's ship
// branch), Four's lockout at Four, every marine's call at himself. These cases hold the words as data (courses.js SEQ_COLLAR,
// COLLAR_LEADER and COLLAR_CARD: two phrasings or more for every spoken key, British style, no em dash, the send's {room} filled from
// the legs' words) and, on two short lanes (the cabin 2 and fall back setups, the private by the keys), every 'say' fact of the scene
// with a speaker whose body stands in the hauler's area (where the page draws his bubble: main.js's say), or the hauler's intercom at
// its speaker (the side's give-up: opfor.js, a bubble at the 1MC speaker of a compartment), none of the instructor's or the tower's; the voice synthesis stays gone (tests/no-voices.test.mjs holds the engine).
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { SEQ_COLLAR, COLLAR_LEADER, COLLAR_CARD, HAULER_LEGS } from '../src/data/courses.js';
import { collarBot } from './bots/collar.mjs';
import { houseTBot } from './bots/house.mjs';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { readParams, holdoutsNote } from '../src/core/debug.js';
import { parseBoarding } from '../src/sim/scenarios/opfor.js';

const factsOf = (game) => (game.bus.events ?? []).map(e => (Array.isArray(e) ? { type: e[0], p: e[1] } : { type: e.type, p: e.payload ?? e.data ?? e }));
const EM = /\u2014/;

export default [
  {
    name: 'F166: the boarding\'s words as data: every spoken key of the leader\'s book and every command of SEQ_COLLAR two phrasings or more, no em dash; the send\'s {room} filled from every leg\'s words',
    fn() {
      const bad = [], keys = [];
      const check = (where, v) => {
        if (Array.isArray(v)) { keys.push(where); if (v.length < 2) bad.push(`${where}: ${v.length} phrasing`); for (const t of v) if (typeof t !== 'string' || !t.trim() || EM.test(t)) bad.push(`${where}: ${JSON.stringify(t)}`); return; }
        if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) check(`${where}.${k}`, x);
      };
      check('leader', COLLAR_LEADER);
      for (const c of SEQ_COLLAR) { check(`seq.${c.id}.say`, c.say); if (c.sayAgain) check(`seq.${c.id}.sayAgain`, c.sayAgain); if (c.sayEnd) check(`seq.${c.id}.sayEnd`, c.sayEnd); }
      for (const v of Object.values(COLLAR_CARD).flatMap(x => (typeof x === 'object' ? Object.values(x) : [x]))) if (EM.test(String(v))) bad.push(`card ${v}`);
      const sends = HAULER_LEGS.slice(1).map(L => COLLAR_LEADER.send[0].replace('{room}', L.said));
      console.log(`      ${keys.length} spoken keys and commands; the sends "${sends.join('", "')}"; the commands ${SEQ_COLLAR.map(c => c.id).join(', ')}`);
      assert(!bad.length, bad.join('; '));
      assert(sends.every(t => !/[{}]/.test(t)), sends.join(' | '));
    },
  },
  {
    name: 'F166: on the cabin 2 and fall back setups by the keys, every line said is a bubble at a speaker standing in the hauler\'s area (the leader, Four, you): no loudspeaker\'s, no line without a body',
    fn() {
      const rows = [], bad = [];
      for (const setup of ['cabin2', 'fallback']) {
        const g = createGame({ scenario: 'test-collar', seed: 48213, tier: 'private', holdouts: 'pirates', setup }), s = g.state, H = s.armoury.range.house;
        const who = new Map([[s.player.id, 'you'], [H.twoPid, 'Four'], [H.chiefPid, 'the leader']]), said = [];
        const bot = collarBot({ mode: 'keys' });
        for (let i = 0; i < 4000 && !s.armoury.range.end; i++) {
          g.step(1, bot);
          for (const f of factsOf(g).filter(x => x.type === 'say')) {
            const a = s.actors.list.find(x => x.who === f.p?.who);
            said.push(`${who.get(f.p?.who) ?? f.p?.who ?? f.p?.speaker ?? '?'}: ${f.p?.text}`);
            // (a speaker with a body on the deck, or the hauler's intercom at its speaker (opfor.js's give-up: who null, `at` the speaker's place))
            const atSpeaker = !f.p?.who && Number.isFinite(f.p?.at?.x);
            if (!atSpeaker && (!f.p?.who || !a || (f.p.at && !Number.isFinite(f.p.at.x)))) bad.push(`${setup}: ${JSON.stringify(f.p).slice(0, 120)}`);
          }
          g.clearFacts?.();
        }
        rows.push(`${setup}: ${said.length} lines (${said.slice(0, 6).join(' | ')}${said.length > 6 ? ' | …' : ''})`);
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!bad.length, bad.slice(0, 5).join('; '));
    },
  },
  {
    name: 'a &holdouts= not played as asked is said: an unknown type or a code whose stands the hauler has not gives the toast "No holdouts \'…\': drawn from the seed.", as &env and &loadout drop theirs; a type and a whole code of the hauler\'s stands none (the review of D: \'vikings\' and \'pirates:1a,9z/2c\' played the draw with no word)',
    fn() {
      const rows = [], bad = [];
      for (const [q, want] of [['vikings', true], ['pirates:1a,9z/2c', true], ['pirates:1a,1b,1c,1d/2c', true], ['pirates', false], ['SMUGGLERS', false], ['pirates:1a,3a,3b,4a/2c,2d', false], [null, false]]) {
        const p = readParams(`?play=test-collar${q === null ? '' : `&holdouts=${encodeURIComponent(q)}`}`), note = holdoutsNote(p.holdoutsAsked, p.holdouts, parseBoarding);
        rows.push(`${q ?? '(none)'}: ${p.holdouts ?? 'null'} kept, ${note ? `"${note}"` : 'no toast'}`);
        if (!!note !== want || (note && !note.endsWith('drawn from the seed.'))) bad.push(rows.at(-1));
      }
      console.log(`      ${rows.join('; ')}`);
      assert(!bad.length, bad.join('; '));
    },
  },
  {
    name: 'T in the lock while the passage is held: the plain houseTBot (T and nothing else) never enters and leaves stop motion in turn there, and T\'s line is "Hold in the lock." with the panel\'s Wait in stop motion (cqb.js cqb-hold; the review of D: "On: X, then the keys." and "Don\'t stand there. G, and the next row." in turn, 646 times on the sergeant\'s 48213 pirates lane and 141 on its smugglers)',
    fn() {
      const rows = [], bad = [];
      for (const holdouts of ['smugglers', 'pirates']) {
        const g = createGame({ scenario: 'test-collar', seed: 48213, tier: 'sgt', holdouts }), s = g.state, H = s.armoury.range.house, bot = houseTBot();
        let flips = 0, last = null, ticks = 0;
        const lines = {};
        for (let i = 0; i < 20_000 && !s.armoury.range.end; i++) {
          g.step(1, bot); g.clearFacts?.();
          if (H.goAtMs === null) continue;
          if (H.cur !== 0 || H.rooms[0].held || H.boarding.fallback || H.end) break;
          ticks++;
          const l = instinctNow(s).line, m = s.stop?.mode === 'stop';
          if (l) lines[l.id] = (lines[l.id] ?? 0) + 1;
          if (last !== null && m !== last) flips++;
          last = m;
        }
        rows.push(`${holdouts}: ${ticks} ticks held, stop motion in and out ${flips}, T's lines ${JSON.stringify(lines)}, the send ${H.boarding.send?.why ?? 'none'}`);
        if (flips || lines['cqb-next'] || lines['cqb-walk'] || !lines['cqb-hold']) bad.push(rows.at(-1));
      }
      console.log(`      ${rows.join('; ')}`);
      assert(!bad.length, bad.join('; '));
    },
  },
];
