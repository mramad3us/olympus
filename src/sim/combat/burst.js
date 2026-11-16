// OLYMPUS sim: a burst, the one writer of what a grenade or a charge does when it goes off (COMBAT §11.3, §11.4, §25.20; WEAPONS §12.4, §12.5; the build sheet 0.0.18 §2.3).
//
// burst(state, bus, { id, model, x, z, atMs, byId, called, door }) is one pure event on the live area:
//   1. The room: places/model.js roomOf at the burst, with the rooms joined to it through a doorway (no leaf: one space, room
//      3's two legs) its `in`, and those joined through a door standing open its `next`; its volume their rects × ceilingM. The
//      ambient is env.js airAt there (the Wheel's 66 kPa; vacuum gives the flash alone).
//   2. People: a flash grenade through supp.js bang() with that room (FLASH_PTS 60 in it, FLASH_NEXT_PTS 20 next door, the flash
//      by facing, the deafness of an unprotected ear), the thrower's team prepared (the stack called it: "Bang out!",
//      "Breaching!"); a charge's blast as supp.js 'blast' input at its distance, prepared for the stack. Everyone's peak
//      (blast.js peakKPa) and the room's QSP are noted (a peak recorded at most PEAK_RECORD_KPA: in vacuum the fireball's is
//      Infinity, which a save cannot hold); at STUN_KPA 20 or more, combat.stunUntilMs at U(2, 6) s (COMBAT §11.3:
//      overpressure, not a startle). That stun on people is recorded only: in D1 nothing of a person reads it (the stepper and
//      the startle are D2's to join), and only the stands' daze (3.) acts. The stack's peak at a charge is the run sheet's
//      STACK IN THE BLAST past BREACH_SAFE_KPA.
//   3. The house's stands (the instructor's brief: "treat every target as unsuited"): each threat or no-shoot stand of the
//      room is scored as a man in utilities would be dazed (COMBAT §25.18.2's cell member, TARGET_H 8), the longest of
//      flash-blind FLASH_BLIND_MS 5,000 facing the burst within FLASH_CONE_DEG 60 (a flash grenade), the startle
//      startleMsOf({ u, H: 8 }) (1.27 to 2.54 s), the stun U(2, 6) s at STUN_KPA or more. It writes T.dazeUntilMs, which the
//      scene's turn and par wait on (shoothouse.js triggers, parFrom). The constants are supp.js's (SUPP_HOME) and blast.js's.
//   4. Doors: a charge's own door blows open (its leaf's BLAST_KPA under the peak at its middle), the house's record
//      R.house.broken[id] the burst's ms; a grenade's flash opens nothing (my call: its small filler's local peak is no
//      load on a leaf).
//   5. The record: the 'fx' fact (bang() says 'bang' for a flash; a charge 'blast'), the item taken off the game
//      (kit.discard), and R.house.bursts.push({ id, model, x, z, atMs, room, byId, kPa: { <pid or stand>: n }, daze:
//      { <stand>: { kind, ms } }, door?, thrown?, atFeet? }): plain data for the run sheet and the target view (`thrown`, the
//      door a grenade was thrown through, the leg its marks go on).
// v0.0.19 (D2, the build sheet 0.0.19 §0 items 1, 2): a practice grenade (a model with DEVICES[model].as, the G-9P and G-13P)
// bursts as its 4 g spotting charge, and **the instructor's read is its only effect on the stands**: step 3 is skipped for it (no
// startle from the pop), and practice.js readBurst, the live twin's read, goes on the record as `read` (house-kit.js readsTick
// turns away and dazes the stands it puts down or stuns: one source a burst). The BC-1's door blown records its method on the
// house's R.house.breach[door] = { how: 'cut', atMs }, R.house.broken[door] staying its ms (D1's ways write nothing new, so
// v0.0.18's lanes keep their saves to the byte: breach.js breachHowOf reads 'charge', 'pry' or 'ram' from what is absent).
// tickDevices(state, bus, now) bursts every grenade whose fuse has run and every charge fired whose count has run, at its own
// ms (fuseAtMs), so a cut drill never leaves one burning. stackOf(state) is the shoot house's two (you and your #2).
// Pure but burst and tickDevices, which write the people, the stands, the doors, the items and the record.
import { stream, next, range } from '../../core/rng.js';
import { playerActor, playerId } from '../../core/ids.js';
import { roomOf, areaOf, openingOf, openingState, setOpening } from '../places/model.js';
import { airAt } from '../places/env.js';
import { bang, addSupp, inputPts, startleMsOf, FLASH_CONE_DEG, FLASH_BLIND_MS } from './supp.js';
import { peakKPa, qspKPa, BLAST_KPA, STUN_KPA } from '../arms/blast.js';
import { DEVICES, liveDevices } from '../arms/devices.js';
import { readBurst } from './practice.js';
import { discard, holderOf } from '../arms/kit.js';

