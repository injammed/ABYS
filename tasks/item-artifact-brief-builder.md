# Task Packet: ITEM Artifact Brief Builder

## Objective
Build an ABYS workflow that converts ITEM doctrine records into structured artifact briefs.

## Inputs
- source ITEM candidate
- VMS class: Vacuo, Mute, or Singulus
- unit name
- denomination relation
- substrate
- use case
- issuance logic
- anti-entropy claim
- visual constraints

## Outputs
- normalized design brief
- metadata JSON
- validation checklist
- render-prompt template
- preview-card specification

## Required implementation files
- `schemas/item-artifact-brief.schema.json`
- `examples/vacuo-brief.example.json`
- `examples/mute-brief.example.json`
- `examples/singulus-brief.example.json`
- `docs/item-artifact-brief-builder.md`

## Execution steps
1. Define the schema.
2. Define VMS-to-visual mapping rules.
3. Add three valid example briefs.
4. Add validation rules for missing semantics, duplicate denomination logic, and generic visuals.
5. Document the workflow from ITEM candidate to ABYS brief to render-ready output.

## Validation failures
Reject a brief when:
- `vms_class` is missing.
- `issuance_logic` is missing.
- `denomination_relation` is missing.
- `visual_grammar` is generic.
- the object cannot be explained as a value transformation.

## Completion definition
ABYS can transform a structured ITEM candidate into a design brief that is ready for rendering or review.
