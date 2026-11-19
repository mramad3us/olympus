// OLYMPUS tests: the frag named at the stack (the build sheet v0.0.22 item 10, R4; COMBAT §25.20): words only, the method kept.
//
// The bang is the player's choice (COMBAT §25.5.6: "the method is the player's"); once a frag or a concussion is set at a door, the
// DI's stack lines (cqb.js cqb-stack, cqb-door, cqb-go) name the room's row carrying it, and T presses it as before. Before v0.0.22
// their words never said so: the sergeant who set the frag and trusted T heard "Clear it. 14.2 s. Your corner: left." and fragged
// room 1's family on 48214 (the residuals lens's probefrag). Now the line says "frag" ("Clear it, frag. 14.2 s. …"), and where the
// brief did not call the room hostiles only (house-kit.js intelOf) adds "The brief: not hostiles only."; T's act and the read are
// unchanged (FRAGGED there, the fault kept: no refusal, question 11's default). A flash or no bang keeps the words to the letter.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, houseTBot } from './bots/house.mjs';
import { stepAct } from './bots/lib.mjs';
import { instinctNow, RULES } from '../src/sim/skills/instinct.js';
import { houseNow } from '../src/sim/scenarios/shoothouse.js';

const choose = (s) => s.stop?.mode === 'stop' && s.stop.phase === 'choose' && !s.stop.reflex;
const STACK_RULES = new Set(['cqb-stack', 'cqb-door', 'cqb-go']);

// (one sergeant's lane by T with the bang set to `bang` at GO, as a player sets it: the stack lines naming a bang row, room 1's read)
function lane(seed, bang) {
  const g = createGame({ scenario: 'test-shoothouse', seed, tier: 'sgt', setup: 'go', loadout: bang === 'flash' ? 'flash' : bang });
  const H = g.state.armoury.range.house, T = houseTBot(), named = [];
  let set = 0, last = null;
  runHouse(g, (state, me, mem) => {
    const S = state.stop;
    if (set < 6 && choose(state) && houseNow(state).goAtMs !== null && (S.variant?.bang ?? null) !== bang) { set++; return { act: [stepAct('drill:variant:bang')] }; }
    const L = instinctNow(state).line;
    if (L && STACK_RULES.has(L.id) && /@[^>]*\b(frag|conc|flash)\b/.test(L.act ?? '') && L.text !== last) { last = L.text; named.push({ t: state.clock.ms - houseNow(state).goAtMs, id: L.id, act: L.act, text: L.text }); }
    return T(state, me, mem);
  }, { maxMs: 8 * 60_000 });
  const r1 = (H.bursts ?? []).find(b => b.read && b.room === 'w4.r1');
  return { seed, bang, intel: H.intel?.['o:w4:r1'] ?? null, named, read: r1 ? (r1.read.fragged ? 'FRAGGED' : 'clean') : null, faults: H.rooms[0].faults.map(f => f.kind), end: H.end?.why };
}

export default [
  {
    name: 'the frag set at the stack is named in the DI\'s line, "Clear it, frag. The brief: not hostiles only. …" on the sergeant\'s 48214 (room 1 the brief\'s "unknown": T still presses the frag row, the read FRAGGED, the fault kept), "frag" without the warning on 48213 (hostiles only), and a flash\'s words to the letter (the build sheet v0.0.22 item 10, R4: T\'s line said "Clear it. 14.2 s. Your corner: left." and never "frag")',
    timeoutMs: 120_000,
    fn() {
      const unknown = lane(48214, 'frag'), hostiles = lane(48213, 'frag'), flash = lane(48213, 'flash');
      for (const o of [unknown, hostiles, flash]) console.log(`      ${o.seed} ${o.bang} (room 1 ${o.intel ?? 'no brief'}): ${o.named.slice(0, 3).map(x => `${x.id} "${x.text}" ${x.act}`).join('; ') || 'no stack line named a bang row'}; room 1's read ${o.read}, faults ${JSON.stringify(o.faults)}, the lane ${o.end}`);
      const first = (o) => o.named.find(x => /o:w4:r1$/.test(x.act)) ?? null;
      const u = first(unknown), h = first(hostiles), f = first(flash);
      assert(unknown.intel === 'unknown' && u && /, frag\b/.test(u.text) && /The brief: not hostiles only\./.test(u.text) && /@[^>]*frag/.test(u.act) && unknown.read === 'FRAGGED' && unknown.faults.includes('fragged'), JSON.stringify(unknown));
      assert(hostiles.intel === 'hostiles' && h && /, frag\b/.test(h.text) && !/brief/.test(h.text), JSON.stringify(hostiles));
      // (the flash's words: one of its rule's phrasings with nothing filled in for the bang)
      const esc = (t) => t.replace(/[.*+?^$()|[\]\\]/g, '\\$&'), re = (t) => new RegExp(`^${t.split(/\{(\w+)\}/).map((p, k) => (k % 2 ? (p === 'bang' || p === 'brief' ? '' : '.+') : esc(p))).join('')}$`);
      const plain = (x) => Object.values(RULES.find(q => q.id === x.id).text).flat().filter(t => typeof t === 'string').some(t => re(t).test(x.text));
      assert(f && !/frag|brief|concussion/.test(f.text) && plain(f), JSON.stringify(flash));
    },
  },
];
