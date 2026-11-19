// OLYMPUS tools: the room plans of X4's other five rooms proposed by the deriver, for the author to review and commit (the build sheet v0.0.22 item 12, §1 A; house lens G1, G2; PLACES §9's rule: tools propose authored data).
//
// For each chunk of src/data/chunks/x4.js that is not one of layout A's three (W the long room, D the narrow room, O the offset room,
// T the room and its back room, Q the small room), each family it allows (its `family` map: push and pull for the even rooms, the
// offset room's one 'fed-hinge'), the plan derived in the chunk's own frame (scenes/assemble.js deriveChunkPlan: the room placed on its
// authored side in its reference lane, combat/derive.js derivePlan, moved back), printed with its checks: the points' distance off the
// walls and apart, the paths' lengths, the dead space and the far walk, and whether every swing of the family gives the same plan.
// The chunks' synthetic lanes are registered in model.js's registry for the derivation and dropped after (assemble.js).
//
//   node tools/derive-plans.mjs            print every derived family
//   node tools/derive-plans.mjs --write    and rewrite the derived families between x4.js's two markers, nothing else
//   node tools/derive-plans.mjs --wreck [--write]   v0.0.25 (the build sheet v0.0.25 §1 A): the Wreck's three bulkhead hatches'
//                                          plans (cells 2 and 5, the store: src/data/places/wreck.js), derived in the area's own frame
//                                          (one authored area, no chunk), printed, and with --write rewritten between
//                                          src/data/places/wreck-plans.js's two markers; the hold's plan (entered from its deckhead,
//                                          no door) is authored there by hand. tests/wreck-place.test.mjs holds them fresh.
//
// The committed families are held equal to what the deriver gives today by tests/chunks-fresh.test.mjs: when the router, the sight
// grid or the corner rule changes, that test fails, this tool is rerun, and the change is said in CHANGELOG.md with the chunks'
// golden (tests/house-shapes.test.mjs X4_CHUNK_PLANS8) reprinted.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { X4_CHUNKS, X4_LANE_CHUNKS } = await import(path.join(root, 'src/data/chunks/x4.js'));
const { deriveChunkPlan, ROOM_SETS, resetCaches } = await import(path.join(root, 'src/sim/scenes/assemble.js'));
const { wallClearOf } = await import(path.join(root, 'src/sim/combat/derive.js'));

/** The chunks whose plans are derived: X4's other five (layout A's three are authored). */
export const DERIVED_LETTERS = Object.freeze(ROOM_SETS.all.filter(l => !ROOM_SETS.a.includes(l)));

const r2 = (v) => Math.round(v * 100) / 100;
const len = (p) => p.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Every derived family: { [chunk id]: { [family]: plan } }, and the printed lines. */
export function deriveAll() {
  const out = {}, lines = [];
  for (const letter of DERIVED_LETTERS) {
    const id = X4_LANE_CHUNKS[letter], C = X4_CHUNKS[id], fams = {};
    for (const how of ['push', 'pull']) {
      const fam = C.family[how], t = performance.now(), P = deriveChunkPlan(letter, how), ms = performance.now() - t;
      if (fams[fam]) { lines.push(`${letter} ${id} ${how}: family '${fam}' ${same(fams[fam], P) ? 'the same plan as its other swing' : 'DIFFERS from its other swing (the first kept)'}`); continue; }
      fams[fam] = P;
      const gap = Math.hypot(P.points[0][0] - P.points[1][0], P.points[0][1] - P.points[1][1]);
      lines.push(`${letter} ${id} ${how} ('${fam}', ${P.entry}): points ${JSON.stringify(P.points)} ${r2(gap)} m apart; paths ${r2(len(P.paths[1]))} and ${r2(len(P.paths[2]))} m; hot ${P.hot.length} (${P.hot.map(h => h.why).join(', ')})${P.dead.length ? `; dead ${JSON.stringify(P.dead)}, far ${JSON.stringify(P.far?.path)} ${r2(len(P.far?.path ?? []))} m${P.far?.words ? ` ("${P.far.words}")` : ''}` : ''}; ${Math.round(ms)} ms`);
    }
    out[id] = fams;
  }
  return { plans: out, lines };
}

