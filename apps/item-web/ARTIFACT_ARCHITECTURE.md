# AETIMM Universal Artifact Architecture

## Permanent Artifact Covenant

Every submission is an **Artifact**.

An Artifact may contain one part or many ordered parts.

Every Artifact has one identity.

Every Artifact has one whole-work description that states its true nature, even when the ordinary uploader infers a safe default instead of asking the creator to write it.

Every Artifact follows one lifecycle regardless of media type.

```txt
ONE INTAKE
→ ONE ARTIFACT ID
→ ONE ORDERED MANIFEST
→ PRIVATE ATOMIC STAGING
→ PUBLIC UNJUDGED
→ SLOP / MUSEUM JUDGMENT
→ VOTE-PACED ACCESSION
→ PERMANENT MUSEUM COLLECTION
```

Exceptional moderation, abuse, integrity, legal, or technical failures may hold an Artifact before or after publication. Exceptional holds do not redefine the ordinary path and are not the Museum-admission mechanism.

The complexity belongs to the Artifact and the machinery underneath it—not to modality-specific product silos and not to more buttons.

---

## Surface Compression Law

The public product should tend toward:

```txt
SUBMIT

[ ARTIFACT ]

← SLOP      MUSEUM →

scroll
```

One action may open arbitrarily deep capability. Surface simplicity is sacred; architectural complexity is permitted.

The ordinary creator impulse is:

```txt
I have slop
→ add it
→ attest
→ THROW IT IN
```

Provenance, advanced descriptions, tool stacks, manifests, runtime details, security controls, storage, moderation, and preservation evidence remain available underneath or behind progressive disclosure.

---

## Artifact Envelope

The Artifact is the unit of identity, provenance, judgment, selection, lineage, and preservation.

Conceptually:

```txt
Artifact
├── id
├── creator
├── title
├── feed summary
├── true-nature description
├── modes[]
├── parts[]
├── provenance
├── lifecycle state
├── revision lineage
├── judgment evidence
└── Museum accession evidence
```

A file is not an Artifact merely because it was uploaded. A file is a **part** of an Artifact.

A text block is a part. A reference is a part. One JPEG can constitute a one-part Artifact. Five renders plus a PDF and an engineering note can constitute one seven-part Artifact.

---

## Semantic Form Neutrality

What an Artifact **means** is not the same thing as what media it contains.

A course, personal bot, business model, game, agent, research package, startup concept, novel, invented language, simulation, or machine-made system does not become a new product silo merely because humans give the work a new semantic name.

Those forms are compositions of the same Artifact materials and runtimes.

New machine creation does not automatically require a new feed, intake, identity model, or judgment system.

---

## Supported Mode Vocabulary

The shared architecture recognizes these modes:

```txt
image
video
audio
text
document
code
data
model3d
website
simulation
other
```

An Artifact can contain any supported combination. `mixed` describes the whole Artifact when multiple modes are present; it is not itself a part type.

Adding a future mode must extend the envelope. It must not create a second intake, second lifecycle, second curator authority model, or modality-specific public feed.

---

## Ordered Manifest

Every Artifact has an ordered manifest.

```txt
Artifact 7F...

00 · image     · front-render.png
01 · image     · reverse-render.png
02 · document  · engineering-notes.pdf
03 · text      · manufacturing rationale
04 · website   · external provenance reference
```

Order is meaningful presentation and provenance information.

The initial upload order is authoritative in Artifact Engine v1. Later folds may add creator-controlled reordering, labels, nested groups, or relationships while preserving immutable history.

A manifest must never silently lose a part because a renderer does not understand its modality.

---

## True-Nature Description

The Artifact description describes the complete work, not a thumbnail and not an individual file.

The system may safely infer a minimal description for the one-click path. Advanced creators may supply richer information describing materials, relationships, intended behavior, dependencies, machine contribution, human contribution, source/remix relationships, and runtime expectations.

A short feed summary may coexist with the true-nature description. They serve different purposes.

---

## Simple Case Must Stay Simple

Universal intake must not punish a creator uploading one ordinary image.

```txt
add one JPEG
→ system detects image
→ one-part Artifact manifest
→ creator attests
→ THROW IT IN
→ public Unjudged
```

The universal architecture is allowed to become sophisticated internally while the simple path remains obvious.

---

## Multi-Mode Intake Law

One work composed of multiple modes enters through one intake.

Examples:

```txt
image + text
image + PDF
images + engineering drawings + white paper
code + dataset
code + simulation description + video evidence
music + cover image + provenance text
3D model + renders + manufacturing specification
website reference + source archive + explanatory text
```

