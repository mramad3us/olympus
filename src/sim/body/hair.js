// OLYMPUS body: the hair, a length that grows on every head and a cut kept in regulation, groomed like the beard (BODY §6; PEOPLE §6.2, §11.10; VIEWS §3; the build sheet 0.0.6 §2.2, §8 items 16 to 23).
//
// The user, 2026-11-06, of v0.0.4's horseshoe 'bald' cut: "this haircut is not military acceptable, we
// should have to groom our hair the same way we will have to groom our beards and a soldier with half
// balding hair would 100% go fully shaved head for service." So a person's look names one of CAREER §2's
// regulation cuts (src/data/people/looks.js CUTS: high and tight, low regulation, medium regulation or a
// shaved head for men; a regulation bun, short, or a braid pinned up for women), and the hair under it
// grows: hairOf(state, pid, ms) is THE helper (one quantity, one helper: the figure, the doll, the sheet,
// the instinct and the barber read it), from the hours since the last cut, h:
//   - the player (a body with atMs: the simulated one) reads the body's ledger, body.hair.h, grown every
//     second in the stepper as the stubble is (h += dtH, lived or skipped alike), extrapolated from the
//     record's atMs to ms (linear, so exact);
//   - anyone else reads the squad's closed form, squadHairH: a barber's cycle of 0.7, 0.8 or 0.9 of the
//     cut's dueSols in whole sols (men 7, 8 or 9: in regulation always), by hash('barber', seed, pid), its
//     phase by hash too, each cut at 12:00 local of its sol (PEOPLE §6.2's barber need, "sols since
//     haircut / 7", in closed form until the squad's needs at 0.0.9); never seen being cut, since an
//     actor's drawn step (actor.hair) is written only out of the player's sight (people's place.js);
//   - no body and no service (the sandbox's player): a fresh cut, step 0.
// From h and the cut: the lengths in millimetres (the cut's own plus HAIR.MM_DAY 0.40 mm an Earth day,
// Loussouarn et al. 2005), the sols since the cut, their share of the cut's dueSols, and from it the drawn
// step 0 to 3 and the band (fresh, growing from 0.3, due from 0.7, over from 1.0: HAIR.STEP_K); dueMs when
// the cut goes out of regulation and dueDay its weekday ("Haircut due Thursday."); regulation while the
// band is under 'over' (PEOPLE §11.10's rule, written for the inspections to come).
// cutsFor(person) are the cuts a person may have: a thinning man's only the shaved head (look.hair.thin,
// drawn by the roster), else his or her sex's. setCut writes a new cut on the look (a new look object, so
// the view's memo sees it) and tells the 'look' fact; cutHair is BODY's door for the barber's chair and the
// basin's clippers: the hours since the cut to 0 (body.js hairCut, a 'body-event' { kind: 'haircut', cut })
// and the cut set where it changed. A cut or a buzz cut short changes nothing (the activities call this
// only when their part ends whole: the build sheet §8 item 9).
// Pure but setCut and cutHair.
import { HOUR_MS, SOL_MS } from '../../core/clock.js';
import { localSol } from '../../core/calendar.js';
import { hashInt } from '../../core/hash.js';
import { CUTS, HAIR_STYLES, LEGACY_CUTS, THIN_CUT, DEFAULT_CUT } from '../../data/people/looks.js';
import { HAIR, HAIR_BANDS } from '../../data/body/needs.js';
import { weekdayName } from '../time/dates.js';
import { siteLonEDeg } from '../jobs.js';
import { tmplOf } from './record.js';
import { hairCut } from './body.js';

/** The squad's barber cycle as a share of the cut's dueSols, by hash (the build sheet §2.2: men 7, 8 or 9 sols). */
export const SQUAD_CYCLE_K = Object.freeze([0.7, 0.8, 0.9]);
/** The hour of a sol the squad's cuts are made at, local (my call: noon). */
export const SQUAD_CUT_H = 12;
/** The sol in hours (a mean solar day). */
export const SOL_H = SOL_MS / HOUR_MS;

/** A look's cut id: its style if a regulation cut, a v0.0.5 cut mapped (LEGACY_CUTS), else the default. */
export function cutIdOf(look, sex = 'm') {
  const s = look?.hair?.style, x = sex === 'f' ? 'f' : 'm';
  if (s && CUTS[s]?.sex === x) return s;
  const mapped = LEGACY_CUTS[x]?.[s];
  return mapped ?? (sex === 'f' ? 'bun' : DEFAULT_CUT);
}

/** The step (0 to 3) and band index of a share of the cut's dueSols grown (HAIR.STEP_K: 0.3, 0.7, 1.0). */
export function stepOfShare(k) {
  let n = 0;
  for (const s of HAIR.STEP_K) if (k >= s - 1e-12) n++;
  return n;
}

/**
 * The squad's closed form (see the header): hours since the last cut of a person who keeps their cut by the
 * barber's cycle, at ms, at a site's east longitude.
 */
