// OLYMPUS sample: the end card's truth cards, three layouts (the build sheet v0.0.23 §1 item 8; the overhaul's O-17). The
// pictures are ./truth.js's (see its header: ?t=T-a|T-b|T-c); this page draws the plan view's pixels with the game's own
// drawPlan (src/ui/cards/houseplan.js) on a canvas at the times truth.js names, and shows the picture, scaled up by a whole number.
import { picture, planTimes, LAYOUTS, DEFAULT } from './truth.js';
import { drawPlan, planFrame } from '../../src/ui/cards/houseplan.js';
import { show } from '../portrait-lib/page.js';

const lane = await fetch('./lane.json', { cache: 'no-store' }).then(r => r.json());
const q = new URLSearchParams(location.search), look = LAYOUTS.includes(q.get('t')) ? q.get('t') : DEFAULT, d = lane.debrief, F = planFrame(d);
const plans = planTimes(look, lane).map((t) => {
  const c = new OffscreenCanvas(F.w, F.h), g = c.getContext('2d');
  drawPlan(g, d, d.goAtMs + t, F);
  const px = g.getImageData(0, 0, F.w, F.h).data, out = new Int32Array(F.w * F.h);
  for (let i = 0; i < out.length; i++) out[i] = (px[i * 4] << 16) | (px[i * 4 + 1] << 8) | px[i * 4 + 2];
  return { w: F.w, h: F.h, px: out };
});
show(picture(look, lane, plans));
