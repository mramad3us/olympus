// OLYMPUS data: Marine Corps Base Melas as a site plan, PLACES §4.1 and §4.2 as data, before a building is drawn.
//
// The walk test (ROADMAP §4.1, places-walk-sol) measures a training sol's walking on this plan while
// moving a building costs nothing, so the plan exists as data first. The site frame is PLACES §4.1's:
// origin at Main Side's north-west fence corner, x east, z south, metres. PLACES writes a building as
// x0, z0, w × d; here a rect is [x0, z0, x1, z1]. What it holds (the build sheet 0.0.2 §2.2's shape):
//   buildings  every row of PLACES §4.2's three tables, { id, n, name, ring, rects, storeys, plan,
//              doors }, each door { id, x, z, side, kind, widthM, waypoint } on its footprint's edge;
//              `open` marks an open structure (the cleaning canopy on posts), which does not block;
//   roads      PLACES §4.1's: Valley Road, the perimeter road, 1st to 3rd Streets, North and South
//              Roads, and two working names to reach the training grounds (Training Road, Village Road);
//   paths      the lines' walks and lanes (working names: the Lines Walk at z 218 across the company
//              streets' north edge, the South Walk at z 316, three lanes between them), and a spur
//              from every door to the nearest road or walk, straight out of the door (PLACES: "paths of
//              sintered regolith slabs join every door to a road");
//   gates      the main, East, North and South gates on the fence;
//   zones      the company streets, aprons, the field, the parade deck, the track, the ranges, the
//              districts: kind, rect and surface ('paving' where PLACES paves);
//   waypoints  every door's, 0.5 m outside its footprint; the gates; the muster marks; the junctions
//              where spurs and roads meet (w:j:<x>-<z>, 'm' for minus and 'p' for a decimal point);
//   edges      straight legs along the roads and walks between consecutive nodes, each spur, and a few
//              links across paved ground (Echo's door, the street mark, the mess door and the armoury
//              window cross the company street as people do); lengths are computed, never authored;
//   interiors  Echo Company's ground floor route (PLACES §4.4: the bay door, hall-2, hall-core, the
//              lobby, the vestibule; the head, the lounge and both side exits), in the site frame.
// The walk test's waypoints: w:echo:rack (1st Squad's bay, bay-2-1), w:echo:head (head-2a),
// w:echo:lounge, w:echo:front, w:echo:street (2nd Platoon's mark on the company street, (530, 224):
// the build sheet's call), w:mess:north, w:armoury:window, w:canopy, w:gym:west.
//
// Two plans. MELAS_PLAN_AS_WRITTEN is PLACES §4.2's numbers, read only by the walk test. MELAS_PLAN
// (melas@1) is what the game uses: the same plan with the battalion area compacted where the walk
// test asked (ROADMAP §4.1's first lever: the daily places brought within about 150 m of each other,
// never a walk removed). MELAS_COMPACTION lists each building moved, from where to where and why, for
// PLACES §4.2 to take up. This module holds the tables below as frozen literals with their tiny
// constructors (TECH §2.4), and MELAS_TABLES gathers them; the plans are built from them by
// src/sim/places/siteplan.js (buildSitePlan: the door waypoints, the spurs, the junctions and the
// edges derived, so a building moved by the compaction carries its doors, its aprons and its spurs
// with it), which exports MELAS_PLAN and MELAS_PLAN_AS_WRITTEN frozen. (0.0.2 ran that builder here,
// at load, against TECH §2.4's rule that src/data holds no logic: moved after the review, the
// MELAS_PLAN golden unchanged.) Numbers PLACES does not give are my calls:
// doors of the Main Side buildings (each toward its nearest road), the SNCO quarters' and BOQ's places
// in their block, the perimeter road 5 m inside the fence (in its 15 m clear strip, so it clears
// PLACES's buildings at 20 m), the outside buildings' doors, the Talus's extent.

const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

/** The rings of detail (PLACES §4.1): the Two-Four lines and Main Side's fence, as [x0, z0, x1, z1]. */
export const MELAS_RINGS = deepFreeze({ lines: [410, 182, 764, 360], main: [0, 0, 1000, 700] });
/** A door's waypoint stands this far outside its footprint (the build sheet: 0.5 m). */
export const DOOR_WAYPOINT_M = 0.5;
/** A spur's path width, metres (my call: a slab path two wide). */
export const SPUR_W_M = 2;

