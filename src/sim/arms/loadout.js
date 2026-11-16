// OLYMPUS arms: the loadout, what goes on each face of the carrier, as a spec, a code and a fill (WEAPONS §12.7; the build sheet 0.0.18 §2.3, §8 items 9, 16).
//
// A spec is { front: [place…], left: […], right: […], back: […] }, each place an issue's id (ISSUE): 'mag2' a magazine pouch,
// 'dump' the dump pouch, 'g11' a grenade pouch with a G-11, 'sc1+fd1' a charge pouch with an SC-1 and its firing device, 'hal'
// the halligan in its scabbard, 'ram' the ram. The front is the house's issue this round (two magazine pouches and the dump
// pouch: "magazines ride the front this round", D2 brings face factors for magazines), the sides hold 2 each, the back 1, and
// a tool rides the back alone (checkLoadout gives the first reason a spec is refused, or null). LOADOUT_PRESETS are the
// picker's four: standard (the house's issue, to the byte), flash (two G-11s on the left), breach (two SC-1s on the right, the
// halligan on the back) and full.
// **One loadout for every sheet** (the user, 2026-11-15: "everyone should have the same loadout, there is no reason to not give
// sidearms to low ranks"): the spec never reads the tier, and the #2 is issued the same (his extras made after yours).
// codeOf(spec) is its code: a preset's id where it is one, else 'v1~front:mag2,mag2,dump~left:g11,g11~right:sc1+fd1~back:hal',
// the faces in FACES order, an empty side left out; loadoutOf(code) reads one back (a '+' may come through a URL as a space),
// or { error } for an unknown one. applyLoadout(state, pid, spec) runs after the fill's materialise and issueSidearm: each
// extra pouch made, put `at` its face on the carrier and filled, its ids after every other item of the fill; the standard
// makes nothing, so a lane with &loadout=standard is the lane without it to the byte. loadoutView(state, pid) is the screen's
// data from the sim: each face's places, their items with mass and reach (devices.js deviceMs at the person's skills), the
// whole kit's kitMassKg and the walk's push and brake at that mass (motion.js tractionOf, as bundle.js legsOf reads them).
// v0.0.19 (D2, the build sheet 0.0.19 §0 item 10, §4 item 5): the practice grenades 'g9p' and 'g13p' (a grenade pouch each)
// and the cutting charge 'bc1+fd1' (a charge pouch with a BC-1 and its FD-1) are issued while PRACTICE_ISSUED (the one switch
// that hides the practice grenades from the issue table), and the picker gains four presets: frag (two G-9Ps on the left), conc
// (two G-13Ps), cut (a BC-1 and an SC-1 on the right, the halligan on the back) and mixed (a G-11 and a G-9P on the left, a BC-1
// on the right). The #2's P-12 (team's question, TWO_P12_DEFAULT false: the log of 2026-11-15) rides the code as one token,
// '~two:p12' (or '~two:none'), after a preset's name or a v1 code, written only where it differs from the default (spec.two =
// { p12: true } when on; absent is off), read off first by loadoutOf, which resolves the default in the one place, so flipping
// TWO_P12_DEFAULT is the one switch and every v0.0.18 code reads and writes back byte for byte.
// Pure but applyLoadout, which makes items (w).
import { nextId, put, playerActor, playerId } from '../../core/ids.js';
import { G0_MS2 } from '../../core/phys.js';
import { CONTAINERS, move, kitMassKg } from './kit.js';
import { DEVICES, FACES, deviceMs, fuseOf } from './devices.js';
import { tractionOf } from '../body/motion.js';
import { gravityAt, surfaceAt } from '../places/env.js';
import { valueOf } from '../skills/templates.js';

