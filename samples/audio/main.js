// OLYMPUS sample: the shot's candidates A0 to A4, heard through the suit in the shoot house, drawn and played by the game's own code.
//
// The user, 2026-11-15: "Sound design is pretty weak, guns should bang harder and closer to realistic". v0.0.17's shot peaked high
// but its loudest 50 ms, what the ear hears as loudness, sat at -15.6 dBFS through the suit and the master: a click with a tail.
// Each view is one candidate (src/data/sounds.js SHOT_CANDIDATES): your R-7 in the house through the combat EVA suit's hearing
// filter, the room's answer and the game's master (src/ui/audio/gun.js, mix.js: the same offline model the audio-gun test
// measures), its waveform over the first 300 ms with the loudest 10 ms and 50 ms windows marked and their levels, and the P-12's
// beside it. A0 is v0.0.15's report (&sound=old's, through the ear defenders and the old master), A1 v0.0.17 as built, A2 A1 with
// the body, A3 A2 through a denser protection (the house's until you score), A4 A3 with the room's early reflections up.
// Live (the gallery's O, or ?live=1): Space or a click plays the R-7, P the P-12, B a burst of five; ?c=A0..A4 picks the candidate.
// window.__report: the candidate, its numbers; window.__ready once drawn. Nothing here is a recording: every sample is the game's code.
import { gunBakes, ownShot, shotKey, GUN_RATE_HZ, TAIL_RATE_HZ } from '../../src/ui/audio/gun.js';
import { mixdown, master, levels, MASTER, MASTER_OLD } from '../../src/ui/audio/mix.js';
import { render } from '../../src/ui/audio/synth.js';
import { reportVoice } from '../../src/ui/audio/range.js';
import { RANGE, SHOT_CANDIDATES, SHOT_IDS } from '../../src/data/sounds.js';

const params = new URLSearchParams(location.search), cid = SHOT_IDS.includes(params.get('c')) ? params.get('c') : 'A3', live = params.get('live') === '1' || params.get('hud') === '1';
const SR = 48000, W = 640, H = 360;
const db = (v) => (v > 0 ? 20 * Math.log10(v) : -Infinity);
// (the shot through the master: { left, right } at SR, 0.8 s; the R-7 or the P-12, n shots 0.1 s apart)
function shotOf(gun = 'r7', n = 1) {
  if (SHOT_CANDIDATES[cid].old) {
    const rep = reportVoice({ mine: true, ears: true, pKpa: 66, soundMs: 339.4, bermX: 1128, me: { x: 1100, z: 0 } });
    const vs = Array.from({ length: n }, (_, i) => ({ samples: render(RANGE.report, { sampleRate: 24000, name: 'report', variant: 0 }), sampleRate: 24000, atS: 0.02 + 0.1 * i, gainDb: rep.gainDb + (gun === 'p12' ? -2.9 : 0), lowHz: rep.lowpassHz, pan: 0 }));
    return master(mixdown(vs, { durS: 0.8 + 0.1 * n }), MASTER_OLD);
  }
  const G = {};
  for (const b of gunBakes(cid)) { if (!b.key.endsWith(':own:p') && !b.key.endsWith(':tail:room:p')) continue; const it = b.steps(0, GUN_RATE_HZ, TAIL_RATE_HZ); let r; do r = it.next(); while (!r.done); G[b.key] = r.value; }
  const vs = [];
  for (let i = 0; i < n; i++) for (const x of ownShot({ gun, space: 'room', prot: 'suit', pKpa: 66 }).voices) { const sm = G[shotKey(x.key, cid)]; vs.push({ samples: sm, sampleRate: sm.left ? TAIL_RATE_HZ : GUN_RATE_HZ, atS: 0.02 + 0.1 * i, gainDb: x.gainDb, lowHz: x.lowHz, pan: x.pan, rate: x.rate }); }
  return master(mixdown(vs, { durS: 0.8 + 0.1 * n }), MASTER);
}
function loudest(st, wS) { const n = Math.round(wS * SR); let best = 0, at = 0, s = 0; const e = (i) => (st.left[i] ** 2 + st.right[i] ** 2) / 2; for (let i = 0; i < st.left.length; i++) { s += e(i); if (i >= n) s -= e(i - n); if (i >= n - 1 && s / n > best) { best = s / n; at = i - n + 1; } } return { db: db(Math.sqrt(best)), at }; }

