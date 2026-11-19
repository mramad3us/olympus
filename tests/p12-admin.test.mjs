// OLYMPUS tests: the P-12's tower admin drawn in the hands (v0.0.24, carried from v0.0.23: its lead call 5).
//
// On the tower MAKE READY's P-12 share ('pistol:ready') and SHOW CLEAR's ('pistol:clear') are one timed sub-step each (sidearm.js
// adminRun: the draw and the holster are its own parts, unrolled; the pistol never leaves its holster in the state), yours on the
// stepper and your number two's on his admin's list. To v0.0.23 the stage drew the rifle through them: the P-12's admin stance (PS-e)
// was never seen in play (v0.0.23 A's handoff: 797 ticks with the pistol in the hands over the pinned lanes, none of them the admin).
// Now look.js gunLook draws the P-12 in the hands through the sub-step (ADMIN_FRAMES), at the low ready as adminRun holds it, by its
// parts in turn: the hand at the holster (pistolHolster), the rack or the clearing (pistolCheck, the magazine pistolMag), the holster;
// the record (seen.js) reads the same, so the doll and the card show it; the state is untouched (the pistol in its holster on every
// tick, the lane held to its pin). Played on the tier one's honest lane on 48213 (house-pin's quick cell). Fails without ADMIN_FRAMES:
// gunLook gives no pistol on those ticks and the stage draws the rifle. Prints the ticks and frames for you and your #2.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { runHouse } from './bots/house.mjs';
import { botOf } from './flawless.mjs';
import { goldenDigest } from './golden.mjs';
import { PIN } from './house-pin.test.mjs';
import { gunLook } from '../src/sim/arms/look.js';
import { stepNow } from '../src/sim/arms/shooting.js';
import { handsOf } from '../src/sim/combat/two.js';
import { handGunOf } from '../src/sim/arms/kit.js';
import { seenOf } from '../src/sim/people/seen.js';
import { rifleFrame } from '../src/art/figures/poses.js';
import { runSheetOf } from '../src/sim/scenarios/shoothouse.js';

export default [
  {
    name: 'the P-12\'s tower admin is drawn in the hands (v0.0.23\'s lead call 5): on every tick of MAKE READY\'s and SHOW CLEAR\'s P-12 share, yours and your #2\'s, the stage draws the pistol (the hand at the holster, the rack or clearing, the magazine), the record reads pistol-ready with its act, the pistol stays in its holster in the state, and the lane holds its pin',
    timeoutMs: 120_000,
    fn() {
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'tierone' });
      const tally = {}, bad = [];
      const row = (who, sub) => (tally[`${who} ${sub}`] ??= { ticks: 0, drawn: 0, read: 0, holstered: 0, frames: {}, acts: {} });
      runHouse(g, botOf('honest', { seed: 48213 }), {
        each: (gm) => {
          const s = gm.state, ms = s.clock.ms, two = s.armoury?.range?.house?.two?.pid ?? null;
          for (const a of s.actors.list) {
            const mine = a.who === s.player.id;
            if (!mine && a.who !== two) continue;
            const sub = (mine ? stepNow(s, a.who, ms) : handsOf(s, a.who, ms))?.action ?? null;
            if (sub !== 'pistol:ready' && sub !== 'pistol:clear') continue;
            const r = row(mine ? 'you' : 'your #2', sub), gl = gunLook(s, a, ms), fr = rifleFrame(gl, { face: a.face, x: a.x, z: a.z, ms }).frame, rec = seenOf(s, a.who, { ms, fresh: true, keep: false });
            r.ticks++;
            r.frames[fr] = (r.frames[fr] ?? 0) + 1;
            if (gl?.pistol?.model === 'p12' && gl.pistol.posture === 'lowReady' && gl.carry === 'front' && /^pistol(Holster|Check|Mag)$/.test(fr ?? '')) r.drawn++;
            if (rec?.hold?.how === 'pistol-ready') { r.read++; r.acts[rec.hold.act] = (r.acts[rec.hold.act] ?? 0) + 1; }
            const k = s.people[a.who].kit;
            if (k.worn?.holster && s.items[k.worn.holster]?.model === 'p12' && s.items[handGunOf(s, a.who)]?.model !== 'p12') r.holstered++;
            else if (bad.length < 4) bad.push({ ms, who: a.who, sub, holster: k.worn?.holster ?? null });
          }
        },
      });
      const s = g.state, got = [s.clock.tick, goldenDigest(runSheetOf(s)), g.digest()], want = PIN['honest/tierone/48213/standard'];
      for (const [k, r] of Object.entries(tally)) console.log(`      ${k}: ${r.ticks} ticks, ${r.drawn} drawn with the P-12 (${Object.entries(r.frames).map(([f, n]) => `${f} ${n}`).join(', ')}), ${r.read} read pistol-ready (acts ${Object.entries(r.acts).map(([a, n]) => `${a} ${n}`).join(', ')}), ${r.holstered} with it holstered in the state`);
      console.log(`      the lane: tick ${got[0]}, ${want && got.every((v, i) => v === want[i]) ? 'its pin held' : `PIN MOVED ${JSON.stringify({ want, got })}`}`);
      const need = ['you pistol:ready', 'you pistol:clear', 'your #2 pistol:ready', 'your #2 pistol:clear'];
      const rows = need.map(k => tally[k]);
      const frames = (k) => Object.keys(tally[k]?.frames ?? {});
      assert(rows.every(r => r && r.ticks > 0 && r.drawn === r.ticks && r.read === r.ticks && r.holstered === r.ticks) && !bad.length
        && need.every(k => frames(k).includes('pistolHolster') && frames(k).includes('pistolCheck')) && frames('you pistol:clear').includes('pistolMag')
        && want && got.every((v, i) => v === want[i]), JSON.stringify({ tally, bad, got, want }));
    },
  },
];
