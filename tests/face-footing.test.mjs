// OLYMPUS tests: the body on a face (v0.0.25, "Hold to hold"; its build sheet §1 B, §3.2, §6 B, items 4 and 5; COMBAT §14.8; PL§5).
//
// A low steel compartment in free fall (lowRoom: the sandbox's bay copied as a generated area, its ceiling the Wreck's 2.2 m, its
// floor plateGrid with the holds' rule, under &env=ship-coast), the marine in mag boots. Held, each printed:
//   1. footing.js onFaceOf, setOnFace and bodySpanOf on both faces: on the deck the span is arms/carry.js SPAN_M[stance] for every
//      stance; on the deckhead actor.onFace 'deckhead', floatY 1.2 m, the span [0.45, 2.2] head down; a face refused where there is
//      no deckhead in reach (the bay's own 3.0 m) and a face that is none;
//   2. the boots lock on the deckhead (bootsLockWhy null at floatY 1.2) and keep floatY there; refused drifting and off both faces;
//   3. the footing on the deckhead booted is 'magWalk' at 0, 0.1 and 0.2 G (on the deck at 0.1 G it is the bound, as built);
//   4. the face change lived through the panel's row (shooting.js faceRows, anchorAction): 1,500 ms from locked boots, 1,200 ms
//      from floating, held 'handhold' throughout, actor.face (the facing) never written; a save mid-change carries on byte for byte;
//   5. the hit model and the blast through bodySpanOf: a round at chest height on a man standing on the deckhead takes his chest, at
//      0.6 m his head, at 2.0 m his legs (a standing man on the deck: torso, legs, over him); the blast's height apart 0.45 m;
//   6. every shipped scene's actors carry no onFace, faceTo nor anchorVia after 300 ticks;
//   7. the shot rows' anchor words (arms/shooting.js shotAnchorWords): "mag boots" with the pull on boots, "one-handed, a hand on
//      the hold −4", "floating −6" with the floating pull, and none at 0.05 G and up (every shipped label as built).
// The review of v0.0.25's E, A and B (each failing without its fix):
//   8. a walk key held through "Boots to the deckhead" pushes off nothing (freefall.js pushOff refuses while a face changes) and the
//      lock writes the face only where the boots lock on it (footing.js lockOnFace): no tick on which a body floats or drifts with
//      onFace 'deckhead'; a lock refused (drifting) leaves the face as it was;
//   9. the boots released on the deckhead leave the face (setAnchor: onFace cleared, floatY kept 1.2), so the push after it floats a
//      body drawn floating (loco.js floatLook), never planted in mid-air;
//  10. the faces are a decked area's only (footing.js facesHere): Testudo's berth in test-burn offers no face row and refuses the
//      deckhead; at 0.3 G and over the magnets hold no man on the deckhead (his footing the float's), at 0.2 G magWalk.
import { assert } from './helpers.mjs';
import { createGame } from './game.mjs';
import { TEST_AREA } from '../src/data/places/testroom.js';
import { registerArea, areaOf } from '../src/sim/places/model.js';
import { setLiveG } from '../src/sim/places/env.js';
import { onFaceOf, setOnFace, bodySpanOf, spanFrameOf, setAnchor, bootsLockWhy, footingOf, faceChangeOf, lockOnFace, bootsLocked } from '../src/sim/body/footing.js';
import { floatLook, faceLook } from '../src/sim/body/loco.js';
import { SPAN_M } from '../src/sim/arms/carry.js';
import { traceRound } from '../src/sim/arms/penetrate.js';
import { heightApartOf } from '../src/sim/combat/burst.js';
import { wear } from '../src/sim/arms/kit.js';
import { anchorAction, faceRows, shotAnchorWords, bootsAction } from '../src/sim/arms/shooting.js';
import { FOOTING } from '../src/data/body/needs.js';
import { pullMsOf } from '../src/sim/arms/shot.js';
import { SCENES } from '../src/data/scenes.js';
import { VOID } from '../src/data/body/needs.js';
import { TICK_MS } from '../src/core/clock.js';

