// OLYMPUS audio: the kit in the ears, the G-11's and the charges' reports, the practice grenades' pop and puff, the pin, the lever, the floor's knock, the shock tube and the breach round's strike in the shoot house, through the combat EVA suit (WEAPONS §12.5; the build sheet 0.0.18 §2.3, §11; 0.0.19 §1 K-face, kit2 §2.9).
//
// The presenter's ear (VIEWS §11.1: "the sim decides, audio presents"): it hears the 'fx' facts of the house's bursts (burst.js:
// a flash grenade's 'bang' through supp.js bang(), a charge's or a practice grenade's 'blast' with its model) and a breach
// round's 'shot' (shot.js: its target a door, ballistic.js's), and reads the house's devices once a frame (frame(state): a
// grenade's pin pulled, its lever gone, its landing and roll; a charge fired), and plays them on the bang's ops. blastVoice(...)
// is the pure part the audio-blast tests measure:
//   the source  BANG_SOURCE_DB (the G-11's, bang.js's training bang the same flash composition) over the recipe's peak at 1 m, a
//               charge louder and a practice grenade's 4 g spotting charge quieter by their peaks' ratio at 1 m (blast.js
//               peakKPa: the SC-1's 0.1 kg 12.6 dB over the G-11's 0.0143 kg, the G-9P's 0.004 kg 7.1 dB under it, in the
//               Wheel's air), a charge slower (BLAST_RATE: the bigger charge's longer positive phase, W^(1/3)), less the air's
//               (airDb) and the distance's fall on the floor's rolloff;
//   the air     one quantity, one number (v0.0.19): the place's air thins the report by its peak's own ratio there against the
//               air its level was set in (thinDb: 20 log10 of peakKPa at the listener's range in this air over BLAST_REF_KPA
//               66's, the Wheel's and the valley's: 0 dB in the house, a G-9P at 3 m 19.8 dB down in Mars' surface 0.6 kPa,
//               40 dB with the air's own airDb). In vacuum there is no airborne voice: only the floor's thump, the report
//               low-passed at THUMP_LP_HZ 120 and THUMP_DB down, within THUMP_M 5 m on the same deck (kit2 §2.9);
//   the suit    the combat EVA suit's sealed helmet (supp.js protOf: ears 'suit') takes a report through its electronics as the
//               range's defenders take a bang (bang.js: EARS_DB, low-passed at EARS_LP_HZ), and clamps it at the gate
//               (SUIT_GATE_DB, BANG_SOURCE_DB + EARS_DB: the loudest report a gated ear passes): WEAPONS §12.5's "a thump and a
//               flicker", the SC-1 and the BC-1 at the gate from a few metres in, never over it. The quiet sounds (the pin, the
//               lever, the knock, the tube's snap, the strike) pass its electronics as speech does (gun.js PROTECT_AT.suit: +4
//               dB, its speakers to 6 kHz), and never over the gate either;
//   the place   its moment on the audio clock (its place in the tick that brought it, then the flight of the sound), panned by
//               its offset; never the bay's berm echo (the house has none).
// The practice grenade sounds as practice (the sheet's §10, honest): a pop (a small Friedlander pulse, its positive phase ∝
// W^(1/3)) and the puff's 300 ms whoof (noise low-passed at 250 and 450 Hz), never the live twin's bang. The new recipes are BLAST_RECIPES (the
// synthesiser's form, src/ui/audio/synth.js: noise and tones, stream-seeded, never Math.random), baked with the CHAOS table's.
// fact(type, payload, state) answers a house's 'fx' bang or blast and a door's 'shot' (the bay's bangs stay bang.js's: "Three
// bangs" and "Bang" as scored); frame(state) the devices; stats keeps the counts and the last voice for the tests and the handle.
import { playerActor } from '../../core/ids.js';
import { TICK_MS } from '../../core/clock.js';
import { airDb } from '../../sim/people/hearing.js';
import { lowpassHz } from './steps.js';
import { airHere, needSound } from './range.js';
import { PROTECT_AT } from './gun.js';
import { peakKPa } from '../../sim/arms/blast.js';
import { DEVICES } from '../../sim/arms/devices.js';
import { openingOf } from '../../sim/places/model.js';
import { ROLLOFF, PAN_FULL_M, BANG_SOURCE_DB, EARS_DB, EARS_LP_HZ } from '../../data/sounds.js';

