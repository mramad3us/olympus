// OLYMPUS data: the body's rates and bands, every number BODY §3 to §9 and §16.1 give the ledgers, in one table (the build sheet 0.0.4 §4).
//
// The body is physical ledgers, not bars (BODY §0): kilocalories in the gut and in reserve, litres of
// body water against euhydration, millilitres in the bladder and grams in the bowel, grime from 0 to
// 100, hours of sleep pressure, a core temperature, a stamina pool, stress. src/sim/body/ advances them
// by the rates below in closed form on the game's minute grid (BODY §2.6), and turns each into a felt
// band by the thresholds below (BODY §3.4, §4.3, §5.1, §5.2, §6, §7.3, §8, §9.1). Each band carries
// the tone the instinct and the strip read ('fine', 'note', 'warn', 'urgent'), the words the
// character feels (VIEWS §8.2: no numbers), and the strip's fill, 0 to 5 rows (VIEWS §7.6).
//
// The environment this round (CONTRACTS §16; the build sheet §4): Mars's 0.38 G, Melas's 66.0 kPa
// floors and 65.9 kPa ground, ROOM_C 20 °C indoors and OUTDOOR_C −10 °C out (the cool season, my call
// in the sheet), SpO₂ 97% (BODY §8's reference, so capacity is the sheet's 12.5 MET at Fitness 10;
// BODY §11's partial pressures come later). The MET of the player's own motion (idle 1.5, stroll 2.5,
// walk 3.0, run 8.0, lying 1.0) are the sheet's calls; seated 1.3 is BODY §3.2's low end (my call).
// Marked (my call) below where neither BODY nor the sheet gives the number.
const deepFreeze = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v); return Object.freeze(o); };

// ---- the environment ----
/** Mars's surface gravity in G (CONTRACTS §16, BODY §16.1). */
export const G_MELAS = 0.38;
/** Melas's indoor air and the valley floor's (CONTRACTS §16), kPa. */
export const FLOOR_KPA = 66.0, GROUND_KPA = 65.9;
/** Indoors (PLACES §3.2's Martian standard) and outdoors this round (the cool season: my call in the sheet), °C. */
export const ROOM_C = 20, OUTDOOR_C = -10;
/** Arterial saturation at Melas this round (BODY §8's reference value; §11.2's curve comes with the air), %. */
export const SPO2_PCT = 97;

// ---- motion and burn (BODY §3.1, §3.2) ----
/** MET at 1 G of the player's own motion and postures (the sheet's calls; seated BODY §3.2's low end). */
export const MET = deepFreeze({ idle: 1.5, stroll: 2.5, walk: 3.0, run: 8.0, lie: 1.0, sit: 1.3, asleep: 0.95 });
/** The kind of each gait (BODY §3.1's gravity scaling: still kinds carry no g term). */
export const GAIT_KIND = deepFreeze({ idle: 'still', stroll: 'walk', walk: 'walk', run: 'run', lie: 'still', sit: 'still' });
/** MET above which sleep pressure builds faster (×1.3), and above which grime builds faster (+1/h) (BODY §6, §7.1). */
export const HARD_MET = 4, VERY_HARD_MET = 5;
/** Mass by build: body-mass index × height² (the sheet §3: lean 21, medium 23.5, heavy 26; the roster's slight and broad read as lean and heavy: my call). */
export const BMI_BY_BUILD = deepFreeze({ lean: 21, slight: 21, medium: 23.5, broad: 26, heavy: 26 });
/** Kilocalories in a kilogram of tissue lost (BODY §3.3). */
export const KCAL_PER_KG = 7700;

