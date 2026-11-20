// OLYMPUS tests: collar-look, a man in a real fight seen, never told (the build sheet v0.0.27 item 16, §3.5, §6 E; F168's sim half).
//
// "Away the boarding party" draws what a defender does from one map: men.js liveStateOf names his state, look.js gunLook turns it
// into the action frame the stage draws (LIVE_FRAMES; downFreeOf for a man down where the place's gravity is under FREE_G_MS2),
// seen.js frameOfSeen into the card's frame and data/portrait.js FRAME_SEEN into its pose and hold, and ui/plaque.js STATE_WORDS into
// the plaque's word. These tests hold the six states the boarding adds or carries aboard (FIRING BLIND, RUNNING AWAY, DAZED,
// COWERING, HANDS UP, DOWN at 0 G) to that map on tests/boarding-world.mjs (the hauler at 0 G, two pirates on their boots): each
// state written on the man's record as the brain writes it, then the stage's frame (poses.js rifleFrame of gunLook, as view.js draws
// a man standing still), the card's pose and the plaque's word read off the game and checked against one table; a marine down at
// 0 G (his body's stance) drawn the same way and at 1 G not; the P-12 alone drawn with no R-7 (gunLook's sidearmOnly, poses.js
// poseOf: no rifle hung, a pistol where a rifle was in the hands), the smugglers as A's fill arms them and the hauler's crew cowering
// unarmed on their knees, their empty hands up (tests/boarding-men.mjs, A's); and the boarding's dust and the lock panel's lamp (look.js
// boardLook, render/board-fx.js boardFxPixels). Quick. Fails with any of the three readers off the map, or the 0 G down drawn sitting.
import { assert } from './helpers.mjs';
import { boardingWorld } from './boarding-world.mjs';
import { boardingMen } from './boarding-men.mjs';
import { createGame } from './game.mjs';
import { gunLook, boardLook, downFreeOf, LIVE_FRAMES, DUST_PUFF_MS } from '../src/sim/arms/look.js';
import { liveStateOf } from '../src/sim/combat/men.js';
import { frameOfSeen } from '../src/sim/people/seen.js';
import { FRAME_SEEN } from '../src/data/portrait.js';
import { STATE_WORDS } from '../src/ui/plaque.js';
import { rifleFrame, shockFrameOf, SIDEARM } from '../src/art/figures/poses.js';
import { composeFrame } from '../src/art/figures/compose.js';
import { wear } from '../src/art/figures/outfits.js';
import { boardFxPixels, BOARD_FX_C } from '../src/render/board-fx.js';
import { gravityAt } from '../src/sim/places/env.js';
import { FREE_G_MS2 } from '../src/sim/arms/throw.js';

/** The map (see the header): the man's record → the stage's frame, the card's pose and the plaque's word. A frame null: no frame of the shock's (his run, his carry's own). */
const MAP = Object.freeze({
  'firing-blind': Object.freeze({ st: 'blind', frame: 'blind', pose: 'blind', word: 'FIRING BLIND' }),
  'running-away': Object.freeze({ st: 'flee', frame: null, pose: 'stand', seen: 'run', word: 'RUNNING AWAY' }),
  dazed: Object.freeze({ st: 'aim', shocked: true, frame: 'daze0', pose: 'daze', word: 'DAZED' }),
  cowering: Object.freeze({ st: 'freeze', frame: 'cower', pose: 'cower', word: 'COWERING' }),
  hands: Object.freeze({ st: 'hands', frame: null, pose: 'stand', seen: 'hands', word: 'HANDS UP' }),
  down: Object.freeze({ st: 'down', frame: 'downFree', pose: 'downFree', word: 'DOWN' }),
});
const actorOf = (s, pid) => s.actors.list.find(a => a.who === pid);
// (a man's record as the brain writes the state: his st, and for the daze a stun on his combat block)
function write(s, T, row) {
  const L = T.live, a = actorOf(s, L.who), now = s.clock.ms;
  L.st = row.st; L.fromMs = now; L.give = row.st === 'hands' ? { atMs: now } : null; L.move = null;
  // (the daze: a stun on his combat block, supp.js blockOf's, as a bang writes it)
  delete a.combat;
  if (row.shocked) a.combat = { stunUntilMs: now + 5000 };
  if (row.st === 'hands') { a.hands = true; } else delete a.hands;
  return a;
}

