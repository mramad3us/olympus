// OLYMPUS sample: the card in the dark, behind a jamb, with his hands not read (the build sheet v0.0.23 §1 item 8; P§6.4). The pictures are ./light.js's (see its header for the queries); this page shows one, scaled up by a whole number.
import { picture } from './light.js';
import { show } from '../portrait-lib/page.js';

show(picture(new URLSearchParams(location.search)));
