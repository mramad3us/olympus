// OLYMPUS tests: F84, the held device drawn (the build sheet v0.0.22 §1 item 17, §8; the residuals lens's R3; kit-10 of the v0.0.18 hunt).
//
// On every tick of a kit lane with a device in a hand (devices.js handDeviceOf: yours or your number two's), the figure's look carries
// it (look.js heldLook: its model, shape and colour), the frame a body standing with it draws is in the stance pool's held band
// (poses.js heldFrameOf) and the held strip has its card in every facing (atlas.js heldStrip: drawn, not an empty card in all four),
// and a grenade's card ends on the tick before its flight begins: the last tick heldLook names it is its flight's fromMs less one
// tick, and from fromMs the devices layer has it (burst.js devicesLook), so it is never both and never neither. heldGauge() watches a
// lane tick by tick (each(state)) and end() gives { F84: { ok, …figures } }; printed by its runners (look-held: the hunt's lane quick,
// the kit lanes heavy). Enforced from D's merge.
import { handDeviceOf, DEVICES } from '../src/sim/arms/devices.js';
import { heldLook, beatOf } from '../src/sim/arms/look.js';
import { devicesLook } from '../src/sim/combat/burst.js';
import { heldFrameOf, DIRS } from '../src/art/figures/poses.js';
import { heldStrip, heldKey } from '../src/art/figures/atlas.js';
import { TICK_MS } from '../src/core/clock.js';

/** The gauges this file enforces (from D's merge: the build sheet v0.0.22 §8). */
export const HELD_ENFORCED = Object.freeze(new Set(['F84']));
/** The F84 watcher (see the header). */
export function heldGauge() {
  const strip = heldStrip(16);
  const out = { handTicks: 0, carried: 0, uncarried: [], undrawn: [], flights: 0, flightsOk: 0, flightBad: [], frames: {} };
  const lastHeld = new Map(), seenFlight = new Set();
  function each(state) {
    const ms = state.clock.ms, H = state.armoury?.range?.house;
    for (const pid of [state.player.id, H?.twoPid].filter(Boolean)) {
      const a = state.actors.list.find(x => x.who === pid), h = handDeviceOf(state, pid), L = a ? heldLook(state, a, ms) : null;
      if (L) lastHeld.set(L.id, ms);
      if (!h) continue;
      out.handTicks++;
      const look = DEVICES[h.model]?.look;
      if (L && L.id === h.id && L.shape === look.shape && L.colour === look.colour) out.carried++;
      else if (out.uncarried.length < 5) out.uncarried.push({ ms, pid, model: h.model, L });
      if (!L) continue;
      const f = heldFrameOf(L, beatOf(state, pid, ms));
      out.frames[f] = (out.frames[f] ?? 0) + 1;
      const cards = DIRS.map(d => strip.index.get(heldKey(L.shape, L.colour, f, d)));
      if (!f || cards.some(c => !c) || cards.every(c => !c.w)) { if (out.undrawn.length < 5) out.undrawn.push({ ms, pid, shape: L.shape, frame: f }); }
    }
    // (each grenade's flight, the tick it is first drawn: the card's last tick was the one before)
    for (const d of devicesLook(state, ms)) {
      if (d.done || seenFlight.has(d.id) || !Number.isFinite(d.throwAtMs) || ms < d.throwAtMs) continue;
      seenFlight.add(d.id); out.flights++;
      const last = lastHeld.get(d.id), by = state.actors.list.find(x => x.who === state.items[d.id]?.byId);
      if (Number.isFinite(last) && last < d.throwAtMs && last >= d.throwAtMs - TICK_MS && ms < d.throwAtMs + TICK_MS && heldLook(state, by, ms)?.id !== d.id) out.flightsOk++;
      else out.flightBad.push({ id: d.id, model: d.model, last, from: d.throwAtMs, firstDrawn: ms });
    }
  }
  function end() {
    const ok = out.carried === out.handTicks && !out.undrawn.length && out.flights === out.flightsOk;
    return { F84: { ok, ...out } };
  }
  return { each, end };
}
/** F84's line, as the runners print it. */
export const f84Line = (r) => `F84 ${r.ok ? 'MET' : 'OPEN'}: ${r.carried} of ${r.handTicks} ticks with a device in a hand carried by the look, ${r.undrawn.length} undrawn; ${r.flightsOk} of ${r.flights} flights begun the tick after the card's last; frames ${Object.entries(r.frames).map(([f, n]) => `${f} ${n}`).join(', ')}`;