const fz = (o) => Object.freeze(o);
/** The issue a place can take (see the header): id → { word, pouch (a CONTAINERS model), items: [device models], faces: the faces it may ride, act: its reach's action }. */
export const ISSUE = fz({
  mag2: fz({ word: 'magazine pouch', pouch: 'pouch-mag2', items: fz([]), faces: fz(['front']) }),
  dump: fz({ word: 'dump pouch', pouch: 'pouch-dump', items: fz([]), faces: fz(['front']) }),
  g11: fz({ word: 'G-11 stun grenade', pouch: 'pouch-gren', items: fz(['g11']), faces: fz(['left', 'right']), act: 'gren:reach' }),
  'sc1+fd1': fz({ word: 'SC-1 strip charge with its FD-1', pouch: 'pouch-charge', items: fz(['sc1', 'fd1']), faces: fz(['left', 'right']), act: 'charge:reach' }),
  hal: fz({ word: 'halligan', pouch: 'scab-tool', items: fz(['hal']), faces: fz(['back']), act: 'tool:reach' }),
  ram: fz({ word: 'ram', pouch: 'scab-tool', items: fz(['ram']), faces: fz(['back']), act: 'tool:reach' }),
  // (v0.0.19, D2 (see the header))
  g9p: fz({ word: 'G-9P practice frag', pouch: 'pouch-gren', items: fz(['g9p']), faces: fz(['left', 'right']), act: 'gren:reach' }),
  g13p: fz({ word: 'G-13P practice concussion', pouch: 'pouch-gren', items: fz(['g13p']), faces: fz(['left', 'right']), act: 'gren:reach' }),
  'bc1+fd1': fz({ word: 'BC-1 cutting charge with its FD-1', pouch: 'pouch-charge', items: fz(['bc1', 'fd1']), faces: fz(['left', 'right']), act: 'charge:reach' }),
});
/** Whether the practice grenades are issued (the one switch of the build sheet 0.0.19 §13: the issue table and the presets hide them when false). */
export const PRACTICE_ISSUED = true;
/** Whether your #2 carries a P-12 by default (the log of 2026-11-15, line 229; team's question 1): '~two:p12' turns it on. */
export const TWO_P12_DEFAULT = false;
/** The code's token for the #2's P-12 (see the header). */
export const TWO_P12_TOKEN = '~two:p12';
/** The token that leaves the #2's P-12 off where the default is on (the review of v0.0.19: flipping TWO_P12_DEFAULT must be the one switch). */
export const TWO_NONE_TOKEN = '~two:none';
/** The issue table's order on the screen (D1's, the practice grenades and the cutting charge after their kinds). */
export const ISSUE_ORDER = fz(['g11', ...(PRACTICE_ISSUED ? ['g9p', 'g13p'] : []), 'sc1+fd1', 'bc1+fd1', 'hal', 'ram']);
/** Each face's count (kit.js CONTAINERS 'pc-m3' faces). */
export const FACE_N = CONTAINERS['pc-m3'].faces;
const FRONT = fz(['mag2', 'mag2', 'dump']);
/** The picker's presets (see the header). */
export const LOADOUT_PRESETS = fz({
  standard: fz({ front: FRONT, left: fz([]), right: fz([]), back: fz([]) }),
  flash: fz({ front: FRONT, left: fz(['g11', 'g11']), right: fz([]), back: fz([]) }),
  breach: fz({ front: FRONT, left: fz([]), right: fz(['sc1+fd1', 'sc1+fd1']), back: fz(['hal']) }),
  full: fz({ front: FRONT, left: fz(['g11', 'g11']), right: fz(['sc1+fd1']), back: fz(['hal']) }),
  // (v0.0.19, D2 (see the header))
  frag: fz({ front: FRONT, left: fz(['g9p', 'g9p']), right: fz([]), back: fz([]) }),
  conc: fz({ front: FRONT, left: fz(['g13p', 'g13p']), right: fz([]), back: fz([]) }),
  cut: fz({ front: FRONT, left: fz([]), right: fz(['bc1+fd1', 'sc1+fd1']), back: fz(['hal']) }),
  mixed: fz({ front: FRONT, left: fz(['g11', 'g9p']), right: fz(['bc1+fd1']), back: fz([]) }),
});
/** The presets' order and words on the picker and the screen (1 to 8; the practice grenades' only while PRACTICE_ISSUED). */
export const PRESET_ORDER = fz(['standard', 'flash', 'breach', 'full', ...(PRACTICE_ISSUED ? ['frag', 'conc'] : []), 'cut', ...(PRACTICE_ISSUED ? ['mixed'] : [])]);
export const PRESET_WORDS = fz({ standard: 'Standard', flash: 'Flash', breach: 'Breach', full: 'Full', frag: 'Frag', conc: 'Concussion', cut: 'Cut', mixed: 'Mixed' });

