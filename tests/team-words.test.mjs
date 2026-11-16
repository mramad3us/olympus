// OLYMPUS tests: the team's words in one table (v0.0.19, the team's track T3; team.js TEAM_WORDS, read by bundle.js TWO_SAY and SAY and sidearm.js CALLS).
//
// Each entry names who says it (1 you, 2 your number two, 0 either), what answers it and what closes it. Your Cover his sector
// now says "Covering!" first (sidearm.js weaponList 'cover': 'call:covering', CALL_MS), as he does for you; every team call in a
// lane is said only by the man the table names; each "Reloading!" of his is closed by his "Up."; your "Clear!" comes before your
// "Room clear!". The side call ("Left!") is two-side's. Cases run the honest tier one's lane and v0.0.18's save of the #2 down on
// his own stoppage in room 2 (tests/saves/v0.0.18-house-twodown.json.gz, stage 0's), on to the card.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { assert, root } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseHonestBot, stoppageBot } from './bots/house.mjs';
import { TEAM_WORDS } from '../src/sim/combat/team.js';
import { weaponList, CALL_MS, listMs } from '../src/sim/arms/sidearm.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { stepAct } from './bots/lib.mjs';

// (the roles a call's words may come from: by its entry's `by`, 0 either; the side call by its `call`)
const ROLES = new Map();
for (const w of Object.values(TEAM_WORDS)) if (w.words) ROLES.set(w.words, new Set([...(ROLES.get(w.words) ?? []), ...(w.by ? [w.by] : [1, 2])]));
// (a lane's team calls: { who 1 | 2, text, call, ms })
function lane(g, bot) {
  const s = g.state, H = s.armoury.range.house, calls = [];
  const r = runHouse(g, bot, { maxMs: 12 * 60_000, each: (game) => { for (const f of game.facts('say')) { const who = f.who === s.player.id ? 1 : f.who === H.two.pid ? 2 : 0; if (who) calls.push({ who, text: f.text, call: f.call ?? null, room: f.room ?? null, ms: s.clock.ms }); } } });
  return { r, calls };
}
const twodown = () => { const g = createGame({ scenario: 'test-shoothouse', seed: 11050, tier: 'tierone' }); g.load(gunzipSync(readFileSync(path.join(root, 'tests/saves/v0.0.18-house-twodown.json.gz'))).toString()); return g; };

export default [
  {
    name: 'Cover his sector says "Covering!" first (call:covering, CALL_MS) and the row\'s time carries it: your #2 gun down in room 2, the row pressed, you say "Covering!" as you take his sector (v0.0.18 said nothing)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'room:2' }), s = g.state, W = s.armoury.range.house.two;
      W.down = { key: null, atMs: s.clock.ms, macro: 'ia', tries: 1 };
      const row = stepsOf(s).find(r => r.id === 'team:cover'), list = weaponList(s, s.player.id, 'cover'), ms = list ? listMs(s, s.player.id, list) : null;
      g.step(1, { act: [stepAct('team:cover')] });
      const says = [];
      for (let i = 0; i < 20; i++) { g.step(1, {}); for (const f of g.facts('say')) if (f.who === s.player.id) says.push(f.text); g.clearFacts?.(); }
      console.log(`      the row "${row?.label}" offered ${!!row && !row.off}, its sub-steps ${JSON.stringify(row?.subs?.map(x => x.id))} (${row?.ms} ms; the list's ${ms} ms, CALL_MS ${CALL_MS}); you said ${says.join(' ') || 'nothing'}; his sector covered by you ${W.coveredBy === s.player.id}`);
      assert(list?.[0] === 'call:covering' && list[1] === 'team:cover' && ms >= CALL_MS && row && !row.off && says[0] === 'Covering!' && W.coveredBy === s.player.id, JSON.stringify({ list, says, row: row?.subs }));
    },
  },
  {
    name: 'every team call in a lane is said only by the man TEAM_WORDS names (the honest tier one on 48213, the #2-down save on to its card); each "Reloading!" of his is closed by his "Up." before his next; your "Clear!" before your "Room clear!" in every room',
    heavy: true,
    timeoutMs: 180_000,
    fn() {
      const runs = [['honest tierone 48213', lane(createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone' }), houseHonestBot())], ['the #2-down save', lane(twodown(), stoppageBot({ answer: 'gundown' }))]];
      const out = [];
      for (const [name, { calls }] of runs) {
        const wrong = calls.filter(c => c.call !== 'side' && ROLES.has(c.text) && !ROLES.get(c.text).has(c.who));
        const his = calls.filter(c => c.who === 2 && (c.text === 'Reloading!' || c.text === 'Up.'));
        let open = 0, unclosed = 0; for (const c of his) { if (c.text === 'Reloading!') { if (open) unclosed++; open = 1; } else open = 0; }
        const mine = calls.filter(c => c.who === 1), rooms = mine.filter(c => c.text === 'Room clear!' || c.text === 'Hall clear!');
        const late = rooms.filter(rc => !mine.some(c => c.text === 'Clear!' && c.ms <= rc.ms && c.ms >= rc.ms - 30_000));
        out.push({ name, n: calls.length, team: calls.filter(c => ROLES.has(c.text)).length, wrong: wrong.map(c => `${c.who}:${c.text}`), reloads: his.filter(c => c.text === 'Reloading!').length, unclosed: unclosed + open, rooms: rooms.length, late: late.length });
      }
      for (const o of out) console.log(`      ${o.name}: ${o.n} calls, ${o.team} of the table's; by the wrong man ${o.wrong.length}${o.wrong.length ? ` (${o.wrong.join(', ')})` : ''}; his "Reloading!" ${o.reloads}, not closed by "Up." ${o.unclosed}; "Room clear!" ${o.rooms}, without your "Clear!" before ${o.late}`);
      assert(out.every(o => !o.wrong.length && !o.unclosed && !o.late && o.rooms >= 3), JSON.stringify(out));
    },
  },
];
