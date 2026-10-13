# AETIMM Matter Engine — Browser Prototype

Classification: **REFINE — prototype branch only; no production merge.**

## Change-gate record
- Problem: the proposed continuous matter world has no bounded implementation or performance evidence.
- User impact: this isolated experiment lets the owner evaluate floor fracture, flowing material, a movable solid, and browser cost before expanding the game engine.
- Evidence: explicit owner request for a prototype; active production issues #21/#27 remain separate.
- Smallest viable experiment: `/matter/`, using existing Three.js and cathedral vault geometry. No new dependencies or edits to game assets, root navigation, combat, or APY0C.
- Scope: explicitly requested prototype, not autonomous daily maintenance. The 3-file/120-line maintenance limit is not used to authorize a production release.
- Files: new route page, sandbox component, scoped stylesheet, pure simulation module, regression script, this record.
- Risk: CPU/GC load; approximate fluid and floor proxies; marching-cubes visual artifacts; mobile/WebGL behavior remains unverified.
- Rollback: close the prototype PR/delete its branch. Main is unchanged.

## Implemented
0.25 m particle diameter; 5,000 desktop initial particles (768 floor units included), 1,500 narrow-screen initial particles. Fixed 30 Hz simulation target with capped catch-up and recorded dropped steps. Browser animation-frame rendering targets display refresh, not a guaranteed 60 FPS. Sustained overload reduces particle count to a floor of 1,500 and pixel ratio to 1.

Spatial hashing, positional overlap constraints, gravity, anchored intact floor units with neighbor bonds, localized release/bond destruction, falling interacting debris, basin bounds, and a slowly translated kinematic block. Water uses unbonded positional particles with a marching-cubes surface; diagnostic particle view is optional. Intact floor rendering uses adjacent blocks. Surrounding vault geometry comes from the existing cathedral implementation.

Controls: break floor, move solid, pause/resume, reset, particle budget, surface/particle view, export measurements, return to game. The export includes browser identity, viewport, per-frame elapsed time, simulation time per frame, particle count, contact corrections, broken bonds, and cumulative dropped steps. Samples are bounded to the last 1,800 frames. Particle buffer memory is labeled separately; it is NOT total browser/GPU memory. Reset clears samples; dropped-step counter remains session-wide.

## Deliberately unresolved
This is not a validated incompressible fluid/density solver, conservation model, stress/fracture model, thermal model or smoke simulation. Intact floor particles are anchored until the fracture tool releases them; this is a local destruction proxy, not structural analysis. The block is kinematic, not a fully dynamic rigid body. Capacity reduction removes water particles, sacrificing mass conservation for responsiveness. Rendering is not interpolated between simulation steps. These limitations prohibit whole-world replacement claims.

## Verification — 2026-10-13
- `node scripts/verify-matter.mjs`: passed intact-floor preservation, local fracture/idempotency, debris fall, water gravity, solid travel, finite state, basin containment, reset, and 5,000-particle stepping.
- Node 24 CPU sample: 12 steps at 5,000 particles; mean **39.02 ms**, maximum **53.06 ms**, particle typed buffers **125,000 bytes**. Not a browser/GPU measurement. The mean exceeds the 33.33 ms simulation budget; target is NOT met by this sample.
- `npm run typecheck`: passed.
- `npm run build`: static export passed including `/matter/` (re-run after final edits).
- Browser visual QA / desktop and physical-mobile benchmarks: not run; supported browser-control capability unavailable in this session. No production deployment or merge.

## Next acceptance gate
On at least one named desktop and one physical mobile device, record a 60-second run covering fracture, solid motion, surface/debug mode, pause/reset, orientation/resize, and tab visibility. Export samples and capture graphics memory where supported. Report p50/p95 frame and step times, dropped steps, adapted count, device/browser, and visual issues; do not infer 60 FPS from a Node run. Optimize hashing/allocation and move simulation off the main thread if measurements justify it. Validate a density constraint and volume conservation before calling the water solver physically credible. Any integration into the production arena requires a separate milestone and merge classification.
