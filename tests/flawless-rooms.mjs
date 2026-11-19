// OLYMPUS tests: the rooms' gauges, F74 to F77 (the build sheet v0.0.22 §8, items 12 to 14; house lens G1 to G3): the deriver against every authored plan, the eight rooms' cases, the eight-room lanes' pace, and nobody at rest in a no-stop zone.
//
//   F74  the deriver (src/sim/combat/derive.js) gives every authored family within DERIVE_TOL: layout A's three door plans in the area's
//        frame (x4-plans.js X4_PLANS.A; the hall's leg is the corner rule's passage, assemble.js hallPlan's, not a room the deriver
//        makes), and the chunks' four in their own frames (the centre's push and pull, the corner's 'fed-hinge', the ell's 'shape':
//        assemble.js deriveChunkPlan); and the same owner by room.js sectorOf for every stand and every candidate place of each room.
//        The fields measured (planOffsets): the stack, the points, the hot spots (each one's nearest on the other side, both ways),
//        the dead circle's centre and radius, the far walk's end, the sectors' yaws, the paths' waypoints but their last (the point,
//        held by pointM) against the other path, both ways, and the path's length with the derived end moved to the authored point
//   F75  every family of the eight rooms, on every case (chunk × side × swing), meets room.test's rules (house-cases: caseCheck), the
//        slots' waypoints 0.1 m apart where the room stands as authored, no point and no far walk's end in a no-stop zone, its post valid where it is placed (opfor-world.mjs spotCheck),
//        and every committed `derived@1` family equal to what the deriver gives today (chunksFresh)
//   F76  on eight-room lanes, each room's time by the honest tier one at most its own par (shoothouse.js roomParOf, the leg's
//        L.parMs written at the fill) on at least ROOM_PAR_SHARE 90% of the lanes holding it; every lane at most LANE_MAX_S 60 s; his
//        mean lane at most DRAWN_LANE_K 1.10 × his lanes' mean summed par. Printed until the lead's quiet run enforces it (§8)
//   F77  no body at rest in a no-stop zone of any why (zones.js ZONE_WHYS: a door's funnel, a declared doorway, a leaf's sweep while it
//        moves) but by a step that stands still by choice: a body that does not move REST_MM in REST_MS on the lane, inside a live
//        zone (zones.js liveZoneAt), counted by the zone's why. The honest and keys bots 0 on every drawn lane; the fuzz printed
// Each row { id, name, met, value, target } as flawless.mjs gaugeOf's; ROOMS_ENFORCED names those that fail a suite.
import { fmt } from './helpers.mjs';
import { newState } from '../src/core/state.js';
import { mean, s1, s2, LANE_MAX_S } from './flawless.mjs';
import { DRAWN_LANE_K, drawnLane } from './flawless-drawn.mjs';
import { spotCheck } from './opfor-world.mjs';
import { openNavOf, clearLine as navClear } from '../src/sim/places/nav.js';
import { standOk } from '../src/sim/places/collide.js';
import { roomPlanOf, coverageOf, wallClearanceM, pathLengthM, sectorOf } from '../src/sim/combat/room.js';
import { cornerRuleOf, screenWordsOf } from '../src/sim/combat/corner.js';
import { derivePlan, geoOf, DERIVE_TOL, WAYPOINT_GAP_M } from '../src/sim/combat/derive.js';
import { liveZoneAt, standsStill, zonesOf, inZone } from '../src/sim/places/zones.js';
import { roomCaseOf, assembleHouse, rawPathsOf, parseHouse, postsOf, deriveChunkPlan, PATH_TOL_M, LIVE_ROOMS } from '../src/sim/scenes/assemble.js';
import { X4_CHUNKS, X4_LANE_CHUNKS } from '../src/data/chunks/x4.js';
import { X4_PLANS } from '../src/data/places/x4-plans.js';
import { HOUSE1, LAYOUT_A } from '../src/data/places/wheel.js';

