-- AETIMM Museum live Summit
-- Apply after 015_museum_accession_lifecycle.sql.
--
-- Product law:
--   the Summit is not a permanent accession
--   it is the single public Artifact with the most all-time Museum judgments
--   one Museum judgment is enough to hold the Summit when no Artifact has more
--   zero-vote Artifacts are never crowned
--   no trending window, recency boost, ratio, or Slop subtraction participates
--   permanent accession remains governed independently by museum_control

begin;

create or replace function public.get_museum_summit()
returns table (
  artifact_id uuid,
  museum_votes bigint,
  slop_votes bigint,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    artifacts.id as artifact_id,
    count(votes.artifact_id) filter (where votes.judgment = 'preserve')::bigint as museum_votes,
    count(votes.artifact_id) filter (where votes.judgment = 'slop')::bigint as slop_votes,
    artifacts.published_at
  from public.artifacts as artifacts
  left join public.artifact_votes as votes
    on votes.artifact_id = artifacts.id
  where artifacts.status = 'approved'
    and artifacts.published_at is not null
  group by artifacts.id, artifacts.published_at
  having count(votes.artifact_id) filter (where votes.judgment = 'preserve') > 0
  order by
    count(votes.artifact_id) filter (where votes.judgment = 'preserve') desc,
    artifacts.published_at asc,
    artifacts.id asc
  limit 1;
$$;

revoke all on function public.get_museum_summit() from public, anon, authenticated;
grant execute on function public.get_museum_summit() to anon, authenticated;

commit;
