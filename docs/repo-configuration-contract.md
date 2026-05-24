# ABYS Repository Configuration Contract

## Role

ABYS is the execution machine: the repository where intent becomes buildable software, tests, task packets, workflows, dashboards, and deployable infrastructure.

ABYS should not become a mythology archive or a protocol whitepaper dump. Its job is to terminate ideas in execution.

## Preserve

Preserve material that does at least one of the following:

- Produces code, architecture, tests, CI, deployment scaffolds, issue templates, Codex-compatible task packets, or operational workflows.
- Improves intake routing from idea to issue to branch to PR.
- Turns ITEM artifacts into implementation requirements without absorbing ITEM doctrine.
- Turns SYNTEL protocol claims into reference implementations, validators, mocks, harnesses, or simulations without owning the protocol canon.
- Increases execution velocity, maintainability, persistence, or economic usefulness.

## Reinforce

Strong ABYS material should be upgraded into one of these forms:

1. Executable code in `/src`.
2. Test coverage in `/tests`.
3. Task packet schema in `/schemas`.
4. Build/run documentation in `/docs`.
5. Example workflow in `/examples`.
6. CI or automation in `.github/workflows`.
7. Issue/PR template in `.github`.

## Flag or discard

Flag weak material when it is:

- Conceptual prose that does not produce a next executable action.
- Agent-orchestration language without routing, state, evaluation, or output contracts.
- Product speculation without users, inputs, outputs, constraints, economics, or deployment path.
- Recursive-improvement language without a measurable loop.
- Codex references without files, tests, acceptance criteria, or patch instructions.

Discard, compress, or reroute anything that cannot become a task, test, file, workflow, or decision.

## Execution test

A proposed ABYS addition passes only if it answers:

- What is being built?
- What file or system changes?
- What is the smallest executable next action?
- What are the acceptance criteria?
- What can fail?
- What repository owns the upstream doctrine or protocol?

## Boundary rule

- ITEM defines artifacts and canon.
- ABYS builds and validates execution machinery.
- SYNTEL defines inter-agent / interenterprise communication protocol.

If a file is mainly artifact doctrine, move it to ITEM.
If a file is mainly protocol specification, move it to SYNTEL.
If a file is mainly implementation, keep it in ABYS.

## Immediate refactor targets

1. Add a canonical task-packet schema.
2. Add an intake router that classifies work into ITEM, ABYS, or SYNTEL.
3. Add issue templates for build tasks, refactors, and canon/slop triage.
4. Add a minimal validation test suite for task packets and routing decisions.
5. Convert vague product-development doctrine into executable workflows.
