-- AETIMM / SLOP TROUGH universal artifact intake
-- Apply after 003_public_intake_hardening.sql.
-- Independent of selection migrations 005-007.
--
-- One artifact may contain multiple ordered parts and multiple modes.
-- Uploaded code, models, archives, simulations and URLs are inert evidence:
-- this migration never executes or fetches submitted content.

begin;

-- ---------------------------------------------------------------------------
-- Universal artifact envelope
-- ---------------------------------------------------------------------------

alter table public.artifacts
  add column if not exists artifact_description text;

update public.artifacts
set artifact_description = case
  when char_length(summary) >= 20 then summary
  else summary || ' · legacy artifact description'
end
where artifact_description is null;

alter table public.artifacts
  alter column artifact_description set not null;

alter table public.artifacts
  drop constraint if exists artifacts_artifact_description_check;

alter table public.artifacts
  add constraint artifacts_artifact_description_check
  check (char_length(artifact_description) between 20 and 4000);

alter table public.artifacts
  add column if not exists artifact_modes text[] not null default array['image']::text[];

alter table public.artifacts
  drop constraint if exists artifacts_artifact_modes_check;

alter table public.artifacts
  add constraint artifacts_artifact_modes_check
  check (
    cardinality(artifact_modes) between 1 and 12
    and artifact_modes <@ array[
      'image','video','audio','text','document','code','data',
      'model3d','website','simulation','mixed','other'
    ]::text[]
  );

alter table public.artifacts
  alter column media_path drop not null;

alter table public.artifacts
  drop constraint if exists artifacts_media_type_check;

alter table public.artifacts
  add constraint artifacts_media_type_check
  check (
    media_type in (
      'image','video','audio','text','document','code','data',
      'model3d','website','simulation','mixed','other'
    )
  );

-- ---------------------------------------------------------------------------
-- Ordered artifact parts
-- ---------------------------------------------------------------------------

create table if not exists public.artifact_parts (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.artifacts(id) on delete cascade,
  position integer not null check (position between 0 and 63),
  part_kind text not null check (part_kind in ('file','text','reference')),
  mode text not null check (
    mode in (
      'image','video','audio','text','document','code','data',
      'model3d','website','simulation','other'
    )
  ),
  label text not null default '' check (char_length(label) <= 200),
  storage_path text,
  original_filename text,
  mime_type text,
  byte_size bigint check (byte_size is null or byte_size between 0 and 52428800),
  text_content text,
  reference_url text,
  created_at timestamptz not null default now(),
  unique (artifact_id, position),
  unique (storage_path),
  constraint artifact_part_payload_check check (
    (
      part_kind = 'file'
      and storage_path is not null
      and original_filename is not null
      and mime_type is not null
      and byte_size is not null
      and text_content is null
      and reference_url is null
    )
    or
    (
      part_kind = 'text'
      and storage_path is null
      and text_content is not null
      and char_length(text_content) between 1 and 20000
      and reference_url is null
    )
    or
    (
      part_kind = 'reference'
      and storage_path is null
      and text_content is null
      and reference_url is not null
      and char_length(reference_url) between 8 and 2000
    )
  )
);

create index if not exists artifact_parts_artifact_position_idx
  on public.artifact_parts (artifact_id, position);

alter table public.artifact_parts enable row level security;

revoke all on public.artifact_parts from anon, authenticated;
grant select on public.artifact_parts to anon, authenticated;

create policy "artifact parts follow artifact visibility"
  on public.artifact_parts for select
  using (
    exists (
      select 1
      from public.artifacts
      where artifacts.id = artifact_parts.artifact_id
        and (
          artifacts.status = 'approved'
          or artifacts.creator_id = auth.uid()
        )
    )
  );

-- Writes occur only through the atomic intake RPC below. This avoids creating
-- an artifact row whose part manifest is only partially inserted.

-- ---------------------------------------------------------------------------
-- Atomic manifest creation after private Storage uploads
-- ---------------------------------------------------------------------------