// ---- energy and hunger (BODY §3.3, §3.4) ----
export const ENERGY = deepFreeze({
  GUT_MAX_KCAL: 1800,              // "you couldn't eat another bite"
  ABSORB_BASE_KCAL_H: 120,         // absorption 120 + 0.8 × burn kcal/h (my call in BODY)
  ABSORB_BURN_K: 0.8,
  RESERVE_CAP_KCAL: 4000,          // surplus stored and forgotten (no fat gain before 1.0)
  EMPTY_ASLEEP_K: 0.25,            // an hour asleep counts a quarter of one toward hunger
  MEAL_CALM: 8,                    // a meal (≥ REFLEX_MIN_KCAL) takes 8 off stress (BODY §9.1)
});
/** Felt hunger (BODY §3.4): the felt ladder by hours since the gut emptied, the deep by the reserve; the worse rules. */
export const HUNGER = deepFreeze([
  { id: 'fed', tone: 'fine', fill: 0, words: 'Fed.' },
  { id: 'peckish', tone: 'note', fill: 1, words: 'You could eat.' },
  { id: 'hungry', tone: 'warn', fill: 2, emptyH: 4, reserveKcal: -1500, mod: -1, words: 'Hungry.' },
  { id: 'very-hungry', tone: 'warn', fill: 3, emptyH: 10, reserveKcal: -3000, mod: -1, words: 'Your stomach is all you think about.' },
  { id: 'weak', tone: 'urgent', fill: 4, reserveKcal: -13000, mod: -2, words: 'Weak from hunger: your legs are someone else\'s.' },
  { id: 'faint', tone: 'urgent', fill: 5, reserveKcal: -20000, mod: -3, words: 'Faint with hunger: the edges go grey.' },
  { id: 'starving', tone: 'urgent', fill: 5, reserveKcal: -40000, mod: -5, words: 'Starving.' },
]);

// ---- water and thirst (BODY §4) ----
export const WATER = deepFreeze({
  GUT_TAU_MIN: 20,                 // drunk water absorbs with τ 20 min
  GUT_MAX_L: 1.2,                  // the stomach holds 1.2 L at a time
  INSENSIBLE_L_H: 0.030,           // 0.030 × (0.6 + 0.4 metG/1.5) × dryK L/h
  DRY_K_IN: 1.0, DRY_K_OUT: 1.3,
  URINE_BASE_L_H: 0.025,           // obligatory urine, × NIGHT_K by night
  URINE_LOW_L_H: 0.018,            // concentrated, below URINE_LOW_BELOW_L
  URINE_LOW_BELOW_L: -0.5,
  URINE_SURPLUS_TAU_H: 1.5,        // a surplus is passed at surplus / 1.5 L/h
  NIGHT_K: 0.5, NIGHT_FROM_H: 23, NIGHT_TO_H: 6,   // night-time ADH, by the body clock
  METABOLIC_L_PER_KCAL: 0.00013,   // 0.13 mL of water per kcal burned
  STOOL_L_PER_G: 0.0004,           // 0.1 L a sol in 250 g of stool (BODY §4.2; my call: lost at relief)
});
/** Thirst by the deficit as a share of mass (BODY §4.3). */
export const THIRST = deepFreeze([
  { id: 'fine', tone: 'fine', fill: 0, words: '' },
  { id: 'thirsty', tone: 'warn', fill: 1, pct: 1, words: 'Thirsty.' },
  { id: 'dry', tone: 'warn', fill: 2, pct: 2, mod: -1, words: 'Your mouth is dry.' },
  { id: 'parched', tone: 'urgent', fill: 3, pct: 4, mod: -2, bodyMod: -1, words: 'Parched, and a headache with it.' },
  { id: 'dehydrated', tone: 'urgent', fill: 4, pct: 6, mod: -4, words: 'Dehydrated: dizzy when you stand.' },
  { id: 'severe', tone: 'urgent', fill: 5, pct: 8, mod: -6, words: 'Badly dehydrated: your thoughts swim.' },
  { id: 'collapse', tone: 'urgent', fill: 5, pct: 12, mod: -6, words: 'Collapsing for want of water.' },
]);