If the parts form one work, the default assumption is one Artifact.

Creators may submit genuinely independent works separately. The platform must not force artificial bundling merely because parts share a theme.

---

## Safety Boundary: Storage Is Not Execution

Universal acceptance does **not** imply universal execution.

Artifact Engine v1 treats uploaded unfamiliar or executable-capable material as inert evidence.

```txt
UPLOAD ≠ EXECUTE
REFERENCE ≠ FETCH
ARCHIVE ≠ EXTRACT
MODEL ≠ RENDER
CODE ≠ RUN
SIMULATION ≠ TRUST
```

Images may receive the first rich preview support. Other modes may initially render as safe manifest cards until trusted processors are folded in.

Future processors must preserve this boundary and receive their own threat models, resource limits, sanitization, capability gates, and sandboxing.

---

## One Lifecycle

No modality gets a privileged shortcut and ordinary publication does not require a human curator waiting room.

```txt
submit
→ bounded client validation
→ private atomic storage + manifest staging
→ server attestation / intake checks
→ public Unjudged
→ public Slop / Museum judgment
→ Museum votes accumulate
→ accession slot unlocks
→ highest-Museum-voted unaccessioned Artifact is accessioned
→ permanent Museum presentation
```

The private staging step exists only so half-built Artifacts cannot leak into public view. When automatic Unjudged publication is enabled, staging and promotion occur inside the same trusted submission transaction and are experienced by the creator as one action.

A persisted `quarantine` row is therefore **exceptional state**, not the ordinary lifecycle. Reports, technical failures, abuse controls, legal obligations, provenance concerns, or deliberate revision may create a private hold. Those holds are reviewed separately and never function as a Museum waiting room.

Neither complexity, technical sophistication, creator identity, nor Artifact mode permits direct upload into Museum presentation.

---

## Judgment Law: Independent Accumulators

The public ballot has exactly two active choices:

```txt
← SLOP        MUSEUM →
```

The database retains the internal spelling `preserve` for Museum compatibility, but the public concept is Museum.

For each `(artifact_id, voter_id)` there is at most one active judgment. Choosing the other side replaces the prior judgment. A person may also simply continue scrolling and never vote.

**No vote is silence.** It is not a neutral score and it does not add evidence.

Museum and Slop are independent signals:

```txt
Museum votes:  8,421
Slop votes:   12,004
```

There is no subtraction, net score, ratio, zero-sum normalization, or requirement that public opinion resolve the contradiction.

An Artifact may therefore be simultaneously:

```txt
MUSEUM-ACCESSIONED
and
TOP SLOP #1
```

That is valid evidence, not an inconsistent state.

---

## Top Slop Law

Slop may rank because the trough is intentionally temporal, competitive, filthy, and unserious.

`TOP SLOP #N` is derived **only from accumulated Slop votes** across public Artifacts. Museum votes never lower or raise Slop rank.

A mutable rank must not become the infinite-feed pagination cursor. Ranking is presentation metadata layered over a stable feed order so vote changes cannot make cards duplicate, disappear, or jump across cursor boundaries during a session.

The trough may later resurface highly ranked Slop near the top using bounded recommendation slots, but canonical feed addressability and pagination must remain stable.

---

## Feed Law

The Slop Feed consumes Artifacts, not images.

There is **one public discovery stream**. The user does not choose image feed, video feed, game feed, AI lane, provenance lane, or internal lifecycle lane before scrolling.

An Artifact without an image must remain a legitimate feed object.

When an image exists it may act as a lead visual preview. When no compatible preview exists, the feed must fall back to a mode-aware Artifact presentation rather than a broken image element.

The voting identity attaches to the Artifact ID. All parts of the same Artifact share that judgment surface.

In the trough, preservation and ridicule may be shown together. A Museum-accessioned Artifact can still wear a `TOP SLOP #N` scar and can continue receiving either public judgment.

---

## Museum Accession Law

The Museum does not maintain a live popularity leaderboard. It maintains **accessions**.

The first automatic admission rule is deliberately simple and hidden beneath the interface:

```txt
community Museum votes accrue across the trough
→ every 100 active Museum votes unlock one accession slot
→ choose the highest-Museum-voted Artifact not already accessioned
→ issue the next permanent accession number
```

`100` is operational configuration, not a user-facing concept. It may be tuned without changing the ballot or teaching users a new workflow.

The purpose of the global cadence is to make the Museum grow slower than the trough while still allowing public judgment—not a curator queue—to drive ordinary machine-content admission.