const BAY = Object.freeze({ x0: 20, z0: 2.4, x1: 31.6, z1: 10.1 }), MID = Object.freeze([25.8, 6.25]), CEIL_M = 2.2;
// (the bay copied as a generated area (tests/float-world.mjs's way), its ceiling the Wreck's, its floor the void's plate with holds)
function lowArea(id, ceilingM) {
  const bay = TEST_AREA.rooms.find(r => r.id === 't1.bay');
  const room = { ...bay, id: `t1${id.slice(id.indexOf('~'))}.bay`, zone: 't1.z.low', ceilingM, floor: { ...bay.floor, kind: 'plateGrid' }, surface: 'plateGrid' };
  return { id, site: 'test', kind: 'floor', code: 't1l', name: 'A low steel bay', level: 1, originM: [0, 0, 0], boundsM: { ...BAY },
    spawn: { x: MID[0], z: MID[1], face: 'right' }, rooms: [room], openings: [], fixtures: [], zones: [{ id: 't1.z.low', rooms: [room.id] }], portals: [],
    surface: 'plateGrid', holds: { gridM: 1.5, padEyeM: 3, faces: true }, look: TEST_AREA.look,
    // (a decked area, as the Wreck is: people stand on its faces only there (footing.js facesHere; the review of v0.0.25's E, A and B))
    decks: [{ n: 1, rect: [BAY.x0, BAY.z0, BAY.x1, BAY.z1] }] };
}
/** The low steel compartment (see the header): { g, s, pid, me() }, the marine in mag boots at the bay's middle, locked where `lock`. */
export function lowRoom({ seed = 48213, ceilingM = CEIL_M, lock = true } = {}) {
  const id = ceilingM === CEIL_M ? 'test.rooms~low' : `test.rooms~low${Math.round(ceilingM * 10)}`;
  if (!areaOf(id)) registerArea(lowArea(id, ceilingM));
  const g = createGame({ scenario: 'sandbox', seed, env: 'ship-coast' }), s = g.state, pid = s.player.id;
  const me = () => s.actors.list.find(a => a.id === s.player.actor);
  s.places.live.area = id;
  const a = me(); a.x = MID[0]; a.z = MID[1]; a.face = 'right'; a.headRad = 0;
  wear(s, pid, 'mb-1');
  if (lock) setAnchor(s, pid, 'boots');
  return { g, s, pid, me };
}
// (a face row run to its end as the DI's T takes it (shooting.js anchorAction): the ms it took and the footing at each tick)
function lived(g, step) {
  const s = g.state, pid = s.player.id, t0 = s.clock.ms, r = anchorAction(s, g.bus, step), modes = new Set();
  if (!r.ok) return { ok: false, why: r.why, ms: 0, modes: [] };
  let n = 0; while ((s.stop?.mode === 'live' || s.stop?.doing) && n < 80) { modes.add(footingOf(s, pid).mode); g.step(1); n++; }
  return { ok: true, ms: s.clock.ms - t0, modes: [...modes] };
}
const r3 = (x) => Math.round(x * 1000) / 1000;
const span = (s, a) => bodySpanOf(s, a).map(r3);

