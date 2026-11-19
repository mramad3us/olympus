// OLYMPUS tests: the portraits round's look sets (the build sheet v0.0.23 §1 item 8, §6 E: samples-portrait), made before the
// art that draws their picks, so the user's scores land first.
//
// For each set: its sample.json's groups and views as the gallery expands them (tools/gallery.mjs expand), every view with a
// whole-pixel size; its "open" (default, since, decides, builtIn), the default naming views of the set; each view shot in
// samples/index.json at its own size (the gallery's whole-pixel check passed), the shot on disk; and the picture, drawn in node
// where it needs no browser (one view a group: the default's or the first), at the size sample.json says. The pictures that
// need a browser (house-unknown decodes the game's own frames, truth-cards draws the plan on a canvas) are held to their
// modules' SIZE. E1's sets (portrait-gun, portrait-light, portrait-suit, truth-cards, house-unknown, pistol-stances' T) and E2's,
// drawn on the portraits round's pose engine (portrait-pose, portrait-facing, pistol-stances' PS and RH): for E2's, also the
// candidates' data as C lifts it into the game (samples/portrait-pose/poses.js and portrait-facing/views.js: every candidate a
// view of its set, its record's hold, pose and facing names src/data/portrait.js's, each stance's frame the figure's pistol band's,
// each hang worn.js's), and the card a bent candidate is composed on (portrait-lib/posed.js manCardOf) the game's card pixel for
// pixel where the game can paint the record. Each case fails without its set.
import { readFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { PNG } from './png-read.mjs';
import { root } from './helpers.mjs';
import { HOLD_HOWS, POSES, FACINGS } from '../src/data/portrait.js';
import path from 'node:path';
import { assert } from './helpers.mjs';
import { nativeOf } from '../tools/gallery.mjs';
import { SAMPLES, checkSet, drawn, onePerGroup } from './samples-check.mjs';

export default [
  {
    name: 'portrait-gun: G, W and H shot whole, G1, W1 and H1 the defaults (this round), the gun read on the default\'s cards and lost on today\'s (the note of 2026-11-17)',
    async fn() {
      const { s, groups } = checkSet('portrait-gun', { groups: ['G', 'W', 'H'], views: 7, open: ['G1', 'W1', 'H1'], builtIn: 'v0.0.23' });
      const { GUN_PX_MIN, GUN_IN_CROP_K } = await import(path.join(SAMPLES, 'portrait-lib/card.js'));
      for (const v of onePerGroup(groups, s)) {
        const P = await drawn('portrait-gun/gun.js', v), cards = P.report.cards ?? [];
        if (v.id !== 'G1') continue;
        const now = cards.filter(c => !c.today), today = cards.filter(c => c.today);
        assert(now.length >= 12 && now.every(c => c.gunPx >= GUN_PX_MIN && c.inK >= GUN_IN_CROP_K), JSON.stringify(now.filter(c => !(c.gunPx >= GUN_PX_MIN && c.inK >= GUN_IN_CROP_K))));
        assert(today.length > 0 && today.every(c => c.gunPx === 0), JSON.stringify(today));
        console.log(`      G1: ${now.length} cards, gun px ${Math.min(...now.map(c => c.gunPx))} to ${Math.max(...now.map(c => c.gunPx))} (at least ${GUN_PX_MIN}), inside ${Math.min(...now.map(c => c.inK)).toFixed(2)} (at least ${GUN_IN_CROP_K}); today's ${today.length} cards: ${today.map(c => c.gunPx).join(', ')} px in a tone of its own, the rifle ${today.map(c => c.inK.toFixed(2)).join(', ')} inside`);
      }
    },
  },
  {
    name: 'portrait-light: L, J and V shot whole, L1, J1 and V1 the defaults (V this round, L and J drawn in v0.0.24)',
    async fn() {
      const { s, groups } = checkSet('portrait-light', { groups: ['L', 'J', 'V'], views: 6, open: ['L1', 'J1', 'V1'], builtIn: 'v0.0.23' });
      for (const v of onePerGroup(groups, s)) await drawn('portrait-light/light.js', v);
    },
  },
  {
    name: 'portrait-suit: D-a to D-c shot whole, D-a the default (v0.0.24)',
    async fn() {
      const { s, groups } = checkSet('portrait-suit', { groups: ['D'], views: 3, open: ['D-a'], builtIn: 'v0.0.24' });
      for (const v of onePerGroup(groups, s)) await drawn('portrait-suit/suit.js', v);
    },
  },
  {
    name: 'truth-cards: T-a to T-c shot whole at their layouts\' sizes, T-a the default (v0.0.24)',
    async fn() {
      const { views } = checkSet('truth-cards', { groups: ['T'], views: 3, open: ['T-a'], builtIn: 'v0.0.24' });
      const { SIZE } = await import(path.join(SAMPLES, 'truth-cards/truth.js'));
      for (const v of views) assert(JSON.stringify(SIZE[v.id]) === JSON.stringify(nativeOf(v.pixel)), JSON.stringify({ view: v.id, size: SIZE[v.id], pixel: v.pixel }));
      const lane = JSON.parse(readFileSync(path.join(SAMPLES, 'truth-cards/lane.json'), 'utf8'));
      assert(lane.debrief && Number.isFinite(lane.debrief.goAtMs), 'lane.json holds no debrief');
    },
  },
  {
    name: 'house-unknown: U1 to U3 shot whole, U1 the default (this round), black (the build sheet\'s UNKNOWN_C), the game\'s two frames beside it; U1 the game\'s own picture pixel for pixel and every look over exactly the pixels the game hides (the review of 2026-11-18: E1\'s own mask drew the catwalk, the booth and the hall\'s north wall black where the game draws them)',
    async fn() {
      const { views } = checkSet('house-unknown', { groups: ['U'], views: 3, open: ['U1'], builtIn: 'v0.0.23' });
      const U = await import(path.join(SAMPLES, 'house-unknown/unknown.js')), { SIZE, UNKNOWN_C, LOOKS } = U;
      const B = await import('../src/render/known.js');
      for (const v of views) assert(JSON.stringify(SIZE) === JSON.stringify(nativeOf(v.pixel)), JSON.stringify({ view: v.id, size: SIZE, pixel: v.pixel }));
      assert(UNKNOWN_C === 0x000000 && UNKNOWN_C === B.UNKNOWN_C && JSON.stringify(LOOKS) === JSON.stringify(views.map(v => v.id).sort()), JSON.stringify({ UNKNOWN_C, game: B.UNKNOWN_C, LOOKS }));
      const files = ['go.png', 'go-u1.png', 'room1.png', 'room1-u1.png', 'scene.json'];
      for (const f of files) assert(existsSync(path.join(SAMPLES, 'house-unknown', f)), `house-unknown/${f} missing (node samples/house-unknown/capture.mjs)`);
      // (the game's pictures, decoded; U1's right-hand side is the game's own, and U2 and U3 change exactly the pixels the game hides)
      const dec = (f) => { const p = PNG.read(readFileSync(path.join(SAMPLES, 'house-unknown', f))), px = new Int32Array(p.w * p.h); for (let i = 0; i < px.length; i++) px[i] = (p.data[i * 4] << 16) | (p.data[i * 4 + 1] << 8) | p.data[i * 4 + 2]; return { w: p.w, h: p.h, px }; };
      const imgs = { go: dec('go.png'), goU1: dec('go-u1.png'), room1: dec('room1.png'), room1U1: dec('room1-u1.png') };
      const scene = JSON.parse(readFileSync(path.join(SAMPLES, 'house-unknown', 'scene.json'), 'utf8')), rows = [];
      for (const [name, gameName] of U.MOMENTS) {
        const m = scene.moments[name], today = imgs[name], game = imgs[gameName], H = U.unknownOf(today, game);
        const u1 = U.overlay(today, game, m, 'U1', H), diff = (P) => P.col.reduce((n, c, i) => n + ((c & 0xffffff) !== (game.px[i] & 0xffffff) ? 1 : 0), 0);
        const u2 = U.overlay(today, game, m, 'U2', H), u3 = U.overlay(today, game, m, 'U3', H);
        const off2 = u2.col.reduce((n, c, i) => n + ((c & 0xffffff) !== (game.px[i] & 0xffffff) && !H.unknown[i] ? 1 : 0), 0), off3 = u3.col.reduce((n, c, i) => n + ((c & 0xffffff) !== (game.px[i] & 0xffffff) && !H.unknown[i] ? 1 : 0), 0);
        rows.push(`${name}: the game hides ${H.n} px (known cells ${m.fogKnown?.cells} of ${m.fogKnown?.of}), today's and the game's differ elsewhere in ${H.other}; U1 ${diff(u1)} px off the game's, U2 ${off2} and U3 ${off3} outside what it hides`);
        assert(m.fogKnown?.cells > 0 && H.n > 0 && H.other === 0 && diff(u1) === 0 && off2 === 0 && off3 === 0, rows.at(-1));
      }
      // (and the picture drawn in node places U1's look beside today's: its right-hand half at GO is the game's frame)
      const P = U.picture('U1', scene, imgs), [W] = SIZE, x0 = 4 + 640 + 4, y0 = 4 + 10;
      let off = 0;
      for (let y = 0; y < 360; y++) for (let x = 0; x < 640; x++) if ((P.col[(y0 + y) * W + x0 + x] & 0xffffff) !== (imgs.goU1.px[y * 640 + x] & 0xffffff)) off++;
      rows.push(`the picture's U1 at GO ${off} px off the game's frame`);
      console.log(`      ${rows.join('; ')}`);
      assert(off === 0, rows.at(-1));
    },
  },
  {
    name: 'pistol-stances: T (today, not scored), PS-a to PS-e (drawn this round) and RH1 to RH3 (RH1 the default) shot whole; each stance on the figure\'s pistol band, each hang worn.js\'s (the note of 2026-11-17)',
    async fn() {
      const { s, groups, views } = checkSet('pistol-stances', { groups: ['T', 'PS', 'RH'], views: 9, open: ['PS-a', 'PS-b', 'PS-c', 'PS-d', 'PS-e', 'RH1'], builtIn: 'v0.0.23' });
      const { SIZE, TODAY_ROWS, WITH, HANG_OF } = await import(path.join(SAMPLES, 'pistol-stances/stances.js'));
      const T = views.find(v => v.id === 'T');
      assert(JSON.stringify(SIZE.today) === JSON.stringify(nativeOf(T.pixel)), JSON.stringify({ size: SIZE.today, pixel: T.pixel }));
      const today = JSON.parse(readFileSync(path.join(SAMPLES, 'pistol-stances/today.json'), 'utf8'));
      // (what capture.mjs recorded: the view asked for the pistol's frame while the rifle hangs in front)
      assert(today.posture === 'lowReady' && today.arms?.carry === 'front' && today.arms?.frame === 'draw', JSON.stringify(today.arms));
      const { PISTOL_STANCES, RIFLE_HANGS } = await import(path.join(SAMPLES, 'portrait-pose/poses.js'));
      const { PISTOL_FRAMES } = await import('../src/art/figures/poses.js');
      const { PISTOL_HANGS } = await import('../src/art/doll/worn.js');
      for (const c of PISTOL_STANCES) assert(PISTOL_FRAMES.includes(c.frame) && (WITH[c.id] ?? []).every(f => PISTOL_FRAMES.includes(f)) && views.some(v => v.id === c.id), JSON.stringify({ id: c.id, frame: c.frame, with: WITH[c.id] }));
      for (const h of RIFLE_HANGS) assert(PISTOL_HANGS[h.hang] && ['front', 'hip', 'back'].includes(HANG_OF[h.id]) && views.some(v => v.id === h.id), JSON.stringify({ id: h.id, hang: h.hang, stage: HANG_OF[h.id] }));
      const lines = [];
      for (const v of [...onePerGroup(groups.filter(g => g.id !== 'T'), s), views.find(x => x.id === 'PS-c')]) {
        const P = await drawn('pistol-stances/stances.js', v), mine = P.report.frames.filter(f => !f.today);
        assert(mine.length >= 4 && mine.every(f => f.px > 0), JSON.stringify(P.report.frames));
        // (v0.0.23's integration: every frame WITH names for a stance is drawn, none cut at the picture's edge (PS-a's fourth walk key was))
        const stance = PISTOL_STANCES.find(c => c.id === v.id);
        if (stance) assert((WITH[v.id] ?? []).every(f => mine.some(m => m.frame === f)), JSON.stringify({ id: v.id, with: WITH[v.id], drawn: mine.map(m => m.frame) }));
        lines.push(`${v.id} ${mine.length} figure frames (${[...new Set(mine.map(f => f.frame))].join(', ')})`);
      }
      console.log(`      today: the view asked for '${today.arms.frame}' with the carry '${today.arms.carry}', the posture ${today.posture}; rows ${TODAY_ROWS.length}; ${lines.join('; ')}`);
      // (PS-e, the admin, is seen when you work the P-12 in your own hands: from v0.0.17's save with it drawn, a press check, a reload
      // and a rack draw PS-e's frame and WITH's on the stage and read the act on the record; the tower's LOAD and SHOW CLEAR run it as
      // a beat with the pistol holstered (A's finding), so the sample says so rather than offer PS-e as seen there: the review of 2026-11-18)
      const { createGame } = await import('./game.mjs'), { chooseStep } = await import('../src/sim/arms/shooting.js');
      const { gunLook } = await import('../src/sim/arms/look.js'), { rifleFrame } = await import('../src/art/figures/poses.js'), { seenOf } = await import('../src/sim/people/seen.js');
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213 }), st = g.load(gunzipSync(readFileSync(path.join(root, 'tests', 'saves', 'v0.0.17-house-pistol.json.gz'))).toString('utf8')), pid = st.player.id, me = st.actors.list.find(a => a.who === pid);
      const seenE = {};
      for (const step of ['pressCheck', 'magOut:pouch', 'charge']) {
        assert(chooseStep(st, g.bus, { step }).ok, `${step} offered with the P-12 in the hands`);
        for (let i = 0; i < 600 && (i === 0 || st.stop.phase !== 'choose'); i++) {
          g.step(1);
          const k = `${rifleFrame(gunLook(st, me), { face: me.face, x: me.x, z: me.z, ms: st.clock.ms }).frame}/${seenOf(st, pid).hold.act ?? '-'}`;
          seenE[k] = (seenE[k] ?? 0) + 1;
        }
      }
      const E = PISTOL_STANCES.find(c => c.id === 'PS-e'), psE = views.find(v => v.id === 'PS-e');
      console.log(`      PS-e in play (the save, your press check, reload and rack): ${Object.entries(seenE).map(([k, n]) => `${k} ${n}`).join(', ')}; its name "${psE.name}"`);
      assert(seenE[`${E.frame}/check`] > 0 && WITH['PS-e'].every(f => Object.keys(seenE).some(k => k.startsWith(`${f}/reload`))) && seenE[`${E.frame}/clear`] > 0, JSON.stringify(seenE));
      assert(/in your hands/.test(psE.name) && /LOAD and SHOW CLEAR/.test(psE.name) && /holster/.test(psE.name) && /LOAD and SHOW CLEAR, which the drill runs this round as one beat with the pistol in its holster/.test(s.about), JSON.stringify({ name: psE.name }));
    },
  },
  {
    name: 'portrait-pose: A, P, K, D, C and Y shot whole, A1, P1, K1, D1, C1 and Y-p the defaults (this round); C\'s candidates each a view, their records named in src/data/portrait.js',
    async fn() {
      const { s, groups, views } = checkSet('portrait-pose', { groups: ['A', 'P', 'K', 'D', 'C', 'Y'], views: 12, open: ['A1', 'P1', 'K1', 'D1', 'C1', 'Y-p'], builtIn: 'v0.0.23' });
      const { GROUPS } = await import(path.join(SAMPLES, 'portrait-pose/poses.js'));
      const ids = ['A', 'P', 'K', 'D', 'C', 'Y'].flatMap(g => GROUPS[g].map(c => c.id));
      assert(JSON.stringify(ids.slice().sort()) === JSON.stringify(views.map(v => v.id).sort()), JSON.stringify({ table: ids, views: views.map(v => v.id) }));
      for (const g of ['A', 'P', 'K', 'D', 'C', 'Y']) for (const c of GROUPS[g]) {
        assert(HOLD_HOWS.includes(c.rec.hold.how) && POSES.includes(c.rec.pose ?? 'stand'), JSON.stringify({ id: c.id, rec: c.rec }));
        assert(g === 'Y' || groups.find(x => x.id === g).views[0].id === GROUPS[g][0].id, `${g}: the table's first is not the set's first (the default)`);
      }
      const lines = [];
      for (const v of onePerGroup(groups, s)) { const P = await drawn('portrait-pose/pose.js', v); lines.push(`${v.id} ${P.report.cards.length} cards, ${P.report.stage.length} stage frames`); }
      console.log(`      ${lines.join('; ')}`);
    },
  },
  {
    name: 'portrait-facing: F and R shot whole, F1, F3 and R1 the defaults (this round); C\'s candidates each a view, their facings src/data/portrait.js\'s or the profile candidate',
    async fn() {
      const { s, groups, views } = checkSet('portrait-facing', { groups: ['F', 'R'], views: 6, open: ['F1', 'F3', 'R1'], builtIn: 'v0.0.23' });
      const { GROUPS } = await import(path.join(SAMPLES, 'portrait-facing/views.js'));
      assert(JSON.stringify([...GROUPS.F, ...GROUPS.R].map(c => c.id).sort()) === JSON.stringify(views.map(v => v.id).sort()), JSON.stringify(views.map(v => v.id)));
      for (const c of GROUPS.F) assert(FACINGS.includes(c.rec.facing) || c.rec.facing === 'profile', JSON.stringify(c.rec));
      for (const v of views) await drawn('portrait-facing/facing.js', v);
      console.log(`      ${groups.map(g => `${g.id}: ${g.views.map(v => v.id).join(', ')}`).join('; ')} (every view drawn in node)`);
    },
  },
  {
    name: 'the card a bent candidate is composed on (posed.js manCardOf) is the game\'s paintHitcard pixel for pixel where the game paints the record',
    async fn() {
      const P = await import(path.join(SAMPLES, 'portrait-lib/posed.js'));
      const { paintHitcard, figGeom, bandOf } = await import('../src/art/doll/hitcard.js');
      const recs = [[4, P.recOf(P.RP, { hold: { how: 'rifle-aim' }, aimAt: 'you' })], [14, P.recOf(P.RP, { pose: 'kneel', hold: { how: 'rifle-aim' }, aimAt: 'you' })], [30, P.recOf(P.RP, { pose: 'sit', hold: { how: 'rifle-low' } })], [4, P.recOf(P.RP_PISTOL, { hold: { how: 'pistol-high' } })]];
      const out = [];
      for (const [r, rec] of recs) {
        const a = paintHitcard({ subject: { kind: 'man', rec, person: P.RP_PERSON }, rangeM: r, words: 'CHECK' });
        const b = P.manCardOf(P.dollOf(rec.gear, P.RP_PERSON, figGeom(bandOf(r).pxPerM).scale, rec), { rangeM: r, words: 'CHECK' });
        let d = 0; for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) d++;
        assert(a.w === b.w && a.h === b.h && d === 0, JSON.stringify({ rangeM: r, pose: rec.pose, how: rec.hold.how, differ: d }));
        out.push(`${rec.pose} ${rec.hold.how} ${r} m: 0 of ${a.data.length}`);
      }
      console.log(`      pixels differing: ${out.join('; ')}`);
    },
  },
];