// (a plan as a literal in x4.js's style: one field a line, numbers as they are)
const lit = (v) => JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*|\d+)":/g, '$1: ').replace(/"/g, "'").replace(/,(?=[^\s])/g, ', ').replace(/\{(?=[^\s}])/g, '{ ').replace(/(?<=[^\s{])\}/g, ' }');
function block(plans) {
  const rows = ['const DERIVED = {'];
  for (const [id, fams] of Object.entries(plans)) {
    rows.push(`  '${id}': {`);
    for (const [fam, P] of Object.entries(fams)) {
      rows.push(`    ${/^[a-z]\w*$/i.test(fam) ? fam : `'${fam}'`}: {`);
      for (const [k, v] of Object.entries(P)) rows.push(`      ${k}: ${lit(v)},`);
      rows.push('    },');
    }
    rows.push('  },');
  }
  rows.push('};');
  return rows.join('\n');
}

// ---- v0.0.25, the Wreck (see the header) ----

/** The Wreck's derived legs: [leg number, the hatch, the compartment's rooms] (the lane's order: cell 2, cell 5, the hold (authored), the store). */
export const WRECK_DERIVED = Object.freeze([[1, 'o:wk:d5:cell-2', ['wk.d5.cell-2']], [2, 'o:wk:d5:cell-5', ['wk.d5.cell-5']], [4, 'o:wk:d6:store', ['wk.d6.store']]]);
/** The Wreck's derived plans: { plans: { [hatch]: plan }, lines }, each hot spot's id its leg's ('r1:c0', as a drawn house's), every offered hatch open for the paths. */
export async function deriveWreck() {
  const { derivePlan, geoOf } = await import(path.join(root, 'src/sim/combat/derive.js'));
  const { WRECK, WRECK_HATCHES } = await import(path.join(root, 'src/data/places/wreck.js'));
  const open = WRECK_HATCHES.filter(h => h.offered !== false).map(h => h.id), plans = {}, lines = [];
  for (const [leg, door, parts] of WRECK_DERIVED) {
    const t = performance.now(), P = derivePlan(geoOf(WRECK.id, door, parts), { open }), ms = performance.now() - t;
    plans[door] = { ...P, hot: P.hot.map(h => ({ ...h, id: `r${leg}:${h.id}` })), corners: P.corners, ...(P.far ? { far: { ...P.far, hot: `r${leg}:${P.far.hot}` } } : {}) };
    lines.push(`leg ${leg} ${door} (${P.entry}): points ${JSON.stringify(P.points)}; paths ${r2(len(P.paths[1]))} and ${r2(len(P.paths[2]))} m; hot ${P.hot.length} (${P.hot.map(h => h.why).join(', ')}); ${Math.round(ms)} ms`);
  }
  return { plans, lines };
}
function wreckBlock(plans) {
  const rows = ['const DERIVED = {'];
  for (const [id, P] of Object.entries(plans)) {
    rows.push(`  '${id}': {`);
    for (const [k, v] of Object.entries(P)) rows.push(`    ${k}: ${lit(v)},`);
    rows.push('  },');
  }
  rows.push('};');
  return rows.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--wreck')) {
  const { plans, lines } = await deriveWreck();
  for (const l of lines) console.log(l);
  if (process.argv.includes('--write')) {
    const file = path.join(root, 'src/data/places/wreck-plans.js'), src = readFileSync(file, 'utf8');
    const a = src.indexOf('// derive-plans:begin\n'), b = src.indexOf('// derive-plans:end');
    if (a < 0 || b < a) throw new Error('derive-plans: no markers in src/data/places/wreck-plans.js');
    writeFileSync(file, `${src.slice(0, a)}// derive-plans:begin\n${wreckBlock(plans)}\n${src.slice(b)}`);
    console.log(`written: ${path.relative(root, file)}, between its markers`);
  }
  resetCaches();
} else if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const t0 = performance.now(), { plans, lines } = deriveAll();
  for (const l of lines) console.log(l);
  console.log(`${Object.keys(plans).length} chunks, ${Object.values(plans).reduce((a, f) => a + Object.keys(f).length, 0)} families, derived in ${Math.round(performance.now() - t0)} ms`);
  void wallClearOf;
  if (process.argv.includes('--write')) {
    const file = path.join(root, 'src/data/chunks/x4.js'), src = readFileSync(file, 'utf8');
    const a = src.indexOf('// derive-plans:begin\n'), b = src.indexOf('// derive-plans:end');
    if (a < 0 || b < a) throw new Error('derive-plans: no markers in src/data/chunks/x4.js');
    writeFileSync(file, `${src.slice(0, a)}// derive-plans:begin\n${block(plans)}\n${src.slice(b)}`);
    console.log(`written: ${path.relative(root, file)}, between its markers`);
  }
  resetCaches();
}
