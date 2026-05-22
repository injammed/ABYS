# ABYS Intake Routing

ABYS exists to terminate concepts in executable work: issues, PRs, code, schemas, tests, workflows, deployments, dashboards, and measurable business improvements.

A concept is not ABYS-ready until it can be expressed as a task packet with an objective, assumptions, routing decision, deliverables, Codex actions, validation, risks, and recursive improvement steps.

## Repository routing

Route work to `injammed/ITEM` when the core output is an artifact record, canon decision, physical/digital/narrative object specification, anti-entropy object doctrine, or canon-vs-slop review.

Route work to `injammed/ABYS` when the core output is execution infrastructure: task packets, product-development workflows, repo automation, schemas, CI, tests, implementation scaffolds, business pipelines, or Codex-compatible build steps.

Route work to `injammed/SYNTEL` when the core output is machine-to-machine or agent-to-agent protocol infrastructure: identity registry, signed envelope, capability discovery, bounded negotiation, task contract, verification receipt, audit replay, or human escalation hooks.

## Slop rejection rules

Reject or quarantine ABYS work when it is only motivational language, repository mythology, duplicate doctrine, or a plan without files to create/edit and tests to run.

A valid ABYS task packet must answer:

1. What repository should change?
2. What files should be created, edited, deleted, or tested?
3. What command proves the work is valid?
4. What acceptance criteria close the loop?
5. What becomes easier in the next recursive cycle?

## Current v0 primitive

The v0 ABYS primitive is `schemas/abys-task-packet.schema.json`.

Use it before opening implementation work so concepts arrive as bounded execution packets rather than prose sprawl.

## Example local validation

```bash
python -m pip install -r requirements-dev.txt
python -m pytest tests/test_task_packet_schema.py
```

## Handoff discipline

ABYS may reference ITEM and SYNTEL, but it should not absorb their domain content. ABYS should produce the queue, task packet, workflow, or validation harness that lets the correct repository receive the right work.