/** The gauges this file holds that fail a suite at once (F76 printed until the lead's quiet run: the build sheet §8). */
export const ROOMS_ENFORCED = Object.freeze(new Set(['F74', 'F75', 'F77']));
/** F76: a room's share of its lanes within its own par. */
export const ROOM_PAR_SHARE = 0.90;
/** F77: a body that moves less than this in REST_MS is at rest (mm, ms; my calls: a tick's 1 mm of jitter, six ticks of standing). */
export const REST_MM = 1, REST_MS = 300;

const D = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const segD = (p, a, b) => { const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, t = l2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / l2)) : 0; return Math.hypot(a[0] + vx * t - p[0], a[1] + vz * t - p[1]); };
const toPath = (p, P) => (P.length < 2 ? D(p, P[0]) : Math.min(...P.slice(0, -1).map((a, i) => segD(p, a, P[i + 1]))));
const R2D = 180 / Math.PI;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// ---- F74: the deriver against the authored ----

/**
 * How far a derived plan stands from the authored (see the header), each in DERIVE_TOL's units: { stackM, pointM, hotM, deadCentreM,
 * deadRadiusM, farEndM, pathM, pathLenM, sectorDeg, dead (the two agree on having one), far (likewise) }.
 */
export function planOffsets(A, P) {
  const nearest = (h, list) => Math.min(...list.map(q => D([h.x, h.z], [q.x, q.z])));
  // (the way: each path's waypoints but its last (the point, held by pointM) against the other path, both ways; its length with the
  // derived path's end moved to the authored point, so a point held apart is not counted twice)
  const wayIn = (p) => p.slice(0, -1);
  const path = Math.max(...[1, 2].flatMap(s => [...wayIn(A.paths[s]).map(q => toPath(q, P.paths[s])), ...wayIn(P.paths[s]).map(q => toPath(q, A.paths[s]))]));
  const pathLen = Math.max(...[1, 2].map(s => Math.abs(pathLengthM(A.paths[s]) - pathLengthM([...wayIn(P.paths[s]), A.paths[s].at(-1)]))));
  const dA = A.dead?.[0] ?? null, dP = P.dead?.[0] ?? null, fA = A.far?.path?.at(-1) ?? null, fP = P.far?.path?.at(-1) ?? null;
  return {
    stackM: Math.max(...A.stack.map((p, i) => D(p, P.stack[i]))), pointM: Math.max(...A.points.map((p, i) => D(p, P.points[i]))),
    hotM: Math.max(...A.hot.map(h => nearest(h, P.hot)), ...P.hot.map(h => nearest(h, A.hot))),
    deadCentreM: dA && dP ? D(dA, dP) : 0, deadRadiusM: dA && dP ? Math.abs(dA[2] - dP[2]) : 0, farEndM: fA && fP ? D(fA, fP) : 0,
    pathM: path, pathLenM: pathLen, sectorDeg: Math.max(...A.sectors.map(s => Math.abs(wrap(s.yawRad - P.sectors.find(q => q.slot === s.slot).yawRad)) * R2D)),
    dead: !!dA === !!dP, far: !!fA === !!fP,
  };
}
/** The fields of planOffsets over DERIVE_TOL: [field]. */
export const overTol = (o) => [...Object.entries(DERIVE_TOL).filter(([k, v]) => o[k] > v + 1e-9).map(([k]) => k), ...(o.dead ? [] : ['dead']), ...(o.far ? [] : ['far'])];
// (the owners by sectorOf of a list of [x, z] on two plans: the places where they differ)
const ownersDiffer = (A, P, pts) => pts.filter(([x, z]) => sectorOf(A, x, z) !== sectorOf(P, x, z));
// (a chunk's candidate places in a frame: its own, or LAYOUT_A's placement)
const placesOf = (chunk, at = [0, 0]) => X4_CHUNKS[chunk].places.map(p => [p.x + at[0], p.z + at[1]]);

