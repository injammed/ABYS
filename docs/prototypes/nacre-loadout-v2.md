# Nacre loadout revision

Problem: minigun cyborg reference and model no longer match the user's revised sheet.
User impact: Nacre keeps the same roster/save ID with the new reference and equipment labels. Model includes right shoulder six-barrel minigun, left shoulder swarm launcher, left forearm inline white-hot spear and right forearm green laser housing. The permanent signature is now labelled White-hot forearm spear and has an integrated first-person silhouette; existing ten-tier progression remains.
Evidence: user image 7A14AD41-169C-4A1F-89A5-55EF9464733E.jpeg. Optimized new asset uses a versioned URL to avoid cached old art.
Smallest fix/files: character-loadouts, character-models, scavenge-world, signature-weapons, new reference WebP, this record.
Limits: procedural geometry is a simplified interpretation. Shoulder weapons and green forearm gun are visual mounts, not independently fireable abilities in this revision. No new real-world weapon engineering. No manual browser QA available in this managed environment.
Verification: loadout, signature/scavenging and survival regressions; TypeScript and static export. Resolve geometry batching compatibility before publish. No dependencies, auth/backend or route changes.
Risk/rollback: modest added mesh complexity; revert this commit. Save IDs and numerical combat balance unchanged.
Classification: AETIMM — direct user-requested bounded asset/model update; publish after CI.
