// OLYMPUS body: the body in every roll, and what it lets you do (BODY §22, SKILLS §5.4; the build sheet 0.0.4 §2.1, §8 item 21).
//
// Two helpers every check and every displayed odds call, both keyed by what the roll uses (BODY §22):
// bodyMods(state, pid, key, ctx) the body's conditions this round has (the core's stages, ported from
// tradecraft's thermalMods; stamina; load), needMods(state, pid, key, ctx) the needs (hunger, thirst,
// the bladder and the bowel, at most −3 between them; fatigue and sleep inertia; stress and morale;
// hygiene on a roll aimed at someone within smell range). Each entry is SKILLS §5.3's { why, v, src },
// one per cause, src 'body:<ledger>' for the body's and 'need:<ledger>' for the needs', so the two are
// kept apart and a roll that calls both counts each cause once (BODY §25's body-mods). key is a skill's
// uses (SKILLS §2.2: eyes, arms, breath, hands, legs, ears, head, voice, face, torso; an array, or
// 'all' for a roll that uses everything, CQC's) or BODY's shorthand groups: 'mind' (head), 'body'
// (legs, torso, breath), 'hands' (hands, arms), 'eyes', 'social' (face, voice). A row applies once to
// a roll whose uses meet the row's; 'all' rows to every roll. No roll reads them yet (skill checks
// come at 0.0.6). capacityOf(state, pid) is what the body lets you do: { walkK, runOk, sprintOk,
// awareK, visionK, canStand } (BODY §2.4's capacity; awareK unread this round, the sheet §8 item 21).
import { HUNGER, THIRST, BLADDER_BANDS, BOWEL_BANDS, GRIME_BANDS, STAMINA, ELIM_MOD_MIN, MORALE } from '../../data/body/needs.js';
import { playerId } from '../../core/ids.js';
import { bodyOf } from './body.js';
import { stagesOf, pEffOf } from './cues.js';
import { fatigueMod } from './sleep.js';
import { thermalMods, stageOf } from './thermal.js';
import { smellM } from './hygiene.js';
import { gaitsOf } from './motion.js';
import { siteLonEDeg } from '../jobs.js';

/** BODY §22's shorthand groups as SKILLS's uses ('*': every roll). */
export const USE_GROUPS = Object.freeze({ all: '*', mind: Object.freeze(['head']), body: Object.freeze(['legs', 'torso', 'breath']), hands: Object.freeze(['hands', 'arms']), eyes: Object.freeze(['eyes']), social: Object.freeze(['face', 'voice']) });
/** A key's uses: a group, a use, or a list of either; '*' for every roll. */
export function usesOf(key) {
  if (key === undefined || key === null || key === 'all' || key === '*') return '*';
  const list = Array.isArray(key) ? key : [key];
  if (list.includes('all')) return '*';
  return [...new Set(list.flatMap(k => USE_GROUPS[k] && USE_GROUPS[k] !== '*' ? USE_GROUPS[k] : [k]))];
}
const lands = (rowUses, keyUses) => rowUses === '*' || keyUses === '*' || rowUses.some(u => keyUses.includes(u));
const row = (out, keyUses, uses, why, v, src) => { if (v && lands(usesOf(uses), keyUses)) out.push({ why, v, src }); };

/** The body's conditions on a roll of key (see the header). */
export function bodyMods(state, pid, key = 'all', ctx = {}) {
  const b = bodyOf(state, pid);
  if (!b || b.atMs === null) return [];
  const out = [], uses = usesOf(key);
  for (const m of thermalMods(b.thermal.coreC)) {
    row(out, uses, 'all', m.why, m.v, 'body:thermal');
    if (m.id === 'shivering') row(out, uses, 'hands', 'the shake', -1, 'body:thermal');
  }
  const st = b.stamina;
  if (b.blown || st <= 0) { row(out, uses, ['legs', 'torso', 'breath'], 'blown', -4, 'body:stamina'); row(out, uses, ['hands', 'arms'], 'blown', -3, 'body:stamina'); }
  else if (st < STAMINA.WINDED_BELOW) row(out, uses, ['breath', 'arms', 'hands', 'legs'], 'winded', -2, 'body:stamina');
  else if (st < 50) row(out, uses, ['breath', 'arms', 'hands', 'legs'], 'breathing hard', -1, 'body:stamina');
  return out;
}