/** The bang's window: an entry later than this after the burst gives them back the bang (COMBAT §25.18.2's, ms). */
export const BANG_LATE_MS = 2000;
/** A stand is scored as a man in utilities, a cell member's hardening (COMBAT §25.18.2). */
export const TARGET_H = 8;
/** The stun's length (COMBAT §11.3), ms. */
export const STUN_MS = Object.freeze([2000, 6000]);
/** A peak is recorded at most this (kPa): the fireball's in vacuum is Infinity, which JSON writes as null (my call). */
export const PEAK_RECORD_KPA = 10_000;
/** A stand of these faces is dazed by a burst in its room (the turners' faces: a threat, an armoured man, the hostage card's hostile, a no-shoot, a draw). */
export const DAZED_FACES = Object.freeze(['threat', 'armoured', 'hostage', 'noshoot', 'draw', 'phone', 'hands']);

const D2R = Math.PI / 180;
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
const r1 = (x) => Math.round(Math.min(x, PEAK_RECORD_KPA) * 10) / 10;
const houseOf = (state) => (state.armoury?.range?.course === 'house' ? state.armoury.range.house ?? null : null);
const doorMid = (o) => (o.axis === 'x' ? [(o.a + o.b) / 2, o.at] : [o.at, (o.a + o.b) / 2]);

/** The shoot house's stack (you and your #2), the people a stack's own call prepares. */
export function stackOf(state) {
  const H = houseOf(state), me = playerId(state);
  return [me, H?.twoPid ?? null].filter(Boolean);
}

/** A burst's room (see the header): { area, id, in: [room ids], next: [room ids], volM3 } or null outdoors. */
export function burstRoom(state, area, x, z) {
  const A = areaOf(area), r = A ? roomOf(A, x, z) : null;
  if (!A || !r) return null;
  const inSet = new Set([r.id]), next = new Set();
  // (joined through a doorway: one space; through a door standing open: the next room)
  for (let pass = 0; pass < 3; pass++) for (const o of A.openings ?? []) {
    if (!o.rooms?.some(id => inSet.has(id))) continue;
    for (const id of o.rooms) if (!inSet.has(id)) { if (o.kind === 'doorway') inSet.add(id); }
  }
  for (const o of A.openings ?? []) {
    if (!o.rooms?.some(id => inSet.has(id)) || o.kind === 'doorway') continue;
    if (openingState(state, o) === 'open') for (const id of o.rooms) if (!inSet.has(id)) next.add(id);
  }
  const rect = (id) => A.rooms.find(q => q.id === id);
  const volM3 = [...inSet].reduce((n, id) => { const q = rect(id); return n + (q ? (q.rect[2] - q.rect[0]) * (q.rect[3] - q.rect[1]) * (q.ceilingM ?? 2.8) : 0); }, 0);
  return { area, id: r.id, in: [...inSet], next: [...next], volM3: Math.round(volM3 * 10) / 10 };
}

/** A door charge's room (see burst): both rooms the opening joins as one, each with what joins it through a doorway. */
export function doorRoom(state, area, door) {
  const o = openingOf(door), A = areaOf(area);
  if (!o || !A) return null;
  const parts = (o.rooms ?? []).map(id => { const r = A.rooms.find(q => q.id === id); return r ? burstRoom(state, area, (r.rect[0] + r.rect[2]) / 2, (r.rect[1] + r.rect[3]) / 2) : null; }).filter(Boolean);
  if (!parts.length) return null;
  const inSet = [...new Set(parts.flatMap(p => p.in))], next = [...new Set(parts.flatMap(p => p.next))].filter(id => !inSet.includes(id));
  return { area, id: parts[0].id, in: inSet, next, volM3: Math.round(parts.reduce((n, p) => n + p.volM3, 0) * 10) / 10 };
}
/**
 * A burst (w; see the header). Returns { id, model, room, kPa, daze, people: bang()'s or the blast's per person }.
 */
