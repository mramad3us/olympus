// OLYMPUS tests: the doll's gear and the card's guns agree on where each gun is (the build sheet 0.0.18 §1 "lead", §2.2).
//
// Two modules say where a person's guns are: src/sim/arms/guns.js (arms: the weapon card's strip and the GUN card, its places
// 'hands', 'hanging', 'slungFront', 'slungBack', 'holster') and src/sim/arms/gear.js (doll: the I and C figures and the target
// view, its coarser places). They were built apart and neither imports the other, so this suite is their contract: every gun
// guns.js lists is in the gear record and the other way round, and each place maps by §2.2's table
//   hands → rifle ready, pistol ready; hanging and slungFront → rifle front; slungBack → rifle back; holster → pistol holster.
// It is read at every tick of shoot-house lanes on three sheets answering the rifle's click with Transition: pistol, so the
// three moments the sheet names are all crossed (the house's GO, the rifle hanging with the P-12 drawn, and Rifle up's end with
// the P-12 holstered), for you and for your #2 (who carries no pistol: DESIGN.md's log, 2026-11-15); and at the start of the
// brief, on the four ranges, where one gun is carried, and with the rifle slung on the back. A mapping that drifts in either module fails it.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse, stoppageBot } from './bots/house.mjs';
import { gearOf } from '../src/sim/arms/gear.js';
import { gunsOf } from '../src/sim/arms/guns.js';

const SEED = 1489397426;
/** §2.2's table: guns.js's place → the gear record's, by the gun's kind. */
const MAP = Object.freeze({
  rifle: Object.freeze({ hands: 'ready', hanging: 'front', slungFront: 'front', slungBack: 'back' }),
  pistol: Object.freeze({ hands: 'ready', holster: 'holster' }),
});

// (one person's agreement now: a list of disagreements, empty when they agree, and the pairs seen into tally)
function agree(state, pid, tally) {
  const gear = gearOf(state, pid), guns = gunsOf(state, pid), bad = [];
  for (const kind of ['rifle', 'pistol']) {
    const g = guns.find(x => x.kind === kind) ?? null, r = gear?.[kind] ?? null;
    if (!g && !r) continue;
    if (!g || !r) { bad.push({ kind, guns: g?.place ?? null, gear: r?.place ?? null }); continue; }
    const want = MAP[kind][g.place];
    const key = `${kind} ${g.place} → ${r.place}`;
    tally[key] = (tally[key] ?? 0) + 1;
    if (want !== r.place || g.model !== r.model) bad.push({ kind, guns: g.place, gear: r.place, want, model: [g.model, r.model] });
  }
  return bad;
}

export default [
  {
    name: 'the doll\'s gear and the card\'s guns agree on where each gun is, by the build sheet 0.0.18 §2.2\'s table, at every tick of the shoot house answering the click with Transition: pistol (the sergeant, the Raider and the tier one): at GO, with the rifle hanging and the P-12 drawn, after Rifle up with it holstered, for you and for your #2, who carries no pistol',
    timeoutMs: 120_000,
    fn() {
      const tally = {}, moments = {}, wrong = [];
      for (const tier of ['sgt', 'raider', 'tierone']) {
        const g = createGame({ scenario: 'test-shoothouse', seed: SEED, tier, setup: 'go' }), bot = stoppageBot({ answer: 'transition' });
        const pid = g.state.player.id, two = g.state.armoury.range.house.two.pid;
        const seen = { go: false, drawn: false, up: false };
        const look = (s) => {
          for (const who of [pid, two]) for (const b of agree(s, who, tally)) if (wrong.length < 6) wrong.push({ tier, who: who === pid ? 'you' : '#2', ms: s.clock.ms, ...b });
          const L = gunsOf(s, pid), R = L.find(x => x.kind === 'rifle')?.place, P = L.find(x => x.kind === 'pistol')?.place;
          if (!seen.go && R === 'hands' && P === 'holster') seen.go = true;
          if (seen.go && !seen.drawn && R === 'hanging' && P === 'hands') seen.drawn = true;
          if (seen.drawn && !seen.up && R === 'hands' && P === 'holster') seen.up = true;
          if (gunsOf(s, two).some(x => x.kind === 'pistol') || gearOf(s, two)?.pistol) wrong.push({ tier, who: '#2', pistol: true });
        };
        look(g.state);
        const run = runHouse(g, bot, { maxMs: 6 * 60_000, each: (game) => look(game.state) });
        moments[tier] = { ...seen, card: run.done };
      }
      console.log(`      the moments crossed: ${Object.entries(moments).map(([t, m]) => `${t} GO ${m.go ? '✓' : '✗'}, drawn ${m.drawn ? '✓' : '✗'}, Rifle up ${m.up ? '✓' : '✗'}, card ${m.card ? '✓' : '✗'}`).join('; ')}`);
      console.log(`      the places seen (guns.js → gear.js, ticks for you and your #2): ${Object.entries(tally).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
      console.log(`      disagreements: ${wrong.length}${wrong.length ? ` ${JSON.stringify(wrong.slice(0, 3))}` : ''}`);
      assert(!wrong.length, JSON.stringify(wrong));
      assert(Object.values(moments).every(m => m.go && m.drawn && m.up && m.card), JSON.stringify(moments));
    },
  },
  {
    name: 'the gear and the guns agree at the house\'s brief and where one gun is carried, test-handling, test-range, test-pairs and test-stress (no sidearm, so no pistol in either), and with the rifle slung on the back',
    fn() {
      const tally = {}, wrong = [], rows = [];
      const cases = [
        { scenario: 'test-shoothouse', tier: 'private' },
        { scenario: 'test-handling', setup: 'hot' },
        { scenario: 'test-range', setup: 'confirm' },
        { scenario: 'test-pairs', tier: 'private' },
        { scenario: 'test-stress', tier: 'private' },
        // (no scene slings it on the back at its start: the carry set by hand, as Sling it to the back leaves it)
        { scenario: 'test-pairs', tier: 'private', back: true },
      ];
      for (const c of cases) {
        const { back, ...opts } = c, g = createGame({ seed: 48213, ...opts }), pid = g.state.player.id;
        if (back) g.state.people[pid].kit.carry.posture = 'slungBack';
        for (const b of agree(g.state, pid, tally)) wrong.push({ ...c, ...b });
        g.step(40);
        for (const b of agree(g.state, pid, tally)) wrong.push({ ...c, ...b });
        const L = gunsOf(g.state, pid);
        rows.push(`${c.scenario}${back ? ' (slung back)' : ''} ${L.map(x => `${x.kind} ${x.place}`).join(', ') || 'none'} / gear rifle ${gearOf(g.state, pid)?.rifle?.place ?? '-'}, pistol ${gearOf(g.state, pid)?.pistol?.place ?? '-'}`);
        if (c.scenario !== 'test-shoothouse' && L.some(x => x.kind === 'pistol')) wrong.push({ ...c, pistol: true });
      }
      console.log(`      ${rows.join('; ')}`);
      console.log(`      the places seen: ${Object.entries(tally).map(([k, n]) => `${k} ${n}`).join(' · ')}; disagreements ${wrong.length}`);
      assert(!wrong.length && tally['rifle slungBack → back'] > 0, JSON.stringify({ wrong, tally }));
    },
  },
];
