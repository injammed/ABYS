-- AETIMM / SLOP TROUGH Caechat selection rehearsal
-- Apply after 002_curator_submission_loop.sql and 003_public_intake_hardening.sql.
--
-- Lifecycle law:
--   quarantine approval -> public Unjudged
--   algorithm -> top-decile nomination
--   curator -> candidate / refinement / archive / reject
--   explicit second curator act -> Museum admission

begin;

-- ---------------------------------------------------------------------------
-- Lifecycle events
-- ---------------------------------------------------------------------------

alter table public.artifact_events
  drop constraint if exists artifact_events_event_type_check;

alter table public.artifact_events
  add constraint artifact_events_event_type_check
  check (
    event_type in (
      'submitted',
      'request_revision',
      'resubmitted',
      'approve',
      'reject',
      'remove',
      'restore',
      'selection_nominated',
      'selection_candidate',
      'selection_refinement',
      'selection_archive',
      'selection_reject',
      'museum_admit'
    )
  );

-- ---------------------------------------------------------------------------
-- First publication is always Unjudged
-- ---------------------------------------------------------------------------

create or replace function public.review_artifact(
  p_artifact_id uuid,
  p_decision text,
  p_lane text,
  p_note text
)
returns public.artifacts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target public.artifacts%rowtype;
  normalized_decision text := lower(trim(coalesce(p_decision, '')));
  normalized_note text := trim(coalesce(p_note, ''));
begin
  if auth.uid() is null then
    raise exception 'CURATOR_AUTH_REQUIRED';
  end if;

  if not public.current_user_is_curator() then
    raise exception 'CURATOR_ROLE_REQUIRED';
  end if;

  if char_length(normalized_note) < 3 or char_length(normalized_note) > 1200 then
    raise exception 'CURATOR_NOTE_REQUIRED';
  end if;

  if normalized_decision not in ('approve', 'request_revision', 'reject') then
    raise exception 'INVALID_REVIEW_DECISION';
  end if;

  select *
  into target
  from public.artifacts
  where id = p_artifact_id
  for update;

  if not found then
    raise exception 'ARTIFACT_NOT_FOUND';
  end if;

  if target.status <> 'quarantine' then
    raise exception 'ARTIFACT_NOT_REVIEWABLE';
  end if;

  if normalized_decision = 'approve' then
    if p_lane is distinct from 'unjudged' then
      raise exception 'INITIAL_PUBLICATION_REQUIRES_UNJUDGED';
    end if;

    update public.artifacts
    set
      status = 'approved',
      lane = 'unjudged',
      published_at = now()
    where id = p_artifact_id
    returning * into target;

    insert into public.artifact_events (artifact_id, actor_id, event_type, lane, note)
    values (p_artifact_id, auth.uid(), 'approve', 'unjudged', normalized_note);

  elsif normalized_decision = 'request_revision' then
    update public.artifacts
    set
      status = 'needs_revision',
      lane = null,
      published_at = null
    where id = p_artifact_id
    returning * into target;

    insert into public.artifact_events (artifact_id, actor_id, event_type, lane, note)
    values (p_artifact_id, auth.uid(), 'request_revision', null, normalized_note);

  else
    update public.artifacts
    set
      status = 'rejected',
      lane = null,
      published_at = null
    where id = p_artifact_id
    returning * into target;

    insert into public.artifact_events (artifact_id, actor_id, event_type, lane, note)
    values (p_artifact_id, auth.uid(), 'reject', null, normalized_note);
  end if;

  return target;
end;
$$;