export default [
  {
    name: 'face-footing: onFaceOf, setOnFace and bodySpanOf on both faces: SPAN_M on the deck for every stance, the deckhead\'s [0.45, 2.2] head down at floatY 1.2; refused with no deckhead in reach and for a face that is none',
    fn() {
      const { s, pid, me } = lowRoom(), a = me();
      const deck = Object.fromEntries(Object.keys(SPAN_M).map(st => { a.stance = st; return [st, span(s, a)]; })); delete a.stance;
      const f0 = onFaceOf(s, pid), up = setOnFace(s, pid, 'deckhead'), f1 = onFaceOf(s, pid), y1 = a.floatY, sp1 = span(s, a), inv = spanFrameOf(s, a).inv;
      const looks = { float: floatLook(a), face: faceLook(a) };
      const down = setOnFace(s, pid, 'deck'), f2 = onFaceOf(s, pid), fields = { onFace: a.onFace, floatY: a.floatY };
      const none = setOnFace(s, pid, 'port');
      const tall = lowRoom({ ceilingM: 3.0 }), tallUp = setOnFace(tall.s, tall.pid, 'deckhead');
      // (a floating body lifted 0.6 m over a standing man's centre: its span lifted with it)
      a.floatY = 1.6; const lifted = span(s, a); delete a.floatY;
      console.log(`      the deck: ${Object.entries(deck).map(([k, v]) => `${k} [${v}]`).join(', ')}; face ${f0}`);
      console.log(`      the deckhead (ceiling ${CEIL_M} m): ${JSON.stringify(up)}, face ${f1}, floatY ${y1}, span [${sp1}] head down ${inv}; floatLook ${JSON.stringify(looks.float)}, faceLook ${JSON.stringify(looks.face)}`);
      console.log(`      back to the deck: ${JSON.stringify(down)}, face ${f2}, fields ${JSON.stringify(fields)}; 'port' ${JSON.stringify(none)}; under 3.0 m ${JSON.stringify(tallUp)}; floating at floatY 1.6: [${lifted}]`);
      for (const [st, v] of Object.entries(deck)) assert(v[0] === SPAN_M[st][0] && v[1] === SPAN_M[st][1], JSON.stringify({ st, v, want: SPAN_M[st] }));
      assert(f0 === 'deck' && up.ok && f1 === 'deckhead' && y1 === 1.2 && sp1[0] === 0.45 && sp1[1] === 2.2 && inv, JSON.stringify({ f0, up, f1, y1, sp1, inv }));
      assert(looks.float === null && looks.face?.onFace === 'deckhead', JSON.stringify(looks));
      assert(down.ok && f2 === 'deck' && fields.onFace === undefined && fields.floatY === undefined, JSON.stringify({ down, f2, fields }));
      assert(!none.ok && none.why === 'no such face' && !tallUp.ok && tallUp.why === 'no deckhead in reach', JSON.stringify({ none, tallUp }));
      assert(lifted[0] === 0.6 && lifted[1] === 2.35, JSON.stringify(lifted));
    },
  },
  {
    name: 'face-footing: the boots lock on the deckhead at floatY 1.2 and keep it there; refused drifting and off both faces (the height measured from the face locked on)',
    fn() {
      const { s, pid, me } = lowRoom({ lock: false }), a = me();
      setOnFace(s, pid, 'deckhead');
      const why0 = bootsLockWhy(s, pid), lock = setAnchor(s, pid, 'boots'), kept = a.floatY, mode = footingOf(s, pid).mode;
      // (the boots released leave the face (the review of v0.0.25's E, A and B): put back on it for the refusals below)
      setAnchor(s, pid, null); setOnFace(s, pid, 'deckhead');
      a.v = [0.3, 0]; const drift = { why: bootsLockWhy(s, pid), set: setAnchor(s, pid, 'boots') }; delete a.v;
      a.floatY = 1.0; const offUp = { why: bootsLockWhy(s, pid), set: setAnchor(s, pid, 'boots') };
      delete a.onFace; a.floatY = 1.1; const offDeck = { why: bootsLockWhy(s, pid), set: setAnchor(s, pid, 'boots') };
      console.log(`      on the deckhead: why ${why0}, the lock ${JSON.stringify(lock)}, floatY after ${kept}, footing ${mode}`);
      console.log(`      drifting at 0.3 m/s ${JSON.stringify(drift)}; 1.2 m under the deckhead ${JSON.stringify(offUp)}; 1.1 m over the deck ${JSON.stringify(offDeck)}`);
      assert(why0 === null && lock.ok && kept === 1.2 && mode === 'magWalk', JSON.stringify({ why0, lock, kept, mode }));
      for (const r of [drift, offUp, offDeck]) assert(r.why === 'no deck under the boots' && !r.set.ok, JSON.stringify(r));
    },
  },
  {
    name: 'face-footing: booted on the deckhead the footing is magWalk at 0, 0.1 and 0.2 G (never the bound); on the deck at 0.1 G it is the bound, as built',
    fn() {
      const out = [];
      for (const gG of [0, 0.1, 0.2]) {
        const { s, pid } = lowRoom();
        setLiveG(s, gG);
        const deck = footingOf(s, pid);
        setOnFace(s, pid, 'deckhead'); setAnchor(s, pid, 'boots');
        const up = footingOf(s, pid);
        out.push({ gG, deck: `${deck.mode}/${deck.anchor}`, up: `${up.mode}/${up.anchor}` });
      }
      console.log(`      ${out.map(o => `${o.gG} G: the deck ${o.deck}, the deckhead ${o.up}`).join('; ')}`);
      for (const o of out) assert(o.up === 'magWalk/magBoots', JSON.stringify(o));
      assert(out[1].deck.startsWith('bound') && out[0].deck === 'magWalk/magBoots', JSON.stringify(out));
    },
  },
  {
    name: 'face-footing: the face change lived by its row: 1,500 ms from locked boots (release 300, tuck and turn 800, lock 400), 1,200 ms from floating; held on a hold throughout, the facing never written; a save mid-change carries on byte for byte',
    fn() {
      const A = lowRoom(), a = A.me(), face0 = a.face;
      const rows0 = faceRows(A.s, A.pid).map(r => `${r.label} ${r.ms} ms${r.off ? ` (${r.off})` : ''}`);
      const up = lived(A.g, 'face:deckhead'), after = { face: onFaceOf(A.s, A.pid), floatY: a.floatY, anchor: a.anchor, facing: a.face, change: faceChangeOf(A.s, A.pid) };
      const rows1 = faceRows(A.s, A.pid).map(r => `${r.label} ${r.ms} ms`);
      const down = lived(A.g, 'face:deck'), back = { face: onFaceOf(A.s, A.pid), floatY: a.floatY, anchor: a.anchor, facing: a.face };
      // (floating at the deck's height, the boots off: the tuck and the lock)
      const F = lowRoom({ lock: false }), fa = F.me(); fa.floatY = 1.0;
      const fl = lived(F.g, 'face:deckhead'), fAfter = { face: onFaceOf(F.s, F.pid), anchor: fa.anchor };
      // (a save 10 ticks into the change, carried on 40 ticks by both)
      const B = lowRoom(); anchorAction(B.s, B.g.bus, 'face:deckhead'); B.g.step(10);
      const json = B.g.save(), C = lowRoom(); C.g.load(json);
      const mid = { faceTo: B.me().faceTo, anchor: B.me().anchor };
      B.g.step(40); C.g.step(40);
      const same = B.g.digest() === C.g.digest(), end = onFaceOf(C.g.state, C.pid);
      console.log(`      the rows on the deck: ${rows0.join(', ')}; on the deckhead: ${rows1.join(', ')}`);
      console.log(`      up from boots ${up.ms} ms, footings ${up.modes.join('/')} → ${JSON.stringify(after)}; down ${down.ms} ms → ${JSON.stringify(back)}; from floating ${fl.ms} ms → ${JSON.stringify(fAfter)}`);
      console.log(`      the save 10 ticks in (${JSON.stringify(mid)}): carried on 40 ticks ${same ? 'byte for byte' : 'DIFFERING'}, the face ${end}`);
      // (a live step lives its sub-steps' sum and ends on the tick after its last boundary (stepper.js: the boundary taken on the first tick at or after it))
      const T = VOID.FACE_MS, fromBoots = T.release + T.turn + T.lock, fromFloat = T.turn + T.lock, lives = (ms, want) => ms >= want && ms <= want + TICK_MS;
      assert(up.ok && lives(up.ms, fromBoots) && down.ok && lives(down.ms, fromBoots) && fl.ok && lives(fl.ms, fromFloat), JSON.stringify({ up, down, fl, fromBoots, fromFloat }));
      assert(up.modes.every(m => m === 'magWalk' || m === 'handhold'), JSON.stringify(up.modes));
      assert(after.face === 'deckhead' && after.floatY === 1.2 && after.anchor === 'boots' && after.change === null && back.face === 'deck' && back.floatY === undefined && back.anchor === 'boots', JSON.stringify({ after, back }));
      assert(after.facing === face0 && back.facing === face0 && fAfter.face === 'deckhead' && fAfter.anchor === 'boots', JSON.stringify({ face0, after, back, fAfter }));
      assert(mid.faceTo === 'deckhead' && mid.anchor === 'handhold' && same && end === 'deckhead', JSON.stringify({ mid, same, end }));
    },
  },
  {
    name: 'face-footing: the hit model and the blast through bodySpanOf: on a man standing on the deckhead a round at 1.0 m takes his chest, at 0.6 m his head, at 2.0 m his legs (on the deck: torso, legs, over him); his height apart from a burst 0.45 m',
    fn() {
      const { s, pid } = lowRoom(), parts = {};
      for (const face of ['deck', 'deckhead']) {
        const tgt = { id: 'a:tgt', who: 'p:tgt', x: 29.0, z: MID[1], face: 'left', headRad: Math.PI };
        s.actors.list.push(tgt);
        if (face === 'deckhead') { tgt.onFace = 'deckhead'; tgt.floatY = 1.2; }
        parts[face] = {};
        for (const y of [0.6, 1.0, 2.0]) {
          const t = traceRound(s, { shooterId: pid, from: { x: MID[0], y, z: MID[1] }, yawRad: 0, pitchRad: 0, maxM: 20, rngKey: `face:${face}:${y}` });
          parts[face][y] = t.hits.find(h => (h.onId ?? h.id ?? h.who) === 'p:tgt')?.part ?? (t.hits[0]?.part ?? 'miss');
        }
        parts[face].apart = heightApartOf(s, tgt);
        s.actors.list.pop();
      }
      console.log(`      the deck: ${JSON.stringify(parts.deck)}; the deckhead: ${JSON.stringify(parts.deckhead)}`);
      assert(parts.deckhead[1.0] === 'torso' && parts.deckhead[0.6] === 'head' && parts.deckhead[2.0] === 'legs' && Math.abs(parts.deckhead.apart - 0.45) < 1e-9, JSON.stringify(parts));
      assert(parts.deck[1.0] === 'torso' && parts.deck[0.6] === 'legs' && parts.deck[2.0] === 'miss' && parts.deck.apart === 0, JSON.stringify(parts));
    },
  },
  {
    name: 'face-footing: every shipped scene\'s actors carry no onFace, faceTo nor anchorVia after 300 ticks (the face is the Wreck\'s alone)',
    fn() {
      const seen = {};
      for (const S of Object.values(SCENES)) {
        const scenario = S.id, g = createGame({ seed: 48213, scenario: S.scenario, ...(S.setup ? { setup: S.setup } : {}), ...(S.opfor ? { opfor: S.opfor } : {}) });
        g.step(300);
        const s = g.state, list = [...(s.actors?.list ?? [])];
        seen[scenario] = list.filter(a => a.onFace !== undefined || a.faceTo !== undefined || a.anchorVia !== undefined).length;
      }
      console.log(`      ${Object.entries(seen).map(([k, n]) => `${k} ${n}`).join(', ')}`);
      assert(Object.values(seen).every(n => n === 0), JSON.stringify(seen));
    },
  },
  {
    name: 'face-footing: the shot rows\' anchor words under 0.05 G: "mag boots", "one-handed, a hand on the hold −4", "floating −6", each with the pull on that footing; none at 0.05 G and up',
    fn() {
      const { s, pid, me } = lowRoom(), a = me(), gun = s.people[pid].kit.worn.sling, out = {};
      out.boots = shotAnchorWords(s, pid, gun);
      setAnchor(s, pid, null); a.anchor = 'handhold'; a.anchorAt = [a.x, a.z]; out.hold = shotAnchorWords(s, pid, gun);
      setAnchor(s, pid, null); out.floating = shotAnchorWords(s, pid, gun); const pullFloat = pullMsOf(s, pid, gun).ms;
      setLiveG(s, 0.1); out.lowG = shotAnchorWords(s, pid, gun);
      const sb = createGame({ scenario: 'test-shoothouse', seed: 48213, setup: 'go' }), at1 = shotAnchorWords(sb.state, sb.state.player.id, sb.state.people[sb.state.player.id].kit.worn.sling);
      console.log(`      ${Object.entries(out).map(([k, v]) => `${k} "${v}"`).join(', ')}; the floating pull ${pullFloat} ms; the house at 1 G ${JSON.stringify(at1)}`);
      assert(/^ · mag boots · \d+ ms$/.test(out.boots) && /^ · one-handed, a hand on the hold −4 · \d+ ms$/.test(out.hold) && /^ · floating −\d · \d+ ms$/.test(out.floating), JSON.stringify(out));
      assert(out.floating.endsWith(` ${pullFloat} ms`) && out.lowG === null && at1 === null, JSON.stringify({ out, at1 }));
    },
  },
  {
    name: 'face-footing (the review of v0.0.25\'s E, A and B): a walk key held through "Boots to the deckhead" pushes off nothing, and the face is written only where the boots lock on it: no tick with a body floating or drifting on the deckhead; a lock refused leaves the face as it was',
    fn() {
      const { g, s, pid, me } = lowRoom(), a = me(), bad = [], trace = [];
      const look = (t) => { const F = footingOf(s, pid), v = Math.hypot(...(a.v ?? [0, 0])); trace.push(`${t} ${a.onFace ?? 'deck'}/${F.mode}/${v.toFixed(2)}`); if (a.onFace === 'deckhead' && (F.mode === 'float' || v > FOOTING.REST_MS)) bad.push(t); };
      const r = anchorAction(s, g.bus, 'face:deckhead');
      for (let i = 0; i < 8; i++) { g.step(1); look(i); }
      for (let i = 8; i < 14; i++) { g.step(1, { mx: -1 }); look(i); }
      for (let i = 14; i < 80; i++) { g.step(1); look(i); }
      const end = { onFace: a.onFace ?? 'deck', boots: bootsLocked(s, pid), floatY: a.floatY ?? null, vMs: Math.hypot(...(a.v ?? [0, 0])) };
      // (a lock refused: floating at the deck's height and drifting 0.3 m/s, the boots to the deckhead)
      const F = lowRoom({ lock: false }), fa = F.me(); fa.floatY = 1.0; fa.v = [0.3, 0];
      const refused = lockOnFace(F.s, F.pid, 'deckhead'), kept = { onFace: fa.onFace ?? 'deck', floatY: fa.floatY, anchor: fa.anchor ?? null };
      // (the row's own lock on a body set moving 0.1 s before it by something else (a push forced on it, as a bump would): refused, the face as it was)
      const P = lowRoom(), pa = P.me(); anchorAction(P.s, P.g.bus, 'face:deckhead'); P.g.step(29);
      pa.push = { fromMs: P.s.clock.ms, untilMs: P.s.clock.ms + 500, x0: pa.x, z0: pa.z, v: [0.6, 0], from: 'hold' }; pa.floatY ??= 1.0;
      P.g.step(4);
      const bumped = { onFace: pa.onFace ?? 'deck', faceTo: pa.faceTo ?? null, mode: footingOf(P.s, P.pid).mode, boots: bootsLocked(P.s, P.pid) };
      console.log(`      the row ${JSON.stringify(r)}; the trace ${trace.filter((x, i) => i % 10 === 0 || i === 8 || i === 13).join(', ')}; at the end ${JSON.stringify(end)}`);
      console.log(`      ticks on the deckhead floating or drifting: ${bad.length}; a lock while drifting ${JSON.stringify(refused)} → ${JSON.stringify(kept)}; the row's lock on a body bumped 0.1 s before it → ${JSON.stringify(bumped)}`);
      assert(r.ok && bad.length === 0 && end.onFace === 'deckhead' && end.boots && end.vMs === 0, JSON.stringify({ bad: bad.slice(0, 5), end }));
      assert(!refused.ok && kept.onFace === 'deck' && kept.floatY === 1.0 && kept.anchor === null, JSON.stringify({ refused, kept }));
      assert(bumped.faceTo === null && bumped.onFace === 'deck' && !bumped.boots, JSON.stringify(bumped));
    },
  },
  {
    name: 'face-footing (the review of v0.0.25\'s E, A and B): the boots released on the deckhead leave the face (floatY kept 1.2), so the push after it floats a body drawn floating, never one recorded planted on the deckhead in mid-air',
    fn() {
      const { g, s, pid, me } = lowRoom(), a = me();
      const up = lived(g, 'face:deckhead'), on = { onFace: a.onFace, floatY: a.floatY };
      const rel = bootsAction(s, g.bus); g.step(20);
      const off = { onFace: a.onFace ?? 'deck', floatY: a.floatY, mode: footingOf(s, pid).mode };
      g.step(10, { mx: 1 }); g.step(20);
      const after = { onFace: a.onFace ?? 'deck', floatY: a.floatY, mode: footingOf(s, pid).mode, vMs: Math.hypot(...(a.v ?? [0, 0])), floatLook: !!floatLook(a), faceLook: faceLook(a) };
      console.log(`      planted ${JSON.stringify(on)} (${up.ms} ms); released ${JSON.stringify(rel)} → ${JSON.stringify(off)}; pushed → ${JSON.stringify(after)}`);
      assert(on.onFace === 'deckhead' && rel.ok && off.onFace === 'deck' && off.floatY === 1.2 && off.mode === 'float', JSON.stringify({ on, rel, off }));
      assert(after.onFace === 'deck' && after.mode === 'float' && after.vMs > 0 && after.floatLook && after.faceLook === null, JSON.stringify(after));
    },
  },
  {
    name: 'face-footing (the review of v0.0.25\'s E, A and B): the faces are a decked area\'s only: test-burn\'s berth offers no face row and refuses the deckhead; at 0.3 G and over the magnets hold no man on the deckhead, at 0.2 G magWalk',
    fn() {
      const B = createGame({ scenario: 'test-burn', seed: 48213 }); B.step(20);
      const bpid = B.state.player.id, rows = faceRows(B.state, bpid).map(r => r.id), refused = setOnFace(B.state, bpid, 'deckhead');
      const out = {};
      for (const gG of [0.2, 0.3, 1.0]) {
        const { s, pid } = lowRoom();
        setOnFace(s, pid, 'deckhead'); setAnchor(s, pid, 'boots'); setLiveG(s, gG);
        const F = footingOf(s, pid); out[gG] = `${F.mode}/${F.hold}`;
      }
      console.log(`      test-burn's berth: the rows ${JSON.stringify(rows)}, the deckhead ${JSON.stringify(refused)}; booted on the deckhead ${Object.entries(out).map(([k, v]) => `${k} G ${v}`).join(', ')}`);
      assert(rows.length === 0 && !refused.ok && B.state.actors.list.every(a => a.onFace === undefined), JSON.stringify({ rows, refused }));
      assert(out[0.2] === 'magWalk/boots' && out[0.3] === 'float/none' && out[1] === 'float/none', JSON.stringify(out));
    },
  },
];