// ---- the tables, as PLACES §4.2 writes them ----

// (a door: name, x, z, side of the footprint it is on, kind, clear width; wp names its waypoint, spur its junction if not straight out)
const D = (name, x, z, side, { kind = 'extDoor', widthM = 1.0, wp = name, spur = null } = {}) => ({ name, x, z, side, kind, widthM, wp, spur });
// (a building: id, PLACES's number (a string for the districts' X1…), name, ring, rects, storeys, plan kind, doors, more)
const B = (id, n, name, ring, rects, storeys, plan, doors = [], more = {}) => ({ id, n, name, ring, rects, storeys, plan, doors, ...more });

const BUILDINGS = [
  // The Two-Four lines (x 410–764, z 182–360)
  B('b:echo', 14, 'Echo Company barracks', 'lines', [[480, 190, 564, 208], [515, 208, 529, 214]], 2, 'full',
    [D('front', 522, 214, 's'), D('west-exit', 482, 208, 's'), D('east-exit', 562, 208, 's')]),
  B('b:fox', 13, 'Fox Company barracks', 'lines', [[580, 190, 664, 208], [615, 208, 629, 214]], 2, 'template',
    [D('front', 622, 214, 's'), D('west-exit', 582, 208, 's'), D('east-exit', 662, 208, 's')]),
  B('b:armoury', 15, 'Battalion armoury', 'lines', [[420, 190, 452, 212]], 1, 'full', [D('front', 436, 212, 's', { wp: 'window' })]),
  B('b:canopy', 15, 'The cleaning canopy', 'lines', [[420, 216, 446, 238]], 1, 'inset', [], { open: true, point: { wp: 'w:canopy', side: 'n' } }),
  B('b:hq', 8, 'Battalion headquarters, 2/4', 'lines', [[680, 182, 740, 214]], 2, 'full', [D('front', 710, 214, 's')]),
  B('b:mess', 17, 'Battalion mess hall', 'lines', [[488, 246, 554, 280]], 1, 'full',
    [D('north', 521, 246, 'n'), D('dock', 554, 275.5, 'e', { kind: 'vehicleDoor', widthM: 3 })]),
  B('b:aid', 16, 'Battalion aid station', 'lines', [[420, 250, 460, 272]], 1, 'full', [D('east', 460, 261, 'e')]),
  B('b:gym', 36, 'Battalion gym', 'lines', [[564, 246, 604, 276]], 1, 'full', [D('west', 564, 261, 'w')]),
  B('b:golf', 12, 'Golf Company barracks', 'lines', [[480, 330, 564, 348]], 2, 'template', [D('front', 522, 330, 'n')]),
  B('b:hotel', 11, 'Hotel Company (weapons) barracks', 'lines', [[580, 330, 664, 348]], 2, 'template', [D('front', 622, 330, 'n')]),
  B('b:hs', 10, 'H&S Company barracks', 'lines', [[680, 330, 764, 348]], 2, 'template', [D('front', 722, 330, 'n')]),
  B('b:supply', 18, 'Battalion supply and the company supply cages', 'lines', [[410, 330, 470, 360]], 1, 'full', [D('counter', 440, 330, 'n')]),
  // Main Side (the rest of the 1,000 × 700 m frame)
  B('b:gatehouse', 1, 'Main gate: the gatehouse', 'main', [[8, 418, 18, 424]], 1, 'inset', [D('door', 13, 418, 'n', { kind: 'door', widthM: 0.9 })]),
  B('b:visitor', 2, 'Visitor centre', 'main', [[20, 360, 44, 380]], 1, 'template', [D('south', 32, 380, 's')]),
  B('b:mp', 3, 'Military police station and brig', 'main', [[20, 190, 70, 222]], 1, 'full', [D('west', 20, 206, 'w')]),
  B('b:fire', 4, 'Fire station', 'main', [[90, 190, 130, 220]], 1, 'template', [D('south', 110, 220, 's')]),
  B('b:melas-hq', 5, 'Melas headquarters', 'main', [[20, 20, 80, 52]], 2, 'template', [D('north', 50, 20, 'n')]),
  B('b:chapel', 7, 'Chapel', 'main', [[100, 30, 130, 54]], 1, 'full', [D('north', 115, 30, 'n')]),
  B('b:field-house', 19, 'Field house', 'main', [[520, 20, 580, 60]], 1, 'full', [D('north', 550, 20, 'n')]),
  B('b:snco-1', 22, 'Staff NCO quarters, block 1', 'main', [[196, 200, 236, 216]], 2, 'template', [D('west', 196, 208, 'w')]),
  B('b:snco-2', 22, 'Staff NCO quarters, block 2', 'main', [[196, 280, 236, 296]], 2, 'template', [D('west', 196, 288, 'w')]),
  B('b:snco-3', 22, 'Staff NCO quarters, block 3', 'main', [[196, 360, 236, 376]], 2, 'template', [D('west', 196, 368, 'w')]),
  B('b:boq-1', 22, 'Officers\' quarters, block 1', 'main', [[300, 200, 340, 216]], 2, 'template', [D('east', 340, 208, 'e')]),
  B('b:boq-2', 22, 'Officers\' quarters, block 2', 'main', [[300, 280, 340, 296]], 2, 'template', [D('east', 340, 288, 'e')]),
  B('b:lodge', 22, 'Visitor lodge', 'main', [[300, 360, 340, 376]], 2, 'template', [D('east', 340, 368, 'e')]),
  B('b:schools', 24, 'Schools', 'main', [[200, 430, 260, 462]], 1, 'full', [D('north', 230, 430, 'n')]),
  B('b:px', 25, 'The PX', 'main', [[270, 430, 314, 458]], 1, 'full', [D('north', 292, 430, 'n')]),
  B('b:rec', 26, 'Rec hall', 'main', [[324, 430, 364, 460]], 1, 'full', [D('north', 344, 430, 'n')]),
  B('b:laundry', 27, 'Laundry and linen exchange', 'main', [[270, 470, 306, 490]], 1, 'full', [D('west', 270, 480, 'w')]),
  B('b:vac-bay', 28, 'Vac Bay', 'main', [[420, 430, 520, 490]], 1, 'full', [D('north', 470, 430, 'n')]),
  B('b:cif', 30, 'Central issue facility and base warehouse', 'main', [[420, 510, 500, 550]], 1, 'template', [D('west', 420, 530, 'w')]),
  B('b:motor-pool', 29, 'Motor pool', 'main', [[540, 430, 710, 550]], 1, 'full', [D('gate', 625, 430, 'n', { kind: 'gate', widthM: 4 })]),
  B('b:g-house', 31, 'The G-house', 'main', [[820, 430, 920, 530]], 1, 'full', [D('north', 870, 430, 'n')]),
  B('b:pistol-range', 32, 'Indoor pistol range', 'main', [[930, 560, 980, 586]], 1, 'full', [D('east', 980, 573, 'e')]),
  B('b:water', 33, 'Water plant', 'main', [[720, 600, 780, 660]], 1, 'full', [D('south', 750, 660, 's')]),
  B('b:power', 34, 'Power plant', 'main', [[820, 600, 900, 680]], 1, 'full', [D('south', 860, 680, 's')]),
  B('b:comms', 35, 'Comms tower', 'main', [[957, 640, 963, 646]], 1, 'inset', [D('east', 963, 643, 'e', { kind: 'door', widthM: 0.9 })]),
  // Outside Main Side
  B('b:halt', 'X1', 'Melas Halt and its bus shelter', 'outside', [[-120, 400, -40, 420]], 1, 'inset', [D('east', -40, 410, 'e', { spur: [-30, 410] })]),
  B('b:shoot-house', 'X4', 'Shoot house', 'outside', [[1100, 500, 1130, 520]], 1, 'full', [D('north', 1115, 500, 'n')]),
  B('b:hulk', 'X4', 'The Hulk', 'outside', [[1135, 500, 1155, 512]], 2, 'full', [D('north', 1145, 500, 'n')]),
  B('b:asp', 'X6', 'Ammunition supply point', 'outside', [[1300, 640, 1380, 700]], 1, 'template', [D('north', 1340, 640, 'n', { kind: 'gate', widthM: 4 })]),
  B('b:gas-chamber', 'X7', 'The gas chamber', 'outside', [[750, 900, 760, 906]], 1, 'full', [D('north', 755, 900, 'n')]),
  B('b:conamara', 'X9', 'Little Conamara', 'outside', [[760, 960, 900, 1000]], 1, 'full', [D('north', 830, 960, 'n', { kind: 'airlockDoor' })]),
];

