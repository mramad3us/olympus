// OLYMPUS scenarios: the old path of your number two's brain, a shim kept through v0.0.21 only: src/sim/combat/two.js is the module.
//
// v0.0.21 (the build sheet v0.0.21 §0 item 31, §3 step 4) moved the #2's tower admin, eyes, rows, cover and stoppage to
// src/sim/combat/two.js, byte for byte but for its imports, so no file of combat/ imports a scenario and the drill can meet a
// room off the range's lane. This path re-exports it whole, so an old import still resolves; it is deleted in v0.0.22.
export * from '../combat/two.js';
