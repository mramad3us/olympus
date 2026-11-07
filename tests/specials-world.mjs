// OLYMPUS tests: a small pairs bay for the specials suites (specials, reloads, steel): the 25 m bay with six turners at 7 and 10 m, the shooter standing on a line with a sheet of exact values, the real loop.
//
// pairsWorld(opts) is the specials role's local fixture for the scene role's test-pairs (the build sheet 0.0.8 §1:
// "small local fixtures in your tests where you need another role's output"): test-handling's 'bench' setup (the
// R-7 in Condition 1 off safe on one magazine of 15, the coach at the shoulder, the real headless game), then the
// session turned into a pairs bay: six turner records as the sheet's §3.1 shapes them ({ key, lane, x, z, y, face,
// holds, turnAtMs, awayAtMs, hits, stoppedAtMs }) 1 m in front of the frames (x 1124.0, PAIRS.turnerX), the shooter
// standing at low ready on the 7 m or 10 m line of their lane (x 1117.0, 1114.0), facing downrange, with the sheet
// asked (exactSheet: Marksmanship, Weapon handling and Awareness at exactly those values under the Warfighting given,
// and the room's rung). The tower's commands are dropped and the session marked ended (R.end), so the fam25 course's
// machinery sleeps while recordShot still keeps every round (its R.shots); the turners' hits and their sensor are the
// scene's, so a test that needs a target down sets T.stoppedAtMs itself. The sheets of COMBAT §25.6.2 (SHEETS) are
// the rows' table's, the build sheet §4's tiers' values; lcpl and recon by the doc's own row.
import { createGame } from './game.mjs';
import { value } from '../src/sim/skills/skills.js';
import { KD_RANGE } from '../src/data/places/range.js';
import { enterStop, leaveStop, gunOn } from '../src/sim/arms/shooting.js';

/** The sheets (Warfighting, Marksmanship, Weapon handling, Awareness, the room's rung): §4 of the build sheet, COMBAT §25.6.2's lance corporal and recon. */
export const SHEETS = Object.freeze({
  recruit: { label: 'boot recruit', wf: 6, mrk: 4, wh: 4, awr: 2, rung: 0 },
  private: { label: 'private', wf: 15, mrk: 10, wh: 10, awr: 6, rung: 1 },
  lcpl: { label: 'lance corporal', wf: 27, mrk: 13, wh: 13, awr: 9, rung: 2 },
  cpl: { label: 'corporal', wf: 34, mrk: 15, wh: 15, awr: 11, rung: 2 },
  sgt: { label: 'sergeant', wf: 44, mrk: 19, wh: 19, awr: 14, rung: 3 },
  recon: { label: 'recon', wf: 60, mrk: 24, wh: 24, awr: 19, rung: 3 },
  raider: { label: 'Raider', wf: 70, mrk: 31, wh: 31, awr: 31, rung: 4 },
  tierone: { label: 'tier one', wf: 93, mrk: 42, wh: 42, awr: 41, rung: 4 },
});
/** The turners' line and the bay's lines (m, x): the sheet's PAIRS. */
export const TURNER_X = 1124.0, LINE_X = Object.freeze({ 7: 1117.0, 10: 1114.0 });

// (the own points that give a value exactly at a Warfighting, weight 1: [base, bg])
function ownFor(v, wf) {
  for (let own = 0; own <= 23; own++) if (Math.round(own * (1 + wf / 100)) === v) return [Math.min(20, own), Math.max(0, own - 20)];
  throw new Error(`no own points give ${v} at Warfighting ${wf}`);
}
/** A soldier's sheet with these values exactly (Marksmanship, Weapon handling, Awareness) and Fitness, and the room's rung. */
export function exactSheet({ wf, mrk, wh, awr, fit = 12, rung = 1 }) {
  const sheet = { cls: 'soldier', os: wf, skills: { marksmanship: ownFor(mrk, wf), weapons: ownFor(wh, wf), awareness: ownFor(awr, wf), fitness: [fit, 0] }, drills: { room: { rung }, passage: { rung } } };
  for (const [k, v] of [['marksmanship', mrk], ['weapons', wh], ['awareness', awr]]) if (value(sheet, k) !== v) throw new Error(`${k} ${value(sheet, k)} not ${v}`);
  return sheet;
}

/**
 * The fixture (see the header). opts: { seed, tier (SHEETS' key) or sheet, line (7 or 10), lane (the shooter's, else the
 * scene's draw), faces ({ <lane>: 'threat' | 'noshoot' | 'armoured' }, the rest 'threat'), turned (lanes facing at the
 * start), safe (the selector on safe), aimAt (a lane: aimed and settled on its turner) }. Returns { g, s, pid, gunId, R, T(lane), key(lane) }.
 */
export function pairsWorld({ seed = 48213, tier = 'private', sheet = null, line = 7, lane = null, faces = {}, turned = [], safe = false, aimAt = null, posture = 'lowReady' } = {}) {
  const g = createGame({ scenario: 'test-handling', seed, hour: 11, setup: 'bench' }), s = g.state, pid = s.player.id;
  const S0 = SHEETS[tier] ?? SHEETS.private, sh = sheet ?? S0;
  s.people[pid].skills = exactSheet({ wf: sh.wf, mrk: sh.mrk, wh: sh.wh, awr: sh.awr, rung: sh.rung });
  s.events = s.events.filter(e => e.kind !== 'range-cmd');
  if (s.stop) leaveStop(s, g.bus, 'scene');
  const R = s.armoury.range, L = lane ?? R.lane, now = s.clock.ms;
  R.lane = L;
  R.cmd = null; R.next = null; R.hot = true;
  R.turners = KD_RANGE.bay.lanes.map(b => ({ key: `turner:${b.lane}`, lane: b.lane, x: TURNER_X, z: b.fp.z, y: 1.35, face: faces[b.lane] ?? 'threat', holds: (faces[b.lane] ?? 'threat') === 'noshoot' ? 'hands' : 'rifle',
    turnAtMs: turned.includes(b.lane) ? now - 1000 : null, awayAtMs: null, hits: [], stoppedAtMs: null }));
  const me = g.me(), fp = KD_RANGE.bay.lanes[L - 1].fp;
  me.x = LINE_X[line]; me.z = fp.z; me.face = 'right'; me.headRad = 0; delete me.stance;
  const gunId = gunOn(s, pid), gun = s.items[gunId];
  gun.mode = safe ? 'safe' : 'semi';
  s.people[pid].kit.carry.posture = posture;
  enterStop(s, g.bus, { pid, gunId, via: 'shoot' });
  s.stop.pick = `turner:${aimAt ?? L}`;
  if (aimAt) { s.stop.aim = { key: `turner:${aimAt}`, settledMs: now }; s.people[pid].kit.carry.posture = 'aimed'; }
  R.end = { phase: 'fixture', atMs: now };
  return { g, s, pid, gunId, R, lane: L, T: (n) => R.turners[n - 1], key: (n) => `turner:${n}` };
}

/** A gun put back to Condition 1 off safe with a magazine of n, new and cocked, for rolls one after another (the odds suites: no wear, no jam carried). */
export function refill(s, gunId, n = 14) {
  const gun = s.items[gunId], mag = gun.mag ? s.items[gun.mag] : null;
  Object.assign(gun, { chamber: 'live', locked: false, cocked: true, cond: 0.93, rounds: 0, mode: 'semi', load: 'ball' });
  delete gun.jam; delete gun.set;
  if (mag) mag.n = n;
  gun.belief = { chamber: 'live', count: n };
}