/** The suit's gate: the loudest report the sealed helmet's electronics pass (dB on the engine's scale). */
export const SUIT_GATE_DB = BANG_SOURCE_DB + EARS_DB;
/** A charge's report played slower than the G-11's by this (its longer positive phase: my call). */
export const BLAST_RATE = 0.8;
/** The air the reports' levels were set in (kPa: the Wheel's and the Mariner Valley's, my call); thinner air thins a burst by its peak's ratio. */
export const BLAST_REF_KPA = 66;
/** In vacuum, the floor's thump: low-passed (Hz), down (dB) and heard within (m) on the same deck (kit2 §2.9). */
export const THUMP_LP_HZ = 120, THUMP_DB = -20, THUMP_M = 5;
/** The practice burst's puff after its pop (dB against the pop), the tube's snap's source (dB on the engine's scale), the steel strike's and the dust's (dB at 1 m). */
export const WHOOF_DB = -6, TUBE_SNAP_DB = BANG_SOURCE_DB - 30, STRIKE_DB = 0, DUST_DB = -14;
/** The floor's knock by the grenade's speed at the floor (dB: KNOCK_DB at KNOCK_REF_MS, 20 log10 of the ratio, at most 0). */
export const KNOCK_DB = -6, KNOCK_REF_MS = 6;
/** A device's moment the drawn clock passed more than this long ago is dropped, not played late (ms: a load, a skip). */
export const LATE_MS = 400;
const dbOfDist = (dM, roll = ROLLOFF.floor) => 20 * Math.log10(1 / (1 + roll * Math.max(0, dM - 1)));
const r1 = (v) => Math.round(v * 10) / 10;
const fz = Object.freeze;

/**
 * The kit's recipes (the synthesiser's form; kit2 §2.9): the pin's ring (2.8 and 5.6 kHz, 4 ms), the lever's striker snap and
 * its spring's ring (3 kHz noise, 8 ms; 6 kHz, 60 ms), the floor's knock (400 to 900 Hz, 15 ms), the roll's rattle (grains),
 * the spotting charge's pop and the puff's whoof (noise low-passed at 250 and 450 Hz, 300 ms), the shock tube's snap, the steel's strike at
 * the leaf (modes 1.8, 3.3 and 5.1 kHz, 80 ms) and the frangible's dust hiss. Each levelDb its peak at 1 m (dBFS).
 */
