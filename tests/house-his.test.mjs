// OLYMPUS tests: "That one's his. Carry on." with nothing to press, and the no-shoot the honest bot shot for it (the review of v0.0.21's A and B: F8 and F11 on drawn lanes, one bug).
//
// On a drawn house the corner room's closet may stand shut and unheld by your #2, and the bundle hands back its question,
// "Door, east wall. Hold it or clear it?" (stop.carry.why 'door-unplanned', cqb.js know's `asking`). While it stands, Carry on is no
// answer, so cqb-contact's 'his' line ("That one's his. Carry on.", your #2's man up) had no act: T had nothing to press (the tier one
// on drawn seed 62, room 3: B's one F11 dead end in 200 lanes), and the honest bot, reading any act-less contact line as one naming a
// shot, fired a pair at the man bracketed in your sector, a no-shoot (the sergeant on drawn seed 10 at tick 182: the review's scan
// found 7 such pairs in 60 lanes, every one under cqb-contact/his; B's F8 "41 no-shoot faults in 21 of 200 T lanes"). The fix
// (cqb.js): the 'his' line is quiet while the question stands, so the question's own line leads with its act (cqb-unplanned's or
// cqb-locked's Hold it); and the house bot's shot at an act-less line (bots/house.mjs namesShot) only where the line names a shot on
// the bracketed man (cqb-contact's press, row and aim), so a gap of the game's shows as a dead end, never as a fault.
import { assert } from './helpers.mjs';
import { flawlessLane } from './flawless.mjs';
import { namesShot } from './bots/house.mjs';
import { instinctNow } from '../src/sim/skills/instinct.js';
import { drawnCodeOf } from '../src/sim/scenes/assemble.js';

// (a lane by the honest T bot on a drawn seed, every choose pause whose leading line is cqb-contact's 'his' with no act counted)
function lane(tier, seed) {
  let hisNoAct = 0, first = null;
  const more = (game) => {
    const s = game.state, L = s.stop?.phase === 'choose' ? instinctNow(s).line : null;
    if (L?.id === 'cqb-contact' && L.variant === 'his' && !L.act) { hisNoAct++; first ??= s.clock.tick; }
  };
  const r = flawlessLane({ tier, seed, bot: 'honest', setup: 'go', fill: { draw: 'drawn' }, more });
  const dead = Object.values(r.mem?.dead ?? {}).reduce((a, b) => a + b, 0);
  return { tier, seed, r, hisNoAct, first, dead, noshoot: r.faults?.noshoot ?? 0 };
}

export default [
  {
    name: 'the sergeant on drawn seed 10 and the tier one on 62 (the closet\'s question standing over your #2\'s man): no act-less "That one\'s his", no no-shoot shot, no dead end, both to the card (the review: a pair at 1b the no-shoot at tick 182; seed 62 B\'s one F11)',
    timeoutMs: 120_000,
    fn() {
      const rows = [lane('sgt', 10), lane('tierone', 62)];
      console.log(`      ${rows.map(x => `${x.tier} ${x.seed} ${drawnCodeOf(x.seed).split('|')[0]}: ${x.r.end} ${x.r.laneS} s; act-less 'his' pauses ${x.hisNoAct}${x.first !== null ? ` (first at tick ${x.first})` : ''}, no-shoot faults ${x.noshoot}, dead ends ${x.dead}`).join(' · ')}`);
      assert(rows.every(x => x.r.done && x.hisNoAct === 0 && x.noshoot === 0 && x.dead === 0), JSON.stringify(rows.map(x => ({ tier: x.tier, seed: x.seed, end: x.r.end, his: x.hisNoAct, ns: x.noshoot, dead: x.r.mem?.dead }))));
    },
  },
  {
    name: 'the house bot shoots at a line with no act only where it names a shot on the bracketed man: cqb-contact\'s press, row and aim, never its his, move, hands or safe',
    fn() {
      const v = (variant) => namesShot({ id: 'cqb-contact', variant, act: null });
      const got = { press: v('press'), row: v('row'), aim: v('aim'), his: v('his'), move: v('move'), hands: v('hands'), safe: v('safe'), withAct: namesShot({ id: 'cqb-contact', variant: 'row', act: 'stop:aim' }), still: namesShot({ id: 'cqb-still-up', act: null }) };
      console.log(`      ${JSON.stringify(got)}`);
      assert(got.press && got.row && got.aim && !got.his && !got.move && !got.hands && !got.safe && !got.withAct && got.still, JSON.stringify(got));
    },
  },
];
