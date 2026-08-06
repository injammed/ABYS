# Curator Submission Loop v1 — Activation and Rollback

## Scope

This runbook activates the secure lifecycle:

```txt
creator upload
→ private quarantine
→ curator review
→ approve / request revision / reject
→ creator revision and resubmission
→ public publication
→ append-only lifecycle evidence
```

The static website continues to use only the Supabase URL and browser publishable/anon key. Never expose a service-role key in GitHub Pages, client code, screenshots, or public logs.

## Preconditions

1. `001_social_beta.sql` is active.
2. `003_public_intake_hardening.sql` is active when crowd quotas are desired.
3. The deployment contains the matching curator and creator lifecycle UI.
4. A trusted operator controls the Supabase SQL Editor.

## Activate migration 002

Open Supabase SQL Editor and run the complete contents of:

```txt
supabase/migrations/002_curator_submission_loop.sql
```

Expected result:

```txt
Success. No rows returned.
```

## Verify schema

Run:

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'profiles'
  and column_name = 'role';

select constraint_name, check_clause
from information_schema.check_constraints
where constraint_name in ('profiles_role_check', 'artifacts_status_check', 'publication_state_consistent')
order by constraint_name;

select event_type, count(*)
from public.artifact_events
group by event_type
order by event_type;
```

Expected:

- `profiles.role` exists and defaults to `creator`;
- artifact status includes `needs_revision`;
- existing artifacts have a `submitted` lifecycle event;
- non-approved artifacts cannot retain a lane or publication timestamp.

## Promote one trusted curator

Find the exact account first:

```sql
select
  profiles.id,
  profiles.display_name,
  profiles.role,
  auth.users.email
from public.profiles
join auth.users on auth.users.id = profiles.id
order by auth.users.created_at;
```

Promote only the intended account:

```sql
update public.profiles
set role = 'curator', updated_at = now()
where id = '<EXACT-USER-UUID>';
```

Verify:

```sql
select id, display_name, role
from public.profiles
where id = '<EXACT-USER-UUID>';
```

Do not add a browser control for role promotion.

## Production acceptance fixture

Use `Jesus Angel’s Spine` as the controlled artifact.

### Creator state

1. Sign in as the creator.
2. Open `Unjudged`.
3. Confirm the card remains marked `PRIVATE PREVIEW`.
4. Open the account panel and confirm lifecycle history appears.

### Curator state

1. Sign in as the promoted curator.
2. Open `/curator/`.
3. Confirm `Jesus Angel’s Spine` appears with private signed media, provenance, attestations, and submission history.
4. Enter a required note and select one of:
   - Request revision
   - Reject
   - Approve + publish

### Revision path

1. Request revision with a concrete note.
2. Return to the creator account.
3. Confirm status reads `Revision requested` and the note is visible.
4. Edit metadata/provenance.
5. Select `Save + resubmit for review`.
6. Confirm status returns to private quarantine and a `resubmitted` event exists.

### Publication path

1. Approve to `unjudged` first.
2. Confirm `published_at` and lane are populated.
3. Sign out.
4. Confirm the artifact is visible anonymously in the public Unjudged feed.
5. Sign in with a normal account and confirm Preserve / Refine / Slop voting is unlocked.

## Security tests

### Ordinary creator cannot review

While authenticated as a normal creator, run through the browser client or SQL impersonation test:

```sql
select public.current_user_is_curator();
```

Expected: `false`.

A direct `review_artifact` RPC call must fail with:

```txt
CURATOR_ROLE_REQUIRED
```

### Creator cannot self-publish

The browser account must not be able to update:

```txt
profiles.role
artifacts.status
artifacts.lane
artifacts.published_at
artifacts.creator_id
artifacts.media_path
```

### Private media boundary

- creator sees own unapproved media;
- curator sees reviewable private media;
- anonymous visitor and unrelated creator cannot create signed URLs for it;
- approved media remains available through the existing signed public-feed path.

## Emergency curator removal

```sql
update public.profiles
set role = 'creator', updated_at = now()
where id = '<EXACT-USER-UUID>';
```

The account loses queue access immediately after its session makes the next database request.

## Rollback strategy

Prefer disabling curator authority rather than destructively removing lifecycle evidence.

Safe operational rollback:

```sql
update public.profiles
set role = 'creator', updated_at = now()
where role in ('curator', 'admin');
```

Then deploy the prior website commit.

Do not drop `artifact_events` after real decisions have been recorded. It is append-only provenance.

A full schema rollback would require:

1. disabling curator/admin roles;
2. ensuring no artifact remains `needs_revision`;
3. returning such artifacts to `quarantine` through a reviewed trusted SQL operation;
4. removing RPC execute grants;
5. restoring prior constraints and update privileges;
6. preserving an export of `artifact_events`.

## Proof record

For every production lifecycle test, record:

```txt
issue
PR
merge commit
Pages deployment
migration execution time
curator account UUID (private operator record only)
artifact ID
decision
resulting event IDs
anonymous/public verification
mobile-device verification
```

Do not publish account UUIDs, private media URLs, access tokens, or credential screenshots.
