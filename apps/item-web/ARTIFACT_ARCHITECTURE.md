# AETIMM Universal Artifact Architecture

## Permanent Artifact Covenant

Every submission is an **Artifact**.

An Artifact may contain one part or many ordered parts.

Every Artifact has one identity.

Every Artifact has one whole-work description that states its true nature.

Every Artifact follows one lifecycle regardless of media type.

```txt
ONE INTAKE
→ ONE ARTIFACT ID
→ ONE TRUE-NATURE DESCRIPTION
→ ONE ORDERED MANIFEST
→ PRIVATE QUARANTINE
→ REVIEW / REVISION
→ PUBLIC UNJUDGED
→ JUDGMENT
→ SELECTION
→ MUSEUM
```

The complexity belongs to the Artifact, not to the uploader and not to separate modality-specific product silos.

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

A text block is a part.

A reference is a part.

One JPEG can constitute a one-part Artifact. Five renders plus a PDF and an engineering note can constitute one seven-part Artifact.

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

Adding a future mode must extend the envelope. It must not create a second intake, second lifecycle, second curator authority model, or second Museum admission system.

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

It should answer, where relevant:

- What is this Artifact?
- What modes does it contain?
- How do the parts relate?
- What is intended to happen when the Artifact is experienced or executed elsewhere?
- What dependencies or assumptions matter?
- What did the machine do?
- What did humans do?
- What source/remix/plagiarism relationships should a reviewer know?
- What should a curator understand before judging the work?

A short feed summary may coexist with the true-nature description. They serve different purposes.

---

## Simple Case Must Stay Simple

Universal intake must not punish a creator uploading one ordinary image.

```txt
choose one JPEG
→ system detects image
→ one-part Artifact manifest
→ creator describes it
→ submit
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
music + cover image + lyrics/provenance text
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

Future processors must preserve this boundary and receive their own threat models, resource limits, sanitization, and sandboxing.

---

## One Lifecycle

No modality gets a privileged shortcut.

```txt
submit
→ quarantine
→ revision if necessary
→ curator approval
→ Unjudged
→ public voting
→ algorithmic nomination
→ selection review
→ Museum admission
```

First publication from quarantine enters **Unjudged**.

Neither complexity, technical sophistication, creator identity, nor artifact mode permits direct quarantine-to-Museum admission.

---

## Curator Review Law

Curators judge the Artifact, not merely its lead preview.

The curator surface must expose:

- whole-work description;
- detected modes;
- complete ordered manifest;
- safe previews where available;
- provenance;
- human role;
- attestations;
- lifecycle history.

A renderer being unavailable must be represented as an unavailable renderer—not as an absent part.

---

## Feed Law

The Slop Feed consumes Artifacts, not images.

An Artifact without an image must remain a legitimate feed object.

When an image exists it may act as a lead visual preview. When no compatible preview exists, the feed must fall back to a mode-aware Artifact presentation rather than a broken image element.

The voting identity attaches to the Artifact ID. All parts of the same Artifact share that judgment surface.

---

## Museum Law

The Museum admits Artifacts.

A Museum work can therefore be an image, mixed-media work, proof, codebase, simulation, model, document, sound work, dataset, interactive system, or a future mode not yet invented.

Museum architecture may create modality-specific rooms and presentation techniques, but admission evidence remains attached to the same Artifact identity and lineage.

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
- assign a separate identity to every file in one coherent work;
- require an image for public feed existence;
- execute arbitrary submitted code during intake;
- automatically fetch user-submitted references during intake;
- silently unpack archives or run simulations;
- hide manifest parts that lack a rich renderer;
- let first-pass quarantine review publish directly to the Museum;
- let a future UI rename turn the underlying Artifact model back into `image`.

---

## Extension Rule

When a new mode is introduced, the required question is:

> How does this mode become a part of an Artifact safely?

Not:

> How do we build a new product for this file type?

That distinction is the architectural fold.
