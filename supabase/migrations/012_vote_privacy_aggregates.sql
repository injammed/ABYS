-- AETIMM / SLOP TROUGH vote aggregate compatibility stage
-- Apply before deploying the client that consumes aggregate vote counts.
--
-- This migration is intentionally additive. It creates the safe aggregate RPC
-- while leaving the legacy raw-vote read policy untouched for the brief client
-- cutover window. Migration 013 removes that legacy access after the matching
-- web client is confirmed live.

begin;

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
