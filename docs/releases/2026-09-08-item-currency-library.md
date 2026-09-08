# ITEM currency library — owner-directed release

Classification: AETIMM, requested product capability.

## Evidence and authorization
The owner requested all three: searchable catalog, walkable 3D library and the currency Museum; both evidence-led and speculative forecasts for 2027–2040. The latest explicit clarification places the library within SHOP so UPLOAD / SCROLL / VOTE / SHOP remain unaffected. This is directed product development rather than the autonomous maintenance budget.

## Scope and resulting behavior
- `/shop/` opens the library and retains the existing $10 digital edition, checkout and concept-only sports-car section below it.
- `/aetimm/` displays the same currency-only library.
- Root source, uploaded feed, navigation, authentication, voting, checkout URL and all database rules are unchanged.
- A real Three.js room supports walking, turning and selecting exhibits. Image-backed appearance and an independent HTML catalog remain available when WebGL is unavailable.
- Ten uniquely identified concepts, eight national perspectives, searchable/filterable records, 14 annual entries with three conditional paths, evidence notes, original plates and a downloadable preparation brief.
- Claims in AI artwork are not promoted into validated specifications, legal tender or government adoption. All national participation is speculative. Source guidance is linked; forecasts are authored planning scenarios, not calibrated probability estimates.

## Files and dependency rationale
CurrencyMuseum, CurrencyWalk, CSS, typed catalog, ten unchanged source images and a preparation brief are added. Shop and Museum compose the library. Three.js is the single new runtime dependency needed for the requested walkthrough. Its types and a lockfile accompany it. Existing Museum presentation assertions are updated for the explicit replacement; backend lifecycle/security assertions remain intact. A new currency-library gate runs in preview and production workflows.

## Validation
- Typecheck passed without Supabase environment variables.
- Production static build passed for all nine generated pages.
- All 22 existing verify scripts passed; the new currency-library gate passed.
- Data check covers unique records, complete 2027–2040 paths, local provenance images, Shop placement and unchanged feed/checkout boundaries.
- Diff whitespace check passed.
- Browser/visual QA was not requested and was not performed. Walkthrough appearance and touch behavior still need user-device confirmation; the catalog remains independent of WebGL.

## Risks and rollback
The Museum's previous general Summit/Collection presentation is replaced as explicitly requested; existing accession records and backend logic are untouched. Long-range adoption is uncertain and includes stalled/no-adoption paths. Original concept plates retain historical unverified claims, identified as such in the exhibit and evidence notes. Three.js adds a deferred client bundle. Revert this release commit to return Shop/Museum to the prior presentation; no data migration is involved.

Previous production reference: 1aba617 (spatial gallery release #156).