/** F74 (see the header): { row, lines }. */
export function f74() {
  const lines = [], bad = [];
  let worst = {};
  const keep = (o) => { for (const k of Object.keys(DERIVE_TOL)) worst[k] = Math.max(worst[k] ?? 0, o[k]); };
  // (layout A's three door plans, in the area's frame)
  const L = X4_PLANS.A, chunkOf = { 'o:w4:r1': 'x4:centre', 'o:w4:r2': 'x4:corner', 'o:w4:r3': 'x4:ell' };
  for (const k of L.order) {
    const A = L.plans[k];
    if (!A.door) continue;
    const t = performance.now(), P = derivePlan(geoOf(L.area, A.door, A.parts)), ms = performance.now() - t, o = planOffsets(A, P), over = overTol(o);
    const lay = LAYOUT_A.find(x => x.chunk === chunkOf[k]), pts = [...HOUSE1.stands.filter(s => s.door === k).map(s => [s.x, s.z]), ...placesOf(chunkOf[k], lay.at)], own = ownersDiffer(A, P, pts);
    keep(o);
    lines.push(`${k} (layout A, the area's frame; ${fmt(ms, 0)} ms): ${line(o)}; owners the same for ${pts.length - own.length} of ${pts.length} stands and places`);
    if (over.length || own.length) bad.push(`${k}: ${[...over, ...own.map(p => `owner at ${JSON.stringify(p)}`)].join(', ')}`);
  }
  // (the chunks' authored families, in their own frames)
  for (const [letter, how, fam] of [['C', 'push', 'push'], ['C', 'pull', 'pull'], ['K', 'pull', 'fed-hinge'], ['E', 'push', 'shape']]) {
    const C = X4_CHUNKS[X4_LANE_CHUNKS[letter]], A = { ...C.plans[fam], sectors: C.plans[fam].sectors.map(s => ({ ...s, halfDeg: 20 })) }, t = performance.now();
    const P0 = deriveChunkPlan(letter, how), ms = performance.now() - t, P = { ...P0, sectors: P0.sectors.map(s => ({ ...s, halfDeg: 20 })) }, o = planOffsets(A, P), over = overTol(o);
    const pts = placesOf(C.id), own = ownersDiffer(A, P, pts);
    keep(o);
    lines.push(`${C.id} '${fam}' (the chunk's frame, ${how}; ${fmt(ms, 0)} ms): ${line(o)}; owners the same for ${pts.length - own.length} of ${pts.length} places`);
    if (over.length || own.length) bad.push(`${C.id} ${fam}: ${[...over, ...own.map(p => `owner at ${JSON.stringify(p)}`)].join(', ')}`);
  }
  const row = { id: 'F74', name: 'the deriver gives every authored family within DERIVE_TOL, the same owners', met: !bad.length, value: `${bad.length} off${bad.length ? `: ${bad.join('; ')}` : ''}; the worst ${line(worst)}`, target: `within ${JSON.stringify(DERIVE_TOL)}` };
  return { row, lines };
}
const line = (o) => `stack ${fmt(o.stackM, 3)}, point ${fmt(o.pointM, 2)}, hot ${fmt(o.hotM, 2)}, dead ${fmt(o.deadCentreM, 2)} and ${fmt(o.deadRadiusM, 2)}, far end ${fmt(o.farEndM, 2)}, path ${fmt(o.pathM, 3)} and its length ${fmt(o.pathLenM, 3)} m, sector ${fmt(o.sectorDeg, 1)}°`;

// ---- F75: the room cases (house-cases' rules), and the committed families fresh ----

