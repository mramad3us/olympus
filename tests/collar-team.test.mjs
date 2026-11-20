// OLYMPUS tests: the fire team of four aboard the Patient Mule, "Away the boarding party" (v0.0.27, its build sheet §1 C, §6 C; F162, F163's Four half, F164's NPC half; FT§6, FT§7.1).
//
// The holders (src/sim/combat/holders.js) are driven here on the hauler's deck by their own tick, the scene's actors layer's call
// (D's houseActors) not being in this tree: tests/boarding-world.mjs's world at 0 G, the barricade's post 1a manned by one of its men
// (scripted: he stands in a pirate's issue, B's 'boarding-pirate', and does not tick; his down is the one rule's, B's real strike through the
// lane's shot path), the four in the
// lock, the lock's inner hatch undogged as the override leaves it, GO given; each tick the clock is moved on a tick, the body domain's
// woundsFast run (the stance) and each holder's holderTick (and, with `fight`, the man's own tick, opfor.js opforTick: A's brain, which reads
// the deck's compartments aboard, never the lane's plans). Your number two ("Four") is tested on the house's live lane with the ledger's rule 'real' (stepped by
// the game itself): he covers you while your stance is down, and takes his own tourniquet. planTurn (team.js) by itself and in the runs.
// Every case prints its numbers six spaces in.
import { assert, fmt } from './helpers.mjs';
import { createGame } from './game.mjs';
import { boardingWorld } from './boarding-world.mjs';
import { fillHolders, holderTick, holderNow, holdersPosted, HOLD_SECTOR_DEG, AT_POST_M } from '../src/sim/combat/holders.js';
import { fireTeamOf, planTurn, labelOf, ownerOf, TEAM_WORDS } from '../src/sim/combat/team.js';
import { twoTick, holdsFireOn } from '../src/sim/combat/two.js';
import { HAULER_HOLDERS, HAULER_POSTS, HAULER_START, HAULER_ID } from '../src/data/places/hauler.js';
import { SHIPS } from '../src/data/places/ships.js';
import { HAULER_ROLES } from '../src/data/courses.js';
import { breakOpening } from '../src/sim/combat/op.js';
import { woundsFast } from '../src/sim/body/domain.js';
import { applyHit, downOf, hasWounds } from '../src/sim/body/wounds.js';
import { tourniquetOf, TQ_MS } from '../src/sim/body/aid.js';
import { newLedger, realOf } from '../src/sim/combat/would.js';
import { lineMasked, lineFromOf } from '../src/sim/arms/carry.js';
import { move, issueBoarding, sparesOf } from '../src/sim/arms/kit.js';
import { gunOn } from '../src/sim/arms/shooting.js';
import { CQB_RULES } from '../src/sim/skills/instinct/cqb.js';
import { opforTick } from '../src/sim/scenarios/opfor.js';
import { seenK } from '../src/sim/combat/men.js';
import { SEEN } from '../src/sim/people/perception.js';
import { doorsStep } from '../src/sim/places/doors.js';
import { sightGridOf } from '../src/sim/places/sight.js';
import { leafClosed } from '../src/sim/places/model.js';

const TICK = 50, LOCK = 'o:mu:d2:lock';
const s2 = (v) => fmt(v, 2);
const actorOf = (s, pid) => s.actors.list.find(a => a.who === pid) ?? null;
const put = (a, [x, z], headRad = null) => { a.x = x; a.z = z; a.$px = x; a.$pz = z; delete a.path; if (headRad !== null) { a.headRad = headRad; } };

/**
 * The deck at GO (see the header): { w, s, H, Q, T (the man at 1a), man(), facts, bus, run(ms, each), says(pid) }. opts: tier, seed, at
 * (where the man stands, 1a's post by default), you, four ([x, z] or null for the lock's start places).
 */
function deck({ tier = 'sgt', seed = 48213, at = null, you = null, four = null, fight = false } = {}) {
  const w = boardingWorld({ seed, tier, room: 'bunks', men: 1 }), s = w.s, H = w.H, facts = [];
  const bus = { emit(type, f) { facts.push({ type, ...f }); } };
  const T = w.men[0].T, P = HAULER_POSTS.find(p => p.stand === '1a'), spot = at ?? P.at, a = w.men[0].actor();
  // (a pirate's issue in place of the role-player's training carrier and marking rounds (B's kit.js issueBoarding: the chest rig, the R-7 with ball))
  issueBoarding(s, T.live.who, 'boarding-pirate');
  Object.assign(T, { stand: '1a', room: P.room, x: spot[0], z: spot[1], name: HAULER_ROLES['1a'].name });
  put(a, spot, Math.PI); a.face = 'left';
  put(w.me(), you ?? HAULER_START[2].at, 0);
  if (w.two()) put(w.two(), four ?? HAULER_START[3].at, 0);
  const Q = fillHolders(s, HAULER_HOLDERS);
  breakOpening(s, LOCK, s.clock.ms);
  H.goAtMs = s.clock.ms;
  const t0 = s.clock.ms;
  const run = (ms, each = null) => {
    for (let t = 0; t < ms; t += TICK) {
      s.clock.ms += TICK; s.clock.tick = (s.clock.tick ?? 0) + 1;
      woundsFast(s, {});
      for (const m of Q.men) holderTick(s, bus, m.pid);
      if (fight) opforTick(s, bus, s.armoury.range, H, s.clock.ms);
      if (each && each(s.clock.ms - t0) === false) break;
    }
  };
  return { w, s, H, Q, T, t0, man: () => a, facts, bus, run, says: (pid) => facts.filter(f => f.type === 'say' && f.who === pid).map(f => f.text) };
}
// (the holders' rounds fired, from the shot facts: { who, at, muzzle, target })
const roundsOf = (d) => d.facts.filter(f => f.type === 'shot' && f.fired && d.Q.men.some(m => m.pid === f.who));

