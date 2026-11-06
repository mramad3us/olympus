// OLYMPUS render: the shader warm-up. Every program the stage draws with, compiled at boot, none in play.
//
// TECH §9.8: the stage draws with one fixed set of programs (the batch, its shadow depth variant, the
// people's instanced cards, their blobs and flashes, the post composite, the blit and the palette
// bake), and a program first linked in play is a hitch: ANGLE over D3D11 compiles slowly, tradecraft's
// Windows players felt every one. So at boot, behind the title, warmUp() puts one hidden mesh of each
// into the live scene (so they compile for its lights, which are part of a program's key), compiles
// them with renderer.compileAsync (KHR_parallel_shader_compile where offered, so the title stays
// responsive), draws one frame so the shadow map's depth program is made too, and takes them out
// again. The post, blit and bake programs were made when the stage was (post.bake()). The view's
// browser test counts linkProgram calls after the first area frame and fails on any.
//
// What it warms: a batch mesh on a one-texel page (src/render/materials.js batchMaterial), the
// figures' own three materials (src/render/figures.js: cards, blobs, flashes, the berths sharing the
// cards' program; their shaders are the same for every look, so one instance each is enough), and any
// extra materials the view names (0.0.3: the clocks' hands, src/render/clocks.js). Returns { programs, ms, compiled }.
// Two things matter for a warm program to be the one play uses. It is compiled with the scene's render
// target bound (a program's key holds the output colour space, which differs between the canvas and a
// target). And the warm-up's own batch material is kept, never disposed: three frees a program when the
// last material using it goes, and the next batch would compile it again.
import * as THREE from 'three';
import { batchMaterial } from './materials.js';

const kept = [];                                                     // (the warm-up's materials: kept, so their programs stay)

/** Compile what the stage will draw with: a promise of { programs (linked in all), ms, compiled (by this warm-up) }. */
export async function warmUp(stage, { figures = null, extra: extraMats = [] } = {}) {
  const t0 = performance.now(), r = stage.renderer, before = r.info.programs?.length ?? 0;
  const group = new THREE.Group();
  group.name = 'warm-up';
  // (a batch mesh: a quad of the batch's own attributes on a page of one white texel; it casts and takes shadows)
  const page = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  page.needsUpdate = true;
  const g = new THREE.BufferGeometry();
  const n = 4, f = (k) => new THREE.BufferAttribute(new Float32Array(n * k), k);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1]), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0]), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  g.setAttribute('aTexel', f(2)); g.setAttribute('aRegion', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1]), 4));
  g.setAttribute('aPart', f(1)); g.setAttribute('aGlow', f(1));
  g.setIndex([0, 3, 2, 0, 2, 1]);
  const batch = new THREE.Mesh(g, batchMaterial(page, 1, 1, { see: true }));
  batch.castShadow = batch.receiveShadow = true;
  batch.frustumCulled = false;
  group.add(batch);
  // (the figures' instanced cards, blobs and flashes: their materials on a one-instance mesh each)
  const extra = [];
  if (figures) {
    for (const m of [figures.material, figures.bmat, figures.fmat].filter(Boolean)) {
      const src = m === figures.material ? figures.cards : m === figures.bmat ? figures.blobs : figures.flashes;
      const inst = new THREE.InstancedMesh(src.geometry, m, 1);
      inst.count = 1; inst.frustumCulled = false; inst.userData = { ...src.userData };
      inst.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, -50, 0));
      group.add(inst); extra.push(inst);
    }
  }
  // (any other material the stage draws with: the clocks' hands, on a quad each)
  const quads = [];
  for (const m of extraMats) { const q = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.1), m); q.frustumCulled = false; q.userData.noId = true; group.add(q); quads.push(q); }
  group.position.set(stage.cam.at.x, -20, stage.cam.at.z);           // (under the floor, out of sight)
  stage.scene.add(group);
  kept.push(batch.material, page);
  try {
    const was = r.getRenderTarget();
    r.setRenderTarget(stage.post.rt);                                // (the scene's target: the programs' keys as the scene pass has them)
    await r.compileAsync(stage.scene, stage.camera);
    r.setRenderTarget(was);
    stage.shadowsChanged();
    stage.render();                                                  // (one frame: the shadow map's depth program, and anything compile() left)
  } finally {
    group.removeFromParent();
    g.dispose();
    for (const inst of extra) inst.dispose?.();
    for (const q of quads) q.geometry.dispose();
  }
  const programs = r.info.programs?.length ?? 0;
  return { programs, compiled: programs - before, ms: performance.now() - t0 };
}
