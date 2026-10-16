# For the Throne — cathedral TV prototype

User-requested playable Phase III / Part II duel plus the six supplied Witch/Knight starting-loadout references. This is an illustrated Canvas2D fighting prototype, not cinematic 3D, atomic simulation, or an autonomous coding agent.

## Ten focused implementation passes

1. **Combat foundation:** deterministic fixed-step movement, facing, jump, arena bounds and one contact per strike.
2. **Defensive play:** directional guard, resource costs, dash immunity and recovery windows.
3. **Boss behavior:** approach, sweep/beam/heavy patterns, readable windups and three health-dependent intensities. Story difficulty reduces damage and cadence.
4. **World rewriting:** five binary choices produce 32 bounded combinations; fields consume energy, expire and have a cooldown. No generated code is evaluated.
5. **Match structure:** best-of-three, round reset, timeout, victory, defeat and rematch.
6. **Visual identity:** golden skeletal creator armor around a visible human; black/ultraviolet singularity deity; Eye web, throne, reflective panels and perspective floor. Native Canvas frame inspection caught inherited thick ring strokes, now reset explicitly.
7. **Controls:** keyboard, multi-pointer touch and standard gamepad; classic on-screen controller. Dash follows touch or stick direction as well as keyboard input.
8. **Readability and lifecycle:** health/energy, windup hints, optional sound, reduced motion, pause on focus loss/disconnect and throttled live status announcements; capped pixel backing and catch-up steps.
9. **Cathedral integration:** fourth physical TV/controller at (-8,-11), E interaction, pause/library shortcuts, isolated iframe and return to cathedral. Existing arcade and console remain available.
10. **Roster references:** three Witch and three Knight sheets bound to existing save-safe IDs, optimized WebP portraits, equipment lists and full-sheet links. Alien/Cyborg references explicitly pending. Complete weapon mechanics and models are not yet implemented.

These are development passes, not ten measured browser playtests. Native Canvas visual inspection and automated mechanics tests were performed; physical controller, mobile browser and end-to-end browser interaction remain unverified in this environment.

## Change gate

- **Problem/user impact:** requested duel had no playable cathedral entry; supplied starting arsenals had no roster assignment.
- **Evidence:** direct user requests; six supplied reference sheets; deterministic mechanics tests, all render states, loadout/save-ID checks and arcade reachability tests.
- **Smallest viable fix:** isolated `/throne/` static module, one additional TV using existing geometry/interaction, and reference metadata tied to existing character IDs. No dependency, backend or save-schema change.
- **Files:** `public/throne/*`, `lib/character-loadouts.ts`, `public/images/loadouts/*`, CharacterRoster and styles, SurvivalGame, cathedral-arcade, survival-engine, verification scripts, Pages workflow, this record.
- **Risk:** real-device input/layout/performance not measured; stylized graphics are much simpler than concept renders. Reference sheets establish intended equipment, not new working weapons. No claim of full Matter Engine integration.
- **Rollback:** revert this feature commit; existing character IDs and saves remain valid. Remove fourth cabinet and `/throne/` route together.
- **Verification:** `node scripts/verify-throne.mjs`; `node --experimental-strip-types scripts/verify-loadouts.mjs`; `node --experimental-strip-types scripts/verify-arcade.mjs`; `npm run typecheck`; `npm run build`. Release record/PR records results.
- **Classification:** AETIMM candidate once build and CI pass: explicit requested, bounded/reversible capability. This is user-directed feature work, not autonomous daily maintenance.
