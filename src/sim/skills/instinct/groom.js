// OLYMPUS sim: the drill instructor's grooming rules beyond the face, the hair (SKILLS §14.4; the build sheet 0.0.6 §2.2; the user, 2026-11-06: "we should have to groom our hair the same way we will have to groom our beards").
//
// GROOM_RULES are merged into the instinct by src/sim/skills/instinct.js after BASE_RULES (by tone, as
// the range's), each { id, voice: 'di', tone, short, when(state, me, ms) → ctx | null, text, act(ctx),
// reach: null } as base.js's. One rule this round:
//   haircut  note at 'due' (the cut past 0.7 of its dueSols: "Haircut's due Thursday.", the day the cut
//            goes out of regulation, src/sim/body/hair.js hairOf's dueDay), warn at 'over' ("That hair is
//            out of regulation. The barber, today."); by day only (05:00 to 21:50, as the stubble's),
//            quiet in a drill, on the range, busy (a skip or an activity), lying or sitting, and asleep.
//            T acts where the cut can be kept: 'activity:clip' at a sink for a shaved head (the clippers,
//            a single action like the face's shave), 'activity:haircut' at the barber's pole (the PX's,
//            10:00 to 20:00, offOf's hours: before 10:00 the pole is "elsewhere"); elsewhere none, and the words say where: "The barber's at the PX, 10:00 to
//            20:00." for the barber's cuts, "Clippers. Head A has mirrors." for a shaved head.
// when() reads only what the character knows: the hair as felt (its band), the wrist's clock, where they
// stand, what is at hand (time's activitiesAt). Pure.
import { marsClock } from '../../../core/calendar.js';
import { playerId } from '../../../core/ids.js';
import { siteLonEDeg } from '../../jobs.js';
import { isAsleep } from '../../body/body.js';
import { hairOf } from '../../body/hair.js';
import { activitiesAt, offOf, spotOf } from '../../time/activities.js';
import { rangeNow } from '../../scenarios/handling.js';

/** The hours the DI speaks of grooming (base.js's dayH: not in the night). */
export const GROOM_FROM_H = 5, GROOM_TO_H = 21 + 50 / 60;

// (the local hour on the wrist, the slip counted past 24)
const hourOf = (state, ms) => { const c = marsClock(ms, siteLonEDeg(state)); return c.timeslip ? 24 + c.slipMs / 3_600_000 : c.civilMs / 3_600_000; };
// (the activity of a fixture you stand at, if free and not struck there now (the barber's hours above all, so the
// DI never says "Haircut. Now" where T would be refused "The barber opens at 10:00": the fixer's, 0.0.6): 'activity:<id>', else null)
const actAt = (state, me, id) => (activitiesAt(state, me.x, me.z).some(a => a.id === id && a.free && offOf(state, id, spotOf(state, a.spotId), {}) === null) ? `activity:${id}` : null);

/** The DI's grooming rules (see the header). */
export const GROOM_RULES = Object.freeze([
  {
    id: 'haircut', voice: 'di', reach: null,
    tone: (ctx) => (ctx.over ? 'warn' : 'note'),
    short: 'Haircut',
    when(state, me, ms) {
      if (state.skip || state.time?.doing || state.time?.drills?.open || rangeNow(state)) return null;
      if ((me.posture ?? 'stand') !== 'stand') return null;
      const h = hourOf(state, ms);
      if (!(h >= GROOM_FROM_H && h < GROOM_TO_H)) return null;
      const pid = playerId(state);
      if (isAsleep(state, pid, ms)) return null;
      const hair = hairOf(state, pid, ms);
      if (!hair || hair.step < 2) return null;
      const shaved = hair.cut === 'shaved', over = hair.step >= 3;
      const act = shaved ? actAt(state, me, 'clip') : actAt(state, me, 'haircut');
      const variant = act ? (shaved ? (over ? 'overClipHere' : 'clipHere') : over ? 'overHere' : 'here') : over ? (shaved ? 'overClip' : 'overBarber') : shaved ? 'clip' : 'barber';
      return { variant, over, act, day: hair.dueDay, shaved };
    },
    act: (ctx) => ctx.act ?? null,
    text: {
      1: ['Haircut\'s due {day}.'],
      barber: ['Haircut\'s due {day}. The barber\'s at the PX, 10:00 to 20:00.', 'That hair goes over regulation {day}. The PX barber, before then.',
        'Haircut\'s due {day}. Get to the barber.', 'Your cut is due {day}. The PX has a barber. Use him.'],
      clip: ['Haircut\'s due {day}. Clippers. Head A has mirrors.', 'Your head wants the clippers by {day}. The basins, Head A.',
        'That fuzz is due off {day}. Clippers, at a basin.', 'Buzz it before {day}. Head A has mirrors.'],
      here: ['You are here. Get the haircut.', 'Sit down and let the barber work.', 'The chair is free. Use it.', 'Haircut. Now, while you are here.'],
      clipHere: ['Clippers. Buzz it while you are here.', 'A basin and a mirror. Run the clippers over it.', 'Buzz that head. Due {day}.', 'Clippers, here, now. Due {day}.'],
      overClipHere: ['That head is out of regulation. Clippers, now.', 'Out of regulation. You have a basin: buzz it.', 'Buzz it. Now.', 'Clippers. That fuzz is past regulation.'],
      overHere: ['That hair is out of regulation. Get it cut, now.', 'Out of regulation. You are here: fix it.', 'Cut it. Today was the day.', 'That hair would fail an inspection. Fix it now.'],
      overBarber: ['That hair is out of regulation. The barber, today.', 'Out of regulation. The PX barber, today, 10:00 to 20:00.',
        'Your cut went over {day}. The barber. Today.', 'That hair would fail an inspection. The barber, today.'],
      overClip: ['That head is out of regulation. Clippers, today.', 'Out of regulation. Clippers, at a basin, today.',
        'Your head went over {day}. Buzz it today.', 'That fuzz would fail an inspection. Clippers. Head A.'],
    },
  },
]);
