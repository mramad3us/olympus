// OLYMPUS scenes sample: the scenes, by name. Each is { title, palette, moods, mood, views, build(area, ctx) }.
//
// build() fills the area and returns { figures: [{ x, z, dress, facing, seed }], weather(mood, timeS) }
// (the air for the frame: src/render/weather.js set()). views are camera spots { x, z, zoom }: zoom 1 is
// the game's own frame (40 × 22.5 m at either density), zoom 2 a closer look for judging the kit.
import { kit } from './kitsheet.js';
import { bay, head } from './barracks.js';
import { mess } from './messhall.js';
import { chasm } from './chasm.js';
import { deck } from './frigate.js';

export const SCENES = { bay, head, mess, chasm, deck, kit };
