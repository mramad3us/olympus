// OLYMPUS sample: the two new places' sounds, the siren and the mag boots' clank, rendered by the game's own synthesiser and drawn
// as their levels over time (pure but play(); main.js shows the pictures). v0.0.24's stage 0 (its build sheet §0 item 27, §13
// question 13).
//
// Aboard Testudo a burn is warned by a siren before the 1MC's words (AW§4.3: "Brace, brace, brace. Secure for burn."), and a mag
// boot locked on steel clanks where a bare foot at 0 G weighs nothing (AW§4.1 item 1). Neither exists in the game yet (C builds the
// siren, A the clank), so their recipes are here, in src/data/sounds.js's form, rendered by src/ui/audio/synth.js render and mixed
// and mastered as the game plays a sound (src/ui/audio/mix.js mixdown, master MASTER), as samples/audio draws the shot:
//   ?s=S-a  a two-tone siren, high and low a half second each, three times (the default until scored);
//   ?s=S-b  a rising whoop, a sawtooth gliding 500 to 1,200 Hz over a second, three times (the klaxon's whoop, higher and faster);
//   ?k=K-a  the clank at A's measure, -7.09 dB (a locked boot strikes with MAG_STEP_G 0.3 G of weight, -5.23 dB, through the
//           berth's 66 kPa, -1.86 dB: the stash's stepVoice), four steps at the boots' 0.5 m/s (the default until scored);
//   ?k=K-b  the same 3 dB quieter.
// The clank's recipe is the parked stash's STEPS.mag (a short ring over the plate's thud), which A's merge brings into sounds.js; the
// siren's are new (my calls, C's to carry into sounds.js by the score). Live (the gallery's O, or ?live=1): Space or a click plays it.
import { pic, GAP } from '../portrait-lib/card.js';
import { render } from '../../src/ui/audio/synth.js';
import { mixdown, master, levels, MASTER } from '../../src/ui/audio/mix.js';
import { weightDb, lowpassHz } from '../../src/ui/audio/steps.js';
import { airDb } from '../../src/sim/people/hearing.js';

export const SIRENS = Object.freeze(['S-a', 'S-b']), CLANKS = Object.freeze(['K-a', 'K-b']), DEFAULTS = Object.freeze({ siren: 'S-a', clank: 'K-a' });
/** The rate the sounds are rendered and mixed at (Hz), and the berth's air (kPa: the Martian indoor standard). */
export const SR = 48000, PKPA = 66;
/** A locked boot's strike weight (G: the stash's MAG_STEP_G) and the boots' walk (m/s), with a step's length at it (m, my call). */
export const MAG_STEP_G = 0.3, WALK_MS = 0.5, STEP_M = 0.55;
/** The siren's two tones (Hz) and the whoop's glide (Hz), my calls: the tones a minor third apart, as a ship's alarm. */
export const TWO_TONE_HZ = Object.freeze([960, 770]), WHOOP_HZ = Object.freeze([500, 1200]);
const GLIDE = Object.freeze({ attackS: 0.01, releaseS: 0.03, formant: Object.freeze([1500, 0.8]) });
/** The recipes (src/data/sounds.js's form): the siren's candidates and the clank (the stash's STEPS.mag). */
export const RECIPES = Object.freeze({
  'S-a': Object.freeze({ levelDb: -3, durS: 3.1, layers: Object.freeze([Object.freeze({ kind: 'notes', notes: Object.freeze([0, 1, 2, 3, 4, 5].map(i => Object.freeze([TWO_TONE_HZ[i % 2], 0.5]))), gapS: 0.01, vibratoK: 0, scoopK: 0, attackS: 0.01, releaseS: 0.02, db: 0 })]) }),
  'S-b': Object.freeze({ levelDb: -3, durS: 3.1, layers: Object.freeze([0, 1, 2].map(i => Object.freeze({ kind: 'glide', hz: WHOOP_HZ[0], toHz: WHOOP_HZ[1], durS: 0.98, delayS: i * 1.02, ...GLIDE, db: 0 }))) }),
  mag: Object.freeze({
    levelDb: -10, durS: 0.08,
    layers: Object.freeze([
      Object.freeze({ kind: 'noise', bandpass: Object.freeze([1200, 1.4]), attackS: 0.0008, decayS: 0.012, db: 0 }),
      Object.freeze({ kind: 'tone', hz: 1650, toHz: 1600, attackS: 0.0005, decayS: 0.03, db: -12 }),
      Object.freeze({ kind: 'tone', hz: 95, toHz: 70, attackS: 0.002, decayS: 0.02, db: -9 }),
    ]),
  }),
});
/** The clank's gain (dB) by candidate: the stash's stepVoice on a ferrous face, and 3 dB under it. */
export const clankDb = (k) => Math.round((weightDb(MAG_STEP_G) + airDb(PKPA) + (k === 'K-b' ? -3 : 0)) * 100) / 100;

/** The sound of a view through the game's mix and master: { left, right } at SR. */
export function soundOf(view) {
  if (SIRENS.includes(view)) {
    const s = render(RECIPES[view], { sampleRate: SR, name: `void-look:${view}` });
    return master(mixdown([{ samples: s, sampleRate: SR, atS: 0.05, gainDb: -6, lowHz: lowpassHz(PKPA), pan: 0 }], { sampleRate: SR, durS: 3.3 }), MASTER, { sampleRate: SR });
  }
  const stepS = STEP_M / WALK_MS, vs = [];
  for (let i = 0; i < 4; i++) vs.push({ samples: render(RECIPES.mag, { sampleRate: SR, name: 'void-look:mag', variant: i % 4 }), sampleRate: SR, atS: 0.1 + i * stepS, gainDb: clankDb(view), lowHz: lowpassHz(PKPA), pan: i % 2 ? 0.15 : -0.15 });
  return master(mixdown(vs, { sampleRate: SR, durS: 0.1 + 4 * stepS + 0.2 }), MASTER, { sampleRate: SR });
}

