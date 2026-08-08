-- AETIMM public-user upload continuity
--
-- The storage object cap is intake-pressure protection, not a lifetime creator
-- quota. Valid published history must never permanently lock a creator out of
-- future submission. Keep the existing per-user advisory lock and configured
-- max object count, but count only objects created in the rolling 24-hour
-- intake window. Daily Artifact limits and all per-file/per-Artifact byte caps
-- remain unchanged.

begin;

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

  select count(*)::integer into recent_objects
  from storage.objects
  where bucket_id = 'artifact-media'
    and split_part(name, '/', 1) = current_user_id::text
    and created_at >= now() - interval '24 hours';

  return recent_objects < config.max_storage_objects_per_creator;
end;
$$;

revoke all on function public.can_accept_artifact_media(text)
  from public, anon, authenticated;
grant execute on function public.can_accept_artifact_media(text)
  to authenticated;

commit;