export const BLAST_RECIPES = fz({
  pinClick: fz({ levelDb: -26, durS: 0.05, variants: 2, layers: fz([
    fz({ kind: 'tone', hz: 2800, toHz: 2800, attackS: 0.0002, decayS: 0.004, db: 0 }),
    fz({ kind: 'tone', hz: 5600, toHz: 5600, attackS: 0.0002, decayS: 0.003, db: -4 }),
    fz({ kind: 'noise', highpass: 4000, attackS: 0.0001, decayS: 0.0015, db: -8 }),
  ]) }),
  leverSnap: fz({ levelDb: -20, durS: 0.2, variants: 2, layers: fz([
    fz({ kind: 'noise', bandpass: fz([3000, 1.2]), attackS: 0.0002, decayS: 0.008, db: 0 }),
    fz({ kind: 'tone', hz: 6000, toHz: 5800, attackS: 0.0005, decayS: 0.06, delayS: 0.002, db: -8 }),
  ]) }),
  floorKnock: fz({ levelDb: -14, durS: 0.08, variants: 3, layers: fz([
    fz({ kind: 'noise', bandpass: fz([650, 1.4]), attackS: 0.0005, decayS: 0.015, db: 0 }),
    fz({ kind: 'tone', hz: 420, toHz: 380, attackS: 0.0005, decayS: 0.012, db: -6 }),
  ]) }),
  rollRattle: fz({ levelDb: -24, durS: 0.6, variants: 2, layers: fz([
    fz({ kind: 'grains', n: 14, spreadS: 0.5, decayS: 0.003, bandpass: fz([900, 1.5]), db: 0 }),
  ]) }),
  practicePop: fz({ levelDb: -3, durS: 0.5, variants: 2, layers: fz([
    fz({ kind: 'noise', highpass: 1800, attackS: 0.0001, decayS: 0.002, db: 0 }),
    fz({ kind: 'noise', lowpass: 3000, attackS: 0.0003, decayS: 0.018, db: -3 }),
    fz({ kind: 'tone', hz: 140, toHz: 60, attackS: 0.001, decayS: 0.05, db: -4 }),
  ]) }),
  practiceWhoof: fz({ levelDb: -6, durS: 0.45, variants: 2, layers: fz([
    fz({ kind: 'noise', lowpass: 450, attackS: 0.03, decayS: 0.12, delayS: 0.01, db: 0 }),
    fz({ kind: 'noise', lowpass: 250, attackS: 0.05, decayS: 0.15, delayS: 0.02, db: 0 }),
  ]) }),
  tubeSnap: fz({ levelDb: -3, durS: 0.06, variants: 2, layers: fz([
    fz({ kind: 'noise', highpass: 2500, attackS: 0.0001, decayS: 0.0012, db: 0 }),
    fz({ kind: 'noise', bandpass: fz([1200, 1.0]), attackS: 0.0002, decayS: 0.006, db: -6 }),
  ]) }),
  steelStrike: fz({ levelDb: -8, durS: 0.25, variants: 3, layers: fz([
    fz({ kind: 'noise', highpass: 2000, attackS: 0.0001, decayS: 0.0015, db: 0 }),
    fz({ kind: 'tone', hz: 1800, toHz: 1800, attackS: 0.0003, decayS: 0.08, db: -3 }),
    fz({ kind: 'tone', hz: 3300, toHz: 3300, attackS: 0.0003, decayS: 0.05, db: -6 }),
    fz({ kind: 'tone', hz: 5100, toHz: 5100, attackS: 0.0003, decayS: 0.03, db: -9 }),
  ]) }),
  dustHiss: fz({ levelDb: -18, durS: 0.3, variants: 2, layers: fz([
    fz({ kind: 'noise', highpass: 3500, attackS: 0.01, decayS: 0.09, delayS: 0.005, db: 0 }),
  ]) }),
});

/** A device's level over the G-11's at 1 m (dB): the ratio of their peaks there (blast.js), 0 for the G-11 itself. */
export function sourceDb(model, pKpa) {
  const W = DEVICES[model]?.tntKg ?? DEVICES.g11.tntKg, ref = peakKPa(DEVICES.g11.tntKg, 1, pKpa), p = peakKPa(W, 1, pKpa);
  return ref > 0 && p > 0 ? 20 * Math.log10(p / ref) : 0;
}
/** The air's thinning of a burst at dM (dB; see the header): its peak there in pKpa over its peak in BLAST_REF_KPA, 0 in the house. */
export function thinDb(model, dM, pKpa) {
  const W = DEVICES[model]?.tntKg ?? DEVICES.g11.tntKg, r = Math.max(1, dM), here = peakKPa(W, r, pKpa), ref = peakKPa(W, r, BLAST_REF_KPA);
  return here > 0 && ref > 0 && Math.abs(pKpa - BLAST_REF_KPA) > 1e-9 ? 20 * Math.log10(here / ref) : 0;
}

/**
 * A burst as you hear it (see the header): { gainDb, lowpassHz, distM, pan, rate, delayS, gated, thump?, silent? }, or a voice
 * with silent: true (vacuum past THUMP_M). me { x, z }; at { x, z } the burst; model its device; suit: the sealed helmet worn;
 * soundMs, pKpa the air.
 */