export function squadHairH(seed, pid, cut, ms, lonEDeg = 0) {
  const C = CUTS[cut] ?? CUTS[DEFAULT_CUT];
  const cycle = Math.max(1, Math.round(SQUAD_CYCLE_K[hashInt(SQUAD_CYCLE_K.length, 'barber', seed >>> 0, pid)] * C.dueSols));
  const phase = hashInt(cycle, 'barber', 'phase', seed >>> 0, pid);
  const { sol, msOfSol } = localSol(ms, lonEDeg);
  const noonOf = (s) => ms - msOfSol + (s - sol) * SOL_MS + SQUAD_CUT_H * HOUR_MS;
  let c = sol - ((((sol + phase) % cycle) + cycle) % cycle);
  if (noonOf(c) > ms) c -= cycle;
  return (ms - noonOf(c)) / HOUR_MS;
}

// (the player's ledger: the body's hours since the cut at its atMs, grown to ms; null without a simulated body)
function ledgerH(p, ms) {
  const rec = p?.body;
  if (!rec || rec.atMs === null || rec.atMs === undefined) return null;
  const h = rec.hair?.h ?? tmplOf(rec).hair?.h ?? 0;
  return h + (ms - rec.atMs) / HOUR_MS;
}

/**
 * The hair of a person at ms (see the header): { cut, word, sex, thin, h, sols, mm: { sides, top }, step,
 * band: { id, i, tone, words }, dueMs, dueDay, regulation }; null without the person.
 */
export function hairOf(state, pid, ms = state?.clock?.ms ?? 0) {
  const p = state?.people?.[pid];
  if (!p) return null;
  const sex = p.sex === 'f' ? 'f' : 'm', cut = cutIdOf(p.look, sex), C = CUTS[cut];
  const lon = siteLonEDeg(state);
  let h = ledgerH(p, ms);
  if (h === null) h = p.service ? squadHairH(state.meta?.seed ?? 0, pid, cut, ms, lon) : 0;
  return hairAt(cut, h, ms, lon, { sex, thin: !!p.look?.hair?.thin });
}

/** A cut's hair after h hours since it was made, at ms (the readers' arithmetic, for a test or a sample: no state). */
export function hairAt(cut, h, ms = 0, lonEDeg = 0, { sex = CUTS[cut]?.sex ?? 'm', thin = false } = {}) {
  const C = CUTS[cut] ?? CUTS[DEFAULT_CUT];
  const sols = h / SOL_H, grownMm = HAIR.MM_DAY * h / 24, share = sols / C.dueSols;
  const step = stepOfShare(share), b = HAIR_BANDS[step];
  const dueMs = Math.round(ms + (C.dueSols * SOL_MS - h * HOUR_MS));
  const dueDay = weekdayName(localSol(dueMs, lonEDeg).sol);
  return {
    cut: CUTS[cut] ? cut : DEFAULT_CUT, word: C.word, sex, thin, h, sols,
    mm: { sides: C.sidesMm === null ? null : C.sidesMm + grownMm, top: C.topMm + grownMm },
    step, band: { id: b.id, i: step, tone: b.tone, words: ((cut === 'shaved' && b.shaved) || b.words).replace('{day}', dueDay) },
    dueMs, dueDay, regulation: step < 3,
  };
}

/** The drawn step (0 to 3) of a person's hair at ms: hairOf's step, without its words (the figure's and the actors' layer's, each second); 0 without the person. */
export function hairStepOf(state, pid, ms = state?.clock?.ms ?? 0) {
  const p = state?.people?.[pid];
  if (!p) return 0;
  const cut = cutIdOf(p.look, p.sex === 'f' ? 'f' : 'm');
  let h = ledgerH(p, ms);
  if (h === null) h = p.service ? squadHairH(state.meta?.seed ?? 0, pid, cut, ms, siteLonEDeg(state)) : 0;
  return stepOfShare(h / SOL_H / (CUTS[cut] ?? CUTS[DEFAULT_CUT]).dueSols);
}

/** The cuts a person may have: a thinning man's the shaved head only, else their sex's (HAIR_STYLES' order). */
export function cutsFor(person) {
  const sex = person?.sex === 'f' ? 'f' : 'm';
  if (sex === 'm' && person?.look?.hair?.thin) return [THIN_CUT];
  return HAIR_STYLES[sex].map(([id]) => id);
}

/** A new cut on a person's look (a new look object and hair object, so the view's memo sees it); tells 'look'. Writes. Returns whether it changed. */
export function setCut(state, pid, cut, ms = state?.clock?.ms ?? 0, bus = null) {
  const p = state?.people?.[pid];
  if (!p?.look || !CUTS[cut]) return false;
  const from = p.look.hair?.style ?? null;
  if (from === cut) return false;
  p.look = { ...p.look, hair: { ...(p.look.hair ?? {}), style: cut } };
  bus?.emit('look', { who: pid, what: 'cut', from, to: cut, atMs: ms });
  return true;
}

/** BODY's door for a haircut (the barber's chair, the basin's clippers): the hours since the cut to 0, the cut set where it changed. Writes. */
export function cutHair(state, pid, { cut = null } = {}, ms = state?.clock?.ms ?? 0, bus = null) {
  const p = state?.people?.[pid];
  if (!p) return null;
  const to = cut && CUTS[cut] && cutsFor(p).includes(cut) ? cut : cutIdOf(p.look, p.sex);
  const r = hairCut(state, pid, { cut: to }, ms, bus);
  const changed = setCut(state, pid, to, ms, bus);
  return { cut: to, changed, before: r?.before ?? null };
}
