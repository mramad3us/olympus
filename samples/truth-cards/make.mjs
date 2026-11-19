// OLYMPUS sample tool: play a shoot house lane to its card in node, for the truth cards' layout sample.
//
//   node samples/truth-cards/make.mjs [--seed 4028068471] [--tier private]
//
// The sample (samples/truth-cards) lays out the end card's truth cards (the overhaul's O-17: each man and stand you engaged,
// as he truly was at your first round) three ways, over the end card's own plan view. This script plays the lane the real
// way, headless (tests/game.mjs createGame, the honest house bot of tests/bots/house.mjs by the keys, the private on your seed
// of 2026-11-17, 4028068471, the house as set), to its card, and writes lane.json: the plan view's model as the end card has it
// (src/sim/scenarios/house-debrief.js debriefOf: the walls, the doors, the trace, the events, the run sheet's legs), and for
// each stand you put a round on, its truth card's model as the end card's plan opens it (src/sim/arms/marks.js hitMarks in
// truth, src/ui/hud/hitcard.js cardModel at its range band: what paintHitcard draws), with its room's leg, the time of your
// first round on it from GO and its words. Nothing of the game is changed; the numbers it prints are the lane's.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGame } from '../../tests/game.mjs';
import { houseBot, runHouse } from '../../tests/bots/house.mjs';
import { debriefOf } from '../../src/sim/scenarios/house-debrief.js';
import { hitMarks } from '../../src/sim/arms/marks.js';
import { cardModel, hitRangeM, HIT_LOOK } from '../../src/ui/hud/hitcard.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const SEED = Number(opt('--seed', 4028068471)), TIER = opt('--tier', 'private');

const game = createGame({ scenario: 'test-shoothouse', seed: SEED, tier: TIER });
const run = runHouse(game, houseBot({ mode: 'keys' }));
const s = game.state, R = s.armoury.range, d = debriefOf(s);
if (!run.done || !d) throw new Error(`the lane did not reach its card (${run.ticks} ticks)`);
const me = s.actors.list.find(a => a.who === s.player.id), at = { x: me.x, z: me.z };
const legOf = (T) => (T.stand === 'H' ? 3 : Number(T.stand[0]) - 1);
const cards = [];
for (const T of R.turners) {
  const hm = hitMarks(s, T.key, { k: legOf(T), phase: 'truth' });
  if (!hm?.marks?.length) continue;
  // (your first round on it, ms from GO: the truth at that moment is what the card shows)
  const first = Math.min(...(T.hits ?? []).filter(h => h.by === 'me').map(h => h.atMs).filter(Number.isFinite));
  cards.push({ key: T.key, stand: T.stand, leg: legOf(T), firstMs: Number.isFinite(first) ? first - d.goAtMs : null, model: cardModel(hm, { look: HIT_LOOK, face: hm.face ?? T.face, holds: hm.holds ?? T.holds, rangeM: hitRangeM(T, at, R.line) }) });
}
cards.sort((a, b) => (a.firstMs ?? Infinity) - (b.firstMs ?? Infinity) || a.leg - b.leg);
const out = { about: 'Made by make.mjs (see its header): the plan view\'s model (house-debrief.js debriefOf) and each engaged stand\'s truth card model (hitMarks in truth, cardModel), the private by the keys on seed ' + SEED + ', the house as set.', seed: SEED, tier: TIER, laneMs: d.endAtMs - d.goAtMs, debrief: d, cards };
const text = JSON.stringify(out);
writeFileSync(path.join(ROOT, 'samples/truth-cards/lane.json'), text + '\n');
console.log(`lane to the card in ${run.ticks} ticks; ${cards.length} truth cards (${cards.map(c => `${c.stand}:${c.model.marks.length}`).join(' ')}); lane.json ${(text.length / 1024).toFixed(1)} KB`);
