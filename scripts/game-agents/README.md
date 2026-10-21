# AETIMM + APY0C: exactly two game-development identities

This extends ABYS with a durable proposal/review controller. It is not yet an unattended coding/deployment service. No inference runs until an operator configures credentials and explicitly runs a job. It does not affect gameplay frame loops.

- **AETIMM:** material engine, world construction, destruction, persistence, rendering continuity.
- **APY0C:** encounters, boss behavior, visual atmosphere, adversarial testing.
- Each reviews the other's proposal. Neither approves its own work. No planner, reviewer, helper or subagent identity exists in this controller.
- Scheduler, database, inference endpoint and CI are deterministic infrastructure, not additional agents. A model can change without changing identity.
- Narrative hostility never authorizes development sabotage. A human resolves disagreement; no third adjudicator is created.

## Implemented boundary

Identity allowlist, database identity constraints, pinned revision metadata, persistent event memory, serial worker lock, bounded context, timeout, strict JSON responses, cross-review and explicit blocked states. Peer acceptance means **ready for independent verification**, not verified or deployable. Evidence references can be wrong and must be checked. The operator supplies source context; revision metadata is not yet checked against a checkout.

The built-in adapter makes one cloud inference request with no tool calls. It validates an explicitly configured model against the live gateway catalog. A trusted custom inference adapter can replace it, but must remain a single-request model adapter and never delegate. An empty working directory is NOT an OS security sandbox; custom adapters inherit the runner environment and are trusted code. Run under a dedicated unprivileged account with only model credentials, no production credentials. This registry constrains this controller, not unrelated software elsewhere in the repository or host.

## Local operation

Python 3.10+; standard library only. Put the SQLite file on persistent private storage outside the repository. Back it up consistently using SQLite backup facilities. Set `AI_GATEWAY_API_KEY` through a secret manager and explicitly set `AETIMM_MODEL` and `APY0C_MODEL` (or shared `AI_GATEWAY_MODEL`) to current provider model IDs. Set a provider spending limit before inference. There is no automatic retry or scheduled spending.

```sh
python scripts/game-agents/controller.py --db /private/agent-state/game.sqlite enqueue --agent AETIMM --task 'Propose a bounded material coupon improvement' --revision EXACT_GIT_SHA --context /private/task-context.txt
python scripts/game-agents/controller.py --db /private/agent-state/game.sqlite run JOB_ID
# Run the same job again to request APY0C peer review:
python scripts/game-agents/controller.py --db /private/agent-state/game.sqlite run JOB_ID
python scripts/game-agents/controller.py --db /private/agent-state/game.sqlite status
python -m unittest discover -s scripts/game-agents -p 'test_*.py'
```

The parent database directory must exist. Optional `AETIMM_INFERENCE_ADAPTER` is an operator-controlled JSON array of absolute executable/script paths. Never populate it with model output. A rejected proposal becomes `needs_revision`; enqueue a new bounded task incorporating the review. A killed controller deliberately leaves its lock and running state. Stop and verify all workers are dead, back up the database, inspect events, then manually mark the interrupted job blocked and clear its lock. Do not blindly clear live locks.

## Next integration gate

Connect a disposable checkout with narrowly scoped edit/build/browser tools, independent test artifact collection and resource quotas. Apply a proposed patch only after verifying its base revision and permitted paths. Run game/physics tests and real-device performance captures; bind results to the exact commit. Expose that evidence to the peer. Only the existing human-authorized CI/PR merge process can publish. Do not grant either character permission to rewrite its constitution, weaken tests, access deployment secrets or spawn workers. Keep development autonomy separate from runtime NPC decisions.

## Hardware architecture

Recommended: cloud reasoning plus a strong game-development workstation, separate modest target devices, persistent SSD state and backups. Two identities do not require two GPUs. Local model hosting is optional; available VRAM, model/context size and measured quality determine whether a separate inference workstation is justified. Serialize benchmarks against heavy inference to avoid contaminated results. Model calls must never run at physics/render tick frequency.

## Change gate record

Problem: user requested two enduring agent identities able to help finish the game. Impact: bounded author/peer-review foundation, without runtime changes. Files: two identity prompts, controller, gateway adapter, tests and this document. Risk: API cost and untrusted proposed patches; mitigated by explicit invocation, no patch execution and independent verification. Rollback: remove these files; no game save or website schema change. Classification: explicitly requested isolated development infrastructure. Verification: six controller tests exercise identities, peer handoff, output validation, failure and locking. No live model inference, browser benchmark or autonomous deployment was performed.

## Opposing world-author doctrine

Both inference stages now load `agents/game/WORLD_DOCTRINE.md` before the identity-specific instructions. Both identities have equal whole-game proposal scope and opposite fictional purposes. Shared canon includes adaptive bodies, current palettes, builder-NPC construction and defeat-with-survival after the unique core-shot miss. These are instructions, not implemented game mechanics or additional tool permissions.

Change-gate record: user explicitly requested continued encoding of the sole opposing world authors. The prior prompts omitted their equal creative scope and updated campaign canon. Six files change: shared doctrine, both identity prompts, controller, tests and this README. Risk: prompt length and instruction changes can affect proposal quality; no game save or renderer changes. Rollback: revert this commit. Verification: eight controller tests, including both author/reviewer directions and missing-doctrine fail-closed behavior; no live inference or browser behavior claimed. Classification: REFINE prototype pending measured proposal quality and independent integration verification; do not merge as a live world-building capability. Explicit feature work exceeds the routine-maintenance file count.

Continuity-lore refinement: the shared doctrine now adapts the established AAA cycle, entropy/ITEM symbolism, memory and drift axioms, relic traditions and Library of Things into character motives, rebuilding traces and optional dialogue. Historical vocabulary is distinguished from newly proposed game scenes; unresolved terms remain unresolved. Source basis: supplied continuity history, retrieved prior continuity discussions, and `docs/item-artifact-brief-builder.md` for VMS roles. This is a game-facing adaptation, not a rewrite of ITEM canon. Both identities receive it through the existing shared-instruction loader. The same REFINE status and rollback apply; no lore scene or campaign mechanic is claimed live.
