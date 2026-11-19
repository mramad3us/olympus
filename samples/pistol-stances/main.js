// OLYMPUS sample: the P-12's stances and the R-7 hanging while it is up (the user's note of 2026-11-17; the build sheet v0.0.23,
// the lead's fourth note). The stage's own picture (today.png, made by ./capture.mjs) decoded here and handed to ./stances.js
// (see its header: ?set=today); this page shows one picture, scaled up by a whole number.
import { picture } from './stances.js';
import { show } from '../portrait-lib/page.js';

const decode = async (src) => {
  const im = new Image(); im.src = src; await im.decode();
  const c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, im.width, im.height).data, px = new Int32Array(im.width * im.height);
  for (let i = 0; i < px.length; i++) px[i] = (d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2];
  return { w: im.width, h: im.height, px };
};
const q = new URLSearchParams(location.search);
show(picture(q, await decode('./today.png')));
