-- CrownMind Community: Join Circle backend for Supabase
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.community_join_entries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  path text,
  intention text,
  source_page text default '06-join-circle.html',
  status text not null default 'new' check (status in ('new', 'reviewed', 'approved', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists idx_community_join_entries_created_at
  on public.community_join_entries (created_at desc);

create index if not exists idx_community_join_entries_email
  on public.community_join_entries (lower(email));

alter table public.community_join_entries enable row level security;

-- Public insert policy for the Join Circle form
-- Safe because browser users can only insert, not read/update/delete.
drop policy if exists "Public can insert join entries" on public.community_join_entries;
create policy "Public can insert join entries"
  on public.community_join_entries
  for insert
  to anon, authenticated
  with check (true);

-- Optional admin read policy (only works once you add authenticated admin users later)
-- Uncomment and adapt if needed.
-- drop policy if exists "Authenticated users can read join entries" on public.community_join_entries;
-- create policy "Authenticated users can read join entries"
--   on public.community_join_entries
--   for select
--   to authenticated
--   using (true);

comment on table public.community_join_entries is 'Entries submitted from the CrownMind Community Join Circle form.';