// (the barricade man's runs (see the case): each sheet's holders on 1a, his down time, their rounds and words, every round's line checked)
function barricade(tiers, { fight = false } = {}) {
  const rows = [], bad = [];
  for (const tier of tiers) {
    const d = deck({ tier, fight }), { s, Q, T } = d;
    let downAt = null;
    d.run(40_000, (ms) => { if (downAt === null && (T.live.st === 'down' || d.man().stance === 'down')) downAt = ms; return downAt === null || ms < downAt + 3000; });
    const r = roundsOf(d);
    // (each round's line at its tick against the other marines' bodies where they stand: none masked)
    for (const f of r) {
      const others = fireTeamOf(s).filter(m => m.pid !== f.who).map(m => actorOf(s, m.pid) ?? (s.player.id === m.pid ? d.w.me() : null)).filter(Boolean);
      const hit = lineMasked(f.muzzle, { x: T.x, y: 1.35, z: T.z }, others.map(b => ({ x: b.x, z: b.z, stance: b.stance ?? 'stand' })));
      if (hit) bad.push(`${tier}: ${f.id} through ${JSON.stringify(hit)}`);
    }
    const tl = Q.men[0], ar = Q.men[1], W = d.H.two;
    // (a holder's round on the lane's shot path counted on his record, never on your #2's (shoothouse.js houseShot, C's outside hunk);
    // its hit named by the holder's pid with the flag, and the real strike's ledger entry by him too (the review of v0.0.27: 'holder'
    // named no shooter, so would.js shooterPid gave none))
    const holderPid = (by) => Q.men.some(m => m.pid === by), logBy = (h) => (d.H.live?.would?.log ?? []).find(x => x.shotId === h.shotId)?.by ?? null;
    if (W.fired || (W.shots ?? []).length || W.hits || T.hits.some(h => !h.holder || !holderPid(h.by) || logBy(h) !== h.by)) bad.push(`${tier}: your #2's record ${W.fired} fired, ${(W.shots ?? []).length} kept, hits by ${T.hits.map(h => `${h.by}${h.holder ? '(holder)' : ''}/${logBy(h)}`).join(',')}`);
    if (tier === tiers[0]) console.log(`      ${tier}: the hits on him by ${T.hits.map(h => `${labelOf(s, h.by) ?? h.by}${h.holder ? ' (holder)' : ''}, the ledger's ${labelOf(s, logBy(h)) ?? logBy(h)}`).join('; ') || 'none'}`);
    const hurt = Q.men.filter(m => hasWounds(s.people[m.pid].body)).map(m => `#${m.n} ${s.people[m.pid].body.injuries.map(i => i.name).join(', ')}`);
    rows.push({ tier, setMs: Q.setMs === null ? null : Q.setMs - d.t0, downAt, tl: `${tl.fired}/${tl.hits}`, ar: `${ar.fired}/${ar.hits}`, words: [...d.says(tl.pid), ...d.says(ar.pid)].join(' '), rounds: r.length, his: T.live.fired ?? 0, hurt });
  }
  // (v0.0.27's carried stage: "Set." not yet said when the run stops (the man down on their walk, the run ended 3 s after) printed so, not as a negative time)
  for (const x of rows) console.log(`      ${x.tier}${fight ? ' (he fights back)' : ''}: set ${x.setMs === null ? 'not yet' : `${s2(x.setMs / 1000)} s after GO`}, the man down ${x.downAt === null ? 'never (40 s)' : `${s2(x.downAt / 1000)} s after GO${x.setMs === null ? '' : `, ${s2((x.downAt - x.setMs) / 1000)} s after "Set."`}`}; rounds fired/hit TL ${x.tl}, AR ${x.ar}${fight ? `; his rounds ${x.his}; the holders hurt: ${x.hurt.join('; ') || 'none'}` : ''}; their words ${x.words}`);
  console.log(`      rounds through a marine, or counted as your #2's: ${bad.length}${bad.length ? ` (${bad.slice(0, 3).join('; ')})` : ''}`);
  assert(!bad.length, JSON.stringify(bad));
  assert(rows.every(x => x.rounds > 0 && x.downAt !== null), JSON.stringify(rows));
  assert(rows.every(x => /Contact forward!/.test(x.words)), JSON.stringify(rows.map(x => x.words)));
}

// (your #2 on the house's live lane, the ledger's rule 'real' but for 'wound' (as built), you or he hit in the arm at the setup: the
// clock run `ticks` ticks, X at every pause, a move key once the knock is past for you; his cover, his tourniquet, his words)
function fourRun(who, ticks) {
  const LEAVE = (st) => (st.stop?.mode === 'stop' && st.stop.phase === 'choose' ? { act: [{ act: 'stop', args: { step: 'leave', tempo: 'normal' } }] } : {});
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'room:2', opfor: 'live' }), s = g.state, H = s.armoury.range.house, W = H.two;
  if (who !== 'wound') H.live.would = newLedger('real');
  const pid = who === 'two' ? H.twoPid : s.player.id, t0 = s.clock.ms, says = [];
  applyHit(s, g.bus, { onId: pid, part: 'armL', w: 1.5, margin: 4, shotId: 'collar-team-four', fromId: null, through: false, atMs: t0 });
  let coverMs = 0, downMs = 0, aidFrom = null, aidTo = null, upAt = null;
  for (let k = 0; k < ticks; k++) {
    const a = pid === s.player.id ? g.me() : actorOf(s, pid);
    // (you up by a move key as soon as the knock lets you (the body domain's player rule); his "Up." ends your run)
    const getUp = pid === s.player.id && a.stance === 'down' && !downOf(s.people[pid].body, s.clock.ms).down;
    g.step(1, getUp ? { mx: 1, mz: 0 } : LEAVE);
    if (a.stance === 'down') downMs += TICK;
    if (W.cover && a.stance === 'down') coverMs += TICK;
    if (W.aid && aidFrom === null) aidFrom = s.clock.ms - t0;
    if (aidFrom !== null && !W.aid && aidTo === null) aidTo = s.clock.ms - t0;
    if (upAt === null && downMs > 0 && a.stance !== 'down') upAt = s.clock.ms - t0;
    for (const f of g.facts('say')) if (f.who === H.twoPid) says.push(`${s2((s.clock.ms - t0) / 1000)} "${f.text}"`);
    g.clearFacts?.();
    if (who === 'me' && says.some(x => /"Up\."/.test(x))) break;
  }
  const inj = s.people[pid].body.injuries.find(i => i.kind === 'cut');
  return { real: realOf(s), downMs, coverMs, aidFrom, aidTo, upAt, says, cared: inj?.cared ?? null, errors: g.errors.length };
}

