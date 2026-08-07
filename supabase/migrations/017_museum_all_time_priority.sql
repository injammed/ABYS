-- AETIMM Museum all-time priority
-- Apply after 015_museum_accession_lifecycle.sql.
--
-- Museum admission priority has no time window, velocity, age bonus, or
-- recency factor. Current all-time Museum vote count is the only ranking
-- signal. Artifact UUID is used only as a deterministic tie-breaker.

begin;

create or replace function public.refresh_museum_accessions()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  config public.museum_control%rowtype;
  total_museum_votes bigint;
  issued_accessions bigint;
  unlocked_slots bigint;
  candidate_id uuid;
  candidate_museum_votes bigint;
  candidate_slop_votes bigint;
begin
  select *
  into config
  from public.museum_control
  where id = 1
  for update;

  if not found or not config.admission_open then
    return;
  end if;

  select count(*)::bigint
  into total_museum_votes
  from public.artifact_votes as votes
  inner join public.artifacts as artifacts
    on artifacts.id = votes.artifact_id
   and artifacts.status = 'approved'
  where votes.judgment = 'preserve';

  select count(*)::bigint
  into issued_accessions
  from public.museum_accessions;

  unlocked_slots := least(
    greatest(
      floor(total_museum_votes::numeric / config.museum_votes_per_accession)::bigint - issued_accessions,
      0
    ),
    25
  );

  while unlocked_slots > 0 loop
    select
      artifacts.id,
      count(votes.artifact_id) filter (where votes.judgment = 'preserve')::bigint,
      count(votes.artifact_id) filter (where votes.judgment = 'slop')::bigint
    into
      candidate_id,
      candidate_museum_votes,
      candidate_slop_votes
    from public.artifacts as artifacts
    left join public.artifact_votes as votes
      on votes.artifact_id = artifacts.id
    left join public.museum_accessions as accessions
      on accessions.artifact_id = artifacts.id
    where artifacts.status = 'approved'
      and accessions.artifact_id is null
    group by artifacts.id
    having count(votes.artifact_id) filter (where votes.judgment = 'preserve') >= config.minimum_candidate_museum_votes
    order by
      count(votes.artifact_id) filter (where votes.judgment = 'preserve') desc,
      artifacts.id asc
    limit 1;

    if candidate_id is null then
      exit;
    end if;

    insert into public.museum_accessions (
      artifact_id,
      museum_votes_at_accession,
      slop_votes_at_accession,
      admission_rule
    ) values (
      candidate_id,
      candidate_museum_votes,
      candidate_slop_votes,
      'community_vote_slot_v1'
    )
    on conflict (artifact_id) do nothing;

    update public.artifacts
    set lane = 'aetimm'
    where id = candidate_id
      and status = 'approved';

    unlocked_slots := unlocked_slots - 1;
    candidate_id := null;
  end loop;

  update public.museum_control
  set updated_at = now()
  where id = 1;
end;
$$;

revoke all on function public.refresh_museum_accessions() from public, anon, authenticated;

commit;
