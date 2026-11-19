// OLYMPUS tests: the role-players' posts where a drawn house places them (the build sheet v0.0.22 item 15, G5; F80's clause): each live lane's two posts read through opfor.js's one seam pass the spot rule at the fill, among the lane's own stands, and each dash is a role-player's.
//
// house-cases (A's, F75) holds every chunk's post valid on its room's case with the other stands left out. Here the posts are read
// as the live lane reads them: opfor.js spotOf on a game filled with &opfor=live on a drawn house (all eight rooms drawn from, seeds
// 1 to 12, and layouts B and C), and checked by tests/opfor-world.mjs spotCheck at his start and his hide on the lane's own plan with
// the lane's cast standing (his start and hide on one side by room.js sectorOf), his dash clear for a C0 body (route.js clipped: the
// walker's circle along each leg) and run on his own legs at the place's run within DASH_MAX_MS 2 s (stepper.js profileOf, as
// opfor.js startDash plans it). The set's two posts are the corner's and the ell's placed in layout A (house-live-drawn holds that).
// It fails without the posts (no role-player on a drawn lane) and with a post whose dash is longer than his legs run in 2 s.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { spotCheck } from './opfor-world.mjs';
import { spotOf, rpStandsOf, DASH_MAX_MS, DASH_MAX_M } from '../src/sim/scenarios/opfor.js';
import { clipped } from '../src/sim/combat/route.js';
import { profileOf, pathLen } from '../src/sim/combat/stepper.js';
import { legsOf as bodyLegsOf } from '../src/sim/combat/bundle.js';
import { placeGaits } from '../src/sim/body/motion.js';

const LANES = Object.freeze([...Array.from({ length: 12 }, (_, i) => ({ seed: i + 1, rooms: 'all' })), { seed: 48213, layout: 'B' }, { seed: 48213, layout: 'C' }]);

export default [
  {
    name: 'every post of a drawn live lane passes the spot rule at the fill among the lane\'s own stands: all eight rooms drawn from on seeds 1 to 12 and layouts B and C, each man\'s start and hide on one side, his dash clear for a C0 body and under DASH_MAX_MS 2 s on his legs (fails without the posts: no role-player on a drawn lane)',
    fn() {
      const bad = [], rows = [], chunks = new Set();
      for (const o of LANES) {
        const g = createGame({ scenario: 'test-shoothouse', tier: 'sgt', opfor: 'live', ...o }), s = g.state, H = s.armoury.range.house, stands = rpStandsOf(s), men = s.armoury.range.turners.filter(T => T.live);
        if (H.draw?.mode !== 'drawn' || stands.length !== 2 || men.length !== 2) { bad.push(`${JSON.stringify(o)}: drawn ${H.draw?.mode}, stands ${stands.join()}, men ${men.length}`); continue; }
        for (const T of men) {
          const S = spotOf(s, T), a = spotCheck(s, T.stand, S.start, { spot: S }), b = spotCheck(s, T.stand, S.hide, { spot: S, slot0: a.slot });
          let dashCut = 0;
          for (let i = 1; i < S.dash.length; i++) { const c = clipped(s, S.dash[i - 1], S.dash[i]); if (Math.hypot(c[0] - S.dash[i][0], c[1] - S.dash[i][1]) > 1e-3) dashCut++; }
          const pid = T.live.who, legs = bodyLegsOf(s, pid, T.x, T.z), len = pathLen(S.dash), ms = Math.round(profileOf(len, placeGaits(s).runMs, legs.pushMs2, legs.brakeMs2, { v0: 0, v1: 0 }).T * 1000);
          chunks.add(`${H.draw.code.split('|')[0].split('.')[Number(T.stand[0]) - 1][0]}`);
          const ok = a.ok && b.ok && !dashCut && ms <= DASH_MAX_MS && len <= DASH_MAX_M;
          rows.push(`${H.draw.code.split('|')[0]} ${T.stand}: start ${S.start.join(', ')} ${a.ok ? 'valid' : `NOT (${a.why.join(', ')})`}, hide ${b.ok ? 'valid' : `NOT (${b.why.join(', ')})`}, side ${a.slot}; ways ${fmt(a.way, 2)} and ${fmt(b.way, 2)} m; dash ${fmt(len, 2)} m in ${ms} ms${dashCut ? `, ${dashCut} legs cut` : ''}`);
          if (!ok) bad.push(rows.at(-1));
        }
      }
      for (const r of rows) console.log(`      ${r}`);
      console.log(`      ${rows.length} posts on ${LANES.length} lanes, the chunks in rooms 2 and 3: ${[...chunks].sort().join(', ')}; ${bad.length} off`);
      assert(!bad.length && rows.length === 2 * LANES.length, bad.join(' | '));
    },
  },
];
