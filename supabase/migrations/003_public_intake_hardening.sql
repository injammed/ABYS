-- AETIMM / SLOP TROUGH public intake hardening
-- Apply after 001_social_beta.sql.
--
-- Provides:
-- - database-enforced rolling submission limits
-- - maximum per-creator quarantine backlog
-- - storage object limits
-- - an emergency intake kill switch readable by the public client
--
-- Emergency close:
--   update public.intake_control
--   set intake_open = false, updated_at = now()
--   where id = 1;
--
-- Reopen:
--   update public.intake_control
--   set intake_open = true, updated_at = now()
--   where id = 1;

create table if not exists public.intake_control (
  id smallint primary key default 1 check (id = 1),
  intake_open boolean not null default true,
  daily_submission_limit integer not null default 5
    check (daily_submission_limit between 1 and 100),
  max_quarantine_per_creator integer not null default 25
    check (max_quarantine_per_creator between 1 and 500),
  max_storage_objects_per_creator integer not null default 100
    check (max_storage_objects_per_creator between 1 and 5000),
  updated_at timestamptz not null default now()
);

insert into public.intake_control (
  id,
  intake_open,
  daily_submission_limit,
  max_quarantine_per_creator,
  max_storage_objects_per_creator
)
values (1, true, 5, 25, 100)
on conflict (id) do nothing;

alter table public.intake_control enable row level security;

revoke all on public.intake_control from anon, authenticated;
grant select on public.intake_control to anon, authenticated;

drop policy if exists "intake status is publicly readable" on public.intake_control;
create policy "intake status is publicly readable"
  on public.intake_control for select
  using (true);

drop trigger if exists intake_control_touch_updated_at on public.intake_control;
create trigger intake_control_touch_updated_at
  before update on public.intake_control
  for each row execute procedure public.touch_updated_at();

create index if not exists artifacts_creator_intake_idx
  on public.artifacts (creator_id, created_at desc, status);

create or replace function public.enforce_artifact_intake_limits()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  config public.intake_control%rowtype;
  recent_submissions integer;
  quarantine_count integer;
begin
  if auth.uid() is null or new.creator_id <> auth.uid() then
    raise exception using
      errcode = 'P0001',
      message = 'INTAKE_IDENTITY_MISMATCH';
  end if;

  if new.status <> 'quarantine' or new.lane is not null or new.published_at is not null then
    raise exception using
      errcode = 'P0001',
      message = 'INTAKE_REQUIRES_PRIVATE_QUARANTINE';
  end if;

  -- Serialize intake checks for one creator so parallel inserts cannot race past limits.
  perform pg_advisory_xact_lock(hashtextextended(new.creator_id::text, 0));

  select * into config
  from public.intake_control
  where id = 1;

  if not found or not config.intake_open then
    raise exception using
      errcode = 'P0001',
      message = 'INTAKE_CLOSED';
  end if;

  select count(*)::integer into recent_submissions
  from public.artifacts
  where creator_id = new.creator_id
    and created_at >= now() - interval '24 hours';

  if recent_submissions >= config.daily_submission_limit then
    raise exception using
      errcode = 'P0001',
      message = 'DAILY_SUBMISSION_LIMIT_REACHED';
  end if;

  select count(*)::integer into quarantine_count
  from public.artifacts
  where creator_id = new.creator_id
    and status = 'quarantine';

  if quarantine_count >= config.max_quarantine_per_creator then
    raise exception using
      errcode = 'P0001',
      message = 'QUARANTINE_BACKLOG_LIMIT_REACHED';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_artifact_intake_limits() from public;

drop trigger if exists artifacts_enforce_intake_limits on public.artifacts;
create trigger artifacts_enforce_intake_limits
  before insert on public.artifacts
  for each row execute procedure public.enforce_artifact_intake_limits();

create or replace function public.can_accept_artifact_media(object_name text)
returns boolean
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  config public.intake_control%rowtype;
  current_user_id uuid := auth.uid();
  recent_objects integer;
  total_objects integer;
begin
  if current_user_id is null then
    return false;
  end if;

  if split_part(object_name, '/', 1) <> current_user_id::text then
    return false;
  end if;

  -- Serialize storage admission for one creator to reduce parallel-upload races.
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 1));

  select * into config
  from public.intake_control
  where id = 1;

  if not found or not config.intake_open then
    return false;
  end if;

  select count(*)::integer into recent_objects
  from storage.objects
  where bucket_id = 'artifact-media'
    and split_part(name, '/', 1) = current_user_id::text
    and created_at >= now() - interval '24 hours';

  if recent_objects >= config.daily_submission_limit then
    return false;
  end if;

  select count(*)::integer into total_objects
  from storage.objects
  where bucket_id = 'artifact-media'
    and split_part(name, '/', 1) = current_user_id::text;

  return total_objects < config.max_storage_objects_per_creator;
end;
$$;

revoke all on function public.can_accept_artifact_media(text) from public;
grant execute on function public.can_accept_artifact_media(text) to authenticated;

drop policy if exists "users upload into their own folder" on storage.objects;
create policy "users upload within controlled intake"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'artifact-media'
    and public.can_accept_artifact_media(name)
  );

-- Operator query: identify storage objects that never received an artifact row.
-- Delete orphaned objects only through the Storage API, never by deleting
-- storage.objects metadata directly.
create or replace view public.orphaned_artifact_media as
select
  objects.name as media_path,
  objects.created_at,
  objects.metadata
from storage.objects as objects
left join public.artifacts
  on artifacts.media_path = objects.name
where objects.bucket_id = 'artifact-media'
  and artifacts.id is null
  and objects.created_at < now() - interval '1 hour';

revoke all on public.orphaned_artifact_media from anon, authenticated;