export const SIZE = Object.freeze([320, 120]);
const LABEL = 0x9aa0ab, WAVE = 0x9aa0ab, LOUD = 0xb08a3a, FRAME = 0x2a2d36;
const db = (v) => (v > 0 ? 20 * Math.log10(v) : -Infinity);

/** The siren's pitch axis (Hz), bottom to top. */
export const PITCH_HZ = Object.freeze([400, 1400]);
// (the pitch in a column's samples: its upward zero crossings over its length, the sawtooth's fundamental; null when quiet, or
// off the axis: a column over a note's gap reads its fade's ripple, not a tone)
function pitchOf(x, i0, i1) {
  let n = 0, first = -1, last = -1, p = 0;
  for (let i = Math.max(1, i0); i < i1; i++) { p = Math.max(p, Math.abs(x[i])); if (x[i - 1] < 0 && x[i] >= 0) { if (first < 0) first = i; last = i; n++; } }
  const hz = n >= 3 && db(p) > -40 ? (n - 1) * SR / (last - first) : null;
  return hz !== null && hz >= PITCH_HZ[0] && hz <= PITCH_HZ[1] ? hz : null;
}

/**
 * The picture for a query: the clank's level over time, a pixel a column (the loudest of its samples, folded about the middle,
 * -48 dB to 0); the siren's pitch over time (a column's fundamental from its zero crossings, PITCH_HZ bottom to top), so its two
 * tones and its whoop are seen as they are heard, its loudest stretches in the level's colour.
 */
export function picture(q = new URLSearchParams()) {
  const view = q.has('k') ? (CLANKS.includes(q.get('k')) ? q.get('k') : DEFAULTS.clank) : (SIRENS.includes(q.get('s')) ? q.get('s') : DEFAULTS.siren);
  const st = soundOf(view), [W, H] = SIZE, P = pic(W, H), L = levels(st, { sampleRate: SR }), siren = SIRENS.includes(view);
  const words = { 'S-a': 'THE SIREN: TWO TONES, 960 AND 770 HZ', 'S-b': 'THE SIREN: A RISING WHOOP, 500 TO 1200 HZ', 'K-a': `THE CLANK ON STEEL, ${clankDb('K-a')} DB, FOUR STEPS AT 0.5 M/S`, 'K-b': `THE CLANK 3 DB QUIETER, ${clankDb('K-b')} DB` }[view];
  P.write(GAP + 1, GAP + 1, `${view}: ${words}`, LABEL);
  const x0 = GAP, y0 = GAP + 12, w = W - 2 * GAP, h = H - y0 - 16, n = st.left.length, mid = y0 + Math.floor(h / 2);
  P.fill(x0, y0, w, 1, FRAME); P.fill(x0, y0 + h - 1, w, 1, FRAME); P.fill(x0, y0, 1, h, FRAME); P.fill(x0 + w - 1, y0, 1, h, FRAME);
  const pitches = [];
  for (let px = 1; px < w - 1; px++) {
    const i0 = Math.floor(((px - 1) / (w - 2)) * n), i1 = Math.floor((px / (w - 2)) * n);
    let p = 0;
    for (let i = i0; i < i1; i++) p = Math.max(p, Math.abs(st.left[i]), Math.abs(st.right[i]));
    if (siren) {
      const hz = pitchOf(st.left, i0, i1);
      if (hz === null) continue;
      pitches.push(Math.round(hz));
      const k = Math.min(1, Math.max(0, (hz - PITCH_HZ[0]) / (PITCH_HZ[1] - PITCH_HZ[0]))), y = y0 + h - 3 - Math.round(k * (h - 6));
      P.fill(x0 + px, y, 1, 2, db(p) > -12 ? LOUD : WAVE);
      continue;
    }
    const k = Math.max(0, (db(p) + 48) / 48), half = Math.round((k * (h - 4)) / 2);
    if (half > 0) P.fill(x0 + px, mid - half, 1, 2 * half, db(p) > -6 ? LOUD : WAVE);
  }
  if (siren) { P.write(x0 + 3, y0 + 3, `${PITCH_HZ[1]} HZ`, FRAME + 0x303030); P.write(x0 + 3, y0 + h - 9, `${PITCH_HZ[0]} HZ`, FRAME + 0x303030); }
  P.write(GAP + 1, H - 10, `PEAK ${L.peakDb.toFixed(1)} DBFS · ${(n / SR).toFixed(2)} S · LIVE: SPACE OR A CLICK`, LOUD);
  const range = pitches.length ? [Math.min(...pitches), Math.max(...pitches)] : null;
  P.report = { view, peakDb: L.peakDb, durS: n / SR, ...(CLANKS.includes(view) ? { clankDb: clankDb(view) } : { pitchHz: range }) };
  return P;
}

let ctx = null;
/** Play a view's sound in the page (a key or a click: the browser lets audio start only then). */
export function play(view) {
  const st = soundOf(view);
  ctx ??= new AudioContext({ sampleRate: SR });
  const b = ctx.createBuffer(2, st.left.length, SR); b.copyToChannel(st.left, 0); b.copyToChannel(st.right, 1);
  const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start();
}
