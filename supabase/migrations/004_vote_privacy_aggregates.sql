-- AETIMM / SLOP TROUGH vote privacy hardening
-- Apply after 001_social_beta.sql.
--
-- Security law:
--   public sees aggregate signal
--   an authenticated account sees its own judgment
--   nobody sees another account's raw vote row

begin;

-- Raw vote rows are not a public dataset. They contain a stable voter UUID and
-- an individual judgment that can be correlated across artifacts.
drop policy if exists "votes are publicly readable" on public.artifact_votes;
drop policy if exists "users read their own votes" on public.artifact_votes;

create policy "users read their own votes"
  on public.artifact_votes for select
  to authenticated
  using (auth.uid() = voter_id);

-- Make the intended table privilege explicit. RLS still limits each
-- authenticated account to its own rows, while anonymous clients receive no
-- raw-table SELECT privilege.
revoke select on public.artifact_votes from anon, authenticated;
grant select (artifact_id, voter_id, judgment) on public.artifact_votes to authenticated;

-- Public feed clients receive only bounded aggregate counts for approved
-- artifacts. The function never returns voter identifiers or per-account rows.
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

revoke all on function public.get_artifact_vote_aggregates(uuid[]) from public;
grant execute on function public.get_artifact_vote_aggregates(uuid[]) to anon, authenticated;

commit;