revoke all on function public.review_artifact(uuid, text, text, text) from public;
grant execute on function public.review_artifact(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Selection evidence
-- ---------------------------------------------------------------------------

create table if not exists public.selection_runs (
  id uuid primary key default gen_random_uuid(),
  initiated_by uuid not null references public.profiles(id) on delete restrict,
  cohort_key text not null default 'approved:unjudged',
  lane text not null default 'unjudged' check (lane = 'unjudged'),
  min_judgments integer not null check (min_judgments between 1 and 1000),
  cohort_size integer not null check (cohort_size > 0),
  top_count integer not null check (top_count > 0 and top_count <= cohort_size),
  algorithm_version text not null default 'caechat-top-decile-v0',
  created_at timestamptz not null default now()
);

create table if not exists public.artifact_selection_reviews (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.selection_runs(id) on delete cascade,
  artifact_id uuid not null references public.artifacts(id) on delete cascade,
  cohort_rank integer not null check (cohort_rank > 0),
  cohort_size integer not null check (cohort_size > 0),
  percentile_band text not null default 'top_decile'
    check (percentile_band in ('top_decile', 'top_percentile')),
  selection_score double precision not null check (selection_score between 0 and 1),
  preserve_count bigint not null default 0 check (preserve_count >= 0),
  refine_count bigint not null default 0 check (refine_count >= 0),
  slop_count bigint not null default 0 check (slop_count >= 0),
  total_judgments bigint not null check (total_judgments > 0),
  status text not null default 'nominated'
    check (status in ('nominated', 'candidate', 'refinement', 'archive', 'rejected', 'museum_admitted')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  note text not null default 'Algorithmic top-decile nomination.'
    check (char_length(note) between 3 and 1200),
  algorithm_version text not null default 'caechat-top-decile-v0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, artifact_id)
);

create index if not exists selection_runs_created_idx
  on public.selection_runs (created_at desc, id desc);

create index if not exists selection_reviews_status_idx
  on public.artifact_selection_reviews (status, created_at desc, id desc);

create index if not exists selection_reviews_artifact_idx
  on public.artifact_selection_reviews (artifact_id, created_at desc, id desc);

alter table public.selection_runs enable row level security;
alter table public.artifact_selection_reviews enable row level security;

revoke all on public.selection_runs from anon, authenticated;
revoke all on public.artifact_selection_reviews from anon, authenticated;
grant select on public.selection_runs to authenticated;
grant select on public.artifact_selection_reviews to authenticated;

drop policy if exists "curators read selection runs" on public.selection_runs;
create policy "curators read selection runs"
  on public.selection_runs for select
  to authenticated
  using (public.current_user_is_curator());

drop policy if exists "curators read selection reviews" on public.artifact_selection_reviews;
create policy "curators read selection reviews"
  on public.artifact_selection_reviews for select
  to authenticated
  using (public.current_user_is_curator());

drop policy if exists "creators read own selection reviews" on public.artifact_selection_reviews;
create policy "creators read own selection reviews"
  on public.artifact_selection_reviews for select
  to authenticated
  using (
    exists (
      select 1
      from public.artifacts
      where artifacts.id = artifact_selection_reviews.artifact_id
        and artifacts.creator_id = auth.uid()
    )
  );

drop trigger if exists selection_reviews_touch_updated_at on public.artifact_selection_reviews;
create trigger selection_reviews_touch_updated_at
  before update on public.artifact_selection_reviews
  for each row execute procedure public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Confidence-adjusted selection
-- ---------------------------------------------------------------------------

create or replace function public.wilson_lower_bound(
  p_successes bigint,
  p_total bigint,
  p_z double precision default 1.96
)
returns double precision
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  n double precision := greatest(coalesce(p_total, 0), 0)::double precision;
  successes double precision := greatest(coalesce(p_successes, 0), 0)::double precision;
  phat double precision;
  z2 double precision := p_z * p_z;
begin
  if n <= 0 then
    return 0;
  end if;

  successes := least(successes, n);
  phat := successes / n;

  return greatest(
    0,
    (
      phat + z2 / (2 * n)
      - p_z * sqrt((phat * (1 - phat) + z2 / (4 * n)) / n)
    ) / (1 + z2 / n)
  );
end;
$$;

revoke all on function public.wilson_lower_bound(bigint, bigint, double precision) from public;

create or replace function public.get_top_decile_candidates(
  p_min_judgments integer default 3
)
returns table (
  artifact_id uuid,
  cohort_rank integer,
  cohort_size integer,
  selection_score double precision,
  preserve_count bigint,
  refine_count bigint,
  slop_count bigint,
  total_judgments bigint
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

  if p_min_judgments < 1 or p_min_judgments > 1000 then
    raise exception 'INVALID_MINIMUM_JUDGMENTS';
  end if;

  return query
  with vote_counts as (
    select
      artifacts.id as artifact_id,
      count(*) filter (where artifact_votes.judgment = 'preserve')::bigint as preserve_count,
      count(*) filter (where artifact_votes.judgment = 'refine')::bigint as refine_count,
      count(*) filter (where artifact_votes.judgment = 'slop')::bigint as slop_count,
      count(artifact_votes.artifact_id)::bigint as total_judgments
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
  ),
  scored as (
    select
      vote_counts.*,
      public.wilson_lower_bound(vote_counts.preserve_count, vote_counts.total_judgments) as selection_score
    from vote_counts
  ),
  ranked as (
    select
      scored.*,
      row_number() over (
        order by
          scored.selection_score desc,
          scored.total_judgments desc,
          scored.artifact_id asc
      )::integer as cohort_rank,
      count(*) over ()::integer as cohort_size
    from scored
  )
  select
    ranked.artifact_id,
    ranked.cohort_rank,
    ranked.cohort_size,
    ranked.selection_score,
    ranked.preserve_count,
    ranked.refine_count,
    ranked.slop_count,
    ranked.total_judgments
  from ranked
  where ranked.cohort_rank <= greatest(1, ceil(ranked.cohort_size * 0.10)::integer)
  order by ranked.cohort_rank;
end;
$$;

revoke all on function public.get_top_decile_candidates(integer) from public;
grant execute on function public.get_top_decile_candidates(integer) to authenticated;

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

-- ---------------------------------------------------------------------------
-- Curator selection review and Museum admission
-- ---------------------------------------------------------------------------

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

  if not found or target_artifact.status <> 'approved' then
    raise exception 'SELECTION_ARTIFACT_NOT_PUBLISHED';
  end if;

  if normalized_decision = 'museum_admit' then
    if target.status <> 'candidate' then
      raise exception 'SELECTION_CANDIDATE_REQUIRED';
    end if;

    if target_artifact.lane <> 'unjudged' then
      raise exception 'MUSEUM_ADMISSION_REQUIRES_UNJUDGED';
    end if;

    update public.artifacts
    set lane = 'aetimm'
    where id = target.artifact_id;

    next_status := 'museum_admitted';
    next_event := 'museum_admit';
  elsif normalized_decision = 'candidate' then
    next_status := 'candidate';
    next_event := 'selection_candidate';
  elsif normalized_decision = 'refinement' then
    next_status := 'refinement';
    next_event := 'selection_refinement';
  elsif normalized_decision = 'archive' then
    next_status := 'archive';
    next_event := 'selection_archive';
  else
    next_status := 'rejected';
    next_event := 'selection_reject';
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
    case when next_event = 'museum_admit' then 'aetimm' else target_artifact.lane end,
    normalized_note
  );

  return target;
end;
$$;

revoke all on function public.review_selection_candidate(bigint, text, text) from public;
grant execute on function public.review_selection_candidate(bigint, text, text) to authenticated;

create or replace function public.get_selection_review_queue()
returns table (
  selection_id bigint,
  artifact_id uuid,
  title text,
  creator_name text,
  media_path text,
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
