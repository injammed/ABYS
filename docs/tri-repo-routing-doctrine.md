# Tri-Repo Routing Doctrine

ABYS is the central execution router for ITEM, ABYS, and SYNTEL.

It does not make every concept executable. It classifies, packetizes, validates, decomposes, or holds work until the next action is bounded.

## Route Outputs

The deterministic router may emit only:

```txt
ABYS | ITEM | SYNTEL | split | hold_for_review
```

## Repository Roles

| Repo | Role | ABYS action |
|---|---|---|
| ITEM | Artifact canon foundry | Convert artifact-bound work into canon/candidate task packets. |
| ABYS | Execution machine | Convert implementation-bound work into files, tests, docs, workflows, and PRs. |
| SYNTEL | Signed A2A/M2M coordination protocol | Convert protocol-bound work into specs, schemas, examples, receipts, and replay tests. |

## Execution Gate

ABYS may execute only when a task has:

- target route
- objective
- files or artifacts to change
- validation command or test expectation
- terminal output type
- risk/blocker statement
- next recursive improvement

## Split Rule

Cross-boundary work must be decomposed before execution. A single packet may coordinate handoff, but it must not merge artifact canon, product runtime, and protocol semantics into one active doctrine file.

## Hold Rule

Vague mythic material, unbounded autonomy claims, and atmosphere-only concepts route to `hold_for_review`. A held item can become executable only after a human or follow-up task supplies concrete files, schemas, tests, or artifact records.

## Authalien Rule

Authalien may target future A2A/M2M coordination, but routing stays staged:

1. ITEM defines candidate artifact records.
2. ABYS validates candidate records and route decisions.
3. SYNTEL carries only signed, auditable, replayable payload references.

Authalien never bypasses `split` or `hold_for_review` just because it is protocol-adjacent.
