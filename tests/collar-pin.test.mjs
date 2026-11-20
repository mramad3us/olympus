// OLYMPUS tests: the boarding's pin (the build sheet v0.0.27 §6 D's heavy collar-pin): its lanes played whole, from the fill to the card, held to the tick, the run sheet and the save.
//
// house-pin's and zerocqb-pin's way on the Patient Mule: each cell a lane from the fill (no setup: the brief, the override behind its
// splash, Standby, GO, the passage held, the three compartments, the card), run by tests/bots/collar.mjs to the range's end, compared on
// the lane's last tick, the digest of its run sheet (runSheetOf, canonical JSON) and the digest of its save (game.digest()). The cells: the
// private by the keys and the sergeant by T, against pirates and against smugglers, on 48213. Recorded at D's merge (PRINT_HASH=1) on the
// tree after B, A and C (.run/v027/after-BAC.tree with D's patch): a cell that moves says why, in this header and in CHANGELOG.md, and is
// re-recorded; anywhere else it is a bug.
import { assert } from './helpers.mjs';
import { goldenDigest, PRINT_HASH } from './golden.mjs';
import { createGame } from './game.mjs';
import { collarLane } from './bots/collar.mjs';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';

// (the pinned cells: 'bot/sheet/holdouts/seed' → [last tick, run sheet digest, save digest]; PRINT_HASH=1 prints them to paste)
// (recorded on D's tree after B, A and C, 2026-11-19, then re-recorded once by the fix of D's review, each cause in turn: the re-cut of
// B, A and C (their review's fixes) moved the smugglers' saves; the activities of d-outside (the override's and the fall back's splash,
// src/data/activities.js) moved all four saves; the lock's inner hatch registered on its swing (holders.js lockTick, C's fix: it had stood
// shut to sight for the whole lane, the review's first finding) moved every cell: the pirates on 48213 no longer put both holders down as
// they come through and fall back at 35.9 s; the keys' private clears the deck, the sergeant by T is down in the bunk room (with it alone:
// [3303, '1bdf7b8b7d33ce', '12a40f0b886a65'], [2643, '19803d004573b1', '02923f2c3e7090'], [1963, '0374f107ed9230', '182175117e2f70'],
// [3363, '06699d352e1773', '0d1a3bf916d06e']); then no paint, par or zone aboard (the review's third finding: no par judged, so the
// contacts' par fields stay unset, and the rows' words) moved every sheet and save, no tick. Was: keys/private/pirates [1224,
// '012269a02d3615', '04c4e06d1d951f'], keys/private/smugglers [3103, '1c150ea9526335', '1dddee60b58829'], T/sgt/pirates [1224,
// '16f4d17fc131df', '18a058f911159f'], T/sgt/smugglers [4563, '1c0b9855a5e346', '0a76431f6df696'] (that one re-recorded the same day
// before by D's bots taking B's "Tourniquet" and "Get up" rows, from [4463, '162c692c4f0037', '0230890d263579']))
// (and at E's merge, e-outside.patch: the holdouts' and the crew's dress on their actors (posts.js 'beltCoverall', opfor.js fillOpfor's
// outfit, the pirates' rifles 'urban') and the AR's sealed suit (holders.js fillHolders) moved every save, no tick and no sheet; e.patch
// alone moves none. Before it: [3303, …, '1337e9c9a94018'], [2643, …, '1f7ffd82b9963e'], [1963, …, '02485a95bf1888'], [3363, …,
// '135cd171ca892b'])
// (and at the integration on v0.0.26's tag, 2026-11-19: bac-lead-edits.md §2, the review's no drip in free fall (body/blood.js dripStep under
// FREE_G_MS2), moved every save, no tick and no sheet: the bleeding men on the deck drop no decal at 0 G; checked with that edit alone
// undone, the four saves e-outside's again. Before it: [3303, …, '1c0f25905ce0ca'], [2643, …, '1c0a8bb61d7e79'], [1963, …,
// '0b60fccb4405ee'], [3363, …, '0696c30c9e0f8f'])
// (and at v0.0.27's carried stage, 2026-11-20, three causes, each checked alone in turn: (1) the holders stop and fight an armed man in
// their sector on their walk to their posts (holders.js brain's armedInSight, the AR stopped behind the leader by heldUpBy, the lead's call
// on C's barricade twin): every cell moved, ticks too, with it alone [2623, '0b269bf5367180', '1a97ed9a13518a'], [2563, '10b8c142730523',
// '0acadcc6be6b95'], [1963, '1db94cb8d34b10', '18f36a5e288be8'], [3363, '1f930ce9246303', '1323e2460e2888']; (2) the G-11s issued aboard
// (shoothouse.js BOARDING_BANGS, three for you and three for Four, never made by the build) and each compartment's hatch past the passage
// preset to the flash (bangAtHatch): the sergeant by T bangs every compartment and clears the pirates' deck (was down in cabin 2), every
// cell moved, with (1) and (2) [2703, '18e81870630dfd', '1e21b79a868ad8'], [2363, '0e5ab47702102d', '160b8e9aed2ccc'], [3343,
// '1664950e9ffcf2', '17ce4639bab4e4'], [3983, '0c95c44055acf9', '0f2f16a395ed57']; (3) the collar bot's "Get up" row at a contact's pause
// with its knock over (tests/bots/collar.mjs: a move key is refused there; the bot's memory is in the save) moved the keys' pirates save
// alone, [2703, …, '04bc4d2f4ab013']; then the preset made once a hatch (R.house.boarding.preset, so "No bang" survives X and stop motion
// again) moved the four saves, no tick and no sheet. Before them: [3303, '0e9293895f16ad', '0536416191fa2c'], [2643, '0fb0ffbe51e509', '14efb524d8802a'], [1963, '14c7d714ca32d9',
// '1dd824f336a216'], [3363, '0a30959525751e', '1efd9bae57b83d'])
// (and by the fixer of v0.0.27's two reviews, 2026-11-20 (.run/v027/fix.md), each cause checked alone by undoing it on the fixed tree:
// (1) "Flash it" at a hatch for the sheets below rung 2 (bundle.js HATCH_BUNDLES): the keys' private bangs the pirates' compartments, the
// tick too, 2703 to 3103 (with it alone undone [2703, '1c6f5ec8d50bab', '0fbc16ca6c886a']); (2) the defenders' misses meet a face
// (men.js incoming to holes.js missFace): the sheet's MISSES row and the save's holes, both private cells and the sergeant's smugglers,
// no tick; (3) the entry on the bang aboard judged against BANG_LATE_SHIP_MS: the sergeant's two cells lose their bang faults, sheet and
// save; (4) THEIR CHOICES without the rulings ('out'), every sheet; (5) no practised line aboard, every sheet; (6) the boarding's one
// thing ("The deck is ours, by the drill."), the sergeant's sheets; (7) the leader's words for men who gave up (COLLAR_LEADER.outHands),
// both private saves; (8) a real round's words on a man in the log (shot.js REAL_WORDS: "in the chest", never "in the C zone"), every
// save; (9) the override's time said in minutes and seconds (activities.js durSeconds: "2 min 30 s"), every save. Was:
// keys/private/pirates [2703, '18e81870630dfd', '1e5edf7d22f374'], keys/private/smugglers [2363, '0e5ab47702102d', '1b0efd4c1733dd'],
// T/sgt/pirates [3343, '1664950e9ffcf2', '1182a63e595801'], T/sgt/smugglers [3983, '0c95c44055acf9', '01776e494f4cb7'])
const PIN = {
  'keys/private/pirates/48213': [3103, '0ebe79db106514', '0053949ffc61b2'],
  'keys/private/smugglers/48213': [2363, '0ad35df42923bf', '184c983ebb3d7b'],
  'T/sgt/pirates/48213': [3343, '06fc85b9df51d1', '08ab4558ee437c'],
  'T/sgt/smugglers/48213': [3983, '13b17649768ea9', '1531718e88b4dc'],
};
const CELLS = [['keys', 'private', 'pirates', 48213], ['keys', 'private', 'smugglers', 48213], ['T', 'sgt', 'pirates', 48213], ['T', 'sgt', 'smugglers', 48213]];