// (a spec with its four faces, each a list)
const norm = (spec) => Object.fromEntries(FACES.map(f => [f, [...(spec?.[f] ?? (f === 'front' ? FRONT : []))]]));
const same = (a, b) => FACES.every(f => a[f].join() === b[f].join());

/** The first reason a spec is refused (see the header), or null. */
export function checkLoadout(spec) {
  const s = norm(spec);
  if (s.front.join() !== FRONT.join()) return 'magazines ride the front this round';
  for (const f of FACES) {
    for (const p of s[f]) {
      const I = ISSUE[p];
      if (!I) return `no such issue '${p}'`;
      if (f !== 'front' && (p === 'mag2' || p === 'dump')) return 'magazines ride the front this round';
      if (!I.faces.includes(f)) return I.faces.includes('back') ? `a ${I.word} goes on your back` : `a ${I.word} rides a side`;
    }
    const n = f === 'front' ? CONTAINERS['pc-m3'].holds : FACE_N[f];
    if (s[f].length > n) return `the ${f === 'back' ? 'back' : f === 'front' ? 'front' : `${f} side`} holds ${n}`;
  }
  return null;
}
/**
 * A spec's code (see the header): its faces' (a preset's id, else v1's), then the #2's token where his P-12 differs from the default
 * ('~two:p12' on, '~two:none' off; a spec with no `two` is the default). twoDefault: TWO_P12_DEFAULT (an argument for the tests only).
 */
export function codeOf(spec, { twoDefault = TWO_P12_DEFAULT } = {}) {
  const p12 = spec?.two?.p12 ?? twoDefault, s = norm(spec), two = p12 === twoDefault ? '' : p12 ? TWO_P12_TOKEN : TWO_NONE_TOKEN;
  for (const id of PRESET_ORDER) if (same(s, norm(LOADOUT_PRESETS[id]))) return id + two;
  return ['v1', ...FACES.filter(f => f === 'front' || s[f].length).map(f => `${f}:${s[f].join(',')}`)].join('~') + two;
}
/**
 * A code read (see the header): its spec (frozen faces, every face present, `two` only when his P-12 is on), or { error } for one
 * unknown or refused. The #2's P-12 is resolved here, the one place: the token's, else TWO_P12_DEFAULT (twoDefault, for the tests).
 */
export function loadoutOf(code, { twoDefault = TWO_P12_DEFAULT } = {}) {
  const c0 = code === null || code === undefined ? '' : String(code).trim().replace(/ /g, '+');
  const tok = [TWO_P12_TOKEN, TWO_NONE_TOKEN].find(t => c0.endsWith(t)) ?? null, c = tok ? c0.slice(0, -tok.length) : c0;
  const out = c0 === '' ? norm(LOADOUT_PRESETS.standard) : faceSpecOf(c, code), p12 = tok ? tok === TWO_P12_TOKEN : twoDefault;
  if (p12 && !out.error) out.two = { p12: true };
  return out;
}
// (the faces of a code with the #2's token off: a preset's, else v1's)
function faceSpecOf(c, code) {
  if (c === '') return { error: `no loadout '${code}'` };
  if (Object.hasOwn(LOADOUT_PRESETS, c)) return norm(LOADOUT_PRESETS[c]);
  const parts = c.split('~');
  if (parts[0] !== 'v1') return { error: `no loadout '${code}'` };
  const spec = { front: [...FRONT], left: [], right: [], back: [] };
  for (const p of parts.slice(1)) {
    const m = /^(front|left|right|back):(.*)$/.exec(p);
    if (!m) return { error: `no loadout '${code}'` };
    spec[m[1]] = m[2] ? m[2].split(',') : [];
  }
  const why = checkLoadout(spec);
  return why ? { error: why } : spec;
}
/** Whether a code is the standard loadout (or none). */
export const isStandard = (code) => { const s = loadoutOf(code); return !s.error && codeOf(s) === 'standard'; };

/**
 * The spec issued to a person (w; see the header): the extra places of its sides and back made, each a pouch at its face on
 * the carrier, filled. Returns { pouchIds, itemIds }. The front is the fill's own (the house's issue), so nothing is made there.
 */