create or replace function public.create_quarantined_artifact(
  p_artifact_id uuid,
  p_title text,
  p_summary text,
  p_artifact_description text,
  p_artifact_modes text[],
  p_origin_class text,
  p_generator text,
  p_human_role text,
  p_provenance_note text,
  p_ai_origin_attested boolean,
  p_safety_attested boolean,
  p_rights_attested boolean,
  p_parts jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  uid uuid := auth.uid();
  part jsonb;
  part_count integer;
  image_preview_path text;
  normalized_modes text[];
begin
  if uid is null then
    raise exception 'ARTIFACT_AUTH_REQUIRED';
  end if;

  if p_artifact_id is null then
    raise exception 'ARTIFACT_ID_REQUIRED';
  end if;

  if jsonb_typeof(p_parts) <> 'array' then
    raise exception 'ARTIFACT_PARTS_ARRAY_REQUIRED';
  end if;

  part_count := jsonb_array_length(p_parts);
  if part_count < 1 or part_count > 12 then
    raise exception 'ARTIFACT_PART_COUNT_INVALID';
  end if;

  normalized_modes := array(
    select distinct lower(trim(mode))
    from unnest(p_artifact_modes) as mode
    where trim(mode) <> ''
    order by lower(trim(mode))
  );

  if cardinality(normalized_modes) < 1
    or not normalized_modes <@ array[
      'image','video','audio','text','document','code','data',
      'model3d','website','simulation','mixed','other'
    ]::text[]
  then
    raise exception 'ARTIFACT_MODES_INVALID';
  end if;

  if char_length(trim(coalesce(p_artifact_description, ''))) < 20 then
    raise exception 'ARTIFACT_DESCRIPTION_REQUIRED';
  end if;

  -- Validate every file path belongs to the caller and this artifact before
  -- any database rows are created. URLs remain references; they are not fetched.
  for part in select value from jsonb_array_elements(p_parts)
  loop
    if (part ->> 'part_kind') = 'file' then
      if coalesce(part ->> 'storage_path', '') not like uid::text || '/' || p_artifact_id::text || '/%' then
        raise exception 'ARTIFACT_PART_STORAGE_PATH_INVALID';
      end if;

      if not exists (
        select 1
        from storage.objects
        where bucket_id = 'artifact-media'
          and name = part ->> 'storage_path'
          and split_part(name, '/', 1) = uid::text
      ) then
        raise exception 'ARTIFACT_PART_STORAGE_OBJECT_MISSING';
      end if;
    end if;
  end loop;

  -- Legacy feed rendering uses artifacts.media_path as an image preview. Keep
  -- that field image-only; non-image and text-only artifacts render as rich
  -- textual cards until later modality renderers are folded in.
  select part ->> 'storage_path'
  into image_preview_path
  from jsonb_array_elements(p_parts) as part
  where part ->> 'part_kind' = 'file'
    and part ->> 'mode' = 'image'
  order by coalesce((part ->> 'position')::integer, 0)
  limit 1;

  insert into public.artifacts (
    id,
    creator_id,
    title,
    summary,
    artifact_description,
    artifact_modes,
    origin_class,
    generator,
    human_role,
    provenance_note,
    media_path,
    media_type,
    status,
    lane,
    published_at,
    ai_origin_attested,
    safety_attested,
    rights_attested
  ) values (
    p_artifact_id,
    uid,
    trim(p_title),
    trim(p_summary),
    trim(p_artifact_description),
    normalized_modes,
    p_origin_class,
    trim(p_generator),
    trim(p_human_role),
    trim(p_provenance_note),
    image_preview_path,
    case
      when cardinality(normalized_modes) > 1 then 'mixed'
      else normalized_modes[1]
    end,
    'quarantine',
    null,
    null,
    p_ai_origin_attested,
    p_safety_attested,
    p_rights_attested
  );

  insert into public.artifact_parts (
    artifact_id,
    position,
    part_kind,
    mode,
    label,
    storage_path,
    original_filename,
    mime_type,
    byte_size,
    text_content,
    reference_url
  )
  select
    p_artifact_id,
    coalesce((part ->> 'position')::integer, ordinality::integer - 1),
    part ->> 'part_kind',
    part ->> 'mode',
    left(coalesce(part ->> 'label', ''), 200),
    nullif(part ->> 'storage_path', ''),
    nullif(part ->> 'original_filename', ''),
    nullif(part ->> 'mime_type', ''),
    nullif(part ->> 'byte_size', '')::bigint,
    nullif(part ->> 'text_content', ''),
    nullif(part ->> 'reference_url', '')
  from jsonb_array_elements(p_parts) with ordinality as manifest(part, ordinality);

  return p_artifact_id;
end;
$$;

revoke all on function public.create_quarantined_artifact(
  uuid,text,text,text,text[],text,text,text,text,boolean,boolean,boolean,jsonb
) from public;
grant execute on function public.create_quarantined_artifact(
  uuid,text,text,text,text[],text,text,text,text,boolean,boolean,boolean,jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: broader inert originals, still private and bounded
-- ---------------------------------------------------------------------------

update storage.buckets
set
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'image/jpeg','image/png','image/webp','image/gif',
    'video/mp4','video/webm','video/quicktime',
    'audio/mpeg','audio/wav','audio/x-wav','audio/ogg','audio/mp4',
    'application/pdf',
    'text/plain','text/markdown','text/csv','text/html','text/css','text/javascript',
    'application/javascript','application/typescript','application/json','application/xml','text/xml',
    'application/zip','application/x-zip-compressed','application/gzip','application/x-tar',
    'model/gltf+json','model/gltf-binary',
    'application/octet-stream'
  ]
where id = 'artifact-media';

-- Multi-part artifacts can legitimately upload several objects before the one
-- artifact row is atomically created. The daily artifact limit remains enforced
-- by artifacts_enforce_intake_limits; Storage is bounded by the separate object cap.
create or replace function public.can_accept_artifact_media(object_name text)
returns boolean
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
declare
  config public.intake_control%rowtype;
  current_user_id uuid := auth.uid();
  total_objects integer;
begin
  if current_user_id is null then
    return false;
  end if;

  if split_part(object_name, '/', 1) <> current_user_id::text then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 1));

  select * into config
  from public.intake_control
  where id = 1;

  if not found or not config.intake_open then
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

