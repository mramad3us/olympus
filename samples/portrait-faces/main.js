// OLYMPUS sample: a man upside down to you, on the target card (v0.0.25's stage 0, its build sheet §10). The pictures are ./faces.js's (?r=R-a|R-b; see its header); this page shows one, scaled up by a whole number.
import { picture } from './faces.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
