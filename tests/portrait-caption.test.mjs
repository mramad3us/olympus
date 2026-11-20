// OLYMPUS tests: a live man's card says what it draws (v0.0.28, the picks' CARDS, the judge's pass of 2026-11-20, fault 5).
//
// On "Stack and clear, live" (the sergeant by T on seed 1, live:give,fight) the card read "AIMING · PAIR · 1 SEEN" over a man drawn at
// the low ready: the words took the take-in's read (engage.js seenState) and the figure the stage's record (seen.js seenOf, the
// view's aim held AIM_DWELL_MS), two fields that part when he lowers his gun. src/ui/hud/target.js captionState takes the verb from
// the figure's record: AIMING only over a man drawn aimed, a man drawn aimed never LOOKING. Here every live man's card at every tick
// of three lanes, the view's own readers (the aim's dwell kept between ticks), is held to that; the verb as read without
// captionState is counted too (the old card's AIMING over another hold), so the test is red on v0.0.27's words.
// The converse (the art director's pass 3 of the same day: the breach lane drew A3 under "PAIR · 1 SEEN" a moment after "AIMING · PAIR
// · 1 SEEN"): a man drawn aimed, his hands read (not veiled, V3), carries AIMING (or FIRING BLIND); held on four lanes, the judge's
// breach lane (the raider, the breach kit, live:fight,hide on seed 1) among them, and counted on pass 2's rule, which missed it.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { houseBot, houseHonestBot, runHouse } from './bots/house.mjs';
import { targetModel, aimedRec, captionState } from '../src/ui/hud/target.js';
import { seenState, seenFace } from '../src/sim/arms/engage.js';

/** Pass 2's rule (v0.0.28 before the art director's pass 3): only LOOKING over a figure drawn aimed became AIMING. */
const pass2 = (st, rec) => (st === 'looking' && aimedRec(rec) ? 'aiming' : st);

const LANES = [{ seed: 1, tier: 'sgt', opfor: 'live:give,fight', bot: () => houseBot({ mode: 'T' }) }, { seed: 1, tier: 'raider', opfor: 'live:fight,hide', loadout: 'breach', bot: () => houseBot({ mode: 'T' }) }, { seed: 48213, tier: 'tierone', opfor: 'live:fight,fight', bot: () => houseHonestBot() }, { seed: 48213, tier: 'tierone', opfor: 'live:hide,give', bot: () => houseHonestBot() }];

export default [
  {
    name: 'a live man\'s card never says AIMING over another hold, and a man drawn aimed always says AIMING (the judge\'s passes of 2026-11-20: "AIMING · PAIR · 1 SEEN" over the low ready; A3 under "PAIR · 1 SEEN"): the verb and the drawing from the one record on four live lanes, at every tick',
    fn() {
      const bad = [];
      let readWrong = 0, missed = 0;
      for (const L of LANES) {
        const g = createGame({ scenario: 'test-shoothouse', seed: L.seed, tier: L.tier, setup: 'go', opfor: L.opfor, ...(L.loadout ? { loadout: L.loadout } : {}) });
        const readers = { aims: new Map() }, n = { cards: 0, aiming: 0, aimedDrawn: 0 };
        const r = runHouse(g, L.bot(), { each(game) {
          const s = game.state, H = s.armoury.range.house;
          if (H.goAtMs === null || H.goAtMs === undefined || H.end) return;
          for (const T of s.armoury.range.turners.filter(t => t.live?.who)) {
            const m = targetModel(s, { key: T.key, kind: 'person', who: T.live.who, readers });
            if (!m?.subject?.rec) continue;
            n.cards++;
            const aimed = aimedRec(m.subject.rec), words = m.words ?? '';
            if (aimed) n.aimedDrawn++;
            if (/\bAIMING\b/.test(words)) n.aiming++;
            if (/\bAIMING\b/.test(words) && !aimed) bad.push(`${L.opfor} ${T.stand} at ${s.clock.ms - H.goAtMs} ms: "${words}" over ${m.subject.rec.hold?.how ?? 'no hold'}`);
            if (/\bLOOKING\b/.test(words) && aimed) bad.push(`${L.opfor} ${T.stand} at ${s.clock.ms - H.goAtMs} ms: "${words}" over a gun aimed`);
            // (the converse: drawn aimed with his hands read, AIMING (or FIRING BLIND))
            const veiled = m.live?.holds === 'unseen', st0 = seenState(s, T.key);
            if (aimed && !veiled && !/\b(AIMING|FIRING BLIND)\b/.test(words)) bad.push(`${L.opfor} ${T.stand} at ${s.clock.ms - H.goAtMs} ms: "${words}" over a figure drawn aimed`);
            if (aimed && !veiled && pass2(st0, m.subject.rec) !== 'aiming' && st0 !== 'firing-blind' && seenFace(s, T.key).holds !== 'unseen') n.pass2Miss = (n.pass2Miss ?? 0) + 1, missed++;
            // (the take-in's read alone, as v0.0.27 worded it)
            const st = seenState(s, T.key);
            if (st === 'aiming' && !aimed && captionState(st, m.subject.rec) !== st) readWrong++;
          }
        } });
        assert(r.done, `${L.opfor} on ${L.seed} reaches its card`);
        console.log(`      ${L.tier} ${L.seed} ${L.opfor}${L.loadout ? ` (${L.loadout})` : ''}: ${n.cards} cards, "AIMING" on ${n.aiming}, drawn aimed ${n.aimedDrawn}, pass 2's rule without AIMING over a figure drawn aimed ${n.pass2Miss ?? 0}`);
      }
      console.log(`      the take-in's read alone would have said AIMING over another hold on ${readWrong} cards`);
      for (const b of bad.slice(0, 8)) console.log(`      ${b}`);
      console.log(`      pass 2's rule would have left AIMING off a figure drawn aimed on ${missed} cards`);
      assert(!bad.length && readWrong > 0 && missed > 0, `${bad.length} cards whose words contradict their figure; the old words' ${readWrong}, pass 2's ${missed}`);
    },
  },
];
