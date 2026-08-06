-- AETIMM / SLOP TROUGH curator submission-loop closure
-- Apply after 001_social_beta.sql and before enabling curator publication.

begin;

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists role text not null default 'creator';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('creator', 'curator', 'admin'));

-- Owners may edit only their display name. Role assignment remains a trusted
-- SQL/admin operation and cannot be self-promoted through the browser client.
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

create or replace function public.current_user_is_curator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('curator', 'admin')
  );
$$;

revoke all on function public.current_user_is_curator() from public;
grant execute on function public.current_user_is_curator() to authenticated;

-- ---------------------------------------------------------------------------
-- Artifact lifecycle
-- ---------------------------------------------------------------------------

alter table public.artifacts
  drop constraint if exists artifacts_status_check;

alter table public.artifacts
  add constraint artifacts_status_check
  check (status in ('quarantine', 'needs_revision', 'approved', 'rejected', 'removed'));

alter table public.artifacts
  drop constraint if exists publication_state_consistent;

alter table public.artifacts
  add constraint publication_state_consistent
  check (
    (status = 'approved' and published_at is not null and lane is not null)
    or
    (status <> 'approved' and published_at is null and lane is null)
  );

-- Creators may edit descriptive fields while an artifact is in quarantine or
-- needs revision, but cannot directly alter status, lane, creator, media path,
-- or publication time.
revoke update on public.artifacts from authenticated;
grant update (
  title,
  summary,
  origin_class,
  generator,
  human_role,
  provenance_note,
  ai_origin_attested,
  safety_attested,
  rights_attested
) on public.artifacts to authenticated;

-- Replace the original creator-edit policy with lifecycle-aware editing.
drop policy if exists "creators edit only quarantined submissions" on public.artifacts;
drop policy if exists "creators edit eligible private submissions" on public.artifacts;

create policy "creators edit eligible private submissions"
  on public.artifacts for update
  to authenticated
  using (
    auth.uid() = creator_id
    and status in ('quarantine', 'needs_revision')
  )
  with check (
    auth.uid() = creator_id
    and status in ('quarantine', 'needs_revision')
    and lane is null
    and published_at is null
  );

-- Curators can inspect all artifact states through RLS, including private
-- quarantine and revision records. Anonymous users still see only approved.
drop policy if exists "curators read all artifacts" on public.artifacts;
create policy "curators read all artifacts"
  on public.artifacts for select
  to authenticated
  using (public.current_user_is_curator());

-- Curators need read access to private media through signed URLs.
drop policy if exists "curators read all artifact media" on storage.objects;
create policy "curators read all artifact media"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'artifact-media'
    and public.current_user_is_curator()
  );

-- ---------------------------------------------------------------------------
-- Append-only lifecycle evidence
-- ---------------------------------------------------------------------------

create table if not exists public.artifact_events (
  id bigint generated always as identity primary key,
  artifact_id uuid not null references public.artifacts(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (
    event_type in (
      'submitted',
      'request_revision',
      'resubmitted',
      'approve',
      'reject',
      'remove',
      'restore'
    )
  ),
  lane text check (lane in ('aetimm', 'slatra', 'unjudged')),
  note text not null check (char_length(note) between 3 and 1200),
  created_at timestamptz not null default now()
);

create index if not exists artifact_events_artifact_idx
  on public.artifact_events (artifact_id, created_at desc, id desc);

alter table public.artifact_events enable row level security;

revoke all on public.artifact_events from anon, authenticated;
grant select on public.artifact_events to authenticated;

drop policy if exists "creators read own artifact events" on public.artifact_events;
create policy "creators read own artifact events"
  on public.artifact_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.artifacts
      where artifacts.id = artifact_events.artifact_id
        and artifacts.creator_id = auth.uid()
    )
  );

drop policy if exists "curators read all artifact events" on public.artifact_events;
create policy "curators read all artifact events"
  on public.artifact_events for select
  to authenticated
  using (public.current_user_is_curator());

create or replace function public.record_artifact_submission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.artifact_events (
    artifact_id,
    actor_id,
    event_type,
    lane,
    note
  ) values (
    new.id,
    new.creator_id,
    'submitted',
    null,
    'Submitted to private quarantine.'
  );

  return new;
end;
$$;

revoke all on function public.record_artifact_submission() from public;

drop trigger if exists artifacts_record_submission on public.artifacts;
create trigger artifacts_record_submission
  after insert on public.artifacts
  for each row execute procedure public.record_artifact_submission();

-- Backfill a submission event for pre-migration artifacts without history.
insert into public.artifact_events (artifact_id, actor_id, event_type, lane, note, created_at)
select
  artifacts.id,
  artifacts.creator_id,
  'submitted',
  null,
  'Submitted before lifecycle history was activated.',
  artifacts.created_at
from public.artifacts
where not exists (
  select 1
  from public.artifact_events
  where artifact_events.artifact_id = artifacts.id
    and artifact_events.event_type = 'submitted'
);

-- Preserve any earlier moderation history in the generalized append-only table.
insert into public.artifact_events (artifact_id, actor_id, event_type, lane, note, created_at)
select
  moderation_events.artifact_id,
  moderation_events.actor_id,
  moderation_events.decision,
  moderation_events.lane,
  moderation_events.note,
  moderation_events.created_at
from public.moderation_events
where moderation_events.decision in ('approve', 'reject', 'remove', 'restore')
  and not exists (
    select 1
    from public.artifact_events
    where artifact_events.artifact_id = moderation_events.artifact_id
      and artifact_events.event_type = moderation_events.decision
      and artifact_events.created_at = moderation_events.created_at
  );

-- ---------------------------------------------------------------------------
-- Atomic curator review
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
set search_path = public
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
    if p_lane not in ('aetimm', 'slatra', 'unjudged') then
      raise exception 'APPROVAL_LANE_REQUIRED';
    end if;

    update public.artifacts
    set
      status = 'approved',
      lane = p_lane,
      published_at = now()
    where id = p_artifact_id
    returning * into target;

    insert into public.artifact_events (artifact_id, actor_id, event_type, lane, note)
    values (p_artifact_id, auth.uid(), 'approve', p_lane, normalized_note);

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
-- Atomic creator resubmission
-- ---------------------------------------------------------------------------

create or replace function public.resubmit_artifact(p_artifact_id uuid)
returns public.artifacts
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.artifacts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'CREATOR_AUTH_REQUIRED';
  end if;

  select *
  into target
  from public.artifacts
  where id = p_artifact_id
  for update;

  if not found then
    raise exception 'ARTIFACT_NOT_FOUND';
  end if;

  if target.creator_id <> auth.uid() then
    raise exception 'ARTIFACT_OWNER_REQUIRED';
  end if;

  if target.status <> 'needs_revision' then
    raise exception 'ARTIFACT_NOT_READY_FOR_RESUBMISSION';
  end if;

  update public.artifacts
  set
    status = 'quarantine',
    lane = null,
    published_at = null
  where id = p_artifact_id
  returning * into target;

  insert into public.artifact_events (artifact_id, actor_id, event_type, lane, note)
  values (
    p_artifact_id,
    auth.uid(),
    'resubmitted',
    null,
    'Creator revised the artifact and resubmitted it for review.'
  );

  return target;
end;
$$;

revoke all on function public.resubmit_artifact(uuid) from public;
grant execute on function public.resubmit_artifact(uuid) to authenticated;

commit;
