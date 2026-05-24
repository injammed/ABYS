# ABYS Incubation Council

The incubation council converts conceptual systems into deployable infrastructure. Its job is not to admire concepts. Its job is to select, route, harden, validate, and terminate work in repository actions.

## Repository jurisdictions

- `ITEM`: artifact canon, anti-entropy doctrine, symbolic objects, candidate records, canon promotion, deprecation, and deletion provenance.
- `ABYS`: execution engine, product-development intelligence, task packets, code, tests, workflows, issues, PR scaffolds, and recursive improvement loops.
- `SYNTEL`: signed agent communication, message envelopes, capability discovery, bounded negotiation, receipts, audit trails, and escalation hooks.

## Council roles

### 1. Canon Curator

Decides whether material is durable enough to preserve. Routes strong symbolic material to ITEM and weak symbolic material to refinement, deprecation, or deletion.

### 2. Execution Architect

Converts valuable material into ABYS task packets, code paths, tests, issues, workflows, and deployment steps.

### 3. Protocol Steward

Routes inter-agent coordination material to SYNTEL. Ensures agent messages are bounded, auditable, signed, and compatible with human escalation.

### 4. Slop Auditor

Flags redundancy, overextended mythology, vague futurism, duplicate concepts, and material with no implementation surface.

### 5. Recursive Maintainer

Preserves successful patterns as templates, validators, docs, examples, and CI rules.

## Selection classes

- `preserve`: keep as durable material and improve surrounding infrastructure.
- `refine`: valuable but incomplete; compress into schema-compatible form.
- `redirect`: belongs in another repository.
- `deprecate`: historically useful but superseded or weak.
- `delete`: no longer valuable, duplicative, unsafe, or obstructive.

## Terminal outputs

Every council pass must end in at least one of the following:

- documentation edit
- issue
- schema
- code file
- test
- workflow
- pull request
- deployment step
- deletion candidate

## Intake rule

A concept cannot remain as vibe. It must become one of:

1. an ITEM artifact record,
2. an ABYS task packet,
3. a SYNTEL signed envelope or protocol spec,
4. a documented rejection/deprecation/deletion candidate.

## Promotion rule

A candidate is promotion-ready only when it has:

- stable identity,
- clear objective,
- explicit preservation or execution value,
- schema-compatible fields,
- at least one implementation path,
- validation criteria,
- routing decision,
- next recursive improvement.

## Anti-slop checks

Reject or compress material that has any of these defects:

- dramatic language with no file, schema, code, test, or workflow path,
- duplicate doctrine without new structure,
- concepts that route ambiguously across all repositories,
- artifacts that cannot survive concise documentation,
- protocols that cannot be audited,
- task packets that do not terminate in executable action.

## Operating loop

```txt
intake concept
→ classify preserve/refine/redirect/deprecate/delete
→ route to ITEM/ABYS/SYNTEL
→ normalize against schema
→ create task packet or protocol envelope
→ implement file/issue/test/workflow
→ validate
→ preserve successful pattern
→ recurse
```

## First validator target

The first automation target is a schema validator that checks:

- `ITEM/candidates/*.json` against `ITEM/schemas/item-artifact.schema.json`,
- `ABYS/examples/*.json` against `ABYS/schemas/task-packet.schema.json`,
- `SYNTEL/examples/*.json` against `SYNTEL/schemas/signed-envelope.schema.json`.

The validator should fail loudly when a concept cannot be routed or validated.
