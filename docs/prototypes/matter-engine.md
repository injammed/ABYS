# AETIMM Matter Engine — Browser Prototype

Classification: **AETIMM — bounded experimental range release, explicitly authorized by the owner on 2026-10-13.**

Release decision: the owner requested “Make bull in china shop playable on site”. This supersedes the earlier prototype-only hold for the isolated terminal/range. CI, static export and simulation regressions pass. Browser visual and physical-device performance remain unverified; this release does not authorize replacing the production world with matter physics. Historical REFINE notes below describe the earlier decision. Rollback: revert the range release commit and redeploy the previous Pages version.

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

## Cathedral destruction range — 2026-10-13

Owner-requested extension on the same REFINE branch. A dedicated amber Matter Engine terminal at cathedral x=4.8, z=3 opens a full-viewport simulation through the existing interaction prompt (E or click/tap Use). The library terminal also has a direct range button. Opening pauses the survival world; closing disposes the range and resumes the existing character/world. No campaign state or currency is changed. Standalone route: `/matter/range/`.

The “Bull in a china shop” scene includes paired stylised Desert Eagle game props, independent left/right seven-round magazines, per-hand cooldown, shared reload, recoil/flashes, optional synthesized sound, first-person WASD/mouse and touch joysticks, separate fire buttons, reset/restock and downloadable measurements. Walking/rushing into targets pushes them. Fifteen target assemblies contain 910 matter units: pots, upright plates and amber synthetic gel torso/head forms. Ceramic bonds are stiff/brittle; gel bonds use lower stiffness and higher separation tolerance. Hits break nearby bonds and apply game impulses; freed pieces continue through the shared gravity, neighbor collision, bond constraints and floor-friction simulation. Matter count stays fixed after impacts.

Visual limitation: intact objects use smooth proxy geometry; impact reveals particle-based ceramic shards or rounded gel units. This does not yet maintain a continuously reconstructed gel/ceramic surface. Fragment orientation is cosmetic. There is no calibrated firearm/tissue model, penetration solver, fluid gel, heat or universal full-world physics. The range uses the Matter Engine, but “full Matter Engine physics” is a development direction, not a completed physical fidelity claim.

New verification: `node scripts/verify-matter-range.mjs` passes initial stability, material definitions, ray hit, hand independence/cooldowns, reload, localized fracture, persistent debris motion, gel bond properties, finite state, containment, restock and shove conservation. Node CPU run: 910 units, 20 steps, mean 7.48 ms, maximum 8.81 ms (not browser/GPU evidence). Original water/floor regression and survival regressions also pass. Browser interaction, actual pointer-lock/touch, visual quality and sustained desktop/mobile frame targets remain unverified. Typecheck, full static export (including `/matter/range/`), arcade and APY0C endgame regressions pass. A second stress sample with all 15 targets disturbed remained finite for 120 steps and averaged 8.57 ms/step in Node (910 units, 805 broken bonds).

Scope expands the prior six-file experiment with terminal wiring, a reusable fullscreen React range, scene/controller, target definitions, standalone route and focused tests. Existing game assets and combat are preserved. No production merge/deployment authorized by this REFINE implementation; rollback remains dropping the prototype branch.