const rifle = shotOf('r7'), pistol = shotOf('p12');
const num = (st) => ({ peak: levels(st).peakDb, w10: loudest(st, 0.01), w50: loudest(st, 0.05) });
const R = num(rifle), P = num(pistol);
const cv = document.getElementById('pic'), g = cv.getContext('2d');
// (scaled up by a whole number to fit the window, point sampled (index.html's image-rendering): the gallery shoots the page at three
// times the picture and checks every picture pixel whole; a fixed × 2 in its × 3 window left 7,600 to 9,300 pixels not whole
// (v0.0.20's release notes; fixed in v0.0.21's integration, as samples/marks draws its picture))
const sc = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
cv.width = W; cv.height = H; cv.style.width = `${W * sc}px`; cv.style.height = `${H * sc}px`;
g.fillStyle = '#0e0f14'; g.fillRect(0, 0, W, H);
const ink = (t, x, y, c = '#d8dce4', s = 11) => { g.fillStyle = c; g.font = `${s}px monospace`; g.fillText(t, x, y); };
function wave(st, x0, y0, w, h, nums, label) {
  const n = Math.round(0.3 * SR), mid = y0 + h / 2, dbFloor = -48;
  g.strokeStyle = '#2a2d36'; g.strokeRect(x0, y0, w, h);
  // (the loudest windows, shaded)
  for (const [win, wS, c] of [[nums.w50, 0.05, 'rgba(176,138,58,0.25)'], [nums.w10, 0.01, 'rgba(200,69,60,0.35)']]) { g.fillStyle = c; g.fillRect(x0 + (win.at / n) * w, y0, (wS * SR / n) * w, h); }
  // (the level in dB, folded about the middle: what the ear reads, not the sign)
  g.fillStyle = '#9aa0ab';
  for (let px = 0; px < w; px++) { let p = 0; for (let i = Math.floor((px / w) * n); i < Math.floor(((px + 1) / w) * n); i++) p = Math.max(p, Math.abs(st.left[i]), Math.abs(st.right[i])); const k = Math.max(0, (db(p) - dbFloor) / -dbFloor); g.fillRect(x0 + px, mid - (k * h) / 2, 1, k * h); }
  ink(label, x0, y0 - 6);
  ink(`peak ${nums.peak.toFixed(1)} dBFS · loudest 10 ms ${nums.w10.db.toFixed(1)} · loudest 50 ms ${nums.w50.db.toFixed(1)}`, x0, y0 + h + 14, '#b08a3a', 10);
}
ink(`${cid}: ${{ A0: "v0.0.15's report (&sound=old)", A1: 'v0.0.17 as built (A1, every scene but the house)', A2: 'A1 with the body', A3: 'A2 through a denser protection (the house\'s until scored)', A4: 'A3 with the room\'s early reflections' }[cid]}`, 16, 22, '#e8eaf0', 13);
wave(rifle, 16, 52, W - 32, 110, R, 'your R-7 in the house, through the suit and the master: the first 300 ms');
wave(pistol, 16, 210, W - 32, 90, P, 'your P-12, the same');
ink('the targets (item 2): the loudest 50 ms at least -11.0 dBFS, 10 ms -9.0, the peak at most -1.0', 16, H - 14, '#80868f', 10);
let ctx = null;
async function play(st) {
  ctx ??= new AudioContext();
  const b = ctx.createBuffer(2, st.left.length, SR); b.copyToChannel(st.left, 0); b.copyToChannel(st.right, 1);
  const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start();
}
if (live) {
  addEventListener('keydown', (e) => { if (e.code === 'Space') play(rifle); if (e.code === 'KeyP') play(pistol); if (e.code === 'KeyB') play(shotOf('r7', 5)); });
  addEventListener('pointerdown', () => play(rifle));
  ink('Space or a click: the R-7 · P: the P-12 · B: a burst of five', 16, H - 30, '#d8dce4', 10);
}
window.__report = { candidate: cid, r7: { peakDb: R.peak, w10Db: R.w10.db, w50Db: R.w50.db }, p12: { peakDb: P.peak, w10Db: P.w10.db, w50Db: P.w50.db } };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
