// OLYMPUS data: Base Melas's ground as an area, the dressing the site plan does not hold (the build sheet 0.0.3 §2.1).
//
// The ground of Base Melas (melas.ground) is the site plan laid out (PLACES §4.1 to §4.3, v0.0.2's
// MELAS_PLAN, compacted): every building a mass with its doors, the roads and walks, the parade deck,
// the fence and its gates, the valley floor round them. src/sim/places/ground.js builds it from
// MELAS_PLAN and these tables, at load and the same in every career (the user, 2026-11-05: "game
// world is handcrafted"): nothing here or there reads a seed of the world. What these tables add:
//   GROUND        the area's name, how far the valley floor is drawn past the fence (GROUND_APRON_M
//                 40 m, the sheet's §4), what is walked (walkM, a list since 0.0.5: inside Main Side's
//                 fence, and the KD range's 25 m bay outside the East gate, src/data/places/range.js;
//                 0.0.7: the KD's lanes from the ready line to the parapet, and the pits behind it),
//                 the ground drawn (drawnM: Main Side and its apron, and X3's strip, x 1,040 to 1,680
//                 and z 260 to 440, so the whole KD range stands on this ground when 0.0.7 builds its
//                 other lines and nothing placed now moves: the build sheet 0.0.5 §2.3, PLACES §9), and
//                 the area's look seed: an authored constant for the chunks' fixed dressing (PLACES
//                 §2.4), never a world's;
//   LAMP_LINES    the street lamps, by an authored rule of the plan's own lines: one every `everyM`
//                 along a road or walk, `offsetM` off its centre line on the side given, between `from`
//                 and `to` along it (sodium, PLACES §4.1's lit lines); a lamp that would stand in a
//                 building, on a road or within 3 m of a door is left out;
//   FLOODS        the fence's floods, one every 40 m along its inside, `insetM` in;
//   STREET        Echo's company street: the guidon post, the bins on the apron, and the painted
//                 formation marks of the company's platoons
//                 (2nd Platoon's at w:echo:street, (530, 224): the walk test's);
//   DOOR_SIGNS    by each of Echo's outside doors on the ground, on the building's face beside it: the
//                 company's plate, ECHO in the Corps' red (the exit signs hang inside, over the doors
//                 out: v0.0.3's review, a green EXIT over the front entrance read wrong from the street);
//   BARBER        (0.0.6; the build sheet 0.0.6 §2.2, §8 item 20) the PX barber's pole on its stand by the
//                 PX's north door, 2.5 m east of the door (292, 430) and 4.4 m out from the wall, facing
//                 north: R at its spot is the haircut (the chairs inside wait for the PX's building, PLACES
//                 §4.13). Out from the wall, not on it: the camera looks north, so anything on a north face
//                 hides behind the building's roof (z − y over the roof's edge: a 4 m roof at z 430 covers
//                 the picture to 426, so the tube, 1.3 to 2.1 m up, is clear of it from z 427.3 north), and
//                 the marine at its spot half a metre north of it stands clear of the roof's edge too, so the
//                 view's see-through never cuts the pole away round him (my calls).

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The ground area: its name, the valley floor drawn past the fence, the walked rects (Main Side, the 25 m bay), the ground drawn, its look seed. */
export const GROUND = deepFreeze({
  id: 'melas.ground', site: 'melas', name: 'Base Melas', plan: 'melas@1', apronM: 40,
  walkM: [{ x0: 0, z0: 0, x1: 1000, z1: 700 }, { x0: 1086, z0: 281, x1: 1124, z1: 300 }, { x0: 1060.4, z0: 300.5, x1: 1597, z1: 399.5 }, { x0: 1600.4, z0: 300.5, x1: 1609.6, z1: 399.5 }],
  drawnM: [{ x0: -40, z0: -40, x1: 1040, z1: 740 }, { x0: 1040, z0: 260, x1: 1680, z1: 440 }],
  lookSeed: 4417,
  spawn: { x: 522.0, z: 214.9, face: 'down' },
});

/** The street lamps' rule: a lamp every everyM along a line (by its id), offsetM to one side, from and to along it (metres). */
export const LAMP_LINES = deepFreeze([
  { line: 'r:lines-walk', everyM: 20, offsetM: 2.6, side: 'right', from: 8, to: 376 },
  { line: 'r:south-walk', everyM: 20, offsetM: 2.6, side: 'right', from: 8, to: 376 },
  { line: 'r:lane-aid', everyM: 20, offsetM: 2.1, side: 'left', from: 12, to: 92 },
  { line: 'r:lane-mess', everyM: 20, offsetM: 2.1, side: 'left', from: 12, to: 92 },
  { line: 'r:lane-field', everyM: 20, offsetM: 2.1, side: 'left', from: 12, to: 92 },
  { line: 'r:second', everyM: 20, offsetM: 4.6, side: 'left', from: 50, to: 210 },
  { line: 'r:third', everyM: 20, offsetM: 4.6, side: 'right', from: 77, to: 237 },
  { line: 'r:valley', everyM: 40, offsetM: 6.6, side: 'left', from: 50, to: 1010 },
]);

/** The fence's floods: one every everyM along its inside, insetM in from the fence line. */
export const FLOODS = deepFreeze({ everyM: 40, insetM: 0.6, firstM: 20 });

/** Echo's company street and apron: the guidon post, the bins, the formation marks (decor, painted). */
export const STREET = deepFreeze({
  fixtures: [
    { name: 'guidon', kind: 'lampPost', make: 'sodium', x: 525.5, z: 222.0, face: 'down', look: { guidon: true } },
    { name: 'bin-1', kind: 'bin', make: 'bin', x: 512.0, z: 208.6, face: 'down' },
    { name: 'bin-2', kind: 'bin', make: 'bin', x: 532.0, z: 208.6, face: 'down' },
  ],
  marks: [
    { kind: 'mark', x: 514.0, z: 224.0, text: '1', name: "1st Platoon's mark" },
    { kind: 'mark', x: 530.0, z: 224.0, text: '2', name: "2nd Platoon's mark" },
    { kind: 'mark', x: 546.0, z: 224.0, text: '3', name: "3rd Platoon's mark" },
    { kind: 'mark', x: 522.0, z: 230.0, text: 'W', name: "the Weapons Platoon's mark" },
  ],
});

/** The PX barber's pole (0.0.6): on its stand north of the PX's wall (z 430), east of its door, facing north. */
export const BARBER = deepFreeze({ name: 'barber', kind: 'barberPole', make: 'pole', x: 294.5, z: 425.6, face: 'up' });

/** The company's plates by Echo's outside doors, on the building's face beside each (the site frame). */
export const DOOR_SIGNS = deepFreeze([
  { name: 'sign-front', x: 523.2, z: 214.015, face: 'down', y: 2.2, look: { text: 'ECHO', style: 'corps' } },
  { name: 'sign-east-exit', x: 563.2, z: 208.015, face: 'down', y: 2.2, look: { text: 'ECHO', style: 'corps' } },
  { name: 'sign-west-exit', x: 483.2, z: 208.015, face: 'down', y: 2.2, look: { text: 'ECHO', style: 'corps' } },
]);
