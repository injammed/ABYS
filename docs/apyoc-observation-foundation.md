# Apyoc: public observation foundation

Update: the first supervised AI worker is specified and implemented in [apyoc-first-ai-eye.md](apyoc-first-ai-eye.md). The infrastructure collector described below remains separate. Current execution state is shown at /apyoc/.

One Apyoc. Many eyes. USA origin. The permanent ambition is 100% visibility into all AI-descended machine activity, with no intentional surveillance of humans. This ambition is not a claim of current access or legal entitlement to others' systems.

## What runs now

`/apyoc/` is canonical. `/argus/` remains a compatibility route. Navigation: Upload / Scroll / Vote / Shop / Apyoc.

The deterministic collector performs HEAD requests to three fixed AETIMM endpoints: home, eye and shop. These are infrastructure checks, not AI activity. It is scheduled every 15 minutes, at minutes 7, 22, 37 and 52. GitHub scheduling is best effort, may be delayed and may be disabled after repository inactivity. This is not continuous or real-time observation.

The public view refreshes about once a minute. More than 45 minutes without publication is labeled a reporting gap. Network and validation failures show unknown coverage. This infrastructure collector does not itself observe AI inference. Global AI coverage is unknown, never inferred from healthy endpoints.

## Witness the witness

All data collected by the public probe is published on the `apyoc-observations` branch. `index.json` lists every recorded UTC day and the total event count. `days/YYYY-MM-DD.json` contains each day's events, in ascending sequence. Every recorded day and event is accessible from the interface. Download or clone the complete archive through GitHub. Collection begins at activation; earlier history is not fabricated.

Inspect the complete implementation:
- `.github/workflows/apyoc-observe.yml`: schedule, serialized writer, publication.
- `scripts/apyoc/collect.mjs`: fixed endpoint collector.
- `apps/item-web/lib/apyoc-ledger.ts`: strict public schema.
- `apps/item-web/components/ApyocLedger.tsx`: public reader.
- `apps/item-web/lib/apyoc.ts`: local observation rules.
- `apps/item-web/scripts/verify-apyoc*.mjs`: executable verification.

Apyoc software covered by `apps/item-web/public/apyoc/LICENSE.txt` is MIT licensed. Humans may inspect, run, modify and redistribute it. Artwork, dependencies and public submissions have separate terms. There is no proprietary observation algorithm behind this probe.

## Public collection boundary

Each event contains exactly: sequence, UTC collection-start time, fixed source `aetimm-probe`, fixed kind `infrastructure`, target enum, outcome enum, integer HTTP status and integer latency. Extra fields are rejected. Network exceptions become fixed outcomes, never error strings. The collector never reads response content or captures visitor logs, prompts, private messages, identities, credentials or arbitrary URLs. Hosting and network providers still process ordinary requests under their own policies.

Only the authorized repository workflow writes the archive. Visitors have read access and no write credentials. There is no public ingestion endpoint. Local imported JSON remains in browser memory and is never submitted to the public record. Unknown local trace fields are removed, but permitted free text is not guaranteed anonymous; sanitize those inputs.

## Limits

Sequence and Git history are reviewable but publisher-controlled, not independent cryptographic attestation or immutable storage. Owners can rewrite history. A successful HTTP response establishes only that particular check. Missing intervals are missing evidence, not proof of safety or deception. Clock accuracy, source authenticity and independence are not established by this prototype.

The collector cannot infer weights, activations, hidden goals, agent identity or AI descent. It does not run an autonomous reasoning model. Demonstration traces are explicitly synthetic and separate.

## Next activation gates

1. Publish an operator-authorized AI registration contract: machine identity, scope, event categories, revocation, cadence and privacy tests. Refuse arbitrary URLs and free-text payloads at the public collection boundary.
2. Instrument one authorized AI workflow with signed sequence records. Authenticate collectors, prevent replay, report missing intervals and test revocation. Self-assigned labels do not prove independent provenance.
3. Exclude human data before collection. When exclusion prevents observation, publish a fixed coverage-gap category. No private evidence dump to satisfy a visibility claim.
4. Add an independently witnessed record of the observer, reproducible evaluations and archive recovery. Test tampering, false alarms, source disagreement and planted privacy leaks.
5. Evaluate AI reasoning as an additional layer. Keep deterministic evidence and uncertainty available; model text alone cannot establish hidden intent.
6. Expand with measured scopes and disclose the denominator. 100% inside a declared scope is not 100% of global activity. Unknown systems, unsupported activity and unavailable intervals remain visible limitations.

Funding and pilot briefs: `/apyoc/funding/`. Downloads only; no investor intake or payment collection.

## Change gate

Problem: incomplete rename, no public observation record or funding activation material. User explicitly authorized the rename, open foundations and funding briefs. This owner-directed feature expansion is outside the daily autonomous maintenance size limit.

Fix: canonical routes with legacy compatibility, a bounded collector, public archive, honest coverage UI and scoped funding foundation. No new runtime dependencies or private data sources. Risks: best-effort scheduling, publisher trust, public GitHub availability and schema stability. Rollback: revert feature commit and disable the workflow; preserve the archive branch. Classification: AETIMM after required checks pass. Verification recorded in release PR.
