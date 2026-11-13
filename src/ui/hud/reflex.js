// OLYMPUS hud: the reflex card, beside the weapon card in the step panel's rectangle while a reflex waits (VIEWS §8.10; COMBAT §3.5; the build sheet 0.0.5 §2.2, §8 item 8).
//
// Tradecraft's reflex (src/sim/reflex.js; the user, 2026-11-03: "a reflex mode, where time stops when
// things require it"), brought inside stop motion this round: when the gun stops itself during a lived
// step (a pull that clicks, a shot that did not cycle), the shot role's offerReflex() holds 'reflex' and
// writes stop.reflex { why, title, options: [{ key, label, step, ms }] }; this card shows it in STEPS'
// rectangle beside the weapon card (the step panel shrinks to its weapon card at the left, steps.js
// cardOnly, and this card takes the rest of STEPS; no other rectangle moves), numbered, each
// option with its time, "Nothing" always last ("stay on the card" for your own rifle's stoppage, "let it come" for a threat), and R to keep the answer for KEEP_MS (two
// minutes: the user, 2026-11-04, of tradecraft: "the reflex window is spammed on us too, there should be
// a way to remember our choice for a while"). Its title is a plaque of the picture's alphabet (VIEWS
// §8.10: "a stamp and a title plaque"). The keys are main.js's: a digit answers ({ act: 'stop', args: {
// step: 'reflex:<key>', keep } }), R flips keep, the card shows which. reflexOf(reflex, keep) is the pure
// part; createReflex(parent) the DOM.

/** The keep's span (ms: COMBAT §3.5, the shot role's KEEP_MS; the card says it in minutes). */
export const KEEP_SAID_MS = 120_000;

const secs = (ms) => (Number.isFinite(ms) && ms > 0 ? `${(ms / 1000).toFixed(1)} s` : '');
/** The card's lines: { title, why, rows: [{ key: '1', option, text }], keep, keepText }; "nothing" last whatever the order given. */
export function reflexOf(reflex, { keep = false, keepMs = KEEP_SAID_MS, label = (a) => a } = {}) {
  if (!reflex) return null;
  const opts = [...(reflex.options ?? [])], none = opts.findIndex(o => o.key === 'none');
  if (none >= 0 && none !== opts.length - 1) opts.push(opts.splice(none, 1)[0]);
  // (an answer shown struck says why where its time would be (the rework's R6: Transition "not issued"))
  const rows = opts.map((o, i) => ({ key: String(i + 1), option: o, text: `${i + 1} ${o.label ?? o.key}${o.off ? ` · ${o.off}` : secs(o.ms) ? ` · ${secs(o.ms)}` : ''}` }));
  return { title: reflex.title ?? 'Now.', why: reflex.why ?? null, rows, keep: !!keep, keepText: `${label('hand')} keep this answer ${Math.round(keepMs / 60000)} min: ${keep ? 'on' : 'off'}` };
}

/** The card in parent: { el, update(reflex | null, opts) → its text, optionFor(n) }. plaque(spec) → a plaque on a canvas (plaque.js), for the title. */
export function createReflex(parent, { plaque = null, label = (a) => a } = {}) {
  const doc = globalThis.document;
  const el = (tag, props = {}, ...kids) => { const n = Object.assign(doc.createElement(tag), props); n.append(...kids.filter(k => k !== null && k !== undefined)); return n; };
  const root = el('div', { className: 'reflexcard', hidden: true });
  parent.append(root);
  let sig = null, model = null, text = '';
  function titleEl(m) {
    if (!plaque) return el('div', { className: 'rx-title', textContent: m.title });
    const p = plaque({ text: m.title.replace(/\.$/, ''), sub: m.why === 'click' ? 'THE TRIGGER' : m.why === 'stop' ? 'THE ACTION' : null, style: 'tail', icon: 'warn', notch: false });
    const cv = el('canvas', { className: 'rx-plaque' });
    cv.width = p.w; cv.height = p.h; cv.getContext('2d')?.drawImage(p.canvas, 0, 0);
    cv.style.width = `calc(${p.w * 2}px * var(--ui))`; cv.style.height = `calc(${p.h * 2}px * var(--ui))`;
    cv.dataset.text = p.words;
    return cv;
  }
  return {
    el: root,
    update(reflex, { keep = false, hidden = false } = {}) {
      model = hidden ? null : reflexOf(reflex, { keep, label });
      root.hidden = !model;
      if (!model) { text = ''; return ''; }
      const s = JSON.stringify([model.title, model.rows.map(r => r.text), model.keep]);
      if (s !== sig) {
        sig = s;
        root.replaceChildren(
          el('div', { className: 'rx-head' }, titleEl(model), el('span', { className: 'rx-note', textContent: 'Time stands still: your hands answer.' })),
          // (more than five answers (the house's stoppage card, the rework's R6): two columns, down then across, so the card keeps its height)
          el('div', { className: `rx-list${model.rows.length > 5 ? ' two' : ''}` }, ...model.rows.map(r => el('div', { className: `rx-row${r.option.key === 'none' ? ' none' : ''}${r.option.off ? ' off' : ''}` },
            el('kbd', { textContent: r.key }), el('span', { className: 'label', textContent: r.option.label ?? r.option.key }),
            r.option.off ? el('span', { className: 'time', textContent: r.option.off }) : secs(r.option.ms) ? el('span', { className: 'time', textContent: secs(r.option.ms) }) : null))),
          el('div', { className: `rx-keep${model.keep ? ' on' : ''}` }, el('kbd', { textContent: label('hand') }), ` keep this answer ${Math.round(KEEP_SAID_MS / 60000)} min: ${model.keep ? 'on' : 'off'}`));
        text = [model.title, ...model.rows.map(r => r.text), model.keepText].join(' | ');
      }
      return text;
    },
    /** The option on a digit (1 to n), or null. */
    optionFor(n) { return model?.rows.find(r => r.key === String(n))?.option ?? null; },
    get text() { return root.hidden ? '' : text; },
  };
}
