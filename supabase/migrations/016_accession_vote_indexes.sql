-- AETIMM launch-path index hardening
-- Apply after 015_museum_accession_lifecycle.sql.
--
-- These indexes cover foreign-key/account paths surfaced by the Supabase
-- performance advisor after the Museum accession fold.

begin;

create index if not exists artifact_votes_voter_id_idx
  on public.artifact_votes (voter_id);

create index if not exists museum_accessions_withdrawn_by_idx
  on public.museum_accessions (withdrawn_by)
  where withdrawn_by is not null;

commit;