/** Layout A's three rooms' cases (each side, each swing: 12, v0.0.21's) and X4's other five's (20, v0.0.22's). */
export const CASES = Object.freeze(['C', 'K', 'E'].flatMap(L => ['n', 's'].flatMap(side => ['push', 'pull'].map(how => Object.freeze([L, side, how])))));
export const CASES8 = Object.freeze(['W', 'D', 'O', 'T', 'Q'].flatMap(L => ['n', 's'].flatMap(side => ['push', 'pull'].map(how => Object.freeze([L, side, how])))));
const POINT_OFF_M = 0.4, COVER_MIN = 0.98;
const P2 = (p) => `(${p.map(v => fmt(v, 2)).join(', ')})`;
// (a bare state on a drawn house: the places the plans read, the record that names the house, nothing else)
function drawnState(code) {
  const s = newState(48213, { version: 'test' }), H = assembleHouse(code);
  s.places.live = { site: 'melas', area: H.area.id };
  s.actors.area = H.area.id;
  s.armoury.range = { course: 'house', house: { lane: 'A', draw: { mode: 'drawn', v: 1, code: H.code } } };
  return s;
}
const walker = (G, a, b) => { const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.01)); for (let k = 0; k <= n; k++) if (!standOk(G, a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n)) return false; return true; };
const legsCut = (G, path) => path.slice(1).filter((q, i) => !navClear(G, path[i][0], path[i][1], q[0], q[1]) || !walker(G, path[i], q)).length;
// (the least distance between the two slots' waypoints, their shared start and end left out: x4-plans.js's rule)
function slotGap(P) {
  let g = Infinity;
  for (const a of P.paths[1].slice(1, -1)) for (const b of P.paths[2].slice(1, -1)) g = Math.min(g, D(a, b));
  return g;
}
// (a chunk's post placed in a case's lane where its room is not a lane room of LIVE_ROOMS: as postsOf places it, by the room's placement)
function placedPost(H, k, P0, door, P) {
  const R = H.rooms[k], C = X4_CHUNKS[R.chunk], S = C.sockets[0], Dp = Math.max(...C.rooms.map(r => r.rect[3])), mid = (S.a + S.b) / 2;
  const flip = R.side !== C.side, x0 = Math.round((R.doorX - mid) * 100) / 100, z0 = R.side === 'n' ? Math.round((HOUSE1.hall.rect[1] - Dp) * 100) / 100 : HOUSE1.hall.rect[3];
  const at = ([x, z]) => [Math.round((x0 + x) * 100) / 100, Math.round((z0 + (flip ? Dp - z : z)) * 100) / 100];
  return { door, start: at(P0.start), hide: at(P0.hide), dash: P0.dash.map(at), aimAt: [...P.threshold] };
}
/**
 * One room case held to the rules (house-cases; see the header): { line, bad: [..], rawCut, flipped, post }. The post: postsOf's where
 * the room is a lane room of LIVE_ROOMS in its reference lane, else placed as postsOf places it; its start and hide checked by spotCheck
 * on the room's plan, the other stands left out (the cast keeps them clear: assemble.js postFair).
 */