-- Public/owner read now recognizes any file part, not only artifacts.media_path.
drop policy if exists "owners and public approved artifacts can read media" on storage.objects;
create policy "owners and public approved artifact parts can read media"
  on storage.objects for select
  using (
    bucket_id = 'artifact-media'
    and (
      split_part(name, '/', 1) = auth.uid()::text
      or exists (
        select 1
        from public.artifacts
        where artifacts.media_path = storage.objects.name
          and artifacts.status = 'approved'
      )
      or exists (
        select 1
        from public.artifact_parts
        join public.artifacts on artifacts.id = artifact_parts.artifact_id
        where artifact_parts.storage_path = storage.objects.name
          and artifacts.status = 'approved'
      )
    )
  );

-- Owner delete protection recognizes any part already attached to an approved artifact.
drop policy if exists "owners delete unapproved media" on storage.objects;
create policy "owners delete unattached or unapproved artifact media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'artifact-media'
    and split_part(name, '/', 1) = auth.uid()::text
    and not exists (
      select 1
      from public.artifact_parts
      join public.artifacts on artifacts.id = artifact_parts.artifact_id
      where artifact_parts.storage_path = storage.objects.name
        and artifacts.status = 'approved'
    )
    and not exists (
      select 1
      from public.artifacts
      where artifacts.media_path = storage.objects.name
        and artifacts.status = 'approved'
    )
  );

create or replace view public.orphaned_artifact_media as
select
  objects.name as media_path,
  objects.created_at,
  objects.metadata
from storage.objects as objects
left join public.artifacts
  on artifacts.media_path = objects.name
left join public.artifact_parts
  on artifact_parts.storage_path = objects.name
where objects.bucket_id = 'artifact-media'
  and artifacts.id is null
  and artifact_parts.id is null
  and objects.created_at < now() - interval '1 hour';

revoke all on public.orphaned_artifact_media from anon, authenticated;

commit;