// ---- bladder and bowel (BODY §5) ----
export const BLADDER = deepFreeze({ ACCIDENT_ML: 850, WAKE_ML: 450, BURST_PER_MIN: 0.03, ACCIDENT_GRIME: 25, ACCIDENT_STRESS: 10 });
/** The bladder's bands by volume (BODY §5.1). */
export const BLADDER_BANDS = deepFreeze([
  { id: 'empty', tone: 'fine', fill: 0, words: '' },
  { id: 'could-go', tone: 'note', fill: 1, ml: 200, words: 'You could go.' },
  { id: 'need', tone: 'warn', fill: 2, ml: 400, mod: -1, uses: 'mind', words: 'You need the head.' },
  { id: 'urgent', tone: 'urgent', fill: 3, ml: 550, mod: -2, words: 'You need the head, now.' },
  { id: 'bursting', tone: 'urgent', fill: 4, ml: 700, mod: -3, words: 'Bursting.' },
]);
export const BOWEL = deepFreeze({
  STOOL_G_PER_KCAL: 0.06,          // mess food (a bar or a ration 0.04: src/data/body/foods.js)
  TRANSIT_TAU_H: 18,               // today's food arrives tomorrow
  REFLEX_MIN_KCAL: 400, REFLEX_MS: 2_700_000, REFLEX_G: 100,   // the gastrocolic reflex: 45 min after a meal of 400 kcal, every threshold 100 g lower
  MORNING_G: 50, MORNING_FROM_H: 6, MORNING_TO_H: 10,          // and 50 g lower in the body's morning
  ACCIDENT_G: 550, DESPERATE_PER_MIN: 0.02, RELIEF_K: 0.9, ACCIDENT_GRIME: 40, ACCIDENT_STRESS: 10,
});
/** The bowel's bands by load (BODY §5.2), before the reflexes lower them. */
export const BOWEL_BANDS = deepFreeze([
  { id: 'empty', tone: 'fine', fill: 0, words: '' },
  { id: 'could-go', tone: 'note', fill: 1, g: 150, words: 'You could use a stall.' },
  { id: 'need', tone: 'warn', fill: 2, g: 250, mod: -1, uses: 'mind', words: 'You need a stall.' },
  { id: 'urgent', tone: 'urgent', fill: 3, g: 350, mod: -2, words: 'A stall, now.' },
  { id: 'desperate', tone: 'urgent', fill: 4, g: 450, mod: -3, words: 'Desperate for a stall.' },
]);
/** Bladder and bowel together cost at most this much (BODY §22). */
export const ELIM_MOD_MIN = -3;

// ---- hygiene (BODY §6) ----
export const HYGIENE = deepFreeze({
  GRIME_AWAKE_H: 1.2, GRIME_ASLEEP_H: 0.5, GRIME_PER_SWEAT_L: 8, GRIME_HARD_H: 1, GRIME_OUT_H: 1.5,
  WASH_LEFT: 30, WASH_TAU_MIN: 0.75,                           // one water minute leaves 30, each more e^(−1/0.75) of it
  WET_HAIR_MS: 1_200_000,                                      // hair wet 20 minutes after the water (TIME §8.2)
  STUBBLE_SHOWS_H: 12, STUBBLE_FAIL_H: 20,                     // the basin shaves from 12 h (my call); inspection fails over 20 h
  FACE_K: 0.9,                                                 // face and hands at the basin: grime × 0.9
  SWEAT_DRY_TAU_H: 1,                                          // sweat on the skin and the cloth dries with τ 1 h (my call)
  SHOWER_CALM: 10, COLD_SHOWER_STRESS: 3,
});
/** Grime's bands (BODY §6); the smell range in metres from unwashed on. */
export const GRIME_BANDS = deepFreeze([
  { id: 'fresh', tone: 'fine', fill: 0, words: 'Fresh.' },
  { id: 'clean', tone: 'fine', fill: 1, grime: 15, words: 'Clean enough.' },
  { id: 'grubby', tone: 'note', fill: 2, grime: 35, words: 'Grubby.' },
  { id: 'unwashed', tone: 'warn', fill: 3, grime: 55, mod: -1, smellM: 1.5, words: 'Unwashed: you can smell yourself.' },
  { id: 'rank', tone: 'warn', fill: 4, grime: 70, mod: -2, smellM: 2.5, words: 'Rank.' },
  { id: 'filthy', tone: 'urgent', fill: 5, grime: 85, mod: -3, smellM: 4, words: 'Filthy.' },
]);
/** Stubble's bands by hours since the shave (the basin shaves from STUBBLE_SHOWS_H; over STUBBLE_FAIL_H fails an inspection). */
export const STUBBLE_BANDS = deepFreeze([
  { id: 'smooth', tone: 'fine', fill: 0, words: 'Clean-shaven.' },
  { id: 'shadow', tone: 'fine', fill: 1, h: 12, words: 'A shadow on your jaw.' },
  { id: 'stubble', tone: 'note', fill: 2, h: 20, words: 'Stubble: it would fail an inspection.' },
]);

