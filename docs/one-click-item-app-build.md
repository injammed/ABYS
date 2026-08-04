# One-Click ITEM App Build Contract

## Objective

Build and deploy the public AETIMM / SLATRA application from two canonical sources:

```txt
ITEM = canon and artifact source of truth
ABYS = application runtime, build system, validation, CI, deployment, and Codex execution
```

## Meaning of One Click

`One click` does not mean zero setup.

It means that after accounts, secrets, and infrastructure are configured once, a single GitHub Actions `workflow_dispatch`, Vercel Deploy Hook, or approved merge to `main` performs the complete repeatable build and deployment sequence.

## One-Click Pipeline

```txt
Trigger build
→ checkout ABYS
→ checkout public ITEM canon
→ validate ITEM schemas and lifecycle states
→ generate typed public canon manifest
→ run database migration check
→ seed or synchronize public canon mirror
→ build Next.js application
→ run lint, typecheck, unit tests, and browser smoke tests
→ create preview deployment
→ require approval for production
→ deploy production
→ run health checks
→ write deployment trace and canon commit SHA
```

## Repository Responsibilities

### ITEM

Owns:

- canonical artifact records
- contributor records intended for canon
- artifact classes and vocabulary
- provenance rules
- judgment standard
- public export contract
- canon commit SHA

Does not own:

- runtime user sessions
- app code
- secrets
- payments
- deployment
- mutable rankings

### ABYS

Owns:

- web/PWA app
- APIs
- runtime database
- authentication
- submission workflow
- natural-language museum guide
- modal DNA builder
- Caechat judgment workflow
- AETIMM and SLATRA leaderboards
- Golden Dust reputation ledger
- moderation and curator console
- tests and observability
- one-click deployment workflow

## v0.1 Product Scope

### Public AETIMM

- twin-door onboarding: AETIMM / SLATRA
- museum home
- canon registry
- ITEM detail pages
- Full-Mode Artifact presentation
- search and natural-language navigation
- contributor submission flow
- canon gate rubric
- rankings / rising canon candidates
- provenance display

### Public SLATRA

- anti-pattern gallery
- slop-pattern explanations
- failed-artifact refinement routes
- no slop rewards
- no infinite engagement-maximized feed

### Signed-In User

- profile
- saved artifacts
- submission drafts
- contribution history
- non-transferable Golden Dust ledger
- judgments and critiques
- notification preferences

### Curator

- review queue
- duplicate detection
- source disclosure review
- artifact routing: AETIMM / refine / archive / SLATRA
- dust award approval
- audit log

## Recommended Stack

```txt
Application: Next.js + TypeScript
UI: Tailwind + shadcn/ui + restrained motion
Database/Auth/Storage: Supabase
Hosting: Vercel
CI/CD: GitHub Actions
Testing: Vitest + Playwright
Schema validation: AJV or equivalent
Observability: Sentry or OpenTelemetry-compatible service
AI services: OpenAI API behind server-only routes
Commerce later: Stripe
```

## Runtime Data Model

Required tables:

```txt
profiles
canon_items_mirror
artifact_submissions
artifact_renderings
modal_dna
provenance_events
judgments
public_votes
curator_decisions
dust_ledger
leaderboard_snapshots
saved_items
notifications
deployment_traces
```

## Canon Mirror Rule

`canon_items_mirror` is a runtime projection, not the source of truth.

Each record must include:

```txt
item_id
item_repo_path
item_commit_sha
canon_status
manifest_version
synced_at
```

A runtime action must never silently mutate canonical status in ITEM.

## Required Environment Variables

### Public-safe

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_CANON_VERSION
```

### Server-only

```txt
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
GITHUB_TOKEN or ITEM_SYNC_TOKEN when required
CRON_SECRET
```

### Deployment

When GitHub Actions deploys through Vercel:

```txt
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### Optional later

```txt
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
SENTRY_AUTH_TOKEN
```

## Security Requirements

- Supabase Row Level Security on all user-owned tables
- service-role key never exposed to browser code
- upload type and size limits
- rate limiting for AI routes and submissions
- audit log for curator actions and dust awards
- source disclosure for institutional submissions
- bot and duplicate detection
- no transferable Golden Dust in v0.1
- production deployment approval gate
- secrets stored in deployment environments, not committed files

## Required Repository Files

```txt
apps/item-web/
  app/
  components/
  lib/
  public/
  tests/
  package.json
  next.config.ts
  playwright.config.ts

packages/item-sync/
  src/fetch-item-canon.ts
  src/validate-item-canon.ts
  src/generate-public-manifest.ts
  src/sync-canon-mirror.ts

packages/artifact-core/
  src/types.ts
  src/modal-dna.ts
  src/judgment.ts
  src/provenance.ts

supabase/
  migrations/
  seed.sql

.github/workflows/
  item-preview.yml
  item-production.yml
  item-sync.yml

scripts/
  one-click-build.ts
  health-check.ts
```

## The Single Command

Local/reproducible form:

```bash
npm run item:launch
```

Expected script chain:

```txt
item:validate
→ item:sync
→ db:check
→ lint
→ typecheck
→ test
→ test:e2e
→ build
→ deploy
→ healthcheck
```

## The Single Button

GitHub Actions workflow:

```txt
Actions
→ ITEM One-Click Launch
→ Run workflow
```

Inputs:

```txt
target: preview | production
item_ref: main | commit SHA
seed_demo_users: false
run_ai_smoke_test: true
```

Production must require environment approval.

## Vercel Behavior

- branch and pull-request changes create preview deployments
- approved `main` release creates production deployment
- deploy hook may provide an additional literal one-button trigger after initial setup

## Required Tests

### Canon

- every exported ITEM validates
- private candidates do not export
- canonical IDs are unique
- all assets resolve

### Product

- twin-door screen renders
- museum registry loads
- artifact detail loads
- submission validation works
- role-based curator access works
- dust cannot be self-awarded
- SLATRA placement gives no reward

### Security

- users cannot read private drafts of other users
- users cannot update canon mirror status
- browser never receives service-role key
- institutional source disclosure cannot be removed by ordinary users

### Deployment

- preview URL returns HTTP 200
- database connectivity succeeds
- canon version matches selected ITEM commit
- health route returns build SHA and canon SHA

## Definition of Done

The one-click system is complete when a non-developer can select `Run workflow`, choose preview or production, and receive:

- a deployed URL
- a passing test report
- the exact ITEM canon commit used
- database migration status
- health-check result
- rollback reference

## Required Human Setup Before the First Click

1. Create and connect Vercel project.
2. Create Supabase project.
3. Add environment variables and secrets.
4. Configure production approval environment.
5. add app icons and brand assets to version control.
6. Select domain.
7. Confirm privacy policy, terms, contribution license, and content rules.
8. Decide initial public canon set.
9. Confirm Golden Dust remains non-transferable reputation in v0.1.
10. Approve the first production launch.

## Ruthless Scope Cut

Do not include in first launch:

- cash-per-swipe
- transferable Dust
- secondary trading
- autonomous government content injection
- App Store native binary
- complex simulation engine
- 10,000 finished records

Ship first as a responsive installable web app/PWA. Native iOS packaging can follow after product validation.

## Final Compression

```txt
One click = one repeatable, verified pipeline.

ITEM supplies truth.
ABYS supplies execution.
Tests supply confidence.
Human approval supplies release authority.
```