export default [
  {
    name: 'F168 (sim): FIRING BLIND, RUNNING AWAY, DAZED, COWERING, HANDS UP and DOWN at 0 G aboard the Patient Mule: the stage\'s frame (gunLook\'s action, rifleFrame), the card\'s pose (frameOfSeen, FRAME_SEEN) and the plaque\'s word (STATE_WORDS) are one map, the 0 G down never the seat',
    fn() {
      const w = boardingWorld({ men: 1 }), s = w.s, T = w.men[0].T, rows = [], off = [];
      const g0 = gravityAt(s, null, actorOf(s, T.live.who).x, actorOf(s, T.live.who).z).gMs2;
      assert(g0 < FREE_G_MS2, `the hauler at ${g0} m/s²`);
      for (const [ls, row] of Object.entries(MAP)) {
        const a = write(s, T, row), got = liveStateOf(s, T, s.clock.ms);
        const gl = gunLook(s, a, s.clock.ms), stage = gl ? (shockFrameOf(gl) ? rifleFrame(gl, { face: a.face, x: a.x, z: a.z, ms: s.clock.ms }).frame : null) : null;
        const man = { st: T.live.st }, seen = frameOfSeen(a, row.st === 'hands' ? null : gl, man), pose = FRAME_SEEN[seen]?.pose ?? (a.stance === 'kneel' ? 'kneel' : 'stand'), word = STATE_WORDS[got];
        rows.push(`${ls}: state ${got}, stage ${stage ?? '(his own)'}, card ${seen}/${pose}, plaque ${word}`);
        if (got !== ls || stage !== row.frame || pose !== row.pose || (row.seen && seen !== row.seen) || word !== row.word) off.push({ ls, got, stage, seen, pose, word, want: row });
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(!off.length, JSON.stringify(off));
      assert(LIVE_FRAMES['firing-blind'] === 'blind' && LIVE_FRAMES.dazed === 'daze' && LIVE_FRAMES.cowering === 'cower', JSON.stringify(LIVE_FRAMES));
    },
  },
  {
    name: 'a marine down at 0 G (his body\'s stance, woundsFast\'s) is drawn hanging from his boots (gunLook\'s downFree, the card\'s downFree) and at 1 G as before (no action of the shock\'s): the place\'s gravity decides, never a scene\'s flag',
    fn() {
      const w = boardingWorld({ men: 1 }), s = w.s, me = w.me();
      me.stance = 'down';
      const gl = gunLook(s, me, s.clock.ms), seen = frameOfSeen(me, gl, null);
      const gMs2 = gravityAt(s, null, me.x, me.z).gMs2;
      // (a marine where the place's gravity is 1 G: the house's live lane at the Wheel)
      const s1 = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'go', opfor: 'live' }).state;
      const me1 = actorOf(s1, s1.player.id); me1.stance = 'down';
      const g1 = gravityAt(s1, null, me1.x, me1.z).gMs2, gl1 = gunLook(s1, me1, s1.clock.ms);
      console.log(`      at ${gMs2} m/s²: the action ${gl?.action?.frame}, the card ${seen}; at ${g1} m/s²: the action ${gl1?.action?.frame ?? 'none'}, downFreeOf ${downFreeOf(s1, me1)}`);
      assert(gl?.action?.frame === 'downFree' && seen === 'downFree' && downFreeOf(s, me), JSON.stringify({ gl: gl?.action, seen }));
      assert(g1 >= FREE_G_MS2 && gl1?.action?.frame !== 'downFree' && !downFreeOf(s1, me1), JSON.stringify({ g1, gl1: gl1?.action }));
    },
  },
  {
    name: 'the P-12 alone is drawn as the P-12: gunLook names the man sidearmOnly with the pistol\'s posture for his carry, and the stage composes no R-7 on him (its look\'s weapon SIDEARM: no rifle hung under the pistol\'s arms, a pistol where a rifle frame puts one in the hands, nothing where it hangs)',
    fn() {
      const look = (weapon) => wear({ outfit: 'beltCoverall', seed: 3, skin: 'tan', hair: { style: 'medium', color: 'dark' }, weapon, carry: 'low', model: weapon === SIDEARM ? 'p12' : 'r7' });
      // (the guns' letters, n u v, over the frame toward you and side on)
      const cells = (L, f) => { let n = 0; for (const dir of ['down', 'right']) { const fr = composeFrame(L, dir, f, { ppm: 16 }); for (const row of fr.cells) for (const c of row ?? []) if (c && 'nuv'.includes(c.ch)) n++; } return n; };
      const rows = [];
      for (const f of ['pistolLow', 'kneelLow', 'blind', 'downFree', 'cower', 'idle0']) {
        const p = cells(look(SIDEARM), f), r = cells(look('rifle'), f);
        rows.push(`${f} ${p} gun cells with the P-12 alone, ${r} with the R-7`);
        // (fewer: the P-12 is smaller than the R-7 where it is in the hands, and nothing where the rifle would hang; in the hands, some)
        assert(p < r && (['downFree', 'cower'].includes(f) ? p === 0 : p > 0), rows.at(-1));
      }
      for (const r of rows) console.log(`      ${r}`);
      // (and the world's men: a rifleman is never sidearmOnly, his P-12 out or not)
      const w = boardingWorld({ men: 1 }), s = w.s, gl = gunLook(s, actorOf(s, w.men[0].T.live.who), s.clock.ms);
      console.log(`      the world's rifleman: gunLook ${gl?.model}, sidearmOnly ${!!gl?.sidearmOnly}, carry ${gl?.carry}`);
      assert(gl && !gl.sidearmOnly, JSON.stringify(gl));
    },
  },
  {
    name: 'the smugglers\' P-12s and the hauler\'s crew as A\'s fill makes them (tests/boarding-men.mjs, the seed\'s smugglers): every armed man sidearmOnly at the pistol\'s posture, no rifle on him; every crewman unarmed on his knee, his card the kneel with his empty hands up and his word COWERING (the stage\'s handsKneel, view.js), one map',
    fn() {
      const w = boardingMen({ holdouts: 'smugglers' }), s = w.s, rows = [], off = [];
      for (const T of w.R.turners.filter(t => t.live?.who)) {
        // (his men record as look.js withLive writes it: his st, his rifle in his hands or none)
        const a = actorOf(s, T.live.who), gl = gunLook(s, a, s.clock.ms), ls = liveStateOf(s, T, s.clock.ms), seen = frameOfSeen(a, gl, { st: T.live.st, rifle: gl ? 'hands' : 'none' }), F = FRAME_SEEN[seen] ?? {};
        rows.push(`${T.stand}: ${T.live.unarmed ? 'crew' : 'armed'}, gun ${gl ? `${gl.model}${gl.sidearmOnly ? ' alone' : ''} at ${gl.carry}` : 'none'}, state ${ls}, card ${seen} ${F.pose ?? ''}/${F.how ?? ''}, plaque ${STATE_WORDS[ls]}`);
        if (T.live.unarmed ? gl || seen !== 'kneel' || F.how !== 'up' || STATE_WORDS[ls] !== 'COWERING' || a.stance !== 'kneel' : !gl?.sidearmOnly || !['low', 'high', 'aim'].includes(gl.carry)) off.push(rows.at(-1));
      }
      for (const r of rows) console.log(`      ${r}`);
      assert(rows.length >= 3 && rows.some(r => r.includes('crew')) && !off.length, JSON.stringify(off));
    },
  },
  {
    name: 'the boarding\'s look: a round\'s puff on the face it met for DUST_PUFF_MS (the frangible\'s dust, the ball\'s grit), none after, no hole drawn; the lock panel\'s lamp amber while the inner hatch is dogged, red while the override is locked out, green once undogged',
    fn() {
      const w = boardingWorld({ men: 1 }), s = w.s, B = s.armoury.range.house.boarding, now = s.clock.ms;
      // (holes.js missFace's records, as it writes them: the face's kind, its point, the round's kind there)
      B.holes.push({ shotId: 's1', side: 'ours', face: 'hull', kind: 'dust', x: 9.5, y: 1.3, z: 0.05, atMs: now - 50 }, { shotId: 's2', side: 'theirs', face: 'cabin', kind: 'hole', x: 7.0, y: 1.0, z: 2.0, atMs: now - 150 },
        { shotId: 's3', side: 'ours', face: 'bulkhead', kind: 'dust', x: 5, y: 1, z: 4, atMs: now - DUST_PUFF_MS });
      const bl = boardLook(s, now), px = boardFxPixels(bl, now);
      const dustPx = px.filter(p => p.c === BOARD_FX_C.dust).length, holePx = px.filter(p => p.c === BOARD_FX_C.hole).length, lamp = px.filter(p => p.light);
      console.log(`      ${bl.dust.length} puffs of 3 holes (one ${DUST_PUFF_MS} ms old: gone), ${dustPx} dust pixels, ${holePx} grit; the panel ${bl.panel?.lit} (${lamp.length} lit pixels)`);
      assert(bl.dust.length === 2 && dustPx === 5 && holePx === 9 && lamp.length === 2 && bl.panel?.lit === 'amber', JSON.stringify({ bl, dustPx, holePx }));
      B.collar = { lockedOutUntilMs: now + 60_000 };
      assert(boardLook(s, now).panel.lit === 'red', 'locked out');
      // (the dogs off: the inner hatch's lock broken, as op.js breakOpening writes it on the range's lane: houseRec's broken)
      B.collar = null;
      (s.armoury.range.house.broken ??= {})['o:mu:d2:lock'] = now;
      const lit = boardLook(s, now).panel.lit;
      console.log(`      locked out: red; undogged: ${lit}`);
      assert(lit === 'green', lit);
    },
  },
];
