# ABYS Repo Configuration

ABYS is the execution machine. It converts intent into routed work, task packets, code, tests, workflows, deployments, dashboards, and measurable process improvements.

## Canonical boundary

ABYS accepts material that can terminate in at least one of:

- Codex-compatible task packet
- executable code
- schema
- test
- CI workflow
- deployment scaffold
- product dashboard
- implementation issue or PR
- reusable execution pattern
- postmortem or run log that improves future execution

ABYS rejects or redirects material that remains purely symbolic, purely speculative, or non-executable.

## Preferred structure

```txt
/intake             raw user/project intents
/router             routing decisions across ITEM, ABYS, and SYNTEL
/tasks              Codex-compatible task packets
/src                executable reference implementations and tools
/tests              schema, workflow, and code validation
/runs               execution logs and postmortems
/patterns           reusable successful workflows
/rejected           non-executable ideas redirected or killed
/schemas            task and workflow schemas
/docs               operating rules and execution doctrine
```

## Execution gate

An ABYS task cannot be accepted unless it states:

1. objective
2. repository target
3. assumptions
4. inputs
5. outputs
6. executable steps
7. validation method
8. risk/blocker notes
9. completion definition
10. next recursive improvement opportunity

## Canon-vs-slop critique

Canon in ABYS is repeatable execution.

Slop in ABYS is language that sounds strategic but produces no file, issue, schema, test, PR, deployment, or decision.

## Routing

- Artifact doctrine, canonical object records, symbolic/economic item specs: route to `injammed/ITEM`.
- Agent-to-agent protocol, signed envelopes, capability discovery, task contracts, audit receipts: route to `injammed/SYNTEL`.
- Product execution, task routing, code, tests, workflows, and Codex packets: keep in ABYS.

## Deletion/refactor rule

If a concept cannot produce an executable next action, compress it into a task packet, redirect it to ITEM/SYNTEL, or reject it into `/rejected` with a reason.