// (a zone: id, kind, rect, surface ('paving' where paved), and the building it belongs to, which moves it)
const Z = (id, kind, rect, surface = null, of = null, name = null) => ({ id, kind, rect, surface, of, name });
const ZONES = [
  Z('melas.street-echo', 'street', [480, 216, 564, 238], 'paving', null, 'Echo Company street'),
  Z('melas.street-fox', 'street', [580, 216, 664, 238], 'paving', null, 'Fox Company street'),
  Z('melas.street-golf', 'street', [480, 306, 564, 328], 'paving', null, 'Golf Company street'),
  Z('melas.street-hotel', 'street', [580, 306, 664, 328], 'paving', null, 'Hotel Company street'),
  Z('melas.street-hs', 'street', [680, 306, 764, 328], 'paving', null, 'H&S Company street'),
  Z('melas.apron-echo', 'apron', [480, 208, 564, 216], 'paving', 'b:echo'),
  Z('melas.apron-fox', 'apron', [580, 208, 664, 216], 'paving', 'b:fox'),
  Z('melas.apron-armoury', 'apron', [420, 212, 452, 216], 'paving', 'b:armoury', 'The armoury porch'),
  Z('melas.apron-mess', 'apron', [488, 238, 554, 246], 'paving', 'b:mess'),
  Z('melas.field-2-4', 'field', [614, 242, 734, 302], 'paving', null, 'The battalion field'),
  Z('melas.parade', 'parade', [300, 20, 500, 140], 'paving', null, 'Parade deck'),
  Z('melas.track', 'track', [600, 20, 777, 113], 'paving', null, 'PT track and the Green'),
  Z('melas.obstacles', 'course', [800, 20, 980, 150], null, null, 'Obstacle course'),
  Z('melas.grove', 'grove', [140, 20, 280, 150], null, null, 'The Grove'),
  Z('melas.parking', 'parking', [20, 440, 180, 560], 'paving', null, 'Parking'),
  // (0.0.5: the KD range's 25 m bay, before the range's own zone so a point in the bay finds it first; src/data/places/range.js)
  Z('melas.kd-25', 'range', [1086, 280.5, 1136, 300.2], null, null, 'The 25 m line'),
  // (0.0.7: the KD's firing lines, their pads (src/data/places/range.js KD_PADS), before the range's own zone too)
  Z('melas.kd-line-200', 'range', [1398.5, 300.5, 1402.5, 399.5], null, null, 'The 200 m line'),
  Z('melas.kd-line-300', 'range', [1298.5, 300.5, 1302.5, 399.5], null, null, 'The 300 m line'),
  Z('melas.kd-line-500', 'range', [1098.5, 300.5, 1102.5, 399.5], null, null, 'The 500 m line'),
  Z('melas.kd-range', 'range', [1060, 280, 1640, 420], null, null, 'Known-distance rifle range'),
  Z('melas.grenade-range', 'range', [1200, 520, 1260, 560], null, null, 'Hand grenade range'),
  Z('melas.village', 'village', [400, 900, 700, 1100], null, null, 'Training village'),
  Z('melas.field', 'airfield', [200, -2600, 1400, -1300], null, null, 'Melas Field'),
  Z('melas.talus', 'field', [-1000, 1400, 2000, 9400], null, null, 'The Talus'),
  Z('melas.north-side', 'district', [-800, -900, 1000, -60], null, null, 'North Side'),
  Z('melas.terraces', 'district', [-3000, 0, -800, 900], null, null, 'The Terraces'),
  Z('melas.south-side', 'district', [-800, 800, -200, 1200], null, null, 'South Side compounds'),
];