// ---- sleep, the body clock, fatigue (BODY §7) ----
export const SLEEP = deepFreeze({
  AWAKE_H_H: 1.0, HARD_K: 1.3, STRESS_K: 1.1, STRESS_FROM: 50, HOT_K: 1.2, HOT_FROM_C: 38,
  NEED_H: 8.0, NEED_SD_H: 0.5, NEED_MIN_H: 6.5, NEED_MAX_H: 9.5,           // traits.sleepNeedH ~ N(8.0, 0.5) in [6.5, 9.5]
  TAU_H: 24.2, TAU_SD_H: 0.2,                                             // traits.tauIntH ~ N(24.2, 0.2)
  DEPTH_FROM_H: 16, DEPTH_K: 0.5,                                         // depthK = 1 + 0.5 max(0, p − 16)/16, fixed at sleep's start
  LATENCY_MIN: 10, LATENCY_SPAN_MIN: 40, LATENCY_FULL_H: 14,              // latency 10 + 40 (1 − min(1, pEff/14)) min
  WMZ_FROM_H: 18, WMZ_TO_H: 22, WMZ_LATENCY_K: 2, WMZ_AWAKE_BELOW_H: 4,   // the wake-maintenance zone: latency doubled; under 4 h of pressure, awake till it ends
  WAKE_P_H: 0.5, WAKE_FROM_H: 5, WAKE_TO_H: 10, WAKE_MAX_MS: 43_200_000, // natural waking: p ≤ 0.5 in the body's 05:00 to 10:00, or 0, or 12 h
  INERTIA: [[8, -3, 1_800_000], [3, -2, 900_000]],                        // woken over 8 h: −3 for 30 min; over 3 h: −2 for 15 min
  NIGHT_CALM: 60, NIGHT_CALM_H: 6,                                        // a night's sleep −60 stress (my call: by hours slept, full at 6)
  BERTH_NEW_NIGHTS: 2,
  // re-entrainment (BODY §7.2): a day lived of SOL_H; the offset pulled toward 0 by at most cap × L / T_day an hour
  DELAY_CAP_H_DAY: 1.5, ADVANCE_CAP_H_DAY: 1.0, LIGHT_K: 1.0,
});
/** Sleep quality by the body's hour (BODY §7.1): [fromH, toH, k], the window first. */
export const QUALITY_BY_PHASE = deepFreeze([[22, 32, 1.0], [8, 12, 0.85], [12, 18, 0.75], [18, 22, 0.6]]);
/** Sleep quality by the bed (BODY §7.1). */
export const QUALITY_BY_BED = deepFreeze({ 'own-rack': 1.0, rack: 0.9, couch: 0.8, bag: 0.85, ground: 0.7, seat: 0.6, suit: 0.65, freefall: 0.9 });
/** Other quality factors this round (BODY §7.1). */
export const QUALITY = deepFreeze({ NEW_BERTH: 0.9, VERY_HUNGRY: 0.85, BLADDER_FROM_ML: 400, BLADDER: 0.8, COLD_BELOW_C: 36.3, COLD: 0.6, HOT_ABOVE_C: 37.8, HOT: 0.7 });
/** The circadian term of effective pressure (BODY §7.3): [amplitude h, centre body h, width h]; distances wrapped round the clock (my call: no step at midnight). */
export const CIRC = deepFreeze([[3.0, 4.5, 2.2], [1.0, 15, 1.5], [-1.5, 20, 1.5]]);
/** Fatigue by effective pressure (BODY §7.3, tradecraft's ladder on hours awake). */
export const FATIGUE_BANDS = deepFreeze([
  { id: 'fine', tone: 'fine', fill: 0, words: 'Rested enough.' },
  { id: 'tired', tone: 'warn', fill: 2, h: 16, mod: -1, words: 'Tired.' },
  { id: 'exhausted', tone: 'urgent', fill: 3, h: 20, words: 'Exhausted.' },
  { id: 'ragged', tone: 'urgent', fill: 4, h: 36, words: 'Dead on your feet.' },
  { id: 'lost', tone: 'urgent', fill: 5, h: 48, words: 'Seeing things for want of sleep.' },
]);
/** Exhausted's cost: −(3 + ⌊(pEff − 20)/3⌋), at most −12 (tradecraft's WEAR_H 3, WORN_MAX 12). */
export const EXHAUSTED = deepFreeze({ BASE: 3, WEAR_H: 3, MAX: 12 });

