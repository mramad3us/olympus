// OLYMPUS samples: a picture of whole pixels on the page (the portrait sets' main.js; the gallery shoots it crisply).
//
// show(P) puts a Pic (./card.js pic: 0xrrggbb a pixel) on the page's canvas, scaled up by a whole number to fill the window
// (the gallery shoots at three times the picture's own size, so every picture pixel is a clean block), and publishes
// window.__report (the picture's own report, its frame first) and window.__ready two frames after.
export function show(P, canvas = document.getElementById('pic')) {
  const g = canvas.getContext('2d');
  canvas.width = P.w; canvas.height = P.h;
  const img = g.createImageData(P.w, P.h), d = new Uint32Array(img.data.buffer);
  for (let i = 0; i < P.w * P.h; i++) { const c = P.col[i]; d[i] = (0xff000000 | ((c & 0xff) << 16) | (c & 0xff00) | ((c >>> 16) & 0xff)) >>> 0; }
  g.putImageData(img, 0, 0);
  const fit = () => { const k = Math.max(1, Math.floor(Math.min(innerWidth / P.w, innerHeight / P.h))); canvas.style.width = `${P.w * k}px`; canvas.style.height = `${P.h * k}px`; };
  fit();
  addEventListener('resize', fit);
  window.__report = { frame: [P.w, P.h], ...(P.report ?? {}) };
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; }));
}
