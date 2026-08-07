-- AETIMM / SLOP TROUGH inverse-ranking fold
-- Slop may carry a public rank scar. Museum presentation never does.
--
-- Privacy law:
--   rank is derived from aggregate judgments only
--   no voter identity is returned
--
-- Feed law:
--   rank is presentation metadata, not the mutable infinite-scroll cursor

begin;

create or replace function public.get_artifact_slop_ranks(
  p_artifact_ids uuid[]
)
returns table (
  artifact_id uuid,
  slop_rank bigint,
  slop_count bigint,
  total_votes bigint
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
      message = 'SLOP_RANK_REQUEST_TOO_LARGE';
  end if;

  return query
  with vote_counts as (
    select
      artifacts.id as artifact_id,
      artifacts.published_at,
      count(votes.artifact_id) filter (where votes.judgment = 'slop')::bigint as slop_count,
      count(votes.artifact_id)::bigint as total_votes
    from public.artifacts as artifacts
    left join public.artifact_votes as votes
      on votes.artifact_id = artifacts.id
    where artifacts.status = 'approved'
      and artifacts.lane <> 'aetimm'
    group by artifacts.id, artifacts.published_at
  ),
  ranked as (
    select
      vote_counts.artifact_id,
      vote_counts.slop_count,
      vote_counts.total_votes,
      row_number() over (
        order by
          vote_counts.slop_count desc,
          (vote_counts.slop_count::numeric / nullif(vote_counts.total_votes, 0)) desc nulls last,
          vote_counts.total_votes desc,
          vote_counts.published_at asc nulls last,
          vote_counts.artifact_id asc
      )::bigint as slop_rank
    from vote_counts
    where vote_counts.slop_count > 0
  )
  select
    ranked.artifact_id,
    ranked.slop_rank,
    ranked.slop_count,
    ranked.total_votes
  from ranked
  where ranked.artifact_id = any(p_artifact_ids);
end;
$$;

revoke all on function public.get_artifact_slop_ranks(uuid[]) from public, anon, authenticated;
grant execute on function public.get_artifact_slop_ranks(uuid[]) to anon, authenticated;

commit;