export function caseCheck([L, side, how]) {
  const bad = [];
  const K = roomCaseOf(L, side, how), H = parseHouse(K.code), k = H.rooms.findIndex(r => r.letter === L && r.side === side);
  const s = drawnState(K.code), A = assembleHouse(K.code), door = A.plans.order[k], P = roomPlanOf(s, door), G = openNavOf(A.area.id, 'C0'), raw = rawPathsOf(K.code)[door];
  const c = coverageOf(s, P), clear = P.points.map(([x, z]) => wallClearanceM(P, x, z));
  const ways = [['1', P.paths[1], raw[1]], ['2', P.paths[2], raw[2]], ...(P.far ? [['far', P.far.path, raw.far]] : [])];
  const cut = ways.reduce((n, [, w]) => n + legsCut(G, w), 0), rawCut = ways.reduce((n, [, , w]) => n + legsCut(G, w), 0);
  const off = Math.max(...ways.flatMap(([, w, r]) => [...w.map(q => toPath(q, r)), ...r.map(q => toPath(q, w))]));
  const r1 = cornerRuleOf(P, 1), r2 = cornerRuleOf(P, 2), words = [screenWordsOf(r1), screenWordsOf(r2)];
  const pointOk = r1?.point && D(r1.point, P.points[0]) < 0.01;
  const gap = slotGap(P), C = X4_CHUNKS[X4_LANE_CHUNKS[L]], tag = `${L}${side} ${how}`;
  if (clear.some(v => v < POINT_OFF_M - 1e-9)) bad.push(`${tag}: a point ${clear.map(v => fmt(v, 3)).join(', ')} m off a wall`);
  if (c.share < COVER_MIN) bad.push(`${tag}: ${fmt(c.share * 100, 1)}% seen`);
  if (cut) bad.push(`${tag}: ${cut} legs cut`);
  if (off > PATH_TOL_M + 1e-9) bad.push(`${tag}: a path ${fmt(off, 3)} m off its transform`);
  if (r1?.entry !== P.entry || !pointOk) bad.push(`${tag}: the rule's #1 ${r1?.entry} at ${JSON.stringify(r1?.point)}, the plan's ${P.entry} at ${JSON.stringify(P.points[0])}`);
  if (!words.every(Boolean)) bad.push(`${tag}: no screen words`);
  // (no man's point and no far walk's end in a no-stop zone of the house (zones.js zonesOf: a lane door's funnel, a declared doorway,
  // a hatch): the plan's own places must be places to stand. v0.0.22's review: the small room put both points 0.5 m in, on its own
  // door's funnel, and the DI marked DOORWAY on the tier one's perfect run (derive.js outOfFunnels))
  const zs = zonesOf(A.area.id), stops = [...P.points.map((p, i) => [`#${i + 1}'s point`, p]), ...(P.far ? [['the far walk\'s end', P.far.path.at(-1)]] : [])];
  for (const [what, p] of stops) { const Z = zs.find(Z => inZone(Z, p[0], p[1])); if (Z) bad.push(`${tag}: ${what} ${P2(p)} in ${Z.id} (${Z.why})`); }
  if (P.swing.how !== how) bad.push(`${tag}: the door read ${P.swing.how}`);
  // (the committed plan's rule: held where the room stands on its authored side; a flipped room's fit (assemble.js fitPath) may nudge a
  // waypoint up to PATH_TOL_M, printed (v0.0.21's flipped L: 0.08 m))
  if (side === C.side && gap < WAYPOINT_GAP_M - 1e-9) bad.push(`${tag}: the slots' waypoints ${fmt(gap, 3)} m apart`);
  let post = null;
  if (C.posts?.length) {
    const n = LIVE_ROOMS.includes(k + 1) ? k + 1 : null, stand = `${k + 1}${C.posts[0].stand}`;
    const at = (n ? postsOf(A.spec)[stand] : null) ?? placedPost(H, k, C.posts[0], door, P);
    const a = spotCheck(s, stand, at.start, { spot: at, plan: P, stands: [] }), b = spotCheck(s, stand, at.hide, { spot: at, plan: P, stands: [], slot0: a.slot });
    post = { ok: a.ok && b.ok, start: a, hide: b };
    if (!post.ok) bad.push(`${tag}: the post ${a.ok ? '' : `start ${a.why.join(', ')}`}${b.ok ? '' : ` hide ${b.why.join(', ')}`}`);
  }
  const text = `${tag} (${P.swing.words} ${P.entry}) in ${K.code}: points ${P.points.map(P2).join(' and ')} ${clear.map(v => fmt(v, 2)).join(' and ')} m off; ${fmt(c.share * 100, 1)}% seen; paths ${[1, 2].map(n => fmt(pathLengthM(P.paths[n]), 2)).join(' and ')} m${P.far ? `, far ${fmt(pathLengthM(P.far.path), 2)} m${P.far.words ? ` ("${P.far.words}")` : ''}` : ''}; cut ${cut}, raw cut ${rawCut}; worst offset ${fmt(off, 3)} m; slots ${fmt(gap, 2)} m apart; #1 ${r1?.entry} to ${r1?.side}, #2 ${r2?.entry}; said "${words.join('", "')}"${post ? `; post ${post.ok ? 'valid' : 'NOT'} (way ${fmt(post.start.way, 2)} and ${fmt(post.hide.way, 2)} m, side ${post.start.slot})` : ''}`;
  return { line: text, bad, rawCut, flipped: side !== C.side, post };
}
/**
 * Every committed `derived@1` family against what the deriver gives today (tests/chunks-fresh): { n, stale: [chunk family field], lines }.
 * Field for field: the committed literal and deriveChunkPlan's, compared as JSON. opts: derivePlan's (a rule changed: the tests' only).
 */
