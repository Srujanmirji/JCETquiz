-- ============================================================================
-- 0004_storage.sql — private certificate bucket (docs/SUPABASE.md)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do update set public = false;

-- No policies are granted to anon or authenticated. The bucket is reachable
-- only through the service role, which is how the server signs short-lived
-- download URLs. Students never hold a token that can list or read it.
