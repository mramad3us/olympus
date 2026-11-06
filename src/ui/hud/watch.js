// OLYMPUS hud: the wrist terminal's watch, the HUD's clock (VIEWS §7.1, TIME §3.1 and §3.2).
//
// Every marine wears a wrist terminal, so the watch is always on the HUD this round (TIME §3.2's
// clock rule: the suit HUD when sealed, else the wrist terminal; the suit comes later). Its faces
// are TIME §3.1's, from the same helpers the wall clocks read (src/sim/time/dates.js marsClock over
// SETTING's calendar, core's utcText), so a wall clock and the watch never disagree (ROADMAP §4.4's
// moment 2: "the wall clock and the watch agree"; places/clocks.js wallClockAt is the wall's side):
//   time     'HH:MM' on Melas time, large; through the timeslip it reads '24:00' (the wall clock's
//            hands stand at 12) with a TIMESLIP badge and the minutes into it ('+12');
//   weekday and sol: 'Monday · Sol 590 · MY 211' (SETTING's week and year);
//   utc      'Wed 19 Dec 2351 02:20 UTC', its second line, the clock ships and the Corps keep;
//   place    the place as you know it: places' placeLine, the live area's name and the room you
//            stand in ('Echo Company barracks · 1st Squad, 2nd Platoon').
// watchFaces(state) is the pure part (the ui-watch test compares it with wallClockAt on a thousand
// times); createWatch(parent) the DOM, in the WATCH rectangle (layout.js), written only when a face
// changes, so a frame costs a string compare.
import { marsClock, weekdayName } from '../../sim/time/dates.js';
import { utcText } from '../../core/calendar.js';
import { MIN_MS } from '../../core/clock.js';
import * as places from '../../sim/places/model.js';

const pad2 = (n) => String(n).padStart(2, '0');

/** The watch's faces now: { time 'HH:MM', slip, slipMin, sol 'Sol 590 · MY 211', weekday 'Monday', utc, place }. */
export function watchFaces(state, { lonEDeg = null } = {}) {
  const ms = state.clock.ms, lon = lonEDeg ?? places.lonOf(state), c = marsClock(ms, lon);
  let place = '';
  try { place = places.placeLine?.(state) || ''; } catch { place = ''; }
  if (!place) place = places.liveArea(state)?.name ?? '';
  return {
    time: `${pad2(c.hour)}:${pad2(c.minute)}`, slip: !!c.timeslip, slipMin: c.timeslip ? Math.floor(c.slipMs / MIN_MS) : 0,
    sol: `Sol ${c.solOfYear} · MY ${c.my}`, weekday: weekdayName(c.sol), utc: utcText(ms), place,
  };
}

/** The watch on the page: { el, update(state) }. */
export function createWatch(parent) {
  const el = (tag, className, text = '') => Object.assign(document.createElement(tag), { className, textContent: text });
  const root = el('div', 'watch'), timeRow = el('div', 'time'), t = el('span', 't'), slip = el('span', 'slip', 'TIMESLIP');
  const day = el('div', 'date'), utc = el('div', 'utc'), place = el('div', 'place');
  slip.hidden = true;
  timeRow.append(t, slip);
  root.append(timeRow, day, utc, place);
  parent.append(root);
  const put = (node, text) => { if (node.textContent !== text) node.textContent = text; };
  return {
    el: root,
    update(state) {
      const f = watchFaces(state);
      put(t, f.time);
      slip.hidden = !f.slip;
      if (f.slip) put(slip, `TIMESLIP +${f.slipMin}`);
      put(day, `${f.weekday} · ${f.sol}`);
      put(utc, f.utc);
      put(place, f.place);
      return f;
    },
  };
}
