# AETIMM / SLOP TROUGH Social Beta Vertical Slice

## Objective

Turn the current static demonstration into a real multi-user beta without redesigning the live experience.

```txt
account
→ upload into quarantine
→ moderation approval
→ infinite public feed
→ persistent judgment
→ AETIMM / refine / SLOP routing
```

## Runtime Choice

Use Supabase from the existing static Next.js PWA:

- Supabase Auth for email accounts
- Postgres for profiles, artifacts, and votes
- Supabase Storage for uploaded media
- Row Level Security for access control
- GitHub Pages remains the public frontend

The browser receives only the Supabase project URL and publishable/anon key. No service-role key may enter the frontend or GitHub Pages build.

## First Release Scope

### Accounts

- create account with email and password
- sign in and sign out
- public display name
- one profile per authenticated user

### Uploads

- image uploads first
- title, summary, origin class, generator, human role, and provenance note
- AI-origin, rights, and safety attestations required
- every upload begins in `quarantine`
- no public self-publication

### Feed

- cursor pagination
- newest-first and lane filters
- approved artifacts only
- provenance visible on every card
- existing seed artifacts remain as fallback when Supabase is not configured

### Voting

One judgment per account per artifact:

- preserve
- refine
- slop

A later judgment replaces the earlier judgment. Users cannot vote on quarantined artifacts.

## Tables

```txt
profiles
artifacts
artifact_votes
moderation_events
```

## Artifact States

```txt
quarantine
approved
rejected
removed
```

## Security Requirements

- users can update only their own profile
- users can insert only artifacts attributed to themselves
- public users can read only approved artifacts
- authenticated users can read their own quarantined submissions
- authenticated users can insert/update only their own vote
- clients cannot change moderation status
- storage uploads are private until approved
- no service-role credential in browser code

## Acceptance Criteria

- a new user can create an account and sign in
- a signed-in user can upload an image and see it in their private pending list
- an approved test artifact appears in the public feed
- scrolling loads another page without duplicating records
- a signed-in user can cast and replace one vote
- refresh preserves account session and recorded vote
- anonymous users can scroll but cannot upload or vote
- current ST root, AETIMM museum route, simulator, identity animation, and visual system remain intact
- typecheck and static export pass

## Deployment Gate

The code may merge with a safe seed-data fallback. Real multi-user mode activates only after the owner creates a Supabase project and configures:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

No passwords or keys are placed in issues, commits, or chat.