export function chunksFresh(opts = {}) {
  const lines = [], stale = [];
  let n = 0;
  for (const C of Object.values(X4_CHUNKS)) for (const [fam, P] of Object.entries(C.plans ?? {})) {
    if (P.source !== 'derived@1') continue;
    const how = Object.entries(C.family).find(([, f]) => f === fam)[0], letter = Object.entries(X4_LANE_CHUNKS).find(([, id]) => id === C.id)[0];
    const t = performance.now(), Q = deriveChunkPlan(letter, how, opts), ms = performance.now() - t, off = Object.keys({ ...P, ...Q }).filter(k => JSON.stringify(P[k]) !== JSON.stringify(Q[k]));
    n++;
    lines.push(`${C.id} '${fam}' (${how}, ${fmt(ms, 0)} ms): ${off.length ? `STALE in ${off.join(', ')}` : 'as derived today'}`);
    for (const k of off) stale.push(`${C.id} ${fam} ${k}`);
  }
  return { n, stale, lines };
}
/** F75 (see the header) from caseCheck's results over every case and chunksFresh's: the row. */
export function f75(results, fresh) {
  const bad = results.flatMap(r => r.bad), posts = results.filter(r => r.post), postsOk = posts.filter(r => r.post.ok).length;
  return { id: 'F75', name: 'the eight rooms\' cases meet room.test\'s rules, their posts valid, their committed plans the deriver\'s', met: !bad.length && !fresh.stale.length && fresh.n > 0,
    value: `${results.length} cases, ${bad.length} off${bad.length ? ` (${bad.slice(0, 4).join('; ')})` : ''}; posts ${postsOk} of ${posts.length} valid; ${fresh.n} derived families, ${fresh.stale.length} stale${fresh.stale.length ? ` (${fresh.stale.slice(0, 4).join(', ')})` : ''}`, target: '0 off, every post valid, 0 stale' };
}

// ---- F76 and F77: on the lanes ----

/**
 * A lane watched as flawless-drawn.mjs drawnLane's (flawlessLane's, its code and its stop budget for F65), and for F76 its legs' pars at the fill, for F77 every rest of
 * either body in a live no-stop zone by the zone's why: the record, `.code`, `.parS` ([rooms 1 to 3, the hall], s), `.rest`
 * ({ [why]: { ms, n, chosenMs } }, the bodies' unchosen rest in ms, the rests counted, the chosen apart), `.restWhat` (the first few).
 */
