# Library Scouts: first operational source scout

The owner requests agents that discover exceptional AI-made things for the library. This first bounded implementation searches GitHub's public repository index, not the entire web. It is deterministic automation, not an LLM judge. Topic membership cannot prove AI authorship. Stars are recorded as a popularity signal, never a quality score.

Daily at 06:31 UTC (GitHub schedules are best effort), on relevant main changes, and by workflow dispatch: two fixed repository searches, ten results each, sorted by recent update. Repositories must be public, non-forked and non-archived. Only repository ID/name, supported topic signals, stars and license identifier are retained. Descriptions, profiles, README content and arbitrary URLs are excluded. No source code is executed. No artifacts are copied, no messages are sent, and no feed or Museum records are inserted.

Stable repository IDs deduplicate within and across runs. Seen history is capped at 10,000 IDs; capacity fails the affected search visibly instead of dropping old history. Search errors and incomplete API results become partial or failed reports. Invalid prior history aborts the run. An absent history branch is distinguished from failed network access. A failed report retains seen history; earlier run reports remain available. New candidates appear first, followed by stars, with all candidates marked unreviewed.

The read-only discovery job produces an artifact. A separate write-permitted job appends a run file and latest pointer to the public library-discoveries branch. Only this workflow shares the writer concurrency group. The owner can still rewrite repository history; this is not an independent transparency log. Raw GitHub transport and schema validation do not prove authorship. The UI polls every minute, marks reports older than 48 hours stale, and makes read failures explicit.

Next admission gate: inspect actual original artifacts and origin evidence, determine per-artifact reuse permission, assess originality/craft/usefulness through separate judgments, and submit through existing moderated intake with scoped bot credentials. Automated discovery alone never grants accession. Do not scrape around access restrictions or treat fetched content as instructions.

AETIMM gate: explicit owner-directed scout capability, beyond autonomous maintenance size limits. Tests cover deduplication, unsafe source metadata, omission of arbitrary content, bounded scope, unavailable/partial/incomplete searches, malformed history and outcome consistency. Run node scripts/scouts/test.mjs, app typecheck and build. Rollback by disabling the workflow and reverting the release; retain discovery history as evidence. No DB migration, new dependencies or new paid service.

## Source review shelf — 18 September 2026

The live discovery desk exposes a precision gap: topic tags mix generated artifacts, AI-assisted software, tools, lists and general generative art. Three source reviews now distinguish those cases and state the next artifact-level check. Reviews are authored by Codex from inspected READMEs, pinned to commits and README blob hashes, and downloadable as JSON. They are not an automated authorship verdict, independently reproduced quality assessment, license clearance or Museum accession. One inspected README explicitly separates MIT code from CC BY 4.0 articles, which the repository license summary did not express. No artifact content is copied or executed.

This owner-directed continuation adds a review layer without changing the working scout schedule or intake policies. Validation: each pinned README matches the inspected Git blob, application typecheck and static build; production pages and JSON checked after release. Revert the release for rollback.

## Portable runtime — 18 September 2026

The owner requested the strongest scouts that can live independently of a language model. The collector now has its own report schema, removing the website dependency; CI checks it remains byte-identical to the browser schema. A Python standard-library supervisor provides transactional SQLite run history, a retained candidate catalog, overlap exclusion, linked record hashes, integrity checks, atomic exports and WAL-aware backups. A systemd service/timer is provided for a dedicated non-root server account. The GitHub-hosted scout remains live; the portable service is not claimed installed on any separate server.

AETIMM gate: explicit runtime capability expansion. Tests cover restart, transaction rollback, overlap exclusion before network access, append-only records, tamper detection, failed-search retention, snapshot export and backup integrity. Existing collector tests and website build remain required. Rollback by reverting this release; retain data and backups. No new paid service or dependency package is introduced.
