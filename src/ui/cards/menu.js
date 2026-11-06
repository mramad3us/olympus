// OLYMPUS cards: the Esc menu, on dark glass (VIEWS §8.9): carry on, the save files, the report, the sound, the title.
//
// Its numbered lines answer the digits (by code: AZERTY's top row types & é " ' without Shift):
// 1 Resume, 2 Save to a file, 3 Load a save file, 4 Report a problem, 5 Quit to the title, 6 Sound on
// or muted. Under them the master volume, 0 to 1 in twentieths, a slider the arrows move once it has
// focus (Esc and the digits still close the card and pick its lines from there) (VIEWS §8.9's Settings will hold the buses' volumes; the master and the mute come first, so
// the user can turn the footsteps down on the Mac and on Windows). Volume and mute go to main.js
// (cb.volume(v), cb.mute(on)), which sets the audio and keeps them in the saved profile (store.js
// updateProfile: { …profile, audio: { volume, muted } }, read and written in one transaction), so they
// hold across a reload. Every choice
// goes back through cb; the card changes nothing itself.

/** The menu's body and its numbered lines: { body, lines }. acts: [[text, fn, keyName]…]; sound: { volume, muted, onVolume(v), onMute(on) }. */
export function menuCard({ acts, sound = null, note = '' }) {
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(document.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined)); return n; };
  const line = (n, text, onclick, keyName = null) => el('button', { className: 'item', type: 'button', onclick }, el('kbd', { textContent: String(n) }), text, keyName ? el('small', { textContent: keyName }) : null);
  const lines = acts.map(([text, fn, k], i) => line(i + 1, text, fn, k));
  let soundRow = null;
  if (sound) {
    let muted = !!sound.muted;
    const words = () => (muted ? 'Sound: muted' : 'Sound: on');
    const toggle = line(lines.length + 1, words(), () => { muted = !muted; toggle.childNodes[1].textContent = words(); toggle.classList.toggle('off', muted); sound.onMute?.(muted); });
    toggle.classList.toggle('off', muted);
    toggle.classList.add('mute');
    lines.push(toggle);
    const out = el('output', { className: 'vol-out', textContent: `${Math.round(sound.volume * 100)}%` });
    const slider = el('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(sound.volume), className: 'vol' });
    slider.setAttribute('aria-label', 'Master volume');
    slider.addEventListener('input', () => { out.textContent = `${Math.round(Number(slider.value) * 100)}%`; sound.onVolume?.(Number(slider.value)); });
    // (a slider with focus is a field the game's keys leave alone (core/input.js): Esc and the digits
    // still mean the card's, so they let the slider go and are handed to the game as pressed)
    slider.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape' && !/^(Digit|Numpad)[0-9]$/.test(e.code)) return;
      e.preventDefault();
      slider.blur();
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { code: e.code, key: e.key, bubbles: true }));
    });
    soundRow = el('label', { className: 'volume' }, el('span', { textContent: 'Volume' }), slider, out);
  }
  const body = el('div', { className: 'glass menu' },
    el('h3', { textContent: 'Menu' }),
    el('div', { className: 'glass-list' }, ...lines),
    soundRow,
    note ? el('p', { className: 'note', textContent: note }) : null);
  return { body, lines };
}