export function blastVoice({ me = null, at = null, model = 'g11', suit = false, soundMs, pKpa, lagS = 0 } = {}) {
  needSound(soundMs);
  const dx = me && at ? at.x - me.x : 0, dz = me && at ? at.z - me.z : 0, distM = Math.hypot(dx, dz);
  const charge = DEVICES[model]?.kind === 'charge', pan = Math.max(-1, Math.min(1, dx / PAN_FULL_M));
  // (vacuum: the floor's thump alone, near and on the deck)
  if (!(airDb(pKpa) > -Infinity)) {
    const gainDb = Math.min(BANG_SOURCE_DB + sourceDb(model, BLAST_REF_KPA) + THUMP_DB + dbOfDist(distM), SUIT_GATE_DB);
    return { gainDb, lowpassHz: THUMP_LP_HZ, distM, pan, rate: charge ? BLAST_RATE : 1, delayS: lagS, gated: !!suit, thump: true, silent: distM > THUMP_M };
  }
  let gainDb = BANG_SOURCE_DB + sourceDb(model, pKpa) + airDb(pKpa) + thinDb(model, distM, pKpa) + dbOfDist(distM), lp = lowpassHz(pKpa), gated = false;
  if (suit) { gainDb = Math.min(gainDb + EARS_DB, SUIT_GATE_DB); lp = Math.min(lp, EARS_LP_HZ); gated = true; }
  return { gainDb, lowpassHz: lp, distM, pan, rate: charge ? BLAST_RATE : 1, delayS: lagS + (soundMs > 0 ? distM / soundMs : 0), gated };
}
/**
 * A quiet sound of the kit as you hear it (the pin, the lever, the knock, the tube's snap, the strike): its recipe's own level
 * at 1 m plus srcDb, the air's and the distance's, through the suit's electronics as speech (PROTECT_AT.suit), never over the
 * gate: { gainDb, lowpassHz, distM, pan, delayS, silent }. In vacuum only what touches you is heard (my call: none of these).
 */
export function kitVoice({ me = null, at = null, srcDb = 0, suit = false, soundMs, pKpa, lagS = 0 } = {}) {
  needSound(soundMs);
  const dx = me && at ? at.x - me.x : 0, dz = me && at ? at.z - me.z : 0, distM = Math.hypot(dx, dz);
  const air = airDb(pKpa);
  if (!(air > -Infinity)) return { gainDb: -Infinity, lowpassHz: THUMP_LP_HZ, distM, pan: 0, delayS: lagS, silent: true };
  let gainDb = srcDb + air + dbOfDist(distM), lp = lowpassHz(pKpa);
  if (suit) { gainDb = Math.min(gainDb + PROTECT_AT.suit.db, SUIT_GATE_DB); lp = Math.min(lp, PROTECT_AT.suit.lpHz); }
  return { gainDb, lowpassHz: lp, distM, pan: Math.max(-1, Math.min(1, dx / PAN_FULL_M)), delayS: lagS + (soundMs > 0 ? distM / soundMs : 0), silent: false };
}

/**
 * The presenter (see the header): { fact(type, payload, state), frame(state), ours, stats }. engine: { bang(kind, opts) } (bang.js's
 * ops, its CHAOS buffers with BLAST_RECIPES baked beside them). looks: { suitOn(state, pid) }.
 */