// (a holder's spare magazines' items (kit.js sparesOf's ids))
const sparesOfIds = (s, pid) => sparesOf(s, pid, null).map(id => s.items[id]);
// (your #2's row on his own man of the live lane (two rounds due, his rifle off safe and aimed as twoPlan leaves it), the man's hands up
// as a give the tick the row was planned, you 3 m behind your #2 off his line, the ledger 'real' but for 'wound' (as built): his rounds after)
function fourHold(rule) {
  const g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'room:2', opfor: 'live' }), s = g.state, H = s.armoury.range.house, W = H.two;
  if (rule === 'real') H.live.would = newLedger('real');
  const T = s.armoury.range.turners.find(t => t.live && ownerOf(s, t) === 2), now = s.clock.ms;
  s.items[gunOn(s, H.twoPid)].mode = 'semi'; s.people[H.twoPid].kit.carry.posture = 'aimed';
  W.eng = { key: T.key, row: 'pair', follow: 0, rounds: [{ atMs: now + 100, part: 'torso', follow: 0, climbK: 1, i: 0, n: 2 }, { atMs: now + 350, part: 'torso', follow: 1, climbK: 1, i: 1, n: 2 }] };
  T.live.st = 'hands'; T.face = 'noshoot'; T.holds = 'hands';
  const two = actorOf(s, H.twoPid), me = g.me(), dx = two.x - T.x, dz = two.z - T.z, l = Math.hypot(dx, dz);
  put(me, [two.x + dx / l * 3, two.z + dz / l * 3]);
  const fired0 = W.fired;
  g.step(1, { act: [{ act: 'stop', args: { step: 'leave', tempo: 'normal' } }] });
  for (let k = 0; k < 20; k++) g.step(1, {});
  return { fired: W.fired - fired0, eng: !!W.eng, why: holdsFireOn(s, T) };
}

