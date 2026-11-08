// The race at the door on the built helpers, settled before any constant of COMBAT §5 is tuned (COMBAT §25.5.5, §25.18.2, §25.18.4; the build sheet 0.0.9 §2.1, §5.1, §8 items 2, 3).
//
// tests/race-model.mjs runs §25.5.5's reference room on the code (react.js's take-in, shot.js's aim with the rifle's
// factors and the SO-4 at 1×, the fumble ladder, supp.js for the bang), 4,000 seeded runs a cell. This suite reprints
// §25.5.5's table and §25.18.2's T11 to T13 from it, the bang's columns twice: the defenders' kit as §25.18.2 had it and
// as the user's overrule of question 6 has it (2026-11-07: "standard issue combat gear will be combat EVA suits with
// serious targetting and filtering, night vision": the UN's line infantry, MSS tactical and enemy special forces in
// suits, a filtered visor and sound filtering; the insurgents unsuited). It settles the table's two disputed cells by
// printing each beside the scratch's assumption and the built term, and checks the suit on supp.js's own bang().
import { assert, fmt } from './helpers.mjs';
import { armsWorld } from './arms-world.mjs';
import { bang, blockOf, feltOf, hearingOf, protOf } from '../src/sim/combat/supp.js';
import { TRIGGER_S } from '../src/sim/arms/shot.js';
import { MARINES, DEFENDERS, STATES, KIT, raceOdds, boughtOf, defender, takeInS, aimSectorS, aimTurnS } from './race-model.mjs';

const N = 4000;
const pc = (x) => `${Math.round(100 * x)}%`;
const seedOf = (t, m, st, bang) => 13_000 + t.wf * 7 + m.s.wf + st.length + (bang ? 500 : 0);
// (§25.5.5 as printed: aimed / alert / surprised against the cell member, the UN Marine and enemy special forces)
const PRINTED = {
  'private, by the keys': [[0, 100, 100], [0, 100, 100], [0, 0, 0]], 'private, Watch set': [[2, 100, 100], [0, 100, 100], [0, 47, 49]],
  'corporal, rung 2': [[32, 100, 100], [2, 100, 100], [0, 33, 33]], 'sergeant, rung 3': [[50, 100, 100], [3, 100, 100], [0, 50, 49]],
  'Raider, rung 4': [[53, 100, 100], [49, 100, 100], [0, 100, 100]], 'tier one, rung 4': [[100, 100, 100], [52, 100, 100], [0, 100, 100]],
};
const TABLE_DEFS = ['insurgent cell member', 'UN Marine, line', 'enemy special forces'];

