# Bull in a China Shop: local attum refinement

## Change gate — AETIMM after verification

- Problem observed: every impact replaced an entire smooth target with coarse separated particle meshes; the smallest supported complete range was 12.5 cm despite a 10 cm request.
- User impact: no centimeter-scale interactive material at impact points and unnecessarily broad destruction.
- Authorization: explicit request to put the discussed adaptive material level on the live site. This is a requested capability, not autonomous maintenance; its scope exceeds maintenance-only line/file limits.
- Smallest viable fix: retain the bounded bonded-particle range, partition a detached struck cell into an octree whose finest leaf is 1–2 cm, and leave undamaged regions pinned. Render damaged coarse material and fine pieces as contiguous cubes rather than randomly rotated balls. Default base spacing is 12.5 cm; intact targets retain their smooth meshes until hit.
- Evidence: local partition volume equals removed coarse-cell volume. Refined parents are disabled for collisions, rendering, and hit tests. Fine fragments collide with room boundaries, coarse material and each other; floor-settled fragments sleep and can be shot awake. Reset restores all matter. Capacity prevents removal of a parent if its replacement cannot fit.
- Budget: 5,000 coarse slots plus 2,048 persistent fragment slots; no eviction of existing fragments. An exponential physics-time average pauses creation above 22 ms/frame and resumes below 14 ms/frame. This is a throttle, not a guaranteed frame rate. Coarse cells are still available when refinement is denied.
- Files changed: range UI, renderer, range state, engine enabled mask/contact optimization, new local refinement solver and test, deployment verification step, this record.
- Verification: typecheck; production build; existing matter/range/material tests; new volume, resolution, locality, bounds, sleep/wake, cap, throttle and reset tests. Node default local-impact sample: about 3.0 ms mean and 4.5 ms p95 per step. All-target 12.5 cm sample: about 6.4 ms mean per step. These are CPU tests, not browser/mobile/GPU measurements.
- Risk: visual approximation, axis-aligned pieces, one-way fine-to-coarse contacts, no rotational fragment dynamics, no calibrated tissue/weapon/material properties, no continuous surface reconstruction after fracture, static room shell. Fine debris persists only for the current session; restock/reload clears it. Sleeping fine fragments are explicitly woken by shots/active fine contacts, not all coarse-body motion. No claim of atomic fidelity or universal destructibility.
- Rollback: revert this change; existing cathedral terminal and range route remain compatible.
- Classification: bounded requested capability with executable physics evidence; AETIMM on passing build/typecheck/tests. Browser interaction and mobile frame-rate QA remain unverified in this environment.
