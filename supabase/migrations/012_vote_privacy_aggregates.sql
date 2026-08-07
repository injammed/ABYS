-- AETIMM / SLOP TROUGH vote privacy hardening
-- Apply after the social beta schema and the one-click publication fold.
--
-- Security law:
--   public sees aggregate signal
--   an authenticated account sees its own judgment
--   nobody sees another account's raw vote row

begin;

-- Raw vote rows contain a stable voter UUID and must not be a public dataset.
drop policy if exists "votes are publicly readable" on public.artifact_votes;
drop policy if exists "users read their own votes" on public.artifact_votes;

create policy "users read their own votes"
  on public.artifact_votes for select
  to authenticated
  using (auth.uid() = voter_id);

revoke select on public.artifact_votes from anon, authenticated;
grant select (artifact_id, voter_id, judgment) on public.artifact_votes to authenticated;

create or replace function public.get_artifact_vote_aggregates(
  p_artifact_ids uuid[]
)
returns table (
  artifact_id uuid,
  preserve_count bigint,
  refine_count bigint,
  slop_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  requested_count integer := coalesce(cardinality(p_artifact_ids), 0);
begin
  if requested_count = 0 then
    return;
  end if;

  if requested_count > 100 then
    raise exception using
      errcode = 'P0001',
      message = 'VOTE_AGGREGATE_REQUEST_TOO_LARGE';
  end if;

  return query
  select
    votes.artifact_id,
    count(*) filter (where votes.judgment = 'preserve')::bigint as preserve_count,
    count(*) filter (where votes.judgment = 'refine')::bigint as refine_count,
    count(*) filter (where votes.judgment = 'slop')::bigint as slop_count
  from public.artifact_votes as votes
  inner join public.artifacts as artifacts
    on artifacts.id = votes.artifact_id
   and artifacts.status = 'approved'
  where votes.artifact_id = any(p_artifact_ids)
  group by votes.artifact_id;
end;
$$;

revoke all on function public.get_artifact_vote_aggregates(uuid[]) from public, anon, authenticated;
grant execute on function public.get_artifact_vote_aggregates(uuid[]) to anon, authenticated;

commit;
