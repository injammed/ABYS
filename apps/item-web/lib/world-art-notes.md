# Capital visual direction: sanctuary under occupation

Original art direction draws on monumental dark fantasy, grounded military wear, readable urban exploration, environmental storytelling, natural light, weighty silhouettes and cold machine technology. No assets from the referenced commercial games are used.

This first browser slice adds masonry and marble in the cathedral, warm candle stands and light pools, a reinforced sanctuary portal, weathered road and vehicle surfaces, evacuation signage, sagging utility cables, sandbags, hospital canopy beds, soot, smoke and atmospheric ash. Washington building walls now have physically scaled facade UVs; aerial roof imagery and geographic footprints remain intact. Character clothing, role-specific equipment and shadows add visual separation.

Lighting uses a warm low sun, cool hemisphere fill, reduced environment intensity, ACES tone mapping, a procedural layered sky and one 1024px player-centered shadow map. Three local cathedral lights have finite ranges. Rigid decorations are batched by material. Ash uses 256 shader-driven points; smoke uses 32 instances. All surfaces are deterministic 128px textures generated locally without network requests. They are surface detail, not photoreal scanned assets.

Wrecks have explicit movement, bullet and camera collision hulls. Their bounds preserve the main centerline, pickups and vending stations. Saved positions newly obstructed by scenery recover to the cathedral. Quests, souls, economy, player controls and regional state are unchanged.

Validation covers geometry, route clearance, collision rays, finite effect pools, deterministic texture data and resource disposal, plus existing gameplay and production-build checks. Full GPU visual/performance validation is still required on WebGL-capable devices; this pass does not claim commercial AAA fidelity or measured phone frame rates.