export function roomsLane(o) {
  let code = null, parS = null;
  const rest = {}, restWhat = [], last = {};
  const more = (game, ctx) => {
    const st = game.state, H = st.armoury.range.house;
    if (code === null) { code = H.draw?.code ?? 'A'; parS = [...H.rooms, H.hall].map(L => (Number.isFinite(L.parMs) ? L.parMs / 1000 : null)); }
    if (ctx.onLane) {
      const area = st.places?.live?.area, now = st.clock.ms, S = st.stop;
      for (const [who, pid] of [['#1', st.player.id], ['#2', H.twoPid]]) {
        const a = pid ? st.actors.list.find(x => x.who === pid) : null;
        if (!a) continue;
        const Z = liveZoneAt(st, area, a.x, a.z), L = last[who];
        if (!Z) { delete last[who]; continue; }
        // (still: within REST_MM of where it was REST_MS ago; chosen: your own standing step, as F4's (a stance, a still step, a feet row))
        if (!L || L.zone !== Z.id || D([a.x, a.z], [L.x, L.z]) * 1000 >= REST_MM) { last[who] = { zone: Z.id, x: a.x, z: a.z, fromMs: now, counted: false }; continue; }
        if (now - L.fromMs < REST_MS) continue;
        const chosen = who === '#1' && (standsStill(S?.doing?.step) || !!S?.doing?.still || !!S?.feet?.still || !!a.stance);
        const w = (rest[Z.why ?? 'door'] ??= { ms: 0, n: 0, chosenMs: 0 }), dt = L.counted ? now - L.atMs : now - L.fromMs;
        if (chosen) w.chosenMs += dt; else { w.ms += dt; if (!L.counted) { w.n++; if (restWhat.length < 4) restWhat.push(`${who} in ${Z.id} (${Z.why}) at ${fmt(a.x, 2)}, ${fmt(a.z, 2)} from ${fmt((L.fromMs - (H.goAtMs ?? 0)) / 1000, 2)} s`); } }
        L.counted = true; L.atMs = now;
      }
    }
    o.more?.(game, ctx);
  };
  const rec = drawnLane({ ...o, more });
  return { ...rec, code, parS, rest, restWhat };
}
/** F76 over the honest tier one's eight-room lanes (roomsLane's): the row, each chunk's share printed. */
export function f76(recs) {
  const T1 = recs.filter(r => r.tier === 'tierone' && r.bot === 'honest'), by = {};
  for (const r of T1) {
    const H = parseHouse(r.code);
    if (!H) continue;
    H.rooms.forEach((R, k) => { const t = r.legS?.[k], p = r.parS?.[k]; if (!Number.isFinite(t) || !Number.isFinite(p)) return; const b = (by[R.letter] ??= { n: 0, ok: 0 }); b.n++; if (t <= p + 1e-9) b.ok++; });
  }
  const shares = Object.entries(by).map(([l, b]) => [l, b.ok / b.n, b.n]), worst = shares.reduce((w, x) => (!w || x[1] < w[1] ? x : w), null);
  const lanes = T1.map(r => r.laneS).filter(Number.isFinite), pars = T1.map(r => (r.parS ?? []).reduce((a, x) => a + (x ?? 0), 0)).filter(x => x > 0);
  const over = T1.filter(r => !(r.laneS <= LANE_MAX_S + 1e-9)), m = mean(lanes), mp = mean(pars);
  const met = T1.length > 0 && shares.every(([, sh]) => sh >= ROOM_PAR_SHARE - 1e-9) && !over.length && m <= DRAWN_LANE_K * mp + 1e-9;
  return { id: 'F76', name: 'eight-room lanes: each room within its par on 90% of its lanes, every lane at most 60 s, the mean within 1.10 × the summed par', met,
    value: `${T1.length} lanes; the rooms within their par ${shares.map(([l, sh, n]) => `${l} ${fmt(sh * 100, 0)}% of ${n}`).join(', ')}${worst ? ` (the least ${worst[0]})` : ''}; over ${LANE_MAX_S} s ${over.length}${over.length ? ` (${over.slice(0, 3).map(r => `${r.seed} ${s1(r.laneS)} s`).join(', ')})` : ''}; the mean lane ${s1(m)} s against ${s1(DRAWN_LANE_K * mp)} (1.10 × the mean par ${s1(mp)} s)`, target: `each room ≥ ${ROOM_PAR_SHARE * 100}%, 0 over ${LANE_MAX_S} s, mean ≤ ${DRAWN_LANE_K} × par` };
}
/** F77 over lanes (roomsLane's): the honest and keys bots 0 unchosen rests; the fuzz printed. */
export function f77(recs) {
  const held = recs.filter(r => r.bot === 'honest' || r.bot === 'keys'), fuzz = recs.filter(r => r.bot === 'fuzz');
  const sumBy = (rs) => { const o = {}; for (const r of rs) for (const [w, v] of Object.entries(r.rest ?? {})) { const q = (o[w] ??= { ms: 0, n: 0, chosenMs: 0 }); q.ms += v.ms; q.n += v.n; q.chosenMs += v.chosenMs; } return o; };
  const H = sumBy(held), F = sumBy(fuzz), n = Object.values(H).reduce((a, v) => a + v.n, 0);
  const words = (o) => Object.entries(o).map(([w, v]) => `${w} ${v.n} (${s2(v.ms / 1000)} s; chosen ${s2(v.chosenMs / 1000)} s)`).join(', ') || 'none';
  return { id: 'F77', name: 'nobody at rest in a no-stop zone of any why but by choice', met: held.length > 0 && n === 0,
    value: `the honest and keys bots over ${held.length} lanes: ${words(H)}${n ? ` (${held.flatMap(r => r.restWhat).slice(0, 3).join('; ')})` : ''}${fuzz.length ? `; the fuzz over ${fuzz.length} lanes: ${words(F)}` : ''}`, target: '0 rests by the honest and keys bots' };
}
/** The rows of ROOMS_ENFORCED not met, as failing()'s lines. */
export const roomsFailing = (rows) => rows.filter(r => ROOMS_ENFORCED.has(r.id) && !r.met).map(r => `${r.id} ${r.name}: ${r.value}`);

/** The zones of a drawn house by why (the tests print them): { [why]: n }. */
export const zoneWhys = (areaId) => zonesOf(areaId).reduce((o, Z) => ({ ...o, [Z.why]: (o[Z.why] ?? 0) + 1 }), {});
