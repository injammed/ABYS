# Codex Instructions: ITEM Web Runtime

## Scope

This directory is the deployable AETIMM / SLOP TROUGH web runtime owned by ABYS.

Do not move runtime code, authentication, moderation, deployment, or UI infrastructure into `injammed/ITEM`. ITEM remains the canon/schema authority.

## Current Stack

- Next.js App Router
- TypeScript
- React
- static export for GitHub Pages
- Supabase Auth, Postgres, Storage, and Row Level Security

## Validation

Run from this directory:

```bash
npm install
npm run typecheck
npm run build
```

Both typecheck and build must pass with Supabase public environment variables absent. Backend-dependent UI must degrade to an explicit disabled state rather than breaking static export.

## Security Rules

- Never expose a Supabase service-role or secret key in browser code, examples, logs, issues, or pull requests.
- Browser configuration may contain only the Supabase URL and publishable/anon key.
- Authorization must be enforced by Postgres/RLS/RPC, not only hidden UI.
- Creators may never self-publish, assign lanes, or promote their own roles.
- Unapproved artifact media must remain private.
- Moderation/lifecycle events are append-only from browser-facing paths.

## Product Constraints

Preserve:

- current AETIMM / SLOP TROUGH visual hierarchy
- `/` SLOP TROUGH root
- `/aetimm/` museum route
- `/simulator/`
- provenance and human-role disclosure
- prohibited-content exclusion rather than slop classification
- static GitHub Pages compatibility

Do not introduce:

- payments or Golden Dust
- marketplace behavior
- autonomous canon judgment claims
- service-role keys in the client
- broad redesign unrelated to the assigned task

## Submission-Lifecycle Task

For the current implementation target, follow:

`../../docs/task-packets/item-submission-loop-v1.md`

Prefer a small migration, focused components, typed data access, explicit status transitions, and tests over generalized framework work.