Museum votes cast for already-accessioned work continue to exist. They do not eject anything, and they may contribute to future accession capacity.

An accession records the Artifact identity, accession number, admission time, and vote evidence at admission. The accession record is the institutional source of truth. Legacy `artifacts.lane = 'aetimm'` may mirror that state for older presentation code but must never become the preservation authority.

---

## Museum Permanence and Withdrawal Law

Once accessioned, an Artifact cannot be removed, replaced, or deaccessioned by public voting.

A later wave of Slop votes cannot eject it. A creator cannot replace the accession with a different Artifact. A different Artifact receiving more Museum votes does not displace it.

Real institutions still require an exceptional response path for illegality, safety, court orders, rights failures, corrupted evidence, or severe integrity problems. Therefore AETIMM permits **administrative withdrawal**, not deletion:

```txt
ACCESSION
→ active Museum presentation
→ exceptional admin withdrawal, with reason
→ presentation removed
→ accession record remains as tombstone
```

Withdrawal requires authenticated administrative authority and a recorded reason. Ordinary users and ordinary votes have no path to this operation.

The Museum collection itself displays accessions by institutional identity and placement—not by competitive rank. Accession number is an archival address, not a score.

---

## Museum Presentation Law

Museum treatment and trough treatment are deliberately different views of the same Artifact.

The trough may be rough, temporal, ranked, scarred, and disposable-looking.

The Museum should use cases, rooms, shelves, accession plaques, spatial hierarchy, chronology, thematic relationships, provenance, and material-like presentation. It should feel as though machine-made work has crossed from disposable output into an institutional collection.

A Museum work can be an image, mixed-media work, proof, codebase, simulation, model, document, sound work, dataset, interactive system, or a future mode not yet invented.

Museum architecture may create modality-specific presentation techniques, but accession evidence remains attached to the same Artifact identity and lineage.

---

## Exceptional Hold Law

A private hold is not an aspirational state and not a Museum audition.

It exists only when ordinary immediate publication cannot safely or correctly proceed, or when an already-public Artifact requires exceptional intervention.

The curator/admin hold surface must therefore say what it is: an **exception queue** for safety, legal, integrity, provenance, revision, or technical cases.

Releasing a pre-publication hold returns the Artifact to public Unjudged. It never directly creates a Museum accession.

---

## Curator / Administrative Review Law

Human curator/admin machinery remains valuable for the exceptional cases where care, judgment, legal compliance, restoration, provenance analysis, or institutional withdrawal is actually needed.

That machinery reviews the Artifact, not merely its lead preview, and must expose whole-work description, detected modes, complete ordered manifest, safe previews where available, provenance, human role, attestations, lifecycle history, and relevant accession evidence.

A renderer being unavailable must be represented as an unavailable renderer—not as an absent part.

Ordinary machine-content Museum admission does not wait for a human curator.

---

## Revision and Lineage

Future revision folds must preserve identity and history.

The preferred shape is:

```txt
Artifact identity
├── revision 1
├── revision 2
├── revision 3
└── accession evidence
```

Replacing a file, editing text, changing order, or updating provenance must not erase prior evidence once versioned revision support is active.

A Museum accession must eventually pin an explicit preserved revision/runtime snapshot. Until full revision snapshots exist, approved public Artifacts should remain effectively immutable through ordinary creator controls.

---

## Architectural Prohibitions

Do not:

- restore an image-only primary intake;
- create independent upload products for every modality;
- create separate public modality feeds;
- assign a separate identity to every file in one coherent work;
- require an image for public feed existence;
- execute arbitrary submitted code during intake;
- automatically fetch user-submitted references during intake;
- silently unpack archives or run simulations;
- hide manifest parts that lack a rich renderer;
- turn Museum and Slop into a subtractive net score;
- exclude Museum-accessioned work from Top Slop eligibility;
- use mutable Slop rank as the canonical infinite-scroll cursor;
- turn Museum presentation into a ranked product leaderboard;
- make Museum candidacy private;
- require ordinary uploads to wait for curator publication;
- allow public votes to delete, replace, or withdraw a Museum accession;
- delete accession history during exceptional withdrawal;
- treat `artifacts.lane` as more authoritative than the accession registry;
- let a future UI rename turn the underlying Artifact model back into `image`.

---

## Extension Rule

When a new mode is introduced, the required question is:

> How does this mode become a part of an Artifact safely?

Not:

> How do we build a new product for this file type?

That distinction is the architectural fold.
