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
→ LATER SELECTION / PRESERVATION
→ MUSEUM PRESENTATION
```

Exceptional moderation, abuse, integrity, or technical failures may hold an Artifact before or after publication. Exceptional holds do not redefine the ordinary path.

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

Provenance, advanced descriptions, tool stacks, manifests, runtime details, security controls, storage, moderation, and publication evidence remain available underneath or behind progressive disclosure.

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
└── selection / Museum evidence
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
→ public judgment
→ later selection / preservation
→ Museum presentation
```

The private staging step exists so half-built Artifacts cannot leak into public view. When automatic Unjudged publication is enabled, staging and promotion occur within the same trusted submission transaction.

Moderation, reports, technical failures, abuse controls, legal obligations, or provenance concerns may route an Artifact into an exceptional private hold. Curators remain available for those exceptions and for later Museum selection; they are not the ordinary feed gate.

Neither complexity, technical sophistication, creator identity, nor Artifact mode permits direct upload into Museum presentation.

---

## Judgment Law: Independent Accumulators

The public ballot has exactly two active choices:

```txt
← SLOP        MUSEUM →
```

The database may retain the historical internal spelling `preserve` for Museum compatibility, but the public concept is Museum.

For each `(artifact_id, voter_id)` there is at most one active judgment. Choosing the other side replaces the prior judgment. A person may also simply continue scrolling and never vote.

**No vote is silence.** It is not a neutral score and it does not add evidence.

Museum and Slop are independent upward accumulators:

```txt
Museum votes:  8,421
Slop votes:   12,004
```

There is no subtraction, net score, ratio, zero-sum normalization, or requirement that public opinion resolve the contradiction.

An Artifact may therefore be simultaneously:

```txt
MUSEUM-ADMITTED
and
TOP SLOP #1
```

That is valid evidence, not an inconsistent state.

Legacy `refine` judgments are historical neutral rows. New public voting does not create them.

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

In the trough, preservation and ridicule may be shown together. A Museum-admitted Artifact can still wear a `TOP SLOP #N` scar in the feed.

---

## Museum Law

The Museum admits and presents Artifacts.

Museum admission does **not** erase Slop votes, Slop rank history, or contradictory public judgment. It changes presentation and preservation treatment.

The Museum itself is not a product leaderboard. It should use rooms, placement, accession, cases, spatial hierarchy, chronology, thematic relationships, provenance, and curatorial presentation rather than `#1`, `#2`, `#3` competitive ranking.

A Museum work can therefore be an image, mixed-media work, proof, codebase, simulation, model, document, sound work, dataset, interactive system, or a future mode not yet invented.

Museum architecture may create modality-specific rooms and presentation techniques, but admission evidence remains attached to the same Artifact identity and lineage.

---

## Curator Review Law

Curators review the Artifact, not merely its lead preview.

Curator machinery serves exceptional holds, abuse/provenance review, restoration, and later preservation/selection decisions. It must expose whole-work description, detected modes, complete ordered manifest, safe previews where available, provenance, human role, attestations, and lifecycle history.

A renderer being unavailable must be represented as an unavailable renderer—not as an absent part.

---

## Revision and Lineage

Future revision folds must preserve identity and history.

The preferred shape is:

```txt
Artifact identity
├── revision 1
├── revision 2
├── revision 3
└── selected / Museum revision
```

Replacing a file, editing text, changing order, or updating provenance must not erase prior evidence once versioned revision support is active.

Artifact Engine v1 establishes the envelope; later folds deepen versioning without changing the identity primitive.

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
- exclude Museum-admitted work from Top Slop eligibility;
- use mutable Slop rank as the canonical infinite-scroll cursor;
- turn Museum presentation into a ranked product leaderboard;
- let a future UI rename turn the underlying Artifact model back into `image`.

---

## Extension Rule

When a new mode is introduced, the required question is:

> How does this mode become a part of an Artifact safely?

Not:

> How do we build a new product for this file type?

That distinction is the architectural fold.
