-- AETIMM / SLOP TROUGH exposed-function privilege lockdown
-- Apply after 009_universal_artifact_review.sql.
--
-- Supabase projects may carry explicit anon/authenticated EXECUTE grants from
-- earlier defaults or dashboard-created functions. REVOKE FROM PUBLIC alone is
-- not sufficient when those role-specific ACL entries already exist.

begin;

-- Internal trigger helpers are never public RPCs.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.enforce_artifact_intake_limits() from public, anon, authenticated;
revoke all on function public.record_artifact_submission() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;

-- Pin the trigger helper search path so name resolution cannot drift with role
-- or session configuration.
alter function public.touch_updated_at()
  set search_path = public, pg_temp;

-- Authenticated application RPCs: remove every broad/direct grant first, then
-- restore only the signed-in caller surface intentionally used by the client or
-- RLS policies. Function bodies still enforce auth.uid(), ownership and curator
-- role constraints as a second boundary.
revoke all on function public.current_user_is_curator() from public, anon, authenticated;
grant execute on function public.current_user_is_curator() to authenticated;

revoke all on function public.can_accept_artifact_media(text) from public, anon, authenticated;
grant execute on function public.can_accept_artifact_media(text) to authenticated;

revoke all on function public.create_quarantined_artifact(
  uuid,text,text,text,text[],text,text,text,text,boolean,boolean,boolean,jsonb
) from public, anon, authenticated;
grant execute on function public.create_quarantined_artifact(
  uuid,text,text,text,text[],text,text,text,text,boolean,boolean,boolean,jsonb
) to authenticated;

revoke all on function public.resubmit_artifact(uuid) from public, anon, authenticated;
grant execute on function public.resubmit_artifact(uuid) to authenticated;

revoke all on function public.review_artifact(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.review_artifact(uuid,text,text,text) to authenticated;

commit;