export function burst(state, bus, { id, model, x, z, atMs = state.clock.ms, byId = null, called = true, door = null }) {
  const D = DEVICES[model];
  if (!D) throw new Error(`burst(): no device '${model}'`);
  const area = state.places?.live?.area, air = airAt(state, area, x, z), Pa = air?.vacuum ? 0 : air?.pKpa ?? 0;
  // (a charge on a door bursts on both its sides: the rooms the opening joins, its leaf blown open (my call))
  const room = door ? doorRoom(state, area, door) ?? burstRoom(state, area, x, z) : burstRoom(state, area, x, z), qsp = room && Pa > 0 ? qspKPa(D.tntKg ?? 0, room.volM3) : 0;
  const team = byId && stackOf(state).includes(byId) && called ? stackOf(state) : byId ? [byId] : [];
  const kPa = {}, daze = {}, out = { id, model, room: room?.id ?? null, kPa, daze, people: [] };
  // (2. people: the flash through bang() with the room; a charge's blast as the supp input; every peak noted)
  if (D.flash) out.people = bang(state, bus, { id, x, z, atMs, byId, indoor: !!room, room, prepared: team, call: null });
  const me = playerActor(state), actors = [...(me ? [me] : []), ...(state.actors?.list ?? []).filter(a => a !== me && a.who !== me?.who)];
  for (const a of actors) {
    if (!a.who) continue;
    // (the height apart too: the instructor on the catwalk 3.0 m over the hall (a.y), who stood 1.20 m from room 1's charge on the
    // plan and took 103.5 kPa there (the play review of v0.0.18); everyone on the floor as before)
    const rM = Math.hypot(a.x - x, a.z - z, a.y ?? 0), peak = Math.max(peakKPa(D.tntKg ?? 0, rM, Pa), roomOf(areaOf(area), a.x, a.z) && room?.in.includes(roomOf(areaOf(area), a.x, a.z)?.id) ? qsp : 0);
    if (peak >= 1) kPa[a.who] = r1(peak);
    if (!D.flash && Pa > 0) {
      const w = addSupp(state, bus, a.who, { id: `${id}`, kind: 'blast', pts: inputPts('blast', { rM }), prep: team.includes(a.who) ? 'prepared' : 'unprepared', why: 'the blast', atMs });
      if (w) out.people.push({ who: a.who, pts: inputPts('blast', { rM }), felt: w.after ?? 0, startleMs: w.startleMs });
    }
    if (peak >= STUN_KPA) {
      const u = next(stream(state.meta.seed, 'combat:stun', a.who, id));
      const rec = (a.combat ??= { supp: 0, suppAtMs: atMs, suppRate: 2, startleFromMs: null, startleUntilMs: null, blindUntilMs: null, dazzleUntilMs: null, deafUntilMs: null });
      rec.stunUntilMs = Math.max(rec.stunUntilMs ?? 0, atMs + Math.round(STUN_MS[0] + (STUN_MS[1] - STUN_MS[0]) * u));
    }
  }
  if (!D.flash) bus?.emit('fx', { kind: 'blast', id, x, y: 0.3, z, atMs, by: byId ?? null, model });
  // (3. the house's stands in the room, dazed as men in utilities would be)
  const R = state.armoury?.range;
  for (const T of R?.turners ?? []) {
    // (v0.0.19: a practice grenade's stands are the read's alone (see the header))
    if (D.as) break;
    if (!room || !room.in.includes(T.room) || T.stoppedAtMs !== null && T.stoppedAtMs !== undefined || !DAZED_FACES.includes(T.face)) continue;
    const rM = Math.hypot(T.x - x, T.z - z), peak = Math.max(peakKPa(D.tntKg ?? 0, rM, Pa), qsp);
    kPa[T.key] = r1(peak);
    const r = stream(state.meta.seed, 'combat:daze', T.key, id);
    const startle = startleMsOf({ u: next(r), H: TARGET_H }), stun = peak >= STUN_KPA ? Math.round(range(r, STUN_MS[0], STUN_MS[1])) : 0;
    let blind = 0;
    if (D.flash && Pa >= 0) {
      const face = standFacing(state, T, room);
      const off = Math.abs(wrap(Math.atan2(z - T.z, x - T.x) - face)) / D2R;
      if (off < FLASH_CONE_DEG) blind = FLASH_BLIND_MS;
    }
    const ms = Math.max(blind, startle, stun), kind = ms === blind && blind ? 'blind' : ms === stun && stun ? 'stunned' : 'startled';
    T.dazeUntilMs = Math.max(T.dazeUntilMs ?? 0, atMs + ms);
    daze[T.key] = { kind, ms };
  }
  // (4. a charge's own door blows open)
  if (door) {
    const o = openingOf(door);
    if (o) {
      const [mx, mz] = doorMid(o), peak = peakKPa(D.tntKg ?? 0, Math.hypot(mx - x, mz - z), Pa);
      if (peak >= (BLAST_KPA[o.kind] ?? BLAST_KPA.door)) {
        setOpening(state, o.id, 'open', { atMs: atMs + 100 });
        ((state.$places ??= {}).moving ??= new Set()).add(o.id);
        const H = houseOf(state);
        if (H) { (H.broken ??= {})[o.id] = atMs; if (model === 'bc1') (H.breach ??= {})[o.id] = { how: 'cut', atMs }; }
        bus?.emit('door', { id: o.id, area, x: mx, z: mz, state: 'open', kind: o.kind, who: byId, how: 'blown' });
        out.blown = o.id;
      }
    }
  }
  // (v0.0.19: the instructor's read of a practice grenade, before its item leaves the game (its flight: the throw's exposure, the floor's time))
  const read = D.as && houseOf(state) ? readBurst(state, { burst: id, model, x, z, atMs, room, byId }) : null;
  // (5. the record)
  if (state.items?.[id]?.flight?.atFeet) out.atFeet = true;
  const thrown = state.items?.[id]?.flight?.door ?? null;
  if (state.items?.[id]) discard(state, id);
  const H = houseOf(state);
  if (H) (H.bursts ??= []).push({ id, model, x: Math.round(x * 1000) / 1000, z: Math.round(z * 1000) / 1000, atMs, room: room?.id ?? null, byId, kPa, daze, ...(out.blown ? { door: out.blown } : {}), ...(thrown ? { thrown } : {}), ...(out.atFeet ? { atFeet: true } : {}), ...(read ? { read } : {}) });
  if (read) out.read = read;
  return out;
}

