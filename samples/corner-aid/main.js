// OLYMPUS sample: your corner shown, without angles drawn on the floor (v0.0.28). The pictures are ./aid.js's (?a=A-a|A-b) from
// ./scene.json (./make.mjs); this page shows one, scaled up by a whole number.
import { picture, LOOKS, DEFAULT } from './aid.js';
import { show } from '../portrait-lib/page.js';

const scene = await fetch('./scene.json', { cache: 'no-store' }).then(r => r.json());
const q = new URLSearchParams(location.search), look = LOOKS.includes(q.get('a')) ? q.get('a') : DEFAULT;
show(picture(look, scene));
