// OLYMPUS hud: the wrist terminal's watch, the HUD's clock (VIEWS §7.1, TIME §3.1 and §3.2).
//
// Every marine wears a wrist terminal, so the watch is always on the HUD this round (TIME §3.2's
// clock rule: the suit HUD when sealed, else the wrist terminal; the suit comes later). Its faces
// are TIME §3.1's, from the same helper the wall clocks read (src/sim/places/env.js timeAt: the live
// site's clock, localTime, over SETTING's calendar at Melas; core's utcText), so a wall clock and the
// watch never disagree (ROADMAP §4.4's moment 2: "the wall clock and the watch agree"; places/clocks.js
// wallClockAt is the wall's side). The face is the site's (ROADMAP "anywhere"'s step 3): at Melas
//   time     'HH:MM' on Melas time, large; through the timeslip it reads '24:00' (the wall clock's
//            hands stand at 12) with a TIMESLIP badge and the minutes into it ('+12');
//   weekday and sol: 'Monday · Sol 590 · MY 211' (SETTING's week and year);
// and on a ship's UTC 'HH:MM' with 'Thursday · 22 Mar 2351' (no slip);
//   utc      'Wed 19 Dec 2351 02:20 UTC', its second line, the clock ships and the Corps keep;
//   place    the place as you know it: places' placeLine, the live area's building, its floor and the
//            room you stand in ('Echo Company barracks, ground floor · 1st Squad, 2nd Platoon'), shown on
//            two lines, the building and floor over the room (from 0.0.5: the user, 2026-11-06, took the
//            upper floor for "N-1" with no floor named anywhere).
//   strip    the body strip folded in (VIEWS §7.6; hud/strip.js): only the glyphs whose felt band has
//            left fine, so it is empty when all is well (pillar 1: not a row of meters to keep green), on
//            the time row's left, where the large right-aligned time leaves room (my call: the watch keeps
//            its four lines inside its 132 px).
// watchFaces(state) is the pure part (the ui-watch test compares it with wallClockAt on a thousand
// times); { site } reads another site's clock, { lonEDeg } Mars's at a longitude (the tests' form),
// neither the live site's (the start site's before one is entered); { ms } reads another time than
// the clock's, the splash's clock plaque the time shown
// (hud/splash.js), from the same helper, so the plaque and the watch never disagree. createWatch(parent)
// the DOM, in the WATCH rectangle (layout.js), written only when a face changes, so a frame costs a
// string compare; update(state, { strip }) takes the strip's entries (BODY's stripOf, folded by main.js).
import { utcText } from '../../core/calendar.js';
import { MIN_MS } from '../../core/clock.js';
import * as places from '../../sim/places/model.js';
import { timeAt, siteAt } from '../../sim/places/env.js';
import { createStrip, foldedOf } from './strip.js';

const pad2 = (n) => String(n).padStart(2, '0');

/** The watch's faces now (or at ms): { time 'HH:MM', slip, slipMin, sol 'Sol 590 · MY 211' (a day's date on UTC), weekday 'Monday', utc, place, face }. */
export function watchFaces(state, { lonEDeg = null, site = null, ms: atMs = null } = {}) {
  const ms = atMs ?? state.clock.ms, c = timeAt(site ?? lonEDeg ?? siteAt(state), ms);
  let place = '';
  try { place = places.placeLine?.(state) || ''; } catch { place = ''; }
  if (!place) place = places.liveArea(state)?.name ?? '';
  return {
    time: `${pad2(c.hour)}:${pad2(c.minute)}`, slip: !!c.timeslip, slipMin: c.timeslip ? Math.floor(c.slipMs / MIN_MS) : 0,
    sol: c.dateLabel, weekday: c.weekdayName, utc: utcText(ms), place, face: c.face,
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
  // (the strip on the time row's left, which the large right-aligned time leaves empty: the watch keeps its four lines)
  const strip = createStrip(timeRow, { className: 'strip folded' });
  timeRow.prepend(strip.el);
  parent.append(root);
  const put = (node, text) => { if (node.textContent !== text) node.textContent = text; };
  // (the place on two lines, the building and its floor over the room, so a long line never wraps at its
  // separator; its text is still placeLine's one line, the separator kept in a hidden span)
  const putPlace = (text) => {
    if (place.textContent === text) return;
    const at = text.indexOf(' · ');
    if (at < 0) { place.textContent = text; return; }
    const sep = el('span', 'sep', ' · ');
    sep.hidden = true;
    place.replaceChildren(text.slice(0, at), sep, document.createElement('br'), text.slice(at + 3));
  };
  return {
    el: root,
    update(state, { strip: entries = null } = {}) {
      const f = watchFaces(state);
      f.strip = strip.update(entries ? foldedOf(entries) : []);
      put(t, f.time);
      slip.hidden = !f.slip;
      if (f.slip) put(slip, `TIMESLIP +${f.slipMin}`);
      put(day, `${f.weekday} · ${f.sol}`);
      put(utc, f.utc);
      putPlace(f.place);
      return f;
    },
  };
}