export default [
  {
    name: 'the holders go through the lock\'s inner hatch at GO and set on their posts, the AR on the deckhead out of the leader\'s line; "Set." by the leader once both are set; nobody off his post after it; every word of theirs a bubble at its speaker (a say with who, never voiced) (v0.0.27 F162; FT§6.2)',
    fn() {
      const d = deck({ at: [11.0, 9.0] }), { s, Q } = d;
      // (no man in their sector: the passage empty, the man put in the bunk room behind its wall)
      let setAt = null, worst = 0;
      d.run(14_000, (ms) => {
        if (Q.setMs !== null && setAt === null) setAt = ms;
        if (setAt !== null) for (const m of Q.men) { const a = actorOf(s, m.pid); worst = Math.max(worst, Math.hypot(a.x - m.at[0], a.z - m.at[1])); }
      });
      const [tl, ar] = Q.men, A = actorOf(s, tl.pid), B = actorOf(s, ar.pid);
      const says = d.facts.filter(f => f.type === 'say' && Q.men.some(m => m.pid === f.who));
      console.log(`      the leader ${tl.pid} at (${s2(A.x)}, ${s2(A.z)}) on the ${A.onFace ?? 'deck'}, ${tl.st}; the AR ${ar.pid} at (${s2(B.x)}, ${s2(B.z)}) on the ${B.onFace ?? 'deck'}, ${ar.st}; "Set." at ${s2(setAt / 1000)} s after GO; off his post after it, worst ${s2(worst)} m`);
      console.log(`      their words: ${says.map(f => `${f.who === tl.pid ? 'TL' : 'AR'} "${f.text}"`).join(', ')}; the fire team: ${fireTeamOf(s).map(m => `#${m.n} ${m.role}${m.holder ? ' (holds)' : ''} "${labelOf(s, m.pid)}"`).join(', ')}`);
      assert(tl.st === 'set' && ar.st === 'set' && Math.hypot(A.x - tl.at[0], A.z - tl.at[1]) <= AT_POST_M && Math.hypot(B.x - ar.at[0], B.z - ar.at[1]) <= AT_POST_M, JSON.stringify({ tl: holderNow(s, tl.pid), ar: holderNow(s, ar.pid) }));
      assert(B.onFace === 'deckhead' && (A.onFace ?? 'deck') === 'deck', JSON.stringify({ A: A.onFace, B: B.onFace }));
      assert(setAt !== null && setAt < 13_000 && worst <= AT_POST_M, JSON.stringify({ setAt, worst }));
      assert(says.length === 1 && says[0].text === TEAM_WORDS['hold:set'].words && says[0].who === tl.pid && says.every(f => f.kind === 'speech'), JSON.stringify(says));
      assert(fireTeamOf(s).map(m => m.n).join() === '1,2,3,4' && labelOf(s, s.player.id) === 'you' && labelOf(s, d.H.twoPid) === 'Four', JSON.stringify(fireTeamOf(s)));
    },
  },
  {
    name: 'the lock\'s inner hatch the leader opens at GO is open to sight once its leaf has swung: the cached sight grid\'s leaf agrees with leafClosed at every tick (the review of v0.0.27 D: holders.js lockTick set the swing without registering it with doors.js, so the grid read the hatch shut for the whole lane and a save, which finds its moving leaves from the deltas, went another way)',
    fn() {
      const d = deck({ at: [11.0, 9.0] }), { s } = d;
      const g = sightGridOf(s, HAULER_ID), leaf = () => g.leaves.find(l => l.id === LOCK);
      let disagree = 0, firstOpen = null, ticks = 0;
      d.run(10_000, (ms) => {
        doorsStep(s);
        ticks++;
        if (!leafClosed(s, LOCK, s.clock.ms) && firstOpen === null) firstOpen = ms;
        if (leaf().closed !== leafClosed(s, LOCK, s.clock.ms)) disagree++;
      });
      console.log(`      the hatch's leaf open to leafClosed at ${firstOpen === null ? 'never' : `${s2(firstOpen / 1000)} s`} after GO; the cached sight leaf closed ${leaf().closed} at the end; ticks where the two disagree ${disagree} of ${ticks}; moving now ${[...(s.$places?.moving ?? [])].join() || 'none'}`);
      assert(firstOpen !== null && leaf().closed === false && disagree === 0, JSON.stringify({ firstOpen, closed: leaf().closed, disagree, ticks }));
    },
  },
  {
    name: 'the holders on the barricade man (1a, 7 m down the passage behind the damage-control locker), the boot recruit\'s sheet (both holders fire): his down time printed, both holders\' rounds and hits, "Contact forward!" once; no round of theirs through a marine (v0.0.27 F162; FT§17 risk 2, the sheet\'s §11 risk 4; the six sheets in the heavy twin)',
    fn() { barricade(['recruit']); },
  },
  {
    name: 'on their walk to their posts the holders stop and fight an armed man in their sector (the barricade man fighting back, the sergeant\'s sheet): the leader\'s pair from where he stands, the AR stopped behind him and never walking into him, neither holder hurt, both on to their posts after and "Set." (v0.0.27\'s carried stage, the lead\'s call on C\'s barricade twin: on D\'s posts they walked on at low ready, finger off, 7 s down the passage while he shot both in the chest)',
    fn() {
      const d = deck({ tier: 'sgt', fight: true }), { s, Q, T } = d, A = () => Q.men.map(m => actorOf(s, m.pid));
      let downAt = null, halt = null, gapM = Infinity;
      d.run(30_000, (ms) => {
        const [tl, ar] = A();
        gapM = Math.min(gapM, Math.hypot(tl.x - ar.x, tl.z - ar.z));
        if (halt === null && Q.men[0].st === 'go' && !Q.men[0].walk) halt = { ms, x: tl.x, z: tl.z };
        if (downAt === null && T.live.st === 'down') downAt = ms;
        return Q.setMs === null;
      });
      const hurt = Q.men.filter(m => hasWounds(s.people[m.pid].body)).map(m => m.n), post = Q.men.map(m => { const a = actorOf(s, m.pid); return s2(Math.hypot(a.x - m.at[0], a.z - m.at[1])); });
      console.log(`      the leader stopped at ${halt ? `${s2(halt.ms / 1000)} s after GO, at (${s2(halt.x)}, ${s2(halt.z)}), ${s2(Q.men[0].at[0] - halt.x)} m short of his post` : 'never'}; the man down ${downAt === null ? 'never' : `${s2(downAt / 1000)} s after GO`}, his rounds ${T.live.fired ?? 0}; TL ${Q.men[0].fired}/${Q.men[0].hits}, AR ${Q.men[1].fired}/${Q.men[1].hits}; the holders hurt: ${hurt.join(', ') || 'none'}; the two never nearer than ${s2(gapM)} m; "Set." ${Q.setMs === null ? 'never' : `${s2((Q.setMs - d.t0) / 1000)} s after GO`}, off their posts ${post.join(' and ')} m`);
      assert(halt && downAt !== null && downAt < 7_000 && !hurt.length && gapM >= 0.5 && Q.setMs !== null && post.every(x => +x <= AT_POST_M), JSON.stringify({ halt, downAt, hurt, gapM, setMs: Q.setMs, post }));
    },
  },
  {
    name: 'never through a marine: you standing on the holders\' line down the passage, their rounds held a tick at a time, "Line!" once a hold, nobody stepping off his post; you off it, they fire (v0.0.27 F162; COMBAT §25.19.3.5)',
    fn() {
      const d = deck({ you: [7.4, 5.0] }), { s, Q, T } = d, me = d.w.me();
      let heldMs = 0, firedHeld = 0, moved = false, after = 0, worst = 0;
      d.run(30_000, (ms) => {
        const n = roundsOf(d).length;
        if (!moved) { if (Q.men.some(m => m.masked)) heldMs += TICK; firedHeld = n; if (heldMs >= 3000) { put(me, HAULER_START[2].at); moved = true; } }
        else after = n - firedHeld;
        if (Q.setMs !== null) for (const m of Q.men) { const a = actorOf(s, m.pid); worst = Math.max(worst, Math.hypot(a.x - m.at[0], a.z - m.at[1])); }
        return !(moved && T.live.st === 'down');
      });
      const lines = d.facts.filter(f => f.type === 'say' && f.text === TEAM_WORDS.line.words);
      console.log(`      held ${s2(heldMs / 1000)} s with you at (7.4, 5.0) on their line: rounds fired meanwhile ${firedHeld}; "Line!" ${lines.length} (${lines.map(f => (f.who === Q.men[0].pid ? 'TL' : 'AR')).join(', ')}); holds counted ${Q.men.map(m => m.holds ?? 0).join(' and ')}; after you stepped off: ${after} rounds, the man ${T.live.st}; off his post at worst ${s2(worst)} m`);
      assert(heldMs >= 3000 && firedHeld === 0, JSON.stringify({ heldMs, firedHeld }));
      assert(lines.length >= 1 && lines.length <= Q.men.length && worst <= AT_POST_M, JSON.stringify({ lines: lines.length, worst }));
      assert(after > 0, JSON.stringify({ after }));
    },
  },
  {
    name: 'a holder\'s round that missed a man is heard by him from where the holder stands: the near miss on his pool and his eye drawn onto that holder, never onto Four (opfor.js newsOf, C\'s outside hunk: the holders\' rounds on their own records)',
    fn() {
      const d = deck({ at: [11.0, 9.0] }), { s, Q, T, H } = d, L = T.live, tl = Q.men[0];
      d.run(13_000);
      // (a round of the leader's at the man that missed, on his record as fireTick keeps it; then the man's own tick (A's brain) once)
      const now = s.clock.ms, id = 'collar-team-miss';
      tl.shots.push({ id, atMs: now, key: T.key, hit: false });
      const known = L.known[`m:${tl.pid}`], before = JSON.stringify(L.drawn ?? null);
      opforTick(s, d.bus, s.armoury.range, H, now);
      console.log(`      the man (at ${T.x}, ${T.z}, out of their sight) knew the leader ${known !== undefined}; his eye drawn before ${before}, after ${JSON.stringify(L.drawn ?? null)}; your #2's record ${(H.two.shots ?? []).length} kept`);
      assert(L.drawn?.key === `m:${tl.pid}` && !(H.two.shots ?? []).length, JSON.stringify({ drawn: L.drawn, two: H.two.shots }));
    },
  },
  {
    name: 'a man already down in their sector is no contact: neither holder takes him in nor calls him ("Contact forward!", "Contact!"), the leader still says "Set."; the same man up is called (the review of v0.0.27: the AR\'s "Contact!" after "Set." on the barricade man already down, five sheets of six)',
    fn() {
      const out = {};
      for (const down of [true, false]) {
        const d = deck({ tier: 'sgt' }), { T, Q } = d;
        if (down) { T.live.st = 'down'; d.man().stance = 'down'; }
        d.run(12_000);
        const words = [...d.says(Q.men[0].pid), ...d.says(Q.men[1].pid)];
        out[down ? 'down' : 'up'] = { words, eyes: Q.men.filter(m => m.eyes || m.known?.[T.key] !== undefined).length, set: Q.setMs !== null && Q.setMs !== undefined };
      }
      console.log(`      the man down from GO: their words ${out.down.words.join(' ') || 'none'}, holders who took him in ${out.down.eyes}; the man up: ${out.up.words.join(' ')}`);
      assert(out.down.set && !out.down.words.some(x => /Contact/.test(x)) && out.down.words.includes('Set.') && out.down.eyes === 0 && out.up.words.some(x => /Contact/.test(x)), JSON.stringify(out));
    },
  },
  {
    name: 'their sector: a man seen in the passage outside 30° either side of a holder\'s aim is never taken in nor fired on; the same man inside it is (v0.0.27 F162; HOLD_SECTOR_DEG)',
    fn() {
      const out = [], spots = { outside: [4.3, 4.3], inside: [8.5, 5.0] };
      for (const [k, at] of Object.entries(spots)) {
        const d = deck({ at }), { s, Q, T } = d;
        let seen = 0;
        d.run(13_000, () => { if (Q.men.some(m => holderNow(s, m.pid).seen.includes(T.key))) seen++; });
        const ang = Q.men.map(m => fmt(Math.abs(Math.atan2(at[1] - m.at[1], at[0] - m.at[0]) - Math.atan2(m.aimAt[1] - m.at[1], m.aimAt[0] - m.at[0])) * 180 / Math.PI, 1));
        const vis = Q.men.map(m => fmt(seenK(s, actorOf(s, m.pid), T, s.clock.ms), 2));
        out.push({ k, at, ang, vis, rounds: roundsOf(d).length, seen, known: Q.men.map(m => m.known[T.key] !== undefined) });
      }
      for (const x of out) console.log(`      ${x.k} (${x.at.join(', ')}): ${x.ang.join('° and ')}° off the TL's and the AR's aims (the sector ±${HOLD_SECTOR_DEG}°), seen from their eyes ${x.vis.join(' and ')} (SEEN ${SEEN}); ticks seen in sector ${x.seen}, taken in ${x.known.join('/')}, rounds ${x.rounds}`);
      assert(out[0].vis.every(v => Number(v) >= SEEN) && out[0].rounds === 0 && out[0].known.every(k => !k) && out[0].seen === 0, JSON.stringify(out[0]));
      assert(out[1].rounds > 0, JSON.stringify(out[1]));
    },
  },
  {
    name: 'hors de combat: no holder round at a man with his hands up, nor at one with no weapon in his hands; a man who gives once a pair is planned on him gets none of it (v0.0.27 F155\'s holder half; COMBAT §7.10)',
    fn() {
      const out = [];
      for (const k of ['hands', 'unarmed', 'gives']) {
        const d = deck(), { s, Q, T } = d, L = T.live;
        if (k === 'hands') { L.st = 'hands'; T.face = 'noshoot'; T.holds = 'hands'; }
        if (k === 'unarmed') { const id = gunOn(s, L.who); move(s, id, { ground: { area: s.places.live.area, x: T.x, z: T.z } }); }
        let gaveAt = null, atGive = 0;
        d.run(13_000, (ms) => {
          // (his hands up the tick a holder's pair is planned on him, before its first round)
          if (k === 'gives' && gaveAt === null && Q.men.some(m => m.eng)) { gaveAt = ms; atGive = roundsOf(d).length; L.st = 'hands'; T.face = 'noshoot'; T.holds = 'hands'; }
        });
        out.push({ k, why: holdsFireOn(s, T), rounds: roundsOf(d).length, atGive, gaveAt });
      }
      for (const x of out) console.log(`      ${x.k}: the holders' read "${x.why}", rounds ${x.rounds}${x.k === 'gives' ? ` (${x.atGive} before his hands came up at ${s2(x.gaveAt / 1000)} s, a pair planned on him)` : ''}`);
      assert(out[0].rounds === 0 && out[0].why === 'hands', JSON.stringify(out[0]));
      assert(out[1].rounds === 0 && out[1].why === 'unarmed', JSON.stringify(out[1]));
      assert(out[2].gaveAt !== null && out[2].rounds === out[2].atGive, JSON.stringify(out[2]));
    },
  },
  {
    name: 'Four never fires at a man whose hands came up while his row was under way, on the one rule made real: the row cut at its next round (v0.0.27 F155\'s Four half; two.js holdsFireOn; the live lane\'s rule as built, which fires it, in the heavy controls)',
    fn() {
      const r = fourHold('real');
      console.log(`      the rule real: Four's rounds after the hands came up ${r.fired} (his read "${r.why}", his row ${r.eng ? 'still on' : 'cut'})`);
      assert(r.fired === 0 && !r.eng && r.why === 'hands', JSON.stringify(r));
    },
  },
  {
    name: 'a holder with nothing left to load (every magazine of his empty, the chamber too) holds his post silent: no round, no "Reloading!" over and over, his rifle down for good (holders.js m.dry; my call: no transition to his P-12 this round)',
    fn() {
      const d = deck(), { s, Q } = d;
      for (const m of Q.men) {
        const gun = s.items[gunOn(s, m.pid)];
        delete gun.chamber;
        for (const [, it] of Object.entries(s.items)) if (it.type === 'mag' && it.fam === s.items[gun.mag].fam && (it === s.items[gun.mag] || sparesOfIds(s, m.pid).includes(it))) it.n = 0;
      }
      d.run(13_000);
      const words = Q.men.map(m => d.says(m.pid).filter(w => w === TEAM_WORDS.reloading.words).length), dry = Q.men.map(m => !!m.dry);
      console.log(`      rounds ${roundsOf(d).length}; "Reloading!" said ${words.join(' and ')} times; dry ${dry.join('/')}; their words ${Q.men.map(m => d.says(m.pid).join(' ')).join(' | ')}`);
      assert(roundsOf(d).length === 0 && words.every(n => n <= 1) && dry.some(Boolean), JSON.stringify({ words, dry }));
    },
  },
  {
    name: 'a holder hit in the arm: "I\'m hit!", down while his stance is, his tourniquet his knock over (B\'s tourniquetOf and applyTourniquet, TQ_MS), the bleed stopped and cared \'tourniquet\', up at his post, set again; never off it (v0.0.27 F164\'s NPC half; FT§6.2 level 2, FT§7.1)',
    fn() {
      const d = deck({ at: [11.0, 9.0] }), { s, Q } = d, tl = Q.men[0];
      d.run(15_000);
      assert(tl.st === 'set', JSON.stringify(holderNow(s, tl.pid)));
      const rec = () => s.people[tl.pid].body, hitAt = s.clock.ms - d.t0;
      applyHit(s, d.bus, { onId: tl.pid, part: 'armL', w: 1.5, margin: 4, shotId: 'collar-team-arm', fromId: null, through: false, atMs: s.clock.ms });
      const want = tourniquetOf(rec(), s.clock.ms), knock = downOf(rec(), s.clock.ms);
      let aidFrom = null, aidTo = null, upAt = null, worst = 0;
      d.run(45_000, (ms) => {
        if (tl.aid && aidFrom === null) aidFrom = ms;
        if (aidFrom !== null && !tl.aid && aidTo === null) aidTo = ms;
        if (aidTo !== null && upAt === null && tl.st === 'set') upAt = ms;
        const a = actorOf(s, tl.pid); worst = Math.max(worst, Math.hypot(a.x - tl.at[0], a.z - tl.at[1]));
      });
      const inj = rec().injuries.find(i => i.part === 'armL' && i.kind === 'cut');
      console.log(`      hit at ${s2(hitAt / 1000)} s: ${inj?.name} (${inj?.rate} %/min${inj?.artery ? ', an artery' : ''}), the knock ${s2((knock.untilMs - (hitAt + d.t0)) / 1000)} s; tourniquetOf ${want ? want.part : 'none'}; his tourniquet ${aidFrom === null ? 'never' : `${s2(aidFrom / 1000)} to ${s2(aidTo / 1000)} s (${s2((aidTo - aidFrom) / 1000)} s, TQ_MS ${TQ_MS / 1000} s)`}; cared ${inj?.cared}, bleeding after ${inj && inj.bleed > s.clock.ms}; up and set at ${upAt === null ? 'never' : `${s2(upAt / 1000)} s`}; off his post at worst ${s2(worst)} m; his words ${d.says(tl.pid).join(' ')}`);
      assert(!!want && aidFrom !== null && aidTo !== null && Math.abs((aidTo - aidFrom) - TQ_MS) <= TICK, JSON.stringify({ want: !!want, aidFrom, aidTo }));
      assert(aidFrom >= knock.untilMs - d.t0, JSON.stringify({ aidFrom, knock: knock.untilMs - d.t0 }));
      assert(inj?.cared === 'tourniquet' && !(inj.bleed > s.clock.ms) && upAt !== null && worst <= AT_POST_M, JSON.stringify({ inj, upAt, worst }));
      assert(d.says(tl.pid).includes(TEAM_WORDS['hold:hit'].words), JSON.stringify(d.says(tl.pid)));
    },
  },
  {
    name: 'Four covers you while your stance is down on the one rule made real ("Covering!", your sector his), "Up." once you are up by a move key (v0.0.27 F163\'s Four half; two.js youDown; the live lane\'s rule as built, never, in the heavy controls)',
    fn() {
      const m = fourRun('me', 240);
      console.log(`      you hit (the rule real): down ${s2(m.downMs / 1000)} s, Four covering ${s2(m.coverMs / 1000)} s of it, up at ${s2(m.upAt / 1000)} s; his words ${m.says.join(', ')}`);
      assert(m.real && m.downMs > 0 && m.coverMs >= m.downMs - 2 * TICK && m.says.some(x => /Covering!/.test(x)) && m.says.some(x => /"Up\."/.test(x)) && !m.errors, JSON.stringify(m));
    },
  },
  {
    name: 'the controls on the live lane\'s rule as built (\'wound\'): Four never covers you for your stance down, and fires his row on a man whose hands came up (as v0.0.26), so the two quick cases above are v0.0.27\'s alone',
    heavy: true,
    fn() {
      const w = fourRun('wound', 60), h = fourHold('wound');
      console.log(`      the live lane's rule ('wound'): you down ${s2(w.downMs / 1000)} s, Four covering ${s2(w.coverMs / 1000)} s; his rounds after the hands came up ${h.fired}`);
      assert(!w.real && w.downMs > 0 && w.coverMs === 0 && !w.errors, JSON.stringify(w));
      assert(h.fired > 0, JSON.stringify(h));
    },
  },
  {
    name: 'Four hit in the arm on the one rule made real: "I\'m hit!", down while his stance is, his tourniquet his knock over (25 s, aid.js TQ_MS), the bleed stopped and cared \'tourniquet\', up (v0.0.27 F164\'s Four half; two.js twoHurt)',
    heavy: true,
    fn() {
      const t = fourRun('two', 720);
      console.log(`      Four hit: down ${s2(t.downMs / 1000)} s, his tourniquet ${s2(t.aidFrom / 1000)} to ${s2(t.aidTo / 1000)} s, cared ${t.cared}, up at ${s2(t.upAt / 1000)} s; his words ${t.says.join(', ')}`);
      assert(t.aidFrom !== null && t.aidTo - t.aidFrom >= TQ_MS - TICK && t.cared === 'tourniquet' && t.upAt !== null && t.says.some(x => /I'm hit!/.test(x)) && !t.errors, JSON.stringify(t));
    },
  },
  {
    name: 'the holders on the barricade man on all six sheets (the quick case\'s twin), standing and fighting back (opfor.js\'s brain): his down time by sheet printed, no round through a marine (v0.0.27 F162; the sheet\'s §11 risk 4)',
    heavy: true,
    fn() { barricade(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone']); barricade(['recruit', 'private', 'cpl', 'sgt', 'raider', 'tierone'], { fight: true }); },
  },
  {
    name: 'one NPC marine\'s plan a tick (team.js planTurn; the sheet\'s §0 item 13): three asking every tick are granted one a tick, round-robin, none waiting over two ticks; with no holders every ask is granted; and holdersPosted puts both on their posts for a setup (v0.0.27; SH§9.1 (c))',
    fn() {
      const d = deck({ at: [11.0, 9.0] }), { s, Q } = d, pids = [Q.men[0].pid, Q.men[1].pid, d.H.twoPid];
      // (and holdersPosted, a setup's (D's 'cabin2' and 'fallback'): both set on their posts at once, the AR on the deckhead, setMs now)
      const t = s.clock.ms;
      holdersPosted(s);
      const posted = Q.men.map(m => { const a = actorOf(s, m.pid); return { st: m.st, off: Math.hypot(a.x - m.at[0], a.z - m.at[1]), face: a.onFace ?? 'deck' }; });
      assert(posted.every(x => x.st === 'set' && x.off <= AT_POST_M) && posted[1].face === 'deckhead' && Q.setMs === t, JSON.stringify({ posted, setMs: Q.setMs, t }));
      const got = Object.fromEntries(pids.map(p => [p, 0])), waits = Object.fromEntries(pids.map(p => [p, 0])), worst = { n: 0 };
      let most = 0;
      for (let k = 0; k < 60; k++) {
        s.clock.ms += TICK;
        let n = 0;
        for (const p of pids) { if (planTurn(s, p, s.clock.ms)) { n++; got[p]++; waits[p] = 0; } else { waits[p]++; worst.n = Math.max(worst.n, waits[p]); } }
        most = Math.max(most, n);
      }
      const g = createGame({ scenario: 'test-shoothouse', seed: 48213, setup: 'room:2' }), free = [1, 2, 3].every(() => planTurn(g.state, g.state.armoury.range.house.twoPid, g.state.clock.ms));
      console.log(`      holdersPosted: ${posted.map(x => `${x.st} ${s2(x.off)} m off on the ${x.face}`).join(', ')}, setMs at the call ${Q.setMs === t}`);
      console.log(`      60 ticks, three asking every tick: granted ${pids.map(p => got[p]).join(', ')} (TL, AR, Four); most granted in one tick ${most}; the longest wait ${worst.n} ticks; with no holders (the house) every ask granted ${free}, R.house.holders ${JSON.stringify(g.state.armoury.range.house.holders ?? null)}`);
      assert(most === 1 && pids.every(p => got[p] >= 19 && got[p] <= 21) && worst.n <= 2, JSON.stringify({ got, most, worst }));
      assert(free && g.state.armoury.range.house.holders === undefined, 'no holders');
    },
  },
  {
    name: 'the fall back called (R.house.boarding.fallback): the holders off the deckhead and back to their places in the lock, Four walking back to his, nothing fired meanwhile; T\'s "Nobody on the passage." only while a holder is down and time runs (cqb-passage, never at a pause) (v0.0.27 item 14; FT§6.2)',
    fn() {
      const d = deck({ at: [11.0, 9.0] }), { s, Q, H } = d;
      d.run(15_000);
      H.boarding.fallback = { atMs: s.clock.ms, by: Q.men[0].pid };
      const two = d.w.two(), R = s.armoury.range;
      let fired = 0, twoIn = null;
      for (let t = 0; t < 30_000; t += TICK) {
        s.clock.ms += TICK; woundsFast(s, {});
        for (const m of Q.men) holderTick(s, d.bus, m.pid);
        twoTick(s, d.bus, R, H, two, s.clock.ms);
        if (twoIn === null && H.two.back?.in) twoIn = s.clock.ms - d.t0;
      }
      fired = roundsOf(d).length;
      const where = Q.men.map(m => { const a = actorOf(s, m.pid); return { n: m.n, st: m.st, off: Math.hypot(a.x - m.start[0], a.z - m.start[1]), face: a.onFace ?? 'deck' }; });
      const to = SHIPS.hauler.spots.two, twoOff = Math.hypot(two.x - to.x, two.z - to.z);
      console.log(`      the holders: ${where.map(x => `#${x.n} ${x.st} ${s2(x.off)} m from his start on the ${x.face}`).join('; ')}; Four ${s2(twoOff)} m from his, in at ${twoIn === null ? 'never' : `${s2(twoIn / 1000)} s`}; rounds fired ${fired}`);
      assert(where.every(x => x.st === 'in' && x.off <= AT_POST_M && x.face === 'deck') && twoOff <= AT_POST_M && fired === 0, JSON.stringify({ where, twoOff, fired }));
      // (T's line, read on the house's live lane with the holders filled there (the instinct's house rules need the lane's plans, which
      // the hauler's are D's): a holder down, time running and not)
      const rule = CQB_RULES.find(r => r.id === 'cqb-passage'), g = createGame({ scenario: 'test-shoothouse', seed: 48213, tier: 'sgt', setup: 'room:2', opfor: 'live' }), gs = g.state;
      const GQ = fillHolders(gs, HAULER_HOLDERS), me = g.me(), ar = actorOf(gs, GQ.men[1].pid);
      const paused0 = gs.stop?.mode === 'stop';
      g.step(1, { act: [{ act: 'stop', args: { step: 'leave', tempo: 'normal' } }] });
      const before = !!rule.when(gs, me, gs.clock.ms);
      ar.stance = 'down';
      const run = !!rule.when(gs, me, gs.clock.ms + 1), held = gs.stop;
      gs.stop = { ...(held ?? {}), mode: 'stop', phase: 'choose' };
      const paused = !!rule.when(gs, me, gs.clock.ms + 2);
      gs.stop = held;
      gs.armoury.range.house.boarding = { fallback: { atMs: gs.clock.ms } };
      const fell = !!rule.when(gs, me, gs.clock.ms + 3);
      console.log(`      cqb-passage (the house's live lane, the holders filled there; stop motion at the setup ${paused0}): both holders up ${before}; the AR down, time running ${run}; at a pause ${paused}; the fall back called ${fell}`);
      assert(!before && run && !paused && !fell, JSON.stringify({ before, run, paused, fell }));
    },
  },
];
