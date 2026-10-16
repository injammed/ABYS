# PEARL road / flight coupe

User request: place IMG_6041.jpeg's pearl-white/gold sports car on the street near spawn and make it drive and fly. This is a procedural, stylized interpretation, not a reconstruction with reference-image fidelity.

Spawn (-5, 21), outside the cathedral front doors, beside the street and opposite the existing F-49. E boards; W/S accelerates/reverses; A/D steers; Shift brakes; G toggles road/flight. Flight uses Space/C for rise/descent. Touch movement uses the existing joystick with new Road/Flight and Brake buttons plus Rise/Descend. Boarding selects chase camera; V retains existing camera toggle. Exit requires low altitude, stopped vehicle and clear nearby ground. Road mode cannot be re-entered at altitude. The coupe is unarmed. It uses the existing vehicle hull/damage system. Vehicle position lasts for this session; reload/new game returns it to spawn, and airborne saves place the player safely at the cathedral.

Smooth pearlescent body volumes, inset wheel fairings, gold curves, reflective canopy and four visible lift plumes. No external runtime dependency or assets required. ~20k triangles; actual browser frame rate not measured.

Change gate: AETIMM candidate after typecheck, build and relevant tests. Explicit user-visible capability, isolated model/motion module and bounded integration; no backend or save schema migration. Existing F-49 retained. Revert this feature commit for rollback.

Verification: verify-pearl covers spawn clearance, exit location, acceleration, steering, braking, takeoff/descent, road-mode gate, swept obstacle handling and finite mesh geometry. Existing survival/arcade regressions and production build run before release. Browser/mobile/manual driving verification remains outstanding; controls are implemented but not physically playtested here.
