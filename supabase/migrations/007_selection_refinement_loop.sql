-- AETIMM / SLOP TROUGH selection refinement closure
-- Apply after 006_selection_active_queue_guard.sql.
--
-- A selection refinement request must create an actionable creator state:
--   approved/unjudged -> needs_revision/private -> resubmit -> quarantine
--   -> curator republishes to unjudged -> selection review may continue.

begin;

create or replace function public.review_selection_candidate(
  p_selection_id bigint,
  p_decision text,
  p_note text
)
returns public.artifact_selection_reviews
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target public.artifact_selection_reviews%rowtype;
  target_artifact public.artifacts%rowtype;
  normalized_decision text := lower(trim(coalesce(p_decision, '')));
  normalized_note text := trim(coalesce(p_note, ''));
  next_status text;
  next_event text;
  next_lane text;
begin
  if auth.uid() is null or not public.current_user_is_curator() then
    raise exception 'CURATOR_ROLE_REQUIRED';
  end if;

  if normalized_decision not in ('candidate', 'refinement', 'archive', 'reject', 'museum_admit') then
    raise exception 'INVALID_SELECTION_DECISION';
  end if;

  if char_length(normalized_note) < 3 or char_length(normalized_note) > 1200 then
    raise exception 'SELECTION_NOTE_REQUIRED';
  end if;

  select *
  into target
  from public.artifact_selection_reviews
  where id = p_selection_id
  for update;

  if not found then
    raise exception 'SELECTION_REVIEW_NOT_FOUND';
  end if;

  if target.status in ('archive', 'rejected', 'museum_admitted') then
    raise exception 'SELECTION_REVIEW_FINALIZED';
  end if;

  select *
  into target_artifact
  from public.artifacts
  where id = target.artifact_id
  for update;

  if not found then
    raise exception 'SELECTION_ARTIFACT_NOT_FOUND';
  end if;

  if normalized_decision in ('candidate', 'refinement', 'museum_admit')
    and (
      target_artifact.status <> 'approved'
      or target_artifact.lane <> 'unjudged'
    )
  then
    raise exception 'SELECTION_ARTIFACT_NOT_PUBLISHED';
  end if;

  if normalized_decision = 'museum_admit' then
    if target.status <> 'candidate' then
      raise exception 'SELECTION_CANDIDATE_REQUIRED';
    end if;

    update public.artifacts
    set lane = 'aetimm'
    where id = target.artifact_id;

    next_status := 'museum_admitted';
    next_event := 'museum_admit';
    next_lane := 'aetimm';

  elsif normalized_decision = 'candidate' then
    next_status := 'candidate';
    next_event := 'selection_candidate';
    next_lane := 'unjudged';

  elsif normalized_decision = 'refinement' then
    update public.artifacts
    set
      status = 'needs_revision',
      lane = null,
      published_at = null
    where id = target.artifact_id;

    next_status := 'refinement';
    next_event := 'selection_refinement';
    next_lane := null;

  elsif normalized_decision = 'archive' then
    next_status := 'archive';
    next_event := 'selection_archive';
    next_lane := target_artifact.lane;

  else
    next_status := 'rejected';
    next_event := 'selection_reject';
    next_lane := target_artifact.lane;
  end if;

  update public.artifact_selection_reviews
  set
    status = next_status,
    reviewer_id = auth.uid(),
    note = normalized_note,
    updated_at = now()
  where id = p_selection_id
  returning * into target;

  insert into public.artifact_events (
    artifact_id,
    actor_id,
    event_type,
    lane,
    note
  ) values (
    target.artifact_id,
    auth.uid(),
    next_event,
    next_lane,
    normalized_note
  );

  return target;
end;
$$;

revoke all on function public.review_selection_candidate(bigint, text, text) from public;
grant execute on function public.review_selection_candidate(bigint, text, text) to authenticated;

-- PostgreSQL cannot change a RETURNS TABLE signature with CREATE OR REPLACE.
-- Drop the v0 queue reader before recreating it with artifact state columns.
drop function if exists public.get_selection_review_queue();

create function public.get_selection_review_queue()
returns table (
  selection_id bigint,
  artifact_id uuid,
  title text,
  creator_name text,
  media_path text,
  artifact_status text,
  artifact_lane text,
  cohort_rank integer,
  cohort_size integer,
  selection_score double precision,
  preserve_count bigint,
  refine_count bigint,
  slop_count bigint,
  total_judgments bigint,
  selection_status text,
  selection_note text,
  algorithm_version text,
  selected_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.current_user_is_curator() then
    raise exception 'CURATOR_ROLE_REQUIRED';
  end if;

  return query
  select
    reviews.id,
    artifacts.id,
    artifacts.title,
    profiles.display_name,
    artifacts.media_path,
    artifacts.status,
    artifacts.lane,
    reviews.cohort_rank,
    reviews.cohort_size,
    reviews.selection_score,
    reviews.preserve_count,
    reviews.refine_count,
    reviews.slop_count,
    reviews.total_judgments,
    reviews.status,
    reviews.note,
    reviews.algorithm_version,
    reviews.created_at
  from public.artifact_selection_reviews reviews
  join public.artifacts
    on artifacts.id = reviews.artifact_id
  join public.profiles
    on profiles.id = artifacts.creator_id
  where reviews.status in ('nominated', 'candidate', 'refinement')
  order by reviews.created_at asc, reviews.id asc;
end;
$$;

revoke all on function public.get_selection_review_queue() from public;
grant execute on function public.get_selection_review_queue() to authenticated;

commit;