export function createBlast(engine, { looks = {} } = {}) {
  const stats = { bursts: 0, last: null, practice: 0, kit: { pin: 0, lever: 0, knock: 0, rattle: 0, tube: 0, strike: 0, dust: 0 }, lastKit: null };
  const suitOf = (state) => { try { return !!(looks.suitOn ? looks.suitOn(state, state.player?.id) : state.people?.[state.player?.id]?.kit?.worn?.suit); } catch { return false; } };
  /** Whether a fact is the kit's this presenter plays (a blast, a bang in the shoot house, a round at a door). */
  const ours = (type, f, state) => !!state && ((type === 'fx' && (f?.kind === 'blast' || (f?.kind === 'bang' && state.armoury?.range?.course === 'house'))) || (type === 'shot' && f?.target?.kind === 'door' && f?.fired !== false));
  const lagOf = (state, atMs) => (Number.isFinite(atMs) ? Math.max(0, Math.min(TICK_MS, atMs - (state.clock.ms - TICK_MS))) / 1000 : 0);
  // (a quiet kit sound played: its counter, its last voice)
  function kit(state, what, kind, at, atMs, srcDb = 0) {
    const a = playerActor(state), air = airHere(state);
    const v = kitVoice({ me: a ? { x: a.x, z: a.z } : null, at, srcDb, suit: suitOf(state), soundMs: air.soundMs, pKpa: air.pKpa, lagS: lagOf(state, atMs) });
    if (v.silent) return false;
    const ok = engine.bang(kind, { delayS: v.delayS, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan });
    if (ok) { stats.kit[what] = (stats.kit[what] ?? 0) + 1; stats.lastKit = { what, kind, gainDb: r1(v.gainDb), lowpassHz: Math.round(v.lowpassHz), distM: r1(v.distM) }; }
    return ok;
  }
  function fact(type, f, state) {
    if (!ours(type, f, state)) return false;
    // (a breach round: the R-7's own report is the range's (gun.js), the strike at the leaf and the frangible's dust are these)
    if (type === 'shot') {
      const at = doorAt(state, f.target?.door) ?? (f.muzzle ? { x: f.muzzle.x, z: f.muzzle.z } : null);
      const a = kit(state, 'strike', 'steelStrike', at, f.atMs, STRIKE_DB);
      kit(state, 'dust', 'dustHiss', at, f.atMs, DUST_DB);
      return a;
    }
    const a = playerActor(state), me = a ? { x: a.x, z: a.z } : null, air = airHere(state);
    const lagS = lagOf(state, f.atMs);
    const model = f.model ?? (state.items?.[f.id]?.model ?? 'g11');
    const v = blastVoice({ me, at: { x: f.x, z: f.z }, model, suit: suitOf(state), soundMs: air.soundMs, pKpa: air.pKpa, lagS });
    if (v.silent) return false;
    // (a practice grenade: its pop and its puff's whoof, never the bang)
    const practice = !!DEVICES[model]?.as;
    const ok = practice ? engine.bang('practicePop', { delayS: v.delayS, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan, rate: 1 }) : engine.bang('bangReport', { delayS: v.delayS, gainDb: v.gainDb, lowHz: v.lowpassHz, pan: v.pan, rate: v.rate });
    if (ok && practice) { engine.bang('practiceWhoof', { delayS: v.delayS + 0.01, gainDb: v.gainDb + WHOOF_DB, lowHz: Math.min(v.lowpassHz, 2000), pan: v.pan }); stats.practice++; }
    if (ok) { stats.bursts++; stats.last = { kind: f.kind, model, gainDb: r1(v.gainDb), lowpassHz: Math.round(v.lowpassHz), distM: r1(v.distM), gated: v.gated, ...(v.thump ? { thump: true } : {}), ...(practice ? { practice: true } : {}) }; }
    return ok;
  }
  // (the house's devices as the last frame left them: an item's state, and the moments already played, by item)
  let seen = new Map(), lastMs = null, session = '';
  /** The devices' small sounds (see the header): the moments the sim's clock passed since the last frame, each played once. */
  function frame(state) {
    if (!state || state.armoury?.range?.course !== 'house') { seen = new Map(); lastMs = null; return; }
    const ms = state.clock?.ms ?? 0, H = state.armoury.range.house, sk = `${state.meta?.seed ?? ''}|${H?.goAtMs ?? ''}`;
    if (sk !== session || lastMs === null || ms < lastMs || ms - lastMs > 1000) { session = sk; seen = snapshot(state); lastMs = ms; return; }
    const now = snapshot(state), within = (t) => Number.isFinite(t) && t > lastMs && t <= ms && ms - t <= LATE_MS;
    for (const [id, d] of now) {
      const was = seen.get(id);
      // (the pin pulled: armed in a hand from the pouch or held (D1's arm beat goes from the pouch to armed at once))
      if (d.kind === 'grenade' && d.st === 'armed' && was && was.st !== 'armed' && was.st !== 'live') kit(state, 'pin', 'pinClick', d.at, ms);
      // (the lever gone, at its own ms: a cook's, else the throw's release)
      if (d.kind === 'grenade' && within(d.leverAtMs)) kit(state, 'lever', 'leverSnap', d.leverAt ?? d.at, d.leverAtMs);
      // (the floor: each bounce, else the landing, by the speed it hits with, and the roll's rattle after it)
      for (const b of d.bounces ?? []) if (within(b.atMs)) { kit(state, 'knock', 'floorKnock', { x: b.x, z: b.z }, b.atMs, Math.min(0, KNOCK_DB + 20 * Math.log10(Math.max(0.5, b.vMs) / KNOCK_REF_MS))); }
      if (within(d.landMs) && !(d.bounces?.length)) {
        kit(state, 'knock', 'floorKnock', d.land, d.landMs, Math.min(0, KNOCK_DB + 20 * Math.log10(Math.max(0.5, d.landV) / KNOCK_REF_MS)));
        kit(state, 'rattle', 'rollRattle', d.land, d.landMs + 30);
      }
      // (a charge fired: the tube's snap at the FD-1, the charge's report 1.5 ms a 3 m of tube later, the sim's burst)
      if (d.kind === 'charge' && Number.isFinite(d.fuseAtMs) && !Number.isFinite(was?.fuseAtMs)) kit(state, 'tube', 'tubeSnap', d.firer ?? d.at, ms, TUBE_SNAP_DB);
    }
    seen = now; lastMs = ms;
  }
  return { fact, frame, ours, stats };
}

