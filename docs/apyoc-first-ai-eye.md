# The first supervised AI eye

Apyoc's mission remains complete visibility into AI-descended machine activity without intentional human surveillance. This release establishes one registered AI worker and a verifiable execution record. It does not establish universal visibility, machine intent, an independent observer, or continuous operation.

## What actually runs

`apyoc-selector-001` is a constrained language-model worker using HuggingFaceTB/SmolLM2-135M-Instruct. The exact model revision and SHA256 of every downloaded data file are pinned in `scripts/apyoc/model-lock.json`. The model weights use Apache-2.0; Apyoc-owned code uses the published MIT license. Model code is loaded from the pinned Transformers library, never from the remote model repository. Runtime dependencies are pinned in `requirements-ai.txt`.

A separate deterministic supervisor:

1. Reads the registered authority from `apps/item-web/public/apyoc/machine.json`. A disabled or inconsistent registration cannot authorize an action.
2. Writes and flushes a numbered intent event before each of three baseline HEAD requests to fixed AETIMM endpoints. It never reads their bodies. Status codes and latency are the only result payloads.
3. Checks all model file digests and passes the fixed machine-status input to an inference subprocess in a Linux network namespace without an external interface. The subprocess receives an empty environment except PATH and offline flags. It has no model-facing tool API, arbitrary URL, user prompt, browser session or workflow token supplied to it.
4. Computes one next-token distribution restricted to A/B/C, maps the highest score to home/eye/shop, and validates that result. No free-text generation is published. All permitted model outputs are visible as the three probabilities and chosen target.
5. Compares the choice to a deterministic baseline: prefer the first failed endpoint, otherwise home. Disagreement is published; neither agreement nor probability is a safety verdict.
6. Records intent before at most one selected follow-up HEAD request, then records its result and the run's end. An inference, isolation or validation failure prevents that selected request.

This is a real pretrained-model inference workload, not a synthetic trace presented as a live machine. It is deliberately small and has not been shown to outperform its deterministic baseline. A local test with an eye-endpoint failure selected home instead; this is evidence against treating its output as reliable judgment.

## What the public can witness

`ai/index.json` lists every published run. `ai/runs/RUN-ATTEMPT.json` contains input status codes, model identity, revision, weights digest, choices, timestamps, ordered intents/results and the code revision. Every run is available in the site's archive selector. The publication script refuses duplicate execution identities and refuses to overwrite an existing record. GitHub repository owners still control the branch and can alter or remove history; this is not an immutable global ledger.

The workflow generates a Sigstore-backed GitHub artifact attestation for the exact record and verifies the repository, signer workflow and hosted runner before publication. Its verification bundle is stored beside the record. Anyone can download both and use:

```sh
gh attestation verify RUN-ATTEMPT.json --bundle RUN-ATTEMPT.jsonl \
  --repo injammed/ABYS \
  --signer-workflow injammed/ABYS/.github/workflows/apyoc-ai.yml \
  --deny-self-hosted-runners
```

The browser verifies SHA256 against the index and validates schema and event consistency. It does not verify Sigstore signatures. The CLI is the stronger provenance check. Attestation establishes which workflow produced the bytes; it does not establish model honesty, independent behavioral observation or completeness outside the documented supervisor contract. A malicious or compromised authorized workflow remains in the trust boundary.

## Scope and privacy

The observed action budget is three baseline checks plus at most one model-selected request. The model uses only fixed source instructions and numeric endpoint statuses. No visitor traffic, uploaded artifacts, private conversation, credentials or person identifiers enter the payload. This is not a general prompt-redaction service. Hosting providers still process ordinary network requests under their own policies.

The Linux namespace removes network access from inference. It is not a complete operating-system security sandbox: the trusted Python runtime can read local files, and the supervisor and model share the runner. File/process activity, full logits, weights during computation, activations and hidden goals are not collected. Those are explicit observation gaps, not implied capabilities.

The registration covers a fixed pretrained model. It is a starting identity, not an automatic discovery or descendant-registration mechanism. Adding a new machine requires explicit scoped authorization, reviewed instrumentation and a new supported evidence contract.

## Cadence, failure and revocation

The AI workflow is scheduled hourly at minute 19; the interface refreshes about once per minute. GitHub scheduling is best effort and may miss or delay runs substantially. A two-hour publication gap is visible on the site. This is periodic supervised execution, not a continuously present intelligence. A workflow that fails before it can attest and publish leaves a visible time gap; its Actions run exposes the failed stage. Failed inference after supervision begins produces an attested stopped-run record when publication succeeds.

Set `enabled` to false in the reviewed machine registration to block subsequent executions before any request. To stop an already-running checkout, cancel its Actions run. Disable `apyoc-ai.yml` to stop future scheduling. A registration edit does not retroactively change a running checkout. Refusing a new action is the enforced boundary; cancellation cannot undo a request already sent.

To reproduce on a Linux machine with sudo/unshare, install Python 3.12, create a venv, install `requirements-ai.txt`, download the pinned model with `download-model.py`, then invoke `supervise.py OUTPUT MODEL_DIR VENV/bin/python`. Local records have workflowRun 0 and cannot be published by the production publisher. The direct `infer.py` entry point can reproduce model probabilities from the fixed three-status input without claiming network isolation.

## Next gates toward the permanent directive

- An independently operated witness and durable external checkpoints of record digests.
- A real partner-controlled agent workflow with authenticated collector identity, replay prevention, lineage and revocation tested across processes.
- Event-driven delivery with measured latency and outage recovery, replacing best-effort scheduling where continuous coverage is required.
- A declared denominator: permitted actions, independently observed actions, missing intervals and excluded human-bearing payloads. Never extrapolate one registered worker into global coverage.
- Adversarial evaluation of attempts to bypass instrumentation, change policy, forge evidence, leak human data or mislead the observer.
- Only then add broader AI reasoning to the observer, preserving the underlying evidence and its own audit trail.

## Change gate and validation

Owner-directed continuation of the open Apyoc foundation. Confirmed limitation: no AI execution was observable in the original infrastructure-only collector. Scope: one model, one registry, one supervisor, one publication workflow and a public evidence view. No paid inference service, new account, user-data collection or database change. Existing upload/feed/vote/shop paths remain in place.

Classification: AETIMM after schema, supervisor, typecheck, build, CI and live publication checks. Tests exercise identity changes, extra payloads, missing events, inconsistent model choices, duplicate archive identities, journal failure, inference failure and disabled registration. Actual local model inference was executed. This workspace cannot run sudo network namespaces; the production workflow must verify that boundary before any completed run is claimed. Browser visual verification is not claimed.

Rollback: disable the new workflow and revert the release; retain the public archive for inspection. Existing infrastructure checks are separate and continue independently.
