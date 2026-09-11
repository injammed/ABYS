# Currency geometry efficiency — 11 September 2026

- Problem observed: the sculpture builder expands indexed shapes into separate vertices for every triangle before merging by material. All 43 hallway objects are constructed at entry, so duplicated position and normal buffers remain resident even when objects are distance-culled.
- User impact: unnecessary geometry memory and larger GLB exports, especially relevant to phones and detailed exhibit views.
- Evidence: comparison against production `7f505cd` across every item at gallery and hero detail (86 model pairs) established identical expanded position/normal byte hashes, material properties, mesh counts and world bounds. Triangle count remains 1,499,904 for the gallery.
- Smallest viable fix: preserve existing indices; assign identity indices to already unindexed shapes. Compact unreferenced relief vertices so empty atlas pixels do not alter bounds. No welding, decimation, changed normals, material edits or detail reduction.
- Files changed: sculpture builder, sculpture verification script, this record.
- Measured geometry buffer totals (positions, normals and indices): gallery 107,993,088 → 34,718,376 bytes (67.85% reduction); all hero models 707,281,344 → 248,495,208 bytes (64.87% reduction). Hero models are opened individually; that total is a comparison across the catalog, not simultaneous memory usage.
- Gallery GLB total: 105,604 → 34,067 KiB. These files are generated locally, not all fetched on page load. The website JavaScript payload is not reduced by this amount.
- Risk: index offsets must remain correct after material merging. All 43 gallery GLBs and four representative hero GLBs export/import with matching bounds; persistent checks enforce valid indices, finite geometry and normals, distinct exports, a 40 MiB gallery-buffer ceiling and a 45 MiB gallery-export ceiling.
- Verification: exact baseline comparison passed for all 86 models. Typecheck, sculpture verification and production static build passed locally; CI supplies the final release gate.
- Limits: no browser screenshot comparison or phone frame-rate benchmark performed. This establishes lower geometry storage, not a measured FPS gain. Source-art fidelity remains unverified.
- Rollback: revert this bounded change to restore the previous geometry representation.
- Classification: AETIMM — confirmed resource inefficiency, bounded and reversible fix, same exhibit appearance and navigation. One candidate, three files, under 120 net changed lines, no dependencies, routes or identity changes.