/** The needs on a roll of key (see the header). ctx.targetM: the distance to the one the roll is aimed at (the smell's range). */
export function needMods(state, pid, key = 'all', ctx = {}) {
  const b = bodyOf(state, pid);
  if (!b || b.atMs === null) return [];
  const ms = ctx.ms ?? state.clock.ms, lon = siteLonEDeg(state), s = stagesOf(b, ms, lon), out = [], uses = usesOf(key);
  row(out, uses, 'all', s.hunger.band.replace('-', ' '), HUNGER[s.hunger.i].mod ?? 0, 'need:hunger');
  row(out, uses, 'all', s.thirst.band, THIRST[s.thirst.i].mod ?? 0, 'need:thirst');
  if (THIRST[s.thirst.i].bodyMod) row(out, uses, ['legs', 'torso'], `${s.thirst.band}, legs`, THIRST[s.thirst.i].bodyMod, 'need:thirst');
  // (the bladder and the bowel, at most −3 between them on any one roll)
  const elim = [];
  for (const [ledger, bands, st] of [['bladder', BLADDER_BANDS, s.bladder], ['bowel', BOWEL_BANDS, s.bowel]]) {
    const band = bands[st.i];
    if (band.mod) row(elim, uses, band.uses ?? 'all', `${ledger}: ${band.id}`, band.mod, `need:${ledger}`);
  }
  let sum = 0;
  for (const m of elim) { const v = Math.max(m.v, ELIM_MOD_MIN - sum); if (v < 0) { out.push({ ...m, v }); sum += v; } }
  const f = fatigueMod(pEffOf(b, ms, lon));
  if (f) row(out, uses, 'all', f === -1 ? 'tired' : 'exhausted', f, 'need:fatigue');
  const inert = b.sleep.inertia;
  if (inert && ms < inert.untilMs) row(out, uses, 'all', 'just woken', inert.v, 'need:inertia');
  if (s.stress.i >= 3) { row(out, uses, ['eyes', 'face'], 'frayed', -2, 'need:stress'); row(out, uses, ['hands', 'arms'], 'frayed, a shake', -1, 'need:stress'); }
  else if (s.stress.i === 2) row(out, uses, ['eyes', 'face'], 'on edge', -1, 'need:stress');
  if (b.morale.v < MORALE.VERY_LOW) { row(out, uses, ['head'], 'morale very low', -2, 'need:morale'); row(out, uses, ['face'], 'morale very low', -2, 'need:morale'); }
  else if (b.morale.v < MORALE.LOW) row(out, uses, ['head'], 'morale low', -1, 'need:morale');
  const g = GRIME_BANDS[s.hygiene.i];
  if (g.mod && (ctx.targetM === undefined || ctx.targetM <= smellM(b.hygiene.grime)) && !ctx.sealed && !ctx.radio) row(out, uses, ['face', 'voice'], `${g.id}: the smell`, g.mod, 'need:hygiene');
  return out;
}

/** What the body lets you do now (BODY §2.4): { walkK, runOk, sprintOk, awareK, visionK, canStand }. */
export function capacityOf(state, pid = playerId(state)) {
  const b = bodyOf(state, pid);
  if (!b) return { walkK: 1, runOk: true, sprintOk: true, awareK: 1, visionK: 1, canStand: true };
  const g = gaitsOf(state, pid), cold = stageOf(b.thermal.coreC), s = stagesOf(b, state.clock.ms, siteLonEDeg(state));
  return {
    walkK: cold?.slow ?? 1, runOk: g.runOk, sprintOk: g.sprintOk,
    awareK: 1, visionK: 1, canStand: !cold?.down && !cold?.dead && s.thirst.i < THIRST.length - 1,
  };
}
