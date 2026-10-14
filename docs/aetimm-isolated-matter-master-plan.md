# AETIMM ISOLATED MATTER ENGINE — master plan

Owner direction, 2026-10-13: build an isolated simulation system inspired by robot-training environments, with progressively smaller digital matter units ("attums"), a broad material library, and eventual 100% destructibility. First proving ground: Bull in a China Shop. Future environment: APY0C's fictional black-hole megastructure.

## Definitions and promises
An attum is a coarse simulation sample measured in metres, not an atom or a claim of atomic accuracy. An isolated environment owns its state, seed, material definitions, timestep, input history and evidence. Smaller samples alone do not make physics more accurate. Material models, constraint convergence, collision coverage and evidence determine credibility.

**100% destructibility is the north star, not current status.** Ultimately every eligible solid in a scenario—including targets, furniture, walls, floors and supporting structure—can fail, fragment and continue interacting. Boundary conditions remain explicit. It does not imply unlimited resolution, physically correct black holes, or converting all of Earth to particles.

## Current playable stage
The cathedral terminal opens an independent 3D range and preserves the survival session. Eight complete specimens: pottery, plate, gel torso, concrete, brick/mortar, glass, synthetic flesh/bone composite, and fictional APY0C void-lattice alloy. Each material has dimensionless density, bond stiffness, failure stretch, toughness, damping and friction. Composite torsos contain distinct stiff bone units inside a softer material; brick interfaces have weaker bonds. Repeated impacts accumulate bond damage, and released pieces remain in the shared simulation. No biological or engineering validation is claimed.

Selectable attum diameters: 25 cm, 18 cm, 12.5 cm and requested 10 cm. Full-range counts: 525, 961, 3,176; 10 cm exceeds the 5,000-unit cap and explicitly falls back to 12.5 cm. Whole specimens are retained; no silent truncation. Changing resolution resets the scenario. The UI and measurement exports record requested and actual diameter. Defaults remain coarse; finer configurations are experimental. The surrounding room remains static. Smooth intact proxy meshes become instanced pieces on impact; continuous fracture surface reconstruction is unfinished.

## Robot-simulation inspiration
Borrow reproducible environments, explicit physics parameters, isolated resets, parameter sweeps, sensor/observation boundaries and performance evidence. Future seeded variation should test a material across an envelope rather than make a single attractive run appear conclusive.

Primary references consulted:
- Isaac Lab: https://isaac-sim.github.io/IsaacLab/main/index.html — robot learning environments and domain randomization.
- MuJoCo modeling: https://mujoco.readthedocs.io/en/stable/modeling.html — explicit models, deformable representations and preallocated runtime state.

No claim that Isaac Lab, MuJoCo, PhysX or a robot-training backend is integrated into this browser engine. No claim that game outcomes transfer to real materials, weapons, tissue, buildings or robots.

## Development sequence and acceptance gates
1. **Material coupons (current):** independent presets and composites, breakable bonds, finite bounded state, deterministic reset, complete objects under the cap, exported measurements. Verify on named desktop and physical mobile devices before claiming frame targets.
2. **Resolution evidence:** repeat identical scripted impacts at multiple diameters; measure displacement, debris count, occupied volume, penetration artifacts, bond failure, p50/p95 physics/render costs and total memory where exposed. Tune timestep/substeps with resolution. Require numerical convergence, not merely more particles.
3. **Local refinement:** retain coarse far-field material, split near contact and fracture. Define transfer of mass, momentum and energy before splitting/merging. Never delete matter to achieve the frame budget. Add pooling, spatial-hash reuse, sleeping and worker execution first; consider WebGPU only after profiling.
4. **Surface continuity:** reconstruct visible cracked and deformed surfaces from the current state. Preserve cavities, cross-sections, material boundaries and persistent fragments. Validate that visual surfaces and collision shapes agree.
5. **Destructible room:** finite room section with load-bearing floors, walls and furniture, support failure and debris contact. Protect the outside game from sandbox state. Every declared destructible object must pass a controlled failure scenario; document retained boundary supports.
6. **APY0C megastructure:** define fictional alloy, layered shielding, joints and structural members with authored game rules. Test collapsing sections in a bounded endgame encounter. Fictional black-hole effects are separate gameplay fields; never label them physically validated general relativity.
7. **Broader world integration:** explicit milestone and release gate after real-device evidence. Preserve conventional geometry for inactive regions, saves, character/combat behavior and rollback. No automatic global engine conversion.

## Scaling and release policy
For a filled volume, halving diameter costs approximately eight times the samples before extra bonds/collision iterations. "Maximum smallness" means the smallest stable resolution that fits a device's measured CPU/GPU/memory budget for a stated scene and accuracy target. There is no universal minimum attum. A future single-specimen micro-lab can go finer than the whole range without pretending the entire world has that resolution.

Target: 30 Hz simulation and 60 FPS rendering. Record actual results and dropped steps. A successful build is not a browser benchmark. Runtime snapshots, environment/device IDs, fixed input scripts, coefficient versions and regression fixtures form the evidence bundle. Future stochastic scenarios require recorded seeds and input replays. Changes to material constants are versioned; visual plausibility is insufficient for claims of physical calibration.

Release classification: AETIMM for the bounded material-range extension requested by the owner; REFINE for universal destructibility, adaptive subdivision, robot training and complete world replacement. No new dependency, payments, data collection or backend capability. Rollback: revert this material extension and redeploy the previous working range.

## Initial resolution sweep — 2026-10-13
Node CPU, all eight specimens impacted, 40 steps per setting: 25 cm / 525 attums averaged 5.61 ms per step; 18 cm / 961 averaged 9.07 ms; 12.5 cm / 3,176 averaged 31.18 ms. Requested 10 cm correctly fell back to 12.5 cm (30.18 ms in that repeated sample). These are short CPU-only samples, not a device qualification or rendering FPS claim. The fine setting nearly consumes the entire 33.33 ms simulation budget before rendering. Keep coarse as the default. Tests passed material completeness, layered bone/flesh, weak mortar, damage accumulation, all-target finite-state stress, budget fallback and deterministic restocking. Original range and water/floor tests passed. Browser visuals and physical-device benchmarking remain outstanding.
