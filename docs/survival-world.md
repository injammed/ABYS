# AETIMM: District Zero

The site root is an immediate, single-player browser game. The cathedral is the safe spawn; the existing five ceiling paintings and 43 sculptures remain inside it. A bounded district outside contains infected survivors, robot patrols, supplies and a stranded visitor. This is a playable foundation, not the proposed finished city or Earth simulation.

## Controls and access

WASD moves, mouse capture or drag looks, Shift runs, Space jumps, E interacts, V switches first/third person, Q drinks, R eats, Escape pauses. Touch devices have two joysticks and interaction buttons. Browser security requires a click before mouse capture.

The green terminal beside the entrance opens existing site routes in an overlay. Simulation pauses during terminal use and dialogue. Existing direct URLs remain valid; `/library/` is the directory and fallback for devices without WebGL. Trough, voting, publication and moderation rules are unchanged.

## State and dialogue

`survival.ts` contains deterministic collision, inventory, survival and dialogue rules. `survival-world.ts` builds geometry; `survival-engine.ts` owns rendering and input; `SurvivalGame.tsx` owns the interface. Saves are versioned, validated browser localStorage records. Losing browser storage loses progress. There is no multiplayer authority or account save service.

Mara provides one supply gift. Iri trades one bottle for two rations once. Typed dialogue recognizes a bounded vocabulary and explicitly responds when it does not understand. No language model, API key or paid inference is required. Free-form generative NPC action planning is future work and must validate proposed actions against game rules.

## Release checks

Typecheck, static export, existing site contract checks and survival assertions must pass. Browser checks cover cathedral entry, terminal opening and embedded library, return to play, third-person switching, crossing the doorway, NPC dialogue and mobile layout. Verify mouse capture and its Escape/pause path. Preserve the accessible directory when renderer creation fails.

Rollback: revert the survival release commit. This restores the prior cathedral/library root without changing stored exhibits or backend data.

## Mara's AK-47

Talking to Mara grants one AK-47 with 30 loaded rounds and 90 spare. Existing saves migrate without losing position or inventory. Hold left mouse after capturing the pointer, or hold F, to fire. T reloads; R still eats. Touch/button controls provide Fire and Reload. Reload takes 1.6 seconds of active simulation. Firing is disabled inside the cathedral and while paused, in dialogue, or dead.

Hits use camera aim and a second ray from the player to prevent third-person shots passing through cover. Infected require two hits; robot patrols require five. Walls, pedestals and friendly NPCs block shots. Friendly NPCs do not take damage. Defeated hostile IDs and remaining ammunition persist locally; respawning resets the run. The rifle is a stylized procedural game prop.