export default [
  {
    name: 'combat-race: §25.5.5\'s table reprinted from the built helpers, its two disputed cells settled against the table (the tier one against an insurgent aimed at the door 53%, not 100%; the sergeant against an aimed UN Marine 47%, not 3%), every other cell within 2 points',
    heavy: true, timeoutMs: 600_000,
    fn() {
      const off = [];
      console.log(`      §25.5.5 on the built helpers, ${N} runs a cell, how often the marine fires first (aimed / alert / surprised); in brackets the table as printed`);
      for (const m of MARINES) {
        const cells = TABLE_DEFS.map((id, j) => {
          const t = defender(id), got = STATES.map(st => Math.round(100 * raceOdds(m, t, st, { n: N, seed: seedOf(t, m, st, false) })));
          got.forEach((g, i) => { const p = PRINTED[m.label][j][i]; if (Math.abs(g - p) > 2) off.push({ marine: m.label, def: id, st: STATES[i], built: g, printed: p }); });
          return `${got.join('/')} (${PRINTED[m.label][j].join('/')})`;
        });
        console.log(`        ${m.label.padEnd(22)} ${cells.join(' · ')}`);
      }
      // (the two disputed cells, term by term: in his sector, in the room he is clearing, the defender aimed at the door)
      const sgt = MARINES[3], t1 = MARINES[5], un = defender('UN Marine, line'), ins = defender('insurgent cell member');
      const terms = (m, t) => {
        const s = m.s, sec = takeInS(s.wf, 'sector', 'pass') + aimSectorS(s.wh) + TRIGGER_S, secTick = takeInS(s.wf, 'sector', 'pass') + Math.ceil(aimSectorS(s.wh) * 20 - 1e-9) / 20 + TRIGGER_S;
        const area = takeInS(s.wf, 'area', 'pass') + aimTurnS(s.wh, 45, 0.15) + TRIGGER_S, areaBare = takeInS(s.wf, 'area', 'pass') + aimTurnS(s.wh, 45, 0.15, 0, { rifle: false }) + TRIGGER_S;
        return { sec, secTick, area, areaBare, def: takeInS(t.wf, 'sector', 'pass') + TRIGGER_S };
      };
      const a = terms(t1, ins), b = terms(sgt, un);
      const t1Bare = raceOdds(t1, ins, 'aimed', { n: N, seed: seedOf(ins, t1, 'aimed', false), rifle: false });
      const sgtBuilt = raceOdds(sgt, un, 'aimed', { n: N, seed: seedOf(un, sgt, 'aimed', false) });
      const t1Built = raceOdds(t1, ins, 'aimed', { n: N, seed: seedOf(ins, t1, 'aimed', false) });
      console.log(`      the tier one against an insurgent aimed at the door: built ${pc(t1Built)}, printed 100%. His sector (half the time) ${fmt(a.sec, 3)} s against the insurgent's ${fmt(a.def, 3)} s: he wins; the room he is clearing (half) ${fmt(a.area, 3)} s on aimS with the rifle's sight ×1.2 and turn ×0.8: he loses by ${Math.round(1000 * (a.area - a.def))} ms. The scratch's assumption, no rifle factors: ${fmt(a.areaBare, 3)} s, he wins, and the cell reads ${pc(t1Bare)}: the table's 100% is the factors left out`);
      console.log(`      the sergeant against an aimed UN Marine: built ${pc(sgtBuilt)}, printed 3%. His sector ${fmt(b.sec, 3)} s against the Marine's ${fmt(b.def, 3)} s: he wins by ${Math.round(1000 * (b.def - b.sec))} ms, on the shot's formula time (the record's atMs, resolveShot's); his aim of ${fmt(aimSectorS(sgt.s.wh), 3)} s taken in whole ticks gives ${fmt(b.secTick, 3)} s, a tie that goes to the defender, which is the table's 3%; the rifle's factors do not move it (no factors: ${pc(raceOdds(sgt, un, 'aimed', { n: N, seed: seedOf(un, sgt, 'aimed', false), rifle: false }))})`);
      console.log(`      verdict: the table is wrong in both cells, the helpers right (no bug found; test-pairs moves nothing): reprint §25.5.5 from this print. Both are tick-close: ${Math.round(1000 * (a.area - a.def))} and ${Math.round(1000 * (b.def - b.sec))} ms`);
      console.log(`      cells off the printed table by more than 2 points: ${off.map(o => `${o.marine} v ${o.def} ${o.st} ${o.built} (${o.printed})`).join('; ') || 'none'}`);
      assert(Math.abs(t1Built - 0.53) <= 0.03 && t1Bare >= 0.97, JSON.stringify({ t1Built, t1Bare }));
      assert(Math.abs(sgtBuilt - 0.47) <= 0.03, JSON.stringify({ sgtBuilt }));
      const others = off.filter(o => !((o.marine === 'tier one, rung 4' && o.def === 'insurgent cell member' && o.st === 'aimed') || (o.marine === 'sergeant, rung 3' && o.def === 'UN Marine, line' && o.st === 'aimed')));
      assert(!others.length, JSON.stringify(others));
    },
  },
  {
    name: 'combat-race: the bang\'s window (§25.18.2, T11 to T13) under both kits, the defenders\' as §25.18.2 had them and as the user\'s overrule has them (2026-11-07: combat EVA suits with filtering): the private by the keys at least 90% against an aimed, unsuited insurgent with the team\'s bang 1 s before, nobody over 5% against aimed enemy special forces with or without it',
    heavy: true, timeoutMs: 600_000,
    fn() {
      const bad = [];
      for (const [kitName, kit] of Object.entries(KIT)) {
        console.log(`      the kit ${kitName === 'designed' ? 'as §25.18.2 had it (a filtered visor on MSS and special forces, no ear protection)' : 'by the overrule (the UN\'s line, MSS tactical and special forces in suits: a filtered visor, sound filtering ×0.6)'}`);
        console.log('        T11, the defender\'s first aimed round (s, median) without → with the bang, and the share who never fire one:');
        for (const t of DEFENDERS) {
          const cells = STATES.map(st => { const x = boughtOf(t, st, { n: N, seed: 11_000 + t.wf + st.length, kit }); return `${fmt(x.without, 2)} → ${x.with === Infinity ? 'none' : fmt(x.with, 2)} (${pc(x.never)} never)`; });
          console.log(`          ${t.id} (H ${t.H}${kit(t).visor ? ', visor' : ''}${kit(t).ears !== 'none' ? `, ears ${kit(t).ears}` : ''}): ${cells.join(' · ')}`);
        }
        console.log('        T12, the race, no bang → the team\'s bang 1 s before (aimed / alert / surprised):');
        for (const m of MARINES) {
          const cells = DEFENDERS.map(t => STATES.map(st => {
            const a = raceOdds(m, t, st, { n: N, seed: seedOf(t, m, st, false), kit }), b = raceOdds(m, t, st, { bang: true, n: N, seed: seedOf(t, m, st, true), kit });
            if (t.id === 'enemy special forces' && st === 'aimed' && (a > 0.05 || b > 0.05)) bad.push({ kit: kitName, marine: m.label, a, b });
            if (kitName === 'overrule' && m.label === 'private, by the keys' && t.id === 'insurgent cell member' && st === 'aimed' && b < 0.9) bad.push({ kit: kitName, marine: m.label, def: t.id, b });
            return `${Math.round(100 * a)}→${Math.round(100 * b)}`;
          }).join('/'));
          console.log(`          ${m.label.padEnd(22)} ${cells.join(' · ')}`);
        }
        console.log('        T13, the window: the bang this long before the first man is seen, the defender aimed at the door (0.5 / 1 / 2 / 3 / 5 / 8 s):');
        for (const m of [MARINES[0], MARINES[3]]) for (const id of ['insurgent cell member', 'UN Marine, line', 'MSS tactical']) {
          const t = defender(id), row = [0.5, 1, 2, 3, 5, 8].map(d => pc(raceOdds(m, t, 'aimed', { bang: true, delayS: d, n: N, seed: 15_000 + t.wf + Math.round(d * 10) + m.s.wf, kit })));
          console.log(`          ${m.label} v ${id}: ${row.join(' / ')}`);
        }
      }
      assert(!bad.length, JSON.stringify(bad));
    },
  },
  {
    name: 'combat-race: a defender in a combat EVA suit (the user\'s overrule, 2026-11-07) is never flash-blind or deafened by supp.js\'s bang, and takes the bang\'s points × 0.6; the man beside him in utilities, facing it, is blinded and deafened',
    fn() {
      const { state, bus, pid, coachId, actor, coachActor } = armsWorld({ coach: true });
      // (the coach in a suit with a filtered visor and sound filtering; both face the burst, 1.5 m in front of each)
      state.items.suit1 = { id: 'suit1', type: 'suit', model: 'eva-c', visor: true };
      state.people[coachId].kit = { worn: { suit: 'suit1' } };
      // (the marine in utilities: the familiarisation issue's ear defenders taken off his head)
      const worn = state.people[pid].kit.worn;
      for (const [slot, id] of Object.entries(worn)) if (state.items[id]?.type === 'ears') delete worn[slot];
      actor.face = 'right'; coachActor.face = 'right'; coachActor.x = actor.x; coachActor.z = actor.z + 0.6;
      const at = state.clock.ms, out = bang(state, bus, { id: 'race:1', x: actor.x + 1.5, z: actor.z + 0.3, atMs: at });
      const me = out.find(o => o.who === pid), him = out.find(o => o.who === coachId), B = blockOf(state, coachId), A = blockOf(state, pid);
      console.log(`      the man in utilities: pool ${A.supp}, felt ${feltOf(state, pid, at)}, ${me.flash}, deaf ${hearingOf(state, pid, at).deaf} (${fmt((A.deafUntilMs - at) / 3_600_000, 2)} h); the suited one (${JSON.stringify(protOf(state, coachId))}): pool ${B.supp}, felt ${feltOf(state, coachId, at)}, flash ${him.flash}, deaf ${hearingOf(state, coachId, at).deaf}`);
      assert(him.flash === null && !hearingOf(state, coachId, at).deaf && !B.blindUntilMs && !B.deafUntilMs, JSON.stringify({ him, B }));
      assert(me.flash === 'blind' && hearingOf(state, pid, at).deaf, JSON.stringify({ me, A }));
      assert(Math.abs(B.supp - Math.round(100 * A.supp * 0.6) / 100) <= 0.6, JSON.stringify({ a: A.supp, b: B.supp }));
    },
  },
];
