// OLYMPUS tests: the DI's lines on the live lane name rows the panel has (COMBAT §25.8.3, §25.18; the build sheet v0.0.19 §1 L-house; F24 on the live lane).
//
// The live men's four lines (skills/instinct/cqb.js): cqb-rp-fire "He's on you." (a role-player of yours up and firing,
// bracketed: the pair it names, left to you), cqb-rp-down "He's down. Cover him." (Cover him: the contact's hold on him, or the
// aim onto him and its hold), cqb-rp-hands "Hands up. Challenge him." (Challenge, then Cover him) and cqb-rp-gone "Find him."
// (the Look at the hot spot nearest where he was last seen). The honest bot's lanes over the cards are watched at every stop:
// a live line's act must be a live row of the panel (stepsOf, not struck), its named row too where it has no act, and the
// lines must speak (each lane's counts printed). Your number two takes most men down by himself ("Got him."), so the cover lines
// are held on a lane set up at room 2's door too: its man down by your rounds, your pause on him, cqb-rp-down's Cover him a row.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { stepsOf } from '../src/sim/arms/shooting.js';
import { houseShot } from '../src/sim/scenarios/shoothouse.js';

// (the sergeant's hide,hide on 48213: room 3's man fires from his hide before your pair, cqb-rp-fire's lane once the casualty's
// beat strikes the panel (the review of track L: the line had spoken only inside that beat, over a full panel cut on every press))
const LANES = Object.freeze([['tierone', 'live:fight,fight'], ['tierone', 'live:give,give'], ['sgt', 'live:fight,hide'], ['cpl', 'live:give,fight'], ['sgt', 'live:hide,hide']]);

export default [
  {
    name: 'v0.0.19: T on every live line (cqb-rp-fire, cqb-rp-down, cqb-rp-hands, cqb-rp-gone) is a live row of the panel at its stop, over the honest bot\'s lanes on five sheets and cards; a live line speaks',
    timeoutMs: 120_000,
    fn() {
      const seen = {}, bad = [];
      for (const [tier, opfor] of LANES) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier, setup: 'go', opfor }), mine = {};
        let was = null;
        const r = runHouse(g, houseHonestBot(), { maxMs: 8 * 60_000, each: (gg) => {
          const st = gg.state, S = st.stop, choosing = S?.mode === 'stop' && S.phase === 'choose' && !S.reflex, line = instinctNow(st).line;
          const key = choosing && line?.id?.startsWith('cqb-rp-') ? `${st.clock.ms}|${line.id}|${line.act}` : null;
          if (!key || key === was) { was = key; return; }
          was = key;
          mine[line.id] = (mine[line.id] ?? 0) + 1; seen[line.id] = (seen[line.id] ?? 0) + 1;
          const steps = stepsOf(st), id = line.act ? line.act.replace(/^stop:/, '') : line.row ?? null, row = id ? steps.find(s => s.id === id) ?? steps.find(s => s.id === id.split('>')[0]) : null;
          if (!row || row.off) bad.push(`${tier} ${opfor} ${line.id} "${line.text}" ${line.act ?? `(names ${line.row ?? 'nothing'})`}: ${row ? `struck ${row.off}` : 'no such row'}`);
        } });
        console.log(`      ${tier.padEnd(8)} ${opfor.padEnd(16)} ${r.done ? 'to its card' : 'NOT DONE'} (${g.state.armoury.range.house.end?.why}): ${Object.entries(mine).map(([k, v]) => `${k} ${v}`).join(', ') || 'no live line'}`);
        if (!r.done) bad.push(`${tier} ${opfor}: not to its card`);
      }
      console.log(`      over the lanes: ${Object.entries(seen).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}; not a live row ${bad.length}`);
      assert(!bad.length, bad.slice(0, 4).join(' | '));
      assert(Object.keys(seen).length > 0, JSON.stringify(seen));
    },
  },
  {
    name: 'v0.0.19: a role-player down by your rounds at your pause on him, nobody covering him: cqb-rp-down "He\'s down. Cover him." and T the contact\'s Cover him, a live row (fails without the rule)',
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'room:2', opfor: 'live:fight,fight' }), st = g.state, R = st.armoury.range, T = R.turners.find(t => t.stand === '2a'), now = st.clock.ms;
      for (const x of R.turners) if (x.turnAtMs !== null) x.turnAtMs -= 5000;
      const c = (st.mind.contact ??= {}); c.last = { id: 'il-c', ids: [T.key], ident: { [T.key]: 'rifle' }, armour: {}, seenMs: now - 400, atMs: now - 100, ms: 300, expect: 'sector', n: 1 }; (c.known ??= {})[T.key] = now - 400;
      for (const i of [1, 2]) houseShot(st, null, { id: `il-${i}`, fired: true, who: st.player.id, target: T.key, zone: 'A', part: 'torso', atMs: now });
      st.stop.pick = T.key;
      delete st.$instinct; g.step(1);
      const line = instinctNow(st).line, row = line?.act ? stepsOf(st).find(x => x.id === line.act.replace(/^stop:/, '')) : null;
      console.log(`      2a down (${T.live.st}), your bracket on him: the line ${line?.id ?? 'none'} "${line?.text ?? ''}" (${line?.act ?? 'no act'}); its row ${row ? `${row.id} "${row.label}"${row.off ? ` struck ${row.off}` : ''}` : 'none'}`);
      assert(line?.id === 'cqb-rp-down' && row && !row.off, JSON.stringify({ line, row }));
    },
  },
];
