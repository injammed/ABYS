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

## Hostile lands and F-49

Two armored robots now wield laser rifles. A visible targeting beam locks for 0.8 seconds before firing; moving out of that lock or putting cover between you and the robot avoids damage. Three spined, crouching alien hunters join the five infected. Aliens move faster, attack at close range and require four AK-47 hits; robots require five. Existing defeated IDs are preserved and the added aliens use IDs 7–9.

The uploaded robot, alien and aircraft images are shipped as source skins. Selected source regions map onto procedural armor, flesh and aircraft surfaces. Model silhouettes follow the references (robot armor and glowing eyes, alien maw/claws/spines, swept wings and tandem canopy). These are stylized 3D game interpretations rather than exact reconstructed meshes.

The F-49 is immediately available on the pad beside the cathedral exit. E boards; WASD moves, mouse aims, Space rises, C descends, click/F fires its mounted cannon, V switches cockpit/chase camera. Touch controls include Fire, Rise and Descend. E exits only after landing. Robot lasers can damage its hull. Cannon hits count double; cannon fire does not consume the personal AK-47 inventory.

This first VTOL implementation stays within the district's clear ground corridors, at 1.4–16 metres altitude. Aircraft position/hull are session-local and reset when reloading; player progress and defeated enemies remain in the existing browser save. Respawning resets the run and the aircraft. Flight pauses with menus and dialogue.
