// OLYMPUS tests: the card never contradicts the stage (the build sheet v0.0.23 item 2, F90; rule V1, §0 item 2).
//
// On v0.0.22 a role-player's card drew him "as identified" (target.js liveGear): until your take-in read his hands they were drawn
// empty, while the stage painted the rifle in them; the user's note of 2026-11-17: "show us what we would be seeing, including what
// they are holding". liveGear is retired: the card draws in his hands what the stage draws (the Seen record), and the take-in's read
// stays in the words ("HANDS NOT SEEN · 2A"). On two live lanes (the tier one by the honest bot on 48213: live:hide,give and
// live:fight,fight) every role-player's card model at every tick of the lane is checked against an oracle written from the stage's
// own readers (tests/flawless-portrait.mjs stageHolds: gunLook, the view's hands-up rule, handDeviceOf; never seen.js): never empty
// hands where the stage draws a gun, hands up where it draws them up, never front on when turned past FACING_BACK_RAD; and the
// card's subject is the record seenOf gives. Prints the ticks checked, the stage's holds met and the words the take-in left.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseHonestBot, runHouse } from './bots/house.mjs';
import { seenOf } from '../src/sim/people/seen.js';
import { targetModel, UNSEEN_WORDS } from '../src/ui/hud/target.js';
import { stageHolds, cardAgrees, PORTRAIT_ENFORCED } from './flawless-portrait.mjs';

const LANES = ['live:hide,give', 'live:fight,fight'];

export default [
  {
    name: `F90 the card shows what the stage shows: on the live lanes (${LANES.join(', ')}) at every tick, never empty hands where the stage draws a gun (v0.0.22: liveGear emptied them until your take-in read them), the hands up where it draws them up, never front on turned away; the subject seenOf's record`,
    fn() {
      const bad = [];
      for (const opfor of LANES) {
        const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone', setup: 'go', opfor });
        const n = { ticks: 0, cards: 0, gun: 0, up: 0, none: 0, device: 0, unseenWords: 0, gunWhileUnseen: 0 };
        const r = runHouse(g, houseHonestBot(), { each(game) {
          const s = game.state, H = s.armoury.range.house;
          if (H.goAtMs === null || H.goAtMs === undefined || H.end) return;
          n.ticks++;
          for (const T of s.armoury.range.turners.filter(t => t.live?.who)) {
            const who = T.live.who, m = targetModel(s, { key: T.key, kind: 'person', who, readers: {} });
            if (!m) continue;
            n.cards++;
            const o = stageHolds(s, who), v = cardAgrees(m, o);
            n[o.holds]++;
            if (m.words?.startsWith(UNSEEN_WORDS)) { n.unseenWords++; if (o.holds === 'gun') n.gunWhileUnseen++; }
            if (!v.ok) bad.push(`${opfor} ${T.stand} at ${s.clock.ms - H.goAtMs} ms: ${v.why}`);
            const rec = seenOf(s, who);
            if (m.subject?.rec?.key !== rec?.key) bad.push(`${opfor} ${T.stand}: the card's record ${m.subject?.rec?.key} is not seenOf's ${rec?.key}`);
          }
        } });
        assert(r.done, `${opfor} reaches its card`);
        console.log(`      ${opfor}: ${n.ticks} ticks of the lane, ${n.cards} cards; the stage drew a gun ${n.gun}, hands up ${n.up}, nothing ${n.none}, a device ${n.device}; "${UNSEEN_WORDS}" in the words ${n.unseenWords} (with the gun drawn in his hands ${n.gunWhileUnseen})`);
      }
      for (const b of bad.slice(0, 8)) console.log(`      ${b}`);
      assert(!bad.length && PORTRAIT_ENFORCED.has('F90'), `${bad.length} disagreements`);
    },
  },
];
