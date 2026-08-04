-- AETIMM / SLOP TROUGH social beta foundation
-- Run in a dedicated Supabase project before enabling real multi-user mode.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.artifacts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  summary text not null check (char_length(summary) between 10 and 600),
  origin_class text not null check (
    origin_class in (
      'human_ai_hybrid',
      'ai_directed',
      'autonomous_ai_run',
      'ai_origin_unverified'
    )
  ),
  generator text not null check (char_length(generator) between 2 and 120),
  human_role text not null check (char_length(human_role) between 15 and 800),
  provenance_note text not null check (char_length(provenance_note) between 30 and 1600),
  media_path text not null unique,
  media_type text not null check (media_type in ('image')),
  status text not null default 'quarantine' check (
    status in ('quarantine', 'approved', 'rejected', 'removed')
  ),
  lane text check (lane in ('aetimm', 'slatra', 'unjudged')),
  ai_origin_attested boolean not null default false,
  safety_attested boolean not null default false,
  rights_attested boolean not null default false,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  constraint publication_state_consistent check (
    (status = 'approved' and published_at is not null and lane is not null)
    or
    (status <> 'approved' and published_at is null)
  ),
  constraint attestations_required check (
    ai_origin_attested and safety_attested and rights_attested
  )
);

create table if not exists public.artifact_votes (
  artifact_id uuid not null references public.artifacts(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  judgment text not null check (judgment in ('preserve', 'refine', 'slop')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (artifact_id, voter_id)
);

create table if not exists public.moderation_events (
  id bigint generated always as identity primary key,
  artifact_id uuid not null references public.artifacts(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  decision text not null check (decision in ('approve', 'reject', 'remove', 'restore')),
  lane text check (lane in ('aetimm', 'slatra', 'unjudged')),
  note text not null check (char_length(note) between 3 and 1200),
  created_at timestamptz not null default now()
);

create index if not exists artifacts_public_feed_idx
  on public.artifacts (status, published_at desc, id desc);

create index if not exists artifacts_creator_idx
  on public.artifacts (creator_id, created_at desc);

create index if not exists votes_artifact_idx
  on public.artifact_votes (artifact_id, judgment);

alter table public.profiles enable row level security;
alter table public.artifacts enable row level security;
alter table public.artifact_votes enable row level security;
alter table public.moderation_events enable row level security;

-- Profiles are public identities; only their owners may create or edit them.
create policy "profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "users create their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Public users see only approved artifacts. Creators can also see their own queue.
create policy "approved artifacts are public"
  on public.artifacts for select
  using (status = 'approved' or auth.uid() = creator_id);

create policy "users submit only to quarantine"
  on public.artifacts for insert
  to authenticated
  with check (
    auth.uid() = creator_id
    and status = 'quarantine'
    and lane is null
    and published_at is null
  );

create policy "creators edit only quarantined submissions"
  on public.artifacts for update
  to authenticated
  using (auth.uid() = creator_id and status = 'quarantine')
  with check (
    auth.uid() = creator_id
    and status = 'quarantine'
    and lane is null
    and published_at is null
  );

-- Vote records are visible for aggregation. Each account controls only its own vote.
create policy "votes are publicly readable"
  on public.artifact_votes for select
  using (true);

create policy "users vote on approved artifacts"
  on public.artifact_votes for insert
  to authenticated
  with check (
    auth.uid() = voter_id
    and exists (
      select 1 from public.artifacts
      where artifacts.id = artifact_votes.artifact_id
        and artifacts.status = 'approved'
    )
  );

create policy "users replace their own vote"
  on public.artifact_votes for update
  to authenticated
  using (auth.uid() = voter_id)
  with check (
    auth.uid() = voter_id
    and exists (
      select 1 from public.artifacts
      where artifacts.id = artifact_votes.artifact_id
        and artifacts.status = 'approved'
    )
  );

create policy "users delete their own vote"
  on public.artifact_votes for delete
  to authenticated
  using (auth.uid() = voter_id);

-- Moderation has no client policies. Trusted server/service-role operations perform it.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artifact-media',
  'artifact-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "users upload into their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'artifact-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners and public approved artifacts can read media"
  on storage.objects for select
  using (
    bucket_id = 'artifact-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.artifacts
        where artifacts.media_path = storage.objects.name
          and artifacts.status = 'approved'
      )
    )
  );

create policy "owners delete unapproved media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'artifact-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not exists (
      select 1 from public.artifacts
      where artifacts.media_path = storage.objects.name
        and artifacts.status = 'approved'
    )
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
        split_part(coalesce(new.email, 'anonymous'), '@', 1)
      ),
      40
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

drop trigger if exists votes_touch_updated_at on public.artifact_votes;
create trigger votes_touch_updated_at
  before update on public.artifact_votes
  for each row execute procedure public.touch_updated_at();
