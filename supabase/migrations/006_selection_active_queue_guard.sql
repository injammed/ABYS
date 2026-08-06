-- AETIMM / SLOP TROUGH selection queue guard
-- Apply immediately after 005_caechat_selection_rehearsal.sql.
--
-- One active nomination queue must be resolved before another run begins.

begin;

create or replace function public.nominate_top_decile(
  p_min_judgments integer default 3
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_run_id uuid := gen_random_uuid();
  cohort_count integer;
  selected_count integer;
begin
  if auth.uid() is null or not public.current_user_is_curator() then
    raise exception 'CURATOR_ROLE_REQUIRED';
  end if;

  if p_min_judgments < 1 or p_min_judgments > 1000 then
    raise exception 'INVALID_MINIMUM_JUDGMENTS';
  end if;

  if exists (
    select 1
    from public.artifact_selection_reviews
    where status in ('nominated', 'candidate', 'refinement')
  ) then
    raise exception 'ACTIVE_SELECTION_REVIEWS_EXIST';
  end if;

  select count(*)::integer
  into cohort_count
  from (
    select artifacts.id
    from public.artifacts
    left join public.artifact_votes
      on artifact_votes.artifact_id = artifacts.id
    where artifacts.status = 'approved'
      and artifacts.lane = 'unjudged'
      and artifacts.ai_origin_attested
      and artifacts.safety_attested
      and artifacts.rights_attested
    group by artifacts.id
    having count(artifact_votes.artifact_id) >= p_min_judgments
  ) eligible;

  if cohort_count = 0 then
    raise exception 'NO_ELIGIBLE_SELECTION_COHORT';
  end if;

  selected_count := greatest(1, ceil(cohort_count * 0.10)::integer);

  insert into public.selection_runs (
    id,
    initiated_by,
    min_judgments,
    cohort_size,
    top_count
  ) values (
    new_run_id,
    auth.uid(),
    p_min_judgments,
    cohort_count,
    selected_count
  );

  insert into public.artifact_selection_reviews (
    run_id,
    artifact_id,
    cohort_rank,
    cohort_size,
    percentile_band,
    selection_score,
    preserve_count,
    refine_count,
    slop_count,
    total_judgments,
    status,
    reviewer_id,
    note,
    algorithm_version
  )
  select
    new_run_id,
    candidates.artifact_id,
    candidates.cohort_rank,
    candidates.cohort_size,
    'top_decile',
    candidates.selection_score,
    candidates.preserve_count,
    candidates.refine_count,
    candidates.slop_count,
    candidates.total_judgments,
    'nominated',
    auth.uid(),
    format(
      'Top-decile nomination: rank %s of %s using confidence-adjusted Preserve signal.',
      candidates.cohort_rank,
      candidates.cohort_size
    ),
    'caechat-top-decile-v0'
  from public.get_top_decile_candidates(p_min_judgments) candidates;

  insert into public.artifact_events (
    artifact_id,
    actor_id,
    event_type,
    lane,
    note
  )
  select
    reviews.artifact_id,
    auth.uid(),
    'selection_nominated',
    'unjudged',
    reviews.note
  from public.artifact_selection_reviews reviews
  where reviews.run_id = new_run_id;

  return new_run_id;
end;
$$;

revoke all on function public.nominate_top_decile(integer) from public;
grant execute on function public.nominate_top_decile(integer) to authenticated;

commit;