// (a road or path: id, name, kind, width, centre line)
const R = (id, name, kind, widthM, pts) => ({ id, name, kind, widthM, pts, surface: 'paving' });
const ROADS = [
  R('r:valley', 'Valley Road', 'road', 12, [[-30, 410], [1060, 410]]),
  R('r:perimeter', 'The perimeter road', 'road', 6, [[5, 5], [995, 5], [995, 695], [5, 695], [5, 5]]),
  R('r:first', '1st Street', 'road', 8, [[180, 150], [180, 695]]),
  R('r:second', '2nd Street', 'road', 8, [[392, 140], [392, 695]]),
  R('r:third', '3rd Street', 'road', 8, [[776, 113], [776, 596]]),
  R('r:north', 'North Road', 'road', 8, [[550, 5], [550, -1300]]),
  R('r:south', 'South Road', 'road', 8, [[550, 695], [550, 1400]]),
  R('r:training', 'Training Road', 'road', 8, [[1010, 410], [1010, 490], [1350, 490]]),
  R('r:village', 'Village Road', 'road', 8, [[550, 880], [900, 880]]),
];
const WALKS = [
  R('r:lines-walk', 'The Lines Walk', 'path', 4, [[392, 218], [776, 218]]),
  R('r:south-walk', 'The South Walk', 'path', 4, [[392, 316], [776, 316]]),
  R('r:lane-aid', 'The aid station lane', 'path', 3, [[474, 218], [474, 316]]),
  R('r:lane-mess', 'The mess lane', 'path', 3, [[559, 218], [559, 316]]),
  R('r:lane-field', 'The field lane', 'path', 3, [[609, 218], [609, 316]]),
];
const GATES = [
  { id: 'o:melas:gate-main', name: 'The main gate', x: 0, z: 410, widthM: 12, waypoint: 'w:gate:main' },
  { id: 'o:melas:gate-east', name: 'The East gate', x: 1000, z: 410, widthM: 12, waypoint: 'w:gate:east' },
  { id: 'o:melas:gate-north', name: 'The North gate', x: 550, z: 0, widthM: 8, waypoint: 'w:gate:north' },
  { id: 'o:melas:gate-south', name: 'The South gate', x: 550, z: 700, widthM: 8, waypoint: 'w:gate:south' },
];
// (muster marks: formation spots on paved ground, each with its spur's side)
const MARKS = [
  { id: 'w:echo:street', x: 530, z: 224, kind: 'muster', side: 'n', of: 'melas.street-echo', name: "2nd Platoon's mark, Echo Company street" },
  { id: 'w:field:muster', x: 616, z: 250, kind: 'muster', side: 'w', of: 'melas.field-2-4', name: "the battalion field's formation marks" },
];
// (straight links across paved ground: people cross the company street, they don't walk its edges)
const LINKS = [
  ['w:echo:front', 'w:mess:north'], ['w:echo:front', 'w:echo:street'], ['w:echo:street', 'w:mess:north'],
  ['w:echo:street', 'w:armoury:window'], ['w:echo:front', 'w:armoury:window'], ['w:armoury:window', 'w:canopy'],
];
// Echo Company's ground floor (PLACES §4.4), in the building's frame (origin its north-west outer corner):
// 2nd Platoon's wing east of the core (hall-2 at z 7.6–10.0), the core's hallway, lobby and vestibule
// (x 39–45), 1st Squad's bay bay-2-1 (x 49.0–60.6, its door at x 57.2–58.2 on z 7.6, layout A's aisle
// at z 2.8–5.1), head-2a (x 57.0–64.6, its door at x 58.0–59.0, the privacy baffle 1.2 m inside), the
// lounge (x 74.6–80.0), stair-e and stair-w with the side exits at z 18.
const ECHO_INTERIOR = {
  area: 'melas.echo.1',
  waypoints: [
    ['w:echo:rack', 52.075, 3.1, 'spot'], ['w:echo:bay-2-1', 57.7, 7.0, 'door'], ['w:echo:hall-2:bay', 57.7, 8.8, 'junction'],
    ['w:echo:hall-2:head', 58.5, 8.8, 'junction'], ['w:echo:head', 60.0, 13.5, 'spot'], ['w:echo:hall-2:lounge', 77.3, 8.8, 'junction'],
    ['w:echo:lounge', 77.3, 13.5, 'spot'], ['w:echo:hall-2:stair-e', 81.85, 8.8, 'junction'], ['w:echo:hall-core', 42.0, 8.8, 'junction'],
    ['w:echo:lobby', 42.0, 15.5, 'junction'], ['w:echo:vestibule', 42.0, 22.5, 'door'], ['w:echo:hall-1:stair-w', 2.15, 8.8, 'junction'],
  ],
  edges: [
    ['w:echo:rack', 'w:echo:bay-2-1', [[52.075, 3.95], [57.7, 3.95]]],
    ['w:echo:bay-2-1', 'w:echo:hall-2:bay'],
    ['w:echo:hall-2:bay', 'w:echo:hall-2:head'],
    ['w:echo:hall-2:head', 'w:echo:head', [[58.5, 10.6], [60.0, 11.8]]],
    ['w:echo:hall-2:head', 'w:echo:hall-2:lounge'],
    ['w:echo:hall-2:lounge', 'w:echo:lounge'],
    ['w:echo:hall-2:lounge', 'w:echo:hall-2:stair-e'],
    ['w:echo:hall-2:stair-e', 'w:echo:east-exit', [[81.85, 17.2]]],
    ['w:echo:hall-2:bay', 'w:echo:hall-core'],
    ['w:echo:hall-core', 'w:echo:lobby'],
    ['w:echo:lobby', 'w:echo:vestibule'],
    ['w:echo:vestibule', 'w:echo:front'],
    ['w:echo:hall-core', 'w:echo:hall-1:stair-w'],
    ['w:echo:hall-1:stair-w', 'w:echo:west-exit', [[2.15, 17.2]]],
  ],
};