export function applyLoadout(state, pid, spec) {
  const s = norm(spec), why = checkLoadout(s);
  if (why) throw new Error(`loadout.applyLoadout(): ${why}`);
  const carrier = state.people?.[pid]?.kit?.worn?.carrier;
  const pouchIds = [], itemIds = [];
  for (const f of FACES) {
    if (f === 'front' || !s[f].length) continue;
    if (!carrier) throw new Error(`loadout.applyLoadout(): ${pid} wears no carrier`);
    for (const p of s[f]) {
      const I = ISSUE[p], pouchId = nextId(state, 'i');
      put(state, state.items, pouchId, { type: CONTAINERS[I.pouch].type, model: I.pouch, at: f });
      move(state, pouchId, { container: carrier });
      pouchIds.push(pouchId);
      for (const model of I.items) {
        const D = DEVICES[model], id = nextId(state, 'i'), rec = { type: D.kind, model };
        if (D.kind === 'grenade') rec.fuseMs = fuseOf(state.meta?.seed ?? 0, model, id);
        put(state, state.items, id, rec);
        move(state, id, { container: pouchId });
        itemIds.push(id);
      }
    }
  }
  return { pouchIds, itemIds };
}

/** A roller's stand-in from a person's sheet: value(skill) as the sheet reads it, calm (the screen's times before the lane). */
const sheetRoller = (state, pid) => ({ value: (k) => valueOf(state, pid, k), timeK: 1 });

/**
 * The screen's data (see the header): { code, faces: { <face>: [{ place, word, items: [{ model, word, massKg, reachS }]… }] },
 * massKg, push: { pushMs2, brakeMs2 }, wh, fit }, the person's kit as it stands (applyLoadout's pouches by their `at`).
 */
export function loadoutView(state, pid, spec = null) {
  const kit = state.people?.[pid]?.kit, carrier = kit?.worn?.carrier, roller = sheetRoller(state, pid);
  const faces = Object.fromEntries(FACES.map(f => [f, []]));
  for (const c of state.items?.[carrier]?.holds ?? []) {
    const rec = state.items[c], f = rec.at ?? 'front';
    const items = (rec.holds ?? []).map(id => state.items[id]).filter(x => x && DEVICES[x.model]).map(x => ({ model: x.model, word: DEVICES[x.model].word, massKg: DEVICES[x.model].massKg, reachS: reachSOf(roller, x.model, f) }));
    faces[f].push({ pouch: rec.model, word: CONTAINERS[rec.model]?.word ?? rec.model, items });
  }
  const massKg = kitMassKg(state, pid), a = playerId(state) === pid ? playerActor(state) : state.actors?.list?.find(x => x.who === pid) ?? null;
  const gG = gravityAt(state, null, a?.x ?? 0, a?.z ?? 0)?.gG ?? 1, mu = surfaceAt(state, null, a?.x ?? 0, a?.z ?? 0)?.mu;
  const t = tractionOf({ gMs2: gG * G0_MS2, mu: Number.isFinite(mu) ? mu : 0.6, effFitness: roller.value('fitness'), massKg: 75, loadKg: massKg });
  return { code: spec ? codeOf(spec) : null, faces, massKg, push: { pushMs2: Math.round(t.pushMs2 * 100) / 100, brakeMs2: Math.round(t.brakeMs2 * 100) / 100 }, wh: roller.value('weapons'), fit: roller.value('fitness') };
}
/** The reach (s, to 0.01) of a device of a model from a face for a roller: its kind's reach action (devices.js deviceMs). */
export function reachSOf(roller, model, face) {
  const D = DEVICES[model];
  const act = D?.kind === 'grenade' ? 'gren:reach' : D?.kind === 'charge' || D?.kind === 'initiator' ? 'charge:reach' : D?.kind === 'tool' ? 'tool:reach' : null;
  return act ? Math.round(deviceMs(roller, act, { face }) / 10) / 100 : 0;
}
/** A place's mass (kg): its pouch and its items. */
export const placeKg = (p) => { const I = ISSUE[p]; return I ? (CONTAINERS[I.pouch]?.massKg ?? 0) + I.items.reduce((n, m) => n + (DEVICES[m]?.massKg ?? 0), 0) : 0; };
/** A spec's mass over the standard's (kg): its sides' and back's places. */
export const extraKg = (spec) => { const s = norm(spec); return Math.round(FACES.filter(f => f !== 'front').reduce((n, f) => n + s[f].reduce((m, p) => m + placeKg(p), 0), 0) * 100) / 100; };
