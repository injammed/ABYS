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


## Washington / Capital Refuge (first geographic campaign)

The first map now uses a roughly 11.7 × 10 km aerial envelope around central Washington, with a playable polygon approximating the user's drawn outline. The cathedral camp remains the fictional spawn installation. M opens the aerial field map, population ledger and five quest stations. Library terminals, ceiling paintings, all exhibits, Mara's AK-47, laser robots, aliens and the F-49 remain accessible.

Ground and roofs use photographic USGS/USDA NAIP imagery; 23,680 DC Open Data footprints are extruded into chunked city geometry. Geographic x/z units approximate metres. Building heights are estimated (9/18/30 m), ground is flat, walls are simplified, and interiors are not reconstructed. This is an aerially grounded playable foundation, not full photoreal street-level Washington. Map sources and bounds are shipped in `public/maps/washington/sources.json`. `scripts/maps/fetch-capital.py` reproduces the public data; it requires Python/Pillow. No Apple Maps screenshot pixels are used as world textures.

The scenario starts with 5,000,000 living human refugees plus one infected arrival. A conserved ledger tracks susceptible humans, protected evacuees, active zombies, eliminated zombies and civilian deaths. Infection grows rapidly during active play; quarantine stops conversions. Killing a rendered zombie subtracts one from the regional count. Up to 53 zombie representatives are allocated from that finite count; they are not millions of individually thinking actors. Eliminating the first zombie before spread is a valid early victory. Zero zombies permanently ends new outbreak spawns.

Quest stations: restore a field hospital (protect 5,000 refugees), enable the quarantine relay, disable both original robot patrols and recover fictional Aegis authorization, evacuate another 5,000, then choose sustained containment or a fictional nuclear strike. Hospital/evac stations support repeat convoys every 30 seconds of active play. Protected evacuees cannot become infected. Containment teams perform abstract regional clearance over time. The strike ends the outbreak immediately at a permanent cost of 25% of unprotected humans, with a separate review/confirmation screen and a launch/blast animation. These are game abstractions, not real weapon procedures, locations or effects modelling.

The F-49 can now traverse the map at 100 m/s (Shift: 240), rise/descend at 32 m/s and reach 450 m. Rooftop collision prevents descending into city buildings. E still requires a ground landing to exit. Map bounds apply to foot and flight movement. Aircraft position/hull remain session-local; saving in flight restores the player to the cathedral with campaign/inventory intact.

Saves use `aetimm-capital-v2`, with validation and migration of the prior player inventory. This remains single-player browser storage. There is no shared server world, offline progression, account persistence or multiplayer authority. Menus/dialogue/hidden tabs pause simulation. Death/respawn resets the campaign.

Validation: typecheck, static build, existing route contracts, `verify-survival.mjs` and `verify-capital.mjs`. The campaign checks cover conservation, growth past 500,000, early eradication, quarantine, convoy cooldown, quest gates, both endings, repeated action safety, malformed saves, station accessibility and geographic/rooftop collisions.

### Aegis campaign branches
The decision terminal now offers containment, Hypersonic Salvo Kinetic Weapons, Massive Autonomous Drone Swarms (MADS), and the existing nuclear ending. Every choice requires the earlier quests and 10,000 protected survivors, is reviewed before confirmation, and commits once per campaign. Fictional balance: salvo clears immediately with 2% losses among unprotected humans; nuclear clears with 25%; MADS clears at 8%/second (minimum 15), containment at 2.5%/second (minimum 5), both with zero strike losses. All preserve protected evacuees and conserve the population ledger. These are abstract campaign outcomes, not weapon performance claims or operational simulations. Old saves migrate to their existing containment/nuclear branch. No additional 3D weapon assets or salvo/swarm combat animations are included.
