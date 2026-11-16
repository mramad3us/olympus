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
});
/** The issue table's order on the screen (D1's; D2 adds the practice grenades). */
export const ISSUE_ORDER = fz(['g11', 'sc1+fd1', 'hal', 'ram']);
/** Each face's count (kit.js CONTAINERS 'pc-m3' faces). */
export const FACE_N = CONTAINERS['pc-m3'].faces;
const FRONT = fz(['mag2', 'mag2', 'dump']);
/** The picker's presets (see the header). */
export const LOADOUT_PRESETS = fz({
  standard: fz({ front: FRONT, left: fz([]), right: fz([]), back: fz([]) }),
  flash: fz({ front: FRONT, left: fz(['g11', 'g11']), right: fz([]), back: fz([]) }),
  breach: fz({ front: FRONT, left: fz([]), right: fz(['sc1+fd1', 'sc1+fd1']), back: fz(['hal']) }),
  full: fz({ front: FRONT, left: fz(['g11', 'g11']), right: fz(['sc1+fd1']), back: fz(['hal']) }),
});
/** The presets' order and words on the picker and the screen (1 to 4). */
export const PRESET_ORDER = fz(['standard', 'flash', 'breach', 'full']);
export const PRESET_WORDS = fz({ standard: 'Standard', flash: 'Flash', breach: 'Breach', full: 'Full' });

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
/** A spec's code (see the header). */
export function codeOf(spec) {
  const s = norm(spec);
  for (const id of PRESET_ORDER) if (same(s, norm(LOADOUT_PRESETS[id]))) return id;
  return ['v1', ...FACES.filter(f => f === 'front' || s[f].length).map(f => `${f}:${s[f].join(',')}`)].join('~');
}
/** A code read (see the header): its spec (frozen faces, every face present), or { error } for one unknown or refused. */
export function loadoutOf(code) {
  if (code === null || code === undefined || code === '') return norm(LOADOUT_PRESETS.standard);
  const c = String(code).trim().replace(/ /g, '+');
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
