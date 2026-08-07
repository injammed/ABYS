-- AETIMM / SLOP TROUGH independent binary judgment fold
-- Apply after 013_vote_privacy_lockdown.sql.
--
-- Public judgment law:
--   one authenticated account has at most one active judgment per Artifact
--   Museum and Slop are the only active choices
--   choosing again replaces the prior choice
--   not voting is silence / ignored
--
-- Accumulation law:
--   Museum does not subtract Slop
--   Slop does not subtract Museum
--   both counts only accrue upward as independent public signals
--   an Artifact may be Museum-admitted and TOP SLOP #1 simultaneously
--
-- Presentation law:
--   Top Slop rank may be shown in the trough
--   Museum presentation does not turn preservation into a competitive leaderboard
--
-- Historical note:
--   legacy `refine` rows are retained as historical neutral/abstention rows.
--   New INSERT/UPDATE operations cannot create `refine` judgments.

begin;

create or replace function public.enforce_binary_artifact_vote()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.judgment not in ('preserve', 'slop') then
    raise exception using
      errcode = 'P0001',
      message = 'BINARY_JUDGMENT_REQUIRED';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_binary_artifact_vote() from public, anon, authenticated;

drop trigger if exists artifact_votes_binary_judgment on public.artifact_votes;
create trigger artifact_votes_binary_judgment
before insert or update of judgment on public.artifact_votes
for each row
execute function public.enforce_binary_artifact_vote();

create or replace function public.get_artifact_binary_judgments(
  p_artifact_ids uuid[]
)
returns table (
  artifact_id uuid,
  museum_count bigint,
  slop_count bigint,
  total_binary_votes bigint
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
      message = 'BINARY_JUDGMENT_REQUEST_TOO_LARGE';
  end if;

  return query
  select
    artifacts.id as artifact_id,
    count(votes.artifact_id) filter (where votes.judgment = 'preserve')::bigint as museum_count,
    count(votes.artifact_id) filter (where votes.judgment = 'slop')::bigint as slop_count,
    count(votes.artifact_id) filter (where votes.judgment in ('preserve', 'slop'))::bigint as total_binary_votes
  from public.artifacts as artifacts
  left join public.artifact_votes as votes
    on votes.artifact_id = artifacts.id
  where artifacts.status = 'approved'
    and artifacts.id = any(p_artifact_ids)
  group by artifacts.id;
end;
$$;

revoke all on function public.get_artifact_binary_judgments(uuid[]) from public, anon, authenticated;
grant execute on function public.get_artifact_binary_judgments(uuid[]) to anon, authenticated;

create or replace function public.get_artifact_slop_ranks(
  p_artifact_ids uuid[]
)
returns table (
  artifact_id uuid,
  slop_rank bigint,
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
      message = 'SLOP_RANK_REQUEST_TOO_LARGE';
  end if;

  return query
  with slop_counts as (
    select
      artifacts.id as artifact_id,
      artifacts.published_at,
      count(votes.artifact_id) filter (where votes.judgment = 'slop')::bigint as slop_count
    from public.artifacts as artifacts
    left join public.artifact_votes as votes
      on votes.artifact_id = artifacts.id
    where artifacts.status = 'approved'
    group by artifacts.id, artifacts.published_at
  ),
  ranked as (
    select
      slop_counts.artifact_id,
      slop_counts.slop_count,
      row_number() over (
        order by
          slop_counts.slop_count desc,
          slop_counts.published_at asc nulls last,
          slop_counts.artifact_id asc
      )::bigint as slop_rank
    from slop_counts
    where slop_counts.slop_count > 0
  )
  select
    ranked.artifact_id,
    ranked.slop_rank,
    ranked.slop_count
  from ranked
  where ranked.artifact_id = any(p_artifact_ids);
end;
$$;

revoke all on function public.get_artifact_slop_ranks(uuid[]) from public, anon, authenticated;
grant execute on function public.get_artifact_slop_ranks(uuid[]) to anon, authenticated;

commit;