/**
 * The compaction the walk test asked for (ROADMAP §4.1's first lever): each building moved, from its
 * north-west corner as PLACES §4.2 writes it to where MELAS_PLAN puts it, and why. Its doors, aprons
 * and spurs move with it. For PLACES §4.2 to adopt (the build sheet's report).
 */
export const MELAS_COMPACTION = deepFreeze([
  { id: 'b:armoury', from: [420, 190], to: [444, 190], why: 'the armoury to Echo\'s west end, 4 m off its wall: the window 62 m from Echo\'s door, not 86' },
  { id: 'b:canopy', from: [420, 216], to: [446, 216], why: 'the cleaning canopy with it, across the walk from the window' },
  { id: 'b:mess', from: [488, 246], to: [488, 242], why: 'the mess hall 4 m nearer the company street: its apron 4 m deep, not 8' },
]);

/** The tables the site plan is built from (src/sim/places/siteplan.js), frozen as PLACES §4.2 writes them. */
export const MELAS_TABLES = deepFreeze({ BUILDINGS, ZONES, ROADS, WALKS, GATES, MARKS, LINKS, ECHO_INTERIOR, MELAS_RINGS, DOOR_WAYPOINT_M, SPUR_W_M });

/**
 * Melas Chasma's walls round the base (PLACES §3.15, §4.1; the sheet 0.0.3 §8 item 5): each a straight
 * crest parallel to the canyon's east–west axis, its perpendicular distance and its rise. The sun's
 * horizon reads them (src/sim/places/sun.js horizonAt). They live here only, PLACES's data, and SETTING
 * §3.8 points here rather than keeping a copy in SITES.melas, so the number is in one place (my call).
 */
export const MELAS_WALLS = deepFreeze({ southKm: 45, southRiseM: 8000, northKm: 150, northRiseM: 8000 });

/** The site record of Base Melas (PLACES §1.2): its areas grow with the buildings that get interiors; horizon names its walls. */
export const MELAS_SITE = deepFreeze({
  id: 'melas', kind: 'base', template: 'melas@1', name: 'Marine Corps Base Melas', geo: 'melas', horizon: 'melas',
  gravity: { kind: 'surface', gG: 0.38 }, areas: ['melas.ground', 'melas.echo.1', 'melas.echo.2'],
});
