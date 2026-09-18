# Standalone AETIMM Scout

This directory is a self-contained, model-free program. It requires Node 24+ and Python 3.10+; it does not require the website, npm installation, a language model, an AI API key, or a live ChatGPT session. Source discovery still requires GitHub's public API and network access. An optional read-only `GH_TOKEN` increases the API allowance. Never use a write token for discovery.

## Run locally

From an installed checkout, use its actual commit ID:

```sh
node scripts/scouts/test.mjs
python3 scripts/scouts/test_runtime.py
python3 scripts/scouts/runtime.py run --db ./scout-state/scout.db --source-commit YOUR_40_CHARACTER_COMMIT
python3 scripts/scouts/runtime.py check --db ./scout-state/scout.db
python3 scripts/scouts/runtime.py export --db ./scout-state/scout.db --output ./scout-state/catalog.json
python3 scripts/scouts/runtime.py backup --db ./scout-state/scout.db --output ./backups/scout-2026-09-18.db
```

`git rev-parse HEAD` gives the installed revision. Keep code and state separate. A backup destination must not already exist. `check`, `export`, and `backup` refuse a missing database so a typo cannot silently create a replacement history.

Two fixed, bounded GitHub searches run per invocation. No arbitrary web URLs, README instructions, source code, paid calls, account actions or public posts are executed. Results remain candidates. No AI-authorship verdict, quality judgment or accession is implied.

The portable launcher stores every completed/partial/failed search report in SQLite. A writer lock prevents overlapping invocations before any network request. Each transaction commits the report and candidate catalog together. The catalog retains original and latest discovery run IDs even when a project drops out of subsequent search results. Reports are append-only through normal database operations, hashed and linked to the previous report. SQLite WAL plus FULL synchronization protect committed local state; physical disk and filesystem reliability remain dependencies.

A collector crash, timeout or interrupted transaction leaves prior committed history intact. Failed/partial searches are recorded and return exit code 2; runtime faults return 1. Successful searches return 0. A later invocation resumes from the last committed report. There is no infinite retry loop; the next scheduled run tries again. A search can miss repositories outside its bounded window. The 10,000-ID collector history ceiling remains explicit and fails affected searches instead of discarding identities.

`check` detects broken hash links, modified records and catalog inconsistency. It cannot prove that the machine owner did not rewrite the whole database or remove its tail. Retain exported checkpoints and backups on a separate machine for stronger assurance. This is not an independent attestation service.

`export` atomically replaces one JSON snapshot containing the latest report, all retained candidate metadata and a chain checkpoint. The backup command uses SQLite's backup API, including committed WAL data. Test restoration by running `check` against a backup. Protect backups separately; scheduling, off-host copying and alert delivery require the operator's actual infrastructure.

## Unattended Linux service

On a server you control:

1. Install Node 24+ and Python 3.10+, making `node` available in the service PATH.
2. Install the reviewed repository revision at `/opt/aetimm-scout`; do not let the service user modify its source.
3. Create a dedicated `aetimm-scout` system user and group.
4. Create `/etc/aetimm-scout.env` readable only by root. Set `SCOUT_SOURCE_COMMIT` to that exact source revision. Optionally set a read-only `GH_TOKEN`. Do not place credentials in the repository.
5. Copy the service and timer from `scripts/scouts/systemd/` to `/etc/systemd/system/`.
6. Run `systemctl daemon-reload`, then `systemctl enable --now aetimm-scout.timer`.
7. Run `systemctl start aetimm-scout.service` and inspect `journalctl -u aetimm-scout.service` and `systemctl list-timers aetimm-scout.timer`.
8. Configure a backup destination and monitoring for failed services on that server. No email or external alert destination is assumed.

The timer catches up after downtime and staggers executions. The service is non-root with filesystem protections, no new privileges, an execution deadline and resource limits. It can still reach network services; these settings are not a full network sandbox. Application code limits requests to GitHub.

The existing aetimm.com discovery desk continues to use the live GitHub-hosted scout. This portable runner is ready to install; no separate server has been provisioned. Local run IDs are not GitHub Actions IDs: publish portable catalogs through an appropriate local dashboard rather than substituting them into the current GitHub workflow report URL scheme.
