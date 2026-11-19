// OLYMPUS tests: the live lane briefed as live, with a sterile check on the floor before LOAD (v0.0.23, its build sheet item 17, carried DC3; F94; COMBAT §25.10).
//
// Before v0.0.23 "Stack and clear, live" was briefed and loaded as the frangible lane ("My timer, not your wounds.", "Frangible today.
// Your first magazine, ten rounds. LOAD.") and LOAD came 23.10 s after the fill with nobody looking at anyone's kit, though a live
// lane begins with the safety's look at every man (the doctrine lens). Now shoothouse.js houseCmdSay says the brief's and LOAD's
// `sayLive` (courses.js SEQ_HOUSE; the drawn house's own on SEQ_HOUSE_DRAWN, never "Lane A" there), and once the brief's chain is
// said the instructor walks on the floor to STERILE_STAND_M 0.8 m in front of you, then of your #2 (sterileTick, chiefStep's { floor }),
// looks (lookTick keyed 'sterile', H.sterile), says "Clean. Next." then "Clean.", and houseReady's brief gate lets LOAD come after both.
// Nothing to press. The turner lane's tower is v0.0.22's word for word. F94 (tests/flawless-carried.mjs) over the lanes: LOAD after
// both looks, no "frangible" or "not your wounds" from the fill to the card. The cases were house-live-words' in the build sheet (its
// §6); they are a file of their own because that file sat at its 3 s CPU budget (QUICK_FILE_CPU_S) with them.
import { assert } from './helpers.mjs';
import { SEQ_HOUSE, SEQ_HOUSE_DRAWN, HOUSE_CHIEF } from '../src/data/courses.js';
import { loadLane, carriedWordsGauges, FRANGIBLE_WORDS } from './flawless-carried.mjs';
import { houseBot } from './bots/house.mjs';

export default [
  {
    name: 'the live lane is briefed as live and checked sterile before LOAD: the tower\'s live brief (the drawn house\'s own, never "Lane A"), the instructor on the floor at each of you, "Clean. Next." then "Clean.", LOAD after both looks, no "frangible" or "not your wounds"; the turner lane\'s tower word for word v0.0.22\'s, LOAD at its 23.10 s (v0.0.23, DC3; F94; before: "Frangible today." on the live lane, LOAD at 23.10 s with no look)',
    fn() {
      const live = [loadLane({ tier: 'sgt', seed: 48213, opfor: 'live:fight,hide' }), loadLane({ tier: 'private', seed: 2, opfor: 'live', fill: { draw: 'drawn' } })];
      const turner = loadLane({ tier: 'sgt', seed: 48213 });
      const bad = [];
      for (const r of live) {
        const drawn = /drawn$/.test(r.cell), brief = (drawn ? SEQ_HOUSE_DRAWN : SEQ_HOUSE)[0], load = SEQ_HOUSE.find(c => c.id === 'load');
        const said = r.said, clean = said.filter(t => HOUSE_CHIEF.sterile.includes(t)), S = r.g.state.armoury.range.house.sterile;
        console.log(`      ${r.cell}: "${said.find(t => brief.sayLive.includes(t))?.slice(0, 48) ?? 'NO LIVE BRIEF'}…"; the looks at ${r.sterileDone.map(ms => (ms / 1000).toFixed(2)).join(', ')} s (${clean.join(' | ')}), LOAD at ${(r.loadMs / 1000).toFixed(2)} s ("${said.find(t => load.sayLive.includes(t)) ?? 'NO LIVE LOAD'}"); the instructor stood ${S?.to ? `${S.to.join(', ')}` : '-'}`);
        if (!said.some(t => brief.sayLive.includes(t))) bad.push(`${r.cell}: no live brief`);
        if (drawn && said.some(t => /Lane A/.test(t))) bad.push(`${r.cell}: "Lane A" on a drawn house`);
        if (!said.some(t => load.sayLive.includes(t))) bad.push(`${r.cell}: no live LOAD`);
        if (clean.length !== 2 || clean[0] !== HOUSE_CHIEF.sterile[1] || clean[1] !== HOUSE_CHIEF.sterile[0]) bad.push(`${r.cell}: the looks said ${JSON.stringify(clean)}`);
        if (said.some(t => FRANGIBLE_WORDS.test(t))) bad.push(`${r.cell}: a frangible word`);
      }
      const tb = SEQ_HOUSE[0], tl = SEQ_HOUSE.find(c => c.id === 'load');
      console.log(`      the turner lane ${turner.cell}: "${turner.said.find(t => tb.say.includes(t))?.slice(0, 40) ?? 'NOT THE BRIEF'}…", LOAD at ${(turner.loadMs / 1000).toFixed(2)} s ("${turner.said.find(t => tl.say.includes(t)) ?? '-'}"), the looks ${turner.sterileDone.length}`);
      if (!turner.said.some(t => tb.say.includes(t)) || !turner.said.some(t => tl.say.includes(t)) || turner.loadMs !== 23_100 || turner.sterileDone.length || turner.said.some(t => HOUSE_CHIEF.sterile.includes(t))) bad.push(`the turner lane: ${JSON.stringify({ loadMs: turner.loadMs, looks: turner.sterileDone })}`);
      const F94 = carriedWordsGauges({ live }).find(x => x.id === 'F94');
      console.log(`      F94 ${F94.name} (to LOAD): ${F94.met ? 'MET' : 'NOT MET'}, ${F94.value}`);
      assert(!bad.length && F94.met, [...bad, ...F94.bad].join(' | '));
    },
  },
  {
    name: 'F94 from the fill to the card (heavy): the live lane on six seeds by the keys (the boot recruit and the private) and T (the sergeant and the tier one), and a drawn live lane of each: LOAD after both sterile looks, no "frangible" or "not your wounds" said from the fill to the card, every lane to its card (v0.0.23, DC3)',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const live = [];
      for (const [tier, mode] of [['recruit', 'keys'], ['private', 'keys'], ['sgt', 'T'], ['tierone', 'T']]) {
        for (const seed of [48213, 1, 2, 3, 4, 5]) live.push(loadLane({ tier, seed, opfor: 'live', toEnd: houseBot({ mode }) }));
        live.push(loadLane({ tier, seed: 7, opfor: 'live', fill: { draw: 'drawn' }, toEnd: houseBot({ mode }) }));
      }
      const F94 = carriedWordsGauges({ live }).find(x => x.id === 'F94'), loads = live.map(r => r.loadMs).sort((a, b) => a - b), gaps = live.map(r => r.loadMs - Math.max(...r.sterileDone));
      console.log(`      ${live.length} lanes, ${live.filter(r => r.done).length} to the card; LOAD at ${(loads[0] / 1000).toFixed(2)} to ${(loads.at(-1) / 1000).toFixed(2)} s from the fill, ${(Math.min(...gaps) / 1000).toFixed(2)} s or more after the second look`);
      console.log(`      F94 ${F94.name}: ${F94.met ? 'MET' : 'NOT MET'}, ${F94.value}`);
      for (const b of F94.bad.slice(0, 6)) console.log(`        ${b}`);
      assert(F94.met && live.every(r => r.done), [...F94.bad, ...live.filter(r => !r.done).map(r => `${r.cell} not to the card`)].slice(0, 8).join(' | '));
    },
  },
];
