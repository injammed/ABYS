-- AETIMM / SLOP TROUGH universal artifact review
-- Apply after 002_curator_submission_loop.sql, 003_public_intake_hardening.sql,
-- and 008_universal_artifact_intake.sql.

begin;

-- Creators may refine the true-nature description while private. Parts remain
-- immutable in this fold; replacing/branching parts is a later lineage fold.
revoke update on public.artifacts from authenticated;
grant update (
  title,
  summary,
  artifact_description,
  origin_class,
  generator,
  human_role,
  provenance_note,
  ai_origin_attested,
  safety_attested,
  rights_attested
) on public.artifacts to authenticated;

-- Curators need the complete private manifest, not only the legacy lead image.
drop policy if exists "curators read all artifact parts" on public.artifact_parts;
create policy "curators read all artifact parts"
  on public.artifact_parts for select
  to authenticated
  using (public.current_user_is_curator());

-- First publication has one destination: public Unjudged. The algorithm and
-- later curator selection process may move it toward the Museum after evidence.
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

commit;
