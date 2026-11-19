// OLYMPUS sample: a house you have not seen (DESIGN.md, 2026-11-17, U; the build sheet v0.0.23 §1 items 7 and 8). The game's
// own pictures (go.png and room1.png today's, go-u1.png and room1-u1.png as the game ships it, made by ./capture.mjs) decoded
// here, the look drawn over the pixels the game hides by ./unknown.js (see its header); ?u=U1|U2|U3.
import { picture } from './unknown.js';
import { show } from '../portrait-lib/page.js';

const decode = async (src) => {
  const im = new Image(); im.src = src; await im.decode();
  const c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, im.width, im.height).data, px = new Int32Array(im.width * im.height);
  for (let i = 0; i < px.length; i++) px[i] = (d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2];
  return { w: im.width, h: im.height, px };
};
const [scene, go, goU1, room1, room1U1] = await Promise.all([fetch('./scene.json', { cache: 'no-store' }).then(r => r.json()), decode('./go.png'), decode('./go-u1.png'), decode('./room1.png'), decode('./room1-u1.png')]);
const P = picture(new URLSearchParams(location.search).get('u'), scene, { go, goU1, room1, room1U1 });
show({ w: P.w, h: P.h, col: P.col, report: P.report });
