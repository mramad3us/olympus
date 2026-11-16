// OLYMPUS tests: the kit's bursts in the ears, through the combat EVA suit (WEAPONS §12.5; the build sheet 0.0.18 §5.3; src/ui/audio/blast.js), in node.
//
// WEAPONS §12.5: a stun grenade heard in a suit with its helmet sealed is "a thump and a flicker". The report is bang.js's
// recipe at the G-11's level, a charge louder by its peak's ratio, and the helmet's electronics clamp both at the gate a
// defended ear has (EARS_DB on BANG_SOURCE_DB). Fails without blast.js and the engine's routing of the house's bursts to it.
import { assert, fmt } from './helpers.mjs';
import { blastVoice, sourceDb, createBlast, SUIT_GATE_DB } from '../src/ui/audio/blast.js';
import { bangVoice } from '../src/ui/audio/bang.js';
import { otherShot } from '../src/ui/audio/gun.js';
import { AIRS } from '../src/data/places/env.js';
import { BANG_SOURCE_DB, EARS_DB } from '../src/data/sounds.js';

const AIR = AIRS['martian-indoor'], SOUND = 343;

export default [
  {
    name: 'a G-11 and the SC-1 heard through the suit\'s filters stay at or under its gate (BANG_SOURCE_DB + EARS_DB), low-passed, the SC-1 clamped there (the gate the loudest a sealed helmet passes); bare, the G-11 is louder than an R-7 shot at the same distance and the SC-1 louder still; the house\'s bursts go to blast.js, the bay\'s to bang.js',
    fn() {
      const me = { x: 0, z: 0 }, rows = [], bad = [];
      for (const dM of [1, 2.2, 4]) {
        const at = { x: dM, z: 0 };
        const g = blastVoice({ me, at, model: 'g11', suit: true, soundMs: SOUND, pKpa: AIR.pKpa }), c = blastVoice({ me, at, model: 'sc1', suit: true, soundMs: SOUND, pKpa: AIR.pKpa });
        const gBare = blastVoice({ me, at, model: 'g11', soundMs: SOUND, pKpa: AIR.pKpa }), cBare = blastVoice({ me, at, model: 'sc1', soundMs: SOUND, pKpa: AIR.pKpa });
        const shot = otherShot({ gun: 'r7', pKpa: AIR.pKpa, soundMs: SOUND, me, muzzle: at, space: 'open' });
        rows.push(`${dM} m: in the suit G-11 ${fmt(g.gainDb)} dB < ${fmt(g.lowpassHz, 0)} Hz, SC-1 ${fmt(c.gainDb)} dB (rate ${c.rate}); bare G-11 ${fmt(gBare.gainDb)}, SC-1 ${fmt(cBare.gainDb)}, an R-7 shot ${fmt(shot.gainDb)}`);
        if (g.gainDb > SUIT_GATE_DB + 1e-9 || c.gainDb > SUIT_GATE_DB + 1e-9 || c.gainDb < g.gainDb || !(gBare.gainDb > shot.gainDb) || !(cBare.gainDb > gBare.gainDb) || !g.gated) bad.push(`${dM} m`);
      }
      // (the G-11 bare is the training bang's own level: one recipe, one number)
      const same = Math.abs(blastVoice({ me, at: { x: 3, z: 0 }, model: 'g11', soundMs: SOUND, pKpa: AIR.pKpa, }).gainDb - bangVoice({ me, at: { x: 3, z: 0 }, soundMs: SOUND, pKpa: AIR.pKpa }).gainDb);
      console.log(`      the gate ${SUIT_GATE_DB} dB (${BANG_SOURCE_DB} ${EARS_DB}); the SC-1 over the G-11 at 1 m ${fmt(sourceDb('sc1', AIR.pKpa), 1)} dB; ${rows.join(' | ')}; the G-11 bare against the bay's bang at 3 m: ${fmt(same, 2)} dB apart (the floor's rolloff against the ground's)`);
      assert(!bad.length, bad.join('; '));
      // (the routing: a house state's bang and any blast are blast.js's; the bay's bang is not)
      const played = [];
      const B = createBlast({ bang: (kind, o) => { played.push({ kind, ...o }); return true; } });
      const house = { armoury: { range: { course: 'house' } }, clock: { ms: 1000 }, player: { id: 'p1' }, people: { p1: { kit: { worn: { suit: 'i1' } } } }, items: {}, places: { live: { area: 'w4' } } };
      const bay = { ...house, armoury: { range: { course: 'pairs' } } };
      const routes = [B.ours('fx', { kind: 'bang' }, house), B.ours('fx', { kind: 'blast' }, bay), B.ours('fx', { kind: 'bang' }, bay)];
      console.log(`      routed to blast.js: the house's bang ${routes[0]}, a blast ${routes[1]}, the bay's bang ${routes[2]}`);
      assert(routes[0] && routes[1] && !routes[2], JSON.stringify(routes));
    },
  },
];
