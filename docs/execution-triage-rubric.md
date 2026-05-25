# ABYS Execution Triage Rubric

## Purpose

This rubric prevents ABYS from becoming an abstract agent manifesto. ABYS only keeps material that can terminate in execution: code, task packets, tests, workflows, schemas, dashboards, deployment, or measurable process improvement.

## Scoring model

Score each ABYS fragment from 0-2 in each category.

| Category | 0 | 1 | 2 |
| --- | --- | --- | --- |
| Executable target | No file/system target | Target implied | Exact file, module, workflow, issue, PR, test, or deployment named |
| Input/output clarity | Undefined | Partial input/output | Clear inputs, outputs, states, and owner repo |
| Acceptance criteria | None | Subjective | Objective pass/fail criteria and test command |
| Routing discipline | Absorbs all domains | Mostly routed | Clearly separates ITEM canon, ABYS execution, SYNTEL protocol |
| Economic/product usefulness | Vague productivity claim | Plausible usefulness | Named user, workflow, cost/time reduction, or revenue path |
| Recursive improvement | Empty recursion language | Improvement implied | Measurable feedback loop with state preservation |

## Decision thresholds

- 10-12: implement in `/src`, `/tests`, `.github`, `/schemas`, or executable `/docs` workflow.
- 7-9: convert into a Codex-compatible task packet.
- 4-6: compress into an issue or reroute to ITEM/SYNTEL.
- 0-3: delete or archive as non-executable prose.

## Hard fail conditions

A fragment fails immediately if it:

- Says agents should work without specifying inputs, outputs, routing, state, evaluation, or persistence.
- Mentions Codex without naming files, tests, acceptance criteria, and patch instructions.
- Describes a product without a user, workflow, economic reason, deployment target, or failure mode.
- Imports ITEM mythology instead of consuming ITEM artifact records.
- Defines protocol authority that belongs in SYNTEL.

## Upgrade pattern

Every salvageable ABYS fragment should be rewritten into this minimum task packet:

```md
# Task name

## Objective
What concrete execution outcome should exist after the task?

## Owner repo
ABYS unless explicitly routed elsewhere.

## Inputs
What artifact, protocol spec, user request, or existing file starts the task?

## Target files
Which files, directories, tests, workflows, or docs change?

## Implementation steps
Smallest executable sequence.

## Acceptance criteria
What proves the task is done?

## Test command
What command validates it?

## Risks/blockers
What can fail?

## Next recursive improvement
What should be measured and improved next?
```

## Better configuration ruling

ABYS should be the middle engine between canon and protocol: it consumes ITEM records, consumes SYNTEL specs, and produces working software. Its higher capability comes from refusing prose that does not mutate the repo into a more useful machine.
