# Security Fold A — Vote Privacy Activation

## Objective

Public clients receive aggregate vote signal without access to account-level vote rows.

```txt
public → per-artifact counts
account → its own saved judgment
other accounts' raw rows → inaccessible
```

## Components

- `supabase/migrations/004_vote_privacy_aggregates.sql`
- `apps/item-web/lib/social-feed.ts`
- `apps/item-web/scripts/verify-vote-privacy.mjs`

## Release order

This fold changes the database API consumed by the feed. Do not release only one side.

1. Confirm a rollback window and preserve the current production commit SHA.
2. Run the repository contract locally or in CI:
   - `npm run verify:vote-privacy`
   - `npm run typecheck`
   - `npm run build`
3. Apply `004_vote_privacy_aggregates.sql` in the production Supabase SQL editor.
4. Immediately deploy the matching web commit.
5. Verify anonymously:
   - the feed loads;
   - scores still match the existing formula;
   - raw `artifact_votes` selects are denied.
6. Verify while signed in:
   - the account's prior judgments hydrate;
   - saving a vote works;
   - choosing again replaces the prior judgment;
   - signing into a second account does not reveal the first account's vote rows.
7. Keep the issue open until exact-device verification passes.

## Read-only production checks

Run as an anonymous client:

```sql
select artifact_id, voter_id, judgment
from public.artifact_votes
limit 1;
```

Expected: permission or row-access denial.

Run through the public RPC for known approved artifact IDs:

```sql
select *
from public.get_artifact_vote_aggregates(array[
  '<approved-artifact-uuid>'::uuid
]);
```

Expected: only `artifact_id`, `preserve_count`, `refine_count`, and `slop_count`.

As an authenticated account, querying `artifact_votes` must return only rows whose `voter_id = auth.uid()`.

## Rollback

If the web release fails after migration activation:

1. Restore the prior web commit only long enough to diagnose.
2. Be aware that the old client expects public raw vote access and may not calculate scores while the privacy policy remains active.
3. Preferred recovery is to repair or redeploy the aggregate-RPC client, not to reopen raw vote rows.

Emergency database rollback, only when service restoration outweighs the temporary privacy regression:

```sql
create policy "votes are publicly readable"
  on public.artifact_votes for select
  using (true);

grant select on public.artifact_votes to anon, authenticated;
```

Remove that emergency policy immediately after the aggregate client is restored. Record the incident and affected interval in the security issue.

## Residual risk

Aggregate counts remain public by design and may reveal that an artifact received activity. They do not reveal voter UUIDs or account-level judgment histories. Collusion, bot voting, timing correlation, and traffic analysis require later security folds.
