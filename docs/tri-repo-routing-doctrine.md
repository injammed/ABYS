# Tri-Repo Routing Doctrine: ITEM / ABYS / SYNTEL

## Purpose

This doctrine defines the better configuration for the three repositories. The repos should not compete for meaning. They should form a directional system:

```txt
ITEM  ->  ABYS  ->  SYNTEL
canon     execution  protocol
```

ITEM preserves durable artifacts. ABYS turns selected material into executable systems. SYNTEL transmits bounded, auditable coordination between agents and organizations.

## Repository roles

### ITEM: artifact canon

ITEM owns symbolic object doctrine, artifact records, preservation logic, visual/physical/narrative specifications, denominations, museum rooms, and canon-vs-slop adjudication.

ITEM does not own implementation workflows, agent orchestration, protocol authority, or settlement rails.

### ABYS: execution machine

ABYS owns task packets, code, tests, CI, dashboards, reference tools, Codex-compatible execution packets, product workflows, validation harnesses, and recursive process improvement.

ABYS does not own ITEM mythology or SYNTEL protocol authority. It consumes those inputs and produces runnable artifacts.

### SYNTEL: coordination rail

SYNTEL owns agent identity, signed envelopes, capability discovery, bounded intent negotiation, task contract formats, verification receipts, audit replay, and human escalation hooks.

SYNTEL does not own artifact meaning or implementation workflow. It specifies what must be transmitted and verified.

## Handoff law

Every durable cross-repo object must have one primary owner and explicit handoffs.

- ITEM -> ABYS: artifact record becomes render, validator, product spec, manufacturing spec, interface, or test fixture.
- ITEM -> SYNTEL: artifact record becomes structured payload, registry entry, receipt attachment, or identity-linked object reference.
- SYNTEL -> ABYS: protocol element becomes validator, mock server, client, integration test, replay tool, or reference implementation.
- ABYS -> ITEM: execution result may create a new artifact candidate only when the output has durable symbolic/object value.
- ABYS -> SYNTEL: implementation experience may propose protocol revisions only through test failures, state-machine gaps, or audit defects.
- SYNTEL -> ITEM: protocol payloads may carry ITEM records but must not import ITEM doctrine into protocol core.

## Canon-vs-slop deletion rules

Delete, deprecate, or refactor material that does any of the following:

1. Uses grand language without a concrete artifact, executable target, or protocol contract.
2. Treats ITEM, ABYS, and SYNTEL as interchangeable names for the same abstraction.
3. Claims autonomy without identity, authorization, audit, bounded action, and human interruption.
4. Claims execution without files, tests, acceptance criteria, and owner repo.
5. Claims preservation without provenance, decay threat, maintenance rule, and review cadence.
6. Describes markets, tokens, settlement, or economies before identity, bounded contracts, receipts, and audit exist.

## Promotion rules

Promote material only when it passes the owning repo's rubric.

- ITEM promotion requires object definition, preservation function, anti-entropy mechanism, canon utility, boundary clarity, and provenance.
- ABYS promotion requires executable target, input/output clarity, acceptance criteria, routing discipline, product usefulness, and recursive improvement.
- SYNTEL promotion requires party definition, identity/auth, message shape, constraint boundary, verification/audit, and repo boundary.

## Better configuration ruling

The stronger architecture is not a monorepo and not three isolated idea bins. It is a staged system:

1. ITEM compresses meaning into durable records.
2. ABYS converts records and specs into executable work.
3. SYNTEL gives agents a safe rail for transmitting intent, obligation, proof, and receipt.

The repositories should expand capability by becoming stricter, not louder.
