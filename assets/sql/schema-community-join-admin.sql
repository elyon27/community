-- CrownMind Community: Admin dashboard helpers for Join Circle
-- Run this AFTER schema-community-join.sql

-- Helpful normalized admin view
create or replace view public.community_join_dashboard as
select
  id,
  full_name,
  email,
  coalesce(nullif(path, ''), 'Unspecified') as path,
  coalesce(nullif(intention, ''), '—') as intention,
  status,
  source_page,
  created_at,
  created_at::date as submitted_date,
  to_char(created_at at time zone 'Asia/Manila', 'Mon DD, YYYY HH12:MI AM') as submitted_at_manila,
  lower(split_part(email, '@', 2)) as email_domain
from public.community_join_entries
order by created_at desc;

comment on view public.community_join_dashboard is
'Admin-friendly view of CrownMind Join Circle submissions.';

-- Summary view for quick stats in the Supabase SQL editor
create or replace view public.community_join_stats as
select 'total_entries'::text as metric, count(*)::bigint as value from public.community_join_entries
union all
select 'new_entries', count(*)::bigint from public.community_join_entries where status = 'new'
union all
select 'reviewed_entries', count(*)::bigint from public.community_join_entries where status = 'reviewed'
union all
select 'approved_entries', count(*)::bigint from public.community_join_entries where status = 'approved'
union all
select 'archived_entries', count(*)::bigint from public.community_join_entries where status = 'archived'
union all
select 'seekers', count(*)::bigint from public.community_join_entries where lower(coalesce(path, '')) = 'seeker'
union all
select 'walkers', count(*)::bigint from public.community_join_entries where lower(coalesce(path, '')) = 'walker'
union all
select 'watchers', count(*)::bigint from public.community_join_entries where lower(coalesce(path, '')) = 'watcher'
union all
select 'builders', count(*)::bigint from public.community_join_entries where lower(coalesce(path, '')) = 'builder'
union all
select 'aligned', count(*)::bigint from public.community_join_entries where lower(coalesce(path, '')) = 'aligned'
union all
select 'teachers', count(*)::bigint from public.community_join_entries where lower(coalesce(path, '')) = 'teacher';

comment on view public.community_join_stats is
'Quick metric view for total and path/status breakdowns of Join Circle submissions.';

-- Daily rollup view for trends
create or replace view public.community_join_daily_rollup as
select
  created_at::date as submitted_date,
  count(*)::bigint as total_entries,
  count(*) filter (where status = 'new')::bigint as new_entries,
  count(*) filter (where lower(coalesce(path, '')) = 'seeker')::bigint as seekers,
  count(*) filter (where lower(coalesce(path, '')) = 'walker')::bigint as walkers,
  count(*) filter (where lower(coalesce(path, '')) = 'watcher')::bigint as watchers,
  count(*) filter (where lower(coalesce(path, '')) = 'builder')::bigint as builders,
  count(*) filter (where lower(coalesce(path, '')) = 'aligned')::bigint as aligned,
  count(*) filter (where lower(coalesce(path, '')) = 'teacher')::bigint as teachers
from public.community_join_entries
group by created_at::date
order by submitted_date desc;

comment on view public.community_join_daily_rollup is
'Daily Join Circle submission totals with path breakdown.';

-- Optional admin read policy
-- Replace admin@example.com with your actual Supabase auth email later if desired.
-- This is commented out by default to avoid accidentally opening read access.
-- drop policy if exists "Admin email can read join entries" on public.community_join_entries;
-- create policy "Admin email can read join entries"
--   on public.community_join_entries
--   for select
--   to authenticated
--   using (auth.jwt() ->> 'email' in ('admin@example.com'));
