-- AETIMM / SLOP TROUGH one-click public Unjudged publication
-- Apply after 002, 003, 008, 009, and 010.
--
-- Product law:
--   account -> submit one Artifact -> server validates/binds it -> public Unjudged
--   Museum remains a later judgment/selection state.
--
-- The existing intake RPC still creates the Artifact as private quarantine first.
-- This AFTER INSERT trigger promotes it inside the same database transaction, so
-- no half-built public Artifact can be observed before its manifest transaction commits.

begin;

alter table public.intake_control
  add column if not exists automatic_unjudged_publication boolean not null default true;

alter table public.artifact_events
  drop constraint if exists artifact_events_event_type_check;

alter table public.artifact_events
  add constraint artifact_events_event_type_check
  check (
    event_type in (
      'submitted',
      'publish_unjudged',
      'request_revision',
      'resubmitted',
      'approve',
      'reject',
      'remove',
      'restore'
    )
  );

create or replace function public.auto_publish_artifact_unjudged()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  config public.intake_control%rowtype;
begin
  -- Only the authenticated creator path is eligible for automatic publication.
  if auth.uid() is null or new.creator_id <> auth.uid() then
    return new;
  end if;

  if new.status <> 'quarantine' or new.lane is not null or new.published_at is not null then
    return new;
  end if;

  select * into config
  from public.intake_control
  where id = 1;

  if not found or not config.intake_open then
    return new;
  end if;

  if not config.automatic_unjudged_publication then
    return new;
  end if;

  -- Browser-required checkboxes are not a trust boundary. Enforce the three
  -- publication attestations again on the server before anything becomes public.
  if not coalesce(new.ai_origin_attested, false)
    or not coalesce(new.safety_attested, false)
    or not coalesce(new.rights_attested, false)
  then
    raise exception using
      errcode = 'P0001',
      message = 'PUBLICATION_ATTESTATIONS_REQUIRED';
  end if;

  update public.artifacts
  set
    status = 'approved',
    lane = 'unjudged',
    published_at = now()
  where id = new.id
    and status = 'quarantine'
    and lane is null
    and published_at is null;

  if found then
    insert into public.artifact_events (
      artifact_id,
      actor_id,
      event_type,
      lane,
      note
    ) values (
      new.id,
      new.creator_id,
      'publish_unjudged',
      'unjudged',
      'Creator submission passed the intake contract and entered public Unjudged.'
    );
  end if;

  return new;
end;
$$;

revoke all on function public.auto_publish_artifact_unjudged() from public, anon, authenticated;

drop trigger if exists zz_artifacts_auto_publish_unjudged on public.artifacts;
create trigger zz_artifacts_auto_publish_unjudged
  after insert on public.artifacts
  for each row execute procedure public.auto_publish_artifact_unjudged();

commit;
