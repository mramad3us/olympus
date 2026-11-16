// OLYMPUS sample: the house's voices, V-a to V-d, the ten lines said most often, drawn and played by the game's own code.
//
// In v0.0.19 the house said 237 lines over six lanes and 55 made a sound (23.2%): the instructor was a text box. The voices are
// made by code (src/ui/audio/voice.js, a formant synthesiser; src/data/voices.js, the words spelt into sounds), each speaker
// through his own path: the instructor on the catwalk's PA at 110 Hz through the horn's band, your #2 at 125 Hz through his
// helmet's speaker, you at 118 Hz in your own helmet, 6 dB under his shout. Each view is one set: V-a v0.0.19's stand-ins (five
// vowel syllables; the rest silent), V-b the words dry, V-c the words through their paths (the game's until you score), V-d V-c
// with breath and effort on the shouts. A line is drawn as its level over its spoken time (core/speech.js spokenMs: 0.25 s and
// 0.3 s a word, the tower's own wait), its words where the voice places them. Live (the gallery's O, ?live=1): 1 to 9 and 0
// play the lines, Space all ten in turn; ?c=a..d picks the set. window.__report: the set, each line's time and peak; window.__ready once drawn.
import { renderLine, linePlan } from '../../src/ui/audio/voice.js';
import { render } from '../../src/ui/audio/synth.js';
import { HOUSE } from '../../src/data/sounds.js';
import { VOICE_SET, VOICE_RATE_HZ } from '../../src/data/voices.js';

const params = new URLSearchParams(location.search), set = VOICE_SET[params.get('c')] ? params.get('c') : 'c', live = params.get('live') === '1' || params.get('hud') === '1';
/** The ten most said (feel.md's voiced.mjs over six lanes): text, speaker, register, v0.0.19's stand-in (a HOUSE recipe) or none. */
const LINES = [
  ['Clear!', 'two', 'shout', 'shoutClear'], ['Ready.', 'two', 'whisper', 'whisperReady'], ['Clear!', 'me', 'shout', null], ['Room clear!', 'me', 'shout', null],
  ['Up.', 'two', 'plain', null], ['Opens in, I go left.', 'me', 'whisper', null], ['Covering!', 'two', 'shout', null], ['Lane A. Standby.', 'pa', 'plain', 'paStandby'],
  ['GO, GO, GO!', 'pa', 'plain', 'paGo'], ['Practice rounds. With a magazine of ten, LOAD.', 'pa', 'plain', null],
];
const W = 640, H = 420, SR = VOICE_RATE_HZ;
const audioOf = ([text, voice, register, stand]) => (VOICE_SET[set].words ? renderLine(text, { voice, register, set }) : stand ? render(HOUSE[stand], { sampleRate: SR, name: stand, variant: 0 }) : null);
const clips = LINES.map(audioOf);
const cv = document.getElementById('pic'), g = cv.getContext('2d');
// (scaled up by a whole number to fit the window, point sampled (index.html's image-rendering): the gallery shoots the page at three
// times the picture and checks every picture pixel whole; a fixed × 2 in its × 3 window left 7,600 to 9,300 pixels not whole
// (v0.0.20's release notes; fixed in v0.0.21's integration, as samples/marks draws its picture))
const sc = Math.max(1, Math.floor(Math.min(innerWidth / W, innerHeight / H)));
cv.width = W; cv.height = H; cv.style.width = `${W * sc}px`; cv.style.height = `${H * sc}px`;
g.fillStyle = '#0e0f14'; g.fillRect(0, 0, W, H);
const ink = (t, x, y, c = '#d8dce4', s = 10) => { g.fillStyle = c; g.font = `${s}px monospace`; g.fillText(t, x, y); };
ink(`V-${set}: ${{ a: "v0.0.19's stand-ins (the rest silent)", b: 'the words, dry', c: 'the words through their paths (the game\'s until scored)', d: 'V-c with breath and effort on the shouts' }[set]}`, 12, 18, '#e8eaf0', 12);
const rows = [];
LINES.forEach(([text, voice, register], k) => {
  const y = 34 + k * 36, x0 = 190, w = W - x0 - 12, x = clips[k], plan = linePlan(text), maxS = 3;
  ink(`${(k + 1) % 10} ${text.length > 26 ? text.slice(0, 25) + '…' : text}`, 12, y + 12, '#d8dce4');
  ink(`${voice} · ${register}`, 12, y + 24, '#80868f', 9);
  g.strokeStyle = '#2a2d36'; g.strokeRect(x0, y, w, 28);
  if (!x) { ink('silent', x0 + 6, y + 18, '#c8453c'); rows.push({ text, ms: 0, peakDb: null }); return; }
  let peak = 0;
  for (let px = 0; px < w; px++) { let p = 0; for (let i = Math.floor((px / w) * maxS * SR); i < Math.min(x.length, Math.floor(((px + 1) / w) * maxS * SR)); i++) p = Math.max(p, Math.abs(x[i])); peak = Math.max(peak, p); const dbv = p > 0 ? 20 * Math.log10(p) : -99, k2 = Math.max(0, (dbv + 48) / 48); g.fillStyle = '#9aa0ab'; g.fillRect(x0 + px, y + 14 - (k2 * 26) / 2, 1, k2 * 26); }
  if (VOICE_SET[set].words) for (const wd of plan.words) { const px = x0 + ((wd.fromMs / 1000) / maxS) * w; g.fillStyle = '#b08a3a'; g.fillRect(px, y, 1, 4); }
  rows.push({ text, ms: Math.round((x.length / SR) * 1000), peakDb: Math.round(20 * Math.log10(peak) * 10) / 10 });
});
ink('the words\' starts marked on top; 3 s across; 0.25 s of breath, then 0.3 s a word (the tower waits on the same time)', 12, H - 8, '#80868f', 9);
let ctx = null;
const play = (x, at = 0) => { if (!x) return 0; ctx ??= new AudioContext(); const b = ctx.createBuffer(1, x.length, SR); b.copyToChannel(x, 0); const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(ctx.currentTime + at); return x.length / SR; };
if (live) {
  addEventListener('keydown', (e) => {
    const m = /^Digit([0-9])$/.exec(e.code); if (m) play(clips[(Number(m[1]) + 9) % 10]);
    if (e.code === 'Space') { let t = 0; for (const x of clips) t += play(x, t) + 0.3; }
  });
}
window.__report = { set, lines: rows };
requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
