-- Useful admin queries for Supabase SQL Editor

-- 1) Latest submissions
select *
from public.community_join_dashboard
limit 50;

-- 2) Quick totals
select *
from public.community_join_stats
order by metric;

-- 3) Daily trend
select *
from public.community_join_daily_rollup
limit 30;

-- 4) Find duplicate emails
select lower(email) as email, count(*) as submissions
from public.community_join_entries
group by lower(email)
having count(*) > 1
order by submissions desc, email asc;

-- 5) Review only new entries
select *
from public.community_join_dashboard
where status = 'new'
order by created_at desc;

-- 6) Mark an entry as reviewed
-- replace the UUID below before running
-- update public.community_join_entries
-- set status = 'reviewed'
-- where id = '00000000-0000-0000-0000-000000000000';