// (the house's devices now, by item: kind, state, where (its holder's place or where it lies), its flight's moments)
function snapshot(state) {
  const out = new Map(), place = new Map();
  for (const site of Object.values(state.places?.sites ?? {})) for (const l of site?.items ?? []) place.set(l.id, { x: l.x, z: l.z });
  const actorAt = (pid) => { const a = playerActor(state)?.who === pid ? playerActor(state) : state.actors?.list?.find(x => x.who === pid); return a ? { x: a.x, z: a.z } : null; };
  for (const [pid, p] of Object.entries(state.people ?? {})) for (const id of p?.kit?.hands ?? []) if (id) place.set(id, actorAt(pid));
  for (const [id, rec] of Object.entries(state.items ?? {})) {
    const D = DEVICES[rec?.model];
    if (!D || (rec.type !== 'grenade' && rec.type !== 'charge')) continue;
    const F = rec.flight, at = place.get(id) ?? null;
    const d = { kind: rec.type, st: rec.st ?? (rec.type === 'grenade' ? 'pouched' : 'pouched'), at, fuseAtMs: rec.type === 'charge' && rec.st === 'primed' ? rec.fuseAtMs : undefined };
    if (F) {
      d.leverAtMs = Number.isFinite(rec.leverAtMs) ? rec.leverAtMs : F.fromMs;
      d.leverAt = { x: F.x0, z: F.z0 };
      d.landMs = F.landMs; d.land = { x: F.x1, z: F.z1 };
      const t = Math.max(0, (F.landMs - F.fromMs) / 1000);
      d.landV = Math.hypot(F.vx ?? 0, (F.vy ?? 0) - (F.g ?? 9.8) * t, F.vz ?? 0);
      d.bounces = Array.isArray(F.bounces) ? F.bounces : null;
    } else if (Number.isFinite(rec.leverAtMs)) d.leverAtMs = rec.leverAtMs;
    // (the firing point: the FD-1 where it lies, else the man who placed the charge (D1's byId; its tube `tubeId`, D2's `chargeId`))
    if (rec.type === 'charge') { const fd = rec.tubeId ?? Object.entries(state.items).find(([, r]) => r?.type === 'initiator' && r.chargeId === id)?.[0]; d.firer = (fd ? place.get(fd) : null) ?? (rec.byId ? actorAt(rec.byId) : null); }
    out.set(id, d);
  }
  return out;
}
// (a door's middle, for the strike at its leaf)
function doorAt(state, door) {
  const o = door ? openingOf(door) : null;
  if (!o || !Number.isFinite(o.at)) return null;
  return o.axis === 'x' ? { x: (o.a + o.b) / 2, z: o.at } : { x: o.at, z: (o.a + o.b) / 2 };
}
