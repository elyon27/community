-- CrownMind Community: Protected admin auth + policies for Join Circle UI
-- Run AFTER:
--   1) schema-community-join.sql
--   2) schema-community-join-admin.sql

create table if not exists public.community_admins (
  email text primary key,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.community_admins is
'Allowlist of approved admin emails for the CrownMind Community admin UI.';

create or replace function public.is_community_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and a.is_active = true
  );
$$;

revoke all on function public.is_community_admin() from public;
grant execute on function public.is_community_admin() to anon, authenticated;

alter table public.community_admins enable row level security;

-- Only admins can view the allowlist table.
drop policy if exists "Admins can read admin allowlist" on public.community_admins;
create policy "Admins can read admin allowlist"
  on public.community_admins
  for select
  to authenticated
  using (public.is_community_admin());

-- Remove the placeholder optional read policy if you previously enabled it manually.
drop policy if exists "Authenticated users can read join entries" on public.community_join_entries;
drop policy if exists "Admin email can read join entries" on public.community_join_entries;

-- Protected read access for approved admins only.
drop policy if exists "Approved admins can read join entries" on public.community_join_entries;
create policy "Approved admins can read join entries"
  on public.community_join_entries
  for select
  to authenticated
  using (public.is_community_admin());

-- Protected status updates for approved admins only.
drop policy if exists "Approved admins can update join entries" on public.community_join_entries;
create policy "Approved admins can update join entries"
  on public.community_join_entries
  for update
  to authenticated
  using (public.is_community_admin())
  with check (public.is_community_admin());

-- Helpful grants for browser queries.
grant usage on schema public to anon, authenticated;
grant select, update on public.community_join_entries to authenticated;
grant select on public.community_admins to authenticated;

grant select on public.community_join_dashboard to authenticated;
grant select on public.community_join_stats to authenticated;
grant select on public.community_join_daily_rollup to authenticated;

-- Add your real admin email below.
insert into public.community_admins (email)
values ('leuneib01@gmail.com')
on conflict (email) do update set is_active = excluded.is_active;
