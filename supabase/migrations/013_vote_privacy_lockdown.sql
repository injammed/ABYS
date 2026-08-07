-- AETIMM / SLOP TROUGH raw-vote privacy lockdown
-- Apply only after migration 012 is live and the matching web client has deployed.
--
-- Security law:
--   public sees aggregate signal
--   an authenticated account sees its own judgment
--   nobody sees another account's raw vote row

begin;

drop policy if exists "votes are publicly readable" on public.artifact_votes;
drop policy if exists "users read their own votes" on public.artifact_votes;

create policy "users read their own votes"
  on public.artifact_votes for select
  to authenticated
  using (auth.uid() = voter_id);

revoke select on public.artifact_votes from anon, authenticated;
grant select (artifact_id, voter_id, judgment) on public.artifact_votes to authenticated;

commit;
