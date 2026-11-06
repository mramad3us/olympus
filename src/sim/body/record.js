// OLYMPUS body: the record's shape, its template and its deltas, and the traits a person draws (BODY §2.5; TECH §6.6, rule 2; the build sheet 0.0.4 §3).
//
// One body for everyone (BODY §2.1): `people[pid].body` is saved as its deltas from its build's
// template, `{ v, tmpl, heightM, build, atMs, …the ledger fields that differ, held }`; withDefaults
// makes the whole record from it (each group the template's with the record's fields over it; the
// person's sex and age at ms, for the basal rate), and deltaOf the saved form back (a field equal to
// the template's is left out, a group with nothing left is dropped, so a resting body is a few
// bytes). The traits (BODY §2.5) are drawn from the world's seed and the person's id, on their own
// stream (stream('body', seed, pid, 'traits')): sleepNeedH ~ N(8.0, 0.5) clamped to 6.5 to 9.5 and
// tauIntH ~ N(24.2, 0.2), each rounded to 0.01 (normal() uses log and cos, rounded before they decide
// anything: core/rng.js). A draw is a pure function of the seed and the id, so drawing again gives
// the same traits. hasBeard(rec) is whether the body grows stubble at all (a man's; a woman's
// stubble ledger is never shown, shaved or nagged about). The eyes' record (0.0.5, src/sim/body/eyes.js:
// its anchor, which its own module rounds) is carried whole, as held is: it has no template, its
// absence being eyes adapted to the light they stand in. Kept apart from the engine (body.js): the
// shape of the record, not its rates (the stage's readers, cues.js through people/figure.js, take in
// the engine all the same).
// Pure.
import { DAY_MS } from '../../core/clock.js';
import { q } from '../../core/num.js';
import { stream, normal } from '../../core/rng.js';
import { TEMPLATES, DEFAULT_TMPL, GROUPS, SCALARS } from '../../data/body/templates.js';
import { BODY_TMPL } from '../../data/people/looks.js';
import { SLEEP, BMI_BY_BUILD, KCAL_PER_KG } from '../../data/body/needs.js';

/** The record's version: 2 from v0.0.4 (the ledgers; v0.0.3's roster wrote 1). */
export const BODY_V = 2;
const YEAR_MS = 365.25 * DAY_MS;

/** A record's template. */
export const tmplOf = (rec) => TEMPLATES[rec?.tmpl] ?? TEMPLATES[DEFAULT_TMPL];
/** Whether a body grows a beard: a man's does, a woman's does not (the person's sex, else the template's; the review of v0.0.4: a woman marine was told to shave). */
export const hasBeard = (rec) => (rec?.sex ?? tmplOf(rec).sex) !== 'f';
/** A plain copy of plain data (its keys in their own order; a loop, not entries and fromEntries: the body's minute step copies its record, and an 8-hour skip spent a third of its time here). */
export function copy(v) {
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(copy);
  const o = {};
  for (const k of Object.keys(v)) o[k] = copy(v[k]);
  return o;
}
const same = (a, b) => (a === b) || ((a === null || a === undefined) && (b === null || b === undefined))
  || (!!a && !!b && typeof a === 'object' && typeof b === 'object' && Object.keys({ ...a, ...b }).every(k => same(a[k], b[k])));

/** The traits a person draws (BODY §2.5) from the world's seed: { sleepNeedH, tauIntH, bmrK }. */
export function drawTraits(seed, pid) {
  const r = stream('body', seed >>> 0, pid, 'traits');
  const need = Math.min(SLEEP.NEED_MAX_H, Math.max(SLEEP.NEED_MIN_H, normal(r, SLEEP.NEED_H, SLEEP.NEED_SD_H)));
  return { sleepNeedH: q(need, 0.01), tauIntH: q(normal(r, SLEEP.TAU_H, SLEEP.TAU_SD_H), 0.01), bmrK: 1 };
}

/** The whole record from its deltas (the template's values where it says nothing), with the person's sex and age at ms. */
export function withDefaults(rec, person = null, ms = null) {
  const t = tmplOf(rec);
  const full = { v: rec?.v ?? BODY_V, tmpl: rec?.tmpl ?? (person?.sex ? BODY_TMPL[person.sex] : DEFAULT_TMPL), heightM: rec?.heightM ?? t.heightM, build: rec?.build ?? t.build, atMs: rec?.atMs ?? null };
  for (const g of GROUPS) full[g] = { ...copy(t[g]), ...copy(rec?.[g] ?? {}) };
  for (const k of SCALARS) full[k] = rec?.[k] ?? t[k];
  full.held = copy(rec?.held ?? {});
  if (rec?.eyes) full.eyes = copy(rec.eyes);
  full.sex = person?.sex ?? rec?.sex ?? t.sex;
  full.ageY = person && Number.isFinite(person.bornMs) && Number.isFinite(ms) ? (ms - person.bornMs) / YEAR_MS : t.ageY;
  return full;
}

/** The record as saved: v, tmpl, heightM, build, atMs, and only what differs from the template (TECH §6.6). */
export function deltaOf(full) {
  const t = tmplOf(full), rec = { v: full.v ?? BODY_V, tmpl: full.tmpl ?? DEFAULT_TMPL, heightM: full.heightM ?? t.heightM, build: full.build ?? t.build };
  if (full.atMs !== null && full.atMs !== undefined) rec.atMs = full.atMs;
  for (const g of GROUPS) {
    const d = {};
    let n = 0;
    for (const [k, v] of Object.entries(full[g] ?? {})) if (v !== undefined && !same(v, t[g][k])) { d[k] = v; n++; }
    if (n) rec[g] = d;
  }
  for (const k of SCALARS) if (full[k] !== undefined && full[k] !== t[k]) rec[k] = full[k];
  const h = full.held;
  if (h && (h.ms || h.rp || h.cur || h.solved || h.posted)) rec.held = h;
  if (full.eyes) rec.eyes = full.eyes;
  return rec;
}

/** A stored record's mass without making the whole record (the fast layer's, each tick): BMI × height², less a deficit (BODY §3.3). */
export function massOfRecord(rec) {
  const t = tmplOf(rec), h = rec?.heightM ?? t.heightM, res = rec?.energy?.reserveKcal ?? t.energy.reserveKcal;
  return (BMI_BY_BUILD[rec?.build ?? t.build] ?? BMI_BY_BUILD.medium) * h * h + Math.min(0, res) / KCAL_PER_KG;
}
