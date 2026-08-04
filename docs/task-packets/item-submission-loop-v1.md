# Codex Task Packet: Finish ITEM Submission Loop v1

## Task ID

`ABYS-ITEM-SUBMISSION-LOOP-V1`

## Destination

Implementation owner: `injammed/ABYS`

Canon/schema authority: `injammed/ITEM`

## Objective

Complete the existing AETIMM / SLOP TROUGH social-beta submission path so a signed-in creator can submit an artifact, receive a curator decision or revision request, resubmit, and see an approved artifact enter the public feed through a secure, auditable transition.

## Current State

Already present on `main`:

- Next.js + TypeScript app in `apps/item-web`
- Supabase browser client
- email/password accounts and persistent sessions
- creator profiles
- private `artifact-media` storage
- image submission into `quarantine`
- creator upload list
- approved-artifact public feed
- persistent preserve/refine/slop voting
- `moderation_events` table
- Row Level Security
- static GitHub Pages export

Do not rebuild these features.

## Canon Contracts

Treat these ITEM files as external authority and do not copy them into ABYS:

- `injammed/ITEM/schemas/contribution.schema.json`
- `injammed/ITEM/schemas/item-record.schema.json`
- `injammed/ITEM/docs/judgment-standard.md`

The ABYS app is an intake and execution surface. It does not become the canon repository.

## Missing Closure

The current system lacks:

- curator authorization
- secure curator access to quarantined records
- approve / request revision / reject controls
- revision notes visible to the creator
- a creator resubmission transition
- append-only lifecycle history visible to authorized actors
- a verified approval-to-publication path that does not expose a service-role key

## Architecture Decision

Keep the site statically exportable.

Do not place a Supabase service-role key in the browser or GitHub Pages build variables.

Implement moderation through database-enforced authorization:

```txt
authenticated curator client
→ Supabase RPC
→ SECURITY DEFINER function
→ verify auth.uid() has curator/admin role
→ atomically update artifact
→ append moderation event
```

## Required Files

Create or modify the following, adapting names only when the repository already has a stronger convention:

```txt
supabase/migrations/002_curator_submission_loop.sql
apps/item-web/app/curator/page.tsx
apps/item-web/components/CuratorQueue.tsx
apps/item-web/components/AccountGate.tsx
apps/item-web/components/UploadGate.tsx
apps/item-web/lib/moderation.ts
apps/item-web/lib/social-feed.ts
apps/item-web/README.md or deployment documentation
```

Add tests or executable verification scripts under the existing test conventions.

## Database Requirements

### Profiles

Add a role with a narrow enum or check constraint:

```txt
creator
curator
admin
```

Default existing and new users to `creator`.

Users must not be able to assign themselves `curator` or `admin` through normal client updates.

### Artifact Status

Support:

```txt
quarantine
needs_revision
approved
rejected
removed
```

Rules:

- `approved` requires non-null lane and `published_at`.
- every non-approved status requires `published_at` to be null.
- only curator/admin review logic can set `approved`, `rejected`, or `removed`.
- a creator may edit their own `quarantine` or `needs_revision` artifact.
- a creator may move their own `needs_revision` artifact back to `quarantine` as resubmission.
- a creator may never assign a lane or publication timestamp.

### Events

Preserve `moderation_events` as append-only history unless a migration to a more general `artifact_events` table is demonstrably safer.

Support at least:

```txt
submitted
request_revision
resubmitted
approve
reject
remove
restore
```

Each event records:

- artifact ID
- actor ID
- decision
- lane when applicable
- human-readable note
- timestamp

Do not add client policies that allow arbitrary event inserts, updates, or deletes.

### Secure Review RPC

Create an atomic RPC such as:

```txt
review_artifact(
  artifact_id uuid,
  decision text,
  lane text,
  note text
)
```

It must:

1. require an authenticated curator or admin;
2. lock/read the target artifact;
3. validate allowed transition;
4. update status, lane, and publication timestamp atomically;
5. append one event;
6. return the updated artifact;
7. reject malformed decisions, invalid lanes, and unauthorized callers.

Create a separate secure resubmission function only if RLS cannot safely represent the creator transition.

## Curator Interface

Add a static-export-compatible `/curator/` page using client-side Supabase calls.

The page must:

- hide or deny access for non-curators;
- list quarantined artifacts newest first;
- show media preview through a signed/private URL;
- show title, summary, origin class, generator, human role, provenance, creator, and attestations;
- show prior lifecycle events;
- provide Approve, Request revision, and Reject actions;
- require a note for every decision;
- require lane selection for approval;
- refresh the queue after a successful decision;
- display database errors without leaking secrets.

## Creator Experience

Update the account/submission experience so creators can:

- see `needs_revision` distinctly;
- read the latest curator note;
- edit eligible submission fields;
- resubmit into quarantine;
- see approved/rejected status without gaining private curator data.

Do not call every contribution “slop.” Use neutral submission language in account state and reserve SLOP TROUGH for judgment/routing outcomes.

## Public Publication

The public feed must continue to return approved artifacts only.

Approval should make the artifact visible without copying media into a public bucket; existing signed-media behavior may remain if authorization and caching are correct.

No unapproved artifact may become readable to anonymous users.

## Acceptance Tests

### Authorization

- ordinary creator cannot open curator queue data;
- ordinary creator cannot call review RPC successfully;
- ordinary creator cannot modify role, lane, publication timestamp, or approved/rejected status;
- curator can review quarantine records;
- service-role key is absent from client code and public environment examples.

### Submission Lifecycle

- new upload enters `quarantine`;
- submission event is recorded;
- curator can request revision with note;
- creator sees note and `needs_revision`;
- creator edits and resubmits;
- resubmission event is recorded;
- curator approves with one valid lane;
- approved artifact receives `published_at` and appears in public feed;
- curator can reject with note;
- rejected artifact remains private to creator/curator.

### Consistency

- approval update and event insertion succeed or fail together;
- approved artifact cannot have null lane;
- non-approved artifact cannot retain `published_at`;
- repeated client submission does not create accidental duplicate media/database records;
- event history cannot be edited or deleted from the browser.

### Build

Run from `apps/item-web`:

```bash
npm install
npm run typecheck
npm run build
```

Both must pass with and without Supabase public variables present.

## Non-Goals

- payments
- Golden Dust
- marketplace
- automated AI canon judgment
- training-data ingestion
- public creator leaderboards
- broad redesign
- moving runtime code into ITEM

## Risks and Blockers

- Production activation requires the owner to apply migration `002_curator_submission_loop.sql`.
- At least one account must be promoted to curator through a trusted SQL/admin operation.
- GitHub Pages variables must contain only public Supabase URL/publishable key values.
- End-to-end verification requires a controlled test creator and curator account.

## Definition of Done

```txt
creator signs in
→ uploads artifact
→ artifact enters private quarantine
→ curator reviews securely
→ curator requests revision or approves/rejects
→ creator sees decision and may resubmit
→ approved artifact enters public feed
→ every transition has append-only evidence
```

## Delivery

Codex should create a focused branch and pull request against `injammed/ABYS/main`.

The PR body must include:

- migration summary
- security model
- changed files
- test commands and results
- manual production activation steps
- rollback plan

Do not merge until the SQL migration has been reviewed and the static build passes.
