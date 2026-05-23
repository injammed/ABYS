# ITEM Artifact Brief Builder

## Purpose

The ITEM Artifact Brief Builder is the ABYS execution layer for converting ITEM currency ontology into structured, reviewable, render-ready briefs.

ABYS does not decide ITEM canon. ABYS operationalizes ITEM candidates so they can be validated, rendered, compared, rejected, or promoted.

## Workflow

```txt
ITEM candidate
→ ABYS artifact brief
→ schema validation
→ render prompt / metadata / preview card
→ ITEM review
→ canon, refactor, or rejection
```

## Required source material

A valid input should reference:

- ACCRE–ITEM Currency Handshake
- VMS class: Vacuo, Mute, or Singulus
- denomination relation
- issuance logic
- anti-entropy claim
- visual grammar
- veto risks

## VMS Mapping Table

| VMS class | Semantic role | Visual direction |
| --- | --- | --- |
| Vacuo | Scarcity to memory | black-gold, dense, archival, restrained radiance |
| Mute | Memory to exchange | silver-blue, transmissive, conduit-like, networked |
| Singulus | Exchange to scarcity | solar-gold, sealed, ceremonial, singular event logic |

## Output discipline

Each generated brief must be useful to both humans and machines. It should be readable as a design brief and validate as structured JSON.

## Rejection rule

Reject or return for refactor when:

- the VMS class is absent
- issuance logic is absent
- the denomination relation is unclear
- visual grammar is generic
- the artifact cannot be explained as a value transformation
- the output sounds like a public token launch rather than an ITEM artifact

## Codex execution target

A later implementation should add a CLI or script that:

1. reads a JSON artifact brief
2. validates it against `schemas/item-artifact-brief.schema.json`
3. emits a normalized markdown design brief
4. emits a render prompt
5. emits a review checklist