export default [
  {
    name: 'the boarding\'s pin: four lanes from the fill to the card (the private by the keys and the sergeant by T, against pirates and smugglers, on 48213) held to the tick, the run sheet and the save',
    heavy: true,
    timeoutMs: 600_000,
    fn() {
      const moved = [];
      for (const [bot, tier, holdouts, seed] of CELLS) {
        const k = `${bot}/${tier}/${holdouts}/${seed}`, r = collarLane(createGame, { tier, seed, bot, holdouts }), s = r.game.state;
        const got = { tick: s.clock.tick, sheet: goldenDigest(runSheetOf(s)), save: r.game.digest() }, want = PIN[k];
        const same = want && want[0] === got.tick && want[1] === got.sheet && want[2] === got.save;
        if (PRINT_HASH) console.log(`      '${k}': [${got.tick}, '${got.sheet}', '${got.save}'],${want && !same ? `  // (was [${want[0]}, '${want[1]}', '${want[2]}'])` : ''}`);
        else console.log(`      ${k.padEnd(28)} ${r.end} at tick ${got.tick}, sheet ${got.sheet}, save ${got.save}${same ? '' : `  MOVED (was ${want ? want.join(', ') : 'none'})`}`);
        if (!r.done) moved.push(`${k}: no card`);
        else if (!same) moved.push(k);
      }
      assert(PRINT_HASH || !moved.length, moved.join(', '));
    },
  },
];
