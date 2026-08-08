-- AETIMM public-user account simplicity
--
-- Every auth user must get a valid profile without asking for a display name
-- during signup. Derive the initial name from trusted auth metadata/email and
-- normalize it to the existing 2..40 character profile contract.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  initial_name text;
begin
  initial_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Creator'
  );

  initial_name := left(initial_name, 40);
  if char_length(initial_name) < 2 then
    initial_name := left(initial_name || '_', 40);
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, initial_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user()
  from public, anon, authenticated;

commit;