// (the way a stand faces: its own where its record says, else toward its room's door, as a man in the room watches it)
function standFacing(state, T, room) {
  if (Number.isFinite(T.faceRad)) return T.faceRad;
  const A = areaOf(room.area), o = (A?.openings ?? []).find(x => x.kind !== 'doorway' && x.rooms?.some(id => room.in.includes(id)) && x.rooms.some(id => !room.in.includes(id)));
  if (!o) return 0;
  const [mx, mz] = doorMid(o);
  return Math.atan2(mz - T.z, mx - T.x);
}

/** Every grenade whose fuse has run and every fired charge whose count has run bursts at its own ms (w; see the header). Returns the bursts. */
export function tickDevices(state, bus, now = state.clock.ms) {
  const out = [];
  // (v0.0.19: a cooked grenade still in a hand when its fuse runs goes off there, at the holder's feet (a cut drill never leaves
  // one burning unseen: the hands' own record, not the floor's))
  for (const a of [playerActor(state), ...(state.actors?.list ?? [])].filter(Boolean)) {
    const kit = a.who ? state.people?.[a.who]?.kit : null;
    for (const id of kit?.hands ?? []) {
      const rec = id ? state.items?.[id] : null;
      if (rec?.type !== 'grenade' || rec.st !== 'live' || !Number.isFinite(rec.fuseAtMs) || rec.fuseAtMs > now) continue;
      out.push(burst(state, bus, { id, model: rec.model, x: a.x, z: a.z, atMs: rec.fuseAtMs, byId: a.who, called: false, door: null }));
    }
  }
  for (const d of liveDevices(state)) {
    const rec = state.items[d.id];
    if (!Number.isFinite(rec?.fuseAtMs) || rec.fuseAtMs > now) continue;
    if (d.kind === 'charge' && d.st !== 'primed') continue;
    out.push(burst(state, bus, { id: d.id, model: d.model, x: d.x, z: d.z, atMs: rec.fuseAtMs, byId: rec.byId ?? null, called: true, door: rec.door ?? null }));
  }
  return out;
}
/** Whether a device is anywhere still (held, pouched, lying): kit.js holderOf. */
export const deviceHeld = (state, id) => !!holderOf(state, id);

/** A burst's smoke and body stay drawn this long after it (ms; render/range-items.js BANG_SMOKE_MS's order, my call). */
export const BURST_LOOK_MS = 12_000;
/**
 * The house's devices as the stage draws them (look.js's house look; the bangs layer's records): the grenades thrown and still
 * burning, from their flight (the arc from the hand at its release to the floor, the flash at the fuse), and the bursts of the
 * last BURST_LOOK_MS: [{ id, x, z, fromX, fromZ, throwAtMs, atMs, done, model }], plain numbers, nothing written.
 */
export function devicesLook(state, ms = state?.clock?.ms ?? 0) {
  const out = [], H = state?.armoury?.range?.course === 'house' ? state.armoury.range.house : null;
  for (const d of liveDevices(state)) {
    const rec = state.items[d.id], F = rec?.flight;
    if (d.kind !== 'grenade' || !F || !Number.isFinite(rec.fuseAtMs)) continue;
    out.push({ id: d.id, x: d.x, z: d.z, fromX: F.x0, fromZ: F.z0, throwAtMs: F.fromMs, atMs: rec.fuseAtMs, done: false, model: d.model });
  }
  for (const b of H?.bursts ?? []) if (ms - b.atMs < BURST_LOOK_MS && ms >= b.atMs) out.push({ id: b.id, x: b.x, z: b.z, atMs: b.atMs, done: true, model: b.model });
  return out;
}
