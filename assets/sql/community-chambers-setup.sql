-- Run once in the SQL Editor of Community project mzpuuukpqjmxezltekxy.
-- Does not modify existing membership applications or admin tables.
begin;
create table public.community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  created_at timestamptz not null default now()
);
create table public.community_chamber_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.community_profiles(user_id) on delete cascade,
  chamber text not null check (chamber in ('the-circle','reflection-studio','growth-logs')),
  entry_date date not null default current_date,
  title text not null check (char_length(btrim(title)) between 1 and 12000),
  body text not null check (char_length(btrim(body)) between 1 and 12000),
  next_step text not null check (char_length(btrim(next_step)) between 1 and 12000),
  visibility text not null default 'private' check (visibility in ('private','shared')),
  created_at timestamptz not null default now()
);
create index community_entries_owner_chamber on public.community_chamber_entries(user_id,chamber,created_at desc);
create index community_entries_shared_chamber on public.community_chamber_entries(chamber,created_at desc) where visibility='shared';
alter table public.community_profiles enable row level security;
alter table public.community_chamber_entries enable row level security;
revoke all on public.community_profiles, public.community_chamber_entries from anon, authenticated;
grant select,insert,update on public.community_profiles to authenticated;
grant select,insert,update,delete on public.community_chamber_entries to authenticated;
-- Only actual email accounts, not Supabase anonymous sign-ins.
create policy profiles_read on public.community_profiles for select to authenticated
using ((select auth.jwt()->>'email') is not null and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy profiles_insert on public.community_profiles for insert to authenticated
with check ((select auth.uid())=user_id and (select auth.jwt()->>'email') is not null and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy profiles_update on public.community_profiles for update to authenticated
using ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false')
with check ((select auth.uid())=user_id and (select auth.jwt()->>'email') is not null and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy entries_read on public.community_chamber_entries for select to authenticated
using (((select auth.uid())=user_id or visibility='shared') and (select auth.jwt()->>'email') is not null and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy entries_insert on public.community_chamber_entries for insert to authenticated
with check ((select auth.uid())=user_id and (select auth.jwt()->>'email') is not null and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy entries_update on public.community_chamber_entries for update to authenticated
using ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false')
with check ((select auth.uid())=user_id and (select auth.jwt()->>'email') is not null and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
create policy entries_delete on public.community_chamber_entries for delete to authenticated
using ((select auth.uid())=user_id and coalesce((select auth.jwt()->>'is_anonymous'),'false')='false');
commit;
