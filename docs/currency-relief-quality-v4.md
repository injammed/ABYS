# ITEM relief quality pass 4

The Liberty profile, heraldic eagle and Franklin portrait now use mesh relief sampled from an AI-authored grayscale sculpture atlas. This replaces the previous assemblies of ellipsoids and strokes for those motifs. Standing Liberty, rings, frames, inlays, filigree and the other object bodies remain modeled geometry.

The atlas is an artistic source, not measured depth. Brightness contains some illustrative shading, so its conversion is an interpretation of raised relief, not a faithful 3D reconstruction or a scan. No claim of maximum quality or parity with the user's catalog references is established by this release.

The three cells are sampled into 192 × 192 scalar arrays. Gallery meshes sample a 46-segment grid; close-up and GLB export meshes use 144 segments. Silhouette triangles connect to a back surface with edge walls. Empty background is omitted, normals are recomputed, and finite geometry/normals and actual GLB round trips are checked. The gallery keeps its existing overall geometry budget and distance culling.

Metal surfaces use physical anisotropy and a restrained clear coat. Models remain standalone geometry in exported GLBs; the atlas is not displayed as an image panel in the hallway.

- Source atlas: `apps/item-web/public/currency/relief-atlas-v4.png`
- Sampled data: `apps/item-web/lib/currency-relief-data.json`
- Model construction: `apps/item-web/lib/currency-sculpture.ts`
- Generation: built-in imagegen, one generation; no retries.

## Release evidence — 2026-09-09

- Problem observed: production `7a55a0e` represents facial and feather relief with simplified ellipsoid and stroke assemblies; the user explicitly requested continued source-detail improvement.
- User impact: portraits and heraldic motifs lose recognizable fine structure in close-up views and downloaded models.
- Smallest viable fix: finish the retained relief pass, replacing only Liberty-profile, eagle and Franklin motifs with sampled raised meshes, with matching gallery edition metadata and physical metal shading.
- Files changed: sculpture builder, sampled relief data, source atlas, gallery edition marker, sculpture verification, and this evidence record.
- Risk: authored brightness is not measured depth; fine engraving and source fidelity remain unverified. No browser visual comparison or mobile frame-rate measurement was performed for this release.
- Verification: typecheck, currency-library checks, sculpture checks and static production build passed. All 43 distinct gallery GLBs export and reload with matching bounds; four high-detail models also round-trip. Gallery total: 1,499,904 triangles, below the existing 1.5M budget. Joystick normalization, release stopping and frame-rate-independent response pass.
- Classification: AETIMM — bounded completion of the explicitly requested 3D-detail capability. This is user-directed feature work, not autonomous daily maintenance; the maintenance-only daily limits do not apply.
- Rollback: revert the relief-pass commits to restore the previous sculptural construction and gallery edition.

## Exact generation prompt

Use case: stylized-concept
Asset type: production grayscale bas-relief height-map atlas for sampling into actual 3D currency meshes.
Create ONE landscape image, 3072 by 1024 pixels or equivalent exact 3:1 aspect ratio, containing THREE EXACT EQUAL SQUARE CELLS left to right with invisible boundaries. Pure black background throughout.
Left square: neoclassical Liberty female head in right-facing profile, seven-ray crown, finely curled hair, neck and draped shoulder. No medallion.
Middle square: frontal heraldic American eagle with spread wings, shield on its breast, layered detailed feathers. No seal ring.
Right square: recognizable Benjamin Franklin bald head with side hair, slightly turned frontal portrait and coat shoulders. No oval frame.
Each isolated subject is centered in its own square, fully contained with at least 12 percent pure black margin at every edge of that square. No subject crosses the square boundaries. All three motifs use the same visual scale and equally precise organic sculptural detail.
Style and encoding: sculptor's orthographic bas-relief DEPTH/HEIGHT FIELD, not a photograph or shaded render. Pixel brightness represents actual raised height only: pure black is empty zero depth; dark gray is shallow engraving and smooth grayscale progressively builds raised anatomy to bright gray and near white on highest cheeks, noses, crown and wing ridges. Smooth volumetric depth transitions with crisp fine carved details. Do not encode directional illumination.
Avoid: lighting gradients, cast shadows, specular reflections, metallic shine, text, borders, labels, cell dividers, coin rims, color, scenery, frames, perspective, cropped motifs.
