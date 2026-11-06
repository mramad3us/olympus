// OLYMPUS places: what a wall clock reads, from the same helpers as the watch (TIME §3.2; the build sheet 0.0.3 §2.1).
//
// A wallClock fixture shows one face or two (its `faces`: ['melas'] in a bay, ['melas', 'utc'] on the
// duty desk's stand), and every face reads the game's one clock through the watch's own helpers
// (src/sim/time/dates.js marsClock, core's utc), so the clock on the bay's wall and the watch on the
// wrist never disagree (ROADMAP §4.4's moment 2: "the wall clock and the watch agree"). A face is
// { face, hour, minute, slip, text: 'HH:MM', hourDeg, minuteDeg }: the hands of a twelve-hour dial
// from twelve o'clock clockwise, the hour hand moving with the minutes, both standing on whole minutes
// so the hands and the text say the same thing. Through the Mars timeslip the Melas face reads 24:00
// and its hands stand at 12 (slip true), as a station's clocks are stopped for it (TIME §2.4); the UTC
// face never slips. Pure.
import { marsClock } from '../time/dates.js';
import { utc } from '../../core/calendar.js';

const pad2 = (n) => String(n).padStart(2, '0');
// (a face from an hour and a minute: the text and the hands of a twelve-hour dial)
const face = (name, hour, minute, slip) => Object.freeze({
  face: name, hour, minute, slip, text: `${pad2(hour)}:${pad2(minute)}`,
  hourDeg: slip ? 0 : ((hour % 12) * 30 + minute * 0.5), minuteDeg: slip ? 0 : minute * 6,
});

/** One face of a clock at a game time: 'melas' (the site's civil time, at lonEDeg) or 'utc'. */
export function faceAt(name, ms, lonEDeg) {
  if (name === 'utc') { const u = utc(ms); return face('utc', u.hour, u.minute, false); }
  const c = marsClock(ms, lonEDeg);
  return c.timeslip ? face('melas', 24, 0, true) : face('melas', c.hour, c.minute, false);
}

/** What a wall clock fixture reads at a game time: { faces: [{ face, hour, minute, slip, text, hourDeg, minuteDeg }] }. */
export function wallClockAt(fixture, ms, lonEDeg) {
  return { faces: (fixture?.faces ?? ['melas']).map(n => faceAt(n, ms, lonEDeg)) };
}