// ---- stamina (BODY §8) ----
export const STAMINA = deepFreeze({
  CAP_BASE_MET: 8, CAP_PER_FIT: 0.45, TH_K: 0.85, DRAIN_K: 7, RECOVER_K: 1.5, SPRINT_K: 1.3,
  BLOWN_UNTIL: 25,                  // blown at 0: walk only until 25 again
  WINDED_BELOW: 25,                 // winded under 25: no sprint
  FITNESS: 10,                      // effective fitness until SKILLS's (0.0.13 to 0.0.15)
});
export const STAMINA_BANDS = deepFreeze([
  { id: 'fine', tone: 'fine', fill: 0, words: '' },
  { id: 'hard', tone: 'note', fill: 1, below: 50, words: 'Breathing hard.' },
  { id: 'winded', tone: 'warn', fill: 2, below: 25, words: 'Winded.' },
  { id: 'blown', tone: 'urgent', fill: 3, below: 1e-9, words: 'Blown.' },
]);

// ---- stress and morale (BODY §9: stubs this round, tradecraft's numbers) ----
export const STRESS = deepFreeze({ CALM_PER_MIN: 0.5, SAFE_CALM_PER_MIN: 2, ON_EDGE: 50, FRAYED: 75, MAX: 100 });
export const STRESS_BANDS = deepFreeze([
  { id: 'calm', tone: 'fine', fill: 0, words: 'Calm.' },
  { id: 'wary', tone: 'fine', fill: 1, v: 25, words: 'Wary.' },
  { id: 'on-edge', tone: 'warn', fill: 2, v: 50, words: 'On edge.' },
  { id: 'frayed', tone: 'urgent', fill: 3, v: 75, words: 'Frayed.' },
]);
/** Morale is flat this round (BODY §9.2's drift comes with PEOPLE's social term). */
export const MORALE = deepFreeze({ FLAT: 70, LOW: 30, VERY_LOW: 15 });
export const MORALE_BANDS = deepFreeze([
  { id: 'very-low', tone: 'urgent', fill: 3, words: 'Low as you have been.' },
  { id: 'low', tone: 'warn', fill: 2, words: 'Low.' },
  { id: 'steady', tone: 'fine', fill: 0, words: 'Steady.' },
]);

// ---- gaits (BODY §16.1, §16.3) ----
/** The 1 G anchors (tradecraft's Earth speeds) and the exponents of g, m/s. */
export const GAIT = deepFreeze({ STROLL_MS: 0.95, WALK_MS: 1.45, RUN_MS: 3.6, SPRINT_MS: 6.0, STROLL_EXP: 0.25, WALK_EXP: 0.25, RUN_EXP: 0.3, SPRINT_EXP: 0.35, FIT_BASE: 0.85, FIT_K: 0.015, SPEED_STEP_MS: 0.01 });
/** Load by weight against strength (BODY §16.3): [from ratio, id, walk ×, run, sprint, mod]. */
export const LOAD_BANDS = deepFreeze([
  { id: 'unladen', from: 0, walkK: 1, run: true, sprint: true, mod: 0 },
  { id: 'laden', from: 0.30, walkK: 1, run: true, sprint: true, mod: -1 },
  { id: 'heavy', from: 0.45, walkK: 0.9, run: true, sprint: false, mod: -2 },
  { id: 'very-heavy', from: 0.65, walkK: 0.75, run: false, sprint: false, mod: -4 },
  { id: 'overloaded', from: 0.90, walkK: 0.75, run: false, sprint: false, mod: -4 },
]);

// ---- the grid (BODY §2.6) ----
/** The cell the ledgers' rates are held across (the game's minute grid since the epoch), ms. */
export const CELL_MS = 60_000;
/** The body clock's offset is stepped on the hour grid (BODY §2.6), ms. */
export const CLOCK_STEP_MS = 3_600_000;
